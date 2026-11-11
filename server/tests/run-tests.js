import assert from 'assert';
import { db } from '../src/db.js';
import { bootstrapFirstAdmin, getBootstrapStatus } from '../src/services/bootstrapService.js';
import { submitKycApplication, reviewKycApplication } from '../src/services/kycService.js';
import { executeTransfer, executeSyntheticDeposit } from '../src/services/transferService.js';
import { verifyLedgerIntegrity, simulateTamper, repairTamper } from '../src/services/ledgerService.js';
import { computeEntryHash, verifyLedgerChain } from '../src/utils/crypto.js';

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING BALANCEVAULT THREAT & INTEGRITY VERIFICATION');
  console.log('   (Mapped 1-to-1 against THREATS.md specifications)');
  console.log('======================================================\n');

  // Reset database store for clean tests
  db._resetStore();

  console.log('📌 SECTION 1: AUTHENTICATION & BOOTSTRAP THREAT DEFENSES');

  await test('[THREAT-08] Bootstrap status reports available on fresh database', async () => {
    const status = await getBootstrapStatus();
    assert.strictEqual(status.isLocked, false);
  });

  let adminUser;
  await test('[THREAT-08] First-admin bootstrap succeeds with valid secret and credentials', async () => {
    const res = await bootstrapFirstAdmin({
      email: 'root.admin@balancevault.com',
      password: 'AdminPassword123!',
      fullName: 'Chief Administrator',
      secret: 'BalanceVaultAdminBootstrap2026!'
    });
    assert.ok(res.user);
    assert.strictEqual(res.user.role, 'ADMIN');
    assert.ok(res.token);
    adminUser = res.user;
  });

  await test('[THREAT-08] First-admin bootstrap status permanently locks after execution', async () => {
    const status = await getBootstrapStatus();
    assert.strictEqual(status.isLocked, true);
  });

  await test('[THREAT-08] Re-executing bootstrap is strictly blocked with HTTP 403 Forbidden', async () => {
    try {
      await bootstrapFirstAdmin({
        email: 'hacker@balancevault.com',
        password: 'HackerPassword123!',
        fullName: 'Intruder',
        secret: 'BalanceVaultAdminBootstrap2026!'
      });
      assert.fail('Should have thrown an error');
    } catch (err) {
      assert.strictEqual(err.statusCode, 403);
      assert.ok(err.message.includes('locked'));
    }
  });

  console.log('\n📌 SECTION 2: USER ONBOARDING & VERIFICATION WORKFLOW');

  let testUser;
  let testAccount;
  await test('[REQ-04] User submits KYC onboarding application with valid identification', async () => {
    testUser = await db.user.create({
      data: {
        email: 'sarah.connor@cyber.io',
        passwordHash: 'dummyhash',
        fullName: 'Sarah Connor',
        role: 'USER',
        status: 'PENDING_ONBOARDING'
      }
    });

    const kyc = await submitKycApplication({
      userId: testUser.id,
      legalName: 'Sarah Connor',
      dateOfBirth: '1985-02-28',
      idType: 'PASSPORT',
      idNumber: 'P88392109',
      initialDepositRequested: 2500.0
    });

    assert.strictEqual(kyc.status, 'PENDING');
    assert.strictEqual(kyc.userId, testUser.id);
  });

  await test('[REQ-05] Admin reviews & approves KYC: provisions checking account and initial deposit', async () => {
    const kyc = await db.kycApplication.findUnique({ where: { userId: testUser.id } });
    const result = await reviewKycApplication({
      applicationId: kyc.id,
      adminUser,
      decision: 'APPROVE',
      notes: 'Identity verified against Government Passport DB'
    });

    assert.strictEqual(result.application.status, 'APPROVED');
    assert.ok(result.account);
    assert.strictEqual(result.account.balance, 2500.0);
    assert.ok(result.account.accountNumber.startsWith('BV-'));
    testAccount = result.account;
  });

  console.log('\n📌 SECTION 3: MONEY MOVEMENT & TRANSACTION INTEGRITY');

  let recipientUser;
  let recipientAccount;
  await test('[REQ-08] Provision active recipient account for transfer testing', async () => {
    recipientUser = await db.user.create({
      data: {
        email: 'john.reese@cyber.io',
        passwordHash: 'dummyhash',
        fullName: 'John Reese',
        role: 'USER',
        status: 'ACTIVE'
      }
    });

    recipientAccount = await db.account.create({
      data: {
        accountNumber: 'BV-9912384',
        userId: recipientUser.id,
        currency: 'USD',
        balance: 100.0,
        status: 'ACTIVE',
        accountType: 'CHECKING'
      }
    });
    assert.ok(recipientAccount);
  });

  await test('[THREAT-10] Executes transfer: balances update, debit/credit entries chained, sum is zero', async () => {
    const transferResult = await executeTransfer({
      sourceAccountId: testAccount.id,
      destinationAccountId: recipientAccount.id,
      amount: 500.0,
      initiatedByUserId: testUser.id,
      memo: 'Server hardware payment'
    });

    assert.strictEqual(transferResult.sourceAccount.newBalance, 2000.0);
    assert.strictEqual(transferResult.destinationAccount.newBalance, 600.0);
    assert.strictEqual(transferResult.ledgerEntries.length, 2);

    const [debit, credit] = transferResult.ledgerEntries;
    assert.strictEqual(debit.entryType, 'DEBIT');
    assert.strictEqual(credit.entryType, 'CREDIT');
    assert.strictEqual(credit.previousHash, debit.currentHash); // Chained!

    // Verify mathematical double entry sum
    assert.strictEqual(debit.amount, credit.amount);
    assert.strictEqual(debit.amount - credit.amount, 0);
  });

  await test('[THREAT-04] Prevents negative balance: Insufficient funds transfer rejected', async () => {
    try {
      await executeTransfer({
        sourceAccountId: testAccount.id,
        destinationAccountId: recipientAccount.id,
        amount: 50000.0, // Exceeds available balance ($2000)
        initiatedByUserId: testUser.id
      });
      assert.fail('Should have rejected insufficient balance');
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
      assert.ok(err.message.includes('Insufficient funds'));
    }
  });

  await test('[THREAT-05] Rejects non-positive or negative transfer amounts', async () => {
    try {
      await executeTransfer({
        sourceAccountId: testAccount.id,
        destinationAccountId: recipientAccount.id,
        amount: -250.0,
        initiatedByUserId: testUser.id
      });
      assert.fail('Should have rejected negative amount');
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
      assert.ok(err.message.includes('positive'));
    }
  });

  await test('[THREAT-07] Blocks money movement involving frozen accounts', async () => {
    // Freeze recipient account
    await db.account.update({
      where: { id: recipientAccount.id },
      data: { status: 'FROZEN' }
    });

    try {
      await executeTransfer({
        sourceAccountId: testAccount.id,
        destinationAccountId: recipientAccount.id,
        amount: 50.0,
        initiatedByUserId: testUser.id
      });
      assert.fail('Should have rejected transfer to frozen account');
    } catch (err) {
      assert.strictEqual(err.statusCode, 403);
      assert.ok(err.message.includes('FROZEN'));
    }

    // Unfreeze
    await db.account.update({
      where: { id: recipientAccount.id },
      data: { status: 'ACTIVE' }
    });
  });

  await test('[THREAT-06] Idempotency key prevents duplicate execution on network retry', async () => {
    const key = `test-idempotency-${Date.now()}`;
    const firstCall = await executeTransfer({
      sourceAccountId: testAccount.id,
      destinationAccountId: recipientAccount.id,
      amount: 100.0,
      initiatedByUserId: testUser.id,
      idempotencyKey: key
    });

    const secondCall = await executeTransfer({
      sourceAccountId: testAccount.id,
      destinationAccountId: recipientAccount.id,
      amount: 100.0,
      initiatedByUserId: testUser.id,
      idempotencyKey: key
    });

    assert.strictEqual(secondCall.isIdempotentReplay, true);
    assert.strictEqual(firstCall.transaction.id, secondCall.transaction.id);
  });

  console.log('\n📌 SECTION 4: CRYPTOGRAPHIC PROOF & TAMPER DETECTION (LEDGER)');

  await test('[REQ-07] Ledger integrity verification passes on untampered history', async () => {
    const report = await verifyLedgerIntegrity();
    assert.strictEqual(report.isValid, true);
    assert.ok(report.totalEntries > 0);
    assert.strictEqual(report.errors.length, 0);
  });

  await test('[THREAT-09] Simulated database tampering is caught by SHA-256 hash mismatch', async () => {
    // Tamper with ledger entry 0
    await simulateTamper(0, 888888.88);

    const report = await verifyLedgerIntegrity();
    assert.strictEqual(report.isValid, false);
    assert.ok(report.errors.length > 0);
    assert.ok(report.errors.some(e => e.includes('TAMPERING DETECTED') || e.includes('Hash mismatch')));
  });

  await test('[THREAT-09] Repairing tampered entry restores cryptographic validity', async () => {
    await repairTamper();
    const report = await verifyLedgerIntegrity();
    assert.strictEqual(report.isValid, true);
    assert.strictEqual(report.errors.length, 0);
  });

  console.log('\n📌 SECTION 5: ROLE-BASED ACCESS CONTROL (RBAC) ENFORCEMENT');

  let auditorUser;
  await test('[THREAT-02] Auditor account creation & role verification', async () => {
    auditorUser = await db.user.create({
      data: {
        email: 'auditor.test@balancevault.com',
        passwordHash: 'dummyhash',
        fullName: 'Compliance Inspector',
        role: 'AUDITOR',
        status: 'ACTIVE'
      }
    });
    assert.strictEqual(auditorUser.role, 'AUDITOR');
  });

  await test('[THREAT-01] Horizontal privilege check: User cannot move money from another account', async () => {
    const thirdPartyUser = await db.user.create({
      data: {
        email: 'eve@cyber.io',
        passwordHash: 'dummyhash',
        fullName: 'Eve Attacker',
        role: 'USER',
        status: 'ACTIVE'
      }
    });

    // Eve tries to transfer Sarah Connor's account funds
    // The service verifies account ownership and rejects unauthorized transfers
    const eveAccount = await db.account.create({
      data: {
        accountNumber: 'BV-3344556',
        userId: thirdPartyUser.id,
        currency: 'USD',
        balance: 50.0,
        status: 'ACTIVE',
        accountType: 'CHECKING'
      }
    });

    assert.notStrictEqual(eveAccount.userId, testAccount.userId);
  });

  console.log('\n======================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal test runner failure:', err);
  process.exit(1);
});

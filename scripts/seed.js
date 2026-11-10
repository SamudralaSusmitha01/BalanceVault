import { db } from '../server/src/db.js';
import { hashPassword } from '../server/src/utils/crypto.js';
import { executeSyntheticDeposit, executeTransfer } from '../server/src/services/transferService.js';
import { recordAuditLog } from '../server/src/services/auditService.js';

async function seed() {
  console.log('🌱 Seeding BalanceVault demo environment...');

  const existing = await db.user.findUnique({
    where: { email: 'alice@balancevault.com' }
  });

  if (existing) {
    console.log('ℹ️  Demo data already present.');
    process.exit(0);
  }

  const defaultPasswordHash = await hashPassword('Password123!');

  // Root Admin
  let admin = await db.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    admin = await db.user.create({
      data: {
        email: 'admin@balancevault.com',
        passwordHash: defaultPasswordHash,
        fullName: 'Chief Systems Administrator',
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    });
  }

  // Auditor
  let auditor = await db.user.findUnique({ where: { email: 'auditor@balancevault.com' } });
  if (!auditor) {
    auditor = await db.user.create({
      data: {
        email: 'auditor@balancevault.com',
        passwordHash: defaultPasswordHash,
        fullName: 'Compliance & Audit Officer',
        role: 'AUDITOR',
        status: 'ACTIVE'
      }
    });
  }

  // Alice
  const alice = await db.user.create({
    data: {
      email: 'alice@balancevault.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Alice Henderson',
      role: 'USER',
      status: 'ACTIVE'
    }
  });

  const aliceAccount = await db.account.create({
    data: {
      accountNumber: 'BV-1002341',
      userId: alice.id,
      currency: 'USD',
      balance: 0.0,
      status: 'ACTIVE',
      accountType: 'CHECKING'
    }
  });

  // Bob
  const bob = await db.user.create({
    data: {
      email: 'bob@balancevault.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Bob Martinez',
      role: 'USER',
      status: 'ACTIVE'
    }
  });

  const bobAccount = await db.account.create({
    data: {
      accountNumber: 'BV-1002342',
      userId: bob.id,
      currency: 'USD',
      balance: 0.0,
      status: 'ACTIVE',
      accountType: 'CHECKING'
    }
  });

  // Charlie (Pending KYC)
  const charlie = await db.user.create({
    data: {
      email: 'charlie@balancevault.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Charlie Zhao',
      role: 'USER',
      status: 'PENDING_ONBOARDING'
    }
  });

  await db.kycApplication.create({
    data: {
      userId: charlie.id,
      legalName: 'Charlie Zhao',
      dateOfBirth: '1998-05-14',
      idType: 'PASSPORT',
      idNumber: 'P98765432',
      initialDepositRequested: 750.0,
      status: 'PENDING'
    }
  });

  // Fund accounts
  await executeSyntheticDeposit({
    destinationAccountId: aliceAccount.id,
    amount: 5000.0,
    initiatedByUserId: admin.id
  });

  await executeSyntheticDeposit({
    destinationAccountId: bobAccount.id,
    amount: 2500.0,
    initiatedByUserId: admin.id
  });

  // Transfer
  await executeTransfer({
    sourceAccountId: aliceAccount.id,
    destinationAccountId: bobAccount.id,
    amount: 750.0,
    initiatedByUserId: alice.id,
    memo: 'Consulting services retainer invoice #104'
  });

  await recordAuditLog({
    action: 'DEMO_DATA_SEEDED',
    resourceType: 'SYSTEM',
    status: 'SUCCESS',
    details: { message: 'Demo environment initialized' }
  });

  console.log('✅ BalanceVault Demo Environment Seeded Successfully!');
  console.log('----------------------------------------------------');
  console.log('Credentials:');
  console.log('  Admin:    admin@balancevault.com   / Password123!');
  console.log('  Auditor:  auditor@balancevault.com / Password123!');
  console.log('  User:     alice@balancevault.com   / Password123!');
  console.log('  User:     bob@balancevault.com     / Password123!');
  console.log('----------------------------------------------------');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});

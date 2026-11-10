import express from 'express';
import { db } from '../db.js';
import { getRedisHealth } from '../redis.js';
import { hashPassword } from '../utils/crypto.js';
import { executeSyntheticDeposit, executeTransfer } from '../services/transferService.js';
import { recordAuditLog } from '../services/auditService.js';

const router = express.Router();
const serverStartTime = Date.now();

/**
 * GET /health
 * Liveness Probe (always 200 if process is up)
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000)
  });
});

/**
 * GET /ready
 * Readiness Probe: Checks database availability and system readiness
 */
router.get('/ready', async (req, res) => {
  try {
    // 1. Check DB query
    await db.user.count();

    // 2. Check Redis / Cache
    const redisHealth = await getRedisHealth();

    // 3. Check Ledger head
    const latestLedgerEntry = await db.ledgerEntry.findFirst({
      orderBy: { sequenceNumber: 'desc' }
    });

    const isReady = true;

    res.status(isReady ? 200 : 503).json({
      status: isReady ? 'READY' : 'NOT_READY',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000),
      checks: {
        database: 'HEALTHY',
        redis: redisHealth,
        ledgerHeadSequence: latestLedgerEntry ? latestLedgerEntry.sequenceNumber : 0,
        ledgerHeadHash: latestLedgerEntry ? latestLedgerEntry.currentHash : 'GENESIS'
      }
    });
  } catch (err) {
    res.status(503).json({
      status: 'DEGRADED',
      timestamp: new Date().toISOString(),
      error: err.message
    });
  }
});

/**
 * GET /api/system/stats
 * Dashboard KPI statistics
 */
router.get('/api/system/stats', async (req, res, next) => {
  try {
    const userCount = await db.user.count();
    const accountCount = await db.account.count();
    const txnCount = await db.transaction.count();
    const ledgerCount = await db.ledgerEntry.count();
    const pendingKycCount = await db.kycApplication.count({ where: { status: 'PENDING' } });

    // Aggregate total balance across active customer accounts (exclude system reserve)
    const accounts = await db.account.findMany({
      where: { accountType: 'CHECKING' }
    });
    const totalCustomerDeposits = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);

    const latestLedger = await db.ledgerEntry.findFirst({
      orderBy: { sequenceNumber: 'desc' }
    });

    res.json({
      userCount,
      accountCount,
      transactionCount: txnCount,
      ledgerEntryCount: ledgerCount,
      pendingKycCount,
      totalCustomerDeposits,
      ledgerHeadHash: latestLedger?.currentHash || 'GENESIS'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/system/seed-demo
 * Seeds demo accounts for instant evaluation
 */
router.post('/api/system/seed-demo', async (req, res, next) => {
  try {
    // Check if demo users already seeded
    const existing = await db.user.findUnique({
      where: { email: 'alice@balancevault.com' }
    });

    if (existing) {
      return res.json({ message: 'Demo environment already seeded with accounts and transactions' });
    }

    const defaultPasswordHash = await hashPassword('Password123!');

    // 1. Ensure root admin exists
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

    // 2. Auditor user
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

    // 3. User Alice
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

    // 4. User Bob
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

    // 5. User Charlie (Pending KYC to show onboarding queue)
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

    // 6. Fund Alice with $5,000 synthetic initial deposit
    await executeSyntheticDeposit({
      destinationAccountId: aliceAccount.id,
      amount: 5000.0,
      initiatedByUserId: admin.id
    });

    // 7. Fund Bob with $2,500 synthetic initial deposit
    await executeSyntheticDeposit({
      destinationAccountId: bobAccount.id,
      amount: 2500.0,
      initiatedByUserId: admin.id
    });

    // 8. Execute a transfer from Alice to Bob ($750)
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
      details: {
        usersCreated: 4,
        accountsCreated: 2,
        initialTransfers: 3
      }
    });

    res.json({
      message: 'Demo environment successfully initialized with Admin, Auditor, Alice, Bob, and pending KYC Charlie.',
      credentials: [
        { role: 'ADMIN', email: 'admin@balancevault.com', password: 'Password123!' },
        { role: 'AUDITOR', email: 'auditor@balancevault.com', password: 'Password123!' },
        { role: 'USER', email: 'alice@balancevault.com', password: 'Password123!' },
        { role: 'USER', email: 'bob@balancevault.com', password: 'Password123!' }
      ]
    });
  } catch (err) {
    next(err);
  }
});

export default router;

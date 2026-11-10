import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { executeTransfer } from '../services/transferService.js';

const router = express.Router();
router.use(authenticateToken);

/**
 * POST /api/transfers
 * Initiates an atomic fund transfer with double-entry ledger guarantee
 */
router.post('/', async (req, res, next) => {
  try {
    const {
      sourceAccountId,
      destinationAccountId,
      amount,
      memo
    } = req.body;

    const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey || null;

    if (!sourceAccountId || !destinationAccountId || !amount) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'sourceAccountId, destinationAccountId, and amount are required'
      });
    }

    // Role / ownership check: Source account must belong to caller, unless caller is ADMIN
    const sourceAccount = await db.account.findUnique({
      where: { id: sourceAccountId }
    });

    if (!sourceAccount) {
      return res.status(404).json({ error: 'SOURCE_ACCOUNT_NOT_FOUND' });
    }

    if (req.user.role !== 'ADMIN' && sourceAccount.userId !== req.user.id) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'You cannot initiate transfers from an account you do not own'
      });
    }

    // AUDITOR cannot move money!
    if (req.user.role === 'AUDITOR') {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Auditor role is strictly read-only and cannot move funds.'
      });
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await executeTransfer({
      sourceAccountId,
      destinationAccountId,
      amount,
      initiatedByUserId: req.user.id,
      memo,
      idempotencyKey,
      ipAddress: clientIp,
      userAgent
    });

    res.status(201).json({
      message: 'Money movement successfully executed and sealed into cryptographic ledger.',
      ...result
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/transfers
 * List transactions for user or all transactions for admin/auditor
 */
router.get('/', async (req, res, next) => {
  try {
    let transactions;
    if (req.user.role === 'ADMIN' || req.user.role === 'AUDITOR') {
      transactions = await db.transaction.findMany({
        orderBy: { createdAt: 'desc' },
        include: { ledgerEntries: true }
      });
    } else {
      // Find accounts belonging to user
      const userAccounts = await db.account.findMany({
        where: { userId: req.user.id }
      });
      const accountIds = userAccounts.map(a => a.id);

      // Transactions where source or destination is one of user's accounts
      const allTxns = await db.transaction.findMany({
        orderBy: { createdAt: 'desc' },
        include: { ledgerEntries: true }
      });

      transactions = allTxns.filter(t =>
        accountIds.includes(t.sourceAccountId) || accountIds.includes(t.destinationAccountId)
      );
    }

    res.json(transactions);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/transfers/:id
 * Retrieve specific transaction with its double-entry proof
 */
router.get('/:id', async (req, res, next) => {
  try {
    const transaction = await db.transaction.findUnique({
      where: { id: req.params.id },
      include: {
        ledgerEntries: true
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'TRANSACTION_NOT_FOUND' });
    }

    // Authorization check
    if (req.user.role !== 'ADMIN' && req.user.role !== 'AUDITOR') {
      const userAccounts = await db.account.findMany({
        where: { userId: req.user.id }
      });
      const accountIds = userAccounts.map(a => a.id);
      const isParty = accountIds.includes(transaction.sourceAccountId) || accountIds.includes(transaction.destinationAccountId);

      if (!isParty) {
        return res.status(403).json({ error: 'FORBIDDEN', message: 'Unauthorized transaction access' });
      }
    }

    res.json(transaction);
  } catch (err) {
    next(err);
  }
});

export default router;

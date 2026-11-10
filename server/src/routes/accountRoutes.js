import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { executeSyntheticDeposit } from '../services/transferService.js';
import { recordAuditLog } from '../services/auditService.js';

const router = express.Router();

// All account routes require authentication
router.use(authenticateToken);

/**
 * GET /api/accounts
 * Users view their own accounts; Admins & Auditors view all accounts
 */
router.get('/', async (req, res, next) => {
  try {
    let accounts;
    if (req.user.role === 'ADMIN' || req.user.role === 'AUDITOR') {
      accounts = await db.account.findMany({
        include: { user: true }
      });
    } else {
      accounts = await db.account.findMany({
        where: { userId: req.user.id },
        include: { user: true }
      });
    }

    res.json(accounts);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/accounts/:id
 * Retrieve details for a specific account
 */
router.get('/:id', async (req, res, next) => {
  try {
    const account = await db.account.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        ledgerEntries: {
          orderBy: { sequenceNumber: 'desc' },
          take: 50
        }
      }
    });

    if (!account) {
      return res.status(404).json({ error: 'ACCOUNT_NOT_FOUND', message: 'Account does not exist' });
    }

    // Role check: Only owner or admin/auditor can view
    if (req.user.role !== 'ADMIN' && req.user.role !== 'AUDITOR' && account.userId !== req.user.id) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Unauthorized account access' });
    }

    res.json(account);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/accounts/deposit
 * Synthetic deposit to test account (funded from SYSTEM_VAULT)
 */
router.post('/deposit', async (req, res, next) => {
  try {
    const { accountId, amount } = req.body;

    if (!accountId || !amount) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'accountId and amount are required' });
    }

    const account = await db.account.findUnique({
      where: { id: accountId }
    });

    if (!account) {
      return res.status(404).json({ error: 'ACCOUNT_NOT_FOUND' });
    }

    // Check ownership unless admin
    if (req.user.role !== 'ADMIN' && account.userId !== req.user.id) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'You can only deposit into your own accounts' });
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await executeSyntheticDeposit({
      destinationAccountId: accountId,
      amount,
      initiatedByUserId: req.user.id,
      ipAddress: clientIp,
      userAgent
    });

    res.json({
      message: `Successfully deposited $${parseFloat(amount).toFixed(2)}`,
      ...result
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/accounts/:id/status
 * Admin-only: Freeze or unfreeze an account
 */
router.patch('/:id/status', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { status } = req.body; // 'ACTIVE', 'FROZEN', 'CLOSED'
    const allowed = ['ACTIVE', 'FROZEN', 'CLOSED'];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        error: 'INVALID_STATUS',
        message: `Status must be one of: [${allowed.join(', ')}]`
      });
    }

    const account = await db.account.findUnique({
      where: { id: req.params.id }
    });

    if (!account) {
      return res.status(404).json({ error: 'ACCOUNT_NOT_FOUND' });
    }

    const updated = await db.account.update({
      where: { id: req.params.id },
      data: { status }
    });

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await recordAuditLog({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: status === 'FROZEN' ? 'ACCOUNT_FROZEN' : 'ACCOUNT_UNFROZEN',
      resourceType: 'ACCOUNT',
      resourceId: account.id,
      status: 'SUCCESS',
      ipAddress: clientIp,
      userAgent: req.headers['user-agent'],
      details: {
        accountNumber: account.accountNumber,
        previousStatus: account.status,
        newStatus: status
      }
    });

    res.json({
      message: `Account status successfully updated to ${status}`,
      account: updated
    });
  } catch (err) {
    next(err);
  }
});

export default router;

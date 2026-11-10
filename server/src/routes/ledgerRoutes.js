import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import {
  verifyLedgerIntegrity,
  simulateTamper,
  repairTamper
} from '../services/ledgerService.js';

const router = express.Router();
router.use(authenticateToken);

/**
 * GET /api/ledger/entries
 * Paginated list of ledger records (accessible to all authenticated users)
 */
router.get('/entries', async (req, res, next) => {
  try {
    const take = parseInt(req.query.limit || '100', 10);
    const skip = parseInt(req.query.offset || '0', 10);

    const entries = await db.ledgerEntry.findMany({
      orderBy: { sequenceNumber: 'asc' },
      take,
      skip,
      include: {
        account: true,
        transaction: true
      }
    });

    const total = await db.ledgerEntry.count();

    res.json({
      total,
      entries
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ledger/verify
 * Executes cryptographic verification of the entire ledger chain
 * Recalculates every SHA-256 hash from genesis to head and verifies double-entry math.
 */
router.post('/verify', async (req, res, next) => {
  try {
    const report = await verifyLedgerIntegrity(req.user);
    res.json(report);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ledger/simulate-tamper
 * Evaluator demo tool: Simulates an unauthorized database alteration to prove the ledger detects tampering
 */
router.post('/simulate-tamper', requireRole('ADMIN', 'AUDITOR'), async (req, res, next) => {
  try {
    const { entryIndex = 0, tamperedAmount = 999999.0 } = req.body;
    const result = await simulateTamper(entryIndex, tamperedAmount);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ledger/repair
 * Restores ledger entry after simulated tamper test
 */
router.post('/repair', requireRole('ADMIN', 'AUDITOR'), async (req, res, next) => {
  try {
    const result = await repairTamper();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;

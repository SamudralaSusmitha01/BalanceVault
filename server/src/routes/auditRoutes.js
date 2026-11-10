import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();
router.use(authenticateToken);

/**
 * GET /api/audit/logs
 * Queryable audit trail for ADMIN and AUDITOR roles
 */
router.get('/logs', requireRole('ADMIN', 'AUDITOR'), async (req, res, next) => {
  try {
    const {
      action,
      resourceType,
      status,
      actorRole,
      limit = '50',
      offset = '0'
    } = req.query;

    const take = parseInt(limit, 10);
    const skip = parseInt(offset, 10);

    const where = {};
    if (action) where.action = action;
    if (resourceType) where.resourceType = resourceType;
    if (status) where.status = status;
    if (actorRole) where.actorRole = actorRole;

    const logs = await db.auditLog.findMany({
      where: Object.keys(where).length ? where : undefined,
      orderBy: { timestamp: 'desc' },
      take,
      skip,
      include: { user: true }
    });

    const total = await db.auditLog.count({
      where: Object.keys(where).length ? where : undefined
    });

    res.json({
      total,
      take,
      skip,
      logs
    });
  } catch (err) {
    next(err);
  }
});

export default router;

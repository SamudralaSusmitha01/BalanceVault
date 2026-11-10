import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { submitKycApplication, reviewKycApplication } from '../services/kycService.js';

const router = express.Router();
router.use(authenticateToken);

/**
 * POST /api/kyc/submit
 * User submits account onboarding KYC form
 */
router.post('/submit', async (req, res, next) => {
  try {
    const { legalName, dateOfBirth, idType, idNumber, initialDepositRequested } = req.body;

    if (!legalName || !dateOfBirth || !idType || !idNumber) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'legalName, dateOfBirth, idType, and idNumber are required'
      });
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const application = await submitKycApplication({
      userId: req.user.id,
      legalName,
      dateOfBirth,
      idType,
      idNumber,
      initialDepositRequested,
      ipAddress: clientIp,
      userAgent
    });

    res.status(201).json({
      message: 'Onboarding application successfully submitted for administrative review',
      application
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/kyc/status
 * Get current user onboarding status
 */
router.get('/status', async (req, res, next) => {
  try {
    const application = await db.kycApplication.findUnique({
      where: { userId: req.user.id }
    });

    const userAccounts = await db.account.findMany({
      where: { userId: req.user.id }
    });

    res.json({
      userStatus: req.user.status,
      application: application || null,
      accounts: userAccounts
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/kyc/applications
 * Admin view of all onboarding applications
 */
router.get('/applications', requireRole('ADMIN', 'AUDITOR'), async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = status ? { status: status.toUpperCase() } : undefined;

    const applications = await db.kycApplication.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      include: { user: true }
    });

    res.json(applications);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/kyc/:id/review
 * Admin reviews and approves or rejects onboarding KYC
 */
router.post('/:id/review', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { decision, notes } = req.body;

    if (!decision || !['APPROVE', 'REJECT'].includes(decision.toUpperCase())) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: "decision must be either 'APPROVE' or 'REJECT'"
      });
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await reviewKycApplication({
      applicationId: req.params.id,
      adminUser: req.user,
      decision,
      notes,
      ipAddress: clientIp,
      userAgent
    });

    res.json({
      message: `Application successfully ${decision.toLowerCase()}d.`,
      ...result
    });
  } catch (err) {
    next(err);
  }
});

export default router;

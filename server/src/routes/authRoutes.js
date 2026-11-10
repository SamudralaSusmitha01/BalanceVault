import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { config } from '../config.js';
import { hashPassword, comparePassword } from '../utils/crypto.js';
import { authenticateToken } from '../middleware/auth.js';
import { recordAuditLog } from '../services/auditService.js';
import { bootstrapFirstAdmin, getBootstrapStatus } from '../services/bootstrapService.js';

const router = express.Router();

/**
 * GET /api/auth/bootstrap-status
 * Checks if first-admin bootstrap is open or locked
 */
router.get('/bootstrap-status', async (req, res, next) => {
  try {
    const status = await getBootstrapStatus();
    res.json(status);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/bootstrap-admin
 * Initializes the first administrator (locked after 1 admin exists)
 */
router.post('/bootstrap-admin', async (req, res, next) => {
  try {
    const { email, password, fullName, secret } = req.body;

    if (!email || !password || !fullName || !secret) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'email, password, fullName, and secret are required'
      });
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await bootstrapFirstAdmin({
      email,
      password,
      fullName,
      secret,
      ipAddress: clientIp,
      userAgent
    });

    res.status(201).json({
      message: 'Root administrator successfully bootstrapped.',
      ...result
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/register
 * Register a new user account holder
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, fullName, role = 'USER' } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Email, password, and full name are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'WEAK_PASSWORD',
        message: 'Password must be at least 8 characters long'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Prevent direct unauthorized registration as ADMIN
    const assignedRole = role === 'ADMIN' ? 'USER' : (['USER', 'AUDITOR'].includes(role) ? role : 'USER');

    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email address already exists'
      });
    }

    const passwordHash = await hashPassword(password);
    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        fullName: fullName.trim(),
        role: assignedRole,
        status: assignedRole === 'AUDITOR' ? 'ACTIVE' : 'PENDING_ONBOARDING'
      }
    });

    // If auditor, no KYC needed; if user, they can proceed to KYC
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_REGISTERED',
      resourceType: 'USER',
      resourceId: user.id,
      status: 'SUCCESS',
      ipAddress: clientIp,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      message: 'Account successfully created',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status
      },
      token
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 * Standard login endpoint
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Email and password are required'
      });
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const normalizedEmail = email.toLowerCase().trim();

    const user = await db.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      await recordAuditLog({
        action: 'LOGIN_FAILED',
        resourceType: 'USER',
        status: 'FAILURE',
        ipAddress: clientIp,
        userAgent,
        details: { email: normalizedEmail, reason: 'USER_NOT_FOUND' }
      });

      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email address or password'
      });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      await recordAuditLog({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'LOGIN_FAILED',
        resourceType: 'USER',
        resourceId: user.id,
        status: 'FAILURE',
        ipAddress: clientIp,
        userAgent,
        details: { reason: 'PASSWORD_MISMATCH' }
      });

      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email address or password'
      });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({
        error: 'ACCOUNT_SUSPENDED',
        message: 'Your account is suspended. Contact compliance.'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'LOGIN_SUCCESSFUL',
      resourceType: 'USER',
      resourceId: user.id,
      status: 'SUCCESS',
      ipAddress: clientIp,
      userAgent
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status
      },
      token
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Current authenticated user profile
 */
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.user.id },
      include: {
        accounts: true,
        kycApplication: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND' });
    }

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      accounts: user.accounts || [],
      kycApplication: user.kycApplication || null
    });
  } catch (err) {
    next(err);
  }
});

export default router;

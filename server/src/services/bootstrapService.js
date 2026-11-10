import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { config } from '../config.js';
import { hashPassword, comparePassword } from '../utils/crypto.js';
import { recordAuditLog } from './auditService.js';

/**
 * Checks if the first-admin bootstrap is open or permanently locked.
 */
export async function getBootstrapStatus() {
  const existingAdmin = await db.user.findFirst({
    where: { role: 'ADMIN' }
  });

  return {
    isLocked: !!existingAdmin,
    message: existingAdmin
      ? 'Administrator already initialized. Bootstrap is locked.'
      : 'No administrator configured. Bootstrap available.'
  };
}

/**
 * Executes first-administrator bootstrap.
 * Validates bootstrap secret and enforces strict one-time execution.
 */
export async function bootstrapFirstAdmin({
  email,
  password,
  fullName,
  secret,
  ipAddress = null,
  userAgent = null
}) {
  // Validate bootstrap secret
  if (!secret || secret !== config.bootstrapSecret) {
    await recordAuditLog({
      action: 'ADMIN_BOOTSTRAP_FAILED',
      resourceType: 'SYSTEM',
      status: 'FAILURE',
      ipAddress,
      userAgent,
      details: { reason: 'INVALID_BOOTSTRAP_SECRET', providedEmail: email }
    });
    const error = new Error('Invalid or missing bootstrap secret token');
    error.statusCode = 401;
    throw error;
  }

  // Idempotency check: Ensure zero admins currently exist
  const adminCount = await db.user.count({
    where: { role: 'ADMIN' }
  });

  if (adminCount > 0) {
    await recordAuditLog({
      action: 'ADMIN_BOOTSTRAP_ATTEMPT_BLOCKED',
      resourceType: 'SYSTEM',
      status: 'FAILURE',
      ipAddress,
      userAgent,
      details: { reason: 'BOOTSTRAP_ALREADY_LOCKED', attemptedEmail: email }
    });
    const error = new Error('System already has an initialized administrator. Bootstrap is locked.');
    error.statusCode = 403;
    throw error;
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create root admin user in database
  const adminUser = await db.user.create({
    data: {
      email: email.toLowerCase().trim(),
      passwordHash,
      fullName: fullName.trim(),
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });

  // Ensure system reserve vault account exists
  let vaultAccount = await db.account.findFirst({
    where: { accountType: 'SYSTEM_VAULT' }
  });

  if (!vaultAccount) {
    vaultAccount = await db.account.create({
      data: {
        accountNumber: 'BV-SYSTEM-RESERVE-001',
        userId: adminUser.id,
        currency: 'USD',
        balance: 10000000.0, // 10 Million synthetic reserve
        status: 'ACTIVE',
        accountType: 'SYSTEM_VAULT'
      }
    });
  }

  // Issue session token
  const token = jwt.sign(
    {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      fullName: adminUser.fullName
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  // Record audit trail
  await recordAuditLog({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    actorRole: 'ADMIN',
    action: 'ADMIN_BOOTSTRAP_SUCCESSFUL',
    resourceType: 'USER',
    resourceId: adminUser.id,
    ipAddress,
    userAgent,
    status: 'SUCCESS',
    details: {
      method: 'API_BOOTSTRAP',
      vaultAccountId: vaultAccount.id
    }
  });

  return {
    user: {
      id: adminUser.id,
      email: adminUser.email,
      fullName: adminUser.fullName,
      role: adminUser.role,
      status: adminUser.status
    },
    token
  };
}

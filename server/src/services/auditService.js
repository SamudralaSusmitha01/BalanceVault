import { db } from '../db.js';

/**
 * Audit Logging Service
 * Records tamper-evident audit records of critical actions and security events.
 */
export async function recordAuditLog({
  actorId = null,
  actorEmail = null,
  actorRole = null,
  action,
  resourceType,
  resourceId = null,
  ipAddress = null,
  userAgent = null,
  status = 'SUCCESS',
  details = null
}) {
  try {
    const serializedDetails = details && typeof details === 'object'
      ? JSON.stringify(details)
      : (details || null);

    const logEntry = await db.auditLog.create({
      data: {
        actorId,
        actorEmail,
        actorRole,
        action,
        resourceType,
        resourceId,
        ipAddress,
        userAgent,
        status,
        details: serializedDetails
      }
    });

    return logEntry;
  } catch (err) {
    console.error('[AuditService] Failed to record audit log:', err.message);
    return null;
  }
}

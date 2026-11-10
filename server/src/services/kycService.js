import { db } from '../db.js';
import { recordAuditLog } from './auditService.js';
import { executeSyntheticDeposit } from './transferService.js';

/**
 * Submits user onboarding KYC application
 */
export async function submitKycApplication({
  userId,
  legalName,
  dateOfBirth,
  idType,
  idNumber,
  initialDepositRequested = 0,
  ipAddress = null,
  userAgent = null
}) {
  const existing = await db.kycApplication.findUnique({
    where: { userId }
  });

  if (existing && existing.status === 'APPROVED') {
    const error = new Error('You already have an approved account');
    error.statusCode = 400;
    throw error;
  }

  let application;
  if (existing) {
    application = await db.kycApplication.update({
      where: { id: existing.id },
      data: {
        legalName,
        dateOfBirth,
        idType,
        idNumber,
        initialDepositRequested: parseFloat(initialDepositRequested) || 0,
        status: 'PENDING',
        reviewNotes: null,
        reviewedBy: null,
        reviewedAt: null
      }
    });
  } else {
    application = await db.kycApplication.create({
      data: {
        userId,
        legalName,
        dateOfBirth,
        idType,
        idNumber,
        initialDepositRequested: parseFloat(initialDepositRequested) || 0,
        status: 'PENDING'
      }
    });
  }

  await recordAuditLog({
    actorId: userId,
    action: 'KYC_APPLICATION_SUBMITTED',
    resourceType: 'KYC_APPLICATION',
    resourceId: application.id,
    status: 'SUCCESS',
    ipAddress,
    userAgent,
    details: {
      legalName,
      idType,
      initialDepositRequested
    }
  });

  return application;
}

/**
 * Admin review: Approve or Reject KYC application
 */
export async function reviewKycApplication({
  applicationId,
  adminUser,
  decision, // 'APPROVE' or 'REJECT'
  notes = null,
  ipAddress = null,
  userAgent = null
}) {
  const application = await db.kycApplication.findUnique({
    where: { id: applicationId },
    include: { user: true }
  });

  if (!application) {
    const error = new Error('KYC Application not found');
    error.statusCode = 404;
    throw error;
  }

  if (application.status !== 'PENDING') {
    const error = new Error(`Application already decided (${application.status})`);
    error.statusCode = 400;
    throw error;
  }

  const isApproved = decision.toUpperCase() === 'APPROVE';
  const newStatus = isApproved ? 'APPROVED' : 'REJECTED';

  const updatedApplication = await db.kycApplication.update({
    where: { id: applicationId },
    data: {
      status: newStatus,
      reviewedBy: adminUser.id,
      reviewNotes: notes,
      reviewedAt: new Date()
    }
  });

  let createdAccount = null;

  if (isApproved) {
    // 1. Activate User status
    await db.user.update({
      where: { id: application.userId },
      data: { status: 'ACTIVE' }
    });

    // 2. Generate Account Number (e.g. BV-8392014)
    const randomDigits = Math.floor(1000000 + Math.random() * 9000000);
    const accountNumber = `BV-${randomDigits}`;

    createdAccount = await db.account.create({
      data: {
        accountNumber,
        userId: application.userId,
        currency: 'USD',
        balance: 0.0,
        status: 'ACTIVE',
        accountType: 'CHECKING'
      }
    });

    // 3. If initial synthetic deposit was requested, execute it
    if (application.initialDepositRequested > 0) {
      try {
        await executeSyntheticDeposit({
          destinationAccountId: createdAccount.id,
          amount: application.initialDepositRequested,
          initiatedByUserId: adminUser.id,
          ipAddress,
          userAgent
        });
        // Reload account with updated balance
        createdAccount = await db.account.findUnique({
          where: { id: createdAccount.id }
        });
      } catch (depositErr) {
        console.error('[KYC] Failed to fund initial deposit:', depositErr.message);
      }
    }
  }

  // Record in audit logs
  await recordAuditLog({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    actorRole: adminUser.role,
    action: isApproved ? 'KYC_APPLICATION_APPROVED' : 'KYC_APPLICATION_REJECTED',
    resourceType: 'KYC_APPLICATION',
    resourceId: applicationId,
    status: 'SUCCESS',
    ipAddress,
    userAgent,
    details: {
      userId: application.userId,
      userEmail: application.user?.email,
      decision: newStatus,
      createdAccountId: createdAccount?.id,
      accountNumber: createdAccount?.accountNumber,
      notes
    }
  });

  return {
    application: updatedApplication,
    account: createdAccount
  };
}

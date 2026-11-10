import { db } from '../db.js';
import { createDoubleEntryPair, createSingleLedgerEntry } from './ledgerService.js';
import { recordAuditLog } from './auditService.js';
import { generateUUID } from '../utils/crypto.js';

/**
 * Executes a fund transfer between two accounts with strict double-entry integrity
 */
export async function executeTransfer({
  sourceAccountId,
  destinationAccountId,
  amount,
  initiatedByUserId,
  memo = null,
  idempotencyKey = null,
  ipAddress = null,
  userAgent = null
}) {
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    const error = new Error('Transfer amount must be a positive number greater than 0');
    error.statusCode = 400;
    throw error;
  }

  if (sourceAccountId === destinationAccountId) {
    const error = new Error('Source and destination accounts cannot be identical');
    error.statusCode = 400;
    throw error;
  }

  // Idempotency Key check: prevent double charges on retries
  if (idempotencyKey) {
    const existingTxn = await db.transaction.findFirst({
      where: { idempotencyKey },
      include: { ledgerEntries: true }
    });

    if (existingTxn) {
      return {
        transaction: existingTxn,
        isIdempotentReplay: true,
        message: 'Transaction already completed under this idempotency key'
      };
    }
  }

  // Execute inside atomic transaction
  return db.$transaction(async (tx) => {
    // 1. Fetch and validate source account
    const sourceAccount = await tx.account.findUnique({
      where: { id: sourceAccountId },
      include: { user: true }
    });

    if (!sourceAccount) {
      const error = new Error('Source account not found');
      error.statusCode = 404;
      throw error;
    }

    if (sourceAccount.status !== 'ACTIVE') {
      const error = new Error(`Source account is ${sourceAccount.status}. Money movement is prohibited.`);
      error.statusCode = 403;
      throw error;
    }

    // 2. Fetch and validate destination account
    const destAccount = await tx.account.findUnique({
      where: { id: destinationAccountId },
      include: { user: true }
    });

    if (!destAccount) {
      const error = new Error('Destination account not found');
      error.statusCode = 404;
      throw error;
    }

    if (destAccount.status !== 'ACTIVE') {
      const error = new Error(`Destination account is ${destAccount.status}. Transfers rejected.`);
      error.statusCode = 403;
      throw error;
    }

    // 3. Balance verification
    if (sourceAccount.balance < numericAmount) {
      await recordAuditLog({
        actorId: initiatedByUserId,
        action: 'TRANSFER_REJECTED_INSUFFICIENT_FUNDS',
        resourceType: 'ACCOUNT',
        resourceId: sourceAccountId,
        status: 'FAILURE',
        ipAddress,
        userAgent,
        details: {
          requestedAmount: numericAmount,
          availableBalance: sourceAccount.balance
        }
      });

      const error = new Error(
        `Insufficient funds. Available: $${sourceAccount.balance.toFixed(2)}, Requested: $${numericAmount.toFixed(2)}`
      );
      error.statusCode = 400;
      throw error;
    }

    // 4. Calculate new balances
    const balanceBeforeSource = sourceAccount.balance;
    const balanceAfterSource = Number((balanceBeforeSource - numericAmount).toFixed(4));

    const balanceBeforeDest = destAccount.balance;
    const balanceAfterDest = Number((balanceBeforeDest + numericAmount).toFixed(4));

    // 5. Update Account balances atomically
    await tx.account.update({
      where: { id: sourceAccountId },
      data: { balance: balanceAfterSource }
    });

    await tx.account.update({
      where: { id: destinationAccountId },
      data: { balance: balanceAfterDest }
    });

    // 6. Create Transaction record
    const reference = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const transaction = await tx.transaction.create({
      data: {
        reference,
        idempotencyKey,
        sourceAccountId,
        destinationAccountId,
        amount: numericAmount,
        currency: sourceAccount.currency,
        type: 'TRANSFER',
        status: 'COMPLETED',
        initiatedByUserId,
        memo
      }
    });

    // 7. Generate Balanced Double-Entry Ledger records with SHA-256 hash chaining
    const { debitEntry, creditEntry } = await createDoubleEntryPair(tx, {
      transactionId: transaction.id,
      sourceAccountId,
      destinationAccountId,
      amount: numericAmount,
      balanceBeforeSource,
      balanceAfterSource,
      balanceBeforeDest,
      balanceAfterDest,
      createdAt: transaction.createdAt
    });

    // 8. Record in audit trail
    await recordAuditLog({
      actorId: initiatedByUserId,
      actorEmail: sourceAccount.user?.email,
      actorRole: sourceAccount.user?.role || 'USER',
      action: 'MONEY_TRANSFER_COMPLETED',
      resourceType: 'TRANSACTION',
      resourceId: transaction.id,
      status: 'SUCCESS',
      ipAddress,
      userAgent,
      details: {
        reference,
        amount: numericAmount,
        sourceAccountNumber: sourceAccount.accountNumber,
        destAccountNumber: destAccount.accountNumber,
        debitLedgerSeq: debitEntry.sequenceNumber,
        creditLedgerSeq: creditEntry.sequenceNumber,
        headHash: creditEntry.currentHash
      }
    });

    return {
      transaction,
      sourceAccount: {
        id: sourceAccount.id,
        accountNumber: sourceAccount.accountNumber,
        newBalance: balanceAfterSource
      },
      destinationAccount: {
        id: destAccount.id,
        accountNumber: destAccount.accountNumber,
        newBalance: balanceAfterDest
      },
      ledgerEntries: [debitEntry, creditEntry]
    };
  });
}

/**
 * Executes a synthetic deposit to fund a user account from System Reserve
 */
export async function executeSyntheticDeposit({
  destinationAccountId,
  amount,
  initiatedByUserId,
  ipAddress = null,
  userAgent = null
}) {
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    const error = new Error('Deposit amount must be a positive number');
    error.statusCode = 400;
    throw error;
  }

  return db.$transaction(async (tx) => {
    // Locate system reserve account
    let systemReserve = await tx.account.findFirst({
      where: { accountType: 'SYSTEM_VAULT' }
    });

    if (!systemReserve) {
      // Create reserve if not yet present
      systemReserve = await tx.account.create({
        data: {
          accountNumber: 'BV-SYSTEM-RESERVE-001',
          userId: initiatedByUserId,
          currency: 'USD',
          balance: 10000000.0,
          status: 'ACTIVE',
          accountType: 'SYSTEM_VAULT'
        }
      });
    }

    // Now execute regular double-entry transfer from reserve to destination
    return executeTransfer({
      sourceAccountId: systemReserve.id,
      destinationAccountId,
      amount: numericAmount,
      initiatedByUserId,
      memo: 'Synthetic Test Deposit / Initial Funding',
      ipAddress,
      userAgent
    });
  });
}

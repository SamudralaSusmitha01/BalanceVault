import { db } from '../db.js';
import {
  computeEntryHash,
  verifyLedgerChain,
  GENESIS_HASH
} from '../utils/crypto.js';
import { recordAuditLog } from './auditService.js';

/**
 * Creates a pair of balanced double-entry ledger records (DEBIT & CREDIT)
 * with SHA-256 hash chaining.
 */
export async function createDoubleEntryPair(tx, {
  transactionId,
  sourceAccountId,
  destinationAccountId,
  amount,
  balanceBeforeSource,
  balanceAfterSource,
  balanceBeforeDest,
  balanceAfterDest,
  createdAt = new Date()
}) {
  // 1. Fetch latest ledger entry to get head hash and sequence number
  const latestEntry = await tx.ledgerEntry.findFirst({
    orderBy: { sequenceNumber: 'desc' }
  });

  let currentSequence = latestEntry ? latestEntry.sequenceNumber : 0;
  let previousHash = latestEntry ? latestEntry.currentHash : GENESIS_HASH;

  // 2. Leg 1: DEBIT source account
  currentSequence += 1;
  const debitEntryData = {
    sequenceNumber: currentSequence,
    transactionId,
    accountId: sourceAccountId,
    entryType: 'DEBIT',
    amount: Number(amount),
    balanceBefore: Number(balanceBeforeSource),
    balanceAfter: Number(balanceAfterSource),
    previousHash,
    createdAt
  };
  const debitHash = computeEntryHash(debitEntryData);
  debitEntryData.currentHash = debitHash;

  const debitEntry = await tx.ledgerEntry.create({
    data: debitEntryData
  });

  // 3. Leg 2: CREDIT destination account (Chained directly to Leg 1's hash)
  currentSequence += 1;
  const creditEntryData = {
    sequenceNumber: currentSequence,
    transactionId,
    accountId: destinationAccountId,
    entryType: 'CREDIT',
    amount: Number(amount),
    balanceBefore: Number(balanceBeforeDest),
    balanceAfter: Number(balanceAfterDest),
    previousHash: debitHash, // Cryptographically chained!
    createdAt
  };
  const creditHash = computeEntryHash(creditEntryData);
  creditEntryData.currentHash = creditHash;

  const creditEntry = await tx.ledgerEntry.create({
    data: creditEntryData
  });

  return {
    debitEntry,
    creditEntry
  };
}

/**
 * Single-leg ledger entry (used for initial genesis funding from reserve)
 */
export async function createSingleLedgerEntry(tx, {
  transactionId,
  accountId,
  entryType,
  amount,
  balanceBefore,
  balanceAfter,
  createdAt = new Date()
}) {
  const latestEntry = await tx.ledgerEntry.findFirst({
    orderBy: { sequenceNumber: 'desc' }
  });

  const currentSequence = (latestEntry ? latestEntry.sequenceNumber : 0) + 1;
  const previousHash = latestEntry ? latestEntry.currentHash : GENESIS_HASH;

  const entryData = {
    sequenceNumber: currentSequence,
    transactionId,
    accountId,
    entryType,
    amount: Number(amount),
    balanceBefore: Number(balanceBefore),
    balanceAfter: Number(balanceAfter),
    previousHash,
    createdAt
  };
  entryData.currentHash = computeEntryHash(entryData);

  return tx.ledgerEntry.create({
    data: entryData
  });
}

/**
 * Verifies cryptographic integrity of the entire ledger chain.
 */
export async function verifyLedgerIntegrity(actor = null) {
  const allEntries = await db.ledgerEntry.findMany({
    orderBy: { sequenceNumber: 'asc' }
  });

  const report = verifyLedgerChain(allEntries);

  if (actor) {
    await recordAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: report.isValid ? 'LEDGER_VERIFICATION_PASSED' : 'LEDGER_VERIFICATION_FAILED',
      resourceType: 'LEDGER',
      status: report.isValid ? 'SUCCESS' : 'FAILURE',
      details: {
        totalEntries: report.totalEntries,
        isValid: report.isValid,
        headHash: report.headHash,
        errorCount: report.errors.length
      }
    });
  }

  return report;
}

/**
 * Backup of altered entry for demonstration/repair
 */
let tamperBackup = null;

/**
 * Demonstrates tamper detection by modifying a ledger row without updating hash
 */
export async function simulateTamper(entryIndex = 0, tamperedAmount = 999999.0) {
  const allEntries = await db.ledgerEntry.findMany({
    orderBy: { sequenceNumber: 'asc' }
  });

  if (allEntries.length === 0) {
    throw new Error('Ledger has no entries to tamper with. Execute a transaction first.');
  }

  const target = allEntries[entryIndex] || allEntries[0];
  tamperBackup = { ...target };

  // Directly tamper in store
  db._tamperWithEntry(entryIndex, tamperedAmount);

  await recordAuditLog({
    action: 'LEDGER_TAMPER_SIMULATED',
    resourceType: 'LEDGER',
    resourceId: target.id,
    status: 'WARNING',
    details: {
      entryIndex,
      originalAmount: target.amount,
      tamperedAmount
    }
  });

  return {
    message: `Tampered with entry #${target.sequenceNumber} (Amount altered from $${target.amount} to $${tamperedAmount})`,
    targetEntryId: target.id,
    sequenceNumber: target.sequenceNumber
  };
}

/**
 * Repairs the simulated tamper
 */
export async function repairTamper() {
  if (!tamperBackup) {
    return { message: 'No simulated tamper to repair.' };
  }

  await db.ledgerEntry.update({
    where: { id: tamperBackup.id },
    data: { amount: tamperBackup.amount }
  });

  const restored = { ...tamperBackup };
  tamperBackup = null;

  return {
    message: `Restored entry #${restored.sequenceNumber} to original amount $${restored.amount}`,
    restored
  };
}

import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Computes SHA-256 hash of a string payload
 */
export function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Computes the cryptographic hash for a single ledger entry.
 * Canonical representation:
 * sequenceNumber | transactionId | accountId | entryType | amount.toFixed(4) | balanceAfter.toFixed(4) | previousHash | createdAtISO
 */
export function computeEntryHash(entry) {
  const canonicalString = [
    entry.sequenceNumber,
    entry.transactionId,
    entry.accountId,
    entry.entryType,
    Number(entry.amount).toFixed(4),
    Number(entry.balanceAfter).toFixed(4),
    entry.previousHash || 'GENESIS_BLOCK_000000000000000000000000000000000000000000000000000000000000',
    new Date(entry.createdAt).toISOString()
  ].join('|');

  return sha256(canonicalString);
}

/**
 * Genesis hash constant
 */
export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Verifies the integrity of an entire sequence of ledger entries.
 * Checks:
 * 1. Monotonic sequence numbers.
 * 2. Hash chaining: entry[i].previousHash === entry[i-1].currentHash.
 * 3. Hash integrity: entry[i].currentHash === computeEntryHash(entry[i]).
 * 4. Double-entry zero-sum balance: For each transactionId, sum of DEBITs == sum of CREDITs.
 * 
 * Returns:
 * {
 *   isValid: boolean,
 *   totalEntries: number,
 *   totalTransactions: number,
 *   genesisHash: string,
 *   headHash: string,
 *   verifiedAt: string,
 *   errors: string[]
 * }
 */
export function verifyLedgerChain(entries) {
  const errors = [];
  if (!entries || entries.length === 0) {
    return {
      isValid: true,
      totalEntries: 0,
      totalTransactions: 0,
      genesisHash: GENESIS_HASH,
      headHash: GENESIS_HASH,
      verifiedAt: new Date().toISOString(),
      errors: []
    };
  }

  // Sort by sequenceNumber ascending
  const sorted = [...entries].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  const transactionBalances = new Map(); // transactionId -> net sum

  let expectedPrevHash = GENESIS_HASH;

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];

    // Check sequence continuity
    if (i > 0 && entry.sequenceNumber !== sorted[i - 1].sequenceNumber + 1) {
      errors.push(`Sequence gap at entry #${entry.sequenceNumber}: expected ${sorted[i - 1].sequenceNumber + 1}, found ${entry.sequenceNumber}`);
    }

    // Check previous hash link
    if (i === 0) {
      // First entry
      if (entry.previousHash !== GENESIS_HASH && entry.previousHash !== 'GENESIS_BLOCK_000000000000000000000000000000000000000000000000000000000000') {
        errors.push(`Genesis entry #${entry.sequenceNumber} has invalid previousHash: ${entry.previousHash}`);
      }
    } else {
      if (entry.previousHash !== sorted[i - 1].currentHash) {
        errors.push(
          `Broken hash chain at entry #${entry.sequenceNumber} (ID: ${entry.id}): ` +
          `previousHash [${entry.previousHash?.substring(0, 12)}...] does not match previous entry hash [${sorted[i - 1].currentHash?.substring(0, 12)}...]`
        );
      }
    }

    // Recalculate hash to verify against stored currentHash
    const recalculatedHash = computeEntryHash(entry);
    if (recalculatedHash !== entry.currentHash) {
      errors.push(
        `Hash mismatch at entry #${entry.sequenceNumber} (ID: ${entry.id}): ` +
        `computed [${recalculatedHash.substring(0, 12)}...] vs stored [${entry.currentHash?.substring(0, 12)}...]. DATA TAMPERING DETECTED!`
      );
    }

    // Track double entry zero-sum
    const netChange = entry.entryType === 'DEBIT' ? -entry.amount : entry.amount;
    const currentTxnNet = transactionBalances.get(entry.transactionId) || 0;
    transactionBalances.set(entry.transactionId, currentTxnNet + netChange);
  }

  // Verify all transactions sum to zero (Debits = Credits)
  for (const [txnId, net] of transactionBalances.entries()) {
    if (Math.abs(net) > 0.0001) {
      errors.push(`Transaction ${txnId} violates double-entry invariant: Net balance delta is ${net.toFixed(4)}, expected 0.0000.`);
    }
  }

  return {
    isValid: errors.length === 0,
    totalEntries: sorted.length,
    totalTransactions: transactionBalances.size,
    genesisHash: sorted[0]?.currentHash || GENESIS_HASH,
    headHash: sorted[sorted.length - 1]?.currentHash || GENESIS_HASH,
    verifiedAt: new Date().toISOString(),
    errors
  };
}

/**
 * Hash password with bcrypt
 */
export async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

/**
 * Verify password with bcrypt
 */
export async function comparePassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}

/**
 * Generates UUID v4
 */
export function generateUUID() {
  return crypto.randomUUID();
}

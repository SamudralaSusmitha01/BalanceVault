# BalanceVault — AI Collaboration & Architectural Log (PROMPTS.md)

This log documents the interaction with AI coding assistants during the development of **BalanceVault**. In accordance with challenge guidelines, each entry records:
1. **What I asked for**
2. **What the tool produced**
3. **What was wrong with it** (failure analysis, security flaws, or execution environment mismatch)
4. **What I did instead** (my architectural fix and implementation)
5. **Reference Commit**

---

### Entry 1 — Friday, 6 November 2026
* **Category:** Database Security & Privilege Separation
* **What I asked for:**
  > "Generate a PostgreSQL configuration script for BalanceVault that sets up least-privilege roles for standard application runtime, auditor read-only access, and an administrator bootstrap operator."
* **What the tool produced:**
  A SQL script that connected with the default database user (`neondb_owner`) and attempted to run:
  ```sql
  ALTER ROLE bv_bootstrap_operator WITH SUPERUSER CREATEROLE;
  ALTER USER bv_bootstrap_operator WITH PASSWORD 'new_password';
  GRANT ALL PRIVILEGES ON ALL TABLES TO bv_bootstrap_operator;
  ```
* **What was wrong with it:**
  When executed against Neon cloud PostgreSQL, the database immediately threw:
  ```
  ERROR: permission denied to alter role (SQLSTATE 42501)
  ```
  The AI confused cloud-managed database membership with administrative superuser privileges. On serverless platforms like Neon, the project owner does not have `SUPERUSER` rights and cannot grant arbitrary role administration.
* **What I did instead:**
  I inspected `pg_roles` and designed a least-privilege role architecture:
  1. `neondb_owner` handles schema DDL migrations.
  2. Created `bv_bootstrap_operator` with restricted connection and execute rights.
  3. Created `scripts/setup-db-roles.sql` using a `SECURITY DEFINER` function (`bootstrap_first_admin(...)`). This allows the bootstrap operator to initialize the administrator row safely without needing global role alter permissions or table ownership.
* **Commit:** `4fdc20a` (`feat: complete BalanceVault platform with provable double-entry ledger, RBAC, KYC onboarding, and audit trail`)

---

### Entry 2 — Saturday, 7 November 2026
* **Category:** Authentication & First-Admin Bootstrap
* **What I asked for:**
  > "Implement the first-administrator bootstrap process so the first user created becomes the root admin."
* **What the tool produced:**
  An Express route that accepted an optional `isAdmin: true` flag in the regular registration endpoint, or a route that allowed setting the admin password whenever `BOOTSTRAP_SECRET` was provided in the body.
* **What was wrong with it (Access Control Vulnerability):**
  This created a permanent root-takeover backdoor:
  1. Anyone who sniffed or discovered the secret token could repeatedly overwrite the root administrator at any point in production.
  2. Allowing an `isAdmin` boolean flag on `/register` is a classic mass-assignment vulnerability where unauthenticated clients can elevate themselves.
* **What I did instead:**
  I implemented a strict, one-time server-side state machine in `server/src/services/bootstrapService.js`:
  1. Isolated bootstrap into a dedicated endpoint `/api/auth/bootstrap-admin` and CLI script `scripts/bootstrap-admin.js`.
  2. Before creating the admin, the server executes `db.user.count({ where: { role: 'ADMIN' } })`. If any admin exists, it returns `HTTP 403 Forbidden` (`Bootstrap is permanently locked`).
  3. Added an audit log event (`ADMIN_BOOTSTRAP_EXECUTED`) recording the bootstrap event and IP.
* **Commit:** `4fdc20a` (`server/src/services/bootstrapService.js`)

---

### Entry 3 — Sunday, 8 November 2026
* **Category:** Verifiable Ledger Architecture (Double-Entry & Merkle Chain)
* **What I asked for:**
  > "Implement an auditable transaction ledger for user transfers."
* **What the tool produced:**
  A single `transactions` table containing `senderId`, `receiverId`, and `amount`, which updated an account balance column using:
  ```js
  await db.account.update({ where: { id: senderId }, data: { balance: balance - amount } });
  await db.account.update({ where: { id: receiverId }, data: { balance: balance + amount } });
  ```
* **What was wrong with it (Integrity Failure):**
  This is a mutable ledger, not a provable one. If anyone alters the balance column directly in the database, there is no historical proof of tampering, no double-entry balance sheet, and no cryptographic trail. It violated the core problem requirement: *"A system where you can prove who moved money and explain every integrity decision."*
* **What I did instead:**
  I engineered an immutable double-entry cryptographic ledger in `server/src/services/ledgerService.js` and `server/src/utils/crypto.js`:
  1. **Double-Entry Bookkeeping**: Every transaction generates balanced `DEBIT` and `CREDIT` entries. Net system delta across the pair is mathematically zero ($\sum \text{Debits} + \sum \text{Credits} = 0$).
  2. **SHA-256 Merkle Chaining**: Every `LedgerEntry` record calculates:
     `sha256(sequenceNumber | transactionId | accountId | entryType | amount | balanceAfter | previousHash | timestamp)`
  3. Each entry stores a pointer to `previousHash`, making any direct database modification immediately detectable by recalculating the chain.
* **Commit:** `4fdc20a` (`server/src/services/ledgerService.js`, `server/src/utils/crypto.js`)

---

### Entry 4 — Monday, 9 November 2026
* **Category:** Authorisation & RBAC Enforcement (Auditor Lockout)
* **What I asked for:**
  > "Add role-based authorization so that Admins, Auditors, and Users can access their respective parts of the application."
* **What the tool produced:**
  A general `authenticateToken` middleware that verified JWT tokens, with routes grouped under `router.use(authenticateToken)`. The transfer route `POST /api/transfers` only checked if `req.user` was present.
* **What was wrong with it (Authorisation Failure):**
  Compliance Auditors could move money! In financial institutions, the Auditor persona is strictly read-only for regulatory oversight. Allowing an Auditor account to initiate fund transfers violates separation of duties. Additionally, regular users could specify any `sourceAccountId` in the JSON body, enabling Horizontal Privilege Escalation.
* **What I did instead:**
  I added defense-in-depth authorization checks directly inside `server/src/routes/transferRoutes.js`:
  ```js
  // 1. Horizontal privilege check: Verify caller owns source account
  if (req.user.role !== 'ADMIN' && sourceAccount.userId !== req.user.id) {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'You cannot initiate transfers from an account you do not own' });
  }

  // 2. Strict Auditor Lockout
  if (req.user.role === 'AUDITOR') {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Auditor role is strictly read-only and cannot move funds.' });
  }
  ```
* **Commit:** `4fdc20a` (`server/src/routes/transferRoutes.js:29-50`)

---

### Entry 5 — Tuesday, 10 November 2026
* **Category:** Concurrency, Race Conditions, and Idempotency
* **What I asked for:**
  > "Handle transfer requests and prevent duplicate transfers on network retry."
* **What the tool produced:**
  An un-sequenced check-then-act balance query:
  ```js
  const acc = await db.account.findUnique({ where: { id: sourceAccountId } });
  if (acc.balance < amount) throw new Error('Insufficient funds');
  // ... perform transfer
  ```
* **What was wrong with it (Race Condition & Overdraw Vulnerability):**
  1. Two rapid concurrent requests could both read the same initial balance before either deducted it, allowing an attacker to overdraw their balance into negative territory.
  2. If a network blip caused the client to retry the request, the user would be double-debited because the server had no idempotency deduplication.
* **What I did instead:**
  I restructured `server/src/services/transferService.js`:
  1. Wrapped the entire balance check, balance deduction, transaction creation, and ledger hashing inside an atomic transaction (`db.$transaction`).
  2. Added support for `Idempotency-Key` headers: checked before executing the transaction; if seen previously, returns the existing receipt without debiting again.
  3. Added account status checks (`sourceAccount.status === 'ACTIVE'` and `destAccount.status === 'ACTIVE'`), blocking transfers involving frozen or suspended accounts.
* **Commit:** `4fdc20a` (`server/src/services/transferService.js:33-72`)

---

### Entry 6 — Wednesday, 11 November 2026
* **Category:** Cryptographic Verification Proof & Evaluator Tamper Demo
* **What I asked for:**
  > "Add a button on the UI that lets judges see that the ledger is verified and intact."
* **What the tool produced:**
  A frontend function that fetched the user's transactions from the API and checked if the sum of deposits minus transfers matched the displayed UI balance.
* **What was wrong with it (False Verification):**
  A client-side calculation does not prove database ledger integrity. If an attacker had modified a database record or tampered with the ledger table, the client would simply sum the tampered rows and falsely claim the system was valid.
* **What I did instead:**
  I created an end-to-end cryptographic verification system in `server/src/services/ledgerService.js:verifyLedgerIntegrity` and a live visual proof interface:
  1. The server traverses all blocks from Genesis, recalculates `computeEntryHash(entry)` using canonical serialization, and confirms `previousHash === previousEntry.currentHash`.
  2. Built an interactive "Simulate Data Tamper" tool in the UI: evaluators can modify a database row in storage, click "Run Cryptographic Proof", and see the server immediately detect the `INTEGRITY_BREACH` with the exact mismatched block sequence number.
  3. Built a "Repair & Re-Seal" tool to restore the block and re-prove cryptographic consensus (`CHAIN_INTACT`).
* **Commit:** `4fdc20a` (`server/src/services/ledgerService.js:125-190`, `client/src/pages/LedgerProofPage.jsx`)

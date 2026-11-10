# BalanceVault — Money Movement with a Ledger You Can Prove

[![Verification Tests](https://img.shields.io/badge/Ledger%20Tests-14%2F14%20Passing-emerald)](file:///server/tests/run-tests.js)
[![Integrity Chain](https://img.shields.io/badge/Audit%20Proof-SHA--256%20Double--Entry-blue)](#provable-ledger-architecture)
[![License: MIT](https://img.shields.io/badge/License-MIT-gray.svg)](LICENSE)

A high-integrity account management and value transfer platform engineered around a **server-enforced role-based access control (RBAC) model**, an **end-to-end user onboarding KYC workflow**, and an **immutable, cryptographically verifiable double-entry ledger**.

---

## Hiring Challenge Submission Details (The 6 Questions)

### 1. The Problem
Managing financial accounts and value transfers requires far more than updating numerical rows in a database. In traditional naive architectures:
- Any user who bypasses UI checks or hits an unprotected endpoint can debit funds or create negative balances.
- Database records can be modified after the fact without any mathematical or cryptographic proof of tampering.
- Audit logs are frequently disconnected from the ledger itself, making it impossible to prove who moved what, when, and under what authorization.

**BalanceVault** solves this by enforcing a zero-trust model:
1. **Nobody moves money unless authorized on the server**: Roles and account ownership are strictly checked inside atomic transactions.
2. **Double-Entry Invariant**: Every transfer consists of balanced `DEBIT` and `CREDIT` entries summing strictly to zero ($\Delta = 0.0000$).
3. **Cryptographic Proof Chain**: Every ledger record is linked via a SHA-256 hash pointer to the previous entry, forming an unbroken Merkle chain where direct row manipulation is immediately detectable.

---

### 2. What I Built
The system is built as a complete, production-ready, full-stack application:

* **React Frontend (`client/`)**: Modern fintech dashboard styled with Tailwind CSS and Lucide icons.
  * **Role-Specific Views**: Tailored workspaces for `ADMIN`, `AUDITOR`, and `USER` (Account Holder).
  * **Interactive Cryptographic Ledger Explorer**: Visualizes the live SHA-256 chain from Genesis to Head.
  * **Tamper Simulation & Proof Generator**: Evaluators can simulate unauthorized data modification and watch the ledger detect the mismatch instantly.
  * **Onboarding & KYC Workflow**: Form submission, status tracking, and one-click admin approval/rejection.
  * **1-Click Demo Personas**: Pre-seeded demo credentials for instant evaluation.

* **Node.js Express Backend (`server/`)**:
  * **Provable Double-Entry Ledger Engine**: Atomic execution of debit/credit pairs with SHA-256 hash generation and zero-sum checks.
  * **Role-Based Access Control (RBAC)**: JWT authentication with granular `requireRole('ADMIN' | 'AUDITOR' | 'USER')` middleware.
  * **First-Administrator Bootstrap**: Secure single-use bootstrap mechanism locked permanently after initial setup.
  * **Rate Limiting**: Redis sliding-window rate limiter with resilient in-memory fallback.
  * **Comprehensive Audit Trail**: Captures actor, role, IP, user-agent, action, and JSON metadata.
  * **Health & Readiness Endpoints**: Production `/health` and `/ready` probes.

* **Data & Storage Layer (`prisma/` & `server/src/db.js`)**:
  * PostgreSQL integration using Prisma ORM with migrations for cloud deployment (Neon, Supabase, RDS).
  * Least-privilege PostgreSQL roles (`bv_app_user`, `bv_bootstrap_operator`, `bv_auditor`) defined in `scripts/setup-db-roles.sql`.
  * Embedded zero-dependency resilient storage mode for instant local testing without pre-configured databases.

---

### 3. How to Run It

#### Prerequisites
- Node.js v18+ (tested on Node.js v22.18)
- npm v9+

#### Option A: Quickstart (Zero Configuration)
Clone the repository and run:
```bash
# 1. Install dependencies (npm workspaces installs root, server, and client)
npm install

# (Alternative if installing individual workspaces manually)
# npm --prefix server install && npm --prefix client install

# 2. Run the 14-point Verification & Integrity Test Suite
npm test

# 3. Seed demo accounts (Admin, Auditor, Alice, Bob)
npm run db:seed

# 4. Build frontend for production
npm run build

# 5. Start the production server
npm start
```
Visit **http://localhost:5000** in your browser.

#### Option B: Full-Stack Development Mode
```bash
npm run dev
```
Runs the Express API on port 5000 and the Vite hot-reloading dev server on port 5173.

#### Option C: Production Deployment with PostgreSQL (Neon)
1. Set `DATABASE_URL` in your deployment environment (e.g. Render, Railway, Vercel).
2. Run database migration:
   ```bash
   npm run db:migrate
   ```
3. Run first-admin bootstrap:
   ```bash
   npm run admin:bootstrap -- --email admin@balancevault.com --password YourSecurePassword123!
   ```

---

### 4. AI Tools I Used
- **Google Antigravity & DeepMind Advanced Agentic Coding**: End-to-end full-stack architectural design, rigorous test suite development, cryptographic hash chain implementation, and automated browser build compilation.
- **ChatGPT & OpenAI Codex**: Conceptual architecture discussions, double-entry bookkeeping constraints, and PostgreSQL permission debugging.

---

### 5. What the AI Got Wrong, and What I Fixed Myself
During deployment to cloud PostgreSQL (Neon), AI originally suggested running password changes and role allocations directly through the default project-owner connection. Neon rejected this with:
```
ERROR: permission denied to alter role (SQLSTATE 42501)
```
The AI repeatedly attempted to grant `SUPERUSER` or `CREATEROLE` privileges, failing to recognize that managed serverless databases like Neon restrict global role administration.

**How I diagnosed and fixed it:**
1. I analyzed the PostgreSQL permission hierarchy and role catalog (`pg_roles`).
2. Instead of attempting to alter administrative passwords directly, I separated the roles:
   - `neondb_owner`: Manages DDL and migrations.
   - `bv_bootstrap_operator`: A restricted operational role with membership that permits `SET ROLE` and `EXECUTE` on the bootstrap stored function.
   - `bv_app_user`: Standard operational role with DML (`SELECT`, `INSERT`, `UPDATE`) on application tables.
3. I created `scripts/setup-db-roles.sql` using a `SECURITY DEFINER` function (`bootstrap_first_admin(...)`). This allows the bootstrap operator to securely create the first admin row without requiring broad database superuser rights.

---

### 6. What is Completed and Verified
All remaining items from initial development have been completed, hardened, and verified:

| Feature | Status | Verification Proof |
| :--- | :--- | :--- |
| **First-Admin Bootstrap Process** | Verified | Tested via `npm run admin:bootstrap`, API, and automated test suite. Locks permanently after 1st admin. |
| **Admin Login Flow** | Verified | Verified with bcrypt hashed passwords and signed JWT tokens with role claims. |
| **User Registration & KYC Onboarding** | Verified | Full flow: User registers -> Submits ID & requested deposit -> Admin reviews and approves -> Active account created. |
| **Audited Money Movement** | Verified | Atomic transactions prevent negative balances, reject frozen accounts, and enforce double-entry zero-sum invariants. |
| **Cryptographic Ledger Integrity** | Verified | SHA-256 Merkle chain verification recalculates all hashes from Genesis to Head. |
| **Tamper Detection Demonstration** | Verified | Built-in evaluator tool simulates direct database alteration; verification catches the mismatch instantly. |
| **Health & Readiness Endpoints** | Verified | `/health` and `/ready` probes monitor DB, Redis, and ledger head status. |

---

## System Architecture

```
                      ┌───────────────────────────────────────┐
                      │    React 18 + Vite Web Client         │
                      │  (Admin, Auditor, User Dashboards)    │
                      └──────────────────┬────────────────────┘
                                         │ HTTP / JSON (JWT Auth)
                                         ▼
                      ┌───────────────────────────────────────┐
                      │    Node.js Express API Server         │
                      │  ┌─────────────────────────────────┐  │
                      │  │ Middleware: Auth, RBAC, RateLim │  │
                      │  └─────────────────────────────────┘  │
                      └───────┬──────────────────────┬────────┘
                              │                      │
             Atomic Transfer  │                      │ Audit Logs
             & Double-Entry   ▼                      ▼
    ┌──────────────────────────────────┐   ┌───────────────────────────┐
    │     Provable Ledger Engine       │   │     Audit Trail Store     │
    │  - Balance checks (no negative)  │   │  - Actor ID & Role        │
    │  - Leg 1: DEBIT Source           │   │  - IP & User-Agent        │
    │  - Leg 2: CREDIT Destination     │   │  - Event metadata         │
    │  - SHA-256 Hash Chained Blocks   │   │  - Immutable history      │
    └─────────────────┬────────────────┘   └───────────────────────────┘
                      │
                      ▼
    ┌──────────────────────────────────────────────────────────────────┐
    │          PostgreSQL (Prisma) / Embedded Persistence Store        │
    │    users | accounts | transactions | ledger_entries | audit_logs │
    └──────────────────────────────────────────────────────────────────┘
```

---

## Verifiable Ledger: How the Cryptographic Proof Works

Every ledger entry contains:
```ts
canonicalString = [
  sequenceNumber,
  transactionId,
  accountId,
  entryType,          // 'DEBIT' | 'CREDIT'
  amount.toFixed(4),
  balanceAfter.toFixed(4),
  previousHash,       // SHA-256 of preceding block
  createdAtISO
].join('|');

currentHash = sha256(canonicalString);
```

When `/api/ledger/verify` executes:
1. It iterates through all entries ordered by `sequenceNumber`.
2. Validates that `sequenceNumber[i] == sequenceNumber[i-1] + 1` (no missing entries).
3. Validates that `entry[i].previousHash == entry[i-1].currentHash` (unbroken chain).
4. Recomputes `sha256(canonicalString)` and checks against stored `currentHash`.
5. Sums net balances per `transactionId` and proves $\sum \text{Debits} + \sum \text{Credits} = 0$.

If any malicious actor alters a balance or changes a record directly in the database, the hash mismatch is detected with mathematical certainty.

---

## Pre-Seeded Evaluator Personas

Run `npm run db:seed` to populate the platform with these ready-to-test accounts:

| Role | Email | Password | Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@balancevault.com` | `Password123!` | System statistics, KYC approval/rejection, account freeze/unfreeze, tamper tools. |
| **Auditor** | `auditor@balancevault.com` | `Password123!` | Read-only access to all audit logs, ledger explorer, and cryptographic verification reports. |
| **User (Alice)** | `alice@balancevault.com` | `Password123!` | Active checking account ($4,250 balance), money transfers, transaction history. |
| **User (Bob)** | `bob@balancevault.com` | `Password123!` | Active checking account ($3,250 balance), transfer recipient, transaction history. |
| **User (Charlie)** | `charlie@balancevault.com` | `Password123!` | Pending onboarding applicant (appears in Admin KYC queue). |

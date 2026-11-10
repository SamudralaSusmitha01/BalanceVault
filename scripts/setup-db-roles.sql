-- =========================================================================
-- BalanceVault - PostgreSQL Role & Security Provisioning Script
-- =========================================================================
-- This script configures least-privilege database roles for BalanceVault.
-- It resolves Neon SQLSTATE 42501 permission restrictions by separating:
-- 1. Project Owner (neondb_owner) - Schema migrations & DDL
-- 2. Bootstrap Operator (bv_bootstrap_operator) - Executes bootstrap function
-- 3. App Runtime (bv_app_user) - Normal operational CRUD
-- 4. Compliance/Auditor (bv_auditor) - Read-only access to ledger & audit_logs
-- =========================================================================

-- Step 1: Create application roles if they do not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'bv_bootstrap_operator') THEN
        CREATE ROLE bv_bootstrap_operator WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
    END IF;

    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'bv_app_user') THEN
        CREATE ROLE bv_app_user WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
    END IF;

    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'bv_auditor') THEN
        CREATE ROLE bv_auditor WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
    END IF;
END $$;

-- Step 2: Grant connection permissions to database
GRANT CONNECT ON DATABASE current_database() TO bv_bootstrap_operator, bv_app_user, bv_auditor;
GRANT USAGE ON SCHEMA public TO bv_bootstrap_operator, bv_app_user, bv_auditor;

-- Step 3: Granular Table Permissions for App Runtime (bv_app_user)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO bv_app_user;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO bv_app_user;

-- Step 4: Compliance Auditor Permissions (Read-only on ledger and audit trail)
GRANT SELECT ON audit_logs, ledger_entries, transactions, accounts TO bv_auditor;

-- Step 5: Secure First-Administrator Bootstrap Stored Function
-- Runs with SECURITY DEFINER so bv_bootstrap_operator can safely bootstrap
-- without needing administrative ownership of user tables or system roles.
CREATE OR REPLACE FUNCTION bootstrap_first_admin(
    p_email TEXT,
    p_password_hash TEXT,
    p_full_name TEXT
)
RETURNS TABLE (admin_id TEXT, email TEXT, role TEXT, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_count INT;
    v_new_id TEXT;
BEGIN
    -- Check if an admin already exists (Idempotent / one-time lock)
    SELECT COUNT(*) INTO v_admin_count FROM users WHERE role = 'ADMIN';
    IF v_admin_count > 0 THEN
        RAISE EXCEPTION 'ADMIN_BOOTSTRAP_LOCKED: An administrator has already been bootstrapped.'
            USING ERRCODE = 'P0001';
    END IF;

    -- Generate UUID for new admin
    v_new_id := gen_random_uuid()::text;

    -- Insert first root admin
    INSERT INTO users (id, email, "passwordHash", "fullName", role, status, "updatedAt")
    VALUES (v_new_id, lower(trim(p_email)), p_password_hash, p_full_name, 'ADMIN', 'ACTIVE', NOW());

    -- Record in audit logs
    INSERT INTO audit_logs (id, timestamp, "actorId", "actorEmail", "actorRole", action, "resourceType", "resourceId", status, details)
    VALUES (
        gen_random_uuid()::text,
        NOW(),
        v_new_id,
        lower(trim(p_email)),
        'ADMIN',
        'ADMIN_BOOTSTRAP_EXECUTED',
        'USER',
        v_new_id,
        'SUCCESS',
        json_build_object('method', 'postgresql_function', 'environment', current_setting('server_version'))::text
    );

    -- Return newly created administrator details
    RETURN QUERY
    SELECT v_new_id, lower(trim(p_email)), 'ADMIN'::TEXT, 'Root administrator successfully initialized.'::TEXT;
END;
$$;

-- Step 6: Grant EXECUTE on bootstrap function strictly to bv_bootstrap_operator
REVOKE ALL ON FUNCTION bootstrap_first_admin(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION bootstrap_first_admin(TEXT, TEXT, TEXT) TO bv_bootstrap_operator;

-- Step 7: Future tables permission defaults
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO bv_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO bv_app_user;

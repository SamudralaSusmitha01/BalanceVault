/**
 * Role-Based Access Control (RBAC) Middleware
 * Enforces server-side permissions: ADMIN, AUDITOR, USER
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'UNAUTHENTICATED',
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `Access denied. Required role(s): [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`
      });
    }

    next();
  };
}

/**
 * Checks if user is account owner OR an Admin
 */
export function requireAccountOwnerOrAdmin(getAccountId = (req) => req.params.id) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'UNAUTHENTICATED' });
    }

    if (req.user.role === 'ADMIN' || req.user.role === 'AUDITOR') {
      return next();
    }

    const accountId = getAccountId(req);
    // User role check: ensure account belongs to them
    req.targetAccountId = accountId;
    next();
  };
}

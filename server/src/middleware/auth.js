import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { db } from '../db.js';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication token required'
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await db.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(401).json({
        error: 'USER_NOT_FOUND',
        message: 'Account no longer exists'
      });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({
        error: 'ACCOUNT_SUSPENDED',
        message: 'Your account has been suspended by compliance'
      });
    }

    // Attach authenticated user to request
    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'TOKEN_EXPIRED',
        message: 'Your session has expired. Please log in again.'
      });
    }
    return res.status(403).json({
      error: 'INVALID_TOKEN',
      message: 'Invalid or forged authentication credentials'
    });
  }
}

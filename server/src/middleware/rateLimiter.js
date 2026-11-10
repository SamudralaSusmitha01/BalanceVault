import { rateLimitCheck } from '../redis.js';
import { config } from '../config.js';

export function rateLimiter({
  limit = config.rateLimitMax,
  windowSeconds = Math.ceil(config.rateLimitWindowMs / 1000)
} = {}) {
  return async (req, res, next) => {
    // Exclude health/ready probes from aggressive rate limiting
    if (req.path === '/health' || req.path === '/ready') {
      return next();
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const key = `ratelimit:${clientIp}:${req.baseUrl || req.path}`;

    try {
      const result = await rateLimitCheck(key, limit, windowSeconds);

      res.setHeader('X-RateLimit-Limit', result.limit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, result.limit - result.current));
      res.setHeader('X-RateLimit-Reset', result.resetInSeconds);

      if (!result.allowed) {
        return res.status(429).json({
          error: 'TOO_MANY_REQUESTS',
          message: `Rate limit exceeded. Please retry after ${result.resetInSeconds} seconds.`,
          retryAfter: result.resetInSeconds
        });
      }

      next();
    } catch {
      // Fail open so users aren't locked out if rate-limiter encounters unexpected errors
      next();
    }
  };
}

import Redis from 'ioredis';
import { config } from './config.js';

let redisClient = null;
let isRedisConnected = false;

// In-memory sliding window fallback store
const inMemoryCounters = new Map();

// Clean up expired in-memory counters periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of inMemoryCounters.entries()) {
    if (now > data.resetTime) {
      inMemoryCounters.delete(key);
    }
  }
}, 30000);

try {
  redisClient = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // Don't spam retries if redis is not running
    connectTimeout: 1000,
    lazyConnect: true
  });

  redisClient.connect().then(() => {
    isRedisConnected = true;
    console.log('[Redis] Successfully connected to Redis instance at', config.redisUrl);
  }).catch(() => {
    isRedisConnected = false;
    console.log('[Redis] Redis not available. Operating seamlessly with in-memory sliding window rate limiter.');
  });

  redisClient.on('error', () => {
    isRedisConnected = false;
  });
} catch {
  isRedisConnected = false;
}

/**
 * Increments request count for a rate-limiting key over a window
 */
export async function rateLimitCheck(key, limit, windowSeconds) {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  if (isRedisConnected && redisClient) {
    try {
      const current = await redisClient.incr(key);
      if (current === 1) {
        await redisClient.expire(key, windowSeconds);
      }
      const ttl = await redisClient.ttl(key);
      return {
        allowed: current <= limit,
        current,
        limit,
        resetInSeconds: ttl > 0 ? ttl : windowSeconds
      };
    } catch {
      // Fallback to in-memory on redis command error
    }
  }

  // In-memory fallback
  let record = inMemoryCounters.get(key);
  if (!record || now > record.resetTime) {
    record = {
      count: 1,
      resetTime: now + windowMs
    };
  } else {
    record.count += 1;
  }
  inMemoryCounters.set(key, record);

  const resetInSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
  return {
    allowed: record.count <= limit,
    current: record.count,
    limit,
    resetInSeconds
  };
}

export async function getRedisHealth() {
  if (!isRedisConnected || !redisClient) {
    return {
      status: 'IN_MEMORY_FALLBACK',
      message: 'Redis disabled or unavailable; sliding-window memory limiter active'
    };
  }
  try {
    const start = Date.now();
    await redisClient.ping();
    return {
      status: 'CONNECTED',
      latencyMs: Date.now() - start
    };
  } catch (err) {
    return {
      status: 'DEGRADED',
      error: err.message
    };
  }
}

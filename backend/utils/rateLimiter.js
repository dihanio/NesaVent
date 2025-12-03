const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const { redis } = require('./cache');

// Custom Redis Store for express-rate-limit (compatible with ioredis)
class RedisStore {
  constructor(options = {}) {
    this.client = options.client || redis;
    this.prefix = options.prefix || 'rl:';
    this.resetExpiryOnChange = options.resetExpiryOnChange !== false;
  }

  async increment(key) {
    const prefixedKey = this.prefix + key;
    const current = await this.client.incr(prefixedKey);
    
    if (current === 1) {
      // First request, set expiry
      await this.client.expire(prefixedKey, this.windowMs / 1000);
    }
    
    return {
      totalHits: current,
      resetTime: new Date(Date.now() + this.windowMs)
    };
  }

  async decrement(key) {
    const prefixedKey = this.prefix + key;
    const current = await this.client.decr(prefixedKey);
    return current;
  }

  async resetKey(key) {
    const prefixedKey = this.prefix + key;
    await this.client.del(prefixedKey);
  }

  init(options) {
    this.windowMs = options.windowMs;
  }
}

// Production-grade rate limiters dengan Redis
// In development mode, increase limits to account for React Strict Mode (double rendering)
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * General API rate limiter
 * 100 permintaan per 15 menit per IP (production)
 * 500 permintaan per 15 menit per IP (development)
 */
const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:api:',
  }),
  windowMs: 15 * 60 * 1000, // 15 menit
  max: isDevelopment ? 500 : 100,
  message: {
    message: 'Terlalu banyak permintaan dari IP ini, silakan coba lagi nanti',
    retryAfter: '15 menit'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

/**
 * Strict rate limiter untuk authentication endpoints
 * 5 permintaan per 15 menit per IP (production)
 * 20 permintaan per 15 menit per IP (development)
 */
const authLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:auth:',
  }),
  windowMs: 15 * 60 * 1000, // 15 menit
  max: isDevelopment ? 20 : 5,
  message: {
    message: 'Terlalu banyak percobaan login, silakan coba lagi dalam 15 menit',
    retryAfter: '15 menit'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Tidak hitung login yang berhasil
});

/**
 * Order creation rate limiter
 * 10 order per jam per IP (production)
 * 50 order per jam per IP (development)
 */
const orderLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:order:',
  }),
  windowMs: 60 * 60 * 1000, // 1 jam
  max: isDevelopment ? 50 : 10,
  message: {
    message: 'Terlalu banyak percobaan pemesanan, silakan coba lagi dalam 1 jam',
    retryAfter: '1 jam'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * File upload rate limiter
 * 20 upload per jam per IP (production)
 * 100 upload per jam per IP (development)
 */
const uploadLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:upload:',
  }),
  windowMs: 60 * 60 * 1000, // 1 jam
  max: isDevelopment ? 100 : 20,
  message: {
    message: 'Terlalu banyak percobaan upload, silakan coba lagi dalam 1 jam',
    retryAfter: '1 jam'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Event creation rate limiter
 * 5 event per hari per user (production)
 * 25 event per hari per user (development)
 */
const eventCreationLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:event:',
  }),
  windowMs: 24 * 60 * 60 * 1000, // 24 jam
  max: isDevelopment ? 25 : 5,
  message: {
    message: 'Anda telah mencapai batas maksimal pembuatan event hari ini (5 event per hari)',
    retryAfter: '24 jam'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use user ID if authenticated, otherwise use IP with IPv6 support
  keyGenerator: (req, res) => {
    if (req.user?._id) {
      return `user:${req.user._id.toString()}`;
    }
    // Use ipKeyGenerator helper for proper IPv6 handling
    return ipKeyGenerator(req, res);
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  orderLimiter,
  uploadLimiter,
  eventCreationLimiter
};

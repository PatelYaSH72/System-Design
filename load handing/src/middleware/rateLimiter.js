const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis      = require('../config/redis');

// ✅ Redis store — saare workers ka ek shared counter
// Bina Redis ke: har worker ka alag counter = rate limit kaam nahi karta
const store = new RedisStore({
  sendCommand: (...args) => redis.call(...args),
  prefix: 'rl:', // Redis key prefix
});

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests per window
  standardHeaders: true,     // RateLimit-* headers return karo
  legacyHeaders: false,
  store,
  
  // ✅ Custom error message
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Bohot zyada requests bheje — 15 minute baad try karo',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

// Strict limiter — login/signup ke liye
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,                   // 10 login attempts only
  store,
  message: { success: false, message: 'Account temporarily locked' },
});

module.exports = { apiLimiter, authLimiter };
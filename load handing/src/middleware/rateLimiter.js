const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redis = require('../config/redis');


// ✅ API limiter store
const apiStore = new RedisStore({
  sendCommand: (...args) => redis.call(...args),
  prefix: 'rl:api:',
});


// ✅ Auth limiter store
const authStore = new RedisStore({
  sendCommand: (...args) => redis.call(...args),
  prefix: 'rl:auth:',
});


// ✅ General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  store: apiStore,
});


// ✅ Login/Auth limiter
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  store: authStore,
});


module.exports = {
  apiLimiter,
  authLimiter
};
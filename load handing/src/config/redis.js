const Redis = require('ioredis');
require('dotenv').config();

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,    // 3 baar try karo, phir fail karo
  enableReadyCheck: true,
  lazyConnect: false,
  
  // ✅ Reconnect strategy — production mein zaroori
  retryStrategy(times) {
    if (times > 5) return null; // 5 se zyada try mat karo
    return Math.min(times * 100, 2000); // 100ms, 200ms... max 2s
  },
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error',   (err) => console.error('❌ Redis error:', err.message));

module.exports = redis;
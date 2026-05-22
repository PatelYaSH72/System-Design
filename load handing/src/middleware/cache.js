const redis = require('../config/redis');

// ✅ Reusable cache middleware — kisi bhi route pe laga sakte ho
const cache = (ttlSeconds = 60) => {
  return async (req, res, next) => {
    
    // POST/PUT/DELETE cache mat karo — sirf GET
    if (req.method !== 'GET') return next();

    const key = `cache:${req.originalUrl}`;

    try {
      const cached = await redis.get(key);
      
      if (cached) {
        console.log(`🎯 Cache HIT: ${key}`);
        return res.json({
          ...JSON.parse(cached),
          _cache: 'HIT', // Debug ke liye — production mein hatao
        });
      }

      console.log(`💨 Cache MISS: ${key}`);

      const originalJson = res.json.bind(res);
      res.json = async (data) => {
        if (res.statusCode === 200) {
          await redis.setex(key, ttlSeconds, JSON.stringify(data));
        }
        return originalJson(data);
      };

      next();
      
    } catch (err) {
      // ⚠️ Redis fail ho toh bhi request serve karo — degrade gracefully
      console.error('Cache error (continuing without cache):', err.message);
      next();
    }
  };
};

// Cache invalidate karne ke liye — data update hone pe
const invalidateCache = async (pattern) => {
  const keys = await redis.keys(`cache:${pattern}`);
  if (keys.length > 0) {
    await redis.del(...keys);
    console.log(`🗑️ Invalidated ${keys.length} cache keys`);
  }
};

module.exports = { cache, invalidateCache };
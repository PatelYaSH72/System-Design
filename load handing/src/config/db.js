const mysql = require('mysql2/promise');
require('dotenv').config();

// ✅ Pool banao — har request ke liye naya connection nahi
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  connectionLimit: parseInt(process.env.DB_POOL_SIZE) || 10,
  // ⚠️ Yeh limit critical hai — 10 connections share honge
  // Bina pool ke: 100 requests = 100 connections = DB crash

  waitForConnections: true,   // Queue mein wait karo, reject mat karo
  queueLimit: 0,              // Unlimited queue (production mein 100 rakho)
  
  connectTimeout: 10000,      // 10 sec se zyada wait nahi
  
  // ✅ Idle connections close karo — memory bachao
  idleTimeout: 60000,
});

// Connection test on startup
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL Pool connected');
    conn.release(); // ← ZARURI hai — warna connection leak hoga
  })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1); // Start hi mat karo agar DB nahi mila
  });

module.exports = pool;
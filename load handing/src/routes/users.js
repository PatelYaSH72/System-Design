const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { cache, invalidateCache } = require('../middleware/cache');

// ✅ GET /users — Pagination + Cache + Projection
router.get('/', cache(30), async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
const limit = Number(req.query.limit) || 10;

const safePage = Math.max(1, page);
const safeLimit = Math.min(50, limit);

const offset = (safePage - 1) * safeLimit; // Max 50 — security
    

   const [rows] = await pool.query(
  `SELECT id, name, email, created_at
   FROM users
   WHERE is_active = 1
   ORDER BY id DESC
   LIMIT ${safeLimit} OFFSET ${offset}`
);

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM users WHERE is_active = 1`
    );

    res.json({
      success: true,
      data: rows,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
      }
    });

  } catch (err) {
    console.error('GET /users error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ✅ GET /users/:id — Single user with cache
router.get('/:id', cache(60), async (req, res) => {
  try {
    const { id } = req.params;
    
    // ✅ Parameterized query — SQL injection se protection
    const [rows] = await pool.execute(
      `SELECT id, name, email, role, created_at FROM users WHERE id = ? LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: rows[0] });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ✅ POST /users — Create + Cache invalidate
router.post('/', async (req, res) => {
  const conn = await pool.getConnection(); // Manual connection — transaction ke liye
  
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Saare fields zaroori hain' });
    }

    await conn.beginTransaction();

    const [result] = await conn.execute(
      `INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, NOW())`,
      [name, email, password] // Real app mein bcrypt use karo
    );

    await conn.commit();

    // ✅ Naya user aaya — users list ka cache invalid karo
    await invalidateCache('/api/users*');

    res.status(201).json({
      success: true,
      data: { id: result.insertId, name, email }
    });

  } catch (err) {
    await conn.rollback(); // ❌ Error? Rollback karo
    
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
    
  } finally {
    conn.release(); 
  }
});

module.exports = router;
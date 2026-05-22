const express    = require('express');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const usersRoute = require('./routes/users');

const app = express();

app.use(express.json({ limit: '10kb' })); // ⚠️ Large payload attacks se bachao

// ✅ Rate limiting globally
app.use('/api/', apiLimiter);

// ✅ Routes
app.use('/api/users', usersRoute);

// Health check — load balancer ke liye zaroori
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    worker: process.pid,  // Konsa worker serve kar raha hai — debug ke liye
    uptime: process.uptime(),
  });
});

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error(`[Worker ${process.pid}] Error:`, err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

module.exports = app;
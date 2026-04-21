const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

//══════════ Middleware ══════════
app.use(cors());
app.use(express.json());

//══════════ Routes ══════════
const productRoutes = require('./routes/product');
app.use('/api/products', productRoutes);

//══════════ Test route ══════════
app.get('/', (req, res) => {
  res.json({ 
    message: 'Nursery Platform API Running',
    status: 'OK',
    version: '1.0.0'
  });
});

//══════════ Test database connection ══════════
app.get('/api/test', async (req, res) => {
  try {
    const pool = require('./config/database');
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT 1 + 1 as result');
    connection.release();
    
    res.json({
      message: 'Database connected successfully',
      result: rows[0].result,
      status: 'OK'
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      message: 'Database connection failed',
      error: error.message,
      status: 'ERROR'
    });
  }
});

//══════════ 404 handler ══════════
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

//══════════ Error handler ══════════
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

//══════════ Start server ══════════
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n╔═════════════════════════════════════════════╗`);
  console.log(`║  🚀 Nursery Platform API Server             ║`);
  console.log(`╠═════════════════════════════════════════════╣`);
  console.log(`║  ✓ Running on port ${PORT}                     ║`);
  console.log(`║  ✓ Environment: ${process.env.NODE_ENV || 'development'}                 ║`);
  console.log(`╠═════════════════════════════════════════════╣`);
  console.log(`║  📍 API Endpoints:                          ║`);
  console.log(`║  GET  http://localhost:${PORT}/                ║`);
  console.log(`║  GET  http://localhost:${PORT}/api/test        ║`);
  console.log(`║  GET  http://localhost:${PORT}/api/product     ║`);
  console.log(`╚═════════════════════════════════════════════╝\n`);
});
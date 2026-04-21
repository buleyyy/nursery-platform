const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= ROUTES =================
const productRoutes = require('./routes/product');
app.use('/api/products', productRoutes);

// Root endpoint
app.get('/', (req, res) => {
  return res.status(200).json({
    message: 'Nursery Platform API Running',
    status: 'OK',
    version: '1.0.0'
  });
});

// ================= DATABASE TEST =================
const pool = require('./config/database'); 

app.get('/api/test', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');

    return res.status(200).json({
      message: 'Database connected successfully',
      result: rows[0].result,
      status: 'OK'
    });

  } catch (error) {
    console.error('Database error:', error);

    return res.status(500).json({
      message: 'Database connection failed',
      status: 'ERROR'
    });
  }
});

// ================= 404 HANDLER =================
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl 
  });
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error('Global Error:', err);

  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`
=========================================
  Nursery Platform API Server
=========================================
  Running on port : ${PORT}
  Environment     : ${process.env.NODE_ENV || 'development'}
  Database        : ${process.env.DB_NAME}
=========================================
  API Endpoints:
  GET  http://localhost:${PORT}/
  GET  http://localhost:${PORT}/api/test
  GET  http://localhost:${PORT}/api/products
  GET  http://localhost:${PORT}/api/products/:id
  POST http://localhost:${PORT}/api/products
=========================================
`);
});
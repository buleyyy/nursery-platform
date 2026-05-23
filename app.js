const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const runMigrations = require('./config/migrate');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Static files ────────────────────────────────────────────────────────────
app.use('/api/proof',          express.static(path.join(__dirname, 'uploads', 'payment-proofs')));
app.use('/api/product-images', express.static(path.join(__dirname, 'uploads', 'product-images')));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/product'));
app.use('/api/orders',   require('./routes/order'));
app.use('/api/admin',    require('./routes/admin'));

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'H. Ali Nursery API — OK', version: '2.0.0' });
});

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.path} tidak ditemukan` });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3006;

app.listen(PORT, async () => {
  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║  🌿 H. Ali Nursery API v2.0            ║`);
  console.log(`║  http://localhost:${PORT}                 ║`);
  console.log(`╠════════════════════════════════════════╣`);
  console.log(`║  POST  /api/auth/login                 ║`);
  console.log(`║  GET   /api/products                   ║`);
  console.log(`║  POST  /api/orders                     ║`);
  console.log(`║  POST  /api/orders/upload-proof        ║`);
  console.log(`║  GET   /api/orders/track               ║`);
  console.log(`║  GET   /api/admin/dashboard  [auth]    ║`);
  console.log(`╚════════════════════════════════════════╝`);

  await runMigrations();
});

const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const runMigrations = require('./config/migrate');

const app = express();

// CORS — allow semua subdomain vercel.app + localhost
app.use(cors({
  origin: (origin, callback) => {
    // allow: no origin (curl/mobile), localhost, semua *.vercel.app, dan FRONTEND_URL
    if (
      !origin ||
      origin.includes('localhost') ||
      origin.endsWith('.vercel.app') ||
      origin === process.env.FRONTEND_URL
    ) {
      callback(null, true);
    } else {
      callback(new Error('CORS: origin tidak diizinkan: ' + origin));
    }
  },
  credentials: true,
}));

app.use(express.json());

// Static files (upload produk & bukti transfer)
app.use('/api/proof',          express.static(path.join(__dirname, 'uploads', 'payment-proofs')));
app.use('/api/product-images', express.static(path.join(__dirname, 'uploads', 'product-images')));

// Routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/product'));
app.use('/api/orders',   require('./routes/order'));
app.use('/api/admin',    require('./routes/admin'));

// Health Check
app.get('/', (req, res) => {
  res.json({ message: 'H. Ali Nursery API — OK', version: '2.0.0' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.path} tidak ditemukan` });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// Start
const PORT = process.env.PORT || 3006;

/**
 * Retry DB migration — Railway MySQL kadang belum siap saat container start.
 * Coba 5x dengan jeda 3 detik.
 */
async function runMigrationsWithRetry(retries = 5, delayMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await runMigrations();
      return; // sukses
    } catch (err) {
      console.error(`  [migrate] ❌ Attempt ${attempt}/${retries} gagal: ${err.message}`);
      if (attempt < retries) {
        console.log(`  [migrate] ⏳ Retry dalam ${delayMs / 1000}s …`);
        await new Promise(r => setTimeout(r, delayMs));
      } else {
        console.error('  [migrate] ⚠️  Semua retry habis. Server tetap jalan, DB mungkin belum siap.');
      }
    }
  }
}

app.listen(PORT, async () => {
  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║  🌿 H. Ali Nursery API v2.0            ║`);
  console.log(`║  PORT: ${PORT}${' '.repeat(30 - String(PORT).length)}║`);
  console.log(`╠════════════════════════════════════════╣`);
  console.log(`║  POST  /api/auth/login                 ║`);
  console.log(`║  GET   /api/products                   ║`);
  console.log(`║  POST  /api/orders                     ║`);
  console.log(`║  POST  /api/orders/upload-proof        ║`);
  console.log(`║  GET   /api/orders/track               ║`);
  console.log(`║  GET   /api/admin/dashboard  [auth]    ║`);
  console.log(`╚════════════════════════════════════════╝`);

  await runMigrationsWithRetry();
});

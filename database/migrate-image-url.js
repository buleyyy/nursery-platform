// Jalankan: node database/migrate-image-url.js
// Menambah kolom image_url ke tabel products jika belum ada

require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port:     process.env.DB_PORT || 3306,
  });

  try {
    // Cek apakah kolom sudah ada
    const [cols] = await conn.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products' AND COLUMN_NAME = 'image_url'
    `, [process.env.DB_NAME]);

    if (cols.length > 0) {
      console.log('✅ Kolom image_url sudah ada, tidak perlu migrasi.');
    } else {
      await conn.query(`
        ALTER TABLE products
        ADD COLUMN image_url VARCHAR(500) DEFAULT NULL AFTER image_emoji
      `);
      console.log('✅ Kolom image_url berhasil ditambahkan ke tabel products.');
    }
  } catch (err) {
    console.error('❌ Migration gagal:', err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

migrate();

/**
 * debug-db.js — Tampilkan struktur tabel aktual dari database
 * Jalankan: node debug-db.js
 * Hapus file ini setelah masalah selesai.
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function debug() {
  const db = process.env.DB_NAME || 'nursery_db';
  console.log(`\n🔍 Inspecting database: ${db}\n`);

  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    port:     Number(process.env.DB_PORT) || 3306,
    database: db,
  });

  try {
    const [tables] = await conn.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME`, [db]
    );

    if (tables.length === 0) {
      console.log('❌ Tidak ada tabel di database ini!');
      console.log('   Jalankan: node setup-db.js\n');
      return;
    }

    for (const { TABLE_NAME } of tables) {
      const [cols] = await conn.query(
        `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
         ORDER BY ORDINAL_POSITION`,
        [db, TABLE_NAME]
      );
      console.log(`┌─ ${TABLE_NAME} (${cols.length} kolom)`);
      cols.forEach(c => {
        const nullable = c.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
        const def      = c.COLUMN_DEFAULT !== null ? ` DEFAULT '${c.COLUMN_DEFAULT}'` : '';
        const extra    = c.EXTRA ? ` [${c.EXTRA}]` : '';
        console.log(`│  ${c.COLUMN_NAME.padEnd(22)} ${c.COLUMN_TYPE.padEnd(30)} ${nullable}${def}${extra}`);
      });

      // Hitung row count
      const [[{ n }]] = await conn.query(`SELECT COUNT(*) AS n FROM \`${TABLE_NAME}\``);
      console.log(`└─ ${n} rows\n`);
    }

    // Cek kolom wajib
    const required = {
      orders:    ['order_status', 'payment_status', 'total_price', 'customer_id', 'order_number'],
      customers: ['phone_number', 'name', 'email'],
      products:  ['stock_quantity', 'is_active', 'category_id', 'price'],
    };

    console.log('─── Validasi kolom wajib ───');
    for (const [tbl, cols] of Object.entries(required)) {
      for (const col of cols) {
        const [r] = await conn.query(
          `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?`,
          [db, tbl, col]
        );
        const ok = r[0].n > 0;
        console.log(`  ${ok ? '✅' : '❌'} ${tbl}.${col}`);
      }
    }
    console.log('');

  } catch (err) {
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.error(`❌ Database "${db}" tidak ada. Jalankan: node setup-db.js\n`);
    } else if (err.code === 'ECONNREFUSED') {
      console.error('❌ MySQL tidak bisa diakses. Pastikan XAMPP/MySQL berjalan!\n');
    } else {
      console.error('❌ Error:', err.message);
    }
  } finally {
    await conn.end();
  }
}

debug();

/**
 * migrate.js — Jalankan sekali untuk memperbaiki schema database
 * Usage: node migrate.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  console.log('\n🌿 Ali Nursery — Database Migration\n');

  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'nursery_db',
    port:     Number(process.env.DB_PORT) || 3306,
    multipleStatements: true,
  });

  try {
    // 1. Cek apakah tabel customers ada
    const [tables] = await conn.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'customers'`,
      [process.env.DB_NAME || 'nursery_db']
    );

    if (tables.length === 0) {
      console.log('⚠  Tabel customers belum ada. Buat dari schema.sql dulu.');
      console.log('   mysql -u root -p < database/schema.sql');
      process.exit(1);
    }

    // 2. Cek kolom yang ada di tabel customers
    const [cols] = await conn.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'customers'`,
      [process.env.DB_NAME || 'nursery_db']
    );
    const colNames = cols.map(c => c.COLUMN_NAME);
    console.log('📋 Kolom saat ini:', colNames.join(', '));

    // 3. Tambahkan phone_number jika belum ada
    if (!colNames.includes('phone_number')) {
      console.log('🔧 Menambahkan kolom phone_number...');
      await conn.query(`
        ALTER TABLE customers
        ADD COLUMN phone_number VARCHAR(20) UNIQUE AFTER id
      `);
      console.log('✅ Kolom phone_number berhasil ditambahkan!');
    } else {
      console.log('✅ Kolom phone_number sudah ada.');
    }

    // 4. Tambahkan kolom lain jika ada yang kurang
    if (!colNames.includes('email')) {
      await conn.query(`ALTER TABLE customers ADD COLUMN email VARCHAR(150) AFTER name`);
      console.log('✅ Kolom email ditambahkan.');
    }
    if (!colNames.includes('address')) {
      await conn.query(`ALTER TABLE customers ADD COLUMN address TEXT AFTER email`);
      console.log('✅ Kolom address ditambahkan.');
    }
    if (!colNames.includes('created_at')) {
      await conn.query(`ALTER TABLE customers ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      console.log('✅ Kolom created_at ditambahkan.');
    }

    // 5. Verifikasi struktur akhir
    const [finalCols] = await conn.query(
      `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'customers'
       ORDER BY ORDINAL_POSITION`,
      [process.env.DB_NAME || 'nursery_db']
    );
    console.log('\n📊 Struktur tabel customers setelah migration:');
    finalCols.forEach(c => {
      console.log(`   ${c.COLUMN_NAME.padEnd(20)} ${c.COLUMN_TYPE.padEnd(20)} nullable:${c.IS_NULLABLE}`);
    });

    console.log('\n🎉 Migration selesai! Restart server backend sekarang.\n');
  } catch (err) {
    console.error('❌ Migration gagal:', err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

migrate();

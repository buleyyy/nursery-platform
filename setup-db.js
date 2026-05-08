/**
 * setup-db.js — Database Setup & Repair
 * Jalankan: node setup-db.js
 *
 * - Buat database & semua tabel jika belum ada
 * - Deteksi kolom yang salah nama / kurang → rename / tambah otomatis
 * - Seed data awal jika tabel kosong
 * - AMAN dijalankan berulang kali (idempotent)
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function setup() {
  console.log('\n🌿 Ali Nursery — Database Setup & Repair\n');

  const db = process.env.DB_NAME || 'nursery_db';

  // Koneksi TANPA database dulu (agar bisa CREATE DATABASE)
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    port:     Number(process.env.DB_PORT) || 3306,
    multipleStatements: false,
  });

  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${db}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE \`${db}\``);
    console.log(`✅ Database "${db}" siap\n`);

    // ── Helpers ──────────────────────────────────────────────────────────────

    /** Cek apakah kolom ada di tabel */
    const hasCol = async (table, col) => {
      const [r] = await conn.query(
        `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [db, table, col]
      );
      return r[0].n > 0;
    };

    /** Ambil semua nama kolom di tabel */
    const getCols = async (table) => {
      const [rows] = await conn.query(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
         ORDER BY ORDINAL_POSITION`,
        [db, table]
      );
      return rows.map(r => r.COLUMN_NAME);
    };

    /** Tambah kolom jika belum ada */
    const addCol = async (table, col, definition) => {
      if (!await hasCol(table, col)) {
        await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` ${definition}`);
        console.log(`  ✚ ADD   ${table}.${col}`);
      }
    };

    /** Rename kolom jika nama lama ada tapi nama baru belum */
    const renameCol = async (table, oldCol, newCol, definition) => {
      const hasOld = await hasCol(table, oldCol);
      const hasNew = await hasCol(table, newCol);
      if (hasOld && !hasNew) {
        await conn.query(`ALTER TABLE \`${table}\` CHANGE \`${oldCol}\` \`${newCol}\` ${definition}`);
        console.log(`  ✎ RENAME ${table}.${oldCol} → ${newCol}`);
      } else if (!hasOld && !hasNew) {
        await addCol(table, newCol, definition);
      }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // TABEL: categories
    // ─────────────────────────────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`categories\` (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        name        VARCHAR(100) NOT NULL,
        description TEXT,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4`);
    await addCol('categories', 'description', 'TEXT');
    await addCol('categories', 'created_at',  'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    console.log('  ✅ categories OK');

    // ─────────────────────────────────────────────────────────────────────────
    // TABEL: customers
    // ─────────────────────────────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`customers\` (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        phone_number VARCHAR(20) UNIQUE,
        name         VARCHAR(150) NOT NULL DEFAULT '',
        email        VARCHAR(150),
        address      TEXT,
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4`);

    // Kemungkinan nama lama: no_hp, nomor_hp, telp, phone
    await renameCol('customers', 'no_hp',    'phone_number', 'VARCHAR(20)');
    await renameCol('customers', 'nomor_hp', 'phone_number', 'VARCHAR(20)');
    await renameCol('customers', 'telp',     'phone_number', 'VARCHAR(20)');
    await renameCol('customers', 'phone',    'phone_number', 'VARCHAR(20)');
    await addCol('customers', 'phone_number', 'VARCHAR(20) UNIQUE');
    await addCol('customers', 'email',        'VARCHAR(150)');
    await addCol('customers', 'address',      'TEXT');
    await addCol('customers', 'created_at',   'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    console.log('  ✅ customers OK');

    // ─────────────────────────────────────────────────────────────────────────
    // TABEL: products
    // ─────────────────────────────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`products\` (
        id                INT AUTO_INCREMENT PRIMARY KEY,
        category_id       INT NOT NULL DEFAULT 1,
        name              VARCHAR(200) NOT NULL DEFAULT '',
        description       TEXT,
        care_instructions TEXT,
        price             DECIMAL(12,2) NOT NULL DEFAULT 0,
        stock_quantity    INT NOT NULL DEFAULT 0,
        image_emoji       VARCHAR(20) DEFAULT '🌿',
        is_active         TINYINT(1) DEFAULT 1,
        created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4`);

    // Kemungkinan nama lama
    await renameCol('products', 'stok',     'stock_quantity', 'INT NOT NULL DEFAULT 0');
    await renameCol('products', 'stock',    'stock_quantity', 'INT NOT NULL DEFAULT 0');
    await renameCol('products', 'qty',      'stock_quantity', 'INT NOT NULL DEFAULT 0');
    await renameCol('products', 'quantity', 'stock_quantity', 'INT NOT NULL DEFAULT 0');
    await renameCol('products', 'kategori_id',  'category_id', 'INT NOT NULL DEFAULT 1');
    await renameCol('products', 'active',        'is_active',   'TINYINT(1) DEFAULT 1');
    await renameCol('products', 'status',        'is_active',   'TINYINT(1) DEFAULT 1');
    await renameCol('products', 'emoji',         'image_emoji', "VARCHAR(20) DEFAULT '🌿'");
    await renameCol('products', 'icon',          'image_emoji', "VARCHAR(20) DEFAULT '🌿'");
    await renameCol('products', 'perawatan',     'care_instructions', 'TEXT');
    await addCol('products', 'category_id',       'INT NOT NULL DEFAULT 1');
    await addCol('products', 'description',       'TEXT');
    await addCol('products', 'care_instructions', 'TEXT');
    await addCol('products', 'stock_quantity',    'INT NOT NULL DEFAULT 0');
    await addCol('products', 'image_emoji',       "VARCHAR(20) DEFAULT '🌿'");
    await addCol('products', 'is_active',         'TINYINT(1) DEFAULT 1');
    await addCol('products', 'created_at',        'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    console.log('  ✅ products OK');

    // ─────────────────────────────────────────────────────────────────────────
    // TABEL: inventory_log
    // ─────────────────────────────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`inventory_log\` (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        product_id      INT NOT NULL,
        change_type     VARCHAR(20) NOT NULL DEFAULT 'adjustment',
        quantity_change INT NOT NULL DEFAULT 0,
        quantity_before INT NOT NULL DEFAULT 0,
        quantity_after  INT NOT NULL DEFAULT 0,
        reference_id    INT,
        notes           TEXT,
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4`);
    await addCol('inventory_log', 'quantity_before', 'INT NOT NULL DEFAULT 0');
    await addCol('inventory_log', 'quantity_after',  'INT NOT NULL DEFAULT 0');
    await addCol('inventory_log', 'reference_id',    'INT');
    console.log('  ✅ inventory_log OK');

    // ─────────────────────────────────────────────────────────────────────────
    // TABEL: orders
    // ─────────────────────────────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`orders\` (
        id               INT AUTO_INCREMENT PRIMARY KEY,
        order_number     VARCHAR(30) UNIQUE NOT NULL DEFAULT '',
        customer_id      INT NOT NULL DEFAULT 0,
        order_date       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        order_status     VARCHAR(20) NOT NULL DEFAULT 'pending',
        payment_status   VARCHAR(20) NOT NULL DEFAULT 'pending',
        total_price      DECIMAL(12,2) NOT NULL DEFAULT 0,
        shipping_address TEXT,
        notes            TEXT,
        updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4`);

    // Deteksi & rename nama kolom lama yang sering dipakai
    const orderCols = await getCols('orders');
    console.log(`  [orders] kolom saat ini: ${orderCols.join(', ')}`);

    // order_status — cek semua kemungkinan nama lama
    await renameCol('orders', 'status',         'order_status',   "VARCHAR(20) NOT NULL DEFAULT 'pending'");
    await renameCol('orders', 'order_state',    'order_status',   "VARCHAR(20) NOT NULL DEFAULT 'pending'");
    await renameCol('orders', 'status_pesanan', 'order_status',   "VARCHAR(20) NOT NULL DEFAULT 'pending'");
    await addCol('orders', 'order_status',    "VARCHAR(20) NOT NULL DEFAULT 'pending'");

    // payment_status
    await renameCol('orders', 'status_bayar',  'payment_status', "VARCHAR(20) NOT NULL DEFAULT 'pending'");
    await renameCol('orders', 'pay_status',    'payment_status', "VARCHAR(20) NOT NULL DEFAULT 'pending'");
    await renameCol('orders', 'bayar',         'payment_status', "VARCHAR(20) NOT NULL DEFAULT 'pending'");
    await addCol('orders', 'payment_status', "VARCHAR(20) NOT NULL DEFAULT 'pending'");

    // Kolom lain
    await renameCol('orders', 'no_pesanan',    'order_number',   'VARCHAR(30)');
    await renameCol('orders', 'kode_order',    'order_number',   'VARCHAR(30)');
    await renameCol('orders', 'id_customer',   'customer_id',    'INT NOT NULL DEFAULT 0');
    await renameCol('orders', 'tanggal',       'order_date',     'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    await renameCol('orders', 'total',         'total_price',    'DECIMAL(12,2) NOT NULL DEFAULT 0');
    await renameCol('orders', 'harga_total',   'total_price',    'DECIMAL(12,2) NOT NULL DEFAULT 0');
    await renameCol('orders', 'alamat',        'shipping_address','TEXT');
    await renameCol('orders', 'catatan',       'notes',          'TEXT');
    await addCol('orders', 'order_number',     'VARCHAR(30)');
    await addCol('orders', 'customer_id',      'INT NOT NULL DEFAULT 0');
    await addCol('orders', 'order_date',       'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    await addCol('orders', 'total_price',      'DECIMAL(12,2) NOT NULL DEFAULT 0');
    await addCol('orders', 'shipping_address', 'TEXT');
    await addCol('orders', 'notes',            'TEXT');

    const orderColsFinal = await getCols('orders');
    console.log(`  [orders] kolom akhir:    ${orderColsFinal.join(', ')}`);
    console.log('  ✅ orders OK');

    // ─────────────────────────────────────────────────────────────────────────
    // TABEL: order_items
    // ─────────────────────────────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`order_items\` (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        order_id      INT NOT NULL DEFAULT 0,
        product_id    INT NOT NULL DEFAULT 0,
        quantity      INT NOT NULL DEFAULT 1,
        price_at_time DECIMAL(12,2) NOT NULL DEFAULT 0,
        subtotal      DECIMAL(12,2) NOT NULL DEFAULT 0
      ) CHARACTER SET utf8mb4`);

    await renameCol('order_items', 'harga',        'price_at_time', 'DECIMAL(12,2) NOT NULL DEFAULT 0');
    await renameCol('order_items', 'price',         'price_at_time', 'DECIMAL(12,2) NOT NULL DEFAULT 0');
    await renameCol('order_items', 'unit_price',    'price_at_time', 'DECIMAL(12,2) NOT NULL DEFAULT 0');
    await renameCol('order_items', 'id_order',      'order_id',      'INT NOT NULL DEFAULT 0');
    await renameCol('order_items', 'id_produk',     'product_id',    'INT NOT NULL DEFAULT 0');
    await renameCol('order_items', 'jumlah',        'quantity',      'INT NOT NULL DEFAULT 1');
    await renameCol('order_items', 'total',         'subtotal',      'DECIMAL(12,2) NOT NULL DEFAULT 0');
    await addCol('order_items', 'price_at_time', 'DECIMAL(12,2) NOT NULL DEFAULT 0');
    await addCol('order_items', 'subtotal',      'DECIMAL(12,2) NOT NULL DEFAULT 0');
    console.log('  ✅ order_items OK');

    // ─────────────────────────────────────────────────────────────────────────
    // TABEL: payment_records
    // ─────────────────────────────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`payment_records\` (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        order_id       INT NOT NULL UNIQUE DEFAULT 0,
        amount_due     DECIMAL(12,2) NOT NULL DEFAULT 0,
        amount_paid    DECIMAL(12,2),
        payment_method VARCHAR(50),
        payment_proof  TEXT,
        payment_status VARCHAR(20) DEFAULT 'pending',
        paid_at        TIMESTAMP NULL,
        notes          TEXT,
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4`);

    await renameCol('payment_records', 'id_order',    'order_id',       'INT NOT NULL DEFAULT 0');
    await renameCol('payment_records', 'nominal',     'amount_due',     'DECIMAL(12,2) NOT NULL DEFAULT 0');
    await renameCol('payment_records', 'metode',      'payment_method', 'VARCHAR(50)');
    await renameCol('payment_records', 'status',      'payment_status', "VARCHAR(20) DEFAULT 'pending'");
    await addCol('payment_records', 'amount_paid',    'DECIMAL(12,2)');
    await addCol('payment_records', 'payment_proof',  'TEXT');
    await addCol('payment_records', 'paid_at',        'TIMESTAMP NULL');
    console.log('  ✅ payment_records OK');

    // ─────────────────────────────────────────────────────────────────────────
    // SEED: categories (jika kosong)
    // ─────────────────────────────────────────────────────────────────────────
    const [[{ catN }]] = await conn.query('SELECT COUNT(*) AS catN FROM categories');
    if (Number(catN) === 0) {
      await conn.query(`
        INSERT INTO categories (name, description) VALUES
        ('Anggrek',           'Tanaman anggrek premium berbagai jenis'),
        ('Bonsai',            'Bonsai artistik dengan perawatan khusus'),
        ('Sukulen & Kaktus',  'Tanaman tahan kering, minim perawatan'),
        ('Tanaman Hias Daun', 'Tanaman foliage indah untuk interior'),
        ('Tanaman Gantung',   'Cocok untuk pot gantung dan railing')`);
      console.log('\n  ✅ Seed categories');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SEED: products (jika kosong)
    // ─────────────────────────────────────────────────────────────────────────
    const [[{ prodN }]] = await conn.query('SELECT COUNT(*) AS prodN FROM products');
    if (Number(prodN) === 0) {
      const [cats] = await conn.query('SELECT id, name FROM categories ORDER BY id');
      const m = {};
      cats.forEach(c => { m[c.name] = c.id; });
      const c1 = m['Anggrek']           || 1;
      const c2 = m['Bonsai']            || 2;
      const c3 = m['Sukulen & Kaktus']  || 3;
      const c4 = m['Tanaman Hias Daun'] || 4;
      const c5 = m['Tanaman Gantung']   || 5;

      await conn.query(`
        INSERT INTO products
          (category_id, name, description, care_instructions, price, stock_quantity, image_emoji, is_active)
        VALUES
          (${c1},'Anggrek Bulan Putih','Anggrek bulan cantik bunga putih bersih, hadiah istimewa','Siram 2x seminggu, tempat terang tidak langsung matahari',285000,8,'🌸',1),
          (${c1},'Anggrek Dendrobium','Anggrek ungu cerah berbunga lebat','Siram setiap 3 hari, pupuk sebulan sekali',175000,5,'🌺',1),
          (${c2},'Bonsai Beringin Mini','Bonsai beringin 5 tahun akar aerial artistik tinggi ±25cm','Siram setiap hari, semprot daun pagi hari',850000,3,'🌳',1),
          (${c2},'Bonsai Serut 30cm','Bonsai serut informal upright sudah dibentuk 3 tahun','Siram pagi dan sore, taruh di tempat terang',620000,2,'🌲',1),
          (${c3},'Echeveria Mix Pot','Sukulen echeveria warna-warni pot keramik 12cm','Siram seminggu sekali butuh sinar matahari penuh',65000,20,'🪴',1),
          (${c3},'Kaktus Box Set','Set 3 kaktus unik pot tanah liat cocok meja kerja','Siram 2 minggu sekali jangan overwater',95000,15,'🌵',1),
          (${c4},'Monstera Deliciosa','Monstera daun berlubang ikonik interior modern minimalis','Siram 2x seminggu lap daun dengan kain basah',320000,6,'🌿',1),
          (${c4},'Philodendron Brasil','Corak kuning-hijau unik mudah dirawat','Siram saat media tanam mulai kering',145000,12,'🍃',1),
          (${c5},'Sirih Gading Marble','Corak putih-hijau marble cocok digantung di kamar','Siram 2x seminggu tahan di tempat kurang cahaya',85000,15,'🌱',1),
          (${c5},'String of Pearls','Tanaman manik-manik hijau sangat estetik','Siram seminggu sekali butuh cahaya terang tidak langsung',120000,7,'💚',1)`);
      console.log('  ✅ Seed products');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VALIDASI AKHIR
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n📊 Struktur tabel akhir:');
    for (const tbl of ['categories','customers','products','orders','order_items','payment_records']) {
      const cols = await getCols(tbl);
      console.log(`  ${tbl.padEnd(20)} [${cols.join(', ')}]`);
    }

    // Wajib ada ini
    const mustHave = {
      orders:    ['order_status', 'payment_status', 'total_price', 'customer_id', 'order_number'],
      customers: ['phone_number', 'name', 'email', 'address'],
      products:  ['stock_quantity', 'is_active', 'category_id', 'price'],
    };
    let allOk = true;
    for (const [tbl, cols] of Object.entries(mustHave)) {
      for (const col of cols) {
        if (!await hasCol(tbl, col)) {
          console.error(`  ❌ MISSING: ${tbl}.${col}`);
          allOk = false;
        }
      }
    }

    if (allOk) {
      console.log('\n🎉 Setup selesai! Semua kolom OK.');
      console.log('   Jalankan server: npm run dev\n');
    } else {
      console.error('\n⚠  Ada kolom yang masih kurang. Cek error di atas.\n');
    }

  } catch (err) {
    console.error('\n❌ Setup gagal:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('   → Pastikan MySQL/XAMPP sudah berjalan!');
    }
    process.exit(1);
  } finally {
    await conn.end();
  }
}

setup();

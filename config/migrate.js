/**
 * config/migrate.js
 * Auto-migration — jalan otomatis setiap server start.
 * Aman dijalankan berulang kali (idempotent).
 */

const pool = require('./database.js');

// Mapping emoji lama → key ikon baru (sketchy SVG)
const EMOJI_TO_KEY = {
  '🌺': 'flower', '🌸': 'flower', '🌼': 'flower', '🌻': 'sun',
  '🌹': 'rose',   '🌷': 'flower', '🪷': 'orchid',
  '🌿': 'leaf',   '🍀': 'leaf',   '🍃': 'leaf',
  '🌱': 'sprout', '🪴': 'pot',    '🌵': 'cactus',
  '🎋': 'bamboo', '🎍': 'bamboo',
  '🌴': 'palm',   '🌲': 'tree',   '🌳': 'tree',
  '🌾': 'herb',   '🌙': 'garden', '⭐': 'sun',
  '🏡': 'indoor', '🎑': 'garden', '🫚': 'fruit',
  '💚': 'leaf',   '🌏': 'outdoor',
};

async function runMigrations() {
  const conn = await pool.getConnection();
  const db   = process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'nursery_db';

  // ── Create tables if not exist ──────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      name        VARCHAR(100) NOT NULL,
      description TEXT,
      icon        VARCHAR(30) DEFAULT NULL,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS products (
      id                INT AUTO_INCREMENT PRIMARY KEY,
      category_id       INT NOT NULL DEFAULT 1,
      product_code      VARCHAR(50) DEFAULT NULL,
      name              VARCHAR(200) NOT NULL,
      description       TEXT,
      care_instructions TEXT,
      price             DECIMAL(12,2) NOT NULL DEFAULT 0,
      stock_quantity    INT NOT NULL DEFAULT 0,
      image_emoji       VARCHAR(20) DEFAULT '🌿',
      image_url         VARCHAR(500) DEFAULT NULL,
      is_active         TINYINT(1) DEFAULT 1,
      created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      name         VARCHAR(150) NOT NULL,
      phone_number VARCHAR(20),
      email        VARCHAR(150),
      address      TEXT,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id               INT AUTO_INCREMENT PRIMARY KEY,
      order_number     VARCHAR(30),
      customer_id      INT NOT NULL DEFAULT 0,
      total_price      DECIMAL(12,2) NOT NULL DEFAULT 0,
      order_status     VARCHAR(20) NOT NULL DEFAULT 'pending',
      payment_status   VARCHAR(20) NOT NULL DEFAULT 'pending',
      shipping_address TEXT,
      notes            TEXT,
      order_date       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      order_id      INT NOT NULL,
      product_id    INT NOT NULL,
      quantity      INT NOT NULL DEFAULT 1,
      price_at_time DECIMAL(12,2) NOT NULL DEFAULT 0,
      subtotal      DECIMAL(12,2) NOT NULL DEFAULT 0
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS payment_records (
      id             INT AUTO_INCREMENT PRIMARY KEY,
      order_id       INT NOT NULL,
      amount_paid    DECIMAL(12,2),
      payment_proof  TEXT,
      payment_method VARCHAR(50),
      payment_status VARCHAR(20) DEFAULT 'pending',
      paid_at        TIMESTAMP NULL
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      username   VARCHAR(100) NOT NULL UNIQUE,
      password   VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('  [migrate] ✅ Tables ready');

  const hasCol = async (table, col) => {
    const [r] = await conn.query(
      `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?`,
      [db, table, col]
    );
    return r[0].n > 0;
  };

  const addCol = async (table, col, def) => {
    if (!await hasCol(table, col)) {
      try {
        await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` ${def}`);
        console.log(`  [migrate] ✚ ADD ${table}.${col}`);
      } catch (e) {
        // Duplicate race condition — abaikan
      }
    }
  };

  const renameCol = async (table, oldCol, newCol, def) => {
    const hasOld = await hasCol(table, oldCol);
    const hasNew = await hasCol(table, newCol);
    if (hasOld && !hasNew) {
      try {
        await conn.query(`ALTER TABLE \`${table}\` CHANGE \`${oldCol}\` \`${newCol}\` ${def}`);
        console.log(`  [migrate] ✎ RENAME ${table}.${oldCol} → ${newCol}`);
      } catch (e) {
        console.log(`  [migrate] ⚠ rename ${oldCol}: ${e.message}`);
      }
    } else if (!hasOld && !hasNew) {
      await addCol(table, newCol, def);
    }
  };

  try {
    console.log('  [migrate] ▶ Checking schema …');

    // ── categories ────────────────────────────────────────────────────────────
    await addCol('categories', 'description', 'TEXT');
    await addCol('categories', 'icon',        "VARCHAR(30) DEFAULT NULL");
    await addCol('categories', 'created_at',  'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

    // Perluas icon dari VARCHAR(10) → VARCHAR(30) kalau masih kecil
    try {
      const [[col]] = await conn.query(
        `SELECT CHARACTER_MAXIMUM_LENGTH AS len
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA=? AND TABLE_NAME='categories' AND COLUMN_NAME='icon'`,
        [db]
      );
      if (col && Number(col.len) < 30) {
        await conn.query(`ALTER TABLE categories MODIFY COLUMN icon VARCHAR(30) DEFAULT NULL`);
        console.log('  [migrate] ✎ Expand categories.icon to VARCHAR(30)');
      }
    } catch (_) {}

    // ── customers ────────────────────────────────────────────────────────────
    await renameCol('customers', 'no_hp',    'phone_number', 'VARCHAR(20)');
    await renameCol('customers', 'nomor_hp', 'phone_number', 'VARCHAR(20)');
    await renameCol('customers', 'telp',     'phone_number', 'VARCHAR(20)');
    await renameCol('customers', 'phone',    'phone_number', 'VARCHAR(20)');
    await addCol('customers', 'phone_number', 'VARCHAR(20)');
    await addCol('customers', 'email',        'VARCHAR(150)');
    await addCol('customers', 'address',      'TEXT');

    // ── products ─────────────────────────────────────────────────────────────
    await renameCol('products', 'stok',      'stock_quantity', 'INT NOT NULL DEFAULT 0');
    await renameCol('products', 'stock',     'stock_quantity', 'INT NOT NULL DEFAULT 0');
    await renameCol('products', 'qty',       'stock_quantity', 'INT NOT NULL DEFAULT 0');
    await renameCol('products', 'quantity',  'stock_quantity', 'INT NOT NULL DEFAULT 0');
    await renameCol('products', 'emoji',     'image_emoji',    "VARCHAR(20) DEFAULT '🌿'");
    await renameCol('products', 'active',    'is_active',      'TINYINT(1) DEFAULT 1');
    await renameCol('products', 'status',    'is_active',      'TINYINT(1) DEFAULT 1');
    await renameCol('products', 'perawatan', 'care_instructions', 'TEXT');
    await addCol('products', 'stock_quantity',    'INT NOT NULL DEFAULT 0');
    await addCol('products', 'image_emoji',       "VARCHAR(20) DEFAULT '🌿'");
    await addCol('products', 'image_url',         'VARCHAR(500) DEFAULT NULL');
    await addCol('products', 'is_active',         'TINYINT(1) DEFAULT 1');
    await addCol('products', 'care_instructions', 'TEXT');
    await addCol('products', 'category_id',       'INT NOT NULL DEFAULT 1');
    await addCol('products', 'description',       'TEXT');
    await addCol('products', 'product_code',      'VARCHAR(50) DEFAULT NULL');
    await addCol('products', 'updated_at',        'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

    // ── orders ───────────────────────────────────────────────────────────────
    await renameCol('orders', 'status',         'order_status',   "VARCHAR(20) NOT NULL DEFAULT 'pending'");
    await renameCol('orders', 'order_state',    'order_status',   "VARCHAR(20) NOT NULL DEFAULT 'pending'");
    await renameCol('orders', 'status_pesanan', 'order_status',   "VARCHAR(20) NOT NULL DEFAULT 'pending'");
    await addCol('orders', 'order_status',    "VARCHAR(20) NOT NULL DEFAULT 'pending'");
    await renameCol('orders', 'status_bayar', 'payment_status', "VARCHAR(20) NOT NULL DEFAULT 'pending'");
    await renameCol('orders', 'pay_status',   'payment_status', "VARCHAR(20) NOT NULL DEFAULT 'pending'");
    await renameCol('orders', 'bayar',        'payment_status', "VARCHAR(20) NOT NULL DEFAULT 'pending'");
    await addCol('orders', 'payment_status', "VARCHAR(20) NOT NULL DEFAULT 'pending'");
    await renameCol('orders', 'total',        'total_price',      'DECIMAL(12,2) NOT NULL DEFAULT 0');
    await renameCol('orders', 'harga_total',  'total_price',      'DECIMAL(12,2) NOT NULL DEFAULT 0');
    await renameCol('orders', 'alamat',       'shipping_address', 'TEXT');
    await renameCol('orders', 'catatan',      'notes',            'TEXT');
    await renameCol('orders', 'no_pesanan',   'order_number',     'VARCHAR(30)');
    await addCol('orders', 'total_price',      'DECIMAL(12,2) NOT NULL DEFAULT 0');
    await addCol('orders', 'shipping_address', 'TEXT');
    await addCol('orders', 'notes',            'TEXT');
    await addCol('orders', 'order_number',     'VARCHAR(30)');
    await addCol('orders', 'customer_id',      'INT NOT NULL DEFAULT 0');
    await addCol('orders', 'order_date',       'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

    // ── order_items ──────────────────────────────────────────────────────────
    await renameCol('order_items', 'harga',     'price_at_time', 'DECIMAL(12,2) NOT NULL DEFAULT 0');
    await renameCol('order_items', 'price',     'price_at_time', 'DECIMAL(12,2) NOT NULL DEFAULT 0');
    await renameCol('order_items', 'total',     'subtotal',      'DECIMAL(12,2) NOT NULL DEFAULT 0');
    await renameCol('order_items', 'jumlah',    'quantity',      'INT NOT NULL DEFAULT 1');
    await addCol('order_items', 'price_at_time', 'DECIMAL(12,2) NOT NULL DEFAULT 0');
    await addCol('order_items', 'subtotal',      'DECIMAL(12,2) NOT NULL DEFAULT 0');

    // ── payment_records ──────────────────────────────────────────────────────
    await addCol('payment_records', 'amount_paid',   'DECIMAL(12,2)');
    await addCol('payment_records', 'payment_proof', 'TEXT');
    await addCol('payment_records', 'paid_at',       'TIMESTAMP NULL');
    await addCol('payment_records', 'payment_method','VARCHAR(50)');
    await addCol('payment_records', 'payment_status',"VARCHAR(20) DEFAULT 'pending'");

    // ── Migrate emoji icons → key strings ─────────────────────────────────────
    try {
      const [cats] = await conn.query('SELECT id, icon FROM categories WHERE icon IS NOT NULL');
      let migratedCount = 0;
      for (const cat of cats) {
        const key = EMOJI_TO_KEY[cat.icon];
        if (key) {
          await conn.query('UPDATE categories SET icon = ? WHERE id = ?', [key, cat.id]);
          migratedCount++;
        }
      }
      if (migratedCount > 0) {
        console.log(`  [migrate] 🎨 Migrated ${migratedCount} category icons (emoji → key)`);
      }
    } catch (e) {
      console.log('  [migrate] ⚠ Icon migration skip:', e.message);
    }

    // ── Seed categories ───────────────────────────────────────────────────────
    try {
      const [[{ n }]] = await conn.query('SELECT COUNT(*) AS n FROM categories');
      if (Number(n) === 0) {
        await conn.query(`
          INSERT INTO categories (name, description, icon) VALUES
          ('Anggrek',           'Tanaman anggrek premium berbagai jenis', 'orchid'),
          ('Bonsai',            'Bonsai artistik dengan perawatan khusus', 'tree'),
          ('Sukulen & Kaktus',  'Tanaman tahan kering, minim perawatan', 'cactus'),
          ('Tanaman Hias Daun', 'Tanaman foliage indah untuk interior', 'leaf'),
          ('Tanaman Gantung',   'Cocok untuk pot gantung dan railing', 'vine')`);
        console.log('  [migrate] Seed categories ✓');
      }
    } catch (_) {}

    // ── Seed products ─────────────────────────────────────────────────────────
    try {
      const [[{ n }]] = await conn.query('SELECT COUNT(*) AS n FROM products');
      if (Number(n) === 0) {
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
            (category_id,name,description,care_instructions,price,stock_quantity,image_emoji,is_active)
          VALUES
            (${c1},'Anggrek Bulan Putih','Anggrek bulan cantik bunga putih bersih','Siram 2x seminggu',285000,8,'🌸',1),
            (${c1},'Anggrek Dendrobium','Anggrek ungu cerah berbunga lebat','Siram setiap 3 hari',175000,5,'🌺',1),
            (${c2},'Bonsai Beringin Mini','Bonsai beringin 5 tahun akar aerial','Siram setiap hari',850000,3,'🌳',1),
            (${c2},'Bonsai Serut 30cm','Bonsai serut informal upright','Siram pagi dan sore',620000,2,'🌲',1),
            (${c3},'Echeveria Mix Pot','Sukulen echeveria warna-warni','Siram seminggu sekali',65000,20,'🪴',1),
            (${c3},'Kaktus Box Set','Set 3 kaktus unik pot tanah liat','Siram 2 minggu sekali',95000,15,'🌵',1),
            (${c4},'Monstera Deliciosa','Monstera daun berlubang ikonik','Siram 2x seminggu',320000,6,'🌿',1),
            (${c4},'Philodendron Brasil','Corak kuning-hijau unik','Siram saat media kering',145000,12,'🍃',1),
            (${c5},'Sirih Gading Marble','Corak putih-hijau marble','Siram 2x seminggu',85000,15,'🌱',1),
            (${c5},'String of Pearls','Tanaman manik-manik hijau estetik','Siram seminggu sekali',120000,7,'💚',1)`);
        console.log('  [migrate] Seed products ✓');
      }
    } catch (_) {}

    console.log('  [migrate] ✅ Schema OK\n');

  } catch (err) {
    console.error('  [migrate] ❌ Error:', err.sqlMessage || err.message);
  } finally {
    conn.release();
  }
}

module.exports = runMigrations;

const pool = require('../config/database');

// ─── Auto-migration helper (runs once per process) ────────────────────────────
let _productCodeReady = false;
async function ensureProductCode() {
  if (_productCodeReady) return;
  try {
    await pool.query(
      `ALTER TABLE products ADD COLUMN product_code VARCHAR(50) DEFAULT NULL COMMENT 'Custom product ID/SKU'`
    );
    console.log('[auto-migrate] ✚ Added products.product_code');
  } catch (_) { /* already exists — ignore */ }
  try {
    await pool.query(
      `ALTER TABLE products ADD COLUMN image_url VARCHAR(500) DEFAULT NULL`
    );
    console.log('[auto-migrate] ✚ Added products.image_url');
  } catch (_) { /* already exists — ignore */ }
  _productCodeReady = true;
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const [[orderStats]] = await pool.query(`
      SELECT
        COUNT(*)                                                          AS total_orders,
        COALESCE(SUM(order_status = 'pending'),    0)                    AS pending,
        COALESCE(SUM(order_status = 'confirmed'),  0)                    AS confirmed,
        COALESCE(SUM(order_status = 'processing'), 0)                    AS processing,
        COALESCE(SUM(order_status = 'shipped'),    0)                    AS shipped,
        COALESCE(SUM(order_status = 'delivered'),  0)                    AS delivered,
        COALESCE(SUM(order_status = 'cancelled'),  0)                    AS cancelled,
        COALESCE(SUM(CASE WHEN payment_status='paid'    THEN total_price ELSE 0 END), 0) AS total_revenue,
        COALESCE(SUM(CASE WHEN payment_status='pending' THEN total_price ELSE 0 END), 0) AS pending_payment
      FROM orders
    `);

    const [[productStats]] = await pool.query(`
      SELECT
        COUNT(*)                                                     AS total_products,
        COALESCE(SUM(stock_quantity = 0),                       0)  AS out_of_stock,
        COALESCE(SUM(stock_quantity > 0 AND stock_quantity <= 3), 0) AS low_stock
      FROM products
      WHERE is_active = 1
    `);

    const [recentOrders] = await pool.query(`
      SELECT
        o.id, o.order_number, o.order_date, o.order_status, o.payment_status, o.total_price,
        c.name AS customer_name,
        COALESCE(c.phone_number, '-') AS phone_number
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      ORDER BY o.order_date DESC
      LIMIT 10
    `);

    const [topProducts] = await pool.query(`
      SELECT p.name, p.image_url,
        SUM(oi.quantity) AS total_sold,
        SUM(oi.subtotal) AS revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders   o ON oi.order_id   = o.id
      WHERE o.order_status != 'cancelled'
      GROUP BY p.id, p.name, p.image_url
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    return res.json({ success: true, data: { orderStats, productStats, recentOrders, topProducts } });
  } catch (error) {
    console.error('❌ getDashboardStats error:', error.sqlMessage || error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil statistik: ' + (error.sqlMessage || error.message) });
  }
};

// ─── Sales Report ─────────────────────────────────────────────────────────────
exports.getSalesReport = async (req, res) => {
  try {
    const { year, period = 'monthly' } = req.query;
    const targetYear = year || new Date().getFullYear();

    let periodData = [];

    if (period === 'weekly') {
      const [rows] = await pool.query(`
        SELECT
          YEARWEEK(o.order_date, 1)     AS year_week,
          WEEK(o.order_date, 1)          AS week_num,
          YEAR(o.order_date)             AS year,
          MIN(DATE(o.order_date))        AS week_start,
          MAX(DATE(o.order_date))        AS week_end,
          COUNT(o.id)                    AS total_orders,
          COALESCE(SUM(CASE WHEN o.payment_status='paid' THEN o.total_price ELSE 0 END), 0) AS revenue,
          COALESCE(SUM(o.total_price), 0) AS gross_sales
        FROM orders o
        WHERE o.order_date >= DATE_SUB(NOW(), INTERVAL 12 WEEK)
          AND o.order_status != 'cancelled'
        GROUP BY YEARWEEK(o.order_date, 1), WEEK(o.order_date, 1), YEAR(o.order_date)
        ORDER BY year_week ASC
      `);
      periodData = rows;
    } else if (period === 'yearly') {
      const [rows] = await pool.query(`
        SELECT
          YEAR(o.order_date)             AS year,
          COUNT(o.id)                    AS total_orders,
          COALESCE(SUM(CASE WHEN o.payment_status='paid' THEN o.total_price ELSE 0 END), 0) AS revenue,
          COALESCE(SUM(o.total_price), 0) AS gross_sales,
          COUNT(DISTINCT o.customer_id)  AS unique_customers
        FROM orders o
        WHERE o.order_status != 'cancelled'
        GROUP BY YEAR(o.order_date)
        ORDER BY year ASC
      `);
      periodData = rows;
    } else {
      const [rows] = await pool.query(`
        SELECT
          MONTH(o.order_date) AS month,
          MONTHNAME(o.order_date) AS month_name,
          COUNT(o.id) AS total_orders,
          COALESCE(SUM(CASE WHEN o.payment_status='paid' THEN o.total_price ELSE 0 END), 0) AS revenue,
          COALESCE(SUM(o.total_price), 0) AS gross_sales
        FROM orders o
        WHERE YEAR(o.order_date) = ? AND o.order_status != 'cancelled'
        GROUP BY MONTH(o.order_date), MONTHNAME(o.order_date)
        ORDER BY MONTH(o.order_date)
      `, [targetYear]);
      periodData = rows;
    }

    const [topPlants] = await pool.query(`
      SELECT p.name, p.image_url, c.name AS category_name,
        SUM(oi.quantity) AS total_sold,
        SUM(oi.subtotal) AS revenue,
        COUNT(DISTINCT oi.order_id) AS order_count
      FROM order_items oi
      JOIN products p   ON oi.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN orders o     ON oi.order_id   = o.id
      WHERE YEAR(o.order_date) = ? AND o.order_status != 'cancelled'
      GROUP BY p.id, p.name, p.image_url, c.name
      ORDER BY total_sold DESC
      LIMIT 10
    `, [targetYear]);

    const [categorySales] = await pool.query(`
      SELECT c.name AS category_name, c.icon,
        SUM(oi.quantity) AS total_sold,
        SUM(oi.subtotal) AS revenue
      FROM order_items oi
      JOIN products p   ON oi.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN orders o     ON oi.order_id   = o.id
      WHERE YEAR(o.order_date) = ? AND o.order_status != 'cancelled'
      GROUP BY c.id, c.name, c.icon
      ORDER BY revenue DESC
    `, [targetYear]);

    const [[summary]] = await pool.query(`
      SELECT
        COUNT(o.id) AS total_orders,
        COALESCE(SUM(CASE WHEN o.payment_status='paid' THEN o.total_price ELSE 0 END),0) AS total_revenue,
        COALESCE(SUM(oi.quantity), 0) AS total_items_sold,
        COUNT(DISTINCT o.customer_id) AS unique_customers
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE YEAR(o.order_date) = ? AND o.order_status != 'cancelled'
    `, [targetYear]);

    const [availableYears] = await pool.query(
      'SELECT DISTINCT YEAR(order_date) AS year FROM orders ORDER BY year DESC'
    );

    return res.json({
      success: true,
      data: { periodData, monthlySales: period === 'monthly' ? periodData : [], topPlants, categorySales, summary, targetYear, availableYears, period }
    });
  } catch (error) {
    console.error('❌ getSalesReport error:', error.sqlMessage || error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil laporan penjualan: ' + (error.sqlMessage || error.message) });
  }
};

// ─── Get All Orders (Admin) ──────────────────────────────────────────────────
exports.getAllOrders = async (req, res) => {
  try {
    const { status, payment, search, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let where = 'WHERE 1=1';
    const params = [];
    if (status)  { where += ' AND o.order_status = ?';   params.push(status); }
    if (payment) { where += ' AND o.payment_status = ?'; params.push(payment); }
    if (search)  {
      where += ' AND (o.order_number LIKE ? OR c.name LIKE ? OR COALESCE(c.phone_number,\'\') LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM orders o JOIN customers c ON o.customer_id = c.id ${where}`,
      params
    );
    const [orders] = await pool.query(
      `SELECT o.*, c.name AS customer_name,
         COALESCE(c.phone_number, '-') AS phone_number,
         COALESCE(c.email, '-') AS email
       FROM orders o
       JOIN customers c ON o.customer_id = c.id
       ${where}
       ORDER BY o.order_date DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    return res.json({ success: true, data: orders, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('❌ getAllOrders error:', error.sqlMessage || error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data pesanan: ' + (error.sqlMessage || error.message) });
  }
};

// ─── Get Order Detail ────────────────────────────────────────────────────────
exports.getOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const [[order]] = await pool.query(
      `SELECT o.*, c.name AS customer_name,
         COALESCE(c.phone_number, '-') AS phone_number,
         COALESCE(c.email, '-') AS email,
         COALESCE(c.address, '-') AS customer_address
       FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.id = ?`,
      [id]
    );
    if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });

    const [items] = await pool.query(
      `SELECT oi.*, p.name AS product_name FROM order_items oi
       JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?`,
      [id]
    );
    const [[payment]] = await pool.query('SELECT * FROM payment_records WHERE order_id = ?', [id]);

    return res.json({ success: true, data: { ...order, items, payment: payment || null } });
  } catch (error) {
    console.error('❌ getOrderDetail error:', error.sqlMessage || error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil detail pesanan: ' + (error.sqlMessage || error.message) });
  }
};

// ─── Update Status Pesanan ───────────────────────────────────────────────────
exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { order_status } = req.body;
  const validStatuses = ['pending','confirmed','processing','shipped','delivered','cancelled'];
  if (!validStatuses.includes(order_status)) {
    return res.status(400).json({ success: false, message: 'Status tidak valid' });
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[order]] = await connection.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) throw new Error('Pesanan tidak ditemukan');
    if (order_status === 'cancelled' && order.order_status !== 'cancelled') {
      const [items] = await connection.query('SELECT * FROM order_items WHERE order_id = ?', [id]);
      for (const item of items) {
        const [[product]] = await connection.query('SELECT stock_quantity FROM products WHERE id = ?', [item.product_id]);
        if (!product) continue;
        const newStock = (product.stock_quantity || 0) + item.quantity;
        await connection.query('UPDATE products SET stock_quantity = ? WHERE id = ?', [newStock, item.product_id]);
        await connection.query(
          `INSERT INTO inventory_log (product_id, change_type, quantity_change, quantity_before, quantity_after, reference_id, notes)
           VALUES (?, 'cancelled', ?, ?, ?, ?, ?)`,
          [item.product_id, item.quantity, product.stock_quantity, newStock, id, `Cancel order ${order.order_number}`]
        );
      }
    }
    await connection.query('UPDATE orders SET order_status = ? WHERE id = ?', [order_status, id]);
    await connection.commit();
    return res.json({ success: true, message: `Status diupdate ke "${order_status}"` });
  } catch (error) {
    await connection.rollback();
    console.error('❌ updateOrderStatus error:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  } finally { connection.release(); }
};

// ─── Konfirmasi Pembayaran ───────────────────────────────────────────────────
exports.confirmPayment = async (req, res) => {
  const { id } = req.params;
  const { payment_method, notes } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[order]] = await connection.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) throw new Error('Pesanan tidak ditemukan');
    if (order.payment_status === 'paid') throw new Error('Pembayaran sudah dikonfirmasi');
    await connection.query(
      `UPDATE payment_records SET payment_status='paid', amount_paid=?, payment_method=?, paid_at=NOW(), notes=? WHERE order_id=?`,
      [order.total_price, payment_method || 'transfer', notes || null, id]
    );
    await connection.query(
      `UPDATE orders SET payment_status='paid', order_status=IF(order_status='pending','confirmed',order_status) WHERE id=?`,
      [id]
    );
    await connection.commit();
    return res.json({ success: true, message: 'Pembayaran berhasil dikonfirmasi' });
  } catch (error) {
    await connection.rollback();
    console.error('❌ confirmPayment error:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  } finally { connection.release(); }
};

// ─── Tolak Pembayaran ────────────────────────────────────────────────────────
exports.rejectPayment = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[order]] = await connection.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) throw new Error('Pesanan tidak ditemukan');
    if (order.payment_status === 'paid')   throw new Error('Pembayaran sudah dikonfirmasi, tidak bisa ditolak');
    if (order.payment_status === 'failed') throw new Error('Pembayaran sudah pernah ditolak');
    await connection.query(
      `UPDATE payment_records SET payment_status='failed', notes=? WHERE order_id=?`,
      [reason || 'Pembayaran ditolak oleh admin', id]
    );
    await connection.query(
      `UPDATE orders SET payment_status='failed', order_status='cancelled' WHERE id=?`, [id]
    );
    const [items] = await connection.query('SELECT * FROM order_items WHERE order_id = ?', [id]);
    for (const item of items) {
      const [[product]] = await connection.query('SELECT stock_quantity FROM products WHERE id = ?', [item.product_id]);
      if (!product) continue;
      const newStock = (product.stock_quantity || 0) + item.quantity;
      await connection.query('UPDATE products SET stock_quantity = ? WHERE id = ?', [newStock, item.product_id]);
      await connection.query(
        `INSERT INTO inventory_log (product_id, change_type, quantity_change, quantity_before, quantity_after, reference_id, notes)
         VALUES (?, 'cancelled', ?, ?, ?, ?, ?)`,
        [item.product_id, item.quantity, product.stock_quantity, newStock, id, `Reject payment order ${order.order_number}`]
      );
    }
    await connection.commit();
    return res.json({ success: true, message: 'Pembayaran berhasil ditolak dan pesanan dibatalkan' });
  } catch (error) {
    await connection.rollback();
    console.error('❌ rejectPayment error:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  } finally { connection.release(); }
};

// ─── Helper: pastikan kolom product_code & image_url ada ────────────────────
let _colsEnsured = false;
async function ensureProductCols() {
  if (_colsEnsured) return;
  const [[row]] = await pool.query(
    'SELECT DATABASE() AS db'
  );
  const db = row.db;
  const ensureCol = async (col, def) => {
    const [[{ n }]] = await pool.query(
      `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA=? AND TABLE_NAME='products' AND COLUMN_NAME=?`,
      [db, col]
    );
    if (n === 0) {
      await pool.query(`ALTER TABLE products ADD COLUMN \`${col}\` ${def}`);
      console.log(`  [auto-migrate] ✚ ADD products.${col}`);
    }
  };

  await ensureCol('image_url', 'VARCHAR(500) DEFAULT NULL');
  await ensureCol('product_code', 'VARCHAR(50) DEFAULT NULL');
  await ensureCol('updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

  _colsEnsured = true;
}

// ─── Produk: Get All (Admin) ─────────────────────────────────────────────────
exports.getAllProducts = async (req, res) => {
  try {
    await ensureProductCols();
    const [products] = await pool.query(`
      SELECT p.id, p.category_id, p.name, p.description, p.care_instructions,
             p.price, p.stock_quantity, p.image_url, p.is_active, p.created_at,
             p.product_code, c.name AS category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1
      ORDER BY p.created_at DESC
    `);
    const [categories] = await pool.query('SELECT * FROM categories ORDER BY name');
    return res.json({ success: true, data: products, categories });
  } catch (error) {
    console.error('❌ getAllProducts error:', error.sqlMessage || error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil produk: ' + (error.sqlMessage || error.message) });
  }
};

// ─── Produk: Upload Foto ─────────────────────────────────────────────────────
exports.uploadProductImage = async (req, res) => {
  const { id } = req.params;
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Tidak ada file yang diupload' });
    const [[product]] = await pool.query('SELECT id FROM products WHERE id = ?', [id]);
    if (!product) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    const imageUrl = `/api/product-images/${req.file.filename}`;
    await pool.query('UPDATE products SET image_url = ? WHERE id = ?', [imageUrl, id]);
    return res.json({ success: true, message: 'Foto berhasil diupload', image_url: imageUrl });
  } catch (error) {
    console.error('❌ uploadProductImage error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal upload foto' });
  }
};

// ─── Produk: Tambah ──────────────────────────────────────────────────────────
exports.createProduct = async (req, res) => {
  const { category_id, name, description, care_instructions, price, stock_quantity, product_code } = req.body;
  if (!category_id || !name || !price) {
    return res.status(400).json({ success: false, message: 'category_id, name, dan price wajib diisi' });
  }
  try {
    const pCode = product_code ? String(product_code).trim() || null : null;
    const [result] = await pool.query(
      `INSERT INTO products (category_id, name, description, care_instructions, price, stock_quantity, product_code)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [category_id, name, description || null, care_instructions || null, price, stock_quantity || 0, pCode]
    );
    return res.status(201).json({ success: true, message: 'Produk berhasil ditambahkan', id: result.insertId });
  } catch (error) {
    console.error('❌ createProduct error:', error.sqlMessage || error.message);
    return res.status(500).json({ success: false, message: 'Gagal menambah produk' });
  }
};

// ─── Produk: Update ──────────────────────────────────────────────────────────
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { category_id, name, description, care_instructions, price, stock_quantity, is_active, product_code } = req.body;
  try {
    const [[existing]] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });

    if (stock_quantity !== undefined && Number(stock_quantity) !== Number(existing.stock_quantity)) {
      const diff = Number(stock_quantity) - Number(existing.stock_quantity || 0);
      await pool.query(
        `INSERT INTO inventory_log (product_id, change_type, quantity_change, quantity_before, quantity_after, notes)
         VALUES (?, 'adjustment', ?, ?, ?, 'Manual adjustment by admin')`,
        [id, diff, existing.stock_quantity || 0, stock_quantity]
      );
    }
    await pool.query(
      `UPDATE products SET
         category_id       = COALESCE(?, category_id),
         name              = COALESCE(?, name),
         description       = COALESCE(?, description),
         care_instructions = COALESCE(?, care_instructions),
         price             = COALESCE(?, price),
         stock_quantity    = COALESCE(?, stock_quantity),
         is_active         = COALESCE(?, is_active)
       WHERE id = ?`,
      [category_id ?? null, name ?? null, description ?? null, care_instructions ?? null,
       price ?? null, stock_quantity ?? null,
       is_active !== undefined ? is_active : null, id]
    );
    if (product_code !== undefined) {
      const pCode = String(product_code || '').trim() || null;
      await pool.query('UPDATE products SET product_code = ? WHERE id = ?', [pCode, id]);
    }
    return res.json({ success: true, message: 'Produk berhasil diupdate' });
  } catch (error) {
    console.error('❌ updateProduct error:', error.sqlMessage || error.message);
    return res.status(500).json({ success: false, message: 'Gagal update produk' });
  }
};

// ─── Produk: Delete (soft) ───────────────────────────────────────────────────
exports.deleteProduct = async (req, res) => {
  const numId = Number(req.params.id);
  if (!numId || isNaN(numId)) {
    return res.status(400).json({ success: false, message: 'ID produk tidak valid' });
  }
  try {
    // Cek keberadaan produk tanpa filter is_active (agar bisa detect sudah dihapus)
    const [[existing]] = await pool.query(
      'SELECT id, name, is_active FROM products WHERE id = ?', [numId]
    );
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }
    if (Number(existing.is_active) === 0) {
      return res.status(409).json({ success: false, message: 'Produk sudah dihapus sebelumnya' });
    }

    // Soft delete — set is_active = 0
    await pool.query('UPDATE products SET is_active = 0 WHERE id = ?', [numId]);

    // Verifikasi benar-benar tersimpan di DB
    const [[check]] = await pool.query('SELECT is_active FROM products WHERE id = ?', [numId]);
    if (!check || Number(check.is_active) !== 0) {
      console.error('❌ deleteProduct: UPDATE tidak tersimpan untuk id=', numId);
      return res.status(500).json({ success: false, message: 'Hapus gagal tersimpan di database, coba lagi' });
    }

    console.log(`✅ Produk id=${numId} "${existing.name}" berhasil dihapus`);
    return res.json({ success: true, message: `Produk "${existing.name}" berhasil dihapus`, id: numId });
  } catch (error) {
    console.error('❌ deleteProduct error:', error.sqlMessage || error.message);
    return res.status(500).json({ success: false, message: 'Gagal hapus produk: ' + (error.sqlMessage || error.message) });
  }
};

// ─── Get Categories ──────────────────────────────────────────────────────────
exports.getCategories = async (req, res) => {
  try {
    const [cats] = await pool.query(`
      SELECT c.*, COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
      GROUP BY c.id ORDER BY c.name
    `);
    return res.json({ success: true, data: cats });
  } catch (error) {
    console.error('❌ getCategories error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil kategori' });
  }
};

// ─── Category: Tambah ────────────────────────────────────────────────────────
exports.createCategory = async (req, res) => {
  const { name, description, icon } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });
  try {
    const [[existing]] = await pool.query('SELECT id FROM categories WHERE name = ?', [name.trim()]);
    if (existing) return res.status(409).json({ success: false, message: `Kategori "${name}" sudah ada` });
    const [result] = await pool.query(
      'INSERT INTO categories (name, description, icon) VALUES (?, ?, ?)',
      [name.trim(), description || null, icon || null]
    );
    return res.status(201).json({
      success: true, message: 'Kategori berhasil ditambahkan',
      data: { id: result.insertId, name: name.trim(), description: description || null, icon: icon || null }
    });
  } catch (error) {
    console.error('❌ createCategory error:', error.sqlMessage || error.message);
    return res.status(500).json({ success: false, message: 'Gagal menambah kategori' });
  }
};

// ─── Category: Update ────────────────────────────────────────────────────────
exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description, icon } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });
  try {
    const [[existing]] = await pool.query('SELECT id FROM categories WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    const [[dupName]] = await pool.query('SELECT id FROM categories WHERE name = ? AND id != ?', [name.trim(), id]);
    if (dupName) return res.status(409).json({ success: false, message: `Nama kategori "${name}" sudah dipakai` });
    await pool.query('UPDATE categories SET name = ?, description = ?, icon = ? WHERE id = ?',
      [name.trim(), description || null, icon || null, id]);
    return res.json({ success: true, message: 'Kategori berhasil diupdate' });
  } catch (error) {
    console.error('❌ updateCategory error:', error.sqlMessage || error.message);
    return res.status(500).json({ success: false, message: 'Gagal update kategori' });
  }
};

// ─── Category: Delete ────────────────────────────────────────────────────────
exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const [[existing]] = await pool.query('SELECT id FROM categories WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) AS count FROM products WHERE category_id = ? AND is_active = 1', [id]
    );
    if (count > 0) return res.status(409).json({
      success: false, message: `Tidak bisa hapus: masih ada ${count} produk aktif di kategori ini`
    });
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Kategori berhasil dihapus' });
  } catch (error) {
    console.error('❌ deleteCategory error:', error.sqlMessage || error.message);
    return res.status(500).json({ success: false, message: 'Gagal hapus kategori' });
  }
};

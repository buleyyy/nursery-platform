const pool   = require('../config/database');
const crypto = require('crypto');
const path   = require('path');
const fs     = require('fs');

const generateOrderNumber = () => {
  const d       = new Date();
  const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');
  const rand    = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${dateStr}-${rand}`;
};

// ─── Buat Pesanan Baru ───────────────────────────────────────────────────────
exports.createOrder = async (req, res) => {
  const {
    customer_name, customer_phone, customer_email,
    customer_address, items, notes
  } = req.body;

  if (!customer_name || !customer_phone || !customer_address) {
    return res.status(400).json({ success: false, message: 'Nama, nomor HP, dan alamat wajib diisi' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Keranjang belanja kosong' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      `INSERT INTO customers (phone_number, name, email, address)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email), address=VALUES(address)`,
      [customer_phone, customer_name, customer_email || null, customer_address]
    );

    const [[customer]] = await connection.query(
      'SELECT id FROM customers WHERE phone_number = ?', [customer_phone]
    );
    if (!customer) throw new Error('Gagal menyimpan data pelanggan');

    let totalPrice    = 0;
    const enrichedItems = [];

    for (const item of items) {
      const pid = Number(item.product_id);
      const qty = Number(item.quantity);
      if (!pid || !qty || qty < 1) throw new Error(`Data item tidak valid`);

      const [[product]] = await connection.query(
        `SELECT id, name, price, stock_quantity FROM products WHERE id = ? AND is_active = 1 FOR UPDATE`,
        [pid]
      );
      if (!product) throw new Error(`Produk ID ${pid} tidak ditemukan`);
      if ((product.stock_quantity || 0) < qty) {
        throw new Error(`Stok tidak cukup untuk "${product.name}". Tersedia: ${product.stock_quantity || 0}`);
      }

      totalPrice += Number(product.price) * qty;
      enrichedItems.push({
        product_id: pid, quantity: qty,
        price: Number(product.price), name: product.name,
        stockBefore: product.stock_quantity || 0
      });
    }

    const orderNumber  = generateOrderNumber();
    const [orderResult] = await connection.query(
      `INSERT INTO orders (order_number, customer_id, total_price, shipping_address, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [orderNumber, customer.id, totalPrice, customer_address, notes || null]
    );
    const orderId = orderResult.insertId;

    for (const item of enrichedItems) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_time, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.price, item.price * item.quantity]
      );
      const newStock = item.stockBefore - item.quantity;
      await connection.query(
        'UPDATE products SET stock_quantity = ? WHERE id = ?', [newStock, item.product_id]
      );
      await connection.query(
        `INSERT INTO inventory_log
           (product_id, change_type, quantity_change, quantity_before, quantity_after, reference_id, notes)
         VALUES (?, 'sold', ?, ?, ?, ?, ?)`,
        [item.product_id, -item.quantity, item.stockBefore, newStock, orderId, `Order ${orderNumber}`]
      );
    }

    await connection.query(
      'INSERT INTO payment_records (order_id, amount_due) VALUES (?, ?)',
      [orderId, totalPrice]
    );

    await connection.commit();
    return res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dibuat',
      data: {
        order_id: orderId, order_number: orderNumber,
        customer_name, customer_phone,
        total_price: totalPrice,
        order_status: 'pending', payment_status: 'pending',
        items_count: enrichedItems.length
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ createOrder:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

// ─── Upload Bukti Pembayaran ─────────────────────────────────────────────────
exports.uploadPaymentProof = async (req, res) => {
  const { order_number } = req.body;

  if (!order_number) {
    if (req.file) fs.unlinkSync(req.file.path); // hapus file jika ada
    return res.status(400).json({ success: false, message: 'order_number wajib diisi' });
  }
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'File bukti transfer wajib diunggah' });
  }

  try {
    // Cek order ada
    const [[order]] = await pool.query(
      'SELECT id, payment_status FROM orders WHERE order_number = ?', [order_number]
    );
    if (!order) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }
    if (order.payment_status === 'paid') {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Pembayaran sudah dikonfirmasi' });
    }

    // Hapus bukti lama jika ada
    const [[pr]] = await pool.query(
      'SELECT payment_proof FROM payment_records WHERE order_id = ?', [order.id]
    );
    if (pr?.payment_proof) {
      const oldPath = path.join(__dirname, '..', pr.payment_proof);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    // Simpan path relatif ke DB
    const proofPath = `uploads/payment-proofs/${req.file.filename}`;
    await pool.query(
      `UPDATE payment_records
         SET payment_proof = ?, notes = COALESCE(notes, 'Bukti transfer diupload oleh customer')
       WHERE order_id = ?`,
      [proofPath, order.id]
    );

    return res.json({
      success: true,
      message: 'Bukti transfer berhasil diunggah',
      data: { proof_url: `/api/proof/${req.file.filename}` }
    });

  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error('❌ uploadPaymentProof:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengunggah bukti' });
  }
};

// ─── Cek / Lacak Pesanan ─────────────────────────────────────────────────────
exports.getOrder = async (req, res) => {
  const { orderNumber, phone } = req.query;

  if (!orderNumber && !phone) {
    return res.status(400).json({ success: false, message: 'Masukkan nomor pesanan atau nomor HP' });
  }

  try {
    let query = `
      SELECT o.*,
             c.name                        AS customer_name,
             COALESCE(c.phone_number, '-') AS phone_number,
             COALESCE(c.email, '-')        AS email,
             COALESCE(c.address, '-')      AS customer_address
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE 1=1`;
    const params = [];

    if (orderNumber) {
      query += ' AND o.order_number = ?'; params.push(orderNumber.trim());
    } else {
      query += ' AND c.phone_number = ? ORDER BY o.order_date DESC LIMIT 10'; params.push(phone.trim());
    }

    const [orders] = await pool.query(query, params);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    const result = await Promise.all(orders.map(async (order) => {
      const [items] = await pool.query(
        `SELECT oi.*, p.name AS product_name,
                COALESCE(p.image_emoji,'🌿') AS image_emoji,
                cat.name AS category_name
         FROM order_items oi
         JOIN products   p   ON oi.product_id = p.id
         JOIN categories cat ON p.category_id  = cat.id
         WHERE oi.order_id = ?`, [order.id]
      );
      const [[payment]] = await pool.query(
        'SELECT * FROM payment_records WHERE order_id = ?', [order.id]
      );
      return { ...order, items, payment: payment || null };
    }));

    return res.json({ success: true, data: orderNumber ? result[0] : result });

  } catch (error) {
    console.error('❌ getOrder:', error.sqlMessage || error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data pesanan' });
  }
};

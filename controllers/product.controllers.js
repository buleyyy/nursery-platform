const pool = require('../config/database');

// ─── Get All Products (public) ───────────────────────────────────────────────
exports.getAllProducts = async (req, res) => {
  try {
    const { category, priceMin, priceMax } = req.query;

    let query = `
      SELECT
        p.id,
        p.category_id,
        p.name,
        p.description,
        p.care_instructions,
        p.price,
        COALESCE(p.stock_quantity, 0) AS stock_quantity,
        p.image_url,
        COALESCE(p.is_active, 1)      AS is_active,
        p.created_at,
        c.name AS category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE COALESCE(p.is_active, 1) = 1
    `;
    const params = [];

    if (category) { query += ' AND c.name = ?'; params.push(category); }
    if (priceMin) { query += ' AND p.price >= ?'; params.push(Number(priceMin)); }
    if (priceMax) { query += ' AND p.price <= ?'; params.push(Number(priceMax)); }

    query += ' ORDER BY p.created_at DESC';

    const [products] = await pool.query(query, params);

    return res.json({ success: true, data: products, count: products.length });
  } catch (error) {
    console.error('❌ getAllProducts error:', error.sqlMessage || error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil produk' });
  }
};

// ─── Get Product by ID ───────────────────────────────────────────────────────
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const [[product]] = await pool.query(
      `SELECT
         p.id, p.category_id, p.name, p.description, p.care_instructions,
         p.price, COALESCE(p.stock_quantity, 0) AS stock_quantity,
         p.image_url, p.created_at,
         c.name AS category_name
       FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [id]
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }

    return res.json({ success: true, data: product });
  } catch (error) {
    console.error('❌ getProductById error:', error.sqlMessage || error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil produk' });
  }
};

// ─── Create Product (admin) ──────────────────────────────────────────────────
exports.createProduct = async (req, res) => {
  try {
    const { category_id, name, description, care_instructions,
            price, stock_quantity, image_emoji } = req.body;

    if (!category_id || !name || !price) {
      return res.status(400).json({
        success: false,
        message: 'category_id, name, dan price wajib diisi'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO products
         (category_id, name, description, care_instructions, price, stock_quantity, image_emoji)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [category_id, name, description || null, care_instructions || null,
       price, stock_quantity || 0, image_emoji || '🌿']
    );

    return res.status(201).json({
      success: true,
      message: 'Produk berhasil dibuat',
      data: { id: result.insertId, category_id, name, price, stock_quantity: stock_quantity || 0 }
    });
  } catch (error) {
    console.error('❌ createProduct error:', error.sqlMessage || error.message);
    return res.status(500).json({ success: false, message: 'Gagal membuat produk' });
  }
};

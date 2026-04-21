const pool = require('../config/database');

// GET all products
exports.getAllProducts = async (req, res) => {
  try {
    const [products] = await pool.query('SELECT * FROM products');

    return res.status(200).json({
      success: true,
      data: products,
      total: products.length
    });

  } catch (error) {
    console.error('getAllProducts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
};

// GET product by ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    const [products] = await pool.query(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: products[0]
    });

  } catch (error) {
    console.error('getProductById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch product'
    });
  }
};

// CREATE product
exports.createProduct = async (req, res) => {
  try {
    const { name, price, category_id } = req.body;

    if (!name || !price || !category_id) {
      return res.status(400).json({
        success: false,
        message: 'name, price, and category_id are required'
      });
    }

    if (isNaN(price)) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a number'
      });
    }

    const [result] = await pool.query(
      'INSERT INTO products (name, price, category_id) VALUES (?, ?, ?)',
      [name, price, category_id]
    );

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        id: result.insertId,
        name,
        price,
        category_id
      }
    });

  } catch (error) {
    console.error('createProduct error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create product'
    });
  }
};
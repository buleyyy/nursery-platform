const pool = require('../config/database');

// Get all products dengan optional filter
exports.getAllProducts = async (req, res) => {
  try {
    const { category, priceMin, priceMax } = req.query;
    
    let query = 'SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE 1=1';
    const params = [];
    
    // Filter by category
    if (category) {
      query += ' AND c.name = ?';
      params.push(category);
    }
    
    // Filter by price range
    if (priceMin) {
      query += ' AND p.price >= ?';
      params.push(priceMin);
    }
    if (priceMax) {
      query += ' AND p.price <= ?';
      params.push(priceMax);
    }
    
    query += ' ORDER BY p.created_at DESC';
    
    const connection = await pool.getConnection();
    const [products] = await connection.query(query, params);
    connection.release();
    
    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = ?';
    
    const connection = await pool.getConnection();
    const [products] = await connection.query(query, [id]);
    connection.release();
    
    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: products[0]
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
};

// Create new product (admin only)
exports.createProduct = async (req, res) => {
  try {
    const { category_id, name, description, care_instructions, price, stock_quantity } = req.body;
    
    // Validation
    if (!category_id || !name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: category_id, name, price'
      });
    }
    
    const query = 'INSERT INTO products (category_id, name, description, care_instructions, price, stock_quantity) VALUES (?, ?, ?, ?, ?, ?)';
    
    const connection = await pool.getConnection();
    const [result] = await connection.query(query, [category_id, name, description, care_instructions, price, stock_quantity || 0]);
    connection.release();
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        id: result.insertId,
        category_id,
        name,
        price,
        stock_quantity: stock_quantity || 0
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
};
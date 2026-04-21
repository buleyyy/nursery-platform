const express = require('express');
const productController = require('../controllers/product.controllers');

const router = express.Router();

// GET all products
router.get('/', productController.getAllProducts);

// GET product by ID
router.get('/:id', productController.getProductById);

// POST create product
router.post('/', productController.createProduct);

module.exports = router;
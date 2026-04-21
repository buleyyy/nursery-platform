const express = require('express');
const orderController = require('../controllers/orderController');

const router = express.Router();

// POST create order
router.post('/', orderController.createOrder);

// GET order by number or phone
router.get('/', orderController.getOrder);

// GET order history by phone
router.get('/history/:phone', orderController.getOrderHistory);

module.exports = router;
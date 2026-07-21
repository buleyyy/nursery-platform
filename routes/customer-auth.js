const express = require('express');
const router = express.Router();
const customerAuthController = require('../controllers/customer-auth.controllers');
const { customerAuth } = require('../middleware/auth');

router.post('/register',        customerAuthController.register);
router.post('/login',           customerAuthController.login);
router.post('/forgot-password', customerAuthController.forgotPassword);
router.post('/reset-password',  customerAuthController.resetPassword);
router.get('/me',   customerAuth, customerAuthController.me);

module.exports = router;

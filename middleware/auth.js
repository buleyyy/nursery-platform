require('dotenv').config();
const jwt = require('jsonwebtoken');

/**
 * Middleware: Proteksi route admin
 * Cek Bearer token di Authorization header
 */
const adminAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Token tidak ditemukan'
    });
  }

  const token = authHeader.split(' ')[1];

  if (token !== process.env.ADMIN_SECRET) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Token tidak valid'
    });
  }

  next();
};

/**
 * Middleware: Proteksi route pelanggan
 * Verifikasi JWT customer, inject req.customerId
 */
const customerAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Silakan login terlebih dahulu'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.CUSTOMER_JWT_SECRET);
    req.customerId = decoded.id;
    next();
  } catch (e) {
    return res.status(403).json({
      success: false,
      message: 'Sesi login tidak valid atau sudah kedaluwarsa'
    });
  }
};

module.exports = { adminAuth, customerAuth };

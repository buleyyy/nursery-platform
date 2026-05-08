require('dotenv').config();

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

module.exports = { adminAuth };

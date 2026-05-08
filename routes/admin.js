const express    = require('express');
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
const router     = express.Router();
const adminController = require('../controllers/admin.controllers');
const { adminAuth }   = require('../middleware/auth');

// ── Multer: upload foto produk ────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'uploads', 'product-images');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `product-${req.params.id}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|jpg|png|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Hanya JPG, PNG, atau WebP yang diizinkan'));
  },
});

// ── Semua route butuh admin token ─────────────────────────────────────────────
router.use(adminAuth);

// Dashboard & Laporan
router.get('/dashboard',           adminController.getDashboardStats);
router.get('/sales-report',        adminController.getSalesReport);

// Orders
router.get('/orders',              adminController.getAllOrders);
router.get('/orders/:id',          adminController.getOrderDetail);
router.put('/orders/:id/status',   adminController.updateOrderStatus);
router.put('/orders/:id/payment',  adminController.confirmPayment);
router.put('/orders/:id/reject',   adminController.rejectPayment);

// Products
router.get('/products',            adminController.getAllProducts);
router.post('/products',           adminController.createProduct);
router.put('/products/:id',        adminController.updateProduct);
router.delete('/products/:id',     adminController.deleteProduct);
router.post('/products/:id/image', upload.single('image'), adminController.uploadProductImage);

// Categories
router.get('/categories',          adminController.getCategories);
router.post('/categories',         adminController.createCategory);
router.put('/categories/:id',      adminController.updateCategory);
router.delete('/categories/:id',   adminController.deleteCategory);

module.exports = router;

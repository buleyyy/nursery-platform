const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
const orderController = require('../controllers/order.controllers');

// ─── Setup multer storage ────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'uploads', 'payment-proofs');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `proof-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Hanya file gambar JPG/PNG/WEBP yang diizinkan'));
  },
});

// ─── Routes ──────────────────────────────────────────────────────────────────
router.post('/',        orderController.createOrder);
router.get('/track',    orderController.getOrder);

// Upload bukti pembayaran (public — customer upload sendiri)
router.post('/upload-proof', upload.single('proof'), orderController.uploadPaymentProof);

module.exports = router;

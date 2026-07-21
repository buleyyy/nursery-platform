require('dotenv').config();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const pool    = require('../config/database');

const JWT_SECRET   = process.env.CUSTOMER_JWT_SECRET;
const TOKEN_EXPIRY = '7d';

const signToken = (customer) =>
  jwt.sign({ id: customer.id, email: customer.email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

const publicCustomer = (c) => ({
  id: c.id, name: c.name, email: c.email,
  phone_number: c.phone_number, address: c.address
});

// ─── Register ────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  const { name, email, password, phone_number, address } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Nama, email, dan password wajib diisi' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password minimal 6 karakter' });
  }

  try {
    const [[existing]] = await pool.query('SELECT id FROM customers WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email sudah terdaftar' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO customers (name, email, password, phone_number, address)
       VALUES (?, ?, ?, ?, ?)`,
      [name.trim(), email.toLowerCase().trim(), hashed, phone_number || null, address || null]
    );

    const [[customer]] = await pool.query('SELECT * FROM customers WHERE id = ?', [result.insertId]);
    const token = signToken(customer);

    return res.status(201).json({
      success: true, message: 'Registrasi berhasil',
      token, customer: publicCustomer(customer)
    });
  } catch (error) {
    console.error('❌ register:', error.sqlMessage || error.message);
    return res.status(500).json({ success: false, message: 'Gagal mendaftar, coba lagi' });
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email dan password wajib diisi' });
  }

  try {
    const [[customer]] = await pool.query('SELECT * FROM customers WHERE email = ?', [email.toLowerCase().trim()]);
    if (!customer || !customer.password) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    const match = await bcrypt.compare(password, customer.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    const token = signToken(customer);
    return res.json({
      success: true, message: 'Login berhasil',
      token, customer: publicCustomer(customer)
    });
  } catch (error) {
    console.error('❌ login:', error.sqlMessage || error.message);
    return res.status(500).json({ success: false, message: 'Gagal login, coba lagi' });
  }
};

// ─── Get Profil Sendiri ──────────────────────────────────────────────────────
exports.me = async (req, res) => {
  try {
    const [[customer]] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.customerId]);
    if (!customer) return res.status(404).json({ success: false, message: 'Akun tidak ditemukan' });
    return res.json({ success: true, customer: publicCustomer(customer) });
  } catch (error) {
    console.error('❌ me:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil profil' });
  }
};

// ─── Lupa Password: kirim email reset ────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email wajib diisi' });
  }

  try {
    const [[customer]] = await pool.query('SELECT * FROM customers WHERE email = ?', [email.toLowerCase().trim()]);

    // Selalu balas sukses walau email tidak ditemukan (hindari enumerasi akun)
    if (!customer) {
      return res.json({ success: true, message: 'Jika email terdaftar, link reset sudah dikirim' });
    }

    const rawToken  = crypto.randomBytes(32).toString('hex');
    const hashToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires   = new Date(Date.now() + 60 * 60 * 1000); // 1 jam

    await pool.query(
      'UPDATE customers SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      [hashToken, expires, customer.id]
    );

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(customer.email)}`;

    if (process.env.RESEND_API_KEY) {
      const { Resend } = require('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: customer.email,
        subject: 'Reset Password — H. Ali Nursery',
        html: `
          <p>Halo ${customer.name},</p>
          <p>Kami menerima permintaan reset password untuk akun Anda. Klik link berikut untuk membuat password baru (berlaku 1 jam):</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>Jika Anda tidak meminta ini, abaikan email ini.</p>
        `
      });
    } else {
      console.log(`  [customer-auth] RESEND_API_KEY belum diset. Reset URL (dev): ${resetUrl}`);
    }

    return res.json({ success: true, message: 'Jika email terdaftar, link reset sudah dikirim' });
  } catch (error) {
    console.error('❌ forgotPassword:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal memproses permintaan reset password' });
  }
};

// ─── Reset Password (dari link email) ────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  const { email, token, newPassword } = req.body;

  if (!email || !token || !newPassword) {
    return res.status(400).json({ success: false, message: 'Data reset password tidak lengkap' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password minimal 6 karakter' });
  }

  try {
    const hashToken = crypto.createHash('sha256').update(token).digest('hex');
    const [[customer]] = await pool.query(
      `SELECT * FROM customers
       WHERE email = ? AND reset_token = ? AND reset_token_expires > NOW()`,
      [email.toLowerCase().trim(), hashToken]
    );

    if (!customer) {
      return res.status(400).json({ success: false, message: 'Link reset tidak valid atau sudah kedaluwarsa' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE customers SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [hashed, customer.id]
    );

    return res.json({ success: true, message: 'Password berhasil direset, silakan login' });
  } catch (error) {
    console.error('❌ resetPassword:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mereset password' });
  }
};

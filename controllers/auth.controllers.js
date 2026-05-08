require('dotenv').config();

exports.login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
  }

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    return res.json({
      success: true,
      message: 'Login berhasil',
      token: process.env.ADMIN_SECRET,
      user: { username, role: 'admin' }
    });
  }

  res.status(401).json({ success: false, message: 'Username atau password salah' });
};

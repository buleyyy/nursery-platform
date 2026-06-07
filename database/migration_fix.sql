-- ╔══════════════════════════════════════════════════════════════╗
-- ║  H. Ali Nursery — Database Migration Fix                        ║
-- ║  Jalankan jika ada error "Unknown column 'phone_number'"     ║
-- ║  mysql -u root -p nursery_db < migration_fix.sql             ║
-- ╚══════════════════════════════════════════════════════════════╝

USE nursery_db;

-- Cek & tambah kolom phone_number jika belum ada
SET @col_exists = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = 'nursery_db'
    AND table_name   = 'customers'
    AND column_name  = 'phone_number'
);

-- Jika kolom phone_number tidak ada, tambahkan
-- (MySQL 8.0+: bisa pakai ALTER TABLE ... ADD COLUMN IF NOT EXISTS)
ALTER TABLE customers 
  MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY;

-- Tambahkan kolom jika belum ada (MySQL 8.0+)
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20) UNIQUE;

-- Verifikasi struktur tabel
DESCRIBE customers;

-- Tampilkan pesan sukses
SELECT 'Migration selesai: tabel customers OK' AS status;

-- ─── Tambah product_code ke tabel products ────────────────────────────────────
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS product_code VARCHAR(50) DEFAULT NULL AFTER id;

SELECT 'Migration selesai: product_code ditambahkan' AS status;

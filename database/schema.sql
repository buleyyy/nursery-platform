-- ╔══════════════════════════════════════════════╗
-- ║  H. Ali Nursery Platform — Database Schema      ║
-- ║  Jalankan: mysql -u root -p < schema.sql     ║
-- ╚══════════════════════════════════════════════╝

CREATE DATABASE IF NOT EXISTS nursery_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nursery_db;

-- ─── Tabel Categories ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Tabel Customers ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  name         VARCHAR(150) NOT NULL,
  email        VARCHAR(150),
  address      TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Tabel Products ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  category_id       INT NOT NULL,
  name              VARCHAR(200) NOT NULL,
  description       TEXT,
  care_instructions TEXT,
  price             DECIMAL(12,2) NOT NULL,
  stock_quantity    INT NOT NULL DEFAULT 0,
  image_emoji       VARCHAR(10) DEFAULT '🌿',
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- ─── Tabel Inventory Log ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_log (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  product_id      INT NOT NULL,
  change_type     ENUM('restock','sold','cancelled','adjustment') NOT NULL,
  quantity_change INT NOT NULL,
  quantity_before INT NOT NULL,
  quantity_after  INT NOT NULL,
  reference_id    INT,
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ─── Tabel Orders ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  order_number     VARCHAR(30) UNIQUE NOT NULL,
  customer_id      INT NOT NULL,
  order_date       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  order_status     ENUM('pending','confirmed','processing','shipped','delivered','cancelled') DEFAULT 'pending',
  payment_status   ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
  total_price      DECIMAL(12,2) NOT NULL,
  shipping_address TEXT,
  notes            TEXT,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- ─── Tabel Order Items ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  order_id       INT NOT NULL,
  product_id     INT NOT NULL,
  quantity       INT NOT NULL,
  price_at_time  DECIMAL(12,2) NOT NULL,
  subtotal       DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ─── Tabel Payment Records ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_records (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  order_id       INT NOT NULL UNIQUE,
  amount_due     DECIMAL(12,2) NOT NULL,
  amount_paid    DECIMAL(12,2),
  payment_method VARCHAR(50),
  payment_proof  TEXT,
  payment_status ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
  paid_at        TIMESTAMP NULL,
  notes          TEXT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- ─── Migration: Pastikan kolom phone_number ada ───────────────────────────────
-- Jalankan ini jika tabel customers sudah ada tapi belum punya kolom phone_number
-- ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20) UNIQUE;

-- ─── Seed: Categories ────────────────────────────────────────────────────────
INSERT INTO categories (name, description) VALUES
('Anggrek',           'Tanaman anggrek premium berbagai jenis'),
('Bonsai',            'Bonsai artistik dengan perawatan khusus'),
('Sukulen & Kaktus',  'Tanaman tahan kering, minim perawatan'),
('Tanaman Hias Daun', 'Tanaman foliage indah untuk interior'),
('Tanaman Gantung',   'Cocok untuk pot gantung dan railing')
ON DUPLICATE KEY UPDATE name = name;

-- ─── Seed: Products ──────────────────────────────────────────────────────────
INSERT INTO products (category_id, name, description, care_instructions, price, stock_quantity, image_emoji) VALUES
(1, 'Anggrek Bulan Putih',   'Anggrek bulan cantik dengan bunga putih bersih, cocok untuk hadiah istimewa',                               'Siram 2x seminggu, taruh di tempat terang tidak langsung kena matahari', 285000, 8,  '🌸'),
(1, 'Anggrek Dendrobium',    'Anggrek dendrobium dengan warna ungu cerah yang memukau, berbunga lebat',                                    'Siram setiap 3 hari, pupuk sebulan sekali',                             175000, 5,  '🌺'),
(2, 'Bonsai Beringin Mini',  'Bonsai beringin berumur 5 tahun dengan akar aerial yang artistik, tinggi ±25cm',                             'Siram setiap hari, semprot daun pagi hari',                             850000, 3,  '🌳'),
(2, 'Bonsai Serut 30cm',     'Bonsai serut gaya informal upright, sudah dibentuk 3 tahun',                                                 'Siram pagi dan sore, taruh di tempat terang',                           620000, 2,  '🌲'),
(3, 'Echeveria Mix Pot',     'Koleksi sukulen echeveria warna-warni dalam pot keramik 12cm',                                               'Siram seminggu sekali, butuh sinar matahari penuh',                      65000, 20, '🪴'),
(3, 'Kaktus Kaktus Box',     'Set 3 kaktus unik dalam pot tanah liat, cocok untuk meja kerja',                                             'Siram 2 minggu sekali, jangan overwater',                                95000, 15, '🌵'),
(4, 'Monstera Deliciosa',    'Monstera dengan daun berlubang ikonik, cocok untuk interior modern minimalis',                               'Siram 2x seminggu, lap daun dengan kain basah',                         320000, 6,  '🌿'),
(4, 'Philodendron Brasil',   'Philodendron dengan corak kuning-hijau yang unik, mudah dirawat',                                            'Siram saat media tanam mulai kering',                                   145000, 12, '🍃'),
(5, 'Sirih Gading Marble',   'Sirih gading dengan corak putih-hijau marble, cocok digantung di kamar',                                    'Siram 2x seminggu, tahan di tempat kurang cahaya',                       85000, 15, '🌱'),
(5, 'String of Pearls',      'Tanaman gantung berbentuk manik-manik hijau unik, sangat estetik',                                           'Siram seminggu sekali, butuh cahaya terang tidak langsung',             120000, 7,  '💚')
ON DUPLICATE KEY UPDATE name = name;

-- Migration: tambah kolom image_url ke tabel products
-- Jalankan: mysql -u root -p nursery_db < database/add_image_url.sql

USE nursery_db;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) DEFAULT NULL
  AFTER image_emoji;

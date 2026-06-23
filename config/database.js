/**
 * config/database.js
 * MySQL connection pool — support env vars lokal (.env) & Railway auto-inject
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  // Fallback: DB_HOST (lokal) → MYSQLHOST → MYSQL_HOST (Railway)
  host:     process.env.DB_HOST     || process.env.MYSQLHOST     || process.env.MYSQL_HOST     || 'localhost',
  user:     process.env.DB_USER     || process.env.MYSQLUSER     || process.env.MYSQL_USER     || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || '',
  database: process.env.DB_NAME     || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'nursery_db',
  port:     Number(process.env.DB_PORT || process.env.MYSQLPORT  || process.env.MYSQL_PORT     || 3306),

  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  connectTimeout:     30000,
});

module.exports = pool;

-- ==============================================
-- Setup Database Lokal untuk Development
-- Jalankan script ini di MySQL Workbench atau phpMyAdmin
-- ==============================================

-- Create database
CREATE DATABASE IF NOT EXISTS absensi_local CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Verify
SHOW DATABASES LIKE 'absensi%';

-- ==============================================
-- Setelah database dibuat, jalankan:
-- cd backend
-- npm run db:push:local
--
-- Ini akan membuat semua tabel dari Prisma schema
-- ==============================================

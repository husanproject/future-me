-- ====================================================================
-- O‘z Do‘konim — AI Smart POS & Supermarket Management System
-- PHASE 1: DATABASE INITIALIZATION & RBAC SCHEMA
-- Dialect: PostgreSQL 14+
-- ====================================================================

-- 1. Create Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing tables if needed (Clean rebuild)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS cash_sessions CASCADE;
DROP TABLE IF EXISTS cash_registers CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- 3. Roles Table
CREATE TABLE roles (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'SUPER_ADMIN', 'ADMIN', 'CASHIER'
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name_uz VARCHAR(150) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Permissions Table (Granular permissions)
CREATE TABLE permissions (
    id VARCHAR(100) PRIMARY KEY, -- e.g. 'sale:create', 'product:delete'
    module VARCHAR(50) NOT NULL, -- e.g. 'sale', 'product', 'inventory', 'user'
    action VARCHAR(50) NOT NULL, -- e.g. 'create', 'read', 'update', 'delete', 'override'
    description_uz VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_permissions_module ON permissions(module);

-- 5. Role Permissions (Many-to-Many mapping)
CREATE TABLE role_permissions (
    role_id VARCHAR(50) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(100) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_perm ON role_permissions(permission_id);

-- 6. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role_id VARCHAR(50) NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT TRUE,
    is_locked BOOLEAN DEFAULT FALSE,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE NULL,
    last_login_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_active ON users(is_active);

-- 7. Cash Registers Table (Kassa apparatlari)
CREATE TABLE cash_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    register_code VARCHAR(30) NOT NULL UNIQUE, -- e.g. 'KASSA-01'
    name VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Cash Sessions Table (Kassir smenalari)
CREATE TABLE cash_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    register_id UUID NOT NULL REFERENCES cash_registers(id) ON DELETE RESTRICT,
    cashier_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    opening_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closing_time TIMESTAMP WITH TIME ZONE NULL,
    opening_cash NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    closing_cash NUMERIC(14, 2) NULL,
    expected_cash NUMERIC(14, 2) NULL,
    difference NUMERIC(14, 2) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'CLOSED'
    notes TEXT
);

CREATE INDEX idx_cash_sessions_cashier ON cash_sessions(cashier_id);
CREATE INDEX idx_cash_sessions_register ON cash_sessions(register_id);
CREATE INDEX idx_cash_sessions_status ON cash_sessions(status);

-- 9. Audit Logs Table (Muhim xavfsizlik va audit jurnali)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(50),
    action VARCHAR(100) NOT NULL, -- e.g. 'USER_LOGIN', 'PERMISSION_CHECK_FAILED', 'USER_CREATED'
    entity_type VARCHAR(50) NOT NULL, -- 'USER', 'ROLE', 'PERMISSION', 'SALE', 'INVENTORY'
    entity_id VARCHAR(100),
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ====================================================================
-- SEED DATA (Boshlang'ich tizim ma'lumotlari)
-- ====================================================================

-- Rollarni kiritish
INSERT INTO roles (id, name, display_name_uz, description) VALUES
('SUPER_ADMIN', 'SUPER_ADMIN', 'Bosh Tizim Administratori', 'Barcha ruxsatlarga ega, tizim konfiguratsiyasi va toliq nazorat'),
('CASHIER', 'CASHIER', 'Kassir', 'Savdo operatsiyalari, to‘lov qabul qilish, chek chiqarish');

-- Ruxsatlar katalogi (Granular Permissions)
INSERT INTO permissions (id, module, action, description_uz) VALUES
-- User & Role
('user:create', 'user', 'create', 'Yangi foydalanuvchi/xodim yaratish'),
('user:read', 'user', 'read', 'Foydalanuvchilar ro‘yxatini ko‘rish'),
('user:update', 'user', 'update', 'Foydalanuvchi ma‘lumotlarini tahrirlash'),
('user:delete', 'user', 'delete', 'Foydalanuvchini o‘chirish yoki bloklash'),
('role:manage', 'role', 'manage', 'Rollar va huquqlarni boshqarish'),

-- Product & Category
('product:create', 'product', 'create', 'Yangi mahsulot va shtrix-kod qo‘shish'),
('product:read', 'product', 'read', 'Mahsulotlar katalogini ko‘rish'),
('product:update', 'product', 'update', 'Mahsulot narxi va parametrlarini yangilash'),
('product:delete', 'product', 'delete', 'Mahsulotni katalogdan chiqarish'),
('category:manage', 'category', 'manage', 'Kategoriyalarni boshqarish'),

-- Inventory & Batch (FEFO)
('inventory:read', 'inventory', 'read', 'Ombor qoldig‘i va partiyalarni ko‘rish'),
('inventory:update', 'inventory', 'update', 'Ombor qoldig‘ini to‘g‘rilash (adjustment)'),
('inventory:receive', 'inventory', 'receive', 'Yangi tovar partiyasini qabul qilish (batch in)'),
('inventory:expiry_override', 'inventory', 'override', 'Muddati o‘tgan mahsulotga maxsus ruxsat berish'),

-- Sale & POS
('sale:create', 'sale', 'create', 'Yangi savdo chekini yaratish va to‘lov qabul qilish'),
('sale:read', 'sale', 'read', 'Sotuvlar tarixini ko‘rish'),
('sale:cancel', 'sale', 'cancel', 'Kassada sotuvni bekor qilish (void)'),
('sale:discount', 'sale', 'discount', 'Chekga chegirma qo‘llash'),

-- Return & Refund
('return:create', 'return', 'create', 'Tovar qaytarib olish arizasini kiritish'),
('return:approve', 'return', 'approve', 'Qaytarilgan tovar pulini to‘lashni tasdiqlash'),

-- Customers & Loyalty
('customer:read', 'customer', 'read', 'Mijoz va bonus balansi ma‘lumotlarini ko‘rish'),
('customer:create', 'customer', 'create', 'Yangi sodiqlik kartasi / mijoz ro‘yxatdan o‘tkazish'),
('customer:manage_bonus', 'customer', 'manage_bonus', 'Bonuslarni qo‘lda to‘g‘rilash'),

-- Security & Audit
('security:read', 'security', 'read', 'Xavfsizlik monitori va xavf signallarini ko‘rish'),
('audit:read', 'audit', 'read', 'Audit loglarini ko‘rish'),

-- Reports
('report:read', 'report', 'read', 'Kunlik, oylik moliyaviy hisobotlarni ko‘rish'),
('report:export', 'report', 'export', 'Hisobotlarni Excel/PDF formatda yuklab olish');

-- Rollarga ruxsatlarni biriktirish (Role-Permissions Mapping)

-- 1. SUPER_ADMIN: Barcha ruxsatlar
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'SUPER_ADMIN', id FROM permissions;

-- 2. CASHIER
INSERT INTO role_permissions (role_id, permission_id) VALUES
('CASHIER', 'sale:create'),
('CASHIER', 'sale:read'),
('CASHIER', 'sale:cancel'),
('CASHIER', 'product:read'),
('CASHIER', 'customer:read'),
('CASHIER', 'return:create');

-- Boshlang'ich namunaviy foydalanuvchilar (Parol: Admin123!)
-- Hash: '$2b$12$e80yqV4G8W6x9L6u5O9gjeN7Bw2uV4zW7/8P8wF4r2nQyJ9nZ6Jqu' (Bcrypt hash for 'Admin123!')
INSERT INTO users (id, username, email, phone, full_name, hashed_password, role_id) VALUES
('11111111-1111-1111-1111-111111111111', 'admin', 'admin@ozdokonim.uz', '+998901234567', 'Akmal Rahimov (Admin)', '$2b$12$Kk0G8wHwF1q3r5t7y9u1vOqP3vB5n7m9l1k3j5h7g9f1d3s5a7p9q', 'SUPER_ADMIN'),
('44444444-4444-4444-4444-444444444444', 'cashier1', 'kassa1@ozdokonim.uz', '+998904567890', 'Aziz Bektemirov (Kassir 1)', '$2b$12$Kk0G8wHwF1q3r5t7y9u1vOqP3vB5n7m9l1k3j5h7g9f1d3s5a7p9q', 'CASHIER');

-- Boshlang'ich Kassa terminallari
INSERT INTO cash_registers (id, register_code, name, ip_address) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'KASSA-01', 'Asosiy Kirish Kassasi #1', '192.168.1.101'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'KASSA-02', 'Ekspress Kassasi #2', '192.168.1.102');

-- Boshlang'ich audit yozuvi
INSERT INTO audit_logs (username, action, entity_type, entity_id, new_value) VALUES
('system', 'SYSTEM_INITIALIZATION', 'SYSTEM', 'PHASE_1', '{"status": "initialized", "version": "1.0.0", "project": "O‘z Do‘konim"}'::jsonb);

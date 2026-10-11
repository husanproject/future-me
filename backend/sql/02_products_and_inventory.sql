-- ====================================================================
-- O‘z Do‘konim — AI Smart POS & Supermarket Management System
-- PHASE 2: PRODUCTS, CATEGORIES, BARCODES & INVENTORY SCHEMA
-- Dialect: PostgreSQL 14+ / 16
-- ====================================================================

-- 1. Units ENUM or check constraint
-- dona, kg, g, litr, ml, quti

-- 2. Categories Table (Ierarxik kategoriyalar)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    icon VARCHAR(50) DEFAULT 'package',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

-- 3. Products Table (Mahsulotlar katalogi)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    barcode VARCHAR(100) NOT NULL, -- Asosiy shtrix-kod
    category_id UUID REFERENCES categories(id) ON DELETE RESTRICT,
    brand VARCHAR(100),
    description TEXT,
    purchase_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    sale_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 12.00, -- O‘zbekiston QQS: 12%
    unit VARCHAR(20) NOT NULL DEFAULT 'dona', -- 'dona', 'kg', 'g', 'litr', 'ml', 'quti'
    weight NUMERIC(10, 3) DEFAULT 0.000,
    current_stock NUMERIC(12, 3) NOT NULL DEFAULT 0.000,
    min_stock NUMERIC(12, 3) NOT NULL DEFAULT 10.000, -- Xavfli qoldiq chegarasi
    max_stock NUMERIC(12, 3) NOT NULL DEFAULT 500.000,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(current_stock);

-- 4. Barcodes Table (Bir mahsulotga bir nechta shtrix-kod: EAN-13, QR, Qadoq kodi)
CREATE TABLE IF NOT EXISTS barcodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    barcode_value VARCHAR(100) NOT NULL UNIQUE,
    barcode_type VARCHAR(30) NOT NULL DEFAULT 'EAN_13', -- EAN_13, EAN_8, CODE_128, QR, INTERNAL
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_barcodes_value ON barcodes(barcode_value);
CREATE INDEX IF NOT EXISTS idx_barcodes_product ON barcodes(product_id);

-- 5. Inventory Movements (Ombor harakatlari: Kirim, Chiqim, Tuzatish, Brak)
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    movement_type VARCHAR(30) NOT NULL, -- 'STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'DAMAGED', 'EXPIRED', 'SALE', 'RETURN'
    quantity NUMERIC(12, 3) NOT NULL,
    unit_cost NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    previous_stock NUMERIC(12, 3) NOT NULL,
    new_stock NUMERIC(12, 3) NOT NULL,
    reference_id VARCHAR(100), -- Masalan chek raqami yoki qabul hujjati
    reason TEXT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inv_movements_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inv_movements_type ON inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_inv_movements_created ON inventory_movements(created_at DESC);

-- ====================================================================
-- SEED DATA (O'zbekiston supermarket mahsulotlari va kategoriyalari)
-- ====================================================================

-- Asosiy kategoriyalar
INSERT INTO categories (id, name, description, icon) VALUES
('11111111-2222-3333-4444-555555555001', 'Ichimliklar & Suvlar', 'Gazlangan ichimliklar, sharbatlar va mineral suvlar', 'cup-soda'),
('11111111-2222-3333-4444-555555555002', 'Sut & Qatiq Mahsulotlari', 'Sut, qatiq, pishloq, saryog‘ va tvorog', 'milk'),
('11111111-2222-3333-4444-555555555003', 'Oziq-ovqat & Baqoliyya', 'Un, yog‘, guruch, makaron va shakar', 'wheat'),
('11111111-2222-3333-4444-555555555004', 'Non & Qandolat', 'Non, bulochka, pechenye va shirinliklar', 'cake'),
('11111111-2222-3333-4444-555555555005', 'Meva & Sabzavotlar', 'Vaznli toza yangi mevalar va sabzavotlar', 'apple'),
('11111111-2222-3333-4444-555555555006', 'Go‘sht & Kolbasa', 'Mol go‘shti, tovuq va dudlangan go‘sht mahsulotlari', 'drumstick')
ON CONFLICT (id) DO NOTHING;

-- Namunaviy tovarlar va shtrix-kodlar
INSERT INTO products (id, name, sku, barcode, category_id, brand, purchase_price, sale_price, tax_rate, unit, current_stock, min_stock) VALUES
('22222222-3333-4444-5555-666666666001', 'Coca-Cola Classic 1.5L', 'BEV-CC-15L', '5449000000996', '11111111-2222-3333-4444-555555555001', 'Coca-Cola', 11500.00, 14500.00, 12.00, 'dona', 120.000, 25.000),
('22222222-3333-4444-5555-666666666002', 'Nestle Sut 3.2% 1L TetraPak', 'MILK-NST-32', '4607001770014', '11111111-2222-3333-4444-555555555002', 'Nestle', 14000.00, 17500.00, 12.00, 'dona', 48.000, 15.000),
('22222222-3333-4444-5555-666666666003', 'Dena O‘rik Sharbat 1L', 'JUC-DENA-ORIK', '4780004560012', '11111111-2222-3333-4444-555555555001', 'Dena', 11000.00, 13900.00, 12.00, 'dona', 65.000, 20.000),
('22222222-3333-4444-5555-666666666004', 'Oqtepa Qatiq 1kg Plastik', 'MILK-QAT-1KG', '4780001239999', '11111111-2222-3333-4444-555555555002', 'Oqtepa', 9200.00, 11500.00, 12.00, 'dona', 35.000, 10.000),
('22222222-3333-4444-5555-666666666005', 'Makfa Oliy Nav Un 2kg', 'GROC-MKF-2KG', '4601444001201', '11111111-2222-3333-4444-555555555003', 'Makfa', 21000.00, 26000.00, 12.00, 'dona', 80.000, 15.000),
('22222222-3333-4444-5555-666666666006', 'Shakar Oq Tozalangan (kg)', 'GROC-SHAK-KG', '4780000000011', '11111111-2222-3333-4444-555555555003', 'Xorazm Shakar', 12500.00, 14500.00, 12.00, 'kg', 240.500, 50.000),
('22222222-3333-4444-5555-666666666007', 'Samarqand Obi Non (dona)', 'BAK-SAM-NON', '2000000000077', '11111111-2222-3333-4444-555555555004', 'Lokal Nonvoyxona', 4000.00, 5500.00, 0.00, 'dona', 18.000, 20.000),
('22222222-3333-4444-5555-666666666008', 'Olma Golden Yangi Hosil (kg)', 'FRU-OLMA-GLD', '2100000000088', '11111111-2222-3333-4444-555555555005', 'Farg‘ona Bog‘lari', 16000.00, 21000.00, 0.00, 'kg', 95.200, 15.000)
ON CONFLICT (id) DO NOTHING;

-- Shtrix-kodlar kiritish
INSERT INTO barcodes (product_id, barcode_value, barcode_type, is_primary) VALUES
('22222222-3333-4444-5555-666666666001', '5449000000996', 'EAN_13', TRUE),
('22222222-3333-4444-5555-666666666002', '4607001770014', 'EAN_13', TRUE),
('22222222-3333-4444-5555-666666666003', '4780004560012', 'EAN_13', TRUE),
('22222222-3333-4444-5555-666666666004', '4780001239999', 'EAN_13', TRUE),
('22222222-3333-4444-5555-666666666005', '4601444001201', 'EAN_13', TRUE),
('22222222-3333-4444-5555-666666666006', '4780000000011', 'EAN_13', TRUE),
('22222222-3333-4444-5555-666666666007', '2000000000077', 'INTERNAL', TRUE),
('22222222-3333-4444-5555-666666666008', '2100000000088', 'INTERNAL', TRUE)
ON CONFLICT (barcode_value) DO NOTHING;

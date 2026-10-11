-- ====================================================================
-- O‘z Do‘konim — AI Smart POS & Supermarket Management System
-- PHASE 3: BATCHES, EXPIRY MONITORING & FEFO SCHEMA
-- Dialect: PostgreSQL 14+ / 16
-- ====================================================================

-- 1. Suppliers Table (Yetkazib beruvchi kontragentlar)
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    company_name VARCHAR(200),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    contact_person VARCHAR(150),
    tax_id VARCHAR(50), -- INN
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_phone ON suppliers(phone);

-- 2. Batches Table (Tovarlar partiyalari - FEFO tayanchi)
CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    batch_number VARCHAR(100) NOT NULL, -- e.g. 'BATCH-2026-A101'
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    purchase_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    initial_quantity NUMERIC(12, 3) NOT NULL,
    current_quantity NUMERIC(12, 3) NOT NULL,
    manufacture_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'DEPLETED', 'EXPIRED', 'QUARANTINE'
    is_recalled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_batches_product ON batches(product_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON batches(expiry_date ASC); -- Critical for FEFO index scan!
CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status);
CREATE INDEX IF NOT EXISTS idx_batches_qty ON batches(current_quantity);

-- 3. Expiry Overrides Table (Muddati yaqin/o'tgan tovar sotuviga maxsus ruxsatlar)
CREATE TABLE IF NOT EXISTS expiry_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reason TEXT NOT NULL,
    approved_discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expiry_overrides_batch ON expiry_overrides(batch_id);

-- ====================================================================
-- SEED DATA (Yetkazib beruvchilar va Partiyalar)
-- ====================================================================

-- Yetkazib beruvchilar
INSERT INTO suppliers (id, name, company_name, phone, contact_person, tax_id, address) VALUES
('33333333-1111-2222-3333-444444444001', 'CCI Uzbekistan MChJ', 'Coca-Cola Ichimligi Uzbekiston', '+998712001122', 'Bobur Mirzayev', '200112233', 'Toshkent sh., Bektemir tumani'),
('33333333-1111-2222-3333-444444444002', 'Nestle Food LLC', 'Nestle O‘zbekiston Qo‘shma Korxonasi', '+998712334455', 'Jahongir Qosimov', '201998877', 'Namangan sh., Sanoat zonasi'),
('33333333-1111-2222-3333-444444444003', 'Marwin Juice MChJ', 'Dena Sharbatlari Ishlab Chiqarish', '+998712889900', 'Mansur Aliyev', '302445566', 'Toshkent vil., Zangiota tumani')
ON CONFLICT (id) DO NOTHING;

-- Boshlang'ich Partiyalar (FEFO va Expiry sinovlari uchun tayyorlangan)
-- Bugungi sana: 2026-10-09
INSERT INTO batches (id, product_id, batch_number, supplier_id, purchase_price, initial_quantity, current_quantity, manufacture_date, expiry_date, status) VALUES
-- 1. Nestle Sut (Muddati 2 kun qolgan - RED CRITICAL ALERT: 2026-10-11)
('44444444-1111-2222-3333-555555555001', '22222222-3333-4444-5555-666666666002', 'BAT-NST-OCT-A1', '33333333-1111-2222-3333-444444444002', 14000.00, 30.000, 18.000, '2026-09-10', '2026-10-11', 'ACTIVE'),

-- 2. Nestle Sut (Muddati 25 kun qolgan - YELLOW TIER: 2026-11-04)
('44444444-1111-2222-3333-555555555002', '22222222-3333-4444-5555-666666666002', 'BAT-NST-NOV-B2', '33333333-1111-2222-3333-444444444002', 14000.00, 40.000, 30.000, '2026-10-01', '2026-11-04', 'ACTIVE'),

-- 3. Dena Sharbat (Muddati 10 kun qolgan - ORANGE TIER: 2026-10-19)
('44444444-1111-2222-3333-555555555003', '22222222-3333-4444-5555-666666666003', 'BAT-DENA-OCT-19', '33333333-1111-2222-3333-444444444003', 11000.00, 25.000, 12.000, '2026-04-19', '2026-10-19', 'ACTIVE'),

-- 4. Oqtepa Qatiq (Muddati 5 kun qolgan - RED TIER: 2026-10-14)
('44444444-1111-2222-3333-555555555004', '22222222-3333-4444-5555-666666666004', 'BAT-QAT-OCT-14', NULL, 9200.00, 40.000, 22.000, '2026-10-04', '2026-10-14', 'ACTIVE'),

-- 5. Coca-Cola 1.5L (Muddati 75 kun qolgan - GREEN TIER: 2026-12-24)
('44444444-1111-2222-3333-555555555005', '22222222-3333-4444-5555-666666666001', 'BAT-CC-DEC-24', '33333333-1111-2222-3333-444444444001', 11500.00, 120.000, 120.000, '2026-06-24', '2026-12-24', 'ACTIVE'),

-- 6. Samarqand Non (Muddati kecha o'tgan - CRITICAL EXPIRED: 2026-10-08)
('44444444-1111-2222-3333-555555555006', '22222222-3333-4444-5555-666666666007', 'BAT-NON-OCT-08', NULL, 4000.00, 20.000, 5.000, '2026-10-06', '2026-10-08', 'EXPIRED')
ON CONFLICT (id) DO NOTHING;

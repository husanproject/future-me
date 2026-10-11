-- ====================================================================
-- O‘z Do‘konim — AI Smart POS & Supermarket Management System
-- PHASE 5: CUSTOMERS, LOYALTY (BONUS/CASHBACK) & PROMOTIONS DDL
-- Dialect: PostgreSQL 14+
-- ====================================================================

-- 1. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(128) NOT NULL,
    phone VARCHAR(32) UNIQUE NOT NULL,
    card_number VARCHAR(64) UNIQUE,
    bonus_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (bonus_balance >= 0),
    total_spent NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (total_spent >= 0),
    orders_count INTEGER NOT NULL DEFAULT 0 CHECK (orders_count >= 0),
    discount_tier_percent NUMERIC(5, 2) NOT NULL DEFAULT 1.00 CHECK (discount_tier_percent >= 0 AND discount_tier_percent <= 50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_card_no ON customers(card_number);

-- 2. Promotions & Promo Codes Table
CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    code VARCHAR(32) UNIQUE,
    discount_type VARCHAR(32) NOT NULL DEFAULT 'PERCENTAGE' CHECK (discount_type IN ('PERCENTAGE', 'FIXED', 'BUY_X_GET_Y')),
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
    min_order_amount NUMERIC(14, 2),
    target_category_id UUID REFERENCES categories(id),
    target_product_id UUID REFERENCES products(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(code);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active);

-- 3. Customer Bonus Ledger (Audit trail for cashback earned & redeemed)
CREATE TABLE IF NOT EXISTS customer_bonus_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES sales(id),
    points_delta NUMERIC(14, 2) NOT NULL,
    resulting_balance NUMERIC(14, 2) NOT NULL,
    action_type VARCHAR(32) NOT NULL CHECK (action_type IN ('EARNED_SALE', 'USED_PURCHASE', 'MANUAL_ADJUSTMENT', 'REFUND_REVERSAL')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bonus_logs_customer_id ON customer_bonus_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_bonus_logs_created_at ON customer_bonus_logs(created_at DESC);

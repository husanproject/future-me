-- ====================================================================
-- O‘z Do‘konim — AI Smart POS & Supermarket Management System
-- PHASE 4: POS TERMINAL, SALES, RECEIPTS & RETURNS (POSTGRESQL DDL)
-- Dialect: PostgreSQL 14+
-- ====================================================================

-- 1. Enum for payment methods
DO $$ BEGIN
    CREATE TYPE payment_method_enum AS ENUM (
        'CASH', 'UZCARD', 'HUMO', 'CLICK', 'PAYME', 'SPLIT'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. Enum for sale statuses
DO $$ BEGIN
    CREATE TYPE sale_status_enum AS ENUM (
        'COMPLETED', 'CANCELLED', 'REFUNDED', 'PARTIAL_REFUND'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 3. Sales Header (Receipts) Table
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number VARCHAR(64) UNIQUE NOT NULL,
    cashier_id UUID NOT NULL REFERENCES users(id),
    register_id VARCHAR(32) NOT NULL DEFAULT 'reg-01',
    shift_id UUID,
    customer_id UUID,
    customer_name VARCHAR(128),
    customer_phone VARCHAR(32),
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    discount_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    bonus_used NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tax_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    payment_method payment_method_enum NOT NULL DEFAULT 'CASH',
    amount_paid NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    change_returned NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    bonus_earned NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    status sale_status_enum NOT NULL DEFAULT 'COMPLETED',
    fiscal_sign VARCHAR(64),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_receipt_no ON sales(receipt_number);
CREATE INDEX IF NOT EXISTS idx_sales_cashier_id ON sales(cashier_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);

-- 4. Sale Items (Line items with FEFO batch traceability)
CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    barcode VARCHAR(64) NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(16) NOT NULL DEFAULT 'dona',
    unit_price NUMERIC(14, 2) NOT NULL CHECK (unit_price >= 0),
    discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (discount_percent >= 0 AND discount_percent <= 100),
    total_price NUMERIC(14, 2) NOT NULL CHECK (total_price >= 0),
    batch_id UUID REFERENCES product_batches(id),
    batch_number VARCHAR(64),
    cost_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_batch_id ON sale_items(batch_id);

-- 5. Customer Returns Table (Refunds)
CREATE TABLE IF NOT EXISTS returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id),
    receipt_number VARCHAR(64) NOT NULL,
    cashier_id UUID NOT NULL REFERENCES users(id),
    total_refund_amount NUMERIC(14, 2) NOT NULL CHECK (total_refund_amount >= 0),
    payment_method payment_method_enum NOT NULL DEFAULT 'CASH',
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_returns_sale_id ON returns(sale_id);
CREATE INDEX IF NOT EXISTS idx_returns_created_at ON returns(created_at DESC);

-- 6. Return Line Items
CREATE TABLE IF NOT EXISTS return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(14, 2) NOT NULL,
    refund_amount NUMERIC(14, 2) NOT NULL,
    reason TEXT,
    restock_to_inventory BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_return_items_return_id ON return_items(return_id);

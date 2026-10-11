-- ====================================================================
-- O‘z Do‘konim — AI Smart POS & Supermarket Management System
-- PHASE 6: CASHIER SHIFTS, Z-REPORTS & AI INTELLIGENCE DDL
-- Dialect: PostgreSQL 14+
-- ====================================================================

-- 1. Cashier Shifts Table (Kassa Smenalari va Z-Otchetlar)
CREATE TABLE IF NOT EXISTS cashier_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    register_id VARCHAR(32) NOT NULL DEFAULT 'reg-01',
    register_name VARCHAR(128) NOT NULL DEFAULT 'Kassa №1',
    cashier_id UUID NOT NULL REFERENCES users(id),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMPTZ,
    opening_cash NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    closing_cash NUMERIC(14, 2),
    expected_cash NUMERIC(14, 2),
    cash_discrepancy NUMERIC(14, 2) DEFAULT 0.00,
    total_sales_count INTEGER NOT NULL DEFAULT 0,
    total_revenue NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    cash_sales NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    card_sales NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    online_sales NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    returns_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    z_report_number VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shifts_cashier_id ON cashier_shifts(cashier_id);
CREATE INDEX IF NOT EXISTS idx_shifts_opened_at ON cashier_shifts(opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_shifts_is_closed ON cashier_shifts(is_closed);

-- 2. AI Sales Forecasts Table (ML Time-Series Model Output)
CREATE TABLE IF NOT EXISTS ai_sales_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    forecast_date DATE NOT NULL DEFAULT CURRENT_DATE,
    avg_daily_sales NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    days_until_stockout NUMERIC(8, 1) NOT NULL DEFAULT 0.0,
    forecast_next_7_days NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    confidence_score NUMERIC(5, 3) NOT NULL DEFAULT 0.900,
    recommended_reorder_qty INTEGER NOT NULL DEFAULT 0,
    demand_trend VARCHAR(16) NOT NULL DEFAULT 'STABLE' CHECK (demand_trend IN ('RISING', 'STABLE', 'FALLING')),
    stockout_risk VARCHAR(16) NOT NULL DEFAULT 'LOW' CHECK (stockout_risk IN ('HIGH', 'MEDIUM', 'LOW')),
    weekend_lift_percent NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_forecast_product_id ON ai_sales_forecasts(product_id);

-- 3. AI Security & Fraud Anomalies Table
CREATE TABLE IF NOT EXISTS ai_security_anomalies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level VARCHAR(16) NOT NULL CHECK (level IN ('CRITICAL', 'WARNING', 'INFO')),
    category VARCHAR(32) NOT NULL CHECK (category IN ('FRAUD', 'STOCK', 'EXPIRY', 'SHIFT', 'THEFT')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id),
    resolution_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_anomalies_detected_at ON ai_security_anomalies(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomalies_level ON ai_security_anomalies(level);

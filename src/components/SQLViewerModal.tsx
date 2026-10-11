import React, { useState } from 'react';
import { X, Copy, Check, Database, Terminal, FileCode, Layers } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type TabKey = 'sql_rbac' | 'sql_products' | 'sql_batches' | 'sql_pos' | 'sql_customers' | 'sql_ai' | 'docker';

export const SQLViewerModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('sql_pos');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const files: Record<TabKey, { title: string; content: string }> = {
    sql_pos: {
      title: '04_pos_sales_receipts.sql',
      content: `-- ====================================================================
-- O‘z Do‘konim — AI Smart POS & Supermarket Management System
-- PHASE 4: POS TERMINAL, SALES, RECEIPTS & RETURNS (POSTGRESQL DDL)
-- ====================================================================

CREATE TYPE payment_method_enum AS ENUM ('CASH', 'UZCARD', 'HUMO', 'CLICK', 'PAYME', 'SPLIT');
CREATE TYPE sale_status_enum AS ENUM ('COMPLETED', 'CANCELLED', 'REFUNDED', 'PARTIAL_REFUND');

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
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    barcode VARCHAR(64) NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(16) NOT NULL DEFAULT 'dona',
    unit_price NUMERIC(14, 2) NOT NULL,
    discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(14, 2) NOT NULL,
    batch_id UUID REFERENCES product_batches(id),
    batch_number VARCHAR(64),
    cost_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id),
    receipt_number VARCHAR(64) NOT NULL,
    cashier_id UUID NOT NULL REFERENCES users(id),
    total_refund_amount NUMERIC(14, 2) NOT NULL,
    payment_method payment_method_enum NOT NULL DEFAULT 'CASH',
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);`
    },
    sql_batches: {
      title: '03_batch_expiry_fefo.sql',
      content: `-- ====================================================================
-- PHASE 3: PARTIYALAR, MUDDATLAR VA FEFO ALGORITMI
-- ====================================================================

CREATE TYPE expiry_tier_enum AS ENUM ('GREEN', 'YELLOW', 'ORANGE', 'RED', 'CRITICAL');
CREATE TYPE batch_status_enum AS ENUM ('ACTIVE', 'DEPLETED', 'EXPIRED', 'QUARANTINE');

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    email VARCHAR(128),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    batch_number VARCHAR(64) NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    purchase_price NUMERIC(14, 2) NOT NULL,
    initial_quantity NUMERIC(12, 3) NOT NULL,
    current_quantity NUMERIC(12, 3) NOT NULL,
    manufacture_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    expiry_tier expiry_tier_enum NOT NULL DEFAULT 'GREEN',
    status batch_status_enum NOT NULL DEFAULT 'ACTIVE',
    is_expired BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);`
    },
    sql_customers: {
      title: '05_customers_loyalty_promotions.sql',
      content: `-- ====================================================================
-- PHASE 5: MIJOZLAR, SODIQLIK DASTURI & AKSIYALAR
-- ====================================================================

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(128) NOT NULL,
    phone VARCHAR(32) UNIQUE NOT NULL,
    card_number VARCHAR(64) UNIQUE,
    bonus_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_spent NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    orders_count INTEGER NOT NULL DEFAULT 0,
    discount_tier_percent NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    code VARCHAR(32) UNIQUE,
    discount_type VARCHAR(32) NOT NULL DEFAULT 'PERCENTAGE',
    discount_value NUMERIC(10, 2) NOT NULL,
    min_order_amount NUMERIC(14, 2),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);`
    },
    sql_ai: {
      title: '06_ai_analytics_and_shifts.sql',
      content: `-- ====================================================================
-- PHASE 6: KASSA SMENALARI, Z-HISOBOT VA AI PROGNOZ
-- ====================================================================

CREATE TABLE IF NOT EXISTS cashier_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    register_id VARCHAR(32) NOT NULL DEFAULT 'reg-01',
    register_name VARCHAR(128) NOT NULL,
    cashier_id UUID NOT NULL REFERENCES users(id),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMPTZ,
    opening_cash NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    closing_cash NUMERIC(14, 2),
    expected_cash NUMERIC(14, 2),
    cash_discrepancy NUMERIC(14, 2) DEFAULT 0.00,
    total_sales_count INTEGER NOT NULL DEFAULT 0,
    total_revenue NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    z_report_number VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS ai_sales_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    avg_daily_sales NUMERIC(10, 2) NOT NULL,
    days_until_stockout NUMERIC(8, 1) NOT NULL,
    forecast_next_7_days NUMERIC(10, 2) NOT NULL,
    recommended_reorder_qty INTEGER NOT NULL,
    confidence_score NUMERIC(5, 3) NOT NULL,
    demand_trend VARCHAR(16) NOT NULL DEFAULT 'STABLE'
);`
    },
    sql_products: {
      title: '02_products_and_inventory.sql',
      content: `-- ====================================================================
-- PHASE 2: MAHSULOTLAR VA OMBOR HARAKATLARI
-- ====================================================================

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(64) UNIQUE NOT NULL,
    barcode VARCHAR(64) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    brand VARCHAR(100),
    purchase_price NUMERIC(14, 2) NOT NULL,
    sale_price NUMERIC(14, 2) NOT NULL,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 12.00,
    unit VARCHAR(16) NOT NULL DEFAULT 'dona',
    min_stock NUMERIC(12, 3) NOT NULL DEFAULT 5.000,
    total_stock NUMERIC(12, 3) NOT NULL DEFAULT 0.000,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);`
    },
    sql_rbac: {
      title: '01_init_schema.sql',
      content: `-- ====================================================================
-- PHASE 1: RBAC VA FOYDALANUVCHILAR
-- ====================================================================

CREATE TABLE roles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name_uz VARCHAR(150) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT TRUE
);

CREATE TABLE permissions (
    id VARCHAR(100) PRIMARY KEY,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description_uz VARCHAR(255) NOT NULL
);

CREATE TABLE role_permissions (
    role_id VARCHAR(50) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(100) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    role_id VARCHAR(50) NOT NULL REFERENCES roles(id),
    is_active BOOLEAN DEFAULT TRUE
);`
    },
    docker: {
      title: 'docker-compose.yml',
      content: `version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: oz_dokonim_postgres
    restart: always
    environment:
      POSTGRES_DB: oz_dokonim_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: SecretPassword2026!
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: oz_dokonim_redis
    ports:
      - "6379:6379"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: oz_dokonim_backend
    restart: always
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis

volumes:
  pgdata:
`
    }
  };

  const currentFile = files[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] my-8">

        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">PostgreSQL Sxema & Docker DDL Ko‘ruvchi</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs flex items-center gap-1.5 transition text-slate-300 hover:text-white"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Nusxa olindi!' : 'Nusxalash'}</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-2 bg-slate-950 border-b border-slate-800 overflow-x-auto">
          {[
            { id: 'sql_pos', label: '04_POS_Sales.sql' },
            { id: 'sql_batches', label: '03_Batches_FEFO.sql' },
            { id: 'sql_customers', label: '05_Customers.sql' },
            { id: 'sql_ai', label: '06_AI_Shifts.sql' },
            { id: 'sql_products', label: '02_Products.sql' },
            { id: 'sql_rbac', label: '01_RBAC.sql' },
            { id: 'docker', label: 'docker-compose.yml' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950/80 font-mono text-xs text-emerald-400 leading-relaxed selection:bg-emerald-800 selection:text-white">
          <pre>{currentFile.content}</pre>
        </div>

      </div>
    </div>
  );
};

export type PaymentMethod = 'CASH' | 'UZCARD' | 'HUMO' | 'CLICK' | 'PAYME' | 'SPLIT';
export type SaleStatus = 'COMPLETED' | 'CANCELLED' | 'REFUNDED';

export interface CartItem {
  id: string; // unique item id in cart
  product_id: string;
  product_name: string;
  barcode: string;
  unit: string;
  sale_price: number;
  discount_percent: number;
  quantity: number;
  tax_rate: number;
  // FEFO allocated batch
  batch_id?: string;
  batch_number?: string;
  batch_expiry_date?: string;
  days_to_expiry?: number;
  is_expired?: boolean;
}

export interface Customer {
  id: string;
  full_name: string;
  phone: string;
  card_number?: string;
  bonus_balance: number; // in UZS or points
  total_spent: number;
  orders_count: number;
  discount_tier_percent: number; // e.g. 2% or 5%
  is_active: boolean;
  notes?: string;
  created_at: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  code?: string;
  discount_type: 'PERCENTAGE' | 'FIXED' | 'BUY_X_GET_Y';
  discount_value: number;
  min_order_amount?: number;
  target_category_id?: string;
  target_product_id?: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface SaleItemRecord {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  barcode: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_percent: number;
  total_price: number;
  batch_id?: string;
  batch_number?: string;
  cost_price: number;
}

export interface SaleTransaction {
  id: string;
  receipt_number: string;
  cashier_id: string;
  cashier_name: string;
  register_id: string;
  shift_id?: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  subtotal: number;
  discount_total: number;
  bonus_used: number;
  tax_total: number;
  grand_total: number;
  payment_method: PaymentMethod;
  amount_paid: number;
  change_returned: number;
  status: SaleStatus;
  items: SaleItemRecord[];
  bonus_earned: number;
  fiscal_sign?: string;
  created_at: string;
  notes?: string;
}

export interface ReturnRecord {
  id: string;
  sale_id: string;
  receipt_number: string;
  cashier_id: string;
  cashier_name: string;
  customer_name?: string;
  returned_items: {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    refund_amount: number;
    reason: string;
    restock_to_inventory: boolean;
  }[];
  total_refund_amount: number;
  payment_method: PaymentMethod;
  reason: string;
  created_at: string;
}

export interface CashierShift {
  id: string;
  register_id: string;
  register_name: string;
  cashier_id: string;
  cashier_name: string;
  opened_at: string;
  closed_at?: string;
  opening_cash: number;
  closing_cash?: number;
  expected_cash?: number;
  cash_discrepancy?: number;
  total_sales_count: number;
  total_revenue: number;
  cash_sales: number;
  card_sales: number; // Uzcard / Humo
  online_sales: number; // Click / Payme
  returns_total: number;
  is_closed: boolean;
  z_report_number?: string;
}

export interface AIForecastMetric {
  product_id: string;
  product_name: string;
  category_name: string;
  current_stock: number;
  avg_daily_sales: number;
  days_until_stockout: number;
  forecast_next_7_days: number;
  confidence_score: number; // 0.0 - 1.0
  recommended_reorder_qty: number;
  demand_trend: 'RISING' | 'STABLE' | 'FALLING';
  stockout_risk: 'HIGH' | 'MEDIUM' | 'LOW';
  weekend_lift_percent: number;
}

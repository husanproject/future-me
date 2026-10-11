export type ExpiryTier = 'CRITICAL' | 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN';

export type BatchStatus = 'ACTIVE' | 'DEPLETED' | 'EXPIRED' | 'QUARANTINE';

export interface Supplier {
  id: string;
  name: string;
  company_name?: string;
  phone: string;
  email?: string;
  contact_person?: string;
  tax_id?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
}

export interface Batch {
  id: string;
  product_id: string;
  product_name?: string;
  batch_number: string;
  supplier_id?: string;
  supplier_name?: string;
  purchase_price: number;
  initial_quantity: number;
  current_quantity: number;
  manufacture_date: string; // YYYY-MM-DD
  expiry_date: string; // YYYY-MM-DD
  days_to_expiry: number;
  expiry_tier: ExpiryTier;
  status: BatchStatus;
  is_expired: boolean;
  is_recalled: boolean;
  unit?: string;
  created_at: string;
}

export interface FEFODispatchItem {
  batch_id: string;
  batch_number: string;
  expiry_date: string;
  days_to_expiry: number;
  allocated_quantity: number;
  available_in_batch: number;
  is_expired: boolean;
  fefo_priority_rank: number;
}

export interface ExpiryAlert {
  batch_id: string;
  product_id: string;
  product_name: string;
  barcode: string;
  batch_number: string;
  current_quantity: number;
  unit: string;
  expiry_date: string;
  days_left: number;
  tier: ExpiryTier;
  ai_recommendation_summary?: string;
}

export interface AIExpiryRecommendation {
  batch_id: string;
  product_name: string;
  tier: ExpiryTier;
  days_remaining: number;
  current_stock: number;
  daily_velocity: number;
  natural_expected_sales: number;
  expected_waste_without_discount: number;
  recommended_discount_percent: number;
  clearance_probability: number;
  action_title: string;
  ai_insight_uz: string;
  discounted_price: number;
  projected_revenue_uzs: number;
  potential_waste_loss_uzs: number;
  requires_admin_approval: boolean;
}

export interface ExpiryOverride {
  id: string;
  batch_id: string;
  product_id: string;
  admin_id: string;
  admin_username?: string;
  reason: string;
  approved_discount_percent: number;
  expires_at: string;
  created_at: string;
}

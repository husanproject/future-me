export type UnitType = 'dona' | 'kg' | 'g' | 'litr' | 'ml' | 'quti';

export type BarcodeType = 'EAN_13' | 'EAN_8' | 'CODE_128' | 'QR' | 'INTERNAL';

export type MovementType =
  | 'STOCK_IN'
  | 'STOCK_OUT'
  | 'ADJUSTMENT'
  | 'DAMAGED'
  | 'EXPIRED'
  | 'SALE'
  | 'RETURN';

export interface Category {
  id: string;
  name: string;
  parent_id?: string | null;
  icon?: string;
  description?: string;
  product_count?: number;
  created_at: string;
}

export interface BarcodeItem {
  id: string;
  product_id: string;
  barcode_value: string;
  barcode_type: BarcodeType;
  is_primary: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category_id?: string;
  category_name?: string;
  brand?: string;
  description?: string;
  purchase_price: number;
  sale_price: number;
  tax_rate: number; // 12% in Uzbekistan
  unit: UnitType;
  weight?: number;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  is_active: boolean;
  is_low_stock?: boolean;
  barcodes?: BarcodeItem[];
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  product_name?: string;
  movement_type: MovementType;
  quantity: number;
  unit_cost: number;
  previous_stock: number;
  new_stock: number;
  reason?: string;
  reference_id?: string;
  user_id?: string;
  username?: string;
  created_at: string;
}

export interface BarcodeLookupResult {
  found: boolean;
  product?: Product;
  matched_barcode: string;
  barcode_type: BarcodeType;
  lookup_time_ms: number;
}

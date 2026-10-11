export type RoleId =
  | 'SUPER_ADMIN'
  | 'CASHIER';

export interface Permission {
  id: string;
  module: 'user' | 'role' | 'product' | 'inventory' | 'sale' | 'return' | 'customer' | 'security' | 'audit' | 'report' | 'category';
  action: 'create' | 'read' | 'update' | 'delete' | 'manage' | 'override' | 'cancel' | 'discount' | 'approve' | 'receive' | 'export' | 'manage_bonus';
  description_uz: string;
}

export interface Role {
  id: RoleId;
  name: string;
  display_name_uz: string;
  description: string;
  is_system: boolean;
  permissions: Permission[];
}

export interface User {
  id: string;
  username: string;
  email?: string;
  phone: string;
  full_name: string;
  role_id: RoleId;
  role_name?: string;
  role_display_name_uz?: string;
  permissions?: string[];
  is_active: boolean;
  is_locked: boolean;
  failed_login_attempts: number;
  last_login_at?: string;
  created_at: string;
}

export interface CashRegister {
  id: string;
  register_code: string;
  name: string;
  ip_address?: string;
  is_active: boolean;
}

export interface AuditLogItem {
  id: string;
  user_id?: string;
  username?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_value?: any;
  new_value?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

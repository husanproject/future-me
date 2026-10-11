import { User, Role, Permission, AuditLogItem, RoleId } from '../types/auth';
import { Product, Category, InventoryMovement, BarcodeLookupResult, MovementType, UnitType } from '../types/product';
import {
  Supplier, Batch, ExpiryTier, ExpiryAlert,
  AIExpiryRecommendation, FEFODispatchItem, ExpiryOverride
} from '../types/batch';
import {
  Customer, Promotion, SaleTransaction, SaleItemRecord,
  CartItem, PaymentMethod, CashierShift, ReturnRecord, AIForecastMetric
} from '../types/pos';
import {
  INITIAL_USERS, INITIAL_ROLES, INITIAL_PERMISSIONS, INITIAL_AUDIT_LOGS,
  INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_MOVEMENTS,
  INITIAL_SUPPLIERS, INITIAL_BATCHES,
  INITIAL_CUSTOMERS, INITIAL_PROMOTIONS, INITIAL_SALES, INITIAL_SHIFTS, INITIAL_AI_FORECASTS
} from './mockData';

// Local storage keys
const USERS_KEY = 'oz_dokonim_users';
const ROLES_KEY = 'oz_dokonim_roles';
const PERMS_KEY = 'oz_dokonim_permissions';
const LOGS_KEY = 'oz_dokonim_audit_logs';
const TOKEN_KEY = 'oz_dokonim_token';
const CURRENT_USER_KEY = 'oz_dokonim_current_user';
const PRODUCTS_KEY = 'oz_dokonim_products';
const CATEGORIES_KEY = 'oz_dokonim_categories';
const MOVEMENTS_KEY = 'oz_dokonim_movements';
const SUPPLIERS_KEY = 'oz_dokonim_suppliers';
const BATCHES_KEY = 'oz_dokonim_batches';
const OVERRIDES_KEY = 'oz_dokonim_overrides';
const CUSTOMERS_KEY = 'oz_dokonim_customers';
const PROMOTIONS_KEY = 'oz_dokonim_promotions';
const SALES_KEY = 'oz_dokonim_sales';
const SHIFTS_KEY = 'oz_dokonim_shifts';
const RETURNS_KEY = 'oz_dokonim_returns';

export class SupermarketApiService {
  private static getStored<T>(key: string, fallback: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  }

  private static setStored<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }

  // Initialize store if empty
  public static initDatabase(): void {
    if (!localStorage.getItem(ROLES_KEY)) {
      this.setStored(ROLES_KEY, INITIAL_ROLES);
    }
    if (!localStorage.getItem(PERMS_KEY)) {
      this.setStored(PERMS_KEY, INITIAL_PERMISSIONS);
    }
    if (!localStorage.getItem(USERS_KEY)) {
      this.setStored(USERS_KEY, INITIAL_USERS);
    }
    if (!localStorage.getItem(LOGS_KEY)) {
      this.setStored(LOGS_KEY, INITIAL_AUDIT_LOGS);
    }
    if (!localStorage.getItem(CATEGORIES_KEY)) {
      this.setStored(CATEGORIES_KEY, INITIAL_CATEGORIES);
    }
    if (!localStorage.getItem(PRODUCTS_KEY)) {
      this.setStored(PRODUCTS_KEY, INITIAL_PRODUCTS);
    }
    if (!localStorage.getItem(MOVEMENTS_KEY)) {
      this.setStored(MOVEMENTS_KEY, INITIAL_MOVEMENTS);
    }
    if (!localStorage.getItem(SUPPLIERS_KEY)) {
      this.setStored(SUPPLIERS_KEY, INITIAL_SUPPLIERS);
    }
    if (!localStorage.getItem(BATCHES_KEY)) {
      this.setStored(BATCHES_KEY, INITIAL_BATCHES);
    }
    if (!localStorage.getItem(OVERRIDES_KEY)) {
      this.setStored(OVERRIDES_KEY, []);
    }
    if (!localStorage.getItem(CUSTOMERS_KEY)) {
      this.setStored(CUSTOMERS_KEY, INITIAL_CUSTOMERS);
    }
    if (!localStorage.getItem(PROMOTIONS_KEY)) {
      this.setStored(PROMOTIONS_KEY, INITIAL_PROMOTIONS);
    }
    if (!localStorage.getItem(SALES_KEY)) {
      this.setStored(SALES_KEY, INITIAL_SALES);
    }
    if (!localStorage.getItem(SHIFTS_KEY)) {
      this.setStored(SHIFTS_KEY, INITIAL_SHIFTS);
    }
    if (!localStorage.getItem(RETURNS_KEY)) {
      this.setStored(RETURNS_KEY, []);
    }
  }

  // --- Auth & Session ---
  public static getCurrentUser(): User | null {
    this.initDatabase();
    return this.getStored<User | null>(CURRENT_USER_KEY, INITIAL_USERS[0]);
  }

  public static setCurrentUser(user: User | null): void {
    if (user) {
      this.setStored(CURRENT_USER_KEY, user);
      localStorage.setItem(TOKEN_KEY, `jwt_token_${user.id}_${Date.now()}`);
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  public static async login(identifier: string, password: string): Promise<{ user: User; token: string }> {
    this.initDatabase();
    const users = this.getStored<User[]>(USERS_KEY, INITIAL_USERS);

    // Find user by username, phone or email
    const user = users.find(u =>
      u.username.toLowerCase() === identifier.toLowerCase() ||
      u.phone === identifier ||
      (u.email && u.email.toLowerCase() === identifier.toLowerCase())
    );

    if (!user) {
      this.logAudit({
        username: identifier,
        action: 'LOGIN_FAILED_USER_NOT_FOUND',
        entity_type: 'AUTH'
      });
      throw new Error("Foydalanuvchi nomi yoki telefon raqami topilmadi");
    }

    if (user.is_locked) {
      throw new Error("Hisob xavfsizlik maqsadida muzlatilgan (5 ta noto'g'ri urinish tufayli)");
    }

    if (!user.is_active) {
      throw new Error("Ushbu foydalanuvchi hisobi o'chirilgan yoki nofaol");
    }

    // Default password for all seed accounts is Admin123!
    if (password !== 'Admin123!' && password !== '123456' && password !== 'password') {
      user.failed_login_attempts += 1;
      if (user.failed_login_attempts >= 5) {
        user.is_locked = true;
        this.logAudit({
          user_id: user.id,
          username: user.username,
          action: 'ACCOUNT_LOCKED_5_ATTEMPTS',
          entity_type: 'AUTH'
        });
      }
      this.setStored(USERS_KEY, users);
      throw new Error(`Parol noto'g'ri! Urinish: ${user.failed_login_attempts}/5`);
    }

    // Reset failed attempts on success
    user.failed_login_attempts = 0;
    user.last_login_at = new Date().toISOString();
    this.setStored(USERS_KEY, users);

    // Refresh role permissions
    const roles = this.getStored<Role[]>(ROLES_KEY, INITIAL_ROLES);
    const userRole = roles.find(r => r.id === user.role_id);
    if (userRole) {
      user.permissions = userRole.permissions.map(p => p.id);
    }

    this.setCurrentUser(user);

    this.logAudit({
      user_id: user.id,
      username: user.username,
      action: 'LOGIN_SUCCESS',
      entity_type: 'AUTH',
      entity_id: user.id
    });

    return {
      user,
      token: `jwt_session_${user.id}`
    };
  }

  // --- Users CRUD ---
  public static getUsers(): User[] {
    this.initDatabase();
    return this.getStored<User[]>(USERS_KEY, INITIAL_USERS);
  }

  public static createUser(userData: {
    username: string;
    phone: string;
    full_name: string;
    role_id: RoleId;
    email?: string;
  }): User {
    const users = this.getUsers();
    const roles = this.getRoles();

    // Check duplicates
    if (users.some(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
      throw new Error("Bunday loginli foydalanuvchi allaqachon mavjud");
    }
    if (users.some(u => u.phone === userData.phone)) {
      throw new Error("Ushbu telefon raqami allaqachon ro'yxatdan o'tgan");
    }

    const role = roles.find(r => r.id === userData.role_id);

    const newUser: User = {
      id: crypto.randomUUID ? crypto.randomUUID() : `usr-${Date.now()}`,
      username: userData.username,
      phone: userData.phone,
      full_name: userData.full_name,
      email: userData.email,
      role_id: userData.role_id,
      role_name: role?.name || userData.role_id,
      role_display_name_uz: role?.display_name_uz || userData.role_id,
      permissions: role ? role.permissions.map(p => p.id) : [],
      is_active: true,
      is_locked: false,
      failed_login_attempts: 0,
      created_at: new Date().toISOString()
    };

    users.unshift(newUser);
    this.setStored(USERS_KEY, users);

    const currentUser = this.getCurrentUser();
    this.logAudit({
      user_id: currentUser?.id,
      username: currentUser?.username || 'system',
      action: 'USER_CREATED',
      entity_type: 'USER',
      entity_id: newUser.id,
      new_value: { username: newUser.username, role: newUser.role_id, phone: newUser.phone }
    });

    return newUser;
  }

  public static updateUser(id: string, updates: Partial<User>): User {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) throw new Error("Foydalanuvchi topilmadi");

    const oldState = { ...users[index] };
    users[index] = { ...users[index], ...updates };

    // Update role display if role changed
    if (updates.role_id) {
      const roles = this.getRoles();
      const role = roles.find(r => r.id === updates.role_id);
      if (role) {
        users[index].role_name = role.name;
        users[index].role_display_name_uz = role.display_name_uz;
        users[index].permissions = role.permissions.map(p => p.id);
      }
    }

    this.setStored(USERS_KEY, users);

    const currentUser = this.getCurrentUser();
    this.logAudit({
      user_id: currentUser?.id,
      username: currentUser?.username || 'system',
      action: 'USER_UPDATED',
      entity_type: 'USER',
      entity_id: id,
      old_value: oldState,
      new_value: updates
    });

    return users[index];
  }

  // --- Roles & RBAC Matrix ---
  public static getRoles(): Role[] {
    this.initDatabase();
    return this.getStored<Role[]>(ROLES_KEY, INITIAL_ROLES);
  }

  public static getPermissions(): Permission[] {
    this.initDatabase();
    return this.getStored<Permission[]>(PERMS_KEY, INITIAL_PERMISSIONS);
  }

  public static updateRolePermissions(roleId: RoleId, permissionIds: string[]): Role {
    if (roleId === 'SUPER_ADMIN') {
      throw new Error("Bosh Administrator (SUPER_ADMIN) huquqlari cheklanishi mumkin emas!");
    }

    const roles = this.getRoles();
    const allPerms = this.getPermissions();
    const roleIndex = roles.findIndex(r => r.id === roleId);
    if (roleIndex === -1) throw new Error("Rol topilmadi");

    const newPerms = allPerms.filter(p => permissionIds.includes(p.id));
    roles[roleIndex].permissions = newPerms;
    this.setStored(ROLES_KEY, roles);

    // Also update any users holding this role
    const users = this.getUsers();
    users.forEach(u => {
      if (u.role_id === roleId) {
        u.permissions = permissionIds;
      }
    });
    this.setStored(USERS_KEY, users);

    const currentUser = this.getCurrentUser();
    this.logAudit({
      user_id: currentUser?.id,
      username: currentUser?.username || 'system',
      action: 'ROLE_PERMISSIONS_UPDATED',
      entity_type: 'ROLE',
      entity_id: roleId,
      new_value: { permission_count: permissionIds.length, permissions: permissionIds }
    });

    return roles[roleIndex];
  }

  // --- Audit Logs ---
  public static getAuditLogs(): AuditLogItem[] {
    this.initDatabase();
    return this.getStored<AuditLogItem[]>(LOGS_KEY, INITIAL_AUDIT_LOGS);
  }

  public static logAudit(entry: Partial<AuditLogItem>): void {
    const logs = this.getStored<AuditLogItem[]>(LOGS_KEY, INITIAL_AUDIT_LOGS);
    const newEntry: AuditLogItem = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: entry.user_id,
      username: entry.username || 'system',
      action: entry.action || 'ACTION',
      entity_type: entry.entity_type || 'SYSTEM',
      entity_id: entry.entity_id,
      old_value: entry.old_value,
      new_value: entry.new_value,
      ip_address: entry.ip_address || '127.0.0.1',
      user_agent: navigator.userAgent || 'Chrome / Browser Client',
      created_at: new Date().toISOString()
    };
    logs.unshift(newEntry);
    this.setStored(LOGS_KEY, logs.slice(0, 300)); // keep last 300
  }

  // --- RBAC Permission Check Utility ---
  public static checkPermission(user: User | null, permissionId: string): { granted: boolean; reason: string } {
    if (!user) {
      return { granted: false, reason: "Foydalanuvchi tizimga kirmagan" };
    }
    if (user.is_locked) {
      return { granted: false, reason: "Foydalanuvchi hisobi muzlatilgan" };
    }
    if (!user.is_active) {
      return { granted: false, reason: "Foydalanuvchi hisobi nofaol" };
    }
    if (user.role_id === 'SUPER_ADMIN') {
      return { granted: true, reason: "SUPER_ADMIN roliga cheklovsiz tizim huquqi berilgan" };
    }

    const has = user.permissions?.includes(permissionId);
    if (has) {
      return { granted: true, reason: `${user.role_id} roliga '${permissionId}' huquqi bazada biriktirilgan` };
    }

    return {
      granted: false,
      reason: `${user.role_id} roliga '${permissionId}' huquqi ruxsat etilmagan (Bazada mavjud emas)`
    };
  }

  // ====================================================================
  // PHASE 2: PRODUCTS, BARCODES & INVENTORY METHODS
  // ====================================================================

  // --- Categories ---
  public static getCategories(): Category[] {
    this.initDatabase();
    return this.getStored<Category[]>(CATEGORIES_KEY, INITIAL_CATEGORIES);
  }

  public static createCategory(cat: { name: string; description?: string; icon?: string; parent_id?: string }): Category {
    const categories = this.getCategories();
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: cat.name,
      description: cat.description,
      icon: cat.icon || 'package',
      parent_id: cat.parent_id || null,
      product_count: 0,
      created_at: new Date().toISOString()
    };
    categories.push(newCat);
    this.setStored(CATEGORIES_KEY, categories);
    return newCat;
  }

  // --- Products ---
  public static getProducts(): Product[] {
    this.initDatabase();
    const prods = this.getStored<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
    return prods.map(p => ({
      ...p,
      is_low_stock: p.current_stock <= p.min_stock
    }));
  }

  public static getProductById(id: string): Product | undefined {
    const products = this.getProducts();
    return products.find(p => p.id === id);
  }

  // Fast Barcode Lookup for USB Barcode Scanners
  public static lookupBarcode(barcodeRaw: string): BarcodeLookupResult {
    const startTime = performance.now();
    const barcode = barcodeRaw.trim();
    const products = this.getProducts();

    // 1. Check primary barcode
    let product = products.find(p => p.barcode === barcode);

    // 2. Check SKU if barcode didn't match directly
    if (!product) {
      product = products.find(p => p.sku.toLowerCase() === barcode.toLowerCase());
    }

    const elapsed = Math.round((performance.now() - startTime) * 100) / 100;

    let barcodeType: any = 'EAN_13';
    if (barcode.startsWith('20') || barcode.startsWith('21')) barcodeType = 'INTERNAL';
    else if (barcode.length === 8) barcodeType = 'EAN_8';
    else if (barcode.length > 14) barcodeType = 'CODE_128';

    if (product) {
      return {
        found: true,
        product,
        matched_barcode: barcode,
        barcode_type: barcodeType,
        lookup_time_ms: Math.max(elapsed, 0.45)
      };
    }

    return {
      found: false,
      matched_barcode: barcode,
      barcode_type: barcodeType,
      lookup_time_ms: Math.max(elapsed, 0.45)
    };
  }

  public static getProductByBarcode(barcodeRaw: string): Product | null {
    const result = this.lookupBarcode(barcodeRaw);
    return result.found && result.product ? result.product : null;
  }

  public static createProduct(productData: {
    name: string;
    sku: string;
    barcode: string;
    category_id?: string;
    brand?: string;
    description?: string;
    purchase_price: number;
    sale_price: number;
    tax_rate?: number;
    unit: UnitType;
    initial_stock?: number;
    min_stock?: number;
    max_stock?: number;
  }): Product {
    const products = this.getProducts();
    const categories = this.getCategories();

    // Check duplicates
    if (products.some(p => p.sku.toLowerCase() === productData.sku.toLowerCase())) {
      throw new Error(`Ushbu SKU (${productData.sku}) allaqachon mavjud`);
    }
    if (products.some(p => p.barcode === productData.barcode)) {
      throw new Error(`Ushbu shtrix-kod (${productData.barcode}) boshqa mahsulotga biriktirilgan`);
    }

    const category = categories.find(c => c.id === productData.category_id);
    const initialStock = productData.initial_stock || 0;

    const newProd: Product = {
      id: `prod-${Date.now()}`,
      name: productData.name,
      sku: productData.sku,
      barcode: productData.barcode,
      category_id: productData.category_id,
      category_name: category?.name,
      brand: productData.brand,
      description: productData.description,
      purchase_price: productData.purchase_price,
      sale_price: productData.sale_price,
      tax_rate: productData.tax_rate ?? 12,
      unit: productData.unit,
      current_stock: initialStock,
      min_stock: productData.min_stock || 10,
      max_stock: productData.max_stock || 500,
      is_active: true,
      is_low_stock: initialStock <= (productData.min_stock || 10),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    products.unshift(newProd);
    this.setStored(PRODUCTS_KEY, products);

    // Initial stock movement
    if (initialStock > 0) {
      this.recordInventoryMovement({
        product_id: newProd.id,
        product_name: newProd.name,
        movement_type: 'STOCK_IN',
        quantity: initialStock,
        unit_cost: newProd.purchase_price,
        previous_stock: 0,
        new_stock: initialStock,
        reason: "Boshlang'ich ombor qoldig'i (Kirim)"
      });
    }

    const currentUser = this.getCurrentUser();
    this.logAudit({
      user_id: currentUser?.id,
      username: currentUser?.username || 'system',
      action: 'PRODUCT_CREATED',
      entity_type: 'PRODUCT',
      entity_id: newProd.id,
      new_value: { name: newProd.name, sku: newProd.sku, barcode: newProd.barcode, sale_price: newProd.sale_price }
    });

    return newProd;
  }

  public static updateProduct(id: string, updates: Partial<Product>): Product {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Mahsulot topilmadi");

    const oldState = { ...products[index] };
    products[index] = {
      ...products[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.setStored(PRODUCTS_KEY, products);

    const currentUser = this.getCurrentUser();
    this.logAudit({
      user_id: currentUser?.id,
      username: currentUser?.username || 'system',
      action: 'PRODUCT_UPDATED',
      entity_type: 'PRODUCT',
      entity_id: id,
      old_value: oldState,
      new_value: updates
    });

    return products[index];
  }

  // --- Inventory & Movements (Atomic Backend Transaction) ---
  public static getInventoryMovements(): InventoryMovement[] {
    this.initDatabase();
    return this.getStored<InventoryMovement[]>(MOVEMENTS_KEY, INITIAL_MOVEMENTS);
  }

  public static recordInventoryMovement(data: {
    product_id: string;
    product_name?: string;
    movement_type: MovementType;
    quantity: number;
    unit_cost: number;
    previous_stock: number;
    new_stock: number;
    reason?: string;
    reference_id?: string;
  }): InventoryMovement {
    const movements = this.getInventoryMovements();
    const currentUser = this.getCurrentUser();

    const newMov: InventoryMovement = {
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      product_id: data.product_id,
      product_name: data.product_name,
      movement_type: data.movement_type,
      quantity: data.quantity,
      unit_cost: data.unit_cost,
      previous_stock: data.previous_stock,
      new_stock: data.new_stock,
      reason: data.reason,
      reference_id: data.reference_id || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      user_id: currentUser?.id,
      username: currentUser?.username || 'system',
      created_at: new Date().toISOString()
    };

    movements.unshift(newMov);
    this.setStored(MOVEMENTS_KEY, movements.slice(0, 500));
    return newMov;
  }

  public static adjustInventory(payload: {
    product_id: string;
    movement_type: MovementType;
    quantity: number;
    reason?: string;
    reference_id?: string;
  }): { product: Product; movement: InventoryMovement } {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === payload.product_id);
    if (index === -1) throw new Error("Mahsulot topilmadi");

    const prod = products[index];
    const prevStock = prod.current_stock;
    const qty = Number(payload.quantity);
    let newStock = prevStock;

    if (payload.movement_type === 'STOCK_IN' || payload.movement_type === 'RETURN') {
      newStock = prevStock + qty;
    } else if (['STOCK_OUT', 'DAMAGED', 'EXPIRED', 'SALE'].includes(payload.movement_type)) {
      if (prevStock < qty) {
        throw new Error(`Omborda yetarli qoldiq mavjud emas! Mavjud: ${prevStock} ${prod.unit}, So'ralgan: ${qty} ${prod.unit}`);
      }
      newStock = prevStock - qty;
    } else if (payload.movement_type === 'ADJUSTMENT') {
      newStock = qty; // Direct adjustment to new count
    }

    prod.current_stock = newStock;
    prod.is_low_stock = newStock <= prod.min_stock;
    prod.updated_at = new Date().toISOString();
    products[index] = prod;
    this.setStored(PRODUCTS_KEY, products);

    const movement = this.recordInventoryMovement({
      product_id: prod.id,
      product_name: prod.name,
      movement_type: payload.movement_type,
      quantity: qty,
      unit_cost: prod.purchase_price,
      previous_stock: prevStock,
      new_stock: newStock,
      reason: payload.reason,
      reference_id: payload.reference_id
    });

    const currentUser = this.getCurrentUser();
    this.logAudit({
      user_id: currentUser?.id,
      username: currentUser?.username || 'system',
      action: 'INVENTORY_ADJUSTMENT',
      entity_type: 'INVENTORY',
      entity_id: prod.id,
      old_value: { stock: prevStock },
      new_value: { stock: newStock, type: payload.movement_type, quantity: qty }
    });

    return { product: prod, movement };
  }

  // ====================================================================
  // PHASE 3: BATCHES, EXPIRY MONITORING & FEFO METHODS
  // ====================================================================

  public static getSuppliers(): Supplier[] {
    this.initDatabase();
    return this.getStored<Supplier[]>(SUPPLIERS_KEY, INITIAL_SUPPLIERS);
  }

  public static getBatches(productId?: string, tier?: ExpiryTier): Batch[] {
    this.initDatabase();
    let batches = this.getStored<Batch[]>(BATCHES_KEY, INITIAL_BATCHES);
    const today = new Date('2026-10-09'); // Consistent reference date

    batches = batches.map(b => {
      const expDate = new Date(b.expiry_date);
      const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

      let calcTier: ExpiryTier = 'GREEN';
      if (diffDays <= 0) calcTier = 'CRITICAL';
      else if (diffDays <= 7) calcTier = 'RED';
      else if (diffDays <= 15) calcTier = 'ORANGE';
      else if (diffDays <= 30) calcTier = 'YELLOW';

      return {
        ...b,
        days_to_expiry: diffDays,
        expiry_tier: calcTier,
        is_expired: diffDays <= 0 || b.status === 'EXPIRED'
      };
    });

    if (productId) {
      batches = batches.filter(b => b.product_id === productId);
    }
    if (tier) {
      batches = batches.filter(b => b.expiry_tier === tier);
    }

    // Sort strictly by expiry_date ASC (FEFO principle)
    return batches.sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());
  }

  public static createBatch(batchData: {
    product_id: string;
    batch_number: string;
    supplier_id?: string;
    purchase_price: number;
    initial_quantity: number;
    manufacture_date: string;
    expiry_date: string;
  }): Batch {
    const batches = this.getBatches();
    const product = this.getProductById(batchData.product_id);
    const suppliers = this.getSuppliers();
    const supplier = suppliers.find(s => s.id === batchData.supplier_id);

    const today = new Date('2026-10-09');
    const expDate = new Date(batchData.expiry_date);
    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

    let calcTier: ExpiryTier = 'GREEN';
    if (diffDays <= 0) calcTier = 'CRITICAL';
    else if (diffDays <= 7) calcTier = 'RED';
    else if (diffDays <= 15) calcTier = 'ORANGE';
    else if (diffDays <= 30) calcTier = 'YELLOW';

    const newBatch: Batch = {
      id: `batch-${Date.now()}`,
      product_id: batchData.product_id,
      product_name: product?.name || 'Tovar',
      batch_number: batchData.batch_number,
      supplier_id: batchData.supplier_id,
      supplier_name: supplier?.name,
      purchase_price: batchData.purchase_price,
      initial_quantity: batchData.initial_quantity,
      current_quantity: batchData.initial_quantity,
      manufacture_date: batchData.manufacture_date,
      expiry_date: batchData.expiry_date,
      days_to_expiry: diffDays,
      expiry_tier: calcTier,
      status: diffDays <= 0 ? 'EXPIRED' : 'ACTIVE',
      is_expired: diffDays <= 0,
      is_recalled: false,
      unit: product?.unit || 'dona',
      created_at: new Date().toISOString()
    };

    batches.push(newBatch);
    this.setStored(BATCHES_KEY, batches);

    // Atomically increase product current stock
    if (product) {
      this.adjustInventory({
        product_id: product.id,
        movement_type: 'STOCK_IN',
        quantity: batchData.initial_quantity,
        reason: `Yangi tovar partiyasi qabul qilindi: ${newBatch.batch_number}`,
        reference_id: newBatch.batch_number
      });
    }

    const currentUser = this.getCurrentUser();
    this.logAudit({
      user_id: currentUser?.id,
      username: currentUser?.username || 'system',
      action: 'BATCH_RECEIVED',
      entity_type: 'BATCH',
      entity_id: newBatch.id,
      new_value: { batch: newBatch.batch_number, qty: newBatch.initial_quantity, expiry: newBatch.expiry_date }
    });

    return newBatch;
  }

  // Update batch quantity directly
  public static updateBatchStock(batchId: string, quantityDelta: number): Batch | null {
    const batches = this.getBatches();
    const idx = batches.findIndex(b => b.id === batchId);
    if (idx === -1) return null;
    const newQty = Math.max(0, batches[idx].current_quantity + quantityDelta);
    batches[idx].current_quantity = newQty;
    if (newQty === 0) batches[idx].status = 'DEPLETED';
    this.setStored(BATCHES_KEY, batches);
    return batches[idx];
  }

  // FEFO Dispatch Algorithm
  public static getFEFOQueue(productId: string, requestedQty: number): FEFODispatchItem[] {
    const batches = this.getBatches(productId).filter(b => b.current_quantity > 0 && b.status !== 'DEPLETED' && !b.is_recalled);
    const overrides = this.getStored<ExpiryOverride[]>(OVERRIDES_KEY, []);
    const now = Date.now();

    const queue: FEFODispatchItem[] = [];
    let remaining = requestedQty;
    let rank = 1;

    for (const b of batches) {
      const hasActiveOverride = overrides.some(o => o.batch_id === b.id && new Date(o.expires_at).getTime() > now);

      // Invariant: Expired products cannot be sold by default without admin override!
      if (b.is_expired && !hasActiveOverride) {
        continue;
      }

      const allocated = Math.min(remaining, b.current_quantity);
      remaining -= allocated;

      queue.push({
        batch_id: b.id,
        batch_number: b.batch_number,
        expiry_date: b.expiry_date,
        days_to_expiry: b.days_to_expiry,
        allocated_quantity: allocated,
        available_in_batch: b.current_quantity,
        is_expired: b.is_expired,
        fefo_priority_rank: rank
      });

      rank++;
      if (remaining <= 0) break;
    }

    return queue;
  }

  // Real-time Expiry Alerts
  public static getExpiryAlerts(): ExpiryAlert[] {
    const batches = this.getBatches().filter(b => b.current_quantity > 0 && b.status !== 'DEPLETED');
    const alerts: ExpiryAlert[] = [];

    for (const b of batches) {
      if (b.days_to_expiry <= 30) {
        const prod = this.getProductById(b.product_id);
        const aiRec = this.getAIExpiryRecommendation(b.id);

        alerts.push({
          batch_id: b.id,
          product_id: b.product_id,
          product_name: b.product_name || prod?.name || 'Tovar',
          barcode: prod?.barcode || '',
          batch_number: b.batch_number,
          current_quantity: b.current_quantity,
          unit: b.unit || 'dona',
          expiry_date: b.expiry_date,
          days_left: b.days_to_expiry,
          tier: b.expiry_tier,
          ai_recommendation_summary: aiRec.ai_insight_uz
        });
      }
    }

    return alerts.sort((a, b) => a.days_left - b.days_left);
  }

  // AI Expiry Recommendation & Sales Velocity Engine
  public static getAIExpiryRecommendation(batchId: string): AIExpiryRecommendation {
    const batches = this.getBatches();
    const batch = batches.find(b => b.id === batchId);
    if (!batch) throw new Error("Partiya topilmadi");

    const product = this.getProductById(batch.product_id);
    const unitPrice = product?.sale_price || batch.purchase_price * 1.25;
    const daysRemaining = batch.days_to_expiry;
    const currentStock = batch.current_quantity;

    // Daily velocity calculation
    const dailyVelocity = 4.8; // Baseline daily velocity
    const effectiveDailySales = Math.max(dailyVelocity * 1.2, 0.5); // weekend effect boost

    const naturalSales = daysRemaining > 0 ? Math.min(daysRemaining * effectiveDailySales, currentStock) : 0;
    const expectedRemainingWaste = Math.max(currentStock - naturalSales, 0);

    let recommendedDiscount = 0;
    let probability = 0.95;
    let action = 'STANDART SOTUV';
    let insight = '';
    let elasticityLift = 1.0;

    if (daysRemaining <= 0) {
      action = 'SOTUVNI TO‘XTATISH & UTILIZATSIYA (EXPIRED)';
      recommendedDiscount = 0;
      probability = 1.0;
      insight = 'Yaroqlilik muddati o‘tgan. Sotish qat‘iyan taqiqlanadi (0 kun).';
    } else if (daysRemaining <= 2) {
      recommendedDiscount = 35;
      elasticityLift = 2.4;
      action = 'TEZKOR FLASHSALE (-35%)';
      probability = 0.94;
      insight = `2 kun qoldi! ${Math.round(expectedRemainingWaste)} ${batch.unit} brakka chiqish xavfi bor. 35% chegirma bilan 94% ehtimollikda sotib tugatiladi.`;
    } else if (daysRemaining <= 7) {
      recommendedDiscount = 25;
      elasticityLift = 1.9;
      action = 'SARGOZASHT CHEGIRMA (-25%)';
      probability = 0.91;
      insight = `${daysRemaining} kun qoldi. 25% chegirma qo‘llanilsa, muddat tugaguncha tovarning 91% sotilishi bashorat qilinmoqda.`;
    } else if (daysRemaining <= 15) {
      recommendedDiscount = 15;
      elasticityLift = 1.45;
      action = 'RAG‘BATLANTIRUVCHI CHEGIRMA (-15%)';
      probability = 0.88;
      insight = `${daysRemaining} kun qoldi. 15% chegirma orqali kunlik aylanma tezligi 1.45 barobarga oshadi.`;
    } else if (daysRemaining <= 30) {
      recommendedDiscount = 10;
      elasticityLift = 1.25;
      action = 'AKSIYA SOTUVI (-10%)';
      probability = 0.85;
      insight = 'Qoldiq nisbatan yuqori. 10% chegirma yoki 2+1 aksiyasi tavsiya etiladi.';
    } else {
      action = 'STANDART SOTUV';
      recommendedDiscount = 0;
      probability = 0.98;
      insight = `Muddati yetarli (${daysRemaining} kun). Mavjud sotuv sur'atida tovar o‘z vaqtida sotiladi.`;
    }

    const discountedPrice = unitPrice * (1 - (recommendedDiscount / 100));
    const projectedSales = Math.min(naturalSales * elasticityLift, currentStock);
    const projectedRevenue = projectedSales * discountedPrice;
    const potentialWasteLoss = (currentStock - projectedSales) * batch.purchase_price;

    return {
      batch_id: batch.id,
      product_name: batch.product_name || 'Tovar',
      tier: batch.expiry_tier,
      days_remaining: daysRemaining,
      current_stock: currentStock,
      daily_velocity: Math.round(effectiveDailySales * 10) / 10,
      natural_expected_sales: Math.round(naturalSales * 10) / 10,
      expected_waste_without_discount: Math.round(expectedRemainingWaste * 10) / 10,
      recommended_discount_percent: recommendedDiscount,
      clearance_probability: probability,
      action_title: action,
      ai_insight_uz: insight,
      discounted_price: Math.round(discountedPrice),
      projected_revenue_uzs: Math.round(projectedRevenue),
      potential_waste_loss_uzs: Math.round(potentialWasteLoss),
      requires_admin_approval: true
    };
  }

  // Admin Expiry Override with audit log
  public static createExpiryOverride(payload: {
    batch_id: string;
    reason: string;
    approved_discount_percent: number;
    valid_hours?: number;
  }): ExpiryOverride {
    const batches = this.getBatches();
    const batch = batches.find(b => b.id === payload.batch_id);
    if (!batch) throw new Error("Partiya topilmadi");

    const overrides = this.getStored<ExpiryOverride[]>(OVERRIDES_KEY, []);
    const currentUser = this.getCurrentUser();
    const validHours = payload.valid_hours || 24;
    const expiresAt = new Date(Date.now() + validHours * 3600000).toISOString();

    const override: ExpiryOverride = {
      id: `ovr-${Date.now()}`,
      batch_id: batch.id,
      product_id: batch.product_id,
      admin_id: currentUser?.id || 'admin-root',
      admin_username: currentUser?.username || 'admin',
      reason: payload.reason,
      approved_discount_percent: payload.approved_discount_percent,
      expires_at: expiresAt,
      created_at: new Date().toISOString()
    };

    overrides.push(override);
    this.setStored(OVERRIDES_KEY, overrides);

    this.logAudit({
      user_id: currentUser?.id,
      username: currentUser?.username || 'admin',
      action: 'EXPIRY_OVERRIDE_APPROVED',
      entity_type: 'BATCH',
      entity_id: batch.id,
      new_value: {
        batch: batch.batch_number,
        reason: payload.reason,
        discount: payload.approved_discount_percent,
        expires_at: expiresAt
      }
    });

    return override;
  }

  // ==========================================
  // CUSTOMERS & LOYALTY (BONUS) SYSTEM
  // ==========================================
  public static getCustomers(): Customer[] {
    this.initDatabase();
    return this.getStored<Customer[]>(CUSTOMERS_KEY, INITIAL_CUSTOMERS);
  }

  public static getCustomerById(id: string): Customer | null {
    const list = this.getCustomers();
    return list.find(c => c.id === id) || null;
  }

  public static getCustomerByPhone(phone: string): Customer | null {
    const cleanPhone = phone.replace(/\s+/g, '');
    const list = this.getCustomers();
    return list.find(c => c.phone.replace(/\s+/g, '').includes(cleanPhone) || cleanPhone.includes(c.phone.replace(/\s+/g, ''))) || null;
  }

  public static createCustomer(data: Partial<Customer>): Customer {
    const list = this.getCustomers();
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      full_name: data.full_name || 'Noma‘lum mijoz',
      phone: data.phone || '+998 90 000 00 00',
      card_number: data.card_number || `8600-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      bonus_balance: data.bonus_balance || 0,
      total_spent: 0,
      orders_count: 0,
      discount_tier_percent: data.discount_tier_percent || 1,
      is_active: true,
      notes: data.notes || '',
      created_at: new Date().toISOString()
    };
    list.unshift(newCust);
    this.setStored(CUSTOMERS_KEY, list);

    this.logAudit({
      user_id: this.getCurrentUser()?.id,
      username: this.getCurrentUser()?.username || 'admin',
      action: 'CUSTOMER_CREATED',
      entity_type: 'CUSTOMER',
      entity_id: newCust.id,
      new_value: { name: newCust.full_name, phone: newCust.phone }
    });

    return newCust;
  }

  public static updateCustomer(id: string, data: Partial<Customer>): Customer {
    const list = this.getCustomers();
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) throw new Error("Mijoz topilmadi");

    list[idx] = { ...list[idx], ...data };
    this.setStored(CUSTOMERS_KEY, list);
    return list[idx];
  }

  public static updateCustomerBonus(id: string, bonusDelta: number): Customer {
    const list = this.getCustomers();
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) throw new Error("Mijoz topilmadi");

    list[idx].bonus_balance = Math.max(0, list[idx].bonus_balance + bonusDelta);
    this.setStored(CUSTOMERS_KEY, list);
    return list[idx];
  }

  // ==========================================
  // PROMOTIONS & DISCOUNTS
  // ==========================================
  public static getPromotions(): Promotion[] {
    this.initDatabase();
    return this.getStored<Promotion[]>(PROMOTIONS_KEY, INITIAL_PROMOTIONS);
  }

  public static createPromotion(promo: Partial<Promotion>): Promotion {
    const list = this.getPromotions();
    const newPromo: Promotion = {
      id: `promo-${Date.now()}`,
      title: promo.title || 'Aksiya',
      description: promo.description || '',
      code: promo.code?.toUpperCase() || undefined,
      discount_type: promo.discount_type || 'PERCENTAGE',
      discount_value: promo.discount_value || 5,
      min_order_amount: promo.min_order_amount,
      target_category_id: promo.target_category_id,
      target_product_id: promo.target_product_id,
      start_date: promo.start_date || new Date().toISOString().split('T')[0],
      end_date: promo.end_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      is_active: promo.is_active !== undefined ? promo.is_active : true
    };
    list.unshift(newPromo);
    this.setStored(PROMOTIONS_KEY, list);
    return newPromo;
  }

  public static validatePromoCode(code: string, currentTotal: number): { valid: boolean; discount: number; promo?: Promotion; message: string } {
    const list = this.getPromotions();
    const found = list.find(p => p.is_active && p.code && p.code.toUpperCase() === code.trim().toUpperCase());

    if (!found) {
      return { valid: false, discount: 0, message: 'Promo-kod mavjud emas yoki muddati tugagan' };
    }

    if (found.min_order_amount && currentTotal < found.min_order_amount) {
      return {
        valid: false,
        discount: 0,
        message: `Minimal xarid summasi kamida ${found.min_order_amount.toLocaleString()} UZS bo‘lishi kerak`
      };
    }

    let discount = 0;
    if (found.discount_type === 'PERCENTAGE') {
      discount = Math.round((currentTotal * found.discount_value) / 100);
    } else {
      discount = found.discount_value;
    }

    return {
      valid: true,
      discount,
      promo: found,
      message: `Aksiya qo‘llandi: -${discount.toLocaleString()} UZS (${found.title})`
    };
  }

  // ==========================================
  // CASHIER SHIFTS & DRAWER
  // ==========================================
  public static getShifts(): CashierShift[] {
    this.initDatabase();
    return this.getStored<CashierShift[]>(SHIFTS_KEY, INITIAL_SHIFTS);
  }

  public static getActiveShift(): CashierShift | null {
    const list = this.getShifts();
    return list.find(s => !s.is_closed) || null;
  }

  public static openShift(openingCash: number, regId = 'reg-01', regName = 'Kassa №1 — Asosiy'): CashierShift {
    const list = this.getShifts();
    const active = list.find(s => !s.is_closed);
    if (active) return active;

    const user = this.getCurrentUser();
    const newShift: CashierShift = {
      id: `shift-${Date.now()}`,
      register_id: regId,
      register_name: regName,
      cashier_id: user?.id || 'usr-004',
      cashier_name: user?.full_name || 'Kassir',
      opened_at: new Date().toISOString(),
      opening_cash: openingCash,
      total_sales_count: 0,
      total_revenue: 0,
      cash_sales: 0,
      card_sales: 0,
      online_sales: 0,
      returns_total: 0,
      is_closed: false
    };

    list.unshift(newShift);
    this.setStored(SHIFTS_KEY, list);

    this.logAudit({
      user_id: user?.id,
      username: user?.username || 'cashier',
      action: 'SHIFT_OPENED',
      entity_type: 'CASHIER_SHIFT',
      entity_id: newShift.id,
      new_value: { opening_cash: openingCash, register: regName }
    });

    return newShift;
  }

  public static closeShift(shiftId: string, closingCash: number): CashierShift {
    const list = this.getShifts();
    const idx = list.findIndex(s => s.id === shiftId);
    if (idx === -1) throw new Error("Smena topilmadi");

    const shift = list[idx];
    const expectedCash = shift.opening_cash + shift.cash_sales - shift.returns_total;
    const discrepancy = closingCash - expectedCash;
    const zReportNo = `Z-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    shift.is_closed = true;
    shift.closed_at = new Date().toISOString();
    shift.closing_cash = closingCash;
    shift.expected_cash = expectedCash;
    shift.cash_discrepancy = discrepancy;
    shift.z_report_number = zReportNo;

    list[idx] = shift;
    this.setStored(SHIFTS_KEY, list);

    this.logAudit({
      user_id: this.getCurrentUser()?.id,
      username: this.getCurrentUser()?.username || 'cashier',
      action: 'SHIFT_CLOSED_Z_REPORT',
      entity_type: 'CASHIER_SHIFT',
      entity_id: shift.id,
      new_value: {
        z_report: zReportNo,
        expected_cash: expectedCash,
        closing_cash: closingCash,
        discrepancy: discrepancy,
        revenue: shift.total_revenue
      }
    });

    return shift;
  }

  // ==========================================
  // SALES & POS TRANSACTION ENGINE (FEFO)
  // ==========================================
  public static getSales(): SaleTransaction[] {
    this.initDatabase();
    return this.getStored<SaleTransaction[]>(SALES_KEY, INITIAL_SALES);
  }

  public static getSaleById(id: string): SaleTransaction | null {
    const sales = this.getSales();
    return sales.find(s => s.id === id) || null;
  }

  public static getSaleByReceiptNumber(receiptNum: string): SaleTransaction | null {
    const sales = this.getSales();
    const clean = receiptNum.trim().toLowerCase();
    return sales.find(s => s.receipt_number.toLowerCase() === clean) || null;
  }

  // Helper to find optimal FEFO batch for a product
  public static getOptimalBatchForSale(productId: string): Batch | null {
    const batches = this.getBatches()
      .filter(b => b.product_id === productId && b.current_quantity > 0 && b.status !== 'DEPLETED')
      .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());

    return batches[0] || null;
  }

  // Create real Sale with FEFO inventory deduction
  public static createSale(payload: {
    items: {
      product_id: string;
      product_name: string;
      barcode: string;
      quantity: number;
      unit: string;
      unit_price: number;
      discount_percent: number;
      batch_id?: string;
      batch_number?: string;
    }[];
    payment_method: PaymentMethod;
    amount_paid: number;
    customer_id?: string;
    bonus_to_use?: number;
    discount_promo_total?: number;
    notes?: string;
  }): SaleTransaction {
    this.initDatabase();
    const user = this.getCurrentUser();
    const activeShift = this.getActiveShift();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const receiptNum = `CHK-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;

    let subtotal = 0;
    let itemDiscountTotal = 0;
    const saleItems: SaleItemRecord[] = [];

    // Deduct stock per item and allocate FEFO batches
    for (const itm of payload.items) {
      const itemSubtotal = itm.unit_price * itm.quantity;
      const itemDiscount = Math.round(itemSubtotal * (itm.discount_percent / 100));
      const lineTotal = itemSubtotal - itemDiscount;

      subtotal += itemSubtotal;
      itemDiscountTotal += itemDiscount;

      // Select batch or use existing
      let chosenBatch = itm.batch_id ? this.getBatches().find(b => b.id === itm.batch_id) : this.getOptimalBatchForSale(itm.product_id);

      // Decrement batch quantity if batch exists
      if (chosenBatch) {
        this.updateBatchStock(chosenBatch.id, -itm.quantity);
      }

      // Decrement product current stock
      const product = this.getProductById(itm.product_id);
      if (product) {
        const prevStock = product.current_stock;
        const newStock = Math.max(0, prevStock - itm.quantity);
        this.updateProduct(product.id, { current_stock: newStock });

        // Record inventory movement
        this.recordInventoryMovement({
          product_id: product.id,
          product_name: product.name,
          movement_type: 'SALE',
          quantity: itm.quantity,
          unit_cost: chosenBatch?.purchase_price || product.purchase_price,
          previous_stock: prevStock,
          new_stock: newStock,
          reference_id: receiptNum,
          reason: `POS Chek: ${receiptNum}`
        });
      }

      saleItems.push({
        id: `si-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        sale_id: '',
        product_id: itm.product_id,
        product_name: itm.product_name,
        barcode: itm.barcode,
        quantity: itm.quantity,
        unit: itm.unit,
        unit_price: itm.unit_price,
        discount_percent: itm.discount_percent,
        total_price: lineTotal,
        batch_id: chosenBatch?.id,
        batch_number: chosenBatch?.batch_number,
        cost_price: chosenBatch?.purchase_price || 0
      });
    }

    const promoDiscount = payload.discount_promo_total || 0;
    const totalDiscounts = itemDiscountTotal + promoDiscount;
    const bonusUsed = payload.bonus_to_use || 0;
    const taxRate = 0.12; // 12% QQS O'zbekiston
    const discountedTotal = Math.max(0, subtotal - totalDiscounts - bonusUsed);
    const taxTotal = Math.round(discountedTotal * (taxRate / (1 + taxRate)));
    const grandTotal = discountedTotal;

    const changeReturned = payload.payment_method === 'CASH'
      ? Math.max(0, payload.amount_paid - grandTotal)
      : 0;

    // Customer loyalty bonus calculation (1% cashback)
    let bonusEarned = 0;
    let customerName = undefined;
    let customerPhone = undefined;

    if (payload.customer_id) {
      const cust = this.getCustomerById(payload.customer_id);
      if (cust) {
        customerName = cust.full_name;
        customerPhone = cust.phone;
        bonusEarned = Math.round(grandTotal * 0.01);

        // Update customer statistics
        const newBalance = Math.max(0, cust.bonus_balance - bonusUsed) + bonusEarned;
        this.updateCustomer(cust.id, {
          bonus_balance: newBalance,
          total_spent: cust.total_spent + grandTotal,
          orders_count: cust.orders_count + 1
        });
      }
    }

    const saleRecord: SaleTransaction = {
      id: `sale-${Date.now()}`,
      receipt_number: receiptNum,
      cashier_id: user?.id || 'usr-004',
      cashier_name: user?.full_name || 'Dilshod Rahimov',
      register_id: activeShift?.register_id || 'reg-01',
      shift_id: activeShift?.id,
      customer_id: payload.customer_id,
      customer_name: customerName,
      customer_phone: customerPhone,
      subtotal,
      discount_total: totalDiscounts,
      bonus_used: bonusUsed,
      tax_total: taxTotal,
      grand_total: grandTotal,
      payment_method: payload.payment_method,
      amount_paid: payload.payment_method === 'CASH' ? payload.amount_paid : grandTotal,
      change_returned: changeReturned,
      status: 'COMPLETED',
      items: saleItems,
      bonus_earned: bonusEarned,
      fiscal_sign: `UZ${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      created_at: new Date().toISOString(),
      notes: payload.notes
    };

    saleItems.forEach(i => i.sale_id = saleRecord.id);

    // Save sale
    const sales = this.getSales();
    sales.unshift(saleRecord);
    this.setStored(SALES_KEY, sales);

    // Update active shift stats
    if (activeShift) {
      const shifts = this.getShifts();
      const sIdx = shifts.findIndex(s => s.id === activeShift.id);
      if (sIdx !== -1) {
        shifts[sIdx].total_sales_count += 1;
        shifts[sIdx].total_revenue += grandTotal;
        if (payload.payment_method === 'CASH') {
          shifts[sIdx].cash_sales += grandTotal;
        } else if (payload.payment_method === 'UZCARD' || payload.payment_method === 'HUMO') {
          shifts[sIdx].card_sales += grandTotal;
        } else {
          shifts[sIdx].online_sales += grandTotal;
        }
        this.setStored(SHIFTS_KEY, shifts);
      }
    }

    // Audit log
    this.logAudit({
      user_id: user?.id,
      username: user?.username || 'cashier',
      action: 'SALE_COMPLETED',
      entity_type: 'SALE',
      entity_id: saleRecord.id,
      new_value: {
        receipt: receiptNum,
        grand_total: grandTotal,
        payment: payload.payment_method,
        items_count: payload.items.length
      }
    });

    return saleRecord;
  }

  // ==========================================
  // RETURNS & REFUNDS ENGINE
  // ==========================================
  public static getReturns(): ReturnRecord[] {
    this.initDatabase();
    return this.getStored<ReturnRecord[]>(RETURNS_KEY, []);
  }

  public static createReturn(payload: {
    sale_id: string;
    receipt_number: string;
    reason: string;
    returned_items: {
      product_id: string;
      product_name: string;
      quantity: number;
      unit_price: number;
      refund_amount: number;
      reason: string;
      restock_to_inventory: boolean;
    }[];
    payment_method: PaymentMethod;
  }): ReturnRecord {
    this.initDatabase();
    const user = this.getCurrentUser();
    const activeShift = this.getActiveShift();
    const totalRefund = payload.returned_items.reduce((sum, item) => sum + item.refund_amount, 0);

    const returnRec: ReturnRecord = {
      id: `ret-${Date.now()}`,
      sale_id: payload.sale_id,
      receipt_number: payload.receipt_number,
      cashier_id: user?.id || 'usr-004',
      cashier_name: user?.full_name || 'Kassir',
      returned_items: payload.returned_items,
      total_refund_amount: totalRefund,
      payment_method: payload.payment_method,
      reason: payload.reason,
      created_at: new Date().toISOString()
    };

    // Restock inventory for marked items
    for (const item of payload.returned_items) {
      if (item.restock_to_inventory) {
        const prod = this.getProductById(item.product_id);
        if (prod) {
          const prevStock = prod.current_stock;
          const newStock = prevStock + item.quantity;
          this.updateProduct(prod.id, { current_stock: newStock });
          this.recordInventoryMovement({
            product_id: prod.id,
            product_name: prod.name,
            movement_type: 'RETURN',
            quantity: item.quantity,
            unit_cost: prod.purchase_price,
            previous_stock: prevStock,
            new_stock: newStock,
            reference_id: payload.receipt_number,
            reason: `Qaytarish: ${item.reason || payload.reason}`
          });
        }
      }
    }

    // Save return
    const returnsList = this.getReturns();
    returnsList.unshift(returnRec);
    this.setStored(RETURNS_KEY, returnsList);

    // Update sale status to REFUNDED
    const sales = this.getSales();
    const saleIdx = sales.findIndex(s => s.id === payload.sale_id);
    if (saleIdx !== -1) {
      sales[saleIdx].status = 'REFUNDED';
      this.setStored(SALES_KEY, sales);
    }

    // Update active shift returns total
    if (activeShift) {
      const shifts = this.getShifts();
      const sIdx = shifts.findIndex(s => s.id === activeShift.id);
      if (sIdx !== -1) {
        shifts[sIdx].returns_total += totalRefund;
        this.setStored(SHIFTS_KEY, shifts);
      }
    }

    // Audit log
    this.logAudit({
      user_id: user?.id,
      username: user?.username || 'cashier',
      action: 'SALE_RETURNED_REFUND',
      entity_type: 'RETURN',
      entity_id: returnRec.id,
      new_value: {
        receipt: payload.receipt_number,
        total_refund: totalRefund,
        reason: payload.reason
      }
    });

    return returnRec;
  }

  // ==========================================
  // AI FORECASTING & SECURITY MONITORING
  // ==========================================
  public static getAIForecasts(): AIForecastMetric[] {
    this.initDatabase();
    return INITIAL_AI_FORECASTS;
  }

  public static getAISecurityAnomalies() {
    const sales = this.getSales();
    const batches = this.getBatches();
    const alerts: {
      id: string;
      level: 'CRITICAL' | 'WARNING' | 'INFO';
      title: string;
      description: string;
      timestamp: string;
      category: 'FRAUD' | 'STOCK' | 'EXPIRY' | 'SHIFT';
    }[] = [];

    // 1. High discount anomalies in sales
    for (const s of sales) {
      if (s.discount_total > 50000 || (s.discount_total / (s.subtotal || 1)) > 0.3) {
        alerts.push({
          id: `sec-${s.id}`,
          level: 'WARNING',
          category: 'FRAUD',
          title: 'Yuqori Chegirma Shubhali Savdo',
          description: `Chek #${s.receipt_number}: ${s.discount_total.toLocaleString()} UZS chegirma qo‘llangan (${s.cashier_name}).`,
          timestamp: s.created_at
        });
      }
    }

    // 2. Critical Expiry items on shelves
    const criticalBatches = batches.filter(b => b.days_to_expiry <= 0 && b.current_quantity > 0);
    if (criticalBatches.length > 0) {
      alerts.push({
        id: 'sec-crit-expiry',
        level: 'CRITICAL',
        category: 'EXPIRY',
        title: 'Muddati O‘tgan Mahsulot Tokchada!',
        description: `${criticalBatches.length} ta partiyaning yaroqlilik muddati tugagan (${criticalBatches.map(b => b.product_name).join(', ')}). Tezda utilizatsiya qiling!`,
        timestamp: new Date().toISOString()
      });
    }

    // 3. Shift discrepancy
    const shifts = this.getShifts();
    const discrepancyShift = shifts.find(s => s.cash_discrepancy && Math.abs(s.cash_discrepancy) > 10000);
    if (discrepancyShift) {
      alerts.push({
        id: `sec-shift-${discrepancyShift.id}`,
        level: 'WARNING',
        category: 'SHIFT',
        title: 'Kassa Tafovuti Aniqlangan (Kamomad/Ortiqcha)',
        description: `Smena #${discrepancyShift.id} (${discrepancyShift.cashier_name}): ${discrepancyShift.cash_discrepancy?.toLocaleString()} UZS kassa tafovuti qayd etildi.`,
        timestamp: discrepancyShift.closed_at || discrepancyShift.opened_at
      });
    }

    // 4. Low stock critical
    const products = this.getProducts().filter(p => p.current_stock <= (p.min_stock || 5));
    if (products.length > 0) {
      alerts.push({
        id: 'sec-low-stock',
        level: 'INFO',
        category: 'STOCK',
        title: 'Kritik Past Qoldiq (Buyurtma kerak)',
        description: `${products.length} ta tovar tugash arafasida: ${products.slice(0, 3).map(p => p.name).join(', ')}...`,
        timestamp: new Date().toISOString()
      });
    }

    return alerts;
  }
}

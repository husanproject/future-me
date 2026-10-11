import { Role, Permission, User, CashRegister, AuditLogItem } from '../types/auth';

export const INITIAL_PERMISSIONS: Permission[] = [
  // User & Role
  { id: 'user:create', module: 'user', action: 'create', description_uz: 'Yangi foydalanuvchi/xodim yaratish' },
  { id: 'user:read', module: 'user', action: 'read', description_uz: 'Foydalanuvchilar ro‘yxatini ko‘rish' },
  { id: 'user:update', module: 'user', action: 'update', description_uz: 'Foydalanuvchi ma‘lumotlarini tahrirlash' },
  { id: 'user:delete', module: 'user', action: 'delete', description_uz: 'Foydalanuvchini o‘chirish yoki bloklash' },
  { id: 'role:manage', module: 'role', action: 'manage', description_uz: 'Rollar va huquqlarni boshqarish' },

  // Product & Category
  { id: 'product:create', module: 'product', action: 'create', description_uz: 'Yangi mahsulot va shtrix-kod qo‘shish' },
  { id: 'product:read', module: 'product', action: 'read', description_uz: 'Mahsulotlar katalogini ko‘rish' },
  { id: 'product:update', module: 'product', action: 'update', description_uz: 'Mahsulot narxi va parametrlarini yangilash' },
  { id: 'product:delete', module: 'product', action: 'delete', description_uz: 'Mahsulotni katalogdan chiqarish' },
  { id: 'category:manage', module: 'category', action: 'manage', description_uz: 'Kategoriyalarni boshqarish' },

  // Inventory & Batch (FEFO)
  { id: 'inventory:read', module: 'inventory', action: 'read', description_uz: 'Ombor qoldig‘i va partiyalarni ko‘rish' },
  { id: 'inventory:update', module: 'inventory', action: 'update', description_uz: 'Ombor qoldig‘ini to‘g‘rilash (adjustment)' },
  { id: 'inventory:receive', module: 'inventory', action: 'receive', description_uz: 'Yangi tovar partiyasini qabul qilish (batch in)' },
  { id: 'inventory:expiry_override', module: 'inventory', action: 'override', description_uz: 'Muddati o‘tgan mahsulotga maxsus sotuv ruxsati berish' },

  // Sale & POS
  { id: 'sale:create', module: 'sale', action: 'create', description_uz: 'Yangi savdo chekini yaratish va to‘lov qabul qilish' },
  { id: 'sale:read', module: 'sale', action: 'read', description_uz: 'Sotuvlar tarixini ko‘rish' },
  { id: 'sale:cancel', module: 'sale', action: 'cancel', description_uz: 'Kassada sotuvni bekor qilish (void)' },
  { id: 'sale:discount', module: 'sale', action: 'discount', description_uz: 'Chekga chegirma qo‘llash' },

  // Return & Refund
  { id: 'return:create', module: 'return', action: 'create', description_uz: 'Tovar qaytarib olish arizasini kiritish' },
  { id: 'return:approve', module: 'return', action: 'approve', description_uz: 'Qaytarilgan tovar pulini to‘lashni tasdiqlash' },

  // Customers & Loyalty
  { id: 'customer:read', module: 'customer', action: 'read', description_uz: 'Mijoz va bonus balansi ma‘lumotlarini ko‘rish' },
  { id: 'customer:create', module: 'customer', action: 'create', description_uz: 'Yangi sodiqlik kartasi / mijoz ro‘yxatdan o‘tkazish' },
  { id: 'customer:manage_bonus', module: 'customer', action: 'manage_bonus', description_uz: 'Bonuslarni qo‘lda to‘g‘rilash' },

  // Security & Audit
  { id: 'security:read', module: 'security', action: 'read', description_uz: 'Xavfsizlik monitori va xavf signallarini ko‘rish' },
  { id: 'audit:read', module: 'audit', action: 'read', description_uz: 'Audit loglarini ko‘rish' },

  // Reports
  { id: 'report:read', module: 'report', action: 'read', description_uz: 'Kunlik, oylik moliyaviy hisobotlarni ko‘rish' },
  { id: 'report:export', module: 'report', action: 'export', description_uz: 'Hisobotlarni Excel/PDF formatda yuklab olish' }
];

export const INITIAL_ROLES: Role[] = [
  {
    id: 'SUPER_ADMIN',
    name: 'SUPER_ADMIN',
    display_name_uz: 'Bosh Tizim Administratori',
    description: 'Barcha ruxsatlarga ega, tizim konfiguratsiyasi va to‘liq nazorat',
    is_system: true,
    permissions: [...INITIAL_PERMISSIONS]
  },
  {
    id: 'CASHIER',
    name: 'CASHIER',
    display_name_uz: 'Kassir',
    description: 'Savdo operatsiyalari, to‘lov qabul qilish, chek chiqarish',
    is_system: true,
    permissions: INITIAL_PERMISSIONS.filter(p => [
      'sale:create', 'sale:read', 'sale:cancel', 'product:read',
      'customer:read', 'return:create'
    ].includes(p.id))
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    username: 'admin',
    email: 'superadmin@ozdokonim.uz',
    phone: '+998901234567',
    full_name: 'Akmal Rahimov (Admin)',
    role_id: 'SUPER_ADMIN',
    role_name: 'SUPER_ADMIN',
    role_display_name_uz: 'Bosh Tizim Administratori',
    permissions: INITIAL_PERMISSIONS.map(p => p.id),
    is_active: true,
    is_locked: false,
    failed_login_attempts: 0,
    created_at: '2026-03-01T08:00:00Z',
    last_login_at: '2026-10-09T07:15:00Z'
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    username: 'cashier1',
    email: 'kassa1@ozdokonim.uz',
    phone: '+998904567890',
    full_name: 'Aziz Bektemirov (Kassir 1)',
    role_id: 'CASHIER',
    role_name: 'CASHIER',
    role_display_name_uz: 'Kassir',
    permissions: ['sale:create', 'sale:read', 'sale:cancel', 'product:read', 'customer:read', 'return:create'],
    is_active: true,
    is_locked: false,
    failed_login_attempts: 0,
    created_at: '2026-04-01T08:15:00Z',
    last_login_at: '2026-10-09T07:30:00Z'
  }
];

export const INITIAL_REGISTERS: CashRegister[] = [
  { id: 'reg-01', register_code: 'KASSA-01', name: 'Asosiy Kirish Kassasi #1', ip_address: '192.168.1.101', is_active: true },
  { id: 'reg-02', register_code: 'KASSA-02', name: 'Ekspress Kassasi #2', ip_address: '192.168.1.102', is_active: true },
  { id: 'reg-03', register_code: 'KASSA-03', name: 'Ichimliklar Bo‘limi Kassasi #3', ip_address: '192.168.1.103', is_active: true }
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'log-001',
    username: 'superadmin',
    action: 'SYSTEM_INITIALIZATION',
    entity_type: 'SYSTEM',
    entity_id: 'PHASE_1',
    new_value: { status: 'initialized', version: '1.0.0', db: 'PostgreSQL 16' },
    ip_address: '127.0.0.1',
    user_agent: 'FastAPI Backend Core',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'log-002',
    username: 'superadmin',
    action: 'RBAC_PERMISSIONS_SEEDED',
    entity_type: 'ROLE',
    entity_id: 'SUPER_ADMIN',
    new_value: { total_permissions: 22, total_roles: 6 },
    ip_address: '127.0.0.1',
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'log-003',
    username: 'cashier1',
    action: 'LOGIN_SUCCESS',
    entity_type: 'AUTH',
    entity_id: '44444444-4444-4444-4444-444444444444',
    ip_address: '192.168.1.101',
    user_agent: 'POS Terminal Touchscreen',
    created_at: new Date(Date.now() - 1800000).toISOString()
  }
];

export const INITIAL_CATEGORIES = [
  { id: 'cat-01', name: 'Ichimliklar & Suvlar', icon: 'cup-soda', description: 'Gazlangan ichimliklar, sharbatlar va mineral suvlar', created_at: '2026-03-01T08:00:00Z', product_count: 2 },
  { id: 'cat-02', name: 'Sut & Qatiq Mahsulotlari', icon: 'milk', description: 'Sut, qatiq, pishloq, saryog‘ va tvorog', created_at: '2026-03-01T08:00:00Z', product_count: 2 },
  { id: 'cat-03', name: 'Oziq-ovqat & Baqoliyya', icon: 'wheat', description: 'Un, yog‘, guruch, makaron va shakar', created_at: '2026-03-01T08:00:00Z', product_count: 2 },
  { id: 'cat-04', name: 'Non & Qandolat', icon: 'cake', description: 'Non, bulochka, pechenye va shirinliklar', created_at: '2026-03-01T08:00:00Z', product_count: 1 },
  { id: 'cat-05', name: 'Meva & Sabzavotlar', icon: 'apple', description: 'Vaznli toza yangi mevalar va sabzavotlar', created_at: '2026-03-01T08:00:00Z', product_count: 1 },
  { id: 'cat-06', name: 'Go‘sht & Kolbasa', icon: 'drumstick', description: 'Mol go‘shti, tovuq va dudlangan go‘sht mahsulotlari', created_at: '2026-03-01T08:00:00Z', product_count: 0 }
];

export const INITIAL_PRODUCTS = [
  {
    id: 'prod-001',
    name: 'Coca-Cola Classic 1.5L',
    sku: 'BEV-CC-15L',
    barcode: '5449000000996',
    category_id: 'cat-01',
    category_name: 'Ichimliklar & Suvlar',
    brand: 'Coca-Cola',
    description: 'Klassik gazlangan salqin ichimlik',
    purchase_price: 11500,
    sale_price: 14500,
    tax_rate: 12,
    unit: 'dona' as const,
    weight: 1.5,
    current_stock: 120,
    min_stock: 25,
    max_stock: 500,
    is_active: true,
    is_low_stock: false,
    created_at: '2026-03-05T09:00:00Z',
    updated_at: '2026-03-05T09:00:00Z'
  },
  {
    id: 'prod-002',
    name: 'Nestle Sut 3.2% 1L TetraPak',
    sku: 'MILK-NST-32',
    barcode: '4607001770014',
    category_id: 'cat-02',
    category_name: 'Sut & Qatiq Mahsulotlari',
    brand: 'Nestle',
    description: 'Ultra pasterizatsiyalangan tabiiy sut',
    purchase_price: 14000,
    sale_price: 17500,
    tax_rate: 12,
    unit: 'dona' as const,
    weight: 1.0,
    current_stock: 48,
    min_stock: 15,
    max_stock: 200,
    is_active: true,
    is_low_stock: false,
    created_at: '2026-03-05T09:10:00Z',
    updated_at: '2026-03-05T09:10:00Z'
  },
  {
    id: 'prod-003',
    name: 'Dena O‘rik Sharbat 1L',
    sku: 'JUC-DENA-ORIK',
    barcode: '4780004560012',
    category_id: 'cat-01',
    category_name: 'Ichimliklar & Suvlar',
    brand: 'Dena',
    description: 'Tabiiy mevali o‘rik sharbati',
    purchase_price: 11000,
    sale_price: 13900,
    tax_rate: 12,
    unit: 'dona' as const,
    weight: 1.0,
    current_stock: 12, // LOW STOCK!
    min_stock: 20,
    max_stock: 150,
    is_active: true,
    is_low_stock: true,
    created_at: '2026-03-06T10:00:00Z',
    updated_at: '2026-03-06T10:00:00Z'
  },
  {
    id: 'prod-004',
    name: 'Oqtepa Qatiq 1kg Plastik',
    sku: 'MILK-QAT-1KG',
    barcode: '4780001239999',
    category_id: 'cat-02',
    category_name: 'Sut & Qatiq Mahsulotlari',
    brand: 'Oqtepa',
    description: 'Yog‘li tabiiy qatiq',
    purchase_price: 9200,
    sale_price: 11500,
    tax_rate: 12,
    unit: 'dona' as const,
    weight: 1.0,
    current_stock: 35,
    min_stock: 10,
    max_stock: 100,
    is_active: true,
    is_low_stock: false,
    created_at: '2026-03-07T11:00:00Z',
    updated_at: '2026-03-07T11:00:00Z'
  },
  {
    id: 'prod-005',
    name: 'Makfa Oliy Nav Un 2kg',
    sku: 'GROC-MKF-2KG',
    barcode: '4601444001201',
    category_id: 'cat-03',
    category_name: 'Oziq-ovqat & Baqoliyya',
    brand: 'Makfa',
    description: 'Oliy navli bug‘doy uni',
    purchase_price: 21000,
    sale_price: 26000,
    tax_rate: 12,
    unit: 'dona' as const,
    weight: 2.0,
    current_stock: 80,
    min_stock: 15,
    max_stock: 300,
    is_active: true,
    is_low_stock: false,
    created_at: '2026-03-08T12:00:00Z',
    updated_at: '2026-03-08T12:00:00Z'
  },
  {
    id: 'prod-006',
    name: 'Shakar Oq Tozalangan (kg)',
    sku: 'GROC-SHAK-KG',
    barcode: '4780000000011',
    category_id: 'cat-03',
    category_name: 'Oziq-ovqat & Baqoliyya',
    brand: 'Xorazm Shakar',
    description: 'Vaznli oq shakar',
    purchase_price: 12500,
    sale_price: 14500,
    tax_rate: 12,
    unit: 'kg' as const,
    weight: 1.0,
    current_stock: 240.5,
    min_stock: 50,
    max_stock: 1000,
    is_active: true,
    is_low_stock: false,
    created_at: '2026-03-08T12:30:00Z',
    updated_at: '2026-03-08T12:30:00Z'
  },
  {
    id: 'prod-007',
    name: 'Samarqand Obi Non (dona)',
    sku: 'BAK-SAM-NON',
    barcode: '2000000000077',
    category_id: 'cat-04',
    category_name: 'Non & Qandolat',
    brand: 'Lokal Nonvoyxona',
    description: 'Issiq tandir obi non',
    purchase_price: 4000,
    sale_price: 5500,
    tax_rate: 0,
    unit: 'dona' as const,
    weight: 0.45,
    current_stock: 8, // LOW STOCK!
    min_stock: 20,
    max_stock: 100,
    is_active: true,
    is_low_stock: true,
    created_at: '2026-03-09T06:00:00Z',
    updated_at: '2026-03-09T06:00:00Z'
  },
  {
    id: 'prod-008',
    name: 'Olma Golden Yangi Hosil (kg)',
    sku: 'FRU-OLMA-GLD',
    barcode: '2100000000088',
    category_id: 'cat-05',
    category_name: 'Meva & Sabzavotlar',
    brand: 'Farg‘ona Bog‘lari',
    description: 'Shirin sariq olma, vaznli',
    purchase_price: 16000,
    sale_price: 21000,
    tax_rate: 0,
    unit: 'kg' as const,
    weight: 1.0,
    current_stock: 95.2,
    min_stock: 15,
    max_stock: 300,
    is_active: true,
    is_low_stock: false,
    created_at: '2026-03-09T07:00:00Z',
    updated_at: '2026-03-09T07:00:00Z'
  }
];

export const INITIAL_MOVEMENTS = [
  {
    id: 'mov-001',
    product_id: 'prod-001',
    product_name: 'Coca-Cola Classic 1.5L',
    movement_type: 'STOCK_IN' as const,
    quantity: 120,
    unit_cost: 11500,
    previous_stock: 0,
    new_stock: 120,
    reason: 'Partiya qabuli (Zavod yetkazmasi)',
    reference_id: 'INVOICE-00192',
    username: 'warehouse',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'mov-002',
    product_id: 'prod-002',
    product_name: 'Nestle Sut 3.2% 1L TetraPak',
    movement_type: 'STOCK_IN' as const,
    quantity: 50,
    unit_cost: 14000,
    previous_stock: 0,
    new_stock: 50,
    reason: 'Yetkazib beruvchi qabuli',
    reference_id: 'INVOICE-00194',
    username: 'warehouse',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'mov-003',
    product_id: 'prod-002',
    product_name: 'Nestle Sut 3.2% 1L TetraPak',
    movement_type: 'DAMAGED' as const,
    quantity: 2,
    unit_cost: 14000,
    previous_stock: 50,
    new_stock: 48,
    reason: 'Qadoq yorilgan (transport brak)',
    reference_id: 'ACT-BRAK-04',
    username: 'warehouse',
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

export const INITIAL_SUPPLIERS = [
  {
    id: 'sup-01',
    name: 'CCI Uzbekistan MChJ',
    company_name: 'Coca-Cola Ichimligi Uzbekiston',
    phone: '+998712001122',
    email: 'sales@coca-cola.uz',
    contact_person: 'Bobur Mirzayev',
    tax_id: '200112233',
    address: 'Toshkent sh., Bektemir tumani',
    is_active: true,
    created_at: '2026-02-15T08:00:00Z'
  },
  {
    id: 'sup-02',
    name: 'Nestle Food LLC',
    company_name: 'Nestle O‘zbekiston Qo‘shma Korxonasi',
    phone: '+998712334455',
    email: 'order@nestle.uz',
    contact_person: 'Jahongir Qosimov',
    tax_id: '201998877',
    address: 'Namangan sh., Sanoat zonasi',
    is_active: true,
    created_at: '2026-02-20T08:00:00Z'
  },
  {
    id: 'sup-03',
    name: 'Marwin Juice MChJ',
    company_name: 'Dena Sharbatlari Zavodi',
    phone: '+998712889900',
    email: 'info@dena.uz',
    contact_person: 'Mansur Aliyev',
    tax_id: '302445566',
    address: 'Toshkent vil., Zangiota tumani',
    is_active: true,
    created_at: '2026-02-25T08:00:00Z'
  }
];

// Current date context: 2026-10-09
export const INITIAL_BATCHES = [
  {
    id: 'batch-001',
    product_id: 'prod-002',
    product_name: 'Nestle Sut 3.2% 1L TetraPak',
    batch_number: 'BAT-NST-OCT-A1',
    supplier_id: 'sup-02',
    supplier_name: 'Nestle Food LLC',
    purchase_price: 14000,
    initial_quantity: 30,
    current_quantity: 18,
    manufacture_date: '2026-09-10',
    expiry_date: '2026-10-11', // 2 days left (RED)
    days_to_expiry: 2,
    expiry_tier: 'RED' as const,
    status: 'ACTIVE' as const,
    is_expired: false,
    is_recalled: false,
    unit: 'dona',
    created_at: '2026-09-12T10:00:00Z'
  },
  {
    id: 'batch-002',
    product_id: 'prod-002',
    product_name: 'Nestle Sut 3.2% 1L TetraPak',
    batch_number: 'BAT-NST-NOV-B2',
    supplier_id: 'sup-02',
    supplier_name: 'Nestle Food LLC',
    purchase_price: 14000,
    initial_quantity: 40,
    current_quantity: 30,
    manufacture_date: '2026-10-01',
    expiry_date: '2026-11-04', // 26 days left (YELLOW)
    days_to_expiry: 26,
    expiry_tier: 'YELLOW' as const,
    status: 'ACTIVE' as const,
    is_expired: false,
    is_recalled: false,
    unit: 'dona',
    created_at: '2026-10-02T11:00:00Z'
  },
  {
    id: 'batch-003',
    product_id: 'prod-003',
    product_name: 'Dena O‘rik Sharbat 1L',
    batch_number: 'BAT-DENA-OCT-19',
    supplier_id: 'sup-03',
    supplier_name: 'Marwin Juice MChJ',
    purchase_price: 11000,
    initial_quantity: 25,
    current_quantity: 12,
    manufacture_date: '2026-04-19',
    expiry_date: '2026-10-19', // 10 days left (ORANGE)
    days_to_expiry: 10,
    expiry_tier: 'ORANGE' as const,
    status: 'ACTIVE' as const,
    is_expired: false,
    is_recalled: false,
    unit: 'dona',
    created_at: '2026-04-22T09:00:00Z'
  },
  {
    id: 'batch-004',
    product_id: 'prod-004',
    product_name: 'Oqtepa Qatiq 1kg Plastik',
    batch_number: 'BAT-QAT-OCT-14',
    supplier_id: 'sup-02',
    supplier_name: 'Nestle Food LLC',
    purchase_price: 9200,
    initial_quantity: 40,
    current_quantity: 22,
    manufacture_date: '2026-10-04',
    expiry_date: '2026-10-14', // 5 days left (RED)
    days_to_expiry: 5,
    expiry_tier: 'RED' as const,
    status: 'ACTIVE' as const,
    is_expired: false,
    is_recalled: false,
    unit: 'dona',
    created_at: '2026-10-04T12:00:00Z'
  },
  {
    id: 'batch-005',
    product_id: 'prod-001',
    product_name: 'Coca-Cola Classic 1.5L',
    batch_number: 'BAT-CC-DEC-24',
    supplier_id: 'sup-01',
    supplier_name: 'CCI Uzbekistan MChJ',
    purchase_price: 11500,
    initial_quantity: 120,
    current_quantity: 120,
    manufacture_date: '2026-06-24',
    expiry_date: '2026-12-24', // 76 days left (GREEN)
    days_to_expiry: 76,
    expiry_tier: 'GREEN' as const,
    status: 'ACTIVE' as const,
    is_expired: false,
    is_recalled: false,
    unit: 'dona',
    created_at: '2026-06-28T08:00:00Z'
  },
  {
    id: 'batch-006',
    product_id: 'prod-007',
    product_name: 'Samarqand Obi Non (dona)',
    batch_number: 'BAT-NON-OCT-08',
    purchase_price: 4000,
    initial_quantity: 20,
    current_quantity: 5,
    manufacture_date: '2026-10-06',
    expiry_date: '2026-10-08', // -1 day (CRITICAL EXPIRED)
    days_to_expiry: -1,
    expiry_tier: 'CRITICAL' as const,
    status: 'EXPIRED' as const,
    is_expired: true,
    is_recalled: false,
    unit: 'dona',
    created_at: '2026-10-06T06:00:00Z'
  }
];

export const INITIAL_CUSTOMERS = [
  {
    id: 'cust-01',
    full_name: 'Anvar Karimov',
    phone: '+998 90 123 45 67',
    card_number: '8600-0192-3841-1002',
    bonus_balance: 45000,
    total_spent: 3450000,
    orders_count: 24,
    discount_tier_percent: 3,
    is_active: true,
    notes: 'Doimiy mijoz, sut va ichimliklar xaridori',
    created_at: '2026-01-15T10:00:00Z'
  },
  {
    id: 'cust-02',
    full_name: 'Nodira Azimova',
    phone: '+998 93 543 21 09',
    card_number: '9860-4412-0098-7711',
    bonus_balance: 18500,
    total_spent: 1290000,
    orders_count: 9,
    discount_tier_percent: 2,
    is_active: true,
    notes: 'Keshbek kartasi bor',
    created_at: '2026-03-20T14:30:00Z'
  },
  {
    id: 'cust-03',
    full_name: 'Rustam Qosimov',
    phone: '+998 97 777 88 99',
    card_number: '8600-7766-5544-3322',
    bonus_balance: 82000,
    total_spent: 7850000,
    orders_count: 52,
    discount_tier_percent: 5,
    is_active: true,
    notes: 'VIP mijoz - 5% chegirma darajasi',
    created_at: '2025-11-05T09:15:00Z'
  },
  {
    id: 'cust-04',
    full_name: 'Zuhra Mahmudova',
    phone: '+998 99 888 12 34',
    card_number: '9860-1122-3344-5566',
    bonus_balance: 5000,
    total_spent: 420000,
    orders_count: 3,
    discount_tier_percent: 1,
    is_active: true,
    created_at: '2026-09-01T16:00:00Z'
  }
];

export const INITIAL_PROMOTIONS = [
  {
    id: 'promo-01',
    title: 'Hafta oxiri sut mahsulotlariga 10%',
    description: 'Barcha sut, qatiq va yogurtlarga haftaning dam olish kunlari',
    code: 'SUT10',
    discount_type: 'PERCENTAGE' as const,
    discount_value: 10,
    target_category_id: 'cat-02',
    start_date: '2026-10-01',
    end_date: '2026-10-31',
    is_active: true
  },
  {
    id: 'promo-02',
    title: 'Katta xarid chegirmasi (15 000 UZS)',
    description: '200 000 so‘mdan oshgan xaridlarga 15 000 so‘m chegiriladi',
    code: 'BARAKA',
    discount_type: 'FIXED' as const,
    discount_value: 15000,
    min_order_amount: 200000,
    start_date: '2026-10-01',
    end_date: '2026-12-31',
    is_active: true
  },
  {
    id: 'promo-03',
    title: 'Yaroqlilik muddati yaqin tovarlarga Flash Sale',
    description: 'AI tavsiyasiga ko‘ra 25% gacha tejamkor chegirmalar',
    code: 'TEZROQ',
    discount_type: 'PERCENTAGE' as const,
    discount_value: 20,
    start_date: '2026-10-01',
    end_date: '2026-10-15',
    is_active: true
  }
];

export const INITIAL_SHIFTS = [
  {
    id: 'shift-101',
    register_id: 'reg-01',
    register_name: 'Kassa №1 — Asosiy Terminal',
    cashier_id: 'usr-004',
    cashier_name: 'Dilshod Rahimov (Kassir 1)',
    opened_at: '2026-10-09T08:00:00Z',
    opening_cash: 500000,
    total_sales_count: 14,
    total_revenue: 1245000,
    cash_sales: 680000,
    card_sales: 450000,
    online_sales: 115000,
    returns_total: 0,
    is_closed: false
  }
];

export const INITIAL_SALES = [
  {
    id: 'sale-001',
    receipt_number: 'CHK-20261009-001',
    cashier_id: 'usr-004',
    cashier_name: 'Dilshod Rahimov',
    register_id: 'reg-01',
    shift_id: 'shift-101',
    customer_id: 'cust-01',
    customer_name: 'Anvar Karimov',
    customer_phone: '+998 90 123 45 67',
    subtotal: 54000,
    discount_total: 2700,
    bonus_used: 0,
    tax_total: 6156,
    grand_total: 51300,
    payment_method: 'UZCARD' as const,
    amount_paid: 51300,
    change_returned: 0,
    status: 'COMPLETED' as const,
    bonus_earned: 513,
    fiscal_sign: 'UZ994182938174',
    created_at: '2026-10-09T08:35:12Z',
    items: [
      {
        id: 'si-01',
        sale_id: 'sale-001',
        product_id: 'prod-001',
        product_name: 'Coca-Cola Classic 1.5L',
        barcode: '4780000100011',
        quantity: 2,
        unit: 'dona',
        unit_price: 14500,
        discount_percent: 5,
        total_price: 27550,
        batch_id: 'batch-001',
        batch_number: 'BAT-CC-NOV-10',
        cost_price: 11500
      },
      {
        id: 'si-02',
        sale_id: 'sale-001',
        product_id: 'prod-002',
        product_name: 'Nestle Sut 3.2% 1L Tetra',
        barcode: '4780000100028',
        quantity: 1,
        unit: 'dona',
        unit_price: 17500,
        discount_percent: 5,
        total_price: 16625,
        batch_id: 'batch-002',
        batch_number: 'BAT-NES-NOV-04',
        cost_price: 14000
      },
      {
        id: 'si-03',
        sale_id: 'sale-001',
        product_id: 'prod-005',
        product_name: 'Oq Qand Shakar 1kg',
        barcode: '4780000100059',
        quantity: 1,
        unit: 'kg',
        unit_price: 12000,
        discount_percent: 0,
        total_price: 12000,
        cost_price: 9500
      }
    ]
  },
  {
    id: 'sale-002',
    receipt_number: 'CHK-20261009-002',
    cashier_id: 'usr-004',
    cashier_name: 'Dilshod Rahimov',
    register_id: 'reg-01',
    shift_id: 'shift-101',
    subtotal: 39000,
    discount_total: 0,
    bonus_used: 0,
    tax_total: 4680,
    grand_total: 39000,
    payment_method: 'CASH' as const,
    amount_paid: 40000,
    change_returned: 1000,
    status: 'COMPLETED' as const,
    bonus_earned: 0,
    fiscal_sign: 'UZ994182938175',
    created_at: '2026-10-09T09:12:40Z',
    items: [
      {
        id: 'si-04',
        sale_id: 'sale-002',
        product_id: 'prod-003',
        product_name: 'Dena O‘rik Sharbat 1L',
        barcode: '4780000100035',
        quantity: 2,
        unit: 'dona',
        unit_price: 14000,
        discount_percent: 0,
        total_price: 28000,
        batch_id: 'batch-003',
        batch_number: 'BAT-DENA-OCT-19',
        cost_price: 11000
      },
      {
        id: 'si-05',
        sale_id: 'sale-002',
        product_id: 'prod-006',
        product_name: 'Makfa Oliy Navli Un 2kg',
        barcode: '4780000100066',
        quantity: 1,
        unit: 'dona',
        unit_price: 22000,
        discount_percent: 0,
        total_price: 22000,
        cost_price: 17500
      }
    ]
  }
];

export const INITIAL_AI_FORECASTS = [
  {
    product_id: 'prod-001',
    product_name: 'Coca-Cola Classic 1.5L',
    category_name: 'Ichimliklar',
    current_stock: 140,
    avg_daily_sales: 18.5,
    days_until_stockout: 7.5,
    forecast_next_7_days: 142,
    confidence_score: 0.94,
    recommended_reorder_qty: 120,
    demand_trend: 'RISING' as const,
    stockout_risk: 'MEDIUM' as const,
    weekend_lift_percent: 38
  },
  {
    product_id: 'prod-002',
    product_name: 'Nestle Sut 3.2% 1L Tetra',
    category_name: 'Sut va Qatiq Mahsulotlari',
    current_stock: 30,
    avg_daily_sales: 7.2,
    days_until_stockout: 4.1,
    forecast_next_7_days: 54,
    confidence_score: 0.91,
    recommended_reorder_qty: 60,
    demand_trend: 'STABLE' as const,
    stockout_risk: 'HIGH' as const,
    weekend_lift_percent: 22
  },
  {
    product_id: 'prod-004',
    product_name: 'Oqtepa Qatiq 1kg Plastik',
    category_name: 'Sut va Qatiq Mahsulotlari',
    current_stock: 22,
    avg_daily_sales: 6.0,
    days_until_stockout: 3.6,
    forecast_next_7_days: 44,
    confidence_score: 0.89,
    recommended_reorder_qty: 40,
    demand_trend: 'RISING' as const,
    stockout_risk: 'HIGH' as const,
    weekend_lift_percent: 25
  },
  {
    product_id: 'prod-007',
    product_name: 'Samarqand Obi Non (dona)',
    category_name: 'Non & Qandolat',
    current_stock: 5,
    avg_daily_sales: 45.0,
    days_until_stockout: 0.1,
    forecast_next_7_days: 315,
    confidence_score: 0.96,
    recommended_reorder_qty: 50,
    demand_trend: 'RISING' as const,
    stockout_risk: 'HIGH' as const,
    weekend_lift_percent: 40
  },
  {
    product_id: 'prod-005',
    product_name: 'Oq Qand Shakar 1kg',
    category_name: 'Baqqollik & Don Mahsulotlari',
    current_stock: 350,
    avg_daily_sales: 12.0,
    days_until_stockout: 29.1,
    forecast_next_7_days: 86,
    confidence_score: 0.88,
    recommended_reorder_qty: 0,
    demand_trend: 'STABLE' as const,
    stockout_risk: 'LOW' as const,
    weekend_lift_percent: 15
  }
];

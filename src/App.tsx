import React, { useState, useEffect } from 'react';
import { User, Role, Permission, AuditLogItem } from './types/auth';
import { Product, Category, InventoryMovement } from './types/product';
import { Supplier, Batch } from './types/batch';
import { Customer, Promotion, SaleTransaction, CashierShift, ReturnRecord } from './types/pos';
import { SupermarketApiService } from './services/api';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardOverview } from './pages/DashboardOverview';
import { POSPage } from './pages/POSPage';
import { BatchManagementPage } from './pages/BatchManagementPage';
import { SalesManagementPage } from './pages/SalesManagementPage';
import { CustomersPage } from './pages/CustomersPage';
import { DiscountsPage } from './pages/DiscountsPage';
import { CashierShiftsPage } from './pages/CashierShiftsPage';
import { AIMonitoringPage } from './pages/AIMonitoringPage';
import { ReportsPage } from './pages/ReportsPage';
import { ProductsPage } from './pages/ProductsPage';
import { BarcodeScannerPage } from './pages/BarcodeScannerPage';
import { InventoryPage } from './pages/InventoryPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { UsersManagementPage } from './pages/UsersManagementPage';
import { RolesPermissionsPage } from './pages/RolesPermissionsPage';
import { RBACTesterPage } from './pages/RBACTesterPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SystemArchitecturePage } from './pages/SystemArchitecturePage';

// Modals
import { SQLViewerModal } from './components/SQLViewerModal';
import { CreateUserModal } from './components/CreateUserModal';
import { CreateProductModal } from './components/CreateProductModal';
import { InventoryAdjustModal } from './components/InventoryAdjustModal';
import { CreateBatchModal } from './components/CreateBatchModal';
import { AIExpiryModal } from './components/AIExpiryModal';
import { ExpiryOverrideModal } from './components/ExpiryOverrideModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');

  // Data State
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [sales, setSales] = useState<SaleTransaction[]>([]);
  const [shifts, setShifts] = useState<CashierShift[]>([]);
  const [returns, setReturns] = useState<ReturnRecord[]>([]);

  // Modals
  const [isSQLModalOpen, setIsSQLModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isCreateProductModalOpen, setIsCreateProductModalOpen] = useState(false);
  const [productForAdjust, setProductForAdjust] = useState<Product | null>(null);
  const [isCreateBatchModalOpen, setIsCreateBatchModalOpen] = useState(false);
  const [batchForAI, setBatchForAI] = useState<Batch | null>(null);
  const [batchForOverride, setBatchForOverride] = useState<Batch | null>(null);

  // Initialize and load data
  useEffect(() => {
    SupermarketApiService.initDatabase();
    refreshData();
    const existingUser = SupermarketApiService.getCurrentUser();
    setCurrentUser(existingUser);
  }, []);

  const refreshData = () => {
    setUsers(SupermarketApiService.getUsers());
    setRoles(SupermarketApiService.getRoles());
    setPermissions(SupermarketApiService.getPermissions());
    setAuditLogs(SupermarketApiService.getAuditLogs());
    setProducts(SupermarketApiService.getProducts());
    setCategories(SupermarketApiService.getCategories());
    setMovements(SupermarketApiService.getInventoryMovements());
    setBatches(SupermarketApiService.getBatches());
    setSuppliers(SupermarketApiService.getSuppliers());
    setCustomers(SupermarketApiService.getCustomers());
    setPromotions(SupermarketApiService.getPromotions());
    setSales(SupermarketApiService.getSales());
    setShifts(SupermarketApiService.getShifts());
    setReturns(SupermarketApiService.getReturns());
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    SupermarketApiService.setCurrentUser(user);
    refreshData();
  };

  const handleLogout = () => {
    SupermarketApiService.setCurrentUser(null);
    setCurrentUser(null);
  };

  const handleSwitchUser = (user: User) => {
    SupermarketApiService.setCurrentUser(user);
    setCurrentUser(user);
    refreshData();
  };

  // If user is not authenticated, show login page
  if (!currentUser) {
    return (
      <>
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onOpenSQL={() => setIsSQLModalOpen(true)}
        />
        <SQLViewerModal
          isOpen={isSQLModalOpen}
          onClose={() => setIsSQLModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">

      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenSQL={() => setIsSQLModalOpen(true)}
        onSwitchUser={handleSwitchUser}
        availableUsers={users}
      />

      {/* Main Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-hidden">

        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          userRole={currentUser.role_id}
        />

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-4rem)]">

          {/* POS Terminal */}
          {activeTab === 'pos' && (
            <POSPage
              products={products}
              categories={categories}
              onSaleCompleted={refreshData}
              onNavigateToBatches={() => setActiveTab('batches')}
            />
          )}

          {/* Cashier Shifts & Z-Report */}
          {activeTab === 'shifts' && (
            <CashierShiftsPage
              shifts={shifts}
              onRefreshData={refreshData}
            />
          )}

          {/* Sales History & Returns */}
          {activeTab === 'sales' && (
            <SalesManagementPage
              sales={sales}
              returns={returns}
              onRefreshData={refreshData}
            />
          )}

          {/* Customers & Loyalty */}
          {activeTab === 'customers' && (
            <CustomersPage
              customers={customers}
              onRefreshData={refreshData}
            />
          )}

          {/* Discounts & Promotions */}
          {activeTab === 'discounts' && (
            <DiscountsPage
              promotions={promotions}
              onRefreshData={refreshData}
            />
          )}

          {/* Batches & FEFO */}
          {activeTab === 'batches' && (
            <BatchManagementPage
              batches={batches}
              products={products}
              onOpenCreateBatch={() => setIsCreateBatchModalOpen(true)}
              onSelectBatchForAI={(b) => setBatchForAI(b)}
              onSelectBatchForOverride={(b) => setBatchForOverride(b)}
            />
          )}

          {/* AI Monitoring & Intelligence */}
          {activeTab === 'ai_monitoring' && (
            <AIMonitoringPage
              batches={batches}
              products={products}
              onOpenAIModal={(b) => setBatchForAI(b)}
              onNavigateToBatches={() => setActiveTab('batches')}
            />
          )}

          {/* Reports & Analytics */}
          {activeTab === 'reports' && (
            <ReportsPage
              sales={sales}
              products={products}
            />
          )}

          {/* Products Catalog */}
          {activeTab === 'products' && (
            <ProductsPage
              products={products}
              categories={categories}
              onOpenCreateProduct={() => setIsCreateProductModalOpen(true)}
              onRefreshProducts={refreshData}
              onSelectProductForAdjust={(p) => setProductForAdjust(p)}
            />
          )}

          {/* Barcode Scanner Terminal */}
          {activeTab === 'scanner' && (
            <BarcodeScannerPage
              onSelectProductForAdjust={(p) => setProductForAdjust(p)}
            />
          )}

          {/* Inventory & Warehouse */}
          {activeTab === 'inventory' && (
            <InventoryPage
              products={products}
              movements={movements}
              onSelectProductForAdjust={(p) => setProductForAdjust(p)}
              onRefreshData={refreshData}
            />
          )}

          {/* Categories */}
          {activeTab === 'categories' && (
            <CategoriesPage
              categories={categories}
              onRefresh={refreshData}
            />
          )}

          {/* Overview Dashboard */}
          {activeTab === 'overview' && (
            <DashboardOverview
              currentUser={currentUser}
              users={users}
              roles={roles}
              permissions={permissions}
              products={products}
              onNavigate={setActiveTab}
              onOpenCreateUser={() => setIsCreateUserModalOpen(true)}
              onOpenCreateProduct={() => setIsCreateProductModalOpen(true)}
              onOpenSQL={() => setIsSQLModalOpen(true)}
            />
          )}

          {/* Users & Employees */}
          {activeTab === 'users' && (
            <UsersManagementPage
              users={users}
              onOpenCreateUser={() => setIsCreateUserModalOpen(true)}
              onRefreshUsers={refreshData}
            />
          )}

          {/* Roles & RBAC Matrix */}
          {activeTab === 'roles' && (
            <RolesPermissionsPage
              roles={roles}
              permissions={permissions}
              onRefreshData={refreshData}
            />
          )}

          {/* RBAC Tester */}
          {activeTab === 'tester' && (
            <RBACTesterPage
              users={users}
              permissions={permissions}
            />
          )}

          {/* Audit Logs */}
          {activeTab === 'audit' && (
            <AuditLogsPage
              logs={auditLogs}
              onRefresh={refreshData}
            />
          )}

          {/* System Architecture */}
          {activeTab === 'architecture' && (
            <SystemArchitecturePage
              onOpenSQL={() => setIsSQLModalOpen(true)}
            />
          )}

        </main>

      </div>

      {/* Modals */}
      <SQLViewerModal
        isOpen={isSQLModalOpen}
        onClose={() => setIsSQLModalOpen(false)}
      />

      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        onClose={() => setIsCreateUserModalOpen(false)}
        onUserCreated={refreshData}
      />

      <CreateProductModal
        isOpen={isCreateProductModalOpen}
        onClose={() => setIsCreateProductModalOpen(false)}
        categories={categories}
        onProductCreated={refreshData}
      />

      <InventoryAdjustModal
        isOpen={!!productForAdjust}
        product={productForAdjust}
        onClose={() => setProductForAdjust(null)}
        onAdjusted={refreshData}
      />

      <CreateBatchModal
        isOpen={isCreateBatchModalOpen}
        onClose={() => setIsCreateBatchModalOpen(false)}
        products={products}
        suppliers={suppliers}
        onBatchCreated={refreshData}
      />

      <AIExpiryModal
        isOpen={!!batchForAI}
        batch={batchForAI}
        onClose={() => setBatchForAI(null)}
        onApplyDiscount={(batchId, discount) => {
          refreshData();
          setBatchForAI(null);
        }}
      />

      <ExpiryOverrideModal
        isOpen={!!batchForOverride}
        batch={batchForOverride}
        onClose={() => setBatchForOverride(null)}
        onOverrideApproved={() => {
          refreshData();
          setBatchForOverride(null);
        }}
      />

    </div>
  );
}

import React from 'react';
import {
  Users, ShieldCheck, Key, ShoppingCart,
  ArrowUpRight, AlertTriangle, Shield, CheckCircle2,
  Terminal, Database, Lock, UserPlus, Play, Package,
  Barcode, ArrowUpDown
} from 'lucide-react';
import { User, Role, Permission } from '../types/auth';
import { Product } from '../types/product';
import { RoleBadge } from '../components/RoleBadge';
import { ActiveTab } from '../components/Sidebar';

interface Props {
  currentUser: User;
  users: User[];
  roles: Role[];
  permissions: Permission[];
  products: Product[];
  onNavigate: (tab: ActiveTab) => void;
  onOpenCreateUser: () => void;
  onOpenCreateProduct: () => void;
  onOpenSQL: () => void;
}

export const DashboardOverview: React.FC<Props> = ({
  currentUser,
  users,
  roles,
  permissions,
  products,
  onNavigate,
  onOpenCreateUser,
  onOpenCreateProduct,
  onOpenSQL
}) => {
  const activeUsersCount = users.filter(u => u.is_active && !u.is_locked).length;
  const lowStockCount = products.filter(p => p.is_low_stock).length;
  const totalValuation = products.reduce((sum, p) => sum + (p.current_stock * p.purchase_price), 0);

  return (
    <div className="space-y-6">

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 border border-slate-700/60 p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Phase 1 & Phase 2 Faol
              </span>
              <span className="text-xs text-slate-400">PostgreSQL 16 + FastAPI + Barcode & Inventory</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              Assalomu alaykum, {currentUser.full_name}!
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Siz tizimga <strong className="text-emerald-400 font-semibold">{currentUser.role_display_name_uz}</strong> sifatida kirdingiz.
              {currentUser.role_id === 'SUPER_ADMIN'
                ? " Barcha ruxsatlarga ega to‘liq administrator hisoblanasiz."
                : ` Sizga jami ${currentUser.permissions?.length || 0} ta ruxsat biriktirilgan.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('scanner')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition"
            >
              <Barcode className="w-4 h-4" />
              <span>Shtrix-Kod Skaner</span>
            </button>
            <button
              onClick={onOpenCreateProduct}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
            >
              <Package className="w-4 h-4 text-emerald-400" />
              <span>+ Yangi Tovar</span>
            </button>
            <button
              onClick={() => onNavigate('tester')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
            >
              <Play className="w-4 h-4 text-emerald-400" />
              <span>RBAC Tester</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row (Phase 1 + Phase 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Card 1: Products */}
        <div
          onClick={() => onNavigate('products')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-emerald-500/50 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Mahsulotlar Turi</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {products.length}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              xil mahsulot
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 mt-1 font-semibold">EAN-13 shtrix-kodlar bilan</p>
        </div>

        {/* Card 2: Low Stock */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-rose-500/50 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Kam Qolgan Tovar (Min Stock)</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600 font-mono">
              {lowStockCount}
            </span>
            <span className="text-xs text-rose-500 font-medium">
              xavfli darajada
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Ombor to‘ldirish kerak</p>
        </div>

        {/* Card 3: Total Inventory Value */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-emerald-500/50 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Ombor Tovar Qiymati</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
              <ArrowUpDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 dark:text-white font-mono">
              {totalValuation.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              so‘m
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Kirim narxi bo‘yicha</p>
        </div>

        {/* Card 4: Employees & Roles */}
        <div
          onClick={() => onNavigate('users')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-purple-500/50 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Xodimlar & Rollar</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {users.length}
            </span>
            <span className="text-xs text-emerald-600 font-medium">
              {activeUsersCount} faol
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">6 ta standart RBAC rol</p>
        </div>

      </div>

      {/* Quick Access to Phase 2 Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div
          onClick={() => onNavigate('scanner')}
          className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 hover:border-emerald-500/40 transition cursor-pointer flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Tezkor Kassir</div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">USB Shtrix-Kod Skaner Terminali</h4>
            <p className="text-xs text-slate-500">Hardware skaner orqali tovar qidirish va narx ko‘rish</p>
          </div>
          <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-md shadow-emerald-600/20">
            <Barcode className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('products')}
          className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/20 hover:border-blue-500/40 transition cursor-pointer flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Katalog</div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Mahsulotlar & Narxlar</h4>
            <p className="text-xs text-slate-500">Tovarlar ro‘yxati, QQS stavkalari va shtrix-kodlar</p>
          </div>
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-600/20">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('inventory')}
          className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 hover:border-purple-500/40 transition cursor-pointer flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Ombor Boshqaruvi</div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Kirim, Chiqim & Qoldiq</h4>
            <p className="text-xs text-slate-500">Barcha ombor harakatlari va atomik tranzaksiyalar</p>
          </div>
          <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-md shadow-purple-600/20">
            <ArrowUpDown className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Roles & Permissions Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Cols: Role Distribution */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                Supermarket Rollar Tizimi va Huquqlar
              </h3>
              <p className="text-xs text-slate-500">Baza orqali boshqariladigan dinamik rollar</p>
            </div>
            <button
              onClick={() => onNavigate('roles')}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium flex items-center gap-1"
            >
              <span>Matritsani ko‘rish</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {roles.map((r) => {
              const count = users.filter(u => u.role_id === r.id).length;
              const permCount = r.id === 'SUPER_ADMIN' ? permissions.length : r.permissions.length;
              return (
                <div
                  key={r.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <RoleBadge roleId={r.id} displayName={r.name} />
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        {r.display_name_uz}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {r.description}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right">
                      <span className="font-semibold text-slate-900 dark:text-white">{count}</span>
                      <span className="text-slate-400 ml-1">xodim</span>
                    </div>
                    <div className="px-2.5 py-1 rounded-lg bg-slate-200/60 dark:bg-slate-700/60 font-mono text-[11px] text-slate-700 dark:text-slate-200 font-semibold">
                      {permCount} huquq
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Quick RBAC sandbox test */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  RBAC Ruxsat Tekshiruvi
                </h3>
                <p className="text-[11px] text-slate-500">Kassir yoki boshqa rol ruxsatini test qiling</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Joriy rol:</span>
                <span className="font-semibold font-mono text-emerald-600">{currentUser.role_id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">tovar yaratish (product:create):</span>
                <span className={currentUser.role_id === 'SUPER_ADMIN' || currentUser.role_id === 'ADMIN' || currentUser.role_id === 'WAREHOUSE_MANAGER' ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
                  {currentUser.role_id === 'SUPER_ADMIN' || currentUser.role_id === 'ADMIN' || currentUser.role_id === 'WAREHOUSE_MANAGER' ? 'RUXSAT' : 'CHEKLANGAN (403)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">ombor qoldig‘i (inventory:update):</span>
                <span className={currentUser.role_id === 'SUPER_ADMIN' || currentUser.role_id === 'ADMIN' || currentUser.role_id === 'WAREHOUSE_MANAGER' ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
                  {currentUser.role_id === 'SUPER_ADMIN' || currentUser.role_id === 'ADMIN' || currentUser.role_id === 'WAREHOUSE_MANAGER' ? 'RUXSAT' : 'CHEKLANGAN (403)'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Tizim barcha amallarni (<code className="text-slate-700 dark:text-slate-300 font-mono">product:create</code>, <code className="text-slate-700 dark:text-slate-300 font-mono">inventory:update</code>) PostgreSQL ma'lumotlar bazasidagi ruxsatlar xaritasi asosida tekshiradi.
            </p>
          </div>

          <div className="mt-6 space-y-2">
            <button
              onClick={() => onNavigate('tester')}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition"
            >
              Interaktiv Test Sahifasiga O‘tish
            </button>
            <button
              onClick={onOpenSQL}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
            >
              PostgreSQL DDL Kodini Ko‘rish
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

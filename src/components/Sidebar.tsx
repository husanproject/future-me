import React from 'react';
import {
  LayoutDashboard, Users, ShieldCheck, CheckSquare,
  FileText, Database, ShoppingCart, Barcode, Package,
  Bot, Clock, ArrowUpDown, Folder, CreditCard, RotateCcw,
  Tag, Award, Sparkles, BarChart3, Lock
} from 'lucide-react';

export type ActiveTab =
  | 'overview'
  | 'pos'
  | 'products'
  | 'batches'
  | 'scanner'
  | 'inventory'
  | 'sales'
  | 'customers'
  | 'discounts'
  | 'shifts'
  | 'ai_monitoring'
  | 'reports'
  | 'categories'
  | 'users'
  | 'roles'
  | 'tester'
  | 'audit'
  | 'architecture';

interface Props {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  userRole: string;
}

export const Sidebar: React.FC<Props> = ({ activeTab, onSelectTab, userRole }) => {
  const posOperations = [
    {
      id: 'pos',
      label: 'Smart POS Kassir Chek',
      icon: <ShoppingCart className="w-4 h-4" />,
      desc: 'Shtrix-kod, FEFO va to‘lov terminali',
      highlight: true
    },
    {
      id: 'shifts',
      label: 'Kassa Smenasi & Z-Otchet',
      icon: <Lock className="w-4 h-4" />,
      desc: 'Smena ochish, yopish va Z-hisobot'
    },
    {
      id: 'sales',
      label: 'Sotuvlar Tarixi & Qaytarish',
      icon: <RotateCcw className="w-4 h-4" />,
      desc: 'Cheklar arxivi va refund (qaytarish)'
    },
    {
      id: 'customers',
      label: 'Mijozlar & Keshbek Bonus',
      icon: <Award className="w-4 h-4" />,
      desc: 'Sodiqlik kartalari va ballar'
    },
    {
      id: 'discounts',
      label: 'Chegirmalar & Aksiyalar',
      icon: <Tag className="w-4 h-4" />,
      desc: 'Promo-kodlar va flash sale'
    }
  ];

  const inventoryAndWarehouse = [
    {
      id: 'products',
      label: 'Mahsulotlar Katalogi',
      icon: <Package className="w-4 h-4" />,
      desc: 'Narxlar va shtrix-kodlar'
    },
    {
      id: 'batches',
      label: 'Partiyalar & FEFO Muddat',
      icon: <Clock className="w-4 h-4" />,
      desc: 'Yaroqlilik muddati va partiyalar'
    },
    {
      id: 'scanner',
      label: 'Shtrix-Kod Skaner Terminali',
      icon: <Barcode className="w-4 h-4" />,
      desc: 'Kamera va qo‘lda skanerlash'
    },
    {
      id: 'inventory',
      label: 'Ombor Qoldig‘i (Inventory)',
      icon: <ArrowUpDown className="w-4 h-4" />,
      desc: 'Kirim, chiqim va harakatlar'
    },
    {
      id: 'categories',
      label: 'Toifalar & Bo‘limlar',
      icon: <Folder className="w-4 h-4" />,
      desc: 'Ierarxik kategoriyalar'
    }
  ];

  const aiAndAnalytics = [
    {
      id: 'ai_monitoring',
      label: 'AI Monitoring & Bashorat',
      icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
      desc: 'Talab prognozi & anomaliyalar',
      ai: true
    },
    {
      id: 'reports',
      label: 'Moliyaviy Hisobotlar & Tahlil',
      icon: <BarChart3 className="w-4 h-4" />,
      desc: 'Tushum, marja va top tovarlar'
    }
  ];

  const administration = [
    {
      id: 'overview',
      label: 'Boshqaruv Paneli (Overview)',
      icon: <LayoutDashboard className="w-4 h-4" />,
      desc: 'Asosiy KPI ko‘rsatkichlari'
    },
    {
      id: 'users',
      label: 'Foydalanuvchilar & Xodimlar',
      icon: <Users className="w-4 h-4" />,
      desc: 'Kassirlar va boshqaruv'
    },
    {
      id: 'roles',
      label: 'Rollar & RBAC Matritsasi',
      icon: <ShieldCheck className="w-4 h-4" />,
      desc: 'Dinamik ruxsatlar katalogi'
    },
    {
      id: 'tester',
      label: 'RBAC Ruxsat Sinovi',
      icon: <CheckSquare className="w-4 h-4" />,
      desc: 'Interaktiv ruxsat tekshiruvi'
    },
    {
      id: 'audit',
      label: 'Audit & Xavfsizlik Jurnali',
      icon: <FileText className="w-4 h-4" />,
      desc: 'Tizim harakatlari tarixi'
    },
    {
      id: 'architecture',
      label: 'SQL Sxema & Docker',
      icon: <Database className="w-4 h-4" />,
      desc: 'PostgreSQL DDL & Arxitektura'
    }
  ];

  let filteredPos = posOperations;
  let filteredInventory = inventoryAndWarehouse;
  let filteredAi = aiAndAnalytics;
  let filteredAdmin = administration;

  if (userRole === 'CASHIER') {
    filteredPos = posOperations.filter(i => ['pos', 'shifts', 'sales', 'customers'].includes(i.id));
    filteredInventory = inventoryAndWarehouse.filter(i => ['products'].includes(i.id));
    filteredAi = [];
    filteredAdmin = [];
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-3 flex flex-col justify-between overflow-y-auto max-h-[calc(100vh-4rem)]">
      <div className="space-y-4">

        {/* Section 1: POS Operations */}
        <div>
          <div className="px-3 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center justify-between">
            <span>KASSA & SAVDO (POS)</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 font-bold">TERMINAL</span>
          </div>

          <nav className="space-y-0.5 mt-1">
            {filteredPos.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id as ActiveTab)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center gap-2.5 transition ${
                    isActive
                      ? 'bg-emerald-600 text-white font-medium shadow-sm shadow-emerald-600/20'
                      : item.highlight
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-100'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className={`${isActive ? 'text-white' : item.highlight ? 'text-emerald-600' : 'text-slate-500 dark:text-slate-400'}`}>
                    {item.icon}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs truncate font-semibold">{item.label}</div>
                    <div className={`text-[9px] truncate ${isActive ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-500'}`}>
                      {item.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Section 2: Inventory & FEFO */}
        <div>
          <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            TOVAR, OMBOR & FEFO
          </div>

          <nav className="space-y-0.5 mt-1">
            {filteredInventory.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id as ActiveTab)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center gap-2.5 transition ${
                    isActive
                      ? 'bg-emerald-600 text-white font-medium shadow-sm shadow-emerald-600/20'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className={`${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                    {item.icon}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs truncate">{item.label}</div>
                    <div className={`text-[9px] truncate ${isActive ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-500'}`}>
                      {item.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Section 3: AI Intelligence & Analytics */}
        {filteredAi.length > 0 && (
        <div>
          <div className="px-3 py-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center justify-between">
            <span>AI INTELLECT & TAHLIL</span>
            <Sparkles className="w-3 h-3 text-indigo-500" />
          </div>

          <nav className="space-y-0.5 mt-1">
            {filteredAi.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id as ActiveTab)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center gap-2.5 transition ${
                    isActive
                      ? 'bg-indigo-600 text-white font-medium shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className={`${isActive ? 'text-white' : 'text-indigo-500 dark:text-indigo-400'}`}>
                    {item.icon}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs truncate font-semibold">{item.label}</div>
                    <div className={`text-[9px] truncate ${isActive ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'}`}>
                      {item.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
        )}

        {/* Section 4: RBAC & System Architecture */}
        {filteredAdmin.length > 0 && (
        <div>
          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            RBAC, XODIMLAR & XAVFSIZLIK
          </div>

          <nav className="space-y-0.5 mt-1">
            {filteredAdmin.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id as ActiveTab)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center gap-2.5 transition ${
                    isActive
                      ? 'bg-slate-900 dark:bg-slate-800 text-white font-medium'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className={`${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                    {item.icon}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs truncate">{item.label}</div>
                    <div className={`text-[9px] truncate ${isActive ? 'text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
                      {item.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
        )}

      </div>

      {/* Footer Info */}
      <div className="p-2.5 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] text-slate-500 dark:text-slate-400 space-y-1 mt-4">
        <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
          <span>O‘z Do‘konim POS</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-mono">v2.0 PRO</span>
        </div>
        <p className="text-[9px] text-slate-400">PostgreSQL + FastAPI + React</p>
      </div>
    </aside>
  );
};

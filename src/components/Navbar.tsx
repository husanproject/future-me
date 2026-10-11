import React, { useState } from 'react';
import {
  Store, Database, LogOut, ChevronDown,
  Users, Bell, AlertTriangle, Clock, Check
} from 'lucide-react';
import { User } from '../types/auth';
import { RoleBadge } from './RoleBadge';
import { SupermarketApiService } from '../services/api';

interface Props {
  currentUser: User | null;
  onLogout: () => void;
  onOpenSQL: () => void;
  onSwitchUser: (user: User) => void;
  availableUsers: User[];
}

export const Navbar: React.FC<Props> = ({
  currentUser,
  onLogout,
  onOpenSQL,
  onSwitchUser,
  availableUsers
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const expiryAlerts = SupermarketApiService.getExpiryAlerts();
  const criticalCount = expiryAlerts.filter(a => a.days_left <= 7).length;

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                O‘z Do‘konim
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                AI SMART POS
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">Supermarket Boshqaruv & Kassir Terminali</p>
          </div>
        </div>

        {/* Center: System Status & SQL inspector */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono font-medium">PostgreSQL 16: SQL Online</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-slate-500">FastAPI Async Engine</span>
          </div>

          <button
            onClick={onOpenSQL}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition"
            title="PostgreSQL DDL va Docker fayllarini ko'rish"
          >
            <Database className="w-3.5 h-3.5" />
            <span>SQL Sxemasi</span>
          </button>
        </div>

        {/* Right side: Notifications, Fast Role Switcher & Profile */}
        <div className="flex items-center gap-3">

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 relative transition"
              title="Ogohlantirishlar"
            >
              <Bell className="w-4 h-4" />
              {criticalCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              )}
            </button>

            {/* Notification Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Yaroqlilik Muddati Bildirishnomalari</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">{expiryAlerts.length} ta partiya</span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {expiryAlerts.slice(0, 4).map((a) => (
                    <div key={a.batch_id} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                        <span className="truncate max-w-[150px]">{a.product_name}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] ${
                          a.days_left <= 0 ? 'bg-rose-600 text-white' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {a.days_left <= 0 ? 'TUGAGAN' : `${a.days_left} kun`}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Qoldiq: {a.current_quantity} {a.unit} • Partiya: {a.batch_number}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick role-switch dropdown for testing */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/80 text-xs font-medium text-slate-700 dark:text-slate-200 transition">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Rolni sinash:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {currentUser?.role_id}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-1 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-2 hidden group-hover:block hover:block z-50">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                Foydalanuvchini almashtirish
              </div>
              <div className="max-h-60 overflow-y-auto">
                {availableUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => onSwitchUser(u)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition ${
                      u.id === currentUser?.id ? 'bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold' : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{u.full_name}</div>
                      <div className="text-[10px] text-slate-400">@{u.username}</div>
                    </div>
                    <RoleBadge roleId={u.role_id} size="sm" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Current User Info */}
          {currentUser && (
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                {currentUser.full_name.charAt(0)}
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                  {currentUser.full_name.split(' ')[0]}
                </div>
                <div className="text-[10px] text-slate-400">
                  {currentUser.role_display_name_uz || currentUser.role_id}
                </div>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
            title="Tizimdan chiqish"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};

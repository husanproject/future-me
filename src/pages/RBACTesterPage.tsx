import React, { useState } from 'react';
import {
  Play, ShieldAlert, CheckCircle2, XCircle,
  Terminal, Shield, User as UserIcon, Key, ArrowRight,
  AlertTriangle, RefreshCw
} from 'lucide-react';
import { User, Permission, RoleId } from '../types/auth';
import { RoleBadge } from '../components/RoleBadge';
import { SupermarketApiService } from '../services/api';

interface Props {
  users: User[];
  permissions: Permission[];
}

export const RBACTesterPage: React.FC<Props> = ({ users, permissions }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');
  const [selectedPermId, setSelectedPermId] = useState<string>('sale:create');
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    granted: boolean;
    statusCode: number;
    reason: string;
    user: User | null;
    perm: Permission | null;
    timestamp: string;
  } | null>(null);

  const selectedUser = users.find(u => u.id === selectedUserId) || users[0];
  const selectedPerm = permissions.find(p => p.id === selectedPermId) || permissions[0];

  const handleRunTest = () => {
    if (!selectedUser || !selectedPerm) return;

    // Simulate backend RBAC dependency logic
    const check = SupermarketApiService.checkPermission(selectedUser, selectedPerm.id);

    // If denied, record audit log just like FastAPI backend does!
    if (!check.granted) {
      SupermarketApiService.logAudit({
        user_id: selectedUser.id,
        username: selectedUser.username,
        action: 'PERMISSION_DENIED_SIMULATION',
        entity_type: 'PERMISSION',
        entity_id: selectedPerm.id,
        new_value: { required: selectedPerm.id, user_role: selectedUser.role_id }
      });
    }

    setTestResult({
      tested: true,
      granted: check.granted,
      statusCode: check.granted ? 200 : selectedUser.is_locked ? 423 : 403,
      reason: check.reason,
      user: selectedUser,
      perm: selectedPerm,
      timestamp: new Date().toLocaleTimeString()
    });
  };

  const presetScenarios = [
    {
      title: "Kassir yangi savdo cheki yaratmoqchi (sale:create)",
      userId: users.find(u => u.role_id === 'CASHIER')?.id || users[0].id,
      permId: 'sale:create'
    },
    {
      title: "Kassir mahsulotni bazadan o‘chirmoqchi (product:delete)",
      userId: users.find(u => u.role_id === 'CASHIER')?.id || users[0].id,
      permId: 'product:delete'
    },
    {
      title: "Kassir foydalanuvchilar ro'yxatini boshqarmoqchi (user:create)",
      userId: users.find(u => u.role_id === 'CASHIER')?.id || users[0].id,
      permId: 'user:create'
    },
    {
      title: "Admin foydalanuvchilar va rollarni boshqarmoqchi (role:manage)",
      userId: users.find(u => u.role_id === 'SUPER_ADMIN')?.id || users[0].id,
      permId: 'role:manage'
    },
    {
      title: "Admin moliyaviy hisobotni yuklamoqchi (report:export)",
      userId: users.find(u => u.role_id === 'SUPER_ADMIN')?.id || users[0].id,
      permId: 'report:export'
    }
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Interaktiv RBAC Ruxsat Sinov Stendi (Sandbox Bench)
        </h2>
        <p className="text-xs text-slate-500">
          FastAPI <code className="font-mono text-emerald-600 dark:text-emerald-400">require_permission()</code> va ma'lumotlar bazasi RBAC qoidalarini real vaqtda sinash
        </p>
      </div>

      {/* Simulator Inputs & Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Cols: Interactive form */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-600" />
            <span>Sinov Parametrlarini Tanlang</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* User Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                1. Qaysi xodim / foydalanuvchi nomidan?
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role_id}) {u.is_locked ? '[MUZLATILGAN]' : ''}
                  </option>
                ))}
              </select>

              {selectedUser && (
                <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-[11px] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-700 dark:text-slate-300">@{selectedUser.username}</span>
                  </div>
                  <RoleBadge roleId={selectedUser.role_id} size="sm" />
                </div>
              )}
            </div>

            {/* Permission Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                2. Qaysi amalni bajarmoqchi? (Endpoint Guard)
              </label>
              <select
                value={selectedPermId}
                onChange={(e) => setSelectedPermId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              >
                {permissions.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.module.toUpperCase()}] {p.id} — {p.description_uz}
                  </option>
                ))}
              </select>

              {selectedPerm && (
                <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-[11px]">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedPerm.description_uz}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Talab qilinadigan ruxsat: {selectedPerm.id}
                  </div>
                </div>
              )}
            </div>

          </div>

          <button
            onClick={handleRunTest}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Ruxsatni Tekshirish (Simulate Guard)</span>
          </button>

          {/* Test Result Display */}
          {testResult && (
            <div className={`p-4 rounded-2xl border animate-in fade-in duration-300 ${
              testResult.granted
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {testResult.granted ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">
                        {testResult.granted ? "RUXSAT BERILDI (ACCESS GRANTED)" : "RUXSAT RAD ETILDI (ACCESS DENIED)"}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        testResult.granted ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100' : 'bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100'
                      }`}>
                        HTTP {testResult.statusCode}
                      </span>
                    </div>
                    <p className="text-xs mt-1 leading-relaxed">
                      {testResult.reason}
                    </p>
                    <div className="text-[10px] opacity-75 mt-2 font-mono">
                      Vaqt: {testResult.timestamp} | Foydalanuvchi: {testResult.user?.username} ({testResult.user?.role_id})
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right 1 Col: Quick Presets */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
              Tayyor Sinov Ssenariylari
            </h3>
            <p className="text-xs text-slate-500">Tezkor tekshirish uchun bosing:</p>
          </div>

          <div className="space-y-2.5">
            {presetScenarios.map((sc, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelectedUserId(sc.userId);
                  setSelectedPermId(sc.permId);
                }}
                className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-emerald-500 dark:hover:border-emerald-500 transition text-xs group"
              >
                <div className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  {sc.title}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                  <span>Amal: {sc.permId}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                </div>
              </button>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            Rad etilgan amallar darhol <strong className="text-slate-700 dark:text-slate-200">audit_logs</strong> jadvaliga xavfsizlik hodisasi sifatida yoziladi.
          </div>
        </div>

      </div>

    </div>
  );
};

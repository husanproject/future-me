import React, { useState } from 'react';
import {
  ShieldCheck, Save, Check, RefreshCw, AlertTriangle,
  Layers, Lock, CheckSquare, Square
} from 'lucide-react';
import { Role, Permission, RoleId } from '../types/auth';
import { RoleBadge } from '../components/RoleBadge';
import { SupermarketApiService } from '../services/api';

interface Props {
  roles: Role[];
  permissions: Permission[];
  onRefreshData: () => void;
}

export const RolesPermissionsPage: React.FC<Props> = ({
  roles,
  permissions,
  onRefreshData
}) => {
  const [selectedRoleId, setSelectedRoleId] = useState<RoleId>('CASHIER');
  const [currentPermIds, setCurrentPermIds] = useState<string[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedRole = roles.find(r => r.id === selectedRoleId);

  // Group permissions by module
  const groupedModules = permissions.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Update currentPermIds when selected role changes
  React.useEffect(() => {
    if (selectedRole) {
      if (selectedRole.id === 'SUPER_ADMIN') {
        setCurrentPermIds(permissions.map(p => p.id));
      } else {
        setCurrentPermIds(selectedRole.permissions.map(p => p.id));
      }
    }
  }, [selectedRoleId, roles, permissions]);

  const togglePermission = (permId: string) => {
    if (selectedRoleId === 'SUPER_ADMIN') return; // Cannot alter Super Admin

    setCurrentPermIds(prev => {
      if (prev.includes(permId)) {
        return prev.filter(id => id !== permId);
      } else {
        return [...prev, permId];
      }
    });
    setIsSaved(false);
  };

  const handleSave = () => {
    setError(null);
    try {
      SupermarketApiService.updateRolePermissions(selectedRoleId, currentPermIds);
      setIsSaved(true);
      onRefreshData();
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getModuleNameUz = (mod: string) => {
    switch (mod) {
      case 'user': return 'Xodimlar & Foydalanuvchilar';
      case 'role': return 'Rollar & Tizim Konfiguratsiyasi';
      case 'product': return 'Mahsulotlar & Narxlar';
      case 'category': return 'Kategoriyalar';
      case 'inventory': return 'Ombor & Partiyalar (FEFO)';
      case 'sale': return 'Savdo & POS Kassa Operatsiyalari';
      case 'return': return 'Qaytarish & Refund';
      case 'customer': return 'Mijozlar & Sodiqlik (Bonus)';
      case 'security': return 'Xavfsizlik & Monitoring';
      case 'audit': return 'Audit & Jurnallar';
      case 'report': return 'Moliya & Hisobotlar';
      default: return mod.toUpperCase();
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Rollar & Granular Ruxsatlar Matritsasi (RBAC)
          </h2>
          <p className="text-xs text-slate-500">
            Dinamik ma'lumotlar bazasi orqali har bir rolga berilgan huquqlarni boshqarish
          </p>
        </div>

        {selectedRoleId !== 'SUPER_ADMIN' && (
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition self-start sm:self-auto"
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'Saqlandi!' : 'O‘zgarishlarni Bazaga Saqlash'}</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Role Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {roles.map((r) => {
          const isSelected = selectedRoleId === r.id;
          return (
            <button
              key={r.id}
              onClick={() => setSelectedRoleId(r.id)}
              className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-emerald-950/60 dark:border-emerald-600 shadow-md'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {r.id === 'SUPER_ADMIN' ? 'Root Rol' : 'Standart'}
                </span>
                {r.id === 'SUPER_ADMIN' && <Lock className="w-3 h-3 text-amber-400" />}
              </div>
              <div>
                <div className="font-bold text-xs truncate">{r.display_name_uz}</div>
                <div className={`text-[10px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {r.id === 'SUPER_ADMIN' ? `${permissions.length} ta huquq` : `${r.permissions.length} ta huquq`}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Role Info Card */}
      {selectedRole && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <RoleBadge roleId={selectedRole.id} size="lg" />
            <div>
              <div className="font-semibold text-sm text-slate-900 dark:text-white">
                {selectedRole.display_name_uz} ({selectedRole.name})
              </div>
              <p className="text-xs text-slate-500">
                {selectedRole.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500">
              Faol ruxsatlar: <strong className="text-emerald-600 font-mono text-sm">{currentPermIds.length}</strong> / {permissions.length}
            </span>
            {selectedRoleId === 'SUPER_ADMIN' && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[11px] font-medium border border-amber-200 dark:border-amber-800">
                O‘zgarmas (Doimiy Full Access)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Permissions Matrix by Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(groupedModules).map(([moduleKey, perms]) => (
          <div
            key={moduleKey}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <h4 className="font-semibold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                  {getModuleNameUz(moduleKey)}
                </h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                {perms.length} ta amal
              </span>
            </div>

            <div className="space-y-2">
              {perms.map((p) => {
                const isChecked = currentPermIds.includes(p.id);
                const isSuperAdmin = selectedRoleId === 'SUPER_ADMIN';

                return (
                  <div
                    key={p.id}
                    onClick={() => !isSuperAdmin && togglePermission(p.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition ${
                      isSuperAdmin
                        ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 cursor-not-allowed opacity-90'
                        : isChecked
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 cursor-pointer hover:border-emerald-300'
                          : 'bg-white dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={isChecked ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                        {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {p.description_uz}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {p.id}
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isChecked
                        ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}>
                      {isChecked ? 'RUXSAT' : 'TAQIQLANGAN'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

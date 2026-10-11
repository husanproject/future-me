import React, { useState } from 'react';
import {
  Users, Search, UserPlus, Shield, Lock, Unlock,
  CheckCircle, XCircle, Phone, Mail, Clock, AlertCircle
} from 'lucide-react';
import { User, RoleId } from '../types/auth';
import { RoleBadge } from '../components/RoleBadge';
import { SupermarketApiService } from '../services/api';

interface Props {
  users: User[];
  onOpenCreateUser: () => void;
  onRefreshUsers: () => void;
}

export const UsersManagementPage: React.FC<Props> = ({
  users,
  onOpenCreateUser,
  onRefreshUsers
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [message, setMessage] = useState<string | null>(null);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm);
    const matchesRole = roleFilter === 'ALL' || u.role_id === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleToggleLock = (user: User) => {
    try {
      SupermarketApiService.updateUser(user.id, {
        is_locked: !user.is_locked,
        failed_login_attempts: user.is_locked ? 0 : user.failed_login_attempts
      });
      setMessage(`${user.username} hisobi ${user.is_locked ? 'qulfdan chiqarildi' : 'muzlatildi'}`);
      onRefreshUsers();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleActive = (user: User) => {
    if (user.role_id === 'SUPER_ADMIN') {
      alert("Super Admin hisobini o'chirib bo'lmaydi!");
      return;
    }
    try {
      SupermarketApiService.updateUser(user.id, {
        is_active: !user.is_active
      });
      setMessage(`${user.username} holati ${!user.is_active ? 'faollashtirildi' : 'nofaol qilindi'}`);
      onRefreshUsers();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Foydalanuvchilar & Xodimlar Boshqaruvi
          </h2>
          <p className="text-xs text-slate-500">
            Supermarket kassirlari, ombor mudirlari, menedjerlar va hisob xavfsizligi
          </p>
        </div>

        <button
          onClick={onOpenCreateUser}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm shadow-emerald-600/20 transition self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Yangi Xodim Qo‘shish</span>
        </button>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ism, login yoki telefon bo‘yicha qidirish..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap">Rol bo‘yicha:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="ALL">Barcha rollar</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            <option value="CASHIER">CASHIER</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px]">
              <tr>
                <th className="px-5 py-3">Xodim / Login</th>
                <th className="px-4 py-3">Aloqa</th>
                <th className="px-4 py-3">Roli (RBAC)</th>
                <th className="px-4 py-3">Holati</th>
                <th className="px-4 py-3">Oxirgi Kirish</th>
                <th className="px-4 py-3 text-right">Harakatlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    Foydalanuvchi topilmadi
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs">
                          {u.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {u.full_name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            @{u.username}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span className="font-mono">{u.phone}</span>
                        </div>
                        {u.email && (
                          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                            <Mail className="w-3 h-3" />
                            <span>{u.email}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <RoleBadge roleId={u.role_id} displayName={u.role_display_name_uz} />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {u.is_locked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <Lock className="w-3 h-3" />
                            Muzlatilgan ({u.failed_login_attempts} xato)
                          </span>
                        ) : u.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle className="w-3 h-3" />
                            Faol
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                            <XCircle className="w-3 h-3" />
                            Nofaol
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-[11px] text-slate-500">
                      {u.last_login_at ? (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{new Date(u.last_login_at).toLocaleDateString()} {new Date(u.last_login_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ) : (
                        <span>Hech kirmagan</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleLock(u)}
                          className={`p-1.5 rounded-lg border transition ${
                            u.is_locked
                              ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:border-rose-800'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                          }`}
                          title={u.is_locked ? "Qulfdan chiqarish" : "Muzlatish"}
                        >
                          {u.is_locked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={u.role_id === 'SUPER_ADMIN'}
                          className={`p-1.5 rounded-lg border transition ${
                            u.is_active
                              ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:border-slate-700'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800'
                          } disabled:opacity-30`}
                          title={u.is_active ? "Nofaol qilish" : "Faollashtirish"}
                        >
                          {u.is_active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

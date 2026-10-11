import React, { useState } from 'react';
import {
  FileText, Search, Download, ShieldCheck, AlertCircle,
  Clock, Laptop, UserCheck, RefreshCw
} from 'lucide-react';
import { AuditLogItem } from '../types/auth';
import { SupermarketApiService } from '../services/api';

interface Props {
  logs: AuditLogItem[];
  onRefresh: () => void;
}

export const AuditLogsPage: React.FC<Props> = ({ logs, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      (log.username && log.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'ALL' || log.action.includes(actionFilter);
    return matchesSearch && matchesAction;
  });

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `oz_dokonim_audit_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getActionBadge = (action: string) => {
    if (action.includes('FAIL') || action.includes('LOCKED') || action.includes('DENIED')) {
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    }
    if (action.includes('SUCCESS') || action.includes('INITIALIZATION')) {
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
    return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Audit & Xavfsizlik Hodisalari Jurnali
          </h2>
          <p className="text-xs text-slate-500">
            Oddiy foydalanuvchilar o‘chira olmaydigan qat'iy tizim auditi (audit_logs jadvali)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition border border-slate-200 dark:border-slate-800"
            title="Yangilash"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={exportJSON}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 transition"
          >
            <Download className="w-4 h-4" />
            <span>JSON Eksport</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Foydalanuvchi, amal yoki modul bo‘yicha qidirish..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap">Harakat turi:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="ALL">Barcha harakatlar</option>
            <option value="LOGIN">Autentifikatsiya (Login/Logout)</option>
            <option value="USER">Foydalanuvchi amallari</option>
            <option value="ROLE">Rol va ruxsat o‘zgarishlari</option>
            <option value="DENIED">Rad etilgan amallar (Denied)</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px]">
              <tr>
                <th className="px-5 py-3">Vaqt & IP</th>
                <th className="px-4 py-3">Foydalanuvchi</th>
                <th className="px-4 py-3">Amal (Action)</th>
                <th className="px-4 py-3">Ob'ekt (Entity)</th>
                <th className="px-5 py-3">Qo‘shimcha Ma'lumot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    Audit yozuvlari topilmadi
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-slate-100">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          IP: {log.ip_address || '127.0.0.1'}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-[10px]">
                          {(log.username || 'S').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          @{log.username || 'system'}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      {log.entity_type} {log.entity_id ? `(${log.entity_id})` : ''}
                    </td>

                    <td className="px-5 py-3 font-mono text-[11px] text-slate-500">
                      {log.new_value ? (
                        <span className="max-w-xs truncate inline-block text-slate-600 dark:text-slate-400">
                          {JSON.stringify(log.new_value)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
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

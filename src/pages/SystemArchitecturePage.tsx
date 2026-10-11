import React from 'react';
import {
  Database, Server, Shield, Cpu, Terminal,
  Layers, CheckCircle, ArrowRight, Code, FileText, Check
} from 'lucide-react';

interface Props {
  onOpenSQL: () => void;
}

export const SystemArchitecturePage: React.FC<Props> = ({ onOpenSQL }) => {
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Tizim Arxitekturasi & PostgreSQL Sxemasi (Phase 1)
          </h2>
          <p className="text-xs text-slate-500">
            Professional supermarket platformasi infratuzilmasi va ma'lumotlar bazasi
          </p>
        </div>

        <button
          onClick={onOpenSQL}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition"
        >
          <Database className="w-4 h-4" />
          <span>PostgreSQL DDL (.sql) Ko‘rish</span>
        </button>
      </div>

      {/* Docker Compose Topology */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-600" />
          <span>Docker Infratuzilmasi Topologiyasi (docker-compose.yml)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
            <div className="text-[10px] font-bold text-emerald-600 uppercase">Reverse Proxy</div>
            <div className="font-bold text-sm text-slate-900 dark:text-white mt-1">Nginx 1.25</div>
            <div className="text-[11px] text-slate-500 mt-1">Port: 80</div>
            <div className="text-[10px] text-slate-400 mt-2">SPA va API marshrutlash</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
            <div className="text-[10px] font-bold text-blue-600 uppercase">Frontend SPA</div>
            <div className="font-bold text-sm text-slate-900 dark:text-white mt-1">React + Vite</div>
            <div className="text-[11px] text-slate-500 mt-1">Port: 3000</div>
            <div className="text-[10px] text-slate-400 mt-2">Tailwind + TypeScript</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
            <div className="text-[10px] font-bold text-purple-600 uppercase">Asosiy Backend</div>
            <div className="font-bold text-sm text-slate-900 dark:text-white mt-1">FastAPI 0.110</div>
            <div className="text-[11px] text-slate-500 mt-1">Port: 8000</div>
            <div className="text-[10px] text-slate-400 mt-2">Python 3.11 + AsyncPG</div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
            <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">SQL Ma'lumotlar Bazasi</div>
            <div className="font-bold text-sm text-slate-900 dark:text-white mt-1">PostgreSQL 16</div>
            <div className="text-[11px] text-slate-500 mt-1">Port: 5432</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-2">SQL Baza + Alembic</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
            <div className="text-[10px] font-bold text-rose-600 uppercase">Keshlash & Navbat</div>
            <div className="font-bold text-sm text-slate-900 dark:text-white mt-1">Redis 7</div>
            <div className="text-[11px] text-slate-500 mt-1">Port: 6379</div>
            <div className="text-[10px] text-slate-400 mt-2">Background tasks</div>
          </div>

        </div>
      </div>

      {/* SQL Tables & Relational Schema */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-600" />
          <span>PostgreSQL Relatsion Jadvallari (Phase 1)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
            <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span className="font-mono">users</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">Table</span>
            </div>
            <p className="text-slate-500 text-[11px]">Foydalanuvchilar, kassirlar, xodimlar.</p>
            <div className="font-mono text-[10px] text-slate-600 dark:text-slate-400 space-y-0.5 border-t border-slate-200 dark:border-slate-700 pt-2">
              <div>• id: UUID (PK)</div>
              <div>• username: VARCHAR(50) (UQ, IDX)</div>
              <div>• phone: VARCHAR(20) (UQ, IDX)</div>
              <div>• hashed_password: VARCHAR(255)</div>
              <div>• role_id: VARCHAR(50) (FK &rarr; roles)</div>
              <div>• failed_login_attempts: INT</div>
              <div>• is_locked: BOOLEAN</div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
            <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span className="font-mono">roles & permissions</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold">RBAC</span>
            </div>
            <p className="text-slate-500 text-[11px]">Dinamik ruxsatlar xaritasi (M:N bog‘lanish).</p>
            <div className="font-mono text-[10px] text-slate-600 dark:text-slate-400 space-y-0.5 border-t border-slate-200 dark:border-slate-700 pt-2">
              <div>• roles (id, name, display_name_uz)</div>
              <div>• permissions (id, module, action)</div>
              <div>• role_permissions (role_id, permission_id)</div>
              <div>  PK: (role_id, permission_id)</div>
              <div>  Index: idx_role_permissions_role</div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
            <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span className="font-mono">audit_logs & cash</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">Audit</span>
            </div>
            <p className="text-slate-500 text-[11px]">Xavfsizlik monitoringi va kassa smenalari.</p>
            <div className="font-mono text-[10px] text-slate-600 dark:text-slate-400 space-y-0.5 border-t border-slate-200 dark:border-slate-700 pt-2">
              <div>• audit_logs (id, user_id, action, JSONB)</div>
              <div>• cash_registers (id, register_code)</div>
              <div>• cash_sessions (id, cashier_id, status)</div>
              <div>  Index: idx_audit_logs_action</div>
              <div>  Index: idx_audit_logs_created_at</div>
            </div>
          </div>

        </div>
      </div>

      {/* Security Architecture Checklist */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>Amalga Oshirilgan Xavfsizlik Talablari (Security Checklist)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {[
            "Bcrypt 12-round password hashing",
            "JWT access token (HS256) + refresh token rotation",
            "Database-driven dinamik RBAC permissions",
            "5 ta noto'g'ri urinishdan so'ng 15 daqiqa bloklash",
            "Audit jurnali (o'chirish imkoni yo'q)",
            "SQL Injection va XSS himoyasi (SQLAlchemy + Pydantic)",
            "CORS va xavfsiz HTTP headerlar (nosniff, DENY)",
            "Kassir va boshqa rollarning qat'iy chegarasi",
            "Super Admin huquqini cheklashni taqiqlash"
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

import React, { useState } from 'react';
import {
  Store, Lock, ShieldCheck, UserCheck, KeyRound,
  Eye, EyeOff, AlertCircle, ArrowRight, ShieldAlert, ShoppingBag
} from 'lucide-react';
import { SupermarketApiService } from '../services/api';
import { User } from '../types/auth';

interface Props {
  onLoginSuccess: (user: User) => void;
  onOpenSQL: () => void;
}

export const LoginPage: React.FC<Props> = ({ onLoginSuccess, onOpenSQL }) => {
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('Admin123!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await SupermarketApiService.login(identifier, password);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || "Kirishda xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (userLogin: string) => {
    setIdentifier(userLogin);
    setPassword('Admin123!');
    setError(null);
    setIsLoading(true);
    try {
      const res = await SupermarketApiService.login(userLogin, 'Admin123!');
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const quickRoles = [
    { label: 'Admin', user: 'admin', desc: 'To‘liq huquq' },
    { label: 'Kassir (POS)', user: 'cashier1', desc: 'Savdo va chek' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-xl shadow-emerald-500/20 mb-3">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            O‘z Do‘konim — AI Smart POS
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Supermarket Boshqaruv Tizimi (Phase 1: RBAC & Xavfsizlik)
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Login yoki Telefon raqam
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin yoki +998901234567"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl text-white outline-none transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-300">
                  Maxfiy Parol
                </label>
                <span className="text-[11px] text-emerald-400">Standart: Admin123!</span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl text-white outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Tizimga Kirish</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                1-Tugmali Demo Kirish (Test Uchun)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {quickRoles.map((qr) => (
                <button
                  key={qr.user}
                  type="button"
                  onClick={() => handleQuickLogin(qr.user)}
                  className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-emerald-500/50 text-left transition text-xs group"
                >
                  <div className="font-semibold text-slate-200 group-hover:text-emerald-300">
                    {qr.label}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">@{qr.user}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Security details footnote */}
          <div className="mt-4 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-[11px] text-slate-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span>Xavfsizlik: 5 marta xato kiritilsa hisob bloklanadi. Barcha parollar Bcrypt bilan xeshlanadi.</span>
            </div>
          </div>
        </div>

        {/* View SQL architecture button */}
        <div className="mt-4 text-center">
          <button
            onClick={onOpenSQL}
            className="text-xs text-slate-400 hover:text-emerald-400 underline underline-offset-4 transition"
          >
            PostgreSQL SQL DDL & Docker fayllarini ko‘rish
          </button>
        </div>

      </div>
    </div>
  );
};

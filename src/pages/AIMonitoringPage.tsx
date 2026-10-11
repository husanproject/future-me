import React, { useState } from 'react';
import {
  Bot, Sparkles, TrendingUp, AlertTriangle, ShieldAlert,
  Calendar, ArrowRight, CheckCircle2, Clock, PackageCheck, Zap, RefreshCw
} from 'lucide-react';
import { Product } from '../types/product';
import { Batch, ExpiryAlert, AIExpiryRecommendation } from '../types/batch';
import { AIForecastMetric } from '../types/pos';
import { SupermarketApiService } from '../services/api';

interface Props {
  batches: Batch[];
  products: Product[];
  onOpenAIModal?: (batch: Batch) => void;
  onNavigateToBatches?: () => void;
}

export const AIMonitoringPage: React.FC<Props> = ({
  batches,
  products,
  onOpenAIModal,
  onNavigateToBatches
}) => {
  const [activeTab, setActiveTab] = useState<'FORECAST' | 'EXPIRY' | 'SECURITY'>('FORECAST');
  const forecasts = SupermarketApiService.getAIForecasts();
  const expiryAlerts = SupermarketApiService.getExpiryAlerts();
  const securityAnomalies = SupermarketApiService.getAISecurityAnomalies();

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>AI Monitoring & Savdo Bashorati (AI Intelligence Suite)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>AI TIZIM</span>
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Talab prognozi, yaroqlilik muddati optimizatsiyasi va firibgarlik anomaliyalarini sun‘iy intellekt tahlili
          </p>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('FORECAST')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'FORECAST'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>7 Kunlik Talab Bashorati & Qoldiq Prognozi</span>
        </button>

        <button
          onClick={() => setActiveTab('EXPIRY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'EXPIRY'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>AI Muddat & Chegirma Tavsiyalari ({expiryAlerts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('SECURITY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'SECURITY'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Xavfsizlik & Anomaliyalar ({securityAnomalies.length})</span>
        </button>
      </div>

      {/* Tab 1: Demand Forecasting */}
      {activeTab === 'FORECAST' && (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800/80 dark:to-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">
                  scikit-learn & Vaqt Qatorlari (Time-Series) Prognoz Modeli
                </h4>
                <p className="text-slate-500">
                  Shanba-Yakshanba haftalik talab koeffitsiyenti (Weekend lift +38%) va yetkazib berish intervallari inobatga olingan.
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400">Model aniqligi (R² score):</span>
              <div className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">94.2%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forecasts.map((f) => (
              <div
                key={f.product_id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">{f.category_name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      f.stockout_risk === 'HIGH'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : f.stockout_risk === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      Xavf: {f.stockout_risk}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {f.product_name}
                  </h3>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <div className="text-[10px] text-slate-400">Hozirgi Qoldiq</div>
                      <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                        {f.current_stock} dona
                      </div>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <div className="text-[10px] text-slate-400">Kunlik Tezlik (Velocity)</div>
                      <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                        ~{f.avg_daily_sales} dona/kun
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800/60 text-xs space-y-1.5">
                  <div className="flex justify-between font-medium">
                    <span className="text-indigo-900 dark:text-indigo-200">7 kunlik kutilayotgan sotuv:</span>
                    <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">{f.forecast_next_7_days} dona</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-500">Qoldiq tugash muddati:</span>
                    <span className="font-mono font-bold text-rose-600">{f.days_until_stockout} kunda</span>
                  </div>
                  {f.recommended_reorder_qty > 0 && (
                    <div className="pt-1.5 border-t border-indigo-200 dark:border-indigo-800 text-[11px] text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-between">
                      <span>Tavsiya etilgan buyurtma:</span>
                      <span className="font-mono">+{f.recommended_reorder_qty} dona</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Expiry AI Optimization */}
      {activeTab === 'EXPIRY' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {expiryAlerts.map((alert) => {
              const rec = SupermarketApiService.getAIExpiryRecommendation(alert.batch_id);
              const batchObj = batches.find(b => b.id === alert.batch_id);
              return (
                <div
                  key={alert.batch_id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-500">
                        Partiya: {alert.batch_number}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        alert.days_left <= 0
                          ? 'bg-rose-600 text-white animate-pulse'
                          : alert.days_left <= 7
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {alert.days_left <= 0 ? 'MUDDATI O‘TGAN' : `${alert.days_left} kun qoldi`}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {alert.product_name}
                    </h3>

                    <div className="text-xs text-slate-500">
                      Qoldiq: <span className="font-bold text-slate-900 dark:text-white">{alert.current_quantity} {alert.unit}</span> • Muddati: {alert.expiry_date}
                    </div>
                  </div>

                  {/* AI Insight Box */}
                  <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold text-indigo-900 dark:text-indigo-200">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>AI Tavsiyasi: {rec.action_title}</span>
                      </span>
                      <span className="font-mono text-emerald-600 font-black">
                        {rec.clearance_probability * 100}% ehtimollik
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      {rec.ai_insight_uz}
                    </p>

                    <div className="pt-2 border-t border-indigo-200/60 dark:border-indigo-800/60 grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400">Tavsiya narx:</span>
                        <div className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                          {rec.discounted_price.toLocaleString()} UZS
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">Brak yo‘qotish xavfi:</span>
                        <div className="font-mono font-bold text-rose-600">
                          -{rec.potential_waste_loss_uzs.toLocaleString()} UZS
                        </div>
                      </div>
                    </div>
                  </div>

                  {batchObj && onOpenAIModal && (
                    <button
                      onClick={() => onOpenAIModal(batchObj)}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>AI Chegirmani Qo‘llash / Tasdiqlash</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Security & Anomaly Logs */}
      {activeTab === 'SECURITY' && (
        <div className="space-y-3">
          {securityAnomalies.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border flex items-start gap-3 transition ${
                item.level === 'CRITICAL'
                  ? 'border-rose-300 bg-rose-50/50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200'
                  : item.level === 'WARNING'
                  ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200'
                  : 'border-slate-200 bg-slate-50/50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="p-2 rounded-xl bg-white/60 dark:bg-slate-900 shadow-sm mt-0.5">
                <AlertTriangle className={`w-5 h-5 ${
                  item.level === 'CRITICAL' ? 'text-rose-600' : item.level === 'WARNING' ? 'text-amber-600' : 'text-slate-500'
                }`} />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold">{item.title}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">{new Date(item.timestamp).toLocaleTimeString('uz-UZ')}</span>
                </div>
                <p className="text-xs opacity-90 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

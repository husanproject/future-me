import React, { useState } from 'react';
import {
  X, Sparkles, AlertTriangle, TrendingDown,
  CheckCircle, Percent, ArrowRight, ShieldCheck, DollarSign
} from 'lucide-react';
import { AIExpiryRecommendation, Batch } from '../types/batch';
import { SupermarketApiService } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  batch: Batch | null;
  onApplyDiscount: (batchId: string, discountPercent: number) => void;
}

export const AIExpiryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  batch,
  onApplyDiscount
}) => {
  if (!isOpen || !batch) return null;

  const rec: AIExpiryRecommendation = SupermarketApiService.getAIExpiryRecommendation(batch.id);
  const [applied, setApplied] = useState(false);

  const handleApply = () => {
    onApplyDiscount(batch.id, rec.recommended_discount_percent);
    setApplied(true);
    setTimeout(() => {
      setApplied(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-purple-500/10 via-emerald-500/10 to-teal-500/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-purple-100 dark:bg-purple-950/60 text-purple-600 rounded-2xl shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                AI Expiry & Markdown Optimizer
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {batch.product_name}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">

          {/* Key Metric Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400">Qolgan Muddat:</span>
              <div className={`font-bold text-base font-mono mt-0.5 ${
                rec.days_remaining <= 2 ? 'text-rose-600' : rec.days_remaining <= 7 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {rec.days_remaining} kun
              </div>
              <span className="text-[9px] text-slate-400 font-mono">Partiya: {batch.batch_number}</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400">Joriy Qoldiq:</span>
              <div className="font-bold text-base text-slate-900 dark:text-white font-mono mt-0.5">
                {rec.current_stock} {batch.unit}
              </div>
              <span className="text-[9px] text-slate-400">Kunlik tezlik: ~{rec.daily_velocity} ta</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400">Brakka Chiqish Xavfi:</span>
              <div className="font-bold text-base text-rose-600 font-mono mt-0.5">
                {rec.expected_waste_without_discount} {batch.unit}
              </div>
              <span className="text-[9px] text-rose-500 font-mono">~{rec.potential_waste_loss_uzs.toLocaleString()} so‘m</span>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800/60">
              <span className="text-[10px] text-purple-700 dark:text-purple-300 font-medium">AI Tavsiya Chegirma:</span>
              <div className="font-bold text-xl text-purple-600 dark:text-purple-300 font-mono mt-0.5">
                {rec.recommended_discount_percent > 0 ? `-${rec.recommended_discount_percent}%` : '0%'}
              </div>
              <span className="text-[9px] text-purple-600 font-semibold font-mono">Ehtimollik: {Math.round(rec.clearance_probability * 100)}%</span>
            </div>

          </div>

          {/* AI Explanation Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-slate-50 to-emerald-500/10 dark:from-purple-950/30 dark:to-emerald-950/30 border border-purple-200 dark:border-purple-800/60 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>AI Bashorati & Tahlil Xulosasi:</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
              {rec.ai_insight_uz}
            </p>
          </div>

          {/* Pricing Impact Table */}
          {rec.recommended_discount_percent > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Moliyaviy ta'sir (Flash-sale ssenariysi):
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">Yangi chegirmali narx:</span>
                  <div className="font-bold font-mono text-emerald-600 text-sm">
                    {rec.discounted_price.toLocaleString()} so‘m
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Qutqariladigan daromad:</span>
                  <div className="font-bold font-mono text-slate-900 dark:text-white text-sm">
                    {rec.projected_revenue_uzs.toLocaleString()} so‘m
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Safety rule reminder */}
          <div className="flex items-center gap-2 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>Xavfsizlik qoidasi: AI narxni avtomatik o‘zgartirmaydi. Administrator tasdig‘i talab etiladi.</span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Yopish
            </button>
            {rec.recommended_discount_percent > 0 && (
              <button
                type="button"
                onClick={handleApply}
                disabled={applied}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold shadow-md shadow-purple-600/20 flex items-center gap-2 transition disabled:opacity-50"
              >
                {applied ? <CheckCircle className="w-4 h-4" /> : <Percent className="w-4 h-4" />}
                <span>{applied ? 'Chegirma Tasdiqlandi!' : `Chegirmani Tasdiqlash (-${rec.recommended_discount_percent}%)`}</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

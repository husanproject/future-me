import React, { useState } from 'react';
import { Tag, Plus, CheckCircle, Percent, Gift, Calendar, Search, X } from 'lucide-react';
import { Promotion } from '../types/pos';
import { SupermarketApiService } from '../services/api';

interface Props {
  promotions: Promotion[];
  onRefreshData: () => void;
}

export const DiscountsPage: React.FC<Props> = ({ promotions, onRefreshData }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [testCode, setTestCode] = useState('');
  const [testAmount, setTestAmount] = useState(250000);
  const [testResult, setTestResult] = useState<{ valid: boolean; discount: number; message: string } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    code: '',
    discount_type: 'PERCENTAGE' as const,
    discount_value: 10,
    min_order_amount: 100000,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  });

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    SupermarketApiService.createPromotion({
      title: formData.title,
      description: formData.description,
      code: formData.code.toUpperCase() || undefined,
      discount_type: formData.discount_type,
      discount_value: Number(formData.discount_value),
      min_order_amount: Number(formData.min_order_amount) || undefined,
      start_date: formData.start_date,
      end_date: formData.end_date,
      is_active: true
    });

    setIsCreateModalOpen(false);
    onRefreshData();
  };

  const handleTestPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testCode.trim()) return;
    const res = SupermarketApiService.validatePromoCode(testCode, testAmount);
    setTestResult(res);
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Chegirmalar & Aksiyalar (Discounts & Promotions)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              MARKETING
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Supermarket promo-kodlari, mavsumiy aksiyalar va avtomatik chegirmalar tizimi
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Aksiya Yaratish</span>
        </button>
      </div>

      {/* Live Promo Code Tester Bar */}
      <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-800/80 dark:to-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 shadow-sm space-y-3">
        <div className="flex items-center gap-2 font-bold text-xs text-emerald-900 dark:text-emerald-300">
          <Gift className="w-4 h-4 text-emerald-600" />
          <span>Interaktiv Promo-kod Sinovi (Kassadagi kabi tekshirish)</span>
        </div>

        <form onSubmit={handleTestPromo} className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500">Xarid summasi:</span>
            <input
              type="number"
              value={testAmount}
              onChange={(e) => setTestAmount(Number(e.target.value))}
              className="w-32 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold"
            />
            <span className="text-slate-400">UZS</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500">Promo-kod:</span>
            <input
              type="text"
              value={testCode}
              onChange={(e) => setTestCode(e.target.value)}
              placeholder="Masalan: BARAKA, SUT10"
              className="w-44 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono uppercase font-bold"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            Sinash (Apply)
          </button>
        </form>

        {testResult && (
          <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
            testResult.valid
              ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
              : 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200'
          }`}>
            <span>{testResult.message}</span>
            {testResult.valid && (
              <span className="font-mono text-sm font-black">
                Chegirma: -{testResult.discount.toLocaleString()} UZS
              </span>
            )}
          </div>
        )}
      </div>

      {/* Promotions Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {promotions.map((promo) => (
          <div
            key={promo.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  promo.is_active
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {promo.is_active ? 'Faol Aksiya' : 'Nofaol'}
                </span>

                {promo.code && (
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                    {promo.code}
                  </span>
                )}
              </div>

              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {promo.title}
              </h3>

              <p className="text-xs text-slate-500 leading-relaxed">
                {promo.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Chegirma qiymati:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {promo.discount_type === 'PERCENTAGE'
                    ? `${promo.discount_value}% Chegirma`
                    : `${promo.discount_value.toLocaleString()} UZS Chegirma`}
                </span>
              </div>

              {promo.min_order_amount && (
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>Minimal xarid:</span>
                  <span className="font-mono">{promo.min_order_amount.toLocaleString()} UZS</span>
                </div>
              )}

              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                <span>Muddati:</span>
                <span>{promo.start_date} dan {promo.end_date} gacha</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-600" />
                <span>Yangi Chegirma yoki Promo-kod Yaratish</span>
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePromo} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Aksiya Nomi *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Masalan: Hafta oxiri shirinliklar chegirmasi"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Tavsif</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Qisqacha izoh..."
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Promo-kod (ixtiyoriy)</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="NAVROZ2026"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Chegirma Turi</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  >
                    <option value="PERCENTAGE">Foiz (%)</option>
                    <option value="FIXED">Qat‘iy summa (UZS)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Qiymat (% yoki UZS)</label>
                  <input
                    type="number"
                    required
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Minimal Xarid (UZS)</label>
                  <input
                    type="number"
                    value={formData.min_order_amount}
                    onChange={(e) => setFormData({ ...formData, min_order_amount: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Boshlanish sanasi</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Tugash sanasi</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl text-xs font-semibold"
                >
                  Bekor Qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30"
                >
                  Aksiyani Ishga Tushirish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState } from 'react';
import { X, ShieldAlert, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { Batch } from '../types/batch';
import { SupermarketApiService } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  batch: Batch | null;
  onOverrideApproved: () => void;
}

export const ExpiryOverrideModal: React.FC<Props> = ({
  isOpen,
  onClose,
  batch,
  onOverrideApproved
}) => {
  const [reason, setReason] = useState('');
  const [discountPercent, setDiscountPercent] = useState('30');
  const [validHours, setValidHours] = useState('24');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !batch) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim() || reason.trim().length < 5) {
      setError("Administrator sababini aniq ko‘rsatishi shart (kamida 5 ta belgi)");
      return;
    }

    try {
      SupermarketApiService.createExpiryOverride({
        batch_id: batch.id,
        reason: reason.trim(),
        approved_discount_percent: parseFloat(discountPercent) || 0,
        valid_hours: parseInt(validHours) || 24
      });

      onOverrideApproved();
      onClose();
      setReason('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-rose-50/50 dark:bg-rose-950/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-100 dark:bg-rose-950/60 text-rose-600 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Admin Expiry Override</h3>
              <p className="text-xs text-slate-500">Muddati yaqin/o‘tgan partiyaga maxsus sotuv ruxsati</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="font-semibold text-slate-900 dark:text-white">{batch.product_name}</div>
            <div className="text-slate-500 text-[11px] font-mono mt-0.5">
              Partiya: {batch.batch_number} | Yaroqlilik: {batch.expiry_date} ({batch.days_to_expiry} kun)
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Ruxsat berish sababi (Majburiy) *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Masalan: Maxsus qayta ishlashga yoki qisqa muddatli yarim narxda realizatsiya qilish uchun"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tasdiqlangan chegirma (%)
              </label>
              <input
                type="number"
                min="0"
                max="90"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Ruxsat muddati (soat)
              </label>
              <select
                value={validHours}
                onChange={(e) => setValidHours(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white"
              >
                <option value="12">12 soat</option>
                <option value="24">24 soat (1 kun)</option>
                <option value="48">48 soat (2 kun)</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 text-[11px] text-rose-800 dark:text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
            <span>Audit ogohlantirish: Ushbu amal administrator IDsi, sababi va vaqti bilan birgalikda o‘chirilmas audit jurnaliga qayd etiladi.</span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold shadow-sm transition"
            >
              Override Ruxsatini Berish
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

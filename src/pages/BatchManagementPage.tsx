import React, { useState } from 'react';
import {
  Layers, Search, Plus, Calendar, Clock,
  AlertTriangle, CheckCircle, Package, Truck
} from 'lucide-react';
import { Batch } from '../types/batch';
import { Product } from '../types/product';

interface Props {
  batches: Batch[];
  products: Product[];
  onOpenCreateBatch: () => void;
  onSelectBatchForAI: (b: Batch) => void;
  onSelectBatchForOverride: (b: Batch) => void;
}

export const BatchManagementPage: React.FC<Props> = ({
  batches,
  products,
  onOpenCreateBatch,
  onSelectBatchForAI,
  onSelectBatchForOverride
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState('ALL');

  const filteredBatches = batches.filter(b => {
    const matchesSearch =
      b.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.product_name && b.product_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.supplier_name && b.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesProduct = productFilter === 'ALL' || b.product_id === productFilter;
    return matchesSearch && matchesProduct;
  });

  const getTierBadge = (tier: string, days: number) => {
    switch (tier) {
      case 'CRITICAL':
        return 'bg-rose-600 text-white font-bold animate-pulse';
      case 'RED':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 font-bold';
      case 'ORANGE':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 font-bold';
      case 'YELLOW':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300 border-yellow-300';
      default:
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300';
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Partiyalar Boshqaruvi (Batches & FEFO)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              PHASE 3
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Har bir tovar partiyasining yaroqlilik muddati, qoldig‘i va yetkazib beruvchisi
          </p>
        </div>

        <button
          onClick={onOpenCreateBatch}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Partiyani Qabul Qilish (Kirim)</span>
        </button>
      </div>

      {/* Filter / Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Partiya raqami, mahsulot yoki yetkazib beruvchi..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap">Mahsulot:</span>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="ALL">Barcha mahsulotlar</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px]">
              <tr>
                <th className="px-5 py-3">Partiya # / Mahsulot</th>
                <th className="px-4 py-3">Yetkazib Beruvchi</th>
                <th className="px-4 py-3">Qoldiq / Boshlang‘ich</th>
                <th className="px-4 py-3">Ishlab Chiqarilgan</th>
                <th className="px-4 py-3">Yaroqlilik Muddati (Expiry)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    Partiyalar topilmadi
                  </td>
                </tr>
              ) : (
                filteredBatches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">

                    {/* Batch number & Product */}
                    <td className="px-5 py-3">
                      <div className="font-bold text-slate-900 dark:text-white font-mono text-xs">
                        {b.batch_number}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {b.product_name}
                      </div>
                    </td>

                    {/* Supplier */}
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {b.supplier_name || 'Lokal Ishlab chiqaruvchi'}
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3">
                      <div className="font-bold font-mono text-slate-900 dark:text-white">
                        {b.current_quantity} {b.unit}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Qabul: {b.initial_quantity} {b.unit}
                      </div>
                    </td>

                    {/* Manufacture date */}
                    <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                      {b.manufacture_date}
                    </td>

                    {/* Expiry Date & Countdown */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs">
                          {b.expiry_date}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] border ${getTierBadge(b.expiry_tier, b.days_to_expiry)}`}>
                          {b.days_to_expiry < 0
                            ? `Muddati o‘tgan (${Math.abs(b.days_to_expiry)} kun)`
                            : b.days_to_expiry === 0
                              ? 'Bugun tugaydi'
                              : `${b.days_to_expiry} kun qoldi`}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        b.status === 'EXPIRED'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          : b.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-700'
                      }`}>
                        {b.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectBatchForAI(b)}
                          className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 text-xs font-semibold border border-purple-200 dark:border-purple-800 transition"
                          title="AI Expiry Tahlili va Chegirma"
                        >
                          AI Tahlil
                        </button>

                        {(b.days_to_expiry <= 7 || b.is_expired) && (
                          <button
                            onClick={() => onSelectBatchForOverride(b)}
                            className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-800 transition"
                            title="Admin Override"
                          >
                            Override
                          </button>
                        )}
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

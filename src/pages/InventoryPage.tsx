import React, { useState } from 'react';
import {
  Package, ArrowUpDown, AlertTriangle, TrendingUp,
  Search, Plus, ArrowUpRight, ArrowDownLeft, FileText, CheckCircle
} from 'lucide-react';
import { Product, InventoryMovement } from '../types/product';
import { SupermarketApiService } from '../services/api';

interface Props {
  products: Product[];
  movements: InventoryMovement[];
  onSelectProductForAdjust: (p: Product) => void;
  onRefreshData: () => void;
}

export const InventoryPage: React.FC<Props> = ({
  products,
  movements,
  onSelectProductForAdjust,
  onRefreshData
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [movementFilter, setMovementFilter] = useState('ALL');

  const totalStockCount = products.reduce((sum, p) => sum + p.current_stock, 0);
  const totalStockValuation = products.reduce((sum, p) => sum + (p.current_stock * p.purchase_price), 0);
  const lowStockProducts = products.filter(p => p.is_low_stock);

  const filteredMovements = movements.filter(m => {
    const matchesSearch =
      (m.product_name && m.product_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.reason && m.reason.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.reference_id && m.reference_id.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = movementFilter === 'ALL' || m.movement_type === movementFilter;
    return matchesSearch && matchesType;
  });

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'STOCK_IN':
        return {
          bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200',
          label: 'Kirim (In)'
        };
      case 'STOCK_OUT':
        return {
          bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200',
          label: 'Chiqim (Out)'
        };
      case 'DAMAGED':
        return {
          bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200',
          label: 'Brak / Yaroqsiz'
        };
      case 'EXPIRED':
        return {
          bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200',
          label: 'Muddati o‘tgan'
        };
      case 'ADJUSTMENT':
        return {
          bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200',
          label: 'Tuzatish'
        };
      case 'SALE':
        return {
          bg: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200',
          label: 'Kassa Sotuv'
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-200',
          label: type
        };
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Ombor & Qoldiq Boshqaruvi (Inventory)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Atomik Tranzaksiyalar
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Kirim, chiqim, brak hisobdan chiqarish va harakatlar auditi
          </p>
        </div>

        {products.length > 0 && (
          <button
            onClick={() => onSelectProductForAdjust(products[0])}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition self-start sm:self-auto"
          >
            <ArrowUpDown className="w-4 h-4" />
            <span>Qoldiqni O‘zgartirish (Kirim/Chiqim)</span>
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Jami Ombor Qoldig‘i</span>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {totalStockCount.toLocaleString()} birlik
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{products.length} xil mahsulot turi</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Ombor Qiymati (Kirim Narxida)</span>
          <div className="mt-2 text-xl font-bold text-emerald-600 font-mono">
            {totalStockValuation.toLocaleString()} so‘m
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Aylanma tovar kapitali</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Kam Qolgan Tovar (Min Stock)</span>
          <div className="mt-2 text-2xl font-bold text-rose-600 font-mono">
            {lowStockProducts.length} ta
          </div>
          <p className="text-[11px] text-rose-500 mt-1">Zudlik bilan buyurtma talab etiladi</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Bajarilgan Harakatlar</span>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {movements.length} ta
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Kirim, chiqim va braklar tarixi</p>
        </div>

      </div>

      {/* Low Stock Warning Alert if any */}
      {lowStockProducts.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>DIQQAT: Quyidagi mahsulotlar xavfli minimal chegaradan kam qoldi:</span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {lowStockProducts.map(p => (
              <button
                key={p.id}
                onClick={() => onSelectProductForAdjust(p)}
                className="px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-800 shadow-xs flex items-center gap-2 hover:border-emerald-500 transition"
              >
                <span className="font-semibold text-slate-900 dark:text-white">{p.name}</span>
                <span className="font-mono font-bold text-rose-600">{p.current_stock} {p.unit}</span>
                <span className="text-[10px] text-slate-400">(Min: {p.min_stock})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Movements Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Ombor Harakatlari Jurnali (inventory_movements)
            </h3>
            <p className="text-xs text-slate-500">Barcha kirim va chiqim operatsiyalari auditi</p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={movementFilter}
              onChange={(e) => setMovementFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="ALL">Barcha operatsiyalar</option>
              <option value="STOCK_IN">Kirim (Stock In)</option>
              <option value="STOCK_OUT">Chiqim (Stock Out)</option>
              <option value="DAMAGED">Brak / Yaroqsiz</option>
              <option value="EXPIRED">Muddati o‘tgan</option>
              <option value="ADJUSTMENT">Tuzatish (Adjustment)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px]">
              <tr>
                <th className="px-4 py-2.5">Sana & Vaqt</th>
                <th className="px-4 py-2.5">Mahsulot</th>
                <th className="px-4 py-2.5">Operatsiya Turi</th>
                <th className="px-4 py-2.5">Miqdor</th>
                <th className="px-4 py-2.5">Oldingi & Yangi Qoldiq</th>
                <th className="px-4 py-2.5">Hujjat & Sabab</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Harakatlar topilmadi
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  const badge = getMovementBadge(m.movement_type);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                        {new Date(m.created_at).toLocaleDateString()} {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {m.product_name || 'Tovar'}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-bold font-mono">
                        {m.movement_type === 'STOCK_IN' || m.movement_type === 'RETURN' ? '+' : '-'}
                        {m.quantity}
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px]">
                        <span className="text-slate-400">{m.previous_stock}</span>
                        <span className="mx-1 text-slate-400">&rarr;</span>
                        <span className="font-bold text-slate-900 dark:text-white">{m.new_stock}</span>
                      </td>

                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                        <div>{m.reason || '-'}</div>
                        {m.reference_id && (
                          <div className="font-mono text-[10px] text-slate-400">Hujjat: {m.reference_id}</div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

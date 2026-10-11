import React, { useState } from 'react';
import { X, ArrowUpDown, Package, AlertTriangle, FileText } from 'lucide-react';
import { Product, MovementType } from '../types/product';
import { SupermarketApiService } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onAdjusted: () => void;
}

export const InventoryAdjustModal: React.FC<Props> = ({
  isOpen,
  onClose,
  product,
  onAdjusted
}) => {
  const [movementType, setMovementType] = useState<MovementType>('STOCK_IN');
  const [quantity, setQuantity] = useState('10');
  const [reason, setReason] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) {
      setError("Iltimos, musbat miqdor kiriting");
      return;
    }

    try {
      SupermarketApiService.adjustInventory({
        product_id: product.id,
        movement_type: movementType,
        quantity: qty,
        reason: reason.trim() || undefined,
        reference_id: referenceId.trim() || undefined
      });

      onAdjusted();
      onClose();
      setQuantity('10');
      setReason('');
      setReferenceId('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getMovementTitle = (type: MovementType) => {
    switch (type) {
      case 'STOCK_IN': return 'Omborga Yangi Kirim (Stock In)';
      case 'STOCK_OUT': return 'Ombordan Chiqim (Stock Out)';
      case 'DAMAGED': return 'Yaroqsiz / Brak Mahsulotni Hisobdan Chiqarish';
      case 'EXPIRED': return 'Muddati O‘tgan Mahsulot Chiqimi';
      case 'ADJUSTMENT': return 'Inventarizatsiya Qoldig‘ini To‘g‘rilash';
      case 'RETURN': return 'Mijozdan Qaytarilgan Tovarni Qabul Qilish';
      default: return type;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 dark:bg-blue-950/60 text-blue-600 rounded-xl">
              <ArrowUpDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Ombor Qoldig‘ini O‘zgartirish</h3>
              <p className="text-xs text-slate-500">{product.name} ({product.current_stock} {product.unit})</p>
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

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Harakat turi (Operatsiya) *
            </label>
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value as MovementType)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-medium"
            >
              <option value="STOCK_IN">🟢 Yangi Kirim (Stock In)</option>
              <option value="STOCK_OUT">🔴 Chiqim (Stock Out)</option>
              <option value="DAMAGED">⚠️ Yaroqsiz / Brak (Damaged write-off)</option>
              <option value="EXPIRED">❌ Muddati o‘tgan tovar chiqimi</option>
              <option value="ADJUSTMENT">🔄 Inventarizatsiya bo‘yicha to‘g‘rilash</option>
              <option value="RETURN">↩️ Qaytarilgan tovar qabuli</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Miqdor ({product.unit}) *
              </label>
              <input
                type="number"
                step="any"
                min="0.001"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="10"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Hujjat / Invoice raqami
              </label>
              <input
                type="text"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="INV-2026-0045"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Sababi yoki Izoh
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Masalan: Qabul qilingan yangi partiya yoki transportdagi shikast"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400">
            Hozirgi qoldiq: <strong className="font-mono text-slate-800 dark:text-slate-200">{product.current_stock} {product.unit}</strong>.
            Barcha harakatlar <span className="font-mono">inventory_movements</span> va <span className="font-mono">audit_logs</span> jadvallariga atomik tarzda yoziladi.
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-sm transition"
            >
              Tranzaksiyani Tasdiqlash
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

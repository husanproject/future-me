import React, { useState } from 'react';
import { X, Layers, Calendar, Package, DollarSign, Truck } from 'lucide-react';
import { Product } from '../types/product';
import { Supplier, Batch } from '../types/batch';
import { SupermarketApiService } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  suppliers: Supplier[];
  onBatchCreated: (batch: Batch) => void;
}

export const CreateBatchModal: React.FC<Props> = ({
  isOpen,
  onClose,
  products,
  suppliers,
  onBatchCreated
}) => {
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [batchNumber, setBatchNumber] = useState('');
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [purchasePrice, setPurchasePrice] = useState('12000');
  const [initialQuantity, setInitialQuantity] = useState('50');
  const [manufactureDate, setManufactureDate] = useState('2026-10-01');
  const [expiryDate, setExpiryDate] = useState('2026-11-15');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateBatchNumber = () => {
    const selectedProd = products.find(p => p.id === productId);
    const prefix = selectedProd ? selectedProd.sku.slice(0, 4) : 'BAT';
    const rand = Math.floor(100 + Math.random() * 900);
    setBatchNumber(`${prefix}-${rand}-2026`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!productId || !batchNumber.trim() || !expiryDate) {
      setError("Iltimos, mahsulot, partiya raqami va yaroqlilik muddatini to‘ldiring");
      return;
    }

    try {
      const newBatch = SupermarketApiService.createBatch({
        product_id: productId,
        batch_number: batchNumber.trim(),
        supplier_id: supplierId || undefined,
        purchase_price: parseFloat(purchasePrice) || 0,
        initial_quantity: parseFloat(initialQuantity) || 0,
        manufacture_date: manufactureDate,
        expiry_date: expiryDate
      });

      onBatchCreated(newBatch);
      onClose();
      setBatchNumber('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Yangi Tovar Partiyasini Qabul Qilish (Batch)</h3>
              <p className="text-xs text-slate-500">FEFO yaroqlilik muddati nazorati va ombor kirimi</p>
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
              Mahsulotni tanlang *
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (Hozirgi qoldiq: {p.current_stock} {p.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-slate-700 dark:text-slate-300">
                  Partiya raqami (Batch #) *
                </label>
                <button
                  type="button"
                  onClick={handleGenerateBatchNumber}
                  className="text-[10px] text-emerald-600 hover:underline font-semibold"
                >
                  + Generatsiya
                </button>
              </div>
              <input
                type="text"
                required
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="BAT-2026-X1"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Yetkazib beruvchi (Supplier)
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Ishlab chiqarilgan sana *
              </label>
              <input
                type="date"
                required
                value={manufactureDate}
                onChange={(e) => setManufactureDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Yaroqlilik muddati (Expiry Date) *
              </label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-mono font-bold text-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Partiya miqdori (Qabul soni) *
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={initialQuantity}
                onChange={(e) => setInitialQuantity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Kirim narxi (so‘m/birlik)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900 dark:text-white"
              />
            </div>
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-sm transition"
            >
              Partiyani Qabul Qilish (Kirim)
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

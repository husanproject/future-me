import React, { useState } from 'react';
import {
  Package, Search, Plus, Filter, Barcode,
  AlertTriangle, CheckCircle, Tag, DollarSign,
  Edit3, Eye, Layers, Sparkles
} from 'lucide-react';
import { Product, Category } from '../types/product';
import { BarcodeRenderer } from '../components/BarcodeRenderer';
import { SupermarketApiService } from '../services/api';

interface Props {
  products: Product[];
  categories: Category[];
  onOpenCreateProduct: () => void;
  onRefreshProducts: () => void;
  onSelectProductForAdjust: (p: Product) => void;
}

export const ProductsPage: React.FC<Props> = ({
  products,
  categories,
  onOpenCreateProduct,
  onRefreshProducts,
  onSelectProductForAdjust
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [selectedProductForBarcode, setSelectedProductForBarcode] = useState<Product | null>(null);

  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'ALL' || p.category_id === categoryFilter;
    const matchesLowStock = !lowStockFilter || p.is_low_stock;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const lowStockCount = products.filter(p => p.is_low_stock).length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Mahsulotlar Katalogi</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              PHASE 2
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Shtrix-kodlar, narxlar, QQS stavkalari va ombor qoldig‘i
          </p>
        </div>

        <button
          onClick={onOpenCreateProduct}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm shadow-emerald-600/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Mahsulot Qo‘shish</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nomi, shtrix-kod yoki SKU bo‘yicha qidirish..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="ALL">Barcha kategoriyalar</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <button
            onClick={() => setLowStockFilter(!lowStockFilter)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition ${
              lowStockFilter
                ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Kam qoldiq ({lowStockCount})</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px]">
              <tr>
                <th className="px-5 py-3">Mahsulot Nomi / SKU</th>
                <th className="px-4 py-3">Shtrix-Kod (Barcode)</th>
                <th className="px-4 py-3">Kategoriya & Brend</th>
                <th className="px-4 py-3">Sotuv Narxi (so‘m)</th>
                <th className="px-4 py-3">Ombor Qoldig‘i</th>
                <th className="px-4 py-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    Mahsulot topilmadi
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">

                    {/* Name & SKU */}
                    <td className="px-5 py-3">
                      <div className="font-semibold text-slate-900 dark:text-white text-xs">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                        <span>SKU: {p.sku}</span>
                        <span>•</span>
                        <span>Birlik: {p.unit}</span>
                      </div>
                    </td>

                    {/* Barcode */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {p.barcode}
                        </span>
                        <button
                          onClick={() => setSelectedProductForBarcode(p)}
                          className="p-1 text-slate-400 hover:text-emerald-600 transition"
                          title="Shtrix-kod chiziqlarini ko‘rish"
                        >
                          <Barcode className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                    {/* Category & Brand */}
                    <td className="px-4 py-3">
                      <div className="text-slate-800 dark:text-slate-200">
                        {p.category_name || 'Boshqa'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {p.brand || '-'}
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white font-mono">
                        {p.sale_price.toLocaleString()} so‘m
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Kirim: {p.purchase_price.toLocaleString()} so‘m (QQS: {p.tax_rate}%)
                      </div>
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold font-mono text-xs ${
                          p.is_low_stock ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {p.current_stock} {p.unit}
                        </span>
                        {p.is_low_stock && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Kam (Min: {p.min_stock})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onSelectProductForAdjust(p)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition"
                      >
                        Qoldiqni boshqarish
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barcode Viewer Modal */}
      {selectedProductForBarcode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full text-center shadow-xl space-y-4">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              {selectedProductForBarcode.name}
            </h4>
            <div className="p-4 bg-slate-50 rounded-xl flex justify-center">
              <BarcodeRenderer value={selectedProductForBarcode.barcode} height={60} />
            </div>
            <div className="text-xs text-slate-500 font-mono">
              SKU: {selectedProductForBarcode.sku} | Narxi: {selectedProductForBarcode.sale_price.toLocaleString()} so‘m
            </div>
            <button
              onClick={() => setSelectedProductForBarcode(null)}
              className="w-full py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 transition"
            >
              Yopish
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

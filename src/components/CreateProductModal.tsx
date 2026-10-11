import React, { useState } from 'react';
import { X, PackagePlus, Barcode, Tag, DollarSign, Layers } from 'lucide-react';
import { Category, Product, UnitType } from '../types/product';
import { SupermarketApiService } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onProductCreated: (prod: Product) => void;
}

export const CreateProductModal: React.FC<Props> = ({
  isOpen,
  onClose,
  categories,
  onProductCreated
}) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('10000');
  const [salePrice, setSalePrice] = useState('13000');
  const [taxRate, setTaxRate] = useState('12');
  const [unit, setUnit] = useState<UnitType>('dona');
  const [initialStock, setInitialStock] = useState('50');
  const [minStock, setMinStock] = useState('15');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateBarcode = () => {
    // Generate valid EAN-13 starting with Uzbekistan 478 prefix or internal 200 prefix
    const randomSuffix = Math.floor(100000000 + Math.random() * 900000000);
    const code = `478${randomSuffix}`;
    setBarcode(code);
    if (!sku) {
      setSku(`SKU-${code.slice(-6)}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !sku.trim() || !barcode.trim()) {
      setError("Iltimos, nom, SKU va shtrix-kodni to'ldiring");
      return;
    }

    try {
      const newProd = SupermarketApiService.createProduct({
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        barcode: barcode.trim(),
        category_id: categoryId || undefined,
        brand: brand.trim() || undefined,
        description: description.trim() || undefined,
        purchase_price: parseFloat(purchasePrice) || 0,
        sale_price: parseFloat(salePrice) || 0,
        tax_rate: parseFloat(taxRate) || 12,
        unit,
        initial_stock: parseFloat(initialStock) || 0,
        min_stock: parseFloat(minStock) || 10
      });

      onProductCreated(newProd);
      onClose();
      // Reset
      setName('');
      setSku('');
      setBarcode('');
      setBrand('');
      setDescription('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Yangi Mahsulot Qo‘shish (Katalog)</h3>
              <p className="text-xs text-slate-500">Shtrix-kod, narxlar va boshlang‘ich ombor qoldig‘i</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Product Name */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Mahsulot nomi (O‘zbekcha / Ruscha) *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: Pepsi 1.5L yoki Makfa 1kg Un"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Barcode & SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-slate-700 dark:text-slate-300">
                  Shtrix-kod (EAN-13 / Code 128) *
                </label>
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  className="text-[10px] text-emerald-600 hover:underline font-semibold"
                >
                  + Generatsiya qilish
                </button>
              </div>
              <div className="relative">
                <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="4780001234567"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Artikul / SKU kodi *
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  placeholder="BEV-PEP-15L"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Category & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Kategoriya (Toifa)
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Brend / Ishlab chiqaruvchi
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Masalan: PepsiCo yoki Nestle"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Prices & Unit */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Kirim narxi (so‘m)
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

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Sotuv narxi (so‘m) *
              </label>
              <input
                type="number"
                min="0"
                step="500"
                required
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-emerald-600 font-bold"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                O‘lchov birligi
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as UnitType)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              >
                <option value="dona">dona</option>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="litr">litr</option>
                <option value="ml">ml</option>
                <option value="quti">quti</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                QQS stavkasi (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Stock Levels */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Boshlang‘ich qoldiq (Omborga kirim)
              </label>
              <input
                type="number"
                min="0"
                value={initialStock}
                onChange={(e) => setInitialStock(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Xavfli kam qoldiq chegarasi (Min stock)
              </label>
              <input
                type="number"
                min="1"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900 dark:text-white"
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
              Katalogga Qo‘shish
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

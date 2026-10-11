import React, { useState, useEffect } from 'react';
import {
  Keyboard, X, Delete, Check, Search,
  Plus, AlertCircle, ShoppingCart, Barcode, Sparkles
} from 'lucide-react';
import { Product } from '../types/product';
import { SupermarketApiService } from '../services/api';
import { playScanBeep } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onProductSelected: (product: Product, quantity: number) => void;
  products: Product[];
}

export const ManualBarcodeNumpadModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onProductSelected,
  products
}) => {
  const [inputVal, setInputVal] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setInputVal('');
      setQuantity(1);
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle number pad button clicks
  const handleDigitClick = (digit: string) => {
    setErrorMsg(null);
    setInputVal(prev => prev + digit);
  };

  const handleBackspace = () => {
    setErrorMsg(null);
    setInputVal(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setInputVal('');
    setErrorMsg(null);
  };

  // Submit manual barcode or SKU
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim()) {
      setErrorMsg('Iltimos, shtrix-kod yoki SKU kiriting');
      return;
    }

    const code = inputVal.trim();
    // Search by barcode, SKU or exact match
    const found = products.find(p => p.barcode === code || p.sku.toLowerCase() === code.toLowerCase())
      || SupermarketApiService.getProductByBarcode(code);

    if (found) {
      playScanBeep(true);
      onProductSelected(found, quantity);
      onClose();
    } else {
      playScanBeep(false);
      setErrorMsg(`"${code}" kodi bo‘yicha tovar topilmadi`);
    }
  };

  // Filter matching suggestions as user types
  const suggestions = inputVal.length >= 2
    ? products.filter(p =>
        p.barcode.includes(inputVal) ||
        p.name.toLowerCase().includes(inputVal.toLowerCase()) ||
        p.sku.toLowerCase().includes(inputVal.toLowerCase())
      ).slice(0, 4)
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden flex flex-col">

        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 rounded-xl">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Qo‘lda Kiritish & NumPad
              </h3>
              <p className="text-xs text-slate-500">
                Shtrix-kod yoki tovar kodini sensor orqali tering
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Screen Display */}
        <div className="p-4 bg-slate-900 text-white space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Shtrix-kod yoki SKU:</span>
            <div className="flex items-center gap-1.5">
              <span>Miqdor:</span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold rounded">
                x{quantity}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="relative">
            <Barcode className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="Raqamlar yoki nom..."
              className="w-full pl-11 pr-4 py-3 bg-slate-800 border-2 border-slate-700 focus:border-emerald-500 rounded-2xl text-xl font-mono text-emerald-400 tracking-wider outline-none"
              autoFocus
            />
          </form>

          {/* Quantity quick chips */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] text-slate-400">Tezkor soni:</span>
            {[1, 2, 3, 5, 10].map(q => (
              <button
                key={q}
                type="button"
                onClick={() => setQuantity(q)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  quantity === q
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                x{q}
              </button>
            ))}
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-950/40 border border-rose-800/60 p-2 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Live Suggestions Dropdown (if user types partial code) */}
        {suggestions.length > 0 && (
          <div className="px-4 py-2 bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/40 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Mos tovarlar ({suggestions.length}):
            </span>
            <div className="space-y-1">
              {suggestions.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    playScanBeep(true);
                    onProductSelected(s, quantity);
                    onClose();
                  }}
                  className="w-full text-left p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 flex items-center justify-between text-xs transition"
                >
                  <div className="truncate pr-2">
                    <span className="font-bold text-slate-900 dark:text-white">{s.name}</span>
                    <span className="text-slate-400 font-mono text-[10px] ml-1.5">({s.barcode})</span>
                  </div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                    {s.sale_price.toLocaleString()} UZS
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Touch Numerical Keypad (Numpad) */}
        <div className="p-4 grid grid-cols-3 gap-2.5 bg-slate-50 dark:bg-slate-900/60">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitClick(digit)}
              className="py-3.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 text-slate-900 dark:text-white font-bold text-xl rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="py-3.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 active:scale-95 font-bold text-base rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-sm transition"
          >
            C (Tozalash)
          </button>

          <button
            type="button"
            onClick={() => handleDigitClick('0')}
            className="py-3.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 text-slate-900 dark:text-white font-bold text-xl rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            className="py-3.5 bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 active:scale-95 text-slate-700 dark:text-slate-200 font-bold text-base rounded-2xl border border-slate-300 dark:border-slate-600 shadow-sm flex items-center justify-center transition"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Footer Action Button */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={!inputVal.trim()}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Savatga Qo‘shish (Kiritish)</span>
          </button>
        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Camera, Volume2, VolumeX, CheckCircle, ShoppingBag } from 'lucide-react';
import { CameraBarcodeScanner } from './CameraBarcodeScanner';
import { Product } from '../types/product';
import { SupermarketApiService } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onProductScanned: (product: Product) => void;
  products: Product[];
}

export const CameraBarcodeScannerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onProductScanned,
  products
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastFoundProduct, setLastFoundProduct] = useState<Product | null>(null);
  const [scannedHistory, setScannedHistory] = useState<Array<{ code: string; name: string; time: string }>>([]);

  if (!isOpen) return null;

  const handleScan = (scannedCode: string) => {
    const cleanCode = scannedCode.trim();
    // Lookup product in list or database
    const product = products.find(p => p.barcode === cleanCode || p.sku.toLowerCase() === cleanCode.toLowerCase())
      || SupermarketApiService.getProductByBarcode(cleanCode);

    const now = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (product) {
      setLastFoundProduct(product);
      setScannedHistory(prev => [
        { code: cleanCode, name: product.name, time: now },
        ...prev.slice(0, 9)
      ]);
      onProductScanned(product);
    } else {
      setLastFoundProduct(null);
      setScannedHistory(prev => [
        { code: cleanCode, name: '⚠️ Noma‘lum mahsulot', time: now },
        ...prev.slice(0, 9)
      ]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

        {/* Modal Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Kamera Orqali Skanerlash
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mahsulot shtrix-kodini kamera qarshisiga tuting
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={soundEnabled ? 'Ovozni o‘chirish' : 'Ovozni yoqish'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Camera Live View */}
        <div className="p-4 bg-slate-950 flex flex-col items-center">
          <div className="w-full max-w-md">
            <CameraBarcodeScanner
              onScan={handleScan}
              isActive={isOpen}
              soundEnabled={soundEnabled}
              continuous={true}
            />
          </div>
        </div>

        {/* Last scanned status & List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-white dark:bg-slate-900">
          {lastFoundProduct ? (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {lastFoundProduct.name}
                  </h4>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-mono">
                    {lastFoundProduct.sale_price.toLocaleString()} UZS • Shtrix-kod: {lastFoundProduct.barcode}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
                Savatga qo‘shildi
              </span>
            </div>
          ) : (
            <div className="text-center py-2 text-xs text-slate-400 flex items-center justify-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-slate-300" />
              <span>Skanerlangan tovarlar avtomatik kassa savatchasiga qo‘shiladi</span>
            </div>
          )}

          {/* Scanned history log */}
          {scannedHistory.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block">
                Sessiya davomida o‘qilganlar ({scannedHistory.length}):
              </span>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {scannedHistory.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 px-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[240px]">
                      {item.name}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Skanerni to‘xtatish uchun yoping
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl shadow-sm hover:opacity-90 transition"
          >
            Tayyor / Yopish
          </button>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import {
  Barcode, Search, CheckCircle2, AlertCircle,
  Volume2, VolumeX, Camera, Keyboard, Clock,
  Sparkles, Delete, ShoppingBag, Plus
} from 'lucide-react';
import { Product, BarcodeLookupResult } from '../types/product';
import { SupermarketApiService } from '../services/api';
import { BarcodeRenderer } from '../components/BarcodeRenderer';
import { CameraBarcodeScanner } from '../components/CameraBarcodeScanner';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { playScanBeep } from '../utils/audio';

interface Props {
  onSelectProductForAdjust: (p: Product) => void;
}

type ScannerMode = 'camera' | 'manual';

export const BarcodeScannerPage: React.FC<Props> = ({ onSelectProductForAdjust }) => {
  const [mode, setMode] = useState<ScannerMode>('camera');
  const [inputCode, setInputCode] = useState('');
  const [currentResult, setCurrentResult] = useState<BarcodeLookupResult | null>(null);
  const [scanHistory, setScanHistory] = useState<BarcodeLookupResult[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleLookup = (code: string) => {
    if (!code.trim()) return;
    const result = SupermarketApiService.lookupBarcode(code.trim());
    setCurrentResult(result);
    setScanHistory(prev => [result, ...prev.slice(0, 19)]); // last 20
    if (soundEnabled) {
      playScanBeep(result.found);
    }
    setInputCode('');
  };

  // Hardware barcode hook as backup
  useBarcodeScanner({
    onScan: (scannedCode) => {
      handleLookup(scannedCode);
    }
  });

  const handleDigitClick = (digit: string) => {
    setInputCode(prev => prev + digit);
  };

  const sampleBarcodes = [
    { name: 'Coca-Cola 1.5L', code: '5449000000996', type: 'EAN-13' },
    { name: 'Nestle Sut 1L', code: '4607001770014', type: 'EAN-13' },
    { name: 'Dena Sharbat 1L', code: '4780004560012', type: 'EAN-13' },
    { name: 'Makfa Un 2kg', code: '4601444001201', type: 'EAN-13' },
    { name: 'Samarqand Obi Non', code: '2000000000077', type: 'INTERNAL' },
    { name: 'Noma\'lum Shtrix-kod', code: '9999999999999', type: 'TEST' }
  ];

  return (
    <div className="space-y-6">

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Shtrix-Kod Skaner Terminali</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {mode === 'camera' ? '📷 Kamera Skaneri' : '⌨️ Qo‘lda Kiritish'}
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Kamera orqali jonli skanerlang yoki klaviatura/NumPad yordamida qo‘lda kiriting
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Tabs */}
          <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setMode('camera')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                mode === 'camera'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Kamera</span>
            </button>
            <button
              onClick={() => {
                setMode('manual');
                setTimeout(() => inputRef.current?.focus(), 100);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                mode === 'manual'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Qo‘lda / NumPad</span>
            </button>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
              soundEnabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-slate-50 text-slate-500 border-slate-300 dark:bg-slate-800'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Ovoz: {soundEnabled ? 'Bor' : 'Yo‘q'}</span>
          </button>
        </div>
      </div>

      {/* Main Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left 7 Cols: Active Scanner View (Camera or Manual) */}
        <div className="lg:col-span-7 space-y-4">

          {mode === 'camera' ? (
            /* Live Camera Barcode Scanner View */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Jonli kamera tasviri tahlil qilinmoqda</span>
                </span>
                <span className="font-mono text-[11px] text-slate-400">EAN-13, EAN-8, Code 128, QR</span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-800">
                <CameraBarcodeScanner
                  onScan={(code) => handleLookup(code)}
                  isActive={mode === 'camera'}
                  soundEnabled={soundEnabled}
                  continuous={true}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Mahsulot shtrix-kodini kamera markaziga to‘g‘rilang</span>
                <button
                  onClick={() => setMode('manual')}
                  className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                >
                  Qo‘lda kiritishga o‘tish &rarr;
                </button>
              </div>
            </div>
          ) : (
            /* Manual Input & Touch NumPad View */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <Keyboard className="w-4 h-4 text-emerald-600" />
                  <span>Klaviatura yoki sensor ekran orqali kiritish</span>
                </span>
                <span className="font-mono text-[11px] text-slate-400">Enter tugmasi bilan izlang</span>
              </div>

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLookup(inputCode);
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <Barcode className="w-5 h-5 text-emerald-600 absolute left-3.5 top-3" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="Shtrix-kodni tering (masalan: 5449000000996)..."
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-base font-mono outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={!inputCode.trim()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-2xl text-xs font-bold shadow-sm transition"
                >
                  Qidirish
                </button>
              </form>

              {/* On-screen Touch Keypad */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleDigitClick(d)}
                    className="py-3 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-900 dark:text-white font-bold text-lg rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs transition"
                  >
                    {d}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setInputCode('')}
                  className="py-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-900"
                >
                  Tozalash
                </button>
                <button
                  type="button"
                  onClick={() => handleDigitClick('0')}
                  className="py-3 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-900 dark:text-white font-bold text-lg rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs transition"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => setInputCode(prev => prev.slice(0, -1))}
                  className="py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm rounded-xl flex items-center justify-center"
                >
                  <Delete className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Demo Scan Buttons */}
              <div className="pt-1">
                <span className="text-[11px] text-slate-400 block mb-2 font-medium">
                  Sinov uchun namunaviy shtrix-kodlar:
                </span>
                <div className="flex flex-wrap gap-2">
                  {sampleBarcodes.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleLookup(s.code)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-200 transition"
                    >
                      <span>{s.name}</span>
                      <span className="font-mono text-slate-400 ml-1">({s.code.slice(-5)})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Scanned Result Card */}
          {currentResult && (
            <div className={`p-6 rounded-3xl border shadow-sm transition animate-in fade-in duration-200 ${
              currentResult.found
                ? 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800'
                : 'bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-800'
            }`}>
              {currentResult.found && currentResult.product ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-2xl">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                          Mahsulot Topildi ({currentResult.barcode_type})
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {currentResult.product.name}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Izlash vaqti: {currentResult.lookup_time_ms} ms</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 text-[10px]">Sotuv Narxi:</span>
                      <div className="font-bold text-sm text-slate-900 dark:text-white font-mono mt-0.5">
                        {currentResult.product.sale_price.toLocaleString()} so‘m
                      </div>
                      <span className="text-[10px] text-slate-400">QQS: {currentResult.product.tax_rate}%</span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 text-[10px]">Kirim Narxi:</span>
                      <div className="font-bold text-sm text-slate-900 dark:text-white font-mono mt-0.5">
                        {currentResult.product.purchase_price.toLocaleString()} so‘m
                      </div>
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        Foyda: +{(currentResult.product.sale_price - currentResult.product.purchase_price).toLocaleString()}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 text-[10px]">Mavjud Qoldiq:</span>
                      <div className={`font-bold text-sm font-mono mt-0.5 ${
                        currentResult.product.is_low_stock ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {currentResult.product.current_stock} {currentResult.product.unit}
                      </div>
                      <span className="text-[10px] text-slate-400">Min: {currentResult.product.min_stock}</span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 text-[10px]">Kategoriya:</span>
                      <div className="font-bold text-xs text-slate-900 dark:text-white mt-0.5 truncate">
                        {currentResult.product.category_name || '-'}
                      </div>
                      <span className="text-[10px] text-slate-400">SKU: {currentResult.product.sku}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <BarcodeRenderer value={currentResult.product.barcode} height={40} />

                    <button
                      onClick={() => onSelectProductForAdjust(currentResult.product!)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
                    >
                      Ombor qoldig‘ini o‘zgartirish
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-rose-700 dark:text-rose-300">
                  <div className="p-2.5 bg-rose-100 dark:bg-rose-950/60 rounded-2xl">
                    <AlertCircle className="w-6 h-6 text-rose-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">
                      Mahsulot topilmadi ({currentResult.matched_barcode})
                    </h4>
                    <p className="text-xs text-rose-600 dark:text-rose-400">
                      Ushbu shtrix-kod bazada mavjud emas. Iltimos avval uni "Mahsulotlar" bo‘limidan katalogga kiriting.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right 5 Cols: Scan History */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>Oxirgi Skanerlashlar Tarixi</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">{scanHistory.length} ta</span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {scanHistory.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 space-y-2">
                <Barcode className="w-8 h-8 text-slate-300 mx-auto" />
                <p>Hozircha hech narsa skanerlanmadi.</p>
                <p className="text-[11px] text-slate-400">Kamera yoki qo‘lda kiritish orqali boshlang</p>
              </div>
            ) : (
              scanHistory.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border text-xs flex items-center justify-between transition ${
                    item.found
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-emerald-500'
                      : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  <div className="overflow-hidden pr-2">
                    <div className="font-semibold truncate">
                      {item.product?.name || 'Noma\'lum kod'}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {item.matched_barcode}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    {item.found && item.product ? (
                      <span className="font-bold font-mono text-emerald-600 text-xs">
                        {item.product.sale_price.toLocaleString()} so‘m
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-rose-500">
                        Topilmadi
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

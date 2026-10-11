import React, { useState } from 'react';
import {
  Clock, Banknote, CreditCard, Smartphone, CheckCircle,
  AlertTriangle, Printer, Lock, Unlock, FileText, X
} from 'lucide-react';
import { CashierShift } from '../types/pos';
import { SupermarketApiService } from '../services/api';

interface Props {
  shifts: CashierShift[];
  onRefreshData: () => void;
}

export const CashierShiftsPage: React.FC<Props> = ({ shifts, onRefreshData }) => {
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [selectedZReport, setSelectedZReport] = useState<CashierShift | null>(null);

  const [openingCashInput, setOpeningCashInput] = useState(500000);
  const [closingCashInput, setClosingCashInput] = useState(0);

  const activeShift = shifts.find(s => !s.is_closed);

  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    SupermarketApiService.openShift(openingCashInput);
    setIsOpenShiftModalOpen(false);
    onRefreshData();
  };

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;

    const closed = SupermarketApiService.closeShift(activeShift.id, closingCashInput);
    setIsCloseShiftModalOpen(false);
    setSelectedZReport(closed);
    onRefreshData();
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Kassa Smenalari & Z-Hisobot (Cashier Shifts)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              FISKAL NAZORAT
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Kassirlar ish smenasi, kassa ochish, pul sanash va kunlik Z-Otchet yopish
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!activeShift ? (
            <button
              onClick={() => setIsOpenShiftModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition"
            >
              <Unlock className="w-4 h-4" />
              <span>Yangi Smena Ochish</span>
            </button>
          ) : (
            <button
              onClick={() => {
                const expected = activeShift.opening_cash + activeShift.cash_sales - activeShift.returns_total;
                setClosingCashInput(expected);
                setIsCloseShiftModalOpen(true);
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition"
            >
              <Lock className="w-4 h-4" />
              <span>Smenani Yopish (Z-Otchet)</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Shift Real-Time Monitor */}
      {activeShift ? (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700/80">
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping"></span>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{activeShift.register_name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-medium">
                    FAOL SMENA
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Kassir: {activeShift.cashier_name} • Ochilgan vaqt: {new Date(activeShift.opened_at).toLocaleTimeString('uz-UZ')}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400">Jami Savdo Tushumi</div>
              <div className="text-2xl font-black text-emerald-400">
                {activeShift.total_revenue.toLocaleString()} UZS
              </div>
            </div>
          </div>

          {/* Breakdown cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60 space-y-1">
              <div className="text-[11px] text-slate-400">Boshlang‘ich Kassa</div>
              <div className="text-base font-bold font-mono text-white">
                {activeShift.opening_cash.toLocaleString()} UZS
              </div>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60 space-y-1">
              <div className="text-[11px] text-slate-400">Naqd Pul Savdosi</div>
              <div className="text-base font-bold font-mono text-emerald-300">
                {activeShift.cash_sales.toLocaleString()} UZS
              </div>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60 space-y-1">
              <div className="text-[11px] text-slate-400">Plastik Karta (Uzcard/Humo)</div>
              <div className="text-base font-bold font-mono text-blue-300">
                {activeShift.card_sales.toLocaleString()} UZS
              </div>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60 space-y-1">
              <div className="text-[11px] text-slate-400">Cheklar Soni</div>
              <div className="text-base font-bold text-amber-300">
                {activeShift.total_sales_count} ta savdo
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-3">
          <Clock className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Hozirda kassa smenasi ochilmagan</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Savdoni boshlash uchun boshlang‘ich naqd pul qoldig‘ini kiritib yangi smenani oching.
          </p>
          <button
            onClick={() => setIsOpenShiftModalOpen(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2"
          >
            <Unlock className="w-4 h-4" />
            <span>Smena Ochish</span>
          </button>
        </div>
      )}

      {/* Shifts History Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Yopilgan Smenalar & Z-Hisobotlar Tarixi
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <tr>
                <th className="p-3">Smena / Z-Otchet №</th>
                <th className="p-3">Kassa & Kassir</th>
                <th className="p-3">Ochilgan / Yopilgan</th>
                <th className="p-3 text-right">Jami Tushum</th>
                <th className="p-3 text-right">Naqd Pul</th>
                <th className="p-3 text-right">Karta</th>
                <th className="p-3 text-right">Kassa Tafovuti</th>
                <th className="p-3 text-center">Z-Chek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {shifts.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                    {s.z_report_number || s.id}
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-900 dark:text-white">{s.cashier_name}</div>
                    <div className="text-[10px] text-slate-400">{s.register_name}</div>
                  </td>
                  <td className="p-3 text-[11px] text-slate-500">
                    <div>Ochildi: {new Date(s.opened_at).toLocaleTimeString('uz-UZ')}</div>
                    {s.closed_at && <div>Yopildi: {new Date(s.closed_at).toLocaleTimeString('uz-UZ')}</div>}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {s.total_revenue.toLocaleString()} UZS
                  </td>
                  <td className="p-3 text-right font-mono">
                    {s.cash_sales.toLocaleString()} UZS
                  </td>
                  <td className="p-3 text-right font-mono">
                    {s.card_sales.toLocaleString()} UZS
                  </td>
                  <td className="p-3 text-right font-mono">
                    {s.cash_discrepancy !== undefined ? (
                      s.cash_discrepancy === 0 ? (
                        <span className="text-emerald-600 font-bold">0 UZS (Aniq)</span>
                      ) : s.cash_discrepancy < 0 ? (
                        <span className="text-rose-600 font-bold">{s.cash_discrepancy.toLocaleString()} UZS (Kamomad)</span>
                      ) : (
                        <span className="text-amber-600 font-bold">+{s.cash_discrepancy.toLocaleString()} UZS (Ortiqcha)</span>
                      )
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => setSelectedZReport(s)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition"
                      title="Z-Reportni ko‘rish"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open Shift Modal */}
      {isOpenShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Unlock className="w-5 h-5 text-emerald-600" />
              <span>Yangi Kassa Smenasini Ochish</span>
            </h3>

            <form onSubmit={handleOpenShift} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Boshlang‘ich naqd pul (Qoldiq fund):
                </label>
                <input
                  type="number"
                  value={openingCashInput}
                  onChange={(e) => setOpeningCashInput(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-mono text-sm font-bold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpenShiftModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Bekor Qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                >
                  Ochish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {isCloseShiftModalOpen && activeShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-rose-600" />
              <span>Smenani Yopish va Z-Hisobot Chiqarish</span>
            </h3>

            <form onSubmit={handleCloseShift} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Kassada kutilayotgan naqd pul:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {(activeShift.opening_cash + activeShift.cash_sales - activeShift.returns_total).toLocaleString()} UZS
                  </span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Haqiqatda sanab olingan naqd pul:
                </label>
                <input
                  type="number"
                  value={closingCashInput}
                  onChange={(e) => setClosingCashInput(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-mono text-sm font-bold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCloseShiftModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Bekor Qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold"
                >
                  Z-Otchet Chiqarish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Z-Report Modal */}
      {selectedZReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-dashed border-slate-300">
              <h3 className="font-black text-sm uppercase">FISKAL Z-HISOBOT</h3>
              <button onClick={() => setSelectedZReport(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-1 text-center">
              <div className="font-bold">“O‘Z DO‘KONIM” SUPERMARKET</div>
              <div className="text-[10px] text-slate-500">Z-Otchet №: {selectedZReport.z_report_number || 'Z-20261009-001'}</div>
              <div className="text-[10px] text-slate-500">Sana: {new Date().toLocaleString('uz-UZ')}</div>
            </div>

            <div className="py-2 border-y border-dashed border-slate-300 space-y-1">
              <div className="flex justify-between">
                <span>Kassa / Kassir:</span>
                <span>{selectedZReport.register_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Savdolar soni:</span>
                <span>{selectedZReport.total_sales_count} ta</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-1">
                <span>JAMI TUSHUM:</span>
                <span>{selectedZReport.total_revenue.toLocaleString()} UZS</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Naqd pul savdo:</span>
                <span>{selectedZReport.cash_sales.toLocaleString()} UZS</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Karta (Uzcard/Humo):</span>
                <span>{selectedZReport.card_sales.toLocaleString()} UZS</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Online (Click/Payme):</span>
                <span>{selectedZReport.online_sales.toLocaleString()} UZS</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Chop Etish</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

import React from 'react';
import { Printer, CheckCircle, X, QrCode } from 'lucide-react';
import { SaleTransaction } from '../types/pos';

interface Props {
  sale: SaleTransaction | null;
  isOpen: boolean;
  onClose: () => void;
  onNewSale?: () => void;
}

export const ReceiptModal: React.FC<Props> = ({ sale, isOpen, onClose, onNewSale }) => {
  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-8">

        {/* Top Actions */}
        <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>To‘lov Muvaffaqiyatli Amalga Oshirildi!</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal Receipt Paper */}
        <div id="thermal-receipt" className="p-6 font-mono text-xs text-slate-800 bg-white">

          {/* Header */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
            <h1 className="text-base font-black tracking-wider text-slate-900">“O‘Z DO‘KONIM” SMART POS</h1>
            <p className="text-[10px] text-slate-500">Toshkent sh., Chilonzor tumani, 9-mavze</p>
            <p className="text-[10px] text-slate-500">STIR: 309 845 120 | Tel: +998 71 200 00 00</p>
            <div className="pt-2 text-[11px] font-bold">
              <span>FISKAL SAVDO CHEKI</span>
            </div>
          </div>

          {/* Meta Info */}
          <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Chek №:</span>
              <span className="font-bold">{sale.receipt_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Sana & Vaqt:</span>
              <span>{new Date(sale.created_at).toLocaleString('uz-UZ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Kassa / Kassir:</span>
              <span>{sale.register_id} / {sale.cashier_name}</span>
            </div>
            {sale.customer_name && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Mijoz:</span>
                <span>{sale.customer_name} ({sale.customer_phone})</span>
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
              <span>Mahsulot</span>
              <span>Jami</span>
            </div>
            {sale.items.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between font-bold text-slate-900">
                  <span className="truncate max-w-[200px]">{item.product_name}</span>
                  <span>{item.total_price.toLocaleString()} UZS</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>
                    {item.quantity} {item.unit} x {item.unit_price.toLocaleString()} UZS
                    {item.discount_percent > 0 && ` (-${item.discount_percent}%)`}
                  </span>
                  {item.batch_number && (
                    <span className="text-[9px] text-slate-400 font-sans">
                      Partiya: {item.batch_number}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Totals Breakdown */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Oraliq jami (Subtotal):</span>
              <span>{sale.subtotal.toLocaleString()} UZS</span>
            </div>
            {sale.discount_total > 0 && (
              <div className="flex justify-between text-rose-600 font-semibold">
                <span>Chegirma:</span>
                <span>-{sale.discount_total.toLocaleString()} UZS</span>
              </div>
            )}
            {sale.bonus_used > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Bonusdan to‘landi:</span>
                <span>-{sale.bonus_used.toLocaleString()} UZS</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500 text-[10px]">
              <span>Shu jumladan QQS (12%):</span>
              <span>{sale.tax_total.toLocaleString()} UZS</span>
            </div>
            <div className="pt-2 flex justify-between text-base font-black text-slate-900 border-t border-slate-200">
              <span>TO‘LASH UCHUN:</span>
              <span className="text-emerald-700">{sale.grand_total.toLocaleString()} UZS</span>
            </div>
          </div>

          {/* Payment breakdown */}
          <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">To‘lov turi:</span>
              <span className="font-bold uppercase tracking-wider">{sale.payment_method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">To‘langan summa:</span>
              <span>{sale.amount_paid.toLocaleString()} UZS</span>
            </div>
            {sale.change_returned > 0 && (
              <div className="flex justify-between font-bold text-amber-700">
                <span>Qaytim:</span>
                <span>{sale.change_returned.toLocaleString()} UZS</span>
              </div>
            )}
            {sale.bonus_earned > 0 && (
              <div className="flex justify-between font-bold text-emerald-700 pt-1">
                <span>Yig‘ilgan keshbek bonus:</span>
                <span>+{sale.bonus_earned.toLocaleString()} UZS</span>
              </div>
            )}
          </div>

          {/* Fiscal QR & Signature */}
          <div className="pt-4 text-center space-y-2">
            <div className="inline-flex flex-col items-center justify-center p-3 border border-slate-200 rounded-xl bg-slate-50">
              <QrCode className="w-16 h-16 text-slate-800" />
              <span className="text-[9px] text-slate-500 mt-1">Soliq.uz QR tekshirish</span>
            </div>
            <div className="text-[9px] text-slate-400 font-mono">
              Fiskal belgi: {sale.fiscal_sign || 'UZ994182938174'}
            </div>
            <p className="text-[10px] font-bold text-slate-700">Xaridingiz uchun rahmat! Yana kutib qolamiz!</p>
          </div>

        </div>

        {/* Modal Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            <span>Chekni Chop Etish (Print)</span>
          </button>
          {onNewSale && (
            <button
              onClick={() => {
                onClose();
                onNewSale();
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition"
            >
              Yangi Xaridor (F2)
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  FileText, Search, RotateCcw, Eye, Calendar,
  CreditCard, Banknote, Smartphone, CheckCircle, AlertCircle, Printer, X
} from 'lucide-react';
import { SaleTransaction, ReturnRecord, PaymentMethod } from '../types/pos';
import { SupermarketApiService } from '../services/api';
import { ReceiptModal } from '../components/ReceiptModal';

interface Props {
  sales: SaleTransaction[];
  returns: ReturnRecord[];
  onRefreshData: () => void;
}

export const SalesManagementPage: React.FC<Props> = ({ sales, returns, onRefreshData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [selectedSaleForView, setSelectedSaleForView] = useState<SaleTransaction | null>(null);

  // Return modal state
  const [selectedSaleForReturn, setSelectedSaleForReturn] = useState<SaleTransaction | null>(null);
  const [returnReason, setReturnReason] = useState('Mijoz mahsulotni qaytardi');
  const [restockSwitch, setRestockSwitch] = useState(true);
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});

  const filteredSales = sales.filter(s => {
    const matchesSearch =
      s.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.customer_name && s.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.customer_phone && s.customer_phone.includes(searchTerm)) ||
      s.cashier_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPayment = paymentFilter === 'ALL' || s.payment_method === paymentFilter;
    return matchesSearch && matchesPayment;
  });

  const handleOpenReturnModal = (sale: SaleTransaction) => {
    setSelectedSaleForReturn(sale);
    // Default return quantities to full item quantity
    const initialQty: Record<string, number> = {};
    sale.items.forEach(i => initialQty[i.product_id] = i.quantity);
    setReturnQuantities(initialQty);
  };

  const handleConfirmReturn = () => {
    if (!selectedSaleForReturn) return;

    try {
      const returnedItems = selectedSaleForReturn.items
        .filter(item => (returnQuantities[item.product_id] || 0) > 0)
        .map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: returnQuantities[item.product_id] || 0,
          unit_price: item.unit_price,
          refund_amount: (returnQuantities[item.product_id] || 0) * item.unit_price,
          reason: returnReason,
          restock_to_inventory: restockSwitch
        }));

      if (returnedItems.length === 0) {
        alert("Kamida bitta mahsulot qaytarilishi kerak!");
        return;
      }

      SupermarketApiService.createReturn({
        sale_id: selectedSaleForReturn.id,
        receipt_number: selectedSaleForReturn.receipt_number,
        reason: returnReason,
        returned_items: returnedItems,
        payment_method: selectedSaleForReturn.payment_method
      });

      setSelectedSaleForReturn(null);
      onRefreshData();
      alert("Tovar muvaffaqiyatli qaytarildi va ombor hisobi yangilandi!");
    } catch (e: any) {
      alert(`Xatolik: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Sotuvlar Tarixi & Qaytarish (Sales & Returns)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              POS CHEKLAR
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Barcha kassa savdo cheklari, to‘lov turlari va xaridor tovarini qaytarish boshqaruvi
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Chek raqami, kassir yoki mijoz telefon raqami..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap">To‘lov turi:</span>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="ALL">Barchasi</option>
            <option value="CASH">Naqd Pul</option>
            <option value="UZCARD">Uzcard</option>
            <option value="HUMO">Humo</option>
            <option value="CLICK">Click</option>
            <option value="PAYME">Payme</option>
          </select>
        </div>
      </div>

      {/* Sales Transactions Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <tr>
                <th className="p-3">Chek №</th>
                <th className="p-3">Sana & Vaqt</th>
                <th className="p-3">Kassir & Kassa</th>
                <th className="p-3">Mijoz</th>
                <th className="p-3">Mahsulotlar</th>
                <th className="p-3">To‘lov Usuli</th>
                <th className="p-3 text-right">Summa (UZS)</th>
                <th className="p-3">Holat</th>
                <th className="p-3 text-center">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                    {sale.receipt_number}
                  </td>
                  <td className="p-3 text-slate-500 whitespace-nowrap">
                    {new Date(sale.created_at).toLocaleString('uz-UZ')}
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-900 dark:text-white">{sale.cashier_name}</div>
                    <div className="text-[10px] text-slate-400">{sale.register_id}</div>
                  </td>
                  <td className="p-3">
                    {sale.customer_name ? (
                      <div>
                        <div className="font-semibold text-emerald-600 dark:text-emerald-400">{sale.customer_name}</div>
                        <div className="text-[10px] text-slate-400">{sale.customer_phone}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Oddiy xaridor</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                      {sale.items.length} ta pozitsiya
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                      {sale.items.map(i => i.product_name).join(', ')}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {sale.payment_method}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                    {sale.grand_total.toLocaleString()} UZS
                  </td>
                  <td className="p-3">
                    {sale.status === 'COMPLETED' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        To‘langan
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                        Qaytarilgan
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedSaleForView(sale)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition"
                        title="Chekni ko‘rish & chop etish"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {sale.status === 'COMPLETED' && (
                        <button
                          onClick={() => handleOpenReturnModal(sale)}
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-rose-600 transition"
                          title="Tovarni qaytarib olish"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Modal */}
      {selectedSaleForReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-rose-500" />
                  <span>Xaridor Tovarini Qaytarish (Refund)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Chek: {selectedSaleForReturn.receipt_number}
                </p>
              </div>
              <button
                onClick={() => setSelectedSaleForReturn(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items checklist */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Qaytariladigan mahsulotlar va miqdori:
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedSaleForReturn.items.map(item => (
                  <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{item.product_name}</div>
                      <div className="text-[10px] text-slate-400">
                        Chekdagi miqdor: {item.quantity} {item.unit} x {item.unit_price.toLocaleString()} UZS
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Qaytarish:</span>
                      <input
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={returnQuantities[item.product_id] || 0}
                        onChange={(e) => setReturnQuantities({
                          ...returnQuantities,
                          [item.product_id]: Math.min(item.quantity, Math.max(0, Number(e.target.value)))
                        })}
                        className="w-16 px-2 py-1 text-center font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Restock switch */}
            <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs">
              <div>
                <div className="font-semibold text-emerald-900 dark:text-emerald-200">
                  Omborga qayta kirim qilinsinmi?
                </div>
                <div className="text-[10px] text-emerald-700 dark:text-emerald-400">
                  Ha - qoldiq ko‘payadi. Yo‘q - brak/yaroqsiz deb hisobdan chiqariladi.
                </div>
              </div>
              <input
                type="checkbox"
                checked={restockSwitch}
                onChange={(e) => setRestockSwitch(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
            </div>

            {/* Return Reason */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Qaytarish sababi:
              </label>
              <input
                type="text"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Sababni yozing..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedSaleForReturn(null)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
              >
                Bekor Qilish
              </button>
              <button
                onClick={handleConfirmReturn}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 transition"
              >
                Qaytarishni Tasdiqlash
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedSaleForView}
        sale={selectedSaleForView}
        onClose={() => setSelectedSaleForView(null)}
      />

    </div>
  );
};

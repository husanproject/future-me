import React, { useState } from 'react';
import {
  BarChart3, TrendingUp, DollarSign, ShoppingBag,
  Calendar, Download, ArrowUpRight, CreditCard, Banknote, Smartphone, PieChart
} from 'lucide-react';
import { SaleTransaction } from '../types/pos';
import { Product } from '../types/product';

interface Props {
  sales: SaleTransaction[];
  products: Product[];
}

export const ReportsPage: React.FC<Props> = ({ sales, products }) => {
  const [timeRange, setTimeRange] = useState<'TODAY' | 'WEEK' | 'MONTH'>('TODAY');

  const totalRevenue = sales.reduce((sum, s) => sum + s.grand_total, 0);
  const totalDiscountGiven = sales.reduce((sum, s) => sum + s.discount_total, 0);
  const totalTax = sales.reduce((sum, s) => sum + s.tax_total, 0);
  const avgBasket = sales.length > 0 ? Math.round(totalRevenue / sales.length) : 0;

  // Breakdown by payment
  const cashTotal = sales.filter(s => s.payment_method === 'CASH').reduce((sum, s) => sum + s.grand_total, 0);
  const cardTotal = sales.filter(s => s.payment_method === 'UZCARD' || s.payment_method === 'HUMO').reduce((sum, s) => sum + s.grand_total, 0);
  const onlineTotal = sales.filter(s => s.payment_method === 'CLICK' || s.payment_method === 'PAYME').reduce((sum, s) => sum + s.grand_total, 0);

  // Top products sales volume
  const productSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  for (const s of sales) {
    for (const item of s.items) {
      if (!productSalesMap[item.product_id]) {
        productSalesMap[item.product_id] = { name: item.product_name, qty: 0, revenue: 0 };
      }
      productSalesMap[item.product_id].qty += item.quantity;
      productSalesMap[item.product_id].revenue += item.total_price;
    }
  }

  const topProducts = Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue);

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "Chek No,Sana,Kassir,Summa,Tolash_Turi\n" +
      sales.map(s => `"${s.receipt_number}","${s.created_at}","${s.cashier_name}",${s.grand_total},"${s.payment_method}"`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hisobot_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Moliyaviy Hisobotlar & Tahlil (Analytics & Reports)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              AUDIT & KPI
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Kunlik va oylik tushum, marja, to‘lov turlari taqsimoti va top sotilgan tovarlar
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>Excel / CSV Yuklab Olish</span>
          </button>
        </div>
      </div>

      {/* Main KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Jami Savdo Tushumi</span>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {totalRevenue.toLocaleString()} UZS
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>+14.5% o‘tgan kunga nisbatan</span>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">O‘rtacha Chek Qiymati</span>
            <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-xl">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {avgBasket.toLocaleString()} UZS
          </div>
          <div className="text-[10px] text-slate-400">
            {sales.length} ta xarid cheki bo‘yicha
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Berilgan Chegirmalar</span>
            <div className="p-2 bg-rose-100 dark:bg-rose-950 text-rose-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono">
            -{totalDiscountGiven.toLocaleString()} UZS
          </div>
          <div className="text-[10px] text-slate-400">
            Aksiyalar & Bonuslar orqali
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Hisoblangan QQS (12%)</span>
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 rounded-xl">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-600 font-mono">
            {totalTax.toLocaleString()} UZS
          </div>
          <div className="text-[10px] text-slate-400">
            O‘zR Davlat soliq hisobi
          </div>
        </div>
      </div>

      {/* Split: Payment Methods Breakdown (Left) & Top Selling Items (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Payment Methods Breakdown */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-600" />
            <span>To‘lov Usullari Taqsimoti</span>
          </h3>

          <div className="space-y-3 pt-2">
            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Naqd Pul (Cash)</div>
                  <div className="text-[10px] text-slate-400">
                    {totalRevenue > 0 ? Math.round((cashTotal / totalRevenue) * 100) : 0}% ulush
                  </div>
                </div>
              </div>
              <div className="text-right font-mono font-bold text-slate-900 dark:text-white text-sm">
                {cashTotal.toLocaleString()} UZS
              </div>
            </div>

            <div className="p-4 bg-blue-50/50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-800/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Uzcard & Humo (Karta)</div>
                  <div className="text-[10px] text-slate-400">
                    {totalRevenue > 0 ? Math.round((cardTotal / totalRevenue) * 100) : 0}% ulush
                  </div>
                </div>
              </div>
              <div className="text-right font-mono font-bold text-slate-900 dark:text-white text-sm">
                {cardTotal.toLocaleString()} UZS
              </div>
            </div>

            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Click / Payme (Online)</div>
                  <div className="text-[10px] text-slate-400">
                    {totalRevenue > 0 ? Math.round((onlineTotal / totalRevenue) * 100) : 0}% ulush
                  </div>
                </div>
              </div>
              <div className="text-right font-mono font-bold text-slate-900 dark:text-white text-sm">
                {onlineTotal.toLocaleString()} UZS
              </div>
            </div>
          </div>
        </div>

        {/* Top 10 Bestselling Products */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <span>Eng Ko‘p Sotilgan Mahsulotlar (Top Bestsellers)</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <tr>
                  <th className="p-2.5">#</th>
                  <th className="p-2.5">Mahsulot Nomi</th>
                  <th className="p-2.5 text-center">Sotilgan Miqdor</th>
                  <th className="p-2.5 text-right">Keltirgan Tushum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {topProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="p-2.5 font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-2.5 font-semibold text-slate-900 dark:text-white">{p.name}</td>
                    <td className="p-2.5 text-center font-mono font-bold text-emerald-600">{p.qty} dona</td>
                    <td className="p-2.5 text-right font-mono font-bold">{p.revenue.toLocaleString()} UZS</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};

import React, { useState } from 'react';
import {
  Users, Search, UserPlus, Award, Phone, CreditCard,
  Coins, TrendingUp, Edit2, Check, X
} from 'lucide-react';
import { Customer } from '../types/pos';
import { SupermarketApiService } from '../services/api';

interface Props {
  customers: Customer[];
  onRefreshData: () => void;
}

export const CustomersPage: React.FC<Props> = ({ customers, onRefreshData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // New customer form state
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '+998 ',
    card_number: '',
    discount_tier_percent: 2,
    bonus_balance: 0,
    notes: ''
  });

  const filteredCustomers = customers.filter(c =>
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    (c.card_number && c.card_number.includes(searchTerm))
  );

  const totalBonuses = customers.reduce((sum, c) => sum + c.bonus_balance, 0);
  const totalRevenueFromCustomers = customers.reduce((sum, c) => sum + c.total_spent, 0);

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.phone.trim()) {
      alert("Ism va telefon raqami to‘ldirilishi shart!");
      return;
    }

    SupermarketApiService.createCustomer({
      full_name: formData.full_name,
      phone: formData.phone,
      card_number: formData.card_number || undefined,
      discount_tier_percent: Number(formData.discount_tier_percent),
      bonus_balance: Number(formData.bonus_balance),
      notes: formData.notes
    });

    setIsCreateModalOpen(false);
    setFormData({
      full_name: '',
      phone: '+998 ',
      card_number: '',
      discount_tier_percent: 2,
      bonus_balance: 0,
      notes: ''
    });
    onRefreshData();
  };

  const handleUpdateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    SupermarketApiService.updateCustomer(editingCustomer.id, {
      full_name: editingCustomer.full_name,
      phone: editingCustomer.phone,
      bonus_balance: editingCustomer.bonus_balance,
      discount_tier_percent: editingCustomer.discount_tier_percent,
      notes: editingCustomer.notes
    });

    setEditingCustomer(null);
    onRefreshData();
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Mijozlar & Sodiqlik Dasturi (Loyalty / Bonus)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              KESHBEK & BALLAR
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Supermarket doimiy xaridorlari, jamg‘arib boriladigan bonuslar va chegirma darajalari
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Yangi Mijoz Qo‘shish</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Jami A‘zo Mijozlar</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{customers.length} nafar</div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded-xl">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Mijozlardagi Jami Bonuslar</div>
            <div className="text-xl font-bold text-amber-600">{totalBonuses.toLocaleString()} UZS</div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Sodiq Mijozlar Savdosi</div>
            <div className="text-xl font-bold text-indigo-600">{totalRevenueFromCustomers.toLocaleString()} UZS</div>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Mijoz ismi, telefon raqami yoki karta raqami..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <tr>
                <th className="p-3">Mijoz Ism-Sharifi</th>
                <th className="p-3">Telefon Raqami</th>
                <th className="p-3">Sodiqlik Kartasi</th>
                <th className="p-3">Chegirma / Daraja</th>
                <th className="p-3 text-right">Mavjud Bonus</th>
                <th className="p-3 text-right">Jami Xaridlar</th>
                <th className="p-3 text-center">Xaridlar Soni</th>
                <th className="p-3 text-center">Tahrir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                  <td className="p-3 font-semibold text-slate-900 dark:text-white">
                    {cust.full_name}
                  </td>
                  <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                    {cust.phone}
                  </td>
                  <td className="p-3 font-mono text-slate-500">
                    {cust.card_number || '—'}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                      {cust.discount_tier_percent}% Chegirma
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                    {cust.bonus_balance.toLocaleString()} UZS
                  </td>
                  <td className="p-3 text-right font-mono font-medium text-slate-900 dark:text-white">
                    {cust.total_spent.toLocaleString()} UZS
                  </td>
                  <td className="p-3 text-center font-bold">
                    {cust.orders_count} marta
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => setEditingCustomer(cust)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-emerald-600 transition"
                      title="Mijozni tahrirlash"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <span>Yangi Sodiqlik Mijozini Ro‘yxatdan O‘tkazish</span>
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Mijoz Ism-Familiyasi *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Masalan: Sardor Ergashev"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Telefon Raqami *</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+998 90 123 45 67"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Chegirma Darajasi (%)</label>
                  <select
                    value={formData.discount_tier_percent}
                    onChange={(e) => setFormData({ ...formData, discount_tier_percent: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  >
                    <option value="1">1% Boshlang‘ich</option>
                    <option value="2">2% Standart</option>
                    <option value="3">3% Kumush</option>
                    <option value="5">5% Oltin / VIP</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Boshlang‘ich Bonus</label>
                  <input
                    type="number"
                    value={formData.bonus_balance}
                    onChange={(e) => setFormData({ ...formData, bonus_balance: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Izoh</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Doimiy xaridor haqida eslatma..."
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl text-xs font-semibold"
                >
                  Bekor Qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Mijoz Ma‘lumotlarini Tahrirlash
              </h3>
              <button onClick={() => setEditingCustomer(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Mijoz Ismi</label>
                <input
                  type="text"
                  value={editingCustomer.full_name}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, full_name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Bonus Balansi (UZS)</label>
                <input
                  type="number"
                  value={editingCustomer.bonus_balance}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, bonus_balance: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Chegirma Foizi (%)</label>
                <input
                  type="number"
                  value={editingCustomer.discount_tier_percent}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, discount_tier_percent: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-mono"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl text-xs font-semibold"
                >
                  Bekor Qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30"
                >
                  O‘zgarishlarni Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

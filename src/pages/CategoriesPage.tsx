import React, { useState } from 'react';
import { Layers, Plus, Package, Folder, Tag, X } from 'lucide-react';
import { Category } from '../types/product';
import { SupermarketApiService } from '../services/api';

interface Props {
  categories: Category[];
  onRefresh: () => void;
}

export const CategoriesPage: React.FC<Props> = ({ categories, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      SupermarketApiService.createCategory({
        name: name.trim(),
        description: description.trim() || undefined
      });
      onRefresh();
      setIsModalOpen(false);
      setName('');
      setDescription('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Mahsulot Toifalari & Kategoriyalar</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Ierarxik
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Supermarket bo‘limlari va tovar toifalari katalogi
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Kategoriya Qo‘shish</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c) => (
          <div
            key={c.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-500/50 transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-2xl">
                <Folder className="w-6 h-6" />
              </div>
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                {c.product_count || 0} tovar
              </span>
            </div>

            <div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white">
                {c.name}
              </h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {c.description || 'Qo‘shimcha tavsif kiritilmagan'}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-mono">ID: {c.id}</span>
              <span>Faol</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Yangi Kategoriya Qo‘shish</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              {error && (
                <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl">{error}</div>
              )}
              <div>
                <label className="block font-medium mb-1">Toifa nomi *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masalan: Uy-ro‘zg‘or buyumlari"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Tavsif</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Kategoriya haqida qisqacha ma'lumot"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

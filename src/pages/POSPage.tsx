import React, { useState, useEffect, useRef } from 'react';
import {
  Barcode, ShoppingCart, Trash2, Plus, Minus, CreditCard,
  Banknote, Smartphone, UserCheck, Tag, Search, AlertTriangle,
  RotateCcw, PauseCircle, PlayCircle, Check, Printer, Clock, ShieldAlert, Sparkles,
  Camera, Keyboard
} from 'lucide-react';
import { Product, Category } from '../types/product';
import { Customer, CartItem, PaymentMethod, SaleTransaction, CashierShift } from '../types/pos';
import { SupermarketApiService } from '../services/api';
import { ReceiptModal } from '../components/ReceiptModal';
import { CameraBarcodeScannerModal } from '../components/CameraBarcodeScannerModal';
import { ManualBarcodeNumpadModal } from '../components/ManualBarcodeNumpadModal';

interface Props {
  products: Product[];
  categories: Category[];
  onSaleCompleted?: () => void;
  onNavigateToBatches?: () => void;
}

export const POSPage: React.FC<Props> = ({
  products,
  categories,
  onSaleCompleted,
  onNavigateToBatches
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Customer & Loyalty
  const [customerPhoneInput, setCustomerPhoneInput] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [bonusToUse, setBonusToUse] = useState<number>(0);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashTendered, setCashTendered] = useState<number>(0);

  // Completed Receipt Modal State
  const [completedSale, setCompletedSale] = useState<SaleTransaction | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Camera & Manual Barcode Scanner Modals
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Parked / Held Carts
  const [parkedCarts, setParkedCarts] = useState<{ id: string; timestamp: string; items: CartItem[]; customer: Customer | null }[]>([]);

  // Active shift
  const [activeShift, setActiveShift] = useState<CashierShift | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setActiveShift(SupermarketApiService.getActiveShift());
    // Auto-focus barcode input for instant scanning
    barcodeInputRef.current?.focus();
  }, []);

  // USB Barcode Scanner hardware listener (Enter key triggers)
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    lookupAndAddToCart(barcodeInput.trim());
    setBarcodeInput('');
  };

  const lookupAndAddToCart = (code: string) => {
    // Lookup by barcode or sku
    const product = products.find(p => p.barcode === code || p.sku.toLowerCase() === code.toLowerCase());
    if (!product) {
      alert(`Shtrix-kod topilmadi: ${code}. Iltimos, mahsulot katalogini tekshiring.`);
      return;
    }

    addProductToCart(product);
  };

  const addProductToCart = (product: Product, qtyToAdd = 1) => {
    // Find FEFO optimal batch
    const optimalBatch = SupermarketApiService.getOptimalBatchForSale(product.id);

    // Check if expired
    const isExpired = optimalBatch ? (optimalBatch.days_to_expiry <= 0 || optimalBatch.status === 'EXPIRED') : false;

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.product_id === product.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        const newQty = updated[existingIndex].quantity + qtyToAdd;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty
        };
        return updated;
      } else {
        const newItem: CartItem = {
          id: `ci-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          product_id: product.id,
          product_name: product.name,
          barcode: product.barcode,
          unit: product.unit,
          sale_price: product.sale_price,
          discount_percent: 0,
          quantity: qtyToAdd,
          tax_rate: product.tax_rate,
          batch_id: optimalBatch?.id,
          batch_number: optimalBatch?.batch_number,
          batch_expiry_date: optimalBatch?.expiry_date,
          days_to_expiry: optimalBatch?.days_to_expiry,
          is_expired: isExpired
        };
        return [newItem, ...prevCart];
      }
    });

    barcodeInputRef.current?.focus();
  };

  const updateItemQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart(prev => prev.map(item => item.id === cartItemId ? { ...item, quantity: newQty } : item));
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setBonusToUse(0);
    setPromoCode('');
    setPromoDiscount(0);
    setPromoMessage(null);
  };

  // Park (Hold) Cart
  const handleParkCart = () => {
    if (cart.length === 0) return;
    const parked = {
      id: `park-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('uz-UZ'),
      items: [...cart],
      customer: selectedCustomer
    };
    setParkedCarts(prev => [parked, ...prev]);
    clearCart();
  };

  const handleResumeParkedCart = (parkedId: string) => {
    const found = parkedCarts.find(p => p.id === parkedId);
    if (!found) return;
    setCart(found.items);
    setSelectedCustomer(found.customer);
    setParkedCarts(prev => prev.filter(p => p.id !== parkedId));
  };

  // Customer Loyalty Lookup
  const handleLookupCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerPhoneInput.trim()) return;

    const cust = SupermarketApiService.getCustomerByPhone(customerPhoneInput.trim());
    if (cust) {
      setSelectedCustomer(cust);
      setCustomerPhoneInput('');
    } else {
      alert("Bu raqam bilan ro‘yxatdan o‘tgan mijoz topilmadi. Mijozlar bo‘limida yangi mijoz qo‘shishingiz mumkin.");
    }
  };

  // Promo Code Apply
  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;

    const result = SupermarketApiService.validatePromoCode(promoCode.trim(), subtotal);
    if (result.valid) {
      setPromoDiscount(result.discount);
      setPromoMessage(result.message);
    } else {
      setPromoDiscount(0);
      setPromoMessage(result.message);
    }
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.sale_price * item.quantity), 0);
  const itemsDiscount = cart.reduce((sum, item) => sum + (item.sale_price * item.quantity * (item.discount_percent / 100)), 0);
  const totalDiscount = itemsDiscount + promoDiscount;
  const effectiveBonus = Math.min(bonusToUse, selectedCustomer?.bonus_balance || 0, subtotal - totalDiscount);
  const grandTotal = Math.max(0, subtotal - totalDiscount - effectiveBonus);

  // Open Checkout
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;

    // Check if any cart item has expired batch
    const expiredItems = cart.filter(i => i.is_expired);
    if (expiredItems.length > 0) {
      const confirmSale = window.confirm(
        `DIQQAT! Savatchada yaroqlilik muddati tugagan mahsulot(lar) bor:\n` +
        expiredItems.map(i => `• ${i.product_name} (${i.batch_number})`).join('\n') +
        `\n\nAdministrator roziligisiz muddati o‘tgan mahsulotni sotish taqiqlanadi. Baribir davom etmoqchimisiz?`
      );
      if (!confirmSale) return;
    }

    setCashTendered(grandTotal);
    setIsPaymentModalOpen(true);
  };

  // Complete Payment and print receipt
  const handleConfirmPayment = () => {
    try {
      const sale = SupermarketApiService.createSale({
        items: cart.map(i => ({
          product_id: i.product_id,
          product_name: i.product_name,
          barcode: i.barcode,
          quantity: i.quantity,
          unit: i.unit,
          unit_price: i.sale_price,
          discount_percent: i.discount_percent,
          batch_id: i.batch_id,
          batch_number: i.batch_number
        })),
        payment_method: selectedPaymentMethod,
        amount_paid: selectedPaymentMethod === 'CASH' ? cashTendered : grandTotal,
        customer_id: selectedCustomer?.id,
        bonus_to_use: effectiveBonus,
        discount_promo_total: promoDiscount,
        notes: `POS Terminal Savdosi`
      });

      setIsPaymentModalOpen(false);
      setCompletedSale(sale);
      setIsReceiptModalOpen(true);
      clearCart();
      if (onSaleCompleted) onSaleCompleted();
    } catch (err: any) {
      alert(`Xatolik: ${err.message || 'Savdoni amalga oshirib bo‘lmadi'}`);
    }
  };

  // Filter products by category and search
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'ALL' || p.category_id === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.barcode.includes(searchQuery) ||
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="h-full flex flex-col space-y-4">

      {/* Top Banner & Quick Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">

        {/* Barcode scanner controls & input */}
        <div className="flex-1 max-w-2xl w-full flex items-center gap-2">
          {/* Camera Scanner Button */}
          <button
            type="button"
            onClick={() => setIsCameraModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 whitespace-nowrap active:scale-95 transition"
            title="Kamera orqali shtrix-kodni skanerlash"
          >
            <Camera className="w-4 h-4" />
            <span>Kamera Skaner</span>
          </button>

          {/* Touch NumPad / Manual Entry Button */}
          <button
            type="button"
            onClick={() => setIsManualModalOpen(true)}
            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap active:scale-95 transition"
            title="Sensor ekranda raqamlar orqali qo‘lda kiritish"
          >
            <Keyboard className="w-4 h-4" />
            <span className="hidden sm:inline">Qo‘lda / NumPad</span>
            <span className="sm:hidden">NumPad</span>
          </button>

          {/* Barcode input field */}
          <form onSubmit={handleBarcodeSubmit} className="flex-1 relative">
            <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Shtrix-kodni yozing (Enter)..."
              className="w-full pl-9 pr-16 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              className="absolute right-1 top-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              Kiritish
            </button>
          </form>
        </div>

        {/* Shift status & Parked carts */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {parkedCarts.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                <PauseCircle className="w-4 h-4" />
                <span>Kutishda ({parkedCarts.length}):</span>
              </span>
              {parkedCarts.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleResumeParkedCart(p.id)}
                  className="px-2.5 py-1 text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg font-medium flex items-center gap-1 transition"
                  title="Savatchani qayta tiklash"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>{p.timestamp} ({p.items.length})</span>
                </button>
              ))}
            </div>
          )}

          <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {activeShift ? activeShift.register_name : 'Kassa №1'}
            </span>
          </div>
        </div>

      </div>

      {/* Main Split: Left Product Picker (60%), Right Cart & Payment (40%) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[580px]">

        {/* Left: Product Catalog Grid (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">

          {/* Categories Horizontal Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Barcha Tovarlar
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Mahsulot nomi yoki shtrix-kod bo‘yicha tez qidirish..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Product Cards Grid */}
          <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[500px] p-1">
            {filteredProducts.map(p => {
              const inStock = p.current_stock > 0;
              return (
                <button
                  key={p.id}
                  onClick={() => addProductToCart(p)}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between group relative overflow-hidden ${
                    inStock
                      ? 'border-slate-200 dark:border-slate-800 hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 shadow-sm'
                      : 'border-rose-200 dark:border-rose-900/50 bg-rose-50/20 opacity-60'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                      <span>{p.sku}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                        p.current_stock <= 5
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        Qoldiq: {p.current_stock} {p.unit}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-emerald-600 transition">
                      {p.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {p.sale_price.toLocaleString()} UZS
                    </span>
                    <span className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 opacity-0 group-hover:opacity-100 transition">
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Demo Scan Chips */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[11px] text-slate-500 overflow-x-auto">
            <span className="font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
              Test skaner:
            </span>
            {products.slice(0, 4).map(p => (
              <button
                key={p.id}
                onClick={() => addProductToCart(p)}
                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-mono text-[10px] whitespace-nowrap text-slate-700 dark:text-slate-300 transition"
              >
                {p.barcode} ({p.name.split(' ')[0]})
              </button>
            ))}
          </div>

        </div>

        {/* Right: Cart, Customer Loyalty, and Payment (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">

          {/* Cart Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Xaridor Savatchasi ({cart.length})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleParkCart}
                disabled={cart.length === 0}
                className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-40 text-slate-700 dark:text-slate-300 rounded-lg font-medium flex items-center gap-1 transition"
                title="Savatchani kutish rejimiga qo‘yish"
              >
                <PauseCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>Kutish (Hold)</span>
              </button>
              <button
                onClick={clearCart}
                disabled={cart.length === 0}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                title="Savatchani tozalash"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[300px] pr-1">
            {cart.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-slate-400 space-y-2">
                <ShoppingCart className="w-10 h-10 opacity-30" />
                <p className="text-xs">Savatcha bo‘sh. Shtrix-kodni skanerlang yoki tovar tanlang.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-xl border text-xs space-y-1.5 transition ${
                    item.is_expired
                      ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/30 dark:border-rose-800'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      <span>{item.product_name}</span>
                      {item.is_expired && (
                        <span className="ml-2 px-1.5 py-0.2 bg-rose-600 text-white text-[9px] font-bold rounded">
                          EXPIRED!
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-400 hover:text-rose-500 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Batch & FEFO Info */}
                  {item.batch_number && (
                    <div className="text-[10px] text-slate-500 flex items-center gap-2">
                      <span className="font-mono bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[9px]">
                        FEFO: {item.batch_number}
                      </span>
                      <span>
                        Muddat: {item.days_to_expiry} kun ({item.batch_expiry_date})
                      </span>
                    </div>
                  )}

                  {/* Quantity & Line Total */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
                      <button
                        onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-bold text-slate-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {(item.sale_price * item.quantity).toLocaleString()} UZS
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.sale_price.toLocaleString()} UZS / {item.unit}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Customer Loyalty Section */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
            {!selectedCustomer ? (
              <form onSubmit={handleLookupCustomer} className="flex gap-2">
                <input
                  type="text"
                  value={customerPhoneInput}
                  onChange={(e) => setCustomerPhoneInput(e.target.value)}
                  placeholder="Mijoz tel: +998 90 123 45 67..."
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Mijoz</span>
                </button>
              </form>
            ) : (
              <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{selectedCustomer.full_name}</span>
                    <span className="text-[10px] px-1 py-0.2 bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 rounded font-bold">
                      {selectedCustomer.discount_tier_percent}% VIP
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Mavjud bonus: <span className="font-bold">{selectedCustomer.bonus_balance.toLocaleString()} UZS</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedCustomer.bonus_balance > 0 && (
                    <button
                      onClick={() => setBonusToUse(effectiveBonus > 0 ? 0 : Math.min(selectedCustomer.bonus_balance, subtotal))}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition ${
                        effectiveBonus > 0
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-emerald-700 border border-emerald-300'
                      }`}
                    >
                      {effectiveBonus > 0 ? `-${effectiveBonus.toLocaleString()} UZS` : 'Bonusni ishlatish'}
                    </button>
                  )}
                  <button
                    onClick={() => { setSelectedCustomer(null); setBonusToUse(0); }}
                    className="text-slate-400 hover:text-rose-500 text-[10px]"
                  >
                    Bekor
                  </button>
                </div>
              </div>
            )}

            {/* Promo Code Input */}
            <form onSubmit={handleApplyPromo} className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Aksiya / Promo-kod (BARAKA, SUT10)..."
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 uppercase font-mono"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Qo‘llash</span>
              </button>
            </form>
            {promoMessage && (
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium px-1">
                {promoMessage}
              </div>
            )}
          </div>

          {/* Totals Summary */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Oraliq jami:</span>
              <span>{subtotal.toLocaleString()} UZS</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-rose-600 font-semibold">
                <span>Chegirma:</span>
                <span>-{totalDiscount.toLocaleString()} UZS</span>
              </div>
            )}
            {effectiveBonus > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Bonusdan to‘landi:</span>
                <span>-{effectiveBonus.toLocaleString()} UZS</span>
              </div>
            )}
            <div className="pt-2 flex justify-between text-lg font-black text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-800">
              <span>TO‘LASH:</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                {grandTotal.toLocaleString()} UZS
              </span>
            </div>
          </div>

          {/* Pay Button */}
          <button
            onClick={handleOpenCheckout}
            disabled={cart.length === 0}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
          >
            <Banknote className="w-5 h-5" />
            <span>To‘lovga O‘tish ({grandTotal.toLocaleString()} UZS)</span>
          </button>

        </div>

      </div>

      {/* Payment Selection Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6">

            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                To‘lov Turini Tanlang
              </h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Total to pay */}
            <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800">
              <span className="text-xs text-emerald-700 dark:text-emerald-300 uppercase font-bold tracking-wider">
                Yakuniy To‘lov Summasi
              </span>
              <div className="text-3xl font-black text-emerald-800 dark:text-emerald-200 mt-1">
                {grandTotal.toLocaleString()} UZS
              </div>
            </div>

            {/* Method Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setSelectedPaymentMethod('CASH')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-2 font-bold text-xs transition ${
                  selectedPaymentMethod === 'CASH'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-6 h-6 text-emerald-600" />
                <span>Naqd Pul</span>
              </button>

              <button
                onClick={() => setSelectedPaymentMethod('UZCARD')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-2 font-bold text-xs transition ${
                  selectedPaymentMethod === 'UZCARD' || selectedPaymentMethod === 'HUMO'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-6 h-6 text-blue-600" />
                <span>Uzcard / Humo</span>
              </button>

              <button
                onClick={() => setSelectedPaymentMethod('CLICK')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-2 font-bold text-xs transition ${
                  selectedPaymentMethod === 'CLICK' || selectedPaymentMethod === 'PAYME'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-6 h-6 text-indigo-600" />
                <span>Click / Payme</span>
              </button>
            </div>

            {/* Cash Calculator if CASH selected */}
            {selectedPaymentMethod === 'CASH' && (
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    Mijoz bergan naqd pul:
                  </span>
                  <input
                    type="number"
                    value={cashTendered || ''}
                    onChange={(e) => setCashTendered(Number(e.target.value))}
                    className="w-36 text-right font-mono font-bold px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Quick bill buttons */}
                <div className="flex gap-2 justify-end">
                  {[50000, 100000, 200000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setCashTendered(amt)}
                      className="px-2.5 py-1 text-[11px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 rounded-lg font-mono font-medium"
                    >
                      +{amt.toLocaleString()}
                    </button>
                  ))}
                  <button
                    onClick={() => setCashTendered(grandTotal)}
                    className="px-2.5 py-1 text-[11px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded-lg font-bold"
                  >
                    Aniq summa
                  </button>
                </div>

                {/* Change calculation */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-sm">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">Qaytim (Change):</span>
                  <span className="font-mono text-base font-black text-amber-600">
                    {Math.max(0, cashTendered - grandTotal).toLocaleString()} UZS
                  </span>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition"
              >
                Bekor Qilish
              </button>
              <button
                onClick={handleConfirmPayment}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
              >
                <Check className="w-4 h-4" />
                <span>To‘lovni Qabul Qilish & Chek</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Completed Thermal Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        sale={completedSale}
        onClose={() => setIsReceiptModalOpen(false)}
        onNewSale={() => barcodeInputRef.current?.focus()}
      />

      {/* Live Camera Scanner Modal */}
      <CameraBarcodeScannerModal
        isOpen={isCameraModalOpen}
        onClose={() => {
          setIsCameraModalOpen(false);
          barcodeInputRef.current?.focus();
        }}
        onProductScanned={(product) => {
          addProductToCart(product, 1);
        }}
        products={products}
      />

      {/* Manual Touch NumPad Modal */}
      <ManualBarcodeNumpadModal
        isOpen={isManualModalOpen}
        onClose={() => {
          setIsManualModalOpen(false);
          barcodeInputRef.current?.focus();
        }}
        onProductSelected={(product, qty) => {
          addProductToCart(product, qty);
        }}
        products={products}
      />

    </div>
  );
};

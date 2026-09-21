import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    cartSubtotal,
    cartDiscount,
    cartTotal,
    appliedCoupon,
    removeFromCart,
    updateQuantity,
    applyCouponCode,
    removeCoupon,
    currentUser,
    setPendingCheckout,
    setIsAuthModalOpen,
    setIsCheckoutOpen,
    lang,
    t,
  } = useStore();

  const [couponInput, setCouponInput] = useState('');

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const success = applyCouponCode(couponInput);
    if (success) setCouponInput('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div
        className="absolute inset-y-0 right-0 max-w-full flex pl-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base sm:text-lg font-black text-gray-900">{t.cart}</h2>
              <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                {cart.length}
              </span>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-gray-800 mb-1">{t.emptyCart}</h3>
                <p className="text-xs text-gray-400 max-w-xs mb-6">
                  {lang === 'bn'
                    ? 'আপনার পছন্দের ডিজিটাল প্রোডাক্ট ও সাবস্ক্রিপশন কার্টে যোগ করুন।'
                    : 'Add premium digital services to your cart to proceed.'}
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {t.startShopping}
                </button>
              </div>
            ) : (
              cart.map((item) => {
                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex gap-3 items-center"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.titleEn}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 bg-gray-200"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                        {lang === 'bn' ? item.product.titleBn : item.product.titleEn}
                      </h4>
                      <p className="text-[11px] text-emerald-600 font-semibold mb-2">
                        {lang === 'bn' ? item.selectedVariant.nameBn : item.selectedVariant.nameEn}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-gray-200 bg-white rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 hover:bg-gray-100 text-gray-600 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-bold text-gray-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 hover:bg-gray-100 text-gray-600 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-black text-xs sm:text-sm text-gray-900">
                          ৳{item.selectedVariant.salePrice * item.quantity}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Calculations & Checkout Button */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-white space-y-4">
              {/* Coupon Engine */}
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-800">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{appliedCoupon.code}</span>
                    <span className="text-[10px] text-emerald-600 font-normal">
                      (-৳{cartDiscount})
                    </span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-rose-600 hover:underline text-[11px] font-bold cursor-pointer"
                  >
                    ✕ {lang === 'bn' ? 'মুছুন' : 'Remove'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="কুপন দিন (e.g. SHEBA10)"
                    className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl focus:border-emerald-600 outline-hidden uppercase"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    {t.applyCoupon}
                  </button>
                </form>
              )}

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>{t.subtotal}</span>
                  <span className="font-bold text-gray-900">৳{cartSubtotal}</span>
                </div>
                {cartDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>{t.discount}</span>
                    <span>-৳{cartDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-100">
                  <span>{t.total}</span>
                  <span className="text-emerald-700">৳{cartTotal}</span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  if (!currentUser) {
                    setPendingCheckout(true);
                    setIsAuthModalOpen(true);
                  } else {
                    setIsCheckoutOpen(true);
                  }
                }}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>{t.checkout}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1 text-[11px] text-gray-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{lang === 'bn' ? '১০০% নিরাপদ লেনদেন ও গ্যারান্টি' : '100% Secure & Guaranteed'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

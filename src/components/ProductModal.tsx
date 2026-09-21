import React, { useState } from 'react';
import {
  X,
  Star,
  ShieldCheck,
  Zap,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  Clock,
  Key,
  Info,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductVariant } from '../types';

export const ProductModal: React.FC = () => {
  const { activeProductModal, setActiveProductModal, lang, t, addToCart, buyNow } = useStore();

  if (!activeProductModal) return null;

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    activeProductModal.variants[0]
  );
  const [activeTab, setActiveTab] = useState<'desc' | 'instructions'>('desc');

  const discountAmount = selectedVariant.regularPrice - selectedVariant.salePrice;
  const discountPercent = Math.round(
    (discountAmount / selectedVariant.regularPrice) * 100
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div
        className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-gray-100 relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setActiveProductModal(null)}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-gray-100 text-gray-700 flex items-center justify-center shadow-md transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Column: Image and Highlights */}
          <div className="bg-gray-50 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-100">
            <div>
              <div className="relative rounded-2xl overflow-hidden shadow-sm aspect-video mb-4">
                <img
                  src={activeProductModal.image}
                  alt={activeProductModal.titleEn}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  {activeProductModal.badgeEn && (
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white">
                      {lang === 'bn' ? activeProductModal.badgeBn : activeProductModal.badgeEn}
                    </span>
                  )}
                </div>
              </div>

              {/* Trust Badge */}
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {lang === 'bn'
                    ? activeProductModal.warrantyBn
                    : activeProductModal.warrantyEn}
                </span>
              </div>

              <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-100 text-blue-800 text-xs font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  {lang === 'bn'
                    ? 'পেমেন্ট যাচাইয়ের পর ৫-১৫ মিনিটে ডেলিভারি'
                    : 'Instant digital delivery within 5-15 mins'}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200/70 flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1 font-bold text-gray-700">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                {activeProductModal.rating} ({activeProductModal.reviewsCount} {t.reviews})
              </span>
              <span>
                {activeProductModal.totalSold}+ {t.sold}
              </span>
            </div>
          </div>

          {/* Right Column: Title, Variant Selector, Pricing, Tabs */}
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mb-2">
                {lang === 'bn' ? activeProductModal.titleBn : activeProductModal.titleEn}
              </h2>

              <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                {lang === 'bn' ? activeProductModal.shortDescBn : activeProductModal.shortDescEn}
              </p>

              {/* Variants Selector */}
              <div className="mb-5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">
                  {lang === 'bn' ? 'প্যাকেজ / মেয়াদ সিলেক্ট করুন:' : 'Select Package / Duration:'}
                </label>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {activeProductModal.variants.map((v) => {
                    const isSelected = selectedVariant.id === v.id;
                    return (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-gray-900 block">
                              {lang === 'bn' ? v.nameBn : v.nameEn}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {lang === 'bn' ? v.accountTypeBn : v.accountTypeEn}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black text-gray-900 block">
                            ৳{v.salePrice}
                          </span>
                          {v.regularPrice > v.salePrice && (
                            <span className="text-[10px] text-gray-400 line-through">
                              ৳{v.regularPrice}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Price Banner */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 mb-5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 font-medium block">
                    {lang === 'bn' ? 'নির্ধারিত মূল্য' : 'Selected Price'}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-gray-900">
                      ৳{selectedVariant.salePrice}
                    </span>
                    {selectedVariant.regularPrice > selectedVariant.salePrice && (
                      <span className="text-sm text-gray-400 line-through">
                        ৳{selectedVariant.regularPrice}
                      </span>
                    )}
                  </div>
                </div>

                {discountPercent > 0 && (
                  <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-xs">
                    {lang === 'bn' ? `৳${discountAmount} সাশ্রয়` : `Save ৳${discountAmount}`}
                  </span>
                )}
              </div>

              {/* Tabs for Description vs Activation */}
              <div className="border-b border-gray-200 mb-3 flex gap-4 text-xs font-bold">
                <button
                  onClick={() => setActiveTab('desc')}
                  className={`pb-2 transition-colors cursor-pointer ${
                    activeTab === 'desc'
                      ? 'text-emerald-600 border-b-2 border-emerald-600'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  {t.description}
                </button>
                <button
                  onClick={() => setActiveTab('instructions')}
                  className={`pb-2 transition-colors cursor-pointer ${
                    activeTab === 'instructions'
                      ? 'text-emerald-600 border-b-2 border-emerald-600'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  {t.howToActivate}
                </button>
              </div>

              <div className="text-xs text-gray-600 max-h-32 overflow-y-auto mb-6 leading-relaxed whitespace-pre-line bg-gray-50 p-3 rounded-xl">
                {activeTab === 'desc'
                  ? lang === 'bn'
                    ? activeProductModal.fullDescBn
                    : activeProductModal.fullDescEn
                  : lang === 'bn'
                  ? activeProductModal.instructionsBn
                  : activeProductModal.instructionsEn}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => {
                  addToCart(activeProductModal, selectedVariant, 1);
                  setActiveProductModal(null);
                }}
                className="px-4 py-3 rounded-xl border border-gray-200 hover:border-emerald-600 text-gray-800 hover:text-emerald-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer bg-gray-50"
              >
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                <span>{t.addToCart}</span>
              </button>

              <button
                onClick={() => {
                  buyNow(activeProductModal, selectedVariant, 1);
                }}
                className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>{t.buyNow}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

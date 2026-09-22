import React from 'react';
import { ShoppingCart, Zap, Star, ShieldCheck, Check } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { lang, t, setActiveProductModal, addToCart, buyNow } = useStore();

  const lowestPriceVariant = product.variants.reduce((prev, curr) =>
    curr.salePrice < prev.salePrice ? curr : prev
  );

  const discountPercent = Math.round(
    ((lowestPriceVariant.regularPrice - lowestPriceVariant.salePrice) /
      lowestPriceVariant.regularPrice) *
      100
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group hover:-translate-y-1">
      {/* Image Banner */}
      <div
        onClick={() => setActiveProductModal(product)}
        className="relative h-48 overflow-hidden cursor-pointer bg-gray-100"
      >
        <img
          src={product.image}
          alt={product.titleEn}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {product.badgeEn && (
            <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-sm">
              {lang === 'bn' ? product.badgeBn : product.badgeEn}
            </span>
          )}
          {discountPercent > 0 && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500 text-white shadow-sm">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
          <span className="flex items-center gap-1 font-bold bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-md">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{product.rating}</span>
            <span className="text-gray-300">({product.reviewsCount})</span>
          </span>

          <span className="text-[11px] text-gray-200 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-md">
            {product.totalSold}+ {t.sold}
          </span>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3
            onClick={() => setActiveProductModal(product)}
            className="font-bold text-gray-900 text-base sm:text-lg group-hover:text-emerald-600 transition-colors cursor-pointer line-clamp-1 mb-1"
          >
            {lang === 'bn' ? product.titleBn : product.titleEn}
          </h3>

          <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
            {lang === 'bn' ? product.shortDescBn : product.shortDescEn}
          </p>

          {/* Warranty & Guarantee bullet */}
          <div className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md font-medium mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{lang === 'bn' ? product.warrantyBn : product.warrantyEn}</span>
          </div>
        </div>

        {/* Pricing & Actions */}
        <div>
          <div className="flex items-baseline justify-between mb-3 border-t border-gray-50 pt-3">
            <div>
              <span className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">
                {lang === 'bn' ? 'শুরু মাত্র' : 'Starts at'}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-gray-900">
                  ৳{lowestPriceVariant.salePrice}
                </span>
                {lowestPriceVariant.regularPrice > lowestPriceVariant.salePrice && (
                  <span className="text-xs text-gray-400 line-through">
                    ৳{lowestPriceVariant.regularPrice}
                  </span>
                )}
              </div>
            </div>

            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
              {lang === 'bn' ? lowestPriceVariant.durationBn : lowestPriceVariant.durationEn}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => addToCart(product, lowestPriceVariant, 1)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 hover:border-emerald-600 text-gray-700 hover:text-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-gray-50 hover:bg-emerald-50/50"
              title={t.addToCart}
            >
              <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.addToCart}</span>
            </button>

            <button
              onClick={() => buyNow(product, lowestPriceVariant, 1)}
              className="px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all cursor-pointer"
              title={t.buyNow}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>{t.buyNow}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

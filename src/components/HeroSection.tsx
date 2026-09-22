import React from 'react';
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Headphones,
  CreditCard,
  Flame,
  ArrowRight,
  Bot,
  Tv,
  Palette,
  Laptop,
  ShieldAlert,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const HeroSection: React.FC = () => {
  const { lang, t, categories, selectedCategory, setSelectedCategory } = useStore();

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Bot':
        return <Bot className="w-4 h-4" />;
      case 'Tv':
        return <Tv className="w-4 h-4" />;
      case 'Palette':
        return <Palette className="w-4 h-4" />;
      case 'Laptop':
        return <Laptop className="w-4 h-4" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-white to-gray-50/50 pt-6 pb-10 border-b border-gray-100">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-300/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-teal-300/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Main Hero Card */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 rounded-3xl text-white p-6 sm:p-10 md:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
          
          {/* Decorative Elements */}
          <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-emerald-500/15 rounded-full blur-2xl" />
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-2xl" />

          <div className="relative z-10 max-w-3xl">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs sm:text-sm font-semibold mb-4 backdrop-blur-xs">
              <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>
                {lang === 'bn' ? 'বাংলাদেশের বিশ্বস্ত ডিজিটাল সাবস্ক্রিপশন সার্ভিস' : 'Trusted Digital Apps & Subscriptions in Bangladesh'}
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight mb-4">
              {lang === 'bn' ? (
                <>
                  নেটফ্লিক্স, ক্যানভা ও এআই টুলস কিনুন{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
                    বিকাশ ও নগদে
                  </span>
                </>
              ) : (
                <>
                  Buy Netflix, Canva & AI Tools with{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
                    bKash & Nagad
                  </span>
                </>
              )}
            </h1>

            {/* Sub-headline */}
            <p className="text-gray-300 text-sm sm:text-base md:text-lg mb-8 max-w-2xl leading-relaxed">
              {lang === 'bn'
                ? 'আন্তর্জাতিক কার্ড ছাড়াই সরাসরি বিকাশ, নগদ বা রকেটে পেমেন্ট করে ৫-১৫ মিনিটের মধ্যে পেয়ে যান অরিজিনাল লাইসেন্স কি ও প্রিমিয়াম অ্যাকাউন্ট অ্যাক্সেস।'
                : 'No international credit card required. Instant digital activation, 100% replacement warranty, and 24/7 WhatsApp customer care.'}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <a
                href="#products-grid"
                className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm sm:text-base rounded-xl shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>{t.startShopping}</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300 px-3 py-2 bg-white/5 rounded-xl border border-white/10 backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{lang === 'bn' ? 'লাইভ সাপোর্ট চালু আছে' : 'Live WhatsApp Support Available'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Feature Trust Pillars */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3.5 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                {t.verifiedDelivery}
              </h4>
              <p className="text-[11px] text-gray-500 hidden sm:block">
                {lang === 'bn' ? 'স্বয়ংক্রিয় দ্রুত ডেলিভারি' : '5-15 mins delivery'}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3.5 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                {t.warrantyGuarantee}
              </h4>
              <p className="text-[11px] text-gray-500 hidden sm:block">
                {lang === 'bn' ? 'সম্পূর্ণ মেয়াদে রিপ্লেসমেন্ট' : 'Full validity covered'}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3.5 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                {t.safePayment}
              </h4>
              <p className="text-[11px] text-gray-500 hidden sm:block">
                {lang === 'bn' ? 'বিকাশ, নগদ ও রকেট' : 'bKash, Nagad, Rocket'}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3.5 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                {t.support247}
              </h4>
              <p className="text-[11px] text-gray-500 hidden sm:block">
                {lang === 'bn' ? 'সরাসরি চ্যাট সমাধান' : 'Instant live assistance'}
              </p>
            </div>
          </div>
        </div>

        {/* Category Horizontal Filter Pills */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
              {t.allCategories}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-102'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <span className={isSelected ? 'text-white' : 'text-emerald-600'}>
                    {getCategoryIcon(cat.iconName)}
                  </span>
                  <span>{lang === 'bn' ? cat.nameBn : cat.nameEn}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

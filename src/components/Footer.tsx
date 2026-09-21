import React from 'react';
import {
  ShieldCheck,
  Zap,
  Headphones,
  Mail,
  Phone,
  MessageCircle,
  Sparkles,
  Lock,
  ArrowUp,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const Footer: React.FC = () => {
  const {
    lang,
    t,
    siteSettings,
    setIsTrackOrderOpen,
    setSelectedCategory,
    categories,
    loginAsDemo,
    setIsAdminDashboardOpen,
    currentUser,
  } = useStore();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 text-gray-300 border-t border-slate-800 relative">
      {/* Top Value Banner */}
      <div className="border-b border-slate-900 py-8 bg-slate-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white leading-tight mb-1">
                {t.verifiedDelivery}
              </h4>
              <p className="text-xs text-gray-400">
                {lang === 'bn' ? 'অর্ডার যাচাইয়ের ৫-১৫ মিনিটে ডেলিভারি' : '5-15 mins delivery directly'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white leading-tight mb-1">
                {t.warrantyGuarantee}
              </h4>
              <p className="text-xs text-gray-400">
                {lang === 'bn' ? 'সম্পূর্ণ সাবস্ক্রিপশন মেয়াদে ওয়ারেন্টি' : 'Full validity replacement coverage'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white leading-tight mb-1">
                {t.support247}
              </h4>
              <p className="text-xs text-gray-400">
                {lang === 'bn' ? 'যেকোনো সমস্যায় সার্বক্ষণিক সাপোর্ট' : 'Quick help via WhatsApp and email'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-lg">
                DPS
              </div>
              <span className="font-black text-lg text-white tracking-tight">
                {lang === 'bn' ? 'ডিজিটাল প্রোডাক্ট সেবা' : 'Digital Product Sheba'}
              </span>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              {lang === 'bn'
                ? 'বাংলাদেশের শীর্ষস্থানীয় প্রিমিয়াম ডিজিটাল অ্যাপস ও সাবস্ক্রিপশন সেবা। বিকাশ, নগদ ও রকেটে ঝামেলাহীন কেনাকাটার বিশ্বস্ত প্রতিষ্ঠান।'
                : 'Top-rated digital application and subscription marketplace in Bangladesh with local bKash and Nagad payment options.'}
            </p>

            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>SSL Secured & Verified MFS</span>
            </div>
          </div>

          {/* Quick Categories */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-white uppercase tracking-wider">
              {t.allCategories}
            </h5>
            <ul className="space-y-2 text-xs text-gray-400">
              {categories.slice(1).map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      scrollToTop();
                    }}
                    className="hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    {lang === 'bn' ? cat.nameBn : cat.nameEn}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Useful Links */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-white uppercase tracking-wider">
              {lang === 'bn' ? 'প্রয়োজনীয় লিংক' : 'Quick Links'}
            </h5>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <button
                  onClick={() => setIsTrackOrderOpen(true)}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  {t.trackOrder}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    loginAsDemo('admin');
                    setIsAdminDashboardOpen(true);
                  }}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  {t.adminPanel} (Admin Portal)
                </button>
              </li>
              <li>
                <a
                  href={`https://wa.me/${siteSettings.whatsappSupportNumber.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-400 transition-colors"
                >
                  WhatsApp Live Chat
                </a>
              </li>
            </ul>
          </div>

          {/* Supported Payments & Contact */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-white uppercase tracking-wider">
              {lang === 'bn' ? 'পেমেন্ট মেথড ও সাপোর্ট' : 'Payment & Contact'}
            </h5>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-2.5 py-1 bg-rose-950/80 border border-rose-800/40 text-rose-300 font-bold text-[10px] rounded-lg">
                bKash
              </span>
              <span className="px-2.5 py-1 bg-amber-950/80 border border-amber-800/40 text-amber-300 font-bold text-[10px] rounded-lg">
                Nagad
              </span>
              <span className="px-2.5 py-1 bg-purple-950/80 border border-purple-800/40 text-purple-300 font-bold text-[10px] rounded-lg">
                Rocket
              </span>
              <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-gray-300 font-bold text-[10px] rounded-lg">
                Bank Transfer
              </span>
            </div>

            <div className="pt-2 text-xs text-gray-400 space-y-1">
              <p className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>{siteSettings.whatsappSupportNumber}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>{siteSettings.supportEmail}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-slate-900 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-3">
          <p>© 2026 Digital Product Sheba. All rights reserved. Made for Bangladesh.</p>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1 text-gray-400 hover:text-white cursor-pointer transition-colors"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};

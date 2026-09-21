import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { TrackOrderModal } from './components/TrackOrderModal';
import { UserDashboardModal } from './components/UserDashboardModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { RecentPurchaseNotification } from './components/RecentPurchaseNotification';
import { ToastContainer } from './components/ToastContainer';
import {
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  Search,
  CheckCircle2,
  HelpCircle,
  MessageCircle,
  Zap,
  ShieldCheck,
  CreditCard,
  UserCheck,
} from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    products,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    siteSettings,
    lang,
    t,
  } = useStore();

  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(0);

  // Filter products by category and search
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'all' || product.categoryId === selectedCategory;

    const matchesSearch =
      !searchQuery.trim() ||
      product.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.titleBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.shortDescEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.shortDescBn.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aPrice = Math.min(...a.variants.map((v) => v.salePrice));
    const bPrice = Math.min(...b.variants.map((v) => v.salePrice));

    if (sortBy === 'price-asc') return aPrice - bPrice;
    if (sortBy === 'price-desc') return bPrice - aPrice;
    if (sortBy === 'popular') return b.totalSold - a.totalSold;
    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
  });

  const faqs = [
    {
      qEn: 'How do I receive my digital product after paying via bKash/Nagad?',
      qBn: 'বিকাশ বা নগদে পেমেন্ট করার পর আমি কীভাবে ডিজিটাল প্রোডাক্ট বা লগইন পাবো?',
      aEn: 'Once you place the order and provide your bKash/Nagad TrxID, our automated system or admin verifies it within 5-15 minutes. The login credentials, activation key, or invite link are instantly accessible on your Order Confirmation receipt, your User Dashboard, and will also be notified via WhatsApp.',
      aBn: 'অর্ডারের সময় TrxID দেওয়ার পর ৫-১৫ মিনিটের মধ্যে আমাদের টিম যাচাই করে। এরপর সরাসরি অর্ডার রসিদ পেজে এবং আপনার ইউজার ড্যাশবোর্ডে লাইসেন্স কি বা লগইন তথ্য পেয়ে যাবেন। এছাড়াও প্রয়োজনে আপনার হোয়াটসঅ্যাপে পাঠিয়ে দেওয়া হবে।',
    },
    {
      qEn: 'What does the 100% Replacement Warranty cover?',
      qBn: '১০০% রিপ্লেসমেন্ট ওয়ারেন্টির সুবিধা কী?',
      aEn: 'All subscriptions come with full duration replacement coverage. If you ever face any password expiration, account logout, or license issue during the subscribed period, submit a ticket or message us on WhatsApp to receive an immediate replacement or re-activation free of charge.',
      aBn: 'আমাদের প্রতিটি প্রডাক্টে মেয়াদের পুরো সময়জুড়ে ওয়ারেন্টি রয়েছে। কোনো কারণে প্রোফাইল পিন বা লগইন কাজ না করলে সাথে সাথে আমাদের ড্যাশবোর্ড থেকে ক্লেইম বা হোয়াটসঅ্যাপে জানালে ফ্রি রিপ্লেসমেন্ট দেওয়া হবে।',
    },
    {
      qEn: 'Can I use Netflix, Prime Video, and Spotify in Bangladesh without VPN?',
      qBn: 'নেটফ্লিক্স, প্রাইম ভিডিও ও স্পটিফাই বাংলাদেশে ভিপিএন ছাড়া চলবে?',
      aEn: 'Yes! All accounts and subscriptions sold on Digital Product Sheba are 100% compatible with Bangladesh IP addresses on Smart TV, mobile phones, laptops, and tablets without requiring any VPN.',
      aBn: 'হ্যাঁ, সম্পূর্ণ ভিপিএন ছাড়া সরাসরি বাংলাদেশের যেকোনো ইন্টারনেট লাইন ও স্মার্ট টিভি, ফোন এবং ল্যাপটপে স্বাচ্ছন্দে চলবে।',
    },
    {
      qEn: 'Are the Windows 11 and Office 365 keys genuine?',
      qBn: 'উইন্ডোজ ১১ এবং অফিস ৩৬৫ এর কিগুলো কি আসল ও জেনুইন?',
      aEn: 'Yes, we provide 100% genuine 25-digit Microsoft Retail Activation Keys with lifetime validity and direct official updates from Microsoft servers.',
      aBn: 'হ্যাঁ, আমরা ১০০% অফিসিয়াল ২৫ ডিজিটের মাইক্রোসফট রিটেইল অ্যাক্টিভেশন কি প্রদান করি, যা আজীবন সচল থাকে এবং অফিসিয়াল আপডেট পায়।',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafc] text-gray-900 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <HeroSection />

      {/* Main Catalog Section */}
      <main id="products-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {/* Section Title & Sort Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-6 bg-emerald-600 rounded-full" />
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {selectedCategory === 'all'
                  ? t.popularProducts
                  : lang === 'bn'
                  ? 'ক্যাটাগরি পণ্য তালিকা'
                  : 'Category Products'}
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {lang === 'bn'
                ? `মোট ${sortedProducts.length} টি ডিজিটাল অ্যাপ ও লাইসেন্স পাওয়া গেছে`
                : `Showing ${sortedProducts.length} premium digital tools & licenses`}
            </p>
          </div>

          {/* Sort Controls & Active Filters */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            {searchQuery && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">
                <span>"{searchQuery}"</span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="hover:text-rose-600 p-0.5 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-2xs text-xs font-bold text-gray-700">
              <SlidersHorizontal className="w-3.5 h-3.5 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent border-none outline-hidden cursor-pointer text-xs font-bold text-gray-800"
              >
                <option value="featured">{t.sortFeatured}</option>
                <option value="price-asc">{t.sortPriceLowHigh}</option>
                <option value="price-desc">{t.sortPriceHighLow}</option>
                <option value="popular">{t.sortPopular}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        {sortedProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 p-8">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800 mb-1">
              {lang === 'bn' ? 'কোনো প্রোডাক্ট খুঁজে পাওয়া যায়নি' : 'No products found'}
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
              {lang === 'bn'
                ? 'আপনার সার্চ কুয়েরি অথবা ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।'
                : 'Try adjusting your search terms or category filters.'}
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
            >
              {lang === 'bn' ? 'সব পণ্য দেখুন' : 'View All Products'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* How It Works Section */}
        <section className="mt-20 pt-12 border-t border-gray-200">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">
              {lang === 'bn' ? 'সহজ ৩টি ধাপ' : 'Easy 3-Step Process'}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {lang === 'bn' ? 'কীভাবে অর্ডার করবেন ও পাবেন?' : 'How Does It Work?'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-lg mb-4">
                1
              </div>
              <h4 className="text-base font-bold text-gray-900 mb-2">
                {lang === 'bn' ? 'প্যাকেজ নির্বাচন করুন' : 'Select Package & Duration'}
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                {lang === 'bn'
                  ? 'আপনার প্রয়োজনীয় অ্যাপস বা সফটওয়্যার এবং মেয়াদ (১ মাস/১ বছর) সিলেক্ট করে "Buy Now" এ ক্লিক করুন।'
                  : 'Choose your desired subscription duration (1 Month, 1 Year, etc.) and click Buy Now.'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-lg mb-4">
                2
              </div>
              <h4 className="text-base font-bold text-gray-900 mb-2">
                {lang === 'bn' ? 'বিকাশ/নগদে পেমেন্ট করুন' : 'Pay via bKash or Nagad'}
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                {lang === 'bn'
                  ? 'প্রদত্ত বিকাশ বা নগদ নম্বরে টাকা পাঠিয়ে প্রেরক নম্বর ও TrxID লিখে অর্ডার নিশ্চিত করুন।'
                  : 'Send money to the displayed number, paste your TrxID and submit verification.'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-lg mb-4">
                3
              </div>
              <h4 className="text-base font-bold text-gray-900 mb-2">
                {lang === 'bn' ? 'ইনস্ট্যান্ট ডিজিটাল ডেলিভারি' : 'Receive Digital Credentials'}
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                {lang === 'bn'
                  ? 'অল্প সময়ের মধ্যে আপনার স্ক্রিনেই অরিজিনাল লাইসেন্স কি ও লগইন তথ্য প্রদর্শিত হবে।'
                  : 'Access your original login credentials or license key directly on screen and via WhatsApp.'}
              </p>
            </div>
          </div>
        </section>

        {/* Customer Reviews & Trust Showcase */}
        <section className="mt-16 bg-gradient-to-tr from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-10 border border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                {lang === 'bn' ? 'সন্তুষ্ট গ্রাহকদের মন্তব্য' : 'Real Customer Reviews'}
              </span>
              <h3 className="text-xl sm:text-2xl font-black">
                {lang === 'bn' ? '৫,০০০+ গ্রাহকের আস্থা ও ভালোবাসা' : 'Trusted by 5,000+ Happy Customers'}
              </h3>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-xs text-xs font-bold">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>4.9 / 5.0 Average Customer Rating</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
              <div className="flex items-center gap-1 text-amber-400 text-xs mb-2">
                ★★★★★
              </div>
              <p className="text-xs text-gray-300 mb-4 leading-relaxed">
                "অর্ডার করার ১০ মিনিটের মাথায় ক্যানভা প্রো ইনভাইট পেয়ে গেছি। পার্সোনাল জিমেইল দিয়েই ফুল টিম অ্যাক্টিভ হয়ে গেছে। ধন্যবাদ ডিজিটাল প্রোডাক্ট সেবা!"
              </p>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                  S
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Sakibul Hasan</span>
                  <span className="text-[10px] text-gray-400">Canva Pro Buyer (Dhaka)</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
              <div className="flex items-center gap-1 text-amber-400 text-xs mb-2">
                ★★★★★
              </div>
              <p className="text-xs text-gray-300 mb-4 leading-relaxed">
                "নেটফ্লিক্স ৪কে অ্যাকাউন্ট ৩ মাস ধরে কোনো সমস্যা ছাড়াই চলছে। এর আগে অন্য পেইজ থেকে কিনে ঠকেছিলাম, কিন্তু এখানে রিপ্লেসমেন্ট ওয়ারেন্টি আসলেই কার্যকর।"
              </p>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center text-xs">
                  M
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Mahmudur Rahman</span>
                  <span className="text-[10px] text-gray-400">Netflix UHD Buyer (Chattogram)</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
              <div className="flex items-center gap-1 text-amber-400 text-xs mb-2">
                ★★★★★
              </div>
              <p className="text-xs text-gray-300 mb-4 leading-relaxed">
                "উইন্ডোজ ১১ প্রো রিটেইল কি সাথে সাথে একটিভ হয়ে গেছে এবং মাইক্রোসফট অ্যাকাউন্টে লিংক হয়েছে। বিকাশ পেমেন্ট সিস্টেম খুবই সহজ ছিল।"
              </p>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                  F
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Farhan Ahmed</span>
                  <span className="text-[10px] text-gray-400">Windows 11 Pro Key Buyer (Sylhet)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mt-16">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">
              FAQ
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {lang === 'bn' ? 'সাধারণ জিজ্ঞাসাসমূহ' : 'Frequently Asked Questions'}
            </h3>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = faqOpenIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs"
                >
                  <button
                    onClick={() => setFaqOpenIndex(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-gray-900 hover:text-emerald-700 cursor-pointer"
                  >
                    <span>{lang === 'bn' ? faq.qBn : faq.qEn}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-500 transition-transform ${
                        isOpen ? 'rotate-180 text-emerald-600' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="p-4 pt-0 text-xs text-gray-600 leading-relaxed border-t border-gray-100 bg-gray-50/50">
                      {lang === 'bn' ? faq.aBn : faq.aEn}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Floating WhatsApp Quick Chat Button */}
      <a
        href={`https://wa.me/${siteSettings.whatsappSupportNumber.replace(/[^0-9]/g, '')}?text=Hello%2C%20I%20want%20to%20know%20more%20about%20your%20digital%20products.`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-40 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/30 flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
        aria-label="WhatsApp Support"
        title="24/7 WhatsApp Live Support"
      >
        <MessageCircle className="w-7 h-7" />
      </a>

      {/* Footer */}
      <Footer />

      {/* All Functional Modals & Drawers */}
      <ProductModal />
      <CartDrawer />
      <CheckoutModal />
      <OrderSuccessModal />
      <TrackOrderModal />
      <UserDashboardModal />
      <AdminDashboardModal />
      <AuthModal />
      <RecentPurchaseNotification />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainContent />
    </StoreProvider>
  );
}

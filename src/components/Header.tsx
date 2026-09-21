import React, { useState } from 'react';
import {
  Search,
  ShoppingCart,
  User as UserIcon,
  ShieldCheck,
  Package,
  Globe,
  Menu,
  X,
  Sparkles,
  LogOut,
  LayoutDashboard,
  ShieldAlert,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const Header: React.FC = () => {
  const {
    lang,
    setLang,
    t,
    cartCount,
    setIsCartOpen,
    searchQuery,
    setSearchQuery,
    setIsTrackOrderOpen,
    currentUser,
    setIsAuthModalOpen,
    setIsUserDashboardOpen,
    setIsAdminDashboardOpen,
    logoutUser,
    siteSettings,
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-xs border-b border-gray-100">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-700 text-white text-xs sm:text-sm py-1.5 px-4 font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <Sparkles className="w-4 h-4 shrink-0 text-amber-300 animate-pulse" />
            <span className="truncate">
              {lang === 'bn' ? siteSettings.announcementBn : siteSettings.announcementEn}
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-4 shrink-0 text-xs">
            <span className="flex items-center gap-1 text-emerald-100">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              {t.verifiedDelivery}
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-amber-200">{t.warrantyGuarantee}</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-6">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-left flex items-center gap-2.5 group cursor-pointer focus:outline-hidden"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <span className="font-black text-xl tracking-tighter">DPS</span>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base sm:text-xl text-gray-900 tracking-tight leading-none group-hover:text-emerald-600 transition-colors">
                  {lang === 'bn' ? 'ডিজিটাল প্রোডাক্ট সেবা' : 'Digital Product Sheba'}
                </span>
                <span className="text-[10px] sm:text-xs text-gray-500 font-medium tracking-wide mt-1">
                  {lang === 'bn' ? 'বিশ্বস্ত অ্যাপস ও সাবস্ক্রিপশন' : 'Digital App & License Store'}
                </span>
              </div>
            </button>
          </div>

          {/* Search Input Desktop */}
          <div className="hidden lg:flex flex-1 max-w-md relative">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-gray-50 hover:bg-gray-100 focus:bg-white text-gray-800 placeholder-gray-400 text-sm rounded-full pl-11 pr-10 py-2.5 border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-hidden"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs p-1 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Language Switcher */}
            <div className="flex items-center bg-gray-100 p-1 rounded-full border border-gray-200 text-xs font-bold">
              <button
                onClick={() => setLang('bn')}
                className={`px-2.5 py-1 rounded-full cursor-pointer transition-all ${
                  lang === 'bn' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                বাং
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-full cursor-pointer transition-all ${
                  lang === 'en' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                EN
              </button>
            </div>

            {/* Track Order Button */}
            <button
              onClick={() => setIsTrackOrderOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 hover:text-emerald-700 bg-gray-50 hover:bg-emerald-50 rounded-lg border border-gray-200 hover:border-emerald-200 transition-colors cursor-pointer"
            >
              <Package className="w-4 h-4 text-emerald-600" />
              <span>{t.trackOrder}</span>
            </button>

            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer flex items-center"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-bold text-[11px] min-w-[20px] h-5 rounded-full flex items-center justify-center px-1 shadow-sm animate-scale">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Account / Auth Dropdown */}
            <div className="relative">
              {currentUser ? (
                <div>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden sm:flex flex-col text-left">
                      <span className="truncate max-w-[100px] leading-tight">{currentUser.name}</span>
                      <span className="text-[10px] text-emerald-600 font-bold uppercase">
                        {currentUser.role}
                      </span>
                    </div>
                  </button>

                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs text-gray-400 font-medium">{t.welcomeBack}</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{currentUser.name}</p>
                        <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                      </div>

                      {currentUser.role === 'admin' ? (
                        <button
                          onClick={() => setIsAdminDashboardOpen(true)}
                          className="w-full px-4 py-2.5 text-left text-xs font-semibold text-indigo-700 hover:bg-indigo-50 flex items-center gap-2 cursor-pointer"
                        >
                          <ShieldAlert className="w-4 h-4 text-indigo-600" />
                          <span>{t.adminPanel}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsUserDashboardOpen(true)}
                          className="w-full px-4 py-2.5 text-left text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
                        >
                          <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                          <span>{t.dashboard}</span>
                        </button>
                      )}

                      <button
                        onClick={logoutUser}
                        className="w-full px-4 py-2.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-gray-100 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>{t.logout}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
                >
                  <UserIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{t.login}</span>
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="lg:hidden pb-3 pt-1">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-gray-50 hover:bg-gray-100 focus:bg-white text-gray-800 placeholder-gray-400 text-xs rounded-xl pl-9 pr-8 py-2 border border-gray-200 focus:border-emerald-500 outline-hidden"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Mobile Collapsible Navigation Links */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 py-3 space-y-2 animate-in fade-in">
            <button
              onClick={() => {
                setIsTrackOrderOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg flex items-center gap-2 cursor-pointer"
            >
              <Package className="w-4 h-4 text-emerald-600" />
              <span>{t.trackOrder}</span>
            </button>

            {currentUser ? (
              <>
                <button
                  onClick={() => {
                    if (currentUser.role === 'admin') {
                      setIsAdminDashboardOpen(true);
                    } else {
                      setIsUserDashboardOpen(true);
                    }
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                  <span>{currentUser.role === 'admin' ? t.adminPanel : t.dashboard}</span>
                </button>
                <button
                  onClick={() => {
                    logoutUser();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>{t.logout}</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setIsAuthModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-2 cursor-pointer"
              >
                <UserIcon className="w-4 h-4 text-emerald-600" />
                <span>{t.login} / {t.register}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

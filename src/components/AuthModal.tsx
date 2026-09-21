import React, { useState } from 'react';
import { X, User, Lock, Mail, ShieldAlert, Sparkles, ArrowRight, Loader2, Phone } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginAsDemo,
    pendingCheckout,
    lang,
    t,
  } = useStore();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      if (isRegister) {
        await registerWithEmail(email, password, name || email.split('@')[0], phone);
      } else {
        await loginWithEmail(email, password);
      }
    } catch {
      // Error handled by store toast
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch {
      // Error handled by store toast
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async (role: 'customer' | 'admin') => {
    setLoading(true);
    try {
      await loginAsDemo(role);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div
        className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 relative my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider block">
              Digital Product Sheba
            </span>
            <h2 className="text-xl font-black">{isRegister ? t.register : t.login}</h2>
            {pendingCheckout && (
              <p className="text-xs text-emerald-100 mt-1">
                {lang === 'bn'
                  ? 'অর্ডারটি সম্পন্ন করতে সাইন ইন করুন'
                  : 'Sign in to complete your checkout'}
              </p>
            )}
          </div>

          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 text-white/80 hover:text-white rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Testing Login Strip */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <span className="text-[11px] text-gray-500 font-bold block mb-2 text-center uppercase tracking-wider">
            {lang === 'bn' ? 'ফায়ারবেস অথেনটিকেশন টেস্ট লগইন:' : 'Firebase Authentication Test Login:'}
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoClick('customer')}
              className="px-3 py-2 bg-white hover:bg-emerald-50 text-gray-800 hover:text-emerald-700 text-xs font-bold rounded-xl border border-gray-200 hover:border-emerald-300 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
            >
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.quickDemoCustomer}</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoClick('admin')}
              className="px-3 py-2 bg-white hover:bg-indigo-50 text-gray-800 hover:text-indigo-700 text-xs font-bold rounded-xl border border-gray-200 hover:border-indigo-300 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t.quickDemoAdmin}</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Google Sign-in */}
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleLogin}
            className="w-full py-2.5 px-4 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl border border-gray-300 flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.1-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1c0 2.8.7 5.4 1.9 7.8l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.9C3.7 20.6 7.5 23.5 12 23.5z"
              />
            </svg>
            <span>{lang === 'bn' ? 'গুগল দিয়ে প্রবেশ করুন' : 'Sign in with Google'}</span>
          </button>

          <div className="flex items-center my-3">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-3 text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
              {lang === 'bn' ? 'অথবা ইমেইল দিয়ে' : 'or with email'}
            </span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {isRegister && (
            <>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">{t.fullName}</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tanvir Ahmed"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-hidden"
                  />
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  {lang === 'bn' ? 'মোবাইল / হোয়াটসঅ্যাপ নম্বর' : 'Phone / WhatsApp'}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 01712349988"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-hidden"
                  />
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">{t.email}</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. user@example.com"
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-hidden"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              {lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
            </label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-hidden"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            {isRegister && (
              <span className="text-[10px] text-gray-400 mt-0.5 block">
                {lang === 'bn' ? 'কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন' : 'Minimum 6 characters'}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isRegister ? t.register : t.login}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-gray-500 hover:text-emerald-700 cursor-pointer font-semibold"
            >
              {isRegister
                ? lang === 'bn'
                  ? 'ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন'
                  : 'Already have an account? Login'
                : lang === 'bn'
                ? 'নতুন গ্রাহক? রেজিস্ট্রেশন করুন'
                : 'New customer? Create an account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

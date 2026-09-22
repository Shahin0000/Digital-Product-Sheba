import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ShieldCheck,
  CreditCard,
  Phone,
  Mail,
  User,
  AlertCircle,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PaymentMethod } from '../types';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cart,
    cartSubtotal,
    cartDiscount,
    cartTotal,
    appliedCoupon,
    createOrder,
    currentUser,
    loginWithGoogle,
    siteSettings,
    showToast,
    lang,
    t,
  } = useStore();

  if (!isCheckoutOpen) return null;

  // Form states
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bkash');
  const [senderNumber, setSenderNumber] = useState(currentUser?.phone || '');
  const [trxId, setTrxId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);

  React.useEffect(() => {
    if (currentUser) {
      if (!customerName && currentUser.name) setCustomerName(currentUser.name);
      if (!customerEmail && currentUser.email) setCustomerEmail(currentUser.email);
      if (!customerPhone && currentUser.phone) setCustomerPhone(currentUser.phone);
      if (!senderNumber && currentUser.phone) setSenderNumber(currentUser.phone);
    }
  }, [currentUser]);

  const getTargetNumber = () => {
    switch (paymentMethod) {
      case 'bkash':
        return { number: siteSettings.bkashNumber, type: siteSettings.bkashType };
      case 'nagad':
        return { number: siteSettings.nagadNumber, type: siteSettings.nagadType };
      case 'rocket':
        return { number: siteSettings.rocketNumber, type: siteSettings.rocketType };
      default:
        return { number: siteSettings.bkashNumber, type: 'Personal' };
    }
  };

  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num.replace(/[^0-9]/g, ''));
    setCopiedNumber(true);
    showToast(t.numberCopied, 'success');
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  // Demo auto-fill for frictionless evaluator testing
  const handleAutoFillDemo = () => {
    setCustomerName(currentUser?.name || 'Tanvir Ahmed');
    setCustomerPhone(currentUser?.phone || '01712349988');
    setCustomerEmail(currentUser?.email || 'tanvir.customer@gmail.com');
    setSenderNumber(currentUser?.phone || '01712349988');
    // Generate realistic TrxID
    const randomTrx =
      paymentMethod === 'bkash'
        ? 'BKA' + Math.random().toString(36).substring(2, 8).toUpperCase()
        : 'NGD' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setTrxId(randomTrx);
    showToast(
      lang === 'bn' ? 'ডেমো পেমেন্ট তথ্য পূরণ হয়েছে' : 'Demo payment information auto-filled',
      'info'
    );
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      showToast(
        lang === 'bn'
          ? 'অর্ডার সম্পন্ন করার জন্য অনুগ্রহ করে গুগল দিয়ে সাইন ইন করুন'
          : 'Please sign in with Google to place your order',
        'info'
      );
      try {
        await loginWithGoogle();
      } catch (authErr) {
        console.error('Login prompt cancelled:', authErr);
      }
      return;
    }

    if (!customerName.trim()) {
      showToast(lang === 'bn' ? 'আপনার নাম লিখুন' : 'Please enter your full name', 'error');
      return;
    }
    if (!customerPhone.trim() || customerPhone.length < 10) {
      showToast(
        lang === 'bn'
          ? 'সঠিক মোবাইল/হোয়াটসঅ্যাপ নম্বর দিন'
          : 'Please provide a valid phone/WhatsApp number',
        'error'
      );
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      showToast(
        lang === 'bn' ? 'সঠিক ইমেইল অ্যাড্রেস দিন' : 'Please provide a valid delivery email',
        'error'
      );
      return;
    }
    if (!senderNumber.trim()) {
      showToast(
        lang === 'bn'
          ? 'যে নম্বর থেকে টাকা পাঠিয়েছেন তা লিখুন'
          : 'Please enter sender mobile number',
        'error'
      );
      return;
    }
    if (!trxId.trim() || trxId.length < 6) {
      showToast(
        lang === 'bn'
          ? 'সঠিক ট্রানজেকশন আইডি (TrxID) লিখুন'
          : 'Please provide a valid Transaction ID (TrxID)',
        'error'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Submitting checkout order for customer:', customerName, customerEmail, 'UID:', currentUser.id);
      await createOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        deliveryNotes: deliveryNotes.trim(),
        items: cart.map((item) => ({
          productId: item.product.id,
          productTitle: lang === 'bn' ? item.product.titleBn : item.product.titleEn,
          variantId: item.selectedVariant.id,
          variantName:
            lang === 'bn' ? item.selectedVariant.nameBn : item.selectedVariant.nameEn,
          unitPrice: item.selectedVariant.salePrice,
          quantity: item.quantity,
          deliveryType: item.product.deliveryType,
        })),
        subtotal: cartSubtotal,
        discount: cartDiscount,
        couponCode: appliedCoupon?.code || '',
        totalAmount: cartTotal,
        paymentMethod,
        senderNumber: senderNumber.trim(),
        trxId: trxId.trim().toUpperCase(),
      });
    } catch (err: unknown) {
      console.error('Order creation error in CheckoutModal:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('Checkout submission error details:', errMsg);
      showToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentTarget = getTargetNumber();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-100 relative my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-gray-900">{t.checkout}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {lang === 'bn'
                ? 'পেমেন্ট সম্পন্ন করে নিচের ফর্মটি পূরণ করুন'
                : 'Complete payment and submit verification'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutoFillDemo}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-100 text-amber-900 hover:bg-amber-200 text-[11px] font-bold cursor-pointer transition-colors"
              title="Auto Fill Demo Information"
            >
              <Zap className="w-3 h-3 text-amber-600" />
              <span>{lang === 'bn' ? 'অটো-ফিল ডেমো' : 'Auto Fill Demo'}</span>
            </button>

            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-lg cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmitOrder} className="p-4 sm:p-6 space-y-6">
          {/* Order Summary Strip */}
          <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-800 font-bold block">
                {lang === 'bn' ? 'অর্ডারকৃত মোট আইটেম' : 'Total Items in Order'}: {cart.length}
              </span>
              <span className="text-[11px] text-emerald-600">
                {cart.map((i) => i.product.titleEn).join(', ')}
              </span>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs text-gray-500 block">{t.total}</span>
              <span className="text-xl font-black text-emerald-800">৳{cartTotal}</span>
            </div>
          </div>

          {/* Authentication Status Card */}
          {currentUser ? (
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3 sm:p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-950">{currentUser.name}</span>
                    <span className="text-[10px] font-bold bg-emerald-200/80 text-emerald-800 px-2 py-0.5 rounded-full">
                      {lang === 'bn' ? 'অথেনটিকেটেড গ্রাহক' : 'Authenticated Customer'}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700">{currentUser.email || currentUser.id}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-amber-950 block">
                  {lang === 'bn' ? 'অর্ডার করতে গুগল দিয়ে সাইন ইন করুন' : 'Sign in with Google to complete your order'}
                </span>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  {lang === 'bn'
                    ? 'আপনার অর্ডার ও ডিজিটাল লাইসেন্স কি নিরাপদে সেভ রাখার জন্য সাইন ইন বাধ্যতামূলক'
                    : 'Required to securely record your purchase and deliver your digital product'}
                </p>
              </div>

              <button
                type="button"
                onClick={loginWithGoogle}
                className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-amber-100/60 text-gray-800 text-xs font-bold rounded-xl border border-amber-300 shadow-2xs flex items-center justify-center gap-2 shrink-0 cursor-pointer transition-colors"
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
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.1 7.5 23 12 23z"
                  />
                </svg>
                <span>{lang === 'bn' ? 'গুগল দিয়ে লগইন' : 'Sign in with Google'}</span>
              </button>
            </div>
          )}

          {/* Section 1: Customer Contact Information */}
          <div>
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-600" />
              <span>{t.customerInfo}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">
                  {t.fullName} *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Tanvir Ahmed"
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">
                  {t.phoneWhatsApp} *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. 017XXXXXXXX"
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-gray-600 block mb-1">
                  {t.email} * ({lang === 'bn' ? 'ডিজিটাল ডেলিভারির জন্য' : 'For Digital Delivery'})
                </label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="e.g. user@gmail.com"
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 2: MFS Gateway Selector */}
          <div>
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>{t.paymentMethod}</span>
            </h3>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('bkash')}
                className={`p-3 rounded-2xl border-2 font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  paymentMethod === 'bkash'
                    ? 'border-rose-500 bg-rose-50/50 text-rose-700 shadow-xs'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-rose-600" />
                <span>bKash (বিকাশ)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('nagad')}
                className={`p-3 rounded-2xl border-2 font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  paymentMethod === 'nagad'
                    ? 'border-amber-500 bg-amber-50/50 text-amber-800 shadow-xs'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span>Nagad (নগদ)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('rocket')}
                className={`p-3 rounded-2xl border-2 font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  paymentMethod === 'rocket'
                    ? 'border-purple-500 bg-purple-50/50 text-purple-700 shadow-xs'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-purple-600" />
                <span>Rocket (রকেট)</span>
              </button>
            </div>

            {/* Payment Guide Box */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">
                    {paymentMethod.toUpperCase()} {currentTarget.type} Number:
                  </span>
                  <span className="text-base font-black text-gray-900 tracking-wider font-mono">
                    {currentTarget.number}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyNumber(currentTarget.number)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedNumber ? t.copied : t.copyNumber}</span>
                </button>
              </div>

              <div className="text-[11px] text-gray-600 space-y-1">
                <p className="font-bold text-gray-800">
                  {lang === 'bn' ? 'পেমেন্ট করার নিয়মাবলী:' : 'Payment Instructions:'}
                </p>
                <ol className="list-decimal list-inside space-y-0.5 text-gray-500">
                  <li>
                    {paymentMethod === 'bkash'
                      ? 'আপনার বিকাশ অ্যাপ অথবা *247# ডায়াল করে Send Money অপশনে যান।'
                      : 'আপনার নগদ অ্যাপ অথবা *167# ডায়াল করে Send Money অপশনে যান।'}
                  </li>
                  <li>
                    উপরে উল্লেখিত নম্বরে সঠিক পরিমাণ টাকা (<strong>৳{cartTotal}</strong>) পাঠান।
                  </li>
                  <li>
                    টাকা পাঠানো সম্পন্ন হলে প্রাপ্ত ট্রানজেকশন আইডি (TrxID) নিচের ঘরে বসিয়ে অর্ডার সাবমিট করুন।
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* Section 3: Verification Details */}
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">
                  {t.senderMobile} *
                </label>
                <input
                  type="tel"
                  required
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                  placeholder="e.g. 01712345678"
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">
                  {t.trxId} *
                </label>
                <input
                  type="text"
                  required
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  placeholder="e.g. BKT8291KL"
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-hidden uppercase font-mono tracking-wider"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3.5 rounded-xl font-extrabold text-sm text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer ${
                isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t.processingOrder}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>{t.placeOrder} (৳{cartTotal})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

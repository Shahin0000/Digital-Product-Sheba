import React, { useState } from 'react';
import {
  CheckCircle2,
  X,
  Printer,
  Copy,
  Check,
  Clock,
  Key,
  ShieldCheck,
  MessageCircle,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const OrderSuccessModal: React.FC = () => {
  const { isSuccessOpen, setIsSuccessOpen, lastCreatedOrder, siteSettings, showToast, lang, t } =
    useStore();

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isSuccessOpen || !lastCreatedOrder) return null;

  const handleCopyCredentials = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    showToast(t.copied, 'success');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-100 relative my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white backdrop-blur-xs shrink-0">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider block">
                {t.orderId}: {lastCreatedOrder.id}
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                {t.orderSuccessTitle}
              </h2>
            </div>
          </div>

          <button
            onClick={() => setIsSuccessOpen(false)}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Timeline */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {t.orderId}: <strong className="text-gray-900">{lastCreatedOrder.id}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                {lang === 'bn' ? 'পেমেন্ট যাচাই হচ্ছে' : 'Payment Verifying'}
              </span>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              {t.orderSuccessDesc}
            </p>
          </div>

          {/* Digital Credentials Section */}
          {lastCreatedOrder.digitalDeliveries && lastCreatedOrder.digitalDeliveries.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-emerald-600" />
                  <span>{t.digitalCredentials}</span>
                </h3>
                <span className="text-[11px] text-gray-400">
                  {lang === 'bn' ? 'সংরক্ষণ করে রাখুন' : 'Save securely'}
                </span>
              </div>

              {lastCreatedOrder.digitalDeliveries.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div>
                      <span className="text-xs font-bold text-emerald-400 block">
                        {item.productTitle}
                      </span>
                      <span className="text-[10px] text-gray-400">{item.variantTitle}</span>
                    </div>
                    <button
                      onClick={() => handleCopyCredentials(item.credentialsOrKey, idx)}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedIndex === idx ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedIndex === idx ? t.copied : t.copyKey}</span>
                    </button>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl font-mono text-xs text-amber-300 break-all select-all">
                    {item.credentialsOrKey}
                  </div>

                  {item.notes && (
                    <p className="text-[11px] text-gray-400 italic">{item.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Customer & Transaction Details Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-2xl text-xs">
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">
                {lang === 'bn' ? 'গ্রাহকের নাম' : 'Customer'}
              </span>
              <span className="font-bold text-gray-800">{lastCreatedOrder.customerName}</span>
            </div>

            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">
                {lang === 'bn' ? 'মোবাইল / হোয়াটসঅ্যাপ' : 'WhatsApp'}
              </span>
              <span className="font-bold text-gray-800">{lastCreatedOrder.customerPhone}</span>
            </div>

            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">
                {lang === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment'}
              </span>
              <span className="font-bold text-emerald-700 uppercase">
                {lastCreatedOrder.paymentMethod} (৳{lastCreatedOrder.totalAmount})
              </span>
            </div>

            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">TrxID</span>
              <span className="font-bold font-mono text-gray-900">{lastCreatedOrder.trxId}</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={handlePrint}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4 text-gray-500" />
              <span>{t.printReceipt}</span>
            </button>

            <a
              href={`https://wa.me/${siteSettings.whatsappSupportNumber.replace(/[^0-9]/g, '')}?text=Hello%2C%20I%20have%20placed%20order%20${lastCreatedOrder.id}%20with%20TrxID%20${lastCreatedOrder.trxId}.%20Please%20verify.`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{lang === 'bn' ? 'হোয়াটসঅ্যাপে জানান' : 'Notify on WhatsApp'}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

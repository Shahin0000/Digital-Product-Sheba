import React, { useState } from 'react';
import {
  X,
  Search,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  Key,
  ExternalLink,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Order } from '../types';

export const TrackOrderModal: React.FC = () => {
  const { isTrackOrderOpen, setIsTrackOrderOpen, orders, trackOrderDirectly, showToast, lang, t } =
    useStore();

  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matchedOrder, setMatchedOrder] = useState<Order | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isTrackOrderOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    const clean = query.trim().toLowerCase();
    let found = orders.find(
      (o) =>
        o.id.toLowerCase() === clean ||
        o.customerPhone.replace(/[^0-9]/g, '') === clean.replace(/[^0-9]/g, '') ||
        o.trxId.toLowerCase() === clean
    );

    if (!found) {
      // Query Firestore directly
      found = (await trackOrderDirectly(query.trim())) || undefined;
    }

    setSearched(true);
    setMatchedOrder(found || null);
    setLoading(false);
  };

  const handleCopy = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(val);
    showToast(t.copied, 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t.statusCompleted}</span>
          </span>
        );
      case 'verifying':
        return (
          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-xs flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{t.statusVerifying}</span>
          </span>
        );
      case 'processing':
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-bold text-xs flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{t.statusProcessing}</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full font-bold text-xs">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div
        className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-gray-100 relative my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-gray-900">{t.trackOrderTitle}</h2>
              <p className="text-[11px] text-gray-500">
                {lang === 'bn' ? 'অর্ডার নম্বর বা ফোন নম্বর দিয়ে খুঁজুন' : 'Lookup status by Order ID or Phone'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsTrackOrderOpen(false)}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Search Box */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. DPS-84921 or 01711223344"
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-hidden font-mono uppercase"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-colors"
            >
              {t.searchOrder}
            </button>
          </form>

          {/* Search Results */}
          {searched && (
            <div>
              {matchedOrder ? (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">
                        {t.orderId}
                      </span>
                      <span className="text-base font-black text-gray-900 font-mono">
                        {matchedOrder.id}
                      </span>
                    </div>

                    <div>{getStatusBadge(matchedOrder.status)}</div>
                  </div>

                  {/* Items list */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-700 block uppercase tracking-wider">
                      {lang === 'bn' ? 'অর্ডারকৃত প্রোডাক্ট:' : 'Ordered Products:'}
                    </span>
                    {matchedOrder.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white border border-gray-100 rounded-xl flex justify-between items-center text-xs shadow-xs"
                      >
                        <div>
                          <span className="font-bold text-gray-900 block">{item.productTitle}</span>
                          <span className="text-[11px] text-emerald-600">{item.variantName}</span>
                        </div>
                        <span className="font-black text-gray-900">৳{item.unitPrice * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Digital keys if completed or available */}
                  {matchedOrder.digitalDeliveries && matchedOrder.digitalDeliveries.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5 uppercase tracking-wider">
                        <Key className="w-4 h-4 text-emerald-600" />
                        <span>{t.digitalCredentials}</span>
                      </span>

                      {matchedOrder.digitalDeliveries.map((del, i) => {
                        const link = del.externalAccessUrl || (del.downloadUrl?.startsWith('http') ? del.downloadUrl : null);
                        return (
                          <div key={i} className="bg-slate-900 text-white p-3.5 rounded-xl text-xs space-y-2">
                            <div className="flex justify-between items-center text-emerald-400 font-bold">
                              <span>{del.productTitle}</span>
                              {del.credentialsOrKey && (
                                <button
                                  onClick={() => handleCopy(del.credentialsOrKey)}
                                  className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] flex items-center gap-1 cursor-pointer"
                                >
                                  {copiedKey === del.credentialsOrKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                  <span>{copiedKey === del.credentialsOrKey ? t.copied : t.copyKey}</span>
                                </button>
                              )}
                            </div>
                            {del.credentialsOrKey && (
                              <div className="bg-slate-950 p-2.5 rounded font-mono text-amber-300 break-all select-all text-[11px]">
                                {del.credentialsOrKey}
                              </div>
                            )}
                            {link && (
                              <div className="pt-1">
                                <a
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>{lang === 'bn' ? 'অ্যাক্সেস / ড্রাইভ লিঙ্ক খুলুন' : 'Open Access / Drive Link'}</span>
                                </a>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Payment Details */}
                  <div className="p-3 bg-gray-50 rounded-xl text-[11px] text-gray-600 flex justify-between">
                    <span>
                      {lang === 'bn' ? 'পেমেন্ট মেথড' : 'Payment'}:{' '}
                      <strong className="uppercase">{matchedOrder.paymentMethod}</strong>
                    </span>
                    <span>
                      TrxID: <strong className="font-mono">{matchedOrder.trxId}</strong>
                    </span>
                    <span>
                      {lang === 'bn' ? 'মোট মূল্য' : 'Total'}:{' '}
                      <strong>৳{matchedOrder.totalAmount}</strong>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-2xl border border-gray-200 p-4">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-700">{t.noOrderFound}</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {lang === 'bn'
                      ? 'টিপস: অর্ডার নম্বর (যেমন DPS-84921) অথবা যে মোবাইল নম্বর দিয়ে অর্ডার করেছেন তা লিখে সার্চ করুন।'
                      : 'Tip: Try searching with your Order ID or the phone number provided during checkout.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

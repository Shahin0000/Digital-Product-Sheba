import React, { useState } from 'react';
import {
  X,
  Package,
  Key,
  ShieldCheck,
  User,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  LifeBuoy,
  Send,
  Download,
  DownloadCloud,
  FileArchive,
  ExternalLink,
  Lock,
  RefreshCw,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const UserDashboardModal: React.FC = () => {
  const {
    isUserDashboardOpen,
    setIsUserDashboardOpen,
    currentUser,
    orders,
    deliveries,
    requestSecureDownload,
    showToast,
    lang,
    t,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'keys' | 'support' | 'profile'>('orders');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);

  // Support ticket form
  const [ticketOrder, setTicketOrder] = useState('');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');

  if (!isUserDashboardOpen || !currentUser) return null;

  // Filter orders related to this user
  const myOrders = orders.filter(
    (o) =>
      o.userId === currentUser.id ||
      o.customerEmail.toLowerCase() === currentUser.email.toLowerCase() ||
      (currentUser.phone && o.customerPhone === currentUser.phone) ||
      currentUser.role === 'admin'
  );

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    showToast(t.copied, 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownload = async (orderId: string) => {
    setDownloadingOrderId(orderId);
    try {
      await requestSecureDownload(orderId);
    } finally {
      setDownloadingOrderId(null);
    }
  };

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;
    showToast(t.ticketSubmitted, 'success');
    setTicketSubject('');
    setTicketMessage('');
    setTicketOrder('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div
        className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-gray-100 relative my-6 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-gray-900">{t.dashboard}</h2>
              <p className="text-xs text-gray-500">
                {currentUser.name} ({currentUser.email})
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsUserDashboardOpen(false)}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 bg-white px-4 sm:px-6 overflow-x-auto gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'orders'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>{t.myOrders}</span>
            <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full">
              {myOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('keys')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'keys'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <DownloadCloud className="w-4 h-4" />
            <span>{lang === 'bn' ? 'ডেলিভারি ও ফাইল' : 'Digital Access & Files'}</span>
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'support'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <LifeBuoy className="w-4 h-4" />
            <span>{t.supportTicket}</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'profile'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{t.profile}</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: MY ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              {myOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-bold">
                    {lang === 'bn' ? 'কোনো অর্ডার খুঁজে পাওয়া যায়নি।' : 'No orders found.'}
                  </p>
                </div>
              ) : (
                myOrders.map((order) => {
                  const delivery = deliveries[order.id];
                  const isDelivered = order.status === 'delivered' || order.status === 'completed';
                  const keyText =
                    delivery?.credentialsOrKey ||
                    order.digitalDeliveries?.[0]?.credentialsOrKey ||
                    '';

                  const accessUrl =
                    delivery?.externalAccessUrl ||
                    (delivery?.deliveryMethod === 'external_link' ? delivery.downloadUrl : undefined) ||
                    order.digitalDeliveries?.[0]?.externalAccessUrl ||
                    (delivery?.downloadUrl?.includes('drive.google.com') ? delivery.downloadUrl : undefined) ||
                    (order.digitalDeliveries?.[0]?.downloadUrl?.includes('drive.google.com') ? order.digitalDeliveries?.[0]?.downloadUrl : undefined);

                  const isFileDelivery =
                    !accessUrl &&
                    (delivery?.deliveryMethod === 'file' ||
                      delivery?.fileName ||
                      delivery?.storagePath ||
                      (delivery?.downloadUrl && !delivery.downloadUrl.includes('drive.google.com')));

                  return (
                    <div
                      key={order.id}
                      className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-black text-gray-900 font-mono">
                            #{order.id}
                          </span>
                          <span className="text-[11px] text-gray-400 block">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                            isDelivered
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'verifying'
                              ? 'bg-amber-100 text-amber-800'
                              : order.status === 'processing'
                              ? 'bg-blue-100 text-blue-800'
                              : order.status === 'cancelled'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          {isDelivered
                            ? (lang === 'bn' ? 'ডেলিভার্ড' : 'Delivered')
                            : order.status === 'verifying'
                            ? t.statusVerifying
                            : order.status === 'processing'
                            ? t.statusProcessing
                            : order.status}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="space-y-1 border-t border-gray-200/60 pt-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs text-gray-700">
                            <span>
                              {item.productTitle} -{' '}
                              <span className="text-emerald-600 font-semibold">
                                {item.variantName}
                              </span>
                            </span>
                            <span className="font-bold">৳{item.unitPrice * item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {/* Payment and Trx Info */}
                      <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-200/60">
                        <span>
                          {order.paymentMethod.toUpperCase()} | TrxID: {order.trxId}
                        </span>
                        <span className="font-black text-gray-900 text-sm">৳{order.totalAmount}</span>
                      </div>

                      {/* Digital Product Delivery Action Box */}
                      {isDelivered && (
                        <div className="bg-emerald-50 rounded-xl p-3.5 border border-emerald-200 space-y-2.5 mt-2 animate-in fade-in">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="text-xs font-black text-emerald-950">
                                {lang === 'bn' ? 'ডিজিটাল প্রোডাক্ট ডেলিভারি সম্পন্ন' : 'Digital Product Ready for Download'}
                              </span>
                            </div>
                            <span className="text-[10px] bg-emerald-200/70 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                              Verified
                            </span>
                          </div>

                          {/* Option 1: File Download */}
                          {isFileDelivery && (
                            <div className="bg-white p-3 rounded-lg border border-emerald-200/70 flex flex-wrap items-center justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <FileArchive className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <span className="text-xs font-bold text-gray-900 truncate">
                                    {delivery?.fileName || 'Product Download Package'}
                                  </span>
                                </div>
                                {delivery?.fileSize && (
                                  <span className="text-[10px] text-gray-500 block">
                                    Size: {(delivery.fileSize / (1024 * 1024)).toFixed(1)} MB • {delivery.downloadCount || 0} / {delivery.downloadLimit || 5} downloads
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDownload(order.id)}
                                disabled={downloadingOrderId === order.id}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                              >
                                {downloadingOrderId === order.id ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Generating Link...</span>
                                  </>
                                ) : (
                                  <>
                                    <Download className="w-3.5 h-3.5" />
                                    <span>{lang === 'bn' ? 'ফাইল ডাউনলোড করুন' : 'Download Product'}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {/* Option 2: Credentials / License Keys */}
                          {keyText && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-gray-700 flex items-center gap-1">
                                  <Key className="w-3.5 h-3.5 text-amber-600" />
                                  <span>{lang === 'bn' ? 'অ্যাকাউন্ট / লাইসেন্স কি:' : 'Account / License Key:'}</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(keyText)}
                                  className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer text-[11px]"
                                >
                                  {copiedKey === keyText ? (
                                    <>
                                      <Check className="w-3 h-3" />
                                      <span>{t.copied}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>{t.copyKey}</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <div className="p-2.5 bg-slate-900 text-amber-300 font-mono text-xs rounded-lg select-all break-all whitespace-pre-wrap">
                                {keyText}
                              </div>
                            </div>
                          )}

                          {/* Option 3: External Access URL */}
                          {accessUrl && accessUrl.startsWith('http') && (
                            <div className="bg-white p-3 rounded-lg border border-emerald-200/70 flex flex-wrap items-center justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <ExternalLink className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <span className="text-xs font-bold text-gray-900 truncate">
                                    {lang === 'bn' ? 'এক্সটার্নাল ড্রাইভ / অ্যাক্সেস লিঙ্ক' : 'External Drive / Access Link'}
                                  </span>
                                </div>
                                <span className="text-[10px] text-gray-500 block truncate max-w-xs sm:max-w-sm font-mono">
                                  {accessUrl}
                                </span>
                              </div>

                              <a
                                href={accessUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer inline-flex items-center gap-1.5 shadow-xs transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>{lang === 'bn' ? 'ড্রাইভ / লিঙ্ক খুলুন' : 'Open Access Link'}</span>
                              </a>
                            </div>
                          )}

                          {/* Delivery Notes */}
                          {delivery?.notes && (
                            <p className="text-[11px] text-gray-600 italic bg-emerald-100/50 p-2 rounded-lg">
                              Note: {delivery.notes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: MY DIGITAL KEYS & DOWNLOADS */}
          {activeTab === 'keys' && (
            <div className="space-y-3">
              {myOrders.filter((o) => o.status === 'delivered' || o.status === 'completed').length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <DownloadCloud className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-bold">
                    {lang === 'bn'
                      ? 'অর্ডার অনুমোদনের পর ডিজিটাল ফাইল ও অ্যাক্সেস কি এখানে পাওয়া যাবে।'
                      : 'Digital products and download files will appear here once orders are delivered.'}
                  </p>
                </div>
              ) : (
                myOrders
                  .filter((o) => o.status === 'delivered' || o.status === 'completed')
                  .map((o) => {
                    const delivery = deliveries[o.id];
                    const keyText =
                      delivery?.credentialsOrKey ||
                      o.digitalDeliveries?.[0]?.credentialsOrKey ||
                      '';

                    return (
                      <div
                        key={o.id}
                        className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                          <div>
                            <span className="text-xs font-bold text-emerald-400 block">
                              {o.items.map((i) => i.productTitle).join(', ')}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              Order #{o.id} • {new Date(o.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          {(delivery?.fileName || delivery?.storagePath || delivery?.downloadUrl) && (
                            <button
                              type="button"
                              onClick={() => handleDownload(o.id)}
                              disabled={downloadingOrderId === o.id}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                            >
                              {downloadingOrderId === o.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                              <span>Download File</span>
                            </button>
                          )}
                        </div>

                        {/* License / Credentials Display */}
                        {keyText && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-bold text-gray-400">
                                License Key / Credentials
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(keyText)}
                                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                              >
                                {copiedKey === keyText ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>{t.copied}</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>{t.copyKey}</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <div className="bg-slate-950 p-3 rounded-xl font-mono text-amber-300 text-xs break-all select-all whitespace-pre-wrap border border-slate-800">
                              {keyText}
                            </div>
                          </div>
                        )}

                        {/* External link if present */}
                        {delivery?.downloadUrl && delivery.downloadUrl.startsWith('http') && !delivery.fileName && (
                          <a
                            href={delivery.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open Digital Access Link</span>
                          </a>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          )}

          {/* TAB 3: WARRANTY CLAIM / SUPPORT */}
          {activeTab === 'support' && (
            <form onSubmit={handleTicketSubmit} className="space-y-4">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {lang === 'bn'
                    ? '১০০% রিপ্লেসমেন্ট ওয়ারেন্টি: অ্যাকাউন্টে কোনো সমস্যা হলে আমাদের দ্রুত জানান।'
                    : '100% Replacement Warranty: Submit your ticket for fast resolution.'}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">
                  {lang === 'bn' ? 'অর্ডার নম্বর (ঐচ্ছিক)' : 'Linked Order ID (Optional)'}
                </label>
                <input
                  type="text"
                  value={ticketOrder}
                  onChange={(e) => setTicketOrder(e.target.value)}
                  placeholder="e.g. DPS-84921"
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-hidden focus:border-emerald-600 font-mono uppercase"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">
                  {lang === 'bn' ? 'সমস্যার বিষয়' : 'Subject / Issue'} *
                </label>
                <input
                  type="text"
                  required
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="e.g. Netflix profile PIN expired or Canva invite link expired"
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">
                  {lang === 'bn' ? 'বিস্তারিত লিখুন' : 'Detailed Message'} *
                </label>
                <textarea
                  required
                  rows={3}
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="Describe your issue with error screenshot details..."
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-hidden focus:border-emerald-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>{t.submitTicket}</span>
              </button>
            </form>
          )}

          {/* TAB 4: PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-500">{t.fullName}</span>
                <span className="font-bold text-gray-900">{currentUser.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-500">{t.email}</span>
                <span className="font-bold text-gray-900">{currentUser.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-500">{t.phoneWhatsApp}</span>
                <span className="font-bold text-gray-900">{currentUser.phone}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Account Role</span>
                <span className="font-bold uppercase text-emerald-700">{currentUser.role}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Key,
  ShieldCheck,
  User as UserIcon,
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
  MessageSquare,
  Edit2,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ComplaintStatus } from '../types';

export const UserDashboardModal: React.FC = () => {
  const {
    isUserDashboardOpen,
    setIsUserDashboardOpen,
    currentUser,
    orders,
    deliveries,
    requestSecureDownload,
    complaints,
    submitComplaint,
    updateCustomerProfile,
    showToast,
    lang,
    t,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'keys' | 'support' | 'profile'>('orders');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);

  // Support complaint form
  const [ticketOrder, setTicketOrder] = useState('');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // Profile editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name);
      setEditPhone(currentUser.phone || '');
    }
  }, [currentUser]);

  if (!isUserDashboardOpen || !currentUser) return null;

  // Filter orders related to this user
  const myOrders = orders.filter(
    (o) =>
      o.userId === currentUser.id ||
      o.customerEmail.toLowerCase() === currentUser.email.toLowerCase() ||
      (currentUser.phone && o.customerPhone === currentUser.phone) ||
      currentUser.role === 'admin'
  );

  // Filter complaints for this user
  const myComplaints = complaints.filter((c) => c.userId === currentUser.id);

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

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      showToast(
        lang === 'bn' ? 'অনুগ্রহ করে বিষয় এবং বিস্তারিত মেসেজ লিখুন' : 'Please provide subject and message',
        'error'
      );
      return;
    }
    setIsSubmittingTicket(true);
    try {
      await submitComplaint({
        subject: ticketSubject.trim(),
        message: ticketMessage.trim(),
        orderId: ticketOrder.trim() || undefined,
      });
      setTicketSubject('');
      setTicketMessage('');
      setTicketOrder('');
    } catch (err) {
      console.error('Complaint submit error:', err);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      showToast(lang === 'bn' ? 'নাম খালি রাখা যাবে না' : 'Name cannot be empty', 'error');
      return;
    }
    setIsSavingProfile(true);
    try {
      await updateCustomerProfile({
        name: editName.trim(),
        phone: editPhone.trim(),
      });
      setIsEditingProfile(false);
    } catch (err) {
      console.error('Profile update error:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            ⏳ {lang === 'bn' ? 'অপেক্ষমাণ' : 'Pending'}
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            ⚙️ {lang === 'bn' ? 'প্রক্রিয়াধীন' : 'In Progress'}
          </span>
        );
      case 'resolved':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            ✅ {lang === 'bn' ? 'সমাধানকৃত' : 'Resolved'}
          </span>
        );
      case 'closed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-300">
            🔒 {lang === 'bn' ? 'বন্ধ' : 'Closed'}
          </span>
        );
      default:
        return null;
    }
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
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-gray-900">{t.dashboard}</h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {currentUser.name} ({currentUser.email})
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsUserDashboardOpen(false)}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer transition-colors"
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
            <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold">
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
            <span>{lang === 'bn' ? 'অভিযোগ ও ওয়ারেন্টি সাপোর্ট' : 'Complaints & Support'}</span>
            {myComplaints.length > 0 && (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold">
                {myComplaints.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'profile'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <UserIcon className="w-4 h-4" />
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

                  return (
                    <div
                      key={order.id}
                      className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            Order ID
                          </span>
                          <span className="text-xs font-black text-gray-900 font-mono">
                            #{order.orderId || order.id}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 block">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Recent'}
                          </span>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isDelivered
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.status === 'processing'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-gray-800 font-medium">
                              {item.productTitle || item.productName} ({item.variantName}) x {item.quantity}
                            </span>
                            <span className="font-bold text-gray-900">
                              ৳{item.unitPrice || item.price}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-gray-200 text-xs">
                        <span className="text-gray-500 font-medium">Total Paid:</span>
                        <span className="font-black text-emerald-700">৳{order.totalAmount}</span>
                      </div>

                      {/* Quick access action */}
                      {isDelivered && (
                        <div className="pt-1 flex gap-2">
                          <button
                            onClick={() => setActiveTab('keys')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>View Credentials / Key</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: DIGITAL ACCESS & KEYS */}
          {activeTab === 'keys' && (
            <div className="space-y-4">
              {myOrders.filter((o) => o.status === 'delivered' || o.status === 'completed').length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Key className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-bold">
                    {lang === 'bn'
                      ? 'এখনো কোনো ডিজিটাল ডেলিভারি সম্পন্ন হয়নি।'
                      : 'No delivered keys or credentials found yet.'}
                  </p>
                </div>
              ) : (
                myOrders
                  .filter((o) => o.status === 'delivered' || o.status === 'completed')
                  .map((order) => {
                    const delivery = deliveries[order.id];
                    const keyText =
                      delivery?.credentials ||
                      delivery?.licenseKey ||
                      delivery?.credentialsOrKey ||
                      order.digitalDeliveries?.[0]?.credentialsOrKey ||
                      order.deliveryNotes ||
                      '';

                    return (
                      <div
                        key={order.id}
                        className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl space-y-3 border border-slate-800 shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-emerald-400 font-mono font-bold block uppercase">
                              Order #{order.orderId || order.id}
                            </span>
                            <h4 className="text-sm font-bold text-white">
                              {order.items[0]?.productTitle || order.items[0]?.productName}
                            </h4>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Delivered
                          </span>
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

          {/* TAB 3: WARRANTY CLAIM / COMPLAINTS */}
          {activeTab === 'support' && (
            <div className="space-y-6">
              {/* Complaint Submission Form */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {lang === 'bn'
                      ? '১০০% রিপ্লেসমেন্ট ওয়ারেন্টি ও কমপ্লেইন বক্স: যেকোনো সমস্যায় আমাদের জানান, অ্যাডমিন টিম সরাসরি সমাধান দেবে।'
                      : '100% Replacement Warranty & Support Ticket: Submit your complaint for fast resolution.'}
                  </span>
                </div>

                <form onSubmit={handleTicketSubmit} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      {lang === 'bn' ? 'অর্ডার নম্বর (ঐচ্ছিক)' : 'Linked Order ID (Optional)'}
                    </label>
                    {myOrders.length > 0 ? (
                      <select
                        value={ticketOrder}
                        onChange={(e) => setTicketOrder(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-hidden focus:border-emerald-600"
                      >
                        <option value="">
                          {lang === 'bn' ? '-- অর্ডার সিলেক্ট করুন বা খালি রাখুন --' : '-- Select Order or Leave Blank --'}
                        </option>
                        {myOrders.map((o) => (
                          <option key={o.id} value={o.orderId || o.id}>
                            #{o.orderId || o.id} - {o.items[0]?.productTitle || 'Digital Item'} (৳{o.totalAmount})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={ticketOrder}
                        onChange={(e) => setTicketOrder(e.target.value)}
                        placeholder="e.g. DPS-84921"
                        className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-hidden focus:border-emerald-600 font-mono uppercase"
                      />
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      {lang === 'bn' ? 'অভিযোগের বিষয়' : 'Complaint Subject / Issue'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder={
                        lang === 'bn'
                          ? 'যেমন: নেটফ্লিক্স প্রোফাইল পাসওয়ার্ড কাজ করছে না বা ক্যানভা ইনভাইট লিংক মেয়াদোত্তীর্ণ'
                          : 'e.g. Netflix PIN expired or Canva invite link invalid'
                      }
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-hidden focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      {lang === 'bn' ? 'বিস্তারিত অভিযোগ / মেসেজ' : 'Detailed Complaint / Message'} *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      placeholder={
                        lang === 'bn'
                          ? 'আপনার অ্যাকাউন্টের সমস্যা বিস্তারিত লিখুন (এরর মেসেজ, স্ক্রিনশটের বিবরণ ইত্যাদি)...'
                          : 'Describe the issue encountered with details...'
                      }
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-hidden focus:border-emerald-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingTicket}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {isSubmittingTicket
                        ? lang === 'bn'
                          ? 'জমা হচ্ছে...'
                          : 'Submitting...'
                        : lang === 'bn'
                        ? 'অভিযোগ জমা দিন'
                        : 'Submit Complaint'}
                    </span>
                  </button>
                </form>
              </div>

              {/* Customer's Existing Complaints List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>{lang === 'bn' ? 'আমার অভিযোগসমূহ' : 'My Complaints & Replies'}</span>
                  </h3>
                  <span className="text-[11px] text-gray-500 font-mono font-bold">
                    {myComplaints.length} Total
                  </span>
                </div>

                {myComplaints.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-2xl border border-gray-200 text-gray-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-1 text-gray-300" />
                    <p className="text-xs font-medium">
                      {lang === 'bn'
                        ? 'আপনার কোনো সক্রিয় অভিযোগ নেই।'
                        : 'You have not submitted any complaints.'}
                    </p>
                  </div>
                ) : (
                  myComplaints.map((c) => (
                    <div
                      key={c.id}
                      className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-gray-900">
                            #{c.id}
                          </span>
                          {c.orderId && (
                            <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                              Order: #{c.orderId}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                          {getStatusBadge(c.status)}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-gray-900 mb-1">{c.subject}</h4>
                        <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                          {c.message}
                        </p>
                      </div>

                      {/* Official Admin Reply */}
                      {c.adminReply ? (
                        <div className="mt-3 p-3.5 bg-emerald-50/90 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold flex items-center gap-1.5 text-emerald-800 text-[11px]">
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                              <span>{lang === 'bn' ? 'অ্যাডমিন রিপ্লাই' : 'Admin Response'}</span>
                            </span>
                            {c.updatedAt && (
                              <span className="text-[10px] text-emerald-700">
                                {new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <p className="whitespace-pre-wrap leading-relaxed font-medium">
                            {c.adminReply}
                          </p>
                        </div>
                      ) : (
                        <div className="text-[11px] text-gray-400 italic flex items-center gap-1.5 pt-1">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>
                            {lang === 'bn'
                              ? 'অ্যাডমিন রিভিউ করছে। খুব শীঘ্রই উত্তর দেওয়া হবে।'
                              : 'Awaiting admin response (usually 5-15 mins).'}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <h3 className="font-bold text-gray-900 text-sm">
                  {lang === 'bn' ? 'প্রোফাইল তথ্য' : 'Profile Information'}
                </h3>
                {!isEditingProfile ? (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-emerald-700 hover:border-emerald-300 font-bold text-xs cursor-pointer shadow-2xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'এডিট করুন' : 'Edit Profile'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="text-gray-500 hover:text-gray-800 text-xs font-bold cursor-pointer"
                  >
                    {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-600 block mb-1">
                      {t.fullName} *
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl outline-hidden focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-600 block mb-1">
                      {t.phoneWhatsApp}
                    </label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="e.g. 01712345678"
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl outline-hidden focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-600 block mb-1">
                      {t.email} ({lang === 'bn' ? 'পরিবর্তন অযোগ্য' : 'Read-only'})
                    </label>
                    <input
                      type="email"
                      disabled
                      value={currentUser.email}
                      className="w-full px-3 py-2 text-xs bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-600 block mb-1">
                      Role ({lang === 'bn' ? 'সিস্টেম নির্ধারিত' : 'System Assigned'})
                    </label>
                    <input
                      type="text"
                      disabled
                      value={currentUser.role}
                      className="w-full px-3 py-2 text-xs bg-gray-100 border border-gray-200 rounded-xl font-bold uppercase text-emerald-800 cursor-not-allowed"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      {lang === 'bn'
                        ? 'গ্রাহক হিসেবে আপনি নিজের রোল পরিবর্তন করতে পারবেন না।'
                        : 'Customers cannot modify their account role.'}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSavingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
                  </button>
                </form>
              ) : (
                <div className="space-y-3">
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
                    <span className="font-bold text-gray-900">
                      {currentUser.phone || (lang === 'bn' ? 'যুক্ত করা হয়নি' : 'Not set')}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">Account Role</span>
                    <span className="font-black uppercase tracking-wider text-emerald-700 px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-200">
                      {currentUser.role}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

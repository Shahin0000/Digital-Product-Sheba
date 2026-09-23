import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Package,
  Truck,
  Settings,
  ShieldCheck,
  X,
  Search,
  Plus,
  Pencil,
  Trash2,
  Check,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  Copy,
  Save,
  RefreshCw,
  SlidersHorizontal,
  Eye,
  Send,
  DollarSign,
  UserPlus,
  UserMinus,
  ShieldAlert,
  Key,
  FileText,
  Lock,
  CheckCheck,
  MessageSquare,
  Sparkles,
  LifeBuoy,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Order, OrderStatus, Product, User, AdminUser, DeliveryRecord, Complaint, ComplaintStatus } from '../types';
import { AdminProductFormModal } from './AdminProductFormModal';

type AdminTab = 'dashboard' | 'users' | 'products' | 'orders' | 'deliveries' | 'complaints' | 'settings' | 'admins';

export const AdminDashboardModal: React.FC = () => {
  const {
    isAdminDashboardOpen,
    setIsAdminDashboardOpen,
    currentUser,
    orders,
    updateOrderStatus,
    deliverOrder,
    resendNotification,
    deliveries,
    allDeliveries,
    isDeliveringOrder,
    products,
    categories,
    deleteProduct,
    updateProduct,
    siteSettings,
    updateSiteSettings,
    allUsers,
    updateUserByAdmin,
    deleteUserByAdmin,
    allAdmins,
    addAdminUser,
    removeAdminUser,
    toggleProductStatus,
    updateProductStock,
    updateProductPrice,
    saveDeliveryRecord,
    updateOrderAdminNotes,
    deleteOrder,
    complaints,
    updateComplaintByAdmin,
    deleteComplaintByAdmin,
    showToast,
    lang,
    t,
  } = useStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // Complaints State
  const [complaintSearch, setComplaintSearch] = useState('');
  const [complaintStatusFilter, setComplaintStatusFilter] = useState<'all' | ComplaintStatus>('all');
  const [replyInputMap, setReplyInputMap] = useState<Record<string, string>>({});
  const [updatingComplaintId, setUpdatingComplaintId] = useState<string | null>(null);

  // Products Modal & Quick Edit
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [quickEditVariant, setQuickEditVariant] = useState<{
    productId: string;
    variantId: string;
    regularPrice: number;
    salePrice: number;
    stockCount: number;
  } | null>(null);

  // Users Filter & Promotion
  const [userSearch, setUserSearch] = useState('');
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
  const [newAdminUserId, setNewAdminUserId] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');

  // Orders Filters & Modals
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrderForView, setSelectedOrderForView] = useState<Order | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');

  // Delivery Management
  const [deliverySearch, setDeliverySearch] = useState('');
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState<Order | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<'credentials' | 'file' | 'license_key' | 'link'>('credentials');
  const [deliveryContentInput, setDeliveryContentInput] = useState('');
  const [deliveryNotesInput, setDeliveryNotesInput] = useState('');
  const [viewDeliveryContentModal, setViewDeliveryContentModal] = useState<DeliveryRecord | null>(null);

  // Global Settings Form State
  const [settingsForm, setSettingsForm] = useState({
    siteName: siteSettings.siteName || 'Digital Product Sheba',
    supportPhone: siteSettings.supportPhone || '+880 1700-000000',
    supportEmail: siteSettings.supportEmail || 'support@digitalproductsheba.com',
    whatsappSupportNumber: siteSettings.whatsappSupportNumber || '+8801700000000',
    bkashNumber: siteSettings.bkashNumber || '01712345678',
    nagadNumber: siteSettings.nagadNumber || '01812345678',
    rocketNumber: siteSettings.rocketNumber || '01912345678',
    deliveryNoticeBn: siteSettings.deliveryNoticeBn || 'অর্ডার অনুমোদনের ৫-১৫ মিনিটের মধ্যে ডিজিটাল ডেলিভারি পাবেন।',
    deliveryNoticeEn: siteSettings.deliveryNoticeEn || 'Instant digital delivery within 5-15 minutes of payment verification.',
    maintenanceMode: siteSettings.maintenanceMode || false,
  });

  // Strict Access Guard: Only admin users can render Admin Panel
  if (!isAdminDashboardOpen || !currentUser || currentUser.role !== 'admin') {
    return null;
  }

  // --- STATS CALCULATION ---
  const totalUsers = allUsers.length;
  const totalProducts = products.length;
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'verifying').length;
  const processingOrders = orders.filter((o) => o.status === 'processing').length;
  const completedOrders = orders.filter((o) => o.status === 'completed').length;
  const totalDeliveries = allDeliveries.length;
  const totalComplaints = complaints.length;
  const pendingComplaintsCount = complaints.filter((c) => c.status === 'pending').length;
  const totalSales = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Recent 8 Orders
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 8);

  // Filtered Users
  const filteredUsers = allUsers.filter((u) => {
    const q = userSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q)) ||
      u.id.toLowerCase().includes(q)
    );
  });

  // Filtered Products
  const filteredProducts = products.filter((prod) => {
    const matchesCategory =
      productCategoryFilter === 'all' || prod.categoryId === productCategoryFilter;
    const q = productSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      prod.titleEn.toLowerCase().includes(q) ||
      prod.titleBn.toLowerCase().includes(q) ||
      prod.id.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus =
      orderStatusFilter === 'all'
        ? true
        : orderStatusFilter === 'pending'
        ? o.status === 'pending' || o.status === 'verifying'
        : o.status === orderStatusFilter;

    const q = orderSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (o.orderId && o.orderId.toLowerCase().includes(q)) ||
      o.id.toLowerCase().includes(q) ||
      (o.customerPhone && o.customerPhone.includes(q)) ||
      (o.trxId && o.trxId.toLowerCase().includes(q)) ||
      (o.customerName && o.customerName.toLowerCase().includes(q)) ||
      (o.customerEmail && o.customerEmail.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  // Filtered Deliveries
  const filteredDeliveries = allDeliveries.filter((d) => {
    const q = deliverySearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (d.orderId && d.orderId.toLowerCase().includes(q)) ||
      (d.userId && d.userId.toLowerCase().includes(q)) ||
      (d.id && d.id.toLowerCase().includes(q)) ||
      (d.productTitle && d.productTitle.toLowerCase().includes(q))
    );
  });

  // Handlers
  const handleOpenDeliveryModal = (order: Order) => {
    setSelectedOrderForDelivery(order);
    const existing = deliveries[order.id];
    const primaryItem = order.items && order.items.length > 0 ? order.items[0] : null;
    const prod = products.find((p) => p.id === primaryItem?.productId);
    const matchedVariant = prod?.variants?.find((v) => v.id === primaryItem?.variantId);

    // Retrieve the product's existing: External Access Link (e.g. Google Drive URL)
    const productExternalLink = (
      prod?.externalAccessUrl ||
      (prod as any)?.externalAccessLink ||
      (prod as any)?.downloadLink ||
      ''
    ).trim();

    if (existing) {
      const existingLink =
        existing.externalAccessUrl ||
        (existing as any)?.externalAccessLink ||
        existing.downloadLink ||
        existing.downloadUrl ||
        '';

      if (existingLink) {
        setDeliveryMode('link');
        setDeliveryContentInput(existingLink);
      } else {
        setDeliveryMode(
          (existing.deliveryType as 'credentials' | 'file' | 'license_key' | 'link') || 'credentials'
        );
        setDeliveryContentInput(
          existing.credentialsOrKey || existing.credentials || existing.licenseKey || ''
        );
      }
      setDeliveryNotesInput(existing.notes || existing.adminNotes || '');
    } else {
      // 1. If product has an External Access Link, automatically populate it
      if (productExternalLink) {
        setDeliveryMode('link');
        setDeliveryContentInput(productExternalLink);
      } else if (prod?.downloadAccessType === 'external_link') {
        setDeliveryMode('link');
        setDeliveryContentInput('');
        showToast(
          lang === 'bn'
            ? 'এই প্রোডাক্টের External Access Link দেওয়া হয়নি।'
            : 'No External Access Link configured for this product.',
          'info'
        );
      } else if (matchedVariant?.sampleKey) {
        setDeliveryMode('credentials');
        setDeliveryContentInput(matchedVariant.sampleKey);
      } else if (prod?.digitalFileUrl) {
        setDeliveryMode('file');
        setDeliveryContentInput(prod.digitalFileUrl);
      } else {
        setDeliveryMode('link');
        setDeliveryContentInput('');
        showToast(
          lang === 'bn'
            ? 'এই প্রোডাক্টের External Access Link দেওয়া হয়নি।'
            : 'No External Access Link configured for this product.',
          'info'
        );
      }
      setDeliveryNotesInput(
        lang === 'bn'
          ? 'Digital Product Sheba থেকে সফলভাবে ডেলিভারি করা হয়েছে।'
          : 'Delivered securely by Digital Product Sheba.'
      );
    }
  };

  const handleSaveDeliverySubmit = async () => {
    if (!selectedOrderForDelivery) return;

    // 1. Validate that the customer/order exists
    if (!selectedOrderForDelivery.id) {
      showToast(lang === 'bn' ? 'অর্ডার তথ্য সঠিক নয়' : 'Order information invalid', 'error');
      return;
    }

    const primaryItem = selectedOrderForDelivery.items && selectedOrderForDelivery.items.length > 0
      ? selectedOrderForDelivery.items[0]
      : null;

    // 2. Validate that an External Access Link / delivery content exists
    const cleanContent = deliveryContentInput.trim();
    if (!cleanContent) {
      showToast(
        lang === 'bn'
          ? 'এই প্রোডাক্টের External Access Link দেওয়া হয়নি।'
          : 'No External Access Link provided for this product.',
        'error'
      );
      return;
    }

    try {
      // 3. deliverOrder handles:
      // - Updating orders/{orderId} status to 'delivered' and digitalDeliveries
      // - Creating/updating deliveries/{deliveryId} with correct fields
      // - Dispatching notifications
      // - Refreshing order list and delivery list
      // - Showing 'Delivery successful'
      await deliverOrder(
        selectedOrderForDelivery.id,
        deliveryMode === 'link'
          ? {
              deliveryMethod: 'external_link',
              externalAccessUrl: cleanContent,
              notes: deliveryNotesInput.trim(),
            }
          : deliveryMode === 'file'
          ? {
              deliveryMethod: 'file',
              fileName: `${primaryItem?.productTitle || 'Digital-Item'}.zip`,
              fileUrl: cleanContent,
              notes: deliveryNotesInput.trim(),
            }
          : {
              deliveryMethod: 'credentials',
              credentials: cleanContent,
              credentialsOrKey: cleanContent,
              notes: deliveryNotesInput.trim(),
            }
      );

      setSelectedOrderForDelivery(null);
    } catch (err) {
      console.error('Error delivering order:', err);
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg || (lang === 'bn' ? 'ডেলিভারি ব্যর্থ হয়েছে' : 'Delivery failed'), 'error');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSiteSettings(settingsForm);
      showToast(
        lang === 'bn' ? 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে!' : 'Settings updated successfully!',
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast(lang === 'bn' ? 'সেটিংস সংরক্ষণে ব্যর্থ' : 'Failed to save settings', 'error');
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(lang === 'bn' ? 'কপি করা হয়েছে!' : 'Copied to clipboard!', 'success');
  };

  return (
    <div
      id="admin-dashboard-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-7xl h-[94vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* HEADER BAR */}
        <header className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">
                  {lang === 'bn' ? 'অ্যাডমিন কন্ট্রোল প্যানেল' : 'Admin Control Panel'}
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full">
                  Verified Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {currentUser.name} • {currentUser.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAdminDashboardOpen(false)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close Admin Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* MAIN BODY: SIDEBAR + CONTENT */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* SIDEBAR */}
          <aside className="w-full md:w-64 bg-slate-950/60 border-b md:border-b-0 md:border-r border-slate-800/80 p-3 flex md:flex-col gap-1.5 shrink-0 overflow-x-auto md:overflow-y-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>📊 Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'users'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>👥 Users</span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {allUsers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'products'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span>🛍️ Products</span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {products.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Package className="w-4 h-4 shrink-0" />
              <span>📦 Orders</span>
              {pendingOrders > 0 && (
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                  {pendingOrders}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('deliveries')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'deliveries'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Truck className="w-4 h-4 shrink-0" />
              <span>🚚 Deliveries</span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {allDeliveries.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('complaints')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'complaints'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <LifeBuoy className="w-4 h-4 shrink-0" />
              <span>💬 Complaints</span>
              {pendingComplaintsCount > 0 ? (
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                  {pendingComplaintsCount}
                </span>
              ) : (
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {totalComplaints}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>⚙️ Settings</span>
            </button>

            <button
              onClick={() => setActiveTab('admins')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'admins'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>🔐 Admins</span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {allAdmins.length}
              </span>
            </button>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-900/50">
            {/* ---------------------------------------------------- */}
            {/* TAB 1: DASHBOARD */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {lang === 'bn' ? 'ওভারভিউ ও অ্যানালিটিক্স' : 'Dashboard Overview'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time operational summary from Firebase Firestore.
                  </p>
                </div>

                {/* METRICS GRID (Exact 8 metrics) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {/* Total Users */}
                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-xs font-medium text-slate-400">Total Users</span>
                    <div className="text-2xl font-black text-white mt-2 font-mono">
                      {totalUsers}
                    </div>
                    <span className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                      <Users className="w-3 h-3" /> Registered accounts
                    </span>
                  </div>

                  {/* Total Products */}
                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-xs font-medium text-slate-400">Total Products</span>
                    <div className="text-2xl font-black text-white mt-2 font-mono">
                      {totalProducts}
                    </div>
                    <span className="text-[11px] text-teal-400 mt-1 flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3" /> Catalog items
                    </span>
                  </div>

                  {/* Total Orders */}
                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-xs font-medium text-slate-400">Total Orders</span>
                    <div className="text-2xl font-black text-white mt-2 font-mono">
                      {totalOrders}
                    </div>
                    <span className="text-[11px] text-cyan-400 mt-1 flex items-center gap-1">
                      <Package className="w-3 h-3" /> Lifetime submissions
                    </span>
                  </div>

                  {/* Pending Orders */}
                  <div className="bg-slate-800/60 border border-amber-500/30 rounded-xl p-4 flex flex-col justify-between bg-amber-500/5">
                    <span className="text-xs font-medium text-amber-300">Pending Orders</span>
                    <div className="text-2xl font-black text-amber-400 mt-2 font-mono">
                      {pendingOrders}
                    </div>
                    <span className="text-[11px] text-amber-300/80 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Needs verification
                    </span>
                  </div>

                  {/* Processing Orders */}
                  <div className="bg-slate-800/60 border border-blue-500/30 rounded-xl p-4 flex flex-col justify-between bg-blue-500/5">
                    <span className="text-xs font-medium text-blue-300">Processing Orders</span>
                    <div className="text-2xl font-black text-blue-400 mt-2 font-mono">
                      {processingOrders}
                    </div>
                    <span className="text-[11px] text-blue-300/80 mt-1 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" /> In fulfillment
                    </span>
                  </div>

                  {/* Completed Orders */}
                  <div className="bg-slate-800/60 border border-emerald-500/30 rounded-xl p-4 flex flex-col justify-between bg-emerald-500/5">
                    <span className="text-xs font-medium text-emerald-300">Completed Orders</span>
                    <div className="text-2xl font-black text-emerald-400 mt-2 font-mono">
                      {completedOrders}
                    </div>
                    <span className="text-[11px] text-emerald-300/80 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Fully fulfilled
                    </span>
                  </div>

                  {/* Total Deliveries */}
                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-xs font-medium text-slate-400">Total Deliveries</span>
                    <div className="text-2xl font-black text-white mt-2 font-mono">
                      {totalDeliveries}
                    </div>
                    <span className="text-[11px] text-purple-400 mt-1 flex items-center gap-1">
                      <Truck className="w-3 h-3" /> Dispatched items
                    </span>
                  </div>

                  {/* Total Sales */}
                  <div className="bg-slate-800/60 border border-emerald-600/40 rounded-xl p-4 flex flex-col justify-between bg-emerald-500/10">
                    <span className="text-xs font-semibold text-emerald-300">Total Sales</span>
                    <div className="text-2xl font-black text-emerald-400 mt-2 font-mono">
                      ৳{totalSales.toLocaleString()}
                    </div>
                    <span className="text-[11px] text-emerald-300/80 mt-1 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> Verified revenue
                    </span>
                  </div>
                </div>

                {/* RECENT ORDERS TABLE */}
                <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-700/60 flex items-center justify-between">
                    <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                      <Package className="w-4 h-4 text-emerald-400" />
                      Recent Orders
                    </h3>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
                    >
                      View all orders →
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-700/60">
                        <tr>
                          <th className="px-4 py-3">Order ID</th>
                          <th className="px-4 py-3">Customer</th>
                          <th className="px-4 py-3">Payment & TrxID</th>
                          <th className="px-4 py-3">Amount</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/40">
                        {recentOrders.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                              No orders found in Firestore yet.
                            </td>
                          </tr>
                        ) : (
                          recentOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="px-4 py-3 font-mono font-bold text-white">
                                #{order.orderId || order.id.substring(0, 8)}
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-medium text-slate-200">
                                  {order.customerName}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {order.customerPhone}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="uppercase font-semibold text-emerald-400">
                                  {order.paymentMethod}
                                </span>
                                <div className="font-mono text-[11px] text-slate-400">
                                  {order.trxId || 'N/A'}
                                </div>
                              </td>
                              <td className="px-4 py-3 font-bold text-white font-mono">
                                ৳{order.totalAmount}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase ${
                                    order.status === 'completed'
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                      : order.status === 'processing'
                                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                      : order.status === 'cancelled'
                                      ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                  }`}
                                >
                                  {order.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-400 text-[11px]">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => handleOpenDeliveryModal(order)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors"
                                >
                                  Deliver
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB 2: USERS */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'users' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {lang === 'bn' ? 'ব্যবহারকারী তালিকা' : 'User Accounts'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Manage registered customers, roles, and administrative access.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search name, email, phone, ID..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-700/60">
                        <tr>
                          <th className="px-4 py-3">User</th>
                          <th className="px-4 py-3">Contact</th>
                          <th className="px-4 py-3">Role</th>
                          <th className="px-4 py-3">Joined Date</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/40">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                              No users match your criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="px-4 py-3">
                                <div className="font-semibold text-white">{user.name}</div>
                                <div className="text-[11px] font-mono text-slate-500 truncate max-w-[200px]">
                                  {user.id}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-slate-200">{user.email || 'No email'}</div>
                                <div className="text-[11px] text-slate-400">
                                  {user.phone || 'No phone'}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={user.role}
                                  onChange={(e) =>
                                    updateUserByAdmin(user.id, {
                                      role: e.target.value as 'admin' | 'customer',
                                    })
                                  }
                                  disabled={user.id === currentUser.id}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase border cursor-pointer ${
                                    user.role === 'admin'
                                      ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                                      : 'bg-slate-800 text-slate-300 border-slate-700'
                                  }`}
                                >
                                  <option value="customer" className="bg-slate-900 text-slate-200">
                                    Customer
                                  </option>
                                  <option value="admin" className="bg-slate-900 text-purple-300 font-bold">
                                    Admin
                                  </option>
                                </select>
                              </td>
                              <td className="px-4 py-3 text-slate-400 text-[11px]">
                                {user.joinedDate || 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {user.id !== currentUser.id ? (
                                  <button
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          `Are you sure you want to delete user "${user.name}"?`
                                        )
                                      ) {
                                        deleteUserByAdmin(user.id);
                                      }
                                    }}
                                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                    title="Delete User"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-slate-500 italic">
                                    Active (You)
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB 3: PRODUCTS */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'products' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {lang === 'bn' ? 'প্রোডাক্ট ব্যবস্থাপনা' : 'Products Management'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Enable/disable products, adjust stock, pricing, and catalog details.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setProductToEdit(null);
                        setIsProductFormOpen(true);
                      }}
                      className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Add Product
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search products by English/Bangla name..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="w-full sm:w-48 px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Products Table */}
                <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-700/60">
                        <tr>
                          <th className="px-4 py-3">Product</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3">Variants & Stock</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/40">
                        {filteredProducts.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                              No products found.
                            </td>
                          </tr>
                        ) : (
                          filteredProducts.map((prod) => {
                            const isEnabled = prod.enabled !== false;
                            return (
                              <tr key={prod.id} className="hover:bg-slate-800/40 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={prod.image}
                                      alt={prod.titleEn}
                                      className="w-10 h-10 rounded-lg object-cover bg-slate-800 shrink-0"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div>
                                      <div className="font-semibold text-white">{prod.titleEn}</div>
                                      <div className="text-[11px] text-slate-400 font-bengali">
                                        {prod.titleBn}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-medium uppercase">
                                    {prod.categoryId}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="space-y-1">
                                    {prod.variants.slice(0, 2).map((v) => (
                                      <div
                                        key={v.id}
                                        className="flex items-center justify-between gap-3 text-[11px] bg-slate-900/60 px-2 py-1 rounded"
                                      >
                                        <span className="text-slate-300">{v.name}</span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-emerald-400 font-bold font-mono">
                                            ৳{v.salePrice}
                                          </span>
                                          <span className="text-slate-500 line-through font-mono">
                                            ৳{v.regularPrice}
                                          </span>
                                          <span
                                            className={`px-1.5 py-0.2 rounded font-mono ${
                                              v.stockCount > 0
                                                ? 'bg-emerald-500/10 text-emerald-400'
                                                : 'bg-red-500/10 text-red-400'
                                            }`}
                                          >
                                            Qty: {v.stockCount}
                                          </span>
                                          <button
                                            onClick={() =>
                                              setQuickEditVariant({
                                                productId: prod.id,
                                                variantId: v.id,
                                                regularPrice: v.regularPrice,
                                                salePrice: v.salePrice,
                                                stockCount: v.stockCount,
                                              })
                                            }
                                            className="text-xs text-slate-400 hover:text-emerald-400 cursor-pointer"
                                            title="Quick Edit Stock & Price"
                                          >
                                            <Pencil className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                    {prod.variants.length > 2 && (
                                      <div className="text-[10px] text-slate-500">
                                        +{prod.variants.length - 2} more variants
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => toggleProductStatus(prod.id, !isEnabled)}
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                                      isEnabled
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                                    }`}
                                  >
                                    {isEnabled ? '● Active' : '○ Disabled'}
                                  </button>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => {
                                        setProductToEdit(prod);
                                        setIsProductFormOpen(true);
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                      title="Edit Product"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (
                                          window.confirm(
                                            `Delete product "${prod.titleEn}" permanently?`
                                          )
                                        ) {
                                          deleteProduct(prod.id);
                                        }
                                      }}
                                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                      title="Delete Product"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB 4: ORDERS */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'orders' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {lang === 'bn' ? 'অর্ডার ব্যবস্থাপনা' : 'Orders Fulfillment'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Verify payments, update statuses, dispatch deliveries, and attach notes.
                    </p>
                  </div>
                </div>

                {/* Filter & Search */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by Order ID, Phone, TrxID, or Name..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                    {['all', 'pending', 'processing', 'completed', 'cancelled'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setOrderStatusFilter(status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all whitespace-nowrap cursor-pointer ${
                          orderStatusFilter === status
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Orders Table */}
                <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-700/60">
                        <tr>
                          <th className="px-4 py-3">Order ID</th>
                          <th className="px-4 py-3">Customer</th>
                          <th className="px-4 py-3">Items</th>
                          <th className="px-4 py-3">Payment</th>
                          <th className="px-4 py-3">Total</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/40">
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                              No matching orders found.
                            </td>
                          </tr>
                        ) : (
                          filteredOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="px-4 py-3 font-mono font-bold text-white">
                                #{order.orderId || order.id.substring(0, 8)}
                                <div className="text-[10px] text-slate-500 font-normal">
                                  {new Date(order.createdAt).toLocaleString()}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-semibold text-slate-100">
                                  {order.customerName}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {order.customerPhone}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {order.customerEmail}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="space-y-0.5">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="text-[11px] text-slate-300">
                                      {item.quantity}x {item.productTitle} ({item.variantName})
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="uppercase font-bold text-emerald-400">
                                  {order.paymentMethod}
                                </span>
                                <div className="font-mono text-[11px] text-slate-300">
                                  Trx: {order.trxId || 'N/A'}
                                </div>
                                {order.paymentSenderNumber && (
                                  <div className="text-[10px] text-slate-500">
                                    From: {order.paymentSenderNumber}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 font-bold text-white font-mono">
                                ৳{order.totalAmount}
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={order.status}
                                  onChange={(e) =>
                                    updateOrderStatus(order.id, e.target.value as OrderStatus)
                                  }
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase border cursor-pointer ${
                                    order.status === 'completed'
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                      : order.status === 'processing'
                                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                      : order.status === 'cancelled'
                                      ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                  }`}
                                >
                                  <option value="pending" className="bg-slate-900 text-amber-400">
                                    Pending
                                  </option>
                                  <option value="processing" className="bg-slate-900 text-blue-400">
                                    Processing
                                  </option>
                                  <option value="completed" className="bg-slate-900 text-emerald-400">
                                    Completed
                                  </option>
                                  <option value="cancelled" className="bg-slate-900 text-red-400">
                                    Cancelled
                                  </option>
                                </select>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setSelectedOrderForView(order);
                                      setAdminNoteInput(order.adminNotes || '');
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                    title="View Details & Notes"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenDeliveryModal(order)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                                  >
                                    Deliver
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          `Delete order #${order.orderId || order.id} permanently?`
                                        )
                                      ) {
                                        deleteOrder(order.id);
                                      }
                                    }}
                                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                    title="Delete Order"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB 5: DELIVERIES */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'deliveries' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {lang === 'bn' ? 'ডেলিভারি রেকর্ড ও প্রেরণ' : 'Deliveries Management'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      All digital delivery records, credentials, keys, and resend logs.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search Order ID, Product, or User..."
                      value={deliverySearch}
                      onChange={(e) => setDeliverySearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Deliveries Table */}
                <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-700/60">
                        <tr>
                          <th className="px-4 py-3">Delivery / Order ID</th>
                          <th className="px-4 py-3">Product</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Delivered At</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/40">
                        {filteredDeliveries.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                              No deliveries dispatched yet.
                            </td>
                          </tr>
                        ) : (
                          filteredDeliveries.map((deliv) => (
                            <tr key={deliv.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="px-4 py-3 font-mono font-bold text-white">
                                #{deliv.orderId || deliv.id.substring(0, 8)}
                                <div className="text-[10px] text-slate-500 font-normal">
                                  User: {deliv.userId?.substring(0, 10)}...
                                </div>
                              </td>
                              <td className="px-4 py-3 font-medium text-slate-200">
                                {deliv.productTitle || 'Digital Item'}
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase text-[10px] font-semibold">
                                  {deliv.deliveryType || 'credentials'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-400 text-[11px]">
                                {new Date(deliv.deliveredAt || deliv.createdAt || '').toLocaleString()}
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                  ● Delivered
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => setViewDeliveryContentModal(deliv)}
                                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                                  >
                                    View Content
                                  </button>
                                  <button
                                    onClick={() => {
                                      const relatedOrder = orders.find((o) => o.id === deliv.orderId);
                                      if (relatedOrder) {
                                        handleOpenDeliveryModal(relatedOrder);
                                      } else {
                                        showToast(
                                          lang === 'bn' ? 'অর্ডার পাওয়া যায়নি' : 'Order not found',
                                          'error'
                                        );
                                      }
                                    }}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors"
                                  >
                                    Update / Resend
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB 6: SETTINGS */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'settings' && (
              <div className="space-y-5 max-w-3xl">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {lang === 'bn' ? 'সাইট ও পেমেন্ট সেটিংস' : 'Global Site Settings'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure official payment numbers, support lines, delivery banners, and maintenance status.
                  </p>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-4">
                  {/* Site Name & Support */}
                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Settings className="w-4 h-4 text-emerald-400" />
                      General Information
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Site Name</label>
                        <input
                          type="text"
                          value={settingsForm.siteName}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, siteName: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Support Email</label>
                        <input
                          type="email"
                          value={settingsForm.supportEmail}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, supportEmail: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Support Phone</label>
                        <input
                          type="text"
                          value={settingsForm.supportPhone}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, supportPhone: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          WhatsApp Support Number
                        </label>
                        <input
                          type="text"
                          value={settingsForm.whatsappSupportNumber}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              whatsappSupportNumber: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Accounts */}
                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      Payment Numbers (bKash, Nagad, Rocket)
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-pink-400 mb-1">
                          bKash Number
                        </label>
                        <input
                          type="text"
                          value={settingsForm.bkashNumber}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, bkashNumber: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-pink-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-orange-400 mb-1">
                          Nagad Number
                        </label>
                        <input
                          type="text"
                          value={settingsForm.nagadNumber}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, nagadNumber: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-purple-400 mb-1">
                          Rocket Number
                        </label>
                        <input
                          type="text"
                          value={settingsForm.rocketNumber}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, rocketNumber: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Delivery Notices & Maintenance */}
                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Truck className="w-4 h-4 text-emerald-400" />
                      Delivery Notices & Maintenance Mode
                    </h3>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        Delivery Notice (Bangla)
                      </label>
                      <input
                        type="text"
                        value={settingsForm.deliveryNoticeBn}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, deliveryNoticeBn: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-bengali"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        Delivery Notice (English)
                      </label>
                      <input
                        type="text"
                        value={settingsForm.deliveryNoticeEn}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, deliveryNoticeEn: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-700/50">
                      <div>
                        <span className="text-xs font-semibold text-white">Maintenance Mode</span>
                        <p className="text-[11px] text-slate-400">
                          Temporarily disable cart checkout for site upgrades.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setSettingsForm({
                            ...settingsForm,
                            maintenanceMode: !settingsForm.maintenanceMode,
                          })
                        }
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                          settingsForm.maintenanceMode
                            ? 'bg-amber-500 text-black font-bold'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {settingsForm.maintenanceMode ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save All Settings
                  </button>
                </form>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB 7: ADMINS */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'admins' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {lang === 'bn' ? 'অ্যাডমিন অধিকার ও অ্যাক্সেস' : 'Administrators List'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Users authorized to access the Admin Control Panel.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setNewAdminUserId('');
                      setNewAdminName('');
                      setNewAdminEmail('');
                      setIsAddAdminModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add New Admin
                  </button>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-700/60">
                        <tr>
                          <th className="px-4 py-3">Admin</th>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3">User ID</th>
                          <th className="px-4 py-3">Created Date</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/40">
                        {allAdmins.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                              No explicit admin documents found in /admins collection.
                            </td>
                          </tr>
                        ) : (
                          allAdmins.map((adm) => {
                            const isSelf = adm.id === currentUser.id;
                            const isSuperAdmin = adm.email === 'shahinpc2018@gmail.com';
                            return (
                              <tr key={adm.id} className="hover:bg-slate-800/40 transition-colors">
                                <td className="px-4 py-3 font-semibold text-white flex items-center gap-2">
                                  <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                                  {adm.name}
                                  {isSuperAdmin && (
                                    <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded text-[10px] font-bold">
                                      Super Admin
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-slate-200">{adm.email}</td>
                                <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                                  {adm.id}
                                </td>
                                <td className="px-4 py-3 text-slate-400 text-[11px]">
                                  {adm.createdAt || 'N/A'}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {!isSelf && !isSuperAdmin ? (
                                    <button
                                      onClick={() => {
                                        if (
                                          window.confirm(
                                            `Revoke admin access for "${adm.name}" (${adm.email})?`
                                          )
                                        ) {
                                          removeAdminUser(adm.id);
                                        }
                                      }}
                                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                      title="Revoke Admin Access"
                                    >
                                      <UserMinus className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    <span className="text-[11px] text-slate-500 italic">
                                      {isSelf ? 'You (Protected)' : 'Super Admin'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB: COMPLAINTS & WARRANTY TICKETS */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'complaints' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <LifeBuoy className="w-5 h-5 text-emerald-400" />
                    <span>{lang === 'bn' ? 'গ্রাহক অভিযোগ ও ওয়ারেন্টি টিকেট' : 'Customer Complaints & Support Tickets'}</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {lang === 'bn'
                      ? 'গ্রাহকদের সমস্যা পর্যালোচনা করুন, স্ট্যাটাস পরিবর্তন করুন এবং সরাসরি সমাধান পাঠান।'
                      : 'Review customer complaints, manage statuses, and provide official resolution messages.'}
                  </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
                    <span className="text-xs text-slate-400 font-medium">Total Tickets</span>
                    <div className="text-2xl font-black text-white mt-1 font-mono">{complaints.length}</div>
                    <span className="text-[11px] text-slate-400 mt-1 block">All time complaints</span>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                    <span className="text-xs text-amber-300 font-medium">Pending Review</span>
                    <div className="text-2xl font-black text-amber-400 mt-1 font-mono">
                      {complaints.filter((c) => c.status === 'pending').length}
                    </div>
                    <span className="text-[11px] text-amber-300/80 mt-1 block">Needs immediate action</span>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                    <span className="text-xs text-blue-300 font-medium">In Progress</span>
                    <div className="text-2xl font-black text-blue-400 mt-1 font-mono">
                      {complaints.filter((c) => c.status === 'in_progress').length}
                    </div>
                    <span className="text-[11px] text-blue-300/80 mt-1 block">Under investigation</span>
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                    <span className="text-xs text-emerald-300 font-medium">Resolved / Closed</span>
                    <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
                      {complaints.filter((c) => c.status === 'resolved' || c.status === 'closed').length}
                    </div>
                    <span className="text-[11px] text-emerald-300/80 mt-1 block">Successfully resolved</span>
                  </div>
                </div>

                {/* Filters & Search */}
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 w-full sm:w-80">
                    <div className="relative w-full">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search by ticket ID, customer, order ID, or issue..."
                        value={complaintSearch}
                        onChange={(e) => setComplaintSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Status Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {(['all', 'pending', 'in_progress', 'resolved', 'closed'] as const).map((st) => {
                      const count =
                        st === 'all'
                          ? complaints.length
                          : complaints.filter((c) => c.status === st).length;
                      const isActive = complaintStatusFilter === st;

                      return (
                        <button
                          key={st}
                          onClick={() => setComplaintStatusFilter(st)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap cursor-pointer transition-colors ${
                            isActive
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                          }`}
                        >
                          {st.replace('_', ' ')} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Complaint Cards List */}
                <div className="space-y-4">
                  {complaints
                    .filter((c) => {
                      if (complaintStatusFilter !== 'all' && c.status !== complaintStatusFilter) {
                        return false;
                      }
                      if (!complaintSearch.trim()) return true;
                      const q = complaintSearch.toLowerCase();
                      return (
                        c.id.toLowerCase().includes(q) ||
                        c.customerName.toLowerCase().includes(q) ||
                        c.customerEmail.toLowerCase().includes(q) ||
                        c.customerPhone.toLowerCase().includes(q) ||
                        c.orderId?.toLowerCase().includes(q) ||
                        c.subject.toLowerCase().includes(q) ||
                        c.message.toLowerCase().includes(q)
                      );
                    })
                    .map((c) => {
                      const currentReplyInput =
                        replyInputMap[c.id] !== undefined ? replyInputMap[c.id] : c.adminReply || '';

                      return (
                        <div
                          key={c.id}
                          className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm"
                        >
                          {/* Card Header */}
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-sm font-bold text-emerald-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
                                #{c.id}
                              </span>
                              {c.orderId && (
                                <span className="font-mono text-xs text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                                  Order: #{c.orderId}
                                </span>
                              )}
                              <span className="text-xs text-slate-400">
                                {new Date(c.createdAt).toLocaleString()}
                              </span>
                            </div>

                            {/* Status Change Dropdown & Delete Button */}
                            <div className="flex items-center gap-2">
                              <select
                                value={c.status}
                                onChange={async (e) => {
                                  const newStatus = e.target.value as ComplaintStatus;
                                  await updateComplaintByAdmin(c.id, { status: newStatus });
                                }}
                                className={`text-xs font-bold px-3 py-1.5 rounded-xl border outline-none cursor-pointer ${
                                  c.status === 'pending'
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                    : c.status === 'in_progress'
                                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                    : c.status === 'resolved'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : 'bg-slate-700 text-slate-300 border-slate-600'
                                }`}
                              >
                                <option value="pending" className="bg-slate-900 text-white">
                                  ⏳ Pending
                                </option>
                                <option value="in_progress" className="bg-slate-900 text-white">
                                  ⚙️ In Progress
                                </option>
                                <option value="resolved" className="bg-slate-900 text-white">
                                  ✅ Resolved
                                </option>
                                <option value="closed" className="bg-slate-900 text-white">
                                  🔒 Closed
                                </option>
                              </select>

                              <button
                                onClick={async () => {
                                  if (window.confirm(`Delete complaint #${c.id}?`)) {
                                    await deleteComplaintByAdmin(c.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Delete Complaint"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Customer info row */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                            <div>
                              <span className="text-slate-500 block">Customer:</span>
                              <span className="font-semibold text-white">{c.customerName}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Email:</span>
                              <span className="font-mono text-slate-200">{c.customerEmail || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Phone / WhatsApp:</span>
                              <span className="font-mono text-emerald-400">{c.customerPhone || 'N/A'}</span>
                            </div>
                          </div>

                          {/* Customer's Complaint Description */}
                          <div className="space-y-1.5">
                            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span className="text-slate-400">Issue:</span>
                              <span>{c.subject}</span>
                            </h4>
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed select-text font-normal">
                              {c.message}
                            </div>
                          </div>

                          {/* Official Admin Reply & Resolution Section */}
                          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4" />
                                <span>Official Admin Response (Visible to Customer)</span>
                              </span>
                              {c.updatedAt && (
                                <span className="text-[11px] text-slate-400">
                                  Last updated: {new Date(c.updatedAt).toLocaleTimeString()}
                                </span>
                              )}
                            </div>

                            {/* Quick template buttons */}
                            <div className="flex flex-wrap gap-1.5 text-[11px]">
                              <span className="text-slate-400 self-center mr-1">Quick templates:</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setReplyInputMap((prev) => ({
                                    ...prev,
                                    [c.id]:
                                      'আপনার অ্যাকাউন্টের সমস্যাটি সমাধান করা হয়েছে। দয়া করে আপনার ড্যাশবোর্ডে নতুন ক্রেডেনশিয়াল চেক করুন। ধন্যবাদ!',
                                  }))
                                }
                                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                              >
                                {lang === 'bn' ? '✅ অ্যাকাউন্ট সমাধান হয়েছে' : '✅ Issue Resolved'}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setReplyInputMap((prev) => ({
                                    ...prev,
                                    [c.id]:
                                      'We have sent fresh replacement credentials. Please log out and back in to verify.',
                                  }))
                                }
                                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                              >
                                🔑 Replacement Sent
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setReplyInputMap((prev) => ({
                                    ...prev,
                                    [c.id]:
                                      'আপনার অভিযোগটি পেয়েছি। প্রোভাইডারের সার্ভার থেকে আপডেট আসার পর ১০-১৫ মিনিটের মধ্যে সমাধান দেওয়া হবে।',
                                  }))
                                }
                                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                              >
                                ⏳ Investigation in progress
                              </button>
                            </div>

                            <textarea
                              rows={2}
                              value={currentReplyInput}
                              onChange={(e) =>
                                setReplyInputMap((prev) => ({
                                  ...prev,
                                  [c.id]: e.target.value,
                                }))
                              }
                              placeholder="Write official resolution or response to this customer..."
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-emerald-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-medium"
                            />

                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                disabled={updatingComplaintId === c.id}
                                onClick={async () => {
                                  setUpdatingComplaintId(c.id);
                                  try {
                                    await updateComplaintByAdmin(c.id, {
                                      adminReply: currentReplyInput,
                                      status: c.status === 'pending' ? 'in_progress' : c.status,
                                    });
                                  } finally {
                                    setUpdatingComplaintId(null);
                                  }
                                }}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer transition-colors"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>
                                  {updatingComplaintId === c.id
                                    ? 'Saving...'
                                    : c.adminReply
                                    ? 'Update Reply'
                                    : 'Send Reply'}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  {complaints.length === 0 && (
                    <div className="text-center py-16 bg-slate-800/20 rounded-2xl border border-slate-800 text-slate-500">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-30 text-emerald-400" />
                      <p className="text-sm font-semibold">No complaints found</p>
                      <p className="text-xs text-slate-500 mt-1">
                        All customer tickets have been resolved or none submitted yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* MODAL: ADD ADMIN DIALOG */}
      {/* ---------------------------------------------------- */}
      {isAddAdminModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-400" />
                Add New Admin
              </h3>
              <button
                onClick={() => setIsAddAdminModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select an existing user from the dropdown or enter their credentials directly to grant full administrative privileges.
            </p>

            {/* Quick Pick from Registered Users */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Pick Existing User</label>
              <select
                onChange={(e) => {
                  const u = allUsers.find((user) => user.id === e.target.value);
                  if (u) {
                    setNewAdminUserId(u.id);
                    setNewAdminName(u.name);
                    setNewAdminEmail(u.email);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="">-- Choose User --</option>
                {allUsers
                  .filter((u) => u.role !== 'admin')
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email || u.id})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">User ID (Firestore UID)</label>
              <input
                type="text"
                placeholder="e.g. 7d8w9s0a1b2c..."
                value={newAdminUserId}
                onChange={(e) => setNewAdminUserId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Admin Name</label>
              <input
                type="text"
                placeholder="Full Name"
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Admin Email</label>
              <input
                type="email"
                placeholder="admin@example.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddAdminModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!newAdminUserId.trim()) {
                    showToast('User ID is required', 'error');
                    return;
                  }
                  await addAdminUser({
                    id: newAdminUserId.trim(),
                    name: newAdminName.trim() || 'Admin',
                    email: newAdminEmail.trim(),
                  });
                  setIsAddAdminModalOpen(false);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/30 cursor-pointer"
              >
                Confirm Add Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: QUICK EDIT STOCK & PRICE */}
      {/* ---------------------------------------------------- */}
      {quickEditVariant && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                Quick Price & Stock Update
              </h3>
              <button
                onClick={() => setQuickEditVariant(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Sale Price (৳)</label>
              <input
                type="number"
                value={quickEditVariant.salePrice}
                onChange={(e) =>
                  setQuickEditVariant({
                    ...quickEditVariant,
                    salePrice: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Regular Price (৳)</label>
              <input
                type="number"
                value={quickEditVariant.regularPrice}
                onChange={(e) =>
                  setQuickEditVariant({
                    ...quickEditVariant,
                    regularPrice: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Stock Count</label>
              <input
                type="number"
                value={quickEditVariant.stockCount}
                onChange={(e) =>
                  setQuickEditVariant({
                    ...quickEditVariant,
                    stockCount: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setQuickEditVariant(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await updateProductPrice(
                    quickEditVariant.productId,
                    quickEditVariant.variantId,
                    quickEditVariant.regularPrice,
                    quickEditVariant.salePrice
                  );
                  await updateProductStock(
                    quickEditVariant.productId,
                    quickEditVariant.variantId,
                    quickEditVariant.stockCount
                  );
                  setQuickEditVariant(null);
                  showToast('Stock and price updated successfully', 'success');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: VIEW ORDER DETAILS & ADMIN NOTES */}
      {/* ---------------------------------------------------- */}
      {selectedOrderForView && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 text-slate-100 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-400" />
                  Order #{selectedOrderForView.orderId || selectedOrderForView.id}
                </h3>
                <p className="text-xs text-slate-400">
                  Placed on {new Date(selectedOrderForView.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrderForView(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Details */}
            <div className="bg-slate-800/60 rounded-xl p-3 text-xs space-y-1">
              <div className="text-slate-400 font-semibold">Customer Information</div>
              <div className="text-slate-200">
                <span className="text-slate-400">Name:</span> {selectedOrderForView.customerName}
              </div>
              <div className="text-slate-200">
                <span className="text-slate-400">Email:</span> {selectedOrderForView.customerEmail}
              </div>
              <div className="text-slate-200">
                <span className="text-slate-400">Phone:</span> {selectedOrderForView.customerPhone}
              </div>
              <div className="text-slate-200">
                <span className="text-slate-400">User ID:</span> {selectedOrderForView.userId}
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-slate-800/60 rounded-xl p-3 text-xs space-y-1">
              <div className="text-slate-400 font-semibold">Payment Verification</div>
              <div className="text-slate-200">
                <span className="text-slate-400">Method:</span>{' '}
                <span className="uppercase font-bold text-emerald-400">
                  {selectedOrderForView.paymentMethod}
                </span>
              </div>
              <div className="text-slate-200">
                <span className="text-slate-400">TrxID:</span>{' '}
                <span className="font-mono text-white font-bold">{selectedOrderForView.trxId}</span>
              </div>
              {selectedOrderForView.paymentSenderNumber && (
                <div className="text-slate-200">
                  <span className="text-slate-400">Sender Number:</span>{' '}
                  <span className="font-mono">{selectedOrderForView.paymentSenderNumber}</span>
                </div>
              )}
              <div className="text-slate-200">
                <span className="text-slate-400">Total Amount:</span>{' '}
                <span className="font-bold text-emerald-400 font-mono">
                  ৳{selectedOrderForView.totalAmount}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="bg-slate-800/60 rounded-xl p-3 text-xs space-y-2">
              <div className="text-slate-400 font-semibold">Ordered Items</div>
              {selectedOrderForView.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-slate-300">
                  <span>
                    {item.quantity}x {item.productTitle} ({item.variantName})
                  </span>
                  <span className="font-mono text-white">৳{item.salePrice * item.quantity}</span>
                </div>
              ))}
            </div>

            {/* Admin Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Admin Notes (Internal / Follow-up)
              </label>
              <textarea
                rows={3}
                value={adminNoteInput}
                onChange={(e) => setAdminNoteInput(e.target.value)}
                placeholder="Add notes e.g., 'Verified manually with bKash statement', 'Customer contacted on WhatsApp'..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  handleOpenDeliveryModal(selectedOrderForView);
                  setSelectedOrderForView(null);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Go to Delivery
              </button>

              <button
                onClick={async () => {
                  await updateOrderAdminNotes(selectedOrderForView.id, adminNoteInput.trim());
                  setSelectedOrderForView(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4 text-emerald-400" />
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: DISPATCH / EDIT DELIVERY */}
      {/* ---------------------------------------------------- */}
      {selectedOrderForDelivery && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                Deliver Order #{selectedOrderForDelivery.orderId || selectedOrderForDelivery.id}
              </h3>
              <button
                onClick={() => setSelectedOrderForDelivery(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const primaryItem = selectedOrderForDelivery.items && selectedOrderForDelivery.items.length > 0
                ? selectedOrderForDelivery.items[0]
                : null;
              const prod = products.find((p) => p.id === primaryItem?.productId);
              const matchedVariant = prod?.variants?.find((v) => v.id === primaryItem?.variantId);
              const hasContent = Boolean(deliveryContentInput.trim());

              return (
                <div className="space-y-3">
                  <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Customer:</span>
                      <span className="font-semibold text-white">
                        {selectedOrderForDelivery.customerName} ({selectedOrderForDelivery.customerPhone})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Product:</span>
                      <span className="font-bold text-emerald-400">
                        {primaryItem?.productTitle || (primaryItem as any)?.productName || prod?.titleEn || 'Digital Product'}
                      </span>
                    </div>
                    {(primaryItem?.variantName || matchedVariant?.nameEn) && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Variant:</span>
                        <span className="font-medium text-slate-200">
                          {primaryItem?.variantName || matchedVariant?.nameEn}
                        </span>
                      </div>
                    )}
                  </div>

                  {!hasContent && (
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>
                        {lang === 'bn'
                          ? 'এই প্রোডাক্টের External Access Link দেওয়া হয়নি।'
                          : 'No External Access Link configured for this product.'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Delivery Type */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Delivery Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'credentials', label: 'Login Credentials' },
                  { id: 'license_key', label: 'License Key' },
                  { id: 'link', label: 'Invite / Direct Link' },
                  { id: 'file', label: 'Download File URL' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setDeliveryMode(type.id as any)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border text-left transition-colors cursor-pointer ${
                      deliveryMode === type.id
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Delivery Content */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {deliveryMode === 'credentials'
                  ? 'Account Email & Password'
                  : deliveryMode === 'license_key'
                  ? 'Activation / License Key'
                  : 'Direct Link or Download URL'}
              </label>
              <textarea
                rows={4}
                value={deliveryContentInput}
                onChange={(e) => setDeliveryContentInput(e.target.value)}
                placeholder={
                  deliveryMode === 'credentials'
                    ? 'Email: user@example.com\nPassword: secret_pass_123\nProfile: 1 (Pin: 1234)'
                    : deliveryMode === 'license_key'
                    ? 'XXXX-XXXX-XXXX-XXXX'
                    : 'https://...'
                }
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-emerald-500 placeholder-slate-500"
              />
            </div>

            {/* Delivery Instructions */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Instructions / Warranty Note (Optional)
              </label>
              <input
                type="text"
                value={deliveryNotesInput}
                onChange={(e) => setDeliveryNotesInput(e.target.value)}
                placeholder="e.g. Please do not change profile name or master password."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 placeholder-slate-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedOrderForDelivery(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDeliverySubmit}
                disabled={isDeliveringOrder}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isDeliveringOrder ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Delivery Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: VIEW DELIVERED CONTENT */}
      {/* ---------------------------------------------------- */}
      {viewDeliveryContentModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                Delivered Content
              </h3>
              <button
                onClick={() => setViewDeliveryContentModal(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-400">
              Order ID: <span className="font-mono text-white font-bold">{viewDeliveryContentModal.orderId}</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative group">
              <div className="text-xs font-mono text-emerald-400 whitespace-pre-wrap select-all">
                {viewDeliveryContentModal.credentials ||
                  viewDeliveryContentModal.downloadUrl ||
                  viewDeliveryContentModal.licenseKey ||
                  'No delivery content recorded.'}
              </div>

              <button
                onClick={() =>
                  handleCopyText(
                    viewDeliveryContentModal.credentials ||
                      viewDeliveryContentModal.downloadUrl ||
                      viewDeliveryContentModal.licenseKey ||
                      ''
                  )
                }
                className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Copy Content"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            {viewDeliveryContentModal.adminNotes && (
              <div className="text-xs text-slate-400 bg-slate-800/40 p-3 rounded-lg">
                <span className="font-semibold text-slate-300">Instructions:</span>{' '}
                {viewDeliveryContentModal.adminNotes}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewDeliveryContentModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* PRODUCT FORM MODAL (ADD / EDIT PRODUCT) */}
      {/* ---------------------------------------------------- */}
      <AdminProductFormModal
        isOpen={isProductFormOpen}
        onClose={() => {
          setIsProductFormOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
      />
    </div>
  );
};

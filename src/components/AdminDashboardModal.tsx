import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  Package,
  Clock,
  CheckCircle2,
  DollarSign,
  Search,
  Check,
  Send,
  Sliders,
  Settings,
  ShieldAlert,
  Plus,
  Pencil,
  Trash2,
  Layers,
  AlertTriangle,
  Tag,
  Eye,
  Mail,
  MessageSquare,
  UploadCloud,
  FileCode,
  ExternalLink,
  Lock,
  RefreshCw,
  FileCheck2,
  ShieldCheck,
  CheckCheck,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Order, OrderStatus, Product } from '../types';
import { AdminProductFormModal } from './AdminProductFormModal';

export const AdminDashboardModal: React.FC = () => {
  const {
    isAdminDashboardOpen,
    setIsAdminDashboardOpen,
    orders,
    updateOrderStatus,
    deliverOrder,
    resendNotification,
    deliveries,
    isDeliveringOrder,
    products,
    categories,
    deleteProduct,
    updateProduct,
    siteSettings,
    updateSiteSettings,
    showToast,
    lang,
    t,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'settings'>('orders');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState<Order | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<'file' | 'credentials' | 'external'>('file');
  const [deliveryCredentialsInput, setDeliveryCredentialsInput] = useState('');
  const [deliveryNotesInput, setDeliveryNotesInput] = useState('');
  const [deliveryFileName, setDeliveryFileName] = useState('');
  const [deliveryFileSize, setDeliveryFileSize] = useState<number | undefined>(undefined);
  const [deliveryFileUrl, setDeliveryFileUrl] = useState('');
  const [deliveryStoragePath, setDeliveryStoragePath] = useState('');
  const [resendingType, setResendingType] = useState<{ [orderId: string]: 'email' | 'whatsapp' | null }>({});

  // Product Management State
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Settings form states
  const [bkashNum, setBkashNum] = useState(siteSettings.bkashNumber);
  const [nagadNum, setNagadNum] = useState(siteSettings.nagadNumber);
  const [rocketNum, setRocketNum] = useState(siteSettings.rocketNumber);
  const [announcementBn, setAnnouncementBn] = useState(siteSettings.announcementBn);
  const [announcementEn, setAnnouncementEn] = useState(siteSettings.announcementEn);

  if (!isAdminDashboardOpen) return null;

  // Financial calculations
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = orders.length;
  const pendingCount = orders.filter((o) => o.status === 'verifying' || o.status === 'pending').length;
  const completedCount = orders.filter((o) => o.status === 'completed').length;

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'all') return true;
    return o.status === statusFilter;
  });

  // Filter products
  const filteredProducts = products.filter((prod) => {
    const matchesCategory =
      productCategoryFilter === 'all' || prod.categoryId === productCategoryFilter;
    const matchesQuery =
      !productSearch.trim() ||
      prod.titleEn.toLowerCase().includes(productSearch.toLowerCase()) ||
      prod.titleBn.toLowerCase().includes(productSearch.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const handleOpenDeliverModal = (order: Order) => {
    setSelectedOrderForDelivery(order);
    const primaryItem = order.items[0];
    const associatedProduct = products.find((p) => p.id === primaryItem?.productId);
    const existingDelivery = deliveries[order.id];

    if (associatedProduct?.downloadAccessType === 'credentials') {
      setDeliveryMode('credentials');
    } else if (associatedProduct?.downloadAccessType === 'external_link') {
      setDeliveryMode('external');
    } else {
      setDeliveryMode('file');
    }

    const initialKey =
      existingDelivery?.credentialsOrKey ||
      order.digitalDeliveries?.[0]?.credentialsOrKey ||
      associatedProduct?.variants?.[0]?.sampleKey ||
      '';
    setDeliveryCredentialsInput(initialKey);

    setDeliveryFileName(
      existingDelivery?.fileName ||
      associatedProduct?.digitalFileName ||
      ''
    );
    setDeliveryFileSize(
      existingDelivery?.fileSize ??
      associatedProduct?.digitalFileSize
    );
    setDeliveryStoragePath(
      existingDelivery?.storagePath ||
      associatedProduct?.digitalFileStoragePath ||
      ''
    );
    setDeliveryFileUrl(
      existingDelivery?.downloadUrl ||
      associatedProduct?.digitalFileUrl ||
      associatedProduct?.externalAccessUrl ||
      ''
    );
    setDeliveryNotesInput('Thank you for ordering with Digital Product Sheba. Your digital purchase is ready.');
  };

  const handleVerifyPayment = async (orderId: string) => {
    await updateOrderStatus(orderId, 'processing', undefined, 'Payment manually verified by Admin');
    showToast(
      lang === 'bn' ? 'পেমেন্ট ভেরিফাই হয়েছে, অর্ডার প্রসেসিং এ আছে' : 'Payment verified. Order marked as Processing.',
      'success'
    );
  };

  const handleConfirmDelivery = async () => {
    if (!selectedOrderForDelivery) return;

    const isExternal = deliveryMode === 'external';
    await deliverOrder(selectedOrderForDelivery.id, {
      deliveryMethod: isExternal ? 'external_link' : deliveryMode,
      externalAccessUrl: isExternal ? (deliveryFileUrl.trim() || undefined) : undefined,
      credentialsOrKey: deliveryCredentialsInput.trim() || undefined,
      notes: deliveryNotesInput.trim() || undefined,
      fileName: !isExternal ? (deliveryFileName.trim() || undefined) : undefined,
      fileSize: !isExternal ? deliveryFileSize : undefined,
      fileUrl: deliveryFileUrl.trim() || undefined,
      storagePath: !isExternal ? (deliveryStoragePath.trim() || undefined) : undefined,
    });

    setSelectedOrderForDelivery(null);
  };

  const handleResend = async (orderId: string, type: 'email' | 'whatsapp') => {
    setResendingType((prev) => ({ ...prev, [orderId]: type }));
    try {
      await resendNotification(orderId, type);
    } finally {
      setResendingType((prev) => ({ ...prev, [orderId]: null }));
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteSettings({
      bkashNumber: bkashNum,
      nagadNumber: nagadNum,
      rocketNumber: rocketNum,
      announcementBn,
      announcementEn,
    });
  };

  const handleAddNewProduct = () => {
    setProductToEdit(null);
    setIsProductFormOpen(true);
  };

  const handleEditProduct = (prod: Product) => {
    setProductToEdit(prod);
    setIsProductFormOpen(true);
  };

  const handleConfirmDeleteProduct = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
      setProductToDelete(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div
        className="bg-white rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl border border-gray-100 relative my-6 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">{t.adminOverview}</h2>
              <p className="text-xs text-gray-400">
                {lang === 'bn'
                  ? 'প্রোডাক্ট যুক্ত/এডিট, অর্ডার যাচাই ও কন্ট্রোল প্যানেল'
                  : 'Add/Edit/Delete products, verify orders & store control'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAdminDashboardOpen(false)}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Metric Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-6 bg-gray-50 border-b border-gray-100 shrink-0">
          <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs">
            <span className="text-[10px] text-gray-400 font-bold uppercase block">
              {t.totalRevenue}
            </span>
            <span className="text-lg sm:text-xl font-black text-emerald-700">৳{totalRevenue}</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs">
            <span className="text-[10px] text-gray-400 font-bold uppercase block">
              {t.totalOrders}
            </span>
            <span className="text-lg sm:text-xl font-black text-gray-900">{totalOrders}</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs">
            <span className="text-[10px] text-gray-400 font-bold uppercase block">
              {t.pendingVerification}
            </span>
            <span className="text-lg sm:text-xl font-black text-amber-600">{pendingCount}</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs">
            <span className="text-[10px] text-gray-400 font-bold uppercase block">
              {lang === 'bn' ? 'মোট প্রোডাক্ট' : 'Total Products'}
            </span>
            <span className="text-lg sm:text-xl font-black text-emerald-600">{products.length}</span>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex border-b border-gray-200 bg-white px-4 sm:px-6 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'orders'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>{t.manageOrders}</span>
            <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full">
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'products'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t.manageProducts}</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded-full font-extrabold">
              {products.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'settings'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>{t.siteSettings}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {/* Filter Pills */}
              <div className="flex gap-2 text-xs font-bold overflow-x-auto pb-1">
                {['all', 'verifying', 'processing', 'delivered', 'completed', 'cancelled'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl capitalize cursor-pointer transition-all ${
                      statusFilter === st
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Order Table / Cards */}
              <div className="space-y-3">
                {filteredOrders.length === 0 ? (
                  <p className="text-center py-8 text-xs text-gray-400 font-bold">
                    No orders in this category
                  </p>
                ) : (
                  filteredOrders.map((order) => {
                    const delivery = deliveries[order.id];
                    const isDelivered = order.status === 'delivered' || order.status === 'completed';

                    return (
                      <div
                        key={order.id}
                        className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/70 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm font-mono text-gray-900">
                              #{order.id}
                            </span>
                            <span className="text-gray-400 text-[11px]">
                              {new Date(order.createdAt).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                                isDelivered
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : order.status === 'processing'
                                  ? 'bg-blue-100 text-blue-800'
                                  : order.status === 'verifying'
                                  ? 'bg-amber-100 text-amber-800'
                                  : order.status === 'cancelled'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-gray-200 text-gray-800'
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                        </div>

                        {/* Items */}
                        <div className="space-y-1">
                          {order.items.map((i, idx) => (
                            <div key={idx} className="flex justify-between text-gray-700">
                              <span className="font-medium">
                                {i.productTitle} ({i.variantName}) × {i.quantity}
                              </span>
                              <span className="font-bold">৳{i.unitPrice * i.quantity}</span>
                            </div>
                          ))}
                        </div>

                        {/* Customer, Payment and Trx Details */}
                        <div className="bg-white p-3 rounded-xl border border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <div>
                            <span className="text-gray-400 block font-bold uppercase">Customer</span>
                            <span className="font-bold text-gray-800">{order.customerName}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block font-bold uppercase">Contact</span>
                            <span className="font-mono text-gray-800 block">{order.customerPhone}</span>
                            <span className="text-[10px] text-gray-500 truncate block">{order.customerEmail}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block font-bold uppercase">Payment</span>
                            <span className="font-bold uppercase text-emerald-700 block">
                              {order.paymentMethod}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">
                              Sender: {order.senderNumber}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block font-bold uppercase">Transaction ID</span>
                            <span className="font-mono font-bold text-rose-600 select-all">
                              {order.trxId}
                            </span>
                          </div>
                        </div>

                        {/* Delivery & Notification Status Strip if Delivered */}
                        {isDelivered && (
                          <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 text-[11px] space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <FileCheck2 className="w-4 h-4 text-emerald-700 shrink-0" />
                                <span className="font-extrabold text-emerald-950">
                                  Digital Delivery Active
                                </span>
                                {delivery?.fileName && (
                                  <span className="text-slate-600 bg-white px-2 py-0.5 rounded border border-emerald-200 text-[10px] font-mono">
                                    File: {delivery.fileName}
                                  </span>
                                )}
                              </div>
                              <span className="text-emerald-800 font-bold">
                                Downloads: {delivery?.downloadCount || 0}
                              </span>
                            </div>

                            {/* Notifications Row */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-emerald-200/60">
                              <div className="flex items-center gap-3">
                                {/* Email Status */}
                                <div className="flex items-center gap-1.5">
                                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                                  <span className="text-[10px] text-slate-600 font-bold">Email:</span>
                                  <span
                                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                      delivery?.emailStatus === 'sent'
                                        ? 'bg-emerald-200 text-emerald-900'
                                        : delivery?.emailStatus === 'failed'
                                        ? 'bg-rose-200 text-rose-900'
                                        : 'bg-amber-200 text-amber-900'
                                    }`}
                                  >
                                    {delivery?.emailStatus || 'pending'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleResend(order.id, 'email')}
                                    disabled={resendingType[order.id] === 'email'}
                                    className="text-[10px] text-emerald-700 hover:underline font-bold cursor-pointer ml-0.5"
                                  >
                                    {resendingType[order.id] === 'email' ? 'Sending...' : 'Resend'}
                                  </button>
                                </div>

                                {/* WhatsApp Status */}
                                <div className="flex items-center gap-1.5">
                                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-[10px] text-slate-600 font-bold">WhatsApp:</span>
                                  <span
                                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                      delivery?.whatsappStatus === 'sent'
                                        ? 'bg-emerald-200 text-emerald-900'
                                        : delivery?.whatsappStatus === 'failed'
                                        ? 'bg-rose-200 text-rose-900'
                                        : 'bg-amber-200 text-amber-900'
                                    }`}
                                  >
                                    {delivery?.whatsappStatus || 'pending'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleResend(order.id, 'whatsapp')}
                                    disabled={resendingType[order.id] === 'whatsapp'}
                                    className="text-[10px] text-emerald-700 hover:underline font-bold cursor-pointer ml-0.5"
                                  >
                                    {resendingType[order.id] === 'whatsapp' ? 'Sending...' : 'Resend'}
                                  </button>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleOpenDeliverModal(order)}
                                className="text-[10px] font-bold text-slate-700 bg-white hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300 cursor-pointer"
                              >
                                Edit Delivery / Redeliver
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Order Actions Toolbar */}
                        <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-gray-200">
                          {order.status === 'verifying' && (
                            <button
                              type="button"
                              onClick={() => handleVerifyPayment(order.id)}
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl cursor-pointer flex items-center gap-1 transition-colors"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                              <span>Verify Payment</span>
                            </button>
                          )}

                          {!isDelivered && (
                            <button
                              type="button"
                              onClick={() => handleOpenDeliverModal(order)}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs transition-colors"
                            >
                              <UploadCloud className="w-3.5 h-3.5" />
                              <span>Deliver Digital Product</span>
                            </button>
                          )}

                          {order.status !== 'cancelled' && !isDelivered && (
                            <button
                              type="button"
                              onClick={() =>
                                updateOrderStatus(order.id, 'cancelled', undefined, 'Order cancelled by Admin')
                              }
                              className="px-3 py-1.5 bg-gray-100 hover:bg-rose-50 text-gray-600 hover:text-rose-600 font-bold rounded-xl cursor-pointer transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS (ADD, EDIT, DELETE) */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              {/* Product Action Strip */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
                <div className="flex flex-1 items-center gap-2">
                  <div className="relative flex-1 max-w-sm">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder={lang === 'bn' ? 'প্রোডাক্ট খুঁজুন...' : 'Search products by title...'}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:border-emerald-600 outline-hidden font-medium"
                    />
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>

                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:border-emerald-600 outline-hidden font-medium cursor-pointer"
                  >
                    <option value="all">{t.allCategories}</option>
                    {categories.slice(1).map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nameEn} ({cat.nameBn})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleAddNewProduct}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.addProduct}</span>
                </button>
              </div>

              {/* Products Table / Cards */}
              <div className="space-y-3">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-200">
                    <Layers className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-gray-700">No products match your search</p>
                  </div>
                ) : (
                  filteredProducts.map((prod) => {
                    const minPrice = Math.min(...prod.variants.map((v) => v.salePrice));
                    const maxPrice = Math.max(...prod.variants.map((v) => v.salePrice));
                    const hasStock = prod.variants.some((v) => v.inStock);

                    return (
                      <div
                        key={prod.id}
                        className="p-4 bg-gray-50/90 rounded-2xl border border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:border-gray-300"
                      >
                        {/* Thumbnail and Title */}
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={prod.image}
                            alt={prod.titleEn}
                            className="w-14 h-14 rounded-xl object-cover border border-gray-200 shrink-0 bg-white"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-900 text-white">
                                {prod.categoryId.toUpperCase()}
                              </span>
                              {prod.featured && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                                  Featured
                                </span>
                              )}
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                  hasStock
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {hasStock ? t.inStock : t.outOfStock}
                              </span>
                            </div>

                            <h4 className="text-xs sm:text-sm font-black text-gray-900 truncate mt-1">
                              {prod.titleEn}
                            </h4>
                            <p className="text-[11px] text-gray-500 truncate font-medium">
                              {prod.titleBn}
                            </p>
                          </div>
                        </div>

                        {/* Variants & Pricing Info */}
                        <div className="flex flex-wrap items-center gap-3 md:gap-6 text-xs">
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase block">
                              {t.variants}
                            </span>
                            <span className="font-bold text-gray-800">
                              {prod.variants.length} Tiers
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase block">
                              {t.price}
                            </span>
                            <span className="font-black text-emerald-700 font-mono text-sm">
                              ৳{minPrice} {minPrice !== maxPrice && `- ৳${maxPrice}`}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase block">
                              Sold
                            </span>
                            <span className="font-bold text-gray-700">
                              {prod.totalSold} Units
                            </span>
                          </div>

                          {/* Action Buttons: Edit & Delete */}
                          <div className="flex items-center gap-1.5 self-end md:self-auto">
                            <button
                              type="button"
                              onClick={() => handleEditProduct(prod)}
                              className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 font-bold text-xs rounded-xl border border-gray-200 hover:border-emerald-300 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                              title={t.editProduct}
                            >
                              <Pencil className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{lang === 'bn' ? 'এডিট' : 'Edit'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setProductToDelete(prod)}
                              className="px-3 py-1.5 bg-white hover:bg-rose-50 text-gray-700 hover:text-rose-700 font-bold text-xs rounded-xl border border-gray-200 hover:border-rose-300 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                              title={t.deleteProduct}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>{lang === 'bn' ? 'মুছুন' : 'Delete'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                MFS Payment Gateway Phone Numbers
              </h3>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  bKash Number ({siteSettings.bkashType})
                </label>
                <input
                  type="text"
                  value={bkashNum}
                  onChange={(e) => setBkashNum(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Nagad Number ({siteSettings.nagadType})
                </label>
                <input
                  type="text"
                  value={nagadNum}
                  onChange={(e) => setNagadNum(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Rocket Number ({siteSettings.rocketType})
                </label>
                <input
                  type="text"
                  value={rocketNum}
                  onChange={(e) => setRocketNum(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl font-mono font-bold"
                />
              </div>

              <div className="pt-2">
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Top Announcement Ticker (Bangla)
                </label>
                <input
                  type="text"
                  value={announcementBn}
                  onChange={(e) => setAnnouncementBn(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Top Announcement Ticker (English)
                </label>
                <input
                  type="text"
                  value={announcementEn}
                  onChange={(e) => setAnnouncementEn(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl font-medium"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Save Settings
              </button>
            </form>
          )}
        </div>

        {/* Modal Sub-Action: Deliver Digital Product Modal */}
        {selectedOrderForDelivery && (
          <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 space-y-4 border border-gray-200 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <UploadCloud className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-900">
                        Deliver Digital Product
                      </h3>
                      <span className="text-[11px] text-gray-500 font-mono">
                        Order #{selectedOrderForDelivery.id} • Trx: {selectedOrderForDelivery.trxId}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrderForDelivery(null)}
                  className="text-gray-400 hover:text-gray-700 cursor-pointer p-1 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Customer Info Box */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Customer</span>
                  <span className="font-bold text-slate-800">{selectedOrderForDelivery.customerName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Phone</span>
                  <span className="font-mono text-slate-800">{selectedOrderForDelivery.customerPhone}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Email</span>
                  <span className="text-slate-800 truncate block">{selectedOrderForDelivery.customerEmail}</span>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-1 bg-gray-50/70 p-3 rounded-xl border border-gray-200 text-xs">
                <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">
                  Ordered Items ({selectedOrderForDelivery.items.length})
                </span>
                {selectedOrderForDelivery.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between items-center text-gray-800">
                    <span className="font-medium">
                      {i.productTitle} ({i.variantName})
                    </span>
                    <span className="font-bold">৳{i.unitPrice * i.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Delivery Mode Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Select Delivery Mode:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('file')}
                    className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                      deliveryMode === 'file'
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <UploadCloud className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                    <span className="text-[11px] block">Product File</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMode('credentials')}
                    className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                      deliveryMode === 'credentials'
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Lock className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                    <span className="text-[11px] block">Key / Account</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMode('external')}
                    className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                      deliveryMode === 'external'
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <ExternalLink className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                    <span className="text-[11px] block">External Link</span>
                  </button>
                </div>
              </div>

              {/* Delivery Mode Inputs */}
              {deliveryMode === 'file' && (
                <div className="space-y-2 bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950">
                      Product Binary File
                    </span>
                    {deliveryFileName && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        Firebase Storage
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      File Name
                    </label>
                    <input
                      type="text"
                      value={deliveryFileName}
                      onChange={(e) => setDeliveryFileName(e.target.value)}
                      placeholder="e.g. windows11_pro_x64.iso or product.zip"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Download URL (Firebase Storage or direct token URL)
                    </label>
                    <input
                      type="text"
                      value={deliveryFileUrl}
                      onChange={(e) => setDeliveryFileUrl(e.target.value)}
                      placeholder="https://firebasestorage.googleapis.com/..."
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                </div>
              )}

              {deliveryMode === 'credentials' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Account Credentials / License Keys / Activation Details:
                  </label>
                  <textarea
                    rows={4}
                    value={deliveryCredentialsInput}
                    onChange={(e) => setDeliveryCredentialsInput(e.target.value)}
                    placeholder="Email: customer@example.com&#10;Password: Key123!&#10;PIN: 4421&#10;License Key: XXXX-YYYY-ZZZZ"
                    className="w-full p-3 text-xs font-mono bg-gray-50 border border-gray-300 rounded-xl outline-hidden focus:border-emerald-600"
                  />
                </div>
              )}

              {deliveryMode === 'external' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    External Access / Portal URL:
                  </label>
                  <input
                    type="url"
                    value={deliveryFileUrl}
                    onChange={(e) => setDeliveryFileUrl(e.target.value)}
                    placeholder="https://drive.google.com/... or https://mega.nz/..."
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl"
                  />
                </div>
              )}

              {/* Delivery Notes to Customer */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Message / Guide to Customer:
                </label>
                <input
                  type="text"
                  value={deliveryNotesInput}
                  onChange={(e) => setDeliveryNotesInput(e.target.value)}
                  placeholder="Additional instructions or support notice..."
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl"
                />
              </div>

              {/* Automated Dispatch Checklist */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-[11px] text-slate-600">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Update Order Status to <strong>Delivered</strong> in Cloud Firestore</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Record authenticated Delivery document in <strong>deliveries</strong> collection</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>Trigger automatic <strong>Email Notification</strong> via server backend</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Trigger automatic <strong>WhatsApp Notification</strong> via server backend</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  disabled={isDeliveringOrder}
                  onClick={() => setSelectedOrderForDelivery(null)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeliveringOrder}
                  onClick={handleConfirmDelivery}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  {isDeliveringOrder ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Delivering & Notifying...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Confirm & Deliver Product</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {productToDelete && (
          <div className="fixed inset-0 z-70 bg-black/75 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-gray-200 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center">
                <h3 className="text-base font-black text-gray-900">{t.deleteProduct}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {t.confirmDeleteProduct}
                </p>
                <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
                  <img
                    src={productToDelete.image}
                    alt={productToDelete.titleEn}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <div className="text-left min-w-0">
                    <span className="text-xs font-bold text-gray-900 block truncate">
                      {productToDelete.titleEn}
                    </span>
                    <span className="text-[10px] text-gray-500 block truncate">
                      {productToDelete.titleBn}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteProduct}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  {t.deleteProduct}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product Add & Edit Modal */}
        <AdminProductFormModal
          isOpen={isProductFormOpen}
          onClose={() => {
            setIsProductFormOpen(false);
            setProductToEdit(null);
          }}
          productToEdit={productToEdit}
        />
      </div>
    </div>
  );
};

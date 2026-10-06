import React, { useState, useEffect } from 'react';
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
  AlertCircle,
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
  Building2,
  Database,
  UploadCloud,
  DownloadCloud,
  FileJson,
  Image as ImageIcon,
  AlertOctagon,
  HardDrive,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Order, OrderStatus, Product, User, AdminUser, DeliveryRecord, Complaint, ComplaintStatus } from '../types';
import { AdminProductFormModal } from './AdminProductFormModal';
import { uploadBrandingImage } from '../utils/imageUpload';
import { validateBackupFile } from '../utils/backupRestore';

type AdminTab =
  | 'dashboard'
  | 'users'
  | 'products'
  | 'orders'
  | 'deliveries'
  | 'complaints'
  | 'business'
  | 'backup'
  | 'settings'
  | 'admins';

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
    exportAllData,
    formatAllData,
    restoreAllData,
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

  // Business Information & Website Branding State
  const [businessSettingsForm, setBusinessSettingsForm] = useState({
    businessName: siteSettings.businessName || siteSettings.siteName || 'Minarul Fashion House',
    businessAddress: siteSettings.businessAddress || 'House #12, Road #4, Dhanmondi, Dhaka-1205, Bangladesh',
    businessLogo: siteSettings.businessLogo || siteSettings.siteLogo || '',
    faviconUrl: siteSettings.faviconUrl || '',
    browserTabTitle: siteSettings.browserTabTitle || 'Minarul Fashion House — Digital App & License Store',
  });
  const [logoPreview, setLogoPreview] = useState<string>(siteSettings.businessLogo || siteSettings.siteLogo || '');
  const [faviconPreview, setFaviconPreview] = useState<string>(siteSettings.faviconUrl || '');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadProgress, setLogoUploadProgress] = useState(0);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  const [faviconUploadProgress, setFaviconUploadProgress] = useState(0);
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);

  // Backup, Format & Restore State
  const [isExporting, setIsExporting] = useState(false);
  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
  const [formatConfirmText, setFormatConfirmText] = useState('');
  const [isFormatting, setIsFormatting] = useState(false);

  // Restore State
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreJson, setRestoreJson] = useState<any | null>(null);
  const [restoreValidation, setRestoreValidation] = useState<{
    isValid: boolean;
    error?: string;
    summary?: any;
  } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState<{
    current: number;
    total: number;
    collection: string;
  } | null>(null);
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const [restoreErrorMessage, setRestoreErrorMessage] = useState<string | null>(null);

  // Sync business settings with Firestore
  useEffect(() => {
    setBusinessSettingsForm({
      businessName: siteSettings.businessName || siteSettings.siteName || 'Minarul Fashion House',
      businessAddress: siteSettings.businessAddress || '',
      businessLogo: siteSettings.businessLogo || siteSettings.siteLogo || '',
      faviconUrl: siteSettings.faviconUrl || '',
      browserTabTitle: siteSettings.browserTabTitle || '',
    });
    setLogoPreview(siteSettings.businessLogo || siteSettings.siteLogo || '');
    setFaviconPreview(siteSettings.faviconUrl || '');
  }, [siteSettings]);

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

    // Retrieve the product's existing: External Access Link (e.g. Google Drive URL)
    const productExternalLink = (
      prod?.externalAccessUrl ||
      (prod as any)?.externalAccessLink ||
      (prod as any)?.downloadLink ||
      ''
    ).trim();

    setDeliveryMode('link');

    if (existing) {
      const existingLink = (
        existing.externalAccessUrl ||
        (existing as any)?.externalAccessLink ||
        existing.downloadLink ||
        existing.downloadUrl ||
        productExternalLink ||
        ''
      ).trim();

      setDeliveryContentInput(existingLink);
      setDeliveryNotesInput(existing.notes || existing.adminNotes || '');
    } else {
      // Automatically load External Access Link from the ordered product
      setDeliveryContentInput(productExternalLink);
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

    // 2. Validate that an External Access Link exists
    const cleanContent = deliveryContentInput.trim();
    if (!cleanContent) {
      showToast(
        lang === 'bn'
          ? 'দয়া করে External Access Link (যেমন Google Drive URL) প্রদান করুন।'
          : 'Please provide the External Access Link (e.g. Google Drive URL).',
        'error'
      );
      return;
    }

    try {
      await deliverOrder(selectedOrderForDelivery.id, {
        deliveryMethod: 'external_link',
        externalAccessUrl: cleanContent,
        notes: deliveryNotesInput.trim(),
      });

      setSelectedOrderForDelivery(null);
    } catch (err) {
      console.error('DELIVERY FAILED', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      showToast(`ডেলিভারি ত্রুটি: ${errMsg}`, 'error');
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

  // --- BUSINESS INFORMATION & BRANDING HANDLERS ---
  const handleSaveBusinessSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBusiness(true);
    try {
      await updateSiteSettings({
        businessName: businessSettingsForm.businessName.trim(),
        siteName: businessSettingsForm.businessName.trim(),
        storeName: businessSettingsForm.businessName.trim(),
        businessAddress: businessSettingsForm.businessAddress.trim(),
        businessLogo: logoPreview,
        siteLogo: logoPreview,
        faviconUrl: faviconPreview,
        browserTabTitle: businessSettingsForm.browserTabTitle.trim(),
      });
      showToast(
        lang === 'bn'
          ? 'ব্যবসায়িক ও ওয়েবসাইট ব্র্যান্ডিং সফলভাবে সংরক্ষিত হয়েছে!'
          : 'Business & Website branding settings saved successfully!',
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast(lang === 'bn' ? 'সেটিংস সংরক্ষণে ব্যর্থ' : 'Failed to save business settings', 'error');
    } finally {
      setIsSavingBusiness(false);
    }
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const inputEl = e.target;
    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/x-icon', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(png|jpe?g|webp|ico|svg)$/i)) {
      showToast(
        lang === 'bn'
          ? 'অনুপযুক্ত ফাইল ফরম্যাট। শুধুমাত্র PNG, JPG, JPEG বা WEBP আপলোড করুন।'
          : 'Unsupported format. Please select PNG, JPG, JPEG, or WEBP.',
        'error'
      );
      inputEl.value = '';
      return;
    }

    // Validate size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      showToast(
        lang === 'bn' ? 'ফাইলের আকার ৫MB-এর বেশি হতে পারবে না।' : 'File size cannot exceed 5MB limit.',
        'error'
      );
      inputEl.value = '';
      return;
    }

    setIsUploadingLogo(true);
    setLogoUploadProgress(10);
    try {
      const url = await uploadBrandingImage(file, 'logo', (p) => setLogoUploadProgress(p));
      setLogoPreview(url);
      setBusinessSettingsForm((prev) => ({ ...prev, businessLogo: url }));
      
      // Save directly to Firestore settings document
      await updateSiteSettings({ businessLogo: url, siteLogo: url });

      showToast(
        lang === 'bn'
          ? 'লোগো সফলভাবে আপলোড ও স্থায়ীভাবে সংরক্ষিত হয়েছে!'
          : 'Business logo uploaded and saved successfully!',
        'success'
      );
    } catch (err: any) {
      console.error('Logo upload error:', err);
      showToast(err.message || 'Logo upload error', 'error');
    } finally {
      setIsUploadingLogo(false);
      setLogoUploadProgress(0);
      inputEl.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    setLogoPreview('');
    setBusinessSettingsForm((prev) => ({ ...prev, businessLogo: '' }));
    try {
      await updateSiteSettings({ businessLogo: '', siteLogo: '' });
      showToast(
        lang === 'bn' ? 'লোগো সরানো হয়েছে।' : 'Logo removed successfully.',
        'info'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to remove logo', 'error');
    }
  };

  const handleFaviconFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const inputEl = e.target;
    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(png|jpe?g|webp|ico|svg)$/i)) {
      showToast(
        lang === 'bn'
          ? 'অনুপযুক্ত ফাইল ফরম্যাট। শুধুমাত্র PNG, ICO বা WEBP আপলোড করুন।'
          : 'Unsupported format. Please select PNG, ICO, or WEBP.',
        'error'
      );
      inputEl.value = '';
      return;
    }

    // Validate size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      showToast(
        lang === 'bn' ? 'ফাইলের আকার ৫MB-এর বেশি হতে পারবে না।' : 'File size cannot exceed 5MB limit.',
        'error'
      );
      inputEl.value = '';
      return;
    }

    setIsUploadingFavicon(true);
    setFaviconUploadProgress(10);
    try {
      const url = await uploadBrandingImage(file, 'favicon', (p) => setFaviconUploadProgress(p));
      setFaviconPreview(url);
      setBusinessSettingsForm((prev) => ({ ...prev, faviconUrl: url }));
      
      // Save directly to Firestore settings document
      await updateSiteSettings({ faviconUrl: url });

      showToast(
        lang === 'bn'
          ? 'ফ্যাভিকন সফলভাবে আপলোড ও ক্লাউডে সংরক্ষিত হয়েছে!'
          : 'Favicon uploaded and saved successfully!',
        'success'
      );
    } catch (err: any) {
      console.error('Favicon upload error:', err);
      showToast(err.message || 'Favicon upload error', 'error');
    } finally {
      setIsUploadingFavicon(false);
      setFaviconUploadProgress(0);
      inputEl.value = '';
    }
  };

  const handleRemoveFavicon = async () => {
    setFaviconPreview('');
    setBusinessSettingsForm((prev) => ({ ...prev, faviconUrl: '' }));
    try {
      await updateSiteSettings({ faviconUrl: '' });
      showToast(
        lang === 'bn' ? 'ফ্যাভিকন সরানো হয়েছে।' : 'Favicon removed successfully.',
        'info'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to remove favicon', 'error');
    }
  };

  // --- BACKUP & RESTORE HANDLERS ---
  const handleDownloadBackup = async () => {
    setIsExporting(true);
    try {
      await exportAllData();
    } catch (err: any) {
      showToast(err.message || 'Backup failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleConfirmFormatData = async () => {
    if (formatConfirmText !== 'DELETE') {
      showToast(lang === 'bn' ? 'মুছে ফেলতে "DELETE" লিখুন।' : 'Please type DELETE to confirm.', 'error');
      return;
    }
    setIsFormatting(true);
    try {
      await formatAllData();
      setIsFormatModalOpen(false);
      setFormatConfirmText('');
    } catch (err: any) {
      showToast(err.message || 'Format failed', 'error');
    } finally {
      setIsFormatting(false);
    }
  };

  const handleRestoreFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreFile(file);
    setRestoreProgress(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        setRestoreJson(parsed);
        const validation = validateBackupFile(parsed);
        setRestoreValidation(validation);
        if (!validation.isValid) {
          showToast(validation.error || 'Invalid backup file structure', 'error');
        }
      } catch (parseErr: any) {
        setRestoreJson(null);
        setRestoreValidation({
          isValid: false,
          error: `Corrupted JSON file: ${parseErr.message}`,
        });
        showToast('Invalid JSON file format', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (!restoreJson || !restoreValidation?.isValid) {
      showToast(lang === 'bn' ? 'সঠিক ব্যাকআপ ফাইল সিলেক্ট করুন' : 'Select a valid backup file first', 'error');
      return;
    }
    setIsRestoring(true);
    setRestoreErrorMessage(null);
    try {
      await restoreAllData(restoreJson, (progress) => {
        setRestoreProgress(progress);
      });
      setIsRestoreConfirmOpen(false);
      showToast(
        lang === 'bn' ? 'ডেটাবেজ সফলভাবে রিস্টোর হয়েছে!' : 'Database restored successfully!',
        'success'
      );
    } catch (err: any) {
      console.error('[RESTORE FAILED]:', err);
      setRestoreErrorMessage(err.message || 'Restore failed with unknown error.');
      showToast(lang === 'bn' ? 'রিস্টোর ব্যর্থ হয়েছে।' : 'Restore operation failed', 'error');
    } finally {
      setIsRestoring(false);
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
            {siteSettings.businessLogo || siteSettings.siteLogo ? (
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-700 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                <img
                  src={siteSettings.businessLogo || siteSettings.siteLogo}
                  alt={siteSettings.businessName || siteSettings.siteName || 'Logo'}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">
                  {siteSettings.businessName || siteSettings.siteName || (lang === 'bn' ? 'অ্যাডমিন কন্ট্রোল প্যানেল' : 'Admin Control Panel')}
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
              onClick={() => setActiveTab('business')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'business'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Building2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>🏢 Business Settings</span>
            </button>

            <button
              onClick={() => setActiveTab('backup')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'backup'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Database className="w-4 h-4 shrink-0 text-cyan-400" />
              <span>💾 Backup & Restore</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>💳 Payment & Notices</span>
            </button>

            <button
              onClick={() => setActiveTab('admins')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
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

            {/* ---------------------------------------------------- */}
            {/* TAB: BUSINESS & WEBSITE SETTINGS */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'business' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-400" />
                    <span>
                      {lang === 'bn'
                        ? 'ব্যবসায়িক তথ্য ও ওয়েবসাইট ব্র্যান্ডিং'
                        : 'Business & Website Settings'}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {lang === 'bn'
                      ? 'কোড পরিবর্তন ছাড়াই ব্যবসার নাম, ঠিকানা, লোগো, ফ্যাভিকন ও ব্রাউজার ট্যাব টাইটেল কাস্টমাইজ করুন।'
                      : 'Customize your business name, physical address, logo, favicon, and browser title without editing code.'}
                  </p>
                </div>

                <form onSubmit={handleSaveBusinessSettings} className="space-y-5">
                  {/* General Business Identity */}
                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-700/60 pb-2">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      <span>{lang === 'bn' ? 'ব্যবসায়িক পরিচিতি' : 'Business Identity & Info'}</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Business Name */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          {lang === 'bn' ? 'ব্যবসায়ের নাম (Business Name)' : 'Business Name'} *
                        </label>
                        <input
                          type="text"
                          required
                          value={businessSettingsForm.businessName}
                          onChange={(e) =>
                            setBusinessSettingsForm({
                              ...businessSettingsForm,
                              businessName: e.target.value,
                            })
                          }
                          placeholder="e.g. Minarul Fashion House"
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-semibold"
                        />
                        <span className="text-[11px] text-slate-400 mt-1 block">
                          {lang === 'bn'
                            ? 'হেডার, ফুটার, লগইন, ইনভয়েস এবং অর্ডারে প্রদর্শিত হবে।'
                            : 'Appears in Header, Footer, Login/Register, Invoice, and Order confirmation.'}
                        </span>
                      </div>

                      {/* Browser Tab Title */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          {lang === 'bn' ? 'ব্রাউজার ট্যাব টাইটেল (Browser Tab Title)' : 'Browser Tab Title'}
                        </label>
                        <input
                          type="text"
                          value={businessSettingsForm.browserTabTitle}
                          onChange={(e) =>
                            setBusinessSettingsForm({
                              ...businessSettingsForm,
                              browserTabTitle: e.target.value,
                            })
                          }
                          placeholder="e.g. Minarul Fashion House — Digital App & License Store"
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                        <span className="text-[11px] text-slate-400 mt-1 block">
                          {lang === 'bn'
                            ? 'ব্রাউজারের ট্যাব বারে এই টাইটেলটি স্বয়ংক্রিয়ভাবে দেখাবে।'
                            : 'Dynamically updates document.title shown in browser tabs.'}
                        </span>
                      </div>
                    </div>

                    {/* Business Address */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        {lang === 'bn' ? 'ব্যবসায়ের সম্পূর্ণ ঠিকানা (Business Address)' : 'Business Physical Address'}
                      </label>
                      <textarea
                        rows={2}
                        value={businessSettingsForm.businessAddress}
                        onChange={(e) =>
                          setBusinessSettingsForm({
                            ...businessSettingsForm,
                            businessAddress: e.target.value,
                          })
                        }
                        placeholder="House #12, Road #4, Dhanmondi, Dhaka-1205, Bangladesh"
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed"
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        {lang === 'bn'
                          ? 'ফুটার, রসিদ এবং ইনভয়েসে গ্রাহককে এই ঠিকানা দেখানো হবে।'
                          : 'Displayed on website footer, invoices, and customer receipt details.'}
                      </span>
                    </div>
                  </div>

                  {/* Logo & Favicon Assets */}
                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-700/60 pb-2">
                      <ImageIcon className="w-4 h-4 text-emerald-400" />
                      <span>{lang === 'bn' ? 'ব্র্যান্ডিং ও লোগো ইমেজ' : 'Branding Assets (Logo & Favicon)'}</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Business Logo Upload & Preview */}
                      <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{lang === 'bn' ? 'ব্যবসায়িক লোগো (Business Logo)' : 'Business Logo'}</span>
                          </label>
                          <span className="text-[10px] text-slate-400">PNG, JPG, WEBP</span>
                        </div>

                        {/* Preview Area */}
                        <div className="h-32 rounded-xl bg-slate-950/80 border border-dashed border-slate-700 flex items-center justify-center p-3 relative overflow-hidden group">
                          {logoPreview ? (
                            <img
                              src={logoPreview}
                              alt="Business Logo Preview"
                              className="max-h-full max-w-full object-contain drop-shadow"
                            />
                          ) : (
                            <div className="text-center text-slate-500 space-y-1">
                              <ImageIcon className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
                              <span className="text-xs block">No logo selected</span>
                            </div>
                          )}
                          {isUploadingLogo && (
                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-emerald-400 text-xs font-bold gap-2 p-3">
                              <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                              <span>Uploading... {logoUploadProgress > 0 ? `${logoUploadProgress}%` : ''}</span>
                              <div className="w-28 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.max(10, logoUploadProgress)}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1">
                          <label className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm">
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>{logoPreview ? 'Change Logo' : 'Upload Logo'}</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp"
                              onChange={handleLogoFileChange}
                              className="hidden"
                            />
                          </label>

                          {logoPreview && (
                            <button
                              type="button"
                              onClick={handleRemoveLogo}
                              className="py-2 px-3 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                              title="Remove Logo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove Logo</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Favicon Upload & Preview */}
                      <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{lang === 'bn' ? 'ওয়েবসাইট ফ্যাভিকন (Website Favicon)' : 'Website Favicon'}</span>
                          </label>
                          <span className="text-[10px] text-slate-400">PNG, ICO, WEBP</span>
                        </div>

                        {/* Preview Area */}
                        <div className="h-32 rounded-xl bg-slate-950/80 border border-dashed border-slate-700 flex items-center justify-center p-3 relative overflow-hidden group">
                          {faviconPreview ? (
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-white p-1 border border-slate-600 flex items-center justify-center shadow">
                                <img
                                  src={faviconPreview}
                                  alt="Favicon 32x32"
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div className="text-left text-xs text-slate-300">
                                <span className="font-semibold block text-emerald-400">Active Favicon</span>
                                <span className="text-[11px] text-slate-400">Live preview in browser tab</span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-slate-500 space-y-1">
                              <HardDrive className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
                              <span className="text-xs block">No favicon selected</span>
                            </div>
                          )}
                          {isUploadingFavicon && (
                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-emerald-400 text-xs font-bold gap-2 p-3">
                              <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                              <span>Uploading... {faviconUploadProgress > 0 ? `${faviconUploadProgress}%` : ''}</span>
                              <div className="w-28 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.max(10, faviconUploadProgress)}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1">
                          <label className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm">
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>{faviconPreview ? 'Change Favicon' : 'Upload Favicon'}</span>
                            <input
                              type="file"
                              accept="image/png,image/x-icon,image/webp,image/svg+xml,image/jpeg"
                              onChange={handleFaviconFileChange}
                              className="hidden"
                            />
                          </label>

                          {faviconPreview && (
                            <button
                              type="button"
                              onClick={handleRemoveFavicon}
                              className="py-2 px-3 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                              title="Remove Favicon"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove Favicon</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSavingBusiness}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSavingBusiness ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>{lang === 'bn' ? 'সংরক্ষণ করা হচ্ছে...' : 'Saving Changes...'}</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>{lang === 'bn' ? 'পরিবর্তনগুলো সংরক্ষণ করুন' : 'Save Changes'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB: BACKUP & RESTORE */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'backup' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <Database className="w-5 h-5 text-cyan-400" />
                    <span>
                      {lang === 'bn'
                        ? 'সম্পূর্ণ ওয়েবসাইট ডেটা ব্যাকআপ ও পুনরুদ্ধার'
                        : 'Complete Website Data Backup & Restore'}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {lang === 'bn'
                      ? 'সম্পূর্ণ ফায়ারবেস ডেটাবেস ব্যাকআপ হিসেবে ডাউনলোড করুন, পূর্বে ডাউনলোড করা ফাইল থেকে রিস্টোর করুন অথবা ডেটা রিসেট করুন।'
                      : 'Download a full JSON database snapshot, restore previous backups safely, or format business records.'}
                  </p>
                </div>

                {/* Section 1: Data Backup (Download) */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <DownloadCloud className="w-4 h-4 text-cyan-400" />
                        <span>{lang === 'bn' ? '১. সম্পূর্ণ সিস্টেম ব্যাকআপ ডাউনলোড' : '1. Full System Backup (Download All Data)'}</span>
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {lang === 'bn'
                          ? 'ক্লাউড ফায়ারস্টোরে সংরক্ষিত সব প্রডাক্ট, অর্ডার, গ্রাহক তথ্য, ডিজিটাল ডেলিভারি লিংক, কুপন এবং সেটিংস একটি সিঙ্গেল সুরক্ষিত JSON ফাইলে এক্সপোর্ট করুন।'
                          : 'Export all Firestore collections including Products, Orders, Users, Deliveries, Settings, Coupons, Accounting, Stock Movements, and Complaints into a JSON backup file.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isExporting}
                      onClick={handleDownloadBackup}
                      className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-600/20 cursor-pointer shrink-0 transition-colors"
                    >
                      {isExporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Generating Backup...</span>
                        </>
                      ) : (
                        <>
                          <DownloadCloud className="w-4 h-4" />
                          <span>Download All Data</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Included collections tags */}
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                      Backed-up Collections ({products.length} Products, {orders.length} Orders, {allUsers.length} Users):
                    </span>
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-cyan-300">
                      {[
                        'products',
                        'orders',
                        'deliveries',
                        'complaints',
                        'settings',
                        'users',
                        'admins',
                        'coupons',
                        'stockMovements',
                        'sales',
                        'purchases',
                        'expenses',
                      ].map((col) => (
                        <span
                          key={col}
                          className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300"
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 2: Restore Data from Backup */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <UploadCloud className="w-4 h-4 text-emerald-400" />
                      <span>{lang === 'bn' ? '২. ব্যাকআপ ফাইল থেকে ডেটা রিস্টোর' : '2. Restore Database from Backup File'}</span>
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {lang === 'bn'
                        ? 'পূর্বে ডাউনলোড করা JSON ব্যাকআপ ফাইল আপলোড করে ডেটাবেজ পুনরুদ্ধার করুন।'
                        : 'Upload a previously generated backup JSON file to restore collections and records back into Firestore.'}
                    </p>
                  </div>

                  {/* File Selector */}
                  <div className="border border-dashed border-slate-700 rounded-xl p-5 bg-slate-900/50 text-center space-y-2">
                    <FileJson className="w-8 h-8 text-emerald-400 mx-auto opacity-70" />
                    <div>
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer border border-slate-600 transition-colors">
                        <UploadCloud className="w-4 h-4 text-emerald-400" />
                        <span>Select JSON Backup File</span>
                        <input
                          type="file"
                          accept=".json,application/json"
                          onChange={handleRestoreFileSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {restoreFile && (
                      <p className="text-xs text-slate-300 font-mono">
                        Selected: <strong className="text-emerald-400">{restoreFile.name}</strong> ({(restoreFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>

                  {/* Validation Summary Card */}
                  {restoreValidation && (
                    <div
                      className={`p-4 rounded-xl border space-y-3 ${
                        restoreValidation.isValid
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                          : 'bg-red-950/20 border-red-500/40 text-red-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-bold">
                        {restoreValidation.isValid ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Valid Backup File Structure</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-red-400" />
                            <span>{restoreValidation.error || 'Invalid Backup File'}</span>
                          </>
                        )}
                      </div>

                      {restoreValidation.isValid && restoreValidation.summary && (
                        <div className="space-y-3 text-xs">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300 bg-slate-900/70 p-3 rounded-lg border border-slate-800">
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase">Project</span>
                              <span className="font-bold text-white">{restoreValidation.summary.projectName}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase">Version</span>
                              <span className="font-bold text-white">{restoreValidation.summary.backupVersion}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase">Total Documents</span>
                              <span className="font-bold text-emerald-400 font-mono">
                                {restoreValidation.summary.totalDocuments}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase">Created At</span>
                              <span className="font-mono text-[11px] text-slate-300">
                                {new Date(restoreValidation.summary.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Breakdown */}
                          <div>
                            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                              Documents Per Collection:
                            </span>
                            <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                              {Object.entries(restoreValidation.summary.collectionCounts).map(
                                ([cName, cCount]) => (
                                  <span
                                    key={cName}
                                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200"
                                  >
                                    {cName}: <strong className="text-emerald-400">{cCount as number}</strong>
                                  </span>
                                )
                              )}
                            </div>
                          </div>

                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => setIsRestoreConfirmOpen(true)}
                              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/30 cursor-pointer transition-colors"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Preview & Execute Restore</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Section 3: Format Business Data (Factory Reset) */}
                <div className="bg-red-950/20 border border-red-500/40 rounded-2xl p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
                        <AlertOctagon className="w-4 h-4 text-red-400" />
                        <span>{lang === 'bn' ? '৩. ব্যবসায়িক ডেটা ফরম্যাট (ফ্যাক্টরি রিসেট)' : '3. Format Business Data (Factory Reset)'}</span>
                      </h3>
                      <p className="text-xs text-red-300/80 leading-relaxed">
                        {lang === 'bn'
                          ? 'সতর্কতা: এটি পণ্যের তালিকা, কাস্টমার অর্ডার, ডিজিটাল ডেলিভারি লগ, অভিযোগ টিকেট এবং ট্রানজ্যাকশন স্থায়ীভাবে মুছে ফেলবে। অ্যাডমিন অ্যাকাউন্ট সুরক্ষিত থাকবে।'
                          : 'Warning: This action will permanently erase all business orders, products, deliveries, complaints, coupons, and non-admin customers. Admin authentication is preserved.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setFormatConfirmText('');
                        setIsFormatModalOpen(true);
                      }}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-600/30 cursor-pointer shrink-0 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Format Data...</span>
                    </button>
                  </div>
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

            {/* Delivery Method */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Delivery Method</label>
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold">
                <ExternalLink className="w-4 h-4 text-emerald-400" />
                <span>External Access Link (Google Drive / Resource URL)</span>
              </div>
            </div>

            {/* Delivery Link Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Delivery Link *
              </label>
              <input
                type="url"
                required
                value={deliveryContentInput}
                onChange={(e) => setDeliveryContentInput(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500 placeholder-slate-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {lang === 'bn'
                  ? 'এই লিংকটি সরাসরি অর্ডারের প্রোডাক্ট থেকে স্বয়ংক্রিয়ভাবে লোড হয়েছে।'
                  : 'Automatically loaded from the purchased product data.'}
              </p>
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
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black tracking-wider uppercase shadow-md shadow-emerald-600/30 cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isDeliveringOrder ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Delivering...</span>
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4" />
                    <span>DELIVER</span>
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
                {viewDeliveryContentModal.externalAccessUrl ||
                  (viewDeliveryContentModal as any).externalAccessLink ||
                  viewDeliveryContentModal.downloadUrl ||
                  viewDeliveryContentModal.credentials ||
                  viewDeliveryContentModal.licenseKey ||
                  'No delivery link recorded.'}
              </div>

              <button
                onClick={() =>
                  handleCopyText(
                    viewDeliveryContentModal.externalAccessUrl ||
                      (viewDeliveryContentModal as any).externalAccessLink ||
                      viewDeliveryContentModal.downloadUrl ||
                      viewDeliveryContentModal.credentials ||
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
      {/* MODAL: CONFIRM RESTORE DATABASE */}
      {/* ---------------------------------------------------- */}
      {isRestoreConfirmOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-5 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white flex items-center gap-2 text-base">
                <RefreshCw className={`w-5 h-5 text-emerald-400 ${isRestoring ? 'animate-spin' : ''}`} />
                <span>Confirm Database Restore</span>
              </h3>
              {!isRestoring && (
                <button
                  onClick={() => setIsRestoreConfirmOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-sans">Backup Date:</span>
                    <strong className="text-white">
                      {restoreValidation?.summary?.createdAt
                        ? new Date(restoreValidation.summary.createdAt).toLocaleString()
                        : 'Unknown'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-sans">Backup Version:</span>
                    <strong className="text-white">{restoreValidation?.summary?.backupVersion || '1.0'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-sans">Total Collections:</span>
                    <strong className="text-cyan-400">
                      {restoreValidation?.summary?.collectionCounts
                        ? Object.keys(restoreValidation.summary.collectionCounts).length
                        : 0}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-sans">Total Documents:</span>
                    <strong className="text-emerald-400 font-bold">
                      {restoreValidation?.summary?.totalDocuments || 0}
                    </strong>
                  </div>
                </div>

                {restoreValidation?.summary?.collectionCounts && (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-1">Collections & Document Counts:</span>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto font-mono text-[10px]">
                      {Object.entries(restoreValidation.summary.collectionCounts).map(([col, cnt]) => (
                        <span key={col} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                          {col}: <strong className="text-emerald-400">{cnt as number}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-amber-200 text-xs space-y-1">
                <span className="font-bold flex items-center gap-1 text-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Restore Warning:
                </span>
                <p className="leading-relaxed">
                  Restoring will write records directly to Firestore using their original document IDs.
                  Existing documents with identical IDs will be overwritten or updated.
                </p>
              </div>

              <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60 text-slate-200 font-medium">
                Are you sure you want to restore this backup?
              </div>

              {/* Error Box if Restore Failed */}
              {restoreErrorMessage && (
                <div className="bg-red-950/40 border border-red-500/60 rounded-xl p-3.5 text-red-200 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-red-400">
                    <AlertOctagon className="w-4 h-4 shrink-0" />
                    <span>Restore Failed</span>
                  </div>
                  <pre className="text-[11px] font-mono whitespace-pre-wrap text-red-300 bg-red-950/60 p-2.5 rounded-lg border border-red-800/40 overflow-x-auto leading-relaxed select-all">
                    {restoreErrorMessage}
                  </pre>
                </div>
              )}

              {/* Progress Bar during Restore */}
              {isRestoring && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Restoring {restoreProgress?.collection ? `[${restoreProgress.collection}]` : ''}...
                    </span>
                    <span className="font-mono text-slate-300">
                      {restoreProgress?.current || 0} / {restoreProgress?.total || 0}
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                      style={{
                        width: `${
                          restoreProgress && restoreProgress.total > 0
                            ? Math.min(100, Math.round((restoreProgress.current / restoreProgress.total) * 100))
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                disabled={isRestoring}
                onClick={() => {
                  setIsRestoreConfirmOpen(false);
                  setRestoreErrorMessage(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isRestoring}
                onClick={handleExecuteRestore}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Restoring Data...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Restore Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: CONFIRM FORMAT BUSINESS DATA */}
      {/* ---------------------------------------------------- */}
      {isFormatModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-red-500/60 rounded-2xl w-full max-w-md p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-red-500/30 pb-3">
              <h3 className="font-bold text-red-400 flex items-center gap-2 text-base">
                <AlertOctagon className="w-5 h-5" />
                <span>Format All Business Data</span>
              </h3>
              {!isFormatting && (
                <button
                  onClick={() => setIsFormatModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 space-y-1">
                <strong className="block text-red-400 font-bold uppercase">Irreversible Action:</strong>
                <p className="leading-relaxed">
                  This will permanently delete all Products, Orders, Digital Deliveries, Coupons,
                  Accounting movements, and non-admin customers from Firestore.
                </p>
                <p className="text-[11px] text-emerald-400 font-semibold pt-1">
                  ✓ Administrator accounts and administrative access privileges will be protected and preserved.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Type <span className="text-red-400 font-mono font-bold">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={formatConfirmText}
                  onChange={(e) => setFormatConfirmText(e.target.value)}
                  placeholder="DELETE"
                  disabled={isFormatting}
                  className="w-full px-3 py-2 bg-slate-950 border border-red-500/40 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500 font-mono font-bold tracking-wider"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                disabled={isFormatting}
                onClick={() => setIsFormatModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={formatConfirmText !== 'DELETE' || isFormatting}
                onClick={handleConfirmFormatData}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer"
              >
                {isFormatting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Formatting Data...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Permanently Format Data</span>
                  </>
                )}
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

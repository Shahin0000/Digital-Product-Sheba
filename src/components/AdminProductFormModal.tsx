import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Save,
  Image as ImageIcon,
  Layers,
  Sparkles,
  ShieldCheck,
  Tag,
  Check,
  UploadCloud,
  FileText,
  Download,
  RefreshCw,
  FileCode,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, sanitizeForFirestore } from '../lib/firebase';
import { Product, ProductVariant, DeliveryType, Category } from '../types';
import { useStore } from '../context/StoreContext';

interface AdminProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit: Product | null;
}

const PRESET_IMAGES = [
  { name: 'Netflix', url: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&auto=format&fit=crop&q=80' },
  { name: 'ChatGPT AI', url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&auto=format&fit=crop&q=80' },
  { name: 'Canva Pro', url: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&auto=format&fit=crop&q=80' },
  { name: 'Windows 11', url: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=600&auto=format&fit=crop&q=80' },
  { name: 'MS Office', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80' },
  { name: 'VPN Security', url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&auto=format&fit=crop&q=80' },
  { name: 'Spotify Music', url: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=600&auto=format&fit=crop&q=80' },
  { name: 'Streaming Media', url: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=600&auto=format&fit=crop&q=80' },
];

export const AdminProductFormModal: React.FC<AdminProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { categories, addProduct, updateProduct, showToast, lang, t } = useStore();

  // Basic Details
  const [titleEn, setTitleEn] = useState('');
  const [titleBn, setTitleBn] = useState('');
  const [categoryId, setCategoryId] = useState('ott');
  const [image, setImage] = useState('');
  const [badgeEn, setBadgeEn] = useState('');
  const [badgeBn, setBadgeBn] = useState('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('shared_account');
  const [warrantyEn, setWarrantyEn] = useState('Full Duration Replacement');
  const [warrantyBn, setWarrantyBn] = useState('সম্পূর্ণ মেয়াদজুড়ে রিপ্লেসমেন্ট ওয়ারেন্টি');
  const [featured, setFeatured] = useState(false);
  const [trending, setTrending] = useState(false);

  // Descriptions
  const [shortDescEn, setShortDescEn] = useState('');
  const [shortDescBn, setShortDescBn] = useState('');
  const [fullDescEn, setFullDescEn] = useState('');
  const [fullDescBn, setFullDescBn] = useState('');
  const [instructionsEn, setInstructionsEn] = useState('');
  const [instructionsBn, setInstructionsBn] = useState('');

  // Variants
  const [variants, setVariants] = useState<ProductVariant[]>([
    {
      id: 'var-1',
      nameEn: '1 Month Access',
      nameBn: '১ মাস মেয়াদের অ্যাক্সেস',
      durationEn: '1 Month',
      durationBn: '১ মাস',
      accountTypeEn: 'Shared Profile (With PIN)',
      accountTypeBn: 'শেয়ার্ড প্রোফাইল (পিন সহ)',
      regularPrice: 350,
      salePrice: 290,
      inStock: true,
      sampleKey: '',
    },
  ]);

  // Digital Product Delivery & Storage Configuration
  const [isDigitalProduct, setIsDigitalProduct] = useState(true);
  const [downloadAccessType, setDownloadAccessType] = useState<'file_download' | 'credentials' | 'external_link'>('file_download');
  const [digitalFileName, setDigitalFileName] = useState('');
  const [digitalFileSize, setDigitalFileSize] = useState<number | undefined>(undefined);
  const [digitalFileType, setDigitalFileType] = useState('');
  const [digitalFileStoragePath, setDigitalFileStoragePath] = useState('');
  const [digitalFileUrl, setDigitalFileUrl] = useState('');
  const [externalAccessUrl, setExternalAccessUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing data if editing
  useEffect(() => {
    if (productToEdit) {
      setTitleEn(productToEdit.titleEn || '');
      setTitleBn(productToEdit.titleBn || '');
      setCategoryId(productToEdit.categoryId || 'ott');
      setImage(productToEdit.image || '');
      setBadgeEn(productToEdit.badgeEn || '');
      setBadgeBn(productToEdit.badgeBn || '');
      setDeliveryType(productToEdit.deliveryType || 'shared_account');
      setWarrantyEn(productToEdit.warrantyEn || 'Full Duration Replacement');
      setWarrantyBn(productToEdit.warrantyBn || 'সম্পূর্ণ মেয়াদজুড়ে রিপ্লেসমেন্ট ওয়ারেন্টি');
      setFeatured(!!productToEdit.featured);
      setTrending(!!productToEdit.trending);
      setShortDescEn(productToEdit.shortDescEn || '');
      setShortDescBn(productToEdit.shortDescBn || '');
      setFullDescEn(productToEdit.fullDescEn || '');
      setFullDescBn(productToEdit.fullDescBn || '');
      setInstructionsEn(productToEdit.instructionsEn || '');
      setInstructionsBn(productToEdit.instructionsBn || '');
      setIsDigitalProduct(productToEdit.isDigitalProduct ?? true);
      setDownloadAccessType(productToEdit.downloadAccessType || 'file_download');
      setDigitalFileName(productToEdit.digitalFileName || '');
      setDigitalFileSize(productToEdit.digitalFileSize);
      setDigitalFileType(productToEdit.digitalFileType || '');
      setDigitalFileStoragePath(productToEdit.digitalFileStoragePath || '');
      setDigitalFileUrl(productToEdit.digitalFileUrl || '');
      setExternalAccessUrl(productToEdit.externalAccessUrl || '');
      setVariants(
        productToEdit.variants && productToEdit.variants.length > 0
          ? JSON.parse(JSON.stringify(productToEdit.variants))
          : [
              {
                id: 'var-1',
                nameEn: 'Standard Tier',
                nameBn: 'স্ট্যান্ডার্ড টিয়ার',
                durationEn: '1 Month',
                durationBn: '১ মাস',
                accountTypeEn: 'Instant Delivery',
                accountTypeBn: 'ইনস্ট্যান্ট ডেলিভারি',
                regularPrice: 500,
                salePrice: 350,
                inStock: true,
              },
            ]
      );
    } else {
      // Reset form for fresh product creation
      setTitleEn('');
      setTitleBn('');
      setCategoryId(categories[1]?.id || 'ott');
      setImage(PRESET_IMAGES[0].url);
      setBadgeEn('HOT SELLER');
      setBadgeBn('জনপ্রিয়');
      setDeliveryType('shared_account');
      setWarrantyEn('Full Duration Replacement');
      setWarrantyBn('সম্পূর্ণ মেয়াদজুড়ে রিপ্লেসমেন্ট ওয়ারেন্টি');
      setFeatured(true);
      setTrending(true);
      setShortDescEn('Premium digital subscription with 100% warranty and fast delivery.');
      setShortDescBn('১০০% রিপ্লেসমেন্ট ওয়ারেন্টি ও দ্রুত ডেলিভারিসহ প্রিমিয়াম ডিজিটাল সাবস্ক্রিপশন।');
      setFullDescEn('Get instant, official, hassle-free access with full support and seamless experience.');
      setFullDescBn('অফিসিয়াল ও নির্ভরযোগ্য অ্যাক্সেস সহ ঝামেলাহীন প্রিমিয়াম সেবা উপভোগ করুন।');
      setInstructionsEn('Check your email and invoice receipt for the login credentials.');
      setInstructionsBn('অর্ডার রসিদ এবং ইউজার ড্যাশবোর্ডে প্রদত্ত আইডি ও পাসওয়ার্ড দিয়ে লগইন করুন।');
      setIsDigitalProduct(true);
      setDownloadAccessType('file_download');
      setDigitalFileName('');
      setDigitalFileSize(undefined);
      setDigitalFileType('');
      setDigitalFileStoragePath('');
      setDigitalFileUrl('');
      setExternalAccessUrl('');
      setVariants([
        {
          id: `var-${Date.now()}-1`,
          nameEn: '1 Month Plan',
          nameBn: '১ মাস প্ল্যান',
          durationEn: '1 Month',
          durationBn: '১ মাস',
          accountTypeEn: 'Shared Profile (With PIN)',
          accountTypeBn: 'শেয়ার্ড প্রোফাইল (পিন সহ)',
          regularPrice: 400,
          salePrice: 320,
          inStock: true,
          sampleKey: 'user@vip.com | Pass: Premium123#',
        },
      ]);
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddVariant = () => {
    const newId = `var-${Date.now()}-${variants.length + 1}`;
    setVariants((prev) => [
      ...prev,
      {
        id: newId,
        nameEn: 'New Duration / Tier',
        nameBn: 'নতুন মেয়াদ / টিয়ার',
        durationEn: '1 Month',
        durationBn: '১ মাস',
        accountTypeEn: 'Shared Account',
        accountTypeBn: 'শেয়ার্ড অ্যাকাউন্ট',
        regularPrice: 500,
        salePrice: 380,
        inStock: true,
        sampleKey: '',
      },
    ]);
  };

  const handleRemoveVariant = (variantId: string) => {
    if (variants.length <= 1) {
      showToast(
        lang === 'bn' ? 'কমপক্ষে একটি ভ্যারিয়েন্ট থাকতে হবে' : 'Product must have at least one variant',
        'error'
      );
      return;
    }
    setVariants((prev) => prev.filter((v) => v.id !== variantId));
  };

  const handleVariantChange = (
    variantId: string,
    field: keyof ProductVariant,
    value: any
  ) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, [field]: value } : v))
    );
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const prodFolderId = productToEdit?.id || `prod-new-${Date.now()}`;
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `digital-products/${prodFolderId}/${Date.now()}_${safeName}`;
      const storageRef = ref(storage, storagePath);

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(progress);
        },
        (err) => {
          console.error('Storage upload error:', err);
          showToast(err.message || 'File upload failed', 'error');
          setIsUploading(false);
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setDigitalFileName(file.name);
          setDigitalFileSize(file.size);
          setDigitalFileType(file.type || 'application/octet-stream');
          setDigitalFileStoragePath(storagePath);
          setDigitalFileUrl(downloadUrl);
          setIsUploading(false);
          setUploadProgress(100);
          showToast(
            lang === 'bn' ? 'ফাইল ক্লাউড স্টোরেজে আপলোড হয়েছে!' : 'File uploaded to Firebase Storage!',
            'success'
          );
        }
      );
    } catch (err: unknown) {
      console.error('File upload start error:', err);
      setIsUploading(false);
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg, 'error');
    }
  };

  const handleRemoveFile = () => {
    setDigitalFileName('');
    setDigitalFileSize(undefined);
    setDigitalFileType('');
    setDigitalFileStoragePath('');
    setDigitalFileUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showToast(lang === 'bn' ? 'ফাইল প্রোডাক্ট থেকে অপসারণ করা হয়েছে' : 'File removed from product', 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titleEn.trim() || !titleBn.trim()) {
      showToast(
        lang === 'bn' ? 'দয়া করে ইংরেজি ও বাংলা নাম লিখুন' : 'Please provide English and Bangla titles',
        'error'
      );
      return;
    }

    if (!image.trim()) {
      showToast(
        lang === 'bn' ? 'প্রোডাক্ট ইমেজ ইউআরএল দিন' : 'Please provide product image URL',
        'error'
      );
      return;
    }

    if (variants.length === 0) {
      showToast(
        lang === 'bn' ? 'কমপক্ষে একটি ভ্যারিয়েন্ট যোগ করুন' : 'Add at least one variant',
        'error'
      );
      return;
    }

    // Process external access link if selected
    let cleanExternalUrl = externalAccessUrl.trim();
    if (isDigitalProduct && downloadAccessType === 'external_link') {
      if (!cleanExternalUrl) {
        showToast(
          lang === 'bn'
            ? 'দয়া করে এক্সটার্নাল অ্যাক্সেস বা Google Drive URL প্রদান করুন'
            : 'Please provide the External Access / Google Drive URL',
          'error'
        );
        return;
      }
      // Ensure scheme if user provided domain without protocol
      if (!cleanExternalUrl.startsWith('http://') && !cleanExternalUrl.startsWith('https://')) {
        cleanExternalUrl = `https://${cleanExternalUrl}`;
      }
    }

    // Sanitize variants to eliminate undefined properties
    const cleanVariants = variants.map((v) => ({
      id: v.id || `var-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      nameEn: v.nameEn || '',
      nameBn: v.nameBn || '',
      durationEn: v.durationEn || '',
      durationBn: v.durationBn || '',
      accountTypeEn: v.accountTypeEn || '',
      accountTypeBn: v.accountTypeBn || '',
      regularPrice: Number(v.regularPrice) || 0,
      salePrice: Number(v.salePrice) || 0,
      inStock: v.inStock !== false,
      stockCount: v.stockCount ?? 50,
      sampleKey: v.sampleKey ? v.sampleKey.trim() : '',
    }));

    // Construct clean payload preserving all existing fields
    const rawPayload: Record<string, any> = {
      ...(productToEdit || {}),
      titleEn: titleEn.trim(),
      titleBn: titleBn.trim(),
      categoryId,
      image: image.trim(),
      badgeEn: badgeEn.trim() || '',
      badgeBn: badgeBn.trim() || '',
      deliveryType,
      warrantyEn: warrantyEn.trim(),
      warrantyBn: warrantyBn.trim(),
      shortDescEn: shortDescEn.trim(),
      shortDescBn: shortDescBn.trim(),
      fullDescEn: fullDescEn.trim(),
      fullDescBn: fullDescBn.trim(),
      instructionsEn: instructionsEn.trim(),
      instructionsBn: instructionsBn.trim(),
      featured: Boolean(featured),
      trending: Boolean(trending),
      variants: cleanVariants,
      rating: productToEdit?.rating ?? 5.0,
      reviewsCount: productToEdit?.reviewsCount ?? 1,
      totalSold: productToEdit?.totalSold ?? 0,
      // Digital Product Delivery Config
      isDigitalProduct: Boolean(isDigitalProduct),
      downloadAccessType,
      digitalFileName: digitalFileName.trim() || '',
      digitalFileSize: digitalFileSize || 0,
      digitalFileType: digitalFileType.trim() || '',
      digitalFileStoragePath: digitalFileStoragePath.trim() || '',
      digitalFileUrl: digitalFileUrl.trim() || '',
      externalAccessUrl: cleanExternalUrl,
      externalAccessLink: cleanExternalUrl,
    };

    // Strip any possible undefined values so Firestore will never reject
    const sanitizedPayload = sanitizeForFirestore(rawPayload);

    // Development Console Logging as requested
    console.log('SAVE PRODUCT START');
    console.log('PRODUCT DATA', sanitizedPayload);
    console.log('DELIVERY METHOD', downloadAccessType);
    console.log('EXTERNAL ACCESS URL', cleanExternalUrl);
    console.log('FIRESTORE WRITE START');

    setIsSubmitting(true);
    try {
      if (productToEdit) {
        await updateProduct(productToEdit.id, sanitizedPayload);
      } else {
        const newId = `prod-${Date.now()}`;
        await addProduct({
          ...sanitizedPayload,
          id: newId,
        } as Product);
      }

      console.log('FIRESTORE WRITE SUCCESS');
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      console.error('FIRESTORE WRITE ERROR', err);
      setIsSubmitting(false);
      const errMsg = err instanceof Error ? err.message : String(err);
      showToast(`Firestore save error: ${errMsg}`, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
      <div
        className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
              {productToEdit ? <Tag className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                {productToEdit
                  ? `${t.editProduct}: ${productToEdit.titleEn}`
                  : t.addProduct}
              </h2>
              <p className="text-xs text-gray-400">
                {lang === 'bn'
                  ? 'প্রোডাক্টের নাম, মূল্য, ভ্যারিয়েন্ট ও বর্ণনা আপডেট করুন'
                  : 'Manage product information, pricing tiers, and delivery details'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* SECTION 1: BASIC INFORMATION */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>1. Basic Product Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  {t.productTitleEn} *
                </label>
                <input
                  type="text"
                  required
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="e.g. Netflix Ultra HD 4K (1 Profile)"
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  {t.productTitleBn} *
                </label>
                <input
                  type="text"
                  required
                  value={titleBn}
                  onChange={(e) => setTitleBn(e.target.value)}
                  placeholder="যেমন: নেটফ্লিক্স আল্ট্রা এইচডি ৪কে সাবস্ক্রিপশন"
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  {t.selectCategory} *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-hidden font-medium cursor-pointer"
                >
                  {categories.slice(1).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameEn} ({c.nameBn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  {t.deliveryType} *
                </label>
                <select
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value as DeliveryType)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-hidden font-medium cursor-pointer"
                >
                  <option value="shared_account">Shared Account (Login & PIN)</option>
                  <option value="instant_key">Instant License Key (25-digit/Token)</option>
                  <option value="private_mail">Private Mail (Activated on User Email)</option>
                  <option value="custom_activation">Custom Activation Link / Invite</option>
                </select>
              </div>
            </div>

            {/* Image URL & Presets */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                {t.imageUrl} *
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="url"
                  required
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-hidden font-mono"
                />
                {image && (
                  <div className="w-9 h-9 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                    <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] text-gray-400 font-bold uppercase mr-1">Presets:</span>
                {PRESET_IMAGES.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setImage(p.url)}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 border border-gray-200 cursor-pointer transition-colors"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Badges and Warranty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  {t.badgeText} (EN)
                </label>
                <input
                  type="text"
                  value={badgeEn}
                  onChange={(e) => setBadgeEn(e.target.value)}
                  placeholder="e.g. HOT SELLER or 4K UHD"
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  {t.badgeText} (BN)
                </label>
                <input
                  type="text"
                  value={badgeBn}
                  onChange={(e) => setBadgeBn(e.target.value)}
                  placeholder="যেমন: জনপ্রিয় বা ৪কে"
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  {t.warrantyDuration} (EN)
                </label>
                <input
                  type="text"
                  value={warrantyEn}
                  onChange={(e) => setWarrantyEn(e.target.value)}
                  placeholder="e.g. 1 Month Full Replacement Warranty"
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  {t.warrantyDuration} (BN)
                </label>
                <input
                  type="text"
                  value={warrantyBn}
                  onChange={(e) => setWarrantyBn(e.target.value)}
                  placeholder="যেমন: ১ মাস সম্পূর্ণ রিপ্লেসমেন্ট ওয়ারেন্টি"
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl font-medium"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap gap-4 pt-1">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-sm border-gray-300 focus:ring-emerald-500"
                />
                <span>{t.featuredProduct}</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={trending}
                  onChange={(e) => setTrending(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-sm border-gray-300 focus:ring-emerald-500"
                />
                <span>Trending Badge</span>
              </label>
            </div>
          </div>

          {/* SECTION 2: VARIANTS & PRICING */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>2. {t.variants} ({variants.length})</span>
              </h3>

              <button
                type="button"
                onClick={handleAddVariant}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer border border-emerald-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.addVariant}</span>
              </button>
            </div>

            <div className="space-y-3">
              {variants.map((v, idx) => (
                <div
                  key={v.id}
                  className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200 space-y-3 relative"
                >
                  <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                    <span className="text-xs font-bold text-gray-900">
                      Tier #{idx + 1}: {v.nameEn || 'Untitled Variant'}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(v.id)}
                      disabled={variants.length <= 1}
                      className={`p-1 rounded-lg text-xs cursor-pointer transition-colors ${
                        variants.length <= 1
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-rose-600 hover:bg-rose-50'
                      }`}
                      title="Remove Variant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-gray-600 block mb-1">
                        Name (EN) *
                      </label>
                      <input
                        type="text"
                        required
                        value={v.nameEn}
                        onChange={(e) => handleVariantChange(v.id, 'nameEn', e.target.value)}
                        placeholder="e.g. 1 Month"
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-600 block mb-1">
                        Name (BN) *
                      </label>
                      <input
                        type="text"
                        required
                        value={v.nameBn}
                        onChange={(e) => handleVariantChange(v.id, 'nameBn', e.target.value)}
                        placeholder="যেমন: ১ মাস"
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-600 block mb-1">
                        Regular Price (৳) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={v.regularPrice}
                        onChange={(e) =>
                          handleVariantChange(v.id, 'regularPrice', Number(e.target.value) || 0)
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-600 block mb-1">
                        Sale Price (৳) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={v.salePrice}
                        onChange={(e) =>
                          handleVariantChange(v.id, 'salePrice', Number(e.target.value) || 0)
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg font-mono font-bold text-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-600 block mb-1">
                        Duration (EN)
                      </label>
                      <input
                        type="text"
                        value={v.durationEn}
                        onChange={(e) => handleVariantChange(v.id, 'durationEn', e.target.value)}
                        placeholder="e.g. 1 Month"
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-600 block mb-1">
                        Duration (BN)
                      </label>
                      <input
                        type="text"
                        value={v.durationBn}
                        onChange={(e) => handleVariantChange(v.id, 'durationBn', e.target.value)}
                        placeholder="যেমন: ১ মাস"
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-600 block mb-1">
                        Account Type (EN)
                      </label>
                      <input
                        type="text"
                        value={v.accountTypeEn}
                        onChange={(e) => handleVariantChange(v.id, 'accountTypeEn', e.target.value)}
                        placeholder="Shared PIN / Private"
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={v.inStock}
                          onChange={(e) =>
                            handleVariantChange(v.id, 'inStock', e.target.checked)
                          }
                          className="w-4 h-4 text-emerald-600 rounded-sm border-gray-300"
                        />
                        <span>In Stock</span>
                      </label>
                    </div>
                  </div>

                  {/* Sample default credentials for automated/instant delivery */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-1">
                      Pre-loaded Key / Login Credentials (Optional auto-fulfillment):
                    </label>
                    <input
                      type="text"
                      value={v.sampleKey || ''}
                      onChange={(e) => handleVariantChange(v.id, 'sampleKey', e.target.value)}
                      placeholder="e.g. Email: netflix.user@gmail.com | Pass: pass123# | PIN: 4412"
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg font-mono text-[11px]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: DESCRIPTIONS & ACTIVATION GUIDES */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-emerald-600" />
              <span>3. Descriptions & Activation Guides</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Short Description (EN)
                </label>
                <textarea
                  rows={2}
                  value={shortDescEn}
                  onChange={(e) => setShortDescEn(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Short Description (BN)
                </label>
                <textarea
                  rows={2}
                  value={shortDescBn}
                  onChange={(e) => setShortDescBn(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Activation Instructions (EN)
                </label>
                <textarea
                  rows={3}
                  value={instructionsEn}
                  onChange={(e) => setInstructionsEn(e.target.value)}
                  placeholder="Step-by-step how the customer activates or logs in..."
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Activation Instructions (BN)
                </label>
                <textarea
                  rows={3}
                  value={instructionsBn}
                  onChange={(e) => setInstructionsBn(e.target.value)}
                  placeholder="গ্রাহক কীভাবে ব্যবহার বা একটিভ করবেন তার নিয়মাবলী..."
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: DIGITAL PRODUCT DELIVERY & FIREBASE STORAGE */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-emerald-600" />
                <span>4. Digital Product Delivery & Secure File Storage</span>
              </h3>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isDigitalProduct}
                  onChange={(e) => setIsDigitalProduct(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                />
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  {isDigitalProduct ? 'Digital Delivery Enabled' : 'Disabled'}
                </span>
              </label>
            </div>

            {isDigitalProduct && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                {/* Download/Access Configuration Type */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-2">
                    Product Download / Access Delivery Method:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setDownloadAccessType('file_download')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                        downloadAccessType === 'file_download'
                          ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <UploadCloud className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold">File Download</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-normal">
                        Stored securely in Firebase Storage
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDownloadAccessType('credentials')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                        downloadAccessType === 'credentials'
                          ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Lock className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold">Credentials / Key</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-normal">
                        Accounts, license keys, login PINs
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDownloadAccessType('external_link')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                        downloadAccessType === 'external_link'
                          ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <ExternalLink className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold">External Access Link</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-normal">
                        Direct drive or portal URL
                      </span>
                    </button>
                  </div>
                </div>

                {/* File Upload Section when downloadAccessType === 'file_download' */}
                {downloadAccessType === 'file_download' && (
                  <div className="space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="digital-file-input"
                    />

                    {digitalFileName && digitalFileUrl ? (
                      /* Current Uploaded File Card */
                      <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <FileCode className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-slate-900 truncate max-w-[220px] sm:max-w-xs">
                                {digitalFileName}
                              </span>
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                Firebase Storage
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span>Size: {formatFileSize(digitalFileSize)}</span>
                              <span>•</span>
                              <span>Type: {digitalFileType || 'Binary File'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Replace File</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            disabled={isUploading}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Empty Upload Dropzone */
                      <div
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                        className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                          isUploading
                            ? 'border-emerald-400 bg-emerald-50/50 cursor-wait'
                            : 'border-slate-300 bg-white hover:border-emerald-500 hover:bg-emerald-50/20'
                        }`}
                      >
                        {isUploading ? (
                          <div className="space-y-3 max-w-xs mx-auto">
                            <UploadCloud className="w-8 h-8 text-emerald-600 animate-bounce mx-auto" />
                            <div className="text-xs font-bold text-slate-800">
                              Uploading file to Firebase Storage... {uploadProgress}%
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-emerald-600 h-2 rounded-full transition-all duration-200"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-500">
                              Please wait while the binary payload is stored securely.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                              <UploadCloud className="w-6 h-6" />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-slate-800 hover:underline">
                                Click to select or upload digital product file
                              </span>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                ZIP, RAR, PDF, APK, ISO, EXE, DMG or Software packages
                              </p>
                            </div>
                            <span className="inline-block text-[10px] bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-full">
                              Protected Cloud Storage • Authenticated Downloads Only
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* External Link Input when downloadAccessType === 'external_link' */}
                {downloadAccessType === 'external_link' && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      External Download / Access URL *
                    </label>
                    <input
                      type="text"
                      value={externalAccessUrl}
                      onChange={(e) => setExternalAccessUrl(e.target.value)}
                      placeholder="https://drive.google.com/... or https://dropbox.com/..."
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      This private link will be delivered exclusively to confirmed paid customers.
                    </p>
                  </div>
                )}

                {/* Credentials / Key Note */}
                {downloadAccessType === 'credentials' && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Pre-loaded keys or customized credentials entered per variant or during order confirmation will be encrypted and dispatched securely to the customer.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white py-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer transition-all ${
                isSubmitting ? 'opacity-75 cursor-wait' : ''
              }`}
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>
                {isSubmitting
                  ? (lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
                  : (productToEdit ? t.editProduct : t.addProduct)}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

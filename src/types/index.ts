export type Language = 'bn' | 'en';

export type DeliveryType = 'instant_key' | 'shared_account' | 'private_mail' | 'custom_activation';

export interface ProductVariant {
  id: string;
  nameEn: string;
  nameBn: string;
  durationEn: string;
  durationBn: string;
  accountTypeEn: string;
  accountTypeBn: string;
  regularPrice: number;
  salePrice: number;
  inStock: boolean;
  stockCount?: number;
  sampleKey?: string;
}

export interface Product {
  id: string;
  titleEn: string;
  titleBn: string;
  categoryId: string;
  image: string;
  badgeEn?: string;
  badgeBn?: string;
  rating: number;
  reviewsCount: number;
  totalSold: number;
  deliveryType: DeliveryType;
  warrantyEn: string;
  warrantyBn: string;
  shortDescEn: string;
  shortDescBn: string;
  fullDescEn: string;
  fullDescBn: string;
  instructionsEn: string;
  instructionsBn: string;
  variants: ProductVariant[];
  featured?: boolean;
  trending?: boolean;
  enabled?: boolean;
  // Digital product delivery configuration
  isDigitalProduct?: boolean;
  digitalFileName?: string;
  digitalFileSize?: number;
  digitalFileType?: string;
  digitalFileStoragePath?: string;
  digitalFileUrl?: string;
  downloadAccessType?: 'file_download' | 'credentials' | 'external_link';
  externalAccessUrl?: string;
}

export interface Category {
  id: string;
  nameEn: string;
  nameBn: string;
  iconName: string;
  badgeColor: string;
}

export interface CartItem {
  id: string; // unique item id: productId + variantId
  product: Product;
  selectedVariant: ProductVariant;
  quantity: number;
}

export type OrderStatus =
  | 'pending'
  | 'verifying'
  | 'processing'
  | 'confirmed'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export type PaymentMethod = 'bkash' | 'nagad' | 'rocket' | 'bank';

export interface DigitalDeliveryItem {
  productTitle: string;
  variantTitle: string;
  deliveryType: DeliveryType;
  credentialsOrKey: string;
  notes?: string;
  downloadUrl?: string;
  externalAccessUrl?: string;
  fileName?: string;
  fileSize?: number;
  storagePath?: string;
  productId?: string;
}

export interface DeliveryRecord {
  id: string; // matches deliveryId / orderId
  deliveryId?: string;
  orderId: string;
  userId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  productId: string;
  productTitle?: string;
  productName: string;
  variantTitle?: string;
  deliveryType?: DeliveryType | string;
  deliveryMethod?: 'file' | 'credentials' | 'external' | 'external_link' | string;
  externalAccessUrl?: string;
  status: 'delivered';
  createdAt?: string;
  deliveredAt: string;
  deliveredAtIso?: string;
  downloadCount: number;
  firstDownloadedAt?: string | null;
  lastDownloadedAt?: string | null;
  emailStatus: 'sent' | 'failed' | 'pending' | 'not_configured' | 'skipped';
  emailError?: string | null;
  emailSentAt?: string | null;
  whatsappStatus: 'sent' | 'failed' | 'pending' | 'not_configured' | 'skipped';
  whatsappError?: string | null;
  whatsappSentAt?: string | null;
  fileName?: string;
  fileSize?: number;
  storagePath?: string;
  downloadLink?: string;
  downloadUrl?: string;
  credentialsOrKey?: string;
  notes?: string;
}

export interface Order {
  id: string; // e.g. DPS-94812
  orderId?: string;
  userId?: string; // UID of purchaser
  createdAt: string;
  deliveredAt?: string;
  customerName: string;
  customerPhone: string;
  phone?: string;
  customerEmail: string;
  email?: string;
  deliveryNotes?: string;
  productId?: string;
  productName?: string;
  quantity?: number;
  price?: number;
  total?: number;
  items: {
    productId: string;
    productTitle: string;
    productName?: string;
    variantId: string;
    variantName: string;
    unitPrice: number;
    price?: number;
    quantity: number;
    deliveryType: DeliveryType;
  }[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  senderNumber: string;
  paymentNumber?: string;
  trxId: string;
  transactionId?: string;
  status: OrderStatus;
  adminNotes?: string;
  digitalDeliveries?: DigitalDeliveryItem[];
  deliveryRecord?: DeliveryRecord;
}

export interface Coupon {
  code: string;
  discountPercent?: number;
  discountFixed?: number;
  minSpend: number;
  descriptionEn: string;
  descriptionBn: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  joinedDate: string;
}

export interface AdminUser {
  id: string; // UID
  name: string;
  email: string;
  role: 'admin';
  createdAt: string;
}

export interface SiteSettings {
  siteName: string;
  storeName: string;
  siteLogo?: string;
  contactEmail: string;
  supportEmail: string;
  contactPhone: string;
  whatsappSupportNumber: string;
  bkashNumber: string;
  bkashType: 'Merchant' | 'Personal';
  nagadNumber: string;
  nagadType: 'Merchant' | 'Personal';
  rocketNumber: string;
  rocketType: 'Personal';
  paymentInstructions?: string;
  siteMaintenanceMode?: boolean;
  deliveryMessage?: string;
  announcementEn: string;
  announcementBn: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export type ComplaintStatus = 'pending' | 'in_progress' | 'resolved' | 'closed';

export interface Complaint {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  subject: string;
  message: string;
  orderId?: string;
  status: ComplaintStatus;
  adminReply?: string;
  createdAt: string;
  updatedAt?: string;
}

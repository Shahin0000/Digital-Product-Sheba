import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Language,
  Product,
  Category,
  CartItem,
  Order,
  OrderStatus,
  User,
  AdminUser,
  Coupon,
  SiteSettings,
  ToastMessage,
  ProductVariant,
  DeliveryRecord,
} from '../types';
import {
  initialCategories,
  initialProducts,
  initialSiteSettings,
  initialCoupons,
} from '../data/initialData';
import { translations } from '../translations';
import { auth, db, googleProvider, handleFirestoreError, OperationType, sanitizeForFirestore } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';

interface StoreContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (typeof translations)['en'];
  products: Product[];
  addProduct: (productData: Omit<Product, 'id'> & { id?: string }) => Promise<Product>;
  updateProduct: (productId: string, updatedProduct: Partial<Product>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  categories: Category[];
  selectedCategory: string;
  setSelectedCategory: (catId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'popular';
  setSortBy: (sort: 'featured' | 'price-asc' | 'price-desc' | 'popular') => void;

  // Cart
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  cartDiscount: number;
  cartTotal: number;
  appliedCoupon: Coupon | null;
  addToCart: (product: Product, variant: ProductVariant, quantity?: number) => void;
  buyNow: (product: Product, variant: ProductVariant, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  applyCouponCode: (code: string) => boolean;
  removeCoupon: () => void;

  // Orders
  orders: Order[];
  createOrder: (orderPayload: Omit<Order, 'id' | 'createdAt' | 'status'>) => Promise<Order>;
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    digitalDeliveries?: Order['digitalDeliveries'],
    adminNotes?: string
  ) => Promise<void>;
  deliverOrder: (
    orderId: string,
    deliveryData?: {
      deliveryMethod?: string;
      externalAccessUrl?: string;
      credentialsOrKey?: string;
      notes?: string;
      fileName?: string;
      fileSize?: number;
      fileUrl?: string;
      storagePath?: string;
    }
  ) => Promise<void>;
  resendNotification: (orderId: string, type: 'email' | 'whatsapp') => Promise<void>;
  requestSecureDownload: (
    orderId: string,
    productId: string
  ) => Promise<{ success: boolean; downloadUrl?: string; error?: string }>;
  deliveries: Record<string, DeliveryRecord>;
  isDeliveringOrder: boolean;
  lastCreatedOrder: Order | null;
  setLastCreatedOrder: (order: Order | null) => void;
  trackOrderDirectly: (queryStr: string) => Promise<Order | null>;

  // Auth
  currentUser: User | null;
  authLoading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, phone?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsDemo: (role: 'customer' | 'admin') => Promise<void>;
  loginUser: (email: string, name?: string) => Promise<void>;
  logoutUser: () => Promise<void>;

  // Settings
  siteSettings: SiteSettings;
  updateSiteSettings: (settings: Partial<SiteSettings>) => Promise<void>;

  // Admin Management & Complete Collections
  allUsers: User[];
  updateUserByAdmin: (userId: string, data: Partial<User>) => Promise<void>;
  deleteUserByAdmin: (userId: string) => Promise<void>;
  allAdmins: AdminUser[];
  addAdminUser: (admin: { id: string; name: string; email: string }) => Promise<void>;
  removeAdminUser: (adminId: string) => Promise<void>;
  toggleProductStatus: (productId: string, enabled: boolean) => Promise<void>;
  updateProductStock: (productId: string, variantId: string, stockCount: number) => Promise<void>;
  updateProductPrice: (productId: string, variantId: string, regularPrice: number, salePrice: number) => Promise<void>;
  allDeliveries: DeliveryRecord[];
  saveDeliveryRecord: (deliveryData: Partial<DeliveryRecord> & { orderId: string; userId: string; productId: string }) => Promise<void>;
  updateOrderAdminNotes: (orderId: string, notes: string) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;

  // Modals & Navigation
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  activeProductModal: Product | null;
  setActiveProductModal: (prod: Product | null) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  isSuccessOpen: boolean;
  setIsSuccessOpen: (open: boolean) => void;
  isTrackOrderOpen: boolean;
  setIsTrackOrderOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isUserDashboardOpen: boolean;
  setIsUserDashboardOpen: (open: boolean) => void;
  isAdminDashboardOpen: boolean;
  setIsAdminDashboardOpen: (open: boolean) => void;

  // Pending intent
  pendingCheckout: boolean;
  setPendingCheckout: (pending: boolean) => void;

  // Toasts
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Language State
  const [lang, setLangState] = useState<Language>('bn');
  const setLang = (newLang: Language) => {
    setLangState(newLang);
  };
  const t = translations[lang];

  // Products State synced with Cloud Firestore
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(true);

  // Categories
  const categories = initialCategories;
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'popular'>('featured');

  // Cart State (Transient shopping cart)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Orders State synced with Cloud Firestore
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);

  // Digital Product Delivery State synced with Cloud Firestore
  const [deliveries, setDeliveries] = useState<Record<string, DeliveryRecord>>({});
  const [isDeliveringOrder, setIsDeliveringOrder] = useState<boolean>(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Global Site Settings from Firestore
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(initialSiteSettings);

  // Modals & Navigation
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [activeProductModal, setActiveProductModal] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState<boolean>(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isUserDashboardOpen, setIsUserDashboardOpen] = useState<boolean>(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState<boolean>(false);
  const [pendingCheckout, setPendingCheckout] = useState<boolean>(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  };

  // ----------------------------------------------------
  // 1. SYNC SETTINGS FROM FIRESTORE
  // ----------------------------------------------------
  useEffect(() => {
    const settingsDocRef = doc(db, 'settings', 'global');
    const unsubscribe = onSnapshot(
      settingsDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setSiteSettings((prev) => ({
            ...prev,
            ...(docSnap.data() as SiteSettings),
          }));
        } else {
          setSiteSettings(initialSiteSettings);
        }
      },
      (error) => {
        console.warn('Settings listener fallback to defaults:', error.message);
        setSiteSettings(initialSiteSettings);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateSiteSettings = async (newSettings: Partial<SiteSettings>) => {
    try {
      const settingsDocRef = doc(db, 'settings', 'global');
      await setDoc(settingsDocRef, newSettings, { merge: true });
      showToast(
        lang === 'bn' ? 'সেটিংস ক্লাউড ডেটাবেজে সংরক্ষিত হয়েছে' : 'Settings updated in Firestore',
        'success'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/global');
    }
  };

  // ----------------------------------------------------
  // 2. SYNC PRODUCTS FROM FIRESTORE (READ ONLY FOR STOREFRONT)
  // ----------------------------------------------------
  useEffect(() => {
    const productsColRef = collection(db, 'products');

    const unsubscribe = onSnapshot(
      productsColRef,
      (snapshot) => {
        if (snapshot.empty) {
          // If no products in Firestore yet, fall back to initial catalog in memory without writing to Firestore
          setProducts(initialProducts);
          setProductsLoading(false);
        } else {
          const loadedProducts: Product[] = [];
          snapshot.forEach((docSnap) => {
            loadedProducts.push({
              ...(docSnap.data() as Product),
              id: docSnap.id,
            });
          });
          setProducts(loadedProducts);
          setProductsLoading(false);
        }
      },
      (error) => {
        console.error('Products listener error:', error);
        setProducts(initialProducts);
        setProductsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addProduct = async (productData: Omit<Product, 'id'> & { id?: string }): Promise<Product> => {
    const prodId = productData.id || `prod-${Date.now()}`;
    const newProduct: Product = {
      ...productData,
      id: prodId,
      rating: productData.rating || 5.0,
      reviewsCount: productData.reviewsCount || 1,
      totalSold: productData.totalSold || 0,
      variants: productData.variants.map((v) => ({
        ...v,
        stockCount: v.stockCount ?? 50,
        inStock: v.inStock !== false,
      })),
    };

    try {
      console.log('FIRESTORE WRITE START (create product):', prodId);
      const cleanData = sanitizeForFirestore(newProduct);
      await setDoc(doc(db, 'products', prodId), cleanData);
      console.log('FIRESTORE WRITE SUCCESS (create product):', prodId);
      setProducts((prev) => [cleanData, ...prev.filter((p) => p.id !== prodId)]);
      showToast(t.productSaved, 'success');
      return cleanData;
    } catch (error) {
      console.error('FIRESTORE WRITE ERROR (create product):', error);
      handleFirestoreError(error, OperationType.CREATE, `products/${prodId}`);
    }
  };

  const updateProduct = async (productId: string, updatedProduct: Partial<Product>) => {
    try {
      console.log('FIRESTORE WRITE START (update product):', productId);
      const cleanData = sanitizeForFirestore(updatedProduct);
      await updateDoc(doc(db, 'products', productId), cleanData);
      console.log('FIRESTORE WRITE SUCCESS (update product):', productId);

      // Instant local state update
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, ...cleanData } : p))
      );

      if (activeProductModal && activeProductModal.id === productId) {
        setActiveProductModal((prev) => (prev ? { ...prev, ...cleanData } : null));
      }
      showToast(t.productSaved, 'success');
    } catch (error) {
      console.error('FIRESTORE WRITE ERROR (update product):', error);
      handleFirestoreError(error, OperationType.UPDATE, `products/${productId}`);
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      await deleteDoc(doc(db, 'products', productId));
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
      if (activeProductModal && activeProductModal.id === productId) {
        setActiveProductModal(null);
      }
      showToast(t.productDeleted, 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${productId}`);
    }
  };

  // ----------------------------------------------------
  // 3. AUTHENTICATION & USER PROFILE SYNC
  // ----------------------------------------------------
  const isSuperAdminEmail = (emailStr?: string | null) => {
    if (!emailStr) return false;
    const clean = emailStr.trim().toLowerCase();
    return (
      clean === 'shahinpc2018@gmail.com' ||
      clean === 'bajajmotors.chu@gmail.com' ||
      clean === 'admin@digitalproducts.com' ||
      clean.includes('admin')
    );
  };

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthLoading(true);

      // Stop listening to previous user's Firestore profile, if any
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }

      if (!firebaseUser) {
        setCurrentUser(null);
        setAuthLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const adminDocRef = doc(db, 'admins', firebaseUser.uid);

        const [userSnap, adminSnap] = await Promise.all([
          getDoc(userDocRef).catch(() => null),
          getDoc(adminDocRef).catch(() => null),
        ]);

        const isAdmin =
          isSuperAdminEmail(firebaseUser.email) ||
          (adminSnap && adminSnap.exists()) ||
          (userSnap && userSnap.exists() && userSnap.data()?.role === 'admin');

        if (!userSnap || !userSnap.exists()) {
          // Automatic profile provision on first login
          const newUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Customer',
            email: firebaseUser.email || '',
            phone: '',
            role: isAdmin ? 'admin' : 'customer',
            joinedDate: new Date().toISOString().split('T')[0],
          };

          await setDoc(userDocRef, newUser, { merge: true });
          console.info('[Firestore] User profile initialized:', `users/${firebaseUser.uid}`);
        } else if (isAdmin && userSnap.data()?.role !== 'admin') {
          await setDoc(userDocRef, { role: 'admin' }, { merge: true });
        }

        if (isAdmin && (!adminSnap || !adminSnap.exists())) {
          await setDoc(
            adminDocRef,
            {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Admin',
              email: firebaseUser.email || '',
              role: 'admin',
              createdAt: new Date().toISOString().split('T')[0],
            },
            { merge: true }
          );
        }

        // Real-time synchronization of current user profile
        unsubscribeUserDoc = onSnapshot(
          userDocRef,
          async (snapshot) => {
            const userData = snapshot.exists() ? snapshot.data() : {};
            let isUserAdmin = userData.role === 'admin' || isSuperAdminEmail(firebaseUser.email);
            if (!isUserAdmin) {
              try {
                const aSnap = await getDoc(adminDocRef);
                if (aSnap.exists()) isUserAdmin = true;
              } catch {}
            }

            const role: User['role'] = isUserAdmin ? 'admin' : 'customer';

            const profile: User = {
              id: firebaseUser.uid,
              name: userData.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Customer',
              email: firebaseUser.email || userData.email || '',
              phone: userData.phone || '',
              role,
              joinedDate: userData.joinedDate || new Date().toISOString().split('T')[0],
            };

            setCurrentUser(profile);
            setAuthLoading(false);
          },
          (error) => {
            console.error('[Firestore] User profile listener error:', error);
            setCurrentUser({
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || '',
              phone: '',
              role: isSuperAdminEmail(firebaseUser.email) ? 'admin' : 'customer',
              joinedDate: new Date().toISOString().split('T')[0],
            });
            setAuthLoading(false);
          }
        );
      } catch (authDocErr) {
        console.error('Error fetching/creating user doc:', authDocErr);
        setCurrentUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || '',
          phone: '',
          role: isSuperAdminEmail(firebaseUser.email) ? 'admin' : 'customer',
          joinedDate: new Date().toISOString().split('T')[0],
        });
        setAuthLoading(false);
      }
    });

    return () => {
      if (unsubscribeUserDoc) unsubscribeUserDoc();
      unsubscribeAuth();
    };
  }, []);

  // Handle pending checkout redirection after login
  useEffect(() => {
    if (currentUser && pendingCheckout) {
      setPendingCheckout(false);
      setIsAuthModalOpen(false);
      setIsCheckoutOpen(true);
    }
  }, [currentUser, pendingCheckout]);

  const navigatePostLogin = (isAdmin: boolean) => {
    if (pendingCheckout) {
      setPendingCheckout(false);
      setIsAuthModalOpen(false);
      setIsCheckoutOpen(true);
      return;
    }
    setIsAuthModalOpen(false);
    if (isAdmin) {
      setIsAdminDashboardOpen(true);
      setIsUserDashboardOpen(false);
    } else {
      setIsUserDashboardOpen(true);
      setIsAdminDashboardOpen(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const isAdm = isSuperAdminEmail(email.trim());
      navigatePostLogin(isAdm);
      showToast(lang === 'bn' ? 'লগইন সফল হয়েছে!' : 'Logged in successfully!', 'success');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.includes('user-not-found') || errorMsg.includes('invalid-credential')) {
        showToast(
          lang === 'bn'
            ? 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।'
            : 'Invalid email or password.',
          'error'
        );
      } else {
        showToast(errorMsg, 'error');
      }
      throw err;
    }
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    name: string,
    phone: string = ''
  ) => {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      await updateProfile(userCred.user, { displayName: name });

      const isAdmin = isSuperAdminEmail(email.trim());
      const newUser: User = {
        id: userCred.user.uid,
        name,
        email: email.trim(),
        phone,
        role: isAdmin ? 'admin' : 'customer',
        joinedDate: new Date().toISOString().split('T')[0],
      };

      // Create/overwrite the customer's Firestore profile immediately after Auth signup.
      // merge:true keeps any existing profile fields safe while guaranteeing users/{uid} exists.
      await setDoc(doc(db, 'users', userCred.user.uid), newUser, { merge: true });
      console.info('[Firestore] User profile created:', `users/${userCred.user.uid}`);
      if (isAdmin) {
        await setDoc(doc(db, 'admins', userCred.user.uid), {
          id: userCred.user.uid,
          name,
          email: email.trim(),
          role: 'admin',
          createdAt: new Date().toISOString().split('T')[0],
        });
      }

      setCurrentUser(newUser);
      navigatePostLogin(isAdmin);
      showToast(
        lang === 'bn' ? `অ্যাকাউন্ট তৈরি সফল, স্বাগতম ${name}!` : `Account created! Welcome, ${name}!`,
        'success'
      );
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.includes('email-already-in-use')) {
        showToast(
          lang === 'bn'
            ? 'এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট তৈরি করা আছে। অনুগ্রহ করে লগইন করুন।'
            : 'Email already registered. Please log in.',
          'error'
        );
      } else {
        showToast(errorMsg, 'error');
      }
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const isAdm = isSuperAdminEmail(cred.user?.email);
      navigatePostLogin(isAdm);
      showToast(lang === 'bn' ? 'গুগল দিয়ে লগইন সফল!' : 'Signed in with Google!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg, 'error');
      throw err;
    }
  };

  const loginAsDemo = async (role: 'customer' | 'admin') => {
    const demoEmail =
      role === 'admin' ? 'shahinpc2018@gmail.com' : 'customer@dpsheba.com';
    const demoPass = 'Sheba@2026Secure!';
    const demoName = role === 'admin' ? 'Shahin (Admin)' : 'Tanvir Ahmed';

    try {
      await signInWithEmailAndPassword(auth, demoEmail, demoPass);
      navigatePostLogin(role === 'admin');
      showToast(
        lang === 'bn'
          ? `${role === 'admin' ? 'অ্যাডমিন' : 'গ্রাহক'} হিসেবে লগইন সম্পন্ন!`
          : `Signed in as ${role === 'admin' ? 'Administrator' : 'Customer'}!`,
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('user-not-found') || msg.includes('invalid-credential') || msg.includes('wrong-password')) {
        // Auto-provision demo account with Firebase Auth
        try {
          await registerWithEmail(demoEmail, demoPass, demoName, '01712349988');
          navigatePostLogin(role === 'admin');
        } catch (createErr) {
          console.error('Demo registration failed:', createErr);
        }
      } else {
        showToast(msg, 'error');
      }
    }
  };

  const loginUser = async (email: string, name?: string) => {
    const defaultPass = 'Sheba@2026Secure!';
    try {
      await signInWithEmailAndPassword(auth, email.trim(), defaultPass);
      setIsAuthModalOpen(false);
    } catch {
      try {
        await registerWithEmail(email.trim(), defaultPass, name || email.split('@')[0]);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const logoutUser = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setIsUserDashboardOpen(false);
    setIsAdminDashboardOpen(false);
    showToast(lang === 'bn' ? 'লগআউট সম্পন্ন হয়েছে' : 'Logged out successfully', 'info');
  };

  // ----------------------------------------------------
  // 4. ORDERS REAL-TIME SYNC FROM CLOUD FIRESTORE
  // ----------------------------------------------------
  useEffect(() => {
    if (!currentUser) {
      setOrders([]);
      return;
    }

    const ordersColRef = collection(db, 'orders');

    let q;
    if (currentUser.role === 'admin') {
      // Admin views all orders (sorted client-side by createdAt)
      q = ordersColRef;
    } else {
      // Customer views only their own orders
      q = query(
        ordersColRef,
        where('userId', '==', currentUser.id)
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedOrders: Order[] = [];
        snapshot.forEach((docSnap) => {
          const raw = docSnap.data();
          let createdAtStr = new Date().toISOString();
          if (raw.createdAt) {
            if (typeof raw.createdAt === 'string') {
              createdAtStr = raw.createdAt;
            } else if (typeof raw.createdAt.toDate === 'function') {
              createdAtStr = raw.createdAt.toDate().toISOString();
            } else if (raw.createdAt.seconds) {
              createdAtStr = new Date(raw.createdAt.seconds * 1000).toISOString();
            }
          }
          loadedOrders.push({
            ...(raw as Order),
            id: docSnap.id,
            orderId: raw.orderId || docSnap.id,
            createdAt: createdAtStr,
          });
        });

        // Ensure descending sort by createdAt
        loadedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(loadedOrders);
      },
      (error) => {
        console.error('Orders snapshot error:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Track order directly from Firestore by ID (for unauthenticated or any customer)
  const trackOrderDirectly = async (queryStr: string): Promise<Order | null> => {
    const clean = queryStr.trim().toUpperCase();
    try {
      const orderDocRef = doc(db, 'orders', clean);
      const docSnap = await getDoc(orderDocRef);
      if (docSnap.exists()) {
        const raw = docSnap.data();
        let createdAtStr = new Date().toISOString();
        if (raw.createdAt) {
          if (typeof raw.createdAt === 'string') {
            createdAtStr = raw.createdAt;
          } else if (typeof raw.createdAt.toDate === 'function') {
            createdAtStr = raw.createdAt.toDate().toISOString();
          } else if (raw.createdAt.seconds) {
            createdAtStr = new Date(raw.createdAt.seconds * 1000).toISOString();
          }
        }
        return {
          ...(raw as Order),
          id: docSnap.id,
          orderId: raw.orderId || docSnap.id,
          createdAt: createdAtStr,
        };
      }
      return null;
    } catch (err) {
      console.error('Track order query error:', err);
      return null;
    }
  };

  // ----------------------------------------------------
  // 4B. REAL-TIME SYNC OF DELIVERIES FROM CLOUD FIRESTORE
  // ----------------------------------------------------
  useEffect(() => {
    if (!currentUser) {
      setDeliveries({});
      return;
    }

    const deliveriesColRef = collection(db, 'deliveries');
    let q;
    if (currentUser.role === 'admin') {
      q = deliveriesColRef;
    } else {
      q = query(deliveriesColRef, where('userId', '==', currentUser.id));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: Record<string, DeliveryRecord> = {};
        snapshot.forEach((docSnap) => {
          const raw = docSnap.data();
          let deliveredAtStr = new Date().toISOString();
          if (raw.deliveredAt) {
            if (typeof raw.deliveredAt === 'string') {
              deliveredAtStr = raw.deliveredAt;
            } else if (typeof raw.deliveredAt.toDate === 'function') {
              deliveredAtStr = raw.deliveredAt.toDate().toISOString();
            } else if (raw.deliveredAt.seconds) {
              deliveredAtStr = new Date(raw.deliveredAt.seconds * 1000).toISOString();
            }
          }
          loaded[docSnap.id] = {
            ...(raw as DeliveryRecord),
            id: docSnap.id,
            orderId: raw.orderId || docSnap.id,
            deliveredAt: deliveredAtStr,
          };
        });
        setDeliveries(loaded);
      },
      (error) => {
        console.error('Deliveries snapshot error:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // ----------------------------------------------------
  // 4C. ADMIN REAL-TIME USERS & ADMINS COLLECTION SYNC
  // ----------------------------------------------------
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allAdmins, setAllAdmins] = useState<AdminUser[]>([]);

  const allDeliveries = React.useMemo(() => {
    return (Object.values(deliveries) as DeliveryRecord[]).sort(
      (a, b) =>
        new Date(b.deliveredAt || b.createdAt || 0).getTime() -
        new Date(a.deliveredAt || a.createdAt || 0).getTime()
    );
  }, [deliveries]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      setAllUsers([]);
      setAllAdmins([]);
      return;
    }

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const loaded: User[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loaded.push({
            id: docSnap.id,
            name: data.name || 'Customer',
            email: data.email || '',
            phone: data.phone || '',
            role: data.role === 'admin' ? 'admin' : 'customer',
            joinedDate: data.joinedDate || new Date().toISOString().split('T')[0],
          });
        });
        setAllUsers(loaded);
      },
      (error) => {
        console.error('Users collection sync error:', error);
      }
    );

    const unsubAdmins = onSnapshot(
      collection(db, 'admins'),
      (snapshot) => {
        const loaded: AdminUser[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loaded.push({
            id: docSnap.id,
            name: data.name || 'Admin',
            email: data.email || '',
            role: 'admin',
            createdAt: data.createdAt || new Date().toISOString().split('T')[0],
          });
        });
        setAllAdmins(loaded);
      },
      (error) => {
        console.error('Admins collection sync error:', error);
      }
    );

    return () => {
      unsubUsers();
      unsubAdmins();
    };
  }, [currentUser]);

  const updateUserByAdmin = async (userId: string, data: Partial<User>) => {
    try {
      const cleanData = sanitizeForFirestore(data);
      await updateDoc(doc(db, 'users', userId), cleanData);
      if (data.role === 'admin') {
        const existing = allUsers.find((u) => u.id === userId);
        await setDoc(
          doc(db, 'admins', userId),
          {
            id: userId,
            name: data.name || existing?.name || 'Admin',
            email: data.email || existing?.email || '',
            role: 'admin',
            createdAt: new Date().toISOString().split('T')[0],
          },
          { merge: true }
        );
      } else if (data.role === 'customer') {
        try {
          await deleteDoc(doc(db, 'admins', userId));
        } catch (e) {
          console.warn('Admin record deletion fallback:', e);
        }
      }
      showToast(lang === 'bn' ? 'ব্যবহারকারী তথ্য আপডেট হয়েছে' : 'User updated successfully', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const deleteUserByAdmin = async (userId: string) => {
    if (currentUser?.id === userId) {
      showToast(lang === 'bn' ? 'নিজের অ্যাকাউন্ট মুছে ফেলা যাবে না' : 'Cannot delete your own account', 'error');
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', userId));
      try {
        await deleteDoc(doc(db, 'admins', userId));
      } catch {}
      setAllUsers((prev) => prev.filter((u) => u.id !== userId));
      showToast(lang === 'bn' ? 'ব্যবহারকারী মুছে ফেলা হয়েছে' : 'User deleted', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
    }
  };

  const addAdminUser = async (admin: { id: string; name: string; email: string }) => {
    try {
      const uid = admin.id.trim();
      if (!uid) throw new Error('User ID is required');
      const payload: AdminUser = {
        id: uid,
        name: admin.name.trim() || 'Admin',
        email: admin.email.trim(),
        role: 'admin',
        createdAt: new Date().toISOString().split('T')[0],
      };
      await setDoc(doc(db, 'admins', uid), payload, { merge: true });
      await setDoc(doc(db, 'users', uid), { role: 'admin', name: payload.name, email: payload.email }, { merge: true });
      showToast(lang === 'bn' ? 'নতুন অ্যাডমিন যুক্ত হয়েছে' : 'New admin added successfully', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `admins/${admin.id}`);
    }
  };

  const removeAdminUser = async (adminId: string) => {
    if (currentUser?.id === adminId) {
      showToast(lang === 'bn' ? 'আপনি নিজেকে অ্যাডমিন থেকে বাদ দিতে পারবেন না' : 'Cannot remove your own admin access', 'error');
      return;
    }
    try {
      await deleteDoc(doc(db, 'admins', adminId));
      try {
        await updateDoc(doc(db, 'users', adminId), { role: 'customer' });
      } catch (e) {
        console.warn(e);
      }
      showToast(lang === 'bn' ? 'অ্যাডমিন স্ট্যাটাস বাতিল হয়েছে' : 'Admin rights revoked', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `admins/${adminId}`);
    }
  };

  const toggleProductStatus = async (productId: string, enabled: boolean) => {
    try {
      await updateDoc(doc(db, 'products', productId), { enabled });
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, enabled } : p)));
      showToast(
        lang === 'bn'
          ? (enabled ? 'প্রোডাক্ট সক্রিয় করা হয়েছে' : 'প্রোডাক্ট নিষ্ক্রিয় করা হয়েছে')
          : (enabled ? 'Product enabled' : 'Product disabled'),
        'success'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${productId}`);
    }
  };

  const updateProductStock = async (productId: string, variantId: string, stockCount: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const updatedVariants = prod.variants.map((v) =>
      v.id === variantId
        ? { ...v, stockCount: Math.max(0, stockCount), inStock: stockCount > 0 }
        : v
    );
    await updateProduct(productId, { variants: updatedVariants });
  };

  const updateProductPrice = async (
    productId: string,
    variantId: string,
    regularPrice: number,
    salePrice: number
  ) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const updatedVariants = prod.variants.map((v) =>
      v.id === variantId
        ? { ...v, regularPrice: Math.max(0, regularPrice), salePrice: Math.max(0, salePrice) }
        : v
    );
    await updateProduct(productId, { variants: updatedVariants });
  };

  const saveDeliveryRecord = async (
    deliveryData: Partial<DeliveryRecord> & { orderId: string; userId: string; productId: string }
  ) => {
    const deliveryId = deliveryData.orderId;
    const payload: Record<string, any> = {
      ...deliveryData,
      id: deliveryId,
      deliveryId: deliveryId,
      status: 'delivered',
      createdAt: deliveryData.createdAt || new Date().toISOString(),
      deliveredAt: deliveryData.deliveredAt || new Date().toISOString(),
      downloadCount: typeof deliveryData.downloadCount === 'number' ? deliveryData.downloadCount : 0,
    };
    const clean = sanitizeForFirestore(payload);
    await setDoc(doc(db, 'deliveries', deliveryId), clean, { merge: true });
    setDeliveries((prev) => ({
      ...prev,
      [deliveryId]: clean as DeliveryRecord,
    }));
    showToast(lang === 'bn' ? 'ডেলিভারি তথ্য সংরক্ষিত হয়েছে' : 'Delivery information saved', 'success');
  };

  const updateOrderAdminNotes = async (orderId: string, notes: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { adminNotes: notes });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, adminNotes: notes } : o)));
      showToast(lang === 'bn' ? 'অ্যাডমিন নোট সংরক্ষিত হয়েছে' : 'Admin note updated', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      showToast(lang === 'bn' ? 'অর্ডার মুছে ফেলা হয়েছে' : 'Order deleted', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `orders/${orderId}`);
    }
  };

  // ----------------------------------------------------
  // 5. CUSTOMER ORDER CREATION (READ-ONLY CATALOG, WRITE-ONLY ORDERS)
  // ----------------------------------------------------
  const createOrder = async (
    orderPayload: Omit<Order, 'id' | 'createdAt' | 'status'>
  ): Promise<Order> => {
    // 1. Validate order items and variants against loaded product catalog
    if (!orderPayload.items || orderPayload.items.length === 0) {
      throw new Error(lang === 'bn' ? 'অর্ডার করার জন্য কার্ট খালি।' : 'Cart is empty. Please add items to place an order.');
    }

    for (const item of orderPayload.items) {
      const catalogProduct = products.find((p) => p.id === item.productId);
      if (!catalogProduct) {
        throw new Error(
          lang === 'bn'
            ? `প্রোডাক্ট "${item.productTitle || item.productId}" পাওয়া যায়নি।`
            : `Product "${item.productTitle || item.productId}" not found.`
        );
      }
      if (catalogProduct.enabled === false) {
        throw new Error(
          lang === 'bn'
            ? `প্রোডাক্টটি এই মুহূর্তে উপলব্ধ নয়।`
            : `Product "${catalogProduct.titleEn}" is currently unavailable.`
        );
      }
      const matchedVariant = catalogProduct.variants.find((v) => v.id === item.variantId);
      if (!matchedVariant) {
        throw new Error(
          lang === 'bn'
            ? `নির্বাচিত ভ্যারিয়েন্ট "${item.variantName || item.variantId}" পাওয়া যায়নি।`
            : `Selected variant "${item.variantName || item.variantId}" not found.`
        );
      }
      if (
        matchedVariant.inStock === false ||
        (typeof matchedVariant.stockCount === 'number' && matchedVariant.stockCount <= 0)
      ) {
        throw new Error(
          lang === 'bn'
            ? `দুঃখিত, "${matchedVariant.nameBn}" এই মুহূর্তে স্টক শেষ!`
            : `Sorry, "${matchedVariant.nameEn}" is currently out of stock.`
        );
      }
    }

    // 2. Ensure user is authenticated with Firebase Auth (userId = Firebase Auth UID)
    let authUser = auth.currentUser;
    if (!authUser) {
      const email = orderPayload.customerEmail?.trim().toLowerCase();
      const defaultPass = 'Sheba@2026Secure!';

      if (email && email.includes('@')) {
        try {
          const cred = await signInWithEmailAndPassword(auth, email, defaultPass);
          authUser = cred.user;
        } catch {
          try {
            const cred = await createUserWithEmailAndPassword(auth, email, defaultPass);
            authUser = cred.user;
            const newUser: User = {
              id: authUser.uid,
              name: orderPayload.customerName?.trim() || 'Customer',
              email,
              phone: orderPayload.customerPhone?.trim() || '',
              role: 'customer',
              joinedDate: new Date().toISOString().split('T')[0],
            };
            await setDoc(doc(db, 'users', authUser.uid), newUser);
            setCurrentUser(newUser);
          } catch {
            try {
              const anonCred = await signInAnonymously(auth);
              authUser = anonCred.user;
            } catch (anonErr) {
              console.warn('Anonymous sign-in unavailable:', anonErr);
            }
          }
        }
      } else {
        try {
          const anonCred = await signInAnonymously(auth);
          authUser = anonCred.user;
        } catch (anonErr) {
          console.warn('Anonymous sign-in unavailable:', anonErr);
        }
      }
    }

    const uid = authUser?.uid || auth.currentUser?.uid;
    if (!uid) {
      throw new Error(
        lang === 'bn'
          ? 'অর্ডার সফল করতে অনুগ্রহ করে লগইন করুন।'
          : 'Authentication is required to place an order. Please sign in.'
      );
    }

    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const orderId = `DPS-${randomNum}`;
    const primaryItem = orderPayload.items[0];

    const rawOrder: Record<string, any> = {
      id: orderId,
      orderId: orderId,
      userId: uid,
      customerName: orderPayload.customerName?.trim() || '',
      customerPhone: orderPayload.customerPhone?.trim() || '',
      phone: orderPayload.customerPhone?.trim() || '',
      customerEmail: orderPayload.customerEmail?.trim() || '',
      email: orderPayload.customerEmail?.trim() || '',
      deliveryNotes: orderPayload.deliveryNotes?.trim() || '',
      items: orderPayload.items.map((item) => ({
        productId: String(item.productId || ''),
        productTitle: String(item.productTitle || ''),
        variantId: String(item.variantId || ''),
        variantName: String(item.variantName || ''),
        unitPrice: Number(item.unitPrice) || 0,
        quantity: Number(item.quantity) || 1,
        deliveryType: String(item.deliveryType || 'shared_account'),
      })),
      productId: primaryItem ? primaryItem.productId : '',
      productName: primaryItem ? (primaryItem.productTitle || '') : '',
      quantity: primaryItem ? primaryItem.quantity : 1,
      price: primaryItem ? primaryItem.unitPrice : 0,
      subtotal: Number(orderPayload.subtotal) || 0,
      discount: Number(orderPayload.discount) || 0,
      couponCode: orderPayload.couponCode?.trim() || '',
      total: Number(orderPayload.totalAmount) || 0,
      totalAmount: Number(orderPayload.totalAmount) || 0,
      paymentMethod: orderPayload.paymentMethod || 'bkash',
      senderNumber: orderPayload.senderNumber?.trim() || '',
      paymentNumber: orderPayload.senderNumber?.trim() || '',
      trxId: orderPayload.trxId?.trim().toUpperCase() || '',
      transactionId: orderPayload.trxId?.trim().toUpperCase() || '',
      status: 'verifying',
      adminNotes: orderPayload.adminNotes?.trim() || '',
      createdAt: serverTimestamp(),
      createdAtIso: new Date().toISOString(),
      digitalDeliveries: orderPayload.items.map((item) => {
        const matchedProduct = products.find((p) => p.id === item.productId);
        const matchedVariant = matchedProduct?.variants.find((v) => v.id === item.variantId);
        return {
          productTitle: String(item.productTitle || ''),
          variantTitle: String(item.variantName || ''),
          deliveryType: String(item.deliveryType || 'shared_account'),
          credentialsOrKey:
            matchedVariant?.sampleKey ||
            (lang === 'bn'
              ? 'অ্যাডমিন পেমেন্ট ভেরিফাই করার পর আপনার লাইসেন্স কি এখানে প্রদর্শিত হবে।'
              : 'Credentials will be generated once payment is confirmed by administration.'),
          notes: lang === 'bn' ? 'সংরক্ষণ করুন এবং শেয়ার করবেন না।' : 'Please keep this confidential.',
        };
      }),
    };

    // Sanitize object to guarantee no undefined fields are passed to Firestore
    const sanitizedOrder = JSON.parse(
      JSON.stringify(rawOrder, (key, value) => (value === undefined ? null : value))
    ) as Record<string, any>;

    console.log('Initiating isolated Firestore order save for:', orderId, sanitizedOrder);

    try {
      // 3. Isolated Order Creation:
      // Writes strictly to orders/{orderId} without updating products.
      // Customers cannot write to products/{productId}, which are managed solely by Admins.
      const orderRef = doc(db, 'orders', orderId);
      await setDoc(orderRef, sanitizedOrder);

      const returnedOrder: Order = {
        ...(sanitizedOrder as unknown as Order),
        id: orderId,
        orderId: orderId,
        userId: uid,
        phone: sanitizedOrder.customerPhone,
        email: sanitizedOrder.customerEmail,
        productId: primaryItem ? primaryItem.productId : '',
        productName: primaryItem ? (primaryItem.productTitle || '') : '',
        quantity: primaryItem ? primaryItem.quantity : 1,
        price: primaryItem ? primaryItem.unitPrice : 0,
        total: sanitizedOrder.totalAmount,
        paymentNumber: sanitizedOrder.senderNumber,
        transactionId: sanitizedOrder.trxId,
        createdAt: new Date().toISOString(),
      };

      console.log('Order successfully created in Firestore:', orderId);
      setOrders((prev) => [returnedOrder, ...prev.filter((o) => o.id !== returnedOrder.id)]);
      setLastCreatedOrder(returnedOrder);
      clearCart();
      setIsCheckoutOpen(false);
      setIsSuccessOpen(true);
      showToast(t.orderSuccessTitle, 'success');
      return returnedOrder;
    } catch (error) {
      console.error('Order creation failed:', error);
      if (error instanceof Error) {
        console.error('Firestore error details:', error.message, error.stack);
      }
      handleFirestoreError(error, OperationType.CREATE, `orders/${orderId}`);
    }
  };

  // Update order status in Cloud Firestore
  const updateOrderStatus = async (
    orderId: string,
    status: OrderStatus,
    digitalDeliveries?: Order['digitalDeliveries'],
    adminNotes?: string
  ) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const updatePayload: Record<string, unknown> = { status };
      if (digitalDeliveries) updatePayload.digitalDeliveries = digitalDeliveries;
      if (adminNotes !== undefined) updatePayload.adminNotes = adminNotes;

      await updateDoc(orderRef, updatePayload);
      showToast(
        lang === 'bn'
          ? `অর্ডার ${orderId} স্ট্যাটাস ক্লাউডে আপডেট হয়েছে: ${status}`
          : `Order ${orderId} status saved in Firestore: ${status}`,
        'success'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  // Deliver digital product order with idempotency and server notification trigger
  const deliverOrder = async (
    orderId: string,
    deliveryData?: {
      deliveryMethod?: string;
      externalAccessUrl?: string;
      credentialsOrKey?: string;
      notes?: string;
      fileName?: string;
      fileSize?: number;
      fileUrl?: string;
      storagePath?: string;
    }
  ) => {
    setIsDeliveringOrder(true);
    try {
      // 1. Fetch Order (from state or directly from Firestore if not yet cached)
      let order = orders.find((o) => o.id === orderId);
      const orderRef = doc(db, 'orders', orderId);
      if (!order) {
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
          order = { id: orderSnap.id, ...orderSnap.data() } as Order;
        }
      }
      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      // Check existing delivery record for idempotency
      const deliveryDocRef = doc(db, 'deliveries', orderId);
      const existingSnap = await getDoc(deliveryDocRef);
      const isAlreadyDelivered = existingSnap.exists() && existingSnap.data()?.status === 'delivered';
      const existingData = existingSnap.exists() ? existingSnap.data() : {};

      const primaryItem = order.items && order.items.length > 0 ? order.items[0] : null;
      const associatedProduct = primaryItem ? products.find((p) => p.id === primaryItem.productId) : null;

      // Determine delivery method
      const deliveryMethod =
        deliveryData?.deliveryMethod ||
        (associatedProduct?.downloadAccessType === 'external_link' ? 'external_link' : undefined) ||
        (associatedProduct?.downloadAccessType === 'credentials' ? 'credentials' : undefined) ||
        (deliveryData?.externalAccessUrl ? 'external_link' : undefined) ||
        'file';

      const isExternalLink = deliveryMethod === 'external_link' || deliveryMethod === 'external';

      // External link resolution (e.g. Google Drive URL)
      let externalAccessUrl: string | undefined = undefined;
      if (isExternalLink) {
        externalAccessUrl =
          deliveryData?.externalAccessUrl?.trim() ||
          deliveryData?.fileUrl?.trim() ||
          associatedProduct?.externalAccessUrl?.trim() ||
          '';
      }

      // File attributes ONLY when not in external link delivery mode
      let fileName: string | undefined = undefined;
      let fileSize: number | undefined = undefined;
      let storagePath: string | undefined = undefined;
      let downloadUrl: string | undefined = undefined;

      if (!isExternalLink) {
        fileName =
          deliveryData?.fileName?.trim() ||
          associatedProduct?.digitalFileName ||
          'digital-product.zip';
        fileSize =
          deliveryData?.fileSize ??
          associatedProduct?.digitalFileSize ??
          0;
        storagePath =
          deliveryData?.storagePath?.trim() ||
          associatedProduct?.digitalFileStoragePath ||
          '';
        downloadUrl =
          deliveryData?.fileUrl?.trim() ||
          associatedProduct?.digitalFileUrl ||
          '';
      } else {
        // For external link: set downloadUrl to externalAccessUrl as fallback for backward compatibility
        downloadUrl = externalAccessUrl;
      }

      const credentialsOrKey =
        deliveryData?.credentialsOrKey?.trim() ||
        associatedProduct?.variants?.[0]?.sampleKey ||
        '';

      const notes =
        deliveryData?.notes?.trim() ||
        'Delivered securely by Digital Product Sheba.';

      // Construct digitalDeliveries on order item
      const digitalDeliveries = (order.items || []).map((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const itemObj: Record<string, any> = {
          productId: item.productId,
          productTitle: item.productTitle || prod?.titleEn || 'Digital Product',
          variantTitle: item.variantName || '',
          deliveryType: item.deliveryType || 'instant',
          credentialsOrKey: credentialsOrKey || 'Access granted. Thank you!',
          notes,
        };

        if (isExternalLink && externalAccessUrl) {
          itemObj.externalAccessUrl = externalAccessUrl;
          itemObj.downloadUrl = externalAccessUrl;
        } else if (downloadUrl) {
          itemObj.downloadUrl = downloadUrl;
          if (fileName) itemObj.fileName = fileName;
          if (fileSize !== undefined) itemObj.fileSize = fileSize;
          if (storagePath) itemObj.storagePath = storagePath;
        }

        return itemObj;
      });

      // 1. Update Order in Firestore
      const cleanOrderUpdate = sanitizeForFirestore({
        status: 'delivered',
        deliveredAt: serverTimestamp(),
        digitalDeliveries,
      });

      console.log('ORDER UPDATE FIRESTORE START for order:', orderId, cleanOrderUpdate);
      await updateDoc(orderRef, cleanOrderUpdate);
      console.log('ORDER UPDATE FIRESTORE SUCCESS for order:', orderId);

      // 2. Prepare Delivery Record Data
      const deliveryRecordPayload: Record<string, any> = {
        id: orderId,
        orderId,
        userId: order.userId || '',
        customerName: order.customerName || 'Customer',
        customerEmail: order.customerEmail || '',
        customerPhone: order.customerPhone || '',
        productId: primaryItem ? primaryItem.productId : (associatedProduct?.id || ''),
        productName: primaryItem ? primaryItem.productTitle : (associatedProduct?.titleEn || 'Digital Product'),
        deliveryMethod,
        status: 'delivered',
        deliveredAt: serverTimestamp(),
        deliveredAtIso: new Date().toISOString(),
        downloadCount: isAlreadyDelivered ? (existingData.downloadCount || 0) : 0,
        firstDownloadedAt: isAlreadyDelivered ? (existingData.firstDownloadedAt || null) : null,
        lastDownloadedAt: isAlreadyDelivered ? (existingData.lastDownloadedAt || null) : null,
        emailStatus: isAlreadyDelivered && existingData.emailStatus ? existingData.emailStatus : 'pending',
        emailError: null,
        whatsappStatus: isAlreadyDelivered && existingData.whatsappStatus ? existingData.whatsappStatus : 'pending',
        whatsappError: null,
        notes,
      };

      if (isExternalLink) {
        deliveryRecordPayload.externalAccessUrl = externalAccessUrl || '';
        deliveryRecordPayload.downloadUrl = externalAccessUrl || '';
      } else {
        if (fileName) deliveryRecordPayload.fileName = fileName;
        if (fileSize !== undefined) deliveryRecordPayload.fileSize = fileSize;
        if (storagePath) deliveryRecordPayload.storagePath = storagePath;
        if (downloadUrl) deliveryRecordPayload.downloadUrl = downloadUrl;
      }

      if (credentialsOrKey) {
        deliveryRecordPayload.credentialsOrKey = credentialsOrKey;
      }

      // Sanitize delivery record payload so NO undefined fields can ever reach Firestore
      const cleanDeliveryPayload = sanitizeForFirestore(deliveryRecordPayload);

      // Development logging before setDoc/updateDoc
      console.log('DELIVERY FIRESTORE WRITE START for order:', orderId);
      console.log('DELIVERY METHOD:', deliveryMethod);
      console.log('EXTERNAL ACCESS URL:', externalAccessUrl);
      console.log('COMPLETE DELIVERY PAYLOAD:', cleanDeliveryPayload);

      // Write delivery document using setDoc with merge: true (handles existing and non-existing documents idempotently)
      await setDoc(deliveryDocRef, cleanDeliveryPayload, { merge: true });
      console.log('DELIVERY FIRESTORE WRITE SUCCESS for order:', orderId);

      // Instant local state update
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: 'delivered', digitalDeliveries, deliveredAt: new Date().toISOString() }
            : o
        )
      );
      setDeliveries((prev) => ({
        ...prev,
        [orderId]: {
          ...(cleanDeliveryPayload as DeliveryRecord),
          deliveredAt: new Date().toISOString(),
        },
      }));

      showToast(
        lang === 'bn'
          ? `অর্ডার #${orderId} সফলভাবে ডেলিভারি করা হয়েছে!`
          : `Order #${orderId} delivered successfully!`,
        'success'
      );

      // 3. Trigger Server-side Notifications (Email + WhatsApp)
      try {
        console.log('DISPATCHING SERVER NOTIFICATIONS for order:', orderId);
        const response = await fetch('/api/deliveries/send-notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            notificationType: 'all',
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            customerPhone: order.customerPhone,
            productName: primaryItem?.productTitle,
            amount: order.totalAmount,
            credentialsOrKey,
            orderUrl: `${window.location.origin}`,
            downloadUrl: externalAccessUrl || downloadUrl,
          }),
        });

        let emailStatus: 'sent' | 'failed' | 'not_configured' | 'pending' | 'skipped' = 'not_configured';
        let emailError: string | null = null;
        let emailSentAt: any = null;
        let whatsappStatus: 'sent' | 'failed' | 'not_configured' | 'pending' | 'skipped' = 'not_configured';
        let whatsappError: string | null = null;
        let whatsappSentAt: any = null;

        if (response.ok) {
          const resData = await response.json();
          console.log('SERVER NOTIFICATION RESPONSE:', resData);
          emailStatus = resData.emailStatus || 'not_configured';
          emailError = resData.emailError || null;
          if (emailStatus === 'sent') emailSentAt = serverTimestamp();

          whatsappStatus = resData.whatsappStatus || 'not_configured';
          whatsappError = resData.whatsappError || null;
          if (whatsappStatus === 'sent') whatsappSentAt = serverTimestamp();
        } else {
          console.warn('Server notification response not ok, status:', response.status);
          emailStatus = 'not_configured';
          emailError = `Server returned status ${response.status}`;
          whatsappStatus = 'not_configured';
          whatsappError = `Server returned status ${response.status}`;
        }

        const notificationUpdate = sanitizeForFirestore({
          emailStatus,
          emailError,
          emailSentAt,
          whatsappStatus,
          whatsappError,
          whatsappSentAt,
        });

        console.log('NOTIFICATION FIRESTORE UPDATE START:', notificationUpdate);
        await setDoc(deliveryDocRef, notificationUpdate, { merge: true });
        console.log('NOTIFICATION FIRESTORE UPDATE SUCCESS');

        // Update local deliveries state
        setDeliveries((prev) => {
          if (!prev[orderId]) return prev;
          return {
            ...prev,
            [orderId]: {
              ...prev[orderId],
              emailStatus,
              emailError,
              whatsappStatus,
              whatsappError,
            },
          };
        });
      } catch (notifyErr) {
        console.warn('Delivery notification dispatch note:', notifyErr);
        const notificationUpdate = sanitizeForFirestore({
          emailStatus: 'not_configured',
          emailError: notifyErr instanceof Error ? notifyErr.message : 'Notification connection error',
          whatsappStatus: 'not_configured',
          whatsappError: notifyErr instanceof Error ? notifyErr.message : 'Notification connection error',
        });
        await setDoc(deliveryDocRef, notificationUpdate, { merge: true });
      }
    } catch (err: unknown) {
      console.error('Order delivery failed:', err);
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg, 'error');
      throw err;
    } finally {
      setIsDeliveringOrder(false);
    }
  };

  // Resend notification (Email or WhatsApp) without duplicate delivery
  const resendNotification = async (orderId: string, type: 'email' | 'whatsapp') => {
    try {
      const order = orders.find((o) => o.id === orderId);
      if (!order) throw new Error('Order not found');

      const deliveryDocRef = doc(db, 'deliveries', orderId);
      const deliverySnap = await getDoc(deliveryDocRef);
      const deliveryData = deliverySnap.exists() ? deliverySnap.data() : null;
      const primaryItem = order.items && order.items.length > 0 ? order.items[0] : null;

      showToast(
        lang === 'bn'
          ? `${type === 'email' ? 'ইমেইল' : 'হোয়াটসঅ্যাপ'} পাঠানো হচ্ছে...`
          : `Sending ${type === 'email' ? 'Email' : 'WhatsApp'}...`,
        'info'
      );

      const response = await fetch('/api/deliveries/send-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          notificationType: type,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          productName: primaryItem?.productTitle,
          amount: order.totalAmount,
          credentialsOrKey: deliveryData?.credentialsOrKey,
          downloadUrl: deliveryData?.externalAccessUrl || deliveryData?.downloadUrl,
          orderUrl: `${window.location.origin}`,
        }),
      });

      if (response.ok) {
        const resData = await response.json();
        const updateObj: Record<string, any> = {};
        if (type === 'email') {
          updateObj.emailStatus = resData.emailStatus || 'not_configured';
          updateObj.emailError = resData.emailError || null;
          if (resData.emailStatus === 'sent') updateObj.emailSentAt = serverTimestamp();
          if (resData.emailStatus === 'sent') {
            showToast(lang === 'bn' ? 'ইমেইল সফলভাবে পাঠানো হয়েছে!' : 'Email sent successfully!', 'success');
          } else if (resData.emailStatus === 'not_configured') {
            showToast(lang === 'bn' ? 'ইমেইল সার্ভিস কনফিগার করা নেই' : 'Email service not configured', 'info');
          } else {
            showToast(resData.emailError || 'Failed to send email', 'error');
          }
        } else {
          updateObj.whatsappStatus = resData.whatsappStatus || 'not_configured';
          updateObj.whatsappError = resData.whatsappError || null;
          if (resData.whatsappStatus === 'sent') updateObj.whatsappSentAt = serverTimestamp();
          if (resData.whatsappStatus === 'sent') {
            showToast(lang === 'bn' ? 'হোয়াটসঅ্যাপ মেসেজ পাঠানো হয়েছে!' : 'WhatsApp message sent!', 'success');
          } else if (resData.whatsappStatus === 'not_configured') {
            showToast(lang === 'bn' ? 'হোয়াটসঅ্যাপ সার্ভিস কনফিগার করা নেই' : 'WhatsApp service not configured', 'info');
          } else {
            showToast(resData.whatsappError || 'Failed to send WhatsApp message', 'error');
          }
        }
        await setDoc(deliveryDocRef, sanitizeForFirestore(updateObj), { merge: true });
      } else {
        throw new Error('Server returned error for notification dispatch');
      }
    } catch (err: unknown) {
      console.error('Resend notification error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg, 'error');
    }
  };

  // Secure download requested by customer
  const requestSecureDownload = async (
    orderId: string,
    productId: string
  ): Promise<{ success: boolean; downloadUrl?: string; error?: string }> => {
    try {
      if (!currentUser) {
        setIsAuthModalOpen(true);
        throw new Error(lang === 'bn' ? 'ডাউনলোড করতে লগইন করুন' : 'Please log in to download');
      }

      // Verify order ownership
      const order = orders.find((o) => o.id === orderId);
      if (!order) {
        throw new Error('Order not found in your account');
      }

      if (order.userId && order.userId !== currentUser.id && currentUser.role !== 'admin') {
        throw new Error('Unauthorized: You do not own this order');
      }

      if (order.status !== 'delivered' && order.status !== 'completed') {
        throw new Error('Order is not yet delivered');
      }

      // Find file
      const prod = products.find((p) => p.id === productId);
      const delivery = deliveries[orderId];
      const rawFileUrl = delivery?.downloadUrl || prod?.digitalFileUrl || '';
      const fileName = delivery?.fileName || prod?.digitalFileName || 'digital-product.zip';

      if (!rawFileUrl) {
        throw new Error(
          lang === 'bn'
            ? 'এই প্রোডাক্টের সাথে কোনো ফাইল সংযুক্ত করা হয়নি। অনুগ্রহ করে সাপোর্টে যোগাযোগ করুন।'
            : 'No downloadable file is attached to this product. Please contact support.'
        );
      }

      showToast(
        lang === 'bn' ? 'সুরক্ষিত ডাউনলোড লিংক তৈরি হচ্ছে...' : 'Generating secure download link...',
        'info'
      );

      const response = await fetch('/api/downloads/generate-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          productId,
          userId: currentUser.id,
          rawFileUrl,
          fileName,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate secure download link');
      }

      const data = await response.json();
      const secureUrl = data.downloadUrl;

      // Update download count and timestamps
      const deliveryDocRef = doc(db, 'deliveries', orderId);
      const snap = await getDoc(deliveryDocRef);
      if (snap.exists()) {
        const currentCount = snap.data().downloadCount || 0;
        await updateDoc(deliveryDocRef, {
          downloadCount: currentCount + 1,
          lastDownloadedAt: serverTimestamp(),
          firstDownloadedAt: snap.data().firstDownloadedAt || serverTimestamp(),
        });
      }

      // Open in browser
      const link = document.createElement('a');
      link.href = secureUrl;
      link.setAttribute('download', fileName);
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(
        lang === 'bn' ? 'ডাউনলোড শুরু হয়েছে!' : 'Download started!',
        'success'
      );

      return { success: true, downloadUrl: secureUrl };
    } catch (err: unknown) {
      console.error('Secure download error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  // ----------------------------------------------------
  // 6. CART CALCULATIONS & ACTIONS
  // ----------------------------------------------------
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cart.reduce(
    (total, item) => total + item.selectedVariant.salePrice * item.quantity,
    0
  );

  let cartDiscount = 0;
  if (appliedCoupon && cartSubtotal >= appliedCoupon.minSpend) {
    if (appliedCoupon.discountPercent) {
      cartDiscount = Math.round((cartSubtotal * appliedCoupon.discountPercent) / 100);
    } else if (appliedCoupon.discountFixed) {
      cartDiscount = Math.min(cartSubtotal, appliedCoupon.discountFixed);
    }
  }

  const cartTotal = Math.max(0, cartSubtotal - cartDiscount);

  const addToCart = (product: Product, variant: ProductVariant, quantity: number = 1) => {
    const itemId = `${product.id}-${variant.id}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.id === itemId);
      if (existing) {
        return prev.map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { id: itemId, product, selectedVariant: variant, quantity }];
    });
    showToast(
      lang === 'bn'
        ? `${product.titleBn} কার্টে যোগ করা হয়েছে!`
        : `${product.titleEn} added to cart!`,
      'success'
    );
  };

  // Requirement 6: When unauthenticated customer clicks Order Now / Buy Now, redirect them to login/signup
  // and then return them to the intended checkout
  const buyNow = (product: Product, variant: ProductVariant, quantity: number = 1) => {
    addToCart(product, variant, quantity);
    setActiveProductModal(null);
    setIsCartOpen(false);

    if (!currentUser) {
      setPendingCheckout(true);
      setIsAuthModalOpen(true);
      showToast(
        lang === 'bn'
          ? 'অর্ডার সম্পন্ন করতে অনুগ্রহ করে লগইন বা রেজিস্ট্রেশন করুন'
          : 'Please sign in or register to complete your order',
        'info'
      );
    } else {
      setIsCheckoutOpen(true);
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
    showToast(lang === 'bn' ? 'আইটেম কার্ট থেকে সরানো হয়েছে' : 'Item removed from cart', 'info');
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const applyCouponCode = (code: string): boolean => {
    const trimmed = code.trim().toUpperCase();
    const found = initialCoupons.find((c) => c.code === trimmed);
    if (!found) {
      showToast(t.invalidCoupon, 'error');
      return false;
    }
    if (cartSubtotal < found.minSpend) {
      showToast(
        lang === 'bn'
          ? `এই কুপন ব্যবহারের জন্য সর্বনিম্ন ৳${found.minSpend} টাকার অর্ডার করতে হবে`
          : `Minimum spend of ৳${found.minSpend} required for this coupon`,
        'error'
      );
      return false;
    }
    setAppliedCoupon(found);
    showToast(t.couponApplied, 'success');
    return true;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast(lang === 'bn' ? 'কুপন বাতিল করা হয়েছে' : 'Coupon removed', 'info');
  };

  return (
    <StoreContext.Provider
      value={{
        lang,
        setLang,
        t,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        categories,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        cart,
        cartCount,
        cartSubtotal,
        cartDiscount,
        cartTotal,
        appliedCoupon,
        addToCart,
        buyNow,
        removeFromCart,
        updateQuantity,
        clearCart,
        applyCouponCode,
        removeCoupon,
        orders,
        createOrder,
        updateOrderStatus,
        deliverOrder,
        resendNotification,
        requestSecureDownload,
        deliveries,
        isDeliveringOrder,
        lastCreatedOrder,
        setLastCreatedOrder,
        trackOrderDirectly,
        currentUser,
        authLoading,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginAsDemo,
        loginUser,
        logoutUser,
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
        allDeliveries,
        saveDeliveryRecord,
        updateOrderAdminNotes,
        deleteOrder,
        isCartOpen,
        setIsCartOpen,
        activeProductModal,
        setActiveProductModal,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isSuccessOpen,
        setIsSuccessOpen,
        isTrackOrderOpen,
        setIsTrackOrderOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isUserDashboardOpen,
        setIsUserDashboardOpen,
        isAdminDashboardOpen,
        setIsAdminDashboardOpen,
        pendingCheckout,
        setPendingCheckout,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

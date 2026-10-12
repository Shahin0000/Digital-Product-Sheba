import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { initializeApp as initAdminApp, cert, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import firebaseConfig from './firebase-applet-config.json';

dotenv.config();

// ==========================================
// FIREBASE ADMIN SDK INITIALIZATION (ROBUST & IDEMPOTENT)
// ==========================================
interface FirebaseAdminStatus {
  configured: boolean;
  initialized: boolean;
  projectId: string | null;
  maskedClientEmail: string | null;
  error: string | null;
}

let adminDb: Firestore | null = null;
let adminAuthInstance: Auth | null = null;
let adminInitializationAttempted = false;

const adminStatus: FirebaseAdminStatus = {
  configured: false,
  initialized: false,
  projectId: null,
  maskedClientEmail: null,
  error: null,
};

function initFirebaseAdmin(): void {
  // Requirement 7: Initialize Firebase Admin only once and report the actual initialization state
  if (adminInitializationAttempted) {
    return;
  }
  adminInitializationAttempted = true;

  try {
    const rawEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!rawEnv || typeof rawEnv !== 'string' || !rawEnv.trim()) {
      // Fallback check for GOOGLE_APPLICATION_CREDENTIALS if running in GCP environment
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        const existingApps = getApps();
        let adminApp = existingApps.find((a) => a.name === 'admin-adc');
        if (!adminApp) {
          adminApp = initAdminApp(
            {
              credential: applicationDefault(),
              projectId: firebaseConfig.projectId || 'digiral-product-service',
            },
            'admin-adc'
          );
        }
        adminDb = getFirestore(adminApp);
        adminAuthInstance = getAuth(adminApp);
        adminStatus.configured = true;
        adminStatus.initialized = true;
        adminStatus.projectId = firebaseConfig.projectId || 'digiral-product-service';
        adminStatus.error = null;
        console.log('[Firebase Admin] Initialized with GOOGLE_APPLICATION_CREDENTIALS');
        return;
      }

      adminStatus.configured = false;
      adminStatus.initialized = false;
      adminStatus.projectId = null;
      adminStatus.maskedClientEmail = null;
      adminStatus.error =
        'FIREBASE_ADMIN_NOT_CONFIGURED: FIREBASE_SERVICE_ACCOUNT environment variable is missing in this Netlify / server runtime. Please configure FIREBASE_SERVICE_ACCOUNT in Netlify site settings -> Environment variables.';
      console.warn('[Firebase Admin]', adminStatus.error);
      return;
    }

    adminStatus.configured = true;

    // Requirement 1: Read FIREBASE_SERVICE_ACCOUNT as a JSON string using JSON.parse() only when it is configured as JSON text.
    // Requirement 6: Do not interpret arbitrary binary data as JSON.
    let candidate = rawEnv.replace(/^\uFEFF/, '').trim();

    // Strip single quotes if wrapped (common shell/dotenv artifact: '{"project_id":...}')
    if (candidate.startsWith("'") && candidate.endsWith("'") && candidate.length >= 2) {
      candidate = candidate.slice(1, -1).trim();
    }

    let cred: any = null;
    try {
      if (!candidate.startsWith('{') && !candidate.startsWith('"')) {
        throw new Error('Value does not begin with "{" or "\"" (not JSON text)');
      }

      const firstPass = JSON.parse(candidate);
      if (typeof firstPass === 'string') {
        // Handle case where environment variable value was stored with outer JSON string escaping
        const secondCandidate = firstPass.trim();
        if (secondCandidate.startsWith('{')) {
          cred = JSON.parse(secondCandidate);
        } else {
          throw new Error('Unescaped value is not a JSON object');
        }
      } else if (typeof firstPass === 'object' && firstPass !== null && !Array.isArray(firstPass)) {
        cred = firstPass;
      } else {
        throw new Error('Parsed value is not a JSON object');
      }
    } catch (parseErr: any) {
      // Requirement 4 & 5: Clear, sanitized configuration error without logging private keys or raw contents
      adminStatus.initialized = false;
      adminStatus.projectId = null;
      adminStatus.maskedClientEmail = null;
      adminStatus.error =
        'FIREBASE_ADMIN_INITIALIZATION_FAILED: Could not parse FIREBASE_SERVICE_ACCOUNT JSON. Value must be valid unencoded JSON text of the Firebase service account key file.';
      console.error('[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT as JSON text. Ensure valid JSON string is configured without binary or malformed data.');
      return;
    }

    // Requirement 2: Validate that the parsed object contains project_id, client_email, and private_key
    if (!cred || typeof cred !== 'object' || Array.isArray(cred)) {
      adminStatus.initialized = false;
      adminStatus.projectId = null;
      adminStatus.maskedClientEmail = null;
      adminStatus.error =
        'FIREBASE_ADMIN_INITIALIZATION_FAILED: FIREBASE_SERVICE_ACCOUNT must be a valid JSON object.';
      return;
    }

    const { project_id, client_email, private_key } = cred;

    if (!project_id || typeof project_id !== 'string' || !project_id.trim()) {
      adminStatus.initialized = false;
      adminStatus.projectId = null;
      adminStatus.maskedClientEmail = null;
      adminStatus.error =
        'FIREBASE_ADMIN_INITIALIZATION_FAILED: Service account JSON is missing required field "project_id".';
      console.error('[Firebase Admin] Missing "project_id" in FIREBASE_SERVICE_ACCOUNT.');
      return;
    }

    if (!client_email || typeof client_email !== 'string' || !client_email.trim()) {
      adminStatus.initialized = false;
      adminStatus.projectId = null;
      adminStatus.maskedClientEmail = null;
      adminStatus.error =
        'FIREBASE_ADMIN_INITIALIZATION_FAILED: Service account JSON is missing required field "client_email".';
      console.error('[Firebase Admin] Missing "client_email" in FIREBASE_SERVICE_ACCOUNT.');
      return;
    }

    if (!private_key || typeof private_key !== 'string' || !private_key.trim()) {
      adminStatus.initialized = false;
      adminStatus.projectId = null;
      adminStatus.maskedClientEmail = null;
      adminStatus.error =
        'FIREBASE_ADMIN_INITIALIZATION_FAILED: Service account JSON is missing required field "private_key".';
      console.error('[Firebase Admin] Missing "private_key" in FIREBASE_SERVICE_ACCOUNT.');
      return;
    }

    // Requirement 3: Confirm project_id === "digiral-product-service"
    const EXPECTED_PROJECT_ID = 'digiral-product-service';
    const actualProjectId = project_id.trim();

    if (actualProjectId !== EXPECTED_PROJECT_ID) {
      adminStatus.initialized = false;
      adminStatus.projectId = actualProjectId;
      adminStatus.maskedClientEmail = null;
      adminStatus.error = `FIREBASE_ADMIN_INITIALIZATION_FAILED: Service account project_id "${actualProjectId}" does not match required Firebase project "${EXPECTED_PROJECT_ID}".`;
      console.error(`[Firebase Admin] Project mismatch: got "${actualProjectId}", expected "${EXPECTED_PROJECT_ID}"`);
      return;
    }

    // Normalize private_key escaped newlines if present (e.g., \\n vs real \n)
    const normalizedPrivateKey = private_key.replace(/\\n/g, '\n');

    const existingApps = getApps();
    let adminApp = existingApps.find((a) => a.name === 'admin-service');
    if (!adminApp) {
      adminApp = initAdminApp(
        {
          credential: cert({
            projectId: actualProjectId,
            clientEmail: client_email.trim(),
            privateKey: normalizedPrivateKey,
          }),
          projectId: EXPECTED_PROJECT_ID,
        },
        'admin-service'
      );
    }

    adminDb = getFirestore(adminApp);
    adminAuthInstance = getAuth(adminApp);
    adminStatus.initialized = true;
    adminStatus.projectId = EXPECTED_PROJECT_ID;

    // Requirement 5: Never log or return the private key, complete environment variable, or service-account contents
    const emailParts = client_email.trim().split('@');
    adminStatus.maskedClientEmail =
      emailParts.length === 2
        ? `${emailParts[0].slice(0, 4)}***@${emailParts[1]}`
        : '***@serviceaccount.com';
    adminStatus.error = null;

    console.log(`[Firebase Admin] Successfully initialized for project "${EXPECTED_PROJECT_ID}"`);
  } catch (err: any) {
    adminStatus.initialized = false;
    adminStatus.error = `FIREBASE_ADMIN_INITIALIZATION_FAILED: ${err?.message || 'Unexpected initialization error'}`;
    console.error('[Firebase Admin] Initialization failed:', err?.message || 'Unknown error');
  }
}

// Initial bootstrap attempt
initFirebaseAdmin();

const ALL_BACKUP_COLLECTIONS = [
  'products',
  'orders',
  'deliveries',
  'complaints',
  'settings',
  'users',
  'admins',
  'coupons',
  'sales',
  'purchases',
  'suppliers',
  'supplierPayments',
  'expenses',
  'stockMovements',
  'returns',
  'payments',
  'accounts',
  'transactions',
  'cashTransactions',
  'categories',
] as const;

const BUSINESS_DATA_COLLECTIONS = [
  'products',
  'orders',
  'deliveries',
  'complaints',
  'categories',
  'coupons',
  'sales',
  'purchases',
  'suppliers',
  'supplierPayments',
  'expenses',
  'stockMovements',
  'returns',
  'payments',
  'accounts',
  'transactions',
  'cashTransactions',
] as const;

function serializeAdminFirestoreData(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (obj && typeof obj.toDate === 'function') {
    return {
      __type: 'firestore_timestamp',
      seconds: obj.seconds ?? obj._seconds,
      nanoseconds: obj.nanoseconds ?? obj._nanoseconds ?? 0,
      iso: obj.toDate().toISOString(),
    };
  }
  if (obj instanceof Date) {
    return {
      __type: 'date',
      iso: obj.toISOString(),
    };
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeAdminFirestoreData);
  }
  if (typeof obj === 'object') {
    const serialized: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (
        key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('credentialhash') ||
        key.toLowerCase().includes('authtoken')
      ) {
        continue;
      }
      serialized[key] = serializeAdminFirestoreData(val);
    }
    return serialized;
  }
  return obj;
}

function deserializeAdminData(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj === 'object') {
    if (obj.__type === 'firestore_timestamp' && typeof obj.seconds === 'number') {
      const { Timestamp: AdminTimestamp } = require('firebase-admin/firestore');
      return new AdminTimestamp(obj.seconds, obj.nanoseconds || 0);
    }
    if (obj.__type === 'date' && typeof obj.iso === 'string') {
      return new Date(obj.iso);
    }
    if (Array.isArray(obj)) {
      return obj.map(deserializeAdminData);
    }
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      res[k] = deserializeAdminData(v);
    }
    return res;
  }
  return obj;
}

interface AuthResult {
  success: boolean;
  uid?: string;
  email?: string;
  status: number;
  error?: string;
}

async function authenticateAdminToken(req: Request): Promise<AuthResult> {
  // If not yet initialized, re-check once in case environment variables were injected after module load
  if (!adminDb || !adminAuthInstance) {
    initFirebaseAdmin();
  }

  if (!adminDb || !adminAuthInstance) {
    return {
      success: false,
      status: 503,
      error:
        adminStatus.error ||
        'FIREBASE_ADMIN_NOT_CONFIGURED: Privileged admin operations require Firebase Admin SDK. Please configure FIREBASE_SERVICE_ACCOUNT in Netlify site environment variables.',
    };
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : (req.body?.idToken as string | undefined);

  if (!token) {
    return {
      success: false,
      status: 401,
      error: 'Access Denied: Missing administrator authentication token (Bearer ID token required).',
    };
  }

  try {
    const decoded = await adminAuthInstance.verifyIdToken(token);
    const uid = decoded.uid;
    const email = (decoded.email || '').toLowerCase();

    // The single source of admin authority: users/{uid}.role === "admin" in Admin Firestore
    // Also support bootstrapped admin email shahinpc2018@gmail.com and admins/{uid} document
    const isBootstrappedAdmin = email === 'shahinpc2018@gmail.com';
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const adminDoc = await adminDb.collection('admins').doc(uid).get();

    if (isBootstrappedAdmin) {
      if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
        await adminDb.collection('users').doc(uid).set({
          id: uid,
          email,
          role: 'admin',
          name: decoded.name || 'Admin',
          joinedDate: new Date().toISOString().split('T')[0]
        }, { merge: true });
      }
      return {
        success: true,
        uid,
        email,
        status: 200,
      };
    }

    if (!userDoc.exists && !adminDoc.exists) {
      console.warn(`[Admin Auth] User document "users/${uid}" does not exist in Firestore`);
      return {
        success: false,
        status: 403,
        error: `Access Denied: User document "users/${uid}" does not exist in database.`,
      };
    }

    const userData = userDoc.exists ? userDoc.data() : null;
    const isAdmin = userData?.role === 'admin' || adminDoc.exists;
    if (!isAdmin) {
      console.warn(`[Admin Auth] User ${uid} has role "${userData?.role || 'none'}", rejected (not "admin")`);
      return {
        success: false,
        status: 403,
        error: `Access Denied: Valid administrator role required (users/{uid}.role is "${userData?.role || 'none'}").`,
      };
    }

    return {
      success: true,
      uid,
      email,
      status: 200,
    };
  } catch (authErr: any) {
    const msg = authErr?.message || String(authErr);
    console.warn('[Admin Auth] Firebase Admin token verification failed:', msg);
    if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('token')) {
      return {
        success: false,
        status: 401,
        error: `Access Denied: Invalid or expired Firebase ID token (${msg}).`,
      };
    }
    return {
      success: false,
      status: 403,
      error: `Access Denied: Administrator verification failed (${msg}).`,
    };
  }
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Enable CORS for client calls from custom domains and Netlify preview URLs
app.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Rewrite Netlify Functions redirect path: /.netlify/functions/api/* -> /api/*
app.use((req: Request, res: Response, next) => {
  if (req.url.startsWith('/.netlify/functions/api')) {
    req.url = req.url.replace('/.netlify/functions/api', '/api');
  }
  next();
});

// In-memory signed download token store (token -> { orderId, productId, fileUrl, fileName, expiresAt, userId })
const activeDownloadTokens = new Map<
  string,
  {
    orderId: string;
    productId: string;
    fileUrl: string;
    fileName: string;
    expiresAt: number;
    userId: string;
  }
>();

// Clean expired tokens every 15 minutes
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [token, data] of activeDownloadTokens.entries()) {
    if (data.expiresAt < now) {
      activeDownloadTokens.delete(token);
    }
  }
}, 15 * 60 * 1000);
if (cleanupInterval.unref) cleanupInterval.unref();

// ==========================================
// 1. HEALTH & ADMIN DIAGNOSTICS CHECK
// ==========================================
app.get(['/api/health', '/.netlify/functions/api/health', '/health'], (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Digital Product Sheba Delivery API',
  });
});

app.get(['/api/admin/status', '/.netlify/functions/api/admin/status', '/admin/status'], (req: Request, res: Response) => {
  if (req.query.reload === '1' || req.query.refresh === '1') {
    adminInitializationAttempted = false;
    initFirebaseAdmin();
  }

  res.json({
    status: 'ok',
    service: 'Digital Product Sheba Admin API',
    runtime: process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME ? 'netlify-function' : 'standalone-node',
    firebaseAdmin: {
      configured: adminStatus.configured,
      initialized: adminStatus.initialized,
      projectId: adminStatus.projectId,
      maskedClientEmail: adminStatus.maskedClientEmail,
      error: adminStatus.error,
    },
    collectionsSupported: ALL_BACKUP_COLLECTIONS.length,
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// ADMIN DATABASE BACKUP, RESTORE & FORMAT
// ==========================================
const handleAdminBackup = async (req: Request, res: Response) => {
  try {
    const authResult = await authenticateAdminToken(req);
    if (!authResult.success) {
      return res.status(authResult.status).json({
        success: false,
        error: authResult.error,
      });
    }

    if (!adminDb) {
      return res.status(503).json({
        success: false,
        error:
          adminStatus.error ||
          'FIREBASE_ADMIN_NOT_CONFIGURED: Privileged database backup requires Firebase Admin SDK. Please configure FIREBASE_SERVICE_ACCOUNT in your Netlify Environment Variables.',
      });
    }

    // 1. Explicitly test reading the 'coupons' collection first with Admin Firestore
    try {
      await adminDb.collection('coupons').get();
    } catch (couponErr: any) {
      console.error('[Admin Backup] Explicit test on "coupons" collection failed:', couponErr?.message || couponErr);
      return res.status(500).json({
        success: false,
        error: `COUPONS_EXPORT_FAILED: Failed to export collection "coupons" via Admin Firestore (${couponErr?.message || couponErr})`,
      });
    }

    // 2. Export all 20 collections preserving document IDs, nested maps, arrays, timestamps, numbers and booleans
    const collectionsData: Record<string, Record<string, any>> = {};
    let totalCount = 0;

    for (const colName of ALL_BACKUP_COLLECTIONS) {
      collectionsData[colName] = {};
      try {
        const snapshot = await adminDb.collection(colName).get();
        snapshot.forEach((docSnap) => {
          collectionsData[colName][docSnap.id] = serializeAdminFirestoreData(docSnap.data());
          totalCount++;
        });
      } catch (colErr: any) {
        console.error(`[Admin Backup] Collection "${colName}" export error:`, colErr?.message || colErr);
        return res.status(500).json({
          success: false,
          error: `COLLECTION_EXPORT_FAILED: Failed to export collection "${colName}" (${colErr?.message || colErr})`,
        });
      }
    }

    const backup = {
      backupVersion: '1.0',
      createdAt: new Date().toISOString(),
      projectName: 'Minarul Fashion House',
      totalDocuments: totalCount,
      collections: collectionsData,
    };

    return res.json({ success: true, backup });
  } catch (err: any) {
    console.error('[Admin Backup Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate database backup',
      details: err?.message || String(err),
    });
  }
};

app.post(['/api/admin/backup', '/.netlify/functions/api/admin/backup', '/admin/backup'], handleAdminBackup);

const handleAdminRestore = async (req: Request, res: Response) => {
  try {
    const authResult = await authenticateAdminToken(req);
    if (!authResult.success) {
      return res.status(authResult.status).json({
        success: false,
        error: authResult.error,
      });
    }

    const { backup } = req.body;
    if (!backup || !backup.collections || typeof backup.collections !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid backup payload: missing collections object.',
      });
    }

    if (!adminDb) {
      return res.status(503).json({
        success: false,
        error:
          adminStatus.error ||
          'FIREBASE_ADMIN_NOT_CONFIGURED: Privileged database restore requires Firebase Admin SDK. Please configure FIREBASE_SERVICE_ACCOUNT in your Netlify Environment Variables.',
      });
    }

    let restoredCount = 0;
    const restoredByCollection: Record<string, number> = {};

    for (const [colName, docsMap] of Object.entries(backup.collections)) {
      restoredByCollection[colName] = 0;
      if (!docsMap || typeof docsMap !== 'object') continue;

      const entries = Object.entries(docsMap as Record<string, any>);
      const CHUNK_SIZE = 25;

      for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
        const chunk = entries.slice(i, i + CHUNK_SIZE);
        const batch = adminDb.batch();

        for (const [docId, rawData] of chunk) {
          if (!docId || rawData === undefined) continue;
          const ref = adminDb.collection(colName).doc(docId);
          batch.set(ref, deserializeAdminData(rawData), { merge: true });
          restoredCount++;
          restoredByCollection[colName] = (restoredByCollection[colName] || 0) + 1;
        }

        await batch.commit();
      }
    }

    return res.json({ success: true, restoredCount, restoredByCollection });
  } catch (err: any) {
    console.error('[Admin Restore Exception]:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to restore backup',
    });
  }
};

app.post(['/api/admin/restore', '/.netlify/functions/api/admin/restore', '/admin/restore'], handleAdminRestore);

const handleAdminFormat = async (req: Request, res: Response) => {
  try {
    const authResult = await authenticateAdminToken(req);
    if (!authResult.success) {
      return res.status(authResult.status).json({
        success: false,
        error: authResult.error,
      });
    }

    const { confirmText } = req.body;
    if (confirmText !== 'DELETE') {
      return res.status(400).json({
        success: false,
        error: 'Please provide confirmText="DELETE" to confirm formatting.',
      });
    }

    if (!adminDb) {
      return res.status(503).json({
        success: false,
        error:
          adminStatus.error ||
          'FIREBASE_ADMIN_NOT_CONFIGURED: Privileged database format requires Firebase Admin SDK. Please configure FIREBASE_SERVICE_ACCOUNT in your Netlify Environment Variables.',
      });
    }

    let deletedCount = 0;
    const deletedByCollection: Record<string, number> = {};

    for (const colName of BUSINESS_DATA_COLLECTIONS) {
      deletedByCollection[colName] = 0;
      const snapshot = await adminDb.collection(colName).get();
      const batch = adminDb.batch();
      snapshot.forEach((d) => {
        batch.delete(d.ref);
        deletedCount++;
        deletedByCollection[colName]++;
      });
      await batch.commit();
    }

    // Customer users deletion strictly preserving admin accounts and current admin
    const usersSnap = await adminDb.collection('users').get();
    const userBatch = adminDb.batch();
    deletedByCollection['users'] = 0;
    usersSnap.forEach((d) => {
      const u = d.data();
      if (d.id !== authResult.uid && u.role !== 'admin') {
        userBatch.delete(d.ref);
        deletedCount++;
        deletedByCollection['users']++;
      }
    });
    await userBatch.commit();

    return res.json({ success: true, deletedCount, deletedByCollection });
  } catch (err: any) {
    console.error('[Admin Format Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to format business data',
      details: err?.message || String(err),
    });
  }
};

app.post(['/api/admin/format', '/.netlify/functions/api/admin/format', '/admin/format'], handleAdminFormat);

// ==========================================
// 1b. PRODUCT CATEGORY MANAGEMENT API
// ==========================================
app.get(['/api/categories', '/.netlify/functions/api/categories'], async (req: Request, res: Response) => {
  try {
    if (!adminDb) {
      initFirebaseAdmin();
    }
    if (!adminDb) {
      return res.status(503).json({ error: 'Database service not initialized' });
    }
    const snap = await adminDb.collection('categories').get();
    const categories: any[] = [];
    snap.forEach((doc) => {
      categories.push({ id: doc.id, ...doc.data() });
    });
    return res.json({ success: true, categories });
  } catch (err: any) {
    console.error('[Categories API] GET categories error:', err);
    return res.status(500).json({ error: 'Failed to fetch categories', details: err?.message || String(err) });
  }
});

app.post(['/api/admin/categories', '/.netlify/functions/api/admin/categories'], async (req: Request, res: Response) => {
  const authRes = await authenticateAdminToken(req);
  if (!authRes.success) {
    return res.status(authRes.status).json({ error: authRes.error });
  }

  const { nameEn, nameBn, slug, description, descriptionEn, descriptionBn, imageUrl, iconName, badgeColor, isActive, sortOrder } = req.body || {};
  if (!nameEn?.trim() || !nameBn?.trim()) {
    return res.status(400).json({ error: 'Category Name in English and Bangla are required.' });
  }

  const rawSlug = (slug || req.body?.id || nameEn)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const catId = rawSlug || `cat-${Date.now()}`;

  try {
    if (!adminDb) initFirebaseAdmin();
    if (!adminDb) return res.status(503).json({ error: 'Database service unavailable' });

    // Check duplicate
    const existing = await adminDb.collection('categories').doc(catId).get();
    if (existing.exists) {
      return res.status(409).json({ error: `Category with slug "${catId}" already exists.` });
    }

    const newCat = {
      id: catId,
      name: nameEn.trim(),
      nameEn: nameEn.trim(),
      nameBn: nameBn.trim(),
      slug: catId,
      description: (description || descriptionEn || '').trim(),
      descriptionEn: (descriptionEn || description || '').trim(),
      descriptionBn: (descriptionBn || description || '').trim(),
      imageUrl: (imageUrl || '').trim(),
      iconName: iconName || 'Sparkles',
      badgeColor: badgeColor || 'bg-emerald-500',
      isActive: isActive !== false,
      sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection('categories').doc(catId).set(newCat);
    console.log(`[Admin Categories] Created category: ${catId} by admin: ${authRes.email}`);
    return res.status(201).json({ success: true, category: newCat });
  } catch (err: any) {
    console.error('[Admin Categories] Create category error:', err);
    return res.status(500).json({ error: 'Failed to create category', details: err?.message || String(err) });
  }
});

app.put(['/api/admin/categories/:id', '/.netlify/functions/api/admin/categories/:id'], async (req: Request, res: Response) => {
  const authRes = await authenticateAdminToken(req);
  if (!authRes.success) {
    return res.status(authRes.status).json({ error: authRes.error });
  }

  const catId = req.params.id;
  if (!catId) {
    return res.status(400).json({ error: 'Category ID is required' });
  }

  try {
    if (!adminDb) initFirebaseAdmin();
    if (!adminDb) return res.status(503).json({ error: 'Database service unavailable' });

    const docRef = adminDb.collection('categories').doc(catId);
    const existing = await docRef.get();
    if (!existing.exists) {
      return res.status(404).json({ error: `Category "${catId}" not found` });
    }

    const updatePayload: Record<string, any> = {
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    delete updatePayload.id; // Preserve doc id

    await docRef.update(updatePayload);
    const updatedSnap = await docRef.get();
    console.log(`[Admin Categories] Updated category: ${catId} by admin: ${authRes.email}`);
    return res.json({ success: true, category: { id: catId, ...updatedSnap.data() } });
  } catch (err: any) {
    console.error('[Admin Categories] Update category error:', err);
    return res.status(500).json({ error: 'Failed to update category', details: err?.message || String(err) });
  }
});

app.delete(['/api/admin/categories/:id', '/.netlify/functions/api/admin/categories/:id'], async (req: Request, res: Response) => {
  const authRes = await authenticateAdminToken(req);
  if (!authRes.success) {
    return res.status(authRes.status).json({ error: authRes.error });
  }

  const catId = req.params.id;
  if (!catId || catId === 'all') {
    return res.status(400).json({ error: 'Default "All Products" category cannot be deleted.' });
  }

  try {
    if (!adminDb) initFirebaseAdmin();
    if (!adminDb) return res.status(503).json({ error: 'Database service unavailable' });

    // Safeguard: Check if any products depend on this category
    const productsSnap = await adminDb.collection('products').where('categoryId', '==', catId).get();
    if (!productsSnap.empty) {
      return res.status(400).json({
        error: `Cannot delete: ${productsSnap.size} product(s) are assigned to this category. Please reassign them first.`,
        assignedCount: productsSnap.size,
      });
    }

    await adminDb.collection('categories').doc(catId).delete();
    console.log(`[Admin Categories] Deleted category: ${catId} by admin: ${authRes.email}`);
    return res.json({ success: true, message: `Category "${catId}" deleted successfully.` });
  } catch (err: any) {
    console.error('[Admin Categories] Delete category error:', err);
    return res.status(500).json({ error: 'Failed to delete category', details: err?.message || String(err) });
  }
});

// ==========================================
// 2. EMAIL & WHATSAPP NOTIFICATION DISPATCH
// ==========================================
app.post('/api/deliveries/send-notifications', async (req: Request, res: Response) => {
  try {
    const {
      orderId,
      notificationType = 'all', // 'all' | 'email' | 'whatsapp'
      customerName = 'Valued Customer',
      customerEmail,
      customerPhone,
      productName = 'Digital Product',
      amount = 0,
      orderUrl,
      downloadUrl,
      credentialsOrKey,
    } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    const results: {
      emailStatus: 'sent' | 'failed' | 'skipped' | 'not_configured';
      emailError?: string | null;
      whatsappStatus: 'sent' | 'failed' | 'skipped' | 'not_configured';
      whatsappError?: string | null;
    } = {
      emailStatus: 'skipped',
      whatsappStatus: 'skipped',
    };

    // ----------------------------------------
    // A. EMAIL DELIVERY (via Resend API)
    // ----------------------------------------
    if (notificationType === 'all' || notificationType === 'email') {
      if (!customerEmail || !customerEmail.includes('@')) {
        results.emailStatus = 'failed';
        results.emailError = 'Invalid customer email address';
      } else {
        const resendApiKey = process.env.RESEND_API_KEY;
        const senderEmail = process.env.EMAIL_FROM || 'Digital Product Sheba <orders@resend.dev>';

        if (!resendApiKey) {
          console.warn(
            `[Delivery Notification] Email send requested for Order ${orderId}, but RESEND_API_KEY is not configured.`
          );
          results.emailStatus = 'not_configured';
          results.emailError =
            'RESEND_API_KEY environment variable is not configured on the server.';
        } else {
          try {
            console.log(`[Delivery Notification] Sending email via Resend to ${customerEmail}...`);
            const emailHtml = `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <title>Order Delivered - Digital Product Sheba</title>
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 24px; color: #111827;">
                  <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                    <div style="background: linear-gradient(135deg, #059669, #0d9488); padding: 24px; color: #ffffff; text-align: center;">
                      <h1 style="margin: 0; font-size: 20px; font-weight: 800;">Digital Product Sheba</h1>
                      <p style="margin: 6px 0 0 0; font-size: 13px; color: #a7f3d0;">Order Delivery Confirmation</p>
                    </div>

                    <div style="padding: 24px;">
                      <h2 style="font-size: 18px; font-weight: 700; color: #065f46; margin-top: 0;">🎉 Your order has been delivered!</h2>
                      <p style="font-size: 14px; line-height: 1.6; color: #4b5563;">
                        Dear <strong>${customerName}</strong>,<br>
                        Your payment for order <strong>#${orderId}</strong> has been verified and your digital product is ready for access.
                      </p>

                      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 20px 0;">
                        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 4px 0; color: #374151; font-weight: 600;">Order ID:</td>
                            <td style="padding: 4px 0; color: #111827; font-weight: 700; text-align: right;">#${orderId}</td>
                          </tr>
                          <tr>
                            <td style="padding: 4px 0; color: #374151; font-weight: 600;">Product:</td>
                            <td style="padding: 4px 0; color: #111827; font-weight: 700; text-align: right;">${productName}</td>
                          </tr>
                          <tr>
                            <td style="padding: 4px 0; color: #374151; font-weight: 600;">Amount Paid:</td>
                            <td style="padding: 4px 0; color: #059669; font-weight: 800; text-align: right;">৳${amount}</td>
                          </tr>
                          <tr>
                            <td style="padding: 4px 0; color: #374151; font-weight: 600;">Delivery Status:</td>
                            <td style="padding: 4px 0; color: #059669; font-weight: 700; text-align: right;">DELIVERED</td>
                          </tr>
                        </table>
                      </div>

                      ${
                        credentialsOrKey
                          ? `
                        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 14px; margin: 18px 0;">
                          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Product License / Credentials:</div>
                          <pre style="margin: 8px 0 0 0; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; font-size: 13px; font-family: monospace; color: #0f172a; white-space: pre-wrap; word-break: break-all;">${credentialsOrKey}</pre>
                        </div>
                      `
                          : ''
                      }

                      <div style="text-align: center; margin: 28px 0 12px 0;">
                        ${
                          downloadUrl
                            ? `
                          <a href="${downloadUrl}" style="display: inline-block; background: #059669; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 14px; margin-right: 8px;">
                            📥 Download Product
                          </a>
                        `
                            : ''
                        }
                        <a href="${orderUrl || 'https://digitalproductsheba.com'}" style="display: inline-block; background: #1f2937; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 10px; font-weight: 700; font-size: 14px;">
                          View in Customer Panel
                        </a>
                      </div>

                      <p style="font-size: 11px; color: #9ca3af; text-align: center; margin-top: 24px;">
                        Need assistance? Contact our 24/7 WhatsApp support at 01700-000000.
                      </p>
                    </div>
                  </div>
                </body>
              </html>
            `;

            const emailResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: senderEmail,
                to: [customerEmail],
                subject: `🎉 Order #${orderId} Delivered: ${productName} - Digital Product Sheba`,
                html: emailHtml,
              }),
            });

            if (emailResponse.ok) {
              const resData = await emailResponse.json();
              console.log(`[Delivery Notification] Resend email success:`, resData);
              results.emailStatus = 'sent';
            } else {
              const errData = await emailResponse.text();
              console.error(`[Delivery Notification] Resend error:`, errData);
              results.emailStatus = 'failed';
              results.emailError = `Resend API Error: ${errData.substring(0, 120)}`;
            }
          } catch (mailErr: any) {
            console.error(`[Delivery Notification] Failed to send email:`, mailErr);
            results.emailStatus = 'failed';
            results.emailError = mailErr?.message || 'Email delivery connection error';
          }
        }
      }
    }

    // ----------------------------------------
    // B. WHATSAPP DELIVERY (via Meta Cloud API)
    // ----------------------------------------
    if (notificationType === 'all' || notificationType === 'whatsapp') {
      if (!customerPhone || customerPhone.replace(/[^0-9]/g, '').length < 10) {
        results.whatsappStatus = 'failed';
        results.whatsappError = 'Invalid customer phone number for WhatsApp';
      } else {
        const whatsappToken = process.env.WHATSAPP_API_TOKEN;
        const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

        if (!whatsappToken || !phoneId) {
          console.warn(
            `[Delivery Notification] WhatsApp notification requested for Order ${orderId}, but WHATSAPP_API_TOKEN or WHATSAPP_PHONE_NUMBER_ID is not configured.`
          );
          results.whatsappStatus = 'not_configured';
          results.whatsappError =
            'WHATSAPP_API_TOKEN or WHATSAPP_PHONE_NUMBER_ID not configured on server.';
        } else {
          try {
            // Normalize Bangladesh phone number (017... -> 88017...)
            let formattedPhone = customerPhone.replace(/[^0-9]/g, '');
            if (formattedPhone.startsWith('01') && formattedPhone.length === 11) {
              formattedPhone = '880' + formattedPhone.substring(1);
            } else if (formattedPhone.startsWith('880')) {
              // already valid
            }

            const messageText =
              `🎉 Your order has been delivered!\n\n` +
              `Order ID: #${orderId}\n` +
              `Product: ${productName}\n` +
              `Amount: ৳${amount}\n\n` +
              (downloadUrl ? `Download: ${downloadUrl}\n` : '') +
              (credentialsOrKey ? `Key/Credentials: ${credentialsOrKey}\n` : '') +
              `Customer Panel: ${orderUrl || 'https://digitalproductsheba.com'}\n\n` +
              `Thank you for purchasing from Digital Product Sheba!`;

            console.log(
              `[Delivery Notification] Sending WhatsApp message via Meta Cloud API to ${formattedPhone}...`
            );

            const waResponse = await fetch(
              `https://graph.facebook.com/v19.0/${phoneId}/messages`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${whatsappToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  messaging_product: 'whatsapp',
                  recipient_type: 'individual',
                  to: formattedPhone,
                  type: 'text',
                  text: {
                    preview_url: true,
                    body: messageText,
                  },
                }),
              }
            );

            if (waResponse.ok) {
              const waData = await waResponse.json();
              console.log(`[Delivery Notification] WhatsApp sent successfully:`, waData);
              results.whatsappStatus = 'sent';
            } else {
              const waErr = await waResponse.text();
              console.error(`[Delivery Notification] WhatsApp API Error:`, waErr);
              results.whatsappStatus = 'failed';
              results.whatsappError = `WhatsApp Cloud API Error: ${waErr.substring(0, 120)}`;
            }
          } catch (waErr: any) {
            console.error(`[Delivery Notification] WhatsApp network failure:`, waErr);
            results.whatsappStatus = 'failed';
            results.whatsappError = waErr?.message || 'WhatsApp Cloud API request failed';
          }
        }
      }
    }

    return res.json({
      success: true,
      orderId,
      ...results,
    });
  } catch (err: any) {
    console.error('Notification dispatch error:', err);
    return res.status(500).json({
      error: 'Failed to process notifications',
      details: err?.message || String(err),
    });
  }
});

// ==========================================
// 3. SECURE DOWNLOAD TOKEN GENERATION
// ==========================================
app.post('/api/downloads/generate-url', (req: Request, res: Response) => {
  try {
    const { orderId, productId, userId, rawFileUrl, fileName = 'digital-product.zip' } = req.body;

    if (!orderId || !productId || !userId) {
      return res.status(400).json({ error: 'orderId, productId, and userId are required' });
    }

    if (!rawFileUrl) {
      return res.status(400).json({ error: 'No digital product file associated with this order' });
    }

    // Generate cryptographic temporary token valid for 30 minutes
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes

    activeDownloadTokens.set(token, {
      orderId,
      productId,
      fileUrl: rawFileUrl,
      fileName,
      expiresAt,
      userId,
    });

    const host = req.get('host') || `localhost:${PORT}`;
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const secureDownloadUrl = `${protocol}://${host}/api/downloads/secure/${token}`;

    return res.json({
      success: true,
      token,
      downloadUrl: secureDownloadUrl,
      expiresInSeconds: 1800,
      fileName,
    });
  } catch (err: any) {
    console.error('Generate download token error:', err);
    return res.status(500).json({ error: 'Failed to generate secure download token' });
  }
});

// ==========================================
// 4. SECURE DOWNLOAD FILE REDIRECT / STREAM
// ==========================================
app.get(
  [
    '/api/downloads/secure/:token',
    '/api/download/:token',
    '/.netlify/functions/api/downloads/secure/:token',
    '/.netlify/functions/api/download/:token',
  ],
  (req: Request, res: Response) => {
  const { token } = req.params;
  const tokenData = activeDownloadTokens.get(token);

  if (!tokenData) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Download Link Expired</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 48px;">
          <h2 style="color: #dc2626;">Link Expired or Invalid</h2>
          <p>This secure digital product download link has expired or is invalid.</p>
          <p>Please return to your <strong>Customer Dashboard &gt; My Orders</strong> to request a fresh secure download link.</p>
        </body>
      </html>
    `);
  }

  if (Date.now() > tokenData.expiresAt) {
    activeDownloadTokens.delete(token);
    return res.status(410).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Download Link Expired</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 48px;">
          <h2 style="color: #dc2626;">Download Link Expired</h2>
          <p>For security, download links expire after 30 minutes.</p>
          <p>Please return to your <strong>Customer Dashboard</strong> to generate a new download link.</p>
        </body>
      </html>
    `);
  }

  // Set download headers
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(tokenData.fileName)}"`);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');

  // Redirect to the underlying signed Firebase Storage file URL
  return res.redirect(tokenData.fileUrl);
});

// ==========================================
// 5. VITE & STATIC FILE SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Digital Product Sheba server running on port ${PORT}`);
  });
}

const isMain = process.argv[1] && (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.cjs'));
if (isMain && !process.env.NETLIFY && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  startServer();
}

export { app };
export default app;

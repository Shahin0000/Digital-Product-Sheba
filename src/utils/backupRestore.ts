import {
  collection,
  getDocs,
  doc,
  writeBatch,
  Timestamp,
  deleteDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BackupFileStructure } from '../types';

export const BACKUP_COLLECTIONS = [
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
] as const;

// Collections to wipe when formatting business data
export const BUSINESS_DATA_COLLECTIONS = [
  'products',
  'orders',
  'deliveries',
  'complaints',
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

/**
 * Recursively serialize Firestore data so types like Timestamp and Date
 * are preserved in standard JSON representation.
 */
export function serializeFirestoreData(obj: any): any {
  if (obj === null || obj === undefined) return null;

  // Firestore Timestamp instance
  if (obj && typeof obj.toDate === 'function') {
    return {
      __type: 'firestore_timestamp',
      seconds: obj.seconds,
      nanoseconds: obj.nanoseconds,
      iso: obj.toDate().toISOString(),
    };
  }

  // Native JavaScript Date instance
  if (obj instanceof Date) {
    return {
      __type: 'date',
      iso: obj.toISOString(),
    };
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeFirestoreData);
  }

  if (typeof obj === 'object') {
    const serialized: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      // Exclude any accidental auth token or password properties
      if (
        key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('credentialhash') ||
        key.toLowerCase().includes('authtoken')
      ) {
        continue;
      }
      serialized[key] = serializeFirestoreData(val);
    }
    return serialized;
  }

  return obj;
}

/**
 * Recursively reconstruct Firestore data types (e.g. Timestamps)
 * from JSON backup.
 */
export function deserializeFirestoreData(obj: any): any {
  if (obj === null || obj === undefined) return null;

  if (typeof obj === 'object') {
    if (obj.__type === 'firestore_timestamp' && typeof obj.seconds === 'number') {
      return new Timestamp(obj.seconds, obj.nanoseconds || 0);
    }
    if (obj.__type === 'date' && typeof obj.iso === 'string') {
      return new Date(obj.iso);
    }
    if (Array.isArray(obj)) {
      return obj.map(deserializeFirestoreData);
    }
    const deserialized: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      deserialized[key] = deserializeFirestoreData(val);
    }
    return deserialized;
  }

  return obj;
}

/**
 * Export all application/business collections from Firestore.
 */
export async function generateFullDatabaseBackup(
  projectName = 'Minarul Fashion House'
): Promise<{ backup: BackupFileStructure; totalCount: number }> {
  const collectionsData: Record<string, Record<string, any>> = {};
  let totalCount = 0;

  for (const colName of BACKUP_COLLECTIONS) {
    try {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      collectionsData[colName] = {};

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        collectionsData[colName][docSnap.id] = serializeFirestoreData(data);
        totalCount++;
      });
    } catch (err) {
      console.warn(`Collection "${colName}" read failed or does not exist:`, err);
      // If collection doesn't exist, keep an empty map
      collectionsData[colName] = {};
    }
  }

  const backup: BackupFileStructure = {
    backupVersion: '1.0',
    createdAt: new Date().toISOString(),
    projectName,
    totalDocuments: totalCount,
    collections: collectionsData,
  };

  return { backup, totalCount };
}

/**
 * Triggers a real browser file download for the generated backup JSON.
 */
export function downloadBackupFile(backup: BackupFileStructure) {
  const dateStr = new Date().toISOString().split('T')[0];
  const slug = (backup.projectName || 'minarul-fashion-house')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const filename = `${slug || 'minarul-fashion-house'}-backup-${dateStr}.json`;
  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const downloadUrl = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}

/**
 * Format / Delete all business data from Firestore.
 * Preserves the current authenticated admin account and admin access privileges!
 */
export async function formatAllBusinessData(
  currentAdminUid: string
): Promise<{ deletedCount: number; deletedByCollection: Record<string, number> }> {
  if (!currentAdminUid) {
    throw new Error('Admin UID is required to safeguard administrator access.');
  }

  let deletedCount = 0;
  const deletedByCollection: Record<string, number> = {};

  // 1. Wipe standard business collections
  for (const colName of BUSINESS_DATA_COLLECTIONS) {
    deletedByCollection[colName] = 0;
    try {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);

      const docsToDelete = snapshot.docs;
      const CHUNK_SIZE = 200;

      for (let i = 0; i < docsToDelete.length; i += CHUNK_SIZE) {
        const chunk = docsToDelete.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        chunk.forEach((d) => {
          batch.delete(d.ref);
          deletedCount++;
          deletedByCollection[colName]++;
        });
        await batch.commit();
      }
    } catch (err) {
      console.warn(`Error formatting collection ${colName}:`, err);
    }
  }

  // 2. Wipe customer users, but STRICTLY PRESERVE all admin accounts and currentAdminUid!
  try {
    deletedByCollection['users'] = 0;
    const usersRef = collection(db, 'users');
    const userSnap = await getDocs(usersRef);

    const customersToDelete = userSnap.docs.filter((d) => {
      const uData = d.data();
      // DO NOT delete the currently logged-in administrator
      if (d.id === currentAdminUid) return false;
      // DO NOT delete users with role admin
      if (uData.role === 'admin') return false;
      return true;
    });

    const CHUNK_SIZE = 200;
    for (let i = 0; i < customersToDelete.length; i += CHUNK_SIZE) {
      const chunk = customersToDelete.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((d) => {
        batch.delete(d.ref);
        deletedCount++;
        deletedByCollection['users']++;
      });
      await batch.commit();
    }
  } catch (err) {
    console.warn('Error formatting non-admin users:', err);
  }

  return { deletedCount, deletedByCollection };
}

/**
 * Validate backup JSON file structure and returns human-readable summary.
 */
export function validateBackupFile(content: any): {
  isValid: boolean;
  error?: string;
  summary?: {
    backupVersion: string;
    createdAt: string;
    projectName?: string;
    totalDocuments: number;
    collectionCounts: Record<string, number>;
  };
} {
  if (!content || typeof content !== 'object') {
    return { isValid: false, error: 'Invalid file format: JSON root must be an object.' };
  }

  if (!content.backupVersion) {
    return { isValid: false, error: 'Missing "backupVersion" in backup file.' };
  }

  if (!content.collections || typeof content.collections !== 'object') {
    return { isValid: false, error: 'Missing or corrupted "collections" object in backup file.' };
  }

  let totalDocs = 0;
  const collectionCounts: Record<string, number> = {};

  for (const [colName, docsMap] of Object.entries(content.collections)) {
    if (docsMap && typeof docsMap === 'object') {
      const count = Object.keys(docsMap).length;
      collectionCounts[colName] = count;
      totalDocs += count;
    } else {
      collectionCounts[colName] = 0;
    }
  }

  return {
    isValid: true,
    summary: {
      backupVersion: String(content.backupVersion),
      createdAt: content.createdAt ? String(content.createdAt) : new Date().toISOString(),
      projectName: content.projectName ? String(content.projectName) : 'Minarul Fashion House',
      totalDocuments: totalDocs,
      collectionCounts,
    },
  };
}

/**
 * Restores data from the backup file into Firestore.
 * Uses UPSERT (setDoc with merge) to preserve original collection and document IDs.
 */
export async function restoreBackupToFirestore(
  backup: BackupFileStructure,
  onProgress?: (progress: { current: number; total: number; collection: string }) => void
): Promise<{ restoredCount: number; restoredByCollection: Record<string, number> }> {
  if (!backup || !backup.collections) {
    throw new Error('Invalid backup structure.');
  }

  let totalDocsToRestore = 0;
  for (const [, docsMap] of Object.entries(backup.collections)) {
    if (docsMap && typeof docsMap === 'object') {
      totalDocsToRestore += Object.keys(docsMap).length;
    }
  }

  let restoredCount = 0;
  const restoredByCollection: Record<string, number> = {};

  for (const [colName, docsMap] of Object.entries(backup.collections)) {
    restoredByCollection[colName] = 0;
    if (!docsMap || typeof docsMap !== 'object') continue;

    const entries = Object.entries(docsMap);
    const CHUNK_SIZE = 100;

    for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
      const chunk = entries.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);

      for (const [docId, rawData] of chunk) {
        if (!docId || !rawData) continue;
        const deserializedData = deserializeFirestoreData(rawData);
        const docRef = doc(db, colName, docId);
        batch.set(docRef, deserializedData, { merge: true });
      }

      await batch.commit();

      restoredCount += chunk.length;
      restoredByCollection[colName] += chunk.length;

      if (onProgress) {
        onProgress({
          current: restoredCount,
          total: totalDocsToRestore,
          collection: colName,
        });
      }
    }
  }

  return { restoredCount, restoredByCollection };
}

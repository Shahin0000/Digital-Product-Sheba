/**
 * Cleanup utility to permanently purge legacy Service Workers, obsolete CacheStorage,
 * legacy LocalStorage/SessionStorage keys, and old IndexedDB databases from prior projects
 * (specifically "Minarul Fashion House") while safely preserving all Digital Product Sheba data.
 */

export function cleanupLegacyAppArtifacts(): void {
  if (typeof window === 'undefined') return;

  try {
    // 1. Unregister any obsolete service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().catch(() => {});
        }
      }).catch(() => {});
    }

    // 2. Clear obsolete caches from window.caches
    if ('caches' in window) {
      caches.keys().then((cacheNames) => {
        for (const name of cacheNames) {
          const lower = name.toLowerCase();
          if (
            lower.includes('minarul') ||
            lower.includes('fashion') ||
            lower.includes('workbox') ||
            lower.startsWith('old-')
          ) {
            caches.delete(name).catch(() => {});
          }
        }
      }).catch(() => {});
    }

    // 3. Purge obsolete LocalStorage keys
    try {
      const storageKeysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const lower = key.toLowerCase();
          if (lower.includes('minarul') || lower.includes('fashion')) {
            storageKeysToRemove.push(key);
          }
        }
      }
      storageKeysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {
      // Storage access blocked or restricted
    }

    // 4. Purge obsolete SessionStorage keys
    try {
      const sessionKeysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          const lower = key.toLowerCase();
          if (lower.includes('minarul') || lower.includes('fashion')) {
            sessionKeysToRemove.push(key);
          }
        }
      }
      sessionKeysToRemove.forEach((k) => sessionStorage.removeItem(k));
    } catch {
      // Storage access blocked or restricted
    }

    // 5. Clean obsolete IndexedDB databases matching old project names
    if ('indexedDB' in window && typeof indexedDB.databases === 'function') {
      indexedDB.databases().then((dbs) => {
        for (const dbInfo of dbs) {
          if (dbInfo.name) {
            const lower = dbInfo.name.toLowerCase();
            if (lower.includes('minarul') || lower.includes('fashion')) {
              try {
                indexedDB.deleteDatabase(dbInfo.name);
              } catch {
                // ignore
              }
            }
          }
        }
      }).catch(() => {});
    }
  } catch (err) {
    console.debug('Legacy app artifacts cleanup completed with non-fatal note:', err);
  }
}

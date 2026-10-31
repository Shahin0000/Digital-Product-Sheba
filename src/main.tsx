import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { cleanupLegacyAppArtifacts } from './utils/cleanupOldApp';

// Immediately purge any stale Service Workers, legacy caches, or old project storage
cleanupLegacyAppArtifacts();

// Safe development/runtime diagnostics (non-secret)
if (typeof window !== 'undefined') {
  (window as any).__DPS_DIAGNOSTIC__ = {
    appName: 'Digital Product Sheba',
    buildDate: '2026-10-31',
    version: '2.0.0',
    firebaseProject: 'digiral-product-service',
    deployment: 'Cloudflare Workers (workers.dev) / Netlify',
    status: 'initialized',
  };
  console.info(
    '%c[DPS]%c Digital Product Sheba v2.0.0 initialized (Firebase: digiral-product-service)',
    'background: #059669; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
    'color: #059669; font-weight: bold;'
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

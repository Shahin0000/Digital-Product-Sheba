import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { cleanupLegacyAppArtifacts } from './utils/cleanupOldApp';

// Immediately purge any stale Service Workers, legacy caches, or old project storage
cleanupLegacyAppArtifacts();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register service worker for PWA
import { registerSW } from 'virtual:pwa-register';

import { CloudSyncManager } from './lib/cloudSync';
import { triggerHaptic } from './lib/haptic';

// Enable global haptic feedback for interactive elements to improve mobile responsiveness
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (!target || !target.closest) return;
  
  const closestInteractive = target.closest('button, a, input[type="checkbox"], input[type="radio"], input[type="submit"], [role="button"], [class*="cursor-pointer"]');
  if (closestInteractive) {
    triggerHaptic('light');
    return;
  }
  
  try {
    const isPointer = window.getComputedStyle(target).cursor === 'pointer';
    if (isPointer) {
      triggerHaptic('light');
    }
  } catch(err) {}
}, { capture: true, passive: true });

// Patch localStorage to dispatch an event on every setItem to enable real-time UI updates
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  originalSetItem.apply(this, [key, value]);
  
  const event = new Event('localStorageUpdate');
  window.dispatchEvent(event);

  // Sync to Cloud asynchronously if it's app data
  // Exclude user session state from being synced globally!
  const ignoredKeys = ['sd_current_user', 'sd_active_page'];
  if (key.startsWith('sd_') && !ignoredKeys.includes(key) && !CloudSyncManager.isSyncing) {
    try {
      CloudSyncManager.pushData(key, JSON.parse(value));
    } catch {
      // fallback for strings
      CloudSyncManager.pushData(key, value);
    }
  }
};

window.addEventListener('load', () => {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      registerSW({
        immediate: true,
        onNeedRefresh() {
          console.log('Update available, please refresh.');
        },
        onOfflineReady() {
          console.log('App ready to work offline. Asset cache warmed successfully.');
        },
      });
    });
  } else {
    setTimeout(() => {
      registerSW({
        immediate: true,
        onNeedRefresh() {
          console.log('Update available, please refresh.');
        },
        onOfflineReady() {
          console.log('App ready to work offline. Asset cache warmed successfully.');
        },
      });
    }, 1000);
  }
});

const initApp = async () => {
  // Try to pull latest data from cloud BEFORE rendering
  await CloudSyncManager.pullAllData();
  CloudSyncManager.subscribeToChanges();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
};

initApp();

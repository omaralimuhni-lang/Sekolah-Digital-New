import { useState, useEffect } from 'react';
import { WifiOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setIsDismissed(false);
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && !isDismissed && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="bg-[#F59E0B] text-white px-4 py-3 flex items-center justify-between shadow-md fixed top-0 left-0 w-full z-[100]"
        >
          <div className="flex items-center space-x-3">
            <WifiOff className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">Mode Offline Aktif</p>
              <p className="text-xs opacity-90">Koneksi internet terputus. Anda masih dapat mengakses fitur dengan data yang tersimpan.</p>
            </div>
          </div>
          <button 
            onClick={() => setIsDismissed(true)}
            className="p-1 hover:bg-white/20 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

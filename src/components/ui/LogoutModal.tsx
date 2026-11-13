import { AnimatePresence, motion } from 'motion/react';
import { useAppContext } from '../../AppContext';
import { LogOut } from 'lucide-react';

export function LogoutModal() {
  const { isLogoutModalOpen, confirmLogout, cancelLogout } = useAppContext();

  return (
    <AnimatePresence>
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={cancelLogout}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xl transform-gpu cursor-pointer"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="relative bg-white/60 dark:bg-slate-900/80 backdrop-blur-3xl transform-gpu rounded-3xl shadow-2xl border border-white/20 dark:border-white/20 max-w-sm w-full p-6 overflow-hidden z-10 transition-colors duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 dark:from-slate-800/30 to-transparent pointer-events-none"></div>
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-16 h-16 bg-red-500/10 dark:bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/20 dark:border-red-500/30 rounded-full flex items-center justify-center mb-4 transition-colors duration-500">
                <LogOut className="w-8 h-8 ml-1" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 tracking-tight drop-shadow-sm transition-colors duration-500">Konfirmasi Keluar</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-8 leading-relaxed font-medium transition-colors duration-500">
                Apakah Anda yakin ingin mengakhiri sesi Anda saat ini?
              </p>
              
              <div className="flex w-full space-x-3">
                <button
                  onClick={cancelLogout}
                  className="flex-1 py-3 px-4 bg-white/70 dark:bg-slate-800/70 hover:bg-white/90 dark:hover:bg-slate-800 border border-white/20 dark:border-white/20 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all tracking-wide outline-none active:scale-95 shadow-sm"
                >
                  Batal
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 py-3 px-4 bg-red-500/90 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-[0_4px_12px_rgba(239,68,68,0.3)] tracking-wide outline-none active:scale-95 border border-red-400/50"
                >
                  Ya, Keluar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

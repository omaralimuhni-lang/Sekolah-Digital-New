import React from 'react';
import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { NAV_ITEMS } from '../../lib/navItems';

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export const MobileBottomSheet = React.memo(({ isOpen, onClose, title, children }: MobileBottomSheetProps) => {
  const activeNavItem = title ? NAV_ITEMS.find(item => item.id === title || item.label === title) : null;
  const themeClass = activeNavItem?.iconBg || 'bg-indigo-500';
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-[99998] bg-black/60 backdrop-blur-sm lg:hidden pointer-events-auto"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%", transition: { duration: 0.25, ease: "easeInOut" } }}
            transition={{ type: "spring", damping: 28, stiffness: 300, mass: 0.8 }}
            className="fixed inset-x-0 bottom-0 top-[6%] z-[99999] flex flex-col bg-slate-50 dark:bg-slate-900 lg:hidden overflow-hidden pointer-events-auto rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] ring-1 ring-white/10"
          >
            {/* Header Area */}
            <div className={`px-4 pb-4 pt-6 flex items-center justify-between shrink-0 relative text-white transition-colors duration-500 shadow-sm ${themeClass}`}>
              {/* Drag Handle UI */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/40 rounded-full"></div>
              
              {/* Premium Background Accents */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
              
              <div className="flex items-center w-full relative z-10 pt-3">
                <button 
                  onClick={onClose} 
                  className="p-2 -ml-1 rounded-xl bg-black/10 hover:bg-black/20 backdrop-blur-sm transition-colors outline-none active:scale-95 flex items-center justify-center cursor-pointer"
                >
                  <ChevronDown className="w-6 h-6" strokeWidth={2.5} />
                </button>
                
                <h3 className="font-extrabold text-lg flex-1 text-center tracking-tight drop-shadow-md pr-8">{title}</h3>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 w-full overflow-y-auto no-scrollbar relative min-h-0 bg-slate-50 dark:bg-slate-900">
              <div className="pb-32 w-full">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

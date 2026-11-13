import { AnimatePresence, motion } from 'motion/react';
import { useAppContext } from '../../AppContext';
import { Bell } from 'lucide-react';

export function Notification() {
  const { notification } = useAppContext();

  return (
    <AnimatePresence>
      {notification.visible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 20, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4"
        >
          <div className="bg-indigo-600/80 dark:bg-indigo-500/80 backdrop-blur-3xl transform-gpu text-white px-8 py-3 rounded-full shadow-[0_8px_32px_rgba(79,70,229,0.3)] flex items-center space-x-4 border border-indigo-400/50 max-w-lg w-full mx-auto md:w-auto pointer-events-auto transition-colors duration-500">
            <Bell className="w-6 h-6" />
            <span className="font-medium text-base truncate drop-shadow-sm">{notification.message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

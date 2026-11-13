import { useAppContext } from '../AppContext';
import { ArrowLeft, X, Info } from 'lucide-react';
import { NAV_ITEMS } from '../lib/navItems';

export function GenericPage() {
  const { activePage, navigate } = useAppContext();
  const activeNavItem = activePage ? NAV_ITEMS.find(item => item.id === activePage) : null;
  const themeClass = activeNavItem?.iconBg || 'bg-indigo-500';

  // Extract hex from bg-[#HEX] or map tailwind colors
  const getHexColor = (bgClass: string) => {
    const hexMatch = bgClass.match(/#([a-fA-F0-9]{6})/);
    if (hexMatch) return `#${hexMatch[1]}`;
    
    if (bgClass.includes('emerald')) return '#10B981';
    if (bgClass.includes('blue')) return '#3B82F6';
    if (bgClass.includes('violet')) return '#8B5CF6';
    if (bgClass.includes('rose')) return '#F43F5E';
    if (bgClass.includes('amber')) return '#F59E0B';
    if (bgClass.includes('pink')) return '#EC4899';
    if (bgClass.includes('orange')) return '#F97316';
    if (bgClass.includes('indigo')) return '#6366F1';
    if (bgClass.includes('teal')) return '#14B8A6';
    if (bgClass.includes('sky')) return '#0EA5E9';
    if (bgClass.includes('cyan')) return '#06B6D4';
    if (bgClass.includes('slate')) return '#64748B';
    
    return '#6366F1'; // default indigo
  };
  
  const themeColor = getHexColor(themeClass);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden relative">
      {/* Premium Colored Header - Only visible on desktop since BottomSheet handles it on mobile */}
      <div 
        className={`hidden lg:flex px-4 py-4 sm:px-6 sm:py-5 items-center justify-between text-white shadow-md relative overflow-hidden shrink-0 ${themeClass}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -z-0 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        
        <button 
          onClick={() => navigate('Beranda')}
          className="p-2 -ml-2 rounded-xl bg-black/10 hover:bg-black/20 backdrop-blur-sm transition-colors relative z-10 active:scale-95 outline-none"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
        </button>
        
        <h2 className="text-lg sm:text-xl font-bold tracking-tight relative z-10 drop-shadow-sm truncate px-4">
          {activePage}
        </h2>
        
        <button 
          onClick={() => navigate('Beranda')}
          className="p-2 -mr-2 rounded-xl hover:bg-black/20 relative z-10 active:scale-95 outline-none bg-black/10 backdrop-blur-sm transform-gpu transition-colors"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-8 overflow-y-auto relative z-10">
        <div 
          className="w-24 h-24 sm:w-28 sm:h-28 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-8 shadow-xl border border-slate-100 dark:border-slate-700 relative overflow-hidden"
          style={{ color: themeColor, boxShadow: `0 10px 40px -10px ${themeColor}60` }}
        >
          {/* Subtle colored glow indicating the theme */}
          <div className={`absolute inset-0 opacity-20 blur-xl ${themeClass}`}></div>
          <Info className="w-12 h-12 sm:w-14 sm:h-14 relative z-10" strokeWidth={1.5} />
        </div>
        
        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight mb-4 drop-shadow-sm">
          Modul {activePage}
        </h3>
        
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-md leading-relaxed font-medium">
          Halaman ini sedang dalam tahap pengembangan dan akan segera tersedia pada versi berikutnya.
        </p>
      </div>
    </div>
  );
}

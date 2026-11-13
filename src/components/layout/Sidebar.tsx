import { 
  LogOut, X, GraduationCap
} from 'lucide-react';
import { useAppContext } from '../../AppContext';
import { ROLE_NAMES } from '../../types';
import { cn } from '../../lib/utils';
import { NAV_ITEMS } from '../../lib/navItems';
import { triggerHaptic } from '../../lib/haptic';
export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, logout, settings, activePage, navigate, badges } = useAppContext();
  const identity = settings.appIdentity || {};
  if (!user) return null;
  
  const handleNavigate = (page: string) => {
    triggerHaptic('light');
    navigate(page);
    onClose();
  };
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transform-gpu z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 bottom-0 w-72 bg-white/60 dark:bg-slate-900/70 backdrop-blur-3xl transform-gpu border-r border-white/20 dark:border-white/20 z-50 transform transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] lg:translate-x-0 lg:static lg:w-72 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/20 dark:border-white/20 bg-transparent transition-colors duration-500">
          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
             {identity.iconUrl ? (
               <img src={identity.iconUrl} alt="Logo" className="w-8 h-8 object-contain rounded-md bg-white border border-slate-200" />
             ) : (
               <GraduationCap className="w-6 h-6" />
             )}
             <span className="text-xl font-bold tracking-tight dark:text-white drop-shadow-sm truncate">{identity.appName || 'Sekolah Digital'}</span>
          </div>
          <button className="p-2 -mr-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white/30 dark:hover:bg-slate-800/50 rounded-lg lg:hidden transition-colors" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <div className="flex items-center space-x-3 px-2 mb-8">
            <div className="w-12 h-12 rounded-full bg-white/70 dark:bg-slate-800/70 border border-white/20 dark:border-white/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold overflow-hidden shadow-sm shrink-0 transition-colors duration-500">
              {user.photoUrl ? <img src={user.photoUrl} alt="" className="object-cover w-full h-full" /> : user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 dark:text-white text-sm truncate drop-shadow-sm transition-colors duration-500">{user.name}</p>
              <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 truncate drop-shadow-sm">{ROLE_NAMES[user.role]}</p>
            </div>
          </div>
          <nav className="space-y-1.5 flex flex-col">
            {(() => {
              let items = NAV_ITEMS.filter(item => item.roles.includes(user.role));
              
              if (user.role === 'tendik') {
                try {
                  const akses = JSON.parse(localStorage.getItem('sd_akses_penginput') || '{}');
                  const userAkses = akses[user.name]; // undefined means no config set yet
                  const restrictedMenus = [
                    'Input Pembayaran',
                    'Input Pemasukan',
                    'Input Pengeluaran',
                    'Input Pembelian Koin',
                    'Input Data Kesiswaan',
                    'Input Data Kepegawaian',
                    'Input Data Sarana & Prasarana',
                    'Input Data Arsip & Surat',
                    'Input Pengumuman Sekolah',
                    'Input Poling & Survei Sekolah',
                    'Input Toko Sekolah'
                  ];
                  items = items.filter(item => {
                    if (restrictedMenus.includes(item.id)) {
                      return !userAkses || userAkses.includes(item.id);
                    }
                    return true;
                  });
                } catch(e) {}
              }
              let lastCategory: string | null = null;
              
              const pinnedIds = settings.pinnedMenus?.[user.role] || [];
              const renderItem = (item: any) => {
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all outline-none w-full text-left",
                      isActive
                        ? "bg-white/70 dark:bg-indigo-500/40 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-white/20 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300 font-bold relative overflow-hidden"
                        : "hover:bg-white/70 dark:hover:bg-slate-800/70 hover:shadow-sm border border-transparent hover:border-white/20 dark:hover:border-white/20 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium group",
                      item.isSettings && "mt-6"
                    )}
                  >
                    {isActive && <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 dark:from-indigo-400/20 to-transparent opacity-50"></div>}
                    <div className="relative">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm transition-transform relative z-10", item.iconBg, !isActive && "group-hover:scale-110 group-hover:rotate-3")}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      {badges[item.id] && (
                        <span className={cn(
                          "absolute -top-1.5 -right-1.5 flex items-center justify-center text-white font-bold rounded-full shadow-sm z-20 outline outline-2",
                          isActive ? "outline-indigo-100 dark:outline-indigo-900" : "outline-white dark:outline-slate-900",
                          badges[item.id] === 'Baru' ? "bg-rose-500 px-1.5 py-0.5 text-[8px] leading-none" : "bg-rose-500 min-w-[16px] h-4 px-1 text-[9px] leading-none"
                        )}>
                          {badges[item.id]}
                        </span>
                      )}
                    </div>
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              };
              
              const reactNodes = [];
              // Disematkan category
              if (pinnedIds.length > 0) {
                 const pinnedItems = items.filter(i => pinnedIds.includes(i.id));
                 if (pinnedItems.length > 0) {
                    reactNodes.push(
                      <div key="cat-pinned" className="pt-4 pb-1 px-4 mt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                          Disematkan
                        </span>
                      </div>
                    );
                    pinnedItems.forEach(item => reactNodes.push(renderItem(item)));
                 }
              }
              items.forEach((item) => {
                const isNewCategory = (item as any).category && (item as any).category !== lastCategory;
                if ((item as any).category) {
                  lastCategory = (item as any).category;
                }
                
                if (isNewCategory) {
                    reactNodes.push(
                      <div key={`cat-${lastCategory}`} className="pt-4 pb-1 px-4 mt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          {lastCategory}
                        </span>
                      </div>
                    );
                }
                reactNodes.push(renderItem(item));
              });
              return reactNodes;
            })()}
          </nav>
        </div>
        <div className="p-4 border-t border-white/20 dark:border-white/20 bg-white/50 dark:bg-slate-900/60 backdrop-blur-2xl transform-gpu transition-colors duration-500">
          <button 
            onClick={() => { triggerHaptic('medium'); logout(); }}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-white/70 dark:bg-slate-800/80 hover:bg-white/90 dark:hover:bg-slate-800 border border-white/20 dark:border-white/20 shadow-sm font-bold transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>
    </>
  );
}
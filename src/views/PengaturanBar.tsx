import { useAppContext } from '../AppContext';
import { ROLE_NAMES, Role, NavType } from '../types';
import {  MonitorSmartphone, Monitor, Smartphone, ShieldCheck, ArrowLeft, X, Pin } from 'lucide-react';
import { cn } from '../lib/utils';
import { NAV_ITEMS } from '../lib/navItems';
export function PengaturanBar() {
  const { settings, updateNavConfig, updatePinnedMenus, navigate } = useAppContext();
  const NAV_OPTIONS: { value: NavType; label: string; icon: any }[] = [
    { value: 'sidebar', label: 'Sidebar', icon: Monitor },
    { value: 'bottom', label: 'Bawah', icon: Smartphone },
    { value: 'both', label: 'Dua-duanya', icon: MonitorSmartphone },
  ];
  const handleTogglePin = (role: Role, menuId: string) => {
    const currentPinned = settings.pinnedMenus?.[role] || [];
    if (currentPinned.includes(menuId)) {
      updatePinnedMenus(role, currentPinned.filter(id => id !== menuId));
    } else {
      if (currentPinned.length >= 5) {
        alert('Maksimal 5 menu yang dapat dipilih untuk navigasi bar.');
        return;
      }
      updatePinnedMenus(role, [...currentPinned, menuId]);
    }
  };
  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden relative">
      {/* Premium Colored Header - Only visible on desktop since BottomSheet handles it on mobile */}
      <div 
        className="hidden lg:flex px-4 py-4 sm:px-6 sm:py-5 items-center justify-between text-white shadow-md relative overflow-hidden shrink-0 bg-slate-700"
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
          Pengaturan Bar
        </h2>
        
        <button 
          onClick={() => navigate('Beranda')}
          className="p-2 -mr-2 rounded-xl hover:bg-black/20 relative z-10 active:scale-95 outline-none bg-black/10 backdrop-blur-sm transform-gpu transition-colors"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
        </button>
      </div>
      {/* Content Area */}
      <div className="flex-1 p-6 sm:p-8 overflow-y-auto relative z-10 pb-32">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center space-x-4 mb-8 pb-6 border-b border-slate-200 dark:border-slate-700 relative z-10 transition-colors duration-500 text-center">
             <div>
                <div className="flex items-center justify-center space-x-2">
                   <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight drop-shadow-sm transition-colors duration-500">Pengaturan Navigasi</h2>
                   <ShieldCheck className="w-5 h-5 text-green-500" />
                </div>
               <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 transition-colors duration-500">Atur jenis menu navigasi dan sematkan menu unggulan (maks 5) untuk masing-masing hak akses pengguna.</p>
             </div>
          </div>
          <div className="grid gap-6 relative z-10">
            {(Object.keys(ROLE_NAMES) as Role[]).map((role) => {
              const roleMenus = NAV_ITEMS.filter(item => item.roles.includes(role));
              const currentPinned = settings.pinnedMenus?.[role] || [];
              
              return (
                <div key={role} className="flex flex-col p-5 sm:p-6 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl transform-gpu border border-slate-200 dark:border-slate-700 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all duration-300">
                  
                  {/* Top: Role Info & Type Selection */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-6 border-b border-slate-100 dark:border-slate-700/50">
                    <div className="mb-4 sm:mb-0">
                      <p className="font-bold text-lg text-slate-800 dark:text-white drop-shadow-sm transition-colors duration-500">{ROLE_NAMES[role]}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest font-bold transition-colors duration-500">Role: {role}</p>
                    </div>
                    <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl shadow-inner overflow-hidden border border-slate-200 dark:border-slate-700 self-start sm:self-auto w-full sm:w-auto transition-colors duration-500">
                      {NAV_OPTIONS.map((opt) => {
                        const isActive = settings.navConfig[role] === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => updateNavConfig(role, opt.value)}
                            className={cn(
                              "flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 text-xs transition-all outline-none rounded-lg font-bold tracking-wide",
                              isActive 
                                ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm border border-slate-200 dark:border-slate-600" 
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 border border-transparent"
                            )}
                          >
                            <opt.icon className={cn("w-4 h-4 hidden sm:block transition-colors duration-500", isActive ? "text-indigo-600 dark:text-indigo-300" : "text-slate-400 dark:text-slate-500")} />
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {/* Bottom: Menu Selection grid */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Pilih Menu untuk disematkan di Navigasi</h3>
                      <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full">
                        {currentPinned.length} / 5
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {roleMenus.map(menu => {
                        const isPinned = currentPinned.includes(menu.id);
                        return (
                          <button
                            key={menu.id}
                            onClick={() => handleTogglePin(role, menu.id)}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-xl border text-left transition-all overflow-hidden",
                              isPinned 
                                ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30" 
                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750"
                            )}
                          >
                            <div className={cn(
                              "w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-white",
                              menu.iconBg || 'bg-slate-500'
                            )}>
                              <menu.icon className="w-4 h-4" />
                            </div>
                            <span className={cn(
                              "text-sm font-semibold truncate flex-1",
                              isPinned ? "text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-300"
                            )}>
                              {menu.label}
                            </span>
                            {isPinned && <Pin className="w-4 h-4 text-indigo-500 shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
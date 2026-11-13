import { LayoutDashboard, Calendar as  LogOut } from 'lucide-react';
import { useAppContext } from '../../AppContext';
import { cn } from '../../lib/utils';
import { NAV_ITEMS } from '../../lib/navItems';
import { triggerHaptic } from '../../lib/haptic';
export function BottomNav() {
  const { user, logout, activePage, navigate, badges, settings } = useAppContext();
  
  if (!user) return null;
  let navItems: { id: string; icon: any; label: string; active: boolean; isDanger?: boolean; action: () => void }[] = [];
  const pinnedIds = settings.pinnedMenus?.[user.role] || [];
  if (pinnedIds.length > 0) {
    const pinnedMenus = pinnedIds.map(id => NAV_ITEMS.find(item => item.id === id)).filter(Boolean) as typeof NAV_ITEMS;
    navItems = [
      { id: 'Beranda', icon: LayoutDashboard, label: 'Beranda', active: activePage === 'Beranda', action: () => { triggerHaptic('light'); navigate('Beranda'); } },
      ...pinnedMenus.filter(p => p.id !== 'Beranda' && p.id !== 'Keluar').map(item => ({
        id: item.id,
        icon: item.icon,
        label: item.label,
        active: activePage === item.id,
        action: () => { triggerHaptic('light'); navigate(item.id); }
      })),
      { id: 'Keluar', icon: LogOut, label: 'Keluar', active: false, isDanger: true, action: () => { triggerHaptic('medium'); logout(); } }
    ];
  } else {
    const roleItems = NAV_ITEMS.filter(item => item.roles.includes(user.role) && item.id !== 'Beranda').slice(0, 3);
    navItems = [
      { id: 'Beranda', icon: LayoutDashboard, label: 'Beranda', active: activePage === 'Beranda', action: () => { triggerHaptic('light'); navigate('Beranda'); } },
      ...roleItems.map(item => ({
        id: item.id,
        icon: item.icon,
        label: item.label,
        active: activePage === item.id,
        action: () => { triggerHaptic('light'); navigate(item.id); }
      })),
      { id: 'Keluar', icon: LogOut, label: 'Keluar', active: false, isDanger: true, action: () => { triggerHaptic('medium'); logout(); } }
    ];
  }
  // Hide bottom nav if it's not the active page AND they are using pinned menus without "Beranda" maybe? No, let's keep it visible everywhere, or maybe hide it on certain pages if it gets in the way.
  // Currently the code had `if (activePage !== 'Beranda') return null;`. Let's remove that so nav stays visible across pages.
  // Wait, if I remove `if (activePage !== 'Beranda') return null;`, then bottom nav is visible everywhere. Let's keep it visible so they can use the navigation menu.
  return (
    <div className="fixed justify-center bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-3xl pb-safe">
      <nav className="bg-white/60 dark:bg-slate-900/70 backdrop-blur-3xl transform-gpu border border-white/20 dark:border-white/20 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.1)] flex items-center justify-around px-3 sm:px-6 py-4 relative overflow-hidden transition-colors duration-500 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 dark:from-slate-800/30 to-transparent pointer-events-none"></div>
        {navItems.map((item, index) => (
          <button 
             key={index}
             onClick={item.action}
             className={cn(
               "flex flex-col items-center space-y-1.5 transition-all duration-300 min-w-[3.5rem] sm:min-w-[4.5rem] shrink-0 relative z-10 text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400",
               item.active && "text-indigo-600 dark:text-indigo-400 drop-shadow-[0_0_8px_rgba(79,70,229,0.3)]",
               item.isDanger && "hover:text-red-500 dark:hover:text-red-400"
             )}
          >
            <div className="relative">
              <item.icon className="w-6 h-6 sm:w-7 sm:h-7" />
              {badges[item.id] && (
                <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center shadow-sm border border-white dark:border-slate-900">
                  {badges[item.id]}
                </span>
              )}
            </div>
            <span className="text-[10px] sm:text-xs font-bold tracking-wide truncate max-w-[4.5rem] px-1 text-center">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
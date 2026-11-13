import { useState, ReactNode, useEffect } from 'react';
import { Menu, GraduationCap, Sun, Moon } from 'lucide-react';
import { useAppContext } from '../../AppContext';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export function MainLayout({ children }: { children: ReactNode }) {
  const { user, settings, toggleTheme } = useAppContext();
  const identity = settings.appIdentity || {};
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const displayConfig = settings.globalDisplay || {
    colorTheme: 'blue',
    fontFamily: 'font-sans',
    fontSize: 'text-base',
  };

  const isDark = user ? settings.themeConfig[user.role] === 'dark' : false;

  useEffect(() => {
     document.documentElement.className = `${displayConfig.fontFamily || 'font-sans'} ${displayConfig.fontSize || 'text-base'} ${isDark ? 'dark' : ''}`;
  }, [displayConfig.fontFamily, displayConfig.fontSize, isDark]);

  if (!user) return <>{children}</>;

  const currentNav = settings.navConfig[user.role];
  const showSidebar = currentNav === 'sidebar' || currentNav === 'both';
  const showBottomNav = currentNav === 'bottom' || currentNav === 'both';


  const getThemeColors = (theme: string) => {
    switch(theme) {
      case 'rose': return ['bg-rose-400 dark:bg-rose-700/50', 'bg-pink-400 dark:bg-pink-800/50', 'bg-red-300 dark:bg-red-800/30'];
      case 'green': return ['bg-emerald-400 dark:bg-emerald-700/50', 'bg-teal-400 dark:bg-teal-800/50', 'bg-green-300 dark:bg-green-800/30'];
      case 'amber': return ['bg-amber-400 dark:bg-amber-700/50', 'bg-orange-400 dark:bg-orange-800/50', 'bg-yellow-300 dark:bg-yellow-800/30'];
      case 'violet': return ['bg-violet-400 dark:bg-violet-700/50', 'bg-purple-400 dark:bg-purple-800/50', 'bg-fuchsia-300 dark:bg-fuchsia-800/30'];
      case 'slate': return ['bg-slate-400 dark:bg-slate-700/50', 'bg-gray-400 dark:bg-gray-800/50', 'bg-zinc-300 dark:bg-zinc-800/30'];
      case 'blue': default: return ['bg-indigo-400 dark:bg-indigo-700/50', 'bg-blue-400 dark:bg-blue-800/50', 'bg-cyan-300 dark:bg-cyan-800/30'];
    }
  };

  const [color1, color2, color3] = getThemeColors(displayConfig.colorTheme);

  return (
    <div className={`flex h-[100dvh] overflow-hidden ${displayConfig.fontFamily || 'font-sans'} ${displayConfig.fontSize || 'text-base'} relative selection:bg-indigo-100 selection:text-indigo-900 transition-colors duration-500 ${isDark ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      {/* Global Background Accents for Glass Effect Visibility */}
      <div className={`fixed top-[-10%] left-[-10%] w-[80%] h-[50%] sm:w-[50%] sm:h-[50%] sm:top-[-20%] ${color1} rounded-full blur-[100px] sm:blur-[120px] opacity-30 sm:opacity-20 pointer-events-none transition-colors duration-500 transform-gpu will-change-transform`}></div>
      <div className={`fixed top-[40%] right-[-5%] w-[60%] h-[40%] sm:w-[50%] sm:h-[40%] sm:right-[-10%] ${color2} rounded-full blur-[100px] sm:blur-[120px] opacity-20 sm:opacity-[0.15] pointer-events-none transition-colors duration-500 transform-gpu will-change-transform`}></div>
      <div className={`fixed bottom-[-10%] right-[10%] w-[80%] h-[50%] sm:w-[50%] sm:h-[50%] sm:bottom-[-20%] ${color3} rounded-full blur-[100px] sm:blur-[120px] opacity-30 sm:opacity-20 pointer-events-none transition-colors duration-500 transform-gpu will-change-transform`}></div>
      
      {showSidebar && (
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      )}
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header - Make always visible for theme toggle and mobile menu */}
        <header className="h-16 bg-white/60 dark:bg-slate-900/70 backdrop-blur-3xl transform-gpu border-b border-white/20 dark:border-white/20 flex items-center justify-between px-4 sm:px-8 z-30 flex-shrink-0 shadow-[0_4px_30px_rgba(0,0,0,0.02)] relative transition-colors duration-500">
          <div className="flex items-center space-x-3 text-indigo-600 dark:text-indigo-400">
            {showSidebar && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 text-slate-500 dark:text-slate-300 hover:bg-white/30 dark:hover:bg-slate-800/50 rounded-xl transition-colors lg:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}
            <div className={`flex items-center space-x-2 ${showSidebar ? 'lg:hidden' : ''}`}>
               {!showSidebar && (
                 identity.iconUrl ? (
                   <img src={identity.iconUrl} alt="Logo" className="w-6 h-6 sm:w-8 sm:h-8 object-contain rounded-md bg-white border border-slate-200" />
                 ) : (
                   <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7" />
                 )
               )}
               <span className="text-xl font-extrabold tracking-tight dark:text-white drop-shadow-sm truncate hidden sm:block max-w-[200px]">{identity.appName || 'Sekolah Digital'}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
             <button
               onClick={() => toggleTheme(user.role)}
               className="p-2 rounded-xl bg-white/70 dark:bg-slate-800/80 border border-white/20 dark:border-white/20 text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-slate-700/80 shadow-sm transition-all outline-none"
             >
               {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
             </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className={`flex-1 overflow-y-auto w-full scroll-smooth relative ${showBottomNav ? 'pb-36 lg:pb-16' : ''}`}>
          <div className="w-full h-full p-4 md:p-8 lg:px-12 flex flex-col">
            {children}
            {showBottomNav && <div className="h-24 lg:h-0 w-full shrink-0" aria-hidden="true" />}
          </div>
        </main>

        {showBottomNav && <BottomNav />}
      </div>
    </div>
  );
}

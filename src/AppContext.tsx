import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User, Role, NavType, AppSettings } from './types';
import { io, Socket } from 'socket.io-client';
import { eventBus } from './lib/eventBus';

interface AppState {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  confirmLogout: () => void;
  cancelLogout: () => void;
  isLogoutModalOpen: boolean;
  settings: AppSettings;
  updateNavConfig: (role: Role, navType: NavType) => void;
  updatePinnedMenus: (role: Role, menus: string[]) => void;
  updateAppIdentity: (identity: Partial<import('./types').AppIdentity>) => void;
  updateGlobalDisplay: (display: Partial<import('./types').GlobalDisplaySettings>) => void;
  updateAdminCredentials: (username?: string, password?: string) => void;
  toggleTheme: (role: Role) => void;
  notification: { message: string; visible: boolean; type?: 'success' | 'error' | 'warning' | 'info' };
  showNotification: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  activePage: string;
  navigate: (page: string) => void;
  badges: Record<string, number | string>;
  clearBadge: (id: string) => void;
  addBadge: (id: string, value: number | string) => void;
}

const defaultSettings: AppSettings = {
  navConfig: {
    admin: 'both',
    siswa: 'bottom',
    guru: 'sidebar',
    tendik: 'sidebar',
    ortu: 'bottom',
    mitra: 'sidebar',
  },
  themeConfig: {
    admin: 'light',
    siswa: 'light',
    guru: 'light',
    tendik: 'light',
    ortu: 'light',
    mitra: 'light',
  },
  pinnedMenus: {
    admin: [],
    siswa: [],
    guru: [],
    tendik: [],
    ortu: [],
    mitra: []
  },
  appIdentity: {
    appName: 'Sekolah Digital',
    appDescription: 'Sekolah Digital',
    iconUrl: '/logo-v2.png'
  },
  globalDisplay: {
    colorTheme: 'blue',
    fontFamily: 'Inter',
    fontSize: 'base'
  }
};

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const loadInitialUser = () => {
    try {
      const stored = localStorage.getItem('sd_current_user');
      if (stored) return JSON.parse(stored);
    } catch(e){
      console.error('Failed to parse user from local storage', e);
    }
    return null;
  };
  const [user, setUser] = useState<User | null>(loadInitialUser());
  const loadInitialSettings = () => {
    const stored = localStorage.getItem('sd_settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        
        // Fix legacy defaults so the new logo appears if they haven't explicitly customized it
        if (parsed?.appIdentity) {
          if (parsed.appIdentity.iconUrl === '/pwa-192x192.svg' || parsed.appIdentity.iconUrl === '/logo.png' || !parsed.appIdentity.iconUrl) {
            parsed.appIdentity.iconUrl = '/logo-v2.png';
          }
          if (parsed.appIdentity.appName === 'E-Sekolah' || parsed.appIdentity.appName === 'Yayasan Al-Ittihad') {
            parsed.appIdentity.appName = 'Sekolah Digital';
          }
          if (parsed.appIdentity.appDescription === 'Platform Digital Sekolah' || parsed.appIdentity.appDescription === 'Platform Digital Yayasan Al-Ittihad Harapan Jaya') {
            parsed.appIdentity.appDescription = 'Sekolah Digital';
          }
        }
        
        return { ...defaultSettings, ...parsed, appIdentity: { ...defaultSettings.appIdentity, ...parsed.appIdentity } };
      } catch (e) {
        console.error('Failed to parse settings from local storage', e);
      }
    }
    return defaultSettings;
  };

  const [settings, setSettings] = useState<AppSettings>(loadInitialSettings());

  useEffect(() => {
    localStorage.setItem('sd_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('sd_settings');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSettings(prev => {
            // Prevent infinite loop by checking if values actually changed
            const newAppIdentity = { ...prev.appIdentity, ...parsed.appIdentity };
            const newGlobalDisplay = { ...prev.globalDisplay, ...parsed.globalDisplay };
            
            if (JSON.stringify(prev.appIdentity) === JSON.stringify(newAppIdentity) && 
                JSON.stringify(prev.globalDisplay) === JSON.stringify(newGlobalDisplay)) {
              return prev;
            }
            
            return {
              ...prev,
              appIdentity: newAppIdentity,
              globalDisplay: newGlobalDisplay
            };
          });
        } catch (e) {
          console.error("Failed to parse settings from storage", e);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageUpdate', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageUpdate', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    // 1. Update Title
    document.title = settings.appIdentity?.appName || 'Sekolah Digital';

    // 2. Update Icons
    let iconUrl = settings.appIdentity?.iconUrl || '/logo-v2.png';
    let linkIcon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!linkIcon) {
      linkIcon = document.createElement('link');
      linkIcon.setAttribute('rel', 'icon');
      document.head.appendChild(linkIcon);
    }
    linkIcon.setAttribute('href', iconUrl);
    linkIcon.setAttribute('type', iconUrl.startsWith('data:image/svg') || iconUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png');

    let linkAppleIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    if (!linkAppleIcon) {
      linkAppleIcon = document.createElement('link');
      linkAppleIcon.setAttribute('rel', 'apple-touch-icon');
      document.head.appendChild(linkAppleIcon);
    }
    linkAppleIcon.setAttribute('href', iconUrl);
  }, [settings.appIdentity]);

  const [notification, setNotification] = useState<{message: string, visible: boolean, type?: 'success' | 'error' | 'warning' | 'info'}>({ message: '', visible: false });
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const loadInitialPage = () => {
    try {
      const stored = localStorage.getItem('sd_active_page');
      if (stored) return stored;
    } catch(e){}
    return 'Beranda';
  };
  const [activePage, setActivePage] = useState(loadInitialPage());
  
  useEffect(() => {
    localStorage.setItem('sd_active_page', activePage);
  }, [activePage]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('sd_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('sd_current_user');
    }
  }, [user]);
  
  const [badges, setBadges] = useState<Record<string, number | string>>({});
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const calculateBadges = () => {
      const newBadges: Record<string, number | string> = {};
      
      // Hitung pesanan masuk Kantin
      const pesananData = JSON.parse(localStorage.getItem('sd_kantin_pesanan_masuk') || '[]');
      const pendingPesanan = pesananData.filter((p: any) => p.status === 'Baru' || p.status === 'Diproses').length;
      if (pendingPesanan > 0) newBadges['Pesanan Masuk Kantin'] = pendingPesanan;

      // Hitung PR & Tugas (Siswa / Guru)
      const prData = JSON.parse(localStorage.getItem('sd_pr_tugas') || '[]');
      if (prData.length > 0) newBadges['PR & Tugas Siswa'] = prData.length;

      // Penilaian (Siswa)
      const raportData = JSON.parse(localStorage.getItem('sd_raport') || '[]');
      const raportSiswa = raportData.filter((r: any) => r.status && r.status.toLowerCase() === 'baru').length;
      if (raportSiswa > 0) {
         newBadges['Penilaian & Raport Siswa'] = 'Baru';
         newBadges['Penilaian & Raport Anak'] = 'Baru';
      }

      // Laporan Top Up Koin (Admin)
      const topUpData = JSON.parse(localStorage.getItem('sd_topup_koin_list') || '[]');
      const pendingTopUp = topUpData.filter((p: any) => p.status === 'Diproses').length;
      if (pendingTopUp > 0) newBadges['Laporan Top Up Koin'] = pendingTopUp;

      // Generic unseen notifications logic
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('unseen_')) {
          const val = parseInt(localStorage.getItem(key) || '0', 10);
          if (val > 0) {
            const menuId = key.replace('unseen_', '');
            // Only set badge if not currently on the page
            if (activePage !== menuId) {
                newBadges[menuId] = val;
            } else {
                // If on the page, automatically clear it locally to prevent badge flash
                localStorage.removeItem(key);
            }
          }
        }
      }

      setBadges(newBadges);
    };

    calculateBadges();

    const handleUpdate = () => calculateBadges();
    window.addEventListener('localStorageUpdate', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    eventBus.on('refresh-notifications', handleUpdate);

    return () => {
      window.removeEventListener('localStorageUpdate', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      eventBus.off('refresh-notifications', handleUpdate);
    };
  }, [activePage]);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('notification_update', (data: { id: string; value: number | string }) => {
      setBadges((prev) => {
        // Skip adding notification if the user is currently on that page
        if (activePage === data.id) return prev;
        
        let newVal = data.value;
        const currentVal = prev[data.id];
        
        if (typeof currentVal === 'number' && typeof newVal === 'number') {
          newVal = currentVal + newVal;
        } else if (currentVal === 'Baru') {
          newVal = 'Baru';
        }
        
        return { ...prev, [data.id]: newVal };
      });
    });

    return () => {
      newSocket.close();
    };
  }, [activePage]);

  const clearBadge = useCallback((id: string) => {
    localStorage.removeItem(`unseen_${id}`);
    
    setBadges((prev) => {
      if (!prev[id]) return prev;
      const newBadges = { ...prev };
      delete newBadges[id];
      return newBadges;
    });
    
    if (socket) {
      socket.emit('clear_notification', { id });
    }
  }, [socket]);

  const addBadge = useCallback((id: string, value: number | string) => {
    setBadges((prev) => ({ ...prev, [id]: value }));
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    setActivePage('Beranda');
    showNotification(`Selamat datang, ${userData.name}!`);
  };

  const logout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    setUser(null);
    setActivePage('Beranda');
    setIsLogoutModalOpen(false);
    showNotification('Berhasil keluar.');
  };

  const cancelLogout = () => {
    setIsLogoutModalOpen(false);
  };

  const updateNavConfig = (role: Role, navType: NavType) => {
    setSettings((prev) => ({
      ...prev,
      navConfig: {
        ...prev.navConfig,
        [role]: navType,
      },
    }));
    showNotification(`Navigasi ${role} diperbarui menjadi ${navType}.`);
  };

  const updatePinnedMenus = (role: Role, menus: string[]) => {
    setSettings((prev) => ({
      ...prev,
      pinnedMenus: {
        ...prev.pinnedMenus,
        [role]: menus,
      } as Record<Role, string[]>
    }));
    showNotification(`Menu yang disematkan untuk ${role} berhasil diperbarui.`);
  };

  const updateAppIdentity = (identity: Partial<import('./types').AppIdentity>) => {
    setSettings((prev) => ({
      ...prev,
      appIdentity: {
        ...prev.appIdentity,
        ...identity
      }
    }));
    showNotification('Identitas aplikasi berhasil diperbarui.');
  };

  const updateGlobalDisplay = (display: Partial<import('./types').GlobalDisplaySettings>) => {
    setSettings((prev) => ({
      ...prev,
      globalDisplay: {
        ...prev.globalDisplay,
        ...display
      } as import('./types').GlobalDisplaySettings
    }));
    showNotification('Tampilan aplikasi berhasil diperbarui.');
  };

  const updateAdminCredentials = (username?: string, password?: string) => {
    setSettings((prev) => ({
      ...prev,
      adminCredentials: { username, password }
    }));
    showNotification('Akses Login Admin berhasil diperbarui.');
  };

  const toggleTheme = (role: Role) => {
    setSettings((prev) => ({
      ...prev,
      themeConfig: {
        ...prev.themeConfig,
        [role]: prev.themeConfig[role] === 'light' ? 'dark' : 'light',
      },
    }));
  };

  const navigate = useCallback((page: string) => {
    setActivePage(page);
    clearBadge(page);
  }, [clearBadge]);

  const showNotification = (message: string, type?: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ message, visible: true, type });
  };

  useEffect(() => {
    if (notification.visible) {
      const timer = setTimeout(() => {
        setNotification((prev) => ({ ...prev, visible: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.visible]);

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        logout,
        confirmLogout,
        cancelLogout,
        isLogoutModalOpen,
        settings,
        updateNavConfig,
        updatePinnedMenus,
        updateAppIdentity,
        updateGlobalDisplay,
        updateAdminCredentials,
        toggleTheme,
        notification,
        showNotification,
        activePage,
        navigate,
        badges,
        clearBadge,
        addBadge,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

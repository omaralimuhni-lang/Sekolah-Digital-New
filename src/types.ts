export type Role = 'admin' | 'siswa' | 'guru' | 'tendik' | 'ortu' | 'mitra';

export interface User {
  id: string;
  name: string;
  role: Role;
  photoUrl: string;
  nisn?: string;
}

export type NavType = 'sidebar' | 'bottom' | 'both';
export type Theme = 'light' | 'dark';

export interface AppIdentity {
  iconUrl?: string;
  appName?: string;
  appDescription?: string;
}

export interface GlobalDisplaySettings {
  colorTheme: string;
  fontFamily: string;
  fontSize: string;
}

export interface AppSettings {
  navConfig: Record<Role, NavType>;
  themeConfig: Record<Role, Theme>;
  pinnedMenus?: Record<Role, string[]>;
  appIdentity?: AppIdentity;
  globalDisplay?: GlobalDisplaySettings;
  adminCredentials?: { username?: string, password?: string };
}

export const ROLE_NAMES: Record<Role, string> = {
  admin: 'Administrator',
  siswa: 'Siswa',
  guru: 'Guru',
  tendik: 'Tenaga Pendidik',
  ortu: 'Orang Tua Siswa',
  mitra: 'Mitra',
};

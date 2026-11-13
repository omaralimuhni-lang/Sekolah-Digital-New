import { useState, FormEvent } from 'react';
import { useAppContext } from '../AppContext';
import { User } from '../types';
import { GraduationCap, Eye, EyeOff, User as UserIcon, Lock } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';
const DEMO_USERS: User[] = [
  { id: 'ADM-001', name: 'Budi Santoso', role: 'admin', photoUrl: '' }
];
export function Login() {
  const { login, showNotification, settings } = useAppContext();
  const identity = settings.appIdentity || {};
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');
    if (!username || !password) {
      showNotification('Username dan password harus diisi');
      return;
    }
    
    // Check real database first
    const dbs = [
      { key: 'sd_db_siswa', role: 'siswa' },
      { key: 'sd_db_guru', role: 'guru' },
      { key: 'sd_db_tenaga_pendidik', role: 'tendik' },
      { key: 'sd_db_ortu', role: 'ortu' },
      { key: 'sd_db_mitra', role: 'mitra' }
    ];
    
    // Check Custom Admin Credentials FIRST
    if (settings.adminCredentials?.username && settings.adminCredentials?.password) {
      if (username === settings.adminCredentials.username && password === settings.adminCredentials.password) {
          login({ id: 'ADM-CUSTOM', name: 'Administrator', role: 'admin', photoUrl: '' });
          showNotification(`Berhasil login sebagai Administrator`);
          return;
      }
    } 
    
    // Default admin fallback if custom is not set OR as a failsafe if forgotten
    if (username === 'admin' && password === 'admin') {
        login(DEMO_USERS.find(u => u.role === 'admin')!);
        showNotification(`Berhasil login sebagai Administrator (Sistem Default)`);
        return;
    }
    
    for (const db of dbs) {
      const raw = localStorage.getItem(db.key);
      if (raw) {
        try {
          const arr = JSON.parse(raw);
          const found = arr.find((item: any) => item.username === username && item.password === password);
          if (found) {
              login({
               id: found.id,
               name: found.fullName || found.username, 
               role: db.role as any,
               photoUrl: found.photoUrl || '',
               nisn: found.nisn || undefined
             });
             showNotification(`Berhasil login sebagai ${found.fullName}`);
             return;
          }
        } catch(e) {}
      }
    }
    // No fallback to demo users anymore
    showNotification('Username atau password tidak ditemukan.', 'error');
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden font-sans">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-300 rounded-full blur-[120px] opacity-40"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-300 rounded-full blur-[120px] opacity-40"></div>
      
      <div className="bg-white/50 backdrop-blur-3xl transform-gpu w-full max-w-md rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-white/20 p-8 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
        <div className="flex flex-col items-center mb-8 relative z-10">
          {identity.iconUrl ? (
            <div className="w-20 h-20 bg-white shadow-lg shadow-indigo-500/10 mb-5 relative group border border-slate-200/50 rounded-2xl overflow-hidden flex items-center justify-center">
               <img src={identity.iconUrl} alt="Logo Aplikasi" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-indigo-600/90 backdrop-blur-2xl transform-gpu rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-5 relative group cursor-default border border-indigo-400/50">
              <div className="absolute inset-0 bg-indigo-400 rounded-2xl animate-ping opacity-20"></div>
              <GraduationCap className="w-10 h-10 text-white relative z-10 drop-shadow-sm" />
            </div>
          )}
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight text-center drop-shadow-sm">{identity.appName || 'Sekolah Digital'}</h1>
          <p className="text-sm text-slate-600 font-medium mt-2 text-center drop-shadow-sm max-w-[280px] leading-relaxed">{identity.appDescription || 'Platform Manajemen Terpadu'}</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4 mb-8 relative z-10">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <UserIcon className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/70 border border-white/20 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400/50 transition-all shadow-sm"
                placeholder="Masukkan username Anda"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 bg-white/70 border border-white/20 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400/50 transition-all shadow-sm"
                placeholder="Masukkan password Anda"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-indigo-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-[0_4px_12px_rgba(79,70,229,0.3)] transition-all tracking-wide outline-none active:scale-95 border border-indigo-500/50 mt-2"
          >
            Masuk
          </button>
        </form>
        <div className="space-y-4 relative z-10 pt-4 border-t border-white/20">
          <div className="flex items-center justify-center mb-6 text-slate-600 dark:text-slate-400">
             <span className="text-sm font-semibold">Hak Cipta © Muhidin 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { useRef } from 'react';
import { useAppContext } from '../../AppContext';
import { AppWindow, Save, Upload, X } from 'lucide-react';
export function PengaturanAplikasi() {
  const { settings, updateAppIdentity, updateAdminCredentials } = useAppContext();
  const identity = settings.appIdentity || {};
  
  const [appName, setAppName] = React.useState(identity.appName || '');
  const [appDescription, setAppDescription] = React.useState(identity.appDescription || '');
  const [iconUrl, setIconUrl] = React.useState(identity.iconUrl || '');
  const [adminUsername, setAdminUsername] = React.useState(settings.adminCredentials?.username || '');
  const [adminPassword, setAdminPassword] = React.useState(settings.adminCredentials?.password || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert("Ukuran gambar maksimal 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setIconUrl(base64);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleSave = () => {
    updateAppIdentity({
      appName,
      appDescription,
      iconUrl,
    });
    updateAdminCredentials(adminUsername, adminPassword);
  };
  const handleResetIcon = () => {
    setIconUrl('');
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full pb-32">
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2 sm:p-3 bg-slate-600 rounded-xl text-white">
            <AppWindow className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Pengaturan Aplikasi
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Atur identitas aplikasi secara global untuk seluruh role.
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700/50 flex flex-col space-y-8">
            
            {/* Logo Settings */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Ikon / Logo Aplikasi</h2>
                <p className="text-sm text-slate-500">Logo ini akan ditampilkan di header dan menu aplikasi untuk semua pengguna.</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 relative group">
                    {iconUrl ? (
                        <>
                            <img src={iconUrl} alt="Logo" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center transition-all">
                                <button onClick={handleResetIcon} className="p-2 bg-rose-500 rounded-full text-white hover:bg-rose-600 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <AppWindow className="w-8 h-8 text-slate-400" />
                    )}
                </div>
                <div className="flex-1 space-y-3 w-full">
                   <div className="flex flex-wrap gap-2">
                       <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 font-semibold text-sm rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors flex items-center gap-2">
                           <Upload className="w-4 h-4" /> Upload Ikon
                       </button>
                       {iconUrl && (
                          <button onClick={handleResetIcon} className="px-4 py-2 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 font-semibold text-sm rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors">
                             Hapus Ikon
                          </button>
                       )}
                   </div>
                   <p className="text-xs text-slate-500">Maksimal ukuran 2MB. Format JPG, PNG, atau SVG disarankan rasio 1:1.</p>
                   <input type="file" accept="image/png, image/jpeg, image/svg+xml" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                </div>
              </div>
            </div>
            <div className="h-px bg-slate-200 dark:bg-slate-700/50 w-full" />
            {/* Nama Aplikasi */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Nama Aplikasi</h2>
                <p className="text-sm text-slate-500">Nama utama yang akan tampil pada judul dan banner.</p>
              </div>
              <input 
                 type="text" 
                 value={appName} 
                 onChange={(e) => setAppName(e.target.value)} 
                 placeholder="Misal: Sekolah Digital"
                 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="h-px bg-slate-200 dark:bg-slate-700/50 w-full" />
            {/* Narasi Aplikasi */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Narasi / Deskripsi Singkat</h2>
                <p className="text-sm text-slate-500">Slogan atau deskripsi singkat untuk keperluan informasi publik atau beranda.</p>
              </div>
              <textarea 
                 value={appDescription} 
                 onChange={(e) => setAppDescription(e.target.value)} 
                 rows={3}
                 placeholder="Misal: Platform Edukasi dan Manajemen Sekolah Berbasis Digital terintegrasi."
                 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 dark:text-slate-100 resize-none"
              />
            </div>
            <div className="h-px bg-slate-200 dark:bg-slate-700/50 w-full" />
            {/* Akses Login Administrator */}
            <div className="space-y-4">
               <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Akses Login Administrator</h2>
                  <p className="text-sm text-slate-500">Ubah kredensial utama untuk login sebagai Admin.</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Username Admin</label>
                     <input 
                       type="text" 
                       value={adminUsername} 
                       onChange={(e) => setAdminUsername(e.target.value)} 
                       placeholder="Masukkan Username Admin"
                       className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 dark:text-slate-100"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Password Admin</label>
                     <input 
                       type="password" 
                       value={adminPassword} 
                       onChange={(e) => setAdminPassword(e.target.value)} 
                       placeholder="Masukkan Password Admin"
                       className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 dark:text-slate-100"
                     />
                  </div>
               </div>
            </div>
            <div className="pt-4 flex justify-end">
               <button 
                 onClick={handleSave} 
                 className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
               >
                  <Save className="w-5 h-5" />
                  Simpan Perubahan
               </button>
            </div>
        </div>
    </div>
  );
}
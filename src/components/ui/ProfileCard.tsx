import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppContext } from '../../AppContext';
import { ROLE_NAMES } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserIcon, Mail, ShieldCheck, ChevronLeft } from 'lucide-react';
export function ProfileCard() {
  const { user, settings, showNotification } = useAppContext();
  const identity = settings.appIdentity || {};
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const handleEditClick = () => {
    setEditForm({
      photoUrl: profileData?.photoUrl || '',
      phoneWA: profileData?.phoneWA || '',
      email: profileData?.email || '',
      address: profileData?.address || ''
    });
    setIsEditing(true);
  };
  const handleSaveProfile = () => {
    let storageKey = '';
    if (user.role === 'siswa') storageKey = 'sd_db_siswa';
    else if (user.role === 'guru') storageKey = 'sd_db_guru';
    else if (user.role === 'tendik') storageKey = 'sd_db_tenaga_pendidik';
    else if (user.role === 'ortu') storageKey = 'sd_db_ortu';
    else if (user.role === 'mitra') storageKey = 'sd_db_mitra';
    if (storageKey && profileData) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        let arr = JSON.parse(saved);
        const newData = { ...profileData, ...editForm };
        arr = arr.map((item: any) => item.id === profileData.id ? newData : item);
        localStorage.setItem(storageKey, JSON.stringify(arr));
        setProfileData(newData);
      }
    }
    
    // Simulate notifying admin by updating localStorage
    const notifications = JSON.parse(localStorage.getItem('sd_notifications') || '[]');
    notifications.push({
      id: Date.now().toString(),
      title: 'Pembaruan Profil',
      message: `${user.name} (${user.role}) telah memperbarui data profilnya (Foto, WA, Email, Alamat).`,
      date: new Date().toISOString(),
      read: false
    });
    localStorage.setItem('sd_notifications', JSON.stringify(notifications));
    setIsEditing(false);
    showNotification('Profil berhasil diperbarui dan diinformasikan ke Admin.', 'success');
  };
  useEffect(() => {
    if (!user) return;
    
    let storageKey = '';
    if (user.role === 'admin') return; 
    
    if (user.role === 'siswa') storageKey = 'sd_db_siswa';
    else if (user.role === 'guru') storageKey = 'sd_db_guru';
    else if (user.role === 'tendik') storageKey = 'sd_db_tenaga_pendidik';
    else if (user.role === 'ortu') storageKey = 'sd_db_ortu';
    else if (user.role === 'mitra') storageKey = 'sd_db_mitra';
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const arr = JSON.parse(saved);
          // Match by id primarily (since we pass id now), fallback to username
          const found = arr.find((item: any) => item.id === user.id || item.username?.toLowerCase() === user.name.replace(/\s+/g, '').toLowerCase());
          if (found) {
            setProfileData(found);
          } else {
            setProfileData(null);
          }
        }
      } catch (e) {}
    }
  }, [user, isModalOpen]);
  if (!user) return null;
  const displayPhoto = profileData?.photoUrl || user.photoUrl;
  const displayName = profileData?.fullName || user.name;
  const displayEmail = profileData?.email || `${user.id.toLowerCase()}@sekolah.id`;
  const displayExtra = profileData?.nisn || profileData?.nik || profileData?.nuptk || user.id;
  return (
    <>
      <div className="w-full">
        <div 
          onClick={() => setIsModalOpen(true)}
          className="w-full lg:h-64 sm:h-56 h-auto min-h-[14rem] bg-gradient-to-br from-indigo-600/90 via-blue-600/90 to-purple-700/90 backdrop-blur-2xl rounded-2xl shadow-[0_8px_32px_rgba(79,70,229,0.3)] dark:shadow-[0_8px_32px_rgba(79,70,229,0.15)] hover:shadow-[0_16px_48px_rgba(79,70,229,0.5)] dark:hover:shadow-[0_16px_48px_rgba(79,70,229,0.25)] relative overflow-hidden p-6 sm:p-8 flex flex-col justify-between text-white border border-white/20 hover:-translate-y-1 cursor-pointer transition-all duration-500 group"
        >
          {/* Glass Background Accents */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl transition-transform duration-700 group-hover:scale-110"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl transition-transform duration-700 group-hover:scale-110 group-hover:bg-indigo-300/30"></div>
          
          <div className="flex justify-between items-start z-10 mb-4 sm:mb-0">
            <div>
              <p className="text-[10px] uppercase tracking-widest opacity-80 font-semibold mb-1 group-hover:opacity-100 transition-opacity">Aplikasi {identity.appName || 'Sekolah Digital'}</p>
              <h2 className="text-lg font-bold group-hover:tracking-wide transition-all duration-300">KARTU IDENTITAS DIGITAL</h2>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-2xl transform-gpu border border-white/20 overflow-hidden shrink-0 ml-4 group-hover:ring-4 group-hover:ring-white/20 transition-all duration-300">
               {displayPhoto ? (
                 <img src={displayPhoto} alt={displayName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
               ) : (
                  <span className="font-bold text-lg">{displayName.charAt(0).toUpperCase()}</span>
               )}
            </div>
          </div>
          <div className="z-10">
            <p className="text-[10px] uppercase tracking-[0.2em] opacity-70 mb-1 group-hover:opacity-100 transition-opacity">Nama Pengguna</p>
            <div className="flex justify-between items-end mb-4">
              <p className="text-2xl font-medium tracking-tight group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all">{displayName}</p>
              {['siswa', 'guru', 'tendik', 'ortu', 'mitra'].includes(user.role) && (
                <div className="flex items-center space-x-1.5 bg-yellow-500/20 px-3 py-1.5 rounded-full border border-yellow-400/30 backdrop-blur-sm transform-gpu shadow-[0_0_15px_rgba(234,179,8,0.2)] group-hover:bg-yellow-500/30 group-hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all">
                  <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-yellow-900 shadow-inner">
                    <span className="text-[10px] font-bold">Rp</span>
                  </div>
                  <span className="font-bold text-yellow-100 tracking-wide">
                    {(() => {
                      try {
                         const topups = JSON.parse(localStorage.getItem('sd_topup_koin_list') || '[]');
                         let total = 0;
                         // Match topups targeted to this user
                         topups.forEach((t: any) => {
                            if (t.siswa && (t.siswa.id === user.id || t.siswa.id === profileData?.id || t.siswa.nisn === profileData?.nisn)) {
                               total += parseInt(t.nominal) || 0;
                            }
                         });
                         // Also consider pengeluaran or if they spend it, but user specifically asked top up goes to balance. Let's just track total inputs for now, or look for actual balance.
                         return total.toLocaleString('id-ID');
                      } catch {
                         return '0';
                      }
                    })()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] opacity-70 mb-1 group-hover:opacity-100 transition-opacity">Nomor ID / NISN / NIK</p>
                <p className="font-mono text-xl tracking-widest">{displayExtra}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest opacity-70 group-hover:opacity-100 transition-opacity">Peran</p>
                <p className="font-bold bg-white/10 px-2 py-0.5 rounded backdrop-blur-sm transform-gpu border border-white/10 group-hover:bg-white/20 transition-colors">{ROLE_NAMES[user.role].toUpperCase()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 25, mass: 0.8 }}
                className="relative bg-white dark:bg-slate-900 w-full h-full flex flex-col overflow-y-auto z-10 transition-colors duration-500"
              >
              <div className="relative z-10 h-32 sm:h-48 bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 flex justify-between items-start p-4 pt-6 sm:pt-6 shrink-0">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center backdrop-blur-2xl transform-gpu transition-colors outline-none cursor-pointer z-10"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </div>
              <div className="relative z-10 px-6 sm:px-10 pb-12 pt-0 w-full flex-1 bg-white dark:bg-slate-900 sm:-mt-12 transition-colors duration-500">
                <div className="w-28 h-28 sm:w-32 sm:h-32 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg mx-auto sm:mx-0 -mt-14 sm:mt-0 border-4 border-white dark:border-slate-800 overflow-hidden relative z-20 transition-colors duration-500">
                   {displayPhoto ? (
                     <img src={displayPhoto} alt={displayName} className="w-full h-full object-cover" />
                   ) : (
                      <span className="font-bold text-5xl text-indigo-600 dark:text-indigo-400">{displayName.charAt(0).toUpperCase()}</span>
                   )}
                </div>
                
                <div className="text-center sm:text-left mt-4 sm:ml-40 sm:-mt-24 pb-6 flex flex-col sm:flex-row justify-between items-center sm:items-end">
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white tracking-tight drop-shadow-sm transition-colors duration-500">{displayName}</h3>
                    <div className="flex justify-center sm:justify-start items-center space-x-1.5 mt-1 text-indigo-600 dark:text-indigo-400 transition-colors duration-500">
                      <ShieldCheck className="w-5 h-5" />
                      <p className="font-semibold tracking-wide uppercase">{ROLE_NAMES[user.role]}</p>
                    </div>
                  </div>
                  {profileData && user.role !== 'admin' && !isEditing && (
                    <button onClick={handleEditClick} className="mt-4 sm:mt-0 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400 font-bold text-sm rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all">
                      Edit Profil
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-8 sm:mt-12">
                  {isEditing ? (
                    <div className="bg-white/70 dark:bg-slate-800/80 backdrop-blur-2xl border border-white/20 dark:border-white/20 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 uppercase tracking-wide">Edit Profil</h4>
                      
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Upload Foto Profil</label>
                        {editForm.photoUrl && <img src={editForm.photoUrl} alt="Preview" className="w-20 h-20 object-cover rounded-xl shadow-sm" />}
                        <input type="file" accept="image/*" onChange={(e)=>{
                           const file = e.target.files?.[0];
                           if(file) {
                             const reader = new FileReader();
                             reader.onloadend = () => setEditForm({...editForm, photoUrl: reader.result});
                             reader.readAsDataURL(file);
                           }
                        }} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100" />
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Nomor Telpon (WA)</label>
                        <input type="text" value={editForm.phoneWA} onChange={(e) => setEditForm({...editForm, phoneWA: e.target.value})} className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Email</label>
                        <input type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Alamat Rumah</label>
                        <textarea value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white min-h-[80px]"></textarea>
                      </div>
                      <div className="flex gap-3 justify-end mt-4">
                        <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 rounded-xl font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors">Batal</button>
                        <button onClick={handleSaveProfile} className="px-5 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition-colors">Simpan Profil</button>
                      </div>
                    </div>
                  ) : profileData ? (
                    (() => {
                      const categories: Record<string, [string, any][]> = {
                        'Informasi Akun': [],
                        'Informasi Pribadi': [],
                        'Informasi Akademik & Pekerjaan': [],
                        'Informasi Kontak': [],
                        'Informasi Lainnya': []
                      };
                      const akuns = ['username', 'password', 'role'];
                      const priba = ['fullName', 'gender', 'religion', 'parentName', 'studentName', 'relationship', 'lastEducation', 'picName'];
                      const ident = ['nisn', 'nik', 'nuptk', 'class', 'homeroomTeacher', 'position', 'subject', 'status', 'job', 'companyName', 'cooperationType'];
                      const knta = ['phoneWA', 'email', 'address'];
                      const ignore = ['id', 'photoUrl', 'createdAt', 'updatedAt'];
                      Object.entries(profileData).forEach(([key, value]) => {
                        if (ignore.includes(key)) return;
                        if (akuns.includes(key)) categories['Informasi Akun'].push([key, value]);
                        else if (priba.includes(key)) categories['Informasi Pribadi'].push([key, value]);
                        else if (ident.includes(key)) categories['Informasi Akademik & Pekerjaan'].push([key, value]);
                        else if (knta.includes(key)) categories['Informasi Kontak'].push([key, value]);
                        else categories['Informasi Lainnya'].push([key, value]);
                      });
                      const FIELD_LABELS: Record<string, string> = {
                        fullName: 'Nama Lengkap',
                        username: 'Username',
                        password: 'Password',
                        role: 'Peran',
                        nisn: 'NIS/NISN',
                        class: 'Kelas',
                        homeroomTeacher: 'Nama Wali Kelas',
                        phoneWA: 'Nomor Telpon (WA)',
                        email: 'Email',
                        gender: 'Jenis Kelamin',
                        religion: 'Agama',
                        parentName: 'Nama Orang Tua',
                        address: 'Alamat Rumah',
                        nuptk: 'NIP/NUPTK',
                        position: 'Jabatan',
                        subject: 'Mata Pelajaran',
                        status: 'Status',
                        lastEducation: 'Pendidikan Terakhir',
                        nik: 'NIK',
                        studentName: 'Nama Siswa',
                        relationship: 'Hubungan dengan Siswa',
                        job: 'Pekerjaan',
                        companyName: 'Nama Perusahaan/Instansi',
                        picName: 'Nama PIC',
                        cooperationType: 'Jenis Kerjasama',
                      };
                      return Object.entries(categories)
                        .filter(([_, items]) => items.length > 0)
                        .map(([categoryName, items]) => (
                          <div key={categoryName} className="flex flex-col gap-3">
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 uppercase tracking-wide">
                              {categoryName}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                              {items.map(([key, value]) => {
                                const label = FIELD_LABELS[key] || key
                                  .replace(/([A-Z])/g, ' $1')
                                  .replace(/^./, (str) => str.toUpperCase());
                                  
                                return (
                                  <div key={key} className="bg-white/70 dark:bg-slate-800/80 backdrop-blur-2xl border border-white/20 dark:border-white/20 rounded-2xl p-4 text-left shadow-sm transition-colors duration-500">
                                    <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 mb-2">
                                       <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                       <span className="text-[10px] uppercase tracking-wider font-bold">{label}</span>
                                    </div>
                                    <p className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate">{String(value || '-')}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                      ));
                    })()
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-white/70 dark:bg-slate-800/80 backdrop-blur-2xl border border-white/20 dark:border-white/20 rounded-2xl p-4 text-left shadow-sm">
                        <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 mb-2">
                           <UserIcon className="w-4 h-4" />
                           <span className="text-[10px] uppercase tracking-wider font-bold">Nomor ID</span>
                        </div>
                        <p className="font-mono font-medium text-slate-800 dark:text-slate-200 text-sm truncate">{displayExtra}</p>
                      </div>
                      <div className="bg-white/70 dark:bg-slate-800/80 backdrop-blur-2xl border border-white/20 dark:border-white/20 rounded-2xl p-4 text-left shadow-sm">
                        <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 mb-2">
                           <Mail className="w-4 h-4" />
                           <span className="text-[10px] uppercase tracking-wider font-bold">Email</span>
                        </div>
                        <p className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate">{displayEmail}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-6 italic">
                  * Data lengkap disinkronisasi oleh Administrator sistem.
                </p>
              </div>
            </motion.div>
          </div>
        )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
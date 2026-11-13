import { useState, useEffect } from 'react';
import { UserCog, Plus, Trash2, X, ShieldCheck } from 'lucide-react';
import { useAppContext } from '../../AppContext';
import { NAV_ITEMS } from '../../lib/navItems';
// Define structures
interface SubAdminConfig {
  id: string; // Unique ID
  name: string;
  role: string; // 'Guru' | 'Tenaga Pendidik'
  allowedMenus: string[];
}
export function PengaturanSubAdmin() {
  const { showNotification } = useAppContext();
  const [subAdmins, setSubAdmins] = useState<SubAdminConfig[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedName, setSelectedName] = useState<string>('');
  const [selectedRoleType, setSelectedRoleType] = useState<string>('Guru');
  const [selectedMenus, setSelectedMenus] = useState<string[]>([]);
  // Dummy users from DB
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  useEffect(() => {
    const loadData = () => {
    const saved = localStorage.getItem('sd_sub_admins');
    if (saved) {
      setSubAdmins(JSON.parse(saved));
    }
  };
    loadData();
    window.addEventListener('localStorageUpdate', loadData);
    return () => window.removeEventListener('localStorageUpdate', loadData);
  }, []);
  useEffect(() => {
    // Load users based on selectedRoleType
    try {
      const dbKey = selectedRoleType === 'Guru' ? 'sd_db_guru' : 'sd_db_tendik';
      const users = JSON.parse(localStorage.getItem(dbKey) || '[]');
      setAvailableUsers(users);
      setSelectedUser('');
      setSelectedName('');
    } catch (e) {
      setAvailableUsers([]);
    }
  }, [selectedRoleType]);
  const adminMenus = NAV_ITEMS.filter(m => m.roles.includes('admin') && m.id !== 'Pengaturan Sub Admin' && m.id !== 'Beranda' && m.category);
  
  // Group by category
  const groupedMenus = adminMenus.reduce((acc, menu) => {
    const cat = menu.category || 'Lainnya';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(menu);
    return acc;
  }, {} as Record<string, typeof adminMenus>);
  const handleSaveSubAdmin = () => {
    if (!selectedUser && !selectedName) {
      showNotification('Pilih pengguna terlebih dahulu');
      return;
    }
    
    // Allow saving custom name if user not in list (for UX completeness)
    const nameToSave = selectedName || selectedUser;
    
    if (selectedMenus.length === 0) {
      showNotification('Pilih setidaknya satu menu yang diizinkan');
      return;
    }
    const newSub: SubAdminConfig = {
      id: selectedUser || nameToSave,
      name: nameToSave,
      role: selectedRoleType,
      allowedMenus: selectedMenus
    };
    const existingIndex = subAdmins.findIndex(s => s.id === newSub.id);
    let updated;
    if (existingIndex >= 0) {
       updated = [...subAdmins];
       updated[existingIndex] = newSub;
    } else {
       updated = [...subAdmins, newSub];
    }
    setSubAdmins(updated);
    localStorage.setItem('sd_sub_admins', JSON.stringify(updated));
    showNotification(`Sub admin ${newSub.name} berhasil disimpan`);
    setIsAdding(false);
    setSelectedUser('');
    setSelectedName('');
    setSelectedMenus([]);
  };
  const handleRemove = (id: string, name: string) => {
    if (window.confirm(`Yakin ingin menghapus hak akses untuk ${name}?`)) {
      const updated = subAdmins.filter(s => s.id !== id);
      setSubAdmins(updated);
      localStorage.setItem('sd_sub_admins', JSON.stringify(updated));
      showNotification('Sub admin berhasil dihapus');
    }
  };
  const handleToggleMenu = (menuId: string) => {
    setSelectedMenus(prev => 
      prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
    );
  };
  const handleSelectAllCategory = (categoryMenus: any[], isChecked: boolean) => {
    const ids = categoryMenus.map(m => m.id);
    if (isChecked) {
      setSelectedMenus(prev => [...new Set([...prev, ...ids])]);
    } else {
      setSelectedMenus(prev => prev.filter(id => !ids.includes(id)));
    }
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full pb-32">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-sky-600 rounded-xl text-white">
              <UserCog className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                Pengaturan Sub Admin
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Beri hak akses menu Admin kepada Guru dan Tenaga Pendidik.
              </p>
            </div>
          </div>
          {!isAdding && (
            <button 
              onClick={() => { setIsAdding(true); setSelectedMenus([]); setSelectedUser(''); setSelectedName(''); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Tambah Sub Admin</span>
            </button>
          )}
        </div>
        {isAdding ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700/50 mb-8 relative overflow-hidden">
             
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-500" />
                  Konfigurasi Hak Akses Sub Admin
                </h2>
                <button 
                  onClick={() => setIsAdding(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2"
                >
                  <X className="w-5 h-5" />
                </button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                   <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tipe Pengguna</label>
                   <select 
                     value={selectedRoleType} 
                     onChange={(e) => setSelectedRoleType(e.target.value)}
                     className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 dark:text-slate-100"
                   >
                     <option value="Guru">Guru</option>
                     <option value="Tenaga Pendidik">Tenaga Pendidik / Admin</option>
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Pilih Pengguna</label>
                   <select 
                     value={selectedUser} 
                     onChange={(e) => {
                       setSelectedUser(e.target.value);
                       const user = availableUsers.find(u => (u.nip || u.nik || u.id) === e.target.value || u.fullName === e.target.value);
                       setSelectedName(user ? user.fullName : e.target.value);
                     }}
                     className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 dark:text-slate-100 mb-2"
                   >
                     <option value="">-- Pilih {selectedRoleType} --</option>
                     {availableUsers.map((u, i) => {
                       const id = u.nip || u.nik || u.id || `temp-${i}`;
                       return (
                         <option key={id} value={id}>{u.fullName || 'Tanpa Nama'}</option>
                       );
                     })}
                     <option value="user_custom">Input Manual (Tidak ada di database)</option>
                   </select>
                   {selectedUser === 'user_custom' && (
                     <input 
                       type="text" 
                       placeholder="Masukkan Nama Lengkap Pengguna"
                       value={selectedName}
                       onChange={(e) => setSelectedName(e.target.value)}
                       className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 dark:text-slate-100"
                     />
                   )}
                </div>
             </div>
             <div className="mb-6">
                <h3 className="text-md font-bold text-slate-800 dark:text-slate-100 mb-4">Pilih Hak Akses Menu Admin</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {Object.entries(groupedMenus).map(([category, menus]) => {
                     const allInCategorySelected = menus.length > 0 && menus.every(m => selectedMenus.includes(m.id));
                     
                     return (
                       <div key={category} className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
                          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                             <span className="font-bold text-slate-700 dark:text-slate-300">{category}</span>
                             <label className="flex items-center gap-2 cursor-pointer">
                               <input 
                                 type="checkbox" 
                                 checked={allInCategorySelected}
                                 onChange={(e) => handleSelectAllCategory(menus, e.target.checked)}
                                 className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                               />
                               <span className="text-xs font-semibold text-slate-500">Pilih Semua</span>
                             </label>
                          </div>
                          <div className="space-y-3">
                             {menus.map(menu => (
                               <label key={menu.id} className="flex items-center gap-3 cursor-pointer group">
                                 <input 
                                   type="checkbox" 
                                   checked={selectedMenus.includes(menu.id)}
                                   onChange={() => handleToggleMenu(menu.id)}
                                   className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-1" 
                                 />
                                 <div className="flex items-center gap-3 w-full p-2 rounded-lg group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors">
                                    <div className={`p-1.5 rounded-md text-white ${menu.iconBg}`}>
                                      <menu.icon className="w-4 h-4" />
                                    </div>
                                    <span className={`text-sm font-medium ${selectedMenus.includes(menu.id) ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
                                      {menu.label}
                                    </span>
                                 </div>
                               </label>
                             ))}
                          </div>
                       </div>
                     );
                  })}
                </div>
             </div>
             <div className="flex justify-end pt-6 border-t border-slate-100 dark:border-slate-700">
               <button 
                 onClick={handleSaveSubAdmin}
                 className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-sm"
               >
                 Simpan Konfigurasi
               </button>
             </div>
          </div>
        ) : null}
        {/* Existing Sub Admins */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Daftar Sub Admin Aktif</h2>
          
          {subAdmins.length === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
              <ShieldCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Belum ada Sub Admin yang dikonfigurasi</p>
              <p className="text-sm text-slate-400 mt-1">Tambahkan Guru atau Tenaga Pendidik untuk memberi mereka akses menu Admin tertentu.</p>
            </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
               {subAdmins.map((sub, idx) => (
                 <div key={idx} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                         <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-full flex items-center justify-center font-bold text-xl uppercase shrink-0 border-2 border-white dark:border-slate-800 shadow-sm">
                              {sub.name ? sub.name.substring(0, 2) : 'SB'}
                            </div>
                            <div>
                               <h3 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-1" title={sub.name}>{sub.name}</h3>
                               <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 mt-1 inline-block">
                                 {sub.role}
                               </span>
                            </div>
                         </div>
                         <button 
                           onClick={() => handleRemove(sub.id, sub.name)}
                           className="text-rose-500 hover:text-rose-600 p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors shrink-0"
                           title="Hapus Hak Akses"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                      <div className="space-y-2 mb-4">
                         <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Akses Menu ({sub.allowedMenus.length})</p>
                         <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                            {sub.allowedMenus.map(menuId => {
                               const menuDef = NAV_ITEMS.find(m => m.id === menuId);
                               return menuDef ? (
                                 <span key={menuId} className="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md mb-1">
                                    <menuDef.icon className="w-3 h-3 text-indigo-500" /> {menuDef.label}
                                 </span>
                               ) : null;
                            })}
                         </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                       <button
                         onClick={() => {
                           setSelectedUser(sub.id);
                           setSelectedName(sub.name);
                           setSelectedRoleType(sub.role);
                           setSelectedMenus(sub.allowedMenus);
                           setIsAdding(true);
                           window.scrollTo({ top: 0, behavior: 'smooth' });
                         }}
                         className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-900 text-sm font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 py-2.5 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
                       >
                         Edit Hak Akses
                       </button>
                    </div>
                 </div>
               ))}
             </div>
          )}
        </div>
    </div>
  );
}
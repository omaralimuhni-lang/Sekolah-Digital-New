import { useState, useEffect } from 'react';
import { AppWindow, Search, Edit2, Trash2, Eye, X, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../../AppContext';
export const KelasGuru = () => {
  const { user, showNotification } = useAppContext();
  const [activeTab, setActiveTab] = useState<'wali_kelas' | 'mata_pelajaran'>('wali_kelas');
  const [siswaList, setSiswaList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [viewData, setViewData] = useState<any>(null);
  
  // To determine which classes the guru teaches
  const [kelasAjar, setKelasAjar] = useState<string[]>([]);
  useEffect(() => {
    // 1. Load siswa from local storage
    const storedSiswa = JSON.parse(localStorage.getItem('sd_db_siswa') || '[]');
    setSiswaList(storedSiswa);
    // 2. Load jadwal to find which classes this guru teaches
    const storedJadwal = JSON.parse(localStorage.getItem('sd_jadwal_siswa') || '[]');
    if (user?.name) {
      const gClasses = Array.from(new Set(
        storedJadwal
          .filter((j: any) => j.guruInput?.toLowerCase() === user.name.toLowerCase() || j.guruInput === '') // fallback to all if empty maybe?
          .map((j: any) => j.kelas)
      )) as string[];
      setKelasAjar(gClasses);
    }
  }, [user]);
  // Filtering logic
  const filteredList = siswaList.filter(s => {
    // 1. Search Query
    const searchMatch = 
      (s.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (s.nisn || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.class || '').toLowerCase().includes(searchQuery.toLowerCase());
      
    if (!searchMatch) return false;
    // 2. Tab filtering
    if (activeTab === 'wali_kelas') {
      return (s.homeroomTeacher || '').toLowerCase() === (user?.name || '').toLowerCase();
    } else {
      // 'mata_pelajaran' => siswas that are in `kelasAjar`
      // If guru doesn't have classes in jadwal, we might show nothing. Let's at least show those matching class
      return kelasAjar.includes(s.class);
    }
  });
  const handleDelete = (id: string) => {
    if (window.confirm('Hapus data siswa ini? Semua data terkait (nilai, dll) mungkin ikut terpengaruh.')) {
      const updated = siswaList.filter(s => s.id !== id);
      setSiswaList(updated);
      localStorage.setItem('sd_db_siswa', JSON.stringify(updated));
      showNotification('Siswa berhasil dihapus dari database', 'success');
    }
  };
  const handleEdit = (data: any) => {
    setEditData({ ...data });
    setIsModalOpen(true);
  };
  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData) return;
    
    // Update logic
    const updatedList = siswaList.map(s => s.id === editData.id ? editData : s);
    setSiswaList(updatedList);
    localStorage.setItem('sd_db_siswa', JSON.stringify(updatedList));
    showNotification('Data siswa berhasil diperbarui', 'success');
    setIsModalOpen(false);
  };
  // Shared inputs for editing
  const renderInput = (label: string, field: string, type = 'text') => {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
        <input
          type={type}
          value={editData?.[field] || ''}
          onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
          className="w-full px-4 py-2.5 sm:py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
    );
  };
  return (
    <div className="max-w-7xl mx-auto pb-24 lg:pb-12 space-y-6 mt-6">
      
      {/* Header Info */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-5">
           <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 text-blue-600 rounded-2xl flex items-center justify-center">
             <AppWindow className="w-8 h-8" />
           </div>
           <div>
             <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Kelas Guru</h1>
             <p className="text-slate-500 dark:text-slate-400">Database Siswa Wali Kelas & Mata Pelajaran</p>
           </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl overflow-x-auto no-scrollbar max-w-fit">
         <button 
           onClick={() => setActiveTab('wali_kelas')}
           className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${activeTab === 'wali_kelas' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}
         >
           <Users className="w-4 h-4" />
           Siswa Wali Kelas
         </button>
         <button 
           onClick={() => setActiveTab('mata_pelajaran')}
           className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${activeTab === 'mata_pelajaran' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}
         >
           <AppWindow className="w-4 h-4" />
           Siswa Mata Pelajaran
         </button>
      </div>
      {/* Content Lists */}
      <div className="space-y-6">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Cari berdasarkan nama, NISN, atau kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
          />
          <Search className="w-6 h-6 text-slate-400 absolute left-4 top-4" />
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700/50">
                  <th className="pb-4 font-semibold text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">Nama Siswa</th>
                  <th className="pb-4 font-semibold text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">Kelas</th>
                  <th className="pb-4 font-semibold text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">NISN</th>
                  <th className="pb-4 font-semibold text-slate-500 dark:text-slate-400 text-sm">Wali Kelas</th>
                  <th className="pb-4 font-semibold text-slate-500 dark:text-slate-400 text-sm text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length > 0 ? filteredList.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 text-slate-800 dark:text-slate-200 font-medium">
                        {item.fullName}
                    </td>
                    <td className="py-4 text-slate-600 dark:text-slate-400">
                        {item.class || '-'}
                    </td>
                    <td className="py-4 text-slate-600 dark:text-slate-400">
                        {item.nisn || '-'}
                    </td>
                    <td className="py-4 text-slate-600 dark:text-slate-400">
                        {item.homeroomTeacher || '-'}
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setViewData(item); setIsViewModalOpen(true); }} className="p-2 bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-900/30 dark:text-slate-400 dark:hover:text-emerald-400 rounded-lg transition-colors" title="Lihat">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEdit(item)} className="p-2 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-blue-900/30 dark:text-slate-400 dark:hover:text-blue-400 rounded-lg transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-900/30 dark:text-slate-400 dark:hover:text-red-400 rounded-lg transition-colors" title="Hapus">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-500 dark:text-slate-400">
                        {activeTab === 'wali_kelas' 
                            ? (user?.name ? `Belum ada siswa yang ditetapkan sebagai siswa perwalian untuk guru ${user.name}. Pastikan Field "Nama Wali Kelas" pada profil siswa sesuai.` : 'Belum ada data siswa perwalian.') 
                            : 'Belum ada siswa pada mata pelajaran yang Anda ampu.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Edit Modal */}
      <AnimatePresence>
        {isModalOpen && editData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Edit Data Siswa</h2>
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <form id="editForm" onSubmit={saveEdit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {renderInput('Nama Lengkap', 'fullName')}
                  {renderInput('Nomor Induk (NIS/NISN)', 'nisn')}
                  {renderInput('Kelas', 'class')}
                  {renderInput('Username (Login)', 'username')}
                  {renderInput('Wali Kelas', 'homeroomTeacher')}
                  {renderInput('Nomor Telpon (WA)', 'phoneWA')}
                  {renderInput('Email', 'email', 'email')}
                  {renderInput('Jenis Kelamin', 'gender')}
                  {renderInput('Agama', 'religion')}
                  {renderInput('Nama Orang Tua', 'parentName')}
                  <div className="sm:col-span-2">
                     {renderInput('Alamat Rumah', 'address')}
                  </div>
                </form>
              </div>
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 shrink-0">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-3 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">Batal</button>
                 <button type="submit" form="editForm" className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/20">Simpan Perubahan</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* View Modal */}
      <AnimatePresence>
        {isViewModalOpen && viewData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsViewModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-lg overflow-hidden z-10 flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-blue-500 text-white shrink-0">
                <h2 className="text-xl font-bold flex items-center gap-2">Detail Siswa</h2>
                <button onClick={() => setIsViewModalOpen(false)} className="p-2 text-white/80 hover:bg-white/20 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-4">
                <div className="flex flex-col items-center mb-6">
                    <img 
                      src={viewData.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(viewData.fullName || 'User')}&background=0D8ABC&color=fff`}
                      alt="Profile"
                      className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-800 shadow-sm object-cover"
                      onError={(e) => {
                         const target = e.target as HTMLImageElement;
                         target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(viewData.fullName || 'User')}&background=0D8ABC&color=fff`;
                      }}
                    />
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mt-4 text-center">{viewData.fullName}</h3>
                    <p className="text-slate-500 dark:text-slate-400">{viewData.nisn} • {viewData.class}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div>
                       <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Username</div>
                       <div className="font-medium text-slate-800 dark:text-slate-200">{viewData.username || '-'}</div>
                   </div>
                   <div>
                       <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Wali Kelas</div>
                       <div className="font-medium text-slate-800 dark:text-slate-200">{viewData.homeroomTeacher || '-'}</div>
                   </div>
                   <div>
                       <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Telepon (WA)</div>
                       <div className="font-medium text-slate-800 dark:text-slate-200">{viewData.phoneWA || '-'}</div>
                   </div>
                   <div>
                       <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Email</div>
                       <div className="font-medium text-slate-800 dark:text-slate-200">{viewData.email || '-'}</div>
                   </div>
                   <div>
                       <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Jenis Kelamin</div>
                       <div className="font-medium text-slate-800 dark:text-slate-200">{viewData.gender || '-'}</div>
                   </div>
                   <div>
                       <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Agama</div>
                       <div className="font-medium text-slate-800 dark:text-slate-200">{viewData.religion || '-'}</div>
                   </div>
                   <div className="col-span-2">
                       <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Nama Orang Tua</div>
                       <div className="font-medium text-slate-800 dark:text-slate-200">{viewData.parentName || '-'}</div>
                   </div>
                   <div className="col-span-2">
                       <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Alamat</div>
                       <div className="font-medium text-slate-800 dark:text-slate-200">{viewData.address || '-'}</div>
                   </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end shrink-0">
                 <button onClick={() => setIsViewModalOpen(false)} className="px-5 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-medium rounded-xl transition-colors">Tutup</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
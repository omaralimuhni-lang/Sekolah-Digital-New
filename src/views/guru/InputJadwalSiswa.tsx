import { useState, useEffect } from 'react';
import { CalendarDays, Plus, Search, Edit2, Trash2, Clock, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../../AppContext';
interface JadwalData {
  id: string;
  hari: string;
  mataPelajaran: string;
  jamMulai: string;
  jamSelesai: string;
  kelas: string;
  guruInput: string;
}
const HARI_OPTIONS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
export const InputJadwalSiswa = () => {
  const { showNotification, user } = useAppContext();
  const [jadwalList, setJadwalList] = useState<JadwalData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  // Form state
  const [hari, setHari] = useState('Senin');
  const [mataPelajaran, setMataPelajaran] = useState('');
  const [jamMulai, setJamMulai] = useState('');
  const [jamSelesai, setJamSelesai] = useState('');
  const [kelas, setKelas] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  useEffect(() => {
    const loadData = () => {
    const saved = localStorage.getItem('sd_jadwal_siswa');
    if (saved) {
      setJadwalList(JSON.parse(saved));
    }
  };
    loadData();
    window.addEventListener('localStorageUpdate', loadData);
    return () => window.removeEventListener('localStorageUpdate', loadData);
  }, []);
  const handleOpenAdd = () => {
    setEditId(null);
    setHari('Senin');
    setMataPelajaran('');
    setJamMulai('');
    setJamSelesai('');
    setKelas('');
    setIsModalOpen(true);
    setShowConfirm(false);
  };
  const handleOpenEdit = (data: JadwalData) => {
    setEditId(data.id);
    setHari(data.hari);
    setMataPelajaran(data.mataPelajaran);
    setJamMulai(data.jamMulai);
    setJamSelesai(data.jamSelesai);
    setKelas(data.kelas);
    setIsModalOpen(true);
    setShowConfirm(false);
  };
  const handleDelete = (id: string) => {
    if (window.confirm('Hapus jadwal ini?')) {
      const updated = jadwalList.filter(item => item.id !== id);
      setJadwalList(updated);
      localStorage.setItem('sd_jadwal_siswa', JSON.stringify(updated));
      showNotification('Jadwal berhasil dihapus', 'success');
    }
  };
  const saveJadwal = () => {
    if (!hari || !mataPelajaran || !jamMulai || !jamSelesai || !kelas) {
      showNotification('Harap lengkapi semua data', 'error');
      setShowConfirm(false);
      return;
    }
    let updatedList;
    if (editId) {
      updatedList = jadwalList.map(item => {
        if (item.id === editId) {
          return {
            ...item,
            hari,
            mataPelajaran,
            jamMulai,
            jamSelesai,
            kelas,
            guruInput: user?.name || ''
          };
        }
        return item;
      });
      showNotification('Jadwal berhasil diperbarui', 'success');
    } else {
      const newItem: JadwalData = {
        id: Date.now().toString(),
        hari,
        mataPelajaran,
        jamMulai,
        jamSelesai,
        kelas,
        guruInput: user?.name || ''
      };
      updatedList = [...jadwalList, newItem];
      showNotification('Jadwal berhasil disimpan', 'success');
    }
    setJadwalList(updatedList);
    localStorage.setItem('sd_jadwal_siswa', JSON.stringify(updatedList));
    setIsModalOpen(false);
  };
  const renderForm = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Hari</label>
        <select 
          value={hari} 
          onChange={(e) => setHari(e.target.value)}
          className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {HARI_OPTIONS.map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Mata Pelajaran</label>
        <input 
          type="text" 
          value={mataPelajaran} 
          onChange={(e) => setMataPelajaran(e.target.value)}
          placeholder="Cth: Matematika"
          className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Jam Mulai</label>
          <input 
            type="time" 
            value={jamMulai} 
            onChange={(e) => setJamMulai(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Jam Selesai</label>
          <input 
            type="time" 
            value={jamSelesai} 
            onChange={(e) => setJamSelesai(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Kelas</label>
        <input 
          type="text" 
          value={kelas} 
          onChange={(e) => setKelas(e.target.value)}
          placeholder="Cth: Kelas 10A"
          className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
    </div>
  );
  const filteredJadwal = jadwalList.filter(item => 
    item.mataPelajaran.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.hari.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.kelas.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <div className="max-w-4xl mx-auto pb-20 lg:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden h-40 sm:h-48 flex flex-col justify-end mb-6 mt-6">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
         <div className="absolute bottom-0 right-10 opacity-20 pointer-events-none transform translate-y-1/4 right-0 rotate-[-15deg]">
            <CalendarDays className="w-48 h-48 sm:w-64 sm:h-64" />
         </div>
         
         <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
           <div>
             <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">Input Jadwal Siswa</h1>
             <p className="text-blue-100 font-medium text-sm sm:text-base max-w-sm sm:max-w-md">Atur jadwal pelajaran siswa (Role Guru).</p>
           </div>
           <button
             onClick={handleOpenAdd}
             className="flex items-center justify-center gap-2 bg-white text-blue-600 hover:bg-slate-50 px-5 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-lg"
           >
             <Plus className="w-5 h-5" />
             <span>Tambah Jadwal</span>
           </button>
         </div>
      </div>
      {/* Main Content */}
      <div className="space-y-6">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Cari mata pelajaran, hari, atau kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
          />
          <Search className="w-6 h-6 text-slate-400 absolute left-4 top-4" />
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700/50">
                  <th className="pb-4 font-semibold text-slate-500 dark:text-slate-400 text-sm">Hari</th>
                  <th className="pb-4 font-semibold text-slate-500 dark:text-slate-400 text-sm">Waktu</th>
                  <th className="pb-4 font-semibold text-slate-500 dark:text-slate-400 text-sm">Mata Pelajaran</th>
                  <th className="pb-4 font-semibold text-slate-500 dark:text-slate-400 text-sm">Kelas</th>
                  <th className="pb-4 font-semibold text-slate-500 dark:text-slate-400 text-sm text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredJadwal.length > 0 ? filteredJadwal.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 font-medium text-slate-800 dark:text-slate-300">{item.hari}</td>
                    <td className="py-4 text-slate-600 dark:text-slate-400">
                       <span className="flex items-center gap-1.5"><Clock className="w-4 h-4"/> {item.jamMulai} - {item.jamSelesai}</span>
                    </td>
                    <td className="py-4 text-slate-800 dark:text-slate-200 font-medium">{item.mataPelajaran}</td>
                    <td className="py-4 text-slate-600 dark:text-slate-400">{item.kelas}</td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenEdit(item)} className="p-2 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-blue-900/30 dark:text-slate-400 dark:hover:text-blue-400 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-900/30 dark:text-slate-400 dark:hover:text-red-400 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500 dark:text-slate-400">Belum ada jadwal yang ditambahkan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-md overflow-hidden z-10 flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{editId ? 'Edit Jadwal' : 'Tambah Jadwal'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                {!showConfirm ? renderForm() : (
                  <div className="text-center py-4 space-y-4">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 text-blue-600 mx-auto rounded-full flex items-center justify-center">
                      <AlertCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Konfirmasi Simpan</h3>
                    <p className="text-slate-500 dark:text-slate-400">Pastikan data jadwal yang Anda masukkan sudah benar.</p>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                 {!showConfirm ? (
                   <>
                     <button onClick={() => setIsModalOpen(false)} className="px-5 py-3 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">Batal</button>
                     <button onClick={() => setShowConfirm(true)} className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors">Simpan Jadwal</button>
                   </>
                 ) : (
                   <>
                     <button onClick={() => setShowConfirm(false)} className="px-5 py-3 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">Koreksi Data</button>
                     <button onClick={saveJadwal} className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors">Ya, Simpan Jadwal</button>
                   </>
                 )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
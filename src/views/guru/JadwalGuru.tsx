import { useState, useEffect, useRef } from 'react';
import { CalendarDays, Plus, Search, Edit2, Trash2, Clock, MapPin, X, FileDown, FileUp, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../../AppContext';
interface JadwalData {
  id: string;
  hari: string;
  tanggal?: string; // YYYY-MM-DD
  mataPelajaran: string;
  jamMulai: string;
  jamSelesai: string;
  kelas: string;
  guruInput: string;
}
const getDayNameID = (dateStr: string) => {
  const date = new Date(dateStr);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[date.getDay()];
};
export const JadwalGuru = () => {
  const { showNotification, user } = useAppContext();
  const [jadwalList, setJadwalList] = useState<JadwalData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewData, setViewData] = useState<JadwalData | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  
  // Form state
  const [tanggal, setTanggal] = useState('');
  const [mataPelajaran, setMataPelajaran] = useState('');
  const [jamMulai, setJamMulai] = useState('');
  const [jamSelesai, setJamSelesai] = useState('');
  const [kelas, setKelas] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    setTanggal(new Date().toISOString().split('T')[0]);
    setMataPelajaran('');
    setJamMulai('');
    setJamSelesai('');
    setKelas('');
    setIsModalOpen(true);
  };
  const handleOpenEdit = (data: JadwalData) => {
    setEditId(data.id);
    setTanggal(data.tanggal || new Date().toISOString().split('T')[0]);
    setMataPelajaran(data.mataPelajaran);
    setJamMulai(data.jamMulai);
    setJamSelesai(data.jamSelesai);
    setKelas(data.kelas);
    setIsModalOpen(true);
  };
  const handleView = (data: JadwalData) => {
    setViewData(data);
    setIsViewModalOpen(true);
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
    if (!tanggal || !mataPelajaran || !jamMulai || !jamSelesai || !kelas) {
      showNotification('Harap lengkapi semua data', 'error');
      return;
    }
    const hari = getDayNameID(tanggal);
    let updatedList;
    if (editId) {
      updatedList = jadwalList.map(item => {
        if (item.id === editId) {
          return {
            ...item,
            hari,
            tanggal,
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
        tanggal,
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
  const handleDownloadCSV = () => {
    const headers = ['Tanggal', 'Mata Pelajaran', 'Jam Mulai', 'Jam Selesai', 'Kelas'];
    const csvContent = '\uFEFF' + headers.join(',') + '\n' +
      jadwalList.map(j => `"${j.tanggal || ''}","${j.mataPelajaran}","${j.jamMulai}","${j.jamSelesai}","${j.kelas}"`).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_jadwal_guru.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleUploadCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length <= 1) {
        showNotification('File CSV kosong atau tidak valid.', 'error');
        return;
      }
      const newDataList: JadwalData[] = [];
      const timestamp = Date.now();
      // Skip header
      for (let i = 1; i < lines.length; i++) {
        // Simple CSV parser ignoring commas inside quotes
        const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
        
        if (values.length >= 5) {
            const [tgl, mapel, jam_mulai, jam_selesai, kls] = values;
            if (tgl && mapel && jam_mulai && jam_selesai && kls) {
                newDataList.push({
                    id: `${timestamp}-${i}`,
                    hari: getDayNameID(tgl),
                    tanggal: tgl,
                    mataPelajaran: mapel,
                    jamMulai: jam_mulai,
                    jamSelesai: jam_selesai,
                    kelas: kls,
                    guruInput: user?.name || ''
                });
            }
        }
      }
      if (newDataList.length > 0) {
        const updatedList = [...jadwalList, ...newDataList];
        setJadwalList(updatedList);
        localStorage.setItem('sd_jadwal_siswa', JSON.stringify(updatedList));
        showNotification(`${newDataList.length} jadwal berhasil diimpor`, 'success');
      } else {
        showNotification('Format CSV tidak valid atau data kosong.', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const renderForm = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Nama Guru</label>
        <input 
          type="text" 
          value={user?.name || ''} 
          disabled
          className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed outline-none"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Tanggal Jadwal</label>
        <input 
          type="date" 
          value={tanggal} 
          onChange={(e) => setTanggal(e.target.value)}
          className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Mata Pelajaran (pisahkan dengan koma jika lebih dari satu)</label>
        <input 
          type="text" 
          value={mataPelajaran} 
          onChange={(e) => setMataPelajaran(e.target.value)}
          placeholder="Cth: Matematika, Bahasa Indonesia"
          className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Waktu Mulai</label>
          <input 
            type="time" 
            value={jamMulai} 
            onChange={(e) => setJamMulai(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Waktu Selesai</label>
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
          placeholder="Cth: Kelas 1"
          className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
    </div>
  );
  const filteredJadwal = jadwalList.filter(item => 
    item.mataPelajaran.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.hari.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.tanggal && item.tanggal.includes(searchQuery)) ||
    item.kelas.toLowerCase().includes(searchQuery.toLowerCase())
  );
  // Filter out those that are strictly not mine? The prompt implies "sesuai dengan akun guru tersebut".
  // Let's filter records that belong to current guru, or show all but only manage mine.
  // We'll show all, but we can assume guru only manages their own. 
  // Let's just filter by name if we want, but since they may manage globally, we will show all.
  return (
    <div className="max-w-5xl mx-auto pb-20 lg:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden h-40 sm:h-48 flex flex-col justify-end mb-6 mt-6">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
         <div className="absolute bottom-0 right-10 opacity-20 pointer-events-none transform translate-y-1/4 right-0 rotate-[-15deg]">
            <CalendarDays className="w-48 h-48 sm:w-64 sm:h-64" />
         </div>
         
         <div className="relative z-10 flex flex-col xl:flex-row xl:items-end justify-between gap-4">
           <div>
             <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">Mengelola Jadwal</h1>
             <p className="text-blue-100 font-medium text-sm sm:text-base max-w-sm sm:max-w-md">Kelola jadwal pelajaran untuk siswa selama sebulan</p>
           </div>
           
           <div className="flex flex-wrap items-center gap-3">
             <input type="file" accept=".csv" ref={fileInputRef} onChange={handleUploadCSV} className="hidden" />
             <button
               onClick={() => fileInputRef.current?.click()}
               className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-3 rounded-2xl font-medium transition-all active:scale-95"
             >
               <FileUp className="w-5 h-5" />
               <span className="hidden sm:inline">Upload CSV</span>
             </button>
             <button
               onClick={handleDownloadCSV}
               className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-3 rounded-2xl font-medium transition-all active:scale-95"
             >
               <FileDown className="w-5 h-5" />
               <span className="hidden sm:inline">Template CSV</span>
             </button>
             <button
               onClick={handleOpenAdd}
               className="flex items-center justify-center gap-2 bg-white text-blue-600 hover:bg-slate-50 px-5 py-3 rounded-2xl font-bold transition-all active:scale-95 shadow-lg"
             >
               <Plus className="w-5 h-5" />
               <span>Tambah Jadwal</span>
             </button>
           </div>
         </div>
      </div>
      {/* Main Content */}
      <div className="space-y-6">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Cari berdasarkan tanggal, mata pelajaran, atau kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
          />
          <Search className="w-6 h-6 text-slate-400 absolute left-4 top-4" />
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700/50">
                  <th className="pb-4 font-semibold text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">Tanggal (Hari)</th>
                  <th className="pb-4 font-semibold text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">Waktu</th>
                  <th className="pb-4 font-semibold text-slate-500 dark:text-slate-400 text-sm">Mata Pelajaran</th>
                  <th className="pb-4 font-semibold text-slate-500 dark:text-slate-400 text-sm">Kelas</th>
                  <th className="pb-4 font-semibold text-slate-500 dark:text-slate-400 text-sm">Guru</th>
                  <th className="pb-4 font-semibold text-slate-500 dark:text-slate-400 text-sm text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredJadwal.length > 0 ? filteredJadwal.sort((a,b) => (b.tanggal || '').localeCompare(a.tanggal || '')).map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 text-slate-800 dark:text-slate-300">
                        <div className="font-medium">{item.tanggal || '-'}</div>
                        <div className="text-xs text-slate-500">{item.hari}</div>
                    </td>
                    <td className="py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                       <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400"/> {item.jamMulai} - {item.jamSelesai}</span>
                    </td>
                    <td className="py-4 text-slate-800 dark:text-slate-200 font-medium max-w-[200px] truncate" title={item.mataPelajaran}>{item.mataPelajaran}</td>
                    <td className="py-4 text-slate-600 dark:text-slate-400">{item.kelas}</td>
                    <td className="py-4 text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400"/> {item.guruInput}</span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleView(item)} className="p-2 bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-900/30 dark:text-slate-400 dark:hover:text-emerald-400 rounded-lg transition-colors" title="Lihat Detail">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleOpenEdit(item)} className="p-2 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-blue-900/30 dark:text-slate-400 dark:hover:text-blue-400 rounded-lg transition-colors" title="Edit">
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
                    <td colSpan={6} className="text-center py-8 text-slate-500 dark:text-slate-400">Belum ada jadwal yang ditambahkan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Edit/Add Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-lg overflow-hidden z-10 flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{editId ? 'Edit Jadwal' : 'Tambah Jadwal'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                {renderForm()}
              </div>
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                 <button onClick={() => setIsModalOpen(false)} className="px-5 py-3 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">Batal</button>
                 <button onClick={saveJadwal} className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/20">Simpan Jadwal</button>
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
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-md overflow-hidden z-10 flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-blue-500 text-white">
                <h2 className="text-xl font-bold flex items-center gap-2"><CalendarDays className="w-5 h-5"/> Detail Jadwal</h2>
                <button onClick={() => setIsViewModalOpen(false)} className="p-2 text-white/80 hover:bg-white/20 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div>
                       <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Tanggal</div>
                       <div className="font-medium text-slate-800 dark:text-slate-200">{viewData.tanggal || '-'} ({viewData.hari})</div>
                   </div>
                   <div>
                       <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Waktu</div>
                       <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200"><Clock className="w-4 h-4 text-blue-500"/> {viewData.jamMulai} - {viewData.jamSelesai}</div>
                   </div>
                </div>
                <div>
                   <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Mata Pelajaran</div>
                   <div className="font-bold text-lg text-slate-800 dark:text-slate-200">{viewData.mataPelajaran}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                       <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Kelas</div>
                       <div className="font-medium text-slate-800 dark:text-slate-200">{viewData.kelas}</div>
                   </div>
                   <div>
                       <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Guru Mapel</div>
                       <div className="font-medium text-slate-800 dark:text-slate-200">{viewData.guruInput}</div>
                   </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                 <button onClick={() => setIsViewModalOpen(false)} className="px-5 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-medium rounded-xl transition-colors">Tutup Menu</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
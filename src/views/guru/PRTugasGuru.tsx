import { useState, useRef } from 'react';
import { ClipboardList, Plus, Search, Edit2, Trash2, Eye, FileDown, FileUp, X, FileText, Globe, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../../AppContext';
import { usePRTugas, Tugas } from '../../PRTugasContext';
interface SoalOnline {
  id: string;
  pertanyaan: string;
  gambarBase64?: string;
  A: string;
  B: string;
  C: string;
  D: string;
  E: string;
  jawabanBenar: string;
}
export const PRTugasGuru = () => {
  const { user, showNotification, navigate } = useAppContext();
  const { tugasList, setTugasList, triggerUpdate } = usePRTugas();
  const [activeTab, setActiveTab] = useState<'offline' | 'online'>('offline');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  const [viewData, setViewData] = useState<Tugas | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  // Form State
  const [mataPelajaran, setMataPelajaran] = useState('');
  const [kelas, setKelas] = useState('');
  const [namaTugas, setNamaTugas] = useState('');
  const [uraianTugas, setUraianTugas] = useState('');
  const [waktuPengerjaan, setWaktuPengerjaan] = useState('');
  const [tataCara, setTataCara] = useState('');
  
  // Offline specific
  const [soalFile, setSoalFile] = useState('');
  const [fileName, setFileName] = useState('');
  // Online specific
  const [soalOnline, setSoalOnline] = useState<SoalOnline[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const filteredList = tugasList.filter((t: any) => 
    t.tipe === activeTab &&
    (
      t.mataPelajaran.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.namaTugas.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.kelas.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
  const handleDelete = (id: string) => {
    if (window.confirm('Hapus tugas ini?')) {
      const updated = tugasList.filter((t: any) => t.id !== id);
      setTugasList(updated);
      localStorage.setItem('sd_tugas_list', JSON.stringify(updated));
      triggerUpdate();
      showNotification('Tugas berhasil dihapus', 'success');
    }
  };
  const handleOpenOfflineAdd = () => {
    resetForm();
    setIsOfflineModalOpen(true);
  };
  const handleOpenOnlineAdd = () => {
    resetForm();
    setIsOnlineModalOpen(true);
  };
  const handleEdit = (data: Tugas) => {
    setEditId(data.id);
    setMataPelajaran(data.mataPelajaran);
    setKelas(data.kelas);
    setNamaTugas(data.namaTugas);
    setUraianTugas(data.uraianTugas);
    setWaktuPengerjaan(data.waktuPengerjaan);
    setTataCara(data.tataCara);
    if (data.tipe === 'offline') {
      setSoalFile(data.soalFile || '');
      setFileName(data.fileName || '');
      setIsOfflineModalOpen(true);
    } else {
      setSoalOnline(data.soalOnline || []);
      setIsOnlineModalOpen(true);
    }
  };
  const resetForm = () => {
    setEditId(null);
    setMataPelajaran('');
    setKelas('');
    setNamaTugas('');
    setUraianTugas('');
    setWaktuPengerjaan('');
    setTataCara('');
    setSoalFile('');
    setFileName('');
    setSoalOnline([]);
  };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      // In a real app we'd upload to server. Here we just store base64 or object URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setSoalFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const saveOffline = () => {
    if (!mataPelajaran || !kelas || !namaTugas) {
      showNotification('Harap lengkapi field penting (Mapel, Kelas, Nama Tugas)', 'error');
      return;
    }
    if (!window.confirm('Apakah Anda yakin ingin mengirim tugas ini? (Pilih Batal untuk revisi)')) {
        return;
    }
    const newTask: Tugas = {
      id: editId || Date.now().toString(),
      tipe: 'offline',
      guru: user?.name || 'Guru',
      mataPelajaran,
      kelas,
      namaTugas,
      uraianTugas,
      waktuPengerjaan,
      tataCara,
      soalFile,
      fileName,
      createdAt: new Date().toISOString()
    };
    saveTask(newTask);
    setIsOfflineModalOpen(false);
  };
  const saveOnline = () => {
    if (!mataPelajaran || !kelas || !namaTugas) {
      showNotification('Harap lengkapi field penting (Mapel, Kelas, Nama Tugas)', 'error');
      return;
    }
    
    if (soalOnline.length === 0) {
      showNotification('Minimal harus ada 1 soal', 'error');
      return;
    }
    const newTask: Tugas = {
      id: editId || Date.now().toString(),
      tipe: 'online',
      guru: user?.name || 'Guru',
      mataPelajaran,
      kelas,
      namaTugas,
      uraianTugas,
      waktuPengerjaan,
      tataCara,
      soalOnline,
      createdAt: new Date().toISOString()
    };
    saveTask(newTask);
    setIsOnlineModalOpen(false);
  };
  const saveTask = (newTask: Tugas) => {
    let updated;
    if (editId) {
      updated = tugasList.map(t => t.id === editId ? newTask : t);
      showNotification('Tugas berhasil diperbarui', 'success');
    } else {
      updated = [newTask, ...tugasList];
      showNotification('Tugas berhasil dikirim', 'success');
    }
    setTugasList(updated);
    localStorage.setItem('sd_tugas_list', JSON.stringify(updated));
    triggerUpdate();
  };
  // Soal Online Management
  const addSoal = () => {
    setSoalOnline([...soalOnline, {
      id: Date.now().toString(),
      pertanyaan: '',
      A: '', B: '', C: '', D: '', E: '',
      jawabanBenar: 'A'
    }]);
  };
  const updateSoal = (index: number, field: keyof SoalOnline, value: string) => {
    const updated = [...soalOnline];
    updated[index] = { ...updated[index], [field]: value };
    setSoalOnline(updated);
  };
  const removeSoal = (index: number) => {
    const updated = soalOnline.filter((_, i) => i !== index);
    setSoalOnline(updated);
  };
  const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateSoal(index, 'gambarBase64', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  // CSV
  const handleDownloadCSV = () => {
    const headers = ['Pertanyaan', 'A', 'B', 'C', 'D', 'E', 'JawabanBenar'];
    const csvContent = '\uFEFF' + headers.join(',') + '\n' +
      '"Berapa 1+1?","1","2","3","4","5","B"\n';
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_soal_online.csv');
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
        showNotification('File CSV kosong', 'error');
        return;
      }
      const newSoal: SoalOnline[] = [];
      const timestamp = Date.now();
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
        if (values.length >= 7) {
            newSoal.push({
                id: `${timestamp}-${i}`,
                pertanyaan: values[0],
                A: values[1], B: values[2], C: values[3], D: values[4], E: values[5],
                jawabanBenar: values[6]
            });
        }
      }
      setSoalOnline([...soalOnline, ...newSoal]);
      showNotification(`${newSoal.length} soal berhasil diimpor`, 'success');
    };
    reader.readAsText(file);
    if (csvInputRef.current) csvInputRef.current.value = '';
  };
  return (
    <div className="max-w-7xl mx-auto pb-24 lg:pb-12 space-y-6 mt-6">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-5">
           <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/20 text-rose-600 rounded-2xl flex items-center justify-center">
             <ClipboardList className="w-8 h-8" />
           </div>
           <div>
             <h1 className="text-2xl font-bold text-slate-800 dark:text-white">PR & Tugas Siswa</h1>
             <p className="text-slate-500 dark:text-slate-400">Kelola penugasan offline dan ujian online</p>
           </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
         <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl overflow-x-auto no-scrollbar w-full sm:w-auto">
            <button 
              onClick={() => setActiveTab('offline')}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors whitespace-nowrap flex-1 sm:flex-none ${activeTab === 'offline' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}
            >
              <FileText className="w-4 h-4" />
              PR Offline
            </button>
            <button 
              onClick={() => setActiveTab('online')}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors whitespace-nowrap flex-1 sm:flex-none ${activeTab === 'online' ? 'bg-white dark:bg-slate-900 text-purple-600 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}
            >
              <Globe className="w-4 h-4" />
              Tugas Online
            </button>
         </div>
         <div className="flex gap-3 w-full sm:w-auto overflow-x-auto no-scrollbar pb-2 sm:pb-0">
             {activeTab === 'online' && (
                <>
                  <input type="file" accept=".csv" ref={csvInputRef} onChange={handleUploadCSV} className="hidden" />
                  <button onClick={() => csvInputRef.current?.click()} className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shadow-sm text-sm font-medium">
                     <FileUp className="w-4 h-4" /> Upload CSV
                  </button>
                  <button onClick={handleDownloadCSV} className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shadow-sm text-sm font-medium">
                     <FileDown className="w-4 h-4" /> Template CSV
                  </button>
                </>
             )}
            <button
              onClick={activeTab === 'offline' ? handleOpenOfflineAdd : handleOpenOnlineAdd}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-medium transition-all active:scale-95 shadow-lg shadow-blue-500/20 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              <span>Tambah {activeTab === 'offline' ? 'Offline' : 'Online'}</span>
            </button>
         </div>
      </div>
      {/* Main Content */}
      <div className="space-y-6">
        <div className="relative">
          <input 
            type="text" 
            placeholder={`Cari tugas ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
          />
          <Search className="w-6 h-6 text-slate-400 absolute left-4 top-4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredList.length > 0 ? (
             filteredList.map(item => (
                <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`px-3 py-1 text-xs font-semibold rounded-lg ${activeTab === 'offline' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                           {activeTab === 'offline' ? 'PR Offline' : 'Tugas Online'}
                        </div>
                        <div className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</div>
                    </div>
                    <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-2 leading-tight">{item.namaTugas}</h3>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">{item.uraianTugas || '-'}</div>
                    <div className="space-y-2 mb-6 text-sm">
                       <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                           <span className="font-medium text-slate-700 dark:text-slate-300 w-16">Mapel:</span> {item.mataPelajaran}
                       </div>
                       <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                           <span className="font-medium text-slate-700 dark:text-slate-300 w-16">Kelas:</span> {item.kelas}
                       </div>
                       {activeTab === 'online' && (
                           <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                               <span className="font-medium text-slate-700 dark:text-slate-300 w-16">Soal:</span> {item.soalOnline?.length || 0} Soal
                           </div>
                       )}
                    </div>
                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                        <button onClick={() => navigate('PenilaianRaportGuru')} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium mr-auto transition-colors shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
                            Beri Nilai
                        </button>
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
                </div>
             ))
           ) : (
             <div className="col-span-full text-center py-16 text-slate-500 dark:text-slate-400">
                Data tidak ditemukan.
             </div>
           )}
        </div>
      </div>
      {/* Offline Modal */}
      <AnimatePresence>
        {isOfflineModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOfflineModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{editId ? 'Edit PR Offline' : 'Tambah PR Offline'}</h2>
                <button type="button" onClick={() => setIsOfflineModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Mata Pelajaran</label>
                        <input type="text" value={mataPelajaran} onChange={e => setMataPelajaran(e.target.value)} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Cth: Matematika" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Guru</label>
                        <input type="text" value={user?.name || ''} disabled className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 cursor-not-allowed outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Kelas</label>
                        <input type="text" value={kelas} onChange={e => setKelas(e.target.value)} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Cth: 10 IPA 1" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nama Tugas Offline</label>
                        <input type="text" value={namaTugas} onChange={e => setNamaTugas(e.target.value)} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Cth: Latihan Harian 1" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Waktu Pengerjaan (Deadline)</label>
                        <input type="text" value={waktuPengerjaan} onChange={e => setWaktuPengerjaan(e.target.value)} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Cth: 2 Hari, tgl 12 Nov, dll" />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Uraian Tugas / Deskripsi</label>
                        <textarea value={uraianTugas} onChange={e => setUraianTugas(e.target.value)} rows={3} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Jelaskan isi tugasnya..." />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tata Cara Pengerjaan</label>
                        <textarea value={tataCara} onChange={e => setTataCara(e.target.value)} rows={3} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Harus ditulis di folio, dsb..." />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Upload Soal (jpg/pdf/word)</label>
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                           <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" />
                           <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                           <div className="text-sm font-medium text-blue-600">{fileName ? fileName : 'Klik untuk memilih file'}</div>
                           <div className="text-xs text-slate-500 mt-1">Maksimal file 5MB</div>
                        </div>
                    </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 shrink-0">
                 <button type="button" onClick={() => setIsOfflineModalOpen(false)} className="px-5 py-3 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">Batal</button>
                 <button type="button" onClick={saveOffline} className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/20">{editId ? 'Simpan' : 'Kirim Tugas'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Online Modal */}
      <AnimatePresence>
        {isOnlineModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOnlineModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-4xl flex flex-col max-h-[95vh]">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{editId ? 'Edit Tugas Online' : 'Tambah Tugas Online'}</h2>
                <button type="button" onClick={() => setIsOnlineModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-8">
                
                {/* Bagian Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2"><h3 className="font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Informasi Tugas</h3></div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Mata Pelajaran</label>
                        <input type="text" value={mataPelajaran} onChange={e => setMataPelajaran(e.target.value)} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Guru</label>
                        <input type="text" value={user?.name || ''} disabled className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Kelas</label>
                        <input type="text" value={kelas} onChange={e => setKelas(e.target.value)} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nama Tugas / Kuis</label>
                        <input type="text" value={namaTugas} onChange={e => setNamaTugas(e.target.value)} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Durasi Waktu (waktu pengerjaan online)</label>
                        <input type="text" value={waktuPengerjaan} onChange={e => setWaktuPengerjaan(e.target.value)} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Cth: 120 Menit" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Uraian / Deskripsi</label>
                        <textarea value={uraianTugas} onChange={e => setUraianTugas(e.target.value)} rows={2} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tata Cara Pengerjaan</label>
                        <textarea value={tataCara} onChange={e => setTataCara(e.target.value)} rows={2} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Aturan main saat mengerjakan tugas" />
                    </div>
                </div>
                {/* Bagian Soal */}
                <div>
                   <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">
                       <h3 className="font-bold text-slate-800 dark:text-white">Daftar Soal Pilihan Ganda ({soalOnline.length})</h3>
                       <button onClick={addSoal} className="flex items-center gap-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                           <Plus className="w-4 h-4" /> Tambah Soal
                       </button>
                   </div>
                   
                   <div className="space-y-6">
                      {soalOnline.map((soal, i) => (
                         <div key={soal.id} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-6 relative">
                             <button onClick={() => removeSoal(i)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                                 <Trash2 className="w-4 h-4" />
                             </button>
                             <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-4">Soal #{i + 1}</h4>
                             
                             <div className="space-y-4">
                                <div>
                                   <label className="block text-sm mb-1.5">Pertanyaan</label>
                                   <textarea value={soal.pertanyaan} onChange={e => updateSoal(i, 'pertanyaan', e.target.value)} rows={2} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 outline-none" />
                                </div>
                                <div>
                                   <label className="block text-sm mb-1.5">Gambar (Opsional)</label>
                                   <input type="file" accept="image/*" onChange={(e) => handleImageUpload(i, e)} className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-700 dark:file:text-slate-300" />
                                   {soal.gambarBase64 && <img src={soal.gambarBase64} alt="Preview" className="h-20 object-contain mt-2 rounded" />}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                   {['A', 'B', 'C', 'D', 'E'].map(opt => (
                                     <div key={opt} className="flex items-center gap-2">
                                        <div className="font-bold text-slate-500 w-6 shrink-0">{opt}.</div>
                                        <input type="text" value={(soal as any)[opt]} onChange={e => updateSoal(i, opt as any, e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 outline-none" placeholder={`Opsi ${opt}`} />
                                     </div>
                                   ))}
                                </div>
                                <div>
                                   <label className="block text-sm font-medium mb-1.5">Jawaban Benar</label>
                                   <select value={soal.jawabanBenar} onChange={e => updateSoal(i, 'jawabanBenar', e.target.value)} className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 outline-none w-32 font-bold">
                                       <option value="A">A</option>
                                       <option value="B">B</option>
                                       <option value="C">C</option>
                                       <option value="D">D</option>
                                       <option value="E">E</option>
                                   </select>
                                </div>
                             </div>
                         </div>
                      ))}
                      {soalOnline.length === 0 && (
                          <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                              Belum ada soal, klik Tambah Soal
                          </div>
                      )}
                   </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 shrink-0">
                 <button type="button" onClick={() => setIsOnlineModalOpen(false)} className="px-5 py-3 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">Batal</button>
                 <button type="button" onClick={saveOnline} className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-purple-500/20">{editId ? 'Simpan' : 'Simpan Tugas Online'}</button>
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
              <div className={`p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0 text-white ${viewData.tipe === 'offline' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                <h2 className="text-xl font-bold flex items-center gap-2">Detail {viewData.tipe === 'offline' ? 'PR Offline' : 'Tugas Online'}</h2>
                <button onClick={() => setIsViewModalOpen(false)} className="p-2 text-white/80 hover:bg-white/20 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-4">
                <div>
                   <h3 className="font-bold text-2xl text-slate-800 dark:text-white">{viewData.namaTugas}</h3>
                   <div className="text-slate-500">{viewData.mataPelajaran} • Kelas {viewData.kelas}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <div>
                        <div className="text-xs font-semibold text-slate-500 mb-1">Guru</div>
                        <div className="font-medium text-slate-800 dark:text-slate-200">{viewData.guru}</div>
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-slate-500 mb-1">Waktu Pengerjaan</div>
                        <div className="font-medium text-slate-800 dark:text-slate-200">{viewData.waktuPengerjaan || '-'}</div>
                    </div>
                </div>
                <div>
                   <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1 border-b border-slate-200 dark:border-slate-700 pb-1">Uraian Tugas</div>
                   <div className="text-slate-600 dark:text-slate-400">{viewData.uraianTugas || '-'}</div>
                </div>
                <div>
                   <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1 border-b border-slate-200 dark:border-slate-700 pb-1">Tata Cara Pengerjaan</div>
                   <div className="text-slate-600 dark:text-slate-400">{viewData.tataCara || '-'}</div>
                </div>
                {viewData.tipe === 'offline' && viewData.fileName && (
                   <div>
                       <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1 border-b border-slate-200 dark:border-slate-700 pb-1">File Soal</div>
                       <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 cursor-pointer hover:underline p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl" onClick={() => {
                            if (viewData.soalFile) {
                                const win = window.open();
                                if (win) win.document.write(`<iframe src="${viewData.soalFile}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                            }
                       }}>
                           <FileText className="w-4 h-4" /> {viewData.fileName}
                       </div>
                   </div>
                )}
                
                {viewData.tipe === 'online' && (
                    <div>
                       <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1 border-b border-slate-200 dark:border-slate-700 pb-1">Total Soal Online</div>
                       <div className="font-medium text-slate-600 dark:text-slate-400">{viewData.soalOnline?.length || 0} Soal Pilihan Ganda</div>
                    </div>
                )}
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
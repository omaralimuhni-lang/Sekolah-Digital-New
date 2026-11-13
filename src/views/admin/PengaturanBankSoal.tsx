import { useState, useEffect } from 'react';
import { BookOpen, Database, Download, Upload, Trash2, CheckCircle, FileText, Lock, Unlock } from 'lucide-react';
import { useAppContext } from '../../AppContext';
interface StorageStats {
  tugas: number;
  penilaianTugas: number;
  penilaianUjian: number;
  penilaianMapel: number;
  raport: number;
}
export function PengaturanBankSoal() {
  const { showNotification } = useAppContext();
  const [stats, setStats] = useState<StorageStats>({
    tugas: 0,
    penilaianTugas: 0,
    penilaianUjian: 0,
    penilaianMapel: 0,
    raport: 0
  });
  
  const [aksesGuru, setAksesGuru] = useState<boolean>(true);
  const loadStats = () => {
    try {
      const tugas = JSON.parse(localStorage.getItem('sd_tugas_list') || '[]');
      const penTugas = JSON.parse(localStorage.getItem('sd_penilaian_tugas') || '[]');
      const penUjian = JSON.parse(localStorage.getItem('sd_penilaian_ujian') || '[]');
      const penMapel = JSON.parse(localStorage.getItem('sd_penilaian_mapel') || '[]');
      const raport = JSON.parse(localStorage.getItem('sd_raport') || '[]');
      
      setStats({
        tugas: Array.isArray(tugas) ? tugas.length : 0,
        penilaianTugas: Array.isArray(penTugas) ? penTugas.length : 0,
        penilaianUjian: Array.isArray(penUjian) ? penUjian.length : 0,
        penilaianMapel: Array.isArray(penMapel) ? penMapel.length : 0,
        raport: Array.isArray(raport) ? raport.length : 0
      });
      
      const akses = localStorage.getItem('sd_izin_akses_bank_soal');
      if (akses !== null) {
        setAksesGuru(akses === 'true');
      }
    } catch (e) {
      console.error('Failed to load stats', e);
    }
  };
  useEffect(() => {
    loadStats();
    
    const handleStorageChange = () => loadStats();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('data-updated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('data-updated', handleStorageChange);
    };
  }, []);
  const toggleAksesGuru = () => {
    const newValue = !aksesGuru;
    setAksesGuru(newValue);
    localStorage.setItem('sd_izin_akses_bank_soal', newValue.toString());
    showNotification(`Izin akses guru telah ${newValue ? 'dibuka' : 'ditutup'}`, 'success');
    window.dispatchEvent(new Event('data-updated'));
  };
  const exportData = (key: string, filename: string) => {
    try {
      const data = localStorage.getItem(key) || '[]';
      const parsedData = JSON.parse(data);
      if (!Array.isArray(parsedData) || parsedData.length === 0) {
        showNotification('Tidak ada data untuk dibackup', 'error');
        return;
      }
      
      const dataStr = JSON.stringify(parsedData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}_backup_${new Date().getTime()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showNotification(`File backup ${filename} berhasil diunduh`, 'success');
    } catch (error) {
      console.error(error);
      showNotification('Gagal melakukan backup', 'error');
    }
  };
  const handleImport = (key: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const parsed = JSON.parse(result);
        
        if (!Array.isArray(parsed)) {
          throw new Error('Format salah, diharapkan array data');
        }
        
        localStorage.setItem(key, JSON.stringify(parsed));
        loadStats();
        showNotification('Data berhasil dipulihkan dari backup', 'success');
        window.dispatchEvent(new Event('data-updated'));
      } catch (error) {
        console.error(error);
        showNotification('Gagal memulihkan, format file backup tidak valid', 'error');
      }
    };
    reader.readAsText(file);
    // Reset file input
    event.target.value = '';
  };
  const clearData = (key: string, name: string) => {
    if (window.confirm(`PERINGATAN: Apakah Anda yakin ingin mengosongkan seluruh data ${name}?\n\nPastikan Anda sudah melakukan backup sebelum mengosongkan data. Tindakan ini tidak dapat dibatalkan.`)) {
      localStorage.setItem(key, '[]');
      loadStats();
      showNotification(`Data ${name} berhasil dikosongkan`, 'success');
      window.dispatchEvent(new Event('data-updated'));
    }
  };
  const exportAllData = () => {
    try {
      const keys = ['sd_tugas_list', 'sd_penilaian_tugas', 'sd_penilaian_ujian', 'sd_penilaian_mapel', 'sd_raport'];
      const allData: any = {};
      let hasData = false;
      
      keys.forEach(key => {
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        if (Array.isArray(data) && data.length > 0) {
           allData[key] = data;
           hasData = true;
        }
      });
      
      if (!hasData) {
        showNotification('Tidak ada data untuk dibackup', 'error');
        return;
      }
      
      const dataStr = JSON.stringify({ type: 'SEKOLAH_BACKUP_ALL', data: allData, timestamp: new Date().toISOString() }, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_pembelajaran_raport_${new Date().getTime()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showNotification(`File backup semua data berhasil diunduh`, 'success');
    } catch (error) {
      console.error(error);
      showNotification('Gagal melakukan backup semua data', 'error');
    }
  };
  const importAllData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const parsed = JSON.parse(result);
        
        if (parsed.type !== 'SEKOLAH_BACKUP_ALL' || !parsed.data) {
          throw new Error('Format file backup tidak valid (harus file Backup Semua Data)');
        }
        
        Object.keys(parsed.data).forEach(key => {
           localStorage.setItem(key, JSON.stringify(parsed.data[key]));
        });
        
        loadStats();
        showNotification('Seluruh data berhasil dipulihkan dari backup', 'success');
        window.dispatchEvent(new Event('data-updated'));
      } catch (error: any) {
        console.error(error);
        showNotification(error.message || 'Gagal memulihkan, format file backup tidak valid', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };
  const renderDataCard = (title: string, desc: string, key: string, count: number, icon: React.ReactNode, bgColor: string, textColor: string) => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden group">
      <div className={`p-6 border-b border-slate-100 dark:border-slate-700/50 ${bgColor}`}>
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
             <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm ${textColor}`}>
               {icon}
             </div>
             <div>
               <h3 className={`text-lg font-bold ${textColor}`}>{title}</h3>
               <p className={`${textColor} opacity-80 text-sm`}>{desc}</p>
             </div>
           </div>
           <div className="text-right">
             <div className={`text-3xl font-extrabold ${textColor}`}>{count}</div>
             <div className={`text-xs ${textColor} font-medium opacity-80 uppercase tracking-wider`}>Records</div>
           </div>
         </div>
      </div>
      
      <div className="p-4 bg-white dark:bg-slate-800 flex flex-col sm:flex-row gap-3">
        <button 
          onClick={() => exportData(key, title.replace(/ /g, '_'))}
          disabled={count === 0}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition-colors text-sm"
        >
          <Download className="w-4 h-4" /> Backup
        </button>
        
        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-xl font-medium cursor-pointer transition-colors text-sm">
          <Upload className="w-4 h-4" /> Restore
          <input type="file" accept=".json" className="hidden" onChange={(e) => handleImport(key, e)} />
        </label>
        
        <button 
          onClick={() => clearData(key, title)}
          disabled={count === 0}
          className="flex items-center justify-center px-4 py-2 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shrink-0"
          title="Kosongkan Data"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[100vw] overflow-x-hidden pt-safe pb-32">
      <div className="flex flex-col gap-6">
        
        {/* Banner */}
        <div className="bg-gradient-to-br from-violet-600 to-fuchsia-700 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl shadow-violet-500/20 relative overflow-hidden h-40 sm:h-48 flex flex-col justify-end">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
           <div className="absolute bottom-0 right-10 opacity-20 pointer-events-none transform translate-y-1/4 right-0 rotate-[-15deg]">
              <Database className="w-48 h-48 sm:w-64 sm:h-64 text-white" />
           </div>
           
           <div className="relative z-10 w-full flex flex-col md:flex-row gap-6 items-start md:items-end justify-between">
             <div>
               <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">Pengaturan Bank Soal</h1>
               <p className="text-violet-100 font-medium text-sm sm:text-base max-w-sm sm:max-w-xl">Kelola, backup, dan atur izin akses bank soal tugas serta data penilaian siswa.</p>
             </div>
           </div>
        </div>
        {/* Global Access Toggle */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${aksesGuru ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'}`}>
              {aksesGuru ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-lg">Izin Akses Bank Soal & Penilaian Bagi Guru</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Ketika dikunci, guru tidak dapat melihat atau mengubah bank soal lama hingga admin memberikan izin.</p>
            </div>
          </div>
          <button 
            onClick={toggleAksesGuru}
            className={`shrink-0 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
              aksesGuru 
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30' 
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
            }`}
          >
            {aksesGuru ? (
              <>
                <Lock className="w-5 h-5" /> Kunci Akses Guru
              </>
            ) : (
              <>
                <Unlock className="w-5 h-5" /> Buka Akses Guru
              </>
            )}
          </button>
        </div>
        {/* Global Backup & Restore Toggle */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-lg">Backup & Restore Terpusat (Data Pembelajaran)</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Simpan salinan data PR, Tugas, Penilaian, dan Raport sekaligus ke dalam satu format file JSON untuk kemudahan pemulihan server ketika dibutuhkan.</p>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={exportAllData}
              className="flex-1 md:flex-none justify-center px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 bg-slate-900 dark:bg-indigo-500 hover:bg-slate-800 dark:hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
            >
              <Download className="w-5 h-5" /> Backup Semua
            </button>
            <label className="flex-1 md:flex-none justify-center px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 cursor-pointer text-center">
              <Upload className="w-5 h-5" /> Restore Semua
              <input type="file" accept=".json" className="hidden" onChange={importAllData} />
            </label>
          </div>
        </div>
        
        {/* Management Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 ml-2">
              <BookOpen className="w-5 h-5 text-indigo-500" /> Bank Soal & Tugas
            </h2>
            {renderDataCard('PR & Tugas Siswa', 'Seluruh soal dan CBT', 'sd_tugas_list', stats.tugas, <FileText />, 'bg-indigo-50 dark:bg-indigo-900/30', 'text-indigo-700 dark:text-indigo-400')}
          </div>
          
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 ml-2">
              <FileText className="w-5 h-5 text-emerald-500" /> Data Penilaian & Raport
            </h2>
            {renderDataCard('Penilaian Tugas', 'Nilai tugas-tugas', 'sd_penilaian_tugas', stats.penilaianTugas, <CheckCircle />, 'bg-emerald-50 dark:bg-emerald-900/30', 'text-emerald-700 dark:text-emerald-400')}
            {renderDataCard('Penilaian Ujian', 'Nilai PTS/PAS', 'sd_penilaian_ujian', stats.penilaianUjian, <CheckCircle />, 'bg-teal-50 dark:bg-teal-900/30', 'text-teal-700 dark:text-teal-400')}
            {renderDataCard('Penilaian Mapel', 'Nilai akhir per mapel', 'sd_penilaian_mapel', stats.penilaianMapel, <CheckCircle />, 'bg-cyan-50 dark:bg-cyan-900/30', 'text-cyan-700 dark:text-cyan-400')}
            {renderDataCard('Raport Siswa', 'Raport akhir semester', 'sd_raport', stats.raport, <CheckCircle />, 'bg-blue-50 dark:bg-blue-900/30', 'text-blue-700 dark:text-blue-400')}
          </div>
        </div>
      </div>
    </div>
  );
}
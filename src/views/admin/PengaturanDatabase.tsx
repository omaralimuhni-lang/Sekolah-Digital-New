import { useState, useEffect } from 'react';
import { Database, Download, Upload, AlertTriangle, RefreshCw, Trash2, Cloud, CheckCircle2, LogOut } from 'lucide-react';
import { useAppContext } from '../../AppContext';
import { recordLog } from '../../utils/logHelper';
import { CloudSyncManager, CloudSyncStatus } from '../../lib/cloudSync';
export function PengaturanDatabase() {
  const { user, showNotification } = useAppContext();
  const [isProcessing, setIsProcessing] = useState(false);
  // Define the databases
  const DB_KEYS = [
    { key: 'sd_siswa', label: 'Database Siswa' },
    { key: 'sd_guru', label: 'Database Guru' },
    { key: 'sd_tendik', label: 'Database Tenaga Pendidik' },
    { key: 'sd_ortu', label: 'Database Orang Tua' },
    { key: 'sd_mitra', label: 'Database Mitra' },
  ];
  const getDbStats = () => {
    return DB_KEYS.map(db => {
      const dataStr = localStorage.getItem(db.key) || '[]';
      let count = 0;
      let sizeBytes = 0;
      try {
        const parsed = JSON.parse(dataStr);
        count = Array.isArray(parsed) ? parsed.length : 0;
        sizeBytes = new Blob([dataStr]).size;
      } catch (e) {
        // ignore
      }
      return { ...db, count, size: (sizeBytes / 1024).toFixed(2) + ' KB', rawData: dataStr };
    });
  };
  const [dbStats, setDbStats] = useState(getDbStats());
  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>(CloudSyncManager.getStatus());
  const [isCloudBusy, setIsCloudBusy] = useState(false);

  useEffect(() => {
    const unsubscribe = CloudSyncManager.subscribeStatus(setCloudStatus);
    const handleRefresh = () => setDbStats(getDbStats());
    window.addEventListener('localStorageUpdate', handleRefresh);
    return () => {
      unsubscribe();
      window.removeEventListener('localStorageUpdate', handleRefresh);
    };
  }, []);

  const refreshStats = () => {
    setDbStats(getDbStats());
  };

  const handleConnectCloud = async () => {
    setIsCloudBusy(true);
    try {
      await CloudSyncManager.connectGoogleCloud();
      refreshStats();
      if (user) recordLog(user, 'UPDATE', 'Database', 'Mengaktifkan sinkronisasi cloud realtime Firebase Firestore');
      showNotification('Penyimpanan cloud realtime Firebase Firestore berhasil terhubung', 'success');
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Gagal menghubungkan akun Google', 'error');
    } finally {
      setIsCloudBusy(false);
    }
  };

  const handleSyncNow = async () => {
    setIsCloudBusy(true);
    try {
      await CloudSyncManager.pushAllLocalToCloud();
      await CloudSyncManager.pullAllData();
      refreshStats();
      showNotification('Seluruh data berhasil disinkronkan secara realtime', 'success');
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Gagal menyinkronkan data', 'error');
    } finally {
      setIsCloudBusy(false);
    }
  };

  const handleDisconnectCloud = async () => {
    setIsCloudBusy(true);
    try {
      await CloudSyncManager.disconnectGoogleCloud();
      showNotification('Koneksi sinkronisasi cloud diputuskan', 'info');
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Gagal memutuskan koneksi', 'error');
    } finally {
      setIsCloudBusy(false);
    }
  };
  const handleBackupAll = () => {
    const backupData: Record<string, any> = {};
    DB_KEYS.forEach(db => {
      backupData[db.key] = JSON.parse(localStorage.getItem(db.key) || '[]');
    });
    
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup_Database_Sistem_${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (user) recordLog(user, 'EXPORT', 'Database', 'Melakukan backup seluruh database pengguna (Siswa, Guru, Tendik, Ortu, Mitra)');
    showNotification('Backup database berhasil diunduh', 'success');
  };
  const handleBackupSingle = (key: string, label: string) => {
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup_${label.replace(/\s+/g, '_')}_${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (user) recordLog(user, 'EXPORT', 'Database', `Melakukan backup ${label}`);
    showNotification(`Backup ${label} berhasil diunduh`, 'success');
  };
  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const parsed = JSON.parse(result);
        
        // Cek apakah format seluruh DB atau tunggal
        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          let updatedCount = 0;
          DB_KEYS.forEach(db => {
            if (parsed[db.key]) {
              localStorage.setItem(db.key, JSON.stringify(parsed[db.key]));
              updatedCount++;
            }
          });
          if (updatedCount > 0) {
             if (user) recordLog(user, 'UPDATE', 'Database', `Melakukan restore seluruh database sistem dari file ${file.name}`);
             showNotification('Restore database berhasil dilakukan', 'success');
          } else {
             showNotification('Format file backup seluruh db tidak valid', 'error');
          }
        } else if (Array.isArray(parsed)) {
          // If array, we cannot easily tell which DB it is unless they selected specifically. 
          // But our restore input is for "Restore All".
          showNotification('Gunakan format backup "Seluruh Database" untuk fitur ini, bukan format tunggal.', 'error');
        }
      } catch (err) {
        showNotification('Gagal membaca file backup', 'error');
      } finally {
        setIsProcessing(false);
        refreshStats();
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsText(file);
  };
  const handleResetSingle = (key: string, label: string) => {
    if (confirm(`Apakah Anda YAKIN ingin mengosongkan seluruh data pada ${label}? Tindakan ini tidak bisa dibatalkan!`)) {
        localStorage.setItem(key, '[]');
        if (user) recordLog(user, 'DELETE', 'Database', `Mengosongkan (Reset) seluruh data pada ${label}`);
        showNotification(`Data ${label} berhasil dikosongkan`, 'success');
        refreshStats();
    }
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full pb-32">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-3 bg-amber-600 rounded-xl text-white">
            <Database className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Pengaturan Database
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Atur dan backup seluruh database pengguna sistem dengan aman.
            </p>
          </div>
        </div>
        <button onClick={refreshStats} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
         <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col">
            <h3 className="text-slate-500 font-semibold mb-2">Total Database</h3>
            <span className="text-4xl font-bold text-amber-500">{DB_KEYS.length}</span>
         </div>
         <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col">
            <h3 className="text-slate-500 font-semibold mb-2">Total Data Keseluruhan</h3>
            <span className="text-4xl font-bold text-slate-800 dark:text-white">
              {dbStats.reduce((sum, db) => sum + db.count, 0)} <span className="text-base text-slate-500">Record</span>
            </span>
         </div>
         <div className="md:col-span-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 shadow-sm text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-amber-100 mb-1">Aksi Cepat Keseluruhan Sistem</h3>
              <p className="text-sm text-amber-50 leading-relaxed">Ekspor atau Impor seluruh database pengguna dalam satu file JSON untuk kemudahan pemindahan server / migrasi update terbaru.</p>
            </div>
            <div className="flex bg-white/10 rounded-xl p-1 gap-1 shrink-0 w-full sm:w-auto overflow-hidden">
               <button onClick={handleBackupAll} className="flex-1 sm:flex-none flex items-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 text-white font-medium rounded-lg transition-colors whitespace-nowrap whitespace-nowrap shadow-sm">
                  <Download className="w-4 h-4" /> Backup Semua
               </button>
               <label className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white text-orange-600 hover:bg-amber-50 font-medium rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap">
                  <Upload className="w-4 h-4" /> {isProcessing ? 'Processing...' : 'Restore Semua'}
                  <input type="file" accept=".json" className="hidden" onChange={handleRestore} disabled={isProcessing} />
               </label>
            </div>
         </div>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700/50">
         <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Manajemen Setiap Entitas Database</h2>
         <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
           <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
             <thead className="bg-slate-50 dark:bg-slate-800/50 font-medium text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
               <tr>
                 <th className="px-4 py-4 w-12">#</th>
                 <th className="px-4 py-4">Nama Database</th>
                 <th className="px-4 py-4">Total Record</th>
                 <th className="px-4 py-4">Estimasi Ukuran</th>
                 <th className="px-4 py-4 text-right">Aksi Manajemen</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
               {dbStats.map((db, idx) => (
                 <tr key={db.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                   <td className="px-4 py-4 font-medium text-slate-400">{idx + 1}</td>
                   <td className="px-4 py-4 font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                         <Database className="w-4 h-4" />
                      </div>
                      {db.label}
                      {db.count > 0 && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>}
                   </td>
                   <td className="px-4 py-4">
                     <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg font-mono text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {db.count.toLocaleString('id-ID')}
                     </span>
                   </td>
                   <td className="px-4 py-4 group cursor-help font-medium">
                     {db.size} 
                   </td>
                   <td className="px-4 py-4">
                     <div className="flex items-center justify-end gap-2">
                       <button onClick={() => handleBackupSingle(db.key, db.label)} className="p-2 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 rounded-lg text-slate-400 transition-colors tooltip-trigger relative group" title={`Download ${db.label}`}>
                          <Download className="w-4 h-4" />
                       </button>
                       <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                       <button onClick={() => handleResetSingle(db.key, db.label)} className="p-2 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30 dark:hover:text-rose-400 rounded-lg text-slate-400 transition-colors" title={`Kosongkan ${db.label}`}>
                          <Trash2 className="w-4 h-4" />
                       </button>
                     </div>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
         <div className="mt-8 flex items-start gap-4 p-4 lg:p-5 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300">
             <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
             <div className="text-sm">
                <p className="font-semibold mb-1">Panduan Restore Database</p>
                <p className="opacity-90 leading-relaxed">
                  Upload file dengan format .json yang diekspor dari tombol "Backup Semua". Proses restore akan mereplace (mengganti secara utuh) data lokal yang saat ini ada sesuai dengan data di file backup.
                  Pastikan Anda juga mendownload backup versi terbaru sebelum merestore ke versi lama jika memungkinkan.
                </p>
             </div>
         </div>
      </div>

      <div className="mt-6 bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Penyimpanan Cloud Realtime (Gratis Selamanya)
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {cloudStatus.connected
                  ? `Terhubung dengan akun ${cloudStatus.email || 'Google'} (${cloudStatus.syncedKeysCount} koleksi data tersinkronisasi otomatis).`
                  : 'Hubungkan akun Google Anda untuk mengaktifkan penyimpanan cloud realtime Firebase Firestore (paket Spark gratis selamanya) beserta cache offline otomatis.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {cloudStatus.connected ? (
              <>
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Aktif Realtime
                </span>
                <button
                  onClick={handleSyncNow}
                  disabled={isCloudBusy}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center gap-2 text-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${isCloudBusy ? 'animate-spin' : ''}`} /> Sinkronkan Sekarang
                </button>
                <button
                  onClick={handleDisconnectCloud}
                  disabled={isCloudBusy}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors flex items-center gap-2 text-sm"
                >
                  <LogOut className="w-4 h-4" /> Putuskan
                </button>
              </>
            ) : (
              <button
                onClick={handleConnectCloud}
                disabled={isCloudBusy}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors flex items-center gap-2 text-sm shadow-sm"
              >
                <Cloud className="w-4 h-4" /> {isCloudBusy ? 'Menghubungkan...' : 'Hubungkan Google & Aktifkan Sync'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
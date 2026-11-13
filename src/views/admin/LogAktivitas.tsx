import { useState, useEffect } from 'react';
import { Activity, Search, Trash2 } from 'lucide-react';
import { ActivityLog } from '../../utils/logHelper';
import { useAppContext } from '../../AppContext';

export function LogAktivitas() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [search, setSearch] = useState('');
  const { showNotification } = useAppContext();

  const loadLogs = () => {
    const lg = JSON.parse(localStorage.getItem('sd_activity_logs') || '[]');
    setLogs(lg);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const clearLogs = () => {
    if (window.confirm("Yakin ingin menghapus semua log aktivitas?")) {
      localStorage.removeItem('sd_activity_logs');
      loadLogs();
      showNotification("Semua log aktivitas telah dibersihkan.");
    }
  };

  const filteredLogs = logs.filter(l => 
    l.user.toLowerCase().includes(search.toLowerCase()) || 
    l.module.toLowerCase().includes(search.toLowerCase()) ||
    l.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full pb-32">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-indigo-600 rounded-xl text-white">
              <Activity className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                Log Aktivitas
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Pantau riwayat operasi data oleh pengguna dalam sistem.
              </p>
            </div>
          </div>
          <button 
             onClick={clearLogs}
             className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:text-rose-400 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Bersihkan Log
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700/50">
           <div className="mb-6 max-w-md relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari log..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
           </div>

           <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
             <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
               <thead className="bg-slate-50 dark:bg-slate-800/50 font-medium text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
                 <tr>
                   <th className="px-4 py-3">Waktu</th>
                   <th className="px-4 py-3">Pengguna</th>
                   <th className="px-4 py-3">Role</th>
                   <th className="px-4 py-3">Aksi</th>
                   <th className="px-4 py-3">Modul</th>
                   <th className="px-4 py-3">Detail</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                 {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                   <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                     <td className="px-4 py-3 whitespace-nowrap">{new Date(log.timestamp).toLocaleString('id-ID')}</td>
                     <td className="px-4 py-3 font-medium">{log.user}</td>
                     <td className="px-4 py-3 capitalize">{log.role}</td>
                     <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                            log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 
                            log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' : 
                            'bg-rose-100 text-rose-700 dark:bg-rose-900/30'
                        }`}>
                          {log.action}
                        </span>
                     </td>
                     <td className="px-4 py-3 font-medium">{log.module}</td>
                     <td className="px-4 py-3 min-w-[200px]">{log.details}</td>
                   </tr>
                 )) : (
                   <tr>
                     <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                       Belum ada log aktivitas yang tercatat.
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>
    </div>
  );
}

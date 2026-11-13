import { useState, useEffect } from 'react';
import { ClipboardList, Search, CheckCircle2, Package, CheckSquare } from 'lucide-react';
import { useAppContext } from '../../AppContext';
export const PesananMasukKantin = () => {
  const { showNotification } = useAppContext();
  const [pesananList, setPesananList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  useEffect(() => {
    loadData();
    
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'sd_kantin_pesanan_masuk' || e.key === 'sd_mitra_produk_kantin_list') {
        loadData();
      }
    };
    const handleCustomEvent = () => loadData();
    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('localStorageUpdate', handleCustomEvent);
    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('localStorageUpdate', handleCustomEvent);
    };
  }, []);
  const loadData = () => {
    const data = JSON.parse(localStorage.getItem('sd_kantin_pesanan_masuk') || '[]');
    setPesananList(data.sort((a: any, b: any) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()));
  };
  const updateStatus = (id: string, newStatus: string) => {
    const updated = pesananList.map(p => p.id === id ? { ...p, status: newStatus } : p);
    setPesananList(updated);
    localStorage.setItem('sd_kantin_pesanan_masuk', JSON.stringify(updated));
    window.dispatchEvent(new Event('localStorageUpdate'));
    showNotification(`Status pesanan berhasil diubah menjadi ${newStatus}`, 'success');
  };
  const activePesanan = pesananList.filter(p => p.status !== 'Selesai');
  const filteredPesanan = activePesanan.filter(p => 
    p.id?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.pembeli?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.produk?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Menunggu Pengambilan': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'Diproses': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'Siap Diambil': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };
  return (
    <div className="max-w-7xl mx-auto pb-24 lg:pb-12 space-y-6 mt-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-5">
           <div className="w-16 h-16 bg-[#F43F5E]/10 text-[#F43F5E] rounded-2xl flex items-center justify-center">
             <ClipboardList className="w-8 h-8" />
           </div>
           <div>
             <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Pesanan Masuk Kantin</h1>
             <p className="text-slate-500 dark:text-slate-400">Pantau seluruh pesanan aktif yang dipesan siswa, guru, dan tendik.</p>
           </div>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="relative w-full md:w-96">
            <input 
              type="text" 
              placeholder="Cari ID Pesanan, Pembeli, atau Produk..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-[#F43F5E] outline-none"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
             <thead>
               <tr className="border-b border-slate-200 dark:border-slate-700/50">
                 <th className="pb-4 font-semibold text-slate-500 dark:text-slate-400 text-sm">ID TRX / Tanggal</th>
                 <th className="pb-4 font-semibold text-slate-500 dark:text-slate-400 text-sm">Pembeli</th>
                 <th className="pb-4 font-semibold text-slate-500 dark:text-slate-400 text-sm">Produk</th>
                 <th className="pb-4 font-semibold text-slate-500 dark:text-slate-400 text-sm text-right">Total</th>
                 <th className="pb-4 font-semibold text-slate-500 dark:text-slate-400 text-sm">Metode</th>
                 <th className="pb-4 font-semibold text-slate-500 dark:text-slate-400 text-sm">Status</th>
                 <th className="pb-4 font-semibold text-slate-500 dark:text-slate-400 text-sm text-center">Aksi (Ubah Status)</th>
               </tr>
             </thead>
             <tbody>
               {filteredPesanan.length > 0 ? filteredPesanan.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                     <td className="py-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{item.id}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{item.tanggal}</div>
                     </td>
                     <td className="py-4 font-medium text-slate-800 dark:text-slate-200">{item.pembeli}</td>
                     <td className="py-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{item.produk}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">{item.jumlah} Porsi</div>
                     </td>
                     <td className="py-4 font-bold text-slate-800 dark:text-slate-200 text-right">
                       Rp {item.total?.toLocaleString('id-ID')}
                     </td>
                     <td className="py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {item.metode}
                        </span>
                     </td>
                     <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                     </td>
                     <td className="py-4 text-center">
                        <div className="flex justify-center gap-2">
                           <button onClick={() => updateStatus(item.id, 'Diproses')} title="Diproses" className="p-2 border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg">
                             <Package className="w-4 h-4" />
                           </button>
                           <button onClick={() => updateStatus(item.id, 'Siap Diambil')} title="Siap Diambil" className="p-2 border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 rounded-lg">
                             <CheckCircle2 className="w-4 h-4" />
                           </button>
                           <button onClick={() => updateStatus(item.id, 'Selesai')} title="Selesai (Tandai Berhasil)" className="flex items-center gap-1 px-3 py-1.5 bg-[#F43F5E] hover:bg-rose-600 text-white font-medium text-sm rounded-lg shadow-sm">
                             <CheckSquare className="w-4 h-4" /> Selesai
                           </button>
                        </div>
                     </td>
                  </tr>
               )) : (
                 <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500 dark:text-slate-400">Tidak ada pesanan masuk aktif.</td>
                 </tr>
               )}
             </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
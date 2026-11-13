import { useState, useEffect } from 'react';
import { BarChart3, Search, FileDown, Eye, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../../AppContext';
export const DataPenjualanKantin = () => {
  const { showNotification } = useAppContext();
  const [penjualanList, setPenjualanList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedData, setSelectedData] = useState<any | null>(null);
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
    setPenjualanList(data.filter((p: any) => p.status === 'Selesai').sort((a: any, b: any) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()));
  };
  const filteredPenjualan = penjualanList.filter(p => 
    p.id?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.pembeli?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.produk?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const handleDownload = () => {
    if (filteredPenjualan.length === 0) {
      showNotification('Tidak ada data untuk didownload', 'error');
      return;
    }
    const wsData = filteredPenjualan.map(p => ({
      "ID TRX": p.id,
      "Tanggal": p.tanggal,
      "Pembeli": p.pembeli,
      "Produk": p.produk,
      "Jumlah": p.jumlah,
      "Total Pendapatan": p.total,
      "Metode Pembayaran": p.metode
    }));
    import('../../utils/kopHelper').then(({ exportToExcel }) => {
      exportToExcel(wsData, "Laporan_Penjualan_Kantin", "PENJUALAN");
      showNotification('Laporan berhasil didownload', 'success');
    });
  };
  const totalItemCount = filteredPenjualan.reduce((acc, curr) => acc + (curr.jumlah || 0), 0);
  return (
    <div className="max-w-7xl mx-auto pb-24 lg:pb-12 space-y-6 mt-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-5">
           <div className="w-16 h-16 bg-[#2196F3]/10 text-[#2196F3] rounded-2xl flex items-center justify-center">
             <BarChart3 className="w-8 h-8" />
           </div>
           <div>
             <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Data Penjualan Kantin</h1>
             <p className="text-slate-500 dark:text-slate-400">Riwayat dan detail penjualan produk kantin yang telah selesai diproses.</p>
           </div>
        </div>
        <button onClick={handleDownload} className="flex items-center gap-2 bg-[#2196F3] hover:bg-blue-600 text-white px-5 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20 whitespace-nowrap">
          <FileDown className="w-5 h-5" /> Download Laporan
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
           <span className="text-slate-500 font-semibold mb-1">Total Transaksi Selesai</span>
           <span className="text-3xl font-bold text-slate-800 dark:text-white">{filteredPenjualan.length} <span className="text-lg font-medium text-slate-500">Transaksi</span></span>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
           <span className="text-slate-500 font-semibold mb-1">Porsi/Item Terjual</span>
           <span className="text-3xl font-bold text-[#2196F3]">{totalItemCount} <span className="text-lg font-medium text-slate-500">Item</span></span>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="relative w-full md:w-96">
            <input 
              type="text" 
              placeholder="Cari ID Penjualan, Pembeli, atau Produk..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-[#2196F3] outline-none"
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
                 <th className="pb-4 font-semibold text-slate-500 dark:text-slate-400 text-sm text-right">Total Pendapatan</th>
                 <th className="pb-4 font-semibold text-slate-500 dark:text-slate-400 text-sm">Metode</th>
                 <th className="pb-4 font-semibold text-slate-500 dark:text-slate-400 text-sm text-center">Detail</th>
               </tr>
             </thead>
             <tbody>
               {filteredPenjualan.length > 0 ? filteredPenjualan.map((item) => (
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
                     <td className="py-4 font-bold text-emerald-600 text-right">
                       Rp {item.total?.toLocaleString('id-ID')}
                     </td>
                     <td className="py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {item.metode}
                        </span>
                     </td>
                     <td className="py-4 text-center">
                        <button onClick={() => setSelectedData(item)} className="p-2 border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 rounded-lg outline-none mx-auto block">
                          <Eye className="w-4 h-4" />
                        </button>
                     </td>
                  </tr>
               )) : (
                 <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500 dark:text-slate-400">Belum ada riwayat penjualan yang selesai.</td>
                 </tr>
               )}
             </tbody>
          </table>
        </div>
      </div>
      <AnimatePresence>
        {selectedData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedData(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Detail Penjualan</h2>
                  <button onClick={() => setSelectedData(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors outline-none"><X className="w-5 h-5"/></button>
                </div>
                <div className="space-y-4">
                   <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                     <p className="text-sm text-slate-500 mb-1">ID Transaksi / Waktu</p>
                     <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedData.id}</p>
                     <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{selectedData.tanggal}</p>
                   </div>
                   
                   <div className="p-4 border-b border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
                     <div>
                       <p className="text-sm text-slate-500 mb-1">Pembeli</p>
                       <p className="font-medium">{selectedData.pembeli}</p>
                     </div>
                     <div>
                       <p className="text-sm text-slate-500 mb-1">Status Pembayaran</p>
                       <p className="font-medium text-[#2196F3]">{selectedData.status}</p>
                     </div>
                   </div>
                   <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                     <p className="text-sm text-slate-500 mb-2">Item Dibeli</p>
                     <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                       <span className="font-medium">{selectedData.produk} x{selectedData.jumlah}</span>
                       <span className="font-bold">Rp {(selectedData.total / selectedData.jumlah)?.toLocaleString('id-ID')}</span>
                     </div>
                   </div>
                   <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                     <div className="flex justify-between items-center">
                       <span className="font-medium text-emerald-800 dark:text-emerald-300">Total Pendapatan</span>
                       <span className="text-2xl font-bold text-emerald-600">Rp {selectedData.total?.toLocaleString('id-ID')}</span>
                     </div>
                     <div className="flex justify-between items-center mt-2 text-sm text-emerald-700/70 dark:text-emerald-400/70">
                       <span>Metode Pembayaran</span>
                       <span>{selectedData.metode}</span>
                     </div>
                   </div>
                </div>
                <div className="mt-6 flex gap-3">
                   <button onClick={() => setSelectedData(null)} className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors">Tutup</button>
                   <button onClick={() => { handleDownload(); setSelectedData(null); }} className="flex-1 px-4 py-3 bg-[#2196F3] hover:bg-blue-600 text-white rounded-xl font-medium transition-colors">Cetak Struk</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
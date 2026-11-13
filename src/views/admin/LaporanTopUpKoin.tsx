import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, Search, Edit, Trash2, Eye, X } from 'lucide-react';
import { RpIcon } from '../../components/ui/RpIcon';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAppContext } from '../../AppContext';
import { useIsMobile } from '../../App';
import { MobileBottomSheet } from '../../components/ui/MobileBottomSheet';
export function LaporanTopUpKoin() {
  const { showNotification } = useAppContext();
  const isMobile = useIsMobile();
  
  const [topUpList, setTopUpList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('Semua');
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  // Edit States
  const [editNominal, setEditNominal] = useState(0);
  useEffect(() => {
    const loadData = () => {
      const list = JSON.parse(localStorage.getItem('sd_topup_koin_list') || '[]');
      setTopUpList(list);
    };
    loadData();
    window.addEventListener('localStorageUpdate', loadData);
    return () => window.removeEventListener('localStorageUpdate', loadData);
  }, []);
  const handleDelete = (id: string) => {
    const updated = topUpList.filter(t => t.id !== id);
    setTopUpList(updated);
    localStorage.setItem('sd_topup_koin_list', JSON.stringify(updated));
    setShowDeleteConfirm(null);
    showNotification("Data berhasil dihapus");
  };
  const getSiswaName = (s: any) => s?.fullName || s?.nama_lengkap || s?.username || s?.nama || '-';
  const getSiswaRole = (s: any) => s?.userRole || s?.role || 'Siswa';
  const displayList = topUpList.filter(item => {
    const matchQ = (getSiswaName(item.siswa).toLowerCase().includes(searchQuery.toLowerCase()) || 
                   (item.kode || '').toLowerCase().includes(searchQuery.toLowerCase()));
    
    let roleMatch = true;
    if (filterRole !== 'Semua') roleMatch = getSiswaRole(item.siswa) === filterRole;
    
    return matchQ && roleMatch;
  });
  const handleDownloadExcel = () => {
    import('xlsx').then((XLSX) => {
      import('../../utils/kopHelper').then(({ getKopConfig }) => {
        const config = getKopConfig('excel');
        const kopRows = [
          [config.sekolahName],
          [config.address],
          [config.contact + (config.website ? ` | ${config.website}` : '')],
          [''],
          ['LAPORAN TOP UP KOIN'],
          [''],
          ['Tanggal', 'Kode', 'Role', 'Nama', 'Koin Sebelum', 'Nominal TopUp', 'Koin Sesudah', 'Petugas']
        ];
        
        const dataRows = displayList.map(item => [
          item.tanggal, item.kode, getSiswaRole(item.siswa), getSiswaName(item.siswa), item.koinSebelum, item.nominal, item.koinSesudah, item.petugas
        ]);
        const ws = XLSX.utils.aoa_to_sheet([...kopRows, ...dataRows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laporan TopUp");
        XLSX.writeFile(wb, `Laporan_TopUp_Koin_${new Date().getTime()}.xlsx`);
      });
    });
  };
  const handleDownloadPDF = () => {
    import('../../utils/kopHelper').then(({ applyPdfKop }) => {
      const doc = new jsPDF('landscape');
      const startY = applyPdfKop(doc);
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Laporan Top Up Koin Sekolah", 14, startY + 5);
      
      autoTable(doc, {
        startY: startY + 10,
        head: [['Tanggal', 'Kode', 'Role', 'Nama', 'Koin Sblm', 'Top Up', 'Total Koin', 'Petugas']],
        body: displayList.map(item => [
          item.tanggal,
          item.kode || '-',
          getSiswaRole(item.siswa),
          getSiswaName(item.siswa),
          item.koinSebelum.toLocaleString('id-ID'),
          item.nominal.toLocaleString('id-ID'),
          item.koinSesudah.toLocaleString('id-ID'),
          item.petugas || '-'
        ])
      });
      doc.save("Laporan_TopUp_Koin.pdf");
    });
  };
  const openView = (item: any) => {
    setSelectedItem(item);
    setIsViewModalOpen(true);
  };
  
  const openEdit = (item: any) => {
    setSelectedItem(item);
    setEditNominal(item.nominal);
    setIsEditModalOpen(true);
  };
  const handleSaveEdit = () => {
    const updatedList = topUpList.map(t => {
      if (t.id === selectedItem.id) {
        return { 
           ...t, 
           nominal: editNominal, 
           koinSesudah: t.koinSebelum + editNominal
        };
      }
      return t;
    });
    setTopUpList(updatedList);
    localStorage.setItem('sd_topup_koin_list', JSON.stringify(updatedList));
    setIsEditModalOpen(false);
    showNotification("Perubahan berhasil disimpan");
  };
  const formatNumber = (val: number) => new Intl.NumberFormat('id-ID').format(val || 0);
  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  const renderEditModal = () => {
    if (!isEditModalOpen || !selectedItem) return null;
    const content = (
      <div className="p-6 space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Akun</label>
          <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl dark:bg-slate-800 dark:border-slate-700 text-slate-500">{getSiswaName(selectedItem.siswa)} ({getSiswaRole(selectedItem.siswa)})</div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Nominal Top Up Koin</label>
          <input type="text" value={editNominal > 0 ? editNominal.toLocaleString('id-ID') : ''} onChange={e => {
            const val = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0;
            setEditNominal(val);
          }} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
          <p className="text-xs text-slate-500 mt-1">Estimasi Koin Sesudah: {formatNumber(selectedItem.koinSebelum + editNominal)}</p>
        </div>
        <button onClick={handleSaveEdit} className="w-full mt-2 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold">Simpan Perubahan</button>
      </div>
    );
    if (isMobile) {
      return (
        <MobileBottomSheet isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Top Up">
          {content}
        </MobileBottomSheet>
      );
    }
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[24px] shadow-2xl relative z-10 flex flex-col overflow-hidden">
           <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Edit Top Up</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><X className="w-4 h-4" /></button>
           </div>
           {content}
        </div>
      </div>,
      document.body
    );
  };
  const renderViewModal = () => {
    if (!isViewModalOpen || !selectedItem) return null;
    const content = (
      <div className="p-6 overflow-y-auto space-y-4 text-sm">
        
        <div className="grid grid-cols-2 gap-4">
           <div>
              <div className="text-xs text-slate-500 mb-1">Kode Transaksi</div>
              <div className="font-medium text-slate-800 dark:text-slate-200">{selectedItem.kode}</div>
           </div>
           <div>
              <div className="text-xs text-slate-500 mb-1">Tanggal</div>
              <div className="font-medium text-slate-800 dark:text-slate-200">{selectedItem.tanggal} {selectedItem.waktu}</div>
           </div>
        </div>
        <div className="space-y-3">
           <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/50 pb-2">
              <span className="text-slate-500">Nama Akun</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{getSiswaName(selectedItem.siswa)}</span>
           </div>
           <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/50 pb-2">
              <span className="text-slate-500">Role</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{getSiswaRole(selectedItem.siswa)}</span>
           </div>
           <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/50 pb-2">
              <span className="text-slate-500">Koin Sebelum</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{formatNumber(selectedItem.koinSebelum)}</span>
           </div>
           <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/50 pb-2 font-bold text-amber-600 dark:text-amber-400">
              <span>Nominal Top Up</span>
              <span>+{formatNumber(selectedItem.nominal)}</span>
           </div>
           <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/50 pb-2 bg-emerald-50/50 dark:bg-emerald-900/20 p-2 rounded-lg font-bold text-emerald-600 dark:text-emerald-400 mt-2">
              <span>Koin Sesudah</span>
              <span>{formatNumber(selectedItem.koinSesudah)}</span>
           </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
           <span>Dibuat oleh: {selectedItem.petugas}</span>
        </div>
      </div>
    );
    if (isMobile) {
      return (
        <MobileBottomSheet isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Top Up">
          {content}
        </MobileBottomSheet>
      );
    }
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[24px] shadow-2xl relative z-10 flex flex-col overflow-hidden max-h-[90vh]">
           <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Detail Top Up</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><X className="w-4 h-4" /></button>
           </div>
           {content}
        </div>
      </div>,
      document.body
    );
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[100vw] overflow-x-hidden pt-safe pb-32">
      <div className="flex flex-col gap-6">
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl shadow-amber-500/20 relative overflow-hidden h-40 sm:h-48 flex flex-col justify-end">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
           <div className="absolute bottom-0 right-10 opacity-20 pointer-events-none transform translate-y-1/4 right-0 rotate-[-15deg]">
              <RpIcon className="w-48 h-48 sm:w-64 sm:h-64" />
           </div>
           
           <div className="relative z-10">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">Laporan Top Up Koin</h1>
              <p className="text-amber-100 font-medium text-sm sm:text-base max-w-sm sm:max-w-md">Data pembelian dan jumlah koin tiap akun/role.</p>
           </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-2 mt-4 z-20">
           <div className="flex flex-col md:flex-row gap-4 items-center w-full lg:w-auto">
             <div className="relative w-full md:w-80 shrink-0 group">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
                <input 
                   type="text" 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder="Cari nama atau kode..." 
                   className="w-full pl-12 pr-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700/50 rounded-2xl outline-none focus:border-amber-500 dark:focus:border-amber-500 text-sm dark:text-white shadow-sm transition-all"
                />
             </div>
             
             <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 no-scrollbar scroll-smooth">
                {['Semua', 'Siswa', 'Guru', 'Tendik', 'Orang Tua'].map((cat, idx) => (
                   <button 
                     key={idx}
                     onClick={() => setFilterRole(cat)}
                     className={`whitespace-nowrap px-4 py-2 rounded-full font-bold text-sm transition-all shadow-sm ${
                       filterRole === cat 
                         ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 border-2 border-transparent' 
                         : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-2 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500'
                     }`}
                   >
                     {cat}
                   </button>
                ))}
             </div>
           </div>
           <div className="flex items-center gap-2 w-full lg:w-auto">
             <button onClick={handleDownloadExcel} className="flex px-4 py-2 flex-1 justify-center items-center gap-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-xl font-bold transition-all text-sm">
               <Download className="w-4 h-4" /> Excel
             </button>
             <button onClick={handleDownloadPDF} className="flex px-4 py-2 flex-1 justify-center items-center gap-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 rounded-xl font-bold transition-all text-sm">
               <Download className="w-4 h-4" /> PDF
             </button>
           </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden text-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700/50">
                  <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Tgl / Kode</th>
                  <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Akun</th>
                  <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">Top Up (IDR/Koin)</th>
                  <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">Total Koin</th>
                  <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {displayList.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-slate-800 dark:text-slate-200 font-medium">{item.tanggal}</div>
                      <div className="text-xs text-slate-500">{item.kode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{getSiswaName(item.siswa)}</div>
                      <div className="text-xs text-slate-500">{getSiswaRole(item.siswa)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-amber-600 dark:text-amber-400">+{formatNumber(item.nominal)} Koin</div>
                      <div className="text-xs text-slate-500">Harga: {formatCurrency(item.nominal)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{formatNumber(item.koinSesudah)}</div>
                      <div className="text-[10px] text-slate-500">Sblm: {formatNumber(item.koinSebelum)}</div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center justify-center gap-2">
                         <button onClick={() => openView(item)} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"><Eye className="w-4 h-4" /></button>
                         <button onClick={() => openEdit(item)} className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20"><Edit className="w-4 h-4" /></button>
                         {showDeleteConfirm === item.id ? (
                            <div className="flex items-center gap-1">
                               <button onClick={() => handleDelete(item.id)} className="px-2 py-1 bg-red-600 text-white rounded text-xs font-bold">Ya</button>
                               <button onClick={() => setShowDeleteConfirm(null)} className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs font-bold">Batal</button>
                            </div>
                         ) : (
                            <button onClick={() => setShowDeleteConfirm(item.id)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"><Trash2 className="w-4 h-4" /></button>
                         )}
                       </div>
                    </td>
                  </tr>
                ))}
                {displayList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500 font-medium">Tidak ada data top up koin.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {renderEditModal()}
      {renderViewModal()}
    </div>
  );
}
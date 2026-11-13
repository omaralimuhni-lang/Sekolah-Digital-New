import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, Search, Edit, Trash2, Eye, ChevronLeft, CheckCircle, Clock as ClockIcon } from 'lucide-react';
import { RpIcon } from '../../components/ui/RpIcon';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAppContext } from '../../AppContext';
import { useIsMobile } from '../../App';
import { MobileBottomSheet } from '../../components/ui/MobileBottomSheet';
export function LaporanPembayaran() {
  const {  showNotification } = useAppContext();
  const isMobile = useIsMobile();
  
  const [pembayaranList, setPembayaranList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  // Edit States
  const [editStatus, setEditStatus] = useState('Lunas');
  const [editNominal, setEditNominal] = useState(0);
  useEffect(() => {
    const loadData = () => {
      const list = JSON.parse(localStorage.getItem('sd_pembayaran_list') || '[]');
      setPembayaranList(list);
    };
    loadData();
    const handleCustomStorageUpdate = () => loadData();
    window.addEventListener('storage', handleCustomStorageUpdate);
    window.addEventListener('localStorageUpdate', handleCustomStorageUpdate);
    return () => {
      window.removeEventListener('storage', handleCustomStorageUpdate);
      window.removeEventListener('localStorageUpdate', handleCustomStorageUpdate);
    };
  }, []);
  const handleDelete = (id: string) => {
    const updated = pembayaranList.filter(p => p.id !== id);
    setPembayaranList(updated);
    localStorage.setItem('sd_pembayaran_list', JSON.stringify(updated));
    setShowDeleteConfirm(null);
    showNotification("Data berhasil dihapus");
  };
  const getSiswaName = (s: any) => s?.name || s?.namaLengkap || s?.nama || '-';
  const getSiswaClass = (s: any) => s?.class || s?.kelas || '-';
  
  // Calculate "Belum Dibayarkan" logic:
  // We'll generate a combined list of actual payments + simulated "Belum Dibayarkan" for SPP this month if requested?
  // Actually, the prompt says data taken from 'sd_pembayaran_list'. We'll just filter that list.
  // "Belum Lunas" or "Belum Dibayarkan" can be derived if we look at status.
  const displayList = pembayaranList.filter(item => {
    const matchQ = (getSiswaName(item.siswa).toLowerCase().includes(searchQuery.toLowerCase()) || 
                   (item.kode || '').toLowerCase().includes(searchQuery.toLowerCase()));
    
    // In InputPembayaran, status is 'Lunas' or 'Belum Lunas'. 
    // Wait, the prompt says "belum dibayarkan". Let's map 'Belum Lunas' to Cicil/Belum.
    let statusMatch = true;
    if (filterStatus === 'Lunas') statusMatch = item.status === 'Lunas';
    if (filterStatus === 'Cicil') statusMatch = item.status === 'Belum Lunas';
    if (filterStatus === 'Belum Dibayarkan') statusMatch = item.status === 'Belum Dibayarkan' || item.status === 'Belum Lunas'; // Treat as same for now since we don't have true 'belom'
    
    return matchQ && statusMatch;
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
          ['LAPORAN PEMBAYARAN'],
          [''],
          ['Tanggal', 'Kode', 'Siswa', 'Kelas', 'Jenis', 'Bulan', 'Total Tagihan', 'Dibayar', 'Sisa', 'Status', 'Metode', 'Petugas']
        ];
        
        const dataRows = displayList.map(item => [
          item.tanggal, item.kode, getSiswaName(item.siswa), getSiswaClass(item.siswa), item.jenis, item.bulan || '-', item.nominalTagihanSaatIni, item.nominalDibayar, item.sisaTagihan, item.status, item.metode, item.petugas
        ]);
        const ws = XLSX.utils.aoa_to_sheet([...kopRows, ...dataRows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laporan Pembayaran");
        XLSX.writeFile(wb, `Laporan_Pembayaran_${new Date().getTime()}.xlsx`);
      });
    });
  };
  const handleDownloadPDF = () => {
    import('../../utils/kopHelper').then(({ applyPdfKop }) => {
      const doc = new jsPDF('landscape');
      const startY = applyPdfKop(doc);
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Laporan Pembayaran Sekolah", 14, startY + 5);
      
      autoTable(doc, {
        startY: startY + 10,
        head: [['Tanggal', 'Siswa', 'Kls', 'Jenis', 'Bulan', 'Tagihan', 'Dibayar', 'Sisa', 'Status', 'Metode', 'Petugas']],
        body: displayList.map(item => [
          item.tanggal,
          getSiswaName(item.siswa),
          getSiswaClass(item.siswa) || '-',
          item.jenis,
          item.bulan || '-',
          `Rp ${(item.nominalTagihanSaatIni || 0).toLocaleString('id-ID')}`,
          `Rp ${(item.nominalDibayar || 0).toLocaleString('id-ID')}`,
          `Rp ${(item.sisaTagihan || 0).toLocaleString('id-ID')}`,
          item.status,
          item.metode || '-',
          item.petugas || '-'
        ]),
        styles: { fontSize: 8 }
      });
      doc.save("Laporan_Pembayaran.pdf");
    });
  };
  const openView = (item: any) => {
    setSelectedItem(item);
    setIsViewModalOpen(true);
  };
  
  const openEdit = (item: any) => {
    setSelectedItem(item);
    setEditStatus(item.status);
    setEditNominal(item.nominalDibayar);
    setIsEditModalOpen(true);
  };
  const handleSaveEdit = () => {
    const sisa = selectedItem.nominalTagihanSaatIni - editNominal;
    const finalStatus = editNominal >= selectedItem.nominalTagihanSaatIni ? 'Lunas' : editStatus;
    
    const updatedList = pembayaranList.map(p => {
      if (p.id === selectedItem.id) {
        return { ...p, status: finalStatus, nominalDibayar: editNominal, sisaTagihan: sisa };
      }
      return p;
    });
    setPembayaranList(updatedList);
    localStorage.setItem('sd_pembayaran_list', JSON.stringify(updatedList));
    setIsEditModalOpen(false);
    showNotification("Perubahan berhasil disimpan");
  };
  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  const renderEditModal = () => {
    if (!isEditModalOpen || !selectedItem) return null;
    const content = (
      <div className="p-6 space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Siswa</label>
          <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl dark:bg-slate-800 dark:border-slate-700 text-slate-500">{getSiswaName(selectedItem.siswa)}</div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Nominal Dibayar</label>
          <input type="text" value={editNominal > 0 ? editNominal.toLocaleString('id-ID') : ''} onChange={e => {
            const val = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0;
            setEditNominal(val);
          }} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
          <p className="text-xs text-slate-500 mt-1">Total Tagihan: {formatCurrency(selectedItem.nominalTagihanSaatIni)}</p>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Status</label>
          <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white">
            <option value="Lunas">Lunas</option>
            <option value="Belum Lunas">Belum Lunas (Cicil)</option>
            <option value="Belum Dibayarkan">Belum Dibayarkan</option>
          </select>
        </div>
        <button onClick={handleSaveEdit} className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">Simpan Perubahan</button>
      </div>
    );
    if (isMobile) {
      return (
        <MobileBottomSheet isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Pembayaran">
          {content}
        </MobileBottomSheet>
      );
    }
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[24px] shadow-2xl relative z-10 flex flex-col overflow-hidden max-h-[90vh]">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl z-10">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Edit Pembayaran</h2>
            <button onClick={() => setIsEditModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto w-full no-scrollbar">
             {content}
          </div>
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
        
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
           <div className="text-xs text-slate-500 mb-1">Identitas Siswa</div>
           <div className="font-bold text-base text-slate-800 dark:text-slate-200">{getSiswaName(selectedItem.siswa)}</div>
           <div className="text-slate-600 dark:text-slate-400">Kelas {getSiswaClass(selectedItem.siswa)} | NIS/NISN: {selectedItem.siswa?.nis || selectedItem.siswa?.nisn || '-'}</div>
           {(selectedItem.siswa?.namaAyah || selectedItem.siswa?.namaIbu) && (
              <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                 Ortu: {selectedItem.siswa?.namaAyah || selectedItem.siswa?.namaIbu} {selectedItem.siswa?.noTlp && `(${selectedItem.siswa?.noTlp})`}
              </div>
           )}
        </div>
        <div className="space-y-3">
           <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/50 pb-2">
              <span className="text-slate-500">Jenis Pembayaran</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{selectedItem.jenis} {selectedItem.bulan ? `(${selectedItem.bulan})` : ''}</span>
           </div>
           <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/50 pb-2">
              <span className="text-slate-500">Nominal Dasar Tagihan</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{formatCurrency(selectedItem.nominalTotal || selectedItem.nominalTagihanSaatIni)}</span>
           </div>
           <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/50 pb-2">
              <span className="text-slate-500">Tagihan Saat Ini</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{formatCurrency(selectedItem.nominalTagihanSaatIni)}</span>
           </div>
           <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/50 pb-2">
              <span className="text-slate-500">Nominal Dibayar</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(selectedItem.nominalDibayar)}</span>
           </div>
           <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/50 pb-2">
              <span className="text-slate-500">Sisa Tagihan</span>
              <span className="font-medium text-rose-500">{formatCurrency(selectedItem.sisaTagihan)}</span>
           </div>
           <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/50 pb-2">
              <span className="text-slate-500">Metode</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                 {selectedItem.metode}
                 {selectedItem.metode === 'Cicil' && selectedItem.cicilanKe && ` (Cicilan ke-${selectedItem.cicilanKe})`}
              </span>
           </div>
           <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <span className={`font-bold ${selectedItem.status === 'Lunas' ? 'text-emerald-500' : 'text-amber-500'}`}>{selectedItem.status}</span>
           </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
           <span>Petugas: {selectedItem.petugas}</span>
        </div>
      </div>
    );
    if (isMobile) {
      return (
        <MobileBottomSheet isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Pembayaran">
          {content}
        </MobileBottomSheet>
      );
    }
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[24px] shadow-2xl relative z-10 flex flex-col overflow-hidden max-h-[90vh]">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl z-10">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Detail Pembayaran</h2>
            <button onClick={() => setIsViewModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto w-full no-scrollbar">
             {content}
          </div>
        </div>
      </div>,
      document.body
    );
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[100vw] overflow-x-hidden pt-safe pb-32">
      <div className="flex flex-col gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden h-40 sm:h-48 md:h-56 flex flex-col justify-end">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
           <div className="absolute bottom-0 right-10 opacity-20 pointer-events-none transform translate-y-1/4 right-0 rotate-[-15deg]">
              <RpIcon className="w-48 h-48 sm:w-64 sm:h-64" />
           </div>
           
           <div className="relative z-10">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">Laporan Pembayaran</h1>
              <p className="text-blue-100 font-medium text-sm sm:text-base max-w-sm sm:max-w-md">Data pembayaran siswa, status lunas, dan cicilan.</p>
           </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-2 mt-4 z-20">
           <div className="flex flex-col md:flex-row gap-4 items-center w-full lg:w-auto">
             <div className="relative w-full md:w-80 shrink-0 group">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input 
                   type="text" 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder="Cari siswa atau kode..." 
                   className="w-full pl-12 pr-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700/50 rounded-2xl outline-none focus:border-blue-500 dark:focus:border-blue-500 text-sm dark:text-white shadow-sm transition-all"
                />
             </div>
             
             <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 no-scrollbar scroll-smooth">
                {['Semua', 'Lunas', 'Cicil', 'Belum Dibayarkan'].map((cat, idx) => (
                   <button 
                     key={idx}
                     onClick={() => setFilterStatus(cat)}
                     className={`whitespace-nowrap px-4 py-2 rounded-full font-bold text-sm transition-all shadow-sm ${
                       filterStatus === cat 
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
                  <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Siswa</th>
                  <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Pembayaran</th>
                  <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">Nominal</th>
                  <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Status</th>
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
                      <div className="text-xs text-slate-500">Kelas {getSiswaClass(item.siswa)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 dark:text-slate-200 font-medium">{item.jenis}</div>
                      <div className="text-xs text-slate-500">{item.bulan || item.metode}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(item.nominalDibayar)}</div>
                      {item.sisaTagihan > 0 && <div className="text-xs text-rose-500">Sisa: {formatCurrency(item.sisaTagihan)}</div>}
                    </td>
                    <td className="px-6 py-4">
                       <span className={`inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full ${
                          item.status === 'Lunas' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                       }`}>
                         {item.status === 'Lunas' ? <CheckCircle className="w-3 h-3" /> : <ClockIcon className="w-3 h-3" />}
                         {item.status}
                       </span>
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
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-500 font-medium">Tidak ada data pembayaran.</td>
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
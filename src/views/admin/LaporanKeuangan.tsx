import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, Search, Edit, Trash2, Eye, X, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { RpIcon } from '../../components/ui/RpIcon';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAppContext } from '../../AppContext';
import { useIsMobile } from '../../App';
import { MobileBottomSheet } from '../../components/ui/MobileBottomSheet';
export function LaporanKeuangan() {
  const { showNotification } = useAppContext();
  const isMobile = useIsMobile();
  
  const [activeTab, setActiveTab] = useState('Pemasukan'); // Pemasukan, Pengeluaran, Global
  
  const [pembayaranList, setPembayaranList] = useState<any[]>([]);
  const [pemasukanList, setPemasukanList] = useState<any[]>([]);
  const [pengeluaranList, setPengeluaranList] = useState<any[]>([]);
  const [topUpKoinList, setTopUpKoinList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  // Edit States for generic edit based on type
  const [editNominal, setEditNominal] = useState(0);
  const [editKeterangan, setEditKeterangan] = useState('');
  const loadData = () => {
    setPembayaranList(JSON.parse(localStorage.getItem('sd_pembayaran_list') || '[]'));
    setPemasukanList(JSON.parse(localStorage.getItem('sd_pemasukan_list') || '[]'));
    setPengeluaranList(JSON.parse(localStorage.getItem('sd_pengeluaran_list') || '[]'));
    setTopUpKoinList(JSON.parse(localStorage.getItem('sd_topup_koin_list') || '[]'));
  };
  useEffect(() => {
    loadData();
  }, []);
  const getSiswaName = (s: any) => s?.name || s?.namaLengkap || s?.nama || '-';
  // Normalize data for combined views
  const normalizedPemasukan = [
    ...pembayaranList.map(p => ({
      ...p,
      _type: 'Pembayaran Siswa',
      _title: `Pembayaran ${p.jenis} - ${getSiswaName(p.siswa)}`,
      _nominal: p.nominalDibayar || 0,
      _date: p.tanggal,
    })),
    ...topUpKoinList.map(p => ({
      ...p,
      _type: 'Pemasukan Top Up Koin',
      _title: `Top Up Koin - ${getSiswaName(p.siswa)}`,
      _nominal: p.nominal || 0,
      _date: p.tanggal,
    })),
    ...pemasukanList.map(p => ({
      ...p,
      _type: 'Pemasukan Lainnya',
      _title: p.nama,
      _nominal: p.nominal || 0,
      _date: p.tanggal,
    }))
  ].sort((a, b) => new Date(b._date).getTime() - new Date(a._date).getTime());
  const normalizedPengeluaran = pengeluaranList.map(p => ({
    ...p,
    _type: 'Pengeluaran',
    _title: p.nama,
    _nominal: p.nominal || 0,
    _date: p.tanggal,
  })).sort((a, b) => new Date(b._date).getTime() - new Date(a._date).getTime());
  const globalData = [
    ...normalizedPemasukan.map(p => ({ ...p, _flow: 'in' })),
    ...normalizedPengeluaran.map(p => ({ ...p, _flow: 'out' }))
  ].sort((a, b) => new Date(b._date).getTime() - new Date(a._date).getTime());
  const totalPemasukan = normalizedPemasukan.reduce((acc, curr) => acc + curr._nominal, 0);
  const totalPengeluaran = normalizedPengeluaran.reduce((acc, curr) => acc + curr._nominal, 0);
  const saldoBersih = totalPemasukan - totalPengeluaran;
  const handleDelete = (item: any) => {
    if (item._type === 'Pembayaran Siswa') {
      const updated = pembayaranList.filter(p => p.id !== item.id);
      localStorage.setItem('sd_pembayaran_list', JSON.stringify(updated));
    } else if (item._type === 'Pemasukan Top Up Koin') {
      const updated = topUpKoinList.filter(p => p.id !== item.id);
      localStorage.setItem('sd_topup_koin_list', JSON.stringify(updated));
    } else if (item._type === 'Pemasukan Lainnya') {
      const updated = pemasukanList.filter(p => p.id !== item.id);
      localStorage.setItem('sd_pemasukan_list', JSON.stringify(updated));
    } else if (item._type === 'Pengeluaran') {
      const updated = pengeluaranList.filter(p => p.id !== item.id);
      localStorage.setItem('sd_pengeluaran_list', JSON.stringify(updated));
    }
    loadData();
    setShowDeleteConfirm(null);
    showNotification("Data berhasil dihapus");
  };
  const currentListData = activeTab === 'Pemasukan' ? normalizedPemasukan 
    : activeTab === 'Pengeluaran' ? normalizedPengeluaran 
    : globalData;
  const displayList = currentListData.filter(item => {
    const searchString = searchQuery.toLowerCase();
    return (item._title?.toLowerCase().includes(searchString) || 
            (item.kode || '').toLowerCase().includes(searchString) ||
            item._type.toLowerCase().includes(searchString));
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
          [`LAPORAN KEUANGAN - ${activeTab.toUpperCase()}`],
          [''],
          ['Tanggal', 'Kode', 'Kategori', 'Sumber/Tujuan', 'Keterangan', 'Nominal', 'Tipe']
        ];
        
        const dataRows = displayList.map(item => {
          let flowType = item._type === 'Pengeluaran' ? 'Keluar' : 'Masuk';
          let ket = item.keterangan || item.bulan || '-';
          return [item._date, item.kode || '-', item._type, item._title, ket, item._nominal, flowType];
        });
        const totals: any[][] = [];
        if (activeTab === 'Pemasukan') {
           totals.push(['', '', '', '', 'Total Pemasukan', totalPemasukan, '']);
        } else if (activeTab === 'Pengeluaran') {
           totals.push(['', '', '', '', 'Total Pengeluaran', totalPengeluaran, '']);
        } else {
           totals.push(['', '', '', '', 'Total Pemasukan', totalPemasukan, '']);
           totals.push(['', '', '', '', 'Total Pengeluaran', totalPengeluaran, '']);
           totals.push(['', '', '', '', 'Saldo Bersih', saldoBersih, '']);
        }
        const ws = XLSX.utils.aoa_to_sheet([...kopRows, ...dataRows, [], ...totals]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laporan Keuangan");
        XLSX.writeFile(wb, `Laporan_Keuangan_${activeTab}_${new Date().getTime()}.xlsx`);
      });
    });
  };
  const handleDownloadPDF = () => {
    import('../../utils/kopHelper').then(({ applyPdfKop }) => {
      const doc = new jsPDF('landscape');
      const startY = applyPdfKop(doc);
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`Laporan Keuangan Sekolah - ${activeTab}`, 14, startY + 5);
      
      autoTable(doc, {
        startY: startY + 10,
        head: [['Tanggal', 'Kode', 'Kategori', 'Uraian', 'Keterangan', 'Nominal', 'Tipe']],
        body: displayList.map(item => [
          item._date,
          item.kode || '-',
          item._type,
          item._title,
          item.keterangan || item.bulan || '-',
          `Rp ${(item._nominal || 0).toLocaleString('id-ID')}`,
          item._type === 'Pengeluaran' ? 'Keluar' : 'Masuk'
        ]),
        foot: [
          ['', '', '', '', 'Total', `Rp ${displayList.reduce((sum, i) => sum + i._nominal, 0).toLocaleString('id-ID')}`, '']
        ],
        footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
      });
      
      if (activeTab === 'Global') {
         const finalY = (doc as any).lastAutoTable.finalY + 10;
         doc.text(`Ringkasan Global:`, 14, finalY);
         doc.setFont("helvetica", "normal");
         doc.text(`Total Pemasukan: Rp ${totalPemasukan.toLocaleString('id-ID')}`, 14, finalY + 8);
         doc.text(`Total Pengeluaran: Rp ${totalPengeluaran.toLocaleString('id-ID')}`, 14, finalY + 16);
         doc.setFont("helvetica", "bold");
         doc.text(`Saldo Bersih: Rp ${saldoBersih.toLocaleString('id-ID')}`, 14, finalY + 24);
      }
      
      doc.save(`Laporan_Keuangan_${activeTab}.pdf`);
    });
  };
  const openView = (item: any) => {
    setSelectedItem(item);
    setIsViewModalOpen(true);
  };
  
  const openEdit = (item: any) => {
    setSelectedItem(item);
    setEditNominal(item._nominal);
    setEditKeterangan(item.keterangan || '');
    setIsEditModalOpen(true);
  };
  const handleSaveEdit = () => {
    if (selectedItem._type === 'Pembayaran Siswa') {
       const updatedList = pembayaranList.map(p => {
         if (p.id === selectedItem.id) {
           return { ...p, nominalDibayar: editNominal, sisaTagihan: p.nominalTagihanSaatIni - editNominal };
         }
         return p;
       });
       localStorage.setItem('sd_pembayaran_list', JSON.stringify(updatedList));
    } else if (selectedItem._type === 'Pemasukan Top Up Koin') {
       const updatedList = topUpKoinList.map(p => {
         if (p.id === selectedItem.id) {
           return { ...p, nominal: editNominal };
         }
         return p;
       });
       localStorage.setItem('sd_topup_koin_list', JSON.stringify(updatedList));
    } else if (selectedItem._type === 'Pemasukan Lainnya') {
       const updatedList = pemasukanList.map(p => {
         if (p.id === selectedItem.id) {
           return { ...p, nominal: editNominal, keterangan: editKeterangan };
         }
         return p;
       });
       localStorage.setItem('sd_pemasukan_list', JSON.stringify(updatedList));
    } else if (selectedItem._type === 'Pengeluaran') {
       const updatedList = pengeluaranList.map(p => {
         if (p.id === selectedItem.id) {
           return { ...p, nominal: editNominal, keterangan: editKeterangan };
         }
         return p;
       });
       localStorage.setItem('sd_pengeluaran_list', JSON.stringify(updatedList));
    }
    loadData();
    setIsEditModalOpen(false);
    showNotification("Perubahan berhasil disimpan");
  };
  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  const renderEditModal = () => {
    if (!isEditModalOpen || !selectedItem) return null;
    const content = (
      <div className="p-6 space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Uraian / Tujuan</label>
          <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl dark:bg-slate-800 dark:border-slate-700 text-slate-500 line-clamp-2">{selectedItem._title}</div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Nominal</label>
          <input type="text" value={editNominal > 0 ? editNominal.toLocaleString('id-ID') : ''} onChange={e => {
            const val = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0;
            setEditNominal(val);
          }} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
        </div>
        {selectedItem._type !== 'Pembayaran Siswa' && (
          <div>
            <label className="text-sm font-medium mb-1.5 block">Keterangan</label>
            <textarea rows={3} value={editKeterangan} onChange={e => setEditKeterangan(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white resize-none" />
          </div>
        )}
        <button onClick={handleSaveEdit} className="w-full mt-2 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold">Simpan Perubahan</button>
      </div>
    );
    if (isMobile) {
      return (
        <MobileBottomSheet isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit ${selectedItem._type}`}>
          {content}
        </MobileBottomSheet>
      );
    }
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[24px] shadow-2xl relative z-10 flex flex-col overflow-hidden">
           <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Edit {selectedItem._type}</h2>
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
        
        {selectedItem.filePreview && (
           <div className="w-full h-40 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden mb-4">
             <img src={selectedItem.filePreview} alt="Bukti" className="w-full h-full object-cover rounded-xl" />
           </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
           <div>
              <div className="text-xs text-slate-500 mb-1">Kode Transaksi</div>
              <div className="font-medium text-slate-800 dark:text-slate-200">{selectedItem.kode || '-'}</div>
           </div>
           <div>
              <div className="text-xs text-slate-500 mb-1">Tanggal</div>
              <div className="font-medium text-slate-800 dark:text-slate-200">{selectedItem._date} {selectedItem.waktu}</div>
           </div>
        </div>
        <div className="space-y-3">
           <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/50 pb-2">
              <span className="text-slate-500">Kategori</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{selectedItem._type}</span>
           </div>
           <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/50 pb-2">
              <span className="text-slate-500">Uraian / Tujuan</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 max-w-[200px] text-right">{selectedItem._title}</span>
           </div>
           <div className={`flex justify-between border-b border-slate-100 dark:border-slate-700/50 pb-2 p-2 rounded-lg font-bold ${
               selectedItem._flow === 'out' || selectedItem._type === 'Pengeluaran' ? 'bg-rose-50/50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400' : 'bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
           }`}>
              <span>Nominal</span>
              <span>{selectedItem._flow === 'out' || selectedItem._type === 'Pengeluaran' ? '-' : '+'}{formatCurrency(selectedItem._nominal)}</span>
           </div>
           
           <div className="pt-2">
              <span className="text-slate-500 block mb-1">Keterangan:</span>
              <p className="font-medium text-slate-800 dark:text-slate-200 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">{selectedItem.keterangan || selectedItem.bulan || '-'}</p>
           </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
           <span>Petugas: {selectedItem.petugas || 'Admin'}</span>
        </div>
      </div>
    );
    if (isMobile) {
      return (
        <MobileBottomSheet isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Keuangan">
          {content}
        </MobileBottomSheet>
      );
    }
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[24px] shadow-2xl relative z-10 flex flex-col overflow-hidden max-h-[90vh]">
           <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Detail Keuangan</h2>
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
        <div className="bg-gradient-to-br from-violet-600 to-fuchsia-700 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl shadow-violet-500/20 relative overflow-hidden h-40 sm:h-48 md:h-56 flex flex-col justify-end">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
           <div className="absolute bottom-0 right-10 opacity-20 pointer-events-none transform translate-y-1/4 right-0 rotate-[-15deg]">
              <RpIcon className="w-48 h-48 sm:w-64 sm:h-64" />
           </div>
           
           <div className="relative z-10">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">Laporan Keuangan</h1>
              <p className="text-violet-100 font-medium text-sm sm:text-base max-w-sm sm:max-w-md">Data rekapitulasi pemasukan, pengeluaran, dan saldo bersih.</p>
           </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 -mt-10 mx-4 sm:mx-8 relative z-20">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg shadow-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20">
               <div className="flex items-center gap-3 mb-2">
                 <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                   <ArrowUpRight className="w-5 h-5" />
                 </div>
                 <h3 className="font-bold text-slate-700 dark:text-slate-300">Total Pemasukan</h3>
               </div>
               <p className="text-2xl font-extrabold text-slate-800 dark:text-white mt-2">{formatCurrency(totalPemasukan)}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg shadow-rose-500/5 border border-rose-100 dark:border-rose-500/20">
               <div className="flex items-center gap-3 mb-2">
                 <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                   <ArrowDownRight className="w-5 h-5" />
                 </div>
                 <h3 className="font-bold text-slate-700 dark:text-slate-300">Total Pengeluaran</h3>
               </div>
               <p className="text-2xl font-extrabold text-slate-800 dark:text-white mt-2">{formatCurrency(totalPengeluaran)}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg shadow-blue-500/5 border border-blue-100 dark:border-blue-500/20">
               <div className="flex items-center gap-3 mb-2">
                 <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                   <Activity className="w-5 h-5" />
                 </div>
                 <h3 className="font-bold text-slate-700 dark:text-slate-300">Saldo Bersih</h3>
               </div>
               <p className={`text-2xl font-extrabold mt-2 ${saldoBersih >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>{formatCurrency(saldoBersih)}</p>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-2 flex gap-2 border border-slate-100 dark:border-slate-700 shadow-sm mt-4 overflow-x-auto no-scrollbar">
          {['Pemasukan', 'Pengeluaran', 'Global'].map((tab) => (
             <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[120px] py-3 px-4 rounded-2xl font-bold text-sm transition-all text-center whitespace-nowrap ${
                  activeTab === tab 
                    ? 'bg-violet-500 text-white shadow-md' 
                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
             >
                {tab === 'Global' ? 'Semua Keuangan' : `Data ${tab}`}
             </button>
          ))}
        </div>
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-2 z-20">
           <div className="flex flex-col md:flex-row gap-4 items-center w-full lg:w-auto">
             <div className="relative w-full md:w-80 shrink-0 group">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors" />
                <input 
                   type="text" 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder="Cari uraian atau kode..." 
                   className="w-full pl-12 pr-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700/50 rounded-2xl outline-none focus:border-violet-500 dark:focus:border-violet-500 text-sm dark:text-white shadow-sm transition-all"
                />
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
                  <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Kategori</th>
                  <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Uraian / Tujuan</th>
                  <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">Nominal</th>
                  <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {displayList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-slate-800 dark:text-slate-200 font-medium">{item._date}</div>
                      <div className="text-xs text-slate-500">{item.kode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold ${
                         item._type === 'Pembayaran Siswa' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                         item._type === 'Pemasukan Lainnya' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                         'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                      }`}>
                         {item._type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200 max-w-xs sm:max-w-md truncate">{item._title}</div>
                      <div className="text-xs text-slate-500 truncate">{item.keterangan || item.bulan || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`font-bold ${
                         item._flow === 'out' || item._type === 'Pengeluaran' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                         {item._flow === 'out' || item._type === 'Pengeluaran' ? '-' : '+'}{formatCurrency(item._nominal)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center justify-center gap-2">
                         <button onClick={() => openView(item)} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"><Eye className="w-4 h-4" /></button>
                         <button onClick={() => openEdit(item)} className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20"><Edit className="w-4 h-4" /></button>
                         {showDeleteConfirm === item.id ? (
                            <div className="flex items-center gap-1">
                               <button onClick={() => handleDelete(item)} className="px-2 py-1 bg-red-600 text-white rounded text-xs font-bold">Ya</button>
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
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500 font-medium">Tidak ada data keuangan.</td>
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
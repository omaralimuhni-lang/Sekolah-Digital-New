import React from 'react';
import { useState, useEffect } from 'react';
import { Download, Search, Edit, Trash2, Eye, Store, ChevronLeft } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAppContext } from '../../AppContext';
import { TableVirtuoso } from 'react-virtuoso';
import { useIsMobile } from '../../App';
import { MobileBottomSheet } from '../../components/ui/MobileBottomSheet';
import { createPortal } from 'react-dom';
import { applyPdfKop } from '../../utils/kopHelper';
export function DataTokoSekolah() {
  const { showNotification } = useAppContext();
  const isMobile = useIsMobile();
  
  const [productList, setProductList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJenis, setFilterJenis] = useState('Semua');
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  // Edit States
  const [editNama, setEditNama] = useState('');
  const [editHarga, setEditHarga] = useState(0);
  const [editStok, setEditStok] = useState(0);
  const [editDeskripsi, setEditDeskripsi] = useState('');
  useEffect(() => {
    const loadData = () => {
      const list = JSON.parse(localStorage.getItem('sd_toko_produk_list') || '[]');
      setProductList(list);
    };
    loadData();
    window.addEventListener('localStorageUpdate', loadData);
    return () => window.removeEventListener('localStorageUpdate', loadData);
  }, []);
  const handleDelete = (id: string) => {
    const updated = productList.filter(p => p.id !== id);
    setProductList(updated);
    localStorage.setItem('sd_toko_produk_list', JSON.stringify(updated));
    setShowDeleteConfirm(null);
    showNotification("Data produk toko sekolah berhasil dihapus");
  };
  const getJenisOptions = () => {
     const types = new Set(productList.map(i => i.jenisProduk));
     return ['Semua', ...Array.from(types).filter(Boolean)];
  };
  const displayList = productList.filter(item => {
    const matchQ = (item.namaProduk?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                   (item.kodeProduk || '').toLowerCase().includes(searchQuery.toLowerCase()));
    
    let jenisMatch = true;
    if (filterJenis !== 'Semua') jenisMatch = item.jenisProduk === filterJenis;
    
    return matchQ && jenisMatch;
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
          ['DATA PRODUK TOKO SEKOLAH'],
          [''],
          ['Tanggal', 'Kode', 'Jenis', 'Nama Produk', 'Ukuran', 'Harga', 'Stok', 'Metode Penjualan', 'Petugas']
        ];
        
        let csv = '';
        displayList.forEach(item => {
      csv += `${item.tanggalWaktu},${item.kodeProduk},${item.jenisProduk},"${item.namaProduk}",${item.ukuranProduk || '-'},${item.harga},${item.stok},${item.metodePenjualan},${item.petugas}\n`;
    });
    
        // Instead of executing the loop to string, let's just parse the csv variable into an array of arrays.
        // It's a bit hacky but it avoids writing complex AST parsers.
        const dataRows = csv.trim().split('\n').map(row => row.split(',').map(cell => cell.replace(/^"|"$/g, '').trim()));
        
        const ws = XLSX.utils.aoa_to_sheet([...kopRows, ...dataRows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laporan");
        XLSX.writeFile(wb, `Data_Produk_Toko_Sekolah_${new Date().getTime()}.xlsx`);
      });
    });
  };
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const startY = applyPdfKop(doc);
    doc.text("Data Produk Toko Sekolah", 14, 15);
    autoTable(doc, {
      startY: startY + 10,
      head: [['Kode', 'Jenis', 'Nama Produk', 'Harga', 'Stok', 'Metode']],
      body: displayList.map(item => [
        item.kodeProduk || '-',
        item.jenisProduk || '-',
        item.namaProduk || '-',
        `Rp ${(item.harga || 0).toLocaleString('id-ID')}`,
        item.stok?.toString() || '0',
        item.metodePenjualan || '-'
      ])
    });
    doc.save("Data_Produk_Toko_Sekolah.pdf");
  };
  const openView = (item: any) => {
    setSelectedItem(item);
    setIsViewModalOpen(true);
  };
  
  const openEdit = (item: any) => {
    setSelectedItem(item);
    setEditNama(item.namaProduk);
    setEditHarga(item.harga || 0);
    setEditStok(item.stok || 0);
    setEditDeskripsi(item.deskripsi || '');
    setIsEditModalOpen(true);
  };
  const handleSaveEdit = () => {
    const updatedList = productList.map(p => {
      if (p.id === selectedItem.id) {
        return { ...p, namaProduk: editNama, harga: editHarga, stok: editStok, deskripsi: editDeskripsi };
      }
      return p;
    });
    setProductList(updatedList);
    localStorage.setItem('sd_toko_produk_list', JSON.stringify(updatedList));
    setIsEditModalOpen(false);
    showNotification("Perubahan berhasil disimpan");
  };
  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  const renderEditModal = () => {
    if (!isEditModalOpen || !selectedItem) return null;
    const content = (
      <div className="p-6 space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Kode & Kategori</label>
          <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl dark:bg-slate-800 dark:border-slate-700 text-slate-500">[{selectedItem.kodeProduk}] {selectedItem.jenisProduk}</div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Nama Produk</label>
          <input type="text" value={editNama} onChange={e => setEditNama(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
        </div>
        <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="text-sm font-medium mb-1.5 block">Harga</label>
             <input type="text" value={editHarga > 0 ? editHarga.toLocaleString('id-ID') : ''} onChange={e => {
               const val = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0;
               setEditHarga(val);
             }} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
           </div>
           <div>
             <label className="text-sm font-medium mb-1.5 block">Stok</label>
             <input type="number" value={editStok} onChange={e => setEditStok(Number(e.target.value))} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
           </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Deskripsi</label>
          <textarea rows={3} value={editDeskripsi} onChange={e => setEditDeskripsi(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white resize-none" />
        </div>
        <button onClick={handleSaveEdit} className="w-full mt-2 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold">Simpan Perubahan</button>
      </div>
    );
    if (isMobile) {
      return (
        <MobileBottomSheet isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Data Produk">
          {content}
        </MobileBottomSheet>
      );
    }
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[24px] shadow-2xl relative z-10 flex flex-col overflow-hidden max-h-[90vh]">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl z-10">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Edit Data Produk</h2>
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
              <div className="font-medium text-slate-800 dark:text-slate-200">{selectedItem.kodeProduk}</div>
           </div>
           <div>
              <div className="text-xs text-slate-500 mb-1">Tanggal Input</div>
              <div className="font-medium text-slate-800 dark:text-slate-200">{selectedItem.tanggalWaktu}</div>
           </div>
        </div>
        <div className="space-y-3 pt-2">
           <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/50 pb-2">
              <span className="text-slate-500">Nama Produk</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-right">{selectedItem.namaProduk}</span>
           </div>
           <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/50 pb-2">
              <span className="text-slate-500">Kategori</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{selectedItem.jenisProduk}</span>
           </div>
           {selectedItem.ukuranProduk && (
             <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/50 pb-2">
                <span className="text-slate-500">Ukuran / Varian</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{selectedItem.ukuranProduk}</span>
             </div>
           )}
           <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/50 pb-2 font-bold text-pink-600 dark:text-pink-400">
              <span className="text-slate-500">Harga Satuan</span>
              <span>{formatCurrency(selectedItem.harga)}</span>
           </div>
           <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/50 pb-2">
              <span className="text-slate-500">Stok Tersedia</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{selectedItem.stok}</span>
           </div>
           <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/50 pb-2">
              <span className="text-slate-500">Metode Penjualan</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{selectedItem.metodePenjualan}</span>
           </div>
           
           <div className="pt-2">
              <span className="text-slate-500 block mb-1">Deskripsi:</span>
              <p className="font-medium text-slate-800 dark:text-slate-200 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">{selectedItem.deskripsi || '-'}</p>
           </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
           <span>Petugas: {selectedItem.petugas || '-'}</span>
        </div>
      </div>
    );
    if (isMobile) {
      return (
        <MobileBottomSheet isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Produk">
          {content}
        </MobileBottomSheet>
      );
    }
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[24px] shadow-2xl relative z-10 flex flex-col overflow-hidden max-h-[90vh]">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl z-10">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Detail Produk</h2>
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
        <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl shadow-pink-500/20 relative overflow-hidden h-40 sm:h-48 flex flex-col justify-end">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
           <div className="absolute bottom-0 right-10 opacity-20 pointer-events-none transform translate-y-1/4 right-0 rotate-[-15deg]">
              <Store className="w-48 h-48 sm:w-64 sm:h-64" />
           </div>
           
           <div className="relative z-10">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">Data Toko Sekolah</h1>
              <p className="text-pink-100 font-medium text-sm sm:text-base max-w-sm sm:max-w-md">Kelola seluruh produk perlengkapan sekolah.</p>
           </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-2 mt-4 z-20">
           <div className="flex flex-col md:flex-row gap-4 items-center w-full lg:w-auto">
             <div className="relative w-full md:w-80 shrink-0 group">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pink-600 transition-colors" />
                <input 
                   type="text" 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder="Cari nama produk atau kode..." 
                   className="w-full pl-12 pr-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700/50 rounded-2xl outline-none focus:border-pink-500 dark:focus:border-pink-500 text-sm dark:text-white shadow-sm transition-all"
                />
             </div>
             
             <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 no-scrollbar scroll-smooth">
                {getJenisOptions().map((cat: any, idx: number) => (
                   <button 
                     key={idx}
                     onClick={() => setFilterJenis(cat)}
                     className={`whitespace-nowrap px-4 py-2 rounded-full font-bold text-sm transition-all shadow-sm ${
                       filterJenis === cat 
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
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden text-sm h-[calc(100vh-280px)] min-h-[400px]">
          <TableVirtuoso
            data={displayList}
            className="w-full h-full text-left"
            components={{
              Table: ({ style, ...props }: any) => <table {...props} className="w-full text-left border-collapse" style={{ ...style, width: "100%", margin: 0 }} />,
              TableHead: React.forwardRef((props: any, ref) => <thead {...props} ref={ref} className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700/50 sticky top-0 z-10" />),
              TableRow: (props: any) => <tr {...props} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800" />,
              TableBody: React.forwardRef((props: any, ref) => <tbody {...props} ref={ref} className="divide-y divide-slate-100 dark:divide-slate-700/50 bg-white dark:bg-slate-800" />),
            }}
            fixedHeaderContent={() => (
              <tr>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50 m-0">Kode</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50 m-0">Nama Produk</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50 m-0">Kategori / Ukuran</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right bg-slate-50 dark:bg-slate-900/50 m-0">Harga</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-center bg-slate-50 dark:bg-slate-900/50 m-0">Stok</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-center bg-slate-50 dark:bg-slate-900/50 m-0">Aksi</th>
              </tr>
            )}
            itemContent={(_idx, item) => (
              <>
                <td className="px-6 py-4 whitespace-nowrap h-20 align-middle">
                  <div className="text-slate-800 dark:text-slate-200 font-medium">{item.kodeProduk}</div>
                  <div className="text-[10px] text-slate-500">{item.tanggalWaktu}</div>
                </td>
                <td className="px-6 py-4 h-20 align-middle">
                  <div className="font-bold text-slate-800 dark:text-slate-200">{item.namaProduk}</div>
                  <div className="text-[10px] text-slate-500">{item.metodePenjualan}</div>
                </td>
                <td className="px-6 py-4 h-20 align-middle">
                  <span className="inline-block px-3 py-1 bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400 rounded-lg text-[10px] font-bold">{item.jenisProduk}</span>
                  {item.ukuranProduk && <div className="text-xs text-slate-500 mt-1">Ukuran: {item.ukuranProduk}</div>}
                </td>
                <td className="px-6 py-4 text-right h-20 align-middle">
                  <div className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(item.harga)}</div>
                </td>
                <td className="px-6 py-4 text-center h-20 align-middle">
                  <div className="font-bold text-slate-800 dark:text-slate-200">{item.stok}</div>
                </td>
                <td className="px-6 py-4 h-20 align-middle">
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
              </>
            )}
          />
          {displayList.length === 0 && (
            <div className="px-6 py-10 text-center text-slate-500 font-medium">Tidak ada data produk.</div>
          )}
        </div>
      </div>
      {renderEditModal()}
      {renderViewModal()}
    </div>
  );
}
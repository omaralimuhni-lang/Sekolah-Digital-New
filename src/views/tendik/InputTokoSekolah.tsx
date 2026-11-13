import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, ChevronLeft, Store, FileText, FileSpreadsheet, Filter, Eye, Edit2, Trash2, Calendar, User, Tag, ShoppingCart, Package } from 'lucide-react';
import { RpIcon } from '../../components/ui/RpIcon';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAppContext } from '../../AppContext';
import { useIsMobile } from '../../App';
import { MobileBottomSheet } from '../../components/ui/MobileBottomSheet';
export function InputTokoSekolah() {
  const { user, showNotification } = useAppContext();
  const isMobile = useIsMobile();
  
  const [productList, setProductList] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  // View Data
  const [viewData, setViewData] = useState<any>(null);
  // Form states
  const [editId, setEditId] = useState<string | null>(null);
  
  const [tanggalWaktu, setTanggalWaktu] = useState('');
  const [jenisProduk, setJenisProduk] = useState('Alat Tulis');
  const [kodeProduk, setKodeProduk] = useState('');
  const [namaProduk, setNamaProduk] = useState('');
  const [ukuranProduk, setUkuranProduk] = useState('');
  const [harga, setHarga] = useState('');
  const [stok, setStok] = useState('');
  const [metodePenjualan, setMetodePenjualan] = useState('Cash');
  const [deskripsi, setDeskripsi] = useState('');
  const [petugas, setPetugas] = useState(user?.name || '');
  const [gambarProduk, setGambarProduk] = useState<string | null>(null);
  
  const [showConfirm, setShowConfirm] = useState(false);
  // Filter and Search
  const [searchQuery, setSearchQuery] = useState('');
  useEffect(() => {
    const loadData = () => {
      const list = JSON.parse(localStorage.getItem('sd_toko_produk_list') || '[]');
      setProductList(list);
    };
    loadData();
    window.addEventListener('localStorageUpdate', loadData);
    return () => window.removeEventListener('localStorageUpdate', loadData);
  }, []);
  const generateKodeProduk = (jenis: string) => {
    const prefixMap: Record<string, string> = {
      'Alat Tulis': 'ATK',
      'Buku': 'BKU',
      'Pakaian': 'PAK',
      'Atribut': 'ATR',
      'Lainnya': 'ETC'
    };
    const prefix = prefixMap[jenis] || 'PRD';
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${randomNum}`;
  };
  const handleJenisChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newJenis = e.target.value;
    setJenisProduk(newJenis);
    if (!editId) {
      setKodeProduk(generateKodeProduk(newJenis));
    }
  };
  const openTambah = () => {
    const nw = new Date();
    setTanggalWaktu(nw.toLocaleString('id-ID'));
    setJenisProduk('Alat Tulis');
    setKodeProduk(generateKodeProduk('Alat Tulis'));
    setNamaProduk('');
    setUkuranProduk('');
    setHarga('');
    setStok('');
    setMetodePenjualan('Cash');
    setDeskripsi('');
    setPetugas(user?.name || '');
    setGambarProduk(null);
    
    setEditId(null);
    setIsModalOpen(true);
    setShowConfirm(false);
  };
  const openEdit = (data: any) => {
    setEditId(data.id);
    setTanggalWaktu(data.tanggalWaktu);
    setJenisProduk(data.jenisProduk);
    setKodeProduk(data.kodeProduk);
    setNamaProduk(data.namaProduk);
    setUkuranProduk(data.ukuranProduk || '');
    setHarga(data.harga.toString());
    setStok(data.stok.toString());
    setMetodePenjualan(data.metodePenjualan);
    setDeskripsi(data.deskripsi || '');
    setPetugas(data.petugas || user?.name || '');
    setGambarProduk(data.gambarProduk || null);
    
    setIsModalOpen(true);
    setShowConfirm(false);
  };
  const openView = (data: any) => {
    setViewData(data);
    setIsViewModalOpen(true);
  };
  const handleDelete = (id: string) => {
    if(confirm(`Apakah Anda yakin ingin menghapus data produk ini?`)) {
       const updated = productList.filter(p => p.id !== id);
       setProductList(updated);
       localStorage.setItem('sd_toko_produk_list', JSON.stringify(updated));
       showNotification("Data produk dihapus!");
    }
  };
  const handlePreSimpan = () => {
    if (!namaProduk || !harga || !stok) {
      alert("Nama produk, harga, dan stok wajib diisi.");
      return;
    }
    setShowConfirm(true);
  };
  const handleSimpan = () => {
    let savedRecord;
    let updatedList;
    
    if (editId) {
       updatedList = productList.map(p => {
         if (p.id === editId) {
           savedRecord = {
             ...p,
             jenisProduk,
             namaProduk,
             ukuranProduk: jenisProduk === 'Pakaian' ? ukuranProduk : '',
             harga: Number(harga),
             stok: Number(stok),
             metodePenjualan,
             deskripsi,
             petugas: user?.name || petugas,
             gambarProduk
           };
           return savedRecord;
         }
         return p;
       });
    } else {
      const newRecord = {
        id: new Date().getTime().toString(),
        tanggalWaktu,
        jenisProduk,
        kodeProduk,
        namaProduk,
        ukuranProduk: jenisProduk === 'Pakaian' ? ukuranProduk : '',
        harga: Number(harga),
        stok: Number(stok),
        metodePenjualan,
        deskripsi,
        petugas: user?.name || petugas,
        gambarProduk
      };
      savedRecord = newRecord;
      updatedList = [newRecord, ...productList];
    }
    
    setProductList(updatedList);
    localStorage.setItem('sd_toko_produk_list', JSON.stringify(updatedList));
    showNotification(editId ? "Data Produk diperbarui!" : "Data Produk berhasil disimpan!");
    
    setShowConfirm(false);
    setIsModalOpen(false);
  };
  const filteredList = productList.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      (item.namaProduk?.toLowerCase() || '').includes(q) ||
      (item.kodeProduk?.toLowerCase() || '').includes(q) ||
      (item.jenisProduk?.toLowerCase() || '').includes(q)
    );
  });
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Laporan Data Produk Toko Sekolah', 14, 15);
    
    const tableColumn = ["Kode", "Nama Produk", "Jenis", "Harga", "Stok", "Metode"];
    const tableRows = filteredList.map(p => [
      p.kodeProduk,
      p.namaProduk,
      p.jenisProduk + (p.ukuranProduk ? ` (${p.ukuranProduk})` : ''),
      formatRupiah(p.harga),
      p.stok,
      p.metodePenjualan
    ]);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
    });
    
    doc.save(`Laporan_Produk_Toko_${new Date().getTime()}.pdf`);
  };
  const handleExportExcel = () => {
    const wsData = filteredList.map(p => ({
      "Tanggal Waktu": p.tanggalWaktu,
      "Petugas": p.petugas,
      "Kode Produk": p.kodeProduk,
      "Nama Produk": p.namaProduk,
      "Jenis Produk": p.jenisProduk,
      "Ukuran (Pakaian)": p.ukuranProduk || '-',
      "Harga": p.harga,
      "Stok": p.stok,
      "Metode Penjualan": p.metodePenjualan,
      "Deskripsi": p.deskripsi || '-'
    }));
    import('../../utils/kopHelper').then(({ exportToExcel }) => {
      exportToExcel(wsData, "Laporan_Produk_Toko", "PRODUK TOKO");
    });
  };
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        showNotification("Ukuran gambar maksimal 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setGambarProduk(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const renderForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Tanggal & Waktu</label>
          <div className="relative">
            <Calendar className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" readOnly value={tanggalWaktu} className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm dark:text-slate-400 text-slate-600 cursor-not-allowed" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Petugas Input</label>
          <div className="relative">
            <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" readOnly value={petugas} className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm dark:text-slate-400 text-slate-600 cursor-not-allowed" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Jenis Produk</label>
          <div className="relative">
            <Tag className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select value={jenisProduk} onChange={handleJenisChange} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-sm dark:text-white appearance-none">
              <option value="Alat Tulis">Alat Tulis</option>
              <option value="Buku">Buku</option>
              <option value="Pakaian">Pakaian / Seragam</option>
              <option value="Atribut">Atribut (Dasi, Topi, dll)</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Kode Produk (Otomatis)</label>
          <div className="relative">
            <Package className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" readOnly value={kodeProduk} className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm dark:text-slate-400 text-slate-600 cursor-not-allowed font-mono" />
          </div>
        </div>
      </div>
      <div>
         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Nama Produk</label>
         <input type="text" value={namaProduk} onChange={(e)=>setNamaProduk(e.target.value)} placeholder="Contoh: Buku Tulis Sinar Dunia 38 Lembar" className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none" />
      </div>
      {jenisProduk === 'Pakaian' && (
        <div>
           <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Ukuran Pakaian</label>
           <select value={ukuranProduk} onChange={(e) => setUkuranProduk(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-sm dark:text-white appearance-none">
              <option value="" disabled>Pilih Ukuran</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
              <option value="XXL">XXL</option>
           </select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Harga Nominal (Rp)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 font-medium text-sm">Rp</span>
            <input type="text" value={harga ? parseInt(harga, 10).toLocaleString('id-ID') : ''} onChange={(e)=>setHarga(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-sm dark:text-white" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Jumlah Stok</label>
          <div className="relative">
            <Package className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="number" min="0" value={stok} onChange={(e)=>setStok(e.target.value)} placeholder="0" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-sm dark:text-white" />
          </div>
        </div>
      </div>
      
      <div>
         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Metode Penjualan</label>
         <div className="relative">
            <ShoppingCart className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select value={metodePenjualan} onChange={(e) => setMetodePenjualan(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-sm dark:text-white appearance-none">
              <option value="Cash">Hanya Cash / Tunai</option>
              <option value="Cicil">Hanya Cicilan</option>
              <option value="Cash & Cicil">Keduanya (Cash & Cicilan)</option>
            </select>
         </div>
      </div>
      <div>
         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Deskripsi Produk</label>
         <textarea rows={3} value={deskripsi} onChange={(e)=>setDeskripsi(e.target.value)} placeholder="Tuliskan keterangan tambahan bila perlu..." className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none resize-none"></textarea>
      </div>
      <div>
         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Gambar Produk (Opsional, Maks 2MB)</label>
         <div className="flex items-center gap-4">
           {gambarProduk ? (
             <div className="relative w-24 h-24 rounded-xl border border-slate-200 overflow-hidden group">
                <img src={gambarProduk} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  onClick={() => setGambarProduk(null)} 
                  className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
             </div>
           ) : (
             <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
               <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-500">
                  <Package className="w-6 h-6 mb-2 text-slate-400" />
                  <p className="text-sm">Klik untuk upload foto</p>
               </div>
               <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
             </label>
           )}
         </div>
      </div>
    </div>
  );
  const renderModal = () => {
    if (!isModalOpen) return null;
    
    const content = (
      <div className="p-6 pb-24 lg:pb-6">
        {showConfirm ? (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-pink-50 dark:bg-pink-500/10 p-5 rounded-2xl border border-pink-100 dark:border-pink-500/20 mb-6">
              <h3 className="text-pink-800 dark:text-pink-400 font-bold mb-4 flex items-center text-lg"><Store className="w-5 h-5 mr-2" /> Review Data Sebelum Simpan</h3>
              <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-2">
                  <div>Petugas: <span className="font-semibold text-slate-700 dark:text-slate-300">{petugas}</span></div>
                  <div className="text-right">Tgl: <span className="font-semibold text-slate-700 dark:text-slate-300">{tanggalWaktu}</span></div>
                </div>
                {gambarProduk && (
                  <div className="flex justify-center mb-3">
                    <img src={gambarProduk} alt="Preview Produk" className="w-24 h-24 object-cover rounded-xl border border-pink-200" />
                  </div>
                )}
                <div className="flex justify-between border-t border-pink-200 dark:border-pink-500/30 pt-3"><span className="text-slate-500">Kode:</span> <span className="font-mono font-bold">{kodeProduk}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Jenis:</span> <span className="font-semibold">{jenisProduk}</span></div>
                {jenisProduk === 'Pakaian' && (
                  <div className="flex justify-between"><span className="text-slate-500">Ukuran:</span> <span className="font-semibold">{ukuranProduk || '-'}</span></div>
                )}
                <div className="flex justify-between"><span className="text-slate-500">Nama Produk:</span> <span className="font-bold text-slate-900 dark:text-white text-right max-w-[60%]">{namaProduk}</span></div>
                <div className="flex justify-between border-t border-pink-200 dark:border-pink-500/30 pt-3"><span className="text-slate-500">Harga:</span> <span className="font-bold text-pink-600 dark:text-pink-400">{formatRupiah(Number(harga))}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Stok:</span> <span className="font-semibold">{stok} unit</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Bisa Dibeli Secara:</span> <span className="font-semibold">{metodePenjualan}</span></div>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
               >
                 Koreksi Data
               </button>
               <button 
                 onClick={handleSimpan}
                 className="flex-1 py-3.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold shadow-lg shadow-pink-600/30 transition-colors"
               >
                 Ya, Simpan Produk
               </button>
             </div>
           </div>
         ) : (
           <>
             {renderForm()}
             <div className="pt-6">
                <button 
                  onClick={handlePreSimpan}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-pink-500/30 transition-all active:scale-[0.98] focus:ring-4 focus:ring-pink-500/20"
                >
                  Review & Simpan
                </button>
             </div>
           </>
         )}
      </div>
    );
    if (isMobile) {
      return (
        <MobileBottomSheet isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Edit Produk Toko" : "Tambah Produk Baru"}>
          {content}
        </MobileBottomSheet>
      );
    }
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[24px] shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl z-10">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Store className="w-5 h-5 text-pink-500" /> {editId ? "Edit Produk Toko" : "Tambah Produk Baru"}</h2>
            <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
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
    if (!isViewModalOpen || !viewData) return null;
    
    const content = (
      <div className="p-6 pb-24 lg:pb-6">
        <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/50 space-y-4">
           <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-700 pb-4">
             <div>
               <div className="text-xs text-slate-500 font-medium">Diinput pada: {viewData.tanggalWaktu}</div>
               <div className="text-xs text-slate-500 font-medium mt-1">Petugas: {viewData.petugas}</div>
             </div>
             <div className="text-right">
                <div className="text-xs font-semibold text-pink-600 bg-pink-50 dark:bg-pink-500/10 px-3 py-1 rounded-full border border-pink-100 dark:border-pink-500/20">{viewData.jenisProduk}</div>
             </div>
          </div>
          
          {viewData.gambarProduk && (
             <div className="pt-2 flex justify-center">
                 <img src={viewData.gambarProduk} alt={viewData.namaProduk} className="w-48 h-48 object-cover rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700" />
             </div>
          )}
          <div className="pt-2">
             <div className="text-sm text-slate-500 mb-1">Nama Produk</div>
             <div className="font-bold text-lg text-slate-800 dark:text-white leading-tight">{viewData.namaProduk}</div>
             <div className="text-sm text-slate-500 mt-1 font-mono">{viewData.kodeProduk}</div>
          </div>
          <div className="grid grid-cols-2 gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
             <div>
               <div className="text-xs text-slate-500">Harga</div>
               <div className="font-bold text-pink-600 dark:text-pink-400 text-lg">{formatRupiah(viewData.harga)}</div>
             </div>
             <div>
               <div className="text-xs text-slate-500">Stok Tersedia</div>
               <div className="font-bold text-slate-800 dark:text-slate-200 text-lg">{viewData.stok} <span className="text-sm font-medium text-slate-500">unit</span></div>
             </div>
          </div>
          
          <div className="space-y-4 pt-2">
             {viewData.jenisProduk === 'Pakaian' && viewData.ukuranProduk && (
               <div>
                  <div className="text-sm text-slate-500 mb-1">Ukuran</div>
                  <div className="font-bold text-slate-800 dark:text-white">{viewData.ukuranProduk}</div>
               </div>
             )}
             <div>
                <div className="text-sm text-slate-500 mb-1">Metode Penjualan</div>
                <div className="font-medium text-slate-800 dark:text-white inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm">
                   <RpIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                   {viewData.metodePenjualan}
                </div>
             </div>
             <div>
                <div className="text-sm text-slate-500 mb-1">Deskripsi & Keterangan</div>
                <div className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 whitespace-pre-wrap">{viewData.deskripsi || '-'}</div>
             </div>
          </div>
        </div>
      </div>
    );
    if (isMobile) {
      return (
        <MobileBottomSheet isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Produk Toko">
          {content}
        </MobileBottomSheet>
      );
    }
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[24px] shadow-2xl relative z-10 flex flex-col overflow-hidden max-h-[90vh]">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl sticky top-0 z-10">
             <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Store className="w-5 h-5 text-pink-500" /> Detail Produk</h2>
             <button onClick={() => setIsViewModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
               <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
             </button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
             {content}
          </div>
        </div>
      </div>,
      document.body
    );
  };
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[100vw] overflow-x-hidden pt-safe pb-32">
      <div className="flex flex-col gap-8 w-full">
        {/* Banner */}
        <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl shadow-pink-500/20 relative overflow-hidden h-40 sm:h-48 flex flex-col justify-end">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
           <div className="absolute bottom-0 right-10 opacity-20 pointer-events-none transform translate-y-1/4 right-0 rotate-[-15deg]">
              <Store className="w-48 h-48 sm:w-64 sm:h-64" />
           </div>
           
           <div className="relative z-10">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">Koperasi & Toko Sekolah</h1>
              <p className="text-pink-100 font-medium text-sm sm:text-base max-w-sm sm:max-w-md">Tambah dan kelola produk inventaris toko.</p>
           </div>
        </div>
        {/* Header Options */}
        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={openTambah}
            className="flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-pink-500 to-rose-600 p-5 rounded-[20px] text-white shadow-xl shadow-pink-500/20 active:scale-95 transition-all text-center border-b-4 border-pink-700/50 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm relative z-10">
              <Plus className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-lg tracking-wide relative z-10">Tambah Produk Toko Sekolah</span>
          </button>
        </div>
        {/* Filter and Export */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-2 self-start lg:self-auto text-slate-800 dark:text-white font-bold text-lg">
              <Filter className="w-5 h-5 text-pink-500" /> Filter & Unduh
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <button 
                onClick={handleExportPDF}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-500/20 px-4 py-2.5 rounded-xl font-bold transition-colors text-sm"
              >
                <FileText className="w-4 h-4" /> PDF
              </button>
              <button 
                onClick={handleExportExcel}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-4 py-2.5 rounded-xl font-bold transition-colors text-sm"
              >
                <FileSpreadsheet className="w-4 h-4" /> Excel
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Cari kode, nama atau jenis produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-sm dark:text-white"
              />
            </div>
          </div>
        </div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Inventaris Produk
          </h2>
          <span className="text-sm font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            {filteredList.length} Produk
          </span>
        </div>
        {/* Data Lists */}
        <div className="space-y-4">
          {filteredList.length > 0 ? filteredList.map((item) => (
            <div key={item.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex items-start gap-4 w-full sm:w-auto">
                {item.gambarProduk ? (
                   <img src={item.gambarProduk} alt={item.namaProduk} className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 mt-1 shrink-0" />
                ) : (
                   <div className="bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400 p-3 rounded-xl mt-1 shrink-0 flex items-center justify-center w-12 h-12">
                     <Package className="w-6 h-6" />
                   </div>
                )}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-1">
                     <h3 className="font-bold text-slate-800 dark:text-slate-100 text-[17px] leading-tight line-clamp-1">{item.namaProduk}</h3>
                  </div>
                  <div className="flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 gap-2 mb-2 w-full flex-wrap">
                    <span className="font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{item.kodeProduk}</span>
                    <span>•</span>
                    <span className="text-pink-600 dark:text-pink-400">{item.jenisProduk} {item.ukuranProduk ? `(${item.ukuranProduk})` : ''}</span>
                    <span>•</span>
                    <span>Stok: {item.stok}</span>
                  </div>
                  <div className="font-bold text-pink-600 dark:text-pink-400 mb-3 text-sm">{formatRupiah(item.harga)}</div>
                  
                  {/* Action buttons embedded in mobile layout */}
                  <div className="flex sm:hidden items-center justify-start gap-2 w-full">
                     <button onClick={() => openView(item)} className="flex items-center justify-center h-9 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs ring-1 ring-indigo-100 dark:ring-indigo-500/20 active:scale-95 transition-all w-fit">
                       <Eye className="w-3.5 h-3.5 mr-1.5" /> Lihat
                     </button>
                     <button onClick={() => openEdit(item)} className="flex items-center justify-center h-9 px-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs ring-1 ring-amber-100 dark:ring-amber-500/20 active:scale-95 transition-all w-fit">
                       <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
                     </button>
                     <button onClick={() => handleDelete(item.id)} className="flex items-center justify-center h-9 px-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-xs ring-1 ring-red-100 dark:ring-red-500/20 active:scale-95 transition-all w-fit">
                       <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Hapus
                     </button>
                  </div>
                </div>
              </div>
              
              {/* Desktop action buttons */}
              <div className="hidden sm:flex flex-col items-end shrink-0 gap-2">
                 <div className="flex items-center justify-end gap-2 w-full">
                   <button onClick={() => openView(item)} className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all shadow-sm">
                     <Eye className="w-4 h-4" />
                   </button>
                   <button onClick={() => openEdit(item)} className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all shadow-sm">
                     <Edit2 className="w-4 h-4" />
                   </button>
                   <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all shadow-sm">
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
              </div>
            </div>
          )) : (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
              <Store className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Belum ada data produk</h3>
              <p className="text-slate-500 max-w-sm mx-auto">Mulai tambahkan produk toko sekolah di sini.</p>
            </div>
          )}
        </div>
      </div>
      {renderModal()}
      {renderViewModal()}
    </div>
  );
}
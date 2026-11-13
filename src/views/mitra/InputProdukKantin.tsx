import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, ChevronLeft, Package, FileSpreadsheet, Filter, Eye, Edit2, Trash2, Calendar, User, Tag, ShoppingBag, Coffee, Image as ImageIcon, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAppContext } from '../../AppContext';
import { useIsMobile } from '../../App';
import { MobileBottomSheet } from '../../components/ui/MobileBottomSheet';
import { applyPdfKop } from '../../utils/kopHelper';

export function InputProdukKantin() {
  const { user, showNotification } = useAppContext();
  const isMobile = useIsMobile();
  
  const [produkList, setProdukList] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  // View Data
  const [viewData, setViewData] = useState<any>(null);

  // Form states
  const [editId, setEditId] = useState<string | null>(null);
  
  const [tanggalWaktu, setTanggalWaktu] = useState('');
  const [jenisProduk, setJenisProduk] = useState('Makanan');
  const [kodeProduk, setKodeProduk] = useState('');
  const [namaProduk, setNamaProduk] = useState('');
  const [harga, setHarga] = useState('');
  const [stok, setStok] = useState('');
  const [metodePenjualan, setMetodePenjualan] = useState('Cash');
  const [deskripsi, setDeskripsi] = useState('');
  const [gambar, setGambar] = useState('');
  const [pemilik, setPemilik] = useState(user?.name || '');
  
  const [showConfirm, setShowConfirm] = useState(false);

  // Filter and Search
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = () => {
      const list = JSON.parse(localStorage.getItem('sd_mitra_produk_kantin_list') || '[]');
      setProdukList(list);
    };
    loadData();
    window.addEventListener('localStorageUpdate', loadData);
    return () => window.removeEventListener('localStorageUpdate', loadData);
  }, []);

  useEffect(() => {
    // Generate kode ketika jenis produk berubah dan form sedang dibuka (baik baru maupun edit bisa generate ulang jika kosong)
    if (!editId && jenisProduk && isModalOpen && !showConfirm) {
      generateKodeProduk(jenisProduk);
    }
  }, [jenisProduk, isModalOpen, editId, showConfirm]);

  const generateKodeProduk = (jenis: string) => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const prefix = jenis.toUpperCase().substring(0, 3);
    setKodeProduk(`KNT-${prefix}-${randomNum}`);
  };

  const openTambah = () => {
    const nw = new Date();
    setTanggalWaktu(nw.toLocaleString('id-ID'));
    setJenisProduk('Makanan');
    generateKodeProduk('Makanan');
    setNamaProduk('');
    setHarga('');
    setStok('');
    setMetodePenjualan('Cash');
    setDeskripsi('');
    setGambar('');
    setPemilik(user?.name || '');
    
    setEditId(null);
    setIsModalOpen(true);
    setShowConfirm(false);
  };

  const openEdit = (data: any) => {
    setEditId(data.id);
    setTanggalWaktu(data.tanggalWaktu);
    setKodeProduk(data.kodeProduk);
    setJenisProduk(data.jenisProduk);
    setNamaProduk(data.namaProduk);
    setHarga(data.harga.toString());
    setStok(data.stok.toString());
    setMetodePenjualan(data.metodePenjualan);
    setDeskripsi(data.deskripsi || '');
    setGambar(data.gambar || '');
    setPemilik(data.pemilik || user?.name || '');
    
    setIsModalOpen(true);
    setShowConfirm(false);
  };

  const openView = (data: any) => {
    setViewData(data);
    setIsViewModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if(confirm(`Apakah Anda yakin ingin menghapus data produk ini?`)) {
       const updated = produkList.filter(p => p.id !== id);
       setProdukList(updated);
       localStorage.setItem('sd_mitra_produk_kantin_list', JSON.stringify(updated));
       window.dispatchEvent(new Event('localStorageUpdate'));
       showNotification("Data produk dihapus!");
    }
  };

  const formatRupiah = (value: string) => {
    const numberString = value.replace(/[^,\d]/g, '').toString();
    const split = numberString.split(',');
    const sisa = split[0].length % 3;
    let rupiah = split[0].substr(0, sisa);
    const ribuan = split[0].substr(sisa).match(/\d{3}/gi);

    if (ribuan) {
      const separator = sisa ? '.' : '';
      rupiah += separator + ribuan.join('.');
    }

    rupiah = split[1] !== undefined ? rupiah + ',' + split[1] : rupiah;
    return rupiah;
  };

  const handleHargaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHarga(formatRupiah(e.target.value));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showNotification("Ukuran gambar terlalu besar (Maks 2MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setGambar(reader.result as string);
      };
      reader.readAsDataURL(file);
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
    
    const numericHarga = parseInt(harga.replace(/[^0-9]/g, ''), 10) || 0;
    const numericStok = parseInt(stok.replace(/[^0-9]/g, ''), 10) || 0;
    
    if (editId) {
       updatedList = produkList.map(p => {
         if (p.id === editId) {
           savedRecord = {
             ...p,
             jenisProduk,
             namaProduk,
             harga: numericHarga,
             stok: numericStok,
             metodePenjualan,
             deskripsi,
             gambar,
             pemilik: user?.name || pemilik
           };
           return savedRecord;
         }
         return p;
       });
    } else {
      const newRecord = {
        id: new Date().getTime().toString(),
        tanggalWaktu,
        kodeProduk,
        jenisProduk,
        namaProduk,
        harga: numericHarga,
        stok: numericStok,
        metodePenjualan,
        deskripsi,
        gambar,
        pemilik: user?.name || pemilik
      };
      savedRecord = newRecord;
      updatedList = [newRecord, ...produkList];
    }
    
    setProdukList(updatedList);
    localStorage.setItem('sd_mitra_produk_kantin_list', JSON.stringify(updatedList));
    window.dispatchEvent(new Event('localStorageUpdate'));
    showNotification(editId ? "Data Produk diperbarui!" : "Data Produk berhasil disimpan!");
    
    setShowConfirm(false);
    setIsModalOpen(false);
  };

  const filteredList = produkList.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      (item.namaProduk?.toLowerCase() || '').includes(q) ||
      (item.kodeProduk?.toLowerCase() || '').includes(q) ||
      (item.jenisProduk?.toLowerCase() || '').includes(q)
    );
  });

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const startY = applyPdfKop(doc);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Laporan", 14, startY + 5);
    doc.setFontSize(16);
    doc.text('Laporan Data Produk/Menu Kantin', 14, 15);
    
    const tableColumn = ["Kode", "Jenis", "Nama Produk", "Harga", "Stok", "Metode"];
    const tableRows = filteredList.map(p => [
      p.kodeProduk,
      p.jenisProduk,
      p.namaProduk,
      `Rp ${p.harga.toLocaleString('id-ID')}`,
      p.stok,
      p.metodePenjualan
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
    });
    
    doc.save(`Laporan_Produk_Kantin_${new Date().getTime()}.pdf`);
  };

  const handleExportExcel = () => {
    const wsData = filteredList.map(p => ({
      "Tanggal Waktu": p.tanggalWaktu,
      "Kode": p.kodeProduk,
      "Jenis Produk": p.jenisProduk,
      "Nama Produk/Menu": p.namaProduk,
      "Harga (Rp)": p.harga,
      "Stok": p.stok,
      "Metode Penjualan": p.metodePenjualan,
      "Deskripsi": p.deskripsi || '-',
      "Pemilik": p.pemilik
    }));

    import('../../utils/kopHelper').then(({ exportToExcel }) => {
      exportToExcel(wsData, "Laporan_Produk_Kantin", "PRODUK KANTIN");
    });
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
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Pemilik Penginput</label>
          <div className="relative">
            <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" readOnly value={pemilik} className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm dark:text-slate-400 text-slate-600 cursor-not-allowed" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Jenis Produk/Menu</label>
          <div className="relative">
            <Tag className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select value={jenisProduk} onChange={(e) => setJenisProduk(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-500 text-sm dark:text-white appearance-none">
              <option value="Makanan">Makanan</option>
              <option value="Minuman">Minuman</option>
              <option value="Snack">Snack</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Kode (Otomatis)</label>
          <div className="relative">
            <Package className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" readOnly value={kodeProduk} className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm dark:text-slate-400 text-slate-600 cursor-not-allowed font-mono" />
          </div>
        </div>
      </div>

      <div>
         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Nama Produk/Menu Kantin</label>
         <input type="text" value={namaProduk} onChange={(e)=>setNamaProduk(e.target.value)} placeholder="Contoh: Nasi Goreng Spesial" className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-slate-500 outline-none" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Nominal Harga (Rp)</label>
          <div className="relative">
             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">Rp</span>
             <input type="text" value={harga} onChange={handleHargaChange} placeholder="0" className="w-full pl-12 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-slate-500 outline-none font-bold" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Jumlah Stok</label>
          <input type="number" min="0" value={stok} onChange={(e)=>setStok(e.target.value)} placeholder="Contoh: 50" className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-slate-500 outline-none" />
        </div>
      </div>

      <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Metode Penjualan</label>
          <div className="relative">
            <ShoppingBag className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select value={metodePenjualan} onChange={(e) => setMetodePenjualan(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-500 text-sm dark:text-white appearance-none">
              <option value="Cash">Cash (Saldo)</option>
              <option value="Tukar Poin">Tukar Poin</option>
              <option value="Cash & Tukar Poin">Cash & Tukar Poin (Dua-duanya)</option>
            </select>
          </div>
      </div>

      <div>
         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Deskripsi Produk (Opsional)</label>
         <textarea rows={3} value={deskripsi} onChange={(e)=>setDeskripsi(e.target.value)} placeholder="Tuliskan deskripsi singkat mengenai menu/produk ini..." className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-slate-500 outline-none resize-none"></textarea>
      </div>

      <div>
         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Upload Gambar Produk (Opsional)</label>
         <div className="relative">
           {gambar ? (
             <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
               <img src={gambar} alt="Preview" className="w-full h-full object-cover" />
               <button 
                 onClick={() => setGambar('')}
                 className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
               >
                 <X className="w-4 h-4" />
               </button>
             </div>
           ) : (
             <div className="w-full flex items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors relative">
               <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
               <div className="text-center pointer-events-none">
                 <ImageIcon className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                 <span className="text-sm text-slate-500 font-medium">Klik atau seret untuk upload foto menu</span>
                 <br />
                 <span className="text-xs text-slate-400">Maks. 2MB, rasio 1:1 direkomendasikan</span>
               </div>
             </div>
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
            <div className="bg-slate-50 dark:bg-slate-400/10 p-5 rounded-2xl border border-slate-200 dark:border-slate-500/20 mb-6">
              <h3 className="text-slate-800 dark:text-slate-300 font-bold mb-4 flex items-center text-lg"><Coffee className="w-5 h-5 mr-2" /> Review Data Produk Kantin</h3>
              <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-2">
                  <div>Tgl: <span className="font-semibold text-slate-700 dark:text-slate-300">{tanggalWaktu}</span></div>
                  <div className="text-right">Pemilik: <span className="font-semibold text-slate-700 dark:text-slate-300">{pemilik}</span></div>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-500/30 pt-3"><span className="text-slate-500">Kode:</span> <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{kodeProduk}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Jenis:</span> <span className="font-semibold">{jenisProduk}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Nama Produk:</span> <span className="font-bold text-slate-900 dark:text-white text-right max-w-[60%]">{namaProduk}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Harga:</span> <span className="font-bold text-green-600 dark:text-green-400">Rp {harga}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Stok:</span> <span className="font-semibold">{stok} unit</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Metode Jual:</span> <span className="font-semibold text-indigo-600 dark:text-indigo-400">{metodePenjualan}</span></div>
                {gambar && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-500/30">
                    <span className="text-slate-500 mb-2 block object-cover">Foto Produk:</span>
                    <img src={gambar} alt="Preview" className="w-16 h-16 rounded-xl border border-slate-200 dark:border-slate-700 object-cover" />
                  </div>
                )}
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
                 className="flex-1 py-3.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg shadow-slate-600/30 transition-colors"
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
                  className="w-full py-4 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-xl font-bold text-lg shadow-lg shadow-slate-500/30 transition-all active:scale-[0.98] focus:ring-4 focus:ring-slate-500/20"
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
        <MobileBottomSheet isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Edit Produk Kantin" : "Tambah Produk Baru"}>
          {content}
        </MobileBottomSheet>
      );
    }

    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[24px] shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl z-10">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Coffee className="w-5 h-5 text-slate-500" /> {editId ? "Edit Produk" : "Tambah Produk"}</h2>
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
               <div className="text-xs text-slate-500 font-medium mt-1">Pemilik: {viewData.pemilik}</div>
             </div>
             <div className="text-right">
                <div className="text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-500/20">{viewData.jenisProduk}</div>
             </div>
          </div>
          
          <div className="pt-2">
             <div className="text-sm text-slate-500 mb-1">Nama Produk / Menu</div>
             <div className="font-bold text-xl text-slate-800 dark:text-white leading-tight">{viewData.namaProduk}</div>
             <div className="text-sm text-slate-500 mt-1 font-mono">Kode: {viewData.kodeProduk}</div>
          </div>

          {viewData.gambar && (
            <div className="w-full aspect-square max-h-56 bg-slate-200 dark:bg-slate-700 rounded-2xl overflow-hidden mt-4 border border-slate-200 dark:border-slate-700">
               <img src={viewData.gambar} alt="Produk" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-200 dark:border-slate-700 mt-4">
             <div>
               <div className="text-sm text-slate-500 mb-1">Harga</div>
               <div className="font-bold text-green-600 dark:text-green-400 text-lg">Rp {viewData.harga.toLocaleString('id-ID')}</div>
             </div>
             <div>
               <div className="text-sm text-slate-500 mb-1">Total Stok</div>
               <div className="font-bold text-slate-800 dark:text-white text-lg">{viewData.stok} <span className="text-sm font-normal text-slate-500">unit</span></div>
             </div>
             <div className="col-span-2 mt-2">
               <div className="text-sm text-slate-500 mb-1">Metode Penjualan</div>
               <div className="font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl inline-block">{viewData.metodePenjualan}</div>
             </div>
          </div>

          <div className="pt-2">
             <div className="text-sm text-slate-500 mb-2">Deskripsi Label / Info Produk</div>
             <div className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 whitespace-pre-wrap">{viewData.deskripsi || 'Tidak ada deskripsi rinci.'}</div>
          </div>
        </div>
      </div>
    );

    if (isMobile) {
      return (
        <MobileBottomSheet isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Produk Kantin">
          {content}
        </MobileBottomSheet>
      );
    }

    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[24px] shadow-2xl relative z-10 flex flex-col overflow-hidden max-h-[90vh]">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl sticky top-0 z-10">
             <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Coffee className="w-5 h-5 text-slate-500" /> Detail Produk Kantin</h2>
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
        <div className="bg-gradient-to-br from-slate-600 to-slate-800 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl shadow-slate-500/20 relative overflow-hidden h-40 sm:h-48 flex flex-col justify-end">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
           <div className="absolute bottom-0 right-10 opacity-20 pointer-events-none transform translate-y-1/4 right-0 rotate-[-15deg]">
              <Coffee className="w-48 h-48 sm:w-64 sm:h-64" />
           </div>
           
           <div className="relative z-10">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">Menu & Produk Kantin</h1>
              <p className="text-slate-200 font-medium text-sm sm:text-base max-w-sm sm:max-w-md">Tambah dan kelola menu atau produk kantin sekolah.</p>
           </div>
        </div>

        {/* Header Options */}
        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={openTambah}
            className="flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-600 to-slate-800 p-5 rounded-[20px] text-white shadow-xl shadow-slate-500/20 active:scale-95 transition-all text-center border-b-4 border-slate-900/50 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm relative z-10">
              <Plus className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-lg tracking-wide relative z-10">Tambah Menu / Produk Kantin</span>
          </button>
        </div>

        {/* Filter and Export */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-2 self-start lg:self-auto text-slate-800 dark:text-white font-bold text-lg">
              <Filter className="w-5 h-5 text-slate-500" /> Filter & Unduh
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <button 
                onClick={handleExportPDF}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-500/20 px-4 py-2.5 rounded-xl font-bold transition-colors text-sm"
              >
                <Coffee className="w-4 h-4" /> PDF
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
                placeholder="Cari nama, kode atau jenis makanan/minuman..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-500 text-sm dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Menu Kantin Saya
          </h2>
          <span className="text-sm font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            {filteredList.length} Item
          </span>
        </div>

        {/* Data Lists */}
        <div className="space-y-4">
          {filteredList.length > 0 ? filteredList.map((item) => (
            <div key={item.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex items-start gap-4 w-full sm:w-auto">
                {item.gambar ? (
                  <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden mt-1 border border-slate-200 dark:border-slate-700">
                    <img src={item.gambar} alt="Thumbnail" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 p-3 rounded-xl mt-1 shrink-0">
                    <Coffee className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1 w-full max-w-full overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-1 w-full">
                     <h3 className="font-bold text-slate-800 dark:text-slate-100 text-[17px] leading-tight line-clamp-1 truncate block w-full">{item.namaProduk}</h3>
                  </div>
                  <div className="flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 gap-2 mb-2 w-full flex-wrap">
                    <span className="font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{item.kodeProduk}</span>
                    <span>•</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{item.jenisProduk}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300 mb-3 w-full max-w-xs">
                     <div>
                        <span className="text-slate-400 text-xs block mb-0.5">Harga</span>
                        <span className="font-bold text-green-600 dark:text-green-400">Rp {item.harga.toLocaleString('id-ID')}</span>
                     </div>
                     <div>
                        <span className="text-slate-400 text-xs block mb-0.5">Sisa Stok</span>
                        <span className="font-semibold">{item.stok}</span>
                     </div>
                  </div>
                  
                  {/* Action buttons embedded in mobile layout */}
                  <div className="flex sm:hidden items-center justify-start gap-2 w-full mt-1">
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
              <Coffee className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Belum ada menu kantin</h3>
              <p className="text-slate-500 max-w-sm mx-auto">Tambahkan produk pertama untuk kantin Anda hari ini.</p>
            </div>
          )}
        </div>
      </div>

      {renderModal()}
      {renderViewModal()}
    </div>
  );
}

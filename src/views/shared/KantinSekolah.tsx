import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, Coffee, Search, ShoppingBag, Plus, Minus, CheckCircle2, Ticket, QrCode, Download, Eye, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import { useAppContext } from '../../AppContext';
import { useIsMobile } from '../../App';
import { MobileBottomSheet } from '../../components/ui/MobileBottomSheet';

export function KantinSekolah() {
  const { user, showNotification } = useAppContext();
  const isMobile = useIsMobile();
  
  const [produkList, setProdukList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJenis, setFilterJenis] = useState('Semua');
  
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [metodePembelian, setMetodePembelian] = useState('Cash'); // 'Cash' atau 'Tukar Poin'
  
  const [showConfirmBuy, setShowConfirmBuy] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const loadData = () => {
    const list = JSON.parse(localStorage.getItem('sd_mitra_produk_kantin_list') || '[]');
    setProdukList(list);
  };

  useEffect(() => {
    // Ambil data produk yang diinput oleh mitra
    loadData();

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'sd_mitra_produk_kantin_list') {
        loadData();
      }
    };
    const handleCustomStorageUpdate = () => loadData();

    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('localStorageUpdate', handleCustomStorageUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('localStorageUpdate', handleCustomStorageUpdate);
    };
  }, []);

  const openView = (product: any) => {
    setSelectedProduct(product);
    setIsViewModalOpen(true);
  };

  const openBuy = (product: any) => {
    setSelectedProduct(product);
    setBuyQuantity(1);
    
    // Auto-select valid method
    if (product.metodePenjualan === 'Tukar Poin') setMetodePembelian('Tukar Poin');
    else setMetodePembelian('Cash');
    
    setIsBuyModalOpen(true);
    setShowConfirmBuy(false);
    setShowReceipt(false);
  };

  const increaseQty = () => {
    if (buyQuantity < parseInt(selectedProduct?.stok || '0', 10)) {
      setBuyQuantity(prev => prev + 1);
    }
  };

  const decreaseQty = () => {
    if (buyQuantity > 1) {
      setBuyQuantity(prev => prev - 1);
    }
  };

  const handlePreBuy = () => {
    setShowConfirmBuy(true);
  };

  const handleConfirmBuy = () => {
    // Generate Receipt Data
    const receipt = {
      id: `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
      tanggal: new Date().toLocaleString('id-ID'),
      pembeli: user?.name,
      produk: selectedProduct?.namaProduk,
      kode: selectedProduct?.kodeProduk,
      jumlah: buyQuantity,
      metode: metodePembelian,
      total: buyQuantity * (selectedProduct?.harga || 0),
      status: 'Menunggu Pengambilan'
    };
    
    // Kurangi stok di localStorage
    const updatedList = produkList.map(p => {
       if (p.id === selectedProduct.id) {
          const newStok = Math.max(0, parseInt(p.stok, 10) - buyQuantity);
          return { ...p, stok: newStok };
       }
       return p;
    });
    
    setProdukList(updatedList);
    localStorage.setItem('sd_mitra_produk_kantin_list', JSON.stringify(updatedList));
    
    // Simpan history pesanan masuk kantin (untuk fitur pesanan mitra kalau ada nanti)
    const pesananList = JSON.parse(localStorage.getItem('sd_kantin_pesanan_masuk') || '[]');
    pesananList.push(receipt);
    localStorage.setItem('sd_kantin_pesanan_masuk', JSON.stringify(pesananList));
    
    window.dispatchEvent(new Event('localStorageUpdate'));
    
    setReceiptData(receipt);
    setShowConfirmBuy(false);
    setShowReceipt(true);
    
    showNotification(`Pembelian ${selectedProduct?.namaProduk} berhasil!`);
  };

  const handleDownloadStruk = () => {
    if (!receiptData) return;
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 150] // Receipt thermal size format
    });
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("KANTIN SEKOLAH", 40, 15, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Struk Pesanan", 40, 22, { align: "center" });
    doc.text("-----------------------------------------", 40, 27, { align: "center" });
    
    doc.setFontSize(9);
    doc.text(`No: ${receiptData.id}`, 10, 35);
    doc.text(`Tgl: ${receiptData.tanggal.split(' ')[0]}`, 10, 40);
    doc.text(`Jam: ${receiptData.tanggal.split(' ')[1]}`, 10, 45);
    doc.text(`Pembeli: ${receiptData.pembeli}`, 10, 50);
    
    doc.text("-----------------------------------------", 40, 55, { align: "center" });
    
    doc.setFont("helvetica", "bold");
    doc.text(`${receiptData.produk}`, 10, 62);
    doc.setFont("helvetica", "normal");
    doc.text(`${receiptData.jumlah}x Rp ${selectedProduct.harga.toLocaleString('id-ID')}`, 10, 68);
    
    const subtotal = `Rp ${receiptData.total.toLocaleString('id-ID')}`;
    doc.text(subtotal, 70, 68, { align: "right" });
    
    doc.text("-----------------------------------------", 40, 75, { align: "center" });
    
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", 10, 82);
    doc.text(subtotal, 70, 82, { align: "right" });
    doc.setFont("helvetica", "normal");
    
    doc.text(`Metode: ${receiptData.metode}`, 10, 90);
    doc.text(`Status: ${receiptData.status}`, 10, 95);
    
    doc.text("-----------------------------------------", 40, 102, { align: "center" });
    
    // Draw dummy barcode
    doc.setFont("courier", "bold");
    doc.setFontSize(12);
    // Draw vertical lines to simulate barcode
    let x = 15;
    for(let i=0; i<30; i++) {
       const w = Math.random() > 0.5 ? 1 : 0.4;
       doc.rect(x, 110, w, 15, 'F');
       x += w + (Math.random() > 0.5 ? 1 : 0.5);
    }
    
    doc.setFontSize(8);
    doc.text(receiptData.id, 40, 130, { align: "center" });
    doc.text(receiptData.kode, 40, 135, { align: "center" });
    
    doc.text("Tunjukkan struk ini di Kantin", 40, 145, { align: "center" });
    
    doc.save(`Struk_Kantin_${receiptData.id}.pdf`);
  };

  const categories = ['Semua', ...Array.from(new Set(produkList.map(p => p.jenisProduk)))];
  
  const filteredList = produkList.filter(item => {
    const q = searchQuery.toLowerCase();
    const matchSearch = (item.namaProduk?.toLowerCase() || '').includes(q) || (item.kodeProduk?.toLowerCase() || '').includes(q);
    const matchCategory = filterJenis === 'Semua' || item.jenisProduk === filterJenis;
    return matchSearch && matchCategory;
  });

  const renderViewModal = () => {
    if (!isViewModalOpen || !selectedProduct) return null;
    
    const content = (
      <div className="p-6 pb-24 lg:pb-6">
        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700/50">
          <div className="h-48 w-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center relative">
             <Coffee className="w-16 h-16 text-slate-400 dark:text-slate-500 opacity-50" />
             <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur text-indigo-600 dark:text-indigo-400 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                {selectedProduct.jenisProduk}
             </div>
          </div>
          <div className="p-6">
             <div className="text-xs text-slate-500 mb-1 font-mono">Kode: {selectedProduct.kodeProduk}</div>
             <h3 className="font-bold text-2xl text-slate-800 dark:text-white leading-tight mb-2">{selectedProduct.namaProduk}</h3>
             
             <div className="grid grid-cols-2 gap-4 my-6">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                   <div className="text-xs text-slate-500 mb-1">Harga Satuan</div>
                   <div className="font-bold text-green-600 dark:text-green-400 text-lg">Rp {selectedProduct.harga.toLocaleString('id-ID')}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                   <div className="text-xs text-slate-500 mb-1">Sisa Stok</div>
                   <div className="font-bold text-slate-800 dark:text-white text-lg">{selectedProduct.stok} <span className="text-xs font-normal text-slate-500">tersedia</span></div>
                </div>
             </div>
             
             <div>
                <div className="text-sm text-slate-500 font-semibold mb-2">Deskripsi Produk</div>
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{selectedProduct.deskripsi || 'Tidak ada deskripsi tersedia untuk produk ini.'}</p>
             </div>

             <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-6">
                <button 
                  onClick={() => {
                     setIsViewModalOpen(false);
                     setTimeout(() => openBuy(selectedProduct), 300);
                  }}
                  disabled={parseInt(selectedProduct.stok, 10) <= 0}
                  className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-lg shadow-orange-500/30 transition-all active:scale-[0.98] flex justify-center items-center gap-2"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {parseInt(selectedProduct.stok, 10) <= 0 ? 'Stok Habis' : 'Beli Sekarang'}
                </button>
             </div>
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
        <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[24px] shadow-2xl relative z-10 flex flex-col overflow-hidden max-h-[90vh]">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl sticky top-0 z-10">
             <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Eye className="w-5 h-5 text-slate-500" /> Review Produk</h2>
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

  const renderBuyModal = () => {
    if (!isBuyModalOpen || !selectedProduct) return null;
    
    const canUseCash = ['Cash', 'Cash & Tukar Poin'].includes(selectedProduct.metodePenjualan);
    const canUsePoin = ['Tukar Poin', 'Cash & Tukar Poin'].includes(selectedProduct.metodePenjualan);
    
    const isOutOfStock = parseInt(selectedProduct.stok, 10) <= 0;
    
    const content = (
      <div className="p-6 pb-24 lg:pb-6">
        {showReceipt ? (
           <div className="animate-in fade-in zoom-in-95 duration-200 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                 <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Pembelian Berhasil!</h3>
              <p className="text-slate-500 text-sm mb-6 max-w-xs">Pesanan {receiptData?.produk} Anda telah dibuat dan menunggu pengambilan di kantin.</p>
              
              <div className="bg-white dark:bg-slate-800 w-full rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm mb-6 border-t-[10px] border-t-orange-500">
                 <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100 dark:border-slate-700/50 border-dashed">
                    <span className="text-slate-500 text-sm">No. Struk</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-white">{receiptData?.id}</span>
                 </div>
                 <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                       <span className="text-sm text-slate-500 text-left max-w-[60%]">{receiptData?.produk} <span className="font-bold text-slate-700 dark:text-slate-300">x{receiptData?.jumlah}</span></span>
                       <span className="text-sm font-semibold text-slate-800 dark:text-white text-right">Rp {receiptData?.total.toLocaleString('id-ID')}</span>
                    </div>
                 </div>
                 <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-700/50">
                    <span className="text-sm text-slate-500">Status Pembayaran</span>
                    <span className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">{receiptData?.metode}</span>
                 </div>
                 
                 <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
                    <div className="w-48 h-16 flex justify-between px-2 opacity-80 mb-2">
                       {/* Pure CSS Barcode mock */}
                       {[...Array(40)].map((_, i) => (
                         <div key={i} className={`h-full bg-slate-800 dark:bg-slate-200 ${Math.random() > 0.5 ? 'w-0.5' : Math.random() > 0.8 ? 'w-1.5' : 'w-1'}`}></div>
                       ))}
                    </div>
                    <span className="font-mono text-xs text-slate-500 tracking-widest">{receiptData?.kode}</span>
                 </div>
              </div>
              
              <div className="flex flex-col gap-3 w-full">
                 <button 
                   onClick={handleDownloadStruk}
                   className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-orange-500/30 transition-all flex justify-center items-center gap-2"
                 >
                   <Download className="w-5 h-5" /> Download Struk Barcode
                 </button>
                 <button 
                   onClick={() => { setIsBuyModalOpen(false); setShowReceipt(false); }}
                   className="w-full py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all"
                 >
                   Tutup & Kembali
                 </button>
              </div>
           </div>
        ) : showConfirmBuy ? (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center justify-center py-4 mb-6">
               <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-bold text-slate-800 dark:text-white text-center">Konfirmasi Pembelian</h3>
               <p className="text-slate-500 text-center text-sm mt-2">Pastikan pesanan Anda sudah sesuai sebelum melanjutkan proses pembayaran.</p>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-400/10 p-5 rounded-2xl border border-slate-200 dark:border-slate-500/20 mb-6">
              <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700/50">
                  <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                     <Coffee className="w-6 h-6 text-orange-500" />
                  </div>
                  <div className="flex-1">
                     <div className="font-bold text-slate-900 dark:text-white line-clamp-1">{selectedProduct.namaProduk}</div>
                     <div className="text-xs text-slate-500">Rp {selectedProduct.harga.toLocaleString('id-ID')} / unit</div>
                  </div>
                </div>
                <div className="flex justify-between items-center"><span className="text-slate-500">Jumlah Pesanan:</span> <span className="font-bold">{buyQuantity} porsi</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500">Metode Bayar:</span> <span className="font-semibold text-indigo-600 dark:text-indigo-400">{metodePembelian}</span></div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-700/50"><span className="text-slate-500 font-medium">Total Tagihan:</span> <span className="font-black text-xl text-green-600 dark:text-green-400">Rp {(buyQuantity * selectedProduct.harga).toLocaleString('id-ID')}</span></div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmBuy(false)}
                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
               >
                 Batal / Koreksi
               </button>
               <button 
                 onClick={handleConfirmBuy}
                 className="flex-1 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-600/30 transition-colors"
               >
                 Ya, Setuju Membeli
               </button>
             </div>
           </div>
         ) : (
           <div className="space-y-6">
             <div className="flex gap-4 items-start pb-6 border-b border-slate-100 dark:border-slate-800">
               <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700/50 overflow-hidden">
                 <Coffee className="w-10 h-10 text-slate-400" />
               </div>
               <div className="pt-1">
                 <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-tight mb-1">{selectedProduct.namaProduk}</h3>
                 <div className="text-green-600 dark:text-green-400 font-bold">Rp {selectedProduct.harga.toLocaleString('id-ID')}</div>
                 <div className="text-xs text-slate-500 mt-1">Stok tersisa: {selectedProduct.stok}</div>
               </div>
             </div>

             <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-3">Kuantitas Pembelian</label>
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-700/50 w-fit mx-auto">
                   <button 
                     onClick={decreaseQty} 
                     disabled={buyQuantity <= 1}
                     className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm disabled:opacity-50 active:scale-95 transition-transform"
                   >
                     <Minus className="w-5 h-5" />
                   </button>
                   <div className="w-12 text-center font-bold text-xl text-slate-800 dark:text-white">
                     {buyQuantity}
                   </div>
                   <button 
                     onClick={increaseQty} 
                     disabled={buyQuantity >= parseInt(selectedProduct.stok, 10)}
                     className="w-10 h-10 flex items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm disabled:opacity-50 active:scale-95 transition-transform shadow-orange-500/20"
                   >
                     <Plus className="w-5 h-5" />
                   </button>
                </div>
             </div>

             <div className="pt-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-3">Pilih Metode Pembelian</label>
                <div className="grid grid-cols-2 gap-3">
                   {canUseCash && (
                     <button
                       onClick={() => setMetodePembelian('Cash')}
                       className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                         metodePembelian === 'Cash' 
                           ? 'border-indigo-600 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' 
                           : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                       }`}
                     >
                       <ShoppingBag className={`w-8 h-8 mb-2 ${metodePembelian === 'Cash' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                       <span className="font-bold text-sm">Poin Saldo / Cash</span>
                     </button>
                   )}
                   {canUsePoin && (
                     <button
                       onClick={() => setMetodePembelian('Tukar Poin')}
                       className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                         metodePembelian === 'Tukar Poin' 
                           ? 'border-orange-500 bg-orange-50 dark:border-orange-500 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400' 
                           : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                       }`}
                     >
                       <Ticket className={`w-8 h-8 mb-2 ${metodePembelian === 'Tukar Poin' ? 'text-orange-500 dark:text-orange-400' : 'text-slate-400'}`} />
                       <span className="font-bold text-sm">Tukar Poin / Poin Loyalty</span>
                     </button>
                   )}
                </div>
             </div>

             <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-500">Total Harga</div>
                  <div className="font-black text-2xl text-green-600 dark:text-green-400">Rp {(buyQuantity * selectedProduct.harga).toLocaleString('id-ID')}</div>
                </div>
                <button 
                  onClick={handlePreBuy}
                  disabled={isOutOfStock}
                  className="px-8 py-4 bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-bold text-lg shadow-xl shadow-slate-900/20 dark:shadow-white/10 transition-all active:scale-95"
                >
                  <span className="whitespace-nowrap">Beli Sekarang</span>
                </button>
             </div>
           </div>
         )}
      </div>
    );

    if (isMobile) {
      return (
        <MobileBottomSheet isOpen={isBuyModalOpen} onClose={() => setIsBuyModalOpen(false)} title={showReceipt ? "Struk Tersimpan" : showConfirmBuy ? "Konfirmasi Pesanan" : "Proses Pembelian"}>
          {content}
        </MobileBottomSheet>
      );
    }

    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsBuyModalOpen(false)} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[24px] shadow-2xl relative z-10 flex flex-col overflow-hidden max-h-[90vh]">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl sticky top-0 z-10">
             <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
               {showReceipt ? <QrCode className="w-5 h-5 text-green-500" /> : <ShoppingBag className="w-5 h-5 text-orange-500" />} 
               {showReceipt ? 'Struk Pembelian' : showConfirmBuy ? 'Konfirmasi' : 'Pembelian Produk'}
             </h2>
             {!showReceipt && (
               <button onClick={() => setIsBuyModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                 <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
               </button>
             )}
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[100vw] overflow-x-hidden pt-safe pb-32">
      <div className="flex flex-col gap-6">
        
        {/* Banner Section */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden h-40 sm:h-48 md:h-56 flex flex-col justify-end">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
           <div className="absolute bottom-0 right-10 opacity-20 pointer-events-none transform translate-y-1/4 right-0 rotate-[-15deg]">
              <Coffee className="w-48 h-48 sm:w-64 sm:h-64" />
           </div>
           
           <div className="relative z-10">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">Kantin e-Commerce</h1>
              <p className="text-white/80 font-medium text-sm sm:text-base max-w-sm sm:max-w-md">Jelajahi dan pesan menu favorit kamu dari kantin sekolah dengan mudah, kapan saja.</p>
           </div>
        </div>

        {/* Search & Categories */}
        <div className="flex flex-col md:flex-row gap-4 items-center mb-2 mt-4 z-20">
           <div className="relative w-full md:w-96 shrink-0 group">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
              <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Cari makanan & minuman..." 
                 className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700/50 rounded-2xl outline-none focus:border-orange-500 dark:focus:border-orange-500 text-sm dark:text-white shadow-sm transition-all"
              />
           </div>
           
           <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 no-scrollbar scroll-smooth">
              {categories.map((cat, idx) => (
                 <button 
                   key={idx}
                   onClick={() => setFilterJenis(cat)}
                   className={`whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm ${
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

        {/* Product Grid */}
        {filteredList.length > 0 ? (
           <div className="grid grid-cols-2 sm:grid-cols-3md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
              {filteredList.map((item) => {
                 const stokInt = parseInt(item.stok, 10);
                 const isEmpty = stokInt <= 0;
                 return (
                 <div key={item.id} className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300 group flex flex-col h-full relative cursor-pointer" onClick={() => openView(item)}>
                    
                    {isEmpty && (
                       <div className="absolute top-2 right-2 z-10 bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">
                          HABIS
                       </div>
                    )}
                    {!isEmpty && item.stok <= 5 && (
                       <div className="absolute top-2 right-2 z-10 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">
                          SISA {item.stok}
                       </div>
                    )}
                    
                    {/* Cover Photo Placeholder */}
                    <div className="h-32 sm:h-36 md:h-40 w-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center relative overflow-hidden group-hover:bg-orange-50 dark:group-hover:bg-orange-500/10 transition-colors shrink-0">
                       <Coffee className="w-12 h-12 text-slate-300 dark:text-slate-600 group-hover:text-orange-300 dark:group-hover:text-orange-500/50 transition-colors" />
                    </div>
                    
                    <div className="p-3 sm:p-4 flex flex-col flex-1">
                       <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1 line-clamp-1">{item.jenisProduk}</div>
                       <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white leading-tight mb-2 line-clamp-2">{item.namaProduk}</h3>
                       
                       <div className="mt-auto pt-2">
                          <div className="font-black text-green-600 dark:text-green-400 text-sm sm:text-base mb-3">Rp {item.harga.toLocaleString('id-ID')}</div>
                          
                          <div className="flex items-center gap-2">
                             <button 
                               onClick={(e) => { e.stopPropagation(); openBuy(item); }}
                               disabled={isEmpty}
                               className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none text-white text-xs sm:text-sm font-bold py-2.5 rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all text-center flex items-center justify-center gap-1"
                             >
                               {isEmpty ? 'Habis' : <><ShoppingBag className="w-3.5 h-3.5" /> Beli</>}
                             </button>
                          </div>
                       </div>
                    </div>
                 </div>
                 );
              })}
           </div>
        ) : (
           <div className="bg-slate-50 dark:bg-slate-800/20 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 mt-4">
              <ShoppingBag className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Produk Kantin Kosong</h3>
              <p className="text-slate-500 max-w-sm mx-auto">Saat ini belum ada produk menu kantin yang tersedia atau diunggah oleh mitra.</p>
           </div>
        )}
      </div>

      {renderViewModal()}
      {renderBuyModal()}
    </div>
  );
}

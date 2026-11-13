import { useState, useEffect, useRef, useCallback } from 'react';
import { ShoppingCart, Camera, X, CheckCircle2, Store, Calendar, FileText, Loader2, Scan } from 'lucide-react';
import Webcam from 'react-webcam';
import { useAppContext } from '../../AppContext';
import { useIsMobile } from '../../App';
import { createPortal } from 'react-dom';
import { recordLog } from '../../utils/logHelper';
export function DataPenjualanToko() {
  const { user, showNotification } = useAppContext();
  const isMobile = useIsMobile();
  const [penjualanList, setPenjualanList] = useState<any[]>([]);
  
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const webcamRef = useRef<Webcam>(null);
  useEffect(() => {
    const loadData = () => {
      const list = JSON.parse(localStorage.getItem('sd_penjualan_toko_list') || '[]');
      setPenjualanList(list);
    };
    loadData();
    window.addEventListener('localStorageUpdate', loadData);
    return () => window.removeEventListener('localStorageUpdate', loadData);
  }, []);
  const handleCapture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setIsScanning(true);
      // Simulate OCR and Validation
      setTimeout(() => {
        setIsScanning(false);
        const randId = Math.floor(Math.random() * 10000);
        const newSale = {
          id: new Date().getTime().toString(),
          tanggalWaktu: new Date().toLocaleString('id-ID'),
          kodeStruk: `STRUK-${randId}`,
          namaProduk: `Produk Scan Otomatis ${randId}`,
          totalBelanja: Math.floor(Math.random() * 50000) + 10000,
          petugas: user?.name || 'Sistem',
          statusValidasi: 'Valid',
          buktiStruk: imageSrc
        };
        setScanResult(newSale);
      }, 2500);
    }
  }, [user]);
  const saveScanResult = () => {
    if (scanResult) {
      const updatedList = [scanResult, ...penjualanList];
      setPenjualanList(updatedList);
      localStorage.setItem('sd_penjualan_toko_list', JSON.stringify(updatedList));
      
      if (user) {
        recordLog(user, 'CREATE', 'Data Penjualan Toko', `Memvalidasi dan menambahkan data penjualan struk ${scanResult.kodeStruk} dengan total Rp ${scanResult.totalBelanja.toLocaleString('id-ID')}`);
      }
      showNotification('Struk berhasil divalidasi dan data tersimpan!');
      setScanResult(null);
      setIsScannerOpen(false);
    }
  };
  const reScan = () => {
    setScanResult(null);
  };
  const renderScannerModal = () => {
    if (!isScannerOpen) return null;
    const content = (
      <div className="flex flex-col h-full bg-slate-900 text-white rounded-t-2xl lg:rounded-2xl relative overflow-hidden">
         {!scanResult ? (
            <div className="flex-1 relative flex flex-col items-center justify-center bg-black min-h-[60vh] max-h-[80vh]">
               {isScanning ? (
                 <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm">
                   <Scan className="w-16 h-16 text-pink-500 animate-pulse mb-4" />
                   <h3 className="text-xl font-bold mb-2">Memindai Struk...</h3>
                   <p className="text-slate-400 text-sm">Sistem sedang menvalidasi data dari gambar.</p>
                   <Loader2 className="w-6 h-6 animate-spin text-pink-500 mt-6" />
                 </div>
               ) : (
                 <>
                   <div className="absolute top-4 right-4 z-10">
                     <button onClick={() => setIsScannerOpen(false)} className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-full backdrop-blur-2xl">
                        <X className="w-6 h-6" />
                     </button>
                   </div>
                   <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{ facingMode: "environment" }}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 border-[3px] border-white/20 pointer-events-none z-0 m-8 rounded-2xl">
                      <div className="absolute top-0 flex w-full justify-center -mt-3">
                         <span className="bg-pink-600 font-bold px-3 py-1 rounded-full text-xs">Arahkan Kamera ke Struk</span>
                      </div>
                    </div>
                    <div className="absolute bottom-8 z-10 flex w-full justify-center">
                       <button onClick={handleCapture} className="w-20 h-20 rounded-full bg-white/20 border-4 border-white flex items-center justify-center hover:bg-white/40 transition-colors backdrop-blur-sm active:scale-95">
                          <Camera className="w-8 h-8 text-white" />
                       </button>
                    </div>
                 </>
               )}
            </div>
         ) : (
            <div className="p-6 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col h-full overflow-y-auto">
               <div className="flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-bold text-center mb-6">Struk Tervalidasi!</h3>
               
               <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 mb-6 relative">
                 {/* Torn paper edge effect at top and bottom */}
                 <div className="absolute top-0 left-0 w-full h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHBhdGggZD0iTTAgMTBMMiA4TDQgMTBMNiA4TDggMTBMMTAgOHYySDB6IiBmaWxsPSIjZjhmOWZhIi8+PC9zdmc+')] -mt-1 dark:opacity-10"></div>
                 
                 <div className="flex justify-center mb-4">
                    <Store className="w-8 h-8 text-slate-400" />
                 </div>
                 <div className="text-center font-bold text-lg border-b border-dashed border-slate-300 dark:border-slate-600 pb-3 mb-3">
                   Toko Sekolah / Kantin
                 </div>
                 
                 <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex justify-between">
                       <span>Kode Struk:</span>
                       <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{scanResult.kodeStruk}</span>
                    </div>
                    <div className="flex justify-between">
                       <span>Tanggal:</span>
                       <span>{scanResult.tanggalWaktu}</span>
                    </div>
                    <div className="flex justify-between">
                       <span>Item Terditeksi:</span>
                       <span className="text-right max-w-[50%]">{scanResult.namaProduk}</span>
                    </div>
                    <div className="border-t border-dashed border-slate-300 dark:border-slate-600 my-2 pt-2 flex justify-between font-bold text-slate-800 dark:text-white text-base">
                       <span>Total Valid:</span>
                       <span className="text-pink-600 dark:text-pink-400 font-bold">Rp {scanResult.totalBelanja.toLocaleString('id-ID')}</span>
                    </div>
                 </div>
                 <div className="absolute bottom-0 left-0 w-full h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHBhdGggZD0iTTAgMEwyIDJMNCAwTDYgMkw4IDBMMTAgMnYtMkgweiIgZmlsbD0iI2Y4ZjlmYSIvPjwvc3ZnPg==')] -mb-1 dark:opacity-10"></div>
               </div>
               <div className="mt-auto flex gap-3">
                 <button onClick={reScan} className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700">
                    Scan Ulang
                 </button>
                 <button onClick={saveScanResult} className="flex-[2] py-3.5 bg-pink-600 text-white rounded-xl font-bold shadow-lg shadow-pink-600/30 hover:bg-pink-700">
                    Simpan Data
                 </button>
               </div>
            </div>
         )}
      </div>
    );
    if (isMobile) {
      return (
         <div className="fixed inset-0 z-[99999] bg-black">
           {content}
         </div>
      );
    }
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
         <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsScannerOpen(false)} />
         <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[24px] shadow-2xl relative z-10 flex flex-col overflow-hidden max-h-[90vh]">
            {content}
         </div>
      </div>,
      document.body
    );
  };
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full pb-32">
       <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl shadow-pink-500/20 relative overflow-hidden h-40 sm:h-48 flex flex-col justify-end mb-8">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
           <div className="absolute bottom-0 right-10 opacity-20 pointer-events-none transform translate-y-1/4 right-0 rotate-[-15deg]">
              <ShoppingCart className="w-48 h-48 sm:w-64 sm:h-64" />
           </div>
           
           <div className="relative z-10">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">Data Penjualan Toko</h1>
              <p className="text-pink-100 font-medium text-sm sm:text-base max-w-sm sm:max-w-md">Kelola dan validasi struk penjualan toko sekolah dengan scan kamera otomatis.</p>
           </div>
       </div>
       <div className="mb-8">
          <button 
            onClick={() => setIsScannerOpen(true)}
            className="w-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-pink-500 to-rose-600 p-8 rounded-[24px] text-white shadow-xl shadow-pink-500/20 active:scale-95 transition-all text-center border-b-4 border-pink-700/50 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="bg-white/20 p-4 rounded-full backdrop-blur-2xl relative z-10">
              <Camera className="w-8 h-8" strokeWidth={2.5} />
            </div>
            <div>
               <h3 className="font-extrabold text-xl tracking-wide relative z-10">Scan Struk Penjualan</h3>
               <p className="text-pink-100 mt-1 relative z-10 text-sm">Gunakan kamera untuk menscan & validasi otomatis struk.</p>
            </div>
          </button>
       </div>
       <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Riwayat Penjualan & Validasi
          </h2>
          <span className="text-sm font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            {penjualanList.length} Transaksi
          </span>
       </div>
       <div className="space-y-4">
          {penjualanList.length > 0 ? penjualanList.map(item => (
            <div key={item.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 hover:border-pink-200 dark:hover:border-pink-500/30 transition-colors">
               <div className="flex items-start gap-4">
                 <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl mt-1 shrink-0">
                    <FileText className="w-6 h-6" />
                 </div>
                 <div>
                    <div className="flex items-center gap-2 mb-1">
                       <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">{item.kodeStruk}</span>
                       <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-md">Valid</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 font-medium mb-1 line-clamp-1">{item.namaProduk}</div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                       <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/> {item.tanggalWaktu}</span>
                    </div>
                 </div>
               </div>
               <div className="sm:text-right border-t sm:border-t-0 border-slate-100 dark:border-slate-700 pt-3 sm:pt-0">
                  <div className="text-xs text-slate-500 mb-0.5">Total Penjualan</div>
                  <div className="text-lg font-bold text-pink-600 dark:text-pink-400">Rp {item.totalBelanja.toLocaleString('id-ID')}</div>
               </div>
            </div>
          )) : (
             <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Belum ada transaksi validasi.</h3>
                <p className="text-slate-500 max-w-sm mx-auto">Gunakan fitur scan di atas untuk mulai menvalidasi dan menginput struk.</p>
             </div>
          )}
       </div>
       {renderScannerModal()}
    </div>
  );
}
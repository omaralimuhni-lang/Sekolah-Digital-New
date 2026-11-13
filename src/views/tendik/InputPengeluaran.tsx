import { StrukHeader, applyPdfKop } from '../../utils/kopHelper';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, ChevronLeft, Calendar, User, FileText, FileSpreadsheet, Filter, Upload, Eye, Edit2, Trash2, FileCheck, TrendingDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas-pro';
import { useAppContext } from '../../AppContext';
import { triggerNotificationUpdate } from '../../lib/eventBus';
import { useIsMobile } from '../../App';
import { MobileBottomSheet } from '../../components/ui/MobileBottomSheet';
import { RpIcon } from '../../components/ui/RpIcon';
import { recordLog } from '../../utils/logHelper';
const JENIS_PENGELUARAN = [
  'Pengeluaran Rutin',
  'Pengeluaran Lainnya'
];
export function InputPengeluaran() {
  const { user, showNotification } = useAppContext();
  const isMobile = useIsMobile();
  
  const [pengeluaranList, setPengeluaranList] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [saveSuccessData, setSaveSuccessData] = useState<any>(null);
  
  // View Data
  const [viewData, setViewData] = useState<any>(null);
  // Form states
  const [editId, setEditId] = useState<string | null>(null);
  const [tanggalMasuk, setTanggalMasuk] = useState('');
  const [waktuMasuk, setWaktuMasuk] = useState('');
  const [kodePengeluaran, setKodePengeluaran] = useState('');
  const [jenisPengeluaran, setJenisPengeluaran] = useState('');
  const [namaPengeluaran, setNamaPengeluaran] = useState('');
  const [nominalPengeluaran, setNominalPengeluaran] = useState(0);
  const [rawNominal, setRawNominal] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [petugas, setPetugas] = useState(user?.name || '');
  const [fileDokumen, setFileDokumen] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  // Filter and Search for history
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyFilterJenis, setHistoryFilterJenis] = useState('');
  const formatCurrency = (value: number) => value.toLocaleString('id-ID');
  const parseCurrency = (value: string) => parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
  useEffect(() => {
    const loadData = () => {
      const list = JSON.parse(localStorage.getItem('sd_pengeluaran_list') || '[]');
      setPengeluaranList(list);
    };
    loadData();
    window.addEventListener('localStorageUpdate', loadData);
    return () => window.removeEventListener('localStorageUpdate', loadData);
  }, []);
  const generateKode = (jenis: string) => {
    if (!jenis) return '';
    const prefix = jenis === 'Pengeluaran Rutin' ? 'RTN' : 'LNN';
    const num = Math.floor(Math.random() * 9000) + 1000;
    const date = new Date();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = String(date.getFullYear()).substr(-2);
    return `${prefix}-${mm}${yy}-${num}`;
  };
  useEffect(() => {
    if (isModalOpen && !editId) {
      const nw = new Date();
      setTanggalMasuk(nw.toISOString().split('T')[0]);
      setWaktuMasuk(nw.toTimeString().split(' ')[0].substring(0, 5));
      setPetugas(user?.name || '');
    }
  }, [isModalOpen, editId, user]);
  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const parsed = parseCurrency(raw);
    const validParsed = Math.max(0, parsed);
    setRawNominal(validParsed === 0 ? '' : formatCurrency(validParsed));
    setNominalPengeluaran(validParsed);
  };
  const handleJenisChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setJenisPengeluaran(v);
    if (!editId) {
      setKodePengeluaran(generateKode(v));
    }
  };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['image/jpeg', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        alert("Format file tidak didukung. Harap unggah JPG atau PDF.");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran file maksimal 2MB.");
        return;
      }
      setFileDokumen(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      if (file.type.startsWith('image/')) {
         reader.readAsDataURL(file);
      } else {
         setFilePreview(file.name);
      }
    }
  };
  const openTambah = () => {
    const nw = new Date();
    setTanggalMasuk(nw.toISOString().split('T')[0]);
    setWaktuMasuk(nw.toTimeString().split(' ')[0].substring(0, 5));
    setJenisPengeluaran('');
    setKodePengeluaran('');
    setNamaPengeluaran('');
    setNominalPengeluaran(0);
    setRawNominal('');
    setKeterangan('');
    setFileDokumen(null);
    setFilePreview(null);
    setPetugas(user?.name || '');
    setEditId(null);
    setIsModalOpen(true);
    setShowConfirm(false);
    setSaveSuccessData(null);
  };
  const openEdit = (p: any) => {
    setEditId(p.id);
    setTanggalMasuk(p.tanggal);
    setWaktuMasuk(p.waktu || '12:00');
    setKodePengeluaran(p.kode);
    setJenisPengeluaran(p.jenis);
    setNamaPengeluaran(p.nama);
    setNominalPengeluaran(p.nominal);
    setRawNominal(formatCurrency(p.nominal));
    setKeterangan(p.keterangan || '');
    setFilePreview(p.filePreview || null);
    setPetugas(p.petugas || user?.name || '');
    setIsModalOpen(true);
    setShowConfirm(false);
    setSaveSuccessData(null);
  };
  const openView = (p: any) => {
    setViewData(p);
    setIsViewModalOpen(true);
  };
  const handleDelete = (id: string) => {
    if(confirm("Apakah Anda yakin ingin menghapus data ini?")) {
       const deletedItem = pengeluaranList.find(p => p.id === id);
       const updated = pengeluaranList.filter(p => p.id !== id);
       setPengeluaranList(updated);
       localStorage.setItem('sd_pengeluaran_list', JSON.stringify(updated));
       if (user && deletedItem) {
          recordLog(user, 'DELETE', 'Pengeluaran', `Menghapus data pengeluaran ${deletedItem.kode} - ${deletedItem.nama}`);
       }
    }
  };
  const handleSimpan = () => {
    if (!jenisPengeluaran || !namaPengeluaran || nominalPengeluaran <= 0) {
      alert("Harap lengkapi semua data wajib (Jenis, Nama, Nominal).");
      setShowConfirm(false);
      return;
    }
    let updatedList;
    let savedRecord;
    
    if (editId) {
       updatedList = pengeluaranList.map(p => {
         if (p.id === editId) {
           savedRecord = {
             ...p,
             jenis: jenisPengeluaran,
             nama: namaPengeluaran,
             nominal: nominalPengeluaran,
             keterangan: keterangan,
             filePreview: filePreview || p.filePreview
           };
           return savedRecord;
         }
         return p;
       });
       if (user && savedRecord) {
          recordLog(user, 'UPDATE', 'Pengeluaran', `Memperbarui data pengeluaran ${savedRecord.kode} - ${savedRecord.nama} dengan nominal Rp ${formatCurrency(nominalPengeluaran)}`);
       }
    } else {
      const newRecord = {
        id: new Date().getTime().toString(),
        tanggal: tanggalMasuk,
        waktu: waktuMasuk,
        kode: kodePengeluaran,
        jenis: jenisPengeluaran,
        nama: namaPengeluaran,
        nominal: nominalPengeluaran,
        keterangan: keterangan,
        filePreview: filePreview,
        fileType: fileDokumen?.type || 'none',
        fileName: fileDokumen?.name || 'none',
        petugas: petugas,
      };
      savedRecord = newRecord;
      updatedList = [newRecord, ...pengeluaranList];
      if (user) {
         recordLog(user, 'CREATE', 'Pengeluaran', `Mencatat pengeluaran baru ${newRecord.kode} - ${newRecord.nama} dengan nominal Rp ${formatCurrency(nominalPengeluaran)}`);
      }
    }
    
    setPengeluaranList(updatedList);
    localStorage.setItem('sd_pengeluaran_list', JSON.stringify(updatedList));
    if (!editId) {
      triggerNotificationUpdate(['Laporan Pengeluaran', 'Laporan Keuangan']);
    }
    setShowConfirm(false);
    showNotification(editId ? "Data pengeluaran berhasil diperbarui!" : "Data pengeluaran berhasil disimpan!");
    setSaveSuccessData(savedRecord);
  };
  const filteredList = pengeluaranList.filter(p => {
    const matchSearch = historySearchQuery === '' || 
      p.nama?.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
      p.kode?.toLowerCase().includes(historySearchQuery.toLowerCase());
    const matchJenis = historyFilterJenis === '' || p.jenis === historyFilterJenis;
    
    return matchSearch && matchJenis;
  });
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const startY = applyPdfKop(doc);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Laporan", 14, startY + 5);
    doc.setFontSize(16);
    doc.text('Laporan Pengeluaran', 14, 15);
    
    const tableColumn = ["Tanggal", "Kode", "Nama", "Jenis", "Nominal (Rp)", "Petugas"];
    const tableRows: any[] = [];
    
    filteredList.forEach(p => {
      const pData = [
        `${p.tanggal} ${p.waktu || ''}`,
        p.kode,
        p.nama,
        p.jenis,
        formatCurrency(p.nominal),
        p.petugas
      ];
      tableRows.push(pData);
    });
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
    });
    
    doc.save(`Laporan_Pengeluaran_${new Date().getTime()}.pdf`);
  };
  const handleExportExcel = () => {
    const wsData = filteredList.map(p => ({
      "Tanggal": p.tanggal,
      "Waktu": p.waktu,
      "Kode Pengeluaran": p.kode,
      "Nama Pengeluaran": p.nama,
      "Jenis": p.jenis,
      "Nominal": p.nominal,
      "Keterangan": p.keterangan,
      "Petugas": p.petugas
    }));
    
    import('../../utils/kopHelper').then(({ exportToExcel }) => {
      exportToExcel(wsData, "Laporan_Pengeluaran", "PENGELUARAN");
    });
  };
  const renderFormContent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Tanggal</label>
          <div className="relative">
            <Calendar className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="date" value={tanggalMasuk} disabled className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 cursor-not-allowed" />
          </div>
        </div>
        <div>
           <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Waktu</label>
           <input type="time" value={waktuMasuk} disabled className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 cursor-not-allowed" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Jenis Pengeluaran</label>
        <select value={jenisPengeluaran} onChange={handleJenisChange} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none">
          <option value="">-- Pilih Jenis Pengeluaran --</option>
          {JENIS_PENGELUARAN.map(j => (
            <option key={j} value={j}>{j}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Kode Pengeluaran</label>
        <input type="text" value={kodePengeluaran} disabled placeholder="Pilih jenis untuk generate" className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono" />
      </div>
      <div>
         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Nama Pengeluaran</label>
         <input type="text" value={namaPengeluaran} onChange={(e)=>setNamaPengeluaran(e.target.value)} placeholder="Contoh: Pembayaran Listrik" className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none" />
      </div>
      <div className="bg-rose-50 dark:bg-rose-500/10 p-4 rounded-xl border border-rose-100 dark:border-rose-500/20">
         <label className="text-xs font-bold text-rose-700 dark:text-rose-400 block mb-1">Nominal Pengeluaran</label>
         <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-700 dark:text-slate-300">Rp</span>
            <input 
              type="text" 
              value={rawNominal}
              onChange={handleNominalChange}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-500/30 rounded-xl text-lg font-extrabold text-slate-800 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
              placeholder="0"
            />
         </div>
      </div>
      <div>
         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Keterangan (Opsional)</label>
         <textarea rows={3} value={keterangan} onChange={(e)=>setKeterangan(e.target.value)} placeholder="Tulis keterangan..." className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none resize-none"></textarea>
      </div>
      <div>
         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Dokumen (JPG/PDF, Maks 2MB)</label>
         <div 
           className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
           onClick={() => fileInputRef.current?.click()}
         >
           {filePreview ? (
             <div className="flex flex-col items-center gap-2">
                <FileCheck className="w-10 h-10 text-emerald-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{fileDokumen?.name || 'Dokumen terlampir'}</span>
                <span className="text-xs text-rose-500 hover:underline" onClick={(e) => { e.stopPropagation(); setFilePreview(null); setFileDokumen(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}>Hapus file</span>
             </div>
           ) : (
             <div className="flex flex-col items-center gap-2">
                <Upload className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Pilih file untuk diunggah</span>
             </div>
           )}
           <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept=".jpg,.jpeg,.pdf" />
         </div>
      </div>
      <div>
         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Petugas Pencatatan</label>
         <div className="relative">
            <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={petugas} disabled className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 cursor-not-allowed font-medium" />
         </div>
      </div>
      <div className="pt-2">
        <button 
          onClick={() => {
            setShowConfirm(true);
          }}
          disabled={!jenisPengeluaran || !namaPengeluaran || nominalPengeluaran <= 0}
          className="w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-rose-500/30 transition-all active:scale-[0.98] focus:ring-4 focus:ring-rose-500/20"
        >
          {(!jenisPengeluaran || !namaPengeluaran || nominalPengeluaran <= 0) ? 'Mohon Lengkapi Data' : 'Simpan Pengeluaran'}
        </button>
      </div>
    </div>
  );
  const handleDownloadPengeluaranJPG = async () => {
    const el = document.getElementById('receipt-pengeluaran');
    if (el) {
      const canvas = await html2canvas(el, { scale: 2 });
      const data = canvas.toDataURL('image/jpeg');
      const link = document.createElement('a');
      link.href = data;
      link.download = `Struk_Pengeluaran_${saveSuccessData?.kode}.jpg`;
      link.click();
    }
  };
  const renderSuccessContent = () => (
    <div className="flex flex-col items-center justify-center py-6">
       <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-4">
         <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
       </div>
       <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Pengeluaran Berhasil!</h3>
       <p className="text-slate-500 text-center mb-6 text-sm">Data pengeluaran telah tersimpan di sistem.</p>
       
       <div id="receipt-pengeluaran" className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
         <StrukHeader title="STRUK PENGELUARAN" />
         <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
           <div className="flex justify-between"><span>Kode:</span> <strong>{saveSuccessData?.kode}</strong></div>
           <div className="flex justify-between"><span>Tanggal:</span> <span>{saveSuccessData?.tanggal} {saveSuccessData?.waktu}</span></div>
           <div className="flex justify-between"><span>Jenis:</span> <span>{saveSuccessData?.jenis}</span></div>
           <div className="flex justify-between"><span>Nama:</span> <span>{saveSuccessData?.nama}</span></div>
           <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400">
             <span>Nominal:</span> <span>Rp {saveSuccessData?.nominal?.toLocaleString('id-ID')}</span>
           </div>
         </div>
       </div>
       <div className="w-full max-w-sm">
         <button onClick={handleDownloadPengeluaranJPG} className="w-full flex items-center justify-center gap-2 bg-rose-50 text-rose-600 dark:bg-rose-500/10 hover:bg-rose-100 py-3 rounded-xl font-bold transition-colors">
           Download Struk JPG
         </button>
       </div>
       <button onClick={() => { setIsModalOpen(false); setSaveSuccessData(null); }} className="mt-4 text-slate-500 border border-slate-200 dark:border-slate-700 px-6 py-2 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
         Tutup
       </button>
    </div>
  );
  const renderModal = () => {
    if (!isModalOpen) return null;
    
    const content = (
      <div className="p-6">
        {saveSuccessData ? renderSuccessContent() : showConfirm ? (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-rose-50 dark:bg-rose-500/10 p-5 rounded-2xl border border-rose-100 dark:border-rose-500/20 mb-6">
              <h3 className="text-rose-800 dark:text-rose-400 font-bold mb-4 flex items-center text-lg"><FileText className="w-5 h-5 mr-2" /> Konfirmasi Simpan</h3>
              <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <div className="flex justify-between"><span className="text-slate-500">Kode:</span> <span className="font-mono bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">{kodePengeluaran}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Jenis:</span> <span className="font-semibold">{jenisPengeluaran}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Nama:</span> <span className="font-semibold">{namaPengeluaran}</span></div>
                <div className="flex justify-between font-bold text-base mt-3 border-t border-rose-200 dark:border-rose-500/30 pt-3"><span className="text-slate-800 dark:text-white">Nominal:</span> <span className="text-rose-600 dark:text-rose-400 text-xl font-extrabold">Rp {nominalPengeluaran.toLocaleString('id-ID')}</span></div>
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
                 className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-600/30 transition-colors"
               >
                 Ya, Simpan
               </button>
             </div>
           </div>
         ) : renderFormContent()}
      </div>
    );
    if (isMobile) {
      return (
        <MobileBottomSheet isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Edit Pengeluaran" : "Input Pengeluaran Baru"}>
          {content}
        </MobileBottomSheet>
      );
    }
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[24px] shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl z-10">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{editId ? "Edit Pengeluaran" : "Input Pengeluaran Baru"}</h2>
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
      <div className="p-6">
        <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/50 space-y-4">
          <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-700 pb-4">
             <div>
               <div className="text-sm text-slate-500 mb-1">Kode Transaksi</div>
               <div className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 px-3 py-1 rounded-md mb-2 inline-block border border-slate-200 dark:border-slate-700">{viewData.kode}</div>
               <div className="text-xs text-slate-500 font-medium">{viewData.tanggal} {viewData.waktu}</div>
             </div>
             <div className="text-right">
                <div className="text-sm font-semibold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-3 py-1 rounded-full border border-rose-100 dark:border-rose-500/20">{viewData.jenis}</div>
             </div>
          </div>
          
          <div className="pt-2">
             <div className="text-sm text-slate-500 mb-1">Nama Pengeluaran</div>
             <div className="font-bold text-lg text-slate-800 dark:text-white">{viewData.nama}</div>
          </div>
          <div>
             <div className="text-sm text-slate-500 mb-1">Jumlah Nominal</div>
             <div className="font-extrabold text-2xl text-rose-600 dark:text-rose-400">Rp {viewData.nominal.toLocaleString('id-ID')}</div>
          </div>
          <div>
             <div className="text-sm text-slate-500 mb-1">Keterangan</div>
             <div className="text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 min-h-[60px]">{viewData.keterangan || '-'}</div>
          </div>
          {viewData.filePreview && !viewData.filePreview.includes('data:image') && (
            <div>
               <div className="text-sm text-slate-500 mb-1">Dokumen Lampiran</div>
               <div className="text-sm font-bold text-indigo-500 flex items-center gap-2"><FileCheck className="w-5 h-5"/> {viewData.filePreview}</div>
            </div>
          )}
          <div>
             <div className="text-sm text-slate-500 mb-1">Petugas Pencatatan</div>
             <div className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
               <User className="w-4 h-4" /> {viewData.petugas}
             </div>
          </div>
        </div>
      </div>
    );
    if (isMobile) {
      return (
        <MobileBottomSheet isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Pengeluaran">
          {content}
        </MobileBottomSheet>
      );
    }
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[24px] shadow-2xl relative z-10 flex flex-col overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl">
             <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Detail Pengeluaran</h2>
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
        <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl shadow-rose-500/20 relative overflow-hidden h-40 sm:h-48 flex flex-col justify-end">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
           <div className="absolute bottom-0 right-10 opacity-20 pointer-events-none transform translate-y-1/4 right-0 rotate-[-15deg]">
              <TrendingDown className="w-48 h-48 sm:w-64 sm:h-64" />
           </div>
           
           <div className="relative z-10">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">Input Pengeluaran</h1>
              <p className="text-rose-100 font-medium text-sm sm:text-base max-w-sm sm:max-w-md">Catat dan kelola riwayat pengeluaran kas operasional.</p>
           </div>
        </div>
        {/* Header Options */}
        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={openTambah}
            className="flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-rose-500 to-pink-600 p-5 rounded-[20px] text-white shadow-xl shadow-rose-500/20 active:scale-95 transition-all text-center border-b-4 border-rose-700/50 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm relative z-10">
              <Plus className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-lg tracking-wide relative z-10">Catat Pengeluaran Baru</span>
          </button>
        </div>
        {/* Filter and Export */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-2 self-start lg:self-auto text-slate-800 dark:text-white font-bold text-lg">
              <Filter className="w-5 h-5 text-rose-500" /> Filter & Unduh
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <button 
                onClick={handleExportPDF}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-4 py-2.5 rounded-xl font-bold transition-colors text-sm"
              >
                <FileText className="w-4 h-4" /> PDF
              </button>
              <button 
                onClick={handleExportExcel}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 px-4 py-2.5 rounded-xl font-bold transition-colors text-sm"
              >
                <FileSpreadsheet className="w-4 h-4" /> Excel
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Cari nama atau kode..."
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-sm dark:text-white"
              />
            </div>
            <select 
              value={historyFilterJenis}
              onChange={(e) => setHistoryFilterJenis(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-sm dark:text-white"
            >
              <option value="">Semua Jenis</option>
              {JENIS_PENGELUARAN.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
        </div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Riwayat Pengeluaran
          </h2>
          <span className="text-sm font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            {filteredList.length} Transaksi
          </span>
        </div>
        {/* Transaction Lists */}
        <div className="space-y-4">
          {filteredList.length > 0 ? filteredList.map((p) => (
            <div key={p.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex items-start gap-4 w-full sm:w-auto">
                <div className="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 p-3 rounded-xl mt-1 shrink-0">
                  <RpIcon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                     <h3 className="font-bold text-slate-800 dark:text-slate-100 text-[17px] leading-tight line-clamp-1 mr-2">{p.nama}</h3>
                     <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md font-mono text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">{p.kode}</span>
                  </div>
                  <div className="flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 gap-2 mb-2 w-full">
                    <span className="truncate">{p.jenis}</span>
                    <span>•</span>
                    <span className="whitespace-nowrap">{p.tanggal}</span>
                  </div>
                  <div className="font-extrabold text-lg sm:text-xl text-rose-600 dark:text-rose-400 mb-3">
                    Rp {p.nominal.toLocaleString('id-ID')}
                  </div>
                  
                  {/* Action buttons embedded in mobile layout */}
                  <div className="flex sm:hidden items-center justify-start gap-2 w-full pt-1">
                     <button onClick={() => openView(p)} className="flex items-center justify-center h-9 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs ring-1 ring-indigo-100 dark:ring-indigo-500/20 active:scale-95 transition-all w-fit">
                       <Eye className="w-3.5 h-3.5 mr-1.5" /> Lihat
                     </button>
                     <button onClick={() => openEdit(p)} className="flex items-center justify-center h-9 px-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs ring-1 ring-amber-100 dark:ring-amber-500/20 active:scale-95 transition-all w-fit">
                       <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
                     </button>
                     <button onClick={() => handleDelete(p.id)} className="flex items-center justify-center h-9 px-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-xs ring-1 ring-red-100 dark:ring-red-500/20 active:scale-95 transition-all w-fit">
                       <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Hapus
                     </button>
                  </div>
                </div>
              </div>
              
              {/* Desktop action buttons */}
              <div className="hidden sm:flex flex-col items-end shrink-0 gap-2">
                 <div className="flex items-center justify-end gap-2 w-full">
                   <button onClick={() => openView(p)} className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all">
                     <Eye className="w-4 h-4" />
                   </button>
                   <button onClick={() => openEdit(p)} className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all">
                     <Edit2 className="w-4 h-4" />
                   </button>
                   <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all">
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
              </div>
            </div>
          )) : (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
              <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Belum ada pengeluaran</h3>
              <p className="text-slate-500 max-w-sm mx-auto">Catat pengeluaran baru untuk mulai memantau arus kas sekolah.</p>
            </div>
          )}
        </div>
      </div>
      {renderModal()}
      {renderViewModal()}
    </div>
  );
}
import { StrukHeader, applyPdfKop } from '../../utils/kopHelper';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, ChevronLeft, Calendar, User, FileText, FileSpreadsheet, Filter, Upload, Eye, Edit2, Trash2, FileCheck, Building2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas-pro';
import { useAppContext } from '../../AppContext';
import { useIsMobile } from '../../App';
import { MobileBottomSheet } from '../../components/ui/MobileBottomSheet';

const JENIS_SARPRAS = [
  'Bangunan & Gedung',
  'Peralatan Elektronik',
  'Kendaraan',
  'Perabotan Ruangan',
  'Buku & Referensi',
  'Lainnya'
];

export function InputSarpras() {
  const { user, showNotification } = useAppContext();
  const isMobile = useIsMobile();
  
  const [sarprasList, setSarprasList] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [saveSuccessData, setSaveSuccessData] = useState<any>(null);
  
  // View Data
  const [viewData, setViewData] = useState<any>(null);

  // Form states
  const [editId, setEditId] = useState<string | null>(null);
  const [tanggalMasuk, setTanggalMasuk] = useState('');
  const [waktuMasuk, setWaktuMasuk] = useState('');
  const [kodeSarpras, setKodeSarpras] = useState('');
  const [jenisSarpras, setJenisSarpras] = useState('');
  const [namaSarpras, setNamaSarpras] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [petugas, setPetugas] = useState(user?.name || '');
  const [fileDokumen, setFileDokumen] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showConfirm, setShowConfirm] = useState(false);

  // Filter and Search
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyFilterJenis, setHistoryFilterJenis] = useState('');

  useEffect(() => {
    const loadData = () => {
      const list = JSON.parse(localStorage.getItem('sd_sarpras_list') || '[]');
      setSarprasList(list);
    };
    loadData();
    window.addEventListener('localStorageUpdate', loadData);
    return () => window.removeEventListener('localStorageUpdate', loadData);
  }, []);

  const generateKode = (jenis: string) => {
    if (!jenis) return '';
    let prefix = 'SP-L';
    if (jenis === 'Bangunan & Gedung') prefix = 'SP-BG';
    else if (jenis === 'Peralatan Elektronik') prefix = 'SP-EL';
    else if (jenis === 'Kendaraan') prefix = 'SP-KD';
    else if (jenis === 'Perabotan Ruangan') prefix = 'SP-PR';
    else if (jenis === 'Buku & Referensi') prefix = 'SP-BK';

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

  const handleJenisChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setJenisSarpras(v);
    if (!editId) {
      setKodeSarpras(generateKode(v));
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
    setJenisSarpras('');
    setKodeSarpras('');
    setNamaSarpras('');
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
    setKodeSarpras(p.kode);
    setJenisSarpras(p.jenis);
    setNamaSarpras(p.nama);
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
       const updated = sarprasList.filter(p => p.id !== id);
       setSarprasList(updated);
       localStorage.setItem('sd_sarpras_list', JSON.stringify(updated));
    }
  };

  const handleSimpan = () => {
    if (!jenisSarpras || !namaSarpras) {
      alert("Harap lengkapi semua data wajib (Jenis, Nama Sarana & Prasarana).");
      setShowConfirm(false);
      return;
    }

    let updatedList;
    let savedRecord;
    
    if (editId) {
       updatedList = sarprasList.map(p => {
         if (p.id === editId) {
           savedRecord = {
             ...p,
             jenis: jenisSarpras,
             nama: namaSarpras,
             keterangan: keterangan,
             filePreview: filePreview || p.filePreview
           };
           return savedRecord;
         }
         return p;
       });
    } else {
      const newRecord = {
        id: new Date().getTime().toString(),
        tanggal: tanggalMasuk,
        waktu: waktuMasuk,
        kode: kodeSarpras,
        jenis: jenisSarpras,
        nama: namaSarpras,
        keterangan: keterangan,
        filePreview: filePreview,
        fileType: fileDokumen?.type || 'none',
        fileName: fileDokumen?.name || 'none',
        petugas: petugas,
      };
      savedRecord = newRecord;
      updatedList = [newRecord, ...sarprasList];
    }
    
    setSarprasList(updatedList);
    localStorage.setItem('sd_sarpras_list', JSON.stringify(updatedList));

    setShowConfirm(false);
    showNotification(editId ? "Data Sarana & Prasarana berhasil diperbarui!" : "Data Sarana & Prasarana berhasil disimpan!");
    setSaveSuccessData(savedRecord);
  };

  const filteredList = sarprasList.filter(p => {
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
    doc.text('Data Sarana & Prasarana Sekolah', 14, 15);
    
    const tableColumn = ["Tanggal", "Kode", "Nama", "Jenis", "Petugas"];
    const tableRows: any[] = [];
    
    filteredList.forEach(p => {
      const pData = [
        `${p.tanggal} ${p.waktu || ''}`,
        p.kode,
        p.nama,
        p.jenis,
        p.petugas
      ];
      tableRows.push(pData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
    });
    
    doc.save(`Laporan_Sarpras_${new Date().getTime()}.pdf`);
  };

  const handleExportExcel = () => {
    const wsData = filteredList.map(p => ({
      "Tanggal": p.tanggal,
      "Waktu": p.waktu,
      "Kode Data": p.kode,
      "Nama Data": p.nama,
      "Jenis": p.jenis,
      "Keterangan": p.keterangan,
      "Petugas": p.petugas
    }));
    
    import('../../utils/kopHelper').then(({ exportToExcel }) => {
      exportToExcel(wsData, "Laporan_Sarapas", "SARPRAS");
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
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Jenis Sarana & Prasarana</label>
        <select value={jenisSarpras} onChange={handleJenisChange} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="">-- Pilih Jenis --</option>
          {JENIS_SARPRAS.map(j => (
            <option key={j} value={j}>{j}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Kode Data</label>
        <input type="text" value={kodeSarpras} disabled placeholder="Pilih jenis untuk generate" className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono" />
      </div>

      <div>
         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Nama Sarana & Prasarana</label>
         <input type="text" value={namaSarpras} onChange={(e)=>setNamaSarpras(e.target.value)} placeholder="Contoh: Gedung Aula, Proyektor EPSON..." className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
      </div>

      <div>
         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Keterangan (Opsional)</label>
         <textarea rows={3} value={keterangan} onChange={(e)=>setKeterangan(e.target.value)} placeholder="Tulis keterangan, kondisi, atau lokasi..." className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"></textarea>
      </div>

      <div>
         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Dokumen Bukti (JPG/PDF, Maks 2MB)</label>
         <div 
           className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
           onClick={() => fileInputRef.current?.click()}
         >
           {filePreview ? (
             <div className="flex flex-col items-center gap-2">
                <FileCheck className="w-10 h-10 text-indigo-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{fileDokumen?.name || 'Dokumen terlampir'}</span>
                <span className="text-xs text-indigo-500 hover:underline" onClick={(e) => { e.stopPropagation(); setFilePreview(null); setFileDokumen(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}>Hapus file</span>
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
            if (!jenisSarpras || !namaSarpras) {
              alert("Data belum lengkap. Harap isi Jenis dan Nama Sarana Prasarana!");
              return;
            }
            setShowConfirm(true);
          }}
          className="w-full py-4 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98] focus:ring-4 focus:ring-indigo-500/20"
        >
          Simpan Data
        </button>
      </div>
    </div>
  );

  const handleDownloadJPG = async () => {
    const el = document.getElementById('receipt-sarpras');
    if (el) {
      const canvas = await html2canvas(el, { scale: 2 });
      const data = canvas.toDataURL('image/jpeg');
      const link = document.createElement('a');
      link.href = data;
      link.download = `Bukti_Sarpras_${saveSuccessData?.kode}.jpg`;
      link.click();
    }
  };

  const renderSuccessContent = () => (
    <div className="flex flex-col items-center justify-center py-6">
       <div className="w-16 h-16 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mb-4">
         <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
       </div>
       <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Penyimpanan Berhasil!</h3>
       <p className="text-slate-500 text-center mb-6 text-sm">Data Sarana & Prasarana telah tersimpan di sistem.</p>
       
       <div id="receipt-sarpras" className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
         <StrukHeader title="DATA SARANA & PRASARANA" />
         <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
           <div className="flex justify-between"><span>Kode:</span> <strong>{saveSuccessData?.kode}</strong></div>
           <div className="flex justify-between"><span>Tanggal:</span> <span>{saveSuccessData?.tanggal} {saveSuccessData?.waktu}</span></div>
           <div className="flex justify-between"><span>Jenis:</span> <span>{saveSuccessData?.jenis}</span></div>
           <div className="flex justify-between font-bold mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400">
             <span>Nama:</span> <span className="text-right ml-4">{saveSuccessData?.nama}</span>
           </div>
         </div>
       </div>

       <div className="w-full max-w-sm">
         <button onClick={handleDownloadJPG} className="w-full flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 hover:bg-indigo-100 py-3 rounded-xl font-bold transition-colors">
           Download Bukti JPG
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
            <div className="bg-indigo-50 dark:bg-indigo-500/10 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 mb-6">
              <h3 className="text-indigo-800 dark:text-indigo-400 font-bold mb-4 flex items-center text-lg"><FileText className="w-5 h-5 mr-2" /> Konfirmasi Simpan</h3>
              <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <div className="flex justify-between"><span className="text-slate-500">Kode:</span> <span className="font-mono bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">{kodeSarpras}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Jenis:</span> <span className="font-semibold text-right ml-4">{jenisSarpras}</span></div>
                <div className="flex justify-between border-t border-indigo-200 dark:border-indigo-500/30 pt-3"><span className="text-slate-800 dark:text-white">Nama Data:</span> <span className="text-indigo-600 dark:text-indigo-400 font-bold text-right ml-4">{namaSarpras}</span></div>
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
                 className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 transition-colors"
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
        <MobileBottomSheet isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Edit Data" : "Input Sarpras Baru"}>
          {content}
        </MobileBottomSheet>
      );
    }

    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[24px] shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl z-10">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{editId ? "Edit Data" : "Input Sarpras Baru"}</h2>
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
               <div className="text-sm text-slate-500 mb-1">Kode Data</div>
               <div className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 px-3 py-1 rounded-md mb-2 inline-block border border-slate-200 dark:border-slate-700">{viewData.kode}</div>
               <div className="text-xs text-slate-500 font-medium">{viewData.tanggal} {viewData.waktu}</div>
             </div>
             <div className="text-right">
                <div className="text-xs font-semibold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-500/20">{viewData.jenis}</div>
             </div>
          </div>
          
          <div className="pt-2">
             <div className="text-sm text-slate-500 mb-1">Nama Sarana & Prasarana</div>
             <div className="font-bold text-lg text-slate-800 dark:text-white">{viewData.nama}</div>
          </div>

          <div>
             <div className="text-sm text-slate-500 mb-1">Keterangan / Kondisi</div>
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
        <MobileBottomSheet isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Sarana & Prasarana">
          {content}
        </MobileBottomSheet>
      );
    }

    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[24px] shadow-2xl relative z-10 flex flex-col overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl">
             <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Detail Data</h2>
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
        {/* Header Options */}
        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={openTambah}
            className="flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-indigo-500 to-blue-600 p-5 rounded-[20px] text-white shadow-xl shadow-indigo-500/20 active:scale-95 transition-all text-center border-b-4 border-indigo-700/50 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm relative z-10">
              <Plus className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-lg tracking-wide relative z-10">Tambah Data Sarana & Prasarana</span>
          </button>
        </div>

        {/* Filter and Export */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-2 self-start lg:self-auto text-slate-800 dark:text-white font-bold text-lg">
              <Filter className="w-5 h-5 text-indigo-500" /> Filter & Unduh
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <button 
                onClick={handleExportPDF}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-4 py-2.5 rounded-xl font-bold transition-colors text-sm"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Cari nama atau kode..."
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white"
              />
            </div>
            <select 
              value={historyFilterJenis}
              onChange={(e) => setHistoryFilterJenis(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white"
            >
              <option value="">Semua Jenis</option>
              {JENIS_SARPRAS.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
        </div>

        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Daftar Sarana & Prasarana
          </h2>
          <span className="text-sm font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            {filteredList.length} Item
          </span>
        </div>

        {/* Data Lists */}
        <div className="space-y-4">
          {filteredList.length > 0 ? filteredList.map((p) => (
            <div key={p.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex items-start gap-4 w-full sm:w-auto">
                <div className="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 p-3 rounded-xl mt-1 shrink-0">
                  <Building2 className="w-6 h-6" />
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
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Belum ada data</h3>
              <p className="text-slate-500 max-w-sm mx-auto">Mulai tambahkan inventaris sarana dan prasarana sekolah.</p>
            </div>
          )}
        </div>
      </div>

      {renderModal()}
      {renderViewModal()}
    </div>
  );
}

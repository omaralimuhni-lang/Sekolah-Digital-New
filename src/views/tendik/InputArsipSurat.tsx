import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, ChevronLeft, FileText, FileSpreadsheet, Filter, Eye, Edit2, Trash2, Calendar, User, Tag, FileUp, File, Link2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAppContext } from '../../AppContext';
import { useIsMobile } from '../../App';
import { MobileBottomSheet } from '../../components/ui/MobileBottomSheet';
import { applyPdfKop } from '../../utils/kopHelper';
export function InputArsipSurat() {
  const { user, showNotification } = useAppContext();
  const isMobile = useIsMobile();
  
  const [arsipList, setArsipList] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  // View Data
  const [viewData, setViewData] = useState<any>(null);
  // Form states
  const [editId, setEditId] = useState<string | null>(null);
  
  const [tanggalWaktu, setTanggalWaktu] = useState('');
  const [kodeArsip, setKodeArsip] = useState('');
  const [jenisArsip, setJenisArsip] = useState('Surat Masuk');
  const [namaArsip, setNamaArsip] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [, setFileDokumen] = useState<File | null>(null);
  const [dokumenPreview, setDokumenPreview] = useState<{ type: string, url: string, name: string } | null>(null);
  const [petugas, setPetugas] = useState(user?.name || '');
  
  const [showConfirm, setShowConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Filter and Search
  const [searchQuery, setSearchQuery] = useState('');
  useEffect(() => {
    const loadData = () => {
      const list = JSON.parse(localStorage.getItem('sd_arsip_surat_list') || '[]');
      setArsipList(list);
    };
    loadData();
    window.addEventListener('localStorageUpdate', loadData);
    return () => window.removeEventListener('localStorageUpdate', loadData);
  }, []);
  const generateKodeArsip = () => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `ARS-${randomNum}`;
  };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        alert("Format file tidak didukung. Harap unggah JPG, PNG, atau PDF.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("Ukuran file maksimal 5MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
         setFileDokumen(file);
         setDokumenPreview({
           type: file.type.includes('pdf') ? 'pdf' : 'image',
           url: reader.result as string,
           name: file.name
         });
      };
      reader.readAsDataURL(file);
    }
  };
  const openTambah = () => {
    const nw = new Date();
    setTanggalWaktu(nw.toLocaleString('id-ID'));
    setKodeArsip(generateKodeArsip());
    setJenisArsip('Surat Masuk');
    setNamaArsip('');
    setKeterangan('');
    setFileDokumen(null);
    setDokumenPreview(null);
    setPetugas(user?.name || '');
    
    setEditId(null);
    setIsModalOpen(true);
    setShowConfirm(false);
  };
  const openEdit = (data: any) => {
    setEditId(data.id);
    setTanggalWaktu(data.tanggalWaktu);
    setKodeArsip(data.kodeArsip);
    setJenisArsip(data.jenisArsip);
    setNamaArsip(data.namaArsip);
    setKeterangan(data.keterangan || '');
    setDokumenPreview(data.dokumenPreview || null);
    setPetugas(data.petugas || user?.name || '');
    
    setIsModalOpen(true);
    setShowConfirm(false);
  };
  const openView = (data: any) => {
    setViewData(data);
    setIsViewModalOpen(true);
  };
  const handleDelete = (id: string) => {
    if(confirm(`Apakah Anda yakin ingin menghapus data arsip ini?`)) {
       const updated = arsipList.filter(p => p.id !== id);
       setArsipList(updated);
       localStorage.setItem('sd_arsip_surat_list', JSON.stringify(updated));
       showNotification("Data arsip dihapus!");
    }
  };
  const handlePreSimpan = () => {
    if (!namaArsip) {
      alert("Nama Data Arsip & Surat wajib diisi.");
      return;
    }
    setShowConfirm(true);
  };
  const handleSimpan = () => {
    let savedRecord;
    let updatedList;
    
    if (editId) {
       updatedList = arsipList.map(p => {
         if (p.id === editId) {
           savedRecord = {
             ...p,
             jenisArsip,
             namaArsip,
             keterangan,
             dokumenPreview: dokumenPreview || p.dokumenPreview,
             petugas: user?.name || petugas
           };
           return savedRecord;
         }
         return p;
       });
    } else {
      const newRecord = {
        id: new Date().getTime().toString(),
        tanggalWaktu,
        kodeArsip,
        jenisArsip,
        namaArsip,
        keterangan,
        dokumenPreview,
        petugas: user?.name || petugas
      };
      savedRecord = newRecord;
      updatedList = [newRecord, ...arsipList];
    }
    
    setArsipList(updatedList);
    localStorage.setItem('sd_arsip_surat_list', JSON.stringify(updatedList));
    showNotification(editId ? "Data Arsip & Surat diperbarui!" : "Data Arsip & Surat berhasil disimpan!");
    
    setShowConfirm(false);
    setIsModalOpen(false);
  };
  const filteredList = arsipList.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      (item.namaArsip?.toLowerCase() || '').includes(q) ||
      (item.kodeArsip?.toLowerCase() || '').includes(q) ||
      (item.jenisArsip?.toLowerCase() || '').includes(q)
    );
  });
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const startY = applyPdfKop(doc);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Laporan", 14, startY + 5);
    doc.setFontSize(16);
    doc.text('Laporan Data Arsip & Surat Sekolah', 14, 15);
    
    const tableColumn = ["Kode", "Nama Arsip/Surat", "Jenis", "Tanggal", "Petugas"];
    const tableRows = filteredList.map(p => [
      p.kodeArsip,
      p.namaArsip,
      p.jenisArsip,
      p.tanggalWaktu.split(' ')[0], // only date
      p.petugas
    ]);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
    });
    
    doc.save(`Laporan_Arsip_Surat_${new Date().getTime()}.pdf`);
  };
  const handleExportExcel = () => {
    const wsData = filteredList.map(p => ({
      "Tanggal Waktu": p.tanggalWaktu,
      "Petugas": p.petugas,
      "Kode": p.kodeArsip,
      "Nama Arsip/Surat": p.namaArsip,
      "Jenis": p.jenisArsip,
      "Keterangan": p.keterangan || '-'
    }));
    import('../../utils/kopHelper').then(({ exportToExcel }) => {
      exportToExcel(wsData, "Laporan_Arsip_Surat", "ARSIP SURAT");
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
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Petugas Pencatatan</label>
          <div className="relative">
            <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" readOnly value={petugas} className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm dark:text-slate-400 text-slate-600 cursor-not-allowed" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Kode (Otomatis)</label>
          <div className="relative">
            <FileText className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" readOnly value={kodeArsip} className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm dark:text-slate-400 text-slate-600 cursor-not-allowed font-mono" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Jenis Arsip & Surat</label>
          <div className="relative">
            <Tag className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select value={jenisArsip} onChange={(e) => setJenisArsip(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-500 text-sm dark:text-white appearance-none">
              <option value="Surat Masuk">Surat Masuk</option>
              <option value="Surat Keluar">Surat Keluar</option>
              <option value="Dokumen Internal">Dokumen Internal</option>
              <option value="Sertifikat Piagam">Sertifikat / Piagam</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
        </div>
      </div>
      <div>
         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Nama Arsip & Surat</label>
         <input type="text" value={namaArsip} onChange={(e)=>setNamaArsip(e.target.value)} placeholder="Contoh: Surat Undangan Rapat Komite" className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-slate-500 outline-none" />
      </div>
      <div>
         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Keterangan / Deskripsi Singkat</label>
         <textarea rows={3} value={keterangan} onChange={(e)=>setKeterangan(e.target.value)} placeholder="Tuliskan isi surat atau keterangan arsip..." className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-slate-500 outline-none resize-none"></textarea>
      </div>
      <div>
         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Upload Dokumen (JPG/PNG/PDF)</label>
         <div 
           className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
           onClick={() => fileInputRef.current?.click()}
         >
           {dokumenPreview ? (
             <div className="flex flex-col items-center gap-2">
                {dokumenPreview.type === 'image' ? (
                   <img src={dokumenPreview.url} alt="Preview" className="h-24 w-auto object-cover rounded-lg shadow-sm border border-slate-200 dark:border-slate-700" />
                ) : (
                   <div className="h-24 w-20 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg flex flex-col items-center justify-center border border-rose-200 dark:border-rose-500/30">
                     <File className="w-8 h-8 mb-1" />
                     <span className="text-[10px] font-bold">PDF</span>
                   </div>
                )}
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-xs">{dokumenPreview.name}</span>
                <span className="text-xs text-rose-500 hover:underline" onClick={(e) => { e.stopPropagation(); setDokumenPreview(null); setFileDokumen(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}>Hapus file</span>
             </div>
           ) : (
             <div className="flex flex-col items-center gap-2">
                <FileUp className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Pilih atau letakkan file dokumen</span>
                <span className="text-xs text-slate-500">Maks. 5MB (JPG, PNG, PDF)</span>
             </div>
           )}
           <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept=".jpg,.jpeg,.png,.pdf" />
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
              <h3 className="text-slate-800 dark:text-slate-300 font-bold mb-4 flex items-center text-lg"><FileText className="w-5 h-5 mr-2" /> Review Data Arsip Sebelum Simpan</h3>
              <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-2">
                  <div>Petugas: <span className="font-semibold text-slate-700 dark:text-slate-300">{petugas}</span></div>
                  <div className="text-right">Tgl: <span className="font-semibold text-slate-700 dark:text-slate-300">{tanggalWaktu}</span></div>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-500/30 pt-3"><span className="text-slate-500">Kode:</span> <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{kodeArsip}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Jenis:</span> <span className="font-semibold">{jenisArsip}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Nama Dokumen:</span> <span className="font-bold text-slate-900 dark:text-white text-right max-w-[60%]">{namaArsip}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Dokumen Upload:</span> <span className="font-semibold truncate max-w-[50%]">{dokumenPreview ? dokumenPreview.name : 'Tidak ada'}</span></div>
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
                 Ya, Simpan Arsip
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
        <MobileBottomSheet isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Edit Data Arsip" : "Tambah Arsip Baru"}>
          {content}
        </MobileBottomSheet>
      );
    }
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[24px] shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl z-10">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><FileText className="w-5 h-5 text-slate-500" /> {editId ? "Edit Data Arsip" : "Tambah Arsip Baru"}</h2>
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
                <div className="text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-500/20">{viewData.jenisArsip}</div>
             </div>
          </div>
          
          <div className="pt-2">
             <div className="text-sm text-slate-500 mb-1">Nama Arsip / Surat</div>
             <div className="font-bold text-lg text-slate-800 dark:text-white leading-tight">{viewData.namaArsip}</div>
             <div className="text-sm text-slate-500 mt-1 font-mono">Kode: {viewData.kodeArsip}</div>
          </div>
          <div className="space-y-4 pt-2">
             <div>
                <div className="text-sm text-slate-500 mb-1">Keterangan</div>
                <div className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 whitespace-pre-wrap">{viewData.keterangan || '-'}</div>
             </div>
             <div>
                <div className="text-sm text-slate-500 mb-2">Dokumen Terlampir</div>
                {viewData.dokumenPreview ? (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 flex flex-col gap-2">
                    <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                       {viewData.dokumenPreview.type === 'pdf' ? (
                         <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-md flex items-center justify-center shrink-0">
                           <File className="w-5 h-5" />
                         </div>
                       ) : (
                         <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-md flex items-center justify-center shrink-0 overflow-hidden">
                           <img src={viewData.dokumenPreview.url} className="w-full h-full object-cover" alt="icon" />
                         </div>
                       )}
                       <div className="flex-1 overflow-hidden">
                         <div className="text-sm font-semibold truncate text-slate-700 dark:text-slate-200">{viewData.dokumenPreview.name}</div>
                         <div className="text-xs text-slate-500 uppercase">{viewData.dokumenPreview.type}</div>
                       </div>
                    </div>
                    {viewData.dokumenPreview.type === 'image' && (
                       <img src={viewData.dokumenPreview.url} className="w-full max-h-64 object-contain rounded-lg border border-slate-100 dark:border-slate-800" alt="Full Preview" />
                    )}
                    {viewData.dokumenPreview.type === 'pdf' && (
                       <a href={viewData.dokumenPreview.url} target="_blank" rel="noreferrer" className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors">
                           <Link2 className="w-4 h-4" /> Buka PDF di Tab Baru
                       </a>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 italic bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">Tidak ada dokumen yang dilampirkan</div>
                )}
             </div>
          </div>
        </div>
      </div>
    );
    if (isMobile) {
      return (
        <MobileBottomSheet isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Data Arsip">
          {content}
        </MobileBottomSheet>
      );
    }
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[24px] shadow-2xl relative z-10 flex flex-col overflow-hidden max-h-[90vh]">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl sticky top-0 z-10">
             <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><FileText className="w-5 h-5 text-slate-500" /> Detail Arsip</h2>
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
            className="flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-600 to-slate-800 p-5 rounded-[20px] text-white shadow-xl shadow-slate-500/20 active:scale-95 transition-all text-center border-b-4 border-slate-900/50 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm relative z-10">
              <Plus className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-lg tracking-wide relative z-10">Tambah Data Arsip & Surat</span>
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
                placeholder="Cari nama, kode atau jenis arsip..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-slate-500 text-sm dark:text-white"
              />
            </div>
          </div>
        </div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Dokumen & Arsip
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
                <div className="bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400 p-3 rounded-xl mt-1 shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-1">
                     <h3 className="font-bold text-slate-800 dark:text-slate-100 text-[17px] leading-tight line-clamp-1 max-w-sm">{item.namaArsip}</h3>
                  </div>
                  <div className="flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 gap-2 mb-2 w-full flex-wrap">
                    <span className="font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{item.kodeArsip}</span>
                    <span>•</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{item.jenisArsip}</span>
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-3 truncate max-w-[200px] sm:max-w-xs">{item.tanggalWaktu.split(' ')[0]} - {item.petugas}</div>
                  
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
              <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Belum ada data arsip & surat</h3>
              <p className="text-slate-500 max-w-sm mx-auto">Mulai tambahkan arsip dokumen di sini.</p>
            </div>
          )}
        </div>
      </div>
      {renderModal()}
      {renderViewModal()}
    </div>
  );
}
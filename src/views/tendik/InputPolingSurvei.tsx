import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, ChevronLeft, Calendar, User, FileText, FileSpreadsheet, Filter, Eye, Edit2, Trash2, BarChart3, Image as ImageIcon, Link2, Clock } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAppContext } from '../../AppContext';
import { useIsMobile } from '../../App';
import { MobileBottomSheet } from '../../components/ui/MobileBottomSheet';
import { applyPdfKop } from '../../utils/kopHelper';
export function InputPolingSurvei() {
  const { user, showNotification } = useAppContext();
  const isMobile = useIsMobile();
  
  const [activeTab, setActiveTab] = useState<'poling' | 'survei'>('poling');
  
  // States finding
  const [polingList, setPolingList] = useState<any[]>([]);
  const [surveiList, setSurveiList] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  // View Data
  const [viewData, setViewData] = useState<any>(null);
  // Form states Poling
  const [editId, setEditId] = useState<string | null>(null);
  const [judulPoling, setJudulPoling] = useState('');
  const [tanggalPoling, setTanggalPoling] = useState('');
  const [waktuPenerbitan, setWaktuPenerbitan] = useState('');
  const [tanggalPenerbitan, setTanggalPenerbitan] = useState('');
  
  const [nomorPaslon, setNomorPaslon] = useState('');
  const [visi, setVisi] = useState('');
  const [misi, setMisi] = useState('');
  const [, setFileGambarPoling] = useState<File | null>(null);
  const [gambarPolingPreview, setGambarPolingPreview] = useState<string | null>(null);
  // Form states Survei
  const [judulSurvei, setJudulSurvei] = useState('');
  const [tanggalSurvei, setTanggalSurvei] = useState('');
  const [deskripsiSurvei, setDeskripsiSurvei] = useState('');
  const [linkSurvei, setLinkSurvei] = useState('');
  const [pembuatSurvei, setPembuatSurvei] = useState(user?.name || '');
  const [, setFileGambarSurvei] = useState<File | null>(null);
  const [gambarSurveiPreview, setGambarSurveiPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  // Filter and Search
  const [searchQuery, setSearchQuery] = useState('');
  useEffect(() => {
    const loadData = () => {
    const pList = JSON.parse(localStorage.getItem('sd_poling_list') || '[]');
    const sList = JSON.parse(localStorage.getItem('sd_survei_list') || '[]');
    setPolingList(pList);
    setSurveiList(sList);
  };
    loadData();
    window.addEventListener('localStorageUpdate', loadData);
    return () => window.removeEventListener('localStorageUpdate', loadData);
  }, []);
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'poling' | 'survei') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        alert("Format file tidak didukung. Harap unggah JPG atau PNG.");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran file maksimal 2MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'poling') {
           setFileGambarPoling(file);
           setGambarPolingPreview(reader.result as string);
        } else {
           setFileGambarSurvei(file);
           setGambarSurveiPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  const openTambah = () => {
    const nw = new Date();
    const dateStr = nw.toISOString().split('T')[0];
    const timeStr = nw.toTimeString().split(' ')[0].substring(0, 5);
    
    if (activeTab === 'poling') {
      setJudulPoling('');
      setTanggalPoling(dateStr);
      setTanggalPenerbitan(dateStr);
      setWaktuPenerbitan(timeStr);
      setNomorPaslon('');
      setVisi('');
      setMisi('');
      setFileGambarPoling(null);
      setGambarPolingPreview(null);
    } else {
      setJudulSurvei('');
      setTanggalSurvei(dateStr);
      setDeskripsiSurvei('');
      setLinkSurvei('');
      setPembuatSurvei(user?.name || '');
      setFileGambarSurvei(null);
      setGambarSurveiPreview(null);
    }
    
    setEditId(null);
    setIsModalOpen(true);
    setShowConfirm(false);
  };
  const openEdit = (data: any, type: 'poling' | 'survei') => {
    setEditId(data.id);
    if (type === 'poling') {
      setJudulPoling(data.judul);
      setTanggalPoling(data.tanggal);
      setTanggalPenerbitan(data.tanggalPenerbitan);
      setWaktuPenerbitan(data.waktuPenerbitan);
      setNomorPaslon(data.nomorPaslon);
      setVisi(data.visi);
      setMisi(data.misi);
      setGambarPolingPreview(data.gambarPreview || null);
    } else {
      setJudulSurvei(data.judul);
      setTanggalSurvei(data.tanggal);
      setDeskripsiSurvei(data.deskripsi);
      setLinkSurvei(data.link);
      setPembuatSurvei(data.pembuat || user?.name || '');
      setGambarSurveiPreview(data.gambarPreview || null);
    }
    setIsModalOpen(true);
    setShowConfirm(false);
  };
  const openView = (data: any) => {
    setViewData(data);
    setIsViewModalOpen(true);
  };
  const handleDelete = (id: string, type: 'poling' | 'survei') => {
    if(confirm(`Apakah Anda yakin ingin menghapus data ini?`)) {
       if (type === 'poling') {
         const updated = polingList.filter(p => p.id !== id);
         setPolingList(updated);
         localStorage.setItem('sd_poling_list', JSON.stringify(updated));
       } else {
         const updated = surveiList.filter(s => s.id !== id);
         setSurveiList(updated);
         localStorage.setItem('sd_survei_list', JSON.stringify(updated));
       }
    }
  };
  const handleSimpan = () => {
    let savedRecord;
    
    if (activeTab === 'poling') {
      if (!judulPoling || !nomorPaslon) {
        alert("Judul poling dan Nomor Paslon wajib diisi.");
        setShowConfirm(false);
        return;
      }
      
      let updatedList;
      if (editId) {
         updatedList = polingList.map(p => {
           if (p.id === editId) {
             savedRecord = {
               ...p,
               judul: judulPoling,
               tanggal: tanggalPoling,
               tanggalPenerbitan: tanggalPenerbitan,
               waktuPenerbitan: waktuPenerbitan,
               nomorPaslon: nomorPaslon,
               visi: visi,
               misi: misi,
               gambarPreview: gambarPolingPreview || p.gambarPreview
             };
             return savedRecord;
           }
           return p;
         });
      } else {
        const newRecord = {
          id: new Date().getTime().toString(),
          judul: judulPoling,
          tanggal: tanggalPoling,
          tanggalPenerbitan: tanggalPenerbitan,
          waktuPenerbitan: waktuPenerbitan,
          nomorPaslon: nomorPaslon,
          visi: visi,
          misi: misi,
          gambarPreview: gambarPolingPreview,
          type: 'poling'
        };
        savedRecord = newRecord;
        updatedList = [newRecord, ...polingList];
      }
      setPolingList(updatedList);
      localStorage.setItem('sd_poling_list', JSON.stringify(updatedList));
      showNotification(editId ? "Data Poling diperbarui!" : "Data Poling berhasil ditambahkan!");
      
    } else {
      if (!judulSurvei || !linkSurvei) {
        alert("Judul survei dan Link Survei wajib diisi.");
        setShowConfirm(false);
        return;
      }
      let updatedList;
      if (editId) {
         updatedList = surveiList.map(s => {
           if (s.id === editId) {
             savedRecord = {
               ...s,
               judul: judulSurvei,
               tanggal: tanggalSurvei,
               deskripsi: deskripsiSurvei,
               link: linkSurvei,
               pembuat: pembuatSurvei,
               gambarPreview: gambarSurveiPreview || s.gambarPreview
             };
             return savedRecord;
           }
           return s;
         });
      } else {
        const newRecord = {
          id: new Date().getTime().toString(),
          judul: judulSurvei,
          tanggal: tanggalSurvei,
          deskripsi: deskripsiSurvei,
          link: linkSurvei,
          pembuat: pembuatSurvei,
          gambarPreview: gambarSurveiPreview,
          type: 'survei'
        };
        savedRecord = newRecord;
        updatedList = [newRecord, ...surveiList];
      }
      setSurveiList(updatedList);
      localStorage.setItem('sd_survei_list', JSON.stringify(updatedList));
      showNotification(editId ? "Data Survei diperbarui!" : "Data Survei berhasil dikirim!");
    }
    setShowConfirm(false);
    setIsModalOpen(false);
  };
  const getFilteredList = () => {
    const list = activeTab === 'poling' ? polingList : surveiList;
    return list.filter(item => {
      const matchSearch = searchQuery === '' || 
        item.judul?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  };
  const filteredList = getFilteredList();
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const startY = applyPdfKop(doc);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Laporan", 14, startY + 5);
    doc.setFontSize(16);
    doc.text(activeTab === 'poling' ? 'Laporan Data Poling' : 'Laporan Data Survei', 14, 15);
    
    let tableColumn = [];
    let tableRows: any[] = [];
    
    if (activeTab === 'poling') {
      tableColumn = ["Judul", "Tanggal", "Tgl Terbit", "Waktu Terbit", "No Paslon"];
      filteredList.forEach(p => {
        tableRows.push([p.judul, p.tanggal, p.tanggalPenerbitan, p.waktuPenerbitan, p.nomorPaslon]);
      });
    } else {
      tableColumn = ["Judul", "Tanggal", "Pembuat", "Link"];
      filteredList.forEach(s => {
        tableRows.push([s.judul, s.tanggal, s.pembuat, s.link]);
      });
    }
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
    });
    
    doc.save(`Laporan_${activeTab}_${new Date().getTime()}.pdf`);
  };
  const handleExportExcel = () => {
    let wsData;
    if (activeTab === 'poling') {
       wsData = filteredList.map(p => ({
         "Judul Poling": p.judul,
         "Tanggal Poling": p.tanggal,
         "Tanggal Penerbitan": p.tanggalPenerbitan,
         "Waktu Penerbitan": p.waktuPenerbitan,
         "No Paslon": p.nomorPaslon,
         "Visi": p.visi,
         "Misi": p.misi
       }));
    } else {
       wsData = filteredList.map(s => ({
         "Judul Survei": s.judul,
         "Tanggal Survei": s.tanggal,
         "Pembuat": s.pembuat,
         "Link Survei": s.link,
         "Deskripsi": s.deskripsi
       }));
    }
    
    import('../../utils/kopHelper').then(({ exportToExcel }) => {
      exportToExcel(wsData, `Laporan_${activeTab}`, activeTab === 'poling' ? "POLING" : "SURVEI");
    });
  };
  const renderFormPoling = () => (
    <div className="space-y-6">
      <div>
         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Judul Poling</label>
         <input type="text" value={judulPoling} onChange={(e)=>setJudulPoling(e.target.value)} placeholder="Contoh: Pemilihan Ketua OSIS 2026/2027" className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Tanggal Poling</label>
          <div className="relative">
            <Calendar className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="date" value={tanggalPoling} onChange={(e)=>setTanggalPoling(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm dark:text-white" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Pilihan No Paslon</label>
          <input type="text" value={nomorPaslon} onChange={(e)=>setNomorPaslon(e.target.value)} placeholder="Contoh: Paslon 1" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm dark:text-white" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Tanggal Terbit</label>
          <div className="relative">
            <Calendar className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="date" value={tanggalPenerbitan} onChange={(e)=>setTanggalPenerbitan(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm dark:text-white" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Waktu Terbit</label>
          <div className="relative">
             <Clock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input type="time" value={waktuPenerbitan} onChange={(e)=>setWaktuPenerbitan(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm dark:text-white" />
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 -mt-4">
        *Poling akan otomatis muncul dan dapat diakses oleh siswa/guru sesuai waktu terbit (dengan progres visual live).
      </p>
      <div>
         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Visi</label>
         <textarea rows={3} value={visi} onChange={(e)=>setVisi(e.target.value)} placeholder="Tuliskan visi paslon..." className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none resize-none"></textarea>
      </div>
      <div>
         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Misi</label>
         <textarea rows={4} value={misi} onChange={(e)=>setMisi(e.target.value)} placeholder="Tuliskan misi paslon..." className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none resize-none"></textarea>
      </div>
      <div>
         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Gambar Pasangan Calon (JPG/PNG)</label>
         <div 
           className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
           onClick={() => fileInputRef.current?.click()}
         >
           {gambarPolingPreview ? (
             <div className="flex flex-col items-center gap-2">
                <img src={gambarPolingPreview} alt="Preview" className="h-24 w-auto object-cover rounded-lg shadow-sm" />
                <span className="text-xs text-teal-500 hover:underline" onClick={(e) => { e.stopPropagation(); setGambarPolingPreview(null); setFileGambarPoling(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}>Hapus gambar</span>
             </div>
           ) : (
             <div className="flex flex-col items-center gap-2">
                <ImageIcon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Pilih gambar untuk diunggah</span>
             </div>
           )}
           <input type="file" className="hidden" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'poling')} accept=".jpg,.jpeg,.png" />
         </div>
      </div>
    </div>
  );
  const renderFormSurvei = () => (
    <div className="space-y-6">
      <div>
         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Judul Survei</label>
         <input type="text" value={judulSurvei} onChange={(e)=>setJudulSurvei(e.target.value)} placeholder="Contoh: Survei Fasilitas Sekolah" className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Tanggal Survei</label>
          <div className="relative">
            <Calendar className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="date" value={tanggalSurvei} onChange={(e)=>setTanggalSurvei(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm dark:text-white" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Pembuat Survei</label>
          <div className="relative">
            <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={pembuatSurvei} onChange={(e)=>setPembuatSurvei(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm dark:text-white" />
          </div>
        </div>
      </div>
      <div>
         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Deskripsi Survei</label>
         <textarea rows={3} value={deskripsiSurvei} onChange={(e)=>setDeskripsiSurvei(e.target.value)} placeholder="Tuliskan tujuan survei..." className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none resize-none"></textarea>
      </div>
      <div>
         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Upload Link Survei (Form, dll)</label>
         <div className="relative">
            <Link2 className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="url" value={linkSurvei} onChange={(e)=>setLinkSurvei(e.target.value)} placeholder="https://forms.gle/..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm dark:text-white" />
         </div>
      </div>
      <div>
         <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Gambar Banner Survei (JPG/PNG)</label>
         <div 
           className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
           onClick={() => fileInputRef.current?.click()}
         >
           {gambarSurveiPreview ? (
             <div className="flex flex-col items-center gap-2">
                <img src={gambarSurveiPreview} alt="Preview" className="h-24 w-auto object-cover rounded-lg shadow-sm" />
                <span className="text-xs text-teal-500 hover:underline" onClick={(e) => { e.stopPropagation(); setGambarSurveiPreview(null); setFileGambarSurvei(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}>Hapus gambar</span>
             </div>
           ) : (
             <div className="flex flex-col items-center gap-2">
                <ImageIcon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Pilih gambar untuk diunggah</span>
             </div>
           )}
           <input type="file" className="hidden" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'survei')} accept=".jpg,.jpeg,.png" />
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
            <div className="bg-teal-50 dark:bg-teal-500/10 p-5 rounded-2xl border border-teal-100 dark:border-teal-500/20 mb-6">
              <h3 className="text-teal-800 dark:text-teal-400 font-bold mb-4 flex items-center text-lg"><FileText className="w-5 h-5 mr-2" /> Konfirmasi Simpan</h3>
              <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <div className="flex justify-between"><span className="text-slate-500">Tipe:</span> <span className="font-semibold text-right ml-4 capitalize">{activeTab}</span></div>
                <div className="flex justify-between border-t border-teal-200 dark:border-teal-500/30 pt-3"><span className="text-slate-800 dark:text-white">Judul:</span> <span className="text-teal-600 dark:text-teal-400 font-bold text-right ml-4">{activeTab === 'poling' ? judulPoling : judulSurvei}</span></div>
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
                 className="flex-1 py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-lg shadow-teal-600/30 transition-colors"
               >
                 Ya, Simpan
               </button>
             </div>
           </div>
         ) : (
           <>
             {activeTab === 'poling' ? renderFormPoling() : renderFormSurvei()}
             <div className="pt-6">
                <button 
                  onClick={() => setShowConfirm(true)}
                  className="w-full py-4 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-teal-500/30 transition-all active:scale-[0.98] focus:ring-4 focus:ring-teal-500/20"
                >
                  {activeTab === 'poling' ? 'Simpan Poling' : 'Kirim Survei'}
                </button>
             </div>
           </>
         )}
      </div>
    );
    if (isMobile) {
      return (
        <MobileBottomSheet isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? `Edit ${activeTab}` : (activeTab === 'poling' ? "Tambah Poling" : "Tambah Survei")}>
          {content}
        </MobileBottomSheet>
      );
    }
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[24px] shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl z-10">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{editId ? `Edit ${activeTab}` : (activeTab === 'poling' ? "Tambah Poling" : "Tambah Survei")}</h2>
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
               <div className="text-xs text-slate-500 font-medium">{viewData.type === 'poling' ? 'Tanggal Poling' : 'Tanggal Survei'}: {viewData.tanggal}</div>
             </div>
             <div className="text-right">
                <div className="text-xs font-semibold text-teal-600 bg-teal-50 dark:bg-teal-500/10 px-3 py-1 rounded-full border border-teal-100 dark:border-teal-500/20 capitalize">{viewData.type}</div>
             </div>
          </div>
          
          <div className="pt-2">
             <div className="text-sm text-slate-500 mb-1">Judul</div>
             <div className="font-bold text-lg text-slate-800 dark:text-white leading-tight">{viewData.judul}</div>
          </div>
          
          {viewData.gambarPreview && (
            <div className="my-4">
               <img src={viewData.gambarPreview} alt="Gambar" className="w-full max-h-48 object-cover rounded-xl border border-slate-200 dark:border-slate-700" />
            </div>
          )}
          {viewData.type === 'poling' ? (
             <div className="space-y-4">
               <div>
                  <div className="text-sm text-slate-500 mb-1">Nomor Paslon</div>
                  <div className="font-bold text-slate-800 dark:text-white">{viewData.nomorPaslon}</div>
               </div>
               <div>
                  <div className="text-sm text-slate-500 mb-1">Tanggal & Waktu Terbit</div>
                  <div className="font-medium text-slate-800 dark:text-slate-300">{viewData.tanggalPenerbitan} {viewData.waktuPenerbitan}</div>
               </div>
               <div>
                  <div className="text-sm text-slate-500 mb-1">Visi</div>
                  <div className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 whitespace-pre-wrap">{viewData.visi || '-'}</div>
               </div>
               <div>
                  <div className="text-sm text-slate-500 mb-1">Misi</div>
                  <div className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 whitespace-pre-wrap">{viewData.misi || '-'}</div>
               </div>
             </div>
          ) : (
             <div className="space-y-4">
               <div>
                  <div className="text-sm text-slate-500 mb-1">Deskripsi</div>
                  <div className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 whitespace-pre-wrap">{viewData.deskripsi || '-'}</div>
               </div>
               <div>
                  <div className="text-sm text-slate-500 mb-1">Link Survei</div>
                  <a href={viewData.link} target="_blank" rel="noreferrer" className="text-sm font-medium text-teal-600 dark:text-teal-400 break-all bg-teal-50 dark:bg-teal-900/30 p-3 rounded-xl block border border-teal-100 dark:border-teal-800 hover:underline">{viewData.link}</a>
               </div>
               <div>
                  <div className="text-sm text-slate-500 mb-1">Pembuat Survei</div>
                  <div className="font-medium text-slate-800 dark:text-white flex items-center gap-2"><User className="w-4 h-4"/>{viewData.pembuat}</div>
               </div>
             </div>
          )}
        </div>
      </div>
    );
    if (isMobile) {
      return (
        <MobileBottomSheet isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`Detail ${viewData.type === 'poling' ? 'Poling' : 'Survei'}`}>
          {content}
        </MobileBottomSheet>
      );
    }
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[24px] shadow-2xl relative z-10 flex flex-col overflow-hidden max-h-[90vh]">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl sticky top-0 z-10">
             <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 capitalize">Detail {viewData.type}</h2>
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
        <div className="flex flex-col sm:flex-row bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl w-full sm:w-fit mx-auto border border-slate-200 dark:border-slate-700/50 relative shadow-inner overflow-hidden">
             <div className="absolute inset-0 bg-teal-500/[0.03] pointer-events-none" />
             <button 
               onClick={() => setActiveTab('poling')}
               className={`flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all relative z-10 min-w-[140px] ${activeTab === 'poling' ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
             >
               <BarChart3 className={`w-4 h-4 ${activeTab === 'poling' ? 'text-teal-500 text-teal-400' : ''}`} />
               Poling / Pemilihan OSIS
             </button>
             <button 
               onClick={() => setActiveTab('survei')}
               className={`flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all relative z-10 min-w-[140px] ${activeTab === 'survei' ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
             >
               <FileText className={`w-4 h-4 ${activeTab === 'survei' ? 'text-teal-500 text-teal-400' : ''}`} />
               Survei Sekolah
             </button>
        </div>
        {/* Header Options */}
        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={openTambah}
            className="flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-teal-500 to-emerald-600 p-5 rounded-[20px] text-white shadow-xl shadow-teal-500/20 active:scale-95 transition-all text-center border-b-4 border-teal-700/50 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm relative z-10">
              <Plus className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-lg tracking-wide relative z-10">Tambah Data {activeTab === 'poling' ? 'Poling' : 'Survei'}</span>
          </button>
        </div>
        {/* Filter and Export */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-2 self-start lg:self-auto text-slate-800 dark:text-white font-bold text-lg">
              <Filter className="w-5 h-5 text-teal-500" /> Filter & Unduh
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <button 
                onClick={handleExportPDF}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-500/20 px-4 py-2.5 rounded-xl font-bold transition-colors text-sm"
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
                placeholder={`Cari judul ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm dark:text-white"
              />
            </div>
          </div>
        </div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 capitalize">
            Daftar {activeTab}
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
                <div className="bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400 p-3 rounded-xl mt-1 shrink-0">
                  {activeTab === 'poling' ? <BarChart3 className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-1">
                     <h3 className="font-bold text-slate-800 dark:text-slate-100 text-[17px] leading-tight line-clamp-1">{item.judul}</h3>
                     {activeTab === 'poling' && (
                        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md font-medium text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0 w-fit">{item.nomorPaslon}</span>
                     )}
                  </div>
                  <div className="flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 gap-2 mb-2 w-full">
                    <span className="whitespace-nowrap">{item.tanggal}</span>
                    {activeTab === 'survei' && (
                       <>
                         <span>•</span>
                         <span className="truncate">{item.pembuat}</span>
                       </>
                    )}
                  </div>
                  
                  {/* Action buttons embedded in mobile layout */}
                  <div className="flex sm:hidden items-center justify-start gap-2 w-full pt-1">
                     <button onClick={() => openView(item)} className="flex items-center justify-center h-9 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs ring-1 ring-indigo-100 dark:ring-indigo-500/20 active:scale-95 transition-all w-fit">
                       <Eye className="w-3.5 h-3.5 mr-1.5" /> Lihat
                     </button>
                     <button onClick={() => openEdit(item, item.type)} className="flex items-center justify-center h-9 px-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs ring-1 ring-amber-100 dark:ring-amber-500/20 active:scale-95 transition-all w-fit">
                       <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
                     </button>
                     <button onClick={() => handleDelete(item.id, item.type)} className="flex items-center justify-center h-9 px-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-xs ring-1 ring-red-100 dark:ring-red-500/20 active:scale-95 transition-all w-fit">
                       <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Hapus
                     </button>
                  </div>
                </div>
              </div>
              
              {/* Desktop action buttons */}
              <div className="hidden sm:flex flex-col items-end shrink-0 gap-2">
                 <div className="flex items-center justify-end gap-2 w-full">
                   <button onClick={() => openView(item)} className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all">
                     <Eye className="w-4 h-4" />
                   </button>
                   <button onClick={() => openEdit(item, item.type)} className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all">
                     <Edit2 className="w-4 h-4" />
                   </button>
                   <button onClick={() => handleDelete(item.id, item.type)} className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all">
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
              </div>
            </div>
          )) : (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
              {activeTab === 'poling' ? (
                <BarChart3 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              ) : (
                <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              )}
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Belum ada {activeTab}</h3>
              <p className="text-slate-500 max-w-sm mx-auto">Mulai tambahkan {activeTab} baru di sistem.</p>
            </div>
          )}
        </div>
      </div>
      {renderModal()}
      {renderViewModal()}
    </div>
  );
}
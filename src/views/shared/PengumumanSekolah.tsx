import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, Megaphone, Search, Image as ImageIcon, Download, Calendar, Info, FileText, User } from 'lucide-react';
import jsPDF from 'jspdf';
import { useIsMobile } from '../../App';
import { MobileBottomSheet } from '../../components/ui/MobileBottomSheet';
import { applyPdfKop } from '../../utils/kopHelper';
export function PengumumanSekolah() {
  const isMobile = useIsMobile();
  
  const [pengumumanList, setPengumumanList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJenis, setFilterJenis] = useState('Semua');
  
  const [selectedPengumuman, setSelectedPengumuman] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  useEffect(() => {
    const loadData = () => {
    const list = JSON.parse(localStorage.getItem('sd_pengumuman_list') || '[]');
    setPengumumanList(list.sort((a: any, b: any) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()));
  };
    loadData();
    window.addEventListener('localStorageUpdate', loadData);
    return () => window.removeEventListener('localStorageUpdate', loadData);
  }, []);
  const openView = (item: any) => {
    setSelectedPengumuman(item);
    setIsViewModalOpen(true);
  };
  const categories = ['Semua', ...Array.from(new Set(pengumumanList.map(p => p.jenis)))];
  
  const filteredList = pengumumanList.filter(item => {
    const q = searchQuery.toLowerCase();
    const matchSearch = (item.nama?.toLowerCase() || '').includes(q) || (item.keterangan?.toLowerCase() || '').includes(q);
    const matchCategory = filterJenis === 'Semua' || item.jenis === filterJenis;
    return matchSearch && matchCategory;
  });
  const generatePDF = (item: any) => {
    const doc = new jsPDF();
    const startY = applyPdfKop(doc);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Laporan", 14, startY + 5);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("PENGUMUMAN SEKOLAH", 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Judul: ${item.nama}`, 20, 40);
    doc.text(`Jenis: ${item.jenis}`, 20, 50);
    doc.text(`Tanggal: ${item.tanggal} ${item.waktu || ''}`, 20, 60);
    doc.text(`Sumber/Pembuat: ${item.petugas || '-'}`, 20, 70);
    
    doc.text("Keterangan:", 20, 85);
    const splitText = doc.splitTextToSize(item.keterangan || '-', 170);
    doc.text(splitText, 20, 95);
    
    if (item.filePreview) {
      doc.text("Catatan: Pengumuman ini memiliki lampiran gambar utama yang dapat dilihat pada aplikasi.", 20, 150);
    }
    
    doc.save(`Pengumuman_${item.kode || item.id}.pdf`);
  };
  const handleDownloadImage = (dataUrl: string, filename: string) => {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };
  const renderViewModal = () => {
    if (!isViewModalOpen || !selectedPengumuman) return null;
    
    const content = (
      <div className="p-6 pb-24 lg:pb-6">
        <div className="bg-white dark:bg-slate-800/50 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700/50 shadow-sm relative">
          
          {selectedPengumuman.filePreview ? (
            <div className="w-full relative bg-slate-100 dark:bg-slate-900 overflow-hidden">
               <img src={selectedPengumuman.filePreview} alt="Lampiran" className="w-full max-h-64 object-contain" />
               <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur text-blue-600 dark:text-blue-400 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                  {selectedPengumuman.jenis}
               </div>
            </div>
          ) : (
            <div className="h-40 w-full bg-slate-100 dark:bg-slate-700 flex flex-col items-center justify-center relative">
               <Megaphone className="w-16 h-16 text-slate-400 dark:text-slate-500 opacity-50" />
               <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur text-blue-600 dark:text-blue-400 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                  {selectedPengumuman.jenis}
               </div>
            </div>
          )}
          
          <div className="p-6">
             <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center gap-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                   <Calendar className="w-3.5 h-3.5" />
                   {selectedPengumuman.tanggal} {selectedPengumuman.waktu || ''}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                   <User className="w-3.5 h-3.5" />
                   {selectedPengumuman.petugas || 'Sekolah'}
                </span>
             </div>
             <h3 className="font-bold text-2xl text-slate-800 dark:text-white leading-tight mb-4">{selectedPengumuman.nama}</h3>
             
             <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 mb-6">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                   <Info className="w-4 h-4 text-blue-500" /> Isi Pengumuman
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                   {selectedPengumuman.keterangan || 'Tidak ada keterangan tambahan.'}
                </p>
             </div>
             <div className="grid grid-cols-1 gap-3">
                {selectedPengumuman.filePreview && (
                  <button 
                    onClick={() => handleDownloadImage(selectedPengumuman.filePreview, `Lampiran_${selectedPengumuman.kode || selectedPengumuman.id}.png`)}
                    className="w-full py-3.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 rounded-xl font-bold transition-all flex justify-center items-center gap-2"
                  >
                    <ImageIcon className="w-5 h-5" /> Download Gambar / Lampiran
                  </button>
                )}
                <button 
                  onClick={() => generatePDF(selectedPengumuman)}
                  className="w-full py-3.5 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold shadow-lg shadow-slate-900/20 dark:shadow-white/10 transition-all flex justify-center items-center gap-2"
                >
                  <Download className="w-5 h-5" /> Download Dokumen Pengumuman
                </button>
             </div>
          </div>
        </div>
      </div>
    );
    if (isMobile) {
      return (
        <MobileBottomSheet isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Pengumuman">
          {content}
        </MobileBottomSheet>
      );
    }
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[24px] shadow-2xl relative z-10 flex flex-col overflow-hidden max-h-[90vh]">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl sticky top-0 z-10">
             <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500" /> Detail</h2>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[100vw] overflow-x-hidden pt-safe pb-32">
      <div className="flex flex-col gap-6">
        
        {/* Banner Section */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden h-40 sm:h-48 md:h-56 flex flex-col justify-end">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
           <div className="absolute bottom-0 right-10 opacity-20 pointer-events-none transform translate-y-1/4 right-0 rotate-[-15deg]">
              <Megaphone className="w-48 h-48 sm:w-64 sm:h-64" />
           </div>
           
           <div className="relative z-10">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">Pengumuman Sekolah</h1>
              <p className="text-blue-100 font-medium text-sm sm:text-base max-w-sm sm:max-w-md">Temukan berbagai informasi resmi, acara, dan jadwal kegiatan penting sekolah di sini.</p>
           </div>
        </div>
        {/* Search & Categories */}
        <div className="flex flex-col md:flex-row gap-4 items-center mb-2 mt-4 z-20">
           <div className="relative w-full md:w-96 shrink-0 group">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Cari pengumuman..." 
                 className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700/50 rounded-2xl outline-none focus:border-blue-500 dark:focus:border-blue-500 text-sm dark:text-white shadow-sm transition-all"
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
        {/* Pengumuman List Grid */}
        {filteredList.length > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {filteredList.map((item) => {
                 return (
                 <div key={item.id} className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group flex flex-col h-full relative cursor-pointer" onClick={() => openView(item)}>
                    
                    {/* Cover Photo */}
                    {item.filePreview ? (
                       <div className="h-44 sm:h-52 w-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center relative overflow-hidden group-hover:opacity-90 transition-opacity shrink-0">
                          <img src={item.filePreview} alt="" className="w-full h-full object-cover" />
                       </div>
                    ) : (
                       <div className="h-44 sm:h-52 w-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center relative overflow-hidden group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-colors shrink-0">
                          <Megaphone className="w-16 h-16 text-slate-300 dark:text-slate-600 group-hover:text-blue-400 dark:group-hover:text-blue-500/50 transition-colors" />
                       </div>
                    )}
                    
                    <div className="absolute top-4 right-4 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur text-blue-600 dark:text-blue-400 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm">
                       {item.jenis}
                    </div>
                    
                    <div className="p-5 sm:p-6 flex flex-col flex-1">
                       <h3 className="font-bold text-lg sm:text-xl text-slate-800 dark:text-white leading-tight mb-3 line-clamp-2">{item.nama}</h3>
                       
                       <div className="flex flex-wrap items-center gap-3 mt-auto pt-2 border-t border-slate-100 dark:border-slate-700/50 text-xs text-slate-500 dark:text-slate-400 font-medium">
                          <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{item.tanggal}</div>
                          <div className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{item.petugas || 'Sekolah'}</div>
                       </div>
                    </div>
                 </div>
                 );
              })}
           </div>
        ) : (
           <div className="bg-slate-50 dark:bg-slate-800/20 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 mt-4">
              <Megaphone className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Belum ada Pengumuman</h3>
              <p className="text-slate-500 max-w-sm mx-auto">Saat ini belum ada pengumuman resmi atau acara yang dibagikan oleh pihak sekolah.</p>
           </div>
        )}
      </div>
      {renderViewModal()}
    </div>
  );
}
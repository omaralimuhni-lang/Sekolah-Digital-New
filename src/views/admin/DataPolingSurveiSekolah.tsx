import React from 'react';
import { useState, useEffect } from 'react';
import { Download, Search, Edit, Trash2, Eye, BarChart3, ChevronLeft } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAppContext } from '../../AppContext';
import { TableVirtuoso } from 'react-virtuoso';
import { useIsMobile } from '../../App';
import { MobileBottomSheet } from '../../components/ui/MobileBottomSheet';
import { createPortal } from 'react-dom';
import { applyPdfKop } from '../../utils/kopHelper';
export function DataPolingSurveiSekolah() {
  const { showNotification } = useAppContext();
  const isMobile = useIsMobile();
  
  const [dataList, setDataList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJenis, setFilterJenis] = useState('Semua');
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  // Edit States
  const [editJudul, setEditJudul] = useState('');
  const [editDeskripsi, setEditDeskripsi] = useState('');
  const [editVisi, setEditVisi] = useState('');
  const [editMisi, setEditMisi] = useState('');
  useEffect(() => {
    const loadData = () => {
    const pList = JSON.parse(localStorage.getItem('sd_poling_list') || '[]');
    const sList = JSON.parse(localStorage.getItem('sd_survei_list') || '[]');
    
    // sorting by timestamp (assuming newer ids are larger numbers or just put them together)
    const combined = [...pList, ...sList].sort((a, b) => Number(b.id) - Number(a.id));
    setDataList(combined);
  };
    loadData();
    window.addEventListener('localStorageUpdate', loadData);
    return () => window.removeEventListener('localStorageUpdate', loadData);
  }, []);
  const handleDelete = (id: string, type: string) => {
    if (type === 'poling') {
       const pList = JSON.parse(localStorage.getItem('sd_poling_list') || '[]');
       const updated = pList.filter((p: any) => p.id !== id);
       localStorage.setItem('sd_poling_list', JSON.stringify(updated));
    } else {
       const sList = JSON.parse(localStorage.getItem('sd_survei_list') || '[]');
       const updated = sList.filter((p: any) => p.id !== id);
       localStorage.setItem('sd_survei_list', JSON.stringify(updated));
    }
    setDataList(dataList.filter(p => p.id !== id));
    setShowDeleteConfirm(null);
    showNotification(`Data ${type} berhasil dihapus`);
  };
  const getJenisOptions = () => ['Semua', 'poling', 'survei'];
  const displayList = dataList.filter(item => {
    const matchQ = item.judul?.toLowerCase().includes(searchQuery.toLowerCase());
    const jenisMatch = filterJenis === 'Semua' ? true : item.type === filterJenis;
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
          ['DATA POLING SURVEI'],
          [''],
          ['Tanggal', 'Jenis', 'Judul', 'Keterangan']
        ];
        
        let csv = '';
        displayList.forEach(item => {
      const desc = item.type === 'poling' ? (item.visi || '-') : (item.deskripsi || '-');
      csv += `${item.tanggal},${item.type},"${item.judul}","${desc}"\n`;
    });
    
        // Instead of executing the loop to string, let's just parse the csv variable into an array of arrays.
        // It's a bit hacky but it avoids writing complex AST parsers.
        const dataRows = csv.trim().split('\n').map(row => row.split(',').map(cell => cell.replace(/^"|"$/g, '').trim()));
        
        const ws = XLSX.utils.aoa_to_sheet([...kopRows, ...dataRows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laporan");
        XLSX.writeFile(wb, `Data_Poling_Survei_${new Date().getTime()}.xlsx`);
      });
    });
  };
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const startY = applyPdfKop(doc);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Laporan", 14, startY + 5);
    doc.text("Data Poling & Survei Sekolah", 14, 15);
    autoTable(doc, {
      startY: startY + 10,
      head: [['Tanggal', 'Jenis', 'Judul']],
      body: displayList.map(item => [
        item.tanggal || '-',
        item.type || '-',
        item.judul || '-'
      ])
    });
    doc.save("Data_Poling_Survei.pdf");
  };
  const openView = (item: any) => {
    setSelectedItem(item);
    setIsViewModalOpen(true);
  };
  
  const openEdit = (item: any) => {
    setSelectedItem(item);
    setEditJudul(item.judul);
    if (item.type === 'poling') {
       setEditVisi(item.visi || '');
       setEditMisi(item.misi || '');
    } else {
       setEditDeskripsi(item.deskripsi || '');
    }
    setIsEditModalOpen(true);
  };
  const handleSaveEdit = () => {
    const updated = dataList.map(p => {
      if (p.id === selectedItem.id) {
        if (p.type === 'poling') {
           return { ...p, judul: editJudul, visi: editVisi, misi: editMisi };
        } else {
           return { ...p, judul: editJudul, deskripsi: editDeskripsi };
        }
      }
      return p;
    });
    
    setDataList(updated);
    
    // Update local storage directly
    const pList = updated.filter(i => i.type === 'poling');
    const sList = updated.filter(i => i.type === 'survei');
    localStorage.setItem('sd_poling_list', JSON.stringify(pList));
    localStorage.setItem('sd_survei_list', JSON.stringify(sList));
    
    setIsEditModalOpen(false);
    showNotification("Perubahan berhasil disimpan");
  };
  const renderEditModal = () => {
    if (!isEditModalOpen || !selectedItem) return null;
    const content = (
      <div className="p-6 space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Judul</label>
          <input type="text" value={editJudul} onChange={e => setEditJudul(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
        </div>
        {selectedItem.type === 'poling' ? (
          <>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Visi</label>
              <textarea rows={3} value={editVisi} onChange={e => setEditVisi(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white resize-none" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Misi</label>
              <textarea rows={3} value={editMisi} onChange={e => setEditMisi(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white resize-none" />
            </div>
          </>
        ) : (
          <div>
            <label className="text-sm font-medium mb-1.5 block">Deskripsi / Pertanyaan Survei</label>
            <textarea rows={5} value={editDeskripsi} onChange={e => setEditDeskripsi(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white resize-none" />
          </div>
        )}
        
        <button onClick={handleSaveEdit} className="w-full mt-2 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold">Simpan Perubahan</button>
      </div>
    );
    if (isMobile) {
      return (
        <MobileBottomSheet isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Data ${selectedItem.type}`}>
          {content}
        </MobileBottomSheet>
      );
    }
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[24px] shadow-2xl relative z-10 flex flex-col overflow-hidden max-h-[90vh]">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl z-10">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 capitalize">Edit Data {selectedItem.type}</h2>
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
        {selectedItem.gambarPreview && (
           <div className="w-full h-40 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden mb-4">
             <img src={selectedItem.gambarPreview} alt="Bukti" className="w-full h-full object-cover rounded-xl mt-2" />
           </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
           <div>
              <div className="text-xs text-slate-500 mb-1">Tanggal</div>
              <div className="font-medium text-slate-800 dark:text-slate-200">{selectedItem.tanggal}</div>
           </div>
           {selectedItem.type === 'poling' && (
             <div>
                <div className="text-xs text-slate-500 mb-1">No Paslon</div>
                <div className="font-medium text-slate-800 dark:text-slate-200">{selectedItem.nomorPaslon || '-'}</div>
             </div>
           )}
        </div>
        <div className="space-y-3 pt-2">
           <div className="flex flex-col border-b border-slate-100 dark:border-slate-700/50 pb-2">
              <span className="text-slate-500 mb-1">Judul</span>
              <span className="font-bold text-base text-slate-800 dark:text-slate-200">{selectedItem.judul}</span>
           </div>
           
           {selectedItem.type === 'poling' ? (
             <>
               <div className="pt-2">
                  <span className="text-slate-500 block mb-1">Visi:</span>
                  <p className="font-medium text-slate-800 dark:text-slate-200 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl whitespace-pre-wrap">{selectedItem.visi || '-'}</p>
               </div>
               <div className="pt-2">
                  <span className="text-slate-500 block mb-1">Misi:</span>
                  <p className="font-medium text-slate-800 dark:text-slate-200 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl whitespace-pre-wrap">{selectedItem.misi || '-'}</p>
               </div>
             </>
           ) : (
             <>
               <div className="pt-2">
                  <span className="text-slate-500 block mb-1">Deskripsi:</span>
                  <p className="font-medium text-slate-800 dark:text-slate-200 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl whitespace-pre-wrap">{selectedItem.deskripsi || '-'}</p>
               </div>
               {selectedItem.link && (
                 <div className="pt-2">
                    <span className="text-slate-500 block mb-1">Link Eksternal (Google Form, Dll):</span>
                    <a href={selectedItem.link} target="_blank" rel="noreferrer" className="text-teal-600 dark:text-teal-400 break-all hover:underline">{selectedItem.link}</a>
                 </div>
               )}
             </>
           )}
        </div>
      </div>
    );
    if (isMobile) {
      return (
        <MobileBottomSheet isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`Detail ${selectedItem.type}`}>
          {content}
        </MobileBottomSheet>
      );
    }
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[24px] shadow-2xl relative z-10 flex flex-col overflow-hidden max-h-[90vh]">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl z-10">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 capitalize">Detail {selectedItem.type}</h2>
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
        <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl shadow-teal-500/20 relative overflow-hidden h-40 sm:h-48 flex flex-col justify-end">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
           <div className="absolute bottom-0 right-10 opacity-20 pointer-events-none transform translate-y-1/4 right-0 rotate-[-15deg]">
              <BarChart3 className="w-48 h-48 sm:w-64 sm:h-64" />
           </div>
           
           <div className="relative z-10">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">Data Poling & Survei</h1>
              <p className="text-teal-100 font-medium text-sm sm:text-base max-w-sm sm:max-w-md">Kelola pengumpulan aspirasi dan survei dari warga sekolah.</p>
           </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-2 mt-4 z-20">
           <div className="flex flex-col md:flex-row gap-4 items-center w-full lg:w-auto">
             <div className="relative w-full md:w-80 shrink-0 group">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                <input 
                   type="text" 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder="Cari judul..." 
                   className="w-full pl-12 pr-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700/50 rounded-2xl outline-none focus:border-teal-500 dark:focus:border-teal-500 text-sm dark:text-white shadow-sm transition-all"
                />
             </div>
             
             <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 no-scrollbar scroll-smooth">
                {getJenisOptions().map((cat: any, idx: number) => (
                   <button 
                     key={idx}
                     onClick={() => setFilterJenis(cat)}
                     className={`whitespace-nowrap capitalize px-4 py-2 rounded-full font-bold text-sm transition-all shadow-sm ${
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
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50 m-0">Tanggal</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50 m-0">Jenis</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50 m-0">Judul</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-center bg-slate-50 dark:bg-slate-900/50 m-0">Aksi</th>
              </tr>
            )}
            itemContent={(_index, item) => (
              <>
                <td className="px-6 py-4 whitespace-nowrap h-20 align-middle">
                  <div className="text-slate-800 dark:text-slate-200 font-medium">{item.tanggal}</div>
                </td>
                <td className="px-6 py-4 h-20 align-middle">
                  <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-bold capitalize ${item.type === 'poling' ? 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400' : 'bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400'}`}>{item.type}</span>
                </td>
                <td className="px-6 py-4 h-20 align-middle">
                  <div className="font-bold text-slate-800 dark:text-slate-200">{item.judul}</div>
                </td>
                <td className="px-6 py-4 h-20 align-middle text-center">
                   <div className="flex items-center justify-center gap-2">
                     <button onClick={() => openView(item)} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"><Eye className="w-4 h-4" /></button>
                     <button onClick={() => openEdit(item)} className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20"><Edit className="w-4 h-4" /></button>
                     {showDeleteConfirm === item.id ? (
                        <div className="flex items-center gap-1">
                           <button onClick={() => handleDelete(item.id, item.type)} className="px-2 py-1 bg-red-600 text-white rounded text-xs font-bold">Ya</button>
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
            <div className="px-6 py-10 text-center text-slate-500 font-medium border-t border-slate-100 dark:border-slate-800">Tidak ada data.</div>
          )}
        </div>
      </div>
      {renderEditModal()}
      {renderViewModal()}
    </div>
  );
}
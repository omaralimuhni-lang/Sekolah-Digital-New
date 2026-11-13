import { useState, useEffect } from 'react';
import { Search, Calendar as CalendarIcon, Download, X, Edit, Trash2, FileText } from 'lucide-react';
import { createPortal } from 'react-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
export function LaporanKehadiran() {
  const [absensiList, setAbsensiList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Semua');
  
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editStatus, setEditStatus] = useState('');
  useEffect(() => {
    const loadData = () => {
      const data = JSON.parse(localStorage.getItem('sd_absensi_list') || '[]');
      setAbsensiList(data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    };
    loadData();
    const handleCustomStorageUpdate = () => loadData();
    window.addEventListener('storage', handleCustomStorageUpdate);
    window.addEventListener('localStorageUpdate', handleCustomStorageUpdate);
    return () => {
      window.removeEventListener('storage', handleCustomStorageUpdate);
      window.removeEventListener('localStorageUpdate', handleCustomStorageUpdate);
    };
  }, []);
  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data absensi ini?')) {
      const updated = absensiList.filter(item => item.id !== id);
      setAbsensiList(updated);
      localStorage.setItem('sd_absensi_list', JSON.stringify(updated));
    }
  };
  const handleEdit = (item: any) => {
    setEditingItem(item);
    setEditStatus(item.status);
  };
  const saveEdit = () => {
    if (!editingItem) return;
    const updated = absensiList.map(item => {
      if (item.id === editingItem.id) {
        return { ...item, status: editStatus };
      }
      return item;
    });
    setAbsensiList(updated);
    localStorage.setItem('sd_absensi_list', JSON.stringify(updated));
    setEditingItem(null);
  };
  const filteredData = absensiList.filter((item) => {
    const matchSearch = (item.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.type || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (activeTab === 'Semua') return matchSearch;
    return item.role === activeTab.toLowerCase() && matchSearch;
  });
  const exportCSV = () => {
    import('xlsx').then((XLSX) => {
      import('../../utils/kopHelper').then(({ getKopConfig }) => {
        const config = getKopConfig('excel');
        const kopRows = [
          [config.sekolahName],
          [config.address],
          [config.contact + (config.website ? ` | ${config.website}` : '')],
          [''],
          [`LAPORAN KEHADIRAN - ${activeTab.toUpperCase()}`],
          [''],
          ['Pengguna', 'Role', 'Tanggal', 'Waktu', 'Tipe', 'Lokasi', 'Status']
        ];
        
        const dataRows = filteredData.map(item => [
          item.userName || '-',
          item.role || '-',
          item.date || '-',
          item.time || '-',
          item.type || '-',
          item.location || '-',
          item.status || '-'
        ]);
        const ws = XLSX.utils.aoa_to_sheet([...kopRows, ...dataRows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laporan Kehadiran");
        XLSX.writeFile(wb, `Laporan_Kehadiran_${activeTab}_${new Date().getTime()}.xlsx`);
      });
    });
  };
  const exportPDF = () => {
    import('../../utils/kopHelper').then(({ applyPdfKop }) => {
      const doc = new jsPDF();
      const startY = applyPdfKop(doc);
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`Laporan Kehadiran (${activeTab})`, 14, startY + 5);
      
      autoTable(doc, {
        startY: startY + 10,
        head: [['Pengguna', 'Role', 'Tanggal', 'Waktu', 'Tipe', 'Status']],
        body: filteredData.map(item => [
          item.userName || '-',
          item.role || '-',
          item.date || '-',
          item.time || '-',
          item.type || '-',
          item.status || '-'
        ])
      });
      
      doc.save(`Laporan_Kehadiran_${activeTab}.pdf`);
    });
  };
  const tabs = ['Semua', 'Siswa', 'Guru', 'Tendik', 'Mitra'];
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[100vw] overflow-x-hidden pt-safe pb-32">
      <div className="flex flex-col gap-6">
        <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl shadow-teal-500/20 relative overflow-hidden h-40 sm:h-48 flex flex-col justify-end">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
           <div className="absolute bottom-0 right-10 opacity-20 pointer-events-none transform translate-y-1/4 right-0 rotate-[-15deg]">
              <CalendarIcon className="w-48 h-48 sm:w-64 sm:h-64" />
           </div>
           
           <div className="relative z-10">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">Laporan Kehadiran</h1>
              <p className="text-teal-100 font-medium text-sm sm:text-base max-w-sm sm:max-w-md">Seluruh riwayat kehadiran dari semua role.</p>
           </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-2 mt-4 z-20">
           <div className="flex flex-col md:flex-row gap-4 items-center w-full lg:w-auto">
             <div className="relative w-full md:w-80 shrink-0 group">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                <input 
                   type="text" 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   placeholder="Cari nama, tipe..." 
                   className="w-full pl-12 pr-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700/50 rounded-2xl outline-none focus:border-teal-500 dark:focus:border-teal-500 text-sm dark:text-white shadow-sm transition-all"
                />
             </div>
             
             <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 no-scrollbar scroll-smooth">
                {tabs.map((tab) => (
                   <button 
                     key={tab}
                     onClick={() => setActiveTab(tab)}
                     className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                        activeTab === tab 
                        ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-800 shadow-md transform scale-105' 
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-2 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                     }`}
                   >
                     {tab === 'Tendik' ? 'Tenaga Pendidik' : tab}
                   </button>
                ))}
             </div>
           </div>
           <div className="flex items-center gap-2 w-full lg:w-auto mt-2 lg:mt-0">
             <button onClick={exportCSV} className="flex-1 lg:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700/50 hover:border-emerald-500 dark:hover:border-emerald-500 text-emerald-600 dark:text-emerald-400 rounded-xl transition-all shadow-sm active:scale-95 font-medium text-sm">
                <Download className="w-5 h-5" />
                <span>Ekspor Excel</span>
             </button>
             <button onClick={exportPDF} className="flex-1 lg:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700/50 hover:border-rose-500 dark:hover:border-rose-500 text-rose-600 dark:text-rose-400 rounded-xl transition-all shadow-sm active:scale-95 font-medium text-sm">
                <FileText className="w-5 h-5" />
                <span>Ekspor PDF</span>
             </button>
           </div>
        </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                <th className="p-4 font-medium">Pengguna</th>
                <th className="p-4 font-medium">Role/Sistem</th>
                <th className="p-4 font-medium">Tipe</th>
                <th className="p-4 font-medium">Waktu</th>
                <th className="p-4 font-medium">Foto</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700 dark:text-slate-300">
              {filteredData.length > 0 ? filteredData.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                  <td className="p-4 font-medium">
                     <span className="break-words line-clamp-1">{item.userName || 'Unknown'}</span>
                  </td>
                  <td className="p-4 uppercase">{item.role}</td>
                  <td className="p-4">
                     <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${
                        item.type === 'Sakit' ? 'bg-amber-100 text-amber-700' :
                        item.type === 'Izin' ? 'bg-indigo-100 text-indigo-700' :
                        (item.type === 'Hadir' || item.type === 'Buka') ? 'bg-emerald-100 text-emerald-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {item.type}
                      </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span>{item.date}</span>
                      <span className="text-xs text-slate-500">{item.time}</span>
                    </div>
                  </td>
                  <td className="p-4">
                     {item.photoUrl ? (
                         <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 cursor-pointer" onClick={() => setSelectedPhoto(item.photoUrl)}>
                           <img src={item.photoUrl} alt="Absen" className="w-full h-full object-cover hover:scale-110 transition-transform" />
                         </div>
                      ) : '-'}
                  </td>
                  <td className="p-4">
                      <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${item.status === 'Berhasil' || item.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {item.status}
                      </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg transition-colors" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50 rounded-lg transition-colors" title="Hapus">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {editingItem && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Edit Absensi</h3>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status Kehadiran</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white"
                >
                  <option value="Berhasil">Berhasil</option>
                  <option value="Menunggu">Menunggu</option>
                  <option value="Disetujui">Disetujui</option>
                  <option value="Ditolak">Ditolak</option>
                </select>
              </div>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {selectedPhoto && createPortal(
         <div className="fixed inset-0 z-[99999] bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
            <div className="relative max-w-2xl w-full">
               <button onClick={() => setSelectedPhoto(null)} className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white bg-black/50 rounded-full"><X className="w-6 h-6" /></button>
               <img src={selectedPhoto} alt="Zoom" className="w-full h-auto max-h-[85vh] object-contain rounded-xl" />
            </div>
         </div>,
         document.body
      )}
      </div>
    </div>
  );
}
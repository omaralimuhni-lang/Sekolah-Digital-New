import { useState, useEffect } from 'react';
import { Search, FileText, X, Download } from 'lucide-react';
import { useAppContext } from '../../AppContext';
import { createPortal } from 'react-dom';
import { jsPDF } from 'jspdf';
import { applyPdfKop } from '../../utils/kopHelper';

export function KehadiranAnak() {
  const { user } = useAppContext();
  const [absensiList, setAbsensiList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    const loadData = () => {
      const parentData = JSON.parse(localStorage.getItem('sd_db_ortu') || '[]');
      const studentData = JSON.parse(localStorage.getItem('sd_db_siswa') || '[]');
      const allAbsensi = JSON.parse(localStorage.getItem('sd_absensi_list') || '[]');

      // Find current parent
      const currentParent = parentData.find((p: any) => p.fullName === user?.name || p.username === user?.name);
      
      let matchedAnakIds: string[] = [];
      let matchedAnakData: any[] = [];
      
      if (currentParent) {
        const { childName, childClass, childNisn } = currentParent;
        
        studentData.forEach((siswa: any) => {
          const matchNisn = childNisn && siswa.nisn && (siswa.nisn.toLowerCase() === childNisn.toLowerCase() || siswa.nisn.includes(childNisn));
          const matchClass = childClass && siswa.class && siswa.class.toLowerCase() === childClass.toLowerCase();
          const matchName = childName && siswa.fullName && siswa.fullName.toLowerCase().includes(childName.toLowerCase());
          
          if (matchNisn || (matchClass && matchName) || matchName) {
            matchedAnakIds.push(siswa.id);
            matchedAnakData.push(siswa);
          }
        });
      }

      // 1 month ago
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const filteredAbsensi = allAbsensi.filter((item: any) => {
        // Must be in matched anak IDs and has role siswa
        if (item.role !== 'siswa' || !matchedAnakIds.includes(item.userId)) return false;
        
        // Parse date. Expected format: "DD/MM/YYYY" or valid date string
        let itemDateStr = item.date;
        let itemDateObj;
        if (itemDateStr.includes('/')) {
            const [day, month, year] = itemDateStr.split('/');
            itemDateObj = new Date(`${year}-${month}-${day}`);
        } else {
            itemDateObj = new Date(itemDateStr);
        }
        
        if (!isNaN(itemDateObj.getTime())) {
             return itemDateObj.getTime() >= oneMonthAgo.getTime();
        }
        return true;
      });

      setAbsensiList(filteredAbsensi.sort((a: any, b: any) => {
           let aDateObj, bDateObj;
           if (a.date.includes('/')) {
               const [day, month, year] = a.date.split('/');
               aDateObj = new Date(`${year}-${month}-${day}`).getTime();
           } else {
               aDateObj = new Date(a.date).getTime();
           }
           if (b.date.includes('/')) {
               const [day, month, year] = b.date.split('/');
               bDateObj = new Date(`${year}-${month}-${day}`).getTime();
           } else {
               bDateObj = new Date(b.date).getTime();
           }
           return bDateObj - aDateObj;
      }));
    };

    loadData();

    const handleCustomStorageUpdate = () => loadData();
    window.addEventListener('storage', handleCustomStorageUpdate);
    window.addEventListener('localStorageUpdate', handleCustomStorageUpdate);

    return () => {
      window.removeEventListener('storage', handleCustomStorageUpdate);
      window.removeEventListener('localStorageUpdate', handleCustomStorageUpdate);
    };
  }, [user]);

  const filteredData = absensiList.filter((item) =>
    (item.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.status || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportCSV = () => {
    const headers = ['Nama Anak', 'Tanggal', 'Waktu', 'Tipe', 'Status', 'Catatan/Lokasi'];
    const rows = filteredData.map(item => [
      item.userName || '-',
      item.date || '-',
      item.time || '-',
      item.type || '-',
      item.status || '-',
      (item.location || '-').replace(/,/g, ' ')
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Kehadiran_Anak_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const startY = applyPdfKop(doc);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Laporan", 14, startY + 5);
    doc.setFontSize(16);
    doc.text(`Laporan Kehadiran Anak`, 14, 20);
    doc.setFontSize(10);
    
    let yPos = 30;
    filteredData.forEach((item, index) => {
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
      const text = `${index + 1}. ${item.userName} - ${item.date} ${item.time} - ${item.type} [${item.status}]`;
      doc.text(text, 14, yPos);
      yPos += 8;
    });
    
    doc.save(`Laporan_Kehadiran_Anak_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Kehadiran Anak</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Riwayat kehadiran anak Anda selama 1 bulan terakhir</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button onClick={exportCSV} className="flex items-center space-x-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors text-sm font-medium">
            <Download className="w-4 h-4" />
            <span>Excel</span>
          </button>
          <button onClick={exportPDF} className="flex items-center space-x-2 px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-colors text-sm font-medium">
            <FileText className="w-4 h-4" />
            <span>PDF</span>
          </button>
          <div className="relative flex-1 sm:w-64">
             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input
               type="text"
               placeholder="Cari nama, tipe..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800 dark:text-white"
             />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700/50 flex flex-col justify-center items-center">
             <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Kehadiran</h3>
             <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{filteredData.filter(i => i.type === 'Hadir').length}</span>
             <p className="text-xs text-slate-400 mt-1">1 Bulan Terakhir</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700/50 flex flex-col justify-center items-center">
             <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Sakit/Izin</h3>
             <span className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">{filteredData.filter(i => i.type === 'Sakit' || i.type === 'Izin').length}</span>
             <p className="text-xs text-slate-400 mt-1">1 Bulan Terakhir</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700/50 flex flex-col justify-center items-center">
             <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Alpa/Terlambat</h3>
             <span className="text-3xl font-bold text-rose-600 dark:text-rose-400 mt-2">{filteredData.filter(i => i.type === 'Terlambat' || i.type === 'Alpa').length}</span>
             <p className="text-xs text-slate-400 mt-1">1 Bulan Terakhir</p>
          </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                <th className="p-4 font-medium">Foto</th>
                <th className="p-4 font-medium">Nama Anak</th>
                <th className="p-4 font-medium">Tipe / Status</th>
                <th className="p-4 font-medium">Tanggal / Waktu</th>
                <th className="p-4 font-medium">Lokasi / Keterangan</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700 dark:text-slate-300">
              {filteredData.length > 0 ? filteredData.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                  <td className="p-4 font-medium">
                     {item.photoUrl ? (
                         <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 cursor-pointer" onClick={() => setSelectedPhoto(item.photoUrl)}>
                           <img src={item.photoUrl} alt="Absen" className="w-full h-full object-cover hover:scale-110 transition-transform" />
                         </div>
                      ) : '-'}
                  </td>
                  <td className="p-4">
                     <span className="font-bold block break-words line-clamp-1">{item.userName || 'Unknown'}</span>
                     <span className="text-xs text-slate-500">Siswa</span>
                  </td>
                  <td className="p-4">
                     <div className="space-y-1">
                         <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium block w-fit ${
                            item.type === 'Sakit' ? 'bg-amber-100 text-amber-700' :
                            item.type === 'Izin' ? 'bg-indigo-100 text-indigo-700' :
                            (item.type === 'Hadir') ? 'bg-emerald-100 text-emerald-700' :
                            'bg-blue-100 text-blue-700'
                         }`}>
                           {item.type}
                         </span>
                         <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium block w-fit ${item.status === 'Berhasil' || item.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                           {item.status}
                         </span>
                     </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{item.date}</span>
                      <span className="text-xs text-slate-500 mt-1">{item.time} WIB</span>
                    </div>
                  </td>
                  <td className="p-4 max-w-[200px]">
                     <span className="text-xs text-slate-500 break-words line-clamp-2" title={item.location}>{item.location || '-'}</span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Tidak ada riwayat kehadiran ditemukan dalam periode 1 bulan terakhir.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
  );
}

import { useState, useEffect } from 'react';
import { Search, X, Download, FileText } from 'lucide-react';
import { useAppContext } from '../../AppContext';
import { createPortal } from 'react-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
export function KehadiranSiswa() {
  const { user } = useAppContext();
  const [activeTab, setActiveTab] = useState<'Wali Kelas' | 'Mata Pelajaran'>('Wali Kelas');
  const [absensiList, setAbsensiList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  useEffect(() => {
    const loadData = () => {
      const storedSiswa = JSON.parse(localStorage.getItem('sd_db_siswa') || '[]');
      const storedJadwal = JSON.parse(localStorage.getItem('sd_jadwal_siswa') || '[]');
      const storedAbsensi = JSON.parse(localStorage.getItem('sd_absensi_list') || '[]');
      
      let waliKelasIds = new Set<string>();
      let mapelIds = new Set<string>();
      if (user?.name) {
        const kelasAjar = Array.from(new Set(
          storedJadwal
            .filter((j: any) => j.guruInput?.toLowerCase() === user.name.toLowerCase())
            .map((j: any) => j.kelas)
        )) as string[];
        storedSiswa.forEach((s: any) => {
          const isWaliKelas = (s.homeroomTeacher || '').toLowerCase() === user.name.toLowerCase();
          const isMataPelajaran = kelasAjar.includes(s.class);
          // Always add both if matched to use sets later for filtering
          if (isWaliKelas) {
            waliKelasIds.add(s.id);
            waliKelasIds.add((s.name || '').toLowerCase());
          }
          if (isMataPelajaran) {
            mapelIds.add(s.id);
            mapelIds.add((s.name || '').toLowerCase());
          }
        });
      }
      // Filter absensi items specifically for Siswa role and who are within these matching sets
      const relevantAbsensi = storedAbsensi.filter((a: any) => {
        if (a.role !== 'siswa') return false;
        
        const matchesWaliKelas = waliKelasIds.has(a.userId) || waliKelasIds.has((a.userName || '').toLowerCase());
        const matchesMapel = mapelIds.has(a.userId) || mapelIds.has((a.userName || '').toLowerCase());
        if (activeTab === 'Wali Kelas') return matchesWaliKelas;
        if (activeTab === 'Mata Pelajaran') return matchesMapel;
        return false;
      });
      // Sort by latest
      setAbsensiList(relevantAbsensi.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    };
    loadData();
    const handleCustomStorageUpdate = () => loadData();
    window.addEventListener('storage', handleCustomStorageUpdate);
    window.addEventListener('localStorageUpdate', handleCustomStorageUpdate);
    return () => {
      window.removeEventListener('storage', handleCustomStorageUpdate);
      window.removeEventListener('localStorageUpdate', handleCustomStorageUpdate);
    };
  }, [user, activeTab]);
  const filteredData = absensiList.filter((item) =>
    (item.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.type || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const exportCSV = () => {
    import('xlsx').then((XLSX) => {
      import('../../utils/kopHelper').then(({ getKopConfig }) => {
        const config = getKopConfig('excel');
        const kopRows = [
          [config.sekolahName],
          [config.address],
          [config.contact + (config.website ? ` | ${config.website}` : '')],
          [''],
          [`LAPORAN KEHADIRAN SISWA - ${activeTab.toUpperCase()}`],
          [''],
          ['Nama Siswa', 'Tanggal', 'Waktu', 'Tipe', 'Lokasi', 'Status']
        ];
        
        const dataRows = filteredData.map(item => [
          item.userName || '-',
          item.date || '-',
          item.time || '-',
          item.type || '-',
          item.location || '-',
          item.status || '-'
        ]);
        const ws = XLSX.utils.aoa_to_sheet([...kopRows, ...dataRows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Kehadiran Siswa");
        XLSX.writeFile(wb, `Laporan_Kehadiran_Siswa_${activeTab}_${new Date().getTime()}.xlsx`);
      });
    });
  };
  const exportPDF = () => {
    import('../../utils/kopHelper').then(({ applyPdfKop }) => {
      const doc = new jsPDF();
      const startY = applyPdfKop(doc);
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`Laporan Kehadiran Siswa (${activeTab})`, 14, startY + 5);
      
      autoTable(doc, {
        startY: startY + 10,
        head: [['Nama Siswa', 'Tanggal', 'Waktu', 'Tipe', 'Status']],
        body: filteredData.map(item => [
          item.userName || '-',
          item.date || '-',
          item.time || '-',
          item.type || '-',
          item.status || '-'
        ])
      });
      
      doc.save(`Laporan_Kehadiran_Siswa_${activeTab}.pdf`);
    });
  };
  const tabs = ['Wali Kelas', 'Mata Pelajaran'] as const;
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Kehadiran Siswa</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Pantau riwayat kehadiran siswa</p>
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
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800 dark:text-white"
            />
          </div>
        </div>
      </div>
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-700">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                <th className="p-4 font-medium">Nama Siswa</th>
                <th className="p-4 font-medium">Tipe</th>
                <th className="p-4 font-medium">Waktu</th>
                <th className="p-4 font-medium">Foto</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700 dark:text-slate-300">
              {filteredData.length > 0 ? filteredData.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                  <td className="p-4 font-medium">
                     <span className="break-words line-clamp-1">{item.userName || 'Unknown'}</span>
                  </td>
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
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Tidak ada riwayat kehadiran ditemukan.
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
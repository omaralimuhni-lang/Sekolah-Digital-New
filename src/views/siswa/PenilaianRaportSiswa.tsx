import { useState, useEffect } from 'react';
import { Star, Search, Award, FileText, Globe, Eye, BookOpen, FileDown, FilePlus } from 'lucide-react';
import { useAppContext } from '../../AppContext';
import jsPDF from 'jspdf';
import { applyPdfKop } from '../../utils/kopHelper';
export const PenilaianRaportSiswa = () => {
  const { user, showNotification } = useAppContext();
  const [activeTab, setActiveTab] = useState<'pr_tugas' | 'ujian' | 'mapel' | 'global' | 'raport'>('pr_tugas');
  const [searchQuery, setSearchQuery] = useState('');
  const [siswaInfo, setSiswaInfo] = useState<any>(null);
  // Sample states
  const [dataPrTugas, setDataPrTugas] = useState<any[]>([]);
  const [dataUjian, setDataUjian] = useState<any[]>([]);
  const [dataMapel, setDataMapel] = useState<any[]>([]);
  const [dataGlobal, setDataGlobal] = useState<any[]>(null);
  const [dataRaport, setDataRaport] = useState<any[]>([]);
  const loadStudentData = () => {
    // Determine student info based on user
    const dbSiswa = JSON.parse(localStorage.getItem('sd_db_siswa') || '[]');
    let foundSiswa = null;
    if (user.role === 'siswa' || user.role === 'ortu') {
      const dbsDemo = [
        { id: 'S1', fullName: 'Ahmad Hanif', class: '10 IPA 1', nisn: '100101', username: 'ahmad' },
        { id: 'S2', fullName: 'Bunga Lestari', class: '10 IPS 2', nisn: '100102', username: 'bunga' },
      ];
      
      let candidates = [...dbSiswa, ...dbsDemo];
      foundSiswa = candidates.find(s => 
        (user.nisn && s.nisn === user.nisn) || 
        (s.fullName && s.fullName.toLowerCase() === user.name.toLowerCase()) ||
        (s.username && s.username.toLowerCase() === user.name.toLowerCase())
      );
      if (!foundSiswa) {
        // if parent and no match found, fallback to the first child in db for demo purposes
        if (user.role === 'ortu') {
            foundSiswa = dbsDemo[0];
        } else {
            foundSiswa = { id: user.id || 'S99', fullName: user.name, class: '10 IPA 1', nisn: user.nisn || '100999' };
        }
      }
    }
    setSiswaInfo(foundSiswa);
    const sNisn = foundSiswa?.nisn || user.nisn;
    const sName = foundSiswa?.fullName || user.name;
    const allTugas = JSON.parse(localStorage.getItem('sd_penilaian_tugas') || '[]');
    const allUjian = JSON.parse(localStorage.getItem('sd_penilaian_ujian') || '[]');
    const allMapel = JSON.parse(localStorage.getItem('sd_penilaian_mapel') || '[]');
    const allGlobal = JSON.parse(localStorage.getItem('sd_penilaian_global') || '[]');
    const allRaport = JSON.parse(localStorage.getItem('sd_raport') || '[]');
    const filterByStudent = (arr: any[]) => arr.filter((x: any) => (x.nisn && x.nisn === sNisn) || (x.namaSiswa && x.namaSiswa === sName));
    setDataPrTugas(filterByStudent(allTugas));
    setDataUjian(filterByStudent(allUjian));
    setDataMapel(filterByStudent(allMapel));
    setDataGlobal(filterByStudent(allGlobal));
    setDataRaport(filterByStudent(allRaport));
  };
  useEffect(() => {
    loadStudentData();
    
    // Listen for storage events (from other tabs)
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('sd_penilaian_') || e.key === 'sd_raport') {
        loadStudentData();
      }
    };
    
    // Listen for custom events (from the same tab)
    const handleCustomStorageUpdate = () => {
      loadStudentData();
    };
    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('localStorageUpdate', handleCustomStorageUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('localStorageUpdate', handleCustomStorageUpdate);
    };
  }, [user]);
  const handleDownload = (format: 'pdf' | 'word') => {
    if (dataRaport.length === 0) {
      showNotification('Tidak ada raport untuk didownload', 'error');
      return;
    }
    const doc = new jsPDF();
    const kopStartY = applyPdfKop(doc);
    
    doc.setFontSize(16);
    doc.text(`Raport Siswa - ${siswaInfo?.fullName || user.name}`, 14, kopStartY + 5);
    
    doc.setFontSize(12);
    doc.text(`NISN: ${siswaInfo?.nisn || user.nisn}`, 14, kopStartY + 15);
    doc.text(`Kelas: ${siswaInfo?.class || '-'}`, 14, kopStartY + 22);
    
    let contentStartY = kopStartY + 35;
    dataRaport.forEach((item) => {
      doc.text(`Semester ${item.semester} - Tahun Ajaran ${item.tahunAjaran}`, 14, contentStartY);
      doc.text(`Status: ${item.status}`, 14, contentStartY + 7);
      doc.text(`Rangking Kelas: Peringkat ${item.rangking}`, 14, contentStartY + 14);
      contentStartY += 30;
      if (contentStartY > 250) {
        doc.addPage();
        contentStartY = 20;
      }
    });
    const extension = format === 'pdf' ? 'pdf' : 'doc';
    doc.save(`Raport_${siswaInfo?.nisn || 'Siswa'}.${extension}`);
    showNotification(`Dokumen raport berformat ${format.toUpperCase()} berhasil diunduh`, 'success');
  };
  const renderFilter = () => (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm mb-6">
      <div className="relative w-full sm:w-96">
        <input 
          type="text" 
          placeholder="Cari mapel atau nama ujian..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
      </div>
    </div>
  );
  const renderTable = (headers: string[], renderRow: (item: any, i: number) => React.ReactNode, data: any[]) => {
    // Basic filter
    const activeData = data.filter(d => 
      (d.mapel?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.namaTugas?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.namaUjian?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.semester?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700/50">
                {headers.map((h, i) => (
                  <th key={i} className="pb-4 font-semibold text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeData.length > 0 ? activeData.map((item, i) => renderRow(item, i)) : (
                <tr>
                  <td colSpan={headers.length} className="text-center py-12 text-slate-500 dark:text-slate-400">
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  return (
    <div className="max-w-7xl mx-auto pb-24 lg:pb-12 space-y-6 mt-6">
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl shadow-amber-500/20 relative overflow-hidden h-40 sm:h-48 flex flex-col justify-end">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
         <div className="absolute bottom-0 right-10 opacity-20 pointer-events-none transform translate-y-1/4 right-0 rotate-[-15deg]">
            <Star className="w-48 h-48 sm:w-64 sm:h-64 text-white" />
         </div>
         
         <div className="relative z-10 w-full flex flex-col md:flex-row gap-6 items-start md:items-end justify-between">
           <div>
             <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 tracking-tight text-white">
                {user.role === 'ortu' ? 'Penilaian & Rapor Anak' : 'Penilaian & Raport'}
             </h1>
             <p className="text-amber-100 font-medium text-sm sm:text-base max-w-sm sm:max-w-md">
                {siswaInfo ? `${siswaInfo.fullName} • NIS/NISN: ${siswaInfo.nisn} • Kelas: ${siswaInfo.class}` : 'Memuat data siswa...'}
             </p>
           </div>
         </div>
      </div>
      <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
         {[
           { id: 'pr_tugas', label: 'Tugas', icon: FileText },
           { id: 'ujian', label: 'Ujian', icon: FilePlus },
           { id: 'mapel', label: 'Mapel', icon: Award },
           { id: 'global', label: 'Global', icon: Globe },
           { id: 'raport', label: 'Raport Akhir', icon: BookOpen },
         ].map(tab => (
           <button 
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors whitespace-nowrap flex-1 justify-center sm:flex-none ${activeTab === tab.id ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}
           >
             <tab.icon className="w-4 h-4" />
             {tab.label}
           </button>
         ))}
      </div>
      <div className="space-y-6">
        {(activeTab !== 'global' && activeTab !== 'raport') && renderFilter()}
        {activeTab === 'pr_tugas' && renderTable(
          ['Tanggal', 'Mata Pelajaran', 'Tugas', 'Tipe', 'Nilai'],
          (item, i) => (
             <tr key={i} className="border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="py-4 text-slate-600 dark:text-slate-400">{item.tanggal}</td>
                <td className="py-4 font-medium text-slate-800 dark:text-slate-200">{item.mapel}</td>
                <td className="py-4 text-slate-600 dark:text-slate-400">{item.namaTugas}</td>
                <td className="py-4 text-slate-600 dark:text-slate-400">{item.tipe}</td>
                <td className="py-4 font-bold text-amber-600">{item.nilai}</td>
             </tr>
          ),
          dataPrTugas
        )}
        {activeTab === 'ujian' && renderTable(
          ['Tanggal', 'Mata Pelajaran', 'Ujian', 'Tipe', 'Nilai'],
          (item, i) => (
             <tr key={i} className="border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="py-4 text-slate-600 dark:text-slate-400">{item.tanggal}</td>
                <td className="py-4 font-medium text-slate-800 dark:text-slate-200">{item.mapel}</td>
                <td className="py-4 text-slate-600 dark:text-slate-400">{item.namaUjian}</td>
                <td className="py-4 text-slate-600 dark:text-slate-400">{item.tipe}</td>
                <td className="py-4 font-bold text-amber-600">{item.nilai}</td>
             </tr>
          ),
          dataUjian
        )}
        {activeTab === 'mapel' && renderTable(
          ['Mata Pelajaran', 'Rata Rata Tugas', 'Rata Rata Ujian', 'Nilai Akhir Mapel'],
          (item, i) => (
             <tr key={i} className="border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="py-4 font-medium text-slate-800 dark:text-slate-200">{item.mapel}</td>
                <td className="py-4 text-slate-600 dark:text-slate-400">{item.nilaiTugas}</td>
                <td className="py-4 text-slate-600 dark:text-slate-400">{item.nilaiUjian}</td>
                <td className="py-4 font-bold text-blue-600">{item.rataRata}</td>
             </tr>
          ),
          dataMapel
        )}
        {activeTab === 'global' && dataGlobal && dataGlobal.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-10 shadow-sm border border-slate-100 dark:border-slate-800 text-center max-w-3xl mx-auto mt-8">
              <Globe className="w-16 h-16 text-blue-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Penilaian Global</h2>
              <p className="text-slate-500 mb-8">Rata-rata keseluruhan performa akademik siswa berdasarkan seluruh mata pelajaran.</p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex-1">
                      <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Rata-Rata Keseluruhan</div>
                      <div className="text-5xl font-extrabold text-blue-600">{dataGlobal[0].rataRataKeseluruhan}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex-1">
                      <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Predikat</div>
                      <div className="text-5xl font-extrabold text-emerald-600">{dataGlobal[0].predikat}</div>
                  </div>
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-500/10 p-6 rounded-2xl border border-amber-100 dark:border-amber-500/20 text-left">
                  <div className="font-bold text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-2">
                     <FileText className="w-5 h-5"/> Catatan Guru:
                  </div>
                  <p className="text-amber-700 dark:text-amber-300 leading-relaxed font-medium">
                     "{dataGlobal[0].catatan}"
                  </p>
              </div>
          </div>
        )}
        {activeTab === 'raport' && (
           <div className="space-y-6">
              {renderFilter()}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {dataRaport.length > 0 ? dataRaport.map((item, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full hover:shadow-md transition-shadow">
                       <div className="flex justify-between items-start mb-4">
                           <div className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold rounded-lg text-xs uppercase tracking-wider">
                              Semester {item.semester}
                           </div>
                           <div className="text-slate-500 font-medium text-sm">TA: {item.tahunAjaran}</div>
                       </div>
                       
                       <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Raport Akhir Semester</h3>
                       <div className="flex gap-4 mb-6 flex-wrap">
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex-1 border border-slate-100 dark:border-slate-700/50">
                             <div className="text-xs text-slate-500 mb-1">Status</div>
                             <div className="font-bold text-emerald-600">{item.status}</div>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex-1 border border-slate-100 dark:border-slate-700/50">
                             <div className="text-xs text-slate-500 mb-1">Rangking Kelas</div>
                             <div className="font-bold text-blue-600">Peringkat {item.rangking}</div>
                          </div>
                       </div>
                       
                       <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-3">
                           <button onClick={() => {
                               if(item.fileRaport) {
                                   const win = window.open();
                                   if (win) win.document.write(`<iframe src="${item.fileRaport}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                               } else {
                                   showNotification('File raport tidak tersedia', 'error');
                               }
                           }} className="flex flex-1 justify-center items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-3 rounded-xl font-medium transition-colors">
                              <Eye className="w-4 h-4"/> Lihat Review
                           </button>
                           <button onClick={() => handleDownload('pdf')} className="flex justify-center items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-3 rounded-xl font-medium transition-colors shadow-sm">
                              <FileDown className="w-4 h-4"/> PDF
                           </button>
                           <button onClick={() => handleDownload('word')} className="flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-medium transition-colors shadow-sm">
                              <FileDown className="w-4 h-4"/> Word
                           </button>
                       </div>
                    </div>
                 )) : (
                    <div className="col-span-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center py-20 flex flex-col items-center">
                        <BookOpen className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
                        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Belum ada Raport</h3>
                        <p className="text-slate-500 mt-2">Raport akhir semester belum diterbitkan oleh pihak sekolah.</p>
                    </div>
                 )}
              </div>
           </div>
        )}
      </div>
    </div>
  );
};
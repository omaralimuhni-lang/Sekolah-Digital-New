import { useState, useEffect } from 'react';
import { CalendarDays, GraduationCap, ArrowUpCircle, Users, Plus, CheckCircle2 } from 'lucide-react';
import { RpIcon } from '../../components/ui/RpIcon';
import { useAppContext } from '../../AppContext';
interface Siswa {
  id?: string;
  fullName: string;
  nisn: string;
  class: string;
  tahunAjaran?: string;
  status?: string; // 'Aktif', 'Lulus'
}
export function PengaturanTahunAjaran() {
  const { showNotification } = useAppContext();
  
  const [tahunAjaranList, setTahunAjaranList] = useState<string[]>([]);
  const [activeTahunAjaran, setActiveTahunAjaran] = useState<string>('');
  const [newTahunAjaran, setNewTahunAjaran] = useState('');
  
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [selectedSiswaIds, setSelectedSiswaIds] = useState<string[]>([]);
  const [targetClass, setTargetClass] = useState('');
  useEffect(() => {
    const loadData = () => {
    // Load student database and tahun ajaran list
    const savedSiswa = JSON.parse(localStorage.getItem('sd_db_siswa') || '[]');
    setSiswaList(savedSiswa);
    const savedTahunAjaran = JSON.parse(localStorage.getItem('sd_tahun_ajaran') || '[]');
    if (savedTahunAjaran.length === 0) {
      // Initialize with default
      const defaultTahun = ['2023/2024', '2024/2025'];
      localStorage.setItem('sd_tahun_ajaran', JSON.stringify(defaultTahun));
      setTahunAjaranList(defaultTahun);
      setActiveTahunAjaran('2024/2025');
    } else {
      setTahunAjaranList(savedTahunAjaran);
      setActiveTahunAjaran(savedTahunAjaran[savedTahunAjaran.length - 1]);
    }
  };
    loadData();
    window.addEventListener('localStorageUpdate', loadData);
    return () => window.removeEventListener('localStorageUpdate', loadData);
  }, []);
  const handleAddTahunAjaran = () => {
    if (!newTahunAjaran.trim()) return;
    if (tahunAjaranList.includes(newTahunAjaran)) {
      showNotification('Tahun Ajaran sudah ada!');
      return;
    }
    const updated = [...tahunAjaranList, newTahunAjaran];
    setTahunAjaranList(updated);
    localStorage.setItem('sd_tahun_ajaran', JSON.stringify(updated));
    setActiveTahunAjaran(newTahunAjaran);
    setNewTahunAjaran('');
    showNotification('Berhasil menambahkan Tahun Ajaran baru');
  };
  const handleSaveSiswa = (updatedList: Siswa[]) => {
    setSiswaList(updatedList);
    localStorage.setItem('sd_db_siswa', JSON.stringify(updatedList));
  };
  const currentSiswa = siswaList.filter(s => (s.tahunAjaran === activeTahunAjaran) || (!s.tahunAjaran && activeTahunAjaran === tahunAjaranList[0]));
  const missingSiswa = siswaList.filter(s => s.tahunAjaran !== activeTahunAjaran && s.status !== 'Lulus');
  const handleToggleSelectId = (nisn: string) => {
    setSelectedSiswaIds(prev => 
      prev.includes(nisn) ? prev.filter(id => id !== nisn) : [...prev, nisn]
    );
  };
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSiswaIds(currentSiswa.map(s => s.nisn));
    } else {
      setSelectedSiswaIds([]);
    }
  };
  const handleBulkSetTahunAjaran = () => {
    // Import all missingSiswa into current Tahun Ajaran
    const updated = siswaList.map(s => {
      if (s.status !== 'Lulus' && s.tahunAjaran !== activeTahunAjaran) {
        return { ...s, tahunAjaran: activeTahunAjaran };
      }
      return s;
    });
    handleSaveSiswa(updated);
    showNotification(`Berhasil memigrasikan siswa ke Tahun Ajaran ${activeTahunAjaran}`);
  };
  const handleKenaikanKelas = () => {
    if (selectedSiswaIds.length === 0) {
      showNotification('Pilih siswa terlebih dahulu!');
      return;
    }
    if (!targetClass) {
      showNotification('Masukkan target kelas!');
      return;
    }
    const updated = siswaList.map(s => {
      if (selectedSiswaIds.includes(s.nisn)) {
        return { ...s, class: targetClass };
      }
      return s;
    });
    handleSaveSiswa(updated);
    setSelectedSiswaIds([]);
    setTargetClass('');
    showNotification(`Berhasil menaikkan kelas siswa terpilih ke kelas ${targetClass}`);
  };
  const handleKelulusan = () => {
    if (selectedSiswaIds.length === 0) {
      showNotification('Pilih siswa terlebih dahulu!');
      return;
    }
    
    if (!window.confirm(`Anda yakin ingin meluluskan ${selectedSiswaIds.length} siswa terpilih?`)) {
      return;
    }
    const updated = siswaList.map(s => {
      if (selectedSiswaIds.includes(s.nisn)) {
        return { ...s, status: 'Lulus' };
      }
      return s;
    });
    handleSaveSiswa(updated);
    setSelectedSiswaIds([]);
    showNotification('Berhasil memperbarui status kelulusan siswa terpilih');
  };
  const handleAturKeuangan = () => {
    if (selectedSiswaIds.length === 0) {
      showNotification('Pilih siswa terlebih dahulu!');
      return;
    }
    showNotification(`Pengaturan keuangan untuk ${selectedSiswaIds.length} siswa akan diterapkan (Fitur Terjadwal).`);
    setSelectedSiswaIds([]);
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full pb-32">
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2 sm:p-3 bg-teal-600 rounded-xl text-white">
            <CalendarDays className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Pengaturan Tahun Ajaran
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Atur daftar siswa, kenaikan kelas, kelulusan, dan administrasi keuangan.
            </p>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar / Top for Tahun Ajaran Selection */}
          <div className="lg:w-1/4 space-y-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50">
               <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Pilih Tahun Ajaran</h2>
               <div className="space-y-2">
                 {tahunAjaranList.map(ta => (
                   <button
                     key={ta}
                     onClick={() => { setActiveTahunAjaran(ta); setSelectedSiswaIds([]); }}
                     className={`w-full text-left px-4 py-3 rounded-xl transition-all font-medium ${
                       activeTahunAjaran === ta 
                       ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800' 
                       : 'bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                     }`}
                   >
                     {ta}
                   </button>
                 ))}
               </div>
               <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                  <label className="text-xs font-semibold text-slate-500 mb-2 block uppercase tracking-wider">Tambah Baru</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Misal: 2025/2026"
                      value={newTahunAjaran}
                      onChange={(e) => setNewTahunAjaran(e.target.value)}
                      className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-slate-100"
                    />
                    <button 
                      onClick={handleAddTahunAjaran}
                      className="bg-teal-600 hover:bg-teal-700 text-white p-2 text-sm rounded-lg transition-colors flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
               </div>
            </div>
          </div>
          {/* Main Content Area */}
          <div className="lg:w-3/4 space-y-6">
            
            {/* Action Bar */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
               <div className="flex items-center gap-2">
                 <Users className="w-5 h-5 text-teal-600" />
                 <h2 className="font-semibold text-slate-800 dark:text-slate-100">Siswa di Tahun {activeTahunAjaran}</h2>
                 <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-1 rounded-full ml-2">
                   {currentSiswa.length} Siswa
                 </span>
               </div>
               <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                 {selectedSiswaIds.length > 0 && (
                   <span className="text-sm text-slate-500 mr-2 font-medium">{selectedSiswaIds.length} Terpilih</span>
                 )}
                 
                 <div className="flex bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden p-1 gap-1 w-full sm:w-auto">
                    <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg pr-1">
                      <input 
                        type="text" 
                        placeholder="Kelas Baru"
                        value={targetClass}
                        onChange={(e) => setTargetClass(e.target.value)}
                        className="w-24 bg-transparent px-3 py-1.5 text-sm focus:outline-none dark:text-slate-100"
                      />
                      <button 
                        onClick={handleKenaikanKelas}
                        title="Kenaikan Kelas"
                        className="hover:bg-teal-50 dark:hover:bg-teal-900/30 text-teal-600 dark:text-teal-400 p-1.5 rounded-md transition-colors"
                      >
                        <ArrowUpCircle className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="w-px bg-slate-200 dark:bg-slate-700 my-1"></div>
                    <button 
                      onClick={handleKelulusan}
                      title="Setel Kelulusan"
                      className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      <GraduationCap className="w-4 h-4" /> Kelulusan
                    </button>
                    
                    <button 
                      onClick={handleAturKeuangan}
                      title="Atur Administrasi Keuangan"
                      className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      <RpIcon className="w-4 h-4" /> Keuangan
                    </button>
                 </div>
               </div>
            </div>
            {/* Missing Siswa Banner */}
            {missingSiswa.length > 0 && currentSiswa.length === 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div>
                  <h3 className="font-semibold text-blue-800 dark:text-blue-300">Tahun Ajaran Kosong</h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">Ada {missingSiswa.length} siswa aktif yang belum dimasukkan ke Tahun Ajaran ini.</p>
                </div>
                <button 
                  onClick={handleBulkSetTahunAjaran}
                  className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  Migrasikan Siswa Aktif
                </button>
              </div>
            )}
            {/* Student Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                       <th className="p-4 w-12 text-center">
                         <input 
                           type="checkbox" 
                           className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                           checked={currentSiswa.length > 0 && selectedSiswaIds.length === currentSiswa.length}
                           onChange={(e) => handleSelectAll(e.target.checked)}
                         />
                       </th>
                       <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">NISN</th>
                       <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Siswa</th>
                       <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kelas</th>
                       <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                     {currentSiswa.length > 0 ? currentSiswa.map((siswa) => (
                       <tr 
                         key={siswa.nisn} 
                         className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedSiswaIds.includes(siswa.nisn) ? 'bg-teal-50/50 dark:bg-teal-900/10' : ''}`}
                       >
                         <td className="p-4 text-center">
                           <input 
                             type="checkbox" 
                             className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                             checked={selectedSiswaIds.includes(siswa.nisn)}
                             onChange={() => handleToggleSelectId(siswa.nisn)}
                           />
                         </td>
                         <td className="p-4 text-sm text-slate-500 dark:text-slate-400 font-mono">{siswa.nisn}</td>
                         <td className="p-4 text-sm font-medium text-slate-800 dark:text-slate-200">{siswa.fullName}</td>
                         <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                            <span className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg font-medium">{siswa.class}</span>
                         </td>
                         <td className="p-4">
                            {siswa.status === 'Lulus' ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-md">
                                <CheckCircle2 className="w-3 h-3" /> Lulus
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-md">
                                Aktif
                              </span>
                            )}
                         </td>
                       </tr>
                     )) : (
                       <tr>
                         <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400">
                           Tidak ada data siswa untuk Tahun Ajaran ini.
                         </td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        </div>
    </div>
  );
}
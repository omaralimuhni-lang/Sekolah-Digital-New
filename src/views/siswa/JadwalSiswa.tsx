import { useState, useEffect } from 'react';
import { CalendarDays, Clock, MapPin, UserCheck, BookOpen } from 'lucide-react';
import { useAppContext } from '../../AppContext';

interface JadwalData {
  id: string;
  hari: string;
  tanggal?: string;
  mataPelajaran: string;
  jamMulai: string;
  jamSelesai: string;
  kelas: string;
  guruInput: string;
}

const HARI_OPTIONS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const STICKY_COLORS = [
  'bg-yellow-200 dark:bg-yellow-500/20 text-yellow-900 border-yellow-300 dark:border-yellow-500/30',
  'bg-blue-200 dark:bg-blue-500/20 text-blue-900 border-blue-300 dark:border-blue-500/30',
  'bg-green-200 dark:bg-green-500/20 text-green-900 border-green-300 dark:border-green-500/30',
  'bg-pink-200 dark:bg-pink-500/20 text-pink-900 border-pink-300 dark:border-pink-500/30',
  'bg-purple-200 dark:bg-purple-500/20 text-purple-900 border-purple-300 dark:border-purple-500/30',
  'bg-orange-200 dark:bg-orange-500/20 text-orange-900 border-orange-300 dark:border-orange-500/30',
];

export const JadwalSiswa = () => {
  const { user } = useAppContext();
  const [jadwalList, setJadwalList] = useState<JadwalData[]>([]);

  useEffect(() => {
    const loadData = () => {
    const saved = localStorage.getItem('sd_jadwal_siswa');
    if (saved) {
      setJadwalList(JSON.parse(saved));
    }
  };
    loadData();
    window.addEventListener('localStorageUpdate', loadData);
    return () => window.removeEventListener('localStorageUpdate', loadData);
  }, []);

  const getJadwalByHari = (hari: string) => {
    return jadwalList
      .filter(item => item.hari === hari)
      .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 lg:pb-12 space-y-8 mt-6">
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden h-40 sm:h-48 flex flex-col justify-end">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
         <div className="absolute bottom-0 right-10 opacity-20 pointer-events-none transform translate-y-1/4 right-0 rotate-[-15deg]">
            <CalendarDays className="w-48 h-48 sm:w-64 sm:h-64" />
         </div>
         
         <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">
              {user?.role === 'ortu' ? 'Jadwal Anak' : 'Jadwal Pelajaran'}
            </h1>
            <p className="text-blue-100 font-medium text-sm sm:text-base max-w-sm sm:max-w-md">
              {user?.role === 'ortu' ? 'Jadwal sekolah anak Anda selama seminggu.' : 'Jadwal sekolah kamu selama seminggu.'}
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {HARI_OPTIONS.map((hari, hariIndex) => {
          const jadwalHariIni = getJadwalByHari(hari);
          
          if (jadwalHariIni.length === 0) return null;

          return (
            <div key={hari} className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                {hari}
              </h2>
              
              <div className="space-y-4">
                {jadwalHariIni.map((item, index) => {
                  const colorClass = STICKY_COLORS[(hariIndex + index) % STICKY_COLORS.length];
                  
                  return (
                    <div 
                      key={item.id} 
                      className={`relative p-5 rounded-2xl shadow-sm border ${colorClass} transition-transform hover:-translate-y-1`}
                    >
                      {/* Thumbtack decoration */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-slate-300 dark:bg-slate-600 rounded-full shadow-inner border-2 border-slate-200 dark:border-slate-500 flex items-center justify-center z-10">
                        <div className="w-2 h-2 bg-slate-400 dark:bg-slate-700 rounded-full"></div>
                      </div>

                      <div className="mt-2 text-center mb-4">
                        {item.tanggal && (
                           <div className="text-xs font-semibold mb-1 opacity-80">{item.tanggal}</div>
                        )}
                        <h3 className="font-bold text-lg dark:text-white leading-tight">{item.mataPelajaran}</h3>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/50 dark:bg-black/20 rounded-full text-sm font-medium mt-2 dark:text-slate-200">
                          <Clock className="w-4 h-4" />
                          {item.jamMulai} - {item.jamSelesai}
                        </div>
                      </div>

                      <div className="space-y-2 text-sm dark:text-slate-300 border-t border-black/10 dark:border-white/10 pt-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 opacity-70" />
                          <span>{item.kelas}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 opacity-70" />
                          <span>{item.guruInput || 'Guru'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      {jadwalList.length === 0 && (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
          <BookOpen className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Jadwal Belum Tersedia</h3>
          <p className="text-slate-500 dark:text-slate-400">Silakan hubungi wali kelas atau guru untuk memperbarui jadwal.</p>
        </div>
      )}
    </div>
  );
};

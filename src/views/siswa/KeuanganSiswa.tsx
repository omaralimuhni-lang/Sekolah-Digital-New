import { useState, useEffect } from 'react';
import { Calendar, FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { RpIcon } from '../../components/ui/RpIcon';
import { useAppContext } from '../../AppContext';
export function KeuanganSiswa() {
  const { user } = useAppContext();
  const [activeTab, setActiveTab] = useState<'lunas' | 'cicilan' | 'tunggakan'>('lunas');
  
  const [pembayaranList, setPembayaranList] = useState<any[]>([]);
  const [jenisPembayaran, setJenisPembayaran] = useState<any[]>([]);
  const [siswaInfo, setSiswaInfo] = useState<any>(null);
  const BULAN_LIST = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  useEffect(() => {
    // Load lists
    const pbList = JSON.parse(localStorage.getItem('sd_pembayaran_list') || '[]');
    setPembayaranList(pbList);
    
    const defaultJenis = [
      { id: '1', name: 'SPP', amount: 250000, isMonthly: true },
      { id: '2', name: 'Uang Gedung', amount: 1500000, isMonthly: false },
      { id: '3', name: 'Seragam', amount: 850000, isMonthly: false },
      { id: '4', name: 'Buku', amount: 350000, isMonthly: false },
      { id: '5', name: 'Daftar Ulang', amount: 500000, isMonthly: false }
    ];
    setJenisPembayaran(JSON.parse(localStorage.getItem('sd_jenis_pembayaran') || 'null') || defaultJenis);
    // Try to find the student info based on user
    const dbs = [
      JSON.parse(localStorage.getItem('sd_db_siswa') || '[]'),
      [
        { id: 'S1', fullName: 'Ahmad Hanif', class: '10 IPA 1', nisn: '100101', username: 'ahmad' },
        { id: 'S2', fullName: 'Bunga Lestari', class: '10 IPS 2', nisn: '100102', username: 'bunga' },
        { id: 'S3', fullName: 'Candra Dinata', class: '11 IPA 1', nisn: '100203', username: 'candra' },
      ]
    ];
    let foundSiswa = null;
    if (user) {
      if (user.role === 'ortu') {
        // If parent, maybe grab the first student so we have some data to show
        for (const candidates of dbs) {
          if (candidates.length > 0) {
            foundSiswa = candidates[0]; // Just take the first one for demo purposes
            break;
          }
        }
      } else {
        for (const candidates of dbs) {
          foundSiswa = candidates.find((s: any) => 
            (user.nisn && s.nisn === user.nisn) ||
            (s.username && s.username.toLowerCase() === user.name.toLowerCase()) || 
            (s.fullName && s.fullName.toLowerCase() === user.name.toLowerCase()) ||
            user.name.toLowerCase().includes(s.fullName?.toLowerCase())
          );
          if (foundSiswa) break;
        }
      }
      
      // If we couldn't match structurally, maybe just simulate a dummy one for UI purpose
      if (!foundSiswa) {
        foundSiswa = { id: user.id || 'S99', fullName: user.name, class: 'Unknown', nisn: user.nisn || '-' };
      }
    }
    setSiswaInfo(foundSiswa);
  }, [user]);
  const formatCurrency = (value: number) => value.toLocaleString('id-ID');
  // Filter logic
  const myPayments = pembayaranList.filter(p => {
    if (!siswaInfo) return false;
    // Check if the student ID matches or full name matches
    return p.siswa?.id === siswaInfo.id || 
           (p.siswa?.fullName && p.siswa.fullName === siswaInfo.fullName) ||
           (p.siswa?.nisn && p.siswa.nisn === siswaInfo.nisn);
  });
  const lunasList = myPayments.filter(p => p.status === 'Lunas');
  
  // For cicilan, we group by jenis OR we list all payments that are 'Belum Lunas'
  const cicilanList = myPayments.filter(p => p.status === 'Belum Lunas' || p.metode === 'Cicil');
  // Tunggakan computation
  const getTunggakan = () => {
    if (!siswaInfo) return [];
    const tunggakan: any[] = [];
    
    jenisPembayaran.forEach(jenis => {
      if (jenis.isMonthly) {
        BULAN_LIST.forEach(bulan => {
          // If not lunas, check if there's any cicilan ? monthly is usually full or not.
          // Let's just say if there's no payment record for that month, it's tunggakan
          const hasRecord = myPayments.find(p => p.jenis === jenis.name && p.bulan === bulan);
          if (!hasRecord) {
            tunggakan.push({
               ...jenis,
               bulan,
               keterangan: `Tagihan ${jenis.name} - Bulan ${bulan}`,
               nominalTagihan: jenis.amount
            });
          }
        });
      } else {
        const pastRecords = myPayments.filter(p => p.jenis === jenis.name);
        const totalPaid = pastRecords.reduce((acc, curr) => acc + (curr.nominalDibayar || 0), 0);
        if (totalPaid === 0 && pastRecords.length === 0) {
          tunggakan.push({
            ...jenis,
            bulan: null,
            keterangan: `Tagihan ${jenis.name} Belum Dibayarkan`,
            nominalTagihan: jenis.amount
          });
        }
      }
    });
    return tunggakan;
  };
  const tunggakanList = getTunggakan();
  return (
    <div className="max-w-7xl mx-auto pb-24 lg:pb-12 space-y-6 mt-6">
      {/* Header Info Siswa */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 lg:p-8 shadow-xl shadow-blue-500/20 relative flex flex-col justify-end overflow-hidden mb-6 min-h-[160px] sm:h-48">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
         <div className="absolute bottom-0 right-10 opacity-20 pointer-events-none transform translate-y-1/4 right-0 rotate-[-15deg]">
            <RpIcon className="w-48 h-48 sm:w-64 sm:h-64 text-white" />
         </div>
         
         <div className="relative z-10 w-full flex flex-col md:flex-row gap-6 items-start md:items-end justify-between">
           <div>
             <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
               {user?.role === 'ortu' ? 'Keuangan Anak' : 'Keuangan Siswa'}
             </h1>
             <p className="text-blue-100 font-medium text-sm sm:text-base max-w-sm sm:max-w-md">
               {user?.role === 'ortu' ? `Informasi pembayaran dan tagihan anak Anda${siswaInfo ? ` (${siswaInfo.fullName})` : ''}` : 'Informasi pembayaran dan tagihan'}
             </p>
           </div>
           {siswaInfo && (
             <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 flex gap-4 min-w-[250px]">
               <div>
                 <div className="text-sm font-medium text-blue-100 mb-1">Total Tunggakan</div>
                 <div className="text-xl font-bold text-white">
                   Rp {formatCurrency(tunggakanList.reduce((acc, curr) => acc + curr.nominalTagihan, 0))}
                 </div>
               </div>
             </div>
           )}
         </div>
      </div>
      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl overflow-x-auto no-scrollbar max-w-fit">
         <button 
           onClick={() => setActiveTab('lunas')}
           className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${activeTab === 'lunas' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}
         >
           <CheckCircle className="w-4 h-4" />
           Pembayaran Lunas
         </button>
         <button 
           onClick={() => setActiveTab('cicilan')}
           className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${activeTab === 'cicilan' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}
         >
           <Clock className="w-4 h-4" />
           Riwayat Cicilan
         </button>
         <button 
           onClick={() => setActiveTab('tunggakan')}
           className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${activeTab === 'tunggakan' ? 'bg-white dark:bg-slate-900 text-red-600 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}
         >
           <AlertTriangle className="w-4 h-4" />
           Belum Dibayarkan
         </button>
      </div>
      {/* Content Lists */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
        
        {/* TAB: LUNAS */}
        {activeTab === 'lunas' && (
          <div className="space-y-4">
            {lunasList.length > 0 ? lunasList.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 hover:border-blue-100 dark:hover:border-blue-900/30 transition-colors gap-4">
                <div className="flex items-start gap-4">
                  <div className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 p-3 rounded-xl">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">{item.jenis} {item.bulan ? `(${item.bulan})` : ''}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm mt-1 text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> {item.tanggal} {item.waktu}</span>
                      <span className="flex items-center gap-1"><FileText className="w-4 h-4"/> {item.kode}</span>
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-sm font-medium text-slate-500 mb-1">Nominal Dibayar</div>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">Rp {formatCurrency(item.nominalDibayar)}</div>
                  <div className="text-xs text-slate-400 uppercase mt-1 tracking-wider font-semibold">{item.metode}</div>
                </div>
              </div>
            )) : (
              <div className="text-center py-16">
                <CheckCircle className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Belum ada riwayat lunas</h3>
                <p className="text-slate-500 mt-2">Daftar pembayaran yang lunas akan tampil di sini.</p>
              </div>
            )}
          </div>
        )}
        {/* TAB: CICILAN */}
        {activeTab === 'cicilan' && (
          <div className="space-y-4">
             {cicilanList.length > 0 ? cicilanList.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 hover:border-amber-100 dark:hover:border-amber-900/30 transition-colors gap-4">
                <div className="flex items-start gap-4">
                  <div className="bg-amber-100 dark:bg-amber-500/20 text-amber-600 p-3 rounded-xl">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">{item.jenis} {item.bulan ? `(${item.bulan})` : ''} <span className="text-sm font-medium bg-amber-100 dark:bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded-md ml-2">Cicilan ke-{item.cicilanKe || 1}</span></h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm mt-1 text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> {item.tanggal} {item.waktu}</span>
                      <span className="flex items-center gap-1"><FileText className="w-4 h-4"/> {item.kode}</span>
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-sm font-medium text-slate-500 mb-1">Sisa Tagihan: Rp {formatCurrency(item.sisaTagihan || 0)}</div>
                  <div className="text-xl font-bold text-slate-800 dark:text-slate-200">Dibayar: Rp {formatCurrency(item.nominalDibayar)}</div>
                  <div className="text-xs text-slate-400 uppercase mt-1 tracking-wider font-semibold">Terkonfirmasi</div>
                </div>
              </div>
            )) : (
              <div className="text-center py-16">
                <Clock className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Belum ada riwayat cicilan</h3>
                <p className="text-slate-500 mt-2">Daftar pembayaran cicilan akan tampil di sini.</p>
              </div>
            )}
          </div>
        )}
        {/* TAB: TUNGGAKAN */}
        {activeTab === 'tunggakan' && (
          <div className="space-y-4">
             {tunggakanList.length > 0 ? tunggakanList.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 hover:border-red-200 dark:hover:border-red-800/50 transition-colors gap-4">
                <div className="flex items-start gap-4">
                  <div className="bg-red-100 dark:bg-red-500/20 text-red-600 p-3 rounded-xl">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">{item.keterangan}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm mt-1 text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">Peringatan: Belum Lunas</span>
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-sm font-medium text-slate-500 mb-1">Nominal Tagihan</div>
                  <div className="text-xl font-bold text-red-600 dark:text-red-400">Rp {formatCurrency(item.nominalTagihan)}</div>
                </div>
              </div>
            )) : (
              <div className="text-center py-16">
                <CheckCircle className="w-16 h-16 text-emerald-200 dark:text-emerald-700/50 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Bebas Tunggakan!</h3>
                <p className="text-slate-500 mt-2">Kamu tidak memiliki pembayaran sekolah yang menunggak.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
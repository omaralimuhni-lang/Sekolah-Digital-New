import { useState, useEffect } from 'react';
import { Calendar, FileText, CheckCircle, Clock, AlertTriangle, Users } from 'lucide-react';
export function KeuanganSiswaGuru() {
  const [activeTab, setActiveTab] = useState<'semua' | 'lunas' | 'cicilan' | 'tunggakan'>('semua');
  
  const [pembayaranList, setPembayaranList] = useState<any[]>([]);
  const [jenisPembayaran, setJenisPembayaran] = useState<any[]>([]);
  const [dbSiswa, setDbSiswa] = useState<any[]>([]);
  const BULAN_LIST = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  useEffect(() => {
    const loadData = () => {
    // Load payments
    const pbList = JSON.parse(localStorage.getItem('sd_pembayaran_list') || '[]');
    setPembayaranList(pbList);
    
    // Load jenis
    const defaultJenis = [
      { id: '1', name: 'SPP', amount: 250000, isMonthly: true },
      { id: '2', name: 'Uang Gedung', amount: 1500000, isMonthly: false },
      { id: '3', name: 'Seragam', amount: 850000, isMonthly: false },
      { id: '4', name: 'Buku', amount: 350000, isMonthly: false },
      { id: '5', name: 'Daftar Ulang', amount: 500000, isMonthly: false }
    ];
    setJenisPembayaran(JSON.parse(localStorage.getItem('sd_jenis_pembayaran') || 'null') || defaultJenis);
    // Load siswa (for demo we use all siswa, simulating 'wali kelas' by grabbing predefined list)
    const storedSiswa = JSON.parse(localStorage.getItem('sd_db_siswa') || 'null');
    if (storedSiswa && storedSiswa.length > 0) {
        // filter by some simulated class logic or just show all for demo
        setDbSiswa(storedSiswa);
    } else {
        const dummySiswa = [
           { id: 'S1', fullName: 'Ahmad Hanif', class: '10 IPA 1', nisn: '100101', username: 'ahmad' },
           { id: 'S2', fullName: 'Bunga Lestari', class: '10 IPA 1', nisn: '100102', username: 'bunga' },
           { id: 'S3', fullName: 'Candra Dinata', class: '10 IPA 1', nisn: '100203', username: 'candra' },
        ];
        setDbSiswa(dummySiswa);
    }
  };
    loadData();
    window.addEventListener('localStorageUpdate', loadData);
    return () => window.removeEventListener('localStorageUpdate', loadData);
  }, []);
  const formatCurrency = (value: number) => value.toLocaleString('id-ID');
  // We should aggregate for all students in `dbSiswa`
  // Get all payments for all dbSiswa
  const classPayments = pembayaranList.filter(p => {
      return p.siswa && dbSiswa.some(s => s.nisn === p.siswa.nisn || s.id === p.siswa.id || s.fullName === p.siswa.fullName);
  });
  const getSiswaTunggakan = (siswa: any) => {
    const tunggakan: any[] = [];
    const myPayments = classPayments.filter(p => 
      p.siswa?.nisn === siswa.nisn || p.siswa?.id === siswa.id || p.siswa?.fullName === siswa.fullName
    );
    
    jenisPembayaran.forEach(jenis => {
      if (jenis.isMonthly) {
        BULAN_LIST.forEach(bulan => {
          const hasRecord = myPayments.find(p => p.jenis === jenis.name && p.bulan === bulan);
          if (!hasRecord) {
            tunggakan.push({
               siswa,
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
            siswa,
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
  const lunasList = classPayments.filter(p => p.status === 'Lunas');
  const cicilanList = classPayments.filter(p => p.status === 'Belum Lunas' || p.metode === 'Cicil');
  
  let tunggakanList: any[] = [];
  dbSiswa.forEach(siswa => {
      tunggakanList = tunggakanList.concat(getSiswaTunggakan(siswa));
  });
  // Calculate totals
  const totalLunas = lunasList.reduce((acc, curr) => acc + (curr.nominalDibayar || 0), 0);
  const totalCicilanPaid = cicilanList.reduce((acc, curr) => acc + (curr.nominalDibayar || 0), 0);
  const totalTunggakan = tunggakanList.reduce((acc, curr) => acc + curr.nominalTagihan, 0);
  return (
    <div className="max-w-7xl mx-auto pb-24 lg:pb-12 space-y-6 mt-6">
      {/* Header Info */}
      <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl p-6 lg:p-8 shadow-xl shadow-blue-500/20 relative flex flex-col justify-end overflow-hidden mb-6 min-h-[160px] sm:h-48">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
         <div className="absolute bottom-0 right-10 opacity-20 pointer-events-none transform translate-y-1/4 right-0 rotate-[-15deg]">
            <Users className="w-48 h-48 sm:w-64 sm:h-64 text-white" />
         </div>
         
         <div className="relative z-10 w-full flex flex-col xl:flex-row gap-6 items-start xl:items-end justify-between">
           <div>
             <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">Keuangan Perwalian</h1>
             <p className="text-blue-100 font-medium text-sm sm:text-base max-w-sm sm:max-w-md">Pantau detail pembayaran & tunggakan siswa Anda.</p>
           </div>
           
           <div className="flex flex-wrap gap-4">
             <div className="bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/20">
               <div className="text-xs font-medium text-blue-100 mb-1 leading-none uppercase">Total Tunggakan</div>
               <div className="text-lg font-bold text-white">
                 Rp {formatCurrency(totalTunggakan)}
               </div>
             </div>
             <div className="bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/20">
               <div className="text-xs font-medium text-blue-100 mb-1 leading-none uppercase">Pembayaran Masuk</div>
               <div className="text-lg font-bold text-white">
                 Rp {formatCurrency(totalLunas + totalCicilanPaid)}
               </div>
             </div>
           </div>
         </div>
      </div>
      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl overflow-x-auto no-scrollbar max-w-fit">
         <button 
           onClick={() => setActiveTab('semua')}
           className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${activeTab === 'semua' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}
         >
           <FileText className="w-4 h-4" />
           Ringkasan
         </button>
         <button 
           onClick={() => setActiveTab('lunas')}
           className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${activeTab === 'lunas' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}
         >
           <CheckCircle className="w-4 h-4" />
           Lunas ({lunasList.length})
         </button>
         <button 
           onClick={() => setActiveTab('cicilan')}
           className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${activeTab === 'cicilan' ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}
         >
           <Clock className="w-4 h-4" />
           Cicilan ({cicilanList.length})
         </button>
         <button 
           onClick={() => setActiveTab('tunggakan')}
           className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${activeTab === 'tunggakan' ? 'bg-white dark:bg-slate-900 text-red-600 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}
         >
           <AlertTriangle className="w-4 h-4" />
           Tunggakan ({tunggakanList.length})
         </button>
      </div>
      {/* Content */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
        
        {/* TAB: SEMUA (Ringkasan per siswa) */}
        {activeTab === 'semua' && (
          <div className="space-y-4">
             {dbSiswa.map((siswa, idx) => {
                const sLunas = lunasList.filter(p => p.siswa?.id === siswa.id || p.siswa?.fullName === siswa.fullName);
                const sCicilan = cicilanList.filter(p => p.siswa?.id === siswa.id || p.siswa?.fullName === siswa.fullName);
                const sTunggakan = getSiswaTunggakan(siswa);
                const sTotalLunas = sLunas.reduce((acc, curr) => acc + (curr.nominalDibayar || 0), 0);
                const sTotalCicilan = sCicilan.reduce((acc, curr) => acc + (curr.nominalDibayar || 0), 0);
                const sTotalTunggakanVal = sTunggakan.reduce((acc, curr) => acc + curr.nominalTagihan, 0);
                return (
                 <div key={idx} className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                        <div>
                           <h3 className="font-bold text-lg text-slate-800 dark:text-white">{siswa.fullName}</h3>
                           <div className="text-sm text-slate-500">{siswa.nisn} • {siswa.class}</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                           <div className="text-xs text-slate-500 mb-1">Total Lunas</div>
                           <div className="font-semibold text-emerald-600">Rp {formatCurrency(sTotalLunas)}</div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30">
                           <div className="text-xs text-slate-500 mb-1">Total Cicilan (Dibayar)</div>
                           <div className="font-semibold text-amber-600">Rp {formatCurrency(sTotalCicilan)}</div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
                           <div className="text-xs text-slate-500 mb-1">Tunggakan Belum Lunas</div>
                           <div className="font-semibold text-red-600">Rp {formatCurrency(sTotalTunggakanVal)} ({sTunggakan.length} item)</div>
                        </div>
                    </div>
                 </div>
                );
             })}
          </div>
        )}
        {/* TAB: LUNAS */}
        {activeTab === 'lunas' && (
          <div className="space-y-4">
            {lunasList.length > 0 ? lunasList.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 hover:border-emerald-100 dark:hover:border-emerald-900/30 transition-colors gap-4">
                <div className="flex items-start gap-4">
                  <div className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 p-3 rounded-xl">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">{item.siswa?.fullName} - {item.jenis} {item.bulan ? `(${item.bulan})` : ''}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm mt-1 text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> {item.tanggal}</span>
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
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Tidak ada data</h3>
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
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">{item.siswa?.fullName} - {item.jenis} {item.bulan ? `(${item.bulan})` : ''}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm mt-1 text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">Cicilan ke-{item.cicilanKe || 1}</span>
                      <span className="flex items-center gap-1">•</span>
                      <span className="flex items-center gap-1">{item.tanggal}</span>
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-sm font-medium text-amber-600 mb-1">Sisa Tagihan: Rp {formatCurrency(item.sisaTagihan || 0)}</div>
                  <div className="text-lg font-bold text-slate-800 dark:text-slate-200">Dibayar: Rp {formatCurrency(item.nominalDibayar)}</div>
                </div>
              </div>
            )) : (
              <div className="text-center py-16">
                <Clock className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Tidak ada data cicilan</h3>
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
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">{item.siswa?.fullName}</h3>
                    <div className="text-slate-700 dark:text-slate-300 font-medium mt-1">{item.keterangan}</div>
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
                <p className="text-slate-500 mt-2">Seluruh siswa wali kelas Anda sudah melunasi pembayaran.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
import { StrukHeader, applyPdfKop } from '../../utils/kopHelper';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, ChevronLeft, Calendar, User, Clock, FileText, FileSpreadsheet, Filter, Eye, Edit2, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas-pro';
import { useAppContext } from '../../AppContext';
import { triggerNotificationUpdate } from '../../lib/eventBus';
import { useIsMobile } from '../../App';
import { MobileBottomSheet } from '../../components/ui/MobileBottomSheet';
import { RpIcon } from '../../components/ui/RpIcon';
import { recordLog } from '../../utils/logHelper';
export function InputTopUpKoin() {
  const { user, showNotification } = useAppContext();
  const isMobile = useIsMobile();
  const [topUpList, setTopUpList] = useState<any[]>([]);
  const [siswaList, setSiswaList] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewData, setViewData] = useState<any>(null);
  const [saveSuccessData, setSaveSuccessData] = useState<any>(null);
  
  // States finding student
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSiswa, setSelectedSiswa] = useState<any | null>(null);
  // Form states
  const [editId, setEditId] = useState<string | null>(null);
  const [tanggal, setTanggal] = useState('');
  const [waktu, setWaktu] = useState('');
  const [kodeTopUp, setKodeTopUp] = useState('');
  const [nominalTopUp, setNominalTopUp] = useState(0);
  const [rawNominal, setRawNominal] = useState('');
  const [koinSebelum, setKoinSebelum] = useState(0);
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const formatCurrency = (value: number) => value.toLocaleString('id-ID');
  const parseCurrency = (value: string) => parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
  const getSiswaName = (s: any) => s?.fullName || s?.nama_lengkap || s?.username || 'Unknown';
  const getSiswaClass = (s: any) => {
     if (s?.role) return s.role;
     if (s?.userRole) return s.userRole;
     return s?.class || s?.kelas || '-';
  };
  const getSiswaNis = (s: any) => s?.nisn || s?.nis || s?.nik || s?.nuptk || s?.id || '-';
  useEffect(() => {
    const loadData = () => {
    // Load local storage lists
    const tList = JSON.parse(localStorage.getItem('sd_topup_koin_list') || '[]');
    setTopUpList(tList);
    
    // Load user databases
    let allUsers: any[] = [];
    const siswaList = JSON.parse(localStorage.getItem('sd_db_siswa') || '[]');
    const guruList = JSON.parse(localStorage.getItem('sd_db_guru') || '[]');
    const tendikList = JSON.parse(localStorage.getItem('sd_db_tenaga_pendidik') || '[]');
    const ortuList = JSON.parse(localStorage.getItem('sd_db_ortu') || '[]');
    
    if (siswaList.length > 0) allUsers = [...allUsers, ...siswaList.map((s: any) => ({...s, userRole: 'Siswa'}))];
    else allUsers.push(
        { id: 'S1', fullName: 'Ahmad Hanif', class: '10 IPA 1', nisn: '100101', userRole: 'Siswa' },
        { id: 'S2', fullName: 'Bunga Lestari', class: '10 IPS 2', nisn: '100102', userRole: 'Siswa' },
        { id: 'S3', fullName: 'Candra Dinata', class: '11 IPA 1', nisn: '100203', userRole: 'Siswa' }
    );
    if (guruList.length > 0) allUsers = [...allUsers, ...guruList.map((g: any) => ({...g, userRole: 'Guru'}))];
    if (tendikList.length > 0) allUsers = [...allUsers, ...tendikList.map((t: any) => ({...t, userRole: 'Tendik'}))];
    if (ortuList.length > 0) allUsers = [...allUsers, ...ortuList.map((o: any) => ({...o, userRole: 'Orang Tua'}))];
    setSiswaList(allUsers);
  };
    loadData();
    window.addEventListener('localStorageUpdate', loadData);
    return () => window.removeEventListener('localStorageUpdate', loadData);
  }, []);
  // Calculate user current coins
  useEffect(() => {
    if (selectedSiswa) {
      const sNis = getSiswaNis(selectedSiswa);
      // We sum all approved topups for this user.
      const userTopUps = topUpList.filter(t => t.siswa && getSiswaNis(t.siswa) === sNis);
      const total = userTopUps.reduce((acc, curr) => {
        // Skip current edit if we are editing so before balance doesn't include it
        if (editId && curr.id === editId) return acc;
        return acc + curr.nominal;
      }, 0);
      setKoinSebelum(total);
    } else {
      setKoinSebelum(0);
    }
  }, [selectedSiswa, topUpList, editId]);
  // Update real-time clock when modal is open and not editing
  useEffect(() => {
    if (isModalOpen && !editId) {
      const updateTime = () => {
        const ts = new Date();
        setTanggal(ts.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }));
        setWaktu(ts.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
      };
      updateTime();
      const timer = setInterval(updateTime, 60000);
      return () => clearInterval(timer);
    }
  }, [isModalOpen, editId]);
  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const parsed = parseCurrency(raw);
    const validParsed = Math.max(0, parsed);
    setRawNominal(validParsed === 0 ? '' : formatCurrency(validParsed));
    setNominalTopUp(validParsed);
  };
  const generateKode = () => {
    const num = Math.floor(Math.random() * 90000) + 10000;
    const date = new Date();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = String(date.getFullYear()).substr(-2);
    return `TU-${mm}${yy}-${num}`;
  };
  const openTambah = () => {
    setEditId(null);
    setKodeTopUp(generateKode());
    setSelectedSiswa(null);
    setSearchQuery('');
    setNominalTopUp(0);
    setRawNominal('');
    setIsModalOpen(true);
    setShowConfirm(false);
    setSaveSuccessData(null);
  };
  const openEdit = (t: any) => {
    setEditId(t.id);
    setKodeTopUp(t.kode);
    setSelectedSiswa(t.siswa);
    setSearchQuery(getSiswaName(t.siswa));
    setNominalTopUp(t.nominal);
    setRawNominal(formatCurrency(t.nominal));
    setTanggal(t.tanggal);
    setWaktu(t.waktu);
    setIsModalOpen(true);
    setShowConfirm(false);
    setSaveSuccessData(null);
  };
  
  const openView = (t: any) => {
    setViewData(t);
    setIsViewModalOpen(true);
  };
  const handleDelete = (id: string) => {
    if(confirm("Apakah Anda yakin ingin menghapus data ini?")) {
       const deletedItem = topUpList.find(t => t.id === id);
       const updated = topUpList.filter(t => t.id !== id);
       setTopUpList(updated);
       localStorage.setItem('sd_topup_koin_list', JSON.stringify(updated));
       if (user && deletedItem) {
          recordLog(user, 'DELETE', 'Top Up Koin', `Menghapus transaksi top up ${deletedItem.kode} untuk siswa ${getSiswaName(deletedItem.siswa)}`);
       }
    }
  };
  const filteredStudents = siswaList.filter(s => {
    if (!searchQuery) return false;
    const q = searchQuery.toLowerCase();
    return getSiswaName(s).toLowerCase().includes(q) || 
           getSiswaClass(s).toLowerCase().includes(q) || 
           getSiswaNis(s).toLowerCase().includes(q);
  }).slice(0, 5);
  const handleSimpan = () => {
    if (!selectedSiswa || nominalTopUp <= 0) {
      alert("Harap lengkapi data siswa dan nominal top up.");
      setShowConfirm(false);
      return;
    }
    let updatedList;
    let savedRecord;
    if (editId) {
       updatedList = topUpList.map(t => {
         if (t.id === editId) {
           savedRecord = {
             ...t,
             siswa: selectedSiswa,
             nominal: nominalTopUp,
           };
           return savedRecord;
         }
         return t;
       });
       if (user && savedRecord) {
          recordLog(user, 'UPDATE', 'Top Up Koin', `Memperbarui transaksi top up ${savedRecord.kode} untuk siswa ${getSiswaName(selectedSiswa)} dengan nominal Rp ${formatCurrency(nominalTopUp)}`);
       }
    } else {
      const newRecord = {
        id: new Date().getTime().toString(),
        kode: kodeTopUp,
        tanggal: tanggal,
        waktu: waktu,
        petugas: user?.name || 'Admin',
        siswa: selectedSiswa,
        koinSebelum: koinSebelum,
        nominal: nominalTopUp,
        koinSesudah: koinSebelum + nominalTopUp,
      };
      savedRecord = newRecord;
      updatedList = [newRecord, ...topUpList];
      if (user) {
         recordLog(user, 'CREATE', 'Top Up Koin', `Mencatat top up baru ${newRecord.kode} untuk siswa ${getSiswaName(selectedSiswa)} dengan nominal Rp ${formatCurrency(nominalTopUp)}`);
      }
    }
    
    setTopUpList(updatedList);
    localStorage.setItem('sd_topup_koin_list', JSON.stringify(updatedList));
    if (!editId) {
      triggerNotificationUpdate(['Laporan Top Up Koin', 'Laporan Keuangan']);
    }
    setShowConfirm(false);
    showNotification(editId ? "Data top up koin berhasil diperbarui!" : "Data top up koin berhasil disimpan!");
    setSaveSuccessData(savedRecord);
  };
  const filteredHistory = topUpList.filter(t => {
    const matchSearch = historySearchQuery === '' || 
      getSiswaName(t.siswa)?.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
      t.kode?.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
      getSiswaNis(t.siswa)?.toLowerCase().includes(historySearchQuery.toLowerCase());
    return matchSearch;
  });
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const startY = applyPdfKop(doc);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Laporan", 14, startY + 5);
    doc.setFontSize(16);
    doc.text('Laporan Top Up Koin Siswa', 14, 15);
    
    const tableColumn = ["Tanggal", "Kode", "Nama Siswa", "Kelas", "Koin (Rp)", "Petugas"];
    const tableRows: any[] = [];
    
    filteredHistory.forEach(t => {
      const tData = [
        `${t.tanggal} ${t.waktu}`,
        t.kode,
        getSiswaName(t.siswa),
        getSiswaClass(t.siswa),
        formatCurrency(t.nominal),
        t.petugas
      ];
      tableRows.push(tData);
    });
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
    });
    
    doc.save(`Laporan_Top_Up_${new Date().getTime()}.pdf`);
  };
  const handleExportExcel = () => {
    const exportData = filteredHistory.map(t => ({
      "Tanggal": t.tanggal,
      "Waktu": t.waktu,
      "Kode Transaksi": t.kode,
      "Nama Siswa": getSiswaName(t.siswa),
      "NIS/NISN": getSiswaNis(t.siswa),
      "Kelas": getSiswaClass(t.siswa),
      "Koin Sebelum": t.koinSebelum,
      "Nominal Top Up": t.nominal,
      "Total Koin": t.koinSesudah,
      "Petugas": t.petugas
    }));
    import('../../utils/kopHelper').then(({ exportToExcel }) => {
      exportToExcel(exportData, "Data_Top_Up", "TOPUP");

    });
  };
  const renderFormContent = () => (
    <div className="space-y-6 pb-20 sm:pb-6 relative">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Waktu Pencatatan</label>
          <div className="flex flex-col gap-1">
             <div className="font-medium text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
               <Calendar className="w-4 h-4 text-indigo-500" /> {tanggal}
             </div>
             <div className="font-medium text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
               <Clock className="w-4 h-4 text-indigo-500" /> {waktu}
             </div>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Kode Top Up</label>
          <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-lg w-fit shadow-sm">
            {kodeTopUp}
          </div>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-2">
           <User className="w-4 h-4 text-slate-400" /> Pilih Siswa
        </label>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Cari Nama, Kelas, atau NIS/NISN..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedSiswa(null);
            }}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-sm dark:text-white"
          />
          {searchQuery && !selectedSiswa && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-[60] max-h-64 overflow-y-auto">
              {filteredStudents.length > 0 ? filteredStudents.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => {
                    setSelectedSiswa(s);
                    setSearchQuery(getSiswaName(s));
                  }}
                  className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                >
                  <div className="font-bold text-slate-800 dark:text-white">{getSiswaName(s)}</div>
                  <div className="text-xs text-slate-500 mt-1 flex gap-3">
                    <span>Kelas: {getSiswaClass(s)}</span>
                    <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1.5 rounded">{getSiswaNis(s)}</span>
                  </div>
                </div>
              )) : (
                <div className="px-4 py-6 text-center text-slate-500 text-sm">
                  Siswa tidak ditemukan.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {selectedSiswa && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="bg-amber-50 dark:bg-amber-500/10 p-4 border border-amber-100 dark:border-amber-500/20 rounded-xl">
                <label className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-1">
                  Koin Awal
                </label>
                <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                  Rp {koinSebelum.toLocaleString('id-ID')}
                </div>
             </div>
             
             <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-2">
                   <RpIcon className="w-4 h-4 text-emerald-500" /> Nominal Pembelian
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-slate-500">Rp</span>
                  <input 
                    type="text"
                    value={rawNominal}
                    onChange={handleNominalChange}
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border text-lg font-bold text-emerald-600 dark:text-emerald-400 border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    placeholder="0"
                  />
                </div>
             </div>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-500/10 p-5 border border-indigo-100 dark:border-indigo-500/20 rounded-xl">
             <h4 className="font-bold text-indigo-800 dark:text-indigo-400 border-b border-indigo-200 dark:border-indigo-500/30 pb-2 mb-3 flex items-center gap-2">
               <RpIcon className="w-5 h-5" /> Review Top Up Koin
             </h4>
             <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Siswa:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{getSiswaName(selectedSiswa)} ({getSiswaClass(selectedSiswa)})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Petugas:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.name}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 dark:text-slate-400">Koin Sebelum:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Rp {koinSebelum.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Top Up:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">+ Rp {nominalTopUp.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center border-t border-indigo-200 dark:border-indigo-500/30 pt-3 mt-3">
                  <span className="font-bold text-slate-800 dark:text-white">Total Koin Akhir:</span>
                  <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">Rp {(koinSebelum + nominalTopUp).toLocaleString('id-ID')}</span>
                </div>
             </div>
          </div>
          
          {/* Riwayat Mini */}
          <div className="mt-4">
            <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm mb-3">3 Riwayat Top Up Terakhir</h4>
            <div className="space-y-2">
              {topUpList.filter(t => t.siswa && getSiswaNis(t.siswa) === getSiswaNis(selectedSiswa)).slice(0, 3).map(r => (
                 <div key={r.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg">
                    <div>
                       <div className="font-semibold text-emerald-600 dark:text-emerald-400">+ Rp {r.nominal.toLocaleString('id-ID')}</div>
                       <div className="text-xs text-slate-500 mt-0.5">{r.tanggal} {r.waktu}</div>
                    </div>
                    <div className="text-xs font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-500">{r.kode}</div>
                 </div>
              ))}
              {topUpList.filter(t => t.siswa && getSiswaNis(t.siswa) === getSiswaNis(selectedSiswa)).length === 0 && (
                <div className="text-center text-slate-400 text-xs py-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">Belum ada riwayat top up</div>
              )}
            </div>
          </div>
        </>
      )}
      {showConfirm && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-4 rounded-xl flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="bg-amber-100 dark:bg-amber-500/20 p-2 rounded-full mt-0.5 shrink-0">
            <Filter className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h4 className="font-bold text-amber-800 dark:text-amber-400 mb-1">Konfirmasi Top Up</h4>
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">Pastikan nominal dan data siswa sudah benar. Saldo koin akan otomatis ditambahkan ke akun siswa.</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-bold active:scale-95 transition-all">Koreksi</button>
              <button onClick={handleSimpan} className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all">Simpan</button>
            </div>
          </div>
        </div>
      )}
      {!showConfirm && (
         <div className="py-4">
           <button 
             onClick={() => setShowConfirm(true)} 
             disabled={!selectedSiswa || nominalTopUp <= 0}
             className="w-full flex justify-center items-center gap-2 bg-[#F59E0B] disabled:bg-slate-300 disabled:dark:bg-slate-700 disabled:cursor-not-allowed text-white px-5 py-4 rounded-xl font-bold transition-all shadow-lg shadow-[#F59E0B]/30 active:scale-95 text-lg"
           >
             <Plus className="w-5 h-5" /> Simpan Top Up
           </button>
         </div>
      )}
    </div>
  );
  const handleDownloadTopUpJPG = async () => {
    const el = document.getElementById('receipt-topup');
    if (el) {
      const canvas = await html2canvas(el, { scale: 2 });
      const data = canvas.toDataURL('image/jpeg');
      const link = document.createElement('a');
      link.href = data;
      link.download = `Struk_TopUp_${saveSuccessData?.kode}.jpg`;
      link.click();
    }
  };
  const handleDownloadTopUpPDF = () => {
    const doc = new jsPDF();
    const startY = applyPdfKop(doc);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Laporan", 14, startY + 5);
    doc.setFontSize(16);
    doc.text('Bukti Top Up Koin', 14, 15);
    
    doc.setFontSize(12);
    doc.text(`Kode: ${saveSuccessData?.kode}`, 14, 25);
    doc.text(`Tanggal: ${saveSuccessData?.tanggal} ${saveSuccessData?.waktu}`, 14, 32);
    doc.text(`Siswa: ${getSiswaName(saveSuccessData?.siswa)}`, 14, 39);
    doc.text(`Nominal Top Up: Rp ${saveSuccessData?.nominal.toLocaleString('id-ID')}`, 14, 46);
    doc.text(`Koin Masuk: ${saveSuccessData?.nominal.toLocaleString('id-ID')} Koin`, 14, 53);
    doc.text(`Koin Akhir: ${saveSuccessData?.koinSesudah?.toLocaleString('id-ID')} Koin`, 14, 60);
    
    doc.save(`Bukti_TopUp_${saveSuccessData?.kode}.pdf`);
  };
  const renderSuccessContent = () => (
    <div className="flex flex-col items-center justify-center py-6">
       <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mb-4">
         <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
       </div>
       <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Top Up Berhasil!</h3>
       <p className="text-slate-500 text-center mb-6 text-sm">Koin telah berhasil ditambahkan ke saldo siswa.</p>
       
       <div id="receipt-topup" className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
         <StrukHeader title="STRUK TOP UP KOIN" />
         <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
           <div className="flex justify-between"><span>Kode:</span> <strong>{saveSuccessData?.kode}</strong></div>
           <div className="flex justify-between"><span>Tanggal:</span> <span>{saveSuccessData?.tanggal} {saveSuccessData?.waktu}</span></div>
           <div className="flex justify-between"><span>Siswa:</span> <span>{getSiswaName(saveSuccessData?.siswa)}</span></div>
           <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-amber-600 dark:text-amber-400">
             <span>Top Up:</span> <span>Rp {saveSuccessData?.nominal?.toLocaleString('id-ID')}</span>
           </div>
           <div className="flex justify-between text-xs text-slate-500 font-mono mt-1">
             <span>Koin Akhir:</span> <span>{saveSuccessData?.koinSesudah?.toLocaleString('id-ID')}</span>
           </div>
         </div>
       </div>
       <div className="flex gap-3 w-full max-w-sm">
         <button onClick={handleDownloadTopUpJPG} className="flex-1 flex items-center justify-center gap-2 bg-amber-50 text-amber-600 dark:bg-amber-500/10 hover:bg-amber-100 py-3 rounded-xl font-bold transition-colors">
           Download Struk JPG
         </button>
         <button onClick={handleDownloadTopUpPDF} className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 hover:bg-indigo-100 py-3 rounded-xl font-bold transition-colors">
           Download Bukti PDF
         </button>
       </div>
       <button onClick={() => { setIsModalOpen(false); setSaveSuccessData(null); }} className="mt-4 text-slate-500 border border-slate-200 dark:border-slate-700 px-6 py-2 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
         Tutup
       </button>
    </div>
  );
  const renderModal = () => {
    if (!isModalOpen) return null;
    const content = (
      <div className="p-4 sm:p-6 pb-24 sm:pb-6">
        {saveSuccessData ? renderSuccessContent() : renderFormContent()}
      </div>
    );
    if (isMobile) {
      return (
        <MobileBottomSheet isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setShowConfirm(false); }} title={editId ? "Edit Top Up Koin" : "Catat Top Up Baru"}>
          {content}
        </MobileBottomSheet>
      );
    }
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setIsModalOpen(false); setShowConfirm(false); }} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[24px] shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl z-10">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{editId ? "Edit Top Up Koin" : "Catat Top Up Baru"}</h2>
            <button onClick={() => { setIsModalOpen(false); setShowConfirm(false); }} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
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
    if (!isViewModalOpen || !viewData) return null;
    const content = (
      <div className="p-4 sm:p-6 pb-24 sm:pb-6 space-y-4">
         <div className="flex flex-col items-center justify-center py-4 text-center">
             <div className="font-mono text-sm text-slate-500 dark:text-slate-400 mb-2">{viewData.kode}</div>
             <div className="font-extrabold text-3xl text-amber-600 dark:text-amber-400">Rp {viewData.nominal.toLocaleString('id-ID')}</div>
             <div className="mt-2 text-sm text-slate-600 dark:text-slate-300 font-medium">{viewData.tanggal} • {viewData.waktu}</div>
         </div>
         
         <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50 space-y-3">
             <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                 <span className="text-slate-500 text-sm">Nama Siswa</span>
                 <span className="font-bold text-slate-800 dark:text-white">{getSiswaName(viewData.siswa)}</span>
             </div>
             <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                 <span className="text-slate-500 text-sm">NIS/NISN</span>
                 <span className="font-bold text-slate-800 dark:text-white font-mono">{getSiswaNis(viewData.siswa)}</span>
             </div>
             <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                 <span className="text-slate-500 text-sm">Kelas</span>
                 <span className="font-bold text-slate-800 dark:text-white">{getSiswaClass(viewData.siswa)}</span>
             </div>
             <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                 <span className="text-slate-500 text-sm">Koin Awal</span>
                 <span className="font-bold text-slate-800 dark:text-white">Rp {viewData.koinSebelum?.toLocaleString('id-ID') || 0}</span>
             </div>
             <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                 <span className="text-slate-500 text-sm">Total Koin Akhir</span>
                 <span className="font-bold text-indigo-600 dark:text-indigo-400">Rp {(viewData.koinSesudah || viewData.nominal).toLocaleString('id-ID')}</span>
             </div>
             <div className="flex justify-between items-center">
                 <span className="text-slate-500 text-sm">Petugas</span>
                 <span className="font-bold text-slate-800 dark:text-white">{viewData.petugas}</span>
             </div>
         </div>
      </div>
    );
    if (isMobile) {
      return (
        <MobileBottomSheet isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detail Transaksi Top Up">
          {content}
        </MobileBottomSheet>
      );
    }
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[24px] shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl z-10">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Detail Transaksi</h2>
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[100vw] overflow-x-hidden pt-safe pb-32">
      <div className="flex flex-col gap-8 w-full">
        {/* Banner */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl shadow-amber-500/20 relative overflow-hidden h-40 sm:h-48 flex flex-col justify-end">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
           <div className="absolute bottom-0 right-10 opacity-20 pointer-events-none transform translate-y-1/4 right-0 rotate-[-15deg]">
              <RpIcon className="w-48 h-48 sm:w-64 sm:h-64" />
           </div>
           
           <div className="relative z-10">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">Input Top Up Koin</h1>
              <p className="text-amber-100 font-medium text-sm sm:text-base max-w-sm sm:max-w-md">Catat dan kelola saldo koin siswa secara digital.</p>
           </div>
        </div>
        {/* Header Options */}
        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={openTambah}
            className="flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-amber-500 to-orange-600 p-5 rounded-[20px] text-white shadow-xl shadow-amber-500/20 active:scale-95 transition-all text-center border-b-4 border-amber-700/50 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm relative z-10">
              <Plus className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-lg tracking-wide relative z-10">Catat Top Up Baru</span>
          </button>
        </div>
        {/* Filter and Export */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-2 self-start lg:self-auto text-slate-800 dark:text-white font-bold text-lg">
              <Filter className="w-5 h-5 text-indigo-500" /> Filter & Unduh
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <button 
                onClick={handleExportPDF}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-4 py-2.5 rounded-xl font-bold transition-colors text-sm"
              >
                <FileText className="w-4 h-4" /> PDF
              </button>
              <button 
                onClick={handleExportExcel}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 px-4 py-2.5 rounded-xl font-bold transition-colors text-sm"
              >
                <FileSpreadsheet className="w-4 h-4" /> Excel
              </button>
            </div>
          </div>
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Cari nama, nis atau kode transaksi..."
              value={historySearchQuery}
              onChange={(e) => setHistorySearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-sm dark:text-white"
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Riwayat Top Up Siswa
          </h2>
          <span className="text-sm font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            {filteredHistory.length} Transaksi
          </span>
        </div>
        {/* Transaction Lists */}
        <div className="space-y-4">
          {filteredHistory.length > 0 ? filteredHistory.map((t) => (
            <div key={t.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex items-start gap-4 w-full sm:w-auto">
                <div className="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 p-3 rounded-xl mt-1 shrink-0">
                  <RpIcon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                     <h3 className="font-bold text-slate-800 dark:text-slate-100 text-[17px] leading-tight line-clamp-1 mr-2">{getSiswaName(t.siswa)}</h3>
                     <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md font-mono text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">{t.kode}</span>
                  </div>
                  <div className="flex flex-wrap items-center text-xs font-medium text-slate-500 dark:text-slate-400 gap-2 mb-2 w-full">
                    <span className="whitespace-nowrap font-mono bg-slate-50 dark:bg-slate-700/50 px-1 rounded">{getSiswaNis(t.siswa)}</span>
                    <span>•</span>
                    <span className="truncate">{getSiswaClass(t.siswa)}</span>
                    <span>•</span>
                    <span className="whitespace-nowrap">{t.tanggal}</span>
                  </div>
                  <div className="font-extrabold text-lg sm:text-xl text-amber-600 dark:text-amber-400 mb-3">
                    + Rp {t.nominal.toLocaleString('id-ID')}
                  </div>
                  
                  {/* Action buttons embedded in mobile layout */}
                  <div className="flex sm:hidden items-center justify-start gap-2 w-full pt-1">
                     <button onClick={() => openView(t)} className="flex items-center justify-center h-9 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs ring-1 ring-indigo-100 dark:ring-indigo-500/20 active:scale-95 transition-all w-fit">
                       <Eye className="w-3.5 h-3.5 mr-1.5" /> Lihat
                     </button>
                     <button onClick={() => openEdit(t)} className="flex items-center justify-center h-9 px-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs ring-1 ring-amber-100 dark:ring-amber-500/20 active:scale-95 transition-all w-fit">
                       <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
                     </button>
                     <button onClick={() => handleDelete(t.id)} className="flex items-center justify-center h-9 px-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-xs ring-1 ring-red-100 dark:ring-red-500/20 active:scale-95 transition-all w-fit">
                       <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Hapus
                     </button>
                  </div>
                </div>
              </div>
              
              {/* Desktop action buttons */}
              <div className="hidden sm:flex flex-col items-end shrink-0 gap-2">
                 <div className="flex items-center justify-end gap-2 w-full">
                   <button onClick={() => openView(t)} className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all">
                     <Eye className="w-4 h-4" />
                   </button>
                   <button onClick={() => openEdit(t)} className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all">
                     <Edit2 className="w-4 h-4" />
                   </button>
                   <button onClick={() => handleDelete(t.id)} className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all">
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
              </div>
            </div>
          )) : (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
              <RpIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Belum ada top up</h3>
              <p className="text-slate-500 max-w-sm mx-auto">Catat top up koin siswa disini untuk mulai menambah saldo mereka.</p>
            </div>
          )}
        </div>
      </div>
      {renderModal()}
      {renderViewModal()}
    </div>
  );
}
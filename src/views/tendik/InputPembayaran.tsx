import { StrukHeader, applyPdfKop } from '../../utils/kopHelper';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, ChevronLeft, Calendar, User, Clock, AlertTriangle, FileText, FileSpreadsheet, Filter } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas-pro';
import { useAppContext } from '../../AppContext';
import { triggerNotificationUpdate } from '../../lib/eventBus';
import { useIsMobile } from '../../App';
import { MobileBottomSheet } from '../../components/ui/MobileBottomSheet';
import { RpIcon } from '../../components/ui/RpIcon';
import { recordLog } from '../../utils/logHelper';
import { useFormValidation } from '../../hooks/useFormValidation';
const BULAN_LIST = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
// Removed JENIS_PEMBAYARAN hardcode
export function InputPembayaran() {
  const { user, showNotification } = useAppContext();
  const isMobile = useIsMobile();
  const [pembayaranList, setPembayaranList] = useState<any[]>([]);
  const [siswaList, setSiswaList] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveSuccessData, setSaveSuccessData] = useState<any>(null);
  const {} = useFormValidation(
    { 
      jenisPembayaran: '', 
      metodePembayaran: '',
      nominalPembayaran: 0,
      nominalCicilan: 0
    },
    {
      jenisPembayaran: { required: true, message: 'Silakan pilih jenis pembayaran' },
      metodePembayaran: { required: true, message: 'Silakan pilih metode pembayaran' },
      nominalPembayaran: { required: true, min: 1, message: 'Nominal tidak valid' }
    }
  );
  
  // States finding student
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSiswa, setSelectedSiswa] = useState<any | null>(null);
  // Form states
  const [tanggal, setTanggal] = useState('');
  const [waktu, setWaktu] = useState('');
  const [kodePembayaran, setKodePembayaran] = useState('');
  const [jenisPembayaran, setJenisPembayaran] = useState('');
  const [bulanPembayaran, setBulanPembayaran] = useState('');
  const [nominalPembayaran, setNominalPembayaran] = useState(0);
  const [metodePembayaran, setMetodePembayaran] = useState('Cash');
  const [nominalCicilan, setNominalCicilan] = useState(0);
  const [rawNominalCicilan, setRawNominalCicilan] = useState('');
  const [statusPembayaran, setStatusPembayaran] = useState('');
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [cicilanKe, setCicilanKe] = useState(1);
  const [tagihanLunas, setTagihanLunas] = useState(false);
  // Filter and Search for history
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyFilterJenis, setHistoryFilterJenis] = useState('');
  const [historyFilterStatus, setHistoryFilterStatus] = useState('');
  const [JENIS_PEMBAYARAN, set_JENIS_PEMBAYARAN] = useState<any[]>([]);
  const formatCurrency = (value: number) => value.toLocaleString('id-ID');
  const parseCurrency = (value: string) => parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
  const getSiswaName = (s: any) => s?.fullName || s?.nama_lengkap || 'Unknown';
  const getSiswaClass = (s: any) => s?.class || s?.kelas || '-';
  const getSiswaNis = (s: any) => s?.nisn || s?.nis || '-';
  useEffect(() => {
    const loadData = () => {
    // Load local storage lists
    const pbList = JSON.parse(localStorage.getItem('sd_pembayaran_list') || '[]');
    setPembayaranList(pbList);
    
    const defaultJenis = [
      { id: '1', name: 'SPP', amount: 250000, isMonthly: true },
      { id: '2', name: 'Uang Gedung', amount: 1500000, isMonthly: false },
      { id: '3', name: 'Seragam', amount: 850000, isMonthly: false },
      { id: '4', name: 'Buku', amount: 350000, isMonthly: false },
      { id: '5', name: 'Daftar Ulang', amount: 500000, isMonthly: false }
    ];
    const savedJenis = JSON.parse(localStorage.getItem('sd_jenis_pembayaran') || 'null');
    set_JENIS_PEMBAYARAN(savedJenis || defaultJenis);
    // Load student database or fallback dummy
    const slist = JSON.parse(localStorage.getItem('sd_db_siswa') || '[]');
    if (slist.length === 0) {
      setSiswaList([
        { id: 'S1', fullName: 'Ahmad Hanif', class: '10 IPA 1', nisn: '100101' },
        { id: 'S2', fullName: 'Bunga Lestari', class: '10 IPS 2', nisn: '100102' },
        { id: 'S3', fullName: 'Candra Dinata', class: '11 IPA 1', nisn: '100203' },
      ]);
    } else {
      setSiswaList(slist);
    }
  };
    loadData();
    window.addEventListener('localStorageUpdate', loadData);
    return () => window.removeEventListener('localStorageUpdate', loadData);
  }, []);
  // Update real-time clock when modal is open
  useEffect(() => {
    if (isModalOpen) {
      const ts = new Date();
      setTanggal(ts.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }));
      setWaktu(ts.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
      const timer = setInterval(() => {
        const d = new Date();
        setTanggal(d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }));
        setWaktu(d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
      }, 60000);
      return () => clearInterval(timer);
    }
  }, [isModalOpen]);
  // Update tagihan remaining
  useEffect(() => {
    const find = JENIS_PEMBAYARAN.find(j => j.name === jenisPembayaran);
    if (!find) {
      setNominalPembayaran(0);
      setTagihanLunas(false);
      setCicilanKe(1);
      return;
    }
    if (find.isMonthly) {
      setNominalPembayaran(find.amount);
      setTagihanLunas(false); 
      setCicilanKe(1);
      if (!bulanPembayaran) {
        const ts = new Date();
        setBulanPembayaran(BULAN_LIST[ts.getMonth()]);
      }
    } else {
      setBulanPembayaran('');
      if (selectedSiswa) {
        const sNis = getSiswaNis(selectedSiswa);
        const pastRecords = pembayaranList.filter(p => 
          p.jenis === jenisPembayaran && p.siswa && getSiswaNis(p.siswa) === sNis
        );
        let totalPaid = 0;
        pastRecords.forEach(r => totalPaid += r.nominalDibayar);
        
        const remaining = find.amount - totalPaid;
        if (remaining <= 0) {
          setTagihanLunas(true);
          setNominalPembayaran(0);
        } else {
          setTagihanLunas(false);
          setNominalPembayaran(remaining);
        }
        setCicilanKe(pastRecords.length + 1);
      } else {
        setNominalPembayaran(find.amount);
        setTagihanLunas(false);
        setCicilanKe(1);
      }
    }
  }, [jenisPembayaran, selectedSiswa, pembayaranList, bulanPembayaran]);
  // Update status based on method and nominal
  useEffect(() => {
    if (metodePembayaran === 'Cash' || metodePembayaran === 'KJP') {
      setStatusPembayaran('Lunas');
    } else if (metodePembayaran === 'Cicil') {
      if (nominalCicilan >= nominalPembayaran) {
        setStatusPembayaran('Lunas');
      } else {
        setStatusPembayaran('Belum Lunas');
      }
    }
  }, [metodePembayaran, nominalPembayaran, nominalCicilan]);
  const generateKode = (jenis: string) => {
    const rnd = Math.floor(1000 + Math.random() * 9000);
    const prefix = jenis ? jenis.substring(0, 3).toUpperCase() : 'INV';
    return `${prefix}-${new Date().getTime().toString().slice(-4)}${rnd}`;
  };
  const handleJenisChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setJenisPembayaran(v);
    setKodePembayaran(generateKode(v));
    setRawNominalCicilan('');
    setNominalCicilan(0);
  };
  const handleNominalCicilanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const parsed = parseCurrency(raw);
    const validParsed = parsed > nominalPembayaran ? nominalPembayaran : Math.max(0, parsed);
    setRawNominalCicilan(validParsed === 0 ? '' : formatCurrency(validParsed));
    setNominalCicilan(validParsed);
  };
  const openTambah = () => {
    setSearchQuery('');
    setSelectedSiswa(null);
    setJenisPembayaran('');
    setNominalPembayaran(0);
    setMetodePembayaran('Cash');
    setNominalCicilan(0);
    setRawNominalCicilan('');
    setIsModalOpen(true);
    setKodePembayaran(generateKode(''));
    setShowConfirm(false);
    setSaveSuccessData(null);
  };
  const handleSimpan = () => {
    if (jenisPembayaran) {
      const find = JENIS_PEMBAYARAN.find(j => j.name === jenisPembayaran);
      if (find?.isMonthly) {
        const sNis = getSiswaNis(selectedSiswa);
        const dup = pembayaranList.find(p => p.jenis === jenisPembayaran && p.siswa && getSiswaNis(p.siswa) === sNis && p.bulan === bulanPembayaran);
        if (dup) {
          alert(`Siswa ini sudah melakukan pembayaran ${jenisPembayaran} untuk bulan ${bulanPembayaran}.`);
          setShowConfirm(false);
          return;
        }
      }
    }
    if (tagihanLunas && jenisPembayaran) {
      alert("Tagihan ini sudah lunas sebelumnya.");
      setShowConfirm(false);
      return;
    }
    const dibayar = metodePembayaran === 'Cicil' ? nominalCicilan : nominalPembayaran;
    if (dibayar <= 0) {
      alert("Nominal pembayaran harus lebih dari 0.");
      setShowConfirm(false);
      return;
    }
    const newPayment = {
      id: new Date().getTime().toString(),
      tanggal,
      waktu,
      kode: kodePembayaran,
      siswa: selectedSiswa,
      jenis: jenisPembayaran,
      bulan: bulanPembayaran || undefined,
      nominalTotal: JENIS_PEMBAYARAN.find(j => j.name === jenisPembayaran)?.amount || 0,
      nominalTagihanSaatIni: nominalPembayaran,
      nominalDibayar: dibayar,
      metode: metodePembayaran,
      status: statusPembayaran,
      cicilanKe: metodePembayaran === 'Cicil' ? cicilanKe : undefined,
      sisaTagihan: nominalPembayaran - dibayar,
      petugas: user?.name,
    };
    const updated = [newPayment, ...pembayaranList];
    setPembayaranList(updated);
    localStorage.setItem('sd_pembayaran_list', JSON.stringify(updated));
    
    // Gunakan middleware triggerNotificationUpdate
    triggerNotificationUpdate(['Laporan Pembayaran', 'Laporan Keuangan', 'Keuangan Siswa']);
    
    if (user) {
        recordLog(user, 'CREATE', 'Pembayaran', `Mencatat pembayaran ${jenisPembayaran} untuk siswa ${getSiswaName(selectedSiswa)} dengan nominal Rp ${formatCurrency(dibayar)}.`);
    }
    showNotification("Data pembayaran berhasil disimpan!");
    setSaveSuccessData(newPayment);
  };
  const filteredSiswa = siswaList.filter(s => 
    getSiswaName(s).toLowerCase().includes(searchQuery.toLowerCase()) ||
    getSiswaNis(s).toLowerCase().includes(searchQuery.toLowerCase()) ||
    getSiswaClass(s).toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 3); // Max 3 for quick view
  const riwayatSiswa = selectedSiswa ? pembayaranList.filter(p => p.siswa?.id === selectedSiswa.id || getSiswaNis(p.siswa) === getSiswaNis(selectedSiswa)).slice(0, 3) : [];
  const filteredPembayaranList = pembayaranList.filter(p => {
    const matchSearch = historySearchQuery === '' || 
      getSiswaName(p.siswa).toLowerCase().includes(historySearchQuery.toLowerCase()) ||
      p.kode.toLowerCase().includes(historySearchQuery.toLowerCase());
    const matchJenis = historyFilterJenis === '' || p.jenis === historyFilterJenis;
    const matchStatus = historyFilterStatus === '' || p.status === historyFilterStatus;
    
    return matchSearch && matchJenis && matchStatus;
  });
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const startY = applyPdfKop(doc);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Laporan", 14, startY + 5);
    doc.setFontSize(16);
    doc.text('Laporan Pembayaran Siswa', 14, 15);
    
    const tableColumn = ["Tanggal", "Kode", "Nama Siswa", "Jenis", "Metode", "Status", "Nominal (Rp)"];
    const tableRows: any[] = [];
    
    filteredPembayaranList.forEach(p => {
      const pData = [
        p.tanggal,
        p.kode,
        getSiswaName(p.siswa),
        p.jenis + (p.bulan ? ` (${p.bulan})` : ''),
        p.metode,
        p.status,
        formatCurrency(p.nominalDibayar)
      ];
      tableRows.push(pData);
    });
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
    });
    
    doc.save(`Laporan_Pembayaran_${new Date().getTime()}.pdf`);
  };
  const handleExportExcel = () => {
    const wsData = filteredPembayaranList.map(p => ({
      "Tanggal": p.tanggal,
      "Waktu": p.waktu,
      "Kode Pembayaran": p.kode,
      "Nama Siswa": getSiswaName(p.siswa),
      "NIS": getSiswaNis(p.siswa),
      "Kelas": getSiswaClass(p.siswa),
      "Jenis": p.jenis + (p.bulan ? ` (${p.bulan})` : ''),
      "Metode Pembayaran": p.metode,
      "Sisa Tagihan": p.sisaTagihan || 0,
      "Status": p.status,
      "Nominal Dibayar": p.nominalDibayar,
      "Petugas": p.petugas
    }));
    
    import('../../utils/kopHelper').then(({ exportToExcel }) => {
      exportToExcel(wsData, "Laporan_Pembayaran", "PEMBAYARAN");
    });
  };
  const renderFormContent = () => (
    <div className="space-y-6">
      {/* 1. Tanggal Waktu */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl">
          <label className="text-xs text-slate-500 font-semibold mb-1 block">Tanggal</label>
          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /> <span className="text-sm font-medium">{tanggal}</span></div>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl">
           <label className="text-xs text-slate-500 font-semibold mb-1 block">Waktu</label>
           <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /> <span className="text-sm font-medium">{waktu}</span></div>
        </div>
      </div>
      {/* 2. Kode Pembayaran */}
      <div>
        <label className="text-xs font-semibold text-slate-500 mb-2 block">Kode Pembayaran</label>
        <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 font-mono font-medium text-slate-600 dark:text-slate-400">
          {kodePembayaran}
        </div>
      </div>
      {/* 3. Data Siswa */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <label className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 block border-b border-slate-100 dark:border-slate-800 pb-2">Data Siswa</label>
        {selectedSiswa ? (
          <div className="flex justify-between items-center">
            <div>
              <div className="font-bold text-base text-slate-800 dark:text-slate-100">{getSiswaName(selectedSiswa)}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Kelas: {getSiswaClass(selectedSiswa)} | NIS: {getSiswaNis(selectedSiswa)}</div>
            </div>
            <button type="button" onClick={() => setSelectedSiswa(null)} className="text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-500/20 active:scale-95 transition-transform">Ganti</button>
          </div>
        ) : (
          <div>
            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari Nama, NIS, atau Kelas..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            {searchQuery && (
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {filteredSiswa.map(s => (
                  <div key={s.id || getSiswaNis(s)} onClick={() => setSelectedSiswa(s)} className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 cursor-pointer rounded-lg border border-transparent hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-colors">
                    <div className="font-medium text-sm text-slate-800 dark:text-slate-200">{getSiswaName(s)}</div>
                    <div className="text-xs text-slate-500">NIS: {getSiswaNis(s)} • Kelas: {getSiswaClass(s)}</div>
                  </div>
                ))}
                {filteredSiswa.length === 0 && <div className="text-xs text-slate-500 text-center py-2">Tidak ada data ditemukan</div>}
              </div>
            )}
          </div>
        )}
      </div>
      {/* 4. Riwayat Pembayaran Siswa */}
      {selectedSiswa && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-3 block">Riwayat Pembayaran Siswa ({getSiswaName(selectedSiswa).split(' ')[0]})</label>
          <div className="space-y-2">
            {riwayatSiswa.map(r => (
              <div key={r.id} className="flex justify-between items-center text-sm border-b border-slate-200/50 dark:border-slate-700/50 pb-2 last:border-0 last:pb-0">
                <div>
                  <div className="font-semibold">{r.jenis} {r.bulan ? `(${r.bulan})` : ''}</div>
                  <div className="text-xs text-slate-500">{r.tanggal}</div>
                  {r.metode === 'Cicil' && (
                    <div className="text-[10px] bg-slate-200 dark:bg-slate-700 font-semibold px-1.5 py-0.5 rounded mt-1 inline-block">Cicilan ke-{r.cicilanKe}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-semibold text-emerald-600">Rp {r.nominalDibayar.toLocaleString('id-ID')}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">{r.status}</div>
                  {r.metode === 'Cicil' && r.sisaTagihan > 0 && (
                     <div className="text-[10px] text-rose-500 font-bold mt-1">Sisa: Rp {r.sisaTagihan.toLocaleString('id-ID')}</div>
                  )}
                </div>
              </div>
            ))}
            {riwayatSiswa.length === 0 && <div className="text-xs text-slate-500 italic">Belum ada riwayat pembayaran.</div>}
          </div>
        </div>
      )}
      {/* 5, 6, 7, 8, 9 */}
      <div className="space-y-4 pt-2">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Jenis Pembayaran</label>
          <select value={jenisPembayaran} onChange={handleJenisChange} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="">-- Pilih Jenis Pembayaran --</option>
            {JENIS_PEMBAYARAN.map(j => (
              <option key={j.id} value={j.name}>{j.name} (Rp {j.amount.toLocaleString('id-ID')})</option>
            ))}
          </select>
        </div>
        {JENIS_PEMBAYARAN.find(j => j.name === jenisPembayaran)?.isMonthly && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Bulan Pembayaran</label>
            <select value={bulanPembayaran} onChange={(e) => setBulanPembayaran(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none">
              {BULAN_LIST.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        )}
        {jenisPembayaran && (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
            <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block mb-1">Nominal Pembayaran</label>
            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-500">Rp {nominalPembayaran.toLocaleString('id-ID')}</div>
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Metode Pembayaran</label>
          <div className="grid grid-cols-3 gap-2">
            {['Cash', 'KJP', 'Cicil'].map(m => (
              <div 
                key={m} 
                onClick={() => setMetodePembayaran(m)}
                className={`py-2 text-center rounded-lg border text-sm font-semibold cursor-pointer transition-colors ${metodePembayaran === m ? 'bg-indigo-600 border-indigo-600 text-white shadow-MD' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                {m}
              </div>
            ))}
          </div>
        </div>
        {metodePembayaran === 'Cicil' && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Nominal Cicilan Ini</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-slate-500">Rp</span>
              <input 
                type="text" 
                value={rawNominalCicilan}
                onChange={handleNominalCicilanChange}
                className="w-full pl-12 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-semibold"
                placeholder="0"
              />
            </div>
            <div className="text-xs text-rose-500 mt-1.5 font-medium ml-1">Sisa Cicilan setelah ini: Rp {Math.max(0, nominalPembayaran - nominalCicilan).toLocaleString('id-ID')}</div>
          </div>
        )}
        {/* Status follow method */}
        <div className="flex gap-2 items-center">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status:</label>
            <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${statusPembayaran === 'Lunas' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'}`}>
              {statusPembayaran}
            </span>
        </div>
        {/* 10. Petugas */}
        <div className="flex gap-2 items-center text-sm font-medium text-slate-600 dark:text-slate-400 mt-2">
           <User className="w-4 h-4" />
           <span>Petugas: <span className="font-bold">{user?.name}</span></span>
        </div>
      </div>
      {/* 11. Review Pembayaran */}
      {selectedSiswa && jenisPembayaran && (
        <div className="mt-8 border-2 border-indigo-100 dark:border-indigo-500/20 rounded-2xl bg-indigo-50/50 dark:bg-indigo-500/5 p-5">
          <h4 className="font-extrabold text-indigo-800 dark:text-indigo-400 mb-4 flex items-center gap-2">
            <RpIcon className="w-5 h-5" /> Review Transaksi
          </h4>
          <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <div className="flex justify-between"><span className="text-slate-500">Siswa:</span> <span>{getSiswaName(selectedSiswa)} ({getSiswaClass(selectedSiswa)})</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Kode:</span> <span>{kodePembayaran}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Barang/Jasa:</span> <span>{jenisPembayaran} {bulanPembayaran ? `(${bulanPembayaran})` : ''}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Total Tagihan {cicilanKe > 1 ? 'Sisa' : ''}:</span> <span>Rp {nominalPembayaran.toLocaleString('id-ID')}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Metode:</span> <span>{metodePembayaran}</span></div>
            <div className="flex justify-between font-bold text-base mt-2 border-t border-indigo-200 dark:border-indigo-500/30 pt-2"><span className="text-slate-800 dark:text-white">Dibayarkan:</span> <span className="text-indigo-600 dark:text-indigo-400">Rp {(metodePembayaran === 'Cicil' ? nominalCicilan : nominalPembayaran).toLocaleString('id-ID')}</span></div>
            {metodePembayaran === 'Cicil' && (
               <div className="flex justify-between font-bold text-rose-500 mt-1"><span className="">Sisa Tagihan:</span> <span>Rp {Math.max(0, nominalPembayaran - nominalCicilan).toLocaleString('id-ID')}</span></div>
            )}
          </div>
        </div>
      )}
      
      {/* 12. Bayar Warning Toggle */}
      <div className="pt-6 relative">
        {!showConfirm ? (
           <button 
             type="button" 
             onClick={() => {
                setShowConfirm(true);
             }}
             disabled={!selectedSiswa || !jenisPembayaran || (metodePembayaran === 'Cicil' && (!nominalCicilan || nominalCicilan <= 0))}
             className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-600/30"
           >
             <RpIcon className="w-5 h-5" /> 
             {(!selectedSiswa || !jenisPembayaran) ? 'Mohon Lengkapi Data' : 'Bayar Sekarang'}
           </button>
        ) : (
           <div className="animate-in slide-in-from-bottom-2 fade-in bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-200 dark:border-rose-500/30 rounded-2xl p-5 text-center">
             <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
             <h4 className="font-bold text-rose-700 dark:text-rose-400 mb-1">Konfirmasi Pembayaran</h4>
             <p className="text-sm text-rose-600/80 dark:text-rose-400/80 mb-5">Pastikan data sudah benar. Lanjutkan menyimpan transaksi?</p>
             <div className="flex gap-3">
               <button type="button" onClick={() => setShowConfirm(false)} className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl active:scale-95 transition-transform">Koreksi Data</button>
               <button type="button" onClick={handleSimpan} className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl active:scale-95 transition-transform shadow-lg shadow-indigo-600/30">Simpan Final</button>
             </div>
           </div>
        )}
      </div>
    </div>
  );
  const handleDownloadJPG = async () => {
    const el = document.getElementById('receipt-pembayaran');
    if (el) {
      const canvas = await html2canvas(el, { scale: 2 });
      const data = canvas.toDataURL('image/jpeg');
      const link = document.createElement('a');
      link.href = data;
      link.download = `Struk_Pembayaran_${saveSuccessData?.kode}.jpg`;
      link.click();
    }
  };
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const startY = applyPdfKop(doc);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Laporan", 14, startY + 5);
    doc.setFontSize(16);
    doc.text('Bukti Pembayaran', 14, 15);
    
    doc.setFontSize(12);
    doc.text(`Kode: ${saveSuccessData?.kode}`, 14, 25);
    doc.text(`Tanggal: ${saveSuccessData?.tanggal} ${saveSuccessData?.waktu}`, 14, 32);
    doc.text(`Siswa: ${getSiswaName(saveSuccessData?.siswa)}`, 14, 39);
    doc.text(`Kelas: ${getSiswaClass(saveSuccessData?.siswa)}`, 14, 46);
    doc.text(`Jenis: ${saveSuccessData?.jenis} ${saveSuccessData?.bulan ? `(${saveSuccessData?.bulan})` : ''}`, 14, 53);
    doc.text(`Metode: ${saveSuccessData?.metode}`, 14, 60);
    doc.text(`Nominal Dibayar: Rp ${saveSuccessData?.nominalDibayar.toLocaleString('id-ID')}`, 14, 67);
    if (saveSuccessData?.metode === 'Cicil') {
      doc.text(`Sisa Cicilan: Rp ${saveSuccessData?.sisaTagihan.toLocaleString('id-ID')}`, 14, 74);
    }
    
    doc.save(`Bukti_Pembayaran_${saveSuccessData?.kode}.pdf`);
  };
  const renderSuccessContent = () => (
    <div className="flex flex-col items-center justify-center py-8">
       <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-4">
         <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
       </div>
       <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Pembayaran Berhasil!</h3>
       <p className="text-slate-500 text-center mb-6 text-sm">Data pembayaran telah tersimpan di sistem.</p>
       
       <div id="receipt-pembayaran" className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
         <StrukHeader title="STRUK PEMBAYARAN" />
         <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
           <div className="flex justify-between"><span>Kode:</span> <strong>{saveSuccessData?.kode}</strong></div>
           <div className="flex justify-between"><span>Tanggal:</span> <span>{saveSuccessData?.tanggal} {saveSuccessData?.waktu}</span></div>
           <div className="flex justify-between"><span>Siswa:</span> <span>{getSiswaName(saveSuccessData?.siswa)}</span></div>
           <div className="flex justify-between"><span>Jenis:</span> <span>{saveSuccessData?.jenis} {saveSuccessData?.bulan && `(${saveSuccessData?.bulan})`}</span></div>
           <div className="flex justify-between"><span>Metode:</span> <span>{saveSuccessData?.metode}</span></div>
           <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">
             <span>Total Dibayar:</span> <span>Rp {saveSuccessData?.nominalDibayar.toLocaleString('id-ID')}</span>
           </div>
           {saveSuccessData?.metode === 'Cicil' && (
              <div className="flex justify-between text-rose-500 font-semibold">
                <span>Sisa Cicilan:</span> <span>Rp {saveSuccessData?.sisaTagihan.toLocaleString('id-ID')}</span>
              </div>
           )}
         </div>
       </div>
       <div className="flex gap-3 w-full max-w-sm">
         <button onClick={handleDownloadJPG} className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 hover:bg-indigo-100 py-3 rounded-xl font-bold transition-colors">
           Download Struk JPG
         </button>
         <button onClick={handleDownloadPDF} className="flex-1 flex items-center justify-center gap-2 bg-rose-50 text-rose-600 dark:bg-rose-500/10 hover:bg-rose-100 py-3 rounded-xl font-bold transition-colors">
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
      <div className="p-6">
        {saveSuccessData ? renderSuccessContent() : renderFormContent()}
      </div>
    );
    if (isMobile) {
      return (
        <MobileBottomSheet isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setShowConfirm(false); }} title="Catat Pembayaran Baru">
          {content}
        </MobileBottomSheet>
      );
    }
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setIsModalOpen(false); setShowConfirm(false); }} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[24px] shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl z-10">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Catat Pembayaran Baru</h2>
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
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[100vw] overflow-x-hidden pt-safe pb-32">
      <div className="flex flex-col gap-8 w-full">
        {/* Banner */}
        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden h-40 sm:h-48 flex flex-col justify-end">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
           <div className="absolute bottom-0 right-10 opacity-20 pointer-events-none transform translate-y-1/4 right-0 rotate-[-15deg]">
              <RpIcon className="w-48 h-48 sm:w-64 sm:h-64" />
           </div>
           
           <div className="relative z-10">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">Input Pembayaran</h1>
              <p className="text-indigo-100 font-medium text-sm sm:text-base max-w-sm sm:max-w-md">Catat pembayaran bulanan dan tagihan siswa.</p>
           </div>
        </div>
        {/* Header Options */}
        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={openTambah}
            className="flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-indigo-500 to-blue-600 p-5 rounded-[20px] text-white shadow-xl shadow-indigo-500/20 active:scale-95 transition-all text-center border-b-4 border-indigo-700/50 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm relative z-10">
              <Plus className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-lg tracking-wide relative z-10">Catat Pembayaran Baru</span>
          </button>
        </div>
        {/* Filter and Export Section */}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Cari nama atau kode..."
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white"
              />
            </div>
            <select 
              value={historyFilterJenis}
              onChange={(e) => setHistoryFilterJenis(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white"
            >
              <option value="">Semua Jenis</option>
              {JENIS_PEMBAYARAN.map(j => <option key={j.id} value={j.name}>{j.name}</option>)}
            </select>
            <select 
              value={historyFilterStatus}
              onChange={(e) => setHistoryFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white"
            >
              <option value="">Semua Status</option>
              <option value="Lunas">Lunas</option>
              <option value="Belum Lunas">Belum Lunas</option>
            </select>
          </div>
        </div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Riwayat Pembayaran Terbaru
          </h2>
          <span className="text-sm font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            {filteredPembayaranList.length} Transaksi
          </span>
        </div>
        {/* Transaction Lists */}
        <div className="space-y-4">
          {filteredPembayaranList.length > 0 ? filteredPembayaranList.map((pembayaran) => (
            <div key={pembayaran.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex items-start gap-3">
                <div className={`p-3 rounded-xl mt-1 shrink-0 ${pembayaran.status === 'Lunas' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  <RpIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{pembayaran.siswa ? getSiswaName(pembayaran.siswa) : 'Unknown'}</h3>
                  <div className="flex flex-wrap items-center text-sm font-medium text-slate-500 gap-x-3 gap-y-1 mt-1">
                    <span>{pembayaran.jenis} {pembayaran.bulan ? `(${pembayaran.bulan})` : ''}</span>
                    <span>•</span>
                    <span>{pembayaran.tanggal}</span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-2 flex items-center gap-2">
                    <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">{pembayaran.kode}</span>
                    {pembayaran.metode === 'Cicil' && (
                       <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase">
                         Cicilan ke-{pembayaran.cicilanKe}
                       </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-left sm:text-right border-t sm:border-0 border-slate-100 dark:border-slate-700/50 pt-3 sm:pt-0">
                <div className="font-extrabold text-xl text-slate-800 dark:text-white">
                  Rp {pembayaran.nominalDibayar.toLocaleString('id-ID')}
                </div>
                {pembayaran.metode === 'Cicil' && pembayaran.sisaTagihan > 0 && (
                   <div className="text-xs text-rose-500 font-bold mt-1">
                     Sisa Tagihan: Rp {pembayaran.sisaTagihan.toLocaleString('id-ID')}
                   </div>
                )}
                <div className="flex items-center gap-2 sm:justify-end mt-2 flex-wrap">
                   <div className="text-xs font-semibold px-2 py-1 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                     {pembayaran.metode}
                   </div>
                   <div className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md ${pembayaran.status === 'Lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                     {pembayaran.status}
                   </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 border-dashed">
              <RpIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700 dark:text-slate-300">Belum ada riwayat pembayaran</h3>
              <p className="text-sm text-slate-500 mt-1">Catat pembayaran baru dengan tombol di atas.</p>
            </div>
          )}
        </div>
      </div>
      {/* Form Modal */}
      {renderModal()}
    </div>
  );
}
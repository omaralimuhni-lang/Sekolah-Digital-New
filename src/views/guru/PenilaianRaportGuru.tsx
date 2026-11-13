import { useState, useEffect, useRef } from 'react';
import { Star, Search, Edit2, Trash2, Eye, Plus, FileDown, FilePlus, Download, Award, FileText, Globe, X, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../../AppContext';
import { usePRTugas } from '../../PRTugasContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { applyPdfKop } from '../../utils/kopHelper';
export const PenilaianRaportGuru = () => {
  const { user, showNotification } = useAppContext();
  const { triggerUpdate } = usePRTugas();
  const [activeTab, setActiveTab] = useState<'pr_tugas' | 'ujian' | 'mapel' | 'global' | 'raport'>('pr_tugas');
  const [searchQuery, setSearchQuery] = useState('');
  const [dbSiswa, setDbSiswa] = useState<any[]>([]);
  // Arrays to hold data from localStorage
  const [dataPrTugas, setDataPrTugas] = useState<any[]>([]);
  const [dataUjian, setDataUjian] = useState<any[]>([]);
  const [dataMapel, setDataMapel] = useState<any[]>([]);
  const [dataGlobal, setDataGlobal] = useState<any[]>([]);
  const [dataRaport, setDataRaport] = useState<any[]>([]);
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewData, setViewData] = useState<any>(null);
  // Form State
  const [, setFormSiswaId] = useState('');
  const [formSiswaName, setFormSiswaName] = useState('');
  const [formSiswaNisn, setFormSiswaNisn] = useState('');
  const [formSiswaClass, setFormSiswaClass] = useState('');
  
  // Generic fields
  const [formMapel, setFormMapel] = useState('');
  const [formNilai, setFormNilai] = useState<number | string>('');
  const [formTanggal, setFormTanggal] = useState('');
  
  // pr_tugas
  const [formNamaTugas, setFormNamaTugas] = useState('');
  const [formTipeTipe, setFormTipeTipe] = useState('');
  
  // ujian
  const [formNamaUjian, setFormNamaUjian] = useState('');
  
  // mapel
  const [formNilaiTugas, setFormNilaiTugas] = useState<number | string>('');
  const [formNilaiUjian, setFormNilaiUjian] = useState<number | string>('');
  const [formRataRata, setFormRataRata] = useState<number | string>('');
  
  // global
  const [formPredikat, setFormPredikat] = useState('');
  const [formCatatan, setFormCatatan] = useState('');
  
  // raport
  const [formSemester, setFormSemester] = useState('');
  const [formTahunAjaran, setFormTahunAjaran] = useState('');
  const [formFileRaport, setFormFileRaport] = useState('');
  const [formFileName, setFormFileName] = useState('');
  const [formRangking, setFormRangking] = useState<number | string>('');
  const [formStatus, setFormStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const refreshAll = () => {
      loadData();
      const siswa = JSON.parse(localStorage.getItem('sd_db_siswa') || '[]');
      setDbSiswa(siswa);
    };
    refreshAll();
    window.addEventListener('localStorageUpdate', refreshAll);
    return () => window.removeEventListener('localStorageUpdate', refreshAll);
  }, []);
  const loadData = () => {
    setDataPrTugas(JSON.parse(localStorage.getItem('sd_penilaian_tugas') || '[]'));
    setDataUjian(JSON.parse(localStorage.getItem('sd_penilaian_ujian') || '[]'));
    setDataMapel(JSON.parse(localStorage.getItem('sd_penilaian_mapel') || '[]'));
    setDataGlobal(JSON.parse(localStorage.getItem('sd_penilaian_global') || '[]'));
    setDataRaport(JSON.parse(localStorage.getItem('sd_raport') || '[]'));
  };
  const filterData = (data: any[]) => {
    return data.filter((d: any) => 
      (d.namaSiswa?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.nisn?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.mapel?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.kelas?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };
  const handleDownloadExcel = () => {
    let targetData: any[];
    let sheetName = "";
    if (activeTab === 'pr_tugas') { targetData = filterData(dataPrTugas); sheetName = "Nilai_Tugas"; }
    else if (activeTab === 'ujian') { targetData = filterData(dataUjian); sheetName = "Nilai_Ujian"; }
    else if (activeTab === 'mapel') { targetData = filterData(dataMapel); sheetName = "Nilai_Mapel"; }
    else if (activeTab === 'global') { targetData = filterData(dataGlobal); sheetName = "Penilaian_Global"; }
    else { targetData = filterData(dataRaport); sheetName = "Raport"; }
    if (targetData.length === 0) {
      showNotification('Tidak ada data yang dapat diexport', 'error');
      return;
    }
    import('../../utils/kopHelper').then(({ exportToExcel }) => {
      exportToExcel(targetData, sheetName, `LAPORAN - ${sheetName.toUpperCase()}`);
    });
    showNotification('Mempersiapkan File Excel...', 'success');
  };
  const handleDownloadPdf = () => {
    let targetData: any[];
    let title = "";
    let head: string[][] = [];
    let keys: string[] = [];
    if (activeTab === 'pr_tugas') { 
      targetData = filterData(dataPrTugas); title = "Nilai Tugas";
      head = [['NISN', 'Nama Siswa', 'Kelas', 'Tugas', 'Mapel', 'Nilai', 'Tanggal']];
      keys = ['nisn', 'namaSiswa', 'kelas', 'namaTugas', 'mapel', 'nilai', 'tanggal'];
    } else if (activeTab === 'ujian') { 
      targetData = filterData(dataUjian); title = "Nilai Ujian"; 
      head = [['NISN', 'Nama Siswa', 'Kelas', 'Ujian', 'Mapel', 'Nilai', 'Tanggal']];
      keys = ['nisn', 'namaSiswa', 'kelas', 'namaUjian', 'mapel', 'nilai', 'tanggal'];
    } else if (activeTab === 'mapel') { 
      targetData = filterData(dataMapel); title = "Nilai Mata Pelajaran"; 
      head = [['NISN', 'Nama Siswa', 'Kelas', 'Mapel', 'Nilai Tugas', 'Nilai Ujian', 'Rata-Rata']];
      keys = ['nisn', 'namaSiswa', 'kelas', 'mapel', 'nilaiTugas', 'nilaiUjian', 'rataRata'];
    } else if (activeTab === 'global') { 
      targetData = filterData(dataGlobal); title = "Penilaian Global"; 
      head = [['NISN', 'Nama Siswa', 'Kelas', 'Rata-Rata', 'Predikat', 'Catatan']];
      keys = ['nisn', 'namaSiswa', 'kelas', 'rataRataKeseluruhan', 'predikat', 'catatan'];
    } else { 
      targetData = filterData(dataRaport); title = "Data Raport Siswa"; 
      head = [['NISN', 'Nama Siswa', 'Kelas', 'Semester', 'Tahun', 'Rangking', 'Status']];
      keys = ['nisn', 'namaSiswa', 'kelas', 'semester', 'tahunAjaran', 'rangking', 'status'];
    }
    if (targetData.length === 0) {
      showNotification('Tidak ada data yang dapat diexport', 'error');
      return;
    }
    const doc = new jsPDF();
    const startY = applyPdfKop(doc);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, startY + 5);
    autoTable(doc, {
      startY: startY + 10,
      head: head,
      body: targetData.map(item => keys.map(k => String(item[k] || '-')))
    });
    doc.save(`${title.replace(/ /g, '_')}_${new Date().getTime()}.pdf`);
    showNotification('PDF berhasil didownload', 'success');
  };
  const handleOpenAdd = () => {
    setEditId(null);
    setFormSiswaId(''); setFormSiswaName(''); setFormSiswaNisn(''); setFormSiswaClass('');
    setFormMapel(''); setFormNilai(''); setFormTanggal(new Date().toISOString().split('T')[0]);
    setFormNamaTugas(''); setFormTipeTipe('Tugas Online');
    setFormNamaUjian(''); setFormNilaiTugas(''); setFormNilaiUjian(''); setFormRataRata('');
    setFormPredikat(''); setFormCatatan('');
    setFormSemester('Ganjil'); setFormTahunAjaran('2023/2024'); setFormFileRaport(''); setFormFileName(''); setFormRangking(''); setFormStatus('Naik Kelas');
    setIsModalOpen(true);
  };
  const handleDelete = (id: string, storageKey: string, setter: any, dataList: any[]) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      const updated = dataList.filter(item => item.id !== id);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      triggerUpdate();
      setter(updated);
      showNotification('Data berhasil dihapus', 'success');
    }
  };
  const handleEdit = (item: any) => {
    setEditId(item.id);
    setFormSiswaNisn(item.nisn);
    setFormSiswaName(item.namaSiswa);
    setFormSiswaClass(item.kelas);
    setFormMapel(item.mapel || '');
    setFormNilai(item.nilai || '');
    setFormTanggal(item.tanggal || '');
    if (activeTab === 'pr_tugas') {
      setFormNamaTugas(item.namaTugas || '');
      setFormTipeTipe(item.tipe || '');
    } else if (activeTab === 'ujian') {
      setFormNamaUjian(item.namaUjian || '');
      setFormTipeTipe(item.tipe || '');
    } else if (activeTab === 'mapel') {
      setFormNilaiTugas(item.nilaiTugas || '');
      setFormNilaiUjian(item.nilaiUjian || '');
      setFormRataRata(item.rataRata || '');
    } else if (activeTab === 'global') {
      setFormRataRata(item.rataRataKeseluruhan || '');
      setFormPredikat(item.predikat || '');
      setFormCatatan(item.catatan || '');
    } else if (activeTab === 'raport') {
      setFormSemester(item.semester || '');
      setFormTahunAjaran(item.tahunAjaran || '');
      setFormFileRaport(item.fileRaport || '');
      setFormFileName(item.fileRaportName || item.fileRaport || '');
      setFormRangking(item.rangking || '');
      setFormStatus(item.status || '');
    }
    
    setIsModalOpen(true);
  };
  const handleSiswaSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const s = dbSiswa.find(x => x.nisn === e.target.value);
    if (s) {
      setFormSiswaNisn(s.nisn);
      setFormSiswaName(s.fullName);
      setFormSiswaClass(s.class);
    }
  };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormFileRaport(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleSave = () => {
    if (!formSiswaNisn) {
      showNotification('Pilih siswa terlebih dahulu', 'error');
      return;
    }
    let storageKey = '';
    let currData: any[] = [];
    let setter: any;
    const existingItem = activeTab === 'pr_tugas' ? dataPrTugas.find(d => d.id === editId) :
                         activeTab === 'ujian' ? dataUjian.find(d => d.id === editId) :
                         activeTab === 'mapel' ? dataMapel.find(d => d.id === editId) :
                         activeTab === 'global' ? dataGlobal.find(d => d.id === editId) :
                         dataRaport.find(d => d.id === editId);
    const payload: any = {
      ...(existingItem || {}),
      id: editId || Date.now().toString(),
      nisn: formSiswaNisn,
      namaSiswa: formSiswaName,
      kelas: formSiswaClass,
      guru: user.name
    };
    if (activeTab === 'pr_tugas') {
      payload.mapel = formMapel;
      payload.namaTugas = formNamaTugas;
      payload.tipe = formTipeTipe;
      payload.nilai = Number(formNilai);
      payload.tanggal = formTanggal;
      storageKey = 'sd_penilaian_tugas';
      currData = dataPrTugas;
      setter = setDataPrTugas;
    } else if (activeTab === 'ujian') {
      payload.mapel = formMapel;
      payload.namaUjian = formNamaUjian;
      payload.tipe = formTipeTipe;
      payload.nilai = Number(formNilai);
      payload.tanggal = formTanggal;
      storageKey = 'sd_penilaian_ujian';
      currData = dataUjian;
      setter = setDataUjian;
    } else if (activeTab === 'mapel') {
      payload.mapel = formMapel;
      payload.nilaiTugas = Number(formNilaiTugas);
      payload.nilaiUjian = Number(formNilaiUjian);
      payload.rataRata = Number(formRataRata);
      storageKey = 'sd_penilaian_mapel';
      currData = dataMapel;
      setter = setDataMapel;
    } else if (activeTab === 'global') {
      payload.rataRataKeseluruhan = Number(formRataRata);
      payload.predikat = formPredikat;
      payload.catatan = formCatatan;
      storageKey = 'sd_penilaian_global';
      currData = dataGlobal;
      setter = setDataGlobal;
    } else if (activeTab === 'raport') {
      payload.semester = formSemester;
      payload.tahunAjaran = formTahunAjaran;
      payload.fileRaport = formFileRaport;
      payload.fileRaportName = formFileName;
      payload.rangking = Number(formRangking);
      payload.status = formStatus;
      storageKey = 'sd_raport';
      currData = dataRaport;
      setter = setDataRaport;
    }
    let updated;
    if (editId) {
      updated = currData.map(d => d.id === editId ? payload : d);
    } else {
      updated = [payload, ...currData];
    }
    localStorage.setItem(storageKey, JSON.stringify(updated));
    triggerUpdate();
    setter(updated);
    setIsModalOpen(false);
    showNotification('Data berhasil disimpan', 'success');
  };
  const renderFilterAndActions = () => (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm mb-6">
      <div className="relative w-full sm:w-96">
        <input 
          type="text" 
          placeholder="Cari nama siswa, NISN, mapel..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
      </div>
      <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
        <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20 whitespace-nowrap">
          <Plus className="w-4 h-4" /> Tambah Data
        </button>
        <button onClick={handleDownloadExcel} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-emerald-500/20 whitespace-nowrap">
          <FileDown className="w-4 h-4" /> Excel
        </button>
        <button onClick={handleDownloadPdf} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-rose-500/20 whitespace-nowrap">
          <Download className="w-4 h-4" /> PDF
        </button>
      </div>
    </div>
  );
  const getStorageKeyByTab = () => {
    switch (activeTab) {
      case 'pr_tugas': return 'sd_penilaian_tugas';
      case 'ujian': return 'sd_penilaian_ujian';
      case 'mapel': return 'sd_penilaian_mapel';
      case 'global': return 'sd_penilaian_global';
      case 'raport': return 'sd_raport';
    }
  };
  const getDataSetByTab = () => {
    switch (activeTab) {
      case 'pr_tugas': return { data: dataPrTugas, setter: setDataPrTugas };
      case 'ujian': return { data: dataUjian, setter: setDataUjian };
      case 'mapel': return { data: dataMapel, setter: setDataMapel };
      case 'global': return { data: dataGlobal, setter: setDataGlobal };
      case 'raport': return { data: dataRaport, setter: setDataRaport };
    }
  };
  const renderTable = (headers: string[], renderRow: (item: any, i: number) => React.ReactNode, data: any[]) => {
    // Basic filter
    const activeData = data.filter(d => 
      (d.namaSiswa?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.nisn?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.mapel?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.kelas?.toLowerCase().includes(searchQuery.toLowerCase()))
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
  const actionButtons = (item: any) => {
    const { setter, data } = getDataSetByTab();
    return (
      <div className="flex items-center justify-end gap-2">
        <button onClick={() => { setViewData(item); setIsViewModalOpen(true); }} className="p-2 bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-900/30 dark:text-slate-400 dark:hover:text-emerald-400 rounded-lg transition-colors" title="Lihat">
          <Eye className="w-4 h-4" />
        </button>
        <button onClick={() => handleEdit(item)} className="p-2 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-blue-900/30 dark:text-slate-400 dark:hover:text-blue-400 rounded-lg transition-colors" title="Edit">
          <Edit2 className="w-4 h-4" />
        </button>
        <button onClick={() => handleDelete(item.id, getStorageKeyByTab(), setter, data)} className="p-2 bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-900/30 dark:text-slate-400 dark:hover:text-red-400 rounded-lg transition-colors" title="Hapus">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  };
  return (
    <div className="max-w-7xl mx-auto pb-24 lg:pb-12 space-y-6 mt-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-5">
           <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/20 text-amber-600 rounded-2xl flex items-center justify-center">
             <Star className="w-8 h-8 focus:outline-none" />
           </div>
           <div>
             <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Penilaian & Raport</h1>
             <p className="text-slate-500 dark:text-slate-400">Kelola nilai PR, Ujian, rekap mapel, dan raport akademik yang terhubung langsung dengan siswa.</p>
           </div>
        </div>
      </div>
      <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
         {[
           { id: 'pr_tugas', label: 'Tugas', icon: FileText },
           { id: 'ujian', label: 'Ujian', icon: FilePlus },
           { id: 'mapel', label: 'Mapel', icon: Award },
           { id: 'global', label: 'Global', icon: Globe },
           { id: 'raport', label: 'Raport Akhir', icon: Star },
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
        {renderFilterAndActions()}
        {activeTab === 'pr_tugas' && renderTable(
          ['Nama Siswa', 'NISN', 'Kelas', 'Mata Pelajaran', 'Tugas', 'Penyerahan', 'Nilai', 'Aksi'],
          (item) => (
             <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="py-4 font-medium text-slate-800 dark:text-slate-200">{item.namaSiswa}</td>
                <td className="py-4 text-slate-600 dark:text-slate-400">{item.nisn}</td>
                <td className="py-4 text-slate-600 dark:text-slate-400">{item.kelas}</td>
                <td className="py-4 text-slate-600 dark:text-slate-400">{item.mapel}</td>
                <td className="py-4 text-slate-600 dark:text-slate-400">{item.namaTugas} <br/><span className="text-xs font-semibold">{item.tipe}</span></td>
                <td className="py-4 text-slate-600 dark:text-slate-400">
                    {item.fileJawaban ? (
                       <button onClick={() => {
                          const win = window.open();
                          if (win) win.document.write(`<iframe src="${item.fileJawaban}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                       }} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors">
                          <FileText className="w-3.5 h-3.5"/> {item.fileJawabanName || 'Lihat Jawaban'}
                       </button>
                    ) : item.tipe === 'CBT Online' ? (
                       <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-lg">CBT Selesai</span>
                    ) : (
                       <span className="text-xs text-slate-400 italic">Belum / Tidak Ada File</span>
                    )}
                </td>
                <td className={`py-4 font-bold ${item.nilai > 0 ? 'text-amber-600' : 'text-rose-500'}`}>{item.nilai || '0 (Belum)'}</td>
                <td className="py-4">{actionButtons(item)}</td>
             </tr>
          ),
          dataPrTugas
        )}
        {activeTab === 'ujian' && renderTable(
          ['Nama Siswa', 'NISN', 'Kelas', 'Mata Pelajaran', 'Ujian', 'Nilai', 'Aksi'],
          (item) => (
             <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="py-4 font-medium text-slate-800 dark:text-slate-200">{item.namaSiswa}</td>
                <td className="py-4 text-slate-600 dark:text-slate-400">{item.nisn}</td>
                <td className="py-4 text-slate-600 dark:text-slate-400">{item.kelas}</td>
                <td className="py-4 text-slate-600 dark:text-slate-400">{item.mapel}</td>
                <td className="py-4 text-slate-600 dark:text-slate-400">{item.namaUjian}</td>
                <td className="py-4 font-bold text-amber-600">{item.nilai}</td>
                <td className="py-4">{actionButtons(item)}</td>
             </tr>
          ),
          dataUjian
        )}
        {activeTab === 'mapel' && renderTable(
          ['Nama Siswa', 'NISN', 'Kelas', 'Mata Pelajaran', 'Rata Rata Tugas', 'Rata Rata Ujian', 'Nilai Akhir', 'Aksi'],
          (item) => (
             <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="py-4 font-medium text-slate-800 dark:text-slate-200">{item.namaSiswa}</td>
                <td className="py-4 text-slate-600 dark:text-slate-400">{item.nisn}</td>
                <td className="py-4 text-slate-600 dark:text-slate-400">{item.kelas}</td>
                <td className="py-4 text-slate-600 dark:text-slate-400">{item.mapel}</td>
                <td className="py-4 text-slate-600 dark:text-slate-400">{item.nilaiTugas}</td>
                <td className="py-4 text-slate-600 dark:text-slate-400">{item.nilaiUjian}</td>
                <td className="py-4 font-bold text-blue-600">{item.rataRata}</td>
                <td className="py-4">{actionButtons(item)}</td>
             </tr>
          ),
          dataMapel
        )}
        {activeTab === 'global' && renderTable(
          ['Nama Siswa', 'NISN', 'Kelas', 'Rata Keseluruhan', 'Predikat', 'Catatan', 'Aksi'],
          (item) => (
             <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="py-4 font-medium text-slate-800 dark:text-slate-200">{item.namaSiswa}</td>
                <td className="py-4 text-slate-600 dark:text-slate-400">{item.nisn}</td>
                <td className="py-4 text-slate-600 dark:text-slate-400">{item.kelas}</td>
                <td className="py-4 text-blue-600 font-bold">{item.rataRataKeseluruhan}</td>
                <td className="py-4 font-semibold text-emerald-600">{item.predikat}</td>
                <td className="py-4 text-slate-600 dark:text-slate-400 truncate max-w-[200px]">{item.catatan}</td>
                <td className="py-4">{actionButtons(item)}</td>
             </tr>
          ),
          dataGlobal
        )}
        {activeTab === 'raport' && renderTable(
          ['Nama Siswa', 'NISN', 'Kelas', 'Semester / TA', 'File Raport', 'Rangking', 'Status', 'Aksi'],
          (item) => (
             <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="py-4 font-medium text-slate-800 dark:text-slate-200">{item.namaSiswa}</td>
                <td className="py-4 text-slate-600 dark:text-slate-400">{item.nisn}</td>
                <td className="py-4 text-slate-600 dark:text-slate-400">{item.kelas}</td>
                <td className="py-4 text-slate-600 dark:text-slate-400">{item.semester} - {item.tahunAjaran}</td>
                <td className="py-4 text-blue-600 hover:underline cursor-pointer" onClick={() => {
                        const win = window.open();
                        if (win && item.fileRaport) win.document.write(`<iframe src="${item.fileRaport}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                   }}>
                   {item.fileRaportName || 'Lihat Dokumen'}
                </td>
                <td className="py-4 font-bold text-amber-600">#{item.rangking}</td>
                <td className="py-4 font-semibold text-emerald-600">{item.status}</td>
                <td className="py-4">{actionButtons(item)}</td>
             </tr>
          ),
          dataRaport
        )}
      </div>
      {/* MODAL TAMBAH/EDIT */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{editId ? 'Edit Data' : 'Tambah Data'} Penilaian</h2>
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 mb-6">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2 text-blue-700 dark:text-blue-300">Pilih Siswa (Cari berdasarkan NISN)</label>
                    <select value={formSiswaNisn} onChange={handleSiswaSelect} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="">-- Pilih Siswa --</option>
                        {dbSiswa.filter(s => s.role === 'siswa').map(s => (
                            <option key={s.id} value={s.nisn}>{s.nisn} - {s.fullName} - {s.class}</option>
                        ))}
                    </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Common fields for specific tabs */}
                    {(activeTab === 'pr_tugas' || activeTab === 'ujian' || activeTab === 'mapel') && (
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Mata Pelajaran</label>
                            <input type="text" value={formMapel} onChange={e => setFormMapel(e.target.value)} className="w-full px-4 py-2 border rounded-xl dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none" />
                        </div>
                    )}
                    {(activeTab === 'pr_tugas' || activeTab === 'ujian') && (
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Tanggal</label>
                            <input type="date" value={formTanggal} onChange={e => setFormTanggal(e.target.value)} className="w-full px-4 py-2 border rounded-xl dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none" />
                        </div>
                    )}
                    {activeTab === 'pr_tugas' && (
                       <>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Nama Tugas</label>
                            <input type="text" value={formNamaTugas} onChange={e => setFormNamaTugas(e.target.value)} className="w-full px-4 py-2 border rounded-xl dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Tipe Tugas</label>
                            <select value={formTipeTipe} onChange={e => setFormTipeTipe(e.target.value)} className="w-full px-4 py-2 border rounded-xl dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none">
                               <option value="Offline">Offline</option>
                               <option value="Online (CBT)">Online (CBT)</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1.5">Nilai (0-100)</label>
                            <input type="number" value={formNilai} onChange={e => setFormNilai(e.target.value)} className="w-full px-4 py-2 border rounded-xl dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none" />
                        </div>
                       </>
                    )}
                    {activeTab === 'ujian' && (
                       <>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Nama Ujian</label>
                            <input type="text" value={formNamaUjian} onChange={e => setFormNamaUjian(e.target.value)} className="w-full px-4 py-2 border rounded-xl dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Tipe Ujian</label>
                            <input type="text" value={formTipeTipe} onChange={e => setFormTipeTipe(e.target.value)} className="w-full px-4 py-2 border rounded-xl dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1.5">Nilai (0-100)</label>
                            <input type="number" value={formNilai} onChange={e => setFormNilai(e.target.value)} className="w-full px-4 py-2 border rounded-xl dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none" />
                        </div>
                       </>
                    )}
                    {activeTab === 'mapel' && (
                        <>
                         <div>
                             <label className="block text-sm font-medium mb-1.5">Rata Rata Tugas</label>
                             <input type="number" value={formNilaiTugas} onChange={e => setFormNilaiTugas(e.target.value)} className="w-full px-4 py-2 border rounded-xl dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none" />
                         </div>
                         <div>
                             <label className="block text-sm font-medium mb-1.5">Rata Rata Ujian</label>
                             <input type="number" value={formNilaiUjian} onChange={e => setFormNilaiUjian(e.target.value)} className="w-full px-4 py-2 border rounded-xl dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none" />
                         </div>
                         <div className="md:col-span-2">
                             <label className="block text-sm font-medium mb-1.5 text-blue-600">Nilai Akhir (Di Rapor)</label>
                             <input type="number" value={formRataRata} onChange={e => setFormRataRata(e.target.value)} className="w-full px-4 py-2 border ring-2 ring-blue-500 rounded-xl dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none" />
                         </div>
                        </>
                    )}
                    {activeTab === 'global' && (
                        <>
                         <div>
                             <label className="block text-sm font-medium mb-1.5">Rata Rata Keseluruhan</label>
                             <input type="number" value={formRataRata} onChange={e => setFormRataRata(e.target.value)} className="w-full px-4 py-2 border rounded-xl dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none" />
                         </div>
                         <div>
                             <label className="block text-sm font-medium mb-1.5">Predikat</label>
                             <input type="text" value={formPredikat} onChange={e => setFormPredikat(e.target.value)} className="w-full px-4 py-2 border rounded-xl dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none" placeholder="A, B+, dll" />
                         </div>
                         <div className="md:col-span-2">
                             <label className="block text-sm font-medium mb-1.5">Catatan Evaluasi Guru</label>
                             <textarea rows={3} value={formCatatan} onChange={e => setFormCatatan(e.target.value)} className="w-full px-4 py-2 border rounded-xl dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none" />
                         </div>
                        </>
                    )}
                    {activeTab === 'raport' && (
                        <>
                         <div>
                             <label className="block text-sm font-medium mb-1.5">Semester</label>
                             <select value={formSemester} onChange={e => setFormSemester(e.target.value)} className="w-full px-4 py-2 border rounded-xl dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none">
                                 <option value="Ganjil">Ganjil</option>
                                 <option value="Genap">Genap</option>
                             </select>
                         </div>
                         <div>
                             <label className="block text-sm font-medium mb-1.5">Tahun Ajaran</label>
                             <input type="text" value={formTahunAjaran} onChange={e => setFormTahunAjaran(e.target.value)} className="w-full px-4 py-2 border rounded-xl dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none" placeholder="2023/2024" />
                         </div>
                         <div>
                             <label className="block text-sm font-medium mb-1.5">Rangking</label>
                             <input type="number" value={formRangking} onChange={e => setFormRangking(e.target.value)} className="w-full px-4 py-2 border rounded-xl dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none" placeholder="1, 2, 3..." />
                         </div>
                         <div>
                             <label className="block text-sm font-medium mb-1.5">Keputusan / Status</label>
                             <select value={formStatus} onChange={e => setFormStatus(e.target.value)} className="w-full px-4 py-2 border rounded-xl dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none">
                                 <option value="Naik Kelas">Naik Kelas</option>
                                 <option value="Tinggal Kelas">Tinggal Kelas</option>
                                 <option value="Lulus">Lulus</option>
                             </select>
                         </div>
                         <div className="md:col-span-2">
                             <label className="block text-sm font-medium mb-1.5">Upload Dokumen Raport (PDF)</label>
                             <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onClick={() => fileInputRef.current?.click()}>
                                 <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.doc,.docx" className="hidden" />
                                 <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                                 <div className="text-sm font-medium text-blue-600 dark:text-blue-400">{formFileName || 'Klik untuk mengunggah dokumen raport'}</div>
                             </div>
                         </div>
                        </>
                    )}
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 shrink-0">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-3 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">Batal</button>
                 <button type="button" onClick={handleSave} className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/20">Simpan {activeTab === 'pr_tugas' ? 'Tugas' : activeTab}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
         {isViewModalOpen && viewData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsViewModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-lg flex flex-col p-6">
                 <h3 className="text-xl font-bold mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">Detail Data Penilaian</h3>
                 <div className="space-y-3 text-sm">
                    {Object.entries(viewData).map(([k, v]) => {
                        if (k === 'id' || k === 'fileRaport' || v === undefined) return null;
                        return (
                           <div key={k} className="flex flex-col border-b border-slate-50 dark:border-slate-800/50 pb-2">
                              <span className="text-slate-500 font-medium capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <span className="text-slate-800 dark:text-white font-semibold text-base">{String(v)}</span>
                           </div>
                        );
                    })}
                 </div>
                 <button onClick={() => setIsViewModalOpen(false)} className="mt-6 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl w-full font-bold transition-colors">Tutup</button>
              </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
};
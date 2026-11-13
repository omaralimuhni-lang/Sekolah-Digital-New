import { useState, useEffect } from 'react';
import { Settings2, Plus, Edit, Trash2 } from 'lucide-react';
import { useAppContext } from '../../AppContext';

import { MobileBottomSheet } from '../../components/ui/MobileBottomSheet';

export function PengaturanKeuangan() {
  const { showNotification } = useAppContext();

  
  const [activeTab, setActiveTab] = useState<'petugas' | 'pembayaran'>('petugas');

  // --- Petugas State ---
  const [tenagaPendidik, setTenagaPendidik] = useState<any[]>([]);
  const [aksesPetugas, setAksesPetugas] = useState<Record<string, string[]>>({});
  
  // --- Jenis Pembayaran State ---
  const [jenisPembayaranList, setJenisPembayaranList] = useState<any[]>([]);
  const [isModalPembayaranOpen, setIsModalPembayaranOpen] = useState(false);
  const [editPembayaranId, setEditPembayaranId] = useState<string | null>(null);
  const [pbName, setPbName] = useState('');
  const [pbAmount, setPbAmount] = useState<number>(0);
  const [pbIsMonthly, setPbIsMonthly] = useState(false);

  const MENUS_TENDIK = [
    'Input Pembayaran',
    'Input Pemasukan',
    'Input Pengeluaran',
    'Input Pembelian Koin',
    'Input Data Kesiswaan',
    'Input Data Kepegawaian',
    'Input Data Sarana & Prasarana',
    'Input Data Arsip & Surat',
    'Input Pengumuman Sekolah',
    'Input Poling & Survei Sekolah',
    'Input Toko Sekolah'
  ];

  useEffect(() => {
    const loadData = () => {
    // Load tenaga pendidik
    const dbTendik = JSON.parse(localStorage.getItem('sd_db_tenaga_pendidik') || '[]');
    setTenagaPendidik(dbTendik);

    // Load akses
    const akses = JSON.parse(localStorage.getItem('sd_akses_penginput') || '{}');
    setAksesPetugas(akses);

    // Load jenis pembayaran
    const defaultJenis = [
        { id: '1', name: 'SPP', amount: 250000, isMonthly: true },
        { id: '2', name: 'Uang Gedung', amount: 1500000, isMonthly: false },
        { id: '3', name: 'Seragam', amount: 850000, isMonthly: false },
        { id: '4', name: 'Buku', amount: 350000, isMonthly: false },
        { id: '5', name: 'Daftar Ulang', amount: 500000, isMonthly: false },
    ];
    const savedJenis = JSON.parse(localStorage.getItem('sd_jenis_pembayaran') || 'null');
    setJenisPembayaranList(savedJenis || defaultJenis);
  };
    loadData();
    window.addEventListener('localStorageUpdate', loadData);
    return () => window.removeEventListener('localStorageUpdate', loadData);
  }, []);

  const saveAksesPetugas = (newAkses: Record<string, string[]>) => {
    setAksesPetugas(newAkses);
    localStorage.setItem('sd_akses_penginput', JSON.stringify(newAkses));
    showNotification('Akses petugas berhasil diperbarui');
  };

  const handleToggleAkses = (username: string, menu: string) => {
    const currentAkses = aksesPetugas[username] || [];
    let newMenuAkses = [...currentAkses];
    if (newMenuAkses.includes(menu)) {
      newMenuAkses = newMenuAkses.filter(m => m !== menu);
    } else {
      newMenuAkses.push(menu);
    }
    const newAkses = { ...aksesPetugas, [username]: newMenuAkses };
    saveAksesPetugas(newAkses);
  };

  const handleSelectAll = (username: string) => {
    const newAkses = { ...aksesPetugas, [username]: [...MENUS_TENDIK] };
    saveAksesPetugas(newAkses);
  };

  const handleDeselectAll = (username: string) => {
    const newAkses = { ...aksesPetugas, [username]: [] };
    saveAksesPetugas(newAkses);
  };

  // --- Jenis Pembayaran logic ---
  const handleEditPembayaran = (item: any) => {
    setEditPembayaranId(item.id);
    setPbName(item.name);
    setPbAmount(item.amount);
    setPbIsMonthly(item.isMonthly);
    setIsModalPembayaranOpen(true);
  };

  const handleAddPembayaran = () => {
    setEditPembayaranId(null);
    setPbName('');
    setPbAmount(0);
    setPbIsMonthly(false);
    setIsModalPembayaranOpen(true);
  };

  const savePembayaran = () => {
    if (!pbName) {
      alert("Nama jenis pembayaran harus diisi!");
      return;
    }
    let newList = [...jenisPembayaranList];
    if (editPembayaranId) {
      newList = newList.map(p => p.id === editPembayaranId ? { ...p, name: pbName, amount: pbAmount, isMonthly: pbIsMonthly } : p);
    } else {
      newList.push({
        id: Date.now().toString(),
        name: pbName,
        amount: pbAmount,
        isMonthly: pbIsMonthly
      });
    }
    setJenisPembayaranList(newList);
    localStorage.setItem('sd_jenis_pembayaran', JSON.stringify(newList));
    setIsModalPembayaranOpen(false);
    showNotification(editPembayaranId ? 'Jenis pembayaran diperbarui' : 'Jenis pembayaran ditambahkan');
  };

  const deletePembayaran = (id: string) => {
    if(confirm('Yakin ingin menghapus jenis pembayaran ini?')) {
      const newList = jenisPembayaranList.filter(p => p.id !== id);
      setJenisPembayaranList(newList);
      localStorage.setItem('sd_jenis_pembayaran', JSON.stringify(newList));
      showNotification('Jenis pembayaran dihapus');
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full pb-32">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
            <Settings2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            Pengaturan Keuangan
          </h1>
          <p className="text-slate-500 mt-2">Kelola akses petugas penginput dan jenis pembayaran.</p>
        </div>

        <div className="flex bg-white dark:bg-slate-800 rounded-xl p-1 shadow-sm mb-6 max-w-md">
           <button 
             onClick={() => setActiveTab('petugas')}
             className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${activeTab === 'petugas' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
           >
             Petugas Penginput
           </button>
           <button 
             onClick={() => setActiveTab('pembayaran')}
             className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${activeTab === 'pembayaran' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
           >
             Jenis Pembayaran
           </button>
        </div>

        {activeTab === 'petugas' && (
          <div className="space-y-6">
            {tenagaPendidik.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center text-slate-500 border border-slate-200 dark:border-slate-800">
                 Belum ada data tenaga pendidik. Silakan tambah di menu Database Tenaga Pendidik.
              </div>
            ) : (
              tenagaPendidik.map((pegawai) => {
                const akses = aksesPetugas[pegawai.username] || [];
                return (
                  <div key={pegawai.username} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 shadow-sm">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{pegawai.fullName}</h3>
                          <p className="text-sm text-slate-500">@{pegawai.username} • {pegawai.occupation || 'Tenaga Pendidik'}</p>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => handleSelectAll(pegawai.username)} className="px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20">Beri Semua Akses</button>
                           <button onClick={() => handleDeselectAll(pegawai.username)} className="px-3 py-1.5 text-xs font-bold bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20">Hapus Semua Akses</button>
                        </div>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {MENUS_TENDIK.map(menu => (
                           <label key={menu} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                              <input 
                                type="checkbox" 
                                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 dark:border-slate-600 dark:bg-slate-700" 
                                checked={akses.includes(menu)}
                                onChange={() => handleToggleAkses(pegawai.username, menu)}
                              />
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{menu}</span>
                           </label>
                        ))}
                     </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {activeTab === 'pembayaran' && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
             <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
               <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">Daftar Jenis Pembayaran</h2>
               <button onClick={handleAddPembayaran} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors">
                 <Plus className="w-4 h-4" /> Tambah
               </button>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-xs uppercase font-semibold">
                   <tr>
                     <th className="px-6 py-4">Nama Pembayaran</th>
                     <th className="px-6 py-4">Nominal Default</th>
                     <th className="px-6 py-4">Tipe tagihan</th>
                     <th className="px-6 py-4 text-right">Aksi</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                   {jenisPembayaranList.map(item => (
                     <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                       <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{item.name}</td>
                       <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(item.amount)}</td>
                       <td className="px-6 py-4">
                         <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${item.isMonthly ? 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                           {item.isMonthly ? 'Bulanan' : 'Satu Kali'}
                         </span>
                       </td>
                       <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                         <button onClick={() => handleEditPembayaran(item)} className="p-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg dark:bg-amber-500/10 dark:hover:bg-amber-500/20"><Edit className="w-4 h-4" /></button>
                         <button onClick={() => deletePembayaran(item.id)} className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg dark:bg-rose-500/10 dark:hover:bg-rose-500/20"><Trash2 className="w-4 h-4" /></button>
                       </td>
                     </tr>
                   ))}
                   {jenisPembayaranList.length === 0 && (
                     <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Belum ada jenis pembayaran</td></tr>
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {/* Modal form jenis pembayaran */}
        <MobileBottomSheet isOpen={isModalPembayaranOpen} onClose={() => setIsModalPembayaranOpen(false)} title={editPembayaranId ? 'Edit Jenis Pembayaran' : 'Tambah Jenis Pembayaran'}>
           <div className="p-6 space-y-4 pt-2">
             <div>
               <label className="text-sm font-medium mb-1.5 block">Nama Pembayaran</label>
               <input type="text" value={pbName} onChange={e => setPbName(e.target.value)} placeholder="Misal: SPP, Uang Gedung" className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none" />
             </div>
             <div>
               <label className="text-sm font-medium mb-1.5 block">Nominal Default</label>
               <input type="text" value={pbAmount > 0 ? pbAmount.toLocaleString('id-ID') : ''} onChange={e => {
                  const val = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0;
                  setPbAmount(val);
               }} className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none" />
             </div>
             <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 mt-2">
               <input type="checkbox" id="isMonthly" checked={pbIsMonthly} onChange={e => setPbIsMonthly(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 dark:border-slate-600 dark:bg-slate-700" />
               <label htmlFor="isMonthly" className="text-sm font-medium cursor-pointer text-slate-700 dark:text-slate-300">Pembayaran Bulanan (memerlukan pilihan bulan)</label>
             </div>
             <button onClick={savePembayaran} className="w-full py-3 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors">Simpan</button>
           </div>
        </MobileBottomSheet>
    </div>
  );
}

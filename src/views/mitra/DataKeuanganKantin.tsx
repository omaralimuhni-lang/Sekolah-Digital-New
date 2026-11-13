import { useState, useEffect, useMemo } from 'react';
import {  TrendingUp, Package, FileDown } from 'lucide-react';
import { RpIcon } from '../../components/ui/RpIcon';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppContext } from '../../AppContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { applyPdfKop } from '../../utils/kopHelper';
export const DataKeuanganKantin = () => {
  const { showNotification } = useAppContext();
  const [penjualanList, setPenjualanList] = useState<any[]>([]);
  useEffect(() => {
    loadData();
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'sd_kantin_pesanan_masuk' || e.key === 'sd_mitra_produk_kantin_list') {
        loadData();
      }
    };
    const handleCustomEvent = () => loadData();
    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('localStorageUpdate', handleCustomEvent);
    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('localStorageUpdate', handleCustomEvent);
    };
  }, []);
  const loadData = () => {
    const data = JSON.parse(localStorage.getItem('sd_kantin_pesanan_masuk') || '[]');
    setPenjualanList(data.filter((p: any) => p.status === 'Selesai'));
  };
  const handleDownload = () => {
    if (penjualanList.length === 0) {
      showNotification('Tidak ada data keuangan', 'error');
      return;
    }
    const doc = new jsPDF();
    const startY = applyPdfKop(doc);
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Laporan Keuangan Kantin", 14, startY + 5);
    
    // Summary
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Pendapatan: Rp ${totalPendapatan.toLocaleString('id-ID')}`, 14, startY + 12);
    doc.text(`Total Produk Terjual: ${totalProdukTerjual} Item`, 14, startY + 19);
    autoTable(doc, {
      startY: startY + 25,
      head: [['ID TRX', 'Tanggal', 'Pembeli', 'Produk', 'Jumlah', 'Total', 'Metode']],
      body: penjualanList.map(p => [
        p.id || '-',
        p.tanggal || '-',
        p.pembeli || '-',
        p.produk || '-',
        p.jumlah || '-',
        `Rp ${(p.total || 0).toLocaleString('id-ID')}`,
        p.metode || '-'
      ])
    });
    doc.save(`Laporan_Keuangan_Kantin_${new Date().getTime()}.pdf`);
    showNotification('Laporan berhasil didownload', 'success');
  }
  const { totalPendapatan, totalProdukTerjual, dataBulanan, produkTerlaris } = useMemo(() => {
    let totalP = 0;
    let totalItem = 0;
    const bulanMap: Record<string, number> = {};
    const produkMap: Record<string, { qty: number, rev: number }> = {};
    penjualanList.forEach(p => {
      const val = parseInt(p.total) || 0;
      const qty = parseInt(p.jumlah) || 0;
      totalP += val;
      totalItem += qty;
      // Extrapolate month (simplistic handling assuming format DD/MM/YYYY)
      let monthStr = 'Bulan Ini';
      if (p.tanggal && typeof p.tanggal === 'string') {
        const parts = p.tanggal.split(' ')[0].split('/');
        if (parts.length === 3) {
            const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            if (!isNaN(date.getTime())) {
                monthStr = date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
            }
        }
      }
      bulanMap[monthStr] = (bulanMap[monthStr] || 0) + val;
      
      const prodName = p.produk || 'Unknown';
      if (!produkMap[prodName]) produkMap[prodName] = { qty: 0, rev: 0 };
      produkMap[prodName].qty += qty;
      produkMap[prodName].rev += val;
    });
    const dBulanan = Object.keys(bulanMap).map(k => ({ name: k, total: bulanMap[k] })).slice(-6); // last 6 months
    
    // Sort dBulanan somehow, but let's assume it's just keys for now
    
    // Default fallback if no data
    if (dBulanan.length === 0) {
       dBulanan.push({ name: 'Minggu Ini', total: 0 });
    }
    const pTerlaris = Object.keys(produkMap)
      .map(k => ({ name: k, qty: produkMap[k].qty, pendapatan: produkMap[k].rev }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5); // top 5
    return { totalPendapatan: totalP, totalProdukTerjual: totalItem, dataBulanan: dBulanan, produkTerlaris: pTerlaris };
  }, [penjualanList]);
  return (
    <div className="max-w-7xl mx-auto pb-24 lg:pb-12 space-y-6 mt-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-5">
           <div className="w-16 h-16 bg-[#8B5CF6]/10 text-[#8B5CF6] rounded-2xl flex items-center justify-center">
             <RpIcon className="w-8 h-8" />
           </div>
           <div>
             <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Data Keuangan Kantin</h1>
             <p className="text-slate-500 dark:text-slate-400">Analisis dan rekapitulasi pendapatan dari seluruh penjualan kantin.</p>
           </div>
        </div>
        <button onClick={handleDownload} className="flex items-center gap-2 bg-[#8B5CF6] hover:bg-purple-600 text-white px-5 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-purple-500/20 whitespace-nowrap">
          <FileDown className="w-5 h-5" /> Cetak Laporan Keuangan
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] rounded-3xl p-6 lg:p-8 text-white shadow-lg shadow-purple-500/20 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <span className="text-purple-100 font-medium mb-2 block">Total Pendapatan (Keseluruhan)</span>
            <div className="text-4xl font-bold tracking-tight">Rp {totalPendapatan.toLocaleString('id-ID')}</div>
            <div className="mt-4 flex items-center gap-2 text-sm text-purple-100">
               <TrendingUp className="w-4 h-4 text-emerald-300" />
               <span>Akumulasi dari {penjualanList.length} transaksi selesai</span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl flex items-center justify-center shrink-0">
               <Package className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
               <span className="text-slate-500 font-medium mb-1 block">Total Produk/Porsi Terjual</span>
               <div className="text-3xl font-bold text-slate-800 dark:text-white">{totalProdukTerjual} <span className="text-lg text-slate-500 font-medium">Item</span></div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Chart Pendapatan */}
         <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Grafik Pendapatan</h3>
            <div className="h-72 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dataBulanan} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `Rp ${val / 1000}k`} />
                    <Tooltip 
                      formatter={(val: number) => [`Rp ${val.toLocaleString('id-ID')}`, 'Pendapatan']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Area type="monotone" dataKey="total" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>
         {/* Produk Terlaris */}
         <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Produk Terlaris</h3>
            <div className="space-y-4">
               {produkTerlaris.length > 0 ? produkTerlaris.map((p, i) => (
                 <div key={i} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                    <div>
                       <span className="font-semibold text-slate-800 dark:text-white block mb-1">{p.name}</span>
                       <span className="text-xs font-medium text-slate-500 bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">Terjual {p.qty}</span>
                    </div>
                    <div className="font-bold text-[#8B5CF6]">
                       Rp {p.pendapatan.toLocaleString('id-ID')}
                    </div>
                 </div>
               )) : (
                 <div className="text-center py-10 text-slate-500">
                    Belum ada data penjualan
                 </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}
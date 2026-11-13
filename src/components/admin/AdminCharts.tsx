import { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
export function AdminCharts() {
  const [chartData, setChartData] = useState({
    demographics: [] as any[],
    financials: [] as any[],
    dailyTransactions: [] as any[],
  });
  useEffect(() => {
    const loadData = () => {
      // 1. Demographics
      const siswa = JSON.parse(localStorage.getItem('sd_db_siswa') || '[]').length;
      const guru = JSON.parse(localStorage.getItem('sd_db_guru') || '[]').length;
      const tendik = JSON.parse(localStorage.getItem('sd_db_tendik') || '[]').length;
      const ortu = JSON.parse(localStorage.getItem('sd_db_ortu') || '[]').length;
      const mitra = JSON.parse(localStorage.getItem('sd_db_mitra') || '[]').length;
      // 2. Financials Current Status
      const sumAmount = (list: any[], keyName: string = 'nominal') => list.reduce((acc, curr) => acc + (Number(curr[keyName]) || Number(curr.amount) || Number(curr.total) || 0), 0);
      
      const pembayaran = JSON.parse(localStorage.getItem('sd_pembayaran_list') || '[]');
      const pemasukan = JSON.parse(localStorage.getItem('sd_pemasukan_list') || '[]');
      const pengeluaran = JSON.parse(localStorage.getItem('sd_pengeluaran_list') || '[]');
      const topup = JSON.parse(localStorage.getItem('sd_topup_koin_list') || '[]');
      const totalPembayaran = sumAmount(pembayaran, 'nominalDibayar');
      const totalPemasukan = sumAmount(pemasukan, 'nominal');
      const totalPengeluaran = sumAmount(pengeluaran, 'nominal');
      const totalTopup = sumAmount(topup, 'nominal');
      const saldoAkhir = (totalPembayaran + totalPemasukan) - totalPengeluaran;
      // 3. Daily Transactions (approximate grouping by date over the past 7 days)
      const last7Days = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();
      const processDate = (dateStr: string) => {
          if (!dateStr) return '';
          if (dateStr.includes('/')) {
              const [d, m, y] = dateStr.split('/');
              return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
          }
          return dateStr.split('T')[0];
      };
      const txData = last7Days.map(date => {
        // Find transactions on this date
        const pay = pembayaran.filter((x: any) => processDate(x.date || x.createdAt) === date).length;
        const pem = pemasukan.filter((x: any) => processDate(x.date || x.createdAt) === date).length;
        const peng = pengeluaran.filter((x: any) => processDate(x.date || x.createdAt) === date).length;
        return {
          date: date.substring(5), // MM-DD
          Transaksi: pay + pem + peng
        };
      });
      setChartData({
        demographics: [
          { name: 'Siswa', value: siswa },
          { name: 'Guru', value: guru },
          { name: 'Tendik', value: tendik },
          { name: 'Orang Tua', value: ortu },
          { name: 'Mitra', value: mitra },
        ],
        financials: [
          { name: 'Pembayaran', current: totalPembayaran },
          { name: 'Pemasukan', current: totalPemasukan },
          { name: 'Pengeluaran', current: totalPengeluaran },
          { name: 'Top Up Koin', current: totalTopup },
          { name: 'Saldo Sekolah', current: saldoAkhir },
        ],
        dailyTransactions: txData
      });
    };
    loadData();
    window.addEventListener('localStorageUpdate', loadData);
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('localStorageUpdate', loadData);
      window.removeEventListener('storage', loadData);
    };
  }, []);
  const COLORS = ['#3B82F6', '#10B981', '#6366F1', '#F59E0B', '#EC4899'];
  const FIN_COLORS = ['#3B82F6', '#10B981', '#F43F5E', '#F59E0B', '#8B5CF6'];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8">
      {/* Chart: Demographics (Pie) */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-3xl rounded-2xl p-4 md:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)] border border-white/20 dark:border-white/20 transition-all duration-500">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Demografi Pengguna</h3>
        <div className="h-64 shadow-inner rounded-xl bg-white/50 dark:bg-slate-900/40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData.demographics}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
              >
                {chartData.demographics.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} Orang`, 'Jumlah']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Chart: Tren Transaksi Harian (Line) */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-3xl rounded-2xl p-4 md:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)] border border-white/20 dark:border-white/20 transition-all duration-500">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Tren Transaksi (7 Hari Terakhir)</h3>
        <div className="h-64 pt-4 shadow-inner rounded-xl bg-white/50 dark:bg-slate-900/40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.dailyTransactions} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
              <XAxis dataKey="date" tick={{fontSize: 12}} />
              <YAxis allowDecimals={false} tick={{fontSize: 12}} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Transaksi" stroke="#3B82F6" strokeWidth={3} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Chart: Ringkasan Keuangan (Bar) */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-3xl rounded-2xl p-4 md:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)] border border-white/20 dark:border-white/20 lg:col-span-2 transition-all duration-500">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Ringkasan Nilai Keuangan</h3>
        <div className="h-72 pt-4 shadow-inner rounded-xl bg-white/50 dark:bg-slate-900/40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.financials} margin={{ top: 5, right: 30, left: 30, bottom: 5 }} barSize={50}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
              <XAxis dataKey="name" tick={{fontSize: 12}} />
              <YAxis 
                tickFormatter={(value) => value >= 1000000 ? `Rp${(value/1000000).toFixed(1)}M` : `Rp${(value/1000).toFixed(0)}K`} 
                tick={{fontSize: 12}} 
              />
              <Tooltip 
                formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Total']}
                cursor={{fill: 'transparent'}}
              />
              <Bar dataKey="current" radius={[6, 6, 0, 0]}>
                {chartData.financials.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={FIN_COLORS[index % FIN_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
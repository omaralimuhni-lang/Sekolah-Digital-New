import { useAppContext } from '../AppContext';
import { 
  Settings2, ShieldCheck,
  TrendingUp, TrendingDown, CalendarCheck,
  Building2, FileText, Store, Coffee, Megaphone, BarChart3,
  Users, UsersRound, GraduationCap, Users2, Handshake,
  AppWindow, LayoutTemplate, CalendarDays, Clock, UserCog,
  PanelTop, Wifi, Database, FileOutput, Server, HardDriveUpload, BookOpen
} from 'lucide-react';
import { ProfileCard } from '../components/ui/ProfileCard';
import { Calendar } from '../components/ui/Calendar';
import { DashboardCard } from '../components/ui/DashboardCard';
import { RpIcon } from '../components/ui/RpIcon';
import { AdminCharts } from '../components/admin/AdminCharts';
export function AdminDashboard() {
  const {   navigate } = useAppContext();
  return (
    <div className="max-w-7xl mx-auto pb-6 lg:flex lg:gap-8 lg:items-start lg:py-8">
      {/* Desktop Left Sidebar / Mobile Top */}
      <div className="lg:w-[350px] shrink-0 lg:sticky lg:top-8 flex flex-col gap-6">
        {/* 3. Kartu profil diposisi paling atas */}
        <ProfileCard />
        
        {/* 4. Kalender Pendidikan diletakan di bawah kartu profil */}
        <Calendar />
      </div>
      {/* Admin Menus */}
      <div className="lg:flex-1 mt-8 lg:mt-0 space-y-10 mb-8 w-full">
        
        <AdminCharts />
        {/* Menu Admin (kategori) */}
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 px-2 drop-shadow-sm flex items-center space-x-2">
            <Settings2 className="w-5 h-5 text-indigo-500" />
            <span>Menu Admin</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 relative z-10">
            <DashboardCard
              title="Laporan Pembayaran"
              description="Data pembayaran siswa"
              icon={<RpIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
              iconBg="bg-blue-500"
              className="col-span-2 md:col-span-4 lg:col-span-2"
              onClick={() => navigate('Laporan Pembayaran')}
            />
            <DashboardCard
              title="Laporan Pemasukan"
              description="Data pemasukan keuangan ringkas"
              icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />}
              iconBg="bg-emerald-500"
              className="col-span-1 row-span-2 flex flex-col justify-between h-full"
              tall
              onClick={() => navigate('Laporan Pemasukan')}
            />
            <DashboardCard
              title="Laporan Pengeluaran"
              description="Detail biaya"
              icon={<TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />}
              iconBg="bg-rose-500"
              className="col-span-1"
              onClick={() => navigate('Laporan Pengeluaran')}
            />
             <DashboardCard
              title="Top Up Koin"
              description="Saldo koin"
              icon={<RpIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
              iconBg="bg-amber-500"
              className="col-span-1"
              onClick={() => navigate('Laporan Top Up Koin')}
            />
            <DashboardCard
              title="Laporan Keuangan"
              description="Rekap total keuangan"
              icon={<RpIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
              iconBg="bg-violet-500"
              className="col-span-2 md:col-span-4 lg:col-span-2"
              onClick={() => navigate('Laporan Keuangan')}
            />
            <DashboardCard
              title="Laporan Kehadiran"
              description="Statistik kehadiran"
              icon={<CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5" />}
              iconBg="bg-teal-500"
              className="col-span-1"
              onClick={() => navigate('Laporan Kehadiran')}
            />
            <DashboardCard
              title="Sarana & Prasarana"
              description="Inventaris"
              icon={<Building2 className="w-4 h-4 sm:w-5 sm:h-5" />}
              iconBg="bg-indigo-500"
              className="col-span-1"
              onClick={() => navigate('Data Sarana & Prasarana')}
            />
            <DashboardCard
              title="Arsip & Surat"
              description="Dokumen"
              icon={<FileText className="w-4 h-4 sm:w-5 sm:h-5" />}
              iconBg="bg-slate-500"
              className="col-span-1"
              onClick={() => navigate('Data Arsip & Surat')}
            />
            <DashboardCard
              title="Toko Sekolah"
              description="Belanja"
              icon={<Store className="w-4 h-4 sm:w-5 sm:h-5" />}
              iconBg="bg-pink-500"
              className="col-span-1"
              onClick={() => navigate('Data Toko Sekolah')}
            />
             <DashboardCard
              title="Kantin Sekolah"
              description="Pesanan"
              icon={<Coffee className="w-4 h-4 sm:w-5 sm:h-5" />}
              iconBg="bg-orange-500"
              className="col-span-1 border border-white/20"
              onClick={() => navigate('Data Kantin Sekolah')}
            />
             <DashboardCard
              title="Pengumuman"
              description="Papan info"
              icon={<Megaphone className="w-4 h-4 sm:w-5 sm:h-5" />}
              iconBg="bg-sky-500"
              className="col-span-1 border border-white/20"
              onClick={() => navigate('Data Pengumuman Sekolah')}
            />
            <DashboardCard
              title="Poling & Survei"
              description="Aspirasi warga"
              icon={<BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />}
              iconBg="bg-cyan-500"
              className="col-span-2"
              onClick={() => navigate('Data Poling & Survei Sekolah')}
            />
          </div>
        </div>
        {/* Database User (kategori) */}
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 px-2 drop-shadow-sm flex items-center space-x-2">
            <Users className="w-5 h-5 text-cyan-500" />
            <span>Database User</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 relative z-10">
            <DashboardCard
              title="Database Siswa"
              description="Data lengkap siswa"
              icon={<UsersRound className="w-5 h-5 sm:w-6 sm:h-6" />}
              iconBg="bg-blue-600"
              onClick={() => navigate('Database Siswa')}
            />
            <DashboardCard
              title="Database Guru"
              description="Data profil tenaga pendidik"
              icon={<GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />}
              iconBg="bg-emerald-600"
              onClick={() => navigate('Database Guru')}
            />
            <DashboardCard
              title="Database Tenaga Pendidik"
              description="Data staf dan karyawan"
              icon={<Users2 className="w-5 h-5 sm:w-6 sm:h-6" />}
              iconBg="bg-indigo-600"
              onClick={() => navigate('Database Tenaga Pendidik')}
            />
            <DashboardCard
              title="Database Orang Tua"
              description="Data wali siswa"
              icon={<Users className="w-5 h-5 sm:w-6 sm:h-6" />}
              iconBg="bg-amber-600"
              onClick={() => navigate('Database Orang Tua Siswa')}
            />
            <DashboardCard
              title="Database Mitra"
              description="Rekanan aplikasi"
              icon={<Handshake className="w-5 h-5 sm:w-6 sm:h-6" />}
              iconBg="bg-pink-600"
              onClick={() => navigate('Database Mitra')}
            />
          </div>
        </div>
        {/* Pengaturan Admin (kategori) */}
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 px-2 drop-shadow-sm flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <span>Pengaturan Admin</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 relative z-10">
            <DashboardCard
              title="Aplikasi"
              description="Konfigurasi"
              icon={<AppWindow className="w-4 h-4 sm:w-5 sm:h-5" />}
              iconBg="bg-slate-600"
              onClick={() => navigate('Pengaturan Aplikasi')}
            />
            <DashboardCard
              title="Tampilan"
              description="Tema & UI"
              icon={<LayoutTemplate className="w-4 h-4 sm:w-5 sm:h-5" />}
              iconBg="bg-violet-600"
              onClick={() => navigate('Pengaturan Tampilan')}
            />
            <DashboardCard
              title="Tahun Ajaran"
              description="Periode aktif"
              icon={<CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" />}
              iconBg="bg-teal-600"
              onClick={() => navigate('Pengaturan Tahun Ajaran')}
            />
            <DashboardCard
              title="Waktu Absensi"
              description="Jadwal jam masuk"
              icon={<Clock className="w-4 h-4 sm:w-5 sm:h-5" />}
              iconBg="bg-rose-600"
              onClick={() => navigate('Pengaturan Waktu Absensi')}
            />
            <DashboardCard
              title="Sub Admin"
              description="Akses"
              icon={<UserCog className="w-4 h-4 sm:w-5 sm:h-5" />}
              iconBg="bg-sky-600"
              onClick={() => navigate('Pengaturan Sub Admin')}
            />
            <DashboardCard
              title="Keuangan"
              description="Atur kas"
              icon={<RpIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
              iconBg="bg-emerald-700"
              onClick={() => navigate('Pengaturan Keuangan')}
            />
          </div>
        </div>
        {/* Pengaturan Sistem (kategori) */}
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 px-2 drop-shadow-sm flex items-center space-x-2">
            <Server className="w-5 h-5 text-slate-500" />
            <span>Pengaturan Sistem</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 relative z-10">
            <DashboardCard
              title="Pengaturan Bar"
              description="Navigasi"
              icon={<PanelTop className="w-4 h-4 sm:w-5 sm:h-5" />}
              iconBg="bg-slate-700"
              onClick={() => navigate('Pengaturan Bar')}
            />
            <DashboardCard
              title="Koneksi & API"
              description="Webhook"
              icon={<Wifi className="w-4 h-4 sm:w-5 sm:h-5" />}
              iconBg="bg-blue-700"
              onClick={() => navigate('Pengaturan Koneksi & API')}
            />
            <DashboardCard
              title="Database"
              description="Pemeliharaan"
              icon={<Database className="w-4 h-4 sm:w-5 sm:h-5" />}
              iconBg="bg-amber-700"
              onClick={() => navigate('Pengaturan Database')}
            />
            <DashboardCard
              title="Dokumen & Form"
              description="Template DOC"
              icon={<FileOutput className="w-4 h-4 sm:w-5 sm:h-5" />}
              iconBg="bg-teal-700"
              onClick={() => navigate('Pengaturan Dokumen & Template')}
            />
             <DashboardCard
              title="Bank Soal"
              description="Kumpulan soal"
              icon={<BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />}
              iconBg="bg-violet-700"
              onClick={() => navigate('Pengaturan Bank Soal')}
            />
             <DashboardCard
              title="Backup & Restore"
              description="Keamanan data"
              icon={<HardDriveUpload className="w-4 h-4 sm:w-5 sm:h-5" />}
              iconBg="bg-rose-700"
              onClick={() => navigate('Pengaturan Backup & Restore')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
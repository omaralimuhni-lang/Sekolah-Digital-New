import { useAppContext } from '../AppContext';
import { ProfileCard } from '../components/ui/ProfileCard';
import { Calendar } from '../components/ui/Calendar';
import { DashboardCard } from '../components/ui/DashboardCard';
import { Clock, Star, ClipboardList, UserCheck, BookOpen, Store, Coffee, Megaphone, BarChart3, TrendingUp, TrendingDown, Building2, FileText } from 'lucide-react';
import { RpIcon } from '../components/ui/RpIcon';
export function Dashboard() {
  const { user, navigate, badges } = useAppContext();
  return (
    <div className="max-w-7xl mx-auto pb-6 lg:flex lg:gap-8 lg:items-start lg:py-8">
      {/* Desktop Left Sidebar / Mobile Top */}
      <div className="lg:w-[350px] shrink-0 lg:sticky lg:top-8 flex flex-col gap-6">
        {/* 3. Kartu profil diposisi paling atas */}
        <ProfileCard />
        
        {/* 4. Kalender diletakan di bawah kartu profil */}
        <Calendar />
      </div>
      {/* Menu Bento Grid */}
      <div className="lg:flex-1 mt-8 lg:mt-0 w-full relative z-10">
      {user.role === 'siswa' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          <DashboardCard
            title="Absensi Siswa"
            description="Rekap kehadiran"
            icon={<UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />}
            iconBg="bg-emerald-500"
            className="col-span-2 md:col-span-4 lg:col-span-2"
            onClick={() => navigate('Absensi Siswa')}
          />
          <DashboardCard
            title="Jadwal Siswa"
            description="Jadwal mata pelajaran harian"
            icon={<Clock className="w-5 h-5 sm:w-6 sm:h-6" />}
            iconBg="bg-blue-500"
            className="col-span-1 row-span-2 flex flex-col justify-between h-full"
            tall
            onClick={() => navigate('Jadwal Siswa')}
          />
          <DashboardCard
            title="Keuangan Siswa"
            description="Info tagihan & pembayaran"
            icon={<RpIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
            iconBg="bg-violet-500"
            className="col-span-1"
            onClick={() => navigate('Keuangan Siswa')}
          />
          <DashboardCard
            title="PR & Tugas Siswa"
            description="Tugas tertunda"
            icon={<ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />}
            iconBg="bg-rose-500"
            className="col-span-1"
            badge={badges['PR & Tugas Siswa']?.toString()}
            onClick={() => navigate('PR & Tugas Siswa')}
          />
          <DashboardCard
            title="Penilaian & Raport Siswa"
            description="Cek nilai terbaru"
            icon={<Star className="w-5 h-5 sm:w-6 sm:h-6" />}
            iconBg="bg-amber-500"
            className="col-span-2 md:col-span-4 lg:col-span-2"
            badge={badges['Penilaian & Raport Siswa']?.toString()}
            onClick={() => navigate('Penilaian & Raport Siswa')}
          />
          <DashboardCard
            title="Toko Sekolah"
            description="Koperasi & peralatan"
            icon={<Store className="w-4 h-4 sm:w-5 sm:h-5" />}
            iconBg="bg-pink-500"
            className="col-span-1"
            onClick={() => navigate('Toko Sekolah')}
          />
          <DashboardCard
            title="Kantin Sekolah"
            description="Pesan makanan"
            icon={<Coffee className="w-4 h-4 sm:w-5 sm:h-5" />}
            iconBg="bg-orange-500"
            className="col-span-1 border border-white/20"
            onClick={() => navigate('Kantin Sekolah')}
          />
          <DashboardCard
            title="Pengumuman Sekolah"
            description="Info penting dari sekolah"
            icon={<Megaphone className="w-4 h-4 sm:w-5 sm:h-5" />}
            iconBg="bg-indigo-500"
            className="col-span-1 border border-white/20"
            onClick={() => navigate('Pengumuman Sekolah')}
          />
          <DashboardCard
            title="Poling & Survei Sekolah"
            description="Beri masukan"
            icon={<BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />}
            iconBg="bg-teal-500"
            className="col-span-1 md:col-span-2 lg:col-span-1"
            onClick={() => navigate('Poling & Survei Sekolah')}
          />
        </div>
      ) : user.role === 'guru' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          <DashboardCard
            title="Absensi Guru"
            description="Kehadiran guru"
            icon={<UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />}
            iconBg="bg-[#10B981]"
            className="col-span-2 md:col-span-4 lg:col-span-2"
            onClick={() => navigate('Absensi Guru')}
          />
          <DashboardCard
            title="Jadwal Guru"
            description="Jadwal mengajar"
            icon={<Clock className="w-5 h-5 sm:w-6 sm:h-6" />}
            iconBg="bg-[#2196F3]"
            className="col-span-1 row-span-2 flex flex-col justify-between h-full"
            tall
            onClick={() => navigate('Jadwal Guru')}
          />
          <DashboardCard
            title="Kelas Guru"
            description="Manajemen kelas"
            icon={<BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />}
            iconBg="bg-[#64748B]"
            className="col-span-1"
            onClick={() => navigate('Kelas Guru')}
          />
          <DashboardCard
            title="Kehadiran Siswa"
            description="Absensi murid"
            icon={<UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />}
            iconBg="bg-[#3B82F6]"
            className="col-span-1"
            onClick={() => navigate('Kehadiran Siswa')}
          />
          <DashboardCard
            title="Keuangan Siswa"
            description="Info pembayaran"
            icon={<RpIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
            iconBg="bg-[#8B5CF6]"
            className="col-span-1"
            onClick={() => navigate('Keuangan Siswa')}
          />
          <DashboardCard
            title="PR & Tugas Siswa"
            description="Tugas kelas"
            icon={<ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />}
            iconBg="bg-[#F43F5E]"
            className="col-span-1"
            badge={badges['PR & Tugas Siswa']?.toString()}
            onClick={() => navigate('PR & Tugas Siswa')}
          />
          <DashboardCard
            title="Penilaian & Raport Siswa"
            description="Entri nilai"
            icon={<Star className="w-5 h-5 sm:w-6 sm:h-6" />}
            iconBg="bg-[#FF9800]"
            className="col-span-2 md:col-span-4 lg:col-span-2"
            badge={badges['Penilaian & Raport Siswa']?.toString()}
            onClick={() => navigate('Penilaian & Raport Siswa')}
          />
          <DashboardCard
            title="Toko Sekolah"
            description="Koperasi & seragam"
            icon={<Store className="w-4 h-4 sm:w-5 sm:h-5" />}
            iconBg="bg-[#EC4899]"
            className="col-span-1"
            onClick={() => navigate('Toko Sekolah')}
          />
          <DashboardCard
            title="Kantin Sekolah"
            description="Pesan makanan"
            icon={<Coffee className="w-4 h-4 sm:w-5 sm:h-5" />}
            iconBg="bg-[#F97316]"
            className="col-span-1 border border-white/20"
            onClick={() => navigate('Kantin Sekolah')}
          />
          <DashboardCard
            title="Pengumuman Sekolah"
            description="Info penting"
            icon={<Megaphone className="w-4 h-4 sm:w-5 sm:h-5" />}
            iconBg="bg-[#3B82F6]"
            className="col-span-1 border border-white/20"
            onClick={() => navigate('Pengumuman Sekolah')}
          />
          <DashboardCard
            title="Poling & Survei Sekolah"
            description="Berikan aspirasi"
            icon={<BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />}
            iconBg="bg-[#14B8A6]"
            className="col-span-1 md:col-span-2 lg:col-span-1"
            onClick={() => navigate('Poling & Survei Sekolah')}
          />
        </div>
      ) : user.role === 'tendik' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {(() => {
            let userAkses: string[] | undefined;
            try {
              const akses = JSON.parse(localStorage.getItem('sd_akses_penginput') || '{}');
              userAkses = akses[user.name];
            } catch(e) {}
            const hasAccess = (menu: string) => !userAkses || userAkses.includes(menu);
            return (
              <>
                <DashboardCard
                  title="Absensi Tenaga Pendidik"
                  description="Kehadiran staf"
                  icon={<UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />}
                  iconBg="bg-[#10B981]"
                  className="col-span-2 md:col-span-4 lg:col-span-2"
                  onClick={() => navigate('Absensi Tenaga Pendidik')}
                />
                {hasAccess('Input Pembayaran') && (
                  <DashboardCard
                    title="Input Pembayaran"
                    description="Catat pembayaran"
                    icon={<RpIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                    iconBg="bg-[#2196F3]"
                    className="col-span-1 row-span-2 flex flex-col justify-between h-full"
                    tall
                    onClick={() => navigate('Input Pembayaran')}
                  />
                )}
                {hasAccess('Input Pemasukan') && (
                  <DashboardCard
                    title="Input Pemasukan"
                    description="Catat pemasukan"
                    icon={<TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />}
                    iconBg="bg-[#10B981]"
                    className="col-span-1 md:col-span-2 lg:col-span-1"
                    onClick={() => navigate('Input Pemasukan')}
                  />
                )}
                {hasAccess('Input Pengeluaran') && (
                  <DashboardCard
                    title="Input Pengeluaran"
                    description="Catat pengeluaran"
                    icon={<TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />}
                    iconBg="bg-[#F43F5E]"
                    className="col-span-1 md:col-span-2 lg:col-span-1"
                    onClick={() => navigate('Input Pengeluaran')}
                  />
                )}
                {hasAccess('Input Top Up Koin') && (
                  <DashboardCard
                    title="Input Top Up Koin"
                    description="Isi saldo koin"
                    icon={<RpIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                    iconBg="bg-[#F59E0B]"
                    className="col-span-1 md:col-span-2 lg:col-span-1"
                    onClick={() => navigate('Input Top Up Koin')}
                  />
                )}
                {hasAccess('Input Data Sarana & Prasarana') && (
                  <DashboardCard
                    title="Input Data Sarana & Prasarana"
                    description="Inventaris sekolah"
                    icon={<Building2 className="w-5 h-5 sm:w-6 sm:h-6" />}
                    iconBg="bg-[#6366F1]"
                    className="col-span-1 md:col-span-2 lg:col-span-1"
                    onClick={() => navigate('Input Data Sarana & Prasarana')}
                  />
                )}
                {hasAccess('Input Data Arsip & Surat') && (
                  <DashboardCard
                    title="Input Data Arsip & Surat"
                    description="Kelola dokumen"
                    icon={<FileText className="w-5 h-5 sm:w-6 sm:h-6" />}
                    iconBg="bg-[#64748B]"
                    className="col-span-2 md:col-span-4 lg:col-span-2"
                    onClick={() => navigate('Input Data Arsip & Surat')}
                  />
                )}
                {hasAccess('Input Pengumuman Sekolah') && (
                  <DashboardCard
                    title="Input Pengumuman Sekolah"
                    description="Buat pengumuman"
                    icon={<Megaphone className="w-4 h-4 sm:w-5 sm:h-5" />}
                    iconBg="bg-[#3B82F6]"
                    className="col-span-1 row-span-2 flex flex-col justify-between h-full"
                    tall
                    onClick={() => navigate('Input Pengumuman Sekolah')}
                  />
                )}
                {hasAccess('Input Poling & Survei Sekolah') && (
                  <DashboardCard
                    title="Input Poling & Survei Sekolah"
                    description="Buat poling"
                    icon={<BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />}
                    iconBg="bg-[#14B8A6]"
                    className="col-span-1 md:col-span-2 lg:col-span-1"
                    onClick={() => navigate('Input Poling & Survei Sekolah')}
                  />
                )}
                {hasAccess('Input Toko Sekolah') && (
                  <DashboardCard
                    title="Input Toko Sekolah"
                    description="Kelola toko"
                    icon={<Store className="w-4 h-4 sm:w-5 sm:h-5" />}
                    iconBg="bg-[#EC4899]"
                    className="col-span-1 md:col-span-2 lg:col-span-1"
                    onClick={() => navigate('Input Toko Sekolah')}
                  />
                )}
                <DashboardCard
                  title="Kantin Sekolah"
                  description="Pesanan kantin"
                  icon={<Coffee className="w-5 h-5 sm:w-6 sm:h-6" />}
                  iconBg="bg-[#F97316]"
                  className="col-span-2 md:col-span-2 lg:col-span-2"
                  onClick={() => navigate('Kantin Sekolah')}
                />
              </>
            );
          })()}
        </div>
      ) : user.role === 'ortu' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          <DashboardCard
            title="Kehadiran Anak"
            description="Pantau absensi"
            icon={<UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />}
            iconBg="bg-[#10B981]"
            className="col-span-2 md:col-span-4 lg:col-span-2"
            onClick={() => navigate('Kehadiran Anak')}
          />
          <DashboardCard
            title="Jadwal Anak"
            description="Kegiatan harian"
            icon={<Clock className="w-5 h-5 sm:w-6 sm:h-6" />}
            iconBg="bg-[#2196F3]"
            className="col-span-1 row-span-2 flex flex-col justify-between h-full"
            tall
            onClick={() => navigate('Jadwal Anak')}
          />
          <DashboardCard
            title="Penilaian & Raport Anak"
            description="Nilai akademik"
            icon={<Star className="w-4 h-4 sm:w-5 sm:h-5" />}
            iconBg="bg-[#FF9800]"
            className="col-span-1"
            badge={badges['Penilaian & Raport Anak']?.toString()}
            onClick={() => navigate('Penilaian & Raport Anak')}
          />
          <DashboardCard
            title="Keuangan Anak"
            description="Tagihan sekolah"
            icon={<RpIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
            iconBg="bg-[#8B5CF6]"
            className="col-span-1"
            onClick={() => navigate('Keuangan Anak')}
          />
          <DashboardCard
            title="Toko Sekolah"
            description="Keperluan alat"
            icon={<Store className="w-5 h-5 sm:w-6 sm:h-6" />}
            iconBg="bg-[#EC4899]"
            className="col-span-2 md:col-span-4 lg:col-span-2"
             onClick={() => navigate('Toko Sekolah')}
          />
          <DashboardCard
            title="Pengumuman Sekolah"
            description="Info terbaru"
            icon={<Megaphone className="w-4 h-4 sm:w-5 sm:h-5" />}
            iconBg="bg-[#3B82F6]"
            className="col-span-1 border border-white/20"
            onClick={() => navigate('Pengumuman Sekolah')}
          />
          <DashboardCard
            title="Poling & Survei Sekolah"
            description="Aspirasi ortu"
            icon={<BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />}
            iconBg="bg-[#14B8A6]"
            className="col-span-1 md:col-span-2 lg:col-span-1"
            onClick={() => navigate('Poling & Survei Sekolah')}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          <DashboardCard
            title="Absensi Mitra"
            description="Rekap kehadiran"
            icon={<UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />}
            iconBg="bg-[#10B981]"
            className="col-span-2 md:col-span-4 lg:col-span-2"
            onClick={() => navigate('Absensi Mitra')}
          />
          <DashboardCard
            title="Input Produk/Menu Kantin"
            description="Kelola produk kantin"
            icon={<Coffee className="w-5 h-5 sm:w-6 sm:h-6" />}
            iconBg="bg-[#F97316]"
            className="col-span-1 row-span-2 flex flex-col justify-between h-full"
            tall
            onClick={() => navigate('Input Produk/Menu Kantin')}
          />
          <DashboardCard
            title="Pesanan Masuk Kantin"
            description="Daftar pesanan baru"
            icon={<ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />}
            iconBg="bg-[#F43F5E]"
            className="col-span-1"
            badge={badges['Pesanan Masuk Kantin']?.toString()}
            onClick={() => navigate('Pesanan Masuk Kantin')}
          />
          <DashboardCard
            title="Data Penjualan Kantin"
            description="Statistik rekap"
            icon={<BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />}
            iconBg="bg-[#2196F3]"
            className="col-span-1"
            onClick={() => navigate('Data Penjualan Kantin')}
          />
          <DashboardCard
            title="Data Keuangan Kantin"
            description="Catatan transaksi keuangan"
            icon={<RpIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
            iconBg="bg-[#8B5CF6]"
            className="col-span-2 md:col-span-4 lg:col-span-2"
            onClick={() => navigate('Data Keuangan Kantin')}
          />
        </div>
      )}
      </div>
    </div>
  );
}
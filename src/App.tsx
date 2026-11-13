import React from 'react';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { AppProvider, useAppContext } from './AppContext';
import { AppConfigurationProvider } from './AppConfigurationContext';
import { PRTugasProvider } from './PRTugasContext';
import { MainLayout } from './components/layout/MainLayout';
import { Notification } from './components/ui/Notification';
import { LogoutModal } from './components/ui/LogoutModal';
import { OfflineBanner } from './components/ui/OfflineBanner';
import { ErrorBoundary, withErrorBoundary } from './components/hoc/withErrorBoundary';
import { DatabaseSiswa } from './views/admin/DatabaseSiswa';
import { DatabaseGuru } from './views/admin/DatabaseGuru';
import { DatabaseTenagaPendidik } from './views/admin/DatabaseTenagaPendidik';
import { DatabaseOrangTua } from './views/admin/DatabaseOrangTua';
import { DatabaseMitra } from './views/admin/DatabaseMitra';
import { Login } from './views/Login';
import { AdminDashboard } from './views/AdminDashboard';
import { Dashboard } from './views/Dashboard';
import { GenericPage } from './views/GenericPage';
import { PengaturanBar } from './views/PengaturanBar';
import { InputPembayaran } from './views/tendik/InputPembayaran';
import { InputPengeluaran } from './views/tendik/InputPengeluaran';
import { InputPemasukan } from './views/tendik/InputPemasukan';
import { InputSarpras } from './views/tendik/InputSarpras';
import { InputPengumuman } from './views/tendik/InputPengumuman';
import { InputPolingSurvei } from './views/tendik/InputPolingSurvei';
import { InputTokoSekolah } from './views/tendik/InputTokoSekolah';
import { DataPenjualanToko } from './views/tendik/DataPenjualanToko';
import { InputProdukKantin } from './views/mitra/InputProdukKantin';
import { InputArsipSurat } from './views/tendik/InputArsipSurat';
import { KantinSekolah } from './views/shared/KantinSekolah';
import { TokoSekolah } from './views/shared/TokoSekolah';
import { PengumumanSekolah } from './views/shared/PengumumanSekolah';
import { PolingSurveiSekolah } from './views/shared/PolingSurveiSekolah';
import { LaporanPembayaran } from './views/admin/LaporanPembayaran';
import { LaporanPemasukan } from './views/admin/LaporanPemasukan';
import { LaporanPengeluaran } from './views/admin/LaporanPengeluaran';
import { LaporanTopUpKoin } from './views/admin/LaporanTopUpKoin';
import { LaporanKeuangan } from './views/admin/LaporanKeuangan';
import { DataSarpras } from './views/admin/DataSarpras';
import { DataArsipSurat } from './views/admin/DataArsipSurat';
import { DataTokoSekolah } from './views/admin/DataTokoSekolah';
import { DataKantinSekolah } from './views/admin/DataKantinSekolah';
import { DataPengumumanSekolah } from './views/admin/DataPengumumanSekolah';
import { DataPolingSurveiSekolah } from './views/admin/DataPolingSurveiSekolah';
import { PengaturanKeuangan } from './views/admin/PengaturanKeuangan';
import { PengaturanAplikasi } from './views/admin/PengaturanAplikasi';
import { PengaturanTampilan } from './views/admin/PengaturanTampilan';
import { PengaturanTahunAjaran } from './views/admin/PengaturanTahunAjaran';
import { PengaturanWaktuAbsensi } from './views/admin/PengaturanWaktuAbsensi';
import { PengaturanSubAdmin } from './views/admin/PengaturanSubAdmin';
import { PengaturanKoneksiAPI } from './views/admin/PengaturanKoneksiAPI';
import { PengaturanDokumenTemplate } from './views/admin/PengaturanDokumenTemplate';
import { PengaturanDatabase } from './views/admin/PengaturanDatabase';
import { PengaturanBankSoal } from './views/admin/PengaturanBankSoal';
import { LogAktivitas } from './views/admin/LogAktivitas';
import { LaporanKehadiran } from './views/admin/LaporanKehadiran';
import { KehadiranSiswa } from './views/guru/KehadiranSiswa';
import { KehadiranAnak } from './views/ortu/KehadiranAnak';
import { InputTopUpKoin } from './views/tendik/InputTopUpKoin';
import { PesananMasukKantin } from './views/mitra/PesananMasukKantin';
import { DataPenjualanKantin } from './views/mitra/DataPenjualanKantin';
import { DataKeuanganKantin } from './views/mitra/DataKeuanganKantin';
import { InputJadwalSiswa } from './views/guru/InputJadwalSiswa';
import { JadwalGuru } from './views/guru/JadwalGuru';
import { JadwalSiswa } from './views/siswa/JadwalSiswa';
import { KeuanganSiswa } from './views/siswa/KeuanganSiswa';
import { KeuanganSiswaGuru } from './views/guru/KeuanganSiswaGuru';
import { KelasGuru } from './views/guru/KelasGuru';
import { PRTugasGuru } from './views/guru/PRTugasGuru';
import { PRTugasSiswa } from './views/siswa/PRTugasSiswa';
import { PenilaianRaportGuru } from './views/guru/PenilaianRaportGuru';
import { PenilaianRaportSiswa } from './views/siswa/PenilaianRaportSiswa';
import AbsensiAction from './views/shared/AbsensiAction';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MobileBottomSheet } from './components/ui/MobileBottomSheet';
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  return isMobile;
}
const AppContent = React.memo(() => {
  const { user, activePage, navigate } = useAppContext();
  const isMobile = useIsMobile();
  const handleCloseBottomSheet = React.useCallback(() => {
    navigate('Beranda');
  }, [navigate]);
  if (!user) {
    return <Login />;
  }
  const isHome = activePage === 'Beranda';
  const berandaContent = user.role === 'admin' ? <AdminDashboard /> : <Dashboard />;
  
  let childContent;
  if (activePage === 'Pengaturan Bar' && user.role === 'admin') {
    childContent = <PengaturanBar />;
  } else if (activePage === 'Database Siswa' && user.role === 'admin') {
    childContent = <DatabaseSiswa />;
  } else if (activePage === 'Database Guru' && user.role === 'admin') {
    childContent = <DatabaseGuru />;
  } else if (activePage === 'Database Tenaga Pendidik' && user.role === 'admin') {
    childContent = <DatabaseTenagaPendidik />;
  } else if (activePage === 'Database Orang Tua Siswa' && user.role === 'admin') {
    childContent = <DatabaseOrangTua />;
  } else if (activePage === 'Database Mitra' && user.role === 'admin') {
    childContent = <DatabaseMitra />;
  } else if (activePage === 'Input Pembayaran' && user.role === 'tendik') {
    childContent = <InputPembayaran />;
  } else if (activePage === 'Input Pengeluaran' && user.role === 'tendik') {
    childContent = <InputPengeluaran />;
  } else if (activePage === 'Input Pemasukan' && user.role === 'tendik') {
    childContent = <InputPemasukan />;
  } else if (activePage === 'Input Top Up Koin' && user.role === 'tendik') {
    childContent = <InputTopUpKoin />;
  } else if (activePage === 'Input Data Sarana & Prasarana' && (user.role === 'tendik' || user.role === 'admin')) {
    childContent = <InputSarpras />;
  } else if (activePage === 'Input Pengumuman Sekolah' && (user.role === 'tendik' || user.role === 'admin')) {
    childContent = <InputPengumuman />;
  } else if (activePage === 'Input Poling & Survei Sekolah' && (user.role === 'admin' || user.role === 'tendik')) {
    childContent = <InputPolingSurvei />;
  } else if (activePage === 'Input Toko Sekolah' && user.role === 'tendik') {
    childContent = <InputTokoSekolah />;
  } else if (activePage === 'Data Penjualan Toko' && user.role === 'tendik') {
    childContent = <DataPenjualanToko />;
  } else if (activePage === 'Input Data Arsip & Surat' && (user.role === 'tendik' || user.role === 'admin')) {
    childContent = <InputArsipSurat />;
  } else if (activePage === 'Input Produk/Menu Kantin' && user.role === 'mitra') {
    childContent = <InputProdukKantin />;
  } else if (activePage === 'Pesanan Masuk Kantin' && user.role === 'mitra') {
    childContent = <PesananMasukKantin />;
  } else if (activePage === 'Data Penjualan Kantin' && user.role === 'mitra') {
    childContent = <DataPenjualanKantin />;
  } else if (activePage === 'Data Keuangan Kantin' && user.role === 'mitra') {
    childContent = <DataKeuanganKantin />;
  } else if (activePage === 'Kantin Sekolah' && (user.role === 'siswa' || user.role === 'guru' || user.role === 'tendik')) {
    childContent = <KantinSekolah />;
  } else if (activePage === 'Toko Sekolah' && (user.role === 'siswa' || user.role === 'guru' || user.role === 'tendik' || user.role === 'ortu')) {
    childContent = <TokoSekolah />;
  } else if (activePage === 'Pengumuman Sekolah') {
    childContent = <PengumumanSekolah />;
  } else if (activePage === 'Poling & Survei Sekolah') {
    childContent = <PolingSurveiSekolah />;
  } else if (activePage === 'Laporan Pembayaran' && user.role === 'admin') {
    childContent = <LaporanPembayaran />;
  } else if (activePage === 'Laporan Pemasukan' && user.role === 'admin') {
    childContent = <LaporanPemasukan />;
  } else if (activePage === 'Laporan Pengeluaran' && user.role === 'admin') {
    childContent = <LaporanPengeluaran />;
  } else if (activePage === 'Laporan Top Up Koin' && user.role === 'admin') {
    childContent = <LaporanTopUpKoin />;
  } else if (activePage === 'Laporan Keuangan' && user.role === 'admin') {
    childContent = <LaporanKeuangan />;
  } else if (activePage === 'Laporan Kehadiran' && user.role === 'admin') {
    childContent = <LaporanKehadiran />;
  } else if (activePage === 'Data Sarana & Prasarana' && user.role === 'admin') {
    childContent = <DataSarpras />;
  } else if (activePage === 'Data Arsip & Surat' && user.role === 'admin') {
    childContent = <DataArsipSurat />;
  } else if (activePage === 'Data Toko Sekolah' && user.role === 'admin') {
    childContent = <DataTokoSekolah />;
  } else if (activePage === 'Data Kantin Sekolah' && user.role === 'admin') {
    childContent = <DataKantinSekolah />;
  } else if (activePage === 'Data Pengumuman Sekolah' && user.role === 'admin') {
    childContent = <DataPengumumanSekolah />;
  } else if (activePage === 'Data Poling & Survei Sekolah' && user.role === 'admin') {
    childContent = <DataPolingSurveiSekolah />;
  } else if (activePage === 'Pengaturan Keuangan' && user.role === 'admin') {
    childContent = <PengaturanKeuangan />;
  } else if (activePage === 'Pengaturan Aplikasi' && user.role === 'admin') {
    childContent = <PengaturanAplikasi />;
  } else if (activePage === 'Pengaturan Tampilan' && user.role === 'admin') {
    childContent = <PengaturanTampilan />;
  } else if (activePage === 'Pengaturan Tahun Ajaran' && user.role === 'admin') {
    childContent = <PengaturanTahunAjaran />;
  } else if (activePage === 'Pengaturan Waktu Absensi' && user.role === 'admin') {
    childContent = <PengaturanWaktuAbsensi />;
  } else if (activePage === 'Pengaturan Sub Admin' && user.role === 'admin') {
    childContent = <PengaturanSubAdmin />;
  } else if (activePage === 'Pengaturan Koneksi & API' && user.role === 'admin') {
    childContent = <PengaturanKoneksiAPI />;
  } else if (activePage === 'Pengaturan Database' && user.role === 'admin') {
    childContent = <PengaturanDatabase />;
  } else if (activePage === 'Pengaturan Bank Soal' && user.role === 'admin') {
    childContent = <PengaturanBankSoal />;
  } else if (activePage === 'Pengaturan Dokumen & Template' && user.role === 'admin') {
    childContent = <PengaturanDokumenTemplate />;
  } else if (activePage === 'Log Aktivitas' && user.role === 'admin') {
    childContent = <LogAktivitas />;
  } else if (activePage === 'Jadwal Guru' && user.role === 'guru') {
    childContent = <JadwalGuru />;
  } else if (activePage === 'Kelas Guru' && user.role === 'guru') {
    childContent = <KelasGuru />;
  } else if (activePage === 'Kehadiran Siswa' && user.role === 'guru') {
    childContent = <KehadiranSiswa />;
  } else if (['Absensi Siswa', 'Absensi Guru', 'Absensi Tenaga Pendidik', 'Absensi Mitra'].includes(activePage)) {
    childContent = <AbsensiAction />;
  } else if (activePage === 'PR & Tugas Siswa') {
    if (user.role === 'guru') {
      childContent = <PRTugasGuru />;
    } else {
      childContent = <PRTugasSiswa />;
    }
  } else if (activePage === 'Jadwal Siswa' || activePage === 'Jadwal Anak') {
    if (user.role === 'guru') {
      childContent = <InputJadwalSiswa />;
    } else {
      childContent = <JadwalSiswa />;
    }
  } else if (activePage === 'Keuangan Siswa' || activePage === 'Keuangan Anak') {
    if (user.role === 'guru') {
      childContent = <KeuanganSiswaGuru />;
    } else {
      childContent = <KeuanganSiswa />;
    }
  } else if (activePage === 'Penilaian & Raport Siswa' || activePage === 'Penilaian & Raport Anak') {
    if (user.role === 'guru') {
      childContent = <PenilaianRaportGuru />;
    } else {
      childContent = <PenilaianRaportSiswa />;
    }
  } else if (activePage === 'Kehadiran Anak' && user.role === 'ortu') {
    childContent = <KehadiranAnak />;
  } else {
    childContent = <GenericPage />;
  }
  if (isMobile) {
    return (
      <MainLayout>
        {berandaContent}
        <MobileBottomSheet 
          isOpen={!isHome} 
          onClose={handleCloseBottomSheet}
          title={activePage}
        >
          <ErrorBoundary>
            {childContent}
          </ErrorBoundary>
        </MobileBottomSheet>
      </MainLayout>
    );
  }
  return (
    <MainLayout>
      <AnimatePresence mode="wait">
        <motion.div
          key={activePage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="h-full"
        >
          <ErrorBoundary>
            {isHome ? berandaContent : childContent}
          </ErrorBoundary>
        </motion.div>
      </AnimatePresence>
    </MainLayout>
  );
});
const AppWithErrorBoundary = withErrorBoundary(AppContent);
export default function App() {
  return (
    <AppProvider>
      <AppConfigurationProvider>
        <PRTugasProvider>
          <OfflineBanner />
          <Notification />
          <LogoutModal />
          <AppWithErrorBoundary />
        </PRTugasProvider>
      </AppConfigurationProvider>
    </AppProvider>
  );
}
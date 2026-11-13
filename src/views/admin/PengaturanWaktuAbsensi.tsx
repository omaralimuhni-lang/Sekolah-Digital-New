import { useState, useEffect } from 'react';
import { Clock, Save, Building2, User, Users, ShieldCheck } from 'lucide-react';
import { useAppContext } from '../../AppContext';

interface WaktuAbsensi {
  masuk: string;
  pulang: string;
  toleransi: number;
}

interface ShiftSiswa extends WaktuAbsensi {
  kelas: string;
}

interface WaktuAbsensiSettings {
  siswa: {
    pagi: ShiftSiswa;
    siang: ShiftSiswa;
  };
  guru: WaktuAbsensi;
  tendik: WaktuAbsensi;
  mitra: WaktuAbsensi;
}

const defaultSettings: WaktuAbsensiSettings = {
  siswa: {
    pagi: { masuk: '07:00', pulang: '12:00', toleransi: 15, kelas: '1A, 2A, 3A' },
    siang: { masuk: '13:00', pulang: '17:00', toleransi: 15, kelas: '1B, 2B, 3B' }
  },
  guru: { masuk: '06:30', pulang: '15:00', toleransi: 15 },
  tendik: { masuk: '06:30', pulang: '15:30', toleransi: 15 },
  mitra: { masuk: '06:00', pulang: '16:00', toleransi: 15 }
};

export function PengaturanWaktuAbsensi() {
  const { showNotification } = useAppContext();
  const [settings, setSettings] = useState<WaktuAbsensiSettings>(defaultSettings);

  useEffect(() => {
    const loadData = () => {
    const saved = localStorage.getItem('sd_waktu_absensi_settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse settings");
      }
    }
  };
    loadData();
    window.addEventListener('localStorageUpdate', loadData);
    return () => window.removeEventListener('localStorageUpdate', loadData);
  }, []);

  const handleSave = () => {
    localStorage.setItem('sd_waktu_absensi_settings', JSON.stringify(settings));
    showNotification('Pengaturan waktu absensi berhasil disimpan', 'success');
  };

  const updateSetting = (role: keyof WaktuAbsensiSettings, field: string, value: any, shift?: 'pagi' | 'siang') => {
    setSettings(prev => {
      const newSettings = { ...prev };
      if (role === 'siswa' && shift) {
        newSettings.siswa[shift] = { ...newSettings.siswa[shift], [field]: value };
      } else if (role !== 'siswa') {
        newSettings[role] = { ...newSettings[role], [field]: value };
      }
      return newSettings;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full pb-32">
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2 sm:p-3 bg-rose-600 rounded-xl text-white">
            <Clock className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Pengaturan Waktu Absensi
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Atur jam masuk, pulang, toleransi keterlambatan dan shift absensi.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Siswa Settings */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Absensi Siswa</h2>
            </div>

            <div className="space-y-6">
              {/* Shift Pagi */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Shift Pagi</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Jam Masuk</label>
                    <input type="time" value={settings.siswa.pagi.masuk} onChange={e => updateSetting('siswa', 'masuk', e.target.value, 'pagi')} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Jam Pulang</label>
                    <input type="time" value={settings.siswa.pagi.pulang} onChange={e => updateSetting('siswa', 'pulang', e.target.value, 'pagi')} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Toleransi Keterlambatan (Menit)</label>
                  <input type="number" value={settings.siswa.pagi.toleransi} onChange={e => updateSetting('siswa', 'toleransi', parseInt(e.target.value) || 0, 'pagi')} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Kelas Shift Pagi (Pisahkan dengan koma)</label>
                  <input type="text" placeholder="1A, 2A, 3A" value={settings.siswa.pagi.kelas} onChange={e => updateSetting('siswa', 'kelas', e.target.value, 'pagi')} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" />
                </div>
              </div>

              {/* Shift Siang */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Shift Siang</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Jam Masuk</label>
                    <input type="time" value={settings.siswa.siang.masuk} onChange={e => updateSetting('siswa', 'masuk', e.target.value, 'siang')} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Jam Pulang</label>
                    <input type="time" value={settings.siswa.siang.pulang} onChange={e => updateSetting('siswa', 'pulang', e.target.value, 'siang')} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Toleransi Keterlambatan (Menit)</label>
                  <input type="number" value={settings.siswa.siang.toleransi} onChange={e => updateSetting('siswa', 'toleransi', parseInt(e.target.value) || 0, 'siang')} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Kelas Shift Siang (Pisahkan dengan koma)</label>
                  <input type="text" placeholder="1B, 2B, 3B" value={settings.siswa.siang.kelas} onChange={e => updateSetting('siswa', 'kelas', e.target.value, 'siang')} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Guru Settings */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-indigo-500" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Absensi Guru</h2>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Jam Masuk</label>
                  <input type="time" value={settings.guru.masuk} onChange={e => updateSetting('guru', 'masuk', e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Jam Pulang</label>
                  <input type="time" value={settings.guru.pulang} onChange={e => updateSetting('guru', 'pulang', e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Toleransi (Menit)</label>
                  <input type="number" value={settings.guru.toleransi} onChange={e => updateSetting('guru', 'toleransi', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                </div>
              </div>
            </div>

            {/* Tendik Settings */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Absensi Tenaga Pendidik</h2>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Jam Masuk</label>
                  <input type="time" value={settings.tendik.masuk} onChange={e => updateSetting('tendik', 'masuk', e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Jam Pulang</label>
                  <input type="time" value={settings.tendik.pulang} onChange={e => updateSetting('tendik', 'pulang', e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Toleransi (Menit)</label>
                  <input type="number" value={settings.tendik.toleransi} onChange={e => updateSetting('tendik', 'toleransi', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
                </div>
              </div>
            </div>

            {/* Mitra Settings */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Absensi Mitra</h2>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Jam Masuk</label>
                  <input type="time" value={settings.mitra.masuk} onChange={e => updateSetting('mitra', 'masuk', e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Jam Pulang</label>
                  <input type="time" value={settings.mitra.pulang} onChange={e => updateSetting('mitra', 'pulang', e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Toleransi (Menit)</label>
                  <input type="number" value={settings.mitra.toleransi} onChange={e => updateSetting('mitra', 'toleransi', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-rose-600/30"
          >
            <Save className="w-5 h-5" />
            Simpan Pengaturan
          </button>
        </div>
    </div>
  );
}

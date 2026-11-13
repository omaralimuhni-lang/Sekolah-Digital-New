import { useState, useRef } from 'react';
import { FileOutput, Image as ImageIcon, Save, FileText, FileSpreadsheet, Receipt, Upload } from 'lucide-react';
import { useAppContext } from '../../AppContext';
import { useAppConfiguration, KopConfig } from '../../AppConfigurationContext';

export function PengaturanDokumenTemplate() {
  const { showNotification } = useAppContext();
  const { kopPdf, kopStruk, kopExcel, updateKop } = useAppConfiguration();
  const [activeTab, setActiveTab] = useState<'pdf' | 'struk' | 'excel'>('pdf');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getActiveConfig = () => {
    if (activeTab === 'pdf') return kopPdf;
    if (activeTab === 'struk') return kopStruk;
    return kopExcel;
  };

  const handleChange = (field: keyof KopConfig, value: string) => {
    const activeConfig = getActiveConfig();
    updateKop(activeTab, { ...activeConfig, [field]: value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB max
        showNotification('Ukuran logo maksimal 1MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        handleChange('logoDataUrl', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearLogo = () => {
    handleChange('logoDataUrl', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveAll = () => {
    // Context update sets localStorage directly, but here we can force a sync or just notify
    showNotification('Pengaturan Kop Dokumen berhasil disimpan dan otomatis disinkronkan');
  };

  const renderTabContent = (title: string, desc: string) => {
    const config = getActiveConfig();

    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700/50 max-w-4xl">
        <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
           <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
           <p className="text-sm text-slate-500 mt-1">{desc}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Form Configuration */}
           <div className="space-y-4">
              <div>
                 <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Nama Sekolah</label>
                 <input 
                   type="text" 
                   value={config.sekolahName}
                   onChange={(e) => handleChange('sekolahName', e.target.value)}
                   className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-800 dark:text-slate-100"
                   placeholder="Masukkan nama sekolah"
                 />
              </div>
              <div>
                 <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Alamat Lengkap</label>
                 <textarea 
                   value={config.address}
                   onChange={(e) => handleChange('address', e.target.value)}
                   className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-800 dark:text-slate-100 resize-none h-24"
                   placeholder="Masukkan alamat lengkap sekolah"
                 />
              </div>
              <div>
                 <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Kontak (Telp/Email)</label>
                 <input 
                   type="text" 
                   value={config.contact}
                   onChange={(e) => handleChange('contact', e.target.value)}
                   className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-800 dark:text-slate-100"
                   placeholder="Misal: Telp: 021-1234 | Email: info@sekolah.com"
                 />
              </div>
              <div>
                 <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Website (Opsional)</label>
                 <input 
                   type="text" 
                   value={config.website}
                   onChange={(e) => handleChange('website', e.target.value)}
                   className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-800 dark:text-slate-100"
                   placeholder="www.sekolah.sch.id"
                 />
              </div>
              <div>
                 <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Logo Kop</label>
                 <div className="flex items-center gap-4">
                    {config.logoDataUrl ? (
                      <div className="relative w-16 h-16 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900 p-1">
                        <img src={config.logoDataUrl} alt="Logo Sekolah" className="w-full h-full object-contain" />
                        <button 
                          onClick={clearLogo}
                          className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 text-xs w-5 h-5 flex items-center justify-center"
                        >
                          &times;
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                        <ImageIcon className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1">
                       <input 
                         type="file" 
                         ref={fileInputRef}
                         accept="image/png, image/jpeg" 
                         onChange={handleImageUpload}
                         className="hidden"
                         id="logo-kop-upload"
                       />
                       <label 
                         htmlFor="logo-kop-upload"
                         className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl cursor-pointer transition-colors"
                       >
                         <Upload className="w-4 h-4" /> Pilih Logo Baru
                       </label>
                       <p className="text-xs text-slate-500 mt-2">Maks. 1MB. Format: JPG/PNG. Ideal aspek rasio 1:1.</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* Preview Live */}
           <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Pratinjau Kop</label>
              <div className={`border border-slate-200 dark:border-slate-700 rounded-2xl bg-white text-slate-900 overflow-hidden ${activeTab === 'struk' ? 'w-full max-w-[280px] mx-auto' : 'w-full'}`}>
                 <div className={`flex items-center p-4 border-b-2 border-slate-900 ${activeTab === 'struk' ? 'flex-col text-center border-dashed pb-4' : 'flex-row gap-4'}`}>
                    {config.logoDataUrl && (
                      <div className={`shrink-0 ${activeTab === 'struk' ? 'mb-2' : ''}`}>
                         <img src={config.logoDataUrl} alt="Logo" className={`${activeTab === 'struk' ? 'w-12 h-12' : 'w-16 h-16'} object-contain`} />
                      </div>
                    )}
                    <div className={activeTab === 'struk' ? 'w-full' : 'flex-1 text-center pr-16'}>
                       <h3 className={`font-bold ${activeTab === 'struk' ? 'text-sm mb-1' : 'text-lg uppercase min-h-[28px]'}`}>{config.sekolahName || 'NAMA SEKOLAH'}</h3>
                       <p className={`text-slate-700 min-h-[20px] ${activeTab === 'struk' ? 'text-[10px] leading-tight mb-1' : 'text-xs'}`}>{config.address}</p>
                       <p className={`text-slate-600 min-h-[16px] ${activeTab === 'struk' ? 'text-[10px]' : 'text-xs mt-0.5'}`}>{config.contact}</p>
                       {config.website && <p className={`text-slate-600 min-h-[16px] ${activeTab === 'struk' ? 'text-[10px]' : 'text-xs'}`}>{config.website}</p>}
                    </div>
                    {/* Dummy padding if horizontal to balance logo for centering text */}
                    {activeTab !== 'struk' && config.logoDataUrl && <div className="w-16"></div>}
                 </div>
                 
                 {/* Dummy content for preview */}
                 <div className="p-4 bg-slate-50 h-32 flex flex-col justify-center items-center opacity-50">
                    <div className="w-3/4 h-2 bg-slate-200 rounded mb-3"></div>
                    <div className="w-full h-2 bg-slate-200 rounded mb-2"></div>
                    <div className="w-5/6 h-2 bg-slate-200 rounded mb-2"></div>
                    <div className="w-1/2 h-2 bg-slate-200 rounded"></div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full pb-32">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-teal-700 rounded-xl text-white shadow-sm border border-teal-600">
              <FileOutput className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                Pengaturan Dokumen & Template
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Atur Kop Surat untuk cetak PDF, Struk Kasir, dan Ekspor Excel.
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl w-fit mb-6 overflow-x-auto max-w-full">
           <button
             onClick={() => setActiveTab('pdf')}
             className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
               activeTab === 'pdf' 
                 ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' 
                 : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
             }`}
           >
             <FileText className="w-4 h-4" /> Laporan PDF / Kop Surat
           </button>
           <button
             onClick={() => setActiveTab('struk')}
             className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
               activeTab === 'struk' 
                 ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm' 
                 : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
             }`}
           >
             <Receipt className="w-4 h-4" /> Struk Thermal / Kasir
           </button>
           <button
             onClick={() => setActiveTab('excel')}
             className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
               activeTab === 'excel' 
                 ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                 : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
             }`}
           >
             <FileSpreadsheet className="w-4 h-4" /> Dokumen Excel
           </button>
        </div>

        {activeTab === 'pdf' && renderTabContent(
          'Kop Surat Laporan Resmi (PDF)', 
          'Gunakan untuk kop surat absensi, laporan nilai, raport, pembayaran, dan semua dokumen berformat kertas A4.'
        )}

        {activeTab === 'struk' && renderTabContent(
          'Header Struk (Thermal 58mm/80mm)', 
          'Digunakan untuk cetak bukti pembayaran keuangan, slip kantin sekolah, dan pembelian toko sekolah.'
        )}

        {activeTab === 'excel' && renderTabContent(
          'Header Laporan Excel', 
          'Teks header yang akan disisipkan pada baris pertama saat pengguna meng-export data ke format Excel.'
        )}

        <div className="fixed bottom-[80px] lg:bottom-10 right-4 lg:right-10 z-20">
          <button
            onClick={handleSaveAll}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3.5 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-xl shadow-teal-500/20"
          >
            <Save className="w-5 h-5" /> Simpan Semua Konfigurasi
          </button>
        </div>
    </div>
  );
}

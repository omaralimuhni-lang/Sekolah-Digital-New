import { useState, useEffect } from 'react';
import { Wifi, MessageSquare, Save, Server, Key, Link as LinkIcon, RefreshCw, Send, Settings, Hash } from 'lucide-react';
import { useAppContext } from '../../AppContext';

interface WAApiConfig {
  provider: string; // 'Fonnte' | 'Wablas' | 'Custom'
  endpoint: string;
  apiKey: string;
  senderName: string;
  senderNumber: string;
}

interface WAMessageTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
}

export function PengaturanKoneksiAPI() {
  const { showNotification } = useAppContext();

  const [activeTab, setActiveTab] = useState<'koneksi' | 'template'>('koneksi');
  const [isTestingConfig, setIsTestingConfig] = useState(false);

  // Default Config
  const [waConfig, setWaConfig] = useState<WAApiConfig>({
    provider: 'Fonnte',
    endpoint: 'https://api.fonnte.com/send',
    apiKey: '',
    senderName: 'Sekolah Digital',
    senderNumber: '',
  });

  // Default Templates
  const defaultTemplates: WAMessageTemplate[] = [
    {
      id: 'template_hadir',
      name: 'Notifikasi Kehadiran',
      content: 'Halo Bapak/Ibu Wali dari {nama_siswa}. Kami informasikan bahwa ananda telah hadir di sekolah pada {waktu_presensi}. Terima kasih.',
      variables: ['{nama_siswa}', '{waktu_presensi}']
    },
    {
      id: 'template_sakit',
      name: 'Notifikasi Sakit/Izin',
      content: 'Halo Bapak/Ibu Wali dari {nama_siswa}. Info dari sistem bahwa ananda statusnya {status} pada hari ini. Semoga ananda senantiasa diberikan kebaikan.',
      variables: ['{nama_siswa}', '{status}']
    },
    {
      id: 'template_tagihan',
      name: 'Tagihan Pembayaran',
      content: 'Yth. Bapak/Ibu Wali dari {nama_siswa}, ini adalah pengingat tagihan pembayaran {nama_tagihan} sebesar {nominal} yang jatuh tempo pada {jatuh_tempo}. Mohon segera diselesaikan.',
      variables: ['{nama_siswa}', '{nama_tagihan}', '{nominal}', '{jatuh_tempo}']
    },
    {
      id: 'template_pengumuman',
      name: 'Broadcast Pengumuman',
      content: 'Pengumuman Sekolah: {isi_pengumuman}. Demikian informasi yang dapat kami sampaikan, atas perhatiannya kami ucapkan terima kasih.',
      variables: ['{isi_pengumuman}']
    }
  ];

  const [templates, setTemplates] = useState<WAMessageTemplate[]>([]);

  useEffect(() => {
    const loadData = () => {
    const savedConfig = localStorage.getItem('sd_wa_config');
    if (savedConfig) {
      setWaConfig(JSON.parse(savedConfig));
    }

    const savedTemplates = localStorage.getItem('sd_wa_templates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    } else {
      setTemplates(defaultTemplates);
    }
  };
    loadData();
    window.addEventListener('localStorageUpdate', loadData);
    return () => window.removeEventListener('localStorageUpdate', loadData);
  }, []);

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provider = e.target.value;
    let endpoint = '';
    if (provider === 'Fonnte') endpoint = 'https://api.fonnte.com/send';
    else if (provider === 'Wablas') endpoint = 'https://tegal.wablas.com/api/send-message';
    
    setWaConfig(prev => ({
      ...prev,
      provider,
      endpoint: endpoint || prev.endpoint
    }));
  };

  const handleSaveConfig = () => {
    localStorage.setItem('sd_wa_config', JSON.stringify(waConfig));
    showNotification('Konfigurasi API WhatsApp berhasil disimpan');
  };

  const handleTestConnection = () => {
    if (!waConfig.apiKey || !waConfig.endpoint) {
      showNotification('Lengkapi Konfigurasi Endpoint & API Key!');
      return;
    }
    
    setIsTestingConfig(true);
    // Simulate delay for testing
    setTimeout(() => {
      setIsTestingConfig(false);
      showNotification('Koneksi berhasil! Endpoint API merespon dengan baik (Simulasi).');
    }, 1500);
  };

  const handleTemplateChange = (id: string, content: string) => {
    const updated = templates.map(t => t.id === id ? { ...t, content } : t);
    setTemplates(updated);
  };

  const handleSaveTemplates = () => {
    localStorage.setItem('sd_wa_templates', JSON.stringify(templates));
    showNotification('Template pesan WhatsApp berhasil disimpan');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full pb-32">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-blue-700 rounded-xl text-white shadow-sm border border-blue-600">
              <Wifi className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                Pengaturan Koneksi & API
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Integrasi Gateway WhatsApp untuk presensi, tagihan, dan pengumuman.
              </p>
            </div>
          </div>
        </div>

        {/* Custom Tab Navigation */}
        <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl w-fit mb-6">
           <button
             onClick={() => setActiveTab('koneksi')}
             className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
               activeTab === 'koneksi' 
                 ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm' 
                 : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
             }`}
           >
             <Server className="w-4 h-4" /> Gateway WhatsApp
           </button>
           <button
             onClick={() => setActiveTab('template')}
             className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
               activeTab === 'template' 
                 ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' 
                 : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
             }`}
           >
             <MessageSquare className="w-4 h-4" /> Template Pesan
           </button>
        </div>

        {activeTab === 'koneksi' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700/50 max-w-4xl">
             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
               <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                 <Settings className="w-5 h-5" />
               </div>
               <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Kredensial Gateway API</h2>
                  <p className="text-sm text-slate-500">Konfigurasi akun third-party gateway Anda (Fonnte, Wablas, dll).</p>
               </div>
             </div>

             <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div>
                     <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Penyedia Layanan (Provider)</label>
                     <select
                       value={waConfig.provider}
                       onChange={handleProviderChange}
                       className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 dark:text-slate-100"
                     >
                       <option value="Fonnte">Fonnte (Recomended)</option>
                       <option value="Wablas">Wablas</option>
                       <option value="Custom">Kustom API Rest</option>
                     </select>
                   </div>
                   
                   <div>
                     <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Nomor Pengirim (Sender Number)</label>
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Hash className="w-4 h-4 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          value={waConfig.senderNumber}
                          onChange={(e) => setWaConfig({...waConfig, senderNumber: e.target.value})}
                          placeholder="Mis: 08123456789 (Kosongkan jika default by API)"
                          className="w-full pl-9 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 dark:text-slate-100"
                        />
                     </div>
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Endpoint URL Webhook / HTTP POST</label>
                   <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LinkIcon className="w-4 h-4 text-slate-400" />
                      </div>
                      <input
                        type="url"
                        value={waConfig.endpoint}
                        onChange={(e) => setWaConfig({...waConfig, endpoint: e.target.value})}
                        disabled={waConfig.provider !== 'Custom'}
                        placeholder="https://apiUrl.com/send"
                        className="w-full pl-9 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 dark:text-slate-100 disabled:opacity-60"
                      />
                   </div>
                   {waConfig.provider !== 'Custom' && (
                     <p className="text-xs text-slate-400 mt-1.5">*Endpoint otomatis diisi berdasarkan provider yang dipilih.</p>
                   )}
                </div>

                <div>
                   <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">API Key / Authorization Token</label>
                   <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Key className="w-4 h-4 text-slate-400" />
                      </div>
                      <input
                        type="password"
                        value={waConfig.apiKey}
                        onChange={(e) => setWaConfig({...waConfig, apiKey: e.target.value})}
                        placeholder="Masukkan API Key yang dirahasiakan"
                        className="w-full pl-9 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 dark:text-slate-100 font-mono tracking-widest placeholder:tracking-normal"
                      />
                   </div>
                </div>
             </div>

             <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSaveConfig}
                  className="w-full sm:w-auto flex-1 sm:flex-none justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm"
                >
                  <Save className="w-5 h-5" /> Simpan Konfigurasi
                </button>
                <button
                  onClick={handleTestConnection}
                  disabled={isTestingConfig}
                  className="w-full sm:w-auto justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
                >
                  <RefreshCw className={`w-5 h-5 ${isTestingConfig ? 'animate-spin' : ''}`} /> 
                  {isTestingConfig ? 'Menguji API...' : 'Test Koneksi & Kirim Halo'}
                </button>
             </div>
          </div>
        )}

        {activeTab === 'template' && (
          <div className="space-y-6">
             <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/50 rounded-2xl p-5 md:flex justify-between items-center text-teal-800 dark:text-teal-200 max-w-4xl">
               <div>
                  <h3 className="font-bold flex items-center gap-2 mb-1">
                    <MessageSquare className="w-5 h-5" /> Variabel Dinamis
                  </h3>
                  <p className="text-sm">Gunakan variabel <code>&#123;nama_variabel&#125;</code> pada pesan untuk menyisipkan data personal secara otomatis (contoh: &#123;nama_siswa&#125;).</p>
               </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
                {templates.map(template => (
                  <div key={template.id} className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700/50 flex flex-col">
                     <div className="flex justify-between items-center mb-4">
                       <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
                         {template.name}
                       </h3>
                       <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400" title="Kirim Uji Coba">
                          <Send className="w-4 h-4 cursor-pointer" />
                       </div>
                     </div>
                     
                     <div className="mb-4">
                       <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Variabel Tersedia:</p>
                       <div className="flex flex-wrap gap-2">
                         {template.variables.map(v => (
                           <span key={v} className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded text-xs font-mono text-indigo-600 dark:text-indigo-400">
                             {v}
                           </span>
                         ))}
                       </div>
                     </div>

                     <textarea
                       className="w-full flex-1 min-h-[120px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-700 dark:text-slate-300 text-sm resize-none"
                       value={template.content}
                       onChange={(e) => handleTemplateChange(template.id, e.target.value)}
                     ></textarea>
                  </div>
                ))}
             </div>

             {/* Sticky Save Button for Templates */}
             <div className="fixed bottom-[80px] lg:bottom-10 right-4 lg:right-10 z-20">
               <button
                 onClick={handleSaveTemplates}
                 className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3.5 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-xl shadow-teal-500/20"
               >
                 <Save className="w-5 h-5" /> Simpan Perubahan Template
               </button>
             </div>
          </div>
        )}
    </div>
  );
}

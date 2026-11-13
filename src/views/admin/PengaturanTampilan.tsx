import { useAppContext } from '../../AppContext';
import { LayoutTemplate, Type, Scaling, Palette, Check } from 'lucide-react';
export function PengaturanTampilan() {
  const { settings, updateGlobalDisplay } = useAppContext();
  
  const displayConfig = settings.globalDisplay || {
    colorTheme: 'blue',
    fontFamily: 'font-sans',
    fontSize: 'text-base',
  };
  const themes = [
    { id: 'blue', name: 'Samudra Biru', colors: ['bg-indigo-400', 'bg-blue-400', 'bg-cyan-400'] },
    { id: 'rose', name: 'Mawar Merah', colors: ['bg-rose-400', 'bg-pink-400', 'bg-red-400'] },
    { id: 'green', name: 'Mint Segar', colors: ['bg-emerald-400', 'bg-teal-400', 'bg-green-400'] },
    { id: 'amber', name: 'Senja Hangat', colors: ['bg-amber-400', 'bg-orange-400', 'bg-yellow-400'] },
    { id: 'violet', name: 'Malam Ungu', colors: ['bg-violet-400', 'bg-purple-400', 'bg-fuchsia-400'] },
    { id: 'slate', name: 'Batu Minimalis', colors: ['bg-slate-400', 'bg-gray-400', 'bg-zinc-400'] },
  ];
  const fonts = [
    { id: 'font-sans', name: 'Inter (Default)' },
    { id: 'font-serif', name: 'Georgia / Serif' },
    { id: 'font-plus-jakarta', name: 'Plus Jakarta Sans' },
    { id: 'font-google-sans', name: 'Google Sans' },
    { id: 'font-open-sans', name: 'Open Sans' },
    { id: 'font-lato', name: 'Lato' },
    { id: 'font-poppins', name: 'Poppins' },
    { id: 'font-montserrat', name: 'Montserrat' },
  ];
  const sizes = [
    { id: 'text-sm', name: 'Kecil', desc: 'Ukuran font yang lebih kecil dan padat' },
    { id: 'text-base', name: 'Normal', desc: 'Ukuran font standar (Default)' },
    { id: 'text-lg', name: 'Besar', desc: 'Ukuran font yang lebih mudah dibaca' },
    { id: 'text-xl', name: 'Sangat Besar', desc: 'Ukuran font paling besar' },
  ];
  const handleThemeChange = (id: string) => {
    updateGlobalDisplay({ colorTheme: id });
  };
  const handleFontChange = (id: string) => {
    updateGlobalDisplay({ fontFamily: id });
  };
  const handleSizeChange = (id: string) => {
    updateGlobalDisplay({ fontSize: id });
  };
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full pb-32">
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2 sm:p-3 bg-violet-600 rounded-xl text-white">
            <LayoutTemplate className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Pengaturan Tampilan
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Atur tema warna, font, dan ukuran teks secara global.
            </p>
          </div>
        </div>
        <div className="space-y-6">
          {/* Theme Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center gap-3 mb-6">
               <Palette className="w-6 h-6 text-indigo-500" />
               <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Tema Warna Aplikasi</h2>
                  <p className="text-sm text-slate-500">Pilih skema warna utama untuk background dan aksen.</p>
               </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.id)}
                  className={`relative p-4 rounded-2xl border-2 text-left transition-all overflow-hidden group ${displayConfig.colorTheme === theme.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'}`}
                >
                  <div className="flex items-center justify-between mb-3 relative z-10">
                    <span className={`font-semibold ${displayConfig.colorTheme === theme.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                      {theme.name}
                    </span>
                    {displayConfig.colorTheme === theme.id && (
                      <Check className="w-5 h-5 text-indigo-500" />
                    )}
                  </div>
                  <div className="flex gap-2 relative z-10">
                     {theme.colors.map((c, i) => (
                       <div key={i} className={`w-8 h-8 rounded-full ${c} shadow-sm border-2 border-white dark:border-slate-800`}></div>
                     ))}
                  </div>
                  {displayConfig.colorTheme === theme.id && (
                    <div className="absolute top-0 right-0 p-8 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-bl-full -mr-4 -mt-4 transition-all"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
          {/* Font Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center gap-3 mb-6">
               <Type className="w-6 h-6 text-emerald-500" />
               <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Jenis Font</h2>
                  <p className="text-sm text-slate-500">Pilih jenis font yang digunakan di seluruh aplikasi.</p>
               </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {fonts.map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleFontChange(f.id)}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between ${displayConfig.fontFamily === f.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-emerald-700'}`}
                >
                  <span className={`${f.id} font-medium`}>{f.name}</span>
                  {displayConfig.fontFamily === f.id && <Check className="w-4 h-4 ml-2 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
          {/* Size Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center gap-3 mb-6">
               <Scaling className="w-6 h-6 text-rose-500" />
               <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Ukuran Teks Global</h2>
                  <p className="text-sm text-slate-500">Sesuaikan ukuran font pada aplikasi agar lebih nyaman dibaca.</p>
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {sizes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSizeChange(s.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${displayConfig.fontSize === s.id ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-700'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                     <span className={`font-bold ${s.id} ${displayConfig.fontSize === s.id ? 'text-rose-700 dark:text-rose-300' : 'text-slate-800 dark:text-slate-100'}`}>
                       {s.name}
                     </span>
                     {displayConfig.fontSize === s.id && <Check className="w-5 h-5 text-rose-500" />}
                  </div>
                  <p className={`text-xs ${displayConfig.fontSize === s.id ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>{s.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
    </div>
  );
}
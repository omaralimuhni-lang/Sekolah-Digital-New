import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, BarChart3, Search, Clock, FileText, CheckCircle2, User, Link as LinkIcon, Info } from 'lucide-react';
import { useAppContext } from '../../AppContext';
import { useIsMobile } from '../../App';
import { MobileBottomSheet } from '../../components/ui/MobileBottomSheet';
export function PolingSurveiSekolah() {
  const { user, showNotification } = useAppContext();
  const isMobile = useIsMobile();
  
  const [activeTab, setActiveTab] = useState<'poling' | 'survei'>('poling');
  const [polingList, setPolingList] = useState<any[]>([]);
  const [surveiList, setSurveiList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedPoling, setSelectedPoling] = useState<any>(null);
  const [isPolingModalOpen, setIsPolingModalOpen] = useState(false);
  
  const [selectedSurvei, setSelectedSurvei] = useState<any>(null);
  const [isSurveiModalOpen, setIsSurveiModalOpen] = useState(false);
  // Load data
  useEffect(() => {
    const loadData = () => {
    const pList = JSON.parse(localStorage.getItem('sd_poling_list') || '[]');
    setPolingList(pList.sort((a: any, b: any) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()));
    
    const sList = JSON.parse(localStorage.getItem('sd_survei_list') || '[]');
    setSurveiList(sList.sort((a: any, b: any) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()));
  };
    loadData();
    window.addEventListener('localStorageUpdate', loadData);
    return () => window.removeEventListener('localStorageUpdate', loadData);
  }, []);
  const getVoteData = (polingId: string, nomorPaslonOptions: string) => {
    const rawData = localStorage.getItem(`sd_poling_votes_${polingId}`);
    let voteStore = rawData ? JSON.parse(rawData) : {};
    
    // Initialize if empty
    if (!voteStore.counts) {
      voteStore.counts = {};
      const options = nomorPaslonOptions.split(',').map(s => s.trim());
      options.forEach(opt => {
        voteStore.counts[opt] = Math.floor(Math.random() * 50); // Simulate existing votes for realism
      });
      voteStore.votedUsers = [];
      localStorage.setItem(`sd_poling_votes_${polingId}`, JSON.stringify(voteStore));
    }
    return voteStore;
  };
  const hasVoted = (polingId: string) => {
    if (!user) return false;
    const voteStore = getVoteData(polingId, '');
    return (voteStore.votedUsers || []).includes(user.name);
  };
  const handleVote = (polingId: string, selectedOption: string) => {
    if (!user) {
      showNotification("Silakan login untuk memberikan suara.");
      return;
    }
    
    const voteStore = getVoteData(polingId, '');
    
    if ((voteStore.votedUsers || []).includes(user.name)) {
      showNotification("Anda sudah memberikan suara pada poling ini.");
      return;
    }
    voteStore.counts[selectedOption] = (voteStore.counts[selectedOption] || 0) + 1;
    voteStore.votedUsers = [...(voteStore.votedUsers || []), user.name];
    
    localStorage.setItem(`sd_poling_votes_${polingId}`, JSON.stringify(voteStore));
    showNotification("Terima kasih, suara Anda telah berhasil disimpan!");
    
    // Refresh state to update UI
    setSelectedPoling({ ...selectedPoling, _forceUpdate: Date.now() });
  };
  const openPoling = (item: any) => {
    setSelectedPoling(item);
    setIsPolingModalOpen(true);
  };
  const openSurvei = (item: any) => {
    setSelectedSurvei(item);
    setIsSurveiModalOpen(true);
  };
  const isPolingActive = (item: any) => {
    if (!item.tanggalPenerbitan || !item.waktuPenerbitan) return true;
    const now = new Date();
    const pubDate = new Date(`${item.tanggalPenerbitan}T${item.waktuPenerbitan}`);
    return now >= pubDate;
  };
  const filteredPoling = polingList.filter(item => {
    const q = searchQuery.toLowerCase();
    return (item.judul?.toLowerCase() || '').includes(q) && isPolingActive(item);
  });
  const filteredSurvei = surveiList.filter(item => {
    const q = searchQuery.toLowerCase();
    return (item.judul?.toLowerCase() || '').includes(q);
  });
  const renderPolingModal = () => {
    if (!isPolingModalOpen || !selectedPoling) return null;
    
    const options = (selectedPoling.nomorPaslon || '').split(',').map((s:string) => s.trim()).filter((s:string) => s);
    const voteData = getVoteData(selectedPoling.id, selectedPoling.nomorPaslon || '');
    const totalVotes = Object.values(voteData.counts).reduce((acc: any, val: any) => acc + val, 0) as number;
    const userHasVoted = hasVoted(selectedPoling.id);
    
    const content = (
      <div className="p-6 pb-24 lg:pb-6">
        <div className="bg-white dark:bg-slate-800/50 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700/50 shadow-sm relative">
          
          {selectedPoling.gambarPreview ? (
            <div className="w-full relative bg-slate-100 dark:bg-slate-900 overflow-hidden">
               <img src={selectedPoling.gambarPreview} alt="Paslon" className="w-full max-h-64 object-contain" />
            </div>
          ) : (
            <div className="h-40 w-full bg-teal-50 dark:bg-teal-900/20 flex flex-col items-center justify-center relative">
               <BarChart3 className="w-16 h-16 text-teal-400 dark:text-teal-500 opacity-50" />
            </div>
          )}
          
          <div className="p-6">
             <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center gap-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                   <Clock className="w-3.5 h-3.5" />
                   {selectedPoling.tanggal}
                </span>
             </div>
             <h3 className="font-bold text-2xl text-slate-800 dark:text-white leading-tight mb-6">{selectedPoling.judul}</h3>
             
             {/* Visi Misi if exists */}
             {(selectedPoling.visi || selectedPoling.misi) && (
               <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                 {selectedPoling.visi && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                       <div className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-2">Visi Paslon</div>
                       <p className="text-slate-700 dark:text-slate-300 text-sm">{selectedPoling.visi}</p>
                    </div>
                 )}
                 {selectedPoling.misi && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                       <div className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-2">Misi Paslon</div>
                       <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">{selectedPoling.misi}</p>
                    </div>
                 )}
               </div>
             )}
             <div className="mb-4 text-sm font-bold text-slate-700 dark:text-slate-300">
               Pilih Paslon Ketua OSIS:
             </div>
             <div className="space-y-4">
                {options.map((opt: string) => {
                   const votes = voteData.counts[opt] || 0;
                   const percentage = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);
                   
                   return (
                      <div key={opt} className="relative">
                         <button
                           onClick={() => !userHasVoted && handleVote(selectedPoling.id, opt)}
                           disabled={userHasVoted}
                           className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all relative overflow-hidden z-10 ${
                             userHasVoted 
                               ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-default' 
                               : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white hover:border-teal-500 hover:shadow-md'
                           }`}
                         >
                           <div className="flex items-center gap-3 relative z-20">
                              <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 font-black flex items-center justify-center text-lg">{opt}</div>
                              <span className="font-bold">Paslon {opt}</span>
                           </div>
                           
                           {userHasVoted && (
                             <div className="flex flex-col items-end relative z-20">
                               <span className="font-bold text-lg">{percentage}%</span>
                               <span className="text-[10px] text-slate-500">{votes} suara</span>
                             </div>
                           )}
                           
                           {/* Progress Bar Background */}
                           {userHasVoted && (
                              <div className="absolute inset-y-0 left-0 bg-teal-50 dark:bg-teal-500/10 z-0 transition-all duration-1000 ease-out" style={{ width: `${percentage}%` }}></div>
                           )}
                         </button>
                      </div>
                   )
                })}
             </div>
             
             {userHasVoted && (
               <div className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-green-600 bg-green-50 dark:bg-green-500/10 py-3 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                  Anda sudah berpartisipasi ({totalVotes} total suara)
               </div>
             )}
          </div>
        </div>
      </div>
    );
    if (isMobile) {
      return (
        <MobileBottomSheet isOpen={isPolingModalOpen} onClose={() => setIsPolingModalOpen(false)} title="Detail Poling OSIS">
          {content}
        </MobileBottomSheet>
      );
    }
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsPolingModalOpen(false)} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[24px] shadow-2xl relative z-10 flex flex-col overflow-hidden max-h-[90vh]">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl sticky top-0 z-10">
             <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-teal-500" /> Pemilihan OSIS</h2>
             <button onClick={() => setIsPolingModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
               <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
             </button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
             {content}
          </div>
        </div>
      </div>,
      document.body
    );
  };
  const renderSurveiModal = () => {
    if (!isSurveiModalOpen || !selectedSurvei) return null;
    
    const content = (
      <div className="p-6 pb-24 lg:pb-6">
        <div className="bg-white dark:bg-slate-800/50 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700/50 shadow-sm relative">
          
          <div className="h-40 w-full bg-indigo-50 dark:bg-indigo-900/20 flex flex-col items-center justify-center relative">
             <FileText className="w-16 h-16 text-indigo-400 dark:text-indigo-500 opacity-50" />
          </div>
          
          <div className="p-6">
             <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center gap-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                   <Clock className="w-3.5 h-3.5" />
                   {selectedSurvei.tanggal}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                   <User className="w-3.5 h-3.5" />
                   {selectedSurvei.pembuat || 'Tendik'}
                </span>
             </div>
             <h3 className="font-bold text-2xl text-slate-800 dark:text-white leading-tight mb-4">{selectedSurvei.judul}</h3>
             
             <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 mb-8">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                   <Info className="w-4 h-4 text-indigo-500" /> Deskripsi Survei
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                   {selectedSurvei.deskripsi || 'Tidak ada deskripsi untuk survei ini.'}
                </p>
             </div>
             <div className="grid grid-cols-1 gap-3">
                <a 
                  href={selectedSurvei.link?.startsWith('http') ? selectedSurvei.link : `https://${selectedSurvei.link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 transition-all flex justify-center items-center gap-2"
                >
                  <LinkIcon className="w-5 h-5" /> Buka Formulir Survei
                </a>
             </div>
          </div>
        </div>
      </div>
    );
    if (isMobile) {
      return (
        <MobileBottomSheet isOpen={isSurveiModalOpen} onClose={() => setIsSurveiModalOpen(false)} title="Detail Survei Sekolah">
          {content}
        </MobileBottomSheet>
      );
    }
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSurveiModalOpen(false)} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[24px] shadow-2xl relative z-10 flex flex-col overflow-hidden max-h-[90vh]">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl sticky top-0 z-10">
             <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-500" /> Isi Survei</h2>
             <button onClick={() => setIsSurveiModalOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
               <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
             </button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
             {content}
          </div>
        </div>
      </div>,
      document.body
    );
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[100vw] overflow-x-hidden pt-safe pb-32">
      <div className="flex flex-col gap-6">
        
        {/* Banner Section */}
        <div className="bg-gradient-to-br from-teal-600 to-emerald-700 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl shadow-teal-500/20 relative overflow-hidden h-40 sm:h-48 flex flex-col justify-end">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
           <div className="absolute bottom-0 right-10 opacity-20 pointer-events-none transform translate-y-1/4 right-0 rotate-[-15deg]">
              <BarChart3 className="w-48 h-48 sm:w-64 sm:h-64" />
           </div>
           
           <div className="relative z-10">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">Poling & Survei Sekolah</h1>
              <p className="text-teal-50 font-medium text-sm sm:text-base max-w-sm sm:max-w-md">Berikan aspirasi dan pendapat Anda melalui formulir pemilihan dan survei sekolah resmi.</p>
           </div>
        </div>
        {/* Tab Selection */}
        <div className="bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex relative mt-2 z-20 max-w-md mx-auto w-full shadow-sm">
           <button 
             onClick={() => setActiveTab('poling')}
             className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all relative z-10 ${activeTab === 'poling' ? 'text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80'}`}
           >
             Pemilihan OSIS
           </button>
           <button 
             onClick={() => setActiveTab('survei')}
             className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all relative z-10 ${activeTab === 'survei' ? 'text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80'}`}
           >
             Survei Sekolah
           </button>
           <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-slate-900 dark:bg-slate-100 rounded-xl transition-all shadow-md z-0 ${activeTab === 'survei' ? 'left-[calc(50%+3px)]' : 'left-[6px]'}`}></div>
        </div>
        {/* Search */}
        <div className="relative w-full shrink-0 group z-20">
           <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
           <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari ${activeTab === 'poling' ? 'nama paslon pemilihan' : 'judul survei'}...`} 
              className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700/50 rounded-2xl outline-none focus:border-teal-500 dark:focus:border-teal-500 text-sm dark:text-white shadow-sm transition-all"
           />
        </div>
        {/* Dynamic Content */}
        {activeTab === 'poling' ? (
           filteredPoling.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                 {filteredPoling.map((item) => {
                    const voteData = getVoteData(item.id, item.nomorPaslon);
                    const totalVotes = Object.values(voteData.counts).reduce((acc:any, val:any) => acc + val, 0) as number;
                    const userHasVoted = hasVoted(item.id);
                    
                    return (
                    <div key={item.id} className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 group flex flex-col h-full relative cursor-pointer" onClick={() => openPoling(item)}>
                       
                       {/* Cover */}
                       {item.gambarPreview ? (
                          <div className="h-44 sm:h-52 w-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center relative overflow-hidden group-hover:opacity-90 transition-opacity shrink-0">
                             <img src={item.gambarPreview} alt="" className="w-full h-full object-cover" />
                          </div>
                       ) : (
                          <div className="h-44 sm:h-52 w-full bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center relative overflow-hidden group-hover:bg-teal-100 transition-colors shrink-0">
                             <BarChart3 className="w-16 h-16 text-teal-300 dark:text-teal-700 group-hover:text-teal-400 dark:group-hover:text-teal-500 transition-colors" />
                          </div>
                       )}
                       
                       {userHasVoted && (
                          <div className="absolute top-4 right-4 z-10 bg-green-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
                             <CheckCircle2 className="w-3.5 h-3.5" /> SUDAH VOTING
                          </div>
                       )}
                       
                       <div className="p-5 flex flex-col flex-1">
                          <h3 className="font-bold text-lg sm:text-xl text-slate-800 dark:text-white leading-tight mb-2 line-clamp-2">{item.judul}</h3>
                          
                          {/* Live Bar Chart Mockup (Top 2) */}
                          <div className="mt-4 space-y-2.5 flex-1">
                            {Object.entries(voteData.counts).slice(0, 2).map(([opt, count]: [string, any]) => {
                               const percentage = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
                               return (
                                 <div key={opt} className="relative w-full h-7 bg-slate-100 dark:bg-slate-700 rounded-md overflow-hidden flex items-center text-xs font-bold px-2 z-10 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                                   <div className="absolute left-0 top-0 bottom-0 bg-teal-400 dark:bg-teal-600 z-0 opacity-50" style={{ width: `${percentage}%` }}></div>
                                   <span className="relative z-10 flex-1">Paslon {opt}</span>
                                   <span className="relative z-10">{percentage}%</span>
                                 </div>
                               )
                            })}
                            {Object.keys(voteData.counts).length > 2 && <div className="text-center text-xs text-slate-500 font-medium">+ {Object.keys(voteData.counts).length - 2} paslon lannya</div>}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 text-xs text-slate-500 dark:text-slate-400 font-medium">
                             <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{item.tanggal}</div>
                             <div className="flex items-center gap-1 font-bold text-teal-600 dark:text-teal-400 ml-auto">{totalVotes} Total Suara</div>
                          </div>
                       </div>
                    </div>
                    );
                 })}
              </div>
           ) : (
              <div className="bg-slate-50 dark:bg-slate-800/20 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 mt-4">
                 <BarChart3 className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                 <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Belum ada Pemilihan</h3>
                 <p className="text-slate-500 max-w-sm mx-auto">Saat ini belum ada poling / pemilihan ketua OSIS yang diterbitkan untuk saat ini.</p>
              </div>
           )
        ) : (
            filteredSurvei.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                 {filteredSurvei.map((item) => (
                    <div key={item.id} className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group flex flex-col p-6 cursor-pointer relative" onClick={() => openSurvei(item)}>
                       
                       <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-500 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-800 shrink-0">
                          <FileText className="w-7 h-7" />
                       </div>
                       
                       <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-tight mb-2 line-clamp-2">{item.judul}</h3>
                       <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">{item.deskripsi || 'Silakan isi survei berikut.'}</p>
                       
                       <div className="flex flex-wrap items-center gap-3 mt-auto pt-4 border-t border-slate-100 dark:border-slate-700/50 text-xs text-slate-500 dark:text-slate-400 font-medium">
                          <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{item.tanggal}</div>
                          <div className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{item.pembuat}</div>
                       </div>
                    </div>
                 ))}
              </div>
           ) : (
              <div className="bg-slate-50 dark:bg-slate-800/20 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 mt-4">
                 <FileText className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                 <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Belum ada Survei</h3>
                 <p className="text-slate-500 max-w-sm mx-auto">Saat ini belum ada formulir survei sekolah yang dibagikan.</p>
              </div>
           )
        )}
      </div>
      {renderPolingModal()}
      {renderSurveiModal()}
    </div>
  );
}
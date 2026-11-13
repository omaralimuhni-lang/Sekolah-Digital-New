import { useState, useEffect, useRef } from 'react';
import { BookOpen, Calendar, Clock, FileText, Upload, CheckCircle, ArrowLeft, ChevronLeft, ChevronRight, Globe, Flag, Play, ClipboardList } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppContext } from '../../AppContext';
import { usePRTugas, Tugas } from '../../PRTugasContext';

interface JawabanOffline {
  fileBase64: string;
  fileName: string;
  status: 'Menunggu Penilaian' | 'Dinilai';
  nilai?: number;
}
interface JawabanOnline {
  jawaban: Record<number, string>;
  ragu: Record<number, boolean>;
  status: 'Selesai';
  nilai: number;
}
export const PRTugasSiswa = () => {
  const { user, showNotification } = useAppContext();
  const { tugasList, penilaianTugas } = usePRTugas();
  const [activeTab, setActiveTab] = useState<'offline' | 'online'>('offline');
  const [siswaClass, setSiswaClass] = useState<string>('');
  const [jawabanStore, setJawabanStore] = useState<Record<string, any>>({});
  // View States
  const [activeTask, setActiveTask] = useState<Tugas | null>(null);
  const [mode, setMode] = useState<'list' | 'detail_offline' | 'cbt_intro' | 'cbt_run' | 'cbt_result'>('list');
  // Offline Upload State
  const [uploadFile, setUploadFile] = useState<{name: string, base64: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // CBT State
  const [currentSoal, setCurrentSoal] = useState(0);
  const [cbtAnswers, setCbtAnswers] = useState<Record<number, string>>({});
  const [cbtDoubt, setCbtDoubt] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(0); // seconds
  const timerRef = useRef<any>(null);
  const loadData = () => {
    // 1. Get user's class
    const dbs = JSON.parse(localStorage.getItem('sd_db_siswa') || '[]');
    const dbsDemo = [
      { id: 'S1', fullName: 'Ahmad Hanif', class: '10 IPA 1', username: 'ahmad' }
    ];
    let found = dbs.find((s: any) => (user?.nisn && s.nisn === user?.nisn) || s.fullName === user?.name || s.username === user?.name);
    if (!found) found = dbsDemo.find((s: any) => (user?.nisn && s.nisn === user?.nisn) || s.fullName === user?.name || s.username === user?.name);
    // If not found, default to '10 IPA 1' for demo to show data
    setSiswaClass(found?.class || '10 IPA 1');
    // 3. Load Answers
    const answers = JSON.parse(localStorage.getItem(`sd_tugas_jawaban_${user?.id}`) || '{}');
    setJawabanStore(answers);
  };
  useEffect(() => {
    loadData();
    const handleStorageUpdate = (e?: StorageEvent | Event) => {
       if (e instanceof StorageEvent) {
          if (e.key === `sd_tugas_jawaban_${user?.id}` || e.key === 'sd_penilaian_tugas') {
             loadData();
          }
       } else {
          loadData();
       }
    };
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('localStorageUpdate', handleStorageUpdate);
    return () => {
       window.removeEventListener('storage', handleStorageUpdate);
       window.removeEventListener('localStorageUpdate', handleStorageUpdate);
    };
  }, [user]);
  // Handle Offline
  const handleOpenOffline = (task: Tugas) => {
    setActiveTask(task);
    setMode('detail_offline');
    setUploadFile(null); // reset
  };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadFile({ name: file.name, base64: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };
  const submitOffline = () => {
    if (!uploadFile) {
      showNotification('Silakan upload file jawaban terlebih dahulu', 'error');
      return;
    }
    const newJawaban: JawabanOffline = {
      fileBase64: uploadFile.base64,
      fileName: uploadFile.name,
      status: 'Menunggu Penilaian'
    };
    const updatedStore = { ...jawabanStore, [activeTask!.id]: newJawaban };
    setJawabanStore(updatedStore);
    localStorage.setItem(`sd_tugas_jawaban_${user?.id}`, JSON.stringify(updatedStore));
    
    // Auto insert an empty/0 score into guru's penilaian list so they can grade it
    const pt = JSON.parse(localStorage.getItem('sd_penilaian_tugas') || '[]');
    // Try avoiding duplicates
    const exist = pt.find((p: any) => p.taskId === activeTask!.id && p.nisn === user?.nisn);
    if (!exist) {
      pt.push({
        id: Date.now().toString(),
        taskId: activeTask!.id,
        nisn: user?.nisn || '000000000',
        namaSiswa: user?.name,
        kelas: siswaClass,
        mapel: activeTask?.mataPelajaran || 'Umum',
        namaTugas: activeTask?.namaTugas,
        tipe: 'Offline (Menunggu Nilai)',
        nilai: 0,
        tanggal: new Date().toISOString().split('T')[0],
        guru: activeTask?.guru,
        fileJawaban: uploadFile.base64,
        fileJawabanName: uploadFile.name
      });
      localStorage.setItem('sd_penilaian_tugas', JSON.stringify(pt));
      window.dispatchEvent(new Event('localStorageUpdate'));
    } else {
      exist.fileJawaban = uploadFile.base64;
      exist.fileJawabanName = uploadFile.name;
      exist.tipe = 'Offline (Menunggu Nilai)';
      localStorage.setItem('sd_penilaian_tugas', JSON.stringify(pt));
      window.dispatchEvent(new Event('localStorageUpdate'));
    }
    
    showNotification('Tugas berhasil dikirim!', 'success');
    setMode('list');
  };
  // Handle Online CBT
  const handleOpenOnline = (task: Tugas) => {
    setActiveTask(task);
    setMode('cbt_intro');
  };
  const startCBT = () => {
    setCurrentSoal(0);
    setCbtAnswers({});
    setCbtDoubt({});
    // parse duration from task, fallback to 60 mins
    let durationMins = 60;
    const match = activeTask?.waktuPengerjaan.match(/(\d+)/);
    if (match) durationMins = parseInt(match[0], 10);
    setTimeLeft(durationMins * 60);
    setMode('cbt_run');
  };
  useEffect(() => {
    if (mode === 'cbt_run') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            finishCBT(true); // timeout finish
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [mode]);
  const finishCBT = (isTimeout = false) => {
    if (!isTimeout) {
      if (!window.confirm('Apakah Anda yakin ingin menyelesaikan ujian ini?')) return;
    }
    clearInterval(timerRef.current);
    
    // Calculate Score
    const soalList = activeTask?.soalOnline || [];
    let correct = 0;
    soalList.forEach((soal, idx) => {
      if (cbtAnswers[idx] === soal.jawabanBenar) correct++;
    });
    const nilai = soalList.length > 0 ? Math.round((correct / soalList.length) * 100) : 0;
    const newJawaban: JawabanOnline = {
      jawaban: cbtAnswers,
      ragu: cbtDoubt,
      status: 'Selesai',
      nilai
    };
    const updatedStore = { ...jawabanStore, [activeTask!.id]: newJawaban };
    setJawabanStore(updatedStore);
    localStorage.setItem(`sd_tugas_jawaban_${user?.id}`, JSON.stringify(updatedStore));
    // Save to global assessments for guru
    const pt = JSON.parse(localStorage.getItem('sd_penilaian_tugas') || '[]');
    const exist = pt.find((p: any) => p.taskId === activeTask!.id && p.nisn === user?.nisn);
    if (!exist) {
      pt.push({
        id: Date.now().toString(),
        taskId: activeTask!.id,
        nisn: user?.nisn || '000000000',
        namaSiswa: user?.name,
        kelas: siswaClass,
        mapel: activeTask?.mataPelajaran || 'Umum',
        namaTugas: activeTask?.namaTugas,
        tipe: 'CBT Online',
        nilai: nilai,
        tanggal: new Date().toISOString().split('T')[0],
        guru: activeTask?.guru
      });
    } else {
        exist.nilai = nilai;
        exist.tipe = 'CBT Online';
    }
    localStorage.setItem('sd_penilaian_tugas', JSON.stringify(pt));
    window.dispatchEvent(new Event('localStorageUpdate'));
    
    if (isTimeout) {
      showNotification('Waktu habis! Ujian otomatis diselesaikan.', 'info');
    } else {
      showNotification('Ujian Selesai! Jawaban berhasil dikirim.', 'success');
    }
    
    setMode('cbt_result');
  };
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  // Filter tasks based on student class
  const myTasks = tugasList.filter(t => t.kelas === siswaClass);
  const filteredTasks = myTasks.filter(t => t.tipe === activeTab);
  if (mode === 'cbt_run' && activeTask) {
    const soal = activeTask.soalOnline?.[currentSoal];
    return (
      <div className="max-w-7xl mx-auto min-h-screen bg-slate-50 dark:bg-slate-900 pb-24 lg:pb-12 pt-6 px-4">
        {/* CBT Header */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 md:p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-4 z-40 mb-6">
            <div>
               <h1 className="text-xl font-bold text-slate-800 dark:text-white">{activeTask.namaTugas}</h1>
               <p className="text-slate-500 dark:text-slate-400 text-sm">{activeTask.mataPelajaran} • {activeTask.guru}</p>
            </div>
            <div className="flex gap-4 items-center">
               <div className="bg-red-100 dark:bg-red-500/20 text-red-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-lg">
                   <Clock className="w-5 h-5" /> {formatTime(timeLeft)}
               </div>
               <button onClick={() => finishCBT(false)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/20">
                   Selesai Ujian
               </button>
            </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Question Area */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-xl">Soal No. {currentSoal + 1}</h2>
                </div>
                
                {soal && (
                   <div className="space-y-6">
                      <div className="text-lg text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                          {soal.pertanyaan}
                      </div>
                      {soal.gambarBase64 && (
                          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl inline-block border border-slate-100 dark:border-slate-700">
                             <img src={soal.gambarBase64} alt="Soal" className="max-h-64 object-contain rounded-xl" />
                          </div>
                      )}
                      <div className="space-y-3 pt-4">
                          {['A', 'B', 'C', 'D', 'E'].map((opt) => (
                              <button 
                                key={opt}
                                onClick={() => setCbtAnswers({...cbtAnswers, [currentSoal]: opt})}
                                className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all flex items-center gap-4 
                                   ${cbtAnswers[currentSoal] === opt 
                                     ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm' 
                                     : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                              >
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0
                                      ${cbtAnswers[currentSoal] === opt ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                                      {opt}
                                  </div>
                                  <div className="font-medium">{(soal as any)[opt]}</div>
                              </button>
                          ))}
                      </div>
                   </div>
                )}
                {/* Question Navigation */}
                <div className="flex flex-wrap items-center justify-between gap-4 mt-12 pt-6 border-t border-slate-100 dark:border-slate-700">
                    <button 
                      onClick={() => setCurrentSoal(prev => Math.max(0, prev - 1))}
                      disabled={currentSoal === 0}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-colors bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-700 dark:text-slate-300 disabled:opacity-50"
                    >
                        <ChevronLeft className="w-5 h-5" /> Soal Sebelumnya
                    </button>
                    
                    <button 
                      onClick={() => setCbtDoubt({...cbtDoubt, [currentSoal]: !cbtDoubt[currentSoal]})}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-colors
                          ${cbtDoubt[currentSoal] ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-300 dark:border-amber-700/50' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-700 dark:text-slate-300'}`}
                    >
                        <Flag className={`w-5 h-5 ${cbtDoubt[currentSoal] ? 'fill-current' : ''}`} /> 
                        {cbtDoubt[currentSoal] ? 'Hapus Ragu-ragu' : 'Tandai Ragu-ragu'}
                    </button>
                    <button 
                      onClick={() => setCurrentSoal(prev => Math.min((activeTask.soalOnline?.length || 1) - 1, prev + 1))}
                      disabled={currentSoal === (activeTask.soalOnline?.length || 1) - 1}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 shadow-lg shadow-blue-500/20"
                    >
                        Soal Berikutnya <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
            {/* Right: Question Map */}
            <div className="w-full lg:w-80 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 shrink-0 h-fit">
                <h3 className="font-bold text-slate-800 dark:text-white mb-4">Navigasi Soal</h3>
                <div className="grid grid-cols-5 gap-2">
                    {activeTask.soalOnline?.map((_, idx) => {
                        const isAnswered = !!cbtAnswers[idx];
                        const isDoubt = cbtDoubt[idx];
                        const isCurrent = currentSoal === idx;
                        let bgClass = 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200';
                        if (isCurrent) bgClass = 'bg-blue-600 border-blue-600 text-white ring-2 ring-blue-500/30';
                        else if (isDoubt) bgClass = 'bg-amber-400 border-amber-400 text-white';
                        else if (isAnswered) bgClass = 'bg-emerald-500 border-emerald-500 text-white';
                        return (
                            <button
                                key={idx}
                                onClick={() => setCurrentSoal(idx)}
                                className={`w-full aspect-square flex items-center justify-center font-bold text-sm rounded-lg border-2 transition-all ${bgClass}`}
                            >
                                {idx + 1}
                            </button>
                        );
                    })}
                </div>
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 space-y-3 text-sm font-medium">
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-emerald-500 rounded border border-emerald-600"></div> <span className="text-slate-600 dark:text-slate-400">Sudah Dijawab</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-amber-400 rounded border border-amber-500"></div> <span className="text-slate-600 dark:text-slate-400">Ragu-ragu</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-slate-100 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700"></div> <span className="text-slate-600 dark:text-slate-400">Belum Dijawab</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  }
  if (mode === 'cbt_intro' && activeTask) {
    const isDone = jawabanStore[activeTask.id];
    let displayNilai = isDone?.nilai;
    if (isDone) {
        const guruPenilaian = penilaianTugas.find((p: any) => p.taskId === activeTask.id && p.nisn === user?.nisn);
        if (guruPenilaian && guruPenilaian.nilai !== undefined) {
           displayNilai = guruPenilaian.nilai;
        }
    }
    return (
       <div className="max-w-4xl mx-auto min-h-screen bg-slate-50 dark:bg-slate-900 pb-24 lg:pb-12 pt-6 px-4">
           {!isDone && (
              <button onClick={() => setMode('list')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-white mb-6 transition-colors">
                  <ArrowLeft className="w-5 h-5"/> Kembali ke daftar
              </button>
           )}
           <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 text-center max-w-2xl mx-auto">
               <div className="w-20 h-20 bg-purple-100 dark:bg-purple-500/20 text-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                   <Globe className="w-10 h-10" />
               </div>
               <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">{activeTask.namaTugas}</h1>
               <p className="text-slate-500 mb-8">{activeTask.mataPelajaran} • {activeTask.guru} • {activeTask.soalOnline?.length} Soal Pilihan Ganda</p>
               {isDone ? (
                   <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 text-center">
                       <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                       <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">Anda sudah menyelesaikan ujian ini</h3>
                       <div className="text-4xl font-extrabold text-slate-800 dark:text-white my-6">
                           Nilai: <span className="text-blue-600 dark:text-blue-400">{displayNilai}</span>
                       </div>
                       <button onClick={() => setMode('list')} className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-medium rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                           Kembali ke Daftar Tugas
                       </button>
                   </div>
               ) : (
                   <>
                       <div className="text-left bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 mb-8 text-slate-700 dark:text-slate-300">
                           <h4 className="font-bold mb-3 text-slate-800 dark:text-white">Tata Cara Pelaksanaan (CBT System):</h4>
                           <p className="mb-4 whitespace-pre-wrap">{activeTask.tataCara}</p>
                           <ul className="space-y-2 text-sm">
                               <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/> Siapkan koneksi internet yang stabil</li>
                               <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/> Waktu akan berjalan otomatis saat Anda klik "Mulai"</li>
                               <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/> Anda tidak dapat mengulang ujian setelah selesai</li>
                           </ul>
                       </div>
                       <button onClick={startCBT} className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-blue-500/30">
                           <Play className="w-6 h-6 fill-current" /> Mulai Mengerjakan Ujian
                       </button>
                   </>
               )}
           </div>
       </div>
    );
  }
  if (mode === 'cbt_result' && activeTask) {
    const nilai = jawabanStore[activeTask.id]?.nilai || 0;
    return (
       <div className="max-w-4xl mx-auto min-h-screen bg-slate-50 dark:bg-slate-900 pb-24 lg:pb-12 pt-16 px-4 flex items-center justify-center">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-700 text-center max-w-md w-full relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-500/20 to-transparent"></div>
                <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-6 relative z-10" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 relative z-10">Ujian Selesai!</h2>
                <p className="text-slate-500 mb-8 relative z-10">Jawaban Anda telah tersimpan di sistem.</p>
                
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 mb-8 relative z-10">
                    <div className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider">Nilai Anda</div>
                    <div className="text-6xl font-extrabold text-blue-600 dark:text-blue-400">{nilai}</div>
                </div>
                <button onClick={() => setMode('list')} className="w-full px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold rounded-xl transition-colors relative z-10">
                    Selesai & Kembali
                </button>
            </motion.div>
       </div>
    );
  }
  if (mode === 'detail_offline' && activeTask) {
    let jwb = jawabanStore[activeTask.id] as JawabanOffline | undefined;
    
    // Sync with guru's grading
    if (jwb) {
        const guruPenilaian = penilaianTugas.find((p: any) => p.taskId === activeTask.id && p.nisn === user?.nisn);
        if (guruPenilaian && guruPenilaian.nilai !== undefined && guruPenilaian.nilai > 0) {
           jwb = { ...jwb, nilai: guruPenilaian.nilai, status: 'Dinilai' };
        }
    }
    return (
       <div className="max-w-4xl mx-auto min-h-screen bg-slate-50 dark:bg-slate-900 pb-24 lg:pb-12 pt-6 px-4">
           <button onClick={() => setMode('list')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-white mb-6 transition-colors">
               <ArrowLeft className="w-5 h-5"/> Kembali ke daftar
           </button>
           <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
               <div className="border-b border-slate-100 dark:border-slate-700 pb-6 mb-6">
                   <div className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 font-semibold rounded-lg text-xs mb-4">PR Offline</div>
                   <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white leading-tight mb-2">{activeTask.namaTugas}</h1>
                   <div className="flex flex-wrap items-center gap-4 text-slate-500 dark:text-slate-400 text-sm">
                       <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4"/> Deadline: {activeTask.waktuPengerjaan}</span>
                       <span className="flex items-center gap-1.5">Mapel: {activeTask.mataPelajaran}</span>
                       <span className="flex items-center gap-1.5">Guru: {activeTask.guru}</span>
                   </div>
               </div>
               <div className="space-y-6 text-slate-700 dark:text-slate-300">
                   <div>
                       <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-white">Uraian Tugas</h3>
                       <p className="whitespace-pre-wrap">{activeTask.uraianTugas}</p>
                   </div>
                   <div>
                       <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-white">Tata Cara Pengerjaan</h3>
                       <p className="whitespace-pre-wrap bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700">{activeTask.tataCara}</p>
                   </div>
                   {activeTask.fileName && (
                       <div>
                           <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-white">File Soal dari Guru</h3>
                           <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                               onClick={() => {
                                    if (activeTask.soalFile) {
                                        const win = window.open();
                                        if (win) win.document.write(`<iframe src="${activeTask.soalFile}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                                    }
                               }}>
                               <FileText className="w-8 h-8 text-blue-600" />
                               <div>
                                   <div className="font-medium text-blue-800 dark:text-blue-300">{activeTask.fileName}</div>
                                   <div className="text-xs text-blue-600/70 dark:text-blue-400/70">Klik untuk melihat file materi / soal</div>
                               </div>
                           </div>
                       </div>
                   )}
               </div>
               {/* Submission Section */}
               <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700">
                   {jwb ? (
                       <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6">
                           <div className="flex items-center gap-3 mb-4">
                               <CheckCircle className="w-6 h-6 text-emerald-500" />
                               <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-400">Tugas telah dikumpulkan</h3>
                           </div>
                           <div className="flex bg-white dark:bg-slate-800 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900 gap-4 items-center">
                               <FileText className="w-8 h-8 text-slate-400" />
                               <div className="flex-1">
                                   <div className="font-medium text-slate-800 dark:text-slate-200">{jwb.fileName}</div>
                                   <div className="text-sm text-slate-500">Status: <span className="font-semibold">{jwb.status}</span></div>
                               </div>
                               {jwb.nilai !== undefined && (
                                   <div className="text-right pl-4 border-l border-slate-200 dark:border-slate-700">
                                       <div className="text-xs font-semibold text-slate-500 uppercase">Nilai</div>
                                       <div className="text-2xl font-bold text-emerald-600">{jwb.nilai}</div>
                                   </div>
                               )}
                           </div>
                       </div>
                   ) : (
                       <div>
                           <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">Upload Jawaban</h3>
                           <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                onClick={() => fileInputRef.current?.click()}>
                               <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" className="hidden" />
                               <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                                   <Upload className="w-8 h-8 text-slate-400" />
                               </div>
                               <h4 className="font-bold text-slate-800 dark:text-white mb-2">{uploadFile ? uploadFile.name : 'Pilih file jawaban'}</h4>
                               <p className="text-slate-500 text-sm">{uploadFile ? 'Klik untuk mengganti file' : 'Format didukung: JPG, PNG, PDF, Word. Maksimal 5MB'}</p>
                           </div>
                           
                           {uploadFile && (
                               <div className="mt-6 flex justify-end gap-3">
                                   <button onClick={() => setUploadFile(null)} className="px-5 py-3 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Batal</button>
                                   <button onClick={submitOffline} className="px-6 py-3 font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2">
                                       <Upload className="w-5 h-5"/> Kirim Tugas Sekarang
                                   </button>
                               </div>
                           )}
                       </div>
                   )}
               </div>
           </div>
       </div>
    );
  }
  // --- LIST MODE ---
  return (
    <div className="max-w-7xl mx-auto pb-24 lg:pb-12 space-y-6 mt-6">
      <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl shadow-rose-500/20 relative overflow-hidden h-40 sm:h-48 flex flex-col justify-end">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
         <div className="absolute bottom-0 right-10 opacity-20 pointer-events-none transform translate-y-1/4 right-0 rotate-[-15deg]">
            <BookOpen className="w-48 h-48 sm:w-64 sm:h-64" />
         </div>
         
         <div className="relative z-10 w-full flex flex-col md:flex-row gap-6 items-start md:items-end justify-between">
           <div>
             <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">Tugas & Ujian</h1>
             <p className="text-rose-100 font-medium text-sm sm:text-base max-w-sm sm:max-w-md">({siswaClass}) Kerjakan daftar tugas dan ujian dari guru.</p>
           </div>
         </div>
      </div>
      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl overflow-x-auto no-scrollbar max-w-fit">
         <button 
           onClick={() => setActiveTab('offline')}
           className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${activeTab === 'offline' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}
         >
           <FileText className="w-4 h-4" />
           PR Offline
         </button>
         <button 
           onClick={() => setActiveTab('online')}
           className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${activeTab === 'online' ? 'bg-white dark:bg-slate-900 text-purple-600 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}
         >
           <Globe className="w-4 h-4" />
           Tugas Online (CBT)
         </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filteredTasks.length > 0 ? (
           filteredTasks.map(item => {
              const isDone = !!jawabanStore[item.id];
              return (
                 <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col h-full">
                     {isDone && (
                         <div className="absolute top-4 right-4 text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 p-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800" title="Telah dikerjakan">
                             <CheckCircle className="w-5 h-5"/>
                         </div>
                     )}
                     <div className="flex justify-between items-start mb-4">
                        <div className={`px-3 py-1 text-xs font-semibold rounded-lg ${activeTab === 'offline' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                           {item.mataPelajaran}
                        </div>
                    </div>
                    <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-2 leading-tight">{item.namaTugas}</h3>
                    
                    <div className="space-y-2 mb-6 text-sm flex-1">
                       <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                           <Clock className="w-4 h-4 text-slate-400"/> {item.waktuPengerjaan}
                       </div>
                       <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                           Guru: {item.guru}
                       </div>
                       {item.tipe === 'online' && (
                           <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                               {item.soalOnline?.length || 0} Soal Pilihan Ganda
                           </div>
                       )}
                    </div>
                    <button 
                       onClick={() => item.tipe === 'offline' ? handleOpenOffline(item) : handleOpenOnline(item)}
                       className={`w-full py-3 rounded-xl font-bold transition-all text-center flex justify-center items-center gap-2 shadow-sm 
                        ${isDone 
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700' 
                          : activeTab === 'offline' 
                             ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20' 
                             : 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-500/20'}`}
                    >
                        {isDone ? 'Lihat Hasil' : activeTab === 'offline' ? 'Lihat & Kerjakan' : 'Masuk Ujian CBT'}
                    </button>
                 </div>
              );
           })
         ) : (
           <div className="col-span-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center py-20 flex flex-col items-center">
              <ClipboardList className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Belum ada tugas</h3>
              <p className="text-slate-500 mt-2">Belum ada {activeTab === 'offline' ? 'PR offline' : 'tugas online'} untuk kelas Anda.</p>
           </div>
         )}
      </div>
    </div>
  );
};
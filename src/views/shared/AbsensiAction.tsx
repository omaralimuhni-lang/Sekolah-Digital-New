import { useState, useRef, useEffect } from 'react';
import { LogIn, LogOut, Thermometer, CalendarMinus, DoorOpen, DoorClosed, X, Clock, MapPin, RotateCcw, Check, FileText } from 'lucide-react';
import { useAppContext } from '../../AppContext';
import { triggerNotificationUpdate } from '../../lib/eventBus';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { triggerHaptic } from '../../lib/haptic';

export default function AbsensiAction() {
  const { user, showNotification } = useAppContext();

  const [activeCamera, setActiveCamera] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<string>('Mencari lokasi...');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  const [absensiList, setAbsensiList] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isMitra = user?.role === 'mitra';

  useEffect(() => {
    const loadData = () => {
      const data = JSON.parse(localStorage.getItem('sd_absensi_list') || '[]');
      const myData = data.filter((item: any) => item.userId === user.id);
      setAbsensiList(myData.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    };
    loadData();

    const handleCustomStorageUpdate = () => loadData();
    window.addEventListener('storage', handleCustomStorageUpdate);
    window.addEventListener('localStorageUpdate', handleCustomStorageUpdate);

    return () => {
      window.removeEventListener('storage', handleCustomStorageUpdate);
      window.removeEventListener('localStorageUpdate', handleCustomStorageUpdate);
    };
  }, [user.id]);

  useEffect(() => {
    let timer: any;
    if (activeCamera) {
      timer = setInterval(() => setCurrentTime(new Date()), 1000);
      
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation(`Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`);
          },
          () => {
            setLocation('Lokasi tidak tersedia');
          }
        );
      }
    }
    return () => clearInterval(timer);
  }, [activeCamera]);

  const openCamera = async (action: string) => {
    triggerHaptic('medium');
    setPhoto(null);
    setActiveCamera(action);
    const facingMode = (action === 'Hadir' || action === 'Pulang') ? 'user' : 'environment';
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      showNotification("Gagal mengakses kamera. Pastikan izin kamera diberikan.", "error");
      setActiveCamera(null);
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setActiveCamera(null);
    setPhoto(null);
  };

  const takePhoto = () => {
    triggerHaptic('light');
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
        
        ctx.fillStyle = 'white';
        ctx.font = '16px Inter, sans-serif';
        const dateStr = currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const timeStr = currentTime.toLocaleTimeString('id-ID');
        ctx.fillText(`${dateStr} ${timeStr}`, 10, canvas.height - 35);
        ctx.fillText(`Lokasi: ${location}`, 10, canvas.height - 15);
        
        const dataUrl = canvas.toDataURL('image/jpeg');
        setPhoto(dataUrl);
        
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
      }
    }
  };

  const retakePhoto = () => {
    triggerHaptic('light');
    setPhoto(null);
    openCamera(activeCamera!);
  };

  const submitAbsen = () => {
    triggerHaptic('heavy');
    const data = JSON.parse(localStorage.getItem('sd_absensi_list') || '[]');
    
    const newAbsensi = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      role: user.role,
      date: currentTime.toLocaleDateString('id-ID'),
      time: currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      type: activeCamera,
      status: (activeCamera === 'Hadir' || activeCamera === 'Pulang' || activeCamera === 'Buka' || activeCamera === 'Tutup') ? 'Berhasil' : 'Menunggu',
      location: location,
      photoUrl: photo,
    };

    data.push(newAbsensi);
    localStorage.setItem('sd_absensi_list', JSON.stringify(data));
    
    triggerNotificationUpdate(['Laporan Kehadiran']);

    showNotification(`Berhasil mengirim absen ${activeCamera}`, 'success');
    closeCamera();
  };

  const cardsUmum = [
    { id: 'Hadir', title: 'Hadir', icon: LogIn, color: 'bg-emerald-500', shadow: 'shadow-emerald-500/30' },
    { id: 'Pulang', title: 'Pulang', icon: LogOut, color: 'bg-blue-500', shadow: 'shadow-blue-500/30' },
    { id: 'Sakit', title: 'Sakit', icon: Thermometer, color: 'bg-amber-500', shadow: 'shadow-amber-500/30' },
    { id: 'Izin', title: 'Izin', icon: CalendarMinus, color: 'bg-indigo-500', shadow: 'shadow-indigo-500/30' },
  ];

  const cardsMitra = [
    { id: 'Buka', title: 'Buka', icon: DoorOpen, color: 'bg-emerald-500', shadow: 'shadow-emerald-500/30' },
    { id: 'Tutup', title: 'Tutup', icon: DoorClosed, color: 'bg-rose-500', shadow: 'shadow-rose-500/30' },
  ];

  const umumHistory = absensiList.filter(item => item.type !== 'Buka' && item.type !== 'Tutup');
  const mitraHistory = absensiList.filter(item => item.type === 'Buka' || item.type === 'Tutup');

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  return (
    <div className="w-full space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Absensi Harian</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Silakan pilih status kehadiran Anda untuk hari ini.
        </p>

        <div className={`grid gap-4 ${isMitra ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`}>
          {isMitra ? (
            cardsMitra.map((card, index) => (
              <motion.button
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => openCamera(card.title)}
                className={`relative overflow-hidden rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg focus:outline-none ${card.color} ${card.shadow} shadow-[0_8px_32px_rgba(0,0,0,0.1)]`}
              >
                <div className="absolute inset-0 bg-white/20 dark:bg-black/5 opacity-0 hover:opacity-100 transition-opacity"></div>
                
                <div className="relative z-10 w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                  <card.icon className="w-8 h-8 text-white drop-shadow-sm" />
                </div>
                
                <span className="relative z-10 font-bold text-white text-lg tracking-wide drop-shadow-md">
                  {card.title}
                </span>
              </motion.button>
            ))
          ) : (
            cardsUmum.map((card, index) => (
              <motion.button
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => openCamera(card.title)}
                className={`relative overflow-hidden rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg focus:outline-none ${card.color} ${card.shadow} shadow-[0_8px_32px_rgba(0,0,0,0.1)]`}
              >
                <div className="absolute inset-0 bg-white/20 dark:bg-black/5 opacity-0 hover:opacity-100 transition-opacity"></div>
                
                <div className="relative z-10 w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                  <card.icon className="w-8 h-8 text-white drop-shadow-sm" />
                </div>
                
                <span className="relative z-10 font-bold text-white text-lg tracking-wide drop-shadow-md">
                  {card.title}
                </span>
              </motion.button>
            ))
          )}
        </div>
      </div>

      {!isMitra && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Riwayat Absensi Anda</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                  <th className="pb-3 font-medium">Foto</th>
                  <th className="pb-3 font-medium">Tanggal</th>
                  <th className="pb-3 font-medium">Waktu</th>
                  <th className="pb-3 font-medium">Tipe</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {umumHistory.length > 0 ? umumHistory.map((item: any) => (
                  <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                    <td className="py-3">
                      {item.photoUrl ? (
                         <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 cursor-pointer" onClick={() => setSelectedPhoto(item.photoUrl)}>
                           <img src={item.photoUrl} alt="Absen" className="w-full h-full object-cover hover:scale-110 transition-transform" />
                         </div>
                      ) : '-'}
                    </td>
                    <td className="py-3 text-slate-700 dark:text-slate-300">{item.date}</td>
                    <td className="py-3 text-slate-700 dark:text-slate-300">{item.time}</td>
                    <td className="py-3">
                      <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${
                        item.type === 'Sakit' ? 'bg-amber-100 text-amber-700' :
                        item.type === 'Izin' ? 'bg-indigo-100 text-indigo-700' :
                        item.type === 'Hadir' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${item.status === 'Berhasil' || item.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-500">Belum ada riwayat absensi.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isMitra && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Riwayat Buka & Tutup Bulan Ini</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                  <th className="pb-3 font-medium">Foto</th>
                  <th className="pb-3 font-medium">Tanggal</th>
                  <th className="pb-3 font-medium">Tipe</th>
                  <th className="pb-3 font-medium">Waktu</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {mitraHistory.length > 0 ? mitraHistory.map((item: any) => (
                  <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                    <td className="py-3">
                      {item.photoUrl ? (
                         <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 cursor-pointer" onClick={() => setSelectedPhoto(item.photoUrl)}>
                           <img src={item.photoUrl} alt="Absen" className="w-full h-full object-cover hover:scale-110 transition-transform" />
                         </div>
                      ) : '-'}
                    </td>
                    <td className="py-3 text-slate-700 dark:text-slate-300">{item.date}</td>
                    <td className="py-3">
                      <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${
                        item.type === 'Buka' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {item.time}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-500">Belum ada riwayat absensi.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedPhoto && createPortal(
         <div className="fixed inset-0 z-[99999] bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
            <div className="relative max-w-2xl w-full">
               <button onClick={() => setSelectedPhoto(null)} className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white bg-black/50 rounded-full"><X className="w-6 h-6" /></button>
               <img src={selectedPhoto} alt="Zoom" className="w-full h-auto max-h-[85vh] object-contain rounded-xl" />
            </div>
         </div>,
         document.body
      )}

      {/* Camera Modal */}
      {activeCamera && createPortal(
        <div className="fixed inset-0 z-[99999] bg-black text-white flex flex-col h-[100dvh] overflow-hidden">
          {/* Top Bar */}
          <div className="flex items-center justify-between p-4 bg-black pb-4 pt-safe">
            <button onClick={closeCamera} className="p-2 bg-slate-800/50 rounded-full hover:bg-slate-700 active:scale-95 transition-all">
              <X className="w-5 h-5 text-white" />
            </button>
            <span className="font-semibold text-[15px] uppercase tracking-widest text-slate-200">{activeCamera}</span>
            <div className="w-9"></div>
          </div>

          {/* Viewfinder */}
          <div className="relative flex-1 flex flex-col items-center justify-center bg-black overflow-hidden m-0 sm:m-4 sm:rounded-[32px] sm:border-8 border-slate-900">
            {!photo ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <img src={photo} alt="Preview" className="w-full h-full object-cover" />
            )}
            
            {/* Timestamp & Location Overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-1.5 text-[13px] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] pointer-events-none p-3 bg-black/30 backdrop-blur-sm rounded-xl">
              <div className="flex items-center gap-2 font-medium">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>
                  {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} &bull; {currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-2 font-medium truncate">
                <MapPin className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="truncate">{location}</span>
              </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Bottom Controls */}
          <div className="h-32 sm:h-40 bg-black flex items-center justify-center gap-12 pb-safe">
            {!photo ? (
              <>
                <div className="w-16 h-16 opacity-0" />
                {/* Shutter Button - iPhone Style */}
                <button 
                  onClick={takePhoto}
                  className="w-[72px] h-[72px] rounded-full border-[3px] border-white flex items-center justify-center bg-transparent active:scale-95 transition-transform"
                >
                  <div className="w-[58px] h-[58px] rounded-full bg-white"></div>
                </button>
                <div className="w-16 h-16" />
              </>
            ) : (
              <>
                <button 
                  onClick={retakePhoto}
                  className="flex flex-col items-center gap-2 text-white/80 hover:text-white"
                >
                  <div className="w-[52px] h-[52px] rounded-full bg-slate-800 flex items-center justify-center">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-medium tracking-wide">Ulangi</span>
                </button>
                <button 
                  onClick={submitAbsen}
                  className="flex flex-col items-center gap-2 text-emerald-400 hover:text-emerald-300"
                >
                  <div className="w-[52px] h-[52px] rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    <Check className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold tracking-wide">Kirim Absen</span>
                </button>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}


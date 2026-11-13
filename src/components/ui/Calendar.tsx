import { useState, useEffect } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
} from 'date-fns';
import { id } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as    Trash2, Check, X, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAppContext } from '../../AppContext';
// Hardcoded some Indonesian National Holidays for 2026 for demo purposes as fallback
const FALLBACK_NATIONAL_HOLIDAYS: Record<string, string> = {
  '2026-01-01': 'Tahun Baru 2026 Masehi',
  '2026-02-18': 'Isra Mikraj Nabi Muhammad SAW',
  '2026-03-03': 'Hari Suci Nyepi Tahun Baru Saka 1948',
  '2026-03-20': 'Wafat Isa Al Masih',
  '2026-03-21': 'Hari Raya Idul Fitri 1447 Hijriah',
  '2026-03-22': 'Hari Raya Idul Fitri 1447 Hijriah',
  '2026-05-01': 'Hari Buruh Internasional',
  '2026-05-14': 'Kenaikan Isa Al Masih',
  '2026-05-28': 'Hari Raya Waisak 2570 BE',
  '2026-05-29': 'Hari Raya Idul Adha 1447 Hijriah',
  '2026-07-19': 'Tahun Baru Islam 1448 Hijriah',
  '2026-08-17': 'Hari Kemerdekaan Republik Indonesia',
  '2026-09-27': 'Maulid Nabi Muhammad SAW',
  '2026-12-25': 'Hari Raya Natal',
};
interface CalendarNote {
  id: string;
  authorName: string;
  authorRole: string;
  text: string;
  timestamp: string;
}
export function Calendar() {
  const { user, showNotification } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date()); // Selalu update ke hari ini
  const [selectedDateInfo, setSelectedDateInfo] = useState<{ date: Date; info: string | null; isWeekend: boolean } | null>(null);
  
  const [nationalHolidays, setNationalHolidays] = useState<Record<string, string>>(FALLBACK_NATIONAL_HOLIDAYS);
  const [notes, setNotes] = useState<Record<string, CalendarNote[]>>({});
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const loadNotes = () => {
    try {
      const stored = localStorage.getItem('sd_calendar_notes');
      if (stored) setNotes(JSON.parse(stored));
    } catch (e) {
      console.error(e);
    }
  };
  useEffect(() => {
    loadNotes();
    const handleStorageUpdate = () => loadNotes();
    window.addEventListener('localStorageUpdate', handleStorageUpdate);
    return () => window.removeEventListener('localStorageUpdate', handleStorageUpdate);
  }, []);
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const res = await fetch(`https://dayoffapi.vercel.app/api?year=${currentDate.getFullYear()}`);
        if (res.ok) {
          const data = await res.json();
          const holidays: Record<string, string> = { ...FALLBACK_NATIONAL_HOLIDAYS };
          data.forEach((item: any) => {
            if (item.is_cuti === false || item.is_cuti === true) { // just verifying it's standard structure
               holidays[item.tanggal] = item.keterangan;
            }
          });
          setNationalHolidays(holidays);
        }
      } catch (e) {
        // Fallback to hardcoded if fetch fails
      }
    };
    fetchHolidays();
  }, [currentDate.getFullYear()]);
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const onDateClick = (day: Date, isWeekend: boolean) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const info = nationalHolidays[dateKey] || null;
    setSelectedDateInfo({ date: day, info, isWeekend });
    setIsEditingNote(false);
    setNoteInput('');
  };
  const saveNote = () => {
    if (!user) return;
    if (!noteInput.trim()) return;
    
    if (!selectedDateInfo) return;
    const dateKey = format(selectedDateInfo.date, 'yyyy-MM-dd');
    
    const newNote: CalendarNote = {
      id: Math.random().toString(36).substr(2, 9),
      authorName: user.name,
      authorRole: user.role,
      text: noteInput.trim(),
      timestamp: new Date().toISOString()
    };
    
    const updatedNotes = {
      ...notes,
      [dateKey]: [...(notes[dateKey] || []), newNote]
    };
    
    setNotes(updatedNotes);
    localStorage.setItem('sd_calendar_notes', JSON.stringify(updatedNotes));
    window.dispatchEvent(new Event('localStorageUpdate'));
    
    setNoteInput('');
    setIsEditingNote(false);
    showNotification('Catatan tanggal berhasil ditambahkan', 'success');
  };
  const deleteNote = (noteId: string) => {
    if (!selectedDateInfo) return;
    const dateKey = format(selectedDateInfo.date, 'yyyy-MM-dd');
    
    const updatedDateNotes = (notes[dateKey] || []).filter(n => n.id !== noteId);
    const updatedNotes = {
      ...notes,
      [dateKey]: updatedDateNotes.length > 0 ? updatedDateNotes : []
    };
    
    setNotes(updatedNotes);
    localStorage.setItem('sd_calendar_notes', JSON.stringify(updatedNotes));
    window.dispatchEvent(new Event('localStorageUpdate'));
    showNotification('Catatan tanggal dihapus', 'success');
  };
  const canAddNote = user?.role === 'admin' || user?.role === 'guru' || user?.role === 'tendik';
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;
  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const formattedDate = format(day, dateFormat);
      const cloneDay = day;
      const dateKey = format(day, 'yyyy-MM-dd');
      const isHoliday = !!nationalHolidays[dateKey];
      const isSelected = selectedDateInfo && isSameDay(day, selectedDateInfo.date);
      const isWeekend = i === 0 || i === 6; // Sunday or Saturday
      const dayNotes = notes[dateKey] || [];
      const hasNotes = dayNotes.length > 0;
      days.push(
        <button
          key={day.toString()}
          onClick={() => onDateClick(cloneDay, isWeekend)}
          className={cn(
            "relative flex flex-col items-center justify-center p-2 text-sm aspect-square rounded-xl transition-all duration-300 border border-transparent",
            !isSameMonth(day, monthStart)
              ? "text-slate-400/50 dark:text-slate-500 font-light"
              : isHoliday || i === 0 // Make Sunday red like holiday
              ? "font-bold text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-500/10 hover:bg-red-100/80 dark:hover:bg-red-500/20 ring-1 ring-red-200/50 dark:ring-red-500/30 cursor-pointer shadow-sm"
              : "text-slate-700 dark:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-700/50 hover:shadow-sm cursor-pointer",
            isSelected && "ring-2 ring-indigo-500 dark:ring-indigo-400 ring-offset-1 ring-offset-transparent z-10 bg-indigo-600 dark:bg-indigo-500 text-white font-bold shadow-[0_4px_12px_rgba(79,70,229,0.3)]",
            isSameDay(day, new Date()) && !isSelected && "bg-white/50 dark:bg-slate-800/80 border-indigo-200 dark:border-indigo-500/30 shadow-sm text-indigo-700 dark:text-indigo-300 font-bold"
          )}
        >
          <span>{formattedDate}</span>
          {hasNotes && (
            <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 shadow-sm"></div>
          )}
        </button>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="grid grid-cols-7 gap-1" key={day.toString()}>
        {days}
      </div>
    );
    days = [];
  }
  const weekDays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  return (
    <div className="w-full mx-auto bg-white/50 dark:bg-slate-900/50 backdrop-blur-3xl transform-gpu rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)] border border-white/20 dark:border-white/20 flex flex-col md:flex-row lg:flex-col space-y-4 md:space-y-0 lg:space-y-4 md:space-x-8 lg:space-x-0 p-6 relative overflow-hidden transition-all duration-500">
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 dark:from-slate-800/30 to-transparent pointer-events-none"></div>
      <div className="flex-1 relative z-10 w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white capitalize tracking-tight drop-shadow-sm transition-colors duration-500">
            {format(currentDate, 'MMMM yyyy', { locale: id })}
          </h3>
          <div className="flex space-x-2">
            <button onClick={prevMonth} className="p-1.5 rounded-lg bg-white/70 dark:bg-slate-800/80 hover:bg-white/90 dark:hover:bg-slate-700/80 shadow-sm border border-white/20 dark:border-white/20 transition-all text-slate-600 dark:text-slate-300">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={nextMonth} className="p-1.5 rounded-lg bg-white/70 dark:bg-slate-800/80 hover:bg-white/90 dark:hover:bg-slate-700/80 shadow-sm border border-white/20 dark:border-white/20 transition-all text-slate-600 dark:text-slate-300">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 font-bold text-slate-400">
          {weekDays.map((day, i) => (
            <div key={i} className={cn(i === 0 ? "text-red-500" : "")}>{day}</div>
          ))}
        </div>
        <div className="space-y-1">
          {rows}
        </div>
      </div>
      <div className="w-full md:w-64 lg:w-full border-t md:border-t-0 lg:border-t lg:border-l-0 md:border-l border-white/20 dark:border-white/20 pt-4 md:pt-0 lg:pt-4 md:pl-6 lg:pl-0 flex flex-col relative z-10 transition-colors duration-500 min-h-[300px]">
        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 tracking-widest drop-shadow-sm transition-colors duration-500">Keterangan Tanggal</h4>
        
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl transform-gpu p-4 rounded-2xl border border-white/20 dark:border-white/20 shadow-sm transition-colors duration-500 flex-1 flex flex-col">
          <p className="text-sm font-bold text-slate-800 dark:text-white mb-2 drop-shadow-sm transition-colors duration-500">
            {selectedDateInfo ? format(selectedDateInfo.date, 'd MMMM yyyy', { locale: id }) : format(new Date(), 'd MMMM yyyy', { locale: id })}
          </p>
          <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium transition-colors duration-500 mb-2">
            {selectedDateInfo 
              ? selectedDateInfo.info 
                ? <div className="flex items-start gap-2 text-red-500 dark:text-red-400 font-bold mb-2">
                    <div className="w-2 h-2 mt-1 bg-red-500 dark:bg-red-400 rounded-full shadow-sm shrink-0"></div>
                    <span>{selectedDateInfo.info}</span>
                  </div>
                : selectedDateInfo.isWeekend
                  ? <span className="block mb-2">Hari libur akhir pekan. Tidak ada jadwal khusus.</span>
                  : <span className="block mb-2">Hari aktif belajar mengajar.</span>
              : 'Silakan pilih tanggal untuk melihat keterangan.'}
          </div>
          {/* Notes Section */}
          <div className="mt-2 border-t border-slate-200/50 dark:border-slate-700/50 pt-2 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Catatan Kegiatan</span>
              {canAddNote && selectedDateInfo && !isEditingNote && (
                 <button onClick={() => setIsEditingNote(true)} className="p-1 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors">
                   <Plus className="w-3.5 h-3.5" />
                 </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto max-h-[150px] space-y-2 pr-1 custom-scrollbar">
              {selectedDateInfo && (notes[format(selectedDateInfo.date, 'yyyy-MM-dd')] || []).length > 0 ? (
                (notes[format(selectedDateInfo.date, 'yyyy-MM-dd')] || []).map(note => (
                  <div key={note.id} className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm relative group">
                    <p className="text-xs text-slate-700 dark:text-slate-200 mb-1">{note.text}</p>
                    <p className="text-[9px] text-slate-400 font-medium">Oleh: {note.authorName}</p>
                    {(user?.role === 'admin' || user?.name === note.authorName) && (
                      <button onClick={() => deleteNote(note.id)} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-slate-400 text-xs italic">
                  Tidak ada catatan.
                </div>
              )}
            </div>
            {isEditingNote && (
               <div className="mt-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                 <textarea
                   className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-500/30 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                   placeholder="Tulis catatan..."
                   rows={3}
                   value={noteInput}
                   onChange={e => setNoteInput(e.target.value)}
                   autoFocus
                 />
                 <div className="flex justify-end gap-1 mt-1">
                   <button onClick={() => setIsEditingNote(false)} className="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                     <X className="w-4 h-4" />
                   </button>
                   <button onClick={saveNote} className="p-1.5 text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg shadow-sm transition-colors">
                     <Check className="w-4 h-4" />
                   </button>
                 </div>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
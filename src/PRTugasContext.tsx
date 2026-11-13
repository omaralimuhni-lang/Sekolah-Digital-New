import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Tugas {
  id: string;
  tipe: 'Offline (Menunggu Nilai)' | 'Offline (Selesai Dinilai)' | 'CBT Online' | string;
  mataPelajaran: string;
  guru: string;
  kelas: string;
  namaTugas: string;
  waktuPengerjaan: string;
  uraianTugas: string;
  tataCara: string;
  soalFile?: string;
  fileName?: string;
  soalOnline?: any[];
  createdAt: string;
}

export interface PRTugasContextType {
  tugasList: Tugas[];
  setTugasList: React.Dispatch<React.SetStateAction<Tugas[]>>;
  jawabanStore: Record<string, any>;
  setJawabanStore: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  penilaianTugas: any[];
  setPenilaianTugas: React.Dispatch<React.SetStateAction<any[]>>;
  triggerUpdate: () => void;
}

const PRTugasContext = createContext<PRTugasContextType | undefined>(undefined);

export function PRTugasProvider({ children }: { children: ReactNode }) {
  const [tugasList, setTugasList] = useState<Tugas[]>([]);
  const [jawabanStore, setJawabanStore] = useState<Record<string, any>>({});
  const [penilaianTugas, setPenilaianTugas] = useState<any[]>([]);

  const loadData = () => {
    const activeTasks = JSON.parse(localStorage.getItem('sd_tugas_list') || '[]');
    setTugasList(activeTasks);

    const activePenilaian = JSON.parse(localStorage.getItem('sd_penilaian_tugas') || '[]');
    setPenilaianTugas(activePenilaian);
  };

  useEffect(() => {
    loadData();

    const handleStorageUpdate = (e?: StorageEvent | Event) => {
       if (e instanceof StorageEvent) {
          if (e.key === 'sd_tugas_list' || e.key?.startsWith('sd_tugas_jawaban_') || e.key === 'sd_penilaian_tugas') {
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
  }, []);

  const triggerUpdate = () => {
    window.dispatchEvent(new Event('localStorageUpdate'));
  };

  return (
    <PRTugasContext.Provider value={{ tugasList, setTugasList, jawabanStore, setJawabanStore, penilaianTugas, setPenilaianTugas, triggerUpdate }}>
      {children}
    </PRTugasContext.Provider>
  );
}

export function usePRTugas() {
  const context = useContext(PRTugasContext);
  if (!context) {
    throw new Error('usePRTugas must be used within a PRTugasProvider');
  }
  return context;
}

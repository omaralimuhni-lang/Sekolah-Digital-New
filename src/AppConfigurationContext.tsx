import React, { createContext, useContext, useState, useEffect } from 'react';

export interface KopConfig {
  sekolahName: string;
  address: string;
  contact: string;
  website: string;
  logoDataUrl: string;
}

export interface AppConfigurationState {
  kopPdf: KopConfig;
  kopStruk: KopConfig;
  kopExcel: KopConfig;
  updateKop: (type: 'pdf' | 'struk' | 'excel', config: KopConfig) => void;
}

const defaultConfig: KopConfig = {
  sekolahName: 'SDN 01 MERDEKA',
  address: 'Jl. Pendidikan No. 123, Kota Pendidikan, Provinsi Pendidikan',
  contact: 'Telp: 021-1234567 | Email: info@sdn01merdeka.sch.id',
  website: 'www.sdn01merdeka.sch.id',
  logoDataUrl: ''
};

const AppConfigurationContext = createContext<AppConfigurationState | undefined>(undefined);

export const AppConfigurationProvider = ({ children }: { children: React.ReactNode }) => {
  const [kopPdf, setKopPdf] = useState<KopConfig>(defaultConfig);
  const [kopStruk, setKopStruk] = useState<KopConfig>(defaultConfig);
  const [kopExcel, setKopExcel] = useState<KopConfig>(defaultConfig);

  useEffect(() => {
    const loadData = () => {
      try {
        const savedPdf = localStorage.getItem('sd_kop_pdf');
        if (savedPdf) setKopPdf(JSON.parse(savedPdf));

        const savedStruk = localStorage.getItem('sd_kop_struk');
        if (savedStruk) setKopStruk(JSON.parse(savedStruk));

        const savedExcel = localStorage.getItem('sd_kop_excel');
        if (savedExcel) setKopExcel(JSON.parse(savedExcel));
      } catch (e) {
        console.error("Failed to load kop configs", e);
      }
    };

    loadData();
    window.addEventListener('localStorageUpdate', loadData);
    window.addEventListener('data-updated', loadData);
    return () => {
      window.removeEventListener('localStorageUpdate', loadData);
      window.removeEventListener('data-updated', loadData);
    };
  }, []);

  const updateKop = (type: 'pdf' | 'struk' | 'excel', config: KopConfig) => {
    if (type === 'pdf') setKopPdf(config);
    if (type === 'struk') setKopStruk(config);
    if (type === 'excel') setKopExcel(config);

    const key = `sd_kop_${type}`;
    localStorage.setItem(key, JSON.stringify(config));
  };

  return (
    <AppConfigurationContext.Provider value={{ kopPdf, kopStruk, kopExcel, updateKop }}>
      {children}
    </AppConfigurationContext.Provider>
  );
};

export const useAppConfiguration = () => {
  const context = useContext(AppConfigurationContext);
  if (!context) {
    throw new Error('useAppConfiguration must be used within an AppConfigurationProvider');
  }
  return context;
};

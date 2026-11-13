import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { useAppConfiguration } from '../AppConfigurationContext';

export const getKopConfig = (type: 'pdf' | 'struk' | 'excel') => {
  const saved = localStorage.getItem(`sd_kop_${type}`);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return null;
    }
  }
  return {
    sekolahName: 'SDN 01 MERDEKA',
    address: 'Jl. Pendidikan No. 123, Kota Pendidikan',
    contact: 'Telp: 021-1234567 | Email: info@sekolah.sch.id',
    website: 'www.sdn01merdeka.sch.id',
    logoDataUrl: ''
  };
};

export const exportToExcel = (data: any[], filename: string, title?: string) => {
  const config = getKopConfig('excel');
  const kopRows = [
    [config.sekolahName],
    [config.address],
    [config.contact + (config.website ? ` | ${config.website}` : '')],
    [''],
  ];
  if (title) {
    kopRows.push([title], ['']);
  }
  
  if (data.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([...kopRows, ["Tidak ada data"]]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${filename}_${new Date().getTime()}.xlsx`);
    return;
  }
  
  const headers = Object.keys(data[0]);
  const dataRows = data.map(item => headers.map(h => item[h]));
  
  const ws = XLSX.utils.aoa_to_sheet([...kopRows, headers, ...dataRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `${filename}_${new Date().getTime()}.xlsx`);
};

export const StrukHeader = ({ title = 'STRUK' }: { title?: string }) => {
  let config;
  try {
    const context = useAppConfiguration();
    config = context.kopStruk;
  } catch (e) {
    // Fallback if rendered outside provider
    config = getKopConfig('struk');
  }
  return (
    <div className="text-center border-b border-dashed border-slate-300 dark:border-slate-600 pb-3 mb-3">
      {config.logoDataUrl && <img src={config.logoDataUrl} alt="Logo" className="max-w-[50px] mx-auto mb-1" />}
      <h3 className="m-0 font-bold text-sm text-slate-800 dark:text-slate-100 uppercase">{config.sekolahName}</h3>
      <p className="m-0 text-[10px] text-slate-600 dark:text-slate-400 mt-1 leading-tight">{config.address}</p>
      <p className="m-0 text-[10px] text-slate-600 dark:text-slate-400 leading-tight">{config.contact}</p>
      <div className="font-bold text-base mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white uppercase">{title}</div>
    </div>
  );
};

export const applyPdfKop = (doc: jsPDF): number => {
  const config = getKopConfig('pdf');
  let currentY = 15;
  
  if (config.logoDataUrl) {
    try {
      doc.addImage(config.logoDataUrl, 'JPEG', 14, currentY, 20, 20);
    } catch (e) {
      console.warn("Could not add PDF kop logo", e);
    }
  }
  const textX = config.logoDataUrl ? 38 : 14;
  
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(config.sekolahName, textX, currentY + 6);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(config.address, textX, currentY + 12);
  doc.text(config.contact + (config.website ? ` | ${config.website}` : ''), textX, currentY + 17);
  
  // Draw separator line
  doc.setLineWidth(0.5);
  doc.line(14, currentY + 22, 196, currentY + 22);
  
  return currentY + 28; // Returns the Y position after the kop
};


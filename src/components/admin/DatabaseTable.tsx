import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, Upload, Download, Eye, Edit, Trash2, ChevronLeft } from 'lucide-react';
import { useAppContext } from '../../AppContext';
import { useIsMobile } from '../../App';
import { MobileBottomSheet } from '../ui/MobileBottomSheet';
import { TableVirtuoso } from 'react-virtuoso';
import { recordLog } from '../../utils/logHelper';
import { useFormValidation } from '../../hooks/useFormValidation';
import { DataSyncManager } from '../../utils/dataSyncManager';
export interface FieldDef {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  pattern?: RegExp;
  minLength?: number;
  message?: string;
}
export interface DatabaseTableProps {
  title: string;
  storageKey: string;
  fields: FieldDef[];
  description?: string;
  gradient?: string;
  icon?: React.ReactNode;
}
export function DatabaseTable({ title, storageKey, fields, description, gradient, icon }: DatabaseTableProps) {
  const { navigate, user } = useAppContext();
  const isMobile = useIsMobile();
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const rules = useMemo(() => {
    const rulesObj: any = {};
    fields.forEach(f => {
      rulesObj[f.name] = {
        required: f.required,
        pattern: f.pattern,
        minLength: f.minLength,
        message: f.message || `Field ${f.label} tidak valid.`
      };
    });
    return rulesObj;
  }, [fields]);
  const { values: formData, errors, handleChange, validateAll, setValues: setFormData, resetForm } = useFormValidation<any>({}, rules);
  const loadData = React.useCallback(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {}
    }
  }, [storageKey]);
  useEffect(() => {
    loadData();
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey) {
        loadData();
      }
    };
    const handleCustomStorageChange = () => loadData();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageUpdate', handleCustomStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageUpdate', handleCustomStorageChange);
    };
  }, [storageKey, loadData]);
  const saveData = React.useCallback((newData: any[]) => {
    setData(newData);
    localStorage.setItem(storageKey, JSON.stringify(newData));
    DataSyncManager.triggerSync(storageKey);
  }, [storageKey]);
  const handleOpenModal = React.useCallback((item?: any) => {
    if (item) {
      setEditingItem(item);
      setFormData({ ...item });
    } else {
      setEditingItem(null);
      resetForm();
    }
    setIsModalOpen(true);
  }, [setFormData, resetForm]);
  const handleCloseModal = React.useCallback(() => {
    setIsModalOpen(false);
    setEditingItem(null);
    resetForm();
  }, [resetForm]);
  const handleSubmit = React.useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;
    if (editingItem) {
      const newData = data.map((d) => d.id === editingItem.id ? { ...formData, id: d.id } : d);
      saveData(newData);
      if (user) recordLog(user, 'UPDATE', title, `Memperbarui data ${title} id: ${editingItem.id}`);
    } else {
      const newId = Date.now().toString();
      const newData = [...data, { ...formData, id: newId }];
      saveData(newData);
      if (user) recordLog(user, 'CREATE', title, `Menambahkan data ${title} baru id: ${newId}`);
    }
    handleCloseModal();
  }, [data, editingItem, formData, saveData, user, title, handleCloseModal, validateAll]);
  const handleDelete = React.useCallback((id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      saveData(data.filter((d) => d.id !== id));
      if (user) recordLog(user, 'DELETE', title, `Menghapus data ${title} id: ${id}`);
    }
  }, [data, saveData, user, title]);
  const handleDownloadCSV = React.useCallback(() => {
    const header = fields.map(f => `"${f.label}"`).join(';');
    const rows = data.map(d => fields.map(f => `"${d[f.name] || ''}"`).join(';'));
    const csvContent = '\uFEFF' + [header, ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title}-template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (user) recordLog(user, 'EXPORT', title, `Mendownload template CSV ${title}`);
  }, [data, fields, title, user]);
  const handleUploadCSV = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length < 2) {
        alert('File CSV kosong atau tidak valid.');
        return;
      }
      const delimiter = lines[0].includes(';') ? ';' : ',';
      const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
      const newDataList: any[] = [];
      const timestamp = Date.now();
      for (let i = 1; i < lines.length; i++) {
        // Regex to split by delimiter except inside quotes
        const regex = new RegExp(`${delimiter}(?=(?:(?:[^"]*"){2})*[^"]*$)`);
        const values = lines[i].split(regex).map(v => v.trim().replace(/^"|"$/g, ''));
        
        const item: any = { id: `${timestamp}-${i}` };
        let isValid = true;
        fields.forEach((field) => {
          const hIndex = headers.findIndex(h => h.toLowerCase() === field.label.toLowerCase() || h === field.name);
          if (hIndex !== -1 && values[hIndex] !== undefined) {
            item[field.name] = values[hIndex];
          }
          
          if (field.required && !item[field.name]) {
            isValid = false;
          }
        });
        if (isValid) {
          newDataList.push(item);
        }
      }
      if (newDataList.length > 0) {
        saveData([...data, ...newDataList]);
        alert(`Berhasil mengunggah ${newDataList.length} data baru.`);
        if (user) recordLog(user, 'CREATE', title, `Mengunggah batch ${newDataList.length} data via CSV`);
      } else {
        alert('Gagal menambahkan data baru. Pastikan field yang wajib diisi seperti Username tidak kosong di dalam CSV.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  }, [data, fields, saveData, title, user]);
  const filteredData = data.filter((item) => {
    const searchLower = search.toLowerCase();
    // Cari di semua field string
    return Object.values(item).some((val) => typeof val === 'string' && val.toLowerCase().includes(searchLower));
  });
  return (
    <div className="flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors duration-300 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[100vw] overflow-x-hidden pt-safe pb-32">
      {gradient && icon ? (
        <div className={`shrink-0 bg-gradient-to-br ${gradient} rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl relative overflow-hidden h-40 sm:h-48 flex flex-col justify-end mb-6`}>
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
           <div className="absolute bottom-0 right-10 opacity-20 pointer-events-none transform translate-y-1/4 right-0 rotate-[-15deg]">
              {icon}
           </div>
           
           <div className="relative z-10">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">{title}</h1>
              {description && <p className="text-white/90 font-medium text-sm sm:text-base max-w-sm sm:max-w-md">{description}</p>}
           </div>
        </div>
      ) : (
        <div className="hidden lg:flex px-4 py-4 sm:px-6 items-center justify-between text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 rounded-t-3xl shadow-sm mb-6">
          <div className="flex items-center space-x-3">
            <button onClick={() => navigate('Beranda')} className="p-2 -ml-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95 outline-none">
              <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <h2 className="text-lg font-bold tracking-tight truncate">
              {title}
            </h2>
          </div>
        </div>
      )}
      <div className="p-4 sm:p-6 space-y-4 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/50 flex-1 flex flex-col min-h-0">
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari data..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-200" 
            />
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button onClick={() => handleOpenModal()} className="flex-1 sm:flex-none flex justify-center items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl transition-colors text-sm font-medium active:scale-95">
              <Plus className="w-4 h-4" /><span>Tambah</span>
            </button>
            <div className="flex gap-2 flex-1 sm:flex-none">
              <button onClick={handleDownloadCSV} className="flex-1 sm:flex-none flex justify-center items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-xl transition-colors text-sm font-medium active:scale-95">
                <Download className="w-4 h-4" /><span className="whitespace-nowrap">Template</span>
              </button>
              <button className="flex-1 sm:flex-none flex justify-center items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-xl transition-colors text-sm font-medium active:scale-95 relative overflow-hidden">
                <Upload className="w-4 h-4" /><span className="whitespace-nowrap">Upload</span>
                <input type="file" onChange={handleUploadCSV} className="absolute inset-0 opacity-0 cursor-pointer" accept=".csv" />
              </button>
            </div>
          </div>
        </div>
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden h-[calc(100vh-280px)] min-h-[400px]">
          <TableVirtuoso
            data={filteredData}
            className="w-full h-full"
            components={{
              Table: ({ style, ...props }: any) => (
                <table {...props} className="w-full text-left border-collapse min-w-[600px]" style={{ ...style, width: "100%", margin: 0 }} />
              ),
              TableHead: React.forwardRef((props: any, ref) => (
                <thead {...props} ref={ref} className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider sticky top-0 z-10 shadow-sm" />
              )),
              TableRow: (props: any) => (
                <tr {...props} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800" />
              ),
              TableBody: React.forwardRef((props: any, ref) => (
                <tbody {...props} ref={ref} className="bg-white dark:bg-slate-900" />
              )),
            }}
            fixedHeaderContent={() => (
              <tr>
                <th className="p-4 font-semibold w-16 text-center bg-slate-50 dark:bg-slate-800 m-0">No</th>
                <th className="p-4 font-semibold bg-slate-50 dark:bg-slate-800 m-0">Nama Lengkap</th>
                <th className="p-4 font-semibold bg-slate-50 dark:bg-slate-800 m-0">Username</th>
                <th className="p-4 font-semibold text-right bg-slate-50 dark:bg-slate-800 m-0">Aksi</th>
              </tr>
            )}
            itemContent={(index, item) => (
              <>
                <td className="p-4 text-center text-slate-500 text-sm align-middle h-16">{index + 1}</td>
                <td className="p-4 align-middle h-16">
                  <div className="font-medium text-slate-800 dark:text-slate-200 text-sm">{item.fullName || '-'}</div>
                </td>
                <td className="p-4 text-slate-500 dark:text-slate-400 text-sm align-middle h-16">{item.username || '-'}</td>
                <td className="p-4 text-right align-middle h-16">
                  <div className="flex items-center justify-end space-x-1">
                    <button onClick={() => setViewingItem(item)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors" title="Lihat"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => handleOpenModal(item)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </>
            )}
          />
          {filteredData.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">Belum ada data</div>
          )}
        </div>
      </div>
      {/* Form Modal */}
      {isModalOpen && (
        isMobile ? (
          <MobileBottomSheet 
            isOpen={isModalOpen} 
            onClose={handleCloseModal} 
            title={editingItem ? 'Edit Data' : 'Tambah Data'}
          >
            <div className="p-6">
              <form id="databaseForm" onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col gap-6">
                  {fields.map((field) => (
                    <div key={field.name} className="flex flex-col space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{field.label}</label>
                      {field.type === 'file' ? (
                        <div className="flex flex-col gap-2">
                           {formData[field.name] && <img src={formData[field.name]} alt="Preview" className="w-16 h-16 object-cover rounded-xl" />}
                           <input
                             type="file"
                             accept="image/*"
                             onChange={(e) => {
                               const file = e.target.files?.[0];
                               if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                     setFormData({ ...formData, [field.name]: reader.result });
                                  };
                                  reader.readAsDataURL(file);
                               }
                             }}
                             className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                           />
                        </div>
                      ) : field.type === 'select' ? (
                        <div className="flex flex-col w-full">
                          <select
                            required={field.required}
                            value={formData[field.name] || ''}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-colors"
                          >
                            <option value="">Pilih {field.label}</option>
                            {field.options?.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                          {errors[field.name] && <span className="text-xs text-rose-500 mt-1">{errors[field.name]}</span>}
                        </div>
                      ) : (
                        <div className="flex flex-col w-full">
                          <input
                            type={field.type}
                            required={field.required}
                            value={formData[field.name] || ''}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-colors"
                          />
                          {errors[field.name] && <span className="text-xs text-rose-500 mt-1">{errors[field.name]}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button type="submit" className="w-full px-5 py-4 mt-4 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center justify-center">
                  Simpan Data
                </button>
              </form>
            </div>
          </MobileBottomSheet>
        ) : (
          createPortal(
            <div className="fixed inset-0 z-[99999] flex flex-col bg-slate-50 dark:bg-slate-900 border-none rounded-none shadow-none m-0 p-0 overflow-hidden">
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center space-x-3">
                  <button type="button" onClick={handleCloseModal} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <ChevronLeft className="w-6 h-6 text-slate-500" />
                  </button>
                  <h3 className="font-bold text-xl text-slate-800 dark:text-white">
                    {editingItem ? 'Edit Data' : 'Tambah Data'}
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">Batal</button>
                  <button type="button" onClick={handleSubmit as any} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">Simpan</button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto w-full p-4 sm:p-8">
                <div className="bg-white dark:bg-slate-900 sm:border-t border-slate-200 dark:border-slate-800 sm:p-8 sm:shadow-sm">
                  <form id="databaseForm" onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {fields.map((field) => (
                        <div key={field.name} className="flex flex-col space-y-2">
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{field.label}</label>
                          {field.type === 'file' ? (
                            <div className="flex flex-col gap-2">
                               {formData[field.name] && <img src={formData[field.name]} alt="Preview" className="w-16 h-16 object-cover rounded-xl" />}
                               <input
                                 type="file"
                                 accept="image/*"
                                 onChange={(e) => {
                                   const file = e.target.files?.[0];
                                   if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                         setFormData({ ...formData, [field.name]: reader.result });
                                      };
                                      reader.readAsDataURL(file);
                                   }
                                 }}
                                 className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                               />
                            </div>
                          ) : field.type === 'select' ? (
                            <div className="flex flex-col w-full">
                              <select
                                required={field.required}
                                value={formData[field.name] || ''}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-colors"
                              >
                                <option value="">Pilih {field.label}</option>
                                {field.options?.map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                              {errors[field.name] && <span className="text-xs text-rose-500 mt-1">{errors[field.name]}</span>}
                            </div>
                          ) : (
                            <div className="flex flex-col w-full">
                              <input
                                type={field.type}
                                required={field.required}
                                value={formData[field.name] || ''}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-colors"
                              />
                              {errors[field.name] && <span className="text-xs text-rose-500 mt-1">{errors[field.name]}</span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </form>
                </div>
              </div>
            </div>,
            document.body
          )
        )
      )}
      {/* View Modal */}
      {viewingItem && (
        isMobile ? (
          <MobileBottomSheet 
            isOpen={!!viewingItem} 
            onClose={() => setViewingItem(null)} 
            title="Detail Data"
          >
            <div className="p-6">
              <div className="flex flex-col gap-6">
                {fields.map((field) => (
                  <div key={field.name} className="flex flex-col border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{field.label}</span>
                    <span className="text-slate-800 dark:text-slate-200 text-base font-medium break-words mt-2">{viewingItem[field.name] || '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          </MobileBottomSheet>
        ) : (
          createPortal(
            <div className="fixed inset-0 z-[99999] flex flex-col bg-slate-50 dark:bg-slate-900 border-none rounded-none shadow-none m-0 p-0 overflow-hidden">
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center space-x-3">
                  <button onClick={() => setViewingItem(null)} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <ChevronLeft className="w-6 h-6 text-slate-500" />
                  </button>
                  <h3 className="font-bold text-xl text-slate-800 dark:text-white">Detail Data</h3>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto w-full p-4 sm:p-8">
                <div className="bg-white dark:bg-slate-900 sm:border-t border-slate-200 dark:border-slate-800 sm:p-8 sm:shadow-sm space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                    {fields.map((field) => (
                      <div key={field.name} className="flex flex-col border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{field.label}</span>
                        <span className="text-slate-800 dark:text-slate-200 text-base font-medium break-words mt-2">{viewingItem[field.name] || '-'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        )
      )}
    </div>
  );
}
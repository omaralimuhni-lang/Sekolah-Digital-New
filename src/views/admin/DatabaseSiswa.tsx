import React from 'react';
import { useState, useEffect } from 'react';
import { DatabaseTable, FieldDef } from '../../components/admin/DatabaseTable';
import { UsersRound } from 'lucide-react';
import { withRoleGuard } from '../../components/hoc/withRoleGuard';

const DatabaseSiswaBase = () => {
  const [tahunAjaranList, setTahunAjaranList] = useState<string[]>([]);


  useEffect(() => {
    const loadData = () => {
      const savedTahunAjaran = JSON.parse(localStorage.getItem('sd_tahun_ajaran') || '[]');
      setTahunAjaranList(savedTahunAjaran);
    };
    loadData();
    window.addEventListener('localStorageUpdate', loadData);
    return () => window.removeEventListener('localStorageUpdate', loadData);
  }, []);

  const fields: FieldDef[] = React.useMemo(() => [
    { name: 'photoUrl', label: 'Upload Foto Profil', type: 'file' },
    { name: 'fullName', label: 'Nama Lengkap', type: 'text', required: true },
    { name: 'nisn', label: 'Nomor Induk (NIS/NISN)', type: 'text', required: true },
    { name: 'class', label: 'Kelas', type: 'text', required: true },
    { name: 'tahunAjaran', label: 'Tahun Ajaran', type: tahunAjaranList.length > 0 ? 'select' : 'text', required: true, options: tahunAjaranList },
    { name: 'homeroomTeacher', label: 'Nama Wali Kelas', type: 'text' },
    { name: 'phoneWA', label: 'Nomor Telpon (WA)', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'gender', label: 'Jenis Kelamin', type: 'select', options: ['Laki-laki', 'Perempuan'] },
    { name: 'religion', label: 'Agama', type: 'select', options: ['Islam', 'Kristen Protestan', 'Kristen Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya'] },
    { name: 'parentName', label: 'Nama Orang Tua', type: 'text' },
    { name: 'address', label: 'Alamat Rumah', type: 'text' },
    { name: 'username', label: 'Username', type: 'text', required: true },
    { name: 'password', label: 'Password', type: 'text', required: true },
  ], [tahunAjaranList]);

  return (
    <DatabaseTable 
      title="Database Siswa" 
      storageKey="sd_db_siswa" 
      fields={fields} 
      description="Data akun siswa dan pengaturan akses."
      gradient="from-blue-600 to-indigo-700"
      icon={<UsersRound className="w-48 h-48 sm:w-64 sm:h-64" />}
    />
  );
};
export const DatabaseSiswa = withRoleGuard(DatabaseSiswaBase, ['admin']);

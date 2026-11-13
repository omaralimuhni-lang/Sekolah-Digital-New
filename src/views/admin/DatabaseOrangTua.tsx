import React from 'react';
import { DatabaseTable, FieldDef } from '../../components/admin/DatabaseTable';
import { Users } from 'lucide-react';
import { withRoleGuard } from '../../components/hoc/withRoleGuard';

const DatabaseOrangTuaBase = () => {
  const fields: FieldDef[] = React.useMemo(() => [
    { name: 'photoUrl', label: 'Upload Foto Profil', type: 'file' },
    { name: 'fullName', label: 'Nama Lengkap Orang Tua', type: 'text', required: true },
    { name: 'nik', label: 'Nomor NIK', type: 'text', required: true },
    { name: 'education', label: 'Pendidikan', type: 'text' },
    { name: 'occupation', label: 'Pekerjaan', type: 'text' },
    { name: 'phoneWA', label: 'Nomor Telpon (WA)', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'gender', label: 'Jenis Kelamin', type: 'select', options: ['Laki-laki', 'Perempuan'] },
    { name: 'religion', label: 'Agama', type: 'select', options: ['Islam', 'Kristen Protestan', 'Kristen Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya'] },
    { name: 'address', label: 'Alamat Rumah', type: 'text' },
    { name: 'childName', label: 'Nama Siswa (Anak)', type: 'text' },
    { name: 'childClass', label: 'Kelas Siswa (Anak)', type: 'text' },
    { name: 'childNisn', label: 'NIS/NISN Siswa (Anak)', type: 'text' },
    { name: 'username', label: 'Username', type: 'text', required: true },
    { name: 'password', label: 'Password', type: 'text', required: true },
  ], []);

  return (
    <DatabaseTable 
      title="Database Orang Tua" 
      storageKey="sd_db_ortu" 
      fields={fields} 
      description="Data akun orang tua dan wali murid."
      gradient="from-amber-500 to-orange-600"
      icon={<Users className="w-48 h-48 sm:w-64 sm:h-64" />}
    />
  );
};
export const DatabaseOrangTua = withRoleGuard(DatabaseOrangTuaBase, ['admin']);

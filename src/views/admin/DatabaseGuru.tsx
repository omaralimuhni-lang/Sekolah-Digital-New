import React from 'react';
import { DatabaseTable, FieldDef } from '../../components/admin/DatabaseTable';
import { GraduationCap } from 'lucide-react';
import { withRoleGuard } from '../../components/hoc/withRoleGuard';

const DatabaseGuruBase = () => {
  const fields: FieldDef[] = React.useMemo(() => [
    { name: 'photoUrl', label: 'Upload Foto Profil', type: 'file' },
    { name: 'fullName', label: 'Nama Lengkap', type: 'text', required: true },
    { name: 'nuptk', label: 'Nomor NUPTK', type: 'text' },
    { name: 'nik', label: 'Nomor NIK', type: 'text', required: true },
    { name: 'education', label: 'Pendidikan', type: 'text' },
    { name: 'subject', label: 'Guru Mata Pelajaran', type: 'text' },
    { name: 'homeroomTeacher', label: 'Wali Kelas', type: 'text' },
    { name: 'phoneWA', label: 'Nomor Telpon (WA)', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'gender', label: 'Jenis Kelamin', type: 'select', options: ['Laki-laki', 'Perempuan'] },
    { name: 'religion', label: 'Agama', type: 'select', options: ['Islam', 'Kristen Protestan', 'Kristen Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya'] },
    { name: 'address', label: 'Alamat Rumah', type: 'text' },
    { name: 'username', label: 'Username', type: 'text', required: true },
    { name: 'password', label: 'Password', type: 'text', required: true },
  ], []);

  return (
    <DatabaseTable 
      title="Database Guru" 
      storageKey="sd_db_guru" 
      fields={fields} 
      description="Data akun guru dan staf pengajar."
      gradient="from-emerald-600 to-teal-700"
      icon={<GraduationCap className="w-48 h-48 sm:w-64 sm:h-64" />}
    />
  );
};
export const DatabaseGuru = withRoleGuard(DatabaseGuruBase, ['admin']);

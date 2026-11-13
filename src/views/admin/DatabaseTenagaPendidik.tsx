import React from 'react';
import { DatabaseTable, FieldDef } from '../../components/admin/DatabaseTable';
import { Users2 } from 'lucide-react';
import { withRoleGuard } from '../../components/hoc/withRoleGuard';

const DatabaseTenagaPendidikBase = () => {
  const fields: FieldDef[] = React.useMemo(() => [
    { name: 'photoUrl', label: 'Upload Foto Profil', type: 'file' },
    { name: 'fullName', label: 'Nama Lengkap', type: 'text', required: true },
    { name: 'nik', label: 'Nomor NIK', type: 'text', required: true },
    { name: 'education', label: 'Pendidikan', type: 'text' },
    { name: 'occupation', label: 'Pekerjaan', type: 'text' },
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
      title="Database Tenaga Pendidik" 
      storageKey="sd_db_tenaga_pendidik" 
      fields={fields} 
      description="Data akun tenaga pendidik dan staf administratif."
      gradient="from-indigo-600 to-indigo-800"
      icon={<Users2 className="w-48 h-48 sm:w-64 sm:h-64" />}
    />
  );
};
export const DatabaseTenagaPendidik = withRoleGuard(DatabaseTenagaPendidikBase, ['admin']);

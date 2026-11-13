import React from 'react';
import { DatabaseTable, FieldDef } from '../../components/admin/DatabaseTable';
import { Handshake } from 'lucide-react';
import { withRoleGuard } from '../../components/hoc/withRoleGuard';

const DatabaseMitraBase = () => {
  const fields: FieldDef[] = React.useMemo(() => [
    { name: 'photoUrl', label: 'Upload Foto Profil', type: 'file' },
    { name: 'fullName', label: 'Nama Lengkap Mitra', type: 'text', required: true },
    { name: 'storeName', label: 'Nama Toko/Kantin', type: 'text' },
    { name: 'nik', label: 'Nomor NIK', type: 'text', required: true },
    { name: 'phoneWA', label: 'Nomor Telpon (WA)', type: 'text' },
    { name: 'gender', label: 'Jenis Kelamin', type: 'select', options: ['Laki-laki', 'Perempuan'] },
    { name: 'religion', label: 'Agama', type: 'select', options: ['Islam', 'Kristen Protestan', 'Kristen Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya'] },
    { name: 'address', label: 'Alamat Rumah', type: 'text' },
    { name: 'username', label: 'Username', type: 'text', required: true },
    { name: 'password', label: 'Password', type: 'text', required: true },
  ], []);

  return (
    <DatabaseTable 
      title="Database Mitra" 
      storageKey="sd_db_mitra" 
      fields={fields} 
      description="Data akun pengelola kantin dan mitra sekolah."
      gradient="from-pink-600 to-rose-600"
      icon={<Handshake className="w-48 h-48 sm:w-64 sm:h-64" />}
    />
  );
};
export const DatabaseMitra = withRoleGuard(DatabaseMitraBase, ['admin']);

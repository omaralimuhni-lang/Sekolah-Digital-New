export const syncDatabaseSiswatoOthers = () => {
    try {
        const studentData = JSON.parse(localStorage.getItem('sd_db_siswa') || '[]');
        if (!Array.isArray(studentData)) return;

        let hasModifications = false;

        // 1. Sync Raport
        try {
            const raportList = ['sd_raport', 'sd_penilaian_mapel', 'sd_penilaian_tugas', 'sd_penilaian_ujian'];
            raportList.forEach(key => {
                const items = JSON.parse(localStorage.getItem(key) || '[]');
                if (Array.isArray(items)) {
                    let isModified = false;
                    const updatedItems = items.map((r: any) => {
                        if (!r || !r.siswaId) return r;
                        const matchedSiswa = studentData.find(s => s.id === r.siswaId || s.id === r.siswaId.split('-')[0]); // handle composite IDs if any
                        if (matchedSiswa) {
                            if (r.siswaName !== matchedSiswa.fullName || r.kelas !== matchedSiswa.kelas) {
                                isModified = true;
                                return {
                                    ...r,
                                    siswaName: matchedSiswa.fullName,
                                    kelas: matchedSiswa.kelas
                                };
                            }
                        }
                        return r;
                    });
                    if (isModified) {
                        localStorage.setItem(key, JSON.stringify(updatedItems));
                        hasModifications = true;
                    }
                }
            });
        } catch (e) { console.error('Error syncing raport', e); }

        // 2. Sync Absensi (if they store student name/class)
        try {
            const absensiList = ['sd_absensi_siswa', 'sd_absensi']; // adjust based on actual keys used
            absensiList.forEach(key => {
                const items = JSON.parse(localStorage.getItem(key) || '[]');
                if (Array.isArray(items)) {
                    let isModified = false;
                    const updatedItems = items.map((a: any) => {
                        if (!a || !a.siswaId) return a;
                        const matchedSiswa = studentData.find(s => s.id === a.siswaId);
                        if (matchedSiswa) {
                            if (a.siswaName !== matchedSiswa.fullName || a.kelas !== matchedSiswa.kelas) {
                                isModified = true;
                                return {
                                    ...a,
                                    siswaName: matchedSiswa.fullName,
                                    kelas: matchedSiswa.kelas
                                };
                            }
                        }
                        return a;
                    });
                    if (isModified) {
                        localStorage.setItem(key, JSON.stringify(updatedItems));
                        hasModifications = true;
                    }
                }
            });
        } catch (e) { console.error('Error syncing absensi', e); }

        // 3. Sync Keuangan
        try {
            const keuanganList = ['sd_pemasukan', 'sd_pembayaran_siswa'];
            keuanganList.forEach(key => {
                const items = JSON.parse(localStorage.getItem(key) || '[]');
                if (Array.isArray(items)) {
                    let isModified = false;
                    const updatedItems = items.map((u: any) => {
                        if (!u || !u.siswaId) return u;
                        const matchedSiswa = studentData.find(s => s.id === u.siswaId);
                        if (matchedSiswa) {
                            if (u.siswaName !== matchedSiswa.fullName || u.kelas !== matchedSiswa.kelas) {
                                isModified = true;
                                return {
                                    ...u,
                                    siswaName: matchedSiswa.fullName,
                                    kelas: matchedSiswa.kelas
                                };
                            }
                        }
                        return u;
                    });
                    if (isModified) {
                        localStorage.setItem(key, JSON.stringify(updatedItems));
                        hasModifications = true;
                    }
                }
            });
        } catch (e) { console.error('Error syncing keuangan', e); }

        if (hasModifications) {
            window.dispatchEvent(new Event('localStorageUpdate'));
            window.dispatchEvent(new Event('data-updated'));
        }
    } catch (error) {
        console.error("Data sync error:", error);
    }
};

export const DataSyncManager = {
    triggerSync: (keyChanged?: string) => {
        if (keyChanged === 'sd_db_siswa') {
            syncDatabaseSiswatoOthers();
        } else {
            window.dispatchEvent(new Event('localStorageUpdate'));
            window.dispatchEvent(new Event('data-updated'));
        }
    },
    syncDatabaseSiswa: syncDatabaseSiswatoOthers,
    // Add other sync managers here
};

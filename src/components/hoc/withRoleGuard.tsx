import { useAppContext } from '../../AppContext';
import { Lock } from 'lucide-react';

export function withRoleGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles: string[]
) {
  return function WithRoleGuardWrapper(props: P) {
    const { user } = useAppContext();

    if (!user || !allowedRoles.includes(user.role)) {
      return (
        <div className="w-full flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-rose-100 dark:border-rose-900/50 min-h-[50vh]">
          <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-bold font-sans text-slate-800 dark:text-white mb-3">Akses Ditolak</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md">
            Anda tidak memiliki izin untuk mengakses halaman ini. Halaman ini butuh role: <span className="font-semibold">{allowedRoles.join(', ')}</span>.
          </p>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}

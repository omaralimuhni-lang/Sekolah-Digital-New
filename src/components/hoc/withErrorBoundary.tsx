import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-rose-100 dark:border-rose-900/50 min-h-[50vh]">
          <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-bold font-sans text-slate-800 dark:text-white mb-3">Terjadi Kesalahan</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md">
            Maaf, kami mengalami masalah saat memuat komponen ini. Silakan coba muat ulang halaman.
          </p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-6 px-6 py-2 bg-slate-900 dark:bg-indigo-500 text-white rounded-xl hover:bg-slate-800 dark:hover:bg-indigo-600 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

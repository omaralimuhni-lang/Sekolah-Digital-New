export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT';
  module: string;
  details: string;
}

export const recordLog = (
  user: { name: string, role: string },
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT',
  module: string,
  details: string
) => {
  if (!user || user.role === 'siswa' || user.role === 'ortu') return; // Maybe only log staff? Or all? We log what's requested: sub-admin or guru.

  const log: ActivityLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    user: user.name,
    role: user.role,
    action,
    module,
    details 
  };

  const logs = JSON.parse(localStorage.getItem('sd_activity_logs') || '[]');
  logs.unshift(log); // Add to beginning
  
  // Keep only latest 1000 logs to save space
  if (logs.length > 1000) {
    logs.pop();
  }
  
  localStorage.setItem('sd_activity_logs', JSON.stringify(logs));
};

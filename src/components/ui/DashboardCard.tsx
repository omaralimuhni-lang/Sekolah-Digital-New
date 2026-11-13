import React from 'react';
import { memo } from 'react';
import { triggerHaptic } from '../../lib/haptic';

export const DashboardCard = memo(function DashboardCard({ 
  title, description, icon, iconBg, className = '', badge, tall = false, onClick
}: { 
  title: string, description: string, icon: React.ReactNode, iconBg: string, className?: string, badge?: string, tall?: boolean, onClick?: () => void
}) {
  const isHexColor = iconBg.includes('[#');
  let iconColorStyle = {};
  
  if (isHexColor) {
    const match = iconBg.match(/\[(.*?)\]/);
    if (match && match[1]) {
      iconColorStyle = { color: match[1] };
    }
  } else {
    // Map Tailwind color classes to hex for the stroke color to avoid PurgeCSS stripping dynamic text- classes
    const getTailwindHex = (bgStr: string) => {
      if (bgStr.includes('emerald')) return '#10B981';
      if (bgStr.includes('blue')) return '#3B82F6';
      if (bgStr.includes('violet')) return '#8B5CF6';
      if (bgStr.includes('rose')) return '#F43F5E';
      if (bgStr.includes('amber')) return '#F59E0B';
      if (bgStr.includes('pink')) return '#EC4899';
      if (bgStr.includes('orange')) return '#F97316';
      if (bgStr.includes('indigo')) return '#6366F1';
      if (bgStr.includes('teal')) return '#14B8A6';
      if (bgStr.includes('sky')) return '#0EA5E9';
      if (bgStr.includes('cyan')) return '#06B6D4';
      if (bgStr.includes('slate')) return '#64748B';
      return '#6366F1';
    };
    iconColorStyle = { color: getTailwindHex(iconBg) };
  }

  return (
    <button onClick={() => { triggerHaptic('light'); if (onClick) onClick(); }} className={`bg-white/70 dark:bg-slate-800/70 backdrop-blur-3xl transform-gpu border border-white/20 dark:border-white/20 rounded-[1.5rem] p-4 sm:p-5 text-left shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)] hover:bg-white/80 dark:hover:bg-slate-800/80 hover:-translate-y-1 transition-all duration-500 group outline-none active:scale-95 flex flex-col relative overflow-hidden ${className}`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 dark:bg-slate-700/20 rounded-full blur-2xl z-0 translate-x-1/2 -translate-y-1/2"></div>
      
      {/* Siluet Icon */}
      <div className={`absolute -bottom-6 -right-6 sm:-bottom-8 sm:-right-8 opacity-[0.2] dark:opacity-[0.35] pointer-events-none group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500 z-0 drop-shadow-xl`} style={iconColorStyle}>
        {React.cloneElement(icon as React.ReactElement<any>, { className: "w-32 h-32 sm:w-40 sm:h-40", strokeWidth: 3 })}
      </div>
      
      <div className="flex justify-between items-start w-full mb-4 z-10">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-[1rem] flex items-center justify-center shadow-md text-white ${iconBg}`}>
          {icon}
        </div>
        {badge && (
          <span className={`text-[10px] sm:text-xs font-bold rounded-full shadow-sm text-white ${badge === 'Baru' ? 'bg-rose-500 px-2 py-1 leading-tight' : 'bg-rose-500 min-w-[20px] h-5 sm:h-6 sm:min-w-[24px] px-1.5 flex items-center justify-center leading-none'}`}>
            {badge}
          </span>
        )}
      </div>
      <div className={`z-10 ${tall ? 'mt-auto pt-4' : 'mt-1'}`}>
        <h3 className="font-bold text-[13px] sm:text-[15px] text-slate-800 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors drop-shadow-sm">{title}</h3>
        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[90%]">{description}</p>
      </div>
    </button>
  );
});

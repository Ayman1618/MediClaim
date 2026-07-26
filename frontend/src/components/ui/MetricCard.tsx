import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'highlight';
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
}: MetricCardProps) {
  return (
    <div
      className={`p-5 rounded-xl border transition-all duration-150 ${
        variant === 'highlight'
          ? 'bg-slate-900 text-white border-slate-800 shadow-md'
          : 'bg-white text-slate-900 border-slate-200/80 shadow-xs hover:border-slate-300'
      }`}
    >
      <div className="flex items-center justify-between">
        <p
          className={`text-xs font-semibold uppercase tracking-wider ${
            variant === 'highlight' ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          {title}
        </p>
        {icon && (
          <div
            className={`p-2 rounded-lg ${
              variant === 'highlight'
                ? 'bg-slate-800 text-slate-300'
                : 'bg-slate-50 text-slate-600'
            }`}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
        {subtitle && (
          <p
            className={`text-xs mt-1 ${
              variant === 'highlight' ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { ClaimStatus } from '@/types';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: ClaimStatus | string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const normalized = status.toUpperCase();

  const configs: Record<
    string,
    { label: string; icon: React.ReactNode; styles: string }
  > = {
    PENDING: {
      label: 'Pending Review',
      icon: <Clock className="w-3.5 h-3.5" />,
      styles: 'bg-amber-50 text-amber-800 border-amber-200/80',
    },
    APPROVED: {
      label: 'Approved',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      styles: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    },
    REJECTED: {
      label: 'Rejected',
      icon: <XCircle className="w-3.5 h-3.5" />,
      styles: 'bg-rose-50 text-rose-800 border-rose-200/80',
    },
  };

  const config = configs[normalized] || {
    label: status,
    icon: null,
    styles: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-2xs ${config.styles} ${sizeStyles}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
}

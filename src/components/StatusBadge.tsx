import React from 'react';
import { Lock, AlertTriangle, AlertOctagon, Clock, CheckCircle2, Calendar, FileText } from 'lucide-react';

interface StatusBadgeProps {
  type: 'reminder' | 'placement' | 'lock' | 'adulthood' | 'person_status';
  value: string;
  count?: number;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value, count, showIcon = true }) => {
  if (type === 'lock' && value === 'locked') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-950/80 text-amber-200 border border-amber-800/80 shadow-sm">
        <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>ქეისი დაბლოკილია</span>
      </span>
    );
  }

  if (type === 'reminder') {
    switch (value) {
      case 'ვადაგადაცილებული':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-950 text-rose-200 border border-rose-800 animate-pulse shadow-sm">
            {showIcon && <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
            <span>ვადაგადაცილებული</span>
            {count !== undefined && <span className="text-[10px] bg-rose-900 px-1.5 py-0.2 rounded-full">{count}დ</span>}
          </span>
        );
      case 'კრიტიკული':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-900/40 text-red-300 border border-red-700/60 shadow-sm">
            {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
            <span>კრიტიკული (≤3 დღე)</span>
          </span>
        );
      case 'გასაგრძელებელი':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-sm">
            {showIcon && <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
            <span>გასაგრძელებელი</span>
          </span>
        );
      case 'ნორმალური':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50">
            {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
            <span>ნორმალური</span>
          </span>
        );
    }
  }

  if (type === 'adulthood') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700/50">
        {showIcon && <Calendar className="w-3.5 h-3.5 text-purple-500 shrink-0" />}
        <span>{value}</span>
      </span>
    );
  }

  if (type === 'person_status') {
    let colorClasses = 'bg-slate-100 text-slate-800 border-slate-300';
    if (value === 'ჯანმრთელი') colorClasses = 'bg-teal-50 text-teal-800 border-teal-200';
    if (value === 'შშმ') colorClasses = 'bg-blue-50 text-blue-800 border-blue-200';
    if (value === 'სსმ') colorClasses = 'bg-indigo-50 text-indigo-800 border-indigo-200';

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colorClasses}`}>
        {value}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
      {value}
    </span>
  );
};

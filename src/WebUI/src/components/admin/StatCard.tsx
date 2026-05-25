import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  gradient: string;
  trend?: number;  // percent change, e.g. +12.5 or -3.2
  subtitle?: string;
}

export default function StatCard({ label, value, icon: Icon, gradient, trend, subtitle }: StatCardProps) {
  const trendPositive = trend !== undefined && trend >= 0;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Gradient accent bar */}
      <div className={`h-1 bg-gradient-to-r ${gradient}`} />

      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
            {subtitle && (
              <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
            )}
          </div>
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg transition-transform duration-300 group-hover:scale-110`}>
            <Icon size={22} className="text-white" />
          </div>
        </div>

        {trend !== undefined && (
          <div className="mt-3 flex items-center gap-1.5">
            {trendPositive ? (
              <TrendingUp size={14} className="text-emerald-500" />
            ) : (
              <TrendingDown size={14} className="text-red-500" />
            )}
            <span className={`text-xs font-semibold ${trendPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              {trendPositive ? '+' : ''}{trend.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400">so với tháng trước</span>
          </div>
        )}
      </div>
    </div>
  );
}

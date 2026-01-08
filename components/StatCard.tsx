import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend }) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-emerald-200/50 hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</h3>
          
          {trend && (
            <div className={`mt-2.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              trend.isPositive 
                ? 'bg-emerald-50 text-emerald-700' 
                : 'bg-red-50 text-red-700'
            }`}>
              <span className="mr-1">{trend.isPositive ? '↑' : '↓'}</span>
              {trend.value}% from last month
            </div>
          )}
        </div>
        
        <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
          <Icon className="h-6 w-6 text-slate-400 group-hover:text-emerald-600 transition-colors" />
        </div>
      </div>
      
      {/* Decorative gradient blur */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-50 to-teal-50 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl pointer-events-none"></div>
    </div>
  );
};

export default StatCard;
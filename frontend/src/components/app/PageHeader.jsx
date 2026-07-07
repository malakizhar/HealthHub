import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function PageHeader({ icon: Icon, title, subtitle, flowStep, compact }) {
  return (
    <div className={compact ? 'mb-5' : 'mb-6'}>
      {flowStep && (
        <div className="flex items-center gap-1 text-xs text-slate-400 mb-1.5">
          <Link to="/app" className="hover:text-brand-600">Dashboard</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-500">{flowStep}</span>
        </div>
      )}
      <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
        {Icon && <Icon className="w-5 h-5 text-brand-600" />}
        {title}
      </h2>
      {subtitle && !compact && (
        <p className="text-slate-500 text-sm mt-1 max-w-xl">{subtitle}</p>
      )}
    </div>
  );
}

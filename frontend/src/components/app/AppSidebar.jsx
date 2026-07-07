import { Link, NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Stethoscope, Bot, Pill, FileScan, Siren,
  Droplets, Calendar, Users, LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Logo from '../website/Logo';

const NAV = [
  { to: '/app', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/app/symptoms', icon: Stethoscope, label: 'AI Symptom Checker' },
  { to: '/app/assistant', icon: Bot, label: 'Health Assistant' },
  { to: '/app/medications', icon: Pill, label: 'Medications' },
  { to: '/app/prescription', icon: FileScan, label: 'Prescription Scanner' },
  { to: '/app/queue', icon: Users, label: 'Hospital Queue' },
  { to: '/app/emergency', icon: Siren, label: 'Emergency Profile' },
  { to: '/app/blood', icon: Droplets, label: 'Blood Donation' },
  { to: '/app/appointments', icon: Calendar, label: 'Appointments' },
];

export default function AppSidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-100 flex flex-col z-40 hidden lg:flex">
      <div className="p-5 border-b border-slate-100">
        <Link to="/" className="block hover:opacity-90 transition">
          <Logo variant="header" />
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-50 text-brand-700 border border-brand-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{user?.name}</div>
            <div className="text-xs text-slate-500 truncate">{user?.email}</div>
          </div>
        </div>
        <button onClick={logout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </aside>
  );
}

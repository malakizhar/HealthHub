import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ArrowRight, Shield, HeartPulse, Award } from 'lucide-react';
import Logo from './Logo';

const PLATFORM = [
  { to: '/features', label: 'Features' },
  { to: '/about', label: 'About us' },
  { to: '/contact', label: 'Contact' },
];

const MODULES = [
  { to: '/login', label: 'Sign in' },
  { to: '/register', label: 'Create account' },
  { to: '/app', label: 'Dashboard' },
];

export default function Footer() {
  return (
    <footer className="relative bg-slate-950 text-slate-300 mt-auto">
      {/* Wave top */}
      <div className="absolute top-0 left-0 right-0 -translate-y-full leading-[0]">
        <svg viewBox="0 0 1440 80" fill="none" className="w-full h-auto block" preserveAspectRatio="none">
          <path
            d="M0 80L48 70C96 60 192 40 288 35C384 30 480 40 576 45C672 50 768 50 864 45C960 40 1056 30 1152 28C1248 26 1344 32 1392 35L1440 38V80H0Z"
            className="fill-slate-950"
          />
        </svg>
      </div>

      {/* CTA strip */}
      <div className="border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 rounded-2xl bg-gradient-to-r from-brand-900/80 via-indigo-900/70 to-slate-900 border border-slate-800 p-6 md:p-8">
            <div>
              <div className="flex items-center gap-2 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2">
                <HeartPulse className="w-4 h-4" /> Healthcare for Peshawar
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-1">Start your connected care journey</h3>
              <p className="text-sm text-slate-400 max-w-lg">AI triage, live hospital queues, prescription scanning, and phone medicine reminders — free for all.</p>
            </div>
            <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition shrink-0">
              Get started free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          <div className="lg:col-span-5">
            <Logo variant="footer" className="mb-5" />
            <p className="text-sm leading-relaxed text-slate-400 max-w-md mb-6">
              One healthcare platform for Peshawar and Khyber Pakhtunkhwa. AI symptom checking, live hospital queues,
              prescription scanning, phone reminders, blood donor network, and emergency QR profiles.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 border border-slate-800 px-4 py-2 text-xs">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">AI Hackathon 2026 · Track 3 Healthcare Access</span>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Platform</h4>
            <div className="space-y-2.5 text-sm">
              {PLATFORM.map(({ to, label }) => (
                <Link key={to} to={to} className="block text-slate-400 hover:text-white transition">{label}</Link>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Get started</h4>
            <div className="space-y-2.5 text-sm">
              {MODULES.map(({ to, label }) => (
                <Link key={to} to={to} className="block text-slate-400 hover:text-white transition">{label}</Link>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Contact</h4>
            <div className="space-y-3 text-sm">
              <a href="mailto:support@healthhub.pk" className="flex items-start gap-3 text-slate-400 hover:text-white transition group">
                <Mail className="w-4 h-4 mt-0.5 text-brand-400 group-hover:text-brand-300" />
                <span>
                  <span className="block text-slate-300">support@healthhub.pk</span>
                  <span className="text-xs text-slate-500">General support</span>
                </span>
              </a>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 mt-0.5 text-red-400" />
                <span>
                  <span className="block text-slate-300">1122 — Rescue Peshawar</span>
                  <span className="text-xs text-slate-500">Emergency only</span>
                </span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 text-brand-400" />
                <span>
                  <span className="block text-slate-300">Peshawar, KPK</span>
                  <span className="text-xs text-slate-500">LRH · KTH · Hayatabad · BHUs</span>
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 mt-0.5 text-emerald-400" />
                <span>
                  <span className="block text-slate-300">Free &amp; open for demo</span>
                  <span className="text-xs text-slate-500">Built for civic innovation</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
          <p>© 2026 HealthHub AI · Team 3 · Najeeb Ullah · Civic Innovation Challenge</p>
          <p className="text-slate-600">Made with care for Pakistan 🇵🇰</p>
        </div>
      </div>
    </footer>
  );
}

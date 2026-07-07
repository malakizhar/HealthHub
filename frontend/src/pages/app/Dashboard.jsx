import { Link, useNavigate } from 'react-router-dom';
import {
  Stethoscope, Pill, Calendar, ArrowRight, Clock, CheckCircle2, Siren, Users,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { ActivityTimeline } from '../../components/app/CareFlowPanel';

export default function Dashboard() {
  const {
    medications, appointments, triageHistory, emergencyProfile,
    activeQueue, pendingSteps, completeCareStep,
  } = useData();
  const navigate = useNavigate();

  const pendingMeds = medications.filter((m) => !m.taken);
  const lastTriage = triageHistory[0];
  const nextStep = pendingSteps[0];
  const upcomingAppts = appointments.filter((a) => a.status !== 'cancelled').slice(0, 2);

  const goToStep = (step) => {
    if (step?.action === 'call1122') {
      window.location.href = 'tel:1122';
      completeCareStep(step.id);
      return;
    }
    if (step?.route) navigate(step.route, { state: step.payload || {} });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Your care journey at a glance</p>
      </div>

      {!lastTriage ? (
        <div className="rounded-2xl bg-brand-600 text-white p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Start with a symptom check</h2>
            <p className="text-blue-100 text-sm mt-1">We will guide you to the right care step by step.</p>
          </div>
          <button onClick={() => navigate('/app/symptoms')} className="bg-white text-brand-700 font-semibold px-5 py-2.5 rounded-xl text-sm shrink-0">
            Begin
          </button>
        </div>
      ) : nextStep && (
        <button
          onClick={() => goToStep(nextStep)}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-brand-100 hover:border-brand-200 transition text-left"
        >
          <div>
            <p className="text-xs font-medium text-brand-600">Next step</p>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">{nextStep.title}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-brand-500" />
        </button>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Meds due', value: pendingMeds.length, to: '/app/medications' },
          { label: 'Appointments', value: appointments.length, to: '/app/appointments' },
          { label: 'Steps left', value: pendingSteps.length, to: '/app/symptoms' },
        ].map(({ label, value, to }) => (
          <Link key={label} to={to} className="rounded-2xl bg-white border border-slate-100 p-4 hover:border-brand-100 transition">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {lastTriage && (
            <section className="rounded-2xl bg-white border border-slate-100 p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Latest check</p>
                  <h3 className="font-semibold text-slate-900">{lastTriage.condition}</h3>
                </div>
                <span className={`badge badge-${lastTriage.urgency}`}>{lastTriage.urgency}</span>
              </div>
              <p className="text-sm text-slate-500">{lastTriage.summary}</p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => navigate('/app/queue', { state: { hospitalId: lastTriage.facilities?.[0]?.id } })} className="text-xs font-medium text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100">
                  Join queue
                </button>
                <button onClick={() => navigate('/app/appointments', { state: { hospital: lastTriage.facilities?.[0]?.name } })} className="text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg hover:bg-slate-100">
                  Book visit
                </button>
              </div>
            </section>
          )}

          <section className="rounded-2xl bg-white border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" /> Medications today
              </h3>
              <Link to="/app/medications" className="text-xs text-brand-600 font-medium">View all</Link>
            </div>
            {pendingMeds.length === 0 ? (
              <p className="text-sm text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent-500" /> All done for today
              </p>
            ) : (
              <ul className="space-y-2">
                {pendingMeds.slice(0, 3).map((m) => (
                  <li key={m.id} className="flex justify-between text-sm py-2 border-b border-slate-50 last:border-0">
                    <span className="font-medium">{m.name} <span className="text-slate-400 font-normal">{m.dose}</span></span>
                    <span className="text-brand-600">{m.time}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {activeQueue && (
            <section className="rounded-2xl bg-accent-50 border border-accent-100 p-5">
              <p className="text-xs text-accent-600 font-medium">Queue token</p>
              <p className="text-2xl font-bold text-accent-800 mt-1">{activeQueue.token}</p>
              <p className="text-sm text-accent-700 mt-1">{activeQueue.hospital}</p>
            </section>
          )}

          <section className="rounded-2xl bg-white border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Emergency</h3>
            <div className="flex gap-4 text-sm">
              <div><p className="text-xs text-slate-400">Blood</p><p className="font-semibold">{emergencyProfile.bloodGroup}</p></div>
              <div><p className="text-xs text-slate-400">Allergies</p><p className="font-semibold">{emergencyProfile.allergies || 'None'}</p></div>
            </div>
            <Link to="/app/emergency" className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-brand-600">
              <Siren className="w-3.5 h-3.5" /> Open emergency profile
            </Link>
          </section>

          {upcomingAppts.length > 0 && (
            <section className="rounded-2xl bg-white border border-slate-100 p-5">
              <h3 className="font-semibold text-slate-900 mb-3">Upcoming visits</h3>
              {upcomingAppts.map((a) => (
                <div key={a.id} className="text-sm py-2 border-b border-slate-50 last:border-0">
                  <p className="font-medium">{a.hospital}</p>
                  <p className="text-slate-400 text-xs">{a.date} · {a.time}</p>
                </div>
              ))}
            </section>
          )}

          <section className="rounded-2xl bg-white border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Recent activity</h3>
            <ActivityTimeline limit={4} />
          </section>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        {[
          { to: '/app/symptoms', icon: Stethoscope, label: 'Symptoms' },
          { to: '/app/prescription', icon: Pill, label: 'Prescription' },
          { to: '/app/queue', icon: Users, label: 'Queue' },
          { to: '/app/appointments', icon: Calendar, label: 'Appointments' },
        ].map(({ to, icon: Icon, label }) => (
          <Link key={to} to={to} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-100 px-3 py-2 rounded-lg hover:border-brand-200 hover:text-brand-600 transition">
            <Icon className="w-3.5 h-3.5" /> {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

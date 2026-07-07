import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Circle, Phone } from 'lucide-react';
import { useData } from '../../context/DataContext';

export default function CareFlowPanel({ compact = false }) {
  const { pendingSteps, activeCase, completeCareStep } = useData();
  const navigate = useNavigate();

  if (!pendingSteps.length && !activeCase) return null;

  const handleStep = (step) => {
    if (step.action === 'call1122') {
      window.location.href = 'tel:1122';
      completeCareStep(step.id);
      return;
    }
    if (step.route) {
      navigate(step.route, { state: step.payload || {} });
    }
  };

  if (compact) {
    const next = pendingSteps[0];
    if (!next) return null;
    return (
      <div className="flex items-center justify-between p-4 bg-brand-50 border border-brand-100 rounded-xl">
        <div>
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide">Next in your care flow</p>
          <p className="text-sm font-medium text-slate-800 mt-0.5">{next.title}</p>
        </div>
        <button onClick={() => handleStep(next)} className="btn-primary text-xs !py-2 !px-3">
          Continue <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="card border-brand-100 bg-gradient-to-br from-brand-50/80 to-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-900">Your Care Flow</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeCase?.symptoms
              ? 'Started from symptom check. Complete each step to finish your visit.'
              : 'Steps linked across modules based on your latest activity.'}
          </p>
        </div>
        <Link to="/app" className="text-xs text-brand-600 font-semibold hover:underline">Dashboard</Link>
      </div>

      <div className="space-y-2">
        {pendingSteps.map((step, i) => (
          <button
            key={step.id}
            onClick={() => handleStep(step)}
            className="w-full flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-100 hover:border-brand-200 hover:shadow-sm transition text-left"
          >
            <Circle className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-800">
                {i + 1}. {step.title}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">{step.detail}</div>
            </div>
            {step.action === 'call1122' ? (
              <Phone className="w-4 h-4 text-red-500 shrink-0" />
            ) : (
              <ArrowRight className="w-4 h-4 text-brand-400 shrink-0 mt-1" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CareFlowProgress() {
  const { carePlan, completedSteps, pendingSteps } = useData();
  if (!carePlan.length) return null;
  const pct = Math.round((completedSteps.length / carePlan.length) * 100);

  return (
    <div className="card !p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold">Care journey progress</span>
        <span className="text-sm font-bold text-brand-600">{pct}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-brand-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-slate-400 mt-2">
        {completedSteps.length} of {carePlan.length} steps done
        {pendingSteps[0] ? ` · Next: ${pendingSteps[0].title}` : ' · Flow complete'}
      </p>
    </div>
  );
}

export function ActivityTimeline({ limit = 6 }) {
  const { activityLog } = useData();
  const icons = {
    triage: 'text-red-500',
    prescription: 'text-purple-500',
    medication: 'text-brand-500',
    appointment: 'text-accent-500',
    queue: 'text-orange-500',
    blood: 'text-rose-500',
  };

  if (!activityLog.length) {
    return (
      <p className="text-sm text-slate-400 text-center py-6">
        Your activity timeline will appear here as you use connected modules.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {activityLog.slice(0, limit).map((item) => (
        <div key={item.id} className="flex gap-3 items-start">
          <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${icons[item.type] || 'text-slate-400'}`} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-800">{item.title}</div>
            <div className="text-xs text-slate-500">{item.detail}</div>
          </div>
          <div className="text-[10px] text-slate-400 shrink-0">
            {new Date(item.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ))}
    </div>
  );
}

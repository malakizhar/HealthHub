import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Users, Clock, Ticket, Loader2, RefreshCw, Radio, MapPin, Phone,
  LogOut, Building2, User,
} from 'lucide-react';
import { apiQueueStatus, apiJoinQueue, apiLeaveQueue, apiMyQueue } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import PageHeader from '../../components/app/PageHeader';

export default function Queue() {
  const { user } = useAuth();
  const { setQueueResult, triageHistory, activeQueue } = useData();
  const location = useLocation();
  const lastTriage = triageHistory[0];

  const [hospitalId, setHospitalId] = useState(location.state?.hospitalId || lastTriage?.facilities?.[0]?.id || 'ps-001');
  const [data, setData] = useState(null);
  const [myQueue, setMyQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [reason, setReason] = useState(location.state?.reason || lastTriage?.condition || 'General consultation');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [q, mine] = await Promise.all([
        apiQueueStatus(hospitalId),
        apiMyQueue().catch(() => null),
      ]);
      setData(q);
      setMyQueue(mine);
      if (mine) setHospitalId(mine.hospital_id);
    } catch (e) {
      if (!silent) alert(e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(() => load(true), 8000);
    return () => clearInterval(t);
  }, [load]);

  const join = async () => {
    setJoining(true);
    try {
      const d = await apiJoinQueue(hospitalId, user?.name || 'Patient', reason);
      setQueueResult(d);
      await load(true);
    } catch (e) {
      alert(e.message);
    } finally {
      setJoining(false);
    }
  };

  const leave = async () => {
    if (!confirm('Leave the queue? Your token will be cancelled.')) return;
    await apiLeaveQueue();
    setMyQueue(null);
    load(true);
  };

  const selectedHospital = data?.hospitals?.find((h) => h.id === hospitalId);
  const myToken = myQueue?.token || activeQueue?.token;
  const isMyEntry = (q) => myQueue && q.token === myQueue.token;

  if (loading && !data) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-brand-600" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader icon={Users} title="Hospital Queue" subtitle="Live Peshawar hospital queues" compact />

      {myQueue && (
        <div className="rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-blue-100 uppercase tracking-wide flex items-center gap-1"><Radio className="w-3 h-3 animate-pulse" /> Your active token</p>
            <p className="text-3xl font-black mt-1">{myQueue.token}</p>
            <p className="text-sm text-blue-100 mt-1">{myQueue.hospital_name} · {myQueue.reason}</p>
            <p className="text-xs text-blue-200 mt-1">Est. wait ~{myQueue.wait_min} min · Status: {myQueue.status === 'in-progress' ? 'Being served' : 'Waiting'}</p>
          </div>
          <button onClick={leave} className="flex items-center gap-2 bg-white/15 hover:bg-white/25 px-4 py-2 rounded-xl text-sm font-semibold">
            <LogOut className="w-4 h-4" /> Leave queue
          </button>
        </div>
      )}

      <div className="grid sm:grid-cols-4 gap-3">
        {[
          { icon: Building2, val: data?.hospital_name?.split(' ')[0], lbl: 'Hospital' },
          { icon: Clock, val: `${data?.avg_wait_minutes}m`, lbl: 'Avg wait' },
          { icon: Users, val: data?.total_waiting, lbl: 'In queue' },
          { icon: Ticket, val: data?.currently_serving?.token || '—', lbl: 'Now serving' },
        ].map(({ icon: Icon, val, lbl }) => (
          <div key={lbl} className="card-hover text-center !py-4">
            <Icon className="w-4 h-4 text-brand-600 mx-auto mb-1" />
            <p className="text-lg font-bold truncate px-1">{val}</p>
            <p className="text-xs text-slate-400">{lbl}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card space-y-3">
            <h3 className="font-semibold text-sm">Select hospital</h3>
            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {data?.hospitals?.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setHospitalId(h.id)}
                  className={`w-full text-left p-3 rounded-xl border transition ${hospitalId === h.id ? 'border-brand-500 bg-brand-50' : 'border-slate-100 hover:border-brand-200'}`}
                >
                  <p className="font-semibold text-sm">{h.name}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{h.area} · ~{h.avg_wait}m wait</p>
                </button>
              ))}
            </div>
          </div>

          {selectedHospital && (
            <div className="card text-sm space-y-2">
              <h3 className="font-semibold">Hospital info</h3>
              <p className="text-slate-600">{selectedHospital.name}</p>
              <p className="text-slate-400 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {selectedHospital.area}, Peshawar</p>
              <a href={`tel:${selectedHospital.phone?.replace(/-/g, '')}`} className="text-brand-600 flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {selectedHospital.phone}</a>
            </div>
          )}

          {!myQueue && (
            <div className="card space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2"><User className="w-4 h-4" /> Join queue</h3>
              <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for visit" />
              <button onClick={join} disabled={joining} className="btn-primary w-full">
                {joining ? <><Loader2 className="w-4 h-4 animate-spin" /> Joining...</> : 'Get token'}
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-3 card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-semibold">Live queue board</h3>
              <p className="text-xs text-accent-600 flex items-center gap-1"><Radio className="w-3 h-3 animate-pulse" /> Updates every 8 seconds</p>
            </div>
            <button onClick={() => load()} className="text-brand-600 text-xs flex items-center gap-1 hover:underline"><RefreshCw className="w-3 h-3" /> Refresh</button>
          </div>
          <div className="space-y-2">
            {data?.queue?.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-12">Queue is empty — be the first!</p>
            )}
            {data?.queue?.map((q, i) => (
              <div
                key={`${q.token}-${i}`}
                className={`flex items-center justify-between p-3 rounded-xl text-sm transition ${
                  q.status === 'in-progress' ? 'bg-brand-600 text-white shadow-md' :
                  isMyEntry(q) ? 'bg-accent-50 border-2 border-accent-400' : 'bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`font-black text-lg ${q.status === 'in-progress' ? 'text-white' : 'text-brand-600'}`}>{q.token}</span>
                  <div>
                    <p className="font-medium">{q.patient}{isMyEntry(q) && ' (You)'}</p>
                    <p className={`text-xs ${q.status === 'in-progress' ? 'text-blue-100' : 'text-slate-400'}`}>{q.reason}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                  q.status === 'in-progress' ? 'bg-white/20' : 'bg-white text-slate-500'
                }`}>
                  {q.status === 'in-progress' ? 'Serving now' : `~${q.wait_min}m`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

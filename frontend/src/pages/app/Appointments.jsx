import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Calendar, Plus, Trash2, Clock, MapPin, User, ChevronRight,
  ChevronLeft, Loader2, CheckCircle2, XCircle, Building2,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { apiAppointmentHospitals, apiAppointmentSlots, apiCancelAppointment } from '../../api/client';
import PageHeader from '../../components/app/PageHeader';

const STEPS = ['Hospital', 'Doctor & date', 'Time slot', 'Confirm'];

const STATUS_STYLE = {
  confirmed: 'bg-accent-100 text-accent-700',
  pending: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-slate-100 text-slate-500 line-through',
};

export default function Appointments() {
  const { appointments, addAppointment, deleteAppointment, triageHistory, refreshData } = useData();
  const location = useLocation();
  const lastTriage = triageHistory[0];

  const [showBook, setShowBook] = useState(!!location.state?.hospital);
  const [step, setStep] = useState(0);
  const [hospitals, setHospitals] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    hospitalId: lastTriage?.facilities?.[0]?.id || 'ps-001',
    hospital: location.state?.hospital || lastTriage?.facilities?.[0]?.name || '',
    doctor: '',
    specialty: location.state?.type || lastTriage?.condition || 'General checkup',
    date: '',
    time: '',
    phone: '',
    notes: '',
  });

  useEffect(() => {
    apiAppointmentHospitals().then(setHospitals).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.hospitalId && form.date) {
      setLoadingSlots(true);
      apiAppointmentSlots(form.hospitalId, form.date)
        .then(setSlots)
        .finally(() => setLoadingSlots(false));
    }
  }, [form.hospitalId, form.date]);

  const selectHospital = (h) => {
    setForm({ ...form, hospitalId: h.id, hospital: h.name, doctor: '' });
    setStep(1);
  };

  const selectDoctor = (doc) => {
    setForm({ ...form, doctor: doc.name, specialty: doc.specialty });
  };

  const confirm = async () => {
    setSubmitting(true);
    try {
      await addAppointment({
        doctor: form.doctor,
        hospital: form.hospital,
        hospitalId: form.hospitalId,
        date: form.date,
        time: form.time,
        type: form.specialty,
        phone: form.phone,
        notes: form.notes,
      });
      setShowBook(false);
      setStep(0);
      setForm({ ...form, date: '', time: '', notes: '' });
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async (id) => {
    if (!confirm('Cancel this appointment?')) return;
    await apiCancelAppointment(id);
    await refreshData();
  };

  const upcoming = appointments.filter((a) => a.status !== 'cancelled');
  const past = appointments.filter((a) => a.status === 'cancelled');
  const selectedHospital = hospitals.find((h) => h.id === form.hospitalId);
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader icon={Calendar} title="Appointments" subtitle="Book visits at Peshawar hospitals" compact />
        <button onClick={() => { setShowBook(!showBook); setStep(0); }} className="btn-primary text-sm !py-2 !px-4 shrink-0">
          <Plus className="w-4 h-4" /> Book visit
        </button>
      </div>

      {/* Booking wizard */}
      {showBook && (
        <div className="card border-brand-100">
          <div className="flex items-center gap-2 mb-6 overflow-x-auto">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 shrink-0">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i <= step ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{i + 1}</span>
                <span className={`text-sm font-medium ${i === step ? 'text-brand-700' : 'text-slate-400'}`}>{s}</span>
                {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300 mx-1" />}
              </div>
            ))}
          </div>

          {step === 0 && (
            <div className="grid sm:grid-cols-2 gap-3">
              {hospitals.map((h) => (
                <button key={h.id} type="button" onClick={() => selectHospital(h)} className="text-left p-4 rounded-xl border border-slate-100 hover:border-brand-400 hover:bg-brand-50 transition">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">{h.name}</p>
                      <p className="text-xs text-slate-400">{h.type} · {h.area}</p>
                      <p className="text-xs text-brand-600 mt-1">{h.doctors?.length || 0} doctors available</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 1 && selectedHospital && (
            <div className="space-y-4">
              <button onClick={() => setStep(0)} className="text-xs text-brand-600 flex items-center gap-1"><ChevronLeft className="w-3 h-3" /> Change hospital</button>
              <p className="font-semibold">{selectedHospital.name}</p>
              <div>
                <label className="label">Select doctor</label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {selectedHospital.doctors?.map((d) => (
                    <button key={d.id} type="button" onClick={() => selectDoctor(d)} className={`text-left p-3 rounded-xl border transition ${form.doctor === d.name ? 'border-brand-500 bg-brand-50' : 'border-slate-100 hover:border-brand-200'}`}>
                      <p className="font-semibold text-sm">{d.name}</p>
                      <p className="text-xs text-slate-400">{d.specialty}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Date</label>
                <input className="input max-w-xs" type="date" min={minDate} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value, time: '' })} />
              </div>
              <button disabled={!form.doctor || !form.date} onClick={() => setStep(2)} className="btn-primary">Next: pick time</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <button onClick={() => setStep(1)} className="text-xs text-brand-600 flex items-center gap-1"><ChevronLeft className="w-3 h-3" /> Back</button>
              <p className="text-sm text-slate-600">{form.doctor} · {form.date}</p>
              {loadingSlots ? (
                <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {slots.map((s) => (
                    <button
                      key={s.time}
                      type="button"
                      disabled={!s.available}
                      onClick={() => { setForm({ ...form, time: s.time }); setStep(3); }}
                      className={`py-2 rounded-lg text-sm font-semibold transition ${!s.available ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : form.time === s.time ? 'bg-brand-600 text-white' : 'bg-slate-50 hover:bg-brand-50 text-slate-700'}`}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
              )}
              {slots.length === 0 && !loadingSlots && <p className="text-sm text-slate-400">No slots available for this date</p>}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 max-w-md">
              <button onClick={() => setStep(2)} className="text-xs text-brand-600 flex items-center gap-1"><ChevronLeft className="w-3 h-3" /> Back</button>
              <div className="bg-brand-50 rounded-xl p-4 space-y-2 text-sm">
                <p><strong>Hospital:</strong> {form.hospital}</p>
                <p><strong>Doctor:</strong> {form.doctor}</p>
                <p><strong>Date:</strong> {form.date} at {form.time}</p>
                <p><strong>Type:</strong> {form.specialty}</p>
              </div>
              <div><label className="label">Your phone</label>
                <input className="input" placeholder="0300-1234567" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div><label className="label">Notes (optional)</label>
                <input className="input" placeholder="Symptoms, referral..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <button onClick={confirm} disabled={submitting} className="btn-primary w-full">
                {submitting ? 'Booking...' : 'Confirm appointment'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Appointments list */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section>
          <h3 className="font-semibold mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent-600" /> Upcoming ({upcoming.length})</h3>
          {upcoming.length === 0 ? (
            <div className="card text-center py-10 text-slate-400 text-sm">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No upcoming appointments
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((a) => (
                <div key={a.id} className="card-hover !p-4 flex gap-4">
                  <div className="w-14 h-14 rounded-xl bg-brand-600 text-white flex flex-col items-center justify-center shrink-0">
                    <span className="text-lg font-black leading-none">{a.date?.split('-')[2]}</span>
                    <span className="text-[10px] opacity-80">{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(a.date?.split('-')[1],10)-1]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm">{a.hospital}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[a.status] || STATUS_STYLE.confirmed}`}>{a.status || 'confirmed'}</span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><User className="w-3 h-3" /> {a.doctor || a.type}</p>
                    <p className="text-xs text-brand-600 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" /> {a.time}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => cancel(a.id)} title="Cancel" className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><XCircle className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h3 className="font-semibold mb-3 text-slate-400">Quick book — Peshawar hospitals</h3>
          <div className="space-y-2">
            {(hospitals.length ? hospitals : [{ id: 'ps-001', name: 'Lady Reading Hospital', area: 'Saddar', phone: '091-9211400' }]).slice(0, 5).map((h) => (
              <button
                key={h.id}
                onClick={() => { selectHospital(h); setShowBook(true); }}
                className="w-full card-hover !p-3 flex items-center gap-3 text-left"
              >
                <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
                <div>
                  <p className="font-medium text-sm">{h.name}</p>
                  <p className="text-xs text-slate-400">{h.area} · {h.phone}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

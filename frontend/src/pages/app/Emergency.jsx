import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Siren, Phone, Save, Loader2, Download, Shield, Pill, MapPin, User, Heart,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import PageHeader from '../../components/app/PageHeader';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

function completeness(p) {
  const fields = ['bloodGroup', 'allergies', 'conditions', 'emergencyContact', 'cnic', 'phone'];
  const filled = fields.filter((f) => p[f]?.trim()).length;
  return Math.round((filled / fields.length) * 100);
}

export default function Emergency() {
  const { user } = useAuth();
  const { emergencyProfile, setEmergencyProfile, medications } = useData();
  const [draft, setDraft] = useState(emergencyProfile);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const qrRef = useRef(null);

  useEffect(() => { setDraft(emergencyProfile); }, [emergencyProfile]);

  const update = (field, value) => {
    setDraft({ ...draft, [field]: value });
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      const synced = {
        ...draft,
        medications: medications.filter((m) => !m.taken).map((m) => `${m.name} ${m.dose}`).join(', ') || draft.medications,
      };
      await setEmergencyProfile(synced);
      setDraft(synced);
      setSaved(true);
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const downloadQr = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'healthhub-emergency-qr.svg';
    a.click();
  };

  const qrData = JSON.stringify({
    name: user?.name,
    bloodGroup: draft.bloodGroup,
    allergies: draft.allergies,
    conditions: draft.conditions,
    medications: draft.medications,
    emergencyContact: draft.emergencyContact,
    phone: draft.phone,
    cnic: draft.cnic,
  });

  const pct = completeness(draft);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader icon={Siren} title="Emergency Profile" subtitle="QR medical ID for Rescue 1122 & first responders" compact />

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-3 space-y-5">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2"><User className="w-4 h-4 text-brand-600" /> Personal details</h3>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${pct >= 80 ? 'bg-accent-100 text-accent-700' : 'bg-amber-100 text-amber-700'}`}>
                {pct}% complete
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
              <div className="h-full bg-brand-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Blood group</label>
                <select className="input" value={draft.bloodGroup || 'B+'} onChange={(e) => update('bloodGroup', e.target.value)}>
                  {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="label">CNIC</label>
                <input className="input" placeholder="35201-1234567-1" value={draft.cnic || ''} onChange={(e) => update('cnic', e.target.value)} />
              </div>
              <div>
                <label className="label">Your phone</label>
                <input className="input" placeholder="0300-1234567" value={draft.phone || ''} onChange={(e) => update('phone', e.target.value)} />
              </div>
              <div>
                <label className="label">Address (Peshawar)</label>
                <input className="input" placeholder="Hayatabad Phase 3" value={draft.address || ''} onChange={(e) => update('address', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Heart className="w-4 h-4 text-red-500" /> Medical info</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Allergies</label>
                <input className="input" placeholder="Penicillin, peanuts..." value={draft.allergies || ''} onChange={(e) => update('allergies', e.target.value)} />
              </div>
              <div>
                <label className="label">Conditions</label>
                <input className="input" placeholder="Diabetes, asthma..." value={draft.conditions || ''} onChange={(e) => update('conditions', e.target.value)} />
              </div>
              <div>
                <label className="label">Emergency contact</label>
                <input className="input" placeholder="Name, 0300-1234567" value={draft.emergencyContact || ''} onChange={(e) => update('emergencyContact', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-2 flex items-center gap-2"><Pill className="w-4 h-4 text-brand-600" /> Active medications</h3>
            <p className="text-xs text-slate-400 mb-3">Auto-synced from your reminder list</p>
            {medications.length === 0 ? (
              <p className="text-sm text-slate-400">No medications — <Link to="/app/medications" className="text-brand-600">add some</Link></p>
            ) : (
              <ul className="space-y-1.5">
                {medications.map((m) => (
                  <li key={m.id} className="text-sm flex justify-between py-1.5 border-b border-slate-50 last:border-0">
                    <span className={m.taken ? 'line-through text-slate-400' : 'font-medium'}>{m.name} {m.dose}</span>
                    <span className="text-xs text-slate-400">{m.time}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button onClick={save} disabled={saving} className="btn-primary w-full">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save emergency profile</>}
          </button>
          {saved && <p className="text-xs text-accent-600 text-center">Profile saved to your account</p>}
        </div>

        {/* Medical ID Card */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl overflow-hidden shadow-lift border border-slate-200">
            <div className="bg-gradient-to-br from-red-600 to-red-700 text-white p-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <div>
                <p className="text-xs uppercase tracking-wider opacity-80">Emergency Medical ID</p>
                <p className="font-bold">{user?.name || 'Patient'}</p>
              </div>
            </div>
            <div className="bg-white p-5" ref={qrRef}>
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-white border-2 border-slate-100 rounded-xl">
                  <QRCodeSVG value={qrData} size={160} level="M" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div className="bg-red-50 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-red-400 uppercase">Blood</p>
                  <p className="font-black text-red-700 text-lg">{draft.bloodGroup || '—'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-slate-400 uppercase">Allergies</p>
                  <p className="font-semibold text-sm truncate">{draft.allergies || 'None'}</p>
                </div>
              </div>
              {draft.conditions && (
                <p className="text-xs text-slate-600 mb-2"><strong>Conditions:</strong> {draft.conditions}</p>
              )}
              {draft.emergencyContact && (
                <p className="text-xs text-slate-600 mb-2"><strong>Contact:</strong> {draft.emergencyContact}</p>
              )}
              {draft.address && (
                <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {draft.address}</p>
              )}
            </div>
          </div>

          <button onClick={downloadQr} className="btn-secondary w-full text-sm"><Download className="w-4 h-4" /> Download QR</button>
          <a href="tel:1122" className="btn-danger w-full !animate-none flex"><Phone className="w-4 h-4" /> Call Rescue 1122</a>
          <Link to="/app/blood" className="block text-center text-sm text-brand-600 font-medium hover:underline">Open Peshawar blood community →</Link>
        </div>
      </div>
    </div>
  );
}

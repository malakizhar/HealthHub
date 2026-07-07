import { useState, useEffect, useCallback } from 'react';
import {
  Droplets, Plus, Phone, MapPin, Heart, Users, AlertTriangle, Search,
  Loader2, MessageCircle, CheckCircle2, RefreshCw, Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  apiBloodCommunity, apiRegisterDonor, apiRequestBlood, apiOfferBlood, apiFulfillBloodRequest,
} from '../../api/client';
import PageHeader from '../../components/app/PageHeader';

const GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const AREAS = ['Saddar', 'Hayatabad', 'University Town', 'Regi Lalma', 'Board Bazar', 'Charsadda Road', 'Warsak Road', 'Ring Road'];
const URGENCIES = [
  { id: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700' },
  { id: 'urgent', label: 'Urgent', color: 'bg-orange-100 text-orange-700' },
  { id: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-700' },
];

function waLink(phone) {
  const n = (phone || '').replace(/\D/g, '').replace(/^0/, '92');
  return `https://wa.me/${n}`;
}

export default function Blood() {
  const { user } = useAuth();
  const { emergencyProfile, bloodRequests, refreshData } = useData();
  const [tab, setTab] = useState('community');
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterGroup, setFilterGroup] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [offerModal, setOfferModal] = useState(null);
  const [offerMsg, setOfferMsg] = useState('I can donate. Please contact me.');
  const [submitting, setSubmitting] = useState(false);

  const [donorForm, setDonorForm] = useState({
    name: user?.name || '', bloodGroup: emergencyProfile.bloodGroup || 'O+',
    city: 'Peshawar', area: 'Saddar', phone: '', notes: '',
  });
  const [reqForm, setReqForm] = useState({
    bloodGroup: emergencyProfile.bloodGroup || 'O+', city: 'Peshawar', area: 'Saddar',
    hospital: 'Lady Reading Hospital', urgency: 'urgent', units: 1,
    requesterName: user?.name || '', contactPhone: '', notes: '',
  });

  const loadCommunity = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setCommunity(await apiBloodCommunity(filterGroup || null, filterArea || null));
    } catch (e) {
      console.warn(e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filterGroup, filterArea]);

  useEffect(() => { loadCommunity(); }, [loadCommunity]);
  useEffect(() => {
    const t = setInterval(() => loadCommunity(true), 20000);
    return () => clearInterval(t);
  }, [loadCommunity]);

  const submitOffer = async () => {
    if (!offerModal) return;
    setSubmitting(true);
    try {
      await apiOfferBlood({
        request_id: offerModal.id,
        donor_name: user?.name || 'Donor',
        donor_phone: donorForm.phone || '0300-0000000',
        message: offerMsg,
      });
      setOfferModal(null);
      loadCommunity(true);
      alert('Your offer was sent! The requester can contact you.');
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const register = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiRegisterDonor(donorForm);
      await refreshData();
      await loadCommunity(true);
      setTab('community');
      alert('You are now registered as a donor in the Peshawar community!');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const request = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiRequestBlood(reqForm);
      await refreshData();
      await loadCommunity(true);
      setTab('community');
      alert('Blood request posted to the Peshawar community!');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fulfill = async (id) => {
    await apiFulfillBloodRequest(id);
    await loadCommunity(true);
    await refreshData();
  };

  const stats = community?.stats;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader icon={Droplets} title="Blood Community" subtitle="Peshawar donor network — find & connect with donors" compact />

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Users, val: stats?.donors_available ?? '—', lbl: 'Donors available', color: 'text-brand-600' },
          { icon: AlertTriangle, val: stats?.open_requests ?? '—', lbl: 'Open requests', color: 'text-red-600' },
          { icon: MapPin, val: 'Peshawar', lbl: 'City network', color: 'text-accent-600' },
        ].map(({ icon: Icon, val, lbl, color }) => (
          <div key={lbl} className="card-hover text-center !py-4">
            <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
            <p className="text-xl font-bold">{val}</p>
            <p className="text-xs text-slate-400">{lbl}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'community', label: 'Community feed', icon: Users },
          { id: 'request', label: 'Request blood', icon: AlertTriangle },
          { id: 'register', label: 'Become donor', icon: Heart },
          { id: 'mine', label: 'My requests', icon: Clock },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition ${tab === id ? 'bg-brand-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300'}`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Community Feed */}
      {tab === 'community' && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2 items-center">
            <Search className="w-4 h-4 text-slate-400" />
            <select className="input !w-auto !py-1.5 text-sm" value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)}>
              <option value="">All blood groups</option>
              {GROUPS.map((g) => <option key={g}>{g}</option>)}
            </select>
            <select className="input !w-auto !py-1.5 text-sm" value={filterArea} onChange={(e) => setFilterArea(e.target.value)}>
              <option value="">All areas</option>
              {AREAS.map((a) => <option key={a}>{a}</option>)}
            </select>
            <button onClick={() => loadCommunity()} className="text-brand-600 text-xs flex items-center gap-1 ml-auto"><RefreshCw className="w-3 h-3" /> Refresh</button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-brand-600" /></div>
          ) : (
            <>
              {/* Open requests */}
              {community?.requests?.length > 0 && (
                <section>
                  <h3 className="font-semibold text-sm text-red-600 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Urgent requests ({community.requests.length})</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {community.requests.map((r) => {
                      const urg = URGENCIES.find((u) => u.id === r.urgency) || URGENCIES[2];
                      return (
                        <div key={r.id} className="card-hover border-l-4 border-l-red-500 !p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${urg.color}`}>{urg.label}</span>
                            <span className="text-2xl font-black text-red-600">{r.bloodGroup}</span>
                          </div>
                          <p className="font-semibold text-sm">{r.requesterName || 'Community member'}</p>
                          <p className="text-xs text-slate-500 mt-1">{r.hospital} · {r.area || r.city}</p>
                          {r.notes && <p className="text-xs text-slate-600 mt-1">{r.notes}</p>}
                          <p className="text-xs text-slate-400 mt-2">{r.units || 1} unit(s) needed</p>
                          <div className="flex gap-2 mt-3">
                            {r.contactPhone && (
                              <>
                                <a href={`tel:${r.contactPhone}`} className="flex-1 text-center text-xs font-semibold bg-brand-50 text-brand-700 py-2 rounded-lg flex items-center justify-center gap-1">
                                  <Phone className="w-3 h-3" /> Call
                                </a>
                                <a href={waLink(r.contactPhone)} target="_blank" rel="noreferrer" className="flex-1 text-center text-xs font-semibold bg-accent-50 text-accent-700 py-2 rounded-lg flex items-center justify-center gap-1">
                                  <MessageCircle className="w-3 h-3" /> WhatsApp
                                </a>
                              </>
                            )}
                            <button onClick={() => setOfferModal(r)} className="flex-1 text-xs font-semibold bg-red-600 text-white py-2 rounded-lg hover:bg-red-700">
                              I can donate
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Donors */}
              <section>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Heart className="w-4 h-4 text-brand-600" /> Available donors ({community?.donors?.length || 0})</h3>
                {community?.donors?.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No donors match your filter. <button onClick={() => setTab('register')} className="text-brand-600">Register as donor</button></p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {community.donors.map((d) => (
                      <div key={d.id} className="card-hover !p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">{d.name}</p>
                            <p className="text-xs text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{d.area || d.city}</p>
                          </div>
                          <span className="text-xl font-black text-red-600">{d.bloodGroup}</span>
                        </div>
                        {d.notes && <p className="text-xs text-slate-500 mb-2">{d.notes}</p>}
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-accent-700 bg-accent-50 px-2 py-0.5 rounded-full mb-3">
                          <span className="w-1.5 h-1.5 bg-accent-500 rounded-full animate-pulse" /> Available
                        </span>
                        <div className="flex gap-2">
                          <a href={`tel:${d.phone}`} className="flex-1 text-center text-xs font-semibold bg-brand-600 text-white py-2 rounded-lg flex items-center justify-center gap-1">
                            <Phone className="w-3 h-3" /> Call
                          </a>
                          <a href={waLink(d.phone)} target="_blank" rel="noreferrer" className="flex-1 text-center text-xs font-semibold border border-brand-200 text-brand-700 py-2 rounded-lg flex items-center justify-center gap-1">
                            <MessageCircle className="w-3 h-3" /> WhatsApp
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      )}

      {/* Request form */}
      {tab === 'request' && (
        <form onSubmit={request} className="card max-w-lg space-y-4 mx-auto">
          <h3 className="font-semibold">Post blood request to community</h3>
          <p className="text-xs text-slate-500">All registered donors in Peshawar will see your request.</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Blood group</label>
              <select className="input" value={reqForm.bloodGroup} onChange={(e) => setReqForm({ ...reqForm, bloodGroup: e.target.value })}>
                {GROUPS.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div><label className="label">Urgency</label>
              <select className="input" value={reqForm.urgency} onChange={(e) => setReqForm({ ...reqForm, urgency: e.target.value })}>
                {URGENCIES.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Hospital</label>
            <input className="input" required value={reqForm.hospital} onChange={(e) => setReqForm({ ...reqForm, hospital: e.target.value })} />
          </div>
          <div><label className="label">Area in Peshawar</label>
            <select className="input" value={reqForm.area} onChange={(e) => setReqForm({ ...reqForm, area: e.target.value })}>
              {AREAS.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div><label className="label">Your phone (for donors to contact)</label>
            <input className="input" required placeholder="0300-1234567" value={reqForm.contactPhone} onChange={(e) => setReqForm({ ...reqForm, contactPhone: e.target.value })} />
          </div>
          <div><label className="label">Notes</label>
            <textarea className="input" placeholder="Patient details, ward number..." value={reqForm.notes} onChange={(e) => setReqForm({ ...reqForm, notes: e.target.value })} />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Posting...' : 'Post to community'}
          </button>
        </form>
      )}

      {/* Register donor */}
      {tab === 'register' && (
        <form onSubmit={register} className="card max-w-lg space-y-4 mx-auto">
          <h3 className="font-semibold">Join as a blood donor</h3>
          <p className="text-xs text-slate-500">Your profile will appear in the Peshawar community feed.</p>
          <div><label className="label">Full name</label>
            <input className="input" required value={donorForm.name} onChange={(e) => setDonorForm({ ...donorForm, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Blood group</label>
              <select className="input" value={donorForm.bloodGroup} onChange={(e) => setDonorForm({ ...donorForm, bloodGroup: e.target.value })}>
                {GROUPS.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div><label className="label">Area</label>
              <select className="input" value={donorForm.area} onChange={(e) => setDonorForm({ ...donorForm, area: e.target.value })}>
                {AREAS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Phone</label>
            <input className="input" required placeholder="0300-1234567" value={donorForm.phone} onChange={(e) => setDonorForm({ ...donorForm, phone: e.target.value })} />
          </div>
          <div><label className="label">Notes (optional)</label>
            <input className="input" placeholder="Available weekends, can travel..." value={donorForm.notes} onChange={(e) => setDonorForm({ ...donorForm, notes: e.target.value })} />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full"><Plus className="w-4 h-4" /> Register as donor</button>
        </form>
      )}

      {/* My requests */}
      {tab === 'mine' && (
        <div className="space-y-3 max-w-lg mx-auto">
          <p className="text-xs text-slate-400">Your blood group: {emergencyProfile.bloodGroup} · <Link to="/app/emergency" className="text-brand-600">Edit profile</Link></p>
          {bloodRequests.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">No requests yet</p>
          ) : bloodRequests.map((r) => (
            <div key={r.id} className="card flex justify-between items-center !p-4">
              <div>
                <p className="font-bold text-red-600">{r.bloodGroup}</p>
                <p className="text-sm">{r.hospital}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'open' ? 'bg-orange-100 text-orange-700' : 'bg-accent-100 text-accent-700'}`}>{r.status}</span>
              </div>
              {r.status === 'open' && (
                <button onClick={() => fulfill(r.id)} className="text-xs font-semibold text-brand-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Mark fulfilled
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Offer modal */}
      {offerModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setOfferModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold">Offer to donate {offerModal.bloodGroup}</h3>
            <p className="text-sm text-slate-500">For {offerModal.requesterName} at {offerModal.hospital}</p>
            <textarea className="input" value={offerMsg} onChange={(e) => setOfferMsg(e.target.value)} rows={3} />
            <div className="flex gap-2">
              <button onClick={() => setOfferModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={submitOffer} disabled={submitting} className="btn-primary flex-1">Send offer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

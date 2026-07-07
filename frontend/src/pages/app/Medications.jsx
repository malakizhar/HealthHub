import { useState, useEffect } from 'react';

import { Pill, Plus, Check, Trash2 } from 'lucide-react';

import { useData } from '../../context/DataContext';

import PageHeader from '../../components/app/PageHeader';

import ReminderSetup from '../../components/app/ReminderSetup';

import { startLocalReminderWatcher } from '../../utils/notifications';



export default function Medications() {

  const { medications, addMedication, toggleMedication, deleteMedication } = useData();

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({ name: '', dose: '', time: '08:00', frequency: 'Once daily', notes: '' });



  useEffect(() => {

    return startLocalReminderWatcher(medications);

  }, [medications]);



  const handleAdd = async (e) => {

    e.preventDefault();

    try {

      await addMedication(form);

      setForm({ name: '', dose: '', time: '08:00', frequency: 'Once daily', notes: '' });

      setShowForm(false);

    } catch (err) {

      alert(err.message);

    }

  };



  const taken = medications.filter((m) => m.taken).length;



  return (

    <div className="max-w-3xl mx-auto">

      <div className="flex items-center justify-between mb-5">

        <PageHeader icon={Pill} title="Medications" flowStep="Medications" compact />

        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm !py-2 !px-4 shrink-0">

          <Plus className="w-4 h-4" /> Add

        </button>

      </div>



      <ReminderSetup medications={medications} />



      <p className="text-xs text-slate-400 mb-4">{taken}/{medications.length} taken · syncs to emergency profile</p>



      {showForm && (

        <form onSubmit={handleAdd} className="card grid sm:grid-cols-2 gap-3 mb-5">

          <input className="input" required placeholder="Medicine" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

          <input className="input" required placeholder="Dose" value={form.dose} onChange={(e) => setForm({ ...form, dose: e.target.value })} />

          <input className="input" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />

          <select className="input" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>

            <option>Once daily</option><option>Twice daily</option><option>As needed</option>

          </select>

          <button type="submit" className="btn-primary sm:col-span-2">Save</button>

        </form>

      )}



      <div className="space-y-2">

        {medications.length === 0 && (

          <p className="text-sm text-slate-400 text-center py-8">Add a medicine and set up phone reminders above</p>

        )}

        {medications.map((m) => (

          <div key={m.id} className={`card !p-3 flex items-center gap-3 ${m.taken ? 'opacity-50' : ''}`}>

            <button onClick={() => toggleMedication(m.id)} className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${m.taken ? 'bg-accent-500 text-white' : 'bg-slate-100 text-slate-400'}`}>

              <Check className="w-4 h-4" />

            </button>

            <div className="flex-1 text-sm">

              <span className={`font-semibold ${m.taken ? 'line-through' : ''}`}>{m.name}</span>

              <span className="text-slate-400"> {m.dose}</span>

              {m.source === 'prescription' && <span className="ml-1 text-[10px] text-purple-600">Rx</span>}

              <p className="text-xs text-slate-400">{m.time} · {m.frequency}</p>

            </div>

            <button onClick={() => deleteMedication(m.id)} className="p-1 text-red-400"><Trash2 className="w-4 h-4" /></button>

          </div>

        ))}

      </div>

    </div>

  );

}


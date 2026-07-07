import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Loader2, MapPin, Phone, Calendar, Users, Bot, ArrowRight } from 'lucide-react';
import { apiTriage } from '../../api/client';
import { useData } from '../../context/DataContext';
import PageHeader from '../../components/app/PageHeader';

const DEMOS = [
  { label: 'Dengue fever', text: 'High fever and body aches for 3 days in Peshawar, worried about dengue' },
  { label: 'Chest pain', text: 'Chest pain and difficulty breathing in Peshawar, very severe' },
  { label: 'Maternal', text: 'Pregnant woman with bleeding in Peshawar Hayatabad, 7 months' },
];

export default function Symptoms() {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { startTriageFlow } = useData();
  const navigate = useNavigate();

  const run = async () => {
    if (symptoms.trim().length < 3) return;
    setLoading(true);
    try {
      const data = await apiTriage(symptoms);
      setResult(data);
      startTriageFlow(data, symptoms);
    } catch (e) {
      alert(e.message || 'Triage failed. Make sure Ollama is running or GEMINI_API_KEY is set.');
    } finally {
      setLoading(false);
    }
  };

  const facility = result?.facilities?.[0];

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader icon={Stethoscope} title="Symptom Checker" flowStep="Symptoms" compact />

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card space-y-4">
          <textarea
            className="input min-h-[140px]"
            placeholder="Describe symptoms and your city..."
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {DEMOS.map((d) => (
              <button key={d.label} onClick={() => setSymptoms(d.text)} className="text-xs bg-slate-50 hover:bg-brand-50 text-slate-600 px-3 py-1 rounded-lg transition">
                {d.label}
              </button>
            ))}
          </div>
          <button onClick={run} disabled={loading} className="btn-primary w-full">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing</> : 'Run triage'}
          </button>
        </div>

        <div className="card min-h-[280px]">
          {!result ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400">
              <Stethoscope className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Results appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 rounded-xl" style={{ background: `${result.urgency_color}12`, borderLeft: `3px solid ${result.urgency_color}` }}>
                <p className="font-semibold text-sm" style={{ color: result.urgency_color }}>{result.urgency_label}</p>
                <p className="text-sm text-slate-600 mt-1">{result.summary}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-slate-400 text-xs">Condition</span><p className="font-medium">{result.condition}</p></div>
                <div><span className="text-slate-400 text-xs">Confidence</span><p className="font-medium">{Math.round(result.confidence * 100)}%</p></div>
              </div>
              <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{result.recommended_action}</p>

              {facility && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button onClick={() => navigate('/app/queue', { state: { hospitalId: facility.id, reason: result.condition } })} className="text-xs font-medium flex items-center gap-1 text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg">
                    <Users className="w-3 h-3" /> Queue
                  </button>
                  <button onClick={() => navigate('/app/appointments', { state: { hospital: facility.name, type: result.condition } })} className="text-xs font-medium flex items-center gap-1 text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg">
                    <Calendar className="w-3 h-3" /> Book
                  </button>
                  <button onClick={() => navigate('/app/assistant', { state: { prefilledQuestion: `Explain ${result.condition}` } })} className="text-xs font-medium flex items-center gap-1 text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg">
                    <Bot className="w-3 h-3" /> Ask AI
                  </button>
                </div>
              )}

              {result.facilities?.[0] && (
                <div className="text-xs text-slate-500 flex items-center gap-3 pt-2 border-t border-slate-50">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{result.facilities[0].name}</span>
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{result.facilities[0].phone}</span>
                </div>
              )}
              {result.engine && <p className="text-[10px] text-slate-400">{result.engine}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

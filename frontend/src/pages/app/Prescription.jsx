import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileScan, Upload, Loader2, ArrowRight } from 'lucide-react';
import { apiScanPrescription } from '../../api/client';
import { useData } from '../../context/DataContext';
import PageHeader from '../../components/app/PageHeader';

export default function Prescription() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const { completePrescriptionFlow, addMedicationsFromPrescription } = useData();
  const navigate = useNavigate();

  const scan = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiScanPrescription(file, text || null);
      setResult(data);
      completePrescriptionFlow(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader icon={FileScan} title="Prescription Scanner" flowStep="Prescription" compact />

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card space-y-3">
          <label className="block border border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-brand-300 transition relative">
            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setFile(e.target.files[0])} />
            <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium">{file ? file.name : 'Upload photo'}</p>
          </label>
          <textarea className="input min-h-[100px] text-xs font-mono" placeholder="Or paste prescription text..." value={text} onChange={(e) => setText(e.target.value)} />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button onClick={scan} disabled={loading || (!file && !text)} className="btn-primary w-full">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning with AI</> : 'Scan prescription'}
          </button>
        </div>

        <div className="card min-h-[280px]">
          {!result ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400">
              <FileScan className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Upload or paste a prescription to analyze</p>
            </div>
          ) : (
            <div className="space-y-3">
              <span className="badge bg-purple-100 text-purple-700">{result.document_type}</span>
              <p className="text-sm">{result.summary}</p>
              <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{result.plain_language}</p>
              {result.engine && <p className="text-[10px] text-slate-400">{result.engine}</p>}
              {result.medicines?.length > 0 && (
                <button onClick={() => { addMedicationsFromPrescription(result.suggested_reminders); navigate('/app/medications'); }} className="btn-primary w-full text-sm">
                  Sync to reminders <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { Phone, Cpu, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

export default function AppHeader() {
  const { user } = useAuth();
  const { llmStatus, syncError } = useData();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-slate-100 px-4 md:px-6 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-slate-900">{greeting}, {user?.name?.split(' ')[0]}</h1>
          {llmStatus && (
            <p className={`text-[11px] flex items-center gap-1 mt-0.5 ${llmStatus.ready ? 'text-accent-600' : 'text-amber-600'}`}>
              {llmStatus.ready ? (
                <><Cpu className="w-3 h-3" /> AI live: {llmStatus.provider}{llmStatus.model ? ` (${llmStatus.model})` : ''}</>
              ) : (
                <><AlertCircle className="w-3 h-3" /> AI offline — check internet or install Ollama</>
              )}
            </p>
          )}
          {syncError && (
            <p className="text-[11px] text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {syncError}</p>
          )}
        </div>
        <a href="tel:1122" className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 shrink-0">
          <Phone className="w-3.5 h-3.5" /> 1122
        </a>
      </div>
    </header>
  );
}

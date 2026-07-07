import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Bot, Send, Loader2 } from 'lucide-react';
import { apiChat } from '../../api/client';
import PageHeader from '../../components/app/PageHeader';

export default function Assistant() {
  const location = useLocation();
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Ask me about health topics, facilities, or your condition.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const prefilled = useRef(false);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => {
    if (location.state?.prefilledQuestion && !prefilled.current) {
      prefilled.current = true;
      setInput(location.state.prefilledQuestion);
    }
  }, [location.state]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const data = await apiChat(msg);
      setMessages((m) => [...m, { role: 'bot', text: data.reply, disclaimer: data.disclaimer }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'bot', text: e.message || 'Could not process that. Check that Ollama or Gemini is configured.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-10rem)]">
      <PageHeader icon={Bot} title="Health Assistant" flowStep="Assistant" compact />

      <div className="flex-1 card flex flex-col overflow-hidden !p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                {m.text}
                {m.disclaimer && <p className="text-[10px] text-slate-400 mt-1 italic">{m.disclaimer}</p>}
              </div>
            </div>
          ))}
          {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
          <div ref={endRef} />
        </div>
        <div className="p-3 border-t flex gap-2">
          <input className="input flex-1" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Ask a question" />
          <button onClick={() => send()} disabled={loading} className="btn-primary !px-3"><Send className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}

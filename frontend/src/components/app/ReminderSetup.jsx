import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Bell, BellRing, Smartphone, Copy, Check, Loader2, Zap, ExternalLink, Calendar,
} from 'lucide-react';
import {
  apiNotificationStatus,
  apiTestNotification,
  apiSendNotificationNow,
} from '../../api/client';
import {
  subscribeWebPush,
  requestNotificationPermission,
  showLocalNotification,
  syncMedsToServiceWorker,
  googleCalendarUrl,
} from '../../utils/notifications';

export default function ReminderSetup({ medications }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [pushState, setPushState] = useState('idle');
  const [testMsg, setTestMsg] = useState('');

  const load = async () => {
    try {
      setStatus(await apiNotificationStatus());
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (medications?.length) syncMedsToServiceWorker(medications);
  }, [medications]);

  const copyTopic = () => {
    if (!status?.topic) return;
    navigator.clipboard.writeText(status.topic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const enablePush = async () => {
    setPushState('loading');
    try {
      const perm = await requestNotificationPermission();
      if (perm !== 'granted') {
        setPushState('denied');
        return;
      }
      await subscribeWebPush();
      setPushState('ok');
      load();
    } catch {
      setPushState('error');
    }
  };

  const sendTest = async (delay) => {
    setTesting(true);
    setTestMsg('');
    try {
      if (delay === 0) {
        await apiSendNotificationNow();
        showLocalNotification('HealthHub', 'Reminder sent to your phone!');
        setTestMsg('Sent! Check your ntfy app.');
      } else {
        const r = await apiTestNotification(delay);
        setTestMsg(`Reminder in ${delay}s: "${r.body}"`);
        showLocalNotification('Scheduled', `You will get a push in ${delay} seconds`);
      }
    } catch (e) {
      setTestMsg(e.message);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="card flex items-center gap-2 text-sm text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading reminders...
      </div>
    );
  }

  const topic = status?.topic || '';
  const nextMed = medications?.find((m) => !m.taken);

  return (
    <div className="card border-brand-100 bg-gradient-to-br from-brand-50/50 to-white space-y-4 mb-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0">
          <BellRing className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Phone reminders (free)</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Get buzzed on your phone when it is time to take medicine — even if the app is closed.
          </p>
        </div>
      </div>

      {/* Step 1: ntfy — best for judge demo */}
      <div className="rounded-xl bg-white border border-slate-100 p-4 space-y-3">
        <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide flex items-center gap-1">
          <Smartphone className="w-3.5 h-3.5" /> Step 1 — Install ntfy (30 sec)
        </p>
        <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
          <li>Install <strong>ntfy</strong> from Play Store / App Store (free)</li>
          <li>Open app → tap <strong>+</strong> → Subscribe to topic</li>
          <li>Paste your topic below and subscribe</li>
        </ol>

        <div className="flex flex-wrap items-center gap-2">
          <code className="text-sm font-mono bg-slate-100 px-3 py-1.5 rounded-lg flex-1 min-w-0 truncate">{topic}</code>
          <button type="button" onClick={copyTopic} className="text-xs font-medium flex items-center gap-1 bg-brand-50 text-brand-700 px-3 py-1.5 rounded-lg">
            {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <QRCodeSVG value={`https://ntfy.sh/${topic}`} size={100} level="M" className="shrink-0" />
          <div className="flex-1 space-y-2 w-full">
            <a
              href={status?.ntfy_app || 'https://ntfy.sh/app'}
              target="_blank"
              rel="noreferrer"
              className="btn-primary w-full text-sm !py-2 flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" /> Get ntfy app
            </a>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" disabled={testing} onClick={() => sendTest(0)} className="text-xs font-semibold bg-accent-600 text-white py-2 rounded-lg hover:bg-accent-700 disabled:opacity-50 flex items-center justify-center gap-1">
                {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />} Send now
              </button>
              <button type="button" disabled={testing} onClick={() => sendTest(10)} className="text-xs font-semibold bg-brand-100 text-brand-700 py-2 rounded-lg hover:bg-brand-200 disabled:opacity-50">
                Test in 10 sec
              </button>
            </div>
            {testMsg && <p className="text-xs text-accent-700 font-medium">{testMsg}</p>}
          </div>
        </div>
      </div>

      {/* Step 2: Web Push PWA */}
      <div className="rounded-xl bg-white border border-slate-100 p-4 space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
          <Bell className="w-3.5 h-3.5" /> Step 2 — Browser push (optional)
        </p>
        <p className="text-xs text-slate-500">Add HealthHub to home screen, then enable push for Chrome/Safari notifications.</p>
        <button
          type="button"
          onClick={enablePush}
          disabled={pushState === 'loading'}
          className="text-xs font-semibold border border-brand-200 text-brand-700 px-4 py-2 rounded-lg hover:bg-brand-50"
        >
          {pushState === 'loading' ? 'Enabling...' : pushState === 'ok' ? 'Push enabled' : 'Enable browser push'}
        </button>
      </div>

      {nextMed && (
        <a
          href={googleCalendarUrl(nextMed)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-xs text-slate-600 hover:text-brand-600"
        >
          <Calendar className="w-3.5 h-3.5" />
          Add &quot;{nextMed.name}&quot; to Google Calendar with alarm
        </a>
      )}

      <p className="text-[10px] text-slate-400">
        Backend checks every 30s and sends push at your medicine time. Twice-daily meds get a second alert 12h later.
      </p>
    </div>
  );
}

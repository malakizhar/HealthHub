import { Link } from 'react-router-dom';
import { Stethoscope, Bot, Pill, FileScan, Users, Siren, Droplets, Calendar, ArrowRight, Route } from 'lucide-react';
import PageHero from '../../components/website/PageHero';
import SmartImage from '../../components/website/SmartImage';
import { IMAGES } from '../../data/images';

const FLOW = [
  { step: 1, icon: Stethoscope, title: 'AI Symptom Checker', desc: 'Describe symptoms. AI classifies urgency and recommends Peshawar facilities — LRH, KTH, Hayatabad, or local BHUs.', connects: 'Routes to Queue & Appointments', image: IMAGES.doctor },
  { step: 2, icon: Users, title: 'Hospital Queue', desc: 'Join live queue at Lady Reading or Khyber Teaching Hospital. Token saved to your dashboard with real-time wait updates.', connects: 'Peshawar hospitals only', image: IMAGES.queue },
  { step: 3, icon: Calendar, title: 'Appointments', desc: 'Book follow-up visits at your triage-recommended Peshawar hospital. Tracked on your activity timeline.', connects: 'Linked from triage', image: IMAGES.hospital },
  { step: 4, icon: Bot, title: 'Health Assistant', desc: 'Ask follow-up questions about your condition — dengue, diabetes, maternal care — in plain language.', connects: 'AI powered chat', image: IMAGES.ai },
  { step: 5, icon: FileScan, title: 'Prescription Scanner', desc: 'Photo or paste your prescription. AI extracts medicines and explains them simply. One tap syncs to reminders.', connects: 'Syncs to Medications', image: IMAGES.pharmacy },
  { step: 6, icon: Pill, title: 'Medicine Reminders', desc: 'Set dose times and get push notifications on your phone via ntfy — even when the app is closed.', connects: 'Phone alerts', image: IMAGES.patient },
  { step: 7, icon: Siren, title: 'Emergency Profile', desc: 'QR code with blood group, allergies, conditions, and contacts. Medicines auto-sync from your reminder list.', connects: 'Rescue 1122 ready', image: IMAGES.emergency },
  { step: 8, icon: Droplets, title: 'Blood Donation', desc: 'Find donors or request blood in Peshawar. Uses your emergency profile blood group automatically.', connects: 'Peshawar donor network', image: IMAGES.blood },
];

export default function Features() {
  return (
    <>
      <PageHero
        image={IMAGES.ai}
        badge="8 connected modules"
        title="Your complete"
        highlight="care flow"
        subtitle="Every module feeds the next. Complete one step and the dashboard guides you forward."
        primaryCta="Start free"
        primaryTo="/register"
        imageAlt="AI-powered healthcare technology"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="card-hover mb-12 flex flex-col md:flex-row items-center gap-6 !p-0 overflow-hidden">
          <SmartImage src={IMAGES.hospital} alt="HealthHub dashboard preview" className="w-full md:w-72 h-48 md:h-auto object-cover shrink-0" />
          <div className="p-6 md:p-8">
            <Route className="w-10 h-10 text-brand-600 mb-3" />
            <h3 className="text-xl font-bold mb-2">One dashboard, full journey</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Care progress, pending steps, live queue token, triage history, and activity timeline — all in one place.</p>
          </div>
        </div>

        <div className="space-y-8">
          {FLOW.map(({ step, icon: Icon, title, desc, connects, image }) => (
            <div key={title} className="card-hover overflow-hidden !p-0 group">
              <div className="grid md:grid-cols-5 gap-0">
                <div className="md:col-span-2 image-card h-48 md:h-auto min-h-[180px]">
                  <SmartImage src={image} alt={title} className="w-full h-full object-cover" />
                </div>
                <div className="md:col-span-3 p-6 md:p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">{step}</span>
                    <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold mb-2">{title}</h2>
                  <p className="text-slate-500 leading-relaxed mb-3 text-sm">{desc}</p>
                  <span className="self-start text-xs font-semibold bg-accent-50 text-accent-700 px-3 py-1 rounded-full">{connects}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link to="/register" className="btn-primary text-base px-8 py-3">Start the care flow <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </div>
    </>
  );
}

import { Link } from 'react-router-dom';
import { ArrowRight, Stethoscope, Bot, Pill, FileScan, Users, Siren, Droplets, Calendar, Shield, CheckCircle2, Route, MapPin } from 'lucide-react';
import PageHero from '../../components/website/PageHero';
import SmartImage from '../../components/website/SmartImage';
import { IMAGES } from '../../data/images';

const FEATURES = [
  { icon: Stethoscope, title: 'AI Symptom Checker', desc: 'Intelligent triage for Peshawar facilities', image: IMAGES.doctor },
  { icon: Users, title: 'Hospital Queue', desc: 'Live tokens at LRH, KTH & Hayatabad', image: IMAGES.queue },
  { icon: Calendar, title: 'Appointments', desc: 'Book follow-ups at Peshawar hospitals', image: IMAGES.hospital },
  { icon: FileScan, title: 'Prescription Scanner', desc: 'AI reads Urdu/English prescriptions', image: IMAGES.pharmacy },
  { icon: Pill, title: 'Medicine Reminders', desc: 'Phone push alerts when dose is due', image: IMAGES.patient },
  { icon: Bot, title: 'Health Assistant', desc: 'Ask about dengue, diabetes & more', image: IMAGES.ai },
  { icon: Siren, title: 'Emergency Profile', desc: 'QR medical ID for Rescue 1122', image: IMAGES.emergency },
  { icon: Droplets, title: 'Blood Donation', desc: 'Donor network across Peshawar', image: IMAGES.blood },
];

export default function Home() {
  return (
    <>
      <PageHero
        image={IMAGES.hero}
        imageAlt="Modern healthcare technology in Pakistan"
        badge={<><Shield className="w-3.5 h-3.5" /> Peshawar · Healthcare Access · Pakistan</>}
        title="Healthcare for"
        highlight="Peshawar"
        subtitle="One connected platform from symptom check to hospital queue, prescriptions, and emergency care — built for Khyber Pakhtunkhwa."
        primaryCta="Get started free"
        primaryTo="/register"
        secondaryCta="Explore features"
        secondaryTo="/features"
        tall
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { n: '8', l: 'Connected modules' },
            { n: '5+', l: 'Peshawar hospitals' },
            { n: '1122', l: 'Rescue line' },
            { n: 'Live', l: 'Queue & AI' },
          ].map((s) => (
            <div key={s.l} className="card-hover text-center !p-5 bg-white">
              <div className="text-2xl md:text-3xl font-extrabold gradient-text">{s.n}</div>
              <div className="text-xs md:text-sm text-slate-500 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need, <span className="gradient-text">connected</span></h2>
          <p className="text-slate-500 max-w-2xl mx-auto">Interactive modules that share data — not isolated tools.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc, image }) => (
            <div key={title} className="card-hover group overflow-hidden !p-0">
              <div className="image-card h-36">
                <SmartImage src={image} alt={title} className="group-hover:scale-110 transition duration-500 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
                <div className="absolute bottom-3 left-3 w-10 h-10 rounded-xl bg-white/90 text-brand-600 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold mb-1">{title}</h3>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-20 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative rounded-3xl overflow-hidden shadow-lift group">
              <SmartImage src={IMAGES.hospital} alt="Peshawar hospital corridor" className="w-full h-80 object-cover group-hover:scale-105 transition duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-900/60 to-transparent" />
              <div className="absolute bottom-6 left-6 text-white">
                <MapPin className="w-5 h-5 mb-2" />
                <p className="font-bold text-lg">Serving Peshawar</p>
                <p className="text-sm text-blue-100">Lady Reading · KTH · Hayatabad · BHUs</p>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-6">The HealthHub care flow</h2>
              <div className="space-y-4">
                {[
                  { icon: Stethoscope, title: 'Check symptoms', desc: 'AI triage routes you to the right Peshawar facility' },
                  { icon: Route, title: 'Join queue', desc: 'Get a live token at LRH or KTH — no more waiting blind' },
                  { icon: FileScan, title: 'Scan prescription', desc: 'Upload a photo — AI explains your medicines in plain language' },
                  { icon: Siren, title: 'Stay protected', desc: 'Emergency QR profile always ready for Rescue 1122' },
                ].map(({ icon: Icon, title, desc }, i) => (
                  <div key={title} className="flex gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-brand-50 transition cursor-default">
                    <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 font-bold text-sm">{i + 1}</div>
                    <div>
                      <h3 className="font-bold flex items-center gap-2"><Icon className="w-4 h-4 text-brand-600" /> {title}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative rounded-3xl overflow-hidden shadow-lift">
          <SmartImage src={IMAGES.doctor} alt="Doctor consultation in Peshawar" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-900/95 via-brand-800/90 to-indigo-900/85" />
          <div className="relative p-8 md:p-14 text-white text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to start your care journey?</h2>
            <p className="text-blue-100 mb-8 max-w-xl mx-auto">Free for all Pakistanis. Built for Peshawar hospitals and BHUs.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register" className="bg-white text-brand-700 font-bold px-8 py-3 rounded-xl hover:bg-blue-50 transition shadow-lg">Create account</Link>
              <Link to="/login" className="border-2 border-white/40 font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition">Demo login</Link>
            </div>
            <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-blue-200">
              {['Symptom to queue', 'Rx to reminders', 'Phone alerts', 'Emergency QR'].map((t) => (
                <span key={t} className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> {t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

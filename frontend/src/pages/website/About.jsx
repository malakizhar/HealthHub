import { Heart, Target, Users, Award, MapPin } from 'lucide-react';
import PageHero from '../../components/website/PageHero';
import SmartImage from '../../components/website/SmartImage';
import { IMAGES } from '../../data/images';

const VALUES = [
  { icon: Target, title: 'The problem', text: 'Peshawar ERs are overcrowded. Patients visit the wrong facility, prescriptions are hard to read, and emergency info is not available when seconds count.', image: IMAGES.emergency },
  { icon: Heart, title: 'Our solution', text: 'One connected platform: AI triage → Peshawar hospital queue → prescription scan → phone reminders → emergency QR. Every step linked.', image: IMAGES.patient },
  { icon: Users, title: 'Our team', text: 'Team 3 — Najeeb Ullah. Track 3 Healthcare Access. AI Hackathon Civic Innovation Challenge, Pakistan.', image: IMAGES.team },
  { icon: Award, title: 'Local impact', text: 'Routes patients to LRH, KTH, and Hayatabad efficiently. Reduces ER load, improves BHU use, and speeds emergency response.', image: IMAGES.hospital },
];

export default function About() {
  return (
    <>
      <PageHero
        image={IMAGES.team}
        imageAlt="HealthHub team collaborating on healthcare access"
        badge="About HealthHub AI"
        title="Healthcare access for"
        highlight="Peshawar"
        subtitle="We connect symptom checking, hospital queues, prescriptions, and emergency care into one journey — designed for real patients in Khyber Pakhtunkhwa."
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="card-hover mb-12 overflow-hidden !p-0">
          <div className="grid md:grid-cols-2">
            <SmartImage src={IMAGES.peshawar} alt="Hospital care in Peshawar" className="h-64 md:h-full object-cover min-h-[240px] w-full" />
            <div className="p-8 md:p-10">
              <h2 className="text-2xl font-bold mb-4">Our mission</h2>
              <p className="text-slate-600 leading-relaxed">
                Pakistan faces a healthcare access crisis — and Peshawar is no exception. Long ER waits at Lady Reading Hospital,
                language barriers on prescriptions, and no single place to manage your care journey. HealthHub AI connects
                symptom triage to the right Peshawar facility, live hospital queues, AI prescription reading, phone medicine
                reminders, and an emergency QR profile for Rescue 1122.
              </p>
              <div className="flex items-center gap-2 mt-6 text-brand-600 font-semibold text-sm">
                <MapPin className="w-4 h-4" /> Focused on Peshawar · KP · Pakistan
              </div>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {VALUES.map(({ icon: Icon, title, text, image }) => (
            <div key={title} className="card-hover group overflow-hidden !p-0">
              <div className="image-card h-44">
                <SmartImage src={image} alt={title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/90 text-brand-600 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-lg">{title}</h3>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed p-5">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

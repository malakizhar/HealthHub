import { Mail, Phone, MapPin, Send, CheckCircle2, Clock } from 'lucide-react';
import { useState } from 'react';
import PageHero from '../../components/website/PageHero';
import SmartImage from '../../components/website/SmartImage';
import { IMAGES } from '../../data/images';

export default function Contact() {
  const [sent, setSent] = useState(false);

  return (
    <>
      <PageHero
        image={IMAGES.contact}
        badge="Get in touch"
        title="Contact"
        highlight="HealthHub"
        subtitle="Questions about the platform, Peshawar hospital integration, or the hackathon project? We would love to hear from you."
        imageAlt="Contact HealthHub AI support team"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-5">
            {[
              { icon: Mail, label: 'Email', value: 'najeeb@healthhub.pk', sub: 'Project inquiries' },
              { icon: Phone, label: 'Emergency', value: '1122 (Rescue Peshawar)', sub: 'Always call for emergencies' },
              { icon: MapPin, label: 'Location', value: 'Peshawar, KPK', sub: 'Serving KP healthcare' },
              { icon: Clock, label: 'Support', value: 'Mon – Sat, 9 AM – 6 PM', sub: 'PST' },
            ].map(({ icon: Icon, label, value, sub }) => (
              <div key={label} className="card-hover flex items-center gap-4 !p-5 group">
                <div className="w-12 h-12 rounded-2xl gradient-hero text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">{label}</div>
                  <div className="font-semibold text-slate-900">{value}</div>
                  <div className="text-xs text-slate-500">{sub}</div>
                </div>
              </div>
            ))}

            <div className="rounded-2xl overflow-hidden shadow-soft h-48">
              <SmartImage src={IMAGES.hospital} alt="Peshawar hospital facility" className="w-full h-full object-cover" />
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="card-hover !p-6 md:!p-8 space-y-4">
            {sent ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-14 h-14 text-brand-500 mx-auto mb-4" />
                <h3 className="font-bold text-xl">Message sent!</h3>
                <p className="text-sm text-slate-500 mt-2">We will get back to you soon.</p>
              </div>
            ) : (
              <>
                <h3 className="font-bold text-lg mb-2">Send a message</h3>
                <div><label className="label">Name</label><input className="input" required placeholder="Your name" /></div>
                <div><label className="label">Email</label><input className="input" type="email" required placeholder="you@email.com" /></div>
                <div><label className="label">Message</label><textarea className="input min-h-[140px]" required placeholder="How can we help?" /></div>
                <button type="submit" className="btn-primary w-full"><Send className="w-4 h-4" /> Send message</button>
              </>
            )}
          </form>
        </div>
      </div>
    </>
  );
}

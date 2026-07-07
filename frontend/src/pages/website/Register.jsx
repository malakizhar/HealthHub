import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PageHero from '../../components/website/PageHero';
import { LogoMark } from '../../components/website/Logo';
import { IMAGES } from '../../data/images';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('Najeeb Ullah');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    register(name, email, password);
    navigate('/app');
  };

  return (
    <>
      <PageHero
        image={IMAGES.register}
        imageAlt="Patient registering for healthcare services"
        badge="Free for everyone"
        title="Join"
        highlight="HealthHub"
        subtitle="Create your account and start your connected healthcare journey in Peshawar."
      />

      <div className="max-w-md mx-auto px-4 -mt-8 relative z-10 pb-16">
        <form onSubmit={handleSubmit} className="card-hover shadow-lift !p-6 md:!p-8 space-y-4 bg-white">
          <div className="mx-auto -mt-12 mb-2 border-4 border-white shadow-md rounded-2xl">
            <LogoMark size={48} />
          </div>
          <div><label className="label">Full name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div><label className="label">Email</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@email.com" /></div>
          <div><label className="label">Password</label><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></div>
          <button type="submit" className="btn-primary w-full"><UserPlus className="w-4 h-4" /> Create account</button>
          <p className="text-center text-sm text-slate-500">
            Already have an account? <Link to="/login" className="text-brand-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </>
  );
}

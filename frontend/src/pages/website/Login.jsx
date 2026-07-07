import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { LogIn, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PageHero from '../../components/website/PageHero';
import { LogoMark } from '../../components/website/Logo';
import { IMAGES } from '../../data/images';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('demo@healthhub.pk');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      login(email, password);
      navigate('/app');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <PageHero
        image={IMAGES.login}
        badge={<><Shield className="w-3.5 h-3.5" /> Secure login</>}
        title="Welcome"
        highlight="back"
        subtitle="Access your Peshawar healthcare dashboard — triage, queue, prescriptions & more."
        imageAlt="Secure healthcare login"
        tall={false}
      />

      <div className="max-w-md mx-auto px-4 -mt-8 relative z-10 pb-16">
        <form onSubmit={handleSubmit} className="card-hover shadow-lift !p-6 md:!p-8 space-y-4 bg-white">
          <div className="mx-auto -mt-12 mb-2 border-4 border-white shadow-md rounded-2xl">
            <LogoMark size={48} />
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</div>}
          <div className="bg-brand-50 text-brand-700 text-xs p-3 rounded-xl text-center">
            <strong>Demo:</strong> demo@healthhub.pk / demo123
          </div>
          <div><label className="label">Email</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div><label className="label">Password</label><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          <button type="submit" className="btn-primary w-full"><LogIn className="w-4 h-4" /> Sign in</button>
          <p className="text-center text-sm text-slate-500">
            No account? <Link to="/register" className="text-brand-600 font-semibold hover:underline">Register free</Link>
          </p>
        </form>
      </div>
    </>
  );
}

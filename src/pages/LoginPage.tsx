import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShuttleStore } from '@/store/shuttleStore';
import { Bus, Eye, EyeOff, Lock } from 'lucide-react';

export default function LoginPage() {
  const [binusId, setBinusId] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const login = useShuttleStore((s) => s.login);
  const navigate = useNavigate();

  const handleLogin = () => {
    login();
    navigate('/home');
  };

  return (
    <div className="flex flex-col min-h-screen px-6 pt-16 pb-8">
      <div className="flex items-center justify-center gap-2 mb-12">
        <Bus className="w-8 h-8 text-primary" />
        <div className="flex items-baseline gap-1">
          <span className="text-h1 text-ink font-extrabold tracking-tight">BINUS</span>
          <span className="text-h1 text-primary font-bold">Shuttle</span>
        </div>
      </div>

      <h2 className="text-h1 text-ink mb-1">Selamat Datang</h2>
      <p className="text-body text-ink-light mb-8">Masuk dengan Binus ID kamu</p>

      <div className="space-y-4 flex-1">
        <div>
          <label className="text-caption font-semibold text-ink-light mb-1.5 block">Binus ID / Email</label>
          <input
            value={binusId}
            onChange={(e) => setBinusId(e.target.value)}
            placeholder="e.g. arya.kusuma@binus.ac.id"
            className="w-full h-12 px-4 rounded-xl border border-border bg-card text-body text-ink placeholder:text-ink-light/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="text-caption font-semibold text-ink-light mb-1.5 block">Password</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-12 px-4 pr-12 rounded-xl border border-border bg-card text-body text-ink placeholder:text-ink-light/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-light">
              {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={!binusId || !password}
          className={`w-full h-12 rounded-xl font-semibold text-body mt-4 transition-all active:scale-[0.98] ${
            binusId && password
              ? 'gradient-orange text-primary-foreground shadow-card'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          Masuk
        </button>
      </div>

      <p className="text-caption text-ink-light text-center mt-8 flex items-center justify-center gap-1.5">
        <Lock className="w-3.5 h-3.5" /> Secured by BinusMaya SSO
      </p>
    </div>
  );
}

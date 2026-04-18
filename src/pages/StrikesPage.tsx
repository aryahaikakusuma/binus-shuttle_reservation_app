import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShuttleStore, Strike, StrikeStatus } from '@/store/shuttleStore';
import { ArrowLeft, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

const STATUS_LABELS: Record<StrikeStatus, string> = {
  aktif: 'Aktif',
  selesai: 'Selesai',
  dalam_peninjauan: 'Dalam Peninjauan',
  dicabut: 'Dicabut',
};

const STATUS_PILL: Record<StrikeStatus, string> = {
  aktif: 'bg-destructive/10 text-destructive',
  selesai: 'bg-muted text-ink-light',
  dalam_peninjauan: 'bg-primary/10 text-primary',
  dicabut: 'bg-success/10 text-success',
};

const REASON_LABELS = {
  no_show: 'No-show — tidak hadir tanpa pembatalan',
  late_cancellation: 'Pembatalan terlambat — cancel setelah batas H-1',
};

function canAppeal(strike: Strike): boolean {
  if (strike.status === 'dalam_peninjauan' || strike.status === 'dicabut') return false;
  return true;
}

function StrikeCard({ strike, onAppeal }: { strike: Strike; onAppeal: (id: string) => void }) {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-card border-l-4 border-l-destructive/50">
      <div className="flex items-center justify-between mb-2">
        <p className="text-body font-bold text-ink">Strike #{strike.number}</p>
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${STATUS_PILL[strike.status]}`}>
          {STATUS_LABELS[strike.status]}
        </span>
      </div>

      <div className="space-y-1.5 text-caption text-ink-light">
        <p>
          <span className="font-medium text-ink">Tanggal: </span>
          {strike.date}
        </p>
        <p>
          <span className="font-medium text-ink">Rute: </span>
          {strike.bookingRoute}
        </p>
        <p>
          <span className="font-medium text-ink">Jadwal: </span>
          {strike.bookingDate} · {strike.bookingTime}
        </p>
        <p>
          <span className="font-medium text-ink">Alasan: </span>
          {REASON_LABELS[strike.reason]}
        </p>
        <p>
          <span className="font-medium text-ink">Suspensi: </span>
          {strike.suspensionStart} – {strike.suspensionEnd}
        </p>
      </div>

      {canAppeal(strike) && (
        <button
          onClick={() => onAppeal(strike.id)}
          className="mt-3 w-full h-9 rounded-xl border-2 border-primary text-primary text-caption font-semibold hover:bg-primary/5 active:scale-[0.98] transition-all"
        >
          Ajukan Banding
        </button>
      )}
    </div>
  );
}

function StrikeCardDimmed({ strike }: { strike: Strike }) {
  return (
    <div className="bg-card/60 rounded-2xl p-4 shadow-card opacity-70">
      <div className="flex items-center justify-between mb-2">
        <p className="text-body font-bold text-ink-light">Strike #{strike.number}</p>
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${STATUS_PILL[strike.status]}`}>
          {STATUS_LABELS[strike.status]}
        </span>
      </div>
      <div className="space-y-1 text-caption text-ink-light">
        <p>{strike.bookingRoute}</p>
        <p>{strike.bookingDate} · {strike.bookingTime}</p>
        <p>{REASON_LABELS[strike.reason]}</p>
      </div>
    </div>
  );
}

export default function StrikesPage() {
  const navigate = useNavigate();
  const { user, strikeHistory, isSuspended, getSuspensionEnd } = useShuttleStore();
  const [tab, setTab] = useState<'running' | 'history'>('running');

  const suspended = isSuspended();
  const suspendedUntil = getSuspensionEnd();

  const runningStrikes = strikeHistory.filter(
    (s) => s.status === 'aktif' || s.status === 'selesai' || s.status === 'dalam_peninjauan'
  );
  const historyStrikes = strikeHistory.filter(
    (s) => s.status === 'dicabut' || s.status === 'selesai'
  );

  const handleAppeal = (strikeId: string) => {
    navigate(`/appeal/${strikeId}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-5 pt-10 pb-4">
        <button onClick={() => navigate('/profile')} className="text-ink mb-3">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-h1 text-ink">Riwayat Strike</h1>
      </div>

      {/* Status card */}
      <div className="mx-5 mb-5">
        {suspended ? (
          <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-destructive animate-pulse" />
              </div>
              <div>
                <p className="text-body font-bold text-destructive">Akun Tersuspensi</p>
                <p className="text-caption text-destructive/80">
                  Akun Anda di-suspend hingga <span className="font-bold">{suspendedUntil}</span>.
                </p>
              </div>
            </div>
            <p className="text-caption text-destructive/70">
              Anda tidak dapat memesan shuttle selama masa suspensi.
            </p>
          </div>
        ) : user.activeStrikes > 0 ? (
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-body font-bold text-ink">
                  {user.activeStrikes} Strike Aktif
                </p>
                <p className="text-caption text-ink-light">
                  Strike akan di-reset setelah 1 minggu perilaku patuh.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-success/10 border border-success/20 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-body font-bold text-success">Tidak Ada Strike Aktif</p>
                <p className="text-caption text-ink-light">Akun Anda dalam kondisi baik.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex px-5 gap-2 mb-4">
        {(['running', 'history'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-body font-semibold transition-colors ${
              tab === t
                ? 'gradient-orange text-primary-foreground'
                : 'bg-card text-ink-light border border-border'
            }`}
          >
            {t === 'running' ? 'Running Strike' : 'Riwayat'}
          </button>
        ))}
      </div>

      <div className="px-5 space-y-3 pb-6">
        {tab === 'running' ? (
          runningStrikes.length === 0 ? (
            <p className="text-center text-ink-light text-body py-12">Tidak ada running strike</p>
          ) : (
            runningStrikes.map((s) => (
              <StrikeCard key={s.id} strike={s} onAppeal={handleAppeal} />
            ))
          )
        ) : (
          historyStrikes.length === 0 ? (
            <p className="text-center text-ink-light text-body py-12">Riwayat strike kosong</p>
          ) : (
            historyStrikes.map((s) => <StrikeCardDimmed key={s.id} strike={s} />)
          )
        )}
      </div>
    </div>
  );
}

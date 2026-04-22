import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShuttleStore } from '@/store/shuttleStore';
import { ArrowLeft, ChevronRight } from 'lucide-react';

export default function BookingsPage() {
  const navigate = useNavigate();
  const { bookings } = useShuttleStore();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const upcoming = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'waitlisted'
  );
  const past = bookings.filter(
    (b) => b.status !== 'confirmed' && b.status !== 'waitlisted'
  );

  const list = tab === 'upcoming' ? upcoming : past;

  const statusColor = (s: string) => {
    switch (s) {
      case 'confirmed': return 'bg-success/10 text-success';
      case 'completed': return 'bg-secondary/10 text-secondary';
      case 'cancelled': return 'bg-destructive/10 text-destructive';
      case 'no-show': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const statusLabel = (s: string) => {
    if (s === 'waitlisted') return 'Waitlist';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const waitlistPill: React.CSSProperties = {
    backgroundColor: '#F59E0B1A',
    color: '#92400E',
  };

  return (
    <div className="flex flex-col">
      <div className="px-5 pt-10 pb-4">
        <h1 className="text-h1 text-ink">Pemesanan Saya</h1>
      </div>

      {/* Tabs */}
      <div className="flex px-5 gap-2 mb-4">
        {(['upcoming', 'past'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-body font-semibold transition-colors ${
              tab === t ? 'gradient-orange text-primary-foreground' : 'bg-card text-ink-light border border-border'
            }`}
          >
            {t === 'upcoming' ? 'Upcoming' : 'Past'}
          </button>
        ))}
      </div>

      <div className="px-5 space-y-3">
        {list.map((b) => {
          const isWaitlist = b.status === 'waitlisted';
          return (
            <button
              key={b.id}
              onClick={() => navigate(`/ticket/${b.id}`)}
              className="w-full bg-card rounded-2xl p-4 shadow-card text-left active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-body font-bold text-ink">{b.from} → {b.to}</p>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isWaitlist ? '' : statusColor(b.status)
                  }`}
                  style={isWaitlist ? waitlistPill : undefined}
                >
                  {statusLabel(b.status)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-caption text-ink-light">
                  {b.date} · {b.departure} ·{' '}
                  {isWaitlist
                    ? `Antrian #${b.queuePosition ?? '—'}`
                    : b.isStanding
                    ? 'Standing'
                    : `Seat ${b.seatNumber}`}
                </p>
                <ChevronRight className="w-4 h-4 text-ink-light" />
              </div>
            </button>
          );
        })}
        {list.length === 0 && (
          <p className="text-center text-ink-light text-body py-12">No bookings yet</p>
        )}
      </div>
    </div>
  );
}

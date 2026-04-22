import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useShuttleStore, getArrivalTime, BUS_CONFIGS } from '@/store/shuttleStore';
import { ArrowLeft, Check, X, Clock } from 'lucide-react';

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00';
  const total = Math.floor(ms / 1000);
  const m = String(Math.floor(total / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export default function OfferPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { bookings, acceptOffer, declineOffer, expireOffer } = useShuttleStore();
  const [now, setNow] = useState(Date.now());
  const [expired, setExpired] = useState(false);

  const booking = bookings.find((b) => b.id === id);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!booking || !booking.offerExpiresAt) return;
    if (now >= booking.offerExpiresAt && !expired) {
      setExpired(true);
      expireOffer(booking.id);
    }
  }, [now, booking, expireOffer, expired]);

  if (!booking || booking.status !== 'waitlisted' || !booking.offerExpiresAt) {
    return (
      <div className="flex items-center justify-center min-h-screen flex-col gap-3 px-5">
        <p className="text-ink-light text-body text-center">
          Tawaran tidak tersedia atau sudah berakhir.
        </p>
        <button
          onClick={() => navigate('/bookings')}
          className="px-4 py-2 rounded-xl bg-card border border-border text-body"
        >
          Kembali ke Pemesanan
        </button>
      </div>
    );
  }

  const remaining = booking.offerExpiresAt - now;
  const arrival = getArrivalTime(booking.departure);
  const busLabel = BUS_CONFIGS[booking.busType].label;

  const handleAccept = () => {
    acceptOffer(booking.id);
    navigate(`/ticket/${booking.id}`);
  };

  const handleDecline = () => {
    declineOffer(booking.id);
    navigate('/bookings');
  };

  if (expired) {
    return (
      <div className="flex items-center justify-center min-h-screen flex-col gap-3 px-5">
        <p className="text-body text-ink text-center font-semibold">Waktu habis</p>
        <p className="text-caption text-ink-light text-center">
          Tawaran telah diteruskan ke antrian berikutnya. Anda tetap dalam waitlist di posisi terakhir.
        </p>
        <button
          onClick={() => navigate(`/ticket/${booking.id}`)}
          className="px-4 py-2 rounded-xl bg-card border border-border text-body"
        >
          Lihat Status Waitlist
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-5 pt-10 pb-4">
        <button onClick={() => navigate(-1)} className="text-ink mb-3">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-h1 text-ink">Tawaran Kursi</h1>
        <p className="text-caption text-ink-light mt-1">Konfirmasi sebelum waktu habis</p>
      </div>

      <div className="px-5 space-y-4 flex-1">
        {/* Countdown */}
        <div
          className="rounded-2xl p-5 flex items-center gap-4"
          style={{ backgroundColor: '#F59E0B1A', border: '1px solid #F59E0B4D' }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 animate-pulse"
            style={{ backgroundColor: '#F59E0B', color: 'white' }}
          >
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <p className="text-caption" style={{ color: '#92400E' }}>Sisa waktu konfirmasi</p>
            <p className="text-3xl font-bold tabular-nums" style={{ color: '#92400E' }}>
              {formatCountdown(remaining)}
            </p>
          </div>
        </div>

        {/* Trip */}
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <p className="text-caption text-ink-light mb-2">Detail Perjalanan</p>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-body font-bold text-ink">{booking.from}</span>
            <span className="text-ink-light">→</span>
            <span className="text-body font-bold text-ink">{booking.to}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-caption">
            <div>
              <p className="text-ink-light">Tanggal</p>
              <p className="font-semibold text-ink">{booking.date}</p>
            </div>
            <div>
              <p className="text-ink-light">Waktu</p>
              <p className="font-semibold text-ink">{booking.departure} – {arrival}</p>
            </div>
            <div>
              <p className="text-ink-light">Kendaraan</p>
              <p className="font-semibold text-ink">{busLabel}</p>
            </div>
            <div>
              <p className="text-ink-light">Kursi yang ditawarkan</p>
              <p className="font-semibold text-ink">{booking.offeredSeat ?? '—'}</p>
            </div>
          </div>
        </div>

        <div className="bg-accent/40 rounded-2xl p-4">
          <p className="text-caption text-ink leading-relaxed">
            Jika Anda menerima, kursi akan otomatis dikonfirmasi. Jika menolak atau waktu habis,
            tawaran diteruskan ke peserta waitlist berikutnya.
          </p>
        </div>
      </div>

      <div className="sticky bottom-0 p-5 bg-card shadow-sticky space-y-2">
        <button
          onClick={handleAccept}
          className="w-full h-12 rounded-xl font-semibold text-body text-white bg-success active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          style={{ backgroundColor: '#16A34A' }}
        >
          <Check className="w-5 h-5" /> Terima
        </button>
        <button
          onClick={handleDecline}
          className="w-full h-12 rounded-xl font-semibold text-body border-2 border-destructive text-destructive active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <X className="w-5 h-5" /> Tolak
        </button>
      </div>
    </div>
  );
}

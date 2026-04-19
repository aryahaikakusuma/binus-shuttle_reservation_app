import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useShuttleStore, isPastH1Deadline } from '@/store/shuttleStore';
import { ArrowLeft, X, Smartphone, AlertTriangle } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

export default function TicketPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { bookings, cancelBooking, cancelBookingLate } = useShuttleStore();

  const [showLateWarning, setShowLateWarning] = useState(false);
  const [strikeRecorded, setStrikeRecorded] = useState(false);
  const [newStrikeId, setNewStrikeId] = useState<string | null>(null);

  const booking = bookings.find((b) => b.id === id);

  if (!booking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-ink-light text-body">Tiket tidak ditemukan</p>
      </div>
    );
  }

  const canCancel = booking.status === 'confirmed';
  const pastH1 = isPastH1Deadline(booking);

  const handleCancelTap = () => {
    if (pastH1) {
      setShowLateWarning(true);
    } else {
      cancelBooking(booking.id);
      navigate('/bookings');
    }
  };

  const handleCancelAnyway = () => {
    const sid = cancelBookingLate(booking.id);
    setNewStrikeId(sid);
    setStrikeRecorded(true);
    setShowLateWarning(false);
  };

  const statusStyle = {
    confirmed: 'bg-success/10 text-success',
    completed: 'bg-secondary/10 text-secondary',
    cancelled: 'bg-destructive/10 text-destructive',
    'no-show': 'bg-destructive/10 text-destructive',
  }[booking.status] ?? 'bg-muted text-muted-foreground';

  const statusLabel = {
    confirmed: 'Terkonfirmasi',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
    'no-show': 'Tidak Hadir',
  }[booking.status] ?? booking.status;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-5 pt-10 pb-4">
        <button onClick={() => navigate('/bookings')} className="text-ink mb-3">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-h1 text-ink">Detail Pemesanan</h1>
      </div>

      <div className="px-5 flex-1 space-y-4">
        {/* Strike recorded notice */}
        {strikeRecorded && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-body font-semibold text-destructive">Pembatalan Dicatat</p>
              <p className="text-caption text-destructive/80 mt-0.5">
                1 strike telah ditambahkan ke akun Anda karena pembatalan melewati batas H-1.
              </p>
              {newStrikeId && (
                <button
                  onClick={() => navigate(`/appeal/${newStrikeId}`)}
                  className="mt-2 text-caption text-primary font-semibold underline underline-offset-2"
                >
                  Ajukan Banding →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Ticket card */}
        <div className="relative bg-card rounded-2xl shadow-card overflow-hidden">
          <div className="gradient-header px-5 pt-6 pb-8">
            <p className="text-primary-foreground/70 text-caption mb-1">ID Pemesanan</p>
            <p className="text-primary-foreground font-bold text-lg">{booking.id.toUpperCase()}</p>
          </div>

          <div className="ticket-notch ticket-notch-left" style={{ top: 'calc(140px - 12px)' }} />
          <div className="ticket-notch ticket-notch-right" style={{ top: 'calc(140px - 12px)' }} />
          <div className="border-t-2 border-dashed border-border mx-6" />

          <div className="px-5 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-ink-light">DARI</p>
                <p className="text-body font-bold text-ink">{booking.from}</p>
              </div>
              <div className="text-ink-light font-bold text-lg">→</div>
              <div className="text-right">
                <p className="text-caption text-ink-light">TUJUAN</p>
                <p className="text-body font-bold text-ink">{booking.to}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-caption">
              <div>
                <p className="text-ink-light">Tanggal</p>
                <p className="font-semibold text-ink">{booking.date}</p>
              </div>
              <div>
                <p className="text-ink-light">Waktu</p>
                <p className="font-semibold text-ink">{booking.departure}</p>
              </div>
              <div>
                <p className="text-ink-light">Kursi</p>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  booking.isStanding ? 'bg-secondary/10 text-secondary' : 'bg-accent text-accent-foreground'
                }`}>
                  {booking.isStanding ? 'Berdiri' : booking.seatNumber}
                </span>
              </div>
            </div>

            {/* Boarding instruction — only for upcoming (confirmed) bookings */}
            {booking.status === 'confirmed' && (
              <div className="bg-muted rounded-xl p-3 flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-primary shrink-0" />
                <p className="text-caption text-ink">
                  <span className="font-semibold">Tap Flazz Card</span> pada perangkat EDC saat boarding
                </p>
              </div>
            )}

            <div className="flex justify-center">
              <span className={`px-4 py-1.5 rounded-full text-caption font-bold ${statusStyle}`}>
                {statusLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {canCancel && (
        <div className="sticky bottom-0 p-5 bg-card shadow-sticky">
          <button
            onClick={handleCancelTap}
            className="w-full h-12 rounded-xl border-2 border-destructive text-destructive font-semibold text-body flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <X className="w-5 h-5" /> Batalkan Pemesanan
          </button>
        </div>
      )}

      {/* Late cancellation warning drawer */}
      <Drawer open={showLateWarning} onOpenChange={setShowLateWarning}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> Peringatan Pembatalan Terlambat
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-4">
            <div className="bg-destructive/10 rounded-2xl p-4">
              <p className="text-body text-ink">
                Pembatalan ini melewati batas H-1. Membatalkan sekarang akan mencatat{' '}
                <span className="font-bold text-destructive">1 strike</span> pada akun Anda.
              </p>
            </div>
            <div className="space-y-2">
              <button
                onClick={handleCancelAnyway}
                className="w-full h-12 rounded-xl border-2 border-destructive text-destructive font-semibold text-body active:scale-[0.98] transition-transform"
              >
                Batalkan Tetap (+1 Strike)
              </button>
              <button
                onClick={() => setShowLateWarning(false)}
                className="w-full h-12 rounded-xl border-2 border-border text-ink-light font-semibold text-body active:scale-[0.98] transition-transform"
              >
                Kembali (Pertahankan Pemesanan)
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* After-strike appeal offer */}
      <Drawer open={strikeRecorded && booking.status === 'cancelled'} onOpenChange={() => {}}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Strike Dicatat</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-3">
            <p className="text-body text-ink">
              Apakah kondisi ini di luar kendali Anda? Anda dapat mengajukan banding untuk meninjau strike ini.
            </p>
            <button
              onClick={() => newStrikeId && navigate(`/appeal/${newStrikeId}`)}
              className="w-full h-12 rounded-xl gradient-orange text-primary-foreground font-semibold text-body"
            >
              Ya, Ajukan Banding
            </button>
            <button
              onClick={() => navigate('/bookings')}
              className="w-full h-12 rounded-xl border-2 border-border text-ink-light font-semibold text-body"
            >
              Tidak, Kembali ke Pemesanan
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

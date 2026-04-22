import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useShuttleStore, isPastH1Deadline } from '@/store/shuttleStore';
import { ArrowLeft, X, Smartphone, AlertTriangle, Users, Bell } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

export default function TicketPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { bookings, cancelBooking, cancelBookingLate, cancelWaitlist, triggerOffer } = useShuttleStore();

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

  const isWaitlisted = booking.status === 'waitlisted';
  const canCancel = booking.status === 'confirmed' || isWaitlisted;
  const pastH1 = isPastH1Deadline(booking);
  const hasPendingOffer = isWaitlisted && booking.offerExpiresAt != null && booking.offerExpiresAt > Date.now();

  const handleCancelTap = () => {
    if (isWaitlisted) {
      cancelWaitlist(booking.id);
      navigate('/bookings');
      return;
    }
    if (pastH1) {
      setShowLateWarning(true);
    } else {
      cancelBooking(booking.id);
      navigate('/bookings');
    }
  };

  const handleSimulateOffer = () => {
    triggerOffer(booking.id, '2A');
    navigate(`/offer/${booking.id}`);
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
    waitlisted: '',
  }[booking.status] ?? 'bg-muted text-muted-foreground';

  const statusLabel = {
    confirmed: 'Terkonfirmasi',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
    'no-show': 'Tidak Hadir',
    waitlisted: 'Waitlist',
  }[booking.status] ?? booking.status;

  const waitlistPillStyle: React.CSSProperties = {
    backgroundColor: '#F59E0B1A',
    color: '#92400E',
  };

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
                <p className="text-ink-light">{isWaitlisted ? 'Antrian' : 'Kursi'}</p>
                {isWaitlisted ? (
                  <span
                    className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={waitlistPillStyle}
                  >
                    #{booking.queuePosition ?? '—'}
                  </span>
                ) : (
                  <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    booking.isStanding ? 'bg-secondary/10 text-secondary' : 'bg-accent text-accent-foreground'
                  }`}>
                    {booking.isStanding ? 'Berdiri' : booking.seatNumber}
                  </span>
                )}
              </div>
            </div>

            {/* Waitlist position highlight */}
            {isWaitlisted && (
              <div
                className="rounded-xl p-3 flex items-center gap-3"
                style={{ backgroundColor: '#F59E0B1A', border: '1px solid #F59E0B4D' }}
              >
                <Users className="w-5 h-5 shrink-0" style={{ color: '#F59E0B' }} />
                <div className="flex-1">
                  <p className="text-caption" style={{ color: '#92400E' }}>Posisi Antrian</p>
                  <p className="text-body font-bold" style={{ color: '#92400E' }}>
                    #{booking.queuePosition ?? '—'}
                  </p>
                </div>
                {hasPendingOffer && (
                  <button
                    onClick={() => navigate(`/offer/${booking.id}`)}
                    className="text-caption font-semibold px-3 py-1.5 rounded-lg"
                    style={{ backgroundColor: '#F59E0B', color: 'white' }}
                  >
                    Lihat Tawaran
                  </button>
                )}
              </div>
            )}

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
              <span
                className={`px-4 py-1.5 rounded-full text-caption font-bold ${statusStyle}`}
                style={isWaitlisted ? waitlistPillStyle : undefined}
              >
                {statusLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {canCancel && (
        <div className="sticky bottom-0 p-5 bg-card shadow-sticky space-y-2">
          {isWaitlisted && !hasPendingOffer && (
            <button
              onClick={handleSimulateOffer}
              className="w-full h-12 rounded-xl font-semibold text-body text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              style={{ backgroundColor: '#F59E0B' }}
            >
              <Bell className="w-5 h-5" /> Simulasikan Tawaran Kursi
            </button>
          )}
          <button
            onClick={handleCancelTap}
            className="w-full h-12 rounded-xl border-2 border-destructive text-destructive font-semibold text-body flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <X className="w-5 h-5" />
            {isWaitlisted ? 'Keluar dari Waitlist' : 'Batalkan Pemesanan'}
          </button>
          {isWaitlisted && (
            <p className="text-caption text-ink-light text-center">
              Pembatalan waitlist selalu gratis, tidak dikenakan strike.
            </p>
          )}
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

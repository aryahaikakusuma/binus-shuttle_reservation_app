import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShuttleStore, getArrivalTime } from '@/store/shuttleStore';
import { ArrowLeft, CreditCard, AlertCircle, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export default function ConfirmPage() {
  const navigate = useNavigate();
  const { currentBooking, user, confirmBooking } = useShuttleStore();
  const [termsChecked, setTermsChecked] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);

  if (!currentBooking.from || !currentBooking.seat) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-ink-light text-body">Tidak ada pesanan aktif</p>
      </div>
    );
  }

  const isStanding = currentBooking.seat.startsWith('B');
  const arrival = getArrivalTime(currentBooking.time);
  const canConfirm = termsChecked;

  const handleConfirm = () => {
    if (!canConfirm) return;
    const booking = confirmBooking();
    if (booking) navigate('/bookings');
  };

  const strikeStatusColor = user.activeStrikes === 0
    ? 'text-success'
    : user.activeStrikes < 3
    ? 'text-primary'
    : 'text-destructive';

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-5 pt-10 pb-4">
        <button onClick={() => navigate(-1)} className="text-ink mb-3">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-h1 text-ink">Konfirmasi Pemesanan</h1>
      </div>

      <div className="px-5 space-y-4 flex-1">
        {/* Trip summary */}
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <p className="text-caption text-ink-light mb-2">Ringkasan Perjalanan</p>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-body font-bold text-ink">{currentBooking.from}</span>
            <span className="text-ink-light">→</span>
            <span className="text-body font-bold text-ink">{currentBooking.to}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-caption">
            <div>
              <p className="text-ink-light">Tanggal</p>
              <p className="font-semibold text-ink">{currentBooking.date}</p>
            </div>
            <div>
              <p className="text-ink-light">Waktu</p>
              <p className="font-semibold text-ink">{currentBooking.time} – {arrival}</p>
            </div>
            <div>
              <p className="text-ink-light">{isStanding ? 'Mode' : 'Kursi'}</p>
              <p className="font-semibold text-ink">{isStanding ? 'Berdiri' : currentBooking.seat}</p>
            </div>
            <div>
              <p className="text-ink-light">Durasi</p>
              <p className="font-semibold text-ink">1j 15m</p>
            </div>
          </div>
        </div>

        {/* Passenger details */}
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <p className="text-caption text-ink-light mb-2">Data Penumpang</p>
          <p className="text-body font-semibold text-ink">{user.name}</p>
          <p className="text-caption text-ink-light">{user.nim} · {user.level}</p>
          <div className="flex items-center gap-2 mt-3 p-3 bg-muted rounded-xl">
            <CreditCard className="w-5 h-5 text-primary" />
            <span className="text-body font-medium text-ink">{user.flazzCard}</span>
          </div>
        </div>

        {/* Strike status */}
        <div className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-3">
          <AlertCircle className={`w-5 h-5 ${strikeStatusColor}`} />
          <div>
            <p className="text-body font-semibold text-ink">Status Strike</p>
            <p className={`text-caption ${strikeStatusColor}`}>
              {user.activeStrikes} strike aktif —{' '}
              {user.activeStrikes === 0 ? 'Baik' : user.activeStrikes < 3 ? 'Perhatian' : 'Kritis'}
            </p>
          </div>
        </div>

        {/* Terms checkbox */}
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <label className="flex items-start gap-3 cursor-pointer">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={termsChecked}
                onChange={(e) => setTermsChecked(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  termsChecked ? 'gradient-orange border-primary' : 'border-border bg-card'
                }`}
              >
                {termsChecked && (
                  <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            <p className="text-caption text-ink leading-relaxed">
              Saya menyetujui{' '}
              <button
                type="button"
                onClick={() => setPolicyOpen(true)}
                className="text-primary font-semibold underline underline-offset-2"
              >
                Syarat dan Ketentuan
              </button>{' '}
              penggunaan layanan shuttle BINUS, termasuk kebijakan pembatalan dan penalti no-show.
            </p>
          </label>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="sticky bottom-0 p-5 bg-card shadow-sticky">
        {!termsChecked && (
          <p className="text-caption text-ink-light text-center mb-2">
            Centang persetujuan untuk melanjutkan
          </p>
        )}
        <button
          disabled={!canConfirm}
          onClick={handleConfirm}
          className={`w-full h-12 rounded-xl font-semibold text-body transition-all active:scale-[0.98] ${
            canConfirm
              ? 'gradient-orange text-primary-foreground shadow-card'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          Konfirmasi Pesanan
        </button>
      </div>

      {/* Policy sheet */}
      <Sheet open={policyOpen} onOpenChange={setPolicyOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-3xl">
          <SheetHeader className="mb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-h2 text-ink">Kebijakan Layanan Shuttle BINUS</SheetTitle>
              <button onClick={() => setPolicyOpen(false)} className="text-ink-light">
                <X className="w-5 h-5" />
              </button>
            </div>
          </SheetHeader>
          <div className="space-y-4 text-caption text-ink pb-6">
            <PolicyItem
              title="Pembatalan Gratis"
              text="Reservasi bersifat mengikat. Pembatalan gratis jika dilakukan sebelum H-1 (24 jam sebelum keberangkatan)."
            />
            <PolicyItem
              title="Pembatalan Terlambat"
              text="Pembatalan setelah H-1 hingga beberapa jam sebelum keberangkatan: pengguna dapat mengajukan pengecualian dengan bukti pendukung (force majeure)."
            />
            <PolicyItem
              title="Ketidakhadiran (No-Show)"
              text="Ketidakhadiran tanpa pembatalan (no-show) akan dicatat sebagai 1 strike."
            />
            <PolicyItem
              title="Konsekuensi Strike"
              text="Strike 1 = suspensi 1 hari · Strike 2 = suspensi 2 hari · Strike 3 = suspensi 3 hari. Strike di-reset setelah 1 minggu perilaku patuh."
            />
            <PolicyItem
              title="Pengecualian Force Majeure"
              text="Kelas pengganti mendadak, kondisi kesehatan, keadaan darurat lainnya. Memerlukan bukti dan persetujuan administrator."
            />
            <PolicyItem
              title="Verifikasi Boarding"
              text="Verifikasi boarding wajib melalui tap Flazz Card pada perangkat EDC/NFC di titik keberangkatan."
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function PolicyItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
      <div>
        <p className="font-semibold text-ink">{title}</p>
        <p className="text-ink-light mt-0.5">{text}</p>
      </div>
    </div>
  );
}

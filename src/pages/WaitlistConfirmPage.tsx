import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShuttleStore, BUS_CONFIGS, getArrivalTime } from '@/store/shuttleStore';
import { ArrowLeft, AlertCircle, Users, Clock } from 'lucide-react';

export default function WaitlistConfirmPage() {
  const navigate = useNavigate();
  const { currentBooking, user, joinWaitlist, getWaitlistPositionForCurrent } = useShuttleStore();
  const [termsChecked, setTermsChecked] = useState(false);

  if (!currentBooking.from || !currentBooking.to || !currentBooking.time || !currentBooking.busType) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-ink-light text-body">Tidak ada jadwal yang dipilih</p>
      </div>
    );
  }

  const position = getWaitlistPositionForCurrent();
  const arrival = getArrivalTime(currentBooking.time);
  const busLabel = BUS_CONFIGS[currentBooking.busType].label;

  const handleSubmit = () => {
    if (!termsChecked) return;
    const booking = joinWaitlist();
    if (booking) navigate(`/ticket/${booking.id}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-5 pt-10 pb-4">
        <button onClick={() => navigate(-1)} className="text-ink mb-3">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-h1 text-ink">Konfirmasi Waitlist</h1>
        <p className="text-caption text-ink-light mt-1">Jadwal penuh — daftar antrian tersedia</p>
      </div>

      <div className="px-5 space-y-4 flex-1">
        {/* Full schedule warning */}
        <div
          className="rounded-2xl p-4 flex items-start gap-3 border"
          style={{ backgroundColor: '#F59E0B1A', borderColor: '#F59E0B4D' }}
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
          <div>
            <p className="text-body font-semibold" style={{ color: '#92400E' }}>
              Semua kursi telah terisi
            </p>
            <p className="text-caption mt-0.5" style={{ color: '#92400E' }}>
              Anda dapat mendaftar ke waitlist dan akan ditawarkan kursi jika tersedia.
            </p>
          </div>
        </div>

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
              <p className="text-ink-light">Kendaraan</p>
              <p className="font-semibold text-ink">{busLabel}</p>
            </div>
            <div>
              <p className="text-ink-light">Durasi</p>
              <p className="font-semibold text-ink">1j 15m</p>
            </div>
          </div>
        </div>

        {/* Queue position card */}
        <div
          className="rounded-2xl p-4 flex items-center gap-4"
          style={{ backgroundColor: '#F59E0B1A', border: '1px solid #F59E0B4D' }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#F59E0B', color: 'white' }}
          >
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-caption" style={{ color: '#92400E' }}>Posisi Antrian</p>
            <p className="text-2xl font-bold" style={{ color: '#92400E' }}>#{position}</p>
          </div>
        </div>

        {/* Explanation */}
        <div className="bg-card rounded-2xl p-4 shadow-card flex items-start gap-3">
          <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-caption text-ink leading-relaxed">
            Anda akan mendapat notifikasi jika ada kursi yang tersedia. Anda memiliki waktu
            <span className="font-semibold"> 10 menit </span>
            untuk mengonfirmasi setelah menerima tawaran.
          </p>
        </div>

        {/* Passenger */}
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <p className="text-caption text-ink-light mb-2">Data Penumpang</p>
          <p className="text-body font-semibold text-ink">{user.name}</p>
          <p className="text-caption text-ink-light">{user.nim} · {user.level}</p>
        </div>

        {/* Terms */}
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
              Saya memahami bahwa mendaftar waitlist tidak menjamin kursi dan saya wajib
              mengonfirmasi tawaran dalam waktu 10 menit.
            </p>
          </label>
        </div>
      </div>

      <div className="sticky bottom-0 p-5 bg-card shadow-sticky">
        {!termsChecked && (
          <p className="text-caption text-ink-light text-center mb-2">
            Centang persetujuan untuk melanjutkan
          </p>
        )}
        <button
          disabled={!termsChecked}
          onClick={handleSubmit}
          className={`w-full h-12 rounded-xl font-semibold text-body transition-all active:scale-[0.98] ${
            termsChecked
              ? 'gradient-orange text-primary-foreground shadow-card'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          Daftar Waitlist
        </button>
      </div>
    </div>
  );
}

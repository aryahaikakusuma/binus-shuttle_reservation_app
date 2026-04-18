import { useNavigate } from 'react-router-dom';
import { useShuttleStore } from '@/store/shuttleStore';
import { QuickActionIcon } from '@/components/QuickActionIcon';
import { CalendarCheck, ShieldAlert, Bus, ChevronRight, Megaphone } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const { user, bookings, resetCurrentBooking, isSuspended, getSuspensionEnd } = useShuttleStore();

  const upcomingBooking = bookings.find((b) => b.status === 'confirmed');
  const suspended = isSuspended();
  const suspendedUntil = getSuspensionEnd();

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 11) return 'Selamat Pagi';
    if (h < 15) return 'Selamat Siang';
    if (h < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="gradient-header px-5 pt-10 pb-8 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-card/20 flex items-center justify-center text-primary-foreground font-bold text-lg">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="text-primary-foreground/80 text-caption">{getGreeting()},</p>
            <p className="text-primary-foreground font-bold text-body">{user.name.split(' ')[0]}</p>
          </div>
          <span className="bg-card/20 text-primary-foreground text-[10px] font-semibold px-3 py-1 rounded-full">
            {user.level}
          </span>
        </div>

        {/* Suspension banner */}
        {suspended && (
          <div className="bg-destructive/20 backdrop-blur-sm rounded-2xl p-3 mb-3 border border-destructive/30">
            <p className="text-primary-foreground font-semibold text-caption">Akun Tersuspensi</p>
            <p className="text-primary-foreground/80 text-[11px] mt-0.5">
              Suspended hingga {suspendedUntil}. Anda tidak dapat memesan shuttle.
            </p>
          </div>
        )}

        {/* Upcoming booking card */}
        {upcomingBooking && (
          <button
            onClick={() => navigate('/bookings')}
            className="w-full bg-card/15 backdrop-blur-sm rounded-2xl p-4 text-left"
          >
            <p className="text-primary-foreground/70 text-caption mb-1">Perjalanan Berikutnya</p>
            <div className="flex items-center gap-2 text-primary-foreground">
              <span className="font-bold text-body">{upcomingBooking.from}</span>
              <ChevronRight className="w-4 h-4" />
              <span className="font-bold text-body">{upcomingBooking.to}</span>
            </div>
            <p className="text-primary-foreground/70 text-caption mt-1">
              {upcomingBooking.date} · {upcomingBooking.departure} ·{' '}
              {upcomingBooking.isStanding ? 'Berdiri' : `Kursi ${upcomingBooking.seatNumber}`}
            </p>
          </button>
        )}
      </div>

      <div className="px-5 -mt-4 space-y-5">
        {/* Quick Actions */}
        <div className="bg-card rounded-2xl p-5 shadow-card flex justify-around">
          <QuickActionIcon
            icon={Bus}
            label="Pesan"
            onClick={() => { resetCurrentBooking(); navigate('/book'); }}
            gradient="from-accent to-primary/20"
          />
          <QuickActionIcon
            icon={CalendarCheck}
            label="Pemesanan"
            onClick={() => navigate('/bookings')}
            gradient="from-blue-50 to-secondary/20"
          />
          <QuickActionIcon
            icon={ShieldAlert}
            label="Penalti"
            onClick={() => navigate('/strikes')}
            gradient="from-red-50 to-destructive/20"
          />
        </div>

        {/* Active strikes alert */}
        {user.activeStrikes > 0 && (
          <button
            onClick={() => navigate('/strikes')}
            className="w-full bg-destructive/10 border border-destructive/20 rounded-2xl p-4 text-left flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="text-body font-semibold text-destructive">
                {user.activeStrikes} Strike Aktif
              </p>
              <p className="text-caption text-destructive/70 mt-0.5">Lihat riwayat dan ajukan banding</p>
            </div>
            <ChevronRight className="w-4 h-4 text-destructive" />
          </button>
        )}

        {/* Announcement */}
        <div className="bg-card rounded-2xl p-4 shadow-card flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
            <Megaphone className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <p className="text-body font-semibold text-ink">Pengumuman</p>
            <p className="text-caption text-ink-light mt-0.5">
              Jadwal shuttle Binus Square kini mencakup rute Binus Square ⇄ Kemanggisan dan ⇄ Alam Sutera.
              Mode Berdiri tersedia untuk rute Binus Square!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

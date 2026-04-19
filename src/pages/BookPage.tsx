import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useShuttleStore,
  MAIN_STOPS,
  KEMANGGISAN_SUBSTOPS,
  isValidRoute,
  isBinusSquareRoute,
  getSchedulesForRoute,
  getSeatsRemaining,
  BUS_CONFIGS,
  normalizeStop,
  routeUsesKemanggisanSubstops,
} from '@/store/shuttleStore';
import { ArrowLeft, ArrowUpDown, MapPin, Calendar, Clock, ChevronRight, Bus } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

const DAY_NAMES_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function getNext7Days() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    days.push({
      date: `${y}-${mo}-${dy}`,
      label: i === 0 ? 'Hari Ini' : DAY_NAMES_ID[d.getDay()],
      day: d.getDate(),
      month: d.toLocaleString('id-ID', { month: 'short' }),
    });
  }
  return days;
}

function displayStop(stop: string): string {
  return stop || '';
}

export default function BookPage() {
  const navigate = useNavigate();
  const { currentBooking, setCurrentBooking, isSuspended, getSuspensionEnd } = useShuttleStore();

  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [fromSubOpen, setFromSubOpen] = useState(false);
  const [toSubOpen, setToSubOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [swapRotation, setSwapRotation] = useState(0);
  const [pendingFromMain, setPendingFromMain] = useState('');
  const [pendingToMain, setPendingToMain] = useState('');

  const days = getNext7Days();
  const suspended = isSuspended();
  const suspendedUntil = getSuspensionEnd();

  const sameStop =
    currentBooking.from &&
    currentBooking.to &&
    normalizeStop(currentBooking.from) === normalizeStop(currentBooking.to);
  const valid = currentBooking.from && currentBooking.to && isValidRoute(currentBooking.from, currentBooking.to);
  const routeInvalid = currentBooking.from && currentBooking.to && !sameStop && !isValidRoute(currentBooking.from, currentBooking.to);
  const allValid = valid && currentBooking.date && currentBooking.time && !suspended;

  const schedules = currentBooking.from && currentBooking.to && valid
    ? getSchedulesForRoute(currentBooking.from, currentBooking.to)
    : [];

  const handleSwap = () => {
    setSwapRotation((r) => r + 180);
    setCurrentBooking({ from: currentBooking.to, to: currentBooking.from, time: '', busType: null, seat: null });
  };

  const handleSelectFromMain = (stop: string) => {
    setFromOpen(false);
    if (stop === 'Kemanggisan') {
      // Sub-stop picker only appears on the Binus Square corridor.
      const otherIsBinusSquare = normalizeStop(currentBooking.to) === 'Binus Square';
      if (otherIsBinusSquare) {
        setPendingFromMain(stop);
        setFromSubOpen(true);
      } else {
        setCurrentBooking({ from: 'Kemanggisan (Anggrek)', time: '', busType: null, seat: null });
      }
    } else {
      setCurrentBooking({ from: stop, time: '', busType: null, seat: null });
      // If user just picked Binus Square and the other end is Kemanggisan (any form), prompt for sub-stop.
      if (stop === 'Binus Square' && normalizeStop(currentBooking.to) === 'Kemanggisan') {
        setPendingToMain('Kemanggisan');
        setToSubOpen(true);
      }
    }
  };

  const handleSelectToMain = (stop: string) => {
    setToOpen(false);
    if (stop === 'Kemanggisan') {
      const otherIsBinusSquare = normalizeStop(currentBooking.from) === 'Binus Square';
      if (otherIsBinusSquare) {
        setPendingToMain(stop);
        setToSubOpen(true);
      } else {
        setCurrentBooking({ to: 'Kemanggisan (Anggrek)', time: '', busType: null, seat: null });
      }
    } else {
      setCurrentBooking({ to: stop, time: '', busType: null, seat: null });
      if (stop === 'Binus Square' && normalizeStop(currentBooking.from) === 'Kemanggisan') {
        setPendingFromMain('Kemanggisan');
        setFromSubOpen(true);
      }
    }
  };

  const handleSelectFromSub = (sub: string) => {
    setFromSubOpen(false);
    setCurrentBooking({ from: `Kemanggisan ${sub}`, time: '', busType: null, seat: null });
  };

  const handleSelectToSub = (sub: string) => {
    setToSubOpen(false);
    setCurrentBooking({ to: `Kemanggisan ${sub}`, time: '', busType: null, seat: null });
  };

  const handleSelectTime = (time: string, busType: typeof schedules[0]['busType']) => {
    setCurrentBooking({ time, busType, seat: null });
    setTimeOpen(false);
  };

  const seatDot = (count: number, total: number) => {
    const pct = count / total;
    if (pct > 0.5) return 'bg-success';
    if (pct > 0.2) return 'bg-primary';
    return 'bg-destructive';
  };

  const isOverflow = currentBooking.from && currentBooking.to
    ? isBinusSquareRoute(currentBooking.from, currentBooking.to)
    : false;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-5 pt-10 pb-4">
        <button onClick={() => navigate(-1)} className="text-ink mb-3">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-h1 text-ink">Pesan Shuttle</h1>
        <p className="text-caption text-ink-light mt-1">Pilih rute, tanggal, dan waktu keberangkatan</p>
      </div>

      {suspended && (
        <div className="mx-5 mb-4 bg-destructive/10 border border-destructive/30 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-destructive text-lg">🚫</span>
          <div>
            <p className="text-body font-semibold text-destructive">Akun Tersuspensi</p>
            <p className="text-caption text-destructive/80 mt-0.5">
              Akun Anda di-suspend hingga {suspendedUntil}. Anda tidak dapat memesan shuttle.
            </p>
          </div>
        </div>
      )}

      <div className="px-5 space-y-4 flex-1">
        {/* From / To with swap */}
        <div className="relative">
          <button
            onClick={() => setFromOpen(true)}
            className="w-full h-12 px-4 rounded-xl border border-border bg-card text-left flex items-center gap-3"
          >
            <MapPin className="w-5 h-5 text-primary shrink-0" />
            <span className={`text-body flex-1 ${currentBooking.from ? 'text-ink' : 'text-ink-light/50'}`}>
              {displayStop(currentBooking.from) || 'Dari mana?'}
            </span>
          </button>

          <button
            onClick={handleSwap}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-card transition-transform"
            style={{ transform: `translateY(-50%) rotate(${swapRotation}deg)` }}
          >
            <ArrowUpDown className="w-5 h-5 text-accent-foreground" />
          </button>

          <button
            onClick={() => setToOpen(true)}
            className="w-full h-12 px-4 rounded-xl border border-border bg-card text-left flex items-center gap-3 mt-2"
          >
            <MapPin className="w-5 h-5 text-destructive shrink-0" />
            <span className={`text-body flex-1 ${currentBooking.to ? 'text-ink' : 'text-ink-light/50'}`}>
              {displayStop(currentBooking.to) || 'Ke mana?'}
            </span>
          </button>

          {sameStop && (
            <p className="text-caption text-destructive mt-1.5 ml-1">Pilih tujuan berbeda</p>
          )}
          {routeInvalid && (
            <p className="text-caption text-destructive mt-1.5 ml-1">Rute tidak tersedia</p>
          )}
        </div>

        {/* Overflow badge */}
        {isOverflow && valid && (
          <div className="bg-secondary/10 rounded-xl px-3 py-2 flex items-center gap-2">
            <Bus className="w-4 h-4 text-secondary" />
            <p className="text-caption text-secondary font-medium">
              Rute ini mendukung mode Berdiri (Seat + Standing)
            </p>
          </div>
        )}

        {/* Date */}
        <button
          onClick={() => setDateOpen(true)}
          className="w-full h-12 px-4 rounded-xl border border-border bg-card text-left flex items-center gap-3"
        >
          <Calendar className="w-5 h-5 text-secondary shrink-0" />
          <span className={`text-body flex-1 ${currentBooking.date ? 'text-ink' : 'text-ink-light/50'}`}>
            {currentBooking.date || 'Pilih tanggal'}
          </span>
        </button>

        {/* Time */}
        <button
          onClick={() => valid ? setTimeOpen(true) : undefined}
          disabled={!valid}
          className={`w-full h-12 px-4 rounded-xl border border-border bg-card text-left flex items-center gap-3 ${!valid ? 'opacity-50' : ''}`}
        >
          <Clock className="w-5 h-5 text-success shrink-0" />
          <span className={`text-body flex-1 ${currentBooking.time ? 'text-ink' : 'text-ink-light/50'}`}>
            {currentBooking.time
              ? `${currentBooking.time} — ${currentBooking.busType ? BUS_CONFIGS[currentBooking.busType].label : ''}`
              : valid ? 'Pilih waktu keberangkatan' : 'Pilih rute dulu'}
          </span>
        </button>

        {/* Summary */}
        {valid && currentBooking.date && currentBooking.time && (
          <div className="bg-accent/50 rounded-2xl p-4">
            <p className="text-caption text-ink-light mb-1">Ringkasan Perjalanan</p>
            <p className="text-body font-bold text-ink">{currentBooking.from} → {currentBooking.to}</p>
            <p className="text-caption text-ink-light">{currentBooking.date} · {currentBooking.time}</p>
            {currentBooking.busType && (
              <p className="text-caption text-ink-light mt-0.5">
                Kendaraan: {BUS_CONFIGS[currentBooking.busType].label}
                {isOverflow ? ' · Seat + Standing tersedia' : ''}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="sticky bottom-0 p-5 bg-card shadow-sticky">
        <button
          disabled={!allValid}
          onClick={() => { if (allValid) navigate('/seats'); }}
          className={`w-full h-12 rounded-xl font-semibold text-body transition-all active:scale-[0.98] ${
            allValid ? 'gradient-orange text-primary-foreground shadow-card' : 'bg-muted text-muted-foreground'
          }`}
        >
          {suspended ? 'Akun Tersuspensi' : 'Cari Kursi'}
        </button>
      </div>

      {/* From Main Drawer */}
      <Drawer open={fromOpen} onOpenChange={setFromOpen}>
        <DrawerContent>
          <DrawerHeader><DrawerTitle>Pilih Keberangkatan</DrawerTitle></DrawerHeader>
          <div className="px-4 pb-6 space-y-1">
            {MAIN_STOPS.map((stop) => (
              <button
                key={stop}
                onClick={() => handleSelectFromMain(stop)}
                className={`w-full px-4 py-3 rounded-xl text-left text-body flex items-center gap-3 ${
                  normalizeStop(currentBooking.from) === stop
                    ? 'bg-accent text-accent-foreground font-semibold'
                    : 'text-ink hover:bg-muted'
                }`}
              >
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="flex-1">{stop}</span>
                {stop === 'Kemanggisan' && (
                  <span className="text-caption text-ink-light">Kijang · Syahdan · Anggrek</span>
                )}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      {/* From Sub-stop Drawer */}
      <Drawer open={fromSubOpen} onOpenChange={setFromSubOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Pilih Kampus Kemanggisan</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-1">
            {KEMANGGISAN_SUBSTOPS.map((sub) => (
              <button
                key={sub}
                onClick={() => handleSelectFromSub(sub)}
                className={`w-full px-4 py-3 rounded-xl text-left text-body flex items-center gap-3 ${
                  currentBooking.from === `${pendingFromMain} ${sub}`
                    ? 'bg-accent text-accent-foreground font-semibold'
                    : 'text-ink hover:bg-muted'
                }`}
              >
                <MapPin className="w-4 h-4 shrink-0" />
                Kemanggisan {sub}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      {/* To Main Drawer */}
      <Drawer open={toOpen} onOpenChange={setToOpen}>
        <DrawerContent>
          <DrawerHeader><DrawerTitle>Pilih Tujuan</DrawerTitle></DrawerHeader>
          <div className="px-4 pb-6 space-y-1">
            {MAIN_STOPS.map((stop) => (
              <button
                key={stop}
                onClick={() => handleSelectToMain(stop)}
                className={`w-full px-4 py-3 rounded-xl text-left text-body flex items-center gap-3 ${
                  normalizeStop(currentBooking.to) === stop
                    ? 'bg-accent text-accent-foreground font-semibold'
                    : 'text-ink hover:bg-muted'
                }`}
              >
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="flex-1">{stop}</span>
                {stop === 'Kemanggisan' && (
                  <span className="text-caption text-ink-light">Kijang · Syahdan · Anggrek</span>
                )}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      {/* To Sub-stop Drawer */}
      <Drawer open={toSubOpen} onOpenChange={setToSubOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Pilih Kampus Kemanggisan</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-1">
            {KEMANGGISAN_SUBSTOPS.map((sub) => (
              <button
                key={sub}
                onClick={() => handleSelectToSub(sub)}
                className={`w-full px-4 py-3 rounded-xl text-left text-body flex items-center gap-3 ${
                  currentBooking.to === `${pendingToMain} ${sub}`
                    ? 'bg-accent text-accent-foreground font-semibold'
                    : 'text-ink hover:bg-muted'
                }`}
              >
                <MapPin className="w-4 h-4 shrink-0" />
                Kemanggisan {sub}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Date Drawer */}
      <Drawer open={dateOpen} onOpenChange={setDateOpen}>
        <DrawerContent>
          <DrawerHeader><DrawerTitle>Pilih Tanggal</DrawerTitle></DrawerHeader>
          <div className="px-4 pb-6 flex gap-2 overflow-x-auto">
            {days.map((d) => (
              <button
                key={d.date}
                onClick={() => { setCurrentBooking({ date: d.date, time: '', busType: null, seat: null }); setDateOpen(false); }}
                className={`flex flex-col items-center px-4 py-3 rounded-2xl min-w-[72px] shrink-0 transition-colors ${
                  currentBooking.date === d.date
                    ? 'gradient-orange text-primary-foreground'
                    : 'bg-muted text-ink'
                }`}
              >
                <span className="text-caption font-medium">{d.label}</span>
                <span className="text-lg font-bold">{d.day}</span>
                <span className="text-caption">{d.month}</span>
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Time Drawer */}
      <Drawer open={timeOpen} onOpenChange={setTimeOpen}>
        <DrawerContent>
          <DrawerHeader><DrawerTitle>Pilih Waktu Keberangkatan</DrawerTitle></DrawerHeader>
          <div className="px-4 pb-6 space-y-1">
            {schedules.map(({ time, busType }) => {
              const total = BUS_CONFIGS[busType].seatCount;
              const seats = currentBooking.from && currentBooking.to && currentBooking.date
                ? getSeatsRemaining(currentBooking.from, currentBooking.to, currentBooking.date, time, total)
                : total;
              return (
                <button
                  key={time}
                  onClick={() => handleSelectTime(time, busType)}
                  className={`w-full px-4 py-3 rounded-xl text-left flex items-center gap-3 ${
                    currentBooking.time === time
                      ? 'bg-accent text-accent-foreground font-semibold'
                      : 'text-ink hover:bg-muted'
                  }`}
                >
                  <Clock className="w-4 h-4 text-ink-light" />
                  <span className="text-body flex-1">{time}</span>
                  <span className="text-caption text-ink-light bg-muted px-2 py-0.5 rounded-full">
                    {BUS_CONFIGS[busType].label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${seatDot(seats, total)}`} />
                    <span className="text-caption text-ink-light">{seats} kursi</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-light" />
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

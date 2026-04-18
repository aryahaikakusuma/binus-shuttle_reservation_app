import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useShuttleStore,
  isBinusSquareRoute,
  getOccupiedSeats,
  BUS_CONFIGS,
  PRIORITY_SEAT_NUMBERS,
  arePrioritySeatsReleased,
  BusType,
} from '@/store/shuttleStore';
import { ArrowLeft, CircleDot, Star } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// ── Seat layout definitions ───────────────────────────────────────────────────
type SeatDef = { num: number; label: string } | null;

function buildElfLayout(): SeatDef[][] {
  return [1, 2].map((row) => [
    { num: (row - 1) * 4 + 1, label: `${row}A` },
    { num: (row - 1) * 4 + 2, label: `${row}B` },
    null,
    { num: (row - 1) * 4 + 3, label: `${row}C` },
    { num: (row - 1) * 4 + 4, label: `${row}D` },
  ]);
}

function buildMinibusLayout(): SeatDef[][] {
  const rows: SeatDef[][] = [];
  // Section A (forward): rows 1-3, 2 seats (window only, big aisle)
  for (let r = 1; r <= 3; r++) {
    rows.push([
      { num: (r - 1) * 2 + 1, label: `${r}A` },
      null,
      null,
      { num: (r - 1) * 2 + 2, label: `${r}B` },
    ]);
  }
  // Back bench: row 4, 4 seats
  rows.push([
    { num: 7, label: '4A' },
    { num: 8, label: '4B' },
    { num: 9, label: '4C' },
    { num: 10, label: '4D' },
  ]);
  // Section B (cross): rows 5-7
  for (let r = 5; r <= 7; r++) {
    rows.push([
      { num: (r - 5) * 2 + 11, label: `${r}A` },
      null,
      null,
      { num: (r - 5) * 2 + 12, label: `${r}B` },
    ]);
  }
  return rows;
}

function buildBusMediumLayout(): SeatDef[][] {
  const rows: SeatDef[][] = [];
  for (let r = 1; r <= 7; r++) {
    rows.push([
      { num: (r - 1) * 4 + 1, label: `${r}A` },
      { num: (r - 1) * 4 + 2, label: `${r}B` },
      null,
      { num: (r - 1) * 4 + 3, label: `${r}C` },
      { num: (r - 1) * 4 + 4, label: `${r}D` },
    ]);
  }
  // Last row: 2 seats only (seats 29–30)
  rows.push([
    { num: 29, label: '8A' },
    { num: 30, label: '8B' },
    null,
    null,
    null,
  ]);
  return rows;
}

function getLayout(busType: BusType): SeatDef[][] {
  if (busType === 'elf') return buildElfLayout();
  if (busType === 'minibus') return buildMinibusLayout();
  return buildBusMediumLayout();
}

// ── Availability indicator ────────────────────────────────────────────────────
function availColor(available: number, total: number): string {
  if (total === 0) return 'text-ink-light';
  const pct = available / total;
  if (pct > 0.5) return 'text-success';
  if (pct > 0.2) return 'text-primary';
  if (pct > 0) return 'text-destructive';
  return 'text-ink-light';
}

function availDotColor(available: number, total: number): string {
  if (total === 0) return 'bg-muted-foreground';
  const pct = available / total;
  if (pct > 0.5) return 'bg-success';
  if (pct > 0.2) return 'bg-primary';
  if (pct > 0) return 'bg-destructive';
  return 'bg-muted-foreground';
}

export default function SeatsPage() {
  const navigate = useNavigate();
  const { currentBooking, setCurrentBooking, user } = useShuttleStore();

  const busType = currentBooking.busType ?? 'bus_medium';
  const config = BUS_CONFIGS[busType];
  const totalSeats = config.seatCount;
  const showStanding = isBinusSquareRoute(currentBooking.from, currentBooking.to) && config.standingAllowed;
  const standingTotal = config.standingCount;

  const occupied = useMemo(
    () => getOccupiedSeats(currentBooking.from, currentBooking.to, currentBooking.date, currentBooking.time, totalSeats),
    [currentBooking.from, currentBooking.to, currentBooking.date, currentBooking.time, totalSeats]
  );

  const layout = useMemo(() => getLayout(busType), [busType]);
  const selectedSeat = currentBooking.seat;
  const priorityReleased = arePrioritySeatsReleased(currentBooking.date, currentBooking.time);
  const isMahasiswa = user.role === 'mahasiswa';

  const seatsAvailable = totalSeats - occupied.size;

  const handleSeatTap = (seatNum: number, label: string) => {
    if (occupied.has(seatNum)) return;
    const isPriority = PRIORITY_SEAT_NUMBERS.has(seatNum);
    if (isPriority && isMahasiswa && !priorityReleased) return;
    setCurrentBooking({ seat: selectedSeat === label ? null : label });
  };

  const handleStandingTap = () => {
    const label = 'B1';
    setCurrentBooking({ seat: selectedSeat === label ? null : label });
  };

  const getSeatStyle = (seatNum: number, label: string): string => {
    const isPriority = PRIORITY_SEAT_NUMBERS.has(seatNum);
    const lockedForMahasiswa = isPriority && isMahasiswa && !priorityReleased;
    if (occupied.has(seatNum) || lockedForMahasiswa) {
      return 'bg-muted text-muted-foreground cursor-not-allowed';
    }
    if (selectedSeat === label) return 'gradient-orange text-primary-foreground';
    if (isPriority) return 'bg-card border-2 border-primary/40 text-ink-light hover:border-primary cursor-pointer';
    return 'bg-card border-2 border-border text-ink-light hover:border-primary/50 cursor-pointer';
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-5 pt-10 pb-4">
        <button onClick={() => navigate(-1)} className="text-ink mb-3">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-h1 text-ink">Pilih Kursi</h1>
        <p className="text-caption text-ink-light mt-1">
          {currentBooking.from} → {currentBooking.to} · {currentBooking.date} · {currentBooking.time}
        </p>
        <p className="text-caption text-ink-light mt-0.5">
          Kendaraan: <span className="font-semibold">{config.label}</span>
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-5 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-card border-2 border-border" />
          <span className="text-caption text-ink-light">Tersedia</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded gradient-orange" />
          <span className="text-caption text-ink-light">Dipilih</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-muted" />
          <span className="text-caption text-ink-light">Terisi</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-card border-2 border-primary/40 flex items-center justify-center">
            <Star className="w-2.5 h-2.5 text-primary/60" />
          </div>
          <span className="text-caption text-ink-light">Prioritas</span>
        </div>
      </div>

      <div className={`px-5 flex-1 ${showStanding ? 'flex gap-3' : ''}`}>
        {/* Seat map */}
        <div className={`${showStanding ? 'flex-1' : ''}`}>
          {showStanding && (
            <div className="flex items-center justify-between mb-2">
              <p className="text-body font-semibold text-ink">Kursi</p>
              <span className={`text-caption font-medium ${availColor(seatsAvailable, totalSeats)}`}>
                {seatsAvailable} / {totalSeats} tersedia
              </span>
            </div>
          )}

          <div className="bg-card rounded-2xl p-4 shadow-card">
            {/* Driver indicator */}
            <div className="flex justify-end mb-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <CircleDot className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>

            {busType === 'minibus' && (
              <p className="text-[10px] text-ink-light text-center mb-2">⇑ Arah Perjalanan</p>
            )}

            <div className="space-y-2">
              {layout.map((row, ri) => (
                <div key={ri} className="flex items-center justify-center gap-1.5">
                  {row.map((cell, ci) => {
                    if (!cell) {
                      return <div key={ci} className="w-6" />;
                    }
                    const isPriority = PRIORITY_SEAT_NUMBERS.has(cell.num);
                    const lockedForMahasiswa = isPriority && isMahasiswa && !priorityReleased;
                    const isOccupied = occupied.has(cell.num);
                    const isDisabled = isOccupied || lockedForMahasiswa;

                    const btn = (
                      <button
                        key={ci}
                        onClick={() => handleSeatTap(cell.num, cell.label)}
                        disabled={isDisabled}
                        className={`w-10 h-10 rounded-lg text-[11px] font-semibold transition-all relative ${getSeatStyle(cell.num, cell.label)}`}
                      >
                        {isPriority && (
                          <Star
                            className={`absolute top-0.5 right-0.5 w-2.5 h-2.5 ${
                              selectedSeat === cell.label ? 'text-primary-foreground/70' : 'text-primary/50'
                            }`}
                          />
                        )}
                        {cell.label}
                      </button>
                    );

                    if (isPriority && isMahasiswa && !priorityReleased) {
                      return (
                        <Tooltip key={ci}>
                          <TooltipTrigger asChild>{btn}</TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            Kursi prioritas untuk dosen/staf
                          </TooltipContent>
                        </Tooltip>
                      );
                    }
                    return btn;
                  })}
                </div>
              ))}
            </div>

            {/* Priority note */}
            {!priorityReleased && (
              <p className="text-[10px] text-ink-light mt-4 text-center">
                Kursi prioritas ★ yang tidak terisi akan dibuka untuk umum 30 menit sebelum keberangkatan.
              </p>
            )}
          </div>
        </div>

        {/* Standing section — Binus Square routes only, always visible */}
        {showStanding && (
          <div className="w-28">
            <div className="flex items-center justify-between mb-2">
              <p className="text-body font-semibold text-ink">Berdiri</p>
            </div>

            <div className="bg-card rounded-2xl p-3 shadow-card h-fit">
              <div className="flex items-center gap-1 mb-2">
                <div className={`w-2.5 h-2.5 rounded-full ${availDotColor(standingTotal, standingTotal)}`} />
                <span className={`text-caption font-semibold ${availColor(standingTotal, standingTotal)}`}>
                  {standingTotal} tersedia
                </span>
              </div>
              <p className="text-[10px] text-ink-light mb-3">Pilih berdiri meski kursi masih ada</p>
              <button
                onClick={handleStandingTap}
                className={`w-full py-3 rounded-xl text-caption font-semibold transition-all ${
                  selectedSeat === 'B1'
                    ? 'gradient-orange text-primary-foreground'
                    : 'bg-muted text-ink hover:bg-muted/80'
                }`}
              >
                {selectedSeat === 'B1' ? '✓ Berdiri' : 'Pilih Berdiri'}
              </button>
              <p className="text-[10px] text-ink-light mt-2 text-center">Maks. {standingTotal} orang</p>
            </div>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="sticky bottom-0 p-5 bg-card shadow-sticky">
        <div className="mb-3">
          <span className="text-body text-ink-light">
            {selectedSeat
              ? selectedSeat.startsWith('B')
                ? 'Mode Berdiri dipilih'
                : `Kursi: ${selectedSeat}`
              : 'Belum ada pilihan'}
          </span>
        </div>
        <button
          disabled={!selectedSeat}
          onClick={() => navigate('/confirm')}
          className={`w-full h-12 rounded-xl font-semibold text-body transition-all active:scale-[0.98] ${
            selectedSeat ? 'gradient-orange text-primary-foreground shadow-card' : 'bg-muted text-muted-foreground'
          }`}
        >
          Lanjut ke Konfirmasi
        </button>
      </div>
    </div>
  );
}

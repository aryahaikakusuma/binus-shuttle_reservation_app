import { Fragment, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useShuttleStore,
  isBinusSquareRoute,
  getOccupiedSeats,
  BUS_CONFIGS,
  getPrioritySeats,
  arePrioritySeatsReleased,
  BusType,
} from '@/store/shuttleStore';
import { ArrowLeft, CircleDot, ShieldCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// ── Seat layout definitions ───────────────────────────────────────────────────
// Matches the "Pembagian Kursi" spec: asymmetric Elf with driver-row priority,
// Minibus with 6 left + 6 right + 4-seat back bench, Bus Medium as 2+2 × 8.
type SeatDef = { num: number; label: string; lesehan?: boolean } | null;
type SeatLayout = { rows: SeatDef[][]; hasElfDivider?: boolean };

function buildElfLayout(): SeatLayout {
  // Row 0: priority seat (1) alone on the driver row
  // After divider:
  //   Row 1:  _   [2]
  //   Row 2: [3]  [4]
  //   Row 3: [5]  [6]
  //   Row 4: [7]  [8]
  const rows: SeatDef[][] = [
    [{ num: 1, label: '1' }, null, null],
    [null, null, { num: 2, label: '2' }],
    [{ num: 3, label: '3' }, null, { num: 4, label: '4' }],
    [{ num: 5, label: '5' }, null, { num: 6, label: '6' }],
    [{ num: 7, label: '7' }, null, { num: 8, label: '8' }],
  ];
  return { rows, hasElfDivider: true };
}

function buildMinibusLayout(_isBinusSquare: boolean): SeatLayout {
  // 4-column fixed grid: rows 1-6 place seats at columns 1 and 4 (aisle in middle).
  // Row 7 is the back bench with all 4 columns filled.
  const rows: SeatDef[][] = [];
  for (let r = 1; r <= 6; r++) {
    const leftNum = (r - 1) * 2 + 1;
    const rightNum = (r - 1) * 2 + 2;
    rows.push([
      { num: leftNum, label: `${leftNum}` },
      null,
      null,
      { num: rightNum, label: `${rightNum}` },
    ]);
  }
  rows.push([
    { num: 13, label: '13' },
    { num: 14, label: '14' },
    { num: 15, label: '15' },
    { num: 16, label: '16' },
  ]);
  return { rows };
}

function buildBusMediumLayout(): SeatLayout {
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
  return { rows };
}

function getLayout(busType: BusType, isBinusSquare: boolean): SeatLayout {
  if (busType === 'elf') return buildElfLayout();
  if (busType === 'minibus') return buildMinibusLayout(isBinusSquare);
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
  const isBinusSquare = isBinusSquareRoute(currentBooking.from, currentBooking.to);
  const showStanding = isBinusSquare && config.standingAllowed;
  const standingTotal = config.standingCount;
  const prioritySet = useMemo(() => getPrioritySeats(busType), [busType]);

  const occupied = useMemo(
    () => getOccupiedSeats(currentBooking.from, currentBooking.to, currentBooking.date, currentBooking.time, totalSeats),
    [currentBooking.from, currentBooking.to, currentBooking.date, currentBooking.time, totalSeats]
  );

  const layout = useMemo(() => getLayout(busType, isBinusSquare), [busType, isBinusSquare]);
  const selectedSeat = currentBooking.seat;
  const priorityReleased = arePrioritySeatsReleased(currentBooking.date, currentBooking.time);
  const isMahasiswa = user.role === 'mahasiswa';

  const seatsAvailable = totalSeats - occupied.size;

  const handleSeatTap = (seatNum: number, label: string) => {
    if (occupied.has(seatNum)) return;
    const isPriority = prioritySet.has(seatNum);
    if (isPriority && isMahasiswa && !priorityReleased) return;
    setCurrentBooking({ seat: selectedSeat === label ? null : label });
  };

  const handleStandingTap = () => {
    const label = 'B1';
    setCurrentBooking({ seat: selectedSeat === label ? null : label });
  };

  const getSeatStyle = (seatNum: number, label: string): string => {
    const isPriority = prioritySet.has(seatNum);
    const lockedForMahasiswa = isPriority && isMahasiswa && !priorityReleased;
    if (occupied.has(seatNum)) {
      return 'bg-[#9AA3AE] text-white/80 cursor-not-allowed';
    }
    if (selectedSeat === label) return 'gradient-orange text-primary-foreground';
    if (lockedForMahasiswa) {
      return 'bg-[#E5E7EB] text-ink cursor-not-allowed';
    }
    return 'bg-[#E5E7EB] text-ink hover:bg-[#D1D5DB] cursor-pointer';
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
          <div className="w-5 h-5 rounded bg-[#E5E7EB]" />
          <span className="text-caption text-ink-light">Tersedia</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded gradient-orange" />
          <span className="text-caption text-ink-light">Dipilih</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-[#9AA3AE]" />
          <span className="text-caption text-ink-light">Terisi</span>
        </div>
        {busType !== 'minibus' && (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded bg-[#E5E7EB] flex items-center justify-center">
              <ShieldCheck className="w-3 h-3 text-primary" />
            </div>
            <span className="text-caption text-ink-light">Kursi Prioritas</span>
          </div>
        )}
      </div>

      <div className="px-5 flex-1 space-y-4">
        {/* Seat map */}
        <div>
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
              {layout.rows.map((row, ri) => (
                <Fragment key={ri}>
                  <div
                    className={
                      busType === 'minibus'
                        ? 'grid grid-cols-4 gap-1.5 w-[194px] mx-auto'
                        : 'flex items-center justify-center gap-1.5'
                    }
                  >
                    {row.map((cell, ci) => {
                      if (!cell) {
                        return <div key={ci} className={busType === 'minibus' ? 'w-11 h-11' : 'w-10'} />;
                      }
                      const isPriority = prioritySet.has(cell.num);
                      const lockedForMahasiswa = isPriority && isMahasiswa && !priorityReleased;
                      const isOccupied = occupied.has(cell.num);
                      const isDisabled = isOccupied || lockedForMahasiswa;

                      const btn = (
                        <button
                          key={ci}
                          onClick={() => handleSeatTap(cell.num, cell.label)}
                          disabled={isDisabled}
                          className={`w-11 h-11 rounded-lg text-[11px] font-semibold transition-all relative ${getSeatStyle(cell.num, cell.label)}`}
                        >
                          {isPriority && !isOccupied && (
                            <ShieldCheck
                              className={`absolute top-0.5 right-0.5 w-2.5 h-2.5 ${
                                selectedSeat === cell.label ? 'text-primary-foreground/80' : 'text-primary'
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
                  {layout.hasElfDivider && ri === 0 && (
                    <div className="border-t border-border my-2 mx-4" />
                  )}
                </Fragment>
              ))}
            </div>

            {/* Priority note — only for buses that have priority seats */}
            {busType !== 'minibus' && !priorityReleased && (
              <p className="text-[10px] text-ink-light mt-4 text-center">
                Kursi prioritas yang tidak terisi akan dibuka untuk umum 30 menit sebelum keberangkatan.
              </p>
            )}
          </div>
        </div>

        {/* Standing section — Binus Square routes only, below seat map */}
        {showStanding && (
          <div>
            <div className="border-t border-border my-2" />
            <div className="flex items-center justify-between mb-2">
              <p className="text-body font-semibold text-ink">Berdiri</p>
              <div className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${availDotColor(standingTotal, standingTotal)}`} />
                <span className={`text-caption font-semibold ${availColor(standingTotal, standingTotal)}`}>
                  {standingTotal} tersedia
                </span>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-4 shadow-card">
              <p className="text-[11px] text-ink-light mb-3">
                Pilih berdiri meski kursi masih ada. Maks. {standingTotal} orang.
              </p>
              <button
                onClick={handleStandingTap}
                className={`w-full h-12 rounded-xl text-body font-semibold transition-all ${
                  selectedSeat === 'B1'
                    ? 'gradient-orange text-primary-foreground'
                    : 'bg-[#E5E7EB] text-ink hover:bg-[#D1D5DB]'
                }`}
              >
                {selectedSeat === 'B1' ? '✓ Berdiri Dipilih' : 'Pilih Berdiri'}
              </button>
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

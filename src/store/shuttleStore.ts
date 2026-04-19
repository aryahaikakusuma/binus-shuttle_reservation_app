import { create } from 'zustand';

// ── Types ─────────────────────────────────────────────────────────────────────
export type BusType = 'elf' | 'minibus' | 'bus_medium';
export type UserRole = 'mahasiswa' | 'dosen' | 'staf';
export type BookingStatus = 'confirmed' | 'completed' | 'cancelled' | 'no-show';
export type StrikeStatus = 'aktif' | 'selesai' | 'dalam_peninjauan' | 'dicabut';
export type StrikeReason = 'no_show' | 'late_cancellation';

// ── Bus configs ───────────────────────────────────────────────────────────────
export interface BusConfig {
  type: BusType;
  label: string;
  seatCount: number;
  standingAllowed: boolean;
  standingCount: number;
}

export const BUS_CONFIGS: Record<BusType, BusConfig> = {
  elf: { type: 'elf', label: 'Elf', seatCount: 8, standingAllowed: false, standingCount: 0 },
  minibus: { type: 'minibus', label: 'Minibus', seatCount: 16, standingAllowed: true, standingCount: 8 },
  bus_medium: { type: 'bus_medium', label: 'Bus Medium', seatCount: 30, standingAllowed: false, standingCount: 0 },
};

// ── Route definitions ─────────────────────────────────────────────────────────
export interface RouteSchedule {
  time: string;
  busType: BusType;
}

export const KEMANGGISAN_SUBSTOPS = ['Kijang', 'Syahdan', 'Anggrek'];
export const MAIN_STOPS = ['Kemanggisan', 'Alam Sutera', 'Bekasi', 'JWC', 'BINUS ASO', 'Binus Square'];

export const ROUTE_PAIRS: { a: string; b: string }[] = [
  { a: 'Kemanggisan', b: 'Alam Sutera' },
  { a: 'Kemanggisan', b: 'Bekasi' },
  { a: 'Kemanggisan', b: 'JWC' },
  { a: 'Kemanggisan', b: 'BINUS ASO' },
  { a: 'Binus Square', b: 'Kemanggisan' },
  { a: 'Binus Square', b: 'Alam Sutera' },
  { a: 'Binus Square', b: 'BINUS ASO' },
  { a: 'Binus Square', b: 'JWC' },
];

/**
 * Kijang and Syahdan are intermediate stops that only exist on the
 * Binus Square ⇄ Kemanggisan corridor. All other Kemanggisan routes
 * resolve to Anggrek.
 */
export function routeUsesKemanggisanSubstops(from: string, to: string): boolean {
  const a = normalizeStop(from);
  const b = normalizeStop(to);
  return (a === 'Binus Square' && b === 'Kemanggisan') ||
         (a === 'Kemanggisan' && b === 'Binus Square');
}

export function normalizeStop(stop: string): string {
  if (stop.startsWith('Kemanggisan')) return 'Kemanggisan';
  return stop;
}

export function isValidRoute(from: string, to: string): boolean {
  const a = normalizeStop(from);
  const b = normalizeStop(to);
  return ROUTE_PAIRS.some((p) => (p.a === a && p.b === b) || (p.a === b && p.b === a));
}

export function isBinusSquareRoute(from: string, to: string): boolean {
  return from === 'Binus Square' || to === 'Binus Square';
}

const SCHEDULES_BY_ROUTE: Record<string, RouteSchedule[]> = {
  'Kemanggisan|Alam Sutera': [
    { time: '06:30', busType: 'elf' },
    { time: '07:30', busType: 'bus_medium' },
    { time: '09:00', busType: 'elf' },
    { time: '12:00', busType: 'bus_medium' },
    { time: '14:00', busType: 'elf' },
    { time: '16:00', busType: 'bus_medium' },
    { time: '18:00', busType: 'elf' },
  ],
  'Kemanggisan|Bekasi': [
    { time: '07:00', busType: 'elf' },
    { time: '08:30', busType: 'bus_medium' },
    { time: '13:00', busType: 'elf' },
    { time: '17:00', busType: 'bus_medium' },
  ],
  'Kemanggisan|JWC': [
    { time: '07:30', busType: 'elf' },
    { time: '10:00', busType: 'elf' },
    { time: '14:00', busType: 'elf' },
    { time: '17:00', busType: 'elf' },
  ],
  'Kemanggisan|BINUS ASO': [
    { time: '07:00', busType: 'elf' },
    { time: '09:00', busType: 'elf' },
    { time: '14:00', busType: 'elf' },
    { time: '16:00', busType: 'elf' },
  ],
  'Binus Square|Kemanggisan': [
    { time: '06:30', busType: 'minibus' },
    { time: '07:30', busType: 'minibus' },
    { time: '09:00', busType: 'minibus' },
    { time: '12:00', busType: 'minibus' },
    { time: '14:00', busType: 'minibus' },
    { time: '16:00', busType: 'minibus' },
    { time: '18:00', busType: 'minibus' },
  ],
  'Binus Square|Alam Sutera': [
    { time: '07:00', busType: 'elf' },
    { time: '09:00', busType: 'elf' },
    { time: '14:00', busType: 'elf' },
    { time: '17:00', busType: 'elf' },
  ],
  'Binus Square|BINUS ASO': [
    { time: '07:30', busType: 'elf' },
    { time: '10:00', busType: 'elf' },
    { time: '14:00', busType: 'elf' },
    { time: '17:00', busType: 'elf' },
  ],
  'Binus Square|JWC': [
    { time: '07:00', busType: 'elf' },
    { time: '09:30', busType: 'elf' },
    { time: '13:30', busType: 'elf' },
    { time: '17:30', busType: 'elf' },
  ],
};

export function getSchedulesForRoute(from: string, to: string): RouteSchedule[] {
  const a = normalizeStop(from);
  const b = normalizeStop(to);
  return SCHEDULES_BY_ROUTE[`${a}|${b}`] || SCHEDULES_BY_ROUTE[`${b}|${a}`] || [];
}

// ── Interfaces ────────────────────────────────────────────────────────────────
export interface CurrentBooking {
  from: string;
  to: string;
  date: string;
  time: string;
  seat: string | null;
  busType: BusType | null;
}

export interface Booking {
  id: string;
  from: string;
  to: string;
  date: string;
  departure: string;
  arrival: string;
  seatNumber: string | null;
  isStanding: boolean;
  status: BookingStatus;
  createdAt: string;
  busType: BusType;
}

export interface Strike {
  id: string;
  number: number;
  date: string;
  bookingId: string;
  bookingRoute: string;
  bookingDate: string;
  bookingTime: string;
  reason: StrikeReason;
  suspensionStart: string;
  suspensionEnd: string;
  status: StrikeStatus;
}

export interface ShuttleState {
  isLoggedIn: boolean;
  user: {
    name: string;
    nim: string;
    level: string;
    role: UserRole;
    flazzCard: string;
    avatar: string;
    activeStrikes: number;
  };
  currentBooking: CurrentBooking;
  bookings: Booking[];
  strikeHistory: Strike[];

  login: () => void;
  logout: () => void;
  setCurrentBooking: (partial: Partial<CurrentBooking>) => void;
  resetCurrentBooking: () => void;
  confirmBooking: () => Booking | null;
  cancelBooking: (id: string) => void;
  cancelBookingLate: (id: string) => string | null;
  updateStrikeStatus: (strikeId: string, status: StrikeStatus) => void;
  addStrike: (bookingId: string, route: string, date: string, time: string, reason: StrikeReason) => void;
  isSuspended: () => boolean;
  getSuspensionEnd: () => string | null;
}

// ── Date helpers ───────────────────────────────────────────────────────────────
function getLocalDateString(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${dy}`;
}

// ── Seat utilities ─────────────────────────────────────────────────────────────
function simpleHash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  return Math.abs(h >>> 0);
}

function generateOccupied(key: string, total: number): Set<number> {
  const h = simpleHash(key);
  const hourStr = key.split('|')[3] ?? '12:00';
  const hour = parseInt(hourStr.split(':')[0]);
  const rate = hour < 12 ? 0.6 : 0.3;
  const base = Math.floor(total * rate);
  const variance = (h % 5) - 2;
  const count = Math.max(0, Math.min(base + variance, total));
  const occupied = new Set<number>();
  let seed = h;
  let iters = 0;
  while (occupied.size < count && iters < 10000) {
    seed = ((seed * 1664525) + 1013904223) >>> 0;
    occupied.add((seed % total) + 1);
    iters++;
  }
  return occupied;
}

export function getOccupiedSeats(
  from: string, to: string, date: string, time: string, totalSeats: number
): Set<number> {
  const key = `${normalizeStop(from)}|${normalizeStop(to)}|${date}|${time}`;
  return generateOccupied(key, totalSeats);
}

export function getSeatsRemaining(
  from: string, to: string, date: string, time: string, totalSeats: number
): number {
  return totalSeats - getOccupiedSeats(from, to, date, time, totalSeats).size;
}

// ── Priority seat logic ────────────────────────────────────────────────────────
// Elf has only 1 priority seat (seat 1). Bus Medium has 2 (seats 1 and 2).
// Minibus (Binus Square routes) has no priority seats — all seats are general admission.
export const PRIORITY_SEATS_BY_BUS: Record<BusType, Set<number>> = {
  elf: new Set([1]),
  minibus: new Set(),
  bus_medium: new Set([1, 2]),
};

export function getPrioritySeats(busType: BusType): Set<number> {
  return PRIORITY_SEATS_BY_BUS[busType];
}

// Legacy export kept for backward compatibility (defaults to bus_medium set).
export const PRIORITY_SEAT_NUMBERS = PRIORITY_SEATS_BY_BUS.bus_medium;

export function arePrioritySeatsReleased(date: string, time: string): boolean {
  const today = getLocalDateString(0);
  if (date > today) return false;
  if (date < today) return true;
  const [h, m] = time.split(':').map(Number);
  const depMinutes = h * 60 + m;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= depMinutes - 30;
}

// ── Arrival time ───────────────────────────────────────────────────────────────
export function getArrivalTime(departure: string): string {
  const [h, m] = departure.split(':').map(Number);
  const totalMin = h * 60 + m + 75;
  return `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;
}

// ── Cancellation deadline check ────────────────────────────────────────────────
export function isPastH1Deadline(booking: Booking): boolean {
  const depDateTime = new Date(`${booking.date}T${booking.departure}:00`);
  const diffHours = (depDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
  return diffHours < 24;
}

// ── Mock seed data ─────────────────────────────────────────────────────────────
const SEED_BOOKINGS: Booking[] = [
  {
    id: 'BNS-2024-001',
    from: 'Kemanggisan (Anggrek)',
    to: 'Alam Sutera',
    date: getLocalDateString(1),
    departure: '07:30',
    arrival: getArrivalTime('07:30'),
    seatNumber: '2A',
    isStanding: false,
    status: 'confirmed',
    createdAt: getLocalDateString(0),
    busType: 'bus_medium',
  },
  {
    id: 'BNS-2024-000',
    from: 'Binus Square',
    to: 'Kemanggisan Syahdan',
    date: getLocalDateString(-7),
    departure: '07:30',
    arrival: getArrivalTime('07:30'),
    seatNumber: '3C',
    isStanding: false,
    status: 'completed',
    createdAt: getLocalDateString(-8),
    busType: 'minibus',
  },
];

const SEED_STRIKES: Strike[] = [
  {
    id: 'STR-001',
    number: 1,
    date: getLocalDateString(-2),
    bookingId: 'BNS-HIST-001',
    bookingRoute: 'Binus Square → Kemanggisan Kijang',
    bookingDate: getLocalDateString(-2),
    bookingTime: '07:30',
    reason: 'no_show',
    suspensionStart: getLocalDateString(-2),
    suspensionEnd: getLocalDateString(-1),
    status: 'selesai',
  },
];

const EMPTY_BOOKING: CurrentBooking = {
  from: '', to: '', date: '', time: '', seat: null, busType: null,
};

// ── Store ──────────────────────────────────────────────────────────────────────
export const useShuttleStore = create<ShuttleState>((set, get) => ({
  isLoggedIn: false,
  user: {
    name: 'Arya Haika Kusuma',
    nim: '2602123456',
    level: 'Undergraduate',
    role: 'mahasiswa',
    flazzCard: '6032 •••• •••• 4421',
    avatar: '',
    activeStrikes: 1,
  },
  currentBooking: { ...EMPTY_BOOKING },
  bookings: SEED_BOOKINGS,
  strikeHistory: SEED_STRIKES,

  login: () => set({ isLoggedIn: true }),
  logout: () => set({ isLoggedIn: false }),

  setCurrentBooking: (partial) =>
    set((s) => ({ currentBooking: { ...s.currentBooking, ...partial } })),

  resetCurrentBooking: () => set({ currentBooking: { ...EMPTY_BOOKING } }),

  confirmBooking: () => {
    const { currentBooking } = get();
    if (
      !currentBooking.from || !currentBooking.to ||
      !currentBooking.date || !currentBooking.time ||
      !currentBooking.seat || !currentBooking.busType
    ) return null;

    const isStanding = currentBooking.seat.startsWith('B');
    const booking: Booking = {
      id: `BNS-${Date.now().toString().slice(-6)}`,
      from: currentBooking.from,
      to: currentBooking.to,
      date: currentBooking.date,
      departure: currentBooking.time,
      arrival: getArrivalTime(currentBooking.time),
      seatNumber: currentBooking.seat,
      isStanding,
      status: 'confirmed',
      createdAt: getLocalDateString(0),
      busType: currentBooking.busType,
    };

    set((s) => ({
      bookings: [booking, ...s.bookings],
      currentBooking: { ...EMPTY_BOOKING },
    }));

    return booking;
  },

  cancelBooking: (id) =>
    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === id ? { ...b, status: 'cancelled' as BookingStatus } : b
      ),
    })),

  cancelBookingLate: (id) => {
    const { bookings, strikeHistory } = get();
    const booking = bookings.find((b) => b.id === id);
    if (!booking) return null;
    const strikeId = `STR-${Date.now().toString().slice(-5)}`;
    const newStrikeNum = strikeHistory.length + 1;
    const newStrike: Strike = {
      id: strikeId,
      number: newStrikeNum,
      date: getLocalDateString(0),
      bookingId: id,
      bookingRoute: `${booking.from} → ${booking.to}`,
      bookingDate: booking.date,
      bookingTime: booking.departure,
      reason: 'late_cancellation',
      suspensionStart: getLocalDateString(0),
      suspensionEnd: getLocalDateString(newStrikeNum),
      status: 'aktif',
    };
    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === id ? { ...b, status: 'cancelled' as BookingStatus } : b
      ),
      strikeHistory: [newStrike, ...s.strikeHistory],
      user: { ...s.user, activeStrikes: s.user.activeStrikes + 1 },
    }));
    return strikeId;
  },

  updateStrikeStatus: (strikeId, status) =>
    set((s) => ({
      strikeHistory: s.strikeHistory.map((str) =>
        str.id === strikeId ? { ...str, status } : str
      ),
    })),

  addStrike: (bookingId, route, date, time, reason) =>
    set((s) => {
      const newStrikeNum = s.strikeHistory.length + 1;
      const newStrike: Strike = {
        id: `STR-${Date.now().toString().slice(-5)}`,
        number: newStrikeNum,
        date: getLocalDateString(0),
        bookingId,
        bookingRoute: route,
        bookingDate: date,
        bookingTime: time,
        reason,
        suspensionStart: getLocalDateString(0),
        suspensionEnd: getLocalDateString(newStrikeNum),
        status: 'aktif',
      };
      return {
        strikeHistory: [newStrike, ...s.strikeHistory],
        user: { ...s.user, activeStrikes: s.user.activeStrikes + 1 },
      };
    }),

  isSuspended: () => {
    const { strikeHistory } = get();
    const today = getLocalDateString(0);
    return strikeHistory.some(
      (s) => s.status === 'aktif' && s.suspensionEnd >= today
    );
  },

  getSuspensionEnd: () => {
    const { strikeHistory } = get();
    const today = getLocalDateString(0);
    const active = strikeHistory.find(
      (s) => s.status === 'aktif' && s.suspensionEnd >= today
    );
    return active?.suspensionEnd ?? null;
  },
}));

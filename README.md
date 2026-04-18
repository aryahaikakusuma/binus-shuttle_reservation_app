<<<<<<< HEAD
# BINUS Shuttle — Online Bus Reservation System

Web-based shuttle bus reservation system for Bina Nusantara University with Flazz Card boarding verification.

> Final project — Information Systems, Bina Nusantara University, 2026
> Arya Haika Kusuma

## Problem

Binus operates campus shuttle buses across Jabodetabek with two broken workflows:

**Alam Sutera & Bekasi corridors** use Google Forms for registration. Manual confirmation causes 10–20 min boarding delays, double-booking conflicts between form registrants and walk-ins, zero no-show accountability, and unreliable visual ID checks by drivers.

**Binus Square corridor** has no registration at all — pure FIFO queuing. Students wait 20–30+ minutes with no guarantee of getting a seat. When the bus fills up, remaining students are stranded. No demand data exists for fleet planning.

## Solution

A unified reservation platform that replaces Google Forms and FIFO queuing with real-time online booking, database-locked seat allocation, and automated Flazz Card identity verification at boarding.

Flazz Card (BCA contactless card) is used strictly as an identity token — not a payment instrument. Every card is pre-registered to a student/staff ID in the Binus identity database. Tap on the EDC/NFC reader at the bus triggers an API lookup that matches the cardholder to their reservation. No e-ticket, no QR code, no payment gateway.

## Features

**Reservation**
- Unified booking form: origin/destination selector with swap, date picker, time dropdown with live seat availability
- Two operation modes: seat-only (Alam Sutera, Bekasi, JWC, BINUS ASO) and seat + standing overflow (Binus Square)
- Variable bus types: Elf (8 seats), Minibus (16 seats), Bus Medium (30 seats)
- Single-seat radio selection per user — no group booking
- Binus Square standing slots always visible alongside seats with quantity indicators
- Database-level seat locking eliminates double booking

**Boarding Verification**
- Flazz Card tap on EDC/NFC device
- Automatic identity matching against reservation database
- Valid/invalid status displayed to driver in real-time
- Walk-in passengers logged separately for reporting

**No-Show Penalty System**
- Automatic detection: triggered when driver confirms bus arrival at destination
- Progressive strikes: Strike 1 → 1-day suspension, Strike 2 → 2 days, Strike 3 → 3 days
- Auto-reset after 1 week of compliant behavior
- Force majeure appeal: students submit evidence (class reschedule screenshot, medical certificate, emergency docs) for admin review
- Late cancellation warning with immediate appeal option

**Priority Seats**
- Configurable reserved seats for faculty/staff (default: 2 per departure)
- Auto-release to general pool 30 minutes before departure if unclaimed

**Admin & Driver Dashboards**
- Schedule and extra trip management
- Real-time occupancy monitoring per route and bus type
- No-show rate analytics and penalty appeal processing
- Driver manifest view with boarding status

## Route Network

| Route | Mode | Bus Types |
|-------|------|-----------|
| Kemanggisan ⇄ Alam Sutera | Seat-only | Elf, Bus Medium |
| Kemanggisan ⇄ Bekasi | Seat-only | Elf, Bus Medium |
| Kemanggisan ⇄ JWC (International, Senayan) | Seat-only | Elf |
| Kemanggisan ⇄ BINUS ASO School of Engineering | Seat-only | Elf |
| Binus Square ⇄ Kemanggisan | Seat + Standing | Minibus (16 seats, max 24) |
| Binus Square ⇄ Alam Sutera | Seat-only | Elf |

Kemanggisan sub-campuses: Kijang, Syahdan, Anggrek (Kampus Utama).

Standing capacity formula: `floor(total_seats × 1.5)` — configurable by admin.

## System Architecture

```
┌─────────────┐     REST API     ┌─────────────────┐     ┌───────────┐
│  React.js   │ ◄──────────────► │  Node.js +       │ ◄──►│   MySQL   │
│  Frontend   │                  │  Express.js      │     │  Database │
└─────────────┘                  └────────┬─────────┘     └───────────┘
                                          │
                              ┌───────────┴───────────┐
                              │                       │
                     ┌────────▼────────┐    ┌─────────▼────────┐
                     │ Binus Identity  │    │  EDC/NFC Reader  │
                     │ API (Flazz)     │    │  (Boarding Tap)  │
                     └─────────────────┘    └──────────────────┘
```

## Business Flow

```
1. SYSTEM ACCESS
   Login → Validate account (API) → Check suspension → Grant/block access

2. RESERVATION
   Select route → Select date/time → Check availability per bus type
   → Seat-only: pick seat → Confirm + agree to terms → DB lock → Done
   → Binus Square: pick seat OR standing → same flow

3. BOARDING VERIFICATION
   Passenger arrives → Tap Flazz on EDC → Match card ID with reservation DB
   → Valid → Board (status: verified) | Invalid → Reject

4. NO-SHOW MANAGEMENT
   Driver confirms arrival at destination → System pulls active bookings
   → Cross-reference with boarding logs → Unverified = no-show
   → Add strike → Calculate suspension → Apply
```

## Database Schema

Core tables: `Users` (incl. Flazz Card number, role), `Routes`, `Bus_Types`, `Schedules`, `Seats`, `Bookings`, `Boarding_Logs`, `Penalties`, `Penalty_Exceptions`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js (mobile-first responsive) |
| Backend | Node.js + Express.js (RESTful API) |
| Database | MySQL |
| Boarding Hardware | EDC/NFC reader (Flazz Card tap) |
| Auth | Binus SSO (identity API) |
| Methodology | SDLC + RAD (iterative prototyping) |

## Comparison: Before vs After

| Aspect | Google Form (AS/Bekasi) | FIFO (Binus Square) | This System |
|--------|------------------------|---------------------|-------------|
| Booking | Fill form, wait for manual confirm | Queue in person | Instant online confirmation |
| Wait time | 10–20 min boarding process | 20–30+ min queuing, no guarantee | < 2 sec per Flazz tap |
| Double booking | Frequent | N/A | Eliminated (DB locking) |
| No-show handling | None | N/A | Auto strike + suspension |
| Demand data | Manual spreadsheet | None | Real-time dashboard |

## References

1. Adetunji et al., "Online bus ticket reservation system," IJSRCSEIT, 2021.
2. Prasetyo & Wibowo, "Pengembangan sistem pemesanan tiket bus online berbasis web," JSakti, 2022.
3. BCA, "Flazz BCA: Kartu prabayar contactless," 2024.
4. Rahmawati et al., "Cinema e-ticket application design and usability evaluation using SUS," 2021.
5. Chen & Liu, "Design of electronic ticket system for smart tourism," 2019.
6. Kim et al., "Optimizing university campus shuttle bus congestion," IEOM, 2021.
7. Srisawat & Payakpate, "Business's TMS technology adoption," Transportation Research Procedia, 2020.
8. Harison & Syarif, "Metode RAD pada pemesanan tiket online," J. Informatika, 2019.
9. Coskun et al., "A survey on NFC technology," Wireless Personal Communications, 2013.
10. Gross et al., *Fundamentals of Queueing Theory*, 4th ed., Wiley, 2008.

## License

Academic project — Bina Nusantara University, 2026.
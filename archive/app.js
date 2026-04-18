/* ============================================================
   BINUS SHUTTLE — app.js
   Vanilla JS, no framework, hash-based routing
   ============================================================ */

/* ============================================================
   UTILITIES
   ============================================================ */

function daysFromToday(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  // Use local time components to avoid UTC offset issues (app runs in UTC+7)
  const y  = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${dy}`;
}

const ID_DAYS   = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const ID_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function formatDateChip(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = daysFromToday(0);
  const tomorrow = daysFromToday(1);
  return {
    day: d.getDate(),
    mon: ID_MONTHS[d.getMonth()],
    weekday: dateStr === today ? 'Hari Ini' : dateStr === tomorrow ? 'Besok' : ID_DAYS[d.getDay()],
    isToday: dateStr === today,
    isTomorrow: dateStr === tomorrow
  };
}

function formatDateFull(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  const today = daysFromToday(0);
  const tomorrow = daysFromToday(1);
  if (dateStr === today)    return `Hari Ini, ${d.getDate()} ${ID_MONTHS[d.getMonth()]}`;
  if (dateStr === tomorrow) return `Besok, ${d.getDate()} ${ID_MONTHS[d.getMonth()]}`;
  return `${ID_DAYS[d.getDay()]} ${d.getDate()} ${ID_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat Pagi,';
  if (h < 15) return 'Selamat Siang,';
  if (h < 18) return 'Selamat Sore,';
  return 'Selamat Malam,';
}

function simpleHash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  return Math.abs(h >>> 0);
}

function generateOccupied(key, total) {
  const h = simpleHash(key);
  const count = 10 + (h % 25); // 10–34 occupied
  const occupied = new Set();
  let seed = h;
  let iters = 0;
  while (occupied.size < count && iters < 10000) {
    seed = ((seed * 1664525) + 1013904223) >>> 0;
    occupied.add((seed % total) + 1);
    iters++;
  }
  return occupied;
}

function getSlotKey(from, to, date, time) {
  return `${from}|${to}|${date}|${time}`;
}

function getOccupied(from, to, date, time) {
  // Full-slot demo: Binus Square → Anggrek today 09:00 has all 40 seats occupied
  const key = getSlotKey(from, to, date, time);
  const fullKey = getSlotKey('Binus Square', 'Anggrek (Kampus Utama)', daysFromToday(0), '09:00');
  if (key === fullKey) {
    const all = new Set();
    for (let i = 1; i <= 40; i++) all.add(i);
    return all;
  }
  return generateOccupied(key, 40);
}

function getSeatsAvailable(from, to, date, time) {
  const occ = getOccupied(from, to, date, time);
  return 40 - occ.size;
}

function maskFlazz(num) {
  return num.replace(/(\d{4})\s\d{4}\s\d{4}\s(\d{4})/, '$1 •••• •••• $2');
}

function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [path, qs = ''] = raw.split('?');
  const params = Object.fromEntries(new URLSearchParams(qs));
  return { path: path || 'login', params };
}

// seat label from 1-based number (1→"1A", 2→"1B", 3→"1C", 4→"1D", 5→"2A"…)
function seatLabel(n) {
  const row = Math.ceil(n / 4);
  const col = 'ABCD'[(n - 1) % 4];
  return `${row}${col}`;
}

// seat number from label ("2C" → 7)
function seatNum(label) {
  const row = parseInt(label.slice(0, -1), 10);
  const col = 'ABCD'.indexOf(label.slice(-1));
  return (row - 1) * 4 + col + 1;
}

function icon(name, size = 18, extraClass = '') {
  return `<i data-lucide="${name}" class="icon ${extraClass}" style="width:${size}px;height:${size}px;"></i>`;
}

function createIcons() {
  if (window.lucide) lucide.createIcons();
}

/* ============================================================
   MOCK DATA
   ============================================================ */

const MOCK = {
  user: {
    name:  'Arya Haika Kusuma',
    nim:   '2602123456',
    role:  'Undergraduate',
    flazz: '6032 1234 5678 4421'
  },
  stops: ['Alam Sutera', 'Bekasi', 'Binus Square', 'Anggrek (Kampus Utama)'],
  validRoutes: [
    { from: 'Alam Sutera',           to: 'Anggrek (Kampus Utama)', type: 'seat-only'     },
    { from: 'Anggrek (Kampus Utama)', to: 'Alam Sutera',           type: 'seat-only'     },
    { from: 'Bekasi',                 to: 'Anggrek (Kampus Utama)', type: 'seat-only'     },
    { from: 'Anggrek (Kampus Utama)', to: 'Bekasi',                 type: 'seat-only'     },
    { from: 'Binus Square',           to: 'Anggrek (Kampus Utama)', type: 'seat-overflow' },
    { from: 'Anggrek (Kampus Utama)', to: 'Binus Square',           type: 'seat-overflow' },
  ],
  timeSlots: ['06:30', '07:30', '09:00', '12:00', '14:00', '16:00', '18:00'],
  routeCards: [
    { from: 'Alam Sutera',  to: 'Anggrek (Kampus Utama)', type: 'seat-only',     nextDep: '07:30' },
    { from: 'Bekasi',       to: 'Anggrek (Kampus Utama)', type: 'seat-only',     nextDep: '08:00' },
    { from: 'Binus Square', to: 'Anggrek (Kampus Utama)', type: 'seat-overflow', nextDep: '07:30' }
  ],
  strikes: 0,

  get bookings() {
    return [
      {
        id:     'BNS-2024-001',
        from:   'Binus Square',
        to:     'Anggrek (Kampus Utama)',
        date:   daysFromToday(1),
        time:   '07:30',
        seat:   '12A',
        type:   'seat',
        status: 'Confirmed'
      },
      {
        id:     'BNS-2024-000',
        from:   'Alam Sutera',
        to:     'Anggrek (Kampus Utama)',
        date:   daysFromToday(-3),
        time:   '09:00',
        seat:   '7B',
        type:   'seat',
        status: 'Completed'
      }
    ];
  }
};

/* ============================================================
   STATE
   ============================================================ */

const STATE = {
  loggedIn:           false,
  showPassword:       false,
  draft: {
    from:   null,
    to:     null,
    date:   daysFromToday(0),  // default today
    time:   null,
    seatId: null
  },
  bookings:           MOCK.bookings.slice(),
  activeSheet:        null,   // 'from' | 'to' | 'date' | 'time' | null
  bookingsTab:        'upcoming',
  confirmAccordion:   false,
  strikeDrawerOpen:   false,
  swapped:            false,
  loginNim:           '',
  loginPwd:           ''
};

/* ============================================================
   ROUTE HELPERS
   ============================================================ */

function getRouteType(from, to) {
  if (!from || !to) return null;
  const r = MOCK.validRoutes.find(v => v.from === from && v.to === to);
  return r ? r.type : null;
}

function getRouteError(from, to) {
  if (!from || !to) return null;
  if (from === to) return 'Pilih tujuan berbeda';
  if (!getRouteType(from, to)) return 'Rute ini tidak tersedia';
  return null;
}

function canProceedBook() {
  const { from, to, date, time } = STATE.draft;
  return from && to && date && time && !getRouteError(from, to);
}

/* ============================================================
   NAVIGATION
   ============================================================ */

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function navigate(hash) {
  // Reset transient sheet state on navigation
  STATE.activeSheet = null;
  STATE.confirmAccordion = false;
  window.location.hash = hash;
  // hashchange calls render()
}

function render() {
  const { path, params } = parseHash();

  // Guard: unauthenticated → login
  if (!STATE.loggedIn && path !== 'login') {
    window.location.hash = '#/login';
    renderLogin();
    return;
  }

  switch (path) {
    case 'login':    renderLogin();                  break;
    case 'home':     renderHome();                   break;
    case 'book':     renderBook();                   break;
    case 'seats':    renderSeats();                  break;
    case 'confirm':  renderConfirm();                break;
    case 'ticket':   renderTicket(params.id || ''); break;
    case 'bookings': renderBookings(STATE.bookingsTab); break;
    case 'profile':  renderProfile();                break;
    default:
      if (STATE.loggedIn) renderHome();
      else renderLogin();
  }
}

/* ============================================================
   TAB BAR
   ============================================================ */

function tabBar(active) {
  const tabs = [
    { id: 'home',     label: 'Home',     lucide: 'home',           hash: '#/home'     },
    { id: 'bookings', label: 'Pemesanan', lucide: 'calendar-check', hash: '#/bookings' },
    { id: 'profile',  label: 'Profil',   lucide: 'user',           hash: '#/profile'  }
  ];
  return tabs.map(t => `
    <div class="tab-item ${active === t.id ? 'active' : ''}" data-action="navigate" data-hash="${t.hash}">
      ${icon(t.lucide, 22)}
      <span>${t.label}</span>
    </div>
  `).join('');
}

/* ============================================================
   SCREEN: LOGIN
   ============================================================ */

function renderLogin() {
  const nim = STATE.loginNim;
  const pwd = STATE.loginPwd;
  const canLogin = nim.trim().length > 0 && pwd.trim().length > 0;

  document.getElementById('app').innerHTML = `
    <div class="screen login-screen" id="screen-login">
      <div class="login-logo">
        ${icon('bus', 32, 'logo-icon')}
        <div class="logo-text">
          <span class="logo-binus">BINUS</span>
          <span class="logo-shuttle">Shuttle</span>
        </div>
      </div>
      <p class="login-subtitle">Masuk dengan akun Binus Anda.</p>

      <div class="login-form">
        <label class="input-label" for="nim-input">Binus ID / NIM</label>
        <div class="input-wrap">
          <span class="input-icon">${icon('user', 16)}</span>
          <input
            id="nim-input"
            class="input-field input-prefix"
            type="text"
            placeholder="Contoh: 2602123456"
            autocomplete="username"
            value="${escHtml(nim)}"
          />
        </div>

        <label class="input-label" for="pwd-input">Password</label>
        <div class="input-wrap">
          <span class="input-icon">${icon('lock', 16)}</span>
          <input
            id="pwd-input"
            class="input-field input-prefix"
            type="${STATE.showPassword ? 'text' : 'password'}"
            placeholder="Password BinusMaya"
            autocomplete="current-password"
            value="${escHtml(pwd)}"
          />
          <span class="input-suffix" data-action="toggle-password">
            ${icon(STATE.showPassword ? 'eye-off' : 'eye', 18)}
          </span>
        </div>

        <button
          id="sign-in-btn"
          class="btn-primary ${canLogin ? '' : 'btn-disabled'}"
          data-action="sign-in"
          ${canLogin ? '' : 'disabled'}
        >
          ${icon('log-in', 18)} Masuk
        </button>

        <div class="login-forgot" data-action="noop">Lupa password?</div>
      </div>

      <div class="login-footer">
        ${icon('shield-check', 14)} Diamankan oleh BinusMaya SSO
      </div>
    </div>
  `;
  createIcons();

  // Live enable/disable sign-in button
  const nimEl = document.getElementById('nim-input');
  const pwdEl = document.getElementById('pwd-input');
  const btn   = document.getElementById('sign-in-btn');
  function syncBtn() {
    const ok = nimEl.value.trim() && pwdEl.value.trim();
    btn.disabled = !ok;
    btn.classList.toggle('btn-disabled', !ok);
    STATE.loginNim = nimEl.value;
    STATE.loginPwd = pwdEl.value;
  }
  nimEl.addEventListener('input', syncBtn);
  pwdEl.addEventListener('input', syncBtn);
}

/* ============================================================
   SCREEN: HOME
   ============================================================ */

function renderHome() {
  const upcoming = STATE.bookings.find(b => b.status === 'Confirmed');
  const today = daysFromToday(0);

  const upcomingHtml = upcoming ? `
    <div class="upcoming-card">
      <div class="upcoming-header">
        <span class="upcoming-label">Perjalanan Berikutnya</span>
        <span class="status-pill pill-confirmed">${icon('check-circle', 12)} Confirmed</span>
      </div>
      <div class="upcoming-route">${escHtml(upcoming.from)} → ${escHtml(upcoming.to)}</div>
      <div class="upcoming-meta">
        <div class="meta-item">${icon('calendar', 13)} <strong>${formatDateFull(upcoming.date)}</strong></div>
        <div class="meta-item">${icon('clock', 13)} <strong>${upcoming.time}</strong></div>
        <div class="meta-item">${icon('armchair', 13)} <strong>${upcoming.type === 'standing' ? 'Berdiri' : 'Kursi ' + upcoming.seat}</strong></div>
      </div>
      <button class="btn-primary" style="height:40px;font-size:13px;" data-action="navigate" data-hash="#/bookings">
        ${icon('ticket', 16)} Lihat Tiket
      </button>
    </div>
  ` : `
    <div class="upcoming-card">
      <div class="upcoming-header">
        <span class="upcoming-label">Perjalanan Berikutnya</span>
      </div>
      <div style="text-align:center;padding:8px 0 4px;">
        <div style="color:var(--ink-400);font-size:13px;font-weight:500;">Belum ada perjalanan terjadwal</div>
      </div>
      <button class="btn-primary" style="height:40px;font-size:13px;margin-top:12px;" data-action="navigate" data-hash="#/book">
        ${icon('plus', 16)} Pesan Sekarang
      </button>
    </div>
  `;

  // Route cards
  const routeCardsHtml = MOCK.routeCards.map(r => {
    const avail = getSeatsAvailable(r.from, r.to, today, r.nextDep);
    const pct   = (avail / 40) * 100;
    const dotCls = avail >= 15 ? 'sf-green' : avail >= 5 ? 'sf-orange' : 'sf-red';
    return `
      <div class="route-card" style="cursor:pointer;" data-action="navigate" data-hash="#/book">
        <div class="route-info">
          <div class="route-name">${escHtml(r.from)} ⇄ ${escHtml(r.to)}</div>
          <div class="route-next">Berikutnya: ${r.nextDep}</div>
          <div class="seats-bar-wrap">
            <div class="seats-bar"><div class="seats-fill ${dotCls}" style="width:${pct}%"></div></div>
            <span class="seats-text">${avail} kursi</span>
            <span class="chip ${r.type === 'seat-only' ? 'chip-gray' : 'chip-orange'}" style="font-size:10px;padding:2px 8px;">
              ${r.type === 'seat-only' ? 'Seat Only' : 'Seat + Berdiri'}
            </span>
          </div>
        </div>
        <button class="btn-primary" style="width:auto;height:36px;padding:0 14px;font-size:12px;" data-action="navigate" data-hash="#/book">
          Pesan
        </button>
      </div>
    `;
  }).join('');

  document.getElementById('app').innerHTML = `
    <div class="screen" id="screen-home">
      <div class="hero-banner">
        <div class="hero-row">
          <div>
            <div class="hero-greeting">${getGreeting()}</div>
            <div class="hero-name">${escHtml(MOCK.user.name)}</div>
            <span class="chip chip-white">${MOCK.user.role}</span>
          </div>
          <div class="avatar-circle">${MOCK.user.name.charAt(0)}</div>
        </div>
      </div>

      <div class="screen-body">
        ${upcomingHtml}

        <div class="section-title">Layanan Cepat</div>
        <div class="quick-actions">
          <div class="action-item" data-action="navigate" data-hash="#/book">
            <div class="action-icon ai-orange">${icon('bus', 24)}</div>
            <div class="action-label">Pesan<br>Shuttle</div>
          </div>
          <div class="action-item" data-action="navigate" data-hash="#/bookings">
            <div class="action-icon ai-blue">${icon('calendar-check', 24)}</div>
            <div class="action-label">Pemesanan<br>Saya</div>
          </div>
          <div class="action-item" data-action="navigate" data-hash="#/bookings">
            <div class="action-icon ai-green">${icon('ticket', 24)}</div>
            <div class="action-label">E-Tiket<br>Saya</div>
          </div>
          <div class="action-item" data-action="navigate" data-hash="#/profile">
            <div class="action-icon ai-red">${icon('alert-triangle', 24)}</div>
            <div class="action-label">Status<br>Penalti</div>
          </div>
        </div>

        <div class="section-title">Rute Shuttle</div>
        <div class="route-list">${routeCardsHtml}</div>

        <div class="announce-card">
          <span class="announce-icon">${icon('megaphone', 18)}</span>
          <div>
            <div class="announce-title">Informasi Terbaru</div>
            <div class="announce-body">Baru: Kursi overflow kini tersedia pada rute Binus Square. Pastikan Flazz Card Anda aktif sebelum boarding.</div>
          </div>
        </div>

        <div style="height:8px;"></div>
      </div>

      <nav class="tab-bar">${tabBar('home')}</nav>
    </div>
  `;
  createIcons();
}

/* ============================================================
   SCREEN: BOOKING FORM (#/book)
   ============================================================ */

function renderBook() {
  const { from, to, date, time } = STATE.draft;
  const routeErr = getRouteError(from, to);
  const routeOk  = from && to && !routeErr;
  const canGo    = canProceedBook();

  // Field state classes
  function fieldCls(hasVal, isErr) {
    if (!hasVal) return '';
    return isErr ? 'f-error' : 'f-valid';
  }
  function iconCls(hasVal, isErr) {
    if (!hasVal) return '';
    return isErr ? 'fi-error' : 'fi-valid';
  }

  const fromCls = fieldCls(!!from, !!routeErr);
  const toCls   = fieldCls(!!to,   !!routeErr);
  const dateCls = fieldCls(!!date, false);
  const timeCls = fieldCls(!!time, false);

  const fromIconCls = iconCls(!!from, !!routeErr);
  const toIconCls   = iconCls(!!to,   !!routeErr);

  // Trip summary
  let summaryHtml = '';
  if (from && to && date) {
    const routeType = getRouteType(from, to);
    const avail = (from && to && date && time) ? getSeatsAvailable(from, to, date, time) : null;
    const summaryValid = canGo;
    summaryHtml = `
      <div class="trip-summary ${summaryValid ? 'ts-valid' : ''}">
        <div class="trip-icon">${icon('bus', 20)}</div>
        <div>
          <div class="trip-route">${escHtml(from)} → ${escHtml(to)}</div>
          <div class="trip-meta">
            ${formatDateFull(date)}${time ? ' · <strong>' + time + '</strong>' : ''}
            ${avail !== null ? ' · ' + avail + ' kursi tersisa' : ''}
          </div>
        </div>
      </div>
    `;
  }

  // Bottom sheets (all rendered, only active one has .open class)
  const fromSheetOpen = STATE.activeSheet === 'from' ? 'open' : '';
  const toSheetOpen   = STATE.activeSheet === 'to'   ? 'open' : '';
  const dateSheetOpen = STATE.activeSheet === 'date' ? 'open' : '';
  const timeSheetOpen = STATE.activeSheet === 'time' ? 'open' : '';

  // Stop list HTML for from/to sheets
  function stopListHtml(activeStop, sheetFor) {
    return MOCK.stops.map(s => {
      const sel = s === activeStop ? 'selected' : '';
      return `
        <div class="sheet-item ${sel}" data-action="pick-stop" data-field="${sheetFor}" data-stop="${escHtml(s)}">
          <div class="sheet-item-main">
            <div class="sheet-item-icon">${icon('map-pin', 16)}</div>
            <span class="sheet-item-name">${escHtml(s)}</span>
          </div>
          ${sel ? `<span class="sheet-check">${icon('check', 16)}</span>` : ''}
        </div>
      `;
    }).join('');
  }

  // Date chips
  const dates = Array.from({ length: 7 }, (_, i) => daysFromToday(i));
  const dateChipsHtml = dates.map(d => {
    const info = formatDateChip(d);
    const sel  = d === date ? 'selected' : '';
    return `
      <div class="date-chip ${sel}" data-action="pick-date" data-date="${d}">
        <div class="date-chip-day">${info.weekday.length > 3 ? info.weekday.slice(0,3) : info.weekday}</div>
        <div class="date-chip-num">${info.day}</div>
        <div class="date-chip-mon">${info.mon}</div>
      </div>
    `;
  }).join('');

  // Time slots
  const timeSlotsHtml = MOCK.timeSlots.map(t => {
    const avail = (from && to && date) ? getSeatsAvailable(from, to, date, t) : 40;
    const dotCls = avail >= 15 ? 'dot-green' : avail >= 5 ? 'dot-orange' : 'dot-red';
    const sel    = t === time ? 'selected' : '';
    return `
      <div class="time-slot-item ${sel}" data-action="pick-time" data-time="${t}">
        <span class="time-main">${t}</span>
        <div class="time-info">
          <div class="time-route">${from && to ? `${escHtml(from)} → ${escHtml(to)}` : 'Pilih rute terlebih dahulu'}</div>
          <div class="time-seats">
            <span class="seat-dot ${dotCls}"></span>
            ${avail} kursi tersedia
          </div>
        </div>
        ${sel ? `<span class="time-check">${icon('check', 16)}</span>` : ''}
      </div>
    `;
  }).join('');

  document.getElementById('app').innerHTML = `
    <div class="screen" id="screen-book" style="position:relative;">
      <div class="nav-bar">
        <button class="btn-icon" data-action="go-back">${icon('arrow-left', 20)}</button>
        <span class="nav-title">Pesan Shuttle</span>
      </div>

      <div class="screen-body">
        <div style="padding:16px;display:flex;flex-direction:column;gap:12px;">

          <!-- FORM CARD -->
          <div class="card" style="padding:16px;">
            <div class="form-section-label">Rute Perjalanan</div>

            <!-- FROM field -->
            <div class="field-row ${fromCls}" data-action="open-sheet" data-sheet="from">
              <span class="field-icon ${fromIconCls}">${icon('map-pin', 16)}</span>
              <div class="field-content">
                <div class="field-label">DARI</div>
                <div class="field-value ${from ? '' : 'placeholder'}">${from ? escHtml(from) : 'Pilih asal...'}</div>
              </div>
              <span class="field-caret">${icon('chevron-down', 16)}</span>
            </div>

            <!-- SWAP + DIVIDER -->
            <div class="fields-divider">
              <div class="divider-line"></div>
              <button class="swap-btn ${STATE.swapped ? 'swapped' : ''}" data-action="swap-route" title="Tukar rute">
                ${icon('arrow-up-down', 14)}
              </button>
              <div class="divider-line"></div>
            </div>

            <!-- TO field -->
            <div class="field-row ${toCls}" data-action="open-sheet" data-sheet="to">
              <span class="field-icon ${toIconCls}">${icon('map-pin', 16)}</span>
              <div class="field-content">
                <div class="field-label">TUJUAN</div>
                <div class="field-value ${to ? '' : 'placeholder'}">${to ? escHtml(to) : 'Pilih tujuan...'}</div>
              </div>
              <span class="field-caret">${icon('chevron-down', 16)}</span>
            </div>

            <!-- ROUTE ERROR -->
            ${routeErr ? `
              <div class="field-error-msg">
                ${icon('info', 14)}
                ${routeErr === 'Pilih tujuan berbeda'
                  ? 'Pilih tujuan berbeda'
                  : 'Rute ini tidak tersedia. Coba rute ke Anggrek (Kampus Utama).'}
              </div>
            ` : ''}

            <div class="form-divider"></div>
            <div class="form-section-label">Jadwal</div>

            <!-- DATE field -->
            <div class="field-row ${dateCls}" style="margin-bottom:10px;" data-action="open-sheet" data-sheet="date">
              <span class="field-icon ${dateCls === 'f-valid' ? 'fi-valid' : ''}">${icon('calendar', 16)}</span>
              <div class="field-content">
                <div class="field-label">TANGGAL</div>
                <div class="field-value">${date ? formatDateFull(date) : 'Pilih tanggal...'}</div>
              </div>
              <span class="field-caret">${icon('chevron-down', 16)}</span>
            </div>

            <!-- TIME field -->
            <div class="field-row ${timeCls}" data-action="open-sheet" data-sheet="time">
              <span class="field-icon ${timeCls === 'f-valid' ? 'fi-valid' : ''}">${icon('clock', 16)}</span>
              <div class="field-content">
                <div class="field-label">JAM KEBERANGKATAN</div>
                <div class="field-value ${time ? '' : 'placeholder'}">${time ? time : 'Pilih jam...'}</div>
              </div>
              <span class="field-caret">${icon('chevron-down', 16)}</span>
            </div>
          </div>

          <!-- TRIP SUMMARY -->
          ${summaryHtml}

        </div>
      </div>

      <!-- STICKY CTA -->
      <div class="sticky-cta">
        <button class="btn-primary ${canGo ? '' : 'btn-disabled'}" data-action="go-seats" ${canGo ? '' : 'disabled'}>
          ${icon('search', 18)} Cari Kursi
        </button>
      </div>

      <!-- BOTTOM SHEETS -->

      <!-- FROM sheet -->
      <div class="sheet-backdrop ${fromSheetOpen}" data-action="close-sheet">
        <div class="bottom-sheet">
          <div class="sheet-handle"></div>
          <div class="sheet-title">Pilih Asal</div>
          ${stopListHtml(from, 'from')}
        </div>
      </div>

      <!-- TO sheet -->
      <div class="sheet-backdrop ${toSheetOpen}" data-action="close-sheet">
        <div class="bottom-sheet">
          <div class="sheet-handle"></div>
          <div class="sheet-title">Pilih Tujuan</div>
          ${stopListHtml(to, 'to')}
        </div>
      </div>

      <!-- DATE sheet -->
      <div class="sheet-backdrop ${dateSheetOpen}" data-action="close-sheet">
        <div class="bottom-sheet">
          <div class="sheet-handle"></div>
          <div class="sheet-title">Pilih Tanggal</div>
          <div class="date-chips">${dateChipsHtml}</div>
        </div>
      </div>

      <!-- TIME sheet -->
      <div class="sheet-backdrop ${timeSheetOpen}" data-action="close-sheet">
        <div class="bottom-sheet">
          <div class="sheet-handle"></div>
          <div class="sheet-title">Pilih Jam Keberangkatan</div>
          ${timeSlotsHtml}
        </div>
      </div>

    </div>
  `;
  createIcons();
}

/* ============================================================
   SCREEN: SEAT SELECTION (#/seats)
   ============================================================ */

function renderSeats() {
  const { from, to, date, time, seatId } = STATE.draft;
  const routeType = getRouteType(from, to);
  const occupied  = getOccupied(from, to, date, time);
  const allFull   = occupied.size >= 40;
  const showStanding = routeType === 'seat-overflow' && allFull;

  // Save scroll position
  const prevScroll = document.querySelector('#screen-seats .screen-body')?.scrollTop || 0;

  // Build seat rows
  let seatRowsHtml = '';
  for (let row = 1; row <= 10; row++) {
    const seatsInRow = ['A','B','C','D'].map(col => {
      const num   = (row - 1) * 4 + 'ABCD'.indexOf(col) + 1;
      const label = `${row}${col}`;
      const isOcc = occupied.has(num);
      const isSel = seatId === label;
      let cls = 'seat';
      if (isOcc) cls += ' seat-occupied';
      if (isSel) cls += ' seat-selected';
      const action = isOcc ? '' : `data-action="select-seat" data-seat="${label}"`;
      return `<button class="${cls}" ${action} ${isOcc ? 'disabled' : ''}>${label}</button>`;
    });

    seatRowsHtml += `
      <div class="seat-row">
        ${seatsInRow[0]}
        ${seatsInRow[1]}
        <div class="seat-aisle"></div>
        ${seatsInRow[2]}
        ${seatsInRow[3]}
      </div>
    `;
  }

  // Standing slots (B1–B20)
  let standingHtml = '';
  if (showStanding) {
    const slots = Array.from({ length: 20 }, (_, i) => `B${i + 1}`);
    const standingGridHtml = slots.map(s => {
      const isSel = seatId === s;
      return `
        <div class="standing-slot ${isSel ? 'seat-selected' : ''}" data-action="select-seat" data-seat="${s}">
          ${s}
        </div>
      `;
    }).join('');
    standingHtml = `
      <div class="standing-section">
        <div class="standing-header">Area Berdiri (Overflow) — 20 slot</div>
        <div class="standing-grid">${standingGridHtml}</div>
      </div>
    `;
  }

  // Strip label
  let stripLabel = '<span style="color:var(--ink-400);">—</span>';
  if (seatId) {
    const isStanding = seatId.startsWith('B');
    stripLabel = isStanding
      ? `Berdiri: <strong>${escHtml(seatId)}</strong>`
      : `Kursi: <strong>${escHtml(seatId)}</strong>`;
  }

  // Sticky top route summary
  const topSummary = `${escHtml(from || '?')} → ${escHtml(to || '?')} · ${formatDateFull(date)} · ${time || '?'}`;

  document.getElementById('app').innerHTML = `
    <div class="screen" id="screen-seats" style="position:relative;">
      <div class="nav-bar">
        <button class="btn-icon" data-action="go-back">${icon('arrow-left', 20)}</button>
        <div style="flex:1;min-width:0;">
          <div class="nav-title" style="font-size:14px;">Pilih Kursi</div>
          <div style="font-size:11px;color:var(--ink-400);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${topSummary}</div>
        </div>
      </div>

      <!-- LEGEND -->
      <div class="seat-legend">
        <div class="legend-item"><div class="legend-swatch ls-available"></div>Tersedia</div>
        <div class="legend-item"><div class="legend-swatch ls-selected"></div>Dipilih</div>
        <div class="legend-item"><div class="legend-swatch ls-occupied"></div>Terisi</div>
      </div>

      <div class="screen-body">
        <div class="bus-wrap">
          <div class="bus-outer">
            <!-- Driver -->
            <div class="driver-row">
              <div class="driver-seat">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="3"/>
                  <line x1="12" y1="2" x2="12" y2="9"/>
                  <line x1="12" y1="15" x2="12" y2="22"/>
                  <line x1="2" y1="12" x2="9" y2="12"/>
                  <line x1="15" y1="12" x2="22" y2="12"/>
                </svg>
              </div>
            </div>

            <!-- Seat grid -->
            <div class="seat-rows">${seatRowsHtml}</div>
          </div>

          ${standingHtml}
        </div>
        <div style="height:8px;"></div>
      </div>

      <!-- STICKY BOTTOM STRIP -->
      <div class="seat-strip">
        <div class="seat-strip-label">
          ${seatId ? stripLabel : '<span style="color:var(--ink-400);font-size:13px;">Pilih kursi</span>'}
        </div>
        <button
          class="btn-primary ${seatId ? '' : 'btn-disabled'}"
          data-action="go-confirm"
          ${seatId ? '' : 'disabled'}
          style="flex:1;max-width:200px;"
        >
          ${icon('arrow-right', 16)} Lanjut ke Konfirmasi
        </button>
      </div>
    </div>
  `;
  createIcons();

  // Restore scroll
  const bodyEl = document.querySelector('#screen-seats .screen-body');
  if (bodyEl) bodyEl.scrollTop = prevScroll;
}

/* ============================================================
   SCREEN: BOOKING CONFIRMATION (#/confirm)
   ============================================================ */

function renderConfirm() {
  const { from, to, date, time, seatId } = STATE.draft;
  const isStanding = seatId && seatId.startsWith('B');
  const seatBadge  = isStanding
    ? `<span class="status-pill pill-standing">Berdiri ${seatId}</span>`
    : `<span class="status-pill pill-seat">Kursi ${seatId || '—'}</span>`;

  const strikeChip = MOCK.strikes === 0
    ? `<span class="chip chip-green">${icon('check-circle', 12)} Tidak ada strike aktif</span>`
    : `<span class="chip chip-orange">${icon('alert-triangle', 12)} ${MOCK.strikes} strike aktif</span>`;

  document.getElementById('app').innerHTML = `
    <div class="screen" id="screen-confirm" style="position:relative;">
      <div class="nav-bar">
        <button class="btn-icon" data-action="go-back">${icon('arrow-left', 20)}</button>
        <span class="nav-title">Konfirmasi Pesanan</span>
      </div>

      <div class="screen-body">
        <div style="padding:16px;display:flex;flex-direction:column;gap:12px;">

          <!-- TRIP SUMMARY CARD -->
          <div class="summary-card">
            <div class="summary-top">
              <div class="summary-route-label">Rute Perjalanan</div>
              <div class="summary-route-name">${escHtml(from || '?')} → ${escHtml(to || '?')}</div>
            </div>
            <div class="summary-body">
              <div class="summary-row">${icon('calendar', 14)} <strong>${formatDateFull(date)}</strong></div>
              <div class="summary-row">${icon('clock', 14)} Keberangkatan <strong>${time || '—'}</strong> · ~45 menit</div>
              <div class="summary-row">${icon('armchair', 14)} ${seatBadge}</div>
            </div>
          </div>

          <!-- PASSENGER CARD -->
          <div class="passenger-card">
            <div class="pax-header">Data Penumpang</div>
            <div class="pax-row">
              <span class="pax-label">Nama</span>
              <span class="pax-value">${escHtml(MOCK.user.name)}</span>
            </div>
            <div class="pax-row">
              <span class="pax-label">NIM</span>
              <span class="pax-value">${escHtml(MOCK.user.nim)}</span>
            </div>
            <div class="pax-row">
              <span class="pax-label">Flazz Card</span>
              <span class="pax-value" style="font-family:monospace;">${maskFlazz(MOCK.user.flazz)}</span>
            </div>
          </div>

          <!-- CANCELLATION POLICY ACCORDION -->
          <div class="accordion">
            <div class="accordion-header" data-action="toggle-accordion">
              <span>${icon('file-text', 16)} &nbsp;Kebijakan Pembatalan</span>
              <span class="accordion-icon ${STATE.confirmAccordion ? 'open' : ''}">${icon('chevron-down', 18)}</span>
            </div>
            ${STATE.confirmAccordion ? `
              <div class="accordion-body">
                Pembatalan gratis hingga H-1 sebelum keberangkatan.<br>
                <strong>No-show</strong> atau pembatalan di hari-H akan menghasilkan 1 strike.
                Akumulasi 3 strike menyebabkan pembekuan akun selama 30 hari.
              </div>
            ` : ''}
          </div>

          <!-- STRIKE STATUS -->
          <div class="card" style="padding:14px 16px;display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:13px;font-weight:600;color:var(--ink-900);">Status Strike</span>
            ${strikeChip}
          </div>

          <div style="height:4px;"></div>
        </div>
      </div>

      <!-- STICKY CTA -->
      <div class="sticky-cta">
        <button class="btn-primary" data-action="confirm-booking">
          ${icon('check-circle', 18)} Konfirmasi Pesanan
        </button>
      </div>
    </div>
  `;
  createIcons();
}

/* ============================================================
   SCREEN: E-TICKET (#/ticket?id=)
   ============================================================ */

function renderTicket(id) {
  const booking = STATE.bookings.find(b => b.id === id);
  if (!booking) {
    document.getElementById('app').innerHTML = `
      <div class="screen" id="screen-ticket">
        <div class="nav-bar">
          <button class="btn-icon" data-action="navigate" data-hash="#/bookings">${icon('arrow-left', 20)}</button>
          <span class="nav-title">E-Tiket</span>
        </div>
        <div class="screen-body" style="padding:40px 24px;text-align:center;">
          <div style="color:var(--ink-400);font-size:14px;">Tiket tidak ditemukan.</div>
        </div>
      </div>
    `;
    createIcons();
    return;
  }

  const isStanding = booking.type === 'standing';
  const seatBadge  = isStanding
    ? `<span class="status-pill pill-standing">Berdiri ${booking.seat}</span>`
    : `<span class="status-pill pill-seat">Kursi ${booking.seat}</span>`;

  document.getElementById('app').innerHTML = `
    <div class="screen" id="screen-ticket" style="background:var(--bg);">
      <div class="nav-bar" style="background:var(--bg);border-bottom:none;">
        <button class="btn-icon" style="background:var(--card);" data-action="navigate" data-hash="#/bookings">${icon('arrow-left', 20)}</button>
        <span class="nav-title">E-Tiket</span>
      </div>

      <div class="ticket-screen-body">
        <div class="ticket-card">
          <!-- TOP (gradient) -->
          <div class="ticket-top">
            <div class="ticket-brand">BINUS Shuttle · E-Ticket</div>
            <div class="ticket-id">${escHtml(booking.id)}</div>
          </div>

          <!-- PERFORATED DIVIDER -->
          <div class="ticket-perf" style="margin:0 -1px;">
            <div class="ticket-perf-line"></div>
          </div>

          <!-- BODY -->
          <div class="ticket-body">
            <!-- Route row -->
            <div class="ticket-route-row">
              <div class="ticket-stop">
                <div class="ticket-stop-label">DARI</div>
                <div class="ticket-stop-name">${escHtml(booking.from)}</div>
                <div class="ticket-stop-time">${booking.time}</div>
              </div>
              <div class="ticket-arrow">${icon('arrow-right', 20)}</div>
              <div class="ticket-stop" style="text-align:right;">
                <div class="ticket-stop-label">TUJUAN</div>
                <div class="ticket-stop-name">${escHtml(booking.to)}</div>
                <div class="ticket-stop-time" style="color:var(--teal-start);">±45 min</div>
              </div>
            </div>

            <!-- Details grid -->
            <div class="ticket-details">
              <div class="td-item">
                <div class="td-label">Tanggal</div>
                <div class="td-value">${formatDateFull(booking.date)}</div>
              </div>
              <div class="td-item">
                <div class="td-label">Tempat Duduk</div>
                <div class="td-value">${seatBadge}</div>
              </div>
              <div class="td-item">
                <div class="td-label">Nama</div>
                <div class="td-value">${escHtml(MOCK.user.name)}</div>
              </div>
              <div class="td-item">
                <div class="td-label">NIM</div>
                <div class="td-value">${escHtml(MOCK.user.nim)}</div>
              </div>
            </div>

            <!-- QR placeholder -->
            <div class="qr-placeholder">
              <div class="qr-icon">${icon('qr-code', 40)}</div>
              <div class="qr-text">Tap Flazz Card saat boarding</div>
              <div class="qr-subtext">${maskFlazz(MOCK.user.flazz)}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- TICKET ACTIONS -->
      <div class="ticket-actions">
        <button class="btn-outline btn-danger" style="flex:1;" data-action="cancel-booking" data-id="${escHtml(booking.id)}">
          ${icon('x-circle', 16)} Batalkan
        </button>
        <button class="btn-outline" style="flex:1;" data-action="noop">
          ${icon('share-2', 16)} Bagikan
        </button>
      </div>
    </div>
  `;
  createIcons();
}

/* ============================================================
   SCREEN: BOOKINGS (#/bookings)
   ============================================================ */

function renderBookings(tab) {
  STATE.bookingsTab = tab || 'upcoming';

  const upcoming = STATE.bookings.filter(b => b.status === 'Confirmed');
  const past     = STATE.bookings.filter(b => b.status !== 'Confirmed');

  const list = STATE.bookingsTab === 'upcoming' ? upcoming : past;

  function pillClass(status) {
    switch(status) {
      case 'Confirmed': return 'pill-confirmed';
      case 'Completed': return 'pill-completed';
      case 'Cancelled': return 'pill-cancelled';
      case 'No-Show':   return 'pill-noshow';
      default:          return 'pill-completed';
    }
  }
  function pillLabel(status) {
    switch(status) {
      case 'Confirmed': return 'Dikonfirmasi';
      case 'Completed': return 'Selesai';
      case 'Cancelled': return 'Dibatalkan';
      case 'No-Show':   return 'No-Show';
      default: return status;
    }
  }

  const cardsHtml = list.length === 0
    ? `<div class="empty-state">
         <div class="empty-state-icon">${icon('inbox', 32)}</div>
         Tidak ada pemesanan ${STATE.bookingsTab === 'upcoming' ? 'yang akan datang' : 'sebelumnya'}.
       </div>`
    : list.map(b => {
        const isStanding = b.type === 'standing';
        const seatText   = isStanding ? `Berdiri ${b.seat}` : `Kursi ${b.seat}`;
        return `
          <div class="booking-card">
            <div class="booking-card-top">
              <div>
                <div class="booking-route">${escHtml(b.from)} → ${escHtml(b.to)}</div>
                <div class="booking-meta">${formatDateFull(b.date)} · ${b.time} · ${escHtml(seatText)}</div>
              </div>
              <span class="status-pill ${pillClass(b.status)}">${pillLabel(b.status)}</span>
            </div>
            <div class="booking-card-bottom">
              <span style="font-size:11px;color:var(--ink-400);font-family:monospace;">${escHtml(b.id)}</span>
              ${b.status === 'Confirmed' ? `
                <button class="btn-outline" style="height:34px;font-size:12px;padding:0 12px;" data-action="navigate" data-hash="#/ticket?id=${encodeURIComponent(b.id)}">
                  ${icon('ticket', 14)} Lihat Tiket
                </button>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');

  document.getElementById('app').innerHTML = `
    <div class="screen" id="screen-bookings">
      <div class="nav-bar">
        <span class="nav-title" style="font-size:18px;">Pemesanan Saya</span>
      </div>

      <div class="sub-tabs">
        <button class="sub-tab ${STATE.bookingsTab === 'upcoming' ? 'active' : ''}" data-action="bookings-tab" data-tab="upcoming">
          Akan Datang
        </button>
        <button class="sub-tab ${STATE.bookingsTab === 'past' ? 'active' : ''}" data-action="bookings-tab" data-tab="past">
          Riwayat
        </button>
      </div>

      <div class="screen-body">
        <div class="bookings-list">${cardsHtml}</div>
      </div>

      <nav class="tab-bar">${tabBar('bookings')}</nav>
    </div>
  `;
  createIcons();
}

/* ============================================================
   SCREEN: PROFILE (#/profile)
   ============================================================ */

function renderProfile() {
  const strikeDrawerHtml = STATE.strikeDrawerOpen ? `
    <div class="strike-drawer">
      <div class="strike-drawer-title">Riwayat Strike</div>
      ${MOCK.strikes === 0
        ? `<div class="no-strikes">${icon('check-circle', 16)} Tidak ada strike aktif. Pertahankan!</div>`
        : `<div style="color:var(--orange-deep);font-weight:600;font-size:13px;">
             ${MOCK.strikes} strike aktif
           </div>`
      }
    </div>
  ` : '';

  document.getElementById('app').innerHTML = `
    <div class="screen" id="screen-profile">
      <div class="screen-body">
        <div class="profile-header">
          <div class="profile-avatar">${MOCK.user.name.charAt(0)}</div>
          <div class="profile-name">${escHtml(MOCK.user.name)}</div>
          <div class="profile-sub">${escHtml(MOCK.user.nim)} · ${MOCK.user.role}</div>
          <div class="profile-sub" style="font-family:monospace;">${maskFlazz(MOCK.user.flazz)}</div>
        </div>

        <div class="profile-list">
          <div class="profile-row" data-action="toggle-strike-drawer">
            <div class="profile-row-icon">${icon('history', 18)}</div>
            <span class="profile-row-label">Riwayat Strike</span>
            <span class="profile-row-arrow">
              ${icon(STATE.strikeDrawerOpen ? 'chevron-up' : 'chevron-right', 16)}
            </span>
          </div>

          ${strikeDrawerHtml}

          <div class="profile-row" data-action="noop">
            <div class="profile-row-icon">${icon('bell', 18)}</div>
            <span class="profile-row-label">Notifikasi</span>
            <span class="profile-row-arrow">${icon('chevron-right', 16)}</span>
          </div>
          <div class="profile-row" data-action="noop">
            <div class="profile-row-icon">${icon('help-circle', 18)}</div>
            <span class="profile-row-label">Bantuan</span>
            <span class="profile-row-arrow">${icon('chevron-right', 16)}</span>
          </div>
          <div class="profile-row danger" data-action="sign-out">
            <div class="profile-row-icon">${icon('log-out', 18)}</div>
            <span class="profile-row-label">Keluar</span>
            <span class="profile-row-arrow">${icon('chevron-right', 16)}</span>
          </div>
        </div>
      </div>

      <nav class="tab-bar">${tabBar('profile')}</nav>
    </div>
  `;
  createIcons();
}

/* ============================================================
   CONFIRM BOOKING (action)
   ============================================================ */

function confirmBooking() {
  const { from, to, date, time, seatId } = STATE.draft;
  const isStanding = seatId && seatId.startsWith('B');
  const id = `BNS-${Date.now().toString().slice(-6)}`;

  const newBooking = {
    id,
    from,
    to,
    date,
    time,
    seat:   seatId || '?',
    type:   isStanding ? 'standing' : 'seat',
    status: 'Confirmed'
  };

  // Prepend so it shows on top
  STATE.bookings.unshift(newBooking);

  // Clear draft
  STATE.draft = {
    from:   null,
    to:     null,
    date:   daysFromToday(0),
    time:   null,
    seatId: null
  };
  STATE.swapped = false;

  navigate('#/bookings');
}

/* ============================================================
   HTML ESCAPING
   ============================================================ */

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ============================================================
   EVENT HANDLER
   ============================================================ */

function handleAction(action, data) {
  switch (action) {

    /* ── Navigation ── */
    case 'navigate':
      navigate(data.hash);
      break;

    case 'go-back':
      history.back();
      break;

    case 'go-seats':
      if (canProceedBook()) {
        STATE.draft.seatId = null;
        navigate('#/seats');
      }
      break;

    case 'go-confirm':
      if (STATE.draft.seatId) {
        navigate('#/confirm');
      }
      break;

    case 'sign-in': {
      const nim = document.getElementById('nim-input')?.value?.trim();
      const pwd = document.getElementById('pwd-input')?.value?.trim();
      if (nim && pwd) {
        STATE.loggedIn   = true;
        STATE.loginNim   = '';
        STATE.loginPwd   = '';
        STATE.showPassword = false;
        navigate('#/home');
      }
      break;
    }

    case 'sign-out':
      STATE.loggedIn = false;
      STATE.bookingsTab = 'upcoming';
      navigate('#/login');
      break;

    /* ── Login ── */
    case 'toggle-password':
      // Save field values before re-render
      STATE.loginNim = document.getElementById('nim-input')?.value || '';
      STATE.loginPwd = document.getElementById('pwd-input')?.value || '';
      STATE.showPassword = !STATE.showPassword;
      renderLogin();
      break;

    /* ── Booking form ── */
    case 'open-sheet':
      STATE.activeSheet = data.sheet;
      renderBook();
      break;

    case 'close-sheet':
      STATE.activeSheet = null;
      renderBook();
      break;

    case 'pick-stop': {
      const field = data.field; // 'from' or 'to'
      const stop  = data.stop;
      STATE.draft[field] = stop;
      STATE.activeSheet  = null;
      // Show inline error for same/invalid routes — do NOT auto-clear
      renderBook();
      break;
    }

    case 'pick-date':
      STATE.draft.date  = data.date;
      STATE.draft.time  = null; // reset time when date changes
      STATE.activeSheet = null;
      renderBook();
      break;

    case 'pick-time':
      STATE.draft.time  = data.time;
      STATE.activeSheet = null;
      renderBook();
      break;

    case 'swap-route': {
      const tmp         = STATE.draft.from;
      STATE.draft.from  = STATE.draft.to;
      STATE.draft.to    = tmp;
      STATE.swapped     = !STATE.swapped;
      renderBook();
      break;
    }

    /* ── Seat selection ── */
    case 'select-seat':
      // Radio-style: deselect if same, else select new
      STATE.draft.seatId = STATE.draft.seatId === data.seat ? null : data.seat;
      renderSeats();
      break;

    /* ── Confirm ── */
    case 'toggle-accordion':
      STATE.confirmAccordion = !STATE.confirmAccordion;
      renderConfirm();
      break;

    case 'confirm-booking': {
      // Show loading overlay 800ms then commit
      const overlay = document.createElement('div');
      overlay.className = 'loading-overlay';
      overlay.innerHTML = `
        <div class="loading-spinner">${icon('loader', 32)}</div>
        <div class="loading-text">Memproses pesanan...</div>
      `;
      const app = document.getElementById('app');
      app.appendChild(overlay);
      createIcons();
      setTimeout(() => { confirmBooking(); }, 800);
      break;
    }

    /* ── Cancel booking ── */
    case 'cancel-booking': {
      const id = data.id;
      if (confirm(`Batalkan tiket ${id}?`)) {
        const b = STATE.bookings.find(x => x.id === id);
        if (b) b.status = 'Cancelled';
        navigate('#/bookings');
      }
      break;
    }

    /* ── Bookings tabs ── */
    case 'bookings-tab':
      STATE.bookingsTab = data.tab;
      renderBookings(data.tab);
      break;

    /* ── Profile ── */
    case 'toggle-strike-drawer':
      STATE.strikeDrawerOpen = !STATE.strikeDrawerOpen;
      renderProfile();
      break;

    case 'noop':
      break;

    default:
      break;
  }
}

/* ============================================================
   GLOBAL CLICK DELEGATE
   ============================================================ */

document.addEventListener('click', function(e) {
  const target = e.target.closest('[data-action]');
  if (!target) return;

  // Prevent sheet-close from firing when clicking inside sheet content
  if (target.classList.contains('sheet-backdrop')) {
    // only close if click is directly on backdrop (not child)
    if (e.target === target || e.target.closest('.bottom-sheet') === null) {
      handleAction('close-sheet', {});
    }
    return;
  }

  handleAction(target.dataset.action, target.dataset);
});

/* ============================================================
   INIT
   ============================================================ */

window.addEventListener('hashchange', render);

document.addEventListener('DOMContentLoaded', function() {
  const hash = window.location.hash;
  if (!hash || hash === '#' || hash === '#/') {
    window.location.hash = '#/login';
  } else {
    render();
  }
});

// State, date math, render, event handlers.
// Persistence: localStorage keys are namespaced under "mealtracker:".

const LS = {
  startDate:    'mealtracker:startDate',
  checkedFor:   (iso) => `mealtracker:checked:${iso}`,
  waterFor:     (iso) => `mealtracker:water:${iso}`,
  view:         'mealtracker:view', // 'today' | 'week'
};

const WATER_TARGET = 123; // oz
const WATER_PER_TAP = 10; // each dot

const state = {
  startDate: localStorage.getItem(LS.startDate) || null,
  today: todayISO(),
  checked: {},
  water: 0,
  view: localStorage.getItem(LS.view) || 'today',
  weekViewDay: null, // dayIdx 0..5 selected in week view, or null
  showSettings: false,
};

// ---------- date helpers ----------

function todayISO() {
  const d = new Date();
  return localISO(d);
}

function localISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dayIdxFromDate(d) {
  // 0=Mon .. 6=Sun
  return (d.getDay() + 6) % 7;
}

function daysBetween(startISO, endISO) {
  const s = new Date(startISO + 'T00:00:00');
  const e = new Date(endISO + 'T00:00:00');
  return Math.round((e - s) / 86400000);
}

function programWeekFromDays(daysSince) {
  return Math.floor(daysSince / 7) + 1;
}

function rotationWeekFromProgramWeek(programWk) {
  return ((programWk - 1) % 3) + 1;
}

function formatLongDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

// ---------- state load/save ----------

function loadDayState(iso) {
  state.checked = JSON.parse(localStorage.getItem(LS.checkedFor(iso)) || '{}');
  state.water = Number(localStorage.getItem(LS.waterFor(iso)) || 0);
}

function saveChecked() {
  localStorage.setItem(LS.checkedFor(state.today), JSON.stringify(state.checked));
}

function saveWater() {
  localStorage.setItem(LS.waterFor(state.today), String(state.water));
}

// ---------- meal/container math ----------

function consumedTotals(checked, slots) {
  const totals = { G: 0, P: 0, R: 0, Y: 0, B: 0, O: 0, T: 0 };
  for (const s of slots) {
    if (s.isWorkout) continue;
    if (!checked[s.id]) continue;
    for (const [k, v] of Object.entries(s.containers)) totals[k] += v;
  }
  return totals;
}

function currentSlotIndex(slots, now) {
  const mins = now.getHours() * 60 + now.getMinutes();
  let lastEligible = -1;
  for (let i = 0; i < slots.length; i++) {
    if (slots[i].isWorkout) continue;
    lastEligible = i;
    // a slot is "current" from 30 min before its time onward, until the next slot's 30-min window starts
    if (slots[i].minutes >= mins - 30) return i;
  }
  return lastEligible;
}

// ---------- rendering ----------

const app = document.getElementById('app');

function render() {
  // Day rollover check
  const t = todayISO();
  if (t !== state.today) {
    state.today = t;
    loadDayState(t);
  }

  if (!state.startDate) {
    app.innerHTML = renderFirstRun();
    bindFirstRun();
    return;
  }

  const html = state.view === 'week' ? renderWeekView() : renderTodayView();
  app.innerHTML = html;
  if (state.view === 'week') bindWeekView();
  else bindTodayView();
}

function renderFirstRun() {
  return `
    <div class="first-run">
      <h1>Meal Tracker</h1>
      <p class="muted">80 Day Obsession · Plan E</p>
      <p>Pick the start date of your program (Day 1).</p>
      <input type="date" id="startDateInput" value="${todayISO()}">
      <button id="startBtn" class="primary">Start</button>
    </div>
  `;
}

function bindFirstRun() {
  document.getElementById('startBtn').addEventListener('click', () => {
    const v = document.getElementById('startDateInput').value;
    if (!v) return;
    state.startDate = v;
    localStorage.setItem(LS.startDate, v);
    render();
  });
}

function renderTodayView() {
  const iso = state.today;
  const dateObj = new Date(iso + 'T00:00:00');
  const dayIdx = dayIdxFromDate(dateObj);
  const daysSince = daysBetween(state.startDate, iso);
  const isPreStart = daysSince < 0;
  const programWk = isPreStart ? 0 : programWeekFromDays(daysSince);
  const clampedWk = Math.min(Math.max(programWk, 1), 12);
  const rotWk = rotationWeekFromProgramWeek(clampedWk);
  const slots = getSlotsForDay(dayIdx);
  const totals = consumedTotals(state.checked, slots);
  const now = new Date();
  const sameDay = (now.toDateString() === dateObj.toDateString());
  const curIdx = sameDay ? currentSlotIndex(slots, now) : -1;

  const banner = (() => {
    if (isPreStart) return `<div class="banner">Program starts ${formatLongDate(state.startDate)}</div>`;
    if (programWk > 12) return `<div class="banner success">Program complete — showing Week 12</div>`;
    return '';
  })();

  return `
    <header class="topbar">
      <div class="topbar-left">
        <div class="date">${formatLongDate(iso)}</div>
        <div class="muted small">Week ${clampedWk}/12 · Rotation ${rotWk}/3 · ${dayIdx === 6 ? 'Rest' : DAY_NAMES[dayIdx]}</div>
      </div>
      <div class="topbar-right">
        <button class="icon-btn" id="weekViewBtn" title="Week overview">📅</button>
        <button class="icon-btn" id="settingsBtn" title="Settings">⚙</button>
      </div>
    </header>
    ${banner}
    ${renderProgress(totals)}
    ${renderWater()}
    <ol class="slots">
      ${slots.map((s, i) => renderSlot(s, i, rotWk, dayIdx, i === curIdx)).join('')}
    </ol>
    ${state.showSettings ? renderSettings() : ''}
  `;
}

function renderProgress(totals) {
  const rows = CONTAINER_ORDER.map(k => {
    const target = CONTAINER_TARGETS[k];
    const done = totals[k];
    const dots = [];
    for (let i = 0; i < target; i++) {
      dots.push(`<span class="dot ${i < done ? 'filled' : ''}" style="--c:${CONTAINER_META[k].color}"></span>`);
    }
    return `
      <div class="prog-row">
        <span class="prog-label" style="color:${CONTAINER_META[k].color}">${CONTAINER_META[k].short}</span>
        <span class="prog-dots">${dots.join('')}</span>
        <span class="prog-count muted">${done}/${target}</span>
      </div>
    `;
  }).join('');
  return `<section class="progress">${rows}</section>`;
}

function renderWater() {
  const totalDots = 12;
  const filled = Math.min(totalDots, Math.round(state.water / WATER_PER_TAP));
  const dots = [];
  for (let i = 0; i < totalDots; i++) {
    dots.push(`<span class="water-dot ${i < filled ? 'filled' : ''}" data-water-idx="${i}"></span>`);
  }
  return `
    <section class="water" id="water">
      <div class="water-label">
        <span>💧 Water</span>
        <span class="muted small">${state.water} / ${WATER_TARGET} oz</span>
      </div>
      <div class="water-dots">${dots.join('')}</div>
    </section>
  `;
}

function renderSlot(s, idx, rotWk, dayIdx, isCurrent) {
  const isWorkout = !!s.isWorkout;
  const text = getMealText(rotWk, dayIdx, s.id);
  const checked = !!state.checked[s.id];
  const classes = [
    'slot',
    isWorkout ? 'workout' : '',
    checked ? 'done' : '',
    isCurrent ? 'current' : '',
  ].filter(Boolean).join(' ');

  const badges = Object.entries(s.containers)
    .map(([k, v]) => {
      const out = [];
      for (let i = 0; i < v; i++) {
        out.push(`<span class="badge" style="background:${CONTAINER_META[k].color}" title="${CONTAINER_META[k].name}">${k}</span>`);
      }
      return out.join('');
    }).join('');

  return `
    <li class="${classes}" data-slot-id="${s.id}" data-workout="${isWorkout}">
      <div class="slot-time">${s.time}</div>
      <div class="slot-body">
        <div class="slot-label">${s.label}${isCurrent ? ' <span class="now-tag">NOW</span>' : ''}</div>
        ${isWorkout ? '' : `<div class="slot-text">${text}</div>`}
        ${badges ? `<div class="slot-badges">${badges}</div>` : ''}
      </div>
      ${isWorkout ? '' : `<div class="slot-check">${checked ? '✓' : ''}</div>`}
    </li>
  `;
}

function renderSettings() {
  return `
    <section class="settings">
      <h3>Settings</h3>
      <div class="setting-row">
        <label>Program start date</label>
        <input type="date" id="startDateEdit" value="${state.startDate}">
      </div>
      <div class="setting-actions">
        <button id="resetTodayBtn">Reset today</button>
        <button id="exportBtn">Export</button>
        <button id="importBtn">Import</button>
      </div>
      <textarea id="ioBox" placeholder="Exported state will appear here. Paste JSON and tap Import to restore." rows="4"></textarea>
      <button class="close-settings" id="closeSettingsBtn">Close</button>
    </section>
  `;
}

function bindTodayView() {
  document.querySelectorAll('.slot').forEach(el => {
    if (el.dataset.workout === 'true') return;
    el.addEventListener('click', () => {
      const id = el.dataset.slotId;
      state.checked[id] = !state.checked[id];
      saveChecked();
      render();
    });
  });

  document.getElementById('weekViewBtn')?.addEventListener('click', () => {
    state.view = 'week';
    state.weekViewDay = null;
    localStorage.setItem(LS.view, state.view);
    render();
  });

  document.getElementById('settingsBtn')?.addEventListener('click', () => {
    state.showSettings = !state.showSettings;
    render();
  });

  // Water taps: clicking a dot sets water to (idx+1)*WATER_PER_TAP, tapping current filled dot clears that level
  document.querySelectorAll('.water-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = Number(dot.dataset.waterIdx);
      const newLevel = (idx + 1) * WATER_PER_TAP;
      // Toggle: if already at this level, drop down by one
      state.water = (state.water === newLevel) ? idx * WATER_PER_TAP : newLevel;
      saveWater();
      render();
    });
  });

  if (state.showSettings) bindSettings();
}

function bindSettings() {
  document.getElementById('startDateEdit')?.addEventListener('change', (e) => {
    state.startDate = e.target.value;
    localStorage.setItem(LS.startDate, state.startDate);
    render();
  });
  document.getElementById('resetTodayBtn')?.addEventListener('click', () => {
    if (!confirm('Reset all checks for today?')) return;
    state.checked = {};
    state.water = 0;
    localStorage.removeItem(LS.checkedFor(state.today));
    localStorage.removeItem(LS.waterFor(state.today));
    render();
  });
  document.getElementById('exportBtn')?.addEventListener('click', () => {
    const dump = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith('mealtracker:')) dump[k] = localStorage.getItem(k);
    }
    document.getElementById('ioBox').value = JSON.stringify(dump, null, 2);
  });
  document.getElementById('importBtn')?.addEventListener('click', () => {
    const raw = document.getElementById('ioBox').value.trim();
    if (!raw) return;
    let parsed;
    try { parsed = JSON.parse(raw); } catch { alert('Invalid JSON'); return; }
    if (!confirm('Replace mealtracker state with imported data?')) return;
    // Clear existing mealtracker keys
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith('mealtracker:')) toRemove.push(k);
    }
    toRemove.forEach(k => localStorage.removeItem(k));
    Object.entries(parsed).forEach(([k, v]) => localStorage.setItem(k, v));
    state.startDate = localStorage.getItem(LS.startDate);
    loadDayState(state.today);
    render();
  });
  document.getElementById('closeSettingsBtn')?.addEventListener('click', () => {
    state.showSettings = false;
    render();
  });
}

function renderWeekView() {
  const iso = state.today;
  const dateObj = new Date(iso + 'T00:00:00');
  const todayDayIdx = dayIdxFromDate(dateObj);
  const daysSince = Math.max(0, daysBetween(state.startDate, iso));
  const programWk = Math.min(Math.max(programWeekFromDays(daysSince), 1), 12);
  const rotWk = rotationWeekFromProgramWeek(programWk);
  const rot = ROTATIONS[rotWk];

  const dayList = [0, 1, 2, 3, 4, 5].map(d => {
    const isToday = (d === todayDayIdx);
    const dinner = rot.dinners[d];
    return `
      <li class="week-row ${isToday ? 'today' : ''}" data-day="${d}">
        <span class="week-day">${DAY_NAMES[d]}</span>
        <span class="week-dinner">${dinner}</span>
      </li>
    `;
  }).join('');

  const detail = state.weekViewDay !== null
    ? renderWeekDetail(state.weekViewDay, rotWk)
    : '';

  return `
    <header class="topbar">
      <div class="topbar-left">
        <div class="date">Week ${programWk}/12</div>
        <div class="muted small">Rotation ${rotWk}/3 · Mon–Sat menu</div>
      </div>
      <div class="topbar-right">
        <button class="icon-btn" id="todayViewBtn" title="Today">←</button>
      </div>
    </header>
    <ul class="week-list">${dayList}</ul>
    ${detail}
  `;
}

function renderWeekDetail(dayIdx, rotWk) {
  const slots = getSlotsForDay(dayIdx);
  const items = slots.map(s => {
    if (s.isWorkout) {
      return `<li class="slot workout"><div class="slot-time">${s.time}</div><div class="slot-body"><div class="slot-label">${s.label}</div></div></li>`;
    }
    const text = getMealText(rotWk, dayIdx, s.id);
    const badges = Object.entries(s.containers).map(([k, v]) => {
      const out = [];
      for (let i = 0; i < v; i++) out.push(`<span class="badge" style="background:${CONTAINER_META[k].color}">${k}</span>`);
      return out.join('');
    }).join('');
    return `
      <li class="slot readonly">
        <div class="slot-time">${s.time}</div>
        <div class="slot-body">
          <div class="slot-label">${s.label}</div>
          <div class="slot-text">${text}</div>
          ${badges ? `<div class="slot-badges">${badges}</div>` : ''}
        </div>
      </li>
    `;
  }).join('');
  return `
    <section class="week-detail">
      <h3>${DAY_NAMES[dayIdx]} · Rotation ${rotWk}</h3>
      <ol class="slots">${items}</ol>
    </section>
  `;
}

function bindWeekView() {
  document.getElementById('todayViewBtn')?.addEventListener('click', () => {
    state.view = 'today';
    state.weekViewDay = null;
    localStorage.setItem(LS.view, state.view);
    render();
  });
  document.querySelectorAll('.week-row').forEach(el => {
    el.addEventListener('click', () => {
      state.weekViewDay = Number(el.dataset.day);
      render();
    });
  });
}

// ---------- init ----------

loadDayState(state.today);
render();
// Re-render every minute to keep "current" highlight fresh and detect day rollover.
setInterval(render, 60_000);

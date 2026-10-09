/* ═══════════════════════════════════════════════════════════════
   Life Dashboard  —  app.js
   Sections:
     1.  LocalStorage helpers
     2.  Toast notification system
     3.  Theme Toggle           (Challenge #1)
     4.  Greeting + Clock       (Widget #1 + Challenge #2)
     5.  Focus Timer + SVG Ring (Widget #2)
     6.  To-Do List             (Widget #3 + Challenge #3)
     7.  Quick Links            (Widget #4)
     8.  Init
   ═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── 1. LOCALSTORAGE HELPERS ──────────────────────────────────── */

const store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
};


/* ── 2. TOAST NOTIFICATION SYSTEM ────────────────────────────── */

/**
 * Shows a non-blocking toast at the bottom of the screen.
 * @param {string}  message
 * @param {'error'|'success'} [type='error']
 * @param {number}  [duration=2400]  ms before it fades out
 */
function toast(message, type = 'error', duration = 2400) {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = 'toast' + (type === 'success' ? ' success' : '');
  el.textContent = message;
  container.appendChild(el);

  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 450);
  }, duration);
}


/* ── 3. THEME TOGGLE ──────────────────────────────────────────── */

const THEME_KEY = 'ld_theme';

function initTheme() {
  const saved = store.get(THEME_KEY, 'light');
  applyTheme(saved, false);   // no animation on load

  document.getElementById('theme-toggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark', true);
  });
}

function applyTheme(theme, animate = true) {
  if (animate) {
    document.body.style.transition = 'background .4s ease, color .3s ease';
  }
  document.documentElement.setAttribute('data-theme', theme);

  const btn   = document.getElementById('theme-toggle');
  const icon  = btn.querySelector('.theme-icon');
  const label = btn.querySelector('.theme-label');

  if (theme === 'dark') {
    icon.textContent  = '☀️';
    label.textContent = 'Light';
  } else {
    icon.textContent  = '🌙';
    label.textContent = 'Dark';
  }
  store.set(THEME_KEY, theme);
}


/* ── 4. GREETING + CLOCK ──────────────────────────────────────── */

const NAME_KEY = 'ld_username';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

function pad2(n) { return String(n).padStart(2, '0'); }

function getPhrase(hour) {
  if (hour < 12) return 'Good Morning,';
  if (hour < 18) return 'Good Afternoon,';
  return 'Good Evening,';
}

function tickClock() {
  const now   = new Date();
  const h24   = now.getHours();
  const h12   = h24 % 12 || 12;
  const ampm  = h24 < 12 ? 'AM' : 'PM';

  document.getElementById('clock').textContent =
    `${pad2(h12)}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())} ${ampm}`;

  document.getElementById('greeting-phrase').textContent = getPhrase(h24);

  document.getElementById('date-display').textContent =
    `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
}

function loadName() {
  const name = store.get(NAME_KEY, '');
  document.getElementById('greeting-name').textContent = name || 'Friend';
  document.getElementById('name-input').value = name || '';
}

function saveName() {
  const input = document.getElementById('name-input');
  const name  = input.value.trim();
  store.set(NAME_KEY, name);
  document.getElementById('greeting-name').textContent = name || 'Friend';
  toast('Name saved!', 'success', 1800);
}

function initGreeting() {
  loadName();
  tickClock();
  setInterval(tickClock, 1000);

  document.getElementById('name-save-btn').addEventListener('click', saveName);
  document.getElementById('name-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') saveName();
  });
}


/* ── 5. FOCUS TIMER + SVG RING ────────────────────────────────── */

const TOTAL_SECS      = 25 * 60;          // 1500 s
const RING_CIRCUMF    = 326.7;            // 2π × 52 (radius in SVG)

let timerRemaining = TOTAL_SECS;
let timerInterval  = null;
let timerRunning   = false;

const elDisplay  = document.getElementById('timer-display');
const elLabel    = document.getElementById('timer-label');
const elRing     = document.getElementById('ring-progress');
const elRingWrap = document.querySelector('.timer-ring');
const btnStart   = document.getElementById('timer-start');
const btnPause   = document.getElementById('timer-pause');
const btnReset   = document.getElementById('timer-reset');

/**
 * Converts seconds → "MM:SS" string.
 */
function fmtTime(secs) {
  return `${pad2(Math.floor(secs / 60))}:${pad2(secs % 60)}`;
}

/**
 * Sets the SVG ring progress (0 = empty, 1 = full).
 */
function setRingProgress(fraction) {
  // dashoffset of 0 = full ring; dashoffset of CIRCUMF = empty ring
  elRing.style.strokeDashoffset = RING_CIRCUMF * (1 - fraction);
}

function renderTimer() {
  elDisplay.textContent = fmtTime(timerRemaining);
  setRingProgress(timerRemaining / TOTAL_SECS);
}

function setTimerLabel(text) { elLabel.textContent = text; }

function startTimer() {
  if (timerRunning) return;
  timerRunning    = true;
  btnStart.disabled = true;
  btnPause.disabled = false;
  setTimerLabel('FOCUS');

  timerInterval = setInterval(() => {
    timerRemaining--;
    renderTimer();

    if (timerRemaining <= 0) {
      clearInterval(timerInterval);
      timerRunning      = false;
      timerRemaining    = 0;
      btnStart.disabled = false;
      btnPause.disabled = true;
      setTimerLabel('DONE  🎉');
      elRingWrap.classList.add('done');
      toast('Pomodoro complete! Take a break. 🎉', 'success', 4000);
      setTimeout(() => elRingWrap.classList.remove('done'), 2200);
    }
  }, 1000);
}

function pauseTimer() {
  if (!timerRunning) return;
  clearInterval(timerInterval);
  timerRunning      = false;
  btnStart.disabled = false;
  btnPause.disabled = true;
  setTimerLabel('PAUSED');
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning      = false;
  timerRemaining    = TOTAL_SECS;
  btnStart.disabled = false;
  btnPause.disabled = true;
  elRingWrap.classList.remove('done');
  elRing.style.stroke = '';
  renderTimer();
  setTimerLabel('Ready');
}

function initTimer() {
  renderTimer();
  btnStart.addEventListener('click', startTimer);
  btnPause.addEventListener('click', pauseTimer);
  btnReset.addEventListener('click', resetTimer);
}


/* ── 6. TO-DO LIST ────────────────────────────────────────────── */

const TODO_KEY = 'ld_todos';

function loadTodos() { return store.get(TODO_KEY, []); }
function saveTodos(arr) { store.set(TODO_KEY, arr); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

/** Renders the task count badge */
function updateTodoCounter(todos) {
  const done  = todos.filter(t => t.done).length;
  const total = todos.length;
  const el    = document.getElementById('todo-counter');
  el.textContent = total ? `${done}/${total}` : '';
}

/** Updates empty-state visibility */
function updateTodoEmpty(list) {
  document.getElementById('todo-empty').style.display =
    list.children.length === 0 ? 'flex' : 'none';
}

/**
 * Builds one <li> todo item.
 * Double-click text OR press the edit button to enter inline edit mode.
 */
function buildTodoEl(todo, todos, list) {
  const li = document.createElement('li');
  li.className = 'todo-item' + (todo.done ? ' done' : '');
  li.dataset.id = todo.id;

  /* -- checkbox -- */
  const check = document.createElement('input');
  check.type      = 'checkbox';
  check.className = 'todo-check';
  check.checked   = todo.done;
  check.setAttribute('aria-label', `Mark "${todo.text}" as complete`);
  check.addEventListener('change', () => {
    todo.done = check.checked;
    li.classList.toggle('done', todo.done);
    saveTodos(todos);
    updateTodoCounter(todos);
  });

  /* -- text -- */
  const span = document.createElement('span');
  span.className   = 'todo-text';
  span.textContent = todo.text;
  span.title       = 'Double-click to edit';
  span.addEventListener('dblclick', () => enterEditMode(li, span, todo, todos));

  /* -- action buttons -- */
  const actions = document.createElement('div');
  actions.className = 'todo-actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'btn btn--ghost';
  editBtn.textContent = '✏️';
  editBtn.setAttribute('aria-label', `Edit task`);
  editBtn.addEventListener('click', () => enterEditMode(li, span, todo, todos));

  const delBtn = document.createElement('button');
  delBtn.className = 'btn btn--danger';
  delBtn.textContent = '✕';
  delBtn.setAttribute('aria-label', `Delete task`);
  delBtn.addEventListener('click', () => {
    const idx = todos.findIndex(t => t.id === todo.id);
    if (idx !== -1) todos.splice(idx, 1);
    saveTodos(todos);

    /* fade out before removing */
    li.style.transition = 'opacity .2s ease, transform .2s ease';
    li.style.opacity    = '0';
    li.style.transform  = 'translateX(8px)';
    setTimeout(() => {
      li.remove();
      updateTodoEmpty(list);
      updateTodoCounter(todos);
    }, 200);
  });

  actions.append(editBtn, delBtn);
  li.append(check, span, actions);
  return li;
}

/**
 * Replaces the text <span> with an inline <input> for in-place editing.
 * Pressing Enter or blurring commits; Escape cancels.
 */
function enterEditMode(li, span, todo, todos) {
  if (li.querySelector('.todo-edit-input')) return;  // already editing

  const input = document.createElement('input');
  input.className = 'todo-edit-input';
  input.type      = 'text';
  input.value     = todo.text;
  input.maxLength = 120;
  span.replaceWith(input);
  input.focus();
  input.select();

  function commit() {
    const newText = input.value.trim();
    if (!newText) { cancel(); return; }

    // Challenge #3: duplicate check (exclude current item)
    const isDupe = todos.some(
      t => t.id !== todo.id && t.text.toLowerCase() === newText.toLowerCase()
    );
    if (isDupe) {
      toast('A task with that name already exists!');
      input.focus();
      return;
    }

    todo.text = newText;
    span.textContent = newText;
    saveTodos(todos);
    input.replaceWith(span);
  }

  function cancel() { input.replaceWith(span); }

  input.addEventListener('blur',    commit);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); input.removeEventListener('blur', commit); commit(); }
    if (e.key === 'Escape') { input.removeEventListener('blur', commit); cancel(); }
  });
}

function initTodos() {
  const list  = document.getElementById('todo-list');
  const input = document.getElementById('todo-input');
  const todos = loadTodos();

  todos.forEach(t => list.appendChild(buildTodoEl(t, todos, list)));
  updateTodoEmpty(list);
  updateTodoCounter(todos);

  function addTask() {
    const text = input.value.trim();
    if (!text) {
      toast('Task name cannot be empty.');
      input.focus();
      return;
    }

    // Challenge #3: prevent duplicates
    if (todos.some(t => t.text.toLowerCase() === text.toLowerCase())) {
      toast('That task already exists!');
      input.select();
      return;
    }

    const todo = { id: uid(), text, done: false };
    todos.push(todo);
    saveTodos(todos);

    const el = buildTodoEl(todo, todos, list);
    list.appendChild(el);
    input.value = '';
    input.focus();

    updateTodoEmpty(list);
    updateTodoCounter(todos);

    // scroll new item into view
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  document.getElementById('todo-add-btn').addEventListener('click', addTask);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
}


/* ── 7. QUICK LINKS ───────────────────────────────────────────── */

const LINKS_KEY = 'ld_links';

function loadLinks() { return store.get(LINKS_KEY, []); }
function saveLinks(arr) { store.set(LINKS_KEY, arr); }

/** Ensures URL has a protocol */
function normalizeUrl(raw) {
  const s = raw.trim();
  return /^https?:\/\//i.test(s) ? s : 'https://' + s;
}

function updateLinksEmpty(grid) {
  document.getElementById('links-empty').style.display =
    grid.children.length === 0 ? 'flex' : 'none';
}

function buildLinkChip(link, links, grid) {
  const chip = document.createElement('div');
  chip.className = 'link-chip';
  chip.dataset.id = link.id;

  const a   = document.createElement('a');
  a.href    = link.url;
  a.target  = '_blank';
  a.rel     = 'noopener noreferrer';
  a.textContent = link.name;
  a.title   = link.url;

  const del = document.createElement('button');
  del.className = 'link-del-btn';
  del.textContent = '✕';
  del.setAttribute('aria-label', `Remove ${link.name}`);
  del.addEventListener('click', e => {
    e.preventDefault();
    const idx = links.findIndex(l => l.id === link.id);
    if (idx !== -1) links.splice(idx, 1);
    saveLinks(links);

    chip.style.transition = 'opacity .2s ease, transform .2s ease';
    chip.style.opacity    = '0';
    chip.style.transform  = 'scale(.85)';
    setTimeout(() => {
      chip.remove();
      updateLinksEmpty(grid);
    }, 200);
  });

  chip.append(a, del);
  return chip;
}

function initLinks() {
  const grid      = document.getElementById('links-grid');
  const nameInput = document.getElementById('link-name-input');
  const urlInput  = document.getElementById('link-url-input');
  const links     = loadLinks();

  links.forEach(l => grid.appendChild(buildLinkChip(l, links, grid)));
  updateLinksEmpty(grid);

  function addLink() {
    const name = nameInput.value.trim();
    const url  = urlInput.value.trim();
    if (!name) { toast('Please enter a link name.');     nameInput.focus(); return; }
    if (!url)  { toast('Please enter a URL.');           urlInput.focus();  return; }

    const link = { id: uid(), name, url: normalizeUrl(url) };
    links.push(link);
    saveLinks(links);

    const chip = buildLinkChip(link, links, grid);
    grid.appendChild(chip);
    nameInput.value = '';
    urlInput.value  = '';
    nameInput.focus();
    updateLinksEmpty(grid);
  }

  document.getElementById('link-add-btn').addEventListener('click', addLink);
  urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') addLink(); });
}


/* ── 8. INIT ──────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initGreeting();
  initTimer();
  initTodos();
  initLinks();
});

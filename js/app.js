console.log('[SBZ] app.js loaded v3');

const _bgEls = () => [ document.querySelector('.app-header'), document.querySelector('.tab-nav'), document.querySelector('.main-content') ].filter(Boolean);

function openModal(title, body, extraClass) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = body;
  document.getElementById('modal').className = 'modal' + (extraClass ? ' ' + extraClass : '');
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  _bgEls().forEach((el => el.setAttribute('inert', '')));
  requestAnimationFrame((() => {
    const first = overlay.querySelector('input:not([type=hidden]), select, textarea, button:not(.modal-close)');
    if (first) first.focus();
  }));
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.body.style.overflow = '';
  _bgEls().forEach((el => el.removeAttribute('inert')));
}

document.getElementById('modal-overlay').addEventListener('click', (function(e) {
  if (e.target === this) closeModal();
}));

document.getElementById('modal-overlay').addEventListener('keydown', (function(e) {
  if (e.key === 'Escape') {
    closeModal();
    return;
  }
  if (e.key !== 'Tab') return;
  const focusable = [ ...this.querySelectorAll('input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])') ].filter((el => el.offsetParent !== null));
  if (!focusable.length) return;
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (e.shiftKey) {
    if (document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}));

function showTab(name) {
  if (Auth.isFac()) {
    const btn = document.querySelector(`.tab-btn[data-tab="${name}"]`);
    if (btn?.classList.contains('coord-only')) return;
  }
  document.querySelectorAll('.tab-btn').forEach((b => b.classList.remove('active')));
  document.querySelectorAll('.tab-content').forEach((c => c.classList.remove('active')));
  const btn = document.querySelector(`.tab-btn[data-tab="${name}"]`);
  if (btn) btn.classList.add('active');
  const content = document.getElementById(name + '-tab');
  if (content) content.classList.add('active');
  if (name === 'facilitators') Facilitators.render();
  if (name === 'frameworks') Frameworks.render();
  if (name === 'calendar') Calendar.render();
  location.hash = '#' + name;
}

document.querySelectorAll('.tab-btn').forEach((btn => {
  btn.addEventListener('click', (function() {
    showTab(this.dataset.tab);
  }));
}));

function activeFacilitators() {
  return DB.getFacilitators().filter((f => f.isFacilitator && (f.status || 'active') !== 'inactive'));
}

function fwBaseName(name) {
  return (name || '').trim().replace(/\s+/g, ' ').replace(/\s+(ו|ז|ח|ט|י|יא|יב)(\s+\S.*)?$/, '').trim();
}

function orgBaseName(name) {
  return fwBaseName(name);
}

const _PLACEHOLDER_NAMES = new Set([ 'שם לדוגמא', 'שם לדוגמה' ]);

function uniqueOrgCount() {
  return new Set(DB.getFrameworks().filter((f => (f.formality || 'formal') !== 'internal' && !_PLACEHOLDER_NAMES.has((f.name || '').trim()))).map((f => orgBaseName(f.name)))).size;
}

function fwFormality(fwId) {
  const fw = DB.getFrameworks().find((f => f.id === fwId));
  return fw?.formality || 'formal';
}

function updateHeaderStats() {
  const el = document.getElementById('header-stats');
  if (!el) return;
  el.innerHTML = `\n    <span><strong>${activeFacilitators().length}</strong> מנחים</span>\n    <span><strong>${uniqueOrgCount()}</strong> ארגונים</span>\n    <span><strong id="header-stat-sessions">…</strong> מפגשים</span>`;
  API.get('/api/stats/session-overview').then((r => {
    const sessionsEl = document.getElementById('header-stat-sessions');
    if (sessionsEl) sessionsEl.textContent = r.total;
  })).catch((() => {}));
}

function _syncScreens(source) {
  updateHeaderStats();
  const active = document.querySelector('.tab-btn.active')?.dataset?.tab;
  if (typeof Calendar !== 'undefined') {
    if (source === 'framework' || source === 'assignment') Calendar._redrawWeeks();
  }
  if (active === 'facilitators' && typeof Facilitators !== 'undefined') Facilitators.render();
  if (active === 'frameworks' && typeof Frameworks !== 'undefined') Frameworks.render();
  if (active === 'calendar' && typeof Calendar !== 'undefined' && source !== 'assignment') {
    Calendar._redrawWeeks();
  }
}

document.addEventListener('click', (function(e) {
  if (!e.target.closest('.dp-wrap')) {
    document.querySelectorAll('.dp-popup').forEach((p => p.style.display = 'none'));
  }
  if (!e.target.closest('.coord-search-wrap')) {
    document.querySelectorAll('.coord-dropdown').forEach((d => d.style.display = 'none'));
  }
  if (!e.target.closest('#an-fw-q') && !e.target.closest('#an-fw-drop')) {
    const drop = document.getElementById('an-fw-drop');
    if (drop) drop.style.display = 'none';
  }
  if (!e.target.closest('#fw-name') && !e.target.closest('#fw-name-drop')) {
    const drop = document.getElementById('fw-name-drop');
    if (drop) drop.style.display = 'none';
  }
  if (!e.target.closest('#cal-day-menu') && !e.target.closest('.cal-add-btn') && typeof Calendar !== 'undefined') {
    Calendar.closeDayMenu();
  }
  if (!e.target.closest('.cal-filter-wrap')) {
    document.querySelectorAll('.cal-filter-popover').forEach((p => p.classList.remove('open')));
  }
  if (!e.target.closest('.fac-add-filter-wrap')) {
    document.querySelectorAll('.fac-add-filter-pop').forEach((p => p.classList.remove('open')));
  }
}));

function _applyRoleUI() {
  const isCoord = Auth.isCoord();
  document.querySelectorAll('.coord-only').forEach((el => {
    el.style.display = isCoord ? '' : 'none';
  }));
  if (!isCoord) {
    const btn = document.querySelector('[data-tab="facilitators"]');
    if (btn) {
      btn.textContent = 'השיבוצים שלי';
      const nav = btn.closest('.tab-nav');
      if (nav) nav.prepend(btn);
    }
  }
  const userEl = document.getElementById('header-user');
  if (userEl) {
    const u = Auth.getCurrentUser();
    userEl.innerHTML = `\n      <span class="header-username">${u?.name || u?.email || ''}</span>\n      <span class="header-role-badge ${isCoord ? 'role-coord' : 'role-fac'}">${isCoord ? 'רכז/ת' : 'מנחה'}</span>\n      ${isCoord ? `<button class="btn btn-secondary btn-xs" onclick="_exportDataFile()" title="הורד קובץ גיבוי מעודכן עם כל הנתונים הנוכחיים">גיבוי נתונים</button>` : ''}\n      <button class="btn btn-secondary btn-xs" onclick="Auth.logout()">יציאה</button>`;
  }
}

function _appInit() {
  document.body.classList.remove('app-locked');
  _applyRoleUI();
  updateHeaderStats();
  if (typeof Help !== 'undefined') Help.mount();
  if (Auth.isFac()) {
    showTab('facilitators');
    return;
  }
  const hash = location.hash;
  const _allowedTabs = [ 'calendar', 'facilitators', 'frameworks' ];
  const _initTab = _allowedTabs.find((t => hash === '#' + t)) || 'calendar';
  showTab(_initTab);
}

const _loginForm = document.getElementById('login-form');

console.log('[SBZ] login-form element:', _loginForm);

_loginForm?.addEventListener('submit', (function(e) {
  console.log('[SBZ] submit fired');
  e.preventDefault();
  try {
    Auth._doLogin(e);
  } catch (err) {
    const errEl = document.getElementById('login-err');
    if (errEl) {
      errEl.textContent = 'שגיאה: ' + err.message;
      errEl.style.display = 'block';
    }
    console.error('login error:', err);
  }
}));

async function _startApp() {
  if (!Auth.isLoggedIn()) {
    document.getElementById('login-overlay').style.display = 'flex';
    return;
  }
  try {
    await DB.init();
    _appInit();
  } catch (err) {
    API._clearSession();
    document.getElementById('login-overlay').style.display = 'flex';
    const errEl = document.getElementById('login-err');
    if (errEl) {
      errEl.textContent = 'שגיאת חיבור לשרת — ודא שהשרת פועל';
      errEl.style.display = 'block';
    }
  }
}

let _refreshInFlight = false;

async function _refreshAndRerender() {
  if (_refreshInFlight || !Auth.isLoggedIn()) return;
  if (!document.getElementById('modal-overlay').classList.contains('hidden')) return;
  _refreshInFlight = true;
  try {
    await DB.refresh();
    updateHeaderStats();
    const active = document.querySelector('.tab-btn.active')?.dataset?.tab;
    if (active === 'facilitators' && typeof Facilitators !== 'undefined') Facilitators.render();
    if (active === 'frameworks' && typeof Frameworks !== 'undefined') Frameworks.render();
    if (active === 'calendar' && typeof Calendar !== 'undefined') Calendar._redrawWeeks();
  } catch (err) {
    console.error('[SBZ] live refresh failed:', err);
  } finally {
    _refreshInFlight = false;
  }
}

document.addEventListener('visibilitychange', (() => {
  if (document.visibilityState === 'visible') _refreshAndRerender();
}));

window.addEventListener('focus', _refreshAndRerender);

setInterval(_refreshAndRerender, 6e4);

function _exportDataFile() {
  const frameworks = DB.getFrameworks();
  const validFwIds = new Set(frameworks.map((f => f.id)));
  const fwData = frameworks.map((fw => {
    const out = {
      id: fw.id,
      name: fw.name,
      grade: fw.grade || '',
      sessionCount: fw.sessionCount || 0
    };
    if (fw.type) out.type = fw.type;
    if (fw.formality) out.formality = fw.formality;
    if (fw.hours) out.hours = fw.hours;
    if (fw.badge) out.badge = fw.badge;
    return out;
  }));
  const facData = DB.getFacilitators().map((f => {
    const out = {
      id: f.id,
      name: f.name
    };
    if (f.email) out.email = f.email;
    if (f.location) out.location = f.location;
    if (f.phone) out.phone = f.phone;
    if (f.status && f.status !== 'active') out.status = f.status;
    if (f.days?.length) out.days = f.days;
    if (f.teamPrep) out.teamPrep = true;
    if (f.teamTraining) out.teamTraining = true;
    if (f.parentLecture) out.parentLecture = true;
    if (f.atRisk) out.atRisk = true;
    if (f.coordination) out.coordination = true;
    return out;
  }));
  const assignData = DB.getAssignments().filter((a => validFwIds.has(a.frameworkId))).map((a => ({
    frameworkId: a.frameworkId,
    sessions: (a.sessions || []).filter((s => s.date)).map((s => {
      const out = {
        date: s.date,
        facilitatorIds: s.facilitatorIds || []
      };
      if (s.status) out.status = s.status;
      if (s.rounds?.length) out.rounds = s.rounds;
      return out;
    }))
  }))).filter((a => a.sessions.length > 0));
  const exportDate = (new Date).toLocaleDateString('he-IL');
  const code = [ `/* ===== HISTORICAL DATA ===== */`, `/* ייצוא אוטומטי — ${exportDate} */`, `const HistoryInit = {`, `  FRAMEWORKS: ${JSON.stringify(fwData, null, 2)},`, ``, `  FACILITATORS: ${JSON.stringify(facData, null, 2)},`, ``, `  ASSIGNMENTS: ${JSON.stringify(assignData, null, 2)},`, `};` ].join('\n');
  const blob = new Blob([ code ], {
    type: 'application/javascript;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'data-init-history.js';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  alert(`יוצאו ${fwData.length} מסגרות, ${facData.length} מנחים, ו-${assignData.length} שיבוצים.\nהחלף את הקובץ data-init-history.js בשרת.`);
}

_startApp();

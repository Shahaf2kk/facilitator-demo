const DAYS_HE = [ 'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת' ];

const DAYS_SHORT = [ 'א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳' ];

const MONTHS_HE = [ 'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר' ];

const FW_COLORS = [ '#2563eb', '#059669', '#d97706', '#dc2626', '#8b5cf6', '#0891b2', '#ea580c', '#db2777' ];

const ICONS = {
  edit: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  trash: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
  key: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`
};

function _ensureMorphLayers(btn) {
  if (btn.dataset.morphed === '1') return;
  btn.dataset.morphW = btn.offsetWidth;
  btn.dataset.morphH = btn.offsetHeight;
  btn.dataset.morphed = '1';
  btn.innerHTML = `\n    <span class="layer idle">${btn.innerHTML}</span>\n    <span class="layer spin"><span class="spinner"></span></span>\n    <span class="layer ok"><svg class="checkmark" viewBox="0 0 24 24"><path d="M4 13l5 5L20 6"/></svg> נשלח</span>\n  `;
}

function runButtonFeedback(btn, run) {
  if (!btn) return Promise.resolve(run());
  if (btn.dataset.busy === '1') return Promise.resolve(null);
  _ensureMorphLayers(btn);
  const w = btn.dataset.morphW, h = btn.dataset.morphH;
  btn.style.width = w + 'px';
  btn.style.height = h + 'px';
  btn.dataset.busy = '1';
  btn.classList.add('btn-morph', 'st-sending');
  const reset = () => {
    btn.classList.remove('st-sending', 'st-ok');
    delete btn.dataset.busy;
  };
  return Promise.resolve().then(run).then((result => {
    btn.classList.remove('st-sending');
    btn.classList.add('st-ok');
    setTimeout(reset, 1100);
    return result;
  })).catch((err => {
    reset();
    throw err;
  }));
}

const DB = {
  _cache: {
    facilitators: [],
    frameworks: [],
    assignments: [],
    holidays: [],
    users: [],
    sent: [],
    confirmations: [],
    icsSent: []
  },
  async init() {
    return this._loadAll();
  },
  async _loadAll(reqOpts) {
    const [facs, fws, assigns, hols] = await Promise.all([ API.get('/api/facilitators', reqOpts), API.get('/api/frameworks', reqOpts), API.get('/api/assignments', reqOpts), API.get('/api/holidays', reqOpts) ]);
    this._cache.facilitators = facs.map((r => API.mapFacilitator(r)));
    this._cache.frameworks = fws.map((r => API.mapFramework(r)));
    this._cache.assignments = assigns.map((r => API.mapAssignment(r)));
    this._cache.holidays = hols.map((h => ({
      id: h.id,
      date: API._dateStr(h.holiday_date || h.date),
      name: h.name
    })));
    const [sentList, confList] = await Promise.all([ API.get('/api/sent-confirmations', reqOpts), API.get('/api/confirmations/my', reqOpts) ]);
    this._cache.sent = sentList.map((r => API.mapSent(r)));
    this._cache.confirmations = confList.map((r => API.mapConfirmation(r)));
    if (Auth.isCoord()) {
      const users = await API.get('/api/users/', reqOpts);
      this._cache.users = users.map((r => API.mapUser(r)));
    }
    if (Auth.isFac() || Auth.currentFacId()) {
      const icsList = await API.get('/api/export/calendar-invite-status', reqOpts);
      this._cache.icsSent = icsList.map((r => API.mapIcsSent(r)));
    }
  },
  getFacilitators() {
    return this._cache.facilitators;
  },
  getFrameworks() {
    return this._cache.frameworks.map((fw => {
      if (fw.type === 'prep' || fw.type === 'training' || fw.type === 'parent') {
        return {
          ...fw,
          badge: fw.badge || fw.type,
          type: 'internal'
        };
      }
      return fw;
    }));
  },
  getAssignments() {
    return this._cache.assignments;
  },
  getHolidays() {
    return this._cache.holidays;
  },
  async refresh() {
    try {
      await this._loadAll({
        silent401: true
      });
    } catch (err) {
      if (err.message !== '__silent_401__') throw err;
    }
  },
  async reloadConfirmations() {
    const [sentList, confList] = await Promise.all([ API.get('/api/sent-confirmations'), API.get('/api/confirmations/my') ]);
    this._cache.sent = sentList.map((r => API.mapSent(r)));
    this._cache.confirmations = confList.map((r => API.mapConfirmation(r)));
  },
  async saveFacilitator(d) {
    if (!d.id) {
      const res = await API.post('/api/facilitators', d);
      d = {
        ...d,
        id: res.id
      };
    } else {
      await API.put(`/api/facilitators/${d.id}`, d);
    }
    const idx = this._cache.facilitators.findIndex((x => x.id === d.id));
    if (idx >= 0) this._cache.facilitators[idx] = d; else this._cache.facilitators.push(d);
    return d;
  },
  async saveFramework(d) {
    if (!d.id) {
      const res = await API.post('/api/frameworks', d);
      d = {
        ...d,
        id: res.id
      };
    } else {
      await API.put(`/api/frameworks/${d.id}`, d);
    }
    const idx = this._cache.frameworks.findIndex((x => x.id === d.id));
    if (idx >= 0) this._cache.frameworks[idx] = d; else this._cache.frameworks.push(d);
    return d;
  },
  async moveSession(aId, fromDate, toDate) {
    await API.post(`/api/assignments/${aId}/move-session`, {
      from: fromDate,
      to: toDate
    });
  },
  async saveAssignment(d) {
    const body = {
      frameworkId: d.frameworkId,
      coordinatorIds: d.coordinatorIds || [],
      sessions: (d.sessions || []).map((s => ({
        date: s.date,
        status: s.status || 'active',
        facilitatorIds: s.facilitatorIds || [],
        rounds: (s.rounds || []).map((r => ({
          time: r.time || '',
          requiredCount: r.requiredCount || 1,
          facilitatorIds: r.facilitatorIds || []
        })))
      })))
    };
    if (!d.id) {
      const res = await API.post('/api/assignments', body);
      d = {
        ...d,
        id: res.id
      };
    } else {
      await API.put(`/api/assignments/${d.id}`, body);
    }
    const idx = this._cache.assignments.findIndex((x => x.id === d.id));
    if (idx >= 0) this._cache.assignments[idx] = d; else this._cache.assignments.push(d);
    return d;
  },
  async saveHoliday(d) {
    if (!d.id) {
      const res = await API.post('/api/holidays', d);
      d = {
        ...d,
        id: res.id
      };
    } else {
      await API.put(`/api/holidays/${d.id}`, d);
    }
    const idx = this._cache.holidays.findIndex((x => x.id === d.id));
    if (idx >= 0) this._cache.holidays[idx] = d; else this._cache.holidays.push(d);
    return d;
  },
  async delHoliday(id) {
    await API.del(`/api/holidays/${id}`);
    this._cache.holidays = this._cache.holidays.filter((x => x.id !== id));
  },
  async delFacilitator(id) {
    await API.del(`/api/facilitators/${id}`);
    this._cache.facilitators = this._cache.facilitators.filter((x => x.id !== id));
  },
  async delFramework(id) {
    await API.del(`/api/frameworks/${id}`);
    this._cache.frameworks = this._cache.frameworks.filter((x => x.id !== id));
  },
  async delAssignment(id) {
    await API.del(`/api/assignments/${id}`);
    this._cache.assignments = this._cache.assignments.filter((x => x.id !== id));
  },
  async delSession(aId, dateStr) {
    await API.del(`/api/assignments/${aId}/sessions/${dateStr}`);
    const a = this._cache.assignments.find((x => x.id === aId));
    if (a) a.sessions = (a.sessions || []).filter((s => s.date !== dateStr));
  }
};

function facDisplayName(f) {
  if (!f || !f.name) return '?';
  const parts = f.name.trim().split(/\s+/);
  const first = parts[0];
  const last = parts.slice(1).join(' ');
  if (!last) return first;
  const sharesFirstName = DB.getFacilitators().some((x => x.id !== f.id && (x.name || '').trim().split(/\s+/)[0] === first));
  return sharesFirstName ? `${first} ${last[0]}` : first;
}

function dateToStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function strToDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function todayStr() {
  return dateToStr(new Date);
}

function fmtDate(s) {
  if (!s) return '';
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

function dayOfWeek(s) {
  return strToDate(s).getDay();
}

function sessionDates(startDate, count) {
  const dow = dayOfWeek(startDate);
  const dates = [];
  let d = strToDate(startDate);
  while (d.getDay() !== dow) d.setDate(d.getDate() + 1);
  for (let i = 0; i < count; i++) {
    dates.push(dateToStr(new Date(d)));
    d.setDate(d.getDate() + 7);
  }
  return dates;
}

function fwSectorColor(fw) {
  if (!fw) return null;
  const type = fw.type;
  if (type === 'informal') return '#2563eb';
  if (type === 'internal') return '#8b5cf6';
  return '#059669';
}

function fwTypeColor(type) {
  if (type === 'informal') return '#2563eb';
  if (type === 'internal') return '#8b5cf6';
  return '#059669';
}

function fwColor(frameworkId) {
  const fw = DB.getFrameworks().find((f => f.id === frameworkId));
  const c = fwSectorColor(fw);
  if (c) return c;
  const list = DB.getFrameworks();
  const idx = list.findIndex((f => f.id === frameworkId));
  return FW_COLORS[(idx < 0 ? 0 : idx) % FW_COLORS.length];
}

function fwStatusColor(status) {
  if (status === 'waiting') return '#FBF0C4';
  if (status === 'confirmed') return '#D9F0DD';
  return '#F8D9D9';
}

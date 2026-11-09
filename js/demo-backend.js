(function() {
  const KEY = 'demo_db_v1';
  const clone = o => JSON.parse(JSON.stringify(o));
  function sundayOf(d) {
    const x = new Date(d);
    x.setHours(12, 0, 0, 0);
    x.setDate(x.getDate() - x.getDay());
    return x;
  }
  function iso(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function addDays(s, n) {
    const d = new Date(s + 'T12:00:00');
    d.setDate(d.getDate() + n);
    return iso(d);
  }
  function freshData() {
    const d = clone(DEMO_SEED);
    const weeks = Math.round((sundayOf(new Date) - sundayOf(new Date(d.base_week + 'T12:00:00'))) / (7 * 864e5));
    const shift = s => addDays(s, weeks * 7);
    d.assignments.forEach((a => a.sessions.forEach((s => {
      s.session_date = shift(s.session_date);
    }))));
    [ 'sent', 'confirmations', 'ics' ].forEach((k => d[k].forEach((r => {
      r.session_date = shift(r.session_date);
    }))));
    return d;
  }
  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY));
      if (d && d.version === DEMO_SEED.version) return d;
    } catch {}
    return freshData();
  }
  let D = load();
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(D));
    } catch {}
  }
  save();
  function setUser(u) {
    localStorage.setItem('sbz_token', 'demo');
    localStorage.setItem('sbz_user', JSON.stringify({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      facilitatorId: u.facilitator_id || null
    }));
  }
  function currentUser() {
    try {
      const u = JSON.parse(localStorage.getItem('sbz_user'));
      if (u && D.users.some((x => x.id === u.id))) return D.users.find((x => x.id === u.id));
    } catch {}
    const first = D.users.find((u => u.role === 'coordinator'));
    setUser(first);
    return first;
  }
  currentUser();
  const me = () => currentUser();
  const isCoord = () => me().role === 'coordinator';
  const myFid = () => me().facilitator_id;
  let seq = Date.now();
  const newId = p => p + (seq++).toString(36);
  const fail = msg => {
    throw new Error(msg);
  };
  const needCoord = () => {
    if (!isCoord()) fail('אין הרשאה');
  };
  const key = (aid, date, fid) => `${aid}|${date}|${fid}`;
  const findA = aid => D.assignments.find((a => a.id === aid)) || fail('לא נמצא');
  const isSent = (aid, date, fid) => D.sent.some((r => r.assignment_id === aid && r.session_date === date && r.facilitator_id === fid));
  const conf = (aid, date, fid) => D.confirmations.find((r => r.assignment_id === aid && r.session_date === date && r.facilitator_id === fid));
  function dropRecords(pred) {
    [ 'sent', 'confirmations', 'ics' ].forEach((k => {
      D[k] = D[k].filter((r => !pred(r)));
    }));
  }
  function markSent(aid, dates, fid) {
    dates.forEach((date => {
      if (!isSent(aid, date, fid)) D.sent.push({
        assignment_id: aid,
        session_date: date,
        facilitator_id: fid,
        sent_at: (new Date).toISOString()
      });
      D.confirmations = D.confirmations.filter((r => !(r.assignment_id === aid && r.session_date === date && r.facilitator_id === fid && r.status === 'declined')));
    }));
  }
  function emailNote() {
    DemoBar.toast('בגרסת ההדגמה לא נשלחים מיילים — הבקשה נרשמה כאילו נשלחה');
  }
  const facFromBody = (b, id) => ({
    id: id,
    name: b.name,
    location: b.location || '',
    email: b.email || null,
    phone: b.phone || '',
    status: b.status || 'active',
    days: b.days || [],
    team_prep: !!b.teamPrep,
    team_training: !!b.teamTraining,
    parent_lecture: !!b.parentLecture,
    at_risk: !!b.atRisk,
    coordination: !!b.coordination,
    is_facilitator: b.isFacilitator !== false,
    tags: b.tags || [],
    notes: b.notes || ''
  });
  const fwFromBody = (b, id) => ({
    id: id,
    name: b.name,
    grade: b.grade || '',
    hours: b.hours || '',
    session_count: b.sessionCount || 3,
    type: b.type || 'formal',
    badge: b.badge || '',
    contact_name: b.contactName || '',
    contact_phone: b.contactPhone || '',
    facilitators_per_round: b.facilitatorsPerRound || 1,
    round_facilitators: b.roundFacilitators || [],
    rounds_count: b.roundsCount || 1,
    notes: b.notes || '',
    status: b.status || 'tentative'
  });
  const sessionsFromBody = b => (b.sessions || []).map((s => ({
    session_date: s.date,
    status: s.status || 'active',
    facilitator_ids: s.facilitatorIds || [],
    coordinator_id: s.coordinatorId || null,
    rounds: (s.rounds || []).map(((r, i) => ({
      round_index: i,
      time_slot: r.time || '',
      required_count: r.requiredCount || 1,
      facilitator_ids: r.facilitatorIds || []
    })))
  })));
  function cleanupRemoved(aid, oldSessions, newSessions) {
    oldSessions.forEach((o => {
      const n = newSessions.find((x => x.session_date === o.session_date));
      const kept = new Set(n ? n.facilitator_ids : []);
      o.facilitator_ids.filter((f => !kept.has(f))).forEach((f => dropRecords((r => r.assignment_id === aid && r.session_date === o.session_date && r.facilitator_id === f))));
    }));
  }
  const routes = [ [ 'GET', /^\/api\/facilitators\/?$/, () => D.facilitators ], [ 'GET', /^\/api\/frameworks\/?$/, () => D.frameworks ], [ 'GET', /^\/api\/assignments\/?$/, () => D.assignments ], [ 'GET', /^\/api\/holidays\/?$/, () => D.holidays ], [ 'GET', /^\/api\/users\/?$/, () => (needCoord(), 
  D.users) ], [ 'GET', /^\/api\/sent-confirmations$/, () => isCoord() ? D.sent : D.sent.filter((r => r.facilitator_id === myFid())) ], [ 'GET', /^\/api\/confirmations\/my$/, () => isCoord() ? D.confirmations : D.confirmations.filter((r => r.facilitator_id === myFid())) ], [ 'GET', /^\/api\/export\/calendar-invite-status$/, () => D.ics.filter((r => r.facilitator_id === myFid())).map((r => ({
    ...r,
    sent: true
  }))) ], [ 'GET', /^\/api\/stats\/session-overview$/, () => ({
    total: D.assignments.reduce(((n, a) => n + a.sessions.filter((s => s.status === 'active')).length), 0)
  }) ], [ 'POST', /^\/api\/facilitators\/?$/, (m, b) => {
    needCoord();
    const id = newId('p');
    D.facilitators.push(facFromBody(b, id));
    return {
      id: id
    };
  } ], [ 'PUT', /^\/api\/facilitators\/([^/]+)$/, ([, id], b) => {
    needCoord();
    const i = D.facilitators.findIndex((f => f.id === id));
    if (i < 0) fail('לא נמצא');
    D.facilitators[i] = facFromBody(b, id);
    return {
      ok: true
    };
  } ], [ 'DELETE', /^\/api\/facilitators\/([^/]+)$/, ([, id]) => {
    needCoord();
    D.facilitators = D.facilitators.filter((f => f.id !== id));
    dropRecords((r => r.facilitator_id === id));
    return {
      ok: true
    };
  } ], [ 'POST', /^\/api\/frameworks\/?$/, (m, b) => {
    needCoord();
    const id = newId('w');
    D.frameworks.push(fwFromBody(b, id));
    return {
      id: id
    };
  } ], [ 'PUT', /^\/api\/frameworks\/([^/]+)$/, ([, id], b) => {
    needCoord();
    const i = D.frameworks.findIndex((f => f.id === id));
    if (i < 0) fail('לא נמצא');
    D.frameworks[i] = fwFromBody(b, id);
    return {
      ok: true
    };
  } ], [ 'DELETE', /^\/api\/frameworks\/([^/]+)$/, ([, id]) => {
    needCoord();
    const gone = new Set(D.assignments.filter((a => a.framework_id === id)).map((a => a.id)));
    D.assignments = D.assignments.filter((a => !gone.has(a.id)));
    dropRecords((r => gone.has(r.assignment_id)));
    D.frameworks = D.frameworks.filter((f => f.id !== id));
    return {
      ok: true
    };
  } ], [ 'POST', /^\/api\/assignments\/?$/, (m, b) => {
    needCoord();
    const id = newId('a');
    D.assignments.push({
      id: id,
      framework_id: b.frameworkId,
      coordinator_ids: b.coordinatorIds || [],
      sessions: sessionsFromBody(b)
    });
    return {
      id: id
    };
  } ], [ 'PUT', /^\/api\/assignments\/([^/]+)$/, ([, aid], b) => {
    needCoord();
    const a = findA(aid);
    const next = sessionsFromBody(b);
    cleanupRemoved(aid, a.sessions, next);
    a.sessions = next.sort(((x, y) => x.session_date.localeCompare(y.session_date)));
    if (b.coordinatorIds) a.coordinator_ids = b.coordinatorIds;
    return {
      ok: true
    };
  } ], [ 'DELETE', /^\/api\/assignments\/([^/]+)\/sessions\/([^/]+)$/, ([, aid, date]) => {
    needCoord();
    const a = findA(aid);
    a.sessions = a.sessions.filter((s => s.session_date !== date));
    dropRecords((r => r.assignment_id === aid && r.session_date === date));
    return {
      ok: true
    };
  } ], [ 'DELETE', /^\/api\/assignments\/([^/]+)$/, ([, aid]) => {
    needCoord();
    D.assignments = D.assignments.filter((a => a.id !== aid));
    dropRecords((r => r.assignment_id === aid));
    return {
      ok: true
    };
  } ], [ 'POST', /^\/api\/assignments\/([^/]+)\/move-session$/, ([, aid], b) => {
    needCoord();
    const a = findA(aid);
    const s = a.sessions.find((x => x.session_date === b.from)) || fail('לא נמצא');
    s.session_date = b.to;
    a.sessions.sort(((x, y) => x.session_date.localeCompare(y.session_date)));
    [ 'sent', 'confirmations', 'ics' ].forEach((k => D[k].forEach((r => {
      if (r.assignment_id === aid && r.session_date === b.from) r.session_date = b.to;
    }))));
    return {
      ok: true
    };
  } ], [ 'POST', /^\/api\/holidays\/?$/, (m, b) => {
    needCoord();
    const id = Date.now() + Math.floor(Math.random() * 1e3);
    D.holidays.push({
      id: id,
      holiday_date: b.date,
      name: b.name
    });
    return {
      id: id
    };
  } ], [ 'PUT', /^\/api\/holidays\/([^/]+)$/, ([, id], b) => {
    needCoord();
    const h = D.holidays.find((x => String(x.id) === id)) || fail('לא נמצא');
    h.holiday_date = b.date;
    h.name = b.name;
    return {
      ok: true
    };
  } ], [ 'DELETE', /^\/api\/holidays\/([^/]+)$/, ([, id]) => {
    needCoord();
    D.holidays = D.holidays.filter((h => String(h.id) !== id));
    return {
      ok: true
    };
  } ], [ 'POST', /^\/api\/auth\/register$/, (m, b) => {
    needCoord();
    if (D.users.some((u => u.email === b.email))) fail('email כבר קיים');
    const id = newId('u');
    D.users.push({
      id: id,
      email: b.email,
      name: b.name,
      role: b.role || 'facilitator',
      facilitator_id: b.facilitator_id || null
    });
    return {
      id: id
    };
  } ], [ 'PUT', /^\/api\/users\/([^/]+)$/, ([, id], b) => {
    needCoord();
    const u = D.users.find((x => x.id === id)) || fail('לא נמצא');
    Object.assign(u, {
      email: b.email,
      name: b.name,
      role: b.role,
      facilitator_id: b.facilitator_id || null
    });
    return {
      ok: true
    };
  } ], [ 'DELETE', /^\/api\/users\/([^/]+)$/, ([, id]) => {
    needCoord();
    if (id === me().id) fail('אי אפשר למחוק את המשתמש שאת/ה צופה בו כרגע');
    D.users = D.users.filter((u => u.id !== id));
    return {
      ok: true
    };
  } ], [ 'POST', /^\/api\/send-confirmation\/month\/([^/]+)$/, ([, fid], b) => {
    needCoord();
    const ym = `${b.year}-${String(b.month).padStart(2, '0')}`;
    let count = 0;
    D.assignments.forEach((a => a.sessions.forEach((s => {
      if (s.session_date.startsWith(ym) && s.facilitator_ids.includes(fid) && !isSent(a.id, s.session_date, fid)) {
        markSent(a.id, [ s.session_date ], fid);
        count++;
      }
    }))));
    if (!count) return {
      ok: true,
      count: 0,
      email_sent: false,
      email_error: 'כל השיבוצים בחודש זה כבר נשלחו'
    };
    emailNote();
    return {
      ok: true,
      count: count,
      email_sent: true,
      marked: true
    };
  } ], [ 'POST', /^\/api\/send-confirmation\/([^/]+)\/series\/([^/]+)$/, ([, aid, fid]) => {
    needCoord();
    const a = findA(aid);
    const dates = a.sessions.filter((s => s.facilitator_ids.includes(fid))).map((s => s.session_date));
    markSent(aid, dates, fid);
    emailNote();
    return {
      ok: true,
      count: dates.length,
      email_sent: true,
      marked: true
    };
  } ], [ 'POST', /^\/api\/send-confirmation\/([^/]+)\/([^/]+)\/([^/]+)$/, ([, aid, date, fid]) => {
    needCoord();
    markSent(aid, [ date ], fid);
    emailNote();
    return {
      ok: true,
      count: 1,
      email_sent: true,
      marked: true
    };
  } ], [ 'POST', /^\/api\/confirmations\/([^/]+)\/series\/(confirm|decline)$/, ([, aid, action]) => {
    const fid = myFid() || fail('אין מנחה מקושר');
    const a = findA(aid);
    const dates = a.sessions.filter((s => s.facilitator_ids.includes(fid) && isSent(aid, s.session_date, fid) && !conf(aid, s.session_date, fid))).map((s => s.session_date));
    const status = action === 'confirm' ? 'confirmed' : 'declined';
    dates.forEach((date => D.confirmations.push({
      assignment_id: aid,
      session_date: date,
      facilitator_id: fid,
      status: status
    })));
    return {
      ok: true,
      status: status,
      count: dates.length,
      dates: dates
    };
  } ], [ 'POST', /^\/api\/confirmations\/([^/]+)\/([^/]+)\/(confirm|decline)$/, ([, aid, date, action]) => {
    const fid = myFid() || fail('אין מנחה מקושר');
    if (!isSent(aid, date, fid)) return {
      ok: false,
      reason: 'not_sent',
      message: 'לא נשלחה בקשת אישור'
    };
    D.confirmations = D.confirmations.filter((r => !(r.assignment_id === aid && r.session_date === date && r.facilitator_id === fid)));
    D.confirmations.push({
      assignment_id: aid,
      session_date: date,
      facilitator_id: fid,
      status: action === 'confirm' ? 'confirmed' : 'declined'
    });
    return {
      ok: true
    };
  } ], [ 'POST', /^\/api\/export\/calendar-invite$/, (m, b) => {
    const fid = myFid() || fail('אין רשומת מנחה');
    if (!D.ics.some((r => r.assignment_id === b.assignment_id && r.session_date === b.date && r.facilitator_id === fid))) D.ics.push({
      assignment_id: b.assignment_id,
      session_date: b.date,
      facilitator_id: fid
    });
    DemoBar.toast('בגרסת ההדגמה לא נשלח זימון יומן באמת');
    return {
      ok: true,
      email_sent: true
    };
  } ] ];
  API._fetch = async function(method, path, body) {
    const clean = path.split('?')[0];
    for (const [m, re, fn] of routes) {
      if (m !== method) continue;
      const match = clean.match(re);
      if (!match) continue;
      await new Promise((r => setTimeout(r, 120)));
      const result = fn(match, body ? clone(body) : {});
      if (method !== 'GET') save();
      return clone(result);
    }
    throw new Error('לא זמין בגרסת ההדגמה');
  };
  window.DemoBar = {
    mount() {
      const bar = document.createElement('div');
      bar.className = 'demo-bar';
      const roleLabel = u => u.role === 'coordinator' ? 'רכז/ת' : 'מנחה';
      bar.innerHTML = `\n        <span class="demo-bar-tag">גרסת הדגמה</span>\n        <span class="demo-bar-text">הנתונים נשמרים רק בדפדפן שלך · לא נשלחים מיילים</span>\n        <label class="demo-bar-who">צפייה בתור:\n          <select id="demo-who">${D.users.map((u => `<option value="${u.id}" ${u.id === me().id ? 'selected' : ''}>${u.name} (${roleLabel(u)})</option>`)).join('')}</select>\n        </label>\n        <button type="button" id="demo-reset">איפוס נתונים</button>`;
      document.body.prepend(bar);
      bar.querySelector('#demo-who').onchange = e => {
        setUser(D.users.find((u => u.id === e.target.value)));
        location.hash = '';
        location.reload();
      };
      bar.querySelector('#demo-reset').onclick = () => this.confirmReset();
    },
    confirmReset() {
      openModal('איפוס נתוני ההדגמה', `\n        <p>כל השינויים שעשית יימחקו והנתונים יחזרו למצב ההתחלתי.</p>\n        <div class="modal-actions">\n          <button class="btn btn-danger" onclick="DemoBar.reset()">איפוס</button>\n          <button class="btn btn-secondary" onclick="closeModal()">ביטול</button>\n        </div>`);
    },
    reset() {
      try {
        localStorage.removeItem(KEY);
        localStorage.removeItem('sbz_user');
      } catch {}
      location.hash = '';
      location.reload();
    },
    toast(text) {
      let t = document.getElementById('demo-toast');
      if (!t) {
        t = document.createElement('div');
        t.id = 'demo-toast';
        t.className = 'demo-toast';
        document.body.append(t);
      }
      t.textContent = text;
      t.classList.add('show');
      clearTimeout(this._t);
      this._t = setTimeout((() => t.classList.remove('show')), 3200);
    }
  };
  document.addEventListener('DOMContentLoaded', (() => DemoBar.mount()));
})();

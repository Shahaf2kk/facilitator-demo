const GROUP_TAGS = [ 'שנה א׳', 'שנים מתקדמות' ];

const Facilitators = {
  _dayFilter: '',
  _skillFilter: '',
  _statusFilter: '',
  _groupFilter: '',
  _countMode: (() => {
    const m = (new Date).getMonth() + 1;
    const sy = m >= 9 ? (new Date).getFullYear() : (new Date).getFullYear() - 1;
    return sy >= 2026 ? 'tashpach' : 'tashpaz';
  })(),
  _selMonth: '',
  _sortCol: 'status',
  _sortDir: 'asc',
  _sortCol2: 'name',
  _sortDir2: 'asc',
  _showCoord: false,
  _showInactive: false,
  _currentYM() {
    const d = new Date;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  },
  _filterDims() {
    return [ {
      key: 'day',
      label: 'יום',
      stateKey: '_dayFilter',
      options: [ 0, 1, 2, 3, 4 ].map((i => [ String(i), DAYS_HE[i] ]))
    }, {
      key: 'status',
      label: 'סטטוס',
      stateKey: '_statusFilter',
      options: [ [ 'active', 'מנחה פעיל' ], [ 'coordinator', 'רכזות' ], [ 'inactive', 'לא פעיל' ] ]
    }, {
      key: 'skill',
      label: 'תפקיד',
      stateKey: '_skillFilter',
      options: [ [ 'teamPrep', 'הכנות' ], [ 'teamTraining', 'הכשרות' ], [ 'parentLecture', 'הורים' ], [ 'atRisk', 'סיכון' ], [ 'coordination', 'ריכוז' ] ]
    }, {
      key: 'group',
      label: 'קבוצה',
      stateKey: '_groupFilter',
      options: GROUP_TAGS.map((t => [ t, t ]))
    } ];
  },
  _activeFilterChipsHtml() {
    return this._filterDims().filter((d => this[d.stateKey] !== '')).map((d => {
      const opt = d.options.find((([v]) => v === String(this[d.stateKey])));
      const valLabel = opt ? opt[1] : this[d.stateKey];
      return `<span class="fac-chip">${d.label}: ${valLabel}<span class="fac-chip-x" onclick="Facilitators._setDimFilter('${d.key}','')">×</span></span>`;
    })).join('');
  },
  _addFilterPopoverHtml() {
    const inactive = this._filterDims().filter((d => this[d.stateKey] === ''));
    if (!inactive.length) return `<span class="fac-no-more-filters">כל הסינונים בשימוש</span>`;
    return inactive.map((d => `\n      <div class="fac-add-filter-row">\n        <label>${d.label}</label>\n        <select onchange="Facilitators._setDimFilter('${d.key}',this.value)">\n          <option value="">בחר...</option>\n          ${d.options.map((([v, l]) => `<option value="${v}">${l}</option>`)).join('')}\n        </select>\n      </div>`)).join('');
  },
  _setDimFilter(key, val) {
    const dim = this._filterDims().find((d => d.key === key));
    if (!dim) return;
    this[dim.stateKey] = val;
    this.render();
  },
  _clearAllFilters() {
    this._dayFilter = '';
    this._skillFilter = '';
    this._statusFilter = '';
    this._groupFilter = '';
    this._sortCol = 'status';
    this._sortDir = 'asc';
    this._sortCol2 = 'name';
    this._sortDir2 = 'asc';
    this.render();
  },
  _toggleAddFilterPopover(e) {
    e.stopPropagation();
    document.getElementById('fac-add-filter-pop')?.classList.toggle('open');
  },
  _academicYearRange() {
    const now = new Date;
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const sy = month >= 9 ? year : year - 1;
    return {
      startYear: sy,
      endYear: sy + 1,
      start: `${sy}-09`,
      end: `${sy + 1}-08`
    };
  },
  _countSessionsInRange(facId, startYM, endYM) {
    const fws = DB.getFrameworks();
    let count = 0;
    DB.getAssignments().forEach((a => {
      const fw = fws.find((f => f.id === a.frameworkId));
      if (fw?.type === 'internal') return;
      (a.sessions || []).forEach((s => {
        if ((s.facilitatorIds || []).includes(facId)) {
          const ym = s.date.substring(0, 7);
          if (ym >= startYM && ym <= endYM) count++;
        }
      }));
    }));
    return count;
  },
  _currentRange() {
    if (this._countMode === 'monthly') {
      const ym = this._selMonth || this._currentYM();
      return {
        start: ym,
        end: ym
      };
    }
    if (this._countMode === 'tashpaz') return {
      start: '2025-09',
      end: '2026-08'
    };
    if (this._countMode === 'tashpach') return {
      start: '2026-09',
      end: '2027-08'
    };
    return this._academicYearRange();
  },
  _countSessions(facId) {
    const {start: start, end: end} = this._currentRange();
    return this._countSessionsInRange(facId, start, end);
  },
  _coordYearStats() {
    const {start: start, end: end} = this._academicYearRange();
    let notSent = 0, pending = 0, confirmed = 0;
    DB.getAssignments().forEach((a => {
      (a.sessions || []).forEach((s => {
        const ym = s.date.substring(0, 7);
        if (ym < start || ym > end) return;
        if ((s.status || 'active') !== 'active') return;
        const facIds = s.facilitatorIds || [];
        if (!facIds.length) return;
        const anySent = facIds.some((fId => Auth.isSent(a.id, s.date, fId)));
        if (!anySent) {
          notSent++;
          return;
        }
        const allConfirmed = facIds.every((fId => Auth.isSent(a.id, s.date, fId) && Auth.getConfirmation(a.id, s.date, fId)?.status === 'confirmed'));
        if (allConfirmed) confirmed++; else pending++;
      }));
    }));
    return {
      notSent: notSent,
      pending: pending,
      confirmed: confirmed,
      total: notSent + pending + confirmed
    };
  },
  _myCard() {
    const myFacId = Auth.currentFacId();
    if (!myFacId) return '';
    const myFac = DB.getFacilitators().find((f => f.id === myFacId));
    if (!myFac) return '';
    const cs = this._coordYearStats();
    return `<div class="card my-fac-card">\n      <div class="card-header">\n        <h2>שלום, ${myFac.name}</h2>\n      </div>\n      <div class="my-fac-stats">\n        <div class="my-fac-stat stat-urgent">\n          <div class="my-fac-stat-val">${cs.notSent}</div>\n          <div class="my-fac-stat-label">טרם נשלח לאישור</div>\n        </div>\n        <div class="my-fac-stat stat-wait">\n          <div class="my-fac-stat-val">${cs.pending}</div>\n          <div class="my-fac-stat-label">ממתין לאישור מנחה</div>\n        </div>\n        <div class="my-fac-stat stat-ok">\n          <div class="my-fac-stat-val">${cs.confirmed}</div>\n          <div class="my-fac-stat-label">אושרו</div>\n        </div>\n        <div class="my-fac-stat">\n          <div class="my-fac-stat-val">${cs.total}</div>\n          <div class="my-fac-stat-label">סה"כ שיבוצים בשנה"ל הנוכחית</div>\n        </div>\n      </div>\n      <div class="my-fac-actions">\n        <button class="btn btn-secondary btn-sm" onclick="Calendar._openDownloadModal()">↓ הורד רשימת שיבוצים</button>\n      </div>\n    </div>`;
  },
  render() {
    if (Auth.isFac()) {
      this._renderFacDashboard();
      return;
    }
    const list = DB.getFacilitators();
    const {startYear: startYear, endYear: endYear} = this._academicYearRange();
    const sessionColLabel = this._countMode === 'monthly' ? 'שיבוצים חודשי' : this._countMode === 'tashpaz' ? 'שיבוצים תשפ"ו' : this._countMode === 'tashpach' ? 'שיבוצים תשפ"ז' : `שיבוצים שנה"ל ${String(startYear).slice(2)}–${String(endYear).slice(2)}`;
    const activeFacs = list.filter((f => f.isFacilitator && (f.status || 'active') !== 'inactive'));
    const dayCounts = [ 0, 1, 2, 3, 4 ].map((d => `<div class="stat-card"><div class="stat-label">${DAYS_HE[d]}</div><div class="stat-value">${activeFacs.filter((f => (f.days || []).includes(d))).length}</div></div>`)).join('');
    document.getElementById('facilitators-tab').innerHTML = `\n      ${this._myCard()}\n      ${this._myFacAssignmentsPreview()}\n      <div class="stats-row">\n        <div class="stat-card"><div class="stat-label">סה״כ מנחים פעילים</div><div class="stat-value">${activeFacs.length}</div></div>\n        ${dayCounts}\n      </div>\n      <div class="card">\n        <div class="card-header">\n          <h2>רשימת אנשים</h2>\n          ${Auth.isCoord() ? `<button class="btn btn-primary btn-sm" onclick="Facilitators.openModal()">+ הוסף</button>` : ''}\n        </div>\n        <div class="fac-filter-bar">\n          <div class="fac-chips-wrap">\n            ${this._activeFilterChipsHtml()}\n            <div class="fac-add-filter-wrap">\n              <button class="fac-add-filter-btn" onclick="Facilitators._toggleAddFilterPopover(event)">+ הוסף סינון</button>\n              <div class="fac-add-filter-pop" id="fac-add-filter-pop">\n                ${this._addFilterPopoverHtml()}\n              </div>\n            </div>\n          </div>\n          <div class="fac-filter-right">\n            <select class="fac-sort-select" onchange="Facilitators._sortCol=this.value; Facilitators._sortDir='asc'; Facilitators._sortCol2='name'; Facilitators._sortDir2='asc'; Facilitators._refreshTable()">\n              <option value=""        ${this._sortCol === '' ? 'selected' : ''}>⇅ ללא מיון</option>\n              <option value="status"  ${this._sortCol === 'status' ? 'selected' : ''}>⇅ מיון: סטטוס</option>\n              <option value="name"    ${this._sortCol === 'name' ? 'selected' : ''}>⇅ מיון: שם</option>\n              <option value="location"${this._sortCol === 'location' ? 'selected' : ''}>⇅ מיון: מקום מגורים</option>\n              <option value="sessions"${this._sortCol === 'sessions' ? 'selected' : ''}>⇅ מיון: שיבוצים</option>\n              <option value="days"    ${this._sortCol === 'days' ? 'selected' : ''}>⇅ מיון: כמות ימים</option>\n            </select>\n            <select class="fac-count-select" onchange="Facilitators._countMode=this.value; Facilitators.render()">\n              <option value="tashpaz"  ${this._countMode === 'tashpaz' ? 'selected' : ''}>שנתי (תשפ"ו)</option>\n              <option value="tashpach" ${this._countMode === 'tashpach' ? 'selected' : ''}>שנתי (תשפ"ז)</option>\n              <option value="monthly"  ${this._countMode === 'monthly' ? 'selected' : ''}>חודשי</option>\n            </select>\n            ${this._countMode === 'monthly' ? `<input type="month" class="fac-month-input" value="${this._selMonth || this._currentYM()}"\n                  onchange="Facilitators._selMonth=this.value; Facilitators._refreshTable()">` : ''}\n            <button class="fac-clear-all-btn" title="נקה סינון ומיון" onclick="Facilitators._clearAllFilters()">↺</button>\n          </div>\n        </div>\n        <div class="table-wrap">\n          <table>\n            <thead><tr>\n              ${this._th('שם', 'name')}${this._th('מקום מגורים', 'location')}${this._th('ימי פניות', 'days')}\n              <th style="width:140px">תפקידים</th>\n              ${this._th(sessionColLabel, 'sessions')}<th>פעולות</th>\n            </tr></thead>\n            <tbody id="fac-tbody"></tbody>\n          </table>\n        </div>\n      </div>`;
    this._refreshTable();
  },
  _th(label, col) {
    const isPrimary = this._sortCol === col;
    const isSecondary = this._sortCol2 === col;
    let arrow = '';
    if (isPrimary) arrow = this._sortDir === 'asc' ? ' ▲' : ' ▼'; else if (isSecondary) arrow = this._sortDir2 === 'asc' ? ' △' : ' ▽'; else arrow = ' ⇅';
    const opacity = isPrimary ? 1 : isSecondary ? .6 : .4;
    const color = isPrimary ? ';color:#1e3a5f' : isSecondary ? ';color:#6b7280' : '';
    const width = col === 'days' ? 'width:165px;' : '';
    return `<th style="${width}cursor:pointer;user-select:none${color}" onclick="Facilitators._sort('${col}')">${label}<span style="font-size:0.7rem;opacity:${opacity}">${arrow}</span></th>`;
  },
  _sort(col) {
    if (this._sortCol === col) {
      this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
    } else if (this._sortCol2 === col) {
      this._sortDir2 = this._sortDir2 === 'asc' ? 'desc' : 'asc';
    } else {
      this._sortCol2 = col;
      this._sortDir2 = 'asc';
    }
    this._refreshTable();
  },
  _statusBadge(f) {
    const status = f.status || 'active';
    if (status === 'coordinator') {
      const extra = f.isFacilitator ? '<span style="font-size:0.65rem;margin-right:3px;opacity:0.75">+ מנחה</span>' : '';
      return `<span class="status-badge status-coord">רכזת${extra}</span>`;
    }
    const map = {
      active: [ 'status-active', 'מנחה פעיל' ],
      inactive: [ 'status-inactive', 'לא פעיל' ]
    };
    const [cls, label] = map[status] || map['active'];
    return `<span class="status-badge ${cls}">${label}</span>`;
  },
  _cmpVal(f, col) {
    const statusOrder = {
      active: 0,
      coordinator: 1,
      inactive: 2
    };
    if (col === 'sessions') return f._cnt || 0;
    if (col === 'days') return (f.days || []).length;
    if (col === 'status') return statusOrder[f.status || 'active'] ?? 0;
    return String(f[col] || '');
  },
  _refreshTable() {
    let list = DB.getFacilitators();
    if (this._dayFilter !== '') list = list.filter((f => (f.days || []).includes(+this._dayFilter)));
    if (this._skillFilter) list = list.filter((f => f[this._skillFilter]));
    if (this._statusFilter) list = list.filter((f => (f.status || 'active') === this._statusFilter));
    if (this._groupFilter) list = list.filter((f => (f.tags || []).includes(this._groupFilter)));
    const tbody = document.getElementById('fac-tbody');
    if (!tbody) return;
    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">אין אנשים תואמים.</div></td></tr>`;
      return;
    }
    const {start: rangeStart, end: rangeEnd} = this._currentRange();
    const withCounts = list.map((f => ({
      ...f,
      _cnt: this._countSessions(f.id),
      _pending: Calendar._getSessionStats ? Calendar._getSessionStats(f.id, rangeStart, rangeEnd).pending : 0
    })));
    if (this._sortCol) {
      const col1 = this._sortCol, dir1 = this._sortDir === 'asc' ? 1 : -1;
      const col2 = this._sortCol2, dir2 = this._sortDir2 === 'asc' ? 1 : -1;
      withCounts.sort(((a, b) => {
        const va1 = this._cmpVal(a, col1), vb1 = this._cmpVal(b, col1);
        let cmp = typeof va1 === 'number' ? dir1 * (va1 - vb1) : dir1 * String(va1).localeCompare(String(vb1), 'he');
        if (cmp !== 0 || !col2) return cmp;
        const va2 = this._cmpVal(a, col2), vb2 = this._cmpVal(b, col2);
        return typeof va2 === 'number' ? dir2 * (va2 - vb2) : dir2 * String(va2).localeCompare(String(vb2), 'he');
      }));
    }
    const hasStatusFilter = !!this._statusFilter;
    const mainList = hasStatusFilter ? withCounts : withCounts.filter((f => (f.status || 'active') !== 'coordinator' && (f.status || 'active') !== 'inactive'));
    const coordList = hasStatusFilter ? [] : withCounts.filter((f => (f.status || 'active') === 'coordinator'));
    const inactiveList = hasStatusFilter ? [] : withCounts.filter((f => (f.status || 'active') === 'inactive'));
    const rowHtml = f => {
      const notesAttr = f.notes ? ` title="${f.notes.replace(/"/g, '&quot;')}"` : '';
      const isCoordOnly = (f.status || 'active') === 'coordinator' && !f.isFacilitator;
      return `<tr>\n        <td${notesAttr}><div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">\n          <strong>${f.name}</strong>\n          ${this._statusBadge(f)}\n          ${f.notes ? '<span style="color:#9ca3af;font-size:0.75rem;cursor:default" title="' + f.notes.replace(/"/g, '&quot;') + '">•••</span>' : ''}\n        </div></td>\n        <td>${f.location || '—'}</td>\n        <td>${isCoordOnly ? '<span style="color:#9ca3af;font-size:0.8rem">—</span>' : (f.days || []).sort().map((d => `<span class="chip chip-purple">${DAYS_SHORT[d]}</span>`)).join('')}</td>\n        <td style="white-space:normal">${isCoordOnly ? '<span style="color:#9ca3af;font-size:0.8rem">גישה מלאה</span>' : [ f.teamPrep && [ 'הכנות', '#2563eb' ], f.teamTraining && [ 'הכשרות', '#8b5cf6' ], f.parentLecture && [ 'הורים', '#059669' ], f.atRisk && [ 'סיכון', '#dc2626' ], f.coordination && [ 'ריכוז', '#0891b2' ] ].filter(Boolean).map((([s, c]) => `<span style="display:inline-block;font-size:0.68rem;padding:2px 7px;margin:1px 2px;border-radius:10px;background:${c}20;color:${c};border:1px solid ${c}60;font-weight:600">${s}</span>`)).join('') + (f.tags || []).map((t => `<span style="display:inline-block;font-size:0.68rem;padding:2px 7px;margin:1px 2px;border-radius:10px;background:#FEF3E2;color:#B45309;border:1px dashed #F3D9A8;font-weight:600">${t}</span>`)).join('') || '—'}</td>\n        <td style="text-align:center">\n          ${isCoordOnly ? '<span style="color:#9ca3af;font-size:0.8rem">—</span>' : `<strong>${f._cnt}</strong>\n          ${Auth.isCoord() ? `<div style="font-size:0.72rem;margin-top:2px;${f._pending > 0 ? 'color:#d97706;font-weight:600' : 'color:#9ca3af'}">\n                ${f._pending > 0 ? `${f._pending} ${f._pending === 1 ? 'ממתין' : 'ממתינים'} לאישור` : '0 ממתינים'}\n               </div>` : ''}`}\n        </td>\n        <td><div class="actions">\n          ${Auth.isCoord() ? `\n          <button class="btn btn-secondary btn-icon" onclick="Facilitators.openModal('${f.id}')" title="עריכה">${ICONS.edit}</button>\n          <button class="btn btn-danger btn-icon" data-id="${f.id}" data-name="${f.name.replace(/"/g, '&quot;')}" onclick="Facilitators._del(this.dataset.id,this.dataset.name)" title="מחיקה">${ICONS.trash}</button>` : ''}\n        </div></td>\n      </tr>`;
    };
    const sectionHtml = (rows, label, show, toggleFn) => `<tr><td colspan="6" style="padding:0">\n        <button class="fac-section-toggle ${show ? 'open' : ''}" onclick="${toggleFn}">\n          <span class="toggle-arrow">▶</span> ${label} (${rows.length})\n        </button>\n      </td></tr>\n      ${show ? rows.map(rowHtml).join('') : ''}`;
    tbody.innerHTML = mainList.map(rowHtml).join('') + (coordList.length ? sectionHtml(coordList, 'רכזות', this._showCoord, `Facilitators._showCoord=!Facilitators._showCoord; Facilitators._refreshTable()`) : '') + (inactiveList.length ? sectionHtml(inactiveList, 'לא פעילים', this._showInactive, `Facilitators._showInactive=!Facilitators._showInactive; Facilitators._refreshTable()`) : '');
  },
  _buildMySessions(myFacId) {
    const today = (new Date).toISOString().slice(0, 10);
    const fws = DB.getFrameworks();
    const _timeRange = slots => {
      const parse = s => {
        const m = s && s.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
        return m ? [ +m[1] * 60 + +m[2], +m[3] * 60 + +m[4] ] : null;
      };
      const ts = slots.map(parse).filter(Boolean);
      if (!ts.length) return '';
      const s = Math.min(...ts.map((t => t[0]))), e = Math.max(...ts.map((t => t[1])));
      return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}-${String(Math.floor(e / 60)).padStart(2, '0')}:${String(e % 60).padStart(2, '0')}`;
    };
    const mySessions = [];
    DB.getAssignments().forEach((a => {
      const fw = fws.find((f => f.id === a.frameworkId));
      (a.sessions || []).forEach((s => {
        if (!(s.facilitatorIds || []).includes(myFacId)) return;
        if (s.date < today) return;
        if (s.status === 'cancelled') return;
        const sent = Auth.isSent(a.id, s.date, myFacId);
        const conf = Auth.getConfirmation(a.id, s.date, myFacId);
        const myRounds = (s.rounds || []).filter((r => (r.facilitatorIds || []).includes(myFacId)));
        const hours = myRounds.length ? _timeRange(myRounds.map((r => r.time))) : fw?.hours || '';
        mySessions.push({
          date: s.date,
          aId: a.id,
          fwName: fw?.name || '—',
          fwGrade: fw?.grade || '',
          hours: hours,
          sent: sent,
          confStatus: conf?.status || null
        });
      }));
    }));
    mySessions.sort(((a, b) => a.date.localeCompare(b.date)));
    return mySessions;
  },
  _myAssignmentsCardsHtml(mySessions) {
    const DAYS = [ 'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת' ];
    const DAYS_LETTER = [ 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש' ];
    const fmtD = d => {
      const dt = new Date(d + 'T12:00:00');
      return `${DAYS[dt.getDay()]} ${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
    };
    const fmtDShort = d => {
      const dt = new Date(d + 'T12:00:00');
      const p = n => String(n).padStart(2, '0');
      return `יום ${DAYS_LETTER[dt.getDay()]}' ${p(dt.getDate())}/${p(dt.getMonth() + 1)}/${String(dt.getFullYear()).slice(2)}`;
    };
    const fmtDayMonth = d => {
      const dt = new Date(d + 'T12:00:00');
      return `${dt.getDate()}/${dt.getMonth() + 1}`;
    };
    const sessRow = s => {
      const isPending = s.sent && !s.confStatus;
      const isConf = s.confStatus === 'confirmed';
      const isDecl = s.confStatus === 'declined';
      const statusCell = isPending ? `<td><span class="status-badge status-partial">ממתין לאישורך</span></td>` : isConf ? `<td><span class="status-badge status-active">אושר ✓</span></td>` : isDecl ? `<td><span class="status-badge status-inactive">נדחה ✗</span></td>` : `<td><span style="color:#9ca3af;font-size:0.8rem">—</span></td>`;
      const icsSent = isConf && Auth.isIcsSent(s.aId, s.date);
      const actions = !isConf ? `<td><span style="color:#9ca3af;font-size:0.8rem">—</span></td>` : `<td><div class="actions" style="gap:4px">\n        ${icsSent ? `<button class="btn btn-secondary btn-sm ics-sent-btn" onclick="Facilitators._sendICS('${s.aId}','${s.date}',this)" title="נשלח ליומן — לשליחה חזרה">✓ נשלח</button>` : `<button class="btn btn-secondary btn-sm" onclick="Facilitators._sendICS('${s.aId}','${s.date}',this)" title="שלח לי זימון ביומן">📅 ליומן</button>`}\n      </div></td>`;
      return `<tr style="${isPending ? 'background:#fefce8' : ''}">\n        <td><strong><span class="date-full">${fmtD(s.date)}</span><span class="date-short">${fmtDShort(s.date)}</span></strong></td>\n        <td>${s.fwName}${s.fwGrade ? `<div class="fw-grade-sub">שכבה ${s.fwGrade}</div>` : ''}</td>\n        <td style="direction:ltr;text-align:right;color:#6b7280">${s.hours || '—'}</td>\n        ${statusCell}\n        ${actions}\n      </tr>`;
    };
    const pendingSessions = mySessions.filter((s => s.sent && !s.confStatus));
    const otherSessions = mySessions.filter((s => !(s.sent && !s.confStatus)));
    const pendingBySeries = [];
    pendingSessions.forEach((s => {
      let grp = pendingBySeries.find((g => g.aId === s.aId));
      if (!grp) {
        grp = {
          aId: s.aId,
          fwName: s.fwName,
          fwGrade: s.fwGrade,
          items: []
        };
        pendingBySeries.push(grp);
      }
      grp.items.push(s);
    }));
    const seriesMeta = grp => {
      const items = grp.items;
      const first = fmtDayMonth(items[0].date), last = fmtDayMonth(items[items.length - 1].date);
      const range = items.length > 1 ? `${first} – ${last}` : first;
      const hoursSet = [ ...new Set(items.map((i => i.hours)).filter(Boolean)) ];
      const hours = hoursSet.length === 1 ? hoursSet[0] : '';
      return `${items.length} מפגש${items.length === 1 ? '' : 'ים'} · ${range}${hours ? ' · ' + hours : ''}`;
    };
    const seriesRow = s => `\n      <div class="fac-series-acc-row">\n        <span><strong><span class="date-full">${fmtD(s.date)}</span><span class="date-short">${fmtDShort(s.date)}</span></strong></span>\n        <span class="h">${s.hours || '—'}</span>\n      </div>`;
    const seriesBlock = grp => `\n      <div class="fac-series-acc">\n        <div class="fac-series-acc-head">\n          <button class="fac-series-acc-toggle" aria-expanded="false" onclick="Facilitators._toggleSeriesAcc(this)">\n            <span class="fac-series-acc-chevron" aria-hidden="true">◂</span>\n            <span>\n              <span class="fac-series-acc-title">${grp.fwName}${grp.fwGrade ? ` · שכבה ${grp.fwGrade}` : ''}</span>\n              <span class="fac-series-acc-meta">${seriesMeta(grp)}</span>\n            </span>\n          </button>\n          <div class="actions" style="gap:6px">\n            <button class="btn btn-success btn-sm" onclick="Auth.confirmSeries('${grp.aId}')">אשר את כל הסדרה ✓</button>\n            <button class="btn btn-danger btn-sm"  onclick="Auth.declineSeries('${grp.aId}')">דחה את כל הסדרה ✗</button>\n          </div>\n        </div>\n        <div class="fac-series-acc-body">${grp.items.map(seriesRow).join('')}</div>\n      </div>`;
    return `\n      <div class="card" style="${pendingSessions.length ? 'border-right:4px solid #d97706' : ''}">\n        <div class="card-header">\n          <h2 style="${pendingSessions.length ? 'color:#d97706' : ''}">ממתינים לאישורך${pendingSessions.length ? ` (${pendingSessions.length})` : ''}</h2>\n        </div>\n        ${pendingBySeries.length ? pendingBySeries.map(seriesBlock).join('') : '<div class="empty-state">אין ממתינים לאישור</div>'}\n      </div>\n\n      <div class="card">\n        <div class="card-header"><h2>שיבוצים קרובים</h2></div>\n        ${otherSessions.length ? `<div class="table-wrap"><table class="fac-dash-table">\n              <thead><tr><th>תאריך</th><th>מסגרת</th><th>שעות</th><th>סטטוס</th><th>פעולות</th></tr></thead>\n              <tbody>${otherSessions.map(sessRow).join('')}</tbody>\n            </table></div>` : `<div class="empty-state">אין שיבוצים קרובים</div>`}\n      </div>`;
  },
  _renderFacDashboard() {
    const myFacId = Auth.currentFacId();
    if (!myFacId) return;
    const myFac = DB.getFacilitators().find((f => f.id === myFacId));
    if (!myFac) return;
    const st = Calendar._getSessionStats(myFacId);
    const yearCount = this._countSessions(myFacId);
    const mySessions = this._buildMySessions(myFacId);
    document.getElementById('facilitators-tab').innerHTML = `\n      <div class="card my-fac-card">\n        <div class="card-header"><h2>שלום, ${myFac.name}</h2></div>\n        <div class="card-body">\n          <div class="my-fac-stats">\n            <div class="my-fac-stat ${st.pending > 0 ? 'stat-urgent' : 'stat-ok'}">\n              <div class="my-fac-stat-val">${st.pending}</div>\n              <div class="my-fac-stat-label">ממתינים לאישורך</div>\n            </div>\n            <div class="my-fac-stat stat-ok">\n              <div class="my-fac-stat-val">${st.confirmed}</div>\n              <div class="my-fac-stat-label">שיבוצים שאושרו</div>\n            </div>\n            ${st.declined ? `<div class="my-fac-stat">\n              <div class="my-fac-stat-val" style="color:#9ca3af">${st.declined}</div>\n              <div class="my-fac-stat-label">שנדחו</div>\n            </div>` : ''}\n            <div class="my-fac-stat">\n              <div class="my-fac-stat-val">${yearCount}</div>\n              <div class="my-fac-stat-label">סה"כ שיבוצים בשנה"ל הנוכחית</div>\n            </div>\n          </div>\n          <div class="my-fac-actions">\n            <button class="btn btn-secondary btn-sm" onclick="Calendar._openDownloadModal()">↓ הורד רשימת שיבוצים</button>\n          </div>\n        </div>\n      </div>\n\n      ${this._myAssignmentsCardsHtml(mySessions)}`;
  },
  _myFacAssignmentsPreview() {
    const myFacId = Auth.currentFacId();
    if (!myFacId) return '';
    const myFac = DB.getFacilitators().find((f => f.id === myFacId));
    if (!myFac || !myFac.isFacilitator) return '';
    const mySessions = this._buildMySessions(myFacId);
    if (!mySessions.length) return '';
    return `\n      <h3 style="margin:1.5rem 0 0.75rem;color:var(--primary);font-size:1rem">השיבוצים שלי כמנחה</h3>\n      ${this._myAssignmentsCardsHtml(mySessions)}`;
  },
  _toggleSeriesAcc(btn) {
    const wrap = btn.closest('.fac-series-acc');
    const open = wrap.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  },
  async _sendICS(aId, date, btn) {
    try {
      await runButtonFeedback(btn, (async () => {
        const res = await API.post('/api/export/calendar-invite', {
          assignment_id: aId,
          date: date
        });
        if (!res.email_sent) throw Object.assign(new Error(`שגיאה בשליחה: ${res.error || 'לא ידוע'}`), {
          emailFail: true
        });
      }));
      Auth.markIcsSent(aId, date);
      setTimeout((() => this.render()), 700);
    } catch (err) {
      alert(err.message);
    }
  },
  openModal(id) {
    const f = id ? DB.getFacilitators().find((x => x.id === id)) : null;
    const st = f?.status || 'active';
    const isCoordStatus = st === 'coordinator';
    openModal(f ? 'עריכת פרטים' : 'הוספת אדם', `\n      <form id="fac-form">\n        <div class="form-row">\n          <div class="form-group">\n            <label class="form-label">שם מלא *</label>\n            <input class="form-control" id="f-name" value="${f?.name || ''}" required placeholder="שם מלא">\n          </div>\n          <div class="form-group">\n            <label class="form-label">אימייל (לכניסה למערכת) *</label>\n            <input class="form-control" type="email" id="f-email" value="${f?.email || ''}" required\n              placeholder="name@email.com" style="direction:ltr;text-align:left">\n          </div>\n        </div>\n        <div class="form-group" style="max-width:200px">\n          <label class="form-label">סטטוס</label>\n          <select class="form-control" id="f-status" onchange="Facilitators._onStatusChange()">\n            <option value="active"      ${st === 'active' ? 'selected' : ''}>מנחה פעיל</option>\n            <option value="coordinator" ${st === 'coordinator' ? 'selected' : ''}>רכזת</option>\n            <option value="inactive"    ${st === 'inactive' ? 'selected' : ''}>לא פעיל</option>\n          </select>\n        </div>\n        <div class="form-group" id="f-is-fac-group" style="${isCoordStatus ? '' : 'display:none'}">\n          <label class="skill-label">\n            <input type="checkbox" id="f-is-fac" ${f?.isFacilitator && isCoordStatus ? 'checked' : ''}>\n            גם מנחה — ניתן לשיבוץ בפגישות\n          </label>\n        </div>\n        <div id="f-facilitator-fields" style="${isCoordStatus && !f?.isFacilitator ? 'display:none' : ''}">\n          <div class="form-group">\n            <label class="form-label">ימי פניות בשבוע</label>\n            <div class="days-group">\n              ${[ 0, 1, 2, 3, 4 ].map((i => `\n                <button type="button" class="day-toggle ${(f?.days || []).includes(i) ? 'on' : ''}"\n                  data-day="${i}" onclick="this.classList.toggle('on')">${DAYS_SHORT[i]}</button>`)).join('')}\n            </div>\n          </div>\n          <div class="form-group">\n            <label class="form-label">סוגי פעילויות</label>\n            <div class="skill-group">\n              <label class="skill-label"><input type="checkbox" id="f-tp"  ${f?.teamPrep ? 'checked' : ''}>הכנות</label>\n              <label class="skill-label"><input type="checkbox" id="f-tt"  ${f?.teamTraining ? 'checked' : ''}>הכשרות</label>\n              <label class="skill-label"><input type="checkbox" id="f-pl"  ${f?.parentLecture ? 'checked' : ''}>הורים</label>\n              <label class="skill-label"><input type="checkbox" id="f-ar"  ${f?.atRisk ? 'checked' : ''}>נוער בסיכון</label>\n              <label class="skill-label"><input type="checkbox" id="f-co"  ${f?.coordination ? 'checked' : ''}>ריכוז</label>\n            </div>\n          </div>\n          <div class="form-group">\n            <label class="form-label">קבוצות</label>\n            <div class="skill-group">\n              ${GROUP_TAGS.map(((t, i) => `\n                <label class="skill-label"><input type="checkbox" class="f-group-tag" data-tag="${t}" ${(f?.tags || []).includes(t) ? 'checked' : ''}>${t}</label>`)).join('')}\n            </div>\n          </div>\n          <div class="form-row">\n            <div class="form-group">\n              <label class="form-label">טלפון</label>\n              <input class="form-control" type="tel" id="f-phone" value="${f?.phone || ''}"\n                placeholder="050-1234567" style="direction:ltr;text-align:left">\n            </div>\n            <div class="form-group">\n              <label class="form-label">מקום מגורים</label>\n              <input class="form-control" id="f-loc" value="${f?.location || ''}" placeholder="עיר / אזור">\n            </div>\n          </div>\n        </div>\n        <div class="form-group">\n          <label class="form-label">הערות</label>\n          <textarea class="form-control" id="f-notes" rows="2" placeholder="הערות אישיות...">${f?.notes || ''}</textarea>\n        </div>\n        <div class="modal-actions">\n          <button type="submit" class="btn btn-primary" onclick="Facilitators._save('${id || ''}');return false">שמור</button>\n          <button type="button" class="btn btn-secondary" onclick="closeModal()">ביטול</button>\n        </div>\n      </form>`);
  },
  _onStatusChange() {
    const status = document.getElementById('f-status')?.value;
    const isFacGroup = document.getElementById('f-is-fac-group');
    const facFields = document.getElementById('f-facilitator-fields');
    if (!isFacGroup || !facFields) return;
    if (status === 'coordinator') {
      isFacGroup.style.display = '';
      const isFacChecked = document.getElementById('f-is-fac')?.checked;
      facFields.style.display = isFacChecked ? '' : 'none';
    } else {
      isFacGroup.style.display = 'none';
      facFields.style.display = '';
    }
  },
  async _save(id) {
    const name = document.getElementById('f-name').value.trim();
    const email = (document.getElementById('f-email')?.value || '').trim().toLowerCase();
    if (!name) return alert('שם הוא שדה חובה');
    if (!email) return alert('אימייל הוא שדה חובה');
    const status = document.getElementById('f-status').value || 'active';
    const isCoordStatus = status === 'coordinator';
    const isFacilitator = isCoordStatus ? !!document.getElementById('f-is-fac')?.checked : true;
    const days = isFacilitator || !isCoordStatus ? [ ...document.querySelectorAll('.day-toggle.on') ].map((b => +b.dataset.day)) : [];
    try {
      const saved = await DB.saveFacilitator({
        id: id || null,
        name: name,
        location: document.getElementById('f-loc')?.value.trim() || '',
        phone: document.getElementById('f-phone')?.value.trim() || '',
        email: email,
        days: days,
        teamPrep: !isCoordStatus || isFacilitator ? document.getElementById('f-tp')?.checked || false : false,
        teamTraining: !isCoordStatus || isFacilitator ? document.getElementById('f-tt')?.checked || false : false,
        parentLecture: !isCoordStatus || isFacilitator ? document.getElementById('f-pl')?.checked || false : false,
        atRisk: !isCoordStatus || isFacilitator ? document.getElementById('f-ar')?.checked || false : false,
        coordination: !isCoordStatus || isFacilitator ? document.getElementById('f-co')?.checked || false : false,
        tags: !isCoordStatus || isFacilitator ? [ ...document.querySelectorAll('.f-group-tag:checked') ].map((el => el.dataset.tag)) : [],
        isFacilitator: isFacilitator,
        status: status,
        notes: document.getElementById('f-notes').value.trim()
      });
      await this._syncUserAccount(saved.id, name, email, status, isFacilitator);
      closeModal();
      this.render();
      _syncScreens('facilitator');
    } catch (err) {
      alert(err.message);
    }
  },
  async _syncUserAccount(facId, name, email, status, isFacilitator) {
    if (!Auth.isCoord()) return;
    if (!email) return;
    const role = status === 'coordinator' ? 'coordinator' : 'facilitator';
    const linkedUser = Auth.getUsers().find((u => u.facilitatorId === facId));
    if (linkedUser) {
      const emailChanged = linkedUser.email !== email;
      const nameChanged = linkedUser.name !== name;
      const roleChanged = linkedUser.role !== role;
      if (emailChanged || nameChanged || roleChanged) {
        const conflict = emailChanged ? Auth.findByEmail(email) : null;
        if (!conflict || conflict.id === linkedUser.id) {
          await Auth.saveUser({
            ...linkedUser,
            name: name,
            role: role,
            ...emailChanged ? {
              email: email
            } : {}
          });
        }
      }
      return;
    }
    if (status === 'inactive') return;
    const byEmail = Auth.findByEmail(email);
    if (byEmail) {
      if (!byEmail.facilitatorId) {
        await Auth.saveUser({
          ...byEmail,
          facilitatorId: facId,
          role: role
        });
      }
    } else {
      await Auth.saveUser({
        id: null,
        email: email,
        name: name,
        mustSetPassword: true,
        role: role,
        facilitatorId: facId
      });
    }
  },
  async _del(id, name) {
    if (confirm(`למחוק את "${name}"?`)) {
      try {
        const linkedUser = Auth.getUsers().find((u => u.facilitatorId === id));
        if (linkedUser) {
          await Auth.delUser(linkedUser.id).catch((() => {}));
        }
        await DB.delFacilitator(id);
        this.render();
        _syncScreens('facilitator');
      } catch (err) {
        alert(err.message);
      }
    }
  }
};

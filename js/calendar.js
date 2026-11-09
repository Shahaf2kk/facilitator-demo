const FW_BADGE_SKILL_MAP = {
  prep: 'teamPrep',
  training: 'teamTraining',
  parent: 'parentLecture'
};

const Calendar = {
  year: (new Date).getFullYear(),
  month: (new Date).getMonth(),
  _searchTerm: '',
  _editingAId: null,
  _pendingFilter: false,
  _statusFilter: '',
  _fwStatusFilter: '',
  _dpState: {},
  render() {
    const tab = document.getElementById('calendar-tab');
    tab.innerHTML = `\n      <div class="calendar-toolbar">\n        <div class="cal-toolbar-row">\n          <div class="cal-nav">\n            <button class="cal-nav-btn" onclick="Calendar.prev()">&#8249;</button>\n            <span class="cal-month-title">${MONTHS_HE[this.month]} ${this.year}</span>\n            <button class="cal-nav-btn" onclick="Calendar.next()">&#8250;</button>\n            <button class="cal-nav-btn cal-today-btn" onclick="Calendar.goToday()" title="חזור לחודש הנוכחי">היום</button>\n          </div>\n          <input type="text" class="cal-search" id="cal-search-input"\n            placeholder="חיפוש חופשי: מסגרת, מנחה, שכבה, שעות..."\n            value="${this._searchTerm}"\n            oninput="Calendar._searchTerm=this.value;Calendar._redrawWeeks()">\n          ${Auth.isCoord() ? `<button class="btn btn-primary btn-sm" onclick="Calendar.openNew()">+ שיבוץ חדש</button>` : ''}\n        </div>\n        ${Auth.isCoord() ? `<div class="cal-toolbar-row cal-toolbar-filters">${this._filterBarInner()}</div>` : ''}\n      </div>\n\n\n      <div class="calendar-grid">\n        <div class="cal-scroll">\n          <div class="cal-head">\n            ${DAYS_HE.map((d => `<div class="cal-head-cell">${d}</div>`)).join('')}\n          </div>\n          <div class="cal-weeks">${this._weeks()}</div>\n        </div>\n      </div>\n\n      <div class="fw-legend-wrap">\n        <button class="legend-toggle-btn" aria-expanded="false" aria-controls="fw-legend-panel"\n          onclick="Calendar._toggleLegend(this)">\n          מקרא <span class="legend-toggle-arrow" aria-hidden="true">▾</span>\n        </button>\n        <div class="fw-legend" id="fw-legend-panel" role="group" aria-label="מקרא הסימנים בלוח">\n          <div class="legend-group">\n            <div class="legend-group-title">סוג פעילות:</div>\n            <div class="legend-group-items">\n              <span class="legend-item"><span class="legend-dot" aria-hidden="true" style="background:#059669"></span>פורמלי</span>\n              <span class="legend-item"><span class="legend-dot" aria-hidden="true" style="background:#2563eb"></span>בלתי פורמלי / נוער בסיכון</span>\n              <span class="legend-item"><span class="legend-dot" aria-hidden="true" style="background:#8b5cf6"></span>פנים ארגוני</span>\n              <span class="legend-item"><span class="session-num" aria-hidden="true">1</span>מפגש ראשון בסדרה</span>\n              <span class="legend-item"><span class="session-num session-num-last" aria-hidden="true">3</span>מפגש אחרון בסדרה</span>\n            </div>\n          </div>\n          <div class="legend-group">\n            <div class="legend-group-title">תגי קטגוריה:</div>\n            <div class="legend-group-items">\n              <span class="legend-item"><span class="chip-type-label legend-type-tag" aria-hidden="true">הכנה</span>הכנת צוות</span>\n              <span class="legend-item"><span class="chip-type-label legend-type-tag" aria-hidden="true">הכשרה</span>הכשרת צוות</span>\n              <span class="legend-item"><span class="chip-type-label legend-type-tag" aria-hidden="true">הורים</span>הרצאה להורים</span>\n              <span class="legend-item"><span class="chip-type-label legend-type-tag" aria-hidden="true">השלמה</span>מפגש השלמה</span>\n            </div>\n          </div>\n          ${Auth.isCoord() ? `\n          <div class="legend-group">\n            <div class="legend-group-title">סטטוס מסגרת (צבע המסגרת):</div>\n            <div class="legend-group-items">\n              <span class="legend-item"><span class="legend-dot" aria-hidden="true" style="background:${fwStatusColor('tentative')}"></span>משוריין טנטטיבית</span>\n              <span class="legend-item"><span class="legend-dot" aria-hidden="true" style="background:${fwStatusColor('waiting')}"></span>מחכה לטופס</span>\n              <span class="legend-item"><span class="legend-dot" aria-hidden="true" style="background:${fwStatusColor('confirmed')}"></span>סגור ומאושר</span>\n            </div>\n          </div>\n          <div class="legend-group">\n            <div class="legend-group-title">מנחים במפגש:</div>\n            <div class="legend-group-items">\n              <span class="legend-item"><span class="fac-missing" aria-hidden="true" style="color:var(--text-mid)">?</span>מנחה לא שובץ (חסר לשיבוץ)</span>\n              <span class="legend-item"><span class="conf-badge conf-pending" aria-hidden="true">?</span>מנחה שובץ, טרם ענה לזימון</span>\n              <span class="legend-item"><span class="conf-badge conf-yes" aria-hidden="true">✓</span>מנחה אישר שיבוץ</span>\n              <span class="legend-item"><span class="conf-badge conf-no" aria-hidden="true">✗</span>מנחה דחה שיבוץ</span>\n              <span class="legend-item"><span class="coord-name-tag" aria-hidden="true">שם</span>רכז/ת מסגרת</span>\n            </div>\n          </div>` : ''}\n        </div>\n      </div>\n\n`;
  },
  prev() {
    if (this.month === 0) {
      this.month = 11;
      this.year--;
    } else this.month--;
    this.render();
  },
  next() {
    if (this.month === 11) {
      this.month = 0;
      this.year++;
    } else this.month++;
    this.render();
  },
  goToday() {
    const n = new Date;
    this.year = n.getFullYear();
    this.month = n.getMonth();
    this.render();
  },
  _toggleLegend(btn) {
    const wrap = btn.closest('.fw-legend-wrap');
    const open = wrap.classList.toggle('legend-open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  },
  _redrawWeeks() {
    const el = document.querySelector('.cal-weeks');
    if (el) el.innerHTML = this._weeks();
  },
  _weeks() {
    const today = todayStr();
    const firstDay = new Date(this.year, this.month, 1);
    const lastDay = new Date(this.year, this.month + 1, 0);
    const cur = new Date(firstDay);
    while (cur.getDay() !== 0) cur.setDate(cur.getDate() - 1);
    const weeks = [];
    while (cur <= lastDay) {
      const cells = [];
      for (let d = 0; d < 7; d++) {
        const cell = new Date(cur);
        cell.setDate(cur.getDate() + d);
        const ds = dateToStr(cell);
        const otherMonth = cell.getMonth() !== this.month;
        const isToday = ds === today;
        const term = (this._searchTerm || '').trim();
        const myFacId = Auth.currentFacId();
        const allSessions = this._sessionsOn(ds);
        let sessions = term ? allSessions.filter((s => {
          const fw = DB.getFrameworks().find((f => f.id === s.frameworkId));
          const facs = (s.facilitatorIds || []).map((id => DB.getFacilitators().find((f => f.id === id))?.name || '')).join(' ');
          const haystack = [ fw?.name || '', fw?.grade || '', fw?.hours || '', fw?.type || '', facs ].join(' ').toLowerCase();
          return haystack.includes(term.toLowerCase());
        })) : allSessions;
        if (this._pendingFilter && myFacId) {
          sessions = sessions.filter((s => {
            if (!(s.facilitatorIds || []).includes(myFacId)) return false;
            if (!Auth.isSent(s.aId, ds, myFacId)) return false;
            const conf = Auth.getConfirmation(s.aId, ds, myFacId);
            return !conf || conf.status !== 'confirmed';
          }));
        }
        if (Auth.isCoord() && (this._statusFilter || this._fwStatusFilter)) {
          sessions = sessions.filter((s => {
            if ((s.status || 'active') !== 'active') return false;
            const fw = DB.getFrameworks().find((f => f.id === s.frameworkId));
            if (this._fwStatusFilter && (fw?.status || 'tentative') !== this._fwStatusFilter) return false;
            if (!this._statusFilter) return true;
            const facIds = s.facilitatorIds || [];
            if (this._statusFilter === 'unassigned') return facIds.length === 0;
            if (this._statusFilter === 'understaffed') {
              const hasRounds = (s.rounds || []).length > 1;
              if (hasRounds) {
                const flatFacIds = [ ...new Set(s.rounds.flatMap((r => r.facilitatorIds || []))) ];
                const maxRequired = Math.max(...s.rounds.map((r => r.requiredCount || fw?.facilitatorsPerRound || 1)));
                return flatFacIds.length < maxRequired;
              }
              const required = fw?.facilitatorsPerRound || 1;
              return facIds.length < required;
            }
            if (this._statusFilter === 'notsent') {
              return facIds.length > 0 && facIds.every((fId => !Auth.isSent(s.aId, ds, fId)));
            }
            if (this._statusFilter === 'pending') {
              const someSent = facIds.some((fId => Auth.isSent(s.aId, ds, fId)));
              if (!someSent) return false;
              return facIds.some((fId => {
                if (!Auth.isSent(s.aId, ds, fId)) return true;
                const conf = Auth.getConfirmation(s.aId, ds, fId);
                return !conf || conf.status !== 'confirmed';
              }));
            }
            return true;
          }));
        }
        sessions = sessions.slice().sort(((a, b) => {
          const fwA = DB.getFrameworks().find((f => f.id === a.frameworkId));
          const fwB = DB.getFrameworks().find((f => f.id === b.frameworkId));
          return this._sessionStartMinutes(a, fwA) - this._sessionStartMinutes(b, fwB);
        }));
        const holidays = this._holidaysOn(ds);
        const dropAttrs = Auth.isCoord() ? `ondragenter="Calendar._onCellDragEnter(event)" ondragover="Calendar._onCellDragOver(event)" ondragleave="Calendar._onCellDragLeave(event)" ondrop="Calendar._onCellDrop(event,'${ds}')"` : '';
        cells.push(`\n          <div class="cal-cell${otherMonth ? ' other-month' : ''}${isToday ? ' is-today' : ''}${holidays.length ? ' has-holiday' : ''}" ${dropAttrs}>\n            <div class="cal-cell-top">\n              <span class="cal-date${isToday ? ' today-num' : ''}">${cell.getDate()}</span>\n              ${Auth.isCoord() ? `<button class="cal-add-btn" title="פעולות ליום זה" onclick="Calendar._openDayMenu(event,'${ds}')">+</button>` : ''}\n            </div>\n            ${holidays.map((h => `<div class="holiday-label">${h.name}</div>`)).join('')}\n            ${sessions.map((s => {
          const fw = DB.getFrameworks().find((f => f.id === s.frameworkId));
          const isCoordView = Auth.isCoord();
          const col = isCoordView ? fwStatusColor(fw?.status || 'tentative') : fwColor(s.frameworkId);
          const isFirst = s.totalSessions > 1 && s.sessionIdx === 0;
          const isLast = s.sessionIdx === s.totalSessions - 1;
          const badge = isFirst ? '<span class="session-num" title="מפגש ראשון בסדרה">1</span>' : isLast ? `<span class="session-num session-num-last" title="${s.totalSessions === 1 ? 'מפגש יחיד בסדרה' : 'מפגש אחרון בסדרה'}">${s.totalSessions}</span>` : '';
          const hasRounds = (s.rounds || []).length > 1;
          const coordIds = new Set(s.aCoordinatorIds || []);
          const _confBadge = fid => {
            if (!Auth.isCoord()) return '';
            if (!Auth.isSent(s.aId, ds, fid)) return '';
            const c = Auth.getConfirmation(s.aId, ds, fid);
            if (c?.status === 'confirmed') return `<span class="conf-badge conf-badge-chip conf-yes">✓</span>`;
            if (c?.status === 'declined') return `<span class="conf-badge conf-badge-chip conf-no">✗</span>`;
            return `<span class="conf-badge conf-badge-chip conf-pending">?</span>`;
          };
          const myFacId = Auth.currentFacId();
          let isFacPending = false, isFacDeclined = false, confBar = '';
          if (Auth.isFac() && myFacId && (s.facilitatorIds || []).includes(myFacId)) {
            if (Auth.isSent(s.aId, ds, myFacId)) {
              const _myConf = Auth.getConfirmation(s.aId, ds, myFacId);
              if (_myConf?.status === 'declined') {
                isFacDeclined = true;
              } else if (!_myConf) {
                isFacPending = true;
                confBar = `<div class="fac-pending-bar" onclick="event.stopPropagation();showTab('facilitators')">ממתין לאישור</div>`;
              }
            }
          }
          let subLabel, tooltip, reqCount = 1;
          if (hasRounds) {
            const allFacIds = [ ...new Set(s.rounds.flatMap((r => r.facilitatorIds || []))) ];
            const facObjs = allFacIds.map((id => DB.getFacilitators().find((f => f.id === id)))).filter(Boolean);
            facObjs.sort(((a, b) => (coordIds.has(b.id) ? 1 : 0) - (coordIds.has(a.id) ? 1 : 0)));
            const names = facObjs.map((f => {
              const fname = facDisplayName(f);
              let nameHtml = coordIds.has(f.id) ? isCoordView ? `<span class="coord-name-tag">${fname}</span>` : `<span style="color:#ffb3b3;font-weight:700">★${fname}</span>` : fname;
              if (isFacDeclined && f.id === myFacId) nameHtml = `<s>${nameHtml}</s>`;
              return nameHtml + _confBadge(f.id);
            }));
            const maxRequired = Math.max(...s.rounds.map((r => r.requiredCount || fw?.facilitatorsPerRound || 1)));
            const roundsMissing = Math.max(0, maxRequired - allFacIds.length);
            for (let i = 0; i < roundsMissing; i++) names.push('<span class="fac-missing">?</span>');
            subLabel = names.join(', ');
            reqCount = maxRequired;
            tooltip = s.rounds.map(((r, i) => `סבב ${i + 1} (${r.time}): ${r.facilitatorIds.length} מנחים`)).join(' | ');
          } else {
            const facObjs = (s.facilitatorIds || []).map((id => DB.getFacilitators().find((f => f.id === id)))).filter(Boolean);
            facObjs.sort(((a, b) => (coordIds.has(b.id) ? 1 : 0) - (coordIds.has(a.id) ? 1 : 0)));
            const names = facObjs.map((f => {
              const fname = facDisplayName(f);
              let nameHtml = coordIds.has(f.id) ? isCoordView ? `<span class="coord-name-tag">${fname}</span>` : `<span style="color:#ffb3b3;font-weight:700">★${fname}</span>` : fname;
              if (isFacDeclined && f.id === myFacId) nameHtml = `<s>${nameHtml}</s>`;
              return nameHtml + _confBadge(f.id);
            }));
            const required = fw?.facilitatorsPerRound || 1;
            const missing = Math.max(0, required - facObjs.length);
            for (let i = 0; i < missing; i++) names.push('<span class="fac-missing">?</span>');
            subLabel = names.join(', ');
            reqCount = required;
            tooltip = fw?.hours ? `${fw.hours}: ${facObjs.length} מנחים` : `${facObjs.length} מנחים`;
          }
          let statusTitleLine = '';
          if (isCoordView) {
            const FW_STATUS_LABEL = {
              tentative: 'משוריין טנטטיבית',
              waiting: 'מחכות לטופס',
              confirmed: 'סגור ומאושר'
            };
            statusTitleLine = `סטטוס מסגרת: ${FW_STATUS_LABEL[fw?.status || 'tentative']}\n`;
          }
          const TYPE_LABELS = {
            prep: 'הכנה',
            training: 'הכשרה',
            parent: 'הורים',
            completion: 'השלמה'
          };
          const typeLabel = TYPE_LABELS[fw?.badge] || null;
          const rawName = fw?.name || '?';
          const dispName = typeLabel ? rawName.replace(/^(הכנה לצוות|הכשרה מקוצרת לצוות|הכשרה לצוות|הכשרת צוות|הרצאה להורים|הרצאה הורים)\s*/i, '').trim() || rawName : rawName;
          const typeBadge = typeLabel ? `<span class="chip-type-label">${typeLabel}</span>` : '';
          const SECTOR_LABEL = {
            informal: 'בלתי פורמלי / נוער בסיכון',
            internal: 'פנים ארגוני'
          };
          const sectorDot = isCoordView ? `<span class="chip-sector-dot" style="background:${fwTypeColor(fw?.type)}" title="${SECTOR_LABEL[fw?.type] || 'פורמלי'}"></span>` : '';
          const gradeLabel = fw?.grade ? ` <span class="chip-grade">${fw.grade}</span>` : '';
          const sessionStatus = s.status || 'active';
          const chipClass = sessionStatus === 'cancelled' ? ' chip-cancelled' : sessionStatus === 'postponed' ? ' chip-postponed' : '';
          const statusLabel = sessionStatus === 'cancelled' ? '<span class="chip-status-label">בוטל</span>' : sessionStatus === 'postponed' ? '<span class="chip-status-label chip-status-postponed">נדחה</span>' : '';
          const dragAttrs = Auth.isCoord() ? `draggable="true" ondragstart="Calendar._onChipDragStart(event,'${s.aId}','${ds}')" ondragend="Calendar._onChipDragEnd(event)"` : '';
          const chipOnclick = isFacPending ? `showTab('facilitators')` : `Calendar.openSessionDetail('${s.aId}','${ds}')`;
          return `<div class="session-chip${chipClass}${isCoordView ? ' chip-status-view' : ''}" style="background:${col}"\n                ${dragAttrs}\n                onclick="${chipOnclick}"\n                title="${statusTitleLine}${tooltip}">\n                ${confBar}\n                <div class="chip-title-row">${sectorDot}${badge}${typeBadge}${statusLabel}${dispName}${gradeLabel} <span class="fac-required">(${reqCount})</span></div>\n                ${subLabel ? `<div class="chip-facs-row">${subLabel}</div>` : ''}\n              </div>`;
        })).join('')}\n          </div>`);
      }
      weeks.push(`<div class="cal-week">${cells.join('')}</div>`);
      cur.setDate(cur.getDate() + 7);
    }
    return weeks.join('');
  },
  async _deleteSeries(aId) {
    const a = DB.getAssignments().find((x => x.id === aId));
    if (!a) return;
    const fw = DB.getFrameworks().find((f => f.id === a.frameworkId));
    const count = (a.sessions || []).length;
    if (!confirm(`למחוק את כל הסדרה (${fw?.name || ''} — ${count} מפגשים) לצמיתות?`)) return;
    try {
      await DB.delAssignment(aId);
      closeModal();
      _syncScreens('assignment');
    } catch (err) {
      alert(err.message);
    }
  },
  async _deleteSession(aId, dateStr) {
    if (!confirm('למחוק את המפגש לצמיתות?')) return;
    const a = DB.getAssignments().find((x => x.id === aId));
    if (!a) return;
    const remaining = (a.sessions || []).filter((s => s.date !== dateStr));
    try {
      if (!remaining.length) {
        await DB.delAssignment(aId);
      } else {
        await DB.delSession(aId, dateStr);
      }
      closeModal();
      _syncScreens('assignment');
    } catch (err) {
      alert(err.message);
    }
  },
  _onChipDragStart(e, aId, dateStr) {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      aId: aId,
      dateStr: dateStr
    }));
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('chip-dragging');
  },
  _onChipDragEnd(e) {
    e.currentTarget.classList.remove('chip-dragging');
  },
  _onCellDragEnter(e) {
    e.currentTarget.classList.add('cal-cell-drop-target');
  },
  _onCellDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  },
  _onCellDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      e.currentTarget.classList.remove('cal-cell-drop-target');
    }
  },
  _onCellDrop(e, toDate) {
    e.preventDefault();
    e.currentTarget.classList.remove('cal-cell-drop-target');
    let payload;
    try {
      payload = JSON.parse(e.dataTransfer.getData('text/plain'));
    } catch {
      return;
    }
    const {aId: aId, dateStr: fromDate} = payload;
    if (!aId || fromDate === toDate) return;
    this._moveSession(aId, fromDate, toDate);
  },
  async _moveSession(aId, fromDate, toDate) {
    const a = DB.getAssignments().find((x => x.id === aId));
    if (!a) return;
    if ((a.sessions || []).some((s => s.date === toDate))) {
      alert('בתאריך זה כבר קיים מפגש מאותה סדרה');
      return;
    }
    const s = (a.sessions || []).find((s => s.date === fromDate));
    if (!s) return;
    try {
      await DB.moveSession(aId, fromDate, toDate);
      s.date = toDate;
      a.sessions.sort(((x, y) => x.date.localeCompare(y.date)));
      await DB.reloadConfirmations();
      _syncScreens('assignment');
    } catch (err) {
      alert(err.message);
    }
  },
  async sendAllFacsInSession(aId, dateStr, btn) {
    const a = DB.getAssignments().find((x => x.id === aId));
    if (!a) return;
    const s = (a.sessions || []).find((s => s.date === dateStr));
    if (!s) return;
    const allFacIds = [ ...new Set((s.facilitatorIds || []).concat((s.rounds || []).flatMap((r => r.facilitatorIds || [])))) ];
    try {
      await runButtonFeedback(btn, (async () => {
        const results = await Promise.all(allFacIds.map((fid => Auth.sendAllInAssignment(aId, fid))));
        const fails = allFacIds.map(((fid, i) => ({
          fid: fid,
          series: true,
          error: results[i]?.email_error
        }))).filter(((f, i) => results[i] && !results[i].marked));
        if (fails.length) throw Object.assign(new Error('email-fail'), {
          fails: fails
        });
      }));
      await DB.reloadConfirmations();
      setTimeout((() => this.openSessionDetail(aId, dateStr)), 700);
    } catch (err) {
      await DB.reloadConfirmations().catch((() => {}));
      this.openSessionDetail(aId, dateStr);
      if (err.fails) this._showEmailErrInModal(aId, dateStr, err.fails, allFacIds.length); else alert(err.message);
    }
  },
  async _setSessionStatus(aId, dateStr, status) {
    const a = DB.getAssignments().find((x => x.id === aId));
    if (!a) return;
    const s = (a.sessions || []).find((s => s.date === dateStr));
    if (!s) return;
    s.status = status;
    try {
      await DB.saveAssignment(a);
      closeModal();
      _syncScreens('assignment');
    } catch (err) {
      alert(err.message);
    }
  },
  async _sendOneAndRefresh(aId, fid, dateStr, btn) {
    try {
      await runButtonFeedback(btn, (async () => {
        const res = await Auth.sendForConfirmation(aId, dateStr, fid, true);
        if (res && !res.marked) throw Object.assign(new Error('email-fail'), {
          fails: [ {
            fid: fid,
            series: false,
            error: res.email_error
          } ]
        });
      }));
      await DB.reloadConfirmations();
      setTimeout((() => this.openSessionDetail(aId, dateStr)), 700);
    } catch (err) {
      await DB.reloadConfirmations().catch((() => {}));
      this.openSessionDetail(aId, dateStr);
      if (err.fails) this._showEmailErrInModal(aId, dateStr, err.fails, 1); else alert(err.message);
    }
  },
  async _sendSeriesAndRefresh(aId, fid, dateStr, btn) {
    try {
      await runButtonFeedback(btn, (async () => {
        const res = await Auth.sendAllInAssignment(aId, fid);
        if (res && !res.marked) throw Object.assign(new Error('email-fail'), {
          fails: [ {
            fid: fid,
            series: true,
            error: res.email_error
          } ]
        });
      }));
      await DB.reloadConfirmations();
      setTimeout((() => this.openSessionDetail(aId, dateStr)), 700);
    } catch (err) {
      await DB.reloadConfirmations().catch((() => {}));
      this.openSessionDetail(aId, dateStr);
      if (err.fails) this._showEmailErrInModal(aId, dateStr, err.fails, 1); else alert(err.message);
    }
  },
  _showEmailErrInModal(aId, dateStr, fails, totalCount) {
    const facName = fid => DB.getFacilitators().find((f => f.id === fid))?.name || '?';
    const banner = document.createElement('div');
    banner.className = 'email-err-banner';
    banner.innerHTML = `<span>⚠</span><div>\n      <strong>שגיאת מייל:</strong>\n      ${fails.length === totalCount ? 'המייל לא נשלח' : `${fails.length} מתוך ${totalCount} מיילים לא נשלחו`},\n      והבקשה <strong>לא נרשמה</strong> במערכת. אפשר לנסות שוב, או לשלוח ידנית:\n      ${fails.map((f => `<div class="fac-conf-row">\n        <span class="fac-conf-name">${facName(f.fid)}</span>\n        <button class="btn btn-secondary btn-xs" onclick="Calendar._markSentManually('${aId}','${dateStr}','${f.fid}',${f.series})">סמן כנשלח ושלח ידנית 📋</button>\n      </div>`)).join('')}\n    </div>`;
    const modal = document.querySelector('.modal-body') || document.querySelector('.modal-content');
    if (modal) modal.prepend(banner);
  },
  async _markSentManually(aId, dateStr, fid, series) {
    try {
      if (series) await Auth.sendAllInAssignment(aId, fid, true); else await Auth.sendForConfirmation(aId, dateStr, fid, true, true);
      await DB.reloadConfirmations();
      _syncScreens('assignment');
      this.openCopyMessageModal(aId, dateStr, fid);
    } catch (err) {
      alert(err.message);
    }
  },
  _buildMonthCopyMessage(fid, ym) {
    const fac = DB.getFacilitators().find((f => f.id === fid));
    const DAYS = [ 'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת' ];
    const rows = [];
    DB.getAssignments().forEach((a => {
      const fw = DB.getFrameworks().find((f => f.id === a.frameworkId));
      (a.sessions || []).forEach((s => {
        if (!s.date.startsWith(ym) || !(s.facilitatorIds || []).includes(fid)) return;
        if ((s.status || 'active') === 'cancelled') return;
        const d = new Date(s.date + 'T12:00:00');
        const times = (s.rounds || []).filter((r => (r.facilitatorIds || []).includes(fid))).map((r => r.time)).filter(Boolean);
        const hrs = times.length ? times.join(', ') : fw?.hours || '';
        rows.push({
          date: s.date,
          line: `• יום ${DAYS[d.getDay()]} ${s.date.slice(8)}/${s.date.slice(5, 7)} — ${fw?.name || '—'}${fw?.grade ? ' ' + fw.grade : ''}${hrs ? ' | ' + hrs : ''}`
        });
      }));
    }));
    rows.sort(((x, y) => x.date.localeCompare(y.date)));
    const monthName = new Date(ym + '-01T12:00:00').toLocaleDateString('he-IL', {
      month: 'long',
      year: 'numeric'
    });
    const first = fac?.name?.split(' ')[0] || '';
    return [ ...first ? [ `שלום ${first},`, '' ] : [], `נשלחה אליך בקשת אישור לשיבוצים של ${monthName}:`, '', ...rows.map((r => r.line)), '', 'לאישור/דחייה, היכנסי למערכת:', location.href.split('#')[0] + '#facilitators' ].join('\n');
  },
  _buildCopyMessage(aId, dateStr, fid) {
    if (!aId && fid && /^\d{4}-\d{2}$/.test(dateStr || '')) return this._buildMonthCopyMessage(fid, dateStr);
    const a = DB.getAssignments().find((x => x.id === aId));
    const fw = a ? DB.getFrameworks().find((f => f.id === a.frameworkId)) : null;
    const fac = fid ? DB.getFacilitators().find((f => f.id === fid)) : null;
    const sessions = fid ? (a?.sessions || []).filter((s => (s.facilitatorIds || []).includes(fid))) : (a?.sessions || []).filter((s => s.date === dateStr));
    const DAYS = [ 'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת' ];
    const dateLines = sessions.map((s => {
      const d = new Date(s.date + 'T12:00:00');
      const day = DAYS[d.getDay()];
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const facRounds = (s.rounds || []).filter((r => (r.facilitatorIds || []).includes(fid)));
      const facTimes = facRounds.map((r => r.time)).filter(Boolean);
      const hrsStr = facTimes.length ? facTimes.join(', ') : fw?.hours || '';
      const hrs = hrsStr ? ` | ${hrsStr}` : '';
      return `• יום ${day} ${dd}/${mm}/${d.getFullYear()}${hrs}`;
    })).join('\n');
    const TYPE_MAP = {
      formal: 'פורמלי',
      informal: 'בלתי פורמלי',
      internal: 'פנים ארגוני'
    };
    const lines = [];
    const facFirstName = fac?.name?.split(' ')[0] || '';
    if (facFirstName) lines.push(`שלום ${facFirstName},`, '');
    lines.push(`נשלחה אליך בקשת אישור שיבוץ למסגרת ${fw?.name || '—'}:`);
    if (fw?.grade) lines.push(`שכבה: ${fw.grade}`);
    if (fw?.type && TYPE_MAP[fw.type]) lines.push(`סוג: ${TYPE_MAP[fw.type]}`);
    if (fw?.contactName || fw?.contactPhone) {
      const c = [ fw.contactName, fw.contactPhone ].filter(Boolean).join(' | ');
      lines.push(`איש/אשת קשר במסגרת: ${c}`);
    }
    lines.push('', 'מפגשים:', dateLines);
    if (fw?.notes) lines.push('', `הערות: ${fw.notes}`);
    lines.push('', 'לאישור/דחייה, היכנסי למערכת:');
    lines.push(location.href.split('#')[0] + '#facilitators');
    return lines.join('\n');
  },
  openCopyMessageModal(aId, dateStr, fid) {
    const text = this._buildCopyMessage(aId, dateStr, fid);
    const facName = fid ? DB.getFacilitators().find((f => f.id === fid))?.name || '' : '';
    openModal(`הודעה להעתקה${facName ? ' — ' + facName : ''}`, `\n      <p style="font-size:0.85rem;color:#6b7280;margin-bottom:0.5rem">\n        העתק את ההודעה ושלח ישירות למנחה:\n      </p>\n      <div class="copy-msg-panel">\n        <textarea class="copy-msg-text" id="copy-msg-ta" readonly>${text}</textarea>\n        <div class="modal-actions" style="margin-top:0.5rem">\n          <button class="btn btn-primary" onclick="\n            const ta = document.getElementById('copy-msg-ta');\n            ta.select();\n            navigator.clipboard.writeText(ta.value).then(()=>{\n              this.textContent='✓ הועתק!';\n              setTimeout(()=>this.textContent='העתק',1800);\n            }).catch(()=>{ ta.select(); document.execCommand('copy'); this.textContent='✓ הועתק!'; setTimeout(()=>this.textContent='העתק',1800); });\n          ">העתק</button>\n          <button class="btn btn-secondary" onclick="closeModal()">סגור</button>\n        </div>\n      </div>\n    `);
  },
  _dpBuild(id, value) {
    const now = new Date;
    const y = value ? +value.slice(0, 4) : now.getFullYear();
    const m = value ? +value.slice(5, 7) : now.getMonth() + 1;
    this._dpState[id] = {
      year: y,
      month: m
    };
    return `<div class="dp-wrap">\n      <input type="text" class="form-control dp-text" id="dp-txt-${id}" readonly\n        value="${value ? fmtDate(value) : ''}" placeholder="בחר תאריך..."\n        onclick="Calendar._dpToggle('${id}')">\n      <input type="hidden" id="${id}" value="${value || ''}">\n      <div class="dp-popup" id="dp-pop-${id}" style="display:none"></div>\n    </div>`;
  },
  _dpToggle(id) {
    const pop = document.getElementById('dp-pop-' + id);
    const txt = document.getElementById('dp-txt-' + id);
    if (!pop || !txt) return;
    if (pop.style.display === 'none') {
      document.querySelectorAll('.dp-popup').forEach((p => {
        p.style.display = 'none';
      }));
      const rect = txt.getBoundingClientRect();
      pop.style.position = 'fixed';
      pop.style.top = rect.bottom + 4 + 'px';
      pop.style.right = window.innerWidth - rect.right + 'px';
      pop.style.left = 'auto';
      this._dpRender(id);
      pop.style.display = 'block';
    } else {
      pop.style.display = 'none';
    }
  },
  _dpNav(id, delta) {
    const st = this._dpState[id];
    if (!st) return;
    st.month += delta;
    if (st.month > 12) {
      st.month = 1;
      st.year++;
    }
    if (st.month < 1) {
      st.month = 12;
      st.year--;
    }
    this._dpRender(id);
  },
  _dpRender(id) {
    const pop = document.getElementById('dp-pop-' + id);
    if (!pop) return;
    let st = this._dpState[id];
    if (!st) {
      const now = new Date;
      st = this._dpState[id] = {
        year: now.getFullYear(),
        month: now.getMonth() + 1
      };
    }
    const {year: year, month: month} = st;
    const selVal = document.getElementById(id)?.value || '';
    const firstDow = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const DLABELS = [ 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש' ];
    let cells = '';
    for (let i = 0; i < firstDow; i++) cells += '<div class="dp-cell dp-blank"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dow = new Date(year, month - 1, d).getDay();
      const isSel = ds === selVal;
      const isToday = ds === todayStr();
      const cls = [ 'dp-cell', isSel ? 'dp-sel' : '', isToday && !isSel ? 'dp-today' : '' ].filter(Boolean).join(' ');
      cells += `<div class="${cls}" onclick="event.stopPropagation();Calendar._dpPick('${id}','${ds}')">${d}</div>`;
    }
    pop.innerHTML = `\n      <div class="dp-header">\n        <button class="dp-nav-btn" onclick="event.stopPropagation();Calendar._dpNav('${id}',-1)" title="חודש קודם">↑</button>\n        <span class="dp-month-label">${MONTHS_HE[month - 1]} ${year}</span>\n        <button class="dp-nav-btn" onclick="event.stopPropagation();Calendar._dpNav('${id}',1)" title="חודש הבא">↓</button>\n      </div>\n      <div class="dp-grid">\n        ${DLABELS.map((l => `<div class="dp-day-hdr">${l}</div>`)).join('')}\n        ${cells}\n      </div>`;
  },
  _dpPick(id, dateStr) {
    const hidden = document.getElementById(id);
    const txt = document.getElementById('dp-txt-' + id);
    const pop = document.getElementById('dp-pop-' + id);
    if (!hidden || !txt) return;
    hidden.value = dateStr;
    txt.value = fmtDate(dateStr);
    if (pop) pop.style.display = 'none';
    if (id === 'an-start') {
      this._onDateChange(dateStr);
    } else if (id === 'sug-from') {
      this._sugFrom = dateStr;
      this._lastSugKey = null;
      const fwId = document.getElementById('an-fw')?.value || '';
      this._renderSuggestions(fwId);
    } else if (id === 'sug-to') {
      this._sugTo = dateStr;
      this._lastSugKey = null;
      const fwId = document.getElementById('an-fw')?.value || '';
      this._renderSuggestions(fwId);
    } else {
      const mx = id.match(/^(ed|nd)-date-(\d+)$/);
      if (mx) this._onSessionDateChange(mx[1], +mx[2], dateStr);
    }
  },
  _filterBarInner() {
    const activeCount = (this._statusFilter ? 1 : 0) + (this._fwStatusFilter ? 1 : 0);
    return `\n      <button class="btn btn-secondary btn-sm" onclick="Calendar._openSendMonthModal()">שלח לאישור חודשי ›</button>\n      <span class="coord-filter-sep"></span>\n      <div class="cal-filter-wrap">\n        <button class="filter-trigger-btn${activeCount ? ' filter-trigger-active' : ''}" onclick="Calendar._toggleFilterPopover(event)">\n          סינון${activeCount ? ` <span class="filter-badge-num">${activeCount}</span>` : ''}\n        </button>\n        <div class="cal-filter-popover" id="cal-filter-popover">\n          <div class="cal-filter-group">\n            <div class="cal-filter-group-title">סטטוס שיבוץ</div>\n            <div class="cal-filter-opts">\n              ${this._filterOptBtn('status', 'unassigned', 'ריק', 'פגישות ללא מנחה מוצמד')}\n              ${this._filterOptBtn('status', 'understaffed', 'טרם שובצו', 'חסרים מנחים באחד הסבבים או יותר, יחסית לדרישה')}\n              ${this._filterOptBtn('status', 'notsent', 'טרם נשלח', 'שובץ מנחה אך טרם נשלח לאישור')}\n              ${this._filterOptBtn('status', 'pending', 'ממתין לאישור', 'נשלח לאישור, המנחה טרם אישר')}\n            </div>\n          </div>\n          <div class="cal-filter-group">\n            <div class="cal-filter-group-title">סטטוס מסגרת</div>\n            <div class="cal-filter-opts">\n              ${this._filterOptBtn('fwstatus', 'tentative', 'משוריין טנטטיבית')}\n              ${this._filterOptBtn('fwstatus', 'waiting', 'מחכות לטופס')}\n              ${this._filterOptBtn('fwstatus', 'confirmed', 'סגור ומאושר')}\n            </div>\n          </div>\n          ${activeCount ? `<button class="cal-filter-clear-btn" onclick="Calendar._clearFilters()">נקה סינון</button>` : ''}\n        </div>\n      </div>`;
  },
  _filterOptBtn(dim, val, label, title) {
    const active = (dim === 'status' ? this._statusFilter : this._fwStatusFilter) === val;
    return `<button class="cal-filter-opt${active ? ' cal-filter-opt-active' : ''}" title="${title || ''}" onclick="Calendar._setFilter('${dim}','${val}')">${label}</button>`;
  },
  _setFilter(dim, val) {
    if (dim === 'status') this._statusFilter = this._statusFilter === val ? '' : val; else this._fwStatusFilter = this._fwStatusFilter === val ? '' : val;
    this._redrawWeeks();
    this._redrawFilterBar(true);
  },
  _clearFilters() {
    this._statusFilter = '';
    this._fwStatusFilter = '';
    this._redrawWeeks();
    this._redrawFilterBar(false);
  },
  _redrawFilterBar(keepOpen) {
    const row = document.querySelector('.cal-toolbar-filters');
    if (!row) return;
    row.innerHTML = this._filterBarInner();
    if (keepOpen) document.getElementById('cal-filter-popover')?.classList.add('open');
  },
  _toggleFilterPopover(e) {
    e.stopPropagation();
    document.getElementById('cal-filter-popover')?.classList.toggle('open');
  },
  closeFilterPopover() {
    document.getElementById('cal-filter-popover')?.classList.remove('open');
  },
  _holidaysOn(dateStr) {
    return DB.getHolidays().filter((h => h.date === dateStr));
  },
  _ensureDayMenu() {
    let menu = document.getElementById('cal-day-menu');
    if (menu) return menu;
    menu = document.createElement('div');
    menu.id = 'cal-day-menu';
    menu.className = 'day-menu';
    menu.innerHTML = `\n      <button onclick="Calendar._dayMenuAction('assignment')">שיבוץ חדש</button>\n      <hr>\n      <button onclick="Calendar._dayMenuAction('holidays')">ניהול חגים ביום זה</button>\n    `;
    document.body.appendChild(menu);
    return menu;
  },
  _openDayMenu(e, ds) {
    e.stopPropagation();
    const menu = this._ensureDayMenu();
    const btn = e.currentTarget;
    const wasOpenHere = menu.classList.contains('open') && this._dayMenuDate === ds;
    document.querySelectorAll('.cal-add-btn.menu-open').forEach((b => b.classList.remove('menu-open')));
    if (wasOpenHere) {
      this.closeDayMenu();
      return;
    }
    this._dayMenuDate = ds;
    btn.classList.add('menu-open');
    const r = btn.getBoundingClientRect();
    menu.style.top = window.scrollY + r.bottom + 4 + 'px';
    let left = window.scrollX + r.right - menu.offsetWidth || window.scrollX + r.right - 150;
    menu.style.left = Math.max(8, Math.min(left, document.documentElement.clientWidth - 160)) + 'px';
    menu.classList.add('open');
  },
  closeDayMenu() {
    const menu = document.getElementById('cal-day-menu');
    if (menu) menu.classList.remove('open');
    document.querySelectorAll('.cal-add-btn.menu-open').forEach((b => b.classList.remove('menu-open')));
  },
  _dayMenuAction(action) {
    const ds = this._dayMenuDate;
    this.closeDayMenu();
    if (!ds) return;
    if (action === 'assignment') this.openNew(ds); else if (action === 'holidays') this.openHolidayManager(ds);
  },
  openHolidayManager(ds) {
    this._holidayDraftDate = ds;
    this._holidayDraft = this._holidaysOn(ds).map((h => ({
      ...h,
      _removed: false
    })));
    const dow = dayOfWeek(ds);
    openModal(`ניהול חגים — יום ${DAYS_HE[dow]} ${fmtDate(ds)}`, `<div class="modal-hint">אפשר לשנות שם או תאריך של חג קיים, להסיר חג, או להוסיף חג חדש שלא רשום במערכת.</div>\n       <div id="holiday-rows"></div>\n       <button type="button" class="btn btn-add-row" onclick="Calendar._addHolidayRow()">+ הוסף חג בתאריך זה</button>\n       <div class="modal-actions modal-actions-save">\n         <button class="btn btn-primary" onclick="Calendar._saveHolidayManager(this)">שמור שינויים</button>\n         <button class="btn btn-secondary" onclick="closeModal()">ביטול</button>\n       </div>`);
    this._renderHolidayRows();
  },
  _renderHolidayRows() {
    const wrap = document.getElementById('holiday-rows');
    if (!wrap) return;
    const visible = this._holidayDraft.filter((r => !r._removed));
    if (!visible.length) {
      wrap.innerHTML = `<div class="h-empty">אין חגים רשומים בתאריך זה עדיין.</div>`;
      return;
    }
    wrap.innerHTML = this._holidayDraft.map(((r, idx) => r._removed ? '' : `\n      <div class="h-row">\n        <input type="date" class="form-control" value="${r.date}"\n          onchange="Calendar._updateHolidayDraft(${idx},'date',this.value)">\n        <input type="text" class="form-control" placeholder="שם החג..." value="${(r.name || '').replace(/"/g, '&quot;')}"\n          oninput="Calendar._updateHolidayDraft(${idx},'name',this.value)">\n        <button type="button" class="h-remove-btn" title="הסר חג" onclick="Calendar._removeHolidayRow(${idx})">${ICONS.trash}</button>\n      </div>\n    `)).join('');
  },
  _updateHolidayDraft(idx, field, value) {
    if (this._holidayDraft[idx]) this._holidayDraft[idx][field] = value;
  },
  _removeHolidayRow(idx) {
    const row = this._holidayDraft[idx];
    if (!row) return;
    if (row.id) row._removed = true; else this._holidayDraft.splice(idx, 1);
    this._renderHolidayRows();
  },
  _addHolidayRow() {
    this._holidayDraft.push({
      id: null,
      date: this._holidayDraftDate,
      name: '',
      _removed: false
    });
    this._renderHolidayRows();
    const inputs = document.querySelectorAll('#holiday-rows .h-row input[type="text"]');
    if (inputs.length) inputs[inputs.length - 1].focus();
  },
  async _saveHolidayManager(btn) {
    try {
      const toDelete = this._holidayDraft.filter((r => r._removed && r.id));
      const toSave = this._holidayDraft.filter((r => !r._removed && (r.name || '').trim()));
      await runButtonFeedback(btn, (() => Promise.all([ ...toDelete.map((r => DB.delHoliday(r.id))), ...toSave.map((r => DB.saveHoliday({
        id: r.id,
        date: r.date,
        name: r.name.trim()
      }))) ])));
      closeModal();
      this._redrawWeeks();
    } catch (err) {
      alert(err.message);
    }
  },
  _sessionsOn(dateStr) {
    const out = [];
    for (const a of DB.getAssignments()) {
      const total = (a.sessions || []).length;
      const idx = (a.sessions || []).findIndex((s => s.date === dateStr));
      if (idx >= 0) {
        const s = a.sessions[idx];
        out.push({
          ...s,
          aId: a.id,
          frameworkId: a.frameworkId,
          sessionIdx: idx,
          totalSessions: total,
          aCoordinatorIds: a.coordinatorIds || []
        });
      }
    }
    return out;
  },
  _sessionStartMinutes(s, fw) {
    let timeStr = '';
    if (s.rounds && s.rounds.length) {
      const times = s.rounds.map((r => r.time)).filter(Boolean).sort();
      timeStr = times[0] || '';
    }
    if (!timeStr) timeStr = (fw?.hours || '').split(/\s*\/\s*/)[0] || '';
    const m = timeStr.match(/(\d{1,2}):(\d{2})/);
    return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : 24 * 60;
  },
  _assignList() {
    const assignments = DB.getAssignments();
    if (!assignments.length) return '';
    const fws = DB.getFrameworks();
    const facs = DB.getFacilitators();
    const rows = assignments.map((a => {
      const fw = fws.find((f => f.id === a.frameworkId));
      const col = fwColor(a.frameworkId);
      const allFacIds = [ ...new Set((a.sessions || []).flatMap((s => s.facilitatorIds || []))) ];
      const facNames = allFacIds.map((id => facs.find((f => f.id === id))?.name || '?'));
      return `<tr>\n        <td><span class="color-dot" style="background:${col}"></span><strong>${fw?.name || '?'}</strong></td>\n        <td>${(a.sessions || []).map((s => `<span class="chip chip-gray">${fmtDate(s.date)}</span>`)).join('')}</td>\n        <td>${facNames.map((n => `<span class="chip chip-blue">${n}</span>`)).join('') || '—'}</td>\n        <td><div class="actions">\n          <button class="btn btn-secondary btn-icon" onclick="Calendar.openEdit('${a.id}')" title="עריכה">${ICONS.edit}</button>\n          <button class="btn btn-danger btn-icon" onclick="Calendar._delAssign('${a.id}')" title="מחיקה">${ICONS.trash}</button>\n        </div></td>\n      </tr>`;
    })).join('');
    return `<div class="card"><div class="card-header"><h2>כל השיבוצים</h2></div>\n      <div class="table-wrap"><table>\n        <thead><tr><th>מסגרת</th><th>תאריכי מפגשים</th><th>מנחים</th><th>פעולות</th></tr></thead>\n        <tbody>${rows}</tbody>\n      </table></div></div>`;
  },
  openNew(initialDate) {
    const fws = DB.getFrameworks();
    if (!fws.length) {
      alert('יש להוסיף מסגרות חינוכיות תחילה (לשונית מסגרות)');
      return;
    }
    const startVal = initialDate || todayStr();
    openModal('שיבוץ חדש', `\n      <div class="form-group">\n        <label class="form-label">מסגרת חינוכית *</label>\n        <input type="hidden" id="an-fw" value="">\n        <div style="position:relative">\n          <input type="text" class="form-control" id="an-fw-q"\n            placeholder="הקלד שם מסגרת לחיפוש..."\n            autocomplete="off"\n            oninput="Calendar._fwFilter()">\n          <div id="an-fw-drop" class="fw-dropdown" style="display:none"></div>\n        </div>\n        <div id="an-fw-badge" class="fw-selected-badge" style="display:none"></div>\n      </div>\n      <div id="an-suggestions"></div>\n      <div class="form-row">\n        <div class="form-group">\n          <label class="form-label">תאריך מפגש ראשון *</label>\n          ${this._dpBuild('an-start', startVal)}\n        </div>\n        <div class="form-group">\n          <label class="form-label">יום בשבוע</label>\n          <input class="form-control" id="an-day-disp" readonly style="background:#f9fafb"\n            value="${this._dayName(startVal)}">\n        </div>\n      </div>\n      <div class="form-group">\n        <label class="form-label">מספר מפגשים</label>\n        <input class="form-control" type="number" id="an-cnt" value="3" min="1" max="52"\n          onchange="Calendar._refreshPickers();Calendar._renderSuggestions(document.getElementById('an-fw').value)">\n      </div>\n      <div id="an-dates-banner"></div>\n      ${this._coordSelect('an-coord', '')}\n      <div id="an-pickers"></div>\n      <div class="modal-actions modal-actions-save">\n        <button class="btn btn-primary" onclick="Calendar._saveNew()">שמור שיבוץ</button>\n        <button class="btn btn-secondary" onclick="closeModal()">ביטול</button>\n      </div>`);
    this._refreshPickers();
  },
  _dayName(dateStr) {
    const dow = dayOfWeek(dateStr);
    return DAYS_HE[dow] || '—';
  },
  _onDateChange(val) {
    const disp = document.getElementById('an-day-disp');
    if (disp) {
      const name = this._dayName(val);
      disp.value = name;
      disp.style.color = name.startsWith('⚠') ? '#dc2626' : '';
    }
    this._refreshPickers();
  },
  _refreshPickers() {
    const startEl = document.getElementById('an-start');
    const cntEl = document.getElementById('an-cnt');
    const banner = document.getElementById('an-dates-banner');
    const pickers = document.getElementById('an-pickers');
    if (!startEl || !pickers) return;
    const startDate = startEl.value;
    const count = +cntEl.value || 3;
    if (!startDate) return;
    const dow = dayOfWeek(startDate);
    const dates = sessionDates(startDate, count);
    const fwId = document.getElementById('an-fw')?.value;
    const fw = fwId ? DB.getFrameworks().find((f => f.id === fwId)) : null;
    const rounds = this._parseRounds(fw?.hours);
    if (banner) {
      const roundsLabel = rounds.length > 1 ? ` · ${rounds.length} סבבים ביום` : '';
      banner.innerHTML = `<div class="info-banner">תאריכי מפגשים: ${dates.map(fmtDate).join(' | ')}${roundsLabel}</div>`;
    }
    const defaultCounts = fw?.roundFacilitators || [];
    const seriesCoordId = document.getElementById('an-coord')?.value || '';
    pickers.innerHTML = dates.map(((date, idx) => this._sessionBlock(idx, date, [], fw, false, 'nd', defaultCounts, seriesCoordId, ''))).join('');
    this._refreshCoordMarks('nd');
  },
  _facPicker(date, sessionIdx, selectedIds, editMode, roundIdx, fw) {
    const dow = dayOfWeek(date);
    const facs = DB.getFacilitators().filter((f => f.isFacilitator && (f.status || 'active') !== 'inactive' || selectedIds.includes(f.id)));
    const busyIds = new Set;
    DB.getAssignments().forEach((a => {
      if (editMode && a.id === this._editingAId) return;
      const afw = DB.getFrameworks().find((f => f.id === a.frameworkId));
      if (afw?.type === 'internal') return;
      (a.sessions || []).forEach((s => {
        if (s.date === date) (s.facilitatorIds || []).forEach((id => busyIds.add(id)));
      }));
    }));
    const requiredSkill = FW_BADGE_SKILL_MAP[fw?.badge] || null;
    const hasRole = f => !requiredSkill || f[requiredSkill] === true || selectedIds.includes(f.id);
    const available = facs.filter((f => (f.days || []).includes(dow) && !busyIds.has(f.id) && hasRole(f)));
    const conflict = facs.filter((f => (f.days || []).includes(dow) && busyIds.has(f.id) && hasRole(f)));
    const unavailable = facs.filter((f => !available.includes(f) && !conflict.includes(f)));
    const statusDot = f => {
      if (f.status === 'partial') return `<span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:#f59e0b;vertical-align:middle;margin-right:2px"></span>`;
      if (f.status === 'coordinator') return `<span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:#3b82f6;vertical-align:middle;margin-right:2px"></span>`;
      return '';
    };
    const statusTitle = f => {
      if (f.status === 'partial') return ' (חלקי)';
      if (f.status === 'coordinator') return ' (רכזות)';
      return '';
    };
    const roundAttr = roundIdx !== undefined ? ` data-round="${roundIdx}"` : '';
    const opt = (f, cls, sel, extraTitle) => `<div class="f-opt ${cls} ${sel ? 'selected' : ''}"\n        data-si="${sessionIdx}" data-fid="${f.id}"${roundAttr}\n        title="${this._escAttr(f.name)}${statusTitle(f)}${extraTitle ? ' — ' + extraTitle : ''}"\n        onclick="Calendar._toggleFac(this)">${statusDot(f)}${f.name}</div>`;
    const parts = [ ...available.map((f => opt(f, 'avail', selectedIds.includes(f.id), ''))), ...conflict.map((f => opt(f, 'conflict', selectedIds.includes(f.id), 'כבר משובץ ביום זה'))), ...unavailable.map((f => opt(f, 'unavail', selectedIds.includes(f.id), !hasRole(f) ? 'לא מתויג/ת לקטגוריית פעילות זו' : 'לא סימן פניות ביום זה'))) ];
    const warn = available.length === 0 ? `<div class="no-avail-warn">⚠ אין מנחים פנויים ביום ${DAYS_HE[dow]}</div>` : '';
    const groupOptions = [ [ 'all', 'כולם' ], ...GROUP_TAGS.map((t => [ t, t ])), [ 'coordination', 'ריכוז' ] ];
    const groupBtns = groupOptions.map((([key, label]) => `<button type="button" class="btn btn-secondary btn-xs" onclick="Calendar._selectGroupInPicker(this,'${key}')">${label}</button>`)).join('');
    return `<div class="f-picker-wrap">\n      <div class="f-group-row">קבוצה: ${groupBtns}</div>\n      <div class="f-picker">${parts.join('')}</div>${warn}\n    </div>`;
  },
  _selectGroupInPicker(btn, group) {
    const wrap = btn.closest('.f-picker-wrap');
    if (!wrap) return;
    wrap.querySelectorAll('.f-opt').forEach((el => {
      const f = DB.getFacilitators().find((x => x.id === el.dataset.fid));
      if (!f) return;
      const inGroup = group === 'all' ? true : group === 'coordination' ? !!f.coordination : (f.tags || []).includes(group);
      if (inGroup) el.classList.add('selected');
    }));
    const firstOpt = wrap.querySelector('.f-opt');
    if (firstOpt) this._refreshRoundProgress(firstOpt);
    this._updateCollapsedNotes();
  },
  _toggleFac(el) {
    el.classList.toggle('selected');
    this._refreshRoundProgress(el);
    this._updateCollapsedNotes();
  },
  _refreshRoundProgress(el) {
    if (!el.hasAttribute('data-round')) return;
    const pickerDiv = el.closest('[id*="-picker-"]');
    const m = pickerDiv?.id?.match(/^(.+)-picker-(\d+)-(\d+)$/);
    if (!m) return;
    const [, prefix, siBase, rIdx] = m;
    const selCount = pickerDiv.querySelectorAll('.f-opt.selected').length;
    const input = document.getElementById(`${prefix}-cnt-${siBase}-${rIdx}`);
    const badge = document.getElementById(`${prefix}-prog-${siBase}-${rIdx}`);
    if (badge) badge.textContent = `${selCount}/${input?.value || '?'}`;
  },
  _onRoundReqChange(prefix, idx, rIdx) {
    const picker = document.getElementById(`${prefix}-picker-${idx}-${rIdx}`);
    const badge = document.getElementById(`${prefix}-prog-${idx}-${rIdx}`);
    const input = document.getElementById(`${prefix}-cnt-${idx}-${rIdx}`);
    if (!picker || !badge) return;
    const selCount = picker.querySelectorAll('.f-opt.selected').length;
    badge.textContent = `${selCount}/${input?.value || '?'}`;
  },
  _toggleRoundSection(secId) {
    const body = document.getElementById(`${secId}-body`);
    const btn = document.getElementById(`${secId}-btn`);
    if (!body) return;
    const collapsed = body.style.display === 'none';
    body.style.display = collapsed ? '' : 'none';
    if (btn) btn.textContent = collapsed ? '▲' : '▼';
  },
  _copyFirstToAll(prefix) {
    const idxs = [ ...document.querySelectorAll(`[id^="${prefix}-block-"]`) ].map((el => +el.id.slice(`${prefix}-block-`.length))).filter((idx => idx > 0));
    idxs.forEach((idx => {
      this._copyFromSession0(prefix, idx);
      [ ...document.querySelectorAll(`[id^="${prefix}-picker-${idx}-"]`), document.getElementById(`${prefix}-picker-${idx}`) ].filter(Boolean).forEach((p => {
        const rm = p.id.match(/-picker-\d+-(\d+)$/);
        if (!rm) return;
        const rIdx = rm[1];
        const selCount = p.querySelectorAll('.f-opt.selected').length;
        const input = document.getElementById(`${prefix}-cnt-${idx}-${rIdx}`);
        const badge = document.getElementById(`${prefix}-prog-${idx}-${rIdx}`);
        if (badge) badge.textContent = `${selCount}/${input?.value || '?'}`;
      }));
    }));
    this._updateCollapsedNotes();
  },
  _applyRound1ToAll(prefix, idx) {
    const round1Sel = new Set([ ...document.querySelectorAll(`.f-opt.selected[data-si="${idx}-0"]`) ].map((e => e.dataset.fid)));
    document.querySelectorAll(`[id^="${prefix}-picker-${idx}-"]`).forEach((picker => {
      const m = picker.id.match(/-picker-\d+-(\d+)$/);
      if (!m || +m[1] === 0) return;
      const rIdx = m[1];
      picker.querySelectorAll('.f-opt').forEach((el => {
        el.classList.toggle('selected', round1Sel.has(el.dataset.fid));
      }));
      const selCount = picker.querySelectorAll('.f-opt.selected').length;
      const input = document.getElementById(`${prefix}-cnt-${idx}-${rIdx}`);
      const badge = document.getElementById(`${prefix}-prog-${idx}-${rIdx}`);
      if (badge) badge.textContent = `${selCount}/${input?.value || '?'}`;
    }));
    this._updateCollapsedNotes();
  },
  _applyCoordToSession(prefix, idx, fid) {
    if (!fid) return;
    const pickers = [ document.getElementById(`${prefix}-picker-${idx}`), ...document.querySelectorAll(`[id^="${prefix}-picker-${idx}-"]`) ].filter(Boolean);
    pickers.forEach((picker => {
      const o = picker.querySelector(`.f-opt[data-fid="${fid}"]`);
      if (o && !o.classList.contains('selected')) {
        o.classList.add('selected');
        this._refreshRoundProgress(o);
      }
    }));
  },
  _refreshCoordMarks(prefix) {
    document.querySelectorAll('.f-opt.is-coord').forEach((el => el.classList.remove('is-coord')));
    document.querySelectorAll('.f-opt-coord-star').forEach((el => el.remove()));
    document.querySelectorAll(`[id^="${prefix}-block-"]`).forEach((block => {
      const idx = +block.id.slice(`${prefix}-block-`.length);
      const coordFid = document.getElementById(`${prefix}-coord-${idx}`)?.value || '';
      if (!coordFid) return;
      const pickers = [ document.getElementById(`${prefix}-picker-${idx}`), ...document.querySelectorAll(`[id^="${prefix}-picker-${idx}-"]`) ].filter(Boolean);
      pickers.forEach((picker => {
        const o = picker.querySelector(`.f-opt[data-fid="${coordFid}"]`);
        if (o) {
          o.classList.add('is-coord');
          o.insertAdjacentHTML('afterbegin', '<span class="f-opt-coord-star">★</span>');
        }
      }));
    }));
  },
  _updateCollapsedNotes() {
    const selEls = [ ...document.querySelectorAll('.f-opt.selected') ].filter((el => el.dataset.si === '0' || (el.dataset.si || '').startsWith('0-')));
    const names = [ ...new Set(selEls.map((el => DB.getFacilitators().find((f => f.id === el.dataset.fid))?.name?.split(' ')[0] || '')).filter(Boolean)) ];
    const noteText = '· ' + (names.length ? names.join(', ') : 'זהה למפגש הראשון');
    document.querySelectorAll('[id^="nd-same-note-"]').forEach((el => {
      const idx = el.id.replace('nd-same-note-', '');
      const block = document.getElementById(`nd-block-${idx}`);
      if (block?.dataset.collapsed === 'true') el.textContent = noteText;
    }));
  },
  _parseRounds(hoursStr) {
    if (!hoursStr) return [];
    return hoursStr.split(/\s*\/\s*/).map((s => s.trim())).filter(Boolean);
  },
  _escAttr(str) {
    return String(str ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  },
  _coordSelect(id, existCoordId, label) {
    const facs = DB.getFacilitators().filter((f => (f.status || 'active') !== 'inactive'));
    const existing = existCoordId ? facs.find((f => f.id === existCoordId)) : null;
    return `<div class="form-group coord-search-group">\n      <label class="form-label" style="color:var(--accent)">${label || 'רכז/ת מסגרת (לכל הסדרה)'}</label>\n      <input type="hidden" id="${id}" value="${existCoordId || ''}">\n      <div class="coord-search-wrap">\n        <input type="text" class="form-control" id="${id}-q"\n          placeholder="הקלד שם לחיפוש..."\n          value="${existing?.name || ''}"\n          autocomplete="off"\n          oninput="Calendar._coordFilter('${id}')"\n          style="border-color:var(--accent)">\n        <div class="coord-dropdown" id="${id}-drop" style="display:none"></div>\n      </div>\n      ${existCoordId ? `<div class="coord-selected-badge" id="${id}-badge">\n        <span style="color:var(--accent);font-weight:600">${existing?.name || ''}</span>\n        <button type="button" class="coord-clear-btn" onclick="Calendar._coordClear('${id}')" title="נקה בחירה">×</button>\n      </div>` : `<div class="coord-selected-badge" id="${id}-badge" style="display:none"></div>`}\n    </div>`;
  },
  _coordFilter(id) {
    const q = (document.getElementById(`${id}-q`)?.value || '').toLowerCase().trim();
    const drop = document.getElementById(`${id}-drop`);
    if (!drop) return;
    if (!q) {
      drop.style.display = 'none';
      return;
    }
    const facs = DB.getFacilitators().filter((f => (f.status || 'active') !== 'inactive' && f.name.toLowerCase().includes(q)));
    if (!facs.length) {
      drop.innerHTML = `<div class="coord-drop-item coord-drop-empty">לא נמצאו תוצאות</div>`;
      drop.style.display = 'block';
      return;
    }
    drop.innerHTML = facs.map((f => `<div class="coord-drop-item" data-id="${id}" data-fid="${f.id}" data-name="${this._escAttr(f.name)}"\n        onclick="Calendar._coordPick(this.dataset.id,this.dataset.fid,this.dataset.name)">\n        ${f.name}</div>`)).join('');
    drop.style.display = 'block';
  },
  _setCoordField(id, fid, name) {
    const hiddenEl = document.getElementById(id);
    const qEl = document.getElementById(`${id}-q`);
    const dropEl = document.getElementById(`${id}-drop`);
    const badgeEl = document.getElementById(`${id}-badge`);
    if (hiddenEl) hiddenEl.value = fid;
    if (qEl) qEl.value = name;
    if (dropEl) dropEl.style.display = 'none';
    if (badgeEl) {
      badgeEl.innerHTML = `<span style="color:var(--accent);font-weight:600">${name}</span>\n        <button type="button" class="coord-clear-btn" onclick="Calendar._coordClear('${id}')" title="נקה">×</button>`;
      badgeEl.style.display = 'flex';
    }
  },
  _coordPick(id, fid, name) {
    this._setCoordField(id, fid, name);
    const sm = id.match(/^(nd|ed)-coord-(\d+)$/);
    if (sm) {
      const [, prefix, idxStr] = sm;
      this._applyCoordToSession(prefix, +idxStr, fid);
      this._refreshCoordMarks(prefix);
      return;
    }
    const prefix = id === 'an-coord' ? 'nd' : id === 'ae-coord' ? 'ed' : null;
    if (!prefix) return;
    document.querySelectorAll(`[id^="${prefix}-coord-"]`).forEach((fieldEl => {
      if (!/^(nd|ed)-coord-\d+$/.test(fieldEl.id)) return;
      this._setCoordField(fieldEl.id, fid, name);
      const m = fieldEl.id.match(/-coord-(\d+)$/);
      if (m) this._applyCoordToSession(prefix, +m[1], fid);
    }));
    this._refreshCoordMarks(prefix);
  },
  _coordClear(id) {
    const hiddenEl = document.getElementById(id);
    const qEl = document.getElementById(`${id}-q`);
    const badgeEl = document.getElementById(`${id}-badge`);
    if (hiddenEl) hiddenEl.value = '';
    if (qEl) qEl.value = '';
    if (badgeEl) badgeEl.style.display = 'none';
  },
  _pickerContent(rounds, idx, date, selectedPerRound, editMode, idPrefix, roundCounts, fw) {
    if (rounds.length > 1) {
      const applyAllRow = `<div class="rounds-apply-row">\n        <button type="button" class="btn btn-secondary btn-xs" onclick="Calendar._applyRound1ToAll('${idPrefix}', ${idx})">החל את מנחי סבב 1 על כל הסבבים ›</button>\n      </div>`;
      return `<div class="rounds-sections">${applyAllRow}${rounds.map(((time, rIdx) => {
        const sel = selectedPerRound[rIdx] || [];
        const cnt = roundCounts?.[rIdx] ?? '';
        const secId = `${idPrefix}-round-${idx}-${rIdx}`;
        return `<div class="round-section" id="${secId}">\n          <div class="round-section-header" onclick="Calendar._toggleRoundSection('${secId}')">\n            <span class="round-label-badge">סבב ${rIdx + 1}</span>\n            <span class="round-time-badge">${time}</span>\n            <span class="round-progress-badge" id="${idPrefix}-prog-${idx}-${rIdx}">${sel.length}/${cnt || '?'}</span>\n            <div class="round-count-wrap" onclick="event.stopPropagation()">\n              <span class="round-count-label">מנחים נדרשים:</span>\n              <input type="number" min="1" max="30" value="${cnt}" placeholder="?"\n                id="${idPrefix}-cnt-${idx}-${rIdx}" class="round-count-input"\n                oninput="Calendar._onRoundReqChange('${idPrefix}',${idx},${rIdx})">\n            </div>\n            <button type="button" class="round-toggle-btn" id="${secId}-btn" onclick="event.stopPropagation();Calendar._toggleRoundSection('${secId}')">▲</button>\n          </div>\n          <div class="round-section-body" id="${secId}-body">\n            <div id="${idPrefix}-picker-${idx}-${rIdx}">\n              ${this._facPicker(date, `${idx}-${rIdx}`, sel, editMode, rIdx, fw)}\n            </div>\n          </div>\n        </div>`;
      })).join('')}</div>`;
    }
    const sel = selectedPerRound[0] || [];
    return `<div id="${idPrefix}-picker-${idx}">${this._facPicker(date, idx, sel, editMode, undefined, fw)}</div>`;
  },
  _sessionBlock(idx, date, selectedPerRound, fw, editMode, idPrefix, roundCounts, seriesCoordId, sessionCoordId) {
    const rounds = this._parseRounds(fw?.hours);
    const dateInput = this._dpBuild(`${idPrefix}-date-${idx}`, date);
    const effCoordId = sessionCoordId || seriesCoordId || '';
    const coordField = `<div class="session-coord-inline">${this._coordSelect(`${idPrefix}-coord-${idx}`, effCoordId, 'רכז/ת מסגרת:')}</div>`;
    const pickerContent = this._pickerContent(rounds, idx, date, selectedPerRound, editMode, idPrefix, roundCounts, fw);
    const copyRow = idx === 0 ? `<div class="session-copy-row">\n          <button type="button" class="btn btn-secondary btn-xs" onclick="Calendar._copyFirstToAll('${idPrefix}')">העתק בחירת מנחים למפגשים הבאים ›</button>\n        </div>` : '';
    const collapsible = editMode ? true : idx > 0;
    const collapsed = editMode ? false : collapsible;
    const headerNote = !editMode && idx === 0 ? `<span class="session-default-note">ברירת מחדל לכל הסדרה</span>` : !editMode && collapsible ? `<span class="session-same-note" id="${idPrefix}-same-note-${idx}">· זהה למפגש הראשון</span>\n         <button type="button" class="session-expand-btn" id="${idPrefix}-expand-btn-${idx}"\n           onclick="Calendar._toggleSession('${idPrefix}',${idx})">בחר מנחים ▼</button>` : editMode ? `<button type="button" class="session-expand-btn" id="${idPrefix}-expand-btn-${idx}"\n           onclick="Calendar._toggleSession('${idPrefix}',${idx})">הסתר מנחים ▲</button>` : '';
    return `<div class="session-block${collapsed ? ' session-block-collapsed' : ''}"\n      id="${idPrefix}-block-${idx}" data-collapsed="${collapsed}">\n      <div class="session-block-header" style="flex-wrap:wrap;gap:0.35rem">\n        <strong>מפגש ${idx + 1}</strong>\n        ${dateInput}\n        ${coordField}\n        ${headerNote}\n      </div>\n      <div id="${idPrefix}-picker-wrap-${idx}"${collapsed ? ' style="display:none"' : ''}>\n        ${pickerContent}\n        ${copyRow}\n      </div>\n    </div>`;
  },
  _toggleSession(prefix, idx) {
    const block = document.getElementById(`${prefix}-block-${idx}`);
    if (!block) return;
    const wrap = document.getElementById(`${prefix}-picker-wrap-${idx}`);
    const note = document.getElementById(`${prefix}-same-note-${idx}`);
    const btn = document.getElementById(`${prefix}-expand-btn-${idx}`);
    const isCollapsed = block.dataset.collapsed === 'true';
    const isEdit = prefix === 'ed';
    if (isCollapsed) {
      if (!isEdit) this._copyFromSession0(prefix, idx);
      if (wrap) wrap.style.display = '';
      block.dataset.collapsed = 'false';
      block.classList.remove('session-block-collapsed');
      if (note) note.style.display = 'none';
      if (btn) btn.innerHTML = isEdit ? 'הסתר מנחים ▲' : 'הסתר ▲';
    } else {
      if (wrap) wrap.style.display = 'none';
      block.dataset.collapsed = 'true';
      block.classList.add('session-block-collapsed');
      if (note) note.style.display = '';
      if (btn) btn.innerHTML = isEdit ? 'הצג מנחים ▼' : 'בחר מנחים ▼';
    }
  },
  _copyFromSession0(prefix, idx) {
    let fw;
    if (prefix === 'ed' && this._editingAId) {
      const a = DB.getAssignments().find((x => x.id === this._editingAId));
      fw = a ? DB.getFrameworks().find((f => f.id === a.frameworkId)) : null;
    } else {
      const fwId = document.getElementById('an-fw')?.value;
      fw = fwId ? DB.getFrameworks().find((f => f.id === fwId)) : null;
    }
    const roundTimes = this._parseRounds(fw?.hours);
    if (roundTimes.length > 1) {
      roundTimes.forEach(((_, rIdx) => {
        const sel0 = new Set([ ...document.querySelectorAll(`.f-opt.selected[data-si="0-${rIdx}"]`) ].map((e => e.dataset.fid)));
        document.querySelectorAll(`.f-opt[data-si="${idx}-${rIdx}"]`).forEach((el => el.classList.toggle('selected', sel0.has(el.dataset.fid))));
      }));
    } else {
      const sel0 = new Set([ ...document.querySelectorAll(`.f-opt.selected[data-si="0"]`) ].map((e => e.dataset.fid)));
      document.querySelectorAll(`.f-opt[data-si="${idx}"]`).forEach((el => el.classList.toggle('selected', sel0.has(el.dataset.fid))));
    }
  },
  _onRoundCheck(el, totalRounds) {
    const fid = el.dataset.fid;
    const si = el.dataset.si;
    const round = +el.dataset.round;
    const checks = [ ...document.querySelectorAll(`.round-check[data-fid="${fid}"][data-si="${si}"]`) ].sort(((a, b) => +a.dataset.round - +b.dataset.round));
    if (el.checked) {
      checks.filter((c => +c.dataset.round < round)).forEach((c => c.checked = true));
    } else {
      checks.filter((c => +c.dataset.round > round)).forEach((c => c.checked = false));
    }
  },
  _onSessionDateChange(prefix, idx, date) {
    if (prefix === 'nd') {
      const disp = document.getElementById('an-day-disp');
      if (disp && idx === 0) {
        disp.value = this._dayName(date);
      }
      this._refreshSingleNewPicker(idx, date);
    } else {
      this._refreshSingleEditPicker(idx, date);
    }
  },
  _refreshSingleNewPicker(idx, date) {
    const fwId = document.getElementById('an-fw')?.value;
    const fw = fwId ? DB.getFrameworks().find((f => f.id === fwId)) : null;
    const rounds = this._parseRounds(fw?.hours);
    if (rounds.length > 1) {
      rounds.forEach(((_, rIdx) => {
        const c = document.getElementById(`nd-picker-${idx}-${rIdx}`);
        if (!c) return;
        const sel = [ ...document.querySelectorAll(`.f-opt.selected[data-si="${idx}-${rIdx}"]`) ].map((e => e.dataset.fid));
        c.innerHTML = this._facPicker(date, `${idx}-${rIdx}`, sel, false, rIdx, fw);
      }));
    } else {
      const c = document.getElementById(`nd-picker-${idx}`);
      if (!c) return;
      const sel = [ ...document.querySelectorAll(`.f-opt.selected[data-si="${idx}"]`) ].map((e => e.dataset.fid));
      c.innerHTML = this._facPicker(date, idx, sel, false, undefined, fw);
    }
    this._refreshCoordMarks('nd');
  },
  _refreshSingleEditPicker(idx, date) {
    const a = this._editingAId ? DB.getAssignments().find((x => x.id === this._editingAId)) : null;
    const fw = a ? DB.getFrameworks().find((f => f.id === a.frameworkId)) : null;
    const rounds = this._parseRounds(fw?.hours);
    if (rounds.length > 1) {
      rounds.forEach(((_, rIdx) => {
        const c = document.getElementById(`ed-picker-${idx}-${rIdx}`);
        if (!c) return;
        const sel = [ ...document.querySelectorAll(`.f-opt.selected[data-si="${idx}-${rIdx}"]`) ].map((e => e.dataset.fid));
        c.innerHTML = this._facPicker(date, `${idx}-${rIdx}`, sel, true, rIdx, fw);
      }));
    } else {
      const c = document.getElementById(`ed-picker-${idx}`);
      if (!c) return;
      const sel = [ ...document.querySelectorAll(`.f-opt.selected[data-si="${idx}"]`) ].map((e => e.dataset.fid));
      c.innerHTML = this._facPicker(date, idx, sel, true, undefined, fw);
    }
    this._refreshCoordMarks('ed');
  },
  _collectRounds(idx, roundTimes, prefix, siOverride) {
    const si = siOverride !== undefined ? siOverride : idx;
    if (roundTimes.length > 1) {
      const rounds = roundTimes.map(((time, rIdx) => {
        const sel = [ ...document.querySelectorAll(`.f-opt.selected[data-si="${si}-${rIdx}"]`) ];
        const cntEl = document.getElementById(`${prefix || 'nd'}-cnt-${si}-${rIdx}`);
        const requiredCount = cntEl ? +cntEl.value || 0 : 0;
        return {
          time: time,
          facilitatorIds: sel.map((e => e.dataset.fid)),
          requiredCount: requiredCount
        };
      }));
      const allIds = [ ...new Set(rounds.flatMap((r => r.facilitatorIds))) ];
      return {
        rounds: rounds,
        facilitatorIds: allIds
      };
    } else {
      const sel = [ ...document.querySelectorAll(`.f-opt.selected[data-si="${si}"]`) ];
      return {
        rounds: [],
        facilitatorIds: sel.map((e => e.dataset.fid))
      };
    }
  },
  _fwFilter() {
    const q = (document.getElementById('an-fw-q')?.value || '').trim().toLowerCase();
    const drop = document.getElementById('an-fw-drop');
    if (!drop) return;
    if (!q) {
      drop.style.display = 'none';
      return;
    }
    const fws = DB.getFrameworks().filter((f => `${f.name}${f.grade ? ' ' + f.grade : ''}`.toLowerCase().includes(q)));
    if (!fws.length) {
      drop.innerHTML = `<div class="fw-drop-item fw-drop-empty">לא נמצאו מסגרות</div>`;
      drop.style.display = 'block';
      return;
    }
    drop.innerHTML = fws.map((f => `<div class="fw-drop-item" data-fwid="${f.id}" data-name="${this._escAttr(f.name + (f.grade ? ' (' + f.grade + ')' : ''))}"\n        onclick="Calendar._fwPick(this.dataset.fwid,this.dataset.name)">\n        ${f.name}${f.grade ? ` <span class="fw-drop-grade">(${f.grade})</span>` : ''}\n      </div>`)).join('');
    drop.style.display = 'block';
    const hidden = document.getElementById('an-fw');
    if (hidden) hidden.value = '';
  },
  _fwPick(fwId, displayName) {
    const hidden = document.getElementById('an-fw');
    const qEl = document.getElementById('an-fw-q');
    const dropEl = document.getElementById('an-fw-drop');
    const badgeEl = document.getElementById('an-fw-badge');
    const fw = DB.getFrameworks().find((f => f.id === fwId));
    if (hidden) hidden.value = fwId;
    if (qEl) qEl.value = displayName;
    if (dropEl) dropEl.style.display = 'none';
    if (badgeEl) {
      badgeEl.innerHTML = `<span class="fw-badge-name">${fw?.name || displayName}</span>\n        ${fw?.grade ? `<span class="fw-badge-grade">${fw.grade}</span>` : ''}\n        ${fw?.hours ? `<span class="fw-badge-hours">${fw.hours}</span>` : ''}\n        <button type="button" class="coord-clear-btn" onclick="Calendar._fwClear()" title="נקה">×</button>`;
      badgeEl.style.display = 'flex';
    }
    const cntEl = document.getElementById('an-cnt');
    if (cntEl && fw?.sessionCount) cntEl.value = fw.sessionCount;
    this._renderSuggestions(fwId);
    this._refreshPickers();
  },
  _fwClear() {
    const hidden = document.getElementById('an-fw');
    const qEl = document.getElementById('an-fw-q');
    const badgeEl = document.getElementById('an-fw-badge');
    const pickers = document.getElementById('an-pickers');
    const sugsEl = document.getElementById('an-suggestions');
    if (hidden) hidden.value = '';
    if (qEl) qEl.value = '';
    if (badgeEl) badgeEl.style.display = 'none';
    if (pickers) pickers.innerHTML = '';
    if (sugsEl) sugsEl.innerHTML = '';
  },
  _suggestDates(sessionCount, fwBadge, scanEnd, requiredFacs, scanStart) {
    requiredFacs = requiredFacs || 1;
    if (!sessionCount || sessionCount < 1) return [];
    const t = scanStart && scanStart >= todayStr() ? strToDate(scanStart) : strToDate(todayStr());
    const yr = t.getFullYear(), mo = t.getMonth() + 1;
    const end = scanEnd || `${yr + (mo >= 9 ? 2 : 1)}-08-31`;
    const holidays = new Set(DB.getHolidays().map((h => h.date)));
    const facs = DB.getFacilitators().filter((f => f.isFacilitator && (f.status || 'active') !== 'inactive'));
    const requiredSkill = FW_BADGE_SKILL_MAP[fwBadge] || null;
    const busyMap = {};
    DB.getAssignments().forEach((a => {
      (a.sessions || []).forEach((s => {
        if (s.status === 'cancelled') return;
        if (!busyMap[s.date]) busyMap[s.date] = new Set;
        (s.facilitatorIds || []).forEach((id => busyMap[s.date].add(id)));
      }));
    }));
    const availFacs = date => {
      const dow = dayOfWeek(date);
      const busy = busyMap[date] || new Set;
      return facs.filter((f => {
        if (!(f.days || []).includes(dow) || busy.has(f.id)) return false;
        return requiredSkill ? f[requiredSkill] === true : true;
      }));
    };
    const tryGap = gap => {
      const all = [];
      for (let dow = 0; dow <= 4; dow++) {
        const start = new Date(t);
        while (start.getDay() !== dow) start.setDate(start.getDate() + 1);
        const cursor = new Date(start);
        let perDow = 0;
        while (dateToStr(cursor) <= end && perDow < 4) {
          const seq = [];
          const facSets = [];
          let ok = true;
          let minAv = Infinity;
          for (let i = 0; i < sessionCount; i++) {
            const d = new Date(cursor);
            d.setDate(d.getDate() + i * gap);
            const ds = dateToStr(d);
            if (ds > end || holidays.has(ds)) {
              ok = false;
              break;
            }
            const af = availFacs(ds);
            const av = af.length;
            if (av < requiredFacs) {
              ok = false;
              break;
            }
            minAv = Math.min(minAv, av);
            seq.push(ds);
            facSets.push(new Set(af.map((f => f.id))));
          }
          if (ok && seq.length === sessionCount) {
            let commonIds = [ ...facSets[0] ];
            for (let i = 1; i < facSets.length; i++) commonIds = commonIds.filter((id => facSets[i].has(id)));
            const facNames = facs.filter((f => commonIds.includes(f.id))).map((f => f.name));
            all.push({
              start: dateToStr(cursor),
              dates: seq,
              gap: gap,
              dow: dow,
              minAvail: minAv,
              facNames: facNames
            });
            perDow++;
          }
          cursor.setDate(cursor.getDate() + 7);
        }
      }
      return all.sort(((a, b) => a.start < b.start ? -1 : 1));
    };
    const weekly = tryGap(7);
    return weekly.length ? weekly : tryGap(14);
  },
  _renderSuggestions(fwId, shown) {
    shown = shown || 5;
    const el = document.getElementById('an-suggestions');
    if (!el) return;
    const fw = fwId ? DB.getFrameworks().find((f => f.id === fwId)) : null;
    const cnt = fw?.sessionCount || +document.getElementById('an-cnt')?.value || 0;
    if (!cnt) {
      el.innerHTML = '';
      this._lastSugs = [];
      this._lastSugKey = null;
      return;
    }
    const today = todayStr();
    const t = strToDate(today);
    const yr = t.getFullYear(), mo = t.getMonth() + 1;
    const defaultEnd = `${yr + (mo >= 9 ? 2 : 1)}-08-31`;
    if (!this._sugFrom) this._sugFrom = today;
    if (!this._sugTo) this._sugTo = defaultEnd;
    const sugFrom = this._sugFrom;
    const sugTo = this._sugTo < today ? defaultEnd : this._sugTo;
    const cacheKey = (fwId || '') + ':' + cnt + ':' + sugFrom + ':' + sugTo;
    if (cacheKey !== this._lastSugKey) {
      this._lastSugs = this._suggestDates(cnt, fw?.badge, sugTo, fw?.facilitatorsPerRound || 1, sugFrom);
      this._lastSugKey = cacheKey;
    }
    const sugs = this._lastSugs;
    if (!sugs.length) {
      el.innerHTML = `<div class="sug-panel"><div class="sug-empty">לא נמצאו רצפים פנויים בלוח השנה</div></div>`;
      return;
    }
    const isBI = sugs[0]?.gap === 14;
    const gapNote = isBI ? `<span class="sug-gap-note"> — דו-שבועיים</span>` : '';
    const visible = sugs.slice(0, shown);
    const hasMore = shown < sugs.length;
    const items = visible.map(((s, idx) => {
      const dStr = s.dates.map((d => fmtDate(d))).join(' · ');
      const avTxt = `${s.minAvail} מנח${s.minAvail === 1 ? 'ה' : 'ים'} פנוי${s.minAvail === 1 ? 'ה' : 'ים'}`;
      return `<div class="sug-item">\n        <button type="button" class="sug-row" onclick="Calendar._clickSug(this,${idx},'${s.start}',${cnt})">\n          <span class="sug-dow">${DAYS_HE[s.dow]}</span>\n          <span class="sug-dates">${dStr}</span>\n          <span class="sug-avail">${avTxt}</span>\n          <span class="sug-arrow">▾</span>\n        </button>\n      </div>`;
    })).join('');
    el.innerHTML = `<div class="sug-panel">\n      <div class="sug-header">\n        <span>${cnt} מפגשים — בחר רצף${gapNote}</span>\n        <div class="sug-range-filter">\n          <label>מ:</label>\n          <div class="sug-dp-wrap">${this._dpBuild('sug-from', sugFrom)}</div>\n          <label>עד:</label>\n          <div class="sug-dp-wrap">${this._dpBuild('sug-to', sugTo)}</div>\n        </div>\n      </div>\n      ${items}\n      ${hasMore ? `<button type="button" class="sug-more-btn" onclick="Calendar._renderSuggestions('${fwId || ''}',${shown + 5})">הצע עוד ▾</button>` : ''}\n    </div>`;
  },
  _clickSug(btn, idx, startDate, count) {
    this._applySuggestion(startDate, count);
    const item = btn.closest('.sug-item');
    const existing = item.querySelector('.sug-detail');
    if (existing) {
      existing.remove();
      btn.classList.remove('sug-active');
      return;
    }
    const sug = this._lastSugs?.[idx];
    if (!sug) return;
    const names = sug.facNames || [];
    const detail = document.createElement('div');
    detail.className = 'sug-detail';
    detail.innerHTML = `<span class="sug-detail-label">מנחים פנויים לכל הרצף:</span> <span class="sug-detail-facs">${names.length ? names.join(', ') : '—'}</span>`;
    item.appendChild(detail);
    btn.classList.add('sug-active');
  },
  _applySuggestion(startDate, count) {
    const hidden = document.getElementById('an-start');
    const txtEl = document.getElementById('dp-txt-an-start');
    const cntEl = document.getElementById('an-cnt');
    if (hidden) hidden.value = startDate;
    if (txtEl) txtEl.value = fmtDate(startDate);
    if (cntEl) cntEl.value = count;
    this._onDateChange(startDate);
  },
  async _saveNew() {
    const fwId = document.getElementById('an-fw')?.value;
    const start = document.getElementById('an-start')?.value;
    const count = +document.getElementById('an-cnt')?.value || 3;
    if (!fwId || !start) {
      alert('יש לבחור מסגרת ותאריך');
      return;
    }
    try {
      const fw = DB.getFrameworks().find((f => f.id === fwId));
      const roundTimes = this._parseRounds(fw?.hours);
      const dates = sessionDates(start, count);
      const sessions = dates.map(((date, idx) => {
        const dateEl = document.getElementById(`nd-date-${idx}`);
        const d = dateEl?.value || date;
        const isCollapsed = document.getElementById(`nd-block-${idx}`)?.dataset.collapsed === 'true';
        const {rounds: rounds, facilitatorIds: facilitatorIds} = this._collectRounds(idx, roundTimes, 'nd', isCollapsed ? 0 : undefined);
        const sessionCoordId = document.getElementById(`nd-coord-${idx}`)?.value || '';
        return {
          date: d,
          facilitatorIds: facilitatorIds,
          rounds: rounds,
          coordinatorId: sessionCoordId || null
        };
      }));
      const coordId = document.getElementById('an-coord')?.value || '';
      const coordinatorIds = coordId ? [ coordId ] : [];
      await DB.saveAssignment({
        frameworkId: fwId,
        sessions: sessions,
        coordinatorIds: coordinatorIds
      });
      const allRaw = await API.get('/api/assignments');
      DB._cache.assignments = allRaw.map((r => API.mapAssignment(r)));
      const firstDate = sessions[0]?.date;
      if (firstDate) {
        const d = strToDate(firstDate);
        this.year = d.getFullYear();
        this.month = d.getMonth();
      }
      closeModal();
      this.render();
      _syncScreens('assignment');
    } catch (err) {
      console.error('[_saveNew]', err);
      alert('שגיאה בשמירת השיבוץ: ' + (err?.message || String(err)));
    }
  },
  openSessionDetail(aId, dateStr) {
    const a = DB.getAssignments().find((x => x.id === aId));
    if (!a) return;
    const fw = DB.getFrameworks().find((f => f.id === a.frameworkId));
    const s = (a.sessions || []).find((s => s.date === dateStr));
    if (!s) return;
    const facs = DB.getFacilitators();
    const names = (s.facilitatorIds || []).map((id => facs.find((f => f.id === id))?.name || '?'));
    const col = fwColor(a.frameworkId);
    const dow = dayOfWeek(dateStr);
    openModal('פרטי מפגש', `\n      <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1.25rem;flex-wrap:wrap">\n        <span class="color-dot" style="background:${col};width:14px;height:14px"></span>\n        <strong style="font-size:1.05rem">${fw?.name || 'מסגרת'}</strong>\n        ${Auth.isCoord() ? (() => {
      const meta = FW_STATUS_META[fw?.status] || FW_STATUS_META.tentative;
      return `<span class="status-badge ${meta.cls}">${meta.label}</span>`;
    })() : ''}\n      </div>\n      <div class="detail-grid">\n        <div class="detail-item"><div class="detail-label">תאריך</div><div class="detail-val">${fmtDate(dateStr)}</div></div>\n        <div class="detail-item"><div class="detail-label">יום</div><div class="detail-val">${DAYS_HE[dow]}</div></div>\n        <div class="detail-item"><div class="detail-label">שכבה</div><div class="detail-val">${fw?.grade || '—'}</div></div>\n        <div class="detail-item"><div class="detail-label">שעות</div><div class="detail-val">${fw?.hours || '—'}</div></div>\n      </div>\n      ${(s.rounds || []).length > 1 ? s.rounds.map(((r, i) => {
      const rNames = (r.facilitatorIds || []).map((id => facs.find((f => f.id === id))?.name || '?'));
      const rRequired = r.requiredCount || fw?.facilitatorsPerRound || 1;
      return `<div class="round-detail">\n              <div class="round-label">סבב ${i + 1} <span class="round-time">${r.time}</span>\n                <span style="color:var(--text-muted);font-size:0.75rem;margin-right:0.5rem">${rNames.length}/${rRequired} מנחים</span>\n              </div>\n              <div style="margin-top:0.25rem">${rNames.length ? rNames.map((n => `<span class="chip chip-blue">${n}</span>`)).join('') : '<span style="color:#9ca3af">—</span>'}</div>\n            </div>`;
    })).join('') : `<div class="form-group">\n            <div class="detail-label">מנחים משובצים</div>\n            <div style="margin-top:0.35rem">${names.length ? names.map((n => `<span class="chip chip-blue">${n}</span>`)).join('') : '<span style="color:#9ca3af">לא שובצו מנחים</span>'}</div>\n          </div>`}\n      ${(() => {
      const coordIds = a.coordinatorIds || [];
      if (!coordIds.length) return '';
      const coordNames = coordIds.map((id => facs.find((f => f.id === id))?.name || '')).filter(Boolean);
      if (!coordNames.length) return '';
      return `<div class="form-group">\n          <div class="detail-label" style="color:var(--accent)">רכז/ת מסגרת</div>\n          <div style="margin-top:0.35rem">${coordNames.map((n => `<span class="chip" style="background:rgba(200,96,112,0.15);color:var(--accent);font-weight:700">★ ${n}</span>`)).join('')}</div>\n        </div>`;
    })()}\n      ${fw?.contactName || fw?.contactPhone ? `\n        <div class="detail-grid" style="margin-top:0.5rem">\n          ${fw.contactName ? `<div class="detail-item"><div class="detail-label">איש/אשת קשר במסגרת</div><div class="detail-val">${fw.contactName}</div></div>` : ''}\n          ${fw.contactPhone ? `<div class="detail-item"><div class="detail-label">טלפון קשר</div><div class="detail-val" style="direction:ltr;text-align:right"><a href="tel:${fw.contactPhone}" style="color:var(--primary);text-decoration:none">${fw.contactPhone}</a></div></div>` : ''}\n        </div>` : ''}\n      ${fw?.notes ? `<div class="info-banner">${fw.notes}</div>` : ''}\n      ${(() => {
      if (Auth.isCoord()) {
        const sIdx = (a.sessions || []).indexOf(s);
        const allFacIds = [ ...new Set((s.facilitatorIds || []).concat((s.rounds || []).flatMap((r => r.facilitatorIds || [])))) ];
        const facName = fid => facs.find((f => f.id === fid))?.name || '?';
        const notSentFacs = allFacIds.filter((fid => !Auth.isSent(aId, dateStr, fid)));
        const confirmedFacs = allFacIds.filter((fid => Auth.isSent(aId, dateStr, fid) && Auth.getConfirmation(aId, dateStr, fid)?.status === 'confirmed'));
        const declinedFacs = allFacIds.filter((fid => Auth.isSent(aId, dateStr, fid) && Auth.getConfirmation(aId, dateStr, fid)?.status === 'declined'));
        const awaitingFacs = allFacIds.filter((fid => Auth.isSent(aId, dateStr, fid) && !Auth.getConfirmation(aId, dateStr, fid)));
        const allSent = allFacIds.length > 0 && notSentFacs.length === 0;
        const anySent = allFacIds.length > notSentFacs.length;
        const resendRow = (fid, cls, icon) => `<div class="fac-conf-row">\n            <span class="conf-badge ${cls}">${icon}</span><span class="fac-conf-name">${facName(fid)}</span>\n            <button class="btn btn-secondary btn-xs" onclick="Calendar._sendOneAndRefresh('${aId}','${fid}','${dateStr}',this)" title="שלח שוב מפגש זה בלבד">שלח שוב מפגש זה</button>\n            <button class="btn btn-secondary btn-xs" onclick="Calendar._sendSeriesAndRefresh('${aId}','${fid}','${dateStr}',this)" title="שלח שוב את כל הסדרה">שלח שוב סדרה</button>\n            <button class="btn btn-secondary btn-xs" onclick="Calendar.openCopyMessageModal('${aId}','${dateStr}','${fid}')" title="הודעה להעתקה">📋</button>\n          </div>`;
        const sendRow = fid => `<div class="fac-conf-row">\n            <span class="fac-conf-name">${facName(fid)}</span>\n            <button class="btn btn-primary btn-xs" onclick="Calendar._sendOneAndRefresh('${aId}','${fid}','${dateStr}',this)">שלח מפגש זה</button>\n            <button class="btn btn-secondary btn-xs" onclick="Calendar._sendSeriesAndRefresh('${aId}','${fid}','${dateStr}',this)">שלח כל הסדרה</button>\n          </div>`;
        const category = (label, list, rowFn) => list.length ? `\n            <div class="fac-conf-category">\n              <div class="fac-conf-category-label">${label} (${list.length})</div>\n              <div class="fac-conf-list">${list.map(rowFn).join('')}</div>\n            </div>` : '';
        let statusBody;
        if (allFacIds.length === 0) {
          statusBody = `<span class="status-badge status-inactive">ללא שיבוץ</span>`;
        } else if (!anySent) {
          statusBody = `\n              <span class="status-badge status-partial">טרם נשלח</span>\n              <div style="margin-top:0.5rem">\n                <button class="btn btn-primary btn-sm" onclick="Calendar.sendAllFacsInSession('${aId}','${dateStr}',this)">שלח לאישור לכולם (כל הסדרה)</button>\n              </div>`;
        } else {
          statusBody = `\n              ${allSent ? `<span class="sent-label">כולם קיבלו הזמנה לאישור ✓</span>` : `<span class="status-badge status-partial">נשלח חלקית</span>`}\n              <div class="fac-conf-categories" style="margin-top:0.6rem">\n                ${category('אישרו', confirmedFacs, (fid => resendRow(fid, 'conf-yes', '✓')))}\n                ${category('דחו', declinedFacs, (fid => resendRow(fid, 'conf-no', '✗')))}\n                ${category('טרם הגיבו', awaitingFacs, (fid => resendRow(fid, 'conf-pending', '?')))}\n                ${category('לא נשלח עדיין', notSentFacs, sendRow)}\n              </div>`;
        }
        return `<div class="form-group">\n            <div class="detail-label">סטטוס אישורים</div>\n            <div style="margin-top:0.4rem">${statusBody}</div>\n          </div>\n          <div class="modal-actions">\n            <button class="btn btn-secondary btn-sm" onclick="Calendar.openEdit('${aId}',${sIdx})">ערוך שיבוץ</button>\n            ${(s.status || 'active') === 'active' ? `<button class="btn btn-warning btn-sm" onclick="Calendar._setSessionStatus('${aId}','${dateStr}','cancelled')">בטל מפגש</button>\n                 <button class="btn btn-info btn-sm"    onclick="Calendar._setSessionStatus('${aId}','${dateStr}','postponed')">נדחה</button>` : `<button class="btn btn-success btn-sm" onclick="Calendar._setSessionStatus('${aId}','${dateStr}','active')">שחזר מפגש</button>`}\n            <button class="btn btn-secondary" onclick="closeModal()">סגור</button>\n          </div>\n          <div class="modal-actions modal-actions-danger">\n            <span class="danger-actions-label">מחיקה:</span>\n            <button class="btn btn-danger btn-sm" onclick="Calendar._deleteSession('${aId}','${dateStr}')">מחק מפגש</button>\n            <button class="btn btn-danger btn-sm" onclick="Calendar._deleteSeries('${aId}')">מחק סדרה</button>\n          </div>`;
      } else {
        return `<div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">סגור</button></div>`;
      }
    })()}\n    `);
  },
  openEdit(aId, returnIdx) {
    this._editingAId = aId;
    this._editReturnIdx = returnIdx !== undefined ? returnIdx : null;
    const a = DB.getAssignments().find((x => x.id === aId));
    if (!a) return;
    const fw = DB.getFrameworks().find((f => f.id === a.frameworkId));
    const col = fwColor(a.frameworkId);
    const roundTimes = this._parseRounds(fw?.hours);
    this._editRoundTimes = roundTimes;
    const existCoordId = (a.coordinatorIds || [])[0] || '';
    const blocks = (a.sessions || []).map(((s, idx) => {
      let selectedPerRound;
      if (roundTimes.length > 1) {
        selectedPerRound = roundTimes.map(((_, rIdx) => s.rounds?.[rIdx]?.facilitatorIds || s.facilitatorIds || []));
      } else {
        selectedPerRound = [ s.facilitatorIds || [] ];
      }
      const roundCounts = roundTimes.length > 1 ? roundTimes.map(((_, rIdx) => s.rounds?.[rIdx]?.requiredCount || '')) : [];
      return this._sessionBlock(idx, s.date, selectedPerRound, fw, true, 'ed', roundCounts, existCoordId, s.coordinatorId || '');
    })).join('');
    const fwType = fw?.type || 'formal';
    const fwBadge = fw?.badge || '';
    openModal(`עריכת שיבוץ — ${fw?.name || ''}`, `\n      <div class="form-row">\n        <div class="form-group">\n          <label class="form-label">שם מסגרת</label>\n          <input class="form-control" id="ae-name" value="${(fw?.name || '').replace(/"/g, '&quot;')}">\n        </div>\n        <div class="form-group">\n          <label class="form-label">שכבה</label>\n          <input class="form-control" id="ae-grade" value="${fw?.grade || ''}" placeholder="ז / ח / ט...">\n        </div>\n      </div>\n      <div class="form-row">\n        <div class="form-group">\n          <label class="form-label">שעות</label>\n          <input class="form-control" id="ae-hours" value="${fw?.hours || ''}" placeholder="09:00-10:30 / 11:00-12:30"\n            oninput="Calendar._onEditHoursChange()">\n        </div>\n        <div class="form-group">\n          <label class="form-label">סוג פעילות (צבע)</label>\n          <select class="form-control" id="ae-type">\n            <option value="formal"   ${fwType === 'formal' ? 'selected' : ''}>פורמלי (ירוק)</option>\n            <option value="informal" ${fwType === 'informal' ? 'selected' : ''}>בלתי פורמלי (כחול)</option>\n            <option value="internal" ${fwType === 'internal' ? 'selected' : ''}>פנים ארגוני (סגול)</option>\n          </select>\n        </div>\n        <div class="form-group">\n          <label class="form-label">קטגוריית פעילות</label>\n          <select class="form-control" id="ae-badge">\n            <option value=""         ${!fwBadge ? 'selected' : ''}>ללא</option>\n            <option value="prep"     ${fwBadge === 'prep' ? 'selected' : ''}>הכנה</option>\n            <option value="training" ${fwBadge === 'training' ? 'selected' : ''}>הכשרה</option>\n            <option value="parent"   ${fwBadge === 'parent' ? 'selected' : ''}>הורים</option>\n            <option value="completion" ${fwBadge === 'completion' ? 'selected' : ''}>השלמה</option>\n          </select>\n        </div>\n      </div>\n      <div class="form-group" style="max-width:240px">\n        <label class="form-label">סטטוס מסגרת</label>\n        <select class="form-control" id="ae-status">\n          <option value="tentative" ${!fw || !fw.status || fw.status === 'tentative' ? 'selected' : ''}>משוריין טנטטיבית</option>\n          <option value="waiting"   ${fw?.status === 'waiting' ? 'selected' : ''}>מחכות לטופס</option>\n          <option value="confirmed" ${fw?.status === 'confirmed' ? 'selected' : ''}>סגור ומאושר</option>\n        </select>\n      </div>\n      <div class="form-group">\n        <label class="form-label">הערות</label>\n        <textarea class="form-control" id="ae-notes" rows="2" placeholder="הערות למסגרת...">${fw?.notes || ''}</textarea>\n      </div>\n      ${this._coordSelect('ae-coord', existCoordId)}\n      <hr style="border:none;border-top:1px solid var(--card-border);margin:0.75rem 0">\n      ${blocks}\n      <div class="modal-actions modal-actions-save">\n        <button class="btn btn-primary" onclick="Calendar._saveEdit('${aId}')">שמור</button>\n        <button class="btn btn-secondary" onclick="Calendar._cancelEdit('${aId}')">ביטול</button>\n      </div>`, 'modal-wide');
    this._refreshCoordMarks('ed');
  },
  _reconcileRounds(hoursVal, fw) {
    const rounds = (hoursVal || '').split(/\s*\/\s*/).map((s => s.trim())).filter(Boolean);
    const oldCounts = fw?.roundFacilitators && fw.roundFacilitators.length ? fw.roundFacilitators : [ fw?.facilitatorsPerRound || 1 ];
    if (rounds.length > 1) {
      const roundFacilitators = rounds.map(((_, i) => oldCounts[i] || fw?.facilitatorsPerRound || 1));
      return {
        roundFacilitators: roundFacilitators,
        facilitatorsPerRound: Math.max(...roundFacilitators),
        roundsCount: rounds.length
      };
    }
    const facilitatorsPerRound = oldCounts[0] || fw?.facilitatorsPerRound || 1;
    return {
      roundFacilitators: [ facilitatorsPerRound ],
      facilitatorsPerRound: facilitatorsPerRound,
      roundsCount: fw?.roundsCount || 1
    };
  },
  _cancelEdit(aId) {
    const idx = this._editReturnIdx;
    this._editReturnIdx = null;
    if (idx !== null && idx !== undefined) {
      const a = DB.getAssignments().find((x => x.id === aId));
      const d = a?.sessions?.[idx]?.date;
      if (d) {
        this.openSessionDetail(aId, d);
        return;
      }
    }
    closeModal();
  },
  _onEditHoursChange() {
    const a = this._editingAId ? DB.getAssignments().find((x => x.id === this._editingAId)) : null;
    if (!a) return;
    const oldRoundTimes = this._editRoundTimes || [];
    const newRoundTimes = this._parseRounds(document.getElementById('ae-hours')?.value || '');
    (a.sessions || []).forEach(((s, idx) => {
      const wrap = document.getElementById(`ed-picker-wrap-${idx}`);
      if (!wrap) return;
      const {rounds: oldRounds, facilitatorIds: flatIds} = this._collectRounds(idx, oldRoundTimes, 'ed');
      let selectedPerRound, roundCounts;
      if (newRoundTimes.length > 1) {
        selectedPerRound = newRoundTimes.map(((_, rIdx) => oldRounds[rIdx]?.facilitatorIds || flatIds));
        roundCounts = newRoundTimes.map(((_, rIdx) => oldRounds[rIdx]?.requiredCount || ''));
      } else {
        selectedPerRound = [ flatIds ];
        roundCounts = [];
      }
      const dateVal = document.getElementById(`ed-date-${idx}`)?.value || s.date;
      const pickerContent = this._pickerContent(newRoundTimes, idx, dateVal, selectedPerRound, true, 'ed', roundCounts);
      const copyRow = idx === 0 ? `<div class="session-copy-row">\n            <button type="button" class="btn btn-secondary btn-xs" onclick="Calendar._copyFirstToAll('ed')">העתק בחירת מנחים למפגשים הבאים ›</button>\n          </div>` : '';
      wrap.innerHTML = pickerContent + copyRow;
    }));
    this._editRoundTimes = newRoundTimes;
    this._refreshCoordMarks('ed');
  },
  async _saveEdit(aId) {
    const a = DB.getAssignments().find((x => x.id === aId));
    if (!a) return;
    let fw = null;
    try {
      if (a.frameworkId) {
        fw = DB.getFrameworks().find((f => f.id === a.frameworkId));
        const newHours = document.getElementById('ae-hours')?.value.trim();
        const hoursForSave = newHours !== undefined ? newHours : fw?.hours;
        const roundInfo = this._reconcileRounds(hoursForSave, fw);
        if (fw) await DB.saveFramework({
          ...fw,
          name: document.getElementById('ae-name')?.value.trim() || fw.name,
          grade: document.getElementById('ae-grade')?.value.trim() || fw.grade,
          hours: hoursForSave,
          notes: document.getElementById('ae-notes')?.value.trim(),
          type: document.getElementById('ae-type')?.value || fw.type,
          badge: document.getElementById('ae-badge')?.value || '',
          status: document.getElementById('ae-status')?.value || fw.status || 'tentative',
          facilitatorsPerRound: roundInfo.facilitatorsPerRound,
          roundFacilitators: roundInfo.roundFacilitators,
          roundsCount: roundInfo.roundsCount
        });
        fw = DB.getFrameworks().find((f => f.id === a.frameworkId));
      }
      const roundTimes = this._parseRounds(fw?.hours);
      a.sessions = (a.sessions || []).map(((s, idx) => {
        const dateEl = document.getElementById(`ed-date-${idx}`);
        const d = dateEl?.value || s.date;
        const {rounds: rounds, facilitatorIds: facilitatorIds} = this._collectRounds(idx, roundTimes, 'ed');
        const sessionCoordId = document.getElementById(`ed-coord-${idx}`)?.value || '';
        return {
          ...s,
          date: d,
          facilitatorIds: facilitatorIds,
          rounds: rounds,
          coordinatorId: sessionCoordId || null
        };
      }));
      const coordId = document.getElementById('ae-coord')?.value || '';
      a.coordinatorIds = coordId ? [ coordId ] : [];
      await DB.saveAssignment(a);
      this.render();
      _syncScreens('assignment');
      const idx = this._editReturnIdx;
      this._editReturnIdx = null;
      const retDate = idx !== null && idx !== undefined ? a.sessions?.[idx]?.date : null;
      if (retDate) {
        this.openSessionDetail(aId, retDate);
      } else {
        closeModal();
      }
    } catch (err) {
      alert(err.message);
    }
  },
  async _delAssign(id) {
    if (confirm('למחוק שיבוץ זה?')) {
      try {
        await DB.delAssignment(id);
        this.render();
        _syncScreens('assignment');
      } catch (err) {
        alert(err.message);
      }
    }
  },
  _getSessionStats(facId, startYM, endYM) {
    let confirmed = 0, declined = 0, pending = 0;
    DB.getAssignments().forEach((a => {
      (a.sessions || []).forEach((s => {
        if (!(s.facilitatorIds || []).includes(facId)) return;
        if (startYM || endYM) {
          const ym = s.date.substring(0, 7);
          if (startYM && ym < startYM) return;
          if (endYM && ym > endYM) return;
        }
        if (!Auth.isSent(a.id, s.date, facId)) return;
        const conf = Auth.getConfirmation(a.id, s.date, facId);
        if (conf?.status === 'confirmed') confirmed++; else if (conf?.status === 'declined') declined++; else pending++;
      }));
    }));
    return {
      confirmed: confirmed,
      declined: declined,
      pending: pending,
      total: confirmed + declined + pending
    };
  },
  _getPendingCount(facId) {
    return this._getSessionStats(facId).pending;
  },
  _openSendMonthModal() {
    const facs = DB.getFacilitators().filter((f => f.isFacilitator && (f.status || 'active') !== 'inactive'));
    const ym = `${this.year}-${String(this.month + 1).padStart(2, '0')}`;
    const monthName = new Date(this.year, this.month, 1).toLocaleDateString('he-IL', {
      month: 'long',
      year: 'numeric'
    });
    const allCount = DB.getAssignments().reduce(((n, a) => n + (a.sessions || []).filter((s => s.date.startsWith(ym) && (s.facilitatorIds || []).some((fid => !Auth.isSent(a.id, s.date, fid))))).length), 0);
    openModal('שלח לאישור חודשי', `\n      <div class="form-group">\n        <label class="form-label">חודש: <strong>${monthName}</strong></label>\n      </div>\n      <div class="form-group">\n        <label class="form-label" for="sm-fac-select">בחר/י מנחה (או שלח לכולם)</label>\n        <select id="sm-fac-select" class="form-control">\n          <option value="">— בחר מנחה ספציפי —</option>\n          <option value="__all__">כל המנחים המשובצים בחודש זה</option>\n          ${facs.map((f => `<option value="${f.id}">${f.name}</option>`)).join('')}\n        </select>\n      </div>\n      <div id="sm-preview" style="font-size:0.85rem;color:#64748b;margin-bottom:0.5rem"></div>\n      <div class="modal-actions">\n        <button class="btn btn-primary" onclick="Calendar._doSendMonth(this)">שלח לאישור</button>\n        <button class="btn btn-secondary" onclick="closeModal()">ביטול</button>\n      </div>\n    `);
    const ymCapture = ym;
    document.getElementById('sm-fac-select').addEventListener('change', (function() {
      const fid = this.value;
      const prev = document.getElementById('sm-preview');
      if (!fid) {
        prev.textContent = '';
        return;
      }
      if (fid === '__all__') {
        prev.textContent = allCount > 0 ? `יישלחו שיבוצים לכל המנחים המשובצים בחודש זה` : 'כל השיבוצים בחודש זה כבר נשלחו';
        return;
      }
      const count = DB.getAssignments().reduce(((n, a) => n + (a.sessions || []).filter((s => s.date.startsWith(ymCapture) && (s.facilitatorIds || []).includes(fid) && !Auth.isSent(a.id, s.date, fid))).length), 0);
      prev.textContent = count > 0 ? `יישלחו ${count} שיבוצים חדשים לאישור` : 'כל השיבוצים בחודש זה כבר נשלחו';
    }));
  },
  async _doSendMonth(btn) {
    const fid = document.getElementById('sm-fac-select')?.value;
    if (!fid) {
      alert('נא לבחור מנחה');
      return;
    }
    const ym = `${this.year}-${String(this.month + 1).padStart(2, '0')}`;
    if (fid === '__all__') {
      const progress = document.getElementById('sm-preview');
      const onProgress = (done, total, name) => {
        if (!progress) return;
        progress.innerHTML = done < total ? `<span class="send-spinner" aria-hidden="true"></span> שולח ${done + 1} מתוך ${total}: ${name}… נא לא לסגור את הדף` : '';
      };
      const warnLeave = e => {
        e.preventDefault();
        e.returnValue = '';
      };
      window.addEventListener('beforeunload', warnLeave);
      document.getElementById('sm-fac-select')?.setAttribute('disabled', '');
      try {
        const res = await runButtonFeedback(btn, (() => Auth.sendAllForMonth(ym, onProgress)));
        this.render();
        _syncScreens('assignment');
        const {count: count, facCount: facCount, emailFails: emailFails} = res;
        if (emailFails && emailFails.length) {
          this._showMonthSendResult(count, facCount, emailFails, ym);
        } else if (!count) {
          closeModal();
          alert('לא היו שיבוצים חדשים לשליחה');
        } else {
          setTimeout((() => {
            closeModal();
            alert(`נשלחו ${count} שיבוצים ל-${facCount} מנחים ✓`);
          }), 500);
        }
      } catch (err) {
        alert(err.message);
      } finally {
        window.removeEventListener('beforeunload', warnLeave);
      }
      return;
    }
    try {
      const res = await runButtonFeedback(btn, (async () => {
        const r = await Auth.sendAllForFacAndMonth(fid, ym);
        if (!r?.count) throw Object.assign(new Error('nothing-new'), {
          noop: true
        });
        return r;
      }));
      this.render();
      _syncScreens('assignment');
      const count = res?.count || 0;
      const facName = DB.getFacilitators().find((f => f.id === fid))?.name || '';
      const emailOk = res?.email_sent;
      const emailErr = res?.email_error;
      if (!emailOk) {
        this._showMonthSendResult(count, 1, [ {
          facId: fid,
          facName: facName,
          error: emailErr
        } ], ym);
      } else {
        setTimeout((() => {
          closeModal();
          alert(`נשלחו ${count} שיבוצים לאישור${facName ? ' ל' + facName : ''} ✓`);
        }), 500);
      }
    } catch (err) {
      if (err.noop) {
        closeModal();
        alert('לא היו שיבוצים חדשים לשליחה');
      } else alert(err.message);
    }
  },
  _showMonthSendResult(count, facCount, emailFails, ym) {
    const failRows = emailFails.map((f => `<div class="fac-conf-row">\n        <span class="fac-conf-name">${f.facName}</span>\n        ${f.error ? `<span style="font-size:0.75rem;color:#9ca3af">${f.error}</span>` : ''}\n        <button class="btn btn-secondary btn-xs" onclick="Calendar._markMonthSentManually(${JSON.stringify(f.facId)},'${ym}',this)">סמן כנשלח ושלח ידנית 📋</button>\n      </div>`)).join('');
    openModal('תוצאת שליחה חודשית', `\n      <div class="info-banner" style="margin-bottom:0.75rem">\n        נשלחו ונרשמו ${count} שיבוצים ל-${facCount} מנחים.\n      </div>\n      <div class="email-err-banner" style="margin-bottom:0.75rem">\n        <span>⚠</span>\n        <div><strong>לא נשלח ל-${emailFails.length} מנחים</strong> — הבקשות שלהם לא נרשמו. אפשר לנסות שוב מאוחר יותר, או לסמן כנשלח ולשלוח ידנית:</div>\n      </div>\n      <div class="fac-conf-list">${failRows}</div>\n      <div class="modal-actions" style="margin-top:1rem">\n        <button class="btn btn-secondary" onclick="closeModal()">סגור</button>\n      </div>\n    `);
  },
  async _markMonthSentManually(fid, ym, btn) {
    const [year, month] = ym.split('-').map(Number);
    try {
      await API.post(`/api/send-confirmation/month/${fid}`, {
        year: year,
        month: month,
        manual: true
      });
      await DB.reloadConfirmations();
      _syncScreens('assignment');
      btn.disabled = true;
      btn.textContent = '✓ סומן כנשלח';
      this.openCopyMessageModal('', ym, fid);
    } catch (err) {
      alert(err.message);
    }
  },
  _openDownloadModal() {
    const facId = Auth.currentFacId();
    if (!facId) return;
    const today = todayStr();
    const yearEnd = parseInt(today.slice(0, 4)) + (parseInt(today.slice(5, 7)) >= 9 ? 1 : 0) + '-08-31';
    openModal('הורדת רשימת שיבוצים', `\n      <div class="form-row">\n        <div class="form-group">\n          <label class="form-label">מתאריך</label>\n          <input class="form-control" type="date" id="dl-from" value="2025-09-01">\n        </div>\n        <div class="form-group">\n          <label class="form-label">עד תאריך</label>\n          <input class="form-control" type="date" id="dl-to" value="${yearEnd}">\n        </div>\n      </div>\n      <div class="form-group">\n        <label class="form-label">סינון סטטוס</label>\n        <select class="form-control" id="dl-status">\n          <option value="">הכל</option>\n          <option value="pending">ממתינים לאישור</option>\n          <option value="confirmed">מאושרים</option>\n          <option value="declined">שנדחו</option>\n        </select>\n      </div>\n      <div class="modal-actions">\n        <button class="btn btn-primary" onclick="Calendar._downloadExcel()">↓ הורד לאקסל</button>\n        <button class="btn btn-secondary" onclick="closeModal()">סגור</button>\n      </div>`);
  },
  _downloadExcel() {
    const facId = Auth.currentFacId();
    const myFac = facId ? DB.getFacilitators().find((f => f.id === facId)) : null;
    const fromDate = document.getElementById('dl-from')?.value || '';
    const toDate = document.getElementById('dl-to')?.value || '';
    const statusFlt = document.getElementById('dl-status')?.value || '';
    const BADGE_LABELS = {
      prep: 'הכנה לצוות',
      training: 'הכשרה לצוות',
      parent: 'הרצאת הורים',
      completion: 'השלמה'
    };
    const TYPE_LABELS = {
      formal: 'פורמלי',
      informal: 'בלתי פורמלי',
      internal: 'פנים ארגוני'
    };
    const rows = [];
    DB.getAssignments().forEach((a => {
      const fw = DB.getFrameworks().find((f => f.id === a.frameworkId));
      (a.sessions || []).forEach((s => {
        if (!(s.facilitatorIds || []).includes(facId)) return;
        if (fromDate && s.date < fromDate) return;
        if (toDate && s.date > toDate) return;
        const conf = Auth.getConfirmation(a.id, s.date, facId);
        const status = conf?.status === 'confirmed' ? 'אושר' : conf?.status === 'declined' ? 'נדחה' : 'ממתין';
        if (statusFlt === 'pending' && status !== 'ממתין') return;
        if (statusFlt === 'confirmed' && status !== 'אושר') return;
        if (statusFlt === 'declined' && status !== 'נדחה') return;
        rows.push({
          date: s.date,
          day: DAYS_HE[dayOfWeek(s.date)],
          name: fw?.name || '',
          grade: fw?.grade || '',
          hours: fw?.hours || '',
          type: BADGE_LABELS[fw?.badge] || TYPE_LABELS[fw?.type] || '',
          status: status
        });
      }));
    }));
    rows.sort(((a, b) => a.date < b.date ? -1 : 1));
    const confirmed = rows.filter((r => r.status === 'אושר')).length;
    const pending = rows.filter((r => r.status === 'ממתין')).length;
    const declined = rows.filter((r => r.status === 'נדחה')).length;
    const x = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const cell = (val, sid) => `<Cell ss:StyleID="${sid}"><Data ss:Type="String">${x(val)}</Data></Cell>`;
    const numCell = (val, sid) => `<Cell ss:StyleID="${sid}"><Data ss:Type="Number">${val}</Data></Cell>`;
    const dataRows = rows.map(((r, i) => {
      const base = i % 2 === 0 ? 'rowE' : 'rowO';
      const sts = r.status === 'אושר' ? 'sOk' : r.status === 'נדחה' ? 'sNo' : 'sPend';
      return `<Row ss:Height="18">\n        ${cell(r.date, base)}${cell(r.day, base)}\n        ${cell(r.name, base)}${cell(r.grade, base)}\n        ${cell(r.hours, base)}${cell(r.type, base)}\n        ${cell(r.status, sts)}\n      </Row>`;
    })).join('\n');
    const rangeLabel = fromDate || toDate ? ` | ${fromDate || ''}  —  ${toDate || ''}` : '';
    const subtitleText = `אושרו: ${confirmed}  |  ממתינים: ${pending}  |  נדחו: ${declined}  |  סה״כ: ${rows.length}`;
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n          xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\n          xmlns:x="urn:schemas-microsoft-com:office:excel">\n<Styles>\n  <Style ss:ID="Default">\n    <Alignment ss:ReadingOrder="RightToLeft"/>\n    <Font ss:FontName="Arial" ss:Size="10"/>\n  </Style>\n  <Style ss:ID="title">\n    <Alignment ss:ReadingOrder="RightToLeft"/>\n    <Font ss:FontName="Arial" ss:Bold="1" ss:Size="14" ss:Color="#1E3A5F"/>\n  </Style>\n  <Style ss:ID="subtitle">\n    <Alignment ss:ReadingOrder="RightToLeft"/>\n    <Font ss:FontName="Arial" ss:Size="10" ss:Color="#6B7280"/>\n  </Style>\n  <Style ss:ID="hdr">\n    <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/>\n    <Font ss:FontName="Arial" ss:Bold="1" ss:Size="11" ss:Color="#FFFFFF"/>\n    <Interior ss:Color="#1E3A5F" ss:Pattern="Solid"/>\n    <Borders>\n      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#94A3B8"/>\n      <Border ss:Position="Left"   ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#475569"/>\n      <Border ss:Position="Right"  ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#475569"/>\n    </Borders>\n  </Style>\n  <Style ss:ID="rowE">\n    <Alignment ss:ReadingOrder="RightToLeft"/>\n    <Font ss:FontName="Arial" ss:Size="10"/>\n    <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>\n    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders>\n  </Style>\n  <Style ss:ID="rowO">\n    <Alignment ss:ReadingOrder="RightToLeft"/>\n    <Font ss:FontName="Arial" ss:Size="10"/>\n    <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>\n    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders>\n  </Style>\n  <Style ss:ID="sOk">\n    <Alignment ss:Horizontal="Center" ss:ReadingOrder="RightToLeft"/>\n    <Font ss:FontName="Arial" ss:Bold="1" ss:Size="10" ss:Color="#065F46"/>\n    <Interior ss:Color="#D1FAE5" ss:Pattern="Solid"/>\n  </Style>\n  <Style ss:ID="sPend">\n    <Alignment ss:Horizontal="Center" ss:ReadingOrder="RightToLeft"/>\n    <Font ss:FontName="Arial" ss:Bold="1" ss:Size="10" ss:Color="#92400E"/>\n    <Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/>\n  </Style>\n  <Style ss:ID="sNo">\n    <Alignment ss:Horizontal="Center" ss:ReadingOrder="RightToLeft"/>\n    <Font ss:FontName="Arial" ss:Bold="1" ss:Size="10" ss:Color="#991B1B"/>\n    <Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/>\n  </Style>\n  <Style ss:ID="sumRow">\n    <Alignment ss:ReadingOrder="RightToLeft"/>\n    <Font ss:FontName="Arial" ss:Bold="1" ss:Size="10" ss:Color="#1E3A5F"/>\n    <Interior ss:Color="#EFF6FF" ss:Pattern="Solid"/>\n    <Borders><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#1E3A5F"/></Borders>\n  </Style>\n</Styles>\n<Worksheet ss:Name="שיבוצים">\n  <Table ss:DefaultRowHeight="18">\n    <Column ss:Width="85"/><Column ss:Width="52"/><Column ss:Width="185"/>\n    <Column ss:Width="52"/><Column ss:Width="115"/><Column ss:Width="105"/><Column ss:Width="68"/>\n    <Row ss:Height="26">\n      <Cell ss:StyleID="title" ss:MergeAcross="6">\n        <Data ss:Type="String">רשימת שיבוצים — ${x(myFac?.name || '')}${x(rangeLabel)}</Data>\n      </Cell>\n    </Row>\n    <Row ss:Height="18">\n      <Cell ss:StyleID="subtitle" ss:MergeAcross="6">\n        <Data ss:Type="String">${x(subtitleText)}</Data>\n      </Cell>\n    </Row>\n    <Row ss:Height="22">\n      ${cell('תאריך', 'hdr')}${cell('יום', 'hdr')}${cell('מסגרת', 'hdr')}\n      ${cell('שכבה', 'hdr')}${cell('שעות', 'hdr')}${cell('סוג פעילות', 'hdr')}${cell('סטטוס', 'hdr')}\n    </Row>\n    ${dataRows}\n    <Row ss:Height="20">\n      <Cell ss:StyleID="sumRow" ss:MergeAcross="5"><Data ss:Type="String">סה״כ שיבוצים</Data></Cell>\n      ${numCell(rows.length, 'sumRow')}\n    </Row>\n  </Table>\n  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">\n    <DisplayRightToLeft/>\n    <FreezePanes/>\n    <FrozenNoSplit/>\n    <SplitHorizontal>3</SplitHorizontal>\n    <TopRowBottomPane>3</TopRowBottomPane>\n    <ActivePane>2</ActivePane>\n    <Panes>\n      <Pane><Number>2</Number><ActiveRow>3</ActiveRow></Pane>\n    </Panes>\n  </WorksheetOptions>\n</Worksheet>\n</Workbook>`;
    const blob = new Blob([ xml ], {
      type: 'application/vnd.ms-excel;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `שיבוצים-${(myFac?.name || 'מנחה').replace(/\s+/g, '-')}-${todayStr()}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    closeModal();
  },
  _downloadICS(aId) {
    const a = DB.getAssignments().find((x => x.id === aId));
    if (!a) return;
    const fw = DB.getFrameworks().find((f => f.id === a.frameworkId));
    const BADGE_LABELS_ICS = {
      prep: 'הכנה לצוות',
      training: 'הכשרה לצוות',
      parent: 'הרצאת הורים',
      completion: 'השלמה'
    };
    const typeLabel = BADGE_LABELS_ICS[fw?.badge] || '';
    const rawName = fw?.name || 'שיבוץ';
    const dispName = typeLabel ? rawName.replace(/^(הכנה לצוות|הכשרה מקוצרת לצוות|הכשרה לצוות|הכשרת צוות|הרצאה להורים|הרצאה הורים)\s*/i, '').trim() || rawName : rawName;
    const summary = typeLabel ? `${typeLabel}: ${dispName}` : dispName;
    const parseHours = hours => {
      if (!hours) return {
        s: '090000',
        e: '103000'
      };
      const first = (hours.split(/\s*\/\s*/)[0] || '').trim();
      const m = first.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
      if (!m) return {
        s: '090000',
        e: '103000'
      };
      const p = n => String(+n).padStart(2, '0');
      return {
        s: `${p(m[1])}${p(m[2])}00`,
        e: `${p(m[3])}${p(m[4])}00`
      };
    };
    const {s: tS, e: tE} = parseHours(fw?.hours);
    const desc = [ fw?.grade ? `שכבה: ${fw.grade}` : '', fw?.hours ? `שעות: ${fw.hours}` : '', fw?.notes ? `הערות: ${fw.notes}` : '' ].filter(Boolean).join('\\n');
    const now = (new Date).toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    const events = (a.sessions || []).map((s => {
      const dt = s.date.replace(/-/g, '');
      return [ 'BEGIN:VEVENT', `UID:demo-${aId}-${s.date}@demo.local`, `DTSTAMP:${now}`, `DTSTART;TZID=Asia/Jerusalem:${dt}T${tS}`, `DTEND;TZID=Asia/Jerusalem:${dt}T${tE}`, `SUMMARY:${summary}`, desc ? `DESCRIPTION:${desc}` : null, fw?.grade ? `LOCATION:${fw.grade}` : null, 'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', `DESCRIPTION:תזכורת: מחר — ${summary}`, 'END:VALARM', 'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', `DESCRIPTION:תזכורת: עוד שעה — ${summary}`, 'END:VALARM', 'END:VEVENT' ].filter((x => x !== null)).join('\r\n');
    })).join('\r\n');
    const ics = [ 'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//הדגמה//לוח שיבוצים//HE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-TIMEZONE:Asia/Jerusalem', 'X-WR-CALNAME:שיבוצי מנחים', events, 'END:VCALENDAR' ].join('\r\n');
    const blob = new Blob([ ics ], {
      type: 'text/calendar;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${rawName.replace(/[/<>:"/\\|?*]/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
  async _sendCalendarInvite(aId, dateStr, btn) {
    const orig = btn?.textContent;
    if (btn) btn.textContent = 'שולח...';
    try {
      const res = await API.post('/api/export/calendar-invite', {
        assignment_id: aId,
        date: dateStr
      });
      if (res.email_sent) {
        if (btn) {
          btn.textContent = 'נשלח ✓';
          setTimeout((() => {
            if (btn) btn.textContent = orig;
          }), 2500);
        }
      } else {
        alert(`שגיאה: ${res.error || 'לא ידוע'}`);
        if (btn) btn.textContent = orig;
      }
    } catch (err) {
      alert(err.message);
      if (btn) btn.textContent = orig;
    }
  }
};

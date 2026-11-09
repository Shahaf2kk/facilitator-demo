const FW_STATUS_META = {
  tentative: {
    label: 'משוריין טנטטיבית',
    cls: 'status-coord'
  },
  waiting: {
    label: 'מחכות לטופס',
    cls: 'status-partial'
  },
  confirmed: {
    label: 'סגור ומאושר',
    cls: 'status-active'
  }
};

const Frameworks = {
  _searchTerm: '',
  _statusFilter: '',
  _selectedIds: new Set,
  _sortCol: '',
  _sortDir: 'asc',
  render() {
    const list = DB.getFrameworks();
    document.getElementById('frameworks-tab').innerHTML = `\n      <div class="stats-row">\n        <div class="stat-card"><div class="stat-label">סה״כ מסגרות</div><div class="stat-value">${list.length}</div></div>\n        <div class="stat-card"><div class="stat-label">סה״כ סבבים</div><div class="stat-value">${list.reduce(((s, f) => s + (f.roundsCount || 1)), 0)}</div></div>\n        <div class="stat-card"><div class="stat-label">מנחים נדרשים</div><div class="stat-value">${list.reduce(((s, f) => s + this._peakFacilitators(f)), 0)}</div></div>\n      </div>\n      <div class="card">\n        <div class="card-header">\n          <h2>מסגרות חינוכיות</h2>\n          <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">\n            <input type="text" class="cal-search" id="fw-search-input"\n              placeholder="חיפוש מסגרת..."\n              value="${this._searchTerm}"\n              oninput="Frameworks._searchTerm=this.value; Frameworks._refreshTable()"\n              style="width:200px">\n            <select id="fw-status-filter" class="form-control" style="width:170px"\n              onchange="Frameworks._statusFilter=this.value; Frameworks._refreshTable()">\n              <option value="">כל הסטטוסים</option>\n              <option value="tentative">משוריין טנטטיבית</option>\n              <option value="waiting">מחכות לטופס</option>\n              <option value="confirmed">סגור ומאושר</option>\n            </select>\n            <button class="btn btn-primary btn-sm" onclick="Frameworks.openModal()">+ הוסף מסגרת</button>\n          </div>\n        </div>\n        <div class="table-wrap">\n          <table>\n            <thead><tr>\n              <th style="width:32px"><input type="checkbox" id="fw-check-all" onchange="Frameworks._toggleAll(this.checked)" title="בחר הכל"></th>\n              ${this._th('שם מסגרת', 'name')}${this._th('שכבה', 'grade')}<th>שעות סדנה</th>\n              <th>מנחים לסבב</th><th>כמות סבבים</th><th>מפגשים</th><th>סטטוס</th><th>הערות</th><th>פעולות</th>\n            </tr></thead>\n            <tbody id="fw-tbody"></tbody>\n          </table>\n        </div>\n        <div id="fw-bulk-bar" style="display:none;align-items:center;gap:0.6rem;padding:0.6rem 1rem;background:#f0f9ff;border-top:1px solid #bae6fd;flex-wrap:wrap">\n          <span id="fw-bulk-count" style="font-weight:600;color:#0369a1;font-size:0.85rem"></span>\n          <select id="fw-bulk-field" class="form-control" style="width:150px;font-size:0.82rem" onchange="Frameworks._onBulkFieldChange()">\n            <option value="">— שדה לעריכה —</option>\n            <option value="type">סוג פעילות (צבע)</option>\n            <option value="badge">תג</option>\n            <option value="status">סטטוס</option>\n          </select>\n          <select id="fw-bulk-value" class="form-control" style="width:180px;font-size:0.82rem" disabled>\n            <option value="">—</option>\n          </select>\n          <button class="btn btn-primary btn-sm" onclick="Frameworks._applyBulkEdit()">עדכן הכל</button>\n          <button class="btn btn-secondary btn-sm" onclick="Frameworks._clearSelection()">ביטול בחירה</button>\n        </div>\n      </div>`;
    this._refreshTable();
  },
  _peakFacilitators(f) {
    if (f.roundFacilitators && f.roundFacilitators.length) return Math.max(...f.roundFacilitators);
    return f.facilitatorsPerRound || 1;
  },
  _th(label, col) {
    const active = this._sortCol === col;
    const arrow = active ? this._sortDir === 'asc' ? ' ▲' : ' ▼' : ' ⇅';
    return `<th style="cursor:pointer;user-select:none" onclick="Frameworks._sortBy('${col}')">${label}<span style="font-size:0.7rem;opacity:${active ? 1 : .4}">${arrow}</span></th>`;
  },
  _sortBy(col) {
    if (this._sortCol === col) this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc'; else {
      this._sortCol = col;
      this._sortDir = 'asc';
    }
    this._refreshTable();
  },
  _refreshTable() {
    const tbody = document.getElementById('fw-tbody');
    if (!tbody) return;
    const q = (this._searchTerm || '').trim().toLowerCase();
    let list = q ? DB.getFrameworks().filter((f => [ f.name, f.grade, f.hours, f.notes, f.type ].join(' ').toLowerCase().includes(q))) : DB.getFrameworks();
    if (this._statusFilter) list = list.filter((f => (f.status || 'tentative') === this._statusFilter));
    if (this._sortCol) {
      const dir = this._sortDir === 'asc' ? 1 : -1;
      list = [ ...list ].sort(((a, b) => (a[this._sortCol] || '').localeCompare(b[this._sortCol] || '', 'he') * dir));
    }
    tbody.innerHTML = this._rows(list);
    this._updateBulkBar();
  },
  _rows(list) {
    if (!list.length) return `<tr><td colspan="10"><div class="empty-state">${this._searchTerm ? 'לא נמצאו מסגרות תואמות.' : 'אין מסגרות. לחץ "הוסף מסגרת" להוספה.'}</div></td></tr>`;
    return list.map(((f, idx) => {
      const rfc = f.roundFacilitators && f.roundFacilitators.length > 1 ? f.roundFacilitators.join(' / ') : f.facilitatorsPerRound || 1;
      const rc = f.roundFacilitators && f.roundFacilitators.length > 1 ? f.roundFacilitators.length : f.roundsCount || 1;
      const checked = this._selectedIds.has(f.id) ? 'checked' : '';
      const statusMeta = FW_STATUS_META[f.status] || FW_STATUS_META.tentative;
      return `\n      <tr>\n        <td style="text-align:center"><input type="checkbox" class="fw-row-check" data-id="${f.id}" ${checked} onchange="Frameworks._toggleOne('${f.id}',this.checked)"></td>\n        <td><span class="color-dot" style="background:${fwSectorColor(f) || FW_COLORS[idx % FW_COLORS.length]}"></span><strong>${f.name}</strong>${f.badge ? ` <span class="chip-type-label">${{
        prep: 'הכנה',
        training: 'הכשרה',
        parent: 'הורים',
        completion: 'השלמה'
      }[f.badge] || f.badge}</span>` : ''}</td>\n        <td>${f.grade || '—'}</td>\n        <td>${f.hours || '—'}</td>\n        <td>${rfc}</td>\n        <td>${rc}</td>\n        <td>${f.sessionCount || 3}</td>\n        <td><span class="status-badge ${statusMeta.cls}">${statusMeta.label}</span></td>\n        <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${f.notes || ''}">${f.notes || '—'}</td>\n        <td><div class="actions">\n          <button class="btn btn-secondary btn-icon" onclick="Frameworks.openModal('${f.id}')" title="עריכה">${ICONS.edit}</button>\n          <button class="btn btn-danger btn-icon" data-id="${f.id}" data-name="${f.name.replace(/"/g, '&quot;')}" onclick="Frameworks._del(this.dataset.id,this.dataset.name)" title="מחיקה">${ICONS.trash}</button>\n        </div></td>\n      </tr>`;
    })).join('');
  },
  _toggleAll(checked) {
    document.querySelectorAll('.fw-row-check').forEach((cb => {
      cb.checked = checked;
      if (checked) this._selectedIds.add(cb.dataset.id); else this._selectedIds.delete(cb.dataset.id);
    }));
    this._updateBulkBar();
  },
  _toggleOne(id, checked) {
    if (checked) this._selectedIds.add(id); else this._selectedIds.delete(id);
    const allCbs = [ ...document.querySelectorAll('.fw-row-check') ];
    const allCheck = allCbs.length > 0 && allCbs.every((c => c.checked));
    const hdr = document.getElementById('fw-check-all');
    if (hdr) {
      hdr.checked = allCheck;
      hdr.indeterminate = !allCheck && this._selectedIds.size > 0;
    }
    this._updateBulkBar();
  },
  _updateBulkBar() {
    const bar = document.getElementById('fw-bulk-bar');
    if (!bar) return;
    const n = this._selectedIds.size;
    bar.style.display = n > 0 ? 'flex' : 'none';
    const el = document.getElementById('fw-bulk-count');
    if (el) el.textContent = `${n} מסגרות נבחרו`;
  },
  _onBulkFieldChange() {
    const field = document.getElementById('fw-bulk-field')?.value;
    const valSel = document.getElementById('fw-bulk-value');
    if (!valSel) return;
    valSel.disabled = !field;
    if (field === 'type') {
      valSel.innerHTML = `\n        <option value="formal">פורמלי (ירוק)</option>\n        <option value="informal">בלתי פורמלי (כחול)</option>\n        <option value="internal">פנים ארגוני (סגול)</option>`;
    } else if (field === 'badge') {
      valSel.innerHTML = `\n        <option value="">ללא תג</option>\n        <option value="prep">הכנה</option>\n        <option value="training">הכשרה</option>\n        <option value="parent">הורים</option>\n        <option value="completion">השלמה</option>`;
    } else if (field === 'status') {
      valSel.innerHTML = `\n        <option value="tentative">משוריין טנטטיבית</option>\n        <option value="waiting">מחכות לטופס</option>\n        <option value="confirmed">סגור ומאושר</option>`;
    } else {
      valSel.innerHTML = '<option value="">—</option>';
    }
  },
  async _applyBulkEdit() {
    const field = document.getElementById('fw-bulk-field')?.value;
    const value = document.getElementById('fw-bulk-value')?.value;
    if (!field) return;
    try {
      for (const fw of DB.getFrameworks()) {
        if (!this._selectedIds.has(fw.id)) continue;
        await DB.saveFramework({
          ...fw,
          [field]: value
        });
      }
      this._selectedIds.clear();
      this.render();
      _syncScreens('framework');
    } catch (err) {
      alert(err.message);
    }
  },
  _clearSelection() {
    this._selectedIds.clear();
    this._refreshTable();
    this._updateBulkBar();
    const hdr = document.getElementById('fw-check-all');
    if (hdr) {
      hdr.checked = false;
      hdr.indeterminate = false;
    }
  },
  _roundCountsHtml(hoursVal, f) {
    const rounds = (hoursVal || '').split(/\s*\/\s*/).map((s => s.trim())).filter(Boolean);
    const storedCounts = f?.roundFacilitators || [];
    if (rounds.length > 1) {
      return `<div class="form-group">\n        <label class="form-label">מנחים לסבב <span style="font-weight:400;color:var(--text-muted)">(${rounds.length} סבבים)</span></label>\n        <div class="fw-rounds-inline">\n          ${rounds.map(((time, i) => `\n            <div class="fw-round-row">\n              <span class="fw-round-time">${time}</span>\n              <input type="number" min="1" max="20" value="${storedCounts[i] || f?.facilitatorsPerRound || 1}"\n                id="fw-rfc-${i}" class="fw-round-input">\n              <span class="fw-round-unit">מנחים</span>\n            </div>`)).join('')}\n        </div>\n        <input type="hidden" id="fw-rounds-len" value="${rounds.length}">\n      </div>`;
    }
    return `<div class="form-row">\n      <div class="form-group">\n        <label class="form-label">מנחים לסבב</label>\n        <input class="form-control" type="number" id="fw-fpr" value="${storedCounts[0] || f?.facilitatorsPerRound || 1}" min="1" max="20">\n      </div>\n      <div class="form-group">\n        <label class="form-label">כמות סבבים</label>\n        <input class="form-control" type="number" id="fw-rc" value="${f?.roundsCount || 1}" min="1" max="50">\n      </div>\n    </div>`;
  },
  _currentRoundCounts() {
    const fprEl = document.getElementById('fw-fpr');
    if (fprEl) {
      const v = +fprEl.value || 1;
      return {
        roundFacilitators: [ v ],
        facilitatorsPerRound: v,
        roundsCount: +document.getElementById('fw-rc')?.value || 1
      };
    }
    const counts = [];
    for (let i = 0; document.getElementById(`fw-rfc-${i}`); i++) {
      counts.push(+document.getElementById(`fw-rfc-${i}`).value || 1);
    }
    if (!counts.length) return null;
    return {
      roundFacilitators: counts,
      facilitatorsPerRound: Math.max(...counts),
      roundsCount: counts.length
    };
  },
  _onHoursChange(f) {
    const hoursVal = document.getElementById('fw-hours')?.value || '';
    const container = document.getElementById('fw-round-counts');
    if (!container) return;
    container.innerHTML = this._roundCountsHtml(hoursVal, f || this._currentRoundCounts());
  },
  openModal(id) {
    const f = id ? DB.getFrameworks().find((x => x.id === id)) : null;
    const hoursVal = f?.hours || '';
    openModal(f ? 'עריכת מסגרת' : 'הוספת מסגרת חינוכית', `\n      <form id="fw-form">\n        <div class="form-row">\n          <div class="form-group">\n            <label class="form-label">שם המסגרת *</label>\n            <div style="position:relative">\n              <input class="form-control" id="fw-name" value="${f?.name || ''}" required placeholder="שם בית הספר / מוסד"\n                oninput="Frameworks._fwNameSearch(this.value)" autocomplete="off">\n              <div id="fw-name-drop" class="fw-dropdown" style="display:none"></div>\n            </div>\n          </div>\n          <div class="form-group">\n            <label class="form-label">שכבה</label>\n            <input class="form-control" id="fw-grade" value="${f?.grade || ''}" placeholder="ז׳-ח׳ / ט׳-י׳ ...">\n          </div>\n        </div>\n        <div class="form-row">\n          <div class="form-group">\n            <label class="form-label">שם איש/אשת קשר במסגרת</label>\n            <input class="form-control" id="fw-contact-name" value="${f?.contactName || ''}" placeholder="שם מלא">\n          </div>\n          <div class="form-group">\n            <label class="form-label">טלפון איש/אשת קשר במסגרת</label>\n            <input class="form-control" type="tel" id="fw-contact-phone" value="${f?.contactPhone || ''}"\n              placeholder="050-1234567" style="direction:ltr;text-align:left">\n          </div>\n        </div>\n        <div class="form-group" style="max-width:180px">\n          <label class="form-label">מספר מפגשים <span style="color:#6b7280;font-weight:400">(ברירת מחדל 3)</span></label>\n          <input class="form-control" type="number" id="fw-sc" value="${f?.sessionCount || 3}" min="1" max="52">\n        </div>\n        <div class="form-group">\n          <label class="form-label">שעות פעילות</label>\n          <input class="form-control" id="fw-hours" value="${hoursVal}"\n            placeholder="08:00–10:00 או לסבבים: 08:00–10:00 / 10:30–12:30"\n            oninput="Frameworks._onHoursChange()">\n          <div style="font-size:0.72rem;color:var(--text-muted);margin-top:3px">לסבבים מרובים באותו יום — הפרד בסלש (/)</div>\n        </div>\n        <div id="fw-round-counts">${this._roundCountsHtml(hoursVal, f)}</div>\n        <div class="form-row">\n          <div class="form-group">\n            <label class="form-label">סוג פעילות (צבע)</label>\n            <select class="form-control" id="fw-type">\n              <option value="formal"   ${!f || !f.type || f.type === 'formal' ? 'selected' : ''}>חינוך פורמלי (ירוק)</option>\n              <option value="informal" ${f?.type === 'informal' ? 'selected' : ''}>חינוך בלתי פורמלי / נוער בסיכון (כחול)</option>\n              <option value="internal" ${f?.type === 'internal' ? 'selected' : ''}>פנים ארגוני (סגול)</option>\n            </select>\n          </div>\n          <div class="form-group">\n            <label class="form-label">קטגוריית פעילות</label>\n            <select class="form-control" id="fw-badge">\n              <option value=""         ${!f?.badge ? 'selected' : ''}>ללא</option>\n              <option value="prep"     ${f?.badge === 'prep' ? 'selected' : ''}>הכנה</option>\n              <option value="training" ${f?.badge === 'training' ? 'selected' : ''}>הכשרה</option>\n              <option value="parent"   ${f?.badge === 'parent' ? 'selected' : ''}>הורים</option>\n              <option value="completion" ${f?.badge === 'completion' ? 'selected' : ''}>השלמה</option>\n            </select>\n            <div style="font-size:0.72rem;color:var(--text-muted);margin-top:3px">מוצג כתג על הצ׳יפ בלוח השנה</div>\n          </div>\n        </div>\n        <div class="form-group" style="max-width:220px">\n          <label class="form-label">סטטוס מול המסגרת</label>\n          <select class="form-control" id="fw-status">\n            <option value="tentative" ${!f || !f.status || f.status === 'tentative' ? 'selected' : ''}>משוריין טנטטיבית</option>\n            <option value="waiting"   ${f?.status === 'waiting' ? 'selected' : ''}>מחכות לטופס</option>\n            <option value="confirmed" ${f?.status === 'confirmed' ? 'selected' : ''}>סגור ומאושר</option>\n          </select>\n        </div>\n        <div class="form-group">\n          <label class="form-label">הערות נוספות</label>\n          <textarea class="form-control" id="fw-notes" rows="2" placeholder="דרישות מיוחדות, מידע נוסף...">${f?.notes || ''}</textarea>\n        </div>\n        <div class="modal-actions modal-actions-save">\n          <button type="button" class="btn btn-primary" onclick="Frameworks._save('${id || ''}')">שמור</button>\n          <button type="button" class="btn btn-secondary" onclick="closeModal()">ביטול</button>\n        </div>\n      </form>`);
  },
  async _save(id) {
    const name = document.getElementById('fw-name').value.trim();
    if (!name) return;
    const hoursVal = document.getElementById('fw-hours').value.trim();
    const rounds = hoursVal.split(/\s*\/\s*/).map((s => s.trim())).filter(Boolean);
    let roundFacilitators, facilitatorsPerRound, roundsCount;
    if (rounds.length > 1 && document.getElementById('fw-rfc-0')) {
      roundFacilitators = rounds.map(((_, i) => +document.getElementById(`fw-rfc-${i}`)?.value || 1));
      facilitatorsPerRound = Math.max(...roundFacilitators);
      roundsCount = rounds.length;
    } else {
      facilitatorsPerRound = +document.getElementById('fw-fpr')?.value || 1;
      roundFacilitators = [ facilitatorsPerRound ];
      roundsCount = +document.getElementById('fw-rc')?.value || 1;
    }
    try {
      await DB.saveFramework({
        id: id || null,
        name: name,
        grade: document.getElementById('fw-grade').value.trim(),
        hours: hoursVal,
        facilitatorsPerRound: facilitatorsPerRound,
        roundFacilitators: roundFacilitators,
        roundsCount: roundsCount,
        sessionCount: +document.getElementById('fw-sc').value || 3,
        type: document.getElementById('fw-type').value || 'formal',
        badge: document.getElementById('fw-badge').value || '',
        status: document.getElementById('fw-status')?.value || 'tentative',
        contactName: document.getElementById('fw-contact-name')?.value.trim() || '',
        contactPhone: document.getElementById('fw-contact-phone')?.value.trim() || '',
        notes: document.getElementById('fw-notes').value.trim()
      });
      closeModal();
      this.render();
      _syncScreens('framework');
    } catch (err) {
      alert(err.message);
    }
  },
  async _del(id, name) {
    if (confirm(`למחוק את המסגרת "${name}"?\n\nכל השיבוצים והמפגשים שלה יימחקו. מנחים שכבר אישרו מפגשים עתידיים יקבלו מייל ביטול.`)) {
      try {
        await DB.delFramework(id);
        this.render();
        _syncScreens('framework');
      } catch (err) {
        alert(err.message);
      }
    }
  },
  _fwNameSearch(q) {
    const drop = document.getElementById('fw-name-drop');
    if (!drop) return;
    const trimmed = q.trim();
    if (!trimmed) {
      drop.style.display = 'none';
      return;
    }
    const matches = DB.getFrameworks().filter((f => f.name.includes(trimmed))).slice(0, 10);
    if (!matches.length) {
      drop.style.display = 'none';
      return;
    }
    drop.innerHTML = matches.map((f => `<div class="fw-drop-item" onclick="Frameworks._fwNamePick('${f.id}')">\n        ${f.name}${f.grade ? `<span class="fw-drop-grade">${f.grade}</span>` : ''}\n      </div>`)).join('');
    drop.style.display = 'block';
  },
  _fwNamePick(fwId) {
    const f = DB.getFrameworks().find((x => x.id === fwId));
    if (!f) return;
    const nameEl = document.getElementById('fw-name');
    const gradeEl = document.getElementById('fw-grade');
    const hoursEl = document.getElementById('fw-hours');
    const scEl = document.getElementById('fw-sc');
    const typeEl = document.getElementById('fw-type');
    const badgeEl = document.getElementById('fw-badge');
    if (nameEl) nameEl.value = f.name;
    if (gradeEl) gradeEl.value = f.grade || '';
    if (hoursEl) hoursEl.value = f.hours || '';
    if (scEl) scEl.value = f.sessionCount || 3;
    if (typeEl) typeEl.value = f.type || 'formal';
    if (badgeEl) badgeEl.value = f.badge || '';
    this._onHoursChange(f);
    const drop = document.getElementById('fw-name-drop');
    if (drop) drop.style.display = 'none';
  }
};

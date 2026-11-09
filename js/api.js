const API = {
  BASE: '',
  _token() {
    return localStorage.getItem('sbz_token') || '';
  },
  _saveToken(t) {
    localStorage.setItem('sbz_token', t);
  },
  _clearSession() {
    localStorage.removeItem('sbz_token');
    localStorage.removeItem('sbz_user');
  },
  async _fetch(method, path, body, reqOpts) {
    const headers = {
      'Content-Type': 'application/json'
    };
    const token = this._token();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const opts = {
      method: method,
      headers: headers
    };
    if (body !== undefined) opts.body = JSON.stringify(body);
    let res;
    try {
      res = await fetch(this.BASE + path, opts);
    } catch {
      throw new Error('לא ניתן להתחבר לשרת — ודא שהשרת פועל');
    }
    const data = await res.json().catch((() => ({})));
    if (res.status === 401) {
      if (path === '/api/auth/login') {
        throw new Error(data.error || 'פרטים שגויים');
      }
      if (reqOpts?.silent401) throw new Error('__silent_401__');
      this._clearSession();
      location.reload();
      return null;
    }
    if (!res.ok) throw new Error(data.error || `שגיאת שרת (${res.status})`);
    return data;
  },
  get(path, reqOpts) {
    return this._fetch('GET', path, undefined, reqOpts);
  },
  post(path, body) {
    return this._fetch('POST', path, body);
  },
  put(path, body) {
    return this._fetch('PUT', path, body);
  },
  del(path) {
    return this._fetch('DELETE', path);
  },
  mapFacilitator(r) {
    return {
      id: r.id,
      name: r.name,
      location: r.location || '',
      email: r.email || null,
      phone: r.phone || '',
      status: r.status || 'active',
      days: Array.isArray(r.days) ? r.days : JSON.parse(r.days || '[]'),
      teamPrep: !!r.team_prep,
      teamTraining: !!r.team_training,
      parentLecture: !!r.parent_lecture,
      atRisk: !!r.at_risk,
      coordination: !!r.coordination,
      isFacilitator: r.is_facilitator !== undefined ? !!r.is_facilitator : true,
      notes: r.notes || '',
      tags: Array.isArray(r.tags) ? r.tags : JSON.parse(r.tags || '[]')
    };
  },
  mapFramework(r) {
    return {
      id: r.id,
      name: r.name,
      grade: r.grade || '',
      hours: r.hours || '',
      sessionCount: r.session_count || 3,
      type: r.type || 'formal',
      badge: r.badge || '',
      contactName: r.contact_name || '',
      contactPhone: r.contact_phone || '',
      facilitatorsPerRound: r.facilitators_per_round || 1,
      roundFacilitators: Array.isArray(r.round_facilitators) ? r.round_facilitators : [],
      roundsCount: r.rounds_count || 1,
      notes: r.notes || '',
      status: r.status || 'tentative'
    };
  },
  _dateStr(v) {
    if (!v) return '';
    if (typeof v === 'string') return v.slice(0, 10);
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    return String(v).slice(0, 10);
  },
  mapAssignment(r) {
    return {
      id: r.id,
      frameworkId: r.framework_id,
      coordinatorIds: r.coordinator_ids || [],
      sessions: (r.sessions || []).map((s => ({
        date: this._dateStr(s.session_date || s.date),
        status: s.status || 'active',
        facilitatorIds: s.facilitator_ids || s.facilitatorIds || [],
        coordinatorId: s.coordinator_id || s.coordinatorId || null,
        rounds: (s.rounds || []).map((rnd => ({
          time: rnd.time_slot || rnd.time || '',
          requiredCount: rnd.required_count || rnd.requiredCount || 1,
          facilitatorIds: rnd.facilitator_ids || rnd.facilitatorIds || []
        })))
      })))
    };
  },
  mapUser(r) {
    return {
      id: r.id,
      email: r.email,
      name: r.name,
      role: r.role,
      facilitatorId: r.facilitator_id || null,
      mustSetPassword: !!r.must_set_password
    };
  },
  mapSent(r) {
    return {
      aId: r.assignment_id,
      date: this._dateStr(r.session_date),
      facId: r.facilitator_id,
      sentAt: r.sent_at
    };
  },
  mapConfirmation(r) {
    return {
      aId: r.assignment_id,
      date: this._dateStr(r.session_date),
      facId: r.facilitator_id,
      status: r.status
    };
  },
  mapIcsSent(r) {
    return {
      aId: r.assignment_id,
      date: this._dateStr(r.session_date),
      sent: !!r.sent
    };
  }
};

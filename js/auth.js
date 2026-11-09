const Auth = {
  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem('sbz_user'));
    } catch {
      return null;
    }
  },
  _saveCurrentUser(u) {
    localStorage.setItem('sbz_user', JSON.stringify(u));
  },
  isLoggedIn() {
    return !!API._token() && !!this.getCurrentUser();
  },
  isCoord() {
    return this.getCurrentUser()?.role === 'coordinator';
  },
  isFac() {
    return this.getCurrentUser()?.role === 'facilitator';
  },
  currentFacId() {
    return this.getCurrentUser()?.facilitatorId || null;
  },
  getUsers() {
    return DB._cache.users;
  },
  findByEmail(email) {
    return this.getUsers().find((x => x.email.trim().toLowerCase() === email.trim().toLowerCase())) || null;
  },
  async saveUser(u) {
    let result;
    if (!u.id) {
      result = await API.post('/api/auth/register', {
        email: u.email,
        name: u.name,
        role: u.role || 'facilitator',
        facilitator_id: u.facilitatorId || null
      });
      u = {
        ...u,
        id: result.id
      };
    } else {
      await API.put(`/api/users/${u.id}`, {
        email: u.email,
        name: u.name,
        role: u.role,
        facilitator_id: u.facilitatorId || null
      });
    }
    const mapped = API.mapUser({
      ...u,
      facilitator_id: u.facilitatorId,
      must_set_password: 0
    });
    const idx = DB._cache.users.findIndex((x => x.id === mapped.id));
    if (idx >= 0) DB._cache.users[idx] = mapped; else DB._cache.users.push(mapped);
    return mapped;
  },
  async delUser(id) {
    await API.del(`/api/users/${id}`);
    DB._cache.users = DB._cache.users.filter((u => u.id !== id));
  },
  logout() {
    API._clearSession();
    location.reload();
  },
  getSentList() {
    return DB._cache.sent;
  },
  isSent(aId, date, facId) {
    return this.getSentList().some((e => e.aId === aId && e.date === date && e.facId === facId));
  },
  async sendForConfirmation(aId, date, facId, force = false, manual = false) {
    if (!force && this.isSent(aId, date, facId)) return {
      alreadySent: true
    };
    const res = await API.post(`/api/send-confirmation/${aId}/${date}/${facId}`, manual ? {
      manual: true
    } : undefined);
    if (res?.marked && !this.isSent(aId, date, facId)) DB._cache.sent.push({
      aId: aId,
      date: date,
      facId: facId,
      sentAt: (new Date).toISOString()
    });
    return res;
  },
  async sendAllInAssignment(aId, facId, manual = false) {
    const res = await API.post(`/api/send-confirmation/${aId}/series/${facId}`, manual ? {
      manual: true
    } : undefined);
    const a = DB.getAssignments().find((x => x.id === aId));
    if (a && res?.marked) {
      (a.sessions || []).forEach((s => {
        if ((s.facilitatorIds || []).includes(facId) && !this.isSent(aId, s.date, facId)) {
          DB._cache.sent.push({
            aId: aId,
            date: s.date,
            facId: facId,
            sentAt: (new Date).toISOString()
          });
        }
      }));
    }
    return res;
  },
  async sendAllForFacAndMonth(facId, ym) {
    const [year, month] = ym.split('-').map(Number);
    const res = await API.post(`/api/send-confirmation/month/${facId}`, {
      year: year,
      month: month
    });
    DB.getAssignments().forEach((a => {
      (a.sessions || []).forEach((s => {
        if (s.date.startsWith(ym) && (s.facilitatorIds || []).includes(facId)) {
          if (!this.isSent(a.id, s.date, facId)) DB._cache.sent.push({
            aId: a.id,
            date: s.date,
            facId: facId,
            sentAt: (new Date).toISOString()
          });
        }
      }));
    }));
    return res;
  },
  async sendAllForMonth(ym, onProgress) {
    const [year, month] = ym.split('-').map(Number);
    const facsSeen = new Set;
    DB.getAssignments().forEach((a => {
      (a.sessions || []).forEach((s => {
        if (!s.date.startsWith(ym)) return;
        (s.facilitatorIds || []).forEach((fid => facsSeen.add(fid)));
      }));
    }));
    const facIds = [ ...facsSeen ];
    const nameOf = fid => DB.getFacilitators().find((f => f.id === fid))?.name || fid;
    let count = 0, sentFacs = 0;
    const emailFails = [];
    for (let i = 0; i < facIds.length; i++) {
      const fid = facIds[i];
      if (onProgress) onProgress(i, facIds.length, nameOf(fid));
      let res;
      try {
        res = await API.post(`/api/send-confirmation/month/${fid}`, {
          year: year,
          month: month
        });
      } catch (err) {
        emailFails.push({
          facId: fid,
          facName: nameOf(fid),
          error: 'שגיאת תקשורת — הבקשה לא נשלחה ולא נרשמה'
        });
        continue;
      }
      if (res && res.count > 0 && !res.email_sent) {
        emailFails.push({
          facId: fid,
          facName: nameOf(fid),
          error: res.email_error
        });
      } else if (res && res.count > 0) {
        count += res.count;
        sentFacs++;
      }
    }
    if (onProgress) onProgress(facIds.length, facIds.length, '');
    await DB.reloadConfirmations().catch((() => {}));
    return {
      count: count,
      facCount: sentFacs,
      emailFails: emailFails
    };
  },
  getConfirmations() {
    return DB._cache.confirmations;
  },
  getConfirmation(aId, date, facId) {
    return this.getConfirmations().find((c => c.aId === aId && c.date === date && c.facId === facId)) || null;
  },
  setConfirmation(aId, date, facId, status) {
    const endpoint = status === 'confirmed' ? `/api/confirmations/${aId}/${date}/confirm` : `/api/confirmations/${aId}/${date}/decline`;
    API.post(endpoint).then((() => {
      DB._cache.confirmations = DB._cache.confirmations.filter((c => !(c.aId === aId && c.date === date && c.facId === facId)));
      if (status) DB._cache.confirmations.push({
        aId: aId,
        date: date,
        facId: facId,
        status: status
      });
    })).catch((err => console.error('setConfirmation:', err)));
  },
  isIcsSent(aId, date) {
    return DB._cache.icsSent.some((e => e.aId === aId && e.date === date && e.sent));
  },
  markIcsSent(aId, date) {
    DB._cache.icsSent = DB._cache.icsSent.filter((e => !(e.aId === aId && e.date === date)));
    DB._cache.icsSent.push({
      aId: aId,
      date: date,
      sent: true
    });
  },
  async confirmSeries(aId) {
    await this._respondSeries(aId, 'confirm');
  },
  async declineSeries(aId) {
    await this._respondSeries(aId, 'decline');
  },
  async _respondSeries(aId, action) {
    if (!this.currentFacId()) return;
    try {
      const res = await API.post(`/api/confirmations/${aId}/series/${action}`);
      await DB.reloadConfirmations();
      closeModal();
      Calendar.render();
      Facilitators.render();
      if (!res.count) alert('אין מפגשים לאישור — ייתכן שהשיבוץ עודכן בינתיים');
    } catch (err) {
      alert(err.message);
    }
  },
  _doLogin(e) {
    e.preventDefault();
    const email = (document.getElementById('login-email')?.value || '').trim();
    const errEl = document.getElementById('login-err');
    if (errEl) {
      errEl.textContent = '';
      errEl.style.display = 'none';
    }
    API.post('/api/auth/login', {
      email: email
    }).then((async result => {
      if (!result) return;
      API._saveToken(result.token);
      const user = API.mapUser(result.user);
      this._saveCurrentUser(user);
      document.getElementById('login-overlay').style.display = 'none';
      document.body.classList.remove('app-locked');
      await DB.init();
      _appInit();
    })).catch((err => {
      if (errEl) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
      }
    }));
  }
};

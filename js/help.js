const Help = {
  history: [],
  loaded: false,
  busy: false,
  mount() {
    if (this.panel || !Auth.isCoord()) return;
    const fab = document.createElement('button');
    fab.className = 'help-fab';
    fab.type = 'button';
    fab.title = 'עזרה';
    fab.textContent = '?';
    fab.onclick = () => this.toggle();
    const panel = document.createElement('div');
    panel.className = 'help-panel';
    panel.hidden = true;
    panel.innerHTML = `\n      <div class="help-head">\n        <span>עזרה — איך עושים את זה?</span>\n        <button type="button" class="help-close" title="סגור">×</button>\n      </div>\n      <div class="help-msgs" id="help-msgs"></div>\n      <button type="button" class="help-faq-toggle" id="help-faq-toggle" hidden>שאלות נפוצות ▾</button>\n      <div class="help-faq" id="help-faq" hidden></div>\n      <form class="help-form" id="help-form">\n        <input id="help-input" class="form-control" maxlength="500" autocomplete="off"\n          placeholder="שאלו על כפתור או פעולה במערכת...">\n        <button type="submit" class="btn btn-primary btn-sm">שלח</button>\n      </form>\n      <div class="help-note" id="help-note">גרסת הדגמה: התשובות מגיעות ממדריך המערכת (ללא AI). במערכת המלאה עונה עוזר AI.</div>`;
    panel.querySelector('.help-close').onclick = () => this.toggle(false);
    panel.querySelector('#help-faq-toggle').onclick = () => this.toggleFaq();
    panel.querySelector('#help-form').onsubmit = e => {
      e.preventDefault();
      const inp = document.getElementById('help-input');
      const q = inp.value.trim();
      if (q) {
        inp.value = '';
        this.ask(q);
      }
    };
    document.body.append(fab, panel);
    this.panel = panel;
  },
  toggle(force) {
    const open = force ?? this.panel.hidden;
    this.panel.hidden = !open;
    if (open) {
      if (!this.loaded) this.loadFaq();
      document.getElementById('help-input').focus();
    }
  },
  async loadFaq() {
    this.loaded = true;
    try {
      const data = await API.get('/api/help/faq');
      const box = document.getElementById('help-faq');
      box.replaceChildren(...data.questions.map((q => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'help-chip';
        b.textContent = q;
        b.onclick = () => {
          this.toggleFaq(false);
          this.ask(q);
        };
        return b;
      })));
      document.getElementById('help-faq-toggle').hidden = !data.questions.length;
      if (!data.ai_enabled) {
        document.getElementById('help-note').textContent = 'כרגע ניתן לבחור רק מהשאלות המוצעות.';
      }
    } catch {
      this.loaded = false;
    }
  },
  toggleFaq(force) {
    const box = document.getElementById('help-faq');
    const open = force ?? box.hidden;
    box.hidden = !open;
    document.getElementById('help-faq-toggle').textContent = open ? 'שאלות נפוצות ▴' : 'שאלות נפוצות ▾';
  },
  _add(cls, text) {
    const box = document.getElementById('help-msgs');
    const div = document.createElement('div');
    div.className = 'help-msg ' + cls;
    div.textContent = text;
    box.append(div);
    box.scrollTop = box.scrollHeight;
    return div;
  },
  async ask(q) {
    if (this.busy) return;
    this.busy = true;
    this._add('help-user', q);
    const pending = this._add('help-bot help-wait', '...');
    try {
      const res = await API.post('/api/help/chat', {
        question: q,
        history: this.history
      });
      pending.textContent = res.answer;
      pending.classList.remove('help-wait');
      this.history.push({
        q: q,
        a: res.answer
      });
      this.history = this.history.slice(-6);
    } catch (err) {
      pending.textContent = err.message;
      pending.className = 'help-msg help-bot help-err';
    } finally {
      this.busy = false;
    }
  }
};

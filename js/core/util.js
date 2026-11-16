/* TRADE MASTERY — shared utilities, DOM helpers, event bus, modals, toasts, sound */
window.TM = window.TM || {};
TM.Views = TM.Views || {};
(function () {
  'use strict';
  const U = (TM.U = {});

  /* ---------- random ---------- */
  U.rng = function (seed) {
    let a = (seed >>> 0) || 1;
    const f = function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    f.state = () => a;
    return f;
  };
  U.gauss = function (r) {
    let u = 0;
    while (!u) u = r();
    const v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  U.pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];
  U.shuffle = function (arr, r = Math.random) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  U.seed = () => Math.floor(Math.random() * 2 ** 31);

  /* ---------- math / formatting ---------- */
  U.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  U.round = (v, d = 2) => {
    const m = 10 ** d;
    return Math.round(v * m) / m;
  };
  U.decFor = (p) => (p >= 1000 ? 2 : p >= 10 ? 2 : p >= 1 ? 3 : p >= 0.1 ? 4 : 5);
  U.num = (n, d = 2) =>
    Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  U.money = (n, d = 2) => (n < 0 ? '-' : '') + '$' + U.num(Math.abs(n), d);
  U.smoney = (n, d = 2) => (n > 0 ? '+' : n < 0 ? '-' : '') + '$' + U.num(Math.abs(n), d);
  U.price = (p, d) => U.num(p, d == null ? U.decFor(p) : d);
  U.pct = (n, d = 2) => (n > 0 ? '+' : '') + n.toFixed(d) + '%';
  U.big = function (n) {
    const a = Math.abs(n);
    if (a >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
    if (a >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (a >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    if (a >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + n.toFixed(0);
  };
  U.bigN = function (n) {
    const a = Math.abs(n);
    if (a >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (a >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (a >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return String(Math.round(n));
  };
  U.cls = (v) => (v > 0 ? 'up' : v < 0 ? 'down' : '');
  U.esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- time (all sim times are formatted in UTC and labelled ET/UTC by the caller) ---------- */
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  U.hm = (t) => {
    const d = new Date(t * 1000);
    return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0');
  };
  U.md = (t) => {
    const d = new Date(t * 1000);
    return MON[d.getUTCMonth()] + ' ' + d.getUTCDate();
  };
  U.dow = (t) => DOW[new Date(t * 1000).getUTCDay()];
  U.dateTime = (ms) => {
    const d = new Date(ms);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };
  U.dayKey = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

  /* ---------- DOM ---------- */
  U.$ = (sel, root = document) => root.querySelector(sel);
  U.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  U.el = function (html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };
  U.on = function (root, evt, sel, fn) {
    root.addEventListener(evt, (e) => {
      const t = e.target.closest(sel);
      if (t && root.contains(t)) fn(e, t);
    });
  };
  U.debounce = function (fn, ms) {
    let id;
    return function (...a) {
      clearTimeout(id);
      id = setTimeout(() => fn.apply(this, a), ms);
    };
  };
  U.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  /* ---------- event bus ---------- */
  const handlers = {};
  TM.bus = {
    on(evt, fn) {
      (handlers[evt] = handlers[evt] || []).push(fn);
      return () => TM.bus.off(evt, fn);
    },
    off(evt, fn) {
      handlers[evt] = (handlers[evt] || []).filter((f) => f !== fn);
    },
    emit(evt, data) {
      (handlers[evt] || []).slice().forEach((f) => {
        try {
          f(data);
        } catch (e) {
          console.error('bus handler error', evt, e);
        }
      });
    },
  };

  /* ---------- toasts ---------- */
  U.toast = function (msg, type = 'info', opts = {}) {
    const root = document.getElementById('toasts');
    if (!root) return;
    const t = U.el(`<div class="toast toast-${type}" role="status"><div class="toast-msg">${msg}</div></div>`);
    if (opts.action) {
      const b = U.el(`<button class="btn btn-sm btn-ghost">${U.esc(opts.action.label)}</button>`);
      b.onclick = () => {
        opts.action.fn();
        t.remove();
      };
      t.appendChild(b);
    }
    root.appendChild(t);
    // keep the stack short so toasts never bury the page
    while (root.children.length > 4) root.firstElementChild.remove();
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => t.remove(), 300);
    }, opts.ms || 3200);
  };

  /* ---------- modal ---------- */
  const stack = [];
  U.modal = function ({ title = '', body = '', actions = [], wide = false, onClose, dismissable = true, cls = '' }) {
    const root = document.getElementById('modal-root');
    const wrap = U.el(`<div class="modal-wrap"><div class="modal ${wide ? 'modal-wide' : ''} ${cls}" role="dialog" aria-modal="true">
      <div class="modal-head"><h3>${title}</h3>${dismissable ? '<button class="icon-btn modal-x" aria-label="Close">✕</button>' : ''}</div>
      <div class="modal-body"></div><div class="modal-foot"></div></div></div>`);
    const bodyEl = wrap.querySelector('.modal-body');
    if (typeof body === 'string') bodyEl.innerHTML = body;
    else if (body) bodyEl.appendChild(body);
    const foot = wrap.querySelector('.modal-foot');
    let closed = false;
    const api = {
      el: wrap,
      body: bodyEl,
      close() {
        if (closed) return;
        closed = true;
        wrap.classList.remove('show');
        setTimeout(() => wrap.remove(), 200);
        const i = stack.indexOf(api);
        if (i >= 0) stack.splice(i, 1);
        onClose && onClose();
      },
    };
    actions.forEach((a) => {
      const b = U.el(`<button class="btn ${a.cls || ''}">${a.label}</button>`);
      b.onclick = () => {
        const r = a.onClick ? a.onClick(api) : undefined;
        if (r !== false && a.close !== false) api.close();
      };
      foot.appendChild(b);
    });
    if (!actions.length) foot.remove();
    if (dismissable) {
      wrap.querySelector('.modal-x').onclick = () => api.close();
      wrap.addEventListener('mousedown', (e) => {
        if (e.target === wrap) api.close();
      });
    }
    root.appendChild(wrap);
    stack.push(api);
    requestAnimationFrame(() => wrap.classList.add('show'));
    return api;
  };
  U.closeTopModal = () => {
    const m = stack[stack.length - 1];
    if (m) m.close();
  };
  U.confirm = function (title, text, okLabel, onOk, danger) {
    return U.modal({
      title,
      body: `<p>${text}</p>`,
      actions: [
        { label: 'Cancel', cls: 'btn-ghost' },
        { label: okLabel || 'Confirm', cls: danger ? 'btn-sell' : 'btn-primary', onClick: onOk },
      ],
    });
  };

  /* ---------- sound (tiny WebAudio blips, only after user interaction) ---------- */
  let actx = null;
  U.sound = function (type) {
    try {
      if (!TM.Store || !TM.Store.s.settings.sound) return;
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const map = { fill: [660, 0.06], win: [880, 0.12], loss: [220, 0.14], xp: [990, 0.08], click: [440, 0.03], level: [523, 0.3], error: [160, 0.12] };
      const [f, d] = map[type] || map.click;
      const o = actx.createOscillator();
      const g = actx.createGain();
      o.type = type === 'loss' || type === 'error' ? 'sawtooth' : 'sine';
      o.frequency.value = f;
      if (type === 'level' || type === 'win') o.frequency.linearRampToValueAtTime(f * 1.5, actx.currentTime + d);
      g.gain.value = 0.05;
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + d);
      o.connect(g).connect(actx.destination);
      o.start();
      o.stop(actx.currentTime + d);
    } catch (e) {
      /* audio not available */
    }
  };

  /* ---------- mini sparkline/line chart on canvas ---------- */
  U.lineChart = function (canvas, values, opts = {}) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 300;
    const h = canvas.clientHeight || 120;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const c = canvas.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w, h);
    if (!values || values.length < 2) {
      c.fillStyle = '#5d6778';
      c.font = '12px Inter, sans-serif';
      c.textAlign = 'center';
      c.fillText(opts.empty || 'Not enough data yet', w / 2, h / 2);
      return;
    }
    const padL = opts.axis ? 58 : 4,
      padR = 6,
      padT = 8,
      padB = opts.axis ? 18 : 4;
    let mn = Math.min(...values),
      mx = Math.max(...values);
    if (opts.baseline != null) {
      mn = Math.min(mn, opts.baseline);
      mx = Math.max(mx, opts.baseline);
    }
    if (mx === mn) {
      mx += 1;
      mn -= 1;
    }
    const pad = (mx - mn) * 0.08;
    mn -= pad;
    mx += pad;
    const X = (i) => padL + (i / (values.length - 1)) * (w - padL - padR);
    const Y = (v) => padT + (1 - (v - mn) / (mx - mn)) * (h - padT - padB);
    if (opts.axis) {
      c.strokeStyle = '#1f2632';
      c.fillStyle = '#6b7586';
      c.font = '10px "JetBrains Mono", monospace';
      c.textAlign = 'right';
      for (let k = 0; k <= 4; k++) {
        const v = mn + ((mx - mn) * k) / 4;
        const y = Y(v);
        c.beginPath();
        c.moveTo(padL, y);
        c.lineTo(w - padR, y);
        c.stroke();
        c.fillText(opts.fmt ? opts.fmt(v) : v.toFixed(0), padL - 6, y + 3);
      }
    }
    const last = values[values.length - 1];
    const base = opts.baseline != null ? opts.baseline : values[0];
    const col = opts.color || (last >= base ? '#16c784' : '#f0465a');
    if (opts.baseline != null) {
      c.setLineDash([4, 4]);
      c.strokeStyle = '#3a4456';
      c.beginPath();
      c.moveTo(padL, Y(opts.baseline));
      c.lineTo(w - padR, Y(opts.baseline));
      c.stroke();
      c.setLineDash([]);
    }
    const grad = c.createLinearGradient(0, padT, 0, h);
    grad.addColorStop(0, col + '55');
    grad.addColorStop(1, col + '00');
    c.beginPath();
    values.forEach((v, i) => (i ? c.lineTo(X(i), Y(v)) : c.moveTo(X(i), Y(v))));
    c.lineTo(X(values.length - 1), h - padB);
    c.lineTo(X(0), h - padB);
    c.closePath();
    c.fillStyle = grad;
    c.fill();
    c.beginPath();
    values.forEach((v, i) => (i ? c.lineTo(X(i), Y(v)) : c.moveTo(X(i), Y(v))));
    c.strokeStyle = col;
    c.lineWidth = 1.6;
    c.stroke();
    c.beginPath();
    c.arc(X(values.length - 1), Y(last), 3, 0, Math.PI * 2);
    c.fillStyle = col;
    c.fill();
  };

  U.barChart = function (canvas, values, opts = {}) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 300;
    const h = canvas.clientHeight || 120;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const c = canvas.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w, h);
    if (!values.length) {
      c.fillStyle = '#5d6778';
      c.font = '12px Inter, sans-serif';
      c.textAlign = 'center';
      c.fillText(opts.empty || 'No trades yet', w / 2, h / 2);
      return;
    }
    const mx = Math.max(1, ...values.map(Math.abs));
    const mid = h / 2;
    const bw = Math.max(2, Math.min(22, (w - 8) / values.length - 2));
    c.strokeStyle = '#2d3746';
    c.beginPath();
    c.moveTo(0, mid);
    c.lineTo(w, mid);
    c.stroke();
    values.forEach((v, i) => {
      const x = 4 + i * (bw + 2);
      const bh = (Math.abs(v) / mx) * (h / 2 - 6);
      c.fillStyle = v >= 0 ? '#16c784' : '#f0465a';
      c.fillRect(x, v >= 0 ? mid - bh : mid, bw, Math.max(1, bh));
    });
  };
})();

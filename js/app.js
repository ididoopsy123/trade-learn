/* TRADE MASTERY — app shell: navigation, router, top bar, global market loop, settings, onboarding */
(function () {
  'use strict';
  const U = TM.U;
  const S = () => TM.Store.s;

  const NAV = [
    { id: 'home', icon: '◧', label: 'Dashboard' },
    { id: 'academy', icon: '🎓', label: 'Trading Academy', n: 1 },
    { id: 'practice', icon: '📈', label: 'Practice Trading', n: 2 },
    { id: 'day', icon: '⚡', label: 'Day Trading Sim', n: 3 },
    { id: 'swing', icon: '🌊', label: 'Swing Trading Sim', n: 4 },
    { id: 'crypto', icon: '🪙', label: 'Crypto Trading', n: 5 },
    { id: 'scenarios', icon: '🎬', label: 'Market Scenarios' },
    { id: 'portfolio', icon: '💼', label: 'Portfolio & Stats', n: 6 },
    { id: 'challenges', icon: '🏁', label: 'Trading Challenges', n: 7 },
    { id: 'achievements', icon: '🏅', label: 'Achievements', n: 8 },
    { id: 'journal', icon: '📓', label: 'Trading Journal', n: 9 },
    { id: 'tests', icon: '🧠', label: 'Knowledge Tests', n: 10 },
  ];
  TM.NAV = NAV;
  TM.Views = TM.Views || {};
  let current = null;
  let currentId = '';

  /* ---------------- price helpers for the main account ---------------- */
  TM.mainPrice = (sym) => TM.Live.price(sym);
  TM.mainEquity = () => TM.Trading.equity(S().account, TM.mainPrice);

  /* ---------------- global market loop ---------------- */
  let lastSample = 0;
  function processMain() {
    const acct = S().account;
    if (!acct.positions.length && !acct.orders.length) return;
    const eq = TM.mainEquity();
    TM.Live.ASSETS.forEach((d) => {
      const p = TM.Live.price(d.sym);
      const bar = { h: p, l: p, c: p, o: p };
      if (acct.orders.some((o) => o.sym === d.sym)) {
        const filled = TM.Trading.fillOrders(acct, d.sym, bar, (o) => ({
          sym: o.sym,
          side: o.side,
          qty: o.qty,
          entry: o.limit,
          stop: o.stop,
          target: o.target,
          lev: o.lev,
          mode: o.mode,
          feeRate: o.feeRate,
          equity: eq,
          ctx: TM.Market.context(TM.Live.series(o.sym, '1m')),
          t: TM.Live.simT,
        }));
        filled.forEach((p2) => {
          U.toast(`Limit order filled: ${p2.side.toUpperCase()} ${U.num(p2.qty, p2.qty % 1 ? 4 : 0)} ${p2.sym} @ ${U.price(p2.entry)}`, 'good');
          U.sound('fill');
        });
      }
      if (acct.positions.some((x) => x.sym === d.sym)) {
        const closed = TM.Trading.process(acct, d.sym, bar, { t: TM.Live.simT });
        closed.forEach((t) => TM.Progress.afterTrade(t, { silent: true }));
      }
    });
  }
  function fundingCheck(prevT) {
    const now = TM.Live.simT;
    if (Math.floor(prevT / 28800) === Math.floor(now / 28800)) return;
    const acct = S().account;
    let total = 0;
    acct.positions
      .filter((p) => p.mode === 'crypto' && p.lev > 1)
      .forEach((p) => {
        const rate = TM.Live.funding(p.sym);
        const fee = p.qty * TM.Live.price(p.sym) * rate * (p.side === 'long' ? 1 : -1);
        p.funding = (p.funding || 0) + fee;
        total += fee;
      });
    if (total) U.toast(`Funding settled on leveraged crypto: <b class="${U.cls(-total)}">${U.smoney(-total)}</b>`, total > 0 ? 'bad' : 'good');
  }
  function stormCheck() {
    const m = S().market;
    if (!m.storm) return;
    if (S().account.positions.some((p) => p.mode === 'crypto' && p.lev > 1)) m.storm.engaged = true;
    if (m.ticks >= m.storm.end) {
      TM.Live.storm(false);
      const survived = m.storm.engaged && S().counters.liquidations === m.storm.liq;
      if (survived) {
        TM.Store.inc('stormsSurvived');
        U.toast('🌪️ The volatility storm is over — you survived <b>without liquidation</b>!', 'good', { ms: 6000 });
        TM.Coach.say('Storm survived. Notice how lower leverage and real stops kept you alive while price whipped around.');
      } else if (!m.storm.engaged) U.toast('🌪️ The storm has passed. Trade with leverage during a storm to complete the Crypto Survivor challenge.', 'info', { ms: 6000 });
      else U.toast('🌪️ The storm has passed. You were liquidated during it — lower your leverage next time.', 'bad', { ms: 6000 });
      m.storm = null;
      TM.Progress.checkAchievements();
      TM.Store.save();
      TM.bus.emit('storm');
    }
  }
  function loop() {
    const sp = S().settings.speed;
    if (sp > 0 && TM.Live.ready) {
      for (let k = 0; k < sp; k++) {
        const prevT = TM.Live.simT;
        TM.Live.tick();
        processMain();
        fundingCheck(prevT);
        stormCheck();
      }
      TM.bus.emit('tick');
    }
    const now = Date.now();
    if (now - lastSample > 2000) {
      lastSample = now;
      TM.Trading.sampleEquity(S().account, TM.mainEquity());
      TM.Live.remember();
      updateTop();
      TM.Store.save();
    }
  }

  /* ---------------- top bar ---------------- */
  function updateTop() {
    const s = S();
    const r = TM.Progress.rank();
    const lp = TM.Progress.levelProgress();
    const nr = TM.Progress.nextRank();
    const el = document.getElementById('top-stats');
    if (!el) return;
    const eq = TM.mainEquity();
    const pnl = eq - s.account.start;
    el.innerHTML = `
      <a class="tchip rank-chip" href="#achievements" title="${r.name} — ${nr ? nr.xp - s.xp + ' XP to ' + nr.name : 'Top rank'}"><span>${r.icon}</span><span class="rc-t"><b>${r.name}</b><span class="xpbar"><i style="width:${lp.pct.toFixed(1)}%"></i></span></span><span class="mono xp">${s.xp} XP</span></a>
      <a class="tchip bal-chip" href="#portfolio" title="Simulated account equity"><span class="muted small">SIM equity</span><b class="mono">${U.money(eq)}</b><span class="mono small ${U.cls(pnl)}">${U.smoney(pnl, 0)}</span></a>`;
    const badge = (id, n) => {
      const b = document.querySelector(`.nav a[data-id="${id}"] .nbadge`);
      if (b) {
        b.textContent = n;
        b.hidden = !n;
      }
    };
    badge('challenges', TM.Progress.unclaimed());
    badge('journal', TM.JournalUI ? TM.JournalUI.pending().length : 0);
  }
  TM.updateTop = updateTop;

  function buildShell() {
    const side = document.getElementById('side');
    side.innerHTML = `
      <a class="logo" href="#home"><span class="logo-mark"><svg viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="12" width="5" height="12" rx="1" fill="#f0465a"/><line x1="7.5" y1="8" x2="7.5" y2="28" stroke="#f0465a" stroke-width="1.6"/><rect x="14" y="7" width="5" height="14" rx="1" fill="#16c784"/><line x1="16.5" y1="3" x2="16.5" y2="25" stroke="#16c784" stroke-width="1.6"/><rect x="23" y="4" width="5" height="10" rx="1" fill="#16c784"/><line x1="25.5" y1="1" x2="25.5" y2="18" stroke="#16c784" stroke-width="1.6"/></svg></span><span class="logo-t">TRADE<b>MASTERY</b></span></a>
      <nav class="nav">${NAV.map((n) => `<a href="#${n.id}" data-id="${n.id}"><span class="nic">${n.icon}</span><span class="nl">${n.label}</span><span class="nbadge" hidden>0</span></a>`).join('')}</nav>
      <div class="side-foot">
        <button class="btn btn-ghost btn-sm" id="open-settings">⚙ Settings & reset</button>
        <p class="tiny muted">All prices, accounts and trades are <b>simulated</b>. No real money. Educational only — not financial advice.</p>
      </div>`;
    document.getElementById('open-settings').onclick = settings;
    const top = document.getElementById('top');
    top.innerHTML = `<button class="icon-btn burger" aria-label="Open menu">☰</button><h1 id="page-title">Dashboard</h1><div class="sim-badge" title="Prices are generated by a market simulator">● SIMULATED MARKET</div><div id="top-stats"></div><button class="icon-btn" id="top-settings" aria-label="Settings">⚙</button>`;
    U.$('.burger', top).onclick = () => document.body.classList.toggle('nav-open');
    U.$('#top-settings', top).onclick = settings;
    document.getElementById('scrim').onclick = () => document.body.classList.remove('nav-open');
  }

  /* ---------------- router ---------------- */
  function route() {
    const h = (location.hash || '#home').slice(1);
    let id = h,
      param = null;
    const m = h.match(/^(lesson|test|scenario)-(.+)$/);
    if (m) {
      id = { lesson: 'lesson', test: 'tests', scenario: 'scenarios' }[m[1]];
      param = m[2];
    }
    if (!TM.Views[id]) {
      id = 'home';
      param = null;
    }
    if (current && current.destroy) {
      try {
        current.destroy();
      } catch (e) {
        console.error(e);
      }
    }
    current = null;
    document.body.classList.remove('nav-open');
    // fresh container per page so event listeners from the previous page never leak or stack
    const old = document.getElementById('view');
    const view = old.cloneNode(false);
    old.replaceWith(view);
    view.className = 'view view-' + id;
    view.scrollTop = 0;
    window.scrollTo(0, 0);
    const navId = id === 'lesson' ? 'academy' : id;
    U.$$('.nav a').forEach((a) => a.classList.toggle('on', a.dataset.id === navId));
    const nav = NAV.find((n) => n.id === navId);
    document.getElementById('page-title').textContent = nav ? nav.label : 'Trade Mastery';
    TM.Coach.setContext({ view: id, hint: null, label: nav ? nav.label : '' });
    currentId = id;
    try {
      current = TM.Views[id](view, param) || null;
    } catch (e) {
      console.error(e);
      view.innerHTML = `<div class="card"><h3>Something went wrong</h3><p class="muted">${U.esc(e.message)}</p><a class="btn" href="#home">Back to dashboard</a></div>`;
    }
    updateTop();
  }
  TM.route = route;

  /* ---------------- settings ---------------- */
  function settings() {
    const s = S();
    const body = U.el(`<div class="settings">
      <label class="fld">Your trader name<input id="set-name" value="${U.esc(s.name)}" maxlength="24"></label>
      <div class="set-row"><span>Sound effects</span><label class="sw"><input type="checkbox" id="set-sound" ${s.settings.sound ? 'checked' : ''}><i></i></label></div>
      <div class="set-row"><span>Coach hints during simulations</span><label class="sw"><input type="checkbox" id="set-hints" ${s.settings.hints ? 'checked' : ''}><i></i></label></div>
      <div class="set-row"><span>Reduce motion</span><label class="sw"><input type="checkbox" id="set-motion" ${s.settings.reduceMotion ? 'checked' : ''}><i></i></label></div>
      <div class="set-row"><span>Unlock all Academy levels <small class="muted">(for experienced traders)</small></span><label class="sw"><input type="checkbox" id="set-unlock" ${s.settings.unlockAll ? 'checked' : ''}><i></i></label></div>
      <div class="set-row"><span>Practice market speed</span><div class="seg seg-sm" id="set-speed">${[0, 1, 2, 5].map((v) => `<button data-v="${v}" class="${s.settings.speed === v ? 'on' : ''}">${v ? v + '×' : '⏸'}</button>`).join('')}</div></div>
      <h4>Save data</h4>
      <p class="muted small">${TM.Store.storageOk() ? 'Progress is saved automatically in this browser.' : '⚠️ Browser storage is blocked here, so progress will not survive a refresh. Use Export to keep a copy.'}</p>
      <div class="btn-row"><button class="btn btn-ghost" id="set-export">Export progress</button><label class="btn btn-ghost">Import progress<input type="file" id="set-import" accept=".json,application/json" hidden></label></div>
      <textarea id="set-export-box" class="mono small" rows="3" hidden readonly></textarea>
      <h4>Reset</h4>
      <div class="danger-zone">
        <div><b>Reset trading account</b><p class="muted small">Back to $10,000, closes all positions and simulator sessions. Keeps XP, lessons, journal and history.</p><button class="btn btn-sell btn-sm" id="set-reset-acct">Reset account</button></div>
        <div><b>Reset everything</b><p class="muted small">Erases all progress, XP, achievements, journal and trades.</p><button class="btn btn-sell btn-sm" id="set-reset-all">Reset everything</button></div>
      </div>
      <div class="confirm-box" hidden></div>
    </div>`);
    const md = U.modal({ title: 'Settings', body, actions: [{ label: 'Done', cls: 'btn-primary' }], onClose: () => route() });
    const $ = (id) => body.querySelector('#' + id);
    $('set-name').oninput = (e) => {
      s.name = e.target.value.trim();
      TM.Store.save();
    };
    $('set-sound').onchange = (e) => ((s.settings.sound = e.target.checked), TM.Store.save());
    $('set-hints').onchange = (e) => ((s.settings.hints = e.target.checked), TM.Store.save());
    $('set-motion').onchange = (e) => {
      s.settings.reduceMotion = e.target.checked;
      document.body.classList.toggle('reduce-motion', e.target.checked);
      TM.Store.save();
    };
    $('set-unlock').onchange = (e) => ((s.settings.unlockAll = e.target.checked), TM.Store.save());
    U.on($('set-speed'), 'click', 'button', (e, b) => {
      s.settings.speed = +b.dataset.v;
      U.$$('button', $('set-speed')).forEach((x) => x.classList.toggle('on', x === b));
      TM.Store.save();
      TM.bus.emit('speed');
    });
    $('set-export').onclick = () => {
      const box = $('set-export-box');
      box.hidden = false;
      box.value = TM.Store.exportData();
      box.select();
      const done = () => U.toast('Save data copied. Paste it into a .json file to keep it.', 'good');
      try {
        navigator.clipboard.writeText(box.value).then(done, () => U.toast('Select the text in the box and copy it manually.', 'info'));
      } catch (e) {
        U.toast('Select the text in the box and copy it manually.', 'info');
      }
    };
    $('set-import').onchange = (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        try {
          TM.Store.importData(rd.result);
          U.toast('Progress imported.', 'good');
          location.reload();
        } catch (err) {
          U.toast(err.message || 'Could not import that file.', 'bad');
        }
      };
      rd.readAsText(f);
    };
    const confirmBox = body.querySelector('.confirm-box');
    const ask = (text, fn) => {
      confirmBox.hidden = false;
      confirmBox.innerHTML = `<p>${text}</p><div class="btn-row"><button class="btn btn-ghost btn-sm" data-a="no">Cancel</button><button class="btn btn-sell btn-sm" data-a="yes">Yes, reset</button></div>`;
      confirmBox.querySelector('[data-a=no]').onclick = () => (confirmBox.hidden = true);
      confirmBox.querySelector('[data-a=yes]').onclick = fn;
      confirmBox.scrollIntoView({ block: 'nearest' });
    };
    $('set-reset-acct').onclick = () =>
      ask('Reset your simulated trading account to $10,000? Open positions will be discarded.', () => {
        TM.Store.resetAccount();
        TM.Live.init();
        md.close();
        U.toast('Account reset to $10,000.', 'good');
      });
    $('set-reset-all').onclick = () =>
      ask('Erase ALL progress? This cannot be undone.', () => {
        TM.Store.resetAll();
        location.hash = '#home';
        location.reload();
      });
  }
  TM.openSettings = settings;

  /* ---------------- onboarding ---------------- */
  function onboarding() {
    const body = U.el(`<div class="onb">
      <div class="onb-hero"><div class="onb-candles"><i></i><i></i><i></i><i></i><i></i><i></i></div><h2>Welcome to <span>TRADE MASTERY</span></h2><p>You start with <b>$10,000 of simulated money</b> and zero experience. Learn how markets really work, practise on realistic simulated charts, and build the discipline to trade well — before you ever risk real money.</p></div>
      <div class="onb-grid"><div>🎓<b>Learn</b><span>34 interactive lessons across 7 levels + a crypto track</span></div><div>📈<b>Practise</b><span>Paper trade stocks & crypto, day & swing simulators</span></div><div>🛡️<b>Discipline</b><span>XP rewards good process — even on losing trades</span></div></div>
      <label class="fld">What should Coach Nova call you?<input id="onb-name" maxlength="24" placeholder="Your name (optional)"></label>
      <p class="tiny muted">Everything here is simulated and for education only. Nothing is financial advice, and no real trades are ever placed.</p>
    </div>`);
    U.modal({
      title: '',
      body,
      cls: 'modal-onb',
      dismissable: false,
      actions: [
        {
          label: 'Start Level 1 →',
          cls: 'btn-primary btn-lg',
          onClick: () => {
            S().name = body.querySelector('#onb-name').value.trim();
            S().onboarded = true;
            TM.Store.saveNow();
            location.hash = '#lesson-1-1';
            TM.Coach.say(`Welcome${S().name ? ', ' + U.esc(S().name) : ''}! Start with Lesson 1.1. Tap <b>💡 Hint</b> any time you are stuck on an exercise.`);
          },
        },
      ],
    });
  }

  /* ---------------- dashboard ---------------- */
  TM.Views.home = function (el) {
    const s = S();
    const r = TM.Progress.rank();
    const lp = TM.Progress.levelProgress();
    const nr = TM.Progress.nextRank();
    const next = TM.Lessons.next();
    const d = TM.Progress.daily();
    const st = TM.Trading.stats(s.trades);
    const eq = TM.mainEquity();
    const done = TM.Lessons.list.filter((l) => s.lessons[l.id] && s.lessons[l.id].done).length;
    const rec = TM.Coach.recommend();
    const tile = (n) => `<a class="tile" href="#${n.id}"><span class="tile-ic">${n.icon}</span><b>${n.label}</b><span class="muted small">${
      {
        academy: `${done}/${TM.Lessons.list.length} lessons complete`,
        practice: 'Paper trade 6 simulated stocks',
        day: 'Live trading-day session, 9:30 → 16:00',
        swing: '8-week campaign with gaps & earnings',
        crypto: '24/7 market, leverage & funding',
        scenarios: `${Object.keys(s.scenarios).length}/${TM.Scenarios.list.length} realistic scenarios done`,
        portfolio: `${st.n} trades · ${st.winRate.toFixed(0)}% win rate`,
        challenges: `${Object.keys(s.challenges).length}/${TM.Progress.CH.length} challenges completed`,
        achievements: `${Object.keys(s.achievements).length}/${TM.Progress.ACH.length} badges unlocked`,
        journal: `${Object.keys(s.journal).length} entries`,
        tests: `${Object.values(s.quiz.levels).filter((x) => x.passed).length}/${TM.Tests.levels.length} tests passed`,
      }[n.id] || ''
    }</span></a>`;
    el.innerHTML = `
      <section class="hero card">
        <div class="hero-l">
          <div class="eyebrow">${s.name ? 'Welcome back, ' + U.esc(s.name) : 'Your trading academy'}</div>
          <h2>${next ? 'Continue: <span>' + U.esc(next.title) + '</span>' : 'Curriculum complete. Keep sharpening.'}</h2>
          <p class="muted">${next ? `Level ${next.level === 'C' ? 'Crypto' : next.level} · Lesson ${next.id.replace('-', '.')} · ${next.topics.join(' · ')}` : 'Revisit tests, run scenarios and keep journaling your simulated trades.'}</p>
          <div class="btn-row">${next ? `<a class="btn btn-primary btn-lg" href="#lesson-${next.id}">▶ Continue learning</a>` : ''}<a class="btn btn-ghost" href="#practice">Open the trading terminal</a></div>
        </div>
        <div class="hero-r">
          <div class="rank-big"><span class="rb-ic">${r.icon}</span><div><div class="muted small">Current rank</div><b>${r.name}</b><div class="xpbar xpbar-lg"><i style="width:${lp.pct.toFixed(1)}%"></i></div><div class="small muted">${s.xp} XP${nr ? ` · ${nr.xp - s.xp} XP to <b>${nr.name}</b>` : ' · Top rank'}</div></div></div>
          <div class="ranks-mini">${TM.Progress.RANKS.map((k, i) => `<span class="${i <= TM.Progress.rankIndex() ? 'on' : ''}" title="${k.name} (${k.xp} XP)">${k.icon}</span>`).join('')}</div>
        </div>
      </section>
      <div class="grid g3">
        <section class="card">
          <h3>Today’s goals <span class="pill">🔥 ${d.streak || 0}-day streak</span></h3>
          <ul class="goals">${d.goals
            .map((g) => {
              const G = TM.Progress.GOALS[g];
              const cnt = (d.count && d.count[g]) || 0;
              return `<li class="${d.done[g] ? 'done' : ''}"><span class="gchk">${d.done[g] ? '✓' : ''}</span><span>${G.text}${G.need ? ` <span class="muted">(${Math.min(cnt, G.need)}/${G.need})</span>` : ''}</span>${G.href ? `<a class="btn btn-sm btn-ghost" href="${G.href}">Go</a>` : '<button class="btn btn-sm btn-ghost" data-coach>Ask</button>'}</li>`;
            })
            .join('')}</ul>
          <p class="tiny muted">+40 XP each, +60 bonus for all three. Goals reward learning and discipline, not trading volume.</p>
        </section>
        <section class="card">
          <h3>Simulated account</h3>
          <div class="kv"><span>Equity</span><b class="mono">${U.money(eq)}</b></div>
          <div class="kv"><span>Total P&L</span><b class="mono ${U.cls(eq - s.account.start)}">${U.smoney(eq - s.account.start)}</b></div>
          <div class="kv"><span>Today</span><b class="mono ${U.cls(eq - s.account.daily.start)}">${U.smoney(eq - s.account.daily.start)}</b></div>
          <div class="kv"><span>Open positions</span><b class="mono">${s.account.positions.length}</b></div>
          <div class="kv"><span>Closed trades (all modes)</span><b class="mono">${st.n}</b></div>
          <canvas class="spark" id="home-eq"></canvas>
        </section>
        <section class="card">
          <h3>Coach Nova recommends</h3>
          ${rec.length ? `<ul class="recs">${rec.map((x) => `<li><a href="#lesson-${x.l.id}"><b>${x.l.id.replace('-', '.')} ${U.esc(x.l.title)}</b><span class="muted small">Because ${x.why}.</span></a></li>`).join('')}</ul>` : '<p class="muted">You are all caught up!</p>'}
          <button class="btn btn-ghost btn-sm" data-coach>Ask the coach</button>
        </section>
      </div>
      <h3 class="sec-h">Main menu</h3>
      <div class="tiles">${NAV.filter((n) => n.id !== 'home').map(tile).join('')}</div>`;
    U.lineChart(el.querySelector('#home-eq'), s.account.equityCurve.map((p) => p.v), { baseline: s.account.start, empty: 'Your equity curve appears after you trade' });
    U.$$('[data-coach]', el).forEach((b) => (b.onclick = () => TM.Coach.toggle(true)));
    const off = TM.bus.on('progress', () => {});
    return { destroy: off };
  };

  /* ---------------- boot ---------------- */
  function boot() {
    TM.Store.init();
    document.body.classList.toggle('reduce-motion', !!S().settings.reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    buildShell();
    TM.Coach.init();
    TM.Live.init();
    TM.Progress.daily();
    window.addEventListener('hashchange', route);
    route();
    setInterval(loop, 400);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') U.closeTopModal();
    });
    TM.bus.on('trade:recorded', updateTop);
    TM.bus.on('xp', updateTop);
    if (!S().onboarded) setTimeout(onboarding, 250);
    TM.Progress.checkAchievements();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

/* TRADE MASTERY — Section 3: Day Trading Simulator.
   A full simulated session (9:30 → 16:00 ET) with realistic intraday phases and post-trade coaching. */
(function () {
  'use strict';
  const U = TM.U;
  const S = () => TM.Store.s;
  const PRIOR = 150; // bars of the previous afternoon shown for context

  const STOCKS = [
    { sym: 'ZPHX', name: 'Zephyrix Robotics', base: 48 },
    { sym: 'QNVA', name: 'Quanova Biotech', base: 23 },
    { sym: 'LMXR', name: 'Lumixar Solar', base: 67 },
    { sym: 'ORBQ', name: 'Orbiq Logistics', base: 35 },
    { sym: 'KRYX', name: 'Kryxis Labs', base: 112 },
    { sym: 'TRVQ', name: 'Travique Travel', base: 19 },
  ];
  const TYPES = {
    'trend-up': { name: 'Trend day (up)', desc: 'Price broke out of the opening range and stayed above VWAP most of the day. The best trades were buying pullbacks to VWAP/EMA 9 — shorting was fighting the tide.' },
    'trend-down': { name: 'Trend day (down)', desc: 'Price broke down from the opening range and stayed below VWAP. Rallies into VWAP were selling opportunities; buying dips kept failing.' },
    reversal: { name: 'Reversal day', desc: 'The early gap-up rally failed, price lost VWAP and trended lower all afternoon. Early longs needed tight stops; the trend change was the opportunity.' },
    range: { name: 'Range / chop day', desc: 'No side took control. Price crossed VWAP again and again inside a tight range. Breakouts failed — the best decision was often to trade small or not at all.' },
    fade: { name: 'Gap-fill (fade) day', desc: 'A big gap up was sold from the open and price drifted back toward yesterday’s close. Chasing the gap was the mistake; patience or fading the weakness was rewarded.' },
  };
  const phase = (m) => (m < 30 ? 'Open' : m < 120 ? 'Morning' : m < 270 ? 'Midday' : m < 360 ? 'Afternoon' : 'Close');
  const phaseVol = (i) => (i < 30 ? 2.3 - i * 0.045 : i < 120 ? 1 : i < 270 ? 0.55 : i < 360 ? 0.9 : 1.25);
  const phaseVm = (i) => (i < 30 ? 3.2 - i * 0.07 : i < 120 ? 1 : i < 270 ? 0.5 : i < 360 ? 0.85 : 1.8);

  function plan(type) {
    switch (type) {
      case 'trend-up':
        return [[15, 'range', 0.994, 1.006], [15, 'to', 1.016], [30, 'to', 1.009], [60, 'to', 1.03], [150, 'range', 1.022, 1.034], [90, 'to', 1.046], [30, 'to', 1.05]];
      case 'trend-down':
        return [[15, 'range', 0.994, 1.006], [15, 'to', 0.984], [30, 'to', 0.991], [60, 'to', 0.97], [150, 'range', 0.966, 0.978], [90, 'to', 0.955], [30, 'to', 0.95]];
      case 'reversal':
        return [[15, 'to', 1.012], [25, 'to', 1.021], [30, 'to', 1.004], [50, 'to', 0.99], [150, 'range', 0.982, 0.994], [90, 'to', 0.972], [30, 'to', 0.968]];
      case 'fade':
        return [[15, 'range', 0.995, 1.006], [45, 'to', 0.985], [60, 'to', 0.973], [150, 'range', 0.968, 0.98], [90, 'to', 0.975], [30, 'to', 0.97]];
      default:
        return [[30, 'range', 0.992, 1.008], [360, 'range', 0.99, 1.01]];
    }
  }
  function gapFor(type, r) {
    return { 'trend-up': 0.012 + r() * 0.015, 'trend-down': -0.012 - r() * 0.015, reversal: 0.018 + r() * 0.012, fade: 0.03 + r() * 0.015, range: (r() - 0.5) * 0.008 }[type];
  }
  function catalyst(g, r) {
    if (g > 0.025) return U.pick(['Gapping up big after earnings beat expectations', 'Gapping up on takeover rumours', 'Gapping up after a new product launch'], r);
    if (g > 0.008) return U.pick(['Gapping up on an analyst upgrade', 'Gapping up after positive sector news', 'Gapping up on strong pre-market volume'], r);
    if (g < -0.008) return U.pick(['Gapping down after a guidance cut', 'Gapping down after a CEO resignation', 'Gapping down on a downgrade'], r);
    return U.pick(['Flat open, no major news', 'Quiet pre-market, light volume', 'No catalyst — trading with the market'], r);
  }

  function genDay(sess) {
    const r = U.rng(sess.seed);
    const st = STOCKS.find((x) => x.sym === sess.sym);
    const prevStart = st.base * (0.98 + r() * 0.04);
    const day0 = Date.UTC(2026, 2, 2 + (sess.n % 25)) / 1000; // a weekday-ish sim date
    const prior = TM.Market.generate({ seed: sess.seed + 1, start: prevStart, t0: day0 - 86400 + 13.5 * 3600, step: 60, tpb: 6, baseVol: 9000, segs: [{ n: 90, to: prevStart * 1.008, v: 0.0009, vm: 0.7 }, { n: 60, range: [prevStart * 1.002, prevStart * 1.011], v: 0.0009, vm: 1.1 }] });
    const pc = prior[prior.length - 1].c;
    const g = sess.gap;
    const p0 = pc * (1 + g);
    let off = 0;
    const segs = plan(sess.type).map(([n, kind, a, b], k) => {
      const sg = { n, v: 0.00125, vol: [], vmArr: [] };
      if (k === 0) sg.gap = g;
      if (kind === 'to') sg.to = p0 * a;
      else sg.range = [p0 * a, p0 * b];
      for (let j = 0; j < n; j++) {
        sg.vol.push(phaseVol(off + j));
        sg.vmArr.push(phaseVm(off + j));
      }
      off += n;
      return sg;
    });
    const day = TM.Market.generate({ seed: sess.seed + 2, start: pc, t0: day0 + 9.5 * 3600, step: 60, tpb: 8, baseVol: 14000, keepTicks: true, segs });
    return { all: prior.concat(day), prevClose: pc };
  }

  function newSession(pick) {
    const s = S();
    const n = (s.counters.daySessions || 0) + (s.day.history ? s.day.history.length : 0);
    return { seed: pick.seed, sym: pick.sym, type: pick.type, gap: pick.gap, cat: pick.cat, n, bar: PRIOR, tick: 0, acct: TM.Store.newAccount(10000), feed: [], tradeIds: [], ids: { breakout: 0, pullback: 0, reversal: 0, level: 0, momentum: 0, trend: 0 }, idOk: 0, idTry: 0, flags: {}, done: false };
  }
  function candidates() {
    const base = U.seed();
    const r = U.rng(base);
    const syms = U.shuffle(STOCKS, r).slice(0, 3);
    return syms.map((st, k) => {
      const type = U.pick(['trend-up', 'trend-down', 'reversal', 'range', 'fade', 'trend-up', 'reversal'], r);
      const g = gapFor(type, r);
      return { seed: base + k * 101, sym: st.sym, name: st.name, type, gap: g, cat: catalyst(g, r), rvol: (1.2 + Math.abs(g) * 60 + r()).toFixed(1) };
    });
  }

  TM.Views.day = function (el) {
    const s = S();
    let sess = s.day.session;
    let timer = null,
      chart = null,
      paused = true,
      modalOpen = false,
      data = null;
    const destroyers = [];

    function lobby() {
      const picks = candidates();
      const hist = (s.day.history || []).slice(-5).reverse();
      const week = s.day.week || [];
      el.innerHTML = `
        <div class="page-head"><div><h2>Day Trading Simulator</h2><p class="muted">Trade a full simulated session from the opening bell to the close. Prices move through realistic phases: opening volatility, morning trend, midday lull, afternoon move and the closing rush. You start each session with a <b>$10,000 session bankroll</b>; results go into your stats and journal.</p></div></div>
        <div class="daybar big"><span style="flex:30" class="ph-open">Open<br><small>9:30 · volatile</small></span><span style="flex:90" class="ph-morning">Morning<br><small>10:00 · trends form</small></span><span style="flex:150" class="ph-midday">Midday<br><small>11:30 · low volume</small></span><span style="flex:90" class="ph-afternoon">Afternoon<br><small>14:00 · volume returns</small></span><span style="flex:30" class="ph-close">Close<br><small>15:30 · be flat</small></span></div>
        <h3 class="sec-h">Stocks in play today <span class="pill">pick one</span></h3>
        <div class="grid g3">${picks
          .map(
            (p, k) => `<button class="card pick" data-k="${k}"><div class="pick-h"><b class="big">${p.sym}</b><span class="sim-tag">SIM</span></div><div class="muted">${p.name}</div><div class="pick-gap ${U.cls(p.gap)}">${U.pct(p.gap * 100)} pre-market</div><div class="small">${p.cat}</div><div class="small muted">Relative volume ${p.rvol}×</div><span class="btn btn-primary btn-sm">Trade ${p.sym} →</span></button>`
          )
          .join('')}</div>
        <div class="grid g2">
          <section class="card"><h3>Rules of the session</h3><ul class="bul small"><li>All positions are closed automatically at 15:59.</li><li>Every trade gets a coach review: entry, risk, exit and lesson.</li><li>Use the <b>Identify</b> buttons to call out breakouts, pullbacks and more — correct calls earn XP.</li><li>XP is for discipline and pattern recognition, <b>not</b> for profit or trade count.</li><li>Week progress: <b>${week.length}/5</b> sessions · ${U.smoney(week.reduce((a, b) => a + b, 0))}</li></ul></section>
          <section class="card"><h3>Recent sessions</h3>${hist.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Stock</th><th>Day type</th><th>P&L</th><th>Trades</th><th>Grade</th></tr></thead><tbody>${hist.map((h) => `<tr><td><b>${h.sym}</b></td><td class="small">${TYPES[h.type].name}</td><td class="mono ${U.cls(h.pnl)}">${U.smoney(h.pnl)}</td><td class="mono">${h.trades}</td><td><span class="grade g-${h.grade}">${h.grade}</span></td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">No sessions yet. Your first one is waiting.</p>'}</section>
        </div>`;
      U.$$('.pick', el).forEach((b) => {
        b.onclick = () => {
          sess = s.day.session = newSession(picks[+b.dataset.k]);
          TM.Store.save();
          play();
        };
      });
    }

    function vwapAt(arr, i) {
      const v = TM.Ind.vwap(arr.slice(0, i + 1));
      return v[v.length - 1];
    }
    function view() {
      const all = data.all;
      const out = all.slice(0, sess.bar);
      const cur = all[sess.bar];
      if (cur) {
        const k = Math.min(sess.tick, cur.ticks.length - 1);
        const tks = cur.ticks.slice(0, k + 1);
        const frac = (k + 1) / cur.ticks.length;
        out.push({ t: cur.t, o: tks[0], h: Math.max(...tks), l: Math.min(...tks), c: tks[tks.length - 1], v: Math.round(cur.v * frac) });
      }
      return out;
    }
    const minute = () => sess.bar - PRIOR;
    const lastPrice = () => {
      const v = view();
      return v[v.length - 1].c;
    };
    const orRange = () => {
      const d = data.all.slice(PRIOR, PRIOR + 15);
      return { h: Math.max(...d.map((c) => c.h)), l: Math.min(...d.map((c) => c.l)) };
    };

    function feed(msg, kind = 'info') {
      sess.feed.unshift({ t: U.hm(data.all[Math.min(sess.bar, data.all.length - 1)].t), msg, kind });
      if (sess.feed.length > 40) sess.feed.pop();
      renderFeed();
    }
    function detectEvents() {
      if (!s.settings.hints) return;
      const m = minute();
      const f = sess.flags;
      const v = view();
      const L = v.length - 1;
      if (m === 15 && !f.or) {
        f.or = 1;
        const o = orRange();
        feed(`Opening range set: high <b>${U.price(o.h)}</b>, low <b>${U.price(o.l)}</b>. A break of either side with volume is a classic setup.`, 'coach');
      }
      if (m > 15 && m < 300) {
        const o = orRange();
        const c = v[L - 1];
        const ctx = TM.Market.context(v, L - 1);
        if (!f.orUp && c.c > o.h) {
          f.orUp = 1;
          feed(`Price closed above the opening range high on <b>${ctx.volRatio.toFixed(1)}×</b> volume. ${ctx.volRatio > 1.3 ? 'Volume confirms.' : 'Volume is weak — be careful.'} Where would your stop go?`, 'coach');
        }
        if (!f.orDn && c.c < o.l) {
          f.orDn = 1;
          feed(`Price closed below the opening range low on <b>${ctx.volRatio.toFixed(1)}×</b> volume. Sellers are pressing.`, 'coach');
        }
        const vw = TM.Ind.vwap(v);
        const side = Math.sign(v[L - 1].c - vw[L - 1]),
          prev = Math.sign(v[L - 2].c - vw[L - 2]);
        f.vx = f.vx || 0;
        if (side !== prev && f.vx < 4 && m > 20) {
          f.vx++;
          feed(side > 0 ? 'Price reclaimed <b>VWAP</b> — buyers taking back control.' : 'Price lost <b>VWAP</b> — sellers gaining control.', 'coach');
          if (f.vx === 4) feed('Price has crossed VWAP 4 times. That suggests a <b>choppy day</b> — VWAP strategies are unreliable now.', 'coach');
        }
      }
      if (m === 120 && !f.mid) {
        f.mid = 1;
        feed('11:30 — <b>Midday lull</b>. Volume usually dries up; breakouts fail more often. Many pros reduce size or take a break.', 'coach');
      }
      if (m === 270 && !f.aft) {
        f.aft = 1;
        feed('14:00 — <b>Afternoon session</b>. Volume returns. Watch whether the morning trend resumes or reverses.', 'coach');
      }
      if (m === 360 && !f.cls) {
        f.cls = 1;
        feed('15:30 — <b>Last 30 minutes</b>. Volume rises into the close. Plan your exits — positions are flattened at 15:59.', 'coach');
      }
    }

    /* identification game */
    function detect(kind) {
      const v = view();
      const L = v.length - 1;
      if (L < PRIOR + 5) return { ok: false, why: 'Let the session develop a few minutes first.' };
      const ctx = TM.Market.context(v, L);
      const cl = v.map((c) => c.c);
      const e9 = TM.Ind.ema(cl, 9),
        e20 = TM.Ind.ema(cl, 20);
      const vw = TM.Ind.vwap(v);
      const atr = ctx.atr;
      const last = v.slice(-4);
      const o = orRange();
      const m = minute();
      const hi30 = Math.max(...v.slice(-33, -3).map((c) => c.h)),
        lo30 = Math.min(...v.slice(-33, -3).map((c) => c.l));
      const res = { trend: ctx.trend };
      res.breakout = last.some((c) => c.c > hi30 || c.c < lo30 || (m > 15 && (c.c > o.h || c.c < o.l) && Math.abs(c.c - (c.c > o.h ? o.h : o.l)) < atr * 3)) && ctx.volRatio > 1.0;
      res.pullback = (ctx.trend === 'up' && last.some((c, k) => c.l <= Math.max(e20[L - 3 + k] || 0, vw[L - 3 + k]) + atr * 0.4) && v[L].c > e20[L]) || (ctx.trend === 'down' && last.some((c, k) => c.h >= Math.min(e20[L - 3 + k] || 1e9, vw[L - 3 + k]) - atr * 0.4) && v[L].c < e20[L]);
      let cross = false;
      for (let k = L - 4; k <= L; k++) if (e9[k - 1] != null && e20[k - 1] != null && Math.sign(e9[k] - e20[k]) !== Math.sign(e9[k - 1] - e20[k - 1])) cross = true;
      let vcross = false;
      for (let k = L - 3; k <= L; k++) if (Math.sign(v[k].c - vw[k]) !== Math.sign(v[k - 1].c - vw[k - 1])) vcross = true;
      res.reversal = cross || vcross;
      const lvls = [o.h, o.l, data.prevClose, Math.max(...v.slice(PRIOR).map((c) => c.h)), Math.min(...v.slice(PRIOR).map((c) => c.l))];
      res.level = m > 15 && lvls.some((p) => Math.abs(v[L].c - p) < atr * 0.6);
      const mv = v[L].c - v[L - 3].o;
      res.momentum = Math.abs(mv) > atr * 1.5 && last.slice(1).every((c) => Math.sign(c.c - c.o) === Math.sign(mv)) && ctx.volRatio > 1.1;
      const sl = (i) => (e20[i] != null && e20[i - 5] != null ? e20[i] - e20[i - 5] : 0);
      let tc = false;
      for (let k = L - 10; k <= L; k++) if (Math.sign(sl(k)) !== Math.sign(sl(k - 1)) && Math.abs(sl(k - 1)) > atr * 0.05) tc = true;
      res.trendChange = tc;
      const key = { breakout: 'breakout', pullback: 'pullback', reversal: 'reversal', level: 'level', momentum: 'momentum', trend: 'trendChange' }[kind];
      const seen = Object.keys(res).filter((k) => res[k] === true).map((k) => ({ breakout: 'a breakout', pullback: 'a pullback', reversal: 'a VWAP/EMA cross (possible reversal)', level: 'price at a key level', momentum: 'momentum', trendChange: 'a trend change' }[k]));
      const expl = {
        breakout: 'Price just pushed through a recent high/low or the opening range.',
        pullback: `The trend is ${ctx.trend} and price pulled back to the EMA 20 / VWAP area.`,
        reversal: 'EMA 9 crossed EMA 20 or price crossed VWAP in the last few minutes — control is shifting.',
        level: 'Price is testing an important level (opening range, prior close, or high/low of day).',
        momentum: 'Several same-colour candles moved more than 1.5 ATR on above-average volume.',
        trend: 'The slope of the EMA 20 has just flipped direction.',
      }[kind];
      return { ok: !!res[key], why: res[key] ? expl : seen.length ? `Right now I see: ${seen.join(', ')}. EMA-20 trend: <b>${ctx.trend}</b>.` : `Nothing clear right now — EMA-20 trend is <b>${ctx.trend}</b>. Sometimes the right call is "nothing to do".` };
    }

    function render() {
      const st = STOCKS.find((x) => x.sym === sess.sym);
      el.innerHTML = `
        <div class="ds-top card">
          <div class="ds-id"><b class="big">${sess.sym}</b> <span class="muted">${st.name}</span> <span class="sim-tag">SIMULATED SESSION</span><div class="small muted">${sess.cat} · prev close ${U.price(data.prevClose)}</div></div>
          <div class="ds-clock"><span class="mono big" id="ds-time">09:30</span><span class="pill" id="ds-phase">Open</span></div>
          <div class="ds-ctl"><div class="seg seg-sm" id="ds-speed"><button data-v="0">⏸</button><button data-v="1">1×</button><button data-v="3">3×</button><button data-v="10">10×</button></div><button class="btn btn-sm btn-ghost" id="ds-ff" title="Fast-forward 15 minutes">⏭ +15m</button><button class="btn btn-sm btn-ghost" id="ds-quit">End session</button></div>
        </div>
        <div class="daybar"><span style="flex:30" class="ph-open">Open</span><span style="flex:90" class="ph-morning">Morning</span><span style="flex:150" class="ph-midday">Midday</span><span style="flex:90" class="ph-afternoon">Afternoon</span><span style="flex:30" class="ph-close">Close</span><i class="daybar-mark" id="ds-mark"></i></div>
        <div class="ds-grid">
          <section class="ds-main">
            <div class="card"><div class="tg-row ds-ind"><button class="tg on" data-k="vwap">VWAP</button><button class="tg on" data-k="ema9">EMA 9</button><button class="tg" data-k="ema20">EMA 20</button><button class="tg" data-k="rsi">RSI</button></div><div id="ds-chart"></div></div>
            <div class="card ds-identify"><b>Identify what you see</b> <span class="muted small">(${sess.idOk}/${sess.idTry} correct)</span><div class="tg-row">${[
              ['breakout', '🚀 Breakout'],
              ['pullback', '↩️ Pullback'],
              ['reversal', '🔄 Reversal'],
              ['level', '📏 Support/Resistance'],
              ['momentum', '⚡ Momentum'],
              ['trend', '🧭 Trend change'],
            ]
              .map(([k, t]) => `<button class="tg" data-id="${k}">${t}</button>`)
              .join('')}</div><div class="w-fb" id="ds-idfb"></div></div>
          </section>
          <aside class="ds-side">
            <div class="card ds-acct"></div>
            <div class="card ds-ticket">
              <div class="seg seg-sm" id="ds-size"><button data-v="risk" class="on">Risk %</button><button data-v="qty">Shares</button></div>
              <label class="fld"><span id="ds-sizel">Risk % of bankroll</span><input type="number" step="any" id="ds-sizev" value="1"></label>
              <label class="fld"><span>Stop-loss <button type="button" class="link" id="ds-sug">suggest</button></span><input type="number" step="0.01" id="ds-stop" placeholder="required for Risk %"></label>
              <label class="fld"><span>Take-profit <button type="button" class="link" id="ds-2r">2R</button></span><input type="number" step="0.01" id="ds-tp" placeholder="optional"></label>
              <div class="ds-calc small"></div>
              <div class="btn-row"><button class="btn btn-buy" id="ds-buy">Buy</button><button class="btn btn-sell" id="ds-short">Short</button></div>
              <div class="ds-pos"></div>
            </div>
            <div class="card ds-feed"><b>Session feed</b><ul id="ds-feed"></ul></div>
          </aside>
        </div>`;
      chart = new TM.Chart(el.querySelector('#ds-chart'), { height: window.innerWidth < 700 ? 300 : 400, overlays: { vwap: true, ema9: true }, panes: [], symbol: sess.sym, fitBars: 140, onLineDrag: onDrag });
      chart.setData(view(), { fit: true, fitBars: 150 });
      bind();
      renderFeed();
      tickUI();
    }
    let sizeMode = 'risk';
    function bind() {
      const $ = (q) => el.querySelector(q);
      U.on($('#ds-speed'), 'click', 'button', (e, b) => setSpeed(+b.dataset.v));
      $('#ds-ff').onclick = () => fastForward(15);
      $('#ds-quit').onclick = () => {
        const box = U.el('<p>End the session now? Any open position will be closed at the current price.</p>');
        U.modal({ title: 'End session', body: box, actions: [{ label: 'Keep trading', cls: 'btn-ghost' }, { label: 'End session', cls: 'btn-sell', onClick: () => endSession() }] });
      };
      U.on($('.ds-ind'), 'click', '.tg', (e, b) => {
        b.classList.toggle('on');
        const k = b.dataset.k;
        if (k === 'rsi') chart.setPanes(b.classList.contains('on') ? ['rsi'] : []);
        else chart.setOverlays({ [k]: b.classList.contains('on') });
      });
      U.on($('.ds-identify'), 'click', '.tg', (e, b) => {
        const r = detect(b.dataset.id);
        sess.idTry++;
        const fbx = $('#ds-idfb');
        fbx.className = 'w-fb show ' + (r.ok ? 'fb-ok' : 'fb-bad');
        fbx.innerHTML = (r.ok ? '✓ Yes! ' : '✕ Not quite. ') + r.why;
        if (r.ok) {
          sess.idOk++;
          sess.ids[b.dataset.id]++;
          if (sess.idOk <= 6) TM.Progress.addXP(5, 'Pattern identified: ' + b.textContent.trim());
        }
        el.querySelector('.ds-identify .muted').textContent = `(${sess.idOk}/${sess.idTry} correct)`;
        TM.Store.save();
      });
      U.on($('#ds-size'), 'click', 'button', (e, b) => {
        sizeMode = b.dataset.v;
        U.$$('#ds-size button', el).forEach((x) => x.classList.toggle('on', x === b));
        $('#ds-sizel').textContent = sizeMode === 'risk' ? 'Risk % of bankroll' : 'Shares';
        $('#ds-sizev').value = sizeMode === 'risk' ? 1 : 100;
        calc();
      });
      ['#ds-sizev', '#ds-stop', '#ds-tp'].forEach((q) => ($(q).oninput = () => (calc(), lines())));
      $('#ds-sug').onclick = () => {
        const v = view();
        const ctx = TM.Market.context(v);
        const lows = v.slice(-8).map((c) => c.l),
          highs = v.slice(-8).map((c) => c.h);
        const p = lastPrice();
        // suggest beyond the recent swing, assume long if above VWAP else short
        const vw = TM.Ind.vwap(v);
        const long = p >= vw[vw.length - 1];
        $('#ds-stop').value = U.round(long ? Math.min(...lows) - ctx.atr * 0.3 : Math.max(...highs) + ctx.atr * 0.3, 2);
        feed(`Suggested a stop beyond the last 8 minutes’ ${long ? 'low' : 'high'} plus a small ATR buffer (assumes a ${long ? 'long, price above' : 'short, price below'} VWAP).`, 'coach');
        calc();
        lines();
      };
      $('#ds-2r').onclick = () => {
        const p = lastPrice(),
          st = +$('#ds-stop').value;
        if (!st) return U.toast('Set a stop first.', 'info');
        $('#ds-tp').value = U.round(p + (p - st) * 2, 2);
        calc();
        lines();
      };
      $('#ds-buy').onclick = () => enter('long');
      $('#ds-short').onclick = () => enter('short');
    }
    function tkSpec(side) {
      const $ = (q) => el.querySelector(q);
      const p = lastPrice();
      const entry = side === 'long' ? p + 0.01 : p - 0.01;
      const stop = +$('#ds-stop').value || null;
      const target = +$('#ds-tp').value || null;
      const eq = TM.Trading.equity(sess.acct, () => p);
      let qty = 0;
      const v = +$('#ds-sizev').value || 0;
      let capped = false;
      if (sizeMode === 'qty') qty = Math.floor(v);
      else if (stop) {
        qty = Math.floor((eq * v) / 100 / Math.abs(entry - stop));
        const maxQ = Math.floor((sess.acct.cash * 0.995) / entry);
        if (qty > maxQ) {
          qty = maxQ;
          capped = true;
        }
      }
      return { sym: sess.sym, side, qty, entry, stop, target, lev: 1, mode: 'day', feeRate: 0, equity: eq, capped };
    }
    function calc() {
      const box = el.querySelector('.ds-calc');
      if (!box) return;
      const p = lastPrice();
      const st = +el.querySelector('#ds-stop').value;
      const side = st && st > p ? 'short' : 'long';
      const sp = tkSpec(side);
      const chk = TM.Trading.check(sess.acct, sp, sp.equity);
      box.innerHTML = `${sp.capped ? '<span class="warn-t">Size capped by buying power (very tight stop).</span><br>' : ''}${st ? `Stop is ${st < p ? 'below' : 'above'} price → this is a <b>${side.toUpperCase()}</b> setup.<br>` : ''}Size: <b>${sp.qty || '—'}</b> shares · value ${U.money(chk.calc.notional)}<br>Risk: ${chk.calc.risk != null ? `<b>${U.money(chk.calc.risk)}</b> (${chk.calc.riskPct.toFixed(2)}%)` : '<b class="down">no stop</b>'} · R:R ${chk.calc.rr != null ? chk.calc.rr.toFixed(2) : '—'}`;
    }
    function lines() {
      if (!chart) return;
      const L = [];
      const o = minute() >= 15 ? orRange() : null;
      if (o) {
        L.push({ price: o.h, color: 'rgba(77,141,255,.6)', label: 'OR H', dash: [2, 4], noFit: true }, { price: o.l, color: 'rgba(77,141,255,.6)', label: 'OR L', dash: [2, 4], noFit: true });
      }
      L.push({ price: data.prevClose, color: 'rgba(160,170,190,.5)', label: 'Prev close', dash: [2, 6], noFit: true });
      sess.acct.positions.forEach((p) => {
        L.push({ id: 'e', price: p.entry, color: '#4d8dff', label: p.side === 'long' ? 'LONG' : 'SHORT' });
        if (p.stop) L.push({ id: 's', price: p.stop, color: '#f0465a', label: 'SL', draggable: true });
        if (p.target) L.push({ id: 't', price: p.target, color: '#16c784', label: 'TP', draggable: true });
      });
      if (!sess.acct.positions.length) {
        const st = +el.querySelector('#ds-stop').value,
          tp = +el.querySelector('#ds-tp').value;
        if (st) L.push({ id: 'ps', price: st, color: 'rgba(240,70,90,.6)', label: 'SL?', draggable: true });
        if (tp) L.push({ id: 'pt', price: tp, color: 'rgba(22,199,132,.6)', label: 'TP?', draggable: true });
      }
      chart.setLines(L);
      const marks = [];
      sess.tradeIds.forEach((id) => {
        const t = s.trades.find((x) => x.id === id);
        if (!t) return;
        marks.push({ i: t.openedBar, kind: t.side === 'long' ? 'buy' : 'sell', text: t.side === 'long' ? 'B' : 'S' });
        marks.push({ i: t.closedBar, kind: 'dot', price: t.exit, color: t.pnl >= 0 ? '#16c784' : '#f0465a' });
      });
      sess.acct.positions.forEach((p) => marks.push({ i: p.openedBar, kind: p.side === 'long' ? 'buy' : 'sell', text: p.side === 'long' ? 'B' : 'S' }));
      chart.setMarkers(marks);
    }
    function onDrag(id, price, final) {
      const p = U.round(price, 2);
      if (id === 'ps') el.querySelector('#ds-stop').value = p;
      if (id === 'pt') el.querySelector('#ds-tp').value = p;
      if ((id === 's' || id === 't') && final) {
        const pos = sess.acct.positions[0];
        const px = lastPrice();
        if (pos) {
          const f = id === 's' ? 'stop' : 'target';
          const bad = f === 'stop' ? (pos.side === 'long' ? p >= px : p <= px) : pos.side === 'long' ? p <= px : p >= px;
          if (bad) U.toast('That level is on the wrong side of the current price.', 'bad');
          else TM.Trading.modify(pos, f, p);
          TM.Store.save();
        }
      }
      if (final) lines();
      calc();
      renderPos();
    }
    function enter(side) {
      if (sess.acct.positions.length) return U.toast('One position at a time in the day simulator. Manage or close your current trade first.', 'info');
      if (minute() >= 389) return U.toast('The session is closing.', 'info');
      const sp = tkSpec(side);
      if (sizeMode === 'risk' && !sp.stop) return U.toast('Risk % sizing needs a stop-loss. Set one (or tap "suggest").', 'bad');
      const chk = TM.Trading.check(sess.acct, sp, sp.equity);
      if (!chk.ok) return U.toast(chk.errors[0], 'bad');
      if (!(sp.qty > 0)) return U.toast('Position size is zero. Check the stop and size.', 'bad');
      const v = view();
      const vw = TM.Ind.vwap(v);
      const o = orRange();
      const m = minute();
      const meta = { phase: phase(m), minute: m, vwapSide: Math.sign(sp.entry - vw[vw.length - 1]), breakout: m > 15 && ((side === 'long' && sp.entry > o.h) || (side === 'short' && sp.entry < o.l)) };
      const pos = TM.Trading.open(sess.acct, Object.assign({}, sp, { ctx: TM.Market.context(v), bar: v.length - 1, t: v[v.length - 1].t, meta }));
      feed(`${side === 'long' ? 'Bought' : 'Shorted'} <b>${pos.qty}</b> @ ${U.price(pos.entry)}${pos.stop ? ` · stop ${U.price(pos.stop)}` : ' · <b class="down">no stop</b>'}${pos.target ? ` · target ${U.price(pos.target)}` : ''}`, side === 'long' ? 'good' : 'bad');
      if (chk.warnings.length) feed('⚠ ' + chk.warnings.join(' '), 'warn');
      U.sound('fill');
      if (meta.phase === 'Midday' && s.settings.hints) feed('Note: midday entries face lower volume and more false moves.', 'coach');
      TM.Store.save();
      lines();
      renderPos();
    }
    function renderPos() {
      const box = el.querySelector('.ds-pos');
      if (!box) return;
      const p = sess.acct.positions[0];
      const px = lastPrice();
      const eq = TM.Trading.equity(sess.acct, () => px);
      const pnl0 = eq - 10000;
      el.querySelector('.ds-acct').innerHTML = `<div class="kv"><span>Session bankroll</span><b class="mono">${U.money(eq)}</b></div><div class="kv"><span>Session P&L</span><b class="mono ${U.cls(pnl0)}">${U.smoney(pnl0)}</b></div><div class="kv"><span>Trades</span><b class="mono">${sess.tradeIds.length}${sess.tradeIds.length > 6 ? ' <span class="down">(overtrading?)</span>' : ''}</b></div>`;
      if (!p) {
        box.innerHTML = '<p class="muted small">No open position. One trade at a time.</p>';
        return;
      }
      const pnl = TM.Trading.pnl(p, px);
      const r = p.riskPlanned ? pnl / p.riskPlanned : null;
      box.innerHTML = `<div class="pos-card ${p.side}"><div><b>${p.side.toUpperCase()} ${p.qty}</b> @ ${U.price(p.entry)}</div><div class="mono big ${U.cls(pnl)}">${U.smoney(pnl)} ${r != null ? `<small>(${r >= 0 ? '+' : ''}${r.toFixed(2)}R)</small>` : ''}</div><div class="small muted">Stop ${p.stop ? U.price(p.stop) : '—'} · Target ${p.target ? U.price(p.target) : '—'} · drag lines to adjust</div><div class="btn-row"><button class="btn btn-sm btn-ghost" id="ds-be">Stop → breakeven</button><button class="btn btn-sm" id="ds-close">Close position</button></div></div>`;
      box.querySelector('#ds-close').onclick = () => closePos('manual');
      box.querySelector('#ds-be').onclick = () => {
        if ((p.side === 'long' && px <= p.entry) || (p.side === 'short' && px >= p.entry)) return U.toast('Only possible once the trade is in profit.', 'info');
        TM.Trading.modify(p, 'stop', p.entry);
        feed('Stop moved to breakeven.', 'info');
        lines();
        renderPos();
      };
    }
    function closePos(reason, price) {
      const p = sess.acct.positions[0];
      if (!p) return;
      const px = price != null ? price : lastPrice() + (p.side === 'long' ? -0.01 : 0.01);
      const v = view();
      const t = TM.Trading.close(sess.acct, p, px, reason, { bar: v.length - 1, t: v[v.length - 1].t });
      handleClosed([t]);
    }
    function handleClosed(trades) {
      if (!trades.length) return Promise.resolve();
      const wasPlaying = !paused;
      setSpeed(0, true);
      modalOpen = true;
      let chain = Promise.resolve();
      trades.forEach((t) => {
        sess.tradeIds.push(t.id);
        // follow-through: did price reach the target within the next 30 bars?
        const fut = data.all.slice(sess.bar + 1, sess.bar + 31);
        const hitTarget = t.target ? fut.some((c) => (t.side === 'long' ? c.h >= t.target : c.l <= t.target)) : false;
        feed(`Closed (${t.exitReason}) @ ${U.price(t.exit)} · <b class="${U.cls(t.pnl)}">${U.smoney(t.pnl)}</b>`, t.pnl >= 0 ? 'good' : 'bad');
        chain = chain.then(() => TM.Progress.afterTrade(t, { review: { followThrough: { hitTarget } } }));
      });
      TM.Store.save();
      lines();
      renderPos();
      return chain.then(() => {
        modalOpen = false;
        if (wasPlaying && sess && !sess.done) setSpeed(sess.lastSpeed || 1);
      });
    }
    function setSpeed(v, keepLast) {
      if (!keepLast && v > 0) sess.lastSpeed = v;
      if (v > 0 && !keepLast) sess.lastSpeed = v;
      paused = v === 0;
      clearInterval(timer);
      timer = null;
      U.$$('#ds-speed button', el).forEach((b) => b.classList.toggle('on', +b.dataset.v === v));
      if (!paused) timer = setInterval(() => step(v), 110);
    }
    function step(times = 1) {
      for (let k = 0; k < times; k++) {
        if (modalOpen || sess.done) return;
        advanceTick();
      }
      tickUI();
    }
    function advanceTick() {
      const cur = data.all[sess.bar];
      if (!cur) {
        sess.done = true;
        return endSession();
      }
      sess.tick++;
      const k = Math.min(sess.tick, cur.ticks.length - 1);
      const px = cur.ticks[k];
      if (sess.acct.positions.length) {
        const closed = TM.Trading.process(sess.acct, sess.sym, { h: px, l: px, c: px, o: px }, { bar: sess.bar, t: cur.t });
        if (closed.length) handleClosed(closed);
      }
      if (sess.tick >= cur.ticks.length) {
        sess.tick = 0;
        sess.bar++;
        detectEvents();
        if (minute() >= 389) {
          sess.done = true;
          let pr = Promise.resolve();
          if (sess.acct.positions.length) {
            const last = data.all[sess.bar - 1];
            const t = TM.Trading.close(sess.acct, sess.acct.positions[0], last.c, 'session-end', { bar: sess.bar - 1, t: last.t });
            pr = handleClosed([t]);
          }
          pr.then(() => setTimeout(() => endSession(), 200));
          return;
        }
        if (sess.bar % 10 === 0) TM.Store.save();
      }
    }
    function fastForward(mins) {
      if (sess.done) return;
      const target = Math.min(PRIOR + 389, sess.bar + mins);
      let guard = 0;
      while (sess.bar < target && !modalOpen && !sess.done && guard++ < 10000) advanceTick();
      tickUI();
    }
    function tickUI() {
      if (!chart) return;
      chart.setData(view());
      const m = Math.max(0, minute());
      const cur = data.all[Math.min(sess.bar, data.all.length - 1)];
      el.querySelector('#ds-time').textContent = U.hm(cur.t);
      el.querySelector('#ds-phase').textContent = phase(m);
      el.querySelector('#ds-mark').style.left = (m / 390) * 100 + '%';
      if (sess.tick === 1 || sess.tick === 0) lines();
      renderPos();
      if (sess.tick % 3 === 0) calc();
    }
    function renderFeed() {
      const ul = el.querySelector('#ds-feed');
      if (!ul) return;
      ul.innerHTML = sess.feed.map((f) => `<li class="fd-${f.kind}"><span class="mono muted">${f.t}</span> ${f.msg}</li>`).join('') || '<li class="muted">Session events and coach notes appear here.</li>';
    }
    function endSession() {
      if (sess.summarised) return;
      sess.summarised = true;
      sess.done = true;
      setSpeed(0, true);
      if (sess.acct.positions.length) {
        const last = data.all[Math.min(sess.bar, data.all.length - 1)];
        const t = TM.Trading.close(sess.acct, sess.acct.positions[0], last.c, 'session-end', { bar: sess.bar, t: last.t });
        sess.tradeIds.push(t.id);
        TM.Progress.recordTrade(t);
      }
      const trades = sess.tradeIds.map((id) => s.trades.find((x) => x.id === id)).filter(Boolean);
      const pnl = sess.acct.cash - 10000;
      const avg = trades.length ? trades.reduce((a, t) => a + t.review.score, 0) / trades.length : null;
      const grade = avg == null ? '—' : avg >= 90 ? 'A' : avg >= 78 ? 'B' : avg >= 62 ? 'C' : avg >= 45 ? 'D' : 'F';
      const notes = [];
      if (!trades.length) notes.push('You took no trades. That is fine if nothing met your rules — but try at least one planned trade next time to practise execution.');
      if (trades.length > 6) notes.push(`You took <b>${trades.length}</b> trades. That is a lot for one session — overtrading usually lowers quality.`);
      const mid = trades.filter((t) => t.meta && t.meta.phase === 'Midday').length;
      if (mid >= 2) notes.push(`<b>${mid}</b> trades were in the midday lull, the lowest-quality part of the day.`);
      const noStop = trades.filter((t) => !t.origStop).length;
      if (noStop) notes.push(`<b>${noStop}</b> trade(s) without a stop-loss.`);
      if (sess.type === 'range' && trades.length >= 3) notes.push('This was a choppy range day. The best traders recognise chop early and step aside.');
      if (!notes.length) notes.push('Clean, disciplined session. Keep doing exactly this.');
      // XP: completion + discipline + recognition (never P&L)
      const goodT = trades.filter((t) => t.review.score >= 78).length;
      const xp = 50 + Math.min(50, goodT * 10) + Math.min(30, sess.idOk * 5) - (trades.length > 6 ? 30 : 0);
      s.counters.daySessions++;
      s.day.history = (s.day.history || []).concat([{ sym: sess.sym, type: sess.type, pnl, trades: trades.length, grade, at: Date.now() }]).slice(-30);
      s.day.week = (s.day.week || []).concat([pnl]);
      let weekMsg = `Week progress: ${s.day.week.length}/5 sessions (${U.smoney(s.day.week.reduce((a, b) => a + b, 0))}).`;
      if (s.day.week.length >= 5) {
        const wk = s.day.week.reduce((a, b) => a + b, 0);
        if (wk > 0) {
          s.counters.greenWeeks++;
          weekMsg = `🎉 <b>Green week!</b> Five sessions totalling <b class="up">${U.smoney(wk)}</b>.`;
        } else weekMsg = `Week complete: ${U.smoney(wk)}. A losing week with good process is still progress — review your journal.`;
        s.day.week = [];
      }
      const T = TYPES[sess.type];
      s.day.session = null;
      TM.Store.save();
      TM.Progress.addXP(Math.max(20, xp), 'Day-trading session complete');
      TM.Progress.goal('day');
      TM.Progress.checkAchievements();
      const ids = Object.entries(sess.ids).filter(([, n]) => n).map(([k, n]) => `${k} ×${n}`).join(', ') || 'none';
      const body = U.el(`<div class="eod">
        <div class="eod-top"><div><div class="eyebrow">Day type revealed</div><h3>${T.name}</h3><p>${T.desc}</p></div><div class="rv-grade g-${grade}">${grade}<small>avg process</small></div></div>
        <div class="eod-stats"><div><span>Session P&L</span><b class="mono ${U.cls(pnl)}">${U.smoney(pnl)}</b></div><div><span>Trades</span><b class="mono">${trades.length}</b></div><div><span>Patterns identified</span><b class="mono">${sess.idOk}/${sess.idTry}</b></div><div><span>XP</span><b class="mono xp">+${Math.max(20, xp)}</b></div></div>
        <div id="eod-chart"></div>
        <h4>Coach notes</h4><ul class="bul">${notes.map((n) => `<li>${n}</li>`).join('')}</ul>
        <p class="small muted">Identified: ${ids}. ${weekMsg}</p></div>`);
      const md = U.modal({ title: 'End-of-day report', body, wide: true, actions: [{ label: 'Back to lobby', cls: 'btn-ghost' }, { label: 'Next trading day →', cls: 'btn-primary' }], onClose: () => (sess = null, lobby()) });
      const ch = new TM.Chart(body.querySelector('#eod-chart'), { height: 260, overlays: { vwap: true }, symbol: '', fitBars: 400, interactive: false, zoomButtons: false });
      ch.setData(data.all.slice(PRIOR - 30), { fit: true, fitBars: 425 });
      ch.setMarkers(
        trades.flatMap((t) => [
          { i: t.openedBar - PRIOR + 30, kind: t.side === 'long' ? 'buy' : 'sell' },
          { i: t.closedBar - PRIOR + 30, kind: 'dot', price: t.exit, color: t.pnl >= 0 ? '#16c784' : '#f0465a' },
        ])
      );
      const oc = md.close;
      md.close = () => {
        ch.destroy();
        oc();
      };
      if (chart) {
        chart.destroy();
        chart = null;
      }
    }

    function play() {
      data = genDay(sess);
      render();
      lines();
      calc();
      if (!sess.feed.length) {
        feed(`Pre-market: <b>${sess.sym}</b> ${sess.cat.toLowerCase()} (${U.pct(sess.gap * 100)}). The opening bell rings at 9:30. Watch the first 15 minutes form the opening range.`, 'coach');
        feed('Tip: decide your stop BEFORE you click buy. Use "suggest" if unsure.', 'coach');
      }
      setSpeed(0, true);
      U.$$('#ds-speed button', el).forEach((b) => b.classList.toggle('on', b.dataset.v === '0'));
      U.toast('Press 1× to start the session.', 'info');
      TM.Coach.setContext({
        view: 'day',
        label: 'Day trading sim',
        hint: () => {
          const v = view();
          const ctx = TM.Market.context(v);
          const vw = TM.Ind.vwap(v);
          const above = v[v.length - 1].c > vw[vw.length - 1];
          return `It is ${phase(minute())} session. Price is <b>${above ? 'above' : 'below'} VWAP</b>, EMA-20 trend is <b>${ctx.trend}</b>, ATR ${U.price(ctx.atr)}. ${phase(minute()) === 'Midday' ? 'Midday: lower quality, consider waiting.' : above ? 'Longs on pullbacks to VWAP/EMA 9 align with buyers.' : 'Shorts on rallies into VWAP align with sellers.'}`;
        },
      });
    }

    if (sess && !sess.done) play();
    else lobby();
    return {
      destroy() {
        clearInterval(timer);
        if (chart) chart.destroy();
        destroyers.forEach((f) => f());
        TM.Store.save();
      },
    };
  };
})();

/* TRADE MASTERY — Section 4: Swing Trading Simulator.
   An 8-week (40 trading day) campaign on daily charts with overnight gaps, earnings and market news. */
(function () {
  'use strict';
  const U = TM.U;
  const S = () => TM.Store.s;
  const HIST = 120;
  const DAYS = 40;
  const UNIVERSE = [
    { sym: 'NMBS', name: 'Nimbus Cloud', sector: 'Technology', start: 74, vol: 0.019 },
    { sym: 'MDVX', name: 'Medivex Pharma', sector: 'Healthcare', start: 41, vol: 0.016 },
    { sym: 'SOLQ', name: 'Solquest Power', sector: 'Energy', start: 28, vol: 0.018 },
    { sym: 'ATLQ', name: 'Atlaq Industrial', sector: 'Industrials', start: 112, vol: 0.013 },
  ];
  const MKT_NEWS = [
    { t: 'Central bank raises interest rates unexpectedly', g: -0.022 },
    { t: 'Inflation report comes in cooler than expected', g: 0.016 },
    { t: 'Strong jobs report lifts the whole market', g: 0.012 },
    { t: 'Global growth scare hits stocks worldwide', g: -0.018 },
  ];
  const SECTOR_NEWS = {
    Technology: [['Major cloud contract win announced', 0.035], ['Regulators open an antitrust probe', -0.04]],
    Healthcare: [['Drug trial shows strong results', 0.06], ['FDA delays approval decision', -0.05]],
    Energy: [['Oil prices spike on supply cuts', 0.03], ['Oil slumps as demand outlook weakens', -0.032]],
    Industrials: [['Record order backlog reported', 0.025], ['Factory strike disrupts production', -0.03]],
  };
  const QUIET = ['Quiet session, light volume', 'Markets drift ahead of key data', 'Mixed trading as investors wait', 'Calm day across sectors', 'Sector rotation keeps indexes flat'];

  /* deterministic campaign generation */
  function generate(seed) {
    const r = U.rng(seed);
    const total = HIST + DAYS;
    const t0 = Date.UTC(2026, 0, 5) / 1000;
    // trading days (skip weekends)
    const days = [];
    let t = t0;
    while (days.length < total) {
      const dw = new Date(t * 1000).getUTCDay();
      if (dw !== 0 && dw !== 6) days.push(t);
      t += 86400;
    }
    // market-wide events during the campaign
    const events = {};
    const mk = U.shuffle(MKT_NEWS, r).slice(0, 2);
    mk.forEach((n, k) => (events['M' + (HIST + 6 + k * 17 + Math.floor(r() * 6))] = n));
    const stocks = UNIVERSE.map((u, k) => {
      const er = HIST + 6 + Math.floor(r() * 30);
      const beat = r() < 0.55;
      const earnGap = (beat ? 1 : -1) * (0.04 + r() * 0.09);
      const sn = SECTOR_NEWS[u.sector][Math.floor(r() * 2)];
      let snDay = HIST + 3 + Math.floor(r() * 34);
      if (Math.abs(snDay - er) < 3) snDay = Math.min(HIST + DAYS - 2, er + 4);
      const regimes = ['up', 'up', 'range', 'down', 'up-pull'];
      let p = u.start * (0.85 + r() * 0.3);
      const candles = [];
      let reg = null,
        left = 0,
        drift = 0,
        post = 0,
        postDir = 0;
      for (let i = 0; i < total; i++) {
        if (left <= 0) {
          reg = U.pick(regimes, r);
          left = 10 + Math.floor(r() * 25);
          drift = reg === 'up' ? u.vol * 0.28 : reg === 'down' ? -u.vol * 0.24 : reg === 'up-pull' ? u.vol * 0.12 : 0;
        }
        left--;
        let gap = U.gauss(r) * u.vol * 0.25;
        let vm = 1;
        let ev = null;
        if (i === er) {
          gap = earnGap;
          vm = 3.5;
          ev = { kind: 'earn', t: `${u.sym} earnings ${beat ? 'BEAT' : 'MISS'} expectations — stock ${beat ? 'gaps up' : 'gaps down'} ${U.pct(earnGap * 100, 1)}`, g: earnGap };
          post = 5;
          postDir = Math.sign(earnGap);
        }
        if (i === snDay) {
          gap += sn[1];
          vm = 2.4;
          ev = { kind: 'news', t: `${u.sym}: ${sn[0]}`, g: sn[1] };
        }
        const m = events['M' + i];
        if (m) {
          gap += m.g * (0.7 + 0.6 * r());
          vm = Math.max(vm, 1.8);
        }
        if (post > 0) {
          drift += postDir * u.vol * 0.08;
          post--;
          if (!post) drift = 0;
        }
        const o = p * (1 + gap);
        p = o;
        let h = o,
          l = o;
        const ticks = 8;
        let absr = 0;
        for (let k2 = 0; k2 < ticks; k2++) {
          const ret = drift / ticks + (u.vol / Math.sqrt(ticks)) * U.gauss(r);
          absr += Math.abs(ret);
          p *= Math.exp(ret);
          h = Math.max(h, p);
          l = Math.min(l, p);
        }
        const v = Math.round(2e6 * vm * (0.6 + (absr / u.vol) * 0.4) * Math.exp(U.gauss(r) * 0.2));
        candles.push({ t: days[i], o, h, l, c: p, v, ev });
      }
      return Object.assign({}, u, { candles, earnDay: er, beat });
    });
    return { stocks, events, days };
  }

  TM.Views.swing = function (el) {
    const s = S();
    let camp = s.swing.campaign;
    let G = null,
      chart = null,
      sel = 0,
      busy = false,
      lineMode = false;

    function lobby() {
      const h = (s.swing.history || []).slice(-5).reverse();
      el.innerHTML = `
        <div class="page-head"><div><h2>Swing Trading Simulator</h2><p class="muted">An 8-week campaign on daily charts. Four simulated stocks from different sectors, overnight gaps, earnings announcements, market news and unexpected volatility. Decide when to enter, where to put your stop, where to take profit and how much to risk — then let the days unfold.</p></div></div>
        <div class="grid g3">
          <section class="card"><h3>📅 How it works</h3><ul class="bul small"><li>Each click advances one trading day (or a week).</li><li>Orders fill at the day's closing price; stops and targets are checked every day.</li><li><b>Gaps</b> can jump past your stop — that's real overnight risk.</li><li>Starting bankroll: <b>$10,000</b> (separate from your Practice account).</li></ul></section>
          <section class="card"><h3>🧘 The skill being tested</h3><p class="small">Patience. Swing trades need room to breathe. The coach flags <b>emotional exits</b> — closing a sound trade after a small wiggle — and holding blindly through earnings.</p><p class="small muted">Challenge: hold 3 positions in 3 different sectors, each risking ≤2%.</p></section>
          <section class="card"><h3>Past campaigns</h3>${h.length ? `<ul class="bul small">${h.map((x) => `<li>${U.dateTime(x.at)} · <b class="${U.cls(x.ret)}">${U.pct(x.ret)}</b> · ${x.trades} trades · grade ${x.grade}</li>`).join('')}</ul>` : '<p class="muted small">None yet.</p>'}</section>
        </div>
        <div class="center"><button class="btn btn-primary btn-lg" id="sw-start">Start a new 8-week campaign →</button></div>`;
      el.querySelector('#sw-start').onclick = () => {
        camp = s.swing.campaign = { seed: U.seed(), day: 0, acct: TM.Store.newAccount(10000), weekStart: 10000, tradeIds: [], news: [], flags: {}, peak: 10000, maxDD: 0 };
        TM.Store.save();
        play();
      };
    }
    const idx = () => HIST + camp.day; // index of the current (last revealed) day
    const stock = () => G.stocks[sel];
    const px = (k) => G.stocks[k].candles[idx()].c;
    const priceOf = (sym) => px(G.stocks.findIndex((x) => x.sym === sym));
    const eq = () => TM.Trading.equity(camp.acct, priceOf);

    function render() {
      el.innerHTML = `
        <div class="sw-top card">
          <div><div class="eyebrow">Swing campaign · simulated</div><b class="big">Day <span id="sw-day"></span> of ${DAYS}</b> <span class="muted" id="sw-date"></span></div>
          <div class="sw-acct" id="sw-acct"></div>
          <div class="btn-row"><button class="btn btn-primary" id="sw-next">Next day ▶</button><button class="btn btn-ghost" id="sw-week">Next week ⏩</button><button class="btn btn-ghost btn-sm" id="sw-quit">End campaign</button></div>
        </div>
        <div class="sw-grid">
          <aside class="card sw-watch"><b>Watchlist</b><div id="sw-list"></div><div class="sw-cal" id="sw-cal"></div></aside>
          <section class="sw-main">
            <div class="card"><div class="sw-head" id="sw-head"></div><div class="tg-row"><button class="tg on" data-k="ema20">EMA 20</button><button class="tg on" data-k="ema50">EMA 50</button><button class="tg" data-k="bb">Bollinger</button><button class="tg" data-k="rsi">RSI</button><button class="tg" id="sw-line" title="Hide intraday noise">Line chart (calm view)</button></div><div id="sw-chart"></div></div>
            <div class="card"><b>Open positions</b><div id="sw-pos"></div></div>
          </section>
          <aside class="sw-side">
            <div class="card sw-ticket">
              <div class="seg seg-side" id="sw-side"><button data-v="long" class="on buy">Buy</button><button data-v="short" class="sell">Short</button></div>
              <label class="fld"><span>Risk % of bankroll</span><input type="number" step="0.1" id="sw-risk" value="1"></label>
              <label class="fld"><span>Stop-loss <button class="link" type="button" id="sw-sug">below swing</button></span><input type="number" step="0.01" id="sw-stop"></label>
              <label class="fld"><span>Take-profit <button class="link" type="button" id="sw-2r">2R</button></span><input type="number" step="0.01" id="sw-tp"></label>
              <div class="small" id="sw-calc"></div>
              <button class="btn btn-buy btn-block" id="sw-go">Place order (fills at today's close)</button>
            </div>
            <div class="card sw-news"><b>News & events</b><ul id="sw-news"></ul></div>
          </aside>
        </div>`;
      chart = new TM.Chart(el.querySelector('#sw-chart'), { height: window.innerWidth < 700 ? 300 : 380, overlays: { ema20: true, ema50: true }, panes: [], fitBars: 100, onLineDrag: onDrag });
      bind();
      refresh(true);
    }
    let side = 'long';
    function bind() {
      const $ = (q) => el.querySelector(q);
      $('#sw-next').onclick = () => advance(1);
      $('#sw-week').onclick = () => advance(5);
      $('#sw-quit').onclick = () => U.modal({ title: 'End campaign', body: '<p>End the campaign now? Open positions are closed at today’s close.</p>', actions: [{ label: 'Keep going', cls: 'btn-ghost' }, { label: 'End campaign', cls: 'btn-sell', onClick: () => finish() }] });
      U.on($('#sw-list'), 'click', 'button', (e, b) => {
        sel = +b.dataset.k;
        $('#sw-stop').value = $('#sw-tp').value = '';
        refresh(true);
      });
      U.on(el.querySelector('.sw-main .tg-row'), 'click', '.tg', (e, b) => {
        if (b.id === 'sw-line') {
          lineMode = !lineMode;
          b.classList.toggle('on', lineMode);
          chart.o.type = lineMode ? 'line' : 'candle';
          chart.req();
          if (lineMode) U.toast('Calm view: only daily closes. Great for avoiding emotional reactions to every wiggle.', 'info');
          return;
        }
        b.classList.toggle('on');
        const k = b.dataset.k;
        if (k === 'rsi') chart.setPanes(b.classList.contains('on') ? ['rsi'] : []);
        else chart.setOverlays({ [k]: b.classList.contains('on') });
      });
      U.on($('#sw-side'), 'click', 'button', (e, b) => {
        side = b.dataset.v;
        U.$$('#sw-side button', el).forEach((x) => x.classList.toggle('on', x === b));
        $('#sw-go').className = 'btn btn-block ' + (side === 'long' ? 'btn-buy' : 'btn-sell');
        calc();
      });
      ['#sw-risk', '#sw-stop', '#sw-tp'].forEach((q) => ($(q).oninput = () => (calc(), lines())));
      $('#sw-sug').onclick = () => {
        const d = stock().candles.slice(0, idx() + 1);
        const atr = TM.Ind.atr(d)[d.length - 1];
        const piv = TM.Ind.pivots(d.slice(-30), 2);
        let lvl;
        if (side === 'long') lvl = piv.lows.length ? d.slice(-30)[piv.lows[piv.lows.length - 1]].l : Math.min(...d.slice(-10).map((c) => c.l));
        else lvl = piv.highs.length ? d.slice(-30)[piv.highs[piv.highs.length - 1]].h : Math.max(...d.slice(-10).map((c) => c.h));
        $('#sw-stop').value = U.round(side === 'long' ? lvl - atr * 0.5 : lvl + atr * 0.5, 2);
        TM.Coach.say(`Stop placed beyond the last swing ${side === 'long' ? 'low' : 'high'} (${U.price(lvl)}) plus half an ATR (${U.price(atr)}) as a noise buffer.`);
        calc();
        lines();
      };
      $('#sw-2r').onclick = () => {
        const p = px(sel),
          st = +$('#sw-stop').value;
        if (!st) return U.toast('Set a stop first.', 'info');
        $('#sw-tp').value = U.round(p + (p - st) * 2, 2);
        calc();
        lines();
      };
      $('#sw-go').onclick = order;
      U.on($('#sw-pos'), 'click', 'button', (e, b) => {
        const p = camp.acct.positions.find((x) => x.id === b.dataset.id);
        if (p) closeManual(p);
      });
      U.on($('#sw-pos'), 'change', 'input', (e, inp) => {
        const p = camp.acct.positions.find((x) => x.id === inp.dataset.id);
        if (!p) return;
        const v = +inp.value || null;
        const cur = priceOf(p.sym);
        const f = inp.dataset.f;
        if (v && (f === 'stop' ? (p.side === 'long' ? v >= cur : v <= cur) : p.side === 'long' ? v <= cur : v >= cur)) {
          U.toast('That price is on the wrong side of the current price.', 'bad');
          inp.value = p[f] || '';
          return;
        }
        TM.Trading.modify(p, f, v);
        if (f === 'stop' && p.stopMoves.length && p.stopMoves[p.stopMoves.length - 1].widened) TM.Coach.say('You widened a swing stop. Ask yourself: has the reason for the trade changed, or are you avoiding a loss?');
        TM.Store.save();
        lines();
      });
    }
    function spec() {
      const p = px(sel);
      const st = +el.querySelector('#sw-stop').value || null;
      const tp = +el.querySelector('#sw-tp').value || null;
      const risk = +el.querySelector('#sw-risk').value || 0;
      const e = eq();
      const qty = st ? Math.min(Math.floor((e * risk) / 100 / Math.abs(p - st)), Math.floor((camp.acct.cash * 0.995) / p)) : 0;
      return { sym: stock().sym, side, qty, entry: p, stop: st, target: tp, lev: 1, mode: 'swing', feeRate: 0, equity: e };
    }
    function calc() {
      const sp = spec();
      const chk = TM.Trading.check(camp.acct, sp, sp.equity);
      const c = chk.calc;
      const box = el.querySelector('#sw-calc');
      if (!sp.stop) {
        box.innerHTML = '<span class="muted">Set a stop-loss: size is calculated from your risk %.</span>';
        return;
      }
      const daysToE = stock().earnDay - idx();
      box.innerHTML = `<div class="kv"><span>Shares</span><b class="mono">${sp.qty}</b></div><div class="kv"><span>Position value</span><b class="mono">${U.money(c.notional)}</b></div><div class="kv"><span>Risk</span><b class="mono">${c.risk != null ? U.money(c.risk) + ' (' + c.riskPct.toFixed(2) + '%)' : '—'}</b></div><div class="kv"><span>R:R</span><b class="mono">${c.rr != null ? c.rr.toFixed(2) + ':1' : '—'}</b></div>${chk.errors.map((x) => `<div class="down small">✕ ${x}</div>`).join('')}${chk.warnings.map((x) => `<div class="warn-t small">⚠ ${x}</div>`).join('')}${daysToE > 0 && daysToE <= 5 ? `<div class="warn-t small">⚠ Earnings in ${daysToE} trading day(s). Gap risk!</div>` : ''}`;
    }
    function lines() {
      if (!chart) return;
      const st = stock();
      const L = [];
      camp.acct.positions
        .filter((p) => p.sym === st.sym)
        .forEach((p) => {
          L.push({ id: 'e:' + p.id, price: p.entry, color: '#4d8dff', label: p.side === 'long' ? 'LONG' : 'SHORT' });
          if (p.stop) L.push({ id: 's:' + p.id, price: p.stop, color: '#f0465a', label: 'SL', draggable: true });
          if (p.target) L.push({ id: 't:' + p.id, price: p.target, color: '#16c784', label: 'TP', draggable: true });
        });
      const sv = +el.querySelector('#sw-stop').value,
        tv = +el.querySelector('#sw-tp').value;
      if (sv) L.push({ id: 'ps', price: sv, color: 'rgba(240,70,90,.6)', label: 'SL?', draggable: true });
      if (tv) L.push({ id: 'pt', price: tv, color: 'rgba(22,199,132,.6)', label: 'TP?', draggable: true });
      chart.setLines(L);
      const marks = [];
      camp.tradeIds.forEach((id) => {
        const t = s.trades.find((x) => x.id === id);
        if (t && t.sym === st.sym) marks.push({ i: t.openedBar, kind: t.side === 'long' ? 'buy' : 'sell' }, { i: t.closedBar, kind: 'dot', price: t.exit, color: t.pnl >= 0 ? '#16c784' : '#f0465a' });
      });
      camp.acct.positions.filter((p) => p.sym === st.sym).forEach((p) => marks.push({ i: p.openedBar, kind: p.side === 'long' ? 'buy' : 'sell' }));
      // event markers
      st.candles.slice(0, idx() + 1).forEach((c, i) => c.ev && i >= HIST - 10 && marks.push({ i, kind: 'dot', color: c.ev.kind === 'earn' ? '#a78bfa' : '#f2b84b', price: c.h, text: c.ev.kind === 'earn' ? 'E' : 'N' }));
      if (st.earnDay > idx()) {
        /* upcoming earnings indicator shown in calendar */
      }
      chart.setMarkers(marks);
    }
    function onDrag(id, price, final) {
      const p = U.round(price, 2);
      if (id === 'ps') el.querySelector('#sw-stop').value = p;
      else if (id === 'pt') el.querySelector('#sw-tp').value = p;
      else if (final && /^[st]:/.test(id)) {
        const pos = camp.acct.positions.find((x) => x.id === id.slice(2));
        if (pos) {
          const f = id[0] === 's' ? 'stop' : 'target';
          const cur = priceOf(pos.sym);
          const bad = f === 'stop' ? (pos.side === 'long' ? p >= cur : p <= cur) : pos.side === 'long' ? p <= cur : p >= cur;
          if (bad) U.toast('That price is on the wrong side of the current price.', 'bad');
          else TM.Trading.modify(pos, f, p);
          TM.Store.save();
          renderPos();
        }
      }
      if (final) lines();
      calc();
    }
    function order() {
      const sp = spec();
      if (!sp.stop) return U.toast('Set a stop-loss first — swing sizing is based on it.', 'bad');
      const chk = TM.Trading.check(camp.acct, sp, sp.equity);
      if (!chk.ok) return U.toast(chk.errors[0], 'bad');
      if (!(sp.qty > 0)) return U.toast('Position size is zero — widen the risk % or check the stop.', 'bad');
      const d = stock().candles.slice(0, idx() + 1);
      TM.Trading.open(camp.acct, Object.assign({}, sp, { ctx: TM.Market.context(d), bar: idx(), t: d[d.length - 1].t, meta: { sector: stock().sector } }));
      news(`Bought${side === 'short' ? ' (short)' : ''} ${sp.qty} ${sp.sym} @ ${U.price(sp.entry)} · stop ${U.price(sp.stop)}${sp.target ? ' · target ' + U.price(sp.target) : ''}`, 'trade');
      el.querySelector('#sw-stop').value = el.querySelector('#sw-tp').value = '';
      U.sound('fill');
      checkPortfolio();
      TM.Store.save();
      refresh();
    }
    function checkPortfolio() {
      const ps = camp.acct.positions;
      const sectors = new Set(ps.filter((p) => p.riskPct != null && p.riskPct <= 2.05).map((p) => p.meta.sector));
      if (sectors.size >= 3 && !camp.flags.portfolio) {
        camp.flags.portfolio = true;
        TM.Store.inc('swingPortfolio');
        U.toast('🌊 Diversified swing portfolio: 3 sectors, each ≤2% risk!', 'good', { ms: 5000 });
        TM.Progress.checkAchievements();
      }
    }
    function closeManual(p) {
      const d = idx();
      const t = TM.Trading.close(camp.acct, p, priceOf(p.sym), 'manual', { bar: d, t: G.stocks[0].candles[d].t });
      const heldDays = d - p.openedBar;
      const emotional = heldDays <= 2 && t.pnl < 0 && t.r != null && t.r > -0.5;
      record(t, { emotional });
    }
    function record(t, extra = {}) {
      camp.tradeIds.push(t.id);
      const st = G.stocks.find((x) => x.sym === t.sym);
      const heldEarnings = st.earnDay > t.openedBar && st.earnDay <= (t.closedBar != null ? t.closedBar : idx());
      if (t.exitReason === 'target' && t.closedBar - t.openedBar >= 5) TM.Store.inc('patientTargets');
      news(`Closed ${t.sym} (${t.exitReason}) @ ${U.price(t.exit)} · <b class="${U.cls(t.pnl)}">${U.smoney(t.pnl)}</b>`, t.pnl >= 0 ? 'good' : 'bad');
      TM.Store.save();
      return TM.Progress.afterTrade(t, { review: Object.assign({ heldEarnings }, extra) });
    }
    function news(t, kind = 'info') {
      camp.news.unshift({ d: camp.day + 1, t, kind });
      if (camp.news.length > 60) camp.news.pop();
    }
    async function advance(n) {
      if (busy) return;
      busy = true;
      for (let k = 0; k < n; k++) {
        if (camp.day >= DAYS - 1) break;
        camp.day++;
        const i = idx();
        // day's news
        let any = false;
        const mk = G.events['M' + i];
        if (mk) {
          news('🌍 ' + mk.t, 'event');
          any = true;
        }
        G.stocks.forEach((st) => {
          const c = st.candles[i];
          if (c.ev) {
            news((c.ev.kind === 'earn' ? '📊 ' : '📰 ') + c.ev.t, 'event');
            any = true;
          }
          if (st.earnDay === i + 1 && camp.acct.positions.some((p) => p.sym === st.sym)) {
            TM.Coach.say(`<b>${st.sym} reports earnings before tomorrow's open.</b> You hold a position. A gap can jump right over your stop. Consider reducing size or closing — or hold knowingly.`);
            news(`⚠ ${st.sym} earnings tomorrow — you are holding it.`, 'warn');
            if (n > 1) k = n; // stop the weekly fast-forward so the player can decide
          }
        });
        if (!any) news(U.pick(QUIET), 'quiet');
        // process positions: daily bar with gap
        const closed = [];
        G.stocks.forEach((st) => {
          const c = st.candles[i];
          TM.Trading.process(camp.acct, st.sym, c, { gap: true, bar: i, t: c.t }).forEach((t) => closed.push(t));
        });
        const e = eq();
        camp.peak = Math.max(camp.peak, e);
        camp.maxDD = Math.max(camp.maxDD, ((camp.peak - e) / camp.peak) * 100);
        if (camp.day % 5 === 0) {
          if (e > camp.weekStart) {
            TM.Store.inc('greenWeeks');
            news(`✅ Week ${camp.day / 5} closed green: ${U.smoney(e - camp.weekStart)}`, 'good');
          } else news(`Week ${camp.day / 5}: ${U.smoney(e - camp.weekStart)}`, 'info');
          camp.weekStart = e;
          TM.Progress.checkAchievements();
        }
        TM.Store.save();
        await animateDay();
        if (closed.length) {
          for (const t of closed) await record(t);
          break;
        }
      }
      busy = false;
      refresh();
      if (camp.day >= DAYS - 1) finish();
    }
    function animateDay() {
      return new Promise((res) => {
        refresh();
        setTimeout(res, S().settings.reduceMotion ? 0 : 120);
      });
    }
    function renderPos() {
      const box = el.querySelector('#sw-pos');
      const ps = camp.acct.positions;
      box.innerHTML = ps.length
        ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Stock</th><th>Side</th><th>Shares</th><th>Entry</th><th>Last</th><th>P&L</th><th>Days</th><th>Stop</th><th>Target</th><th></th></tr></thead><tbody>${ps
            .map((p) => {
              const last = priceOf(p.sym);
              const pnl = TM.Trading.pnl(p, last);
              return `<tr><td><b>${p.sym}</b><br><small class="muted">${p.meta.sector}</small></td><td class="${p.side === 'long' ? 'up' : 'down'}">${p.side.toUpperCase()}</td><td class="mono">${p.qty}</td><td class="mono">${U.price(p.entry)}</td><td class="mono">${U.price(last)}</td><td class="mono ${U.cls(pnl)}">${U.smoney(pnl)}${p.riskPlanned ? `<br><small>${(pnl / p.riskPlanned).toFixed(2)}R</small>` : ''}</td><td class="mono">${idx() - p.openedBar}</td><td><input class="mini-in" type="number" step="0.01" data-id="${p.id}" data-f="stop" value="${p.stop || ''}" aria-label="Stop"></td><td><input class="mini-in" type="number" step="0.01" data-id="${p.id}" data-f="target" value="${p.target || ''}" aria-label="Target"></td><td><button class="btn btn-sm" data-id="${p.id}">Close</button></td></tr>`;
            })
            .join('')}</tbody></table></div>`
        : '<p class="muted small">No open positions. Find a setup: an uptrend pulling back to the EMA 20, or a breakout from a base.</p>';
    }
    function refresh(fit) {
      const i = idx();
      const st = stock();
      el.querySelector('#sw-day').textContent = camp.day + 1;
      el.querySelector('#sw-date').textContent = U.dow(st.candles[i].t) + ' ' + U.md(st.candles[i].t);
      const e = eq();
      el.querySelector('#sw-acct').innerHTML = `<div><span class="muted small">Bankroll</span><b class="mono">${U.money(e)}</b></div><div><span class="muted small">Campaign P&L</span><b class="mono ${U.cls(e - 10000)}">${U.smoney(e - 10000)}</b></div><div><span class="muted small">Cash</span><b class="mono">${U.money(camp.acct.cash)}</b></div>`;
      el.querySelector('#sw-list').innerHTML = G.stocks
        .map((x, k) => {
          const c = x.candles[i],
            pc = x.candles[i - 1];
          const ch = (c.c / pc.c - 1) * 100;
          const hold = camp.acct.positions.some((p) => p.sym === x.sym);
          return `<button class="tw-row ${k === sel ? 'on' : ''}" data-k="${k}"><span class="tw-s"><b>${x.sym}${hold ? ' ●' : ''}</b><small class="muted">${x.sector}</small></span><span class="tw-p mono">${U.price(c.c)}<small class="${U.cls(ch)}">${U.pct(ch)}</small></span></button>`;
        })
        .join('');
      el.querySelector('#sw-cal').innerHTML = '<b class="small">Earnings calendar</b>' + G.stocks.map((x) => {
        const dd = x.earnDay - i;
        return `<div class="small ${dd > 0 && dd <= 3 ? 'warn-t' : 'muted'}">${x.sym}: ${dd > 0 ? 'in ' + dd + ' day' + (dd > 1 ? 's' : '') : dd === 0 ? 'TODAY' : 'reported'}</div>`;
      }).join('');
      const c = st.candles[i];
      const d = st.candles.slice(0, i + 1);
      const ctx = TM.Market.context(d);
      el.querySelector('#sw-head').innerHTML = `<b class="big">${st.sym}</b> <span class="muted">${st.name}</span> <span class="pill">${st.sector}</span> <span class="sim-tag">SIM</span> <span class="mono">${U.price(c.c)}</span> <span class="small muted">· trend ${ctx.trend} · ATR ${U.price(ctx.atr)} · RSI ${ctx.rsi ? ctx.rsi.toFixed(0) : '–'}</span>`;
      chart.o.symbol = st.sym;
      chart.setData(d, { fit: !!fit, fitBars: 100 });
      el.querySelector('#sw-news').innerHTML = camp.news.map((n) => `<li class="fd-${n.kind}"><span class="mono muted">D${n.d}</span> ${n.t}</li>`).join('') || '<li class="muted">News will appear as the days pass.</li>';
      el.querySelector('#sw-next').disabled = el.querySelector('#sw-week').disabled = camp.day >= DAYS - 1;
      renderPos();
      lines();
      calc();
    }
    function finish() {
      if (!camp) return;
      const i = idx();
      camp.acct.positions.slice().forEach((p) => {
        const t = TM.Trading.close(camp.acct, p, priceOf(p.sym), 'manual', { bar: i, t: G.stocks[0].candles[i].t });
        camp.tradeIds.push(t.id);
        TM.Progress.recordTrade(t);
      });
      const e = camp.acct.cash;
      const ret = (e / 10000 - 1) * 100;
      const trades = camp.tradeIds.map((id) => s.trades.find((x) => x.id === id)).filter(Boolean);
      const avg = trades.length ? trades.reduce((a, t) => a + t.review.score, 0) / trades.length : null;
      const grade = avg == null ? '—' : avg >= 90 ? 'A' : avg >= 78 ? 'B' : avg >= 62 ? 'C' : avg >= 45 ? 'D' : 'F';
      const bench = G.stocks.reduce((a, st) => a + (st.candles[i].c / st.candles[HIST].c - 1) * 100, 0) / G.stocks.length;
      const xp = 75 + Math.min(75, trades.filter((t) => t.review.score >= 78).length * 15);
      s.counters.swingCampaigns++;
      s.swing.history = (s.swing.history || []).concat([{ ret, trades: trades.length, grade, at: Date.now() }]).slice(-20);
      s.swing.campaign = null;
      TM.Store.save();
      TM.Progress.addXP(xp, 'Swing campaign complete');
      TM.Progress.checkAchievements();
      U.modal({
        title: 'Campaign report',
        wide: true,
        body: `<div class="eod"><div class="eod-stats"><div><span>Return</span><b class="mono ${U.cls(ret)}">${U.pct(ret)}</b></div><div><span>Buy & hold (avg of 4)</span><b class="mono ${U.cls(bench)}">${U.pct(bench)}</b></div><div><span>Max drawdown</span><b class="mono">${camp.maxDD.toFixed(1)}%</b></div><div><span>Trades</span><b class="mono">${trades.length}</b></div><div><span>Avg process</span><b class="grade g-${grade}">${grade}</b></div><div><span>XP</span><b class="mono xp">+${xp}</b></div></div>
          <ul class="bul">${[
            trades.length ? '' : '<li>No trades this campaign. Patience is good — but practise executing at least a few planned setups.</li>',
            trades.some((t) => t.exitReason === 'gap-stop') ? '<li>At least one stop was <b>gapped through</b>. That is why swing traders size smaller into earnings and news.</li>' : '',
            trades.filter((t) => t.closedBar - t.openedBar <= 2 && t.exitReason === 'manual' && t.pnl < 0).length >= 2 ? '<li>Several quick manual exits for small losses. Swing trades need room — were those emotional exits?</li>' : '',
            ret > bench ? '<li>You outperformed simply holding the four stocks. Nice work managing risk.</li>' : '<li>Buy & hold beat your trading this time. That happens! Focus on process quality and the results follow over many campaigns.</li>',
          ].join('')}</ul></div>`,
        actions: [{ label: 'Close', cls: 'btn-primary' }],
        onClose: () => {
          camp = null;
          if (chart) {
            chart.destroy();
            chart = null;
          }
          lobby();
        },
      });
    }
    function play() {
      G = generate(camp.seed);
      sel = 0;
      render();
      if (!camp.news.length) {
        news('Campaign started. Study the daily charts: which stocks are trending? Where are the pullbacks? Check the earnings calendar before entering.', 'coach');
        refresh();
      }
      TM.Coach.setContext({
        view: 'swing',
        label: 'Swing trading sim',
        hint: () => {
          const st = stock();
          const d = st.candles.slice(0, idx() + 1);
          const ctx = TM.Market.context(d);
          const dd = st.earnDay - idx();
          return `${st.sym}: daily trend <b>${ctx.trend}</b>, price ${ctx.price > ctx.ema20 ? 'above' : 'below'} the EMA 20, ATR ${U.price(ctx.atr)}. ${dd > 0 && dd <= 5 ? `<b>Earnings in ${dd} days</b> — size down or wait.` : ''} Swing setups: pullback to a rising EMA 20 in an uptrend, stop below the swing low.`;
        },
      });
    }
    if (camp) play();
    else lobby();
    return {
      destroy() {
        if (chart) chart.destroy();
        TM.Store.save();
      },
    };
  };
})();

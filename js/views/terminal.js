/* TRADE MASTERY — trading terminal shared by Practice Trading (stocks) and Crypto Trading.
   Paper trading only: simulated prices, simulated fills, simulated account. */
(function () {
  'use strict';
  const U = TM.U;
  const S = () => TM.Store.s;
  const IND_NAMES = { ema9: 'EMA 9', ema20: 'EMA 20', ema50: 'EMA 50', vwap: 'VWAP', bb: 'Bollinger', rsi: 'RSI', macd: 'MACD' };

  TM.Terminal = function (el, opt) {
    const mode = opt.mode;
    const isCrypto = mode === 'crypto';
    const assets = TM.Live.ASSETS.filter((a) => (isCrypto ? a.type === 'crypto' : a.type === 'stock'));
    const s = S();
    s.ui = s.ui || {};
    const ui = (s.ui[mode] = Object.assign({ sym: assets[0].sym, tf: '1m', ind: { ema9: true, ema20: true }, panes: [], levels: {} }, s.ui[mode] || {}));
    if (!assets.find((a) => a.sym === ui.sym)) ui.sym = assets[0].sym;
    const tk = { side: 'long', type: 'market', size: 'risk', qty: 10, amount: 1000, risk: 1, stop: '', target: '', limit: '', lev: isCrypto ? 2 : 1, confirm: false };
    let tab = 'pos';
    let drawMode = false;

    el.innerHTML = `
      ${isCrypto ? '<div class="cx-strip" id="cx-strip"></div>' : ''}
      <div class="term">
        <aside class="term-watch card"><div class="tw-h"><b>${isCrypto ? 'Crypto pairs' : 'Watchlist'}</b><span class="sim-tag">SIM</span></div><div class="tw-list"></div></aside>
        <section class="term-center">
          <div class="term-head card">
            <div class="th-l"><div class="th-sym"></div><div class="th-px mono"></div></div>
            <div class="th-info small muted"></div>
          </div>
          <div class="term-tools">
            <div class="seg seg-sm" id="tf">${Object.keys(TM.Live.TF).map((t) => `<button data-v="${t}">${t}</button>`).join('')}</div>
            <div class="tg-row" id="ind">${Object.keys(IND_NAMES).map((k) => `<button class="tg" data-k="${k}">${IND_NAMES[k]}</button>`).join('')}</div>
            <div class="tg-row"><button class="tg" id="draw">✎ Draw level</button><button class="tg" id="clear-lv" title="Remove your drawn levels">Clear levels</button></div>
          </div>
          <div class="term-chart card"><div class="tc-box"></div></div>
          <div class="term-tabs card">
            <div class="tabs"><button data-t="pos" class="on">Positions <span class="cnt" id="c-pos"></span></button><button data-t="ord">Orders <span class="cnt" id="c-ord"></span></button><button data-t="hist">History</button></div>
            <div class="tab-body"></div>
          </div>
        </section>
        <aside class="term-ticket card">
          <div class="acct-mini"></div>
          <div class="seg seg-side" id="tk-side"><button data-v="long" class="on buy">Buy / Long</button><button data-v="short" class="sell">Sell / Short</button></div>
          <div class="seg seg-sm" id="tk-type"><button data-v="market" class="on">Market</button><button data-v="limit">Limit</button></div>
          <label class="fld" id="tk-limit-f" hidden>Limit price<input type="number" step="any" id="tk-limit"></label>
          <div class="fld"><span>Position size</span><div class="seg seg-sm" id="tk-size"><button data-v="risk" class="on">Risk %</button><button data-v="qty">${isCrypto ? 'Coins' : 'Shares'}</button><button data-v="amount">$ Value</button></div></div>
          <label class="fld" id="tk-sizef"><span id="tk-size-l">Risk % of account</span><input type="number" step="any" id="tk-sizev" value="1"></label>
          <label class="fld"><span>Stop-loss <button type="button" class="link" id="tk-atr" title="Suggest a stop beyond the recent swing">suggest</button></span><input type="number" step="any" id="tk-stop" placeholder="Where are you wrong?"></label>
          <label class="fld"><span>Take-profit <button type="button" class="link" id="tk-2r" title="Set target at 2× the stop distance">2R</button></span><input type="number" step="any" id="tk-target" placeholder="Planned exit"></label>
          ${isCrypto ? `<label class="fld"><span>Leverage <b class="mono" id="tk-lev-v">2×</b></span><input type="range" min="1" max="25" value="2" id="tk-lev"></label>` : ''}
          <div class="tk-sum"></div>
          <ul class="tk-warn"></ul>
          <button class="btn btn-buy btn-block btn-lg" id="tk-go">Buy</button>
          <p class="tiny muted center">Simulated order · no real money</p>
        </aside>
      </div>
      ${isCrypto ? '<div class="grid g2 cx-bottom"><section class="card" id="cx-learn"></section><section class="card" id="cx-real"></section></div>' : ''}`;

    const $ = (sel) => el.querySelector(sel);
    const chart = new TM.Chart($('.tc-box'), {
      height: window.innerWidth < 700 ? 320 : 420,
      overlays: ui.ind,
      panes: ui.panes,
      symbol: ui.sym,
      onLineDrag: onDrag,
      onPriceClick: (p) => {
        if (!drawMode) return;
        ui.levels[ui.sym] = (ui.levels[ui.sym] || []).concat([U.round(p, U.decFor(p))]).slice(-8);
        drawMode = false;
        chart.mode = 'normal';
        $('#draw').classList.remove('on');
        TM.Store.save();
        drawLines();
      },
      onCandleClick: () => {},
    });

    /* -------- helpers -------- */
    const def = () => TM.Live.def(ui.sym);
    const series = () => TM.Live.series(ui.sym, ui.tf);
    const dec = (p) => U.decFor(p);
    const equity = () => TM.mainEquity();
    const qtyDec = () => (isCrypto ? (def().start > 1000 ? 4 : def().start > 10 ? 3 : 0) : 0);
    const roundQty = (q) => {
      const d = qtyDec();
      const m = 10 ** d;
      return Math.floor(q * m) / m;
    };
    function entryPrice() {
      const q = TM.Live.quote(ui.sym);
      if (tk.type === 'limit' && +tk.limit > 0) return +tk.limit;
      return tk.side === 'long' ? q.ask : q.bid;
    }
    function computeQty(entry) {
      const stop = +tk.stop;
      if (tk.size === 'qty') return roundQty(+tk.qty || 0);
      if (tk.size === 'amount') return roundQty((+tk.amount || 0) / entry);
      if (!(stop > 0) || stop === entry) return 0;
      const riskD = (equity() * (+tk.risk || 0)) / 100;
      const want = roundQty(riskD / Math.abs(entry - stop));
      // never ask for more than the account can afford: cap at buying power (leaving room for fees)
      const lev = isCrypto ? tk.lev : 1;
      const maxQ = roundQty((s.account.cash * lev * 0.995) / (entry * (1 + (isCrypto ? 0.0005 * lev : 0))));
      tk.capped = want > maxQ;
      return Math.min(want, maxQ);
    }
    function spec() {
      const entry = entryPrice();
      const qty = computeQty(entry);
      return {
        sym: ui.sym,
        side: tk.side,
        qty,
        entry,
        stop: +tk.stop > 0 ? +tk.stop : null,
        target: +tk.target > 0 ? +tk.target : null,
        lev: isCrypto ? tk.lev : 1,
        mode,
        feeRate: isCrypto ? 0.0005 : 0,
        equity: equity(),
      };
    }

    /* -------- rendering -------- */
    function renderWatch() {
      $('.tw-list').innerHTML = assets
        .map((a) => {
          const p = TM.Live.price(a.sym);
          const ch = TM.Live.change(a.sym);
          return `<button class="tw-row ${a.sym === ui.sym ? 'on' : ''}" data-s="${a.sym}"><span class="tw-s"><b>${isCrypto ? a.pair : a.sym}</b><small class="muted">${a.name}</small></span><span class="tw-p mono">${U.price(p)}<small class="${U.cls(ch)}">${U.pct(ch)}</small></span></button>`;
        })
        .join('');
    }
    function renderHead() {
      const d = def();
      const p = TM.Live.price(d.sym);
      const ch = TM.Live.change(d.sym);
      const q = TM.Live.quote(d.sym);
      $('.th-sym').innerHTML = `<b>${isCrypto ? d.pair : d.sym}</b> <span class="muted">${d.name}</span> <span class="pill">${d.sector}</span> <span class="sim-tag">SIMULATED PRICE</span>`;
      $('.th-px').innerHTML = `<span class="big ${U.cls(ch)}">${U.price(p)}</span> <span class="${U.cls(ch)}">${U.pct(ch)} 24h</span>`;
      $('.th-info').innerHTML = `Bid <b class="up">${U.price(q.bid)}</b> · Ask <b class="down">${U.price(q.ask)}</b> · Spread ${U.price(q.spread, U.decFor(p))} · Mkt cap ${U.big(TM.Live.mcap(d.sym))} · 24h vol ${U.big(TM.Live.vol24(d.sym))}<br><span>${d.about}</span>`;
    }
    function renderAcct() {
      const acct = s.account;
      const eq = equity();
      const un = TM.Trading.unrealized(acct, TM.mainPrice);
      $('.acct-mini').innerHTML = `<div><span class="muted small">Equity</span><b class="mono">${U.money(eq)}</b></div><div><span class="muted small">Buying power</span><b class="mono">${U.money(acct.cash)}</b></div><div><span class="muted small">Unrealised</span><b class="mono ${U.cls(un)}">${U.smoney(un)}</b></div>`;
    }
    function renderTicket() {
      const sp = spec();
      const chk = TM.Trading.check(s.account, sp, sp.equity);
      const c = chk.calc;
      const d = def();
      $('#tk-size-l').textContent = { risk: 'Risk % of account', qty: isCrypto ? 'Coins' : 'Shares', amount: 'Position value ($)' }[tk.size];
      const lines = [
        ['Est. entry', U.price(sp.entry)],
        [isCrypto ? 'Coins' : 'Shares', sp.qty ? U.num(sp.qty, qtyDec()) : '—'],
        ['Position value', U.money(c.notional)],
      ];
      if (isCrypto) lines.push(['Margin used', U.money(c.margin)], ['Fee (0.05%)', U.money(c.fee)]);
      lines.push(['Risk if stopped', c.risk != null ? `<span class="${c.riskPct > 2 ? 'down' : ''}">${U.money(c.risk)} (${c.riskPct.toFixed(2)}%)</span>` : '<span class="down">undefined</span>']);
      lines.push(['Reward : Risk', c.rr != null ? `<span class="${c.rr >= 2 ? 'up' : c.rr < 1 ? 'down' : ''}">${c.rr.toFixed(2)} : 1</span>` : '—']);
      if (isCrypto && c.liq) lines.push(['Liquidation', `<span class="down">${U.price(c.liq)}</span>`]);
      $('.tk-sum').innerHTML = lines.map(([k, v]) => `<div class="kv"><span>${k}</span><b class="mono">${v}</b></div>`).join('');
      if (tk.size === 'risk' && !(+tk.stop > 0)) chk.errors = ['Risk % sizing needs a stop-loss price — the size is calculated from it.'];
      if (tk.size === 'risk' && tk.capped && sp.qty > 0) chk.warnings.unshift(`Size capped by your buying power, so you are risking ${c.riskPct != null ? c.riskPct.toFixed(2) : '?'}% instead of ${tk.risk}%. Your stop is very tight — that is fine, just know the position is as large as the account allows.`);
      $('.tk-warn').innerHTML = chk.errors.map((e) => `<li class="err">✕ ${e}</li>`).join('') + chk.warnings.map((w) => `<li>⚠ ${w}</li>`).join('');
      const go = $('#tk-go');
      const verb = tk.type === 'limit' ? 'Place limit ' : '';
      go.className = 'btn btn-block btn-lg ' + (tk.side === 'long' ? 'btn-buy' : 'btn-sell');
      go.disabled = !!chk.errors.length || !(sp.qty > 0);
      go.textContent = tk.confirm && chk.warnings.length ? `Place anyway (${chk.warnings.length} warning${chk.warnings.length > 1 ? 's' : ''})` : `${verb}${tk.side === 'long' ? 'Buy' : 'Sell short'} ${sp.qty ? U.num(sp.qty, qtyDec()) : ''} ${d.sym}`;
      return { sp, chk };
    }
    function tfIndex(t) {
      const arr = series();
      let lo = 0,
        hi = arr.length - 1;
      if (!arr.length || t < arr[0].t) return -1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (arr[mid].t <= t) lo = mid;
        else hi = mid - 1;
      }
      return lo;
    }
    function drawLines() {
      const lines = [];
      const sym = ui.sym;
      (ui.levels[sym] || []).forEach((p, k) => lines.push({ id: 'lv' + k, price: p, color: '#f2b84b', label: 'Level', noFit: true, dash: [8, 4] }));
      s.account.positions
        .filter((p) => p.sym === sym)
        .forEach((p) => {
          lines.push({ id: 'e:' + p.id, price: p.entry, color: '#4d8dff', label: (p.side === 'long' ? 'L ' : 'S ') + U.num(p.qty, qtyDec()) });
          if (p.stop) lines.push({ id: 's:' + p.id, price: p.stop, color: '#f0465a', label: 'SL', draggable: true });
          if (p.target) lines.push({ id: 't:' + p.id, price: p.target, color: '#16c784', label: 'TP', draggable: true });
          if (p.liq) lines.push({ id: 'l:' + p.id, price: p.liq, color: '#ff9f43', label: 'LIQ', noFit: true });
        });
      s.account.orders.filter((o) => o.sym === sym).forEach((o) => lines.push({ id: 'o:' + o.id, price: o.limit, color: '#a78bfa', label: 'LIMIT', dash: [3, 3] }));
      if (+tk.stop > 0) lines.push({ id: 'tk-s', price: +tk.stop, color: 'rgba(240,70,90,.7)', label: 'SL?', draggable: true });
      if (+tk.target > 0) lines.push({ id: 'tk-t', price: +tk.target, color: 'rgba(22,199,132,.7)', label: 'TP?', draggable: true });
      if (tk.type === 'limit' && +tk.limit > 0) lines.push({ id: 'tk-l', price: +tk.limit, color: 'rgba(167,139,250,.8)', label: 'Entry?', draggable: true });
      chart.setLines(lines);
      const marks = [];
      s.trades
        .filter((t) => t.sym === sym && t.mode === mode && t.openedT)
        .slice(-20)
        .forEach((t) => {
          const i = tfIndex(t.openedT);
          if (i >= 0) marks.push({ i, kind: t.side === 'long' ? 'buy' : 'sell', text: t.side === 'long' ? 'B' : 'S' });
          const j = tfIndex(t.closedT);
          if (t.closedT && j >= 0) marks.push({ i: j, kind: 'dot', color: t.pnl >= 0 ? '#16c784' : '#f0465a', price: t.exit });
        });
      s.account.positions.filter((p) => p.sym === sym && p.openedT).forEach((p) => {
        const i = tfIndex(p.openedT);
        if (i >= 0) marks.push({ i, kind: p.side === 'long' ? 'buy' : 'sell', text: p.side === 'long' ? 'B' : 'S' });
      });
      chart.setMarkers(marks);
    }
    function onDrag(id, price, final) {
      const p = U.round(price, dec(price));
      if (id === 'tk-s') {
        tk.stop = p;
        $('#tk-stop').value = p;
      } else if (id === 'tk-t') {
        tk.target = p;
        $('#tk-target').value = p;
      } else if (id === 'tk-l') {
        tk.limit = p;
        $('#tk-limit').value = p;
      } else if (/^[st]:/.test(id) && final) {
        const pos = s.account.positions.find((x) => x.id === id.slice(2));
        if (pos) {
          const field = id[0] === 's' ? 'stop' : 'target';
          const old = pos[field];
          const err = validateMod(pos, field, p);
          if (err) {
            U.toast(err, 'bad');
            pos[field] = old;
          } else {
            TM.Trading.modify(pos, field, p);
            if (field === 'stop' && pos.stopMoves.length && pos.stopMoves[pos.stopMoves.length - 1].widened) TM.Coach.say('You just moved your stop <b>further away</b>. That increases your risk beyond the plan. If the reason for the trade is still valid, the original stop should be too.');
            U.toast(`${field === 'stop' ? 'Stop-loss' : 'Take-profit'} moved to ${U.price(p)}`, 'info');
          }
          TM.Store.save();
          renderTabs();
        }
        drawLines();
        return;
      }
      if (!final) {
        renderTicket();
        return;
      }
      tk.confirm = false;
      renderTicket();
      drawLines();
    }
    function validateMod(pos, field, v) {
      const px = TM.Live.price(pos.sym);
      if (field === 'stop') {
        if (pos.side === 'long' && v >= px) return 'A long position’s stop must be below the current price.';
        if (pos.side === 'short' && v <= px) return 'A short position’s stop must be above the current price.';
      } else {
        if (pos.side === 'long' && v <= px) return 'A long position’s target must be above the current price.';
        if (pos.side === 'short' && v >= px) return 'A short position’s target must be below the current price.';
      }
      return null;
    }
    function renderTabs() {
      const acct = s.account;
      const mine = acct.positions.filter((p) => p.mode === mode);
      const ords = acct.orders.filter((o) => o.mode === mode);
      $('#c-pos').textContent = mine.length || '';
      $('#c-ord').textContent = ords.length || '';
      const b = $('.tab-body');
      if (tab === 'pos') {
        if (!mine.length) {
          b.innerHTML = `<div class="empty">No open ${isCrypto ? 'crypto' : 'stock'} positions. Use the order ticket to place a simulated trade.<br><span class="muted small">Tip: set a stop first, then use "Risk %" sizing so a loss costs exactly what you planned.</span></div>`;
          return;
        }
        b.innerHTML = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Asset</th><th>Side</th><th>Size</th><th>Entry</th><th>Last</th><th>P&L</th><th>Stop</th><th>Target</th>${isCrypto ? '<th>Liq.</th>' : ''}<th></th></tr></thead><tbody>${mine
          .map((p) => {
            const last = TM.Live.price(p.sym);
            const pnl = TM.Trading.pnl(p, last);
            const r = p.riskPlanned ? pnl / p.riskPlanned : null;
            return `<tr data-id="${p.id}"><td><b>${p.sym}</b>${p.lev > 1 ? ` <span class="pill">${p.lev}×</span>` : ''}</td><td class="${p.side === 'long' ? 'up' : 'down'}">${p.side.toUpperCase()}</td><td class="mono">${U.num(p.qty, qtyDec())}</td><td class="mono">${U.price(p.entry)}</td><td class="mono">${U.price(last)}</td><td class="mono ${U.cls(pnl)}">${U.smoney(pnl)}${r != null ? `<br><small>${r >= 0 ? '+' : ''}${r.toFixed(2)}R</small>` : ''}</td>
            <td><input class="mini-in" type="number" step="any" data-f="stop" value="${p.stop || ''}" placeholder="none" aria-label="Stop-loss"></td><td><input class="mini-in" type="number" step="any" data-f="target" value="${p.target || ''}" placeholder="none" aria-label="Take-profit"></td>${isCrypto ? `<td class="mono down">${p.liq ? U.price(p.liq) : '—'}</td>` : ''}
            <td class="nowrap"><button class="btn btn-sm btn-ghost" data-a="be" title="Move stop to breakeven">BE</button> <button class="btn btn-sm" data-a="close">Close</button></td></tr>`;
          })
          .join('')}</tbody></table></div>`;
      } else if (tab === 'ord') {
        b.innerHTML = ords.length
          ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Asset</th><th>Side</th><th>Size</th><th>Limit</th><th>Stop</th><th>Target</th><th></th></tr></thead><tbody>${ords.map((o) => `<tr data-oid="${o.id}"><td><b>${o.sym}</b></td><td class="${o.side === 'long' ? 'up' : 'down'}">${o.side.toUpperCase()}</td><td class="mono">${U.num(o.qty, qtyDec())}</td><td class="mono">${U.price(o.limit)}</td><td class="mono">${o.stop ? U.price(o.stop) : '—'}</td><td class="mono">${o.target ? U.price(o.target) : '—'}</td><td><button class="btn btn-sm btn-ghost" data-a="cancel">Cancel</button></td></tr>`).join('')}</tbody></table></div>`
          : '<div class="empty">No working limit orders.</div>';
      } else {
        const h = s.trades.filter((t) => t.mode === mode).slice(-60).reverse();
        b.innerHTML = h.length
          ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Closed</th><th>Asset</th><th>Side</th><th>Entry → Exit</th><th>P&L</th><th>R</th><th>Process</th><th></th></tr></thead><tbody>${h
              .map((t) => `<tr><td class="small muted">${U.dateTime(t.closedAt)}</td><td><b>${t.sym}</b></td><td class="${t.side === 'long' ? 'up' : 'down'}">${t.side.toUpperCase()}</td><td class="mono">${U.price(t.entry)} → ${U.price(t.exit)}</td><td class="mono ${U.cls(t.pnl)}">${U.smoney(t.pnl)}</td><td class="mono">${t.r != null ? t.r.toFixed(2) : '—'}</td><td><span class="grade g-${t.review ? t.review.grade : 'C'}">${t.review ? t.review.grade : '—'}</span></td><td><button class="btn btn-sm btn-ghost" data-rv="${t.id}">Review</button></td></tr>`)
              .join('')}</tbody></table></div>`
          : '<div class="empty">No closed trades yet.</div>';
      }
    }
    function updateLivePnl() {
      if (tab !== 'pos') return;
      U.$$('.tab-body tr[data-id]', el).forEach((tr) => {
        const p = s.account.positions.find((x) => x.id === tr.dataset.id);
        if (!p) return;
        const last = TM.Live.price(p.sym);
        const pnl = TM.Trading.pnl(p, last);
        const r = p.riskPlanned ? pnl / p.riskPlanned : null;
        tr.children[4].textContent = U.price(last);
        tr.children[5].className = 'mono ' + U.cls(pnl);
        tr.children[5].innerHTML = U.smoney(pnl) + (r != null ? `<br><small>${r >= 0 ? '+' : ''}${r.toFixed(2)}R</small>` : '');
      });
    }
    function setChart() {
      chart.o.symbol = isCrypto ? def().pair : ui.sym;
      chart.setData(series(), { fit: true, fitBars: 110 });
      drawLines();
      U.$$('#tf button', el).forEach((b) => b.classList.toggle('on', b.dataset.v === ui.tf));
      U.$$('#ind .tg', el).forEach((b) => b.classList.toggle('on', ui.panes.includes(b.dataset.k) || !!ui.ind[b.dataset.k]));
    }

    /* -------- crypto extras -------- */
    function renderStrip() {
      if (!isCrypto) return;
      const t = TM.Live.simT;
      const fr = TM.Live.funding(ui.sym);
      const nextF = 28800 - (t % 28800);
      const storm = TM.Live.stormActive();
      const m = S().market;
      const left = storm && m.storm ? Math.max(0, m.storm.end - m.ticks) : 0;
      $('#cx-strip').innerHTML = `<div class="cx-i"><span class="muted small">Market clock (UTC) · 24/7</span><b class="mono">${U.dow(t)} ${U.md(t)} ${U.hm(t)}</b></div>
        <div class="cx-i"><span class="muted small">BTC dominance (sim)</span><b class="mono">${TM.Live.dominance().toFixed(1)}%</b></div>
        <div class="cx-i"><span class="muted small">${ui.sym} funding / 8h</span><b class="mono ${fr > 0.0004 ? 'down' : fr < 0 ? 'up' : ''}">${(fr * 100).toFixed(4)}%</b></div>
        <div class="cx-i"><span class="muted small">Next funding in</span><b class="mono">${Math.floor(nextF / 3600)}h ${Math.floor((nextF % 3600) / 60)}m</b></div>
        <div class="cx-i cx-storm">${storm ? `<span class="storm-on">🌪️ VOLATILITY STORM · ${Math.ceil((left * 0.4) / (S().settings.speed || 1))}s left</span>` : `<button class="btn btn-sm btn-ghost" id="storm-go" title="Triple the volatility for ~3 minutes">🌪️ Start volatility storm</button>`}</div>`;
      const sg = $('#storm-go');
      if (sg)
        sg.onclick = () => {
          if (!S().settings.speed) return U.toast('Unpause the market first (Settings → market speed).', 'info');
          m.storm = { end: m.ticks + 450, engaged: false, liq: S().counters.liquidations };
          TM.Live.storm(true);
          TM.Store.save();
          TM.Coach.say('🌪️ <b>Volatility storm!</b> Crypto volatility just tripled for about 3 minutes. To survive: low leverage (2–3×), a stop well inside your liquidation price, and small size.');
          renderStrip();
        };
    }
    function renderCryptoLearn() {
      if (!isCrypto) return;
      $('#cx-learn').innerHTML = `<h3>Crypto 101 — quick reference</h3>
        <div class="cards4 small">
          <div><b>Pairs</b><p>BTC/USD = dollars per 1 BTC. You can buy fractions.</p></div>
          <div><b>24/7</b><p>No closing bell — risk never sleeps. Weekends can be volatile.</p></div>
          <div><b>Funding</b><p>Leveraged longs pay shorts every 8h when funding is positive.</p></div>
          <div><b>Liquidation</b><p>≈ 100% ÷ leverage away. Keep it far beyond your stop.</p></div>
          <div><b>Dominance</b><p>BTC share of the crypto market. Falling = traders chasing alts.</p></div>
          <div><b>Altcoins</b><p>Usually follow BTC with bigger moves both ways.</p></div>
        </div>
        <div class="btn-row"><a class="btn btn-sm btn-ghost" href="#lesson-C-1">Crypto track lessons →</a><a class="btn btn-sm btn-ghost" href="#scenario-H">Long-squeeze scenario →</a></div>`;
    }
    function renderReal() {
      if (!isCrypto) return;
      const box = $('#cx-real');
      box.innerHTML = `<h3>Real market reference <span class="pill pill-real">REAL DATA · view only</span></h3><p class="muted small">Optional: load real prices and real historical daily candles from public market-data APIs. Real data is shown for comparison only — your account always trades the simulated market.</p><div class="btn-row"><button class="btn btn-sm" id="real-px">Load real prices</button><button class="btn btn-sm btn-ghost" id="real-chart">Real ${ui.sym} daily chart</button></div><div id="real-out" class="small"></div>`;
      box.querySelector('#real-px').onclick = loadRealPrices;
      box.querySelector('#real-chart').onclick = () => loadRealChart(ui.sym);
    }
    const CG = { BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', XRP: 'ripple', DOGE: 'dogecoin' };
    async function fetchJSON(url, ms = 6000) {
      const ctl = new AbortController();
      const id = setTimeout(() => ctl.abort(), ms);
      try {
        const r = await fetch(url, { signal: ctl.signal });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return await r.json();
      } finally {
        clearTimeout(id);
      }
    }
    async function loadRealPrices() {
      const out = $('#real-out');
      out.innerHTML = '<span class="muted">Loading real prices…</span>';
      try {
        const j = await fetchJSON('https://api.coingecko.com/api/v3/simple/price?ids=' + Object.values(CG).join(',') + '&vs_currencies=usd&include_24hr_change=true');
        out.innerHTML = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Coin</th><th>REAL price</th><th>REAL 24h</th><th>SIM price</th></tr></thead><tbody>${Object.keys(CG)
          .map((k) => {
            const v = j[CG[k]] || {};
            return `<tr><td><b>${k}</b></td><td class="mono">${v.usd != null ? '$' + U.price(v.usd) : '—'}</td><td class="mono ${U.cls(v.usd_24h_change || 0)}">${v.usd_24h_change != null ? U.pct(v.usd_24h_change) : '—'}</td><td class="mono muted">$${U.price(TM.Live.price(k))}</td></tr>`;
          })
          .join('')}</tbody></table></div><p class="tiny muted">Source: CoinGecko public API. Real prices are NOT used for your simulated trades.</p>`;
      } catch (e) {
        out.innerHTML = `<p class="muted">Real market data could not be loaded here (${U.esc(e.message || 'network blocked')}). This happens when the page runs in a sandbox or offline. The simulator keeps working normally.</p>`;
      }
    }
    async function loadRealChart(sym) {
      const out = $('#real-out');
      out.innerHTML = '<span class="muted">Loading real daily candles…</span>';
      let candles = null,
        src = '';
      try {
        const j = await fetchJSON(`https://api.binance.com/api/v3/klines?symbol=${sym}USDT&interval=1d&limit=200`);
        candles = j.map((k) => ({ t: k[0] / 1000, o: +k[1], h: +k[2], l: +k[3], c: +k[4], v: +k[5] }));
        src = 'Binance public API';
      } catch (e) {
        try {
          const j = await fetchJSON(`https://api.coingecko.com/api/v3/coins/${CG[sym]}/ohlc?vs_currency=usd&days=180`);
          const byDay = {};
          j.forEach((k) => {
            const day = Math.floor(k[0] / 86400000) * 86400;
            const d = byDay[day];
            if (!d) byDay[day] = { t: day, o: k[1], h: k[2], l: k[3], c: k[4], v: 0 };
            else {
              d.h = Math.max(d.h, k[2]);
              d.l = Math.min(d.l, k[3]);
              d.c = k[4];
            }
          });
          candles = Object.values(byDay).sort((a, b) => a.t - b.t);
          src = 'CoinGecko public API';
        } catch (e2) {
          out.innerHTML = `<p class="muted">Real chart data could not be loaded here (${U.esc(e2.message || 'network blocked')}). The simulator keeps working normally.</p>`;
          return;
        }
      }
      out.innerHTML = '';
      const body = U.el(`<div><p class="small muted">REAL historical daily candles for ${sym}/USD from ${src}. Study only — you cannot trade this chart. Toggle indicators to practise your analysis on real history.</p><div class="w-toggles real-tg"></div><div class="real-chart"></div></div>`);
      const md = U.modal({ title: `${sym}/USD · REAL daily history`, body, wide: true, actions: [{ label: 'Close', cls: 'btn-primary' }] });
      const ch = new TM.Chart(body.querySelector('.real-chart'), { height: 380, overlays: { ema20: true, ema50: true }, panes: ['rsi'], symbol: sym + '/USD', watermark: 'REAL DATA · VIEW ONLY' });
      ch.setData(candles, { fit: true, fitBars: candles.length + 3 });
      const tg = body.querySelector('.real-tg');
      ['ema20', 'ema50', 'bb'].forEach((k) => {
        const b = U.el(`<button class="tg ${k !== 'bb' ? 'on' : ''}">${IND_NAMES[k]}</button>`);
        b.onclick = () => {
          b.classList.toggle('on');
          ch.setOverlays({ [k]: b.classList.contains('on') });
        };
        tg.appendChild(b);
      });
      const oldClose = md.close;
      md.close = () => {
        ch.destroy();
        oldClose();
      };
    }

    /* -------- events -------- */
    U.on($('.tw-list'), 'click', '.tw-row', (e, b) => {
      ui.sym = b.dataset.s;
      tk.stop = tk.target = tk.limit = '';
      $('#tk-stop').value = $('#tk-target').value = $('#tk-limit').value = '';
      tk.confirm = false;
      TM.Store.save();
      renderWatch();
      renderHead();
      setChart();
      renderTicket();
      renderStrip();
      if (isCrypto) renderReal();
    });
    U.on($('#tf'), 'click', 'button', (e, b) => {
      ui.tf = b.dataset.v;
      TM.Store.save();
      setChart();
    });
    U.on($('#ind'), 'click', '.tg', (e, b) => {
      const k = b.dataset.k;
      if (k === 'rsi' || k === 'macd') {
        ui.panes = ui.panes.includes(k) ? ui.panes.filter((x) => x !== k) : ui.panes.concat(k);
        chart.setPanes(ui.panes.slice());
      } else {
        ui.ind[k] = !ui.ind[k];
        chart.setOverlays({ [k]: ui.ind[k] });
      }
      b.classList.toggle('on');
      TM.Store.save();
    });
    $('#draw').onclick = () => {
      drawMode = !drawMode;
      chart.mode = drawMode ? 'level' : 'normal';
      $('#draw').classList.toggle('on', drawMode);
      chart.req();
      if (drawMode) U.toast('Click the chart where you see support or resistance.', 'info');
    };
    $('#clear-lv').onclick = () => {
      ui.levels[ui.sym] = [];
      TM.Store.save();
      drawLines();
    };
    const segBind = (id, key, after) =>
      U.on($(id), 'click', 'button', (e, b) => {
        U.$$('button', $(id)).forEach((x) => x.classList.toggle('on', x === b));
        tk[key] = b.dataset.v;
        tk.confirm = false;
        after && after();
        renderTicket();
        drawLines();
      });
    segBind('#tk-side', 'side');
    segBind('#tk-type', 'type', () => {
      $('#tk-limit-f').hidden = tk.type !== 'limit';
      if (tk.type === 'limit' && !tk.limit) {
        tk.limit = U.round(TM.Live.price(ui.sym), dec(TM.Live.price(ui.sym)));
        $('#tk-limit').value = tk.limit;
      }
    });
    segBind('#tk-size', 'size', () => {
      $('#tk-sizev').value = tk[tk.size];
    });
    $('#tk-sizev').oninput = (e) => {
      tk[tk.size] = e.target.value;
      tk.confirm = false;
      renderTicket();
    };
    const numIn = (id, key) =>
      ($(id).oninput = (e) => {
        tk[key] = e.target.value;
        tk.confirm = false;
        renderTicket();
        drawLines();
      });
    numIn('#tk-stop', 'stop');
    numIn('#tk-target', 'target');
    numIn('#tk-limit', 'limit');
    if (isCrypto)
      $('#tk-lev').oninput = (e) => {
        tk.lev = +e.target.value;
        $('#tk-lev-v').textContent = tk.lev + '×';
        tk.confirm = false;
        renderTicket();
      };
    $('#tk-atr').onclick = () => {
      const arr = series();
      const ctx = TM.Market.context(arr);
      const e = entryPrice();
      const recent = arr.slice(-20);
      const swing = tk.side === 'long' ? Math.min(...recent.map((c) => c.l)) : Math.max(...recent.map((c) => c.h));
      const minDist = e * (isCrypto ? 0.006 : 0.004);
      let dist = Math.max(Math.abs(e - swing) + ctx.atr * 0.5, ctx.atr * 1.5, minDist);
      const st = tk.side === 'long' ? e - dist : e + dist;
      tk.stop = U.round(st, dec(e));
      $('#tk-stop').value = tk.stop;
      renderTicket();
      drawLines();
      TM.Coach.say(`Suggested stop: just beyond the ${tk.side === 'long' ? 'lowest low' : 'highest high'} of the last 20 candles (${U.price(swing)}) plus half an ATR of breathing room. That is where this trade idea would be proven wrong.`);
    };
    $('#tk-2r').onclick = () => {
      const e = entryPrice();
      if (!(+tk.stop > 0)) return U.toast('Set a stop-loss first — the 2R target is measured from it.', 'info');
      const dist = Math.abs(e - +tk.stop);
      tk.target = U.round(tk.side === 'long' ? e + dist * 2 : e - dist * 2, dec(e));
      $('#tk-target').value = tk.target;
      renderTicket();
      drawLines();
    };
    $('#tk-go').onclick = () => {
      const { sp, chk } = renderTicket();
      if (!chk.ok || !(sp.qty > 0)) return;
      if (chk.warnings.length && !tk.confirm) {
        tk.confirm = true;
        renderTicket();
        U.sound('error');
        TM.Coach.say('Pre-trade check: ' + chk.warnings.map((w) => '<br>⚠ ' + w).join('') + '<br>Fix these, or click again to place the trade anyway (it will be graded).');
        return;
      }
      tk.confirm = false;
      const acct = s.account;
      if (tk.type === 'limit') {
        const reserved = (sp.qty * sp.entry) / sp.lev + sp.qty * sp.entry * sp.feeRate;
        acct.cash -= reserved;
        acct.orders.push({ id: 'O' + acct.nextId++, sym: sp.sym, side: sp.side, qty: sp.qty, limit: sp.entry, stop: sp.stop, target: sp.target, lev: sp.lev, mode, feeRate: sp.feeRate, reserved, at: Date.now() });
        U.toast(`Limit order placed: ${sp.side === 'long' ? 'BUY' : 'SELL'} ${U.num(sp.qty, qtyDec())} ${sp.sym} @ ${U.price(sp.entry)}`, 'info');
        tab = 'ord';
      } else {
        const ctx = TM.Market.context(series());
        TM.Trading.open(acct, Object.assign({}, sp, { ctx, t: TM.Live.simT }));
        U.toast(`Filled: ${sp.side === 'long' ? 'BUY' : 'SELL SHORT'} ${U.num(sp.qty, qtyDec())} ${sp.sym} @ ${U.price(sp.entry)}`, 'good');
        U.sound('fill');
        tab = 'pos';
        if (!sp.stop) TM.Coach.say('You entered without a stop-loss. I strongly suggest adding one now — drag it on the chart or type it in the positions table.');
      }
      U.$$('.tabs button', el).forEach((b) => b.classList.toggle('on', b.dataset.t === tab));
      tk.stop = tk.target = tk.limit = '';
      $('#tk-stop').value = $('#tk-target').value = '';
      TM.Store.save();
      renderTabs();
      renderTicket();
      drawLines();
      renderAcct();
      TM.updateTop();
    };
    U.on($('.tabs'), 'click', 'button', (e, b) => {
      tab = b.dataset.t;
      U.$$('.tabs button', el).forEach((x) => x.classList.toggle('on', x === b));
      renderTabs();
    });
    U.on($('.tab-body'), 'click', 'button', (e, b) => {
      const tr = b.closest('tr');
      if (b.dataset.rv) {
        const t = s.trades.find((x) => x.id === b.dataset.rv);
        if (t) TM.Progress.showReview(t);
        return;
      }
      if (b.dataset.a === 'cancel') {
        const o = s.account.orders.find((x) => x.id === tr.dataset.oid);
        if (o) {
          s.account.orders.splice(s.account.orders.indexOf(o), 1);
          s.account.cash += o.reserved || 0;
          TM.Store.save();
          renderTabs();
          drawLines();
          renderAcct();
        }
        return;
      }
      const p = s.account.positions.find((x) => x.id === tr.dataset.id);
      if (!p) return;
      if (b.dataset.a === 'close') {
        const q = TM.Live.quote(p.sym);
        const t = TM.Trading.close(s.account, p, p.side === 'long' ? q.bid : q.ask, 'manual', { t: TM.Live.simT });
        TM.Store.save();
        renderTabs();
        drawLines();
        renderAcct();
        TM.Progress.afterTrade(t);
      } else if (b.dataset.a === 'be') {
        const px = TM.Live.price(p.sym);
        if ((p.side === 'long' && px <= p.entry) || (p.side === 'short' && px >= p.entry)) return U.toast('Breakeven stop is only possible once the trade is in profit.', 'info');
        TM.Trading.modify(p, 'stop', p.entry);
        U.toast('Stop moved to breakeven — this trade can no longer lose (barring gaps).', 'good');
        TM.Store.save();
        renderTabs();
        drawLines();
      }
    });
    U.on($('.tab-body'), 'change', '.mini-in', (e, inp) => {
      const p = s.account.positions.find((x) => x.id === inp.closest('tr').dataset.id);
      if (!p) return;
      const v = +inp.value || null;
      const f = inp.dataset.f;
      if (v) {
        const err = validateMod(p, f, v);
        if (err) {
          U.toast(err, 'bad');
          inp.value = p[f] || '';
          return;
        }
      }
      TM.Trading.modify(p, f, v);
      TM.Store.save();
      drawLines();
    });

    /* -------- live updates -------- */
    let n = 0;
    const offTick = TM.bus.on('tick', () => {
      chart.update();
      n++;
      renderWatch();
      renderHead();
      renderAcct();
      updateLivePnl();
      if (tk.type === 'market' || n % 3 === 0) renderTicket();
      if (n % 3 === 0) drawLines();
      if (isCrypto && n % 2 === 0) renderStrip();
    });
    const offTrade = TM.bus.on('trade:recorded', () => {
      renderTabs();
      drawLines();
      renderAcct();
    });
    const offStorm = TM.bus.on('storm', renderStrip);

    TM.Coach.setContext({
      view: mode,
      label: isCrypto ? 'Crypto trading' : 'Practice trading',
      hint: () => {
        const ctx = TM.Market.context(series());
        return `On ${ui.sym} (${ui.tf}) the EMA-20 trend looks <b>${ctx.trend}</b>, RSI is ${ctx.rsi ? ctx.rsi.toFixed(0) : '–'}, and typical movement (ATR) is ${U.price(ctx.atr)}. Recent range: ${U.price(ctx.recentLow)} – ${U.price(ctx.recentHigh)}. I can't tell you where price goes next, but a plan with a stop beyond a swing point and ≥2R target is always the right start.`;
      },
    });

    renderWatch();
    renderHead();
    renderAcct();
    setChart();
    renderTabs();
    $('#tk-sizev').value = tk.risk;
    renderTicket();
    renderStrip();
    renderCryptoLearn();
    renderReal();
    if (!S().settings.speed) U.toast('The market is paused. Change the speed in Settings.', 'info');
    return {
      destroy() {
        offTick();
        offTrade();
        offStorm();
        chart.destroy();
      },
    };
  };

  TM.Views.practice = (el) => {
    el.insertAdjacentHTML('afterbegin', `<div class="page-head slim"><div><h2>Practice Trading</h2><p class="muted">Paper-trade six simulated stocks with $10,000 of virtual money. Pick an asset, read the chart, plan your stop and target, then execute.</p></div><div class="speed-ctl" id="speed"></div></div>`);
    const host = U.el('<div></div>');
    el.appendChild(host);
    speedCtl(el.querySelector('#speed'));
    return TM.Terminal(host, { mode: 'practice' });
  };
  TM.Views.crypto = (el) => {
    el.insertAdjacentHTML('afterbegin', `<div class="page-head slim"><div><h2>Crypto Trading</h2><p class="muted">Simulated Bitcoin, Ethereum, Solana, XRP and Dogecoin. The market runs 24/7 — with leverage, funding rates and liquidation. Shares your $10,000 virtual account.</p></div><div class="speed-ctl" id="speed"></div></div>`);
    const host = U.el('<div></div>');
    el.appendChild(host);
    speedCtl(el.querySelector('#speed'));
    return TM.Terminal(host, { mode: 'crypto' });
  };
  function speedCtl(box) {
    const draw = () => {
      box.innerHTML = `<span class="muted small">Market speed</span><div class="seg seg-sm">${[0, 1, 2, 5].map((v) => `<button data-v="${v}" class="${S().settings.speed === v ? 'on' : ''}">${v ? v + '×' : '⏸'}</button>`).join('')}</div>`;
    };
    draw();
    U.on(box, 'click', 'button', (e, b) => {
      S().settings.speed = +b.dataset.v;
      TM.Store.save();
      draw();
    });
  }
  TM.speedCtl = speedCtl;
})();

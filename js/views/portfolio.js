/* TRADE MASTERY — Section 8: Portfolio & Statistics dashboard */
(function () {
  'use strict';
  const U = TM.U;
  const S = () => TM.Store.s;

  TM.Views.portfolio = function (el) {
    let mode = 'all';
    let page = 0;
    function render() {
      const s = S();
      const acct = s.account;
      const eq = TM.mainEquity();
      const trades = s.trades.filter((t) => mode === 'all' || t.mode === mode);
      const st = TM.Trading.stats(trades);
      const today = U.dayKey();
      const todayPnl = mode === 'all' ? eq - acct.daily.start : trades.filter((t) => U.dayKey(new Date(t.closedAt)) === today).reduce((a, t) => a + t.pnl, 0);
      const un = TM.Trading.unrealized(acct, TM.mainPrice);
      const pf = isFinite(st.profitFactor) ? st.profitFactor.toFixed(2) : st.n ? '∞' : '—';
      const tile = (k, v, cls = '', sub = '') => `<div class="stat"><span>${k}</span><b class="mono ${cls}">${v}</b>${sub ? `<small class="muted">${sub}</small>` : ''}</div>`;
      // allocation of open positions
      const alloc = {};
      acct.positions.forEach((p) => {
        const d = TM.Live.def(p.sym);
        const val = p.margin + TM.Trading.pnl(p, TM.Live.price(p.sym));
        alloc[d.sector] = (alloc[d.sector] || 0) + val;
      });
      alloc.Cash = acct.cash;
      const totalA = Object.values(alloc).reduce((a, b) => a + b, 0) || 1;
      const cols = ['#4d8dff', '#16c784', '#f2b84b', '#a78bfa', '#38c6d9', '#ff8fd0', '#ff9f43', '#7d8796'];
      let acc = 0;
      const conic = Object.keys(alloc)
        .map((k, i) => {
          const a = (acc / totalA) * 360;
          acc += alloc[k];
          return `${k === 'Cash' ? '#3a4456' : cols[i % cols.length]} ${a}deg ${(acc / totalA) * 360}deg`;
        })
        .join(',');
      const byMode = ['practice', 'crypto', 'day', 'swing'].map((m) => {
        const x = TM.Trading.stats(s.trades.filter((t) => t.mode === m));
        return { m, x };
      });
      const hist = trades.slice().reverse();
      const per = 25;
      const pages = Math.max(1, Math.ceil(hist.length / per));
      page = Math.min(page, pages - 1);
      el.innerHTML = `
        <div class="page-head"><div><h2>Portfolio & Statistics</h2><p class="muted">Your simulated account and the numbers that actually define a trader: win rate means nothing without reward:risk.</p></div>
        <div class="seg seg-sm" id="pf-mode">${[
          ['all', 'All trades'],
          ['practice', 'Practice'],
          ['crypto', 'Crypto'],
          ['day', 'Day sim'],
          ['swing', 'Swing sim'],
        ]
          .map(([k, l]) => `<button data-v="${k}" class="${mode === k ? 'on' : ''}">${l}</button>`)
          .join('')}</div></div>
        <div class="stats-grid">
          ${tile('Account balance (equity)', U.money(eq), '', 'Practice + Crypto account')}
          ${tile('Buying power', U.money(acct.cash), '', 'cash available')}
          ${tile('Unrealised P&L', U.smoney(un), U.cls(un), acct.positions.length + ' open')}
          ${tile('Total P&L', U.smoney(mode === 'all' ? eq - acct.start : st.total), U.cls(mode === 'all' ? eq - acct.start : st.total), mode === 'all' ? 'since start (account)' : 'closed trades')}
          ${tile('Daily P&L', U.smoney(todayPnl), U.cls(todayPnl), 'today')}
          ${tile('Win rate', st.n ? st.winRate.toFixed(1) + '%' : '—', '', `${st.wins}W / ${st.losses}L`)}
          ${tile('Average win', st.wins ? U.money(st.avgWin) : '—', 'up')}
          ${tile('Average loss', st.losses ? U.money(Math.abs(st.avgLoss)) : '—', 'down')}
          ${tile('Profit factor', pf, st.profitFactor >= 1 ? 'up' : st.n ? 'down' : '', 'gross win ÷ gross loss')}
          ${tile('Largest win', st.wins ? U.money(st.largestWin) : '—', 'up')}
          ${tile('Largest loss', st.losses ? U.money(Math.abs(st.largestLoss)) : '—', 'down')}
          ${tile('Max drawdown', mode === 'all' ? acct.maxDD.toFixed(2) + '%' : U.money(st.maxDDCash), 'down', mode === 'all' ? 'account peak → trough' : 'on closed-trade P&L')}
          ${tile('Avg planned R:R', st.avgRR != null ? st.avgRR.toFixed(2) + ' : 1' : '—', st.avgRR >= 2 ? 'up' : '')}
          ${tile('Avg realised R', st.avgR != null ? (st.avgR >= 0 ? '+' : '') + st.avgR.toFixed(2) + 'R' : '—', U.cls(st.avgR || 0))}
          ${tile('Expectancy', st.n ? U.smoney(st.expectancy) : '—', U.cls(st.expectancy), 'per trade')}
          ${tile('Trades with a stop', st.n ? st.stopPct.toFixed(0) + '%' : '—', st.stopPct >= 90 ? 'up' : st.n ? 'down' : '', 'aim for 100%')}
        </div>
        <div class="grid g2">
          <section class="card"><h3>Account equity over time</h3><canvas class="chart-lg" id="pf-eq"></canvas><p class="tiny muted">Practice + Crypto account, sampled while you trade.</p></section>
          <section class="card"><h3>Cumulative P&L by trade <span class="muted small">(${mode === 'all' ? 'all modes' : mode})</span></h3><canvas class="chart-lg" id="pf-cum"></canvas><p class="tiny muted">Smooth and rising beats spiky. Big drops mean risk was too large.</p></section>
          <section class="card"><h3>P&L per trade (last 60)</h3><canvas class="chart-md" id="pf-bars"></canvas></section>
          <section class="card"><h3>Allocation</h3><div class="alloc"><div class="al-pie lg" style="background:conic-gradient(${conic})"></div><ul>${Object.keys(alloc).map((k, i) => `<li><span class="al-sw" style="background:${k === 'Cash' ? '#3a4456' : cols[i % cols.length]}"></span>${k}<b class="mono">${((alloc[k] / totalA) * 100).toFixed(1)}%</b></li>`).join('')}</ul></div>
            <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Mode</th><th>Trades</th><th>Win%</th><th>Net</th><th>PF</th></tr></thead><tbody>${byMode.map(({ m, x }) => `<tr><td>${{ practice: 'Practice', crypto: 'Crypto', day: 'Day sim', swing: 'Swing sim' }[m]}</td><td class="mono">${x.n}</td><td class="mono">${x.n ? x.winRate.toFixed(0) + '%' : '—'}</td><td class="mono ${U.cls(x.total)}">${U.smoney(x.total, 0)}</td><td class="mono">${x.n ? (isFinite(x.profitFactor) ? x.profitFactor.toFixed(2) : '∞') : '—'}</td></tr>`).join('')}</tbody></table></div></section>
        </div>
        <section class="card"><h3>Open positions</h3>${acct.positions.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Asset</th><th>Mode</th><th>Side</th><th>Size</th><th>Entry</th><th>Last</th><th>P&L</th><th>Stop</th><th>Target</th></tr></thead><tbody>${acct.positions.map((p) => {
          const last = TM.Live.price(p.sym);
          const pnl = TM.Trading.pnl(p, last);
          return `<tr><td><b>${p.sym}</b></td><td>${p.mode}</td><td class="${p.side === 'long' ? 'up' : 'down'}">${p.side.toUpperCase()}${p.lev > 1 ? ' ' + p.lev + '×' : ''}</td><td class="mono">${U.num(p.qty, p.qty % 1 ? 4 : 0)}</td><td class="mono">${U.price(p.entry)}</td><td class="mono">${U.price(last)}</td><td class="mono ${U.cls(pnl)}">${U.smoney(pnl)}</td><td class="mono">${p.stop ? U.price(p.stop) : '<span class="down">none</span>'}</td><td class="mono">${p.target ? U.price(p.target) : '—'}</td></tr>`;
        }).join('')}</tbody></table></div>` : '<p class="muted small">No open positions in your Practice/Crypto account.</p>'}</section>
        <section class="card"><div class="jr-h"><h3>Trading history <span class="pill">${hist.length}</span></h3>${pages > 1 ? `<div class="pager"><button class="btn btn-sm btn-ghost" data-pg="-1" ${page === 0 ? 'disabled' : ''}>‹</button><span class="small muted">${page + 1}/${pages}</span><button class="btn btn-sm btn-ghost" data-pg="1" ${page >= pages - 1 ? 'disabled' : ''}>›</button></div>` : ''}</div>
          ${hist.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Closed</th><th>Mode</th><th>Asset</th><th>Side</th><th>Size</th><th>Entry</th><th>Exit</th><th>Exit reason</th><th>P&L</th><th>R</th><th>Risk %</th><th>Process</th><th></th></tr></thead><tbody>${hist
            .slice(page * per, page * per + per)
            .map((t) => `<tr><td class="small muted nowrap">${U.dateTime(t.closedAt)}</td><td class="small">${t.mode}</td><td><b>${t.sym}</b></td><td class="${t.side === 'long' ? 'up' : 'down'}">${t.side.toUpperCase()}${t.lev > 1 ? ' ' + t.lev + '×' : ''}</td><td class="mono">${U.num(t.qty, t.qty % 1 ? 4 : 0)}</td><td class="mono">${U.price(t.entry)}</td><td class="mono">${U.price(t.exit)}</td><td class="small">${t.exitReason}</td><td class="mono ${U.cls(t.pnl)}">${U.smoney(t.pnl)}</td><td class="mono">${t.r != null ? t.r.toFixed(2) : '—'}</td><td class="mono">${t.riskPct != null ? t.riskPct.toFixed(2) : '—'}</td><td><span class="grade g-${t.review ? t.review.grade : 'C'}">${t.review ? t.review.grade : '—'}</span></td><td><button class="btn btn-sm btn-ghost" data-rv="${t.id}">Review</button></td></tr>`)
            .join('')}</tbody></table></div>` : '<div class="empty">No closed trades yet. Head to <a href="#practice">Practice Trading</a> or the <a href="#day">Day Trading Simulator</a>.</div>'}
        </section>`;
      U.lineChart(el.querySelector('#pf-eq'), acct.equityCurve.map((p) => p.v), { axis: true, baseline: acct.start, fmt: (v) => '$' + U.bigN(v), empty: 'Trade in Practice or Crypto to build your equity curve' });
      U.lineChart(el.querySelector('#pf-cum'), st.curve, { axis: true, baseline: 0, fmt: (v) => (v < 0 ? '-$' : '$') + U.bigN(Math.abs(v)), empty: 'No closed trades yet' });
      U.barChart(el.querySelector('#pf-bars'), trades.slice(-60).map((t) => t.pnl));
    }
    render();
    U.on(el, 'click', 'button', (e, b) => {
      if (b.closest('#pf-mode')) {
        mode = b.dataset.v;
        page = 0;
        render();
      } else if (b.dataset.pg) {
        page += +b.dataset.pg;
        render();
      } else if (b.dataset.rv) {
        const t = S().trades.find((x) => x.id === b.dataset.rv);
        if (t) TM.Progress.showReview(t);
      }
    });
    const onR = U.debounce(render, 200);
    window.addEventListener('resize', onR);
    return { destroy: () => window.removeEventListener('resize', onR) };
  };
})();

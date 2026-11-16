/* TRADE MASTERY — Section 9: Trading Journal */
(function () {
  'use strict';
  const U = TM.U;
  const S = () => TM.Store.s;
  const STRATS = ['Breakout', 'Pullback / buy the dip', 'Trend continuation', 'Reversal', 'Range (support/resistance)', 'VWAP', 'Scalp', 'News / earnings', 'Other', 'No real strategy'];
  const INDS = ['Trend / EMAs', 'Support & resistance', 'Volume', 'RSI', 'MACD', 'VWAP', 'Bollinger Bands', 'Chart pattern', 'None'];
  const EMO = ['Calm', 'Confident', 'Anxious', 'FOMO', 'Revenge', 'Bored', 'Greedy', 'Fearful'];
  const MIST = ['Chased the entry', 'No stop-loss', 'Moved my stop', 'Position too big', 'Exited too early', 'Held too long', 'Against the trend', 'Revenge trade', 'Overtrading', 'Ignored my plan', 'None — followed my plan'];
  const modeName = { practice: 'Practice', crypto: 'Crypto', day: 'Day sim', swing: 'Swing sim' };

  function summary(t) {
    const why = { target: 'hit the take-profit', stop: 'hit the stop-loss', 'gap-stop': 'gapped through the stop', liquidation: 'was liquidated', manual: 'was closed manually', 'session-end': 'closed at the session end' }[t.exitReason] || 'closed';
    return `${t.side === 'long' ? 'Long' : 'Short'} ${t.sym} from ${U.price(t.entry)} to ${U.price(t.exit)}: the trade ${why}, ${t.pnl >= 0 ? 'making' : 'losing'} ${U.money(Math.abs(t.pnl))}${t.r != null ? ` (${t.r.toFixed(2)}R)` : ''}.`;
  }
  function autoMistakes(t) {
    const m = [];
    if (!t.origStop) m.push('No stop-loss');
    if (t.riskPct > 2.05) m.push('Position too big');
    if (t.stopMoves && t.stopMoves.some((x) => x.widened)) m.push('Moved my stop');
    if (t.ctx && ((t.side === 'long' && t.ctx.trend === 'down') || (t.side === 'short' && t.ctx.trend === 'up'))) m.push('Against the trend');
    return m;
  }

  TM.JournalUI = {
    pending() {
      const s = S();
      return s.trades.filter((t) => !s.journal[t.id] && !(s.journalSkip || {})[t.id]).slice(-30);
    },
    form(t, existing) {
      const e = existing || {};
      const auto = autoMistakes(t);
      const chips = (name, list, sel) => `<div class="chips" data-name="${name}">${list.map((x) => `<button type="button" class="chip-t ${sel.includes(x) ? 'on' : ''}">${x}</button>`).join('')}</div>`;
      const el = U.el(`<form class="jr-form">
        <label class="fld">Why did you enter?<textarea name="why" rows="2" placeholder="e.g. Price pulled back to the rising EMA 20 and printed a hammer at support">${U.esc(e.why || '')}</textarea></label>
        <div class="jr-row"><label class="fld">Strategy used<select name="strategy">${STRATS.map((x) => `<option ${e.strategy === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
        <label class="fld">How did you feel?<select name="emotion">${EMO.map((x) => `<option ${e.emotion === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label></div>
        <div class="fld"><span>Indicators you noticed</span>${chips('indicators', INDS, e.indicators || [])}</div>
        <div class="jr-row"><label class="fld">How much you risked<input name="risk" value="${U.esc(e.risk || (t.riskPlanned ? `${U.money(t.riskPlanned)} (${t.riskPct.toFixed(2)}% of account)` : 'Undefined — no stop'))}"></label>
        <label class="fld">Your target<input name="target" value="${U.esc(e.target || (t.target ? `${U.price(t.target)}${t.rrPlanned ? ` (${t.rrPlanned.toFixed(1)}:1)` : ''}` : 'No target set'))}"></label></div>
        <label class="fld">What happened?<textarea name="happened" rows="2">${U.esc(e.happened || summary(t))}</textarea></label>
        <div class="fld"><span>Mistakes (be honest — this is private)</span>${chips('mistakes', MIST, e.mistakes || auto)}</div>
        <label class="fld">What did you learn?<textarea name="learned" rows="2" placeholder="One sentence you want your future self to remember">${U.esc(e.learned || '')}</textarea></label>
        <div class="w-fb"></div>
      </form>`);
      U.on(el, 'click', '.chip-t', (ev, b) => {
        b.classList.toggle('on');
        const grp = b.parentElement;
        if (b.textContent.startsWith('None') && b.classList.contains('on')) U.$$('.chip-t', grp).forEach((x) => x !== b && x.classList.remove('on'));
        else if (b.classList.contains('on')) U.$$('.chip-t', grp).forEach((x) => x.textContent.startsWith('None') && x.classList.remove('on'));
      });
      el.addEventListener('submit', (ev) => ev.preventDefault());
      return {
        el,
        get() {
          const f = new FormData(el);
          const o = {};
          ['why', 'strategy', 'emotion', 'risk', 'target', 'happened', 'learned'].forEach((k) => (o[k] = String(f.get(k) || '').trim()));
          U.$$('.chips', el).forEach((g) => (o[g.dataset.name] = U.$$('.chip-t.on', g).map((b) => b.textContent)));
          o._el = el;
          return o;
        },
      };
    },
    save(t, data) {
      const fbx = data._el && data._el.querySelector('.w-fb');
      if (!data.why || data.why.length < 5 || !data.learned || data.learned.length < 5) {
        if (fbx) {
          fbx.className = 'w-fb show fb-bad';
          fbx.textContent = 'Write at least a few words for "Why did you enter?" and "What did you learn?". That is where the value is.';
        }
        return false;
      }
      delete data._el;
      const s = S();
      const isNew = !s.journal[t.id];
      s.journal[t.id] = Object.assign(data, { at: Date.now(), tradeId: t.id });
      if (isNew) {
        s.counters.journalCount++;
        TM.Progress.addXP(20, 'Journal entry');
        TM.Progress.goal('journal');
      }
      TM.Store.save();
      TM.Progress.checkAchievements();
      TM.updateTop && TM.updateTop();
      return true;
    },
  };

  TM.Views.journal = function (el) {
    const s = S();
    let filter = 'all';
    function render() {
      const pend = TM.JournalUI.pending();
      const entries = Object.values(s.journal).sort((a, b) => b.at - a.at);
      const tradeOf = (id) => s.trades.find((t) => t.id === id);
      // recurring mistakes
      const mcount = {};
      entries.forEach((e) => (e.mistakes || []).forEach((m) => !m.startsWith('None') && (mcount[m] = (mcount[m] || 0) + 1)));
      s.trades.slice(-50).forEach((t) => {
        if (s.journal[t.id]) return;
        autoMistakes(t).forEach((m) => (mcount[m] = (mcount[m] || 0) + 1));
      });
      const top = Object.entries(mcount).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const emo = {};
      entries.forEach((e) => {
        const t = tradeOf(e.tradeId);
        if (!t) return;
        emo[e.emotion] = emo[e.emotion] || { n: 0, pnl: 0 };
        emo[e.emotion].n++;
        emo[e.emotion].pnl += t.pnl;
      });
      const strat = {};
      entries.forEach((e) => {
        const t = tradeOf(e.tradeId);
        if (!t) return;
        strat[e.strategy] = strat[e.strategy] || { n: 0, w: 0, pnl: 0 };
        strat[e.strategy].n++;
        if (t.pnl > 0) strat[e.strategy].w++;
        strat[e.strategy].pnl += t.pnl;
      });
      const fixes = {
        'No stop-loss': '4-1',
        'Position too big': '4-2',
        'Moved my stop': '4-5',
        'Against the trend': '2-4',
        'Chased the entry': '3-4',
        'Revenge trade': '4-5',
        Overtrading: '4-5',
        'Exited too early': '5-4',
        'Held too long': '5-4',
        'Ignored my plan': '7-4',
      };
      const list = entries.filter((e) => {
        const t = tradeOf(e.tradeId);
        if (!t) return false;
        if (filter === 'all') return true;
        if (filter === 'wins') return t.pnl > 0;
        if (filter === 'losses') return t.pnl <= 0;
        return t.mode === filter;
      });
      el.innerHTML = `
        <div class="page-head"><div><h2>Trading Journal</h2><p class="muted">The journal turns experience into skill. Record every trade, then look for the mistakes that keep repeating.</p></div></div>
        <div class="grid g3">
          <section class="card"><h3>Recurring mistakes</h3>${top.length ? `<ul class="bars">${top.map(([m, n]) => `<li><span>${m}</span><i style="width:${(n / top[0][1]) * 100}%"></i><b>${n}</b>${fixes[m] ? `<a class="link small" href="#lesson-${fixes[m]}">fix →</a>` : ''}</li>`).join('')}</ul>` : '<p class="muted small">No patterns yet. Journal a few trades and your recurring mistakes will appear here.</p>'}</section>
          <section class="card"><h3>Emotions vs results</h3>${Object.keys(emo).length ? `<ul class="emo-list">${Object.entries(emo).map(([k, v]) => `<li><span>${k}</span><span class="muted small">${v.n} trades</span><b class="mono ${U.cls(v.pnl)}">${U.smoney(v.pnl, 0)}</b></li>`).join('')}</ul>` : '<p class="muted small">Tag your emotions to see which states cost you money.</p>'}</section>
          <section class="card"><h3>Your trading plan</h3>${s.plan ? `<div class="small plan-view"><div><b>Style:</b> ${U.esc(s.plan.style)}</div><div><b>Markets:</b> ${U.esc(s.plan.markets || '—')}</div><div><b>Setup:</b> ${U.esc(s.plan.setup)}</div><div><b>Stop rule:</b> ${U.esc(s.plan.stop)}</div><div><b>Risk/trade:</b> ${s.plan.risk}% · <b>Min R:R</b> ${s.plan.rr}:1 · <b>Max trades/day</b> ${s.plan.max} · <b>Daily loss limit</b> ${s.plan.dl}%</div><div><b>No-trade rules:</b> ${U.esc(s.plan.no || '—')}</div></div><a class="btn btn-sm btn-ghost" href="#lesson-7-4">Edit plan</a>` : '<p class="muted small">You have not written a trading plan yet.</p><a class="btn btn-sm btn-primary" href="#lesson-7-4">Write my plan (Lesson 7.4)</a>'}</section>
        </div>
        ${Object.keys(strat).length ? `<section class="card"><h3>Results by strategy</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Strategy</th><th>Trades</th><th>Win rate</th><th>Net P&L</th></tr></thead><tbody>${Object.entries(strat).map(([k, v]) => `<tr><td>${k}</td><td class="mono">${v.n}</td><td class="mono">${((v.w / v.n) * 100).toFixed(0)}%</td><td class="mono ${U.cls(v.pnl)}">${U.smoney(v.pnl)}</td></tr>`).join('')}</tbody></table></div></section>` : ''}
        <section class="card"><h3>Waiting for your notes <span class="pill">${pend.length}</span></h3>${pend.length ? `<div class="jr-pend">${pend.slice().reverse().map((t) => `<div class="jr-p"><span><b>${t.sym}</b> <span class="muted small">${modeName[t.mode] || t.mode} · ${U.dateTime(t.closedAt)}</span></span><span class="mono ${U.cls(t.pnl)}">${U.smoney(t.pnl)}</span><span class="grade g-${t.review ? t.review.grade : 'C'}">${t.review ? t.review.grade : ''}</span><button class="btn btn-sm btn-primary" data-j="${t.id}">Journal it</button><button class="btn btn-sm btn-ghost" data-skip="${t.id}" title="Hide from this list">Skip</button></div>`).join('')}</div>` : '<p class="muted small">All caught up. Every closed trade you journal earns +20 XP.</p>'}</section>
        <section class="card"><div class="jr-h"><h3>Entries</h3><div class="seg seg-sm" id="jr-f">${[
          ['all', 'All'],
          ['wins', 'Wins'],
          ['losses', 'Losses'],
          ['practice', 'Practice'],
          ['crypto', 'Crypto'],
          ['day', 'Day'],
          ['swing', 'Swing'],
        ]
          .map(([k, l]) => `<button data-v="${k}" class="${filter === k ? 'on' : ''}">${l}</button>`)
          .join('')}</div></div>
          ${list.length ? `<div class="jr-list">${list
            .map((e) => {
              const t = tradeOf(e.tradeId);
              return `<article class="jr-e"><header><b>${t.side === 'long' ? 'LONG' : 'SHORT'} ${t.sym}</b> <span class="muted small">${modeName[t.mode] || t.mode} · ${U.dateTime(t.closedAt)}</span><span class="mono ${U.cls(t.pnl)}">${U.smoney(t.pnl)}</span><span class="grade g-${t.review ? t.review.grade : 'C'}">${t.review ? t.review.grade : ''}</span></header>
              <div class="jr-g"><div><span class="muted small">Why</span><p>${U.esc(e.why)}</p></div><div><span class="muted small">Strategy · feeling</span><p>${U.esc(e.strategy)} · ${U.esc(e.emotion)}</p></div><div><span class="muted small">Indicators</span><p>${(e.indicators || []).join(', ') || '—'}</p></div><div><span class="muted small">Risk · target</span><p>${U.esc(e.risk)} · ${U.esc(e.target)}</p></div><div class="wide"><span class="muted small">What happened</span><p>${U.esc(e.happened)}</p></div><div class="wide"><span class="muted small">Lesson learned</span><p class="jr-learn">${U.esc(e.learned)}</p></div></div>
              <footer>${(e.mistakes || []).map((m) => `<span class="chip ${m.startsWith('None') ? 'chip-ok' : 'chip-bad'}">${m}</span>`).join('')}<button class="btn btn-sm btn-ghost" data-rv="${t.id}">Coach review</button><button class="btn btn-sm btn-ghost" data-edit="${t.id}">Edit</button></footer></article>`;
            })
            .join('')}</div>` : '<p class="muted">No entries match.</p>'}
        </section>`;
    }
    render();
    U.on(el, 'click', 'button', (e, b) => {
      const s2 = S();
      if (b.dataset.j || b.dataset.edit) {
        const t = s2.trades.find((x) => x.id === (b.dataset.j || b.dataset.edit));
        if (!t) return;
        const f = TM.JournalUI.form(t, s2.journal[t.id]);
        const body = U.el('<div></div>');
        body.innerHTML = TM.Review.html(t, TM.Review.analyze(t));
        body.appendChild(f.el);
        U.modal({ title: 'Journal entry', body, wide: true, actions: [{ label: 'Cancel', cls: 'btn-ghost' }, { label: 'Save entry', cls: 'btn-primary', onClick: () => (TM.JournalUI.save(t, f.get()) ? undefined : false) }], onClose: render });
      } else if (b.dataset.skip) {
        s2.journalSkip = s2.journalSkip || {};
        s2.journalSkip[b.dataset.skip] = 1;
        TM.Store.save();
        render();
        TM.updateTop();
      } else if (b.dataset.rv) {
        const t = s2.trades.find((x) => x.id === b.dataset.rv);
        if (t) TM.Progress.showReview(t);
      } else if (b.closest('#jr-f')) {
        filter = b.dataset.v;
        render();
      }
    });
  };
})();

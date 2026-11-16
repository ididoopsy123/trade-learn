/* TRADE MASTERY — Section 7: Trading Challenges (with drills) + Achievements view */
(function () {
  'use strict';
  const U = TM.U;
  const S = () => TM.Store.s;
  const R = TM.Recipes;

  TM.Views.challenges = function (el) {
    function render() {
      const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
      el.innerHTML = `
        <div class="page-head"><div><h2>Trading Challenges</h2><p class="muted">Progressively harder goals that reward <b>discipline and skill</b>. None of them reward reckless gambling or trading more for the sake of it.</p></div></div>
        ${tiers
          .map((tier) => {
            const cs = TM.Progress.CH.filter((c) => c.tier === tier);
            return `<h3 class="sec-h tier-${tier.toLowerCase()}">${tier}</h3><div class="grid g3">${cs
              .map((c) => {
                const st = TM.Progress.chState(c);
                return `<section class="card ch ${st.claimed ? 'claimed' : st.done ? 'ready' : ''}"><div class="ch-h"><span class="ch-ic">${c.icon}</span><div><b>${c.title}</b><div class="xp small">+${c.xp} XP</div></div>${st.claimed ? '<span class="pill pill-ok">✓ Complete</span>' : ''}</div><p class="small">${c.desc}</p>
                <div class="xpbar"><i style="width:${(st.cur / st.max) * 100}%"></i></div><div class="small muted">${st.cur} / ${st.max}</div>
                <div class="btn-row">${st.done && !st.claimed ? `<button class="btn btn-primary btn-sm" data-claim="${c.id}">Claim reward</button>` : ''}${!st.claimed && c.drill ? `<button class="btn btn-sm" data-drill="${c.drill}">Play drill →</button>` : ''}${!st.claimed && c.go ? `<a class="btn btn-sm btn-ghost" href="${c.go}">Go →</a>` : ''}<button class="btn btn-sm btn-ghost" data-hint="${c.id}">💡 Hint</button></div></section>`;
              })
              .join('')}</div>`;
          })
          .join('')}`;
    }
    render();
    U.on(el, 'click', 'button', (e, b) => {
      if (b.dataset.claim) {
        TM.Progress.claim(b.dataset.claim);
        render();
        TM.updateTop();
      } else if (b.dataset.drill) drill(b.dataset.drill, render);
      else if (b.dataset.hint) {
        const c = TM.Progress.CH.find((x) => x.id === b.dataset.hint);
        TM.Coach.toggle(true);
        TM.Coach.say(`💡 <b>${c.title}</b>: ${c.hint}`);
      }
    });
    const off = TM.bus.on('progress', U.debounce(render, 300));
    return { destroy: off };
  };

  /* -------- drills -------- */
  const LEVEL_RECIPES = [
    () => ({ d: R.range(U.seed() % 999, 96, 102), levels: [{ price: 96, tol: 0.85, label: 'Support', color: '#16c784' }, { price: 102, tol: 0.85, label: 'Resistance', color: '#f0465a' }], prompt: 'Mark the <b>support</b> OR the <b>resistance</b> of this range.', need: 1 }),
    () => ({ d: R.support(U.seed() % 999), levels: [{ price: 100.8, tol: 0.9, label: 'Support', color: '#16c784' }], prompt: 'Mark the <b>support</b> level that stopped three declines.', need: 1 }),
    () => ({ d: R.resistance(U.seed() % 999), levels: [{ price: 99.4, tol: 0.9, label: 'Resistance', color: '#f0465a' }], prompt: 'Mark the <b>resistance</b> level that stopped three rallies.', need: 1 }),
    () => ({ d: R.range(U.seed() % 999, 47, 50), levels: [{ price: 47, tol: 0.45, label: 'Support', color: '#16c784' }, { price: 50, tol: 0.45, label: 'Resistance', color: '#f0465a' }], prompt: 'Mark the <b>support</b> OR the <b>resistance</b> of this range.', need: 1 }),
  ];
  function drill(kind, after) {
    const body = U.el('<div class="drill"></div>');
    const md = U.modal({ title: kind === 'levels' ? '📏 Level Hunt' : '🕵️ Breakout or Fakeout?', body, wide: true, actions: [{ label: 'Done', cls: 'btn-ghost' }], onClose: () => {
      w && w.destroy && w.destroy();
      TM.Coach.setContext({ view: 'challenges', hint: null, label: 'Trading Challenges' });
      after();
    } });
    let w = null;
    const round = () => {
      if (w && w.destroy) w.destroy();
      body.innerHTML = '';
      if (kind === 'levels') {
        const L = U.pick(LEVEL_RECIPES)();
        body.insertAdjacentHTML('afterbegin', `<p class="muted small">Found so far: <b>${S().counters.srFound}</b> / 5</p>`);
        w = TM.W.level(body, { data: L.d, prompt: L.prompt, levels: () => L.levels, need: L.need, explain: 'Price reversed there repeatedly — traders remember those prices.' }, (r) => {
          if (!r.revealed) {
            TM.Store.inc('srFound');
            TM.Progress.checkAchievements();
          }
          next();
        });
      } else {
        const fake = Math.random() < 0.55;
        const seed = U.seed() % 999;
        const d = fake ? R.fakeout(seed) : R.breakout(seed);
        const res = fake ? 50 : 102;
        const cut = fake ? 41 : 42;
        body.insertAdjacentHTML('afterbegin', `<p class="muted small">Fakeouts identified: <b>${S().counters.fakeoutsFound}</b> / 3 · Look at volume, the wick and the close.</p>`);
        const inner = U.el('<div></div>');
        body.appendChild(inner);
        const C = TM.W.chartIn(inner, { candles: TM.Recipes.build(d).slice(0, cut + 1), lines: [{ price: res, color: '#f0465a', label: 'Resistance' }], rightPad: 8 });
        w = { destroy: () => C.ch.destroy() };
        TM.W.choice(body, { prompt: 'Price just pushed above resistance. Real breakout or fakeout?', options: ['Real breakout — likely to continue', 'Fakeout — likely to fail'], answer: fake ? 1 : 0, explain: fake ? 'Weak volume, a long upper wick and no strong close: classic fakeout. Watch what happened next.' : 'A strong close above the level on a big volume spike: a genuine breakout. Watch what happened next.' }, (r) => {
          if (r.ok && fake) {
            TM.Store.inc('fakeoutsFound');
            TM.Progress.checkAchievements();
          }
          C.ch.setData(TM.Recipes.build(d), { fit: true });
          next();
        });
      }
    };
    const next = () => {
      const b = U.el('<div class="btn-row center"><button class="btn btn-primary">Next chart →</button></div>');
      b.querySelector('button').onclick = round;
      body.appendChild(b);
    };
    round();
    return md;
  }
  TM.drill = drill;

  /* -------- achievements -------- */
  TM.Views.achievements = function (el) {
    const s = S();
    const got = TM.Progress.ACH.filter((a) => s.achievements[a.id]).length;
    const ri = TM.Progress.rankIndex();
    el.innerHTML = `
      <div class="page-head"><div><h2>Achievements & Ranks</h2><p class="muted">${got} of ${TM.Progress.ACH.length} badges unlocked · ${s.xp} XP total</p></div></div>
      <section class="card"><h3>Rank ladder</h3><div class="ladder-r">${TM.Progress.RANKS.map((r, i) => `<div class="rk ${i < ri ? 'past' : i === ri ? 'cur' : ''}"><span class="rk-ic">${r.icon}</span><b>${r.name}</b><span class="small muted">${r.xp.toLocaleString()} XP</span><span class="tiny muted">${r.blurb}</span></div>`).join('')}</div>
      <p class="small muted">XP sources: lessons, quizzes and tests, scenarios, challenges, journal entries, day/swing sessions, and trades graded on <b>process</b> (stop-loss, risk ≤2%, good reward:risk, trading with the trend). Profit alone earns nothing — reckless winners earn no XP, disciplined losers do.</p></section>
      <div class="ach-grid">${TM.Progress.ACH.map((a) => {
        const t = s.achievements[a.id];
        return `<div class="ach ${t ? 'got' : ''}"><span class="ach-ic">${a.icon}</span><b>${a.name}</b><span class="small muted">${a.desc}</span><span class="tiny ${t ? 'up' : 'muted'}">${t ? 'Unlocked ' + U.dateTime(t) : a.xp ? '+' + a.xp + ' XP' : 'Rank badge'}</span></div>`;
      }).join('')}</div>
      <section class="card"><h3>Recent XP</h3>${s.xpLog.length ? `<ul class="xplog">${s.xpLog.slice(0, 20).map((x) => `<li><span class="xp mono">+${x.amount}</span><span>${U.esc(x.reason)}</span><span class="muted tiny">${U.dateTime(x.t)}</span></li>`).join('')}</ul>` : '<p class="muted small">Complete your first lesson to start earning XP.</p>'}</section>`;
  };
})();

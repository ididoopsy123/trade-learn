/* TRADE MASTERY — Section 6: Realistic Market Scenarios */
(function () {
  'use strict';
  const U = TM.U;
  const S = () => TM.Store.s;

  TM.Views.scenarios = function (el, id) {
    const s = S();
    if (id) return play(el, id);
    el.innerHTML = `
      <div class="page-head"><div><h2>Market Scenarios</h2><p class="muted">Realistic situations that trip up real traders. Each scenario reveals the chart step by step and asks you to make several decisions. Every choice is explained — and scored on <b>process</b>, not luck.</p></div></div>
      <div class="scen-grid">${TM.Scenarios.list
        .map((sc) => {
          const r = s.scenarios[sc.id];
          return `<a class="card scen ${r ? 'done' : ''}" href="#scenario-${sc.id}"><div class="scen-h"><span class="scen-l">${sc.id}</span><span class="pill">${sc.tag}</span><span class="diff">${'●'.repeat(sc.diff)}${'○'.repeat(3 - sc.diff)}</span></div><h3>${sc.title}</h3><p class="muted small">${sc.blurb}</p><div class="scen-f">${r ? `<span class="${r.best >= 70 ? 'up' : ''}">Best ${r.best}%</span><span class="muted small">${r.count}× played</span>` : '<span class="muted small">Not played yet</span>'}<span class="btn btn-sm ${r ? 'btn-ghost' : 'btn-primary'}">${r ? 'Replay' : 'Start'} →</span></div></a>`;
        })
        .join('')}</div>`;
  };

  function play(el, id) {
    const sc = TM.Scenarios.byId(id);
    if (!sc) {
      location.hash = '#scenarios';
      return;
    }
    el.innerHTML = `<div class="lesson-top"><a class="btn btn-ghost btn-sm" href="#scenarios">← All scenarios</a><div class="lt-t"><div class="eyebrow">Scenario ${sc.id} · ${sc.tag}</div><h2>${sc.title}</h2></div></div><div class="card scen-play"></div>`;
    const box = el.querySelector('.scen-play');
    const w = TM.W.scenario(box, sc, (r) => {
      const s = S();
      const prev = s.scenarios[id];
      const first = !prev;
      s.scenarios[id] = { best: Math.max(prev ? prev.best : 0, r.score), count: (prev ? prev.count : 0) + 1, last: r.score };
      if (first) s.counters.scenariosDone++;
      TM.Store.save();
      const xp = first ? 50 + Math.round(r.score) : prev && r.score > prev.best ? Math.round((r.score - prev.best) / 2) : 0;
      if (xp) TM.Progress.addXP(xp, `Scenario ${id}: ${r.score}%`);
      TM.Progress.goal('scenario');
      TM.Progress.checkAchievements();
      const idx = TM.Scenarios.list.findIndex((x) => x.id === id);
      const next = TM.Scenarios.list[idx + 1];
      box.insertAdjacentHTML('beforeend', `<div class="btn-row center"><a class="btn btn-ghost" href="#scenarios">All scenarios</a><button class="btn btn-ghost" id="sc-again">Replay</button>${next ? `<a class="btn btn-primary" href="#scenario-${next.id}">Next: ${next.title} →</a>` : ''}</div>`);
      box.querySelector('#sc-again').onclick = () => TM.route();
    });
    return w;
  }
})();

/* TRADE MASTERY — Section 10: Knowledge Tests */
(function () {
  'use strict';
  const U = TM.U;
  const S = () => TM.Store.s;
  const N = 10;

  TM.Views.tests = function (el, lvParam) {
    if (lvParam) return run(el, lvParam === 'mix' ? 'mix' : isNaN(+lvParam) ? lvParam : +lvParam);
    const s = S();
    const tp = s.quiz.topics;
    const weak = Object.keys(tp)
      .map((k) => ({ id: k, acc: tp[k].r / Math.max(1, tp[k].r + tp[k].w), n: tp[k].r + tp[k].w }))
      .filter((x) => x.n > 0)
      .sort((a, b) => a.acc - b.acc);
    const answered = s.counters.quizAnswered;
    const acc = answered ? (s.counters.quizCorrect / answered) * 100 : 0;
    el.innerHTML = `
      <div class="page-head"><div><h2>Knowledge Tests</h2><p class="muted">Ten questions per level: multiple choice, chart identification and real trading decisions. Answers are revealed only after you commit. Pass with 70%.</p></div>
      <div class="ring" style="--p:${acc}"><b>${answered ? acc.toFixed(0) + '%' : '—'}</b><small>accuracy</small></div></div>
      <div class="grid g4">${TM.Tests.levels
        .map((L) => {
          const r = s.quiz.levels[L.id];
          const unlocked = TM.Lessons.levelUnlocked(L.id);
          return `<section class="card test-card ${r && r.passed ? 'passed' : ''}"><div class="lv-ic">${L.icon}</div><b>${L.id === 'C' ? 'Crypto' : 'Level ' + L.id}: ${L.name}</b><div class="small muted">${r ? `Best ${r.best}% · ${r.count} attempt${r.count > 1 ? 's' : ''}` : 'Not attempted'}</div>${r && r.passed ? '<span class="pill pill-ok">Passed ✓</span>' : ''}<a class="btn btn-sm ${unlocked ? 'btn-primary' : 'btn-ghost'}" href="${unlocked ? '#test-' + L.id : '#tests'}" ${unlocked ? '' : 'data-locked="1"'}>${unlocked ? (r ? 'Retake' : 'Start test') : '🔒 Locked'}</a></section>`;
        })
        .join('')}</div>
      <div class="grid g2">
        <section class="card"><h3>Knowledge map</h3>${weak.length ? `<ul class="bars">${weak.slice(0, 10).map((w) => { const l = TM.Lessons.byId(w.id); return `<li><span>${l ? l.id.replace('-', '.') + ' ' + U.esc(l.title) : w.id}</span><i class="${w.acc >= 0.7 ? 'ok' : 'bad'}" style="width:${Math.max(4, w.acc * 100)}%"></i><b>${Math.round(w.acc * 100)}%</b>${w.acc < 0.7 && l ? `<a class="link small" href="#lesson-${l.id}">review →</a>` : ''}</li>`; }).join('')}</ul><p class="tiny muted">Sorted weakest first. Red topics are recommended for review.</p>` : '<p class="muted small">Answer quiz questions in lessons and tests to build your knowledge map.</p>'}</section>
        <section class="card"><h3>Mixed review</h3><p class="small">10 questions drawn from <b>your weakest topics</b> across every unlocked level. The fastest way to close knowledge gaps.</p><a class="btn btn-primary" href="#test-mix">Start mixed review</a></section>
      </div>`;
    U.$$('[data-locked]', el).forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      U.toast('Finish the previous level’s lessons to unlock this test (or enable "Unlock all levels" in Settings).', 'info');
    }));
  };

  function run(el, lv) {
    const s = S();
    let pool;
    let title;
    if (lv === 'mix') {
      const tp = s.quiz.topics;
      const all = TM.Tests.levels.filter((L) => TM.Lessons.levelUnlocked(L.id)).flatMap((L) => TM.Tests.pool(L.id));
      const score = (q) => {
        const t = tp[q.lesson];
        return t ? t.r / Math.max(1, t.r + t.w) : 0.5;
      };
      pool = U.shuffle(all).sort((a, b) => score(a) - score(b)).slice(0, N);
      title = 'Mixed review';
    } else {
      if (!TM.Lessons.levelUnlocked(lv)) {
        location.hash = '#tests';
        return;
      }
      const L = TM.Tests.levels.find((x) => x.id === lv);
      title = `${L.icon} ${lv === 'C' ? 'Crypto' : 'Level ' + lv}: ${L.name}`;
      const p = TM.Tests.pool(lv);
      const charts = U.shuffle(p.filter((q) => q.chart));
      const plain = U.shuffle(p.filter((q) => !q.chart));
      pool = U.shuffle(charts.slice(0, 3).concat(plain).slice(0, N));
    }
    let i = 0,
      right = 0,
      chart = null;
    const missed = [];
    el.innerHTML = `<div class="lesson-top"><a class="btn btn-ghost btn-sm" href="#tests">← Tests</a><div class="lt-t"><div class="eyebrow">Knowledge test</div><h2>${title}</h2></div></div><div class="qbar"><i></i></div><div class="card test-body"></div>`;
    const body = el.querySelector('.test-body');
    const bar = el.querySelector('.qbar i');
    const one = () => {
      if (chart) chart.destroy();
      chart = null;
      const q = pool[i];
      bar.style.width = (i / pool.length) * 100 + '%';
      body.innerHTML = `<div class="muted small">Question ${i + 1} of ${pool.length}${q.chart ? ' · chart identification' : ''}</div>`;
      if (q.chart) {
        const box = U.el('<div></div>');
        body.appendChild(box);
        chart = TM.W.chartIn(box, Object.assign({ height: 260 }, q.chart)).ch;
      }
      const order = U.shuffle(q.o.map((t, k) => ({ t, k })));
      const sel = U.el('<div></div>');
      body.appendChild(sel);
      // commit-then-reveal: choose, then press "Check answer"
      sel.innerHTML = `<p class="w-prompt">${q.q}</p><div class="opts">${order.map((o, k) => `<button class="opt" data-k="${k}"><span class="opt-k">${'ABCD'[k]}</span><span>${o.t}</span></button>`).join('')}</div><div class="btn-row"><button class="btn btn-primary" id="t-check" disabled>Check answer</button></div><div class="w-fb"></div>`;
      let pick = null;
      U.on(sel, 'click', '.opt', (e, b) => {
        if (sel.dataset.locked) return;
        U.$$('.opt', sel).forEach((x) => x.classList.toggle('sel', x === b));
        pick = +b.dataset.k;
        sel.querySelector('#t-check').disabled = false;
      });
      sel.querySelector('#t-check').onclick = () => {
        if (pick == null || sel.dataset.locked) return;
        sel.dataset.locked = '1';
        const ansK = order.findIndex((o) => o.k === q.a);
        const ok = pick === ansK;
        U.$$('.opt', sel).forEach((x, k) => {
          x.disabled = true;
          if (k === ansK) x.classList.add('right');
          if (k === pick && !ok) x.classList.add('wrong');
        });
        if (ok) right++;
        else missed.push(q);
        TM.recordAnswer(q.lesson, ok);
        const l = TM.Lessons.byId(q.lesson);
        const fbx = sel.querySelector('.w-fb');
        fbx.className = 'w-fb show ' + (ok ? 'fb-ok' : 'fb-bad');
        fbx.innerHTML = (ok ? '✓ Correct. ' : '✕ Incorrect. ') + q.e + (!ok && l ? ` <a class="link" href="#lesson-${l.id}">Review lesson ${l.id.replace('-', '.')}</a>` : '');
        U.sound(ok ? 'click' : 'error');
        const btn = sel.querySelector('#t-check');
        btn.textContent = i < pool.length - 1 ? 'Next question →' : 'See results';
        btn.onclick = () => {
          i++;
          if (i < pool.length) one();
          else finish();
        };
      };
    };
    const finish = () => {
      if (chart) chart.destroy();
      chart = null;
      bar.style.width = '100%';
      const pct = Math.round((right / pool.length) * 100);
      const passed = pct >= 70;
      let xp = 0;
      if (lv !== 'mix') {
        const prev = s.quiz.levels[lv];
        const firstPass = passed && !(prev && prev.passed);
        s.quiz.levels[lv] = { best: Math.max(prev ? prev.best : 0, pct), last: pct, count: (prev ? prev.count : 0) + 1, passed: passed || !!(prev && prev.passed) };
        if (firstPass) xp += 150;
        if (pct === 100 && !(prev && prev.best === 100)) {
          xp += 50;
          s.counters.perfectTests++;
        }
      } else xp = right * 3;
      TM.Store.save();
      if (xp) TM.Progress.addXP(xp, lv === 'mix' ? 'Mixed review' : `Test passed: ${pct}%`);
      TM.Progress.checkAchievements();
      const recs = {};
      missed.forEach((q) => q.lesson && (recs[q.lesson] = (recs[q.lesson] || 0) + 1));
      body.innerHTML = `<div class="ls-done"><div class="ls-done-ic">${passed ? '🏆' : '📚'}</div><h3>${pct}% — ${passed ? 'Passed!' : 'Not yet'}</h3><p class="muted">${right} of ${pool.length} correct. ${passed ? 'Great work. Knowledge without discipline is useless, so go and apply it in the simulators.' : 'You need 70% to pass. Review the recommended lessons and try again.'}</p>
        ${Object.keys(recs).length ? `<h4>Recommended review</h4><div class="btn-row center">${Object.keys(recs).map((id) => { const l = TM.Lessons.byId(id); return l ? `<a class="chip" href="#lesson-${id}">📘 ${id.replace('-', '.')} ${U.esc(l.title)} · missed ${recs[id]}</a>` : ''; }).join('')}</div>` : ''}
        <div class="btn-row center"><a class="btn btn-ghost" href="#tests">All tests</a><button class="btn btn-primary" id="t-retry">Retake</button></div></div>`;
      body.querySelector('#t-retry').onclick = () => TM.route();
    };
    one();
    return { destroy: () => chart && chart.destroy() };
  }
})();

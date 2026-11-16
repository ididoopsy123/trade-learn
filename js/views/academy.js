/* TRADE MASTERY — Section 1: Trading Academy (learning path + lesson player) */
(function () {
  'use strict';
  const U = TM.U;
  const S = () => TM.Store.s;

  TM.recordAnswer = function (lessonId, ok) {
    const t = S().quiz.topics;
    t[lessonId] = t[lessonId] || { r: 0, w: 0 };
    ok ? t[lessonId].r++ : t[lessonId].w++;
    S().counters.quizAnswered++;
    if (ok) S().counters.quizCorrect++;
    TM.Progress.goal('quiz');
    TM.Store.save();
  };

  TM.Views.academy = function (el) {
    const s = S();
    const done = (id) => s.lessons[id] && s.lessons[id].done;
    const next = TM.Lessons.next();
    const total = TM.Lessons.list.length;
    const nDone = TM.Lessons.list.filter((l) => done(l.id)).length;
    el.innerHTML = `
      <div class="page-head"><div><h2>Trading Academy</h2><p class="muted">Seven levels from zero to strategist, plus a crypto track. Every lesson: explanation → visual → hands-on exercise → quiz → real scenario.</p></div>
      <div class="ring" style="--p:${(nDone / total) * 100}"><b>${nDone}</b><small>/ ${total}</small></div></div>
      <div class="levels">${TM.Lessons.LEVELS.map((L) => {
        const ls = TM.Lessons.ofLevel(L.id);
        const unlocked = TM.Lessons.levelUnlocked(L.id);
        const nd = ls.filter((l) => done(l.id)).length;
        const test = s.quiz.levels[L.id];
        return `<section class="level card ${unlocked ? '' : 'locked'} ${L.star ? 'star' : ''}">
          <header class="lv-head"><span class="lv-ic">${L.icon}</span><div class="lv-t"><div class="eyebrow">${L.id === 'C' ? 'Bonus track' : 'Level ' + L.id}${L.star ? ' · ⭐ Most important' : ''}</div><h3>${L.name}</h3><p class="muted small">${L.blurb}</p></div>
          <div class="lv-prog"><div class="xpbar"><i style="width:${(nd / ls.length) * 100}%"></i></div><span class="small muted">${nd}/${ls.length} lessons${L.rank !== 'Bonus' ? ' · unlocks rank ' + L.rank : ''}</span></div></header>
          ${unlocked ? '' : `<div class="lock-msg">🔒 Complete ${L.id === 'C' ? 'Level 1' : 'Level ' + (typeof L.id === 'number' ? L.id - 1 : '')} to unlock — or enable "Unlock all levels" in Settings.</div>`}
          <div class="lessons">${ls
            .map((l) => {
              const st = done(l.id) ? 'done' : next && next.id === l.id ? 'next' : unlocked ? 'open' : 'locked';
              return `<a class="lesson ${st}" href="${unlocked ? '#lesson-' + l.id : '#academy'}" ${unlocked ? '' : 'aria-disabled="true"'}><span class="ls-n">${l.id.replace('-', '.')}</span><span class="ls-b"><b>${U.esc(l.title)}</b><span class="small muted">${l.topics.join(' · ')}</span></span><span class="ls-s">${st === 'done' ? '✓' : st === 'next' ? '▶' : st === 'locked' ? '🔒' : ''}</span></a>`;
            })
            .join('')}
            <a class="lesson test ${unlocked ? '' : 'locked'}" href="${unlocked ? '#test-' + L.id : '#academy'}"><span class="ls-n">🧠</span><span class="ls-b"><b>${L.name} — Knowledge Test</b><span class="small muted">${test ? `Best ${test.best}% · ${test.passed ? 'Passed ✓' : 'Not passed yet'}` : '10 questions · pass with 70%'}</span></span><span class="ls-s">${test && test.passed ? '✓' : ''}</span></a>
          </div></section>`;
      }).join('')}</div>`;
    U.$$('.lesson[aria-disabled]', el).forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      U.toast('This level is locked. Finish the previous level first (or enable "Unlock all levels" in Settings).', 'info');
    }));
  };

  /* ---------------- lesson player ---------------- */
  TM.Views.lesson = function (el, id) {
    const lesson = TM.Lessons.byId(id);
    if (!lesson) {
      location.hash = '#academy';
      return;
    }
    if (!TM.Lessons.unlocked(lesson)) {
      el.innerHTML = `<div class="card"><h3>🔒 Lesson locked</h3><p class="muted">Complete the previous level first, or enable "Unlock all levels" in Settings.</p><a class="btn btn-primary" href="#academy">Back to the Academy</a></div>`;
      return;
    }
    const s = S();
    const firstTime = !(s.lessons[id] && s.lessons[id].done);
    const steps = lesson.steps;
    const solved = new Array(steps.length).fill(false);
    let i = 0,
      widget = null;
    const res = { quizRight: 0, quizTotal: 0, exFirst: 0, scen: null };
    const label = { learn: 'Learn', do: 'Practice', quiz: 'Quiz', scenario: 'Scenario' };
    const lv = TM.Lessons.LEVELS.find((L) => L.id === lesson.level);
    el.innerHTML = `
      <div class="lesson-top"><a class="btn btn-ghost btn-sm" href="#academy">← Academy</a><div class="lt-t"><div class="eyebrow">${lv.icon} ${lesson.level === 'C' ? 'Crypto track' : 'Level ' + lesson.level + ' · ' + lv.name} · Lesson ${id.replace('-', '.')}</div><h2>${U.esc(lesson.title)}</h2></div></div>
      <div class="stepper">${steps.map((st, k) => `<button class="stp" data-k="${k}"><i></i><span>${label[st.type]}</span></button>`).join('')}</div>
      <div class="lesson-body card"></div>
      <div class="lesson-nav"><button class="btn btn-ghost" id="ls-back">← Back</button><span class="muted small" id="ls-req"></span><button class="btn btn-primary" id="ls-next">Next →</button></div>`;
    const body = el.querySelector('.lesson-body');
    const nextB = el.querySelector('#ls-next');
    const backB = el.querySelector('#ls-back');
    const req = el.querySelector('#ls-req');

    const refreshNav = () => {
      U.$$('.stp', el).forEach((b, k) => {
        b.classList.toggle('on', k === i);
        b.classList.toggle('done', solved[k]);
        b.disabled = k > i && !solved.slice(0, k).every(Boolean);
      });
      const st = steps[i];
      const needs = st.type !== 'learn' && !solved[i];
      nextB.disabled = needs;
      req.textContent = needs ? { do: 'Complete the exercise to continue', quiz: 'Answer the questions to continue', scenario: 'Finish the scenario to continue' }[st.type] : '';
      nextB.textContent = i === steps.length - 1 ? 'Finish lesson ✓' : 'Next →';
      backB.disabled = i === 0;
    };
    const show = (k) => {
      if (widget && widget.destroy) widget.destroy();
      widget = null;
      i = k;
      const st = steps[i];
      body.innerHTML = '';
      body.classList.remove('fade-in');
      void body.offsetWidth;
      body.classList.add('fade-in');
      TM.Coach.setContext({ view: 'lesson', hint: null, label: 'Lesson ' + id.replace('-', '.') });
      if (st.type === 'learn') {
        body.insertAdjacentHTML('beforeend', `<h3>${st.title}</h3><div class="learn-text">${st.body}</div>`);
        if (st.visual) {
          const v = U.el('<div class="learn-visual"></div>');
          body.appendChild(v);
          widget = TM.W[st.visual.w](v, st.visual, () => {});
        }
        solved[i] = true;
      } else if (st.type === 'do') {
        body.insertAdjacentHTML('beforeend', `<div class="eyebrow">Interactive exercise</div>`);
        widget = TM.W[st.w](body, st, (r) => {
          if (!solved[i] && r.firstTry) res.exFirst++;
          solved[i] = true;
          refreshNav();
        });
      } else if (st.type === 'quiz') {
        runQuiz(st);
      } else if (st.type === 'scenario') {
        body.insertAdjacentHTML('beforeend', `<div class="eyebrow">Practical trading scenario</div>`);
        widget = TM.W.scenario(body, st, (r) => {
          res.scen = r.score;
          solved[i] = true;
          refreshNav();
        });
      }
      refreshNav();
      body.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    const runQuiz = (st) => {
      let qi = 0;
      body.insertAdjacentHTML('beforeend', `<div class="eyebrow">Knowledge check · ${st.qs.length} questions</div><div class="qz"></div>`);
      const box = body.querySelector('.qz');
      const one = () => {
        const qq = st.qs[qi];
        box.innerHTML = `<div class="muted small">Question ${qi + 1} of ${st.qs.length}</div>`;
        const order = U.shuffle(qq.o.map((t, k) => ({ t, k })));
        TM.W.choice(box, { prompt: qq.q, options: order.map((x) => x.t), answer: order.findIndex((x) => x.k === qq.a), explain: qq.e }, (r) => {
          res.quizTotal++;
          if (r.ok) res.quizRight++;
          TM.recordAnswer(id, r.ok);
          const b = U.el(`<button class="btn btn-primary">${qi < st.qs.length - 1 ? 'Next question →' : 'Done ✓'}</button>`);
          b.onclick = () => {
            qi++;
            if (qi < st.qs.length) one();
            else {
              box.innerHTML = `<div class="qz-end"><b>${res.quizRight}/${res.quizTotal}</b> correct. ${res.quizRight === res.quizTotal ? 'Excellent!' : 'Review the explanations — they will come back in the Knowledge Test.'}</div>`;
              solved[i] = true;
              refreshNav();
            }
          };
          box.appendChild(b);
        });
      };
      one();
    };
    const finish = () => {
      if (widget && widget.destroy) widget.destroy();
      widget = null;
      let xp = 0;
      if (firstTime) {
        xp = 80 + res.quizRight * 10 + res.exFirst * 10 + (res.scen != null && res.scen >= 70 ? 20 : 0);
        s.lessons[id] = { done: true, at: Date.now(), quiz: { r: res.quizRight, t: res.quizTotal }, scen: res.scen };
        TM.Store.save();
        TM.Progress.addXP(xp, 'Lesson ' + id.replace('-', '.') + ' complete');
        TM.Progress.goal('lesson');
      }
      const nxt = TM.Lessons.next();
      const levelNowDone = TM.Progress.levelDone(lesson.level);
      el.querySelector('.stepper').innerHTML = '';
      el.querySelector('.lesson-nav').innerHTML = '';
      body.innerHTML = `<div class="ls-done"><div class="ls-done-ic">🎉</div><h3>Lesson complete!</h3>
        <div class="ls-done-stats"><div><b>${res.quizRight}/${res.quizTotal}</b><span>quiz</span></div><div><b>${res.scen != null ? res.scen + '%' : '—'}</b><span>scenario</span></div><div><b class="xp">${firstTime ? '+' + xp : '—'}</b><span>XP${firstTime ? '' : ' (replay)'}</span></div></div>
        <p class="muted">Key idea: ${U.esc(lesson.topics.join(', '))}. Put it to work in the simulators.</p>
        <div class="btn-row center">${levelNowDone ? `<a class="btn btn-primary" href="#test-${lesson.level}">🧠 Take the ${lv.name} test</a>` : ''}${nxt ? `<a class="btn ${levelNowDone ? 'btn-ghost' : 'btn-primary'}" href="#lesson-${nxt.id}">Next: ${nxt.id.replace('-', '.')} ${U.esc(nxt.title)} →</a>` : ''}<a class="btn btn-ghost" href="#academy">Back to Academy</a></div></div>`;
      U.sound('level');
    };
    nextB.onclick = () => {
      if (nextB.disabled) return;
      if (i === steps.length - 1) finish();
      else show(i + 1);
    };
    backB.onclick = () => i > 0 && show(i - 1);
    U.on(el.querySelector('.stepper'), 'click', '.stp', (e, b) => {
      const k = +b.dataset.k;
      if (!b.disabled) show(k);
    });
    show(0);
    return { destroy: () => widget && widget.destroy && widget.destroy() };
  };
})();

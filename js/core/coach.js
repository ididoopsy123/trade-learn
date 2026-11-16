/* TRADE MASTERY — "Coach Nova", a rule-based AI-style trading coach.
   It explains, analyses and recommends. It never predicts prices or promises profits. */
(function () {
  'use strict';
  const U = TM.U;
  const S = () => TM.Store.s;
  let ctx = { view: 'home', hint: null, label: '' };
  let panel, log, input, dot;

  function norm(s) {
    return ' ' + String(s).toLowerCase().replace(/[^a-z0-9:%.$/ -]/g, ' ').replace(/\s+/g, ' ') + ' ';
  }

  function findTerm(q) {
    const nq = norm(q);
    let best = null,
      bestLen = 0;
    TM.Glossary.forEach((g) => {
      [g.t].concat(g.a).forEach((alias) => {
        const a = ' ' + alias.toLowerCase() + ' ';
        const a2 = ' ' + alias.toLowerCase() + 's ';
        if ((nq.includes(a) || nq.includes(a2)) && alias.length > bestLen) {
          best = g;
          bestLen = alias.length;
        }
      });
    });
    return best;
  }

  function lessonLink(id) {
    const l = TM.Lessons && TM.Lessons.byId(id);
    return l ? `<a class="chip" href="#lesson-${l.id}">📘 Lesson ${l.id.replace('-', '.')}: ${U.esc(l.title)}</a>` : '';
  }

  function weakTopics() {
    const tp = S().quiz.topics;
    return Object.keys(tp)
      .map((k) => ({ id: k, acc: tp[k].r / Math.max(1, tp[k].r + tp[k].w), n: tp[k].r + tp[k].w }))
      .filter((x) => x.n >= 1 && x.acc < 0.7)
      .sort((a, b) => a.acc - b.acc);
  }

  const Coach = (TM.Coach = {
    setContext(c) {
      ctx = Object.assign({ hint: null, label: '' }, c);
      if (panel) U.$('.coach-ctx', panel).textContent = ctx.label ? 'Context: ' + ctx.label : '';
    },
    recommend() {
      const s = S();
      const out = [];
      const weak = weakTopics();
      weak.slice(0, 2).forEach((w) => {
        const l = TM.Lessons.byId(w.id);
        if (l) out.push({ l, why: `you answered ${Math.round(w.acc * 100)}% of questions on it correctly` });
      });
      // mistakes from trade reviews
      const counts = {};
      s.trades.slice(-25).forEach((t) => (t.review && t.review.lessons ? t.review.lessons : []).forEach((id) => (counts[id] = (counts[id] || 0) + 1)));
      Object.keys(counts)
        .sort((a, b) => counts[b] - counts[a])
        .slice(0, 2)
        .forEach((id) => {
          const l = TM.Lessons.byId(id);
          if (l && !out.find((o) => o.l.id === id)) out.push({ l, why: `this came up in ${counts[id]} of your recent trade reviews` });
        });
      const next = TM.Lessons.next();
      if (next && !out.find((o) => o.l.id === next.id)) out.push({ l: next, why: 'it is the next lesson on your learning path' });
      return out.slice(0, 3);
    },
    analyzeTrades() {
      const s = S();
      const tr = s.trades.slice(-30);
      if (!tr.length) return 'You have no closed trades yet. Open <a href="#practice">Practice Trading</a>, pick an asset, set a stop-loss and a target, and take your first simulated trade. I will review every trade you close.';
      const st = TM.Trading.stats(tr);
      const noStop = tr.filter((t) => !t.origStop).length;
      const bigRisk = tr.filter((t) => t.riskPct > 2.05).length;
      const widened = tr.filter((t) => t.stopMoves && t.stopMoves.some((m) => m.widened)).length;
      const counter = tr.filter((t) => t.ctx && ((t.side === 'long' && t.ctx.trend === 'down') || (t.side === 'short' && t.ctx.trend === 'up'))).length;
      const avgScore = tr.reduce((a, t) => a + (t.review ? t.review.score : 0), 0) / tr.length;
      let h = `<b>Your last ${tr.length} trades</b><ul class="coach-ul">
        <li>Win rate <b>${st.winRate.toFixed(0)}%</b> · profit factor <b>${isFinite(st.profitFactor) ? st.profitFactor.toFixed(2) : '∞'}</b> · net <b class="${U.cls(st.total)}">${U.smoney(st.total)}</b></li>
        <li>Average win ${U.money(st.avgWin)} vs average loss ${U.money(Math.abs(st.avgLoss))}${st.avgR != null ? ` · average result ${st.avgR.toFixed(2)}R` : ''}</li>
        <li>Average process score <b>${avgScore.toFixed(0)}/100</b></li></ul>`;
      const issues = [];
      if (noStop) issues.push(`<b>${noStop}</b> trade(s) had no stop-loss when you entered. ${lessonLink('4-1')}`);
      if (bigRisk) issues.push(`<b>${bigRisk}</b> trade(s) risked more than 2% of the account. ${lessonLink('4-2')}`);
      if (widened) issues.push(`You widened your stop on <b>${widened}</b> losing trade(s). ${lessonLink('4-5')}`);
      if (counter >= 3) issues.push(`<b>${counter}</b> trades went against the trend. ${lessonLink('2-4')}`);
      if (st.avgWin && st.avgLoss && Math.abs(st.avgLoss) > st.avgWin * 1.2) issues.push(`Your average loss is bigger than your average win. Cut losers at the stop and let winners reach their targets. ${lessonLink('4-1')}`);
      if (issues.length) h += '<b>What to work on</b><ul class="coach-ul">' + issues.map((x) => `<li>${x}</li>`).join('') + '</ul>';
      else h += 'Your process looks solid. Keep journaling — consistency is what turns good habits into an edge.';
      h += '<p class="muted small">Past results in a simulator do not predict future results.</p>';
      return h;
    },
    sizeCalc(q) {
      const nums = (q.match(/[0-9]+(?:\.[0-9]+)?/g) || []).map(Number);
      const acct = /account|balance/.test(q) ? nums[0] : null;
      if (nums.length >= 4) {
        const [a, r, e, st] = nums;
        const per = Math.abs(e - st);
        if (per > 0) {
          const riskD = a * (r / 100);
          const sh = Math.floor(riskD / per);
          return `With a <b>${U.money(a, 0)}</b> account risking <b>${r}%</b> (${U.money(riskD)}), entry <b>${e}</b> and stop <b>${st}</b> (${U.money(per)} per share):<br><b>Position size = ${U.money(riskD)} ÷ ${U.money(per)} = ${sh} shares</b> (≈ ${U.money(sh * e, 0)} position).`;
        }
      }
      return `Position size formula: <b>Shares = (Account × Risk%) ÷ (Entry − Stop)</b>.<br>Example: $10,000 × 1% = $100 risk. Entry $50, stop $48 → $2 risk per share → 50 shares.<br>Ask me like this: <i>"size account 10000 risk 1 entry 50 stop 48"</i>. ${lessonLink('4-2')}`;
    },
    answer(q) {
      const nq = norm(q);
      S().counters.coachQuestions++;
      TM.Store.save();
      TM.Progress.goal('coach');
      TM.Progress.checkAchievements();
      // safety: no predictions, no promises
      if (/((will|going to|gonna) .{0,30}(go up|go down|rise|fall|drop|pump|dump|crash|moon|increase|decrease|hit|reach|be worth)| predict| forecast| price target| guarantee| sure thing| should i (buy|sell|short)| what should i (buy|sell)| which (stock|coin|crypto)| best (coin|stock|crypto)| get rich| to the moon)/.test(nq)) {
        return `I cannot predict where any price will go — nobody can do that reliably, and anyone who promises profits is selling something. What I <i>can</i> do is help you build a process:<ul class="coach-ul"><li>What is the trend on the higher timeframe?</li><li>Where is the nearest support/resistance?</li><li>Where would your idea be proven wrong (stop)?</li><li>Is the reward at least 2× the risk?</li><li>Is the position sized to risk ≤1–2%?</li></ul>If you can answer all five, you have a plan — win or lose. ${lessonLink('7-4')}`;
      }
      if (/ hint | help me | stuck | clue | what do i do /.test(nq)) {
        if (ctx.hint) return '💡 ' + (typeof ctx.hint === 'function' ? ctx.hint() : ctx.hint);
        return 'There is no active exercise right now. Open a lesson or challenge and ask me for a hint while you work on it.';
      }
      if (/ analy| review | my trades | how am i doing | my performance | my stats | mistakes /.test(nq)) return Coach.analyzeTrades();
      if (/ recommend| what next | what should i learn | next lesson | weak| struggl| improve /.test(nq)) {
        const rec = Coach.recommend();
        if (!rec.length) return 'You have completed everything on the learning path. Revisit the Knowledge Tests and keep your journal going.';
        return '<b>Recommended for you</b><ul class="coach-ul">' + rec.map((r) => `<li>${lessonLink(r.l.id)}<br><span class="muted small">because ${r.why}</span></li>`).join('') + '</ul>';
      }
      if (/ size | position siz| how many shares | calculate /.test(nq) || (/ risk /.test(nq) && /[0-9]/.test(nq) && / stop /.test(nq))) return Coach.sizeCalc(q);
      if (/ rank | xp | level up | progress /.test(nq)) {
        const r = TM.Progress.rank();
        const n = TM.Progress.nextRank();
        return `You are a <b>${r.icon} ${r.name}</b> with <b>${S().xp} XP</b>.${n ? ` ${n.xp - S().xp} XP to <b>${n.name}</b>.` : ' That is the top rank!'} XP comes from lessons, tests, scenarios, challenges and <i>disciplined</i> trades — not from profit alone.`;
      }
      if (/ real money | broker | invest real | ready for real| go live /.test(nq)) {
        return 'Before risking real money, aim for: 50+ simulated trades with a written plan, a positive expectancy, a max drawdown under 10%, and a journal that shows you follow your rules. Start tiny when you do. I am a teaching tool — this is not financial advice.';
      }
      const term = findTerm(q);
      if (term) return `<b>${term.t}</b><br>${term.d}<br>${lessonLink(term.l)}`;
      if (/ hello | hi | hey | yo /.test(nq)) return `Hi${S().name ? ' ' + U.esc(S().name) : ''}! I am Coach Nova. Ask me what a term means, ask for a <b>hint</b>, say <b>analyse my trades</b>, or <b>what should I learn next</b>.`;
      return 'I am not sure about that one. Try asking about a term (e.g. <i>"what is RSI"</i>, <i>"explain stop hunt"</i>), say <b>hint</b> during an exercise, <b>analyse my trades</b>, <b>what should I learn next</b>, or <b>position size</b>.';
    },
    push(who, html) {
      if (!log) return;
      const m = U.el(`<div class="cmsg cmsg-${who}"><div class="cbub"></div></div>`);
      m.querySelector('.cbub').innerHTML = html;
      log.appendChild(m);
      log.scrollTop = log.scrollHeight;
      m.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', () => Coach.toggle(false)));
    },
    say(html) {
      Coach.push('bot', html);
      if (!panel.classList.contains('open')) dot.hidden = false;
    },
    ask(q) {
      if (!q.trim()) return;
      Coach.push('me', U.esc(q));
      const typing = U.el('<div class="cmsg cmsg-bot"><div class="cbub typing"><i></i><i></i><i></i></div></div>');
      log.appendChild(typing);
      log.scrollTop = log.scrollHeight;
      setTimeout(() => {
        typing.remove();
        Coach.push('bot', Coach.answer(q));
      }, 380);
    },
    toggle(force) {
      const open = force == null ? !panel.classList.contains('open') : force;
      panel.classList.toggle('open', open);
      document.body.classList.toggle('coach-open', open);
      if (open) {
        dot.hidden = true;
        setTimeout(() => input.focus(), 120);
      }
    },
    init() {
      const root = document.getElementById('coach');
      root.innerHTML = `
        <button class="coach-fab" aria-label="Open trading coach"><span class="coach-av">N</span><span class="coach-fab-t">Coach</span><span class="coach-dot" hidden></span></button>
        <section class="coach-panel" aria-label="Coach Nova">
          <header><div class="coach-av">N</div><div><b>Coach Nova</b><div class="muted small">AI-style trading coach · explains, never predicts</div></div><button class="icon-btn coach-x" aria-label="Close coach">✕</button></header>
          <div class="coach-ctx small muted"></div>
          <div class="coach-log"></div>
          <div class="coach-chips">
            <button data-q="hint">💡 Hint</button><button data-q="Analyse my trades">📊 Analyse my trades</button><button data-q="What should I learn next?">🧭 What next?</button><button data-q="How do I size a position?">⚖️ Position size</button><button data-q="What is a stop-loss?">🛑 Stop-loss</button><button data-q="What is RSI?">RSI?</button>
          </div>
          <form class="coach-form"><input id="coach-input" autocomplete="off" placeholder="Ask about any trading term…" aria-label="Ask the coach"><button class="btn btn-primary btn-sm">Ask</button></form>
        </section>`;
      panel = U.$('.coach-panel', root);
      log = U.$('.coach-log', root);
      input = U.$('#coach-input', root);
      dot = U.$('.coach-dot', root);
      U.$('.coach-fab', root).onclick = () => Coach.toggle();
      U.$('.coach-x', root).onclick = () => Coach.toggle(false);
      U.$('.coach-form', root).onsubmit = (e) => {
        e.preventDefault();
        Coach.ask(input.value);
        input.value = '';
      };
      U.on(root, 'click', '.coach-chips button', (e, b) => Coach.ask(b.dataset.q));
      Coach.push('bot', `Hi${S().name ? ' ' + U.esc(S().name) : ''}! I am <b>Coach Nova</b>. I explain terms, review your simulated trades, give hints during exercises and suggest lessons. I will never predict prices or promise profits — I teach process.`);
    },
  });
})();

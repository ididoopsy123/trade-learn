/* TRADE MASTERY — XP, ranks, achievements, challenges, daily goals, and the post-trade flow */
(function () {
  'use strict';
  const U = TM.U;
  const S = () => TM.Store.s;

  const RANKS = [
    { name: 'Market Beginner', xp: 0, icon: '🌱', blurb: 'Learning how markets work.' },
    { name: 'Chart Reader', xp: 600, icon: '🕯️', blurb: 'Can read candles, trends and levels.' },
    { name: 'Technical Analyst', xp: 1500, icon: '📐', blurb: 'Understands indicators and their limits.' },
    { name: 'Risk Manager', xp: 2700, icon: '🛡️', blurb: 'Protects capital before chasing profit.' },
    { name: 'Day Trader', xp: 4200, icon: '⚡', blurb: 'Manages intraday trades with a plan.' },
    { name: 'Swing Trader', xp: 6000, icon: '🌊', blurb: 'Holds multi-day trends with patience.' },
    { name: 'Advanced Trader', xp: 8200, icon: '🎯', blurb: 'Reads structure, liquidity and traps.' },
    { name: 'Market Strategist', xp: 11000, icon: '👑', blurb: 'Trades a tested personal strategy with discipline.' },
  ];

  const P = (TM.Progress = {
    RANKS,
    rankIndex(xp = S().xp) {
      let r = 0;
      RANKS.forEach((k, i) => xp >= k.xp && (r = i));
      return r;
    },
    rank(xp) {
      return RANKS[P.rankIndex(xp)];
    },
    nextRank(xp = S().xp) {
      return RANKS[P.rankIndex(xp) + 1] || null;
    },
    levelProgress(xp = S().xp) {
      const i = P.rankIndex(xp);
      const cur = RANKS[i],
        nxt = RANKS[i + 1];
      if (!nxt) return { pct: 100, into: xp - cur.xp, need: 0 };
      return { pct: ((xp - cur.xp) / (nxt.xp - cur.xp)) * 100, into: xp - cur.xp, need: nxt.xp - xp };
    },
    addXP(amount, reason, quiet) {
      if (!amount) return;
      const s = S();
      const before = P.rankIndex(s.xp);
      s.xp += amount;
      s.xpLog.unshift({ t: Date.now(), amount, reason });
      if (s.xpLog.length > 80) s.xpLog.length = 80;
      TM.Store.save();
      if (!quiet) U.toast(`<b class="xp">+${amount} XP</b> ${U.esc(reason)}`, 'xp');
      U.sound('xp');
      const after = P.rankIndex(s.xp);
      TM.bus.emit('xp', { amount, reason });
      if (after > before) {
        setTimeout(() => P.rankUp(RANKS[after]), 500);
      }
      P.checkAchievements();
    },
    rankUp(r) {
      U.sound('level');
      U.modal({
        title: 'Rank up!',
        body: `<div class="rankup"><div class="rankup-ic">${r.icon}</div><div class="rankup-name">${r.name}</div><p>${r.blurb}</p><p class="muted">Ranks reward knowledge and discipline — not just profit.</p></div>`,
        actions: [{ label: 'Keep learning', cls: 'btn-primary' }],
      });
      TM.Coach && TM.Coach.say(`Congratulations on reaching <b>${r.name}</b>! ${r.blurb}`);
    },

    /* ---------------- achievements ---------------- */
    ACH: [
      { id: 'first-lesson', icon: '📘', name: 'First Step', desc: 'Complete your first lesson.', xp: 25, test: (s) => Object.values(s.lessons).some((l) => l.done) },
      { id: 'lvl-1', icon: '🏛️', name: 'Market Basics Graduate', desc: 'Complete every Level 1 lesson.', xp: 75, test: (s) => P.levelDone(1) },
      { id: 'lvl-2', icon: '🕯️', name: 'Chart Reader', desc: 'Complete every Level 2 lesson.', xp: 75, test: (s) => P.levelDone(2) },
      { id: 'lvl-3', icon: '📐', name: 'Indicator Expert', desc: 'Complete every Level 3 lesson.', xp: 75, test: (s) => P.levelDone(3) },
      { id: 'lvl-4', icon: '🛡️', name: 'Capital Guardian', desc: 'Complete every Level 4 lesson.', xp: 100, test: (s) => P.levelDone(4) },
      { id: 'lvl-5', icon: '⚡', name: 'Intraday Ready', desc: 'Complete every Level 5 lesson.', xp: 75, test: (s) => P.levelDone(5) },
      { id: 'lvl-6', icon: '🌊', name: 'Swing Ready', desc: 'Complete every Level 6 lesson.', xp: 75, test: (s) => P.levelDone(6) },
      { id: 'lvl-7', icon: '🎯', name: 'Advanced Graduate', desc: 'Complete every Level 7 lesson.', xp: 100, test: (s) => P.levelDone(7) },
      { id: 'lvl-c', icon: '🪙', name: 'Crypto Scholar', desc: 'Complete the Crypto Track.', xp: 75, test: (s) => P.levelDone('C') },
      { id: 'first-trade', icon: '🧾', name: 'Paper Trader', desc: 'Close your first simulated trade.', xp: 25, test: (s) => s.trades.length >= 1 },
      { id: 'first-stop', icon: '🛑', name: 'Seatbelt On', desc: 'Close a trade that had a stop-loss from the start.', xp: 25, test: (s) => s.counters.tradesWithStop >= 1 },
      { id: 'good-loss', icon: '🧘', name: 'A Good Loss', desc: 'Get stopped out at a planned, small loss (≤2% risk).', xp: 40, test: (s) => s.counters.goodLosses >= 1 },
      { id: 'risk-10', icon: '⚖️', name: 'Risk Respecter', desc: 'Close 10 trades that risked 1% or less.', xp: 75, test: (s) => s.trades.filter((t) => t.riskPct != null && t.riskPct <= 1.05).length >= 10 },
      { id: 'disc-25', icon: '🎖️', name: 'Disciplined', desc: 'Close 25 trades graded B or better.', xp: 150, test: (s) => s.counters.disciplinedTrades >= 25 },
      { id: 'journal-1', icon: '✍️', name: 'Dear Diary', desc: 'Write your first journal entry.', xp: 25, test: (s) => s.counters.journalCount >= 1 },
      { id: 'journal-10', icon: '📓', name: 'Reflective Trader', desc: 'Write 10 journal entries.', xp: 100, test: (s) => s.counters.journalCount >= 10 },
      { id: 'test-pass', icon: '✅', name: 'Tested', desc: 'Pass a knowledge test (70%+).', xp: 25, test: (s) => Object.values(s.quiz.levels).some((l) => l.passed) },
      { id: 'test-perfect', icon: '💯', name: 'Perfect Score', desc: 'Score 100% on a knowledge test.', xp: 75, test: (s) => s.counters.perfectTests >= 1 },
      { id: 'scen-1', icon: '🎬', name: 'Scenario Rookie', desc: 'Complete a market scenario.', xp: 25, test: (s) => Object.keys(s.scenarios).length >= 1 },
      { id: 'scen-all', icon: '🏆', name: 'Scenario Specialist', desc: 'Complete every market scenario.', xp: 150, test: (s) => TM.Scenarios && TM.Scenarios.list.every((x) => s.scenarios[x.id]) },
      { id: 'day-grad', icon: '🔔', name: 'Opening Bell', desc: 'Finish a full day-trading session.', xp: 50, test: (s) => s.counters.daySessions >= 1 },
      { id: 'swing-grad', icon: '📅', name: 'Eight Weeks Later', desc: 'Finish a swing-trading campaign.', xp: 75, test: (s) => s.counters.swingCampaigns >= 1 },
      { id: 'crypto-first', icon: '🪙', name: 'Never Sleeps', desc: 'Close a crypto trade.', xp: 25, test: (s) => s.trades.some((t) => t.mode === 'crypto') },
      { id: 'storm', icon: '🌪️', name: 'Storm Survivor', desc: 'Survive a crypto volatility storm without liquidation.', xp: 75, test: (s) => s.counters.stormsSurvived >= 1 },
      { id: 'sr-5', icon: '📏', name: 'Level Spotter', desc: 'Identify 5 support/resistance levels.', xp: 50, test: (s) => s.counters.srFound >= 5 },
      { id: 'fake-3', icon: '🕵️', name: 'Trap Detector', desc: 'Identify 3 fake breakouts.', xp: 50, test: (s) => s.counters.fakeoutsFound >= 3 },
      { id: 'plan', icon: '🗺️', name: 'Plan the Trade', desc: 'Write your personal trading plan.', xp: 50, test: (s) => !!s.plan },
      { id: 'coach', icon: '🤖', name: 'Curious Mind', desc: 'Ask the coach 5 questions.', xp: 25, test: (s) => s.counters.coachQuestions >= 5 },
      { id: 'streak-3', icon: '🔥', name: 'On a Roll', desc: 'Complete all daily goals 3 days in a row.', xp: 50, test: (s) => s.daily.streak >= 3 },
      { id: 'streak-7', icon: '☄️', name: 'Habit Formed', desc: 'Complete all daily goals 7 days in a row.', xp: 150, test: (s) => s.daily.streak >= 7 },
      { id: 'rank-4', icon: '🛡️', name: 'Risk Manager Rank', desc: 'Reach the Risk Manager rank.', xp: 0, test: (s) => P.rankIndex(s.xp) >= 3 },
      { id: 'rank-8', icon: '👑', name: 'Market Strategist', desc: 'Reach the highest rank.', xp: 0, test: (s) => P.rankIndex(s.xp) >= 7 },
    ],
    levelDone(lv) {
      if (!TM.Lessons) return false;
      const ls = TM.Lessons.list.filter((l) => l.level === lv);
      return ls.length > 0 && ls.every((l) => S().lessons[l.id] && S().lessons[l.id].done);
    },
    checkAchievements() {
      const s = S();
      P.ACH.forEach((a) => {
        if (s.achievements[a.id]) return;
        let ok = false;
        try {
          ok = a.test(s);
        } catch (e) {}
        if (ok) {
          s.achievements[a.id] = Date.now();
          TM.Store.save();
          setTimeout(() => {
            U.toast(`<span class="ach-toast">${a.icon}</span> <b>Achievement:</b> ${a.name}`, 'ach', { ms: 4200 });
            if (a.xp) P.addXP(a.xp, 'Achievement: ' + a.name, true);
          }, 300);
        }
      });
      TM.bus.emit('progress');
    },

    /* ---------------- challenges ---------------- */
    CH: [
      { id: 'c-careful', tier: 'Bronze', icon: '🛡️', title: 'Careful Profits', desc: 'Make 3 profitable trades without risking more than 1% of your account on any of them.', xp: 200, prog: (s) => [s.counters.lowRiskWins, 3], go: '#practice', hint: 'Use the "Risk %" sizing mode in the order ticket and set it to 1%. Place the stop below a recent swing low.' },
      { id: 'c-levels', tier: 'Bronze', icon: '📏', title: 'Level Spotter', desc: 'Identify 5 support and resistance levels on simulated charts.', xp: 150, prog: (s) => [s.counters.srFound, 5], drill: 'levels', hint: 'Look for prices where the chart turned around at least twice. Support is a floor; resistance is a ceiling.' },
      { id: 'c-journal', tier: 'Bronze', icon: '✍️', title: 'Journal Habit', desc: 'Record 5 completed trades in your trading journal.', xp: 150, prog: (s) => [s.counters.journalCount, 5], go: '#journal', hint: 'After every trade, write why you entered and what you learned. Pending trades appear at the top of the Journal.' },
      { id: 'c-rr', tier: 'Silver', icon: '⚖️', title: 'Positive Expectancy', desc: 'Complete 10 trades with both a stop and a target, averaging a planned reward:risk of at least 1.5:1.', xp: 300, prog: (s) => P.rrProgress(s), go: '#practice', hint: 'Place targets at least 2× as far from entry as your stop. The ticket shows R:R live before you submit.' },
      { id: 'c-fake', tier: 'Silver', icon: '🕵️', title: 'Fakeout Detective', desc: 'Correctly identify 3 fake breakouts.', xp: 250, prog: (s) => [s.counters.fakeoutsFound, 3], drill: 'fakeout', hint: 'Fake breakouts often have weak volume, long upper wicks, and quickly close back inside the range.' },
      { id: 'c-week', tier: 'Silver', icon: '📆', title: 'Green Week', desc: 'Finish a profitable simulated trading week (5 day-trading sessions, or one week of the swing simulator).', xp: 300, prog: (s) => [Math.min(1, s.counters.greenWeeks), 1], go: '#day', hint: 'Profit comes from small losses and patient winners. Skip low-quality setups — no trade is also a decision.' },
      { id: 'c-swing', tier: 'Gold', icon: '🌊', title: 'Swing Portfolio', desc: 'In the swing simulator, hold 3 positions in 3 different sectors at the same time, each risking 2% or less.', xp: 350, prog: (s) => [Math.min(1, s.counters.swingPortfolio), 1], go: '#swing', hint: 'Diversify: one tech, one healthcare, one energy name. Size each with the risk calculator.' },
      { id: 'c-storm', tier: 'Gold', icon: '🌪️', title: 'Crypto Survivor', desc: 'Start a Volatility Storm in Crypto, trade through it with leverage, and end the storm without being liquidated.', xp: 350, prog: (s) => [Math.min(1, s.counters.stormsSurvived), 1], go: '#crypto', hint: 'Keep leverage low (2–3×). Your liquidation price must be far beyond your stop.' },
      { id: 'c-dozen', tier: 'Gold', icon: '🎖️', title: 'Disciplined Dozen', desc: 'Close 12 trades in a row that each had a stop-loss and risked 2% or less.', xp: 400, prog: (s) => [Math.min(12, P.streak(s)), 12], go: '#practice', hint: 'One trade without a stop resets the streak. Discipline is a habit, not a single trade.' },
      { id: 'c-scen', tier: 'Platinum', icon: '🎬', title: 'Scenario Master', desc: 'Score 70% or higher on every realistic market scenario.', xp: 500, prog: (s) => [TM.Scenarios ? TM.Scenarios.list.filter((x) => s.scenarios[x.id] && s.scenarios[x.id].best >= 70).length : 0, TM.Scenarios ? TM.Scenarios.list.length : 9], go: '#scenarios', hint: 'Each decision is scored on process. Read the explanation after each choice — they repeat across scenarios.' },
      { id: 'c-scholar', tier: 'Platinum', icon: '🎓', title: 'Scholar', desc: 'Pass every knowledge test with 70% or more.', xp: 500, prog: (s) => [TM.Tests ? TM.Tests.levels.filter((l) => s.quiz.levels[l.id] && s.quiz.levels[l.id].passed).length : 0, TM.Tests ? TM.Tests.levels.length : 8], go: '#tests', hint: 'Missed questions point you to the exact lesson to review.' },
      { id: 'c-strategist', tier: 'Diamond', icon: '👑', title: 'The Strategist', desc: 'Write a personal trading plan, then close 20 trades graded B or better.', xp: 800, prog: (s) => [(s.plan ? 1 : 0) + Math.min(20, s.counters.disciplinedTrades), 21], go: '#lesson-7-4', hint: 'Build your plan in Lesson 7.4, then follow it in any simulator.' },
    ],
    rrProgress(s) {
      const t = s.trades.filter((x) => x.rrPlanned != null && x.origStop).slice(-10);
      const avg = t.length ? t.reduce((a, b) => a + b.rrPlanned, 0) / t.length : 0;
      if (t.length >= 10 && avg < 1.5) return [9, 10];
      return [t.length, 10];
    },
    streak(s) {
      let best = 0,
        cur = 0;
      s.trades
        .slice()
        .sort((a, b) => a.closedAt - b.closedAt)
        .forEach((t) => {
          if (t.origStop && t.riskPct != null && t.riskPct <= 2.05) {
            cur++;
            best = Math.max(best, cur);
          } else cur = 0;
        });
      return best;
    },
    chState(c) {
      const s = S();
      const [cur, max] = c.prog(s);
      return { cur: Math.min(cur, max), max, done: cur >= max, claimed: !!s.challenges[c.id] };
    },
    claim(id) {
      const c = P.CH.find((x) => x.id === id);
      const st = P.chState(c);
      if (!st.done || st.claimed) return;
      S().challenges[id] = Date.now();
      P.addXP(c.xp, 'Challenge: ' + c.title);
      U.sound('win');
      TM.Store.save();
    },
    unclaimed() {
      return P.CH.filter((c) => {
        const st = P.chState(c);
        return st.done && !st.claimed;
      }).length;
    },

    /* ---------------- daily goals ---------------- */
    GOALS: {
      lesson: { text: 'Complete a lesson', href: '#academy' },
      disc: { text: 'Close a trade graded B or better', href: '#practice' },
      journal: { text: 'Write a journal entry', href: '#journal' },
      quiz: { text: 'Answer 5 quiz questions', href: '#tests', need: 5 },
      scenario: { text: 'Finish a market scenario', href: '#scenarios' },
      day: { text: 'Complete a day-trading session', href: '#day' },
      coach: { text: 'Ask the coach a question', href: null },
    },
    daily() {
      const s = S();
      const key = U.dayKey();
      if (s.daily.date !== key) {
        // streak continues only if yesterday was completed
        const y = new Date();
        y.setDate(y.getDate() - 1);
        if (s.daily.last !== U.dayKey(y) && s.daily.last !== key) s.daily.streak = 0;
        let h = 0;
        for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
        const r = U.rng(h);
        const pool = U.shuffle(['lesson', 'disc', 'journal', 'quiz', 'scenario', 'day', 'coach'], r);
        s.daily = { date: key, goals: pool.slice(0, 3), done: {}, count: {}, streak: s.daily.streak || 0, last: s.daily.last || '' };
        TM.Store.save();
      }
      return s.daily;
    },
    goal(id, n = 1) {
      const d = P.daily();
      if (!d.goals.includes(id) || d.done[id]) return;
      d.count = d.count || {};
      d.count[id] = (d.count[id] || 0) + n;
      const need = P.GOALS[id].need || 1;
      if (d.count[id] >= need) {
        d.done[id] = true;
        P.addXP(40, 'Daily goal: ' + P.GOALS[id].text);
        if (d.goals.every((g) => d.done[g])) {
          d.streak = (d.streak || 0) + 1;
          d.last = d.date;
          setTimeout(() => P.addXP(60, `All daily goals done · ${d.streak}-day streak 🔥`), 700);
        }
      }
      TM.Store.save();
      TM.bus.emit('progress');
    },

    /* ---------------- trade recording ---------------- */
    recordTrade(trade, opts = {}) {
      const s = S();
      const rv = TM.Review.analyze(trade, opts.review || {});
      trade.review = { score: rv.score, grade: rv.grade, takeaway: rv.takeaway, lessons: rv.lessons, verdict: rv.verdict };
      s.trades.push(trade);
      if (s.trades.length > 1500) s.trades.shift();
      const c = s.counters;
      if (trade.origStop) c.tradesWithStop++;
      if (trade.pnl > 0 && trade.origStop && trade.riskPct <= 1.05) c.lowRiskWins++;
      if ((trade.exitReason === 'stop' || trade.exitReason === 'gap-stop') && trade.origStop && trade.riskPct <= 2.05) c.goodLosses++;
      if (trade.exitReason === 'liquidation') c.liquidations++;
      if (rv.score >= 78) {
        c.disciplinedTrades++;
        P.goal('disc');
      }
      // discipline XP (capped per day so that more trades != more XP)
      const key = U.dayKey();
      if (s.xpToday.date !== key) s.xpToday = { date: key, tradeXp: 0, trades: 0 };
      s.xpToday.trades = (s.xpToday.trades || 0) + 1;
      const xp = rv.score >= 90 ? 30 : rv.score >= 78 ? 20 : rv.score >= 62 ? 10 : 0;
      if (xp && s.xpToday.tradeXp < 200) {
        s.xpToday.tradeXp += xp;
        setTimeout(() => P.addXP(xp, `Disciplined trade (process ${rv.grade})`), 900);
      }
      if (s.xpToday.trades === 15) {
        TM.Coach && TM.Coach.say('You have closed 15 trades today. <b>Overtrading</b> is one of the fastest ways to lose. Quality beats quantity — consider reviewing your journal instead of taking more trades.');
      }
      TM.Store.save();
      TM.bus.emit('trade:recorded', trade);
      P.checkAchievements();
      return rv;
    },
    /* review + journal modal. Returns a promise that resolves when the modal closes. */
    afterTrade(trade, opts = {}) {
      const rv = P.recordTrade(trade, opts);
      if (opts.silent) {
        U.toast(`Trade closed (${trade.exitReason === 'target' ? 'target hit' : trade.exitReason === 'liquidation' ? 'LIQUIDATED' : trade.exitReason === 'stop' || trade.exitReason === 'gap-stop' ? 'stopped out' : 'closed'}) · <b class="${U.cls(trade.pnl)}">${U.smoney(trade.pnl)}</b>`, trade.pnl >= 0 ? 'good' : 'bad', {
          ms: 5200,
          action: { label: 'Review', fn: () => P.showReview(trade) },
        });
        U.sound(trade.pnl >= 0 ? 'win' : 'loss');
        return Promise.resolve();
      }
      U.sound(trade.pnl >= 0 ? 'win' : 'loss');
      return P.showReview(trade, rv);
    },
    showReview(trade, rv) {
      rv = rv || TM.Review.analyze(trade);
      return new Promise((resolve) => {
        const body = U.el('<div></div>');
        body.innerHTML = TM.Review.html(trade, rv);
        const already = S().journal[trade.id];
        let form = null;
        if (!already && TM.JournalUI) {
          const wrap = U.el(`<details class="jr-inline" open><summary>✍️ Journal this trade <span class="muted">(+20 XP)</span></summary></details>`);
          form = TM.JournalUI.form(trade);
          wrap.appendChild(form.el);
          body.appendChild(wrap);
        }
        const actions = already
          ? [{ label: 'Close', cls: 'btn-primary' }]
          : [
              { label: 'Journal later', cls: 'btn-ghost' },
              {
                label: 'Save journal entry',
                cls: 'btn-primary',
                onClick: () => {
                  if (!form) return;
                  const ok = TM.JournalUI.save(trade, form.get());
                  if (!ok) return false;
                },
              },
            ];
        U.modal({ title: 'Trade review', body, actions, wide: true, onClose: resolve });
        body.querySelectorAll('.rv-lessons a').forEach((a) => a.addEventListener('click', () => U.closeTopModal()));
      });
    },
  });
})();

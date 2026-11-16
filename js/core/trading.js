/* TRADE MASTERY — paper-trading engine (positions, orders, stops, leverage, liquidation), statistics and trade reviews.
   Every trade here is simulated. No real orders are ever placed. */
(function () {
  'use strict';
  const U = TM.U;
  const MMR = 0.005; // maintenance margin for leveraged positions

  const T = (TM.Trading = {
    pnl(pos, price) {
      const dir = pos.side === 'long' ? 1 : -1;
      return (price - pos.entry) * pos.qty * dir - (pos.fees || 0) - (pos.funding || 0);
    },
    liqPrice(side, entry, lev) {
      if (!lev || lev <= 1) return null;
      return side === 'long' ? entry * (1 - 1 / lev + MMR) : entry * (1 + 1 / lev - MMR);
    },
    riskAmount(side, entry, stop, qty) {
      if (!stop) return null;
      const per = side === 'long' ? entry - stop : stop - entry;
      return per * qty;
    },
    rr(side, entry, stop, target) {
      if (!stop || !target) return null;
      const risk = side === 'long' ? entry - stop : stop - entry;
      const rew = side === 'long' ? target - entry : entry - target;
      if (risk <= 0) return null;
      return rew / risk;
    },
    equity(acct, priceFn) {
      return acct.cash + acct.positions.reduce((s, p) => s + p.margin + T.pnl(p, priceFn(p.sym)), 0);
    },
    unrealized(acct, priceFn) {
      return acct.positions.reduce((s, p) => s + T.pnl(p, priceFn(p.sym)), 0);
    },
    /* validate a ticket; returns {ok, errors[], warnings[], calc} */
    check(acct, spec, equity) {
      const errors = [],
        warnings = [];
      const { side, qty, entry, stop, target } = spec;
      const lev = spec.lev || 1;
      if (!(qty > 0)) errors.push('Enter a position size greater than zero.');
      const notional = qty * entry;
      const margin = notional / lev;
      const fee = notional * (spec.feeRate || 0);
      if (margin + fee > acct.cash + 1e-9) errors.push(`Not enough buying power. Needs ${U.money(margin + fee)}, you have ${U.money(acct.cash)}.`);
      if (stop) {
        if (side === 'long' && stop >= entry) errors.push('For a long (buy), the stop-loss must be BELOW the entry price.');
        if (side === 'short' && stop <= entry) errors.push('For a short (sell), the stop-loss must be ABOVE the entry price.');
      }
      if (target) {
        if (side === 'long' && target <= entry) errors.push('For a long, the take-profit must be ABOVE the entry price.');
        if (side === 'short' && target >= entry) errors.push('For a short, the take-profit must be BELOW the entry price.');
      }
      const risk = stop ? T.riskAmount(side, entry, stop, qty) : null;
      const riskPct = risk != null ? (risk / equity) * 100 : null;
      const rr = T.rr(side, entry, stop, target);
      const liq = T.liqPrice(side, entry, lev);
      if (!stop) warnings.push('No stop-loss: your risk on this trade is undefined.');
      if (riskPct != null && riskPct > 2) warnings.push(`You are risking ${riskPct.toFixed(1)}% of your account. Most pros risk 0.5–2% per trade.`);
      if (rr != null && rr < 1) warnings.push(`Reward:risk is only ${rr.toFixed(2)}:1. You would need to win more than ${(100 / (1 + rr)).toFixed(0)}% of trades just to break even.`);
      if (!target) warnings.push('No take-profit target. Decide where you will exit before you enter.');
      if (liq && stop && ((side === 'long' && liq >= stop) || (side === 'short' && liq <= stop))) warnings.push(`Liquidation (${U.price(liq)}) comes BEFORE your stop. Lower the leverage or tighten the stop.`);
      if (notional / Math.max(1, equity) > 0.5 && lev === 1) warnings.push(`This position is ${((notional / equity) * 100).toFixed(0)}% of your account. Concentration risk is high.`);
      return { ok: !errors.length, errors, warnings, calc: { notional, margin, fee, risk, riskPct, rr, liq } };
    },
    open(acct, spec) {
      const lev = spec.lev || 1;
      const notional = spec.qty * spec.entry;
      const margin = notional / lev;
      const fee = notional * (spec.feeRate || 0);
      acct.cash -= margin + fee;
      const pos = {
        id: (spec.mode || 'x').slice(0, 1).toUpperCase() + '-' + acct.nextId++ + '-' + U.uid().slice(-4),
        sym: spec.sym,
        mode: spec.mode,
        side: spec.side,
        qty: spec.qty,
        entry: spec.entry,
        lev,
        margin,
        fees: fee,
        feeRate: spec.feeRate || 0,
        funding: 0,
        stop: spec.stop || null,
        target: spec.target || null,
        origStop: spec.stop || null,
        stopMoves: [],
        liq: T.liqPrice(spec.side, spec.entry, lev),
        openedAt: Date.now(),
        openedT: spec.t || null,
        openedBar: spec.bar != null ? spec.bar : null,
        equityAtEntry: spec.equity,
        riskPlanned: spec.stop ? T.riskAmount(spec.side, spec.entry, spec.stop, spec.qty) : null,
        riskPct: spec.stop ? (T.riskAmount(spec.side, spec.entry, spec.stop, spec.qty) / spec.equity) * 100 : null,
        rrPlanned: T.rr(spec.side, spec.entry, spec.stop, spec.target),
        mfe: 0,
        mae: 0,
        ctx: spec.ctx || null,
        meta: spec.meta || {},
      };
      acct.positions.push(pos);
      return pos;
    },
    modify(pos, field, value) {
      if (field === 'stop') {
        if (pos.stop && value) {
          const widened = pos.side === 'long' ? value < pos.stop : value > pos.stop;
          pos.stopMoves.push({ from: pos.stop, to: value, widened });
        } else if (!pos.stop && value) pos.stopMoves.push({ from: null, to: value, widened: false });
        pos.stop = value || null;
        if (!pos.riskPlanned && value) {
          pos.riskPlanned = T.riskAmount(pos.side, pos.entry, value, pos.qty);
          pos.riskPct = (pos.riskPlanned / pos.equityAtEntry) * 100;
          pos.lateStop = true;
        }
      }
      if (field === 'target') pos.target = value || null;
    },
    close(acct, pos, price, reason, extra = {}) {
      const i = acct.positions.indexOf(pos);
      if (i < 0) return null;
      acct.positions.splice(i, 1);
      let pnl = T.pnl(pos, price);
      const exitFee = pos.qty * price * (pos.feeRate || 0);
      pnl -= exitFee;
      if (reason === 'liquidation') pnl = -pos.margin - (pos.fees || 0);
      acct.cash += Math.max(0, pos.margin + pnl);
      const r = pos.riskPlanned ? pnl / pos.riskPlanned : null;
      const trade = Object.assign({}, pos, {
        exit: price,
        exitReason: reason,
        pnl,
        pnlPct: (pnl / pos.margin) * 100,
        r,
        closedAt: Date.now(),
        closedT: extra.t || null,
        closedBar: extra.bar != null ? extra.bar : null,
        held: Date.now() - pos.openedAt,
      });
      delete trade.stopMovesRaw;
      return trade;
    },
    /* update excursions and fire stops/targets/liquidations for one symbol.
       bar: {h,l,c,o?} ; gap: true if the bar opened with a gap (stop fills at open) */
    process(acct, sym, bar, opts = {}) {
      const closed = [];
      acct.positions
        .filter((p) => p.sym === sym)
        .forEach((p) => {
          const dir = p.side === 'long' ? 1 : -1;
          const fav = dir > 0 ? bar.h - p.entry : p.entry - bar.l;
          const adv = dir > 0 ? p.entry - bar.l : bar.h - p.entry;
          p.mfe = Math.max(p.mfe, fav * p.qty);
          p.mae = Math.max(p.mae, adv * p.qty);
          const open = bar.o != null ? bar.o : bar.c;
          // liquidation
          if (p.liq && ((dir > 0 && bar.l <= p.liq) || (dir < 0 && bar.h >= p.liq))) {
            closed.push(T.close(acct, p, p.liq, 'liquidation', opts));
            return;
          }
          if (p.stop && ((dir > 0 && bar.l <= p.stop) || (dir < 0 && bar.h >= p.stop))) {
            const gapped = opts.gap && ((dir > 0 && open < p.stop) || (dir < 0 && open > p.stop));
            closed.push(T.close(acct, p, gapped ? open : p.stop, gapped ? 'gap-stop' : 'stop', opts));
            return;
          }
          if (p.target && ((dir > 0 && bar.h >= p.target) || (dir < 0 && bar.l <= p.target))) {
            const gapped = opts.gap && ((dir > 0 && open > p.target) || (dir < 0 && open < p.target));
            closed.push(T.close(acct, p, gapped ? open : p.target, 'target', opts));
          }
        });
      return closed.filter(Boolean);
    },
    /* fill pending limit orders */
    fillOrders(acct, sym, bar, makeSpec) {
      const filled = [];
      acct.orders
        .filter((o) => o.sym === sym)
        .forEach((o) => {
          const hit = o.side === 'long' ? bar.l <= o.limit : bar.h >= o.limit;
          if (!hit) return;
          acct.orders.splice(acct.orders.indexOf(o), 1);
          // release reserved cash
          acct.cash += o.reserved || 0;
          const spec = makeSpec(o);
          const chk = T.check(acct, spec, spec.equity);
          if (chk.ok) filled.push(T.open(acct, spec));
        });
      return filled;
    },
    sampleEquity(acct, eq) {
      const c = acct.equityCurve;
      const now = Date.now();
      const last = c[c.length - 1];
      if (!last || now - last.t > 15000) {
        c.push({ t: now, v: U.round(eq, 2) });
        if (c.length > 600) c.splice(1, 1);
      } else last.v = U.round(eq, 2);
      acct.peak = Math.max(acct.peak || eq, eq);
      const dd = acct.peak ? ((acct.peak - eq) / acct.peak) * 100 : 0;
      acct.maxDD = Math.max(acct.maxDD || 0, dd);
      const key = U.dayKey();
      if (!acct.daily || acct.daily.date !== key) acct.daily = { date: key, start: eq };
    },

    /* ---------------- statistics ---------------- */
    stats(trades) {
      const n = trades.length;
      const wins = trades.filter((t) => t.pnl > 0);
      const losses = trades.filter((t) => t.pnl <= 0);
      const gw = wins.reduce((s, t) => s + t.pnl, 0);
      const gl = -losses.reduce((s, t) => s + t.pnl, 0);
      const withR = trades.filter((t) => t.r != null);
      const withRR = trades.filter((t) => t.rrPlanned != null);
      let cum = 0,
        peak = 0,
        dd = 0;
      const curve = [0];
      trades
        .slice()
        .sort((a, b) => a.closedAt - b.closedAt)
        .forEach((t) => {
          cum += t.pnl;
          curve.push(cum);
          peak = Math.max(peak, cum);
          dd = Math.max(dd, peak - cum);
        });
      return {
        n,
        wins: wins.length,
        losses: losses.length,
        winRate: n ? (wins.length / n) * 100 : 0,
        total: gw - gl,
        avgWin: wins.length ? gw / wins.length : 0,
        avgLoss: losses.length ? -gl / losses.length : 0,
        profitFactor: gl ? gw / gl : wins.length ? Infinity : 0,
        largestWin: wins.length ? Math.max(...wins.map((t) => t.pnl)) : 0,
        largestLoss: losses.length ? Math.min(...losses.map((t) => t.pnl)) : 0,
        avgR: withR.length ? withR.reduce((s, t) => s + t.r, 0) / withR.length : null,
        avgRR: withRR.length ? withRR.reduce((s, t) => s + t.rrPlanned, 0) / withRR.length : null,
        expectancy: n ? (gw - gl) / n : 0,
        stopPct: n ? (trades.filter((t) => t.origStop).length / n) * 100 : 0,
        avgRisk: trades.filter((t) => t.riskPct != null).length ? trades.filter((t) => t.riskPct != null).reduce((s, t) => s + t.riskPct, 0) / trades.filter((t) => t.riskPct != null).length : null,
        maxDDCash: dd,
        curve,
      };
    },
  });

  /* =====================================================
     Trade Review — explains WHY a trade worked or failed.
     Grades the PROCESS separately from the OUTCOME.
     ===================================================== */
  TM.Review = {
    analyze(t, opts = {}) {
      const items = [];
      let score = 70;
      const lessons = new Set();
      const good = (s, pts = 0) => {
        items.push({ k: 'good', s });
        score += pts;
      };
      const bad = (s, pts = 0, lesson) => {
        items.push({ k: 'bad', s });
        score -= pts;
        lesson && lessons.add(lesson);
      };
      const tip = (s, lesson) => {
        items.push({ k: 'tip', s });
        lesson && lessons.add(lesson);
      };
      const ctx = t.ctx || {};
      const dir = t.side === 'long' ? 1 : -1;
      const sideWord = t.side === 'long' ? 'bought (long)' : 'sold short';

      // ---- ENTRY
      const entry = [];
      if (ctx.trend) {
        if ((dir > 0 && ctx.trend === 'up') || (dir < 0 && ctx.trend === 'down')) {
          good(`Entry: you ${sideWord} WITH the trend (price was ${dir > 0 ? 'above' : 'below'} a ${dir > 0 ? 'rising' : 'falling'} EMA 20). Trading with the trend improves your odds.`, 8);
        } else if (ctx.trend === 'sideways') tip('Entry: the market was moving sideways. In ranges, buy near support and sell near resistance — the middle of a range is a coin flip.', '2-3');
        else bad(`Entry: you ${sideWord} AGAINST the trend (EMA 20 was sloping ${ctx.trend}). Counter-trend trades need extra confirmation.`, 10, '2-4');
      }
      if (ctx.atr && ctx.ema9 != null) {
        const ext = ((t.entry - ctx.ema9) * dir) / ctx.atr;
        if (ext > 2.2) bad(`Entry: you chased. Price was ${ext.toFixed(1)}× ATR away from the EMA 9 when you entered — extended moves often pull back before continuing.`, 8, '3-4');
        else if (ext < 0.8 && ext > -0.8 && ctx.trend !== 'sideways') good('Entry: you entered close to the EMA 9 instead of chasing a big candle. Good patience.', 4);
      }
      if (ctx.rsi != null) {
        if (dir > 0 && ctx.rsi > 75) tip(`RSI was ${ctx.rsi.toFixed(0)} (overbought) at entry. Strong momentum, but late buyers often get caught in the pullback.`, '3-2');
        if (dir < 0 && ctx.rsi < 25) tip(`RSI was ${ctx.rsi.toFixed(0)} (oversold) at entry. Shorting into oversold conditions risks a sharp bounce.`, '3-2');
      }
      if (ctx.volRatio != null && t.meta && t.meta.breakout) {
        if (ctx.volRatio > 1.5) good(`Breakout volume was ${ctx.volRatio.toFixed(1)}× average — real buyers were behind the move.`, 4);
        else tip(`Breakout volume was only ${ctx.volRatio.toFixed(1)}× average. Weak-volume breakouts fail more often.`, '7-2');
      }
      if (t.meta && t.meta.phase === 'Midday') tip('You traded during the midday lull (11:30–14:00). Volume dries up and breakouts fail more often then.', '5-2');
      if (t.meta && t.meta.phase === 'Open' && t.meta.minute != null && t.meta.minute < 5) tip('You entered in the first 5 minutes. The open is the most volatile, least predictable part of the day — many traders wait for the opening range to form.', '5-2');
      if (t.meta && t.meta.vwapSide != null) {
        if ((dir > 0 && t.meta.vwapSide > 0) || (dir < 0 && t.meta.vwapSide < 0)) good(`You traded on the right side of VWAP (${dir > 0 ? 'long above' : 'short below'} it), where institutions are on your side.`, 4);
        else tip(`You were ${dir > 0 ? 'long below' : 'short above'} VWAP. That is fighting the average price buyers paid today.`, '5-3');
      }

      // ---- RISK
      if (!t.origStop) {
        if (t.lateStop) bad('Risk: you entered WITHOUT a stop-loss and only added one later. Decide where you are wrong before you click buy.', 15, '4-1');
        else bad('Risk: no stop-loss. Without one, a single bad move can wipe out many wins. This is the #1 beginner mistake.', 30, '4-1');
      } else {
        if (t.riskPct <= 1.05) good(`Risk: ${t.riskPct.toFixed(2)}% of your account — excellent. You could be wrong 20 times in a row and still trade.`, 10);
        else if (t.riskPct <= 2.05) good(`Risk: ${t.riskPct.toFixed(2)}% of your account — within the professional 1–2% range.`, 5);
        else if (t.riskPct <= 5) bad(`Risk: ${t.riskPct.toFixed(1)}% of your account on one idea. A few losses in a row would seriously damage the account.`, 15, '4-2');
        else bad(`Risk: ${t.riskPct.toFixed(1)}% of your account. That is gambling-sized. Use position sizing: shares = (account × 1%) ÷ (entry − stop).`, 28, '4-2');
      }
      if (t.rrPlanned != null) {
        if (t.rrPlanned >= 2) good(`Plan: reward:risk of ${t.rrPlanned.toFixed(1)}:1. With 2:1 you can be wrong 60% of the time and still make money.`, 6);
        else if (t.rrPlanned >= 1.2) tip(`Plan: reward:risk of ${t.rrPlanned.toFixed(1)}:1. Acceptable, but aim for 2:1 or better on most setups.`, '4-1');
        else bad(`Plan: reward:risk of ${t.rrPlanned.toFixed(2)}:1. You are risking more than you hope to make.`, 8, '4-1');
      } else if (t.origStop) tip('Plan: no take-profit target was set. Knowing your exit in advance keeps greed out of the decision.', '4-1');
      if (t.lev > 1) {
        if (t.lev >= 10) bad(`Leverage: ${t.lev}× means a ${(100 / t.lev).toFixed(1)}% move against you wipes out the margin. High leverage turns normal noise into liquidation.`, 10, 'C-3');
        else tip(`Leverage: ${t.lev}×. Your liquidation price was ${U.price(t.liq)}. Keep it far beyond your stop.`, 'C-3');
      }
      if (t.stopMoves && t.stopMoves.some((m) => m.widened)) bad('Discipline: you moved your stop-loss FURTHER away while the trade was losing. That turns small planned losses into large unplanned ones.', 15, '4-5');
      else if (t.stopMoves && t.stopMoves.some((m) => !m.widened && m.from != null)) good('Management: you tightened your stop as the trade developed (trailing stop). That locks in progress.', 3);

      // ---- EXIT
      const R = t.r;
      switch (t.exitReason) {
        case 'target':
          good(`Exit: price reached your take-profit${R != null ? ` (+${R.toFixed(2)}R)` : ''}. You executed the plan.`, 6);
          break;
        case 'stop':
          if (t.origStop && t.riskPct <= 2.05) {
            good('Exit: your stop-loss closed the trade at the planned loss (−1R). This is a GOOD loss: small, planned, survivable.', 4);
          } else tip('Exit: stopped out. The stop did its job of limiting the damage.', '4-1');
          break;
        case 'gap-stop':
          tip(`Exit: price GAPPED through your stop overnight and filled at ${U.price(t.exit)} instead of ${U.price(t.stop)}. Stops cannot protect you from gaps — size positions smaller before earnings or news.`, '6-4');
          break;
        case 'liquidation':
          bad('Exit: LIQUIDATED. The exchange closed your position and kept your margin. Leverage was too high for the volatility.', 25, 'C-3');
          break;
        case 'session-end':
          tip('Exit: the position was closed automatically at the end of the session. Day traders plan to be flat before the close.', '5-4');
          break;
        default: {
          // manual
          if (t.pnl < 0 && R != null && R < -1.15) bad(`Exit: you lost ${Math.abs(R).toFixed(1)}R — more than your planned risk. Respect the stop.`, 10, '4-5');
          else if (t.pnl < 0 && R != null && R > -0.5 && opts.followThrough && opts.followThrough.hitTarget) tip('Exit: you closed early for a small loss, but price later reached your target. Was the setup actually invalid, or did fear make the decision?', '4-5');
          else if (t.pnl < 0 && R != null && R > -0.6) tip('Exit: you cut the trade before the stop. Fine if the reason you entered disappeared — not fine if it was just nerves.', '4-5');
          if (t.pnl > 0 && R != null && t.riskPlanned && t.mfe / t.riskPlanned > 2 && R < 0.8) tip(`Exit: the trade was up ${(t.mfe / t.riskPlanned).toFixed(1)}R at its best, but you kept only ${R.toFixed(1)}R. Consider a trailing stop or taking partial profits.`, '5-4');
          else if (t.pnl > 0) good('Exit: you closed the trade in profit.', 2);
          if (opts.followThrough && t.pnl > 0 && opts.followThrough.hitTarget && R < 1) tip('After you exited, price went on to hit your target. Trust your plan once the trade is working.', '5-4');
        }
      }
      if (opts.emotional) bad('Patience: you closed a swing trade after a small move that was still inside your plan. Swing trades need room to breathe — reacting to every wiggle is emotional trading.', 8, '6-1');
      if (opts.heldEarnings) tip('You held through an earnings announcement. That is a coin flip on a gap — many swing traders reduce size or exit before earnings.', '6-4');

      score = Math.round(U.clamp(score, 0, 100));
      const grade = score >= 90 ? 'A' : score >= 78 ? 'B' : score >= 62 ? 'C' : score >= 45 ? 'D' : 'F';
      let verdict;
      if (t.pnl > 0 && score >= 70) verdict = 'Good process, good outcome. This is what repeatable trading looks like.';
      else if (t.pnl > 0) verdict = 'You made money, but the process was risky. Lucky wins teach bad habits — fix the process before it costs you.';
      else if (score >= 70) verdict = 'A good loss. You followed a sound process and the market simply did not cooperate. Over many trades, good process wins.';
      else verdict = 'Poor process and a loss. Focus on the red items below — they are the habits that blow up accounts.';
      const learn = items.find((i) => i.k === 'bad') || items.find((i) => i.k === 'tip') || items[0];
      return { score, grade, items, verdict, lessons: Array.from(lessons), takeaway: learn ? learn.s : '' };
    },
    /* HTML block for the review modal */
    html(t, rv) {
      const exitTxt = { target: 'Take-profit hit', stop: 'Stop-loss hit', 'gap-stop': 'Gapped through stop', liquidation: 'Liquidated', manual: 'Closed manually', 'session-end': 'Session close' }[t.exitReason] || t.exitReason;
      const def = TM.Live.def(t.sym);
      const name = def ? def.sym : t.sym;
      const li = rv.items.map((i) => `<li class="rv-${i.k}"><span class="rv-ic">${i.k === 'good' ? '✓' : i.k === 'bad' ? '✕' : 'i'}</span><span>${i.s}</span></li>`).join('');
      const lessonLinks = rv.lessons
        .map((id) => TM.Lessons && TM.Lessons.byId(id))
        .filter(Boolean)
        .slice(0, 3)
        .map((l) => `<a class="chip" href="#lesson-${l.id}">📘 ${l.id.replace('-', '.')} ${U.esc(l.title)}</a>`)
        .join('');
      return `<div class="review">
        <div class="rv-top">
          <div class="rv-grade g-${rv.grade}">${rv.grade}<small>process</small></div>
          <div class="rv-sum">
            <div class="rv-line"><b>${t.side === 'long' ? 'LONG' : 'SHORT'} ${U.esc(name)}</b> · ${U.num(t.qty, t.qty < 1 ? 4 : t.qty % 1 ? 3 : 0)} @ ${U.price(t.entry)} → ${U.price(t.exit)}${t.lev > 1 ? ` · ${t.lev}×` : ''}</div>
            <div class="rv-out ${U.cls(t.pnl)}">${U.smoney(t.pnl)} ${t.r != null ? `<span class="muted">(${t.r >= 0 ? '+' : ''}${t.r.toFixed(2)}R)</span>` : ''} <span class="pill">${exitTxt}</span></div>
            <div class="rv-verdict">${rv.verdict}</div>
          </div>
        </div>
        <ul class="rv-list">${li}</ul>
        ${lessonLinks ? `<div class="rv-lessons"><span class="muted">Recommended:</span> ${lessonLinks}</div>` : ''}
      </div>`;
    },
  };
})();

/* TRADE MASTERY — Realistic Market Scenarios (Section 6). Multi-decision, progressively revealed charts. */
(function () {
  'use strict';
  const R = TM.Recipes;
  const opt = (t, score, fb) => ({ t, score, fb });

  const list = [
    {
      id: 'A',
      title: 'Bullish Breakout',
      tag: 'Breakouts',
      diff: 1,
      blurb: 'A stock grinds toward resistance and breaks out on rising volume.',
      data: R.breakout(101),
      intro: '<b>NVRX</b> (simulated) has been stuck between <b>$96 and $102</b> for weeks. Volume is starting to pick up as it approaches the top again.',
      stages: [
        {
          reveal: 40,
          lines: [{ price: 102, color: '#f0465a', label: 'Resistance' }],
          q: 'Price is testing $102 resistance for the third time, with rising volume. What do you do?',
          options: [
            opt('Wait for a candle to CLOSE above $102 with strong volume', 3, 'Confirmation first. If it rejects again, you lose nothing by waiting.'),
            opt('Buy now in anticipation of the breakout', 1, 'Anticipating saves a few cents but you are buying at the ceiling of a range that has held twice.'),
            opt('Short it at resistance', 1, 'Valid in a range, but rising volume into the third test raises breakout odds. Risky without a tight stop.'),
          ],
          hint: 'Breakouts are confirmed by a CLOSE beyond the level, ideally with high volume.',
        },
        {
          reveal: 41,
          lines: [{ price: 102, color: '#f0465a', label: 'Breakout level' }],
          q: 'A candle closed at ~$103.6 on 3× average volume. You decide to buy. Where is the most logical stop-loss?',
          options: [
            opt('Just below the breakout level, around $101.4', 3, 'If price falls back into the range, the breakout has failed. That is exactly where you are wrong.'),
            opt('At $96, the bottom of the range', 1, 'Logical in theory, but so wide your position must be tiny and the reward:risk collapses.'),
            opt('At $103.3, just under your entry', 1, 'So tight that normal noise will stop you out of a valid trade.'),
          ],
          hint: 'Ask: at what price is the breakout idea clearly wrong?',
        },
        {
          reveal: 49,
          q: 'Price ran to ~$106 (about 2R). A range that is $6 tall projects a target near $108. What now?',
          options: [
            opt('Take partial profits, move the stop to breakeven, let the rest run toward ~$108', 3, 'You lock in a win and keep upside. Professional trade management.'),
            opt('Hold everything with the original stop', 2, 'Fine and disciplined, though you risk giving back gains on a pullback.'),
            opt('Buy more with no new stop — it is a rocket', 0, 'Adding without a plan near short-term highs is chasing.'),
          ],
        },
      ],
      outro: 'Breakout → retest of $102 as support → continuation. The best trades had a confirmed entry, a stop at the level that defined the idea, and a planned exit.',
    },
    {
      id: 'B',
      title: 'Fake Breakout',
      tag: 'Traps',
      diff: 2,
      blurb: 'A stock breaks resistance, attracts buyers, and quickly reverses.',
      data: R.fakeout(102),
      intro: '<b>CRMS</b> (simulated) has ranged between <b>$47 and $50</b>. It is lunchtime and volume is light.',
      stages: [
        {
          reveal: 40,
          lines: [{ price: 50, color: '#f0465a', label: 'Resistance' }],
          q: 'Price pokes above $50 on ordinary volume, leaving a long upper wick. Breakout traders are piling in on social media. Your move?',
          options: [
            opt('Wait — weak volume and a long wick are warning signs', 3, 'Good breakouts close strongly with volume. This one shows rejection.'),
            opt('Buy the breakout with a large position', 0, 'This is how trapped buyers are made.'),
            opt('Buy a small position with a stop just below $50', 2, 'Small size and a tight stop keep the damage low if it fails.'),
          ],
        },
        {
          reveal: 43,
          lines: [{ price: 50, color: '#f0465a', label: 'Resistance' }],
          q: 'Price fell back below $50 and closed inside the range. Suppose you HAD bought the breakout. What now?',
          options: [
            opt('Exit — the breakout failed and the reason for the trade is gone', 3, 'A failed breakout is a clear invalidation. Small loss, move on.'),
            opt('Hold and hope it breaks out again', 0, 'Hope is not a strategy. Trapped buyers often sell in a rush, pushing price lower.'),
            opt('Buy more to lower your average price', 0, 'Averaging down on a failed setup magnifies the mistake.'),
          ],
        },
        {
          reveal: 45,
          q: 'Trapped buyers are now selling. A short below $49.30 with a stop above $50.80 targets the range low near $47. Reward:risk ≈ 1.4:1. Take it?',
          options: [
            opt('Yes, with proper position size — failed breakouts often run to the other side of the range', 3, 'Trading the failure is a real strategy. Size it to your 1% risk.'),
            opt('Skip it — the reward:risk is below my 2:1 rule', 3, 'Also an excellent answer: following your rules is never wrong.'),
            opt('Short with 10× leverage and no stop', 0, 'Same idea, reckless execution.'),
          ],
        },
      ],
      outro: 'The fake breakout trapped buyers above $50, and their exits pushed price through the range low. Weak volume and a close back inside the range were the tells.',
    },
    {
      id: 'C',
      title: 'Oversold Conditions',
      tag: 'Indicators',
      diff: 2,
      blurb: 'RSI drops below 30. Do you enter, wait, or avoid?',
      data: R.oversold(103),
      panes: ['rsi'],
      intro: '<b>HLXH</b> (simulated) has dropped sharply. RSI is collapsing toward oversold.',
      stages: [
        {
          reveal: 27,
          q: 'RSI is now below 25. Price is still falling hard. What do you do?',
          options: [
            opt('Wait for signs that selling is exhausted (higher low, divergence, reclaim of EMA 9)', 3, 'Oversold can stay oversold. You need price to confirm.'),
            opt('Buy now — RSI says it is oversold', 1, 'RSI measures speed, not value. Buying a falling knife without confirmation is early.'),
            opt('Avoid — it is in a downtrend', 2, 'Sensible and safe, though you might miss a valid reversal later.'),
          ],
        },
        {
          reveal: 33,
          q: 'Price bounced, then started falling again. RSI rose to 45. What is the most likely mistake to avoid?',
          options: [
            opt('Assuming the first bounce means the bottom is in', 3, 'Dead-cat bounces are common in strong declines.'),
            opt('Not buying with leverage', 0, 'Leverage would make a mistake far worse.'),
            opt('Using a stop-loss', 0, 'Stops are never the mistake.'),
          ],
        },
        {
          reveal: 40,
          q: 'Price made a LOWER low but RSI made a HIGHER low (bullish divergence), and a big green candle just closed. Decision?',
          options: [
            opt('Small long, stop below the new low, target the last bounce high', 3, 'Divergence + confirmation + defined risk. A real setup.'),
            opt('Still avoid — the trend is down', 2, 'Disciplined. Counter-trend trades are harder; skipping is acceptable.'),
            opt('Go all-in — divergence is a guaranteed bottom', 0, 'Nothing is guaranteed. Size for being wrong.'),
          ],
        },
      ],
      outro: 'The first oversold signal was too early. The divergence plus a confirmation candle marked the real turn. Indicators suggest; price confirms.',
    },
    {
      id: 'D',
      title: 'News Shock',
      tag: 'Volatility',
      diff: 2,
      blurb: 'Unexpected economic news causes a violent market move.',
      data: R.newsShock(104),
      intro: 'You are long <b>SIMX</b> (simulated index ETF) in a steady uptrend, with a stop at $99.50. At 8:30am: <b>"Inflation far hotter than expected."</b>',
      stages: [
        {
          reveal: 31,
          q: 'A huge red candle on 6× volume knocks price down ~5%. Your stop has not been hit yet. What do you do?',
          options: [
            opt('Let my pre-set stop do its job; do not make new decisions in panic', 3, 'Your plan was made with a clear head. Trust it.'),
            opt('Panic-sell everything at market immediately', 1, 'Defensible, but panic market orders in fast markets often fill at terrible prices.'),
            opt('Buy the dip with double size', 0, 'Catching a news-driven knife with extra size is how accounts blow up.'),
          ],
        },
        {
          reveal: 34,
          q: 'Spreads have widened to 5× normal and price is whipping around. You want to exit part of the position. Which order type?',
          options: [
            opt('A limit order near the current bid', 3, 'Limit orders protect you from awful fills during chaos.'),
            opt('A market order', 1, 'In thin, fast markets, market orders can fill far from the last price (slippage).'),
            opt('Wait for the market to close', 1, 'Avoiding decisions is not a plan either.'),
          ],
        },
        {
          reveal: 48,
          q: 'Things calmed down. Price is now ranging BELOW the old support (~$102). How do you view that level?',
          options: [
            opt('Old support may now act as resistance — wait for structure before new longs', 3, 'Role reversal. Let the market rebuild structure.'),
            opt('Buy — it is cheaper than yesterday', 1, '"Cheaper" is not a setup.'),
            opt('Short with no stop', 0, 'Any trade needs defined risk.'),
          ],
        },
      ],
      outro: 'News shocks are unpredictable. The traders who survived had stops in place before the news, used limit orders in the chaos, and waited for structure afterwards.',
    },
    {
      id: 'E',
      title: 'Trend Reversal',
      tag: 'Structure',
      diff: 3,
      blurb: 'Higher highs turn into lower lows. Spot the shift early.',
      data: R.reversal(105),
      intro: '<b>BNCR</b> (simulated) has been in a clean uptrend. You are long from lower prices.',
      stages: [
        {
          reveal: 32,
          q: 'Price rallied but failed to beat the previous high, and volume was light. What does this lower high tell you?',
          options: [
            opt('A warning — momentum is fading; tighten risk', 3, 'A lower high is the first crack in uptrend structure.'),
            opt('The uptrend is getting stronger', 0, 'A failed high is the opposite of strength.'),
            opt('Nothing — only indicators matter', 1, 'Structure is one of the most important signals.'),
          ],
        },
        {
          reveal: 40,
          lines: [{ price: 106.5, color: '#f2b84b', label: 'Last higher low' }],
          q: 'Price is now closing below the last higher low (~$106.5). Market structure has broken. You are still long.',
          options: [
            opt('Exit or reduce — the uptrend structure is broken', 3, 'Respecting the break protects your profits.'),
            opt('Hold — it will come back', 0, 'Hope after a structure break is how winners become losers.'),
            opt('Add more to average a better price', 0, 'Averaging into a reversal increases risk.'),
          ],
        },
        {
          reveal: 45,
          q: 'Price bounced back up toward ~$107.5 (the broken level) on weak volume. If you trade both directions, what is the setup?',
          options: [
            opt('A short on rejection of the broken level, stop above the lower high', 3, 'Break → retest → rejection is the classic reversal entry.'),
            opt('Buy — it is bouncing', 1, 'A weak bounce into broken support is often a selling opportunity.'),
            opt('Short with no stop, it is obviously going down', 0, 'Nothing is obvious enough to skip a stop.'),
          ],
        },
      ],
      outro: 'Lower high → break of structure → failed retest → downtrend. Reversals are a process, not a single candle.',
    },
    {
      id: 'F',
      title: 'Risk Management Under Pressure',
      tag: 'Risk',
      diff: 1,
      blurb: 'A promising setup. Calculate your size and risk before entering.',
      data: R.support(106),
      intro: 'Your account: <b>$10,000</b>. Your rule: risk <b>1%</b> per trade. <b>GRDN</b> (simulated) is bouncing off support near $100.80.',
      stages: [
        {
          reveal: 28,
          lines: [{ price: 100.8, color: '#16c784', label: 'Support' }],
          q: 'You plan to buy at <b>$102.50</b> with a stop at <b>$100.00</b> (below support). How many shares keep your risk at exactly 1%?',
          input: { answer: 40, tol: 0.5, unit: ' shares', fb: '1% × $10,000 = $100. Risk per share = $2.50. $100 ÷ $2.50 = 40 shares ($4,100 position).', hint: 'Dollar risk ÷ (entry − stop).' },
        },
        {
          reveal: 28,
          lines: [{ price: 100.8, color: '#16c784', label: 'Support' }],
          q: 'You want at least a 2:1 reward:risk. What is the minimum take-profit price?',
          input: { answer: 107.5, tol: 0.05, prefix: '$', fb: 'Risk is $2.50, so the reward must be ≥ $5.00. $102.50 + $5.00 = $107.50.', hint: 'Entry + 2 × (entry − stop).' },
        },
        {
          reveal: 28,
          q: 'A friend says: "Just buy 300 shares, this one is a sure thing." What is your risk if the stop hits?',
          options: [
            opt('$750 — 7.5% of the account. Stick to 40 shares', 3, '300 × $2.50 = $750. "Sure things" do not exist; your rules do.'),
            opt('Buy 300 shares — it looks perfect', 0, 'One loss would erase 7 good 1% trades.'),
            opt('Buy 300 shares but skip the stop', 0, 'Unlimited risk on a "sure thing" is the classic blow-up.'),
          ],
        },
      ],
      outro: 'Whether this trade wins or loses, you knew the worst case before you entered. That is what makes trading a business instead of a bet.',
    },
    {
      id: 'G',
      title: 'Stop Hunt at Support',
      tag: 'Liquidity',
      diff: 3,
      blurb: 'An obvious double bottom. Where are all the stops sitting?',
      data: R.stopHunt(107),
      intro: '<b>ETH</b> (simulated) has a very obvious double bottom near <b>$98.60</b> (prices scaled for the exercise). Everyone can see it.',
      stages: [
        {
          reveal: 40,
          lines: [{ price: 98.6, color: '#16c784', label: 'Obvious support' }],
          q: 'You want to buy near support. Where do you place the stop?',
          options: [
            opt('Below support with extra room, outside the obvious cluster (~$97)', 3, 'Stops right at the obvious level are the target of stop hunts.'),
            opt('Exactly at $98.50, just under the lows', 1, 'This is precisely where everyone else’s stop is.'),
            opt('No stop — support always holds', 0, 'Support breaks all the time.'),
          ],
        },
        {
          reveal: 43,
          q: 'A sudden spike wicks to ~$97.4, then price snaps back above support on huge volume. What just happened?',
          options: [
            opt('A stop hunt: stops below the obvious lows were triggered, then buyers absorbed them', 3, 'Large players used that liquidity to fill buy orders.'),
            opt('A real breakdown — sell everything', 1, 'A real breakdown would close and stay below support.'),
            opt('A data error', 0, 'Wicks like this are a normal market event.'),
          ],
        },
        {
          reveal: 46,
          q: 'Price is back above support. A long now with a stop below the wick low gives about 3:1 to the range top. Take it?',
          options: [
            opt('Yes, sized to 1% risk — the failed breakdown is a strong signal', 3, 'Failed breakdowns often lead to sharp rallies.'),
            opt('No — I got scared by the wick', 1, 'Understandable, but the setup has improved, not worsened.'),
            opt('Yes, with 25× leverage', 0, 'Good idea, reckless execution.'),
          ],
        },
      ],
      outro: 'Stops clustered under obvious lows were swept, then price rallied. Placing stops with room — and recognising a failed breakdown — turned the trap into an opportunity.',
    },
    {
      id: 'H',
      title: 'Crypto Long Squeeze',
      tag: 'Leverage',
      diff: 3,
      blurb: 'Funding is extreme, everyone is long with leverage. What could go wrong?',
      data: R.stopHunt(108),
      intro: 'Crypto is calm but funding is <b>+0.09% per 8h</b> (very high). Social media is euphoric. You want to go long <b>SOL</b> (simulated).',
      stages: [
        {
          reveal: 38,
          q: 'Which leverage choice fits a 4% stop-loss?',
          options: [
            opt('2–3× (liquidation ~30–50% away)', 3, 'Your stop decides when you exit, not the exchange.'),
            opt('20× (liquidation ~4.5% away)', 1, 'Liquidation would sit right next to your stop; any slippage and you are liquidated.'),
            opt('50× (liquidation ~1.5% away)', 0, 'A normal wick liquidates you before your stop.'),
          ],
        },
        {
          reveal: 43,
          q: 'A violent wick drops price fast, triggering a cascade of liquidations. Why do squeezes happen when funding is extreme?',
          options: [
            opt('Crowded leveraged longs get liquidated, their forced selling pushes price lower, liquidating more', 3, 'A liquidation cascade. Crowded trades unwind violently.'),
            opt('Exchanges cause them for fun', 0, 'It is the mechanics of leverage.'),
            opt('Funding has nothing to do with it', 1, 'Extreme funding shows crowding — the fuel for a squeeze.'),
          ],
        },
        {
          reveal: 48,
          q: 'Price recovered quickly. With 3× leverage and a stop below the wick, you are still in. With 50×, you would have been…',
          options: [
            opt('Liquidated at the bottom of the wick — right before the recovery', 3, 'High leverage can make a correct idea lose money.'),
            opt('Fine', 0, 'A ~2% move against 50× is liquidation.'),
            opt('Rich', 0, 'Only if you survived the wick — you would not have.'),
          ],
        },
      ],
      outro: 'Crowded leverage is fragile. Low leverage and a real stop let you survive volatility long enough to be right.',
    },
    {
      id: 'I',
      title: 'Swing Trade Into Earnings',
      tag: 'Swing',
      diff: 2,
      blurb: 'Your swing trade is working — and earnings are tomorrow.',
      data: Object.assign({ step: 86400 }, R.newsShock(109)),
      intro: 'You are long <b>CRMS</b> (simulated) on the daily chart and up about 2R. Earnings are released after tomorrow’s close.',
      stages: [
        {
          reveal: 29,
          q: 'How do you handle the earnings event?',
          options: [
            opt('Take most profit before earnings; keep a small piece or none', 3, 'You bank the trend profit and shrink the coin-flip exposure.'),
            opt('Hold full size — the trend is strong', 1, 'Trend strength does not protect against a gap.'),
            opt('Double the size to profit from a gap up', 0, 'That is betting, not trading.'),
          ],
        },
        {
          reveal: 31,
          q: 'Earnings missed. The stock gapped down ~5% through your stop. Your stop filled at the open, far below its level. What is the lesson?',
          options: [
            opt('Stops do not protect against gaps — position size does', 3, 'Event risk must be controlled with size, before the event.'),
            opt('Stops are useless, stop using them', 0, 'Stops still protect against the vast majority of moves.'),
            opt('Earnings are always bad', 0, 'They are unpredictable in either direction.'),
          ],
        },
        {
          reveal: 40,
          q: 'After the gap, price is chopping below the old trend. What should a swing trader do now?',
          options: [
            opt('Wait for a new setup with fresh structure', 3, 'Let the market re-establish a trend before re-entering.'),
            opt('Buy immediately to "get the money back"', 0, 'Revenge trading after a gap is an emotional decision.'),
            opt('Short heavily with no plan', 0, 'Reacting is not a strategy.'),
          ],
        },
      ],
      outro: 'Earnings and news create gaps that stops cannot control. Swing traders manage event risk with position size and timing.',
    },
  ];

  TM.Scenarios = { list, byId: (id) => list.find((s) => s.id === id) };
})();

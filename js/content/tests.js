/* TRADE MASTERY — Knowledge Test question bank: lesson quiz questions + chart identification + trading decisions */
(function () {
  'use strict';
  const R = TM.Recipes;
  const c = (q, o, a, e, lesson, chart) => ({ q, o, a, e, lesson, chart });
  const daily = (s) => Object.assign({ step: 86400 }, s);

  const extra = {
    1: [
      c('A coin trades at $0.50 with 40 billion coins in circulation. What is its market cap?', ['$20 billion', '$40 billion', '$0.50', '$80 billion'], 0, '$0.50 × 40B = $20B.', '1-3'),
      c('You need to exit a position immediately because the reason for the trade is gone. Which order type fills fastest?', ['Market order', 'Limit order far from price', 'No order', 'A limit order below the bid when selling… always'], 0, 'Market orders prioritise speed over price.', '1-4'),
      c('Look at the volume. Is this breakout backed by strong participation?', ['Yes — the breakout candle has a big volume spike', 'No — volume fell to zero', 'Volume is not shown', 'You can never tell'], 0, 'The tallest volume bar sits under the breakout candle.', '1-3', { data: R.breakout(201) }),
    ],
    2: [
      c('What is the trend on this chart?', ['Uptrend — higher highs and higher lows', 'Downtrend', 'Sideways range', 'No data'], 0, 'Each pullback held above the previous one.', '2-4', { data: R.uptrend(202) }),
      c('What is this market doing?', ['Ranging between support and resistance', 'Trending strongly up', 'Trending strongly down', 'Gapping'], 0, 'Price keeps bouncing between a floor and a ceiling.', '2-3', { data: R.range(203, 96, 102) }),
      c('The yellow line has stopped three declines. What is it?', ['Support', 'Resistance', 'A trendline break', 'VWAP'], 0, 'Repeated floors = support.', '2-3', { data: R.support(204), lines: [{ price: 100.8, color: '#f2b84b', label: 'Level' }] }),
      c('Which timeframe best suits someone holding for 2 weeks?', ['Daily', '1-minute', '5-second', 'Tick'], 0, 'Match timeframe to holding period.', '2-2'),
    ],
    3: [
      c('Name this pattern.', ['Head and shoulders', 'Bull flag', 'Double bottom', 'Cup and handle'], 0, 'Left shoulder, higher head, lower right shoulder, then a neckline break.', '3-5', { data: R.headShoulders(205) }),
      c('Name this pattern.', ['Double bottom', 'Double top', 'Bear flag', 'Rising wedge'], 0, 'Two lows at the same level, then a break above the middle peak.', '3-5', { data: R.doubleBottom(206) }),
      c('The bands were very narrow before this move. What happened?', ['A Bollinger squeeze led to a volatility expansion', 'RSI divergence', 'A stop hunt', 'Nothing'], 0, 'Low volatility often precedes high volatility.', '3-3', { data: R.bbSqueeze(207), overlays: { bb: true } }),
      c('RSI is above 70 during a powerful uptrend. What is the best interpretation?', ['Strong momentum; overbought alone is not a reason to short', 'Short immediately', 'The trend is over', 'RSI is broken'], 0, 'In strong trends RSI can stay overbought.', '3-2', { data: R.ema(208), panes: ['rsi'] }),
    ],
    4: [
      c('Account $20,000, risk 1%, entry $40, stop $38. Position size?', ['100 shares', '200 shares', '500 shares', '50 shares'], 0, '$200 ÷ $2 = 100 shares.', '4-2'),
      c('Entry $10.00, stop $9.50, target $11.50. Reward:risk?', ['3 : 1', '2 : 1', '1 : 3', '1.5 : 1'], 0, 'Risk $0.50, reward $1.50.', '4-1'),
      c('With 25× leverage, roughly what move against you causes liquidation?', ['About 4%', 'About 25%', 'About 50%', 'Never'], 0, '100 ÷ 25 ≈ 4% (less after maintenance margin).', '4-4'),
      c('After 3 losses in a row you feel the urge to double your size on the next trade. This is…', ['Revenge trading — stop and follow your plan', 'Smart money management', 'Diversification', 'Scaling in'], 0, 'Emotion is driving the decision.', '4-5'),
      c('Why do professionals risk only ~1% per trade?', ['To survive inevitable losing streaks', 'Because they are not confident', 'Brokers require it', 'To trade less'], 0, 'Ten 1% losses ≈ −10%; ten 10% losses ≈ −65%.', '4-2'),
    ],
    5: [
      c('Where is price relative to VWAP for most of this session?', ['Above — buyers controlled the day', 'Below — sellers controlled the day', 'Exactly on it', 'VWAP is not shown'], 0, 'Trend days above VWAP favour longs.', '3-3', { data: R.daySession(209, 'trend'), overlays: { vwap: true } }),
      c('Which time of day typically has the LOWEST volume?', ['Midday (around 11:30–14:00)', 'The open', 'The last 30 minutes', 'All are equal'], 0, 'The midday lull.', '5-1'),
      c('Your day trade is +1R and approaching resistance. A sensible management step is…', ['Take partial profits and move the stop to breakeven', 'Add more at resistance', 'Remove the stop', 'Hold overnight'], 0, 'Protect gains near obstacles.', '5-4'),
    ],
    6: [
      c('A swing trader holds through earnings with a stop 4% below. The stock gaps down 12%. Roughly where does the stop fill?', ['Near the opening price, ~12% down', 'Exactly at the stop', 'It does not fill', 'At yesterday’s close'], 0, 'Gaps skip over stops.', '6-4'),
      c('In this daily uptrend, where would a swing trader look to buy?', ['On pullbacks toward the rising EMA 20', 'At every new high', 'After a lower low', 'Never'], 0, 'Pullbacks to support inside the trend.', '6-2', { data: daily(R.uptrend(210)), overlays: { ema20: true } }),
      c('The swing low is $50 and ATR is $1. A sensible long stop is around…', ['$49.20–$49.50', '$50.05', '$40', '$52'], 0, 'Just beyond structure, with a fraction of ATR as buffer.', '6-3'),
    ],
    7: [
      c('Price broke above resistance, then closed back inside on weak volume. What is it most likely to be?', ['A fake breakout', 'A confirmed breakout', 'A bull flag', 'A stop-loss'], 0, 'Weak volume + close back inside = trap.', '7-2', { data: R.fakeout(211), lines: [{ price: 50, color: '#f0465a', label: 'Resistance' }] }),
      c('What happened at the lowest wick on this chart?', ['A stop hunt below obvious support, then a reversal', 'A normal breakdown', 'An earnings gap', 'A bull flag'], 0, 'The wick swept the lows and reversed sharply.', '7-2', { data: R.stopHunt(212), lines: [{ price: 98.6, color: '#16c784', label: 'Support' }] }),
      c('Win rate 30%, average win $400, average loss $100. Expectancy?', ['+$50 per trade', '−$50 per trade', '+$300', '$0'], 0, '0.3×400 − 0.7×100 = 120 − 70 = +$50.', '7-4'),
      c('What does this chart show?', ['An uptrend breaking structure into a downtrend', 'A steady uptrend', 'A range', 'A bull flag'], 0, 'Lower high, then a close below the last higher low.', '7-3', { data: R.reversal(213) }),
    ],
    C: [
      c('ETH/BTC = 0.05. What does that mean?', ['1 ETH is worth 0.05 BTC', '1 BTC is worth 0.05 ETH', 'ETH is $0.05', 'Nothing'], 0, 'BASE/QUOTE: price of 1 ETH in BTC.', 'C-1'),
      c('Funding has been negative for days. What does it suggest?', ['Shorts are crowded and paying longs', 'Longs are crowded', 'The market is closed', 'Spreads are zero'], 0, 'Negative funding = shorts pay longs.', 'C-3'),
      c('Bitcoin dominance is rising sharply during a crash. Usually…', ['Money is fleeing riskier altcoins into BTC (or out of crypto)', 'Altcoins are outperforming', 'It means nothing', 'BTC is being banned'], 0, 'Risk-off behaviour.', 'C-2'),
    ],
  };

  const levels = TM.Lessons.LEVELS.map((L) => ({ id: L.id, name: L.name, icon: L.icon }));
  function pool(lv) {
    const out = [];
    TM.Lessons.ofLevel(lv).forEach((l) => {
      l.steps.filter((s) => s.type === 'quiz').forEach((s) => s.qs.forEach((qq) => out.push(Object.assign({ lesson: l.id }, qq))));
    });
    (extra[lv] || []).forEach((x) => out.push(x));
    return out;
  }
  TM.Tests = { levels, pool, extra };
})();

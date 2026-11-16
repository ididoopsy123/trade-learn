/* TRADE MASTERY — Trading Academy curriculum.
   Every lesson: simple explanation → visual example → interactive exercise → short quiz → practical scenario. */
(function () {
  'use strict';
  const R = TM.Recipes;
  const q = (qq, o, a, e) => ({ q: qq, o, a, e });
  const learn = (title, body, visual) => ({ type: 'learn', title, body, visual });
  const ex = (w, cfg) => Object.assign({ type: 'do', w }, cfg);
  const quiz = (...qs) => ({ type: 'quiz', qs });
  const scen = (cfg) => Object.assign({ type: 'scenario' }, cfg);
  const opt = (t, score, fb) => ({ t, score, fb });
  const argmax = (arr, f) => arr.reduce((b, x, i) => (f(x, i) > f(arr[b], b) ? i : b), 0);

  const LEVELS = [
    { id: 1, name: 'Market Basics', icon: '🏛️', rank: 'Market Beginner', blurb: 'What you are actually buying, and why prices move.' },
    { id: 2, name: 'Reading Charts', icon: '🕯️', rank: 'Chart Reader', blurb: 'Candles, timeframes, support, resistance and trends.' },
    { id: 3, name: 'Technical Analysis', icon: '📐', rank: 'Technical Analyst', blurb: 'Indicators, breakouts, pullbacks and patterns — and when they lie.' },
    { id: 4, name: 'Risk Management', icon: '🛡️', rank: 'Risk Manager', blurb: 'The skill that keeps you in the game. The most important level.', star: true },
    { id: 5, name: 'Day Trading', icon: '⚡', rank: 'Day Trader', blurb: 'Intraday setups, the open, VWAP and managing trades.' },
    { id: 6, name: 'Swing Trading', icon: '🌊', rank: 'Swing Trader', blurb: 'Multi-day trends, pullbacks, stops and overnight risk.' },
    { id: 7, name: 'Advanced Trading', icon: '🎯', rank: 'Advanced Trader', blurb: 'Psychology, liquidity, traps, structure and your own strategy.' },
    { id: 'C', name: 'Crypto Track', icon: '🪙', rank: 'Bonus', blurb: 'Exchanges, pairs, dominance, funding rates, leverage and liquidation.' },
  ];

  const L = [];

  /* ============================== LEVEL 1 ============================== */
  L.push({
    id: '1-1',
    level: 1,
    title: 'Stocks & Crypto',
    topics: ['What stocks are', 'What cryptocurrency is'],
    steps: [
      learn(
        'What is a stock?',
        `<p>A <b>stock</b> (or <b>share</b>) is a tiny slice of ownership in a real company.</p>
        <ul class="bul"><li>If the company has 1,000,000 shares and you own 1,000, you own <b>0.1%</b> of it.</li><li>When the company earns more, investors want its shares more, so the price tends to rise.</li><li>Stocks trade on exchanges during market hours (e.g. 9:30–16:00 New York time).</li></ul>`,
        { w: 'html', html: `<div class="diag"><div class="diag-box">🏭 <b>Company</b><small>1,000,000 shares</small></div><div class="diag-arrow">→</div><div class="pie-mini" style="--p:10"><span>10% sold to the public</span></div><div class="diag-arrow">→</div><div class="diag-box">🧑 <b>You</b><small>own 1,000 shares = 0.1%</small></div></div>` }
      ),
      learn(
        'What is cryptocurrency?',
        `<p><b>Cryptocurrency</b> is digital money recorded on a <b>blockchain</b> — a public ledger copied across thousands of computers.</p>
        <ul class="bul"><li>Bitcoin has no company, profits or CEO. Its price is driven only by supply and demand.</li><li>Crypto markets never close: they trade <b>24 hours a day, 7 days a week</b>.</li><li>Crypto is usually far more volatile than stocks: 5–10% moves in a day are common.</li></ul>`,
        { w: 'html', html: `<div class="cmp"><div><h4>📈 Stocks</h4><ul><li>Ownership in a business</li><li>Mon–Fri market hours</li><li>Backed by earnings</li><li>Lower volatility</li></ul></div><div><h4>🪙 Crypto</h4><ul><li>Digital asset on a blockchain</li><li>24/7, including weekends</li><li>Backed by network demand</li><li>Higher volatility</li></ul></div></div>` }
      ),
      ex('sort', {
        prompt: 'Sort each statement: does it describe <b>stocks</b> or <b>crypto</b>?',
        buckets: ['Stocks', 'Crypto'],
        items: [
          { t: 'Represents part-ownership of a company', b: 0, why: 'A share is a slice of a company.' },
          { t: 'Trades on Saturday at 3am', b: 1, why: 'Crypto markets never close.' },
          { t: 'Price can react to quarterly earnings reports', b: 0, why: 'Companies report earnings every quarter.' },
          { t: 'Recorded on a public blockchain ledger', b: 1, why: 'That is what makes it a cryptocurrency.' },
          { t: 'Has no CEO or profits behind it (e.g. Bitcoin)', b: 1, why: 'Bitcoin is decentralised.' },
        ],
        hint: 'Ask yourself: is there a company behind it? Does the market close at night?',
      }),
      quiz(q('You own 500 of a company’s 100,000 shares. What do you own?', ['0.5% of the company', '5% of the company', '500% of its profits', 'Nothing until you sell'], 0, '500 ÷ 100,000 = 0.005 = 0.5% ownership.'), q('Which market is open on Sunday?', ['Crypto', 'The New York Stock Exchange', 'Both', 'Neither'], 0, 'Crypto trades 24/7. Stock exchanges close on weekends.')),
      scen({
        intro: 'A simulated stock, <b>CRMS</b>, has been drifting sideways. The company just announced quarterly profits <b>40% above expectations</b>.',
        data: R.bullFlag(31),
        overlays: {},
        stages: [
          {
            reveal: 10,
            q: 'Before the market reacts: what is most likely to happen to DEMAND for the shares?',
            options: [opt('Demand rises — more investors want to own a more profitable company', 3, 'Better profits make the shares more valuable to owners, so more buyers show up. That is how news moves price.'), opt('Demand falls — profits do not matter to stock prices', 0, 'Profits are the main long-term driver of stock prices.'), opt('Nothing — prices are random', 1, 'Short-term moves are noisy, but big news shifts supply and demand.')],
          },
          {
            reveal: 17,
            q: 'Price jumped on heavy volume. You did not own it. Which is the most sensible beginner reaction?',
            options: [opt('Buy everything immediately — it is going up!', 0, 'That is FOMO (fear of missing out). Chasing a big candle usually means buying at a short-term top.'), opt('Note it, wait for a calmer pullback, and plan an entry with a stop', 3, 'Patience gives you a better price and a clear place to be wrong.'), opt('Short it because it went up too much', 1, 'Fighting strong news-driven momentum is risky without a clear reason.')],
          },
        ],
        outro: 'News changes demand → demand changes price. Notice how price pulled back calmly before continuing. Waiting gave a better entry than chasing.',
      }),
    ],
  });

  L.push({
    id: '1-2',
    level: 1,
    title: 'Exchanges, Buyers & Sellers',
    topics: ['How exchanges work', 'Buyers and sellers', 'Supply and demand', 'What makes prices move'],
    steps: [
      learn(
        'An exchange is a matchmaker',
        `<p>An <b>exchange</b> matches people who want to buy with people who want to sell. It does not set the price — <b>buyers and sellers do</b>.</p>
        <ul class="bul"><li>Every trade needs a buyer <b>and</b> a seller. If you buy 10 shares, someone sold you 10 shares.</li><li>The price is simply the last price at which a buyer and seller agreed.</li></ul>`,
        { w: 'html', html: `<div class="diag"><div class="diag-box up-bd">🙋 <b>Buyers</b><small>"I'll pay $100.00"</small></div><div class="diag-arrow">⇄</div><div class="diag-box">🏛️ <b>Exchange</b><small>matches orders</small></div><div class="diag-arrow">⇄</div><div class="diag-box down-bd">🙋 <b>Sellers</b><small>"I want $100.05"</small></div></div>` }
      ),
      learn(
        'Why prices move',
        `<p>Prices move because of <b>supply and demand</b>:</p><ul class="bul"><li><b class="up">More eager buyers</b> → they compete and pay higher prices → price rises.</li><li><b class="down">More eager sellers</b> → they compete and accept lower prices → price falls.</li><li>News, earnings, interest rates and emotions (fear and greed) change how eager each side is.</li></ul>`
      ),
      ex('supply', { prompt: 'You control the crowd. Make the price <b>rise at least 3%</b> by changing how many eager buyers and sellers there are.', goal: 'up', target: 3, explain: 'Buyers outnumbered sellers, so they had to pay higher prices to get filled. Price is the scoreboard of that competition.' }),
      quiz(q('If you buy 100 shares, what must be true?', ['Someone sold you 100 shares', 'The exchange created new shares', 'The price must go up', 'The company sold them to you'], 0, 'Every trade has two sides. For every buyer there is a seller.'), q('A surprise bad news report comes out. What usually happens first?', ['Sellers become more eager and price drops', 'Buyers rush in and price rises', 'The exchange freezes the price', 'Nothing until the next day'], 0, 'Bad news makes holders want out and buyers less eager.'), q('Who sets the price of a stock?', ['Buyers and sellers agreeing on trades', 'The exchange', 'The government', 'The company CEO'], 0, 'The exchange only matches orders.')),
      scen({
        intro: 'You are watching <b>GRDN</b> (simulated energy stock). Breaking news: <b>oil prices jump 8%</b> — great for energy companies.',
        data: R.breakout(32),
        stages: [
          { reveal: 38, q: 'Price is still in its old range. Based on the news, which side do you expect to become more eager?', options: [opt('Buyers — energy profits should improve', 3, 'Correct. Higher oil prices mean higher expected profits, so demand for the shares increases.'), opt('Sellers — good news makes people sell', 1, 'Some traders "sell the news", but usually strong positive news increases demand first.'), opt('Neither — news never matters', 0, 'News is one of the biggest drivers of supply and demand.')] },
          { reveal: 42, q: 'Price broke out of its range on 3× normal volume. What does the high volume tell you?', options: [opt('Many participants agreed the move matters — it has conviction', 3, 'High volume means lots of real buying. Moves with conviction are more likely to continue.'), opt('Nothing — volume is irrelevant', 0, 'Volume shows how many people are behind a move.'), opt('It means the move is fake', 1, 'Fake moves usually have LOW volume.')] },
        ],
        outro: 'News shifted supply and demand. The volume spike confirmed that real buyers were driving the price.',
      }),
    ],
  });

  L.push({
    id: '1-3',
    level: 1,
    title: 'Market Cap & Volume',
    topics: ['Market capitalization', 'Trading volume'],
    steps: [
      learn(
        'Market capitalization = size',
        `<p><b>Market cap = share price × number of shares</b>. It tells you how big a company (or coin) is in total.</p><ul class="bul"><li>A $10 stock is NOT "cheaper" than a $500 stock — it may simply have more shares.</li><li><b>Large caps</b> (>$10B) tend to move slower. <b>Small caps</b> (&lt;$2B) can move wildly.</li></ul>`,
        { w: 'html', html: `<div class="bars-cmp"><div><span style="height:100%"></span><b>$500B</b><small>Mega cap</small></div><div><span style="height:45%"></span><b>$40B</b><small>Large cap</small></div><div><span style="height:18%"></span><b>$5B</b><small>Mid cap</small></div><div><span style="height:6%"></span><b>$800M</b><small>Small cap</small></div></div>` }
      ),
      learn(
        'Volume = participation',
        `<p><b>Volume</b> is how many shares or coins traded in a period. It shows how many people care about a move.</p><ul class="bul"><li>Price up on <b>high volume</b> → strong conviction.</li><li>Price up on <b>low volume</b> → weak, easier to reverse.</li><li>On charts, volume is the bars along the bottom.</li></ul>`,
        { w: 'chart', data: R.breakout(16), clickInfo: true, caption: 'Tap the tall volume bar near the breakout. Notice how the big green candle came with big volume.' }
      ),
      ex('numeric', { given: '🏭 <b>Helix Health</b> has <b>50,000,000</b> shares. Each share trades at <b>$40</b>.', prompt: 'What is the market cap, in <b>billions</b> of dollars?', prefix: '$', unit: 'billion', answer: 2, tol: 0.01, hint: 'Multiply price by shares: $40 × 50,000,000 — then divide by 1,000,000,000.', explain: '$40 × 50 million = $2,000,000,000 = $2 billion. That makes it a mid-to-small cap company.' }),
      quiz(q('Stock A is $10 with 10 billion shares. Stock B is $500 with 100 million shares. Which company is bigger?', ['Stock A ($100B vs $50B)', 'Stock B — its price is higher', 'They are the same size', 'You cannot tell'], 0, 'A: $10 × 10B = $100B. B: $500 × 100M = $50B. Share price alone says nothing about size.'), q('Price rises sharply but volume is the lowest of the week. What should you think?', ['The move has weak participation and could reverse', 'It is a very strong move', 'Volume does not matter', 'The stock is about to split'], 0, 'Low-volume moves lack conviction.')),
      scen({
        intro: 'Two breakouts look identical on price. One has volume 3× average, the other 0.8× average. You can only take one.',
        data: R.fakeout(33),
        stages: [
          { reveal: 40, q: 'This stock just poked above $50 resistance. Volume is <b>about average, not elevated</b>. Breakout trade?', note: 'Look at the volume bars at the bottom of the chart.', options: [opt('Skip it or wait — no volume confirmation', 3, 'Without volume, breakouts often fail. Waiting costs nothing.'), opt('Buy now with a big position', 0, 'Big size on an unconfirmed breakout is a classic trap.'), opt('Buy a small starter with a tight stop just under $50', 2, 'Acceptable if risk is tiny, but confirmation would be better.')] },
        ],
        outro: 'The breakout failed and price fell back into the range. Volume was the warning sign. Breakouts need participation.',
      }),
    ],
  });

  L.push({
    id: '1-4',
    level: 1,
    title: 'Orders, Bid, Ask & Spread',
    topics: ['Market orders', 'Limit orders', 'Bid and ask prices', 'Spreads'],
    steps: [
      learn(
        'Bid, ask and spread',
        `<p>There are always two prices:</p><ul class="bul"><li><b class="up">Bid</b> — the highest price a buyer will pay. <b>You sell at the bid.</b></li><li><b class="down">Ask</b> — the lowest price a seller will accept. <b>You buy at the ask.</b></li><li>The <b>spread</b> = ask − bid. It is a hidden cost: buy and sell instantly and you lose the spread.</li></ul>`,
        { w: 'html', html: `<div class="ladder"><div class="ld ask">ASK 100.05 <small>sellers</small></div><div class="ld spread">spread $0.10</div><div class="ld bid">BID 99.95 <small>buyers</small></div></div>` }
      ),
      learn('Market vs limit orders', `<div class="cmp"><div><h4>⚡ Market order</h4><ul><li>Fills <b>immediately</b></li><li>At the best available price</li><li>You do not control the price</li><li>Risky in fast or thin markets</li></ul></div><div><h4>🎯 Limit order</h4><ul><li>Fills only at <b>your price or better</b></li><li>You control the price</li><li>May never fill</li><li>Great for planned entries/exits</li></ul></div></div>`),
      ex('orderbook', {}),
      quiz(q('Bid is $24.98, ask is $25.02. You place a market BUY. What price do you pay?', ['$25.02 (the ask)', '$24.98 (the bid)', '$25.00 (the middle)', 'Whatever you type'], 0, 'Market buys fill at the ask.'), q('You want to buy only if price dips to $95. Which order?', ['Limit buy at $95', 'Market buy', 'Market sell', 'Limit sell at $95'], 0, 'A limit buy waits for your price.'), q('Why is a wide spread bad for traders?', ['You start every trade at a bigger loss', 'It makes prices rise', 'It guarantees a fill', 'It has no effect'], 0, 'If you buy at the ask and the bid is far below, you are instantly down the spread.')),
      scen({
        intro: 'A tiny, illiquid stock shows bid <b>$4.80</b> and ask <b>$5.20</b>. You want 500 shares.',
        data: R.range(34, 4.8, 5.2),
        stages: [
          { reveal: 30, q: 'The spread is $0.40 (8% of the price!). How do you enter?', options: [opt('Market buy 500 shares', 0, 'You would pay $5.20 and instantly be down $200 (the spread) — 8% before price even moves.'), opt('Use a limit order near the middle, or skip this illiquid stock', 3, 'Limit orders protect you from bad fills. Many pros avoid illiquid stocks entirely.'), opt('Market buy, but only 100 shares', 1, 'Smaller size, but still a terrible fill.')] },
        ],
        outro: 'Spreads are a real cost. Liquid markets (tight spreads, high volume) are much friendlier to beginners.',
      }),
    ],
  });

  /* ============================== LEVEL 2 ============================== */
  L.push({
    id: '2-1',
    level: 2,
    title: 'Candlesticks & OHLC',
    topics: ['Candlestick charts', 'Green and red candles', 'Open, high, low and close'],
    steps: [
      learn(
        'Anatomy of a candle',
        `<p>Each candle summarises one period with four prices: <b>Open, High, Low, Close (OHLC)</b>.</p><ul class="bul"><li><b class="up">Green</b>: close above open — buyers won the period.</li><li><b class="down">Red</b>: close below open — sellers won.</li><li><b>Wicks</b> show how far price went before being pushed back.</li></ul>`,
        { w: 'html', html: `<svg viewBox="0 0 360 200" class="anat"><line x1="90" x2="90" y1="20" y2="180" stroke="#16c784" stroke-width="3"/><rect x="70" y="60" width="40" height="80" fill="#16c784" rx="2"/><text x="125" y="24" fill="#aab4c3" font-size="12">High (top of wick)</text><text x="125" y="64" fill="#aab4c3" font-size="12">Close (top of green body)</text><text x="125" y="144" fill="#aab4c3" font-size="12">Open (bottom of green body)</text><text x="125" y="182" fill="#aab4c3" font-size="12">Low (bottom of wick)</text><line x1="250" x2="250" y1="40" y2="170" stroke="#f0465a" stroke-width="3"/><rect x="230" y="55" width="40" height="70" fill="#f0465a" rx="2"/><text x="285" y="60" fill="#aab4c3" font-size="11">Open</text><text x="285" y="128" fill="#aab4c3" font-size="11">Close</text></svg>` }
      ),
      learn('Inspect real candles', '<p>Tap candles on this chart. The coach explains the story each one tells — who won, and how convincingly.</p>', { w: 'chart', data: R.uptrend(11), clickInfo: true }),
      ex('candle', {
        prompt: 'Build a <b>bullish hammer</b>: a GREEN candle with a small body near the top and a lower wick at least <b>2× the body</b>. It shows sellers pushed down hard, but buyers took control.',
        check: (k) => {
          const body = k.c - k.o;
          if (body <= 0) return 'It must be green — Close above Open.';
          if (Math.min(k.o, k.c) - k.l < body * 2) return 'The lower wick (Open − Low) must be at least twice the body (Close − Open). Drag Low further down.';
          if (k.h - k.c > body) return 'The upper wick should be small — keep High close to Close.';
          return true;
        },
        init: { Open: 100, High: 104, Low: 99, Close: 102 },
        explain: 'Perfect hammer. Sellers drove price down, buyers stepped in and closed it near the high. At support, that can signal a bounce.',
      }),
      quiz(q('A candle opens at $50, goes to $53, drops to $49 and closes at $52. What colour is it?', ['Green', 'Red', 'Grey', 'You cannot tell'], 0, 'Close ($52) > open ($50) → green.'), q('What does a long UPPER wick usually tell you?', ['Buyers pushed price up but sellers pushed it back down', 'Buyers are fully in control', 'Volume was zero', 'The market was closed'], 0, 'The wick is rejected territory.')),
      scen({
        intro: 'Price has been falling toward a level that held before. The latest candle has a long lower wick.',
        data: R.support(14),
        stages: [
          { reveal: 26, q: 'A candle wicked below the old low and closed back up near its high. What does it suggest?', options: [opt('Buyers defended the level — possible bounce, wait for confirmation', 3, 'The long lower wick shows rejection of lower prices. A green follow-through candle would confirm it.'), opt('Sellers are completely in control', 0, 'The close near the high shows buyers won by the end of the period.'), opt('Guaranteed reversal — buy with everything', 1, 'Candles are clues, never guarantees. Always use a stop.')] },
        ],
        outro: 'Buyers defended support and price bounced. One candle is a clue; the level plus the candle plus follow-through is a setup.',
      }),
    ],
  });

  L.push({
    id: '2-2',
    level: 2,
    title: 'Timeframes',
    topics: ['Timeframes'],
    steps: [
      learn(
        'Same market, different zoom',
        `<p>The <b>timeframe</b> is how much time each candle represents: 1 minute, 5 minutes, 1 hour, 1 day…</p><ul class="bul"><li>Lower timeframes show <b>detail and noise</b>.</li><li>Higher timeframes show the <b>bigger trend</b>.</li><li>Rule of thumb: check a higher timeframe before trading a lower one.</li></ul><p class="muted">Day traders: 1m–15m. Swing traders: 1h–daily.</p>`,
        { w: 'chart', data: R.multiTf(29), tfs: [{ label: '1H · zoomed in', mins: 60, last: 34 }, { label: '4H · big picture', mins: 240 }], caption: 'Switch between timeframes. The zoomed-in view looks bearish — the big picture is a strong uptrend.' }
      ),
      ex('chartChoice', { data: R.multiTf(29), tfs: [{ label: '1H · zoomed in', mins: 60, last: 34 }, { label: '4H · big picture', mins: 240 }], prompt: 'Check both timeframes. What is the <b>main</b> trend, and what is the recent dip?', options: ['Main trend UP; the recent dip is a pullback', 'Main trend DOWN; the market is crashing', 'No trend at all', 'Main trend DOWN; the dip is a breakout'], answer: 0, explain: 'On the 4H chart the trend is clearly up with higher highs and higher lows. The 1H decline is just a pullback inside it.', hint: 'Click the "4H" button and look at the whole chart from left to right.' }),
      quiz(q('A swing trader holding for 1–3 weeks should mainly use…', ['Daily and 4-hour charts', '1-minute charts', 'Tick charts', 'Monthly charts only'], 0, 'Match the timeframe to your holding period.'), q('On a 15-minute chart, what does one candle represent?', ['15 minutes of trading', '15 trades', '15 days', '15 shares'], 0, 'Each candle covers its timeframe.')),
      scen({
        intro: 'A 1-hour chart shows a sharp red drop. You are tempted to short.',
        data: R.multiTf(29),
        stages: [{ reveal: 160, q: 'Before shorting, what should you check first?', options: [opt('The higher timeframe trend', 3, 'If the daily/4H trend is strongly up, shorting a small dip fights the bigger flow.'), opt('Nothing — the red candle is enough', 0, 'One timeframe gives an incomplete picture.'), opt('A 1-second chart', 1, 'Going even lower only adds noise.')] }],
        outro: 'The dip was a pullback in an uptrend, and price resumed higher. Higher timeframes keep you on the right side.',
      }),
    ],
  });

  L.push({
    id: '2-3',
    level: 2,
    title: 'Support & Resistance',
    topics: ['Support and resistance'],
    steps: [
      learn(
        'Floors and ceilings',
        `<ul class="bul"><li><b class="up">Support</b>: a price where buying has repeatedly stopped declines — a <b>floor</b>.</li><li><b class="down">Resistance</b>: a price where selling has repeatedly stopped rallies — a <b>ceiling</b>.</li><li>They are <b>zones</b>, not exact lines. The more times a level is tested, the more it matters.</li><li>When resistance breaks, it often becomes new support ("role reversal").</li></ul>`,
        { w: 'chart', data: R.range(13, 96, 102), zones: [{ p1: 101.5, p2: 102.4, color: 'rgba(240,70,90,.13)', label: 'Resistance zone' }, { p1: 95.6, p2: 96.5, color: 'rgba(22,199,132,.13)', label: 'Support zone' }] }
      ),
      ex('level', { data: R.range(35, 96, 102), prompt: 'Click on the chart to mark <b>both</b> the support and the resistance level of this range.', need: 2, levels: () => [{ price: 96, tol: 0.85, label: 'Support', color: '#16c784' }, { price: 102, tol: 0.85, label: 'Resistance', color: '#f0465a' }], explain: 'Price bounced between ~$96 and ~$102 again and again. Range traders buy near support and sell near resistance.', hint: 'The floor is around the lowest dips; the ceiling around the highest peaks.' }),
      quiz(q('Price has bounced off $48 three times. What is $48?', ['Support', 'Resistance', 'The spread', 'Market cap'], 0, 'Repeated bounces from below form support.'), q('Resistance at $60 finally breaks with high volume. What might $60 become?', ['New support', 'Stronger resistance', 'Irrelevant', 'The ask price'], 0, 'Broken resistance often flips into support.')),
      scen({
        intro: 'You trade ranges. Price is approaching the top of a well-defined $96–$102 range again.',
        data: R.range(36, 96, 102),
        stages: [{ reveal: 50, lines: [{ price: 102, color: '#f0465a', label: 'Res' }, { price: 96, color: '#16c784', label: 'Sup' }], q: 'Price is near $101.8, just under resistance. You are a range trader. Best plan?', options: [opt('Buy here — it might break out', 1, 'Buying at the ceiling gives poor reward:risk if the range holds.'), opt('Wait: either short a rejection with a stop above $102.5, or buy a confirmed breakout', 3, 'Let price show you which way it is going at the level.'), opt('Buy at $101.8 with no stop', 0, 'No stop and a bad location — two mistakes.')] }],
        outro: 'In ranges, location is everything. The middle of a range is a coin flip; the edges give you a clear stop.',
      }),
    ],
  });

  L.push({
    id: '2-4',
    level: 2,
    title: 'Trends & Market Direction',
    topics: ['Trends', 'Higher highs and lower lows', 'Bullish and bearish markets'],
    steps: [
      learn(
        'Reading the trend',
        `<ul class="bul"><li><b class="up">Uptrend (bullish)</b>: higher highs (HH) and higher lows (HL).</li><li><b class="down">Downtrend (bearish)</b>: lower highs (LH) and lower lows (LL).</li><li><b>Sideways</b>: no clear sequence — a range.</li><li>A trend is intact until that sequence breaks.</li></ul>`,
        { w: 'chart', data: R.uptrend(11), caption: 'Each dip stays above the previous dip (higher lows) and each peak beats the last (higher highs).' }
      ),
      ex('clickCandle', {
        data: R.uptrend(37),
        prompt: 'Click any <b>higher low</b> — a dip that stayed ABOVE the previous dip.',
        target: (d) => {
          const lows = TM.Ind.pivots(d, 2).lows;
          return lows.filter((i, k) => k > 0 && d[i].l > d[lows[k - 1]].l);
        },
        tol: 1,
        hint: 'Find the bottoms of the small pullbacks. Pick one that is higher than the one before it.',
        explain: 'Higher lows show buyers are stepping in at higher and higher prices — the heartbeat of an uptrend.',
      }),
      quiz(q('Peaks: $50, $54, $58. Dips: $47, $51, $55. What is the trend?', ['Uptrend', 'Downtrend', 'Sideways', 'Reversal'], 0, 'Higher highs and higher lows.'), q('In an uptrend, price suddenly makes a LOWER low. What does that mean?', ['The uptrend structure is broken — be careful', 'The uptrend is stronger', 'Nothing', 'Buy more'], 0, 'A lower low breaks the HH/HL sequence.'), q('"Bearish" means you expect prices to…', ['Fall', 'Rise', 'Stay flat', 'Become more volatile'], 0, 'Bears swipe down; bulls thrust up.')),
      scen({
        intro: 'A simulated stock has made three higher highs and three higher lows. It just pulled back.',
        data: R.uptrend(38),
        stages: [{ reveal: 42, q: 'Price is pulling back in an uptrend. Which trade is aligned with the trend?', options: [opt('Look to BUY when the pullback stops and price turns up, stop below the pullback low', 3, 'Buying higher lows in an uptrend trades with the dominant direction.'), opt('Short because it is falling', 1, 'You would be shorting into a trend that keeps making higher lows.'), opt('Buy at the very top of the last spike', 1, 'Chasing highs gives a worse price and a wide stop.')] }],
        outro: 'The pullback held above the prior low and the trend continued. "The trend is your friend" — until structure breaks.',
      }),
    ],
  });

  L.push({
    id: '2-5',
    level: 2,
    title: 'Volume on the Chart',
    topics: ['Trading volume'],
    steps: [
      learn('Volume confirms price', `<ul class="bul"><li>Breakout + <b>high volume</b> → real demand, more likely to continue.</li><li>Breakout + <b>low volume</b> → weak, may fail.</li><li>Pullback on <b>falling volume</b> → healthy pause in a trend.</li><li>Big volume at a top or bottom can mark <b>exhaustion</b>.</li></ul>`, { w: 'chart', data: R.bullFlag(23), clickInfo: true, caption: 'Notice: the rally has big volume, the pause (flag) has small volume, and the second leg has big volume again.' }),
      ex('clickCandle', { data: R.breakout(16), prompt: 'Click the candle with the <b>highest volume</b>. What happened on that candle?', target: (d) => [argmax(d, (c) => c.v)], tol: 0, hint: 'Look at the tallest bar at the bottom of the chart, then click the candle above it.', explain: 'That was the breakout candle. The volume spike shows a flood of buyers when price cleared resistance.' }),
      quiz(q('Price pulls back in an uptrend on shrinking volume. Usually that is…', ['A healthy pause — sellers are not aggressive', 'A crash starting', 'A fake breakout', 'Irrelevant'], 0, 'Low-volume pullbacks suggest profit-taking, not heavy selling.'), q('Which breakout is more trustworthy?', ['Close above resistance on 3× average volume', 'A wick above resistance on half-average volume', 'Both are equal', 'Neither ever works'], 0, 'Closes beat wicks, and volume confirms.')),
      scen({ intro: 'A flag is forming after a strong rally.', data: R.bullFlag(39), stages: [{ reveal: 27, q: 'Volume has dried up during this pause. What is the most reasonable read?', options: [opt('Healthy consolidation; watch for a high-volume break of the flag', 3, 'Quiet pullbacks after strong moves often lead to continuation.'), opt('Sellers are overwhelming buyers', 1, 'Heavy selling would show rising volume on red candles.'), opt('Volume tells you nothing', 0, 'Volume is how you judge the strength behind a move.')] }], outro: 'Volume returned on the breakout from the flag. Price and volume together tell the story.' }),
    ],
  });

  /* ============================== LEVEL 3 ============================== */
  L.push({
    id: '3-1',
    level: 3,
    title: 'Moving Averages: EMA 9, 20, 50',
    topics: ['Moving averages', 'EMA 9, EMA 20, and EMA 50'],
    steps: [
      learn(
        'Smoothing out the noise',
        `<p>A <b>moving average</b> is the average closing price of the last N candles, drawn as a line.</p><ul class="bul"><li><b style="color:#f2b84b">EMA 9</b> — fast, shows short-term momentum.</li><li><b style="color:#4d8dff">EMA 20</b> — the short-term trend; pullbacks often pause here.</li><li><b style="color:#c084fc">EMA 50</b> — the medium trend.</li><li>Price above rising EMAs = uptrend. Stacked 9 > 20 > 50 = strong uptrend.</li></ul><p class="warn">⚠️ Misleading signals: in sideways markets, price crosses averages constantly. Averages <b>lag</b> — they confirm, they do not predict.</p>`,
        { w: 'chart', data: R.ema(27), overlays: { ema9: true, ema20: true, ema50: true }, toggles: ['ema9', 'ema20', 'ema50'], caption: 'Toggle the averages. See how they tangle in the range, then fan out in the trend.' }
      ),
      ex('clickCandle', {
        data: R.ema(40),
        overlays: { ema9: true, ema20: true },
        prompt: 'Click the candle where the <b>EMA 9 crosses above the EMA 20</b> just before the big rally starts.',
        target: (d) => {
          const cl = d.map((c) => c.c),
            a = TM.Ind.ema(cl, 9),
            b = TM.Ind.ema(cl, 20);
          const out = [];
          for (let i = 36; i < d.length - 10; i++) if (a[i - 1] != null && b[i - 1] != null && a[i - 1] <= b[i - 1] && a[i] > b[i]) out.push(i);
          return out.length ? out.slice(0, 2) : [44];
        },
        tol: 1,
        hint: 'Find where the yellow line (EMA 9) moves from below to above the blue line (EMA 20), after the dip.',
        explain: 'A bullish crossover. Notice it happened AFTER price had already started rising — moving averages confirm trends, they do not predict them.',
      }),
      quiz(q('Price is above a rising EMA 20 and EMA 50. What does that suggest?', ['An uptrend', 'A downtrend', 'Oversold', 'A guaranteed rise'], 0, 'Price above rising averages = trend up. Never guaranteed.'), q('When are moving-average crossovers MOST misleading?', ['In sideways, choppy markets', 'In strong trends', 'On high volume', 'Never'], 0, 'Ranges cause whipsaws.'), q('Which reacts fastest to price changes?', ['EMA 9', 'EMA 20', 'EMA 50', 'They react equally'], 0, 'Shorter period = faster.')),
      scen({ intro: 'You see a stock with EMAs stacked 9 > 20 > 50, all rising.', data: R.ema(41), overlays: { ema9: true, ema20: true, ema50: true }, stages: [{ reveal: 66, q: 'Price has pulled back to the EMA 20 and printed a green candle. What is the trend-following plan?', options: [opt('Buy with a stop below the recent swing low / EMA 50', 3, 'A pullback to a rising EMA in an aligned trend is a classic entry.'), opt('Short — it touched an average', 0, 'Touching an average is not a reversal signal by itself.'), opt('Wait for EMA 9 to cross below EMA 50 before buying', 1, 'That would mean the trend has already weakened.')] }], outro: 'The pullback held and the trend resumed. Averages give you a map of the trend and natural pullback zones.' }),
    ],
  });

  L.push({
    id: '3-2',
    level: 3,
    title: 'RSI & MACD (Momentum)',
    topics: ['RSI', 'MACD'],
    steps: [
      learn(
        'RSI — speed of the move',
        `<p><b>RSI</b> (Relative Strength Index) runs from 0–100.</p><ul class="bul"><li>Above <b>70</b>: overbought — price rose fast.</li><li>Below <b>30</b>: oversold — price fell fast.</li><li><b>Divergence</b>: price makes a new low but RSI makes a higher low → selling momentum is fading.</li></ul><p class="warn">⚠️ Misleading signal: in strong trends RSI can stay above 70 or below 30 for a long time. "Oversold" is NOT a buy signal on its own.</p>`,
        { w: 'chart', data: R.oversold(18), panes: ['rsi'], toggles: ['rsi', 'macd'] }
      ),
      learn('MACD — momentum turning', `<p><b>MACD</b> compares a fast (12) and slow (26) EMA.</p><ul class="bul"><li>MACD line crosses <b>above</b> its signal line → momentum turning up.</li><li>Histogram bars growing → momentum strengthening.</li><li>Histogram shrinking → momentum fading.</li></ul><p class="warn">⚠️ MACD lags and gives many false crossovers in ranges. Use it to confirm, not to trigger trades alone.</p>`, { w: 'chart', data: R.ema(27), panes: ['macd'], overlays: { ema20: true }, toggles: ['macd', 'rsi', 'ema20'] }),
      ex('clickCandle', {
        data: R.oversold(42),
        panes: ['rsi'],
        prompt: 'Click the FIRST candle where <b>RSI drops below 30</b> (oversold). Then watch what price did next.',
        target: (d) => {
          const r = TM.Ind.rsi(d.map((c) => c.c));
          for (let i = 15; i < d.length; i++) if (r[i] < 30 && r[i - 1] >= 30) return [i];
          return [20];
        },
        tol: 1,
        hint: 'Watch the purple line in the bottom pane. Find where it first crosses the green 30 line.',
        explain: 'RSI went oversold — but price kept falling for several more candles. Buying just because RSI < 30 would have been early. Wait for price to confirm.',
      }),
      quiz(q('RSI is 25 and price is in a steep downtrend. Best interpretation?', ['Selling is strong; wait for confirmation before buying', 'Must buy now — it is oversold', 'Short more with no stop', 'RSI is broken'], 0, 'Oversold can get more oversold.'), q('Price makes a lower low, RSI makes a higher low. This is…', ['Bullish divergence — selling momentum fading', 'Bearish divergence', 'A breakout', 'Meaningless'], 0, 'Divergence warns the move is losing steam.'), q('The MACD line crosses above the signal line in a choppy sideways market. How reliable?', ['Not very — ranges create many false crossovers', 'Extremely reliable', 'Guaranteed rally', 'It means sell'], 0, 'Momentum indicators whipsaw in ranges.')),
      scen({
        intro: 'This is <b>Scenario C — Oversold</b> in miniature. RSI is deeply oversold.',
        data: R.oversold(18),
        panes: ['rsi'],
        stages: [
          { reveal: 28, q: 'RSI just hit 22 after a steep decline. What do you do?', options: [opt('Wait — oversold can stay oversold. Look for a higher low or bullish divergence', 3, 'Patience avoids catching a falling knife.'), opt('Buy immediately, it must bounce', 1, 'Price may keep falling — RSI is not a timing tool alone.'), opt('Short with 10× leverage', 0, 'Shorting deep oversold with leverage risks a violent squeeze.')] },
          { reveal: 40, q: 'Price made a slightly LOWER low, but RSI made a HIGHER low, and a strong green candle just closed. Now?', options: [opt('Consider a small long with a stop below the new low', 3, 'Divergence + confirmation candle + defined stop = a real setup.'), opt('Still never buy', 2, 'Avoiding is fine, but you would miss a valid setup.'), opt('Buy with your whole account', 0, 'Even good setups fail. Size for the stop.')] },
        ],
        outro: 'The first oversold reading was early. The divergence plus a confirmation candle gave a far better entry.',
      }),
    ],
  });

  L.push({
    id: '3-3',
    level: 3,
    title: 'VWAP & Bollinger Bands',
    topics: ['VWAP', 'Bollinger Bands'],
    steps: [
      learn('VWAP — the day’s fair price', `<p><b>VWAP</b> = Volume-Weighted Average Price. It resets every day and shows the average price everyone paid today.</p><ul class="bul"><li>Price <b>above</b> VWAP → buyers in control today.</li><li>Price <b>below</b> VWAP → sellers in control.</li><li>Big institutions use VWAP to judge their fills, so it often acts as support/resistance intraday.</li></ul><p class="warn">⚠️ VWAP is mainly an intraday tool. On multi-day charts it is far less meaningful.</p>`, { w: 'chart', data: R.daySession(30, 'trend'), overlays: { vwap: true }, toggles: ['vwap', 'ema9'], fitBars: 200 }),
      learn('Bollinger Bands — volatility envelope', `<p><b>Bollinger Bands</b>: a 20-period average with bands 2 standard deviations above and below.</p><ul class="bul"><li>Bands <b>squeeze</b> when the market is quiet — often before a big move.</li><li>Bands <b>widen</b> during volatile moves.</li><li>In strong trends price can "walk the band".</li></ul><p class="warn">⚠️ Touching the upper band is NOT a sell signal by itself. In a breakout, it is a sign of strength.</p>`, { w: 'chart', data: R.bbSqueeze(28), overlays: { bb: true }, toggles: ['bb'] }),
      ex('clickCandle', {
        data: R.bbSqueeze(43),
        overlays: { bb: true },
        prompt: 'The bands squeezed tight. Click the first candle that <b>closes above the upper band</b> after the squeeze.',
        target: (d) => {
          const b = TM.Ind.bb(d.map((c) => c.c));
          for (let i = 46; i < d.length; i++) if (b.up[i] != null && d[i].c > b.up[i]) return [i];
          return [48];
        },
        tol: 1,
        hint: 'Find the narrow section of the bands, then follow it to the right until a candle closes outside the top band.',
        explain: 'The squeeze released into a breakout. Low volatility tends to be followed by high volatility — but the squeeze alone does not tell you the direction.',
      }),
      quiz(q('Price is below VWAP all morning. What does that suggest for the day?', ['Sellers are in control', 'Buyers are in control', 'The market is closed', 'Nothing'], 0, 'Below the day’s average price, sellers dominate.'), q('Bollinger Bands are extremely narrow. What often follows?', ['A big move (direction unknown)', 'A guaranteed rally', 'A guaranteed drop', 'Lower volume forever'], 0, 'Squeezes precede expansion.')),
      scen({ intro: 'Intraday: price is trending above VWAP.', data: R.daySession(44, 'trend'), overlays: { vwap: true }, fitBars: 140, stages: [{ reveal: 62, q: 'Price pulled back and is touching VWAP from above. Day-trading plan?', options: [opt('Watch for a bounce off VWAP to buy, stop just below it', 3, 'Trend + VWAP support gives a defined, logical entry.'), opt('Short because it touched VWAP', 1, 'In an uptrend day, VWAP often acts as support.'), opt('Buy far above VWAP at the high of the day', 1, 'Chasing gives a wide stop and worse reward:risk.')] }], outro: 'VWAP held as support and the trend day continued. Watch how price reacts at VWAP — it tells you who controls the day.' }),
    ],
  });

  L.push({
    id: '3-4',
    level: 3,
    title: 'Trendlines, Breakouts, Pullbacks & Reversals',
    topics: ['Trendlines', 'Breakouts', 'Pullbacks', 'Reversals'],
    steps: [
      learn('Four price behaviours', `<div class="cards4"><div><b>📏 Trendline</b><p>Connect two or more swing lows (uptrend). A break warns the trend is weakening.</p></div><div><b>🚀 Breakout</b><p>Price closes through a key level, ideally with high volume.</p></div><div><b>↩️ Pullback</b><p>A temporary move against the trend — a better entry than chasing.</p></div><div><b>🔄 Reversal</b><p>The trend changes direction, confirmed by a break of structure.</p></div></div>`, { w: 'chart', data: R.breakout(16), lines: [{ price: 102, color: '#f0465a', label: 'Resistance' }], caption: 'Breakout at ~bar 41, then a pullback to retest $102 from above (old resistance → new support), then continuation.' }),
      ex('clickCandle', {
        data: R.breakout(45),
        lines: [{ price: 102, color: '#f0465a', label: 'Resistance' }],
        prompt: 'Click the <b>breakout candle</b> — the first candle that CLOSES clearly above the $102 resistance.',
        target: (d) => {
          for (let i = 30; i < d.length; i++) if (d[i].c > 102.4) return [i];
          return [41];
        },
        tol: 0,
        hint: 'Ignore wicks that only poke through. Find the first candle whose BODY closes above the red line.',
        explain: 'A close above resistance on a volume spike. Many traders wait for the close rather than reacting to a wick — wicks are easily reversed.',
      }),
      quiz(q('Why do many traders prefer buying a pullback rather than the breakout candle itself?', ['Better price and a tighter, logical stop', 'Pullbacks never fail', 'It is more exciting', 'Breakouts are illegal'], 0, 'A retest gives a clear level to place the stop beyond.'), q('An uptrend’s trendline breaks, but price has not made a lower low yet. What is it?', ['An early warning — not yet a confirmed reversal', 'A confirmed crash', 'A buy signal', 'Meaningless'], 0, 'Trendline breaks warn; structure breaks confirm.')),
      scen({ intro: 'Breakout and retest.', data: R.breakout(46), stages: [{ reveal: 51, lines: [{ price: 102, color: '#f0465a', label: 'Old resistance' }], q: 'After breaking out, price pulled back toward $102. Your plan?', options: [opt('Buy if $102 holds as support, stop below ~$101', 3, 'Classic breakout-retest entry: old resistance becomes new support.'), opt('Panic — the breakout failed', 1, 'A pullback that holds the level is normal, not a failure.'), opt('Buy with a stop at $96 (bottom of range)', 1, 'Too wide: your position must be tiny, and the logic of the trade is at $102.')] }], outro: 'The retest held and price continued higher. Old resistance became support.' }),
    ],
  });

  L.push({
    id: '3-5',
    level: 3,
    title: 'Chart Patterns',
    topics: ['Chart patterns'],
    steps: [
      learn('Patterns = crowd behaviour', `<div class="cards4"><div><b>Double top</b><p>Two failed attempts at the same high. Bearish when the "neckline" breaks.</p></div><div><b>Double bottom</b><p>Two holds at the same low. Bullish when the neckline breaks.</p></div><div><b>Head & shoulders</b><p>Left shoulder, higher head, lower right shoulder. Bearish below the neckline.</p></div><div><b>Bull flag</b><p>Strong rally, small orderly pullback, continuation.</p></div></div><p class="warn">⚠️ Patterns are probabilities, not promises. Wait for the confirmation (neckline/flag break) and always use a stop.</p>`, { w: 'chart', data: R.headShoulders(22), lines: [{ price: 100.1, color: '#f2b84b', label: 'Neckline' }] }),
      ex('chartChoice', { data: R.doubleTop(47), prompt: 'Which pattern is this?', options: ['Double top', 'Bull flag', 'Double bottom', 'Ascending triangle'], answer: 0, explain: 'Two peaks at nearly the same price, then a break below the low between them (the neckline). Buyers failed twice.', hint: 'Count the peaks and compare their heights.' }),
      ex('chartChoice', { data: R.bullFlag(48), prompt: 'And this one?', options: ['Head & shoulders', 'Bull flag', 'Double top', 'Falling knife'], answer: 1, explain: 'A sharp rally (the pole), a shallow, low-volume drift down (the flag), then a breakout continuation.' }),
      quiz(q('When is a double top confirmed?', ['When price breaks below the neckline (the low between the peaks)', 'When the second peak forms', 'When RSI is 50', 'Immediately after the first peak'], 0, 'Until the neckline breaks, it is just two highs.'), q('A bull flag pullback should ideally have…', ['Lower volume than the rally', 'Higher volume than the rally', 'No candles', 'Huge red candles'], 0, 'Quiet pullbacks show sellers are not aggressive.')),
      scen({ intro: 'A head & shoulders is forming.', data: R.headShoulders(49), stages: [{ reveal: 33, lines: [{ price: 100.1, color: '#f2b84b', label: 'Neckline' }], q: 'The right shoulder is forming. Price has NOT broken the neckline. What now?', options: [opt('Wait for a close below the neckline before acting', 3, 'Patterns are only confirmed by the break.'), opt('Short aggressively now', 1, 'Without confirmation, many patterns morph into something else.'), opt('Buy, because patterns never work', 1, 'Patterns are probabilities, not certainties either way.')] }], outro: 'The neckline broke and price followed through lower. Confirmation first, action second.' }),
    ],
  });

  /* ============================== LEVEL 4 ============================== */
  L.push({
    id: '4-1',
    level: 4,
    title: 'Stop Loss, Take Profit & Risk:Reward',
    topics: ['Stop losses', 'Take profits', 'Risk-to-reward ratios'],
    steps: [
      learn(
        'Decide your exits BEFORE you enter',
        `<ul class="bul"><li><b class="down">Stop-loss</b>: where your idea is proven wrong. Place it beyond a logical level (below support for a long), not at a random %.</li><li><b class="up">Take-profit</b>: your planned exit if the trade works, usually near the next resistance.</li><li><b>Risk:Reward (R:R)</b> = distance to target ÷ distance to stop.</li></ul>`,
        { w: 'html', html: `<div class="rrtab"><table><tr><th>R:R</th><th>Win rate needed to break even</th></tr><tr><td>1 : 1</td><td>50%</td></tr><tr><td>2 : 1</td><td class="up">33%</td></tr><tr><td>3 : 1</td><td class="up">25%</td></tr><tr><td>0.5 : 1</td><td class="down">67%</td></tr></table><p class="muted small">With 2:1 you can be wrong 6 times out of 10 and still make money.</p></div>` }
      ),
      ex('stops', {
        data: R.breakout(50),
        slice: [0, 53],
        prompt: 'You are buying the breakout retest at the current price. Old resistance at <b>$102</b> is now support. Drag/type a <b>stop below $102</b> (but above $100) and a <b>target with at least 2:1</b> reward:risk.',
        check: ({ entry, stop, target, rr }) => {
          if (!(stop < entry)) return 'For a long, the stop must be below entry.';
          if (stop >= 102) return 'Your stop is above the $102 support — normal noise could stop you out. Move it just below $102.';
          if (stop < 100) return 'That stop is far too wide — the idea (support at $102) is already wrong well before $100. A wide stop forces a tiny position.';
          if (!(rr >= 2)) return `Reward:risk is ${rr ? rr.toFixed(2) : '—'}:1. Move the target higher so it is at least 2× the stop distance.`;
          return true;
        },
        lines: [{ price: 102, color: '#f2b84b', label: 'Support' }],
        explain: 'Stop below the level that defines the trade, target at least twice as far. That is a professional trade plan.',
      }),
      quiz(q('Entry $50, stop $48, target $56. What is the R:R?', ['3 : 1', '2 : 1', '1 : 3', '6 : 1'], 0, 'Risk $2, reward $6 → 3:1.'), q('Where should a stop-loss for a long trade usually go?', ['Just below a logical support level', 'Exactly at the entry', 'Wherever feels comfortable', 'Above the entry'], 0, 'The stop goes where the trade idea is invalidated.'), q('With a 2:1 R:R, what win rate do you need to break even?', ['About 33%', '50%', '67%', '90%'], 0, '1 win (+2) covers 2 losses (−2).')),
      scen({ intro: 'A trade is going your way.', data: R.uptrend(51), stages: [{ reveal: 38, q: 'You bought at the last pullback low. Price is now 1.5R in profit, heading toward your 2R target. A red candle appears.', options: [opt('Stick to the plan; optionally trail the stop to breakeven', 3, 'You can protect the trade without abandoning your plan.'), opt('Close everything — a red candle means it is over', 1, 'Single candles are noise. Fear-based exits shrink your winners.'), opt('Move your stop further down to give it room', 0, 'Widening stops is how small losses become big ones.')] }], outro: 'Price wiggled and continued. Planned exits beat emotional exits.' }),
    ],
  });

  L.push({
    id: '4-2',
    level: 4,
    title: 'Position Sizing & Risk Per Trade',
    topics: ['Position sizing', 'Risk per trade'],
    steps: [
      learn('The formula that saves accounts', `<div class="formula">Shares = (Account × Risk %) ÷ (Entry − Stop)</div><ul class="bul"><li>Risk 0.5–2% of your account per trade. 1% is a great default.</li><li>The stop distance decides the size — a wider stop means FEWER shares, so the dollar risk stays the same.</li><li>Losing streaks happen to everyone. Small risk lets you survive them.</li></ul>`, { w: 'html', html: `<div class="rrtab"><table><tr><th>Risk/trade</th><th>After 10 losses in a row</th></tr><tr><td>1%</td><td class="up">−9.6% (easy to recover)</td></tr><tr><td>5%</td><td>−40%</td></tr><tr><td>10%</td><td class="down">−65% (needs +186% to recover)</td></tr></table></div>` }),
      ex('numeric', { given: 'Account: <b>$10,000</b> · Risk: <b>1%</b> · Entry: <b>$50.00</b> · Stop: <b>$48.00</b>', prompt: 'How many shares should you buy?', unit: 'shares', answer: 50, tol: 0, hint: '1% of $10,000 = $100. Risk per share = $50 − $48 = $2. Divide.', explain: '$100 ÷ $2 = 50 shares (a $2,500 position). If the stop hits, you lose exactly $100 — 1% of your account.' }),
      ex('numeric', { given: 'Same $10,000 account and 1% risk. New trade: entry <b>$50.00</b>, but the logical stop is wider at <b>$45.00</b>.', prompt: 'How many shares now?', unit: 'shares', answer: 20, tol: 0, hint: '$100 risk ÷ $5 per share.', explain: 'Only 20 shares. The wider stop means a smaller position, but the dollar risk is identical: $100.' }),
      quiz(q('Your account is $5,000. You risk 2% per trade. How much can you lose on one trade?', ['$100', '$1,000', '$50', '$250'], 0, '2% × $5,000 = $100.'), q('Your stop must be wider than usual because the market is volatile. What should you do?', ['Buy fewer shares so dollar risk stays the same', 'Buy more shares', 'Remove the stop', 'Use more leverage'], 0, 'Size adjusts to the stop, never the other way around.')),
      scen({ intro: 'This is <b>Scenario F — Risk management</b> in miniature. Account $10,000, rule: 1% risk.', data: R.support(52), stages: [{ reveal: 30, lines: [{ price: 100.8, color: '#f2b84b', label: 'Support' }], q: 'Entry $102, stop $100 (below support). How many shares keeps risk at 1%?', input: { answer: 50, tol: 0.5, unit: ' shares', fb: '$100 ÷ ($102 − $100) = 50 shares. Size is a calculation, not a feeling.', hint: '$10,000 × 1% = $100. Divide by the stop distance.' } }], outro: 'Whatever the outcome, you knew your worst case before entering. That is the definition of controlled risk.' }),
    ],
  });

  L.push({
    id: '4-3',
    level: 4,
    title: 'Portfolio Diversification',
    topics: ['Portfolio diversification'],
    steps: [
      learn('Don’t put all your eggs in one basket', `<ul class="bul"><li>Spreading money across <b>different sectors and assets</b> means one bad event cannot sink everything.</li><li>Assets that move together (e.g. five chip stocks) are NOT diversified.</li><li>A broad index fund is diversified by design.</li><li>Many traders cap any single position at 10–25% of the portfolio.</li></ul>`),
      ex('allocate', {
        prompt: 'Build a $10,000 simulated portfolio. Rules: <b>no single holding above 35%</b> and at least <b>4 holdings</b>. Watch the stress test.',
        assets: [
          { sym: 'NVRX', sector: 'Technology', crash: 45, init: 70 },
          { sym: 'HLXH', sector: 'Healthcare', crash: 25, init: 10 },
          { sym: 'GRDN', sector: 'Energy', crash: 35, init: 10 },
          { sym: 'BNCR', sector: 'Financials', crash: 35, init: 10 },
          { sym: 'SIMX', sector: 'Index ETF', crash: 22, init: 0 },
          { sym: 'BTC', sector: 'Crypto', crash: 60, init: 0 },
        ],
        check: (pct, a) => {
          const big = pct.findIndex((v) => v > 35.5);
          if (big >= 0) return `${a[big].sym} is ${pct[big].toFixed(0)}% of the portfolio — above the 35% limit.`;
          if (pct.filter((v) => v >= 5).length < 4) return 'Hold at least 4 different assets (5%+ each).';
          return true;
        },
        explain: 'Diversified. No single sector crash can take out more than a fraction of your capital.',
      }),
      quiz(q('You own 5 different semiconductor stocks. Are you diversified?', ['No — they all move together', 'Yes — five different companies', 'Yes, if they are large', 'Only on weekends'], 0, 'Correlated assets fall together.'), q('What is the main purpose of diversification?', ['Reduce the damage from any single loss', 'Guarantee profits', 'Increase leverage', 'Avoid taxes'], 0, 'It manages risk; it does not guarantee returns.')),
      scen({ intro: 'You hold 80% of your account in one hot tech stock. Earnings are tomorrow.', data: R.newsShock(53), stages: [{ reveal: 30, q: 'What is the most responsible action?', options: [opt('Reduce the position to a size you can afford to see gap 20%', 3, 'Concentration + event risk is how accounts get crippled overnight.'), opt('Buy more — it has been going up', 0, 'Past gains do not protect you from an earnings gap.'), opt('Do nothing; stops will protect me', 1, 'Stops cannot protect against overnight gaps.')] }], outro: 'A shock knocked the stock sharply lower in a single candle. Concentration magnifies these events.' }),
    ],
  });

  L.push({
    id: '4-4',
    level: 4,
    title: 'Leverage & Liquidation',
    topics: ['Leverage and liquidation'],
    steps: [
      learn('Leverage multiplies everything', `<ul class="bul"><li><b>Leverage</b> lets you control a bigger position than your cash. 10× = $1,000 controls $10,000.</li><li>Profits AND losses are multiplied. A 5% move at 10× = 50% of your margin.</li><li><b>Liquidation</b>: if losses eat your margin, the exchange force-closes the trade and you lose that margin.</li><li>Rough rule: liquidation distance ≈ 100% ÷ leverage. 10× → ~10%. 50× → ~2%.</li></ul>`),
      ex('leverage', { entry: 60000, move: 8, prompt: 'Bitcoin (simulated) at $60,000. Volatile day — an <b>8% swing</b> is possible. Choose a leverage where your <b>liquidation price is at least 10% away</b>.', check: (L) => { const dist = L > 1 ? (1 / L - 0.005) * 100 : 100; if (dist < 10) return `At ${L}× your liquidation is only ${dist.toFixed(1)}% away — an ordinary swing would wipe you out. Lower the leverage.`; return true; }, explain: 'Your liquidation is far enough away to survive normal volatility. Remember: lower leverage = more room to be wrong.' }),
      quiz(q('With 20× leverage, roughly how big a move against you causes liquidation?', ['About 5%', 'About 20%', 'About 50%', 'It cannot happen'], 0, '100% ÷ 20 ≈ 5% (minus fees/maintenance).'), q('Leverage changes…', ['The size of gains AND losses', 'Only gains', 'Only the spread', 'Nothing'], 0, 'It is a double-edged sword.'), q('Your stop is 6% below entry. Which leverage is dangerous?', ['20× (liquidation ~5% away, before your stop)', '2×', '3×', '1×'], 0, 'If liquidation comes before your stop, your stop is useless.')),
      scen({ intro: 'You want to long crypto with leverage. Price is choppy.', data: R.stopHunt(54), stages: [{ reveal: 42, q: 'Your plan: stop 3% below entry. Which leverage keeps liquidation beyond your stop?', options: [opt('3× (liquidation ~33% away)', 3, 'Plenty of room. Your stop controls the risk, not the exchange.'), opt('25× (liquidation ~3.5% away)', 1, 'Barely beyond your stop — any wick could liquidate you.'), opt('100× (liquidation ~0.5% away)', 0, 'Normal noise liquidates this in seconds.')] }], outro: 'A sharp wick swept below the lows before recovering. High leverage would have been liquidated even though the idea was right.' }),
    ],
  });

  L.push({
    id: '4-5',
    level: 4,
    title: 'Emotions & Overtrading',
    topics: ['Emotional trading', 'Overtrading'],
    steps: [
      learn('Your biggest opponent is you', `<div class="cards4"><div><b>😱 FOMO</b><p>Chasing a move you missed. Usually buys the top.</p></div><div><b>😤 Revenge trading</b><p>Trading bigger to "win it back" after a loss.</p></div><div><b>🙈 Moving stops</b><p>Hoping instead of accepting a small planned loss.</p></div><div><b>🔁 Overtrading</b><p>Taking trades that do not meet your rules — boredom or tilt.</p></div></div><p>The fix: <b>written rules</b>, a <b>daily loss limit</b>, a <b>max number of trades</b>, and a <b>journal</b>.</p>`),
      ex('decisions', {
        steps: [
          { s: 'You just took two losses in a row, each −1%. A new setup appears that is only "okay".', o: [{ t: 'Skip it. Only A-grade setups, especially after losses', good: true, fb: 'Protecting your mental capital is part of risk management.' }, { t: 'Take it with double size to win back the losses', good: false, fb: 'That is revenge trading — the fastest way to turn a bad day into a disaster.' }] },
          { s: 'Your trade is near its stop. You "feel" it will turn around.', o: [{ t: 'Let the stop do its job', good: true, fb: 'A small planned loss is the cost of doing business.' }, { t: 'Move the stop lower to give it room', good: false, fb: 'Widening stops turns −1R into −3R. Feelings are not analysis.' }] },
          { s: 'A coin is up 40% today and everyone online is buying.', o: [{ t: 'Wait for a pullback and a plan, or skip it', good: true, fb: 'Chasing parabolic moves is FOMO. There will always be another trade.' }, { t: 'Buy now before it goes higher', good: false, fb: 'Late buyers in a hype move often become the exit liquidity for early buyers.' }] },
          { s: 'It is a slow, quiet afternoon. You are bored and have not traded.', o: [{ t: 'Close the platform or review your journal', good: true, fb: 'Not trading is a position. Boredom trades are overtrading.' }, { t: 'Find something to trade so the day is not wasted', good: false, fb: 'Forcing trades lowers your average setup quality.' }] },
          { s: 'You hit your daily loss limit of −3%.', o: [{ t: 'Stop trading for the day', good: true, fb: 'Limits only work if you obey them.' }, { t: 'One more trade to get back to even', good: false, fb: 'This is exactly the trade your limit is meant to prevent.' }] },
        ],
      }),
      quiz(q('Which is a sign of overtrading?', ['Taking many trades that do not meet your rules', 'Taking one great setup', 'Journaling every trade', 'Using a stop-loss'], 0, 'Quantity is not quality.'), q('What is "revenge trading"?', ['Trading bigger or more often to recover losses quickly', 'Shorting a stock you dislike', 'Following your plan after a loss', 'Copying another trader'], 0, 'Emotion replaces process.')),
      scen({ intro: 'You missed a big rally and feel FOMO.', data: R.bullFlag(55), stages: [{ reveal: 17, q: 'Price is at the top of a huge green candle. You feel you must get in.', options: [opt('Write down a plan: wait for a pullback/flag and a defined stop', 3, 'Turning emotion into a written plan is the professional move.'), opt('Market buy now, no stop, before it runs away', 0, 'FOMO entry + no stop = maximum risk at the worst price.'), opt('Buy half now, half later, no stop', 1, 'Still no plan for being wrong.')] }], outro: 'Price pulled back into a flag before continuing. The patient trader got a better price and a tighter stop.' }),
    ],
  });

  /* ============================== LEVEL 5 ============================== */
  L.push({
    id: '5-1',
    level: 5,
    title: 'What Day Trading Is',
    topics: ['What day trading is', 'Scalping', 'Momentum trading'],
    steps: [
      learn('In and out the same day', `<ul class="bul"><li><b>Day trading</b>: every position is closed before the market closes. No overnight risk.</li><li><b>Scalping</b>: seconds to minutes, tiny targets, needs very tight spreads.</li><li><b>Momentum trading</b>: ride strong moves driven by news and heavy volume.</li><li>Most day traders lose money. It demands strict risk limits and lots of practice — which is exactly what this simulator is for.</li></ul>`, { w: 'html', html: `<div class="daybar"><span style="flex:1" class="ph-open">Open<br><small>9:30</small></span><span style="flex:2" class="ph-morning">Morning<br><small>10:00</small></span><span style="flex:3" class="ph-midday">Midday lull<br><small>11:30</small></span><span style="flex:2" class="ph-afternoon">Afternoon<br><small>14:00</small></span><span style="flex:1" class="ph-close">Close<br><small>15:30</small></span></div>` }),
      ex('sort', { prompt: 'Match each trade to its style.', buckets: ['Scalp', 'Momentum', 'Swing'], items: [{ t: 'Buy at 10:02, sell at 10:04 for +$0.08/share', b: 0, why: 'Minutes and cents = scalping.' }, { t: 'Buy a stock gapping up 12% on earnings, ride it for 2 hours', b: 1, why: 'News + volume + trend = momentum.' }, { t: 'Buy a pullback on the daily chart, hold 8 days', b: 2, why: 'Multi-day holding = swing trading.' }, { t: 'Short a breaking-news drop on huge volume until lunchtime', b: 1, why: 'Riding a strong move intraday.' }] }),
      quiz(q('What is the defining rule of day trading?', ['Positions are closed before the market closes', 'You only buy, never sell', 'You must use leverage', 'You hold for at least a week'], 0, 'No overnight positions.'), q('Why do scalpers need very liquid markets?', ['Tiny targets mean spreads and fees eat profits otherwise', 'Liquid markets always go up', 'Regulations require it', 'They do not'], 0, 'A $0.05 spread can be the entire profit of a scalp.')),
      scen({ intro: 'You have one hour to trade before work. The market is in its midday lull.', data: R.daySession(56, 'trend'), overlays: { vwap: true }, fitBars: 200, stages: [{ reveal: 200, q: 'Price has been flat for 90 minutes on low volume. What is the smart choice?', options: [opt('Sit out or trade tiny — low volume midday ranges chop people up', 3, 'The best day traders are selective about WHEN they trade.'), opt('Trade every small wiggle to make the hour count', 0, 'That is overtrading in the worst conditions of the day.'), opt('Use more leverage to make small moves worthwhile', 0, 'Leverage in chop magnifies random losses.')] }], outro: 'The afternoon brought renewed volume and direction. Patience beat forcing trades.' }),
    ],
  });

  L.push({
    id: '5-2',
    level: 5,
    title: 'Opening Volatility & Breakouts',
    topics: ['Opening market volatility', 'Breakout trading'],
    steps: [
      learn('The first 30 minutes', `<ul class="bul"><li>The open has the <b>most volume and volatility</b> of the day: overnight news gets priced in fast.</li><li>The <b>opening range</b> = high and low of the first 15–30 minutes.</li><li><b>Opening Range Breakout (ORB)</b>: buy a break above the range high (or short below the low) with volume; stop back inside the range.</li><li>Many beginners avoid the first 5 minutes entirely — spreads are wide and moves are erratic.</li></ul>`, { w: 'chart', data: R.daySession(30, 'trend'), slice: [0, 90], overlays: { vwap: true }, zones: [{ p1: 49.6, p2: 50.8, color: 'rgba(77,141,255,.10)', label: 'Opening range (first 15 min)', i1: 0, i2: 14 }] }),
      ex('level', { data: R.daySession(30, 'trend'), slice: [0, 40], prompt: 'Mark the <b>opening range HIGH</b> — the top of the first 15 minutes of trading.', levels: (d) => [{ price: Math.max(...d.slice(0, 15).map((c) => c.h)), tol: 0.18, label: 'OR High', color: '#4d8dff' }], explain: 'That level is the line in the sand: a break above it with volume is the ORB long trigger, with a stop back inside the range.', hint: 'Look only at the first 15 candles on the left. Click at the height of the highest wick.' }),
      quiz(q('Why is the first 5 minutes risky for beginners?', ['Volatility and spreads are extreme; moves are erratic', 'The market is closed', 'Volume is zero', 'Prices cannot change'], 0, 'Let the opening range form first.'), q('In an opening range breakout long, where does the stop typically go?', ['Back inside the range (e.g. mid-range or range low)', 'Far above the entry', 'There is no stop', 'At yesterday’s high'], 0, 'If price falls back into the range, the breakout failed.')),
      scen({ intro: 'A stock gapped up 2% on good news. The opening range is set.', data: R.daySession(57, 'trend'), overlays: { vwap: true }, fitBars: 80, stages: [{ reveal: 16, lines: [{ price: 50.8, color: '#4d8dff', label: 'OR high' }], q: 'The range high is ~$50.80. Price is pressing against it with rising volume. Plan?', options: [opt('Buy a confirmed break above the OR high, stop back inside the range', 3, 'A defined trigger and a defined exit.'), opt('Buy now inside the range, no stop', 0, 'No trigger, no exit plan.'), opt('Short the range high because it is "too high"', 1, 'Fighting a gap-up with volume needs a strong reason.')] }], outro: 'Price broke the opening range and trended above VWAP for much of the day.' }),
    ],
  });

  L.push({
    id: '5-3',
    level: 5,
    title: 'VWAP Strategies',
    topics: ['VWAP strategies'],
    steps: [
      learn('Three VWAP playbooks', `<div class="cards4"><div><b>VWAP pullback</b><p>Trend day above VWAP → buy the dip to VWAP, stop just below.</p></div><div><b>VWAP reclaim</b><p>Price falls below VWAP then closes back above with volume → buyers retaking control.</p></div><div><b>VWAP rejection</b><p>Downtrend day → price rallies to VWAP and fails → short, stop above.</p></div><div><b>⚠️ Warning</b><p>In choppy days price crosses VWAP constantly. If it has crossed 5+ times, VWAP is not working today.</p></div></div>`),
      ex('clickCandle', {
        data: R.daySession(30, 'trend'),
        slice: [0, 120],
        overlays: { vwap: true },
        prompt: 'Price trended up, then pulled back toward VWAP. Click the <b>low of the pullback</b> where buyers stepped back in.',
        target: (d) => {
          let b = 30;
          for (let i = 30; i < 62; i++) if (d[i].l < d[b].l) b = i;
          return [b];
        },
        tol: 2,
        hint: 'Look between roughly 10:00 and 10:30 (the middle of the chart) for the lowest dip after the first rally.',
        explain: 'The pullback found buyers near VWAP and the trend resumed — the classic VWAP pullback long.',
      }),
      quiz(q('On a trend-up day, VWAP often acts as…', ['Support', 'Resistance', 'The bid', 'Nothing'], 0, 'Buyers defend the day’s average price.'), q('Price has crossed VWAP 7 times by noon. What does that tell you?', ['It is a choppy day — VWAP strategies are unreliable today', 'VWAP is very strong today', 'Buy every cross', 'Short every cross'], 0, 'Repeated crossing = no control by either side.')),
      scen({ intro: 'A downtrend day. Price is below VWAP.', data: R.daySession(58, 'trend'), overlays: { vwap: true }, fitBars: 150, stages: [{ reveal: 100, q: 'If price had been below VWAP all day and rallied up to touch it, what would be the playbook?', options: [opt('Watch for a rejection at VWAP to short, stop above', 3, 'On a down day VWAP is resistance — the mirror image of the long setup.'), opt('Buy because it touched VWAP', 1, 'That is the long playbook — it only applies on up days.'), opt('Ignore VWAP completely', 1, 'VWAP is one of the most watched intraday levels.')] }], outro: 'Each VWAP playbook depends on the day’s direction. Identify the type of day first.' }),
    ],
  });

  L.push({
    id: '5-4',
    level: 5,
    title: 'Entries, Exits & Managing the Day',
    topics: ['Entry and exit points', 'Managing trades throughout the day'],
    steps: [
      learn('Managing a live trade', `<ul class="bul"><li><b>Entry</b>: have a trigger (break of a level, reclaim of VWAP, pullback bounce) — not a feeling.</li><li><b>Scale out</b>: take partial profits at 1R–2R, let the rest run.</li><li><b>Trail the stop</b>: move it to breakeven after 1R, then below new higher lows.</li><li><b>Time stop</b>: if nothing happens for 30 minutes, the idea is probably wrong.</li><li><b>Be flat by the close.</b></li></ul>`),
      ex('decisions', {
        steps: [
          { s: 'Your long is +1R. Price is approaching resistance.', o: [{ t: 'Take partial profit and move the stop to breakeven', good: true, fb: 'Locks in a win while keeping upside.' }, { t: 'Add to the position at resistance', good: false, fb: 'Adding at resistance increases risk at the worst location.' }] },
          { s: 'Price chopped sideways for 45 minutes after your breakout entry.', o: [{ t: 'Exit or tighten — the breakout did not follow through', good: true, fb: 'A time stop frees capital and attention.' }, { t: 'Hold and hope it eventually works', good: false, fb: 'Good breakouts usually work quickly.' }] },
          { s: 'It is 15:55 and you are in a small winner.', o: [{ t: 'Close it — day traders are flat at the close', good: true, fb: 'Overnight gaps are not part of a day-trading plan.' }, { t: 'Hold overnight; it might gap up', good: false, fb: 'That turns a day trade into an unplanned swing trade.' }] },
        ],
      }),
      quiz(q('Moving your stop to breakeven after +1R does what?', ['Turns the trade into a "free" trade: worst case ≈ zero', 'Doubles your profit', 'Increases risk', 'Closes the trade'], 0, 'You can no longer lose (barring gaps/slippage).'), q('A "time stop" means…', ['Exiting a trade that is not working within a planned time', 'Trading only at certain times', 'Stopping a clock', 'A stop that never triggers'], 0, 'Time is also a measure of whether a setup is working.')),
      scen({ intro: 'Your breakout long is working.', data: R.daySession(59, 'trend'), overlays: { vwap: true, ema9: true }, fitBars: 140, stages: [{ reveal: 75, q: 'You are +1.5R. Price is consolidating above EMA 9. How do you manage it?', options: [opt('Trail the stop below the consolidation low and keep the target', 3, 'Protects profit while giving the trend room.'), opt('Exit everything instantly', 2, 'Locks in profit, but cuts a winner short.'), opt('Remove the stop to avoid getting shaken out', 0, 'Never remove protection from a live trade.')] }], outro: 'Managing a winner is as important as finding the entry.' }),
    ],
  });

  /* ============================== LEVEL 6 ============================== */
  const daily = (spec) => Object.assign({ step: 86400 }, spec);
  L.push({
    id: '6-1',
    level: 6,
    title: 'Swing Trading Basics',
    topics: ['What swing trading is', 'Holding positions overnight', 'Multi-day trends'],
    steps: [
      learn('Catch the swing, not the noise', `<ul class="bul"><li><b>Swing trading</b>: hold for days to weeks to capture one "swing" of a bigger trend.</li><li>Use <b>daily and 4-hour charts</b>. Ignore 1-minute noise.</li><li>Positions are held <b>overnight</b>, so news can cause <b>gaps</b> — size accordingly.</li><li>Less screen time than day trading; more patience required.</li></ul>`, { w: 'chart', data: daily(R.uptrend(60)), overlays: { ema20: true }, caption: 'A multi-day uptrend on a daily chart. Each swing lasted several days.' }),
      ex('chartChoice', { data: daily(R.uptrend(61)), overlays: { ema20: true }, prompt: 'You are a swing trader. On this DAILY chart, which approach fits?', options: ['Buy pullbacks toward the EMA 20 and hold for the next swing up', 'Scalp every 1-minute candle', 'Short every green day', 'Wait for RSI to hit exactly 50'], answer: 0, explain: 'Swing traders align with the daily trend and enter on pullbacks, holding for days.' }),
      quiz(q('A swing trader’s typical holding period is…', ['Days to weeks', 'Seconds', 'Exactly one day', 'Decades'], 0, 'Longer than a day trade, shorter than an investment.'), q('What risk does a swing trader take that a day trader avoids?', ['Overnight gap risk', 'Spread risk', 'Any price risk', 'None'], 0, 'News can move price while the market is closed.')),
      scen({ intro: 'You are holding a swing trade. Today is a red day.', data: daily(R.uptrend(62)), overlays: { ema20: true }, stages: [{ reveal: 40, q: 'Price dropped 1.5% today but is still above your stop and the EMA 20. What do you do?', options: [opt('Nothing — the plan is still valid', 3, 'Swing trades need room. Reacting to every red day is emotional trading.'), opt('Sell — a red day means the trend is over', 1, 'One red day is normal noise in a multi-day trend.'), opt('Widen your stop just in case', 0, 'Never widen a stop.')] }], outro: 'The trend continued. Patience is the swing trader’s edge.' }),
    ],
  });

  L.push({
    id: '6-2',
    level: 6,
    title: 'Pullback Entries & Trend Continuation',
    topics: ['Support and resistance', 'Pullback entries', 'Trend continuation'],
    steps: [
      learn('Buying the dip — properly', `<ul class="bul"><li>Only buy pullbacks in an <b>established uptrend</b> (higher highs, higher lows, rising EMAs).</li><li>Look for the pullback to reach <b>support</b>: the EMA 20, a prior breakout level, or a rising trendline.</li><li>Wait for a <b>sign of buyers</b>: a hammer, a bullish engulfing candle, a close back above the EMA.</li><li>Stop below the pullback low. Target the prior high or beyond.</li></ul><p class="warn">⚠️ "Buy the dip" in a downtrend is catching a falling knife.</p>`, { w: 'chart', data: daily(R.uptrend(63)), overlays: { ema20: true, ema50: true }, toggles: ['ema20', 'ema50', 'rsi'] }),
      ex('clickCandle', {
        data: daily(R.uptrend(64)),
        overlays: { ema20: true },
        prompt: 'In this daily uptrend, click the <b>low of a pullback</b> — a spot where a swing trader would look to buy.',
        target: (d) => TM.Ind.pivots(d, 2).lows.filter((i) => i > 8),
        tol: 1,
        hint: 'Find a dip that ended before price made a new high. Click its lowest candle.',
        explain: 'Pullback lows in an uptrend are where buyers return. Entering there gives a tight stop (just below the low) and a target at the prior high.',
      }),
      quiz(q('Which is the best place to look for a pullback entry in an uptrend?', ['Near the rising EMA 20 or a prior breakout level', 'At the highest high', 'After a lower low', 'Anywhere'], 0, 'Support zones inside the trend.'), q('A stock is making lower highs and lower lows. Should you "buy the dip"?', ['No — that is a downtrend; dips keep getting lower', 'Yes, always buy dips', 'Only with leverage', 'Only on Mondays'], 0, 'Pullback buying is for uptrends.')),
      scen({ intro: 'Trend continuation setup.', data: daily(R.uptrend(65)), overlays: { ema20: true }, stages: [{ reveal: 37, q: 'Price pulled back for 4 days to the rising EMA 20 and printed a hammer. Plan?', options: [opt('Buy above the hammer high, stop below its low, target the prior high', 3, 'Trend + support + buyer signal + defined risk.'), opt('Buy at the prior high instead', 1, 'Worse price, worse reward:risk.'), opt('Short because it is falling', 0, 'You would be fighting the trend at support.')] }], outro: 'The pullback ended and the trend made a new high.' }),
    ],
  });

  L.push({
    id: '6-3',
    level: 6,
    title: 'Stop Placement',
    topics: ['Stop placement'],
    steps: [
      learn('Stops that make sense', `<ul class="bul"><li>Put stops where the <b>idea is wrong</b>: below the swing low (long) or above the swing high (short).</li><li>Add a buffer so normal noise does not hit you. <b>ATR</b> (Average True Range) measures normal noise.</li><li>Common rule: stop = swing low − 0.5 to 1 × ATR.</li><li>Avoid obvious round numbers — everyone’s stops sit there (see Lesson 7.2).</li><li>Then size the position to the stop (Lesson 4.2).</li></ul>`),
      ex('stops', {
        data: daily(R.uptrend(66)),
        overlays: { ema20: true },
        prompt: 'You are buying at the current price after a pullback. Place a stop <b>below the last swing low</b> (but within ~2 ATR of it) and a target of at least <b>1.5:1</b>.',
        check: ({ entry, stop, target, d, rr }) => {
          const lows = TM.Ind.pivots(d, 2).lows;
          const lastLow = lows.length ? d[lows[lows.length - 1]].l : Math.min(...d.slice(-12).map((c) => c.l));
          const atr = TM.Ind.atr(d)[d.length - 1];
          if (stop >= lastLow) return `Your stop is above the last swing low (${lastLow.toFixed(2)}). A normal retest would stop you out — place it below.`;
          if (stop < lastLow - 2 * atr) return `That stop is more than 2 ATR (${(2 * atr).toFixed(2)}) below the swing low. Too wide — the position would be tiny. Tighten it.`;
          if (!(rr >= 1.5)) return `Reward:risk is ${rr ? rr.toFixed(2) : '—'}:1. Raise the target.`;
          return true;
        },
        explain: 'Stop below structure with a volatility buffer, target giving positive reward:risk. Now the position size follows from that stop.',
      }),
      quiz(q('What does ATR measure?', ['How much price typically moves per candle', 'The trend direction', 'Volume', 'Market cap'], 0, 'Average True Range = typical movement.'), q('Why avoid stops exactly at obvious round numbers like $100.00?', ['Many stops cluster there and get "hunted"', 'Round numbers are illegal', 'Brokers reject them', 'They are always too wide'], 0, 'Place them a little beyond.')),
      scen({ intro: 'Choosing between stops.', data: daily(R.uptrend(67)), stages: [{ reveal: 40, q: 'Swing low is $108.60 and ATR is about $1.20. Which stop is most sensible for a long?', options: [opt('~$107.80 (below the low with a small ATR buffer)', 3, 'Beyond structure, outside normal noise.'), opt('$108.65 (right on the low)', 1, 'Any tiny undercut stops you out.'), opt('$95.00 (way below)', 1, 'So wide the position must be tiny and the R:R collapses.')] }], outro: 'Smart stops sit beyond the level that defines your trade, with room for normal noise.' }),
    ],
  });

  L.push({
    id: '6-4',
    level: 6,
    title: 'Earnings & News Risk',
    topics: ['Earnings and news risks'],
    steps: [
      learn('Gaps jump over stops', `<ul class="bul"><li>Companies report <b>earnings</b> every quarter. Prices can <b>gap</b> 5–20% overnight.</li><li>A stop-loss becomes a market order once triggered — in a gap it fills at the open, possibly far below your stop.</li><li>Options: exit before earnings, reduce size, or accept the gamble knowingly.</li><li>Macro news (inflation data, interest-rate decisions) moves the whole market.</li></ul>`, { w: 'chart', data: daily(R.newsShock(25)), caption: 'One news event erased a month of gains in a single candle.' }),
      ex('numeric', { given: 'You hold <b>100 shares</b> bought at <b>$50</b> with a stop at <b>$48</b> (planned loss $200). Earnings disappoint and the stock <b>opens at $44</b>.', prompt: 'What is your actual loss when the stop fills at the open?', prefix: '$', answer: 600, tol: 0, hint: 'The stop fills at the opening price, not at $48.', explain: '($50 − $44) × 100 = $600 — three times your planned risk. That is gap risk.' }),
      quiz(q('Why can a stop-loss fail to protect you overnight?', ['Price can gap past it and fill at the open', 'Stops are cancelled at night', 'Stops only work on Mondays', 'It always protects you'], 0, 'Stops are not guarantees in gaps.'), q('Earnings are tomorrow and you hold a large swing position. A cautious choice is…', ['Reduce size or exit before the report', 'Double the position', 'Add leverage', 'Remove the stop'], 0, 'Limit the damage of a coin flip.')),
      scen({ intro: 'This is <b>Scenario D — News shock</b> in miniature.', data: daily(R.newsShock(68)), stages: [{ reveal: 30, q: 'You are long a strong uptrend. A major economic report is due tomorrow morning. What do you do?', options: [opt('Reduce size so a big gap is survivable', 3, 'You keep exposure to the trend but cap the event risk.'), opt('Add more — the trend is strong', 0, 'Trend strength does not protect against a news gap.'), opt('Hold full size; my stop will save me', 1, 'Stops can be gapped through.')] }], outro: 'The report caused a sharp drop. Smaller size made it a manageable loss rather than a disaster.' }),
    ],
  });

  /* ============================== LEVEL 7 ============================== */
  L.push({
    id: '7-1',
    level: 7,
    title: 'Market Psychology & Liquidity',
    topics: ['Market psychology', 'Liquidity'],
    steps: [
      learn('Crowds, fear and greed', `<ul class="bul"><li>Prices reflect <b>collective emotion</b>: greed near tops, fear near bottoms.</li><li>When "everyone" is bullish, who is left to buy?</li><li><b>Liquidity</b> = how easily you can trade without moving price. Big players need it to fill large orders.</li><li>Liquidity pools sit where many orders rest: above highs (buy stops), below lows (sell stops), at round numbers.</li></ul>`, { w: 'html', html: `<div class="emo"><span>Optimism</span><span>Excitement</span><span>Thrill</span><span class="peak">Euphoria 🚨</span><span>Anxiety</span><span>Denial</span><span>Fear</span><span class="low">Capitulation</span><span>Depression</span><span>Hope</span></div><p class="muted small">The cycle of market emotions. The most risk is felt at the bottom, but the most risk actually exists at the top.</p>` }),
      ex('sort', { prompt: 'Where do you expect lots of resting orders (liquidity)?', buckets: ['Lots of liquidity', 'Little liquidity'], items: [{ t: 'Just below an obvious double bottom', b: 0, why: 'Long traders’ stop-losses cluster there.' }, { t: 'Just above a well-known resistance level', b: 0, why: 'Breakout buy orders and short stop-losses sit there.' }, { t: 'A random price in the middle of nowhere', b: 1, why: 'Nothing special attracts orders there.' }, { t: 'At the round number $100.00', b: 0, why: 'Round numbers attract orders.' }] }),
      quiz(q('When is risk usually HIGHEST, even if it feels safest?', ['Near euphoric tops', 'During capitulation', 'In quiet ranges', 'At the open'], 0, 'Euphoria feels safe; it is not.'), q('Why do large traders care about liquidity?', ['They need many orders on the other side to fill big positions', 'They do not', 'Liquidity sets the trend', 'It reduces their taxes'], 0, 'Big orders need big counterparties.')),
      scen({ intro: 'Everyone online says this stock "cannot go down".', data: R.doubleTop(69), stages: [{ reveal: 26, q: 'Price is retesting its high on lower volume while sentiment is euphoric. What is the disciplined view?', options: [opt('Be cautious — euphoria and weakening volume can mark tops', 3, 'Crowd extremes are warning signs, not entry signals.'), opt('Buy more because everyone agrees', 0, 'When everyone has bought, there are few buyers left.'), opt('Short with no stop because tops always fail', 1, 'Fading euphoria without a stop is just a different gamble.')] }], outro: 'The second peak failed and a double top followed.' }),
    ],
  });

  L.push({
    id: '7-2',
    level: 7,
    title: 'Fake Breakouts & Stop Hunts',
    topics: ['Fake breakouts', 'Stop hunts'],
    steps: [
      learn('Traps', `<ul class="bul"><li><b>Fake breakout</b>: price breaks a level, attracts buyers, then reverses back inside. Breakout buyers are trapped and their stops fuel the drop.</li><li><b>Warning signs</b>: weak volume, long upper wick, close back inside the range, breakout in the midday lull.</li><li><b>Stop hunt</b>: a fast spike through an obvious level (where stops cluster), then a sharp reversal.</li><li>Defence: wait for a <b>close</b> beyond the level, demand volume, and place stops a bit beyond the obvious spot.</li></ul>`, { w: 'chart', data: R.fakeout(17), lines: [{ price: 50, color: '#f0465a', label: 'Resistance' }] }),
      ex('clickCandle', { data: R.stopHunt(26), prompt: 'Click the <b>stop-hunt candle</b> — the spike below support that immediately reversed.', target: (d) => [argmax(d, (c) => -c.l)], tol: 0, lines: [{ price: 98.6, color: '#16c784', label: 'Support' }], hint: 'Look for the candle with an unusually long lower wick that pokes below the green line.', explain: 'The wick swept the stops below the obvious double bottom, then buyers took over. Traders with stops right at support were shaken out just before the rally.' }),
      quiz(q('Which is a warning sign of a fake breakout?', ['Weak volume and a close back inside the range', 'A strong close above with 3× volume', 'A retest that holds', 'Rising EMAs'], 0, 'Watch volume and the close.'), q('Where is a smarter place for a stop than "exactly at support"?', ['Slightly beyond support, outside the obvious cluster', 'Exactly at support', 'Above the entry', 'No stop'], 0, 'Give it room beyond the herd.')),
      scen({ intro: 'This is <b>Scenario B — Fake breakout</b> in miniature.', data: R.fakeout(70), stages: [{ reveal: 41, lines: [{ price: 50, color: '#f0465a', label: 'Resistance' }], q: 'Price broke $50, but volume is ordinary and the candle has a long upper wick. Your move?', options: [opt('Wait for confirmation (a strong close + volume) — or a failure', 3, 'Patience avoids the trap.'), opt('Buy big — breakouts always work', 0, 'This is how trapped buyers are created.'), opt('Buy with a stop far below the range', 1, 'Huge risk on a low-quality signal.')] }], outro: 'It was a fake breakout. Price fell back into the range and kept falling as trapped buyers sold.' }),
    ],
  });

  L.push({
    id: '7-3',
    level: 7,
    title: 'Market Structure & Volatility',
    topics: ['Market structure', 'Risk management during volatility'],
    steps: [
      learn('Structure tells you the trend', `<ul class="bul"><li><b>Market structure</b> = the sequence of swing highs and lows.</li><li><b>Break of structure (BOS)</b>: in an uptrend, a close below the last higher low. That is often the first real sign of a reversal.</li><li>Sequence of a reversal: lower high (warning) → break of the last higher low (confirmation) → retest from below (entry for shorts).</li><li><b>Volatility</b>: when markets get wild, cut position size and widen stops so your dollar risk stays the same.</li></ul>`, { w: 'chart', data: R.reversal(19), lines: [{ price: 106.5, color: '#f2b84b', label: 'Last higher low' }] }),
      ex('clickCandle', {
        data: R.reversal(71),
        prompt: 'Click the candle that <b>breaks structure</b>: the first close BELOW the last higher low (the dip that formed around the middle of the chart).',
        target: (d) => {
          let hl = Infinity;
          for (let i = 21; i <= 27; i++) hl = Math.min(hl, d[i].l);
          for (let i = 28; i < d.length; i++) if (d[i].c < hl) return [i];
          return [46];
        },
        tol: 1,
        hint: 'First find the last higher low (after the highest peak). Then follow price to the right until a candle CLOSES below it.',
        explain: 'Structure broke: the uptrend’s last higher low failed. Longs should be out or tightened; shorts can look for a retest from below.',
      }),
      quiz(q('Volatility doubles. To keep the same dollar risk, you should…', ['Halve the position size (with a wider stop)', 'Double the size', 'Remove stops', 'Use more leverage'], 0, 'Wider stop × smaller size = same risk.'), q('In an uptrend, which event is the clearest sign of a possible reversal?', ['A close below the last higher low', 'One red candle', 'RSI at 60', 'A green day'], 0, 'That breaks the HH/HL sequence.')),
      scen({ intro: 'This is <b>Scenario E — Trend reversal</b> in miniature.', data: R.reversal(72), stages: [{ reveal: 38, q: 'Price failed to make a new high (a lower high) and is falling toward the last higher low. You are long. Plan?', options: [opt('Tighten your stop just below the higher low; exit if it breaks', 3, 'Respecting structure protects profits.'), opt('Add more to average down', 0, 'Adding to a weakening trade increases risk.'), opt('Remove the stop and wait', 0, 'Never remove protection.')] }], outro: 'Structure broke and the trend reversed. Traders who respected the break kept their profits.' }),
    ],
  });

  L.push({
    id: '7-4',
    level: 7,
    title: 'Trading Plans, Statistics & Your Strategy',
    topics: ['Trading plans', 'Trading statistics', 'Developing a personal strategy'],
    steps: [
      learn('Measure everything', `<ul class="bul"><li><b>Win rate</b> alone means nothing. 35% win rate with 3:1 R:R beats 70% with 1:3.</li><li><b>Expectancy</b> = (Win% × Avg win) − (Loss% × Avg loss). Positive = an edge.</li><li><b>Profit factor</b> = gross wins ÷ gross losses. Above 1.5 is solid.</li><li><b>Max drawdown</b> = worst peak-to-trough drop. Keep it small.</li><li>A strategy is only "yours" once you have tested it, written it down, and journaled 50+ trades.</li></ul>`),
      ex('numeric', { given: 'Your stats: win rate <b>40%</b>, average win <b>$300</b>, average loss <b>$100</b>.', prompt: 'What is your expectancy per trade?', prefix: '$', answer: 60, tol: 0, hint: '(0.40 × 300) − (0.60 × 100)', explain: '$120 − $60 = +$60 per trade. You lose more often than you win, yet you have a clear edge.' }),
      ex('plan', { prompt: 'Write your personal trading plan. It will be saved and shown in your journal. You can edit it any time by revisiting this lesson.' }),
      quiz(q('Trader A: 70% win rate, avg win $50, avg loss $200. Trader B: 35% win rate, avg win $300, avg loss $100. Who has the edge?', ['Trader B (+$40 vs −$25 per trade)', 'Trader A — higher win rate', 'Both equal', 'Neither'], 0, 'A: 0.7×50 − 0.3×200 = −$25. B: 0.35×300 − 0.65×100 = +$40.'), q('Profit factor of 0.8 means…', ['You lose $1 for every $0.80 you make — unprofitable', 'You are very profitable', 'You win 80% of trades', 'Nothing'], 0, 'Below 1.0 loses money.')),
      scen({ intro: 'Developing a strategy.', data: daily(R.uptrend(73)), overlays: { ema20: true }, stages: [{ reveal: 44, q: 'Your plan says: "Buy pullbacks to EMA 20 in uptrends, 1% risk, 2:1 target." Today’s setup meets every rule except volume is unusually low. What do you do?', options: [opt('Follow your written rules — and note the low volume in your journal to evaluate later', 3, 'Consistency lets your statistics mean something. Notes let you refine the rules.'), opt('Double the size because it looks perfect', 0, 'Breaking the risk rule destroys your statistics.'), opt('Invent a new rule on the spot', 1, 'Changes should come from journal reviews, not mid-trade impulses.')] }], outro: 'A plan you follow consistently creates data. Data shows you what really works.' }),
    ],
  });

  /* ============================== CRYPTO TRACK ============================== */
  L.push({
    id: 'C-1',
    level: 'C',
    title: 'Crypto Exchanges, Pairs & Liquidity',
    topics: ['Crypto exchanges', 'Trading pairs', 'Market capitalization', 'Liquidity'],
    steps: [
      learn('How crypto trades', `<ul class="bul"><li><b>Centralised exchanges</b> (CEX) work like a broker with an order book. <b>Decentralised exchanges</b> (DEX) use smart contracts.</li><li>Crypto trades in <b>pairs</b>: BTC/USD means "how many dollars for 1 bitcoin". ETH/BTC prices ETH in bitcoin.</li><li>Market cap = price × circulating supply. A coin at $0.16 can still be worth billions.</li><li>Big coins (BTC, ETH) have deep <b>liquidity</b> and tight spreads. Tiny coins can be impossible to sell in a panic.</li></ul>`, { w: 'html', html: `<div class="pair"><div><b>BTC</b><small>base</small></div><div class="slash">/</div><div><b>USD</b><small>quote</small></div><div class="eq">= 68,250</div></div><p class="muted small center">"1 BTC costs 68,250 USD" (simulated)</p>` }),
      ex('numeric', { given: 'BTC/USD = <b>$68,000</b> (simulated).', prompt: 'How much BTC does <b>$1,700</b> buy?', unit: 'BTC', answer: 0.025, tol: 0.0005, hint: 'Divide dollars by the price of one bitcoin.', explain: '$1,700 ÷ $68,000 = 0.025 BTC. You can buy fractions of a coin.' }),
      quiz(q('DOGE is $0.16 and BTC is $68,000. Which statement is true?', ['Price alone does not tell you which is "cheaper" — compare market cap', 'DOGE is cheaper so it has more upside', 'BTC is overpriced', 'DOGE has a bigger market cap'], 0, 'Supply matters: market cap = price × supply.'), q('Why is liquidity important in crypto?', ['Low liquidity means wide spreads and big slippage, especially in panics', 'It is not important', 'It sets the price', 'It guarantees profits'], 0, 'You need someone to sell to.')),
      scen({ intro: 'A brand-new micro-cap coin is up 300% this week. Spread is 4%.', data: R.bullFlag(74), stages: [{ reveal: 17, q: 'What is the biggest risk for a beginner here?', options: [opt('Illiquidity: you may not be able to sell near the price you see', 3, 'Thin order books plus hype = exits that slip badly.'), opt('There is no risk after a 300% rally', 0, 'The risk is greater after a parabolic rally.'), opt('The spread is too small', 0, 'A 4% spread is huge.')] }], outro: 'Stick to liquid assets while learning. Hype coins can lose 80% faster than you can click sell.' }),
    ],
  });

  L.push({
    id: 'C-2',
    level: 'C',
    title: 'Volatility, Cycles, Dominance & Altcoins',
    topics: ['Volatility', 'Crypto market cycles', 'Bitcoin dominance', 'Altcoins'],
    steps: [
      learn('Crypto moves in waves', `<ul class="bul"><li>Crypto is <b>far more volatile</b> than stocks: 10% days happen. Size positions smaller.</li><li>Historically crypto moved in long <b>cycles</b>: accumulation → markup → euphoria → markdown ("crypto winter").</li><li><b>Bitcoin dominance</b> = BTC’s share of total crypto market cap. Rising dominance often means money is hiding in BTC; falling dominance can mean traders are chasing riskier <b>altcoins</b>.</li><li>Altcoins usually follow BTC — with bigger moves both ways.</li></ul>`),
      ex('sort', { prompt: 'Match each description to a cycle phase.', buckets: ['Accumulation', 'Markup', 'Euphoria', 'Markdown'], items: [{ t: 'Prices flat and boring after a crash; few people care', b: 0, why: 'Quiet buying while sentiment is bad.' }, { t: 'Steady higher highs, growing interest', b: 1, why: 'The trend phase.' }, { t: 'Everyone is talking about it; meme coins up 1000%', b: 2, why: 'Peak greed.' }, { t: 'Lower lows, "it is going to zero" headlines', b: 3, why: 'The decline phase.' }] }),
      quiz(q('Bitcoin dominance is falling while altcoins rally hard. This often signals…', ['Traders are taking more risk (speculation rising)', 'Crypto is closing', 'BTC is about to be banned', 'Nothing'], 0, 'Money rotating into riskier coins.'), q('BTC drops 5%. What usually happens to a high-beta altcoin like DOGE?', ['It often drops even more', 'It always rises', 'It does not move', 'It drops exactly 5%'], 0, 'Alts amplify BTC’s moves.')),
      scen({ intro: 'Crypto volatility.', data: R.stopHunt(75), stages: [{ reveal: 40, q: 'You normally risk 1% on stock trades. This coin moves 3× more than your usual stock. How do you adjust?', options: [opt('Same 1% risk, but a wider stop and a smaller position', 3, 'Dollar risk stays fixed; size adapts to volatility.'), opt('Risk 3% because the moves are bigger', 0, 'Bigger moves call for smaller size, not bigger risk.'), opt('Use a tight stock-sized stop', 1, 'Normal crypto noise would stop you out constantly.')] }], outro: 'Volatility-adjusted sizing keeps your risk constant across very different markets.' }),
    ],
  });

  L.push({
    id: 'C-3',
    level: 'C',
    title: 'Funding Rates, Leverage & Liquidation',
    topics: ['Funding rates', 'Leverage', 'Liquidation'],
    steps: [
      learn('Perpetual futures', `<ul class="bul"><li>Most crypto leverage uses <b>perpetual futures</b> ("perps") — contracts with no expiry.</li><li>Every 8 hours, longs and shorts pay each other a <b>funding rate</b> to keep the perp near the spot price.</li><li><b>Positive funding</b>: longs pay shorts — the market is crowded long. <b>Negative</b>: shorts pay longs.</li><li>Extreme funding often precedes <b>squeezes</b>: crowded traders get liquidated in a cascade.</li></ul>`),
      ex('numeric', { given: 'You hold a <b>$20,000</b> leveraged long. Funding is <b>+0.03%</b> every 8 hours (longs pay).', prompt: 'How much funding do you pay per day?', prefix: '$', answer: 18, tol: 0.01, hint: 'There are three 8-hour periods per day: 3 × 0.0003 × $20,000.', explain: '$6 × 3 = $18 per day, regardless of whether price moves. Funding is a hidden cost of holding leverage.' }),
      ex('leverage', { entry: 3500, move: 6, prompt: 'ETH (simulated) at $3,500. Your stop is <b>5% below entry</b>. Pick a leverage where liquidation is clearly <b>beyond your stop</b> (at least 8% away).', check: (L) => { const dist = L > 1 ? (1 / L - 0.005) * 100 : 100; if (dist < 8) return `Liquidation is only ${dist.toFixed(1)}% away — it would hit before or near your stop. Lower the leverage.`; return true; }, explain: 'Your stop, not the exchange, decides when you exit. That is how leverage should be used — if at all.' }),
      quiz(q('Funding is very positive and rising. What does it suggest?', ['Many traders are long with leverage — the long side is crowded', 'Shorts are crowded', 'The exchange is closing', 'Price must rise'], 0, 'Crowded trades are vulnerable to squeezes.'), q('What happens when you are liquidated?', ['The position is force-closed and you lose your margin', 'You get a warning and nothing happens', 'The exchange refunds you', 'You owe nothing and keep the position'], 0, 'Liquidation is final.')),
      scen({ intro: 'Funding is +0.09% per 8h (very high). Everyone is long with high leverage.', data: R.stopHunt(76), stages: [{ reveal: 42, q: 'You want to join the long. What is the risk-aware choice?', options: [opt('Skip or use very low leverage — crowded longs are squeeze fuel', 3, 'Long squeezes liquidate over-leveraged traders in cascades.'), opt('Go 50× long with the crowd', 0, 'A 2% wick liquidates you.'), opt('Go 20× long with a tight stop', 1, 'Liquidation would sit near your stop; slippage in a cascade could skip it.')] }], outro: 'A sharp wick swept the lows — a classic long squeeze — before price recovered. Low or no leverage survived it.' }),
    ],
  });

  const byId = {};
  L.forEach((l) => (byId[l.id] = l));
  TM.Lessons = {
    LEVELS,
    list: L,
    byId: (id) => byId[id],
    ofLevel: (lv) => L.filter((l) => l.level === lv),
    unlocked(l) {
      const s = TM.Store.s;
      if (s.settings.unlockAll) return true;
      const idx = LEVELS.findIndex((x) => x.id === l.level);
      if (l.level === 1) return true;
      if (l.level === 'C') return TM.Progress.levelDone(1);
      const prev = LEVELS[idx - 1];
      // a level unlocks when the previous level is complete
      return TM.Progress.levelDone(prev.id);
    },
    levelUnlocked(lv) {
      const first = L.find((l) => l.level === lv);
      return first ? TM.Lessons.unlocked(first) : false;
    },
    next() {
      return L.find((l) => !(TM.Store.s.lessons[l.id] && TM.Store.s.lessons[l.id].done) && TM.Lessons.unlocked(l)) || null;
    },
  };
})();

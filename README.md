# TRADE MASTERY

An interactive trading academy and market simulator. You start with **$10,000 of simulated money** and zero knowledge, then learn your way from *Market Beginner* to *Market Strategist*.

> Everything is simulated. No real money and no real orders. This is for education only and is not financial advice.

## Run it

- **Easiest:** open `dist/trade-mastery.html` in any browser. It's a single file with no install, and it also works offline (only the fonts need a connection).
- **From source:** serve the folder (for example `python3 -m http.server`) and open `index.html`.
- **Rebuild the single file:** `node tools/build.js`

Progress is saved automatically in the browser's localStorage. **Settings → Export / Import** moves a save to another device, and **Settings → Reset** resets the account or everything.

## What's inside

| Section | What you do |
|---|---|
| Trading Academy | 34 lessons across 7 levels plus a Crypto track. Each lesson has an explanation, a visual, a hands-on exercise, a quiz and a practical scenario. Levels unlock in order. |
| Practice Trading | Paper-trade 6 simulated stocks with market and limit orders, risk-%-based sizing, stop-loss and take-profit lines you can drag on the chart, 4 timeframes, 7 indicators and drawn levels. |
| Day Trading Sim | A full 9:30→16:00 session with open, morning, midday, afternoon and close phases, five hidden day types, an "identify the setup" game, auto-flatten at the close and an end-of-day report. |
| Swing Trading Sim | An 8-week campaign on daily charts with overnight gaps, earnings, market news, an earnings calendar and an "emotional exit" detector. |
| Crypto Trading | Simulated BTC, ETH, SOL, XRP and DOGE trading 24/7, with leverage up to 25×, liquidation, funding rates, BTC dominance, a Volatility Storm mode and optional real-price/real-chart reference panels (view only). |
| Market Scenarios | 9 multi-decision scenarios (breakout, fake breakout, oversold, news shock, reversal, risk sizing, stop hunt, long squeeze, earnings). |
| Portfolio & Stats | Equity, buying power, total/daily P&L, win rate, average win/loss, profit factor, drawdown, R:R, expectancy, charts and full history. |
| Challenges | 12 tiered challenges (Bronze → Diamond), including Level Hunt and Fakeout drills. |
| Achievements | 32 badges and an 8-rank ladder. |
| Trading Journal | A guided entry after every trade, plus recurring-mistake analysis, emotion vs results, results by strategy and your trading plan. |
| Knowledge Tests | 10-question tests per level that include chart identification. Answers are revealed only after you commit. There's also a knowledge map and a "mixed review" built from your weakest topics. |
| Coach Nova | An AI-style coach that explains terms, analyses your trades, gives hints, does sizing math and recommends lessons. It never predicts prices. |

Every closed trade gets a **process grade** (A–F) that's separate from its profit or loss. XP rewards discipline, so a good loss earns XP and a reckless win doesn't.

## Code layout

```
index.html            app shell
css/styles.css        design system
js/core/              util, store (persistence), market (simulation + indicators), chart (canvas),
                      trading (engine + trade review), progress (XP/ranks/achievements/challenges), coach
js/content/           lessons, scenarios, tests, glossary, chart recipes
js/views/             one file per section + shared widgets and trading terminal
tools/build.js        bundles everything into dist/
```

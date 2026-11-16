/* TRADE MASTERY — simulated market engine: path generation, indicators, live multi-asset feed.
   All prices are SIMULATED. Nothing here reflects real market prices. */
(function () {
  'use strict';
  const U = TM.U;

  /* =========================================================
     Scripted path generator (lessons, scenarios, day & swing sims)
     segment fields:
       n      bars in segment
       to     target price to reach by end of segment (directed leg)
       range  [lo, hi]  bounded chop with rejection wicks at the edges
       d      drift per bar (fraction) if no `to`/`range`
       v      volatility per bar (fraction)       default .006
       vm     volume multiplier                    default 1
       gap    overnight gap at segment start (fraction, e.g. .05)
       wick   {dir:-1|1, size:.02} spike wick on the final bar (stop hunt)
       vol    per-bar volatility multipliers array (optional, intraday U-shape)
       vmArr  per-bar volume multipliers array (optional)
     ========================================================= */
  function generate(o) {
    const r = U.rng(o.seed || 1);
    const tpb = o.tpb || 8;
    const step = o.step || 60;
    let t = o.t0 || 1767283200;
    let p = o.start || 100;
    const out = [];
    const baseVol = o.baseVol || 100000;
    let cluster = 1;
    const skip = o.skipTime; // fn(t) -> next valid t (e.g. skip nights/weekends)
    // expand "range" segments into alternating swings that really touch the floor and ceiling
    const segs = [];
    let pp = p;
    (o.segs || []).forEach((sg) => {
      if (sg.gap) pp *= 1 + sg.gap;
      if (!sg.range) {
        segs.push(sg);
        if (sg.to != null) pp = sg.to;
        return;
      }
      const [lo, hi] = sg.range;
      const span = hi - lo;
      const base = U.clamp(Math.round(sg.n / 6), 4, 30);
      let used = 0;
      let up = pp < (lo + hi) / 2;
      let first = true;
      while (used < sg.n) {
        let len = Math.max(2, Math.round(base * (0.65 + r() * 0.7)));
        if (sg.n - used - len < 3) len = sg.n - used;
        const tgt = up ? hi - span * (0.03 + r() * 0.12) : lo + span * (0.03 + r() * 0.12);
        const leg = Object.assign({}, sg, { n: len, to: tgt, range: null, bound: [lo, hi] });
        if (!first) delete leg.gap;
        if (sg.vol) leg.vol = sg.vol.slice(used, used + len);
        if (sg.vmArr) leg.vmArr = sg.vmArr.slice(used, used + len);
        if (sg.wick && used + len < sg.n) delete leg.wick;
        segs.push(leg);
        used += len;
        up = !up;
        first = false;
        pp = tgt;
      }
    });
    segs.forEach((sg) => {
      const n = sg.n || 10;
      const v = sg.v == null ? 0.006 : sg.v;
      const totalTicks = n * tpb;
      let tickIdx = 0;
      for (let b = 0; b < n; b++) {
        if (b === 0 && sg.gap) p *= 1 + sg.gap;
        const open = p;
        let hi = p,
          lo = p,
          absRet = 0;
        const ticks = o.keepTicks ? [p] : null;
        const vb = v * (sg.vol ? sg.vol[b] || 1 : 1);
        for (let k = 0; k < tpb; k++) {
          const z = U.gauss(r);
          cluster = U.clamp(cluster * 0.92 + 0.08 * (0.55 + Math.abs(z) * 0.6), 0.6, 2.2);
          const sig = (vb / Math.sqrt(tpb)) * cluster;
          let drift = 0;
          const rem = totalTicks - tickIdx;
          if (sg.to != null) drift = Math.log(sg.to / p) / Math.max(1, rem);
          else if (sg.range) {
            const mid = (sg.range[0] + sg.range[1]) / 2;
            drift = 0.012 * Math.log(mid / p);
          } else if (sg.d) drift = sg.d / tpb;
          const ret = drift + sig * z;
          absRet += Math.abs(ret);
          p *= Math.exp(ret);
          if (sg.bound) {
            const [a, bnd] = sg.bound;
            if (p > bnd) {
              hi = Math.max(hi, p);
              p = bnd - (p - bnd) * 0.8;
            }
            if (p < a) {
              lo = Math.min(lo, p);
              p = a + (a - p) * 0.8;
            }
          }
          hi = Math.max(hi, p);
          lo = Math.min(lo, p);
          if (ticks) ticks.push(p);
          tickIdx++;
        }
        if (sg.wick && b === n - 1) {
          const wp = p * (1 + sg.wick.dir * sg.wick.size);
          if (sg.wick.dir < 0) lo = Math.min(lo, wp);
          else hi = Math.max(hi, wp);
          if (ticks) ticks.splice(Math.floor(tpb / 2), 0, wp);
        }
        const vmb = (sg.vm || 1) * (sg.vmArr ? sg.vmArr[b] || 1 : 1);
        const volume = baseVol * vmb * (0.55 + (absRet / Math.max(1e-6, v)) * 0.35) * Math.exp(U.gauss(r) * 0.25);
        const c = { t, o: open, h: hi, l: lo, c: p, v: Math.round(volume) };
        if (ticks) c.ticks = ticks;
        out.push(c);
        t += step;
        if (skip) t = skip(t);
      }
    });
    return out;
  }

  /* =========================================================
     Indicators
     ========================================================= */
  const Ind = (TM.Ind = {
    sma(vals, n) {
      const out = new Array(vals.length).fill(null);
      let s = 0;
      for (let i = 0; i < vals.length; i++) {
        s += vals[i];
        if (i >= n) s -= vals[i - n];
        if (i >= n - 1) out[i] = s / n;
      }
      return out;
    },
    ema(vals, n) {
      const out = new Array(vals.length).fill(null);
      const k = 2 / (n + 1);
      let e = null;
      for (let i = 0; i < vals.length; i++) {
        if (i < n - 1) continue;
        if (e === null) {
          let s = 0;
          for (let j = i - n + 1; j <= i; j++) s += vals[j];
          e = s / n;
        } else e = vals[i] * k + e * (1 - k);
        out[i] = e;
      }
      return out;
    },
    rsi(closes, n = 14) {
      const out = new Array(closes.length).fill(null);
      let g = 0,
        l = 0;
      for (let i = 1; i < closes.length; i++) {
        const ch = closes[i] - closes[i - 1];
        const up = Math.max(0, ch),
          dn = Math.max(0, -ch);
        if (i <= n) {
          g += up;
          l += dn;
          if (i === n) {
            g /= n;
            l /= n;
            out[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l);
          }
        } else {
          g = (g * (n - 1) + up) / n;
          l = (l * (n - 1) + dn) / n;
          out[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l);
        }
      }
      return out;
    },
    macd(closes, f = 12, s = 26, sig = 9) {
      const ef = Ind.ema(closes, f),
        es = Ind.ema(closes, s);
      const m = closes.map((_, i) => (ef[i] != null && es[i] != null ? ef[i] - es[i] : null));
      const firstIdx = m.findIndex((x) => x != null);
      const sigLine = new Array(closes.length).fill(null);
      if (firstIdx >= 0) {
        const sub = Ind.ema(m.slice(firstIdx), sig);
        sub.forEach((v, i) => (sigLine[i + firstIdx] = v));
      }
      const hist = m.map((v, i) => (v != null && sigLine[i] != null ? v - sigLine[i] : null));
      return { macd: m, signal: sigLine, hist };
    },
    bb(closes, n = 20, k = 2) {
      const mid = Ind.sma(closes, n);
      const up = new Array(closes.length).fill(null),
        lo = new Array(closes.length).fill(null);
      for (let i = n - 1; i < closes.length; i++) {
        let s = 0;
        for (let j = i - n + 1; j <= i; j++) s += (closes[j] - mid[i]) ** 2;
        const sd = Math.sqrt(s / n);
        up[i] = mid[i] + k * sd;
        lo[i] = mid[i] - k * sd;
      }
      return { mid, up, lo };
    },
    vwap(candles, anchorFn) {
      const out = [];
      let pv = 0,
        vv = 0,
        lastDay = null;
      candles.forEach((c, i) => {
        const day = anchorFn ? anchorFn(c, i) : Math.floor(c.t / 86400);
        if (day !== lastDay) {
          pv = 0;
          vv = 0;
          lastDay = day;
        }
        const tp = (c.h + c.l + c.c) / 3;
        pv += tp * c.v;
        vv += c.v;
        out.push(vv ? pv / vv : c.c);
      });
      return out;
    },
    atr(candles, n = 14) {
      const out = new Array(candles.length).fill(null);
      let a = null;
      for (let i = 1; i < candles.length; i++) {
        const c = candles[i],
          p = candles[i - 1];
        const tr = Math.max(c.h - c.l, Math.abs(c.h - p.c), Math.abs(c.l - p.c));
        if (i < n) {
          a = (a || 0) + tr;
          if (i === n - 1) a = a / (n - 1);
        } else a = (a * (n - 1) + tr) / n;
        if (i >= n - 1) out[i] = a;
      }
      return out;
    },
    pivots(candles, k = 3) {
      const highs = [],
        lows = [];
      for (let i = k; i < candles.length - k; i++) {
        let isH = true,
          isL = true;
        for (let j = i - k; j <= i + k; j++) {
          if (j === i) continue;
          if (candles[j].h >= candles[i].h) isH = false;
          if (candles[j].l <= candles[i].l) isL = false;
        }
        if (isH) highs.push(i);
        if (isL) lows.push(i);
      }
      return { highs, lows };
    },
  });

  /* Market context snapshot used for trade reviews and coach hints */
  function context(candles, i) {
    i = i == null ? candles.length - 1 : i;
    const sub = candles.slice(Math.max(0, i - 200), i + 1);
    const cl = sub.map((c) => c.c);
    const last = sub[sub.length - 1];
    const e9 = Ind.ema(cl, 9),
      e20 = Ind.ema(cl, 20),
      e50 = Ind.ema(cl, 50);
    const rsi = Ind.rsi(cl, 14);
    const atr = Ind.atr(sub, 14);
    const L = sub.length - 1;
    const e20prev = e20[Math.max(0, L - 5)];
    const slope = e20[L] != null && e20prev != null ? (e20[L] - e20prev) / e20prev : 0;
    let trend = 'sideways';
    if (e20[L] != null) {
      if (last.c > e20[L] && slope > 0.0004) trend = 'up';
      else if (last.c < e20[L] && slope < -0.0004) trend = 'down';
    }
    const look = sub.slice(-30, -1);
    const avgV = look.reduce((s, c) => s + c.v, 0) / Math.max(1, look.length);
    return {
      price: last.c,
      ema9: e9[L],
      ema20: e20[L],
      ema50: e50[L],
      rsi: rsi[L],
      atr: atr[L] || last.h - last.l || last.c * 0.005,
      trend,
      slope,
      volRatio: avgV ? last.v / avgV : 1,
      recentHigh: Math.max(...look.map((c) => c.h), last.h),
      recentLow: Math.min(...look.map((c) => c.l), last.l),
    };
  }

  /* aggregate base candles into a higher timeframe */
  function aggregate(base, mins) {
    if (mins === 1) return base.slice();
    const out = [];
    const sec = mins * 60;
    base.forEach((c) => {
      const bucket = Math.floor(c.t / sec) * sec;
      const last = out[out.length - 1];
      if (!last || last.t !== bucket) out.push({ t: bucket, o: c.o, h: c.h, l: c.l, c: c.c, v: c.v });
      else {
        last.h = Math.max(last.h, c.h);
        last.l = Math.min(last.l, c.l);
        last.c = c.c;
        last.v += c.v;
      }
    });
    return out;
  }

  /* =========================================================
     Live multi-asset feed (Practice + Crypto)
     Deterministic from a seed + tick count so it survives refreshes:
     on load the engine replays the exact same ticks.
     ========================================================= */
  const ASSETS = [
    { sym: 'NVRX', name: 'Novarix Semiconductors', type: 'stock', sector: 'Technology', start: 182.4, vol: 0.0011, beta: 1.4, spread: 0.02, supply: 2.4e9, baseV: 42000, about: 'Designs AI chips. Fast-moving, high-beta tech stock.' },
    { sym: 'HLXH', name: 'Helix Health', type: 'stock', sector: 'Healthcare', start: 64.1, vol: 0.0007, beta: 0.7, spread: 0.02, supply: 1.1e9, baseV: 26000, about: 'Hospital & pharma group. Calmer, defensive stock.' },
    { sym: 'GRDN', name: 'Gridline Energy', type: 'stock', sector: 'Energy', start: 41.25, vol: 0.0009, beta: 0.9, spread: 0.01, supply: 3.2e9, baseV: 51000, about: 'Power utilities and oil. Moves with energy prices.' },
    { sym: 'BNCR', name: 'Bancroft Financial', type: 'stock', sector: 'Financials', start: 88.6, vol: 0.0007, beta: 1.0, spread: 0.02, supply: 1.6e9, baseV: 31000, about: 'Large bank. Sensitive to interest rates.' },
    { sym: 'CRMS', name: 'Crimson Retail', type: 'stock', sector: 'Consumer', start: 27.8, vol: 0.001, beta: 1.1, spread: 0.01, supply: 0.9e9, baseV: 60000, about: 'Fashion & e-commerce chain. Earnings-driven swings.' },
    { sym: 'SIMX', name: 'SimMarket 500 ETF', type: 'stock', sector: 'Index ETF', start: 512.3, vol: 0.00045, beta: 1.0, spread: 0.01, supply: 0.45e9, baseV: 80000, about: 'A basket of 500 simulated companies. Built-in diversification.' },
    { sym: 'BTC', name: 'Bitcoin', type: 'crypto', sector: 'Store of value', start: 68250, vol: 0.0009, beta: 1, spread: 0.0001, supply: 19.8e6, baseV: 34, about: 'The first and largest cryptocurrency. Leads the crypto market.', pair: 'BTC/USD' },
    { sym: 'ETH', name: 'Ethereum', type: 'crypto', sector: 'Smart contracts', start: 3520, vol: 0.0012, beta: 1.15, spread: 0.0001, supply: 120.3e6, baseV: 480, about: 'Platform for smart contracts and apps. #2 by market cap.', pair: 'ETH/USD' },
    { sym: 'SOL', name: 'Solana', type: 'crypto', sector: 'Smart contracts', start: 162.4, vol: 0.0017, beta: 1.35, spread: 0.0002, supply: 470e6, baseV: 9000, about: 'Fast, low-fee blockchain. Higher volatility altcoin.', pair: 'SOL/USD' },
    { sym: 'XRP', name: 'XRP', type: 'crypto', sector: 'Payments', start: 0.6215, vol: 0.0016, beta: 1.1, spread: 0.0003, supply: 56e9, baseV: 2.6e6, about: 'Token focused on cross-border payments.', pair: 'XRP/USD' },
    { sym: 'DOGE', name: 'Dogecoin', type: 'crypto', sector: 'Meme coin', start: 0.1618, vol: 0.002, beta: 1.5, spread: 0.0004, supply: 146e9, baseV: 9e6, about: 'Meme coin driven by hype and social media. Extremely volatile.', pair: 'DOGE/USD' },
  ];
  const TPB = 6; // ticks per 1-minute bar
  const HIST = 2400; // bars of pre-generated history
  const CAP = 4200; // base candles kept in memory

  const Live = (TM.Live = {
    ASSETS,
    TPB,
    TF: { '1m': 1, '5m': 5, '15m': 15, '1h': 60 },
    a: {}, // sym -> runtime
    ready: false,
    simT: 0,
    tickNo: 0,
    def(sym) {
      return ASSETS.find((x) => x.sym === sym);
    },
    init() {
      const m = TM.Store.s.market;
      if (m.ticks > 360000) {
        // keep replay fast: fold very old sessions into a fresh seed (prices continue from last saved)
        m.seed = U.seed();
        m.ticks = 0;
        m.events = [];
        m.foldTo = m.last || null;
        m.scale = null;
      }
      this.a = {};
      ASSETS.forEach((d, i) => {
        this.a[d.sym] = {
          d,
          r: U.rng(m.seed + i * 7919),
          p: d.start,
          base: [],
          cur: null,
          reg: { drift: 0, vm: 1, left: 0, anchor: d.start },
          cluster: 1,
          lastZ: 0,
          tfCache: {},
          open24: d.start,
        };
      });
      this.simT = m.t0 - HIST * 60;
      this.tickNo = 0;
      const total = HIST * TPB + m.ticks;
      for (let k = 0; k < total; k++) {
        if (k === HIST * TPB) this._applyScale(m);
        this._tick(true);
      }
      if (total === HIST * TPB) this._applyScale(m);
      ASSETS.forEach((d) => (this.a[d.sym].tfCache = {}));
      this.ready = true;
    },
    _applyScale(m) {
      if (m.foldTo && !m.scale) {
        m.scale = {};
        ASSETS.forEach((d) => {
          const want = m.foldTo[d.sym];
          m.scale[d.sym] = want ? want / this.a[d.sym].p : 1;
        });
        m.foldTo = null;
      }
      if (!m.scale) return;
      ASSETS.forEach((d) => {
        const A = this.a[d.sym];
        const f = m.scale[d.sym] || 1;
        if (f === 1) return;
        const sc = (c) => {
          c.o *= f;
          c.h *= f;
          c.l *= f;
          c.c *= f;
        };
        A.base.forEach(sc);
        if (A.cur) sc(A.cur);
        A.p *= f;
        A.reg.anchor *= f;
      });
    },
    storm(on) {
      const m = TM.Store.s.market;
      m.events.push({ tick: m.ticks, type: on ? 'storm-on' : 'storm-off' });
      TM.Store.save();
    },
    stormActive() {
      const ev = TM.Store.s.market.events;
      for (let i = ev.length - 1; i >= 0; i--) {
        if (ev[i].type === 'storm-on') return true;
        if (ev[i].type === 'storm-off') return false;
      }
      return false;
    },
    _stormAt(liveTick) {
      const ev = TM.Store.s.market.events;
      let on = false;
      for (const e of ev) {
        if (e.tick > liveTick) break;
        on = e.type === 'storm-on';
      }
      return on;
    },
    _tick(replay) {
      const m = TM.Store.s.market;
      const tickInBar = this.tickNo % TPB;
      const newBar = tickInBar === 0;
      if (newBar) this.simT += 60;
      const liveTick = this.tickNo - HIST * TPB;
      const storm = liveTick >= 0 && m.events.length ? this._stormAt(liveTick) : false;
      let mktZ = { stock: 0, crypto: 0 };
      ASSETS.forEach((d) => {
        const A = this.a[d.sym];
        const r = A.r;
        if (newBar) {
          if (A.reg.left <= 0) {
            const x = r();
            const kind = x < 0.3 ? 'up' : x < 0.55 ? 'down' : x < 0.88 ? 'range' : 'volatile';
            const dir = kind === 'up' ? 1 : kind === 'down' ? -1 : 0;
            A.reg = { kind, drift: dir * d.vol * (0.12 + r() * 0.22), vm: kind === 'volatile' ? 1.9 : kind === 'range' ? 0.75 : 1, left: 25 + Math.floor(r() * 140), anchor: A.p };
          }
          A.reg.left--;
          if (A.cur) {
            A.base.push(A.cur);
            if (A.base.length > CAP) A.base.shift();
          }
          A.cur = { t: this.simT, o: A.p, h: A.p, l: A.p, c: A.p, v: 0 };
        }
        let z = U.gauss(r);
        // correlation: stocks follow the index, alts follow bitcoin
        const leader = d.type === 'stock' ? 'SIMX' : 'BTC';
        if (d.sym !== leader) z = 0.55 * mktZ[d.type] * d.beta + Math.sqrt(1 - 0.3) * z * 0.85;
        else mktZ[d.type] = z;
        A.cluster = U.clamp(A.cluster * 0.97 + 0.03 * (0.5 + Math.abs(z) * 0.65), 0.55, 2.4);
        const stormMul = storm && d.type === 'crypto' ? 3.2 : 1;
        const sig = (d.vol / Math.sqrt(TPB)) * A.cluster * A.reg.vm * stormMul;
        let drift = A.reg.drift / TPB;
        if (A.reg.kind === 'range') drift += 0.02 * Math.log(A.reg.anchor / A.p) / TPB;
        // gentle long-run mean reversion to keep prices in a sane band
        drift += 0.0004 * Math.log(d.start / A.p) / TPB;
        const ret = drift + sig * z;
        A.p *= Math.exp(ret);
        const c = A.cur;
        c.h = Math.max(c.h, A.p);
        c.l = Math.min(c.l, A.p);
        c.c = A.p;
        c.v += (d.baseV / TPB) * (0.4 + Math.abs(z) * 0.9) * A.reg.vm * (storm && d.type === 'crypto' ? 3 : 1);
      });
      this.tickNo++;
    },
    tick() {
      if (!this.ready) return;
      const m = TM.Store.s.market;
      this._tick(false);
      m.ticks++;
      // update tf caches' last candle
      ASSETS.forEach((d) => {
        const A = this.a[d.sym];
        Object.keys(A.tfCache).forEach((tf) => this._tfUpdateLast(A, tf));
      });
    },
    _bucket(A, bucket, sec) {
      let o = null;
      const take = (c) => {
        if (c.t >= bucket + sec) return true;
        if (c.t < bucket) return false;
        if (!o) o = { t: bucket, o: c.o, h: c.h, l: c.l, c: c.c, v: c.v };
        else {
          o.o = c.o;
          o.h = Math.max(o.h, c.h);
          o.l = Math.min(o.l, c.l);
          o.v += c.v;
        }
        return true;
      };
      if (A.cur) take(A.cur);
      for (let i = A.base.length - 1; i >= 0; i--) if (!take(A.base[i])) break;
      return o;
    },
    _tfUpdateLast(A, tf) {
      const arr = A.tfCache[tf];
      const sec = this.TF[tf] * 60;
      const bucket = Math.floor(A.cur.t / sec) * sec;
      const last = arr[arr.length - 1];
      const b = this._bucket(A, bucket, sec);
      if (last && last.t === bucket) Object.assign(last, b);
      else {
        arr.push(b);
        if (arr.length > CAP) arr.shift();
      }
    },
    series(sym, tf = '1m') {
      const A = this.a[sym];
      if (!A) return [];
      if (!A.tfCache[tf]) A.tfCache[tf] = aggregate(A.base.concat([A.cur]), this.TF[tf]).map((c) => Object.assign({}, c));
      return A.tfCache[tf];
    },
    price(sym) {
      return this.a[sym] ? this.a[sym].p : 0;
    },
    candle(sym) {
      return this.a[sym] && this.a[sym].cur;
    },
    quote(sym) {
      const A = this.a[sym];
      const d = A.d;
      const half = d.type === 'crypto' ? A.p * d.spread * 0.5 : d.spread / 2;
      return { bid: A.p - half, ask: A.p + half, last: A.p, spread: half * 2 };
    },
    change(sym, bars = 1440) {
      const A = this.a[sym];
      const arr = A.base;
      const ref = arr[Math.max(0, arr.length - bars)];
      return ref ? (A.p / ref.o - 1) * 100 : 0;
    },
    vol24(sym) {
      const A = this.a[sym];
      const arr = A.base.slice(-1440);
      return arr.reduce((s, c) => s + c.v * c.c, 0);
    },
    mcap(sym) {
      return this.price(sym) * this.def(sym).supply;
    },
    dominance() {
      const tot = ASSETS.filter((d) => d.type === 'crypto').reduce((s, d) => s + this.mcap(d.sym), 0);
      // other coins not simulated individually are ~ 24% of the market
      return (this.mcap('BTC') / (tot / 0.76)) * 100;
    },
    funding(sym) {
      // simulated funding rate: crowded longs after a rally -> positive funding
      const ch = this.change(sym, 480);
      return U.clamp(0.0001 + ch * 0.00004, -0.0008, 0.0012);
    },
    remember() {
      const m = TM.Store.s.market;
      m.last = {};
      ASSETS.forEach((d) => (m.last[d.sym] = this.a[d.sym].p));
    },
  });

  TM.Market = { generate, context, aggregate, Ind };
})();

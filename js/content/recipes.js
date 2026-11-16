/* TRADE MASTERY — chart "recipes": deterministic simulated price paths that show a specific pattern.
   Each returns {seed, start, segs, meta}. Generated with TM.Market.generate. */
(function () {
  'use strict';
  const R = (TM.Recipes = {
    build(spec) {
      const key = JSON.stringify(spec);
      R._cache = R._cache || {};
      if (!R._cache[key]) R._cache[key] = TM.Market.generate(Object.assign({ step: spec.step || 3600, t0: 1767276000 }, spec));
      return R._cache[key];
    },
    uptrend: (seed = 11) => ({
      seed,
      start: 100,
      segs: [
        { n: 9, to: 104, v: 0.005 },
        { n: 5, to: 101.8, v: 0.004 },
        { n: 9, to: 107.5, v: 0.005 },
        { n: 5, to: 105, v: 0.004 },
        { n: 9, to: 111.5, v: 0.005 },
        { n: 5, to: 108.6, v: 0.004 },
        { n: 9, to: 115.5, v: 0.005 },
        { n: 4, to: 113.8, v: 0.004 },
      ],
      meta: { lows: [101.8, 105, 108.6, 113.8] },
    }),
    downtrend: (seed = 12) => ({
      seed,
      start: 116,
      segs: [
        { n: 9, to: 111.5, v: 0.005 },
        { n: 5, to: 114, v: 0.004 },
        { n: 9, to: 108, v: 0.005 },
        { n: 5, to: 110.8, v: 0.004 },
        { n: 9, to: 104, v: 0.005 },
        { n: 5, to: 106.6, v: 0.004 },
        { n: 9, to: 100, v: 0.005 },
      ],
    }),
    range: (seed = 13, lo = 96, hi = 102) => ({ seed, start: (lo + hi) / 2, segs: [{ n: 70, range: [lo, hi], v: 0.007 }], meta: { lo, hi } }),
    support: (seed = 14) => ({
      seed,
      start: 112,
      segs: [
        { n: 10, to: 101.2, v: 0.005 },
        { n: 8, to: 108, v: 0.005 },
        { n: 8, to: 100.6, v: 0.005, wick: { dir: -1, size: 0.004 } },
        { n: 9, to: 109.5, v: 0.005 },
        { n: 9, to: 100.9, v: 0.005 },
        { n: 8, to: 106.5, v: 0.005 },
      ],
      meta: { level: 100.8 },
    }),
    resistance: (seed = 15) => ({
      seed,
      start: 88,
      segs: [
        { n: 10, to: 99.2, v: 0.005 },
        { n: 8, to: 92.5, v: 0.005 },
        { n: 8, to: 99.6, v: 0.005, wick: { dir: 1, size: 0.004 } },
        { n: 9, to: 91, v: 0.005 },
        { n: 9, to: 99.3, v: 0.005 },
        { n: 8, to: 94, v: 0.005 },
      ],
      meta: { level: 99.4 },
    }),
    breakout: (seed = 16) => ({
      seed,
      start: 99,
      segs: [
        { n: 38, range: [96, 102], v: 0.006, vm: 0.8 },
        { n: 3, to: 101.7, v: 0.003, vm: 1.1 },
        { n: 1, to: 103.6, v: 0.003, vm: 3.2 },
        { n: 7, to: 106.4, v: 0.005, vm: 1.8 },
        { n: 4, to: 104.4, v: 0.004, vm: 0.9 },
        { n: 8, to: 108.5, v: 0.005, vm: 1.4 },
      ],
      meta: { res: 102, bo: 41, retest: 52 },
    }),
    fakeout: (seed = 17) => ({
      seed,
      start: 49,
      segs: [
        { n: 38, range: [47, 50], v: 0.006, vm: 0.9 },
        { n: 2, to: 49.8, v: 0.003 },
        { n: 1, to: 50.75, v: 0.003, vm: 1.05, wick: { dir: 1, size: 0.008 } },
        { n: 1, to: 50.6, v: 0.004, vm: 0.9 },
        { n: 2, to: 49.3, v: 0.004, vm: 2.1 },
        { n: 10, to: 46.6, v: 0.006, vm: 1.6 },
      ],
      meta: { res: 50, fake: 40, back: 43 },
    }),
    oversold: (seed = 18) => ({
      seed,
      start: 120,
      segs: [
        { n: 12, range: [116, 121], v: 0.005 },
        { n: 16, to: 101, v: 0.006, vm: 1.4 },
        { n: 4, to: 103.5, v: 0.005 },
        { n: 6, to: 97.8, v: 0.006, vm: 1.5 },
        { n: 2, to: 99.8, v: 0.004, vm: 1.6 },
        { n: 14, to: 108, v: 0.005, vm: 1.1 },
      ],
      meta: { low1: 28, low2: 38 },
    }),
    reversal: (seed = 19) => ({
      seed,
      start: 100,
      segs: [
        { n: 8, to: 106, v: 0.005 },
        { n: 5, to: 103.2, v: 0.004 },
        { n: 8, to: 110, v: 0.005 },
        { n: 5, to: 106.5, v: 0.004 },
        { n: 7, to: 108.8, v: 0.004, vm: 0.8 },
        { n: 6, to: 104.8, v: 0.005, vm: 1.5 },
        { n: 5, to: 107.4, v: 0.004, vm: 0.8 },
        { n: 8, to: 100.5, v: 0.006, vm: 1.4 },
      ],
      meta: { hl: 26, lh: 44, bos: 47, hlPrice: 106.5, lhPrice: 107.4 },
    }),
    doubleTop: (seed = 20) => ({
      seed,
      start: 92,
      segs: [
        { n: 12, to: 108, v: 0.005 },
        { n: 8, to: 101.5, v: 0.005 },
        { n: 8, to: 107.8, v: 0.005, vm: 0.7 },
        { n: 9, to: 100.5, v: 0.005, vm: 1.4 },
        { n: 8, to: 96, v: 0.006, vm: 1.3 },
      ],
      meta: { neck: 101.5 },
    }),
    doubleBottom: (seed = 21) => ({
      seed,
      start: 112,
      segs: [
        { n: 12, to: 96, v: 0.005 },
        { n: 8, to: 102.5, v: 0.005 },
        { n: 8, to: 96.3, v: 0.005, vm: 0.7 },
        { n: 9, to: 103.5, v: 0.005, vm: 1.4 },
        { n: 8, to: 107.5, v: 0.006, vm: 1.3 },
      ],
      meta: { neck: 102.5 },
    }),
    headShoulders: (seed = 22) => ({
      seed,
      start: 94,
      segs: [
        { n: 8, to: 104, v: 0.004 },
        { n: 5, to: 100, v: 0.004 },
        { n: 8, to: 109, v: 0.004 },
        { n: 6, to: 100.3, v: 0.004 },
        { n: 7, to: 104.3, v: 0.004, vm: 0.7 },
        { n: 6, to: 99, v: 0.005, vm: 1.4 },
        { n: 7, to: 95.5, v: 0.005, vm: 1.3 },
      ],
      meta: { neck: 100.1 },
    }),
    bullFlag: (seed = 23) => ({
      seed,
      start: 100,
      segs: [
        { n: 10, range: [99, 101.5], v: 0.004 },
        { n: 7, to: 110, v: 0.005, vm: 2.2 },
        { n: 10, to: 107.4, v: 0.003, vm: 0.6 },
        { n: 8, to: 115, v: 0.005, vm: 1.9 },
      ],
      meta: {},
    }),
    triangle: (seed = 24) => ({
      seed,
      start: 100,
      segs: [
        { n: 7, to: 108, v: 0.004 },
        { n: 6, to: 101, v: 0.004 },
        { n: 6, to: 107.9, v: 0.004 },
        { n: 5, to: 103, v: 0.004 },
        { n: 5, to: 107.8, v: 0.003 },
        { n: 4, to: 105, v: 0.003 },
        { n: 2, to: 107.6, v: 0.002 },
        { n: 8, to: 113, v: 0.005, vm: 2 },
      ],
      meta: { res: 108 },
    }),
    newsShock: (seed = 25) => ({
      seed,
      start: 100,
      segs: [
        { n: 30, to: 106, v: 0.004 },
        { n: 1, to: 100.8, v: 0.008, vm: 6 },
        { n: 3, to: 99.2, v: 0.01, vm: 3.5 },
        { n: 4, to: 101.8, v: 0.008, vm: 2.2 },
        { n: 10, range: [99.5, 102.4], v: 0.005, vm: 1.1 },
        { n: 8, to: 98.6, v: 0.005, vm: 1.2 },
      ],
      meta: { shock: 30 },
    }),
    stopHunt: (seed = 26) => ({
      seed,
      start: 104,
      segs: [
        { n: 12, to: 98.5, v: 0.005 },
        { n: 8, to: 103, v: 0.005 },
        { n: 8, to: 98.7, v: 0.005 },
        { n: 8, to: 102.5, v: 0.005 },
        { n: 7, to: 99.2, v: 0.004 },
        { n: 1, to: 99.6, v: 0.002, vm: 2.8, wick: { dir: -1, size: 0.022 } },
        { n: 10, to: 105.5, v: 0.005, vm: 1.4 },
      ],
      meta: { level: 98.6, hunt: 43 },
    }),
    ema: (seed = 27) => ({
      seed,
      start: 100,
      segs: [
        { n: 30, range: [97, 101.5], v: 0.006 },
        { n: 10, to: 96, v: 0.005 },
        { n: 22, to: 110, v: 0.005, vm: 1.3 },
        { n: 8, to: 107.5, v: 0.004 },
        { n: 12, to: 113, v: 0.005 },
      ],
    }),
    bbSqueeze: (seed = 28) => ({
      seed,
      start: 100,
      segs: [
        { n: 25, range: [96, 104], v: 0.008 },
        { n: 22, range: [99.2, 100.8], v: 0.0025, vm: 0.6 },
        { n: 8, to: 107, v: 0.006, vm: 2.4 },
        { n: 10, to: 109, v: 0.006 },
      ],
    }),
    multiTf: (seed = 29) => ({
      // a strong daily uptrend whose last stretch is a small pullback (looks bearish on a zoomed-in view)
      seed,
      start: 80,
      step: 3600,
      segs: [
        { n: 60, to: 96, v: 0.004 },
        { n: 25, to: 93, v: 0.003 },
        { n: 60, to: 110, v: 0.004 },
        { n: 30, to: 106.5, v: 0.003 },
      ],
    }),
    daySession: (seed = 30, type = 'trend') => {
      const vol = (n, k) => Array.from({ length: n }, (_, i) => k(i));
      const open = vol(30, (i) => 2.2 - i * 0.04);
      const vmO = vol(30, (i) => 3 - i * 0.07);
      if (type === 'trend')
        return {
          seed,
          start: 50,
          step: 60,
          segs: [
            { n: 15, range: [49.6, 50.8], v: 0.0016, vol: open, vmArr: vmO, gap: 0.02 },
            { n: 15, to: 51.8, v: 0.0016, vol: open.slice(15), vmArr: vmO.slice(15) },
            { n: 30, to: 51.2, v: 0.0012 },
            { n: 50, to: 52.8, v: 0.0012 },
            { n: 120, range: [52.2, 53.1], v: 0.0008, vm: 0.5 },
            { n: 90, to: 54.2, v: 0.0011, vm: 0.9 },
            { n: 30, to: 54.5, v: 0.0013, vm: 1.8 },
          ],
          meta: { orH: 50.8, orL: 49.6 },
        };
      return null;
    },
  });
})();

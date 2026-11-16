/* TRADE MASTERY — persistent game state (localStorage, versioned, safe) */
(function () {
  'use strict';
  const KEY = 'tradeMastery.save.v1';
  const START_CASH = 10000;

  function newAccount(cash = START_CASH) {
    return {
      start: cash,
      cash,
      positions: [],
      orders: [],
      equityCurve: [{ t: Date.now(), v: cash }],
      peak: cash,
      maxDD: 0,
      daily: { date: TM.U.dayKey(), start: cash },
      nextId: 1,
    };
  }

  function defaults() {
    return {
      v: 1,
      created: Date.now(),
      name: '',
      onboarded: false,
      xp: 0,
      xpLog: [],
      settings: { sound: true, hints: true, speed: 1, unlockAll: false, reduceMotion: false },
      lessons: {}, // id -> {done, at, quiz:{r,t}}
      quiz: { levels: {}, topics: {} }, // levels: lvl -> {best, last, count, passed}; topics: lessonId -> {r,w}
      scenarios: {}, // id -> {best, count}
      account: newAccount(),
      market: { seed: TM.U.seed(), ticks: 0, t0: 1767225600, events: [] },
      trades: [], // closed trades, all modes
      journal: {}, // tradeId -> entry
      plan: null,
      counters: {
        tradesWithStop: 0,
        lowRiskWins: 0,
        srFound: 0,
        fakeoutsFound: 0,
        journalCount: 0,
        scenariosDone: 0,
        daySessions: 0,
        swingCampaigns: 0,
        greenWeeks: 0,
        stormsSurvived: 0,
        liquidations: 0,
        quizCorrect: 0,
        quizAnswered: 0,
        disciplinedTrades: 0,
        swingPortfolio: 0,
        patientTargets: 0,
        coachQuestions: 0,
        perfectTests: 0,
        goodLosses: 0,
      },
      achievements: {},
      challenges: {},
      daily: { date: '', goals: [], done: {}, streak: 0, last: '' },
      day: { session: null, history: [], week: [] },
      swing: { campaign: null, history: [] },
      xpToday: { date: '', tradeXp: 0 },
      seenTips: {},
    };
  }

  function merge(base, saved) {
    // deep-merge saved data into defaults so new fields appear after updates
    if (saved == null || typeof saved !== 'object' || Array.isArray(saved)) return saved == null ? base : saved;
    const out = Array.isArray(base) ? [] : {};
    Object.keys(base).forEach((k) => (out[k] = base[k]));
    Object.keys(saved).forEach((k) => {
      if (base && typeof base[k] === 'object' && base[k] !== null && !Array.isArray(base[k]) && saved[k] && typeof saved[k] === 'object' && !Array.isArray(saved[k]))
        out[k] = merge(base[k], saved[k]);
      else out[k] = saved[k];
    });
    return out;
  }

  let storageOk = true;
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return merge(defaults(), JSON.parse(raw));
    } catch (e) {
      storageOk = false;
      console.warn('Storage unavailable; progress will not persist.', e);
    }
    return defaults();
  }

  const Store = (TM.Store = {
    s: null,
    START_CASH,
    newAccount,
    init() {
      this.s = load();
    },
    storageOk: () => storageOk,
    saveNow() {
      try {
        localStorage.setItem(KEY, JSON.stringify(this.s));
        storageOk = true;
      } catch (e) {
        storageOk = false;
      }
    },
    save: null,
    resetAccount() {
      this.s.account = newAccount();
      this.s.market = { seed: TM.U.seed(), ticks: 0, t0: 1767225600, events: [] };
      this.s.day.session = null;
      this.s.swing.campaign = null;
      this.saveNow();
    },
    resetAll() {
      try {
        localStorage.removeItem(KEY);
      } catch (e) {}
      this.s = defaults();
      this.saveNow();
    },
    exportData() {
      return JSON.stringify(this.s);
    },
    importData(str) {
      const obj = JSON.parse(str);
      if (!obj || typeof obj !== 'object' || obj.v !== 1) throw new Error('This file is not a Trade Mastery save.');
      this.s = merge(defaults(), obj);
      this.saveNow();
    },
    inc(counter, n = 1) {
      this.s.counters[counter] = (this.s.counters[counter] || 0) + n;
      this.save();
    },
  });
  Store.save = TM.U.debounce(() => Store.saveNow(), 400);
  window.addEventListener('beforeunload', () => Store.s && Store.saveNow());
  document.addEventListener('visibilitychange', () => document.hidden && Store.s && Store.saveNow());
})();

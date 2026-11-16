/* TRADE MASTERY — interactive lesson widgets & exercises.
   Each widget: TM.W[kind](host, cfg, done) -> optional {destroy}. done({ok, score}) signals completion. */
(function () {
  'use strict';
  const U = TM.U;
  const W = (TM.W = {});
  const data = (spec) => TM.Recipes.build(spec);

  function chartIn(host, cfg, extra = {}) {
    const box = U.el('<div class="w-chart"></div>');
    host.appendChild(box);
    box._cfg = cfg;
    const ch = new TM.Chart(
      box,
      Object.assign(
        {
          height: cfg.height || (window.innerWidth < 600 ? 260 : 320),
          overlays: cfg.overlays || {},
          panes: cfg.panes || [],
          volume: cfg.volume !== false,
          fitBars: cfg.fitBars,
          symbol: cfg.symbol || '',
          watermark: 'SIMULATED',
          rightPad: cfg.rightPad == null ? 3 : cfg.rightPad,
        },
        extra
      )
    );
    let d = cfg.candles || data(cfg.data);
    if (cfg.slice) d = d.slice(cfg.slice[0], cfg.slice[1]);
    ch.setData(d, { fit: true, fitBars: cfg.fitBars || d.length + 4 });
    if (cfg.lines) ch.setLines(cfg.lines);
    if (cfg.zones) ch.setZones(cfg.zones);
    if (cfg.segsDraw) ch.setSegments(cfg.segsDraw);
    if (cfg.marks) ch.setMarkers(cfg.marks);
    if (cfg.texts) ch.setTexts(cfg.texts);
    box._chart = ch;
    return { ch, d, box };
  }
  W.chartIn = chartIn;

  function fb(host) {
    const el = U.el('<div class="w-fb" aria-live="polite"></div>');
    host.appendChild(el);
    return {
      el,
      set(kind, html) {
        el.className = 'w-fb show fb-' + kind;
        el.innerHTML = html;
      },
      clear() {
        el.className = 'w-fb';
        el.innerHTML = '';
      },
    };
  }
  W.fb = fb;

  function hintFor(cfg) {
    TM.Coach.setContext({ view: 'lesson', hint: cfg.hint || 'Read the prompt carefully and look at the chart from left to right. What did price do the last few times it reached this area?', label: 'Lesson exercise' });
  }

  /* ---------------- static visual (html) ---------------- */
  W.html = function (host, cfg) {
    host.insertAdjacentHTML('beforeend', `<div class="w-html">${cfg.html}</div>`);
  };

  /* ---------------- chart view with optional toggles ---------------- */
  W.chart = function (host, cfg) {
    const bar = U.el('<div class="w-toggles"></div>');
    host.appendChild(bar);
    let base = cfg.candles || data(cfg.data);
    if (cfg.slice) base = base.slice(cfg.slice[0], cfg.slice[1]);
    let C = chartIn(host, Object.assign({}, cfg, { candles: base, slice: null }));
    const ov = Object.assign({}, cfg.overlays || {});
    const panes = (cfg.panes || []).slice();
    (cfg.toggles || []).forEach((k) => {
      const names = { ema9: 'EMA 9', ema20: 'EMA 20', ema50: 'EMA 50', sma20: 'SMA 20', bb: 'Bollinger', vwap: 'VWAP', rsi: 'RSI', macd: 'MACD', volume: 'Volume' };
      const on = k === 'rsi' || k === 'macd' ? panes.includes(k) : k === 'volume' ? cfg.volume !== false : !!ov[k];
      const b = U.el(`<button class="tg ${on ? 'on' : ''}" data-k="${k}">${names[k] || k}</button>`);
      b.onclick = () => {
        b.classList.toggle('on');
        const isOn = b.classList.contains('on');
        if (k === 'rsi' || k === 'macd') {
          const i = panes.indexOf(k);
          if (isOn && i < 0) panes.push(k);
          if (!isOn && i >= 0) panes.splice(i, 1);
          C.ch.setPanes(panes.slice());
        } else if (k === 'volume') {
          C.ch.o.volume = isOn;
          C.ch.req();
        } else {
          ov[k] = isOn;
          C.ch.setOverlays({ [k]: isOn });
        }
      };
      bar.appendChild(b);
    });
    if (cfg.tfs) {
      const seg = U.el('<div class="seg seg-sm"></div>');
      cfg.tfs.forEach((tf, i) => {
        const b = U.el(`<button class="${i === 0 ? 'on' : ''}">${tf.label}</button>`);
        b.onclick = () => {
          U.$$('button', seg).forEach((x) => x.classList.remove('on'));
          b.classList.add('on');
          const agg = TM.Market.aggregate(base, tf.mins);
          const view = tf.last ? agg.slice(-tf.last) : agg;
          C.ch.setData(view, { fit: true, fitBars: view.length + 3 });
          if (cfg.onTf) cfg.onTf(tf);
        };
        seg.appendChild(b);
      });
      bar.prepend(seg);
      const tf0 = cfg.tfs[0];
      const agg0 = TM.Market.aggregate(base, tf0.mins);
      const v0 = tf0.last ? agg0.slice(-tf0.last) : agg0;
      C.ch.setData(v0, { fit: true, fitBars: v0.length + 3 });
    }
    if (!bar.children.length) bar.remove();
    if (cfg.caption) host.insertAdjacentHTML('beforeend', `<p class="w-cap">${cfg.caption}</p>`);
    if (cfg.clickInfo) {
      const info = U.el('<div class="w-info muted">Tap any candle to inspect it.</div>');
      host.appendChild(info);
      C.ch.o.onCandleClick = (i, k) => {
        const up = k.c >= k.o;
        const body = Math.abs(k.c - k.o),
          rng = k.h - k.l || 1e-9;
        const uw = k.h - Math.max(k.o, k.c),
          lw = Math.min(k.o, k.c) - k.l;
        let story = up ? 'Buyers won this period: it closed higher than it opened.' : 'Sellers won this period: it closed lower than it opened.';
        if (body / rng < 0.25) story = 'Small body, long wicks: buyers and sellers fought to a draw (indecision).';
        else if (uw / rng > 0.45) story += ' The long upper wick shows buyers pushed up but sellers rejected the high.';
        else if (lw / rng > 0.45) story += ' The long lower wick shows sellers pushed down but buyers bought the dip.';
        else if (body / rng > 0.75) story += ' A big body with small wicks means one side was firmly in control.';
        const avgV = C.d.slice(Math.max(0, i - 20), i).reduce((s, x) => s + x.v, 0) / Math.max(1, Math.min(20, i));
        const vr = avgV ? k.v / avgV : 1;
        info.innerHTML = `<b class="${up ? 'up' : 'down'}">${up ? 'Green' : 'Red'} candle</b> · O ${U.price(k.o)} · H ${U.price(k.h)} · L ${U.price(k.l)} · C ${U.price(k.c)} · Vol ${vr.toFixed(1)}× avg<br>${story}${vr > 1.8 ? ' <b>Volume was unusually high</b> — this move had conviction.' : ''}`;
        C.ch.setHighlights([{ i, color: 'rgba(77,141,255,.18)' }]);
        cfg.onInspect && cfg.onInspect(i);
      };
    }
    return { destroy: () => C.ch.destroy(), chart: C.ch };
  };

  /* ---------------- sort items into buckets ---------------- */
  W.sort = function (host, cfg, done) {
    hintFor(cfg);
    host.insertAdjacentHTML('beforeend', `<p class="w-prompt">${cfg.prompt}</p>`);
    const list = U.el('<div class="w-sort"></div>');
    host.appendChild(list);
    let left = cfg.items.length;
    U.shuffle(cfg.items).forEach((it) => {
      const row = U.el(`<div class="sort-row"><div class="sort-item">${it.t}</div><div class="sort-btns">${cfg.buckets.map((b, i) => `<button class="btn btn-sm btn-ghost" data-b="${i}">${b}</button>`).join('')}</div><div class="sort-why"></div></div>`);
      U.on(row, 'click', 'button', (e, b) => {
        if (row.classList.contains('ok')) return;
        const ok = Number(b.dataset.b) === it.b;
        const why = row.querySelector('.sort-why');
        why.innerHTML = (ok ? '✓ ' : '✕ ') + (it.why || '');
        if (ok) {
          row.classList.add('ok');
          b.classList.add('btn-ok');
          U.$$('button', row).forEach((x) => (x.disabled = true));
          left--;
          U.sound('click');
          if (!left) done({ ok: true });
        } else {
          row.classList.remove('shake');
          void row.offsetWidth;
          row.classList.add('shake', 'wrong');
          U.sound('error');
        }
      });
      list.appendChild(row);
    });
  };

  /* ---------------- supply & demand simulator ---------------- */
  W.supply = function (host, cfg, done) {
    hintFor(Object.assign({ hint: 'Price rises when buyers are more eager than sellers. Push the Buyers slider well above Sellers and wait a few seconds.' }, cfg));
    host.insertAdjacentHTML(
      'beforeend',
      `<p class="w-prompt">${cfg.prompt}</p>
      <div class="sd">
        <div class="sd-ctrl">
          <label>Eager buyers <b class="up" id="sd-bv">50</b><input type="range" id="sd-b" min="0" max="100" value="50"></label>
          <label>Eager sellers <b class="down" id="sd-sv">50</b><input type="range" id="sd-s" min="0" max="100" value="50"></label>
          <div class="sd-book"><div class="sd-bar up-bg" id="sd-bb"></div><div class="sd-bar down-bg" id="sd-sb"></div></div>
          <div class="sd-msg muted" id="sd-msg">Balanced: price drifts sideways.</div>
        </div>
        <div class="sd-view"><div class="sd-price mono">$<span id="sd-p">100.00</span> <small id="sd-ch">0.00%</small></div><canvas id="sd-cv"></canvas></div>
      </div>`
    );
    const f = fb(host);
    const $ = (id) => host.querySelector('#' + id);
    let p = 100;
    const hist = [100];
    let finished = false;
    const r = U.rng(7);
    const iv = setInterval(() => {
      const b = +$('sd-b').value,
        s = +$('sd-s').value;
      $('sd-bv').textContent = b;
      $('sd-sv').textContent = s;
      $('sd-bb').style.width = b / 2 + '%';
      $('sd-sb').style.width = s / 2 + '%';
      const imb = (b - s) / 100;
      p *= 1 + imb * 0.004 + U.gauss(r) * 0.0012;
      hist.push(p);
      if (hist.length > 90) hist.shift();
      $('sd-p').textContent = p.toFixed(2);
      const ch = (p / 100 - 1) * 100;
      $('sd-ch').textContent = U.pct(ch);
      $('sd-ch').className = U.cls(ch);
      $('sd-msg').textContent =
        imb > 0.15 ? 'More buyers than sellers → buyers compete and pay up → price RISES.' : imb < -0.15 ? 'More sellers than buyers → sellers compete and accept less → price FALLS.' : 'Roughly balanced → price drifts sideways.';
      U.lineChart($('sd-cv'), hist, { baseline: 100 });
      if (!finished) {
        const goalUp = cfg.goal !== 'down';
        if ((goalUp && ch >= cfg.target) || (!goalUp && ch <= -cfg.target)) {
          finished = true;
          f.set('ok', `✓ ${cfg.explain || 'Exactly. Price is simply the result of buyers and sellers competing.'}`);
          done({ ok: true });
        }
      }
    }, 160);
    return { destroy: () => clearInterval(iv) };
  };

  /* ---------------- order book / order types ---------------- */
  W.orderbook = function (host, cfg, done) {
    hintFor(Object.assign({ hint: 'A MARKET order fills instantly at the ask (when buying). A LIMIT order waits until price comes to YOUR price. For "at $X or better" tasks, use Limit.' }, cfg));
    host.insertAdjacentHTML(
      'beforeend',
      `<div class="ob">
        <div class="ob-book"><div class="ob-h"><span>Bid size</span><span>Price</span><span>Ask size</span></div><div class="ob-rows"></div><div class="ob-spread muted small"></div></div>
        <div class="ob-ticket">
          <div class="ob-task"></div>
          <div class="seg" id="ob-side"><button class="on" data-v="buy">Buy</button><button data-v="sell">Sell</button></div>
          <div class="seg" id="ob-type"><button class="on" data-v="market">Market</button><button data-v="limit">Limit</button></div>
          <label class="fld" id="ob-lim" hidden>Limit price<input type="number" step="0.01" id="ob-lp" value="99.80"></label>
          <label class="fld">Shares<input type="number" id="ob-q" value="10" min="1"></label>
          <button class="btn btn-primary" id="ob-go">Place order</button>
          <div class="ob-orders small"></div>
          <div class="ob-pos small muted">Position: 0 shares</div>
        </div>
      </div>`
    );
    const f = fb(host);
    const $ = (s) => host.querySelector(s);
    const tasks = cfg.tasks || [
      { k: 'mb', t: 'Task 1/3 — Buy 10 shares <b>immediately</b>.' },
      { k: 'lb', t: 'Task 2/3 — Buy 10 more shares, but pay <b>$99.80 or less</b>. Price is above that right now.' },
      { k: 'ls', t: 'Task 3/3 — Sell all 20 shares for <b>$100.30 or more</b>.' },
    ];
    let ti = 0,
      mid = 100.0,
      pos = 0,
      orders = [],
      side = 'buy',
      type = 'market';
    const r = U.rng(3);
    const showTask = () => ($('.ob-task').innerHTML = ti < tasks.length ? tasks[ti].t : '✓ All tasks complete.');
    showTask();
    const seg = (id, set) =>
      U.on($(id), 'click', 'button', (e, b) => {
        U.$$('button', $(id)).forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
        set(b.dataset.v);
      });
    seg('#ob-side', (v) => (side = v));
    seg('#ob-type', (v) => {
      type = v;
      $('#ob-lim').hidden = v !== 'limit';
    });
    const render = () => {
      const bid = mid - 0.05,
        ask = mid + 0.05;
      let h = '';
      for (let i = 4; i >= 0; i--) h += `<div class="ob-row ask"><span></span><span>${(ask + i * 0.05).toFixed(2)}</span><span>${(200 + ((i * 137) % 400)).toFixed(0)}</span></div>`;
      for (let i = 0; i < 5; i++) h += `<div class="ob-row bid"><span>${(180 + ((i * 211) % 420)).toFixed(0)}</span><span>${(bid - i * 0.05).toFixed(2)}</span><span></span></div>`;
      $('.ob-rows').innerHTML = h;
      $('.ob-spread').innerHTML = `Best bid <b class="up">${bid.toFixed(2)}</b> · Best ask <b class="down">${ask.toFixed(2)}</b> · Spread <b>$0.10</b>`;
      $('.ob-orders').innerHTML = orders.map((o) => `<div class="pill">Working: LIMIT ${o.side.toUpperCase()} ${o.q} @ ${o.p.toFixed(2)}</div>`).join('');
      $('.ob-pos').textContent = `Position: ${pos} shares`;
    };
    render();
    const complete = (msg) => {
      f.set('ok', '✓ ' + msg);
      ti++;
      showTask();
      if (ti >= tasks.length) done({ ok: true });
    };
    $('#ob-go').onclick = () => {
      const q = Math.max(1, Math.floor(+$('#ob-q').value || 0));
      const bid = mid - 0.05,
        ask = mid + 0.05;
      const task = tasks[ti] && tasks[ti].k;
      if (type === 'market') {
        if (side === 'buy') {
          pos += q;
          U.sound('fill');
          if (task === 'mb') complete(`Filled instantly at the ask: <b>$${ask.toFixed(2)}</b>. Market orders are fast, but you pay the ask — the $0.10 spread is a small hidden cost.`);
          else if (task === 'lb') f.set('bad', `That filled at the ask ($${ask.toFixed(2)}) — more than $99.80. To control your price, use a <b>Limit</b> order.`);
          else f.set('info', `Bought ${q} at $${ask.toFixed(2)}.`);
        } else {
          if (pos < q) return f.set('bad', 'You cannot sell more shares than you own (in this exercise).');
          pos -= q;
          U.sound('fill');
          if (task === 'ls') f.set('bad', `Sold at the bid ($${bid.toFixed(2)}) — below your $100.30 goal. Use a <b>Limit</b> sell at 100.30.`);
          else f.set('info', `Sold ${q} at the bid $${bid.toFixed(2)}.`);
        }
      } else {
        const lp = +$('#ob-lp').value;
        if (!(lp > 0)) return f.set('bad', 'Enter a limit price.');
        if (side === 'sell' && pos < q) return f.set('bad', 'You do not own enough shares to sell.');
        if (side === 'buy' && lp >= ask) {
          pos += q;
          f.set('info', `Your limit ($${lp.toFixed(2)}) was above the ask, so it filled immediately at $${ask.toFixed(2)}.`);
          if (task === 'mb') complete('Filled immediately because your limit was above the ask.');
          return render();
        }
        orders.push({ side, p: lp, q });
        f.set('info', `Limit ${side} placed at $${lp.toFixed(2)}. It is <b>working</b>: it will only fill if price reaches your level. Watch the book…`);
      }
      render();
    };
    const iv = setInterval(() => {
      const task = tasks[ti] && tasks[ti].k;
      // a working order "attracts" price so the exercise never stalls; otherwise drift back toward $100
      let pull = (100 - mid) * 0.04;
      if (orders.length) {
        const o0 = orders[0];
        const fillAt = o0.side === 'buy' ? o0.p - 0.08 : o0.p + 0.08; // where the opposite side of the book reaches the order
        pull = Math.sign(fillAt - mid) * Math.min(0.035, Math.abs(fillAt - mid));
      }
      mid = Math.max(95, mid + pull + U.gauss(r) * 0.02);
      mid = Math.round(mid * 100) / 100;
      const bid = mid - 0.05,
        ask = mid + 0.05;
      orders.slice().forEach((o) => {
        const hit = o.side === 'buy' ? ask <= o.p : bid >= o.p;
        if (!hit) return;
        orders.splice(orders.indexOf(o), 1);
        pos += o.side === 'buy' ? o.q : -o.q;
        U.sound('fill');
        if (o.side === 'buy' && task === 'lb' && o.p <= 99.8 + 1e-9) complete(`Your limit buy filled at <b>$${o.p.toFixed(2)}</b>. You waited for the price to come to you — but limit orders are never guaranteed to fill.`);
        else if (o.side === 'sell' && task === 'ls' && o.p >= 100.3 - 1e-9 && pos <= 0) complete(`Sold at <b>$${o.p.toFixed(2)}</b>. Limit sells let you name your exit price.`);
        else if (o.side === 'sell' && task === 'ls' && pos > 0) f.set('info', `Partial: sold ${o.q} at $${o.p.toFixed(2)}. Sell the rest at $100.30+.`);
        else f.set('info', `Limit ${o.side} filled at $${o.p.toFixed(2)}.`);
      });
      render();
    }, 450);
    return { destroy: () => clearInterval(iv) };
  };

  /* ---------------- numeric answer ---------------- */
  W.numeric = function (host, cfg, done) {
    hintFor(cfg);
    host.insertAdjacentHTML(
      'beforeend',
      `${cfg.given ? `<div class="w-given">${cfg.given}</div>` : ''}<p class="w-prompt">${cfg.prompt}</p>
      <form class="w-num"><span class="w-unit">${cfg.prefix || ''}</span><input type="number" step="any" inputmode="decimal" aria-label="Your answer"><span class="w-unit">${cfg.unit || ''}</span><button class="btn btn-primary">Check</button><button type="button" class="btn btn-ghost w-show" hidden>Show answer</button></form>`
    );
    const f = fb(host);
    const form = host.querySelector('.w-num');
    const inp = form.querySelector('input');
    let tries = 0;
    const ok = (v) => {
      const tol = cfg.tol != null ? cfg.tol : Math.abs(cfg.answer) * 0.01;
      return Math.abs(v - cfg.answer) <= tol + 1e-9;
    };
    form.onsubmit = (e) => {
      e.preventDefault();
      const v = parseFloat(inp.value);
      if (isNaN(v)) return f.set('bad', 'Type a number first.');
      if (ok(v)) {
        f.set('ok', '✓ Correct! ' + (cfg.explain || ''));
        inp.disabled = true;
        form.querySelector('button').disabled = true;
        done({ ok: true, firstTry: tries === 0 });
      } else {
        tries++;
        f.set('bad', `Not quite. ${cfg.hint ? 'Hint: ' + cfg.hint : ''}`);
        if (tries >= 2) form.querySelector('.w-show').hidden = false;
      }
    };
    form.querySelector('.w-show').onclick = () => {
      inp.value = cfg.answer;
      f.set('info', `Answer: <b>${cfg.prefix || ''}${cfg.answer}${cfg.unit ? ' ' + cfg.unit : ''}</b>. ${cfg.explain || ''}`);
      inp.disabled = true;
      done({ ok: true, revealed: true });
    };
  };

  /* ---------------- candle builder ---------------- */
  W.candle = function (host, cfg, done) {
    hintFor(Object.assign({ hint: 'Green = close above open. The wick is the distance from the body to the high or low. Drag Low far below the body for a long lower wick.' }, cfg));
    host.insertAdjacentHTML(
      'beforeend',
      `<p class="w-prompt">${cfg.prompt}</p>
      <div class="cb"><div class="cb-ctrl">
        ${['Open', 'High', 'Low', 'Close'].map((k) => `<label>${k} <b class="mono" id="cb-${k}v"></b><input type="range" min="90" max="110" step="0.5" id="cb-${k}"></label>`).join('')}
        <button class="btn btn-primary" id="cb-check">Check my candle</button>
      </div><svg class="cb-svg" viewBox="0 0 220 260" role="img" aria-label="Candle preview"></svg></div>`
    );
    const f = fb(host);
    const $ = (id) => host.querySelector('#' + id);
    const init = cfg.init || { Open: 100, High: 103, Low: 98, Close: 101 };
    Object.keys(init).forEach((k) => ($('cb-' + k).value = init[k]));
    const get = () => {
      let o = +$('cb-Open').value,
        h = +$('cb-High').value,
        l = +$('cb-Low').value,
        c = +$('cb-Close').value;
      h = Math.max(h, o, c);
      l = Math.min(l, o, c);
      return { o, h, l, c };
    };
    const draw = () => {
      const k = get();
      ['Open', 'High', 'Low', 'Close'].forEach((n) => ($('cb-' + n + 'v').textContent = k[n[0].toLowerCase()].toFixed(1)));
      const Y = (p) => 240 - ((p - 88) / 24) * 220;
      const up = k.c >= k.o;
      const col = up ? '#16c784' : '#f0465a';
      const top = Y(Math.max(k.o, k.c)),
        bot = Y(Math.min(k.o, k.c));
      host.querySelector('.cb-svg').innerHTML = `
        <line x1="80" x2="80" y1="${Y(k.h)}" y2="${Y(k.l)}" stroke="${col}" stroke-width="3"/>
        <rect x="55" y="${top}" width="50" height="${Math.max(2, bot - top)}" fill="${col}" rx="2"/>
        ${[
          ['High', k.h],
          ['Low', k.l],
          ['Open', k.o],
          ['Close', k.c],
        ]
          .map(([n, p]) => `<text x="125" y="${Y(p) + 4}" fill="#aab4c3" font-size="12" font-family="JetBrains Mono, monospace">${n} ${p.toFixed(1)}</text><line x1="108" x2="120" y1="${Y(p)}" y2="${Y(p)}" stroke="#3a4456"/>`)
          .join('')}`;
    };
    U.$$('input', host).forEach((i) => (i.oninput = draw));
    draw();
    $('cb-check').onclick = () => {
      const res = cfg.check(get());
      if (res === true) {
        f.set('ok', '✓ ' + (cfg.explain || 'That is the candle.'));
        done({ ok: true });
      } else f.set('bad', res);
    };
  };

  /* ---------------- click the right candle ---------------- */
  W.clickCandle = function (host, cfg, done) {
    hintFor(cfg);
    host.insertAdjacentHTML('beforeend', `<p class="w-prompt">${cfg.prompt}</p>`);
    let tries = 0,
      solved = false;
    const C = chartIn(host, cfg);
    const f = fb(host);
    const targets = cfg.target(C.d, TM.Ind);
    const tol = cfg.tol == null ? 1 : cfg.tol;
    C.ch.o.onCandleClick = (i) => {
      if (solved) return;
      const hit = targets.some((t) => Math.abs(t - i) <= tol);
      if (hit) {
        solved = true;
        C.ch.setMarkers([{ i, kind: 'dot', ring: true, color: '#16c784' }]);
        C.ch.setHighlights([{ i, color: 'rgba(22,199,132,.18)' }]);
        f.set('ok', '✓ ' + cfg.explain);
        U.sound('click');
        done({ ok: true, firstTry: tries === 0 });
      } else {
        tries++;
        C.ch.setMarkers([{ i, kind: 'dot', color: '#f0465a' }]);
        U.sound('error');
        const why = cfg.wrong ? cfg.wrong(i, C.d, targets) : '';
        if (tries >= 3) {
          solved = true;
          C.ch.setHighlights(targets.map((t) => ({ i: t, color: 'rgba(242,184,75,.25)' })));
          C.ch.setMarkers(targets.map((t) => ({ i: t, kind: 'dot', ring: true, color: '#f2b84b' })));
          f.set('info', `Here it is (highlighted). ${cfg.explain}`);
          done({ ok: true, revealed: true });
        } else f.set('bad', `Not that one. ${why || ''} ${tries === 2 && cfg.hint ? '<br>💡 ' + cfg.hint : ''}`);
      }
    };
    return { destroy: () => C.ch.destroy() };
  };

  /* ---------------- draw a support / resistance level ---------------- */
  W.level = function (host, cfg, done) {
    hintFor(Object.assign({ hint: 'Find the price where the chart turned around two or three times. Click at that height anywhere on the chart.' }, cfg));
    host.insertAdjacentHTML('beforeend', `<p class="w-prompt">${cfg.prompt}</p>`);
    const C = chartIn(host, cfg);
    C.ch.mode = 'level';
    const f = fb(host);
    const levels = cfg.levels(C.d);
    let tries = 0,
      solved = false;
    const found = new Set();
    const need = cfg.need || 1;
    const drawn = [];
    C.ch.o.onPriceClick = (p) => {
      if (solved) return;
      const hitIdx = levels.findIndex((L) => Math.abs(p - L.price) <= L.tol);
      if (hitIdx >= 0 && !found.has(hitIdx)) {
        found.add(hitIdx);
        const L = levels[hitIdx];
        drawn.push({ price: L.price, color: L.color || '#f2b84b', label: L.label || 'Level', width: 2 });
        C.ch.setLines(drawn.slice());
        U.sound('click');
        if (found.size >= need) {
          solved = true;
          C.ch.mode = 'normal';
          f.set('ok', '✓ ' + cfg.explain);
          done({ ok: true, firstTry: tries === 0 });
        } else f.set('ok', `✓ Found one (${found.size}/${need}). Find the other level.`);
      } else {
        tries++;
        C.ch.setLines(drawn.concat([{ price: p, color: '#f0465a', label: '✕', dash: [3, 3] }]));
        U.sound('error');
        if (tries >= 4) {
          solved = true;
          C.ch.mode = 'normal';
          C.ch.setLines(levels.map((L) => ({ price: L.price, color: '#f2b84b', label: L.label || 'Level', width: 2 })));
          f.set('info', 'Here are the levels. ' + cfg.explain);
          done({ ok: true, revealed: true });
        } else {
          const near = levels[0];
          const dir = p > near.price ? 'too high' : 'too low';
          f.set('bad', `Not quite — that is ${levels.length === 1 ? dir : 'not a level price respected multiple times'}. Look for where price turned around more than once.`);
        }
      }
    };
    return { destroy: () => C.ch.destroy() };
  };

  /* ---------------- chart + multiple choice ---------------- */
  W.chartChoice = function (host, cfg, done) {
    hintFor(cfg);
    const inner = U.el('<div></div>');
    host.appendChild(inner);
    const view = W.chart(inner, cfg);
    W.choice(host, cfg, done);
    return { destroy: () => view.destroy() };
  };

  /* ---------------- multiple choice (single question, explain after) ---------------- */
  W.choice = function (host, cfg, done) {
    host.insertAdjacentHTML('beforeend', `<p class="w-prompt">${cfg.prompt || cfg.q}</p>`);
    const opts = U.el('<div class="opts"></div>');
    host.appendChild(opts);
    const f = fb(host);
    let answered = false;
    cfg.options.forEach((o, i) => {
      const b = U.el(`<button class="opt"><span class="opt-k">${'ABCDEF'[i]}</span><span>${o}</span></button>`);
      b.onclick = () => {
        if (answered) return;
        answered = true;
        const ok = i === cfg.answer;
        b.classList.add(ok ? 'right' : 'wrong');
        opts.children[cfg.answer].classList.add('right');
        U.$$('.opt', opts).forEach((x) => (x.disabled = true));
        f.set(ok ? 'ok' : 'bad', (ok ? '✓ Correct. ' : '✕ Not quite. ') + (cfg.explain || ''));
        U.sound(ok ? 'click' : 'error');
        done({ ok, firstTry: ok });
      };
      opts.appendChild(b);
    });
  };

  /* ---------------- place stop & target ---------------- */
  W.stops = function (host, cfg, done) {
    hintFor(Object.assign({ hint: 'Put the stop just beyond the level that proves you wrong (below support for a long). Then put the target at least 2× that distance above entry.' }, cfg));
    host.insertAdjacentHTML('beforeend', `<p class="w-prompt">${cfg.prompt}</p>`);
    const C = chartIn(host, Object.assign({ rightPad: 10 }, cfg));
    const d = C.d;
    const entry = cfg.entry ? cfg.entry(d) : d[d.length - 1].c;
    const side = cfg.side || 'long';
    let stop = U.round(side === 'long' ? entry * 0.99 : entry * 1.01, 2),
      target = U.round(side === 'long' ? entry * 1.01 : entry * 0.99, 2);
    host.insertAdjacentHTML(
      'beforeend',
      `<div class="st-row"><label class="fld">Entry<input type="number" value="${entry.toFixed(2)}" disabled></label>
      <label class="fld">Stop-loss<input type="number" step="0.01" id="st-s" value="${stop}"></label>
      <label class="fld">Take-profit<input type="number" step="0.01" id="st-t" value="${target}"></label>
      <div class="st-rr"><span class="muted small">Reward:Risk</span><b id="st-rr">1.0 : 1</b></div>
      <button class="btn btn-primary" id="st-go">Check plan</button></div><p class="muted small">Tip: drag the dashed red/green lines on the chart, or type prices.</p>`
    );
    const f = fb(host);
    const $ = (id) => host.querySelector('#' + id);
    const sync = () => {
      C.ch.setLines([
        { id: 'e', price: entry, color: '#4d8dff', label: 'Entry' },
        { id: 's', price: stop, color: '#f0465a', label: 'Stop', draggable: true },
        { id: 't', price: target, color: '#16c784', label: 'Target', draggable: true },
      ]);
      const rr = TM.Trading.rr(side, entry, stop, target);
      $('st-rr').textContent = rr == null ? '—' : rr.toFixed(2) + ' : 1';
      $('st-rr').className = rr >= 2 ? 'up' : rr >= 1 ? '' : 'down';
    };
    C.ch.o.onLineDrag = (id, p) => {
      if (id === 's') {
        stop = p;
        $('st-s').value = p.toFixed(2);
      }
      if (id === 't') {
        target = p;
        $('st-t').value = p.toFixed(2);
      }
      sync();
    };
    $('st-s').oninput = () => {
      stop = +$('st-s').value;
      sync();
    };
    $('st-t').oninput = () => {
      target = +$('st-t').value;
      sync();
    };
    sync();
    $('st-go').onclick = () => {
      const res = cfg.check({ entry, stop, target, d, rr: TM.Trading.rr(side, entry, stop, target) });
      if (res === true) {
        f.set('ok', '✓ ' + cfg.explain);
        done({ ok: true });
      } else f.set('bad', res);
    };
    return { destroy: () => C.ch.destroy() };
  };

  /* ---------------- diversification allocator ---------------- */
  W.allocate = function (host, cfg, done) {
    hintFor(Object.assign({ hint: 'Keep any single position at or below the limit and spread across sectors that do not move together.' }, cfg));
    host.insertAdjacentHTML('beforeend', `<p class="w-prompt">${cfg.prompt}</p>`);
    const wrap = U.el('<div class="al"><div class="al-sliders"></div><div class="al-side"><div class="al-pie"></div><div class="al-stress small"></div><button class="btn btn-primary" id="al-go">Check portfolio</button></div></div>');
    host.appendChild(wrap);
    const f = fb(host);
    const cols = ['#4d8dff', '#16c784', '#f2b84b', '#a78bfa', '#38c6d9', '#ff8fd0'];
    const vals = cfg.assets.map((a) => a.init || 0);
    const sl = wrap.querySelector('.al-sliders');
    cfg.assets.forEach((a, i) => {
      const row = U.el(`<label class="al-row"><span class="al-sw" style="background:${cols[i]}"></span><span class="al-n"><b>${a.sym}</b> <span class="muted small">${a.sector}</span></span><input type="range" min="0" max="100" step="5" value="${vals[i]}"><b class="mono al-v">${vals[i]}%</b></label>`);
      row.querySelector('input').oninput = (e) => {
        vals[i] = +e.target.value;
        draw();
      };
      sl.appendChild(row);
    });
    const draw = () => {
      const tot = vals.reduce((a, b) => a + b, 0) || 1;
      let acc = 0;
      const stops = vals
        .map((v, i) => {
          const s = (acc / tot) * 360;
          acc += v;
          return `${cols[i]} ${s}deg ${(acc / tot) * 360}deg`;
        })
        .join(',');
      wrap.querySelector('.al-pie').style.background = `conic-gradient(${stops})`;
      U.$$('.al-v', sl).forEach((el, i) => (el.textContent = Math.round((vals[i] / tot) * 100) + '%'));
      // stress test: worst single-sector crash
      const crash = cfg.assets.map((a, i) => ((vals[i] / tot) * a.crash) / 100);
      const worst = Math.max(...crash);
      const wi = crash.indexOf(worst);
      wrap.querySelector('.al-stress').innerHTML = `<b>Stress test:</b> if <b>${cfg.assets[wi].sector}</b> crashes ${cfg.assets[wi].crash}%, your portfolio drops <b class="down">${worst.toFixed(1)}%</b>.<br>Total allocated: ${tot}% ${tot !== 100 ? '<span class="muted">(shown as share of total)</span>' : ''}`;
    };
    draw();
    wrap.querySelector('#al-go').onclick = () => {
      const tot = vals.reduce((a, b) => a + b, 0);
      if (!tot) return f.set('bad', 'Allocate something first.');
      const pct = vals.map((v) => (v / tot) * 100);
      const res = cfg.check(pct, cfg.assets);
      if (res === true) {
        f.set('ok', '✓ ' + cfg.explain);
        done({ ok: true });
      } else f.set('bad', res);
    };
  };

  /* ---------------- leverage & liquidation lab ---------------- */
  W.leverage = function (host, cfg, done) {
    hintFor(Object.assign({ hint: 'Liquidation distance ≈ 1 ÷ leverage. A 10% liquidation distance needs leverage below 10×. Leave room for fees and maintenance margin.' }, cfg));
    const entry = cfg.entry || 60000;
    host.insertAdjacentHTML(
      'beforeend',
      `<p class="w-prompt">${cfg.prompt}</p>
      <div class="lv"><label>Leverage <b class="mono" id="lv-v">1×</b><input type="range" id="lv-r" min="1" max="50" value="1"></label>
      <div class="lv-grid">
        <div><span class="muted small">Your margin</span><b class="mono">$1,000</b></div>
        <div><span class="muted small">Position size</span><b class="mono" id="lv-pos"></b></div>
        <div><span class="muted small">Liquidation price</span><b class="mono down" id="lv-liq"></b></div>
        <div><span class="muted small">Distance to liquidation</span><b class="mono" id="lv-dist"></b></div>
        <div><span class="muted small">If price +${cfg.move}%</span><b class="mono up" id="lv-up"></b></div>
        <div><span class="muted small">If price −${cfg.move}%</span><b class="mono down" id="lv-dn"></b></div>
      </div>
      <div class="lv-bar"><div class="lv-liqmark" id="lv-mark"></div><div class="lv-drop" id="lv-drop"></div><span class="lv-l small">−50%</span><span class="lv-e small">Entry</span></div>
      <button class="btn btn-primary" id="lv-go">Lock in leverage</button></div>`
    );
    const f = fb(host);
    const $ = (id) => host.querySelector('#' + id);
    const draw = () => {
      const L = +$('lv-r').value;
      $('lv-v').textContent = L + '×';
      $('lv-pos').textContent = U.money(1000 * L, 0);
      const liq = L > 1 ? TM.Trading.liqPrice('long', entry, L) : null;
      $('lv-liq').textContent = liq ? '$' + U.num(liq, 0) : 'none (no leverage)';
      const dist = liq ? (1 - liq / entry) * 100 : 100;
      $('lv-dist').textContent = liq ? dist.toFixed(1) + '%' : '—';
      $('lv-up').textContent = U.smoney((1000 * L * cfg.move) / 100, 0);
      const dn = Math.max(-1000, (-1000 * L * cfg.move) / 100);
      $('lv-dn').textContent = (dist <= cfg.move ? 'LIQUIDATED ' : '') + U.smoney(dn, 0);
      $('lv-mark').style.right = Math.min(100, (dist / 50) * 100) + '%';
      $('lv-drop').style.width = (cfg.move / 50) * 100 + '%';
    };
    $('lv-r').oninput = draw;
    draw();
    $('lv-go').onclick = () => {
      const L = +$('lv-r').value;
      const res = cfg.check(L);
      if (res === true) {
        f.set('ok', '✓ ' + cfg.explain);
        done({ ok: true });
      } else f.set('bad', res);
    };
  };

  /* ---------------- sequence of decisions (psychology) ---------------- */
  W.decisions = function (host, cfg, done) {
    hintFor(Object.assign({ hint: 'Ask: "Is this decision part of my written plan, or a reaction to how I feel right now?"' }, cfg));
    const box = U.el('<div class="ds"></div>');
    host.appendChild(box);
    let i = 0,
      good = 0;
    const step = () => {
      if (i >= cfg.steps.length) {
        box.innerHTML = `<div class="ds-end"><b>${good}/${cfg.steps.length}</b> disciplined decisions. ${good === cfg.steps.length ? 'Ice-cold discipline.' : 'Review the ones you missed — these situations happen to every trader.'}</div>`;
        done({ ok: true, score: good / cfg.steps.length });
        return;
      }
      const st = cfg.steps[i];
      box.innerHTML = `<div class="ds-n muted small">Situation ${i + 1} of ${cfg.steps.length}</div><div class="ds-sit">${st.s}</div><div class="opts"></div><div class="w-fb"></div><button class="btn btn-primary ds-next" hidden>Next situation →</button>`;
      const opts = box.querySelector('.opts');
      st.o.forEach((o) => {
        const b = U.el(`<button class="opt"><span>${o.t}</span></button>`);
        b.onclick = () => {
          U.$$('.opt', opts).forEach((x) => (x.disabled = true));
          b.classList.add(o.good ? 'right' : 'wrong');
          if (o.good) good++;
          const fe = box.querySelector('.w-fb');
          fe.className = 'w-fb show ' + (o.good ? 'fb-ok' : 'fb-bad');
          fe.innerHTML = (o.good ? '✓ ' : '✕ ') + o.fb;
          box.querySelector('.ds-next').hidden = false;
          U.sound(o.good ? 'click' : 'error');
        };
        opts.appendChild(b);
      });
      box.querySelector('.ds-next').onclick = () => {
        i++;
        step();
      };
    };
    step();
  };

  /* ---------------- trading plan builder ---------------- */
  W.plan = function (host, cfg, done) {
    const p = TM.Store.s.plan || {};
    host.insertAdjacentHTML(
      'beforeend',
      `<p class="w-prompt">${cfg.prompt}</p>
      <form class="plan">
        <label class="fld">My style<select id="pl-style"><option>Day trading</option><option>Swing trading</option><option>Both</option></select></label>
        <label class="fld">Markets I trade<input id="pl-mk" placeholder="e.g. Large-cap tech stocks, BTC & ETH" value="${U.esc(p.markets || '')}"></label>
        <label class="fld">My setups (entry rules)<textarea id="pl-setup" rows="2" placeholder="e.g. Pullback to EMA 20 in an uptrend, with a bullish candle and RSI above 40">${U.esc(p.setup || '')}</textarea></label>
        <label class="fld">Stop-loss rule<input id="pl-stop" placeholder="e.g. Below the last swing low, at least 1 ATR away" value="${U.esc(p.stop || '')}"></label>
        <div class="plan-row"><label class="fld">Risk per trade (%)<input type="number" step="0.1" id="pl-risk" value="${p.risk || 1}"></label>
        <label class="fld">Minimum reward:risk<input type="number" step="0.1" id="pl-rr" value="${p.rr || 2}"></label>
        <label class="fld">Max trades per day<input type="number" id="pl-max" value="${p.max || 3}"></label>
        <label class="fld">Daily loss limit (%)<input type="number" step="0.5" id="pl-dl" value="${p.dl || 3}"></label></div>
        <label class="fld">I will NOT trade when…<input id="pl-no" placeholder="e.g. right before earnings, after 2 losses in a row, when angry" value="${U.esc(p.no || '')}"></label>
        <button class="btn btn-primary">Save my trading plan</button>
      </form>`
    );
    const f = fb(host);
    if (p.style) host.querySelector('#pl-style').value = p.style;
    host.querySelector('.plan').onsubmit = (e) => {
      e.preventDefault();
      const $ = (id) => host.querySelector('#' + id).value.trim();
      const plan = { style: $('pl-style'), markets: $('pl-mk'), setup: $('pl-setup'), stop: $('pl-stop'), risk: +$('pl-risk'), rr: +$('pl-rr'), max: +$('pl-max'), dl: +$('pl-dl'), no: $('pl-no'), at: Date.now() };
      const issues = [];
      if (plan.setup.length < 10) issues.push('Describe your entry setup in at least a sentence.');
      if (plan.stop.length < 5) issues.push('Write a stop-loss rule.');
      if (!(plan.risk > 0) || plan.risk > 3) issues.push('Pick a risk per trade between 0.1% and 3% (1% is a common choice).');
      if (!(plan.rr >= 1)) issues.push('Minimum reward:risk should be at least 1 (2 is common).');
      if (issues.length) return f.set('bad', issues.join('<br>'));
      TM.Store.s.plan = plan;
      TM.Store.save();
      TM.Progress.checkAchievements();
      f.set('ok', '✓ Plan saved. You can see it any time in your Trading Journal. A plan only works if you follow it — the journal will show whether you did.');
      done({ ok: true });
    };
  };

  /* =====================================================================
     SCENARIO PLAYER — progressive reveal of a chart with decisions.
     cfg: {data|candles, overlays, panes, intro, stages:[{reveal, q, options:[{t,score(0-3),fb}], input:{answer,tol,prefix,unit}, lines, zones, note}], outro}
     ===================================================================== */
  W.scenario = function (host, cfg, done) {
    TM.Coach.setContext({ view: 'scenario', hint: () => (cfg.stages[si] && cfg.stages[si].hint) || 'Think in this order: trend → key level → confirmation (volume/candle close) → where am I wrong → is reward ≥ 2× risk?', label: 'Market scenario' });
    const d = cfg.candles || data(cfg.data);
    host.insertAdjacentHTML('beforeend', cfg.intro ? `<div class="sc-intro">${cfg.intro}</div>` : '');
    const C = chartIn(host, Object.assign({}, cfg, { candles: d, rightPad: 8 }));
    const panel = U.el('<div class="sc-panel"></div>');
    host.appendChild(panel);
    let si = 0,
      total = 0,
      max = 0,
      anim = null;
    const showStage = () => {
      const st = cfg.stages[si];
      C.ch.setLines(st.lines || []);
      C.ch.setZones(st.zones || []);
      C.ch.setMarkers(st.marks || []);
      panel.innerHTML = `<div class="sc-step muted small">Decision ${si + 1} of ${cfg.stages.length}</div>${st.note ? `<div class="sc-note">${st.note}</div>` : ''}<p class="w-prompt">${st.q}</p><div class="sc-body"></div><div class="w-fb"></div><button class="btn btn-primary sc-next" hidden>${si === cfg.stages.length - 1 ? 'See what happened →' : 'Continue — reveal more →'}</button>`;
      const body = panel.querySelector('.sc-body');
      const fe = panel.querySelector('.w-fb');
      const next = panel.querySelector('.sc-next');
      if (st.input) {
        const form = U.el(`<form class="w-num"><span class="w-unit">${st.input.prefix || ''}</span><input type="number" step="any" inputmode="decimal" aria-label="Your answer"><span class="w-unit">${st.input.unit || ''}</span><button class="btn btn-primary">Submit</button></form>`);
        body.appendChild(form);
        let tries = 0;
        max += 3;
        form.onsubmit = (e) => {
          e.preventDefault();
          const v = parseFloat(form.querySelector('input').value);
          if (isNaN(v)) return;
          const ok = Math.abs(v - st.input.answer) <= (st.input.tol || 0.5);
          if (ok || tries >= 1) {
            const sc = ok ? (tries ? 2 : 3) : 0;
            total += sc;
            fe.className = 'w-fb show ' + (ok ? 'fb-ok' : 'fb-bad');
            fe.innerHTML = (ok ? '✓ ' : `✕ The answer is <b>${st.input.prefix || ''}${st.input.answer}${st.input.unit || ''}</b>. `) + st.input.fb;
            form.querySelector('button').disabled = true;
            form.querySelector('input').disabled = true;
            next.hidden = false;
          } else {
            tries++;
            fe.className = 'w-fb show fb-bad';
            fe.innerHTML = '✕ Not quite — try once more. ' + (st.input.hint || '');
          }
        };
      } else {
        max += 3;
        const opts = U.el('<div class="opts"></div>');
        body.appendChild(opts);
        st.options.forEach((o) => {
          const b = U.el(`<button class="opt"><span>${o.t}</span><span class="opt-score"></span></button>`);
          b.onclick = () => {
            U.$$('.opt', opts).forEach((x) => (x.disabled = true));
            total += o.score;
            b.classList.add(o.score >= 3 ? 'right' : o.score >= 2 ? 'okish' : 'wrong');
            const best = st.options.reduce((a, x) => (x.score > a.score ? x : a), st.options[0]);
            if (best !== o) opts.children[st.options.indexOf(best)].classList.add('right');
            b.querySelector('.opt-score').textContent = '+' + o.score;
            fe.className = 'w-fb show ' + (o.score >= 3 ? 'fb-ok' : o.score >= 2 ? 'fb-info' : 'fb-bad');
            fe.innerHTML = `<b>${o.score >= 3 ? 'Strong decision.' : o.score >= 2 ? 'Reasonable, but not the best.' : 'Risky decision.'}</b> ${o.fb}`;
            next.hidden = false;
            U.sound(o.score >= 2 ? 'click' : 'error');
          };
          opts.appendChild(b);
        });
      }
      next.onclick = () => {
        si++;
        const to = si < cfg.stages.length ? cfg.stages[si].reveal : d.length - 1;
        animateTo(to, () => (si < cfg.stages.length ? showStage() : finish()));
      };
    };
    const animateTo = (to, cb) => {
      let cur = C.ch.limitIdx;
      panel.innerHTML = '<div class="muted sc-wait">▶ Market moving…</div>';
      const stepMs = TM.Store.s.settings.reduceMotion ? 0 : 140;
      if (!stepMs) {
        C.ch.reveal(to);
        return cb();
      }
      anim = setInterval(() => {
        cur++;
        C.ch.reveal(cur);
        if (cur >= to) {
          clearInterval(anim);
          anim = null;
          cb();
        }
      }, stepMs);
    };
    const finish = () => {
      const pct = Math.round((total / Math.max(1, max)) * 100);
      C.ch.setLines(cfg.finalLines || []);
      C.ch.setZones(cfg.finalZones || []);
      C.ch.setMarkers(cfg.finalMarks || []);
      panel.innerHTML = `<div class="sc-end"><div class="sc-score ${pct >= 70 ? 'up' : pct >= 45 ? '' : 'down'}">${pct}%</div><div><b>Decision score</b><p>${cfg.outro || ''}</p></div></div>`;
      done({ ok: true, score: pct });
    };
    C.ch.reveal(cfg.stages[0].reveal);
    // anchor the window so revealed candles fill from the left and the future stays hidden on the right
    C.ch.follow = false;
    C.ch.end = d.length + 8;
    C.ch.req();
    showStage();
    return {
      destroy: () => {
        clearInterval(anim);
        C.ch.destroy();
      },
    };
  };
})();

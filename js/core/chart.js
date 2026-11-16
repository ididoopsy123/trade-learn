/* TRADE MASTERY — canvas candlestick chart with indicators, panes, draggable levels, markers, pan/zoom */
(function () {
  'use strict';
  const U = TM.U;
  const Ind = TM.Ind;
  const COL = {
    bg: '#0d1117',
    grid: '#1a212c',
    axis: '#6b7586',
    text: '#c9d1dc',
    up: '#16c784',
    down: '#f0465a',
    upVol: 'rgba(22,199,132,.28)',
    downVol: 'rgba(240,70,90,.28)',
    ema9: '#f2b84b',
    ema20: '#4d8dff',
    ema50: '#c084fc',
    sma20: '#38c6d9',
    vwap: '#ff8fd0',
    bb: 'rgba(148,163,184,.75)',
    bbFill: 'rgba(148,163,184,.06)',
    cross: 'rgba(200,210,225,.35)',
  };
  TM.ChartColors = COL;

  function niceStep(range, target) {
    const raw = range / target;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const n = raw / mag;
    return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
  }

  class Chart {
    constructor(host, o = {}) {
      this.o = Object.assign(
        {
          height: 340,
          panes: [],
          volume: true,
          overlays: {},
          decimals: null,
          interactive: true,
          rightPad: 6,
          barW: 8,
          type: 'candle',
          timeMode: 'auto',
          legend: true,
          symbol: '',
          zoomButtons: true,
          watermark: 'SIMULATED',
        },
        o
      );
      this.host = host;
      host.classList.add('tmchart');
      host.innerHTML = '';
      this.cv = document.createElement('canvas');
      host.appendChild(this.cv);
      this.ctx = this.cv.getContext('2d');
      this.data = [];
      this.lines = [];
      this.markers = [];
      this.hl = [];
      this.zones = [];
      this.texts = [];
      this.segs = [];
      this.barW = this.o.barW;
      this.end = 0;
      this.follow = true;
      this.mode = 'normal';
      this.hover = null;
      this.calcd = {};
      this.limitIdx = null; // reveal limit (scenarios)
      this._dirty = true;
      if (this.o.zoomButtons && this.o.interactive) this._buttons();
      this._bind();
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(host);
      this.resize();
    }
    destroy() {
      this.dead = true;
      this.ro.disconnect();
      cancelAnimationFrame(this._raf);
    }
    _buttons() {
      const b = U.el(`<div class="chart-btns"><button data-z="out" title="Zoom out" aria-label="Zoom out">−</button><button data-z="in" title="Zoom in" aria-label="Zoom in">+</button><button data-z="fit" title="Jump to latest" aria-label="Jump to latest">⇥</button></div>`);
      b.addEventListener('click', (e) => {
        const z = e.target.closest('button');
        if (!z) return;
        if (z.dataset.z === 'in') this.zoom(1.25);
        else if (z.dataset.z === 'out') this.zoom(0.8);
        else {
          this.follow = true;
          this.end = this.count() + this.o.rightPad;
          this.req();
        }
      });
      this.host.appendChild(b);
    }
    count() {
      return this.limitIdx != null ? Math.min(this.data.length, this.limitIdx + 1) : this.data.length;
    }
    zoom(f, anchorX) {
      const W = this.plotW;
      const ax = anchorX == null ? W : anchorX;
      const idxAt = this.end - (W - ax) / this.barW;
      this.barW = U.clamp(this.barW * f, 2, 48);
      this.end = idxAt + (W - ax) / this.barW;
      this._clampEnd();
      this.req();
    }
    _clampEnd() {
      const n = this.count();
      const vis = this.plotW / this.barW;
      this.end = U.clamp(this.end, Math.min(n, vis * 0.3), n + this.o.rightPad + vis * 0.5);
      this.follow = this.end >= n + this.o.rightPad - 0.5;
    }
    resize() {
      const w = this.host.clientWidth || 300;
      const h = this.o.fill ? this.host.clientHeight || this.o.height : this.o.height;
      const dpr = window.devicePixelRatio || 1;
      this.W = w;
      this.H = h;
      this.cv.style.width = w + 'px';
      this.cv.style.height = h + 'px';
      this.cv.width = Math.round(w * dpr);
      this.cv.height = Math.round(h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.axisW = w < 420 ? 54 : 64;
      this.timeH = 20;
      this.plotW = w - this.axisW;
      if (this.follow) this.end = this.count() + this.o.rightPad;
      if (!this._fitted && this.data.length) this.fit();
      this.draw();
    }
    fit(n) {
      // fit last n bars (or all) into view
      const cnt = this.count();
      const want = n || Math.min(cnt + this.o.rightPad, this.o.fitBars || 120);
      this.barW = U.clamp(this.plotW / want, 2, 26);
      this.end = cnt + this.o.rightPad;
      this.follow = true;
      this._fitted = true;
    }
    setData(d, opts = {}) {
      this.data = d || [];
      this.calc();
      if (opts.fit || !this._fitted) this.fit(opts.fitBars);
      else if (this.follow) this.end = this.count() + this.o.rightPad;
      this.req();
    }
    update() {
      this.calc();
      if (this.follow) this.end = this.count() + this.o.rightPad;
      this.req();
    }
    reveal(idx) {
      this.limitIdx = idx;
      this.calc();
      if (this.follow) this.end = this.count() + this.o.rightPad;
      this.req();
    }
    setOverlays(ov) {
      this.o.overlays = Object.assign({}, this.o.overlays, ov);
      this.calc();
      this.req();
    }
    setPanes(p) {
      this.o.panes = p;
      this.calc();
      this.req();
    }
    setLines(l) {
      this.lines = l || [];
      this.req();
    }
    setMarkers(m) {
      this.markers = m || [];
      this.req();
    }
    setHighlights(h) {
      this.hl = h || [];
      this.req();
    }
    setZones(z) {
      this.zones = z || [];
      this.req();
    }
    setTexts(t) {
      this.texts = t || [];
      this.req();
    }
    setSegments(s) {
      this.segs = s || [];
      this.req();
    }
    calc() {
      const d = this.data.slice(0, this.count());
      const cl = d.map((c) => c.c);
      const ov = this.o.overlays;
      const C = {};
      if (ov.ema9) C.ema9 = Ind.ema(cl, 9);
      if (ov.ema20) C.ema20 = Ind.ema(cl, 20);
      if (ov.ema50) C.ema50 = Ind.ema(cl, 50);
      if (ov.sma20) C.sma20 = Ind.sma(cl, 20);
      if (ov.bb) C.bb = Ind.bb(cl, 20, 2);
      if (ov.vwap) C.vwap = Ind.vwap(d, this.o.vwapAnchor);
      if (this.o.panes.includes('rsi')) C.rsi = Ind.rsi(cl, this.o.rsiPeriod || 14);
      if (this.o.panes.includes('macd')) C.macd = Ind.macd(cl);
      this.calcd = C;
    }
    req() {
      if (this._dirty && this._raf) return;
      this._dirty = true;
      this._raf = requestAnimationFrame(() => {
        this._raf = null;
        this.draw();
      });
    }
    /* coordinate helpers */
    xOf(i) {
      return this.plotW - (this.end - i - 0.5) * this.barW;
    }
    idxOf(x) {
      return Math.floor(this.end - (this.plotW - x) / this.barW);
    }
    yOf(p) {
      return this.mainT + (1 - (p - this.pMin) / (this.pMax - this.pMin)) * this.mainH;
    }
    pOf(y) {
      return this.pMin + (1 - (y - this.mainT) / this.mainH) * (this.pMax - this.pMin);
    }
    dec(p) {
      return this.o.decimals != null ? this.o.decimals : U.decFor(p);
    }
    _layout() {
      const panes = this.o.panes;
      const paneH = this.H < 300 ? 56 : 78;
      this.mainT = 6;
      this.mainH = this.H - this.timeH - this.mainT - panes.length * paneH - 4;
      this.paneRects = panes.map((p, k) => ({ name: p, top: this.mainT + this.mainH + 4 + k * paneH, h: paneH }));
    }
    draw() {
      if (this.dead) return;
      this._dirty = false;
      const c = this.ctx;
      const W = this.W,
        H = this.H;
      this._layout();
      c.fillStyle = COL.bg;
      c.fillRect(0, 0, W, H);
      const n = this.count();
      const d = this.data;
      if (!n) {
        c.fillStyle = COL.axis;
        c.font = '12px Inter, sans-serif';
        c.fillText('Loading chart…', 12, 24);
        return;
      }
      const i0 = Math.max(0, Math.floor(this.end - this.plotW / this.barW) - 1);
      const i1 = Math.min(n - 1, Math.ceil(this.end));
      this.i0 = i0;
      this.i1 = i1;
      // price range
      let mn = Infinity,
        mx = -Infinity;
      for (let i = i0; i <= i1; i++) {
        mn = Math.min(mn, d[i].l);
        mx = Math.max(mx, d[i].h);
      }
      const C = this.calcd;
      ['ema9', 'ema20', 'ema50', 'sma20', 'vwap'].forEach((k) => {
        if (!C[k]) return;
        for (let i = i0; i <= i1; i++)
          if (C[k][i] != null) {
            mn = Math.min(mn, C[k][i]);
            mx = Math.max(mx, C[k][i]);
          }
      });
      if (C.bb)
        for (let i = i0; i <= i1; i++)
          if (C.bb.up[i] != null) {
            mn = Math.min(mn, C.bb.lo[i]);
            mx = Math.max(mx, C.bb.up[i]);
          }
      const span0 = mx - mn || mx * 0.01 || 1;
      this.lines.forEach((l) => {
        if (l.price == null || l.noFit) return;
        if (l.price > mn - span0 * 1.5 && l.price < mx + span0 * 1.5) {
          mn = Math.min(mn, l.price);
          mx = Math.max(mx, l.price);
        }
      });
      this.zones.forEach((z) => {
        if (z.noFit) return;
        mn = Math.min(mn, z.p1, z.p2);
        mx = Math.max(mx, z.p1, z.p2);
      });
      const pad = (mx - mn || mx * 0.01 || 1) * 0.08;
      this.pMin = mn - pad;
      this.pMax = mx + pad;
      const plotW = this.plotW;
      // grid + price axis
      const step = niceStep(this.pMax - this.pMin, Math.max(3, Math.floor(this.mainH / 55)));
      c.font = '10.5px "JetBrains Mono", ui-monospace, monospace';
      c.textAlign = 'left';
      c.textBaseline = 'middle';
      const dp = this.dec(mx);
      for (let p = Math.ceil(this.pMin / step) * step; p <= this.pMax; p += step) {
        const y = Math.round(this.yOf(p)) + 0.5;
        c.strokeStyle = COL.grid;
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(plotW, y);
        c.stroke();
        c.fillStyle = COL.axis;
        c.fillText(U.price(p, dp), plotW + 6, y);
      }
      // watermark
      if (this.o.watermark) {
        c.save();
        c.fillStyle = 'rgba(140,150,170,.07)';
        c.font = `700 ${Math.max(18, Math.min(44, W / 14))}px Sora, Inter, sans-serif`;
        c.textAlign = 'center';
        c.fillText((this.o.symbol ? this.o.symbol + ' · ' : '') + this.o.watermark, plotW / 2, this.mainT + this.mainH / 2);
        c.restore();
      }
      c.save();
      c.beginPath();
      c.rect(0, 0, plotW, H);
      c.clip();
      // zones
      this.zones.forEach((z) => {
        const y1 = this.yOf(Math.max(z.p1, z.p2)),
          y2 = this.yOf(Math.min(z.p1, z.p2));
        const x1 = z.i1 != null ? this.xOf(z.i1) - this.barW / 2 : 0;
        const x2 = z.i2 != null ? this.xOf(z.i2) + this.barW / 2 : plotW;
        c.fillStyle = z.color || 'rgba(77,141,255,.10)';
        c.fillRect(x1, y1, x2 - x1, Math.max(2, y2 - y1));
        if (z.label) {
          c.fillStyle = z.textColor || '#9fb4d8';
          c.font = '600 10.5px Inter, sans-serif';
          c.textAlign = 'left';
          c.textBaseline = 'top';
          c.fillText(z.label, x1 + 6, y1 + 4);
        }
      });
      // highlights
      this.hl.forEach((h) => {
        if (h.i < i0 || h.i > i1) return;
        c.fillStyle = h.color || 'rgba(242,184,75,.16)';
        const x = this.xOf(h.i);
        c.fillRect(x - this.barW / 2, this.mainT, this.barW, this.mainH);
      });
      // volume
      if (this.o.volume) {
        let vmx = 0;
        for (let i = i0; i <= i1; i++) vmx = Math.max(vmx, d[i].v);
        const vh = this.mainH * 0.2;
        for (let i = i0; i <= i1; i++) {
          const k = d[i];
          const h = vmx ? (k.v / vmx) * vh : 0;
          c.fillStyle = k.c >= k.o ? COL.upVol : COL.downVol;
          const bw = Math.max(1, this.barW * 0.7);
          c.fillRect(this.xOf(i) - bw / 2, this.mainT + this.mainH - h, bw, h);
        }
      }
      // bollinger
      if (C.bb) {
        c.beginPath();
        let started = false;
        for (let i = i0; i <= i1; i++) {
          if (C.bb.up[i] == null) continue;
          const x = this.xOf(i);
          if (!started) {
            c.moveTo(x, this.yOf(C.bb.up[i]));
            started = true;
          } else c.lineTo(x, this.yOf(C.bb.up[i]));
        }
        for (let i = i1; i >= i0; i--) if (C.bb.lo[i] != null) c.lineTo(this.xOf(i), this.yOf(C.bb.lo[i]));
        c.closePath();
        c.fillStyle = COL.bbFill;
        c.fill();
        this._poly(C.bb.up, COL.bb, 1);
        this._poly(C.bb.lo, COL.bb, 1);
        this._poly(C.bb.mid, COL.bb, 1, [3, 3]);
      }
      // candles / line
      if (this.o.type === 'line') {
        c.beginPath();
        for (let i = i0; i <= i1; i++) {
          const x = this.xOf(i),
            y = this.yOf(d[i].c);
          i === i0 ? c.moveTo(x, y) : c.lineTo(x, y);
        }
        c.strokeStyle = '#7fb0ff';
        c.lineWidth = 1.8;
        c.stroke();
      } else {
        const bw = Math.max(1, this.barW * 0.72);
        for (let i = i0; i <= i1; i++) {
          const k = d[i];
          const up = k.c >= k.o;
          const x = Math.round(this.xOf(i)) + 0.5;
          const col = k.color || (up ? COL.up : COL.down);
          c.strokeStyle = col;
          c.fillStyle = col;
          c.lineWidth = 1;
          c.beginPath();
          c.moveTo(x, this.yOf(k.h));
          c.lineTo(x, this.yOf(k.l));
          c.stroke();
          const yo = this.yOf(k.o),
            yc = this.yOf(k.c);
          const top = Math.min(yo, yc),
            bh = Math.max(1, Math.abs(yc - yo));
          c.fillRect(x - bw / 2, top, bw, bh);
        }
      }
      // overlays
      if (C.ema9) this._poly(C.ema9, COL.ema9, 1.4);
      if (C.ema20) this._poly(C.ema20, COL.ema20, 1.4);
      if (C.ema50) this._poly(C.ema50, COL.ema50, 1.5);
      if (C.sma20) this._poly(C.sma20, COL.sma20, 1.4);
      if (C.vwap) this._poly(C.vwap, COL.vwap, 1.6, [6, 3]);
      // trendline segments
      this.segs.forEach((s) => {
        let x1 = this.xOf(s.i1),
          y1 = this.yOf(s.p1),
          x2 = this.xOf(s.i2),
          y2 = this.yOf(s.p2);
        if (s.extend) {
          const k = (y2 - y1) / (x2 - x1 || 1);
          const xe = plotW;
          y2 = y2 + k * (xe - x2);
          x2 = xe;
        }
        c.strokeStyle = s.color || '#f2b84b';
        c.lineWidth = s.width || 1.6;
        c.setLineDash(s.dash || []);
        c.beginPath();
        c.moveTo(x1, y1);
        c.lineTo(x2, y2);
        c.stroke();
        c.setLineDash([]);
      });
      // markers
      this.markers.forEach((m) => {
        if (m.i < i0 || m.i > i1 || m.i >= n) return;
        const k = d[m.i];
        const x = this.xOf(m.i);
        const s = Math.max(5, Math.min(8, this.barW * 0.6));
        c.font = '600 10px Inter, sans-serif';
        c.textAlign = 'center';
        if (m.kind === 'buy' || m.kind === 'up') {
          const y = (m.price != null ? this.yOf(m.price) : this.yOf(k.l)) + 6;
          c.fillStyle = m.color || COL.up;
          c.beginPath();
          c.moveTo(x, y);
          c.lineTo(x - s, y + s * 1.4);
          c.lineTo(x + s, y + s * 1.4);
          c.closePath();
          c.fill();
          if (m.text) {
            c.textBaseline = 'top';
            c.fillText(m.text, x, y + s * 1.6);
          }
        } else if (m.kind === 'sell' || m.kind === 'down') {
          const y = (m.price != null ? this.yOf(m.price) : this.yOf(k.h)) - 6;
          c.fillStyle = m.color || COL.down;
          c.beginPath();
          c.moveTo(x, y);
          c.lineTo(x - s, y - s * 1.4);
          c.lineTo(x + s, y - s * 1.4);
          c.closePath();
          c.fill();
          if (m.text) {
            c.textBaseline = 'bottom';
            c.fillText(m.text, x, y - s * 1.6);
          }
        } else {
          const y = this.yOf(m.price != null ? m.price : k.c);
          c.fillStyle = m.color || '#f2b84b';
          c.beginPath();
          c.arc(x, y, m.r || 4.5, 0, Math.PI * 2);
          c.fill();
          if (m.ring) {
            c.strokeStyle = m.color || '#f2b84b';
            c.lineWidth = 2;
            c.beginPath();
            c.arc(x, y, (m.r || 4.5) + 5, 0, Math.PI * 2);
            c.stroke();
          }
          if (m.text) {
            c.textBaseline = 'bottom';
            c.fillText(m.text, x, y - 9);
          }
        }
      });
      // texts
      this.texts.forEach((t) => {
        if (t.i < i0 - 30 || t.i > i1 + 30) return;
        c.font = '600 11px Inter, sans-serif';
        c.textAlign = t.align || 'center';
        c.textBaseline = 'middle';
        const x = this.xOf(t.i),
          y = this.yOf(t.price);
        const w = c.measureText(t.text).width + 10;
        c.fillStyle = 'rgba(13,17,23,.82)';
        const bx = t.align === 'left' ? x : t.align === 'right' ? x - w : x - w / 2;
        c.fillRect(bx, y - 9, w, 18);
        c.fillStyle = t.color || '#e5e9f0';
        c.fillText(t.text, t.align === 'left' ? x + 5 : t.align === 'right' ? x - 5 : x, y);
      });
      c.restore();
      // horizontal lines (entry / stop / target / levels)
      this.lines.forEach((l) => {
        if (l.price == null || l.price < this.pMin || l.price > this.pMax) return;
        const y = Math.round(this.yOf(l.price)) + 0.5;
        c.strokeStyle = l.color || '#4d8dff';
        c.lineWidth = l.width || 1.2;
        c.setLineDash(l.dash || (l.draggable ? [6, 4] : []));
        c.beginPath();
        const x1 = l.i1 != null ? this.xOf(l.i1) : 0;
        c.moveTo(x1, y);
        c.lineTo(plotW, y);
        c.stroke();
        c.setLineDash([]);
        // label chip
        const txt = (l.label ? l.label + ' ' : '') + U.price(l.price, this.dec(l.price));
        c.font = '600 10.5px "JetBrains Mono", monospace';
        const tw = c.measureText(txt).width + 10;
        c.fillStyle = l.color || '#4d8dff';
        const lx = Math.max(x1 + 2, plotW - tw - 4);
        c.fillRect(lx, y - 9, tw, 18);
        c.fillStyle = '#0b0e13';
        c.textAlign = 'left';
        c.textBaseline = 'middle';
        c.fillText(txt, lx + 5, y);
        if (l.draggable) {
          c.fillStyle = l.color;
          c.fillRect(plotW - 3, y - 6, 3, 12);
        }
      });
      // last price tag
      const last = d[n - 1];
      if (last) {
        const y = this.yOf(last.c);
        const up = last.c >= last.o;
        c.setLineDash([2, 3]);
        c.strokeStyle = up ? COL.up : COL.down;
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(plotW, y);
        c.stroke();
        c.setLineDash([]);
        c.fillStyle = up ? COL.up : COL.down;
        c.fillRect(plotW, y - 9, this.axisW, 18);
        c.fillStyle = '#071009';
        c.font = '700 10.5px "JetBrains Mono", monospace';
        c.textAlign = 'left';
        c.textBaseline = 'middle';
        c.fillText(U.price(last.c, this.dec(last.c)), plotW + 5, y);
      }
      // panes
      this.paneRects.forEach((pr) => this._pane(pr, i0, i1));
      // time axis
      this._timeAxis(i0, i1);
      // crosshair + legend
      this._crosshair();
      if (this.o.legend) this._legend();
      if (this.mode === 'level') {
        c.fillStyle = 'rgba(242,184,75,.9)';
        c.font = '600 11px Inter, sans-serif';
        c.textAlign = 'right';
        c.textBaseline = 'top';
        c.fillText('Click the chart to place a level', plotW - 8, this.mainT + 22);
      }
    }
    _poly(arr, color, w, dash) {
      const c = this.ctx;
      c.strokeStyle = color;
      c.lineWidth = w;
      c.setLineDash(dash || []);
      c.beginPath();
      let s = false;
      for (let i = this.i0; i <= this.i1; i++) {
        if (arr[i] == null) {
          s = false;
          continue;
        }
        const x = this.xOf(i),
          y = this.yOf(arr[i]);
        if (!s) {
          c.moveTo(x, y);
          s = true;
        } else c.lineTo(x, y);
      }
      c.stroke();
      c.setLineDash([]);
    }
    _pane(pr, i0, i1) {
      const c = this.ctx,
        C = this.calcd;
      c.fillStyle = '#0b0f15';
      c.fillRect(0, pr.top, this.W, pr.h);
      c.strokeStyle = COL.grid;
      c.beginPath();
      c.moveTo(0, pr.top + 0.5);
      c.lineTo(this.W, pr.top + 0.5);
      c.stroke();
      c.font = '600 10px Inter, sans-serif';
      c.textAlign = 'left';
      c.textBaseline = 'top';
      if (pr.name === 'rsi' && C.rsi) {
        const Y = (v) => pr.top + 4 + (1 - v / 100) * (pr.h - 8);
        c.fillStyle = 'rgba(167,139,250,.07)';
        c.fillRect(0, Y(70), this.plotW, Y(30) - Y(70));
        [70, 30].forEach((lv) => {
          c.strokeStyle = lv === 70 ? 'rgba(240,70,90,.45)' : 'rgba(22,199,132,.45)';
          c.setLineDash([4, 3]);
          c.beginPath();
          c.moveTo(0, Y(lv));
          c.lineTo(this.plotW, Y(lv));
          c.stroke();
          c.setLineDash([]);
          c.fillStyle = COL.axis;
          c.fillText(String(lv), this.plotW + 6, Y(lv) - 6);
        });
        c.save();
        c.beginPath();
        c.rect(0, pr.top, this.plotW, pr.h);
        c.clip();
        c.strokeStyle = '#a78bfa';
        c.lineWidth = 1.4;
        c.beginPath();
        let s = false;
        for (let i = i0; i <= i1; i++) {
          if (C.rsi[i] == null) continue;
          const x = this.xOf(i),
            y = Y(C.rsi[i]);
          s ? c.lineTo(x, y) : c.moveTo(x, y);
          s = true;
        }
        c.stroke();
        c.restore();
        const lv = C.rsi[Math.min(i1, this.count() - 1)];
        c.fillStyle = '#a78bfa';
        c.fillText('RSI(14) ' + (lv != null ? lv.toFixed(1) : '–'), 6, pr.top + 4);
      }
      if (pr.name === 'macd' && C.macd) {
        const M = C.macd;
        let mx = 0;
        for (let i = i0; i <= i1; i++) {
          [M.macd[i], M.signal[i], M.hist[i]].forEach((v) => v != null && (mx = Math.max(mx, Math.abs(v))));
        }
        mx = mx || 1;
        const mid = pr.top + pr.h / 2;
        const Y = (v) => mid - (v / mx) * (pr.h / 2 - 6);
        c.save();
        c.beginPath();
        c.rect(0, pr.top, this.plotW, pr.h);
        c.clip();
        const bw = Math.max(1, this.barW * 0.6);
        for (let i = i0; i <= i1; i++) {
          const h = M.hist[i];
          if (h == null) continue;
          c.fillStyle = h >= 0 ? 'rgba(22,199,132,.55)' : 'rgba(240,70,90,.55)';
          const y = Y(h);
          c.fillRect(this.xOf(i) - bw / 2, Math.min(y, mid), bw, Math.abs(y - mid));
        }
        [
          [M.macd, '#4d8dff'],
          [M.signal, '#f2b84b'],
        ].forEach(([arr, col]) => {
          c.strokeStyle = col;
          c.lineWidth = 1.3;
          c.beginPath();
          let s = false;
          for (let i = i0; i <= i1; i++) {
            if (arr[i] == null) continue;
            s ? c.lineTo(this.xOf(i), Y(arr[i])) : c.moveTo(this.xOf(i), Y(arr[i]));
            s = true;
          }
          c.stroke();
        });
        c.restore();
        c.fillStyle = '#4d8dff';
        c.fillText('MACD(12,26,9)', 6, pr.top + 4);
        c.fillStyle = '#f2b84b';
        c.fillText('signal', 96, pr.top + 4);
      }
    }
    _timeAxis(i0, i1) {
      const c = this.ctx;
      const y = this.H - this.timeH;
      c.fillStyle = '#0b0f15';
      c.fillRect(0, y, this.W, this.timeH);
      c.fillStyle = COL.axis;
      c.font = '10px "JetBrains Mono", monospace';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      const d = this.data;
      if (d.length < 2) return;
      const interval = d[1].t - d[0].t;
      const daily = interval >= 86000 || this.o.timeMode === 'day';
      const every = Math.max(1, Math.ceil(90 / this.barW));
      for (let i = Math.ceil(i0 / every) * every; i <= i1; i += every) {
        if (!d[i]) continue;
        const x = this.xOf(i);
        if (x < 20 || x > this.plotW - 20) continue;
        c.fillText(daily ? U.md(d[i].t) : U.hm(d[i].t), x, y + this.timeH / 2);
      }
    }
    _crosshair() {
      const h = this.hover;
      if (!h || !this.o.interactive) return;
      const c = this.ctx;
      c.strokeStyle = COL.cross;
      c.setLineDash([3, 3]);
      c.lineWidth = 1;
      const i = this.idxOf(h.x);
      const x = this.xOf(i);
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, this.H - this.timeH);
      c.stroke();
      if (h.y < this.mainT + this.mainH) {
        c.beginPath();
        c.moveTo(0, h.y);
        c.lineTo(this.plotW, h.y);
        c.stroke();
        c.setLineDash([]);
        const p = this.pOf(h.y);
        c.fillStyle = '#2b3546';
        c.fillRect(this.plotW, h.y - 9, this.axisW, 18);
        c.fillStyle = '#e5e9f0';
        c.font = '10.5px "JetBrains Mono", monospace';
        c.textAlign = 'left';
        c.textBaseline = 'middle';
        c.fillText(U.price(p, this.dec(p)), this.plotW + 5, h.y);
      }
      c.setLineDash([]);
      const k = this.data[i];
      if (k && i < this.count()) {
        const interval = this.data.length > 1 ? this.data[1].t - this.data[0].t : 60;
        const lbl = interval >= 86000 ? U.dow(k.t) + ' ' + U.md(k.t) : U.md(k.t) + ' ' + U.hm(k.t);
        c.font = '10px "JetBrains Mono", monospace';
        const tw = c.measureText(lbl).width + 12;
        c.fillStyle = '#2b3546';
        c.fillRect(x - tw / 2, this.H - this.timeH, tw, this.timeH);
        c.fillStyle = '#e5e9f0';
        c.textAlign = 'center';
        c.fillText(lbl, x, this.H - this.timeH / 2);
      }
    }
    _legend() {
      const c = this.ctx;
      const n = this.count();
      let i = this.hover ? this.idxOf(this.hover.x) : n - 1;
      if (i < 0 || i >= n) i = n - 1;
      const k = this.data[i];
      if (!k) return;
      const dp = this.dec(k.c);
      const ch = ((k.c - k.o) / k.o) * 100;
      c.font = '600 11px "JetBrains Mono", monospace';
      c.textAlign = 'left';
      c.textBaseline = 'top';
      let x = 8;
      const y = this.mainT + 4;
      const seg = (t, col) => {
        c.fillStyle = col;
        c.fillText(t, x, y);
        x += c.measureText(t).width + 8;
      };
      if (this.o.symbol) seg(this.o.symbol, '#e5e9f0');
      const col = k.c >= k.o ? COL.up : COL.down;
      if (this.W > 380) {
        seg('O ' + U.price(k.o, dp), col);
        seg('H ' + U.price(k.h, dp), col);
        seg('L ' + U.price(k.l, dp), col);
      }
      seg('C ' + U.price(k.c, dp), col);
      seg(U.pct(ch), col);
      // overlay legend line 2
      x = 8;
      const y2 = y + 15;
      c.font = '600 10px Inter, sans-serif';
      const C = this.calcd;
      const ov = [
        ['ema9', 'EMA 9'],
        ['ema20', 'EMA 20'],
        ['ema50', 'EMA 50'],
        ['sma20', 'SMA 20'],
        ['vwap', 'VWAP'],
      ];
      ov.forEach(([key, name]) => {
        if (!C[key]) return;
        c.fillStyle = COL[key];
        const v = C[key][i];
        const t = name + (v != null ? ' ' + U.price(v, dp) : '');
        c.fillText(t, x, y2);
        x += c.measureText(t).width + 10;
      });
      if (C.bb) {
        c.fillStyle = COL.bb;
        c.fillText('BB(20,2)', x, y2);
      }
    }
    _bind() {
      if (!this.o.interactive) return;
      const cv = this.cv;
      let down = null,
        drag = null,
        moved = 0;
      const pos = (e) => {
        const r = cv.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
      };
      const nearLine = (p) => {
        let best = null,
          bd = 9;
        this.lines.forEach((l) => {
          if (!l.draggable || l.price == null) return;
          const dd = Math.abs(this.yOf(l.price) - p.y);
          if (dd < bd) {
            bd = dd;
            best = l;
          }
        });
        return best;
      };
      cv.addEventListener('pointerdown', (e) => {
        const p = pos(e);
        down = { x: p.x, y: p.y, end: this.end, t: Date.now() };
        moved = 0;
        drag = nearLine(p);
        if (drag) {
          cv.setPointerCapture(e.pointerId);
          e.preventDefault();
        }
      });
      cv.addEventListener('pointermove', (e) => {
        const p = pos(e);
        this.hover = p;
        if (down) {
          moved = Math.max(moved, Math.abs(p.x - down.x) + Math.abs(p.y - down.y));
          if (drag) {
            const dec = this.dec(drag.price);
            drag.price = U.round(this.pOf(p.y), dec);
            this.o.onLineDrag && this.o.onLineDrag(drag.id, drag.price, false);
          } else if (e.pointerType === 'mouse' || Math.abs(p.x - down.x) > Math.abs(p.y - down.y)) {
            this.end = down.end - (p.x - down.x) / this.barW;
            this._clampEnd();
          }
        } else {
          cv.style.cursor = nearLine(p) ? 'ns-resize' : this.mode === 'level' ? 'copy' : 'crosshair';
        }
        this.req();
      });
      const up = (e) => {
        if (!down) return;
        const p = pos(e);
        if (drag) {
          this.o.onLineDrag && this.o.onLineDrag(drag.id, drag.price, true);
        } else if (moved < 6) {
          const i = this.idxOf(p.x);
          const price = this.pOf(p.y);
          if (p.y < this.mainT + this.mainH) {
            if (this.mode === 'level' && this.o.onPriceClick) this.o.onPriceClick(price);
            else if (this.o.onCandleClick && i >= 0 && i < this.count()) this.o.onCandleClick(i, this.data[i], price);
            else if (this.o.onPriceClick) this.o.onPriceClick(price);
          }
        }
        down = null;
        drag = null;
        this.req();
      };
      cv.addEventListener('pointerup', up);
      cv.addEventListener('pointercancel', () => {
        down = null;
        drag = null;
      });
      cv.addEventListener('pointerleave', () => {
        this.hover = null;
        this.req();
      });
      cv.addEventListener(
        'wheel',
        (e) => {
          e.preventDefault();
          const p = pos(e);
          if (e.ctrlKey || Math.abs(e.deltaY) >= Math.abs(e.deltaX)) this.zoom(e.deltaY < 0 ? 1.12 : 0.89, p.x);
          else {
            this.end += e.deltaX / this.barW;
            this._clampEnd();
            this.req();
          }
        },
        { passive: false }
      );
    }
  }
  TM.Chart = Chart;
})();

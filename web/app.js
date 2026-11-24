/* app.js: the interface of the Campus Route Finder. The routing itself is in engine.js. */
(function () {
  'use strict';

  const D = window.CAMPUS;
  const E = window.Engine.init(D);
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const icon = (id) => '<svg><use href="#' + id + '"/></svg>';
  const N = E.count();
  const body = document.body;
  const desktop = () => window.matchMedia('(min-width: 900px)').matches;

  // ---------- precomputed lookups ----------
  const sheetVerts = D.sheets.map(() => []);
  const sheetEdges = D.sheets.map(() => []);
  const sheetBox = D.sheets.map(() => ({ x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 }));
  for (let v = 0; v < N; v++) {
    const si = D.sheet[v], b = sheetBox[si];
    sheetVerts[si].push(v);
    b.x0 = Math.min(b.x0, D.x[v]); b.x1 = Math.max(b.x1, D.x[v]);
    b.y0 = Math.min(b.y0, D.y[v]); b.y1 = Math.max(b.y1, D.y[v]);
  }
  for (let k = 0; k < D.ea.length; k++) {
    if (D.sheet[D.ea[k]] === D.sheet[D.eb[k]]) sheetEdges[D.sheet[D.ea[k]]].push(k);
  }
  const campusSheet = D.sheets.findIndex((s) => s[0] === 'CAMPUS');
  const buildingCodes = D.buildings.map((b) => b[0]);
  const buildingSheets = D.buildings.map((b, bi) =>
    D.sheets.map((s, si) => ({ si, floor: s[2], name: s[3], bi: s[1] }))
      .filter((s) => s.bi === bi).sort((a, b2) => a.floor - b2.floor));
  const bldgOf = (v) => D.sheets[D.sheet[v]][1];
  const typeName = (v) => D.types[D.type[v]];
  const SHORT_FLOOR = { Garden: 'G', Plaza: 'P', First: '1', Second: '2', Third: '3' };

  function typeIcon(v) {
    switch (typeName(v)) {
      case 'RESTROOM': return 'i-restroom';
      case 'ELEVATOR': return 'i-elevator';
      case 'STAIRS': return 'i-stairs';
      case 'ENTRANCE': return 'i-door';
      case 'CLASSROOM': return 'i-class';
      case 'CAFE': case 'RESTAURANT': case 'VENDOR': return 'i-food';
      case 'OUTDOOR': return 'i-outdoor';
      case 'BUILDING': return 'i-building';
      default: return 'i-pin';
    }
  }
  function vClass(v) {
    switch (typeName(v)) {
      case 'RESTROOM': return 'restroom';
      case 'ELEVATOR': return 'elevator';
      case 'STAIRS': return 'stairs';
      case 'ENTRANCE': return 'entrance';
      case 'CAFE': case 'RESTAURANT': case 'VENDOR': return 'food';
      case 'OTHER': return 'other';
      default: return '';
    }
  }

  // ---------- state ----------
  const S = {
    from: -1, to: -1, sel: -1, mode: 'fast', routes: null, R: null,
    sheet: -1, browse: -1, view: 'campus', playing: false, nav: false, p: 0, last: 0, dir: false
  };

  // ---------- what part of the screen is not covered by the floating panels ----------
  function insets() {
    if (S.nav) {
      return desktop() ? { t: 110, b: 100, l: 432, r: 80 } : { t: 110, b: 100, l: 10, r: 66 };
    }
    if (desktop()) return { t: 64, b: 24, l: 432, r: 80 };
    return { t: topHeight + 4, b: sheetShown + 8, l: 10, r: 66 };
  }

  // ---------- pan and zoom for an svg ----------
  // While a finger moves (or the map glides to a new place) the svg is only moved with a CSS transform,
  // which the phone's graphics chip does for free. The real viewBox is set once at the end, so the
  // big floor plan picture is drawn again only then. This is what keeps the map smooth on phones.
  function PanZoom(svg) {
    this.svg = svg; this.vb = { x: 0, y: 0, w: 100, h: 100 }; this.base = null; this.moved = false;
    this.g = null;         // gesture in progress: { s, tx, ty, r } (scale, shift in px, svg rectangle)
    this.pending = null;   // a glide in progress: the viewBox it ends at, and its timer
    const self = this;
    let wheelF = 1, wheelP = null, wheelQueued = false;
    svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      self.finish();
      wheelF *= Math.exp(e.deltaY * 0.0016); wheelP = self.toUser(e.clientX, e.clientY);
      if (!wheelQueued) {
        wheelQueued = true;
        requestAnimationFrame(() => { wheelQueued = false; self.zoomAt(wheelP.x, wheelP.y, wheelF); wheelF = 1; });
      }
      self.userMoved = performance.now();
    }, { passive: false });

    const ptr = new Map();
    let pinch = null, pan = null, queued = false;
    function show() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        if (self.g) svg.style.transform = 'translate(' + self.g.tx + 'px,' + self.g.ty + 'px) scale(' + self.g.s + ')';
      });
    }
    function startGesture() {
      if (self.g) return;
      self.finish();
      self.g = { s: 1, tx: 0, ty: 0, r: svg.getBoundingClientRect() };
      svg.classList.add('drag');
    }
    function startPinch() {
      const pts = Array.from(ptr.values()), a = pts[0], b = pts[1], g = self.g;
      const mx = (a.x + b.x) / 2 - g.r.left, my = (a.y + b.y) / 2 - g.r.top;
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, s0: g.s, lx: (mx - g.tx) / g.s, ly: (my - g.ty) / g.s };
      pan = null;
    }
    function startPan(p) { const g = self.g; pan = { x: p.x, y: p.y, tx: g.tx, ty: g.ty, moved: false }; }
    svg.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
      startGesture();
      if (ptr.size === 2) { startPinch(); self.moved = true; }
      else if (ptr.size === 1) { startPan(ptr.get(e.pointerId)); self.moved = false; }
    });
    window.addEventListener('pointermove', (e) => {
      if (!ptr.has(e.pointerId) || !self.g) return;
      ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const g = self.g;
      if (pinch && ptr.size >= 2) {
        const pts = Array.from(ptr.values()), a = pts[0], b = pts[1];
        const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        const mx = (a.x + b.x) / 2 - g.r.left, my = (a.y + b.y) / 2 - g.r.top;
        const bw = self.base ? self.base.w : self.vb.w;
        const sMin = self.vb.w / (bw * 3), sMax = self.vb.w / (bw * 0.03);
        g.s = Math.min(sMax, Math.max(sMin, pinch.s0 * d / pinch.d));
        g.tx = mx - g.s * pinch.lx; g.ty = my - g.s * pinch.ly;     // the point under the fingers stays under them
        self.userMoved = performance.now();
        show();
        return;
      }
      if (!pan) return;
      const dx = e.clientX - pan.x, dy = e.clientY - pan.y;
      if (!pan.moved && Math.hypot(dx, dy) < 5) return;
      pan.moved = true; self.moved = true;
      g.tx = pan.tx + dx; g.ty = pan.ty + dy;
      self.userMoved = performance.now();
      show();
    });
    function lift(e) {
      if (!ptr.has(e.pointerId)) return;
      ptr.delete(e.pointerId);
      if (ptr.size < 2) pinch = null;
      if (ptr.size === 1) startPan(Array.from(ptr.values())[0]);   // one finger stays down: keep panning
      if (ptr.size === 0) {
        pan = null;
        self.commit();
        setTimeout(() => { self.moved = false; }, 0);
      }
    }
    window.addEventListener('pointerup', lift);
    window.addEventListener('pointercancel', lift);
    svg.addEventListener('dblclick', (e) => { self.finish(); const p = self.toUser(e.clientX, e.clientY); self.zoomAt(p.x, p.y, 0.55); });
  }
  // map from the svg's own rectangle (no CSS transform) to drawing units
  PanZoom.prototype.frame = function (r) {
    r = r || this.svg.getBoundingClientRect();
    const k = Math.min(r.width / this.vb.w, r.height / this.vb.h) || 1;
    return { r: r, k: k, ox: this.vb.x - (r.width / k - this.vb.w) / 2, oy: this.vb.y - (r.height / k - this.vb.h) / 2 };
  };
  PanZoom.prototype.scale = function () { return this.frame().k; };
  PanZoom.prototype.toUser = function (cx, cy) {
    const f = this.frame();
    return { x: f.ox + (cx - f.r.left) / f.k, y: f.oy + (cy - f.r.top) / f.k };
  };
  // end of a finger gesture: turn the CSS transform into the real viewBox
  PanZoom.prototype.commit = function () {
    const g = this.g; if (!g) return;
    this.g = null;
    this.svg.classList.remove('drag');
    if (g.s !== 1 || g.tx || g.ty) {
      const f = this.frame(g.r);
      this.vb = { x: f.ox + (-g.tx / g.s) / f.k, y: f.oy + (-g.ty / g.s) / f.k, w: g.r.width / (g.s * f.k), h: g.r.height / (g.s * f.k) };
    }
    this.svg.style.transform = '';
    this.apply();
  };
  // finish a glide or a gesture right away (before anything else moves the map)
  PanZoom.prototype.finish = function () {
    if (this.g) this.commit();
    if (this.pending) {
      clearTimeout(this.pending.timer);
      const t = this.pending.target;
      this.pending = null;
      this.svg.style.transition = 'none';
      this.svg.style.transform = '';
      this.vb = t; this.apply();
    }
  };
  PanZoom.prototype.apply = function () {
    this.svg.setAttribute('viewBox', [this.vb.x, this.vb.y, this.vb.w, this.vb.h].join(' '));
    if (this.onApply) this.onApply();
  };
  PanZoom.prototype.zoomAt = function (px, py, f) {
    const b = this.base; if (!b) return;
    this.finish();
    const w = Math.min(Math.max(this.vb.w * f, b.w * 0.03), b.w * 3), g = w / this.vb.w;
    this.vb.x = px - (px - this.vb.x) * g; this.vb.y = py - (py - this.vb.y) * g;
    this.vb.h *= g; this.vb.w = w; this.apply();
  };
  PanZoom.prototype.zoomCenter = function (f) {
    this.finish();
    const ins = insets(), r = this.svg.getBoundingClientRect(), b = this.base;
    if (!b) return;
    const p = this.toUser(r.left + ins.l + (r.width - ins.l - ins.r) / 2, r.top + ins.t + (r.height - ins.t - ins.b) / 2);
    const w = Math.min(Math.max(this.vb.w * f, b.w * 0.03), b.w * 3), g = w / this.vb.w;
    this.go({ x: p.x - (p.x - this.vb.x) * g, y: p.y - (p.y - this.vb.y) * g, w: w, h: this.vb.h * g }, true, 220);
  };
  // the viewBox that shows box in the part of the screen not covered by panels
  PanZoom.prototype.target = function (box, padFrac) {
    const r = this.svg.getBoundingClientRect(), ins = insets();
    const W = r.width || window.innerWidth, H = r.height || window.innerHeight;
    const availW = Math.max(80, W - ins.l - ins.r), availH = Math.max(80, H - ins.t - ins.b);
    const pad = Math.max(box.x1 - box.x0, box.y1 - box.y0) * (padFrac === undefined ? 0.08 : padFrac) + 4;
    const bw = box.x1 - box.x0 + pad * 2, bh = box.y1 - box.y0 + pad * 2;
    const k = Math.min(availW / bw, availH / bh);
    const cx = (box.x0 + box.x1) / 2, cy = (box.y0 + box.y1) / 2;
    return { x: cx - (ins.l + availW / 2) / k, y: cy - (ins.t + availH / 2) / k, w: W / k, h: H / k };
  };
  PanZoom.prototype.fit = function (box, animate, padFrac) {
    this.fitBox = box;
    this.go(this.target(box, padFrac), animate);
  };
  // glide to a viewBox: a CSS transition of the transform, then the real viewBox once at the end
  PanZoom.prototype.go = function (target, animate, ms) {
    this.finish();
    const r = this.svg.getBoundingClientRect();
    const hidden = !r.width || getComputedStyle(this.svg.parentElement).visibility === 'hidden';
    if (!animate || hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.vb = target; this.apply(); return;
    }
    const f = this.frame(r), s = r.width / (target.w * f.k);
    const tx = -s * (target.x - f.ox) * f.k, ty = -s * (target.y - f.oy) * f.k;
    const svg = this.svg, self = this;
    ms = ms || 420;
    svg.style.transition = 'none';
    svg.style.transform = 'translate(0px,0px) scale(1)';
    void svg.getBoundingClientRect();                     // start the transition from here
    svg.style.transition = 'transform ' + ms + 'ms cubic-bezier(.2,.8,.2,1)';
    svg.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + s + ')';
    this.pending = { target: target, timer: setTimeout(() => self.finish(), ms + 20) };
  };
  PanZoom.prototype.reset = function () { if (this.fitBox) this.fit(this.fitBox, true); };

  const campusSvg = $('campusSvg'), floorSvg = $('floorSvg');
  const pzC = new PanZoom(campusSvg), pzF = new PanZoom(floorSvg);
  const pzNow = () => (S.view === 'campus' ? pzC : pzF);

  // the real drawing of the sheet (rendered from the floor plan PDF) goes under the route
  function planImage(si) {
    const id = D.sheets[si][0], size = window.PLANS && window.PLANS[id];
    if (!size) return '';
    return '<image class="plan-img" href="plans/' + id + '.webp" x="0" y="0" width="' + size[0] + '" height="' + size[1] + '" preserveAspectRatio="none"/>';
  }

  // ---------- views: the campus or one floor of a building ----------
  function setView(view) {
    if (S.view === view) return;
    S.view = view;
    body.setAttribute('data-view', view);
  }

  // ---------- campus map ----------
  let campusU = 1, campusBox = null;
  function pointOf(v) {
    if (D.sheet[v] === campusSheet) return { x: D.x[v], y: D.y[v] };
    const a = D.anchors[buildingCodes[bldgOf(v)]];
    return a ? { x: a[0], y: a[1] } : { x: D.x[sheetVerts[campusSheet][0]], y: D.y[sheetVerts[campusSheet][0]] };
  }

  function drawCampus() {
    const b = Object.assign({}, sheetBox[campusSheet]);
    Object.keys(D.anchors).forEach((k) => {
      b.x0 = Math.min(b.x0, D.anchors[k][0]); b.x1 = Math.max(b.x1, D.anchors[k][0]);
      b.y0 = Math.min(b.y0, D.anchors[k][1]); b.y1 = Math.max(b.y1, D.anchors[k][1]);
    });
    campusBox = b;
    const u = campusU = Math.max(b.x1 - b.x0, b.y1 - b.y0) / 760;
    let d = '';
    sheetEdges[campusSheet].forEach((k) => {
      d += 'M' + D.x[D.ea[k]] + ' ' + D.y[D.ea[k]] + 'L' + D.x[D.eb[k]] + ' ' + D.y[D.eb[k]];
    });
    let h = '<g id="cBase">' + planImage(campusSheet);
    h += '<path class="road-edge" d="' + d + '" stroke-width="' + 13 * u + '"/>';
    h += '<path class="road" d="' + d + '" stroke-width="' + 10 * u + '"/>';
    sheetVerts[campusSheet].forEach((v) => {
      if (D.keys[v].indexOf('CAMPUS_O_D_') === 0 || E.isWaypoint(v)) return;
      if (typeName(v) === 'ENTRANCE') {
        h += '<rect class="gate" data-v="' + v + '" x="' + (D.x[v] - 6 * u) + '" y="' + (D.y[v] - 6 * u) + '" width="' + 12 * u + '" height="' + 12 * u + '" transform="rotate(45 ' + D.x[v] + ' ' + D.y[v] + ')"/>';
        h += '<text class="gate-name" x="' + (D.x[v] + 11 * u) + '" y="' + (D.y[v] + 4 * u) + '" style="font-size:' + 12 * u + 'px">' + esc(E.name(v).replace(/ Entrance$/, '')) + '</text>';
      } else if (typeName(v) !== 'OUTDOOR') {
        h += '<circle class="v other" data-v="' + v + '" cx="' + D.x[v] + '" cy="' + D.y[v] + '" r="' + 3.2 * u + '"/>';
      }
    });
    buildingCodes.forEach((code, bi) => {
      const a = D.anchors[code]; if (!a) return;
      const w = Math.max(68, code.length * 17 + 30) * u, hh = 38 * u;
      h += '<g class="bld" data-b="' + bi + '" id="bld' + bi + '"><rect x="' + (a[0] - w / 2) + '" y="' + (a[1] - hh / 2) + '" width="' + w + '" height="' + hh + '" rx="' + hh / 2 + '" stroke-width="' + 2.5 * u + '"/>' +
        '<text x="' + a[0] + '" y="' + a[1] + '" style="font-size:' + 20 * u + 'px">' + esc(code) + '</text></g>';
    });
    h += '</g><g id="cRoute"></g><g id="cMark"></g><g id="cSel"></g><g id="cWalk"></g>';
    campusSvg.innerHTML = h;
    pzC.base = { x: b.x0, y: b.y0, w: b.x1 - b.x0, h: b.y1 - b.y0 };
    pzC.fit(b, false, 0.02);
  }

  // keep the building tiles about the same size on screen while zooming
  pzC.onApply = function () {
    if (!pzC.base) return;
    const s = Math.min(1, Math.min(pzC.vb.w / pzC.base.w, pzC.vb.h / pzC.base.h) * 1.15);   // same size on screen at every zoom and screen shape
    document.querySelectorAll('.bld').forEach((g) => {
      const a = D.anchors[buildingCodes[+g.dataset.b]];
      g.setAttribute('transform', 'translate(' + a[0] + ' ' + a[1] + ') scale(' + s + ') translate(' + -a[0] + ' ' + -a[1] + ')');
    });
  };

  // ---------- floor plan ----------
  let floorU = 1;
  function sheetUnit(si) {
    const b = sheetBox[si];
    return Math.max(b.x1 - b.x0, b.y1 - b.y0, 100) / 700;
  }

  function setSheet(si, opts) {
    opts = opts || {};
    if (si === campusSheet) return;
    const changed = S.sheet !== si;
    S.sheet = si;
    S.browse = D.sheets[si][1];
    const u = floorU = sheetUnit(si), b = sheetBox[si];
    if (changed || opts.force) {
      let d = '';
      sheetEdges[si].forEach((k) => {
        d += 'M' + D.x[D.ea[k]] + ' ' + D.y[D.ea[k]] + 'L' + D.x[D.eb[k]] + ' ' + D.y[D.eb[k]];
      });
      let h = '<g id="fBase" class="fade-in">' + planImage(si) + '<path class="plan-edges" d="' + d + '" stroke-width="' + 1.1 * u + '"/>';
      sheetVerts[si].forEach((v) => {
        if (E.isWaypoint(v)) return;
        const cls = vClass(v), special = cls && cls !== 'other';
        h += '<circle class="v ' + cls + '" data-v="' + v + '" cx="' + D.x[v] + '" cy="' + D.y[v] + '" r="' + (special ? 3.8 : 2.5) * u + '" stroke-width="' + 1.6 * u + '"/>';
      });
      h += '</g><g id="fRoute"></g><g id="fMark"></g><g id="fSel"></g><g id="fWalk"></g>';
      floorSvg.innerHTML = h;
      pzF.base = { x: b.x0, y: b.y0, w: b.x1 - b.x0, h: b.y1 - b.y0 };
      drawRouteOnSheet();
      drawSel();
      if (opts.fit !== false) pzF.fit(routeBox(si) || b, !!opts.animate);
    } else if (opts.fit) {
      pzF.fit(routeBox(si) || b, true);
    }
    renderFloorHead();
    document.querySelectorAll('.bld').forEach((g) => g.classList.toggle('on', +g.dataset.b === S.browse));
  }

  function renderFloorHead() {
    const bi = S.browse; if (bi < 0) return;
    const sheet = D.sheets[S.sheet];
    $('floorTitle').textContent = D.buildings[bi][1] + ', ' + sheet[3];
    const routeSheets = S.R ? S.R.segs : {};
    $('floorChips').innerHTML = buildingSheets[bi].slice().reverse().map((s) =>
      '<button type="button" class="floor-chip' + (routeSheets[s.si] ? ' has-route' : '') + '" data-sheet="' + s.si + '" aria-pressed="' + (s.si === S.sheet) +
      '" aria-label="' + esc(s.name) + ' floor" title="' + esc(s.name) + '">' + esc(SHORT_FLOOR[s.name] || s.name.charAt(0)) + '</button>').join('');
  }

  function enterBuilding(bi, animate) {
    const sheets = buildingSheets[bi]; if (!sheets.length) return;
    let pick = sheets.find((s) => S.R && S.R.segs[s.si]) || sheets.find((s) => s.floor === 0) || sheets[0];
    if (S.sheet >= 0 && D.sheets[S.sheet][1] === bi) pick = sheets.find((s) => s.si === S.sheet) || pick;
    setSheet(pick.si, { animate: false, force: S.sheet !== pick.si });
    pzF.fit(routeBox(pick.si) || sheetBox[pick.si], false);
    setView('floor');
    if (animate) floorSvg.querySelector('#fBase')?.classList.add('fade-in');
  }

  // ---------- the selected place ----------
  function pinSvg(x, y, u) {
    const s = u * 1.25;
    return '<circle class="sel-ring" cx="' + x + '" cy="' + y + '" r="' + 14 * s + '"/>' +
      '<g class="sel-pin" transform="translate(' + (x - 12 * s) + ' ' + (y - 22 * s) + ') scale(' + s + ')">' +
      '<path d="M12 21s6-5.6 6-10.5A6 6 0 0 0 6 10.5C6 15.4 12 21 12 21z" stroke-width="1.4"/><circle cx="12" cy="10.5" r="2.3"/></g>';
  }
  function drawSel() {
    const f = $('fSel'), c = $('cSel');
    if (f) f.innerHTML = (S.sel >= 0 && D.sheet[S.sel] === S.sheet) ? pinSvg(D.x[S.sel], D.y[S.sel], floorU) : '';
    if (c) {
      if (S.sel >= 0) { const p = pointOf(S.sel); c.innerHTML = pinSvg(p.x, p.y, campusU); } else c.innerHTML = '';
    }
  }
  function showOnMap(v) {
    const si = D.sheet[v];
    if (si === campusSheet) {
      setView('campus');
      const span = Math.max(campusBox.x1 - campusBox.x0, campusBox.y1 - campusBox.y0) * 0.12;
      pzC.fit({ x0: D.x[v] - span, x1: D.x[v] + span, y0: D.y[v] - span, y1: D.y[v] + span }, true, 0);
    } else {
      setSheet(si, { fit: false });
      setView('floor');
      const sb = sheetBox[si], span = Math.max(sb.x1 - sb.x0, sb.y1 - sb.y0) * 0.14;
      pzF.fit({ x0: D.x[v] - span, x1: D.x[v] + span, y0: D.y[v] - span, y1: D.y[v] + span }, true, 0);
    }
    drawSel();
  }

  // ---------- routes ----------
  const usesStairs = (rt) => rt.edges.some((e) => D.edgeTypes[e.t] === 'STAIRS');

  function prepare(rt) {
    const cum = [0];
    rt.edges.forEach((e) => cum.push(cum[cum.length - 1] + e.w));
    const segs = {};                     // sheet index -> list of polylines (arrays of vertices)
    let cur = null;
    rt.path.forEach((v) => {
      const si = D.sheet[v];
      if (!cur || cur.si !== si) { cur = { si, pts: [v] }; (segs[si] = segs[si] || []).push(cur); }
      else cur.pts.push(v);
    });
    const meters = E.meters(cum[cum.length - 1]);
    return { rt, cum, total: cum[cum.length - 1] || 1, segs, steps: E.steps(rt),
      dur: Math.min(120000, Math.max(20000, 14000 + meters * 55)), meters };   // slow enough to follow on a phone
  }

  function routeBox(si) {
    const R = S.R; if (!R || !R.segs[si]) return null;
    const b = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 };
    R.segs[si].forEach((sg) => sg.pts.forEach((v) => {
      b.x0 = Math.min(b.x0, D.x[v]); b.x1 = Math.max(b.x1, D.x[v]);
      b.y0 = Math.min(b.y0, D.y[v]); b.y1 = Math.max(b.y1, D.y[v]);
    }));
    const sb = sheetBox[si], minSpan = Math.max(sb.x1 - sb.x0, sb.y1 - sb.y0) * 0.22;
    ['x', 'y'].forEach((a) => {
      const lo = a + '0', hi = a + '1', span = b[hi] - b[lo];
      if (span < minSpan) { const c = (b[lo] + b[hi]) / 2; b[lo] = c - minSpan / 2; b[hi] = c + minSpan / 2; }
    });
    return b;
  }

  function campusRouteBox() {
    const R = S.R; if (!R) return campusBox;
    const b = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 };
    R.rt.path.forEach((v) => { const p = pointOf(v); b.x0 = Math.min(b.x0, p.x); b.x1 = Math.max(b.x1, p.x); b.y0 = Math.min(b.y0, p.y); b.y1 = Math.max(b.y1, p.y); });
    const minSpan = Math.max(campusBox.x1 - campusBox.x0, campusBox.y1 - campusBox.y0) * 0.25;
    ['x', 'y'].forEach((ax) => {
      const lo = ax + '0', hi = ax + '1';
      if (b[hi] - b[lo] < minSpan) { const c = (b[lo] + b[hi]) / 2; b[lo] = c - minSpan / 2; b[hi] = c + minSpan / 2; }
    });
    return b;
  }

  function polyline(pts, cls, extra) {
    const s = pts.map((p) => p.x + ',' + p.y).join(' ');
    return '<polyline class="' + cls + '" points="' + s + '" ' + (extra || '') + '/>';
  }

  function drawRouteOnSheet() {
    const layer = $('fRoute'), mark = $('fMark'), walk = $('fWalk');
    if (!layer) return;
    const R = S.R, si = S.sheet, u = floorU;
    if (!R || !R.segs[si]) { layer.innerHTML = ''; mark.innerHTML = ''; walk.innerHTML = walkerSvg('fWalker', u); return; }
    const cls = S.mode === 'free' ? 'route free' : 'route';
    let h = '', m = '';
    R.segs[si].forEach((sg) => {
      const pts = sg.pts.map((v) => ({ x: D.x[v], y: D.y[v] }));
      if (pts.length < 2) return;
      h += polyline(pts, 'route-case', 'pathLength="1" stroke-width="' + 9 * u + '"');
      h += polyline(pts, cls + ' draw', 'pathLength="1" stroke-width="' + 5.2 * u + '"');
    });
    const first = R.rt.path[0], last = R.rt.path[R.rt.path.length - 1];
    if (D.sheet[first] === si) m += markerSvg(first, 'marker-start', u);
    if (D.sheet[last] === si) m += markerSvg(last, 'marker-end', u);
    R.steps.forEach((s) => {
      if (s.kind === 'stairs' || s.kind === 'elevator') {
        const v = R.rt.path[s.from];
        if (D.sheet[v] === si) m += labelSvg(v, u);
      }
    });
    layer.innerHTML = h; mark.innerHTML = m; walk.innerHTML = walkerSvg('fWalker', u);
    requestAnimationFrame(() => requestAnimationFrame(() => layer.querySelectorAll('.draw').forEach((p) => p.classList.add('go'))));
  }

  function markerSvg(v, cls, u) {
    return '<circle class="' + cls + '" cx="' + D.x[v] + '" cy="' + D.y[v] + '" r="' + 7 * u + '" stroke-width="' + 2.4 * u + '"/>' +
      '<text x="' + (D.x[v] + 10 * u) + '" y="' + (D.y[v] - 8 * u) + '" style="font:600 ' + 8.5 * u + 'px Roboto,Segoe UI,sans-serif;fill:var(--ink);paint-order:stroke;stroke:var(--surface);stroke-width:' + 3.2 * u + 'px">' + esc(E.name(v)) + '</text>';
  }
  function labelSvg(v, u) {
    return '<text x="' + (D.x[v] + 8 * u) + '" y="' + (D.y[v] + 3 * u) + '" style="font:600 ' + 7 * u + 'px Roboto,Segoe UI,sans-serif;fill:var(--ink-soft);paint-order:stroke;stroke:var(--surface);stroke-width:' + 3 * u + 'px">' + esc(E.name(v)) + '</text>';
  }
  function walkerSvg(id, u) {
    return '<g id="' + id + '" transform="translate(-9999 -9999)"><circle class="walker-ring" r="' + 10 * u + '"/><circle class="walker-dot" r="' + 6 * u + '" stroke-width="' + 2.6 * u + '"/></g>';
  }

  function drawRouteOnCampus() {
    const layer = $('cRoute'), mark = $('cMark'), walk = $('cWalk'), u = campusU;
    walk.innerHTML = walkerSvg('cWalker', u * 1.15);
    document.querySelectorAll('.bld').forEach((g) => g.classList.remove('here'));
    const R = S.R;
    if (!R) { layer.innerHTML = ''; mark.innerHTML = ''; return; }
    const pts = [];
    R.rt.path.forEach((v) => {
      const p = pointOf(v), l = pts[pts.length - 1];
      if (!l || l.x !== p.x || l.y !== p.y) pts.push(p);
    });
    let h = '';
    if (pts.length > 1) {
      h += polyline(pts, 'route-case', 'pathLength="1" stroke-width="' + 12 * u + '"');
      h += polyline(pts, (S.mode === 'free' ? 'route free' : 'route') + ' draw', 'pathLength="1" stroke-width="' + 7 * u + '"');
    }
    layer.innerHTML = h;
    const a = pointOf(R.rt.path[0]), z = pointOf(R.rt.path[R.rt.path.length - 1]);
    mark.innerHTML = '<circle class="marker-start" cx="' + a.x + '" cy="' + a.y + '" r="' + 8 * u + '" stroke-width="' + 3 * u + '"/>' +
      '<circle class="marker-end" cx="' + z.x + '" cy="' + z.y + '" r="' + 8 * u + '" stroke-width="' + 3 * u + '"/>';
    [R.rt.path[0], R.rt.path[R.rt.path.length - 1]].forEach((v) => {
      const g = $('bld' + bldgOf(v)); if (g) g.classList.add('here');
    });
    requestAnimationFrame(() => requestAnimationFrame(() => layer.querySelectorAll('.draw').forEach((p) => p.classList.add('go'))));
  }

  // show the whole route: the campus if it goes outside, else the floor where it starts
  function overview(animate) {
    const R = S.R; if (!R) return;
    if (R.segs[campusSheet]) {
      setView('campus');
      pzC.fit(campusRouteBox(), animate);
    } else {
      const si = D.sheet[R.rt.path[0]];
      setSheet(si, { fit: false, force: S.sheet !== si });
      setView('floor');
      pzF.fit(routeBox(si) || sheetBox[si], animate);
    }
  }

  // ---------- the sheet sections ----------
  function showSection(name, size) {
    ['secHome', 'secResults', 'secPlace', 'secRoute'].forEach((id) => { $(id).hidden = id !== name; });
    $('sheetBody').scrollTop = 0;
    if (size) setSheetSize(size);
  }

  function showRoute() {
    const rt = S.routes[S.mode];
    S.R = prepare(rt);
    S.p = 0; S.playing = false;
    S.sel = -1; drawSel();
    body.classList.add('routed');
    renderSummary(); renderCompare(); renderSteps();
    drawRouteOnCampus();
    const si = D.sheet[S.R.rt.path.find((v) => D.sheet[v] !== campusSheet) ?? S.R.rt.path[0]];
    if (si !== campusSheet) setSheet(si, { force: true, fit: false });
    renderFloorHead();
    showSection('secRoute', 'half');
    requestAnimationFrame(() => overview(true));
    speak(routeSpeech());
    renderAt(0, true);
    updatePlayBtn();
    writeHash();
    markModes();
  }

  function renderSummary() {
    const rt = S.R.rt;
    $('rTime').innerHTML = esc(E.formatTime(rt.seconds)) + ' <em>(' + Math.round(S.R.meters) + ' m)</em>';
    const stairs = usesStairs(rt);
    const sheets = Object.keys(S.R.segs).filter((k) => +k !== campusSheet).length;
    $('rSub').textContent = (S.mode === 'free' ? 'Step-free route' : stairs ? 'Fastest route, uses stairs' : 'Fastest route, no stairs') +
      (sheets > 1 ? ', ' + sheets + ' floor plans' : '');
  }

  function renderCompare() {
    const fast = S.routes.fast, free = S.routes.free, same = fast === free;
    const tile = (id, label, ic, rt, note, extra) => {
      if (!rt.found) return '<button type="button" class="ticket ' + extra + '" disabled><span class="t-name">' + icon(ic) + label + '</span><div class="t-big">None</div><span class="t-note">' + note + '</span></button>';
      const m = E.meters(rt.units), t = E.formatTime(rt.seconds);
      return '<button type="button" class="ticket ' + extra + '" data-mode="' + id + '" aria-pressed="' + (S.mode === id) + '">' +
        '<span class="t-name">' + icon(ic) + label + '</span><div class="t-big">' + t + ' <small>' + Math.round(m) + ' m</small></div><span class="t-note">' + note + '</span></button>';
    };
    const delta = free.found ? Math.round(E.meters(free.units - fast.units)) : 0;
    $('compare').innerHTML =
      tile('fast', 'Fastest', 'i-walk', fast, usesStairs(fast) ? 'Uses stairs' : 'No stairs', '') +
      (same ? tile('free', 'Step-free', 'i-ramp', free, 'Same route', 'free')
        : tile('free', 'Step-free', 'i-ramp', free, free.found ? 'Elevators and ramps, ' + (delta >= 0 ? '+' : '') + delta + ' m' : 'No step-free way', 'free'));
  }

  const STEP_ICON = { start: 'i-start', end: 'i-end', walk: 'i-walk', stairs: 'i-stairs', elevator: 'i-elevator', door: 'i-door', outdoor: 'i-outdoor',
    left: 'i-left', right: 'i-right', 'slight-left': 'i-slight-left', 'slight-right': 'i-slight-right', around: 'i-around' };
  function renderSteps() {
    $('steps').innerHTML = S.R.steps.map((s, i) =>
      '<li><button type="button" class="step k-' + s.kind + '" data-step="' + i + '"><span class="tile">' + icon(STEP_ICON[s.kind]) + '</span>' +
        '<span class="what">' + esc(s.text) + '<span class="where">' + esc(s.detail) + '</span></span>' +
        '<span class="m">' + (s.meters ? s.meters + ' m' : '') + '</span></button></li>').join('');
  }

  // ---------- the walk ----------
  function edgeAt(d) {
    const cum = S.R.cum; let lo = 0, hi = cum.length - 2;
    if (hi < 0) return 0;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (cum[mid] <= d) lo = mid; else hi = mid - 1; }
    return lo;
  }

  // keep the current step in view by scrolling only the sheet, never the page
  function keepStepVisible(el) {
    const box = $('sheetBody');
    if (box.scrollHeight <= box.clientHeight + 1) return;
    const top = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
    const bottom = top + el.offsetHeight;
    if (top < box.scrollTop) box.scrollTo({ top: top - 12, behavior: 'smooth' });
    else if (bottom > box.scrollTop + box.clientHeight) box.scrollTo({ top: bottom - box.clientHeight + 12, behavior: 'smooth' });
  }

  // while walking, slide the map so the walker stays in the open part of the screen
  function follow(pz, x, y) {
    if (performance.now() - (pz.userMoved || 0) < 2500) return;   // the user is looking around, leave the map alone
    if (pz.g || pz.pending) return;                                 // a finger or a glide is already moving it
    const f = pz.frame(), ins = insets();
    const availW = f.r.width - ins.l - ins.r, availH = f.r.height - ins.t - ins.b;
    // where the walker is on screen, inside the open part of the map
    const sx = (x - f.ox) * f.k - ins.l, sy = (y - f.oy) * f.k - ins.t;
    if (sx > availW * 0.25 && sx < availW * 0.75 && sy > availH * 0.25 && sy < availH * 0.75) return;
    // near the edge: glide so the walker is in the middle again (one smooth move, not a redraw every frame)
    pz.go({ x: x - (ins.l + availW / 2) / f.k, y: y - (ins.t + availH / 2) / f.k, w: pz.vb.w, h: pz.vb.h }, true, 650);
  }

  let curStep = -1;
  function renderAt(p, keepView) {
    const R = S.R; if (!R) return;
    S.p = Math.min(1, Math.max(0, p));
    const d = S.p * R.total, path = R.rt.path;
    let i = edgeAt(d), a = path[i], b = path[Math.min(i + 1, path.length - 1)];
    const len = R.cum[i + 1] - R.cum[i], f = len > 0 ? Math.min(1, (d - R.cum[i]) / len) : 0;
    if (S.p >= 1) { i = path.length - 2 < 0 ? 0 : path.length - 2; a = path[path.length - 1]; b = a; }

    const pa = pointOf(a), pb = pointOf(b), cw = $('cWalker');
    const cx = pa.x + (pb.x - pa.x) * f, cy = pa.y + (pb.y - pa.y) * f;
    if (cw) cw.setAttribute('transform', 'translate(' + cx + ' ' + cy + ')');

    const sa = D.sheet[a], sb = D.sheet[b];
    let sheetNow, x, y;
    if (sa === sb) { sheetNow = sa; x = D.x[a] + (D.x[b] - D.x[a]) * f; y = D.y[a] + (D.y[b] - D.y[a]) * f; }
    else if (f < 0.5) { sheetNow = sa; x = D.x[a]; y = D.y[a]; }
    else { sheetNow = sb; x = D.x[b]; y = D.y[b]; }
    const outdoors = sheetNow === campusSheet;
    S.walk = { outdoors, x: outdoors ? cx : x, y: outdoors ? cy : y };
    if (!keepView) {
      if (outdoors) setView('campus');
      else {
        if (sheetNow !== S.sheet) { setSheet(sheetNow, { fit: false }); pzF.fit(routeBox(sheetNow) || sheetBox[sheetNow], false); }
        setView('floor');
      }
    }
    const fw = $('fWalker');
    if (fw) fw.setAttribute('transform', outdoors || sheetNow !== S.sheet ? 'translate(-9999 -9999)' : 'translate(' + x + ' ' + y + ')');
    campusSvg.classList.toggle('playing', S.playing);
    floorSvg.classList.toggle('playing', S.playing);
    if (S.nav && S.playing) { if (outdoors) follow(pzC, cx, cy); else follow(pzF, x, y); }

    // current step
    let cur = 0;
    R.steps.forEach((s, k) => { if (s.kind !== 'start' && s.kind !== 'end' && s.from <= i && i < s.to) cur = k; });
    if (S.p <= 0) cur = 0; else if (S.p >= 1) cur = R.steps.length - 1;
    if (cur !== curStep) {
      curStep = cur;
      document.querySelectorAll('.step').forEach((el, k) => {
        el.classList.toggle('now', k === cur);
        if (k === cur && S.playing) keepStepVisible(el);
      });
      const s = R.steps[cur];
      $('nbIcon').innerHTML = icon(STEP_ICON[s.kind]);
      $('nbText').textContent = s.kind === 'end' ? 'You have arrived' : s.text;
      $('nbWhere').textContent = s.detail;
      if (S.nav && S.playing) {
        speak(stepSpeech(cur)); buzz(s.kind === 'end' ? [90, 60, 90] : 60);
        // stop at each new instruction long enough to read it (longer when it is also spoken)
        S.holdUntil = performance.now() + Math.max(2600, (voice.on ? 75 : 45) * (s.text.length + s.detail.length));
      }
    }
    $('scrub').value = Math.round(S.p * 1000);
    const left = Math.max(0, Math.round(R.meters - E.meters(d)));
    const secs = R.rt.seconds * (1 - S.p);
    $('playInfo').textContent = S.p >= 1 ? 'Arrived' : E.formatTime(secs) + ' left, ' + left + ' m';
    const s = R.steps[cur], stepLeft = s && s.meters && s.kind !== 'end' ? Math.max(0, Math.round(E.meters(R.cum[s.to] - d))) : 0;
    $('nbM').textContent = stepLeft ? stepLeft + ' m' : '';
  }

  function updatePlayBtn() {
    const b = $('playBtn'), done = S.p >= 1 && !S.playing;
    b.innerHTML = icon(S.playing ? 'i-pause' : done ? 'i-replay' : 'i-play');
    b.setAttribute('aria-label', S.playing ? 'Pause' : done ? 'Replay the walk' : 'Play the walk');
  }

  const OUTDOOR_SPEEDUP = 1.9;
  function frame(now) {
    if (!S.playing) return;
    const dt = now - S.last; S.last = now;
    if (now < (S.holdUntil || 0)) { requestAnimationFrame(frame); return; }   // reading time at a new step
    // outside the buildings the walker moves faster than inside
    const ei = edgeAt(S.p * S.R.total), pe = S.R.rt.path;
    const outside = pe[ei] !== undefined && pe[ei + 1] !== undefined && E.isOutdoors(pe[ei]) && E.isOutdoors(pe[ei + 1]);
    renderAt(S.p + dt * (outside ? OUTDOOR_SPEEDUP : 1) / S.R.dur);
    if (S.p >= 1) { S.playing = false; updatePlayBtn(); renderAt(1); return; }
    requestAnimationFrame(frame);
  }
  function play() {
    if (!S.R) return;
    if (S.p >= 1) S.p = 0;
    S.playing = true; S.last = performance.now(); updatePlayBtn();
    requestAnimationFrame(frame);
  }
  function pause() { S.playing = false; updatePlayBtn(); renderAt(S.p); }

  function startNav() {
    if (!S.R) return;
    S.nav = true; body.classList.add('nav');
    $('navBanner').hidden = false; $('navBar').hidden = false;
    curStep = -1;
    pzC.userMoved = pzF.userMoved = 0;
    renderAt(S.p >= 1 ? 0 : S.p);
    // zoom in around the walker like a phone navigation app
    const pz = pzNow(), v = S.R.rt.path[edgeAt(S.p * S.R.total)];
    const p = S.view === 'campus' ? pointOf(v) : { x: D.x[v], y: D.y[v] };
    const box = S.view === 'campus' ? campusBox : sheetBox[S.sheet], span = Math.max(box.x1 - box.x0, box.y1 - box.y0) * (S.view === 'campus' ? 0.16 : 0.2);
    pz.fit({ x0: p.x - span, x1: p.x + span, y0: p.y - span, y1: p.y + span }, true, 0);
    // with voice guidance the student goes step by step with Next; otherwise the walk plays by itself
    if (voice.on) { S.playing = false; updatePlayBtn(); speak(stepSpeech(curStep >= 0 ? curStep : 0)); buzz(60); }
    else setTimeout(play, 350);
  }
  function stopNav() {
    S.playing = false; S.nav = false; body.classList.remove('nav');
    $('navBanner').hidden = true; $('navBar').hidden = true;
    updatePlayBtn();
    setSheetSize('half');
    overview(true);
  }

  // ---------- search filters (the chips under the search bar) ----------
  const FILTER = { building: '', kind: '', floor: '' };
  const KIND_TYPES = {
    room: ['ROOM', 'OTHER'], class: ['CLASSROOM'], restroom: ['RESTROOM'], elevator: ['ELEVATOR'],
    food: ['CAFE', 'RESTAURANT', 'VENDOR'], entrance: ['ENTRANCE']
  };
  const KIND_LABEL = { room: 'Offices and rooms', class: 'Classrooms', restroom: 'Restrooms', elevator: 'Elevators', food: 'Food', entrance: 'Entrances' };
  const bSel = $('fBuilding'), fSel = $('fFloor'), kBox = $('fKinds');
  E.buildings().forEach((b) => {
    if (b[0] === 'CAMPUS') return;
    const o = document.createElement('option'); o.value = b[0]; o.textContent = b[1]; bSel.appendChild(o);
  });
  const filtering = () => !!(FILTER.building || FILTER.kind || FILTER.floor);
  function filtersChanged() {
    kBox.querySelectorAll('.chip[data-kind]').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.kind === FILTER.kind)));
    bSel.parentElement.classList.toggle('on', !!FILTER.building);
    fSel.parentElement.classList.toggle('on', !!FILTER.floor);
    $('fFloorWrap').hidden = !FILTER.building;
    // the field being typed in shows the new list right away
    qField.refresh(); fromField.refresh(); toField.refresh();
    if (filtering()) showResults();
    else if (!$('secResults').hidden) backToMain();
  }
  bSel.addEventListener('change', () => {
    FILTER.building = bSel.value; FILTER.floor = '';
    fSel.innerHTML = '<option value="">Any floor</option>';
    if (FILTER.building) E.floorsOf(FILTER.building).forEach((f) => {
      const o = document.createElement('option'); o.value = f; o.textContent = f + ' floor'; fSel.appendChild(o);
    });
    filtersChanged();
    // show that building on the map too
    const bi = buildingCodes.indexOf(FILTER.building);
    if (bi >= 0 && !S.nav) enterBuilding(bi, true);
  });
  fSel.addEventListener('change', () => {
    FILTER.floor = fSel.value; filtersChanged();
    const bi = buildingCodes.indexOf(FILTER.building);
    const s = bi >= 0 && buildingSheets[bi].find((x) => x.name === FILTER.floor);
    if (s) { setSheet(s.si, { animate: true }); setView('floor'); }
  });
  kBox.addEventListener('click', (e) => {
    const c = e.target.closest('.chip[data-kind]'); if (!c) return;
    FILTER.kind = FILTER.kind === c.dataset.kind ? '' : c.dataset.kind; filtersChanged();
  });
  function clearFilters() {
    FILTER.building = FILTER.kind = FILTER.floor = ''; bSel.value = '';
    fSel.innerHTML = '<option value="">Any floor</option>'; filtersChanged();
  }
  $('fReset').addEventListener('click', clearFilters);

  // the list of places for the chips: nearest first when we know where you are
  function showResults() {
    const anchor = S.sel >= 0 ? S.sel : S.from;
    let items;
    const pass = (v) => (!FILTER.building || E.building(v)[0] === FILTER.building) && (!FILTER.floor || E.floorName(v) === FILTER.floor);
    if (anchor >= 0 && FILTER.kind) {
      items = E.nearest(anchor, KIND_TYPES[FILTER.kind], S.mode === 'free', 400).filter((f) => pass(f.v)).slice(0, 40);
    } else {
      items = E.search('', 60, FILTER).map((v) => ({ v, units: -1 }));
    }
    const where = FILTER.building ? D.buildings[buildingCodes.indexOf(FILTER.building)][1] + (FILTER.floor ? ', ' + FILTER.floor + ' floor' : '') : '';
    $('resTitle').textContent = (FILTER.kind ? KIND_LABEL[FILTER.kind] : 'Places') + (where ? ' in ' + where : '') +
      (anchor >= 0 && FILTER.kind ? ' near ' + E.name(anchor) : '');
    $('resList').innerHTML = items.length ? items.map((f) => resultRow(f.v, f.units)).join('') : '<li class="empty">Nothing found with these filters.</li>';
    showSection('secResults', 'half');
  }
  function resultRow(v, units) {
    return '<li><button type="button" data-pick="' + v + '"><span class="ic">' + icon(typeIcon(v)) + '</span><span><b>' + esc(E.name(v)) +
      '</b><small>' + esc(E.place(v)) + '</small></span><span class="dist">' + (units >= 0 ? Math.round(E.meters(units)) + ' m' : '') + '</span></button></li>';
  }

  // ---------- search fields ----------
  function Field(kind, onSet) {
    const input = $(kind + 'Input'), list = $(kind + 'List'), clear = $(kind + 'Clear');
    let items = [], active = -1;
    const self = {
      value: -1,
      set(v, silent) {
        self.value = v; input.value = v >= 0 ? E.name(v) : '';
        clear.hidden = v < 0 && !input.value;
        close();
        if (onSet) onSet(v, silent);
      },
      focus() { input.focus(); },
      clear() { input.value = ''; self.value = -1; clear.hidden = true; }
    };
    function close() { list.hidden = true; input.setAttribute('aria-expanded', 'false'); active = -1; }
    function open() {
      items = E.search(input.value, filtering() ? 40 : 8, FILTER);
      if (!items.length) { close(); return; }
      list.innerHTML = items.map((v, k) => '<li role="option" data-k="' + k + '" aria-selected="false"><span class="ic">' + icon(typeIcon(v)) + '</span>' +
        '<div><b>' + esc(E.name(v)) + '</b><span>' + esc(E.place(v)) + '</span></div></li>').join('');
      list.hidden = false; input.setAttribute('aria-expanded', 'true'); active = -1;
    }
    function mark(k) {
      active = k;
      list.querySelectorAll('li').forEach((li, n) => li.setAttribute('aria-selected', String(n === k)));
    }
    input.addEventListener('input', () => { self.value = -1; clear.hidden = !input.value; open(); });
    input.addEventListener('focus', () => {
      lastField = kind;
      if ((input.value || filtering()) && self.value < 0) open();
      input.select();
      if (!desktop() && kind === 'q') setSheetSize('peek');
    });
    self.refresh = () => { if (document.activeElement === input && self.value < 0) open(); };
    input.addEventListener('blur', () => setTimeout(() => {
      if (inList) { inList = false; return; }                     // the finger is on the list: leave it open until a tap outside
      close();
    }, 150));
    document.addEventListener('pointerdown', (e) => { if (!list.hidden && !list.contains(e.target) && e.target !== input) { inList = false; close(); } });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (list.hidden) open(); mark(Math.min(items.length - 1, active + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); mark(Math.max(0, active - 1)); }
      else if (e.key === 'Enter') { e.preventDefault(); if (!list.hidden && items.length) self.set(items[active >= 0 ? active : 0]); }
      else if (e.key === 'Escape') close();
    });
    // a result is picked on a real tap (click), so a finger can scroll the list without picking anything
    let inList = false;
    list.addEventListener('pointerdown', (e) => {
      inList = true;
      if (e.pointerType === 'mouse') e.preventDefault();           // keep the text field focused on computers
    });
    list.addEventListener('click', (e) => {
      inList = false;
      const li = e.target.closest('li'); if (!li) return;
      self.set(items[+li.dataset.k]); input.blur();
    });
    list.addEventListener('scroll', () => { inList = true; }, { passive: true });
    clear.addEventListener('click', () => { self.clear(); if (kind !== 'q') S[kind] = -1; input.focus(); if (onSet && kind === 'q') onSet(-1, false); });
    return self;
  }
  let lastField = 'q';
  const qField = Field('q', (v, silent) => { if (silent) return; if (v >= 0) selectPlace(v); else { S.sel = -1; drawSel(); backToMain(); } });
  const fromField = Field('from', (v, silent) => { S.from = v; if (!silent) afterPick('from'); });
  const toField = Field('to', (v, silent) => { S.to = v; if (!silent) afterPick('to'); });
  function afterPick(kind) {
    if (S.from >= 0 && S.to >= 0) findRoute();
    else if (kind === 'from' && S.to < 0) toField.focus();
    else if (kind === 'to' && S.from < 0) fromField.focus();
  }

  let toastTimer = 0;
  function toast(msg) {
    const t = $('toast'); t.textContent = msg; t.classList.toggle('on', !!msg);
    clearTimeout(toastTimer); if (msg) toastTimer = setTimeout(() => t.classList.remove('on'), 3200);
    if (msg) speak(msg);
  }

  // ---------- voice: spoken guidance and voice search, for students who cannot see the screen well ----------
  // In the Android app the page talks through window.AndroidVoice (Android's own text to speech and speech
  // recognizer, see MainActivity.java). In a browser it uses the Web Speech API when the browser has it.
  const voice = { on: false };
  try { voice.on = localStorage.getItem('voice') === 'on'; } catch (e) { /* ignore */ }

  // words a speech engine reads better: "116 m" is "116 meters", room 2071 is "2 0 7 1" not "two thousand..."
  function speechText(str) {
    return String(str)
      .replace(/(\d+) m\b/g, '$1 meters')
      .replace(/(\d+) min\b/g, '$1 minutes')
      .replace(/\b([A-Z]{0,2})(\d{3,4})([A-Z]?)\b(?! (meters|minutes))/g, (m, a, d, b) => (a ? a + ' ' : '') + d.split('').join(' ') + (b ? ' ' + b : ''))
      .replace(/_/g, ' ');
  }
  function speak(text, force) {
    if ((!voice.on && !force) || !text) return;
    const t = speechText(text);
    if (window.AndroidVoice) { window.AndroidVoice.speak(t, true); return; }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t);
      u.lang = 'en-US'; u.rate = 1;
      window.speechSynthesis.speak(u);
    }
  }
  function buzz(pattern) { try { if (voice.on && navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* ignore */ } }
  function setVoice(on, quiet) {
    voice.on = on;
    try { localStorage.setItem('voice', on ? 'on' : 'off'); } catch (e) { /* ignore */ }
    const b = $('voiceBtn');
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', on ? 'Voice guidance on. Turn off spoken directions' : 'Voice guidance off. Turn on spoken directions');
    b.innerHTML = icon(on ? 'i-sound' : 'i-mute');
    $('navBanner').setAttribute('aria-live', on ? 'off' : 'polite');    // our own voice already reads the banner
    if (on && !quiet) speak('Voice guidance is on. Tap the microphone and say a room, for example, take me to office 2071.');
    else if (window.AndroidVoice) window.AndroidVoice.stop();
    else if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  function placeSpeech(v) { return E.name(v) + '. ' + E.describe(v); }
  function routeSpeech() {
    const R = S.R, rt = R.rt, n = R.steps.length;
    return 'Route to ' + E.name(S.to) + ' from ' + E.name(S.from) + '. ' + E.formatTime(rt.seconds) + ', ' + Math.round(R.meters) + ' m' +
      (usesStairs(rt) ? ', using stairs' : ', with no stairs') + '. ' + n + ' steps. Tap Start to hear them one by one, or Read all directions.';
  }
  function stepSpeech(k) {
    const R = S.R, s = R.steps[k], n = R.steps.length;
    if (s.kind === 'end') return 'Step ' + (k + 1) + ' of ' + n + '. You have arrived at ' + E.name(S.to) + '.';
    return 'Step ' + (k + 1) + ' of ' + n + '. ' + s.text + '. ' + s.detail + '.';
  }

  // voice search: turn what was said into places
  const NUM_WORDS = { zero: 0, oh: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 };
  function cleanSpoken(t) {
    t = ' ' + t.toLowerCase().replace(/[.,!?]/g, ' ') + ' ';
    t = t.replace(/\b(zero|oh|one|two|three|four|five|six|seven|eight|nine)\b/g, (w) => String(NUM_WORDS[w]));
    t = t.replace(/(\d)\s+(?=\d)/g, '$1');                      // "2 0 7 1" and "20 71" are 2071
    t = t.replace(/\b(room|the|a|an|number|please|of)\b/g, ' ');
    return t.replace(/\s+/g, ' ').trim();
  }
  // everyday words for the names used in the data
  const SAY_AS = { gate: 'entrance', door: 'entrance', exit: 'entrance', bathroom: 'restroom', toilet: 'restroom', toilets: 'restroom',
    washroom: 'restroom', wc: 'restroom', lift: 'elevator', lifts: 'elevator', elevators: 'elevator', stairway: 'stairs',
    staircase: 'stairs', cafeteria: 'cafe', canteen: 'cafe', coffee: 'cafe', professor: 'faculty', doctor: 'faculty', classroom: 'class' };
  // building names people say, to the building code in the data
  const SAY_BUILDING = [
    [/\b(library|lib)\b/, 'LIB'], [/\b(sse|science|sciences|engineering)\b/, 'SSE'], [/\b(huss|alwaleed|humanities)\b/, 'HUSS'],
    [/\b(campus center|cc)\b/, 'CC'], [/\b(sports|gym|sport)\b/, 'SPORTS'], [/\b(residences?|dorms?|resid)\b/, 'RESID'],
    [/\b(core|core academic)\b/, 'CORE'], [/\b(admin|administration)\b/, 'ADMIN'], [/\b(arts|pva|center for the arts)\b/, 'PVA'],
    [/\b(jameel)\b/, 'JAMEEL'], [/\b(physical plant|plant)\b/, 'PP']
  ];
  // the main door of a building: its first entrance on the Plaza floor
  function buildingDoor(code) {
    let best = -1;
    for (let v = 0; v < N; v++) {
      if (E.building(v)[0] !== code) continue;
      const floor = D.sheets[D.sheet[v]][2];
      if (typeName(v) === 'ENTRANCE' && floor === 0) return v;
      if (best < 0 && floor === 0 && !E.isWaypoint(v)) best = v;
    }
    return best;
  }
  function spokenBuilding(t) {
    const bare = t.replace(/\b(building|hall|the|complex|centre|block|main)\b/g, ' ').replace(/\s+/g, ' ').trim();
    for (const [re, code] of SAY_BUILDING) {
      const m = bare.match(re);
      if (m && m[0].length >= bare.length - 1) return buildingDoor(code);     // the whole phrase is a building name
    }
    return -1;
  }
  // "bathroom", "the nearest lift", "food": the nearest place of that kind from where the student is
  const SAY_KIND = [[/\b(restroom|restrooms|bathroom|toilets?|washroom|wc)\b/, 'restroom'], [/\b(elevators?|lifts?)\b/, 'elevator'],
    [/\b(food|cafe|cafeteria|canteen|coffee|eat)\b/, 'food'], [/\b(exit|way out|entrance)\b/, 'entrance']];
  function spokenKind(t) {
    const bare = cleanSpoken(t).replace(/\b(nearest|closest|near|me|find|where|is|are|to|go|take|i|can|get|some|any)\b/g, ' ').replace(/\s+/g, ' ').trim();
    for (const [re, kind] of SAY_KIND) { const m = bare.match(re); if (m && m[0].length >= bare.length - 1) return kind; }
    return '';
  }
  function findSpoken(t) {
    t = cleanSpoken(t);
    if (!t) return -1;
    const b = spokenBuilding(t);
    if (b >= 0) return b;
    const words = t.split(' ');
    const tries = [t, words.map((w) => SAY_AS[w] || w).join(' ')];
    // then the same with one word left out at a time, for extra words like "pepsi gate" or "sse building"
    if (words.length > 1) words.forEach((_, i) => {
      const rest = words.filter((__, j) => j !== i);
      tries.push(rest.join(' '), rest.map((w) => SAY_AS[w] || w).join(' '));
    });
    const codes = words.filter((w) => /\d/.test(w)).join(' ');
    if (codes) tries.push(codes);
    for (const q of tries) {
      if (!q) continue;
      const hit = E.search(q, 1)[0];
      if (hit !== undefined) return hit;
    }
    return -1;
  }
  function onHeard(list) {
    $('micBtn').classList.remove('listening'); $('micBtn2').classList.remove('listening');
    // a kind of place: go to the nearest one from where we are, or list them if we do not know where that is
    const kind = spokenKind(list[0] || '');
    if (kind) {
      const here = S.sel >= 0 ? S.sel : S.from;
      if (here >= 0) {
        const near = E.nearest(here, NEAR[kind], S.mode === 'free', 1)[0];
        if (near) { enterDirections({ from: here, to: near.v }); return; }
      }
      FILTER.kind = kind === 'entrance' ? 'entrance' : kind; filtersChanged();
      speak('Here are the ' + KIND_LABEL[FILTER.kind].toLowerCase() + '. Say where you are, and then ask again for the nearest one.');
      return;
    }
    for (const said of list) {
      const t = said.toLowerCase().trim();
      let m = t.match(/^(?:directions |go |walk |take me )?from (.+?) to (.+)$/);
      if (m) {
        const a = findSpoken(m[1]), b = findSpoken(m[2]);
        if (a >= 0 && b >= 0) { enterDirections({ from: a, to: b }); return; }
        continue;
      }
      m = t.match(/^(?:take me to|go to|navigate to|walk to|directions to|how do i get to|how to get to|get me to) (.+)$/);
      if (m) {
        const b = findSpoken(m[1]);
        if (b < 0) continue;
        enterDirections({ to: b });
        if (S.from < 0) speak('Going to ' + E.name(b) + '. Where are you now? Tap the microphone and say your start.');
        return;
      }
      const v = findSpoken(t.replace(/^(?:where is|find|search for|show me|show) /, ''));
      if (v < 0) continue;
      if (S.dir) {
        if (S.from < 0) fromField.set(v); else if (S.to < 0) toField.set(v); else pickFromList(v);
        if (S.from >= 0 && S.to < 0) speak('Starting at ' + E.name(v) + '. Now tap the microphone and say where you are going.');
      } else {
        selectPlace(v);
      }
      return;
    }
    toast('I could not find "' + (list[0] || '') + '". Try saying the room number, like office 2071.');
  }
  window.onVoiceResult = (list) => onHeard(Array.isArray(list) ? list : [String(list)]);
  window.onVoiceError = (why) => {
    $('micBtn').classList.remove('listening'); $('micBtn2').classList.remove('listening');
    toast(why === 'unavailable' ? 'Voice search is not available on this phone.' : 'I did not hear anything. Tap the microphone and try again.');
  };
  function listen(btn) {
    if (window.AndroidVoice && window.AndroidVoice.listen) {
      if (window.AndroidVoice.stop) window.AndroidVoice.stop();
      btn.classList.add('listening');
      window.AndroidVoice.listen();
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast('Voice search is not available in this browser.'); return; }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    const r = new SR();
    r.lang = 'en-US'; r.interimResults = false; r.maxAlternatives = 4;
    r.onresult = (e) => onHeard(Array.from(e.results[0]).map((a) => a.transcript));
    r.onerror = (e) => window.onVoiceError(e.error === 'not-allowed' ? 'unavailable' : 'nothing');
    r.onend = () => btn.classList.remove('listening');
    btn.classList.add('listening');
    r.start();
  }

  // step by step: the walker jumps to the start of a step, the map follows, and the step is read
  function goStep(k) {
    const R = S.R; if (!R) return;
    k = Math.max(0, Math.min(R.steps.length - 1, k));
    S.playing = false; updatePlayBtn();
    const s = R.steps[k];
    curStep = -1;
    renderAt(k === R.steps.length - 1 ? 1 : k === 0 ? 0 : R.cum[s.from] / R.total + 0.0005);
    curStep = k;
    speak(stepSpeech(k), true);
    if (S.walk) {
      const pz = S.walk.outdoors ? pzC : pzF, f = pz.frame(), ins = insets();
      const availW = f.r.width - ins.l - ins.r, availH = f.r.height - ins.t - ins.b;
      pz.userMoved = 0;
      pz.go({ x: S.walk.x - (ins.l + availW / 2) / f.k, y: S.walk.y - (ins.t + availH / 2) / f.k, w: pz.vb.w, h: pz.vb.h }, true, 450);
    }
  }

  function findRoute() {
    if (S.from < 0 || S.to < 0) { toast(S.from < 0 ? 'Choose where you are starting.' : 'Choose where you are going.'); (S.from < 0 ? fromField : toField).focus(); return; }
    if (S.from === S.to) { toast('Start and destination are the same place.'); return; }
    const fast = E.route(S.from, S.to, false);
    if (!fast.found) { toast('No route between these places.'); return; }
    const free = usesStairs(fast) ? E.route(S.from, S.to, true) : fast;
    S.routes = { fast, free };
    if (S.mode === 'free' && !free.found) { S.mode = 'fast'; toast('No step-free way exists, showing the fastest route.'); }
    showRoute();
  }

  // ---------- place card ----------
  function selectPlace(v) {
    S.sel = v;
    $('plName').textContent = E.name(v);
    $('plWhere').textContent = E.place(v);
    $('plAbout').textContent = E.describe(v);
    $('found').innerHTML = '';
    document.querySelectorAll('#nearChips .chip').forEach((c) => c.setAttribute('aria-pressed', 'false'));
    showSection('secPlace', 'half');
    requestAnimationFrame(() => showOnMap(v));
    speak(placeSpeech(v));
    if (!S.dir) qField.set(v, true);
  }
  function closePlace() {
    S.sel = -1; drawSel();
    if (!S.dir) qField.clear();
    backToMain();
  }
  function backToMain() {
    if (S.R && S.dir) showSection('secRoute', 'half');
    else if (filtering()) showResults();
    else showSection('secHome', 'peek');
  }

  const NEAR = {
    restroom: ['RESTROOM'], elevator: ['ELEVATOR'], food: ['CAFE', 'RESTAURANT', 'VENDOR'], entrance: ['ENTRANCE']
  };
  function nearest(kind) {
    document.querySelectorAll('#nearChips .chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.find === kind)));
    const found = E.nearest(S.sel, NEAR[kind], S.mode === 'free', 5);
    $('found').innerHTML = found.length ? found.map((f) => resultRow(f.v, f.units)).join('') : '<li class="empty">Nothing found that way.</li>';
  }

  // ---------- directions mode ----------
  function enterDirections(opts) {
    opts = opts || {};
    S.dir = true; body.classList.add('dir');
    $('searchBox').hidden = true; $('dirBox').hidden = false;
    if (opts.to !== undefined) toField.set(opts.to, true);
    if (opts.from !== undefined) fromField.set(opts.from, true);
    if (S.from >= 0 && S.to >= 0) findRoute();
    else {
      showSection(S.sel >= 0 ? 'secPlace' : 'secHome', 'peek');
      setTimeout(() => (S.from < 0 ? fromField : toField).focus(), 60);
    }
  }
  function exitDirections() {
    stopNavQuiet();
    S.dir = false; body.classList.remove('dir');
    $('searchBox').hidden = false; $('dirBox').hidden = true;
    S.R = null; S.routes = null; S.from = S.to = -1;
    body.classList.remove('routed');
    fromField.clear(); toField.clear();
    drawRouteOnCampus(); drawRouteOnSheet(); renderFloorHead();
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ }
    if (S.sel >= 0) selectPlace(S.sel); else backToMain();
  }
  function stopNavQuiet() {
    if (!S.nav) return;
    S.playing = false; S.nav = false; body.classList.remove('nav');
    $('navBanner').hidden = true; $('navBar').hidden = true;
  }
  function markModes() {
    document.querySelectorAll('.mode').forEach((x) => x.setAttribute('aria-pressed', String((x.id === 'modeFree') === (S.mode === 'free'))));
  }
  function setMode(m) {
    S.mode = m; markModes();
    if (S.routes) {
      if (!S.routes[m].found) { S.mode = 'fast'; markModes(); toast('No step-free way between these places.'); return; }
      showRoute();
    }
  }

  // ---------- the bottom sheet (phones) ----------
  const sheet = $('sheet');
  let sheetShown = 160, sheetState = 'peek', topHeight = 120;
  function sheetHeights() {
    const H = sheet.offsetHeight || (window.innerHeight * 0.8);
    return { peek: Math.min(H, 150), half: Math.min(H, Math.round(window.innerHeight * 0.46)), full: H };
  }
  function setSheetSize(state, px) {
    if (desktop()) { sheetShown = 0; document.documentElement.style.setProperty('--sheet', '0px'); return; }
    const hs = sheetHeights();
    if (state) sheetState = state;
    sheetShown = px !== undefined ? px : hs[sheetState];
    document.documentElement.style.setProperty('--sheet', sheetShown + 'px');
  }
  (function dragSheet() {
    const handle = $('handle'), bodyEl = $('sheetBody');
    let start = null;
    function down(e) {
      if (desktop()) return;
      start = { y: e.clientY, shown: sheetShown, t: performance.now() };
      sheet.classList.add('dragging');
      handle.setPointerCapture && handle.setPointerCapture(e.pointerId);
    }
    function move(e) {
      if (!start) return;
      const hs = sheetHeights();
      const shown = Math.max(60, Math.min(hs.full, start.shown + (start.y - e.clientY)));
      setSheetSize(null, shown);
    }
    function up(e) {
      if (!start) return;
      sheet.classList.remove('dragging');
      const hs = sheetHeights(), dy = start.y - e.clientY, dt = performance.now() - start.t, fast = Math.abs(dy) / dt > 0.5;
      let pick;
      if (Math.abs(dy) < 6) pick = sheetState === 'peek' ? 'half' : sheetState === 'half' ? 'full' : 'half';   // a tap on the handle
      else if (fast) pick = dy > 0 ? (sheetShown > hs.half ? 'full' : 'half') : (sheetShown < hs.half ? 'peek' : 'half');
      else pick = ['peek', 'half', 'full'].reduce((a, b) => (Math.abs(hs[b] - sheetShown) < Math.abs(hs[a] - sheetShown) ? b : a));
      start = null;
      setSheetSize(pick);
    }
    handle.addEventListener('pointerdown', down);
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
    handle.addEventListener('pointercancel', up);
    handle.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSheetSize(sheetState === 'full' ? 'peek' : sheetState === 'peek' ? 'half' : 'full'); } });
    // pulling the list down from its top also lowers the sheet
    let pull = null;
    bodyEl.addEventListener('touchstart', (e) => { pull = bodyEl.scrollTop <= 0 ? { y: e.touches[0].clientY, shown: sheetShown } : null; }, { passive: true });
    bodyEl.addEventListener('touchmove', (e) => {
      if (!pull || desktop()) return;
      const dy = e.touches[0].clientY - pull.y;
      if (dy > 12 && sheetState !== 'peek') { sheet.classList.add('dragging'); setSheetSize(null, Math.max(60, pull.shown - dy)); }
    }, { passive: true });
    bodyEl.addEventListener('touchend', () => {
      if (!pull) return;
      if (sheet.classList.contains('dragging')) {
        sheet.classList.remove('dragging');
        const hs = sheetHeights();
        setSheetSize(sheetShown < (hs.peek + hs.half) / 2 ? 'peek' : sheetShown < (hs.half + hs.full) / 2 ? 'half' : 'full');
      }
      pull = null;
    });
  })();

  function measureTop() {
    const r = $('topbar').getBoundingClientRect();
    topHeight = desktop() ? 0 : Math.round(r.bottom);
    document.documentElement.style.setProperty('--top', topHeight + 'px');
    setSheetSize();
  }
  if (window.ResizeObserver) new ResizeObserver(measureTop).observe($('topbar'));
  window.addEventListener('resize', measureTop);

  // ---------- examples, hash, theme ----------
  const EXAMPLES = [
    ['SSE_P_P106', 'SSE_F1_1214', 'Stairs or lift?', 'Lab P106 to Lab 1214, one floor up'],
    ['SSE_F1_1184', 'LIB_P_P001', 'Across campus', 'A faculty office in SSE to the Library'],
    ['CAMPUS_O_G_PEPSI', 'SSE_F2_2077', 'From the gate to an office', 'Pepsi Entrance to Office Faculty 2077'],
    ['HUSS_P_CP66', 'SPORTS_G_G001', 'Between two far buildings', 'A HUSS classroom to the Sports Complex']
  ];
  function drawExamples() {
    $('exampleList').innerHTML = EXAMPLES.map((e, i) => {
      if (E.findKey(e[0]) < 0 || E.findKey(e[1]) < 0) return '';
      return '<li><button type="button" data-ex="' + i + '"><span class="ic">' + icon('i-turn') + '</span><span><b>' + esc(e[2]) + '</b><span>' + esc(e[3]) + '</span></span></button></li>';
    }).join('');
  }
  function writeHash() {
    if (!S.R) return;
    const h = '#from=' + D.keys[S.from] + '&to=' + D.keys[S.to] + (S.mode === 'free' ? '&free=1' : '');
    try { history.replaceState(null, '', h); } catch (e) { /* file pages may refuse */ }
  }
  function readHash() {
    const m = {}; location.hash.replace(/^#/, '').split('&').forEach((kv) => { const p = kv.split('='); if (p[0]) m[p[0]] = decodeURIComponent(p[1] || ''); });
    const a = E.findKey(m.from || ''), b = E.findKey(m.to || '');
    if (a >= 0 && b >= 0) {
      S.mode = m.free === '1' ? 'free' : 'fast'; markModes();
      enterDirections({ from: a, to: b });
      return true;
    }
    return false;
  }
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('theme', t); } catch (e) { /* ignore */ }
  }
  function copyLink(btn, text) {
    const label = btn.querySelector('span') || btn;
    const old = label.textContent;
    const done = () => { label.textContent = 'Link copied'; setTimeout(() => { label.textContent = old; }, 1800); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => toast(text));
    else toast(text);
  }

  // ---------- events ----------
  $('dirBox').addEventListener('submit', (e) => { e.preventDefault(); findRoute(); });
  $('dirFab').addEventListener('click', () => enterDirections(S.sel >= 0 ? { to: S.sel } : {}));
  $('dirBack').addEventListener('click', exitDirections);
  $('swapBtn').addEventListener('click', () => {
    const a = S.from, b = S.to;
    $('swapBtn').classList.toggle('turn');
    fromField.set(b, true); toField.set(a, true);
    if (S.from >= 0 && S.to >= 0) findRoute();
  });
  $('modeFast').addEventListener('click', () => setMode('fast'));
  $('modeFree').addEventListener('click', () => setMode('free'));
  $('compare').addEventListener('click', (e) => { const t = e.target.closest('.ticket'); if (t && t.dataset.mode) setMode(t.dataset.mode); });
  $('steps').addEventListener('click', (e) => {
    const b = e.target.closest('.step'); if (!b || !S.R) return;
    const s = S.R.steps[+b.dataset.step];
    S.playing = false; updatePlayBtn();
    speak(stepSpeech(+b.dataset.step));
    renderAt(s.kind === 'end' ? 1 : S.R.cum[s.from] / S.R.total + 0.0005);
    if (S.view === 'floor') pzF.fit(routeBox(S.sheet) || sheetBox[S.sheet], true);
    else pzC.fit(campusRouteBox(), true);
    if (!desktop()) setSheetSize('peek');
  });
  $('startBtn').addEventListener('click', startNav);
  $('voiceBtn').addEventListener('click', () => setVoice(!voice.on));
  $('micBtn').addEventListener('click', () => listen($('micBtn')));
  $('micBtn2').addEventListener('click', () => listen($('micBtn2')));
  $('stepPrev').addEventListener('click', () => goStep((curStep < 0 ? 0 : curStep) - 1));
  $('stepNext').addEventListener('click', () => goStep((curStep < 0 ? 0 : curStep) + 1));
  $('stepSay').addEventListener('click', () => { if (S.R) speak(stepSpeech(curStep < 0 ? 0 : curStep), true); });
  $('readAll').addEventListener('click', () => {
    if (!S.R) return;
    speak(S.R.steps.map((x, k) => stepSpeech(k)).join(' '), true);
  });
  $('navExit').addEventListener('click', stopNav);
  $('playBtn').addEventListener('click', () => (S.playing ? pause() : play()));
  $('scrub').addEventListener('input', (e) => { S.playing = false; updatePlayBtn(); pzC.userMoved = pzF.userMoved = 0; renderAt(e.target.value / 1000); });
  $('exampleList').addEventListener('click', (e) => {
    const b = e.target.closest('[data-ex]'); if (!b) return;
    const ex = EXAMPLES[+b.dataset.ex];
    enterDirections({ from: E.findKey(ex[0]), to: E.findKey(ex[1]) });
  });
  function pickFromList(v) {
    if (S.dir) {
      if (lastField === 'from' || (S.from < 0 && lastField !== 'to')) fromField.set(v);
      else toField.set(v);
    } else selectPlace(v);
  }
  $('resList').addEventListener('click', (e) => { const b = e.target.closest('[data-pick]'); if (b) pickFromList(+b.dataset.pick); });
  $('found').addEventListener('click', (e) => { const b = e.target.closest('[data-pick]'); if (b) enterDirections({ from: S.sel, to: +b.dataset.pick }); });
  $('nearChips').addEventListener('click', (e) => { const c = e.target.closest('.chip'); if (c) nearest(c.dataset.find); });
  $('plClose').addEventListener('click', closePlace);
  $('plTo').addEventListener('click', () => { const v = S.sel; enterDirections({ to: v }); });
  $('plFrom').addEventListener('click', () => { const v = S.sel; enterDirections({ from: v }); });
  $('plShare').addEventListener('click', () => {
    const url = location.href.split('#')[0] + '#to=' + D.keys[S.sel];
    copyLink($('plShare'), url);
  });
  $('floorChips').addEventListener('click', (e) => {
    const c = e.target.closest('.floor-chip'); if (c) { setSheet(+c.dataset.sheet, { animate: true }); setView('floor'); }
  });
  $('toCampus').addEventListener('click', () => { setView('campus'); if (S.R) pzC.fit(campusRouteBox(), true); });
  document.querySelectorAll('.fab[data-zoom]').forEach((b) => b.addEventListener('click', () => {
    const pz = pzNow();
    pz.userMoved = performance.now();
    if (b.dataset.zoom === 'in') pz.zoomCenter(0.65);
    else if (b.dataset.zoom === 'out') pz.zoomCenter(1.5);
    else if (S.R) { if (S.view === 'campus') pzC.fit(campusRouteBox(), true); else pzF.fit(routeBox(S.sheet) || sheetBox[S.sheet], true); }
    else if (S.view === 'campus') pzC.fit(campusBox, true, 0.02);
    else pzF.fit(sheetBox[S.sheet], true);
  }));
  $('copyBtn').addEventListener('click', () => { writeHash(); copyLink($('copyBtn'), location.href); });
  $('themeBtn').addEventListener('click', () => applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));

  // hover (computers) and tap on the maps
  const tip = $('tip');
  function bind(svg, pz) {
    svg.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const t = e.target.closest('[data-v],[data-b]');
      if (!t || pz.moved) { tip.hidden = true; return; }
      if (t.dataset.v !== undefined) {
        const v = +t.dataset.v; tip.innerHTML = esc(E.name(v)) + '<small>' + esc(E.place(v)) + '</small>';
      } else tip.innerHTML = esc(D.buildings[+t.dataset.b][1]) + '<small>Click to look inside</small>';
      tip.hidden = false; tip.style.left = Math.min(window.innerWidth - 300, e.clientX + 14) + 'px'; tip.style.top = e.clientY + 16 + 'px';
    });
    svg.addEventListener('pointerleave', () => { tip.hidden = true; });
    svg.addEventListener('click', (e) => {
      if (pz.moved) return;
      tip.hidden = true;
      const t = e.target.closest('[data-v],[data-b]');
      if (!t) return;
      if (t.dataset.b !== undefined) { enterBuilding(+t.dataset.b, true); return; }
      const v = +t.dataset.v;
      if (S.nav) return;
      selectPlace(v);
    });
  }
  bind(campusSvg, pzC); bind(floorSvg, pzF);
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    tip.hidden = true;
    if (S.nav) stopNav();
    else if (S.sel >= 0 && !$('secPlace').hidden) closePlace();
  });

  // ---------- start ----------
  let theme = 'light';
  try { theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); } catch (e) { /* ignore */ }
  document.documentElement.setAttribute('data-theme', theme);

  setVoiceQuiet();
  measureTop();
  drawCampus();
  drawExamples();
  const buildingsCount = D.buildings.length - 1;
  $('sideFoot').textContent = N.toLocaleString() + ' places and ' + D.ea.length.toLocaleString() + ' paths in ' + buildingsCount + ' buildings, drawn from the AUC floor plans.';
  const sse = D.sheets.findIndex((s) => s[0] === 'SSE_P');
  setSheet(sse >= 0 ? sse : 0, { animate: false });
  setView('campus');
  showSection('secHome', 'peek');
  if (!readHash()) {
    const m = location.hash.match(/to=([^&]+)/), v = m ? E.findKey(decodeURIComponent(m[1])) : -1;
    if (v >= 0) selectPlace(v);
  }

  function setVoiceQuiet() { setVoice(voice.on, true); }     // show the saved voice setting at start without talking

  // the phone's back button: close one thing at a time, like a map app; false means "nothing left, leave the app"
  window.appBack = function () {
    const open = document.querySelector('.suggest:not([hidden])');
    if (open) { open.hidden = true; return true; }
    if (S.nav) { stopNav(); return true; }
    if (!$('secPlace').hidden && S.sel >= 0) { closePlace(); return true; }
    if (S.dir) { exitDirections(); return true; }
    if (filtering()) { clearFilters(); return true; }
    if (S.view === 'floor') { setView('campus'); return true; }
    if (!desktop() && sheetState !== 'peek') { setSheetSize('peek'); return true; }
    return false;
  };

  // handy for testing from the console
  window.__app = { S, E, findRoute, fromField, toField, qField, renderAt, setMode, selectPlace, enterDirections, startNav, stopNav, setSheetSize };
})();

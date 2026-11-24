/* app.js: the interface of the Campus Route Finder. The routing itself is in engine.js. */
(function () {
  'use strict';

  const D = window.CAMPUS;
  const E = window.Engine.init(D);
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const icon = (id) => '<svg><use href="#' + id + '"/></svg>';
  const N = E.count();

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

  function typeIcon(v) {
    switch (typeName(v)) {
      case 'RESTROOM': return 'i-restroom';
      case 'ELEVATOR': return 'i-elevator';
      case 'STAIRS': return 'i-stairs';
      case 'ENTRANCE': return 'i-door';
      case 'CAFE': case 'RESTAURANT': case 'VENDOR': return 'i-food';
      case 'OUTDOOR': return 'i-outdoor';
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
    from: -1, to: -1, mode: 'fast', routes: null, R: null,
    sheet: -1, browse: -1, playing: false, p: 0, last: 0
  };

  // ---------- pan and zoom for an svg ----------
  function PanZoom(svg) {
    this.svg = svg; this.vb = { x: 0, y: 0, w: 100, h: 100 }; this.base = null; this.moved = false; this.anim = 0;
    const self = this;
    svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const f = Math.exp(e.deltaY * 0.0016), p = self.toUser(e.clientX, e.clientY);
      self.zoomAt(p.x, p.y, f);
    }, { passive: false });
    // one pointer pans, two fingers pinch to zoom and drag the map together
    const ptr = new Map();
    let drag = null, pinch = null;
    svg.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptr.size === 2) {
        const [a, b] = Array.from(ptr.values());
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, w: self.vb.w, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
        drag = null; self.moved = true;
      } else if (ptr.size === 1) {
        drag = { x: e.clientX, y: e.clientY, vx: self.vb.x, vy: self.vb.y, moved: false };
        self.moved = false;
      }
    });
    window.addEventListener('pointermove', (e) => {
      if (!ptr.has(e.pointerId)) return;
      ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && ptr.size >= 2) {
        const [a, b] = Array.from(ptr.values());
        const d = Math.hypot(a.x - b.x, a.y - b.y) || 1, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const bw = self.base ? self.base.w : self.vb.w;
        const targetW = Math.min(Math.max(pinch.w * pinch.d / d, bw * 0.03), bw * 3);
        // zoom around the point that was between the fingers, then follow the fingers across the map
        const p = self.toUser(pinch.mx, pinch.my);
        self.zoomAt(p.x, p.y, targetW / self.vb.w);
        const k = self.scale();
        self.vb.x -= (mx - pinch.mx) / k; self.vb.y -= (my - pinch.my) / k;
        pinch.mx = mx; pinch.my = my; self.apply(); svg.classList.add('drag');
        return;
      }
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) < 4) return;
      drag.moved = true; self.moved = true; svg.classList.add('drag');
      const k = self.scale();
      self.vb.x = drag.vx - dx / k; self.vb.y = drag.vy - dy / k; self.apply();
    });
    function lift(e) {
      ptr.delete(e.pointerId);
      if (ptr.size < 2) pinch = null;
      if (ptr.size === 1) {          // one finger stays down: keep panning from where it is
        const r = Array.from(ptr.values())[0];
        drag = { x: r.x, y: r.y, vx: self.vb.x, vy: self.vb.y, moved: true };
      }
      if (ptr.size === 0) { drag = null; svg.classList.remove('drag'); setTimeout(() => { self.moved = false; }, 0); }
    }
    window.addEventListener('pointerup', lift);
    window.addEventListener('pointercancel', lift);
    svg.addEventListener('dblclick', () => self.reset());
  }
  PanZoom.prototype.scale = function () {
    const r = this.svg.getBoundingClientRect();
    return Math.min(r.width / this.vb.w, r.height / this.vb.h) || 1;
  };
  PanZoom.prototype.toUser = function (cx, cy) {
    const r = this.svg.getBoundingClientRect(), k = this.scale();
    const ox = this.vb.x + (r.width / k - this.vb.w) / -2, oy = this.vb.y + (r.height / k - this.vb.h) / -2;
    return { x: ox + (cx - r.left) / k, y: oy + (cy - r.top) / k };
  };
  PanZoom.prototype.apply = function () {
    this.svg.setAttribute('viewBox', [this.vb.x, this.vb.y, this.vb.w, this.vb.h].join(' '));
    if (this.onApply) this.onApply();
  };
  PanZoom.prototype.zoomAt = function (px, py, f) {
    const b = this.base; if (!b) return;
    const w = Math.min(Math.max(this.vb.w * f, b.w * 0.03), b.w * 3), g = w / this.vb.w;
    this.vb.x = px - (px - this.vb.x) * g; this.vb.y = py - (py - this.vb.y) * g;
    this.vb.h *= g; this.vb.w = w; this.apply();
  };
  PanZoom.prototype.zoomCenter = function (f) {
    this.zoomAt(this.vb.x + this.vb.w / 2, this.vb.y + this.vb.h / 2, f);
  };
  PanZoom.prototype.fit = function (box, animate) {
    const pad = Math.max(box.x1 - box.x0, box.y1 - box.y0) * 0.09 + 10;
    const target = { x: box.x0 - pad, y: box.y0 - pad, w: box.x1 - box.x0 + pad * 2, h: box.y1 - box.y0 + pad * 2 };
    this.fitBox = box;
    if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.vb = target; this.apply(); return;
    }
    cancelAnimationFrame(this.anim);
    const from = Object.assign({}, this.vb), t0 = performance.now(), self = this;
    (function tick(now) {
      const t = Math.min(1, (now - t0) / 520), e = 1 - Math.pow(1 - t, 3);
      ['x', 'y', 'w', 'h'].forEach((k) => { self.vb[k] = from[k] + (target[k] - from[k]) * e; });
      self.apply();
      if (t < 1) self.anim = requestAnimationFrame(tick);
    })(t0);
  };
  PanZoom.prototype.reset = function () { if (this.fitBox) this.fit(this.fitBox, true); };

  const campusSvg = $('campusSvg'), floorSvg = $('floorSvg');
  const pzC = new PanZoom(campusSvg), pzF = new PanZoom(floorSvg);

  // the real drawing of the sheet (rendered from the floor plan PDF) goes under the route
  function planImage(si) {
    const id = D.sheets[si][0], size = window.PLANS && window.PLANS[id];
    if (!size) return '';
    return '<image class="plan-img" href="plans/' + id + '.jpg" x="0" y="0" width="' + size[0] + '" height="' + size[1] + '" preserveAspectRatio="none"/>';
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
      if (D.keys[v].indexOf('CAMPUS_O_D_') === 0) return;
      const gate = typeName(v) === 'ENTRANCE';
      if (gate) {
        h += '<rect class="gate" data-v="' + v + '" x="' + (D.x[v] - 6 * u) + '" y="' + (D.y[v] - 6 * u) + '" width="' + 12 * u + '" height="' + 12 * u + '" transform="rotate(45 ' + D.x[v] + ' ' + D.y[v] + ')"/>';
        h += '<text class="gate-name" x="' + (D.x[v] + 11 * u) + '" y="' + (D.y[v] + 4 * u) + '" style="font-size:' + 12 * u + 'px">' + esc(E.name(v).replace(/ Entrance$/, '')) + '</text>';
      } else {
        h += '<circle class="v other" data-v="' + v + '" cx="' + D.x[v] + '" cy="' + D.y[v] + '" r="' + 3.2 * u + '"/>';
      }
    });
    buildingCodes.forEach((code, bi) => {
      const a = D.anchors[code]; if (!a) return;
      const w = Math.max(68, code.length * 17 + 30) * u, hh = 38 * u;
      h += '<g class="bld" data-b="' + bi + '" id="bld' + bi + '"><rect x="' + (a[0] - w / 2) + '" y="' + (a[1] - hh / 2) + '" width="' + w + '" height="' + hh + '" rx="' + 6 * u + '" stroke-width="' + 3 * u + '"/>' +
        '<text x="' + a[0] + '" y="' + a[1] + '" style="font-size:' + 21 * u + 'px">' + esc(code) + '</text></g>';
    });
    h += '</g><g id="cRoute"></g><g id="cMark"></g><g id="cWalk"></g>';
    campusSvg.innerHTML = h;
    pzC.base = { x: b.x0, y: b.y0, w: b.x1 - b.x0, h: b.y1 - b.y0 };
    pzC.fit(b, false);
  }

  // keep the building tiles about the same size on screen while zooming
  pzC.onApply = function () {
    if (!pzC.base) return;
    const s = Math.max(0.34, Math.min(1, (pzC.vb.w / pzC.base.w) * 1.35));
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
      h += '</g><g id="fRoute"></g><g id="fMark"></g><g id="fWalk"></g>';
      floorSvg.innerHTML = h;
      pzF.base = { x: b.x0, y: b.y0, w: b.x1 - b.x0, h: b.y1 - b.y0 };
      drawRouteOnSheet();
      pzF.fit(routeBox(si) || b, !!opts.animate);
    } else if (opts.fit) {
      pzF.fit(routeBox(si) || b, true);
    }
    renderFloorHead();
    document.querySelectorAll('.bld').forEach((g) => g.classList.toggle('on', +g.dataset.b === S.browse));
  }

  function renderFloorHead() {
    const bi = S.browse; if (bi < 0) return;
    $('floorTitle').textContent = D.buildings[bi][1];
    $('floorChips').innerHTML = buildingSheets[bi].map((s) =>
      '<button type="button" class="floor-chip" data-sheet="' + s.si + '" aria-pressed="' + (s.si === S.sheet) + '">' + esc(s.name) + '</button>').join('');
    const note = D.buildings[bi][0] === 'CAMPUS' ? '' : '';
    $('campusNote').textContent = note;
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
      dur: Math.min(40000, Math.max(11000, 8000 + meters * 28)), meters };
  }

  function routeBox(si) {
    const R = S.R; if (!R || !R.segs[si]) return null;
    const b = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 };
    R.segs[si].forEach((sg) => sg.pts.forEach((v) => {
      b.x0 = Math.min(b.x0, D.x[v]); b.x1 = Math.max(b.x1, D.x[v]);
      b.y0 = Math.min(b.y0, D.y[v]); b.y1 = Math.max(b.y1, D.y[v]);
    }));
    const sb = sheetBox[si], minSpan = Math.max(sb.x1 - sb.x0, sb.y1 - sb.y0) * 0.26;
    ['x', 'y'].forEach((a) => {
      const lo = a + '0', hi = a + '1', span = b[hi] - b[lo];
      if (span < minSpan) { const c = (b[lo] + b[hi]) / 2; b[lo] = c - minSpan / 2; b[hi] = c + minSpan / 2; }
    });
    return b;
  }

  function polyline(pts, u, cls, extra) {
    const s = pts.map((p) => p.x + ',' + p.y).join(' ');
    return '<polyline class="' + cls + '" points="' + s + '" ' + (extra || '') + '/>';
  }

  function drawRouteOnSheet() {
    const layer = $('fRoute'), mark = $('fMark'), walk = $('fWalk');
    if (!layer) return;
    const R = S.R, si = S.sheet, u = floorU;
    if (!R || !R.segs[si]) { layer.innerHTML = ''; mark.innerHTML = ''; walk.innerHTML = walkerSvg(u); return; }
    const cls = S.mode === 'free' ? 'route free' : 'route';
    let h = '', m = '';
    R.segs[si].forEach((sg) => {
      const pts = sg.pts.map((v) => ({ x: D.x[v], y: D.y[v] }));
      if (pts.length < 2) return;
      h += polyline(pts, u, 'route-case', 'pathLength="1" stroke-width="' + 9 * u + '"');
      h += polyline(pts, u, cls + ' draw', 'pathLength="1" stroke-width="' + 5.2 * u + '"');
    });
    const first = R.rt.path[0], last = R.rt.path[R.rt.path.length - 1];
    if (D.sheet[first] === si) m += markerSvg(first, 'marker-start', u, 'Start');
    if (D.sheet[last] === si) m += markerSvg(last, 'marker-end', u, 'End');
    R.steps.forEach((s) => {
      if (s.kind === 'stairs' || s.kind === 'elevator') {
        const v = R.rt.path[s.from];
        if (D.sheet[v] === si) m += labelSvg(v, u);
      }
    });
    layer.innerHTML = h; mark.innerHTML = m; walk.innerHTML = walkerSvg(u);
    requestAnimationFrame(() => requestAnimationFrame(() => layer.querySelectorAll('.draw').forEach((p) => p.classList.add('go'))));
  }

  function markerSvg(v, cls, u, text) {
    return '<circle class="' + cls + '" cx="' + D.x[v] + '" cy="' + D.y[v] + '" r="' + 7 * u + '" stroke-width="' + 2.4 * u + '"/>' +
      '<text x="' + (D.x[v] + 10 * u) + '" y="' + (D.y[v] - 8 * u) + '" style="font:600 ' + 8.5 * u + 'px Bahnschrift,Segoe UI,sans-serif;fill:var(--ink);paint-order:stroke;stroke:var(--paper);stroke-width:' + 3.2 * u + 'px">' + esc(E.name(v)) + '</text>';
  }
  function labelSvg(v, u) {
    return '<text x="' + (D.x[v] + 8 * u) + '" y="' + (D.y[v] + 3 * u) + '" style="font:600 ' + 7 * u + 'px Bahnschrift,Segoe UI,sans-serif;fill:var(--ink-soft);paint-order:stroke;stroke:var(--paper);stroke-width:' + 3 * u + 'px">' + esc(E.name(v)) + '</text>';
  }
  function walkerSvg(u) {
    return '<g id="fWalker" transform="translate(-9999 -9999)"><circle class="walker-ring" r="' + 10 * u + '" stroke-width="' + 2.4 * u + '"/><circle class="walker-dot" r="' + 6 * u + '" stroke-width="' + 3 * u + '"/></g>';
  }

  function drawRouteOnCampus() {
    const layer = $('cRoute'), mark = $('cMark'), walk = $('cWalk'), u = campusU;
    walk.innerHTML = '<g id="cWalker" transform="translate(-9999 -9999)"><circle class="walker-ring" r="' + 11 * u + '" stroke-width="' + 2.6 * u + '"/><circle class="walker-dot" r="' + 7 * u + '" stroke-width="' + 3.2 * u + '"/></g>';
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
      h += polyline(pts, u, 'route-case', 'pathLength="1" stroke-width="' + 12 * u + '"');
      h += polyline(pts, u, (S.mode === 'free' ? 'route free' : 'route') + ' draw', 'pathLength="1" stroke-width="' + 7 * u + '"');
    }
    layer.innerHTML = h;
    const a = pointOf(R.rt.path[0]), z = pointOf(R.rt.path[R.rt.path.length - 1]);
    mark.innerHTML = '<circle class="marker-start" cx="' + a.x + '" cy="' + a.y + '" r="' + 8 * u + '" stroke-width="' + 3 * u + '"/>' +
      '<circle class="marker-end" cx="' + z.x + '" cy="' + z.y + '" r="' + 8 * u + '" stroke-width="' + 3 * u + '"/>';
    [R.rt.path[0], R.rt.path[R.rt.path.length - 1]].forEach((v) => {
      const g = $('bld' + bldgOf(v)); if (g) g.classList.add('here');
    });
    requestAnimationFrame(() => requestAnimationFrame(() => layer.querySelectorAll('.draw').forEach((p) => p.classList.add('go'))));
    if (pts.length > 1) {
      const b = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 };
      pts.forEach((p) => { b.x0 = Math.min(b.x0, p.x); b.x1 = Math.max(b.x1, p.x); b.y0 = Math.min(b.y0, p.y); b.y1 = Math.max(b.y1, p.y); });
      const minSpan = Math.max(campusBox.x1 - campusBox.x0, campusBox.y1 - campusBox.y0) * 0.3;
      ['x', 'y'].forEach((ax) => {
        const lo = ax + '0', hi = ax + '1';
        if (b[hi] - b[lo] < minSpan) { const c = (b[lo] + b[hi]) / 2; b[lo] = c - minSpan / 2; b[hi] = c + minSpan / 2; }
      });
      pzC.fit(b, true);
    } else {
      pzC.fit(campusBox, true);
    }
  }

  // ---------- results panel ----------
  function showRoute() {
    const rt = S.routes[S.mode];
    S.R = prepare(rt);
    S.p = 0; S.playing = false;
    $('examples').hidden = true; $('result').hidden = false; $('player').hidden = false;
    renderCompare(); renderSteps();
    drawRouteOnCampus();
    const first = S.R.rt.path[0];
    let si = D.sheet[first];
    if (si === campusSheet) {
      const next = S.R.rt.path.find((v) => D.sheet[v] !== campusSheet);
      si = next !== undefined ? D.sheet[next] : (S.sheet >= 0 ? S.sheet : 0);
    }
    setSheet(si, { force: true, animate: false });
    renderAt(0);
    updatePlayBtn();
    writeHash();
    document.querySelectorAll('.mode').forEach((b) => b.setAttribute('aria-pressed', String((b.id === 'modeFree') === (S.mode === 'free'))));
    $('side').scrollTo({ top: $('result').offsetTop - 14, behavior: 'smooth' });
  }

  function renderCompare() {
    const fast = S.routes.fast, free = S.routes.free, same = fast === free;
    const tile = (id, label, rt, note, extra) => {
      if (!rt.found) return '<button type="button" class="ticket ' + extra + '" disabled><span class="t-name">' + label + '</span><div class="t-big">None</div><span class="t-note">' + note + '</span></button>';
      const m = E.meters(rt.units), t = E.formatTime(rt.seconds);
      return '<button type="button" class="ticket ' + extra + '" data-mode="' + id + '" aria-pressed="' + (S.mode === id) + '">' +
        '<span class="t-name">' + label + '</span><div class="t-big">' + Math.round(m) + '<small> m, ' + t + '</small></div><span class="t-note">' + note + '</span></button>';
    };
    const delta = free.found ? Math.round(E.meters(free.units - fast.units)) : 0;
    $('compare').innerHTML =
      tile('fast', 'Fastest', fast, usesStairs(fast) ? 'Uses stairs' : 'No stairs on this route', '') +
      (same ? tile('free', 'Step-free', free, 'Same route, no stairs', 'free')
        : tile('free', 'Step-free', free, free.found ? 'Elevators and ramps only, ' + (delta >= 0 ? '+' : '') + delta + ' m' : 'No step-free way between these places', 'free'));
  }

  function renderSteps() {
    $('steps').innerHTML = S.R.steps.map((s, i) => {
      const ic = { start: 'i-start', end: 'i-end', walk: 'i-walk', stairs: 'i-stairs', elevator: 'i-elevator', door: 'i-door', outdoor: 'i-outdoor' }[s.kind];
      return '<li><button type="button" class="step k-' + s.kind + '" data-step="' + i + '"><span class="tile">' + icon(ic) + '</span>' +
        '<span class="what">' + esc(s.text) + '<span class="where">' + esc(s.detail) + '</span></span>' +
        '<span class="m">' + (s.meters ? s.meters + ' m' : '') + '</span></button></li>';
    }).join('');
  }

  // ---------- the walk ----------
  function edgeAt(d) {
    const cum = S.R.cum; let lo = 0, hi = cum.length - 2;
    if (hi < 0) return 0;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (cum[mid] <= d) lo = mid; else hi = mid - 1; }
    return lo;
  }

  // keep the current step in view by scrolling only the side panel, never the page,
  // so on a phone the map you are watching does not jump away
  function keepStepVisible(el) {
    const side = $('side');
    if (getComputedStyle(side).overflowY === 'visible' || side.scrollHeight <= side.clientHeight + 1) return;   // phone layout
    const top = el.getBoundingClientRect().top - side.getBoundingClientRect().top + side.scrollTop;
    const bottom = top + el.offsetHeight;
    if (top < side.scrollTop) side.scrollTo({ top: top - 12, behavior: 'smooth' });
    else if (bottom > side.scrollTop + side.clientHeight) side.scrollTo({ top: bottom - side.clientHeight + 12, behavior: 'smooth' });
  }

  function renderAt(p) {
    const R = S.R; if (!R) return;
    S.p = Math.min(1, Math.max(0, p));
    const d = S.p * R.total, path = R.rt.path;
    let i = edgeAt(d), a = path[i], b = path[Math.min(i + 1, path.length - 1)];
    const len = R.cum[i + 1] - R.cum[i], f = len > 0 ? Math.min(1, (d - R.cum[i]) / len) : 0;
    if (S.p >= 1) { i = path.length - 2 < 0 ? 0 : path.length - 2; a = path[path.length - 1]; b = a; }

    const pa = pointOf(a), pb = pointOf(b), cw = $('cWalker');
    if (cw) cw.setAttribute('transform', 'translate(' + (pa.x + (pb.x - pa.x) * f) + ' ' + (pa.y + (pb.y - pa.y) * f) + ')');

    const sa = D.sheet[a], sb = D.sheet[b];
    let sheetNow, x, y;
    if (sa === sb) { sheetNow = sa; x = D.x[a] + (D.x[b] - D.x[a]) * f; y = D.y[a] + (D.y[b] - D.y[a]) * f; }
    else if (f < 0.5) { sheetNow = sa; x = D.x[a]; y = D.y[a]; }
    else { sheetNow = sb; x = D.x[b]; y = D.y[b]; }
    const outdoors = sheetNow === campusSheet;
    if (!outdoors && sheetNow !== S.sheet) setSheet(sheetNow, { animate: true });
    const fw = $('fWalker');
    if (fw) fw.setAttribute('transform', outdoors ? 'translate(-9999 -9999)' : 'translate(' + x + ' ' + y + ')');
    $('floorSvg').classList.toggle('dim', outdoors);
    const ov = $('floorOverlay');
    ov.textContent = outdoors ? 'Outdoors, walking across campus' : '';
    ov.classList.toggle('on', outdoors);
    campusSvg.classList.toggle('playing', S.playing);
    floorSvg.classList.toggle('playing', S.playing);

    // current step
    let cur = 0;
    R.steps.forEach((s, k) => { if (s.kind !== 'start' && s.kind !== 'end' && s.from <= i && i < s.to) cur = k; });
    if (S.p <= 0) cur = 0; else if (S.p >= 1) cur = R.steps.length - 1;
    document.querySelectorAll('.step').forEach((el, k) => {
      const now = k === cur; if (el.classList.contains('now') !== now) {
        el.classList.toggle('now', now);
        if (now && S.playing) keepStepVisible(el);
      }
    });
    $('scrub').value = Math.round(S.p * 1000);
    const walked = Math.round(E.meters(d)), all = Math.round(R.meters);
    $('playInfo').textContent = walked + ' of ' + all + ' m';
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

  // ---------- search filters ----------
  const FILTER = { building: '', kind: '', floor: '' };
  const bSel = $('fBuilding'), fSel = $('fFloor'), kBox = $('fKinds'), rBtn = $('fReset');
  E.buildings().forEach((b) => {
    if (b[0] === 'CAMPUS') return;
    const o = document.createElement('option'); o.value = b[0]; o.textContent = b[1]; bSel.appendChild(o);
  });
  function filtersChanged() {
    rBtn.hidden = !(FILTER.building || FILTER.kind || FILTER.floor);
    kBox.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.kind === FILTER.kind)));
    // the field being typed in shows the new list right away
    fromField.refresh(); toField.refresh();
  }
  bSel.addEventListener('change', () => {
    FILTER.building = bSel.value; FILTER.floor = '';
    fSel.innerHTML = '<option value="">Any floor</option>';
    if (FILTER.building) E.floorsOf(FILTER.building).forEach((f) => {
      const o = document.createElement('option'); o.value = f; o.textContent = f + ' floor'; fSel.appendChild(o);
    });
    fSel.disabled = !FILTER.building; filtersChanged();
  });
  fSel.addEventListener('change', () => { FILTER.floor = fSel.value; filtersChanged(); });
  kBox.addEventListener('click', (e) => {
    const c = e.target.closest('.chip'); if (!c) return;
    FILTER.kind = FILTER.kind === c.dataset.kind ? '' : c.dataset.kind; filtersChanged();
  });
  rBtn.addEventListener('click', () => {
    FILTER.building = FILTER.kind = FILTER.floor = ''; bSel.value = ''; fSel.disabled = true;
    fSel.innerHTML = '<option value="">Any floor</option>'; filtersChanged();
  });

  // ---------- search fields ----------
  function Field(kind) {
    const input = $(kind + 'Input'), list = $(kind + 'List'), clear = $(kind + 'Clear'), hint = $(kind + 'Hint');
    let items = [], active = -1;
    const self = {
      set(v, silent) {
        S[kind] = v; input.value = v >= 0 ? E.name(v) : '';
        hint.textContent = v >= 0 ? E.describe(v) : '';
        clear.hidden = v < 0 && !input.value;
        close();
        if (!silent) onPick();
      },
      focus() { input.focus(); }
    };
    function close() { list.hidden = true; input.setAttribute('aria-expanded', 'false'); active = -1; }
    function open() {
      items = E.search(input.value, (FILTER.building || FILTER.kind || FILTER.floor) ? 40 : 8, FILTER);
      if (!items.length) { close(); return; }
      list.innerHTML = items.map((v, k) => '<li role="option" data-k="' + k + '" aria-selected="false">' + icon(typeIcon(v)) +
        '<div><b>' + esc(E.name(v)) + '</b><span>' + esc(E.place(v)) + '</span></div></li>').join('');
      list.hidden = false; input.setAttribute('aria-expanded', 'true'); active = -1;
    }
    function mark(k) {
      active = k;
      list.querySelectorAll('li').forEach((li, n) => li.setAttribute('aria-selected', String(n === k)));
    }
    input.addEventListener('input', () => {
      S[kind] = -1; hint.textContent = ''; clear.hidden = !input.value; open();
    });
    input.addEventListener('focus', () => { if ((input.value || FILTER.building || FILTER.kind || FILTER.floor) && S[kind] < 0) open(); input.select(); });
    self.refresh = () => { if (document.activeElement === input && S[kind] < 0) open(); };
    input.addEventListener('blur', () => setTimeout(close, 120));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (list.hidden) open(); mark(Math.min(items.length - 1, active + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); mark(Math.max(0, active - 1)); }
      else if (e.key === 'Enter' && !list.hidden && items.length) { e.preventDefault(); self.set(items[active >= 0 ? active : 0]); }
      else if (e.key === 'Escape') close();
    });
    list.addEventListener('mousedown', (e) => {
      const li = e.target.closest('li'); if (!li) return;
      e.preventDefault(); self.set(items[+li.dataset.k]);
    });
    clear.addEventListener('click', () => { input.value = ''; S[kind] = -1; hint.textContent = ''; clear.hidden = true; input.focus(); });
    function onPick() { if (S.from >= 0 && S.to >= 0) { status(''); findRoute(); } else if (kind === 'from') $('toInput').focus(); }
    return self;
  }
  const fromField = Field('from'), toField = Field('to');

  function status(msg) { $('status').textContent = msg; }

  function findRoute() {
    if (S.from < 0 || S.to < 0) { status(S.from < 0 ? 'Choose where you are first.' : 'Choose where you are going.'); (S.from < 0 ? fromField : toField).focus(); return; }
    if (S.from === S.to) { status('Start and destination are the same place.'); return; }
    const fast = E.route(S.from, S.to, false);
    if (!fast.found) { status('No route between these places.'); return; }
    const free = usesStairs(fast) ? E.route(S.from, S.to, true) : fast;
    S.routes = { fast, free };
    if (S.mode === 'free' && !free.found) { S.mode = 'fast'; status('No step-free way exists, showing the fastest route.'); }
    else status('');
    showRoute();
  }

  // ---------- nearest ----------
  const NEAR = {
    restroom: { types: ['RESTROOM'], label: 'restroom' },
    elevator: { types: ['ELEVATOR'], label: 'elevator' },
    food: { types: ['CAFE', 'RESTAURANT', 'VENDOR'], label: 'place to eat' },
    entrance: { types: ['ENTRANCE'], label: 'entrance' }
  };
  function nearest(kind) {
    const chips = document.querySelectorAll('.chip');
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.find === kind)));
    if (S.from < 0) { status('Choose where you are first.'); fromField.focus(); return; }
    const found = E.nearest(S.from, NEAR[kind].types, S.mode === 'free', 4), ol = $('found');
    if (!found.length) { ol.innerHTML = '<li><small style="color:var(--sign-soft)">Nothing found that way.</small></li>'; ol.hidden = false; return; }
    ol.innerHTML = found.map((f, k) => '<li><button type="button" data-near="' + f.v + '"><span>' + esc(E.name(f.v)) +
      '<small>' + esc(E.place(f.v)) + '</small></span><span class="dist">' + Math.round(E.meters(f.units)) + ' m</span></button></li>').join('');
    ol.hidden = false;
    status('');
  }

  // ---------- examples, hash, theme ----------
  const EXAMPLES = [
    ['SSE_P_P106', 'SSE_F1_1214', 'Stairs or lift?', 'Lab P106 to Lab 1214, one floor up'],
    ['SSE_F1_1184', 'LIB_P_P001', 'Across campus', 'A faculty office in SSE to the Library'],
    ['HUSS_P_CP66', 'SPORTS_G_G001', 'Between two far buildings', 'A HUSS classroom to the Sports Complex']
  ];
  function drawExamples() {
    $('exampleList').innerHTML = EXAMPLES.map((e, i) => {
      if (E.findKey(e[0]) < 0 || E.findKey(e[1]) < 0) return '';
      return '<li><button type="button" data-ex="' + i + '"><b>' + esc(e[2]) + '</b><span>' + esc(e[3]) + '</span></button></li>';
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
      S.mode = m.free === '1' ? 'free' : 'fast';
      document.querySelectorAll('.mode').forEach((x) => x.setAttribute('aria-pressed', String((x.id === 'modeFree') === (S.mode === 'free'))));
      fromField.set(a, true); toField.set(b, true); findRoute();
      return true;
    }
    return false;
  }
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('theme', t); } catch (e) { /* ignore */ }
  }

  // ---------- events ----------
  $('planner').addEventListener('submit', (e) => { e.preventDefault(); findRoute(); });
  $('swapBtn').addEventListener('click', () => {
    const a = S.from, b = S.to, btn = $('swapBtn');
    btn.classList.toggle('turn');
    fromField.set(b, true); toField.set(a, true);
    if (S.from >= 0 && S.to >= 0) findRoute();
  });
  function setMode(m) {
    S.mode = m;
    document.querySelectorAll('.mode').forEach((x) => x.setAttribute('aria-pressed', String((x.id === 'modeFree') === (m === 'free'))));
    if (S.routes) {
      if (!S.routes[m].found) { S.mode = 'fast'; status('No step-free way between these places.'); return; }
      status(''); showRoute();
    }
  }
  $('modeFast').addEventListener('click', () => setMode('fast'));
  $('modeFree').addEventListener('click', () => setMode('free'));
  $('compare').addEventListener('click', (e) => { const t = e.target.closest('.ticket'); if (t && t.dataset.mode) setMode(t.dataset.mode); });
  $('steps').addEventListener('click', (e) => {
    const b = e.target.closest('.step'); if (!b || !S.R) return;
    const s = S.R.steps[+b.dataset.step];
    S.playing = false; updatePlayBtn();
    renderAt(s.kind === 'end' ? 1 : S.R.cum[s.from] / S.R.total + 0.0005);
    pzF.fit(routeBox(S.sheet) || sheetBox[S.sheet], true);
  });
  $('playBtn').addEventListener('click', () => (S.playing ? pause() : play()));
  $('scrub').addEventListener('input', (e) => { S.playing = false; updatePlayBtn(); renderAt(e.target.value / 1000); });
  $('exampleList').addEventListener('click', (e) => {
    const b = e.target.closest('[data-ex]'); if (!b) return;
    const ex = EXAMPLES[+b.dataset.ex];
    fromField.set(E.findKey(ex[0]), true); toField.set(E.findKey(ex[1]), true); findRoute();
  });
  document.querySelector('.nearby').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (chip) { nearest(chip.dataset.find); return; }
    const n = e.target.closest('[data-near]');
    if (n) { toField.set(+n.dataset.near, true); findRoute(); }
  });
  $('floorChips').addEventListener('click', (e) => {
    const c = e.target.closest('.floor-chip'); if (c) setSheet(+c.dataset.sheet, { animate: true });
  });
  document.querySelectorAll('.zoom button').forEach((b) => b.addEventListener('click', () => {
    const pz = b.dataset.pane === 'campus' ? pzC : pzF;
    if (b.dataset.zoom === 'in') pz.zoomCenter(0.7);
    else if (b.dataset.zoom === 'out') pz.zoomCenter(1.43);
    else pz.reset();
  }));
  $('copyBtn').addEventListener('click', () => {
    writeHash();
    const done = () => { $('copyBtn').lastChild.textContent = 'Link copied'; setTimeout(() => { $('copyBtn').lastChild.textContent = 'Copy link to this route'; }, 1800); };
    if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done, () => { $('copyBtn').lastChild.textContent = location.href; });
    else $('copyBtn').lastChild.textContent = location.href;
  });
  $('themeBtn').addEventListener('click', () => applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));

  // hover and click on the maps
  const tip = $('tip'), pop = $('pop');
  function bind(svg, pz) {
    svg.addEventListener('pointermove', (e) => {
      const t = e.target.closest('[data-v],[data-b]');
      if (!t || pz.moved) { tip.hidden = true; return; }
      if (t.dataset.v !== undefined) {
        const v = +t.dataset.v; tip.innerHTML = esc(E.name(v)) + '<small>' + esc(E.place(v)) + '</small>';
      } else tip.innerHTML = esc(D.buildings[+t.dataset.b][1]) + '<small>Click to see its floors</small>';
      tip.hidden = false; tip.style.left = Math.min(window.innerWidth - 300, e.clientX + 14) + 'px'; tip.style.top = e.clientY + 16 + 'px';
    });
    svg.addEventListener('pointerleave', () => { tip.hidden = true; });
    svg.addEventListener('click', (e) => {
      if (pz.moved) return;
      const t = e.target.closest('[data-v],[data-b]');
      if (!t) { pop.hidden = true; return; }
      if (t.dataset.b !== undefined) {
        const bi = +t.dataset.b, sheets = buildingSheets[bi]; if (!sheets.length) return;
        const pick = sheets.find((s) => s.floor === 0) || sheets[0];
        setSheet(pick.si, { animate: true }); pop.hidden = true; return;
      }
      const v = +t.dataset.v;
      pop.innerHTML = '<b>' + esc(E.name(v)) + '</b><small>' + esc(E.place(v)) + '</small><p class="about">' + esc(E.describe(v)) + '</p><div class="row"><button type="button" class="from">From here</button><button type="button" class="to">To here</button></div>';
      pop.hidden = false;
      pop.style.left = Math.max(8, Math.min(window.innerWidth - 256, e.clientX - 120)) + 'px';
      pop.style.top = Math.max(8, Math.min(window.innerHeight - 250, e.clientY + 12)) + 'px';
      pop.dataset.v = v; tip.hidden = true;
    });
  }
  bind(campusSvg, pzC); bind(floorSvg, pzF);
  pop.addEventListener('click', (e) => {
    const v = +pop.dataset.v;
    if (e.target.classList.contains('from')) fromField.set(v, true);
    else if (e.target.classList.contains('to')) toField.set(v, true);
    else return;
    pop.hidden = true;
    if (S.from >= 0 && S.to >= 0) findRoute(); else (S.from < 0 ? fromField : toField).focus();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { pop.hidden = true; tip.hidden = true; } });
  document.addEventListener('mousedown', (e) => { if (!pop.hidden && !pop.contains(e.target)) pop.hidden = true; });

  // ---------- start ----------
  let theme = 'light';
  try { theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); } catch (e) { /* ignore */ }
  document.documentElement.setAttribute('data-theme', theme);

  drawCampus();
  drawExamples();
  const buildingsCount = D.buildings.length - 1;
  $('sideFoot').textContent = N.toLocaleString() + ' places and ' + D.ea.length.toLocaleString() + ' paths in ' + buildingsCount + ' buildings, from the AUC floor plans.';
  const sse = D.sheets.findIndex((s) => s[0] === 'SSE_P');
  setSheet(sse >= 0 ? sse : 0, { animate: false });
  $('floorOverlay').textContent = 'Click a building on the map to look inside.';
  $('floorOverlay').classList.add('on');
  setTimeout(() => { if (!S.R) $('floorOverlay').classList.remove('on'); }, 4200);
  if (!readHash()) $('fromInput').focus();

  // handy for testing from the console
  window.__app = { S, E, findRoute, fromField, toField, renderAt, setMode };
})();

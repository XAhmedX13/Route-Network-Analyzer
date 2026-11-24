/*
 * engine.js
 * Routing logic of the web page (no DOM). Same idea as the C++ project:
 * an adjacency list built from the campus data, Dijkstra with a binary heap,
 * and a step builder that turns a path into readable directions.
 * Weights are PDF points of the 1:200 floor plans, about 7.06 cm each.
 */
(function (root) {
  'use strict';

  var METERS_PER_UNIT = 0.0706;
  var WALK_SPEED = 1.3;            // metres per second
  var STAIRS_SECONDS = 15;         // extra time for a flight of stairs
  var ELEVATOR_SECONDS = 40;       // waiting plus riding

  var D, N, adjStart, adjTo, adjW, adjT, adjAcc, nameCache = [];
  var typeIs = {};

  function init(data) {
    D = data;
    N = D.keys.length;
    D.types.forEach(function (t, i) { typeIs[t] = i; });
    // adjacency list in compact arrays (CSR): the edges of vertex v are adjStart[v] .. adjStart[v+1]
    var degree = new Int32Array(N + 1), i;
    for (i = 0; i < D.ea.length; i++) { degree[D.ea[i]]++; degree[D.eb[i]]++; }
    adjStart = new Int32Array(N + 1);
    for (i = 0; i < N; i++) adjStart[i + 1] = adjStart[i] + degree[i];
    var fill = adjStart.slice(0, N), total = adjStart[N];
    adjTo = new Int32Array(total); adjW = new Int32Array(total);
    adjT = new Uint8Array(total); adjAcc = new Uint8Array(total);
    function put(u, v, k) {
      var p = fill[u]++;
      adjTo[p] = v; adjW[p] = D.ew[k]; adjT[p] = D.et[k]; adjAcc[p] = D.eacc[k];
    }
    for (i = 0; i < D.ea.length; i++) { put(D.ea[i], D.eb[i], i); put(D.eb[i], D.ea[i], i); }
    return api;
  }

  // ---------- names ----------
  function name(v) {
    if (nameCache[v] === undefined) nameCache[v] = D.labels[v].replace(/_/g, ' ');
    return nameCache[v];
  }
  function building(v) { return D.buildings[D.sheets[D.sheet[v]][1]]; }
  function sheetOf(v) { return D.sheets[D.sheet[v]]; }
  function typeName(v) { return D.types[D.type[v]]; }
  function isWaypoint(v) { return D.type[v] === typeIs.HALLWAY; }
  function floorName(v) { return sheetOf(v)[3]; }
  function isOutdoors(v) { return building(v)[0] === 'CAMPUS'; }
  function place(v) {
    if (isOutdoors(v)) return 'Outdoors';
    return building(v)[1] + ', ' + floorName(v) + ' floor';
  }
  function meters(units) { return units * METERS_PER_UNIT; }

  // ---------- binary heap of [distance, vertex] ----------
  function Heap() { this.d = []; this.v = []; }
  Heap.prototype.push = function (dist, vert) {
    var d = this.d, v = this.v, i = d.length;
    d.push(dist); v.push(vert);
    while (i > 0) {
      var p = (i - 1) >> 1;
      if (d[p] <= d[i]) break;
      var td = d[p]; d[p] = d[i]; d[i] = td;
      var tv = v[p]; v[p] = v[i]; v[i] = tv;
      i = p;
    }
  };
  Heap.prototype.pop = function () {
    var d = this.d, v = this.v, top = [d[0], v[0]], last = d.length - 1;
    d[0] = d[last]; v[0] = v[last]; d.pop(); v.pop();
    var i = 0, n = d.length;
    while (true) {
      var l = 2 * i + 1, r = l + 1, m = i;
      if (l < n && d[l] < d[m]) m = l;
      if (r < n && d[r] < d[m]) m = r;
      if (m === i) break;
      var td = d[m]; d[m] = d[i]; d[i] = td;
      var tv = v[m]; v[m] = v[i]; v[i] = tv;
      i = m;
    }
    return top;
  };
  Heap.prototype.size = function () { return this.d.length; };

  // ---------- Dijkstra ----------
  // Returns distances and previous-vertex arrays from source.
  // stepFree skips every edge that is not accessible (all stairs).
  // Stops early when target is settled.
  function dijkstra(source, stepFree, target) {
    var dist = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1);
    var done = new Uint8Array(N), heap = new Heap();
    dist[source] = 0; heap.push(0, source);
    while (heap.size() > 0) {
      var top = heap.pop(), u = top[1];
      if (done[u]) continue;
      done[u] = 1;
      if (u === target) break;
      for (var p = adjStart[u]; p < adjStart[u + 1]; p++) {
        if (stepFree && !adjAcc[p]) continue;
        var v = adjTo[p], nd = dist[u] + adjW[p];
        if (nd < dist[v]) { dist[v] = nd; prev[v] = u; heap.push(nd, v); }
      }
    }
    return { dist: dist, prev: prev };
  }

  function edgeBetween(a, b, stepFree) {
    var best = -1;
    for (var p = adjStart[a]; p < adjStart[a + 1]; p++) {
      if (adjTo[p] !== b) continue;
      if (stepFree && !adjAcc[p]) continue;
      if (best < 0 || adjW[p] < adjW[best]) best = p;
    }
    return best;
  }

  function route(from, to, stepFree) {
    if (from === to) return { path: [from], units: 0, edges: [], found: true };
    var r = dijkstra(from, stepFree, to);
    if (r.dist[to] === Infinity) return { found: false };
    var path = [], v = to;
    while (v !== -1) { path.push(v); v = r.prev[v]; }
    path.reverse();
    var edges = [];
    for (var i = 0; i + 1 < path.length; i++) {
      var p = edgeBetween(path[i], path[i + 1], stepFree);
      edges.push({ a: path[i], b: path[i + 1], w: adjW[p], t: adjT[p], acc: adjAcc[p] });
    }
    var seconds = 0;
    edges.forEach(function (e) {
      seconds += meters(e.w) / WALK_SPEED;
      if (D.edgeTypes[e.t] === 'STAIRS') seconds += STAIRS_SECONDS;
      if (D.edgeTypes[e.t] === 'ELEVATOR') seconds += ELEVATOR_SECONDS;
    });
    return { found: true, path: path, edges: edges, units: r.dist[to], seconds: seconds };
  }

  // The nearest vertices of some types from a start (step-free or not).
  function nearest(from, typeNames, stepFree, limit) {
    var r = dijkstra(from, stepFree), wanted = {}, out = [];
    typeNames.forEach(function (t) { wanted[typeIs[t]] = true; });
    for (var v = 0; v < N; v++) {
      if (v !== from && wanted[D.type[v]] && r.dist[v] < Infinity) out.push({ v: v, units: r.dist[v] });
    }
    out.sort(function (a, b) { return a.units - b.units; });
    return out.slice(0, limit || 5);
  }

  // ---------- plain-words description of a place ----------
  var WHAT = {
    ROOM: 'A room or office', CLASSROOM: 'A classroom or lecture room', RESTROOM: 'A restroom', ELEVATOR: 'An elevator',
    STAIRS: 'A staircase', ENTRANCE: 'An entrance door', CAFE: 'A cafe', RESTAURANT: 'A place to eat', VENDOR: 'A vending point',
    BUILDING: 'A building', OUTDOOR: 'An outdoor spot', OTHER: 'A room or service space', HALLWAY: 'A corridor point'
  };
  // returns a few short sentences, e.g. "A classroom on the First floor of X. About 12 m from the nearest elevator. Close to Lab 2111."
  function describe(v) {
    var t = typeName(v), out = [], r = dijkstra(v, false), best = {}, close = [], x;
    var where = isOutdoors(v) ? 'outdoors on the campus walkways' : 'on the ' + floorName(v) + ' floor of ' + building(v)[1];
    out.push(WHAT[t] + ' ' + where + '.');
    for (x = 0; x < N; x++) {
      if (x === v || r.dist[x] === Infinity || isWaypoint(x)) continue;
      var tx = typeName(x), same = D.sheet[x] === D.sheet[v];
      if (!same) continue;                                  // landmarks on the same floor only
      if (tx === 'ELEVATOR' || tx === 'RESTROOM' || tx === 'STAIRS' || tx === 'ENTRANCE') {
        if (!best[tx] || r.dist[x] < best[tx].d) best[tx] = { v: x, d: r.dist[x] };
      } else if (tx === 'ROOM' || tx === 'CLASSROOM' || tx === 'CAFE' || tx === 'RESTAURANT') {
        close.push({ v: x, d: r.dist[x] });
      }
    }
    var kinds = [['ELEVATOR', 'elevator'], ['RESTROOM', 'restroom'], ['STAIRS', 'stairs'], ['ENTRANCE', 'entrance']], bits = [];
    kinds.forEach(function (k) {
      if (best[k[0]] && k[0] !== t) bits.push(Math.max(1, Math.round(meters(best[k[0]].d))) + ' m to the nearest ' + k[1]);
    });
    if (bits.length) out.push('On this floor: ' + bits.join(', ') + '.');
    close.sort(function (a, b) { return a.d - b.d; });
    if (close.length) out.push('Close to ' + close.slice(0, 3).map(function (c) { return name(c.v); }).join(', ') + '.');
    return out.join(' ');
  }

  // ---------- directions ----------
  function edgeKind(e) {
    var t = D.edgeTypes[e.t];
    if (t === 'STAIRS') return 'stairs';
    if (t === 'ELEVATOR') return 'elevator';
    var oa = isOutdoors(e.a), ob = isOutdoors(e.b);
    if (oa && ob) return 'outdoor';
    if (oa || ob) return 'door';
    return 'walk';
  }

  // ---------- turn by turn: where a walk bends left or right ----------
  var sheetSize = null, sheetPlaces = null;
  var LANDMARK = { ROOM: 1, CLASSROOM: 1, RESTROOM: 1, ELEVATOR: 1, STAIRS: 1, CAFE: 1, RESTAURANT: 1, VENDOR: 1, ENTRANCE: 1, OUTDOOR: 1, BUILDING: 1 };
  function prepareSheets() {
    sheetSize = []; sheetPlaces = [];
    var box = [];
    for (var v = 0; v < N; v++) {
      var s = D.sheet[v];
      if (!box[s]) { box[s] = [1e9, 1e9, -1e9, -1e9]; sheetPlaces[s] = []; }
      var b = box[s];
      if (D.x[v] < b[0]) b[0] = D.x[v]; if (D.y[v] < b[1]) b[1] = D.y[v];
      if (D.x[v] > b[2]) b[2] = D.x[v]; if (D.y[v] > b[3]) b[3] = D.y[v];
      if (LANDMARK[typeName(v)] && D.keys[v].indexOf('_O_D_') < 0) sheetPlaces[s].push(v);
    }
    box.forEach(function (b, s) { sheetSize[s] = Math.max(b[2] - b[0], b[3] - b[1], 100); });
  }
  // the named place closest to a turn, to say "turn left near Lab 1214"
  function landmarkNear(v, avoid) {
    var s = D.sheet[v], best = -1, bd = sheetSize[s] * 0.025;
    sheetPlaces[s].forEach(function (p) {
      if (avoid.indexOf(p) >= 0) return;
      var d = Math.hypot(D.x[p] - D.x[v], D.y[p] - D.y[v]);
      if (d < bd) { bd = d; best = p; }
    });
    return best;
  }
  // keep only the corners of a polyline (Ramer Douglas Peucker), returns indices into pts
  function corners(pts, eps) {
    var keep = [0, pts.length - 1];
    (function split(a, b) {
      var far = -1, fd = eps;
      var dx = pts[b].x - pts[a].x, dy = pts[b].y - pts[a].y, L = Math.hypot(dx, dy) || 1;
      for (var k = a + 1; k < b; k++) {
        var d = Math.abs(dy * (pts[k].x - pts[a].x) - dx * (pts[k].y - pts[a].y)) / L;
        if (d > fd) { fd = d; far = k; }
      }
      if (far > 0) { keep.push(far); split(a, far); split(far, b); }
    })(0, pts.length - 1);
    return keep.sort(function (a, b) { return a - b; });
  }
  // the turns along path[from..to]: [{ k: path index, angle: degrees, + is right }]
  // (on these plans y grows downwards, so a clockwise bend is a turn to the right)
  function turnsAlong(path, cu, from, to) {
    if (!sheetSize) prepareSheets();
    var pts = [];
    for (var k = from; k <= to; k++) pts.push({ x: D.x[path[k]], y: D.y[path[k]] });
    if (pts.length < 3) return [];
    var eps = Math.max(3, sheetSize[D.sheet[path[from]]] * 0.006);
    var keep = corners(pts, eps), raw = [];
    for (var j = 1; j < keep.length - 1; j++) {
      var a = pts[keep[j - 1]], b = pts[keep[j]], c = pts[keep[j + 1]];
      var ax = b.x - a.x, ay = b.y - a.y, bx = c.x - b.x, by = c.y - b.y;
      if (Math.hypot(ax, ay) < eps || Math.hypot(bx, by) < eps) continue;     // a small jog, not a corner
      var ang = Math.atan2(ax * by - ay * bx, ax * bx + ay * by) * 180 / Math.PI;
      raw.push({ k: from + keep[j], angle: ang });
    }
    // two bends close together are one corner (for example two half turns around a pillar)
    var out = [];
    raw.forEach(function (t) {
      var last = out[out.length - 1];
      var gap = last ? meters(cu[t.k] - cu[last.k]) : 99;
      // close bends are one corner, and a right then a left a few metres apart is a side step, not two turns
      if (last && (gap < 2.5 || (gap < 6 && (last.angle > 0) !== (t.angle > 0)))) { last.angle += t.angle; return; }
      out.push({ k: t.k, angle: t.angle });
    });
    return out.filter(function (t) {
      while (t.angle > 180) t.angle -= 360;
      while (t.angle < -180) t.angle += 360;
      return Math.abs(t.angle) >= 40;      // gentler bends than this are just the corridor
    });
  }
  function turnWords(angle) {
    var side = angle > 0 ? 'right' : 'left', a = Math.abs(angle);
    if (a > 150) return { kind: 'around', side: side, text: 'Turn around' };
    if (a < 60) return { kind: 'slight-' + side, side: side, text: 'Keep ' + side };
    return { kind: side, side: side, text: 'Turn ' + side };
  }
  // one walking part of the route as turn by turn steps
  function walkSteps(path, cu, from, to, opening, target, detail, destination) {
    var origin = path[0];
    var turns = turnsAlong(path, cu, from, to);
    var m = function (a, b) { return Math.max(1, Math.round(meters(cu[b] - cu[a]))); };
    if (!turns.length) return [{ kind: 'walk', from: from, to: to, text: opening(m(from, to)) + (target ? ' to ' + target : ''), detail: detail, meters: m(from, to) }];
    var out = [], start = from;
    if (meters(cu[turns[0].k] - cu[from]) >= 5) {
      out.push({ kind: 'walk', from: from, to: turns[0].k, text: opening(m(from, turns[0].k)), detail: detail, meters: m(from, turns[0].k) });
    }
    turns.forEach(function (t, i) {
      var end = i + 1 < turns.length ? turns[i + 1].k : to, last = i === turns.length - 1;
      var w = turnWords(t.angle), lm = landmarkNear(path[t.k], [origin, destination]), rest = meters(cu[end] - cu[t.k]);
      var text;
      if (last && target && rest < 6) {
        text = target.charAt(0).toUpperCase() + target.slice(1) + (/^the stairs$/.test(target) ? ' are' : ' is') + ' on your ' + w.side;
      } else {
        text = w.text + (lm >= 0 ? ' near ' + name(lm) : '') + (rest >= 2 ? ', then walk ' + m(t.k, end) + ' m' : '') + (last && target ? ' to ' + target : '');
      }
      out.push({ kind: w.kind, from: i === 0 && out.length === 0 ? start : t.k, to: end, text: text, detail: detail, meters: m(t.k, end) });
    });
    return out;
  }

  function steps(rt) {
    var out = [], i;
    var cu = [0];
    for (i = 0; i < rt.edges.length; i++) cu.push(cu[i] + rt.edges[i].w);
    if (!rt.found) return out;
    out.push({ kind: 'start', from: 0, to: 0, text: 'Start at ' + name(rt.path[0]), detail: place(rt.path[0]), meters: 0 });
    var groups = [];
    for (i = 0; i < rt.edges.length; i++) {
      var e = rt.edges[i], kind = edgeKind(e), last = groups[groups.length - 1];
      var sameMap = last && D.sheet[e.a] === D.sheet[last.edges[0].a];
      if (last && last.kind === kind && (kind === 'outdoor' || (kind === 'walk' && sameMap))) {
        last.edges.push(e); last.to = i + 1;
      } else {
        groups.push({ kind: kind, edges: [e], from: i, to: i + 1 });
      }
    }
    groups.forEach(function (g, gi) {
      var first = g.edges[0], lastE = g.edges[g.edges.length - 1];
      var units = g.edges.reduce(function (s, e) { return s + e.w; }, 0);
      var m = Math.round(meters(units));
      var next = groups[gi + 1], text, detail = '';
      var endV = lastE.b;
      if (g.kind === 'walk') {
        var target = isWaypoint(endV) ? null : name(endV);
        if (next && !target) {
          target = next.kind === 'stairs' ? 'the stairs' : next.kind === 'elevator' ? 'the elevator'
            : next.kind === 'door' ? 'the exit' : null;
        }
        if (gi === groups.length - 1) target = name(endV);
        out.push.apply(out, walkSteps(rt.path, cu, g.from, g.to, function (mm) { return 'Walk ' + mm + ' m'; }, target, place(first.a), endV));
        return;
      } else if (g.kind === 'outdoor') {
        var outTarget = isWaypoint(endV) || D.keys[endV].indexOf('_O_D_') >= 0 ? null : name(endV);
        out.push.apply(out, walkSteps(rt.path, cu, g.from, g.to, function (mm) { return 'Walk ' + mm + ' m across campus'; }, outTarget, 'Outdoors', endV));
        return;
      } else if (g.kind === 'door') {
        var leaving = !isOutdoors(first.a);
        var b = leaving ? building(first.a) : building(first.b);
        text = (leaving ? 'Leave ' : 'Enter ') + b[1];
        detail = leaving ? place(first.a) : place(first.b);
      } else {
        var fa = sheetOf(first.a)[2], fb = sheetOf(first.b)[2];
        var dir = fb > fa ? 'up' : 'down';
        var floorsText = Math.abs(fb - fa) > 1 ? Math.abs(fb - fa) + ' floors ' : '';
        text = 'Take the ' + (g.kind === 'stairs' ? 'stairs ' : 'elevator ') + floorsText + dir + ' to the ' + sheetOf(first.b)[3] + ' floor';
        detail = building(first.a)[1];
        m = Math.round(meters(units));
      }
      out.push({ kind: g.kind, from: g.from, to: g.to, text: text, detail: detail, meters: m });
    });
    out.push({ kind: 'end', from: rt.edges.length, to: rt.edges.length, text: 'Arrive at ' + name(rt.path[rt.path.length - 1]),
      detail: place(rt.path[rt.path.length - 1]), meters: 0 });
    return out;
  }

  // ---------- search ----------
  var searchIndex = null;
  function buildSearch() {
    searchIndex = [];
    for (var v = 0; v < N; v++) {
      if (isWaypoint(v)) continue;
      var b = building(v);
      searchIndex.push({
        v: v, name: name(v).toLowerCase(),
        hay: (name(v) + ' ' + D.keys[v].replace(/_/g, ' ') + ' ' + b[0] + ' ' + b[1] + ' ' + floorName(v)).toLowerCase()
      });
    }
  }
  var KINDS = {
    room: ['ROOM', 'OTHER'], class: ['CLASSROOM'], restroom: ['RESTROOM'], elevator: ['ELEVATOR'],
    stairs: ['STAIRS'], food: ['CAFE', 'RESTAURANT', 'VENDOR'], entrance: ['ENTRANCE'], building: ['BUILDING', 'OUTDOOR']
  };
  // filter = { building: 'SSE' or '', kind: 'class' or '', floor: 'Ground' or '' }
  function passes(v, f) {
    if (!f) return true;
    if (f.building && building(v)[0] !== f.building) return false;
    if (f.floor && floorName(v) !== f.floor) return false;
    if (f.kind && KINDS[f.kind].indexOf(typeName(v)) < 0) return false;
    return true;
  }
  function floorsOf(code) {
    var out = [];
    D.sheets.forEach(function (s) { if (D.buildings[s[1]][0] === code && out.indexOf(s[3]) < 0) out.push(s[3]); });
    return out;
  }
  function search(query, limit, filter) {
    if (!searchIndex) buildSearch();
    var q = query.toLowerCase().trim();
    var active = filter && (filter.building || filter.kind || filter.floor);
    if (!q && !active) return [];
    var tokens = q ? q.split(/\s+/) : [], out = [];
    for (var i = 0; i < searchIndex.length; i++) {
      var item = searchIndex[i], ok = passes(item.v, filter), score = 0;
      if (!ok) continue;
      for (var t = 0; t < tokens.length; t++) {
        var at = item.hay.indexOf(tokens[t]);
        if (at < 0) { ok = false; break; }
        score += (at === 0 || item.hay.charAt(at - 1) === ' ') ? 2 : 1;
      }
      if (!ok) continue;
      if (item.name.indexOf(q) === 0) score += 4;
      else if (item.name.indexOf(q) > 0) score += 2;
      out.push({ v: item.v, score: score, len: item.name.length });
    }
    out.sort(function (a, b) { return b.score - a.score || a.len - b.len; });
    return out.slice(0, limit || 8).map(function (o) { return o.v; });
  }
  function findKey(key) { return D.keys.indexOf(key); }

  // ---------- formatting ----------
  function formatTime(seconds) {
    var min = Math.max(1, Math.round(seconds / 60));
    return min === 1 ? '1 min' : min + ' min';
  }
  function formatMeters(m) { return m >= 1000 ? (m / 1000).toFixed(2) + ' km' : Math.round(m) + ' m'; }

  var api = {
    init: init, name: name, building: building, sheetOf: sheetOf, typeName: typeName, isWaypoint: isWaypoint,
    isOutdoors: isOutdoors, place: place, floorName: floorName, meters: meters,
    dijkstra: dijkstra, route: route, nearest: nearest, steps: steps,
    describe: describe, search: search, floorsOf: floorsOf, buildings: function () { return D.buildings; }, findKey: findKey, formatTime: formatTime, formatMeters: formatMeters,
    count: function () { return N; },
    data: function () { return D; }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Engine = api;
})(typeof window !== 'undefined' ? window : this);

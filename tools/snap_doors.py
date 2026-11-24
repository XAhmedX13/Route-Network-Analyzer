"""
snap_doors.py
Called by merge_campus.py after all files are joined.

Problem it fixes: a door (or room) is often joined to a corridor point that is not level with it,
so every route to that room walks past the door along the corridor and then comes back.
For every such link x - h, where h is a corridor point and x lies beside the corridor
segment h - h2, the segment is split at the point P right in front of x, and x is joined to P
instead of h. Weights keep the scale of the edges they replace.

Only indoor floors are touched. Stairs and elevator edges, and the wall-avoiding paths made by
SSER_reroute.py (keys with _RT_), are never used as corridor segments, and neither are door points
that only lead into their room.
"""
import math
import os
import sys


def snap(locations, edges, building_of):
    """locations: lists of 10 string fields with global IDs; edges: (a, b, weight, type, accessible)."""
    x = [float(f[8]) for f in locations]
    y = [float(f[9]) for f in locations]
    sheet = [f[7] for f in locations]
    # corridor points: HALLWAY vertices (not reroute points) with at least two HALLWAY neighbours on the
    # same floor. A door point that only leads from one corridor point into its room has one, so it is not.
    is_hall = [f[3] == "HALLWAY" for f in locations]
    hall_nb = [0] * len(locations)
    for a0, b0, _, t0, _ in edges:
        if locations[a0][7] == locations[b0][7] and t0 not in ("STAIRS", "ELEVATOR") and is_hall[a0] and is_hall[b0]:
            hall_nb[a0] += 1
            hall_nb[b0] += 1
    hall = [is_hall[v] and "_RT_" not in locations[v][1] and hall_nb[v] >= 2 for v in range(len(locations))]
    key = [f[1] for f in locations]

    edge = {i: list(e) for i, e in enumerate(edges)}      # edge id -> [a, b, weight, type, accessible]
    at = {}                                                # vertex -> set of edge ids
    for i, (a, b, *_) in edge.items():
        at.setdefault(a, set()).add(i)
        at.setdefault(b, set()).add(i)
    next_id = len(edge)

    def length(a, b):
        return math.hypot(x[a] - x[b], y[a] - y[b])

    def indoor_walk(e):
        a, b, _, t, _ = e
        return sheet[a] == sheet[b] and sheet[a] != "CAMPUS" and t not in ("STAIRS", "ELEVATOR")

    def corridor(e):
        a, b = e[0], e[1]
        return indoor_walk(e) and hall[a] and hall[b] and length(a, b) > 4

    def add_edge(a, b, w, t, acc):
        nonlocal next_id
        edge[next_id] = [a, b, str(max(1, int(round(w)))), t, acc]
        at.setdefault(a, set()).add(next_id)
        at.setdefault(b, set()).add(next_id)
        next_id += 1

    def remove_edge(i):
        a, b = edge[i][0], edge[i][1]
        at[a].discard(i); at[b].discard(i)
        del edge[i]

    snapped = 0
    for i in list(edge.keys()):
        if i not in edge:
            continue
        e = edge[i]
        if not indoor_walk(e):
            continue
        for xv, hv in ((e[0], e[1]), (e[1], e[0])):
            if locations[hv][3] != "HALLWAY":            # attached to a corridor or door point
                continue
            dxh = length(xv, hv)
            if dxh < 3:
                continue
            # corridor segments touching hv, and the ones one step further along the corridor
            near = set()
            for j in at.get(hv, ()):
                if j == i or not indoor_walk(edge[j]):
                    continue
                if corridor(edge[j]):
                    near.add(j)
                other = edge[j][1] if edge[j][0] == hv else edge[j][0]
                if other != xv and length(hv, other) < 40:
                    near.update(k for k in at.get(other, ()) if k != i and corridor(edge[k]))
            best = None
            for j in near:
                a, b = edge[j][0], edge[j][1]
                if xv in (a, b):
                    continue
                sx, sy = x[b] - x[a], y[b] - y[a]
                L2 = sx * sx + sy * sy
                t = ((x[xv] - x[a]) * sx + (y[xv] - y[a]) * sy) / L2
                if t < 0 or t > 1:
                    continue
                L = math.sqrt(L2)
                if t * L < 3:
                    target, px, py = a, x[a], y[a]           # already level with a corridor point
                elif (1 - t) * L < 3:
                    target, px, py = b, x[b], y[b]
                else:
                    target, px, py = None, x[a] + t * sx, y[a] + t * sy
                if target == hv:
                    continue
                dp = math.hypot(x[xv] - px, y[xv] - py)
                if dp > 0.85 * dxh:                           # no real saving
                    continue
                if target is not None and any(xv in edge[k][:2] for k in at.get(target, ())):
                    continue                                  # already joined to that point
                if best is None or dp < best[0]:
                    best = (dp, j, target, t, px, py)
            if best is None:
                continue
            dp, j, target, t, px, py = best
            link_scale = float(e[2]) / max(dxh, 1e-6)
            if target is None:
                # split the segment with a new corridor point P right in front of x
                s = edge[j]
                a, b = s[0], s[1]
                L = length(a, b)
                seg_scale = float(s[2]) / max(L, 1e-6)
                target = len(locations)
                src = locations[a]
                locations.append([str(target), f"{src[7]}_SN_{target}", "Corridor_Point", "HALLWAY", src[4], src[5], src[6], src[7],
                                  str(round(px, 1)), str(round(py, 1))])
                building_of.append(building_of[a])
                x.append(px); y.append(py); sheet.append(src[7]); hall.append(True); key.append(locations[-1][1])
                remove_edge(j)
                add_edge(a, target, t * L * seg_scale, s[3], s[4])
                add_edge(target, b, (1 - t) * L * seg_scale, s[3], s[4])
            remove_edge(i)
            add_edge(xv, target, dp * link_scale, e[3], e[4])
            snapped += 1
            break
    return locations, [tuple(e) for e in edge.values()], building_of, snapped


def shortcut(locations, edges, rounds=5, max_gap=60.0):
    """Removes there-and-back turns: when two edges at a vertex v leave in almost the same direction
    (to u and to w), a short direct edge u - w is added, so no shortest route goes u > v > w.
    The new edge is only added when it does not cross a wall on the floor plan picture."""
    try:
        sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".pylib"))
        import SSER_reroute as R                       # renders plans and finds walls (needs PyMuPDF)
    except Exception:                                  # without PyMuPDF the check cannot run, so add nothing
        return edges, 0
    x = [float(f[8]) for f in locations]
    y = [float(f[9]) for f in locations]
    sheet = [f[7] for f in locations]
    walls = {}

    def wall_ok(a, b):
        s = sheet[a]
        if s not in walls:
            try:
                walls[s] = R.wall_grid(s)[0]
            except Exception:
                walls[s] = None
        g = walls[s]
        if g is None:
            return False
        c = lambda v: (x[v] / R.CELL * R.ZOOM, y[v] / R.CELL * R.ZOOM)
        return not R.crosses(g, c(a), c(b))

    edges = [tuple(e) for e in edges]
    have = set((min(a, b), max(a, b)) for a, b, *_ in edges)
    added = 0
    for _ in range(rounds):
        nb = {}
        for a, b, w, t, acc in edges:
            if sheet[a] != sheet[b] or sheet[a] == "CAMPUS" or t in ("STAIRS", "ELEVATOR"):
                continue
            nb.setdefault(a, []).append((b, float(w), t, acc))
            nb.setdefault(b, []).append((a, float(w), t, acc))
        new = []
        for v, lst in nb.items():
            for i in range(len(lst)):
                for j in range(i + 1, len(lst)):
                    u, wu, tu, au = lst[i]
                    w2, ww, tw, aw = lst[j]
                    ax, ay = x[u] - x[v], y[u] - y[v]
                    bx, by = x[w2] - x[v], y[w2] - y[v]
                    la, lb = math.hypot(ax, ay), math.hypot(bx, by)
                    if la < 3 or lb < 3:
                        continue
                    if (ax * bx + ay * by) / (la * lb) < 0.9:      # not the same direction (more than about 25 degrees apart)
                        continue
                    gap = math.hypot(x[u] - x[w2], y[u] - y[w2])
                    if gap > max_gap or gap > 0.7 * max(la, lb):
                        continue
                    pair = (min(u, w2), max(u, w2))
                    if pair in have or not wall_ok(u, w2):
                        continue
                    scale = (wu + ww) / max(la + lb, 1e-6)
                    acc = "1" if au == "1" and aw == "1" else "0"
                    new.append((u, w2, str(max(1, int(round(gap * scale)))), "CORRIDOR", acc))
                    have.add(pair)
        if not new:
            break
        edges += new
        added += len(new)
    return edges, added


def tie_routes(locations, edges, building_of, max_dist=25.0):
    """The wall-avoiding paths of SSER_reroute.py sometimes run right beside a corridor, so a route walks along
    the corridor past them and comes back along the path. Every reroute point (_RT_) that is within max_dist of a
    corridor segment gets an extra link to the point right beside it on that segment (split there),
    when the plan picture shows no wall in between."""
    try:
        sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".pylib"))
        import SSER_reroute as R
    except Exception:
        return locations, edges, building_of, 0
    x = [float(f[8]) for f in locations]
    y = [float(f[9]) for f in locations]
    sheet = [f[7] for f in locations]
    is_hall = [f[3] == "HALLWAY" for f in locations]
    hall_nb = [0] * len(locations)
    for a, b, _, t, _ in edges:
        if sheet[a] == sheet[b] and t not in ("STAIRS", "ELEVATOR") and is_hall[a] and is_hall[b]:
            hall_nb[a] += 1
            hall_nb[b] += 1
    corr = [is_hall[v] and "_RT_" not in locations[v][1] and hall_nb[v] >= 2 for v in range(len(locations))]
    edges = [list(e) for e in edges]
    walls = {}

    def wall_ok(a, px, py):
        s = sheet[a]
        if s not in walls:
            try:
                walls[s] = R.wall_grid(s)[0]
            except Exception:
                walls[s] = None
        g = walls[s]
        return g is not None and not R.crosses(g, (x[a] / R.CELL * R.ZOOM, y[a] / R.CELL * R.ZOOM), (px / R.CELL * R.ZOOM, py / R.CELL * R.ZOOM))

    added = 0
    rt_points = [v for v in range(len(locations)) if "_RT_" in locations[v][1]]
    for r in rt_points:
        linked = set(b if a == r else a for a, b, *_ in edges if r in (a, b))
        best = None
        for idx, e in enumerate(edges):
            a, b = e[0], e[1]
            if e is None or sheet[a] != sheet[r] or sheet[b] != sheet[r] or not (corr[a] and corr[b]) or e[3] in ("STAIRS", "ELEVATOR"):
                continue
            if a in linked or b in linked:
                continue
            sx, sy = x[b] - x[a], y[b] - y[a]
            L2 = sx * sx + sy * sy
            if L2 < 25:
                continue
            t = ((x[r] - x[a]) * sx + (y[r] - y[a]) * sy) / L2
            if t <= 0.02 or t >= 0.98:
                continue
            px, py = x[a] + t * sx, y[a] + t * sy
            dp = math.hypot(x[r] - px, y[r] - py)
            if dp > max_dist or (best is not None and dp >= best[0]):
                continue
            best = (dp, idx, t, px, py)
        if best is None:
            continue
        dp, idx, t, px, py = best
        if not wall_ok(r, px, py):
            continue
        a, b, w, et, acc = edges[idx]
        L = math.hypot(x[b] - x[a], y[b] - y[a])
        scale = float(w) / max(L, 1e-6)
        pid = len(locations)
        src = locations[a]
        locations.append([str(pid), f"{src[7]}_SN_{pid}", "Corridor_Point", "HALLWAY", src[4], src[5], src[6], src[7],
                          str(round(px, 1)), str(round(py, 1))])
        building_of.append(building_of[a])
        x.append(px); y.append(py); sheet.append(src[7]); corr.append(True)
        edges[idx] = [a, pid, str(max(1, int(round(t * L * scale)))), et, acc]
        edges.append([pid, b, str(max(1, int(round((1 - t) * L * scale)))), et, acc])
        edges.append([r, pid, str(max(1, int(round(dp)))), "CORRIDOR", acc])
        added += 1
    return locations, [tuple(e) for e in edges], building_of, added

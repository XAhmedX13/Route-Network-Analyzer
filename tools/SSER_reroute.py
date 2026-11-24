"""
SSER_reroute.py
Re-routes every SSE connection that crosses a wall. For each SSE floor the plan PDF is rendered,
walls are found (dark grey or black lines, not coloured fills), and every same-floor edge whose
straight line hits a wall is replaced by a path that A* finds through the open cells of the plan
(doorways, corridors). The path is simplified to a few waypoints (new HALLWAY vertices in
data/campus/SSER_locations.txt) joined by edges in data/campus/SSER_links.txt, weight = length in
plan points like the rest of SSE.

The original wall-crossing edges are removed from SSE_edges, SSEX_edges, SSEX_links and
SSEFIX_links; copies of the untouched files are kept in data/campus/orig_SSER/ the first time,
and every later run starts again from those copies.
If SSEX_build.py or SSEX_fix_corridor.py is run again, delete data/campus/orig_SSER/ first,
otherwise this script would bring back the old files.
Run from the repository root:
    PYTHONPATH=tools/.pylib python tools/SSER_reroute.py [SSE_F2 ...]
then python tools/merge_campus.py
"""

import heapq
import math
import os
import shutil
import sys

import fitz
import numpy as np

sys.path.insert(0, "tools")
from make_web_plans import find_pdf  # noqa: E402

F = "data/campus"
ORIG = os.path.join(F, "orig_SSER")
ZOOM = 2.0              # render pixels per plan point
CELL = 2                # pixels per grid cell, so one cell is one plan point
WALL_COST = 25.0        # cost of stepping on a wall cell (an open cell costs 1)
SHEETS = ["SSE_P", "SSE_F1", "SSE_F2"]
FILES = ["SSE_edges.txt", "SSEX_edges.txt", "SSEX_links.txt", "SSEFIX_links.txt", "SSE_locations.txt",
         "SSEX_locations.txt", "SSEFIX_locations.txt"]


def read(name):
    lines = open(os.path.join(F, name), encoding="utf-8").read().splitlines()
    return lines[0], [l.split() for l in lines[1:] if l.strip()]


def wall_grid(sheet):
    page = fitz.open(find_pdf(sheet))[0]
    pix = page.get_pixmap(matrix=fitz.Matrix(ZOOM, ZOOM), colorspace=fitz.csRGB, alpha=False)
    a = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3).astype(np.int16)
    mx, mn = a.max(axis=2), a.min(axis=2)
    wall = (mx < 170) & ((mx - mn) < 45)                  # dark and not coloured: walls, furniture, text
    h, w = wall.shape[0] // CELL, wall.shape[1] // CELL
    wall = wall[:h * CELL, :w * CELL].reshape(h, CELL, w, CELL).any(axis=(1, 3))
    near = wall.copy()                                    # one cell of clearance next to walls costs extra
    near[1:, :] |= wall[:-1, :]; near[:-1, :] |= wall[1:, :]
    near[:, 1:] |= wall[:, :-1]; near[:, :-1] |= wall[:, 1:]
    return wall, near


def crosses(wall, a, b):
    n = int(max(abs(a[0] - b[0]), abs(a[1] - b[1]))) + 1
    xs = np.linspace(a[0], b[0], n).astype(int)
    ys = np.linspace(a[1], b[1], n).astype(int)
    xs = np.clip(xs, 0, wall.shape[1] - 1); ys = np.clip(ys, 0, wall.shape[0] - 1)
    hits = wall[ys, xs]
    # ignore the first and last 4 cells (the room's own furniture around the node)
    if n > 12:
        hits = hits[4:-4]
    return int(hits.sum()) >= 2


def astar(wall, near, a, b, pad=70):
    x0 = max(0, int(min(a[0], b[0])) - pad); x1 = min(wall.shape[1], int(max(a[0], b[0])) + pad)
    y0 = max(0, int(min(a[1], b[1])) - pad); y1 = min(wall.shape[0], int(max(a[1], b[1])) + pad)
    w, h = x1 - x0, y1 - y0
    block = wall[y0:y1, x0:x1].copy()
    soft = near[y0:y1, x0:x1]
    s = (int(a[0]) - x0, int(a[1]) - y0); t = (int(b[0]) - x0, int(b[1]) - y0)
    for (cx, cy) in (s, t):                               # the node itself may sit on text or furniture
        block[max(0, cy - 3):cy + 4, max(0, cx - 3):cx + 4] = False
    if not (0 <= s[0] < w and 0 <= s[1] < h and 0 <= t[0] < w and 0 <= t[1] < h):
        return None
    dist = {s: 0.0}
    prev = {}
    heap = [(0.0, s)]
    steps = ((1, 0, 1.0), (-1, 0, 1.0), (0, 1, 1.0), (0, -1, 1.0), (1, 1, 1.414), (1, -1, 1.414), (-1, 1, 1.414), (-1, -1, 1.414))
    while heap:
        f, u = heapq.heappop(heap)
        if u == t:
            break
        du = dist[u]
        if f - math.hypot(u[0] - t[0], u[1] - t[1]) > du + 1e-6:
            continue
        for dx, dy, c in steps:
            v = (u[0] + dx, u[1] + dy)
            if not (0 <= v[0] < w and 0 <= v[1] < h):
                continue
            # a wall cell is not forbidden but costs a lot, so doorways win unless there is no gap
            cell = WALL_COST if block[v[1], v[0]] else (3.0 if soft[v[1], v[0]] else 1.0)
            if dx and dy and (block[u[1], v[0]] or block[v[1], u[0]]):
                cell = max(cell, WALL_COST)               # diagonal steps may not slip between wall cells
            nd = du + c * cell
            if nd < dist.get(v, 1e18):
                dist[v] = nd; prev[v] = u
                heapq.heappush(heap, (nd + math.hypot(v[0] - t[0], v[1] - t[1]), v))
    if t not in prev and s != t:
        return None
    path = [t]
    while path[-1] != s:
        path.append(prev[path[-1]])
    path.reverse()
    return [(x + x0, y + y0) for x, y in path]


def rdp(points, eps):
    if len(points) < 3:
        return points
    (x1, y1), (x2, y2) = points[0], points[-1]
    dx, dy = x2 - x1, y2 - y1
    norm = math.hypot(dx, dy) or 1.0
    far, idx = 0.0, 0
    for i in range(1, len(points) - 1):
        d = abs(dy * points[i][0] - dx * points[i][1] + x2 * y1 - y2 * x1) / norm
        if d > far:
            far, idx = d, i
    if far > eps:
        return rdp(points[:idx + 1], eps)[:-1] + rdp(points[idx:], eps)
    return [points[0], points[-1]]


def main():
    wanted = sys.argv[1:] or SHEETS
    os.makedirs(ORIG, exist_ok=True)
    for n in FILES + ["SSER_locations.txt", "SSER_edges.txt", "SSER_links.txt"]:
        p = os.path.join(F, n)
        if os.path.exists(p) and not os.path.exists(os.path.join(ORIG, n)) and not n.startswith("SSER"):
            shutil.copy(p, os.path.join(ORIG, n))
    # always start from the untouched copies so the script can be run again
    for n in FILES:
        shutil.copy(os.path.join(ORIG, n), os.path.join(F, n))

    where, id_key, sheet_of = {}, {}, {}
    for name in ["SSE_locations.txt", "SSEX_locations.txt", "SSEFIX_locations.txt"]:
        _, rows = read(name)
        for r in rows:
            where[r[1]] = (float(r[8]), float(r[9]))
            sheet_of[r[1]] = r[7]
            id_key[(name, r[0])] = r[1]

    # every edge as (file, line index, key a, key b, weight, type, accessible)
    edges = []
    for name, loc in [("SSE_edges.txt", "SSE_locations.txt"), ("SSEX_edges.txt", "SSEX_locations.txt")]:
        _, rows = read(name)
        for i, e in enumerate(rows):
            edges.append((name, i, id_key[(loc, e[0])], id_key[(loc, e[1])], e[2], e[3], e[4]))
    for name in ["SSEX_links.txt", "SSEFIX_links.txt"]:
        _, rows = read(name)
        for i, e in enumerate(rows):
            edges.append((name, i, e[0], e[1], e[2], e[3], e[4]))

    new_loc, new_links, drop = [], [], {}
    for sheet in wanted:
        wall, near = wall_grid(sheet)
        todo = [e for e in edges if e[2] in sheet_of and e[3] in sheet_of and sheet_of[e[2]] == sheet and sheet_of[e[3]] == sheet
                and e[5] not in ("STAIRS", "ELEVATOR")]
        fixed = failed = 0
        for (name, i, ka, kb, w, et, acc) in todo:
            a = (where[ka][0] / CELL * ZOOM, where[ka][1] / CELL * ZOOM)   # plan points -> cells
            b = (where[kb][0] / CELL * ZOOM, where[kb][1] / CELL * ZOOM)
            if not crosses(wall, a, b):
                continue
            path = astar(wall, near, a, b)
            if path is None:
                failed += 1
                continue
            pts = rdp(path, 2.5)
            keys = [ka]
            for n, (cx, cy) in enumerate(pts[1:-1], 1):
                key = f"{sheet}_RT_{len(new_loc) + 1:04d}"
                x, y = round(cx * CELL / ZOOM), round(cy * CELL / ZOOM)
                new_loc.append((key, x, y, sheet))
                where[key] = (x, y); sheet_of[key] = sheet
                keys.append(key)
            keys.append(kb)
            for p, q in zip(keys, keys[1:]):
                length = max(1, round(math.hypot(where[p][0] - where[q][0], where[p][1] - where[q][1])))
                new_links.append((p, q, length, et, acc))
            drop.setdefault(name, set()).add(i)
            fixed += 1
        print(f"{sheet}: {len(todo)} edges checked, {fixed} re-routed, {failed} without a path (kept)")

    # remove the replaced edges from the source files
    for name, idx in drop.items():
        header, rows = read(name)
        lines = [header] + [" ".join(r) for i, r in enumerate(rows) if i not in idx]
        open(os.path.join(F, name), "w", encoding="utf-8", newline="\n").write("\n".join(lines) + "\n")

    sheets_info = {}
    for _, _, _, s in new_loc:
        sheets_info[s] = 1
    with open(os.path.join(F, "SSER_locations.txt"), "w", encoding="utf-8", newline="\n") as f:
        f.write("ID Key Label Type Building FloorIndex FloorName MapID X Y\n")
        floors = {"SSE_P": (0, "Plaza"), "SSE_F1": (1, "First"), "SSE_F2": (2, "Second")}
        for i, (key, x, y, s) in enumerate(new_loc):
            f.write(f"{i} {key} Route_Point HALLWAY SSE {floors[s][0]} {floors[s][1]} {s} {x} {y}\n")
    open(os.path.join(F, "SSER_edges.txt"), "w", encoding="utf-8", newline="\n").write("FromID ToID Weight EdgeType Accessible\n")
    with open(os.path.join(F, "SSER_links.txt"), "w", encoding="utf-8", newline="\n") as f:
        f.write("FromKey ToKey Weight EdgeType Accessible\n")
        for p, q, length, et, acc in new_links:
            f.write(f"{p} {q} {length} {et} {acc}\n")
    print(f"{len(new_loc)} new route points, {len(new_links)} new edges, "
          f"{sum(len(v) for v in drop.values())} wall-crossing edges removed")


if __name__ == "__main__":
    main()

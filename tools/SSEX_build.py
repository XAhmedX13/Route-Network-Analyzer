"""
SSEX_build.py (version 2, door based)
Adds every SSE room that the main SSE files (data/campus/SSE_*) do not have:
offices, storage, IT, electrical rooms, extra labs, meeting rooms, restrooms.
Writes data/campus/SSEX_locations.txt, SSEX_edges.txt, SSEX_links.txt.

How a room is connected (fixes the review findings: no more straight lines
through walls):
  room  --  its own DOOR  --  corridor point
1. Door swings are the purple arcs of the floor plan. Each arc is given to the
   room outline (filled polygon of the plan) it touches; the closest room
   centre wins when two rooms share the wall.
2. A door becomes a vertex SSE_<floor>_<room>_D just outside the room.
3. If a corridor point of the main SSE graph is within MAX_LINK of the door the
   door is linked to the nearest one. Otherwise the room belongs to a wing the
   SSE files do not model: the DOORS of a wing (they all face the hallway) give
   the direction of its corridor, corridor points are put along the line of
   the doors, chained, and both ends are joined to the nearest known corridor.
4. Rooms with no door found fall back to their label position.

Input: tools/data/sse_rooms.txt (floor, room number, label, x, y; x y upright).
Weights are PDF points at 1:200. Needs PyMuPDF (PYTHONPATH=tools/.pylib).
Run from the repository root.
"""

import math
import re

import pymupdf

SHEETS = {"P": "PLAZA FLOOR", "F1": "FIRST FLOOR", "F2": "SECOND FLOOR"}
FLOORS = {"P": (0, "Plaza"), "F1": (1, "First"), "F2": (2, "Second")}
PLAN = ("University maps/SCHOOL OF SCIENCES AND ENGINEERING/"
        "20220808 - SSE USER PLANS - BASE DRAWING - {}-Layout1.pdf")
DOOR_COLOR = (0.54, 0.0, 0.72)
MAX_LINK = 120           # a door is at most this far from a known corridor point
TOUCH = 9                # a door belongs to a room whose outline is this close


def room_type(text):
    t = text.upper()
    if "RESTROOM" in t or "WASHROOM" in t:
        return "RESTROOM"
    if "CLASSROOM" in t:
        return "CLASSROOM"
    if re.search(r"ELECTRICAL|\bIT\b|STORAGE|STORE|TRASH|HSKP|HSXP|JANITOR|MACHINE|SERVER|KITCHENETTE|COPY|DARK ROOM", t):
        return "OTHER"
    return "ROOM"


def label_for(text, number):
    words = re.sub(r"[^A-Za-z0-9&() ]", " ", text).title().split()
    words = [w for w in words if w.upper() not in ("R", "NO")][:5]
    return "_".join(words + [number]).replace("&", "and").replace("(", "").replace(")", "")


def polygon_of(drawing):
    pts = []
    for item in drawing["items"]:
        if item[0] == "re":
            r = item[1]
            pts += [(r.x0, r.y0), (r.x1, r.y0), (r.x1, r.y1), (r.x0, r.y1)]
        elif item[0] == "qu":
            q = item[1]
            pts += [(q.ul.x, q.ul.y), (q.ur.x, q.ur.y), (q.lr.x, q.lr.y), (q.ll.x, q.ll.y)]
        else:
            pts.append((item[1].x, item[1].y))
    return pts


def inside(poly, x, y):
    c = False
    j = len(poly) - 1
    for i in range(len(poly)):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi + 1e-9) + xi:
            c = not c
        j = i
    return c


def edge_distance(poly, x, y):
    best = 1e9
    for i in range(len(poly)):
        ax, ay = poly[i - 1]
        bx, by = poly[i]
        dx, dy = bx - ax, by - ay
        t = 0 if dx == dy == 0 else max(0, min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)))
        best = min(best, math.hypot(x - ax - t * dx, y - ay - t * dy))
    return best


def find_doors(floor, rooms):
    """Returns {room index: [(x, y) door points in upright coordinates]}."""
    page = pymupdf.open(PLAN.format(SHEETS[floor]))[0]
    to_page, to_upright = page.derotation_matrix, page.rotation_matrix
    drawings = page.get_drawings()
    doors = []
    for d in drawings:
        c = d.get("color")
        if not c or tuple(round(v, 2) for v in c) != DOOR_COLOR:
            continue
        if not any(i[0] == "c" for i in d["items"]):
            continue
        r = d["rect"]
        if 4 < r.width < 40 and 4 < r.height < 40:
            doors.append(((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2))
    fills = []
    for d in drawings:
        if d.get("fill") and 15 < d["rect"].width < 500 and 15 < d["rect"].height < 500:
            fills.append((d["rect"], polygon_of(d)))
    polygons = []
    for k, room in enumerate(rooms):
        px, py = pymupdf.Point(room["x"], room["y"]) * to_page
        best = None
        for rect, poly in fills:
            if rect.contains(pymupdf.Point(px, py)) and len(poly) >= 3 and inside(poly, px, py):
                if best is None or rect.get_area() < best[0]:
                    best = (rect.get_area(), poly)
        polygons.append((px, py, best[1] if best else None))
    found = {}
    for dx, dy in doors:
        owner, owner_distance = None, 1e9
        for k, (px, py, poly) in enumerate(polygons):
            if poly is None:
                near = math.hypot(dx - px, dy - py) < 35
                touch = near
            else:
                touch = edge_distance(poly, dx, dy) < TOUCH or inside(poly, dx, dy)
            if touch and math.hypot(dx - px, dy - py) < owner_distance:
                owner, owner_distance = k, math.hypot(dx - px, dy - py)
        if owner is not None:
            u = pymupdf.Point(dx, dy) * to_upright
            found.setdefault(owner, []).append((u.x, u.y))
    return found


def cluster(points, radius):
    groups, left = [], list(points)
    while left:
        group = [left.pop()]
        grew = True
        while grew:
            grew = False
            for p in left[:]:
                if any(math.dist(p[1:3], g[1:3]) < radius for g in group):
                    group.append(p)
                    left.remove(p)
                    grew = True
        groups.append(group)
    return groups


def axis(group, cx, cy):
    if len(group) < 2:
        return 1.0, 0.0
    sxx = sum((p[0] - cx) ** 2 for p in group)
    syy = sum((p[1] - cy) ** 2 for p in group)
    sxy = sum((p[0] - cx) * (p[1] - cy) for p in group)
    a = 0.5 * math.atan2(2 * sxy, sxx - syy)
    return math.cos(a), math.sin(a)


def main():
    all_rows = [l.split("\t") for l in open("tools/data/sse_rooms.txt", encoding="utf-8").read().splitlines()[1:]]
    sse = [l.split() for l in open("data/campus/SSE_locations.txt").read().splitlines()[1:]]
    existing = {v[1] for v in sse}
    halls = {}
    for v in sse:
        if v[3] == "HALLWAY":
            halls.setdefault(v[7], []).append((float(v[8]), float(v[9]), v[1]))

    locations = ["ID Key Label Type Building FloorIndex FloorName MapID X Y"]
    edges, links = [], ["FromKey ToKey Weight EdgeType Accessible"]
    ids = {}
    pos = {}

    def add_vertex(key, label, kind, floor, x, y):
        index, name = FLOORS[floor]
        ids[key] = len(ids)
        pos[key] = (x, y)
        locations.append(f"{ids[key]} {key} {label} {kind} SSE {index} {name} SSE_{floor} {x:.0f} {y:.0f}")

    def weight(a, b):
        return max(1, round(math.dist(a, b)))

    no_door = 0
    wings = 0
    for floor in SHEETS:
        seen, rooms = set(), []
        for f, number, text, x, y in all_rows:
            key = f"SSE_{f}_{number}"
            if f == floor and key not in existing and key not in seen:
                seen.add(key)
                rooms.append({"key": key, "number": number, "text": text, "x": float(x), "y": float(y)})
        doors = find_doors(floor, rooms)
        hall = halls[f"SSE_{floor}"]
        orphans = []           # (door vertex key, door x, door y)
        for k, room in enumerate(rooms):
            add_vertex(room["key"], label_for(room["text"], room["number"]), room_type(room["text"]),
                       floor, room["x"], room["y"])
            if k in doors:
                nearest_door = min(doors[k], key=lambda p: min(math.dist(p, h[:2]) for h in hall))
                dx, dy = nearest_door
            else:
                dx, dy = room["x"], room["y"]
                no_door += 1
            dkey = room["key"] + "_D"
            add_vertex(dkey, "Door_" + room["number"], "HALLWAY", floor, dx, dy)
            edges.append(f"{ids[room['key']]} {ids[dkey]} {weight((room['x'], room['y']), (dx, dy))} CORRIDOR 1")
            target = min(hall, key=lambda h: math.dist((dx, dy), h[:2]))
            if math.dist((dx, dy), target[:2]) <= MAX_LINK:
                links.append(f"{dkey} {target[2]} {weight((dx, dy), target[:2])} CORRIDOR 1")
            else:
                orphans.append((dkey, dx, dy))

        # wings without corridors: put the corridor along the line of the doors
        chains = []
        for group in cluster(orphans, 170):
            wings += 1
            cx = sum(p[1] for p in group) / len(group)
            cy = sum(p[2] for p in group) / len(group)
            ax, ay = axis([(p[1], p[2]) for p in group], cx, cy)
            # corridor lies on the hallway side of the doors: the side away from the room centres
            ordered = sorted(group, key=lambda p: (p[1] - cx) * ax + (p[2] - cy) * ay)
            chain = []
            for dkey, dx, dy in ordered:
                t = (dx - cx) * ax + (dy - cy) * ay
                if not chain or t - chain[-1][0] > 25:
                    wkey = f"SSE_{floor}_XW{wings:02d}_{len(chain) + 1:02d}"
                    px, py = cx + t * ax, cy + t * ay
                    add_vertex(wkey, f"Corridor_Wing_{wings:02d}", "HALLWAY", floor, px, py)
                    if chain:
                        edges.append(f"{ids[chain[-1][1]]} {ids[wkey]} {max(1, round(t - chain[-1][0]))} CORRIDOR 1")
                    chain.append((t, wkey, px, py))
                w = chain[-1]
                edges.append(f"{ids[dkey]} {ids[w[1]]} {weight((dx, dy), (w[2], w[3]))} CORRIDOR 1")
            chains.append(chain)
        joined = set()
        for chain in chains:
            own = {c[1] for c in chain}
            others = [(c[2], c[3], c[1]) for ch in chains for c in ch if c[1] not in own]
            for end in {chain[0][1]: chain[0], chain[-1][1]: chain[-1]}.values():
                candidates = hall + others
                target = min(candidates, key=lambda h: math.dist((end[2], end[3]), h[:2]))
                pair = frozenset((end[1], target[2]))
                if pair in joined:
                    continue
                joined.add(pair)
                w = weight((end[2], end[3]), target[:2])
                if target[2] in ids:
                    edges.append(f"{ids[end[1]]} {ids[target[2]]} {w} CORRIDOR 1")
                else:
                    links.append(f"{end[1]} {target[2]} {w} CORRIDOR 1")

    # stitch: any piece of SSEX that is not connected to the main SSE graph gets
    # one link (nearest pair on the same floor) to the main component
    keys_of = [v[1] for v in sse]
    adjacency = {}

    def connect(a, b):
        adjacency.setdefault(a, set()).add(b)
        adjacency.setdefault(b, set()).add(a)

    for line in open("data/campus/SSE_edges.txt").read().splitlines()[1:]:
        a, b = line.split()[:2]
        connect(keys_of[int(a)], keys_of[int(b)])
    ordered_keys = list(ids)
    for line in edges:
        a, b = line.split()[:2]
        connect(ordered_keys[int(a)], ordered_keys[int(b)])
    for line in links[1:]:
        a, b = line.split()[:2]
        connect(a, b)
    floor_of = {v[1]: v[7] for v in sse}
    floor_of.update({k: "SSE_" + k.split("_")[1] for k in ids})
    where = {v[1]: (float(v[8]), float(v[9])) for v in sse}
    where.update(pos)
    seen_keys, pieces = set(), []
    for start in list(ids) + keys_of:
        if start in seen_keys:
            continue
        stack, piece = [start], set()
        seen_keys.add(start)
        while stack:
            u = stack.pop()
            piece.add(u)
            for v in adjacency.get(u, ()):
                if v not in seen_keys:
                    seen_keys.add(v)
                    stack.append(v)
        pieces.append(piece)
    pieces.sort(key=len, reverse=True)
    main_piece = pieces[0]
    stitched = 0
    for piece in pieces[1:]:
        best = min(((math.dist(where[a], where[b]), a, b) for a in piece for b in main_piece
                    if floor_of[a] == floor_of[b]), default=None)
        if best:
            links.append(f"{best[1]} {best[2]} {max(1, round(best[0]))} CORRIDOR 1")
            main_piece = main_piece | piece
            stitched += 1
    print(f"stitched {stitched} stray pieces")

    with open("data/campus/SSEX_locations.txt", "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(locations) + "\n")
    with open("data/campus/SSEX_edges.txt", "w", encoding="utf-8", newline="\n") as f:
        f.write("FromID ToID Weight EdgeType Accessible\n" + "\n".join(dict.fromkeys(edges)) + "\n")
    with open("data/campus/SSEX_links.txt", "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(links) + "\n")
    rooms_added = sum(1 for k in ids if not k.endswith("_D") and "_XW" not in k)
    print(f"SSEX: {rooms_added} rooms, {len(ids)} vertices, {wings} wings, {no_door} rooms without a door found")


if __name__ == "__main__":
    main()

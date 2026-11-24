"""
ADMINX_links.py
Rewrites data/campus/ADMINX_links.txt so that each extra ADMIN room is joined to
the corridor point that its straight path reaches WITHOUT crossing a wall.
Walls are the long dark line segments of the floor plan; a doorway is a gap in
a wall, so a path through a door crosses nothing. Among the 14 nearest corridor
points of the same floor the one with the fewest wall crossings wins, then the
shortest. Needs PyMuPDF (PYTHONPATH=tools/.pylib). Run from the repository root.
"""

import math

import pymupdf

SHEETS = {"G": "GARDEN LEVEL", "P": "PLAZA FLOOR LEVEL", "F1": "FIRST FLOOR LEVEL"}
PLAN = "University maps/ADMINISTRATION BUILDING/REV01/ADMIN BUILDING - {}-Model.pdf"
MIN_WALL = 22


def walls_of(page):
    walls = []
    for d in page.get_drawings():
        color = d.get("color")
        if not color or max(color) > 0.12:
            continue
        for item in d["items"]:
            if item[0] == "l":
                a, b = item[1], item[2]
                if math.dist((a.x, a.y), (b.x, b.y)) >= MIN_WALL:
                    walls.append((a.x, a.y, b.x, b.y))
    return walls


def crosses(p, q, wall):
    x1, y1, x2, y2 = p[0], p[1], q[0], q[1]
    x3, y3, x4, y4 = wall
    d = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3)
    if abs(d) < 1e-9:
        return False
    t = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / d
    u = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / d
    return 0.02 < t < 0.98 and 0.0 <= u <= 1.0


def count_crossings(p, q, walls):
    xmin, xmax = min(p[0], q[0]) - 1, max(p[0], q[0]) + 1
    ymin, ymax = min(p[1], q[1]) - 1, max(p[1], q[1]) + 1
    return sum(1 for w in walls
               if max(w[0], w[2]) >= xmin and min(w[0], w[2]) <= xmax
               and max(w[1], w[3]) >= ymin and min(w[1], w[3]) <= ymax and crosses(p, q, w))


def main():
    base = [l.split() for l in open("data/campus/ADMIN_locations.txt").read().splitlines()[1:]]
    extra = [l.split() for l in open("data/campus/ADMINX_locations.txt").read().splitlines()[1:]]
    links = ["FromKey ToKey Weight EdgeType Accessible"]
    before = after = 0
    for floor, sheet in SHEETS.items():
        walls = walls_of(pymupdf.open(PLAN.format(sheet))[0])
        points = [(float(v[8]), float(v[9]), v[1]) for v in base
                  if v[7] == f"ADMIN_{floor}" and v[3] in ("HALLWAY", "ENTRANCE", "STAIRS", "ELEVATOR")]
        print(f"{floor}: {len(walls)} wall segments, {len(points)} corridor points")
        old = {}
        for line in open("data/campus/ADMINX_links.txt").read().splitlines()[1:]:
            a, b = line.split()[:2]
            old[a] = b
        where = {v[1]: (float(v[8]), float(v[9])) for v in base}
        for v in extra:
            if v[7] != f"ADMIN_{floor}":
                continue
            room = (float(v[8]), float(v[9]))
            if v[1] in old:
                before += count_crossings(room, where[old[v[1]]], walls) > 0
            nearest = sorted(points, key=lambda p: math.dist(room, p[:2]))[:14]
            best = min(nearest, key=lambda p: (count_crossings(room, p[:2], walls), math.dist(room, p[:2])))
            after += count_crossings(room, best[:2], walls) > 0
            links.append(f"{v[1]} {best[2]} {max(1, round(math.dist(room, best[:2])))} CORRIDOR 1")
    open("data/campus/ADMINX_links.txt", "w", encoding="utf-8", newline="\n").write("\n".join(links) + "\n")
    print(f"ADMINX links that cross a wall: {before} before, {after} after (of {len(links) - 1})")


if __name__ == "__main__":
    main()

"""
GATES_build.py
Adds the gate markers G1 to G5 and the Pepsi entrance of Campus Layout.pdf to the outdoor
network, plus five waypoints that follow the curved service road from the Sports entrance
up to W20 (the old straight Sports-W20 edge crossed the parking lots and was removed from
CAMPUS_edges.txt). Positions are printed marker positions, displayed page points.
Weight = distance * 9.2, the same scale as CAMPUS.
Writes data/campus/GATES_locations.txt, GATES_edges.txt, GATES_links.txt.
Run from the repository root:  python tools/GATES_build.py
"""
import math

F = "data/campus"
SCALE = 9.2


def px(cx, cy):
    # crop pixels of a 1.8x render that starts at page point (780, 1300) -> page points
    return (round(780 + cx / 1.8), round(1300 + cy / 1.8))


NEW = [  # key, label, x, y
    ("CAMPUS_O_GATE_1", "Gate_1", 1147, 453),
    ("CAMPUS_O_GATE_2", "Gate_2", 1503, 617),
    ("CAMPUS_O_GATE_3", "Gate_3", 1875, 1983),
    ("CAMPUS_O_GATE_4", "Gate_4", 1113, 1703),
    ("CAMPUS_O_GATE_5", "Gate_5", 587, 920),
    ("CAMPUS_O_G_PEPSI", "Pepsi_Entrance", 1017, 1650),
]
ROAD = [px(720, 800), px(775, 720), px(845, 650), px(895, 560), px(890, 470)]
WAYPOINTS = [(f"CAMPUS_O_WP_SPORTS_{i + 1}", f"Sports_Road_{i + 1}", x, y) for i, (x, y) in enumerate(ROAD)]
CHAIN = ["CAMPUS_O_G_SPORTS"] + [w[0] for w in WAYPOINTS] + ["CAMPUS_O_W20"]
EXPLICIT = {
    "CAMPUS_O_GATE_4": ["CAMPUS_O_G_SPORTS", "CAMPUS_O_G_PEPSI"],
    "CAMPUS_O_G_PEPSI": ["CAMPUS_O_G_SPORTS", "CAMPUS_O_G_BUS"],
}

rows = [l.split() for l in open(f"{F}/CAMPUS_locations.txt").read().splitlines()[1:] if l.strip()]
near = [(r[1], float(r[8]), float(r[9])) for r in rows if "_O_D_" not in r[1]]
where = {r[1]: (float(r[8]), float(r[9])) for r in rows}
where.update({k: (x, y) for k, _, x, y in NEW + WAYPOINTS})


def weight(a, b):
    return max(1, round(math.hypot(where[a][0] - where[b][0], where[a][1] - where[b][1]) * SCALE))


with open(f"{F}/GATES_locations.txt", "w", newline="\n") as f:
    f.write("ID Key Label Type Building FloorIndex FloorName MapID X Y\n")
    for i, (k, lab, x, y) in enumerate(NEW):
        f.write(f"{i} {k} {lab} ENTRANCE CAMPUS 0 Plaza CAMPUS {x} {y}\n")
    for j, (k, lab, x, y) in enumerate(WAYPOINTS):
        f.write(f"{len(NEW) + j} {k} {lab} OUTDOOR CAMPUS 0 Plaza CAMPUS {x} {y}\n")
with open(f"{F}/GATES_edges.txt", "w", newline="\n") as f:
    f.write("FromID ToID Weight EdgeType Accessible\n")
with open(f"{F}/GATES_links.txt", "w", newline="\n") as f:
    f.write("FromKey ToKey Weight EdgeType Accessible\n")
    for a, b in zip(CHAIN, CHAIN[1:]):
        f.write(f"{a} {b} {weight(a, b)} WALKWAY 1\n")
    for k, lab, x, y in NEW:
        if k in EXPLICIT:
            targets = EXPLICIT[k]
        else:
            targets = [n[0] for n in sorted(near, key=lambda n: math.hypot(n[1] - x, n[2] - y))[:2]]
        for nk in targets:
            f.write(f"{k} {nk} {weight(k, nk)} WALKWAY 1\n")
            print(lab, "->", nk, weight(k, nk))

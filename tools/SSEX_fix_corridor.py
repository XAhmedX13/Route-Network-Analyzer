"""
SSEX_fix_corridor.py
The automatic corridor fit of SSEX_build.py put the corridor nodes of wing 21 (SSE Second floor,
the vertical corridor between offices 2069 to 2079) on a diagonal line through the rooms.
The real corridor is the white strip at x = 1778 (checked on the floor plan), so this script
moves the nodes of that wing onto it and recomputes the weight of every edge that touches them
(weight = distance in plan points, like the rest of SSEX).
Run after tools/SSEX_build.py, then tools/merge_campus.py:   python tools/SSEX_fix_corridor.py
"""
import math

F = "data/campus"
FIXES = {"SSE_F2_XW21_": 1778}      # key prefix -> corridor x


def load_locations(name):
    lines = open(f"{F}/{name}", encoding="utf-8").read().splitlines()
    return lines[0], [l.split() for l in lines[1:] if l.strip()]


def main():
    header, ssex = load_locations("SSEX_locations.txt")
    moved = set()
    for r in ssex:
        for prefix, x in FIXES.items():
            if r[1].startswith(prefix):
                r[8] = str(x)
                moved.add(r[1])
    with open(f"{F}/SSEX_locations.txt", "w", encoding="utf-8", newline="\n") as f:
        f.write(header + "\n")
        for r in ssex:
            f.write(" ".join(r) + "\n")

    where = {}
    for name in ["SSE_locations.txt", "SSEX_locations.txt", "SSEFIX_locations.txt"]:
        for r in load_locations(name)[1]:
            where[r[1]] = (float(r[8]), float(r[9]))
    key_of = {r[0]: r[1] for r in ssex}

    def dist(a, b):
        return max(1, round(math.hypot(where[a][0] - where[b][0], where[a][1] - where[b][1])))

    lines = open(f"{F}/SSEX_edges.txt", encoding="utf-8").read().splitlines()
    out = [lines[0]]
    changed = 0
    for l in lines[1:]:
        e = l.split()
        if e and key_of.get(e[0]) in moved or e and key_of.get(e[1]) in moved:
            e[2] = str(dist(key_of[e[0]], key_of[e[1]]))
            changed += 1
        out.append(" ".join(e))
    open(f"{F}/SSEX_edges.txt", "w", encoding="utf-8", newline="\n").write("\n".join(out) + "\n")

    lines = open(f"{F}/SSEX_links.txt", encoding="utf-8").read().splitlines()
    out = [lines[0]]
    for l in lines[1:]:
        e = l.split()
        if e and (e[0] in moved or e[1] in moved):
            e[2] = str(dist(e[0], e[1]))
            changed += 1
        out.append(" ".join(e))
    open(f"{F}/SSEX_links.txt", "w", encoding="utf-8", newline="\n").write("\n".join(out) + "\n")
    print(f"moved {len(moved)} corridor nodes, updated {changed} edge weights")


if __name__ == "__main__":
    main()

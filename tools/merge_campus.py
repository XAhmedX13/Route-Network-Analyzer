"""
merge_campus.py
Joins every building's graph files in data/campus/ and the campus outdoor
network into one university graph that the C++ loader can read.

Inputs  (data/campus/):
  <BLDG>_locations.txt / <BLDG>_edges.txt   one pair per building, local IDs
  CAMPUS_locations.txt / CAMPUS_edges.txt   the outdoor network
  *_links.txt (e.g. CAMPUS_links.txt)       FromKey ToKey Weight EdgeType Accessible
                                            joins building entrances to the outdoors
Outputs (data/campus/):
  all_locations.txt / all_edges.txt         one graph, IDs renumbered 0..V-1

Run from the repository root:  python tools/merge_campus.py
Uses only the Python standard library.
"""

import os
import sys

FOLDER = os.path.join("data", "campus")
LOCATION_TYPES = {"ENTRANCE", "HALLWAY", "ROOM", "CLASSROOM", "RESTROOM", "ELEVATOR",
                  "STAIRS", "OUTDOOR", "BUILDING", "CAFE", "RESTAURANT", "VENDOR", "OTHER"}
EDGE_TYPES = {"WALKWAY", "CORRIDOR", "STAIRS", "ELEVATOR", "RAMP", "OTHER"}
LOC_HEADER = "ID Key Label Type Building FloorIndex FloorName MapID X Y"
EDGE_HEADER = "FromID ToID Weight EdgeType Accessible"

errors = []


def data_lines(path):
    """Yields (line number, fields) for every non-empty line after the header."""
    with open(path, encoding="utf-8") as f:
        for number, line in enumerate(f, start=1):
            fields = line.split()
            if number == 1 or not fields:
                continue
            yield number, fields


def check_edge_fields(where, weight, edge_type, accessible):
    if not weight.isdigit() or int(weight) <= 0:
        errors.append(f"{where}: weight must be a positive integer, got {weight}")
    if edge_type not in EDGE_TYPES:
        errors.append(f"{where}: unknown edge type {edge_type}")
    if accessible not in ("0", "1"):
        errors.append(f"{where}: accessible must be 0 or 1, got {accessible}")
    if edge_type == "STAIRS" and accessible == "1":
        errors.append(f"{where}: a STAIRS edge must have accessible 0")


def find_groups():
    """Returns the building codes that have both a _locations and an _edges file."""
    groups = []
    for name in sorted(os.listdir(FOLDER)):
        if name.endswith("_locations.txt") and not name.startswith("all_"):
            code = name[: -len("_locations.txt")]
            if os.path.exists(os.path.join(FOLDER, code + "_edges.txt")):
                groups.append(code)
            else:
                errors.append(f"{name}: has no matching {code}_edges.txt")
    if "CAMPUS" in groups:  # outdoors first, then the buildings
        groups.remove("CAMPUS")
        groups.insert(0, "CAMPUS")
    return groups


def main():
    if not os.path.isdir(FOLDER):
        sys.exit(f"Folder {FOLDER} not found. Run from the repository root.")

    locations = []        # fields of every vertex, already renumbered
    edges = []            # (from, to, weight, type, accessible) with global IDs
    key_to_id = {}
    building_of = []      # building code of each global ID, for the report
    counts = {}

    for code in find_groups():
        loc_path = os.path.join(FOLDER, code + "_locations.txt")
        edge_path = os.path.join(FOLDER, code + "_edges.txt")
        offset = len(locations)
        local_count = 0

        for number, f in data_lines(loc_path):
            where = f"{loc_path} line {number}"
            if len(f) != 10:
                errors.append(f"{where}: expected 10 fields, got {len(f)}")
                continue
            if f[0] != str(local_count):
                errors.append(f"{where}: expected ID {local_count}, got {f[0]}")
            if f[3] not in LOCATION_TYPES:
                errors.append(f"{where}: unknown location type {f[3]}")
            if f[1] in key_to_id:
                errors.append(f"{where}: key {f[1]} already used")
            global_id = offset + local_count
            key_to_id[f[1]] = global_id
            locations.append([str(global_id)] + f[1:])
            building_of.append(code)
            local_count += 1

        edge_count = 0
        for number, f in data_lines(edge_path):
            where = f"{edge_path} line {number}"
            if len(f) != 5:
                errors.append(f"{where}: expected 5 fields, got {len(f)}")
                continue
            if not (f[0].isdigit() and f[1].isdigit()) or int(f[0]) >= local_count or int(f[1]) >= local_count:
                errors.append(f"{where}: endpoint {f[0]} or {f[1]} is not a vertex of {code}")
                continue
            check_edge_fields(where, f[2], f[3], f[4])
            edges.append((offset + int(f[0]), offset + int(f[1]), f[2], f[3], f[4]))
            edge_count += 1
        counts[code] = (local_count, edge_count)

    # Every *_links.txt file joins vertices of different files by key:
    # CAMPUS_links.txt (building entrances to the outdoors), SSEX_links.txt (extra SSE rooms), ...
    link_files = sorted(n for n in os.listdir(FOLDER) if n.endswith("_links.txt"))
    if "CAMPUS_links.txt" not in link_files:
        print("Note: no CAMPUS_links.txt yet, buildings will not be joined to the outdoors.")
    link_count = 0
    for links_name in link_files:
        links_path = os.path.join(FOLDER, links_name)
        for number, f in data_lines(links_path):
            where = f"{links_path} line {number}"
            if len(f) != 5:
                errors.append(f"{where}: expected 5 fields, got {len(f)}")
                continue
            if f[0] not in key_to_id or f[1] not in key_to_id:
                errors.append(f"{where}: unknown key {f[0] if f[0] not in key_to_id else f[1]}")
                continue
            check_edge_fields(where, f[2], f[3], f[4])
            edges.append((key_to_id[f[0]], key_to_id[f[1]], f[2], f[3], f[4]))
            link_count += 1

    # Duplicate and self-loop check over the merged graph
    seen = set()
    for a, b, *_ in edges:
        pair = (min(a, b), max(a, b))
        if a == b:
            errors.append(f"self loop on {locations[a][1]}")
        elif pair in seen:
            errors.append(f"duplicate edge {locations[a][1]} - {locations[b][1]}")
        seen.add(pair)

    # Connected components (simple iterative DFS)
    n = len(locations)
    neighbors = [[] for _ in range(n)]
    for a, b, *_ in edges:
        neighbors[a].append(b)
        neighbors[b].append(a)
    component = [-1] * n
    groups_in = []
    for start in range(n):
        if component[start] != -1:
            continue
        number = len(groups_in)
        stack = [start]
        component[start] = number
        members = set()
        size = 0
        while stack:
            u = stack.pop()
            size += 1
            members.add(building_of[u])
            for v in neighbors[u]:
                if component[v] == -1:
                    component[v] = number
                    stack.append(v)
        groups_in.append((size, sorted(members)))

    print("\nPer file:")
    for code, (v, e) in counts.items():
        print(f"  {code:8s} {v:5d} locations {e:5d} edges")
    print(f"  links    {link_count:5d} edges")
    print(f"\nTotal: {n} locations, {len(edges)} edges, {len(groups_in)} connected component(s)")
    for size, members in sorted(groups_in, reverse=True)[:15]:
        print(f"  component of {size} vertices: {' '.join(members)}")
    if len(groups_in) > 1:
        print("  (more than one component: some buildings are not linked to the outdoors yet)")

    if errors:
        print(f"\n{len(errors)} problem(s), nothing written:")
        for message in errors[:50]:
            print("  " + message)
        sys.exit(1)

    with open(os.path.join(FOLDER, "all_locations.txt"), "w", encoding="utf-8", newline="\n") as f:
        f.write(LOC_HEADER + "\n")
        for fields in locations:
            f.write(" ".join(fields) + "\n")
    with open(os.path.join(FOLDER, "all_edges.txt"), "w", encoding="utf-8", newline="\n") as f:
        f.write(EDGE_HEADER + "\n")
        for a, b, weight, edge_type, accessible in edges:
            f.write(f"{a} {b} {weight} {edge_type} {accessible}\n")
    print(f"\nWrote {FOLDER}/all_locations.txt and all_edges.txt")
    print(f"The app needs a Graph capacity of at least {n}.")


if __name__ == "__main__":
    main()

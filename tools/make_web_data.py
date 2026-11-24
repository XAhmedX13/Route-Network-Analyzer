"""
make_web_data.py
Turns the merged campus graph (data/campus/all_locations.txt and all_edges.txt)
into web/data.js, the data file of the web page in web/.
Building positions on the campus map are the average of that building's door
nodes (CAMPUS_O_D_<BLDG>_<SIDE>) of the outdoor network.
Run from the repository root:  python tools/make_web_data.py
"""

import json
import os

LOCATIONS = os.path.join("data", "campus", "all_locations.txt")
EDGES = os.path.join("data", "campus", "all_edges.txt")
OUTPUT = os.path.join("web", "data.js")

TYPES = ["ENTRANCE", "HALLWAY", "ROOM", "CLASSROOM", "RESTROOM", "ELEVATOR", "STAIRS",
         "OUTDOOR", "BUILDING", "CAFE", "RESTAURANT", "VENDOR", "OTHER"]
EDGE_TYPES = ["WALKWAY", "CORRIDOR", "STAIRS", "ELEVATOR", "RAMP", "OTHER"]
BUILDING_NAMES = {
    "SSE": "School of Sciences and Engineering",
    "HUSS": "Prince Alwaleed Bin Talal Hall",
    "PVA": "Center for the Arts",
    "CORE": "Core Academic Center",
    "ADMIN": "Administration Building",
    "LIB": "Library",
    "CC": "Campus Center",
    "JAMEEL": "Abdul Latif Jameel Hall",
    "SPORTS": "Sports Complex",
    "RESID": "University Residences",
    "PP": "Physical Plant",
    "CAMPUS": "Campus walkways",
}


def main():
    rows = [l.split() for l in open(LOCATIONS, encoding="utf-8").read().splitlines()[1:] if l.strip()]
    edges = [l.split() for l in open(EDGES, encoding="utf-8").read().splitlines()[1:] if l.strip()]

    buildings = sorted({r[4] for r in rows})
    sheets = []                  # [mapID, building index, floorIndex, floorName]
    sheet_index = {}
    for r in rows:
        if r[7] not in sheet_index:
            sheet_index[r[7]] = len(sheets)
            sheets.append([r[7], buildings.index(r[4]), int(r[5]), r[6]])

    anchors = {}
    for b in buildings:
        doors = [(float(r[8]), float(r[9])) for r in rows
                 if r[7] == "CAMPUS" and r[1].startswith(f"CAMPUS_O_D_{b}_")]
        if doors:
            anchors[b] = [round(sum(p[0] for p in doors) / len(doors), 1),
                          round(sum(p[1] for p in doors) / len(doors), 1)]

    data = {
        "buildings": [[b, BUILDING_NAMES.get(b, b)] for b in buildings],
        "sheets": sheets,
        "types": TYPES,
        "edgeTypes": EDGE_TYPES,
        "anchors": anchors,
        "keys": [r[1] for r in rows],
        "labels": [r[2] for r in rows],
        "type": [TYPES.index(r[3]) for r in rows],
        "sheet": [sheet_index[r[7]] for r in rows],
        "x": [round(float(r[8]), 1) for r in rows],
        "y": [round(float(r[9]), 1) for r in rows],
        "ea": [int(e[0]) for e in edges],
        "eb": [int(e[1]) for e in edges],
        "ew": [int(e[2]) for e in edges],
        "et": [EDGE_TYPES.index(e[3]) for e in edges],
        "eacc": [int(e[4]) for e in edges],
    }
    os.makedirs("web", exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8", newline="\n") as f:
        f.write("window.CAMPUS = ")
        json.dump(data, f, separators=(",", ":"))
        f.write(";\n")
    print(f"Wrote {OUTPUT}: {len(rows)} vertices, {len(edges)} edges, {len(sheets)} sheets, "
          f"{os.path.getsize(OUTPUT) // 1024} KB")


if __name__ == "__main__":
    main()

"""
SSEFIX_build.py
Joins the Plaza classrooms CP16, CP17, CP25 and CP26 to the inner corridor ORP11
THROUGH THEIR DOORS (reviewer finding: the first fix drew straight lines through the
classrooms). Writes data/campus/SSEFIX_locations.txt / _edges.txt / _links.txt.
Run from the repository root with PYTHONPATH=tools/.pylib.
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from SSEX_build import find_doors  # noqa: E402

HUB = "SSE_P_W_SE_Rest_Upper"
CLASSES = ["CP16", "CP17", "CP25", "CP26"]


def main():
    sse = {l.split()[1]: l.split() for l in open("data/campus/SSE_locations.txt").read().splitlines()[1:]}
    hub = (float(sse[HUB][8]), float(sse[HUB][9]))
    rooms = [{"key": f"SSE_P_{c}", "x": float(sse[f"SSE_P_{c}"][8]), "y": float(sse[f"SSE_P_{c}"][9])}
             for c in CLASSES]
    doors = find_doors("P", rooms)
    locations = ["ID Key Label Type Building FloorIndex FloorName MapID X Y"]
    edges = ["FromID ToID Weight EdgeType Accessible"]
    links = ["FromKey ToKey Weight EdgeType Accessible"]
    for k, room in enumerate(rooms):
        if k not in doors:
            print(f"{room['key']}: no door found, keeping the direct link")
            links.append(f"{room['key']} {HUB} {round(math.dist((room['x'], room['y']), hub))} CORRIDOR 1")
            continue
        # the door that is closest to the corridor hub
        dx, dy = min(doors[k], key=lambda p: math.dist(p, hub))
        dkey = room["key"] + "_D"
        index = len(locations) - 1
        locations.append(f"{index} {dkey} Door_{room['key'][-4:]} HALLWAY SSE 0 Plaza SSE_P {dx:.0f} {dy:.0f}")
        edges.append(f"{index} {index} 1 CORRIDOR 1")      # placeholder, replaced below
        edges.pop()
        links.append(f"{room['key']} {dkey} {max(1, round(math.dist((room['x'], room['y']), (dx, dy))))} CORRIDOR 1")
        links.append(f"{dkey} {HUB} {max(1, round(math.dist((dx, dy), hub)))} CORRIDOR 1")
        print(f"{room['key']}: door at ({dx:.0f}, {dy:.0f}), {len(doors[k])} door(s) found")
    for name, lines in (("locations", locations), ("edges", edges), ("links", links)):
        with open(f"data/campus/SSEFIX_{name}.txt", "w", encoding="utf-8", newline="\n") as f:
            f.write("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()

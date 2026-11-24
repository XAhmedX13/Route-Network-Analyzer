"""
make_web_plans.py
Draws every floor plan PDF as a grey picture, web/plans/<mapID>.png, and writes
web/plans.js with each picture's page size in PDF points. The web page puts the
picture under the route so a person sees the real walls, rooms and roads.
The graph coordinates are points of the displayed page, which is what
PyMuPDF renders, so pixel = point * zoom with no other transform.
Run from the repository root:  PYTHONPATH=tools/.pylib python tools/make_web_plans.py
"""

import glob
import json
import os
import re
import sys

import fitz

MAPS = "University maps"
OUT = os.path.join("web", "plans")
LONG_SIDE = 1900        # pixels on the long side of every picture

# (map id prefix, folder keyword, floor word in the file name)
FLOORS = {"G": "GARDEN", "P": "PLAZA", "F1": "FIRST", "F2": "SECOND", "F3": "THIRD"}
BUILDING_FOLDER = {
    "ADMIN": "ADMINISTRATION", "CC": "CAMPUS CENTER", "CORE": "CORE ACADEMIC", "HUSS": "PRINCE ALWALEED",
    "JAMEEL": "JAMEEL", "LIB": "LIBRARY", "PP": "PHYSICAL", "PVA": "ARTS", "RESID": "RESIDENCES",
    "SPORTS": "SPORTS", "SSE": "SCIENCES",
}


def find_pdf(map_id):
    if map_id == "CAMPUS":
        return "Campus Layout.pdf"
    building, floor = map_id.split("_")
    folder = BUILDING_FOLDER[building]
    word = FLOORS[floor]
    for path in glob.glob(os.path.join(MAPS, "**", "*.pdf"), recursive=True):
        parts = path.upper().split(os.sep)
        name = parts[-1]
        in_folder = any(folder in p for p in parts[:-1])
        # the floor word must stand alone in the file name (PLAZA is not PLAZA FLOOR-ROOF)
        if in_folder and re.search(r"\b" + word + r"\b", name) and "ROOF" not in name:
            return path
    return None


def main():
    ids = [m for m in json.loads(open("web/data.js", encoding="utf-8").read()[len("window.CAMPUS = "):-2].strip().rstrip(";"))["sheets"]]
    os.makedirs(OUT, exist_ok=True)
    sizes = {}
    for sheet in ids:
        map_id = sheet[0]
        pdf = find_pdf(map_id)
        if not pdf:
            print("NO PDF for", map_id)
            continue
        page = fitz.open(pdf)[0]
        w, h = page.rect.width, page.rect.height
        zoom = LONG_SIDE / max(w, h)
        pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), colorspace=fitz.csGRAY, alpha=False)
        path = os.path.join(OUT, map_id + ".png")
        pix.save(path)
        sizes[map_id] = [round(w, 1), round(h, 1)]
        print(f"{map_id:10} {os.path.basename(pdf)[:50]:50} {int(w)}x{int(h)}  {os.path.getsize(path) // 1024} KB")
    with open(os.path.join("web", "plans.js"), "w", encoding="utf-8", newline="\n") as f:
        f.write("window.PLANS = ")
        json.dump(sizes, f, separators=(",", ":"))
        f.write(";\n")


if __name__ == "__main__":
    main()

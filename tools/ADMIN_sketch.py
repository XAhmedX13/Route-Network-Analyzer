"""
ADMIN_sketch.py
Draws the ADMIN graph on faded copies of its four floor plans:
data/maps/sketches/ADMIN_G.pdf, ADMIN_P.pdf, ADMIN_F1.pdf, ADMIN_F2.pdf
Needs PyMuPDF: set PYTHONPATH=tools/.pylib. Run from the repository root.
"""

import os
import pymupdf

SHEETS = {
    "G": "GARDEN LEVEL", "P": "PLAZA FLOOR LEVEL", "F1": "FIRST FLOOR LEVEL", "F2": "SECOND FLOOR LEVEL",
}
COLORS = {
    "ROOM": (0.1, 0.3, 0.9), "CLASSROOM": (0.1, 0.3, 0.9), "RESTROOM": (0.6, 0.0, 0.6),
    "STAIRS": (0.85, 0.0, 0.0), "ELEVATOR": (0.0, 0.6, 0.0), "ENTRANCE": (0.0, 0.0, 0.0),
    "HALLWAY": (0.95, 0.5, 0.0), "CAFE": (0.6, 0.4, 0.1),
}
FOLDER = os.path.join("University maps", "ADMINISTRATION BUILDING", "REV01")


def main():
    rows = [l.split() for l in open("data/campus/all_locations.txt").read().splitlines()[1:]]
    edges = [l.split() for l in open("data/campus/all_edges.txt").read().splitlines()[1:]]
    os.makedirs(os.path.join("data", "maps", "sketches"), exist_ok=True)

    for floor, sheet in SHEETS.items():
        doc = pymupdf.open(os.path.join(FOLDER, f"ADMIN BUILDING - {sheet}-Model.pdf"))
        page = doc[0]
        page.draw_rect(page.rect, color=None, fill=(1, 1, 1), fill_opacity=0.6, overlay=True)
        mine = {int(r[0]) for r in rows if r[7] == f"ADMIN_{floor}"}
        point = lambda i: pymupdf.Point(float(rows[i][8]), float(rows[i][9]))
        count = 0
        for a, b, weight, kind, _ in edges:
            a, b = int(a), int(b)
            if a in mine and b in mine:
                page.draw_line(point(a), point(b), color=(0.3, 0.3, 0.3), width=3)
                middle = (point(a) + point(b)) / 2
                page.insert_text(middle, weight, fontsize=14, color=(0.5, 0, 0))
                count += 1
            elif a in mine or b in mine:       # link to the floor above or below
                here = point(a if a in mine else b)
                color = (0.85, 0, 0) if kind == "STAIRS" else (0, 0.6, 0)
                page.draw_circle(here, 22, color=color, width=3, dashes="[6] 0")
        for i in sorted(mine):
            color = COLORS.get(rows[i][3], (0.3, 0.3, 0.3))
            page.draw_circle(point(i), 9, color=color, fill=color)
            page.insert_text(point(i) + (12, -8), f"{rows[i][1].split(chr(95), 2)[2]}", fontsize=9, color=color)
        page.insert_text((80, 90), f"ADMIN {floor}: {len(mine)} locations, {count} edges on this floor. "
                         "Dashed circles: stairs (red) / elevator (green) to other floors. Weights in units of 0.0706 m.",
                         fontsize=24)
        doc.save(os.path.join("data", "maps", "sketches", f"ADMIN_{floor}.pdf"), garbage=3, deflate=True)
        print(f"Wrote ADMIN_{floor}.pdf")


if __name__ == "__main__":
    main()

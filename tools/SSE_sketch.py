"""
SSE_sketch.py
Draws the complete SSE graph (SSE + SSEX + SSEFIX, read from the merged
data/campus/all_*.txt) on faded copies of the SSE floor plans:
data/maps/sketches/SSE_P.pdf, SSE_F1.pdf, SSE_F2.pdf
Run tools/merge_campus.py first. Needs PyMuPDF: set PYTHONPATH=tools/.pylib
"""

import os
import pymupdf

SHEETS = {"P": "PLAZA FLOOR", "F1": "FIRST FLOOR", "F2": "SECOND FLOOR"}
COLORS = {
    "ROOM": (0.1, 0.3, 0.9), "CLASSROOM": (0.0, 0.55, 0.55), "RESTROOM": (0.6, 0.0, 0.6),
    "STAIRS": (0.85, 0.0, 0.0), "ELEVATOR": (0.0, 0.6, 0.0), "ENTRANCE": (0.0, 0.0, 0.0),
    "HALLWAY": (0.95, 0.5, 0.0), "OTHER": (0.5, 0.5, 0.5),
}


def main():
    rows = [l.split() for l in open("data/campus/all_locations.txt").read().splitlines()[1:]]
    edges = [l.split() for l in open("data/campus/all_edges.txt").read().splitlines()[1:]]
    for floor, sheet in SHEETS.items():
        doc = pymupdf.open(f"University maps/SCHOOL OF SCIENCES AND ENGINEERING/"
                           f"20220808 - SSE USER PLANS - BASE DRAWING - {sheet}-Layout1.pdf")
        page = doc[0]
        to_page = page.derotation_matrix          # sheets are stored rotated
        page.draw_rect(page.rect * to_page, color=None, fill=(1, 1, 1), fill_opacity=0.6, overlay=True)
        mine = {int(r[0]) for r in rows if r[7] == f"SSE_{floor}"}
        point = lambda i: pymupdf.Point(float(rows[i][8]), float(rows[i][9])) * to_page
        count = 0
        for a, b, weight, kind, _ in edges:
            a, b = int(a), int(b)
            if a in mine and b in mine:
                added = "_XW" in rows[a][1] or "_XW" in rows[b][1]
                page.draw_line(point(a), point(b), color=(0.9, 0, 0) if added else (0.3, 0.3, 0.3), width=2)
                count += 1
            elif a in mine or b in mine:
                here = point(a if a in mine else b)
                color = (0.85, 0, 0) if kind == "STAIRS" else (0, 0.6, 0)
                page.draw_circle(here, 12, color=color, width=2)
        for i in mine:
            color = COLORS.get(rows[i][3], (0.3, 0.3, 0.3))
            page.draw_circle(point(i), 4, color=color, fill=color)
            label = rows[i][1].split("_", 2)[2]
            page.insert_text(point(i) + (5, -3), label, fontsize=5, color=color, rotate=page.rotation)
        page.insert_text(pymupdf.Point(60, 60) * to_page,
                         f"SSE {floor}: {len(mine)} locations, {count} edges. Red lines: corridors added for "
                         "unmodelled wings. Circles: stairs (red) / elevator (green) to other floors.",
                         fontsize=14, rotate=page.rotation)
        doc.save(f"data/maps/sketches/SSE_{floor}.pdf", garbage=3, deflate=True)
        print(f"Wrote SSE_{floor}.pdf ({len(mine)} locations)")


if __name__ == "__main__":
    main()

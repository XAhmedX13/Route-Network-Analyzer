# ADMIN (Administration building), built by Claude

Built with tools/ADMIN_build.py (data) and tools/ADMIN_sketch.py (sketches
data/maps/sketches/ADMIN_G.pdf, ADMIN_P.pdf, ADMIN_F1.pdf, ADMIN_F2.pdf).

## Source
"University maps/ADMINISTRATION BUILDING/REV01/", four A0 sheets (2384 x 3370 pt):
Garden, Plaza, First, Second. On Garden, Plaza and First the room names, STAIR-01
to STAIR-06, TOILET, LOBBY, ENTRANCE, CONFERENCE, MEETING and PAX/HC (passenger /
accessible elevator) are real text, so vertex positions are the exact label
positions read with PyMuPDF. The Second floor sheet has no text; its points were
read from the drawing (octagonal lobby, stair and elevator shafts, conference room).

## Scale
No printed scale. The sheets are A0 like the SSE plans and office sizes fit 1:200,
so 1 PDF point = 1 weight unit (0.0706 m). Weights are straight distances between
the chosen points, rounded (estimate).

## What is modelled (129 locations, 145 edges)
| Floor | Locations |
|---|---|
| Garden | 35 |
| Plaza | 40 |
| First | 40 |
| Second | 14 |
Key rooms only: lobbies and corridor junctions, conference and meeting rooms,
reception, lounges, restrooms, a coffee corner, every stair and elevator, entrances.
Individual offices are not modelled.

## Floor links (position matched, the four sheets are aligned)
STAIR-01, 02, 03, 04: Garden to Second. West stairs: Garden to Plaza.
Passenger elevator (PAX/HC): Garden to Second. Service elevator: Plaza to Second.
STAIRS 113, ELEVATOR 212 (estimates). STAIR 05 and STAIR-06 appear on one floor
only and are kept as single-floor stairs.

## Entrances (data/campus/ADMIN_entrances.txt)
8 entrances on Garden, Plaza and First (the building is on a slope). They are
linked in data/campus/CAMPUS_links.txt to the campus door nodes ADMIN_N and ADMIN_E.

## Changes made to the campus network (job D files)
- CAMPUS_links.txt: added links for PVA, CORE, RESID, PP (their entrances files
  existed but were not linked) and the 8 ADMIN entrances.
- CAMPUS_edges.txt: added the missing central plaza walkways between the HUSS,
  SSE, CORE and ADMIN doors (HUSS_E-ADMIN_N, HUSS_E-HUSS_S, HUSS_E-SSE_N,
  HUSS_E-CORE_W, HUSS_S-SSE_N), using job D's scale (track calibration).
  Before this, HUSS to ADMIN was routed through the Library (696 m); now 225 m.

## To check later
- Second floor restrooms are not modelled (no labels on the sheet).
- Which campus door each entrance really uses.
- Whether the service elevator also reaches the Garden level.

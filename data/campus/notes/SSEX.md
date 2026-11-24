# SSE extra rooms (SSEX) and fixes (SSEFIX), by Claude

## SSEX: every remaining SSE room
Built with tools/SSEX_build.py from tools/data/sse_rooms.txt.

- **Source:** the three SSE floor plans (Plaza, First, Second). The sheets are stored
  rotated by 270 degrees; room names are real text, so each room's position is
  the centre of its name label (converted to the upright page coordinates used by
  the SSE files). Room numbers are vector drawings, so they were read visually
  from zoomed crops (contact sheets of 36 labels each, 634 labels in total).
- **Added:** 429 rooms that data/campus/SSE_locations.txt did not have: about 155
  faculty / adjunct / GTA / staff offices, chair and department offices, meeting
  rooms, storage, IT and electrical rooms, kitchenettes, extra labs and restrooms.
- **How they connect:** a room within 260 pt of an existing SSE corridor point is
  linked straight to the nearest one (data/campus/SSEX_links.txt). Rooms in wings
  that the SSE files do not model at all (the diagonal Physics, Mathematics,
  Architecture and Mechanical office wings on First and Second) get new corridor
  points: the rooms of each wing are grouped, the wing direction is the principal
  axis of their positions, a corridor point is placed on the middle line in front
  of each room, the points are chained, and both ends of each wing corridor are
  joined to the nearest existing corridor point (keys SSE_<F>_XW<wing>_<n>).
- **Types:** RESTROOM, CLASSROOM, OTHER (storage, IT, electrical, janitor,
  kitchenette, server, copy), everything else ROOM.
- Weights: PDF points at 1:200, straight distance (estimate).

## SSEFIX: corrections to the main SSE graph
- data/campus/SSEFIX_links.txt: classrooms CP16, CP17, CP25 and CP26 on the Plaza
  also have doors onto the inner corridor ORP11 (restrooms P002 to P005, stairs #09).
  The main SSE file only connected them through the outer gallery, so routes from
  those classrooms to the nearby restrooms went around the whole building (422 m);
  now 16 m. Found by comparing with another student's Plaza graph and confirmed on
  the drawing.

## To check later
- Wing corridor points are placed by geometry, not traced wall by wall.
- About 16 labels were not read (donor-name labels such as "Egypt Room", or
  numbers hidden by furniture).

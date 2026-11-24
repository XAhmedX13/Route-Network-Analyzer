# Job B — work in progress

## HUSS

Sources inspected: the Plaza, First and Second floor PDFs in `University maps/PRINCE ALWALEED BIN TALAL BIN ABDULAZIZ ALSAUD HALL/`. Each page is 3370 × 2384 PDF points. A Plaza plan tile covering approximately (1950, 900)–(2350, 1250) was rendered at 2× and inspected.

The extractable text contains room-use and furniture-plan annotations, including identifiers such as `P-051`. These are not necessarily the room numbers requested for graph keys: in the inspected tile, the classroom annotated `P-051` has the separate vector-drawn room number `CP66`. The drawing shows doors from that classroom to circulation spaces on both sides. The vector room numbers and door connections must be read from the plans, rather than treating the extractable annotation identifiers as room numbers.

Plaza scale estimate: a typical drawn door opening is roughly 20 PDF points, corresponding to 13 routing units for a 0.9 m door. The provisional factor is therefore 0.65 routing units per PDF point, equivalent to an approximate scale of 1:130 under the specified conversion. Corridor weights are rounded estimates using that factor; doorway coordinates and local paths are approximate.

The current Plaza data is **incomplete**: the mapped sections now include classrooms in both eastern wings, several restrooms, a provisional stair and three entrances. Many other parts of the sheet, including additional stairs, elevators, entrances, restrooms, labs, offices and service rooms, have not been completely surveyed or connected. Coordinates and routes are approximate; the long approach between the classroom sections needs visual review. Do not merge or use this partial graph as the complete Plaza floor. The scale, local path geometry and entrance orientations need review. The partial sketches are not finished floor maps.

First floor: the draft contains 27 vertices and 26 same-floor edges, covering four classrooms, three labs, their corridors, the connecting bridge and provisional stairs STX1 and STX2. The wider floor has not been fully surveyed. The First floor drawing has the same page dimensions and a similar plan footprint as Plaza; the same provisional 0.65 units per PDF point is used, pending door-width confirmation. Its corridor and door coordinates are approximate. Provisional stair links join the mapped floor sections.

Second floor: the draft contains 21 vertices and 20 same-floor edges, covering labs 2108–2113, part of their connecting corridors and provisional stairs STX1 and STX2. The rest of the floor, including a reading room 2174 and restrooms, remains to be surveyed and connected. Second has the same page dimensions and a similar plan footprint as Plaza; the provisional 0.65 units per PDF point is used pending door-width confirmation. Corridor and door coordinates are approximate. Provisional stair links join the mapped floor sections.

### To check later

- One visually inspected Plaza stair at approximately (1775, 1000) has no legible STxx designation in its drawn stair enclosure. First and Second have stairs in the same position, provisionally named STX1; verify the shaft match and the route to each landing. Plaza STX1 remains to be connected.
- The HUSS sketches predate the latest Second-floor additions and need regeneration after the next HUSS data pass.
- The stair at approximately (1835, 1535) is provisionally matched as STX2 on all three floors. Its landing positions, approach corridors and Plaza courtyard approach are approximate; verify that they are traversable and adjust the lengths. Provisional shaft match.
- The Plaza, First and Second sections are linked through STX2; the graph remains an incomplete draft, even if the connectivity check passes. Current totals: Plaza 91 vertices / 94 same-floor edges, First 239 / 240, Second 58 / 57, plus three stair links, for 388 vertices and 394 edges. Plaza rooms CP67 and P150–P156A have approximate door approaches; verify the connections around the angled lobby and the P156A closet code and access. The northeast Plaza classroom approaches and P155/P156 restroom routes are approximate, as are the northern entrance positions and their NE side assignments. Confirm the route through the northeast entrance lobby, the upper entrance steps and accessible alternatives, and door locations on the arcade. First-floor office suite rooms, restrooms 1135 and 1136, and their door approaches are provisional. Offices 1078 and 1079 were corrected to the lower corridor after their labels were inspected at higher zoom. Check exact doorway points, routes through the 1070 suite and around the western octagonal lobby, and the corridor loops. Second rooms 2081–2091 and 2114–2125 have approximate door waypoints and lobby paths; several office ovals are overlapped by furniture and should be checked. Verify service rooms 2121 and 2122 and their interior-door relationship.
- The new all-rooms scope is not yet satisfied on any HUSS or PVA floor. Offices, service rooms, additional stair and elevator stops, and many door waypoints remain to be surveyed. `tools/B_contacts.py` generates indexed temporary contact sheets from rotated room-use text as an aid; text identifiers are not room codes and each vector R.NO. still needs visual reading.
- HUSS_P_EN01 is assigned side S provisionally by comparing the classroom wing with the campus layout; verify its position and orientation. Other entrances remain to be added.

## PVA

Sources: Plaza, First and Second sheets in `University maps/AUC CENTER FOR THE ARTS/`. A visible 0–50 m graphic scale on the Plaza sheet spans about 728 PDF points; 50 m is about 708 routing units, so the draft uses 0.973 routing units per PDF point (approximately 1:195). First and Second use the same factor provisionally.

The current draft covers a corridor near the computer labs and a position-matched stair: Plaza 45 vertices and 44 same-floor edges; First 37 and 36; Second 39 and 38; plus two stair edges, for 121 vertices and 120 edges. The rest of the large building is not modeled, including its auditorium, studios, other stairs, elevators, toilets and entrances. It is connected structurally but is not a complete floor survey.

The PVA drawings also carry AutoCAD SHX annotations for many vector R.NO. labels. `tools/B_PVA_inventory.py` pairs those annotations with nearby R.NO. markers and produces indexed visual contact sheets in the temporary directory. Its preliminary inventory found 168 candidate ovals on Plaza, 96 on First and 103 on Second; these are candidates, not verified completeness counts. The drawing repeats some room numbers in separate wings on the same sheet: for example P013 occurs at approximately (1958,1524) and (1285,1914). Both are visible distinct ovals. The requested key format needs a suffix to distinguish repeated numbers; the existing unqualified key currently denotes the first mapped occurrence.

### To check later

- STX1 is a provisional shaft match based on a stair by the lightwell; the Second sheet is offset relative to Plaza and First, so confirm the match and actual landing positions.
- Check the corridor geometry and door connections, particularly the approach around the lightwell, the First and Second restroom branches, and rooms 1001/1002 and 2001/2002. The newly added door positions are approximate and need wall/door review. An overlay review of the lab/toilet cluster revealed possible wall crossings, so connectivity checks alone must not be treated as route validation. Only a small fraction of the identified ovals has been modeled.
- Decide and consistently document a suffix for repeated room-number ovals in separate wings, preserving the exact printed number in each label. Do not conflate physically distinct rooms that share a number.
- PVA_P_EN01 and its side E are provisional; confirm its campus-layout orientation and identify the other entrances.

## CORE

Sources: Garden, Plaza, First and Second sheets in `University maps/THE HATEM AND JANET MOSTAFA CORE ACADEMIC CENTER/`. The draft uses 0.5 routing units per PDF point on each sheet, a rough estimate from an approximately 26-point door opening (13 routing units for 0.9 m). Confirm using a dimensioned feature.

The current draft covers an elevator lobby and a small adjacent corridor: Garden 6 vertices / 5 same-floor edges, Plaza 4 / 3, First 5 / 4 and Second 5 / 4, plus three elevator links: 20 vertices and 19 edges. It is connected structurally but most rooms, entrances, stairs and other elevator stops remain unmapped.

### To check later

- ETX1 is a provisional shaft match by plan position; the elevator drawing says P0917, but its public accessibility and stop pattern require confirmation.
- Verify doorway and corridor geometry, the Garden entrance side N against the campus plan, and the room-to-corridor connections. The graph does not yet cover the whole building.

## ADMIN

Not started.

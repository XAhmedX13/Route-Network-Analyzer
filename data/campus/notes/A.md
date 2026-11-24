# Job A: work in progress

The complete SSE dataset and sketches have not yet been produced or checked. Do not merge the Phase 1 demo as a complete building graph.

Sources: SSE Plaza, First, and Second floor PDFs under `University maps/SCHOOL OF SCIENCES AND ENGINEERING/`, and `Campus Layout.pdf`. The requested scale is 1:200 for each floor; lengths measured from the plans will be estimates in PDF points at 1:200. The proposed stair and elevator weights 113 and 212 are estimates.

The existing demo contains ET03 as a freight elevator, with accessibility to verify. The drawings show doors on corridor OR101 for rooms 1204 and 1205 and on corridor ORP03 for room P095; explicit door waypoints are still required in the new graph. Full key-room, shaft, entrance, and connection transcription remains to be completed, followed by orientation, graph connectivity, loader and sketch verification.

Plaza work-in-progress: 26 vertices and 26 edges. It covers only part of the west wing; most Plaza wings, key rooms, stairs, elevators and entrances are still missing. Passing the structural checker does not establish completeness or prove that all edges avoid walls. Do not merge as a finished Plaza dataset.

First-floor draft: 18 vertices and 18 internal edges, plus 3 links to Plaza. This is only the existing west-wing demo with door waypoints added; most First-floor wings, key rooms, shafts and entrances remain missing. The structural check is not a completeness or wall-crossing audit.

Second-floor draft: 7 vertices, 6 internal edges, 2 links to First (ST03 and freight ET03). Only the northwest corner has been transcribed; other wings, most rooms, shafts and entrances remain missing. ST12 is not linked vertically because its First-floor counterpart has not yet been added. Structural connectivity is not proof of routing accuracy or completeness.

Three provisional sketches were generated. They use straight schematic edge segments, not measured corridor polylines, and can cross walls; do not treat them as verified route sketches. No entrances file has been produced because entrance locations and campus-map sides have not yet been inventoried. Loader accepted the current partial graph (51 locations, 55 edges).

Added Plaza P092 (mathematical learning center) and CP46, each with a door waypoint. Current draft: 55 vertices and 59 edges (Plaza 30, First 18, Second 7); still incomplete. Existing provisional sketches predate these four vertices and must be regenerated after more inventory work.

Added eight First-floor west-wing labs and their door waypoints, plus ST12 and its First-Second stair link. The partial draft now contains 72 vertices and 77 edges (Plaza 30 vertices, First 35, Second 7). Remaining wings and entrances still require inventory, and provisional sketches are outdated.

Added Second-floor labs 2220 and 2221 through preparation rooms 2218 and 2219, with intermediate door waypoints. Current partial draft: 80 vertices, 85 edges (Plaza 30, First 35, Second 15 vertices). Most wings and entrances remain unmodelled; sketches remain outdated.

Added First-floor labs 1207 and 1224 with door waypoints. Current partial draft: 84 vertices, 89 edges (Plaza 30, First 39, Second 15 vertices). Remaining wings and entrances are not inventoried, and sketches are outdated.

Added First-floor X-ray room 1216A through the internal door from lab 1216. Current partial draft: 86 vertices, 91 edges (Plaza 30, First 41, Second 15 vertices). Remaining wings and entrances are not inventoried, and sketches are outdated.

Added First-floor lab support rooms 1206 and 1208 and their internal door points from 1204. Partial draft: 90 vertices, 95 edges (Plaza 30, First 45, Second 15 vertices); remaining wings and entrances need inventory, and sketches are outdated.

Added Plaza lab support rooms P097 and P099 with doorways to P101 and P095. Current partial draft: 96 vertices, 103 edges (Plaza 36, First 45, Second 15 vertices). Remaining wings and entrances need inventory; sketches are outdated.

Added visible interior door connections P100-P098 and P098-P096 on Plaza. Partial draft: 98 vertices, 107 edges (Plaza 38, First 45, Second 15 vertices). The remaining wings and entrances require inventory; sketches are outdated.

Added Plaza classroom CP45 and CP44 corridor nodes and research lab P113. Current partial draft: 107 vertices, 116 edges (Plaza 47, First 45, Second 15). These new routes still require visual sketch review. Entrances and many wings and shafts are not inventoried; existing sketches are out of date.

Added Plaza classrooms CP42, CP41, CP40 and ST06 along the ORP02 route, and exterior door EN01 beside ORP02. Split the Plaza and First ST05 connections at corridor bends while preserving each original total weight of 270. The EN01 side on Campus Layout.pdf still needs verification; no entrances list is final. The current partial draft has 122 vertices and 131 edges (Plaza 59, First 48, Second 15 vertices). Sketches were regenerated as incomplete schematic drafts and are not wall-verified route sketches. Most of SSE remains unmodelled.

## To check later

- Southern and physics wing door coordinates, cross-court corridors, and several corridor-to-stair approaches are approximate draft paths and need a wall-by-wall sketch review before routing use.
- The second-floor corridor at the expansion-joint symbol between the chemistry west and east sections needs on-site or drawing confirmation.
- Freight elevators ET03 and ET04: accessibility to verify.
- Existing floor sketches and the entrance candidate are provisional; verify all entrance positions and site-map sides.
- The source Second-floor sheet uses ST00 at multiple distinct stair positions; do not assume they are one shaft.

## CORE takeover - work in progress

Sources: `University maps/THE HATEM AND JANET MOSTAFA CORE ACADEMIC CENTER/` (Garden, Plaza, First, Second). The existing CORE draft has 20 vertices and 19 edges; its four floors are connected structurally, but its positions, routes, scale and provisional elevator have not been verified. It is not a complete room inventory. Garden R.NO. labels visibly overlap the older L-number labels; examples G005, G006, G007, G047, G048 and G008 have been identified visually, but their connections have not been checked and they were not added to the graph.

### To check later

- Determine the CORE scale from the graphical scale bar or a dimension; 1:100 was only an unverified assumption in the unexecuted `tools/A_CORE_garden.py` and must not be used without calibration.
- Transcribe the remaining vector R.NO. labels using the indexed contact sheets generated by `tools/A_CORE_contacts.py`; a text L-number is not necessarily the R.NO. number.
- Trace room doors and corridor routes and replace the existing provisional coordinates and weights, then match stair and elevator positions between floors.
- Verify entrance locations and their sides against the campus layout. The existing entrance listing is inherited and unverified.
- Regenerate and inspect all four CORE sketches after the graph is updated. Do not merge this draft as complete.

CORE continuation: added visually read R.NO. rooms to all four floors. Current partial dataset has 169 vertices and 168 edges: Garden 65, Plaza 24, First 41, Second 39 vertices. Structural checker and C++ loader pass. This does not establish route validity or completeness.

### To check later: CORE continuation

- Added room and door coordinates and straight-line connections are rough estimates; many door positions and corridor connections have not been checked wall by wall. Treat them as provisional, not verified walkable routes. The inherited demo's points and weights also need inspection.
- New edge weights use a rough estimate of 0.26 normalized units per PDF point, based on an assumed 0.9 m door width of about 50 points. The actual scale must be calibrated from a dimension or site plan. Earlier demo weights may use a different factor.
- Rooms remain missing across each floor; the indexed L-/P-/1-/2- codes are not substitutes for the vector R.NO. labels. Recheck the reading of overlapping labels and the classroom codes.
- Missing stair landings, their cross-floor matches, and entrances remain to be inventoried. Existing ETX1 and entrance are inherited provisional records.
- CORE sketches have not been regenerated for these changes. Do not merge the current CORE dataset as complete.

CORE sketches have now been regenerated as incomplete drafts. Visual inspection of Garden confirms that some straight draft connections cross walls; they must be retraced through actual doors before using the graph for routing. Do not interpret connectivity or the loader pass as evidence of a valid route network. The scale, floor links, entrances, and complete room inventory remain open.

CORE continuation: added Garden and Plaza room labels, corridor drafts, and three provisional stairs on each floor. Current graph: 250 vertices and 258 edges; Garden 108, Plaza 56, First 44, Second 42 vertices. Structural checker and loader accept it; sketches regenerated as explicitly incomplete drafts.

### To check later: current CORE draft

- STX1, STX2 and STX3 are provisional shaft matches based on position, including all three consecutive-floor links; confirm every landing, whether each staircase actually serves each floor, and all stair approaches. The inherited ETX1 likewise needs verification.
- The draft still has missing R.NO. rooms and entrances, and some route lines cross walls. Door and corridor coordinates are provisional and need careful tracing. The 0.26 conversion factor uses an assumed 0.9 m door and needs calibration; weights are estimates.
- Confirm G002/G003 and P013 restroom classifications, overlapping room labels, and the connected path to each office and theater. Entrance inventory and campus-map orientation are incomplete. Do not merge or route with this draft until these issues are resolved.

CORE continuation: added Garden G036, G039, G041 and G042 and Plaza P015/P015A; corrected displayed positions of several First and Second classroom door nodes. The draft now has 264 vertices and 272 edges (Garden 116, Plaza 60, First 45, Second 43 vertices). The loader and structural check pass and draft sketches were regenerated.

### To check later: CORE route and source audit

- Garden G041/G042 are in a separate stair enclosure; the current approach to STX2 is a provisional geometric connection and must be checked against the actual walkable connection. Do not use it for routing as drawn.
- The plan's Garden G001 through G048 and Plaza P000 through P025 labels have not all been reliably audited: G024 is a different room from P024 and the apparent absence of P009-P011 needs confirmation. Check overlapping R.NO. labels, room types, and all remaining door placements.
- Many draft connections still cross walls, especially office corridors, and the provisional shafts and scaling factor remain unverified. The matching, path geometry and true entrance inventory must be audited before merger; structural connectivity is not evidence of a walkable route.

CORE continuation: added the Garden-level lecture hall labelled P024, the distinct Plaza closet also labelled P000 (key P000_Closet), and Garden east-office corridor waypoints. Current draft: 273 vertices and 281 edges: Garden 123, Plaza 62, First 45, Second 43. The structural and current shaft-link checks pass; the loader reports 273 and 281. Draft sketches were regenerated.

### To check later: duplicate labels and routes

- The Plaza plan appears to label both a lounge and a closet P000; the closet key is provisionally disambiguated as P000_Closet. Confirm both labels and the closet doorway.
- Garden and Plaza both show P024 for the lecture hall; the two floor vertices are not linked directly because a valid internal vertical path has not been traced.
- Garden office passage points are rough; inspect the east-office corridors and all room doors. Existing provisional paths can cross walls, including routes to G041/G042. Stair matches, scale, and the incomplete entrance inventory remain to verify. Do not use for route decisions or merge as finished.

CORE continuation: added Garden entrances at L-021 and the indicated library connection, a Plaza foyer entrance candidate, and upper-floor east-stair corridor bends. Current draft: 280 vertices, 288 edges (Garden 126, Plaza 64, First 46, Second 44); the structural and present shaft/entrance-key checks pass and the loader reports 280 and 288. Sketches were regenerated.

### To check later: entrances and route geometry

- Verify the candidate entrance sides against the campus layout: the CORE sheet and site plan may be rotated relative to each other. Confirm that the P-027 foyer boundary is an exterior entrance and trace its actual approach.
- Verify the Garden library-connection passage, the north courtyard entrance route, and the upper east-stair doors and landing positions. The room inventory, stair matches, normalization factor and many other provisional paths still need auditing. Some paths are known to cross walls; this remains an incomplete draft and must not be used for routing or merged as complete.

CORE continuation: adjusted the Garden northwest office route to follow its sequence of door points, split the Garden elevator-to-service-foyer route at estimated bends, and attached central stair landings from east-side corridors. Current draft: 282 vertices, 290 edges; Garden 128, Plaza 64, First 46, Second 44. Structural and present shaft/entrance-key checks pass; the loader reports 282 and 290. Draft sketches regenerated.

### To check later: latest route changes

- The foyer door coordinates and central stair approaches are approximate and still require a detailed wall/door audit; the STX shafts remain provisional matches. The Garden northwest office suite route should also be checked at its internal lobby.
- Other known draft paths cross walls, the normalization factor is unverified, and the entrance list and complete room inventory remain unaudited. The structural pass does not establish usable walking directions. Do not mark complete or merge this graph yet.

CORE continuation: inspected the Garden, Plaza, First and Second room inventories against the contact sheets, revised several upper-floor west-side restroom and service-room door positions, and routed the trash-room doors through the elevator lobbies. Current draft: 283 vertices and 291 edges (Garden 128, Plaza 64, First 47, Second 44). Structural/shaft/entrance-key checks pass, the loader reports 283 and 291, and incomplete draft sketches were regenerated.

### To check later: scale and latest door edits

- Within-floor weights now use factor approximately 0.319 normalized units per PDF point, estimated from the First-floor C120 door: its visible opening is about 40 PDF points and a nominal door is assumed to be 0.9 m (about 12.75 target units). The same estimate was applied to all four sheets. This supersedes the earlier 0.26 factor; verify against a known dimension. Vertical stair/elevator estimates remain 113/212.
- Upper-floor restroom and service-room door coordinates are estimated from the plan; check them and every corridor segment, especially because other draft connections still cross walls. Confirm provisional shafts, entrance sides, and all R.NO. labels. CORE remains an incomplete draft and A_DONE.txt must not be written.

CORE continuation: routed the Plaza northwest offices along the west passage and through the P015 suite, replacing several straight links that visibly crossed walls. Counts remain 283 vertices and 291 edges: Garden 128, Plaza 64, First 47, Second 44. Structural/shaft/entrance checks and the loader pass; sketches were regenerated.

### To check later: Plaza office connections

- P015 suite and door coordinates are approximate, and the new passage sequence needs visual and on-site checking. Other draft paths remain known to cross walls; the room inventory, entrances, scale, and provisional shaft matches are still unaudited. Do not use the connectivity result as proof of a walking route and do not mark the dataset complete.

CORE continuation: inspected Plaza advising room P008 and rerouted the draft access to P000, P006 and P007 through the registration approach and P008 advising aisle, with the P008 door moved to the visible entrance. Counts are 288 vertices and 296 edges: Garden 128, Plaza 69, First 47, Second 44. Structural, present shaft/entrance-key checks and loader pass; the four incomplete sketches were regenerated.

### To check later: advising route

- Verify that the P008 lower aisle and its east-end turn are unobstructed and that the P006/P007 doors are reached from that aisle. Approximate vertices and weights do not establish accessibility or a clear walking path.
- The wider room inventory, other wall-crossing paths, the provisional shafts, entrance sides and scale remain unaudited; CORE is incomplete and must not be used for routing or merged as a finished dataset.

CORE continuation: rerouted selected Garden east-office edges for G031, G032 and G044 via passage waypoints instead of the earlier diagonal connections. Counts: 290 vertices and 298 edges (Garden 130, Plaza 69, First 47, Second 44). Structural, present shaft/entrance-key checks and loader pass; the draft sketches were regenerated.

### To check later: east office passages

- Check the new east-passage waypoints and doors against the drawing and on site; their exact positions are estimated. Other draft edges may still cross walls. Room inventory, scale, entrance sides and provisional shaft matches still require full audit. Do not use as a finished walking graph.

CORE continuation: replaced diagonal upper-floor west-wing paths with corridor waypoint chains on First and Second, including the three rooms and west stair on each floor. Current draft: 300 vertices and 308 edges (Garden 130, Plaza 69, First 52, Second 49). Structural/shaft/entrance checks and the loader pass. The four draft sketches were regenerated; a Second-floor crop was reviewed.

### To check later: west corridor

- Confirm the estimated west-corridor centerline, each classroom/lab door, and STX1 landing. Other corridors, room completeness, entrance sides, the approximate scale, and all provisional shaft matches still need audit. Existing connections elsewhere can cross walls; this remains an incomplete draft.

CORE continuation: added the visible Garden-Plaza west stair as provisional STX4 with a 113-unit inaccessible link and the Plaza lecture-stair exterior entrance candidate; traced part of the Garden L-049 south passage and Garden G022/G023 door approaches. Plaza P001/P002 door points and P003 access through P005 were revised; Plaza east stair now approaches from its north door. Restroom vertices moved near corridor-side doors. The current graph has 315 vertices and 324 edges: Garden 137, Plaza 77, First 52, Second 49. Structural and loader checks pass. All four sketches were regenerated with internal stair segments dashed red and vertical links labelled at shafts.

### To check later: latest CORE changes

- STX4 is a provisional Garden-Plaza shaft match. Confirm this stair and the other position-matched shafts and assess whether they are accessible to intended users.
- The Plaza southern route from corridor P-030 through food outlet P025 to stair STX1 is provisional; verify that the outlet's two openings connect and are available for passage. The new exit's SW side is an estimate pending orientation matching against the campus layout.
- Check the revised P001-P003 doors, all Garden south-passage bends and dock steps, and the G022/G023 approach. The dock step edge is coded STAIRS and inaccessible based on the drawing; confirm it on site.
- The candidate arc and line-intersection reports in tools/A_CORE_doors_*.tsv and tools/A_CORE_wall_candidates.tsv are review aids only: plan furniture and labels can generate false positives. Other draft edges may cross walls. The full R.NO. inventory, entrance sides, normalized scale, and room/door/shaft positions are not fully audited. Do not merge as a finished walking graph.

CORE continuation: rerouted Garden theater G019 from commons G017 through the west double doors and connected storage G018 along the theater's west aisle to its visible door. The four draft sketches were regenerated. Current graph: 316 vertices and 325 edges; Garden 138, Plaza 77, First 52, Second 49. Structural checker and real loader pass.

### To check later: theater and overall draft

- Confirm the theater aisle stays clear and that G018 is accessible through the indicated east-side door. Several other provisional routes may cross walls; the automated line-intersection report flags candidates but does not establish which strokes are walls. The full room inventory, exact entrance orientations, scale and shaft matches still need independent review. This is not a finished walking graph.

CORE Garden correction: the G041/G042 control rooms adjoin a separate stair drawn near (2250, 1730), not the previously linked stair near (2250, 1000). Added that stair as provisional STX5 and corrected the door sequence: G041 opens through G042, which opens into its stair enclosure. Removed the two unsupported long connections to STX2. The graph now has 317 vertices and 325 edges (Garden 139, Plaza 77, First 52, Second 49). The loader succeeds, but the connectivity checker reports two components: the control-room stair enclosure is detached from the rest in the supplied Garden plan. Sketches regenerated.

### To check later: detached theater stair

- Establish the real connection between the isolated G041/G042 stair enclosure and the remaining building, and whether STX5 serves another floor. No joining edge has been fabricated. The building cannot be treated as a complete connected routing graph until this is resolved. Other routes, room inventory and shaft matches remain provisional as described above.

CORE Garden continuation: rerouted G020 and G021 through the theater's east vestibule and an estimated aisle rather than from the distant office corridor. Current draft: 320 vertices and 328 edges (Garden 142, Plaza 77, First 52, Second 49). The loader succeeds. The connectivity check still fails with two components for the detached control-room stair described above; the four draft sketches were refreshed.

### To check later: east theater approach

- Confirm that the theater's south and east aisles are clear and the east vestibule connects to the theater as drawn. The isolated control-room stair remains disconnected, and prior room, shaft, accessibility and route-audit uncertainties still apply.

CORE continuation: adjusted the Garden G037/G038 door positions and routed the west side of the office suite through an estimated passage waypoint chain instead of the earlier line across offices. The structural checker now continues through all four floors before reporting a disconnected building; its failure status is unchanged. Current draft: 325 locations and 333 edges (Garden 147, Plaza 77, First 52, Second 49); loader succeeds, sketches refreshed.

### To check later: Garden office passage

- Check the revised office passage and G037/G038 door positions against the plan at high zoom. The detached G041/G042 enclosure still lacks a verified link; other provisional routes and the complete room/shaft inventory still require review.

CORE continuation: on First and Second, replaced long diagonal links from the west end of the east corridor to classroom doors with centerline waypoint chains and short door approaches. The individual floor checks remain connected except for the known Garden enclosure; the whole-building check therefore still fails. The loader accepts 338 locations and 346 edges (Garden 147, Plaza 77, First 58, Second 56). Sketches refreshed.

### To check later: upper east corridors

- Check the estimated corridor centerlines and each doorway, including the approaches to the east stair. The connectivity check does not prove a wall-free route. The Garden enclosure and all earlier draft uncertainties remain unresolved.

CORE continuation: moved the First- and Second-floor west stair landings and their approach waypoints to the door openings shown at the south end of the corridor, replacing positions across the stair treads. Counts remain 338 locations and 346 edges (Garden 147, Plaza 77, First 58, Second 56). All four draft sketches regenerated; the full structural check continues to flag the two-component Garden graph.

### To check later: west stair

- Confirm the estimated positions within the stair vestibules and verify their provisional shaft match. The control-room enclosure connection and other previously noted draft uncertainties remain unresolved.

CORE continuation: revised Plaza office P004 to approach its north-side doorway and bent the registration passage west of the drawn kiosk row. Current draft: 341 locations and 349 edges (Garden 147, Plaza 80, First 58, Second 56); the real loader accepts the files and the sketches were refreshed. The full connectivity check still fails on the detached Garden theater stair enclosure.

### To check later: Plaza approaches

- Confirm the P004 doorway and the bends around registration kiosks on the drawing and in use; waypoint locations and corridor weights are estimated. The detached Garden enclosure, other provisional paths, room inventory and shaft matches still need review.

CORE continuation: adjusted Plaza P003/P005 door positions and routed the P000 closet from its east opening. Added doorway approaches and moved the First and Second central stair landings closer to their entrances. Current draft: 344 locations and 352 edges (Garden 147, Plaza 81, First 59, Second 57). The loader accepts the data and sketches were refreshed. Structural validation still reports two building components because the Garden control-room stair enclosure has no documented link to the rest.

### To check later: latest doors and stairs

- Verify the closet opening, P003/P005 shared door, and upper central-stair door and shaft positions. The graph is incomplete: the Garden enclosure, all unverified paths, the room inventory and the entrance/shaft audit remain open.

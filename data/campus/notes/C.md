# Job C work in progress

## LIB Plaza

Source: `University maps/AUC LIBRARY/LIBRARY-PLAZA LEVEL-Layout1.pdf`, page 1, 1191 × 842 PDF points. Vector-drawn R.NO. labels are used for numbered rooms; separate P-xxx plan annotations are not room codes. Tiles at 3× and detail crops at 5–10× were inspected.

Scale estimate: a single door leaf is roughly 8 PDF points on the sheet. Taking a standard leaf as 0.9 m (approximately 13 routing units) gives a multiplier of 13/8 ≈ **1.6 routing units per PDF point**, equivalent to a nominal scale of about 1:320. All horizontal edge weights are rounded straight-line estimates between the chosen points using this factor; they are not surveyed distances, and some may need additional waypoints to follow the actual corridor around obstacles.

The stair and elevator shaft identifiers ST01–ST04 and ET01–ET03 are **provisional**, assigned from their drawn positions because no readable ST/ET shaft labels were identified on this sheet. Confirm shaft identity and access before linking floors; the shapes interpreted as elevators should be checked against the other plans. The campus site plan suggests the library plan's top points northeast and its right side southeast; entrance sides have been assigned on that basis and need confirmation. The entrance inventory contains only the two provisional Plaza entries, and does not yet cover the whole building. Restroom P056/P057 labels and use classifications of study rooms should be rechecked. Corridor connections and room coverage require further visual review; the checker confirms graph structure, not that a line avoids a wall or that every intended room was captured.

The Garden, First, Second and Third drafts use the same preliminary 1.6 multiplier as Plaza, based on the visually similar single-door width. This is a rough estimate and per-sheet calibration should be rechecked. Corridors, room locations and door placements are estimates. Upper floors contain no entrance vertices; the Garden inventory adds one terrace door.

Current LIB draft: Garden 42, Plaza 64, First 30, Second 30 and Third 28 vertices; total 194 vertices and 221 edges. `python tools/C_check.py LIB` passes, and the real loader reported `Loaded 194 locations and 221 edges`. The five floor sketches have been written.

### To check later

- The Garden south wing, upper-floor rooms, and possible additional entrances are incomplete. Some labels and room uses are unclear.
- ST01–ST04 and ET01–ET03 were matched approximately by position on each plan; whether each shaft actually stops on every floor requires confirmation. All seven provisional shafts were linked on consecutive floors in the draft.
- Floor connections are schematic straight-line estimates and should be checked for walls and obstacles. Sketches currently show same-floor edges; inter-floor edges are represented in the data but not drawn as cross-sheet lines.

## CC draft

Sources: the three `University maps/CAMPUS CENTER/CC-*.pdf` sheets and `Campus Layout.pdf`. On these A3 sheets a single door leaf is roughly 4 PDF points, so the provisional factor is 13/4 ≈ 3.2 for Plaza, First and Second. Some vector labels were unreadably heavy in the source renderer; `C_thin.py` reduces the pen width in memory for inspection without altering the PDF.

Plaza: 36 vertices; First: 27; Second: 10. Total 73 vertices and 75 edges. The real loader reports `Loaded 73 locations and 75 edges`.

### To check later

- Coverage is sparse, particularly the auditorium complex, west and south wings, and Second floor. Rooms with unclear R.NO. labels were skipped.
- STX1, STX2 and ETX1 are provisional shaft matches; their positions, stops, and accessibility need confirmation. Entrance positions and sides are approximate.
- The disconnected fragments on the A3 sheet have been joined by estimated exterior/arcade walkways; confirm these paths and replace straight-line corridor approximations with door and junction waypoints.

## JAMEEL draft

Sources: the three `University maps/ABDUL LATIF JAMEEL HALL/JAMEEL-*.pdf` sheets and the campus layout. Approximate door width 5 PDF points gives factor 13/5 = 2.6 on Plaza, First and Second. Plaza: 47 vertices; First: 44; Second: 40. Total 131 vertices and 151 edges. Loader: `Loaded 131 locations and 151 edges`.

### To check later

- Many classrooms, offices and restrooms are omitted. All five STX shafts and both ETX shafts are provisional shaft matches, including their floor stops and accessibility.
- Waypoints and nearest-room links are schematic; check against actual doors, walls and circulation, as well as the two entrance locations and sides.

## SPORTS draft

Sources: the three `University maps/AUC SPORTS CENTER/SPORTS BLDG*` sheets and the campus layout. The printed approximately 50 m scale bar occupies about 667 PDF points: (50 / 0.0706) / 667 ≈ 1.06. This factor is used on Garden, Plaza and First. Garden: 24 vertices; Plaza: 26; First: 16. Total 66 vertices and 70 edges. Loader: `Loaded 66 locations and 70 edges`.

### To check later

- Some stairs, changing rooms, entrances, offices and sports spaces are omitted. STX1–STX3 and ETX1 are provisional shaft matches; ETX1 accessibility and stops need verification.
- POOL01 is an unnumbered exterior feature, not a transcribed R.NO. Pool access and the long outdoor connections are approximations. Confirm circulation and entrance sides.

## RESID incomplete draft

Sources: the three `University maps/UNIVERSITY RESIDENCES/RESID BLDG*` sheets and the campus layout. Approximate full-size 1:200 sheet: factor 1.0 for Plaza, First and Second. Plaza: 11 vertices; First: 8; Second: 8. Total 27 vertices and 28 edges. Loader: `Loaded 27 locations and 28 edges`.

### To check later

- **Only one residential cluster is modeled.** The sheets show numerous separate clusters; their stairs, entrances and other shared spaces are missing. They must be added before this can represent the residences.
- Some upper-floor clusters appear physically separate. The current checker requires each floor's induced graph to be connected; the actual inter-cluster route should be established before adding any same-floor connections. Do not assume there are upper-floor bridges.
- ST01 and ST02 are provisional shaft matches. Check the modeled block's exterior door, side, room connections and scale.

## PP draft

Sources: both `University maps/PHYSICAL AND UTILITIES PLANT/PP-*` sheets and the campus layout. Approximately 4 PDF points per single door gives factor 13/4 = 3.25 for Garden and Plaza. Garden: 20 vertices; Plaza: 12. Total 32 vertices and 33 edges. Loader: `Loaded 32 locations and 33 edges`.

### To check later

- The administrative wing is partial and industrial/plant-wing stairs, elevators, entrances and usable spaces need review. Mechanical-only spaces were skipped.
- ST01, ST02 and ETX1 are provisional shaft matches; the estimated exterior connection to the plant wing, doorway access and entrance sides need confirmation.

## All-room expansion in progress

The new scope requires every R.NO. room. Garden received 18 additional transcribed rooms and 18 provisional door waypoints; LIB now has Garden 78, Plaza 64, First 30, Second 30 and Third 28 vertices, 230 vertices and 257 edges overall. `python tools/C_check.py LIB` passes; the loader reports `Loaded 230 locations and 257 edges`. The Garden sketch was regenerated.

### To check later

- The Garden expansion is partial: numerous room labels and doors remain to be transcribed, including rooms in the southern wing and the small offices and study cubicles. Door coordinates and corridor connections added in this pass are estimated, and should be checked against the drawing.
- Many requested rooms remain absent on all other LIB floors, CC, and JAMEEL. All-room expansion has not been completed and C_DONE.txt must not be created yet.
- The suggested text extraction shortcut provides only 4 words on Garden, 8 on Plaza, 57 on First, none on Second, and 4 on Third, so LIB's labels largely require vector-based visual transcription.

Further LIB transcription added 21 Plaza, 21 First, 12 Second and 21 Third numbered rooms, each with a provisional door waypoint. Current LIB counts: Garden 78, Plaza 106, First 72, Second 54, Third 70; 380 vertices, 407 edges. The structural check passes and the loader reports `Loaded 380 locations and 407 edges`. Sketches for these four floors were regenerated.

Latest pass: thinning the source drawing's pen widths in memory made additional R.NO. labels legible. Garden gained 31 rooms, Plaza 17, First 8, Second 14, and Third 3, with a door waypoint per addition. Current LIB totals: Garden 140, Plaza 140, First 88, Second 82, Third 76; 526 vertices and 553 edges. `C_check.py LIB` passes, and the loader reports `Loaded 526 locations and 553 edges`. Sketches for all five floors were regenerated. Plaza room labels P045 and P046 from the preceding pass were corrected to P046 and P048, and Third 3038 was corrected to 3036 before adding a separate 3038.

### To check later

- This is still not the complete R.NO. inventory. Room labels hidden by furniture or dense vector strokes remain, and all floors need a full sweep. The room-use labels and estimated door nodes and links need review, particularly the west-side offices that connect through larger rooms.
- Plaza P039 was moved to the northwestern office group and reconnected to the corridor. Other earlier inferred coordinates should be compared with the thinned tiles.
- CC and JAMEEL have not yet received their all-room expansion. Do not write C_DONE.txt until all three inventories are complete.

Latest continuation added 11 Garden, 6 Plaza and 4 Second numbered rooms with provisional door waypoints, and corrected the Garden G073/G075 label swap. Current LIB: Garden 162, Plaza 152, First 88, Second 90, Third 76; 568 vertices and 595 edges. The structural check passes and the real loader reports `Loaded 568 locations and 595 edges`. Updated Garden, Plaza and Second sketches have been regenerated. Room inventory and door routing remain incomplete.

Subsequent continuation: LIB gained 5 Garden, 2 First, and 5 Third rooms with door nodes; it now has 592 vertices and 619 edges (Garden 172, Plaza 152, First 92, Second 90, Third 86). CC gained 20 Plaza, 14 First, and 3 Second rooms with door nodes; it now has 147 vertices and 149 edges (Plaza 76, First 55, Second 16). JAMEEL gained rooms on all three floors and now has 405 vertices and 425 edges (Plaza 169, First 120, Second 116). The real loader reports those totals, structural checks pass, and edited floor sketches were regenerated.

### To check later

- None of these is a complete all-room transcription. CC's different blocks visibly reuse some R.NO. codes on the same floor; the current key format cannot distinguish those occurrences and the draft contains at most one occurrence per repeated key. CC needs an agreed unique-key disambiguation and full wing inventory.
- The recently added JAMEEL door points are inferred toward the nearest modeled corridor and are not measured from the doors. Correct coordinates, actual door routes, and types against the floor drawings. Several prior room coordinates and hallway connections are also schematic.
- Read all remaining tiles for LIB, CC, and JAMEEL and reconcile room numbers, elevator and stair stops, and entrance coverage before creating C_DONE.txt.

Latest JAMEEL pass transcribed additional north and south wing labels on all three floors and added estimated door points. JAMEEL is now Plaza 209, First 178, Second 184 vertices: 571 vertices and 591 edges in total. The structural check passes, its loader reports `Loaded 571 locations and 591 edges`, and its three sketches were regenerated. Each newly added door is a provisional point estimated toward the existing corridor; it has not been checked against a doorway or intervening wall. Additional R.NO. labels and shafts remain to be inventoried.

Additional east and west wing transcription: JAMEEL now has Plaza 239, First 218 and Second 312 vertices, 769 vertices and 789 edges overall. `C_check.py JAMEEL` passes and the real loader reports `Loaded 769 locations and 789 edges`; all three sketches were refreshed. Door points and corridor connections for these additions are estimated toward the closest preexisting waypoint and need floor-plan review. This is not a verified complete inventory; further R.NO., shaft, entrance and corridor coverage remains to be checked before C_DONE.txt can be written.

The existing partial datasets passed the structural check before this expansion. It validates file structure and graph connectivity, not spatial correctness or completeness. Sketch PDFs are draft review aids; short red dashed and green stubs represent inter-floor stair and elevator links.

Further CC all-room transcription: Plaza 252, First 195 and Second 20 vertices, 467 vertices and 469 edges in total. The structural check passes and the loader reports `Loaded 467 locations and 469 edges`; all three CC sketches were refreshed. Separate wings reuse room numbers, so the new keys retain the drawn R.NO. and append a wing suffix where necessary to keep keys unique. The Plaza additions include offices, medical rooms, service spaces and lecture rooms; First includes offices, study and service rooms; Second includes mechanical rooms.

### To check later

- This remains an incomplete transcription: sweep every CC wing and all LIB and JAMEEL sheets for missed R.NO. labels, shafts and entrances. The presence of a room number does not prove a valid route.
- Many newly added door waypoints are approximate, especially the First-floor and later Plaza additions, and each is connected to a nearest existing corridor waypoint without checking intervening walls. Second-floor mechanical-room access is also provisional. Trace the actual door and corridor network on the drawings before relying on walking routes or accessibility.
- Check repeated CC R.NO. occurrences against their positions and reconcile any duplicate representation caused by earlier schematic coordinates. Check their room-use labels and floor-specific suffixes. C_DONE.txt must not be created until the complete inventory has been established.

Latest continuation: CC First gained additional west-wing offices and a distinct auditorium 1001; CC now has Plaza 252, First 237 and Second 20 vertices, 509 vertices and 511 edges. LIB gained Garden G063 and Plaza P036: Garden 174, Plaza 154, First 92, Second 90, Third 86, total 596 vertices and 623 edges. JAMEEL gained Plaza P063, P070 and P100, First 1014, and Second 2012, 2014, 2019, 2116 and an eastern 2117 occurrence; Plaza 245, First 220, Second 322, total 787 vertices and 807 edges. Structural checks pass and updated floor sketches were regenerated.

### To check later

- This is still an incomplete all-room sweep. Finish all sheets, including room-number shapes obscured by furniture, and reconcile shafts, entrances and graph geometry. Do not write C_DONE.txt until all three buildings are complete.
- JAMEEL Second has two distinct spaces visibly numbered 2117; the eastern office uses key JAMEEL_F2_2117_E. Verify all same-floor repeated numbers and any false duplicates caused by earlier estimated coordinates.
- Newly selected door points are read or estimated from the drawings but their connections to existing corridor points are schematic and may cross walls; trace and adjust those paths. Earlier CC additions also contain estimated door positions and direct corridor links; connectivity and loader checks do not validate geometry or room completeness.

Further small additions: CC First office 1058 and JAMEEL Second room 2155. Latest totals are CC 511 vertices, 513 edges (Plaza 252, First 239, Second 20) and JAMEEL 789 vertices, 809 edges (Plaza 245, First 220, Second 324). The respective floor sketches were regenerated. Door positions and corridor links are drafts and still require the geometry review described above.

Continuation: LIB First gained shelving 1039, Second gained elevator-service room 2041, and Third gained elevator-service room 3045. Third-floor rooms 3038 and 3039 and their doorway coordinates were corrected from the floor drawing and connected through study area 3037. LIB now has 602 vertices and 629 edges: Garden 174, Plaza 154, First 94, Second 92 and Third 88. CC First gained office 1061 and the coordinates and door links for offices 1059 and 1060 were adjusted from the floor plan; CC now has 513 vertices and 515 edges (Plaza 252, First 241, Second 20). JAMEEL Second gained offices 2073, 2079, 2107 and 2109; JAMEEL now has 797 vertices and 817 edges (Plaza 245, First 220, Second 332). Edited sketches were refreshed and structural checks pass.

### To check later

- CC 1061 and JAMEEL 2073 are partly obscured by furniture and their number readings should be confirmed. Office and elevator-service access, room use, and paths from door points to modeled corridors remain provisional; in particular, a connected graph does not establish that a route avoids walls or that service-room doors are usable.
- Finish the full room, shaft and entrance sweep across all three buildings and reconcile existing schematic positions and repeated same-floor numbers. Do not create C_DONE.txt until the work is complete.

Latest LIB Plaza pass added P045, an office whose last digit is partly obscured by furniture; the code is inferred from the visible digits and neighboring numbering and needs confirmation. LIB now has 604 vertices and 631 edges (Garden 174, Plaza 156, First 94, Second 92, Third 88). Its Plaza sketch was refreshed, and the structural check passes. All-room coverage and physical paths remain to be checked.

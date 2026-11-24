# Job D — campus outdoor network

## Sources and calibration

`Campus Layout.pdf`, page 1, supplies the site layout, building outlines and named gate approaches. Graph coordinates use the displayed 3370 × 2384-point page; its PDF rotation is 270 degrees. No printed site scale was found. The track straight was estimated at 131 PDF points between tangencies. Assuming 84.39 m gives 0.6442 m per point, or 9.1246 routing units per point using 0.0706 m per unit. Distances are rounded estimates.

## Draft and links

CAMPUS Plaza has 66 vertices and 65 edges. It includes gates, pedestrian junctions and candidate building-side points for all 11 building codes. The checker and real loader accept the local dataset. The library, HUSS, campus center, Jameel, sports complex and SSE entrance inventories currently provide 16 links; the short door-to-outdoor weights are estimated at 13 units. Three SSE west entrances share one candidate west-side outdoor point. The same-side door points were compared against the displayed site plan, with approximate placement based on the building outlines. Walkway accessibility is assumed.

The latest merge reports one component containing CAMPUS, CC, HUSS, JAMEEL, LIB, SPORTS and SSE: 1065 locations and 1164 edges. PVA, CORE, ADMIN, RESID and PP had no entrance inventories or building datasets at this check. They are not included in that component; the single component does not mean that all 11 buildings are linked.

## To check later

- Door locations and exact orientations are estimates on a dense site plan; check the detailed entrance drawings and refine individual door-to-walkway distances, especially the three SSE west entries sharing a point.
- Some outdoor segments remain schematic and require a detailed path and obstacle review, including the arts perimeter, garden approach and building-door branches. Confirm whether paths are accessible or involve steps.
- Confirm the track measurement and its standard-track assumption against a known site dimension.
- Rebuild links when additional building entrance inventories appear, create same-side outdoor points as needed and rerun the merge.


## Current expansion status — To check later

SPORTS (Garden, Plaza, First), RESID (Plaza, First, Second), and PP (Garden, Plaza) remain the prior partial drafts; their R.NO. inventories and room-door waypoints have not been completed. Only one RESID cluster is represented, so the other residential clusters and their outdoor-only connections are still missing. Do not regard these datasets as complete. Their earlier counts and scale assumptions are recorded in C.md. The campus sketch was regenerated from the current CAMPUS files without overwriting the five central-plaza edges added by the other worker.

The current entrance inventories produce 29 links with no unmatched keys. Existing mappings were preserved, including ADMIN's; some do not match the entrance inventory's recorded side and need site-plan review (for example PP_G_EN01 S currently uses the PP W point, and ADMIN W/S/SE entries use N/E points). Links and door positions are estimates. At the latest merge, the main component contains all 11 building codes and CAMPUS; SSEX consists of 302 disconnected vertices in a concurrently edited dataset owned by another worker. The output therefore reports 303 components. The main component and presence of all building codes do not establish completeness of room coverage or residential clusters.

## SPORTS expansion in progress

SPORTS now contains 182 vertices and 186 edges (Garden 98, Plaza 50, First 34). The vector R.NO. labels in contact sheets were used to add 58 rooms across these floors, including service rooms and restrooms, each with an additional provisional waypoint. `python tools/C_check.py SPORTS` passes. The room-name annotation positions provide approximate room coordinates; door waypoint positions and their connections to the nearest existing corridor are geometric estimates, not verified door locations, and may cross walls. Some source labels were illegible or not associated unambiguously; the SPORTs inventory is incomplete. R.NO. 1003 through 1014, G006 onward, and P001 onward should be audited against the drawings and the original draft for naming and geometry. The sports sketch has not yet been refreshed.

### To check later

Complete a systematic R.NO. inventory on every SPORTS floor, place waypoints at actual doors and trace corridors; check all provisional shaft matches. RESID still has only one cluster represented and requires all remaining clusters; PP remains a partial draft. Rebuild campus links and merge after those inventories and cluster entrances are added. Do not mark D complete.

## RESID expansion in progress

Added 50 room vertices and 50 provisional door waypoints in the previously represented residential cluster: 19 on Plaza, 20 on First, 11 on Second. Current RESID draft: 127 vertices and 128 edges, with 49 Plaza, 48 First and 30 Second vertices. `python tools/C_check.py RESID` passes. Source vector R.NO. labels were read from contact sheets; placement uses adjacent room-name annotations. Door waypoints are interpolated toward the nearest existing hallway, not visually placed at the actual door, and may cross walls. Room-to-suite circulation, several bathroom IDs and labels, and floor connections need checking.

### To check later

The remaining residential clusters, their separate outdoor entrances and their rooms are not modeled. R.NO. codes appear to repeat across clusters, so a cluster-specific key convention needs to be applied to avoid collisions while retaining the room number. PP is still incomplete, and SPORTS remains incomplete as described above. Do not mark job D done.

## Further SPORTS and PP inspection

Corrected the Garden standby and storage labels to G002 and G003 after inspecting the enlarged vector labels; earlier G052/G053 readings were incorrect. Added First-floor meeting room 1006A and office 1006B with provisional internal door connections to department office 1006. SPORTS now has 186 vertices and 190 edges (Garden 98, Plaza 50, First 38); `python tools/C_check.py SPORTS` passes.

### To check later

Audit all previously transcribed SPORTS Garden labels at high zoom: the overlapping annotation text caused at least two earlier misreadings. Door positions and connections are approximate. The PP Garden sheet was inspected at higher zoom; its room-number graphics are unusually dense and were not reliably readable in the inspected region, so PP still requires a full visual inventory. RESID still requires every remaining separate cluster. Job D is not complete.

## Latest SPORTS Garden additions

Added G005 (janitor closet), G024A (service closet), and G052 (control room) after inspecting enlarged vector labels. SPORTS now has 192 vertices and 196 edges, with 104 on Garden, 50 on Plaza and 38 on First; the structural checker passes. Regenerated the three SPORTS and three RESID floor sketches to show the current drafts. These additions use estimated waypoint positions and nearest-hallway links; these are not confirmed doorway geometry.

### To check later

Review whether the preexisting G024 restroom classification belongs to the adjacent G024A service closet: the labels overlap on the drawing. Continue the full inventories of SPORTS, PP and all RESID clusters; current sketches and a passing structural check do not establish completeness or route validity.

## Latest room additions

Added SPORTS Plaza P019, P023 and P024, and RESID Second 2A4 and 2A6 in the already modeled cluster, with provisional corridor waypoints. Structural checks pass: SPORTS 198 vertices / 202 edges, RESID 131 vertices / 132 edges. Regenerated the corresponding floor sketches.

### To check later

Review the exact positions and internal access to the two RESID suite bathrooms and the SPORTS Plaza instruction room: the new waypoint positions are estimates. Complete the remaining R.NO. inventories, other RESID clusters and all required outdoor links. PP remains partial. These drafts are not complete.

## Second RESID cluster draft

The adjacent repeated cluster was located on Plaza approximately 393 points east and 46 points south of the previously modeled cluster; contact-sheet inspection shows repeated local R.NO. codes. A second cluster draft was constructed by translating the existing cluster on all three floors by that offset. Keys retain the local code with a `_C2` suffix to distinguish repeated labels; its own Plaza entrance `RESID_P_EN02` connects to a separate approximate campus door point. The two clusters have no indoor inter-cluster edges. The copied shaft matches, rooms, door waypoints, and links are provisional rather than independently surveyed. On each floor run the cluster-aware `tools/D_resid_check.py`, which permits distinct clusters but requires each building component to have an entrance: RESID now has 262 vertices and 264 edges, two 131-vertex components, each with an entrance.

The campus graph and all current entrance files were relinked; all currently listed entrances matched, and the latest merge reports one component with 2,989 locations and 3,142 edges across the datasets currently present. This is a structural result, not evidence that all clusters or rooms are present. Current RESID and campus sketches have been regenerated.

### To check later

The second cluster's entrances, outdoor location, room positions, door locations, local codes and stair matches need independent review on all three sheets. The translated draft repeats every omission and geometric error in the first cluster. Many other residence clusters, rooms in SPORTS, and PP rooms remain to be inventoried. The new campus link is an estimate. Do not mark job D done.

## Additional repeated RESID clusters

Four additional Plaza footprints were compared visually with the first cluster, using the P-034 annotation as an anchor. For clusters C3–C6, the existing three-floor draft was translated by (-374,198), (803,102), (1197,440), and (567,711) PDF points respectively. Each has its own Plaza entrance, provisional vertical shaft matches and a distinct outdoor point; no indoor edges join clusters. The 3-floor checks pass after each floor: RESID now has 786 vertices and 792 edges, six separate 131-vertex indoor components, each with an entrance. Repeated local room codes use C3–C6 suffixes. The associated outdoor coordinates use an approximate 0.084 site-plan points per residence-sheet point, and each connects to the residence walk by an estimated straight segment.

The latest full merge has one component with 3,557 vertices and 3,719 edges. RESID floor sketches and the campus sketch were regenerated.

### To check later

The additional clusters were generated from a visually repeated Plaza footprint, not independently transcribed on every floor: verify their actual entrances, upper-floor layouts, room codes, door positions and provisional shafts. The copied draft inherits the first cluster's omissions and questionable nearest-hallway connections; connectivity does not verify physical passage. Check outdoor point alignment and routes against the site plan. Additional residence clusters with different or rotated footprints remain, as do SPORTS and PP inventories. Do not mark job D done.

## RESID suite label audit

Enlarged the first cluster's Plaza and First plans and corrected Plaza bedroom codes PA4 and PA5, which had been misread as PA5 and PA6. Corrected PB1 to kitchenette and added PB2 living room, Plaza bathrooms PA3/PA6, and First bathrooms 1A3/1A6/1B3/1B6. Those changes were propagated to the six repeated draft clusters using the existing translation offsets, for 42 additional room vertices and 42 waypoints. RESID now has 870 vertices and 876 edges; the cluster-aware structural check passes with six 145-vertex components, each with its own entrance. Latest merge: 3,890 locations, 4,052 edges, one component.

### To check later

The source-cluster room labels were inspected, but propagated cluster labels and door locations are provisional and need individual visual review. Nearest-hallway edges are estimated and may cross walls. Other residence clusters and SPORTS/PP rooms are still missing. PP Garden at 10× remains visually obscured by densely overlapping vector strokes. D is not complete.

## Suite-entry and SPORTS Garden audit

Added RESID R.NO. suite-entry identifiers PA/PB/PC, 1A/1B/1C/1D, and 2A/2B to each of the six provisional repeated clusters (54 hallway vertices). Per-floor cluster-aware checks pass; RESID has 924 vertices and 930 edges. Added SPORTS Garden G004 and G028 after enlarging their vector labels; SPORTS has 202 vertices and 206 edges and passes the structural checker. Updated the corresponding sketches. The latest merge has 4,128 vertices, 4,291 edges and one component.

### To check later

The RESID Second-floor source drawing shows separated upper-floor portions with open or roof areas between them; the inherited long hallway segments and shaft links require visual review and must not be assumed to connect through buildings or roofs. Suite-entry positions and their connections are estimates. Additional RESID clusters and the full SPORTS and PP inventories remain unfinished. SPORTS G004/G028 links are also provisional. D is not complete.

## SPORTS shaft and corridor audit

The Garden drawing labels the central stair ST07. The previously provisional STX2 at the corresponding position is now keyed ST07 on Garden, Plaza and First; the cross-floor identification is positional and still needs confirmation. Added Garden ORG02, ORG03 and ORG04 circulation labels, and corrected Plaza P010's label to private exercise. The SPORTS checker passes with 205 vertices and 209 edges; all three SPORTS floor sketches were regenerated. The latest merge reports one component, 4,322 locations and 4,485 edges.

### To check later

Confirm that the Plaza and First landings match Garden ST07 and that the new circulation vertices and connections trace actual doors. Previous nearest-hallway room links, unmapped rooms, PP plans and the remaining RESID clusters require review. The job is incomplete.

## SPORTS Garden R.NO. audit

Enlarged the western and eastern Garden plan. Added G009, G031, G039, G044, G050 and the labeled ORG01, ORG06–ORG10 and OSG01 circulation spaces, with provisional connections and room door points. Garden ST01 and ST06 were read directly; the corresponding previously provisional Plaza/First STX1 and Plaza STX3 matches were renamed by position and need cross-floor confirmation. SPORTS now has 223 vertices and 227 edges (Garden 129, Plaza 56, First 38); `python tools/C_check.py SPORTS` passes. Regenerated SPORTS sketches. Latest merge: 4,573 locations and 4,740 edges, one component.

### To check later

Garden G031/G044 and G050 are small spaces with labels crowded by adjacent geometry; check their classification and actual doors. ORG and room connections are estimated straight segments, not a complete wall audit. Confirm positional shaft matches, remaining SPORTS labels, PP rooms and the remaining separate RESID clusters. D is not complete.

## SPORTS south stair audit

Added labeled Garden squash lobby G045 and stairs ST04/ST05, plus Plaza stops matched by their positions on the plan and the standard 113-unit stair links. The Garden and Plaza updates each passed `python tools/C_check.py SPORTS`. SPORTS now has 228 vertices and 234 edges (Garden 132, Plaza 58, First 38); its changed sketches were regenerated. Latest merge reports 4,747 locations, 4,916 edges and one component.

### To check later

Confirm that the Plaza stair landings correspond to Garden ST04/ST05 and refine their corridor approaches. The visible court spaces lack readable R.NO. identifiers in the inspected crops; review their numbering and access. Garden G051 and G053 remain unlocated if they exist. SPORTS, PP and the RESID cluster inventories remain incomplete; D is not done.

## RESID rotated cluster and entrance links

Compared the repeated footprint centered near Plaza P-034 (2650,1403) to the first cluster, and inspected First/Second overviews. Created provisional C7 on each floor by a 180-degree transformation around those corresponding plan anchors, including a separate Plaza entrance and positional stair links. Cluster-aware checks passed after each floor; RESID now has 1,078 vertices and 1,085 edges in seven indoor components, each with an entrance. Added an estimated separate C7 outdoor point and links. Also added approximate CORE north/south and HUSS northeast outdoor points for entrance inventories that appeared since the previous pass. The campus checker passes and the latest merge reports one component, 5,024 locations and 5,200 edges. This merged size exceeds Graph(5000); a consumer of the merged data needs a larger graph capacity.

### To check later

The rotated cluster is a transformed draft, not a room-by-room transcription: independently verify all room codes, locations, actual entrance side, shaft correspondence and interior links. The campus coordinates and link lengths for C7 and newly added CORE/HUSS points are approximate. Several additional RESID footprints, PP rooms and SPORTS labels remain missing, and previously documented provisional edges still need review. D is not complete.

## Residence administration Plaza inventory

Inspected the residence administration/service wing on the Plaza drawing and added 17 R.NO. spaces (washroom, laundry, storage, staff offices, reception, service and meeting rooms), their provisional waypoints, three lobby/arcade waypoints and an entrance as a separate component. Because the local P001–P019 codes repeat in the residence drawing, keys use `_C8` to distinguish this wing. Added its estimated campus-side outdoor point and link. The cluster-aware checker passes: RESID has 1,116 vertices, 1,122 edges and eight indoor components, each with an entrance. Campus checker passes. The latest merge reports one component with 5,274 locations and 5,450 edges; capacity must exceed 5,000. RESID Plaza and campus sketches were regenerated.

### To check later

The admin-wing room-to-waypoint edges and entrance orientation/position are approximate, and duplicate P017 labels in the drawing need a closer review. First-floor mechanical room 1001 and elevator-machine room 1002 appear on the roof portion above this area; their accessible route or stair landing was not established and they remain to be added. Remaining residence clusters, PP rooms and SPORTS details are not complete. Do not mark D done.

## PP thin-stroke inspection and expansion

The original PP PDFs use unusually thick 0.72-point strokes that obscure many vector labels. For inspection only, exported the drawing as SVG and reduced stroke widths before rendering; the original PDFs remain unchanged. This exposed labels in the Garden administration and plant wings and the Plaza office wings. Added 94 candidate PP room vertices, door points and plant-corridor waypoints; corrected the inherited Garden G011 label to backup data center. Identical room codes occur in the separate plant and administration wings, so plant keys carry `_PLANT`. PP now has 242 vertices and 243 edges (Garden 175, Plaza 67), and `python tools/C_check.py PP` passes. Added SPORTS First offices 1006C and 1006D; SPORTS is 232 vertices and 238 edges and passes its structural check. Updated PP and SPORTS sketches.

The campus links were rebuilt from all currently available entrance inventories, with existing ADMIN and cluster-specific mappings retained; 41 entrance links were reported and none unmatched. The latest merge reports 6,124 locations, 6,304 edges and one component. A merged graph capacity of at least 6,124 is required.

### To check later

The thin-stroke exports improve readability but several PP labels, room types and all wings have not yet been completely transcribed. PP door candidates were selected from nearby vector curves; a nearby curve is not proof of the correct door, and connections to selected corridor points can still cross walls. Existing inherited PP Garden G011 connections and the long bridge between administration and plant require geometric review after the G011 correction. PP, SPORTS and the remaining RESID clusters are not complete; this is not a done marker.


## Latest PP and RESID additions

Thin-stroke PP renders revealed 17 additional Garden plant R.NO. labels and nine Plaza administration R.NO. labels. Added those spaces with provisional door points. Added seven Garden plant corridor waypoints and rerouted some nearby existing door points to reduce long connections. PP now has 301 vertices and 302 edges (Garden 216, Plaza 85); the structural checker passes after both floor updates.

Compared the previously unmodeled residence block around the P-010 annotation at (584,679) with the source block at (1361,519) on all three floor sheets. Added provisional cluster C9 by translating the first-cluster draft (-777,+160), with separate Plaza entrance and outdoor point. Per-floor cluster-aware checks pass; RESID has 1,270 vertices and 1,277 edges in nine components, each with an entrance. Added a provisional CORE southwest campus point for a newly published entrance and rebuilt campus links; all currently published entrance keys match. The latest merge reports one component, 6,400 locations and 6,583 edges. Updated PP, RESID and campus sketches.

### To check later

PP room positions, room classifications, door-arc selection and connecting segments remain approximate; some nearest-corridor paths may cross walls. C9 inherits the source cluster's unverified rooms, connections and shaft matches; even though a similar footprint appears on each floor, review its actual rooms and entrance individually. Other RESID clusters and SPORTS and PP R.NO. labels remain missing. D is not complete.

## RESID C10 and PP yard additions

Compared the residence block with Plaza P-010 near (198,1480) to the original block near (1361,519); the visible plan is approximately reflected across the diagonal, and corresponding First and Second annotations were located. Added a provisional C10 cluster by this coordinate transform on each floor, with its own entrance and estimated outdoor link. Each floor update passed the cluster-aware check. RESID now has 1,424 vertices and 1,432 edges, in ten separately entered indoor components.

The PP Garden thin-stroke drawing also shows yard offices, lockers and warehouse labels G001–G012 and G091/G096 in separate structures. Added 14 room vertices, candidate door points, and six outdoor/corridor approach points; PP now has 335 vertices and 336 edges, and its structural checker passes. Rebuilt current entrance links (44 matched, none unmatched); latest merge has one component, 6,609 locations and 6,794 edges. Updated the affected sketches.

### To check later

C10 is derived from the first cluster's draft; room codes, shaft matches, entrance location and routes must be checked independently. Its Second-floor anchor differs somewhat from the transformed position. PP yard-room classifications, door points and outdoor route geometry are estimates, and the long service-yard approaches need visual review. Additional RESID clusters and rooms across all three job D buildings remain. Do not mark D done.

## Further PP Garden labels

Added seven Garden plant room labels (G058, G060, G061, G063, G064, G066 and G067) from thin-stroke renders, with candidate door waypoints. PP is now 349 vertices and 350 edges (Garden 264, Plaza 85) and passes the structural checker. Rebuilt current campus entrance links and reran the merge: one component, 6,626 locations and 6,811 edges. Refreshed the Garden sketch.

### To check later

These room types, door-curve matches and paths are provisional; some edges can cross walls. The complete PP, SPORTS and RESID inventories are still unfinished. Do not mark D done.

## PP Plaza and residence study-wing additions

Inspected the thin-stroke PP Plaza plant office band, added nine labeled spaces and six corridor waypoints on its south side, then ran `python tools/C_check.py PP`. PP now has 373 vertices and 374 edges (Garden 264, Plaza 109).

Inspected the residence Plaza study/laundry wing separately and added 14 labeled spaces, candidate door waypoints selected from nearby PDF curves, four hall waypoints and a separate Plaza entrance/outdoor link, using `_C11` to distinguish repeated local codes. `python tools/D_resid_check.py` passes: RESID has 1,457 vertices and 1,464 edges in 11 separate indoor components, each with an entrance. Updated the PP Plaza, RESID Plaza and campus sketches. All currently published entrance keys match after rebuilding links.

Latest merge: 6,695 vertices, 6,879 edges, two components: the main component contains all listed building codes, and a five-vertex CORE-only component is disconnected. CORE files are another worker's responsibility. The result can change while workers edit.

### To check later

Door-curve proximity is only a candidate matching method; the new PP and study-wing room-door and corridor paths must be checked against walls and actual entrances. The study-wing reception/entrance point and outdoors link are estimates. PP, SPORTS and RESID remain incomplete, including upper floors and additional residence clusters. Do not mark D done.

## Additional PP Plaza offices

Added the labeled Plaza administration offices P001 and P026 with candidate door points; PP has 377 vertices and 378 edges and passes its structural check. Updated its Plaza sketch. The final current merge reports 6,702 vertices, 6,886 edges and two components: a 6,697-vertex main component and five isolated CORE vertices. CORE is another worker's dataset.

### To check later

The two PP office-door arc matches and corridor approaches are estimates and need wall-by-wall review. The three job D building inventories remain incomplete; do not mark D done.

## Residence C12 suites

Visually inspected the rotated residence block around (1350,1570)–(1800,2000) on Plaza, First and Second. Added the visible labeled suite and room vertices as four separately entered draft components C12A–D, with Plaza entrances, room-door candidates and provisional position-matched stairs on consecutive floors. The cluster-aware structural check passed after each floor; RESID has 1,585 vertices and 1,588 edges across 15 entered components. Created four separate approximate campus-side door points, rebuilt all current entrance links (49, none unmatched), and refreshed RESID/campus sketches. The latest merge reports 6,889 vertices and 7,074 edges in two components: the 6,884-vertex main component and five isolated CORE vertices in another worker's data.

### To check later

The C12 rooms and entries were visually read, but positional shaft matches, local entrance sides, and selected nearby curve/door associations remain provisional; the four stairs may share circulation, which requires closer review. Corridor links may cross walls. Some local labels and additional clusters still need transcription. PP and SPORTS are also incomplete. Do not mark D done.

## Additional eastern residence clusters

Audited the C12 Second-floor suite labels, added two distinct spaces both labeled 2B using `_BATH` and `_SERVICE` key suffixes, and corrected several bathroom types. Identified a previously unmodeled far-east Plaza residence footprint, compared its First and Second drawings, and added provisional C13 by translating the source-cluster draft about (+1608,+528) PDF points. Identified another southeast footprint with a 90-degree transformed layout and added provisional C14 by applying x=3699−y and y=x+139 to that draft. Each has its own Plaza entrance and estimated outdoor point. The cluster-aware checker passed after each floor: RESID now has 1,897 vertices and 1,902 edges. Current entrance links were rebuilt; the latest merge reports 7,246 locations and 7,436 edges in two components, one of which is five CORE vertices in another worker's dataset. RESID and campus sketches were regenerated.

### To check later

C13 and C14 were initialized from a repeated draft and need independent room-by-room checking, particularly upper-floor layouts, matching stairs, door curves and entrance locations. C12's identically labeled 2B spaces require on-site confirmation. Candidate door connections may cross walls; site-plan placement and outdoor connections are estimates. Additional RESID, SPORTS and PP inventory remains; do not mark D done.

## Latest PP and C12 audit

Added PP Garden plant G008, G009, G010 and G011 from enlarged thin-stroke renders, with candidate door waypoints. PP is now 385 vertices and 386 edges and passes the structural checker. Audited C12 Second-floor duplicate 2B labels, added distinct bathroom and service-space points, and corrected visible bathroom types; those additions were made before the C13/C14 draft copies. Current RESID count is 1,897 vertices and 1,902 edges, and the cluster-aware checker passes. Updated the affected sketches and rebuilt all currently available entrance links (51 matched, none unmatched). Latest merge: 7,320 locations, 7,510 edges, two components; the isolated component contains five CORE vertices owned by another worker.

### To check later

Check PP G011 reading and room use against the densely overlaid drawing, all door curves and corridor routing. C12's repeated 2B labels and the new geometry require review. RESID upper-floor shaft matches, remaining clusters, and the complete PP and SPORTS inventories remain unfinished. Do not mark D done.

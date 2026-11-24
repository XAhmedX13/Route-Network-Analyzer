# Review of Claude's SSE and ADMIN graph and sketches

## Verdict

**Not ready for routing.** Room labels and dots in the inspected SSEX sample generally agree with the printed room numbers, but many straight-line connections cross solid walls or neighboring rooms. The added SSE wing nodes were generated on an axis through room positions, and some are inside rooms or beyond the building rather than in the corridor. ADMINX has the same wall-crossing problem. The ADMIN sketches omit the entire later ADMINX layer, so they cannot be used to review the current ADMIN graph. The four SSEFIX links have a plausible ORP11 destination, but their straight segments do not follow the doors and corridor.

This is a **sample review, not an exhaustive certification**. Source plans were rendered as zoomed crops at the graph coordinates; SSE coordinates are displayed upright, equivalent to applying the page derotation matrix when drawing on the stored 270-degree page. Red lines in the review helper indicate the direction of the actual graph edge; long lines are clipped within the crop. ADMIN plans are much lighter; uncertain cases were not counted as errors. I also inspected selected corridor nodes, the four SSEFIX links, the link tables, floor-link identities and the sketch-generation inputs. No data or sketch was changed.

## Counts and scope

| Check | Checked | Confirmed wrong | Interpretation |
|---|---:|---:|---|
| SSEX room samples, plaza | 24 | 11 | At least the listed connections are wrong; room-number and dot checks found no confirmed mismatch in these 24. |
| SSEX room samples, first | 24 | 11 | As above; includes rooms connected via XW nodes. |
| SSEX room samples, second | 24 | 9 | As above; includes rooms connected via XW nodes. |
| ADMINX room samples, garden/plaza/first | 36 (12 per floor) | 12 | At least the listed connections are wrong. ADMINX uses descriptive generated keys, not plan room-number keys. |
| SSEFIX links | 4 | 4 | Destination is in ORP11; the direct line geometry is wrong. |
| ADMIN sketches | 4 | 3 | G, P, F1 lack ADMINX rooms and links; there are no ADMINX F2 rows. |

These are distinct sampled room keys with at least one confirmed routing defect, not estimates of the total defective population. Some visually ambiguous links and unchecked edges may have defects too. The numbers above do not assert that every unflagged link was fully verified to its far endpoint. Sample sets are reproducible with `tools/R_review_crops.py SSE P|F1|F2 0|12` and `tools/R_review_crops.py ADMIN G|P|F1 0` (set `PYTHONPATH=tools/.pylib`); for arbitrary specific keys pass them after the start argument. Source crops include a red dot and the first part of the graph edge. The helper displays the source plan, not the saved sketch.

## Confirmed errors and fixes

A proposed door/corridor waypoint means a new point just outside the **drawn doorway**, connected along accessible circulation; remeasure the route and weight. Directions below refer to the upright plan crop. A direct segment through a wall is a routing error even where its endpoints happen to be in the right rooms.

| Key / edge | Problem seen in plan | Correct value / fix |
|---|---|---|
| SSE_P_P088 → SSE_P_W_CP45 | Leaves P088 through the diagonal partition toward classroom CP45. | Route via P088's lower doorway to the passage, then to the corridor. |
| SSE_P_P103 → SSE_P_CorrMid | Crosses the upper wall; the office door is on the lower side. | Route through the lower door and intervening circulation. |
| SSE_P_P070 → SSE_P_W_P068 | Exits through the bottom wall; doors are on the right. | Use a right-side doorway and corridor waypoint. |
| SSE_P_P086A → SSE_P_W_ORP08_W | Runs through the partition and room P086. | Use P086A's own left-side doorway and passage. |
| SSE_P_P049 → SSE_P_W_P048 | Crosses the upper wall; P049's shown door is below. | Route through the lower door and adjacent room/passage as drawn. |
| SSE_P_P044 → SSE_P_W_P039 | Crosses into janitor washroom P041. | Use the left-side door of P044 and its passage. |
| SSE_P_P001 → SSE_P_W_P002 | Cuts through the partition into restroom P002. | Route from P001 through its own doorway into the passage. |
| SSE_P_P024 → SSE_P_W_P023 | Crosses the partition into the room below P024. | Use P024's right-side door and its corridor. |
| SSE_P_P013 → SSE_P_W_P014 | Crosses the top wall; the visible door is on the right. | Route through that door and the adjacent circulation. |
| SSE_P_P034 → SSE_P_W_ORP15_W | Crosses the top wall rather than the right-hand door. | Add a waypoint outside the right-hand door. |
| SSE_P_P022 → SSE_P_W_P023 | Runs through the partition into P021. | Use P022's left-hand door, then the adjoining passage. |
| SSE_F1_1187 → SSE_F1_W_ST05_03 | Leaves through the upper-left wall instead of the upper-right doorway. | Route through the drawn office doorway to its corridor. |
| SSE_F1_1226 → SSE_F1_OR121 | Crosses the upper wall towards the adjacent office, rather than the door on the right. | Use the right-side door and a corridor waypoint. |
| SSE_F1_1135 → SSE_F1_OR114 | Crosses the lower-right wall; its doorway is on the lower-left side. | Route through that doorway to the corridor. |
| SSE_F1_1046 → SSE_F1_OR115 | Crosses the left exterior wall; doorway is on the upper-right. | Route through the upper-right doorway and hallway. |
| SSE_F1_1001 → SSE_F1_W_SE_Rest_Upper | Cuts through the lower-left wall away from the door. | Route through the actual office door and corridor. |
| SSE_F1_1064 → SSE_F1_W_1023 | Goes through the bottom partition into the lab. | Use the left-hand door and connect along the office corridor. |
| SSE_F1_1015 → SSE_F1_W_ST09 | Runs through the neighboring office 1016. | Route via 1015's own left-side door and corridor. |
| SSE_F1_1022 → SSE_F1_W_OR112_E | Crosses the top wall to the right of the door. | Route via the top-left doorway, then corridor OR112. |
| SSE_F1_1036 → SSE_F1_XW05_10 | Runs toward the exterior side rather than the lower-left corridor door. | Move the XW corridor to the real passage and route through the office door. |
| SSE_F1_1054 → SSE_F1_XW05_05 | Points through a partition toward the adjacent IT room instead of the corridor door. | Put the corridor node outside the lower-left door. |
| SSE_F1_1053 → SSE_F1_XW05_03 | Cuts across the partition toward office 1051; the door opens upper-right. | Put the corridor node outside that door. |
| SSE_F2_2185 → SSE_F2_XW10_02 | Goes toward the exterior upper-right wall, opposite the office door. | Route via the lower-left office door and its corridor. |
| SSE_F2_2126 → SSE_F2_XW10_06 | Crosses the upper-left wall of the kitchenette. | Use a drawn kitchenette door and the corridor on that side. |
| SSE_F2_2136 → SSE_F2_XW10_11 | XW endpoint falls inside the office, not in its upper-right corridor. | Move the XW node into that corridor, outside the office door. |
| SSE_F2_2114 → SSE_F2_XW10_14 | Heads through the lower-left partition instead of its upper-left doorway. | Route through the doorway to OR200. |
| SSE_F2_2032 → SSE_F2_XW09_07 | Crosses the partition toward office 2033. | Route through 2032's lower-left door to the passage. |
| SSE_F2_2016 → SSE_F2_W_2009 | Crosses the lower-right wall; door is lower-left. | Use the kitchenette door and its passage. |
| SSE_F2_2001 → SSE_F2_W_ST09 | Crosses the partition into the stair enclosure, away from the office door. | Use the upper-left office door and connect via the corridor to ST09. |
| SSE_F2_2054 → SSE_F2_W_2055 | Goes through the partition into lab 2055. | Use the electrical room's right-hand doorway. |
| SSE_F2_2062 → SSE_F2_W_OR218_M | Crosses the top partition into lab 2061. | Use the left-hand office door and adjacent lab circulation. |
| SSE_F1_XW05_05, SSE_F1_XW05_10 | First node falls inside office 1047; the last is on/just outside the exterior wall by offices 1036/1037. Their chain is not a corridor centerline. | Redraw the XW05 chain along the real angled hallway on the door side of the offices, with door points and corridor junctions. |
| SSE_F1_XW06_19 → SSE_F1_W_ST05_03 | The XW06 end lies in open terrace/open space, not the hallway, and its 580-point straight connection cannot establish a walkable corridor. | Trace the hallway and actual connections to ST05 through doorways; do not join by nearest distance. |
| SSE_F2_XW09_07, SSE_F2_XW10_02, SSE_F2_XW10_11 | These sampled XW positions/room edges land in or across offices rather than in the corridor. | Rebuild XW09/XW10 using the plan's hallway geometry and verify both ends; see affected room rows above. |
| SSE_P_CP16 → SSE_P_W_SE_Rest_Upper | The segment starts at the classroom's outer-side door and runs back through the classroom/partition to ORP11. | Follow the actual door and circulation around the classroom to ORP11, adding bends; recalculate weight. |
| SSE_P_CP17 → SSE_P_W_SE_Rest_Upper | The segment traverses classroom interior instead of following circulation. | Route from its drawn door through connected corridor/door waypoints to ORP11. |
| SSE_P_CP25 → SSE_P_W_SE_Rest_Upper | Segment crosses into adjacent classroom CP26. | Use CP25's actual doorway and route along circulation to ORP11. |
| SSE_P_CP26 → SSE_P_W_SE_Rest_Upper | Segment cuts across the solid diagonal classroom wall, away from the door. | Route via CP26's lower-left doorway and corridor to ORP11. |
| ADMIN_G_XOFFICE07 → ADMIN_G_EN_NE | Crosses the lower wall into the storage room. | Use the office's left doorway, then follow circulation to an entrance. |
| ADMIN_G_XOFFICE29 → ADMIN_G_LOBBY_S3 | Goes through the left wall of room G052. | Route from the G052 doorway at the upper side to the lobby. |
| ADMIN_P_XOFFICE09 → ADMIN_P_CORR_W | Exits through the right wall below the door of P017. | Route through the right-side doorway and corridor. |
| ADMIN_P_XFILING02 → ADMIN_P_LOBBY_E | Crosses the north wall of P077. | Route through the right-side door and passage. |
| ADMIN_P_XOFFICE15 → ADMIN_P_CORR_1 | Crosses the left wall of P075, away from its upper doorway. | Use the upper door and corridor. |
| ADMIN_P_XOFFICE22 → ADMIN_P_CORR_S | Crosses the right wall of P031 below the door. | Use the right-side door and passage. |
| ADMIN_P_XOFFICE26 → ADMIN_P_LOBBY_S5 | Crosses the upper wall of P046. | Route through the office's drawn doorway and circulation. |
| ADMIN_P_XTRASH01 → ADMIN_P_LOBBY_SW2 | Crosses the solid right wall of trash room P034. | Route via its actual doorway, then lobby. |
| ADMIN_P_XOFFICE30 → ADMIN_P_EN_S | Crosses the left wall of P042 instead of using its upper-right door. | Route via the drawn door and circulation. |
| ADMIN_F1_XOFFICE12 → ADMIN_F1_LOBBY_SW | Crosses the lower wall into the adjoining office. | Use the upper-right office door and corridor. |
| ADMIN_F1_XOFFICE25 → ADMIN_F1_CORR_5 | Crosses the upper corridor wall of office 1045. | Use the office entrance and a corridor waypoint. |
| ADMIN_F1_XELEC03 → ADMIN_F1_LOBBY_SW | Crosses the wall into the adjacent staircase enclosure. | Route through the electrical-room doorway and adjoining circulation. |
| ADMIN_G.pdf, ADMIN_P.pdf, ADMIN_F1.pdf | Sketches contain only `ADMIN_locations`/`ADMIN_edges`; all 182 ADMINX vertices and their 182 links are absent. `tools/ADMIN_sketch.py` reads only the base files, and the sketch timestamps predate ADMINX. | After fixing the graph, regenerate all ADMIN floor sketches including base and ADMINX vertices and cross-file links. |

## Other checks and limitations

- The 72 sampled SSEX dots were on the room labels bearing the same printed R.NO.; no definite number mismatch was established in this sample. ADMINX keys such as `XOFFICE07` are arbitrary generated identifiers, not the room numbers printed on the plans; if room-number lookup is a requirement, retain aliases such as G005/P017/P075 and check the actual R.NO. on every corresponding plan. The ADMIN sampling above checks location and connections, not that its generated key equals a plan number.
- The observed ORP11 point `SSE_P_W_SE_Rest_Upper` is in the corridor near the restroom, so the problem with SSEFIX is the edge geometry, not simply its destination. The existing CP16/17 vertices also sit at the outer-side doors, which makes a direct edge to ORP11 especially misleading.
- The 28 SSE and 18 ADMIN base vertical edges join same-named stair/elevator keys on adjacent floors; their coordinates are generally aligned. This is an identity and rough alignment check, not proof of physical continuity, accessibility, or every shaft door. SSE ST10 has only P–F1 in the data; verify the second-floor plan before adding a connection. Check freight/service elevator accessibility and opening floors in the field.
- A text-based scan found no room labelled restroom, washroom or toilet typed as something other than RESTROOM; names of restroom **corridors** are correctly HALLWAY and excluded. This does not establish that every restroom in the plans was captured.
- No specific missing room is asserted from this sample. A complete visual room-by-room inventory, especially unlabeled spaces and ADMIN F2, remains necessary before accepting the claim of complete coverage. The ADMIN F2 sheet and its base graph were not sampled for individual rooms in this review.
- ADMIN sketch omissions concern the saved PDFs, not proof that the 182 ADMINX records are absent from the merged data. SSE sketches were generated using the merged graph; verify them again after any repairs and after merging the intended files.

## Suggested fixes

1. Replace nearest-point straight links with door nodes and corridor paths traced from each original plan; repair every listed edge and audit the remaining generated links by wing.
2. Rebuild the XW chains using actual corridor centerlines and junctions, not the principal axis of room-label positions. Verify each endpoint joins a reachable corridor without crossing walls.
3. Redraw SSEFIX through the actual entrances and ORP11, calculate segment weights from the route, and verify accessibility flags and floor transitions against the plans.
4. Add authoritative room-number aliases where ADMIN lookup requires them; make a complete plan-to-graph inventory of rooms, restrooms, stairs and elevators across all floors.
5. Merge the corrected layers and regenerate SSE and ADMIN sketches with all vertices and edges; inspect zoomed door and junction crops and rerun graph connectivity checks. Preserve this review as an audit of the original state.


# Sketch review

The seven old PDFs were opened and rendered, including enlarged crops, against the corresponding source plans and merged graph. The old titles reported the same per-floor vertex and edge totals as the merged files; this is not proof that every dot was individually legible or correctly placed.

## Findings in the previous drawings

- SSE: the background had strong department colours, labels were very small at sheet scale, and numerous red straight edges run through intervening rooms and walls (particularly the diagonal wings). Red meant added corridors, rather than a consistent wall-crossing warning. The legend did not explain vertex categories or all edge colours.
- Administration: many long dark edges visibly cut through rooms or walls, and their weight labels clutter the network. The original titles explained floor-link rings but there was no complete graph colour legend. Some locations are represented by generic office keys; visual verification of their semantic room identity against the architectural plan is limited.
- Floor-link rings were present in the inspected drawings, but the actual cross-floor edges cannot be drawn as ordinary same-floor segments. Co-located graph vertices and crowded labels can hide individual dots. A data-driven redraw cannot establish that all room names are correctly located; the owner should check coordinates and the suspect edges against doors and plans.

## Redraw and method

All graph vertices and all edges with both endpoints on the sheet are drawn from the merged files. Dot colours distinguish room, classroom, restroom, stairs, elevator, entrance, corridor, door and other; a ring marks a stair/elevator with a cross-floor link. Weights appear only for edges at least 200 page points long when the label has room. Labels are placed with a collision-minimizing search; coincident vertices remain coincident and dense areas may still need zooming.

For SSE, input coordinates are upright: they are transformed with the source page derotation matrix into the stored page coordinate system for line intersection, then returned to upright coordinates for drawing. The faded background is a raster rendering of the original rotated page. ADMIN uses the unrotated plan. No vertex positions or graph edges were changed.

Suspects are edges intersecting a dark stroked straight plan segment of at least 30 page points, excluding near-parallel intersections and touches within 3 points of edge endpoints or 1 point of plan-line endpoints. Intersections within 5 points along the edge are merged. This is a heuristic: plan lines include furniture, annotations and other non-wall geometry, and short or nonblack walls are missed. Orange is a review flag, not proof of a blocked route. Counts are unique edges; ranking is by number of distinct intersections, then by geometric length. The list contains up to 20 per sketch (all when fewer than 20).

| Sketch | Locations | Same-floor edges | Suspect edges | Cross-floor stair/elevator links | Coincident coordinate groups |
|---|---:|---:|---:|---:|---:|
| SSE_P | 386 | 397 | 81 | 14 | 27 |
| SSE_F1 | 559 | 562 | 154 | 28 | 78 |
| SSE_F2 | 559 | 560 | 151 | 14 | 74 |
| ADMIN_G | 106 | 106 | 85 | 6 | 0 |
| ADMIN_P | 103 | 103 | 68 | 12 | 0 |
| ADMIN_F1 | 88 | 87 | 79 | 12 | 0 |
| ADMIN_F2 | 14 | 13 | 12 | 6 | 0 |

## SSE_P - worst suspect edges

Ranked key pairs (distinct plan-line crossings; straight-line length in page points):

1. `SSE_P_XW07_02` - `SSE_P_XW06_01` (6; 192 pt)
2. `SSE_P_CP26` - `SSE_P_W_SE_Rest_Upper` (5; 134 pt)
3. `SSE_P_CP25_D` - `SSE_P_W_SE_Rest_Upper` (4; 208 pt)
4. `SSE_P_W_ST09` - `SSE_P_W_SE_Rest_Upper` (4; 160 pt)
5. `SSE_P_XW06_01` - `SSE_P_ORP12` (4; 134 pt)
6. `SSE_P_P105_D` - `SSE_P_W_P102` (4; 111 pt)
7. `SSE_P_W_ORP08_E` - `SSE_P_W_Hexagon` (4; 86 pt)
8. `SSE_P_ORP12` - `SSE_P_W_Standalone_Class_Court` (3; 284 pt)
9. `SSE_P_W_ORP15_E` - `SSE_P_W_Southeast_Court` (3; 194 pt)
10. `SSE_P_XW07_01` - `SSE_P_XW07_02` (3; 185 pt)
11. `SSE_P_ORP12` - `SSE_P_W_P039` (3; 139 pt)
12. `SSE_P_W_Southeast_Court` - `SSE_P_W_SE_Rest_Lower` (3; 117 pt)
13. `SSE_P_P030_D` - `SSE_P_W_P031` (3; 117 pt)
14. `SSE_P_W_Phys_Restrooms` - `SSE_P_W_P066` (3; 115 pt)
15. `SSE_P_P053_D` - `SSE_P_W_P052` (3; 112 pt)
16. `SSE_P_CP29` - `SSE_P_W_CP29_E` (3; 110 pt)
17. `SSE_P_W_ORP14_M` - `SSE_P_W_South_Transition` (2; 455 pt)
18. `SSE_P_XW03_01` - `SSE_P_W_ORP15_W` (2; 261 pt)
19. `SSE_P_W_South_Court` - `SSE_P_W_ORP14_M` (2; 225 pt)
20. `SSE_P_XW07_01` - `SSE_P_XW08_01` (2; 213 pt)

Coincident-coordinate groups: 27; example: `SSE_P_P088` / `SSE_P_P088_D`.

## SSE_F1 - worst suspect edges

Ranked key pairs (distinct plan-line crossings; straight-line length in page points):

1. `SSE_F1_1134_D` - `SSE_F1_XW13_22` (6; 353 pt)
2. `SSE_F1_1113_D` - `SSE_F1_XW13_15` (6; 288 pt)
3. `SSE_F1_1116_D` - `SSE_F1_XW13_11` (5; 279 pt)
4. `SSE_F1_1115_D` - `SSE_F1_XW13_11` (5; 257 pt)
5. `SSE_F1_1106_D` - `SSE_F1_XW13_24` (5; 252 pt)
6. `SSE_F1_1120_D` - `SSE_F1_XW13_12` (5; 180 pt)
7. `SSE_F1_1226_D` - `SSE_F1_XW13_14` (4; 399 pt)
8. `SSE_F1_1108_D` - `SSE_F1_XW13_23` (4; 308 pt)
9. `SSE_F1_1135_D` - `SSE_F1_XW13_22` (4; 276 pt)
10. `SSE_F1_1104_D` - `SSE_F1_XW13_24` (4; 201 pt)
11. `SSE_F1_1059_D` - `SSE_F1_W_1014` (4; 114 pt)
12. `SSE_F1_1225_D` - `SSE_F1_XW13_15` (3; 383 pt)
13. `SSE_F1_1109_D` - `SSE_F1_XW13_21` (3; 302 pt)
14. `SSE_F1_1117_D` - `SSE_F1_XW13_08` (3; 237 pt)
15. `SSE_F1_1107_D` - `SSE_F1_XW13_20` (3; 233 pt)
16. `SSE_F1_1147_D` - `SSE_F1_XW13_07` (3; 198 pt)
17. `SSE_F1_W_ST09` - `SSE_F1_W_SE_Rest_Upper` (3; 160 pt)
18. `SSE_F1_1123_D` - `SSE_F1_XW13_14` (3; 156 pt)
19. `SSE_F1_1102_D` - `SSE_F1_XW13_24` (3; 150 pt)
20. `SSE_F1_XW13_42` - `SSE_F1_W_ST09` (3; 139 pt)

Coincident-coordinate groups: 78; example: `SSE_F1_1194_D` / `SSE_F1_XW18_01`.

## SSE_F2 - worst suspect edges

Ranked key pairs (distinct plan-line crossings; straight-line length in page points):

1. `SSE_F2_2118_D` - `SSE_F2_XW27_23` (7; 364 pt)
2. `SSE_F2_2119_D` - `SSE_F2_XW27_21` (6; 348 pt)
3. `SSE_F2_2117_D` - `SSE_F2_XW27_21` (6; 279 pt)
4. `SSE_F2_2120_D` - `SSE_F2_XW27_20` (5; 331 pt)
5. `SSE_F2_2122_D` - `SSE_F2_XW27_15` (5; 321 pt)
6. `SSE_F2_2115_D` - `SSE_F2_XW27_21` (5; 232 pt)
7. `SSE_F2_XW22_16` - `SSE_F2_W_SE_Rest_Upper` (5; 155 pt)
8. `SSE_F2_2124_D` - `SSE_F2_XW27_16` (4; 244 pt)
9. `SSE_F2_2157_D` - `SSE_F2_XW27_10` (4; 202 pt)
10. `SSE_F2_2143_D` - `SSE_F2_XW27_24` (4; 188 pt)
11. `SSE_F2_2144_D` - `SSE_F2_XW27_24` (3; 312 pt)
12. `SSE_F2_2123_D` - `SSE_F2_XW27_11` (3; 266 pt)
13. `SSE_F2_2125_D` - `SSE_F2_XW27_12` (3; 239 pt)
14. `SSE_F2_2111_D` - `SSE_F2_XW27_24` (3; 193 pt)
15. `SSE_F2_W_Southeast_Court` - `SSE_F2_W_ST09` (3; 171 pt)
16. `SSE_F2_W_ST09` - `SSE_F2_W_SE_Rest_Upper` (3; 160 pt)
17. `SSE_F2_XW25_01` - `SSE_F2_W_2102` (3; 154 pt)
18. `SSE_F2_XW19_01` - `SSE_F2_W_OR218_M` (3; 145 pt)
19. `SSE_F2_XW26_01` - `SSE_F2_W_2093` (3; 145 pt)
20. `SSE_F2_2109A_D` - `SSE_F2_XW22_02` (3; 131 pt)

Coincident-coordinate groups: 74; example: `SSE_F2_2196` / `SSE_F2_2196_D` / `SSE_F2_XW32_01`.

## ADMIN_G - worst suspect edges

Ranked key pairs (distinct plan-line crossings; straight-line length in page points):

1. `ADMIN_G_ST04` - `ADMIN_G_LOBBY_S2` (9; 471 pt)
2. `ADMIN_G_XOFFICE16` - `ADMIN_G_MAIN_LOBBY` (8; 604 pt)
3. `ADMIN_G_XEXECUTIVE01` - `ADMIN_G_LOBBY_S4` (6; 620 pt)
4. `ADMIN_G_CORR_1` - `ADMIN_G_ST04` (6; 258 pt)
5. `ADMIN_G_XOFFICE06` - `ADMIN_G_EN_NE` (5; 806 pt)
6. `ADMIN_G_XOFFICE29` - `ADMIN_G_LOBBY_S2` (5; 672 pt)
7. `ADMIN_G_ENT_LOBBY` - `ADMIN_G_COFFEE` (5; 502 pt)
8. `ADMIN_G_LOBBY_NW` - `ADMIN_G_ST02` (5; 378 pt)
9. `ADMIN_G_XBUYER03` - `ADMIN_G_LOBBY_SW` (4; 610 pt)
10. `ADMIN_G_LOBBY_S2` - `ADMIN_G_ST_W` (4; 478 pt)
11. `ADMIN_G_XBUYER04` - `ADMIN_G_LOBBY_S4` (4; 434 pt)
12. `ADMIN_G_XLEAD01` - `ADMIN_G_LOBBY_S4` (4; 332 pt)
13. `ADMIN_G_XSENIOR05` - `ADMIN_G_ENT_LOBBY` (4; 285 pt)
14. `ADMIN_G_XSENIOR04` - `ADMIN_G_ENT_LOBBY` (4; 243 pt)
15. `ADMIN_G_ENT_LOBBY` - `ADMIN_G_ST01` (4; 221 pt)
16. `ADMIN_G_LOBBY_S4` - `ADMIN_G_ST06` (4; 200 pt)
17. `ADMIN_G_XMEETING01` - `ADMIN_G_ST_W` (3; 769 pt)
18. `ADMIN_G_XASSISTANT01` - `ADMIN_G_ST03` (3; 661 pt)
19. `ADMIN_G_XN01` - `ADMIN_G_LOBBY_S2` (3; 654 pt)
20. `ADMIN_G_XSENIOR02` - `ADMIN_G_ST03` (3; 512 pt)

## ADMIN_P - worst suspect edges

Ranked key pairs (distinct plan-line crossings; straight-line length in page points):

1. `ADMIN_P_XOFFICE17` - `ADMIN_P_CORR_2` (7; 393 pt)
2. `ADMIN_P_XOFFICE28` - `ADMIN_P_EN_S` (6; 630 pt)
3. `ADMIN_P_XOFFICE29` - `ADMIN_P_EN_S` (6; 520 pt)
4. `ADMIN_P_EN_S` - `ADMIN_P_LOBBY_SW2` (6; 295 pt)
5. `ADMIN_P_XOFFICE30` - `ADMIN_P_ST03` (5; 719 pt)
6. `ADMIN_P_XOFFICE27` - `ADMIN_P_ST03` (5; 718 pt)
7. `ADMIN_P_LOBBY_E` - `ADMIN_P_WC_E2` (5; 200 pt)
8. `ADMIN_P_XOFFICE08` - `ADMIN_P_EN_VIP` (4; 573 pt)
9. `ADMIN_P_XFILING05` - `ADMIN_P_CORR_4` (4; 534 pt)
10. `ADMIN_P_XOFFICE14` - `ADMIN_P_LOBBY_C` (4; 525 pt)
11. `ADMIN_P_XROOM05` - `ADMIN_P_ST03` (4; 520 pt)
12. `ADMIN_P_XOFFICE19` - `ADMIN_P_LOBBY_S5` (4; 475 pt)
13. `ADMIN_P_XOFFICE03` - `ADMIN_P_CORR_W` (4; 398 pt)
14. `ADMIN_P_LOBBY_C` - `ADMIN_P_CORR_1` (4; 360 pt)
15. `ADMIN_P_XOFFICE16` - `ADMIN_P_CORR_2` (4; 329 pt)
16. `ADMIN_P_XFILE03` - `ADMIN_P_EN_S` (4; 295 pt)
17. `ADMIN_P_CORR_2` - `ADMIN_P_MEETING_E` (4; 226 pt)
18. `ADMIN_P_LOBBY_SW1` - `ADMIN_P_ST03` (4; 190 pt)
19. `ADMIN_P_CORR_1` - `ADMIN_P_ST04` (4; 186 pt)
20. `ADMIN_P_XOFFICE22` - `ADMIN_P_CORR_S` (4; 185 pt)

## ADMIN_F1 - worst suspect edges

Ranked key pairs (distinct plan-line crossings; straight-line length in page points):

1. `ADMIN_F1_CORR_5` - `ADMIN_F1_LOBBY_SW` (9; 333 pt)
2. `ADMIN_F1_LOBBY_S` - `ADMIN_F1_ST03` (9; 247 pt)
3. `ADMIN_F1_XOFFICE09` - `ADMIN_F1_CORR_3` (7; 829 pt)
4. `ADMIN_F1_XOFFICE10` - `ADMIN_F1_CORR_3` (7; 794 pt)
5. `ADMIN_F1_XOFFICE11` - `ADMIN_F1_ST03` (7; 585 pt)
6. `ADMIN_F1_XOFFICE12` - `ADMIN_F1_BRIDGE` (6; 944 pt)
7. `ADMIN_F1_XOFFICE23` - `ADMIN_F1_CORR_5` (6; 556 pt)
8. `ADMIN_F1_XSENIOR01` - `ADMIN_F1_LOBBY_S` (6; 470 pt)
9. `ADMIN_F1_XSTAFF01` - `ADMIN_F1_ST01` (6; 393 pt)
10. `ADMIN_F1_XOFFICE17` - `ADMIN_F1_LOBBY_SW` (6; 389 pt)
11. `ADMIN_F1_XOFFICE19` - `ADMIN_F1_LOBBY_SW` (6; 349 pt)
12. `ADMIN_F1_XOFFICE21` - `ADMIN_F1_CORR_4` (5; 484 pt)
13. `ADMIN_F1_LOBBY_C` - `ADMIN_F1_CORR_2` (5; 481 pt)
14. `ADMIN_F1_ST04` - `ADMIN_F1_CORR_3` (5; 367 pt)
15. `ADMIN_F1_XOFFICE20` - `ADMIN_F1_ET_B` (5; 281 pt)
16. `ADMIN_F1_XOFFICE27` - `ADMIN_F1_CORR_5` (4; 563 pt)
17. `ADMIN_F1_XOFFICE29` - `ADMIN_F1_LOBBY_S` (4; 473 pt)
18. `ADMIN_F1_XPRESIDENT01` - `ADMIN_F1_ST05` (4; 400 pt)
19. `ADMIN_F1_XSENIOR02` - `ADMIN_F1_CORR_5` (4; 399 pt)
20. `ADMIN_F1_XKITCH01` - `ADMIN_F1_CORR_4` (4; 388 pt)

## ADMIN_F2 - worst suspect edges

Ranked key pairs (distinct plan-line crossings; straight-line length in page points):

1. `ADMIN_F2_HALL_NW` - `ADMIN_F2_ST02` (6; 496 pt)
2. `ADMIN_F2_LOBBY_S` - `ADMIN_F2_ST03` (6; 271 pt)
3. `ADMIN_F2_CORR_1` - `ADMIN_F2_CORR_2` (5; 502 pt)
4. `ADMIN_F2_CORR_1` - `ADMIN_F2_ST04` (5; 199 pt)
5. `ADMIN_F2_CORR_S` - `ADMIN_F2_ET_B` (4; 247 pt)
6. `ADMIN_F2_LOBBY_C` - `ADMIN_F2_CORR_1` (3; 393 pt)
7. `ADMIN_F2_CORR_2` - `ADMIN_F2_CONF` (3; 328 pt)
8. `ADMIN_F2_ST02` - `ADMIN_F2_LOBBY_ADM` (2; 302 pt)
9. `ADMIN_F2_ST03` - `ADMIN_F2_CORR_S` (2; 252 pt)
10. `ADMIN_F2_CONF` - `ADMIN_F2_LOBBY_S` (2; 212 pt)
11. `ADMIN_F2_LOBBY_C` - `ADMIN_F2_ET_A` (2; 83 pt)
12. `ADMIN_F2_LOBBY_ADM` - `ADMIN_F2_LOBBY_C` (1; 208 pt)

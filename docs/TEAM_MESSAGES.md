# Messages to send to the team (Member 1)

## To Omar (Application, main, Makefile, README, DESIGN.md)
1. `src/main.cpp`: set `GRAPH_CAPACITY` to `10000` (the full campus has more than 5000 locations).
2. The data files are **space separated**, not `|`. Update the README format examples:
   - `ID Key Label Type Building FloorIndex FloorName MapID X Y`
   - `FromID ToID Weight EdgeType Accessible`
   - no field may contain a space (labels use `_`, e.g. `Room_101`).
3. Edge weights must be **positive** (`addEdge` rejects 0). DESIGN.md says "non-negative"; please say "positive".
4. Makefile: add `-Wpedantic` to `CXXFLAGS`. On Windows/MSYS2, programs that use `<iostream>` need `-static-libstdc++ -static-libgcc` to link.
5. Run commands:
   - small demo (SSE west wing): `./build/campus_app`
   - whole university: `./build/campus_app data/campus/all_locations.txt data/campus/all_edges.txt`
6. `Graph.h` changed: it is an adjacency list again with `LocationInfo`, `Edge {to, length, type, accessible, next}`, `getNeighbors`, `getVertexInfo`, `isValidVertex`, `hasEdge`, `getWeight`. Everything your code already calls still exists.

## To everyone
- `getNeighbors(u)` returns the **newest edge first** (new edges are added at the front of the list). BFS/DFS tests must expect that order.
- `addVertex` returns -1 for a duplicate key, an empty key or a full graph.
- Vertex id = order in the file (0, 1, 2, ...). Search keys are unique (`SSE_F1_1214`); labels can repeat.

## To Members 3 and 4
- Hand-checked test graph: `data/test/tiny_locations.txt`, `data/test/tiny_edges.txt`, answers in `data/test/ANSWERS.md` (distances from vertex 0: 0, 3, 2, 8, 10, 14; MST weight 16).
- Disconnected graph: `data/test/disc_*.txt`.
- Accessible routing: skip edges where `accessible` is false (all STAIRS edges).

## Design document paragraph (Graph and data), paste into docs/DESIGN.md

**Graph representation.** The campus is stored as a weighted undirected graph in an adjacency list: an array of `LocationInfo` records (key, label, type, building, floor, map coordinates) and, for each vertex, a singly linked list of `Edge` nodes (`to`, `length`, `type`, `accessible`). Each undirected edge is stored in both lists and counted once. A campus graph is sparse (a room or corridor point has about two or three neighbours), so a list needs O(V + E) memory where an adjacency matrix would need O(V^2): for about 5000 locations that is roughly 11 000 edge nodes instead of 25 million cells. Neighbour iteration costs O(degree), which is what BFS, DFS, Dijkstra, Prim and Kruskal need; checking one edge costs O(degree) instead of O(1), which none of them needs. Edge lengths must be positive. The graph never prints or reads input; the loader (`CampusData`) is the only code that reads files, and it stops at the first malformed line and reports the file, line and reason.

**Data.** Locations and paths come from the AUC floor plans (SSE, HUSS, PVA, Core, Administration, Library, Campus Center, Jameel, Sports, Residences, Physical Plant) and the campus site plan. Room names are text in the PDFs; room numbers are vector drawings and were read visually from zoomed crops. Weights are walking distances in PDF points at 1:200 scale (1 unit about 7.06 cm), measured from the drawings, so they are estimates, not surveyed distances. Stairs edges are not accessible; elevators and ramps are, except freight elevators, which are marked accessible but need checking on site. A merge tool joins the per-building files into one graph; the full campus loads in a few milliseconds.

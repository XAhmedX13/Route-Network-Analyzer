# AUC Route Network Analyzer

## Project Description

The AUC Route Network Analyzer is a C++ application designed to represent and analyze the network of buildings and walking paths across the AUC campus.

The application represents buildings and important locations as vertices in a weighted, undirected graph, with edges representing the paths connecting them.

The project uses graph algorithms such as BFS, DFS, Dijkstra's shortest-path algorithm, and Minimum Spanning Tree algorithms to explore the network, find shortest routes, and analyze connectivity.

## Team Members

| Name | Student ID |
|---|---|
| Ahmed Mostafa | 900248352 |
| Moaz Youssef | 900241972 |
| Ammar Taha | 900248491 |
| Ahmed Kamel | 900244173 |
| Omar Ali | 900252715 |

## Features

- List every searchable location, or show one location's details and connections
- Shortest route between two locations (Dijkstra)
- Accessible route that skips stairs and any path marked inaccessible
- Nearest amenity (restroom, elevator, cafe, ...) from where you are
- BFS / DFS exploration from any location
- Network statistics: connected components, isolated locations, most connected locations
- Minimum spanning tree with Prim and with Kruskal

## Building and Running

Requirements: `g++` with C++11 and `make`. On Windows, use Git Bash or WSL.

Run every command from the repository root (the folder with this README):

```bash
make app          # build the program -> build/campus_app
make run          # build and start it
make test         # build and run all tests
make clean        # delete the build folder
```

Start it directly with `./build/campus_app`. To load a different dataset:

```bash
./build/campus_app path/to/locations.txt path/to/edges.txt
```

## Using the Program

```
===== AUC ROUTE NETWORK ANALYZER =====
1. List locations        2. Location details
3. Shortest route        4. Accessible route (no stairs)
5. Nearest amenity       6. BFS / DFS exploration
7. Network statistics    8. Prim MST
9. Kruskal MST           0. Exit
```

Locations are chosen by their **search key** (for example `SSE_First_Room_101`). Option 1 lists every key. Keys are case-sensitive.

Example: shortest route

```
Enter choice: 3
From (location key): SSE_Plaza_Entrance_A
To (location key): SSE_First_Room_101
Route (5 stops, total cost 36):
  1. Entrance A  [SSE, Plaza]
  2. Hallway 1  [SSE, Plaza]
  3. Lift A Plaza  [SSE, Plaza]
       take the elevator from Plaza to First
  4. Lift A First  [SSE, First]
  5. Room 101  [SSE, First]
```

## Input Format

Both files are in `data/`, use `|` between fields, and start with a header line.

`data/locations.txt`: one location per line, IDs 0, 1, 2, ... in order:

```
ID|Key|Label|Type|Building|FloorIndex|FloorName|MapID|X|Y
0|SSE_Plaza_Entrance_A|Entrance A|ENTRANCE|SSE|0|Plaza|SSE_PLZ|100|200
```

- **Key**: unique, no spaces or `|`; this is what users type to search
- **Label**: the name shown to users; use `x` for an unnamed waypoint (kept for routing, hidden from lists and search)
- **Type**: ENTRANCE, HALLWAY, ROOM, CLASSROOM, RESTROOM, ELEVATOR, STAIRS, OUTDOOR, BUILDING, CAFE, RESTAURANT, VENDOR, OTHER

`data/edges.txt`: one undirected connection per line, listed once:

```
FromID|ToID|Weight|EdgeType|Accessible
0|1|12|CORRIDOR|1
```

- **Weight**: non-negative integer in estimated cost units (not verified meters)
- **EdgeType**: WALKWAY, CORRIDOR, STAIRS, ELEVATOR, RAMP, OTHER
- **Accessible**: 1 or 0; stairs are always 0

## Project Structure

```
include/   headers          src/    implementations + main.cpp
tests/     one test per module      data/   locations.txt, edges.txt
docs/      DESIGN.md (architecture, algorithms, complexity)
```

## Limitations

- The dataset is a small sample centered on the SSE building; weights are estimates.
- Search needs the exact key (case-sensitive). There are no suggestions for misspelled names.
- Accessibility flags must be verified on site before the route can be relied on.
- The BST is not self-balancing, so a key file sorted alphabetically makes searches O(n).

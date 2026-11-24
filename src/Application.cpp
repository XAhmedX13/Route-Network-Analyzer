// Application.cpp
// Member 5 (Omar Ali) - menu, input handling and output of the
// AUC Route Network Analyzer. See Application.h for how the modules connect.
//
// Every option follows the same pattern:
//   1. read the location key(s) the user types
//   2. BST: key -> vertex ID
//   3. call a teammate's algorithm with the IDs
//   4. print the result using the Graph's location information
//
// Time complexity of this module (V = locations, E = paths):
//   buildLocationIndex: O(V * h), h = BST height (O(V log V) on average)
//   key lookup: O(h)
//   displayLocations: O(V); displayLocationInfo: O(degree)
//   displayRoute: O(pathLength * degree) to look up each edge's type
// The algorithm costs belong to the modules that implement them.

#include "Application.h"
#include "Traversal.h"
#include "NetworkAnalysis.h"
#include "ShortestPath.h"
#include "Prim.h"
#include "Kruskal.h"

using namespace std;

// ---------------------------------------------------------------------------
// Small helpers (only used inside this file)
// ---------------------------------------------------------------------------

// Removes spaces, tabs and Windows '\r' from both ends of a line.
static string trim(const string& s) {
    size_t start = 0, end = s.size();
    while (start < end && (s[start] == ' ' || s[start] == '\t' || s[start] == '\r')) start++;
    while (end > start && (s[end - 1] == ' ' || s[end - 1] == '\t' || s[end - 1] == '\r')) end--;
    return s.substr(start, end - start);
}

// Prints a prompt and reads one whole line. Returns false at end of input.
static bool readLine(istream& in, ostream& out, const string& prompt, string& line) {
    out << prompt;
    if (!getline(in, line)) return false;
    line = trim(line);
    return true;
}

// Converts a line like "7" into an int. Rejects "", "7a", "-", "99999999999".
static bool parseInt(const string& text, int& value) {
    if (text.empty() || text.size() > 9) return false;
    value = 0;
    for (size_t i = 0; i < text.size(); i++) {
        if (text[i] < '0' || text[i] > '9') return false;
        value = value * 10 + (text[i] - '0');
    }
    return true;
}

// Asks for a location key and returns its vertex ID using the BST, or -1
// (after printing why) if the input is empty or the key does not exist.
static int askForLocation(const BST& tree, istream& in, ostream& out, const string& prompt) {
    string key;
    if (!readLine(in, out, prompt, key)) return -1;
    if (key.empty()) {
        out << "No location entered.\n";
        return -1;
    }
    int id = findLocationID(tree, key);
    if (id == -1)
        out << "Location \"" << key << "\" was not found. Use option 1 to see all search keys.\n";
    return id;
}

// Short name for printing a location: its label, or "waypoint" for unnamed points.
static string displayName(const Graph& graph, int id) {
    const LocationInfo* info = graph.getVertexInfo(id);
    if (info == nullptr) return "(invalid location)";
    if (isWaypoint(*info)) return "waypoint #" + to_string(id);
    return info->label;
}

// Finds the edge between two neighbouring vertices, or nullptr.
static const Edge* findEdge(const Graph& graph, int fromID, int toID) {
    for (const Edge* e = graph.getNeighbors(fromID); e != nullptr; e = e->next)
        if (e->to == toID) return e;
    return nullptr;
}

static void printMST(const Graph& graph, const string& name, bool ok,
                     const MSTEdge* edges, int edgeCount, int totalWeight, ostream& out) {
    if (!ok) {
        out << name << ": the network is disconnected, so no spanning tree connects every location.\n";
        return;
    }
    out << name << " minimum spanning tree (" << edgeCount << " connections):\n";
    for (int i = 0; i < edgeCount; i++)
        out << "  " << displayName(graph, edges[i].fromID) << " -- "
            << displayName(graph, edges[i].toID) << "  (" << edges[i].weight << ")\n";
    out << "Total weight: " << totalWeight << " cost units\n";
}

// ---------------------------------------------------------------------------
// Search (BST integration)
// ---------------------------------------------------------------------------

bool isWaypoint(const LocationInfo& info) {
    return info.label.empty() || info.label == "x";
}

bool buildLocationIndex(const Graph& graph, BST& tree) {
    bool allInserted = true;
    for (int id = 0; id < graph.getNumVertices(); id++) {
        const LocationInfo* info = graph.getVertexInfo(id);
        if (info == nullptr || isWaypoint(*info)) continue;   // not searchable
        if (!tree.insert(info->key, id)) {                   // empty or duplicate key
            cout << "Warning: location " << id << " could not be added to the search index.\n";
            allInserted = false;
        }
    }
    return allInserted;
}

int findLocationID(const BST& tree, const string& key) {
    return tree.search(key);
}

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

string locationTypeName(LocationType type) {
    switch (type) {
        case LocationType::ENTRANCE:   return "Entrance";
        case LocationType::HALLWAY:    return "Hallway";
        case LocationType::ROOM:       return "Room";
        case LocationType::CLASSROOM:  return "Classroom";
        case LocationType::RESTROOM:   return "Restroom";
        case LocationType::ELEVATOR:   return "Elevator";
        case LocationType::STAIRS:     return "Stairs";
        case LocationType::OUTDOOR:    return "Outdoor";
        case LocationType::BUILDING:   return "Building";
        case LocationType::CAFE:       return "Cafe";
        case LocationType::RESTAURANT: return "Restaurant";
        case LocationType::VENDOR:     return "Vendor";
        default:                       return "Other";
    }
}

string edgeTypeName(EdgeType type) {
    switch (type) {
        case EdgeType::WALKWAY:  return "walkway";
        case EdgeType::CORRIDOR: return "corridor";
        case EdgeType::STAIRS:   return "stairs";
        case EdgeType::ELEVATOR: return "elevator";
        case EdgeType::RAMP:     return "ramp";
        default:                 return "path";
    }
}

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

void displayMenu(ostream& out) {
    out << "\n===== AUC ROUTE NETWORK ANALYZER =====\n"
        << "1. List locations        2. Location details\n"
        << "3. Shortest route        4. Accessible route (no stairs)\n"
        << "5. Nearest amenity       6. BFS / DFS exploration\n"
        << "7. Network statistics    8. Prim MST\n"
        << "9. Kruskal MST           0. Exit\n";
}

void runApplication(const Graph& graph, const BST& tree, istream& in, ostream& out) {
    out << "Loaded " << graph.getNumVertices() << " locations and "
        << graph.getNumEdges() << " connections.\n";
    while (true) {
        displayMenu(out);
        string line;
        if (!readLine(in, out, "Enter choice: ", line)) {   // input ended (Ctrl+D / end of file)
            out << "\nGoodbye!\n";
            return;
        }
        int choice;
        if (!parseInt(line, choice)) {
            out << "Invalid choice. Please enter a number from 0 to 9.\n";
            continue;
        }
        if (choice == 0) {
            out << "Goodbye!\n";
            return;
        }
        if (!handleMenuChoice(choice, graph, tree, in, out))
            out << "Invalid choice. Please enter a number from 0 to 9.\n";
    }
}

// --- Handlers for each option ---

static void handleDetails(const Graph& graph, const BST& tree, istream& in, ostream& out) {
    int id = askForLocation(tree, in, out, "Location key: ");
    if (id != -1) displayLocationInfo(graph, id, out);
}

static void handleRoute(const Graph& graph, const BST& tree, istream& in, ostream& out,
                        bool accessibleOnly) {
    int from = askForLocation(tree, in, out, "From (location key): ");
    if (from == -1) return;
    int to = askForLocation(tree, in, out, "To (location key): ");
    if (to == -1) return;

    int* path = new int[graph.getNumVertices()];   // caller provides a V-element buffer
    int pathLength = 0, totalDistance = 0;
    bool found = findShortestPath(graph, from, to, path, pathLength, totalDistance, accessibleOnly);

    if (found) {
        displayRoute(graph, path, pathLength, totalDistance, out);
    } else if (accessibleOnly) {
        out << "No accessible route from " << displayName(graph, from) << " to "
            << displayName(graph, to) << ". Every route needs stairs or an inaccessible path.\n";
    } else {
        out << "No route from " << displayName(graph, from) << " to "
            << displayName(graph, to) << ". They are not connected.\n";
    }
    delete[] path;
}

static void handleNearest(const Graph& graph, const BST& tree, istream& in, ostream& out) {
    int from = askForLocation(tree, in, out, "Your location (key): ");
    if (from == -1) return;

    // Amenity categories the user can choose from
    const LocationType options[] = { LocationType::RESTROOM, LocationType::ELEVATOR,
                                     LocationType::CAFE, LocationType::RESTAURANT,
                                     LocationType::VENDOR, LocationType::STAIRS,
                                     LocationType::ENTRANCE, LocationType::CLASSROOM };
    const int numOptions = 8;
    out << "Amenity type:\n";
    for (int i = 0; i < numOptions; i++)
        out << "  " << (i + 1) << ". " << locationTypeName(options[i]) << "\n";

    string line;
    int pick;
    if (!readLine(in, out, "Choose 1-8: ", line)) return;
    if (!parseInt(line, pick) || pick < 1 || pick > numOptions) {
        out << "Invalid amenity choice.\n";
        return;
    }
    if (!readLine(in, out, "Accessible route only? (y/n): ", line)) return;
    bool accessibleOnly = (line == "y" || line == "Y");

    LocationType target = options[pick - 1];
    int* path = new int[graph.getNumVertices()];
    int targetID = -1, pathLength = 0, totalDistance = 0;
    if (findNearestLocation(graph, from, target, targetID, path, pathLength, totalDistance, accessibleOnly)) {
        out << "Nearest " << locationTypeName(target) << ": " << displayName(graph, targetID) << "\n";
        displayRoute(graph, path, pathLength, totalDistance, out);
    } else {
        out << "No reachable " << locationTypeName(target) << " found"
            << (accessibleOnly ? " using accessible paths" : "") << ".\n";
    }
    delete[] path;
}

static void handleTraversal(const Graph& graph, const BST& tree, istream& in, ostream& out) {
    int start = askForLocation(tree, in, out, "Start location (key): ");
    if (start == -1) return;

    string line;
    if (!readLine(in, out, "B for BFS or D for DFS: ", line)) return;
    bool bfs = (line == "B" || line == "b");
    bool dfs = (line == "D" || line == "d");
    if (!bfs && !dfs) {
        out << "Invalid choice. Enter B or D.\n";
        return;
    }

    int* order = new int[graph.getNumVertices()];
    int count = 0;
    if (bfs) BFS(graph, start, order, count);
    else     DFS(graph, start, order, count);

    out << (bfs ? "BFS" : "DFS") << " order from " << displayName(graph, start) << ":\n";
    for (int i = 0; i < count; i++)
        out << "  " << (i + 1) << ". " << displayName(graph, order[i]) << "\n";
    out << "Reached " << count << " of " << graph.getNumVertices() << " locations.\n";
    delete[] order;
}

static void handlePrim(const Graph& graph, ostream& out) {
    int V = graph.getNumVertices();
    MSTEdge* edges = new MSTEdge[V];          // an MST has V-1 edges
    int edgeCount = 0, totalWeight = 0;
    bool ok = primMST(graph, 0, edges, edgeCount, totalWeight);   // start from location 0
    printMST(graph, "Prim", ok, edges, edgeCount, totalWeight, out);
    delete[] edges;
}

static void handleKruskal(const Graph& graph, ostream& out) {
    int V = graph.getNumVertices();
    MSTEdge* edges = new MSTEdge[V];
    int edgeCount = 0, totalWeight = 0;
    bool ok = kruskalMST(graph, edges, edgeCount, totalWeight);
    printMST(graph, "Kruskal", ok, edges, edgeCount, totalWeight, out);
    delete[] edges;
}

bool handleMenuChoice(int choice, const Graph& graph, const BST& tree, istream& in, ostream& out) {
    if (choice < 1 || choice > 9) return false;
    if (graph.getNumVertices() == 0) {
        out << "No locations are loaded.\n";
        return true;
    }
    switch (choice) {
        case 1: displayLocations(graph, out);                      break;
        case 2: handleDetails(graph, tree, in, out);               break;
        case 3: handleRoute(graph, tree, in, out, false);          break;
        case 4: handleRoute(graph, tree, in, out, true);           break;
        case 5: handleNearest(graph, tree, in, out);               break;
        case 6: handleTraversal(graph, tree, in, out);             break;
        case 7: displayNetworkStatistics(graph, out);              break;
        case 8: handlePrim(graph, out);                            break;
        case 9: handleKruskal(graph, out);                         break;
    }
    return true;
}

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------

void displayLocations(const Graph& graph, ostream& out) {
    int shown = 0, waypoints = 0;
    out << "Search key | Label | Building | Floor | Type\n";
    for (int id = 0; id < graph.getNumVertices(); id++) {
        const LocationInfo* info = graph.getVertexInfo(id);
        if (info == nullptr) continue;
        if (isWaypoint(*info)) { waypoints++; continue; }
        out << "  " << info->key << " | " << info->label << " | " << info->building
            << " | " << info->floorName << " | " << locationTypeName(info->type) << "\n";
        shown++;
    }
    out << shown << " searchable locations";
    if (waypoints > 0) out << " (" << waypoints << " unnamed waypoints hidden)";
    out << ".\n";
}

void displayLocationInfo(const Graph& graph, int vertexID, ostream& out) {
    const LocationInfo* info = graph.getVertexInfo(vertexID);
    if (info == nullptr) {
        out << "Invalid location.\n";
        return;
    }
    out << "Name:     " << info->label << "\n"
        << "Key:      " << info->key << "\n"
        << "Type:     " << locationTypeName(info->type) << "\n"
        << "Building: " << info->building << "\n"
        << "Floor:    " << info->floorName << "\n"
        << "ID:       " << vertexID << "\n"
        << "Connections:\n";
    int count = 0;
    for (const Edge* e = graph.getNeighbors(vertexID); e != nullptr; e = e->next) {
        out << "  -> " << displayName(graph, e->to) << "  (" << e->length << ", "
            << edgeTypeName(e->type) << (e->accessible ? "" : ", not accessible") << ")\n";
        count++;
    }
    if (count == 0) out << "  (none - this location is isolated)\n";
}

void displayRoute(const Graph& graph, const int* path, int pathLength, int totalDistance, ostream& out) {
    if (path == nullptr || pathLength <= 0) {
        out << "No route to display.\n";
        return;
    }
    out << "Route (" << pathLength << " stops, total cost " << totalDistance << "):\n";
    for (int i = 0; i < pathLength; i++) {
        const LocationInfo* info = graph.getVertexInfo(path[i]);
        out << "  " << (i + 1) << ". " << displayName(graph, path[i]);
        if (info != nullptr) out << "  [" << info->building << ", " << info->floorName << "]";
        out << "\n";

        if (i + 1 < pathLength) {
            const Edge* e = findEdge(graph, path[i], path[i + 1]);
            const LocationInfo* next = graph.getVertexInfo(path[i + 1]);
            if (e != nullptr && info != nullptr && next != nullptr && info->floorIndex != next->floorIndex)
                out << "       take the " << edgeTypeName(e->type) << " from "
                    << info->floorName << " to " << next->floorName << "\n";
        }
    }
}

void displayNetworkStatistics(const Graph& graph, ostream& out) {
    int V = graph.getNumVertices();
    out << "Locations:   " << V << "\n"
        << "Connections: " << graph.getNumEdges() << "\n";

    int components = countConnectedComponents(graph);
    out << "Connected components: " << components
        << (isCampusConnected(graph) ? " (every location is reachable)" : " (some locations are cut off)") << "\n";

    int* ids = new int[V];
    int isolated = findIsolatedLocations(graph, ids, V);
    out << "Isolated locations: " << isolated << "\n";
    for (int i = 0; i < isolated; i++) out << "  " << displayName(graph, ids[i]) << "\n";

    int maxDegree = 0;
    int top = findMostConnectedLocations(graph, ids, V, maxDegree);
    out << "Most connected (" << maxDegree << " direct connections):\n";
    for (int i = 0; i < top; i++) out << "  " << displayName(graph, ids[i]) << "\n";
    delete[] ids;
}

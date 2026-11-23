// test_application.cpp
// Member 5 (Omar Ali) - integration tests for the Application module.
// The menu is driven with scripted input (istringstream) and the printed
// output is checked, so no typing is needed.
//
// Build and run:  make test   (or: make build/test_application && ./build/test_application)
//
// Test graph (2 floors). Weights are cost units. Stairs are NOT accessible.
//
//   Floor 0 (Plaza):  Entrance A --5-- x --3-- Stairs P --4 (stairs)--+
//                                      |                               |
//                                      6                               v
//                                  Lift P --10 (elevator)--+   Floor 1: Stairs F --2-- Room 101 --3-- Restroom F1
//                                                          +----------> Lift F ----2----^
//   Kiosk: isolated (no connections)
//
//   Shortest  Entrance -> Room 101 : Entrance, x, Stairs P, Stairs F, Room 101 = 14
//   Accessible Entrance -> Room 101: Entrance, x, Lift P, Lift F, Room 101    = 23
//   Nearest restroom from Entrance : Restroom F1, cost 17

#include <iostream>
#include <sstream>
#include <string>
#include "Graph.h"
#include "BST.h"
#include "Application.h"

using namespace std;

static int passed = 0;
static int failed = 0;

static void check(bool condition, const string& description) {
    if (condition) { passed++; cout << "[PASS] " << description << "\n"; }
    else           { failed++; cout << "[FAIL] " << description << "\n"; }
}

static bool contains(const string& text, const string& part) {
    return text.find(part) != string::npos;
}

static LocationInfo makeLocation(const string& key, const string& label, LocationType type,
                                 int floorIndex, const string& floorName) {
    LocationInfo info;
    info.key = key;
    info.label = label;
    info.type = type;
    info.building = "SSE";
    info.floorIndex = floorIndex;
    info.floorName = floorName;
    info.mapID = (floorIndex == 0 ? "SSE_PLZ" : "SSE_F1");
    info.x = 0;
    info.y = 0;
    return info;
}

// Builds the test graph described at the top of the file.
static void buildTestGraph(Graph& g, bool withKiosk) {
    g.addVertex(makeLocation("SSE_Plaza_Entrance_A", "Entrance A", LocationType::ENTRANCE, 0, "Plaza")); // 0
    g.addVertex(makeLocation("SSE_Plaza_WP1", "x", LocationType::HALLWAY, 0, "Plaza"));                  // 1
    g.addVertex(makeLocation("SSE_Plaza_Stairs", "Stairs P", LocationType::STAIRS, 0, "Plaza"));         // 2
    g.addVertex(makeLocation("SSE_Plaza_Lift", "Lift P", LocationType::ELEVATOR, 0, "Plaza"));           // 3
    g.addVertex(makeLocation("SSE_First_Stairs", "Stairs F", LocationType::STAIRS, 1, "First"));         // 4
    g.addVertex(makeLocation("SSE_First_Lift", "Lift F", LocationType::ELEVATOR, 1, "First"));           // 5
    g.addVertex(makeLocation("SSE_First_Room_101", "Room 101", LocationType::CLASSROOM, 1, "First"));    // 6
    g.addVertex(makeLocation("SSE_First_Restroom", "Restroom F1", LocationType::RESTROOM, 1, "First"));  // 7
    if (withKiosk)
        g.addVertex(makeLocation("SSE_Plaza_Kiosk", "Kiosk", LocationType::VENDOR, 0, "Plaza"));         // 8

    g.addEdge(0, 1, 5, EdgeType::CORRIDOR, true);
    g.addEdge(1, 2, 3, EdgeType::CORRIDOR, true);
    g.addEdge(1, 3, 6, EdgeType::CORRIDOR, true);
    g.addEdge(2, 4, 4, EdgeType::STAIRS, false);
    g.addEdge(3, 5, 10, EdgeType::ELEVATOR, true);
    g.addEdge(4, 6, 2, EdgeType::CORRIDOR, true);
    g.addEdge(5, 6, 2, EdgeType::CORRIDOR, true);
    g.addEdge(6, 7, 3, EdgeType::CORRIDOR, true);
}

// Runs the whole menu with scripted input and returns everything it printed.
static string runScript(const Graph& g, const BST& tree, const string& script) {
    istringstream in(script);
    ostringstream out;
    runApplication(g, tree, in, out);
    return out.str();
}

static void testSearchIndex() {
    cout << "\n--- Search index (BST) ---\n";
    Graph g(20);
    buildTestGraph(g, true);
    BST tree;
    check(buildLocationIndex(g, tree), "index builds without errors");
    check(tree.size() == 8, "8 named locations indexed (waypoint skipped)");
    check(findLocationID(tree, "SSE_First_Room_101") == 6, "valid key returns its ID");
    check(findLocationID(tree, "SSE_Plaza_Entrance_A") == 0, "first location returns ID 0");
    check(findLocationID(tree, "SSE_Plaza_WP1") == -1, "unnamed waypoint is not searchable");
    check(findLocationID(tree, "Room 999") == -1, "unknown key returns -1");
    check(findLocationID(tree, "") == -1, "empty key returns -1");
    check(findLocationID(tree, "sse_first_room_101") == -1, "search is case-sensitive");

    Graph empty(5);
    BST emptyTree;
    check(buildLocationIndex(empty, emptyTree) && emptyTree.isEmpty(), "empty graph gives empty index");
}

static void testMenuInput() {
    cout << "\n--- Menu input ---\n";
    Graph g(20);
    buildTestGraph(g, true);
    BST tree;
    buildLocationIndex(g, tree);

    string out = runScript(g, tree, "0\n");
    check(contains(out, "Loaded 9 locations and 8 connections"), "startup prints counts");
    check(contains(out, "Goodbye"), "0 exits");

    out = runScript(g, tree, "42\nabc\n\n-1\n0\n");
    check(contains(out, "Invalid choice"), "invalid menu choices are rejected");
    check(contains(out, "Goodbye"), "menu keeps running after invalid input");

    out = runScript(g, tree, "");
    check(contains(out, "Goodbye"), "end of input exits cleanly");

    out = runScript(g, tree, "1\n0\n");
    check(contains(out, "SSE_First_Room_101 | Room 101 | SSE | First | Classroom"), "list shows key, label, building, floor, type");
    check(contains(out, "8 searchable locations (1 unnamed waypoints hidden)"), "list hides waypoints");

    out = runScript(g, tree, "2\nSSE_First_Room_101\n0\n");
    check(contains(out, "Name:     Room 101") && contains(out, "-> Restroom F1"), "details show info and connections");

    out = runScript(g, tree, "2\nSSE_Plaza_Kiosk\n0\n");
    check(contains(out, "isolated"), "details report an isolated location");

    out = runScript(g, tree, "2\nNowhere\n0\n");
    check(contains(out, "\"Nowhere\" was not found"), "unknown key gives a clear message");

    out = runScript(g, tree, "2\n\n0\n");
    check(contains(out, "No location entered"), "empty key gives a clear message");

    out = runScript(g, tree, "2\n  SSE_First_Room_101  \n0\n");
    check(contains(out, "Name:     Room 101"), "spaces around a key are ignored");
}

static void testRoutes() {
    cout << "\n--- Routes ---\n";
    Graph g(20);
    buildTestGraph(g, true);
    BST tree;
    buildLocationIndex(g, tree);

    string out = runScript(g, tree, "3\nSSE_Plaza_Entrance_A\nSSE_First_Room_101\n0\n");
    check(contains(out, "total cost 14"), "shortest route costs 14");
    check(contains(out, "Stairs P") && contains(out, "take the stairs from Plaza to First"), "shortest route uses the stairs");
    check(contains(out, "waypoint #1"), "unnamed waypoint is printed as a waypoint");

    out = runScript(g, tree, "4\nSSE_Plaza_Entrance_A\nSSE_First_Room_101\n0\n");
    check(contains(out, "total cost 23"), "accessible route costs 23");
    check(contains(out, "take the elevator") && !contains(out, "Stairs P"), "accessible route avoids the stairs");

    out = runScript(g, tree, "3\nSSE_First_Room_101\nSSE_First_Room_101\n0\n");
    check(contains(out, "1 stops, total cost 0"), "same start and destination costs 0");

    out = runScript(g, tree, "3\nSSE_Plaza_Entrance_A\nSSE_Plaza_Kiosk\n0\n");
    check(contains(out, "No route from Entrance A to Kiosk"), "unreachable destination is reported");

    out = runScript(g, tree, "3\nSSE_Plaza_Entrance_A\nNowhere\n0\n");
    check(contains(out, "not found") && !contains(out, "Route ("), "invalid destination stops the route");
}

static void testNearestAndTraversal() {
    cout << "\n--- Nearest amenity and traversal ---\n";
    Graph g(20);
    buildTestGraph(g, true);
    BST tree;
    buildLocationIndex(g, tree);

    string out = runScript(g, tree, "5\nSSE_Plaza_Entrance_A\n1\nn\n0\n");
    check(contains(out, "Nearest Restroom: Restroom F1") && contains(out, "total cost 17"), "nearest restroom found");

    out = runScript(g, tree, "5\nSSE_Plaza_Entrance_A\n3\nn\n0\n");
    check(contains(out, "No reachable Cafe found"), "missing amenity is reported");

    out = runScript(g, tree, "5\nSSE_Plaza_Entrance_A\n9\n0\n");
    check(contains(out, "Invalid amenity choice"), "invalid amenity number is rejected");

    out = runScript(g, tree, "6\nSSE_Plaza_Entrance_A\nB\n0\n");
    check(contains(out, "BFS order from Entrance A") && contains(out, "Reached 8 of 9"), "BFS reaches the 8 connected locations");

    out = runScript(g, tree, "6\nSSE_Plaza_Entrance_A\nd\n0\n");
    check(contains(out, "DFS order") && contains(out, "Reached 8 of 9"), "DFS reaches the 8 connected locations");

    out = runScript(g, tree, "6\nSSE_Plaza_Entrance_A\nX\n0\n");
    check(contains(out, "Enter B or D"), "invalid traversal type is rejected");
}

static void testStatisticsAndMST() {
    cout << "\n--- Statistics and MST ---\n";
    Graph g(20);
    buildTestGraph(g, true);
    BST tree;
    buildLocationIndex(g, tree);

    string out = runScript(g, tree, "7\n0\n");
    check(contains(out, "Connected components: 2"), "two components (kiosk is cut off)");
    check(contains(out, "Isolated locations: 1") && contains(out, "  Kiosk"), "kiosk is isolated");
    check(contains(out, "Most connected (3 direct connections)"), "highest degree is 3");

    out = runScript(g, tree, "8\n9\n0\n");
    check(contains(out, "Prim: the network is disconnected"), "Prim reports a disconnected graph");
    check(contains(out, "Kruskal: the network is disconnected"), "Kruskal reports a disconnected graph");

    Graph connected(20);
    buildTestGraph(connected, false);
    BST tree2;
    buildLocationIndex(connected, tree2);
    out = runScript(connected, tree2, "8\n9\n0\n");
    check(contains(out, "Prim minimum spanning tree (7 connections)"), "Prim uses V-1 = 7 connections");
    check(contains(out, "Kruskal minimum spanning tree (7 connections)"), "Kruskal uses V-1 = 7 connections");
    size_t first = out.find("Total weight: 25");
    check(first != string::npos && out.find("Total weight: 25", first + 1) != string::npos,
          "Prim and Kruskal both give total weight 25");
}

static void testEmptyGraph() {
    cout << "\n--- Empty graph ---\n";
    Graph g(5);
    BST tree;
    string out = runScript(g, tree, "3\n7\n0\n");
    check(contains(out, "No locations are loaded"), "options are refused safely on an empty graph");

    ostringstream route;
    displayRoute(g, nullptr, 0, 0, route);
    check(contains(route.str(), "No route to display"), "displayRoute handles an empty path");

    ostringstream info;
    displayLocationInfo(g, 3, info);
    check(contains(info.str(), "Invalid location"), "displayLocationInfo rejects an invalid ID");
}

int main() {
    testSearchIndex();
    testMenuInput();
    testRoutes();
    testNearestAndTraversal();
    testStatisticsAndMST();
    testEmptyGraph();

    cout << "\n==== " << passed << " passed, " << failed << " failed ====\n";
    return failed == 0 ? 0 : 1;
}

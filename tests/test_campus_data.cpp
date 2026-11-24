// test_campus_data.cpp (Ammar Taha)
// Tests for the CampusData loader: good files load with the right counts and
// values, and every kind of bad file is rejected.
// Run from the repository root so the data/ paths are found.
// Build: g++ -std=c++11 -Wall -Wextra -Wpedantic -Iinclude tests/test_campus_data.cpp src/CampusData.cpp src/Graph.cpp -o build/test_campus_data

#include "CampusData.h"
#include <iostream>
using namespace std;

static int passed = 0;
static int failed = 0;

// Small helper that records and prints the result of one check.
void check(bool condition, const string& description) {
    if (condition) {
        passed++;
        cout << "[PASS] " << description << "\n";
    } else {
        failed++;
        cout << "[FAIL] " << description << "\n";
    }
}

void testTinyGraph() {
    cout << "\n--- Tiny graph (data/test/tiny_*) ---\n";
    Graph g(20);
    check(loadCampusData("data/test/tiny_locations.txt", "data/test/tiny_edges.txt", g), "tiny files load");
    check(g.getNumVertices() == 6, "6 locations");
    check(g.getNumEdges() == 8, "8 edges");
    check(g.getWeight(1, 2) == 1 && g.getWeight(2, 1) == 1, "edge 1-2 has weight 1 both ways");
    check(g.findVertex("T_3") == 3, "key T_3 is vertex 3");
}

void testDisconnectedGraph() {
    cout << "\n--- Disconnected graph (data/test/disc_*) ---\n";
    Graph g(20);
    check(loadCampusData("data/test/disc_locations.txt", "data/test/disc_edges.txt", g), "disc files load");
    check(g.getNumVertices() == 7, "7 locations");
    check(g.getNeighbors(6) == nullptr, "vertex 6 has no edges");
}

void testDemoData() {
    cout << "\n--- SSE demo (data/locations.txt, data/edges.txt) ---\n";
    Graph g(100);
    check(loadCampusData("data/locations.txt", "data/edges.txt", g), "demo files load");
    check(g.getNumVertices() == 31, "31 locations");
    check(g.getNumEdges() == 34, "34 edges");

    int stairs = g.findVertex("SSE_P_ST03");
    const LocationInfo* info = g.getVertexInfo(stairs);
    check(info != nullptr && info->type == LocationType::STAIRS, "SSE_P_ST03 is STAIRS");
    check(info != nullptr && info->floorIndex == 0 && info->building == "SSE", "SSE_P_ST03 is on the Plaza of SSE");

    int upstairs = g.findVertex("SSE_F1_ST03");
    check(g.getEdgeType(stairs, upstairs) == EdgeType::STAIRS, "ST03 floors are joined by STAIRS");
    check(!g.isAccessible(stairs, upstairs), "stairs edge is not accessible");

    int lift = g.findVertex("SSE_P_ET03");
    int liftUp = g.findVertex("SSE_F1_ET03");
    check(g.getEdgeType(lift, liftUp) == EdgeType::ELEVATOR, "ET03 floors are joined by ELEVATOR");
    check(g.isAccessible(lift, liftUp), "elevator edge is accessible");

    int restroom = g.findVertex("SSE_F1_1198");
    check(restroom != -1 && g.getVertexInfo(restroom)->type == LocationType::RESTROOM, "1198 is a RESTROOM");
}

void testMissingFile() {
    cout << "\n--- Missing file ---\n";
    Graph g(20);
    check(!loadLocations("data/test/no_such_file.txt", g), "missing locations file returns false");
    check(!loadEdges("data/test/no_such_file.txt", g), "missing edges file returns false");
}

void testBadLocationFiles() {
    cout << "\n--- Bad location files ---\n";
    string names[] = {"bad_type", "bad_dupkey", "bad_gap", "bad_fields"};
    for (int i = 0; i < 4; i++) {
        Graph g(20);
        string file = "data/test/" + names[i] + "_locations.txt";
        check(!loadLocations(file, g), names[i] + " is rejected");
    }
}

void testBadEdgeFiles() {
    cout << "\n--- Bad edge files ---\n";
    string names[] = {"bad_weight", "bad_text_weight", "bad_endpoint", "bad_access"};
    for (int i = 0; i < 4; i++) {
        Graph g(20);
        loadLocations("data/test/tiny_locations.txt", g); // the bad edges need these vertices
        string file = "data/test/" + names[i] + "_edges.txt";
        check(!loadEdges(file, g), names[i] + " is rejected");
    }
}

void testGraphTooSmall() {
    cout << "\n--- Graph too small ---\n";
    Graph g(3);
    check(!loadLocations("data/test/tiny_locations.txt", g), "6 locations do not fit in capacity 3");
}

int main() {
    testTinyGraph();
    testDisconnectedGraph();
    testDemoData();
    testMissingFile();
    testBadLocationFiles();
    testBadEdgeFiles();
    testGraphTooSmall();

    cout << "\n==== " << passed << " passed, " << failed << " failed ====\n";
    return failed == 0 ? 0 : 1;
}

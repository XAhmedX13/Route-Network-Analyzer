// test_graph.cpp (Ammar Taha)
// Tests for the Graph class: adding vertices, adding edges, the checks that
// reject bad input, and reading the graph back (getNeighbors, getVertexInfo).
// Build: g++ -std=c++11 -Wall -Wextra -Wpedantic -Iinclude tests/test_graph.cpp src/Graph.cpp -o build/test_graph

#include "Graph.h"
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

// Builds a LocationInfo with only the fields the tests care about
LocationInfo makeLocation(const string& key, LocationType type, int floor) {
    LocationInfo info;
    info.key = key;
    info.label = key + "_label";
    info.type = type;
    info.building = "SSE";
    info.floorIndex = floor;
    info.floorName = (floor == 0) ? "Plaza" : "First";
    info.mapID = "TEST";
    info.x = 0;
    info.y = 0;
    return info;
}

// Counts the edges in one vertex's list by walking ->next
int countNeighbors(const Graph& g, int id) {
    int count = 0;
    for (const Edge* e = g.getNeighbors(id); e != nullptr; e = e->next) {
        count++;
    }
    return count;
}

void testEmptyGraph() {
    cout << "\n--- Empty graph ---\n";
    Graph g(5);
    check(g.getNumVertices() == 0, "new graph has 0 vertices");
    check(g.getNumEdges() == 0, "new graph has 0 edges");
    check(!g.isValidVertex(0), "id 0 is not valid yet");
    check(g.getNeighbors(0) == nullptr, "getNeighbors on empty graph is nullptr");
    check(g.getVertexInfo(0) == nullptr, "getVertexInfo on empty graph is nullptr");
    check(g.findVertex("Anything") == -1, "findVertex on empty graph is -1");
    check(g.nameOf(0) == "", "nameOf on empty graph is empty");
}

void testAddVertex() {
    cout << "\n--- Add vertex ---\n";
    Graph g(3);
    check(g.addVertex(makeLocation("A", LocationType::ROOM, 0)) == 0, "first vertex gets id 0");
    check(g.addVertex(makeLocation("B", LocationType::RESTROOM, 0)) == 1, "second vertex gets id 1");
    check(g.addVertex(makeLocation("C", LocationType::STAIRS, 1)) == 2, "third vertex gets id 2");
    check(g.getNumVertices() == 3, "graph has 3 vertices");

    check(g.addVertex(makeLocation("D", LocationType::ROOM, 0)) == -1, "full graph returns -1");
    check(g.getNumVertices() == 3, "count unchanged after full");

    check(g.findVertex("B") == 1, "findVertex B -> 1");
    check(g.findVertex("Z") == -1, "findVertex of missing key -> -1");
    check(g.nameOf(2) == "C", "nameOf(2) is C");
}

void testBadVertices() {
    cout << "\n--- Bad vertices ---\n";
    Graph g(5);
    g.addVertex(makeLocation("A", LocationType::ROOM, 0));
    check(g.addVertex(makeLocation("A", LocationType::CAFE, 1)) == -1, "duplicate key is rejected");
    check(g.addVertex(makeLocation("", LocationType::ROOM, 0)) == -1, "empty key is rejected");
    check(g.getNumVertices() == 1, "count unchanged after rejected vertices");
    check(g.getVertexInfo(0)->type == LocationType::ROOM, "original vertex kept after duplicate");
}

void testVertexInfo() {
    cout << "\n--- Vertex info ---\n";
    Graph g(5);
    g.addVertex(makeLocation("A", LocationType::ROOM, 0));
    g.addVertex(makeLocation("B", LocationType::RESTROOM, 1));

    const LocationInfo* info = g.getVertexInfo(1);
    check(info != nullptr, "getVertexInfo(1) is not nullptr");
    check(info->key == "B", "key is B");
    check(info->label == "B_label", "label is B_label");
    check(info->type == LocationType::RESTROOM, "type is RESTROOM");
    check(info->floorIndex == 1 && info->floorName == "First", "floor is First (1)");
    check(g.getVertexInfo(5) == nullptr, "id 5 gives nullptr");
    check(g.getVertexInfo(-1) == nullptr, "id -1 gives nullptr");
}

void testAddEdge() {
    cout << "\n--- Add edge ---\n";
    /*
        A --5 (corridor)-- B --3 (stairs, not accessible)-- C
    */
    Graph g(5);
    g.addVertex(makeLocation("A", LocationType::ROOM, 0));
    g.addVertex(makeLocation("B", LocationType::HALLWAY, 0));
    g.addVertex(makeLocation("C", LocationType::STAIRS, 1));

    check(g.addEdge(0, 1, 5, EdgeType::CORRIDOR, true), "add A-B");
    check(g.addEdge(1, 2, 3, EdgeType::STAIRS, false), "add B-C");
    check(g.getNumEdges() == 2, "edge count is 2 (each edge counted once)");

    check(g.hasEdge(0, 1) && g.hasEdge(1, 0), "A-B exists both ways");
    check(g.getWeight(0, 1) == 5 && g.getWeight(1, 0) == 5, "A-B weight is 5 both ways");
    check(g.getEdgeType(2, 1) == EdgeType::STAIRS, "C-B type is STAIRS");
    check(!g.isAccessible(1, 2) && !g.isAccessible(2, 1), "stairs are not accessible both ways");
    check(g.isAccessible(0, 1), "corridor is accessible");

    check(!g.hasEdge(0, 2), "A-C does not exist");
    check(g.getWeight(0, 2) == 0, "missing edge has weight 0");
    check(g.getEdgeType(0, 2) == EdgeType::OTHER, "missing edge has type OTHER");
    check(!g.isAccessible(0, 2), "missing edge is not accessible");
}

void testBadEdges() {
    cout << "\n--- Bad edges ---\n";
    Graph g(5);
    g.addVertex(makeLocation("A", LocationType::ROOM, 0));
    g.addVertex(makeLocation("B", LocationType::ROOM, 0));
    g.addEdge(0, 1, 5, EdgeType::CORRIDOR, true);

    check(!g.addEdge(1, 0, 7, EdgeType::CORRIDOR, true), "duplicate edge (reversed) is rejected");
    check(!g.addEdge(0, 0, 4, EdgeType::CORRIDOR, true), "self loop is rejected");
    check(!g.addEdge(0, 1, 0, EdgeType::CORRIDOR, true), "weight 0 is rejected");
    check(!g.addEdge(0, 1, -3, EdgeType::CORRIDOR, true), "negative weight is rejected");
    check(!g.addEdge(0, 9, 2, EdgeType::CORRIDOR, true), "missing endpoint 9 is rejected");
    check(!g.addEdge(-1, 1, 2, EdgeType::CORRIDOR, true), "negative id is rejected");
    check(g.getNumEdges() == 1, "edge count still 1");
    check(g.getWeight(0, 1) == 5, "original weight kept after duplicate");
}

void testNeighbors() {
    cout << "\n--- getNeighbors ---\n";
    /*
            B
            |
        C - A - D       A has 3 neighbors, B, C, D have 1 each
    */
    Graph g(5);
    g.addVertex(makeLocation("A", LocationType::HALLWAY, 0));
    g.addVertex(makeLocation("B", LocationType::ROOM, 0));
    g.addVertex(makeLocation("C", LocationType::ROOM, 0));
    g.addVertex(makeLocation("D", LocationType::ROOM, 0));
    g.addEdge(0, 1, 2, EdgeType::CORRIDOR, true);
    g.addEdge(0, 2, 4, EdgeType::CORRIDOR, true);
    g.addEdge(0, 3, 6, EdgeType::CORRIDOR, true);

    check(countNeighbors(g, 0) == 3, "A has 3 neighbors");
    check(countNeighbors(g, 1) == 1, "B has 1 neighbor");

    // New edges go to the front of the list, so the newest edge comes first
    const Edge* first = g.getNeighbors(0);
    check(first != nullptr && first->to == 3 && first->length == 6, "newest edge (A-D) comes first");

    int sum = 0;
    for (const Edge* e = g.getNeighbors(0); e != nullptr; e = e->next) {
        sum += e->length;
    }
    check(sum == 12, "lengths of A's edges add up to 12");

    const Edge* back = g.getNeighbors(2);
    check(back != nullptr && back->to == 0 && back->next == nullptr, "C's only neighbor is A");
    check(g.getNeighbors(9) == nullptr, "getNeighbors of invalid id is nullptr");
}

void testCapacityEdgeCases() {
    cout << "\n--- Capacity edge cases ---\n";
    Graph zero(0);
    check(zero.addVertex(makeLocation("A", LocationType::ROOM, 0)) == -1, "capacity 0 graph is always full");
    Graph negative(-4);
    check(negative.getNumVertices() == 0, "negative capacity does not crash");
    check(negative.addVertex(makeLocation("A", LocationType::ROOM, 0)) == -1, "negative capacity graph is always full");
}

int main() {
    testEmptyGraph();
    testAddVertex();
    testBadVertices();
    testVertexInfo();
    testAddEdge();
    testBadEdges();
    testNeighbors();
    testCapacityEdgeCases();

    cout << "\n==== " << passed << " passed, " << failed << " failed ====\n";
    return failed == 0 ? 0 : 1;
}

/*
 * Graph.h (Ammar Taha)
 * Weighted undirected graph stored as an adjacency list: each vertex has its
 * location info and a linked list of its edges. A vertex id is its index in info and edges.
 *
 * Cost (V = vertices, E = edges, d = edges of one vertex):
 *   Graph(c) O(c), ~Graph() O(V + E), addVertex O(V), findVertex O(V)
 *   addEdge, hasEdge, getWeight, getEdgeType, isAccessible: O(d)
 *   getNeighbors, getVertexInfo, isValidVertex, getNumVertices, getNumEdges, nameOf: O(1)
 *   Memory: O(capacity + E)
 */

#ifndef GRAPH_H
#define GRAPH_H

#include <string>
using namespace std;

// What kind of place a vertex is
enum class LocationType { ENTRANCE, HALLWAY, ROOM, CLASSROOM, RESTROOM, ELEVATOR,
                          STAIRS, OUTDOOR, BUILDING, CAFE, RESTAURANT, VENDOR, OTHER };

// What kind of path an edge is
enum class EdgeType { WALKWAY, CORRIDOR, STAIRS, ELEVATOR, RAMP, OTHER };

// Everything we know about one vertex
struct LocationInfo {
    string key;          // unique, e.g. "SSE_First_Room_101"
    string label;        // display name, can repeat, e.g. "Room 101"
    LocationType type;   // restroom, elevator, ...
    string building;     // e.g. "SSE"
    int floorIndex;      // 0 = plaza, 1 = first, ...
    string floorName;    // e.g. "First"
    string mapID;        // which map the x, y belong to
    double x, y;         // map coordinates, only for display
};

// One node in a vertex's list of edges, follow next for the rest
struct Edge {
    int to;              // id of the vertex at the other end
    int length;          // routing weight, always positive
    EdgeType type;       // corridor, stairs, ...
    bool accessible;     // false for stairs
    Edge* next;          // next edge of the same vertex, nullptr at the end
};

// One edge of a minimum spanning tree, used by Prim and Kruskal
struct MSTEdge {
    int fromID;
    int toID;
    int weight;
};

class Graph{
    private:
    int numV;
    int numE;
    int capacity;
    LocationInfo* info;  // info[u] is everything we know about vertex u
    Edge** edges;        // edges[u] is the first edge in u's list, nullptr if none

    const Edge* findEdge(int u, int v) const;    // The edge from u to v, nullptr if none

    public:
    Graph(int c);
    ~Graph();            // Frees every Edge node and both arrays

    // Copying is disabled so two graphs never free the same memory
    Graph(const Graph&) = delete;
    Graph& operator=(const Graph&) = delete;

    int addVertex(const string& key);            // Shortcut: a plain vertex with only a key (used by simple tests)
    int addVertex(const LocationInfo& v);        // Returns the id, -1 if the key is empty, already used, or the graph is full
    int findVertex(const string& key) const;     // Returns the id, -1 if not found
    bool addEdge(const string& from, const string& to, int length); // Shortcut by key: a corridor, accessible
    bool addEdge(int u, int v, int length, EdgeType t, bool acc); // False for bad id, length <= 0, self loop, or duplicate
    bool isValidVertex(int id) const;            // True if id is between 0 and numV - 1
    bool hasEdge(int u, int v) const;            // True if u and v are connected
    int getWeight(int u, int v) const;           // Length of the edge, 0 if no edge
    EdgeType getEdgeType(int u, int v) const;    // OTHER if there is no edge
    bool isAccessible(int u, int v) const;       // False if there is no edge
    const Edge* getNeighbors(int id) const;      // First edge of id, follow ->next for the rest, nullptr if none or invalid
    const LocationInfo* getVertexInfo(int id) const; // nullptr if the id is invalid
    int getNumVertices() const;
    int getNumEdges() const;
    string nameOf(int u) const;                  // Empty string if the id is invalid

};
#endif

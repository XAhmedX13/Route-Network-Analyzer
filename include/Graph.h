/*
 * Graph.h (Ammar Taha)
 * Weighted undirected graph stored as an adjacency list: each vertex has a
 * name and a linked list of its edges. A vertex id is its position in head.
 *
 * Cost (V = vertices, d = edges of one vertex):
 *   addVertex O(V), findVertex O(V), addEdge O(V + d)
 *   getNeighbors, getNumVertices, getNumEdges, nameOf: O(1)
 */

#ifndef GRAPH_H
#define GRAPH_H

struct Edge{
    int to;
    int length;
    Edge* next;
};

struct Vertex {
    char* name;
    Edge* edges;
};

class Graph{
    private:
    int numV;
    int numE;
    int capacity;
    Vertex** head; // head[u] is the vertex with id u

    public:
    Graph(int c);
    ~Graph();

    // Copying is disabled so two graphs never free the same memory
    Graph(const Graph&) = delete;
    Graph& operator=(const Graph&) = delete;

    int addVertex(const char* name);    // Returns the id, -1 if the graph is full
    int findVertex(const char* name) const;  // Returns the id, -1 if not found
    bool addEdge(const char* from, const char* to, int length);
    Edge* getNeighbors(int u) const;    // First edge of u, follow ->next for the rest
    int getNumVertices() const;
    int getNumEdges() const;
    const char* nameOf(int u) const;

};
#endif
#include "NetworkAnalysis.h"
#include "Queue.h"

static bool isValid(const Graph& graph, int id) {
    return id >= 0 && id < graph.getNumVertices();
}

// Helper: marks every vertex in startID's connected component using one shared visited array
static void markComponent(const Graph& graph, int startID, bool* visited) {
    Queue q;
    visited[startID] = true;
    q.enqueue(startID);

    while (!q.isEmpty()) {
        int current = q.front();
        q.dequeue();

        const Edge* edge = graph.getNeighbors(current);
        while (edge != nullptr) {
            int neighbor = edge->to;
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                q.enqueue(neighbor);
            }
            edge = edge->next;
        }
    }
}

int countConnectedComponents(const Graph& graph) {
    int V = graph.getNumVertices();
    if (V <= 0) {
        return 0;
    }

    bool* visited = new bool[V];
    for (int i = 0; i < V; i++) {
        visited[i] = false;
    }

    int components = 0;
    for (int i = 0; i < V; i++) {
        if (!visited[i]) {
            components++;
            markComponent(graph, i, visited);
        }
    }

    delete[] visited;
    return components;
}

bool isCampusConnected(const Graph& graph) {
    if (graph.getNumVertices() <= 0) {
        return false;
    }
    return countConnectedComponents(graph) == 1;
}

int getDegree(const Graph& graph, int vertexID) {
    // Return -1 for invalid ID so it is distinct from an isolated vertex (degree 0)
    if (!isValid(graph, vertexID)) {
        return -1;
    }

    int degree = 0;
    const Edge* edge = graph.getNeighbors(vertexID);
    while (edge != nullptr) {
        degree++;
        edge = edge->next;
    }
    return degree;
}

int findIsolatedLocations(const Graph& graph, int* resultIDs, int capacity) {
    if (resultIDs == nullptr || capacity <= 0) {
        return 0;
    }

    int V = graph.getNumVertices();
    int written = 0;

    for (int i = 0; i < V; i++) {
        if (getDegree(graph, i) == 0) {
            resultIDs[written++] = i;
            if (written == capacity) {
                break;
            }
        }
    }

    return written;
}

int findMostConnectedLocations(const Graph& graph, int* resultIDs, int capacity, int& maxDegree) {
    maxDegree = 0;
    int V = graph.getNumVertices();
    if (V <= 0) {
        return 0;
    }

    // First pass: find the highest degree in the graph
    for (int i = 0; i < V; i++) {
        int deg = getDegree(graph, i);
        if (deg > maxDegree) {
            maxDegree = deg;
        }
    }

    if (resultIDs == nullptr || capacity <= 0) {
        return 0;
    }

    // Second pass: collect all vertices tied at maxDegree
    int written = 0;
    for (int i = 0; i < V; i++) {
        if (getDegree(graph, i) == maxDegree) {
            resultIDs[written++] = i;
            if (written == capacity) {
                break;
            }
        }
    }

    return written;
}
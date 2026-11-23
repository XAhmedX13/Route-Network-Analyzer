#include "Traversal.h"
#include "Queue.h"
#include "Stack.h"

static bool isValid(const Graph& graph, int id) {
    return id >= 0 && id < graph.getNumVertices();
}

void BFS(const Graph& graph, int startID, int* visitOrder, int& visitCount) {
    visitCount = 0;
    if (visitOrder == nullptr || !isValid(graph, startID)) {
        return;
    }

    int V = graph.getNumVertices();
    bool* visited = new bool[V];
    for (int i = 0; i < V; i++) {
        visited[i] = false;
    }

    Queue q;
    // Mark start visited when enqueueing so it is never added twice
    visited[startID] = true;
    q.enqueue(startID);

    while (!q.isEmpty()) {
        int current = q.front();
        q.dequeue();
        visitOrder[visitCount++] = current;

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

    delete[] visited;
}

void DFS(const Graph& graph, int startID, int* visitOrder, int& visitCount) {
    visitCount = 0;
    if (visitOrder == nullptr || !isValid(graph, startID)) {
        return;
    }

    int V = graph.getNumVertices();
    bool* visited = new bool[V];
    for (int i = 0; i < V; i++) {
        visited[i] = false;
    }

    Stack s;
    s.push(startID);

    while (!s.isEmpty()) {
        int current = s.top();
        s.pop();

        // A vertex might be pushed multiple times before being popped
        if (visited[current]) {
            continue;
        }

        visited[current] = true;
        visitOrder[visitCount++] = current;

        const Edge* edge = graph.getNeighbors(current);
        while (edge != nullptr) {
            int neighbor = edge->to;
            if (!visited[neighbor]) {
                s.push(neighbor);
            }
            edge = edge->next;
        }
    }

    delete[] visited;
}

bool isReachable(const Graph& graph, int startID, int destinationID) {
    if (!isValid(graph, startID) || !isValid(graph, destinationID)) {
        return false;
    }
    if (startID == destinationID) {
        return true;
    }

    int V = graph.getNumVertices();
    bool* visited = new bool[V];
    for (int i = 0; i < V; i++) {
        visited[i] = false;
    }

    Queue q;
    visited[startID] = true;
    q.enqueue(startID);

    while (!q.isEmpty()) {
        int current = q.front();
        q.dequeue();

        const Edge* edge = graph.getNeighbors(current);
        while (edge != nullptr) {
            int neighbor = edge->to;
            if (neighbor == destinationID) {
                delete[] visited;
                return true;
            }
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                q.enqueue(neighbor);
            }
            edge = edge->next;
        }
    }

    delete[] visited;
    return false;
}

int getReachableLocations(const Graph& graph, int startID, int* resultIDs) {
    if (resultIDs == nullptr || !isValid(graph, startID)) {
        return 0;
    }

    int count = 0;
    BFS(graph, startID, resultIDs, count);
    return count;
}
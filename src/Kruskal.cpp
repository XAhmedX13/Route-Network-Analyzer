/*
 * Kruskal's algorithm to find a Minimum Spanning Tree (MST).
 * We sort the edges, then keep an edge only if it joins two different groups.
 * The functions only read the graph, they never change it.
 * In other words,
 * Here we build a Minimum Spanning Tree (MST) using Kruskal's algorithm.
 * We sort the edges from the lightest to the heaviest, then keep an edge
 * only if it joins two different groups in the DisjointSet. If both ends
 * are already in the same group, we skip it, because it would make a cycle.
 * We stop when we have V - 1 edges. If we cannot reach V - 1, the graph is
 * not connected, so there is no MST.
 */
 */

#include "Kruskal.h"
#include "DisjointSet.h"
#include <climits>

int collectEdges(const Graph& graph, MSTEdge* edges, int capacity) {
    if (edges == nullptr || capacity < 0) return -1;

    int count = 0;
    int numV = graph.getNumVertices();
    for (int u = 0; u < numV; u++) {
        const Edge* e = graph.getNeighbors(u);
        while (e != nullptr) {
            // The graph stores each edge twice (u->v and v->u), so we keep only one
            if (u < e->to) {
                if (count >= capacity) return -1; // No room left
                edges[count].fromID = u;
                edges[count].toID = e->to;
                edges[count].weight = e->length;
                count++;
            }
            e = e->next; // Moving to the next edge
        }
    }
    return count;
}

// We here check if edge a must come before edge b
static bool isBefore(const MSTEdge& a, const MSTEdge& b) {
    if (a.weight != b.weight) return a.weight < b.weight;
    if (a.fromID != b.fromID) return a.fromID < b.fromID; // Same weight, so we use the ids
    return a.toID < b.toID;
}

// Merging the two sorted parts [left..mid] and [mid+1..right]
static void mergeParts(MSTEdge* edges, MSTEdge* temp, int left, int mid, int right) {
    int i = left;
    int j = mid + 1;
    int k = left;

    while (i <= mid && j <= right) {
        if (isBefore(edges[j], edges[i])) {
            temp[k++] = edges[j++];
        } else {
            temp[k++] = edges[i++];
        }
    }
    while (i <= mid) temp[k++] = edges[i++];   // What is left of the left part
    while (j <= right) temp[k++] = edges[j++]; // What is left of the right part

    for (int p = left; p <= right; p++) {
        edges[p] = temp[p]; // Copying the sorted part back
    }
}

// We here split the edges in two halves, sort each half, then merge them
static void mergeSort(MSTEdge* edges, MSTEdge* temp, int left, int right) {
    if (left >= right) return; // One edge is already sorted
    int mid = left + (right - left) / 2;
    mergeSort(edges, temp, left, mid);
    mergeSort(edges, temp, mid + 1, right);
    mergeParts(edges, temp, left, mid, right);
}

void sortEdges(MSTEdge* edges, int edgeCount) {
    if (edges == nullptr || edgeCount < 2) return; // Nothing to sort

    MSTEdge* temp = new MSTEdge[edgeCount]; // Helper array for the merging
    mergeSort(edges, temp, 0, edgeCount - 1);
    delete[] temp;
}

int calculateMSTWeight(const MSTEdge* edges, int edgeCount) {
    if (edges == nullptr || edgeCount <= 0) return 0;

    long long sum = 0; // We use long long to catch an overflow
    for (int i = 0; i < edgeCount; i++) {
        sum += edges[i].weight;
    }
    if (sum > INT_MAX) return -1;
    return (int)sum;
}

bool kruskalMST(const Graph& graph, MSTEdge* resultEdges, int& edgeCount, int& totalWeight) {
    edgeCount = 0;
    totalWeight = 0;

    int numV = graph.getNumVertices();
    int numE = graph.getNumEdges();
    if (resultEdges == nullptr || numV <= 0) return false; // Empty graph

    // Collecting and sorting all the edges
    MSTEdge* edges = new MSTEdge[numE];
    int count = collectEdges(graph, edges, numE);
    if (count < 0) {
        delete[] edges;
        return false;
    }
    sortEdges(edges, count);

    // We here go through the edges from the lightest to the heaviest
    DisjointSet sets(numV);
    for (int i = 0; i < count && edgeCount < numV - 1; i++) {
        // unite() is true only when the two ends were in different groups
        if (sets.unite(edges[i].fromID, edges[i].toID)) {
            resultEdges[edgeCount] = edges[i]; // Adding the edge to the MST
            edgeCount++;
        }
    }
    delete[] edges;

    // A tree needs V - 1 edges, if we have less then the graph is disconnected
    if (edgeCount != numV - 1) {
        edgeCount = 0;
        return false;
    }

    totalWeight = calculateMSTWeight(resultEdges, edgeCount);
    if (totalWeight < 0) { // The total is too big for an int
        edgeCount = 0;
        totalWeight = 0;
        return false;
    }
    return true;
}

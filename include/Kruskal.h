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

#ifndef KRUSKAL_H
#define KRUSKAL_H

#include "Graph.h"

// Copies each edge once into edges. Returns the count, -1 if edges is null or too small
int collectEdges(const Graph& graph, MSTEdge* edges, int capacity);

// Sorts by weight (smallest first), equal weights are ordered by the ids
void sortEdges(MSTEdge* edges, int edgeCount);

// Builds the MST, resultEdges needs room for V - 1 edges.
// Returns true if the graph is connected (edgeCount = V - 1 and totalWeight is filled).
// Returns false if it is empty or disconnected (edgeCount and totalWeight are 0).
bool kruskalMST(const Graph& graph, MSTEdge* resultEdges, int& edgeCount, int& totalWeight);

// Adds up the weights, returns -1 if the sum does not fit in an int
int calculateMSTWeight(const MSTEdge* edges, int edgeCount);

#endif

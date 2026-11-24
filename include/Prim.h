/*
 * Prim.h
 * Prim's minimum spanning tree (MST) for the campus graph.
 *
 * Starts at startID and keeps adding the cheapest edge that reaches a vertex
 * not in the tree yet, using the MinHeap. The caller gives an array resultEdges
 * with room for at least V - 1 edges.
 *
 * Returns true and fills resultEdges, edgeCount and totalWeight when the graph
 * is connected. Returns false for an invalid startID, a null array, or a
 * disconnected graph (no MST exists).
 *
 * Cost (V = vertices, E = edges): O(E log V)
 */

#ifndef PRIM_H
#define PRIM_H

#include "Graph.h"

bool primMST(const Graph& graph, int startID, MSTEdge* resultEdges, int& edgeCount, int& totalWeight);

#endif

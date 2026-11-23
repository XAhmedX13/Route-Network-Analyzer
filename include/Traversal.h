#ifndef TRAVERSAL_H
#define TRAVERSAL_H

#include "Graph.h"

void BFS(const Graph& graph, int startID, int* visitOrder, int& visitCount);
void DFS(const Graph& graph, int startID, int* visitOrder, int& visitCount);
bool isReachable(const Graph& graph, int startID, int destinationID);
int getReachableLocations(const Graph& graph, int startID, int* resultIDs);

#endif
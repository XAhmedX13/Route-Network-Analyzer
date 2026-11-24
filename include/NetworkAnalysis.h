#ifndef NETWORK_ANALYSIS_H
#define NETWORK_ANALYSIS_H

#include "Graph.h"

int countConnectedComponents(const Graph& graph);
bool isCampusConnected(const Graph& graph);
int getDegree(const Graph& graph, int vertexID);
int findIsolatedLocations(const Graph& graph, int* resultIDs, int capacity);
int findMostConnectedLocations(const Graph& graph, int* resultIDs, int capacity, int& maxDegree);

#endif
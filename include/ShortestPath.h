#pragma once

#include "Graph.h"

bool dijkstra(
    const Graph &graph,
    int sourceID,
    int *distances,
    int *previous,
    bool accessibleOnly = false);

bool reconstructPath(
    int sourceID,
    int destinationID,
    const int *previous,
    int vertexCount,
    int *path,
    int &pathLength);

bool findShortestPath(
    const Graph &graph,
    int sourceID,
    int destinationID,
    int *path,
    int &pathLength,
    int &totalDistance,
    bool accessibleOnly = false);

bool findNearestLocation(
    const Graph &graph,
    int sourceID,
    LocationType targetType,
    int &targetID,
    int *path,
    int &pathLength,
    int &totalDistance,
    bool accessibleOnly = false);
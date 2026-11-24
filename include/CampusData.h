/*
 * CampusData.h (Ammar Taha)
 * Loads the campus graph from two text files, fields separated by spaces.
 * The first line of each file is a header and is skipped.
 *
 * locations.txt:  ID Key Label Type Building FloorIndex FloorName MapID X Y
 * edges.txt:      FromID ToID Weight EdgeType Accessible
 *
 * Every function returns false and prints the file, line and reason on the
 * first bad line. No field may contain a space (write Room_101, not Room 101).
 *
 * Cost (V = vertices, E = edges): loadLocations O(V^2) because addVertex
 * checks every key, loadEdges O(E * d) because addEdge checks for duplicates
 */

#ifndef CAMPUSDATA_H
#define CAMPUSDATA_H

#include "Graph.h"

bool loadCampusData(const string& locationFile, const string& edgeFile, Graph& graph); // Locations first, then edges
bool loadLocations(const string& filename, Graph& graph);
bool loadEdges(const string& filename, Graph& graph);

#endif

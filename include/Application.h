// Application.h
// Member 5 (Omar Ali) - Application layer of the AUC Route Network Analyzer.
//
// The Application is the only part of the program that talks to the user.
// It connects every module:
//   - BST (Member 5)              : turns a location's search key into its vertex ID
//   - Graph / CampusData (Mem. 1) : location metadata and neighbours
//   - Traversal / NetworkAnalysis (Member 2) : BFS, DFS, components, degrees
//   - ShortestPath / Prim (Member 3)         : routes, nearest amenity, Prim MST
//   - Kruskal (Member 4)                     : Kruskal MST
// The algorithms never print anything; they return results and the
// Application prints them. No graph algorithm is written in this module.
//
// Every function that reads or prints takes an input/output stream that
// defaults to cin/cout, so the tests can feed scripted input and read the output.

#ifndef APPLICATION_H
#define APPLICATION_H

#include <iostream>
#include <string>
#include "Graph.h"
#include "BST.h"

// ---------- Search (BST integration) ----------

// Inserts every searchable location (its unique key -> vertex ID) into the BST.
// Unnamed waypoints are skipped. Returns false if a key could not be inserted
// (empty or duplicate), true if every searchable location was indexed.
bool buildLocationIndex(const Graph& graph, BST& tree);

// Returns the vertex ID for a search key, or -1 if it is not in the BST.
int findLocationID(const BST& tree, const std::string& key);

// True for unnamed routing points ("x" or empty label) that are kept in the
// graph for routing but not shown in lists or added to the BST.
bool isWaypoint(const LocationInfo& info);

// ---------- Text helpers ----------
std::string locationTypeName(LocationType type);
std::string edgeTypeName(EdgeType type);

// ---------- Menu ----------
void displayMenu(std::ostream& out = std::cout);

// Main loop: shows the menu and handles choices until the user enters 0
// or the input ends.
void runApplication(const Graph& graph, const BST& tree,
                    std::istream& in = std::cin, std::ostream& out = std::cout);

// Runs one menu option. Returns false when the choice is invalid.
bool handleMenuChoice(int choice, const Graph& graph, const BST& tree,
                      std::istream& in = std::cin, std::ostream& out = std::cout);

// ---------- Display ----------
void displayLocations(const Graph& graph, std::ostream& out = std::cout);
void displayLocationInfo(const Graph& graph, int vertexID, std::ostream& out = std::cout);
void displayRoute(const Graph& graph, const int* path, int pathLength, int totalDistance,
                  std::ostream& out = std::cout);
void displayNetworkStatistics(const Graph& graph, std::ostream& out = std::cout);

#endif // APPLICATION_H

// main.cpp
// Member 5 (Omar Ali) - entry point of the AUC Route Network Analyzer.
// Run it from the repository root so the data/ paths are found:
//   make app && ./build/campus_app
// Optional: ./build/campus_app <locations file> <edges file>

#include <iostream>
#include <string>
#include "Graph.h"
#include "CampusData.h"
#include "BST.h"
#include "Application.h"

using namespace std;

// Room for every location in the data file. Increase it if the dataset grows.
const int GRAPH_CAPACITY = 10000;

int main(int argc, char* argv[]) {
    string locationFile = "data/locations.txt";
    string edgeFile = "data/edges.txt";
    if (argc == 3) {                  // lets us load a different dataset for testing
        locationFile = argv[1];
        edgeFile = argv[2];
    }

    // 1. Create the graph
    Graph graph(GRAPH_CAPACITY);

    // 2. Load locations and paths (Member 1's loader)
    if (!loadCampusData(locationFile, edgeFile, graph)) {
        cout << "Error: could not load campus data from " << locationFile
             << " and " << edgeFile << ".\n"
             << "Run the program from the repository root and check the files.\n";
        return 1;
    }

    // 3. Build the search index: location key -> vertex ID
    BST tree;
    if (!buildLocationIndex(graph, tree))
        cout << "Warning: some locations could not be added to the search index.\n";

    // 4. Start the menu
    runApplication(graph, tree);

    // 5. graph and tree are destroyed here and free their own memory
    return 0;
}

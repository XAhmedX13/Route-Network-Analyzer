#include <iostream>
#include "Graph.h"
#include "NetworkAnalysis.h"

int main() {
    // V0, V1, V2 form a triangle (each has degree 2 -> 3-way tie!)
    // V3 and V4 are isolated (degree 0)
    Graph g(5);
    g.addVertex("V0");
    g.addVertex("V1");
    g.addVertex("V2");
    g.addVertex("V3");
    g.addVertex("V4");

    g.addEdge("V0", "V1", 4);
    g.addEdge("V1", "V2", 4);
    g.addEdge("V0", "V2", 4);

    std::cout << "Connected components: " << countConnectedComponents(g) << " (Expected: 3)\n";
    std::cout << "Is campus connected: " << (isCampusConnected(g) ? "Yes" : "No") << " (Expected: No)\n";
    std::cout << "Degree of 0: " << getDegree(g, 0) << " (Expected: 2)\n";
    std::cout << "Degree of 3: " << getDegree(g, 3) << " (Expected: 0)\n";
    std::cout << "Degree of -1: " << getDegree(g, -1) << " (Expected: -1)\n";

    int buffer[5];
    int isolatedCount = findIsolatedLocations(g, buffer, 5);
    std::cout << "Isolated count: " << isolatedCount << " -> IDs: ";
    for (int i = 0; i < isolatedCount; i++) std::cout << buffer[i] << " ";
    std::cout << "\n";

    int maxDeg = 0;
    int topCount = findMostConnectedLocations(g, buffer, 5, maxDeg);
    std::cout << "Max degree: " << maxDeg << ", tied count: " << topCount << " -> IDs: ";
    for (int i = 0; i < topCount; i++) std::cout << buffer[i] << " ";
    std::cout << "\n";

    return 0;
}
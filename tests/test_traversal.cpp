#include <iostream>
#include "Graph.h"
#include "Traversal.h"

int main() {
    // Graph: V0 -- V1 -- V2 -- V3, and V4 is disconnected
    Graph g(5);
    g.addVertex("V0");
    g.addVertex("V1");
    g.addVertex("V2");
    g.addVertex("V3");
    g.addVertex("V4");

    g.addEdge("V0", "V1", 5);
    g.addEdge("V1", "V2", 5);
    g.addEdge("V2", "V3", 5);

    int order[5];
    int count = 0;

    BFS(g, 0, order, count);
    std::cout << "BFS from 0 (" << count << " visited): ";
    for (int i = 0; i < count; i++) std::cout << order[i] << " ";
    std::cout << "\n";

    DFS(g, 0, order, count);
    std::cout << "DFS from 0 (" << count << " visited): ";
    for (int i = 0; i < count; i++) std::cout << order[i] << " ";
    std::cout << "\n";

    std::cout << "Reachable 0 -> 3: " << (isReachable(g, 0, 3) ? "Yes" : "No") << "\n";
    std::cout << "Reachable 0 -> 4: " << (isReachable(g, 0, 4) ? "Yes" : "No") << "\n";
    std::cout << "Reachable 0 -> 99 (invalid): " << (isReachable(g, 0, 99) ? "Yes" : "No") << "\n";

    int reachableCount = getReachableLocations(g, 1, order);
    std::cout << "Reachable count from 1: " << reachableCount << " (Expected: 4)\n";

    return 0;
}
#include "Prim.h"
#include "MinHeap.h"
#include <climits>

bool primMST(
    const Graph &graph,
    int startID,
    MSTEdge *resultEdges,
    int &edgeCount,
    int &totalWeight)
{
    edgeCount = 0;
    totalWeight = 0;
    int V = graph.getNumVertices();

    // validate inputs
    if (!graph.isValidVertex(startID) || resultEdges == nullptr)
    {
        return false;
    }

    // create temporary arrays
    int *key = new int[V];
    int *parent = new int[V];
    bool *inMST = new bool[V];

    // initialize arrays
    for (int i = 0; i < V; i++)
    {
        key[i] = INT_MAX;
        parent[i] = -1;
        inMST[i] = false;
    }

    key[startID] = 0;

    // create the min heap
    MinHeap heap(V);

    // insert the starting vertex
    if (!heap.insert(startID, 0))
    {
        delete[] key;
        delete[] parent;
        delete[] inMST;

        return false;
    }

    int verticesAdded = 0;

    while (!heap.isEmpty())
    {
        HeapNode current;

        if (!heap.extractMin(current))
        {
            delete[] key;
            delete[] parent;
            delete[] inMST;

            edgeCount = 0;
            totalWeight = 0;
            return false;
        }

        int u = current.vertexID;

        // skip vertices already included in the MST
        if (inMST[u])
        {
            continue;
        }

        // add the vertex to the MST
        inMST[u] = true;
        verticesAdded++;

        // store the selected edge
        if (parent[u] != -1)
        {
            // prevent integer overflow
            if (totalWeight > INT_MAX - key[u])
            {
                delete[] key;
                delete[] parent;
                delete[] inMST;

                edgeCount = 0;
                totalWeight = 0;
                return false;
            }

            resultEdges[edgeCount].fromID = parent[u];
            resultEdges[edgeCount].toID = u;
            resultEdges[edgeCount].weight = key[u];

            edgeCount++;
            totalWeight += key[u];
        }

        // visit all neighbors
        const Edge *edge = graph.getNeighbors(u);

        while (edge != nullptr)
        {
            int v = edge->to;
            int weight = edge->length;

            // validate campus edge weights
            if (weight < 0 || weight == INT_MAX)
            {
                delete[] key;
                delete[] parent;
                delete[] inMST;

                edgeCount = 0;
                totalWeight = 0;
                return false;
            }

            // update if a cheaper connection is found
            if (!inMST[v] && weight < key[v])
            {
                key[v] = weight;
                parent[v] = u;

                if (!heap.insert(v, weight))
                {
                    delete[] key;
                    delete[] parent;
                    delete[] inMST;

                    edgeCount = 0;
                    totalWeight = 0;
                    return false;
                }
            }

            edge = edge->next;
        }
    }

    // free temporary memory
    delete[] key;
    delete[] parent;
    delete[] inMST;

    // check whether the graph is connected
    if (verticesAdded != V)
    {
        edgeCount = 0;
        totalWeight = 0;
        return false;
    }

    return true;
}
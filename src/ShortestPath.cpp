#include "ShortestPath.h"
#include "MinHeap.h"
#include <climits>

bool dijkstra(
    const Graph &graph,
    int sourceID,
    int *distances,
    int *previous,
    bool accessibleOnly)
{
    int V = graph.getNumVertices(); // num of vertices

    if (!graph.isValidVertex(sourceID) ||
        distances == nullptr || previous == nullptr)
    {
        return false;
    }

    for (int i = 0; i < V; i++) // at the beginging, all vertices are unreachable
    {
        distances[i] = INT_MAX;
        previous[i] = -1;
    }

    // Distance from the source to itself is zero
    distances[sourceID] = 0;

    MinHeap heap(V); // Create a min heap to process vertices by shortest distance

    if (!heap.insert(sourceID, 0)) // checking whether insertion sucessed or not
    {
        return false;
    }

    while (!heap.isEmpty())
    {
        HeapNode current;

        if (!heap.extractMin(current))
        {
            return false;
        }

        int u = current.vertexID;

        if (current.priority > distances[u]) // skip outdated heap entries if it has greater value
        {
            continue;
        }

        const Edge *edge = graph.getNeighbors(u); // visit all neighbors of the current vertex

        while (edge != nullptr)
        {
            int v = edge->to;

            // skip inaccessible edges if requested and the the edge itself is inaccessable
            if (accessibleOnly && !edge->accessible)
            {
                edge = edge->next;
                continue;
            }

            int weight = edge->length;

            // dijkstra requires nonnegative weights
            if (weight < 0)
            {
                return false;
            }

            if (distances[u] != INT_MAX &&
                distances[u] <= INT_MAX - weight) // Prevent integer overflow
            {
                int newDistance = distances[u] + weight;

                // update if a shorter route is found
                if (newDistance < distances[v])
                {
                    distances[v] = newDistance;
                    previous[v] = u;

                    if (!heap.insert(v, newDistance))
                    {
                        return false;
                    }
                }
            }

            edge = edge->next; // move to the next neighbor
        }
    }

    return true;
}

bool reconstructPath(
    int sourceID,
    int destinationID,
    const int *previous,
    int vertexCount,
    int *path,
    int &pathLength)
{
    pathLength = 0;

    // validate the inputs
    if (vertexCount <= 0 ||
        sourceID < 0 || sourceID >= vertexCount ||
        destinationID < 0 || destinationID >= vertexCount ||
        previous == nullptr || path == nullptr)
    {
        return false;
    }

    int current = destinationID;

    // Follow the predecessor chain backward
    while (current != -1 && pathLength < vertexCount)
    {
        // make sure the current vertex is valid
        if (current < 0 || current >= vertexCount)
        {
            pathLength = 0;
            return false;
        }

        path[pathLength] = current; // store the current vertex in reverse order
        pathLength++;

        // stop when we reach the source
        if (current == sourceID)
        {
            break;
        }

        // move to the previous vertex
        current = previous[current];
    }

    if (pathLength == 0 || path[pathLength - 1] != sourceID) // saftey check that we actually reached the source
    {
        pathLength = 0;
        return false;
    }

    // reverse the collected path
    int left = 0;
    int right = pathLength - 1;

    while (left < right)
    {
        int temp = path[left];
        path[left] = path[right];
        path[right] = temp;

        left++;
        right--;
    }

    return true;
}

bool findShortestPath(
    const Graph &graph,
    int sourceID,
    int destinationID,
    int *path,
    int &pathLength,
    int &totalDistance,
    bool accessibleOnly)
{
    // Initialize output values
    pathLength = 0;
    totalDistance = INT_MAX;

    // validate the inputs
    if (!graph.isValidVertex(sourceID) || !graph.isValidVertex(destinationID) ||
        path == nullptr)
    {
        return false;
    }

    // create temporary arrays for Dijkstra
    int V = graph.getNumVertices();

    int *distances = new int[V];
    int *previous = new int[V];

    // call dikstra
    if (!dijkstra(graph, sourceID, distances, previous, accessibleOnly))
    {
        delete[] distances;
        delete[] previous;
        return false;
    }

    // check if the destination is reachable
    if (distances[destinationID] == INT_MAX)
    {
        delete[] distances;
        delete[] previous;
        return false;
    }

    // reconstruct the shortest path
    bool success = reconstructPath(sourceID, destinationID, previous, V, path, pathLength);

    if (!success)
    {
        delete[] distances;
        delete[] previous;
        return false;
    }

    // store the total distance
    totalDistance = distances[destinationID];

    // free temporary memory
    delete[] distances;
    delete[] previous;

    return true;
}

bool findNearestLocation(
    const Graph &graph,
    int sourceID,
    LocationType targetType,
    int &targetID,
    int *path,
    int &pathLength,
    int &totalDistance,
    bool accessibleOnly)
{
    targetID = -1;
    pathLength = 0;
    totalDistance = INT_MAX;

    // Validate inputs
    if (!graph.isValidVertex(sourceID) || path == nullptr)
    {
        return false;
    }

    // Create temporary arrays
    int V = graph.getNumVertices();

    int *distances = new int[V];
    int *previous = new int[V];

    // Run Dijkstra
    if (!dijkstra(graph, sourceID, distances, previous, accessibleOnly))
    {
        delete[] distances;
        delete[] previous;
        return false;
    }
    // find the nearest location of the requested type
    int bestID = -1;
    int bestDistance = INT_MAX;

    for (int i = 0; i < V; i++)
    {
        const LocationInfo *info = graph.getVertexInfo(i);

        if (info == nullptr)
        {
            continue;
        }

        if (info->type == targetType && distances[i] < bestDistance)
        {
            bestID = i;
            bestDistance = distances[i];
        }
    }

    // check if a matching reachable location was found
    if (bestID == -1)
    {
        delete[] distances;
        delete[] previous;
        return false;
    }

    // reconstruct the path to the nearest location
    bool success = reconstructPath(sourceID, bestID, previous, V, path, pathLength);

    if (!success)
    {
        delete[] distances;
        delete[] previous;
        return false;
    }

    // store the results
    targetID = bestID;
    totalDistance = bestDistance;

    // free temporary memory
    delete[] distances;
    delete[] previous;

    return true;
}
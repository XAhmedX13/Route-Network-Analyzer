
#include "../MinHeap.h"
#include <iostream>
using namespace std;

int main() {

    // Start with capacity 2 to test dynamic resizing
    MinHeap heap(2);
    HeapNode result;

    cout << "Initial size: " << heap.getSize() << endl;
    cout << "Is empty: " << heap.isEmpty() << endl;

    // Test insertion
    heap.insert(1, 10);
    heap.insert(2, 5);
    heap.insert(3, 7);
    heap.insert(4, 2);
    heap.insert(5, 15);

    cout << "\nSize after insertion: " << heap.getSize() << endl;

    // Test peekMin
    if (heap.peekMin(result)) {
        cout << "Minimum vertex ID: " << result.vertexID << endl;
        cout << "Minimum priority: " << result.priority << endl;
    }

    // Test extraction
    cout << "\nExtracting elements:\n";

    while (!heap.isEmpty()) {

        heap.extractMin(result);

        cout << "Vertex ID: " << result.vertexID
             << ", Priority: " << result.priority << endl;
    }

    // Test empty heap
    cout << "\nIs empty: " << heap.isEmpty() << endl;

    if (!heap.extractMin(result)) {
        cout << "Cannot extract from an empty heap." << endl;
    }

    if (!heap.peekMin(result)) {
        cout << "Cannot peek into an empty heap." << endl;
    }

    // Test zero initial capacity
    MinHeap heap2(0);
    heap2.insert(6, 3);

    if (heap2.peekMin(result)) {
        cout << "\nHeap with initial capacity 0:"
             << "\nVertex ID: " << result.vertexID
             << ", Priority: " << result.priority << endl;
    }

    return 0;
}

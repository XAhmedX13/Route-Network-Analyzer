#include <iostream>
#include "Queue.h"
#include "Stack.h"

int main() {
    Queue q;

    // Test empty check
    std::cout << "Is queue empty initially? " << (q.isEmpty() ? "Yes" : "No") << std::endl;

    // Test Enqueue
    std::cout << "\nEnqueueing vertex IDs 0, 1, 2..." << std::endl;
    q.enqueue(0);
    q.enqueue(1);
    q.enqueue(2);

    std::cout << "Is queue empty after enqueue? " << (q.isEmpty() ? "Yes" : "No") << std::endl;
    std::cout << "Front element: " << q.front() << " (Expected: 0)" << std::endl;

    // Test Dequeue
    std::cout << "\nDequeueing elements in order:" << std::endl;
    while (!q.isEmpty()) {
        std::cout << "Front element: " << q.front() << " -> Dequeueing..." << std::endl;
        q.dequeue();
    }

    //Test Edge Case: Dequeueing from an empty queue
    std::cout << "\nTesting Dequeue Edge Case (Empty Queue):" << std::endl;
    q.dequeue();


    std::cout << "\n==========================================" << std::endl;


    Stack s;

    // Test empty check
    std::cout << "Is stack empty initially? " << (s.isEmpty() ? "Yes" : "No") << std::endl;

    // Test Push
    std::cout << "\nPushing vertex IDs 0, 1, 2..." << std::endl;
    s.push(0);
    s.push(1);
    s.push(2);

    std::cout << "Is stack empty after push? " << (s.isEmpty() ? "Yes" : "No") << std::endl;
    std::cout << "Top element: " << s.top() << " (Expected: 2)" << std::endl;

    //Test Pop 
    std::cout << "\nPopping elements in order:" << std::endl;
    while (!s.isEmpty()) {
        std::cout << "Top element: " << s.top() << " -> Popping..." << std::endl;
        s.pop();
    }

    //Test Edge Case: Popping from an empty stack
    std::cout << "\nTesting Pop Edge Case (Empty Stack):" << std::endl;
    s.pop();

    return 0;
}
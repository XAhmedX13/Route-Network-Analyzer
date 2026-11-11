#include "Queue.h"
#include <iostream>

// (queue starts empty)
Queue::Queue() {
    head = nullptr; 
    tail = nullptr; 
}

// prevent memory leaks
Queue::~Queue() {
    while (!isEmpty()) { 
        dequeue();
    }
}

// Checks if the queue contains any elements
bool Queue::isEmpty() const {
    return head == nullptr; 
}

// FIFO
void Queue::enqueue(int value) {
    //Create a new node dynamically on the heap
    QueueNode* newNode = new QueueNode(); 
    newNode->data = value;       
    newNode->next = nullptr; // new node will be the last item, so next is null

    // Attach the new node to the queue
    if (isEmpty()) {                     
        head = newNode;                  // If empty, new node is both head and tail
        tail = newNode;
    } else {                             
        tail->next = newNode;   
        tail = newNode;               
    }
}

// Removes the element at the front of the queue
void Queue::dequeue() {
    // Edge Case: Handle empty queue
    if (isEmpty()) {                     
        std::cout << "Queue Error: Cannot dequeue from an empty queue." << std::endl;
        return;
    }

    //Keep track of current head node to delete later
    QueueNode* temp = head;              
    

    head = head->next;                   


    if (head == nullptr) {               
        tail = nullptr;                  
    }

    //Free memory allocated for old head node
    delete temp;                         
}

// Returns the vertex ID at the front of the queue
int Queue::front() const {
    if (isEmpty()) {                     
        std::cout << "Queue Error: Queue is empty." << std::endl;
        return -1;                       // Return -1 indicating invalid vertex ID
    }
    return head->data;                   // Return value stored in head node
}
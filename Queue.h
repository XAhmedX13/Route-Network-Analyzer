#ifndef QUEUE_H
#define QUEUE_H

// each element in the Queue
struct QueueNode {
    int data;            
    QueueNode* next;     
};

// Queue class  using a linked list
class Queue {
private:
    QueueNode* head;     
    QueueNode* tail;  

public:
    Queue();            
    ~Queue();            

    void enqueue(int value); 
    void dequeue();          
    int front() const;  
    bool isEmpty() const;
};

#endif
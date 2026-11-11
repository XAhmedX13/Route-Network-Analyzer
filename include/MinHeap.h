#pragma once


struct  HeapNode {

    int priority ; // Distance
    int vertexID ; // Id of the vertex in the graph name 

};


class MinHeap {

private :
    HeapNode* heap; 
    int size ; 
    int capacity ; 

    void resize(); // doubles the capacity of the heap
    void heapifyUp(int index); // maintains the minheap properety
    void heapifyDown(int index); // maintains the minheap properety

public: 
    MinHeap(int initialCapacity); //constructor
    ~MinHeap(); // destructor

    bool isEmpty() const; //checks if the heap is empty 
    int getSize() const; //returns the size 
    

    bool insert (int vertex, int priority); // inserts an element and then do heapify up
    bool extractMin(HeapNode & result); // deletes the min from the heap and returns it in result while maintaining the minheap properety
    bool peekMin(HeapNode & result) const;


} ;
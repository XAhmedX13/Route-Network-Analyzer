#include "Stack.h"
#include <iostream>

//(stack starts empty)
Stack::Stack() {
    topNode = nullptr; 
}


Stack::~Stack() {
    while (!isEmpty()) { 
        pop(); 
    }
}

// Checks if stack is currently empty
bool Stack::isEmpty() const {
    return topNode == nullptr;
}

// (LIFO)
void Stack::push(int value) {

    StackNode* newNode = new StackNode(); 
    newNode->data = value;
    

    newNode->next = topNode;
    topNode = newNode; }


void Stack::pop() {
    if (isEmpty()) {                     
        std::cout << "Stack Error: Cannot pop from an empty stack." << std::endl;
        return;
    }

    //Save pointer to current top node
    StackNode* temp = topNode;           
    

    topNode = topNode->next;             

    delete temp;                         
}


int Stack::top() const {
    if (isEmpty()) {                     
        std::cout << "Stack Error: Stack is empty." << std::endl;
        return -1;                    
    }
    return topNode->data;                
}
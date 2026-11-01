#ifndef STACK_H
#define STACK_H

//  each element in the Stack
struct StackNode {
    int data;        
    StackNode* next;     
};

// Stack class using a linked list
class Stack {
private:
    StackNode* topNode; 

public:
    Stack();             
    ~Stack();            

    void push(int value);
    void pop();           
    int top() const;      
    bool isEmpty() const; 
};

#endif
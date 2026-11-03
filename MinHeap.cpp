# include "MinHeap.h" 

MinHeap::MinHeap(int initialCapacity){ //constructor
    
    if(initialCapacity < 1 ) {  // handling zero or negative values
        initialCapacity = 1; 
    }

    capacity = initialCapacity; 
    size = 0;
    heap = new HeapNode[capacity];

}


MinHeap::~MinHeap(){ // destructor

    delete [] heap; //free the memory 
}


bool MinHeap::isEmpty() const{

    return size == 0;
}


int MinHeap::getSize() const{

    return size;
}


void MinHeap::resize(){

    int newCapacity = capacity*2;
    HeapNode* temp = new HeapNode[newCapacity]; //creating a new heap of the doubled size

    for(int i = 0 ; i < size ; i++){

        temp[i]= heap[i];  // copying the elemnts there
    }

    delete [] heap; 
    heap = temp;
    capacity = newCapacity; // replace the old array with the new one and update capacity 

}



void MinHeap::heapifyUp(int index){

    while (index > 0) {

        int parent = (index - 1) / 2;  // get the parent index
        
        if(heap[index].priority < heap[parent].priority){  // swap them if the parent have higher priority
            
            HeapNode temp = heap[index];
            heap[index] = heap[parent];
            heap[parent] = temp; 

        }
        
        else {

            break ;
        }

        index = parent; // changing the original index

}

}



bool MinHeap::insert(int numvertex, int numpriority){

    if (size == capacity){ //if it is full we double the size using resize function
        resize();
    }

    heap[size].priority = numpriority;   
    heap[size].vertexID = numvertex ;  // assign the new priority and new vertex

    size++ ; // increase the size bcz of increasing the elements

    heapifyUp(size - 1); // ensure maintIning the min heap properety
    
    return true ; 
}





void MinHeap::heapifyDown(int index){

    while (index < size) {

        int leftChild = index * 2 + 1;  // get the left child index
        int rightChild = index * 2 + 2;  // get the right child index

        int smallest = index ; 

        if (leftChild < size && heap[leftChild].priority < heap [smallest].priority){ //find the smallest child if existed
            
            smallest = leftChild ; 
        }

        if (rightChild < size && heap[rightChild].priority < heap [smallest].priority){
            
            smallest = rightChild ; 
        }


        if (smallest == index ){ // if the index is already the smallest element we break 
            break;
        }
    
        else {  //otherwise we swap the index with the smallest child 
            
            HeapNode temp = heap[index];
            heap[index] = heap[smallest];
            heap[smallest] = temp; 
            index = smallest; 
        }

        

}

}



bool MinHeap::extractMin(HeapNode & result){

    if(size == 0){
        return false ;
    }

    result = heap[0];  
    heap[0]= heap[size-1]; //the root is replaced with the last element

    size--;
    

    if(!isEmpty()){
        heapifyDown(0); 
    }
    return true;
}


bool MinHeap::peekMin(HeapNode & result) const{

    if(size == 0){
        return false ;
    }

    result = heap[0];
    return true ;
}
#include "Graph.h"
#include <cstring>

Graph::Graph(int c):numV(0),numE(0),capacity(c){
    head = new Vertex*[capacity];
    for(int i=0;i<capacity;i++){
        head[i] = nullptr;
    }
}

Graph::~Graph(){
    for(int i=0;i<numV;i++){
        Edge* e = head[i]->edges;
        while(e!=nullptr){
            Edge* temp = e;
            e = e->next;
            delete temp;
        }
        delete[] head[i]->name;   // Freeing the copy of the name
        delete head[i];
    }
    delete[] head;
}

int Graph::addVertex(const char* name){
    if(name == nullptr || numV >= capacity) return -1; // Graph is full
    int existing = findVertex(name);
    if(existing != -1) return existing; // The name is already used

    head[numV] = new Vertex();
    head[numV]->name = new char[strlen(name) + 1];
    strcpy(head[numV]->name, name); // Keeping our own copy of the name
    head[numV]->edges = nullptr;
    numV++;
    return numV - 1; // Return the index of the new vertex
}

int Graph::findVertex(const char* name) const{
    if(name == nullptr || numV == 0) return -1;
    for(int i =0; i < numV; i++){
        if(strcmp(head[i]->name, name) == 0) return i;
    }
    return -1;
}

bool Graph::addEdge(const char* from, const char* to, int length){
    int i = findVertex(from);
    if(i == -1) return false; // We couldn't find the from
    Vertex* curr1 = head[i];

    int j = findVertex(to);
    if(j == -1) return false; // We couldn't find the to
    Vertex* curr2 = head[j];

    if(length < 0 || i == j) return false; // negative length or self loop

    Edge* check = curr1->edges;
    while(check != nullptr){
        if(check->to == j) return false; // the edge already exists
        check = check->next;
    }

    Edge* newEdge = new Edge;
    newEdge->length = length;
    newEdge->to = j;
    newEdge->next = curr1->edges;
    curr1->edges = newEdge;

    Edge* backEdge = new Edge; // the graph is undirected, so add the way back too
    backEdge->length = length;
    backEdge->to = i;
    backEdge->next = curr2->edges;
    curr2->edges = backEdge;

    numE++;
    return true;
}

Edge* Graph::getNeighbors(int u) const{
    if(u < 0 || u >= numV) return nullptr;
    return head[u]->edges;
}

int Graph::getNumVertices() const{
    return numV;
}

int Graph::getNumEdges() const{
    return numE;
}

const char* Graph::nameOf(int u) const{
    if(u < 0 || u >= numV) return "";
    return head[u]->name;
}
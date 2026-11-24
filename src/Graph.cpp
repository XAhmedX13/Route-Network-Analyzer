#include "Graph.h"

Graph::Graph(int c):numV(0),numE(0),capacity(c){
    if(capacity < 0) capacity = 0; // a negative size would crash new[]
    info = new LocationInfo[capacity];
    edges = new Edge*[capacity];
    for(int i=0;i<capacity;i++){
        edges[i] = nullptr; // Every list starts empty
    }
}

Graph::~Graph(){
    for(int i=0;i<numV;i++){
        Edge* e = edges[i];
        while(e!=nullptr){
            Edge* temp = e;
            e = e->next;
            delete temp;
        }
    }
    delete[] info;
    delete[] edges; // Frees the array of list heads, the nodes are already gone
}

int Graph::addVertex(const LocationInfo& v){
    if(v.key.empty() || numV >= capacity) return -1; // Empty key or the graph is full
    if(findVertex(v.key) != -1) return -1; // The key is already used

    info[numV] = v; // Copy the LocationInfo struct
    edges[numV] = nullptr;
    numV++;
    return numV - 1; // Return the index of the new vertex
}

int Graph::findVertex(const string& key) const{
    for(int i =0; i < numV; i++){
        if(info[i].key == key) return i;
    }
    return -1;
}

const Edge* Graph::findEdge(int u, int v) const{
    if(!isValidVertex(u) || !isValidVertex(v)) return nullptr;
    for(const Edge* e = edges[u]; e != nullptr; e = e->next){
        if(e->to == v) return e;
    }
    return nullptr; // We couldn't find it in u's list
}

bool Graph::addEdge(int u, int v, int length, EdgeType t, bool acc){
    if(!isValidVertex(u) || !isValidVertex(v)) return false; // We couldn't find one of the ends
    if(length <= 0 || u == v) return false; // length must be positive and no self loop
    if(findEdge(u, v) != nullptr) return false; // the edge already exists

    Edge* newEdge = new Edge; // add v to the front of u's list
    newEdge->to = v;
    newEdge->length = length;
    newEdge->type = t;
    newEdge->accessible = acc;
    newEdge->next = edges[u];
    edges[u] = newEdge;

    Edge* backEdge = new Edge; // the graph is undirected, so add u to v's list too
    backEdge->to = u;
    backEdge->length = length;
    backEdge->type = t;
    backEdge->accessible = acc;
    backEdge->next = edges[v];
    edges[v] = backEdge;

    numE++; // counted once even though it is stored twice
    return true;
}

bool Graph::isValidVertex(int id) const{
    return id >= 0 && id < numV;
}

bool Graph::hasEdge(int u, int v) const{
    return findEdge(u, v) != nullptr;
}

int Graph::getWeight(int u, int v) const{
    const Edge* e = findEdge(u, v);
    if(e == nullptr) return 0; // no edge
    return e->length;
}

EdgeType Graph::getEdgeType(int u, int v) const{
    const Edge* e = findEdge(u, v);
    if(e == nullptr) return EdgeType::OTHER; // no edge, so no real type
    return e->type;
}

bool Graph::isAccessible(int u, int v) const{
    const Edge* e = findEdge(u, v);
    if(e == nullptr) return false; // no edge, nothing to walk on
    return e->accessible;
}

const Edge* Graph::getNeighbors(int id) const{
    if(!isValidVertex(id)) return nullptr;
    return edges[id];
}

const LocationInfo* Graph::getVertexInfo(int id) const{
    if(!isValidVertex(id)) return nullptr;
    return &info[id]; // address of the struct, so nothing is copied
}

int Graph::getNumVertices() const{
    return numV;
}

int Graph::getNumEdges() const{
    return numE;
}

string Graph::nameOf(int u) const{
    if(!isValidVertex(u)) return "";
    return info[u].key;
}

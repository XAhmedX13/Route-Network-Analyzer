#include "DisjointSet.h"

DisjointSet::DisjointSet(int size) : n(size < 0 ? 0 : size), numSets(n) {
    parent = new int[n];
    rank = new int[n];
    for (int i = 0; i < n; i++) {
        parent[i] = i;  // at the start, every element is its own root
        rank[i] = 0;    // a single node has height 0
    }
}

DisjointSet::~DisjointSet() {
    delete[] parent;
    delete[] rank;
}

bool DisjointSet::isValid(int x) const {
    return x >= 0 && x < n;
}

int DisjointSet::findRoot(int x) {
    if (parent[x] != x) {
        parent[x] = findRoot(parent[x]); // path compression: point x straight to the root
    }
    return parent[x];
}

int DisjointSet::find(int x) {
    if (!isValid(x)) return -1; // invalid vertex id
    return findRoot(x);
}

bool DisjointSet::unite(int x, int y) {
    if (!isValid(x) || !isValid(y)) return false; // invalid vertex id

    int rx = findRoot(x);
    int ry = findRoot(y);
    if (rx == ry) return false; // already in the same group (this would make a cycle)

    // Union by rank: the root with the smaller rank goes under the other one
    if (rank[rx] < rank[ry]) {
        parent[rx] = ry;
    } else if (rank[rx] > rank[ry]) {
        parent[ry] = rx;
    } else {
        parent[ry] = rx; // same rank: we pick rx, so its tree becomes taller by 1
        rank[rx]++;
    }
    numSets--; // two groups became one
    return true;
}

bool DisjointSet::connected(int x, int y) {
    if (!isValid(x) || !isValid(y)) return false;
    return findRoot(x) == findRoot(y);
}

int DisjointSet::getNumSets() const {
    return numSets;
}

int DisjointSet::getSize() const {
    return n;
}

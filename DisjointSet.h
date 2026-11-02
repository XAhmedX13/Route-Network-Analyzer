/*
* We use two tricks to keep the trees short:
 *   - Path compression: find() makes every visited element point to the root.
 *   - Union by rank: unite() puts the shorter tree under the taller one.
*/

#ifndef DISJOINTSET_H
#define DISJOINTSET_H

class DisjointSet {
    private:
    int n;          // number of elements
    int numSets;    // number of groups right now
    int* parent;    // parent[i] is the parent of i (a root is its own parent)
    int* rank;      // rank[i] is a height estimate of the tree whose root is i

    bool isValid(int x) const;  // true if x is between 0 and n-1
    int findRoot(int x);        // find() without the validity check

    public:
    DisjointSet(int size);      // makes groups of number "size", each with one element
    ~DisjointSet();

    // Copying is disabled so two objects never free the same memory
    DisjointSet(const DisjointSet&) = delete;
    DisjointSet& operator=(const DisjointSet&) = delete;

    int find(int x);                // Returns the root of x's group, -1 if x is invalid
    bool unite(int x, int y);       // Merges the two groups. Returns false if invalid
                                    // or if x and y are already in the same group
    bool connected(int x, int y);   // True if x and y are in the same group
    int getNumSets() const;         // How many groups are left
    int getSize() const;            // How many elements there are
};
#endif

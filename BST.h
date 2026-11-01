// BST.h
// Member 5 - Binary Search Tree (BST)
// Project: A3. Social/Route Network Analyzer


#ifndef BST_H
#define BST_H

#include <string>
using namespace std;

// A single node of the tree: one building and its vertex ID.
struct BSTNode {
    string name;   // building name (the search key)
    int vertexID;       // matching vertex ID in the graph
    BSTNode* left;      // subtree with names that come before this one
    BSTNode* right;     // subtree with names that come after this one

    BSTNode(const string& n, int id)
        : name(n), vertexID(id), left(nullptr), right(nullptr) {}
};

class BST {
public:
    BST();                              // creates an empty tree
    ~BST();                             // frees every node

    // Copying is disabled so two trees never share (and double-free) the same nodes.
    BST(const BST&) = delete;
    BST& operator=(const BST&) = delete;

    // Adds a building. Returns false if the name already exists,
    // the name is empty, or the vertex ID is negative.
    bool insert(const string& name, int vertexID);

    // Looks up a building. Returns its vertex ID, or -1 if not found.
    int search(const string& name) const;

    // Returns true if the building exists in the tree.
    bool contains(const string& name) const;

    // Deletes a building. Returns false if it was not found.
    bool remove(const string& name);

    // Prints all buildings in alphabetical order.
    void inorderTraversal() const;

    bool isEmpty() const;               // true when the tree has no nodes
    int size() const;                   // number of buildings stored
    int height() const;                 // height of the tree (empty = 0)
    void clear();                       // deletes all nodes, tree becomes empty

private:
    BSTNode* root;                      // top of the tree (nullptr when empty)
    int count;                          // number of nodes currently stored

    // Recursive helpers that work on a subtree.
    BSTNode* removeHelper(BSTNode* node, const string& name, bool& removed);
    BSTNode* findMin(BSTNode* node) const;
    void inorderHelper(BSTNode* node) const;
    int heightHelper(BSTNode* node) const;
    void destroy(BSTNode* node);
};

#endif // BST_H

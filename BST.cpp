
// Time complexity (h = height of the tree, n = number of nodes):
//   insert, search, contains, remove : O(h)  -> O(log n) average, O(n) worst case
//                                              (worst case = names inserted in sorted order)
//   inorderTraversal, height, clear  : O(n)
//   isEmpty, size                    : O(1)

#include "BST.h"
#include <iostream>
using namespace std;

// Constructor: start with an empty tree.
BST::BST() : root(nullptr), count(0) {}

// Destructor: release all dynamically allocated nodes.
BST::~BST() {
    destroy(root);
}

// Insert a new building (iterative).
// Walk down from the root: go left if the new name is smaller, right if larger.
// If an equal name is found, it's a duplicate and nothing is inserted.
bool BST::insert(const string& name, int vertexID) {
    if (name.empty()) {
        cout << "Error: building name cannot be empty.\n";
        return false;
    }
    if (vertexID < 0) {
        cout << "Error: vertex ID must be nonnegative (got " << vertexID << ").\n";
        return false;
    }

    // Empty tree: the new node becomes the root.
    if (root == nullptr) {
        root = new BSTNode(name, vertexID);
        count++;
        return true;
    }

    BSTNode* current = root;
    while (true) {
        if (name < current->name) {
            if (current->left == nullptr) {             // found the empty spot
                current->left = new BSTNode(name, vertexID);
                count++;
                return true;
            }
            current = current->left;
        } else if (name > current->name) {
            if (current->right == nullptr) {            // found the empty spot
                current->right = new BSTNode(name, vertexID);
                count++;
                return true;
            }
            current = current->right;
        } else {
            // Duplicate building name: reject it, keep the original ID.
            cout << "Error: building \"" << name << "\" already exists (vertex "
                      << current->vertexID << ").\n";
            return false;
        }
    }
}

// Search for a building (iterative). Returns its vertex ID or -1.
int BST::search(const string& name) const {
    BSTNode* current = root;
    while (current != nullptr) {
        if (name < current->name)
            current = current->left;
        else if (name > current->name)
            current = current->right;
        else
            return current->vertexID;   // match found
    }
    return -1;                          // reached a null link: not in the tree
}

bool BST::contains(const string& name) const {
    return search(name) != -1;
}

// Remove a building. Uses a recursive helper that returns the new subtree root.
bool BST::remove(const string& name) {
    bool removed = false;
    root = removeHelper(root, name, removed);
    if (removed) count--;
    return removed;
}

// Recursively find and delete the node. Three cases:
//   1) Leaf node            -> just delete it.
//   2) One child            -> replace the node with its child.
//   3) Two children         -> copy the in-order successor (smallest in right
//                              subtree) into this node, then delete the successor.
BSTNode* BST::removeHelper(BSTNode* node, const string& name, bool& removed) {
    if (node == nullptr) return nullptr;            // name not found

    if (name < node->name) {
        node->left = removeHelper(node->left, name, removed);
    } else if (name > node->name) {
        node->right = removeHelper(node->right, name, removed);
    } else {
        removed = true;

        // Cases 1 and 2: zero or one child.
        if (node->left == nullptr) {
            BSTNode* child = node->right;
            delete node;
            return child;
        }
        if (node->right == nullptr) {
            BSTNode* child = node->left;
            delete node;
            return child;
        }

        // Case 3: two children.
        BSTNode* successor = findMin(node->right);
        node->name = successor->name;
        node->vertexID = successor->vertexID;
        bool dummy = false;                          // successor surely exists
        node->right = removeHelper(node->right, successor->name, dummy);
    }
    return node;
}

// Leftmost node of a subtree = alphabetically smallest name.
BSTNode* BST::findMin(BSTNode* node) const {
    while (node != nullptr && node->left != nullptr)
        node = node->left;
    return node;
}

// Print buildings in sorted (alphabetical) order: left, node, right.
void BST::inorderTraversal() const {
    if (root == nullptr) {
        cout << "(no buildings)\n";
        return;
    }
    inorderHelper(root);
}

void BST::inorderHelper(BSTNode* node) const {
    if (node == nullptr) return;
    inorderHelper(node->left);
    cout << "  " << node->name << " -> vertex " << node->vertexID << "\n";
    inorderHelper(node->right);
}

bool BST::isEmpty() const { return root == nullptr; }

int BST::size() const { return count; }

int BST::height() const { return heightHelper(root); }

// Height = number of nodes on the longest root-to-leaf path.
int BST::heightHelper(BSTNode* node) const {
    if (node == nullptr) return 0;
    int lh = heightHelper(node->left);
    int rh = heightHelper(node->right);
    return 1 + (lh > rh ? lh : rh);
}

// Delete every node and reset the tree to empty.
void BST::clear() {
    destroy(root);
    root = nullptr;
    count = 0;
}

// Post-order deletion: children are freed before their parent.
void BST::destroy(BSTNode* node) {
    if (node == nullptr) return;
    destroy(node->left);
    destroy(node->right);
    delete node;
}

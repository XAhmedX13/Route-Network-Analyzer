// test_bst.cpp
// Tests for the building-name BST: insertion, searching, deletion, traversal,
// and edge cases (empty tree, duplicates, invalid input, missing names).
// Build: g++ -std=c++11 -Wall BST.cpp test_bst.cpp -o test_bst

#include "BST.h"
#include <iostream>
using namespace std;

static int passed = 0;
static int failed = 0;

// Small helper that records and prints the result of one check.
void check(bool condition, const string& description) {
    if (condition) {
        passed++;
        cout << "[PASS] " << description << "\n";
    } else {
        failed++;
        cout << "[FAIL] " << description << "\n";
    }
}

void testEmptyTree() {
    cout << "\n--- Empty tree ---\n";
    BST tree;
    check(tree.isEmpty(), "new tree is empty");
    check(tree.size() == 0, "new tree has size 0");
    check(tree.height() == 0, "new tree has height 0");
    check(tree.search("Library") == -1, "search on empty tree returns -1");
    check(!tree.remove("Library"), "remove on empty tree returns false");
    tree.inorderTraversal();
}

void testInsertAndSearch() {
    cout << "\n--- Insert and search ---\n";
    BST tree;
    // Same example as the project description: "Library" -> 0, "CSE" -> 1, "Dorms" -> 3
    check(tree.insert("Library", 0), "insert Library");
    check(tree.insert("CSE", 1), "insert CSE");
    check(tree.insert("Sports Center", 2), "insert Sports Center");
    check(tree.insert("Dorms", 3), "insert Dorms");
    check(tree.insert("Administration", 4), "insert Administration");

    check(tree.size() == 5, "size is 5");
    check(!tree.isEmpty(), "tree is not empty");
    check(tree.search("Library") == 0, "Library -> 0");
    check(tree.search("CSE") == 1, "CSE -> 1");
    check(tree.search("Dorms") == 3, "Dorms -> 3");
    check(tree.search("Stadium") == -1, "missing building returns -1");
    check(tree.search("library") == -1, "search is case-sensitive");
    check(tree.contains("Sports Center"), "contains Sports Center");

    cout << "In-order (should be alphabetical):\n";
    tree.inorderTraversal();
}

void testDuplicatesAndInvalid() {
    cout << "\n--- Duplicates and invalid input ---\n";
    BST tree;
    tree.insert("Library", 0);
    check(!tree.insert("Library", 7), "duplicate name is rejected");
    check(tree.search("Library") == 0, "original ID kept after duplicate attempt");
    check(tree.size() == 1, "size unchanged after duplicate");
    check(!tree.insert("", 2), "empty name is rejected");
    check(!tree.insert("Lab", -1), "negative vertex ID is rejected");
    check(tree.size() == 1, "size unchanged after invalid inserts");
}

void testRemove() {
    cout << "\n--- Remove (all three cases) ---\n";
    BST tree;
    /*
                M
              /   \
             D     S
            / \   / \
           B   F P   W
    */
    tree.insert("M", 0);
    tree.insert("D", 1);
    tree.insert("S", 2);
    tree.insert("B", 3);
    tree.insert("F", 4);
    tree.insert("P", 5);
    tree.insert("W", 6);
    tree.insert("G", 7);   // F now has one child (right)

    check(tree.remove("B"), "remove leaf B");
    check(tree.search("B") == -1, "B is gone");

    check(tree.remove("F"), "remove F (one child)");
    check(tree.search("G") == 7, "G still found after its parent was removed");

    check(tree.remove("S"), "remove S (two children)");
    check(tree.search("P") == 5 && tree.search("W") == 6, "S's children still found");

    check(tree.remove("M"), "remove root M (two children)");
    check(tree.search("M") == -1, "root M is gone");
    check(tree.size() == 4, "size is 4 after four removals");

    check(!tree.remove("Z"), "removing missing name returns false");
    check(tree.size() == 4, "size unchanged after failed remove");

    cout << "Remaining (should be D, G, P, W):\n";
    tree.inorderTraversal();

    // Remove everything, including the last node.
    tree.remove("D");
    tree.remove("G");
    tree.remove("P");
    tree.remove("W");
    check(tree.isEmpty() && tree.size() == 0, "tree empty after removing all nodes");
    check(tree.insert("New", 9) && tree.search("New") == 9, "tree reusable after emptying");
}

void testSortedInsertAndClear() {
    cout << "\n--- Sorted insert (worst case) and clear ---\n";
    BST tree;
    string names[] = {"A", "B", "C", "D", "E"};
    for (int i = 0; i < 5; i++) tree.insert(names[i], i);
    check(tree.height() == 5, "sorted insertion makes a chain of height 5");
    check(tree.search("E") == 4, "deepest node still found");

    tree.clear();
    check(tree.isEmpty() && tree.size() == 0, "clear empties the tree");
    check(tree.search("A") == -1, "nothing found after clear");
}

int main() {
    testEmptyTree();
    testInsertAndSearch();
    testDuplicatesAndInvalid();
    testRemove();
    testSortedInsertAndClear();

    cout << "\n==== " << passed << " passed, " << failed << " failed ====\n";
    return failed == 0 ? 0 : 1;
}

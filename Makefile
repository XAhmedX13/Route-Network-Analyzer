# Makefile - AUC Route Network Analyzer
#
#   make            build and run every test (same as: make test)
#   make test       build and run every test
#   make app        build the program -> build/campus_app
#   make run        build the program and start it
#   make clean      delete the build folder
#   make build/test_bst   build one test only (any test name works)
#
# Run make from the repository root. On Windows, use Git Bash or WSL.

CXX      = g++
CXXFLAGS = -std=c++11 -Wall -Wextra -Wpedantic -Iinclude

BUILD = build

# Every module source except main.cpp (used by the app and test_application)
LIB_SRCS = $(filter-out src/main.cpp,$(wildcard src/*.cpp))
HEADERS  = $(wildcard include/*.h)

# Modules each test needs, so one unfinished module does not break the
# other tests. If your module uses another one, add its .cpp to your line.
DEPS_test_graph             = src/Graph.cpp
DEPS_test_campus_data       = src/CampusData.cpp src/Graph.cpp
DEPS_test_queue_stack       = src/Queue.cpp src/Stack.cpp
DEPS_test_bst               = src/BST.cpp
DEPS_test_heap              = src/MinHeap.cpp
DEPS_test_disjoint_set      = src/DisjointSet.cpp
DEPS_test_traversal         = src/Traversal.cpp src/Graph.cpp src/Queue.cpp src/Stack.cpp
DEPS_test_network_analysis  = src/NetworkAnalysis.cpp src/Traversal.cpp src/Graph.cpp src/Queue.cpp src/Stack.cpp
DEPS_test_shortest_path     = src/ShortestPath.cpp src/Graph.cpp src/MinHeap.cpp
DEPS_test_prim              = src/Prim.cpp src/Graph.cpp src/MinHeap.cpp
DEPS_test_kruskal           = src/Kruskal.cpp src/Graph.cpp src/DisjointSet.cpp
DEPS_test_application       = $(LIB_SRCS)

TESTS = test_graph test_campus_data test_queue_stack test_bst test_heap \
        test_disjoint_set test_traversal test_network_analysis \
        test_shortest_path test_prim test_kruskal test_application
TEST_BINS = $(addprefix $(BUILD)/,$(TESTS))

.PHONY: all test app run clean

all: test

$(BUILD):
	mkdir -p $(BUILD)

# ---------- Tests ----------
# One rule for every test: build/test_X = tests/test_X.cpp + DEPS_test_X
.SECONDEXPANSION:
$(BUILD)/test_%: tests/test_%.cpp $$(DEPS_test_$$*) $(HEADERS) | $(BUILD)
	$(CXX) $(CXXFLAGS) $< $(DEPS_test_$*) -o $@

test: $(TEST_BINS)
	./$(BUILD)/test_graph
	./$(BUILD)/test_campus_data
	./$(BUILD)/test_queue_stack
	./$(BUILD)/test_bst
	./$(BUILD)/test_heap
	./$(BUILD)/test_disjoint_set
	./$(BUILD)/test_traversal
	./$(BUILD)/test_network_analysis
	./$(BUILD)/test_shortest_path
	./$(BUILD)/test_prim
	./$(BUILD)/test_kruskal
	./$(BUILD)/test_application

# ---------- Application ----------
app: $(BUILD)/campus_app

$(BUILD)/campus_app: src/main.cpp $(LIB_SRCS) $(HEADERS) | $(BUILD)
	$(CXX) $(CXXFLAGS) src/main.cpp $(LIB_SRCS) -o $@

run: app
	./$(BUILD)/campus_app

clean:
	rm -rf $(BUILD)

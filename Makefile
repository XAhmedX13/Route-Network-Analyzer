CXX = g++
CXXFLAGS = -std=c++11 -Wall -Wextra -Iinclude

BUILD = build

.PHONY: all test app clean

# Default: run Milestone 1 tests
all: test

# Create build directory
$(BUILD):
	mkdir -p $(BUILD)

# MinHeap test
$(BUILD)/test_heap: tests/test_heap.cpp src/MinHeap.cpp include/MinHeap.h | $(BUILD)
	$(CXX) $(CXXFLAGS) tests/test_heap.cpp src/MinHeap.cpp -o $@

# BST test
$(BUILD)/test_bst: tests/test_bst.cpp src/BST.cpp include/BST.h | $(BUILD)
	$(CXX) $(CXXFLAGS) tests/test_bst.cpp src/BST.cpp -o $@

# Queue and Stack test
$(BUILD)/test_queue_stack: tests/test_queue_stack.cpp src/Queue.cpp src/Stack.cpp include/Queue.h include/Stack.h | $(BUILD)
	$(CXX) $(CXXFLAGS) tests/test_queue_stack.cpp src/Queue.cpp src/Stack.cpp -o $@

# Run existing tests
test: $(BUILD)/test_heap $(BUILD)/test_bst $(BUILD)/test_queue_stack
	./$(BUILD)/test_heap
	./$(BUILD)/test_bst
	./$(BUILD)/test_queue_stack

# Compile full application when ready
app: $(BUILD)/campus_app

$(BUILD)/campus_app: $(wildcard src/*.cpp) $(wildcard include/*.h) | $(BUILD)
	$(CXX) $(CXXFLAGS) $(wildcard src/*.cpp) -o $@

# Delete compiled files
clean:
	rm -rf $(BUILD)

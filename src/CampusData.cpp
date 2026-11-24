/*
 * CampusData.cpp (Ammar Taha)
 * Reads data/locations.txt and data/edges.txt into a Graph.
 * The helpers below are static, so only this file can use them.
 */

#include "CampusData.h"
#include <fstream>
#include <iostream>
#include <sstream>

// Cuts the line into words separated by spaces and stores them in fields
// >> skips any number of spaces, tabs and '\r', so "a   b\r" gives 2 words
// Returns how many words the line had, only the first maxFields are stored
// O(length of the line)
static int splitLine(const string& line, string fields[], int maxFields){
    stringstream ss(line);
    string word;
    int count = 0;
    while(ss >> word){
        if(count < maxFields) fields[count] = word; // never write past the array
        count++;
    }
    return count;
}

// Converts text like "12" to an int, false for "", "abc" or "12abc"
static bool toInt(const string& text, int& out){
    stringstream ss(text);
    int value;
    if(!(ss >> value)) return false; // not a number at all
    char extra;
    if(ss >> extra) return false; // something is left after the number
    out = value;
    return true;
}

// Same as toInt but for numbers like "120.5"
static bool toDouble(const string& text, double& out){
    stringstream ss(text);
    double value;
    if(!(ss >> value)) return false; // not a number at all
    char extra;
    if(ss >> extra) return false; // something is left after the number
    out = value;
    return true;
}

// Turns text like "RESTROOM" into LocationType::RESTROOM, false if unknown
static bool parseLocationType(const string& text, LocationType& out){
    if(text == "ENTRANCE") out = LocationType::ENTRANCE;
    else if(text == "HALLWAY") out = LocationType::HALLWAY;
    else if(text == "ROOM") out = LocationType::ROOM;
    else if(text == "CLASSROOM") out = LocationType::CLASSROOM;
    else if(text == "RESTROOM") out = LocationType::RESTROOM;
    else if(text == "ELEVATOR") out = LocationType::ELEVATOR;
    else if(text == "STAIRS") out = LocationType::STAIRS;
    else if(text == "OUTDOOR") out = LocationType::OUTDOOR;
    else if(text == "BUILDING") out = LocationType::BUILDING;
    else if(text == "CAFE") out = LocationType::CAFE;
    else if(text == "RESTAURANT") out = LocationType::RESTAURANT;
    else if(text == "VENDOR") out = LocationType::VENDOR;
    else if(text == "OTHER") out = LocationType::OTHER;
    else return false; // unknown type, we report it instead of guessing
    return true;
}

// Turns text like "STAIRS" into EdgeType::STAIRS, false if unknown
static bool parseEdgeType(const string& text, EdgeType& out){
    if(text == "WALKWAY") out = EdgeType::WALKWAY;
    else if(text == "CORRIDOR") out = EdgeType::CORRIDOR;
    else if(text == "STAIRS") out = EdgeType::STAIRS;
    else if(text == "ELEVATOR") out = EdgeType::ELEVATOR;
    else if(text == "RAMP") out = EdgeType::RAMP;
    else if(text == "OTHER") out = EdgeType::OTHER;
    else return false; // unknown type, we report it instead of guessing
    return true;
}

// Prints one error message like "data/edges.txt line 7: bad weight"
static void printError(const string& filename, int lineNumber, const string& reason){
    cout << filename << " line " << lineNumber << ": " << reason << "\n";
}

bool loadLocations(const string& filename, Graph& graph){
    ifstream file(filename);
    if(!file.is_open()){
        cout << "Cannot open " << filename << "\n";
        return false;
    }

    string line;
    int lineNumber = 0;
    while(getline(file, line)){
        lineNumber++;
        if(lineNumber == 1) continue; // the first line is the header

        string fields[10];
        int count = splitLine(line, fields, 10);
        if(count == 0) continue; // empty line
        if(count != 10){
            printError(filename, lineNumber, "expected 10 fields");
            return false;
        }

        int id;
        if(!toInt(fields[0], id)){
            printError(filename, lineNumber, "ID is not a number");
            return false;
        }
        if(id != graph.getNumVertices()){ // IDs must be 0, 1, 2, ... in order
            printError(filename, lineNumber, "expected ID " + to_string(graph.getNumVertices()));
            return false;
        }

        LocationInfo info;
        info.key = fields[1];
        info.label = fields[2];
        if(!parseLocationType(fields[3], info.type)){
            printError(filename, lineNumber, "unknown location type " + fields[3]);
            return false;
        }
        info.building = fields[4];
        if(!toInt(fields[5], info.floorIndex)){
            printError(filename, lineNumber, "floor index is not a number");
            return false;
        }
        info.floorName = fields[6];
        info.mapID = fields[7];
        if(!toDouble(fields[8], info.x) || !toDouble(fields[9], info.y)){
            printError(filename, lineNumber, "x or y is not a number");
            return false;
        }

        if(graph.addVertex(info) == -1){
            printError(filename, lineNumber, "duplicate key or the graph is full");
            return false;
        }
    }
    return true;
}

bool loadEdges(const string& filename, Graph& graph){
    ifstream file(filename);
    if(!file.is_open()){
        cout << "Cannot open " << filename << "\n";
        return false;
    }

    string line;
    int lineNumber = 0;
    while(getline(file, line)){
        lineNumber++;
        if(lineNumber == 1) continue; // the first line is the header

        string fields[5];
        int count = splitLine(line, fields, 5);
        if(count == 0) continue; // empty line
        if(count != 5){
            printError(filename, lineNumber, "expected 5 fields");
            return false;
        }

        int from, to, weight, acc;
        if(!toInt(fields[0], from) || !toInt(fields[1], to)){
            printError(filename, lineNumber, "FromID or ToID is not a number");
            return false;
        }
        if(!toInt(fields[2], weight)){
            printError(filename, lineNumber, "weight is not a number");
            return false;
        }
        EdgeType type;
        if(!parseEdgeType(fields[3], type)){
            printError(filename, lineNumber, "unknown edge type " + fields[3]);
            return false;
        }
        if(!toInt(fields[4], acc) || (acc != 0 && acc != 1)){
            printError(filename, lineNumber, "accessible must be 0 or 1");
            return false;
        }

        if(!graph.addEdge(from, to, weight, type, acc == 1)){
            printError(filename, lineNumber, "bad endpoint, weight, self loop, or duplicate edge");
            return false;
        }
    }
    return true;
}

bool loadCampusData(const string& locationFile, const string& edgeFile, Graph& graph){
    if(!loadLocations(locationFile, graph)) return false; // no point reading edges without vertices
    if(!loadEdges(edgeFile, graph)) return false;
    cout << "Loaded " << graph.getNumVertices() << " locations and "
         << graph.getNumEdges() << " edges\n";
    return true;
}

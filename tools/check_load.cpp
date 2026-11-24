#include "CampusData.h"
#include <iostream>
#include <string>
int main() {
    bool ok = true;
    const std::string p="data/test/";
    for (const std::string name : {"demo", "tiny", "disc"}) {
        Graph g(5000);
        std::string l=name=="demo" ? "data/locations.txt" : p+name+"_locations.txt";
        std::string e=name=="demo" ? "data/edges.txt" : p+name+"_edges.txt";
        std::cout << name << ": ";
        if (!loadCampusData(l,e,g)) ok=false;
    }
    for (const std::string name : {"type", "dupkey", "gap", "fields"}) {
        Graph g(5000); std::cout << "bad " << name << ": ";
        if (loadCampusData(p+"bad_"+name+"_locations.txt",p+"tiny_edges.txt",g)) ok=false;
    }
    for (const std::string name : {"weight", "text_weight", "endpoint", "access"}) {
        Graph g(5000); std::cout << "bad " << name << ": ";
        if (loadCampusData(p+"tiny_locations.txt",p+"bad_"+name+"_edges.txt",g)) ok=false;
    }
    return ok ? 0 : 1;
}

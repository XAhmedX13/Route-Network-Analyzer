"""
ADMIN_build.py
Builds the Administration building graph (Garden, Plaza, First, Second floors)
from "University maps/ADMINISTRATION BUILDING/REV01/". Writes:
  data/campus/ADMIN_locations.txt, ADMIN_edges.txt, ADMIN_entrances.txt
Positions are the PDF points of the room / stair / lobby labels on each sheet
(read with PyMuPDF; the Second floor has no text, so its points were read from
the drawing). The four sheets are aligned, so the same stair is at nearly the
same X Y on every floor. Sheets are A0 like SSE, taken as 1:200: weight = distance
in points (1 unit = 0.0706 m). Floor links: STAIRS 113, ELEVATOR 212 (estimates).
Run from the repository root.
"""

import math
import os

FLOORS = {  # code: (FloorIndex, FloorName)
    "G": (-1, "Garden"), "P": (0, "Plaza"), "F1": (1, "First"), "F2": (2, "Second"),
}

# Per floor: code, label, type, x, y
NODES = {
    "G": [
        ("EN_NW", "North_West_Entrance", "ENTRANCE", 940, 433),
        ("LOBBY_NW", "North_West_Lobby", "HALLWAY", 928, 578),
        ("ST02", "Stairs_02", "STAIRS", 1035, 941),
        ("MAIN_LOBBY", "Main_Lobby", "HALLWAY", 1164, 1063),
        ("LOBBY_C", "Elevator_Lobby", "HALLWAY", 1355, 1069),
        ("ET_A", "Passenger_Elevator", "ELEVATOR", 1275, 1122),
        ("LOBBY_ADM", "Admin_Building_Lobby", "HALLWAY", 1364, 810),
        ("MEETING_N", "Meeting_Room_North", "ROOM", 1482, 590),
        ("LOBBY_E", "East_Lobby", "HALLWAY", 1637, 872),
        ("EN_NE", "North_East_Entrance", "ENTRANCE", 1606, 606),
        ("LOUNGE", "Alumni_Lounge", "ROOM", 1759, 597),
        ("WC_E1", "Restroom_East_1", "RESTROOM", 1731, 958),
        ("WC_E2", "Restroom_East_2", "RESTROOM", 1805, 1099),
        ("CORR_1", "Corridor_Middle", "HALLWAY", 1400, 1426),
        ("REC", "Reception_Waiting", "ROOM", 1545, 1595),
        ("ST04", "Stairs_04", "STAIRS", 1232, 1622),
        ("EN_E", "East_Entrance", "ENTRANCE", 1807, 1598),
        ("LOBBY_S1", "South_Lobby_1", "HALLWAY", 1497, 1715),
        ("MEETING_S", "Meeting_Room_South", "ROOM", 1806, 1812),
        ("LOBBY_S2", "South_Lobby_2", "HALLWAY", 1283, 2090),
        ("MAIN_EN", "Main_Entrance", "ENTRANCE", 1390, 2205),
        ("LOBBY_S3", "South_Lobby_3", "HALLWAY", 1541, 2163),
        ("WC_S1", "Restroom_South_1", "RESTROOM", 1683, 2153),
        ("WC_S2", "Restroom_South_2", "RESTROOM", 1666, 2213),
        ("ST_W", "Stairs_West", "STAIRS", 806, 2113),
        ("LOBBY_S4", "South_Lobby_4", "HALLWAY", 1291, 2529),
        ("ST03", "Stairs_03", "STAIRS", 1157, 2527),
        ("ST06", "Stairs_06", "STAIRS", 1092, 2509),
        ("LOBBY_SW", "South_West_Lobby", "HALLWAY", 1226, 2785),
        ("MEETING_SW", "Meeting_Room_South_West", "ROOM", 1360, 2770),
        ("ENT_LOBBY", "Entrance_Lobby", "HALLWAY", 1208, 2862),
        ("ST01", "Stairs_01", "STAIRS", 990, 2828),
        ("WC_SW1", "Restroom_South_West_1", "RESTROOM", 743, 2770),
        ("WC_SW2", "Restroom_South_West_2", "RESTROOM", 1132, 2794),
        ("COFFEE", "Coffee_Corner", "CAFE", 1708, 2813),
    ],
    "P": [
        ("WC_N1", "Restroom_North_1", "RESTROOM", 1249, 453),
        ("WC_N2", "Restroom_North_2", "RESTROOM", 1375, 458),
        ("LOBBY_N", "North_Lobby", "HALLWAY", 1372, 544),
        ("WAITING", "Waiting_Room", "ROOM", 1257, 629),
        ("LOBBY_N2", "North_Lobby_2", "HALLWAY", 1372, 632),
        ("LOBBY_ADM", "Admin_Building_Lobby", "HALLWAY", 1365, 806),
        ("LOBBY_VIP", "VIP_Lobby", "HALLWAY", 1137, 1052),
        ("EN_VIP", "VIP_Entrance", "ENTRANCE", 1026, 1230),
        ("ST02", "Stairs_02", "STAIRS", 1035, 938),
        ("CORR_W", "Corridor_West", "HALLWAY", 947, 840),
        ("CONF", "Conference_Room_Elting_Laflin_Treat", "ROOM", 1044, 699),
        ("LOBBY_E", "East_Lobby", "HALLWAY", 1631, 869),
        ("WC_E1", "Restroom_East_1", "RESTROOM", 1817, 865),
        ("WC_E2", "Restroom_East_2", "RESTROOM", 1789, 992),
        ("LOBBY_C", "Elevator_Lobby", "HALLWAY", 1322, 1086),
        ("ET_A", "Passenger_Elevator", "ELEVATOR", 1275, 1122),
        ("CORR_1", "Corridor_Middle", "HALLWAY", 1391, 1439),
        ("ST04", "Stairs_04", "STAIRS", 1298, 1600),
        ("CORR_2", "Corridor_South_1", "HALLWAY", 1494, 1729),
        ("MEETING_E", "Meeting_Room_East", "ROOM", 1676, 1863),
        ("CORR_3", "Corridor_South_2", "HALLWAY", 1348, 1927),
        ("LOBBY_S2", "South_Lobby_2", "HALLWAY", 1277, 2084),
        ("ST_W", "Stairs_West", "STAIRS", 806, 2114),
        ("CORR_4", "Corridor_South_3", "HALLWAY", 1462, 2090),
        ("LOBBY_S3", "South_Lobby_3", "HALLWAY", 1548, 2130),
        ("WC_S1", "Restroom_South_1", "RESTROOM", 1688, 2148),
        ("WC_S2", "Restroom_South_2", "RESTROOM", 1673, 2212),
        ("BRIDGE", "Bridge", "HALLWAY", 1493, 2290),
        ("LOBBY_S5", "South_Lobby_5", "HALLWAY", 1457, 2436),
        ("LOBBY_SW1", "South_West_Lobby_1", "HALLWAY", 1081, 2358),
        ("ST03", "Stairs_03", "STAIRS", 1175, 2523),
        ("WAIT_S", "Seating_Waiting_Area", "ROOM", 1270, 2602),
        ("EN_S", "South_Entrance", "ENTRANCE", 1196, 2854),
        ("WC_SW2", "Restroom_South_West_2", "RESTROOM", 1130, 2783),
        ("WC_SW3", "Restroom_South_West_3", "RESTROOM", 1281, 2889),
        ("LOBBY_SW2", "South_West_Lobby_2", "HALLWAY", 904, 2809),
        ("ST01", "Stairs_01", "STAIRS", 985, 2897),
        ("ET_B", "Service_Elevator", "ELEVATOR", 913, 2882),
        ("CORR_S", "Corridor_South_West", "HALLWAY", 883, 2724),
        ("WC_SW1", "Restroom_South_West_1", "RESTROOM", 740, 2772),
    ],
    "F1": [
        ("WC_N1", "Restroom_North_1", "RESTROOM", 1589, 412),
        ("WC_N2", "Restroom_North_2", "RESTROOM", 1595, 459),
        ("CONF_NE", "Conference_Room_North_East", "ROOM", 1627, 599),
        ("LOBBY_N", "North_Lobby", "HALLWAY", 1371, 678),
        ("LOBBY_ADM", "Admin_Building_Lobby", "HALLWAY", 1359, 751),
        ("CONF_W", "Conference_Room_West", "ROOM", 1043, 708),
        ("CORR_W", "Corridor_West", "HALLWAY", 870, 841),
        ("WC_W1", "Restroom_West_1", "RESTROOM", 588, 890),
        ("WC_W2", "Restroom_West_2", "RESTROOM", 765, 891),
        ("ST02", "Stairs_02", "STAIRS", 1041, 936),
        ("ST05", "Stairs_05", "STAIRS", 1730, 811),
        ("EN_E", "Arnold_Terrace_Entrance", "ENTRANCE", 1643, 881),
        ("LOBBY_C", "Elevator_Lobby", "HALLWAY", 1306, 1050),
        ("ET_A", "Passenger_Elevator", "ELEVATOR", 1275, 1122),
        ("CONF_C", "Conference_Room_Central", "ROOM", 1509, 1187),
        ("WC_C", "Restroom_Central", "RESTROOM", 1300, 1263),
        ("CORR_2", "Corridor_Middle_West", "HALLWAY", 1347, 1529),
        ("CORR_1", "Corridor_Middle_East", "HALLWAY", 1463, 1490),
        ("ST04", "Stairs_04", "STAIRS", 1288, 1620),
        ("BACON", "Bacon_Crary_Room", "ROOM", 1534, 1657),
        ("LOUNGE", "Lounge", "ROOM", 1516, 1722),
        ("CORR_3", "Corridor_South_1", "HALLWAY", 1299, 1987),
        ("WC_S0", "Restroom_South_0", "RESTROOM", 1170, 1986),
        ("MEET_S", "Meeting_Room_South", "ROOM", 1430, 2060),
        ("EN_S1", "South_East_Entrance", "ENTRANCE", 1532, 2163),
        ("WC_S1", "Restroom_South_1", "RESTROOM", 1687, 2151),
        ("WC_S2", "Restroom_South_2", "RESTROOM", 1669, 2207),
        ("BRIDGE", "Bridge", "HALLWAY", 1494, 2284),
        ("CORR_4", "Corridor_South_2", "HALLWAY", 1371, 2392),
        ("CONF_S", "Conference_Room_South", "ROOM", 1315, 2438),
        ("LOBBY_S", "South_Lobby", "HALLWAY", 1404, 2512),
        ("ST03", "Stairs_03", "STAIRS", 1157, 2524),
        ("CORR_5", "Corridor_South_West", "HALLWAY", 1228, 2752),
        ("WC_SW2", "Restroom_South_West_2", "RESTROOM", 1127, 2800),
        ("LOBBY_SW", "South_West_Lobby", "HALLWAY", 899, 2801),
        ("ST01", "Stairs_01", "STAIRS", 998, 2807),
        ("ET_B", "Service_Elevator", "ELEVATOR", 913, 2882),
        ("WC_SW1", "Restroom_South_West_1", "RESTROOM", 762, 2777),
        ("MEET_SW", "Meeting_Room_South_West", "ROOM", 844, 2521),
        ("RECEP", "Reception_Waiting", "ROOM", 1452, 2883),
    ],
    "F2": [
        ("HALL_NW", "Open_Office_North_West", "ROOM", 640, 719),
        ("ST02", "Stairs_02", "STAIRS", 1056, 989),
        ("LOBBY_ADM", "Admin_Building_Lobby", "HALLWAY", 1326, 854),
        ("LOBBY_C", "Elevator_Lobby", "HALLWAY", 1300, 1060),
        ("ET_A", "Passenger_Elevator", "ELEVATOR", 1247, 1124),
        ("CORR_1", "Corridor_Middle", "HALLWAY", 1350, 1450),
        ("ST04", "Stairs_04", "STAIRS", 1213, 1595),
        ("CORR_2", "Corridor_South_1", "HALLWAY", 1300, 1950),
        ("CONF", "Conference_Room_South", "ROOM", 1371, 2270),
        ("LOBBY_S", "South_Lobby", "HALLWAY", 1440, 2470),
        ("ST03", "Stairs_03", "STAIRS", 1169, 2472),
        ("CORR_S", "Corridor_South_West", "HALLWAY", 1056, 2697),
        ("ST01", "Stairs_01", "STAIRS", 989, 2832),
        ("ET_B", "Service_Elevator", "ELEVATOR", 899, 2888),
    ],
}

EDGES = {
    "G": [
        ("EN_NW", "LOBBY_NW"), ("LOBBY_NW", "ST02"), ("ST02", "MAIN_LOBBY"), ("MAIN_LOBBY", "LOBBY_C"),
        ("LOBBY_C", "ET_A"), ("LOBBY_C", "LOBBY_ADM"), ("LOBBY_ADM", "MEETING_N"), ("LOBBY_ADM", "LOBBY_E"),
        ("LOBBY_E", "EN_NE"), ("LOBBY_E", "LOUNGE"), ("LOBBY_E", "WC_E1"), ("LOBBY_E", "WC_E2"),
        ("LOBBY_C", "CORR_1"), ("CORR_1", "REC"), ("CORR_1", "ST04"), ("REC", "EN_E"), ("REC", "LOBBY_S1"),
        ("LOBBY_S1", "MEETING_S"), ("LOBBY_S1", "LOBBY_S3"), ("ST04", "LOBBY_S2"), ("LOBBY_S2", "MAIN_EN"),
        ("MAIN_EN", "LOBBY_S3"), ("LOBBY_S3", "WC_S1"), ("LOBBY_S3", "WC_S2"), ("LOBBY_S2", "ST_W"),
        ("LOBBY_S2", "LOBBY_S4"), ("LOBBY_S4", "ST03"), ("LOBBY_S4", "ST06"), ("LOBBY_S4", "LOBBY_SW"),
        ("LOBBY_SW", "MEETING_SW"), ("LOBBY_SW", "ENT_LOBBY"), ("ENT_LOBBY", "ST01"), ("ST01", "WC_SW1"),
        ("LOBBY_SW", "WC_SW2"), ("ENT_LOBBY", "COFFEE"),
    ],
    "P": [
        ("WC_N1", "LOBBY_N"), ("WC_N2", "LOBBY_N"), ("LOBBY_N", "LOBBY_N2"), ("LOBBY_N2", "WAITING"),
        ("LOBBY_N2", "LOBBY_ADM"), ("LOBBY_ADM", "LOBBY_VIP"), ("LOBBY_VIP", "ST02"), ("ST02", "CORR_W"),
        ("CORR_W", "CONF"), ("LOBBY_VIP", "EN_VIP"), ("LOBBY_ADM", "LOBBY_E"), ("LOBBY_E", "WC_E1"),
        ("LOBBY_E", "WC_E2"), ("LOBBY_ADM", "LOBBY_C"), ("LOBBY_C", "ET_A"), ("LOBBY_C", "CORR_1"),
        ("CORR_1", "ST04"), ("CORR_1", "CORR_2"), ("CORR_2", "MEETING_E"), ("CORR_2", "CORR_3"),
        ("CORR_3", "LOBBY_S2"), ("CORR_3", "CORR_4"), ("LOBBY_S2", "ST_W"), ("CORR_4", "LOBBY_S3"),
        ("LOBBY_S3", "WC_S1"), ("LOBBY_S3", "WC_S2"), ("CORR_4", "BRIDGE"), ("BRIDGE", "LOBBY_S5"),
        ("LOBBY_S5", "WAIT_S"), ("WAIT_S", "ST03"), ("LOBBY_S2", "LOBBY_SW1"), ("LOBBY_SW1", "ST03"),
        ("WAIT_S", "EN_S"), ("EN_S", "WC_SW2"), ("EN_S", "WC_SW3"), ("EN_S", "LOBBY_SW2"),
        ("LOBBY_SW2", "ST01"), ("LOBBY_SW2", "ET_B"), ("LOBBY_SW2", "CORR_S"), ("CORR_S", "WC_SW1"),
    ],
    "F1": [
        ("WC_N1", "LOBBY_N"), ("WC_N2", "LOBBY_N"), ("CONF_NE", "LOBBY_N"), ("LOBBY_N", "LOBBY_ADM"),
        ("LOBBY_ADM", "CONF_W"), ("CONF_W", "CORR_W"), ("CORR_W", "WC_W1"), ("CORR_W", "WC_W2"),
        ("LOBBY_ADM", "ST02"), ("LOBBY_ADM", "ST05"), ("ST05", "EN_E"), ("LOBBY_ADM", "LOBBY_C"),
        ("LOBBY_C", "ET_A"), ("LOBBY_C", "CONF_C"), ("LOBBY_C", "WC_C"), ("LOBBY_C", "CORR_2"),
        ("CORR_2", "CORR_1"), ("CORR_2", "ST04"), ("CORR_1", "BACON"), ("CORR_1", "LOUNGE"),
        ("ST04", "CORR_3"), ("CORR_3", "WC_S0"), ("CORR_3", "MEET_S"), ("MEET_S", "EN_S1"),
        ("EN_S1", "WC_S1"), ("EN_S1", "WC_S2"), ("MEET_S", "BRIDGE"), ("BRIDGE", "CORR_4"),
        ("CORR_4", "CONF_S"), ("CORR_4", "LOBBY_S"), ("LOBBY_S", "ST03"), ("ST03", "CORR_5"),
        ("CORR_5", "WC_SW2"), ("CORR_5", "LOBBY_SW"), ("LOBBY_SW", "ST01"), ("LOBBY_SW", "ET_B"),
        ("LOBBY_SW", "WC_SW1"), ("MEET_SW", "LOBBY_SW"), ("CORR_5", "RECEP"),
    ],
    "F2": [
        ("HALL_NW", "ST02"), ("ST02", "LOBBY_ADM"), ("LOBBY_ADM", "LOBBY_C"), ("LOBBY_C", "ET_A"),
        ("LOBBY_C", "CORR_1"), ("CORR_1", "ST04"), ("CORR_1", "CORR_2"), ("CORR_2", "CONF"),
        ("CONF", "LOBBY_S"), ("LOBBY_S", "ST03"), ("ST03", "CORR_S"), ("CORR_S", "ST01"), ("CORR_S", "ET_B"),
    ],
}

# Shafts matched by position across the aligned sheets: code, floors, type
SHAFTS = [
    ("ST01", ["G", "P", "F1", "F2"], "STAIRS"),
    ("ST02", ["G", "P", "F1", "F2"], "STAIRS"),
    ("ST03", ["G", "P", "F1", "F2"], "STAIRS"),
    ("ST04", ["G", "P", "F1", "F2"], "STAIRS"),
    ("ST_W", ["G", "P"], "STAIRS"),
    ("ET_A", ["G", "P", "F1", "F2"], "ELEVATOR"),
    ("ET_B", ["P", "F1", "F2"], "ELEVATOR"),
]

# Entrance key suffix, side as seen on Campus Layout.pdf, description
ENTRANCES = [
    ("G", "EN_NW", "N", "North_West_Door"),
    ("G", "EN_NE", "E", "North_East_Door"),
    ("G", "EN_E", "E", "East_Door"),
    ("G", "MAIN_EN", "E", "Main_Entrance"),
    ("P", "EN_VIP", "W", "VIP_Entrance_Administration_Plaza"),
    ("P", "EN_S", "S", "South_Entrance"),
    ("F1", "EN_E", "E", "Arnold_Terrace_Door"),
    ("F1", "EN_S1", "SE", "South_East_Door"),
]


def main():
    ids, rows, pos = {}, [], {}
    for floor, nodes in NODES.items():
        index, name = FLOORS[floor]
        for code, label, kind, x, y in nodes:
            key = f"ADMIN_{floor}_{code}"
            ids[key] = len(rows)
            pos[key] = (x, y)
            rows.append(f"{len(rows)} {key} {label} {kind} ADMIN {index} {name} ADMIN_{floor} {x} {y}")

    edges = []
    for floor, pairs in EDGES.items():
        for a, b in pairs:
            ka, kb = f"ADMIN_{floor}_{a}", f"ADMIN_{floor}_{b}"
            weight = max(1, round(math.dist(pos[ka], pos[kb])))
            edges.append(f"{ids[ka]} {ids[kb]} {weight} CORRIDOR 1")
    for code, floors, kind in SHAFTS:
        for lower, upper in zip(floors, floors[1:]):
            ka, kb = f"ADMIN_{lower}_{code}", f"ADMIN_{upper}_{code}"
            weight, access = (113, 0) if kind == "STAIRS" else (212, 1)
            edges.append(f"{ids[ka]} {ids[kb]} {weight} {kind} {access}")

    folder = os.path.join("data", "campus")
    with open(os.path.join(folder, "ADMIN_locations.txt"), "w", encoding="utf-8", newline="\n") as f:
        f.write("ID Key Label Type Building FloorIndex FloorName MapID X Y\n" + "\n".join(rows) + "\n")
    with open(os.path.join(folder, "ADMIN_edges.txt"), "w", encoding="utf-8", newline="\n") as f:
        f.write("FromID ToID Weight EdgeType Accessible\n" + "\n".join(edges) + "\n")
    with open(os.path.join(folder, "ADMIN_entrances.txt"), "w", encoding="utf-8", newline="\n") as f:
        f.write("Key Side Description\n")
        for floor, code, side, text in ENTRANCES:
            f.write(f"ADMIN_{floor}_{code} {side} {text}\n")
    print(f"ADMIN: {len(rows)} locations, {len(edges)} edges, {len(ENTRANCES)} entrances")


if __name__ == "__main__":
    main()

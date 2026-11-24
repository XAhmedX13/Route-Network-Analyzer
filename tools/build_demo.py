from pathlib import Path
import math

root = Path(__file__).resolve().parents[1]
out = root / 'data'
# Positions are near doors/landings, in the original unrotated PDF coordinate system.
rows = [
('P','ST03','Stairs_03','STAIRS',270,225),('P','ET03','Freight_Elevator_03','ELEVATOR',220,267),('P','Lobby_ORP01','Elevator_Lobby','HALLWAY',260,265),('P','CorrW','Corridor_West','HALLWAY',310,265),('P','CorrMid','Corridor_Middle','HALLWAY',610,265),('P','CorrCross','Corridor_Crossing','HALLWAY',1010,265),('P','CorrE','Corridor_East','HALLWAY',1150,265),('P','P106','Lab_Faculty_Research_P106','ROOM',370,296),('P','P101','Lab_Intro_Chemistry_P101','ROOM',373,237),('P','P095','Lab_Intro_Science_P095','ROOM',694,237),('P','CP47','Classroom_CP47','CLASSROOM',1120,237),('P','CP48','Classroom_CP48','CLASSROOM',1045,297),('P','P089','Men_Restroom_P089','RESTROOM',1144,319),('P','P090','Women_Restroom_P090','RESTROOM',1144,370),('P','ST05','Stairs_05','STAIRS',1260,330),
('F1','ST03','Stairs_03','STAIRS',270,225),('F1','ET03','Freight_Elevator_03','ELEVATOR',220,267),('F1','Lobby_OS101','Elevator_Lobby','HALLWAY',260,265),('F1','CorrW','Corridor_West','HALLWAY',310,265),('F1','CorrMid','Corridor_Middle','HALLWAY',610,265),('F1','CorrCross','Lobby_OS111','HALLWAY',1010,265),('F1','CorrE','Corridor_East','HALLWAY',1150,265),('F1','1214','Lab_Organic_1214','ROOM',373,237),('F1','1222','Lab_Faculty_Research_1222','ROOM',330,297),('F1','1204','Lab_Physical_Chemistry_1204','ROOM',780,237),('F1','1205','Lab_Biochemistry_1205','ROOM',875,297),('F1','1197','Lab_Rock_1197','ROOM',1135,237),('F1','1196','Meeting_Room_1196','ROOM',1218,237),('F1','1198','Men_Restroom_1198','RESTROOM',1144,320),('F1','1199','Women_Restroom_1199','RESTROOM',1144,370),('F1','ST05','Stairs_05','STAIRS',1260,330)]
# Corridor paths bend at door alignments, rather than crossing walls.
ids = {f'{r[0]}_{r[1]}': i for i,r in enumerate(rows)}
edges=[]
def add(a,b,via=(),kind='CORRIDOR',access=1,weight=None):
    i,j=ids[a],ids[b]; p=[rows[i][4:6],*via,rows[j][4:6]]
    w=weight or max(1,round(sum(math.dist(x,y) for x,y in zip(p,p[1:]))))
    edges.append((i,j,w,kind,access,p))
for floor in ('P','F1'):
    def link(a,b,via=()): add(floor+'_'+a,floor+'_'+b,via)
    lobby='Lobby_ORP01' if floor=='P' else 'Lobby_OS101'
    for a,b in [('ET03',lobby),(lobby,'CorrW'),('ST03','CorrW'),('ST03',lobby),('CorrW','CorrMid'),('CorrMid','CorrCross'),('CorrCross','CorrE')]:
        link(a,b, ([(298,225),(298,265)] if a=='ST03' else ()))
    link('CorrE','ST05',[(1280,265),(1318,300),(1318,330)])
    rooms = [('P106','CorrW'),('P101','CorrW'),('P095','CorrMid'),('CP47','CorrE'),('CP48','CorrCross'),('P089','CorrE'),('P090','CorrE')] if floor=='P' else [('1214','CorrW'),('1222','CorrW'),('1204','CorrMid'),('1205','CorrMid'),('1197','CorrE'),('1196','CorrE'),('1198','CorrE'),('1199','CorrE')]
    for room,corr in rooms:
        x,y=rows[ids[floor+'_'+room]][4:6]
        # Restrooms open into a small north-south passage west of their block.
        link(corr,room,([(1130,265),(1130,y)] if room in ('P089','P090','1198','1199') else [(x,265)]))
add('P_ST03','F1_ST03',kind='STAIRS',access=0,weight=113)
add('P_ST05','F1_ST05',kind='STAIRS',access=0,weight=113)
add('P_ET03','F1_ET03',kind='ELEVATOR',weight=212)
with (out/'locations.txt').open('w') as f:
    f.write('ID Key Label Type Building FloorIndex FloorName MapID X Y\n')
    for i,(floor,code,label,typ,x,y) in enumerate(rows):
        f.write(f'{i} SSE_{floor}_{code} {label} {typ} SSE {0 if floor=="P" else 1} {"Plaza" if floor=="P" else "First"} SSE_{floor} {x:g} {y:g}\n')
with (out/'edges.txt').open('w') as f:
    f.write('FromID ToID Weight EdgeType Accessible\n')
    for i,j,w,k,a,_ in edges: f.write(f'{i} {j} {w} {k} {a}\n')



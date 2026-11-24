from pathlib import Path
p=Path('data/test'); p.mkdir(parents=True,exist_ok=True)
lh='ID Key Label Type Building FloorIndex FloorName MapID X Y\n'
eh='FromID ToID Weight EdgeType Accessible\n'
rows=[f'{i} T_{i} Node_{i} HALLWAY TEST 0 Plaza TEST_P {i} 0' for i in range(7)]
edges=['0 1 4 CORRIDOR 1','0 2 2 CORRIDOR 1','1 2 1 CORRIDOR 1','1 3 5 CORRIDOR 1','2 3 8 CORRIDOR 1','2 4 10 CORRIDOR 1','3 4 2 CORRIDOR 1','3 5 6 CORRIDOR 1']
def write(name,s): (p/name).write_text(s,encoding='utf-8')
write('tiny_locations.txt',lh+'\n'.join(rows[:6])+'\n')
write('tiny_edges.txt',eh+'\n'.join(edges)+'\n')
write('disc_locations.txt',lh+'\n'.join(rows)+'\n')
write('disc_edges.txt',eh+'\n'.join(edges)+'\n')
write('bad_type_locations.txt',lh+rows[0].replace('HALLWAY','RESTROM')+'\n')
write('bad_dupkey_locations.txt',lh+rows[0]+'\n'+rows[1].replace('T_1','T_0')+'\n')
write('bad_gap_locations.txt',lh+rows[0]+'\n'+rows[2]+'\n')
write('bad_fields_locations.txt',lh+' '.join(rows[0].split()[:-1])+'\n')
for name,line in [('weight','0 1 -5 CORRIDOR 1'),('text_weight','0 1 abc CORRIDOR 1'),('endpoint','0 99 1 CORRIDOR 1'),('access','0 1 1 CORRIDOR 2')]: write('bad_'+name+'_edges.txt',eh+line+'\n')
write('ANSWERS.md','# Tiny graph answers\n\nFrom vertex 0: distances are 0, 3, 2, 8, 10, 14 for vertices 0 through 5.\nOne shortest path to 5 is 0 -> 2 -> 1 -> 3 -> 5, total 14.\nThe MST has total weight 16: edges 0-2 (2), 1-2 (1), 1-3 (5), 3-4 (2), and 3-5 (6). Prim and Kruskal agree.\n')

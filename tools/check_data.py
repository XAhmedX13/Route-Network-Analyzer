from pathlib import Path
from collections import defaultdict
import heapq

def check(loc, edge):
    ls=[x.split() for x in Path(loc).read_text().splitlines()[1:] if x.strip()]
    es=[x.split() for x in Path(edge).read_text().splitlines()[1:] if x.strip()]
    types=set('ENTRANCE HALLWAY ROOM CLASSROOM RESTROOM ELEVATOR STAIRS OUTDOOR BUILDING CAFE RESTAURANT VENDOR OTHER'.split())
    assert all(len(r)==10 for r in ls) and all(len(r)==5 for r in es)
    assert [int(r[0]) for r in ls]==list(range(len(ls)))
    assert len({r[1] for r in ls})==len(ls)
    for r in ls: assert r[3] in types and int(r[5])==int(r[5]) and all(float(x)==float(x) for x in r[8:])
    adj=defaultdict(list); seen=set()
    for a,b,w,t,acc in es:
        a,b,w,acc=int(a),int(b),int(w),int(acc)
        assert 0<=a<len(ls) and 0<=b<len(ls) and a!=b and w>0 and acc in (0,1)
        assert t in 'WALKWAY CORRIDOR STAIRS ELEVATOR RAMP OTHER'.split()
        assert t!='STAIRS' or acc==0
        assert t not in ('ELEVATOR','RAMP') or acc==1
        key=tuple(sorted((a,b))); assert key not in seen; seen.add(key)
        adj[a].append((b,w,t,acc)); adj[b].append((a,w,t,acc))
    def components(nodes):
        remaining=set(nodes); n=0
        while remaining:
            n+=1; todo=[remaining.pop()]
            while todo:
                for v,_,_,_ in adj[todo.pop()]:
                    if v in remaining: remaining.remove(v); todo.append(v)
        return n
    print(loc, len(ls),'vertices',len(es),'edges; building components:',components(range(len(ls))))
    for floor in sorted({r[7] for r in ls}):
        print(' ',floor,'components:',components(i for i,r in enumerate(ls) if r[7]==floor))
    def route(start,end,accessible):
        q=[(0,start,[])]; best={}
        while q:
            d,u,path=heapq.heappop(q)
            if u in best: continue
            best[u]=d; path=path+[u]
            if u==end: return d,path
            for v,w,t,a in adj[u]:
                if v not in best and (not accessible or a): heapq.heappush(q,(d+w,v,path))
    if loc=='data/locations.txt':
        for a in range(len(ls)):
            for b in range(a+1,len(ls)):
                if ls[a][3]!='ROOM' or ls[b][3]!='ROOM' or ls[a][5]==ls[b][5]: continue
                x=route(a,b,False); y=route(a,b,True)
                if x and y and x[0]<y[0] and any(tuple(sorted((u,v))) in {tuple(sorted((int(e[0]),int(e[1])))) for e in es if e[3]=='STAIRS'} for u,v in zip(x[1],x[1][1:])):
                    print('route',ls[a][1],ls[b][1],x,y); return
        raise AssertionError('no requested route pair')

if __name__=='__main__':
    check('data/locations.txt','data/edges.txt')
    for n in ('tiny','disc'): check(f'data/test/{n}_locations.txt',f'data/test/{n}_edges.txt')

import sys, math, pathlib, collections
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent / '.pylib'))
import pymupdf as fitz

ROOT = pathlib.Path(__file__).resolve().parent.parent
IDS = ['SSE_P','SSE_F1','SSE_F2','ADMIN_G','ADMIN_P','ADMIN_F1','ADMIN_F2']
SSE = ROOT / 'University maps/SCHOOL OF SCIENCES AND ENGINEERING'
ADMIN = ROOT / 'University maps/ADMINISTRATION BUILDING/REV01'
PLANS = {
 'SSE_P': SSE/'20220808 - SSE USER PLANS - BASE DRAWING - PLAZA FLOOR-Layout1.pdf',
 'SSE_F1': SSE/'20220808 - SSE USER PLANS - BASE DRAWING - FIRST FLOOR-Layout1.pdf',
 'SSE_F2': SSE/'20220808 - SSE USER PLANS - BASE DRAWING - SECOND FLOOR-Layout1.pdf',
 'ADMIN_G': ADMIN/'ADMIN BUILDING - GARDEN LEVEL-Model.pdf',
 'ADMIN_P': ADMIN/'ADMIN BUILDING - PLAZA FLOOR LEVEL-Model.pdf',
 'ADMIN_F1': ADMIN/'ADMIN BUILDING - FIRST FLOOR LEVEL-Model.pdf',
 'ADMIN_F2': ADMIN/'ADMIN BUILDING - SECOND FLOOR LEVEL-Model.pdf',
}
COLORS = {'ROOM':(0.08,.31,.75),'CLASSROOM':(.40,.20,.75),'RESTROOM':(.65,.08,.55), 'STAIRS':(.77,.09,.08),'ELEVATOR':(.03,.49,.20),'ENTRANCE':(.02,.48,.52),'CORRIDOR':(.8,.42,.03),'DOOR':(.37,.37,.37),'OTHER':(.27,.28,.32)}

def read_rows(name):
 with open(ROOT/name, encoding='utf-8') as f:
  next(f)
  return [line.split() for line in f if line.strip()]
locations=read_rows('data/campus/all_locations.txt'); edges=read_rows('data/campus/all_edges.txt')
byid={v[0]:v for v in locations}

def category(v):
 k=v[1]; t=v[3]
 if t=='HALLWAY': return 'DOOR' if k.endswith('_D') or v[2].lower().startswith('door_') else 'CORRIDOR'
 return t if t in COLORS else 'OTHER'

def cross(a,b): return a.x*b.y-a.y*b.x

def intersections(a,b,walls):
 # Intersection in stored (unrotated) page coordinates. Ignore touching ends and near-parallel lines.
 v=b-a; L=abs(v)
 if L<1: return []
 hits=[]
 for c,d in walls:
  if max(a.x,b.x)+1<min(c.x,d.x) or min(a.x,b.x)-1>max(c.x,d.x) or max(a.y,b.y)+1<min(c.y,d.y) or min(a.y,b.y)-1>max(c.y,d.y): continue
  w=d-c; den=cross(v,w)
  if abs(den)<.12*L*abs(w): continue
  t=cross(c-a,w)/den; u=cross(c-a,v)/den
  if 3/L<t<1-3/L and 1/abs(w)<u<1-1/abs(w): hits.append(t*L)
 hits.sort(); unique=[]
 for h in hits:
  if not unique or h-unique[-1]>5: unique.append(h)
 return unique

def walls_for(p):
 walls=[]
 for d in p.get_drawings():
  color=d.get('color')
  if not color or max(color)>.16: continue
  for item in d['items']:
   if item[0]=='l' and abs(item[2]-item[1])>=30: walls.append((item[1],item[2]))
 return walls

def overlaps(r,occupied):
 return sum(max(0,min(r.x1,q.x1)-max(r.x0,q.x0))*max(0,min(r.y1,q.y1)-max(r.y0,q.y0)) for q in occupied if r.intersects(q))

def run(mid):
 vs=[v for v in locations if v[7]==mid]; vset={v[0] for v in vs}
 es=[e for e in edges if e[0] in vset and e[1] in vset]
 links=[e for e in edges if (e[0] in vset) != (e[1] in vset) and e[3] in ('STAIRS','ELEVATOR') and byid[e[0]][7]!=byid[e[1]][7]]
 linked={e[0] if e[0] in vset else e[1] for e in links}
 src=fitz.open(PLANS[mid]); pp=src[0]; walls=walls_for(pp)
 # Data are upright; use derotation_matrix to compare against stored plan vectors.
 stored={v[0]:fitz.Point(float(v[8]),float(v[9]))*pp.derotation_matrix for v in vs}
 upright={v[0]:stored[v[0]]*pp.rotation_matrix for v in vs}
 suspects=[]; hits={}
 for e in es:
  h=intersections(stored[e[0]],stored[e[1]],walls); hits[(e[0],e[1])]=h
  if h: suspects.append((len(h),abs(stored[e[0]]-stored[e[1]]),e))
 suspects.sort(key=lambda x:(-x[0],-x[1],x[2][0],x[2][1]))
 W,H=pp.rect.width,pp.rect.height; header=90; side=360
 out=fitz.open(); page=out.new_page(width=W+side,height=H+header)
 # Preserve upright rendering including the original sheet's rotation.
 pix=pp.get_pixmap(matrix=fitz.Matrix(1,1),alpha=False)
 page.insert_image(fitz.Rect(0,header,W,H+header),stream=pix.tobytes('png'))
 page.draw_rect(fitz.Rect(0,header,W,H+header),color=None,fill=(1,1,1),fill_opacity=.68,overlay=True)
 page.draw_rect(fitz.Rect(W,0,W+side,H+header),color=None,fill=(.965,.975,.985))
 page.insert_text((32,37),f'{mid.replace("_", " / ")}  |  {vs[0][6]} floor',fontsize=24,fontname='hebo',color=(.08,.15,.24))
 page.insert_text((32,67),f'{len(vs)} locations  |  {len(es)} same-floor edges  |  {len(suspects)} suspect wall-crossing edges',fontsize=15,color=(.18,.23,.28))
 def pt(vid):
  p=upright[vid]; return fitz.Point(p.x,p.y+header)
 for e in es:
  a,b=pt(e[0]),pt(e[1]); suspect=bool(hits[(e[0],e[1])]); typ=e[3]
  color=(.90,.23,.02) if suspect else ((.75,.08,.06) if typ=='STAIRS' else ((.02,.48,.17) if typ=='ELEVATOR' else (.20,.23,.26)))
  page.draw_line(a,b,color=color,width=1.7 if suspect else 1.0,dashes='[6 4] 0' if typ=='STAIRS' else None,overlay=True)
 # Dots and linked-floor rings.
 for v in vs:
  p=pt(v[0]); col=COLORS[category(v)]; page.draw_circle(p,3.2,color=(1,1,1),fill=col,width=.65)
  if v[0] in linked and v[3] in ('STAIRS','ELEVATOR'): page.draw_circle(p,7,color=col,width=1.4)
 # Place most meaningful labels first, then door and corridor points; keep every vertex labelled.
 occupied=[fitz.Rect(pt(v[0]).x-4, pt(v[0]).y-4, pt(v[0]).x+4, pt(v[0]).y+4) for v in vs]; weights=[]
 priority={'STAIRS':0,'ELEVATOR':0,'ENTRANCE':1,'ROOM':2,'CLASSROOM':2,'RESTROOM':2,'OTHER':3,'CORRIDOR':4,'DOOR':5}
 for v in sorted(vs,key=lambda v:(priority[category(v)],int(v[0]))):
  p=pt(v[0]); label=v[1][len(mid)+1:] if v[1].startswith(mid+'_') else v[1]
  size=6.3 if len(vs)>300 else 8.2
  width=fitz.get_text_length(label,fontname='helv',fontsize=size); height=size+2
  candidates=[]
  for radius in (5,10,17,26,38,55):
   for dx,dy in [(radius,-radius),(-radius-width,-radius),(radius,radius+height),(-radius-width,radius+height),(radius,-height/2),(-radius-width,-height/2)]:
    x=p.x+dx; y=p.y+dy; r=fitz.Rect(x-1,y-height,x+width+1,y+2)
    penalty=overlaps(r,occupied)+ (10000 if r.x0<0 or r.x1>W or r.y0<header or r.y1>H+header else 0)
    candidates.append((penalty,r,x,y,radius))
   if any(c[0]==0 for c in candidates): break
  _,r,x,y,dist=min(candidates,key=lambda c:(c[0],c[4])); occupied.append(r)
  if dist>=17: page.draw_line(p,(x if x>p.x else x+width,y-size/2),color=(.5,.5,.5),width=.35)
  page.draw_rect(r,color=None,fill=(1,1,1),fill_opacity=.82)
  page.insert_text((x,y),label,fontsize=size,color=(.08,.09,.12))
 # Weight threshold is in page points, not routing-weight units; avoid label collisions.
 for e in es:
  a,b=pt(e[0]),pt(e[1])
  if abs(a-b)<200: continue
  m=(a+b)*.5; size=7; text=e[2]; w=fitz.get_text_length(text,fontsize=size); r=fitz.Rect(m.x-w/2-1,m.y-size-1,m.x+w/2+1,m.y+2)
  if overlaps(r,occupied): continue
  occupied.append(r); page.draw_rect(r,color=None,fill=(1,1,1),fill_opacity=.9); page.insert_text((r.x0+1,m.y),text,fontsize=size,color=(.24,.24,.24))
 x=W+24; y=55
 def text(t,size=13,bold=False):
  nonlocal y
  page.insert_text((x,y),t,fontsize=size,fontname='hebo' if bold else 'helv',color=(.12,.16,.2)); y+=size+9
 text('GRAPH LEGEND',17,True); y+=8
 for cat,label in [('ROOM','Room'),('CLASSROOM','Classroom'),('RESTROOM','Restroom'),('STAIRS','Stairs'),('ELEVATOR','Elevator'),('ENTRANCE','Entrance'),('CORRIDOR','Corridor point'),('DOOR','Door point'),('OTHER','Other / cafe')]:
  page.draw_circle((x+6,y-5),4,color=COLORS[cat],fill=COLORS[cat]); page.insert_text((x+19,y),label,fontsize=13); y+=23
 y+=14; text('EDGES',15,True)
 for col,dash,label in [((.2,.23,.26),None,'Same-floor edge'),((.9,.23,.02),None,'Suspect: crosses a wall'),((.75,.08,.06),'[6 4] 0','Stairs edge'),((.02,.48,.17),None,'Elevator edge')]:
  page.draw_line((x,y-5),(x+33,y-5),color=col,width=2,dashes=dash); page.insert_text((x+43,y),label,fontsize=12); y+=25
 y+=8; page.draw_circle((x+6,y-5),7,color=COLORS['STAIRS'],width=1.5); page.draw_circle((x+6,y-5),3,fill=COLORS['STAIRS'],color=COLORS['STAIRS']); page.insert_text((x+20,y),'Links to another floor',fontsize=12); y+=30
 for t in ['Weights shown for edges at least','200 page points long, when space','permits. Lines show graph geometry,','not verified walkable routes.','', 'Orange flags are automated leads;','doors, furniture and plan linework','can cause false positives.']:
  text(t,11)
 page.insert_text((x,H+header-35),'See SKETCH_REVIEW.md for details',fontsize=11,color=(.25,.3,.35))
 target=ROOT/'data/maps/sketches'/f'{mid}.pdf'; out.save(target,deflate=True,garbage=4); out.close(); src.close()
 coords=collections.defaultdict(list)
 for v in vs: coords[(v[8],v[9])].append(v[1])
 return {'id':mid,'v':len(vs),'e':len(es),'suspects':suspects,'wall_count':len(walls),'links':len(links),'linked':len(linked),'coincident':[z for z in coords.values() if len(z)>1]}

results=[]
for mid in IDS:
 print('Processing',mid,flush=True); r=run(mid); results.append(r); print(mid,'suspects',len(r['suspects']),'walls',r['wall_count'],flush=True)
report=['# Sketch review','', 'The seven old PDFs were opened and rendered, including enlarged crops, against the corresponding source plans and merged graph. The old titles reported the same per-floor vertex and edge totals as the merged files; this is not proof that every dot was individually legible or correctly placed.','', '## Findings in the previous drawings','', '- SSE: the background had strong department colours, labels were very small at sheet scale, and numerous red straight edges run through intervening rooms and walls (particularly the diagonal wings). Red meant added corridors, rather than a consistent wall-crossing warning. The legend did not explain vertex categories or all edge colours.', '- Administration: many long dark edges visibly cut through rooms or walls, and their weight labels clutter the network. The original titles explained floor-link rings but there was no complete graph colour legend. Some locations are represented by generic office keys; visual verification of their semantic room identity against the architectural plan is limited.', '- Floor-link rings were present in the inspected drawings, but the actual cross-floor edges cannot be drawn as ordinary same-floor segments. Co-located graph vertices and crowded labels can hide individual dots. A data-driven redraw cannot establish that all room names are correctly located; the owner should check coordinates and the suspect edges against doors and plans.', '', '## Redraw and method','', 'All graph vertices and all edges with both endpoints on the sheet are drawn from the merged files. Dot colours distinguish room, classroom, restroom, stairs, elevator, entrance, corridor, door and other; a ring marks a stair/elevator with a cross-floor link. Weights appear only for edges at least 200 page points long when the label has room. Labels are placed with a collision-minimizing search; coincident vertices remain coincident and dense areas may still need zooming.', '', 'For SSE, input coordinates are upright: they are transformed with the source page derotation matrix into the stored page coordinate system for line intersection, then returned to upright coordinates for drawing. The faded background is a raster rendering of the original rotated page. ADMIN uses the unrotated plan. No vertex positions or graph edges were changed.', '', 'Suspects are edges intersecting a dark stroked straight plan segment of at least 30 page points, excluding near-parallel intersections and touches within 3 points of edge endpoints or 1 point of plan-line endpoints. Intersections within 5 points along the edge are merged. This is a heuristic: plan lines include furniture, annotations and other non-wall geometry, and short or nonblack walls are missed. Orange is a review flag, not proof of a blocked route. Counts are unique edges; ranking is by number of distinct intersections, then by geometric length. The list contains up to 20 per sketch (all when fewer than 20).', '', '| Sketch | Locations | Same-floor edges | Suspect edges | Cross-floor stair/elevator links | Coincident coordinate groups |','|---|---:|---:|---:|---:|---:|']
for r in results: report.append(f"| {r['id']} | {r['v']} | {r['e']} | {len(r['suspects'])} | {r['links']} | {len(r['coincident'])} |")
for r in results:
 report += ['',f"## {r['id']} - worst suspect edges",'', 'Ranked key pairs (distinct plan-line crossings; straight-line length in page points):','']
 if not r['suspects']: report.append('None detected.')
 for i,(n,l,e) in enumerate(r['suspects'][:20],1): report.append(f"{i}. `{byid[e[0]][1]}` - `{byid[e[1]][1]}` ({n}; {l:.0f} pt)")
 if r['coincident']:
  report += ['',f"Coincident-coordinate groups: {len(r['coincident'])}; example: "+' / '.join('`'+x+'`' for x in r['coincident'][0])+'.']
path=ROOT/'data/campus/notes/SKETCH_REVIEW.md'; path.parent.mkdir(parents=True,exist_ok=True); path.write_text('\n'.join(report)+'\n',encoding='utf8')

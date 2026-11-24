import sys, glob
from pathlib import Path
sys.path.insert(0, 'tools/.pylib')
import pymupdf as fitz
from build_demo import rows, edges

out=Path('data/maps/sketches'); out.mkdir(parents=True,exist_ok=True)
doc=fitz.open()
colors={'ROOM':(0.0,0.25,0.85),'CLASSROOM':(0.0,0.25,0.85),'RESTROOM':(0.7,0,0.7),'STAIRS':(0.9,0,0),'ELEVATOR':(0,0.55,0),'HALLWAY':(1,0.5,0)}
for floor,pattern in [('P','*PLAZA FLOOR*'),('F1','*FIRST FLOOR*')]:
    path=glob.glob('University maps/SCHOOL OF SCIENCES AND ENGINEERING/'+pattern)[0]
    source=fitz.open(path); doc.insert_pdf(source); page=doc[-1]; page.remove_rotation()
    page.draw_rect(page.rect,fill=(1,1,1),color=None,fill_opacity=0.70,overlay=True)
    for i,j,w,kind,acc,points in edges:
        if rows[i][0]!=floor or rows[j][0]!=floor: continue
        shape=page.new_shape()
        for a,b in zip(points,points[1:]): shape.draw_line(a,b)
        shape.finish(color=(.15,.15,.15),width=2); shape.commit()
        a,b=points[0],points[-1]
        page.insert_text(((a[0]+b[0])/2,(a[1]+b[1])/2-3),str(w),fontsize=9,color=(0,0,0))
    for i,(fl,code,label,typ,x,y) in enumerate(rows):
        if fl!=floor: continue
        page.draw_circle((x,y),4,color=colors[typ],fill=colors[typ])
        page.insert_text((x+5,y-5),f'{i} {code}',fontsize=10,color=colors[typ])
    page.draw_rect(fitz.Rect(50,1650,1250,1810),fill=(1,1,1),color=(0,0,0),width=1)
    count=sum(r[0]==floor for r in rows)
    ec=sum(rows[i][0]==floor and rows[j][0]==floor for i,j,*_ in edges)
    page.insert_text((65,1680),f'SSE {"Plaza" if floor=="P" else "First"} | {count} vertices, {ec} floor edges',fontsize=20)
    page.insert_text((65,1710),'Blue: rooms / classrooms    Purple: restrooms    Red: stairs    Green: elevators    Orange: hallway',fontsize=15)
    page.insert_text((65,1740),'Floor links: ST03 and ST05 stairs 113 (inaccessible); ET03 elevator 212 (accessible, verify).',fontsize=15)
    page.insert_text((65,1770),'Lines: corridor routes; numbers: estimated weight in PDF points at 1:200.',fontsize=15)
doc.save(out/'SSE_demo.pdf',garbage=4,deflate=True)
for i in range(2):
    doc[i].get_pixmap(matrix=fitz.Matrix(.65,.65),clip=fitz.Rect(180,80,1360,470)).save(f'tools/demo_preview_{i}.png')


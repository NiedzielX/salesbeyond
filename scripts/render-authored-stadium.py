# Review authored geometry and all seat instances. Not a browser/WebGL screenshot.
import bpy,json,math,sys
from mathutils import Vector
from pathlib import Path
args=sys.argv[sys.argv.index('--')+1:];data=json.loads(Path(args[0]).read_text());out=Path(args[1]);out.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def material(color):
 v=[int(color[i:i+2],16)/255 for i in [1,3,5]];v=[n/12.92 if n<.04045 else ((n+.055)/1.055)**2.4 for n in v]
 m=bpy.data.materials.new(color);m.diffuse_color=(*v,1);m.use_nodes=True;n=m.node_tree.nodes.get('Principled BSDF');n.inputs['Base Color'].default_value=(*v,1);n.inputs['Roughness'].default_value=.75;return m
def mesh(name,vertices,faces,color):
 m=bpy.data.meshes.new(name);m.from_pydata(vertices,[],faces);m.update();o=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(o);m.materials.append(material(color));return o
def transform(p):return (p[0],-p[2],p[1])
roof=[]
for part in data['parts']:
 p=part['positions'];o=mesh(part['name'],[transform(p[i:i+3]) for i in range(0,len(p),3)],[(i,i+1,i+2) for i in range(0,len(p)//3,3)],part['color'])
 if part['layer']!='bowl':roof.append(o)
vertices=[];faces=[];face_colors=[];palette=list(dict.fromkeys(s['color'] for s in data['seats']))
box_faces=[(0,1,2,3),(4,7,6,5),(0,4,5,1),(3,2,6,7),(0,3,7,4),(1,5,6,2)]
for s in data['seats']:
 c=math.cos(s['heading']);sn=math.sin(s['heading']);p=s['p']
 for cy,cz,w,h,d in [(0,0,data['seatWidth'],data['seatThickness'],data['seatDepth']),(.32,.19,data['seatWidth'],.56,.09)]:
  start=len(vertices)
  for x,y,z in [(-w/2,-h/2,-d/2),(w/2,-h/2,-d/2),(w/2,h/2,-d/2),(-w/2,h/2,-d/2),(-w/2,-h/2,d/2),(w/2,-h/2,d/2),(w/2,h/2,d/2),(-w/2,h/2,d/2)]:
   y+=cy;z+=cz;vertices.append(transform((p[0]+c*x+sn*z,p[1]+y,p[2]-sn*x+c*z)))
  faces.extend([tuple(start+i for i in face) for face in box_faces]);face_colors.extend([palette.index(s['color'])]*6)
chairs=mesh('All canonical chair instances',vertices,faces,palette[0])
for color in palette[1:]:chairs.data.materials.append(material(color))
for polygon,index in zip(chairs.data.polygons,face_colors):polygon.material_index=index
mesh('Site',[(-145,-126,-1.3),(145,-126,-1.3),(145,126,-1.3),(-145,126,-1.3)],[(0,1,2,3)],'#c4d0ca')
mesh('Turf',[(-59,-41,-.15),(59,-41,-.15),(59,41,-.15),(-59,41,-.15)],[(0,1,2,3)],'#467e54')
for i in range(14):
 x=-52.5+i*7.5;mesh('Pitch stripe',[(x,-34,0),(x+7.5,-34,0),(x+7.5,34,0),(x,34,0)],[(0,1,2,3)],'#659965' if i%2 else '#72a96d')
def line(points):
 c=bpy.data.curves.new('Pitch marking','CURVE');c.dimensions='3D';c.bevel_depth=.065;c.resolution_u=1;s=c.splines.new('POLY');s.points.add(len(points)-1)
 for p,co in zip(s.points,points):p.co=(*co,.999)
 o=bpy.data.objects.new('Pitch marking',c);bpy.context.collection.objects.link(o);c.materials.append(material('#eef5e6'))
line([(-52.5,-34,.07),(52.5,-34,.07),(52.5,34,.07),(-52.5,34,.07),(-52.5,-34,.07)]);line([(0,-34,.07),(0,34,.07)])
line([(math.cos(i/64*math.tau)*9.15,math.sin(i/64*math.tau)*9.15,.07) for i in range(65)])
for sign in [-1,1]:line([(sign*52.5,-20.16,.07),(sign*36,-20.16,.07),(sign*36,20.16,.07),(sign*52.5,20.16,.07)])
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=16;scene.cycles.use_denoising=False;scene.render.resolution_x=1100;scene.render.resolution_y=760;scene.render.resolution_percentage=100;scene.render.threads_mode='FIXED';scene.render.threads=4
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.78,.85,.95,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.55
bpy.ops.object.light_add(type='SUN',location=(-90,-40,140));sun=bpy.context.object;sun.rotation_euler=(.4,-.45,-.4);sun.data.energy=2.3;sun.data.angle=.2
bpy.ops.object.camera_add();camera=bpy.context.object;scene.camera=camera;camera.data.lens=40;camera.data.clip_end=2000
scene.view_settings.view_transform='AgX'
def render(name,origin,target):
 camera.location=transform(origin);camera.rotation_euler=(Vector(transform(target))-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(out/name);bpy.ops.render.render(write_still=True)
render('authored-enea-roof.png',(185,215,225),(0,14,0))
for o in roof:o.hide_render=True
render('authored-enea-bowl.png',(150,155,180),(0,15,0))

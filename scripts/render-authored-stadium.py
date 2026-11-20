# Review authored geometry and all seat instances. Not a browser/WebGL screenshot.
import bpy,json,math,sys
from mathutils import Vector
from pathlib import Path
args=sys.argv[sys.argv.index('--')+1:];data=json.loads(Path(args[0]).read_text());out=Path(args[1]);out.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def material(color):
 v=[int(color[i:i+2],16)/255 for i in [1,3,5]];v=[n/12.92 if n<.04045 else ((n+.055)/1.055)**2.4 for n in v]
 m=bpy.data.materials.new(color);m.diffuse_color=(*v,1);m.use_nodes=True;n=m.node_tree.nodes.get('Principled BSDF');n.inputs['Base Color'].default_value=(*v,1);n.inputs['Roughness'].default_value=.75;return m
def mesh(name,vertices,faces,color,existing_material=None):
 m=bpy.data.meshes.new(name);m.from_pydata(vertices,[],faces);m.update();o=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(o);m.materials.append(existing_material if existing_material is not None else material(color));return o
def transform(p):return (p[0],-p[2],p[1])
roof=[]
for part in data['parts']:
 p=part['positions'];o=mesh(part['name'],[transform(p[i:i+3]) for i in range(0,len(p),3)],[(i,i+1,i+2) for i in range(0,len(p)//3,3)],part['color'])
 if part['layer']!='bowl':roof.append((o,part['color']))
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
mesh('Concourse pad',[(-129,-112,-.25),(129,-112,-.25),(129,112,-.25),(-129,112,-.25)],[(0,1,2,3)],'#dfe3e2')
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
bpy.ops.object.camera_add();camera=bpy.context.object;scene.camera=camera;camera.data.clip_end=2000
scene.view_settings.view_transform='AgX'
def configure_camera(view):
 # Match a Three.js vertical FOV. A vertical sensor fit keeps the vertical
 # angle fixed and lets the requested render aspect determine horizontal FOV.
 camera.data.sensor_fit='VERTICAL';camera.data.sensor_height=24
 camera.data.lens=camera.data.sensor_height/(2*math.tan(math.radians(view['fov'])/2))
 camera.location=transform(view['position'])
 camera.rotation_euler=(Vector(transform(view['target']))-camera.location).to_track_quat('-Z','Y').to_euler()
 scene.render.resolution_x=1100;scene.render.resolution_y=round(1100/view['aspect'])
def clipped_triangles(obj,normal):
 # Three Plane(normal, 0) keeps points with dot(normal, position) >= 0.
 # Transform the plane covector alongside the stadium's (x,y,z)->(x,-z,y).
 n=Vector((normal[0],-normal[2],normal[1]))
 source=[v.co.copy() for v in obj.data.vertices];vertices=[];faces=[]
 def intersection(a,b,da,db):return a+(b-a)*(da/(da-db))
 for poly in obj.data.polygons:
  points=[source[i] for i in poly.vertices]
  result=[]
  for a,b in zip(points,points[1:]+points[:1]):
   da,db=n.dot(a),n.dot(b)
   if da>=0:result.append(a)
   if da*db<0:result.append(intersection(a,b,da,db))
  # Float32 intersections can round back onto a retained endpoint. Deduplicate
  # within a micrometre before making a face, including the closing edge.
  distinct=[]
  for point in result:
   if not any((point-other).length_squared<=1e-12 for other in distinct):distinct.append(point)
  result=distinct
  area=Vector((0,0,0))
  for i in range(1,len(result)-1):area+=(result[i]-result[0]).cross(result[i+1]-result[0])
  if len(result)>=3 and area.length_squared>1e-16:
   start=len(vertices);vertices.extend(tuple(p) for p in result);faces.append(tuple(range(start,start+len(result))))
 return vertices,faces
def render(name,view):
 configure_camera(view)
 previous=[(obj,obj.hide_render) for obj,_ in roof];temporary=[];normal=view.get('cutawayNormal')
 for original,color in roof:
  if not view.get('roof',True):original.hide_render=True
  elif normal:
   original.hide_render=True
   vertices,faces=clipped_triangles(original,normal)
   if faces:temporary.append(mesh(original.name+' cutaway',vertices,faces,color,original.data.materials[0]))
  else:original.hide_render=False
 scene.render.filepath=str(out/name);bpy.ops.render.render(write_still=True)
 for obj in temporary:
  mesh_data=obj.data;bpy.data.objects.remove(obj,do_unlink=True);bpy.data.meshes.remove(mesh_data)
 for obj,hidden in previous:obj.hide_render=hidden
# Keep the historical comparison images and framing unchanged.
legacy_fov=math.degrees(2*math.atan(36*(760/1100)/(2*40)))
views={'roof':{'position':[185,215,225],'target':[0,14,0],'fov':legacy_fov,'aspect':1100/760},
 'bowl':{'position':[150,155,180],'target':[0,15,0],'fov':legacy_fov,'aspect':1100/760,'roof':False},**data.get('views',{})}
requested=args[2:] or list(views)
for key in requested:render('authored-enea-'+key+'.png',views[key])

import bpy,json,sys
from mathutils import Vector
from pathlib import Path
args=sys.argv[sys.argv.index('--')+1:]
model_path=Path(args[0]);root=Path(args[1]);root.mkdir(parents=True,exist_ok=True)
stage=args[2] if len(args)>2 else 'current'
data=json.loads(model_path.read_text())
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
p=data['positions'];c=data['colors'];verts=[(p[i],-p[i+2],p[i+1]) for i in range(0,len(p),3)];faces=[(i,i+1,i+2) for i in range(0,len(verts),3)]
mesh=bpy.data.meshes.new('Compiled stadium solids');mesh.from_pydata(verts,[],faces);mesh.update();obj=bpy.data.objects.new('Compiled stadium solids',mesh);bpy.context.collection.objects.link(obj)
attr=mesh.color_attributes.new(name='CompiledColor',type='FLOAT_COLOR',domain='CORNER');rgba=[]
for loop in mesh.loops:i=loop.vertex_index*3;rgba.extend([c[i],c[i+1],c[i+2],1])
attr.data.foreach_set('color',rgba)
mat=bpy.data.materials.new('Compiled vertex color');mat.use_nodes=True;node=mat.node_tree.nodes.new('ShaderNodeVertexColor');node.layer_name='CompiledColor';bsdf=mat.node_tree.nodes.get('Principled BSDF');mat.node_tree.links.new(node.outputs['Color'],bsdf.inputs['Base Color']);bsdf.inputs['Roughness'].default_value=.8;obj.data.materials.append(mat)
world=bpy.context.scene.world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.75,.83,.92,1);world.node_tree.nodes['Background'].inputs[1].default_value=.6
bpy.ops.object.light_add(type='SUN',location=(0,0,100));sun=bpy.context.object;sun.rotation_euler=(.4,-.5,-.3);sun.data.energy=2.5;sun.data.angle=.25
bpy.ops.object.camera_add();camera=bpy.context.object;bpy.context.scene.camera=camera;camera.data.lens=43;camera.data.clip_end=1000;camera.data.clip_start=.05
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=16;scene.cycles.use_denoising=False;scene.render.resolution_x=900;scene.render.resolution_y=560;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.threads_mode='FIXED';scene.render.threads=4
scene.view_settings.view_transform='Standard'
def transform(v):return Vector((v[0],-v[2],v[1]))
def render(name,origin,target):
 camera.location=transform(origin);camera.rotation_euler=(transform(target)-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(root/name);bpy.ops.render.render(write_still=True)
if stage!='before':render(f'geometry-overview-{stage}.png',(190,170,205),(0,0,0))
s=next(s for s in data['seats'] if s['id']=='north-102-row-1:0')
render(f'geometry-corner-{stage}.png',(s['x'],s['eye'],s['z']),(-52.3,.2,33.8))

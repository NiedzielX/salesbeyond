import {BufferGeometry,Float32BufferAttribute,ShapeGeometry} from 'three';
import {FontLoader} from 'three/examples/jsm/loaders/FontLoader.js';
import fontData from 'three/examples/fonts/helvetiker_bold.typeface.json' with {type:'json'};
import type {ModelPart} from './eneaModel.ts';

/** Painted wordmarks on the grey apron behind the goals, outside the turf and seating. */
export function createBeyondAdvertising():ModelPart[]{
 const font=new FontLoader().parse(fontData);
 const indexed=new ShapeGeometry(font.generateShapes('Beyond',1),6);
 indexed.computeBoundingBox();
 const bounds=indexed.boundingBox!,scale=1.25/(bounds.max.y-bounds.min.y);
 indexed.translate(-(bounds.min.x+bounds.max.x)/2,-(bounds.min.y+bounds.max.y)/2,0);
 indexed.scale(scale,scale,1);
 const flat=indexed.toNonIndexed(),source=flat.getAttribute('position'),positions:number[]=[];
 for(const end of [-1,1])for(let i=0;i<source.count;i++){
  // Each end reads from the pitch: local right runs along the goal line,
  // and the top of the letters points towards the stand behind that goal.
  positions.push(end*(60.55+source.getY(i)),-.225,end*(12+source.getX(i)));
 }
 indexed.dispose();flat.dispose();
 const geometry=new BufferGeometry();
 geometry.setAttribute('position',new Float32BufferAttribute(positions,3));
 geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
 return [{name:'Beyond apron advertising',layer:'bowl',color:'#536b83',geometry}];
}

import {BoxGeometry,BufferGeometry,Float32BufferAttribute,ShapeGeometry} from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {FontLoader} from 'three/examples/jsm/loaders/FontLoader.js';
import fontData from 'three/examples/fonts/helvetiker_bold.typeface.json' with {type:'json'};
import type {ModelPart} from './eneaModel.ts';

/** Upright goal panels and lettering on the grey pitch-side walls. No floor paint. */
export function createBeyondAdvertising():ModelPart[]{
 const font=new FontLoader().parse(fontData);
 const indexed=new ShapeGeometry(font.generateShapes('Beyond',1),6);
 indexed.computeBoundingBox();
 const bounds=indexed.boundingBox!,height=bounds.max.y-bounds.min.y;
 indexed.translate(-(bounds.min.x+bounds.max.x)/2,-(bounds.min.y+bounds.max.y)/2,0);
 const flat=indexed.toNonIndexed(),source=flat.getAttribute('position'),positions:number[]=[];
 const word=(size:number,place:(u:number,v:number)=>[number,number,number])=>{
  const scale=size/height;
  for(let i=0;i<source.count;i++)positions.push(...place(source.getX(i)*scale,source.getY(i)*scale));
 };
 const boards:BoxGeometry[]=[];
 for(const end of [-1,1]){
  // Existing goal-back rectangles, shared with the CPU review export.
  boards.push(new BoxGeometry(.12,2.4,7.32).translate(end*54,1.2,0));
  word(1.1,(u,v)=>[end*54.075,1.2+v,-end*u]);
  word(1.1,(u,v)=>[end*53.925,1.2+v,end*u]);
  for(const along of [-36,0,36])word(.72,(u,v)=>[along-end*u,.78+v,end*42.565]);
 }
 indexed.dispose();flat.dispose();
 const geometry=new BufferGeometry();
 geometry.setAttribute('position',new Float32BufferAttribute(positions,3));
 geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
 const panelGeometry=mergeGeometries(boards,false)!;
 boards.forEach(board=>board.dispose());
 panelGeometry.computeBoundingBox();panelGeometry.computeBoundingSphere();
 return [
  {name:'Grey goal-back panels',layer:'bowl',color:'#c2d2c5',geometry:panelGeometry},
  {name:'Beyond upright advertising',layer:'bowl',color:'#536b83',geometry},
 ];
}

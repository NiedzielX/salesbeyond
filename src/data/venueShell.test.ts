import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Ray,Vector3} from 'three';
import {createVenueGeometry} from './venueShell.ts';

test('schody i poprzeczne przejście są wolne od niebieskich ławek i zachowują betonową posadzkę',()=>{
 const mesh=createVenueGeometry(false);
 const hit=new Vector3();
 function surfacesBelow(x:number,z:number){
  const ray=new Ray(new Vector3(x,30,z),new Vector3(0,-1,0));
  let blue=false,concrete=false;
  for(let i=0;i<mesh.position.length;i+=9){
   const a=new Vector3(...mesh.position.slice(i,i+3)),b=new Vector3(...mesh.position.slice(i+3,i+6)),c=new Vector3(...mesh.position.slice(i+6,i+9));
   if(!ray.intersectTriangle(a,b,c,false,hit))continue;
   const [r,g,bColor]=mesh.color.slice(i,i+3);
   if(bColor>g*1.2&&g>r)blue=true;
   if(r>.5&&r<.7&&g>.6&&g<.75)concrete=true;
  }
  return {blue,concrete};
 }
 assert.equal(surfacesBelow(-40,-64.25).blue,true,'miejsce poza schodami ma ławkę');
 assert.deepEqual(surfacesBelow(-42,-64.25),{blue:false,concrete:true},'schody mają ciągłą posadzkę');
 assert.deepEqual(surfacesBelow(-40,-56.9),{blue:false,concrete:true},'przejście między kondygnacjami nie jest wyciętym otworem');
});

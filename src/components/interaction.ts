import {Mesh} from 'three';
import type {View} from '../domain/selection.ts';
const ignoreRaycast:Mesh['raycast']=()=>{};
/** R3F ignores undefined props, so restore the concrete implementation on reset. */
export function sectorRaycast(view:View){return view==='overview'?Mesh.prototype.raycast:ignoreRaycast;}

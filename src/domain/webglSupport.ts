type CanvasFactory=()=>HTMLCanvasElement;

/** Probe the WebGL2 capability before a renderer can throw during React mount. */
export function webGL2Available(createCanvas:CanvasFactory=()=>document.createElement('canvas')){
 try{
  const context=createCanvas().getContext('webgl2');
  if(!context)return false;
  context.getExtension('WEBGL_lose_context')?.loseContext();
  return true;
 }catch{return false;}
}

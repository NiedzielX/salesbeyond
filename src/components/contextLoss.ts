/** Report a GPU context loss rather than leaving a frozen view labelled live. */
export function watchContextLoss(canvas:EventTarget,onLost:()=>void){
 canvas.addEventListener('webglcontextlost',onLost);
 return()=>canvas.removeEventListener('webglcontextlost',onLost);
}

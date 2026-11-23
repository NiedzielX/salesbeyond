export type SceneTouchMode='page'|'scene';

export function sceneTouchControl(mode:SceneTouchMode){
 return {
  className:mode==='scene'?'touch-scene-control':'',
  pressed:mode==='scene',
  label:'Sterowanie sceną',
 } as const;
}

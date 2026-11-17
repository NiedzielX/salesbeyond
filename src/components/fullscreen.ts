type FullscreenDocument={fullscreenElement:Element|null;exitFullscreen?:()=>Promise<void>};
type FullscreenElement={requestFullscreen?:()=>Promise<void>};
/** Unsupported fullscreen is a recoverable control failure, not a project dialog. */
export async function toggleFullscreen(doc:FullscreenDocument,element:FullscreenElement|null):Promise<boolean>{
 try{
 if(doc.fullscreenElement){if(!doc.exitFullscreen)return false;await doc.exitFullscreen();}
 else {if(!element?.requestFullscreen)return false;await element.requestFullscreen();}
 return true;
 }catch{return false;}
}

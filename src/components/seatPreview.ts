/** Read immediately after rendering: WebGL may clear its drawing buffer at the frame boundary. */
export function captureSeatPreview(draw:()=>void,canvas:Pick<HTMLCanvasElement,'toDataURL'>):string|null{
 try{draw();const image=canvas.toDataURL('image/jpeg',.82);return image.startsWith('data:image/jpeg;base64,')?image:null;}
 catch{return null;}
}

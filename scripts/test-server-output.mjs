/** Exercise emitted JS separately from Node's direct TypeScript test runner. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import ts from 'typescript';
const root=fileURLToPath(new URL('../',import.meta.url));
test('compiled API loads in Node and serves disabled status without TypeScript sources',async()=>{
 const output=await mkdtemp(join(tmpdir(),'salesbeyond-emitted-api-'));
 const priorEnabled=process.env.SEAT_HOLDS_ENABLED;process.env.SEAT_HOLDS_ENABLED='0';
 try{
  const config=ts.readConfigFile(join(root,'tsconfig.json'),ts.sys.readFile);
  const {options}=ts.parseJsonConfigFileContent(config.config,ts.sys,root);
  await writeFile(join(output,'package.json'),JSON.stringify({type:'module'}));
  for(const source of ['api/seat-api.ts','src/server/holdRuntime.ts','src/server/holdApi.ts','src/server/holdStore.ts']){
   const emitted=ts.transpileModule(await readFile(join(root,source),'utf8'),{compilerOptions:options,fileName:source});
   const target=join(output,source.replace(/\.ts$/,'.js'));
   await mkdir(dirname(target),{recursive:true});await writeFile(target,emitted.outputText);
  }
  const {default:api}=await import(pathToFileURL(join(output,'api/seat-api.js')).href);
  const response=await api.fetch(new Request('https://salesbeyond.vercel.app/api/seat-api?op=status'));
  assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true,configured:false,mode:'demo'});
  const unavailable=await api.fetch(new Request('https://salesbeyond.vercel.app/api/seat-api?op=inventory&eventId=enea-demo'));
  assert.equal(unavailable.status,503);assert.equal((await unavailable.json()).error.code,'backend_not_configured');
 }finally{if(priorEnabled===undefined)delete process.env.SEAT_HOLDS_ENABLED;else process.env.SEAT_HOLDS_ENABLED=priorEnabled;await rm(output,{recursive:true,force:true});}
});

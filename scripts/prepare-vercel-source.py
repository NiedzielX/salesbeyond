"""Package only reviewed, committed public application sources for Vercel's files API."""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('output_directory',type=Path)
args=parser.parse_args()
root=Path(subprocess.check_output(['git','rev-parse','--show-toplevel'],text=True).strip())
sha=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
base={'package.json','package-lock.json','vite.config.ts','vercel.json','index.html','tsconfig.json'}
files=[];manifest=[]
for name in subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\0'):
    if not name or not (name in base or name.startswith('src/') and '.test.' not in name or name.startswith('public/') or name.startswith('api/')):
        continue
    path=root/name
    if path.is_symlink():
        raise SystemExit('Refusing a source symlink: '+name)
    data=path.read_bytes()
    committed=subprocess.check_output(['git','show',sha+':'+name],cwd=root)
    if data!=committed:
        raise SystemExit('Uncommitted source change: '+name)
    files.append({'file':name,'data':base64.b64encode(data).decode(),'encoding':'base64'})
    manifest.append({'file':name,'size':len(data),'sha1':hashlib.sha1(data).hexdigest()})
args.output_directory.mkdir(parents=True,exist_ok=True)
out=args.output_directory/('vercel-source-'+sha[:7]+'.json')
out.write_text(json.dumps(files,separators=(',',':')))
out.with_name(out.stem+'-manifest.json').write_text(json.dumps({'commit':sha,'files':manifest},indent=2))
print(json.dumps({'commit':sha,'path':str(out),'files':len(files),'sourceBytes':sum(x['size'] for x in manifest),'jsonChars':out.stat().st_size,'chunks':(out.stat().st_size+23999)//24000}))

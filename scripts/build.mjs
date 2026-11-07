import {rm,writeFile,readFile,readdir,stat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
// Always start clean. Vite writes directly into /docs, the only deployment output.
await rm('docs',{recursive:true,force:true});await rm('dist',{recursive:true,force:true});
for(const args of [['scripts/prepare-assets.mjs'],['node_modules/typescript/bin/tsc','-b'],['node_modules/vite/bin/vite.js','build']]){const r=spawnSync(process.execPath,args,{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
await writeFile('docs/.nojekyll','');
// Do not expose build-only manifests on the deployed website.
await rm('docs/.vite',{recursive:true,force:true});
console.log('Fresh /docs is ready. Deploy from main → /docs.');

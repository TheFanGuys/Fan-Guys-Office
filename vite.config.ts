import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {VitePWA} from 'vite-plugin-pwa';
import {readFileSync,writeFileSync,statSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {resolve,posix} from 'node:path';
function coreManifest(entries:any[]){
 const manifest=JSON.parse(readFileSync('docs/.vite/manifest.json','utf8'));
 const keep=new Set<string>(['index.html','icons/mark.svg','icons/apple-touch-icon.png','manifest.webmanifest','vendor/stamps/manifest.json','vendor/stamps/stamps.pdf','brand/office-pro-192.png','brand/office-pro-180.png','brand/office-pro-512.png','brand/office-pro-badge.webp']);
 const seen=new Set<string>();
 function visit(key:string){if(seen.has(key))return;seen.add(key);const item=manifest[key];if(!item)return;keep.add(item.file);for(const asset of [...(item.css||[]),...(item.assets||[])])keep.add(asset);for(const imported of item.imports||[])visit(imported);}
 for(const key of ['index.html','src/components/PdfWorkspace.tsx','src/components/PageOrganizer.tsx','src/components/SignatureDialog.tsx','src/components/ExportDialog.tsx'])visit(key);
 // Workers are emitted as separate assets rather than regular JS import-graph entries.
 for(const e of entries)if(/\/worker-engine-|\/pdf\.worker|\/pdfium-[\w-]+\.wasm$/.test(e.url))keep.add(e.url);
 // Worker-generated chunks can have static imports outside Vite's main manifest graph.
 const scanned=new Set<string>();
 function staticImports(file:string){if(scanned.has(file)||!/[.]m?js$/.test(file))return;scanned.add(file);let source:string;try{source=readFileSync(resolve('docs',file),'utf8');}catch{return;}const pattern=/(?:from\s*|import\s*)["'](\.\.?\/[^"']+)["']/g;for(const match of source.matchAll(pattern)){const dep=posix.normalize(posix.join(posix.dirname(file),match[1]));keep.add(dep);staticImports(dep);}}
 for(const file of [...keep])staticImports(file);
 const core=entries.filter(e=>keep.has(e.url)&&!e.url.startsWith('vendor/ocr/'));
 const files=core.map(e=>{const path=resolve('docs',e.url);const bytes=readFileSync(path);return {file:e.url,bytes:bytes.length,gzipBytes:gzipSync(bytes).length};});
 writeFileSync('loading-sizes.json',JSON.stringify({precacheRawBytes:files.reduce((n,f)=>n+f.bytes,0),precacheGzipBytes:files.reduce((n,f)=>n+f.gzipBytes,0),files},null,2));
 return {manifest:core,warnings:[]};
}
export default defineConfig({base:'./',plugins:[react(),VitePWA({strategies:'injectManifest',srcDir:'src',filename:'sw.ts',registerType:'prompt',includeAssets:[],includeManifestIcons:false,manifest:{id:'./',name:'Fan Guys Office Pro',short_name:'Office Pro',description:'Private PDFs, spreadsheets, documents and job paperwork',theme_color:'#161914',background_color:'#f7f8f5',display:'standalone',icons:[{src:'brand/office-pro-192.png',sizes:'192x192',type:'image/png',purpose:'any'},{src:'brand/office-pro-512.png',sizes:'512x512',type:'image/png',purpose:'any'}]},injectManifest:{maximumFileSizeToCacheInBytes:18000000,globPatterns:['index.html','manifest.webmanifest','icons/*','brand/*','vendor/stamps/{manifest.json,stamps.pdf}','assets/**/*.{js,mjs,css,wasm}'],manifestTransforms:[async entries=>coreManifest(entries)]}})],build:{outDir:'docs',emptyOutDir:true,manifest:true,chunkSizeWarningLimit:2000},server:{host:'0.0.0.0',allowedHosts:['terminal.local']},preview:{host:'0.0.0.0',allowedHosts:['terminal.local']}});

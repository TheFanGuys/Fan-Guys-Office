import { mkdir, copyFile, readdir, unlink } from 'node:fs/promises';
await mkdir('public/vendor/ocr',{recursive:true});
// Vite now emits one deduplicated PDFium asset from the viewer import.
await copyFile('node_modules/tesseract.js/dist/worker.min.js','public/vendor/ocr/worker.min.js');
for(const f of await readdir('public/vendor/ocr')) if(f.startsWith('tesseract-core')) await unlink('public/vendor/ocr/'+f);
for(const f of ['tesseract-core-lstm.wasm.js','tesseract-core-simd-lstm.wasm.js','tesseract-core-relaxedsimd-lstm.wasm.js']) await copyFile('node_modules/tesseract.js-core/'+f,'public/vendor/ocr/'+f);
console.log('Local OCR assets prepared; PDFium is bundled once by Vite.');
// Retain third-party license texts for the dependencies included in this source/build.
import {readFile,writeFile} from 'node:fs/promises';
await mkdir('public/licenses',{recursive:true});
const roots=[];for(const name of await readdir('node_modules')){if(name.startsWith('.'))continue;if(name.startsWith('@')){for(const child of await readdir('node_modules/'+name))roots.push('node_modules/'+name+'/'+child);}else roots.push('node_modules/'+name);}
for(const root of roots){try{const pkg=JSON.parse(await readFile(root+'/package.json','utf8'));for(const file of await readdir(root))if(/^(LICENSE|LICENCE|NOTICE)([.\-_]|$)/i.test(file)){try{await copyFile(root+'/'+file,'public/licenses/'+pkg.name.replaceAll('/','__')+'__'+file);}catch{}}}catch{}}

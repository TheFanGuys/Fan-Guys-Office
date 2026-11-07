// Optional development check. Uses Playwright WebKit, never a paid/cloud service.
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {PDFDocument} from 'pdf-lib';
import {demo} from '../src/pdf.mjs';
const {webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve('docs');const output=process.env.QA_OUTPUT||path.resolve('../webkit-qa');await mkdir(output,{recursive:true});
let networkUnavailable=false;const traffic=[];const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.wasm':'application/wasm','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.txt':'text/plain'};
const server=http.createServer(async(req,res)=>{if(networkUnavailable){console.log('UNCACHED OFFLINE REQUEST',req.url);req.socket.destroy();return;}try{const u=new URL(req.url,'http://localhost'),rel=decodeURIComponent(u.pathname),file=path.resolve(root,'.'+(rel==='/'?'/index.html':rel));if(!file.startsWith(root+path.sep)&&file!==root)throw Error();const data=rel==='/seed.html'?Buffer.from('<!doctype html><title>Local test fixture</title>'):await readFile(file);const gzip=String(req.headers['accept-encoding']).includes('gzip')&&!file.endsWith('.gz');const body=gzip?gzipSync(data):data;res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');if(gzip)res.setHeader('Content-Encoding','gzip');res.setHeader('Cache-Control','no-cache');res.setHeader('Content-Length',body.length);traffic.push({path:rel,bytes:data.length,transferBytes:body.length});res.end(body);}catch{res.writeHead(404);res.end('Not found');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
const browser=await webkit.launch({headless:true,...(process.env.WEBKIT_EXECUTABLE?{executablePath:process.env.WEBKIT_EXECUTABLE}:{})});
const context=await browser.newContext({viewport:{width:390,height:844},screen:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'});
const externalRequests=[];context.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base+'/'))externalRequests.push(r.url());});const page=await context.newPage();page.on('requestfailed',r=>console.log('REQUEST FAILED',r.url(),r.failure()));const consoleErrors=[];page.on('pageerror',e=>consoleErrors.push(e.message));const failures=[];const checks=[];
async function check(name,fn){if(process.env.QA_FOCUS&&!new RegExp(process.env.QA_FOCUS).test(name))return;try{await fn();checks.push({name,passed:true});console.log('PASS',name);}catch(e){failures.push({name,error:e.stack});checks.push({name,passed:false,error:e.message});console.log('FAIL',name,e.message,'BROWSER ERRORS:',consoleErrors);console.log('STATE',await page.evaluate(async()=>{const el=document.querySelector('embedpdf-container');if(!el)return null;const r=await el.registry;const a=r.getPlugin('annotation').provides();const t=a.getActiveTool();const d=r.getPlugin('document-manager').provides().getActiveDocumentId();return {active:t?.id,defaults:t?{type:t.defaults.type,size:t.defaults.imageSize,hasHandler:!!t.pointerHandler,exclusive:t.interaction.exclusive}:null,annotations:a.forDocument(d).getAnnotations().map(x=>({id:x.object.id,type:x.object.type,subject:x.object.subject,rect:x.object.rect})),pointerLog:JSON.stringify(window.__pointerLog)};}).catch(e=>e.message));console.log((await page.locator('body').innerText()).slice(0,1800));await page.screenshot({path:path.join(output,'failure-'+checks.length+'.png'),fullPage:true}).catch(()=>{});throw e;}}
async function menu(name){await page.getByRole('button',{name:'Open navigation',exact:true}).click();await page.getByRole('button',{name,exact:true}).click();}
async function openLegacy(){await page.getByRole('button',{name:/^PDF Legacy agreement.pdf/}).click();await page.getByRole('textbox',{name:'Client name',exact:true}).waitFor({timeout:30000});}

const bytes=await readFile(process.env.CHECKIN_PDF);
try{
await page.goto(base+'/seed.html');
await page.evaluate(async bytes=>{const db=await new Promise((ok,fail)=>{const r=indexedDB.open('pdf-pro-v1',1);r.onupgradeneeded=()=>{r.result.createObjectStore('documents',{keyPath:'id'});r.result.createObjectStore('settings');r.result.createObjectStore('templates',{keyPath:'id'});};r.onsuccess=()=>ok(r.result);r.onerror=()=>fail(r.error);});const tx=db.transaction('documents','readwrite');const data=new Uint8Array(bytes);tx.objectStore('documents').put({id:'checkin',name:'GFY Check-in -out.pdf',bytes:data,original:data.slice(),pages:1,size:data.length,updated:1,created:1,project:'',starred:false});await new Promise((ok,fail)=>{tx.oncomplete=ok;tx.onerror=()=>fail(tx.error);});db.close();},Array.from(bytes));
await page.goto(base+'/');await page.getByRole('button',{name:/^PDF GFY Check-in/}).click();
const viewer=page.locator('embedpdf-container');await viewer.getByRole('textbox',{name:'Company',exact:true}).waitFor({timeout:30000});
for(const viewport of [{width:390,height:844},{width:844,height:390}]){
await page.setViewportSize(viewport);
for(const name of ['Company','Address','City, State, Zip','Contact Name','Email','Phone']){
const field=viewer.getByRole('textbox',{name,exact:true});await field.scrollIntoViewIfNeeded();
const box=await field.boundingBox();
await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
const focused=await page.evaluate(()=>document.querySelector('embedpdf-container').shadowRoot.activeElement?.getAttribute('aria-label'));
console.log('TAP',viewport.width,name,focused,box);
if(!process.env.EXPECT_BROKEN)assert.equal(focused,name);
if(focused===name){await field.fill('');await page.keyboard.type('TEST '+name,{delay:40});assert.equal((await field.inputValue()).trim(),'TEST '+name);await page.keyboard.press('Tab');await page.waitForTimeout(300);}
}
const metrics=await viewer.getByRole('textbox',{name:'Company',exact:true}).evaluate(el=>({font:getComputedStyle(el).fontSize,height:el.getBoundingClientRect().height,parentHeight:el.parentElement.getBoundingClientRect().height}));console.log('METRICS',metrics);console.log('FIELDS',await viewer.getByRole('textbox').evaluateAll(els=>els.filter(e=>['Company','Address','City, State, Zip','Contact Name','Email','Phone'].includes(e.name)).map(e=>({name:e.name,value:e.value,html:e.parentElement.parentElement.outerHTML.slice(0,2500)}))));
await page.screenshot({path:path.join(output,'checkin-'+viewport.width+'.png'),fullPage:true});
}
await page.setViewportSize({width:390,height:844});
await page.getByRole('button',{name:'Export',exact:true}).click();await page.getByText(/File ready ·/).waitFor();
const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Download PDF',exact:false}).click()]);
const exported=await readFile(await download.path());await writeFile(path.join(output,'checkin-export.pdf'),exported);const result=await PDFDocument.load(exported);
for(const name of ['Company','Address','City, State, Zip','Contact Name','Email','Phone'])assert.equal(result.getForm().getTextField(name).getText().trim(),'TEST '+name);
assert.equal(result.getForm().getFields().length,45);
console.log('CHECKIN DONE: 12 touch targets, typing and exported values; 45 fields retained');
}finally{await context.close();await browser.close();server.close();}

import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc=workerUrl;
export async function readPdf(bytes:Uint8Array):Promise<any>{const task=pdfjs.getDocument({data:bytes.slice(),useSystemFonts:true});const pdf:any=await task.promise;pdf.destroy=()=>task.destroy();return pdf;}
export async function renderPdfPage(pdf:any,index:number,width:number){const page=await pdf.getPage(index+1);const first=page.getViewport({scale:1});const viewport=page.getViewport({scale:width/first.width});const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await page.render({canvas,canvasContext:canvas.getContext('2d')!,viewport}).promise;return canvas;}

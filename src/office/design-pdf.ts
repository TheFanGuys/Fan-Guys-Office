import {PDFDocument,StandardFonts,rgb,degrees,type PDFPage,type PDFFont,type PDFImage} from 'pdf-lib';
import {cardLayout,flyerLayout,CARD,LETTER,type CardData,type FlyerData,type Measure,type Prim} from './design-layout.ts';

export interface DesignImages {wide?:Uint8Array;round?:Uint8Array;photo?:Uint8Array;}
const color=(hex:string)=>{const n=parseInt(hex.slice(1),16);return rgb((n>>16&255)/255,(n>>8&255)/255,(n&255)/255);};

async function embed(doc:PDFDocument,images:DesignImages){const out:Partial<Record<'wide'|'round'|'photo',PDFImage>>={};for(const k of ['wide','round','photo'] as const){const b=images[k];if(b)out[k]=b[0]===0x89?await doc.embedPng(b):await doc.embedJpg(b);}return out;}

// Draw primitives with their top-left at (ox,oy) on the page. "bleed" pulls edge-touching backgrounds out past the trim line.
function draw(page:PDFPage,prims:Prim[],ox:number,oy:number,size:{w:number;h:number},fonts:{reg:PDFFont;bold:PDFFont},imgs:Partial<Record<string,PDFImage>>,bleed=0){
 const H=page.getHeight();const Y=(y:number)=>H-(oy+y);
 for(const p of prims){
  if(p.t==='rect'){let {x,y,w,h}=p;if(p.bleed&&bleed){if(x<=0){w+=bleed-x;x=-bleed;}if(y<=0){h+=bleed-y;y=-bleed;}if(x+w>=size.w)w=size.w+bleed-x;if(y+h>=size.h)h=size.h+bleed-y;}
   page.drawRectangle({x:ox+x,y:Y(y+h),width:w,height:h,color:color(p.fill),...(p.stroke?{borderColor:color(p.stroke),borderWidth:p.width||1}:{})});}
  else if(p.t==='text'){if(!p.text)continue;page.drawText(p.text,{x:ox+p.x,y:Y(p.y),size:p.size,font:p.bold?fonts.bold:fonts.reg,color:color(p.color),...(p.rot?{rotate:degrees(90)}:{})});}
  else if(p.t==='line'){page.drawLine({start:{x:ox+p.x1,y:Y(p.y1)},end:{x:ox+p.x2,y:Y(p.y2)},thickness:p.width,color:color(p.color),...(p.dash?{dashArray:[p.dash,p.dash]}:{})});}
  else if(p.t==='img'){const im=imgs[p.key];if(im)page.drawImage(im,{x:ox+p.x,y:Y(p.y+p.h),width:p.w,height:p.h});}
 }
}
async function start(images:DesignImages,title:string){const doc=await PDFDocument.create();doc.setTitle(title);doc.setCreator('Fan Guys Office');doc.setProducer('Fan Guys Office');const fonts={reg:await doc.embedFont(StandardFonts.Helvetica),bold:await doc.embedFont(StandardFonts.HelveticaBold)};return {doc,fonts,imgs:await embed(doc,images)};}

/** Ten 3.5 x 2 in cards on a US Letter sheet, matching the common 10-up perforated card stock layout (0.75 in side and 0.5 in top margins). */
export async function cardSheetPdf(d:CardData,m:Measure,images:DesignImages,cutMarks=true){
 const {doc,fonts,imgs}=await start(images,'Business cards');const page=doc.addPage([LETTER.w,LETTER.h]);const prims=cardLayout(d,m);const left=54,top=36;
 for(let r=0;r<5;r++)for(let c=0;c<2;c++)draw(page,prims,left+c*CARD.w,top+r*CARD.h,CARD,fonts,imgs);
 if(cutMarks){const g=rgb(.55,.55,.55),H=LETTER.h,mark=(x1:number,y1:number,x2:number,y2:number)=>page.drawLine({start:{x:x1,y:H-y1},end:{x:x2,y:H-y2},thickness:.4,color:g});
  for(const x of [left,left+CARD.w,left+2*CARD.w]){mark(x,top-24,x,top-6);mark(x,top+5*CARD.h+6,x,top+5*CARD.h+24);}
  for(let r=0;r<=5;r++){const y=top+r*CARD.h;mark(left-24,y,left-6,y);mark(left+2*CARD.w+6,y,left+2*CARD.w+24,y);}}
 return doc.save();
}
/** One card with 1/8 in bleed on every side, the file most print shops ask for. Final trimmed size 3.5 x 2 in. */
export async function cardPrintShopPdf(d:CardData,m:Measure,images:DesignImages){
 const b=9;const {doc,fonts,imgs}=await start(images,'Business card');const page=doc.addPage([CARD.w+2*b,CARD.h+2*b]);
 page.setTrimBox(b,b,CARD.w,CARD.h);page.setBleedBox(0,0,CARD.w+2*b,CARD.h+2*b);draw(page,cardLayout(d,m),b,b,CARD,fonts,imgs,b);return doc.save();
}
export async function flyerPdf(d:FlyerData,m:Measure,images:DesignImages){const {doc,fonts,imgs}=await start(images,'Flyer');const page=doc.addPage([LETTER.w,LETTER.h]);draw(page,flyerLayout(d,m),0,0,LETTER,fonts,imgs);return doc.save();}

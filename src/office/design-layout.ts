// Cards & Flyers: one layout feeds both the on-screen preview and the PDF, so what you see is what prints.
// Units are PDF points (72 per inch). Origin is the top-left corner of the card or page.
import {PDFDocument,StandardFonts} from 'pdf-lib';

export type Theme='blue'|'red'|'dark';
export type CardStyle='classic'|'stacked'|'band';
export interface CardData {style:CardStyle;theme:Theme;logo:'wide'|'round'|'none';name:string;title:string;company:string;tagline:string;phone:string;email:string;website:string;address:string;}
export interface FlyerData {theme:Theme;logo:'wide'|'round'|'none';headline:string;subheadline:string;bullets:string;offer:string;phone:string;email:string;website:string;contactName:string;tabs:boolean;photo:string|null;}
export type Prim=
 |{t:'rect';x:number;y:number;w:number;h:number;fill:string;bleed?:boolean;stroke?:string;width?:number}
 |{t:'text';x:number;y:number;size:number;bold?:boolean;color:string;text:string;rot?:90}
 |{t:'line';x1:number;y1:number;x2:number;y2:number;color:string;width:number;dash?:number}
 |{t:'img';key:'wide'|'round'|'photo';x:number;y:number;w:number;h:number;cover?:boolean};
export type Measure=(text:string,size:number,bold?:boolean)=>number;
export const ASPECT={wide:1000/378,round:1000/667};
export const THEMES:Record<Theme,{accent:string;deep:string;label:string}>={blue:{accent:'#1677d2',deep:'#0d3f73',label:'Fan Guys blue'},red:{accent:'#c52230',deep:'#7a121b',label:'Red'},dark:{accent:'#202020',deep:'#000000',label:'Black'}};
export const CARD={w:252,h:144};export const LETTER={w:612,h:792};

export async function makeMeasure():Promise<Measure>{const doc=await PDFDocument.create();const reg=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold);return (text,size,b)=>(b?bold:reg).widthOfTextAtSize(safeText(text),size);}
// Standard PDF fonts only cover basic Latin; swap smart punctuation and drop anything else so export never fails.
export function safeText(s:string){return String(s||'').replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[–—]/g,'-').replace(/…/g,'...').replace(/[ \t]/g,' ').replace(/\r/g,'').replace(/[^\n\x20-\x7E\u00A1-\u00FF]/g,'');}
function fit(m:Measure,text:string,size:number,max:number,bold=false,min=6){let s=size;while(s>min&&m(text,s,bold)>max)s-=.25;return s;}
function wrap(m:Measure,text:string,size:number,max:number,bold=false){const out:string[]=[];for(const para of safeText(text).split('\n')){let line='';for(const word of para.split(/\s+/).filter(Boolean)){const next=line?line+' '+word:word;if(m(next,size,bold)<=max||!line)line=next;else{out.push(line);line=word;}}out.push(line);}return out;}
function centered(m:Measure,text:string,size:number,cx:number,y:number,color:string,bold=false):Prim{return {t:'text',x:cx-m(text,size,bold)/2,y,size,bold,color,text};}
function logoBox(kind:'wide'|'round',x:number,y:number,maxW:number,maxH:number,align:'left'|'center'|'right'='left'):Prim{const a=ASPECT[kind];let w=maxW,h=w/a;if(h>maxH){h=maxH;w=h*a;}const dx=align==='center'?(maxW-w)/2:align==='right'?maxW-w:0;return {t:'img',key:kind,x:x+dx,y:y+(maxH-h)/2,w,h};}

// Last line of defence: shorten anything that would still run past the edge.
function clamp(prims:Prim[],m:Measure,limit:number){for(const p of prims){if(p.t!=='text'||p.rot)continue;if(p.x+m(p.text,p.size,p.bold)<=limit)continue;let t=p.text;while(t.length>1&&p.x+m(t+'...',p.size,p.bold)>limit)t=t.slice(0,-1);p.text=t.trimEnd()+'...';}return prims;}
export function cardLayout(d:CardData,m:Measure):Prim[]{
 const {w,h}=CARD,th=THEMES[d.theme],ink='#1d1d1d',grey='#5c5c5c',out:Prim[]=[{t:'rect',x:0,y:0,w,h,fill:'#ffffff',bleed:true}];
 const contact=[d.phone,d.email,d.website,d.address].map(safeText).filter(Boolean);
 const logo=d.logo==='none'?null:d.logo;
 if(d.style==='classic'){
  const pad=16,top=d.tagline?20:27,col=w-2*pad-(logo==='wide'?102:logo?74:0)-8;
  if(logo){out.push(logoBox(logo,pad,top-2,logo==='wide'?100:70,logo==='wide'?42:47));}
  const rx=w-pad;const nameSize=fit(m,d.name,13,logo?col:w-2*pad,true);const right=(text:string,size:number,y:number,color:string,bold=false)=>out.push({t:'text',x:rx-m(text,size,bold),y,size,bold,color,text});
  if(logo){right(safeText(d.name),nameSize,top+14,ink,true);const ts=fit(m,d.title,8,col);right(safeText(d.title),ts,top+26,th.accent);if(d.company){const cs=fit(m,d.company,7.5,col);right(safeText(d.company),cs,top+37,grey);}}
  else{out.push({t:'text',x:pad,y:top+16,size:nameSize,bold:true,color:ink,text:safeText(d.name)},{t:'text',x:pad,y:top+29,size:fit(m,d.title,8.5,w-2*pad),color:th.accent,text:safeText(d.title)},{t:'text',x:pad,y:top+41,size:8,color:grey,text:safeText(d.company)});}
  const bandH=36,by=h-bandH;out.push({t:'rect',x:0,y:by,w,h:bandH,fill:th.accent,bleed:true});
  const cols=[[d.phone,d.website],[d.email,d.address]].map(c=>c.map(safeText).filter(Boolean));
  cols.forEach((col,ci)=>col.forEach((text,i)=>{const max=(w-2*pad-8)/2;out.push({t:'text',x:ci?w/2+4:pad,y:by+14+i*11,size:fit(m,text,7.5,max),color:'#ffffff',text});}));
  if(d.tagline){const ts=fit(m,d.tagline,7,w-2*pad);out.push({t:'text',x:pad,y:by-8,size:ts,color:grey,text:safeText(d.tagline)});}
 } else if(d.style==='stacked'){
  const pad=14;let tx=pad;
  if(logo){const box=logoBox(logo,pad,pad,logo==='wide'?92:84,h-2*pad,'center');out.push(box);tx=pad+(logo==='wide'?92:84)+12;out.push({t:'rect',x:tx-7,y:pad+4,w:1.2,h:h-2*pad-8,fill:th.accent});}
  const max=w-tx-pad;let y=pad+18;
  out.push({t:'text',x:tx,y,size:fit(m,d.name,13,max,true),bold:true,color:ink,text:safeText(d.name)});y+=12;
  if(d.title){out.push({t:'text',x:tx,y,size:fit(m,d.title,8,max),color:th.accent,text:safeText(d.title)});y+=10;}
  if(d.company){out.push({t:'text',x:tx,y,size:fit(m,d.company,7.5,max,true),bold:true,color:grey,text:safeText(d.company)});y+=10;}
  y=Math.max(y+8,h-pad-contact.length*10.5+4);
  for(const text of contact){out.push({t:'text',x:tx,y,size:fit(m,text,7.5,max),color:ink,text});y+=10.5;}
  if(d.tagline){out.push({t:'rect',x:0,y:h-5,w,h:5,fill:th.accent,bleed:true});}
 } else {
  const split=h*.56;
  if(logo)out.push(logoBox(logo,14,10,w-28,split-18,'center'));
  else out.push(centered(m,safeText(d.company||'Fan Guys'),fit(m,d.company||'Fan Guys',18,w-28,true),w/2,split/2+6,th.accent,true));
  out.push({t:'rect',x:0,y:split,w,h:h-split,fill:th.accent,bleed:true});
  const name=safeText(d.name),title=safeText(d.title);
  out.push(centered(m,name,fit(m,name,12,w-24,true),w/2,split+17,'#ffffff',true));
  if(title)out.push(centered(m,title,fit(m,title,7.5,w-24),w/2,split+28,'#ffffff'));
  const line=[d.phone,d.email].map(safeText).filter(Boolean).join('   ');if(line)out.push(centered(m,line,fit(m,line,7.5,w-20),w/2,split+41,'#ffffff'));
  const web=[d.website,d.address].map(safeText).filter(Boolean).join('   ');if(web)out.push(centered(m,web,fit(m,web,7,w-20),w/2,split+52,'#ffffff'));
 }
 return clamp(out,m,w-6);
}

export function flyerLayout(d:FlyerData,m:Measure):Prim[]{
 const {w,h}=LETTER,th=THEMES[d.theme],ink='#1d1d1d',pad=40,inner=w-2*pad,out:Prim[]=[{t:'rect',x:0,y:0,w,h,fill:'#ffffff'}];
 const tabsH=d.tabs?104:0,footH=78,bottom=h-tabsH-footH;let y=28;
 if(d.logo!=='none'){out.push(logoBox(d.logo,pad,y,inner,d.logo==='wide'?92:110,'center'));y+=d.logo==='wide'?100:118;}
 // Headline band
 const head=safeText(d.headline||'Your headline');let hs=40;let lines=wrap(m,head,hs,inner-24,true);while((lines.length>2||lines.some(l=>m(l,hs,true)>inner-24))&&hs>20){hs-=2;lines=wrap(m,head,hs,inner-24,true);}
 const sub=safeText(d.subheadline);const subLines=sub?wrap(m,sub,15,inner-24):[];
 const bandH=24+lines.length*hs*1.08+(subLines.length?subLines.length*19+6:0)+14;
 out.push({t:'rect',x:0,y,w,h:bandH,fill:th.accent});
 let ty=y+20+hs*.82;for(const l of lines){out.push(centered(m,l,hs,w/2,ty,'#ffffff',true));ty+=hs*1.08;}
 ty+=4;for(const l of subLines){out.push(centered(m,l,15,w/2,ty,'#ffffff'));ty+=19;}
 y+=bandH+18;
 // Offer / call-to-action box is anchored above the footer; content fills the space in between.
 const offer=safeText(d.offer);const offerLines=offer?wrap(m,offer,17,inner-36,true):[];const offerH=offerLines.length?offerLines.length*21+26:0;
 const offerY=bottom-14-offerH;
 const bullets=safeText(d.bullets).split('\n').map(s=>s.trim().replace(/^[-*•]\s*/,'')).filter(Boolean);
 let bs=d.photo?15:19;let bl=bullets.map(b=>wrap(m,b,bs,inner-26));const gap=()=>bs*(d.photo?.55:.9);const listH=()=>bl.reduce((a,l)=>a+l.length*bs*1.3+gap(),0);
 const room=offerY-14-y;let photoH=d.photo?Math.max(0,Math.min(250,room-listH()-14)):0;
 if(d.photo&&photoH<110){photoH=0;}
 while(listH()>room-(photoH?photoH+14:0)&&bs>9){bs-=.5;bl=bullets.map(b=>wrap(m,b,bs,inner-26));}
 if(photoH){out.push({t:'img',key:'photo',x:pad,y,w:inner,h:photoH,cover:true});y+=photoH+16;}
 else{const spare=offerY-14-y-listH();if(spare>0)y+=Math.min(spare/2,60);}
 for(const b of bl){out.push({t:'rect',x:pad+2,y:y+bs*.5-5.5,w:9,h:9,fill:th.accent});let ly=y+bs*.82;for(const l of b){if(ly>offerY-6)break;out.push({t:'text',x:pad+22,y:ly,size:bs,color:ink,text:l});ly+=bs*1.3;}y+=b.length*bs*1.3+gap();}
 if(offerH){out.push({t:'rect',x:pad,y:offerY,w:inner,h:offerH,fill:'#ffffff',stroke:th.accent,width:2.5});let oy=offerY+13+17*.82;for(const l of offerLines){out.push(centered(m,l,17,w/2,oy,th.accent,true));oy+=21;}}
 // Contact footer
 out.push({t:'rect',x:0,y:bottom,w,h:footH,fill:th.deep});
 const phone=safeText(d.phone);if(phone)out.push(centered(m,phone,fit(m,phone,28,inner,true),w/2,bottom+36,'#ffffff',true));
 const rest=[d.contactName,d.website,d.email].map(safeText).filter(Boolean).join('    ');if(rest)out.push(centered(m,rest,fit(m,rest,12,inner),w/2,bottom+60,'#ffffff'));
 // Tear-off tabs
 if(d.tabs){const n=8,tw=w/n,top=h-tabsH;out.push({t:'line',x1:0,y1:top,x2:w,y2:top,color:'#9a9a9a',width:.8,dash:4});
  const lab=[safeText(d.contactName||'Fan Guys'),phone].filter(Boolean);
  for(let i=0;i<n;i++){if(i)out.push({t:'line',x1:i*tw,y1:top,x2:i*tw,y2:h,color:'#9a9a9a',width:.8,dash:4});
   const cx=i*tw+tw/2;const len=tabsH-14;const s1=fit(m,lab[0]||'',10,len,true),s2=fit(m,lab[1]||'',10,len);
   if(lab[0])out.push({t:'text',x:cx-3,y:h-7,size:s1,bold:true,color:ink,text:lab[0],rot:90});
   if(lab[1])out.push({t:'text',x:cx+s2+1,y:h-7,size:s2,color:ink,text:lab[1],rot:90});}}
 return clamp(out,m,w-pad/2);
}

export const defaultCard=(p:any={}):CardData=>({style:'classic',theme:'blue',logo:'wide',name:p.name||'Your Name',title:'HVLS Fan Installation & Service',company:'Fan Guys',tagline:'',phone:p.phone||'(555) 555-0100',email:p.email||'you@bigfanguys.com',website:p.website||'bigfanguys.com',address:p.address||''});
export const defaultFlyer=(p:any={}):FlyerData=>({theme:'blue',logo:'wide',headline:'Big fans. Cooler warehouses. Lower bills.',subheadline:'HVLS fan installation and service, nationwide.',bullets:'Industrial fans sized and placed for your building\nInstallation, electrical hookup and controls\nAnnual inspection and cleaning programs\nFast scheduling for multi-site rollouts',offer:'Call today for a free site assessment',phone:p.phone||'(555) 555-0100',email:p.email||'',website:p.website||'bigfanguys.com',contactName:p.name||'Fan Guys',tabs:false,photo:null});

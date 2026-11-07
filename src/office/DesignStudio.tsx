import {useEffect,useRef,useState} from 'react';
import {IdCard,Megaphone,Download,FileText,ImagePlus,X} from 'lucide-react';
import {setting,setSetting} from '../storage';
import {makeMeasure,cardLayout,flyerLayout,defaultCard,defaultFlyer,THEMES,CARD,LETTER,type CardData,type FlyerData,type Measure,type Prim,type Theme} from './design-layout';
import {cardSheetPdf,cardPrintShopPdf,flyerPdf,type DesignImages} from './design-pdf';
import OfficeExport,{type PreparedFile} from './OfficeExport';

type Saved={card:CardData;flyer:FlyerData};
const KEY='office:design-studio';
const loadImage=(src:string)=>new Promise<HTMLImageElement>((ok,fail)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>fail(Error('Image could not be loaded.'));i.src=src;});
async function logoBytes(kind:'wide'|'round'){const r=await fetch(new URL(`brand/fan-guys-blue-${kind}.jpg`,document.baseURI));if(!r.ok)throw Error('The Fan Guys logo is not available offline yet. Open this screen once with a connection.');return new Uint8Array(await r.arrayBuffer());}
// Crop to the exact box shape so the PDF photo fills its space without stretching.
function coverJpeg(img:HTMLImageElement,w:number,h:number){const scale=2.4,c=document.createElement('canvas');c.width=Math.round(w*scale);c.height=Math.round(h*scale);const g=c.getContext('2d')!;const s=Math.max(c.width/img.naturalWidth,c.height/img.naturalHeight);const dw=img.naturalWidth*s,dh=img.naturalHeight*s;g.drawImage(img,(c.width-dw)/2,(c.height-dh)/2,dw,dh);return c.toDataURL('image/jpeg',.85);}
const dataBytes=(url:string)=>Uint8Array.from(atob(url.split(',')[1]),ch=>ch.charCodeAt(0));
async function shrinkPhoto(file:File){const url=URL.createObjectURL(file);try{const img=await loadImage(url);const k=Math.min(1,1800/Math.max(img.naturalWidth,img.naturalHeight));const c=document.createElement('canvas');c.width=Math.round(img.naturalWidth*k);c.height=Math.round(img.naturalHeight*k);c.getContext('2d')!.drawImage(img,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.85);}finally{URL.revokeObjectURL(url);}}

function paint(canvas:HTMLCanvasElement,prims:Prim[],size:{w:number;h:number},imgs:Record<string,HTMLImageElement|undefined>){
 const host=canvas.parentElement!,cs=getComputedStyle(host);const inner=host.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);const cssW=Math.max(120,Math.min(inner,size.w===CARD.w?460:720));const k=cssW/size.w,dpr=Math.min(window.devicePixelRatio||1,2);
 canvas.style.width=cssW+'px';canvas.style.maxWidth='100%';canvas.style.height=size.h*k+'px';canvas.width=Math.round(cssW*dpr);canvas.height=Math.round(size.h*k*dpr);
 const g=canvas.getContext('2d')!;g.setTransform(k*dpr,0,0,k*dpr,0,0);g.textBaseline='alphabetic';
 for(const p of prims){g.save();
  if(p.t==='rect'){g.fillStyle=p.fill;g.fillRect(p.x,p.y,p.w,p.h);if(p.stroke){g.strokeStyle=p.stroke;g.lineWidth=p.width||1;g.strokeRect(p.x+(p.width||1)/2,p.y+(p.width||1)/2,p.w-(p.width||1),p.h-(p.width||1));}}
  else if(p.t==='text'){g.fillStyle=p.color;g.font=`${p.bold?'700 ':''}${p.size}px Helvetica, Arial, sans-serif`;if(p.rot){g.translate(p.x,p.y);g.rotate(-Math.PI/2);g.fillText(p.text,0,0);}else g.fillText(p.text,p.x,p.y);}
  else if(p.t==='line'){g.strokeStyle=p.color;g.lineWidth=p.width;if(p.dash)g.setLineDash([p.dash,p.dash]);g.beginPath();g.moveTo(p.x1,p.y1);g.lineTo(p.x2,p.y2);g.stroke();}
  else if(p.t==='img'){const im=imgs[p.key];if(im){if(p.cover){const s=Math.max(p.w/im.naturalWidth,p.h/im.naturalHeight),sw=p.w/s,sh=p.h/s;g.drawImage(im,(im.naturalWidth-sw)/2,(im.naturalHeight-sh)/2,sw,sh,p.x,p.y,p.w,p.h);}else g.drawImage(im,p.x,p.y,p.w,p.h);}}
  g.restore();}
}

export default function DesignStudio({onOpenPdf,onNotice}:{onOpenPdf:(bytes:Uint8Array,name:string)=>Promise<void>;onNotice:(s:string)=>void}){
 const [mode,setMode]=useState<'card'|'flyer'>('card'),[state,setState]=useState<Saved|null>(null),[measure,setMeasure]=useState<Measure>(),[imgs,setImgs]=useState<Record<string,HTMLImageElement|undefined>>({}),[exporter,setExporter]=useState<(()=>Promise<PreparedFile>)|null>(null),[cutMarks,setCutMarks]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const canvas=useRef<HTMLCanvasElement>(null),photoInput=useRef<HTMLInputElement>(null),timer=useRef<number|undefined>(undefined);
 useEffect(()=>{(async()=>{try{const [m,profile,head,saved]=await Promise.all([makeMeasure(),setting<any>('profile'),setting<any>('office:letterhead-default'),setting<Saved>(KEY)]);const p={...(profile||{}),...(head||{})};setMeasure(()=>m);setState({card:{...defaultCard(p),...(saved?.card||{})},flyer:{...defaultFlyer(p),...(saved?.flyer||{})}});}catch(e){setError((e as Error).message);}})();
  for(const k of ['wide','round'] as const)loadImage(`./brand/fan-guys-blue-${k}.jpg`).then(i=>setImgs(x=>({...x,[k]:i}))).catch(()=>{});},[]);
 useEffect(()=>{const src=state?.flyer.photo;if(!src){setImgs(x=>({...x,photo:undefined}));return;}loadImage(src).then(i=>setImgs(x=>({...x,photo:i}))).catch(()=>{});},[state?.flyer.photo]);
 const prims=state&&measure?(mode==='card'?cardLayout(state.card,measure):flyerLayout(state.flyer,measure)):[];
 useEffect(()=>{const c=canvas.current;if(!c||!prims.length)return;const draw=()=>paint(c,prims,mode==='card'?CARD:LETTER,imgs);draw();const ro=new ResizeObserver(draw);ro.observe(c.parentElement!);return()=>ro.disconnect();});
 function update(next:Saved){setState(next);clearTimeout(timer.current);timer.current=window.setTimeout(()=>setSetting(KEY,next).catch(e=>setError('Could not save on this device: '+e.message)),500);}
 const card=(patch:Partial<CardData>)=>state&&update({...state,card:{...state.card,...patch}});
 const flyer=(patch:Partial<FlyerData>)=>state&&update({...state,flyer:{...state.flyer,...patch}});
 async function images(withPhoto:boolean):Promise<DesignImages>{const d=mode==='card'?state!.card:state!.flyer;const out:DesignImages={};if(d.logo!=='none')out[d.logo]=await logoBytes(d.logo);
  if(withPhoto&&imgs.photo){const box=prims.find(p=>p.t==='img'&&p.key==='photo') as any;if(box)out.photo=dataBytes(coverJpeg(imgs.photo,box.w,box.h));}return out;}
 const fileBase=()=>((mode==='card'?state!.card.name:state!.flyer.headline)||'Fan Guys').replace(/[^\w\- ]+/g,'').trim().slice(0,40)||'Fan Guys';
 async function make(kind:'sheet'|'shop'|'flyer'):Promise<PreparedFile>{const m=measure!;const bytes=kind==='sheet'?await cardSheetPdf(state!.card,m,await images(false),cutMarks):kind==='shop'?await cardPrintShopPdf(state!.card,m,await images(false)):await flyerPdf(state!.flyer,m,await images(true));
  const name=`${fileBase()} ${kind==='sheet'?'business cards 10-up':kind==='shop'?'business card print shop':'flyer'}.pdf`;return {bytes,name,type:'application/pdf'};}
 async function openInPdf(kind:'sheet'|'flyer'){setBusy(true);setError('');try{const f=await make(kind);await onOpenPdf(f.bytes,f.name);onNotice('Opened in PDF tools. You can sign, mark up or print from there.');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 if(error&&!state)return <div className="design-studio"><p role="alert">{error}</p></div>;
 if(!state)return <div className="design-studio"><p>Loading designer…</p></div>;
 const theme=(value:Theme,set:(t:Theme)=>void)=><div className="design-chips" role="group" aria-label="Colour">{(Object.keys(THEMES) as Theme[]).map(t=><button key={t} className={value===t?'selected':''} onClick={()=>set(t)}><i style={{background:THEMES[t].accent}}/>{THEMES[t].label}</button>)}</div>;
 const logoPick=(value:string,set:(v:any)=>void)=><div className="design-chips" role="group" aria-label="Logo">{[['wide','Wide logo'],['round','Round logo'],['none','No logo']].map(([v,l])=><button key={v} className={value===v?'selected':''} onClick={()=>set(v)}>{l}</button>)}</div>;
 const field=(label:string,value:string,set:(v:string)=>void,opts:{multi?:boolean;type?:string;hint?:string}={})=><label className="design-field"><span>{label}</span>{opts.multi?<textarea rows={5} value={value} onChange={e=>set(e.target.value)}/>:<input type={opts.type||'text'} value={value} onChange={e=>set(e.target.value)}/>}{opts.hint&&<small>{opts.hint}</small>}</label>;
 const c=state.card,f=state.flyer;
 return <div className="design-studio">
  <div className="design-tabs" role="tablist"><button role="tab" aria-selected={mode==='card'} className={mode==='card'?'selected':''} onClick={()=>setMode('card')}><IdCard size={16}/> Business cards</button><button role="tab" aria-selected={mode==='flyer'} className={mode==='flyer'?'selected':''} onClick={()=>setMode('flyer')}><Megaphone size={16}/> Flyer</button></div>
  <div className="design-layout">
   <div className={'design-preview '+mode}><canvas ref={canvas} aria-label={mode==='card'?'Business card preview':'Flyer preview'}/><p className="design-note">{mode==='card'?'Actual size 3.5 × 2 in.':'US Letter, 8.5 × 11 in.'} Saved on this device as you type.</p></div>
   <div className="design-form">
    {mode==='card'?<>
     <h3>Style</h3><div className="design-chips" role="group" aria-label="Card style">{[['classic','Classic'],['stacked','Side logo'],['band','Big logo']].map(([v,l])=><button key={v} className={c.style===v?'selected':''} onClick={()=>card({style:v as any})}>{l}</button>)}</div>
     {theme(c.theme,t=>card({theme:t}))}{logoPick(c.logo,v=>card({logo:v}))}
     <h3>Details</h3>
     {field('Name',c.name,v=>card({name:v}))}{field('Title or trade',c.title,v=>card({title:v}))}{field('Company',c.company,v=>card({company:v}))}
     {field('Phone',c.phone,v=>card({phone:v}),{type:'tel'})}{field('Email',c.email,v=>card({email:v}),{type:'email'})}{field('Website',c.website,v=>card({website:v}))}{field('City or address',c.address,v=>card({address:v}),{hint:'Leave blank to hide.'})}
     {c.style==='classic'&&field('Tagline',c.tagline,v=>card({tagline:v}),{hint:'Short line above the colour bar. Optional.'})}
     <h3>Print</h3>
     <label className="design-check"><input type="checkbox" checked={cutMarks} onChange={e=>setCutMarks(e.target.checked)}/> Cut marks on the 10-card sheet (for plain card stock)</label>
     <div className="design-actions"><button className="btn primary" disabled={busy} onClick={()=>setExporter(()=>()=>make('sheet'))}><Download size={15}/> 10 cards on a sheet (PDF)</button><button className="btn" disabled={busy} onClick={()=>setExporter(()=>()=>make('shop'))}><Download size={15}/> Print-shop file with bleed</button><button className="btn" disabled={busy} onClick={()=>openInPdf('sheet')}><FileText size={15}/> Open sheet in PDF tools</button></div>
     <p className="design-note">The 10-card sheet lines up with standard perforated 2 × 3.5 in card stock (10 per sheet, like Avery 8371). Print at 100% / Actual size, not "Fit to page." Use the print-shop file for Staples, Office Depot or online printers.</p>
    </>:<>
     <h3>Look</h3>{theme(f.theme,t=>flyer({theme:t}))}{logoPick(f.logo,v=>flyer({logo:v}))}
     <h3>Words</h3>
     {field('Headline',f.headline,v=>flyer({headline:v}))}{field('Sub-headline',f.subheadline,v=>flyer({subheadline:v}))}
     {field('Bullet points',f.bullets,v=>flyer({bullets:v}),{multi:true,hint:'One per line.'})}{field('Offer or call to action',f.offer,v=>flyer({offer:v}),{hint:'Shown in a box. Leave blank to hide.'})}
     <h3>Photo</h3>
     <div className="design-actions"><button className="btn" onClick={()=>photoInput.current?.click()}><ImagePlus size={15}/> {f.photo?'Change photo':'Add a photo'}</button>{f.photo&&<button className="btn" onClick={()=>flyer({photo:null})}><X size={15}/> Remove photo</button>}</div>
     <input ref={photoInput} type="file" accept="image/*" hidden onChange={async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;try{flyer({photo:await shrinkPhoto(file)});}catch(er){setError((er as Error).message);}}}/>
     <h3>Contact</h3>
     {field('Phone',f.phone,v=>flyer({phone:v}),{type:'tel'})}{field('Name',f.contactName,v=>flyer({contactName:v}))}{field('Website',f.website,v=>flyer({website:v}))}{field('Email',f.email,v=>flyer({email:v}),{type:'email'})}
     <label className="design-check"><input type="checkbox" checked={f.tabs} onChange={e=>flyer({tabs:e.target.checked})}/> Tear-off phone number tabs at the bottom</label>
     <div className="design-actions"><button className="btn primary" disabled={busy} onClick={()=>setExporter(()=>()=>make('flyer'))}><Download size={15}/> Flyer PDF</button><button className="btn" disabled={busy} onClick={()=>openInPdf('flyer')}><FileText size={15}/> Open in PDF tools</button></div>
    </>}
    {error&&<p role="alert" className="design-error">{error}</p>}
   </div>
  </div>
  {exporter&&<OfficeExport prepare={exporter} onClose={()=>setExporter(null)}/>}
 </div>;
}

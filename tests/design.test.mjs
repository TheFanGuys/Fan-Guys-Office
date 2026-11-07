import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {PDFDocument} from 'pdf-lib';
import {makeMeasure,cardLayout,flyerLayout,defaultCard,defaultFlyer,CARD,LETTER} from '../src/office/design-layout.ts';import {cardSheetPdf,cardPrintShopPdf,flyerPdf} from '../src/office/design-pdf.ts';
const images=async()=>({wide:new Uint8Array(await readFile('public/brand/fan-guys-blue-wide.jpg')),round:new Uint8Array(await readFile('public/brand/fan-guys-blue-round.jpg'))});
const inside=(prims,box)=>prims.filter(p=>p.t==='text'&&!p.rot).every(p=>p.x>=-0.5&&p.y<=box.h+0.5&&p.y>0);

test('Every card style and colour stays inside the 3.5 x 2 in card, even with long text',async()=>{const m=await makeMeasure();
 for(const style of ['classic','stacked','band'])for(const theme of ['blue','red','dark'])for(const logo of ['wide','round','none']){
  const d={...defaultCard({name:'Christopher Fogarty-Longname',email:'someone.with.a.long.address@bigfanguys.com',phone:'(928) 555-0100'}),style,theme,logo,address:'1234 East Orchard View Road, Dewey AZ 86327',tagline:'Nationwide HVLS installs'};
  const prims=cardLayout(d,m);assert(inside(prims,CARD),`${style}/${theme}/${logo}`);
  for(const p of prims.filter(p=>p.t==='text'))assert(p.x+m(p.text,p.size,p.bold)<=CARD.w+0.5,`text overflows in ${style}: ${p.text}`);}});

test('Card sheet has 10 cards on one Letter page; print-shop file has bleed and trim boxes',async()=>{const m=await makeMeasure(),img=await images();
 const sheet=await PDFDocument.load(await cardSheetPdf(defaultCard(),m,img,true));assert.equal(sheet.getPageCount(),1);const pg=sheet.getPage(0);assert.equal(pg.getWidth(),612);assert.equal(pg.getHeight(),792);
 const shop=await PDFDocument.load(await cardPrintShopPdf({...defaultCard(),style:'band'},m,img));const sp=shop.getPage(0);assert.equal(sp.getWidth(),270);assert.equal(sp.getHeight(),162);const t=sp.getTrimBox();assert.equal(t.width,252);assert.equal(t.height,144);});

test('Flyer fits a Letter page with and without photo and tear-off tabs; odd characters never break export',async()=>{const m=await makeMeasure(),img=await images();
 const photo=new Uint8Array(await readFile('public/brand/fan-guys-blue-round.jpg'));
 for(const tabs of [false,true])for(const withPhoto of [false,true])for(const theme of ['blue','red','dark']){
  const d={...defaultFlyer(),theme,tabs,photo:withPhoto?'x':null,headline:'Summer’s coming — is your warehouse ready? 🔥',bullets:'• One\n- Two\nThree with a much longer line of text that has to wrap onto a second line on the page'};
  const prims=flyerLayout(d,m);for(const p of prims.filter(p=>p.t==='text'&&!p.rot)){assert(p.y<=LETTER.h&&p.y>0);assert(p.x+m(p.text,p.size,p.bold)<=LETTER.w+0.5,p.text);}
  const bytes=await flyerPdf(d,m,{...img,...(withPhoto?{photo}:{})});assert.equal((await PDFDocument.load(bytes)).getPageCount(),1);}});

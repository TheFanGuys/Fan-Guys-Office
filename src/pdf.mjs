import {PDFDocument,StandardFonts,rgb,degrees,PDFName} from 'pdf-lib';
export function parsePages(input,count){if(!Number.isInteger(count)||count<1)throw new Error('Document has no pages.');if(!input.trim())throw new Error('Enter a page number or range.');let result=[];for(const segment of input.split(',')){const s=segment.trim();if(!/^\d+(\s*-\s*\d+)?$/.test(s))throw new Error('Use page numbers such as 1-3, 5.');const [a,b=a]=s.split('-').map(Number);if(a<1||b<a||b>count)throw new Error(`Pages must be between 1 and ${count}, in ascending ranges.`);for(let i=a;i<=b;i++)if(!result.includes(i-1))result.push(i-1);}return result;}
export async function load(bytes){return PDFDocument.load(bytes);}
export async function inspect(bytes){const d=await load(bytes);return {pages:d.getPageCount(),forms:d.getForm().getFields().length};}
export async function assemble(sources,entries){
 if(!entries.length)throw new Error('Keep at least one page.');
 const sourceIds=[...new Set(entries.map(e=>e.source))];
 if(sourceIds.length===1){
  // Retain the actual page objects and AcroForm tree: copying pages loses widgets.
  const doc=await load(sources[sourceIds[0]]),pages=doc.getPages();
  const kept=new Set(entries.map(e=>e.index));
  if(kept.size!==entries.length)throw new Error('A page can only appear once when preserving form fields.');
  for(const e of entries)if(!pages[e.index])throw new Error('Invalid page index.');
  const form=doc.getForm();if(form.hasXFA())throw new Error('XFA forms cannot be safely rearranged in this build. Your original is unchanged.');
  for(const field of form.getFields()){
   const widgets=field.acroField.getWidgets();const dropped=[];
   for(let i=0;i<widgets.length;i++){
    const widget=widgets[i];const ref=widget.dict.get(PDFName.of('P'));
    let owner=pages.findIndex(page=>page.ref===ref||page.ref.toString()===ref?.toString());
    if(owner<0)owner=pages.findIndex(page=>page.node.Annots()?.asArray().some(r=>doc.context.lookup(r)===widget.dict));
    if(owner>=0&&!kept.has(owner))dropped.push(i);
   }
   if(dropped.length===widgets.length&&widgets.length){form.removeField(field);}else for(const i of dropped.reverse())field.acroField.removeWidget(i);
  }
  for(let i=pages.length-1;i>=0;i--)doc.removePage(i);
  for(const entry of entries){const page=pages[entry.index];page.setRotation(degrees(((page.getRotation().angle+entry.rotation)%360+360)%360));doc.addPage(page);}
  return doc.save({updateFieldAppearances:false});
 }
 // Merging separate AcroForm trees with duplicate field names is intentionally flattened.
 const out=await PDFDocument.create(),loaded=new Map();
 for(const entry of entries){if(!loaded.has(entry.source)){const d=await load(sources[entry.source]);const form=d.getForm();if(form.hasXFA())throw new Error('XFA forms cannot be safely merged in this build.');if(form.getFields().length)form.flatten({updateFieldAppearances:false});loaded.set(entry.source,d);}const [page]=await out.copyPages(loaded.get(entry.source),[entry.index]);page.setRotation(degrees((page.getRotation().angle+entry.rotation)%360));out.addPage(page);}
 return out.save({updateFieldAppearances:false});
}
export async function lockFormFields(bytes){const doc=await load(bytes);const form=doc.getForm();if(form.hasXFA())throw new Error('XFA form locking is not supported.');for(const field of form.getFields())field.enableReadOnly();return doc.save({updateFieldAppearances:false});}

export async function optimize(bytes){const d=await load(bytes);return d.save({useObjectStreams:true});}
export async function imagePdf(files){const d=await PDFDocument.create();for(const f of files){const bytes=new Uint8Array(await f.arrayBuffer());const im=f.type==='image/png'?await d.embedPng(bytes):await d.embedJpg(bytes);const page=d.addPage([612,792]);const scale=Math.min(540/im.width,720/im.height);const w=im.width*scale,h=im.height*scale;page.drawImage(im,{x:(612-w)/2,y:(792-h)/2,width:w,height:h});}return d.save();}
export async function demo(){const d=await PDFDocument.create();const regular=await d.embedFont(StandardFonts.Helvetica);const bold=await d.embedFont(StandardFonts.HelveticaBold);const teal=rgb(.0,.43,.39),ink=rgb(.1,.16,.17);const text=(p,s,x,y,size=11,font=regular,color=ink)=>p.drawText(s,{x,y,size,font,color});for(let i=0;i<3;i++){const p=d.addPage([612,792]);p.drawRectangle({x:44,y:727,width:35,height:35,color:teal});text(p,'P',53,738,20,bold,rgb(1,1,1));text(p,'PDF PRO',91,742,14,bold);text(p,'WORKSPACE SAMPLE  /  '+String(i+1).padStart(2,'0'),365,746,9);p.drawLine({start:{x:44,y:712},end:{x:568,y:712},thickness:1,color:rgb(.8,.85,.83)});text(p,i===0?'Service Agreement':i===1?'Scope of Work':'Completion Checklist',44,662,30,bold);text(p,'A sample document. Try the tools, then make it yours.',44,635,11);if(i===0){text(p,'PROJECT DETAILS',44,591,10,bold,teal);text(p,'Client name',44,563);text(p,'Project / reference',44,501);const form=d.getForm();form.createTextField('Client name').addToPage(p,{x:44,y:526,width:520,height:27,borderWidth:1,borderColor:rgb(.7,.8,.77),backgroundColor:rgb(.97,.99,.98)});form.createTextField('Project reference').addToPage(p,{x:44,y:464,width:520,height:27,borderWidth:1,borderColor:rgb(.7,.8,.77),backgroundColor:rgb(.97,.99,.98)});text(p,'1. Services',44,422,13,bold);text(p,'The provider will complete the work described in the attached scope.',44,398);text(p,'2. Review and acceptance',44,356,13,bold);text(p,'Review the agreement, add your notes, and complete the fields above.',44,332);text(p,'This sample is for testing and is not legal advice or a contract template.',44,310,10);text(p,'Authorized signature',44,239,11,bold);p.drawLine({start:{x:44,y:184},end:{x:353,y:184},thickness:1,color:ink});text(p,'Date',409,239,11,bold);p.drawLine({start:{x:409,y:184},end:{x:568,y:184},thickness:1,color:ink});}else if(i===1){text(p,'SCOPE & DELIVERABLES',44,586,10,bold,teal);['Review the site and confirm project requirements.','Record findings and include supporting photographs.','Complete the agreed work and perform final checks.','Deliver a clear report and obtain customer acceptance.'].forEach((s,j)=>{text(p,String(j+1).padStart(2,'0'),44,543-j*70,13,bold,teal);text(p,s,81,543-j*70,11);});}else{['Site inspection completed','Supporting photographs attached','Customer details confirmed','Final document reviewed'].forEach((s,j)=>{const y=570-j*64;d.getForm().createCheckBox('check-'+j).addToPage(p,{x:44,y:y-4,width:16,height:16});text(p,s,78,y,12);});text(p,'NOTES',44,278,10,bold,teal);for(let j=0;j<4;j++)p.drawLine({start:{x:44,y:242-j*30},end:{x:568,y:242-j*30},thickness:.5,color:rgb(.8,.85,.83)});}text(p,'Documents. Done right.',44,45,9,regular,teal);text(p,`${i+1} / 3`,540,45,9);}return d.save();}

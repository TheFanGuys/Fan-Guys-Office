import {openWorkspaceDatabase} from '../storage-db.mjs';
export type Kind='sheet'|'writer'|'note'|'job';
export interface OfficeItem {id:string;kind:Kind;title:string;created:number;updated:number;jobId:string;data:any;}
const db=openWorkspaceDatabase();const prefix='office:v3:';
export async function items():Promise<OfficeItem[]>{const tx=(await db).transaction('settings');const keys=await tx.store.getAllKeys();const all=await Promise.all(keys.filter((k:any)=>typeof k==='string'&&k.startsWith(prefix)).map(k=>tx.store.get(k)));await tx.done;return all.sort((a,b)=>b.updated-a.updated);}
export async function saveItem(item:OfficeItem){await(await db).put('settings',item,prefix+item.id);}
export async function deleteItem(id:string){await(await db).delete('settings',prefix+id);}
export function newItem(kind:Kind,title:string,data:any):OfficeItem {const now=Date.now();return {id:crypto.randomUUID(),kind,title,created:now,updated:now,jobId:'',data};}
export async function officeBackup(){
 const d=await db;const {zipSync,strToU8}=await import('fflate');const docs=await d.getAll('documents'),settings=await d.getAll('settings'),keys=await d.getAllKeys('settings'),templates=await d.getAll('templates');
 const manifest={format:'fan-guys-office-backup',version:3,created:Date.now(),documents:docs.map(({bytes,original,...meta}:any)=>meta),settings:keys.map((key,i)=>({key,value:settings[i]})),templates};
 const files:Record<string,Uint8Array>={};for(const doc of docs){files[`documents/${doc.id}.pdf`]=doc.bytes;files[`originals/${doc.id}.pdf`]=doc.original;}
 files['office-backup.json']=strToU8(JSON.stringify(manifest));return zipSync(files);
}
export async function restoreOfficeBackup(bytes:Uint8Array){
 const {unzipSync,strFromU8}=await import('fflate');let total=0;
 const files=unzipSync(bytes,{filter:file=>{total+=file.originalSize;if(total>250*1024*1024||file.originalSize>120*1024*1024)throw new Error('Backup expands beyond the 250 MB safety limit.');return true;}});
 if(!files['office-backup.json'])throw new Error('Choose a Fan Guys Office complete backup ZIP.');
 const m=JSON.parse(strFromU8(files['office-backup.json']));if(m.format!=='fan-guys-office-backup'||m.version!==3||!Array.isArray(m.documents)||!Array.isArray(m.settings)||!Array.isArray(m.templates))throw new Error('Unsupported or damaged backup.');
 // Validate everything before starting the atomic restore; merge missing records, never replace current data.
 for(const doc of m.documents)if(typeof doc.id!=='string'||typeof doc.name!=='string'||!Number.isFinite(doc.pages)||!files[`documents/${doc.id}.pdf`]||!files[`originals/${doc.id}.pdf`])throw new Error('Backup has a missing PDF.');
 for(const s of m.settings){if(typeof s.key!=='string')throw new Error('Invalid backup settings.');if(s.key.startsWith(prefix)){const v=s.value;if(!v||typeof v.id!=='string'||typeof v.title!=='string'||!['sheet','writer','note','job'].includes(v.kind)||!v.data||typeof v.data!=='object'||s.key!==prefix+v.id)throw new Error('Invalid office file in backup.');}if(s.key==='signatureSlots'&&(!Array.isArray(s.value)||s.value.length!==2||s.value.some((v:any)=>typeof v.name!=='string'||(v.data!==null&&typeof v.data!=='string'))))throw new Error('Invalid signature settings in backup.');}
 for(const t of m.templates)if(typeof t.id!=='string')throw new Error('Invalid template.');
 const d=await db,tx=d.transaction(['documents','settings','templates'],'readwrite');let count=0;
 for(const doc of m.documents)if((await tx.objectStore('documents').get(doc.id))===undefined){await tx.objectStore('documents').put({...doc,bytes:files[`documents/${doc.id}.pdf`],original:files[`originals/${doc.id}.pdf`]});count++;}
 for(const s of m.settings)if((await tx.objectStore('settings').get(s.key))===undefined){await tx.objectStore('settings').put(s.value,s.key);count++;}
 for(const t of m.templates)if((await tx.objectStore('templates').get(t.id))===undefined){await tx.objectStore('templates').put(t);count++;}
 await tx.done;return count;
}

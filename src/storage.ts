import {openWorkspaceDatabase,emptySignatureSlots} from './storage-db.mjs';
export interface StoredDocument {id:string;name:string;bytes:Uint8Array;original:Uint8Array;updated:number;created:number;pages:number;size:number;project:string;starred:boolean;}
const db=openWorkspaceDatabase();
export async function documents():Promise<StoredDocument[]>{return (await (await db).getAll('documents')).sort((a,b)=>b.updated-a.updated);}
export async function putDocument(doc:StoredDocument){await (await db).put('documents',doc);}
export async function removeDocument(id:string){await (await db).delete('documents',id);}
export async function setting<T>(key:string):Promise<T|undefined>{return (await db).get('settings',key);}
export async function setSetting(key:string,value:unknown){await (await db).put('settings',value,key);}
export async function getTemplates(){return (await db).getAll('templates');}
export async function putTemplate(value:any){await (await db).put('templates',value);}
export async function deleteTemplate(id:string){await (await db).delete('templates',id);}
export function download(data:Uint8Array|Blob|string,name:string,type='application/pdf'){const blob=data instanceof Blob?data:new Blob([typeof data==='string'?data:new Uint8Array(data)],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),15000);}
export const fileSize=(n:number)=>n<1048576?`${Math.max(1,Math.round(n/1024))} KB`:`${(n/1048576).toFixed(1)} MB`;

export interface SignatureSlot {id:number;name:string;data:string|null;mode:'draw'|'type';}
export async function signatureSlots():Promise<SignatureSlot[]>{return (await setting<SignatureSlot[]>('signatureSlots'))||(emptySignatureSlots() as SignatureSlot[]);}
export async function saveSignatureSlots(slots:SignatureSlot[]){if(slots.length!==2)throw new Error('Exactly two signature slots are required.');await setSetting('signatureSlots',slots);}

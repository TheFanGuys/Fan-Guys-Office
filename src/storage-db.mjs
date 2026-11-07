import {openDB} from 'idb';
export const DATABASE_NAME='pdf-pro-v1';
export const LEGACY_DATABASE_NAME='docketra-private-v1';
const stores=['documents','settings','templates'];
export const emptySignatureSlots=()=>[{id:1,name:'Signature 1',data:null,mode:'draw'},{id:2,name:'Signature 2',data:null,mode:'draw'}];
async function existingLegacy(){
  // Aborting the initial upgrade avoids creating an empty legacy database on new installs.
  try{return await openDB(LEGACY_DATABASE_NAME,undefined,{upgrade(_db,oldVersion,_next,tx){if(oldVersion===0){tx.done.catch(()=>{});tx.abort();}}});}catch(e){if(e?.name==='AbortError')return null;throw e;}
}
export async function openWorkspaceDatabase(){
  const target=await openDB(DATABASE_NAME,1,{upgrade(db){db.createObjectStore('documents',{keyPath:'id'});db.createObjectStore('settings');db.createObjectStore('templates',{keyPath:'id'});}});
  if(!(await target.get('settings','migration:docketra:v1'))){
    const old=await existingLegacy();
    try{
      const snapshots=[];
      if(old)for(const name of stores){if(!old.objectStoreNames.contains(name))continue;const tx=old.transaction(name);const [keys,values]=await Promise.all([tx.store.getAllKeys(),tx.store.getAll()]);await tx.done;snapshots.push({name,keys,values});}
      const tx=target.transaction(stores,'readwrite');
      try{
        for(const {name,keys,values} of snapshots){const store=tx.objectStore(name);for(let i=0;i<keys.length;i++){if(await store.get(keys[i])!==undefined)continue;if(store.keyPath)await store.put(values[i]);else await store.put(values[i],keys[i]);}}
        await tx.objectStore('settings').put({completed:Date.now(),source:LEGACY_DATABASE_NAME},'migration:docketra:v1');
        await tx.done;
      }catch(e){try{tx.abort();}catch{}await tx.done.catch(()=>{});throw e;}
    }finally{old?.close();}
  }
  const tx=target.transaction('settings','readwrite');
  if(!await tx.store.get('signatureSlots')){
    const slots=emptySignatureSlots();const original=await tx.store.get('signature');if(typeof original==='string'&&original.startsWith('data:image/'))slots[0].data=original;
    await tx.store.put(slots,'signatureSlots');
  }
  // The old setting is removed only in the transaction that safely stores its replacement.
  await tx.store.delete('signature');await tx.done;
  return target;
}

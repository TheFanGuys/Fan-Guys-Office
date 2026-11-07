import {Task} from '@embedpdf/models';
// The SDK starts a read/write/read transaction for every keystroke. Serialize
// them so an older transaction cannot overwrite a newer field value or preview.
export function serializeFormEdits(plugin:any){
 const original=plugin.setFormFieldValues.bind(plugin);let pending:Promise<unknown>=Promise.resolve();
 plugin.setFormFieldValues=(...args:any[])=>{const task=new Task();pending=pending.catch(()=>{}).then(async()=>{try{const result=await original(...args).toPromise();task.resolve(result);}catch(error){task.reject(error as any);throw error;}});pending.catch(()=>{});return task;};
 return ()=>pending;
}

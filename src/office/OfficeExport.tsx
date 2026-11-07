import {useEffect,useState} from 'react';
import {download} from '../storage';
export interface PreparedFile {bytes:Uint8Array;name:string;type:string;}
export default function OfficeExport({prepare,onClose}:{prepare:()=>Promise<PreparedFile>;onClose:()=>void}){
 const [file,setFile]=useState<File>();const [error,setError]=useState('');
 useEffect(()=>{let live=true;prepare().then(x=>{if(live)setFile(new File([new Uint8Array(x.bytes)],x.name,{type:x.type}));}).catch(e=>live&&setError(e.message));return()=>{live=false;};},[]);
 const share=()=>{if(!file)return;try{if(!navigator.canShare?.({files:[file]})){setError('File sharing is not available here. Use Download, then share the file from Files.');return;}navigator.share({files:[file],title:file.name}).catch(e=>{if(e.name!=='AbortError')setError(e.message);});}catch(e){setError((e as Error).message);}};
 return <div className="modal-backdrop"><section className="modal office-export" role="dialog" aria-modal="true" aria-label="Prepared office file"><h2>{file?'Your file is ready.':'Preparing your file…'}</h2><p>{file?.name||'Processing on this device.'}</p>{error&&<p role="alert">{error}</p>}<div className="modal-actions"><button className="btn" onClick={onClose}>Close</button><button className="btn" disabled={!file} onClick={()=>file&&download(file,file.name,file.type)}>Download file</button><button className="btn primary" disabled={!file} onClick={share}>Share / Save to Files</button></div></section></div>;
}

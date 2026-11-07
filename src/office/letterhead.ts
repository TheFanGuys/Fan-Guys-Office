export interface Letterhead {enabled:boolean;layout:'wide'|'round';business:string;name:string;email:string;phone:string;address:string;website:string;}
export function defaultLetterhead(profile:any={}):Letterhead{return {enabled:true,layout:'wide',business:'Fan Guys',name:profile.name||'',email:profile.email||'',phone:profile.phone||'',address:'',website:'bigfanguys.com'};}
export function logoPath(layout='wide'){return 'brand/fan-guys-blue-'+(layout==='round'?'round':'wide')+'.jpg';}
export async function letterheadLogo(head:Letterhead){const response=await fetch(new URL(logoPath(head.layout),document.baseURI));if(!response.ok)throw Error('The blue Fan Guys logo is not available yet. Open Writer online once before using branded exports offline.');return new Uint8Array(await response.arrayBuffer());}
export function contactLines(head:Letterhead){return [head.business,head.name,head.address,head.phone,head.email,head.website].filter(Boolean);}

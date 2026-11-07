import {Schema} from 'prosemirror-model';
import {schema as basic} from 'prosemirror-schema-basic';
import {addListNodes} from 'prosemirror-schema-list';
let nodes=addListNodes(basic.spec.nodes.remove('image'),'paragraph block*','block');
nodes=nodes.append({table:{group:'block',content:'table_row+',tableRole:'table',parseDOM:[{tag:'table'}],toDOM:()=>['table',{class:'writer-table'},['tbody',0]]},table_row:{content:'table_cell+',tableRole:'row',parseDOM:[{tag:'tr'}],toDOM:()=>['tr',0]},table_cell:{content:'paragraph+',tableRole:'cell',isolating:true,parseDOM:[{tag:'td'},{tag:'th'}],toDOM:()=>['td',0]}} as any);
export const writerSchema=new Schema({nodes,marks:basic.spec.marks});
export const blankDocument=()=>({type:'doc',content:[{type:'paragraph'}]});
export function proposalDocument(){return {type:'doc',content:[{type:'heading',attrs:{level:1},content:[{type:'text',text:'Fan Guys — Scope of Work'}]},{type:'paragraph',content:[{type:'text',text:'Customer: '}]},{type:'paragraph',content:[{type:'text',text:'Job address: '}]},{type:'heading',attrs:{level:2},content:[{type:'text',text:'Proposed work'}]},{type:'paragraph',content:[{type:'text',text:'Describe equipment, installation, electrical scope and exclusions.'}]},{type:'heading',attrs:{level:2},content:[{type:'text',text:'Schedule and acceptance'}]},{type:'paragraph',content:[{type:'text',text:'Proposed start date: '}]},{type:'paragraph',content:[{type:'text',text:'Customer signature: ____________________    Date: __________'}]}]};}
export function textDocument(text:string){return {type:'doc',content:text.split(/\r?\n/).map(line=>({type:'paragraph',...(line?{content:[{type:'text',text:line}]}:{})}))};}
export function plainText(node:any):string {if(node.type==='text')return node.text||'';const parts=(node.content||[]).map(plainText);return parts.join(['paragraph','heading'].includes(node.type)?'':'\n');}

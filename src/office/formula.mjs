// Deliberately small, explicit grammar. Never eval imported formulas as JavaScript.
export function colName(n){let s='';for(n++;n>0;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;}
export function colIndex(s){return [...s.toUpperCase()].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0)-1;}
export function cellKey(row,col){return colName(col)+(row+1);}
export function reference(s){const m=/^\$?([A-Z]{1,3})\$?([1-9]\d*)$/i.exec(s);if(!m)throw Error('#REF!');return {row:+m[2]-1,col:colIndex(m[1])};}
export function calculate(book,sheetIndex,key,trail=new Set()){
 const tag=sheetIndex+':'+key;if(trail.has(tag))return '#CYCLE!';const sheet=book.sheets[sheetIndex];if(!sheet)return '#REF!';const raw=sheet.cells[key]?.value??'';if(typeof raw!=='string'||!raw.startsWith('=')){if(raw==='')return '';const n=Number(raw);return Number.isFinite(n)&&!/^0\d/.test(raw)?n:raw;}
 const next=new Set(trail);next.add(tag);
 try{return parse(raw.slice(1),(sheetName,ref)=>{const si=sheetName==null?sheetIndex:book.sheets.findIndex(s=>s.name.toLowerCase()===sheetName.toLowerCase());if(si<0)throw Error('#REF!');reference(ref);const v=calculate(book,si,ref.replaceAll('$','').toUpperCase(),next);if(typeof v==='string'&&v.startsWith('#'))throw Error(v);return v;});}catch(e){return e.message.startsWith('#')?e.message:'#VALUE!';}
}
export function parse(source,resolve){
 const tokens=source.match(/"(?:[^"]|"")*"|'(?:[^']|'')*'|(?:\d*\.)?\d+(?:[eE][+-]?\d+)?|\$?[A-Za-z_][A-Za-z0-9_.$]*|>=|<=|<>|[+\-*/^&=><(),!:%]/g)||[];
 if(tokens.join('').replace(/\s/g,'')!==source.replace(/\s/g,''))throw Error('#UNSUPPORTED!');let i=0;const take=()=>tokens[i++],peek=()=>tokens[i];const expect=t=>{if(take()!==t)throw Error('#VALUE!');};
 const number=v=>{if(v===''||v===false)return 0;if(v===true)return 1;const n=Number(v);if(!Number.isFinite(n))throw Error('#VALUE!');return n;};
 function atom(){let t=take();if(!t)throw Error('#VALUE!');if(t==='+'||t==='-'){const n=number(atom());return t==='-'?-n:n;}if(t==='('){const v=expr();expect(')');return v;}if(t.startsWith('"'))return t.slice(1,-1).replaceAll('""','"');if(/^\d|^\.\d/.test(t))return +t;
 if(peek()==='('){take();const args=[];if(peek()!==')')do{args.push(expr());if(peek()!==',')break;take();}while(true);expect(')');return call(t.toUpperCase(),args);}
 if(t.toUpperCase()==='TRUE')return true;if(t.toUpperCase()==='FALSE')return false;
 let sheet=null;if(peek()==='!'){sheet=t.startsWith("'")?t.slice(1,-1).replaceAll("''", "'"):t;take();t=take();}
 reference(t);if(peek()===':'){take();const end=take();const a=reference(t),b=reference(end);if((Math.abs(a.row-b.row)+1)*(Math.abs(a.col-b.col)+1)>100000)throw Error('#LIMIT!');const values=[];for(let r=Math.min(a.row,b.row);r<=Math.max(a.row,b.row);r++)for(let c=Math.min(a.col,b.col);c<=Math.max(a.col,b.col);c++)values.push(resolve(sheet,cellKey(r,c)));return values;}
 return resolve(sheet,t);
 }
 function power(){let v=atom();if(peek()==='%'){take();v=number(v)/100;}if(peek()==='^'){take();v=number(v)**number(power());}return v;}
 function mul(){let v=power();while(peek()==='*'||peek()==='/'){const op=take(),b=number(power());if(op==='/'&&b===0)throw Error('#DIV/0!');v=op==='*'?number(v)*b:number(v)/b;}return v;}
 function add(){let v=mul();while(peek()==='+'||peek()==='-'||peek()==='&'){const op=take(),b=mul();v=op==='&'?String(v)+String(b):op==='+'?number(v)+number(b):number(v)-number(b);}return v;}
 function expr(){let v=add();while(['=','<>','>','<','>=','<='].includes(peek())){const op=take(),b=add();v=op==='='?v==b:op==='<>'?v!=b:op==='>'?v>b:op==='<'?v<b:op==='>='?v>=b:v<=b;}return v;}
 function call(name,args){const all=args.flat(Infinity),nums=all.filter(v=>v!==''&&typeof v!=='boolean'&&Number.isFinite(Number(v))).map(Number);switch(name){case'SUM':return nums.reduce((a,b)=>a+b,0);case'AVERAGE':if(!nums.length)throw Error('#DIV/0!');return nums.reduce((a,b)=>a+b,0)/nums.length;case'MIN':return nums.length?Math.min(...nums):0;case'MAX':return nums.length?Math.max(...nums):0;case'COUNT':return nums.length;case'COUNTA':return all.filter(v=>v!=='').length;case'ROUND':return Math.round(number(args[0])*10**number(args[1]??0))/10**number(args[1]??0);case'ABS':return Math.abs(number(args[0]));case'IF':return args[0]?args[1]:(args[2]??false);case'AND':return all.every(Boolean);case'OR':return all.some(Boolean);case'NOT':return !args[0];default:throw Error('#UNSUPPORTED!');}}
 const result=expr();if(i!==tokens.length)throw Error('#UNSUPPORTED!');if(typeof result==='number'&&!Number.isFinite(result))throw Error('#NUM!');return result;
}
export function shiftFormula(formula,dr,dc){return formula.replace(/"(?:[^"]|"")*"|'(?:[^']|'')*'|\$?[A-Za-z_][A-Za-z0-9_.$]*/g,(token,offset)=>{if(token[0]==='"'||token[0]==="'"||formula[offset+token.length]==='!')return token;const m=/^(\$?)([A-Z]{1,3})(\$?)([1-9]\d*)$/i.exec(token);if(!m)return token;const [,absC,c,absR,r]=m;const row=+r-1+(absR?0:dr),col=colIndex(c)+(absC?0:dc);return row<0||col<0?'#REF!':absC+colName(col)+absR+(row+1);});}

/** Keep PDF hit boxes intact; SDK handles normal iOS font compensation.
 * Some AcroForms use font-size 0 (automatic). Give those inputs a nonzero,
 * iOS-safe layout font, scaled back into the original widget rectangle.
 */
export function installPdfTouchStyles(root:ShadowRoot){
 const style=document.createElement('style');style.dataset.pdfproTouch='';
 style.textContent='button,[role=button],summary{min-width:44px!important;min-height:44px!important;touch-action:manipulation} @media(pointer:coarse){[data-epdf-handle]::before{content:"";position:absolute;width:44px;height:44px;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:auto;touch-action:none}}';root.appendChild(style);
 const adjust=()=>{for(const input of root.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('input[name],textarea[name]')){
 // Keep the value-bearing text input visible; raster widget previews can lag edits.
 // Normal iOS fields have a scale-compensation wrapper inside this overlay.
 let overlay=input.parentElement;
 while(overlay&&overlay.style.opacity!=='0'&&overlay.style.opacity!=='1')overlay=overlay.parentElement;
 if(overlay){if(overlay.style.opacity==='0')overlay.style.opacity='1';const preview=overlay.previousElementSibling as HTMLElement|null;if(preview&&preview.style.visibility!=='hidden')preview.style.visibility='hidden';}
 if(input.style.fontSize!=='0px'&&!input.hasAttribute('data-pdfpro-auto-font'))continue;
 const parent=input.parentElement;if(!parent)continue;const height=parent.getBoundingClientRect().height;if(!height)continue;
 const ratio=Math.min(1,Math.max(1,height*.72)/16);
 input.setAttribute('data-pdfpro-auto-font','');
 const values={fontSize:'16px',width:`${100/ratio}%`,height:`${100/ratio}%`,transform:`scale(${ratio})`,transformOrigin:'top left'};
 const normalized=document.createElement('div').style;
 for(const [key,value]of Object.entries(values)){(normalized as any)[key]=value;if((input.style as any)[key]!== (normalized as any)[key])(input.style as any)[key]=value;}
 }
 };
 const observer=new MutationObserver(adjust);observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['style']});adjust();
 return ()=>{observer.disconnect();style.remove();};
}

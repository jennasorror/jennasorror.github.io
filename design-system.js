const typeText=document.querySelector('#type-text'),typeFamily=document.querySelector('#type-family'),typeSize=document.querySelector('#type-size'),typeLeading=document.querySelector('#type-leading'),typeSample=document.querySelector('[data-type-sample]');
function typography(){if(!typeSample)return;typeSample.textContent=typeText.value||'Clarity is an act of care.';typeSample.style.fontFamily=typeFamily.value==='display'?'var(--font-display)':'var(--font-body)';typeSample.style.fontWeight=typeFamily.value==='display'?'700':'400';typeSample.style.fontSize=typeSize.value+'px';typeSample.style.lineHeight=typeLeading.value;document.querySelector('[data-type-size]').textContent=typeSize.value+' px';document.querySelector('[data-type-leading]').textContent=typeLeading.value;document.querySelector('[data-type-code]').textContent=`font-family: var(--font-${typeFamily.value==='display'?'display':'body'});\nfont-weight: ${typeFamily.value==='display'?'700':'400'};\nfont-size: ${typeSize.value}px;\nline-height: ${typeLeading.value};`;}
[typeText,typeFamily,typeSize,typeLeading].forEach(e=>e?.addEventListener('input',typography));typography();
document.querySelector('[data-type-reset]')?.addEventListener('click',()=>{typeText.value='Clarity is an act of care.';typeFamily.value='display';typeSize.value='52';typeLeading.value='1.08';typography();});

// Measure diagram anchors after layout and font loading. Connectors stay exact as content reflows.
function drawConnections(){
 document.querySelectorAll('[data-connectors]').forEach(container=>{
  const svg=container.querySelector('.ds-live-lines'),base=container.getBoundingClientRect();if(!svg||!base.width)return;svg.setAttribute('viewBox',`0 0 ${base.width} ${base.height}`);svg.replaceChildren();
  const ns='http://www.w3.org/2000/svg',id='ds-arrow-'+container.dataset.connectors;const defs=document.createElementNS(ns,'defs');const marker=document.createElementNS(ns,'marker');for(const [key,value] of Object.entries({id,viewBox:'0 0 10 10',refX:'8',refY:'5',markerWidth:'7',markerHeight:'7',orient:'auto',markerUnits:'userSpaceOnUse'}))marker.setAttribute(key,value);const chevron=document.createElementNS(ns,'path');chevron.setAttribute('d','M2 1 L8 5 L2 9');chevron.setAttribute('fill','none');chevron.setAttribute('stroke','#565650');chevron.setAttribute('stroke-width','1.3');marker.append(chevron);defs.append(marker);svg.append(defs);
  const pairs=container.dataset.connectors==='anatomy'?[...container.querySelectorAll('[data-marker]')].map(source=>[source,container.querySelector(`[data-callout="${source.dataset.marker}"]`)]):container.dataset.connectors==='reuse'?[...container.querySelectorAll('[data-reuse-target]')].map(target=>[container.querySelector('[data-reuse-source]'),target]):[...container.querySelectorAll('[data-name-source]')].map(source=>[source,container.querySelector(`[data-name-target="${source.dataset.nameSource}"]`)]);
  pairs.forEach(([source,target])=>{if(!target)return;const a=source.getBoundingClientRect(),b=target.getBoundingClientRect();let x1=a.left+a.width/2-base.left,y1=a.top+a.height/2-base.top,x2,y2;const path=document.createElementNS('http://www.w3.org/2000/svg','path');
   if(container.dataset.connectors==='naming'||container.dataset.connectors==='reuse'){y1=a.bottom-base.top+6;x2=b.left+b.width/2-base.left;y2=b.top-base.top-6;const middle=(y1+y2)/2;path.setAttribute('d',`M${x1},${y1} C${x1},${middle} ${x2},${middle} ${x2},${y2}`);}
   else{const left=b.left<a.left;const startX=(left?b.right:b.left)-base.left,startY=b.top+b.height/2-base.top;const endX=x1+(left?-a.width/2-4:a.width/2+4),endY=y1;const direction=left?1:-1;const card=container.querySelector('.ds-anatomy-card').getBoundingClientRect();const lane=left?[2,3,4].indexOf(Number(source.dataset.marker)):[1,5,6].indexOf(Number(source.dataset.marker));const offset=14+Math.max(0,lane)*5;const elbow=left?Math.min(card.left-offset-base.left,endX-24):Math.max(card.right+offset-base.left,endX+24);const radius=Math.min(14,Math.abs(startY-endY)/2);const vertical=endY>startY?1:-1;path.setAttribute('d',Math.abs(startY-endY)<3?`M${startX},${startY} H${endX}`:`M${startX},${startY} H${elbow-direction*radius} Q${elbow},${startY} ${elbow},${startY+vertical*radius} V${endY-vertical*radius} Q${elbow},${endY} ${elbow+direction*radius},${endY} H${endX}`);}
   path.setAttribute('marker-end',`url(#${id})`);
   svg.append(path);
  });
 });
}
let diagramFrame;function queueConnections(){cancelAnimationFrame(diagramFrame);diagramFrame=requestAnimationFrame(drawConnections);}
const diagramObserver=new ResizeObserver(queueConnections);document.querySelectorAll('[data-connectors]').forEach(e=>diagramObserver.observe(e));document.fonts.ready.then(queueConnections);window.addEventListener('resize',queueConnections);window.addEventListener('load',queueConnections);queueConnections();

// Keep the palette tidy: one usage note open at a time.
document.querySelectorAll('.ds-swatch-usage').forEach(detail=>detail.addEventListener('toggle',()=>{if(detail.open)document.querySelectorAll('.ds-swatch-usage').forEach(other=>{if(other!==detail)other.open=false;});}));

// Compare implemented Iris roles in context.
(()=>{
const board=document.querySelector('.contrast-decisions');if(!board)return;
function luminance(hex){return hex.replace('#','').match(/../g).map(n=>parseInt(n,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);}
function render(context){
board.querySelectorAll('[data-contrast-shade]').forEach(card=>{
const hex=getComputedStyle(document.documentElement).getPropertyValue(card.dataset.contrastShade==='display'?'--color-iris':'--color-iris-strong').trim(),ratio=1.05/(luminance(hex)+.05),large=context==='large';
const sample=card.querySelector('[data-contrast-sample]');sample.dataset.context=context;sample.textContent=large?'Curiosity about people.':'Read the case study →';card.querySelector('[data-contrast-ratio]').textContent=ratio.toFixed(2)+':1';
for(const [standard,threshold] of [['aa',large?3:4.5],['aaa',large?4.5:7]]){const tag=card.querySelector('[data-contrast-'+standard+']'),pass=ratio>=threshold;tag.className=pass?'contrast-pass':'contrast-fail';tag.textContent=standard.toUpperCase()+' '+(pass?'Pass ✓':'Fail ×');}
});
board.querySelectorAll('[data-contrast-context]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.contrastContext===context)));
board.querySelector('[data-contrast-note]').textContent=context==='large'?'32px semibold on white · both shades meet AAA for large text.':'16px regular on white · action Iris meets AAA; display Iris meets AA.';
}
board.querySelectorAll('[data-contrast-context]').forEach(b=>b.addEventListener('click',()=>render(b.dataset.contrastContext)));render('small');
})();
// The token register reports the values the browser actually resolves.
function refreshTokenRegister(){const styles=getComputedStyle(document.documentElement);document.querySelectorAll('[data-token-value]').forEach(el=>{el.textContent=styles.getPropertyValue(el.dataset.tokenValue).trim();});}
refreshTokenRegister();window.addEventListener('resize',refreshTokenRegister);

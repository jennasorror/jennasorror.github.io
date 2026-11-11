const dialog = document.querySelector('dialog:not(.mobile-menu)');
let imageTrigger;
document.querySelectorAll('[data-expand]').forEach(button => {
  button.addEventListener('click', () => {
    imageTrigger = button;
    const image = button.querySelector('img');
    const full = dialog.querySelector('img');
    full.src = image.currentSrc || image.src;
    full.alt = image.alt;
    dialog.querySelector('.viewer-caption').textContent = button.closest('figure')?.querySelector('figcaption')?.textContent || image.alt || '';
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  });
});
dialog.querySelector('.close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  document.body.style.overflow = '';
  imageTrigger?.focus();
});
dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
});
const doodle = document.querySelector('.doodle-story');
if (doodle) {
  const toggle = doodle.querySelector('.doodle-toggle');
  toggle.addEventListener('click', () => {
    const paused = doodle.classList.toggle('is-paused');
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', paused ? 'Play doodle animation' : 'Pause doodle animation');
  });
}

// Muted, inline playback when a scenario enters view. Manual pause wins on re-entry.
document.querySelectorAll('video[data-scroll-play]').forEach(video=>{
 let manuallyPaused=false,autoPause=false;
 video.controls=false;
 const enforcePlayback=()=>{video.muted=true;video.defaultMuted=true;if(video.playbackRate!==1.5)video.playbackRate=1.5;};
 video.defaultPlaybackRate=1.5;enforcePlayback();
 video.addEventListener('loadedmetadata',enforcePlayback);video.addEventListener('volumechange',()=>{if(!video.muted)video.muted=true;});video.addEventListener('ratechange',()=>{if(video.playbackRate!==1.5)video.playbackRate=1.5;});
 const control=document.createElement('button');control.type='button';control.className='scenario-play-toggle';control.textContent='Play walkthrough';control.setAttribute('aria-label','Play silent walkthrough');video.insertAdjacentElement('afterend',control);
 function updateControl(){control.textContent=video.paused?'Play walkthrough':'Pause walkthrough';control.setAttribute('aria-label',video.paused?'Play silent walkthrough':'Pause silent walkthrough');}
 control.addEventListener('click',()=>{if(video.paused){manuallyPaused=false;video.play().catch(()=>{control.textContent='Play walkthrough';});}else{manuallyPaused=true;video.pause();}});
 video.addEventListener('play',updateControl);video.addEventListener('pause',updateControl);

 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 video.addEventListener('pause',()=>{if(autoPause){autoPause=false;}else{manuallyPaused=true;}});
 video.addEventListener('play',()=>{manuallyPaused=false;});
 const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{
  if(entry.isIntersecting){if(!reduced.matches&&!manuallyPaused){video.play().catch(()=>{});}}
  else if(!video.paused){autoPause=true;video.pause();}
 });},{threshold:.55});observer.observe(video);
});
// No autoplay: visitors can swipe, use arrows, or jump directly to a screen collection.
document.querySelectorAll('.screen-gallery').forEach(gallery=>{
 const track=gallery.querySelector('.gallery-track'),slides=[...gallery.querySelectorAll('.gallery-slide')],jumps=[...gallery.querySelectorAll('[data-gallery-index]')],status=gallery.querySelector('.gallery-status');
 let current=0;
 function selected(i){current=i;jumps.forEach((b,n)=>b.setAttribute('aria-pressed',String(n===i)));status.textContent=gallery.hasAttribute('data-compact-gallery')?`${i+1} of ${slides.length}`:`${i+1} of ${slides.length} · ${slides[i].querySelector('.gallery-slide-label').textContent}`;}
 function go(i){i=Math.max(0,Math.min(slides.length-1,i));track.scrollTo({left:slides[i].offsetLeft-slides[0].offsetLeft,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});selected(i);}
 gallery.querySelector('[data-gallery-prev]').addEventListener('click',()=>go(current-1));gallery.querySelector('[data-gallery-next]').addEventListener('click',()=>go(current+1));jumps.forEach((b,i)=>b.addEventListener('click',()=>go(i)));
 let ticking=false;track.addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(()=>{const left=track.scrollLeft;let nearest=0;slides.forEach((slide,i)=>{if(Math.abs(slide.offsetLeft-slides[0].offsetLeft-left)<Math.abs(slides[nearest].offsetLeft-slides[0].offsetLeft-left))nearest=i;});selected(nearest);ticking=false;});ticking=true;}},{passive:true});
 track.addEventListener('keydown',event=>{if(event.target===track&&(event.key==='ArrowRight'||event.key==='ArrowLeft')){event.preventDefault();go(current+(event.key==='ArrowRight'?1:-1));}});
});

// Reusable disabled semantics for non-native controls.
document.addEventListener('click',event=>{if(event.target.closest('[aria-disabled="true"]')){event.preventDefault();event.stopImmediatePropagation();}},true);
document.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.closest('[aria-disabled="true"]')){event.preventDefault();event.stopImmediatePropagation();}},true);

// Evidence viewers expose the real project artifacts, with keyboard-operable tabs.
document.querySelectorAll('[data-evidence-viewer]').forEach(viewer=>{const tabs=[...viewer.querySelectorAll('[role=tab]')],panels=[...viewer.querySelectorAll('[role=tabpanel]')];function select(index,focus=false){tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;panels[i].hidden=i!==index;});if(focus)tabs[index].focus();}tabs.forEach((tab,index)=>{tab.addEventListener('click',()=>select(index));tab.addEventListener('keydown',event=>{let next=index;if(event.key==='ArrowRight')next=(index+1)%tabs.length;else if(event.key==='ArrowLeft')next=(index-1+tabs.length)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;event.preventDefault();select(next,true);});});});

// Keep the reading index in sync with the section crossing the reading line.
(()=>{
 document.querySelectorAll('.case-reading-layout').forEach(layout=>{
  const nav=layout.querySelector('.case-nav');
  const links=[...nav.querySelectorAll('a[href^="#"]')];
  const entries=links.map(link=>({link,section:document.getElementById(link.hash.slice(1))})).filter(e=>e.section);
  if(!entries.length)return;
  let queued=false;
  const update=()=>{queued=false;let current=entries[0];for(const item of entries){if(item.section.getBoundingClientRect().top<=160)current=item;}
   entries.forEach(item=>{if(item===current)item.link.setAttribute('aria-current','location');else item.link.removeAttribute('aria-current');});};
  addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(update);}},{passive:true});update();
 });
})();
// The global navigation reflects the current page or project collection.
(()=>{const path=location.pathname.replace(/\/$/,'')||'/';document.querySelectorAll('header a:not(.brand)').forEach(link=>{const target=new URL(link.href,location.href).pathname.replace(/\/$/,'')||'/';link.removeAttribute('aria-current');if(target===path)link.setAttribute('aria-current','page');else if(target==='/'&&path.startsWith('/case-studies/'))link.setAttribute('aria-current','true');});})();

// Anchored 3D stipple sphere. Pointer movement tilts the surface and sends a soft ripple through it.
// No autoplay loop: the sculpture rests once its spring and ripple have settled.
(()=>{
 const canvas=document.querySelector('.pixel-star');if(!canvas)return;
 const ctx=canvas.getContext('2d'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
 let visible=true,inside=false,raf=0,last=0,clock=0,seed=2701;
 const state={rx:.18,ry:-.28,hover:0,px:0,py:0},target={rx:.18,ry:-.28,hover:0,px:0,py:0};
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const count=3600,golden=Math.PI*(3-Math.sqrt(5));
 const points=Array.from({length:count},(_,i)=>{const y=1-2*(i+.5)/count,r=Math.sqrt(1-y*y),a=i*golden+(random()-.5)*.09;return {x:Math.cos(a)*r,y,z:Math.sin(a)*r,size:.72+random()*.65,tone:i%3,phase:random()*Math.PI*2};});
 let ripples=[];
 function resting(){return Math.abs(state.rx-target.rx)+Math.abs(state.ry-target.ry)+Math.abs(state.hover-target.hover)+Math.abs(state.px-target.px)+Math.abs(state.py-target.py)<.0005&&ripples.length===0;}
 function draw(){
  ctx.clearRect(0,0,384,384);
  const colors=['70,66,160','105,101,219','139,136,231'];
  const cx=Math.cos(state.rx),sx=Math.sin(state.rx),cy=Math.cos(state.ry),sy=Math.sin(state.ry);
  const brush={x:state.px*.7,y:state.py*.7};brush.z=Math.sqrt(Math.max(.04,1-brush.x*brush.x-brush.y*brush.y));
  const ordered=points.map(p=>{let x=p.x*cy+p.z*sy,z=-p.x*sy+p.z*cy,y=p.y*cx-z*sx;z=p.y*sx+z*cx;
   const alignment=x*brush.x+y*brush.y+z*brush.z;
   const dimple=Math.pow(Math.max(0,alignment),12)*state.hover;
   let wave=0;for(const r of ripples){const angle=Math.acos(Math.max(-1,Math.min(1,x*r.x+y*r.y+z*r.z)));const distance=angle-r.age*2.3;wave+=Math.exp(-distance*distance*18)*Math.sin(r.age*10)*Math.exp(-r.age*2)*11;}
   const amount=Math.min(1,Math.hypot(state.px,state.py))*state.hover;
   const heading=Math.atan2(state.py,state.px),angle=Math.atan2(y,x),difference=angle-heading;
   const lobe=Math.pow(Math.max(0,Math.cos(difference)),4);
   const organic=state.hover*(7*Math.sin(angle*3+state.ry*3)+5*Math.cos(angle*2-state.rx*4));
   const radius=104+organic+24*amount*lobe-18*dimple+wave;
   const along=x*Math.cos(heading)+y*Math.sin(heading),across=-x*Math.sin(heading)+y*Math.cos(heading);
   const stretched=along*(1+.31*amount),narrowed=across*(1-.16*amount);
   x=stretched*Math.cos(heading)-narrowed*Math.sin(heading);
   y=stretched*Math.sin(heading)+narrowed*Math.cos(heading);
   const depth=radius*z,perspective=460/(460-depth);
   return {p,x:192+x*radius*perspective,y:188+y*radius*perspective,z,scale:perspective,light:.22+.78*Math.max(0,-.35*x-.45*y+.82*z)};
  }).sort((a,b)=>a.z-b.z);
  for(const v of ordered){const alpha=v.z<0?.065+.07*(v.z+1):.3+.5*v.light;const size=v.p.size*v.scale*(v.z<0?.8:1.08);ctx.fillStyle=`rgba(${colors[v.p.tone]},${alpha})`;ctx.fillRect(v.x,v.y,size,size);}
 }
 function tick(now){raf=0;if(reduce.matches||!visible||document.hidden){last=0;draw();return;}const dt=last?Math.min((now-last)/1000,.045):.016;last=now;clock+=dt;const ease=1-Math.exp(-dt*7);
  for(const key of Object.keys(state))state[key]+=(target[key]-state[key])*ease;
  ripples.forEach(r=>r.age+=dt);ripples=ripples.filter(r=>r.age<1.6);draw();
  if(!resting())raf=requestAnimationFrame(tick);else last=0;
 }
 function wake(){if(!reduce.matches&&visible&&!document.hidden&&!raf){last=0;raf=requestAnimationFrame(tick);}else if(reduce.matches)draw();}
 function point(event){if(reduce.matches)return;const r=canvas.getBoundingClientRect();const x=Math.max(-1,Math.min(1,((event.clientX-r.left)/r.width-.5)*2)),y=Math.max(-1,Math.min(1,((event.clientY-r.top)/r.height-.5)*2));inside=true;target.rx=.18+y*.62;target.ry=-.28+x*.8;target.hover=1;target.px=x;target.py=y;wake();}
 function ripple(event){if(reduce.matches)return;point(event);const x=target.px*.7,y=target.py*.7;ripples.push({x,y,z:Math.sqrt(Math.max(.04,1-x*x-y*y)),age:0});ripples=ripples.slice(-3);wake();}
 canvas.addEventListener('pointermove',point);canvas.addEventListener('pointerenter',ripple);canvas.addEventListener('pointerdown',ripple);
 canvas.addEventListener('pointerleave',()=>{inside=false;Object.assign(target,{rx:.18,ry:-.28,hover:0,px:0,py:0});wake();});
 new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(visible)wake();else if(raf){cancelAnimationFrame(raf);raf=0;last=0;}}).observe(canvas);
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&raf){cancelAnimationFrame(raf);raf=0;}else wake();});
 reduce.addEventListener('change',()=>{if(reduce.matches){if(raf)cancelAnimationFrame(raf);raf=0;ripples=[];Object.assign(state,{rx:.18,ry:-.28,hover:0,px:0,py:0});Object.assign(target,state);draw();}else wake();});
 draw();
})();

// A native modal provides focus containment and Escape behavior for the mobile sidebar.
(()=>{
 const menu=document.querySelector('.mobile-menu'),toggle=document.querySelector('.mobile-menu-toggle');if(!menu||!toggle)return;
 const breakpoint=matchMedia('(max-width:900px)');let previousOverflow='';
 const close=()=>{if(menu.open)menu.close();};
 toggle.addEventListener('click',()=>{previousOverflow=document.body.style.overflow;menu.showModal();document.body.style.overflow='hidden';toggle.setAttribute('aria-expanded','true');});
 menu.querySelector('.menu-close').addEventListener('click',close);
 menu.addEventListener('keydown',event=>{if(event.key!=='Tab')return;const items=[...menu.querySelectorAll('a[href],button:not([disabled])')].filter(el=>el.getClientRects().length);const first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}});

 menu.addEventListener('close',()=>{document.body.style.overflow=previousOverflow;toggle.setAttribute('aria-expanded','false');if(breakpoint.matches)toggle.focus();});
 menu.addEventListener('click',event=>{const bounds=menu.getBoundingClientRect();if(event.target===menu&&(event.clientX<bounds.left||event.clientX>bounds.right))close();});
 menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',close));
 breakpoint.addEventListener('change',event=>{if(!event.matches)close();});
 const path=location.pathname;menu.querySelectorAll('[data-menu-page]').forEach(link=>{const selected=link.dataset.menuPage==='work'?(path==='/'||path.startsWith('/case-studies/')):path.startsWith(link.dataset.menuPage==='about'?'/about/':'/design-system/');if(selected)link.setAttribute('aria-current','page');});
})();

// A single, irregular typing pass; assistive technology always gets the full heading.
(() => {
  const greeting = document.querySelector('.typed-greeting');
  if (!greeting) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches) return;
  const text = greeting.textContent;
  const letters = Array.from(text);
  let index = 0;
  let timer;
  const finish = () => {
    clearTimeout(timer);
    greeting.textContent = text;
    greeting.classList.remove('is-typing', 'is-finished');
  };
  motion.addEventListener('change', event => { if (event.matches) finish(); });
  greeting.textContent = '';
  greeting.classList.add('is-typing');
  const type = () => {
    greeting.textContent = letters.slice(0, ++index).join('');
    if (index === letters.length) {
      greeting.classList.remove('is-typing');
      greeting.classList.add('is-finished');
      return;
    }
    const previous = letters[index - 1];
    // Deliberate word pauses are noticeable on every visit, with light jitter
    // around a mix of quick keystrokes and slower individual letters.
    const wordPauses = [430, 650, 45];
    const wordIndex = letters.slice(0, index).filter(letter => letter === ' ').length - 1;
    const keystrokes = [40, 145, 60, 180, 45];
    const baseDelay = previous === ' ' ? (wordPauses[wordIndex] || 430)
      : keystrokes[(index - 1) % keystrokes.length];
    const delay = baseDelay + Math.round(Math.random() * 30);
    timer = setTimeout(type, delay);
  };
  timer = setTimeout(type, 180);
})();

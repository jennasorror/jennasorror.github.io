const dialog = document.querySelector('dialog');
let imageTrigger;
document.querySelectorAll('[data-expand]').forEach(button => {
  button.addEventListener('click', () => {
    imageTrigger = button;
    const image = button.querySelector('img');
    const full = dialog.querySelector('img');
    full.src = image.currentSrc || image.src;
    full.alt = image.alt;
    dialog.querySelector('.viewer-caption').textContent = button.closest('figure').querySelector('figcaption').textContent;
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
 function selected(i){current=i;jumps.forEach((b,n)=>b.setAttribute('aria-pressed',String(n===i)));status.textContent=`${i+1} of ${slides.length} · ${slides[i].querySelector('.gallery-slide-label').textContent}`;}
 function go(i){i=Math.max(0,Math.min(slides.length-1,i));track.scrollTo({left:slides[i].offsetLeft-slides[0].offsetLeft,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});selected(i);}
 gallery.querySelector('[data-gallery-prev]').addEventListener('click',()=>go(current-1));gallery.querySelector('[data-gallery-next]').addEventListener('click',()=>go(current+1));jumps.forEach((b,i)=>b.addEventListener('click',()=>go(i)));
 let ticking=false;track.addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(()=>{const left=track.scrollLeft;let nearest=0;slides.forEach((slide,i)=>{if(Math.abs(slide.offsetLeft-slides[0].offsetLeft-left)<Math.abs(slides[nearest].offsetLeft-slides[0].offsetLeft-left))nearest=i;});selected(nearest);ticking=false;});ticking=true;}},{passive:true});
 track.addEventListener('keydown',event=>{if(event.target===track&&(event.key==='ArrowRight'||event.key==='ArrowLeft')){event.preventDefault();go(current+(event.key==='ArrowRight'?1:-1));}});
});

const readingTheme=document.querySelector('select[data-reading-theme]');
if(readingTheme){let saved='portfolio';try{saved=localStorage.getItem('portfolio-reading-theme')||saved;}catch{}if(!['portfolio','light','dark'].includes(saved))saved='portfolio';readingTheme.value=saved;document.documentElement.dataset.readingTheme=saved;readingTheme.addEventListener('change',()=>{document.documentElement.dataset.readingTheme=readingTheme.value;try{localStorage.setItem('portfolio-reading-theme',readingTheme.value);}catch{}});}

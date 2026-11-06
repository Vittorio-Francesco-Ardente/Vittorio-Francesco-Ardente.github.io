/* A restrained tilt hinged to the ribbon's screen-edge attachment. */
(()=>{
 const scene=document.querySelector('.vfa-concept-scene');
 if(!scene)return;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const fine=matchMedia('(hover:hover) and (pointer:fine)');
 const atmosphere=scene.querySelector('.vfa-contact-atmosphere');
 let visible=true;
 const pause=()=>atmosphere?.classList.toggle('is-paused',!visible||document.hidden);
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;pause()}).observe(scene);
 document.addEventListener('visibilitychange',pause);
 const reset=()=>{scene.style.setProperty('--badge-x','0deg');scene.style.setProperty('--badge-y','0deg')};
 scene.addEventListener('pointermove',e=>{
  if(reduce.matches||!fine.matches||e.pointerType==='touch')return;
  const r=scene.getBoundingClientRect();
  scene.style.setProperty('--badge-x',((.5-(e.clientY-r.top)/r.height)*3).toFixed(2)+'deg');
  scene.style.setProperty('--badge-y',(((e.clientX-r.left)/r.width-.5)*3).toFixed(2)+'deg');
 },{passive:true});
 scene.addEventListener('pointerleave',reset);
 scene.addEventListener('focusout',reset);
 reduce.addEventListener('change',reset);
})();

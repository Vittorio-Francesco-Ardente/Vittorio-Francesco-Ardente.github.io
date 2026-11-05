/* Route-map menu: responsive SVG path, active stop and motion trails.
   Original implementation inspired by the motion principles discussed in Faramove.
   No copied animation assets or external dependencies. */
(()=>{
 const menu=document.getElementById('menu');if(!menu||menu.querySelector('.vfa-route-map'))return;
 const ol=menu.querySelector('.m-corpo ol');if(!ol)return;
 const links=[...ol.querySelectorAll('li a')];if(links.length<2)return;
 const ns='http://www.w3.org/2000/svg';
 const svg=document.createElementNS(ns,'svg');svg.classList.add('vfa-route-map');
 svg.setAttribute('aria-hidden','true');svg.setAttribute('preserveAspectRatio','none');
 const track=document.createElementNS(ns,'path');track.classList.add('vfa-route-track');
 const trail=document.createElementNS(ns,'path');trail.classList.add('vfa-route-trail');
 const progress=document.createElementNS(ns,'path');progress.classList.add('vfa-route-progress');
 const moving=document.createElementNS(ns,'circle');moving.classList.add('vfa-route-moving');moving.setAttribute('r','5');
 svg.append(track,trail,progress,moving);ol.prepend(svg);
 const normalize=p=>{let x=p||'/';try{x=new URL(x,location.origin).pathname}catch{}return x.replace(/\/$/,'')||'/'};
 const current=normalize(location.pathname);
 let active=links.findIndex(a=>normalize(a.getAttribute('href'))===current);
 if(active<0)active=links.findIndex(a=>a.getAttribute('aria-current')==='page');
 if(active<0)active=0;
 links.forEach((a,i)=>{
  a.classList.toggle('vfa-route-current',i===active);
  if(i===active)a.setAttribute('aria-current','page');
  else a.removeAttribute('aria-current');
  const pin=document.createElement('span');pin.className='vfa-route-pin';pin.setAttribute('aria-hidden','true');a.prepend(pin);
 });
 let length=1,points=[],target=active,position=active,frame=0,previous=0,observing=false;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 function rebuild(){
  const bounds=ol.getBoundingClientRect();if(bounds.width<10||bounds.height<10)return;
  const w=bounds.width,h=bounds.height;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
  points=links.map((a,i)=>{
   const r=a.getBoundingClientRect();
   const pin=a.querySelector('.vfa-route-pin').getBoundingClientRect();
   return {x:Math.max(12,Math.min(w-12,pin.left+pin.width/2-bounds.left)),y:r.top+r.height/2-bounds.top};
  });
  let d=`M ${points[0].x} ${points[0].y}`;
  for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i],dy=b.y-a.y;
   d+=` C ${a.x} ${a.y+dy*.55}, ${b.x} ${b.y-dy*.55}, ${b.x} ${b.y}`;
  }
  for(const path of [track,trail,progress])path.setAttribute('d',d);
  length=Math.max(1,track.getTotalLength());
  const step=length/(points.length-1);
  const loc=Math.max(0,Math.min(length,position*step));
  progress.style.strokeDasharray=`${loc} ${length+1}`;
  const p=track.getPointAtLength(loc);moving.setAttribute('cx',p.x);moving.setAttribute('cy',p.y);
 }
 function animate(now){
  frame=0;if(!menu.classList.contains('aperto'))return;
  const dt=previous?Math.min((now-previous)/1000,.05):.016;previous=now;
  position+=(target-position)*Math.min(1,dt*8.5);
  const step=length/(points.length-1),loc=Math.max(0,Math.min(length,position*step));
  progress.style.strokeDasharray=`${loc} ${length+1}`;
  const pt=track.getPointAtLength(loc);moving.setAttribute('cx',pt.x);moving.setAttribute('cy',pt.y);
  if(Math.abs(target-position)>.003)frame=requestAnimationFrame(animate);
 }
 function go(i){
  target=i;links.forEach((a,n)=>a.classList.toggle('vfa-route-focused',n===i));
  if(reduce.matches){position=i;rebuild();return}
  if(!frame){previous=0;frame=requestAnimationFrame(animate)}
 }
 links.forEach((a,i)=>{
  a.addEventListener('pointerenter',()=>go(i));
  a.addEventListener('focus',()=>go(i));
 });
 ol.addEventListener('pointerleave',()=>go(active));
 ol.addEventListener('focusout',e=>{if(!ol.contains(e.relatedTarget))go(active)});
 let timer=0;const schedule=()=>{clearTimeout(timer);timer=setTimeout(()=>{rebuild();go(active)},40)};
 const resizeObserver=new ResizeObserver(schedule);resizeObserver.observe(ol);
 const menuObserver=new MutationObserver(()=>{if(menu.classList.contains('aperto')){requestAnimationFrame(()=>{rebuild();go(active)})}else{cancelAnimationFrame(frame);frame=0;position=active;target=active}});
 menuObserver.observe(menu,{attributes:true,attributeFilter:['class']});
 addEventListener('resize',schedule,{passive:true});
 if(document.fonts&&document.fonts.ready)document.fonts.ready.then(schedule);
 schedule();
})();

/* VFA contact: site-native equivalent of the supplied Framer Motion expand-map.
   Spring tilt on hover + click/keyboard expansion; authentic ISTAT 2026 Dalmine outline. */
(()=>{
  const cards=document.querySelectorAll('body[data-pagina="contatti"] button.vfa-expand-map');
  const prefersReduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  const canHover=window.matchMedia('(hover: hover) and (pointer: fine)');
  for(const card of cards){
    const detail=card.querySelector('.vfa-map-geography');
    if(!detail)continue;
    let expanded=false,raf=0,rx=0,ry=0,vx=0,vy=0,targetX=0,targetY=0,last=0;
    const setTilt=()=>{
      card.style.setProperty('--vfa-map-rx',rx.toFixed(3)+'deg');
      card.style.setProperty('--vfa-map-ry',ry.toFixed(3)+'deg');
    };
    function spring(time){
      const dt=Math.min(.03,Math.max(.008,last?(time-last)/1000:1/60));last=time;
      const stiffness=300,damping=30;
      vx+=(targetX-rx)*stiffness*dt;
      vy+=(targetY-ry)*stiffness*dt;
      const drag=Math.exp(-damping*dt);
      vx*=drag;vy*=drag;
      rx+=vx*dt;ry+=vy*dt;
      setTilt();
      if(Math.abs(targetX-rx)+Math.abs(targetY-ry)+Math.abs(vx)+Math.abs(vy)>.04){
        raf=requestAnimationFrame(spring);
      }else{
        rx=targetX;ry=targetY;vx=vy=0;setTilt();raf=0;last=0;
      }
    }
    function setTarget(x,y){
      if(prefersReduce.matches||!canHover.matches){rx=ry=targetX=targetY=0;setTilt();return}
      targetX=x;targetY=y;
      if(!raf){last=0;raf=requestAnimationFrame(spring)}
    }
    card.addEventListener('pointermove',event=>{
      if(!canHover.matches||event.pointerType==='touch'||prefersReduce.matches)return;
      const rect=card.getBoundingClientRect();
      const mx=Math.max(-50,Math.min(50,event.clientX-(rect.left+rect.width/2)));
      const my=Math.max(-50,Math.min(50,event.clientY-(rect.top+rect.height/2)));
      setTarget(-my*8/50,mx*8/50);
    },{passive:true});
    card.addEventListener('pointerleave',()=>setTarget(0,0),{passive:true});
    card.addEventListener('blur',()=>setTarget(0,0));
    const sync=()=>{
      card.setAttribute('aria-expanded',String(expanded));
      card.setAttribute('aria-label',card.dataset[expanded?'closeLabel':'openLabel']||'Dalmine');
      detail.setAttribute('aria-hidden',String(!expanded));
    };
    card.addEventListener('click',()=>{expanded=!expanded;sync();setTarget(0,0)});
    card.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&expanded){
        expanded=false;sync();setTarget(0,0);
        event.stopPropagation();event.preventDefault();
      }
    });
    sync();
  }
})();

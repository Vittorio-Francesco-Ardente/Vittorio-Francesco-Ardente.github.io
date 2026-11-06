/* VFA Contacts: accessible visiting-card reveal with a real street-level
 * OpenStreetMap map. Roads are rendered only on user interaction. The route
 * is requested from OSRM and animated from its actual routing geometry.
 * Municipal border: ISTAT (016091), 2026, CC BY 4.0.
 * Tiles: © OpenStreetMap contributors, ODbL. */
(() => {
  const cards=document.querySelectorAll('body[data-pagina="contatti"] button.vfa-business-card');
  if(!cards.length)return;

  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  const hover=window.matchMedia('(hover:hover) and (pointer:fine)');
  const CENTER={lon:9.603,lat:45.648},ZOOM=14,TILE=256;
  const project=(lon,lat)=>{
    const n=Math.pow(2,ZOOM)*TILE;
    const rad=Math.max(-85,Math.min(85,lat))*Math.PI/180;
    return {
      x:(lon+180)/360*n,
      y:(1-Math.asinh(Math.tan(rad))/Math.PI)/2*n
    };
  };
  const centerPx=project(CENTER.lon,CENTER.lat);

  for(const card of cards){
    const detail=card.querySelector('.vfa-map-geography');
    const map=card.querySelector('.vfa-map-live');
    const tiles=card.querySelector('.vfa-map-tiles');
    const overlay=card.querySelector('.vfa-map-overlay');
    const pin=card.querySelector('.vfa-map-pin');
    const boundaryHalo=card.querySelector('.vfa-map-outline-halo');
    const boundaryLine=card.querySelector('.vfa-map-outline');
    const routeHalo=card.querySelector('.vfa-map-route-halo');
    const routeLine=card.querySelector('.vfa-map-route');
    if(!detail||!map||!tiles||!overlay||!pin||!boundaryLine||!routeLine)continue;

    let expanded=false,loaded=false,rendered=false,boundary=null,route=null;
    let scheduled=0,tiltRaf=0,rx=0,ry=0,vx=0,vy=0,targetX=0,targetY=0,last=0;
    let aborted=false,liveTiles=0;
    const fmt=x=>Number(x).toFixed(2);
    const syncTilt=()=>{
      card.style.setProperty('--vfa-map-rx',fmt(rx)+'deg');
      card.style.setProperty('--vfa-map-ry',fmt(ry)+'deg');
    };
    function tiltSpring(time){
      const dt=Math.min(.03,Math.max(.008,last?(time-last)/1000:1/60));
      last=time;
      vx+=(targetX-rx)*270*dt;
      vy+=(targetY-ry)*270*dt;
      const drag=Math.exp(-29*dt);
      vx*=drag;vy*=drag;
      rx+=vx*dt;ry+=vy*dt;
      syncTilt();
      if(Math.abs(rx-targetX)+Math.abs(ry-targetY)+Math.abs(vx)+Math.abs(vy)>.04){
        tiltRaf=requestAnimationFrame(tiltSpring);
      }else{
        rx=targetX;ry=targetY;vx=vy=0;syncTilt();
        tiltRaf=0;last=0;
      }
    }
    function setTilt(x,y){
      if(reduce.matches||!hover.matches||expanded){x=0;y=0}
      targetX=x;targetY=y;
      if(!tiltRaf){last=0;tiltRaf=requestAnimationFrame(tiltSpring)}
    }
    card.addEventListener('pointermove',e=>{
      if(expanded||!hover.matches||reduce.matches||e.pointerType==='touch')return;
      const r=card.getBoundingClientRect();
      const x=Math.max(-50,Math.min(50,e.clientX-r.left-r.width/2));
      const y=Math.max(-50,Math.min(50,e.clientY-r.top-r.height/2));
      setTilt(-y*.12,x*.12);
    },{passive:true});
    card.addEventListener('pointerleave',()=>setTilt(0,0),{passive:true});
    card.addEventListener('blur',()=>setTilt(0,0));

    const localXY=(lon,lat,w,h)=>{
      const p=project(lon,lat);
      return [p.x-centerPx.x+w/2,p.y-centerPx.y+h/2];
    };
    const polyPath=(coords,w,h)=>{
      if(!Array.isArray(coords)||!coords.length)return '';
      return coords.map((c,i)=>{
        const p=localXY(c[0],c[1],w,h);
        return (i?'L':'M')+fmt(p[0])+' '+fmt(p[1]);
      }).join(' ');
    };
    function drawLines(){
      if(!expanded)return;
      const w=map.clientWidth,h=map.clientHeight;
      if(w<30||h<30)return;
      overlay.setAttribute('viewBox','0 0 '+w+' '+h);
      if(boundary){
        const d=polyPath(boundary,w,h)+' Z';
        boundaryHalo.setAttribute('d',d);
        boundaryLine.setAttribute('d',d);
      }
      if(route){
        const d=polyPath(route,w,h);
        routeHalo.setAttribute('d',d);
        routeLine.setAttribute('d',d);
      }
      const p=localXY(CENTER.lon,CENTER.lat,w,h);
      pin.style.left=p[0]+'px';pin.style.top=p[1]+'px';
    }
    function animateRoute(){
      if(!expanded||!route||reduce.matches)return;
      const length=routeLine.getTotalLength();
      if(!Number.isFinite(length)||length===0)return;
      for(const p of [routeLine,routeHalo]){
        p.style.transition='none';
        p.style.strokeDasharray=length;
        p.style.strokeDashoffset=length;
      }
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        if(!expanded)return;
        for(const p of [routeLine,routeHalo]){
          p.style.transition='stroke-dashoffset 2.8s cubic-bezier(.15,.5,.22,1)';
          p.style.strokeDashoffset='0';
        }
      }));
    }

    function createTiles(){
      if(!expanded)return;
      const w=map.clientWidth,h=map.clientHeight;
      if(w<30||h<30)return;
      const x0=Math.floor((centerPx.x-w/2)/TILE)-1;
      const x1=Math.ceil((centerPx.x+w/2)/TILE);
      const y0=Math.floor((centerPx.y-h/2)/TILE)-1;
      const y1=Math.ceil((centerPx.y+h/2)/TILE);
      const n=Math.pow(2,ZOOM);
      let loadedCount=0,successCount=0;
      const pieces=document.createDocumentFragment();
      const expected=(x1-x0+1)*(y1-y0+1);
      liveTiles++;
      const serial=liveTiles;
      map.classList.remove('vfa-map-ready');
      function count(ok){
        if(serial!==liveTiles||!expanded)return;
        loadedCount++;
        if(ok)successCount++;
        if(successCount>=3||loadedCount===expected){
          map.classList.add('vfa-map-ready');
        }
      }
      for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){
        if(ty<0||ty>=n)continue;
        const image=document.createElement('img');
        image.alt='';
        image.decoding='async';
        image.width=TILE;image.height=TILE;
        image.style.left=(tx*TILE-centerPx.x+w/2)+'px';
        image.style.top=(ty*TILE-centerPx.y+h/2)+'px';
        image.addEventListener('load',()=>count(true),{once:true});
        image.addEventListener('error',()=>count(false),{once:true});
        image.src='https://tile.openstreetmap.org/'+ZOOM+'/'+((tx+n)%n)+'/'+ty+'.png';
        pieces.appendChild(image);
      }
      tiles.replaceChildren(pieces);
      rendered=true;
      drawLines();
    }
    function loadBoundary(){
      if(boundary||aborted)return;
      fetch('/_assets/vfa-dalmine-boundary-2026.geojson')
       .then(r=>{if(!r.ok)throw Error('ISTAT boundary unavailable');return r.json()})
       .then(data=>{
         const coords=data?.features?.[0]?.geometry?.coordinates?.[0];
         if(!Array.isArray(coords)||coords.length<20)return;
         boundary=coords;
         if(expanded)drawLines();
       }).catch(()=>{/* Live OSM roads remain available. */});
    }
    function loadStreetRoute(){
      if(route||aborted)return;
      // The public OSRM service returns real street geometry; no guessed roads.
      const url='https://router.project-osrm.org/route/v1/driving/9.585,45.648;9.620,45.650?overview=full&geometries=geojson&steps=false';
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),7500);
      fetch(url,{signal:controller.signal})
       .then(r=>{if(!r.ok)throw Error('OSRM unavailable');return r.json()})
       .then(data=>{
         const coords=data?.routes?.[0]?.geometry?.coordinates;
         if(!Array.isArray(coords)||coords.length<3)return;
         route=coords;
         if(expanded){drawLines();animateRoute()}
       }).catch(()=>{/* Do not draw an invented route if routing fails. */})
       .finally(()=>clearTimeout(timeout));
    }
    function openMap(){
      if(!expanded)return;
      if(!loaded){
        loaded=true;
        loadBoundary();loadStreetRoute();
      }
      cancelAnimationFrame(scheduled);
      scheduled=requestAnimationFrame(()=>{
        if(!expanded)return;
        createTiles();
      });
      // Draw after the spring-size transition settles; no tile prefetching.
      setTimeout(()=>{
        if(!expanded)return;
        createTiles();
        if(route)animateRoute();
      },reduce.matches?60:690);
    }
    const sync=()=>{
      card.setAttribute('aria-expanded',String(expanded));
      card.setAttribute('aria-label',card.dataset[expanded?'closeLabel':'openLabel']||'Dalmine');
      detail.setAttribute('aria-hidden',String(!expanded));
      setTilt(0,0);
      if(expanded)openMap();
    };
    card.addEventListener('click',()=>{expanded=!expanded;sync()});
    card.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&expanded){
        expanded=false;sync();event.preventDefault();event.stopPropagation();
      }
    });
    card.addEventListener('transitionend',e=>{
      if(expanded&&e.target===card&&['width','height'].includes(e.propertyName)){
        createTiles();if(route){drawLines();animateRoute()}
      }
    });
    sync();
  }
})();
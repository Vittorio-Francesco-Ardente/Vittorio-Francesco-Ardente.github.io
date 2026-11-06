import{_ as e,a as t,c as n,d as r,f as i,g as a,h as o,i as s,l as c,m as l,n as u,o as d,p as f,r as p,s as m,t as Box3D,u as PhysicalMat,v as _}from"./three.Be4PqeB_.js";var v=matchMedia(`(prefers-reduced-motion: reduce)`).matches||location.search.includes(`fermo`),y=e=>getComputedStyle(document.documentElement).getPropertyValue(e).trim(),b={x:0,y:0};addEventListener(`pointermove`,e=>{b.x=e.clientX/innerWidth*2-1,b.y=e.clientY/innerHeight*2-1});function x(e,{exposure:t=1,env:n=.4,fov:r=30}={}){let c=new s({canvas:e,antialias:!0,alpha:!0,powerPreference:`high-performance`});c.setPixelRatio(Math.min(devicePixelRatio,1.75)),c.toneMapping=4,c.toneMappingExposure=t,c.outputColorSpace=o;let l=new a;l.environment=new p(c).fromScene(new u,.04).texture,l.environmentIntensity=n;let d=new i(r,1,.01,100),f=!1,m=()=>{let t=e.clientWidth,n=e.clientHeight;c.setSize(t,n,!1),d.aspect=t/n,d.updateProjectionMatrix()};return m(),addEventListener(`resize`,m),new IntersectionObserver(e=>f=e[0].isIntersecting,{rootMargin:`15%`}).observe(e),{r:c,s:l,c:d,vis:()=>f}}
const TH={Shape:e,Tex:t,Group:n,Std:r,Cam:i,Scene:a,sRGB:o,PointLight:l,Dir:d,Plane:f,Extrude:m,Box:Box3D,Phys:PhysicalMat,Torus:_,Mesh:c};
/* ---------- Badge appeso: fisica Verlet (ancora fissa -> nastro -> moschettone -> anello -> carta) ---------- */
function disegnaFronte(i){
  const W=1024,H=1440,k=document.createElement(`canvas`);k.width=W;k.height=H;const p=k.getContext(`2d`);
  const g=p.createLinearGradient(0,0,W,H);g.addColorStop(0,y(`--rib-4`)),g.addColorStop(.5,y(`--rib-3`)),g.addColorStop(1,y(`--ink`));p.fillStyle=g;p.fillRect(0,0,W,H);
  const rg=p.createRadialGradient(760,980,40,760,980,620);rg.addColorStop(0,y(`--rib-2`)+`99`),rg.addColorStop(1,y(`--rib-2`)+`00`);p.fillStyle=rg;p.fillRect(0,0,W,H);
  const d=p.getImageData(0,0,W,H);for(let q=0;q<d.data.length;q+=4){const nz=(Math.random()-.5)*14;d.data[q]+=nz;d.data[q+1]+=nz;d.data[q+2]+=nz}p.putImageData(d,0,0);
  p.fillStyle=`rgba(255,255,255,.9)`;p.font=`500 30px "JetBrains Mono"`;p.fillText(`IDENTITY PASS`,80,270);p.textAlign=`right`;p.fillText(`PORTFOLIO 2026`,944,270);p.textAlign=`left`;
  p.fillStyle=`#fff`;p.font=`600 118px "Inter Tight"`;p.fillText(`Vittorio`,80,640);p.fillText(`Ardente`,80,760);
  p.fillStyle=`rgba(255,255,255,.4)`;p.fillRect(80,820,864,2);
  p.fillStyle=`rgba(255,255,255,.92)`;p.font=`400 40px "Inter Tight"`;p.fillText(i.badge.ruolo,80,890);
  p.font=`500 26px "JetBrains Mono"`;p.fillStyle=`rgba(255,255,255,.78)`;p.fillText(i.badge.base,80,1020);p.fillText(i.badge.lingue,520,1020);
  p.font=`500 38px "Inter Tight"`;p.fillStyle=`#fff`;p.fillText(`Dalmine (BG)`,80,1074);p.fillText(`IT · EN · PL`,520,1074);
  p.font=`850 120px Archivo`;p.fillText(`VFA®`,80,1340);
  p.strokeStyle=`rgba(255,255,255,.22)`;p.lineWidth=3;p.beginPath();p.roundRect(24,24,W-48,H-48,40);p.stroke();
  return k}
function disegnaRetro(i){
  const W=1024,H=1440,k=document.createElement(`canvas`);k.width=W;k.height=H;const p=k.getContext(`2d`);
  const g=p.createLinearGradient(0,H,W,0);g.addColorStop(0,y(`--ink`)),g.addColorStop(1,y(`--rib-4`));p.fillStyle=g;p.fillRect(0,0,W,H);
  const d=p.getImageData(0,0,W,H);for(let q=0;q<d.data.length;q+=4){const nz=(Math.random()-.5)*12;d.data[q]+=nz;d.data[q+1]+=nz;d.data[q+2]+=nz}p.putImageData(d,0,0);
  p.fillStyle=`#fff`;p.font=`850 150px Archivo`;p.textAlign=`center`;p.fillText(`VFA®`,W/2,700);
  p.font=`500 28px "JetBrains Mono"`;p.fillStyle=`rgba(255,255,255,.75)`;p.fillText(i.badge.fascia.toUpperCase(),W/2,780);
  p.fillStyle=`#fff`;let bx=312;for(let q=0;q<40;q++){const w=2+(q*7)%5;p.fillRect(bx,1180,w,110);bx+=w+5}
  p.textAlign=`left`;return k}
function nastroTex(i,mobile){
  const k=document.createElement(`canvas`);k.width=mobile?256:128;k.height=mobile?1024:2048;const p=k.getContext(`2d`),W=k.width,H=k.height;
  p.fillStyle=y(`--brand`);p.fillRect(0,0,W,H);
  p.strokeStyle=`rgba(255,255,255,.07)`;p.lineWidth=1;for(let q=-H;q<H;q+=mobile?4:3){p.beginPath();p.moveTo(0,q);p.lineTo(W,q+W);p.stroke()}
  p.fillStyle=`rgba(255,255,255,.16)`;p.fillRect(W*.04,0,W*.025,H);p.fillRect(W*.935,0,W*.025,H);
  p.strokeStyle=`rgba(255,255,255,.55)`;p.lineWidth=W*.012;p.setLineDash([W*.05,W*.04]);p.beginPath();p.moveTo(W*.115,0);p.lineTo(W*.115,H);p.moveTo(W*.885,0);p.lineTo(W*.885,H);p.stroke();p.setLineDash([]);
  p.save();p.translate(W/2,H);p.rotate(-Math.PI/2);p.fillStyle=`rgba(255,255,255,.92)`;p.font=`600 ${Math.round(W*.42)}px "Inter Tight"`;p.textBaseline=`middle`;
  const step=Math.round(W*4.6);for(let q=0;q*step<H+step;q++)p.fillText(i.badge.fascia+`   ·`,q*step,0);p.restore();
  const t2=new TH.Tex(k);t2.colorSpace=TH.sRGB;t2.anisotropy=8;return t2}
function rumore(){const k=document.createElement(`canvas`);k.width=k.height=256;const p=k.getContext(`2d`),d=p.createImageData(256,256);for(let q=0;q<d.data.length;q+=4){const v=110+Math.random()*60;d.data[q]=d.data[q+1]=d.data[q+2]=v;d.data[q+3]=255}p.putImageData(d,0,0);const t2=new TH.Tex(k);t2.wrapS=t2.wrapT=1000;t2.repeat.set(5,7);return t2}
function forma(w,h,r,hx,hy,hr){const s=new TH.Shape,x0=-w/2,x1=w/2,y0=-h/2,y1=h/2;
  s.moveTo(x0+r,y0);s.lineTo(x1-r,y0);s.quadraticCurveTo(x1,y0,x1,y0+r);s.lineTo(x1,y1-r);s.quadraticCurveTo(x1,y1,x1-r,y1);s.lineTo(x0+r,y1);s.quadraticCurveTo(x0,y1,x0,y1-r);s.lineTo(x0,y0+r);s.quadraticCurveTo(x0,y0,x0+r,y0);
  if(hr){const o=new TH.Shape;o.absarc(hx,hy,hr,0,Math.PI*2,true);s.holes.push(o)}return s}
function estrudi(shape,depth,bev,w,h,remap){const g=new TH.Extrude(shape,{depth,bevelEnabled:bev>0,bevelThickness:bev,bevelSize:bev,bevelSegments:3,curveSegments:28});g.translate(0,0,-depth/2);
  if(remap){const P=g.attributes.position,U=g.attributes.uv;for(let q=0;q<U.count;q++)U.setXY(q,(P.getX(q)+w/2)/w,(P.getY(q)+h/2)/h)}return g}
async function badge(i){
  const cv=document.getElementById(`c-badge`);if(!cv)return;
  await document.fonts.ready;
  try{await Promise.all([`600 40px "Inter Tight"`,`500 30px "JetBrains Mono"`,`850 120px Archivo`].map(f=>document.fonts.load(f)))}catch{}
  const E=x(cv,{exposure:.9,env:.7,fov:26});
  const key=new TH.Dir(`#ffffff`,1.5);key.position.set(-2.5,3.5,4);E.s.add(key);
  const rim=new TH.Dir(y(`--brand-soft`)||`#78b8f9`,1.1);rim.position.set(3,1,-3);E.s.add(rim);
  const fill=new TH.Dir(`#cfe0ff`,.45);fill.position.set(3,-1,4);E.s.add(fill);
  /* materiali */
  const nz=rumore();
  const plast=new TH.Phys({color:`#eef2f8`,roughness:.5,metalness:0,clearcoat:.2,clearcoatRoughness:.4,bumpMap:nz,bumpScale:.35});
  const bordo=new TH.Phys({color:`#dfe5ee`,roughness:.4,metalness:0,clearcoat:.35,clearcoatRoughness:.3});
  const metallo=new TH.Phys({color:`#d3dae4`,metalness:1,roughness:.3,envMapIntensity:1.25});
  const metalloScuro=new TH.Phys({color:`#8a95a6`,metalness:1,roughness:.38,envMapIntensity:1.1});
  const tF=new TH.Tex(disegnaFronte(i));tF.colorSpace=TH.sRGB;tF.anisotropy=8;
  const tR=new TH.Tex(disegnaRetro(i));tR.colorSpace=TH.sRGB;tR.anisotropy=8;
  const stampaF=new TH.Phys({map:tF,roughness:.52,metalness:0,clearcoat:.1,clearcoatRoughness:.5,bumpMap:nz,bumpScale:.22,envMapIntensity:.25});
  const stampaR=new TH.Phys({map:tR,roughness:.55,metalness:0,clearcoat:.12,clearcoatRoughness:.5,envMapIntensity:.5});
  const stoffa=new TH.Phys({map:nastroTex(i,false),roughness:.88,metalness:0,side:2,sheen:.6,sheenRoughness:.6,sheenColor:`#9fc1ff`,bumpMap:nz,bumpScale:.5});
  const stoffaM=new TH.Phys({map:nastroTex(i,true),roughness:.88,metalness:0,side:2,sheen:.6,sheenRoughness:.6,sheenColor:`#9fc1ff`,bumpMap:nz,bumpScale:.5});
  /* geometria della carta e dell'hardware (coordinate locali: origine = punto E dove il nastro entra nel moschettone, y verso l'alto) */
  const CW=1.5,CH=2.109375,CT=.032,HOLE_R=.085,GR_IN=.055,TUBE=.014,RING_R=.105;
  const ringCy=-.30, ringBottom=ringCy-RING_R, holeCy=ringBottom+TUBE-GR_IN, cardTop=holeCy+.20, cardCy=cardTop-CH/2, dB=-cardCy;
  const body=new TH.Group;           /* ruota con la direzione E->B */
  const yawG=new TH.Group;body.add(yawG);
  const card=new TH.Group;card.position.set(0,cardCy,0);yawG.add(card);
  const sh=forma(CW,CH,.09,0,CH/2-.20,HOLE_R);
  const corpo=new TH.Mesh(estrudi(sh,CT,.006,CW,CH,false),[plast,bordo]);card.add(corpo);
  const fr=new TH.Mesh(estrudi(sh,.0012,0,CW,CH,true),[stampaF,stampaF]);fr.position.z=CT/2+.0092;card.add(fr);
  const re=new TH.Mesh(estrudi(sh,.0012,0,CW,CH,true),[stampaR,stampaR]);re.position.z=-CT/2-.0092;re.rotation.y=Math.PI;card.add(re);
  /* occhiello metallico di rinforzo */
  const og=new TH.Shape;og.absarc(0,0,HOLE_R,0,Math.PI*2,false);const oh=new TH.Shape;oh.absarc(0,0,GR_IN,0,Math.PI*2,true);og.holes.push(oh);
  const occhiello=new TH.Mesh(new TH.Extrude(og,{depth:CT+.016,bevelEnabled:!0,bevelThickness:.004,bevelSize:.004,bevelSegments:3,curveSegments:40}),metallo);occhiello.geometry.translate(0,0,-(CT+.016)/2);occhiello.position.set(0,holeCy-cardCy,0);card.add(occhiello);
  /* anello (nel piano y-z: passa dentro l'occhiello) */
  const anello=new TH.Mesh(new TH.Torus(RING_R,TUBE,16,64),metallo);anello.rotation.y=Math.PI/2;anello.position.set(0,ringCy,0);yawG.add(anello);
  /* moschettone: occhiello (piano x-y) agganciato all'anello + corpo rettangolare che racchiude il nastro piegato */
  const EYE_R=.03,EYE_T=.009,eyeBottom=ringCy+RING_R-(TUBE+EYE_T),eyeCy=eyeBottom+EYE_R;
  const occ=new TH.Mesh(new TH.Torus(EYE_R,EYE_T,12,36),metallo);occ.position.set(0,eyeCy,0);yawG.add(occ);
  const blocco=new TH.Mesh(new TH.Box(.215,.15,.05),metallo);blocco.position.set(0,eyeCy+EYE_R+.07,0);yawG.add(blocco);
  const fessura=new TH.Mesh(new TH.Box(.185,.012,.056),metalloScuro);fessura.position.set(0,blocco.position.y+.075,0);yawG.add(fessura);
  const tappo=new TH.Mesh(new TH.Box(.2,.01,.054),metalloScuro);tappo.position.set(0,blocco.position.y-.02,0);yawG.add(tappo);
  /* ancora fissa (chiodo con testa + occhiello di appoggio) */
  const anc=new TH.Group;
  const tg=new TH.Shape;tg.absarc(0,0,.085,0,Math.PI*2,false);
  const testa=new TH.Mesh(new TH.Extrude(tg,{depth:.03,bevelEnabled:!0,bevelThickness:.012,bevelSize:.012,bevelSegments:3,curveSegments:40}),metalloScuro);testa.position.set(0,.05,-.07);anc.add(testa);
  const gancio=new TH.Mesh(new TH.Torus(.062,.013,12,36),metallo);gancio.position.set(0,.0,-.02);anc.add(gancio);
  const morsetto=new TH.Mesh(new TH.Box(.235,.085,.03),metalloScuro);morsetto.position.set(0,-.075,.02);anc.add(morsetto);
  /* nastro: PlaneGeometry deformata ogni frame */
  const NS=9,SEG=30,Ls=1.18,seg=Ls/NS,NSEGS=SEG,BW=.2;
  const nastro=new TH.Mesh(new TH.Plane(1,1,1,NSEGS),stoffa);nastro.frustumCulled=!1;
  const scena=new TH.Group;scena.add(anc,nastro,body);E.s.add(scena);
  /* ----- simulazione ----- */
  const NP=NS+2;               /* 0..NS = nastro (0 fisso), NS+1 = baricentro carta */
  const X=new Float64Array(NP),Y=new Float64Array(NP),PX=new Float64Array(NP),PY=new Float64Array(NP),IW=new Float64Array(NP);
  for(let q=0;q<=NS;q++){X[q]=PX[q]=0;Y[q]=PY[q]=-q*seg;IW[q]=q===0?0:1}
  IW[NS]=.75;Y[NS+1]=PY[NS+1]=-Ls-dB;IW[NS+1]=.16;
  const G=9.2,DT=1/120,grab={on:!1,id:-1,ox:0,oy:0},ptr={x:0,y:0};
  let yaw=0,yawV=0,mobile=innerWidth<=760,camY=0,visW=1,visH=1;
  const ang=()=>Math.atan2(X[NS+1]-X[NS],-(Y[NS+1]-Y[NS]));
  function vincola(a,b,L,k){const dx=X[b]-X[a],dy=Y[b]-Y[a],d=Math.hypot(dx,dy)||1e-9,w=IW[a]+IW[b];if(!w)return;const c=(d-L)/d*k/w;X[a]+=dx*c*IW[a];Y[a]+=dy*c*IW[a];X[b]-=dx*c*IW[b];Y[b]-=dy*c*IW[b]}
  function passo(){
    const damp=(q)=>q===NS+1?Math.exp(-.34*DT):Math.exp(-1.5*DT);
    for(let q=1;q<NP;q++){const d=damp(q),vx=(X[q]-PX[q])*d,vy=(Y[q]-PY[q])*d;PX[q]=X[q];PY[q]=Y[q];X[q]+=vx;Y[q]+=vy-G*DT*DT}
    if(grab.on){const th=ang(),c=Math.cos(th),s=Math.sin(th),ox=grab.ox,oy=grab.oy+dB;
      const tx=ptr.x-(c*ox-s*oy),ty=ptr.y-(s*ox+c*oy);let dx=tx-X[NS+1],dy=ty-Y[NS+1];const m=Math.hypot(dx,dy),lim=.3;if(m>lim){dx*=lim/m;dy*=lim/m}X[NS+1]+=dx*.6;Y[NS+1]+=dy*.6}
    for(let it=0;it<26;it++){
      for(let q=0;q<NS;q++)vincola(q,q+1,seg,1);
      vincola(NS,NS+1,dB,1);
      X[0]=0;Y[0]=0}
    /* passaggio rigido: lunghezze mai superiori al limite (follow-the-leader) senza immettere energia */
    for(let q=1;q<=NS+1;q++){const L=q===NS+1?dB:seg,dx=X[q]-X[q-1],dy=Y[q]-Y[q-1],d=Math.hypot(dx,dy)||1e-9;
      if(q===NS+1||d>L){const k=L/d,nx=X[q-1]+dx*k,ny=Y[q-1]+dy*k;X[q]=nx;Y[q]=ny}}
    for(let q=1;q<=NS+1;q++){const L=q===NS+1?dB:seg,dx=X[q]-X[q-1],dy=Y[q]-Y[q-1],d=Math.hypot(dx,dy)||1e-9;if(q!==NS+1&&d<L-1e-4)continue;const ux=dx/d,uy=dy/d,al=((X[q]-PX[q])-(X[q-1]-PX[q-1]))*ux+((Y[q]-PY[q])-(Y[q-1]-PY[q-1]))*uy;if(q===NS+1||al>0){PX[q]+=al*ux;PY[q]+=al*uy}}
    /* velocita' massima */
    for(let q=1;q<NP;q++){const vx=X[q]-PX[q],vy=Y[q]-PY[q],m=Math.hypot(vx,vy),lm=.11;if(m>lm){PX[q]=X[q]-vx*lm/m;PY[q]=Y[q]-vy*lm/m}}
    /* imbardata (rotazione attorno all'asse verticale) */
    const vxB=(X[NS+1]-PX[NS+1])/DT,tgt=Math.max(-.7,Math.min(.7,-vxB*.12));yawV+=((tgt-yaw)*34-yawV*5.2)*DT;yaw+=yawV*DT}
  /* ----- ribbon ----- */
  const pos=nastro.geometry.attributes.position;
  function aggiornaNastro(){
    const th=ang();
    const pts=[];for(let q=0;q<=NS;q++)pts.push([X[q],Y[q]]);
    /* prolunga il nastro dentro il moschettone lungo l'asse del corpo */
    const ex=X[NS],ey=Y[NS],ux=Math.sin(th),uy=Math.cos(th);pts.push([ex-ux*(-.02)+0,ey+uy*(-.0)]);
    const n=pts.length;
    const cr=(a,b,c,d,t2)=>.5*((2*b)+(-a+c)*t2+(2*a-5*b+4*c-d)*t2*t2+(-a+3*b-3*c+d)*t2*t2*t2);
    const rows=[];for(let r=0;r<=NSEGS;r++){const u=r/NSEGS*(n-1),q=Math.min(n-2,Math.floor(u)),t2=u-q,p0=pts[Math.max(0,q-1)],p1=pts[q],p2=pts[q+1],p3=pts[Math.min(n-1,q+2)];rows.push([cr(p0[0],p1[0],p2[0],p3[0],t2),cr(p0[1],p1[1],p2[1],p3[1],t2)])}
    for(let r=0;r<=NSEGS;r++){
      const a0=rows[Math.max(0,r-1)],a1=rows[Math.min(NSEGS,r+1)];let tx=a1[0]-a0[0],ty=a1[1]-a0[1];const tl=Math.hypot(tx,ty)||1;tx/=tl;ty/=tl;
      const s01=r/NSEGS,tw=yaw*Math.pow(s01,1.6),nx=-ty,ny=tx,wx=nx*Math.cos(tw),wy=ny*Math.cos(tw),wz=Math.sin(tw);
      const hw=BW/2,cx=rows[r][0],cy=rows[r][1];
      /* riga r: PlaneGeometry ordina dall'alto (y=+.5) con v=1 verso v=0: vertici (r*2) sinistra, (r*2+1) destra */
      pos.setXYZ(r*2,cx-wx*hw,cy-wy*hw,-wz*hw);pos.setXYZ(r*2+1,cx+wx*hw,cy+wy*hw,wz*hw)}
    pos.needsUpdate=!0;nastro.geometry.computeVertexNormals();nastro.geometry.computeBoundingSphere()}
  /* ----- camera / layout ----- */
  const fov=26,tanH=Math.tan(fov*Math.PI/360);
  function layout(){
    const w=Math.max(1,cv.clientWidth),h=Math.max(1,cv.clientHeight),asp=w/h;mobile=innerWidth<=760;
    nastro.material=mobile?stoffaM:stoffa;
    const topM=.32,botM=.34,need=topM+Ls+(-(cardCy-CH/2))+botM;       /* ancora -> fondo carta + margini */
    const needW=2.9,fill=mobile?.8:(asp>1.2?.9:.82);visH=Math.max(need/fill,needW/asp);visW=visH*asp;
    const Z=visH/2/tanH;E.c.position.set(0,-visH/2+topM,Z);E.c.rotation.set(0,0,0);E.c.updateProjectionMatrix();camY=-visH/2+topM}
  layout();addEventListener(`resize`,layout);
  /* ----- puntamento ----- */
  const toWorld=(ev)=>{const r=cv.getBoundingClientRect();return[((ev.clientX-r.left)/r.width*2-1)*visW/2,camY+(1-(ev.clientY-r.top)/r.height*2)*visH/2]};
  function colpito(wx,wy){const th=ang(),c=Math.cos(th),s=Math.sin(th),dx=wx-X[NS],dy=wy-Y[NS],lx=c*dx+s*dy,ly=-s*dx+c*dy;
    return Math.abs(lx)<=CW/2+.05&&ly<=cardTop+.05&&ly>=cardTop-CH-.05?[lx,ly]:null}
  cv.style.touchAction=`pan-y`;cv.style.userSelect=`none`;cv.style.webkitUserSelect=`none`;cv.draggable=!1;cv.setAttribute(`role`,`img`);
  cv.addEventListener(`dragstart`,e=>e.preventDefault());
  cv.addEventListener(`touchstart`,ev=>{const t0=ev.touches[0],[wx,wy]=toWorld(t0);if(colpito(wx,wy))ev.preventDefault()},{passive:!1});
  cv.addEventListener(`pointerdown`,ev=>{if(ev.pointerType===`mouse`&&ev.button!==0)return;const[wx,wy]=toWorld(ev),h=colpito(wx,wy);if(!h)return;
    grab.on=!0;grab.id=ev.pointerId;grab.ox=h[0];grab.oy=h[1];ptr.x=wx;ptr.y=wy;cv.style.cursor=`grabbing`;try{cv.setPointerCapture(ev.pointerId)}catch{}ev.preventDefault()});
  cv.addEventListener(`pointermove`,ev=>{const[wx,wy]=toWorld(ev);if(grab.on&&ev.pointerId===grab.id){ptr.x=wx;ptr.y=wy;ev.preventDefault()}else if(!grab.on&&ev.pointerType===`mouse`)cv.style.cursor=colpito(wx,wy)?`grab`:``});
  const rilascia=ev=>{if(!grab.on||(ev&&ev.pointerId!==undefined&&ev.pointerId!==grab.id))return;grab.on=!1;cv.style.cursor=``;try{cv.releasePointerCapture(grab.id)}catch{}};
  cv.addEventListener(`pointerup`,rilascia);cv.addEventListener(`pointercancel`,rilascia);cv.addEventListener(`lostpointercapture`,rilascia);
  addEventListener(`blur`,()=>rilascia());
  /* spinta iniziale: il badge si assesta da solo */
  if(!v){X[NS+1]+=.38;PX[NS+1]+=.38}
  let acc=0,last=performance.now();
  const pose=()=>{const th=ang();body.position.set(X[NS],Y[NS],0);body.rotation.z=th;yawG.rotation.y=yaw;anc.position.set(0,0,0);aggiornaNastro()};
  pose();
  cv.__fis={X,Y,get yaw(){return yaw},grab,Ls,dB,seg,NS,toWorld,step:passo,pose};
  (function ciclo(tm){requestAnimationFrame(ciclo);if(!E.vis())return;let dt=Math.min(.05,(tm-last)/1e3)||.016;last=tm;acc+=dt;let n=0;while(acc>=DT&&n<8){passo();acc-=DT;n++}if(n===8)acc=0;pose();E.r.render(E.s,E.c)})(last);
}
function badgeFallback(){const cv=document.getElementById(`c-badge`);if(!cv)return;const d=document.createElement(`div`);d.setAttribute(`role`,`img`);d.setAttribute(`aria-label`,`Vittorio Ardente`);d.style.cssText=`position:absolute;inset:0;margin:auto;width:min(60%,300px);aspect-ratio:1.5/2.1;border-radius:18px;background:linear-gradient(160deg,#6d5df0,#0b46e8 55%,#070b1a);color:#fff;font:600 28px "Inter Tight",sans-serif;padding:28px;box-sizing:border-box;display:flex;align-items:center`;d.textContent=`Vittorio Ardente`;cv.replaceWith(d)}

async function carte(i){let s=document.getElementById(`c-carte`);if(s){await document.fonts.ready;let a=x(s,{exposure:1.05,env:.55,fov:28});a.c.position.set(0,0,6.2);let u=new d(`#ffffff`,1.4);u.position.set(-2,3,3),a.s.add(u),u.castShadow=!0,u.shadow.mapSize.set(1024,1024),u.shadow.camera.left=-5,u.shadow.camera.right=5,u.shadow.camera.top=5,u.shadow.camera.bottom=-5,a.r.shadowMap.enabled=innerWidth>760;let fillLight=new d(`#c7ddff`,.55);fillLight.position.set(3,1.4,3.5),a.s.add(fillLight);let f=new l(y(`--brand-soft`),10,10);f.position.set(0,-1.2,1.5),a.s.add(f);let p=new n;a.s.add(p);let h=e=>(e=e.replace(`#`,``),e.length===3&&(e=[...e].map(e=>e+e).join(``)),[0,2,4].map(t=>parseInt(e.slice(t,t+2),16)||0)),g=e=>{let[t,n,r]=h(e);return(.2126*t+.7152*n+.0722*r)/255},_=y(`--cover-a`),S=y(`--cover-b`),C=y(`--cover-c`),w=y(`--ink-2`),T=[[w,_,C],[w,C,_],[w,S,_]],E=1.22,D=1.83;i.lastre.forEach(([n,a,s,l,u,d,f,h],_)=>{let v=document.createElement(`canvas`);v.width=600,v.height=900;let y=v.getContext(`2d`),[b,x,S]=T[_];y.save();let C=y.createLinearGradient(0,0,0,900);C.addColorStop(0,b),C.addColorStop(1,S),y.fillStyle=C,y.fillRect(0,0,600,900);let w=(e,t,n,r,i,a,o)=>{y.save(),y.translate(e,t),y.rotate(i);let s=y.createLinearGradient(-n/2,0,n/2,0);s.addColorStop(0,a+`00`),s.addColorStop(.5,a+`EE`),s.addColorStop(1,o+`33`),y.fillStyle=s,y.fillRect(-n/2,-r/2,n,r),y.restore()};if(f===`diagonali`)for(let e=0;e<7;e++)w(30+e*112,450,92,1500,.5,x,S);if(f===`trama`){for(let e=0;e<5;e++)w(60+e*120,450,66,1100,0,x,S);for(let e=0;e<7;e++)w(300,90+e*120,66,900,Math.PI/2,S,x)}if(f===`verticali`)for(let e=0;e<9;e++){let t=y.createLinearGradient(0,0,0,900);t.addColorStop(0,x+`FF`),t.addColorStop(.4+e%3*.15,S+`CC`),t.addColorStop(1,b+`00`),y.fillStyle=t,y.globalAlpha=.45+e%4*.14,y.fillRect(e*68,0,68,900),y.globalAlpha=1}y.save();y.strokeStyle=`rgba(255,255,255,.055)`,y.lineWidth=1;for(let q=0;q<20;q++){y.beginPath(),y.moveTo(q*40-160,0),y.lineTo(q*40+110,900),y.stroke()}y.restore();let O=y.createRadialGradient(150,90,10,150,90,600);O.addColorStop(0,`rgba(255,255,255,.1)`),O.addColorStop(1,`rgba(255,255,255,0)`),y.fillStyle=O,y.fillRect(0,0,600,900);let k=y.getImageData(0,0,600,900),A=k.data;for(let e=0;e<A.length;e+=4){let t=(Math.random()-.5)*11;A[e]+=t,A[e+1]+=t,A[e+2]+=t}y.putImageData(k,0,0);let j=y.createLinearGradient(0,900*.56,0,900);j.addColorStop(0,S+`00`),j.addColorStop(.5,S+`D9`),j.addColorStop(1,S),y.fillStyle=j,y.fillRect(0,900*.56,600,396),y.restore();let M=g(b)>.55?`#0A0F1F`:`#FFFFFF`,N=g(S)>.55?`#0A0F1F`:`#FFFFFF`;y.fillStyle=M,y.strokeStyle=M,y.lineWidth=2,y.beginPath(),y.roundRect(44,44,64,64,16),y.stroke(),y.font=`800 22px Montserrat`,y.textAlign=`center`,y.fillText(`VFA`,76,84),y.textAlign=`left`,y.font=`600 16px "Inter Tight"`,y.fillText(i.lastreTesta,44,146),y.globalAlpha=.75,y.fillText(a.toUpperCase()+` · `+s,44,168),y.globalAlpha=1,y.textAlign=`right`,y.font=`800 30px Montserrat`,y.fillText(`0`+(_+1),556,84),y.textAlign=`left`,y.fillStyle=N;let P=104;do y.font=`800 ${P}px Montserrat`,P-=4;while(y.measureText(l).width>512&&P>40);y.fillText(l,44,650),y.font=`600 18px "JetBrains Mono"`,y.globalAlpha=.8,y.fillText(u,48,686),y.globalAlpha=1,y.font=`700 34px "JetBrains Mono"`,y.fillText(n.toUpperCase(),44,760),y.font=`500 15px "JetBrains Mono"`,y.globalAlpha=.8,y.fillText(d,44,796),y.globalAlpha=.65,y.font=`500 14px "JetBrains Mono"`,y.fillText(`N° 0`+(_+1)+` / `+h,44,856);let F=406;for(let e=0;e<34;e++){let t=1+(e*7+_*3)%4;y.fillRect(F,826,t,40),F+=t+2.4}y.globalAlpha=1,y.save(),y.strokeStyle=`rgba(255,255,255,.20)`,y.lineWidth=2,y.beginPath(),y.roundRect(20,20,560,860,25),y.stroke(),y.restore();let I=new t(v);I.colorSpace=o,I.anisotropy=8;let L=new PhysicalMat({color:S,metalness:.12,roughness:.45,clearcoat:.35,clearcoatRoughness:.35,envMapIntensity:.7}),R=new PhysicalMat({map:I,roughness:.82,metalness:0,clearcoat:.06,clearcoatRoughness:.7,envMapIntensity:.28}),z=new e,B=E/2,V=D/2;z.moveTo(-.48,-.915),z.lineTo(.48,-.915),z.quadraticCurveTo(B,-.915,B,-.785),z.lineTo(B,.785),z.quadraticCurveTo(B,V,.48,V),z.lineTo(-.48,V),z.quadraticCurveTo(-.61,V,-.61,.785),z.lineTo(-.61,-.785),z.quadraticCurveTo(-.61,-.915,-.48,-.915);let H=new m(z,{depth:.044,bevelEnabled:!0,bevelThickness:.011,bevelSize:.009,bevelSegments:4,curveSegments:24});H.translate(0,0,-.022);let U=H.attributes.position,W=H.attributes.uv;for(let e=0;e<W.count;e++)W.setXY(e,(U.getX(e)+B)/E,(U.getY(e)+V)/D);let G=new c(H,[R,L]);G.castShadow=!0,G.receiveShadow=!0;let backing=new c((()=>{let q=new m(z,{depth:.018,bevelEnabled:!1,curveSegments:24});q.translate(0,0,-.009);q.scale(.955,.955,1);return q})(),new PhysicalMat({color:`#c6d0dc`,metalness:.04,roughness:.62,clearcoat:0,envMapIntensity:.3}));backing.position.z=-.026,G.add(backing);G.position.set(-1.38+_*1.38,-Math.abs(_-1)*.1,-Math.abs(_-1)*.2),G.rotation.set(-.06,-.22+_*.22,.07-_*.07),G.userData.b=_,G.userData.ry=-.16+_*.16,p.add(G)});let O=()=>{let e=s.clientWidth/Math.max(1,s.clientHeight),t=s.clientWidth<980,n=t?.78:1.38;p.children.forEach((e,r)=>{e.position.x=(r-1)*n,e.position.z=-Math.abs(r-1)*(t?.35:.2),e.userData.ry=(r-1)*(t?.28:.22),e.rotation.z=(1-r)*(t?.12:.07)}),p.scale.setScalar(t?Math.min(1.3,e/1.05):Math.min(.66,e/2.35)),p.position.y=t?-.1:-.3,p.position.x=0,a.r.shadowMap.enabled=innerWidth>760};O(),addEventListener(`resize`,O),(function e(t){if(requestAnimationFrame(e),!a.vis())return;let n=t*.001;p.children.forEach((e,t)=>{e.position.y+=v?0:Math.sin(n+t)*.0012,e.rotation.y=e.userData.ry+(v?0:Math.sin(n*.5+t)*.05)+b.x*.1,e.rotation.x=-.08+b.y*.05}),a.r.render(a.s,a.c)})(0)}}
async function S(i){try{await badge(i)}catch(err){console.warn(`badge 3D non disponibile`,err);badgeFallback()}try{await carte(i)}catch(err){console.warn(`carte 3D non disponibili`,err)}}export{S as avvia};
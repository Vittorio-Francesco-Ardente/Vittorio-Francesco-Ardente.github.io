/* Original motion-graphics route for VFA menu. No external animations. */
(function VfaKineticRouteV5(){
"use strict";
const menu=document.getElementById("menu");
const list=menu?.querySelector(".m-corpo ol");
if(!list||list.querySelector(".vfa-route-map"))return;
const links=[...list.querySelectorAll(":scope > li > a[data-voce]")];
if(links.length<2)return;
const lang=(document.documentElement.lang||"it").slice(0,2).toLowerCase();
const dictionary={it:"SEI QUI",en:"YOU ARE HERE",pl:"TU JESTEŚ"};
const parts=location.pathname.toLowerCase().replace(/\.html$/,"").replace(/\/index$/,"").split("/").filter(Boolean);
if(["it","en","pl"].includes(parts[0]))parts.shift();
let section=parts[0]||"home";
if(section.startsWith("esperienza-"))section="esperienze";
if(["cv","crediti"].includes(section))section="chi-sono";
if(section==="link")section="contatti";
const found=links.findIndex(a=>a.dataset.voce===section);
const active=Math.max(0,found);
const ns="http://www.w3.org/2000/svg";
const mk=(tag,name)=>{const node=document.createElementNS(ns,tag);node.setAttribute("class",name);return node;};
links.forEach((a,i)=>{
  a.style.setProperty("--vfa-order",String(i));
  const title=a.querySelector("span");
  if(!title)return;
  title.classList.add("vfa-route-title");
  const pin=document.createElement("span");
  pin.className="vfa-route-pin";
  pin.setAttribute("aria-hidden","true");
  a.insertBefore(pin,title);
  const current=i===found;
  a.classList.toggle("vfa-route-current",current);
  if(current){
    a.setAttribute("aria-current","page");
    const label=document.createElement("small");
    label.className="vfa-route-here";
    label.textContent=dictionary[lang]||dictionary.it;
    label.setAttribute("aria-hidden","true");
    a.append(label);
  }else a.removeAttribute("aria-current");
});
const svg=mk("svg","vfa-route-map");
svg.setAttribute("aria-hidden","true");
svg.setAttribute("preserveAspectRatio","none");
const road=mk("path","vfa-route-road");
const white=mk("path","vfa-route-white");
const activePath=mk("path","vfa-route-active");
const ripple=mk("path","vfa-route-ripple");
const runner=mk("g","vfa-route-runner");
const disc=mk("circle","vfa-route-disc");
disc.setAttribute("r","13");
const arrow=mk("path","vfa-route-arrow");
arrow.setAttribute("d","M-6 3 L0 -4 L6 3");
runner.append(disc,arrow);
const defs=mk("defs","vfa-route-defs");
const mask=mk("mask","vfa-route-mask");
mask.id="vfa-route-text-cutout";
mask.setAttribute("maskUnits","userSpaceOnUse");
mask.setAttribute("maskContentUnits","userSpaceOnUse");
const visible=mk("rect","vfa-route-mask-ground");
visible.setAttribute("fill","#fff");
mask.append(visible);
defs.append(mask);
for(const shape of [road,white,activePath,ripple,runner])shape.setAttribute("mask","url(#vfa-route-text-cutout)");
svg.append(defs,road,white,activePath,ripple,runner);
list.prepend(svg);
const reduced=matchMedia("(prefers-reduced-motion: reduce)");
let stops=[],total=1,position=active;
let opened=false,frame=0,layoutFrame=0,moveBegin=0,moveFrom=active,moveTo=active,duration=680;
function curve(a,b,t){
  const u=1-t,dy=b.y-a.y;
  const c1={x:a.x,y:a.y+dy*.56};
  const c2={x:b.x,y:b.y-dy*.56};
  return {
    x:u*u*u*a.x+3*u*u*t*c1.x+3*u*t*t*c2.x+t*t*t*b.x,
    y:u*u*u*a.y+3*u*u*t*c1.y+3*u*t*t*c2.y+t*t*t*b.y
  };
}
function curveLength(a,b){
  let total=0,last=a;
  for(let i=1;i<=72;i++){
    const p=curve(a,b,i/72);
    total+=Math.hypot(p.x-last.x,p.y-last.y);
    last=p;
  }
  return total;
}
function distanceAt(p){
  if(stops.length!==links.length)return 0;
  const t=Math.max(0,Math.min(links.length-1,p));
  const i=Math.floor(t),n=Math.min(i+1,links.length-1);
  return stops[i]+(stops[n]-stops[i])*(t-i);
}
function render(){
  if(stops.length!==links.length)return;
  const dist=Math.max(0,Math.min(total,distanceAt(position)));
  const pt=road.getPointAtLength(dist);
  const before=road.getPointAtLength(Math.max(0,dist-3));
  const after=road.getPointAtLength(Math.min(total,dist+3));
  const rotation=Math.atan2(after.y-before.y,after.x-before.x)*180/Math.PI+90;
  runner.setAttribute("transform",`translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)}) rotate(${rotation.toFixed(1)})`);
  activePath.setAttribute("stroke-dasharray",`${Math.max(.1,dist).toFixed(2)} ${(total+16).toFixed(2)}`);
  ripple.setAttribute("stroke-dasharray",`45 ${(total+80).toFixed(2)}`);
}
function measure(){
  if(!opened)return;
  const b=list.getBoundingClientRect();
  if(b.width<40||b.height<60)return;
  svg.setAttribute("viewBox",`0 0 ${b.width.toFixed(2)} ${b.height.toFixed(2)}`);
  const pts=links.map(a=>{
    const r=a.querySelector(".vfa-route-pin").getBoundingClientRect();
    return {x:Math.max(10,Math.min(b.width-10,r.left+r.width/2-b.left)),
      y:Math.max(12,Math.min(b.height-12,r.top+r.height/2-b.top))};
  });
  if(pts.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))return;
  visible.setAttribute("x","0");visible.setAttribute("y","0");
  visible.setAttribute("width",b.width.toFixed(2));visible.setAttribute("height",b.height.toFixed(2));
  while(mask.children.length>1)mask.lastChild.remove();
  for(const link of links){
    const label=link.querySelector(".vfa-route-title");
    if(!label)continue;
    const box=label.getBoundingClientRect();
    const hole=mk("rect","vfa-route-hole");
    hole.setAttribute("x",(box.left-b.left-6).toFixed(1));
    hole.setAttribute("y",(box.top-b.top-5).toFixed(1));
    hole.setAttribute("width",(box.width+12).toFixed(1));
    hole.setAttribute("height",(box.height+10).toFixed(1));
    hole.setAttribute("rx","4");hole.setAttribute("fill","#000");
    mask.append(hole);
  }
  let d=`M${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`,acc=0;
  const lengths=[0];
  for(let i=1;i<pts.length;i++){
    const a=pts[i-1],c=pts[i],dy=c.y-a.y;
    d+=` C${a.x.toFixed(2)} ${(a.y+dy*.56).toFixed(2)} ${c.x.toFixed(2)} ${(c.y-dy*.56).toFixed(2)} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`;
    acc+=curveLength(a,c);
    lengths.push(acc);
  }
  for(const p of [road,white,activePath,ripple])p.setAttribute("d",d);
  total=Math.max(1,road.getTotalLength());
  stops=lengths.map(n=>acc?n*total/acc:0);
  stops[stops.length-1]=total;
  white.style.setProperty("--vfa-road-length",`${total}px`);
  white.style.strokeDasharray=`${(total+4).toFixed(2)} ${(total+4).toFixed(2)}`;
  ripple.style.setProperty("--vfa-road-length",`${total}px`);
  svg.classList.add("vfa-route-ready");
  render();
}
function step(now){
  frame=0;
  if(!opened||document.hidden)return;
  const t=Math.min(1,(now-moveBegin)/duration);
  const eased=1-Math.pow(1-t,4);
  position=moveFrom+(moveTo-moveFrom)*eased;
  render();
  if(t<1)frame=requestAnimationFrame(step);
  else {position=moveTo;render();}
}
function target(index){
  if(!opened)return;
  links.forEach((a,i)=>a.classList.toggle("vfa-route-preview",i===index));
  if(reduced.matches){cancelAnimationFrame(frame);frame=0;position=index;moveTo=index;render();return;}
  cancelAnimationFrame(frame);
  moveFrom=position;moveTo=index;moveBegin=performance.now();
  duration=Math.max(300,Math.min(790,360+Math.abs(index-position)*85));
  frame=requestAnimationFrame(step);
}
function layout(){
  cancelAnimationFrame(layoutFrame);
  layoutFrame=requestAnimationFrame(()=>{layoutFrame=0;measure();});
}
links.forEach((a,i)=>{
  a.addEventListener("pointerenter",event=>{if(event.pointerType!=="touch")target(i)});
  a.addEventListener("focus",()=>target(i));
});
list.addEventListener("pointerleave",()=>target(active));
list.addEventListener("focusout",event=>{if(!list.contains(event.relatedTarget))target(active);});
function toggle(){
  const now=menu.classList.contains("aperto");
  if(now===opened)return;
  opened=now;
  if(!opened){
    cancelAnimationFrame(frame);cancelAnimationFrame(layoutFrame);frame=layoutFrame=0;
    position=active;moveFrom=moveTo=active;
    svg.classList.remove("vfa-route-ready");
    links.forEach(a=>a.classList.remove("vfa-route-preview"));
    return;
  }
  position=active;moveFrom=moveTo=active;
  requestAnimationFrame(()=>{
    if(!opened)return;
    measure();
    const pending=document.activeElement;
    const i=links.indexOf(pending);
    if(i>=0)target(i);
  });
}
new MutationObserver(toggle).observe(menu,{attributes:true,attributeFilter:["class"]});
if("ResizeObserver" in window){
  const observer=new ResizeObserver(layout);
  observer.observe(list);
  links.forEach(a=>observer.observe(a));
}
window.addEventListener("resize",layout,{passive:true});
if(window.visualViewport)window.visualViewport.addEventListener("resize",layout,{passive:true});
if(document.fonts?.ready)document.fonts.ready.then(layout);
document.addEventListener("visibilitychange",()=>{
  if(document.hidden){cancelAnimationFrame(frame);frame=0;}
  else if(opened){measure();target(active);}
});
if(reduced.addEventListener)reduced.addEventListener("change",()=>{
  if(reduced.matches){cancelAnimationFrame(frame);frame=0;position=moveTo;render();}
});
toggle();
})();

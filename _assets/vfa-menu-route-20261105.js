/* VFA original route-map navigation. Live SVG geometry and accessible active waypoints. */
(function routeMapV4(){
"use strict";
const menu=document.getElementById("menu");
if(!menu)return;
const list=menu.querySelector(".m-corpo ol");
if(!list||list.querySelector(".vfa-route-map"))return;
const links=[...list.querySelectorAll("li > a[data-voce]")];
if(links.length<2)return;
const locale=(document.documentElement.lang||"it").slice(0,2);
const statuses={it:"SEI QUI",en:"YOU ARE HERE",pl:"TU JESTEŚ"};
const parts=location.pathname.toLowerCase().replace(/\.html$/,"").replace(/\/index$/,"").split("/").filter(Boolean);
if(["en","pl","it"].includes(parts[0]))parts.shift();
let section=parts[0]||"home";
if(section.startsWith("esperienza-"))section="esperienze";
if(["cv","crediti"].includes(section))section="chi-sono";
if(section==="link")section="contatti";
const active=links.findIndex(a=>a.dataset.voce===section);
const home=active>=0?active:0;
const ns="http://www.w3.org/2000/svg";
const make=(tag,cls)=>{const n=document.createElementNS(ns,tag);n.setAttribute("class",cls);return n};
links.forEach((a,i)=>{
 const title=a.querySelector("span");if(!title)return;
 const pin=document.createElement("span");pin.className="vfa-route-pin";pin.setAttribute("aria-hidden","true");a.insertBefore(pin,title);
 const yes=i===active;
 a.classList.toggle("vfa-route-current",yes);
 if(yes){a.setAttribute("aria-current","page");title.dataset.vfaStatus=statuses[locale]||statuses.it;}
 else{a.removeAttribute("aria-current");delete title.dataset.vfaStatus;}
});
const svg=make("svg","vfa-route-map");svg.setAttribute("aria-hidden","true");svg.setAttribute("preserveAspectRatio","none");
const path=make("path","vfa-route-base"),dots=make("path","vfa-route-dashes"),progress=make("path","vfa-route-traveled");
const halo=make("circle","vfa-route-halo"),cursor=make("circle","vfa-route-cursor");
halo.setAttribute("r","11");cursor.setAttribute("r","4");
svg.append(path,dots,progress,halo,cursor);list.prepend(svg);
const reduced=matchMedia("(prefers-reduced-motion:reduce)");
let opened=false,stops=[],total=1,position=home,target=home,animation=0,resizeRaf=0,last=0;
function bez(a,b,t){
 const u=1-t,dy=b.y-a.y,c1={x:a.x,y:a.y+.53*dy},c2={x:b.x,y:b.y-.53*dy};
 return {x:u*u*u*a.x+3*u*u*t*c1.x+3*u*t*t*c2.x+t*t*t*b.x,y:u*u*u*a.y+3*u*u*t*c1.y+3*u*t*t*c2.y+t*t*t*b.y};
}
function len(a,b){let p=a,v=0;for(let i=1;i<=50;i++){const n=bez(a,b,i/50);v+=Math.hypot(n.x-p.x,n.y-p.y);p=n;}return v;}
function at(index){
 if(stops.length<2)return 0;
 const i=Math.min(stops.length-1,Math.max(0,index)),a=Math.floor(i),b=Math.min(a+1,stops.length-1);
 return stops[a]+(stops[b]-stops[a])*(i-a);
}
function paint(){
 if(stops.length<2)return;
 const d=Math.max(0,Math.min(total,at(position))),p=path.getPointAtLength(d);
 progress.setAttribute("stroke-dasharray",Math.max(.01,d).toFixed(2)+" "+(total+8).toFixed(2));
 for(const c of [halo,cursor]){c.setAttribute("cx",p.x.toFixed(2));c.setAttribute("cy",p.y.toFixed(2));}
}
function measure(){
 if(!opened)return;
 const b=list.getBoundingClientRect();if(b.width<40||b.height<50)return;
 svg.setAttribute("viewBox","0 0 "+b.width.toFixed(2)+" "+b.height.toFixed(2));
 const pts=links.map(a=>{const r=a.querySelector(".vfa-route-pin").getBoundingClientRect();return {x:Math.min(b.width-8,Math.max(8,r.left+r.width/2-b.left)),y:Math.min(b.height-8,Math.max(8,r.top+r.height/2-b.top))};});
 if(pts.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))return;
 let d="M "+pts[0].x.toFixed(2)+" "+pts[0].y.toFixed(2);
 let approx=0;const sums=[0];
 for(let i=1;i<pts.length;i++){const a=pts[i-1],p=pts[i],dy=p.y-a.y;d+=" C "+a.x.toFixed(2)+" "+(a.y+.53*dy).toFixed(2)+" "+p.x.toFixed(2)+" "+(p.y-.53*dy).toFixed(2)+" "+p.x.toFixed(2)+" "+p.y.toFixed(2);approx+=len(a,p);sums.push(approx);}
 [path,dots,progress].forEach(n=>n.setAttribute("d",d));
 total=Math.max(1,path.getTotalLength());stops=sums.map(v=>v*(approx>0?total/approx:1));stops[stops.length-1]=total;
 paint();svg.classList.add("vfa-route-measured");
}
function step(now){
 animation=0;if(!opened||document.hidden)return;
 const dt=last?Math.min((now-last)/1000,.065):.016;last=now;
 position+=(target-position)*(1-Math.exp(-9.2*dt));
 if(Math.abs(target-position)<.002)position=target;
 paint();if(position!==target)animation=requestAnimationFrame(step);
}
function move(i){
 target=i;links.forEach((a,n)=>a.classList.toggle("vfa-route-focused",n===i));
 if(reduced.matches){cancelAnimationFrame(animation);animation=0;position=i;paint();}
 else if(opened&&!animation){last=0;animation=requestAnimationFrame(step);}
}
function schedule(){
 if(resizeRaf)cancelAnimationFrame(resizeRaf);
 resizeRaf=requestAnimationFrame(()=>{resizeRaf=0;measure();});
}
links.forEach((a,i)=>{
 a.addEventListener("pointerenter",e=>{if(e.pointerType!=="touch")move(i);});
 a.addEventListener("focus",()=>move(i));
});
list.addEventListener("pointerleave",()=>move(home));
list.addEventListener("focusout",e=>{if(!list.contains(e.relatedTarget))move(home);});
function onOpen(){
 const now=menu.classList.contains("aperto");if(now===opened)return;opened=now;
 if(!opened){cancelAnimationFrame(animation);animation=0;cancelAnimationFrame(resizeRaf);resizeRaf=0;position=home;target=home;svg.classList.remove("vfa-route-measured");return;}
 position=reduced.matches?home:0;target=position;
 requestAnimationFrame(()=>{if(!opened)return;measure();move(home);});
}
new MutationObserver(onOpen).observe(menu,{attributes:true,attributeFilter:["class"]});
if("ResizeObserver" in window){const r=new ResizeObserver(schedule);r.observe(list);links.forEach(a=>r.observe(a));}
window.addEventListener("resize",schedule,{passive:true});
if(window.visualViewport)window.visualViewport.addEventListener("resize",schedule,{passive:true});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(schedule);
document.addEventListener("visibilitychange",()=>{if(document.hidden){cancelAnimationFrame(animation);animation=0;}else if(opened){measure();move(home);}});
if(reduced.addEventListener)reduced.addEventListener("change",()=>{if(reduced.matches){position=target;cancelAnimationFrame(animation);animation=0;paint();}});
onOpen();
})();

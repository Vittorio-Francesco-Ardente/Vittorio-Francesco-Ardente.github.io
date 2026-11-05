const { chromium } = require('playwright');
(async()=>{
const fs = require('fs');
const executable=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>fs.existsSync(x));
const browser=await chromium.launch({headless:true,...(executable?{executablePath:executable}:{})});
let problems=[];
const cases=[[320,700,"/"],[390,844,"/"],[430,932,"/"],[390,844,"/lavori.html"],[390,844,"/esperienze.html"],[390,844,"/en.html"],[390,844,"/pl.html"],[768,1024,"/"],[1440,900,"/lavori.html"]];
for(const [width,height,path] of cases){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:width<500?2:1.5,isMobile:width<500,hasTouch:width<500});
 page.on("pageerror",e=>console.log("JSERROR",path,e.message));
 await page.goto("http://127.0.0.1:8765"+path,{waitUntil:"domcontentloaded",timeout:20000});
 await page.waitForTimeout(900);
 const info=await page.evaluate(()=>{
 const get=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {top:r.top+scrollY,bottom:r.bottom+scrollY,height:r.height,width:r.width,left:r.left,right:r.right,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight,display:getComputedStyle(e).display}};
 const links=[...document.querySelectorAll(".nav .barra .voce")].filter(e=>getComputedStyle(e).display!=="none");
 const spans=links.map(e=>e.querySelector("span")).filter(Boolean);
 const images=[...document.querySelectorAll(".s-make .persona img")];
 const exp=[...document.querySelectorAll(".s-esp")].map(e=>{const r=e.getBoundingClientRect();const kids=[...e.children].filter(c=>getComputedStyle(c).display!=="none"&&getComputedStyle(c).position!=="absolute").map(c=>c.getBoundingClientRect().bottom-r.top);return{height:r.height,lastContentBottom:Math.max(0,...kids),tag:e.id}});
 return {
 documentWidth:document.documentElement.scrollWidth,viewport:innerWidth,
 menu:get(".nav .barra"),labels:spans.map(e=>({txt:e.textContent.trim(),width:e.getBoundingClientRect().width,clip:getComputedStyle(e).clipPath})),
 icons:links.map(e=>({svg:!!e.querySelector("svg"),w:e.querySelector("svg")?.getBoundingClientRect().width||0})),
 postit:get(".s-make .post-it"),portrait:get(".s-make .persona"),portraitImage:get(".s-make .persona img"),profile:get(".s-make"),
 homeHero:get(".s-forma"),middle:get(".s-forma .mezzo"),cards:get(".s-forma .basso"),
 worksHero:get(".s-agency .hero"),worksWave:get(".s-agency .hero .onda-bg"),
 experiences:exp,projects:get(".s-rayder"),theme:document.documentElement.dataset.tema
 };
 });
 let issues=[];
 if(info.documentWidth>width+2)issues.push("horizontal-overflow");
 if(width<500){
  if(info.labels.some(x=>x.width>2||x.clip!=="inset(50%)"))issues.push("nav-label-visible");
  if(info.menu&&info.icons.some(x=>x.w<20))issues.push("nav-icon-small");
  if(path==="/"&&info.postit&&info.postit.display!=="none")issues.push("italian-postit-visible");
  if(path==="/"&&info.profile&&info.portrait&&Math.abs(info.profile.bottom-info.portrait.bottom)>22)issues.push("profile-image-not-flush");
  if(path.includes("esperienze")&&info.experiences.some(x=>x.height-x.lastContentBottom>105))issues.push("empty-experience-card-space");
  if(path.includes("lavori")&&info.worksHero?.height>height*0.95)issues.push("works-hero-too-tall");
 }
 if(info.theme!=="base")issues.push("theme-not-fixed");
 problems.push(...issues.map(issue=>({path,width,issue})));
 console.log("MOBILE_REPORT",JSON.stringify({width,height,path,issues,navLabels:info.labels,profileGap:info.profile&&info.portrait?Math.round(info.profile.bottom-info.portrait.bottom):null,experiences:info.experiences,worksHeroHeight:Math.round(info.worksHero?.height||0),homeCardsGap:info.middle&&info.cards?Math.round(info.cards.top-info.middle.bottom):null}));
 if(width===390&&["/","/lavori.html","/esperienze.html"].includes(path)){
  const selectors=path==="/"?[".s-forma .basso",".s-make"]:path==="/lavori.html"?[".s-agency",".s-rayder"]:[".s-esp"];
  for(let j=0;j<selectors.length;j++){
   await page.locator(selectors[j]).first().scrollIntoViewIfNeeded();
   await page.waitForTimeout(250);
   const img=await page.screenshot({type:"jpeg",quality:55});
   console.log("VISUAL_"+path.replace(/\W/g,"_")+"_"+j+"="+img.toString("base64"));
  }
 }
 await page.close();
}
console.log("MOBILE_SUMMARY",JSON.stringify({cases:cases.length,problems}));
await browser.close();if(problems.length)process.exitCode=1;
})().catch(e=>{console.log("AUDIT_FATAL",e.stack||String(e));process.exitCode=1});

// Audit: mobile icons, whitespace, poster and section boundaries.

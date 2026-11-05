const {chromium}=require("playwright");
const fs=require("fs");
(async()=>{
 const executable=["/usr/bin/google-chrome","/usr/bin/google-chrome-stable","/usr/bin/chromium"].find(p=>fs.existsSync(p));
 const browser=await chromium.launch({headless:true,...(executable?{executablePath:executable}:{})});
 const cases=[
  [320,700,"/"],[390,844,"/"],[430,932,"/"],
  [390,844,"/contatti.html"],[320,700,"/contatti.html"],
  [390,844,"/lavori.html"],[390,844,"/esperienze.html"],
  [390,844,"/chi-sono.html"],[390,844,"/certificazioni.html"],
  [390,844,"/en.html"],[390,844,"/pl.html"],
  [390,844,"/en/contatti.html"],[390,844,"/pl/contatti.html"],
  [768,1024,"/"],[1440,900,"/contatti.html"]
 ];
 const issues=[];
 for(const [width,height,path] of cases){
  const page=await browser.newPage({viewport:{width,height},isMobile:width<=430,hasTouch:width<=430,deviceScaleFactor:width<=430?2:1});
  const pageerrors=[];page.on("pageerror",e=>pageerrors.push(e.message.slice(0,140)));
  await page.goto("http://127.0.0.1:8765"+path,{waitUntil:"domcontentloaded",timeout:25000});
  await page.waitForTimeout(path.includes("contatti")?2400:550);
  const data=await page.evaluate(()=>{
    const q=s=>document.querySelector(s);
    const rect=e=>{if(!e)return null;let a=e.getBoundingClientRect();return{w:+a.width.toFixed(1),h:+a.height.toFixed(1),x:+a.x.toFixed(1),y:+a.y.toFixed(1),right:+a.right.toFixed(1),bottom:+a.bottom.toFixed(1)}};
    const footer=q(".s-sent"),first=q(".s-sent > div:has(> h2)"),cols=q(".s-sent .colonne");
    const canvas=q("#c-badge"),badge=q(".s-badge"),mail=q(".s-badge .email-pill");
    return {
      docWidth:document.documentElement.scrollWidth,viewport:innerWidth,
      footer:rect(footer),firstDisplay:first?getComputedStyle(first).display:null,
      cols:rect(cols),footerLinks:[...document.querySelectorAll(".s-sent a")].filter(e=>getComputedStyle(e).display!=="none").length,
      navPagesDisplay:getComputedStyle(q(".s-sent .colonne > nav:nth-child(2)"))?.display,themeSelectDisplay:q(".s-sent #sel-tema")?getComputedStyle(q(".s-sent #sel-tema")).display:"absent",
      footerSocial:[...document.querySelectorAll(".s-sent .fondo nav a")].map(e=>rect(e)),
      canvas:rect(canvas),badge:rect(badge),mail:rect(mail),
      canvasPixels:canvas?[canvas.width,canvas.height]:null,
      baseTheme:document.documentElement.dataset.tema
    };
  });
  const flags=[];
  if(data.docWidth>width+2)flags.push("horizontal-overflow");
  if(width<=430&&data.footer&&data.footer.h>Math.max(640,height*.76))flags.push("footer-overly-tall");
  if(width<=430&&data.footer&&data.firstDisplay!=="none")flags.push("footer-cta-not-hidden");
  if(width<=430&&data.footer&&data.navPagesDisplay!=="none")flags.push("duplicate-pages-nav-visible");
  if(width<=430&&data.footerSocial.some(r=>r.w<44||r.h<44))flags.push("footer-social-too-small");
  if(data.badge&&width<=430&&(data.canvas?.right>data.badge?.right+2||data.canvas?.x<data.badge?.x-2))flags.push("pass-canvas-overflow");
  if(width<=430&&data.mail&&data.badge&&(data.mail.right>data.badge.right+2||data.mail.x<data.badge.x-2))flags.push("email-overflow");
  if(data.baseTheme!=="base")flags.push("unexpected-theme");
  if(data.themeSelectDisplay!=="absent"&&data.themeSelectDisplay!=="none")flags.push("legacy-theme-selector-visible");
  if(width===390&&data.footer?.h>530)flags.push("footer-still-too-tall");
  if(pageerrors.length)flags.push("page-js-error");
  issues.push(...flags.map(flag=>({width,path,flag})));
  console.log("VIEW_REPORT",JSON.stringify({path,width,height,flags,metrics:data,errors:pageerrors}));
  if(width===390&&["/","/contatti.html","/lavori.html","/en.html"].includes(path)){
   if(path.includes("contatti")){
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.waitForTimeout(600);
    console.log("SCREEN_PASS_"+path.replace(/\W/g,"_")+"="+(await page.screenshot({type:"jpeg",quality:48})).toString("base64"));
   }
   await page.locator(".s-sent").scrollIntoViewIfNeeded();
   await page.waitForTimeout(300);
   console.log("SCREEN_FOOTER_"+path.replace(/\W/g,"_")+"="+(await page.screenshot({type:"jpeg",quality:48})).toString("base64"));
  }
  await page.close();
 }
 await browser.close();
 console.log("FINAL_AUDIT",JSON.stringify({cases:cases.length,issues}));
 if(issues.length)process.exitCode=1;
})().catch(e=>{console.log("AUDIT_FATAL",e.stack||String(e));process.exitCode=1});

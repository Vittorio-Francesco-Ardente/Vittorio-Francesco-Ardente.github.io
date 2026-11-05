const {chromium}=require('playwright');
const fs=require('fs');
(async()=>{
 const exe=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>fs.existsSync(x));
 const browser=await chromium.launch({headless:true,...(exe?{executablePath:exe}:{})});
 const cases=[[320,700,'/'],[390,844,'/'],[430,932,'/'],[390,844,'/en.html'],[390,844,'/pl.html'],[390,844,'/contatti.html'],[320,700,'/contatti.html'],[390,844,'/en/contatti.html'],[390,844,'/pl/contatti.html'],[768,1024,'/'],[1440,900,'/'],[1440,900,'/contatti.html']];
 const problems=[];
 for(const [width,height,path] of cases){
   const mobile=width<=430;
   const page=await browser.newPage({viewport:{width,height},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1});
   const errors=[];page.on('pageerror',e=>errors.push(e.message.slice(0,160)));
   await page.goto('http://127.0.0.1:8765'+path,{waitUntil:'domcontentloaded',timeout:25000});
   await page.waitForTimeout(path.includes('contatti')?1800:750);
   const metrics=await page.evaluate(()=>{
     const q=s=>document.querySelector(s);
     const rect=e=>{if(!e)return null;let r=e.getBoundingClientRect();return{x:+r.x.toFixed(1),y:+r.y.toFixed(1),w:+r.width.toFixed(1),h:+r.height.toFixed(1),right:+r.right.toFixed(1),bottom:+r.bottom.toFixed(1)}};
     const section=q('.s-mazzo');
     const controls=[...document.querySelectorAll('.s-mazzo .mz-comandi button')].map(x=>getComputedStyle(x).display);
     const images=[...document.querySelectorAll('.s-mazzo .carta img')].map(x=>({src:x.getAttribute('src'),loaded:x.complete&&x.naturalWidth>0,actual:[x.naturalWidth,x.naturalHeight],objectFit:getComputedStyle(x).objectFit,filter:getComputedStyle(x).filter}));
     const firstTitle=q('.s-mazzo .carta b');
     const bd=q('.s-badge'),cn=q('#c-badge');
     return {viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,
       deck:rect(section),deckVisible:!!section,buttons:controls,
       count:q('.mz-n')?.textContent?.trim(),images,
       titleColor:firstTitle?getComputedStyle(firstTitle).color:null,
       sectionBackground:section?getComputedStyle(section).backgroundImage:null,
       pass:rect(cn),passSection:rect(bd),passRenderSize:cn?[cn.width,cn.height]:null,
       theme:document.documentElement.dataset.tema};
   });
   const flags=[];
   if(metrics.documentWidth>metrics.viewport+2)flags.push('horizontal-overflow');
   if(metrics.theme!=='base')flags.push('base-theme-not-fixed');
   if(metrics.deckVisible&&metrics.images.some(x=>!x.loaded))flags.push('deck-photo-not-loaded');
   if(metrics.deckVisible&&mobile&&metrics.buttons.some(x=>x!=='none'))flags.push('touch-buttons-still-visible');
   if(metrics.deckVisible&&!mobile&&metrics.buttons.some(x=>x==='none'))flags.push('desktop-controls-inaccessible');
   if(metrics.deckVisible&&(!metrics.images.some(x=>x.src.includes('sunfai-home-desktop'))||!metrics.images.some(x=>x.src.includes('ritratto-pulito'))))flags.push('new-photo-not-used');
   if(metrics.deckVisible&&!metrics.sectionBackground.includes('gradient'))flags.push('deck-background-missing');
   if(metrics.pass&&mobile&&(metrics.pass.x<0||metrics.pass.right>metrics.viewport+2))flags.push('pass-canvas-overflow');
   if(errors.length)flags.push('runtime-error');
   let swipe=null;
   if(metrics.deckVisible&&mobile&&path==='/'){
     const deck=page.locator('.s-mazzo .mazzo');
     await deck.scrollIntoViewIfNeeded();
     await page.waitForTimeout(160);
     if(width===390){
       let shot=await page.screenshot({type:'jpeg',quality:60});
       console.log('SNAP_DECK_MOBILE='+shot.toString('base64'));
     }
     const box=await deck.boundingBox();
     const y=box.y+box.height*.48,from=box.x+box.width*.78,to=box.x+box.width*.24;
     const before=(await page.locator('.mz-n').innerText()).trim();
     await page.mouse.move(from,y);await page.mouse.down();
     await page.mouse.move(to,y,{steps:15});await page.mouse.up();
     await page.waitForTimeout(350);
     const after=(await page.locator('.mz-n').innerText()).trim();
     swipe={before,after};if(before===after)flags.push('swipe-did-not-change-card');
     if(width===390){
       let shot=await page.screenshot({type:'jpeg',quality:60});
       console.log('SNAP_DECK_SWIPED='+shot.toString('base64'));
     }
   }
   if(metrics.pass&&width===390&&path==='/contatti.html'){
     await page.evaluate(()=>scrollTo(0,0));
     await page.waitForTimeout(250);
     console.log('SNAP_PASS_MOBILE='+(await page.screenshot({type:'jpeg',quality:66})).toString('base64'));
   }
   if(metrics.deckVisible&&width===1440&&path==='/'){
     await page.locator('.s-mazzo').scrollIntoViewIfNeeded();
     await page.waitForTimeout(200);
     console.log('SNAP_DECK_DESKTOP='+(await page.screenshot({type:'jpeg',quality:55})).toString('base64'));
   }
   console.log('CASE',JSON.stringify({path,width,height,flags,swipe,metrics,errors}));
   problems.push(...flags.map(flag=>({path,width,flag})));
   await page.close();
 }
 await browser.close();
 console.log('AUDIT_SUMMARY',JSON.stringify({cases:cases.length,problems}));
 if(problems.length)process.exitCode=1;
})().catch(e=>{console.log('AUDIT_FATAL',e.stack||e);process.exitCode=1});

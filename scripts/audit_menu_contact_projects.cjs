const {chromium}=require('playwright');
const fs=require('fs');
(async()=>{
  const executable=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(fs.existsSync);
  const browser=await chromium.launch({headless:true,...(executable?{executablePath:executable}:{})});
  const cases=[[320,700,'/'],[390,844,'/'],[430,932,'/'],[390,844,'/contatti.html'],[390,844,'/lavori.html'],[390,844,'/en.html'],[390,844,'/pl.html'],[768,1024,'/'],[1440,900,'/lavori.html']];
  let issues=[];
  const box=e=>{if(!e)return null;const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};};
  for(const [width,height,path] of cases){
    const page=await browser.newPage({viewport:{width,height},isMobile:width<=430,hasTouch:width<=430,deviceScaleFactor:width<=430?2:1});
    page.on('pageerror',e=>console.log('PAGE_JS_ERROR',path,e.message.slice(0,180)));
    await page.goto('http://127.0.0.1:8765'+path,{waitUntil:'domcontentloaded',timeout:24000});
    await page.waitForTimeout(1100);
    const metrics=await page.evaluate(()=>{
      const r=e=>{if(!e)return null;const b=e.getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight}};
      const q=s=>document.querySelector(s);
      const badge=q('.s-badge'),mail=q('.s-badge .email-pill'),word=q('.s-rayder .gig'),wordbox=q('.s-rayder .vetrina-r'),person=q('.s-make .persona'),photo=q('.s-make .persona img');
      return {docW:document.documentElement.scrollWidth,viewport:innerWidth,
        badge:r(badge),canvas:r(q('.s-badge #c-badge')),mail:r(mail),badgesx:r(q('.s-badge .sx')),
        projects:r(q('.s-rayder')),word:r(word),wordbox:r(wordbox),wordNatural:word?.scrollHeight,wordClient:word?.clientHeight,
        person:r(person),photo:r(photo),photointrinsic:photo?[photo.naturalWidth,photo.naturalHeight]:null,
        navHref:[...document.querySelectorAll('.nav .barra .voce')].filter(x=>getComputedStyle(x).display!=='none').map(x=>({tag:x.tagName,txt:x.textContent.trim().slice(0,20)})),
        menuLogo:getComputedStyle(q('.menu .m-top .mark'))?.display || 'none'
      };
    });
    const flags=[];
    if(metrics.docW>width+2)flags.push('horizontal-overflow');
    if(width<=430 && metrics.menuLogo!=='none')flags.push('menu-logo-card-visible');
    if(width<=430&&metrics.mail&&metrics.badge&&
      (metrics.mail.right>metrics.badge.right+1||metrics.mail.x<metrics.badge.x-1))flags.push('email-card-outside-badge-section');
    if(width<=430&&metrics.word&&metrics.wordbox&&
      (metrics.wordbox.bottom-metrics.word.bottom<15))flags.push('project-wordmark-no-bottom-space');
    if(width<=430&&metrics.photo&&metrics.person&&
      (metrics.photo.x<metrics.person.x-1||metrics.photo.right>metrics.person.right+1))flags.push('portrait-outside-figure');
    let menu=null;
    if(width<=430){
      const open=page.locator('.nav .testa-top .menu-btn2');
      if(await open.count()){
        await open.click();
        await page.waitForTimeout(850);
        menu=await page.evaluate(()=>{
          const q=s=>document.querySelector(s);
          const b=e=>{if(!e)return null;const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};
          const links=[...document.querySelectorAll('.menu .m-soc > a.pill')];
          const menu=q('.menu');
          return{open:menu.classList.contains('aperto'),menu:b(menu),last:b(q('.menu .m-corpo ol li:last-child')),soc:b(q('.menu .m-soc')),piede:b(q('.menu .m-piede')),logoDisplay:getComputedStyle(q('.menu .m-top .mark')).display,
            social:links.map(e=>({text:e.textContent.trim(),rect:b(e),display:getComputedStyle(e).display})),
            languages:[...document.querySelectorAll('.menu .menu-lingue a')].map(e=>({text:e.textContent.trim(),rect:b(e)})),
            scrollHeight:menu.scrollHeight,clientHeight:menu.clientHeight,scrollTop:menu.scrollTop};
        });
        if(!menu.open)flags.push('menu-failed-to-open');
        if(menu.last&&menu.soc){
          const delta=menu.soc.y-menu.last.bottom;
          if(delta<8||delta>110)flags.push('menu-socials-not-under-last-section');
          const mid=(menu.soc.x+menu.soc.right)/2,menuMid=(menu.menu.x+menu.menu.right)/2;
          if(Math.abs(mid-menuMid)>12)flags.push('menu-socials-not-centered');
        }
        if(menu.social.some(x=>x.rect.h<44||x.rect.w<64))flags.push('social-touch-target-too-small');
        if(menu.languages.some(x=>x.rect.h<44))flags.push('language-target-too-small');
        if(menu.logoDisplay!=='none')flags.push('logo-visible-in-open-menu');
        if(width===390&&path==='/'){
          let shot=await page.screenshot({type:'jpeg',quality:52});
          console.log('SCREEN_MENU_BASE64='+shot.toString('base64'));
        }
      } else flags.push('menu-trigger-not-found');
    }
    if(width===390&&(path==='/contatti.html'||path==='/lavori.html'||path==='/')){
      await page.evaluate(()=>document.querySelector('.menu')?.classList.remove('aperto'));
      const sel=path==='/contatti.html'?'.s-badge':path==='/lavori.html'?'.s-rayder .gig':'.s-make .persona';
      await page.locator(sel).scrollIntoViewIfNeeded();
      await page.waitForTimeout(450);
      const snap=await page.screenshot({type:'jpeg',quality:54});
      console.log('SCREEN_'+path.replace(/\W/g,'_')+'_BASE64='+snap.toString('base64'));
    }
    issues.push(...flags.map(f=>({width,path,issue:f})));
    console.log('CASE_METRICS',JSON.stringify({width,height,path,flags,metrics,menu}));
    await page.close();
  }
  console.log('CHECK_SUMMARY',JSON.stringify({tested:cases.length,issues}));
  await browser.close();
  if(issues.length)process.exitCode=1;
})().catch(e=>{console.log('AUDIT_FATAL',e.stack||String(e));process.exitCode=1});

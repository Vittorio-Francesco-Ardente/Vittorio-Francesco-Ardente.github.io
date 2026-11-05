const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const executable = ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium']
    .find(x => fs.existsSync(x));
  const browser = await chromium.launch({headless:true, ...(executable?{executablePath:executable}:{})});
  const cases = [
    [320,700,'/'],[390,844,'/'],[390,844,'/lavori.html'],[390,844,'/esperienze.html'],
    [390,844,'/contatti.html'],[390,844,'/en.html'],[390,844,'/pl.html'],
    [768,1024,'/'],[768,1024,'/lavori.html'],[1024,768,'/'],
    [1440,900,'/lavori.html'],[1440,900,'/esperienze.html'],[1920,1080,'/']
  ];
  let problems = [];
  for (const [width,height,path] of cases){
    const page = await browser.newPage({viewport:{width,height},deviceScaleFactor:width<=414?2:1.5,isMobile:width<=414,hasTouch:width<=414});
    page.on('pageerror',e=>console.log('JS_ERROR',JSON.stringify({width,path,message:e.message.slice(0,200)})));
    await page.goto('http://127.0.0.1:8765'+path,{waitUntil:'domcontentloaded',timeout:25000});
    await page.waitForTimeout(800);
    await page.evaluate(()=>{window.scrollTo(0,350)});
    await page.waitForTimeout(450);
    const metrics=await page.evaluate(()=>{
      const box=s=>{let e=document.querySelector(s);if(!e)return null;let r=e.getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),scrollW:e.scrollWidth,clientW:e.clientWidth,scrollH:e.scrollHeight}};
      const nav=document.querySelector('.nav .barra');
      return {viewport:innerWidth,docW:document.documentElement.scrollWidth,
        nav:box('.nav .barra'),navLabels:[...(nav?.querySelectorAll('.voce span')||[])].filter(e=>getComputedStyle(e.parentElement).display!=='none').map(e=>({text:e.textContent.trim(),scrollW:e.scrollWidth,clientW:e.clientWidth})),navItems:[...(nav?.querySelectorAll('.voce')||[])].filter(e=>getComputedStyle(e).display!=='none').map(e=>({name:e.textContent.trim().slice(0,18),x:Math.round(e.getBoundingClientRect().x),right:Math.round(e.getBoundingClientRect().right)})),
        footer:box('.s-sent'),footerFondo:box('.s-sent .fondo'),
        homeCards:[...document.querySelectorAll('.s-forma .basso > *')].map(e=>({top:Math.round(e.getBoundingClientRect().top),bottom:Math.round(e.getBoundingClientRect().bottom)})),
        hero:box('.s-agency .hero'),wave:box('.s-agency .hero canvas.onda-bg'),
        waveScale:(()=>{let e=document.querySelector('.s-agency .onda-bg');return e?+(e.width/Math.max(1,e.clientWidth)).toFixed(2):null})(),
        big:box('.s-rayder .gig'),experience:box('.s-lun'),
        glassPresent:!!document.querySelector('.s-lun .vetro-bg'),
        posterPresent:!!document.querySelector('.s-lun .poster-bg'),
        dataVetro:document.querySelector('.s-lun')?.hasAttribute('data-vetro')||false,
        assetCss:[...document.styleSheets].some(s=>s.href?.includes('vfa-responsive-20261105'))
      };
    });
    const flags=[];
    if(metrics.docW>metrics.viewport+3)flags.push('horizontal-overflow');
    if(width<=414&&metrics.navLabels.some(x=>x.scrollW>x.clientW+1))flags.push('navbar-label-clipped');
    if(width<=414 && metrics.nav && metrics.navItems.some(x=>x.x<metrics.nav.x-2||x.right>metrics.nav.x+metrics.nav.w+2))flags.push('navbar-item-overflow');
    if(metrics.big && metrics.big.scrollW>metrics.big.clientW+4)flags.push('projects-wordmark-clipped');
    if(metrics.hero&&metrics.wave&&Math.abs(metrics.hero.h-metrics.wave.h)>8)flags.push('works-wave-height-mismatch');
    if(path.includes('esperienze') && (!metrics.glassPresent||!metrics.dataVetro||metrics.posterPresent))flags.push('experience-animation-missing');
    if(!metrics.assetCss)flags.push('fix-css-missing');
    problems.push(...flags.map(flag=>({width,path,flag})));
    console.log('REPORT',JSON.stringify({width,height,path,flags,metrics}));
    if(width===390&&['/','/lavori.html','/esperienze.html'].includes(path)){
      await page.evaluate(()=>window.scrollTo(0,0));
      await page.waitForTimeout(300);
      const img=await page.screenshot({type:'jpeg',quality:48,fullPage:false});
      console.log('SCREENSHOT_'+path.replace(/\W+/g,'_')+'_BASE64='+img.toString('base64'));
      if(path==='/lavori.html'){
        await page.locator('.s-sent .fondo').scrollIntoViewIfNeeded();
        const img2=await page.screenshot({type:'jpeg',quality:48,fullPage:false});
        console.log('SCREENSHOT_FOOTER_BASE64='+img2.toString('base64'));
      }
    }
    await page.close();
  }
  console.log('AUDIT_SUMMARY',JSON.stringify({checked:cases.length,problems}));
  await browser.close();
  if(problems.length)process.exitCode=1;
})().catch(e=>{console.error('AUDIT_FATAL',e.stack||e);process.exitCode=1});

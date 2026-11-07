/* VFA temporary mascot intro. Flip ENABLED to false to disable globally. */
(()=>{
  'use strict';
  const ENABLED = true;
  const START = 2.8;
  const END = 5.35;
  const SOURCE = 'https://d2ol7oe51mr4n9.cloudfront.net/user_3Jt3GJIxYJqXGi5eA3Rf2w5dhct/467142db-d952-4dcf-94f0-431516286edb.mp4';
  const KEY = 'vfa-mascot-intro-20261107-seen';
  const params = new URLSearchParams(window.location.search);
  const force = params.get('loader') === 'preview';
  if(!ENABLED || params.get('loader') === 'off') return;
  if(!force && (window.matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.connection?.saveData)) return;
  try{if(!force && sessionStorage.getItem(KEY)) return;}catch(_e){}
  function init(){
    if(document.body.dataset.pagina !== 'home') return;
    let closed=false, playing=false;
    const frame=document.createElement('div');
    frame.className='vfa-mascot-intro';
    frame.setAttribute('role','dialog');
    frame.setAttribute('aria-modal','true');
    frame.setAttribute('aria-label','Animazione di benvenuto VFA');
    const stage=document.createElement('div');stage.className='vfa-mascot-intro__stage';
    const video=document.createElement('video');video.className='vfa-mascot-intro__video';
    video.muted=true;video.defaultMuted=true;video.playsInline=true;
    video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','');
    video.setAttribute('preload','auto');video.setAttribute('aria-hidden','true');
    video.disablePictureInPicture=true;
    const skip=document.createElement('button');skip.type='button';skip.className='vfa-mascot-intro__skip';
    const lang=(document.documentElement.lang||'it').slice(0,2);
    skip.textContent=lang==='pl'?'Pomiń':lang==='en'?'Skip':'Salta';
    skip.setAttribute('aria-label',lang==='pl'?'Pomiń animację':lang==='en'?'Skip introduction':'Salta introduzione');
    stage.appendChild(video);frame.appendChild(stage);frame.appendChild(skip);
    const timeout=window.setTimeout(finish,4100);
    function finish(){
      if(closed)return;closed=true;
      window.clearTimeout(timeout);
      try{sessionStorage.setItem(KEY,'1');}catch(_e){}
      frame.classList.add('vfa-mascot-intro--closing');
      window.setTimeout(()=>{video.pause();video.removeAttribute('src');video.load();frame.remove();},290);
      document.removeEventListener('keydown',onKey);
    }
    function onKey(e){if(e.key==='Escape')finish();}
    skip.addEventListener('click',finish);
    document.addEventListener('keydown',onKey);
    video.addEventListener('error',finish);
    video.addEventListener('ended',finish);
    video.addEventListener('timeupdate',()=>{if(video.currentTime>=END)finish();});
    video.addEventListener('loadedmetadata',()=>{
      if(video.duration<=START+.25){finish();return;}
      try{video.currentTime=START;}catch(_e){finish();}
    },{once:true});
    video.addEventListener('seeked',()=>{
      if(playing||closed)return;playing=true;
      video.play().catch(finish);
    },{once:true});
    document.body.appendChild(frame);
    video.src=SOURCE;
    video.load();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
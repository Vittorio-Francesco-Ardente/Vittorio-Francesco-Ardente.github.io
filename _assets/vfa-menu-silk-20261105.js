/* VFA Silk shader: framework-free adaptation of the supplied 21st.dev WebGL background.
   Keeps the existing static site; no React, Tailwind or additional dependencies. */
(() => {
  const menu = document.getElementById('menu');
  if (!menu || menu.querySelector('.vfa-silk')) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'vfa-silk';
  canvas.setAttribute('aria-hidden', 'true');
  menu.prepend(canvas);
  const gl = canvas.getContext('webgl', {alpha:false,antialias:false,powerPreference:'low-power'});
  if (!gl) { canvas.hidden = true; return; }
  const vertex = `attribute vec2 a_position; void main(){gl_Position=vec4(a_position,0.,1.);}`;
  const fragment = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec3 u_colors[8];
uniform vec4 u_scene;
uniform vec4 u_shape;
uniform vec4 u_surface;
uniform vec4 u_finish;
uniform vec4 u_transform;
uniform vec4 u_space;
uniform vec4 u_cursor;
#define u_resolution u_scene.xy
#define u_time u_scene.z
#define u_colorCount u_scene.w
#define u_scale u_shape.x
#define u_intensity u_shape.y
#define u_detail u_surface.x
#define u_contrast u_surface.y
#define u_brightness u_surface.z
#define u_saturation u_surface.w
#define u_vignette u_finish.y
#define u_blur u_finish.z
#define u_grain u_finish.w
#define u_seed u_transform.x
#define u_mouse u_space.zw
#define u_cursorPresence u_cursor.x
#define u_cursorEffect u_cursor.y
#define u_cursorStrength u_cursor.z
#define u_cursorRadius u_cursor.w
float hash21(vec2 p){
#ifndef GL_FRAGMENT_PRECISION_HIGH
p=mod(p,31.);
#endif
p=fract(p*vec2(234.34,435.345));p+=dot(p,p+34.23);return fract(p.x*p.y);
}
float grainHash(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(hash21(i),hash21(i+vec2(1.,0.)),u.x),mix(hash21(i+vec2(0.,1.)),hash21(i+vec2(1.,1.)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+vec2(17.,9.2);a*=.5;}return v;}
vec3 palette(float x){float n=max(u_colorCount-1.,1.);float f=clamp(x,0.,1.)*n;vec3 col=u_colors[0];for(int i=0;i<7;i++){if(float(i)<n)col=mix(col,u_colors[i+1],smoothstep(0.,1.,clamp(f-float(i),0.,1.)));}return col;}
vec3 shade(vec2 uv,vec2 p,float t){vec2 q=p*1.6;float amp=.25+u_intensity*.85;for(float i=1.;i<5.;i+=1.){q.x+=amp/i*cos(i*2.4*q.y+t*.8+u_seed);q.y+=amp/i*cos(i*1.7*q.x+t*.6);}return palette(.5+.5*sin(q.x+q.y));}
void main(){
vec2 uv=gl_FragCoord.xy/u_resolution.xy;vec2 screenUv=uv;
vec2 p=(gl_FragCoord.xy-.5*u_resolution.xy)/min(u_resolution.x,u_resolution.y);
float cursorMask=0.;
if(u_cursorPresence>.001){
vec2 cursor=(.5*u_mouse*u_resolution.xy)/min(u_resolution.x,u_resolution.y);
vec2 delta=p-cursor;
float dist=length(delta);
vec2 direction=delta/max(dist,.0001);
cursorMask=u_cursorPresence*(1.-smoothstep(0.,u_cursorRadius,dist));
if(u_cursorEffect<.5)p+=cursor*u_cursorPresence*u_cursorStrength*.55;
else if(u_cursorEffect<1.5)p-=direction*cursorMask*u_cursorStrength*.24;
else if(u_cursorEffect<2.5){float a=cursorMask*u_cursorStrength*2.2;float c=cos(a),s=sin(a);p=cursor+mat2(c,-s,s,c)*delta;}
else {float ripple=sin(dist/max(u_cursorRadius,.001)*18.-u_time*5.);p-=direction*ripple*cursorMask*u_cursorStrength*.07;}
}
uv=p*min(u_resolution.x,u_resolution.y)/u_resolution.xy+.5;
p*=u_scale;
vec3 col;
if(u_blur>0.){float e=u_blur,pe=e*u_scale;vec2 uvE=vec2(e)*min(u_resolution.x,u_resolution.y)/u_resolution.xy;col=shade(uv,p,u_time)*.36;col+=shade(uv+vec2(uvE.x,0.),p+vec2(pe,0.),u_time)*.16;col+=shade(uv-vec2(uvE.x,0.),p-vec2(pe,0.),u_time)*.16;col+=shade(uv+vec2(0.,uvE.y),p+vec2(0.,pe),u_time)*.16;col+=shade(uv-vec2(0.,uvE.y),p-vec2(0.,pe),u_time)*.16;}else col=shade(uv,p,u_time);
col=(col-.5)*u_contrast+.5;
float luma=dot(col,vec3(.299,.587,.114));col=mix(vec3(luma),col,u_saturation);
col+=u_brightness;
float vd=length(screenUv-.5)*1.41421356;col*=1.-u_vignette*smoothstep(.35,1.,vd);
col+=(grainHash(gl_FragCoord.xy+vec2(u_seed*17.,u_seed*31.))-.5)*u_grain;
gl_FragColor=vec4(clamp(col,0.,1.),1.);
}`;
  function shader(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s,source); gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) {console.warn('VFA Silk shader:',gl.getShaderInfoLog(s));gl.deleteShader(s);return null;}
    return s;
  }
  const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);
  if(!vs||!fs){canvas.hidden=true;return;}
  const program=gl.createProgram();
  gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  gl.deleteShader(vs);gl.deleteShader(fs);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)){canvas.hidden=true;gl.deleteProgram(program);return;}
  gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(program,'a_position');
  gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  const uni=Object.fromEntries(['colors','scene','shape','surface','finish','transform','space','cursor'].map(k=>[k,gl.getUniformLocation(program,'u_'+k)]));
  const paletteByTheme={
    base:['#11092b','#211056','#401097','#1d0e4b'],
    inverno:['#06152e','#143c78','#3873b4','#112a53'],
    primavera:['#102d2a','#236c63','#5b9a7c','#153d42'],
    estate:['#123657','#146d9d','#27a5b3','#183f70'],
    autunno:['#2d1421','#713041','#ad633b','#482237'],
    natale:['#0c2827','#155444','#286e5b','#182f3d'],
    capodanno:['#101326','#29234d','#5a4485','#202341'],
    pasqua:['#30214c','#7257a4','#aa7eb9','#45366b'],
    halloween:['#1d0b2d','#4d1765','#7c3090','#30123f']
  };
  function toRgb(hex){const v=hex.replace('#','');return [0,2,4].map(i=>parseInt(v.slice(i,i+2),16)/255);}
  let theme='',raf=0,active=false,last=0,elapsed=0;
  let mx=0,my=0,tx=0,ty=0,presence=0,targetPresence=0;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const motionAllowed=()=>!reduce.matches&&!document.documentElement.classList.contains('fermo');
  const updatePalette=()=>{
    const next=document.documentElement.dataset.tema||'base';
    if(next===theme)return;
    theme=next;
    const colors=paletteByTheme[next]||paletteByTheme.base;
    const padded=Array.from({length:8},(_,i)=>toRgb(colors[Math.min(i,colors.length-1)]));
    gl.uniform3fv(uni.colors,new Float32Array(padded.flat()));
  };
  function resize(){
    const bounds=menu.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5);
    const scale=Math.min(1,Math.sqrt(1200000/Math.max(1,bounds.width*bounds.height*dpr*dpr)));
    const w=Math.max(1,Math.round(bounds.width*dpr*scale)),h=Math.max(1,Math.round(bounds.height*dpr*scale));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
  }
  function draw(now){
    raf=0;
    if(!active||document.hidden)return;
    const dt=last?Math.min((now-last)/1000,.1):0;last=now;
    if(motionAllowed())elapsed+=dt*.29;
    mx+=(tx-mx)*Math.min(1,dt*12);my+=(ty-my)*Math.min(1,dt*12);
    presence+=(targetPresence-presence)*Math.min(1,dt*12);
    resize();updatePalette();
    gl.uniform4f(uni.scene,canvas.width,canvas.height,elapsed,4);
    gl.uniform4f(uni.shape,1.26,.28,.5,0);
    gl.uniform4f(uni.surface,2.4,1.113,0,1);
    gl.uniform4f(uni.finish,0,.08,.008,.049);
    gl.uniform4f(uni.transform,1581,0,0,0);
    gl.uniform4f(uni.space,0,0,mx,my);
    gl.uniform4f(uni.cursor,presence,2,.2,.392);
    gl.drawArrays(gl.TRIANGLES,0,3);
    if(motionAllowed()||Math.abs(presence-targetPresence)>.002||Math.abs(mx-tx)>.002)raf=requestAnimationFrame(draw);
  }
  function request(){if(active&&!raf&&!document.hidden){last=0;raf=requestAnimationFrame(draw);}}
  function onPointer(e){
    const b=menu.getBoundingClientRect();
    tx=((e.clientX-b.left)/b.width)*2-1;ty=1-((e.clientY-b.top)/b.height)*2;
    targetPresence=1;request();
  }
  menu.addEventListener('pointermove',onPointer,{passive:true});
  menu.addEventListener('pointerleave',()=>{targetPresence=0;request();},{passive:true});
  const observer=new MutationObserver(()=>{
    const was=active;active=menu.classList.contains('aperto');
    if(active&&!was){updatePalette();request();}
    if(!active){cancelAnimationFrame(raf);raf=0;last=0;targetPresence=0;}
  });
  observer.observe(menu,{attributes:true,attributeFilter:['class']});
  new MutationObserver(()=>{theme='';request();}).observe(document.documentElement,{attributes:true,attributeFilter:['data-tema']});
  addEventListener('resize',request,{passive:true});
  document.addEventListener('visibilitychange',request);
  if(reduce.addEventListener)reduce.addEventListener('change',request);
  active=menu.classList.contains('aperto');if(active)request();
})();

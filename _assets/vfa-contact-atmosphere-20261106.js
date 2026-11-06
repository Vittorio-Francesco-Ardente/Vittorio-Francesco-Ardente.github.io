/* VFA / animated sapphire-silk background.
   Renders one seamless moving blue fabric across the complete contact panel.
   No transparent overlays, extra cards or glass behind the original badge. */
(()=>{
 'use strict';
 const scene=document.querySelector('body[data-pagina="contatti"] .vfa-location-panel.vfa-concept-scene');
 if(!scene)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const canvas=document.createElement('canvas');
 canvas.className='vfa-contact-gradflow';
 canvas.setAttribute('aria-hidden','true');
 scene.prepend(canvas);
 const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'low-power'});
 if(!gl){canvas.remove();return}
 const vertex=`attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
 const fragment=`precision mediump float;
 varying vec2 uv;
 uniform float t;
 uniform vec2 resolution;
 float soft(float v,float edge){return smoothstep(-edge,edge,v);}
 void main(){
  vec2 p=(uv-.5)*vec2(resolution.x/max(resolution.y,1.),1.);
  float x=p.x,y=p.y;
  float warp=.48*sin(x*2.7-y*2.2-t*.27)+.25*sin(y*4.0+x*1.6+t*.17);
  float longFold=sin(y*7.0-x*4.2+warp*1.7+t*.18);
  float crossFold=sin(y*4.1+x*7.4+.65*sin(x*2.9+t*.23)-t*.13);
  float lowWave=sin(y*2.1-x*2.9+t*.15);
  float fabric=.52+.22*longFold+.14*crossFold+.12*lowWave;
  float light=soft(fabric-.46,.48);
  vec3 deep=vec3(.025,.115,.37);
  vec3 cobalt=vec3(.075,.265,.66);
  vec3 blue=vec3(.32,.58,.91);
  vec3 pearl=vec3(.87,.95,1.);
  vec3 color=mix(deep,cobalt,smoothstep(.12,.62,light));
  color=mix(color,blue,smoothstep(.55,.96,light)*.87);
  float line=pow(max(0.,sin(y*7.0-x*4.2+warp*1.7+t*.18)),27.);
  float line2=pow(max(0.,sin(y*4.1+x*7.4+.65*sin(x*2.9+t*.23)-t*.13)),42.);
  float glint=clamp(line*.6+line2*.27,0.,1.)*smoothstep(.28,.81,light);
  color=mix(color,pearl,glint*.85);
  float edgeVignette=smoothstep(1.4,.12,length(p*.76));
  color*=mix(.84,1.,edgeVignette);
  gl_FragColor=vec4(clamp(color,0.,1.),1.);
 }`;
 function shader(type,source){
  const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);return null}
  return s;
 }
 const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);
 if(!vs||!fs){canvas.remove();return}
 const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);
 gl.bindAttribLocation(program,0,'p');gl.linkProgram(program);
 gl.deleteShader(vs);gl.deleteShader(fs);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS)){canvas.remove();return}
 gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
 gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
 const uTime=gl.getUniformLocation(program,'t');
 const uSize=gl.getUniformLocation(program,'resolution');
 let visible=true,active=0,prev=0,clock=0,lost=false;
 function draw(now){
  if(lost||!visible||document.hidden)return;
  const w=canvas.clientWidth,h=canvas.clientHeight;
  if(w<2||h<2)return;
  const scale=Math.min(devicePixelRatio||1,1.6,Math.sqrt(2000000/(w*h)));
  const px=Math.max(1,Math.round(w*scale)),py=Math.max(1,Math.round(h*scale));
  if(canvas.width!==px||canvas.height!==py){canvas.width=px;canvas.height=py;gl.viewport(0,0,px,py)}
  if(prev&&!reduced.matches)clock+=Math.min((now-prev)/1000,.1);
  prev=now;
  gl.uniform1f(uTime,clock);
  gl.uniform2f(uSize,w,h);
  gl.drawArrays(gl.TRIANGLES,0,3);
  if(!reduced.matches)active=requestAnimationFrame(draw);
 }
 function restart(){
  cancelAnimationFrame(active);
  prev=0;
  if(visible&&!document.hidden&&!lost)active=requestAnimationFrame(draw);
 }
 const io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;restart()},{rootMargin:'5%'});
 io.observe(scene);
 document.addEventListener('visibilitychange',restart);
 reduced.addEventListener?.('change',restart);
 canvas.addEventListener('webglcontextlost',event=>{
  event.preventDefault();lost=true;cancelAnimationFrame(active);canvas.remove();
 },{once:true});
 restart();
})();

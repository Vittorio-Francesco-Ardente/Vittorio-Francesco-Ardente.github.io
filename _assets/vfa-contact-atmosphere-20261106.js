/* Native WebGL adapter of GradFlow's original stripe shader
 * (source: meerbahadin/gradflow, MIT); React source is kept under
 * /components/ui/stripe-like-gradient-shader.tsx.
 * Exact supplied RGBs white/cyan/purple, speed=.4, scale=1, noise=.08.
 * Rendered across the full Contact section so the backdrop and card share the same palette. */
(() => {
 const section=document.querySelector('body[data-pagina="contatti"] .vfa-location-panel.vfa-concept-scene');
 if(!section)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const canvas=document.createElement('canvas');
 canvas.className='vfa-contact-gradflow';
 canvas.setAttribute('aria-hidden','true');
 section.prepend(canvas);
 const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'low-power'});
 if(!gl){canvas.remove();return}
 const vertex='attribute vec2 position;varying vec2 vUv;void main(){vUv=position*.5+.5;gl_Position=vec4(position,0.,1.);}';
 const fragment=`precision mediump float;
 varying vec2 vUv;
 uniform float u_time,u_scale,u_noise;
 uniform vec2 u_resolution;
 uniform vec3 u_color1,u_color2,u_color3;
 float noise(vec2 st){return fract(sin(dot(st,vec2(12.9898,78.233)))*43758.5453);}
 vec3 stripeGradient(vec2 uv,float time){
  vec2 p=((uv*u_resolution*2.-u_resolution.xy)/(u_resolution.x+u_resolution.y)*2.)*u_scale;
  float t=time*.7,a=4.*p.y-sin(-p.x*3.+p.y-t);
  a=smoothstep(cos(a)*.7,sin(a)*.7+1.,cos(a-4.*p.y)-sin(a+3.*p.x));
  vec2 warped=(cos(a)*p+sin(a)*vec2(-p.y,p.x))*.5+.5;
  vec3 color=mix(u_color1,u_color2,warped.x);
  color=mix(color,u_color3,warped.y);
  color*=color+.6*sqrt(color);
  return clamp(color,0.,1.);
 }
 void main(){
  vec3 color=stripeGradient(vUv,u_time);
  if(u_noise>.001){
   float grain=noise(vUv*200.+u_time*.1);
   color*=(1.-u_noise*.4+u_noise*grain*.4);
  }
  gl_FragColor=vec4(color,1.);
 }`;
 function shader(type,source){
  const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);return null}
  return s;
 }
 const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);
 if(!vs||!fs){canvas.remove();return}
 const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);
 gl.bindAttribLocation(program,0,'position');gl.linkProgram(program);
 gl.deleteShader(vs);gl.deleteShader(fs);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS)){canvas.remove();return}
 gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
 gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
 const loc=k=>gl.getUniformLocation(program,k);
 const time=loc('u_time'),size=loc('u_resolution');
 gl.uniform1f(loc('u_scale'),1);gl.uniform1f(loc('u_noise'),.08);
 gl.uniform3fv(loc('u_color1'),new Float32Array([.05,.16,.47]));
 gl.uniform3fv(loc('u_color2'),new Float32Array([.18,.44,.98]));
 gl.uniform3fv(loc('u_color3'),new Float32Array([.77,.87,1]));
 let visible=true,raf=0,previous=0,clock=0,stopped=false;
 function draw(now){
  if(stopped||!visible||document.hidden)return;
  const ratio=Math.min(devicePixelRatio||1,innerWidth<761?1:1.3);
  const w=Math.max(1,Math.round(canvas.clientWidth*ratio)),h=Math.max(1,Math.round(canvas.clientHeight*ratio));
  if(w!==canvas.width||h!==canvas.height){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}
  if(previous&&!reduced.matches)clock+=Math.min((now-previous)/1000,.09)*.4;
  previous=now;
  gl.uniform1f(time,clock);
  gl.uniform2f(size,canvas.clientWidth,canvas.clientHeight);
  gl.drawArrays(gl.TRIANGLES,0,3);
  if(!reduced.matches)raf=requestAnimationFrame(draw);
 }
 function restart(){cancelAnimationFrame(raf);previous=0;if(visible&&!document.hidden)raf=requestAnimationFrame(draw)}
 const io=new IntersectionObserver(es=>{visible=es[0].isIntersecting;restart()},{rootMargin:'6%'});
 io.observe(section);
 document.addEventListener('visibilitychange',restart);
 reduced.addEventListener?.('change',restart);
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();stopped=true;cancelAnimationFrame(raf);canvas.remove()},{once:true});
 restart();
})();
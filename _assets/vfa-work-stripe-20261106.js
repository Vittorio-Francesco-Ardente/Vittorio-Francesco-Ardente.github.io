/* Portfolio / Lavori: original stripe-like WebGL gradient in VFA blues.
   Native companion to components/ui/stripe-like-gradient-shader.tsx: no framework required. */
(()=>{
 const heroes=document.querySelectorAll('body[data-pagina="lavori"] .s-agency .hero');
 if(!heroes.length)return;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 for(const hero of heroes){
  const canvas=document.createElement('canvas');
  canvas.className='vfa-work-stripe';
  canvas.setAttribute('aria-hidden','true');
  hero.prepend(canvas);
  const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'low-power'});
  if(!gl){canvas.remove();continue}
  const vert='attribute vec2 p; void main(){gl_Position=vec4(p,0.0,1.0);}';
  const frag=`precision mediump float;
  uniform vec2 uRes;
  uniform float uTime;
  uniform vec3 uDark, uMain, uLight;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
  void main(){
    vec2 uv=gl_FragCoord.xy/uRes;
    float ratio=uRes.x/uRes.y;
    float t=uTime*0.4;
    float bend=.065*sin(uv.x*ratio*3.7+t)+.032*sin(uv.x*ratio*8.2-t*.67);
    float diagonal=uv.y+uv.x*.31+bend;
    float stripe=.5+.5*sin(diagonal*18.0+sin(uv.x*ratio*2.3+t*.35)*.9);
    float silk=smoothstep(.18,.85,stripe);
    float sweep=smoothstep(-.35,1.2,uv.x*.58+uv.y*.66);
    vec3 col=mix(uDark,uMain,.25+.45*sweep);
    col=mix(col,uLight,silk*(.13+.12*sweep));
    col+=uLight*.07*sin(diagonal*6.0-t*.45);
    float vignette=pow(length((uv-.5)*vec2(1.05,.8)),1.8);
    col*=1.0-.30*vignette;
    float grain=hash(gl_FragCoord.xy+floor(uTime*4.0))-.5;
    col+=grain*.028;
    gl_FragColor=vec4(clamp(col,0.0,1.0),1.0);
  }`;
  const shader=(type,source)=>{const x=gl.createShader(type);gl.shaderSource(x,source);gl.compileShader(x);return gl.getShaderParameter(x,gl.COMPILE_STATUS)?x:null};
  const vs=shader(gl.VERTEX_SHADER,vert),fs=shader(gl.FRAGMENT_SHADER,frag);
  if(!vs||!fs){canvas.remove();continue}
  const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)){canvas.remove();continue}
  gl.useProgram(program);
  const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const a=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
  const uni=n=>gl.getUniformLocation(program,n);
  const res=uni('uRes'),time=uni('uTime');
  const palette=[[7,23,63],[11,42,140],[67,119,224]];
  ['uDark','uMain','uLight'].forEach((key,i)=>gl.uniform3fv(uni(key),palette[i].map(v=>v/255)));
  let visible=true,raf=0,start=performance.now(),disposed=false;
  function render(now){
   if(disposed||!visible)return;
   const ratio=Math.min(devicePixelRatio||1,innerWidth<760?1.25:1.55);
   const width=Math.max(1,Math.round(canvas.clientWidth*ratio));
   const height=Math.max(1,Math.round(canvas.clientHeight*ratio));
   if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height)}
   gl.uniform2f(res,width,height);gl.uniform1f(time,reduced?0:(now-start)/1000);
   gl.drawArrays(gl.TRIANGLES,0,6);
   if(!reduced)raf=requestAnimationFrame(render);
  }
  const obs=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;cancelAnimationFrame(raf);if(visible)raf=requestAnimationFrame(render)},{rootMargin:'15%'});
  obs.observe(hero);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();disposed=true;cancelAnimationFrame(raf);canvas.remove()},{once:true});
 }
})();
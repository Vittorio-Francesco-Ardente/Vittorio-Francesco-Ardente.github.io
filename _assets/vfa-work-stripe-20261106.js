/* VFA Lavori background. Implements the actual GradFlow "stripe" shader,
   not an approximation: https://github.com/meerbahadin/gradflow (MIT).
   Original stripe math by Meer Bahadin; static-site WebGL adapter for VFA.
   Config: color1 #FFFFFF, color2 #0B2A8C, color3 #82BDFF,
           speed .4, scale 1, type 'stripe', noise .08. */
(()=>{
  const heroes=document.querySelectorAll('body[data-pagina="lavori"] .s-agency .hero[data-vfa-stripe]');
  if(!heroes.length) return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const vertex=`
    attribute vec2 position;
    varying vec2 vUv;
    void main(){
      vUv=position*0.5+0.5;
      gl_Position=vec4(position,0.0,1.0);
    }
  `;
  const fragment=`
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif
    varying vec2 vUv;
    uniform float u_time;
    uniform vec3 u_color1,u_color2,u_color3;
    uniform float u_scale,u_noise;
    uniform vec2 u_resolution;

    float noise(vec2 st) {
      return fract(sin(dot(st,vec2(12.9898,78.233))) * 43758.5453);
    }

    /* GradFlow stripeGradient, preserved in original form (MIT). */
    vec3 stripeGradient(vec2 uv, float time) {
      vec2 p = ((uv * u_resolution * 2.0 - u_resolution.xy) / (u_resolution.x + u_resolution.y) * 2.0) * u_scale;
      float t = time * 0.7, a = 4.0 * p.y - sin(-p.x * 3.0 + p.y - t);
      a = smoothstep(cos(a) * 0.7, sin(a) * 0.7 + 1.0, cos(a - 4.0 * p.y) - sin(a + 3.0 * p.x));
      vec2 warped = (cos(a) * p + sin(a) * vec2(-p.y, p.x)) * 0.5 + 0.5;
      vec3 color = mix(u_color1, u_color2, warped.x);
      color = mix(color, u_color3, warped.y);
      color *= color + 0.6 * sqrt(color);
      return clamp(color, 0.0, 1.0);
    }

    void main() {
      vec3 color = stripeGradient(vUv, u_time);
      if (u_noise > 0.001) {
        float grain = noise(vUv * 200.0 + u_time * 0.1);
        color *= (1.0 - u_noise * 0.4 + u_noise * grain * 0.4);
      }
      gl_FragColor=vec4(color,1.0);
    }
  `;
  for(const hero of heroes){
    const canvas=document.createElement('canvas');
    canvas.className='vfa-work-stripe';
    canvas.setAttribute('aria-hidden','true');
    hero.prepend(canvas);
    const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'low-power'});
    if(!gl){canvas.remove();continue}
    const compile=(type,source)=>{
      const shader=gl.createShader(type);
      gl.shaderSource(shader,source);
      gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
        console.warn('VFA stripe shader:',gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };
    const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);
    if(!vs||!fs){canvas.remove();continue}
    const program=gl.createProgram();
    gl.attachShader(program,vs);
    gl.attachShader(program,fs);
    gl.bindAttribLocation(program,0,'position');
    gl.linkProgram(program);
    gl.deleteShader(vs);gl.deleteShader(fs);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)){
      console.warn('VFA stripe link:',gl.getProgramInfoLog(program));
      canvas.remove();continue;
    }
    gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
    const loc=k=>gl.getUniformLocation(program,k);
    const locTime=loc('u_time'),locRes=loc('u_resolution');
    gl.uniform3fv(loc('u_color1'),new Float32Array([1,1,1]));
    gl.uniform3fv(loc('u_color2'),new Float32Array([11/255,42/255,140/255]));
    gl.uniform3fv(loc('u_color3'),new Float32Array([130/255,189/255,255/255]));
    gl.uniform1f(loc('u_scale'),1);
    gl.uniform1f(loc('u_noise'),.08);
    let inView=true,raf=0,last=0,clock=0,disposed=false;
    function draw(now){
      if(disposed||!inView||document.hidden)return;
      const cssW=Math.max(canvas.clientWidth,1),cssH=Math.max(canvas.clientHeight,1);
      const dpr=Math.min(devicePixelRatio||1,innerWidth<761?1.35:1.7);
      const w=Math.max(1,Math.round(cssW*dpr)),h=Math.max(1,Math.round(cssH*dpr));
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}
      if(last && !reduced.matches)clock+=Math.min((now-last)/1000,.1)*.4;
      last=now;
      gl.uniform1f(locTime,clock);
      gl.uniform2f(locRes,cssW,cssH);
      gl.drawArrays(gl.TRIANGLES,0,3);
      if(!reduced.matches)raf=requestAnimationFrame(draw);
    }
    function restart(){cancelAnimationFrame(raf);last=0;if(inView&&!document.hidden)raf=requestAnimationFrame(draw)}
    const io=new IntersectionObserver(es=>{inView=es[0].isIntersecting;restart()},{rootMargin:'10%'});
    io.observe(hero);
    const ro=new ResizeObserver(()=>{if(reduced.matches)restart()});
    ro.observe(hero);
    document.addEventListener('visibilitychange',restart);
    if(reduced.addEventListener)reduced.addEventListener('change',restart);
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();disposed=true;cancelAnimationFrame(raf);canvas.remove()},{once:true});
    restart();
  }
})();

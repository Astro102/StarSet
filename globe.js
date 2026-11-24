/* StarSet planet globe — WebGL sphere renderer shared by the home page (the Planets page keeps its own copy).
   Needs textures.js (StarTex) for generated maps. */
class GLGlobe{
  static create(cv,o){ try{ const gl=cv.getContext('webgl',{premultipliedAlpha:true,alpha:true,antialias:false,preserveDrawingBuffer:false}); return gl? new GLGlobe(cv,gl,o) : null; }catch(e){ return null; } }
  constructor(cv,gl,o){ this.cv=cv; this.gl=gl; Object.assign(this,{tilt:0,light:[-.62,.36,.7],ambient:.04,atmo:null,ringR:null,ringOpen:24,emissive:false,ext:null},o); this.rot=0; this.cloudRot=0;
    // if the GPU resets, rebuild everything and redraw instead of leaving an empty square
    cv.addEventListener('webglcontextlost',e=>{ e.preventDefault(); this.ready=false; });
    cv.addEventListener('webglcontextrestored',()=>{ try{ this.tx=[null,null,null,null]; this.init(); if(this._T) this.setTex(this._T,this._ring); this.dirty=true; this.draw(); }catch(e){} });
    this.init(); }
  init(){ const gl=this.gl;
    const sh=(t,src)=>{ const s=gl.createShader(t); gl.shaderSource(s,src); gl.compileShader(s); if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const p=this.prog=gl.createProgram(); gl.attachShader(p,sh(gl.VERTEX_SHADER,GLGlobe.VS)); gl.attachShader(p,sh(gl.FRAGMENT_SHADER,GLGlobe.FS)); gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); gl.useProgram(p);
    const b=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,b); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(p,'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    this.u={}; for(const n of ['uMap','uClouds','uNight','uRing','uHasClouds','uHasNight','uHasRing','uEm','uRot','uCRot','uM','uAxis','uAmb','uExt','uS','uLight','uAtmo','uRingR']) this.u[n]=gl.getUniformLocation(p,n);
    gl.uniform1i(this.u.uMap,0); gl.uniform1i(this.u.uClouds,1); gl.uniform1i(this.u.uNight,2); gl.uniform1i(this.u.uRing,3);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,gl.NONE); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
    this.tx=this.tx||[null,null,null,null]; }
  /* planet maps wrap round in longitude: resample to power-of-two sizes so the texture can REPEAT (no seam where 360° meets 0°) */
  /* resampled once per texture on CPU-backed canvases (an accelerated canvas would force a GPU read-back on upload) */
  static pot(img){ const W=img.width, H=img.height, p2=n=>2**Math.round(Math.log2(n)); const w=Math.min(4096,p2(W)), h=Math.min(2048,p2(H));
    if(w===W&&h===H) return img; const hit=GLGlobe.cache.get(img); if(hit) return hit;
    const a=document.createElement('canvas'); a.width=W; a.height=H; a.getContext('2d',{willReadFrequently:true}).putImageData(img,0,0);
    const b=document.createElement('canvas'); b.width=w; b.height=h; const x=b.getContext('2d',{willReadFrequently:true}); x.imageSmoothingQuality='high'; x.drawImage(a,0,0,w,h);
    const out=x.getImageData(0,0,w,h); GLGlobe.cache.set(img,out); return out; }
  upload(unit,img,wrap){ const gl=this.gl; if(!img){ return 0; } let t=this.tx[unit]; if(!t){ t=this.tx[unit]=gl.createTexture(); }
    if(wrap) img=GLGlobe.pot(img);
    gl.activeTexture(gl.TEXTURE0+unit); gl.bindTexture(gl.TEXTURE_2D,t);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,wrap?gl.REPEAT:gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE); return 1; }
  setTex(T,ring){ const gl=this.gl; this._T=T; this._ring=ring; gl.useProgram(this.prog);
    this.upload(0,T.map,true); gl.uniform1f(this.u.uHasClouds,this.upload(1,T.clouds,true)); gl.uniform1f(this.u.uHasNight,this.upload(2,T.night,true));
    gl.uniform1f(this.u.uHasRing,ring&&this.ringR?this.upload(3,ring):0); this.ready=true; }
  /* orientation: body = M · view (row-major 3×3). Default = the planet's tilt in the screen plane, with ringed planets'
     poles leaned toward us by ringOpen so the rings show. Dragging composes extra turns onto it. */
  resetOrient(){ const t=this.tilt||0, ct=Math.cos(t), st=Math.sin(t), ob=(this.ringR?this.ringOpen:0)*Math.PI/180, c=Math.cos(ob), s=Math.sin(ob);
    const Rz=[ct,st,0, -st,ct,0, 0,0,1], Rx=[1,0,0, 0,c,s, 0,-s,c]; this.M=GLGlobe.mul(Rx,Rz); }
  static mul(A,B){ const C=new Array(9); for(let i=0;i<3;i++) for(let j=0;j<3;j++) C[i*3+j]=A[i*3]*B[j]+A[i*3+1]*B[3+j]+A[i*3+2]*B[6+j]; return C; }
  /* turn the planet in screen space about axis (ax,ay,0) by angle a: M ← M · Dᵀ */
  turn(ax,ay,a){ if(!this.M) this.resetOrient(); const l=Math.hypot(ax,ay); if(!l||!a) return; const x=ax/l, y=ay/l, c=Math.cos(a), s=Math.sin(a), k=1-c;
    const D=[c+x*x*k, x*y*k, y*s,  x*y*k, c+y*y*k, -x*s,  -y*s, x*s, c];
    const Dt=[D[0],D[3],D[6], D[1],D[4],D[7], D[2],D[5],D[8]]; this.M=GLGlobe.ortho(GLGlobe.mul(this.M,Dt)); }
  static ortho(M){ const r0=[M[0],M[1],M[2]], r1=[M[3],M[4],M[5]], n=v=>{ const l=Math.hypot(...v); return v.map(x=>x/l); }, d=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
    const a=n(r0), b0=r1.map((x,i)=>x-d(r1,a)*a[i]), b=n(b0), c=[a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; return [...a,...b,...c]; }
  draw(){ if(!this.ready) return; const gl=this.gl, u=this.u, S=this.cv.width; gl.viewport(0,0,S,S); gl.useProgram(this.prog); if(!this.M) this.resetOrient();
    for(let i=0;i<4;i++) if(this.tx[i]){ gl.activeTexture(gl.TEXTURE0+i); gl.bindTexture(gl.TEXTURE_2D,this.tx[i]); }
    const [lx,ly,lz]=this.light, ll=Math.hypot(lx,ly,lz), ext=this.ext||(this.ringR?this.ringR[1]*1.02:1.04), ob=this.ringOpen*Math.PI/180;
    const M=this.M; gl.uniformMatrix3fv(u.uM,false,[M[0],M[3],M[6], M[1],M[4],M[7], M[2],M[5],M[8]]); gl.uniform3f(u.uAxis,M[3],M[4],M[5]);   // column-major; axis = body north in view space
    gl.uniform1f(u.uEm,this.emissive?1:0); gl.uniform1f(u.uRot,this.rot%1); gl.uniform1f(u.uCRot,this.cloudRot%1); gl.uniform1f(u.uAmb,this.ambient);
    gl.uniform1f(u.uExt,ext); gl.uniform1f(u.uS,S); gl.uniform3f(u.uLight,lx/ll,ly/ll,lz/ll);
    const a=this.atmo||[0,0,0]; gl.uniform3f(u.uAtmo,a[0]/255,a[1]/255,a[2]/255); gl.uniform2f(u.uRingR,...(this.ringR||[0,0]));
    gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLE_STRIP,0,4); }
}
GLGlobe.cache=new WeakMap();
GLGlobe.VS='attribute vec2 p; void main(){ gl_Position=vec4(p,0.,1.); }';
GLGlobe.FS=`precision highp float;
uniform sampler2D uMap,uClouds,uNight,uRing; uniform float uHasClouds,uHasNight,uHasRing,uEm,uRot,uCRot,uAmb,uExt,uS;
uniform mat3 uM; uniform vec3 uAxis; uniform vec2 uRingR; uniform vec3 uLight,uAtmo;
const float PI=3.14159265, TAU=6.28318531;
float ringA(float rr){ return texture2D(uRing,vec2((rr-uRingR.x)/(uRingR.y-uRingR.x),.5)).a; }
void main(){
  float R=uS*.5/uExt; vec2 q=(gl_FragCoord.xy/uS-.5)*2.*uExt; vec3 L=uLight;
  float r=length(q); vec3 col=vec3(0.); float a=0., Z=0.;
  if(r<1.+1.2/R){
    float f=r>.99999?.99999/r:1.; vec3 p=vec3(q*f,0.); p.z=sqrt(max(0.,1.-dot(p.xy,p.xy))); Z=p.z;
    vec3 b=uM*p; float lat=asin(clamp(b.y,-1.,1.)), lon=atan(b.x,b.z), base=lon/TAU+.5, v=.5-lat/PI;
    vec2 uv=vec2(fract(base+uRot),v);
    col=texture2D(uMap,uv).rgb;
    float sh=dot(p,L), lit;
    if(uEm>.5) lit=.5+.65*pow(Z,.45);
    else { lit=uAmb+max(0.,sh)*1.08;
      if(uHasRing>.5){ float ln=dot(uAxis,L); if(abs(ln)>1e-4){ float sd=-dot(uAxis,p)/ln;
        if(sd>0.){ float qr=length(p+sd*L); if(qr>uRingR.x&&qr<uRingR.y) lit*=1.-ringA(qr)*.8; } } } }
    float ca=0.; if(uHasClouds>.5){ ca=texture2D(uClouds,vec2(fract(base+uCRot),v)).r; col+=(1.-col)*ca; }
    col*=lit;
    if(uHasNight>.5){ float nk=1.-smoothstep(-.22,.08,sh); if(nk>0.) col+=texture2D(uNight,uv).rgb*nk*1.3*(1.-ca*.7); }
    float fa=pow(1.-Z,2.2)*(.15+max(0.,sh+.3)*1.1); col+=uAtmo*fa;
    a=clamp((1.-r)*R+.6,0.,1.);
  }
  if(uHasRing>.5&&abs(uAxis.z)>1e-3){ float zr=-(uAxis.x*q.x+uAxis.y*q.y)/uAxis.z; vec3 pr=vec3(q,zr); float rr=length(pr);
    if(rr>uRingR.x&&rr<uRingR.y&&(!(a>.5)||zr>Z)){ vec4 rc=texture2D(uRing,vec2((rr-uRingR.x)/(uRingR.y-uRingR.x),.5)); float ra=rc.a*.95;
      float bb=dot(pr,L), c=rr*rr-1., disc=bb*bb-c, s2=(disc>0.&&-bb+sqrt(disc)>0.)?.1:1.;
      float oa=ra+a*(1.-ra); if(oa>0.){ col=(rc.rgb*s2*ra+col*a*(1.-ra))/oa; } a=oa; } }
  col=min(col,vec3(1.)); gl_FragColor=vec4(col*a,a);
}`;

/* texture loading: real maps from tex/, generated fallback (and Venus cloud deck) from textures.js */
const imgCache={};
function loadImage(src){ return imgCache[src]||(imgCache[src]=new Promise(res=>{ const im=new Image(); im.onload=()=>res(im); im.onerror=()=>res(null); im.src=src; })); }
function toData(src,w,h){ if(!src) return null; const c=document.createElement('canvas'); c.width=w; c.height=h||w/2; const x=c.getContext('2d',{willReadFrequently:true}); x.drawImage(src,0,0,c.width,c.height);
  try{ return x.getImageData(0,0,c.width,c.height); }catch(e){ return null; } }
const genCache={};
const gen=(k,w=512)=>genCache[k+w]||(genCache[k+w]=StarTex.generate(k,w));
async function textureFor(key,w){
  if(key==='venus') return {map:toData(gen('venus').map,w)};
  const real=REAL_KEYS.has(key)? toData(await loadImage('tex/'+key+'.jpg'),w) : MOON_KEYS.has(key)? toData(await loadImage('tex/moons/'+key+'.jpg'),w) : null;
  if(real&&key==='titan'){ const d=real.data; for(let i=0;i<d.length;i+=4){ const v=(d[i]+d[i+1]+d[i+2])/3; d[i]=200+v*.12; d[i+1]=135+v*.1; d[i+2]=58+v*.06; } } // seen through its orange haze
  if(real&&key==='phobos'){ const d=real.data; for(let i=0;i<d.length;i+=4){ d[i]=Math.min(255,d[i]*1.7); d[i+1]=Math.min(255,d[i+1]*1.7); d[i+2]=Math.min(255,d[i+2]*1.7); } }
  if(real){ const T={map:real};
    if(key==='earth'){ T.clouds=toData(await loadImage('tex/earth_clouds.jpg'),w); T.night=toData(await loadImage('tex/earth_night.jpg'),w); }
    return T; }
  const G=gen(key); const T={map:toData(G.map,w)}; if(G.clouds) T.clouds=toData(G.clouds,w); if(G.night) T.night=toData(G.night,w); return T;
}
async function ringFor(key){
  if(key==='saturn'){ const d=toData(await loadImage('tex/saturn_ring.png'),1024,4); if(d) return {data:d,r:[1.12,2.27]}; }
  const d=toData(StarTex.ring(key),1024,4);
  if(d&&key==='uranus'){ // thin rings alias at card size: spread them a little
    const W=1024, src=new Float32Array(W); for(let x=0;x<W;x++) src[x]=d.data[x*4+3];
    for(let x=0;x<W;x++){ let m=0; for(let k=-7;k<=7;k++){ const v=src[Math.min(W-1,Math.max(0,x+k))]; if(v>m) m=v*(1-Math.abs(k)/9); }
      for(let y=0;y<4;y++) d.data[(y*W+x)*4+3]=Math.min(255,m*.8); } }
  return {data:d, r:StarTex.ringRadii[key]};
}

const CARD_OPTS={ sun:{emissive:true,spin:.02}, mercury:{spin:.025}, venus:{atmo:[70,55,20],spin:-.012},
  earth:{tilt:-.41,atmo:[50,100,210],spin:.05,clouds:true}, moon:{spin:.012}, mars:{tilt:-.44,atmo:[60,30,15],spin:.045},
  jupiter:{tilt:-.05,spin:.08}, saturn:{tilt:-.42,spin:.07,ring:true,ringOpen:22}, uranus:{tilt:-1.7,spin:-.05,atmo:[40,90,100]},
  neptune:{tilt:-.5,spin:.05,atmo:[30,50,140]},
  phobos:{spin:.05}, io:{spin:.04}, europa:{spin:.03}, ganymede:{spin:.03}, titan:{spin:.02,atmo:[120,70,10]}, enceladus:{spin:.04}, miranda:{tilt:-1.5,spin:.04}, triton:{tilt:.3,spin:-.03,atmo:[30,30,40]},
  ceres:{spin:.06}, pluto:{tilt:-.3,spin:-.02}, eris:{spin:.015}, haumea:{spin:.16}, makemake:{spin:.04} };
const REAL_KEYS=new Set(['sun','mercury','earth','moon','mars','jupiter','saturn','uranus','neptune']);
const MOON_KEYS=new Set(['io','ganymede','titan','triton','phobos','miranda']);

const CARD_COL={haumea:'#d7d9dc',makemake:'#c98d62',eris:'#e6e6e2',mercury:'#a9a39b',venus:'#e3c27a',earth:'#4f8fd8',mars:'#c8643c',ceres:'#9a968f',jupiter:'#d6a77a',saturn:'#e6cf96',uranus:'#9fdbe3',neptune:'#4a6fe0',pluto:'#d8b48a'};

/* StarSet — procedural planet texture engine (shared by the landing page and the simulation).
   Every surface is generated in code from 3D noise sampled on the sphere, so textures wrap seamlessly
   and the site needs no image files. generate(key, width) returns canvases:
   { map, bump?, rough?, night?, clouds? }   (equirectangular, width × width/2) */
(function(){
'use strict';
const DEG = Math.PI/180, TAU = Math.PI*2;

function makeNoise(seed){
  let s = seed % 2147483647; if (s <= 0) s += 2147483646;
  const rnd = () => (s = s*16807 % 2147483647) / 2147483647;
  const perm = new Uint8Array(512), val = new Float32Array(256);
  const p = Array.from({length:256},(_,i)=>i);
  for (let i=255;i>0;i--){ const j=Math.floor(rnd()*(i+1)); const t=p[i]; p[i]=p[j]; p[j]=t; }
  for (let i=0;i<512;i++) perm[i]=p[i&255];
  for (let i=0;i<256;i++) val[i]=rnd();
  function n3(x,y,z){
    const xi=Math.floor(x), yi=Math.floor(y), zi=Math.floor(z);
    const X=xi&255, Y=yi&255, Z=zi&255, X1=(X+1)&255, Y1=(Y+1)&255, Z1=(Z+1)&255;
    let u=x-xi, v=y-yi, w=z-zi; u=u*u*(3-2*u); v=v*v*(3-2*v); w=w*w*(3-2*w);
    const a=perm[X]+Y, b=perm[X1]+Y, a1=perm[X]+Y1, b1=perm[X1]+Y1;
    const c000=val[perm[perm[a]+Z]], c100=val[perm[perm[b]+Z]], c010=val[perm[perm[a1]+Z]], c110=val[perm[perm[b1]+Z]];
    const c001=val[perm[perm[a]+Z1]], c101=val[perm[perm[b]+Z1]], c011=val[perm[perm[a1]+Z1]], c111=val[perm[perm[b1]+Z1]];
    const x00=c000+(c100-c000)*u, x10=c010+(c110-c010)*u, x01=c001+(c101-c001)*u, x11=c011+(c111-c011)*u;
    const y0=x00+(x10-x00)*v, y1=x01+(x11-x01)*v;
    return y0+(y1-y0)*w;
  }
  function fbm(x,y,z,oct){ let a=1,f=1,sum=0,norm=0; for(let o=0;o<oct;o++){ sum+=a*n3(x*f+o*17.1,y*f,z*f); norm+=a; a*=.5; f*=2.03; } return sum/norm; }
  function ridged(x,y,z,oct){ let a=1,f=1,sum=0,norm=0; for(let o=0;o<oct;o++){ const n=1-Math.abs(2*n3(x*f,y*f+o*9.7,z*f)-1); sum+=a*n*n; norm+=a; a*=.5; f*=2.1; } return sum/norm; }
  return { n3, fbm, ridged, rnd };
}

const clamp01=t=>t<0?0:t>1?1:t;
const sstep=(e0,e1,x)=>{const t=clamp01((x-e0)/(e1-e0));return t*t*(3-2*t);};
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
const scale=(c,k)=>[c[0]*k,c[1]*k,c[2]*k];
const wrapAng=a=>Math.atan2(Math.sin(a),Math.cos(a));

function surface(w,h,alpha){
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d'); const img=ctx.createImageData(w,h);
  if(!alpha) for(let i=3;i<img.data.length;i+=4) img.data[i]=255;
  return { c, ctx, img, d:img.data, put(){ ctx.putImageData(img,0,0); return c; } };
}
function setRGB(d,i,c){ d[i]=c[0]; d[i+1]=c[1]; d[i+2]=c[2]; }
function setG(d,i,g){ d[i]=d[i+1]=d[i+2]=g; }
// iterate over the equirectangular grid with unit-sphere coordinates
function loop(w,h,fn){
  for(let y=0;y<h;y++){
    const lat=(0.5-(y+.5)/h)*Math.PI, cl=Math.cos(lat), sl=Math.sin(lat);
    for(let x=0;x<w;x++){
      const lon=((x+.5)/w)*TAU - Math.PI;
      fn(cl*Math.cos(lon), sl, cl*Math.sin(lon), lat, lon, (y*w+x)*4);
    }
  }
}
// latitude colour table → smooth interpolation
function band(table, latDeg){
  if(latDeg<=table[0][0]) return table[0][1];
  for(let i=0;i<table.length-1;i++){
    const a=table[i], b=table[i+1];
    if(latDeg<=b[0]) return mix(a[1],b[1],sstep(0,1,(latDeg-a[0])/(b[0]-a[0])));
  }
  return table[table.length-1][1];
}
// craters drawn into colour + height canvases (equirectangular, stretched toward poles like real maps)
function craters(col, bump, n, seed, W, H, opts={}){
  const R=makeNoise(seed).rnd, cc=col.getContext('2d'), bc=bump&&bump.getContext('2d');
  const {dark=.25, rays=0, maxR=.03, latLimit=.8}=opts;
  for(let i=0;i<n;i++){
    const x=R()*W, lat=(R()*2-1)*latLimit*Math.PI/2, y=(.5-lat/Math.PI)*H;
    const r=(1.2+Math.pow(R(),4)*W*maxR), sx=1/Math.max(Math.cos(lat),.25);
    for(const dx of [0,-W,W]){
      const cx=x+dx; if(cx<-r*sx*2||cx>W+r*sx*2) continue;
      cc.save(); cc.translate(cx,y); cc.scale(sx,1);
      let g=cc.createRadialGradient(0,0,0,0,0,r); const ink=dark<0?'255,255,255':'0,0,0', dk=Math.abs(dark);
      g.addColorStop(0,`rgba(${ink},${dk})`); g.addColorStop(.75,`rgba(${ink},${dk*.6})`); g.addColorStop(.9,`rgba(255,255,255,${dk*.7})`); g.addColorStop(1,'rgba(255,255,255,0)');
      cc.fillStyle=g; cc.beginPath(); cc.arc(0,0,r,0,TAU); cc.fill();
      if(i<rays){ cc.strokeStyle='rgba(255,255,255,.07)'; cc.lineWidth=Math.max(1,r*.18);
        for(let k=0;k<14;k++){ const a=R()*TAU, L=r*(3+R()*6); cc.beginPath(); cc.moveTo(Math.cos(a)*r,Math.sin(a)*r); cc.lineTo(Math.cos(a)*L,Math.sin(a)*L); cc.stroke(); } }
      cc.restore();
      if(bc){ bc.save(); bc.translate(cx,y); bc.scale(sx,1);
        g=bc.createRadialGradient(0,0,0,0,0,r*1.15);
        g.addColorStop(0,'rgba(0,0,0,.55)'); g.addColorStop(.7,'rgba(0,0,0,.35)'); g.addColorStop(.86,'rgba(255,255,255,.5)'); g.addColorStop(1,'rgba(255,255,255,0)');
        bc.fillStyle=g; bc.beginPath(); bc.arc(0,0,r*1.15,0,TAU); bc.fill(); bc.restore(); }
    }
  }
}

/* ---------------------------------------------------------------- generators */
const G = {};

G.earth = (W)=>{
  const H=W/2, N=makeNoise(41), M=makeNoise(42), C=makeNoise(43), Rg=makeNoise(44), Cl=makeNoise(45);
  const col=surface(W,H), bump=surface(W,H), rough=surface(W,H), night=surface(W,H), clouds=surface(W,H,true);
  const SEA=.515;
  const deep=[4,18,52], ocean=[10,48,108], shelf=[28,104,140];
  const forest=[30,78,32], temperate=[72,104,46], savanna=[150,138,78], desert=[214,184,128], tundra=[120,116,98], rock=[112,98,84], snow=[238,242,248], ice=[226,236,246];
  loop(W,H,(x,y,z,lat,lon,i)=>{
    const wx=N.fbm(x*1.1+3.1,y*1.1,z*1.1,3)-.5, wy=N.fbm(x*1.1,y*1.1+7.3,z*1.1,3)-.5, wz=N.fbm(x*1.1,y*1.1,z*1.1+1.9,3)-.5;
    const px=x+wx*.95, py=y+wy*.95, pz=z+wz*.95;
    const n=N.fbm(px*1.45,py*1.45,pz*1.45,7);
    const alat=Math.abs(lat)/DEG, jitter=(M.n3(x*5,y*5,z*5)-.5);
    const capLat = (lat>0?77:68) + jitter*12;
    let c, h, r, light=0;
    if(alat>capLat || (lat<-66*DEG && n>SEA-.04)){ c=mix(ice,[200,215,230],M.n3(x*20,y*20,z*20)*.5); h=.35; r=190; }
    else if(n<SEA){
      const d=sstep(.32,SEA,n); c=mix(deep,ocean,d*d); c=mix(c,shelf,sstep(SEA-.03,SEA,n)*.75);
      h=0; r=118;
    } else {
      const e=(n-SEA)/(1-SEA);
      const rid=Rg.ridged(px*3.2,py*3.2,pz*3.2,5), mtn=sstep(.04,.22,e)*Math.pow(rid,2.2);
      const m=M.fbm(x*2.3+wx,y*2.3,z*2.3+wz,5);
      const subtrop=sstep(0,1,1-Math.abs(alat-24)/13);
      const arid=clamp01(subtrop*1.5*(1.15-m*1.3) + (m<.38?(.38-m)*2:0));
      c=mix(temperate,forest,sstep(28,6,alat)*sstep(.4,.6,m));
      c=mix(c,savanna,clamp01((.55-m)*2.5)*sstep(55,30,alat));
      c=mix(c,desert,clamp01(arid));
      c=mix(c,tundra,sstep(52,66,alat));
      c=mix(c,rock,mtn*.85);
      c=mix(c,snow,clamp01(sstep(.5,.75,mtn) + sstep(58,70,alat)*mtn*1.2));
      c=scale(c,.82+.36*C.n3(x*48,y*48,z*48));
      h=.25+e*1.3+mtn*.9; r=235;
      if(arid<.6 && alat<62){
        const city=C.fbm(x*26,y*26,z*26,3), coast=sstep(SEA+.07,SEA,n), dens=sstep(.4,.7,m)*.4+coast*.8+.15;
        light=clamp01((city-.56)*7*dens) * (0.6+0.4*C.n3(x*140,y*140,z*140));
      }
    }
    setRGB(col.d,i,c); setG(bump.d,i,clamp01(h)*255); setG(rough.d,i,r);
    setRGB(night.d,i,[255*light,190*light,110*light]);
    // clouds: weather belts (ITCZ + mid-latitude storm tracks) with swirling structure
    const sw=Cl.fbm(x*1.6,y*1.6,z*1.6,3)-.5;
    const cn=Cl.fbm(x*2.4+sw*2.2, y*3.4+sw*1.5, z*2.4-sw*2.2, 6);
    const belt=.07*sstep(12,0,alat)+.07*sstep(38,55,alat)*sstep(82,62,alat)-.06*sstep(8,22,alat)*sstep(40,26,alat)-.08*sstep(70,88,alat);
    const a=sstep(.5,.74,cn+belt) * (.75+.25*Cl.n3(x*30,y*30,z*30));
    const k=i; clouds.d[k]=clouds.d[k+1]=clouds.d[k+2]=255; clouds.d[k+3]=a*255;
  });
  return { map:col.put(), bump:bump.put(), rough:rough.put(), night:night.put(), clouds:clouds.put() };
};

G.mars = (W)=>{
  const H=W/2, N=makeNoise(61), A=makeNoise(62), D=makeNoise(63);
  const col=surface(W,H), bump=surface(W,H);
  const bright=[222,150,100], mid=[186,96,56], rust=[160,72,40], dark=[96,54,40], cap=[242,236,230];
  loop(W,H,(x,y,z,lat,lon,i)=>{
    const w=N.fbm(x*1.3,y*1.3,z*1.3,3)-.5;
    const n=N.fbm(x*3+w,y*3+w,z*3-w,7), alb=A.fbm(x*1.5+w*1.5,y*1.7,z*1.5,5);
    let c=mix(rust,mid,n); c=mix(c,bright,sstep(.45,.62,alb)*.85);
    const darkness=sstep(.53,.64,1-alb)*.7; c=mix(c,dark,darkness);
    let h=.35+n*.5;
    // Valles Marineris — a long canyon just south of the equator
    const dl=(lat/DEG+8+ (D.n3(x*8,y*8,z*8)-.5)*4)/2.2, along=sstep(.9,1.3,lon)*sstep(2.4,2.0,lon);
    const vm=Math.exp(-dl*dl)*along; c=mix(c,[110,50,32],vm*.8); h-=vm*.4;
    // Tharsis volcanoes, Olympus Mons
    const om=Math.hypot(wrapAng(lon-(-2.35))*Math.cos(lat),(lat-18*DEG)); const omH=Math.exp(-((om/.09)**2));
    h+=omH*.6; c=mix(c,[200,120,80],omH*.4); if(om<.018) { c=mix(c,[120,60,40],.6); h-=.2; }
    for(const [lo,la] of [[-1.97,8],[-2.06,1],[-2.12,-9]]){ const d=Math.hypot(wrapAng(lon-lo),(lat-la*DEG)); h+=Math.exp(-((d/.05)**2))*.35; }
    // polar ice caps
    const alat=Math.abs(lat)/DEG, capEdge=(lat>0?79:83)+(D.n3(x*6,y*6,z*6)-.5)*10;
    if(alat>capEdge){ c=mix(c,cap,sstep(capEdge,capEdge+3,alat)); h=.5; }
    c=scale(c,.88+.24*D.n3(x*60,y*60,z*60));
    setRGB(col.d,i,c); setG(bump.d,i,clamp01(h)*255);
  });
  const map=col.put(), b=bump.put();
  craters(map,b,Math.round(W*.09),8,W,H,{dark:.18,maxR:.012});
  return { map, bump:b };
};

G.moon = (W)=>{
  const H=W/2, N=makeNoise(51), Ma=makeNoise(52);
  const col=surface(W,H), bump=surface(W,H);
  loop(W,H,(x,y,z,lat,lon,i)=>{
    const n=N.fbm(x*4,y*4,z*4,7);
    const mare=sstep(.53,.6,Ma.fbm(x*1.25+2,y*1.25,z*1.25,5)) * sstep(-.7,.5,Math.cos(lon)); // maria mostly on the near side
    let c=mix([128,126,122],[200,198,192],n); c=mix(c,[78,78,82],mare*.85);
    c=scale(c,.9+.2*N.n3(x*70,y*70,z*70));
    setRGB(col.d,i,c); setG(bump.d,i,(.3+n*.5-mare*.15)*255);
  });
  const map=col.put(), b=bump.put();
  craters(map,b,Math.round(W*.35),7,W,H,{dark:.2,rays:4,maxR:.02,latLimit:.9});
  return { map, bump:b };
};

G.mercury = (W)=>{
  const H=W/2, N=makeNoise(21), A=makeNoise(22);
  const col=surface(W,H), bump=surface(W,H);
  loop(W,H,(x,y,z,lat,lon,i)=>{
    const n=N.fbm(x*4,y*4,z*4,7), a=A.fbm(x*2,y*2,z*2,4);
    let c=mix([96,90,84],[176,166,154],n); c=mix(c,[150,132,112],sstep(.5,.65,a)*.5);
    c=scale(c,.9+.2*N.n3(x*70,y*70,z*70));
    setRGB(col.d,i,c); setG(bump.d,i,(.3+n*.5)*255);
  });
  const map=col.put(), b=bump.put();
  craters(map,b,Math.round(W*.45),5,W,H,{dark:.24,rays:3,maxR:.022,latLimit:.9});
  return { map, bump:b };
};

G.venus = (W)=>{
  const H=W/2, N=makeNoise(31), S=makeNoise(32);
  const col=surface(W,H);
  loop(W,H,(x,y,z,lat,lon,i)=>{
    const shift=Math.abs(Math.sin(lat))*1.6;            // chevron / "Y" cloud pattern from super-rotation
    const l2=lon+shift, cl=Math.cos(lat);
    const sx=cl*Math.cos(l2), sz=cl*Math.sin(l2);
    const w=N.fbm(sx*1.5,y*1.5,sz*1.5,3)-.5;
    const n=N.fbm(sx*2.2+w,y*5+w*2,sz*2.2,6), s=S.fbm(sx*3,y*14,sz*3,4);
    let c=mix([186,140,78],[238,208,150],n); c=mix(c,[252,238,200],sstep(.55,.75,s)*.5);
    c=mix(c,[150,110,62],sstep(.6,.72,1-n)*.4);
    setRGB(col.d,i,c);
  });
  return { map:col.put() };
};

const JUP=[[-90,[118,112,116]],[-62,[148,138,132]],[-48,[206,190,168]],[-40,[176,140,108]],[-33,[226,214,192]],[-26,[214,196,170]],[-20,[188,128,86]],[-13,[166,110,74]],[-7,[236,226,206]],[0,[242,232,212]],[6,[226,206,176]],[9,[178,116,74]],[17,[156,100,66]],[22,[236,224,202]],[28,[202,160,120]],[34,[230,214,190]],[42,[188,160,132]],[52,[214,198,178]],[64,[152,142,138]],[90,[118,112,116]]];
const SAT=[[-90,[150,152,150]],[-70,[176,164,134]],[-50,[214,194,150]],[-36,[200,176,130]],[-24,[230,212,168]],[-12,[220,196,150]],[0,[242,228,188]],[10,[236,218,176]],[20,[204,178,132]],[30,[228,208,164]],[46,[208,186,140]],[62,[184,170,138]],[76,[138,150,160]],[90,[110,128,150]]];
const NEP=[[-90,[52,76,170]],[-60,[70,100,205]],[-45,[48,74,180]],[-28,[78,118,226]],[-10,[60,98,214]],[10,[66,104,220]],[30,[48,80,196]],[55,[74,108,214]],[90,[56,82,180]]];

function giant(W, table, seed, o){
  const H=W/2, N=makeNoise(seed), T=makeNoise(seed+1), S=makeNoise(seed+2);
  const col=surface(W,H);
  loop(W,H,(x,y,z,lat,lon,i)=>{
    const latD=lat/DEG;
    // turbulence is strongest at the jet-stream edges of the bands
    const edge=.5+.5*Math.abs(Math.sin(latD*o.edgeFreq*DEG));
    const w=N.fbm(x*2.2,y*2.2,z*2.2,4)-.5, w2=T.fbm(x*7+w*2,y*7,z*7-w*2,4)-.5;
    const t=latD + w*o.warp*edge + w2*o.swirl;
    let c=band(table,t);
    const streak=S.fbm(x*2.5+w,y*o.streakY,z*2.5-w,5);
    c=scale(c,1+(streak-.5)*o.streak);
    if(o.spots) for(const sp of o.spots){
      const dlon=wrapAng(lon-sp.lon)*Math.cos(lat), dlat=lat-sp.lat;
      const e=Math.sqrt((dlon/sp.w)**2+(dlat/sp.h)**2);
      if(e<1.6){
        const inner=1-sstep(.0,1,e), ring=Math.exp(-(((e-1)/.18)**2));
        const swirlN=T.n3(Math.atan2(dlat/sp.h,dlon/sp.w)*1.5+e*6,e*4,sp.lat*10);
        c=mix(c,sp.ring,ring*.5); c=mix(c,mix(sp.c,sp.c2||sp.c,swirlN),inner*.95);
      }
    }
    if(o.cirrus){ const ci=S.fbm(x*3,y*30,z*3,4); const zone=Math.exp(-(((Math.abs(latD)-30)/8)**2))+Math.exp(-(((latD+48)/5)**2))*.8;
      c=mix(c,[235,242,255],sstep(.62,.74,ci)*zone*.85); }
    setRGB(col.d,i,c);
  });
  return { map:col.put() };
}
G.jupiter=W=>giant(W,JUP,71,{edgeFreq:22,warp:3.2,swirl:3.4,streakY:40,streak:.32,
  spots:[{lat:-22*DEG,lon:.9,w:.23,h:.085,c:[198,96,58],c2:[220,130,84],ring:[236,214,184]},
         {lat:-34*DEG,lon:-1.6,w:.05,h:.03,c:[248,244,236],ring:[200,170,140]},{lat:-34*DEG,lon:-.9,w:.045,h:.028,c:[246,240,230],ring:[200,170,140]},
         {lat:-41*DEG,lon:2.4,w:.06,h:.03,c:[244,238,228],ring:[190,160,130]}]});
G.saturn=W=>giant(W,SAT,81,{edgeFreq:18,warp:2.0,swirl:1.4,streakY:50,streak:.16});
G.neptune=W=>giant(W,NEP,101,{edgeFreq:14,warp:3,swirl:2,streakY:30,streak:.2,cirrus:true,
  spots:[{lat:-20*DEG,lon:2.2,w:.2,h:.07,c:[26,38,118],ring:[120,150,240]}]});
G.uranus=W=>{
  const H=W/2, N=makeNoise(91); const col=surface(W,H);
  loop(W,H,(x,y,z,lat,lon,i)=>{
    const latD=lat/DEG, w=N.fbm(x*2,y*2,z*2,3)-.5;
    let c=mix([150,212,222],[176,228,234],.5+.5*Math.sin((latD+w*6)*.18));
    c=mix(c,[206,240,244],sstep(-40,-80,latD)*.7);      // bright sunlit polar cap
    c=mix(c,[226,246,250],sstep(.68,.76,N.fbm(x*4,y*24,z*4,3))*.35*Math.exp(-(((latD-30)/10)**2)));
    setRGB(col.d,i,c);
  });
  return { map:col.put() };
};

G.sun = (W)=>{
  const H=W/2, N=makeNoise(11), S=makeNoise(12); const col=surface(W,H);
  loop(W,H,(x,y,z,lat,lon,i)=>{
    const n=N.fbm(x*6,y*6,z*6,4), g=N.fbm(x*40,y*40,z*40,2);
    let c=mix([255,128,16],[255,214,96],n); c=mix(c,[255,250,214],sstep(.5,.85,g)*.5);
    const spot=S.fbm(x*3,y*3,z*3,4), belt=Math.exp(-(((Math.abs(lat/DEG)-18)/9)**2));
    const um=sstep(.66,.72,spot)*belt; c=mix(c,[90,30,6],um*.85);
    setRGB(col.d,i,c);
  });
  return { map:col.put() };
};

/* ---------------------------------------------------------------- dwarf planets */
const blob=(lat,lon,cLat,cLon,rLat,rLon)=>{ const dl=(lat-cLat)/rLat, dn=wrapAng(lon-cLon)*Math.cos(lat)/rLon; return Math.sqrt(dl*dl+dn*dn); };

G.ceres = (W)=>{
  const H=W/2, N=makeNoise(201), A=makeNoise(202); const col=surface(W,H), bump=surface(W,H);
  loop(W,H,(x,y,z,lat,lon,i)=>{
    const n=N.fbm(x*4,y*4,z*4,7), a=A.fbm(x*2,y*2,z*2,4);
    let c=mix([84,82,80],[146,142,136],n); c=mix(c,[112,104,96],sstep(.5,.65,a)*.4);
    // Occator crater's bright salt deposits (Cerealia & Vinalia Faculae)
    const oc=blob(lat,lon,20*DEG,1.2,.05,.05), f1=blob(lat,lon,19.6*DEG,1.2,.016,.016), f2=blob(lat,lon,20.6*DEG,1.245,.022,.03);
    c=mix(c,[60,58,56],Math.exp(-oc*oc*3)*.4*(oc<1?1:0));
    c=mix(c,[250,250,246],Math.exp(-f1*f1*2)+Math.exp(-f2*f2*2)*.8);
    c=scale(c,.9+.2*N.n3(x*70,y*70,z*70));
    setRGB(col.d,i,c); setG(bump.d,i,(.3+n*.5)*255);
  });
  const map=col.put(), b=bump.put(); craters(map,b,Math.round(W*.3),12,W,H,{dark:.22,maxR:.02,latLimit:.9});
  return { map, bump:b };
};

G.pluto = (W)=>{
  const H=W/2, N=makeNoise(211), M=makeNoise(212), C=makeNoise(213); const col=surface(W,H), bump=surface(W,H);
  const tan=[206,166,124], butter=[226,196,150], rust=[168,108,74], cthulhu=[78,38,28], sputnik=[244,238,226], eastLobe=[232,222,204], pole=[160,126,112];
  loop(W,H,(x,y,z,lat,lon,i)=>{
    const w=N.fbm(x*1.6,y*1.6,z*1.6,3)-.5, n=N.fbm(x*3.5+w,y*3.5,z*3.5-w,6), m=M.fbm(x*2.2,y*2.2,z*2.2,5);
    let c=mix(tan,butter,sstep(.4,.65,n)); c=mix(c,rust,sstep(.55,.7,m)*.6);
    // Lowell Regio — the darker reddish north polar region
    c=mix(c,pole,sstep(48,68,lat/DEG+w*12)*.75);
    // Cthulhu Macula: long dark-red band along the equator, west of the heart
    const e2=N.fbm(x*7,y*7,z*7,4)-.5;
    const ce=blob(lat,lon,-9*DEG+w*.2,-1.4,.3,1.05)+e2*.9;
    c=mix(c,mix(cthulhu,[110,58,40],sstep(.4,.65,n)),sstep(1.0,.7,ce)*.92);
    // Tombaugh Regio "heart": Sputnik Planitia (smooth nitrogen-ice plain, west lobe) + brighter uplands (east lobe)
    const sp=blob(lat,lon,22*DEG,-.08,.42,.3), el=blob(lat,lon,2*DEG,.4,.5,.48);
    const heartE=sstep(1.0,.75,el+e2*.8), heartW=sstep(1.0,.88,sp+e2*.35);
    c=mix(c,eastLobe,heartE*.85);
    const cells=1-Math.abs(2*C.n3(x*24,y*24,z*24)-1);
    c=mix(c,mix(sputnik,[214,206,190],sstep(.8,.95,cells)*.6),heartW);
    c=scale(c,.92+.16*C.n3(x*60,y*60,z*60));
    setRGB(col.d,i,c); setG(bump.d,i,(.35+n*.45-heartW*.2)*255);
  });
  const map=col.put(), b=bump.put(); craters(map,b,Math.round(W*.08),14,W,H,{dark:.15,maxR:.012});
  return { map, bump:b };
};

G.charon = (W)=>{
  const H=W/2, N=makeNoise(221); const col=surface(W,H), bump=surface(W,H);
  loop(W,H,(x,y,z,lat,lon,i)=>{
    const n=N.fbm(x*4,y*4,z*4,6), w=N.fbm(x*2,y*2,z*2,3)-.5;
    let c=mix([118,116,114],[176,174,170],n);
    c=mix(c,[120,62,46],sstep(50,70,lat/DEG+w*14)*.85);   // Mordor Macula: red north pole
    c=scale(c,.92+.16*N.n3(x*60,y*60,z*60));
    setRGB(col.d,i,c); setG(bump.d,i,(.3+n*.5)*255);
  });
  const map=col.put(), b=bump.put(); craters(map,b,Math.round(W*.15),15,W,H,{dark:.18,maxR:.015});
  return { map, bump:b };
};

G.eris = (W)=>{
  const H=W/2, N=makeNoise(231); const col=surface(W,H);
  loop(W,H,(x,y,z,lat,lon,i)=>{
    const n=N.fbm(x*3,y*3,z*3,6);
    let c=mix([206,206,206],[240,238,234],n); c=mix(c,[196,200,212],sstep(.55,.7,N.fbm(x*1.5+4,y*1.5,z*1.5,3))*.4);
    setRGB(col.d,i,c);
  });
  return { map:col.put() };
};

G.makemake = (W)=>{
  const H=W/2, N=makeNoise(241), M=makeNoise(242); const col=surface(W,H);
  loop(W,H,(x,y,z,lat,lon,i)=>{
    const n=N.fbm(x*3,y*3,z*3,6), m=M.fbm(x*2,y*2,z*2,4);
    let c=mix([170,108,74],[214,160,118],n); c=mix(c,[236,212,186],sstep(.56,.7,m)*.7);
    const ds=blob(lat,lon,-15*DEG,2.1,.12,.16); c=mix(c,[96,58,42],sstep(1,.6,ds)*.7);
    setRGB(col.d,i,c);
  });
  return { map:col.put() };
};

G.haumea = (W)=>{
  const H=W/2, N=makeNoise(251); const col=surface(W,H);
  loop(W,H,(x,y,z,lat,lon,i)=>{
    const n=N.fbm(x*3,y*3,z*3,6);
    let c=mix([196,198,202],[236,238,240],n);
    const rs=blob(lat,lon,-5*DEG,1.0,.35,.3)+(N.fbm(x*8,y*8,z*8,3)-.5)*.9; c=mix(c,[150,84,72],sstep(1,.6,rs)*.75); // the dark red spot
    setRGB(col.d,i,c);
  });
  return { map:col.put() };
};

/* ---------------------------------------------------------------- moons without freely-licensed maps */
function icyMoon(W, seed, o){
  const H=W/2, N=makeNoise(seed), A=makeNoise(seed+1); const col=surface(W,H), bump=surface(W,H);
  loop(W,H,(x,y,z,lat,lon,i)=>{
    const n=N.fbm(x*o.f,y*o.f,z*o.f,6), a=A.fbm(x*2,y*2,z*2,4);
    let c=mix(o.c0,o.c1,n); if(o.patch) c=mix(c,o.patch,sstep(.52,.66,a)*.5);
    if(o.extra) c=o.extra(c,x,y,z,lat,lon,N,A);
    c=scale(c,.93+.14*N.n3(x*70,y*70,z*70));
    setRGB(col.d,i,c); setG(bump.d,i,(.3+n*.5)*255);
  });
  const map=col.put(), b=bump.put();
  if(o.craters) craters(map,b,Math.round(W*o.craters),seed+9,W,H,{dark:o.cd||.2,maxR:o.cr||.02,latLimit:.9,rays:o.rays||0});
  if(o.post) o.post(map,b,W,H);
  return { map, bump:b };
}
// Europa: bright water ice criss-crossed by reddish-brown lineae (cracks) and mottled "chaos" terrain
const EUROPA_CIRCLES=(()=>{ const R=makeNoise(305).rnd, out=[]; for(let k=0;k<26;k++){ const u=R()*2-1, t=R()*TAU, s=Math.sqrt(1-u*u);
  out.push({n:[s*Math.cos(t),u,s*Math.sin(t)], w:.003+R()*.008, a:R()*TAU, len:.5+R()*.5, wob:R()*.05}); } return out; })();
G.europa=W=>icyMoon(W,301,{f:3,c0:[200,188,166],c1:[236,230,216],patch:[176,140,108],extra:(c,x,y,z,lat,lon,N)=>{
  let lin=0;
  for(const L of EUROPA_CIRCLES){ // long lineae follow great circles, broken into arcs
    const d=x*L.n[0]+y*L.n[1]+z*L.n[2] + (N.n3(x*6,y*6,z*6)-.5)*L.wob;
    if(Math.abs(d)<L.w*2){ const along=Math.atan2(y*L.n[0]-x*L.n[1], z); if(Math.cos(along*1.0+L.a)>1-L.len*1.6) lin=Math.max(lin, sstep(L.w*1.6,L.w*.3,Math.abs(d))); } }
  const fine=1-Math.abs(2*N.n3(x*14,y*14+3,z*14)-1);
  lin=Math.max(lin, sstep(.975,.995,fine)*.45);
  return mix(c,[150,92,60],lin*.7); }});
// Callisto: dark, ancient, saturated with bright craters; Valhalla multi-ring basin
G.callisto=W=>icyMoon(W,311,{f:4,c0:[64,56,48],c1:[124,110,94],craters:.5,cd:-.35,cr:.012,rays:30,extra:(c,x,y,z,lat,lon)=>{
  const d=Math.hypot(wrapAng(lon-.9)*Math.cos(lat),lat-15*DEG); const ring=Math.max(0,Math.cos(d*55))*sstep(.55,.1,d);
  return mix(mix(c,[190,180,166],sstep(.12,.0,d)*.8),[160,148,132],ring*.35); }});
// Mimas: small, grey, with the giant Herschel crater
G.mimas=W=>icyMoon(W,321,{f:4,c0:[150,150,148],c1:[206,206,202],craters:.5,cd:.2,cr:.02,post:(map,b,W,H)=>{
  const c=map.getContext('2d'), bc=b.getContext('2d'), x=W*.25, y=H*.5, r=W*.055;
  for(const [ctx,dark,rim] of [[c,'rgba(60,60,60,.55)','rgba(255,255,255,.5)'],[bc,'rgba(0,0,0,.7)','rgba(255,255,255,.8)']]){
    const g=ctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,dark); g.addColorStop(.12,'rgba(255,255,255,.45)'); g.addColorStop(.2,dark); g.addColorStop(.85,dark); g.addColorStop(.95,rim); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fill(); } }});
// Enceladus: the whitest body in the Solar System, with blue "tiger stripe" fractures at the south pole
G.enceladus=W=>icyMoon(W,331,{f:3,c0:[226,232,236],c1:[250,252,254],craters:.12,cd:.08,cr:.012,extra:(c,x,y,z,lat,lon,N)=>{
  if(lat/DEG>-55) return c;
  const px=Math.cos(lat)*Math.cos(lon), pz=Math.cos(lat)*Math.sin(lon), ca=Math.cos(.6), sa=Math.sin(.6);
  const across=px*ca+pz*sa, along=-px*sa+pz*ca; let st=0;
  for(const off of [-.18,-.06,.06,.18]){ const d=Math.abs(across-off+(N.n3(x*9,y*9,z*9)-.5)*.03); if(Math.abs(along)<.32) st=Math.max(st,sstep(.022,.004,d)); }
  return mix(c,[96,136,170],st*.9); }});
G.tethys=W=>icyMoon(W,341,{f:3.5,c0:[196,196,192],c1:[234,234,230],craters:.4,cd:.16,cr:.02,extra:(c,x,y,z,lat,lon,N)=>{
  const ch=Math.abs(Math.sin(lon*.5+.4)*Math.cos(lat)*0+ (y*.9+x*.4))+ (N.n3(x*5,y*5,z*5)-.5)*.12; return mix(c,[150,148,144],sstep(.08,0,ch)*.6); }});
G.dione=W=>icyMoon(W,351,{f:3.5,c0:[176,176,174],c1:[222,222,220],craters:.35,cd:.18,cr:.018,extra:(c,x,y,z,lat,lon,N)=>{
  const trailing=sstep(.2,-.6,Math.cos(lon)); const wisp=1-Math.abs(2*N.n3(x*7,y*7+3,z*7)-1);
  return mix(c,[246,246,244],sstep(.9,.98,wisp)*trailing*.9); }});
G.rhea=W=>icyMoon(W,361,{f:4,c0:[160,158,154],c1:[214,212,208],craters:.55,cd:.2,cr:.022,rays:4});
// Iapetus: coal-dark leading hemisphere (Cassini Regio), bright trailing one, equatorial ridge
G.iapetus=W=>icyMoon(W,371,{f:3,c0:[200,192,176],c1:[236,230,218],craters:.3,cd:.16,cr:.02,extra:(c,x,y,z,lat,lon,N)=>{
  const e=Math.hypot(wrapAng(lon)/1.55,lat/(52*DEG))+(N.fbm(x*4,y*4,z*4,4)-.5)*.5;
  c=mix(c,mix([70,50,36],[96,72,52],N.n3(x*30,y*30,z*30)),sstep(1.08,.7,e));
  return mix(c,[120,100,80],Math.exp(-((lat/(1.2*DEG))**2))*.5*sstep(1.2,.6,e)); }});
G.dysnomia=W=>icyMoon(W,381,{f:4,c0:[70,68,66],c1:[112,108,104],craters:.2,cd:.15,cr:.02});

/* rings: 1-D radial profile (x = inner→outer edge), RGBA */
function ring(kind, W=1024){
  const c=document.createElement('canvas'); c.width=W; c.height=4; const ctx=c.getContext('2d');
  const N=makeNoise(kind==='saturn'?7:9); const img=ctx.createImageData(W,4);
  for(let x=0;x<W;x++){
    const t=x/(W-1); let a, col;
    const fine=N.fbm(t*80,1.3,2.1,4), micro=N.n3(t*600,3,4);
    if(kind==='saturn'){
      // D(faint) · C(dusky) · B(bright, dense) · Cassini division · A ring with Encke gap · F ring
      if(t<.07){ a=.05; col=[150,140,125]; }
      else if(t<.27){ a=.18+.18*fine; col=[150,138,120]; }
      else if(t<.6){ a=.78+.22*fine; col=mix([220,200,160],[240,226,190],fine); }
      else if(t<.66){ a=.05+.06*fine; col=[120,110,100]; }
      else if(t<.93){ a=.52+.25*fine; col=[206,190,158]; if(t>.885&&t<.895) a=.06; }
      else if(t>.965&&t<.975){ a=.5; col=[220,210,190]; }
      else { a=0; col=[0,0,0]; }
      a*=.85+.3*micro;
    } else { // Uranus: thin dark rings, epsilon ring outermost
      a=0; col=[170,186,196];
      for(const r of [.15,.25,.33,.42,.5,.58]) if(Math.abs(t-r)<.006) a=.35;
      if(Math.abs(t-.9)<.02) a=.7;
    }
    const k=x*4; for(let y=0;y<4;y++){ const j=k+y*W*4; img.data[j]=col[0]; img.data[j+1]=col[1]; img.data[j+2]=col[2]; img.data[j+3]=clamp01(a)*255; }
  }
  ctx.putImageData(img,0,0); return c;
}

window.StarTex = {
  makeNoise,
  keys:Object.keys(G),
  generate:(key,W=512)=>G[key](W),
  ring,
  ringRadii:{ saturn:[1.11,2.33], uranus:[1.55,2.05] }  // inner/outer in planet radii
};
})();

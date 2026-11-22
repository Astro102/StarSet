/* StarSet eclipse geometry — Moon's shadow on Earth (solar) and Earth's shadow on the Moon (lunar). Uses Astronomy Engine. */
(function(){
const A=(typeof window!=='undefined'?window:global).Astronomy;
const AU=149597870.7, RE=6378.137, RM=1737.4, RS=695700;
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z, sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z}), len=a=>Math.sqrt(dot(a,a));
const scale=(a,k)=>({x:a.x*k,y:a.y*k,z:a.z*k}), add=(a,b)=>({x:a.x+b.x,y:a.y+b.y,z:a.z+b.z});
/* where is the Moon's shadow on Earth at `date`? returns centre lat/lon, umbra & penumbra radii (km), and whether the axis hits Earth */
function solarShadow(date){
  const t=A.MakeTime(date), S=A.GeoVector('Sun',t,true), M=A.GeoVector('Moon',t,true);
  const sm=sub(M,S), D=len(sm), u=scale(sm,1/D), R=RE/AU, mu=dot(M,u), disc=mu*mu-(dot(M,M)-R*R);
  let P, hit=disc>=0, k;
  if(hit){ k=-mu-Math.sqrt(disc); P=add(M,scale(u,k)); }
  else { k=-mu; const c=add(M,scale(u,k)); P=scale(c,R/len(c)); }     // nearest point of the axis, pushed to the surface
  const d=k*AU, Dk=D*AU;
  const umbra=RM-d*(RS-RM)/Dk, pen=RM+d*(RS+RM)/Dk;
  const ob=A.VectorObserver(new A.Vector(P.x,P.y,P.z,t),false);
  return {lat:ob.latitude, lon:ob.longitude, hit, umbraKm:umbra, penKm:pen, annular:umbra<0};
}
/* path of the shadow centre between t0 and t1 */
function solarPath(t0,t1,stepMin=2){ const pts=[]; for(let ms=t0.getTime();ms<=t1.getTime();ms+=stepMin*60e3){ const s=solarShadow(new Date(ms)); if(s.hit) pts.push([s.lon,s.lat,ms,Math.abs(s.umbraKm)]); } return pts; }
/* sub-lunar point (where the Moon is overhead) */
function subPoint(body,date){ const t=A.MakeTime(date), v=A.GeoVector(body,t,true); const n=len(v), R=RE/AU; const ob=A.VectorObserver(new A.Vector(v.x/n*R,v.y/n*R,v.z/n*R,t),false); return {lat:ob.latitude,lon:ob.longitude}; }
/* Earth's shadow at the Moon, as angles seen from Earth's centre (degrees) */
function lunarShadow(date){
  const t=A.MakeTime(date), S=A.GeoVector('Sun',t,true), M=A.GeoVector('Moon',t,true);
  const ds=len(S)*AU, dm=len(M)*AU;
  const pm=Math.asin(RE/dm)/Math.PI*180, ps=Math.asin(RE/ds)/Math.PI*180, ss=Math.asin(RS/ds)/Math.PI*180, sm=Math.asin(RM/dm)/Math.PI*180;
  const umbra=1.02*(pm+ps-ss), pen=1.02*(pm+ps+ss);           // Danjon-style 2% atmospheric enlargement
  const anti=scale(S,-1/len(S)), mv=scale(M,1/len(M)); const sep=Math.acos(Math.max(-1,Math.min(1,dot(anti,mv))))/Math.PI*180;
  return {sepDeg:sep, umbraDeg:umbra, penDeg:pen, moonRadDeg:sm};
}
const E={solarShadow,solarPath,subPoint,lunarShadow,RE,RM,RS,AU};
if(typeof window!=='undefined') window.EclipseMath=E; else module.exports=E;
})();

/* Extracts the body data (planets, moons, dwarfs, spacecraft, comets) from simulation.html into kb.json for Astro Lite.
   Run from the repo root: node tools/astro-lite/kb.js */
const fs=require('fs'), vm=require('vm'), path=require('path'); const ROOT=path.join(__dirname,'..','..');
const s=fs.readFileSync(path.join(ROOT,'simulation.html'),'utf8');
const cut=(a,endMarker)=>{ const i=s.indexOf(a); const j=s.indexOf(endMarker,i); return s.slice(i,j); };
const seg=(a,b)=>{ const i=s.indexOf(a); const j=s.indexOf('\n];',s.indexOf(b,i))+3; return s.slice(i,j).replace(/\bconst\b/g,'var'); };
const parts=[seg('const PLANETS = [','const SATS = ['), s.slice(s.indexOf('const CRAFT=['),s.indexOf('const COMETS=[')).replace(/\bconst\b/g,'var').replace(/var SPECIAL=\[/,'var SPECIAL=['), seg('const COMETS=[','const COMETS=[')];
const stub=new Proxy(function(){return stub;},{get:()=>stub,apply:()=>stub,construct:()=>stub}); const ctx={DEG:Math.PI/180, THREE:stub, StarTex:stub, Math}; vm.createContext(ctx);
for(const src of parts){ try{ vm.runInContext(src,ctx); }catch(e){ console.error('ERR',e.message, src.slice(0,60)); } }
const pick=(o,ks)=>Object.fromEntries(ks.filter(k=>o[k]!=null).map(k=>[k,o[k]]));
const K=['key','name','type','diam','dims','mass','g','rotH','dayH','temp','moons','a','P','dist','parent','found','desc','fact','status','launch'];
const out=[];
for(const p of ctx.PLANETS) out.push({...pick(p,K),kind:'planet'});
out.push({...pick(ctx.SUN,K),kind:'sun'}); out.push({...pick(ctx.MOON,K),kind:'moon',parent:'earth'});
for(const d of ctx.DWARFS) out.push({...pick(d,K),a:d.el&&d.el.a,P:d.el?Math.round(365.256*Math.pow(d.el.a,1.5)):undefined,kind:'dwarf'});
if(ctx.CHARON) out.push({...pick(ctx.CHARON,K),kind:'moon',parent:'pluto'});
for(const m of ctx.SATS||[]) out.push({...pick(m,K),dist:m.a,a:undefined,kind:'moon'});
for(const c of [...(ctx.CRAFT||[]),...(ctx.SPECIAL||[])]) out.push({...pick(c,K),kind:'craft',a:undefined,P:undefined});
for(const c of ctx.COMETS||[]) out.push({...pick(c,K),kind:'comet',a:(c.el&&c.el.a)||c.a,P:undefined});
console.log(out.length, out.map(o=>o.key).join(' '));
fs.writeFileSync(path.join(__dirname,'kb.json'),JSON.stringify(out));

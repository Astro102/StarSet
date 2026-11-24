/* StarSet shared layer — loaded on every page.
   · Explorer passport: stamps saved in this browser (localStorage), no login.
   · Lesson player ("Teacher mode"): a step-by-step bar that walks a class through several pages.
   · Share sheet: copy link, WhatsApp, the phone's own share menu, and a QR code for the classroom projector. */
(function(){
'use strict';
if(window.StarSet) return;
const LS={ get(k,d){ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } },
  set(k,v){ try{ v==null?localStorage.removeItem(k):localStorage.setItem(k,JSON.stringify(v)); }catch(e){} } };
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PAGE=(location.pathname.split('/').pop()||'index.html')||'index.html';

/* ---------- styles (all prefixed ss-) ---------- */
const css=`
.ss-toast{position:fixed;left:50%;top:18px;transform:translate(-50%,-140%);z-index:9500;display:flex;align-items:center;gap:12px;padding:10px 18px 10px 10px;border-radius:999px;
 background:rgba(10,14,26,.94);border:1px solid rgba(255,181,71,.55);color:#eef3f9;font:500 14px/1.3 Inter,'Exo 2',system-ui,sans-serif;box-shadow:0 12px 34px rgba(0,0,0,.55);
 transition:transform .45s cubic-bezier(.2,.9,.3,1.2);text-decoration:none;max-width:calc(100vw - 24px)}
.ss-toast.on{transform:translate(-50%,0)} .ss-toast b{color:#ffb547}
.ss-stamp{flex:none;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;font:700 11px Inter,sans-serif;color:#1b1100;background:radial-gradient(circle at 35% 30%,#ffe2ad,#ffb547 60%,#c07a14);box-shadow:0 0 0 2px rgba(255,181,71,.35)}
.ss-lesson{position:fixed;left:16px;bottom:var(--ss-lesson-b,16px);z-index:8800;width:min(460px,calc(100vw - 32px));padding:14px 16px 12px;border-radius:16px;
 background:rgba(8,12,22,.95);border:1px solid rgba(95,216,255,.45);color:#eef3f9;font:400 16px/1.45 Inter,'Exo 2',system-ui,sans-serif;box-shadow:0 16px 40px rgba(0,0,0,.6)}
.ss-lesson .ss-k{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#5fd8ff}
.ss-lesson .ss-k span{flex:1} .ss-lesson h3{margin:4px 0 6px;font-size:18px;font-weight:700}
.ss-lesson p{margin:0 0 12px;font-size:17px;color:#dce6f2}
.ss-lesson .ss-row{display:flex;gap:8px;align-items:center}
.ss-lesson .ss-dots{flex:1;display:flex;gap:5px} .ss-lesson .ss-dots i{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.2)} .ss-lesson .ss-dots i.on{background:#5fd8ff}
.ss-btn{min-height:44px;padding:0 16px;border-radius:10px;border:1px solid rgba(150,190,235,.35);background:rgba(255,255,255,.04);color:#eef3f9;font:600 15px Inter,'Exo 2',sans-serif;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;text-decoration:none}
.ss-btn:hover{border-color:rgba(150,190,235,.7)} .ss-btn.pri{background:#ffb547;border-color:#ffb547;color:#1b1100}
.ss-x{width:36px;height:36px;border-radius:8px;border:0;background:none;color:#a3b1c4;font-size:18px;cursor:pointer}
.ss-x:hover{color:#fff;background:rgba(255,255,255,.08)}
.ss-lesson.min p,.ss-lesson.min h3{display:none}
.ss-modal{position:fixed;inset:0;z-index:9600;display:grid;place-items:center;padding:16px;background:rgba(0,0,0,.6);backdrop-filter:blur(4px)}
.ss-modal[hidden]{display:none}
.ss-sheet{width:min(420px,100%);border-radius:18px;padding:20px;background:#0b1020;border:1px solid rgba(150,190,235,.3);color:#eef3f9;font:400 15px/1.5 Inter,'Exo 2',system-ui,sans-serif;box-shadow:0 24px 60px rgba(0,0,0,.6)}
.ss-sheet h3{margin:0;font-size:19px;flex:1} .ss-sheet .ss-head{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.ss-sheet .ss-sub{color:#a3b1c4;font-size:14px;margin:0 0 14px}
.ss-sheet input{width:100%;box-sizing:border-box;min-height:44px;padding:0 12px;border-radius:10px;border:1px solid rgba(150,190,235,.3);background:#060914;color:#eef3f9;font:14px Inter,monospace;margin-bottom:12px}
.ss-sheet .ss-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.ss-qr{margin-top:14px;display:none;justify-content:center;padding:14px;border-radius:12px;background:#fff} .ss-qr.on{display:flex} .ss-qr svg,.ss-qr img{width:220px;height:220px}
.ss-lesson[data-page="planets.html"]{left:auto;right:16px;top:76px;bottom:auto}
.ss-lesson[data-page="simulation.html"]{bottom:74px} .ss-lesson[data-page="sky.html"]{bottom:84px}
@media (max-width:560px){ .ss-lesson[data-page="planets.html"]{top:62px;bottom:auto} .ss-lesson[data-page="simulation.html"]{bottom:112px} .ss-lesson{left:8px;right:8px;width:auto;bottom:var(--ss-lesson-bm,var(--ss-lesson-b,12px))} .ss-lesson p{font-size:15px} }
@media print{ .ss-toast,.ss-lesson,.ss-modal{display:none!important} }`;
const st=document.createElement('style'); st.textContent=css; (document.head||document.documentElement).appendChild(st);
const ready=f=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',f):f();

/* ======================= Explorer passport ======================= */
const STAMPS=[
  ['sun','Sun','Visit the Sun in 3D'],['mercury','Mercury','Visit Mercury in 3D or on the Planets journey'],['venus','Venus','Visit Venus in 3D or on the Planets journey'],
  ['earth','Earth','Visit Earth in 3D or on the Planets journey'],['moon','Moon','Fly to the Moon in 3D'],['mars','Mars','Visit Mars in 3D or on the Planets journey'],
  ['jupiter','Jupiter','Visit Jupiter in 3D or on the Planets journey'],['saturn','Saturn','Visit Saturn in 3D or on the Planets journey'],['uranus','Uranus','Visit Uranus in 3D or on the Planets journey'],
  ['neptune','Neptune','Reach Neptune in 3D or on the Planets journey'],['sky','Sky watcher','Open Tonight’s Sky'],['quiz','Quiz ace','Score 7 or more in the Space quiz']
].map(([id,name,how])=>({id,name,how,short:id==='sky'?'Sky':id==='quiz'?'Quiz':name.slice(0,3)}));
const got=()=>LS.get('starset.passport',{})||{};
let toastEl=null, toastT=0;
function toast(html,href){
  if(!toastEl){ toastEl=document.createElement('a'); toastEl.className='ss-toast'; toastEl.setAttribute('role','status'); toastEl.setAttribute('aria-live','polite'); document.body.appendChild(toastEl); }
  toastEl.href=href||'index.html#passport'; toastEl.innerHTML=html; requestAnimationFrame(()=>toastEl.classList.add('on'));
  clearTimeout(toastT); toastT=setTimeout(()=>toastEl.classList.remove('on'),3800); }
function stamp(id){ id=String(id||'').toLowerCase(); const s=STAMPS.find(x=>x.id===id); if(!s) return false;
  const P=got(); if(P[id]) return false; P[id]=Date.now(); LS.set('starset.passport',P);
  const n=Object.keys(P).filter(k=>STAMPS.some(x=>x.id===k)).length;
  ready(()=>toast(`<span class="ss-stamp" aria-hidden="true">${esc(s.short)}</span><span>Passport stamp: <b>${esc(s.name)}</b> · ${n}/${STAMPS.length}</span>`));
  try{ dispatchEvent(new CustomEvent('starset:stamp',{detail:{id,count:n}})); }catch(e){}
  return true; }
const passport={ list:()=>{ const P=got(); return STAMPS.map(s=>({...s,at:P[s.id]||0})); }, count:()=>{ const P=got(); return STAMPS.filter(s=>P[s.id]).length; }, total:STAMPS.length,
  reset:()=>{ LS.set('starset.passport',null); try{ dispatchEvent(new CustomEvent('starset:stamp',{detail:{reset:true}})); }catch(e){} } };

/* ======================= Lesson player (Teacher mode) ======================= */
const LESSONS=[
 {id:'scale',title:'How big is the Solar System?',meta:'6 steps · about 25 min · ages 9+',blurb:'Distance, light-time and true scale, from the Sun to Neptune.',steps:[
  {url:'planets.html',say:'Scroll down from the Sun. Earth is about one screen away — 150 million km. Before going further, ask the class to guess how far Neptune is.'},
  {url:'planets.html#neptune',say:'Neptune is 30 times farther from the Sun than Earth. Sunlight takes about 4 hours to get here.'},
  {url:'scale.html',say:'Put the Sun on your school building. Where would Earth land? And Neptune?'},
  {url:'light.html',say:'Send a message to Mars at the speed of light. Ask: why can’t we drive a Mars rover live with a joystick?'},
  {url:'simulation.html#truescale',say:'True Scale shows real sizes and real distances together. Notice how tiny the planets are next to the gaps.'},
  {url:'simulation.html#quiz',say:'Finish with the 10-question quiz. Score 7 or more to earn the Quiz ace stamp.'}]},
 {id:'moon',title:'The Moon, its phases and eclipses',meta:'5 steps · about 20 min · ages 8+',blurb:'Why the Moon changes shape, the tithi, and how eclipses line up.',steps:[
  {url:'simulation.html#moon',say:'Fly to the Moon. The same side always faces Earth — ask the class why they think that is.'},
  {url:'sky.html',say:'Find the Moon in tonight’s sky for your city. Is it up right now? Which phase is it?'},
  {url:'sky.html#panchang',say:'A tithi is the Moon’s phase in the Panchang: a new tithi begins every time the Moon moves another 12° away from the Sun.'},
  {url:'eclipse.html',say:'An eclipse happens when the Sun, Earth and Moon line up. Watch the shadow move across the globe.'},
  {url:'simulation.html#quiz',say:'Quick quiz to finish. Score 7 or more to earn the Quiz ace stamp.'}]},
 {id:'planets',title:'Meet the planets',meta:'6 steps · about 30 min · ages 7+',blurb:'A narrated tour, then a closer look at the giants.',steps:[
  {url:'simulation.html#tour-grand',say:'Start the narrated Grand Tour. Pause at each planet and ask one question about it.'},
  {url:'simulation.html#jupiter',say:'Jupiter is more than twice as massive as all the other planets put together. Its Great Red Spot is a storm wider than Earth.'},
  {url:'simulation.html#saturn',say:'Saturn’s rings are billions of chunks of ice, yet mostly only tens of metres thick. Turn the view — how thin do they look edge-on?'},
  {url:'simulation.html#uranus',say:'Uranus is knocked onto its side. Ask: what would seasons be like there?'},
  {url:'planets.html#earth',say:'Back to Earth on the true-distance journey: the only place we know of with life and liquid oceans.'},
  {url:'simulation.html#quiz',say:'End with the quiz. Score 7 or more to earn the Quiz ace stamp.'}]}
];
const pageOf=u=>u.split('#')[0]||'index.html';
let barEl=null;
function lessonState(){ const s=LS.get('starset.lesson',null); if(!s) return null; const L=LESSONS.find(x=>x.id===s.id); return L&&s.i>=0&&s.i<L.steps.length?{L,i:s.i,min:!!s.min}:null; }
function goStep(L,i){ LS.set('starset.lesson',{id:L.id,i}); const u=L.steps[i].url, here=PAGE===pageOf(u);
  if(here&&u.includes('#')){ if(location.hash==='#'+u.split('#')[1]) { try{ dispatchEvent(new HashChangeEvent('hashchange')); }catch(e){} } else location.hash=u.split('#')[1]; renderBar(); }
  else if(here){ renderBar(); }
  else location.href=u; }
function renderBar(){ const s=lessonState(); if(!s){ if(barEl){ barEl.remove(); barEl=null; } return; }
  const {L,i}=s, step=L.steps[i], last=i===L.steps.length-1;
  if(!barEl){ barEl=document.createElement('section'); barEl.className='ss-lesson'; barEl.dataset.page=PAGE; barEl.setAttribute('aria-label','Lesson'); document.body.appendChild(barEl); }
  barEl.classList.toggle('min',s.min);
  barEl.innerHTML=`<div class="ss-k"><span>Lesson · step ${i+1} of ${L.steps.length}</span>
    <button class="ss-x" data-a="min" aria-label="${s.min?'Show':'Hide'} lesson notes">${s.min?'▴':'▾'}</button><button class="ss-x" data-a="end" aria-label="End lesson">✕</button></div>
    <h3>${esc(L.title)}</h3><p>${esc(step.say)}</p>
    <div class="ss-row"><div class="ss-dots" aria-hidden="true">${L.steps.map((_,k)=>`<i class="${k<=i?'on':''}"></i>`).join('')}</div>
    <button class="ss-btn" data-a="prev" ${i?'':'disabled style="opacity:.4"'}>‹ Back</button>
    <button class="ss-btn pri" data-a="next">${last?'Finish ✓':'Next ›'}</button></div>`;
  barEl.onclick=e=>{ const a=e.target.closest('[data-a]'); if(!a) return; const k=a.dataset.a;
    if(k==='end'){ LS.set('starset.lesson',null); renderBar(); }
    else if(k==='min'){ LS.set('starset.lesson',{id:L.id,i,min:!s.min}); renderBar(); }
    else if(k==='prev'&&i>0) goStep(L,i-1);
    else if(k==='next'){ if(last){ LS.set('starset.lesson',null); renderBar(); toast(`<span class="ss-stamp" aria-hidden="true">✓</span><span>Lesson complete: <b>${esc(L.title)}</b></span>`,'index.html#teach'); } else goStep(L,i+1); } }; }
const lesson={ list:LESSONS, start:id=>{ const L=LESSONS.find(x=>x.id===id); if(L) goStep(L,0); }, stop:()=>{ LS.set('starset.lesson',null); renderBar(); }, current:()=>{ const s=lessonState(); return s?{id:s.L.id,step:s.i}:null; } };

/* ======================= Share sheet ======================= */
let modal=null;
function loadQR(){ return window.qrcode?Promise.resolve(window.qrcode):new Promise((res,rej)=>{ const s=document.createElement('script'); s.src='lib/qrcode.js'; s.onload=()=>res(window.qrcode); s.onerror=rej; document.head.appendChild(s); }); }
function share(o={}){ const url=new URL(o.url||location.href,location.href).href, title=o.title||document.title, text=o.text||title;
  if(!modal){ modal=document.createElement('div'); modal.className='ss-modal'; modal.hidden=true; modal.setAttribute('role','dialog'); modal.setAttribute('aria-modal','true'); modal.setAttribute('aria-label','Share');
    modal.addEventListener('click',e=>{ if(e.target===modal||e.target.closest('[data-a="close"]')) close(); });
    addEventListener('keydown',e=>{ if(e.key==='Escape'&&modal&&!modal.hidden) close(); }); document.body.appendChild(modal); }
  const close=()=>{ modal.hidden=true; };
  modal.innerHTML=`<div class="ss-sheet"><div class="ss-head"><h3>${esc(o.heading||'Share this view')}</h3><button class="ss-x" data-a="close" aria-label="Close">✕</button></div>
    <p class="ss-sub">${esc(o.sub||'Anyone who opens this link sees exactly what you’re looking at.')}</p>
    <label class="ss-sub" style="display:block;margin:0 0 4px" for="ssUrl">Link</label><input id="ssUrl" readonly value="${esc(url)}">
    <div class="ss-grid"><button class="ss-btn pri" data-s="copy">Copy link</button><a class="ss-btn" data-s="wa" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(text+' '+url)}">WhatsApp</a>
    <button class="ss-btn" data-s="qr">QR for class</button>${navigator.share?'<button class="ss-btn" data-s="native">More…</button>':'<a class="ss-btn" data-s="mail" href="mailto:?subject='+encodeURIComponent(title)+'&body='+encodeURIComponent(text+'\n'+url)+'">Email</a>'}</div>
    <div class="ss-qr" id="ssQr" aria-label="QR code for this link"></div></div>`;
  modal.querySelector('.ss-grid').onclick=async e=>{ const b=e.target.closest('[data-s]'); if(!b) return; const k=b.dataset.s;
    if(k==='copy'){ const inp=modal.querySelector('#ssUrl'); try{ await navigator.clipboard.writeText(url); }catch(_){ inp.select(); try{ document.execCommand('copy'); }catch(__){} } b.textContent='Copied ✓'; setTimeout(()=>{ b.textContent='Copy link'; },1800); }
    if(k==='native'){ try{ await navigator.share({title,text,url}); }catch(_){} }
    if(k==='qr'){ const box=modal.querySelector('#ssQr'); if(box.classList.toggle('on')&&!box.firstChild){ try{ const Q=await loadQR(); const q=Q(0,'M'); q.addData(url); q.make(); box.innerHTML=q.createSvgTag({cellSize:4,margin:2,scalable:true}); }catch(_){ box.textContent='QR code could not load.'; box.style.color='#333'; } } } };
  modal.hidden=false; setTimeout(()=>modal.querySelector('[data-s="copy"]').focus(),30); }


/* ======================= Shared top bar: Explore panel + search ======================= */
const NAVG=[['Explore the Solar System',[['simulation.html','3D Solar System','Every planet, moon and spacecraft at today’s position.'],['simulation.html#truescale','True Scale','Real sizes and real distances, together.'],['planets.html','Planets at true distance','Scroll from the Sun to Eris.'],['earth.html','Earth explorer','From orbit down to street level.']]],
  ['Look up',[['sky.html','Tonight’s sky','Live sky for your city, with phone compass.'],['sky.html#panchang','Panchang in the sky','Tithi, nakshatra and rashi on the real sky.'],['eclipse.html','Eclipse twin view','The shadow on the globe and the view from your city.'],['story.html','Sky poster','A printable poster of the sky on any date.']]],
  ['How big & how far',[['scale.html','Solar system on your street','Put the Sun on your building and walk to the planets.'],['light.html','Light-time messages','Watch a message cross the Solar System at light speed.']]],
  ['Learn',[['simulation.html#tours','Guided tours','Narrated, in English, हिन्दी, मराठी and मारवाड़ी.'],['simulation.html#quiz','Space quiz','Ten questions; each answer flies you to the planet.'],['index.html#teach','Lessons for teachers','Step-by-step, projector-friendly.'],['about.html','How StarSet is built','Architecture, data and accuracy checks.']]]];
const COLS={sun:'#ffb547',mercury:'#a9a39b',venus:'#e3c27a',earth:'#4f8fd8',moon:'#c9c9c9',mars:'#c8643c',jupiter:'#d6a77a',saturn:'#e6cf96',uranus:'#9fdbe3',neptune:'#4a6fe0',pluto:'#d8b48a'};
const MOONOF={phobos:'Mars',deimos:'Mars',io:'Jupiter',europa:'Jupiter',ganymede:'Jupiter',callisto:'Jupiter',mimas:'Saturn',enceladus:'Saturn',tethys:'Saturn',dione:'Saturn',rhea:'Saturn',titan:'Saturn',iapetus:'Saturn',miranda:'Uranus',ariel:'Uranus',umbriel:'Uranus',titania:'Uranus',oberon:'Uranus',triton:'Neptune',dysnomia:'Eris'};
const BOD=[['mercury','Mercury','Terrestrial planet'],['venus','Venus','Terrestrial planet'],['earth','Earth','Terrestrial planet'],['mars','Mars','Terrestrial planet'],['jupiter','Jupiter','Gas giant'],['saturn','Saturn','Gas giant'],['uranus','Uranus','Ice giant'],['neptune','Neptune','Ice giant'],['sun','Sun','Our star'],['moon','Moon','Earth’s moon · Chandra'],['ceres','Ceres','Dwarf planet'],['pluto','Pluto','Dwarf planet'],['eris','Eris','Dwarf planet'],['haumea','Haumea','Dwarf planet'],['makemake','Makemake','Dwarf planet'],['charon','Charon','Moon of Pluto'],
  ...Object.keys(MOONOF).map(k=>[k,k[0].toUpperCase()+k.slice(1)]),['voyager1','Voyager 1','Spacecraft'],['voyager2','Voyager 2','Spacecraft'],['newhorizons','New Horizons','Spacecraft'],['clipper','Europa Clipper','Spacecraft'],['parker','Parker Solar Probe','Spacecraft'],['jwst','James Webb Space Telescope','Space telescope'],['halley','Halley’s Comet','Comet'],['encke','Comet Encke','Comet'],['67p','67P/Churyumov–Gerasimenko','Comet'],['halebopp','Comet Hale–Bopp','Comet']];
const ALTN={sun:'surya suraj',moon:'chand chandra',mars:'mangal',jupiter:'guru brihaspati',saturn:'shani',venus:'shukra',mercury:'budh',earth:'prithvi dharti',uranus:'arun',neptune:'varun'};
let IDX=null;
function index(){ if(IDX) return IDX; IDX=[...BOD.map(([k,n,t])=>({n,sub:t||('Moon of '+MOONOF[k]),url:'simulation.html#'+k,alt:ALTN[k]||'',ic:n.slice(0,2),col:COLS[k]||'#7d8ca3'})),
  ...NAVG.flatMap(([,L])=>L.map(([url,n,sub])=>({n,sub,url,alt:'',ic:'→',col:'#5fd8ff'}))),{n:'Home',sub:'Tonight’s sky for your city, passport, lessons',url:'index.html',alt:'home passport stamps tonight',ic:'→',col:'#5fd8ff'},
  ...['Orion','Sirius','Polaris','Betelgeuse','Vega','Scorpius','Ursa Major','Cassiopeia','Pleiades','Andromeda'].map(n=>({n,sub:'Find it in tonight’s sky',url:'sky.html#find='+encodeURIComponent(n),alt:'',ic:'★',col:'#ffe2ad'}))]; return IDX; }
function initNav(){ const bar=document.querySelector('.ssn'); if(!bar) return;
  const here=PAGE;
  bar.querySelectorAll('.ssn-links a').forEach(a=>{ if(a.getAttribute('href')===here) a.setAttribute('aria-current','page'); });
  const panel=document.createElement('div'); panel.className='ssn-panel'; panel.id='ssnPanel'; panel.hidden=true;
  panel.innerHTML='<div class="g">'+NAVG.map(([h,L])=>`<section><h4>${esc(h)}</h4>${L.map(([u,b,s])=>`<a href="${u}"${u===here?' aria-current="page"':''}><b>${esc(b)}</b><span>${esc(s)}</span></a>`).join('')}</section>`).join('')+
    '<section class="mob"><h4>StarSet</h4><a href="index.html"><b>Home</b><span>Tonight from your city, passport, lessons.</span></a><a href="simulation.html"><b>Launch 3D</b><span>The Solar System, live.</span></a></section></div>';
  document.body.appendChild(panel);
  const btns=[...bar.querySelectorAll('.ssn-ex,.ssn-menu')];
  const setP=on=>{ panel.hidden=!on; btns.forEach(b=>b.setAttribute('aria-expanded',on)); };
  btns.forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); setP(panel.hidden); }));
  document.addEventListener('click',e=>{ if(!panel.hidden&&(!panel.contains(e.target)||e.target.closest('a'))) setP(false); });
  /* search */
  const q=document.createElement('div'); q.className='ssn-q'; q.hidden=true; q.setAttribute('role','dialog'); q.setAttribute('aria-label','Search StarSet');
  q.innerHTML='<div class="box"><label><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#a3b1c4" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input type="search" placeholder="Search planets, moons, stars, pages…" aria-label="Search" autocomplete="off"><button class="ss-x" type="button" aria-label="Close">✕</button></label><div class="res" role="listbox"></div><div class="hint">Try “Saturn”, “shani”, “Orion” or “eclipse”.</div></div>';
  document.body.appendChild(q);
  const inp=q.querySelector('input'), res=q.querySelector('.res'), hint=q.querySelector('.hint'); let hits=[], hl=0;
  const openQ=()=>{ setP(false); q.hidden=false; inp.value=''; res.innerHTML=''; hint.hidden=false; inp.focus(); setTimeout(()=>{ if(document.activeElement!==inp) inp.focus(); },60); }, closeQ=()=>{ q.hidden=true; };
  const draw=()=>{ res.innerHTML=hits.map((h,i)=>`<a role="option" href="${esc(h.url)}" class="${i===hl?'hl':''}"><i style="background:${h.col}" aria-hidden="true">${esc(h.ic)}</i><span><b>${esc(h.n)}</b><small>${esc(h.sub)}</small></span></a>`).join(''); };
  inp.addEventListener('input',()=>{ const v=inp.value.trim().toLowerCase(); hint.hidden=!!v; if(!v){ hits=[]; res.innerHTML=''; return; }
    hits=index().map(x=>{ const n=x.n.toLowerCase(), a=x.alt.toLowerCase(); return {x,s:n.startsWith(v)?0:a.split(' ').some(w=>w.startsWith(v))?1:n.includes(v)?2:a.includes(v)?3:9}; }).filter(o=>o.s<9).sort((a,b)=>a.s-b.s).slice(0,7).map(o=>o.x);
    hits.push({n:`Find “${inp.value.trim()}” in tonight’s sky`,sub:'Stars, constellations, planets',url:'sky.html#find='+encodeURIComponent(inp.value.trim()),ic:'★',col:'#ffe2ad'}); hl=0; draw(); });
  inp.addEventListener('keydown',e=>{ if(e.key==='Escape') closeQ(); if(!hits.length) return; if(e.key==='ArrowDown'){ hl=(hl+1)%hits.length; draw(); e.preventDefault(); } if(e.key==='ArrowUp'){ hl=(hl-1+hits.length)%hits.length; draw(); e.preventDefault(); } if(e.key==='Enter'){ e.preventDefault(); location.href=hits[hl].url; closeQ(); } });
  q.addEventListener('click',e=>{ if(e.target===q||e.target.closest('.ss-x')||e.target.closest('a')) closeQ(); });
  bar.querySelectorAll('.ssn-search').forEach(b=>b.addEventListener('click',openQ));
  const k=bar.querySelector('.ssn-search kbd'); if(k&&!/Mac|iPhone|iPad/.test(navigator.platform)) k.textContent='Ctrl K';
  addEventListener('keydown',e=>{ if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){ e.preventDefault(); q.hidden?openQ():closeQ(); } else if(e.key==='Escape'&&!panel.hidden) setP(false); });
}
window.StarSet={ stamp, passport, lesson, share, toast, LS };
ready(()=>{ renderBar(); initNav(); if(PAGE==='sky.html') stamp('sky'); });
})();

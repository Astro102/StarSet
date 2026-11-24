/* StarSet · "Ask Astro" — an AI space guide on every page.
   Uses the artifact's `sample` capability (Claude) for answers, `dictation` for the mic and `tts` to read answers aloud.
   Pages can expose window.__starsetChat = { context(), show(key,trueScale), find(name) } to give Astro context and hands. */
(()=>{
  if(window.__astro) return; window.__astro=true;
  const PAGE=(location.pathname.split('/').pop()||'index.html').replace(/\?.*/,'')||'index.html';
  const PAGES={ 'index.html':'Home · tonight\'s sky for your city, ways in, Explorer passport, lessons for teachers', 'planets.html':'Planets · scroll journey from the Sun to Eris at true distance', 'simulation.html':'3D Solar System (mission control)', 'sky.html':"Tonight's Sky (Stellarium-style live sky)", 'earth.html':'Earth explorer globe', 'eclipse.html':'Eclipse twin view', 'scale.html':'Solar system on your street', 'light.html':'Light-time messages', 'story.html':'Your sky story poster', 'about.html':'How StarSet is built' };
  const BODY_KEYS=['sun','mercury','venus','earth','moon','mars','phobos','deimos','ceres','jupiter','io','europa','ganymede','callisto','saturn','mimas','enceladus','tethys','dione','rhea','titan','iapetus','uranus','miranda','ariel','umbriel','titania','oberon','neptune','triton','pluto','charon','haumea','makemake','eris','dysnomia','halley','halebopp','encke','67p','voyager1','voyager2','newhorizons','parker','jwst','clipper'];
  const TS_KEYS=['sun','mercury','venus','earth','moon','mars','jupiter','saturn','uranus','neptune','pluto'];
  const ss={ get(k,d){ try{ const v=sessionStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } }, set(k,v){ try{ sessionStorage.setItem(k,JSON.stringify(v)); }catch(e){} } };

  /* ---------- styles ---------- */
  const fl=document.createElement('link'); fl.rel='stylesheet'; fl.href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap'; document.head.appendChild(fl);
  const css=document.createElement('style'); css.textContent=`
#astroFab{position:fixed;right:var(--ax-r,18px);bottom:var(--ax-b,18px);z-index:9000;display:none;align-items:center;gap:9px;height:48px;padding:0 18px 0 8px;border-radius:999px;border:1px solid rgba(140,190,255,.38);
  background:linear-gradient(180deg,rgba(22,30,46,.92),rgba(10,14,22,.92));color:#eef3fa;font:500 14px Inter,system-ui,sans-serif;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.45),0 0 0 1px rgba(0,0,0,.3);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);transition:transform .2s,box-shadow .2s,opacity .2s}
#astroFab.on{display:flex} #astroFab.nudge .ax-orb{animation:axn 1.4s 3 ease-out}
@keyframes axn{0%{box-shadow:0 0 0 0 rgba(124,182,255,.7)}100%{box-shadow:0 0 0 16px rgba(124,182,255,0)}} #astroFab:hover{transform:translateY(-2px);box-shadow:0 14px 34px rgba(0,0,0,.5),0 0 22px rgba(90,160,255,.25)}
#astroFab .ax-orb{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,#bfe2ff,#4d8dff 45%,#1b2f6b 80%);box-shadow:0 0 14px rgba(90,160,255,.6)}
#astroFab .ax-orb svg{width:18px;height:18px}
body.astro-open #astroFab{opacity:0;pointer-events:none}
#astro{position:fixed;right:18px;bottom:18px;z-index:9001;width:400px;height:min(620px,calc(100vh - 36px));display:flex;flex-direction:column;border-radius:14px;overflow:hidden;
  background:rgba(10,13,19,.94);border:1px solid rgba(255,255,255,.12);box-shadow:0 24px 60px rgba(0,0,0,.6);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);
  font:400 14px/1.55 Inter,system-ui,sans-serif;color:#e9edf3;transform-origin:100% 100%;transition:transform .22s cubic-bezier(.2,.8,.2,1),opacity .18s}
#astro[hidden]{display:flex;opacity:0;transform:scale(.92) translateY(10px);pointer-events:none;visibility:hidden}
#astro *{box-sizing:border-box} #astro [hidden]{display:none!important} #astro button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}
.ax-head{display:flex;align-items:center;gap:11px;padding:12px 12px 12px 14px;border-bottom:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,rgba(60,110,200,.12),transparent)}
.ax-head .ax-orb{width:36px;height:36px;border-radius:50%;flex:none;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,#bfe2ff,#4d8dff 45%,#1b2f6b 80%);box-shadow:0 0 14px rgba(90,160,255,.45)}
.ax-head .ax-orb svg{width:19px;height:19px}
.ax-title{flex:1;min-width:0} .ax-title b{display:block;font-weight:600;font-size:15px} .ax-title span{display:block;font-size:12px;color:#8a94a4}
.ax-ib{width:36px;height:36px;border-radius:8px;display:grid;place-items:center;color:#aeb8c6!important} .ax-ib:hover{background:rgba(255,255,255,.07);color:#fff!important}
.ax-ib svg{width:18px;height:18px}
.ax-log{flex:1;overflow-y:auto;padding:16px 14px 8px;display:flex;flex-direction:column;gap:12px;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.15) transparent}
.ax-m{max-width:88%;padding:10px 13px;border-radius:12px;word-wrap:break-word;overflow-wrap:anywhere}
.ax-m.u{align-self:flex-end;background:#2b5fd9;color:#fff;border-bottom-right-radius:4px}
.ax-m.a{align-self:flex-start;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.07);border-bottom-left-radius:4px}
.ax-m.a p{margin:0 0 8px} .ax-m.a p:last-child{margin:0} .ax-m.a ul,.ax-m.a ol{margin:4px 0 8px;padding-left:20px} .ax-m.a li{margin:2px 0} .ax-m.a b,.ax-m.a strong{color:#fff;font-weight:600}
.ax-m.a code{font-family:ui-monospace,monospace;font-size:12.5px;background:rgba(255,255,255,.08);padding:1px 5px;border-radius:4px}
.ax-m.err{border-color:rgba(255,120,100,.4);color:#ffc9bf}
.ax-act{display:flex;align-items:center;gap:6px;margin-top:6px;font-size:12px;color:#8a94a4}
.ax-act button{display:inline-flex;align-items:center;gap:5px;padding:4px 8px;border-radius:6px;color:#9fb3cc!important;min-height:28px} .ax-act button:hover{background:rgba(255,255,255,.07);color:#fff!important}
.ax-act button.on{color:#ffb547!important} .ax-act svg{width:14px;height:14px}
.ax-btns{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px} .ax-btns button{display:inline-flex;align-items:center;gap:6px;padding:7px 11px;border-radius:999px;border:1px solid rgba(140,190,255,.4)!important;background:rgba(124,182,255,.08)!important;color:#cfe2ff!important;font-size:12.5px!important;min-height:34px} .ax-btns button:hover{background:rgba(124,182,255,.18)!important}
.ax-did{align-self:flex-start;font-size:12px;color:#7cb6ff;display:flex;align-items:center;gap:6px;padding:0 4px}
.ax-dots{display:inline-flex;gap:4px;padding:4px 0} .ax-dots i{width:6px;height:6px;border-radius:50%;background:#7cb6ff;animation:axb 1s infinite ease-in-out} .ax-dots i:nth-child(2){animation-delay:.15s} .ax-dots i:nth-child(3){animation-delay:.3s}
@keyframes axb{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}
.ax-hello{padding:6px 2px 2px} .ax-hello h3{margin:0 0 6px;font:600 20px/1.3 Inter,system-ui,sans-serif} .ax-hello p{margin:0;color:#a7b0bd;font-size:13.5px}
.ax-sugs{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.ax-sugs button{padding:8px 12px;border-radius:999px;border:1px solid rgba(140,190,255,.28)!important;background:rgba(124,182,255,.06)!important;font-size:13px;color:#cfe2ff!important;text-align:left;min-height:36px}
.ax-sugs button:hover{background:rgba(124,182,255,.14)!important;border-color:rgba(140,190,255,.55)!important}
.ax-foot{padding:10px 12px 12px;border-top:1px solid rgba(255,255,255,.08)}
.ax-box{display:flex;align-items:flex-end;gap:6px;padding:6px 6px 6px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04)}
.ax-box:focus-within{border-color:rgba(124,182,255,.65);background:rgba(124,182,255,.05)}
.ax-box textarea{flex:1;resize:none;border:0;outline:0;background:none;color:#eef2f7;font:400 14px/1.45 Inter,system-ui,sans-serif;max-height:120px;padding:7px 0;min-height:22px}
.ax-box textarea::placeholder{color:#6f7a8a}
.ax-send,.ax-mic{width:36px;height:36px;border-radius:9px;display:grid;place-items:center;flex:none}
.ax-send{background:#2b5fd9!important;color:#fff!important} .ax-send:disabled{background:rgba(255,255,255,.08)!important;color:#6f7a8a!important;cursor:default}
.ax-send.stop{background:rgba(255,181,71,.18)!important;color:#ffb547!important}
.ax-mic{color:#aeb8c6!important} .ax-mic:hover{background:rgba(255,255,255,.07)} .ax-mic.on{color:#ff6b6b!important;background:rgba(255,107,107,.12)!important;animation:axp 1.2s infinite}
@keyframes axp{50%{box-shadow:0 0 0 5px rgba(255,107,107,.12)}}
.ax-send svg,.ax-mic svg{width:18px;height:18px}
.ax-note{margin-top:7px;font-size:11px;color:#6f7a8a;text-align:center}
@media (max-width:600px){
  #astroFab{height:46px;padding:0 6px;width:46px;justify-content:center;right:var(--ax-rm,12px);bottom:var(--ax-bm,12px)} #astroFab .ax-lbl{display:none}
  #astro{inset:0;width:auto;height:auto;border-radius:0;border:0;max-height:none}
  .ax-head{padding-top:max(12px,env(safe-area-inset-top))} .ax-foot{padding-bottom:max(12px,env(safe-area-inset-bottom))}
  .ax-box textarea{font-size:16px}
}
@media (orientation:landscape) and (max-height:500px){ #astroFab{height:40px;width:40px;padding:0;justify-content:center;right:var(--ax-rl,10px);bottom:var(--ax-bl,10px)} #astroFab .ax-orb{width:30px;height:30px} #astroFab .ax-lbl{display:none}
  #astro{top:8px;bottom:8px;right:8px;height:auto;width:min(420px,calc(100vw - 16px))} .ax-log{padding-top:10px} }
@media (prefers-reduced-motion:reduce){ #astro,#astroFab{transition:none} .ax-dots i{animation:none;opacity:.7} }
`; document.head.appendChild(css);

  /* ---------- per-page placement of the launcher (keeps clear of each page's own controls) ---------- */
  const POS={ // [desktop bottom, desktop right, phone bottom, phone right, landscape bottom, landscape right]
    'index.html':[18,18,12,12,10,10], 'planets.html':[96,18,150,12,64,10], 'simulation.html':[136,18,112,10,44,10], 'sky.html':[86,18,128,12,54,10], 'earth.html':[86,18,96,12,54,10],
    'eclipse.html':[96,18,120,12,60,10], 'scale.html':[18,18,12,12,10,10], 'light.html':[18,18,12,12,10,10], 'story.html':[18,18,12,12,10,10], 'about.html':[18,18,12,12,10,10] };
  const P=POS[PAGE]||POS['about.html'], rs=document.documentElement.style;
  [['--ax-b',0],['--ax-r',1],['--ax-bm',2],['--ax-rm',3],['--ax-bl',4],['--ax-rl',5]].forEach(([k,i])=>rs.setProperty(k,P[i]+'px'));

  /* ---------- markup ---------- */
  const ORB='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7z" fill="#fff"/><circle cx="18.5" cy="17.5" r="1.4" fill="#fff" opacity=".8"/><circle cx="6" cy="18" r="1" fill="#fff" opacity=".6"/></svg>';
  const IC={ close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    reset:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
    send:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    stop:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="7" y="7" width="10" height="10" rx="2"/></svg>',
    mic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/></svg>',
    spk:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13"/></svg>',
    copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 012-2h10"/></svg>',
    go:'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' };
  const fab=document.createElement('button'); fab.id='astroFab'; fab.setAttribute('aria-label','Ask Astro, the StarSet AI space guide'); fab.setAttribute('aria-haspopup','dialog');
  fab.innerHTML=`<span class="ax-orb">${ORB}</span><span class="ax-lbl">Ask Astro</span>`;
  const box=document.createElement('section'); box.id='astro'; box.hidden=true; box.setAttribute('role','dialog'); box.setAttribute('aria-label','Astro, the StarSet space guide');
  box.innerHTML=`<header class="ax-head"><span class="ax-orb">${ORB}</span><div class="ax-title"><b>Astro</b><span>Your StarSet space guide · AI</span></div>
    <button class="ax-ib" id="axReset" title="New chat" aria-label="Start a new chat">${IC.reset}</button><button class="ax-ib" id="axClose" title="Close (Esc)" aria-label="Close chat">${IC.close}</button></header>
    <div class="ax-log" id="axLog" aria-live="polite"></div>
    <div class="ax-foot"><div class="ax-box"><textarea id="axIn" rows="1" placeholder="Ask anything about space…" aria-label="Your question"></textarea>
      <button class="ax-mic" id="axMic" title="Speak" aria-label="Speak your question" hidden>${IC.mic}</button><button class="ax-send" id="axSend" aria-label="Send" disabled>${IC.send}</button></div>
      <div class="ax-note">Astro is an AI and can make mistakes. English, हिंदी, Hinglish — sab chalega.</div></div>`;
  const mount=()=>{ document.body.appendChild(fab); document.body.appendChild(box); };
  if(document.body) mount(); else addEventListener('DOMContentLoaded',mount);
  const $=id=>document.getElementById(id);

  /* ---------- state ---------- */
  let hist=ss.get('starset.astro.hist',[]);   // [{role,content,did?}]
  let busy=false, ctrl=null, sample=null, tts=null, dict=null, speakingEl=null, lite=false;

  /* ---------- tiny, safe markdown ---------- */
  const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function md(t){ const lines=esc(t).split('\n'); let out='', list=null;
    const inl=s=>s.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/(^|[^*])\*([^*\n]+)\*/g,'$1<i>$2</i>').replace(/`([^`]+)`/g,'<code>$1</code>');
    const close=()=>{ if(list){ out+=`</${list}>`; list=null; } };
    let para=[]; const flush=()=>{ if(para.length){ out+='<p>'+para.map(inl).join('<br>')+'</p>'; para=[]; } };
    for(const raw of lines){ const l=raw.trimEnd(); let m;
      if((m=l.match(/^\s*[-•*]\s+(.*)/))){ flush(); if(list!=='ul'){ close(); out+='<ul>'; list='ul'; } out+='<li>'+inl(m[1])+'</li>'; }
      else if((m=l.match(/^\s*\d+[.)]\s+(.*)/))){ flush(); if(list!=='ol'){ close(); out+='<ol>'; list='ol'; } out+='<li>'+inl(m[1])+'</li>'; }
      else if(!l.trim()){ flush(); close(); }
      else if((m=l.match(/^#{1,4}\s+(.*)/))){ flush(); close(); out+='<p><b>'+inl(m[1])+'</b></p>'; }
      else { close(); para.push(l); } }
    flush(); close(); return out; }
  const plain=t=>t.replace(/\*\*|`|^#+\s*/gm,'').replace(/^\s*[-•*]\s+/gm,'');

  /* ---------- rendering ---------- */
  function sugs(){ const C=window.__starsetChat, f=C&&C.focusName&&C.focusName();
    const S={ 'index.html':['What can I see in the sky tonight?','How far is Neptune, really?','Chand pe ek din kitna lamba hota hai?','What can I do on StarSet?'],
      'planets.html':['How far is Neptune, really?','Why is Pluto not a planet anymore?','How long does sunlight take to reach Saturn?','Show me Jupiter in 3D'],
      'simulation.html':[f&&f!=='Sun'?`Tell me about ${f}`:'Show me Saturn','Take me to Voyager 1','Why does Mars look red?','Jupiter ke kitne moons hain?'],
      'sky.html':['What can I see in the sky tonight?','Show me Orion','Which planet is brightest right now?','Dhruv tara kaise dhundhe?'],
      'eclipse.html':["Why don't we get an eclipse every month?",'When is the next solar eclipse visible in India?','Grahan ko dekhna safe kaise hai?'],
      'earth.html':['Why does Earth have seasons?','How fast is Earth spinning?','Show me Earth in 3D'],
      'scale.html':['How big is the Sun compared to Earth?','If the Sun were a football, where is Neptune?'],
      'light.html':['How long does sunlight take to reach Pluto?','Why can\'t we talk live with Mars rovers?'],
      'story.html':['What does my birthday sky mean?','What is a nakshatra?'],
      'about.html':['How does StarSet calculate planet positions?','What data sources does StarSet use?'] };
    return S[PAGE]||S['index.html']; }
  function hello(){ const d=document.createElement('div'); d.className='ax-hello';
    d.innerHTML=`<h3>Namaste! I'm Astro 👋</h3><p>${lite?'Ask me about planets, moons, stars and eclipses — in English, Hinglish or हिंदी. I can also show you things: try “Saturn dikhao”.':'Ask me anything about planets, stars, eclipses or the night sky. I can also show you things — try “show me Saturn”.'}</p><div class="ax-sugs">${sugs().map(s=>`<button>${esc(s)}</button>`).join('')}</div>`;
    d.querySelectorAll('.ax-sugs button').forEach(b=>b.onclick=()=>send(b.textContent)); return d; }
  function bubble(m,i){ const el=document.createElement('div'); el.className='ax-m '+(m.role==='user'?'u':'a')+(m.err?' err':'');
    if(m.role==='user') el.textContent=m.content; else { el.innerHTML=`<div class="ax-txt">${md(m.content)}</div>`;
      if(m.btns&&m.btns.length){ const w=document.createElement('div'); w.className='ax-btns'; m.btns.forEach(([name,args,label])=>{ const b=document.createElement('button'); b.innerHTML=label+' '+IC.go; b.onclick=()=>runAction(name,args); w.appendChild(b); }); el.appendChild(w); }
      if(!m.err&&m.content) addActs(el,m); }
    return el; }
  function didLine(t){ const d=document.createElement('div'); d.className='ax-did'; d.innerHTML=IC.go+' '+esc(t); return d; }
  function addActs(el,m){ const a=document.createElement('div'); a.className='ax-act';
    if(tts||('speechSynthesis' in window)){ const b=document.createElement('button'); b.innerHTML=IC.spk+'<span>Listen</span>'; b.onclick=()=>speak(m.content,b); a.appendChild(b); }
    const c=document.createElement('button'); c.innerHTML=IC.copy+'<span>Copy</span>'; c.onclick=()=>{ try{ navigator.clipboard.writeText(plain(m.content)); c.lastChild.textContent='Copied'; setTimeout(()=>c.lastChild.textContent='Copy',1400); }catch(e){} }; a.appendChild(c);
    el.appendChild(a); }
  function render(){ const L=$('axLog'); L.innerHTML=''; if(!hist.length) L.appendChild(hello());
    hist.forEach((m,i)=>{ if(m.did) m.did.forEach(t=>L.appendChild(didLine(t))); L.appendChild(bubble(m,i)); }); L.scrollTop=L.scrollHeight; }
  const atBottom=()=>{ const L=$('axLog'); return L.scrollHeight-L.scrollTop-L.clientHeight<60; };

  /* ---------- open / close ---------- */
  function open(){ box.hidden=false; document.body.classList.add('astro-open'); fab.setAttribute('aria-expanded','true'); render(); ss.set('starset.astro.open',true); setTimeout(()=>$('axIn').focus({preventScroll:true}),60); }
  function close(){ box.hidden=true; document.body.classList.remove('astro-open'); fab.setAttribute('aria-expanded','false'); ss.set('starset.astro.open',false); stopSpeak(); fab.focus({preventScroll:true}); }
  window.__astroOpen=open;
  /* ask a question from outside the chat (the home page's Ask Astro box): opens the panel and sends it once Astro is ready */
  window.__astroAsk=t=>{ open(); let n=0; const go=()=>{ if(busy) return; if(sample||lite) send(t); else if(n++<60) setTimeout(go,100); else { $('axIn').value=t; } }; go(); };
  function nudge(){ fab.classList.add('nudge'); setTimeout(()=>fab.classList.remove('nudge'),6000); }

  /* ---------- the brain ---------- */
  function context(){ const now=new Date(); let c=`Page the user is on: ${PAGES[PAGE]||PAGE} (${PAGE}).\nUser's local date and time: ${now.toString()}.`;
    try{ const C=window.__starsetChat; if(C&&C.context){ const x=C.context(); if(x) c+='\nWhat the page shows right now: '+x; } }catch(e){}
    return c; }
  const RULES=`You are Astro, the friendly AI space guide inside StarSet, an educational astronomy website made in India (Mumbai) by Suraj. Visitors range from school kids to curious adults.
How to answer:
- Reply in the same language and script the user writes in: English → English; Hindi in Devanagari → Hindi; Hinglish (Hindi in Latin letters) → Hinglish in Latin letters; Marathi or Marwari → the same.
- Be accurate. Keep it short: usually 2–5 sentences, or a few "- " bullets. Use real numbers with units and one vivid everyday comparison when it helps. Go longer only if asked.
- Formatting: plain text, **bold** for key numbers or names, "- " bullets. No headings, tables, links or emojis beyond one at most.
- If something may have changed after your knowledge (missions, new moons count, upcoming launches), say so briefly. Never invent dates for future eclipses or events; if unsure, suggest the Eclipse page.
- Stay on space, astronomy, physics of the sky and how to use StarSet. For unrelated requests, say kindly that you're a space guide and offer a space angle. Keep everything suitable for children.
- Time controls in the 3D view ("change the time lapse to 1 hour", "pause time", "2030 me le chalo", "run time backwards"): use set_time, then confirm in one short line.
- When the user wants to SEE something ("show", "take me", "dikhao", "open", "where is"), use a tool, then say in one short line what you opened, plus one interesting fact.
StarSet pages and features you can point to:
- index.html: the home page — tonight's planets, Moon phase and next eclipse for the user's city, the Explorer passport (stamps for visiting worlds and acing the quiz), and step-by-step lessons for teachers.
- planets.html: scroll journey from the Sun out to Eris at true distance (1 AU ≈ one screen).
- simulation.html: 3D Solar System with every planet, major moons, dwarf planets, comets and spacecraft at their real positions; time controls; search; anchors #tours (narrated guided tours in English, Hindi, Marathi, Marwari), #quiz (10-question space quiz), #truescale (True Scale mode: real sizes and real distances, travel at light speed or by car).
- sky.html: Tonight's Sky, a Stellarium-style live sky for the user's city with compass mode; anchor #panchang shows tithi, nakshatra and rashi on the real sky.
- eclipse.html: eclipse twin view (shadow on the globe + view from your city). earth.html: Earth explorer globe. scale.html: the solar system scaled onto your street. light.html: light-time messages across the Solar System. story.html: printable poster of the sky on any date. about.html: how StarSet was built.`;
  const TOOLS=[
    { name:'show_body', description:'Fly the 3D Solar System view to a body (planet, moon, dwarf planet, comet or spacecraft). Opens the 3D page if the user is elsewhere. Set true_scale=true to show it at real size and real distance in True Scale mode (only Sun, planets, Moon, Pluto).',
      inputSchema:{type:'object',properties:{key:{type:'string',enum:BODY_KEYS,description:'Body id'},true_scale:{type:'boolean'}},required:['key']},
      execute:async({key,true_scale})=>{ key=String(key||'').toLowerCase(); if(!BODY_KEYS.includes(key)) throw new Error('Unknown body'); const ts=!!true_scale&&TS_KEYS.includes(key);
        const C=window.__starsetChat; if(PAGE==='simulation.html'&&C&&C.show){ const r=C.show(key,ts); pend.did.push(r||`Showing ${key}`); return {ok:true,shown:r||key}; }
        pend.nav='simulation.html#'+(ts?'truescale':key); if(ts) pend.after={ts:key}; pend.did.push(`Opening ${ts?'True Scale':'the 3D Solar System'} at ${key}`); return {ok:true,note:'The 3D page opens right after your reply.'}; } },
    { name:'find_in_sky', description:"Point Tonight's Sky (the live sky view for the user's city) at a star, constellation, planet, the Moon or a Messier object, by its English name (e.g. 'Orion', 'Polaris', 'Jupiter', 'Andromeda Galaxy', 'M42'). Opens the sky page if needed.",
      inputSchema:{type:'object',properties:{name:{type:'string'}},required:['name']},
      execute:async({name})=>{ name=String(name||'').slice(0,60); const C=window.__starsetChat; if(PAGE==='sky.html'&&C&&C.find){ const r=C.find(name); if(r&&r.found) pend.did.push(`Pointing the sky at ${r.name}`); return r; }
        pend.nav='sky.html#find='+encodeURIComponent(name); pend.did.push(`Opening Tonight's Sky at ${name}`); return {ok:true,note:'The sky page opens right after your reply.'}; } },
    { name:'set_time', description:'Control time in the 3D Solar System: set the time-lapse speed (how much simulated time passes per real second), pause or play, run backwards or forwards, jump back to now, or jump to a date. Opens the 3D page if the user is elsewhere.',
      inputSchema:{type:'object',properties:{speed:{type:'string',enum:['sec','min','hour','day','week','month','year'],description:'Simulated time per real second: sec = real time'},action:{type:'string',enum:['pause','play','reverse','forward','now','faster','slower']},date:{type:'string',description:'YYYY-MM-DD to jump to'}}},
      execute:async({speed,action,date})=>{ const C=window.__starsetChat, o={}; if(speed) o.speed=speed; if(action) o.action=action; if(date&&/^\d{4}-\d{2}-\d{2}$/.test(date)) o.date=date;
        if(PAGE==='simulation.html'&&C&&C.time){ const r=C.time(o); if(r) pend.did.push(r); return {ok:!!r,done:r}; }
        pend.nav='simulation.html#t='+[o.speed,o.action,o.date].filter(Boolean).join(','); pend.did.push('Opening the 3D Solar System and setting the time'); return {ok:true,note:'Applied when the 3D page opens, right after your reply.'}; } },
    { name:'open_page', description:'Open another StarSet page or feature for the user.',
      inputSchema:{type:'object',properties:{page:{type:'string',enum:Object.keys(PAGES)},anchor:{type:'string',enum:['','tours','quiz','truescale','panchang'],description:'Optional section: tours/quiz/truescale on simulation.html, panchang on sky.html'}},required:['page']},
      execute:async({page,anchor})=>{ if(!PAGES[page]) throw new Error('Unknown page'); const h=anchor?'#'+anchor:''; if(page===PAGE&&!h) return {ok:true,note:'Already on this page'};
        if(page===PAGE&&h){ location.hash=h; pend.did.push(`Opened ${anchor}`); return {ok:true}; }
        pend.nav=page+h; pend.did.push(`Opening ${PAGES[page].split(' (')[0]}${anchor?' · '+anchor:''}`); return {ok:true,note:'Opens right after your reply.'}; } } ];
  let pend={did:[],nav:null};

  async function send(text){ text=(text||$('axIn').value).trim(); if(!text||busy||(!sample&&!lite)) return;
    stopSpeak(); $('axIn').value=''; grow(); hist.push({role:'user',content:text}); const L=$('axLog'); if(hist.length===1) L.innerHTML='';
    L.appendChild(bubble(hist[hist.length-1])); const msg={role:'assistant',content:''}; const el=document.createElement('div'); el.className='ax-m a'; el.innerHTML='<div class="ax-txt"><span class="ax-dots"><i></i><i></i><i></i></span></div>'; L.appendChild(el); L.scrollTop=L.scrollHeight;
    busy=true; setSend(); pend={did:[],nav:null}; ctrl=new AbortController();
    const convo=hist.slice(-14).map(m=>({role:m.role,content:m.content||'…'})); while(convo.length&&convo[0].role!=='user') convo.shift();
    const input=[{role:'user',content:RULES+'\n\n'+context()+'\n\nReply "OK" and then answer the conversation that follows.'},{role:'assistant',content:'OK'},...convo];
    let raf=0, latest=''; const paint=()=>{ raf=0; const stick=atBottom(); el.querySelector('.ax-txt').innerHTML=md(latest)||'<span class="ax-dots"><i></i><i></i><i></i></span>'; if(stick) L.scrollTop=L.scrollHeight; };
    if(lite){ try{ const C=window.__starsetChat||{}; const r=window.ASTRO_LITE.answer(text,{page:PAGE,visible:C.visible});
        for(const [name,args,optional] of r.actions){ const T=TOOLS.find(x=>x.name===name); if(!T) continue;
          if(optional){ (msg.btns=msg.btns||[]).push([name,args,btnLabel(name,args,r.lang)]); } else { try{ await T.execute(args); }catch(e){} } }
        // reveal quickly, like typing
        const full=r.text, step=Math.max(8,Math.ceil(full.length/10)); for(let i=step;i<full.length;i+=step){ latest=full.slice(0,i); paint(); await new Promise(z=>setTimeout(z,22)); } latest=full; paint();
        msg.content=full; }catch(e){ msg.content='Sorry, something went wrong. Please try again.'; msg.err=true; }
    } else try{
      const r=await sample(input,{cache:false,signal:ctrl.signal,tools:TOOLS,onText:({text})=>{ latest=(text&&!/^Thinking\W*$/i.test(text.trim()))?text:''; if(!raf) raf=requestAnimationFrame(paint); }});
      msg.content=(r&&r.text)||latest||'…'; if(r&&r.truncated) msg.content+=' …';
    }catch(e){ const code=e&&e.code;
      if(code==='not_granted'){ msg.content='Astro needs your permission to use Claude for answers. Tap send again and choose Allow.'; msg.err=true; }
      else if(code==='rate_limited'){ msg.content='Too many questions at once — please wait a few seconds and try again.'; msg.err=true; }
      else if(ctrl&&ctrl.signal.aborted){ msg.content=(e&&e.text)||latest||'(stopped)'; }
      else { msg.content=(e&&e.text)||'Sorry, I couldn\'t answer just now. Please try again.'; msg.err=!(e&&e.text); } }
    if(raf) cancelAnimationFrame(raf);
    if(pend.did.length) msg.did=pend.did.slice();
    hist.push(msg); if(hist.length>40) hist=hist.slice(-40); ss.set('starset.astro.hist',hist);
    const nb=bubble(msg); if(msg.did){ const frag=document.createDocumentFragment(); msg.did.forEach(t=>frag.appendChild(didLine(t))); L.insertBefore(frag,el); } el.replaceWith(nb); L.scrollTop=L.scrollHeight;
    busy=false; ctrl=null; setSend();
    afterActions();   // fly/open what was asked for; on a phone, get out of the way
  }

  function btnLabel(name,args,lang){ const hi=lang!=='en';
    if(name==='show_body') return hi?'3D me dekho':'Show in 3D'; if(name==='find_in_sky') return hi?'Aasmaan me dekho':'Find in the sky';
    const P={ 'eclipse.html':['Open the Eclipse page','Eclipse page kholo'], 'sky.html':[args.anchor==='panchang'?'Open the Panchang view':"Open Tonight's Sky",args.anchor==='panchang'?'Panchang kholo':"Tonight's Sky kholo"], 'light.html':['Open Light-time messages','Light-time page kholo'], 'story.html':['Make a sky poster','Sky poster banao'], 'about.html':['How StarSet is built','About page kholo'] }[args.page];
    return P? P[hi?1:0] : (hi?'Kholo':'Open'); }
  async function runAction(name,args){ const T=TOOLS.find(x=>x.name===name); if(!T) return; pend={did:[],nav:null}; try{ await T.execute(args); }catch(e){}
    const L=$('axLog'); pend.did.forEach(t=>L.appendChild(didLine(t))); L.scrollTop=L.scrollHeight; afterActions(); }
  function afterActions(){ const small=innerWidth<=600||(innerHeight<=500&&innerWidth>innerHeight);
    if(pend.did.length&&!pend.nav&&small) setTimeout(()=>{ close(); nudge(); },1300);
    if(pend.nav){ const go=pend.nav, after=pend.after; ss.set('starset.astro.open',!small); if(small) ss.set('starset.astro.nudge',true); if(after&&after.ts) ss.set('starset.astro.ts',after.ts);
      setTimeout(()=>{ const [pg,h]=go.split('#'); if(pg===PAGE){ location.hash=h||''; } else location.href=go; },900); } }

  /* ---------- voice ---------- */
  function stopSpeak(){ if(speakingEl){ speakingEl.classList.remove('on'); speakingEl.lastChild.textContent='Listen'; speakingEl=null; } try{ speechSynthesis.cancel(); }catch(e){} try{ tts&&tts.stop&&tts.stop(); }catch(e){} }
  async function speak(text,btn){ if(speakingEl===btn){ stopSpeak(); return; } stopSpeak(); speakingEl=btn; btn.classList.add('on'); btn.lastChild.textContent='Stop';
    const t=plain(text), lang=/[ऀ-ॿ]/.test(t)?'hi':'en', done=()=>{ if(speakingEl===btn) stopSpeak(); };
    if(tts){ try{ const r=tts.speak(t,{language:lang}); if(r&&r.then) await r; done(); return; }catch(e){} }
    if('speechSynthesis' in window){ const u=new SpeechSynthesisUtterance(t); u.lang=lang==='hi'?'hi-IN':'en-IN'; u.rate=.97; u.onend=u.onerror=done; speechSynthesis.speak(u); } else done(); }
  function micOn(on){ $('axMic').classList.toggle('on',on); $('axMic').setAttribute('aria-label',on?'Stop listening':'Speak your question'); }
  let micBase='';
  function toggleMic(){ if(!dict) return; if($('axMic').classList.contains('on')){ dict.stop().catch(()=>{}); return; }
    micBase=$('axIn').value; dict.start().catch(e=>{ micOn(false); if(e&&e.code==='not_granted') $('axMic').hidden=true; }); }

  /* ---------- input ---------- */
  function grow(){ const t=$('axIn'); t.style.height='auto'; t.style.height=Math.min(120,t.scrollHeight)+'px'; setSend(); }
  function setSend(){ const s=$('axSend'); if(busy){ s.disabled=false; s.classList.add('stop'); s.innerHTML=IC.stop; s.setAttribute('aria-label','Stop'); }
    else { s.classList.remove('stop'); s.innerHTML=IC.send; s.setAttribute('aria-label','Send'); s.disabled=!$('axIn').value.trim(); } }
  function wire(){
    fab.onclick=open; $('axClose').onclick=close;
    $('axReset').onclick=()=>{ if(busy&&ctrl) ctrl.abort(); hist=[]; ss.set('starset.astro.hist',hist); stopSpeak(); render(); $('axIn').focus(); };
    $('axSend').onclick=()=>{ if(busy){ ctrl&&ctrl.abort(); return; } send(); };
    $('axIn').addEventListener('input',grow);
    $('axIn').addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){ e.preventDefault(); send(); } });
    $('axMic').onclick=toggleMic;
    // keep the page's own keyboard shortcuts and wheel/gesture handlers out of the chat
    ['keydown','keyup','keypress'].forEach(t=>box.addEventListener(t,e=>{ if(e.key==='Escape'&&t==='keydown'){ e.preventDefault(); close(); } e.stopPropagation(); }));
    ['wheel','touchstart','touchmove','pointerdown'].forEach(t=>box.addEventListener(t,e=>e.stopPropagation(),{passive:true}));
  }

  /* ---------- start: only light up when Claude is reachable ---------- */
  /* outside claude.ai: the browser's own speech recognition (Chrome, Edge, Android) for the mic */
  function browserMic(){ const SR=window.SpeechRecognition||window.webkitSpeechRecognition; if(!SR||dict) return; let rec=null;
    dict={ start:async()=>{ rec=new SR(); rec.lang=/^hi/.test(navigator.language||'')?'hi-IN':'en-IN'; rec.interimResults=true; rec.continuous=false;
        rec.onresult=e=>{ let fin='',par=''; for(const r of e.results){ (r.isFinal?(fin+=r[0].transcript):(par+=r[0].transcript)); } $('axIn').value=(micBase?micBase+' ':'')+(fin||par); grow(); if(fin) micBase=$('axIn').value; };
        rec.onstart=()=>micOn(true); rec.onend=rec.onerror=()=>micOn(false); rec.start(); },
      stop:async()=>{ try{ rec&&rec.stop(); }catch(e){} } };
    $('axMic').hidden=false; }
  function goLite(){ if(lite||sample) return; browserMic(); const sc=document.createElement('script'); sc.src='astro-lite.js';
    sc.onload=()=>{ if(!window.ASTRO_LITE) return; lite=true; fab.classList.add('on');
      box.querySelector('.ax-title span').textContent='Offline space guide · no AI needed';
      box.querySelector('.ax-note').innerHTML='Astro Lite answers from StarSet’s own data. English, हिंदी, Hinglish — sab chalega.';
      $('axIn').placeholder='Ask about a planet, moon or star…'; afterOpen(); };
    document.head.appendChild(sc); }
  function afterOpen(){ if(ss.get('starset.astro.open',false)){ open(); } else if(ss.get('starset.astro.nudge',false)){ ss.set('starset.astro.nudge',false); nudge(); }
      const tsKey=ss.get('starset.astro.ts',null); if(tsKey&&PAGE==='simulation.html'){ ss.set('starset.astro.ts',null); const tryTS=n=>{ const C=window.__starsetChat; if(C&&C.ready&&C.ready()) C.show(tsKey,true); else if(n<60) setTimeout(()=>tryTS(n+1),250); }; tryTS(0); } }
  function boot(){ wire();
    if(!(window.claude&&claude.use)){ goLite(); return; }     // not inside claude.ai (e.g. GitHub Pages): the offline guide
    claude.use('sample').then(s=>{ if(!s){ goLite(); return; } sample=s; fab.classList.add('on');
      if(ss.get('starset.astro.open',false)){ open(); } else if(ss.get('starset.astro.nudge',false)){ ss.set('starset.astro.nudge',false); nudge(); }
      const tsKey=ss.get('starset.astro.ts',null); if(tsKey&&PAGE==='simulation.html'){ ss.set('starset.astro.ts',null); const tryTS=n=>{ const C=window.__starsetChat; if(C&&C.ready&&C.ready()) C.show(tsKey,true); else if(n<60) setTimeout(()=>tryTS(n+1),250); }; tryTS(0); }
    }).catch(()=>goLite());
    claude.use('tts').then(t=>{ if(t&&t.speak) tts=t; }).catch(()=>{});
    claude.use('dictation').then(d=>{ if(!d) return; dict=d; $('axMic').hidden=false;
      d.onPartial(({text})=>{ $('axIn').value=(micBase?micBase+' ':'')+text; grow(); });
      d.onFinal(({text})=>{ micBase=(micBase?micBase+' ':'')+text; $('axIn').value=micBase; grow(); });
      d.onState(({state})=>micOn(state==='listening')); }).catch(()=>{});
  }
  if(document.body) boot(); else addEventListener('DOMContentLoaded',boot);
})();

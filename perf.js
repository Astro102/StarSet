/* StarSet — shared smoothness helpers, loaded by every page.
   1. Prefetch: start fetching a StarSet page the moment you hover or touch its link.
   2. FPS meter: turn on from the landing page's menu (or add ?fps to a page's address). */
(function(){
  /* ---------- 1. prefetch on intent ---------- */
  const done=new Set();
  function prefetch(a){
    if(!a||!a.href) return; let u; try{ u=new URL(a.href,location.href); }catch(e){ return; }
    if(u.origin!==location.origin||!/\.html$/.test(u.pathname)||u.pathname===location.pathname) return;
    const key=u.pathname; if(done.has(key)) return; done.add(key);
    const l=document.createElement('link'); l.rel='prefetch'; l.href=u.pathname; document.head.appendChild(l);
  }
  const intent=e=>{ const a=e.target.closest&&e.target.closest('a[href]'); if(a) prefetch(a); };
  addEventListener('pointerover',intent,{passive:true}); addEventListener('touchstart',intent,{passive:true}); addEventListener('focusin',intent);

  /* ---------- 2. FPS meter ---------- */
  let on=/[?&]fps\b/.test(location.search); try{ on=on||localStorage.getItem('starset.fps')==='1'; }catch(e){}
  window.StarSetFPS={ get on(){ return on; }, set(v){ try{ localStorage.setItem('starset.fps',v?'1':'0'); }catch(e){} location.reload(); } };
  if(!on) return;
  function start(){
    const box=document.createElement('div'); box.id='fpsMeter';
    box.style.cssText='position:fixed;left:8px;top:50%;transform:translateY(-50%);z-index:99999;font:500 11px/1.35 "Orbitron",sans-serif;color:#9fe8b0;background:rgba(0,0,0,.72);border:1px solid rgba(159,232,176,.35);border-radius:8px;padding:6px 8px;pointer-events:none;white-space:pre';
    document.body.appendChild(box);
    let frames=0, t0=performance.now(), worst=0, last=t0, longT=0;
    try{ new PerformanceObserver(l=>{ for(const e of l.getEntries()) longT+=1; }).observe({type:'longtask',buffered:false}); }catch(e){}
    (function loop(t){ frames++; const dt=t-last; last=t; if(dt>worst) worst=dt;
      if(t-t0>=1000){ const fps=Math.round(frames*1000/(t-t0)); const q=window.__quality&&window.__quality();
        box.style.color= fps>=50?'#9fe8b0':fps>=30?'#ffd27a':'#ff8a7a';
        box.textContent=`${fps} fps\nworst ${Math.round(worst)} ms\nfreezes ${longT}`+(q?`\nres ${q.pr.toFixed(2)}× / ${q.maxPR.toFixed(1)}×`:'')+`\ndpr ${(+devicePixelRatio).toFixed(1)}`;
        frames=0; t0=t; worst=0; }
      requestAnimationFrame(loop); })(performance.now());
  }
  if(document.body) start(); else addEventListener('DOMContentLoaded',start);
})();

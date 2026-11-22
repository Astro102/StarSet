/* StarSet Panchang engine — computes the five limbs of the Hindu almanac from real Sun & Moon positions.
   Positions: Astronomy Engine (geocentric, true ecliptic of date). Sidereal zodiac: Lahiri (Chitrapaksha) ayanamsa.
   Times may differ by a few minutes from printed panchangs, which use their own conventions. */
(function(){
'use strict';
const A=window.Astronomy;
const mod=(x,m)=>((x%m)+m)%m;

const TITHI=['Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami','Shashthi','Saptami','Ashtami','Navami','Dashami','Ekadashi','Dwadashi','Trayodashi','Chaturdashi'];
const TITHI_HI=['प्रतिपदा','द्वितीया','तृतीया','चतुर्थी','पंचमी','षष्ठी','सप्तमी','अष्टमी','नवमी','दशमी','एकादशी','द्वादशी','त्रयोदशी','चतुर्दशी'];
const NAK=[['Ashwini','अश्विनी'],['Bharani','भरणी'],['Krittika','कृत्तिका'],['Rohini','रोहिणी'],['Mrigashira','मृगशिरा'],['Ardra','आर्द्रा'],['Punarvasu','पुनर्वसु'],['Pushya','पुष्य'],['Ashlesha','आश्लेषा'],
  ['Magha','मघा'],['Purva Phalguni','पूर्व फाल्गुनी'],['Uttara Phalguni','उत्तर फाल्गुनी'],['Hasta','हस्त'],['Chitra','चित्रा'],['Swati','स्वाति'],['Vishakha','विशाखा'],['Anuradha','अनुराधा'],['Jyeshtha','ज्येष्ठा'],
  ['Mula','मूल'],['Purva Ashadha','पूर्वाषाढ़ा'],['Uttara Ashadha','उत्तराषाढ़ा'],['Shravana','श्रवण'],['Dhanishtha','धनिष्ठा'],['Shatabhisha','शतभिषा'],['Purva Bhadrapada','पूर्व भाद्रपद'],['Uttara Bhadrapada','उत्तर भाद्रपद'],['Revati','रेवती']];
const RASHI=[['Mesha','मेष','Aries'],['Vrishabha','वृषभ','Taurus'],['Mithuna','मिथुन','Gemini'],['Karka','कर्क','Cancer'],['Simha','सिंह','Leo'],['Kanya','कन्या','Virgo'],
  ['Tula','तुला','Libra'],['Vrishchika','वृश्चिक','Scorpio'],['Dhanu','धनु','Sagittarius'],['Makara','मकर','Capricorn'],['Kumbha','कुंभ','Aquarius'],['Meena','मीन','Pisces']];
const YOGA=['Vishkambha','Priti','Ayushman','Saubhagya','Shobhana','Atiganda','Sukarma','Dhriti','Shula','Ganda','Vriddhi','Dhruva','Vyaghata','Harshana','Vajra','Siddhi','Vyatipata','Variyana','Parigha','Shiva','Siddha','Sadhya','Shubha','Shukla','Brahma','Indra','Vaidhriti'];
const KARANA_MOV=['Bava','Balava','Kaulava','Taitila','Gara','Vanija','Vishti'];
const VAAR=[['Ravivar','रविवार'],['Somvar','सोमवार'],['Mangalvar','मंगलवार'],['Budhvar','बुधवार'],['Guruvar','गुरुवार'],['Shukravar','शुक्रवार'],['Shanivar','शनिवार']];

/* Lahiri ayanamsa: 23°51′11″ at J2000, growing with precession (~50.29″/yr). Good to ~0.01°. */
function ayanamsa(date){ const yrs=(date.getTime()-946728000000)/31557600000; return 23.85306+yrs*0.0139694; }
function sunLon(t){ return A.SunPosition(t).elon; }
function moonLon(t){ return A.EclipticGeoMoon(t).lon; }

function compute(date){
  const t=A.MakeTime(date), ay=ayanamsa(date), sL=sunLon(t), mL=moonLon(t);
  const el=mod(mL-sL,360), ms=mod(mL-ay,360), ss=mod(sL-ay,360);
  const ti=Math.floor(el/12), shukla=ti<15, tn=ti%15;
  const tithi={ index:ti, paksha:shukla?'Shukla':'Krishna', paksha_hi:shukla?'शुक्ल':'कृष्ण',
    name: tn===14?(shukla?'Purnima':'Amavasya'):TITHI[tn], name_hi: tn===14?(shukla?'पूर्णिमा':'अमावस्या'):TITHI_HI[tn], frac:(el%12)/12, elong:el };
  const NS=360/27, ni=Math.floor(ms/NS);
  const nak={ index:ni, name:NAK[ni][0], name_hi:NAK[ni][1], pada:Math.floor((ms%NS)/(NS/4))+1, frac:(ms%NS)/NS };
  const yi=Math.floor(mod(ms+ss,360)/NS);
  const k=Math.floor(el/6); const karana= k===0?'Kimstughna': k>=57? ['Shakuni','Chatushpada','Naga'][k-57] : KARANA_MOV[(k-1)%7];
  return { date, ayanamsa:ay, sunTropical:sL, moonTropical:mL, sunSidereal:ss, moonSidereal:ms, tithi, nakshatra:nak,
    yoga:{index:yi,name:YOGA[yi]}, karana:{name:karana},
    moonRashi:{index:Math.floor(ms/30),name:RASHI[Math.floor(ms/30)][0],name_hi:RASHI[Math.floor(ms/30)][1],western:RASHI[Math.floor(ms/30)][2]},
    sunRashi:{index:Math.floor(ss/30),name:RASHI[Math.floor(ss/30)][0],name_hi:RASHI[Math.floor(ss/30)][1],western:RASHI[Math.floor(ss/30)][2]} };
}
/* when does the current tithi end? (Moon–Sun elongation reaches the next multiple of 12°) */
function tithiEnd(date){ const p=compute(date); const r=A.SearchMoonPhase(((p.tithi.index+1)*12)%360,A.MakeTime(date),3); return r&&r.date; }
/* when does the Moon leave its nakshatra? bracket hourly, then bisect */
function nakEnd(date){ const ay=ayanamsa(date), NS=360/27, start=mod(moonLon(A.MakeTime(date))-ay,360), target=(Math.floor(start/NS)+1)*NS;
  const f=d=>{ const v=mod(moonLon(A.MakeTime(d))-ayanamsa(d),360); return mod(v-start,360)-(target-start); };
  let lo=date.getTime(), hi=lo; for(let h=1;h<=40;h++){ hi=lo+h*3600e3; if(f(new Date(hi))>=0) break; }
  let a=hi-3600e3, b=hi; for(let i=0;i<22;i++){ const m=(a+b)/2; if(f(new Date(m))>=0) b=m; else a=m; } return new Date(b); }
/* next time the Moon–Sun elongation equals `deg` (0 = Amavasya, 180 = Purnima, 120 = Shukla Ekadashi begins, 300 = Krishna Ekadashi begins) */
function nextElong(deg,date,days=40){ const r=A.SearchMoonPhase(deg,A.MakeTime(date),days); return r&&r.date; }
/* next Sankranti: the Sun enters sidereal rashi `ri` (Makar Sankranti = 9) */
function nextSankranti(ri,date){ // first find it with today's ayanamsa, then refine using the ayanamsa on that day
  let r=A.SearchSunLongitude(mod(ri*30+ayanamsa(date),360),A.MakeTime(date),400); if(!r) return null;
  const near=new Date(r.date.getTime()-5*86400e3); r=A.SearchSunLongitude(mod(ri*30+ayanamsa(r.date),360),A.MakeTime(near<date?date:near),20); return r&&r.date; }
function nextAnySankranti(date){ const p=compute(date); const ri=(p.sunRashi.index+1)%12; return {rashi:RASHI[ri],date:nextSankranti(ri,date)}; }
function vaar(date,tz){ const wd=new Intl.DateTimeFormat('en-US',{timeZone:tz||undefined,weekday:'short'}).format(date); const i=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(wd); return {name:VAAR[i][0],name_hi:VAAR[i][1]}; }

window.Panchang={compute,tithiEnd,nakEnd,nextElong,nextSankranti,nextAnySankranti,vaar,ayanamsa,NAK,RASHI,TITHI,TITHI_HI};
})();

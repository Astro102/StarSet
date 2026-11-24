/* StarSet · Astro Lite — the offline space guide used when Claude isn't available (e.g. on GitHub Pages).
   No AI and no network: it understands English, Hinglish and हिंदी questions with keyword rules, answers from StarSet's own
   data (the same numbers the 3D model uses) and a set of hand-written explainers, and can still show things on the page. */
window.ASTRO_LITE=(()=>{
const KB=__KB__;
const byKey=Object.fromEntries(KB.map(b=>[b.key,b]));
const fmt=(n,dp=0)=>Number(n).toLocaleString('en-IN',{maximumFractionDigits:dp,minimumFractionDigits:0});
const norm=s=>' '+s.toLowerCase().replace(/[’'`]/g,'').replace(/[^a-z0-9ऀ-ॿ]+/g,' ').trim()+' ';
const has=(t,list)=>list.some(w=>t.includes(' '+w+' ')||(w.length>4&&t.includes(w)));

/* ---------- names, including Hindi and Hinglish ones ---------- */
const ALIAS={ sun:['sun','surya','suraj','sooraj','सूर्य','सूरज'], moon:['moon','chand','chaand','chandrama','चाँद','चांद','चंद्रमा','चन्द्रमा'],
  mercury:['mercury','budh','बुध'], venus:['venus','shukra','shukr','शुक्र'], earth:['earth','prithvi','dharti','पृथ्वी','धरती'], mars:['mars','mangal','मंगल'],
  jupiter:['jupiter','brihaspati','guru','बृहस्पति','गुरु'], saturn:['saturn','shani','शनि'], uranus:['uranus','arun','अरुण','यूरेनस'], neptune:['neptune','varun','वरुण','नेपच्यून','नेप्च्यून'],
  pluto:['pluto','प्लूटो'], ceres:['ceres'], eris:['eris'], haumea:['haumea'], makemake:['makemake'], charon:['charon'],
  voyager1:['voyager 1','voyager1','voyager one'], voyager2:['voyager 2','voyager2'], newhorizons:['new horizons','newhorizons'], clipper:['europa clipper','clipper'],
  parker:['parker','parker solar probe'], jwst:['jwst','james webb','webb telescope','webb'], halley:['halley','halleys','halleys comet'], encke:['encke'], '67p':['67p','churyumov'], halebopp:['hale bopp','halebopp'] };
for(const b of KB){ if(!ALIAS[b.key]) ALIAS[b.key]=[b.name.toLowerCase()]; }
const ALIAS_LIST=Object.entries(ALIAS).flatMap(([k,ns])=>ns.map(n=>[norm(n).trim(),k])).sort((a,b)=>b[0].length-a[0].length);
function bodiesIn(t){ const found=[]; let s=t;     // longest names first, then reported in sentence order
  for(const [n,k] of ALIAS_LIST){ let i; while((i=s.indexOf(' '+n+' '))>=0){ found.push([i,k]); s=s.slice(0,i+1)+'#'.repeat(n.length)+s.slice(i+1+n.length); } }
  return [...new Set(found.sort((a,b)=>a[0]-b[0]).map(x=>x[1]))]; }
const SKY={ 'orion':'Orion','mrig':'Orion','मृग':'Orion','orion nebula':'Orion Nebula','polaris':'Polaris','pole star':'Polaris','north star':'Polaris','dhruv':'Polaris','dhruv tara':'Polaris','ध्रुव':'Polaris',
  'big dipper':'Ursa Major','ursa major':'Ursa Major','saptarishi':'Ursa Major','saptrishi':'Ursa Major','सप्तर्षि':'Ursa Major','सप्तऋषि':'Ursa Major','sirius':'Sirius','betelgeuse':'Betelgeuse','rigel':'Rigel','vega':'Vega',
  'pleiades':'Pleiades','krittika':'Pleiades','kritika':'Pleiades','कृत्तिका':'Pleiades','seven sisters':'Pleiades','scorpius':'Scorpius','scorpio':'Scorpius','vrishchik':'Scorpius','sagittarius':'Sagittarius','dhanu':'Sagittarius',
  'cassiopeia':'Cassiopeia','andromeda galaxy':'M31','andromeda':'M31','canopus':'Canopus','agastya':'Canopus','arcturus':'Arcturus','swati':'Arcturus','antares':'Antares','jyeshtha':'Antares','aldebaran':'Aldebaran','rohini':'Aldebaran',
  'taurus':'Taurus','gemini':'Gemini','leo':'Leo','cygnus':'Cygnus','southern cross':'Crux','crux':'Crux','altair':'Altair','deneb':'Deneb','spica':'Spica','chitra':'Spica','regulus':'Regulus','magha':'Regulus','capella':'Capella','procyon':'Procyon','lagoon nebula':'Lagoon Nebula' };
const SKY_LIST=Object.entries(SKY).map(([a,n])=>[norm(a).trim(),n]).sort((a,b)=>b[0].length-a[0].length);
const skyIn=t=>{ for(const [a,n] of SKY_LIST) if(t.includes(' '+a+' ')) return n; return null; };

/* ---------- language ---------- */
const HG=['hai','hain','kya','kitna','kitne','kitni','kaise','kaisa','kyun','kyon','kyu','kaun','kab','kaha','kahan','dikhao','dikha','batao','bata','mujhe','ka','ki','ke','ko','se','me','mein','raat','aaj','hota','hoti','chal','chalo','bhai','yaar','nahi','nhi','aur','bhi','sabse','wala'];
const EN=['the','is','are','what','how','why','show','where','does','do','can','you','of','to','tell','about','which','many','much','far','big','in','a','an','my','i','it','there','long','take','from','than','bigger','find','open','please','fast'];
function langOf(raw,t){ if(/[ऀ-ॿ]/.test(raw)) return 'hi'; const w=t.trim().split(' ');
  const hg=w.filter(x=>HG.includes(x)&&x!=='me').length+w.filter(x=>/^(dikha|bata|khol|chal|dhund|dhoond|samjha)/.test(x)).length+(w.includes('me')&&!w.includes('show')&&!w.includes('tell')&&!w.includes('give')?1:0);
  const en=w.filter(x=>EN.includes(x)).length; return hg>0&&hg>=en?'hg':'en'; }
const L=(lang,en,hg,hi)=>lang==='hi'?(hi||hg||en):lang==='hg'?(hg||en):en;

/* ---------- intents ---------- */
const W={
  show:['show','take me','go to','fly to','zoom','dikhao','dikha','dikhaao','dikhado','dikha do','le chalo','le chal','le jao','dekhao','दिखाओ','दिखा','दिखाइए','ले चलो'],
  where:['where','where is','find','locate','spot','kahan','kaha','kidhar','कहाँ','कहां','dhundo','dhundho','dhoondo','dhundhe','dhunde','dhoondhe','dhundhna','ढूंढो','ढूँढें'],
  ts:['true scale','real size','actual size','asli size','asli','1 1','real distance','असली'],
  size:['size','big','bigger','biggest','large','diameter','radius','wide','bada','badi','bade','kitna bada','aakar','vyas','साइज','बड़ा','बड़ी','आकार','व्यास'],
  dist:['far','distance','away','door','dur','duri','doori','दूर','दूरी'],
  moons:['moons','satellites','satellite','upgrah','उपग्रह'],
  temp:['temperature','temp','hot','cold','garam','thanda','thandi','tapman','तापमान','गर्म','ठंडा'],
  day:['day','din','rotation','rotate','rotating','spin','spins','spinning','दिन','घूमता'],
  year:['year','years','saal','sal','orbit','revolution','varsh','साल','वर्ष','चक्कर'],
  grav:['gravity','weight','gurutva','wazan','vajan','वजन','गुरुत्व','गुरुत्वाकर्षण'],
  mass:['mass','heavy','bhari','bhaari','द्रव्यमान','भारी'],
  light:['light','sunlight','roshni','prakash','रोशनी','प्रकाश'],
  tell:['tell','about','what is','who is','explain','kya hai','batao','bata','बताओ','क्या है','बारे'],
  tonight:['tonight','see tonight','visible','aaj raat','aaj','raat','sky tonight','आज रात','आज'] };

const OPEN=[ [['quiz','क्विज़','क्विज'],'simulation.html','quiz','the space quiz'], [['tour','tours','guided','टूर'],'simulation.html','tours','the guided tours'],
  [['true scale','1 1 scale'],'simulation.html','truescale','True Scale mode'], [['panchang','tithi','nakshatra','पंचांग','तिथि','नक्षत्र'],'sky.html','panchang','the Panchang view'],
  [['eclipse','grahan','ग्रहण'],'eclipse.html','','the Eclipse page'], [['night sky','tonight sky','tonights sky','sky page','aasman','aasmaan','आसमान'],'sky.html','',"Tonight's Sky"],
  [['earth explorer','globe'],'earth.html','','the Earth explorer'], [['street','scale page','my street'],'scale.html','','Solar system on your street'],
  [['light time','message','signal'],'light.html','','Light-time messages'], [['poster','sky story','birthday sky','story'],'story.html','','Your sky story'],
  [['about','how starset','case study','who made','who built'],'about.html','','How StarSet is built'], [['3d','simulation','solar system model','3d model'],'simulation.html','','the 3D Solar System'],
  [['planets page','planets journey','journey','scroll','true distance'],'planets.html','','the Planets journey'],
  [['home','landing','passport','stamps','lesson','teacher mode'],'index.html','','the home page'] ];

/* ---------- explainers (checked facts, short) ---------- */
const FAQ=[
  { k:['pluto planet','pluto not','pluto ab','pluto kyun','pluto kyu','pluto ग्रह','pluto grah'], en:'In 2006 the International Astronomical Union said a planet must orbit the Sun, be round, and have **cleared its orbit** of other objects. Pluto shares its orbit with many Kuiper-belt objects, so it became a **dwarf planet**. It is still a fascinating world with mountains of water ice.',
    hg:'2006 me IAU ne rule banaya: planet ko Sun ke chakkar lagane chahiye, gol hona chahiye, aur apne orbit ko **saaf** karna chahiye. Pluto apna raasta Kuiper belt ki bahut saari cheezon ke saath share karta hai, isliye ab woh **dwarf planet** hai.',
    hi:'2006 में IAU ने तय किया कि ग्रह को सूर्य की परिक्रमा करनी चाहिए, गोल होना चाहिए और अपनी कक्षा **साफ़** करनी चाहिए। प्लूटो अपनी कक्षा काइपर बेल्ट की कई चीज़ों के साथ बाँटता है, इसलिए अब वह **बौना ग्रह** है।' },
  { k:['season','seasons','mausam','ritu','मौसम','ऋतु','garmi','sardi','summer','winter'], en:'Seasons happen because Earth is **tilted 23.4°**. For half the year your hemisphere leans toward the Sun: longer days and more direct sunlight make it summer. Half a year later it leans away, and it is winter. Distance from the Sun barely matters: Earth is actually closest in early January.',
    hg:'Mausam isliye badalte hain kyunki Earth **23.4° jhuki** hui hai. Saal ke aadhe hisse me hamara hemisphere Sun ki taraf jhukta hai: din lambe, dhoop seedhi, toh garmi. Baaki aadhe me door jhukta hai, toh sardi. Doori ka asar bahut kam hai: Earth January me Sun ke sabse paas hoti hai!',
    hi:'मौसम इसलिए बदलते हैं क्योंकि पृथ्वी **23.4° झुकी** हुई है। जब हमारा गोलार्ध सूर्य की ओर झुकता है तो दिन लंबे और धूप सीधी होती है — गर्मी। छह महीने बाद वह दूर झुकता है — सर्दी।' },
  { k:['eclipse every month','every month','har mahine','हर महीने'], en:"The Moon's orbit is tilted about **5°** to Earth's orbit, so at most new and full moons the Sun, Earth and Moon don't line up exactly. Eclipses only happen in two \"eclipse seasons\" a year, when the line-up is close enough.",
    hg:'Chand ka orbit Earth ke orbit se lagbhag **5° jhuka** hai, isliye har amavasya/purnima pe Sun, Earth aur Moon ek seedhi line me nahi aate. Grahan saal me sirf do "eclipse seasons" me hota hai.',
    hi:'चंद्रमा की कक्षा पृथ्वी की कक्षा से लगभग **5° झुकी** है, इसलिए हर अमावस्या या पूर्णिमा पर सूर्य, पृथ्वी और चंद्रमा एक सीध में नहीं आते। ग्रहण साल में केवल दो "ग्रहण ऋतुओं" में होते हैं।' },
  { k:['eclipse','grahan','ग्रहण','solar eclipse','lunar eclipse','surya grahan','chandra grahan'], en:'A **solar eclipse** is when the Moon passes in front of the Sun and its shadow falls on Earth (only at new moon). A **lunar eclipse** is when Earth\'s shadow falls on the Moon (only at full moon). Never look at the Sun without proper eclipse glasses. The Eclipse page shows upcoming eclipses from your city.',
    hg:'**Surya grahan** tab hota hai jab Chand Sun ke saamne aa jaata hai aur uski parchhai Earth pe padti hai (sirf amavasya ko). **Chandra grahan** me Earth ki parchhai Chand pe padti hai (sirf purnima ko). Sun ko kabhi bina eclipse glasses ke mat dekhna.',
    hi:'**सूर्य ग्रहण** तब होता है जब चंद्रमा सूर्य के सामने आता है और उसकी छाया पृथ्वी पर पड़ती है (केवल अमावस्या को)। **चंद्र ग्रहण** में पृथ्वी की छाया चंद्रमा पर पड़ती है (केवल पूर्णिमा को)। सूर्य को बिना ग्रहण चश्मे के कभी न देखें।', open:['eclipse.html',''] },
  { k:['light year','lightyear','prakash varsh','प्रकाश वर्ष'], en:'A **light-year** is a distance: how far light travels in one year, about **9.46 trillion km** (63,241 AU). Sunlight reaches Earth in about 8 minutes 20 seconds.',
    hg:'**Light-year** doori ki unit hai: roshni ek saal me jitna chalti hai, lagbhag **9.46 trillion km**. Sun ki roshni Earth tak sirf 8 minute 20 second me pahunchti hai.',
    hi:'**प्रकाश वर्ष** दूरी की इकाई है: प्रकाश एक साल में जितनी दूरी तय करता है, लगभग **9.46 लाख करोड़ किमी**।' },
  { k:['twinkle','twinkling','timtima','टिमटिमा'], en:"Stars twinkle because their light passes through moving layers of Earth's air, which bend it slightly in different directions. Planets look like tiny discs instead of points, so they usually shine more steadily.",
    hg:'Taare isliye timtimate hain kyunki unki roshni hamari hawa ki hilti hui parton se guzarti hai, jo use thoda idhar-udhar mod deti hain. Planets chhote disc jaise dikhte hain, isliye woh zyada steady chamakte hain.',
    hi:'तारे इसलिए टिमटिमाते हैं क्योंकि उनका प्रकाश हवा की हिलती परतों से गुज़रता है। ग्रह छोटी डिस्क जैसे दिखते हैं, इसलिए वे स्थिर चमकते हैं।' },
  { k:['phase','phases','kala','kalaye','amavasya','purnima','अमावस्या','पूर्णिमा','कला'], en:'The Moon is always half lit by the Sun. As it orbits Earth (every 29.5 days from new moon to new moon), we see different amounts of that lit half: **new moon → crescent → half → full → and back**.',
    hg:'Chand ka aadha hissa hamesha Sun se roshan rehta hai. Earth ke chakkar lagate hue (amavasya se amavasya 29.5 din) hum us roshan hisse ka alag-alag bhaag dekhte hain: **amavasya → chandrakala → aadha → purnima**.',
    hi:'चंद्रमा का आधा भाग हमेशा सूर्य से रोशन रहता है। पृथ्वी की परिक्रमा करते हुए (29.5 दिन) हम उस रोशन भाग का अलग-अलग हिस्सा देखते हैं: **अमावस्या → अर्धचंद्र → पूर्णिमा**।' },
  { k:['milky way','galaxy','akashganga','आकाशगंगा','galactic'], en:'The **Milky Way** is our galaxy: 100–400 billion stars in a disc about 100,000 light-years across. The Sun is about **26,000 light-years** from its centre, which lies toward Sagittarius. It is so far away that the band in the 3D view never shifts as you fly around the Solar System.',
    hg:'**Milky Way** hamari galaxy hai: 100 se 400 arab taare, lagbhag 1 lakh light-year chaudi disc me. Sun uske centre se lagbhag **26,000 light-year** door hai (Sagittarius ki taraf). Itni door ki 3D view me kahin bhi udo, woh band hilta nahi.',
    hi:'**आकाशगंगा** हमारी गैलेक्सी है: लगभग 1 लाख प्रकाश वर्ष चौड़ी डिस्क में 100–400 अरब तारे। सूर्य उसके केंद्र से लगभग **26,000 प्रकाश वर्ष** दूर है।' },
  { k:['black hole','blackhole','ब्लैक होल'], en:'A **black hole** is a place where so much mass is squeezed into a small space that not even light can escape. The Milky Way has one at its centre, Sagittarius A*, about 4 million times the Sun\'s mass.',
    hg:'**Black hole** aisi jagah hai jahan itna saara mass chhoti si jagah me dabaa hota hai ki roshni bhi bahar nahi nikal paati. Hamari galaxy ke centre me bhi ek hai, Sagittarius A*, Sun se lagbhag 40 lakh guna bhaari.',
    hi:'**ब्लैक होल** वह जगह है जहाँ इतना द्रव्यमान इतनी छोटी जगह में होता है कि प्रकाश भी बाहर नहीं निकल पाता।' },
  { k:['how does starset','how starset','calculate','positions accurate','accurate','data source','kaise banaya'], en:'StarSet calculates every position in your browser with **Astronomy Engine** (the same maths observatories use), plus orbital elements from NASA/JPL. Star positions come from the Hipparcos/Yale catalogues. The About page shows how each number was checked.',
    hg:'StarSet har position aapke browser me hi **Astronomy Engine** se calculate karta hai, saath me NASA/JPL ke orbital elements. Taaron ki positions Hipparcos/Yale catalogue se hain. About page pe har check ki detail hai.', open:['about.html',''] },
  { k:['brightest planet','brightest','sabse chamakdar','sabse chamkila','सबसे चमकीला'], en:'**Venus** is the brightest planet, reaching magnitude about −4.6 — only the Sun and Moon outshine it. **Jupiter** is usually next. Open Tonight\'s Sky to see which of them is up from your city right now.',
    hg:'**Venus (Shukra)** sabse chamakdaar planet hai — sirf Sun aur Chand usse zyada chamakte hain. Uske baad aksar **Jupiter**. Tonight\'s Sky kholke dekho abhi aapke shehar se kaun dikh raha hai.',
    hi:'**शुक्र** सबसे चमकीला ग्रह है — केवल सूर्य और चंद्रमा उससे ज़्यादा चमकते हैं। उसके बाद अक्सर **बृहस्पति**।', open:['sky.html',''] },
  { k:['talk live','live talk','live baat','rover','rovers','signal delay','radio delay'], en:'Radio signals travel at the speed of light, and Mars is between about **3 and 22 light-minutes** away depending on where both planets are. A question and answer would take 6 to 44 minutes, so rovers are sent instructions in batches and drive themselves in between.',
    hg:'Radio signal roshni ki speed se chalte hain, aur Mars hamse **3 se 22 light-minute** door hota hai (dono planets ki position pe depend karta hai). Sawaal-jawab me 6 se 44 minute lag jaate, isliye rovers ko commands ek saath bheje jaate hain aur woh khud drive karte hain.',
    hi:'रेडियो सिग्नल प्रकाश की गति से चलते हैं और मंगल हमसे **3 से 22 प्रकाश-मिनट** दूर होता है, इसलिए रोवर से सीधी बात नहीं हो सकती।', open:['light.html',''] },
  { k:['nakshatra','nakshatras','नक्षत्र'], en:'A **nakshatra** is one of 27 equal slices of the Moon\'s path around the sky, each 13°20′ wide. The Moon spends about a day in each one, so the nakshatra changes roughly daily. The Panchang view draws them on the real sky.',
    hg:'**Nakshatra** chand ke raaste (aasmaan me) ke 27 barabar hisse hain, har ek 13°20′ ka. Chand har nakshatra me lagbhag ek din rehta hai. Panchang view me ye asli aasmaan pe dikhte hain.',
    hi:'**नक्षत्र** आकाश में चंद्रमा के मार्ग के 27 बराबर भाग हैं, हर एक 13°20′ का। चंद्रमा हर नक्षत्र में लगभग एक दिन रहता है।', open:['sky.html','panchang'] },
  { k:['tithi','तिथि'], en:'A **tithi** is a lunar day: the time it takes the Moon to gain 12° on the Sun in the sky. There are 30 tithis from one new moon to the next, and they vary from about 19 to 26 hours.',
    hg:'**Tithi** ek lunar din hai: jitne time me Chand aasmaan me Sun se 12° aage badhta hai. Amavasya se amavasya tak 30 tithiyan hoti hain, har ek lagbhag 19 se 26 ghante ki.',
    hi:'**तिथि** चंद्र दिवस है: वह समय जिसमें चंद्रमा आकाश में सूर्य से 12° आगे बढ़ता है। एक अमावस्या से अगली तक 30 तिथियाँ होती हैं।', open:['sky.html','panchang'] },
  { k:['birthday','poster','sky story','janmdin','जन्मदिन'], en:'The **Sky story** page draws the real sky for any date and place — a birthday, a wedding, a launch — with the Moon phase, the planets and the panchang of that day, as a poster you can download.',
    hg:'**Sky story** page kisi bhi date aur jagah ka asli aasmaan banata hai — birthday, shaadi, launch — Chand ki kala, planets aur us din ka panchang ke saath, ek poster jo download kar sakte ho.',
    hi:'**स्काई स्टोरी** पेज किसी भी तारीख़ और जगह का असली आसमान बनाता है, जिसे पोस्टर की तरह डाउनलोड कर सकते हैं।', open:['story.html',''] },
  { k:['who made','who built','who created','kisne banaya','किसने बनाया','creator','developer'], en:'StarSet was designed and built by **Suraj**. It started as his BSc project, an astronomy site for kids, and was rebuilt into this full website.',
    hg:'StarSet ko **Suraj** ne design aur build kiya hai. Ye unka BSc project tha, bachchon ke liye astronomy site, jise ab poori website me badla gaya hai.',
    hi:'StarSet को **सूरज** ने बनाया है। यह उनका BSc प्रोजेक्ट था, जिसे अब पूरी वेबसाइट में बदला गया है।' },
  { k:['what can you do','what can i do','what is starset','help','madad','kya kar sakte','kya kar sakta','features','मदद'], help:true },
  { k:['hi','hello','hey','namaste','namaskar','hii','नमस्ते','नमस्कार'], hello:true, exact:true },
  { k:['thanks','thank you','thankyou','shukriya','dhanyavad','dhanyawad','धन्यवाद','शुक्रिया'], thanks:true, exact:true } ];

const HELP={ en:"I'm **Astro Lite**, StarSet's offline guide. I can:\n- give facts: size, distance, moons, day and year length, temperature, gravity (try \"How big is Jupiter?\")\n- explain things like seasons, eclipses, Pluto, light-years\n- show you things: \"Show me Saturn\", \"Where is Orion?\", \"Open the quiz\"",
  hg:"Main **Astro Lite** hu, StarSet ka offline guide. Main:\n- facts bata sakta hu: size, doori, moons, din, saal, taapmaan (try karo \"Jupiter kitna bada hai?\")\n- mausam, grahan, Pluto, light-year jaise topics samjha sakta hu\n- cheezein dikha sakta hu: \"Saturn dikhao\", \"Orion kahan hai?\", \"Quiz kholo\"",
  hi:"मैं **Astro Lite** हूँ, StarSet का ऑफ़लाइन गाइड। मैं ग्रहों के तथ्य बता सकता हूँ (आकार, दूरी, चंद्रमा, दिन, साल), मौसम और ग्रहण समझा सकता हूँ, और चीज़ें दिखा सकता हूँ: \"शनि दिखाओ\"।" };

/* ---------- fact answers ---------- */
const nm=(b,lang)=>lang==='hi'?({sun:'सूर्य',moon:'चंद्रमा',mercury:'बुध',venus:'शुक्र',earth:'पृथ्वी',mars:'मंगल',jupiter:'बृहस्पति',saturn:'शनि',uranus:'यूरेनस',neptune:'नेपच्यून',pluto:'प्लूटो'}[b.key]||b.name):b.name;
const lightTime=au=>{ const s=au*499.005; if(s<3600) return Math.floor(s/60)+' min '+Math.round(s%60)+' s'; const h=s/3600; return h<48? Math.floor(h)+' h '+Math.round((s%3600)/60)+' min' : (h/24).toFixed(1)+' days'; };
const dur=(h,lang)=>{ h=Math.abs(h); if(h<48) return fmt(h,1)+L(lang,' hours',' ghante',' घंटे'); const d=h/24; return fmt(d,d<100?1:0)+L(lang,' Earth days',' din (Earth ke)',' दिन'); };
const years=(d,lang)=>d<730? fmt(d,d<100?1:0)+L(lang,' days',' din',' दिन') : fmt(d/365.256,1)+L(lang,' Earth years',' saal',' वर्ष');
function fact(b,what,lang){ const N='**'+nm(b,lang)+'**';
  switch(what){
    case 'size': if(!b.diam) return null; return L(lang, `${N} is about **${fmt(b.diam)} km** across${b.dims?' ('+b.dims+')':''}`+(b.key!=='earth'?` — ${b.diam>12756?fmt(b.diam/12756,1)+' times as wide as Earth':'about '+Math.round(b.diam/12756*100)+'% of Earth\'s width'}.`:'.'),
      `${N} ka diameter lagbhag **${fmt(b.diam)} km** hai`+(b.key!=='earth'?` — ${b.diam>12756?'Earth se '+fmt(b.diam/12756,1)+' guna chauda':'Earth ki chaudai ka lagbhag '+Math.round(b.diam/12756*100)+'%'}.`:'.'),
      `${N} का व्यास लगभग **${fmt(b.diam)} किमी** है`+(b.key!=='earth'?` — ${b.diam>12756?'पृथ्वी से '+fmt(b.diam/12756,1)+' गुना':'पृथ्वी का लगभग '+Math.round(b.diam/12756*100)+'%'}।`:'।'));
    case 'dist':
      if(b.key==='sun') return L(lang,'The **Sun** is on average **149.6 million km** (1 AU) from Earth; its light takes about **8 min 20 s** to reach us.','**Sun** Earth se ausatan **14.96 crore km** (1 AU) door hai; uski roshni ko humtak aane me **8 min 20 s** lagte hain.','**सूर्य** पृथ्वी से औसतन **14.96 करोड़ किमी** दूर है; उसकी रोशनी को हम तक आने में **8 मिनट 20 सेकंड** लगते हैं।');
      if(b.kind==='moon'&&b.dist){ const p=byKey[b.parent]; return L(lang,`${N} orbits ${p?p.name:'its planet'} about **${fmt(b.dist)} km** away.`,`${N} apne planet (${p?p.name:''}) se lagbhag **${fmt(b.dist)} km** door chakkar lagata hai.`,`${N} अपने ग्रह से लगभग **${fmt(b.dist)} किमी** दूर परिक्रमा करता है।`); }
      if(b.a) return L(lang,`${N} orbits on average **${fmt(b.a,2)} AU** from the Sun — about **${fmt(b.a*149.6,0)} million km**. Sunlight takes **${lightTime(b.a)}** to get there.`,
        `${N} Sun se ausatan **${fmt(b.a,2)} AU** door hai — lagbhag **${fmt(b.a*14.96,0)} crore km**. Sun ki roshni ko wahan tak **${lightTime(b.a)}** lagte hain.`,
        `${N} सूर्य से औसतन **${fmt(b.a,2)} AU** दूर है — लगभग **${fmt(b.a*14.96,0)} करोड़ किमी**। सूर्य की रोशनी को वहाँ पहुँचने में **${lightTime(b.a)}** लगते हैं।`);
      if(b.status) return `${N}: ${b.status}.`; return null;
    case 'moons': if(b.moons==null) return null; return L(lang,`${N} has **${b.moons}** known moon${b.moons==='1'?'':'s'}.`+(b.key==='saturn'?' That is the most of any planet.':'')+' (Counts can change as new moons are found.)',
      `${N} ke **${b.moons}** known moon${b.moons==='1'?'':'s'} hain.`+(b.key==='saturn'?' Ye kisi bhi planet me sabse zyada hai.':'')+' (Naye moons milne pe ginti badal sakti hai.)',`${N} के **${b.moons}** ज्ञात चंद्रमा हैं।`);
    case 'temp': if(!b.temp) return null; return L(lang,`Typical temperature on ${N}: **${b.temp}**.`,`${N} ka taapmaan: **${b.temp}**.`,`${N} का तापमान: **${b.temp}**।`);
    case 'day': if(!b.rotH&&!b.dayH) return null; { const r=b.rotH, sd=b.dayH; let s=L(lang,`${N} spins once every **${dur(r,lang)}**`,`${N} ek baar ghoomne me **${dur(r,lang)}** leta hai`,`${N} एक बार घूमने में **${dur(r,lang)}** लेता है`);
      if(sd&&Math.abs(sd-Math.abs(r))/Math.abs(r)>.05) s+=L(lang,`; one full day from sunrise to sunrise lasts **${dur(sd,lang)}**`,`; sunrise se sunrise tak ek din **${dur(sd,lang)}** ka hota hai`,`; सूर्योदय से सूर्योदय तक एक दिन **${dur(sd,lang)}** का होता है`);
      if(r<0) s+=L(lang,' — and it spins backwards (retrograde).',' — aur ye ulti disha me ghoomta hai (retrograde).',' — और यह उल्टी दिशा में घूमता है।'); else s+=lang==='hi'?'।':'.'; return s; }
    case 'year': if(!b.P) return null; return b.kind==='moon'? L(lang,`${N} goes once around its planet every **${fmt(b.P,2)} days**.`,`${N} apne planet ka ek chakkar **${fmt(b.P,2)} din** me lagata hai.`,`${N} अपने ग्रह की एक परिक्रमा **${fmt(b.P,2)} दिन** में करता है।`)
      : L(lang,`One year on ${N} — one trip around the Sun — takes **${years(b.P,lang)}**.`,`${N} pe ek saal (Sun ka ek chakkar) **${years(b.P,lang)}** ka hota hai.`,`${N} पर एक साल (सूर्य की एक परिक्रमा) **${years(b.P,lang)}** का होता है।`);
    case 'grav': if(b.g==null) return null; { const g=parseFloat(b.g); const kg=isNaN(g)?null:Math.round(50*g/9.8); return L(lang,`Surface gravity on ${N} is **${b.g} m/s²**`+(kg!=null&&b.key!=='earth'?` — someone weighing 50 kg on Earth would feel like **${kg} kg** there.`:'.'),
      `${N} pe gravity **${b.g} m/s²** hai`+(kg!=null&&b.key!=='earth'?` — Earth pe 50 kg ka insaan wahan **${kg} kg** jaisa mehsoos karega.`:'.'),`${N} पर गुरुत्व **${b.g} m/s²** है`+(kg!=null&&b.key!=='earth'?` — पृथ्वी पर 50 किलो का व्यक्ति वहाँ **${kg} किलो** जैसा महसूस करेगा।`:'।')); }
    case 'mass': if(!b.mass) return null; return L(lang,`${N} has a mass of **${b.mass}**.`,`${N} ka mass **${b.mass}** hai.`,`${N} का द्रव्यमान **${b.mass}** है।`);
    case 'light': if(!b.a) return null; return L(lang,`Sunlight takes **${lightTime(b.a)}** to reach ${N}.`,`Sun ki roshni ko ${N} tak pahunchne me **${lightTime(b.a)}** lagte hain.`,`सूर्य की रोशनी को ${N} तक पहुँचने में **${lightTime(b.a)}** लगते हैं।`);
    default: { const intro=b.type?L(lang,`${N} — ${b.type}. `,`${N} — ${b.type}. `,`${N} — ${b.type}। `):`${N}. `;
      return intro+(b.desc||'')+(b.fact?'\n\n'+b.fact:'')+(lang!=='en'?'\n\n'+L(lang,'','(Detail English me hai — size, doori ya moons Hinglish me pooch sakte ho.)','(विस्तार अंग्रेज़ी में है — आकार, दूरी या चंद्रमा हिंदी में पूछ सकते हैं।)'):''); } } }

/* ---------- main ---------- */
/* ---------- time controls for the 3D view ---------- */
const UNITS=[['sec',['sec','secs','second','seconds','sekand','सेकंड','सेकेंड']],['min',['min','mins','minute','minutes','minat','मिनट']],['hour',['hour','hours','hr','hrs','ghanta','ghante','ghanta','घंटा','घंटे']],
  ['day',['day','days','din','दिन']],['week',['week','weeks','hafta','hafte','हफ्ता','हफ़्ता','सप्ताह']],['month',['month','months','mahina','mahine','महीना','महीने']],['year',['year','years','saal','sal','varsh','साल','वर्ष']]];
const TIMEW=['time','lapse','timelapse','time lapse','speed','rate','per second','samay','waqt','vakt','समय','टाइम','गति','स्पीड'];
const SETW=['set','change','make','put','kar','karo','kardo','kar do','karde','kar de','rakh','rakho','rakhdo','chalao','chala','करो','कर दो','रखो','चलाओ'];
const MONTHS={jan:1,january:1,feb:2,february:2,mar:3,march:3,apr:4,april:4,may:5,jun:6,june:6,jul:7,july:7,aug:8,august:8,sep:9,sept:9,september:9,oct:10,october:10,nov:11,november:11,dec:12,december:12};
function timeIntent(t,raw){ const o={};
  const tw=has(t,TIMEW), setw=has(t,SETW);
  // speed: the first time unit, ignoring "per second"
  const u=t.replace(/ (per|prati|har|प्रति|हर) (sec|second|sekand|सेकंड) /g,' ');
  let best=null; for(const [k,ws] of UNITS){ for(const w of ws){ const i=u.indexOf(' '+w+' '); if(i>=0&&(!best||i<best[0])) best=[i,k]; } }
  if(best&&(tw||setw)&&!/(kitne|kitna|how many|how long|how much|कितने|कितना)/.test(t)) o.speed=best[1];
  if(has(t,['real time','realtime','live time','asli time','normal speed'])) o.speed='sec';
  if(has(t,['pause','freeze','roko','rok do','rok','ruko','thehro','रोको','रोक','रुको'])||(tw&&has(t,['stop']))) o.action='pause';
  else if(has(t,['resume','unpause','play'])||(tw&&has(t,['start','chalu','shuru','चालू','शुरू']))) o.action='play';
  else if(has(t,['reverse','backward','backwards','rewind','ulta','ulti','peeche','piche','उल्टा','पीछे'])) o.action='reverse';
  else if(tw&&has(t,['forward','forwards','aage','सीधा','आगे'])) o.action='forward';
  else if(has(t,['faster','speed up','tez','tezi','jaldi','तेज़','तेज'])&&!o.speed) o.action='faster';
  else if(has(t,['slower','slow down','slow','dheere','dheema','dhire','धीरे'])&&!o.speed) o.action='slower';
  else if((tw||has(t,['jump','back to','go back','wapas','vapas','reset','वापस']))&&has(t,['now','today','present','aaj','abhi','reset','आज','अभी'])) o.action='now';
  // a date: "2030 me le chalo", "go to 15 aug 2027", "set date 2027-08-02"
  const y=raw.match(/\b(1[6-9]\d\d|2[0-2]\d\d)\b/);
  if(y&&has(t,['go to','jump','take me','le chalo','le chal','le jao','chalo','date','year','saal','in','me','mein','pe','to','set','तक','में','पर','ले चलो'])&&!has(t,['born','discovered','launched','khoja','launch'])){
    const iso=raw.match(/(\d{4})-(\d{1,2})-(\d{1,2})/); let Y=+y[1], M=null, D=null;
    if(iso){ M=+iso[2]; D=+iso[3]; } else { for(const [k,v] of Object.entries(MONTHS)) if(t.includes(' '+k+' ')){ M=v; break; } const d=raw.match(/\b([0-2]?\d|3[01])(st|nd|rd|th)?\b(?!\d)/); if(M&&d&&+d[1]>0&&+d[1]!==Y) D=+d[1]; }
    const now=new Date(); M=M||now.getMonth()+1; D=D||(M===now.getMonth()+1?now.getDate():1);
    o.date=`${Y}-${String(M).padStart(2,'0')}-${String(D).padStart(2,'0')}`; }
  return (o.speed||o.action||o.date)?o:null; }
const SPEEDTXT={sec:['real time (1 second per second)','real time (1 second per second)'],min:['1 minute per second','1 minute per second'],hour:['1 hour per second','1 ghanta per second'],day:['1 day per second','1 din per second'],week:['1 week per second','1 hafta per second'],month:['1 month per second','1 mahina per second'],year:['1 year per second','1 saal per second']};
function answer(raw,ctx){ const t=norm(raw), lang=langOf(raw,t), out={text:'',actions:[],lang};
  const bodies=bodiesIn(t); const sky=skyIn(t);
  const want=k=>has(t,W[k]);
  // "Jupiter ke moons" / "moons of Saturn": a moon-word next to another body means its moons
  let main=bodies.find(k=>k!=='moon')||bodies[0];
  const moonWord=has(t,['moons','moon','chand','chaand','upgrah','उपग्रह','चाँद','चांद','चंद्रमा']);
  const wantMoons=want('moons')||(moonWord&&main&&main!=='moon'&&(has(t,['kitne','how many','kitna','कितने','count'])||t.includes(' moons ')));
  // greetings / thanks / help
  for(const f of FAQ){ if(f.exact){ if(f.k.some(k=>t.trim()===k||t.trim().split(' ').length<=3&&t.includes(' '+k+' '))){
      if(f.hello){ out.text=L(lang,"Hi! I'm Astro Lite. Ask me about any planet, moon or star — or say \"show me Saturn\".","Namaste! Main Astro Lite hu. Kisi bhi planet, moon ya taare ke baare me poocho — ya bolo \"Saturn dikhao\".","नमस्ते! मैं Astro Lite हूँ। किसी भी ग्रह या तारे के बारे में पूछिए — या कहिए \"शनि दिखाओ\"।"); return out; }
      if(f.thanks){ out.text=L(lang,'Happy to help! Clear skies 🌌','Khushi hui! Aasmaan saaf rahe 🌌','खुशी हुई! 🌌'); return out; } } } }
  if(FAQ.find(f=>f.help).k.some(k=>t.includes(' '+k+' '))&&!bodies.filter(k=>k!=='earth').length){ out.text=L(lang,HELP.en,HELP.hg,HELP.hi); return out; }
  // time controls ("change the time lapse to 1 min", "1 hour kar do", "time roko", "2030 me le chalo")
  { const ti=main||sky?null:timeIntent(t,raw); if(ti){ const bits=[];
      if(ti.speed) bits.push(L(lang,`time-lapse set to **${SPEEDTXT[ti.speed][0]}**`,`time-lapse ab **${SPEEDTXT[ti.speed][1]}**`,`टाइम-लैप्स अब **${SPEEDTXT[ti.speed][1]}**`));
      const A={pause:['time paused','time rok diya','समय रोक दिया'],play:['time running again','time phir se chalu','समय फिर से चालू'],reverse:['time running backwards','time ab ulta chal raha hai','समय अब उल्टा चल रहा है'],forward:['time running forwards','time ab aage chal raha hai','समय अब आगे चल रहा है'],now:['back to the present moment','wapas abhi ke time pe','वापस अभी के समय पर'],faster:['time sped up one step','time ek step tez','समय एक कदम तेज़'],slower:['time slowed down one step','time ek step dheema','समय एक कदम धीमा']}[ti.action];
      if(A) bits.push(L(lang,A[0],A[1],A[2])); if(ti.date) bits.push(L(lang,`jumped to **${ti.date}**`,`**${ti.date}** pe pahunch gaye`,`**${ti.date}** पर पहुँच गए`));
      const s=bits.join(', '); out.text=s[0].toUpperCase()+s.slice(1)+(lang==='hi'?'।':'.')+(ctx.page!=='simulation.html'?L(lang,' Opening the 3D Solar System.',' 3D Solar System khol raha hu.',' 3D सौर मंडल खोल रहा हूँ।'):'');
      out.actions.push(['set_time',ti]); return out; } }
  // next eclipse: only the Eclipse page computes these
  if(has(t,['eclipse','eclipses','grahan','ग्रहण'])&&has(t,['next','upcoming','agla','agle','kab','when','अगला','कब'])){
    out.text=L(lang,"The **Eclipse page** calculates every upcoming solar and lunar eclipse and shows how much of each one you'll see from your city, minute by minute. Opening it now.",'**Eclipse page** har aane wale surya aur chandra grahan ko calculate karta hai aur dikhata hai ki aapke shehar se kitna dikhega. Abhi khol raha hu.','**ग्रहण पेज** हर आने वाले ग्रहण की गणना करता है और दिखाता है कि आपके शहर से कितना दिखेगा। खोल रहा हूँ।');
    out.actions.push(['open_page',{page:'eclipse.html'}]); return out; }
  // explainers (before "tonight", so words like "visible" don't steal them)
  if(!(want('show')&&(main||sky))) for(const f of FAQ){ if(f.exact||f.help) continue; if(f.k.some(k=>t.includes(' '+k+' ')||(k.includes(' ')&&t.includes(k)))){
      if(f.k[0]==='pluto planet'&&!/pluto|प्लूटो/.test(t)) continue;
      out.text=L(lang,f.en,f.hg,f.hi); if(f.open) out.actions.push(['open_page',{page:f.open[0],anchor:f.open[1]},true]); return out; } }
  // tonight's sky
  if(want('tonight')&&(has(t,['see','visible','dikhega','dikhenge','dikhta','kya dikh','sky','aasman','aasmaan','planet','planets','grah','दिखेगा','दिखेंगे','ग्रह'])||t.includes(' tonight '))&&!main&&!sky){
    if(ctx.page==='sky.html'&&ctx.visible){ const v=ctx.visible(); out.text=v.length? L(lang,'Right now above your horizon: ','Abhi aapke aasmaan me (horizon ke upar): ','अभी आपके आसमान में: ')+v.map(x=>`**${x.name}** (${x.dir}, ${x.alt}° ${L(lang,'up','upar','ऊपर')})`).join(', ')+'.'+L(lang,' Tap any of them in the list on the left for rise and set times.',' Left list me kisi pe tap karke rise/set time dekho.','')
        : L(lang,'None of the planets, the Sun or the Moon are above your horizon at the moment. Try a later time with the time controls.','Abhi koi planet, Sun ya Moon horizon ke upar nahi hai. Time controls se baad ka time try karo.','अभी कोई ग्रह, सूर्य या चंद्रमा क्षितिज के ऊपर नहीं है।'); return out; }
    out.text=L(lang,"Opening **Tonight's Sky**: it shows exactly what is up from your city right now. Ask me again there and I'll list it.","**Tonight's Sky** khol raha hu: wahan aapke shehar se abhi ka asli aasmaan dikhta hai. Wahan dobara poochoge toh list bata dunga.","**आज का आसमान** खोल रहा हूँ।");
    out.actions.push(['open_page',{page:'sky.html'}]); return out; }
  // show / where
  const show=want('show'), where=want('where');
  if((where||show)&&sky&&!main){ out.text=L(lang,`Pointing the sky at **${sky}**.`,`Aasmaan ko **${sky}** ki taraf ghuma raha hu.`,`आसमान को **${sky}** की ओर घुमा रहा हूँ।`); out.actions.push(['find_in_sky',{name:sky}]); return out; }
  if(where&&main&&byKey[main]&&['planet','sun','moon'].includes(byKey[main].kind)&&!show){ const b=byKey[main];
    out.text=L(lang,`Finding **${b.name}** in tonight's sky for your city.`,`Aapke shehar ke aaj ke aasmaan me **${b.name}** dhoond raha hu.`,`आज के आसमान में **${nm(b,lang)}** ढूँढ रहा हूँ।`); out.actions.push(['find_in_sky',{name:b.name}]); return out; }
  if(show&&main){ const ts=want('ts'), b=byKey[main]; out.text=L(lang,`Flying to **${b.name}**${ts?' at true scale':''}.`,`**${b.name}** pe le chal raha hu${ts?' (true scale me)':''}.`,`**${nm(b,lang)}** पर ले चल रहा हूँ।`)+'\n\n'+(b.fact||'');
    out.actions.push(['show_body',{key:main,true_scale:ts}]); return out; }
  // open a page / feature
  if(show||has(t,['open','kholo','khol','start','shuru','chalu','खोलो','शुरू'])){ for(const [ws,page,anchor,label] of OPEN){ if(has(t,ws)){ const lb=label.replace(/^the /,''), Lb=lb[0].toUpperCase()+lb.slice(1); out.text=L(lang,`Opening ${label}.`,`${Lb} khol raha hu.`,`${Lb} खोल रहा हूँ।`); out.actions.push(['open_page',{page,anchor}]); return out; } } }
  // facts about a body
  if(main&&byKey[main]){ const b=byKey[main];
    // comparisons: "Is Jupiter bigger than Earth?", "Saturn vs Jupiter size"
    const other=bodies.find(k=>k!==main);
    if(other&&byKey[other]&&(want('size')||has(t,['vs','versus','compare','than','se bada','se badi','se chhota','मुकाबले','तुलना']))&&b.diam&&byKey[other].diam){ const o=byKey[other], r=b.diam/o.diam;
      out.text=L(lang,`**${b.name}** (${fmt(b.diam)} km) is ${r>=1?fmt(r,1)+' times as wide as':'about '+Math.round(r*100)+'% the width of'} **${o.name}** (${fmt(o.diam)} km).`+(r>1.5?` By volume about ${fmt(r**3,0)} ${o.name}s would fit inside.`:''),
        `**${b.name}** (${fmt(b.diam)} km) **${o.name}** (${fmt(o.diam)} km) se ${r>=1?fmt(r,1)+' guna chauda':'uski chaudai ka '+Math.round(r*100)+'%'} hai.`+(r>1.5?` Volume ke hisaab se lagbhag ${fmt(r**3,0)} ${o.name} iske andar sama jaayenge.`:''),
        `**${nm(b,lang)}** (${fmt(b.diam)} किमी) **${nm(o,lang)}** (${fmt(o.diam)} किमी) से ${r>=1?fmt(r,1)+' गुना चौड़ा':'उसका '+Math.round(r*100)+'%'} है।`); return out; }
    const order=[['moons',wantMoons],['light',want('light')&&!want('dist')],['size',want('size')],['dist',want('dist')],['temp',want('temp')],['grav',want('grav')],['mass',want('mass')],['year',want('year')],['day',want('day')]];
    let hits=order.filter(x=>x[1]).map(x=>x[0]); if(hits.includes('year')&&!has(t,['rotation','rotate','spin','spins','ghoom','ghoomta','घूमता'])) hits=hits.filter(h=>h!=='day'); const parts=hits.map(h=>fact(b,h,lang)).filter(Boolean);
    out.text=parts.length? parts.join('\n\n') : fact(b,'about',lang);
    if(!parts.length) out.actions.push(['show_body',{key:main},true]); return out; }
  if(sky){ out.text=L(lang,`**${sky}** is in Tonight's Sky — I'll point the sky at it.`,`**${sky}** Tonight's Sky me hai — wahan dikhata hu.`,`**${sky}** आज के आसमान में दिखाता हूँ।`); out.actions.push(['find_in_sky',{name:sky}]); return out; }
  out.text=L(lang,"Sorry, I didn't catch that. I'm the offline version of Astro, so I understand questions about the planets, moons, stars and StarSet's features. Try:\n- How far is Mars?\n- How many moons does Saturn have?\n- Where is Orion?\n- Show me Jupiter",
    "Sorry, ye samajh nahi aaya. Main Astro ka offline version hu, planets, moons, taaron aur StarSet ke features ke sawaal samajhta hu. Try karo:\n- Mars kitna door hai?\n- Saturn ke kitne moons hain?\n- Orion kahan hai?\n- Jupiter dikhao",
    "माफ़ कीजिए, समझ नहीं आया। मैं ग्रहों, चंद्रमाओं और तारों के सवाल समझता हूँ। जैसे:\n- मंगल कितना दूर है?\n- शनि के कितने चंद्रमा हैं?\n- शनि दिखाओ");
  out.miss=true; return out; }
return { answer, kb:byKey };
})();

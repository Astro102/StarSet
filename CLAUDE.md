# StarSet — notes for Claude Code

StarSet is an educational astronomy website for kids, students and teachers (India-first):
a live 3D Solar System, tonight's sky with Panchang, eclipses, scale models and an AI guide (Astro).
Owner: Suraj. He writes in Hinglish — reply in simple, Hinglish-friendly English.

- Live site: https://astro102.github.io/StarSet/ (GitHub Pages, `main` branch, repo root, `.nojekyll`)
- A copy also lives as a claude.ai artifact (that copy gets the full AI Astro through `window.claude`).
- **No build step, no framework.** Every page is one self-contained HTML file with inline CSS/JS, plus a
  few shared `.js`/`.css` files. Open with any static server: `python -m http.server 8765`.
- Workflow the owner expects: make the change, test it, commit, push to `main` (Pages deploys in ~1 min).

## Pages
| File | What it is |
|---|---|
| `index.html` | Home: hero planet globe, "Tonight from your city" (visible planets, Moon + tithi, next visible eclipse + .ics), 5 feature cards, to-scale journey teaser, Ask Astro, Explorer passport, Teacher lessons, Share |
| `planets.html` | Scroll journey Sun → Eris at true distance (1 AU ≈ 1 screen). Deep links `planets.html#saturn` |
| `simulation.html` | Three.js r160 Solar System ("Mission Control"): time controls, True Scale, tours (4 languages), quiz, music, Share view |
| `sky.html` | Tonight's sky (Stellarium-style) + Panchang on the sky (`#panchang`, `#find=Orion`) |
| `eclipse.html` | Eclipse twin view: shadow on the globe + view from your city |
| `earth.html` | Earth explorer (MapLibre, offline globe fallback) |
| `scale.html` | Solar System on your street (scale model on a map) |
| `light.html` | Light-time messages |
| `story.html` | Printable sky poster for any date |
| `about.html` | How StarSet is built (requirements table, architecture) |

## Shared files
- `ui.css` — loaded **last** in every page's `<head>`. Button system (amber primary, glass secondary,
  cyan selected), Inter everywhere (`--sans`/`--mono` overridden), the shared top bar `.ssn`, the
  "Start the journey" hover (`.jbtn`).
- `site.js` (defer, every page) — `window.StarSet`: `stamp(id)` / `passport` (12 stamps), `lesson`
  (Teacher-mode lesson player bar), `share({url,title,…})` (copy / WhatsApp / QR via `lib/qrcode.js`),
  `toast`, plus the shared top bar's Explore panel and Cmd/Ctrl-K search.
- `chat.js` — Astro chat UI. Uses `window.claude` (artifact) when present, else falls back to
  **Astro Lite** (`astro-lite.js`, rule-based, English/Hinglish/Hindi, works offline). Tools: show_body,
  find_in_sky, set_time, open_page. Pages expose `window.__starsetChat` hooks for it.
- `globe.js` + `textures.js` — raw-WebGL planet globe (home hero, Moon phase). `planets.html` keeps its own copy.
- `panchang.js` (tithi/nakshatra/rashi), `eclipse-math.js`, `sky-data.js`, `starfield.js`, `earth-data.js`,
  `tours-i18n.js` (hi / mr / mwr tour text), `perf.js` (adaptive quality).
- CDN deps: `three@0.160.0`, `astronomy-engine@2.1.19` (jsDelivr), Google Fonts (Inter, Orbitron).

## The shared top bar
Every inner page has the same static `<header class="ssn">` (logo · page name · Explore · Night Sky /
Planets / Learn · optional `.ssn-slot` for page controls · Search · Launch 3D · phone menu). Body gets
`class="has-ssn"` (`ssn-pad` on document pages). Fixed panels sit below it with
`top:calc(var(--ssn-h,0px) + 12px)`. `--ssn-h` is 56 / 52 (≤820px) / 44 (short landscape).
`simulation.html` keeps its own Mission Control toolbar (same logo lockup). `index.html` has its own
fuller nav (inline search box, soundtrack button).

## Conventions
- Colours: bg `#04060d`, amber `#ffb547` = actions, cyan `#5fd8ff` = live data, text `#eef3f9`, muted `#a3b1c4`.
- Type: Inter for all text; Orbitron only for the logo and the big Planets headlines (`--display`).
- Button labels in sentence case ("Show in the sky", not "SHOW IN THE SKY"). No glow shadows, no emoji icons
  in UI controls — inline stroke SVG.
- Everything must work on phones (portrait + landscape): no sideways scrolling, touch targets ≥ 40–44px.
- Respect `prefers-reduced-motion`.
- Facts must be real (NASA fact sheets, Astronomy Engine). Never invent numbers.
- Keep licences: Solar System Scope textures (CC BY 4.0), ESO/S. Brunier Milky Way (CC BY 4.0), NASA,
  d3-celestial (BSD), Astronomy Engine (MIT), qrcode-generator (MIT). **No NC-licensed assets.**
- Music: `audio/deep-space-drift.mp3` — "Deep Space Drift" by Suraj, made with Suno. Credit it.
- Off by default on the home page; on in the 3D view unless the user turned it off (`starset.music`).

## Deep links & hooks (other pages and Astro rely on these)
- `simulation.html#saturn`, `#truescale`, `#quiz`, `#tours`, `#tour-grand`, `#t=2030-08-02,hour[,pause]`,
  combined with `&`: `#jupiter&t=2030-08-02,hour` (what the Share button makes).
- `sky.html#find=Orion`, `sky.html#panchang`; `planets.html#neptune`.
- localStorage keys (all `starset.*`): `loc` (city, shared by home/sky/eclipse), `passport`, `lesson`,
  `music`, `fx`, `lang`, `astro`, plus per-page UI state.

## Astro Lite (offline chatbot) — generated file, don't hand-edit `astro-lite.js`
```
node tools/astro-lite/kb.js      # re-extract body data from simulation.html → tools/astro-lite/kb.json
node tools/astro-lite/build.js   # astro-lite.src.js + kb.json → astro-lite.js
```
Edit `tools/astro-lite/astro-lite.src.js` for answers / intents / page links.

## Testing
```
pip install playwright && python -m playwright install chromium
python tools/test/smoke.py            # every page × desktop / phone / landscape: JS errors + sideways scroll
python tools/test/smoke.py sky.html   # one page
```
Screenshots land in `tools/test/shots/` (git-ignored) — look at them after UI changes.

## Gotchas
- `ui.css` must stay the last stylesheet in `<head>`; it overrides page CSS by order.
- Page-specific media queries can be overridden by `ui.css` — don't set font-size/padding there for
  classes pages size responsively (`.tb`).
- WebGL: handle context loss; keep pixel ratio adaptive (`perf.js`, `makeAQ` in simulation).
- `site.js` is deferred — inline page scripts must guard with `if(window.StarSet)`.
- iOS: two-finger pinch in the 3D view is zoom + rotate only (no pan), with a "Reset view" chip if the view wanders.

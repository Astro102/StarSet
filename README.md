# StarSet

An educational astronomy website: a 3D Solar System with real positions, Tonight's Sky, Panchang in the real sky,
eclipses, True Scale travel, and more.

## Pages
- `index.html` — home: tonight's planets, Moon and next eclipse for your city; Explorer passport; lessons for teachers
- `planets.html` — scroll from the Sun to Eris at true distance
- `simulation.html` — the 3D Solar System (Share button links the exact view)
- `sky.html`, `eclipse.html`, `earth.html`, `scale.html`, `light.html`, `story.html`, `about.html`
- `site.js` — shared passport, lesson player and share sheet; `globe.js` — the WebGL planet globe on the home page Static HTML + JavaScript, no build step, no server.

Designed and built by Suraj.

## Run locally
Open a terminal in this folder and run `python3 -m http.server 8000`, then visit http://localhost:8000
(opening index.html straight from disk will not load the textures).

## Credits
- Star and constellation data: d3-celestial by Olaf Frohn (BSD-3-Clause)
- Astronomy Engine by Don Cross (MIT) · three.js (MIT) · MapLibre GL JS (BSD-3-Clause)
- Country shapes: Natural Earth (public domain)
- Planet textures: Solar System Scope (CC BY 4.0); Milky Way panorama: ESO/S. Brunier (CC BY 4.0);
  moon maps from the Celestia community (CC BY / BY-SA / CC0)
- QR codes: qrcode-generator by Kazuhiko Arase (MIT, `lib/qrcode.js`)
- Music: "Deep Space Drift" by Suraj, made with Suno (`audio/deep-space-drift.mp3`)

## Astro, the space guide
Inside claude.ai, Astro answers with Claude (AI). Everywhere else, including GitHub Pages, it runs as **Astro Lite**
(`astro-lite.js`): an offline, rule-based guide that understands English, Hinglish and Hindi, answers from StarSet's own
planet data, and can still fly the 3D view, point the sky and open pages. No API key or server needed.

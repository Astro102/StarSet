/* Builds astro-lite.js (the offline Astro chatbot) from astro-lite.src.js + kb.json.
   Run from the repo root: node tools/astro-lite/kb.js && node tools/astro-lite/build.js */
const fs=require('fs'), path=require('path'); const ROOT=path.join(__dirname,'..','..');
const kb=fs.readFileSync(path.join(__dirname,'kb.json'),'utf8');
const src=fs.readFileSync(path.join(__dirname,'astro-lite.src.js'),'utf8').replace('__KB__',kb);
fs.writeFileSync(path.join(ROOT,'astro-lite.js'),src); console.log('astro-lite.js bytes',src.length);

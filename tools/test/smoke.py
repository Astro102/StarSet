"""StarSet smoke test: opens every page on desktop, phone and phone-landscape, and reports
JavaScript errors and sideways scrolling. Saves a screenshot of each to tools/test/shots/.

Setup (once):   pip install playwright && python -m playwright install chromium
Run (repo root): python tools/test/smoke.py            # all pages
                 python tools/test/smoke.py sky.html   # just one page

It serves the repo itself on http://localhost:8765. Pages load three.js, fonts and
Astronomy Engine from CDNs, so you need an internet connection.
"""
import asyncio, functools, http.server, pathlib, sys, threading
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
SHOTS = pathlib.Path(__file__).with_name('shots'); SHOTS.mkdir(exist_ok=True)
PAGES = ['index.html', 'planets.html', 'simulation.html', 'sky.html', 'earth.html', 'eclipse.html',
         'scale.html', 'light.html', 'story.html', 'about.html']
VIEWS = [(1280, 800, False, 'desktop'), (390, 844, True, 'phone'), (844, 390, True, 'landscape')]
PORT = 8765

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

def serve():
    h = functools.partial(Quiet, directory=str(ROOT))
    http.server.ThreadingHTTPServer(('127.0.0.1', PORT), h).serve_forever()

async def main(pages):
    threading.Thread(target=serve, daemon=True).start()
    bad = 0
    async with async_playwright() as p:
        # SwiftShader gives WebGL on machines without a GPU (CI); drop the args to use your real GPU.
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        for W, H, mob, tag in VIEWS:
            for page in pages:
                ctx = await b.new_context(viewport={'width': W, 'height': H}, has_touch=mob, is_mobile=mob)
                pg = await ctx.new_page(); errs = []
                pg.on('pageerror', lambda e: errs.append(str(e)[:160]))
                await pg.goto(f'http://127.0.0.1:{PORT}/{page}')
                await pg.wait_for_timeout(9000 if page in ('simulation.html', 'sky.html') else 4000)
                over = await pg.evaluate('document.documentElement.scrollWidth > innerWidth + 2')
                await pg.screenshot(path=str(SHOTS / f'{tag}_{page[:-5]}.png'))
                ok = not errs and not over; bad += not ok
                print(f"{'ok ' if ok else 'BAD'} {tag:9} {page:16} {'; '.join(errs[:2])}{'  sideways-scroll' if over else ''}")
                await ctx.close()
        await b.close()
    print(f'\n{bad} problem(s). Screenshots in {SHOTS}')
    sys.exit(1 if bad else 0)

if __name__ == '__main__':
    asyncio.run(main([a for a in sys.argv[1:] if a.endswith('.html')] or PAGES))

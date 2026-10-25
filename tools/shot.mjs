// QA screenshots without a visible browser: node tools/shot.mjs <url> <outdir> <width> <height> [mobile]
// Launches headless Chrome with reduced motion (so pinned/scrubbed sections lay out statically),
// opens <url>?still=1, scrolls once to load lazy images, then saves one JPEG per viewport.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [url, out, w = '1440', h = '900', mobile] = process.argv.slice(2);
const W = +w, H = +h, isMobile = mobile === 'mobile';
mkdirSync(out, { recursive: true });
const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'sbshot-'))}`,
  '--force-prefers-reduced-motion', '--hide-scrollbars', '--no-first-run', `--window-size=${W},${H}`, 'about:blank'
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) { try { target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); } catch { await sleep(200); } }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const waits = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && waits.has(m.id)) { waits.get(m.id)(m.result); waits.delete(m.id); } });
const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; waits.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expression) => (await cmd('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.value;
await cmd('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: isMobile });
if (isMobile) await cmd('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await cmd('Page.enable');
await cmd('Page.navigate', { url: url + (url.includes('?') ? '&' : '?') + 'still=1' });
await sleep(3500);
const total = await ev(`(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=${H}){scrollTo(0,y);await new Promise(r=>setTimeout(r,120))}scrollTo(0,0);await new Promise(r=>setTimeout(r,800));return document.documentElement.scrollHeight})()`);
let n = 0;
for (let y = 0; y < total; y += H) {
  await ev(`scrollTo(0,${y})`); await sleep(450);
  const { data } = await cmd('Page.captureScreenshot', { format: 'jpeg', quality: 78 });
  writeFileSync(join(out, `${String(n++).padStart(2, '0')}.jpg`), Buffer.from(data, 'base64'));
}
console.log(JSON.stringify({ shots: n, height: total, overflowX: await ev('document.documentElement.scrollWidth > innerWidth') }));
ws.close(); chrome.kill();

import { readdir, writeFile, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
const root = new URL('../dist/', import.meta.url);
async function files(dir) { const list = []; for (const e of await readdir(dir, { withFileTypes: true })) { const p = join(dir, e.name); if (e.isDirectory()) list.push(...await files(p)); else if (e.name !== 'sw.js') list.push(p); } return list; }
const { fileURLToPath } = await import('node:url');
const dir = fileURLToPath(root), paths = await files(dir), hash = createHash('sha256');
for (const p of paths) hash.update(await readFile(p));
const urls = ['./', ...paths.map(p => './' + relative(dir, p).replaceAll('\\', '/'))];
const name = 'agenty-' + hash.digest('hex').slice(0, 12);
await writeFile(join(dir, 'sw.js'), `const CACHE=${JSON.stringify(name)}, FILES=${JSON.stringify(urls)};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('agenty-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin||e.request.headers.has('Authorization'))return;const allowed=FILES.some(f=>new URL(f,self.registration.scope).href===u.href);if(!allowed)return;e.respondWith(caches.open(CACHE).then(c=>c.match(e.request,{ignoreVary:true})).then(hit=>hit||fetch(e.request)));});
`);
console.log('Offline cache:', name, urls.length, 'static files; API requests never cached.');

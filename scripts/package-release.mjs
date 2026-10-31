import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { zipSync } from 'fflate';
import { createHash } from 'node:crypto';
const files = {};
async function walk(dir) { for (const e of await readdir(dir, { withFileTypes: true })) { const p = join(dir, e.name); if (e.isDirectory()) await walk(p); else files[relative('dist', p).replaceAll('\\', '/')] = new Uint8Array(await readFile(p)); } }
await walk('dist');
if (!files['index.html'] || !files['sw.js'] || !files['_headers']) throw new Error('Run npm run build first; missing deployment entry.');
if (Object.keys(files).some(p => /(?:config\.json|\.env|\.key)$/i.test(p))) throw new Error('Unexpected private configuration in deployment.');
const zip = zipSync(files, { level: 6 });
await mkdir('release', { recursive: true });
await writeFile('release/agenty-mobile-cloudflare.zip', zip);
const info = { version: '0.1.0', target: 'https://agenty.namprojects.site', fileCount: Object.keys(files).length, zipBytes: zip.length, sha256: createHash('sha256').update(zip).digest('hex'), containsAPIKey: false, deployed: false };
await writeFile('release/release-info.json', JSON.stringify(info, null, 2));
console.log(JSON.stringify(info, null, 2));

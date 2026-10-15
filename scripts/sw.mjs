import {readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
async function files(path){const entries=await readdir(path,{withFileTypes:true});return (await Promise.all(entries.map(e=>e.isDirectory()?files(`${path}/${e.name}`):`${path}/${e.name}`))).flat();}
const all=(await files('dist')).filter(f=>!f.endsWith('/sw.js'));
const hash=createHash('sha256');for(const file of all)hash.update(await readFile(file));
const version='dyad-'+hash.digest('hex').slice(0,16);
const urls=all.map(f=>'/'+f.slice(5));
await writeFile('dist/sw.js',`const CACHE=${JSON.stringify(version)};const FILES=${JSON.stringify(urls)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
// Activate when the old app is closed; never switch versions mid-session.
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>(key.startsWith('dyad-')||/^[a-z]+-[a-f0-9]{16}$/.test(key))&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;if(event.request.mode==='navigate'){event.respondWith(caches.open(CACHE).then(cache=>cache.match('/index.html')).then(cached=>cached||fetch(event.request)));return;}if(FILES.includes(url.pathname))event.respondWith(caches.open(CACHE).then(cache=>cache.match(url.pathname)).then(cached=>cached||fetch(event.request)));});
`);
console.log(`Offline shell: ${urls.length} files, ${version}`);

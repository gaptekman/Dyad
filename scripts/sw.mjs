import {readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
async function files(path){const entries=await readdir(path,{withFileTypes:true});return (await Promise.all(entries.map(e=>e.isDirectory()?files(`${path}/${e.name}`):`${path}/${e.name}`))).flat();}
const all=(await files('dist')).filter(f=>!f.endsWith('/sw.js'));
const hash=createHash('sha256');for(const file of all)hash.update(await readFile(file));
const worker=await readFile('scripts/service-worker.js','utf8');
hash.update(worker);
const version='dyad-v3-'+hash.digest('hex').slice(0,16);
const urls=all.map(f=>'/'+f.slice(5));
await writeFile('dist/sw.js',`const CACHE=${JSON.stringify(version)};const FILES=${JSON.stringify(urls)};\n${worker}`);
console.log(`Offline shell: ${urls.length} files, ${version}`);

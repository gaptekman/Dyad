import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const source = await readFile(new URL('./service-worker.js', import.meta.url), 'utf8');
const html = text => new Response(text, { headers: { 'Content-Type': 'text/html' } });
const redirected = () => { const r=html('redirected'); Object.defineProperty(r,'redirected',{value:true}); return r; };
function setup(fetcher, cached) {
  const handlers={}, deleted=[], writes=[], requests=[];
  const cache={match:async()=>cached,put:async(path,r)=>{writes.push([path,r]);cached=r;},delete:async()=>{cached=null;}};
  const state={claimed:false,skipped:false};
  vm.runInNewContext(`const CACHE='dyad-v2-test'; const FILES=['/index.html'];\n${source}`, {
    URL,Response,fetch:async(req,options)=>{requests.push([req,options]);return fetcher(req,options);},
    caches:{open:async()=>cache,keys:async()=>['dyad-old','dyad-v2-test','unrelated-cache'],delete:async name=>deleted.push(name)},
    self:{location:{origin:'https://dyad.test'},addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting:async()=>{state.skipped=true;},clients:{claim:async()=>{state.claimed=true;}}}
  });
  return {writes,requests,deleted,state,run:async(name)=>{let result; const event={request:{url:'https://dyad.test/',method:'GET',mode:'navigate'},respondWith:p=>result=p,waitUntil:p=>result=p};handlers[name](event);return result;}};
}
test('network wins over cached shell and requests reject redirects',async()=>{
 const s=setup(async()=>html('new'),html('old')); assert.equal(await (await s.run('fetch')).text(),'new');assert.equal(s.writes.length,1);assert.equal(s.requests[0][1].redirect,'error');
});
test('redirected network response is neither returned nor cached',async()=>{
 const s=setup(async()=>redirected(),html('safe'));assert.equal(await (await s.run('fetch')).text(),'safe');assert.equal(s.writes.length,0);
});
test('offline uses safe cached HTML',async()=>{
 const s=setup(async()=>{throw Error('offline');},html('saved'));assert.equal(await (await s.run('fetch')).text(),'saved');
});
test('poisoned cached response is rejected, canonical root can recover',async()=>{
 let n=0;const s=setup(async()=>{if(n++===0)throw Error('redirect');return html('root');},redirected());assert.equal(await (await s.run('fetch')).text(),'root');
});
test('redirects without safe fallback return clean 503',async()=>{
 const s=setup(async()=>redirected(),redirected());const r=await s.run('fetch');assert.equal(r.status,503);assert.equal(r.redirected,false);assert.equal(s.writes.length,0);
});
test('opaque redirect and HTTP redirect are rejected',async()=>{
 for(const response of [Response.redirect('https://dyad.test/'),Object.defineProperty(html('opaque'),'type',{value:'opaqueredirect'})]) {
 const s=setup(async()=>response);assert.equal((await s.run('fetch')).status,503);assert.equal(s.writes.length,0);
 }
});
test('install activates repair without waiting for network or precaching',async()=>{
 const s=setup(async()=>redirected());await s.run('install');assert.equal(s.writes.length,0);assert.equal(s.requests.length,0);assert.equal(s.state.skipped,true);
});
test('activation removes only obsolete Dyad caches; no storage APIs exposed',async()=>{
 const s=setup(async()=>html('ok'));await s.run('activate');assert.deepEqual(s.deleted,['dyad-old']);assert.equal(s.state.claimed,true);
});

test('navigation response has no network URL history',async()=>{
 const network=html('clean');Object.defineProperty(network,'url',{value:'https://dyad.test/'});
 const s=setup(async()=>network);const response=await s.run('fetch');
 assert.equal(response.url,'');assert.equal(response.redirected,false);assert.equal(await response.text(),'clean');
});

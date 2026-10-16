import assert from 'node:assert/strict';
const {chromium}=await import('playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'}),context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const saved=()=>page.getByRole('status').filter({hasText:'Saved on this device'}).waitFor();
const nav=name=>page.locator('.mobile-nav').getByRole('button',{name,exact:true});
const weight=()=>page.getByLabel('Incline bench press set 1 weight',{exact:true});
try{
 await page.goto('http://127.0.0.1:4173');await page.getByRole('button',{name:'Start next session',exact:true}).click();
 await weight().fill('100');await page.getByLabel('Incline bench press set 1 reps',{exact:true}).fill('6');await page.getByRole('button',{name:'Log Incline bench press set 1',exact:true}).click();await saved();
 await nav('Settings').click();await page.getByLabel('Default weight unit',{exact:true}).selectOption('lb');await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(await page.getByLabel('Default weight unit',{exact:true}).inputValue(),'kg');
 await page.getByLabel('Default weight unit',{exact:true}).selectOption('lb');await page.getByRole('dialog').getByRole('button',{name:'Keep numbers — already in lb',exact:true}).click();await saved();
 await nav('Train').click();assert.equal(await page.getByLabel('Workout weight unit',{exact:true}).inputValue(),'lb');assert.equal(await weight().inputValue(),'100');assert.match(await page.locator('.quick-head').first().innerText(),/LB/);assert.equal(await page.getByRole('button',{name:'Unlog Incline bench press set 1',exact:true}).getAttribute('aria-pressed'),'true');
 await page.getByLabel('Workout weight unit',{exact:true}).selectOption('kg');await page.getByRole('dialog').getByRole('button',{name:'Convert weights to kg',exact:true}).click();await saved();assert.equal(await weight().inputValue(),'45.36');assert.match(await page.locator('.quick-head').first().innerText(),/KG/);
 await page.reload();await page.getByRole('button',{name:'Resume workout',exact:true}).click();assert.equal(await weight().inputValue(),'45.36');assert.equal(await page.getByLabel('Workout weight unit',{exact:true}).inputValue(),'kg');await saved();
 // Reproduce an existing journal saved by the old app: lb default, kg draft.
 await page.evaluate(async()=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('dyad-training',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});await new Promise((resolve,reject)=>{const tx=db.transaction('state','readwrite');const r=tx.objectStore('state').get('main');r.onsuccess=()=>{const s=r.result;s.unit='lb';tx.objectStore('state').put(s,'main');};tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();});
 await page.reload();await page.getByRole('button',{name:'Resume workout',exact:true}).click();await page.getByRole('button',{name:'Use my default (lb)',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Convert weights to lb',exact:true}).click();await saved();assert.equal(await weight().inputValue(),'100');
 await page.getByRole('button',{name:'Finish',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Finish session',exact:true}).click();await saved();
 await page.getByRole('button',{name:'Start next session',exact:true}).click();await nav('Settings').click();await page.getByLabel('Default weight unit',{exact:true}).selectOption('kg');await saved();assert.equal(await page.getByRole('dialog').count(),0);await nav('Train').click();assert.equal(await page.getByLabel('Workout weight unit',{exact:true}).inputValue(),'kg');
 await nav('History').click();await page.locator('.history-summary').click();await page.getByText('100 lb × 6',{exact:false}).waitFor();
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await context.setOffline(true);await page.reload();await nav('Train').click();await page.getByRole('button',{name:'Resume workout',exact:true}).click();assert.equal(await page.getByLabel('Workout weight unit',{exact:true}).inputValue(),'kg');
 await page.setViewportSize({width:320,height:740});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
 console.log('PASS: settings-to-draft unit changes, cancel, relabel, conversion, old default/draft mismatch, checked-set preservation, empty drafts, unchanged completed history, offline persistence and mobile layout.');
}finally{await browser.close();}


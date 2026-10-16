import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import('playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const saved=()=>page.getByRole('status').filter({hasText:'Saved on this device'}).waitFor();
const next=()=>page.getByRole('region',{name:'Next workout'});
const nav=name=>page.locator('.mobile-nav').getByRole('button',{name,exact:true});
async function log(name,weight){await page.getByLabel(`${name} set 1 weight`,{exact:true}).fill(weight);await page.getByLabel(`${name} set 1 reps`,{exact:true}).fill('6');await page.getByRole('button',{name:`Log ${name} set 1`,exact:true}).click();await saved();}
async function finish(){await page.getByRole('button',{name:'Finish',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Finish session',exact:true}).click();await saved();}
try{
 await mkdir('test-results',{recursive:true});await page.goto(process.env.BASE_URL||'http://127.0.0.1:4173');await next().waitFor();
 await next().getByRole('button',{name:'Start next session'}).click();await log('Incline bench press','45');
 await page.getByRole('button',{name:'Back to overview'}).click();
 await page.locator('.segment').getByRole('button',{name:'Full workout',exact:true}).click();
 assert.equal(await page.locator('.preview-exercise').count(),6);await page.locator('.start-button').click();
 assert.equal(await page.getByLabel('Upper body Incline bench press set 1 weight',{exact:true}).inputValue(),'45');
 assert.equal(await page.getByRole('button',{name:'Unlog Upper body Incline bench press set 1',exact:true}).getAttribute('aria-pressed'),'true');
 assert.deepEqual(await page.locator('.workout-section').allTextContents(),['Upper body','Lower body']);
 await log('Lower body Squat','80');await page.reload();await next().getByRole('heading',{name:'A1 · Full workout'}).waitFor();
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await next().waitFor();await context.setOffline(true);await page.reload();
 await next().getByRole('button',{name:'Resume workout'}).click();assert.equal(await page.getByLabel('Lower body Squat set 1 weight',{exact:true}).inputValue(),'80');
 await page.setViewportSize({width:320,height:740});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'test-results/full-workout-mobile.png',fullPage:true});
 await finish();await next().getByRole('heading',{name:'P1 · Upper body'}).waitFor();await context.setOffline(false);
 await nav('History').click();assert.equal(await page.locator('.history-card').count(),1);assert.match(await page.locator('.history-summary').innerText(),/FULL WORKOUT/);
 await page.locator('.history-summary').click();await page.getByText('80 kg × 6',{exact:false}).waitFor();
 await nav('Settings').click();const dl=page.waitForEvent('download');await page.getByRole('button',{name:'Export backup',exact:true}).click();const backup=await dl;await backup.saveAs('test-results/full-backup.json');
 await page.locator('input[type=file]').setInputFiles('test-results/full-backup.json');await page.getByRole('dialog').getByRole('button',{name:'Restore backup',exact:true}).click();await saved();
 await nav('Train').click();await next().getByRole('heading',{name:'P1 · Upper body'}).waitFor();
 await next().getByRole('button',{name:'Start full workout'}).click();await log('Upper body Row','35');await finish();
 await next().getByRole('heading',{name:'P1 · Lower body'}).waitFor();
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/full-workout-overview.png',fullPage:true});assert.deepEqual(errors,[]);
 console.log('PASS: full-workout selector, draft merge, checked-set preservation, Upper/Lower grouping, offline resume, combined history/backup restore, one-step cycle advance and partial completion.');
}finally{await browser.close();}


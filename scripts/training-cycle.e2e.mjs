import assert from 'node:assert/strict';
const {chromium}=await import('playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const saved=()=>page.getByRole('status').filter({hasText:'Saved on this device'}).waitFor();
const next=()=>page.getByRole('region',{name:'Next workout'});
async function finishOne(name){
 await page.getByLabel(`${name} set 1 weight`,{exact:true}).fill('25');
 await page.getByLabel(`${name} set 1 reps`,{exact:true}).fill('6');
 await page.getByRole('button',{name:`Log ${name} set 1`,exact:true}).click();
 await page.getByRole('button',{name:'Finish',exact:true}).click();
 await page.getByRole('dialog').getByRole('button',{name:'Finish session',exact:true}).click();await saved();
}
try{
 await page.goto('http://127.0.0.1:4173');await next().getByRole('heading',{name:'A1 · Upper body'}).waitFor();
 const box=await next().getByRole('button',{name:'Start next session'}).boundingBox();assert.ok(box.y+box.height<750);
 await next().getByRole('button',{name:'Rest today'}).click();await page.reload();await next().getByRole('heading',{name:'A1 · Upper body'}).waitFor();
 await next().getByRole('button',{name:'Start next session'}).click();await saved();await page.reload();
 await next().getByRole('button',{name:'Resume workout'}).click();await finishOne('Incline bench press');
 await next().getByRole('heading',{name:'A1 · Lower body'}).waitFor();await page.reload();
 await next().getByRole('heading',{name:'A1 · Lower body'}).waitFor();await next().getByRole('button',{name:'Rest today'}).click();
 assert.match(await next().innerText(),/A1 · Lower body/);await next().getByRole('button',{name:'Start next session'}).click();await finishOne('Squat');
 await next().getByRole('heading',{name:'P1 · Upper body'}).waitFor();
 await next().getByRole('button',{name:'Set my place'}).click();
 await page.getByRole('dialog').locator('.cycle-options>div').filter({has:page.getByText('P3',{exact:true})}).getByRole('button',{name:'Lower next'}).click();await saved();
 await next().getByRole('heading',{name:'P3 · Lower body'}).waitFor();await next().getByRole('button',{name:'Start next session'}).click();await finishOne('Hamstring curl');
 await next().getByRole('heading',{name:'A1 · Upper body'}).waitFor();
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await next().waitFor();
 await context.setOffline(true);await page.reload();await next().getByRole('heading',{name:'A1 · Upper body'}).waitFor();
 await page.setViewportSize({width:320,height:740});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:'test-results/training-cycle-mobile.png',fullPage:true});assert.deepEqual(errors,[]);
 console.log('PASS: rest/reload, draft resume, Upper/Lower completion, cycle advance, manual position, wraparound, offline reload and 320px layout');
}finally{await browser.close();}

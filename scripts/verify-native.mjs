import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {join,relative} from 'node:path';
async function files(dir){return (await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?files(join(dir,e.name)):[join(dir,e.name)]))).flat();}
const source=await files('dist-native');
assert.ok(source.some(p=>p.endsWith('index.html')));
assert.equal(source.filter(p=>p.endsWith('.webp')).length,44,'Bundle the entire exercise library');
assert.ok(!source.some(p=>/[\\/]sw\.js$/.test(p)),'Native builds must not carry a stale PWA worker');
for(const dir of ['android/app/src/main/assets','ios/App/App']){
 const config=JSON.parse(await readFile(`${dir}/capacitor.config.json`,'utf8'));
 assert.equal(config.appId,'io.github.gaptekman.dyad');assert.equal(config.appName,'Dyad');
 assert.equal(config.server.url,undefined,'Do not load a remote website as the app');
 assert.equal(config.server.hostname,'localhost');assert.equal(config.server.androidScheme,'https');
 assert.equal(config.android.allowMixedContent,false);
 for(const p of source)assert.deepEqual(await readFile(join(dir,'public',relative('dist-native',p))),await readFile(p),`Native asset differs: ${dir}/${p}`);
}
const manifest=await readFile('android/app/src/main/AndroidManifest.xml','utf8');
assert.ok(!/READ_EXTERNAL_STORAGE|WRITE_EXTERNAL_STORAGE|ACCESS_FINE_LOCATION|CAMERA/.test(manifest));
assert.ok(manifest.includes('android:usesCleartextTraffic="false"'));
const privacy=await readFile('ios/App/App/PrivacyInfo.xcprivacy','utf8');
assert.ok(privacy.includes('C617.1'));assert.ok((await readFile('ios/App/App.xcodeproj/project.pbxproj','utf8')).includes('PrivacyInfo.xcprivacy in Resources */,'));
const spm=await readFile('ios/App/CapApp-SPM/Package.swift','utf8');
for(const plugin of ['CapacitorFilesystem','CapacitorShare'])assert.ok(spm.includes(plugin));
console.log(`PASS: ${source.length} assets match both native bundles; 44 offline illustrations, stable local origins, native plugins, privacy manifest and restricted permissions. This is packaging validation, not a device build.`);

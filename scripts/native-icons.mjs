import sharp from 'sharp';
import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
const mark=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#141514"/><path d="M104 110h98a146 146 0 0 1 0 292h-98V110zm64 64v164h34a82 82 0 0 0 0-164z" fill="#e7e4dc"/><path d="M366 110h52v292h-52z" fill="#9d4b48"/></svg>`;
for(const [density,size] of [['mdpi',48],['hdpi',72],['xhdpi',96],['xxhdpi',144],['xxxhdpi',192]]){
 const dir=`android/app/src/main/res/mipmap-${density}`;await mkdir(dir,{recursive:true});
 for(const name of ['ic_launcher','ic_launcher_round'])await sharp(Buffer.from(mark)).resize(size,size).png().toFile(`${dir}/${name}.png`);
}
// A padded vector keeps the original D mark inside Android's adaptive mask.
await writeFile('android/app/src/main/res/drawable/ic_launcher_foreground.xml',`<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="768" android:viewportHeight="768">
<group android:translateX="128" android:translateY="128">
<path android:fillColor="#e7e4dc" android:pathData="M104,110h98a146,146 0,0 1,0 292h-98V110zm64,64v164h34a82,82 0,0 0,0 -164z"/>
<path android:fillColor="#9d4b48" android:pathData="M366,110h52v292h-52z"/></group></vector>`);
await writeFile('android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml',await readFile('android/app/src/main/res/drawable/ic_launcher_foreground.xml'));
for(const name of ['ic_launcher','ic_launcher_round'])await writeFile(`android/app/src/main/res/mipmap-anydpi-v26/${name}.xml`,`<?xml version="1.0" encoding="utf-8"?><adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@color/ic_launcher_background"/><foreground android:drawable="@drawable/ic_launcher_foreground"/></adaptive-icon>`);
// Replace all stock Capacitor splash images while retaining their dimensions.
const res='android/app/src/main/res';
for(const entry of await readdir(res,{withFileTypes:true}))if(entry.isDirectory()&&entry.name.startsWith('drawable')){
 const path=`${res}/${entry.name}/splash.png`;
 try{const {width,height}=await sharp(await readFile(path)).metadata();const logo=await sharp(Buffer.from(mark)).resize(Math.round(Math.min(width,height)*0.24)).png().toBuffer();await sharp({create:{width,height,channels:3,background:'#111211'}}).composite([{input:logo,gravity:'centre'}]).png().toFile(path);}catch(e){if(e.code!=='ENOENT')throw e;}
}
const ios='ios/App/App/Assets.xcassets/AppIcon.appiconset';
await mkdir(ios,{recursive:true});await sharp(Buffer.from(mark)).resize(1024,1024).removeAlpha().png().toFile(`${ios}/AppIcon-512@2x.png`);
await writeFile(`${ios}/Contents.json`,JSON.stringify({images:[{filename:'AppIcon-512@2x.png',idiom:'universal',platform:'ios',size:'1024x1024'}],info:{author:'xcode',version:1}},null,2)+'\n');
for(const path of ['splash-2732x2732.png','splash-2732x2732-1.png','splash-2732x2732-2.png']){
 const logo=await sharp(Buffer.from(mark)).resize(400).png().toBuffer();await sharp({create:{width:2732,height:2732,channels:3,background:'#111211'}}).composite([{input:logo,gravity:'centre'}]).png().toFile(`ios/App/App/Assets.xcassets/Splash.imageset/${path}`);
}
console.log('Generated Dyad Android launcher icons and opaque 1024px iOS icon.');

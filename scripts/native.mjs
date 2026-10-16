import { spawnSync } from 'node:child_process';

function run(args){
  const r=spawnSync(process.execPath,args,{stdio:'inherit',env:process.env});
  if(r.error)throw r.error;
  if(r.status!==0)process.exit(r.status??1);
}
const [command='build',platform]=process.argv.slice(2);
if(!['build','sync','open','run','check'].includes(command)||platform&&!['android','ios'].includes(platform)){
  console.error('Usage: node scripts/native.mjs build|sync|check|open|run [android|ios]');process.exit(1);
}
const cap='node_modules/@capacitor/cli/bin/capacitor';
if(command==='build'||command==='sync'){
  run(['node_modules/typescript/bin/tsc','-b']);
  run(['node_modules/vite/bin/vite.js','build','--outDir','dist-native']);
}
if(command==='sync')run([cap,'sync',...(platform?[platform]:[])]);
if(command==='open'||command==='run'){
  if(!platform){console.error('Choose android or ios.');process.exit(1);}
  run([cap,command,platform]);
}
if(command==='check')run(['scripts/verify-native.mjs']);

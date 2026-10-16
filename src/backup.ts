import type { State } from './domain';
import { isNativeApp } from './platform';

export async function exportBackup(state:State):Promise<'downloaded'|'shared'> {
  const data=JSON.stringify(state,null,2);
  const filename=`dyad-backup-${new Date().toISOString().slice(0,10)}.json`;
  if(isNativeApp()) {
    const [{Filesystem,Directory,Encoding},{Share}]=await Promise.all([
      import('@capacitor/filesystem'),import('@capacitor/share'),
    ]);
    // Cache is app-private and shareable through the native file provider.
    // Do not request broad device storage permissions or expose all documents.
    const {uri}=await Filesystem.writeFile({path:filename,data,directory:Directory.Cache,encoding:Encoding.UTF8});
    await Share.share({title:'Dyad workout backup',dialogTitle:'Save your Dyad backup',files:[uri]});
    return 'shared';
  }
  const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=filename;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  return 'downloaded';
}

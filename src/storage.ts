import { openDB, type IDBPDatabase } from 'idb';
import { initialState, validateState, trainingCycle, type State } from './domain';
let dbPromise:Promise<IDBPDatabase>|undefined;
function db(){return dbPromise??=openDB('dyad-training',1,{upgrade(db){db.createObjectStore('state');},blocking(){location.reload();}});}
export async function load():Promise<State>{
 const tx=(await db()).transaction('state','readwrite');
 const stored=await tx.store.get('main');
 const state=stored===undefined?initialState():validateState(stored);
 // Keep the existing database and workout records. Apply the requested default
 // once, then respect later user changes to the rest setting.
 if(!await tx.store.get('dyad-rest-3m-v1')){
  state.restSeconds=180;
  await tx.store.put(state,'main');
  await tx.store.put(true,'dyad-rest-3m-v1');
 }
 if(!state.trainingCycle){state.trainingCycle=trainingCycle(state);await tx.store.put(state,'main');}
 await tx.done;
 return state;
}
export async function save(state:State){const tx=(await db()).transaction('state','readwrite');await tx.store.put(state,'main');await tx.done;}
export async function requestPersistence(){if(navigator.storage?.persist)return navigator.storage.persist();return false;}

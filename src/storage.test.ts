import 'fake-indexeddb/auto';
import {openDB} from 'idb';
import {it,expect} from 'vitest';
import {load,save} from './storage';
import {initialState,startSession} from './domain';
it('updates an existing journal to three-minute rest once without losing logs or future preferences',async()=>{const db=await openDB('dyad-training',1,{upgrade(db){db.createObjectStore('state');}});const old=initialState();old.restSeconds=120;const session=startSession(old,old.routine[0],'upper');session.entries[0].sets[0]={weight:'60',reps:'8',rir:'2',done:true};old.sessions.push(session);await db.put('state',old,'main');const migrated=await load();expect(migrated.restSeconds).toBe(180);expect(migrated.sessions).toEqual(old.sessions);migrated.restSeconds=90;await save(migrated);expect((await load()).restSeconds).toBe(90);await save(initialState());db.close();});
it('initializes and atomically persists draft sets, settings and routine edits',async()=>{expect((await load()).sessions).toEqual([]);const s=initialState(),session=startSession(s,s.routine[0],'lower');session.entries[0].sets[0]={weight:'80',reps:'5',rir:'2',done:true};s.sessions.push(session);s.restSeconds=180;s.routine[0].name='My day';await save(s);const restored=await load();expect(restored).toEqual(s);});
it('commits queued versions in order without losing the latest log',async()=>{const a=initialState();a.restSeconds=60;const b=structuredClone(a);b.restSeconds=90;await Promise.all([save(a),save(b)]);expect((await load()).restSeconds).toBe(90);});

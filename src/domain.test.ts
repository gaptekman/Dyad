import {describe,it,expect} from 'vitest';
import {initialState,routine,startSession,validSet,previous,volume,records,suggestion,validateState,doneCount} from './domain';
const good={weight:'100',reps:'6',rir:'2',done:true};
describe('routine and sessions',()=>{
 it('preserves the complete seven-day split',()=>{expect(routine.map(d=>d.id)).toEqual(['A1','P1','A2','P2','A3','P3','REST']);expect(routine[0].lower.map(e=>[e.id,e.sets,e.min,e.max])).toEqual([['squat',4,4,6],['cable-crunch',3,8,8]]);expect(routine[5].upper).toHaveLength(4);expect(routine[6].lower).toHaveLength(0);});
 it('snapshots the routine to preserve history after edits',()=>{const s=initialState();const session=startSession(s,s.routine[0],'lower');s.routine[0].lower[0].name='Edited';expect(session.entries[0].exercise.name).toBe('Squat');expect(session.entries[0].sets).toHaveLength(4);});
 it('creates independent upper and lower drafts',()=>{const s=initialState(),lo=startSession(s,s.routine[0],'lower'),up=startSession(s,s.routine[0],'upper');expect(lo.id).not.toBe(up.id);expect(up.entries).toHaveLength(4);expect(lo.entries).toHaveLength(2);});
 it('prefills only checked sets from completed sessions in the same unit',()=>{const s=initialState(),old=startSession(s,s.routine[0],'lower');old.completedAt='2026-01-01T00:00:00.000Z';old.entries[0].sets[0]={...good};old.entries[0].sets[1]={...good,done:false};s.sessions.push(old);const next=startSession(s,s.routine[0],'lower');expect(next.entries[0].sets[0]).toEqual({...good,done:false});expect(next.entries[0].sets[1].weight).toBe('');s.unit='lb';expect(startSession(s,s.routine[0],'lower').entries[0].sets[0].weight).toBe('');});
 it('uses most recent completion rather than array order',()=>{const s=initialState(),a=startSession(s,s.routine[0],'lower'),b=structuredClone(a);b.id='b';a.completedAt='2026-02-01T00:00:00Z';b.completedAt='2026-01-01T00:00:00Z';a.entries[0].sets[0]={...good,weight:'105'};b.entries[0].sets[0]={...good};expect(previous([a,b],'squat','kg')?.sets[0].weight).toBe('105');});
});
describe('valid logging and statistics',()=>{
 it.each([['weight',''],['weight','-1'],['weight','NaN'],['weight','2001'],['reps','0'],['reps','1.5'],['reps','201'],['rir',''],['rir','11'],['rir','-1']])('rejects %s=%s',(key,value)=>expect(validSet({...good,[key]:value})).toBe(false));
 it('accepts zero external load and fractional RIR',()=>expect(validSet({...good,weight:'0',rir:'1.5'})).toBe(true));
 it('excludes unchecked and invalid sets from volume',()=>{const s=initialState(),session=startSession(s,s.routine[0],'lower');session.entries[0].sets[0]={...good};session.entries[0].sets[1]={...good,done:false};expect(volume(session)).toBe(600);expect(doneCount(session)).toBe(1);});
 it('calculates records from completed sessions only, separating units',()=>{const s=initialState(),a=startSession(s,s.routine[0],'lower');a.entries[0].sets[0]={...good};expect(records([a])).toHaveLength(0);a.completedAt='2026-01-01T00:00:00Z';const b=structuredClone(a);b.id='b';b.unit='lb';b.entries[0].sets[0].weight='225';expect(records([a,b]).filter(p=>p.id==='squat')).toHaveLength(2);});
 it('suggests increases only after all sets reach the top with RIR',()=>{const s=initialState(),e=startSession(s,s.routine[0],'lower').entries[0];e.sets=e.sets.map(()=>({...good}));expect(suggestion(e,'kg')).toContain('small increase');e.sets[0].rir='0';expect(suggestion(e,'kg')).toContain('Keep this load');e.sets[0].done=false;expect(suggestion(e,'kg')).toContain('Log every set');});
});
describe('backup safety',()=>{
 it('round trips valid data without sharing references',()=>{const s=initialState();const restored=validateState(JSON.parse(JSON.stringify(s)));restored.routine[0].name='New';expect(s.routine[0].name).toBe('Anterior 01');});
 it('rejects unsupported versions and incomplete schemas',()=>{expect(()=>validateState({version:2})).toThrow();expect(()=>validateState(null)).toThrow();});
 it('rejects duplicate IDs, broken prescriptions, and invalid logged sets',()=>{const s=initialState();s.routine[1].id='A1';expect(()=>validateState(s)).toThrow();const t=initialState();t.routine[0].lower[0].min=10;expect(()=>validateState(t)).toThrow();const u=initialState(),session=startSession(u,u.routine[0],'lower');session.entries[0].sets[0]={...good,weight:'bad'};u.sessions=[session];expect(()=>validateState(u)).toThrow();});
 it('rejects empty completed sessions',()=>{const s=initialState(),session=startSession(s,s.routine[0],'lower');session.completedAt=new Date().toISOString();s.sessions.push(session);expect(()=>validateState(s)).toThrow();});
});

import{describe,it,expect}from'vitest';
import{initialState,startSession,validSet,logAndPrefillNext,suggestion,validateState}from'./domain';
const entry=()=>startSession(initialState(),initialState().routine[0],'upper').entries[0];
describe('quick set entry',()=>{
 it('logs without requiring an invented RIR value and round trips backups',()=>{const state=initialState(),session=startSession(state,state.routine[0],'upper');session.entries[0].sets[0]={weight:'42.5',reps:'8',rir:'',done:true};session.completedAt=new Date().toISOString();state.sessions=[session];expect(validSet(session.entries[0].sets[0])).toBe(true);expect(validateState(state).sessions[0].entries[0].sets[0].rir).toBe('');});
 it('carries weight and reps into the next blank set without marking it done or guessing effort',()=>{const e=entry();e.sets[0]={weight:'42.5',reps:'8',rir:'2',done:false};const next=logAndPrefillNext(e,0);expect(next.sets[0].done).toBe(true);expect(next.sets[1]).toEqual({weight:'42.5',reps:'8',rir:'',done:false});expect(next.sets[2].weight).toBe('');expect(e.sets[0].done).toBe(false);});
 it('keeps values already entered for the next set',()=>{const e=entry();e.sets[0]={weight:'40',reps:'8',rir:'',done:false};e.sets[1]={weight:'37.5',reps:'7',rir:'1',done:false};expect(logAndPrefillNext(e,0).sets[1]).toEqual(e.sets[1]);});
 it('does not log invalid input or overwrite a checked next set',()=>{const e=entry();expect(logAndPrefillNext(e,0)).toBe(e);e.sets[0]={weight:'40',reps:'8',rir:'',done:false};e.sets[1]={weight:'35',reps:'6',rir:'0',done:true};expect(logAndPrefillNext(e,0).sets[1]).toEqual(e.sets[1]);});
 it('unchecks a logged set without changing other rows',()=>{const e=entry();e.sets[0]={weight:'40',reps:'8',rir:'',done:true};e.sets[1]={weight:'37.5',reps:'7',rir:'1',done:false};const next=logAndPrefillNext(e,0);expect(next.sets[0].done).toBe(false);expect(next.sets[1]).toEqual(e.sets[1]);});
 it('does not suggest a weight increase when RIR is unknown',()=>{const e=entry();e.sets=e.sets.map(()=>({weight:'40',reps:'8',rir:'',done:true}));expect(suggestion(e,'kg')).not.toContain('small increase');expect(suggestion(e,'kg')).toContain('optional RIR');});
});

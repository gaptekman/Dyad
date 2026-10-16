import {describe,it,expect} from 'vitest';
import {initialState,startSession,nextTraining,finishTraining,trainingCycle,validateState,cycleDays,type State} from './domain';
function finish(s:State,dayId:string,part:'upper'|'lower'){
 const session=startSession(s,s.routine.find(d=>d.id===dayId)!,part);
 session.entries[0].sets[0]={weight:'20',reps:'6',rir:'',done:true};
 return finishTraining({...s,sessions:[...s.sessions,session]},session.id,new Date(100000+s.sessions.length*1000).toISOString());
}
describe('rolling training cycle',()=>{
 it('starts Upper first and ignores time/rest/browsing',()=>{const s=initialState();expect(nextTraining(s).part).toBe('upper');expect(trainingCycle(s).dayId).toBe('A1');expect(trainingCycle(validateState(JSON.parse(JSON.stringify(s))))).toEqual(trainingCycle(s));});
 it('requires both parts and ignores duplicate completions',()=>{let s=finish(initialState(),'A1','upper');expect(nextTraining(s).part).toBe('lower');s=finish(s,'A1','upper');expect(trainingCycle(s).dayId).toBe('A1');s=finish(s,'A1','lower');expect(nextTraining(s).day.id).toBe('P1');expect(nextTraining(s).part).toBe('upper');});
 it('handles lower before upper',()=>{let s=finish(initialState(),'A1','lower');expect(nextTraining(s).part).toBe('upper');s=finish(s,'A1','upper');expect(trainingCycle(s).dayId).toBe('P1');});
 it('loops the entire six-day cycle without mandatory rest',()=>{let s=initialState();for(const id of cycleDays){expect(nextTraining(s).day.id).toBe(id);s=finish(s,id,'upper');s=finish(s,id,'lower');}expect(trainingCycle(s)).toEqual({dayId:'A1',completedParts:[]});});
 it('resumes a draft without advancing and ignores out-of-order days',()=>{let s=finish(initialState(),'A1','upper');const draft=startSession(s,s.routine[0],'lower');s.sessions.push(draft);expect(nextTraining(s).draft?.id).toBe(draft.id);s=finish(s,'A3','upper');expect(trainingCycle(s).dayId).toBe('A1');expect(nextTraining(s).part).toBe('lower');});
 it('does not advance an empty or already completed session',()=>{let s=initialState();const draft=startSession(s,s.routine[0],'upper');s.sessions.push(draft);expect(finishTraining(s,draft.id,new Date().toISOString())).toBe(s);s=finish(s,'A1','upper');expect(finishTraining(s,s.sessions.at(-1)!.id,new Date().toISOString())).toBe(s);});
 it('recovers a legacy history and accepts old backups',()=>{let s=finish(initialState(),'A1','upper');s=finish(s,'A1','lower');s=finish(s,'P1','upper');delete s.trainingCycle;expect(trainingCycle(validateState(s))).toEqual({dayId:'P1',completedParts:['upper']});});
 it('preserves cursor through backups, routine edits and history deletion',()=>{let s=finish(initialState(),'A1','upper');s=validateState(JSON.parse(JSON.stringify(s)));s.sessions=[];s.routine[0].upper[0].name='Changed';expect(nextTraining(s).part).toBe('lower');});
 it('rejects invalid cursor data without rejecting legacy backups',()=>{for(const c of [{dayId:'REST',completedParts:[]},{dayId:'A1',completedParts:['upper','lower']},{dayId:'A1',completedParts:['nope']}])expect(()=>validateState({...initialState(),trainingCycle:c})).toThrow();expect(()=>validateState(initialState())).not.toThrow();});
});

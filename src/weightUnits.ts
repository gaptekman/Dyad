import type {State} from './domain';

export type UnitChangeMode='convert'|'keep';
export function draftsForUnit(state:State,target:State['unit'],ids?:string[]){
 return state.sessions.filter(s=>!s.completedAt&&s.unit!==target&&(!ids||ids.includes(s.id)));
}
export function changeWeightUnit(state:State,target:State['unit'],mode:UnitChangeMode,ids?:string[]):State {
 const affected=new Set(draftsForUnit(state,target,ids).map(s=>s.id));
 const sessions=state.sessions.map(session=>{
  if(!affected.has(session.id))return session;
  const entries=mode==='keep'?session.entries:session.entries.map(entry=>({...entry,sets:entry.sets.map(set=>{
   if(!set.weight.trim())return set;
   const weight=Number(set.weight);
   if(!Number.isFinite(weight)||weight<0||weight>2000)throw new Error('Finish entering valid weights before converting, or choose Keep numbers if they already use the new unit.');
   const converted=Number((target==='lb'?weight/0.45359237:weight*0.45359237).toFixed(2));
   if(converted>2000)throw new Error('A converted weight exceeds the 2000 weight limit. The unit and workout were left unchanged.');
   return {...set,weight:String(converted)};
  })}));
  return {...session,unit:target,entries};
 });
 return {...state,unit:target,sessions};
}


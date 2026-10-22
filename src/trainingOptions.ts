import type { Day, Exercise, Session, State } from './domain';

/** Stable exercise IDs keep variation history independent. */
export const alternatives: Record<string, { id: string; name: string }[]> = {
 'squat': [{id:'hack-squat',name:'Hack squat'},{id:'pendulum',name:'Pendulum squat'}],
 'pendulum': [{id:'squat',name:'Barbell squat'},{id:'hack-squat',name:'Hack squat'},{id:'leg-press',name:'Leg press'}],
 'incline-bench': [{id:'incline-db',name:'Incline dumbbell press'},{id:'incline-smith',name:'Smith incline press'}],
 'incline-db': [{id:'incline-bench',name:'Incline barbell bench press'},{id:'incline-smith',name:'Smith incline press'}],
 'ohp': [{id:'db-shoulder-press',name:'Dumbbell shoulder press'},{id:'machine-shoulder-press',name:'Machine shoulder press'}],
 'row': [{id:'cable-row',name:'Cable row'},{id:'machine-row',name:'Chest-supported machine row'},{id:'tbar-row',name:'T-bar row'}],
 'seated-row': [{id:'cable-row',name:'Cable row'},{id:'machine-row',name:'Machine row'}],
 'pulldown': [{id:'iso-front-pulldown',name:'Iso-lateral front pulldown'},{id:'pullup',name:'Pull-up'}],
 'rdl': [{id:'db-rdl',name:'Dumbbell Romanian deadlift'},{id:'smith-rdl',name:'Smith Romanian deadlift'}],
 'lateral-raise': [{id:'cable-lateral-raise',name:'Cable lateral raise'},{id:'db-lateral-raise',name:'Dumbbell lateral raise'}],
 'curl': [{id:'preacher-curl',name:'Preacher curl'},{id:'incline-curl',name:'Incline dumbbell curl'},{id:'cable-curl',name:'Cable curl'}],
 'hammer-curl': [{id:'crossbody-hammer',name:'Cross-body hammer curl'},{id:'rope-hammer',name:'Rope hammer curl'}],
 'oh-triceps': [{id:'cable-oh-triceps',name:'Cable overhead triceps extension'},{id:'db-oh-triceps',name:'Dumbbell overhead triceps extension'}],
 'pushdown': [{id:'single-pushdown',name:'Single-arm triceps pushdown'},{id:'straightbar-pushdown',name:'Straight-bar pushdown'}],
 'calf-raise': [{id:'seated-calf',name:'Seated calf raise'},{id:'standing-calf',name:'Standing calf raise'}],
 'core': [{id:'cable-crunch',name:'Cable crunch'},{id:'hanging-leg-raise',name:'Hanging leg raise'}],
 'chest-press': [{id:'machine-chest-press',name:'Machine chest press'},{id:'db-chest-press',name:'Dumbbell chest press'}],
 'hamstring-curl': [{id:'seated-leg-curl',name:'Seated leg curl'},{id:'lying-leg-curl',name:'Lying leg curl'}],
 'leg-extension': [{id:'single-leg-extension',name:'Single-leg extension'}],
 'rear-delt': [{id:'reverse-pec-deck',name:'Reverse pec deck'},{id:'cable-rear-delt',name:'Cable rear delt fly'}],
 'chest-fly': [{id:'pec-deck',name:'Pec deck'},{id:'cable-fly',name:'Cable chest fly'}]
};
export const finishers: Record<string, {id:string;name:string;sets:number;min:number;max:number}[]> = {
 A1:[{id:'weighted-dips',name:'Weighted dips',sets:2,min:6,max:10}],
 P1:[{id:'reverse-curl',name:'Reverse curl',sets:2,min:10,max:15}],
 A2:[{id:'cable-lateral-raise',name:'Cable lateral raise',sets:2,min:10,max:15}],
 P2:[{id:'incline-curl',name:'Incline dumbbell curl',sets:2,min:8,max:12}],
 A3:[{id:'weighted-dips',name:'Weighted dips',sets:2,min:6,max:10}],
 P3:[{id:'hammer-curl',name:'Hammer curl',sets:2,min:8,max:12}]
};
export function variants(exercise:Exercise) {
 const choices=[{id:exercise.id,name:exercise.name},...(alternatives[exercise.id]??[])];
 return [...new Map(choices.map(c=>[c.id,c])).values()];
}
export function lastVariation(sessions:Session[],id:string,unit:State['unit']) {
 return sessions.filter(s=>s.completedAt&&s.unit===unit)
  .sort((a,b)=>b.completedAt!.localeCompare(a.completedAt!))
  .flatMap(s=>s.entries.filter(e=>e.exercise.id===id&&e.sets.some(x=>x.done))
   .map(e=>({date:s.completedAt!,sets:e.sets.filter(x=>x.done)})))[0];
}
export function restTargetSeconds(id:string):number {
 if(/squat|rdl|deadlift|hip-thrust|leg-press|weighted-dips/.test(id))return 210;
 if(/press|bench|row|pulldown|pullup/.test(id))return 180;
 return 90;
}
export function estimateWorkoutMinutes(exercises:Exercise[]):number {
 const seconds=exercises.reduce((total,e)=>total+e.sets*45+Math.max(0,e.sets-1)*restTargetSeconds(e.id)+90,0);
 return Math.round(seconds/60);
}
export function swapRoutineVariation(days:Day[],dayId:string,section:'upper'|'lower',index:number,choice:{id:string;name:string}):Day[] {
 return days.map(day=>day.id!==dayId?day:{...day,[section]:day[section].map((exercise,i)=>i===index?{...exercise,id:choice.id,name:choice.name}:exercise)});
}

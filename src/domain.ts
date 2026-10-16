export type Exercise = { id: string; name: string; sets: number; min: number; max: number; note?: string };
export type Day = { id: string; name: string; focus: string; lower: Exercise[]; upper: Exercise[] };
export type SetLog = { weight: string; reps: string; rir: string; done: boolean };
export type Entry = { exercise: Exercise; sets: SetLog[] };
export type Session = { id: string; dayId: string; dayName: string; part: 'upper'|'lower'; startedAt: string; completedAt?: string; entries: Entry[]; unit: 'kg'|'lb' };
export type TrainingCycle = { dayId: string; completedParts: Session['part'][] };
export const cycleDays = ['A1','P1','A2','P2','A3','P3'] as const;
export type State = { trainingCycle?: TrainingCycle; version: 1; routine: Day[]; sessions: Session[]; unit: 'kg'|'lb'; timerEnd: number | null; restSeconds: number };
const ex = (id:string,name:string,sets:number,min:number,max=min,note?:string):Exercise => ({id,name,sets,min,max,note});
export const routine:Day[] = [
 {id:'A1',name:'Anterior 01',focus:'Squat / push',lower:[ex('squat','Squat',4,4,6),ex('cable-crunch','Cable crunch',3,8)],upper:[ex('incline-bench','Incline bench press',4,6,8),ex('ohp','Overhead press',3,5,8),ex('lateral-raise','Lateral raise',3,8,10),ex('curl','Biceps curl',3,6)]},
 {id:'P1',name:'Posterior 01',focus:'Hinge / pull',lower:[ex('rdl','Romanian deadlift',4,6,8),ex('calf-raise','Calf raise',4,10,12)],upper:[ex('row','Row',4,6,8),ex('pulldown','Lat pulldown',3,6,8),ex('oh-triceps','Overhead triceps extension',3,6,8)]},
 {id:'A2',name:'Anterior 02',focus:'Quads / shoulders',lower:[ex('pendulum','Pendulum squat',3,4,6),ex('leg-extension','Leg extension',3,6,8),ex('core','Core',3,8,12,'Choose your movement; reps are editable.')],upper:[ex('incline-db','Incline dumbbell press',3,6,8),ex('lateral-raise','Lateral raise',3,8,10),ex('hammer-curl','Hammer curl',3,6,8)]},
 {id:'P2',name:'Posterior 02',focus:'Glutes / back',lower:[ex('hip-thrust','Hip thrust',3,6,8),ex('hamstring-curl','Hamstring curl',3,8,10),ex('calf-raise','Calf raise',4,10,12)],upper:[ex('seated-row','Seated row',3,6,8),ex('rear-delt','Rear delt fly',3,10,12),ex('oh-triceps','Overhead triceps extension',3,6,8)]},
 {id:'A3',name:'Anterior 03',focus:'Single leg / chest',lower:[ex('split-hack','Bulgarian split hack squat',3,8,8,'Reps per leg. Log the weight once, after both legs.'),ex('leg-extension','Leg extension',3,6,8),ex('core','Core',3,8,12,'Choose your movement; reps are editable.')],upper:[ex('chest-press','Chest press',3,6,8),ex('chest-fly','Chest fly',2,8,12),ex('lateral-raise','Lateral raise',3,8,10),ex('curl','Biceps curl',3,8)]},
 {id:'P3',name:'Posterior 03',focus:'Hamstrings / lats',lower:[ex('hamstring-curl','Hamstring curl',3,10,12),ex('hip-abduction','Hip abduction',3,12,15)],upper:[ex('pulldown','Lat pulldown',3,10),ex('face-pull','Face pull',3,15),ex('pushdown','Rope triceps pushdown',3,12),ex('core','Core',3,8,12,'Choose your movement; reps are editable.')]},
 {id:'REST',name:'Recovery',focus:'Rest / reset',lower:[],upper:[]}
];
export const initialState = ():State => ({version:1,trainingCycle:{dayId:'A1',completedParts:[]},routine:structuredClone(routine),sessions:[],unit:'kg',timerEnd:null,restSeconds:180});
export const validSet = (s:SetLog) => s.weight.trim()!=='' && Number.isFinite(+s.weight) && +s.weight>=0 && +s.weight<=2000 && /^\d+$/.test(s.reps) && +s.reps>0 && +s.reps<=200 && (s.rir.trim()==='' || Number.isFinite(+s.rir) && +s.rir>=0 && +s.rir<=10);
export function logAndPrefillNext(entry:Entry,index:number):Entry {
 const set=entry.sets[index];
 if(!set||!validSet(set))return entry;
 const sets=entry.sets.map((s,i)=>i===index?{...s,done:!s.done}:{...s});
 const next=sets[index+1];
 if(!set.done&&next&&!next.done){
  if(!next.weight.trim())next.weight=set.weight;
  if(!next.reps.trim())next.reps=set.reps;
 }
 return {...entry,sets};
}
export const volume = (s:Session) => s.entries.reduce((n,e)=>n+e.sets.filter(x=>x.done&&validSet(x)).reduce((a,x)=>a+(+x.weight)*(+x.reps),0),0);
export const doneCount = (s:Session) => s.entries.flatMap(e=>e.sets).filter(x=>x.done).length;
export const setCount = (s:Session) => s.entries.reduce((n,e)=>n+e.sets.length,0);
export function previous(sessions:Session[],id:string,unit:State['unit'],exclude?:string) { return sessions.filter(s=>s.completedAt&&s.unit===unit&&s.id!==exclude&&s.entries.some(e=>e.exercise.id===id&&e.sets.some(x=>x.done))).sort((a,b)=>b.completedAt!.localeCompare(a.completedAt!))[0]?.entries.find(e=>e.exercise.id===id); }
export function startSession(state:State,day:Day,part:Session['part']):Session {
 return {id:crypto.randomUUID(),dayId:day.id,dayName:day.name,part,startedAt:new Date().toISOString(),unit:state.unit,entries:day[part].map(exercise=>({exercise:structuredClone(exercise),sets:Array.from({length:exercise.sets},(_,i)=>{const p=previous(state.sessions,exercise.id,state.unit)?.sets[i];return {weight:p?.done?p.weight:'',reps:p?.done?p.reps:'',rir:'',done:false};})}))};
}
export function suggestion(e:Entry,unit:State['unit']) {
 const done=e.sets.filter(s=>s.done&&validSet(s));
 if(done.length!==e.sets.length||!done.length)return 'Log every set to get a next-session suggestion.';
 if(done.every(s=>+s.reps>=e.exercise.max&&+s.rir>=1))return `Top of the range. Try a small increase next time (${unit==='kg'?'1–2.5 kg':'2.5–5 lb'}), if form stays solid.`;
 if(done.some(s=>+s.reps<e.exercise.min))return 'Below the target range. Repeat this load, or reduce it slightly to keep your form.';
 if(done.some(s=>s.rir.trim()===''))return 'Keep this load and build reps. Add optional RIR values for a load-increase suggestion.';
 return 'Keep this load and build toward the top of the rep range.';
}
export function records(sessions:Session[]) {
 const map=new Map<string,{id:string;name:string;unit:State['unit'];weight:number;reps:number;date:string}>();
 for(const s of sessions.filter(s=>s.completedAt))for(const e of s.entries)for(const set of e.sets.filter(x=>x.done&&validSet(x))){const key=e.exercise.id+s.unit;const old=map.get(key);if(!old||+set.weight>old.weight||(+set.weight===old.weight&&+set.reps>old.reps))map.set(key,{id:e.exercise.id,name:e.exercise.name,unit:s.unit,weight:+set.weight,reps:+set.reps,date:s.completedAt!});}
 return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name));
}
export function validateState(value:unknown):State {
 const fail=()=>{throw new Error('This file is not a valid Dyad v1 backup. No data was changed.');};
 if(!value||typeof value!=='object')return fail();
 const s=value as State;
 if(s.version!==1||!['kg','lb'].includes(s.unit)||!Array.isArray(s.routine)||!Array.isArray(s.sessions)||!Number.isInteger(s.restSeconds)||s.restSeconds<15||s.restSeconds>900||(s.timerEnd!==null&&(!Number.isFinite(s.timerEnd)||s.timerEnd<0)))return fail();
 if(s.trainingCycle!==undefined){const c=s.trainingCycle;if(!c||!cycleDays.some(id=>id===c.dayId)||!Array.isArray(c.completedParts)||c.completedParts.length>1||!c.completedParts.every(p=>p==='upper'||p==='lower'))return fail();}
 const strings=(...v:unknown[])=>v.every(x=>typeof x==='string'&&x.length>0&&x.length<1000);
 const exercise=(e:Exercise)=>e&&strings(e.id,e.name)&&Number.isInteger(e.sets)&&e.sets>0&&e.sets<=20&&Number.isInteger(e.min)&&e.min>0&&Number.isInteger(e.max)&&e.max>=e.min&&e.max<=200&&(e.note===undefined||typeof e.note==='string');
 if(s.routine.length!==7||new Set(s.routine.map(d=>d.id)).size!==7||!routine.every(d=>s.routine.some(x=>x.id===d.id)))return fail();
 for(const d of s.routine)if(!strings(d.id,d.name,d.focus)||!['lower','upper'].every(p=>Array.isArray(d[p as 'lower'])&&d[p as 'lower'].length<=30&&d[p as 'lower'].every(exercise)&&new Set(d[p as 'lower'].map(e=>e.id)).size===d[p as 'lower'].length))return fail();
 if(s.routine.some(d=>d.id!=='REST'&&(!d.lower.length||!d.upper.length)))return fail();
 const date=(x:unknown)=>typeof x==='string'&&Number.isFinite(Date.parse(x));
 if(new Set(s.sessions.map(x=>x.id)).size!==s.sessions.length)return fail();
 for(const x of s.sessions){if(!strings(x.id,x.dayId,x.dayName)||!s.routine.some(d=>d.id===x.dayId)||!['lower','upper'].includes(x.part)||!['kg','lb'].includes(x.unit)||!date(x.startedAt)||(x.completedAt!==undefined&&!date(x.completedAt))||!Array.isArray(x.entries)||!x.entries.length||x.entries.length>30)return fail();for(const e of x.entries){if(!exercise(e.exercise)||!Array.isArray(e.sets)||!e.sets.length||e.sets.length>20)return fail();for(const st of e.sets)if(!st||typeof st.weight!=='string'||typeof st.reps!=='string'||typeof st.rir!=='string'||typeof st.done!=='boolean'||(st.done&&!validSet(st)))return fail();}if(x.completedAt&&!doneCount(x))return fail();}
 return structuredClone(s);
}

// Completion, not the calendar, moves the training cycle. Browsing/rest never does.
export function advanceCycle(cycle:TrainingCycle,session:Session):TrainingCycle {
 if(!session.completedAt || session.dayId!==cycle.dayId || cycle.completedParts.includes(session.part))return cycle;
 const completedParts=[...cycle.completedParts,session.part];
 return completedParts.length===2?{dayId:cycleDays[(cycleDays.indexOf(cycle.dayId as typeof cycleDays[number])+1)%cycleDays.length],completedParts:[]}:{...cycle,completedParts};
}
export function trainingCycle(state:State):TrainingCycle {
 if(state.trainingCycle)return state.trainingCycle;
 // Older backups have no cursor. Replay their completions once when loaded.
 const history=state.sessions.filter(s=>s.completedAt&&cycleDays.some(id=>id===s.dayId)).sort((a,b)=>a.completedAt!.localeCompare(b.completedAt!));
 let cycle:TrainingCycle={dayId:history[0]?.dayId||'A1',completedParts:[]};
 for(const session of history)cycle=advanceCycle(cycle,session);
 return cycle;
}
export function nextTraining(state:State) {
 const cycle=trainingCycle(state);
 const draft=state.sessions.find(s=>s.dayId===cycle.dayId&&!s.completedAt&&!cycle.completedParts.includes(s.part));
 const part=draft?.part||(cycle.completedParts.includes('upper')?'lower':'upper');
 return {cycle,day:state.routine.find(d=>d.id===cycle.dayId)!,part,draft};
}
export function finishTraining(state:State,id:string,at:string):State {
 const session=state.sessions.find(s=>s.id===id);
 if(!session||session.completedAt||!doneCount(session))return state;
 const finished={...session,completedAt:at};
 return {...state,timerEnd:null,trainingCycle:advanceCycle(trainingCycle(state),finished),sessions:state.sessions.map(s=>s.id===id?finished:s)};
}

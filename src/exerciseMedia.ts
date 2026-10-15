import items from './exercise-library.json';
import {routine,type Exercise} from './domain';

export type LibraryExercise={id:string;name:string;category:string;image:string;source:string;alt:string};
export const exerciseLibrary:LibraryExercise[]=items;
export const exerciseCategories=['All','Chest','Back','Shoulders','Biceps','Triceps','Quads','Hamstrings & glutes','Calves','Core'];
const defaults=new Map(routine.flatMap(day=>[...day.lower,...day.upper]).map(e=>[e.id,e.name.toLowerCase()]));
export function mediaForExercise(exercise:Pick<Exercise,'id'|'name'>):LibraryExercise|undefined{
 const media=exerciseLibrary.find(item=>item.id===exercise.id);
 if(!media)return;
 const name=exercise.name.toLowerCase().trim();
 // Free-text renames can change the movement; never infer an image from an ID alone.
 if(name!==media.name.toLowerCase()&&name!==defaults.get(exercise.id))return;
 return media;
}
export function filterExercises(search:string,category:string){
 const terms=search.toLowerCase().trim().split(/\s+/).filter(Boolean);
 return exerciseLibrary.filter(e=>(category==='All'||e.category===category)&&terms.every(term=>(e.name+' '+e.category).toLowerCase().includes(term)));
}

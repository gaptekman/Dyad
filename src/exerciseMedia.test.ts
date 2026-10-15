import {describe,it,expect} from 'vitest';
import {exerciseLibrary,exerciseCategories,filterExercises,mediaForExercise} from './exerciseMedia';
import {routine} from './domain';
describe('illustrated library',()=>{
 it('has unique identities and a local illustration for every picker entry',()=>{expect(exerciseLibrary.length).toBe(44);expect(new Set(exerciseLibrary.map(e=>e.id)).size).toBe(exerciseLibrary.length);for(const e of exerciseLibrary){expect(e.image).toBe(`/exercises/${e.id}.webp`);expect(e.source).toMatch(/^https:\/\/www\.simplyfitness\.com\/pages\//);expect(e.alt.length).toBeGreaterThan(3);}});
 it('covers each displayed muscle category',()=>{for(const c of exerciseCategories.filter(c=>c!=='All'))expect(filterExercises('',c).length).toBeGreaterThan(0);});
 it('filters by muscle group and all case-insensitive search terms',()=>{expect(filterExercises('INCLINE dumbbell','Chest').map(e=>e.id)).toEqual(['incline-db']);expect(filterExercises('curl','Calves')).toEqual([]);expect(filterExercises('no such movement','All')).toEqual([]);});
 it('resolves original routine labels and library replacements',()=>{expect(mediaForExercise(routine[0].upper[0])?.id).toBe('incline-bench');expect(mediaForExercise({id:'leg-press',name:'Leg press'})?.id).toBe('leg-press');});
 it('does not mislabel renamed or unmatched movements with another illustration',()=>{expect(mediaForExercise({id:'squat',name:'Bench press'})).toBeUndefined();expect(mediaForExercise({id:'pendulum',name:'Pendulum squat'})).toBeUndefined();expect(mediaForExercise({id:'core',name:'Core'})).toBeUndefined();});
});

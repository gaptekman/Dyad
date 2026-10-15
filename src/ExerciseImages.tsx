import {useState} from 'react';
import type {Exercise} from './domain';
import {mediaForExercise,type LibraryExercise} from './exerciseMedia';

export function ExerciseThumbnail({exercise,number,onOpen}:{exercise:Exercise;number:string;onOpen:()=>void}){
 const media=mediaForExercise(exercise),[failed,setFailed]=useState(false);
 if(!media||failed)return <span className="exercise-number">{number}</span>;
 return <button type="button" className="exercise-thumbnail" aria-label={`View ${exercise.name} illustration`} onClick={onOpen}><img src={media.image} width="44" height="44" alt="" loading="lazy" onError={()=>setFailed(true)}/><span aria-hidden="true">↗</span></button>;
}
export function ExerciseIllustration({exercise,media}:{exercise:Exercise;media:LibraryExercise}){
 return <div className="illustration-dialog"><span className="eyebrow">MOVEMENT REFERENCE</span><h2>{exercise.name}</h2><p className="illustration-variant">Illustration: {media.name}</p><img src={media.image} width="600" height="600" alt={media.alt}/><p className="illustration-credit">Illustration © <a href={media.source} target="_blank" rel="noopener noreferrer">Simply Fitness ↗</a> · Used with permission.</p></div>;
}

import type { Lesson, Phrase } from "./lessons";
import { studyWeek, weekDate, weeklyLessonId, type StudyLevel, type WeeklyPack } from "./weekly-types.ts";
const string={type:"string"};
const object=(properties:Record<string,unknown>)=>({type:"object",properties,required:Object.keys(properties),additionalProperties:false});
const phrase=object({en:string,ko:string,tip:string,cue:string,cueKo:string,task:string,variation:object({from:string,to:string,task:string})});
export const weeklySchema=object({title:string,lessons:{type:"array",minItems:5,maxItems:5,items:object({title:string,label:string,scene:string,phrases:{type:"array",minItems:5,maxItems:5,items:phrase}})},words:{type:"array",minItems:10,maxItems:10,items:object({english:string,meaning:string,example:string,exampleKo:string})}});
function record(v:unknown):Record<string,unknown> {if(!v || typeof v!=="object" || Array.isArray(v))throw new Error("Invalid weekly content");return v as Record<string,unknown>;}
function text(v:unknown,max=700) {if(typeof v!=="string" || !v.trim() || v.length>max)throw new Error("Invalid weekly text");return v.trim();}
function list(v:unknown,length:number) {if(!Array.isArray(v) || v.length!==length)throw new Error("Incomplete weekly content");return v;}
export function validateWeeklyContent(value:unknown,weekStart:string,level:StudyLevel):WeeklyPack {
  const raw=record(value),seen=new Set<string>();
  const lessons:Lesson[]=list(raw.lessons,5).map((v,day)=>{
    const lesson=record(v);
    const phrases:Phrase[]=list(lesson.phrases,5).map(value=>{
      const p=record(value),variation=record(p.variation);
      const en=text(p.en),from=text(variation.from,100),to=text(variation.to,100);
      if(!/[a-z]/i.test(en) || !en.includes(from) || from===to || seen.has(en.toLowerCase()))throw new Error("Invalid weekly exercise");
      seen.add(en.toLowerCase());
      return {en,ko:text(p.ko),tip:text(p.tip),cue:text(p.cue),cueKo:text(p.cueKo),task:text(p.task),variation:{from,to,task:text(variation.task)}};
    });
    return {id:weeklyLessonId(weekStart,level,day+1),title:text(lesson.title,120),label:text(lesson.label,120),scene:text(lesson.scene),phrases};
  });
  const words=list(raw.words,10).map(v=>{const w=record(v);return {english:text(w.english,150),meaning:text(w.meaning),example:text(w.example),exampleKo:text(w.exampleKo),known:false,saved:false};});
  if(new Set(words.map(w=>w.english.toLowerCase())).size!==10)throw new Error("Duplicate weekly words");
  return {weekStart,nextUpdateAt:studyWeek(weekDate(weekStart)).nextUpdateAt,level,source:"ai",title:text(raw.title,120),lessons,words};
}

import type { Lesson } from "./lessons";
import type { Word } from "./vocabulary-data";
export type StudyLevel = "work" | "basics";
export type WeeklyPack = {weekStart:string;nextUpdateAt:string;level:StudyLevel;source:"ai"|"prepared";title:string;lessons:Lesson[];words:Word[]};
export type Curriculum = {work:WeeklyPack;basics:WeeklyPack;archiveLessons:Lesson[]};
const DAY=86400000, WEEK=7*DAY, OFFSET=9*3600000;
const EPOCH=Date.parse("2026-09-06T15:00:00Z");
export function studyWeek(now=new Date()) {
  const korea=new Date(now.getTime()+OFFSET);
  const monday=Date.UTC(korea.getUTCFullYear(),korea.getUTCMonth(),korea.getUTCDate())-((korea.getUTCDay()+6)%7)*DAY-OFFSET;
  return {weekStart:new Date(monday+OFFSET).toISOString().slice(0,10),nextUpdateAt:new Date(monday+WEEK).toISOString(),index:Math.round((monday-EPOCH)/WEEK)};
}
export function weekDate(weekStart:string) {return new Date(`${weekStart}T00:00:00+09:00`);}
export function weeklyLessonId(weekStart:string,level:StudyLevel,day:number) {
  const index=studyWeek(weekDate(weekStart)).index;
  if(index<0 || index>3800 || !Number.isInteger(day) || day<1 || day>5)throw new Error("Invalid weekly lesson");
  return 100000+index*100+(level==="work"?10:0)+day;
}
export function weeklyIdentity(id:number) {
  if(!Number.isInteger(id) || id<100000)return null;
  const index=Math.floor((id-100000)/100),part=id%100;
  if(index>3800 || ![1,2,3,4,5,11,12,13,14,15].includes(part))return null;
  return {weekStart:studyWeek(new Date(EPOCH+index*WEEK)).weekStart,level:part>10?"work" as const:"basics" as const};
}
export const lessonDay=(id:number)=>id>=100000?id%10:id>10?id-10:id;
export const lessonLevel=(id:number):StudyLevel=>weeklyIdentity(id)?.level || (id>10?"work":"basics");

export function scheduledDay(now=new Date()) {
  const weekday=new Date(now.getTime()+OFFSET).getUTCDay();
  return weekday===0?5:Math.min(weekday,5);
}
export function lessonDate(weekStart:string,day:number) {
  return new Date(weekDate(weekStart).getTime()+(day-1)*DAY);
}

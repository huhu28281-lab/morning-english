import { preparedPack } from "./weekly-prepared.ts";
import { studyWeek, weeklyIdentity, type StudyLevel, type WeeklyPack } from "./weekly-types.ts";
import type { Lesson } from "./lessons";

export async function readPack(db:D1Database,weekStart:string,level:StudyLevel) {
  const row=await db.prepare("SELECT payload FROM weekly_curriculum WHERE week_start=? AND level=?").bind(weekStart,level).first<{payload:string}>();
  return row ? JSON.parse(row.payload) as WeeklyPack : null;
}
export async function publishPack(db:D1Database,pack:WeeklyPack) {
  // Never overwrite published exercises: IDs and completed records remain stable.
  await db.prepare("INSERT INTO weekly_curriculum (week_start,level,payload,created_at) VALUES (?,?,?,?) ON CONFLICT(week_start,level) DO NOTHING").bind(pack.weekStart,pack.level,JSON.stringify(pack),new Date().toISOString()).run();
  const saved=await readPack(db,pack.weekStart,pack.level);
  if(!saved)throw new Error("Weekly publication failed");
  return saved;
}
export async function currentPack(db:D1Database,level:StudyLevel,now=new Date()) {
  const {weekStart}=studyWeek(now);
  return await readPack(db,weekStart,level) || await publishPack(db,preparedPack(weekStart,level));
}
export async function archivedLessons(db:D1Database,userId:string) {
  const ids=await db.prepare("SELECT DISTINCT lesson_id AS id FROM study_progress WHERE user_id=? AND lesson_id>=100000").bind(userId).all<{id:number}>();
  const keys=new Map<string,{weekStart:string;level:StudyLevel}>();
  for(const {id} of ids.results){const key=weeklyIdentity(id);if(key)keys.set(`${key.weekStart}:${key.level}`,key);}
  const savedIds=new Set(ids.results.map(r=>r.id)),lessons:Lesson[]=[];
  const weeks=[...keys.values()].map(k=>k.weekStart).sort();
  if(!weeks.length)return lessons;
  // One indexed range read, rather than a subrequest for every archived week.
  const rows=await db.prepare("SELECT payload FROM weekly_curriculum WHERE week_start>=? AND week_start<=? ORDER BY week_start DESC").bind(weeks[0],weeks[weeks.length-1]).all<{payload:string}>();
  for(const row of rows.results) {
    const pack=JSON.parse(row.payload) as WeeklyPack;
    lessons.push(...pack.lessons.filter(l=>savedIds.has(l.id)));
  }
  return lessons;
}
export async function publishedLesson(db:D1Database,id:number,now=new Date()) {
  if(id>=1 && id<=20)return true;
  const key=weeklyIdentity(id);
  if(!key || key.weekStart>studyWeek(now).weekStart)return false;
  return !!(await readPack(db,key.weekStart,key.level))?.lessons.some(l=>l.id===id);
}

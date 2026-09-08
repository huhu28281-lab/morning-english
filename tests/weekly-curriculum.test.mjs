import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { studyWeek, weeklyLessonId, weeklyIdentity, lessonDay, lessonLevel } from "../app/weekly-types.ts";
import { preparedPack } from "../app/weekly-prepared.ts";
import { validateWeeklyContent } from "../app/weekly-validation.ts";
import { currentPack, publishPack, readPack, archivedLessons, publishedLesson } from "../app/weekly-store.ts";
import { prepareNextWeek } from "../app/weekly-generation.ts";
import { mergeWeeklyWords } from "../app/vocabulary-data.ts";

function database(t) {
  const sqlite=new DatabaseSync(":memory:");
  sqlite.exec(readFileSync(new URL("../drizzle/0000_messy_squadron_supreme.sql",import.meta.url),"utf8"));
  sqlite.exec(readFileSync(new URL("../drizzle/0003_sudden_hiroim.sql",import.meta.url),"utf8"));
  t.after(()=>sqlite.close());
  return {prepare(sql){const statement=sqlite.prepare(sql);const bound=(args=[])=>({bind(...values){return bound(values);},async first(){return statement.get(...args)||null;},async all(){return {results:statement.all(...args)};},async run(){return statement.run(...args);}});return bound();}};
}
const monday=new Date("2026-09-07T00:00:00+09:00");
test("weekly rollover occurs at Monday midnight in Korea, including year boundaries",()=>{
  assert.equal(studyWeek(new Date("2026-09-13T23:59:59+09:00")).weekStart,"2026-09-07");
  assert.equal(studyWeek(new Date("2026-09-14T00:00:00+09:00")).weekStart,"2026-09-14");
  assert.equal(studyWeek(monday).nextUpdateAt,"2026-09-13T15:00:00.000Z");
  assert.equal(studyWeek(new Date("2027-01-01T09:00:00+09:00")).weekStart,"2026-12-28");
  assert.equal(studyWeek(new Date("2027-01-04T00:00:00+09:00")).weekStart,"2027-01-04");
});
test("both levels have stable noncolliding IDs and complete prepared exercises",()=>{
  const ids=new Set();
  for(let week=0;week<48;week++) {
    const start=studyWeek(new Date(monday.getTime()+week*7*86400000)).weekStart;
    for(const level of ["work","basics"]) {
      const pack=preparedPack(start,level);
      const checked=validateWeeklyContent(pack,start,level);
      assert.equal(checked.lessons.length,5);assert.equal(pack.words.length,10);
      for(const [day,lesson] of pack.lessons.entries()) {
        assert.equal(ids.has(lesson.id),false);ids.add(lesson.id);
        assert.equal(lessonDay(lesson.id),day+1);assert.equal(lessonLevel(lesson.id),level);
        assert.deepEqual(weeklyIdentity(lesson.id),{weekStart:start,level});
        assert.equal(lesson.phrases.length,5);
      }
    }
  }
  assert.equal(weeklyIdentity(100006),null);assert.equal(weeklyIdentity(Infinity),null);
  assert.equal(lessonDay(11),1);assert.equal(lessonLevel(2),"basics");
  assert.notDeepEqual(preparedPack("2026-09-07","work").words,preparedPack("2026-09-14","work").words);
});
test("new week publication keeps old exercises and isolates each visitor's history",async(t)=>{
  const db=database(t);
  const original=await currentPack(db,"work",monday),id=original.lessons[0].id;
  await db.prepare("INSERT INTO study_progress VALUES (?,?,?,?)").bind("visitor:alice",id,0,monday.toISOString()).run();
  const changed={...original,title:"This must not replace the published material"};
  assert.equal((await publishPack(db,changed)).title,original.title);
  const next=await currentPack(db,"work",new Date("2026-09-14T01:00:00+09:00"));
  assert.notEqual(next.lessons[0].id,id);
  assert.deepEqual(await archivedLessons(db,"visitor:alice"),[original.lessons[0]]);
  assert.deepEqual(await archivedLessons(db,"visitor:bob"),[]);
  assert.equal(await publishedLesson(db,id,new Date("2026-09-14")),true);
  assert.equal(await publishedLesson(db,next.lessons[0].id,monday),false);
  assert.equal(await publishedLesson(db,weeklyLessonId("2026-09-21","work",1),new Date("2026-09-22")),false);
});
test("saved vocabulary and known flags survive replacement of weekly suggestions",()=>{
  const first=preparedPack("2026-09-07","work"),next=preparedPack("2026-09-14","work");
  const saved={...first.words[0],saved:true,known:true};
  const merged=mergeWeeklyWords(next.words,[saved]);
  assert.deepEqual(merged.find(w=>w.english===saved.english),saved);
  assert.equal(merged.length,11);
  assert.equal(mergeWeeklyWords(first.words,[saved]).filter(w=>w.english===saved.english).length,1);
});
test("incomplete output and impossible variation exercises never publish",()=>{
  const pack=preparedPack("2026-09-14","work");
  assert.throws(()=>validateWeeklyContent({...pack,lessons:pack.lessons.slice(0,4)},pack.weekStart,"work"));
  const invalid=structuredClone(pack);invalid.lessons[0].phrases[0].variation.from="not in this sentence";
  assert.throws(()=>validateWeeklyContent(invalid,pack.weekStart,"work"));
  const duplicate=structuredClone(pack);duplicate.words[1]=duplicate.words[0];
  assert.throws(()=>validateWeeklyContent(duplicate,pack.weekStart,"work"));
});
test("cron is disabled without Free confirmation and reserves before each inference",async(t)=>{
  const db=database(t),events=[];
  t.mock.method(console,"log",()=>{});
  const env={CF_AI_FREE_PLAN_CONFIRMED:"true",AI:{async run(_model,input){
    events.push("inference");
    const prompt=input.messages[0].content;
    return {response:preparedPack("2026-09-14",prompt.includes("Level: A2")?"work":"basics")};
  }}};
  const reserve=async n=>{assert.ok(n>2000 && n<4000);events.push("reserve");};
  await prepareNextWeek(db,{...env,CF_AI_FREE_PLAN_CONFIRMED:"false"},reserve,monday);
  assert.deepEqual(events,[]);
  await prepareNextWeek(db,env,reserve,monday);
  assert.deepEqual(events,["reserve","inference","reserve","inference"]);
  assert.equal((await readPack(db,"2026-09-14","work")).source,"ai");
  await prepareNextWeek(db,env,reserve,new Date("2026-09-08"));
  assert.equal(events.length,4);
  assert.equal((await currentPack(db,"work",monday)).weekStart,"2026-09-07");
});
test("quota refusal prevents inference, and concurrent cron attempts cannot duplicate calls",async(t)=>{
  const db=database(t);t.mock.method(console,"error",()=>{});t.mock.method(console,"log",()=>{});
  let calls=0;
  const env={CF_AI_FREE_PLAN_CONFIRMED:"true",AI:{async run(_model,input){calls++;return {response:preparedPack("2026-09-14",input.messages[0].content.includes("Level: A2")?"work":"basics")};}}};
  await prepareNextWeek(db,env,async()=>{throw new Error("budget exhausted");},monday);
  assert.equal(calls,0);
  await prepareNextWeek(db,env,async()=>{},monday);assert.equal(calls,0);
  const tomorrow=new Date("2026-09-08T06:00:00+09:00");
  await Promise.all([prepareNextWeek(db,env,async()=>{},tomorrow),prepareNextWeek(db,env,async()=>{},tomorrow)]);
  assert.equal(calls,2);
});

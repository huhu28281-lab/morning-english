import { CF_MODEL } from "./cloudflare-policy.ts";
import { workersAiState, type WorkersAiEnv } from "./workers-ai.ts";
import { studyWeek, type StudyLevel, type WeeklyPack } from "./weekly-types.ts";
import { readPack, publishPack } from "./weekly-store.ts";
import { weeklySchema, validateWeeklyContent } from "./weekly-validation.ts";

const MAX_OUTPUT=10000;
export async function prepareNextWeek(db:D1Database,env:WorkersAiEnv,reserveBudget:(neurons:number)=>Promise<unknown>,now=new Date()) {
  if(workersAiState(env)!=="ready")return;
  const target=studyWeek(new Date(studyWeek(now).nextUpdateAt)).weekStart;
  const attemptDay=now.toISOString().slice(0,10);
  for(const level of ["work","basics"] as StudyLevel[]) {
    if(await readPack(db,target,level))continue;
    const lock=await db.prepare("INSERT INTO weekly_generation_attempts (week_start,level,attempt_day) VALUES (?,?,?) ON CONFLICT(week_start,level,attempt_day) DO NOTHING RETURNING week_start").bind(target,level,attemptDay).first();
    if(!lock)continue;
    try {
      const prior=await db.prepare("SELECT payload FROM weekly_curriculum WHERE level=? AND week_start<? ORDER BY week_start DESC LIMIT 4").bind(level,target).all<{payload:string}>();
      const recent=prior.results.map(r=>JSON.parse(r.payload) as WeeklyPack);
      const recentWords=recent.flatMap(p=>p.words.map(w=>w.english));
      const prompt=`Create a NEW weekly English curriculum for a Korean adult office worker with a one-hour commute. Week starts ${target}. Level: ${level==="work"?"A2 to early B1: practical, adult conversation. Model answers should give a reason or next action in 2 short sentences.":"A1 to A2: practical adult English, short useful sentences, not alphabet or basic greetings."} Five distinct weekday situations, exactly five exercises per day, exactly ten useful vocabulary items drawn from the exercises. Mix workplace and everyday situations; logistics is useful but not every lesson. Use natural English and Korean. Each phrase: en=model answer, ko=faithful Korean translation, cue=what the other speaker says, cueKo=its translation, task=Korean speaking instruction, tip=brief Korean explanation. variation.from must be an EXACT nonempty substring of en; variation.to must differ and produce a grammatical sentence; variation.task explains the change in Korean. Do not use invented personal facts, real company names, sensitive data or factual news. Vocabulary examples must match the meanings. Avoid reusing recent themes ${JSON.stringify(recent.map(p=>p.title))} and recent vocabulary ${JSON.stringify(recentWords)}. Return only the complete JSON object matching the schema. Keep Korean explanations concise.`;
      const input={messages:[{role:"system",content:prompt}],max_tokens:MAX_OUTPUT,temperature:0.65,stream:false,response_format:{type:"json_schema",json_schema:weeklySchema}};
      const bytes=new TextEncoder().encode(JSON.stringify(input)).byteLength;
      if(bytes>16000)throw new Error("Weekly prompt too large");
      await reserveBudget(Math.ceil((bytes+4096)*26668/1000000+MAX_OUTPUT*204805/1000000));
      let timer:ReturnType<typeof setTimeout>|undefined;
      let output:unknown;
      try {output=await Promise.race([env.AI!.run(CF_MODEL,input),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error("Weekly timeout")),180000);})]);}
      finally {if(timer)clearTimeout(timer);}
      const response=(output as {response?:unknown})?.response;
      if(typeof response==="string" && response.length>200000)throw new Error("Weekly output too large");
      const pack=validateWeeklyContent(typeof response==="string"?JSON.parse(response):response,target,level);
      const oldWords=new Set(recentWords.map(w=>w.toLowerCase()));
      if(pack.words.filter(w=>oldWords.has(w.english.toLowerCase())).length>3)throw new Error("Weekly vocabulary repeats");
      const oldPhrases=new Set(recent.flatMap(p=>p.lessons.flatMap(l=>l.phrases.map(p=>p.en.toLowerCase()))));
      if(pack.lessons.flatMap(l=>l.phrases).some(p=>oldPhrases.has(p.en.toLowerCase())))throw new Error("Weekly exercises repeat");
      await publishPack(db,pack);
      console.log(JSON.stringify({event:"weekly_curriculum_prepared",week:target,level}));
    }catch {console.error(JSON.stringify({event:"weekly_curriculum_prepare_failed",week:target,level}));}
  }
}

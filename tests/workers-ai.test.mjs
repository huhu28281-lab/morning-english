import test from "node:test";
import assert from "node:assert/strict";
import { runWorkersAi, workersAiState } from "../app/workers-ai.ts";
import { CF_MODEL } from "../app/cloudflare-policy.ts";

const reply = {reply:"How was your commute?",translation:"출근길은 어땠나요?",correction:"",feedback:""};
const input = {messages:[{role:"user",content:"I took the train to work."}],max_tokens:600};

test("a missing binding or unconfirmed free plan never calls inference", async()=>{
  let calls=0;
  const AI={run:async()=>{calls++;return {response:reply};}};
  assert.equal(workersAiState({CF_AI_FREE_PLAN_CONFIRMED:"true"}),"binding_missing");
  for(const value of [undefined,"","false","TRUE",true]) {
    const env={AI,CF_AI_FREE_PLAN_CONFIRMED:value};
    assert.equal(workersAiState(env),"free_plan_required");
    await assert.rejects(runWorkersAi(env,CF_MODEL,input),/not enabled/);
  }
  await assert.rejects(runWorkersAi({CF_AI_FREE_PLAN_CONFIRMED:"true"},CF_MODEL,input));
  assert.equal(calls,0);
});

test("native binding accepts a structured reply without a personal token or encryption key", async()=>{
  for(const response of [reply,JSON.stringify(reply)]) {
    const calls=[];
    const env={CF_AI_FREE_PLAN_CONFIRMED:"true",AI:{run:async(...args)=>{calls.push(args);return {response};}}};
    assert.equal(workersAiState(env),"ready");
    assert.deepEqual(await runWorkersAi(env,CF_MODEL,input),reply);
    assert.deepEqual(calls,[[CF_MODEL,input]]);
  }
});

test("malformed or incomplete model output fails without retries", async()=>{
  for(const response of [undefined,null,'{"reply":',"No",{reply:"Hi"},{...reply,reply:""},{...reply,translation:""},{...reply,feedback:"x".repeat(3001)}]) {
    let calls=0;
    const env={CF_AI_FREE_PLAN_CONFIRMED:"true",AI:{run:async()=>{calls++;return {response};}}};
    await assert.rejects(runWorkersAi(env,CF_MODEL,input));
    assert.equal(calls,1);
  }
});

test("provider errors propagate without retrying or selecting another model", async()=>{
  const failure=new Error("quota reached");
  let calls=0;
  const env={CF_AI_FREE_PLAN_CONFIRMED:"true",AI:{run:async()=>{calls++;throw failure;}}};
  await assert.rejects(runWorkersAi(env,CF_MODEL,input),error=>error===failure);
  assert.equal(calls,1);
});

test("slow inference times out once and does not start a second billable request", async(t)=>{
  t.mock.timers.enable({apis:["setTimeout"]});
  let calls=0;
  const env={CF_AI_FREE_PLAN_CONFIRMED:"true",AI:{run:()=>{calls++;return new Promise(()=>{});}}};
  const result=runWorkersAi(env,CF_MODEL,input);
  const check=assert.rejects(result,/timeout/);
  t.mock.timers.tick(30000);
  await check;
  assert.equal(calls,1);
});

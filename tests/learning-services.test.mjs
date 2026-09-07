import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { encryptSecret, decryptSecret } from "../app/secret-codec.ts";
import { parseAssessment } from "../app/assessment-result.ts";
import { parseTutorResponse } from "../app/ai-response.ts";
import { encodeWav, wavDuration } from "../app/audio-wav.ts";
import { parseCloudflareResponse } from "../app/ai-response.ts";
import { cfAccountId, parseCloudflareConfiguration, cloudflareDay, cloudflareReservedNeurons, fitCloudflareMessages, CF_MAX_REQUEST_BYTES } from "../app/cloudflare-policy.ts";

test("stored credentials are authenticated, randomized, and bound to owner and provider",async()=>{
  const master=randomBytes(32).toString("base64"),secret="test-provider-key-only";
  const encrypted=await encryptSecret(secret,master,"alice:openai");
  assert.equal(await decryptSecret(encrypted,master,"alice:openai"),secret);
  assert.notEqual(encrypted,await encryptSecret(secret,master,"alice:openai"));
  assert.ok(!encrypted.includes(secret));
  await assert.rejects(decryptSecret(encrypted,master,"bob:openai"));
  await assert.rejects(decryptSecret(encrypted,master,"alice:azure"));
  const parts=encrypted.split(".");const corrupted=Buffer.from(parts[2],"base64");corrupted[0]^=1;parts[2]=corrupted.toString("base64");
  await assert.rejects(decryptSecret(parts.join("."),master,"alice:openai"));
});

test("transcription confidence never becomes a pronunciation score",()=>{
  assert.throws(()=>parseAssessment({RecognitionStatus:"Success",NBest:[{Confidence:0.99,Display:"Perfect words."}]}),/발음 점수/);
  assert.throws(()=>parseAssessment({RecognitionStatus:"NoMatch",NBest:[{AccuracyScore:95}]}),/말소리/);
  assert.throws(()=>parseAssessment({RecognitionStatus:"Success",NBest:[{AccuracyScore:Infinity}]}));
});

test("Azure REST word scores and omissions are preserved; absent scores stay absent",()=>{
  const result=parseAssessment({RecognitionStatus:"Success",NBest:[{Display:"Confirm the date.",AccuracyScore:82.4,FluencyScore:76.1,CompletenessScore:75,PronScore:79,Words:[{Word:"confirm",AccuracyScore:72,ErrorType:"Mispronunciation"},{Word:"delivery",AccuracyScore:0,ErrorType:"Omission"},{Word:"date",AccuracyScore:100,ErrorType:"None"}]}]});
  assert.equal(result.accuracy,82.4);assert.equal(result.words[1].accuracy,0);assert.equal(result.words[1].error,"Omission");
  const partial=parseAssessment({RecognitionStatus:"Success",NBest:[{AccuracyScore:0,FluencyScore:-1,Words:[{Word:"word",Confidence:1}]}]});
  assert.equal(partial.accuracy,0);assert.equal(partial.fluency,null);assert.equal(partial.pronunciation,null);assert.equal(partial.words[0].accuracy,null);
});

test("audio conversion emits mono 16kHz PCM WAV with bounded duration and safe clipping",()=>{
  const samples=new Float32Array(32000);samples[0]=-2;samples[1]=2;samples[2]=NaN;
  const wav=encodeWav(samples),view=new DataView(wav);
  assert.equal(wavDuration(new Uint8Array(wav)),2);assert.equal(view.getUint16(22,true),1);assert.equal(view.getUint32(24,true),16000);
  assert.equal(view.getInt16(44,true),-32768);assert.equal(view.getInt16(46,true),32767);assert.equal(view.getInt16(48,true),0);
  view.setUint32(40,6,true);assert.throws(()=>wavDuration(new Uint8Array(wav)));
  assert.throws(()=>wavDuration(new Uint8Array(encodeWav(new Float32Array(10)))));
  assert.throws(()=>wavDuration(new Uint8Array(encodeWav(new Float32Array(23*16000)))));
});

test("AI reply parser accepts completed Responses output and rejects refusals and truncated content",()=>{
  const reply={reply:"What time does your train leave?",translation:"전철은 몇 시에 출발하나요?",correction:"",feedback:""};
  const output=[{type:"message",content:[{type:"output_text",text:JSON.stringify(reply)}]}];
  assert.deepEqual(parseTutorResponse({status:"completed",output}),reply);
  assert.throws(()=>parseTutorResponse({status:"incomplete",output}));
  assert.throws(()=>parseTutorResponse({status:"completed",output:[{type:"message",content:[{type:"refusal",refusal:"No"}]}]}));
  assert.throws(()=>parseTutorResponse({status:"completed",output:[{type:"message",content:[{type:"output_text",text:'{"reply":'}]}]}));
  assert.throws(()=>parseTutorResponse({status:"completed",output:[{type:"message",content:[{type:"output_text",text:'{"reply":"Hi"}'}]}]}));
});

test("Cloudflare accepts only a scoped account ID and explicit Free-plan confirmation",()=>{
  const account="a".repeat(32);
  assert.equal(cfAccountId(" "+account.toUpperCase()+" "),account);
  for(const value of ["../../other-account",account+"/ai",null,"a".repeat(31)])assert.equal(cfAccountId(value),null);
  assert.deepEqual(parseCloudflareConfiguration(JSON.stringify({accountId:account,freePlanConfirmed:true})),{accountId:account,freePlanConfirmed:true});
  for(const value of [{accountId:account},{accountId:account,freePlanConfirmed:false},{accountId:account,freePlanConfirmed:"true"},"invalid"])assert.equal(parseCloudflareConfiguration(value),null);
});

test("Cloudflare accounting resets at 09:00 Korea time and bounds UTF-8 request size",()=>{
  assert.equal(cloudflareDay(new Date("2026-09-07T08:59:00+09:00")).day,"2026-09-06");
  assert.equal(cloudflareDay(new Date("2026-09-07T09:00:00+09:00")).day,"2026-09-07");
  assert.equal(cloudflareDay(new Date("2026-09-07T08:59:00+09:00")).resetsAt,"2026-09-07T00:00:00.000Z");
  const messages=Array.from({length:19},(_,i)=>({role:i%2?"assistant":"user",content:"업무 대화 ".repeat(100)+i}));
  const build=selected=>({messages:[{role:"system",content:"Tutor instructions"},...selected],max_tokens:600});
  const prepared=fitCloudflareMessages(messages,build);
  assert.equal(messages.length,19);assert.equal(prepared.body.messages[1].role,"user");
  assert.equal(prepared.body.messages.at(-1).content,messages.at(-1).content);
  assert.ok(new TextEncoder().encode(JSON.stringify(prepared.body)).byteLength<=CF_MAX_REQUEST_BYTES);
  assert.ok(prepared.reservedNeurons>45);
  assert.throws(()=>cloudflareReservedNeurons({text:"가".repeat(6000)}));
  assert.throws(()=>fitCloudflareMessages([{role:"user",content:"x".repeat(10000)}],build));
});

test("Cloudflare structured responses accept JSON object or string and fail closed",()=>{
  const reply={reply:"When would you like to meet?",translation:"언제 만나고 싶으세요?",correction:"",feedback:""};
  assert.deepEqual(parseCloudflareResponse({success:true,result:{response:reply},errors:[]}),reply);
  assert.deepEqual(parseCloudflareResponse({success:true,result:{response:JSON.stringify(reply)}}),reply);
  assert.throws(()=>parseCloudflareResponse({success:false,result:{response:reply}}));
  assert.throws(()=>parseCloudflareResponse({success:true,result:{response:reply},errors:[{code:1}]}));
  assert.throws(()=>parseCloudflareResponse({success:true,result:{response:'{"reply":'}}));
  assert.throws(()=>parseCloudflareResponse({success:true,result:{response:{...reply,reply:""}}}));
});

"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, Square, Volume2, RotateCcw, AudioLines, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useSpeech } from "./use-speech";
import { useRecorder } from "./use-recorder";
import { recordingToWav } from "./audio-wav";
import type { Assessment } from "./assessment-result";
import type { useConnections } from "./use-connections";
export const firstSentence=(text:string)=>(text.match(/[^.!?]+[.!?]+|[^.!?]+$/)?.[0] || text).trim();
const errorLabels:Record<string,string>={None:"인식됨",Omission:"빠뜨린 단어",Insertion:"추가한 단어",Mispronunciation:"발음 재연습",Unknown:"평가 정보 없음"};
export default function Pronunciation({initialText,rate,connections}:{initialText:string;rate:number;connections:ReturnType<typeof useConnections>}) {
  const [target,setTarget]=useState(firstSentence(initialText)),[recordedTarget,setRecordedTarget]=useState("");
  const [busy,setBusy]=useState(false),[error,setError]=useState(""),[result,setResult]=useState<Assessment|null>(null);
  const recorder=useRecorder(),speech=useSpeech(rate),audio=useRef<HTMLAudioElement|null>(null),request=useRef<AbortController|null>(null);
  useEffect(()=>()=>request.current?.abort(),[]);
  const wordCount=target.trim()?target.trim().split(/\s+/).length:0;
  const valid=wordCount>0 && wordCount<=35 && target.length<=300 && /[a-z]/i.test(target);
  const locked=recorder.recording || recorder.starting || busy;
  const play=(text:string)=>{audio.current?.pause();speech.play([{text}]);};
  const start=()=>{speech.stop();audio.current?.pause();setResult(null);setError("");setRecordedTarget(target.trim());void recorder.start();};
  const assess=async()=>{
    if(!recorder.blob || busy)return;
    speech.stop();audio.current?.pause();setBusy(true);setError("");setResult(null);
    const controller=new AbortController();request.current=controller;
    try {
      let wav:ArrayBuffer;
      try {wav=await recordingToWav(recorder.blob);} catch(e) {throw new Error(e instanceof Error && /녹음/.test(e.message) ? e.message : "이 브라우저에서 녹음을 변환하지 못했어요. 최신 Chrome 또는 Safari에서 다시 녹음해 주세요.");}
      if(controller.signal.aborted)return;
      const r=await fetch(`/api/ai/pronunciation?reference=${encodeURIComponent(recordedTarget)}`,{method:"POST",headers:{"Content-Type":"audio/wav"},body:wav,signal:controller.signal}),d=await r.json();
      if(!r.ok || !d.assessment)throw new Error(d.error || "평가 결과를 받지 못했어요.");
      setResult(d.assessment);
    }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:"발음 평가에 연결하지 못했어요.");}
    finally{if(!controller.signal.aborted)setBusy(false);}
  };
  return <div className="feature-page">
    <div className="page-heading"><div><p className="eyebrow">HEAR YOURSELF, SPEAK WITH CONFIDENCE</p><h1>발음 연습</h1><p className="heading-sub">예시 발음과 내 목소리를 비교해보세요.</p></div></div>
    <div className="feature-split">
      <section className="feature-panel recording-panel"><div className="feature-panel-top"><span className="eyebrow">01 · LISTEN & RECORD</span><span className="small-tag">미국 영어 · 최대 20초</span></div><label className="input-label" htmlFor="pronunciation-target">연습할 영어 문장</label><Textarea id="pronunciation-target" lang="en" value={target} onChange={e=>{setTarget(e.target.value);recorder.clear();setResult(null);setError("");}} maxLength={300} disabled={locked} rows={3}/><div className="pronunciation-target-footer"><span className={wordCount>35?"form-error":"micro-note"}>{wordCount} / 35단어</span><button className="text-button" disabled={locked || !valid} onClick={()=>speech.speaking?speech.stop():play(target)}><Volume2 size={17}/>{speech.speaking?"재생 멈추기":"예시 발음 듣기"}</button></div>
        <div className={`recording-center ${recorder.recording?"is-recording":""}`}><span className="recording-icon"><Mic size={36}/></span><strong>{recorder.recording?"편안한 속도로 읽어주세요.":recorder.starting?"마이크 권한을 확인해 주세요.":recorder.url?"내 목소리를 다시 들어보세요.":"준비되면 녹음을 시작하세요."}</strong>{recorder.recording && <p>{recorder.seconds.toFixed(0)}초 / 20초</p>}<Progress value={recorder.seconds/20*100} aria-label="녹음 시간"/>
          <button className={`primary-button ${recorder.recording?"record-stop":""}`} disabled={!recorder.supported || recorder.starting || busy || !valid} onClick={recorder.recording?recorder.stop:start}>{recorder.starting?<Loader2 className="spin" size={19}/>:recorder.recording?<Square size={18}/>:recorder.url?<RotateCcw size={18}/>:<Mic size={18}/>} {recorder.recording?"녹음 끝내기":recorder.url?"다시 녹음":"녹음 시작"}</button>
        </div>
        {!recorder.supported && <p className="form-error">이 브라우저는 녹음을 지원하지 않아요. 마이크를 지원하는 최신 브라우저에서 열어주세요.</p>}
        {recorder.url && <div className="recording-playback"><label>내 녹음 다시 듣기</label><audio ref={audio} controls src={recorder.url} onPlay={()=>speech.stop()} aria-label="내 영어 녹음"/></div>}
        {recorder.error && <p className="form-error" role="alert">{recorder.error}</p>}
        {connections.status?.azure && <div className="assessment-action"><button className="primary-button" disabled={!recorder.blob || locked || !connections.status?.azure} onClick={()=>void assess()}>{busy?<Loader2 className="spin" size={18}/>:<AudioLines size={18}/>} {busy?"내 음성을 분석하는 중":"발음 평가받기"}</button><p className="micro-note">평가 시 녹음과 문장이 외부 음성 평가 서비스로 전송됩니다.</p></div>}
        {error && <div className="status-banner error" role="alert">{error}</div>}{speech.message && <p className="feature-status" role="status">{speech.message}</p>}
      </section>
      <section className="feature-panel assessment-panel" aria-live="polite"><span className="eyebrow">02 · NOTICE & TRY AGAIN</span><h2>{connections.status?.azure?"발음 피드백":"듣고 비교하기"}</h2>
        {result ? <><p className="assessment-provider">Azure Speech 음성 평가 · 100점 기준</p><div className="assessment-scores">{[["정확도",result.accuracy,"소리의 정확성"],["유창성",result.fluency,"끊김 없이 말하기"],["완성도",result.completeness,"문장의 단어를 읽은 비율"],["종합",result.pronunciation,"서비스 종합 점수"]].map(([label,value,desc])=><div key={String(label)}><span>{label}</span><strong>{value===null?"—":Math.round(value as number)}</strong><small>{desc}{value===null?" · 미제공":""}</small></div>)}</div><h3>단어별로 다시 들어보세요.</h3><p className="micro-note">표시된 단어를 중심으로 다시 연습해보세요.</p><div className="assessed-words">{result.words.map((word,i)=>{const needsReview=(word.accuracy!==null&&word.accuracy<80)||!["None","Unknown"].includes(word.error);return <button className={`assessed-word ${needsReview?"needs-review":""}`} key={`${word.word}-${i}`} onClick={()=>play(word.word)} aria-label={`${word.word} 예시 발음 듣기`}><span lang="en">{word.word}<Volume2 size={13}/></span><strong>{word.accuracy===null?"점수 없음":`${Math.round(word.accuracy)}점`}</strong><small>{errorLabels[word.error] || word.error}{needsReview&&word.error==="None"?" · 복습":""}</small></button>;})}</div>{!result.words.length && <p className="micro-note">이번 응답에는 단어별 점수가 제공되지 않았어요.</p>}{result.transcript && <div className="recognized-text"><span>서비스가 인식한 문장</span><p lang="en">{result.transcript}</p></div>}<p className="micro-note">점수는 녹음 환경에 따라 달라질 수 있습니다.</p></> : <div className="assessment-empty"><AudioLines size={40}/><h3>{busy?"단어 하나하나를 확인하고 있어요.":connections.status?.azure?"녹음 후 평가를 받아보세요.":"강세와 끝소리를 들어보세요."}</h3><p>{busy?"보통 잠시 후 결과가 나타나요.":connections.status?.azure?"문장과 단어별 결과를 확인할 수 있어요.":"예시와 내 녹음을 번갈아 들으며 차이를 찾아보세요."}</p><ul><li>강세가 있는 단어가 또렷하게 들리나요?</li><li>단어의 끝소리가 빠지지 않았나요?</li><li>의미가 이어지는 부분을 묶어 읽었나요?</li></ul></div>}
      </section>
    </div>
  </div>;
}

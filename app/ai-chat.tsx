"use client";
import { useEffect, useRef, useState } from "react";
import { Send, Mic, Volume2, Settings2, RotateCcw, MessageCircle, Loader2, ArrowRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSpeech } from "./use-speech";
import { ConnectionNotice, type useConnections } from "./ai-settings";
import { scenarios, type ChatMessage, type Scenario } from "./ai-types";
export type Conversation = {messages:ChatMessage[];scenario:Scenario};
export default function AiChat({conversation,onConversation,level,rate,quiet,connections,onConnect,onPractice}:{conversation:Conversation;onConversation:(v:Conversation)=>void;level:"work"|"basics";rate:number;quiet:boolean;connections:ReturnType<typeof useConnections>;onConnect:()=>void;onPractice:(text:string)=>void}) {
  const [draft,setDraft]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[translated,setTranslated]=useState(true),[reset,setReset]=useState(false);
  const [scenario,setScenario]=useState<Scenario>(conversation.scenario),[difficulty,setDifficulty]=useState(level);
  const speech=useSpeech(rate),end=useRef<HTMLDivElement|null>(null),request=useRef<AbortController|null>(null),sendLock=useRef(false);
  const {messages}=conversation;
  useEffect(()=>()=>request.current?.abort(),[]);
  useEffect(()=>{if(messages.length)end.current?.scrollIntoView({behavior:"smooth",block:"nearest"});},[messages.length,busy]);
  const play=(text:string)=>speech.play((text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[text]).map(t=>({text:t.trim()})));
  const send=async()=>{
    const text=draft.trim();if(!text || sendLock.current || !connections.status?.cloudflare)return;
    sendLock.current=true;setBusy(true);setError("");speech.stop();
    const controller=new AbortController();request.current=controller;
    const next:ChatMessage[]=[...messages,{role:"user",content:text}];
    try {
      const r=await fetch("/api/ai/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({scenario,level:difficulty,messages:next.slice(-9).map(m=>({role:m.role,content:m.content}))}),signal:controller.signal}),d=await r.json();
      if(!r.ok || !d.reply)throw new Error(d.error || "AI 답변을 받지 못했어요.");
      onConversation({scenario,messages:[...next,{role:"assistant",content:d.reply,translation:d.translation,correction:d.correction,feedback:d.feedback}]});setDraft("");
    }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:"대화에 연결하지 못했어요.");}
    finally{sendLock.current=false;if(!controller.signal.aborted){setBusy(false);void connections.reload();}}
  };
  const newConversation=()=>{speech.stop();onConversation({scenario,messages:[]});setDraft("");setError("");setReset(false);};
  return <div className="feature-page">
    <div className="page-heading"><div><p className="eyebrow">A CONVERSATION, ONE TURN AT A TIME</p><h1>이제, 대화를 이어가요.</h1><p className="heading-sub">내 이야기에 답하고 다시 물어보는 AI 영어 파트너.</p></div><button className="secondary-button" onClick={onConnect}><Settings2 size={17}/>AI 설정</button></div>
    <ConnectionNotice provider="cloudflare" connections={connections} onOpen={onConnect}/>
    {connections.status?.usage && <div className="cf-usage-bar" role="status"><div><strong>오늘 {connections.status.managedCloudflare?"앱 전체 ":""}{connections.status.usage.calls} / {connections.status.usage.maxCalls}회 요청</strong><span>앱 사용량 예산 {connections.status.usage.reservedNeurons.toLocaleString()} / {connections.status.usage.maxNeurons.toLocaleString()} · 한국 시간 오전 9시 초기화</span></div><p>{connections.status.managedCloudflare?"대화와 다음 주 교재 준비가 함께 사용하는 한도예요. ":""}횟수 또는 사용량 예산 중 먼저 도달한 한도에서 멈추며 실패한 요청도 포함합니다.</p></div>}
    <div className="chat-layout"><section className="feature-panel chat-panel"><div className="chat-toolbar"><div><span className="partner-avatar">m<span>.</span></span><div><strong>Morning</strong><small>{connections.status?.cloudflare?"Cloudflare · 영어 회화 파트너":connections.status?.managedCloudflare?"AI 대화 활성화가 필요해요":"연결 후 대화를 시작할 수 있어요"}</small></div></div><label htmlFor="chat-translation">해석 보기<Switch id="chat-translation" checked={translated} onCheckedChange={setTranslated}/></label></div>
      <div className="chat-messages" aria-live="polite" aria-relevant="additions">
        {!messages.length && <div className="chat-welcome"><MessageCircle size={37}/><h2>오늘은 무슨 이야기를 할까요?</h2><p>상황을 고르고 영어로 한두 문장 말해보세요.<br/>막힐 때는 한국어를 섞어도 괜찮아요.</p><button className="starter-message" onClick={()=>setDraft(scenarios[scenario].starter)}><span>이 문장으로 시작해 보기</span><p lang="en">{scenarios[scenario].starter}</p><ArrowRight size={18}/></button></div>}
        {messages.map((m,i)=><article className={`chat-message ${m.role}`} key={i}><span className="message-speaker">{m.role==="user"?"나":"Morning · AI"}</span><p lang="en">{m.content}</p>{m.role==="assistant" && <>{translated && <p className="message-translation">{m.translation}</p>}<div className="message-actions"><button className="text-button" onClick={()=>play(m.content)}><Volume2 size={15}/>답변 듣기</button><button className="text-button" onClick={()=>{speech.stop();onPractice(m.content);}}>발음 연습<ArrowRight size={14}/></button></div>{(m.correction || m.feedback) && <div className="chat-correction"><span>내가 한 말을 더 자연스럽게</span>{m.correction && <p lang="en">{m.correction}</p>}{m.feedback && <p>{m.feedback}</p>}</div>}</>}</article>)}
        {busy && <div className="chat-thinking" role="status"><Loader2 className="spin" size={18}/>Morning이 답변을 준비하고 있어요.</div>}<div ref={end}/>
      </div>
      <form className="chat-composer" onSubmit={e=>{e.preventDefault();void send();}}><label htmlFor="chat-draft">나의 영어 한마디</label><Textarea id="chat-draft" value={draft} onChange={e=>setDraft(e.target.value)} disabled={busy} maxLength={1000} rows={3} lang="en" placeholder="답변에 이유를 붙여보세요. 한글로 질문해도 좋아요."/><div className="composer-actions"><button type="button" className={`secondary-button ${speech.listening?"active-mic":""}`} disabled={busy || !speech.micSupported} onClick={()=>speech.recognize(text=>setDraft(previous=>(previous.trim()?previous.trim()+" ":"")+text))}><Mic size={18}/>{speech.listening?"말하기 끝내기":"말해서 입력"}</button><span>{draft.length} / 1,000</span><button className="primary-button" type="submit" disabled={busy || speech.listening || !draft.trim() || draft.length>1000 || !connections.status?.cloudflare}>{busy?<Loader2 className="spin" size={18}/>:<Send size={18}/>}보내기</button></div><p className="micro-note">{quiet?"출근길엔 조용히 입력해도 좋아요. ":""}마이크로 입력한 문장을 확인하고 보내기를 눌러주세요. 음성 인식 시 브라우저 제공자에게 음성이 전송될 수 있어요.</p>{!speech.micSupported && <p className="micro-note">이 브라우저에서는 직접 입력으로 대화해 주세요.</p>}{error && <div className="status-banner error" role="alert">{error} 입력한 문장은 남겨두었어요.</div>}{speech.message && <p className="feature-status" role="status">{speech.message}</p>}{speech.speaking && <button type="button" className="text-button" onClick={speech.stop}>답변 음성 멈추기</button>}</form>
    </section><aside className="chat-sidebar"><section className="feature-panel"><span className="eyebrow">MAKE IT YOUR CONVERSATION</span><h2>나에게 맞는 대화</h2><div className="feature-form"><label>대화 상황<Select value={scenario} onValueChange={v=>{setScenario(v as Scenario);if(!messages.length)onConversation({scenario:v as Scenario,messages:[]});}} disabled={busy || !!messages.length}><SelectTrigger aria-label="AI 대화 상황"><SelectValue/></SelectTrigger><SelectContent>{Object.entries(scenarios).map(([key,s])=><SelectItem value={key} key={key}>{s.label}</SelectItem>)}</SelectContent></Select></label><label>대화 난도<Select value={difficulty} onValueChange={v=>setDifficulty(v as "work"|"basics")} disabled={busy}><SelectTrigger aria-label="AI 대화 난도"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="work">실전 초급 · 이유까지 설명</SelectItem><SelectItem value="basics">기초 다지기 · 짧게 답하기</SelectItem></SelectContent></Select></label></div><div className="conversation-tips"><strong>한 단계 더 말해보기</strong><p>답변 → 이유 → 상대에게 질문</p><p lang="en">I usually take the train because it's more convenient. How do you get to work?</p></div><button className="secondary-button" disabled={busy || !messages.length} onClick={()=>setReset(true)}><RotateCcw size={16}/>새 대화 시작</button>{reset && <div className="remove-connection"><p>현재 대화를 지우고 다시 시작할까요?</p><button className="primary-button" onClick={newConversation}>새로 시작</button><button className="text-button" onClick={()=>setReset(false)}>취소</button></div>}<p className="micro-note">대화는 탭을 바꿔도 유지되지만 앱을 새로고침하거나 닫으면 사라져요. 사용량을 아끼기 위해 답변에는 최근 최대 4번의 대화를 참고하며, 긴 기록은 더 짧게 줄여요.</p></section><p className="chat-privacy">보내기를 누르면 대화 내용이 Cloudflare에 전송돼요. 회사의 기밀이나 개인정보는 제외하고 연습해 주세요. AI 교정은 학습 참고용이에요.</p></aside></div>
  </div>;
}

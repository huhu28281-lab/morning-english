"use client";
import { useMemo, useState } from "react";
import { Bookmark, Check, Volume2, Plus, Search, RotateCcw, ArrowRight, X, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSpeech } from "./use-speech";
import { wordKey, type Word } from "./vocabulary-data";
import type { useVocabulary } from "./use-vocabulary";
const emptyWord:Word={english:"",meaning:"",example:"",exampleKo:"",known:false,saved:true};
export default function Wordbook({book,rate,onPractice}:{book:ReturnType<typeof useVocabulary>;rate:number;onPractice:(text:string)=>void}) {
  const [filter,setFilter]=useState("all"),[query,setQuery]=useState(""),[open,setOpen]=useState(false),[draft,setDraft]=useState<Word>(emptyWord);
  const [queue,setQueue]=useState<Word[]|null>(null),[index,setIndex]=useState(0),[revealed,setRevealed]=useState(false);
  const speech=useSpeech(rate);
  const shown=useMemo(()=>book.words.filter(w=>(filter==="all" || filter==="saved"&&w.saved || filter==="learning"&&!w.known || filter==="known"&&w.known) && `${w.english} ${w.meaning}`.toLowerCase().includes(query.toLowerCase().trim())),[book.words,filter,query]);
  const current=queue?.[index];
  const speak=(text:string)=>speech.play((text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[text]).map(text=>({text:text.trim()})));
  const review=()=>{speech.stop();setQueue(shown.filter(w=>!w.known).length?shown.filter(w=>!w.known):shown);setIndex(0);setRevealed(false);};
  const grade=async(known:boolean)=>{
    if(!current)return;
    const latest=book.words.find(w=>wordKey(w.english)===wordKey(current.english)) || current;
    if(await book.save({...latest,known})){speech.stop();setIndex(i=>i+1);setRevealed(false);}
  };
  return <div className="feature-page">
    <div className="page-heading"><div><p className="eyebrow">WORDS THAT WORK FOR YOU</p><h1>단어장</h1><p className="heading-sub">직장인 표현 30개부터, 수업에서 담은 문장까지.</p></div><button className="primary-button" onClick={()=>{setDraft(emptyWord);setOpen(true);}}><Plus size={18}/>직접 추가</button></div>
    <div className="feature-stat-row"><span><strong>{book.words.length}</strong> 전체 표현</span><span><strong>{book.words.filter(w=>w.saved).length}</strong> 내가 담은 표현</span><span><strong>{book.words.filter(w=>w.known).length}</strong> 외운 표현</span></div>
    {book.error && <div className="status-banner error" role="alert">{book.error}<button onClick={()=>void book.reload()} disabled={book.loading}>다시 불러오기</button></div>}
    {book.loading && <p className="feature-status" role="status"><Loader2 className="spin" size={17}/>내 복습 기록을 불러오는 중이에요.</p>}
    {queue ? <section className="review-panel">
      <div className="feature-panel-top"><span className="eyebrow">RECALL & REMEMBER</span><button className="text-button" onClick={()=>{speech.stop();setQueue(null);}}><X size={17}/>목록으로</button></div>
      {current ? <><p className="review-count">{index+1} / {queue.length}</p><h2 lang="en">{current.english}</h2><button className="secondary-button" onClick={()=>speak(current.english)}><Volume2 size={18}/>발음 듣기</button>
        {!revealed ? <div className="review-reveal"><p>뜻과 사용할 상황을 떠올려보세요.</p><button className="primary-button" onClick={()=>setRevealed(true)}>뜻 확인하기<ArrowRight size={18}/></button></div> : <div className="review-answer"><h3>{current.meaning}</h3>{current.example && <><p lang="en">{current.example}</p><p>{current.exampleKo}</p></>}<div className="feature-actions"><button className="secondary-button" disabled={book.busy || !book.ready} onClick={()=>void grade(false)}><RotateCcw size={17}/>한 번 더 복습</button><button className="primary-button" disabled={book.busy || !book.ready} onClick={()=>void grade(true)}><Check size={18}/>기억했어요</button></div></div>}
      </> : <div className="review-finished"><Check size={36}/><h2>오늘의 표현을 꺼내봤어요.</h2><p>{queue.length}개 복습 완료. 기억한 표현은 기록에 남겼어요.</p><button className="primary-button" onClick={()=>setQueue(null)}>단어장으로 돌아가기</button></div>}
    </section> : <>
      <div className="wordbook-toolbar"><div className="search-field"><Search size={18}/><Input aria-label="영어 또는 한국어로 단어 검색" placeholder="영어 표현 또는 뜻 검색" value={query} onChange={e=>setQuery(e.target.value)}/></div><Select value={filter} onValueChange={setFilter}><SelectTrigger aria-label="단어장 필터" className="word-filter"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">전체 표현</SelectItem><SelectItem value="saved">내가 담은 표현</SelectItem><SelectItem value="learning">아직 연습 중</SelectItem><SelectItem value="known">외운 표현</SelectItem></SelectContent></Select><button className="secondary-button" disabled={!shown.length} onClick={review}><RotateCcw size={17}/>카드로 복습</button></div>
      {!shown.length ? <div className="empty-state"><Bookmark size={34}/><h2>{query?"찾는 표현이 없어요.":"아직 담긴 표현이 없어요."}</h2><p>{query?"검색어를 바꾸거나 직접 추가해 보세요.":"표현 옆의 ‘담기’를 누르거나 수업에서 문장을 저장해 보세요."}</p><button className="secondary-button" onClick={()=>{setFilter("all");setQuery("");}}>전체 표현 보기</button></div> : <div className="word-grid">{shown.map(word=><article className={`word-card ${word.known?"is-known":""}`} key={wordKey(word.english)}><div className="word-card-top"><span className="word-state">{word.known?<><Check size={14}/>외웠어요</>:"연습 중"}</span><button className={`text-button ${word.saved?"is-saved":""}`} disabled={book.busy || !book.ready} aria-pressed={word.saved} aria-label={`${word.english} ${word.saved?"담기 취소":"단어장에 담기"}`} onClick={()=>void book.save({...word,saved:!word.saved})}><Bookmark size={17} fill={word.saved?"currentColor":"none"}/>{word.saved?"담았어요":"담기"}</button></div><h2 lang="en">{word.english}</h2><p className="word-meaning">{word.meaning}</p>{word.example && <div className="word-example"><p lang="en">{word.example}</p><p>{word.exampleKo}</p></div>}<div className="word-actions"><button className="text-button" onClick={()=>speak(word.example || word.english)}><Volume2 size={17}/>{word.example?"예문 듣기":"발음 듣기"}</button><button className="text-button" onClick={()=>{speech.stop();onPractice(word.example || word.english);}}>발음 연습<ArrowRight size={15}/></button><button className="known-toggle" disabled={book.busy || !book.ready} onClick={()=>void book.save({...word,known:!word.known})} aria-pressed={word.known}>{word.known?"다시 복습":"외웠어요"}</button></div></article>)}</div>}
    </>}
    {speech.speaking && <button className="stop-audio" onClick={speech.stop}>음성 멈추기</button>}{speech.message && <p className="feature-status" role="status">{speech.message}</p>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="feature-dialog"><DialogHeader><DialogTitle>나만의 표현 추가</DialogTitle><DialogDescription>내 업무와 일상에서 쓰고 싶은 영어를 담아보세요.</DialogDescription></DialogHeader><form className="feature-form" onSubmit={async e=>{e.preventDefault();const existing=book.words.find(w=>wordKey(w.english)===wordKey(draft.english));if(await book.save({...draft,known:existing?.known||false,saved:true}))setOpen(false);}}><label htmlFor="word-english">영어 단어 또는 표현<Input id="word-english" value={draft.english} required maxLength={700} onChange={e=>setDraft({...draft,english:e.target.value})} placeholder="follow up on"/></label><label htmlFor="word-meaning">한국어 뜻<Input id="word-meaning" value={draft.meaning} required maxLength={700} onChange={e=>setDraft({...draft,meaning:e.target.value})} placeholder="진행 상황을 다시 확인하다"/></label><label htmlFor="word-example">예문 <span className="muted">선택</span><Textarea id="word-example" value={draft.example} maxLength={700} onChange={e=>setDraft({...draft,example:e.target.value})} rows={2}/></label><label htmlFor="word-example-ko">예문 뜻 <span className="muted">선택</span><Input id="word-example-ko" value={draft.exampleKo} maxLength={700} onChange={e=>setDraft({...draft,exampleKo:e.target.value})}/></label>{book.error && <p className="form-error" role="alert">{book.error}</p>}<button className="primary-button" type="submit" disabled={book.busy || !book.ready}>{book.busy?<Loader2 className="spin" size={17}/>:<Bookmark size={17}/>}단어장에 저장</button></form></DialogContent></Dialog>
  </div>;
}

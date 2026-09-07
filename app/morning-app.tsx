"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Sunrise, Headphones, BookOpen, Mic, MessageCircle, Brain, Check, ArrowRight, ArrowLeft, Play, Square, Volume2, RotateCcw, Clock3, CalendarDays, ChevronRight, Lightbulb, CheckCircle2, Keyboard, TrainFront, Loader2, Bookmark, Settings2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { lessons as beginnerLessons, stages as beginnerStages } from "./lessons";
import { workLessons, workStages } from "./work-lessons";
import { Textarea } from "@/components/ui/textarea";
import { normalizeSentence, useSpeech } from "./use-speech";
import InstallApp from "./install-app";
import Wordbook from "./wordbook";
import { useVocabulary } from "./use-vocabulary";
import { wordKey } from "./vocabulary-data";
import Pronunciation from "./pronunciation";
import AiChat, { type Conversation } from "./ai-chat";
import AiSettings, { useConnections } from "./ai-settings";

type RecordRow = { lessonId: number; stageId: number; completedAt: string };
const stageIcons = [Headphones, BookOpen, Mic, MessageCircle, Brain, CheckCircle2];
const number = (n: number) => String(n).padStart(2, "0");
const dayNumber = (id: number) => id > 10 ? id - 10 : id;
type Level = "work" | "basics";
const allLessons = [...workLessons, ...beginnerLessons];
const speechLines = (text: string, index?: number) => (text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text]).map(line => ({text:line.trim(),index}));

export default function MorningApp() {
  const [tab, setTab] = useState("today");
  const [wideLayout, setWideLayout] = useState(false);
  const book = useVocabulary();
  const connections = useConnections();
  const [aiSettingsOpen,setAiSettingsOpen] = useState(false);
  const [pronunciationText,setPronunciationText] = useState("Could you confirm the delivery date before we place the order?");
  const [conversation,setConversation] = useState<Conversation>({scenario:"commute",messages:[]});
  const [wordNotice,setWordNotice] = useState("");
  const [level, setLevel] = useState<Level>("work");
  const levelRef = useRef<Level>("work");
  const lessons = level === "work" ? workLessons : beginnerLessons;
  const stages = level === "work" ? workStages : beginnerStages;
  const [day, setDay] = useState(11);
  const [stage, setStage] = useState(0);
  const [card, setCard] = useState(0);
  const [quiet, setQuiet] = useState(true);
  const [translation, setTranslation] = useState(true);
  const [rate, setRate] = useState("0.85");
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [date, setDate] = useState("");
  const [entry, setEntry] = useState("");
  const [feedback, setFeedback] = useState<{correct:boolean; text:string} | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [questionShown, setQuestionShown] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);
  const [answered, setAnswered] = useState<number[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [timerOn, setTimerOn] = useState(false);
  const speech = useSpeech(Number(rate));
  const interaction = useRef(false);
  const lesson = allLessons.find(l => l.id === day) || lessons[0];
  const phrase = lesson.phrases[card];
  const targetAnswer = level === "work" && stage === 4 && phrase.variation ? phrase.en.replace(phrase.variation.from, phrase.variation.to) : phrase.en;
  const isOpenPractice = level === "work" && stage >= 3;
  const canSelfReview = isOpenPractice && revealed && feedback !== null && normalizeSentence(entry).split(" ").filter(Boolean).length >= 3;
  const done = records.filter(r => r.lessonId === day).map(r => r.stageId);
  const completedDays = lessons.filter(l => records.filter(r => r.lessonId === l.id).length === 6).length;
  const allCompletedDays = allLessons.filter(l => records.filter(r => r.lessonId === l.id).length === 6).length;
  const isStageDone = done.includes(stage);
  const currentIcon = stageIcons[stage];
  const StageIcon = currentIcon;

  const load = useCallback(async (resume = false) => {
    setLoading(true); setLoadError("");
    try {
      const response = await fetch("/api/progress", {cache:"no-store"});
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.progress)) throw new Error(data.error || "학습 기록을 불러오지 못했어요.");
      const rows = data.progress as RecordRow[]; setRecords(rows);
      if (resume && !interaction.current) {
        const course = levelRef.current === "work" ? workLessons : beginnerLessons;
        const next = course.find(l => rows.filter(r => r.lessonId === l.id).length < 6) || course[0];
        const nextStage = beginnerStages.findIndex((_, index) => !rows.some(r => r.lessonId === next.id && r.stageId === index));
        setDay(next.id); setStage(nextStage < 0 ? 0 : nextStage);
      }
    } catch (error) { setLoadError(error instanceof Error ? error.message : "학습 기록을 불러오지 못했어요. 다시 시도해 주세요."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1100px)");
    const update = () => setWideLayout(media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    setDate(new Intl.DateTimeFormat("ko-KR", {month:"long", day:"numeric", weekday:"long"}).format(new Date()));
    try {
      const prefs = JSON.parse(localStorage.getItem("morning-ui") || "{}");
      if (prefs.level === "basics" || prefs.level === "work") { levelRef.current = prefs.level; setLevel(prefs.level); setDay(prefs.level === "work" ? 11 : 1); }
      if (typeof prefs.quiet === "boolean") setQuiet(prefs.quiet);
      if (typeof prefs.translation === "boolean") setTranslation(prefs.translation);
      if (["0.7","0.85","1"].includes(prefs.rate)) setRate(prefs.rate);
    } catch { /* Optional device preferences do not block learning. */ }
    void load(true);
  }, [load]);

  const preference = (key: string, value: string | boolean) => {
    if (key === "quiet") { speech.stop(); setQuiet(Boolean(value)); }
    if (key === "translation") setTranslation(Boolean(value));
    if (key === "rate") { speech.stop(); setRate(String(value)); }
    try { const prefs = JSON.parse(localStorage.getItem("morning-ui") || "{}"); localStorage.setItem("morning-ui", JSON.stringify({...prefs,[key]:value})); } catch { /* Device preferences are optional. */ }
  };

  useEffect(() => {
    if (!timerOn) return;
    let last = Date.now();
    const timer = setInterval(() => {
      const now = Date.now(); const delta = Math.min(2, (now-last)/1000); last=now;
      if (!document.hidden) setSeconds(s => Math.min(600, s + delta));
    }, 1000);
    return () => clearInterval(timer);
  }, [timerOn]);
  useEffect(() => { if (seconds >= 600) setTimerOn(false); }, [seconds]);
  useEffect(() => { if (speech.activeIndex >= 0 && stage === 0) { setCard(speech.activeIndex); } }, [speech.activeIndex, stage]);

  const resetExercise = () => { setEntry(""); setFeedback(null); setChosen(null); setRevealed(false); setQuestionShown(false); speech.setMessage(""); };
  const changeCard = (index: number) => { interaction.current = true; speech.stop(); setCard(index); setWordNotice(""); resetExercise(); };
  const changeStage = (index: number) => {
    if (saving) return;
    interaction.current = true; speech.stop(); setStage(index); setCard(0); setAnswered([]); setSeconds(0); setTimerOn(false); setNotice(""); resetExercise();
  };
  const chooseDay = (id: number) => {
    if (saving) return;
    interaction.current = true; speech.stop(); setDay(id);
    const nextLevel: Level = id > 10 ? "work" : "basics"; setLevel(nextLevel); levelRef.current = nextLevel; preference("level", nextLevel);
    const next = stages.findIndex((_, i) => !records.some(r => r.lessonId === id && r.stageId === i));
    changeStage(next < 0 ? 0 : next); setTab("today"); window.scrollTo({top:0,behavior:"smooth"});
  };
  const changeLevel = (value: string) => {
    if (saving || (value !== "work" && value !== "basics")) return;
    const course = value === "work" ? workLessons : beginnerLessons;
    const next = course.find(l => records.filter(r => r.lessonId === l.id).length < 6) || course[0];
    chooseDay(next.id);
  };
  const changeTab = (value: string) => { interaction.current = true; speech.stop(); setTimerOn(false); setTab(value); };
  const practicePronunciation = (text: string) => { setPronunciationText(text); changeTab("pronunciation"); window.scrollTo({top:0,behavior:"smooth"}); };
  const addLessonPhrase = async () => {
    setWordNotice("");
    const existing=book.words.find(w=>wordKey(w.english)===wordKey(phrase.en));
    if(await book.save({...existing,english:phrase.en,meaning:phrase.ko,example:"",exampleKo:"",known:existing?.known||false,saved:true})) setWordNotice("단어장에 담았어요. ‘내가 담은 표현’에서 복습하세요.");
  };
  const markAnswered = () => setAnswered(previous => previous.includes(card) ? previous : [...previous,card]);
  const playPhrase = () => { interaction.current = true; speech.play(speechLines(targetAnswer, card)); };
  const playDialogue = (repeat = false) => {
    interaction.current = true;
    if (speech.speaking) { speech.stop(); return; }
    const lines = repeat ? lesson.phrases.flatMap((p,i) => [...speechLines(p.cue,i),...speechLines(p.en,i)]) : [...speechLines(phrase.cue,card),...speechLines(phrase.en,card)];
    speech.play(lines, {repeatMinutes:repeat ? 10 : undefined,gap:1200});
    if (repeat) setTimerOn(true);
  };
  const checkEntry = (text = entry) => {
    if (!text.trim()) { setFeedback({correct:false,text:"먼저 영어 답변을 입력하거나 말해보세요."}); return; }
    if (isOpenPractice && normalizeSentence(text).split(" ").filter(Boolean).length < 3) { setFeedback({correct:false,text:"먼저 짧은 문장으로 답해보세요. 이유나 다음 행동까지 붙여보면 좋아요."}); return; }
    const correct = normalizeSentence(text) === normalizeSentence(targetAnswer);
    if (isOpenPractice) {
      setRevealed(true);
      setFeedback({correct,text:correct ? "예시와 같은 답변이에요. 이번에는 시간이나 이유를 자신의 상황에 맞춰 말해보세요." : "다른 자연스러운 답도 가능해요. 예시와 비교해 필요한 내용을 전달했는지 직접 확인해보세요."});
    } else {
      setFeedback({correct,text:correct ? "연습 문장과 같은 표현이에요. 이제 다음 문장도 해볼까요?" : "예시 문장과 비교해보세요. 다른 자연스러운 답도 가능해요. 문장을 다시 듣고 연습해보세요."});
    }
    if (correct) markAnswered();
  };
  const receiveSpeech = (text: string) => {
    if (level === "work") { setEntry(previous => previous.trim() ? previous.trim() + " " + text : text); setFeedback(null); }
    else { setEntry(text); checkEntry(text); }
  };
  const chooseAnswer = (answer: string) => {
    setChosen(answer);
    const correct = answer === phrase.en;
    setFeedback({correct,text:correct ? "맞아요! 이 상황에서는 이렇게 말할 수 있어요." : "제시된 우리말 뜻과 조금 달라요. 다른 문장을 골라보세요."});
    if (correct) markAnswered();
  };
  const saveStage = async () => {
    if (saving) return;
    speech.stop(); setTimerOn(false); setSaving(true); setSaveError(""); setNotice("");
    try {
      const response = await fetch("/api/progress", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lessonId:day,stageId:stage})});
      const data = await response.json();
      if (!response.ok || !data.progress) throw new Error(data.error || "기록을 저장하지 못했어요. 다시 시도해 주세요.");
      setRecords(prev => [...prev.filter(r => !(r.lessonId === day && r.stageId === stage)),data.progress]);
      setNotice(done.length + (isStageDone ? 0 : 1) === 6 ? "오늘 수업의 6단계를 모두 마쳤어요. 수고하셨어요!" : "학습 완료를 저장했어요. 준비되면 다음 단계로 넘어가세요.");
      setLoadError("");
    } catch (error) { setSaveError(error instanceof Error ? error.message : "기록을 저장하지 못했어요. 다시 시도해 주세요."); }
    finally { setSaving(false); }
  };
  const isChoice = level === "basics" && (stage === 5 || (stage === 3 && quiet));
  const choices = [phrase.en, lesson.phrases[(card+1)%5].en, lesson.phrases[(card+3)%5].en];
  const rotate = (day + card) % 3;
  const orderedChoices = [...choices.slice(rotate),...choices.slice(0,rotate)];
  const activeDateCount = new Set(records.map(r => new Intl.DateTimeFormat("en-CA", {timeZone:"Asia/Seoul"}).format(new Date(r.completedAt)))).size;
  const exerciseReady = stage >= 3 ? answered.length === 5 : true;

  return <div className="app-shell">
    <a className="skip-link" href="#study-main">학습으로 바로 가기</a>
    <header className="topbar">
      <button className="brand" onClick={() => changeTab("today")} aria-label="모닝 잉글리시 오늘의 학습"><span className="brand-icon"><Sunrise aria-hidden="true" size={27}/></span><span>morning<span className="brand-dot">.</span><small>모닝 잉글리시</small></span></button>
      <div className="top-meta"><span className="top-date">{date}</span><button className="icon-button settings-trigger" aria-label="AI 연결 설정" onClick={()=>setAiSettingsOpen(true)}><Settings2 size={20}/></button><InstallApp/></div>
    </header>
    <Tabs value={tab} onValueChange={changeTab} orientation={wideLayout ? "vertical" : "horizontal"} className={`workspace-tabs tab-${tab}`}>
      <div className="nav-bar"><TabsList className="main-tabs" variant="line" aria-label="학습 메뉴"><TabsTrigger value="today"><Sunrise/>오늘 회화</TabsTrigger><TabsTrigger value="course"><BookOpen/>10일 코스</TabsTrigger><TabsTrigger value="words"><Bookmark/>단어장</TabsTrigger><TabsTrigger value="pronunciation"><Mic/>발음 확인</TabsTrigger><TabsTrigger value="chat"><MessageCircle/>AI 대화</TabsTrigger><TabsTrigger value="history"><CalendarDays/>학습 기록</TabsTrigger></TabsList><span className="commute-label"><TrainFront size={16}/> 출근길 60분</span></div>

      <div className="level-bar"><div><span className="level-label">학습 난도</span><Select value={level} onValueChange={changeLevel} disabled={saving}><SelectTrigger className="level-select" aria-label="영어 학습 난도 선택"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="work">실전 초급 · 두세 문장으로 답하기</SelectItem><SelectItem value="basics">기초 다지기 · 짧은 표현부터</SelectItem></SelectContent></Select></div><p>{level === "work" ? "짧은 문장을 연결해 이유를 설명하고, 요청하고, 다시 질문해보세요." : "짧은 인사와 기본 표현을 확인하고 싶을 때 선택하세요."}</p></div>
      <TabsContent value="today" id="study-main">
        <div className="page-heading today-heading"><div><p className="eyebrow">MAKE TIME FOR YOURSELF</p><h1>오늘의 한 걸음이,<br/>내일의 영어가 되니까.</h1><p className="heading-sub">{level === "work" ? "오늘도 10분부터. 나의 말로 대화를 이어가요." : "짧은 표현부터, 내 속도로 시작해요."}</p></div><div className="today-progress"><span className="progress-kicker">DAY {number(dayNumber(day))}</span><strong>{loading || loadError ? "—" : done.length}<span> / 6</span></strong><span>이번 수업 완료 단계</span><Progress value={done.length/6*100} aria-label="이번 수업 완료 단계"/></div></div>
        <div className="study-toolbar"><div className="study-focus"><span className="focus-icon"><Headphones size={19}/></span><div><strong>지금은, {stages[stage].title}</strong><span>한 단계 권장 10분 · 표현 5개</span></div></div><div className="quiet-control"><label htmlFor="quiet-mode">조용히 공부하기<small>마이크 없이도 괜찮아요</small></label><Switch id="quiet-mode" checked={quiet} onCheckedChange={v=>preference("quiet",v)}/></div></div>
        {loadError && <div className="status-banner error" role="alert"><span>{loadError} 학습은 계속할 수 있어요.</span><button onClick={()=>void load(false)}>다시 불러오기</button></div>}
        <div className="learning-grid">
          <div className="learning-column">
            <section className="lesson-panel" aria-labelledby="lesson-title">
              <div className="lesson-top"><span className="day-label">DAY {number(dayNumber(day))}</span><span>{lesson.label}</span><span className="lesson-length">{level === "work" ? "응답 연습 5개" : "핵심 표현 5개"}</span></div>
              <h2 id="lesson-title">{lesson.title}</h2><p className="scene">{lesson.scene}</p>
              <div className="lesson-track" aria-label="학습 단계 선택">{stages.map((s,i)=><button key={s.title} disabled={saving} className={`${stage===i ? "active" : ""} ${done.includes(i) ? "complete" : ""}`} aria-current={stage===i ? "step" : undefined} aria-label={`${i+1}단계 ${s.title}${done.includes(i) ? ", 완료" : ""}`} onClick={()=>changeStage(i)}><span>{done.includes(i)?<Check size={14}/>:number(i+1)}</span><span>{s.title}</span></button>)}</div>
              <div className="stage-top"><div className="stage-name"><StageIcon size={20}/><h3>{stages[stage].title}</h3><span>{number(stage+1)} / 06</span></div><div className="audio-settings"><Select value={rate} onValueChange={v=>preference("rate",v)}><SelectTrigger aria-label="영어 재생 속도" className="speed-select"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="0.7">0.7× 아주 천천히</SelectItem><SelectItem value="0.85">0.85× 천천히</SelectItem><SelectItem value="1">1× 보통 속도</SelectItem></SelectContent></Select><label className="translation-control" htmlFor="translation-toggle">뜻 보기<Switch id="translation-toggle" checked={translation} onCheckedChange={v=>preference("translation",v)}/></label></div></div>
              <p className="stage-hint">{stages[stage].hint}</p>
              <div className={`practice-card stage-${stage} ${level === "work" ? "work-practice" : ""}`}>
                <div className="practice-meta"><span>{stage===0 ? "짧은 대화" : stage===4 ? level === "work" ? "조건 바꾸기" : "기억 꺼내기" : stage===5 ? "오늘의 복습" : "오늘의 한 문장"}</span><span>{number(card+1)} <span className="muted">/ 05</span></span></div>
                {(stage===0 || stage===3 || (level === "work" && stage===5)) && <div className="partner"><span className="speaker-label">상대방</span><div>{level === "work" && stage === 5 && !questionShown ? <><p className="listen-first">먼저 질문을 들어보세요.</p><button className="text-button" onClick={()=>setQuestionShown(true)}>질문을 글로 보기</button></> : <><p lang="en">{phrase.cue}</p>{translation && <p className="korean">{phrase.cueKo}</p>}</>}</div><button className="icon-button" aria-label="상대방 문장 듣기" onClick={()=>speech.play(speechLines(phrase.cue))}><Volume2 size={19}/></button></div>}
                {(stage===0 || stage===1 || stage===2) && <div className="target-phrase"><span className="speaker-label">{stage===0 ? "나의 한마디" : "LISTEN & LEARN"}</span><p lang="en" className="english-phrase">{phrase.en}</p>{translation && <p className="phrase-translation">{phrase.ko}</p>}</div>}
                {(stage===3 || stage===4 || stage===5) && <div className="question"><span className="speaker-label">이렇게 말해보세요</span><p>{level === "work" ? stage === 4 ? phrase.variation?.task : stage === 5 && !questionShown ? "들은 질문에 두세 문장으로 답하세요. 이유나 다음 행동을 덧붙여보세요." : phrase.task : phrase.ko}</p></div>}
                {stage===0 && <div className="listen-actions"><button className="primary-button" onClick={()=>playDialogue(false)}>{speech.speaking ? <Square size={19}/> : <Play size={19} fill="currentColor"/>}{speech.speaking ? "재생 멈추기" : "대화 듣기"}</button><button className="text-button" onClick={()=>playDialogue(true)}><RotateCcw size={17}/> 10분 반복 듣기</button></div>}
                {(stage===1 || stage===2) && <div className="listen-actions"><button className="primary-button" onClick={speech.speaking ? speech.stop : playPhrase}>{speech.speaking ? <Square size={19}/> : <Volume2 size={19}/>}{speech.speaking ? "재생 멈추기" : "문장 듣기"}</button>{stage===2 && <button className="text-button" onClick={()=>speech.play(Array.from({length:3},()=>speechLines(phrase.en)).flat(),{gap:4500})}><RotateCcw size={17}/> 따라 할 틈을 두고 3번</button>}</div>}
                {((stage===2) || (stage===3 && !quiet) || isOpenPractice) && <div className="speaking-practice">
                  {!quiet && <><button className={`mic-button ${speech.listening ? "listening" : ""}`} onClick={()=>speech.recognize(receiveSpeech)} disabled={!speech.micSupported}><Mic size={20}/>{speech.listening ? "그만 말하기" : speech.micSupported ? level === "work" ? "한 문장씩 눌러 말하기" : "눌러서 말하기" : "이 브라우저는 직접 입력으로 연습"}</button><p className="micro-note">음성 인식 시 브라우저 제공자에게 음성이 전송될 수 있어요. 앱에는 음성을 저장하지 않아요.</p></>}
                  <label className="input-label" htmlFor="sentence-entry"><Keyboard size={16}/>{quiet ? "조용히 문장을 써보세요" : "직접 입력해도 좋아요"}</label>
                  <form className={`answer-form ${level === "work" ? "long-answer-form" : ""}`} onSubmit={e=>{e.preventDefault();checkEntry();}}>{level === "work" ? <Textarea id="sentence-entry" value={entry} onChange={e=>{setEntry(e.target.value);setFeedback(null);}} lang="en" autoComplete="off" autoCapitalize="sentences" spellCheck={false} placeholder="답변 → 이유나 세부 내용 → 질문 또는 다음 행동" maxLength={700} rows={4}/> : <input id="sentence-entry" value={entry} onChange={e=>{setEntry(e.target.value);setFeedback(null);}} lang="en" autoComplete="off" autoCapitalize="sentences" placeholder="영어 문장 입력" maxLength={200}/>}<button type="submit" className="secondary-button">{level === "work" ? "예시와 비교" : "확인"}</button></form>
                  <p className="micro-note">{level === "work" ? "입력·인식한 답변을 예시와 비교해요. 문법이나 뜻의 정답 여부를 자동으로 판단하지는 않아요." : "입력·인식한 문장을 예시와 비교해요. 발음 점수는 매기지 않아요."}</p>{level === "work" && !quiet && <p className="micro-note">마이크를 다시 누르면 답변에 이어서 입력돼요. 다 말한 뒤 ‘예시와 비교’를 누르세요.</p>}
                  {stage===3 && level === "basics" && <button className="text-button answer-hint" onClick={()=>setRevealed(v=>!v)}>{revealed ? "예시 닫기" : "예시 문장 보기"}</button>}
                </div>}
                {isChoice && <div className="choices" aria-label="알맞은 영어 문장 고르기">{orderedChoices.map((answer,i)=><button key={answer} onClick={()=>chooseAnswer(answer)} className={`choice ${chosen===answer ? answer===phrase.en ? "correct" : "incorrect" : ""}`}><span className="choice-letter">{String.fromCharCode(65+i)}</span><span lang="en">{answer}</span>{chosen===answer && answer===phrase.en && <Check size={19}/>}</button>)}</div>}
                {stage===4 && level === "basics" && <div className="recall-actions">{!revealed ? <button className="primary-button" onClick={()=>{setRevealed(true);markAnswered();}}><BookOpen size={19}/>영어 표현 확인하기</button> : <><p className="recalled-phrase" lang="en">{phrase.en}</p><button className="secondary-button" onClick={playPhrase}><Volume2 size={18}/>듣고 한 번 더</button><p className="micro-note">입으로 또는 마음속으로 한 번 더 말해보세요.</p></>}</div>}
                {revealed && (stage===3 || isOpenPractice) && <div className="example-answer"><span>{stage === 4 ? "조건을 바꾼 예시" : "예시 답변"}</span><p lang="en">{targetAnswer}</p><button className="text-button" onClick={playPhrase}><Volume2 size={17}/>듣기</button></div>}
                {feedback && (stage===2 || stage===3 || stage===4 || stage===5) && <div className={`feedback ${feedback.correct ? "good" : isOpenPractice ? "review" : "retry"}`} role="status">{feedback.text}{!feedback.correct && stage===2 && <p lang="en">{phrase.en}</p>}</div>}
                {canSelfReview && !answered.includes(card) && <div className="self-review"><p><strong>내 답 확인하기</strong><br/>{stage === 4 ? phrase.variation?.task : phrase.task}</p><p>표현이 달라도 필요한 뜻을 전달했는지 확인한 뒤 완료를 눌러주세요.</p><button className="secondary-button" onClick={markAnswered}><Check size={17}/>답변 확인 완료</button></div>}
                {(stage===1 || stage===2) && <div className="phrase-tip"><Lightbulb size={19}/><p>{phrase.tip}</p></div>}
                {stage<=2 && <div className="lesson-feature-actions"><button className="text-button" disabled={book.busy || !book.ready} onClick={()=>void addLessonPhrase()}><Bookmark size={17}/>단어장에 담기</button><button className="text-button" onClick={()=>practicePronunciation(phrase.en)}><Mic size={17}/>내 발음 확인<ArrowRight size={15}/></button></div>}
                {wordNotice && <p className="feature-status" role="status">{wordNotice}</p>}{book.error && stage<=2 && <p className="form-error" role="alert">{book.error}<button className="text-button" onClick={()=>changeTab("words")}>단어장 열기</button></p>}
                <div className="card-navigation"><button className="icon-button" aria-label="이전 문장" disabled={card===0} onClick={()=>changeCard(card-1)}><ArrowLeft size={19}/></button><div className="sentence-dots" aria-label="문장 선택">{lesson.phrases.map((_,i)=><button key={i} className={`${card===i ? "active" : ""} ${answered.includes(i) ? "answered" : ""}`} aria-label={`${i+1}번 문장`} aria-current={card===i ? "step" : undefined} onClick={()=>changeCard(i)}>{answered.includes(i) ? <Check size={12}/> : <span/>}</button>)}</div><button className="icon-button" aria-label="다음 문장" disabled={card===4} onClick={()=>changeCard(card+1)}><ArrowRight size={19}/></button></div>
              </div>
              {speech.message && <div className="audio-message" role="status"><Volume2 size={17}/><span>{speech.message}</span></div>}
              {speech.speaking && <button className="stop-audio" onClick={speech.stop}><Square size={14}/> 모든 음성 멈추기</button>}
              <div className="stage-footer"><span>{stage>=3 ? `${answered.length}/5개 연습 완료` : "충분히 연습했다면 완료를 눌러주세요."}</span>{isStageDone ? <button className="primary-button" onClick={()=>stage<5 ? changeStage(stage+1) : changeTab("course")}>{stage<5 ? "다음 단계" : "코스 보기"}<ArrowRight size={17}/></button> : <button className="primary-button" disabled={saving || !exerciseReady} onClick={()=>void saveStage()}>{saving ? <Loader2 className="spin" size={17}/> : <Check size={18}/>} {saving ? "저장 중" : "이 단계 완료"}</button>}</div>
              {isStageDone && <p className="saved-label"><CheckCircle2 size={15}/> 완료한 단계예요. 언제든 다시 연습할 수 있어요.</p>}
              {notice && <div className="status-banner success" role="status">{notice}</div>}{saveError && <div className="status-banner error" role="alert">{saveError}<button onClick={()=>void saveStage()} disabled={saving}>다시 저장</button></div>}
            </section>
            <div className="commute-note"><Headphones size={21}/><div><strong>이어폰을 끼고, 부담 없이.</strong><p>소리 내기 어려운 출근길엔 ‘조용히 공부하기’를 켜세요. 음성은 화면을 열어둔 동안 재생돼요.</p></div></div>
          </div>
          <aside className="journey-column">
            <section className="journey-card"><div className="journey-heading"><span className="eyebrow">MY MORNING ROUTE</span><TrainFront size={22}/></div><h2>나의 출근길 루틴</h2><p className="route-desc">10분씩 여섯 걸음, 총 60분</p><div className="route-progress"><span>이 수업 진행</span><strong>{loading ? "불러오는 중" : `${done.length} / 6 단계`}</strong></div><Progress value={done.length/6*100} aria-label="선택한 수업 완료율"/>
              <ol className="route-stages">{stages.map((s,i)=>{const Icon=stageIcons[i]; return <li key={s.title} className={`${stage===i ? "current" : ""} ${done.includes(i) ? "done" : ""}`}><button onClick={()=>changeStage(i)} aria-current={stage===i ? "step" : undefined}><span className="route-node">{done.includes(i) ? <Check size={16}/> : number(i+1)}</span><span className="route-text"><strong>{s.title}</strong><small>{s.sub}</small></span><Icon className="route-icon" size={17}/></button></li>;})}</ol><p className="route-footnote">각 10분은 권장 시간이에요.<br/>바쁜 날에는 한 단계만 해도 좋아요.</p>
            </section>
            <section className="timer-card"><div><Clock3 size={18}/><span>이 단계 집중 시간</span></div><strong className="timer-digits">{number(Math.floor(seconds/60))}<span>:</span>{number(Math.floor(seconds%60))}<small> / 10분</small></strong><div className="timer-actions"><button className="secondary-button" onClick={()=>{if(seconds>=600)setSeconds(0);setTimerOn(v=>!v);}}>{timerOn ? <Square size={15}/> : <Play size={15}/>} {timerOn ? "잠깐 쉬기" : seconds>=600 ? "다시 시작" : "시간 재기"}</button><button className="icon-button" aria-label="집중 시간 초기화" onClick={()=>{setTimerOn(false);setSeconds(0);}}><RotateCcw size={17}/></button></div><p>화면을 보고 있는 시간만 세어요.</p></section>
          </aside>
        </div>
      </TabsContent>

      <TabsContent value="course"><div className="page-heading"><div><p className="eyebrow">YOUR FIRST TEN MORNINGS</p><h1>{level === "work" ? "실전 초급 · 10일 코스" : "기초 다지기 · 10일 코스"}</h1><p className="heading-sub">{level === "work" ? "일상 대화부터 업무 설명까지, 두세 문장으로 이어가는 회화." : "하루에 한 주제씩. 필요한 상황부터 골라도 좋아요."}</p></div><span className="course-count">{completedDays}<span> / 10일 완료</span></span></div>
        <div className="course-grid">{lessons.map(l=>{const count=records.filter(r=>r.lessonId===l.id).length; return <button className={`course-card ${l.id===day ? "selected" : ""}`} key={l.id} onClick={()=>chooseDay(l.id)}><div className="course-card-top"><span>DAY {number(dayNumber(l.id))}</span>{count===6 ? <span className="course-status"><CheckCircle2 size={16}/>완료</span> : count>0 ? <span className="course-status">학습 중 · {count}/6</span> : <span>{l.label}</span>}</div><h2>{l.title}</h2><p lang="en">{l.phrases[0].en}</p><div className="course-card-bottom"><span>{level === "work" ? "5개 응답 · 6단계" : "5개 표현 · 6단계"}</span><ChevronRight size={20}/></div></button>;})}</div>
      </TabsContent>
      <TabsContent value="words"><Wordbook book={book} rate={Number(rate)} onPractice={practicePronunciation}/></TabsContent>
      <TabsContent value="pronunciation"><Pronunciation initialText={pronunciationText} rate={Number(rate)} connections={connections} onConnect={()=>setAiSettingsOpen(true)}/></TabsContent>
      <TabsContent value="chat"><AiChat conversation={conversation} onConversation={setConversation} level={level} rate={Number(rate)} quiet={quiet} connections={connections} onConnect={()=>setAiSettingsOpen(true)} onPractice={practicePronunciation}/></TabsContent>
      <TabsContent value="history"><div className="page-heading"><div><p className="eyebrow">SMALL STEPS ADD UP</p><h1>차곡차곡, 나의 영어.</h1><p className="heading-sub">완료한 단계와 수업을 여기에서 확인하세요.</p></div></div>
        <div className="history-stats"><div><CalendarDays/><strong>{activeDateCount}<small>일</small></strong><span>완료 기록이 있는 날</span></div><div><BookOpen/><strong>{allCompletedDays}<small>/ 20</small></strong><span>완료한 수업 · 두 코스 합계</span></div><div><CheckCircle2/><strong>{records.length}<small>단계</small></strong><span>완료한 학습</span></div></div>
        {loadError && <div className="status-banner error" role="alert">{loadError}<button onClick={()=>void load(false)}>다시 불러오기</button></div>}
        {loading ? <div className="empty-state"><Loader2 className="spin"/><h2>학습 기록을 불러오고 있어요.</h2></div> : records.length===0 ? <div className="empty-state"><Sunrise size={44}/><h2>첫 한 걸음을 기다리고 있어요.</h2><p>학습을 마치고 ‘이 단계 완료’를 누르면 기록이 남아요.</p><button className="primary-button" onClick={()=>changeTab("today")}>오늘의 회화 시작하기<ArrowRight size={18}/></button></div> : <div className="history-list">{allLessons.filter(l=>records.some(r=>r.lessonId===l.id)).map(l=>{const rows=records.filter(r=>r.lessonId===l.id);return <button key={l.id} onClick={()=>chooseDay(l.id)}><span className="history-day">{number(dayNumber(l.id))}</span><div><h2>{l.title}</h2><p>{l.id > 10 ? "실전 초급" : "기초 다지기"} · {new Intl.DateTimeFormat("ko-KR",{timeZone:"Asia/Seoul",month:"long",day:"numeric"}).format(new Date(rows[0].completedAt))} · {rows.length}/6단계 완료</p></div><ChevronRight size={20}/></button>;})}</div>}
      </TabsContent>
    </Tabs>
    <AiSettings open={aiSettingsOpen} onOpenChange={setAiSettingsOpen} connections={connections}/>
    <footer className="app-footer"><span>morning<span className="brand-dot">.</span></span><p>매일 조금씩, 내 속도로.</p></footer>
  </div>;
}

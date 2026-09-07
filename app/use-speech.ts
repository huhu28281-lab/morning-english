"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type SpeechLine = { text: string; index?: number };
export function normalizeSentence(value: string) {
  return value.toLowerCase().replace(/[’‘]/g, "'").replace(/\bi'm\b/g, "i am").replace(/\bi'll\b/g, "i will").replace(/\bi'd\b/g, "i would").replace(/\bit's\b/g, "it is").replace(/\bisn't\b/g, "is not").replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}
type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{transcript:string}>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null; start: () => void; abort: () => void;
};
type SpeechWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };

export function useSpeech(rate: number) {
  const [supported, setSupported] = useState(true);
  const [micSupported, setMicSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [message, setMessage] = useState("");
  const token = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const voice = useRef<SpeechSynthesisVoice | undefined>(undefined);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const active = useRef(false);

  const stop = useCallback(() => {
    token.current++;
    timers.current.forEach(clearTimeout); timers.current = [];
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    if (recognition.current) {
      recognition.current.onresult = null; recognition.current.onerror = null; recognition.current.onend = null;
      recognition.current.abort(); recognition.current = null;
    }
    utterance.current = null; active.current = false;
    setSpeaking(false); setListening(false); setActiveIndex(-1);
  }, []);

  useEffect(() => {
    setSupported("speechSynthesis" in window);
    const w = window as SpeechWindow;
    setMicSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
    const update = () => {
      const available = window.speechSynthesis?.getVoices() || [];
      voice.current = available.find(v => v.lang === "en-US" && v.localService) || available.find(v => /^en[-_]US/i.test(v.lang)) || available.find(v => /^en/i.test(v.lang));
    };
    update(); window.speechSynthesis?.addEventListener("voiceschanged", update);
    const visibility = () => {
      if (document.hidden && active.current) { stop(); setMessage("화면을 벗어나 재생을 멈췄어요. 돌아오면 다시 재생해 주세요."); }
    };
    document.addEventListener("visibilitychange", visibility);
    return () => { stop(); window.speechSynthesis?.removeEventListener("voiceschanged", update); document.removeEventListener("visibilitychange", visibility); };
  }, [stop]);

  const play = useCallback((lines: SpeechLine[], options: { repeatMinutes?: number; gap?: number } = {}) => {
    stop(); setMessage("");
    if (!("speechSynthesis" in window)) { setMessage("이 브라우저는 음성 재생을 지원하지 않아요. Chrome 또는 Safari에서 열어주세요."); return; }
    if (!lines.length) return;
    const synth = window.speechSynthesis;
    const currentToken = token.current;
    const deadline = options.repeatMinutes ? Date.now() + options.repeatMinutes * 60000 : 0;
    active.current = true; setSpeaking(true);
    const later = (fn: () => void, delay: number) => { const timer = setTimeout(() => { timers.current = timers.current.filter(t => t !== timer); fn(); }, delay); timers.current.push(timer); return timer; };
    const speakNext = (index: number) => {
      if (token.current !== currentToken) return;
      if (index >= lines.length) {
        if (deadline && Date.now() < deadline) { later(() => speakNext(0), 1800); return; }
        active.current = false; setSpeaking(false); setActiveIndex(-1); setMessage("다 들었어요. 다시 듣거나 다음 표현으로 넘어가보세요."); return;
      }
      const line = lines[index];
      const u = new SpeechSynthesisUtterance(line.text);
      utterance.current = u; u.lang = "en-US"; u.rate = rate;
      if (voice.current) u.voice = voice.current;
      const fail = () => {
        if (token.current !== currentToken) return;
        stop(); setMessage("음성이 재생되지 않았어요. 휴대폰의 미디어 음량과 영어 음성 설정을 확인한 뒤 다시 눌러주세요.");
      };
      const watchdog = later(fail, 30000);
      u.onstart = () => { if (token.current === currentToken) setActiveIndex(line.index ?? -1); };
      u.onend = () => {
        clearTimeout(watchdog); timers.current = timers.current.filter(t => t !== watchdog);
        if (token.current !== currentToken) return;
        if (deadline && Date.now() >= deadline) { stop(); setMessage("10분 듣기를 마쳤어요. 준비되면 다음 단계로 넘어가세요."); return; }
        later(() => speakNext(index + 1), options.gap ?? 800);
      };
      u.onerror = (e) => { if (!["interrupted", "canceled"].includes(e.error)) fail(); };
      try { synth.speak(u); } catch { fail(); }
    };
    speakNext(0);
  }, [rate, stop]);

  const recognize = useCallback((onText: (text: string) => void) => {
    if (listening) { stop(); return; }
    stop(); setMessage("");
    const w = window as SpeechWindow; const Constructor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Constructor) { setMessage("이 브라우저에서는 음성 인식을 쓸 수 없어요. 아래에 문장을 입력해 연습하세요."); return; }
    const rec = new Constructor(); recognition.current = rec;
    rec.lang = "en-US"; rec.continuous = false; rec.interimResults = false;
    let gotResult = false; let hadError = false;
    rec.onresult = e => { gotResult = true; onText(e.results[0][0].transcript); };
    rec.onerror = e => {
      hadError = true;
      const errors: Record<string,string> = { "not-allowed":"마이크 권한이 필요해요. 브라우저 설정에서 허용하거나 문장을 직접 입력해 주세요.", "audio-capture":"마이크를 찾을 수 없어요. 연결을 확인하거나 직접 입력해 주세요.", "network":"음성 인식에 연결하지 못했어요. 인터넷 연결을 확인하거나 직접 입력해 주세요.", "no-speech":"말소리가 들리지 않았어요. 다시 말하거나 문장을 입력해 주세요." };
      setMessage(errors[e.error] || "음성을 인식하지 못했어요. 다시 시도하거나 문장을 직접 입력해 주세요.");
    };
    rec.onend = () => { active.current = false; setListening(false); recognition.current = null; if (!gotResult && !hadError) setMessage("인식한 문장이 없어요. 다시 말하거나 직접 입력해 주세요."); };
    try { active.current = true; setListening(true); rec.start(); } catch { stop(); setMessage("마이크를 시작하지 못했어요. 문장을 직접 입력해 연습할 수 있어요."); }
  }, [listening, stop]);

  return { supported, micSupported, speaking, listening, activeIndex, message, setMessage, play, stop, recognize };
}

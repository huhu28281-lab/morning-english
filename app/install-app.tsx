"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ExternalLink, Copy, X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const appUrl = "https://morning-english.huhu28281.chatgpt.site";

export default function InstallApp() {
  const [open, setOpen] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [platform, setPlatform] = useState<"android" | "ios" | "desktop">("android");
  const [message, setMessage] = useState("");
  const prompt = useRef<InstallPrompt | null>(null);

  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean };
    const display = window.matchMedia("(display-mode: standalone)");
    const isStandalone = () => setInstalled(display.matches || nav.standalone === true);
    isStandalone();
    const ios = /iPad|iPhone|iPod/.test(nav.userAgent) || (nav.platform === "MacIntel" && nav.maxTouchPoints > 1);
    setPlatform(ios ? "ios" : /Android/i.test(nav.userAgent) ? "android" : "desktop");
    const available = (event: Event) => { event.preventDefault(); prompt.current = event as InstallPrompt; setReady(true); };
    const completed = () => { setInstalled(true); setOpen(false); setReady(false); prompt.current = null; };
    window.addEventListener("beforeinstallprompt", available);
    window.addEventListener("appinstalled", completed);
    display.addEventListener("change", isStandalone);
    return () => { window.removeEventListener("beforeinstallprompt", available); window.removeEventListener("appinstalled", completed); display.removeEventListener("change", isStandalone); };
  }, []);

  const install = async () => {
    if (busy) return;
    const event = prompt.current;
    setMessage("");
    if (!event) { setOpen(true); return; }
    prompt.current = null; setReady(false); setBusy(true);
    try {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome === "accepted") {
        setMessage("설치를 요청했어요. 완료되면 홈 화면이나 앱 목록에서 ‘모닝 잉글리시’를 찾아주세요.");
      } else {
        setMessage("설치를 취소했어요. 원할 때 브라우저 메뉴에서 다시 추가할 수 있어요.");
      }
      setOpen(true);
    } catch {
      setMessage("설치 창을 열지 못했어요. 아래 브라우저 메뉴로 추가해 주세요."); setOpen(true);
    } finally { setBusy(false); }
  };

  const copyUrl = async () => {
    try { await navigator.clipboard.writeText(appUrl); setMessage("주소를 복사했어요. 휴대폰 브라우저의 주소창에 붙여넣으세요."); }
    catch { setMessage("자동 복사가 안 되면 아래 주소를 길게 눌러 복사해 주세요."); }
  };

  if (installed) return null;
  return <>
    <button className="install-trigger" onClick={()=>void install()} disabled={busy} aria-label="모닝 잉글리시를 홈 화면에 추가"><Download size={17}/><span>{busy ? "설치 준비 중" : "홈 화면에 추가"}</span></button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="install-dialog" showCloseButton={false}>
        <DialogClose className="install-close" aria-label="설치 안내 닫기"><X size={20}/></DialogClose>
        <DialogHeader className="install-heading">
          <img src="/icons/icon-192.png" width="64" height="64" alt="노란색 바탕의 모닝 잉글리시 m. 아이콘"/>
          <DialogTitle>내 홈 화면에 모닝 잉글리시</DialogTitle>
          <DialogDescription>아이콘을 누르면 바로 영어 공부를 시작할 수 있어요.</DialogDescription>
        </DialogHeader>
        {message && <p className="install-status" role="status">{message}</p>}
        {ready && <button className="primary-button" disabled={busy} onClick={()=>void install()}><Download size={18}/>{busy ? "설치 준비 중" : "앱 설치하기"}</button>}
        <div className="install-instructions">
          <h2>{platform === "ios" ? "아이폰 · Safari" : platform === "android" ? "안드로이드 · Chrome" : "컴퓨터 · Chrome 또는 Edge"}</h2>
          {platform === "ios" ? <ol><li>Safari에서 이 앱을 여세요.</li><li>브라우저의 <strong>공유</strong> 메뉴를 누르세요.</li><li><strong>홈 화면에 추가</strong>를 선택하세요. ‘웹 앱으로 열기’가 보이면 켜고 <strong>추가</strong>를 누르세요.</li></ol>
          : platform === "android" ? <ol><li>Chrome에서 이 앱을 여세요.</li><li>오른쪽 위 <strong>⋮ 메뉴</strong>를 누르세요.</li><li><strong>홈 화면에 추가</strong> 또는 <strong>앱 설치</strong>를 선택하고, 표시되는 안내를 따라 추가하세요.</li></ol>
          : <ol><li>Chrome이나 Edge에서 이 앱을 여세요.</li><li>주소창의 <strong>설치 아이콘</strong>이나 브라우저 메뉴의 <strong>앱 설치</strong> 항목을 선택하세요.</li><li>설치 창에서 <strong>설치</strong>를 누르세요. 설치 후 앱 목록에서도 열 수 있어요.</li></ol>}
        </div>
        <div className="install-browser-help"><p>ChatGPT 안에서 보고 있다면 주소를 복사해 휴대폰의 Chrome이나 Safari에서 열어주세요.</p><div className="install-links"><a href={appUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={16}/>앱 주소 열기</a><button onClick={()=>void copyUrl()}><Copy size={16}/>주소 복사</button></div><input className="install-url" aria-label="모닝 잉글리시 주소" value={appUrl} readOnly onFocus={e=>e.currentTarget.select()}/></div>
        <p className="install-footnote">처음 열 때 로그인이 필요할 수 있어요. 학습 기록은 같은 계정으로 이어집니다.</p>
      </DialogContent>
    </Dialog>
  </>;
}

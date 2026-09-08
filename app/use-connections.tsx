"use client";
import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { ConnectionStatus } from "./ai-types";
export function useConnections() {
  const [status,setStatus]=useState<ConnectionStatus|null>(null),[error,setError]=useState("");
  const reload=useCallback(async()=>{
    setError("");
    try {const r=await fetch("/api/ai/settings",{cache:"no-store"}),d=await r.json();if(!r.ok)throw new Error(d.error);setStatus(d);}
    catch {setError("서비스 상태를 확인하지 못했어요.");}
  },[]);
  useEffect(()=>{void reload();},[reload]);
  return {status,error,reload};
}
export function ConnectionNotice({provider,connections}:{provider:"cloudflare"|"azure";connections:ReturnType<typeof useConnections>}) {
  if(connections.error)return <div className="status-banner error" role="alert">{connections.error}<button onClick={()=>void connections.reload()}>다시 확인</button></div>;
  if(!connections.status)return <p className="feature-status"><Loader2 className="spin" size={17}/>이용 가능 여부 확인 중</p>;
  if(connections.status[provider])return null;
  return <div className="status-banner" role="status"><span>{provider==="cloudflare"?"현재 AI 대화를 이용할 수 없어요.":"현재 발음 평가를 이용할 수 없어요."}</span><button onClick={()=>void connections.reload()}>다시 확인</button></div>;
}

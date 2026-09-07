"use client";
import { useCallback, useEffect, useState } from "react";
import { Check, Link2, Loader2, ExternalLink, Cloud } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { ConnectionStatus } from "./ai-types";
export function useConnections() {
  const [status,setStatus]=useState<ConnectionStatus|null>(null),[error,setError]=useState("");
  const reload=useCallback(async()=>{
    setError("");
    try {const r=await fetch("/api/ai/settings",{cache:"no-store"}),d=await r.json();if(!r.ok)throw new Error(d.error);setStatus(d);}
    catch(e){setError(e instanceof Error?e.message:"AI 연결 설정을 불러오지 못했어요.");}
  },[]);
  useEffect(()=>{void reload();},[reload]);
  return {status,error,reload};
}
export function ConnectionNotice({provider,connections,onOpen}:{provider:"cloudflare"|"azure";connections:ReturnType<typeof useConnections>;onOpen:()=>void}) {
  if(connections.error)return <div className="status-banner error" role="alert">{connections.error}<button onClick={()=>void connections.reload()}>다시 확인</button></div>;
  if(!connections.status)return <p className="feature-status"><Loader2 className="spin" size={17}/>서비스 연결을 확인하고 있어요.</p>;
  if(connections.status[provider])return null;
  if(provider==="cloudflare" && connections.status.managedCloudflare)return <div className="connection-notice"><span className="connection-icon"><Cloud size={22}/></span><div><strong>AI 대화가 아직 활성화되지 않았어요.</strong><p>앱 운영자의 연결 설정이 필요해요. 별도 계정이나 토큰을 입력하지 않아도 됩니다.</p></div><button className="secondary-button" onClick={()=>void connections.reload()}>다시 확인</button></div>;
  return <div className="connection-notice"><span className="connection-icon"><Link2 size={22}/></span><div><strong>{provider==="cloudflare"?"Cloudflare 계정을 한 번 연결해 주세요.":"정밀 발음 평가는 별도 음성 서비스가 필요해요."}</strong><p>{provider==="cloudflare"?"Workers Free 계정의 무료 사용량으로 영어 대화를 시작할 수 있어요. 계정 ID와 Workers AI 토큰을 입력해 주세요.":"Cloudflare 영어 대화와는 별개예요. Azure Speech를 연결하면 단어별 평가를 받을 수 있고 별도 요금이 발생할 수 있어요. 녹음과 다시 듣기는 연결 없이 사용할 수 있어요."}</p></div><button className="secondary-button" onClick={onOpen}>{provider==="cloudflare"?"Cloudflare 연결":"AI 연결"}</button></div>;
}
export default function AiSettings({open,onOpenChange,connections}:{open:boolean;onOpenChange:(v:boolean)=>void;connections:ReturnType<typeof useConnections>}) {
  const [cfToken,setCfToken]=useState(""),[accountId,setAccountId]=useState(""),[freePlan,setFreePlan]=useState(false);
  const [azure,setAzure]=useState(""),[endpoint,setEndpoint]=useState("");
  const [busy,setBusy]=useState(""),[error,setError]=useState(""),[notice,setNotice]=useState(""),[remove,setRemove]=useState("");
  useEffect(()=>{if(open){setEndpoint(connections.status?.endpoint || "");setAccountId(connections.status?.accountId || "");setFreePlan(connections.status?.freePlanConfirmed || false);setError("");setNotice("");}else{setCfToken("");setAzure("");setRemove("");}},[open,connections.status?.endpoint,connections.status?.accountId,connections.status?.freePlanConfirmed]);
  const submit=async(provider:"cloudflare"|"azure"|"openai",deleting=false)=>{
    if(busy)return;setBusy(provider);setError("");setNotice("");
    try {
      const body=deleting?{provider}:provider==="cloudflare"?{provider,key:cfToken,accountId,freePlanConfirmed:freePlan}:{provider,key:azure,endpoint};
      const r=await fetch("/api/ai/settings",{method:deleting?"DELETE":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}),d=await r.json();
      if(!r.ok)throw new Error(d.error || "연결 설정을 저장하지 못했어요.");
      if(provider==="cloudflare")setCfToken("");else setAzure("");setRemove("");await connections.reload();
      setNotice(deleting?"저장된 연결 정보를 삭제했어요.":provider==="cloudflare"?"설정을 저장했어요. AI 대화에서 첫 문장을 보내 연결을 확인해 보세요.":"발음 평가 연결 정보를 저장했어요.");
    }catch(e){setError(e instanceof Error?e.message:"설정을 저장하지 못했어요.");}
    finally{setBusy("");}
  };
  const disconnect=(provider:"cloudflare"|"azure"|"openai")=>remove===provider?<div className="remove-connection"><p>이 서비스의 저장된 키를 삭제할까요?</p><button className="secondary-button" disabled={!!busy} onClick={()=>void submit(provider,true)}>키 삭제</button><button className="text-button" disabled={!!busy} onClick={()=>setRemove("")}>취소</button></div>:null;
  const managed=connections.status?.managedCloudflare===true;
  return <Dialog open={open} onOpenChange={v=>{if(!busy)onOpenChange(v);}}><DialogContent className="feature-dialog ai-settings-dialog"><DialogHeader><DialogTitle>AI 설정</DialogTitle><DialogDescription>{managed?"영어 대화와 선택 사항인 정밀 발음 평가를 확인하세요.":"영어 대화에 사용할 Cloudflare 계정을 연결하세요. 토큰은 서버에서 암호화해 보관합니다."}</DialogDescription></DialogHeader>
    {connections.error && <div className="status-banner error">{connections.error}<button onClick={()=>void connections.reload()}>다시 확인</button></div>}
    {!connections.status && !connections.error && <p className="feature-status"><Loader2 className="spin" size={17}/>서비스 연결을 확인하고 있어요.</p>}
    {managed ? <section className="provider-settings"><div className="feature-panel-top"><h3>영어 대화 · Morning</h3>{connections.status?.cloudflare && <span className="connection-saved"><Check size={14}/>사용 가능</span>}</div><div className="cloudflare-free-note"><Cloud size={23}/><div><strong>{connections.status?.cloudflare?"별도 계정 없이 대화를 시작하세요.":"AI 대화가 아직 활성화되지 않았어요."}</strong><p>{connections.status?.cloudflare?"앱에서 제공하는 Cloudflare AI 영어 파트너예요. 개인 토큰을 입력할 필요가 없어요.":"앱 운영자의 연결 설정이 필요해요. 설정이 완료되면 여기서 이용할 수 있어요."}</p></div></div><p className="micro-note">하루 사용량은 모든 방문자가 함께 나눠 사용해요. 앱 전체 하루 최대 50회 또는 사용량 예산 중 먼저 도달한 한도에서 멈춥니다. 한국 시간 오전 9시에 초기화돼요.</p><button className="secondary-button" onClick={()=>void connections.reload()}>연결 상태 다시 확인</button></section> : connections.status && <section className="provider-settings"><div className="feature-panel-top"><h3>영어 대화 · Cloudflare Workers AI</h3>{connections.status.cloudflare && <span className="connection-saved"><Check size={14}/>설정됨</span>}</div>
      <div className="cloudflare-free-note"><Cloud size={23}/><div><strong>Workers Free 계정으로 시작하세요.</strong><p>Cloudflare 무료 할당량은 하루 10,000 Neurons예요. Free 요금제는 한도에 도달하면 요청이 중단됩니다. Paid 요금제는 초과 요금이 발생할 수 있어요.</p><a href="https://developers.cloudflare.com/workers-ai/platform/pricing/" target="_blank" rel="noreferrer">공식 무료 사용 범위<ExternalLink size={13}/></a></div></div>
      {!connections.status.ready && <p className="form-error">연결 정보를 저장하려면 앱 운영자의 설정이 필요해요.</p>}
      <ol className="cloudflare-setup-steps"><li>Cloudflare에서 계정의 <strong>Workers Free 요금제</strong>를 확인하세요.</li><li><strong>Workers AI → Use REST API</strong>에서 Account ID를 복사하고 Workers AI API Token을 만드세요.</li><li>아래에 입력하고 저장한 뒤, AI 대화에서 첫 문장을 보내세요.</li></ol>
      <div className="feature-actions"><a className="text-button" href="https://dash.cloudflare.com/" target="_blank" rel="noreferrer">Cloudflare 열기<ExternalLink size={14}/></a><a className="text-button" href="https://developers.cloudflare.com/workers-ai/get-started/rest-api/" target="_blank" rel="noreferrer">토큰 발급 안내<ExternalLink size={14}/></a></div>
      <form className="feature-form cf-connect-form" onSubmit={e=>{e.preventDefault();void submit("cloudflare");}}>
        <label htmlFor="cf-account">Cloudflare 계정 ID<Input id="cf-account" value={accountId} onChange={e=>{setAccountId(e.target.value);setFreePlan(false);}} required minLength={32} maxLength={32} pattern="[a-fA-F0-9]{32}" autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="Account ID · 영문과 숫자 32자리"/></label>
        <label htmlFor="cf-token">Workers AI API 토큰<Input id="cf-token" type="password" autoComplete="off" autoCapitalize="none" spellCheck={false} value={cfToken} onChange={e=>setCfToken(e.target.value)} maxLength={1000} minLength={20} required placeholder={connections.status?.cloudflare?"변경할 때 새 토큰을 입력하세요":"Workers AI 전용 토큰 입력"}/><small>Workers AI의 Read·Edit 권한이 있는 토큰을 사용하세요. 이 채팅에 토큰을 보내지 말고 앱 입력란에 넣어주세요.</small></label>
        <label className="free-plan-confirm" htmlFor="cf-free"><Checkbox id="cf-free" checked={freePlan} onCheckedChange={v=>setFreePlan(v===true)}/><span>이 계정이 <strong>Workers Free 요금제</strong>인 것을 직접 확인했어요.</span></label>
        <p className="micro-note">앱은 계정 요금제와 다른 앱의 사용량을 자동 조회하지 않아요. 이 앱의 하루 최대 50회·보수적 사용량 예산 8,000 중 먼저 도달한 한도에서 멈춥니다. 유료 서비스로 자동 전환하지 않아요.</p>
        <div className="feature-actions"><button className="primary-button" type="submit" disabled={!!busy || !connections.status?.ready || !freePlan}>{busy==="cloudflare"?<Loader2 className="spin" size={17}/>:<Link2 size={17}/>}연결 정보 저장</button>{connections.status?.cloudflare && <button className="text-button" type="button" disabled={!!busy} onClick={()=>setRemove("cloudflare")}>연결 해제</button>}</div>
      </form>{disconnect("cloudflare")}
    </section>}
    <section className="provider-settings azure-optional"><div className="feature-panel-top"><h3>선택 사항 · 정밀 발음 평가</h3>{connections.status?.azure && <span className="connection-saved"><Check size={14}/>설정됨</span>}</div><p className="micro-note">영어 대화에는 필요하지 않아요. Azure Speech를 이용하는 별도 기능이며 사용 요금이 발생할 수 있어요.</p><form className="feature-form" onSubmit={e=>{e.preventDefault();void submit("azure");}}><label htmlFor="azure-key">Azure Speech 키<Input id="azure-key" type="password" autoComplete="off" spellCheck={false} value={azure} onChange={e=>setAzure(e.target.value)} required maxLength={1000}/></label><label htmlFor="azure-endpoint">Speech 리소스 주소<Input id="azure-endpoint" type="url" value={endpoint} onChange={e=>setEndpoint(e.target.value)} required autoComplete="off" spellCheck={false} placeholder="https://리소스이름.cognitiveservices.azure.com"/></label><div className="feature-actions"><button type="submit" className="secondary-button" disabled={!!busy || !connections.status?.ready}>{busy==="azure"?<Loader2 className="spin" size={17}/>:<Link2 size={17}/>}발음 평가 설정 저장</button>{connections.status?.azure && <button type="button" className="text-button" disabled={!!busy} onClick={()=>setRemove("azure")}>연결 해제</button>}</div></form>{disconnect("azure")}</section>
    {connections.status?.openai && <section className="provider-settings"><p className="micro-note">이전에 저장한 OpenAI 키는 영어 대화에 사용하지 않아요.</p><button className="text-button" disabled={!!busy} onClick={()=>setRemove("openai")}>이전 OpenAI 키 삭제</button>{disconnect("openai")}</section>}
    {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="status-banner success" role="status">{notice}</p>}
  </DialogContent></Dialog>;
}

"use client";
import { useCallback, useEffect, useRef, useState } from "react";
export function useRecorder() {
  const [supported,setSupported]=useState(false),[recording,setRecording]=useState(false),[starting,setStarting]=useState(false);
  const [seconds,setSeconds]=useState(0),[blob,setBlob]=useState<Blob|null>(null),[url,setUrl]=useState("");
  const [error,setError]=useState("");
  const recorder=useRef<MediaRecorder|null>(null),stream=useRef<MediaStream|null>(null),timer=useRef<ReturnType<typeof setInterval>|null>(null);
  const generation=useRef(0),objectUrl=useRef("");
  const cleanup=useCallback(()=>{if(timer.current)clearInterval(timer.current);timer.current=null;stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;},[]);
  const stop=useCallback(()=>{if(recorder.current?.state==="recording")recorder.current.stop();if(timer.current)clearInterval(timer.current);timer.current=null;},[]);
  const clear=useCallback(()=>{
    generation.current++; stop(); cleanup(); recorder.current=null;
    if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);objectUrl.current="";
    setBlob(null);setUrl("");setSeconds(0);setRecording(false);setStarting(false);setError("");
  },[stop,cleanup]);
  useEffect(()=>{
    setSupported(!!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder!=="undefined");
    const hidden=()=>{if(document.hidden)stop();};document.addEventListener("visibilitychange",hidden);
    return ()=>{generation.current++;stop();cleanup();if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);document.removeEventListener("visibilitychange",hidden);};
  },[stop,cleanup]);
  const start=useCallback(async()=>{
    clear(); const current=generation.current;setStarting(true);
    let acquired:MediaStream|null=null;
    try {
      acquired=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true},video:false});
      if(current!==generation.current){acquired.getTracks().forEach(t=>t.stop());return;}
      stream.current=acquired;
      const mime=["audio/webm;codecs=opus","audio/mp4","audio/webm"].find(t=>MediaRecorder.isTypeSupported(t));
      const rec=new MediaRecorder(acquired,mime?{mimeType:mime}:undefined);recorder.current=rec;
      const chunks:Blob[]=[];
      rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      rec.onstop=()=>{
        if(current!==generation.current)return;
        cleanup();setRecording(false);setStarting(false);
        const result=new Blob(chunks,{type:rec.mimeType || chunks[0]?.type || "audio/webm"});
        if(!result.size){setError("녹음이 비어 있어요. 다시 녹음해 주세요.");return;}
        objectUrl.current=URL.createObjectURL(result);setBlob(result);setUrl(objectUrl.current);
      };
      rec.onerror=()=>{if(current!==generation.current)return;generation.current++;cleanup();setRecording(false);setStarting(false);setError("녹음하지 못했어요. 마이크 연결을 확인하고 다시 시도해 주세요.");};
      rec.start();setStarting(false);setRecording(true);const started=performance.now();
      timer.current=setInterval(()=>{const elapsed=(performance.now()-started)/1000;setSeconds(Math.min(elapsed,20));if(elapsed>=20)stop();},200);
    } catch(e) {
      acquired?.getTracks().forEach(t=>t.stop());
      if(current!==generation.current)return;
      cleanup();setStarting(false);setRecording(false);
      setError(e instanceof DOMException && e.name==="NotAllowedError" ? "마이크 권한을 허용한 뒤 다시 눌러주세요." : "마이크를 시작하지 못했어요. 마이크 연결과 브라우저 권한을 확인해 주세요.");
    }
  },[clear,cleanup,stop]);
  return {supported,recording,starting,seconds,blob,url,error,start,stop,clear};
}

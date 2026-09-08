"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { starterWords, wordKey, mergeWeeklyWords, type Word } from "./vocabulary-data";
export function useVocabulary(weeklyWords:Word[]=starterWords) {
  const [storedWords,setStoredWords]=useState<Word[]>([]),[loading,setLoading]=useState(true),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const words=useMemo(()=>mergeWeeklyWords(weeklyWords,storedWords),[weeklyWords,storedWords]);
  const reload=useCallback(async()=>{
    setLoading(true);setError("");
    try {
      const response=await fetch("/api/vocabulary",{cache:"no-store"}),data=await response.json();
      if(!response.ok || !Array.isArray(data.words))throw new Error(data.error || "단어장을 불러오지 못했어요.");
      setStoredWords(data.words);setReady(true);
    }catch(e){setError(e instanceof Error?e.message:"단어장을 불러오지 못했어요.");}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{void reload();},[reload]);
  const save=useCallback(async(word:Word)=>{
    if(busy)return false;
    if(!ready){setError("단어장 기록을 다시 불러온 뒤 저장해 주세요.");return false;}
    setBusy(true);setError("");
    try {
      const response=await fetch("/api/vocabulary",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(word)}),data=await response.json();
      if(!response.ok || !data.word)throw new Error(data.error || "단어를 저장하지 못했어요.");
      setStoredWords(previous=>{const map=new Map(previous.map(w=>[wordKey(w.english),w]));map.set(wordKey(word.english),data.word);return [...map.values()];});
      return true;
    }catch(e){setError(e instanceof Error?e.message:"단어를 저장하지 못했어요.");return false;}
    finally{setBusy(false);}
  },[busy,ready]);
  return {words,loading,ready,busy,error,reload,save};
}

"use client";
import { useEffect, useState } from "react";
import { mascotFrame, type MascotAction } from "./mascot-motion";
export const mascotNames = ["병아리", "꺼먹살이", "토끼", "그루트", "고양이"];
export default function WeekdayMascot({day=1,completed=false,playing=false,className=""}:{day?:number;completed?:boolean;playing?:boolean;className?:string}) {
  const index=Math.max(0,Math.min(4,day-1));
  const action: MascotAction=completed?"celebrate":playing?"play":"idle";
  const [frame,setFrame]=useState(completed?3:0);
  useEffect(()=>{
    if(index===3)return;
    const media=window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer:ReturnType<typeof setInterval>|undefined;
    const stop=()=>{if(timer!==undefined)clearInterval(timer);timer=undefined;};
    const start=()=>{
      stop();
      if(media.matches || document.hidden){setFrame(completed?3:0);return;}
      const startTime=performance.now();
      const tick=()=>{
        const elapsed=performance.now()-startTime;
        setFrame(mascotFrame(action,elapsed));
        if(action!=="idle" && elapsed>=3200)stop();
      };
      tick();timer=setInterval(tick,100);
    };
    start();media.addEventListener("change",start);document.addEventListener("visibilitychange",start);
    return ()=>{stop();media.removeEventListener("change",start);document.removeEventListener("visibilitychange",start);};
  },[action,completed,index]);
  if(index===3)return <img src="/groot-upload.webp" alt="그루트" width={120} height={120} className={`groot-mascot ${className}`} draggable={false}/>;
  return <span role="img" aria-label={mascotNames[index]} className={`mascot-sprite ${className}`} style={{backgroundImage:`url(/mascot-${index+1}-motion.webp)`,backgroundPosition:`${(frame%3)*50}% ${Math.floor(frame/3)*100}%`}}/>;
}

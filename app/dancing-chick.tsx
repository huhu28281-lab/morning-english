"use client";
import { useEffect, useState } from "react";
import WeekdayMascot, { mascotNames } from "./weekday-mascot";

export default function DancingChick({ variant = "home", day=1 }: { variant?: "home" | "empty"; day?:number }) {
  const name=mascotNames[Math.max(0,Math.min(4,day-1))];
  const [dancing, setDancing] = useState(false);
  useEffect(() => {
    if (!dancing) return;
    const timeout = window.setTimeout(() => setDancing(false), 3200);
    return () => window.clearTimeout(timeout);
  }, [dancing]);
  return <button type="button" className={`chick-button ${variant === "empty" ? "chick-empty" : ""} ${dancing ? "is-dancing" : ""}`} onClick={() => setDancing(value => !value)} aria-label={dancing ? `${name} 춤 멈추기` : `${name} 춤추기`} aria-pressed={dancing} title={dancing ? "춤 멈추기" : "눌러서 춤추기"}>
    <WeekdayMascot day={day} className="morning-mascot"/>
  </button>;
}

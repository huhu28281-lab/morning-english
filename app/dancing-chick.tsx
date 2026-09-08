"use client";
import { useEffect, useState } from "react";

export default function DancingChick({ variant = "home" }: { variant?: "home" | "empty" }) {
  const [dancing, setDancing] = useState(false);
  useEffect(() => {
    if (!dancing) return;
    const timeout = window.setTimeout(() => setDancing(false), 3200);
    return () => window.clearTimeout(timeout);
  }, [dancing]);
  return <button type="button" className={`chick-button ${variant === "empty" ? "chick-empty" : ""} ${dancing ? "is-dancing" : ""}`} onClick={() => setDancing(value => !value)} aria-label={dancing ? "병아리 춤 멈추기" : "병아리 춤추기"} aria-pressed={dancing} title={dancing ? "춤 멈추기" : "눌러서 춤추기"}>
    <img className="morning-mascot" src="/morning-chick.webp" alt="" width={120} height={120} draggable={false}/>
  </button>;
}

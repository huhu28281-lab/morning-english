export type MascotAction = "idle" | "play" | "celebrate";
export function mascotFrame(action: MascotAction, elapsed: number) {
  if (action === "celebrate") return elapsed < 2400 ? (Math.floor(elapsed / 300) % 2 ? 3 : 0) : 3;
  if (action === "play") {
    if (elapsed < 1500) return Math.floor(elapsed / 250) % 2 ? 2 : 0;
    if (elapsed < 3000) return Math.floor((elapsed - 1500) / 150) % 2 ? 5 : 4;
    return 0;
  }
  const cycle = elapsed % 5200;
  return cycle >= 4500 && cycle < 4700 ? 1 : 0;
}

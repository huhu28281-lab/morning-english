import { validateTutorReply } from "./ai-response.ts";

export type WorkersAiEnv = {
  AI?: {run(model:string,input:unknown):Promise<unknown>};
  CF_AI_FREE_PLAN_CONFIRMED?: string;
};
// Shared across browsers, sessions and future deployments of this D1-backed app.
export const SHARED_AI_BUDGET = "workers-ai:morning-english";

export function workersAiState(env: WorkersAiEnv) {
  if (!env.AI || typeof env.AI.run !== "function") return "binding_missing" as const;
  if (env.CF_AI_FREE_PLAN_CONFIRMED !== "true") return "free_plan_required" as const;
  return "ready" as const;
}

export async function runWorkersAi(env: WorkersAiEnv, model: string, input: unknown) {
  if (workersAiState(env) !== "ready") throw new Error("Workers AI is not enabled");
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const output = await Promise.race([
      env.AI!.run(model,input),
      new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error("Workers AI timeout")),30000);}),
    ]);
    // Bindings return {response: ...}; REST returns {success,result:{response}}.
    // Never auto-retry or invoke another provider; failed/late usage stays reserved.
    const response = output && typeof output === "object" ? (output as {response?:unknown}).response : undefined;
    return validateTutorReply(typeof response === "string" ? JSON.parse(response) : response);
  } finally { if (timer) clearTimeout(timer); }
}

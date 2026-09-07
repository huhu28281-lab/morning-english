import { env } from "cloudflare:workers";
import { progressDb } from "@/db/progress";
import { AppError } from "./api-utils";
import { decryptSecret, encryptSecret } from "./secret-codec";
import { CF_MAX_DAILY_CALLS, CF_MAX_DAILY_NEURONS, cloudflareDay, parseCloudflareConfiguration } from "./cloudflare-policy";
export type Provider = "openai"|"azure"|"cloudflare";
export function encryptionReady() { return !!env.APP_ENCRYPTION_KEY; }
function masterKey() {
  if (!env.APP_ENCRYPTION_KEY) throw new AppError("연결 설정을 준비 중이에요. 잠시 후 다시 시도해 주세요.",503);
  return env.APP_ENCRYPTION_KEY;
}
export function azureEndpoint(value: unknown) {
  if (typeof value !== "string") throw new AppError("Azure Speech 리소스 주소를 입력해 주세요.");
  try {
    const u = new URL(value.trim());
    if (u.protocol!=="https:" || u.username || u.password || u.port || u.search || u.hash || !["","/"].includes(u.pathname) || !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.cognitiveservices\.azure\.com$/.test(u.hostname)) throw new Error();
    return u.origin;
  } catch { throw new AppError("https://리소스이름.cognitiveservices.azure.com 형식의 Speech 주소를 입력해 주세요."); }
}
export async function saveConnection(userId: string, provider: Provider, key: string, endpoint: string) {
  const encrypted = await encryptSecret(key,masterKey(),`${userId}:${provider}`);
  await progressDb().prepare("INSERT INTO ai_connections (user_id,provider,encrypted_secret,endpoint,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(user_id,provider) DO UPDATE SET encrypted_secret=excluded.encrypted_secret,endpoint=excluded.endpoint,updated_at=excluded.updated_at").bind(userId,provider,encrypted,endpoint,new Date().toISOString()).run();
}
export async function getConnection(userId: string, provider: Provider) {
  const row = await progressDb().prepare("SELECT encrypted_secret AS secret,endpoint FROM ai_connections WHERE user_id=? AND provider=?").bind(userId,provider).first<{secret:string;endpoint:string}>();
  if (!row) throw new AppError(provider==="cloudflare" ? "AI 연결에서 Cloudflare 계정 ID와 Workers AI 토큰을 입력해 주세요." : provider==="openai" ? "AI 연결에서 OpenAI API 키를 먼저 설정해 주세요." : "AI 연결에서 Azure Speech를 먼저 설정해 주세요.",428);
  if(provider==="cloudflare") {
    const config=parseCloudflareConfiguration(row.endpoint);
    if(!config)throw new AppError("Cloudflare 연결에서 Workers Free 요금제 확인을 완료해 주세요.",428);
    return {key:await decryptSecret(row.secret,masterKey(),`${userId}:${provider}`),endpoint:`https://api.cloudflare.com/client/v4/accounts/${config.accountId}/ai/run`,accountId:config.accountId};
  }
  return {key:await decryptSecret(row.secret,masterKey(),`${userId}:${provider}`),endpoint:provider==="azure" ? azureEndpoint(row.endpoint) : "https://api.openai.com"};
}
export async function reserveUsage(userId: string, provider: Provider) {
  const window = new Date().toISOString().slice(0,16);
  const limit = provider === "azure" ? 4 : 10;
  const result = await progressDb().prepare("INSERT INTO ai_usage (user_id,provider,window,count) VALUES (?,?,?,1) ON CONFLICT(user_id,provider,window) DO UPDATE SET count=count+1 WHERE count < ? RETURNING count").bind(userId,provider,window,limit).first();
  if (!result) throw new AppError("잠시 쉬었다가 다시 시도해 주세요. 한 번에 너무 많은 요청을 보냈어요.",429);
  await progressDb().prepare("DELETE FROM ai_usage WHERE user_id=? AND window < ?").bind(userId,window).run();
}
export async function cloudflareUsage(accountId:string) {
  const {day,resetsAt}=cloudflareDay();
  const row=await progressDb().prepare("SELECT calls,reserved_neurons AS reservedNeurons FROM cloudflare_daily_usage WHERE account_id=? AND day=?").bind(accountId,day).first<{calls:number;reservedNeurons:number}>();
  return {calls:row?.calls||0,reservedNeurons:row?.reservedNeurons||0,maxCalls:CF_MAX_DAILY_CALLS,maxNeurons:CF_MAX_DAILY_NEURONS,resetsAt};
}
export async function reserveCloudflareBudget(accountId:string,neurons:number) {
  if(!Number.isInteger(neurons) || neurons<1 || neurons>CF_MAX_DAILY_NEURONS)throw new AppError("영어 문장을 조금 짧게 입력해 주세요.");
  const {day,resetsAt}=cloudflareDay();
  // Account-level reservation is atomic across users, tabs, and key changes.
  const row=await progressDb().prepare("INSERT INTO cloudflare_daily_usage (account_id,day,calls,reserved_neurons) VALUES (?,?,1,?) ON CONFLICT(account_id,day) DO UPDATE SET calls=calls+1,reserved_neurons=reserved_neurons+excluded.reserved_neurons WHERE calls < ? AND reserved_neurons+excluded.reserved_neurons <= ? RETURNING calls,reserved_neurons AS reservedNeurons").bind(accountId,day,neurons,CF_MAX_DAILY_CALLS,CF_MAX_DAILY_NEURONS).first<{calls:number;reservedNeurons:number}>();
  if(!row)throw new AppError("오늘의 앱 대화 한도에 도달했어요. 한국 시간 오전 9시에 다시 사용할 수 있어요. 단어장과 녹음 연습은 계속할 수 있어요.",429);
  await progressDb().prepare("DELETE FROM cloudflare_daily_usage WHERE account_id=? AND day < ?").bind(accountId,day).run();
  return {...row,maxCalls:CF_MAX_DAILY_CALLS,maxNeurons:CF_MAX_DAILY_NEURONS,resetsAt};
}
export async function providerFetch(url: string, init: RequestInit) {
  try {
    const response = await fetch(url,{...init,redirect:"error",signal:AbortSignal.timeout(30000)});
    if (response.status===401 || response.status===403) throw new AppError("서비스 인증에 실패했어요. AI 연결의 키와 리소스 설정을 확인해 주세요.",422);
    if (response.status===429) throw new AppError("AI 서비스의 사용량 또는 결제 한도에 도달했어요. 서비스 계정을 확인한 뒤 다시 시도해 주세요.",429);
    if (!response.ok) throw new AppError("AI 서비스에서 요청을 처리하지 못했어요. 연결 설정을 확인한 뒤 다시 시도해 주세요.",502);
    return response;
  } catch(error) {
    if (error instanceof AppError) throw error;
    throw new AppError("AI 서비스에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.",504);
  }
}

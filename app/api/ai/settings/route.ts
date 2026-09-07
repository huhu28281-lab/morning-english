import { AppError, authenticatedUser, errorResponse, json, readJson } from "@/app/api-utils";
import { azureEndpoint, encryptionReady, saveConnection, cloudflareUsage } from "@/app/ai-server";
import { cfAccountId, parseCloudflareConfiguration } from "@/app/cloudflare-policy";
import { progressDb } from "@/db/progress";
import { env } from "cloudflare:workers";
import { workersAiState, SHARED_AI_BUDGET } from "@/app/workers-ai";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const userId = await authenticatedUser();
    const result = await progressDb().prepare("SELECT provider,endpoint FROM ai_connections WHERE user_id=?").bind(userId).all<{provider:string;endpoint:string}>();
    const cf=parseCloudflareConfiguration(result.results.find(r=>r.provider==="cloudflare")?.endpoint);
    if(userId.startsWith("visitor:")) {
      const state=workersAiState(env);
      return json({managedCloudflare:true,cloudflareState:state,openai:false,cloudflare:state==="ready",accountId:"",freePlanConfirmed:state==="ready",usage:state==="ready"?await cloudflareUsage(SHARED_AI_BUDGET):null,azure:result.results.some(r=>r.provider==="azure"),endpoint:result.results.find(r=>r.provider==="azure")?.endpoint||"",ready:encryptionReady()});
    }
    return json({openai:result.results.some(r=>r.provider==="openai"),cloudflare:!!cf,accountId:cf?.accountId||"",freePlanConfirmed:!!cf,usage:cf?await cloudflareUsage(cf.accountId):null,azure:result.results.some(r=>r.provider==="azure"),endpoint:result.results.find(r=>r.provider==="azure")?.endpoint || "",ready:encryptionReady()});
  } catch(error) { return errorResponse(error); }
}
export async function POST(request: Request) {
  try {
    const userId = await authenticatedUser(request);
    const input = await readJson(request,5000);
    if (input.provider!=="cloudflare" && input.provider!=="azure") throw new AppError("연결할 서비스를 선택해 주세요.");
    if (userId.startsWith("visitor:") && input.provider==="cloudflare") throw new AppError("영어 대화는 앱에서 공통으로 연결합니다. 개인 토큰을 입력할 필요가 없어요.",409);
    if (typeof input.key!=="string" || input.key.trim().length<20 || input.key.length>1000 || /\s/.test(input.key.trim())) throw new AppError("API 키를 확인해 주세요.");
    if(input.provider==="cloudflare" && (!cfAccountId(input.accountId) || input.freePlanConfirmed!==true))throw new AppError("32자리 Cloudflare 계정 ID를 입력하고 Workers Free 요금제 확인에 체크해 주세요.");
    const endpoint = input.provider==="azure" ? azureEndpoint(input.endpoint) : JSON.stringify({accountId:cfAccountId(input.accountId),freePlanConfirmed:true});
    await saveConnection(userId,input.provider,input.key.trim(),endpoint);
    return json({saved:true});
  } catch(error) { return errorResponse(error); }
}
export async function DELETE(request: Request) {
  try {
    const userId = await authenticatedUser(request);
    const input = await readJson(request,1000);
    if (input.provider!=="openai" && input.provider!=="azure" && input.provider!=="cloudflare") throw new AppError("연결할 서비스를 선택해 주세요.");
    await progressDb().prepare("DELETE FROM ai_connections WHERE user_id=? AND provider=?").bind(userId,input.provider).run();
    return json({removed:true});
  } catch(error) { return errorResponse(error); }
}

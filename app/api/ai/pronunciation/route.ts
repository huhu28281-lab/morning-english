import { AppError, authenticatedUser, errorResponse, json, readBytes } from "@/app/api-utils";
import { getConnection, providerFetch, reserveUsage } from "@/app/ai-server";
import { parseAssessment } from "@/app/assessment-result";
import { wavDuration } from "@/app/audio-wav";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    const userId = await authenticatedUser(request);
    const reference = new URL(request.url).searchParams.get("reference")?.trim() || "";
    if (!reference || reference.length>300 || reference.split(/\s+/).length>35 || !/[a-z]/i.test(reference)) throw new AppError("연습할 영어를 35단어 이내로 입력해 주세요.");
    if (!request.headers.get("content-type")?.startsWith("audio/wav")) throw new AppError("녹음 형식을 확인할 수 없어요. 다시 녹음해 주세요.");
    const connection=await getConnection(userId,"azure");
    const bytes=await readBytes(request,704044);
    try { wavDuration(bytes); } catch { throw new AppError("한 문장을 1~20초 정도로 다시 녹음해 주세요."); }
    await reserveUsage(userId,"azure");
    const parameters = {ReferenceText:reference,GradingSystem:"HundredMark",Granularity:"Word",Dimension:"Comprehensive",EnableMiscue:"True"};
    const assessmentHeader = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(parameters))));
    const response=await providerFetch(`${connection.endpoint}/stt/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`,{method:"POST",headers:{"Ocp-Apim-Subscription-Key":connection.key,"Content-Type":"audio/wav; codecs=audio/pcm; samplerate=16000","Accept":"application/json","Pronunciation-Assessment":assessmentHeader},body:bytes.buffer});
    let result;
    try { result = parseAssessment(await response.json()); }
    catch(error) { throw new AppError(error instanceof Error && !(error instanceof SyntaxError) ? error.message : "발음 평가 결과를 받지 못했어요. 다시 시도해 주세요.",422); }
    return json({assessment:result});
  } catch(error) { return errorResponse(error); }
}

export type TutorReply = {reply:string;translation:string;correction:string;feedback:string};
export function validateTutorReply(result:unknown):TutorReply {
  if(!result || typeof result!=="object" || Array.isArray(result))throw new Error("Invalid tutor reply");
  const r=result as Record<string,unknown>;
  if(["reply","translation","correction","feedback"].some(k=>typeof r[k]!=="string" || (r[k] as string).length>3000) || !(r.reply as string).trim() || !(r.translation as string).trim())throw new Error("Invalid tutor reply");
  return {reply:r.reply as string,translation:r.translation as string,correction:r.correction as string,feedback:r.feedback as string};
}
export function parseCloudflareResponse(body:unknown):TutorReply {
  if(!body || typeof body!=="object")throw new Error("Invalid Cloudflare response");
  const data=body as {success?:boolean;errors?:unknown[];result?:{response?:unknown}};
  if(data.success!==true || (Array.isArray(data.errors) && data.errors.length) || !data.result)throw new Error("Cloudflare request failed");
  const result=data.result.response;
  return validateTutorReply(typeof result==="string"?JSON.parse(result):result);
}
export function parseTutorResponse(body: unknown): TutorReply {
  if (!body || typeof body!=="object") throw new Error("Invalid response");
  const data = body as {status?:string;output?:{type?:string;content?:{type?:string;text?:string}[]}[]};
  if (data.status!=="completed" || !Array.isArray(data.output)) throw new Error("Incomplete response");
  const content = data.output.filter(o=>o.type==="message").flatMap(o=>o.content||[]);
  if (content.some(c=>c.type==="refusal")) throw new Error("Refused response");
  const result = JSON.parse(content.filter(c=>c.type==="output_text").map(c=>c.text||"").join(""));
  return validateTutorReply(result);
}

// Conservative app budget, not Cloudflare's live account balance.
// Model prices checked against Cloudflare's published table on 2026-09-07.
export const CF_MODEL="@cf/meta/llama-3.3-70b-instruct-fp8-fast";
export const CF_MAX_OUTPUT_TOKENS=600;
export const CF_MAX_REQUEST_BYTES=6000;
export const CF_MAX_DAILY_CALLS=50;
export const CF_MAX_DAILY_NEURONS=8000;
export const cfAccountId=(value:unknown)=>typeof value==="string" && /^[a-f0-9]{32}$/i.test(value.trim()) ? value.trim().toLowerCase() : null;
export function parseCloudflareConfiguration(value:unknown) {
  try {
    const data=typeof value==="string"?JSON.parse(value):value;
    const accountId=cfAccountId(data?.accountId);
    if(!accountId || data?.freePlanConfirmed!==true)return null;
    return {accountId,freePlanConfirmed:true as const};
  }catch{return null;}
}
export function cloudflareReservedNeurons(body:unknown) {
  const bytes=new TextEncoder().encode(JSON.stringify(body)).byteLength;
  if(bytes>CF_MAX_REQUEST_BYTES)throw new Error("Cloudflare request too large");
  // UTF-8 byte count bounds ordinary BPE tokens; allow extra template/schema
  // overhead and reserve all output tokens. Never refund uncertain usage.
  return Math.ceil((bytes+2048)*26668/1000000+CF_MAX_OUTPUT_TOKENS*204805/1000000);
}
export function cloudflareDay(now=new Date()) {
  const day=now.toISOString().slice(0,10);
  return {day,resetsAt:new Date(Date.parse(`${day}T00:00:00Z`)+86400000).toISOString()};
}
export function fitCloudflareMessages<T extends {role:string;content:string}>(messages:T[],build:(messages:T[])=>unknown) {
  const selected=messages.slice(-9);
  while(selected.length>1 && (selected[0].role!=="user" || new TextEncoder().encode(JSON.stringify(build(selected))).byteLength>CF_MAX_REQUEST_BYTES))selected.shift();
  const body=build(selected);
  return {body,reservedNeurons:cloudflareReservedNeurons(body)};
}

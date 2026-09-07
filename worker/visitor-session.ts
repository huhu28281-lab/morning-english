// The cookie is a 256-bit bearer secret; D1 stores only its hash as the visitor key.
// This is browser continuity, not a shared account or an identity claim.
const COOKIE = "__Host-morning-visitor";
const hex = (bytes: Uint8Array) => Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");

function readToken(request: Request) {
  const matches = (request.headers.get("cookie") || "").split(";")
    .map(part => part.trim()).filter(part => part.startsWith(`${COOKIE}=`));
  if (matches.length !== 1) return null;
  const value = matches[0].slice(COOKIE.length + 1);
  return /^[a-f0-9]{64}$/.test(value) ? value : null;
}

export async function withVisitorSession(request: Request, handle: (request: Request) => Promise<Response>): Promise<Response> {
  const url = new URL(request.url);
  const changesData = !["GET", "HEAD", "OPTIONS"].includes(request.method);
  const origin = request.headers.get("origin");
  if (changesData && (request.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== url.origin))) {
    return Response.json({error:"앱 안에서 다시 시도해 주세요."}, {status:403,headers:{"Cache-Control":"private, no-store"}});
  }

  const existing = readToken(request);
  const token = existing || hex(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  const headers = new Headers(request.headers);
  // Public requests must never supply the identity used by the application's SQL.
  for (const name of [...headers.keys()]) {
    if (name.startsWith("oai-authenticated-")) headers.delete(name);
  }
  headers.delete("cf-access-jwt-assertion");
  headers.set("oai-authenticated-user-id", `visitor:${hex(new Uint8Array(digest))}`);
  headers.set("oai-authenticated-session-kind", "browser");
  const visitorRequest = new Request(request, {headers});

  // Establish the cookie before accepting writes so browser-blocked cookies do
  // not silently save a record under a new, unreachable visitor each time.
  const result = changesData && !existing
    ? Response.json({error:"기록을 저장하려면 이 사이트의 쿠키를 허용한 뒤 새로고침해 주세요."}, {status:409})
    : await handle(visitorRequest);
  const response = new Response(result.body, result);
  response.headers.set("Cache-Control", "private, no-store");
  if (!existing) {
    response.headers.append("Set-Cookie", `${COOKIE}=${token}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`);
  }
  return response;
}

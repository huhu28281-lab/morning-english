import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

export type AccessConfig = {
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
  CF_OWNER_EMAIL?: string;
};
const keysets = new Map<string, JWTVerifyGetKey>();

export async function verifyAccessToken(token: string, config: AccessConfig, testKeys?: JWTVerifyGetKey) {
  const domain = config.CF_ACCESS_TEAM_DOMAIN || "";
  const audience = config.CF_ACCESS_AUD || "";
  const owner = (config.CF_OWNER_EMAIL || "").trim().toLowerCase();
  if (!/^https:\/\/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.cloudflareaccess\.com$/.test(domain) || !audience || !owner) throw new Error("Access configuration missing");
  if (!token || token.length > 16384) throw new Error("Access token missing");
  let keys = testKeys || keysets.get(domain);
  if (!keys) {
    keys = createRemoteJWKSet(new URL(`${domain}/cdn-cgi/access/certs`), {timeoutDuration:5000, cacheMaxAge:600000});
    // Only operator-controlled origins are accepted; keep the isolate cache bounded.
    if (keysets.size >= 2) keysets.clear();
    keysets.set(domain, keys);
  }
  const {payload} = await jwtVerify(token, keys, {issuer:domain, audience, algorithms:["RS256"], requiredClaims:["exp","iat","sub","email"]});
  if (typeof payload.email !== "string" || payload.email.toLowerCase() !== owner || typeof payload.sub !== "string" || !payload.sub) throw new Error("Owner access required");
  return {id:`cf:${payload.sub}`, email:payload.email};
}

export function trustedRequest(request: Request, user: {id:string;email:string}) {
  const headers = new Headers(request.headers);
  for (const name of [...headers.keys()]) {
    if (name.startsWith("oai-authenticated-")) headers.delete(name);
  }
  headers.set("oai-authenticated-user-id", user.id);
  headers.set("oai-authenticated-user-email", user.email);
  return new Request(request, {headers});
}

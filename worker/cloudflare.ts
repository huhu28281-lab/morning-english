// Standalone entry point. The existing Sites entry point remains separate.
import app from "./index";
import { trustedRequest, verifyAccessToken, type AccessConfig } from "./cloudflare-access";

type Env = Parameters<typeof app.fetch>[1] & AccessConfig;
type Context = Parameters<typeof app.fetch>[2];
export default {
  async fetch(request: Request, env: Env, ctx: Context): Promise<Response> {
    if (!env.CF_ACCESS_TEAM_DOMAIN || !env.CF_ACCESS_AUD || !env.CF_OWNER_EMAIL) {
      return new Response("본인 전용 로그인 설정을 완료해야 앱을 사용할 수 있어요.", {status:503,headers:{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store"}});
    }
    let user;
    try { user = await verifyAccessToken(request.headers.get("Cf-Access-Jwt-Assertion") || "", env); }
    catch { return new Response("Cloudflare Access에서 본인 계정으로 로그인해 주세요.", {status:403,headers:{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store"}}); }
    const authenticated = trustedRequest(request, user);
    // Static files also pass through Access; do not serve an SPA fallback for APIs.
    const path = new URL(request.url).pathname;
    if ((request.method === "GET" || request.method === "HEAD") && !path.startsWith("/api/")) {
      const asset = await env.ASSETS.fetch(authenticated);
      if (asset.status !== 404) return asset;
    }
    return app.fetch(authenticated, env, ctx);
  },
};

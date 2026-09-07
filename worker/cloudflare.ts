// Public Cloudflare entry point. Records are scoped to an anonymous browser session.
import app from "./index";
import { withVisitorSession } from "./visitor-session";

type Env = Parameters<typeof app.fetch>[1];
type Context = Parameters<typeof app.fetch>[2];
const initialSchema = [
  "CREATE TABLE IF NOT EXISTS `study_progress` (\n\t`user_id` text NOT NULL,\n\t`lesson_id` integer NOT NULL,\n\t`stage_id` integer NOT NULL,\n\t`completed_at` text NOT NULL,\n\tPRIMARY KEY(`user_id`, `lesson_id`, `stage_id`)\n)",
  "CREATE TABLE IF NOT EXISTS `ai_connections` (\n\t`user_id` text NOT NULL,\n\t`provider` text NOT NULL,\n\t`encrypted_secret` text NOT NULL,\n\t`endpoint` text DEFAULT '' NOT NULL,\n\t`updated_at` text NOT NULL,\n\tPRIMARY KEY(`user_id`, `provider`)\n)",
  "CREATE TABLE IF NOT EXISTS `ai_usage` (\n\t`user_id` text NOT NULL,\n\t`provider` text NOT NULL,\n\t`window` text NOT NULL,\n\t`count` integer DEFAULT 0 NOT NULL,\n\tPRIMARY KEY(`user_id`, `provider`, `window`)\n)",
  "CREATE TABLE IF NOT EXISTS `vocabulary` (\n\t`user_id` text NOT NULL,\n\t`word_key` text NOT NULL,\n\t`english` text NOT NULL,\n\t`meaning` text NOT NULL,\n\t`example` text NOT NULL,\n\t`example_ko` text NOT NULL,\n\t`known` integer DEFAULT 0 NOT NULL,\n\t`saved` integer DEFAULT 1 NOT NULL,\n\t`updated_at` text NOT NULL,\n\tPRIMARY KEY(`user_id`, `word_key`)\n)",
  "CREATE TABLE IF NOT EXISTS `cloudflare_daily_usage` (\n\t`account_id` text NOT NULL,\n\t`day` text NOT NULL,\n\t`calls` integer DEFAULT 0 NOT NULL,\n\t`reserved_neurons` integer DEFAULT 0 NOT NULL,\n\tPRIMARY KEY(`account_id`, `day`)\n)"
];
const initialized = new WeakMap<D1Database, Promise<void>>();
async function ensureDatabase(db: D1Database) {
  let pending = initialized.get(db);
  if (!pending) {
    pending = db.batch(initialSchema.map(sql => db.prepare(sql))).then(() => {});
    initialized.set(db, pending);
    pending.catch(() => { initialized.delete(db); });
  }
  await pending;
}


export default {
  fetch(request: Request, env: Env, ctx: Context): Promise<Response> {
    return withVisitorSession(request, async visitorRequest => {
      const path = new URL(request.url).pathname;
      if ((request.method === "GET" || request.method === "HEAD") && !path.startsWith("/api/")) {
        const asset = await env.ASSETS.fetch(visitorRequest);
        if (asset.status !== 404) return asset;
      }
      if (path.startsWith("/api/")) {
        try { await ensureDatabase(env.DB); }
        catch {
          return Response.json({error:"저장소에 연결하지 못했어요. 잠시 후 다시 시도해 주세요."}, {status:503,headers:{"Cache-Control":"no-store"}});
        }
      }
      return app.fetch(visitorRequest, env, ctx);
    });
  },
};

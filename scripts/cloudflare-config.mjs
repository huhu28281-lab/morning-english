import { writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const required = name => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} 설정이 필요합니다.`);
  return value;
};
const databaseId = required("CF_D1_DATABASE_ID");
if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(databaseId) || databaseId.startsWith("00000000")) throw new Error("실제 D1 데이터베이스 ID를 설정하세요.");
const config = {
  name:"morning-english", main:"./worker/cloudflare.ts", compatibility_date:"2026-05-15",
  compatibility_flags:["nodejs_compat"], workers_dev:true, preview_urls:false,
  assets:{binding:"ASSETS", run_worker_first:true},
  ai:{binding:"AI"},
  // The operator manages AI activation in the dashboard's Runtime variables.
  // Preserve that setting on future code deployments instead of resetting it.
  keep_vars:true,
  // 05:00 Korea time daily: prepare next week's pack, at most once per level/day.
  // Published packs switch on Monday 00:00 KST without waiting for a request to AI.
  triggers:{crons:["0 20 * * *"]},
  d1_databases:[{binding:"DB",database_name:"morning-english-db",database_id:databaseId,migrations_dir:"drizzle"}],
  observability:{enabled:true},
};
writeFileSync(".cloudflare-deploy.json", JSON.stringify(config,null,2)+"\n", {mode:0o600});
if (process.argv.includes("--build")) {
  const result=spawnSync(process.platform === "win32" ? "npm.cmd" : "npm",["run","build"],{env:{...process.env,DEPLOY_TARGET:"cloudflare"},stdio:"inherit"});
  if(result.status!==0)process.exit(result.status ?? 1);
  // Workers Builds must migrate before publishing even when the dashboard's
  // existing deploy command only invokes wrangler deploy. Local builds stay local.
  if(process.env.WORKERS_CI==="1") {
    const migrated=spawnSync(process.execPath,["node_modules/wrangler/bin/wrangler.js","d1","migrations","apply","DB","--remote","--config",".cloudflare-deploy.json"],{env:process.env,stdio:"inherit"});
    if(migrated.status!==0)process.exit(migrated.status ?? 1);
  }
  process.exit(0);
}

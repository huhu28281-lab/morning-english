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
  d1_databases:[{binding:"DB",database_name:"morning-english-db",database_id:databaseId,migrations_dir:"drizzle"}],
  observability:{enabled:true},
};
writeFileSync(".cloudflare-deploy.json", JSON.stringify(config,null,2)+"\n", {mode:0o600});
if (process.argv.includes("--build")) {
  const result=spawnSync(process.platform === "win32" ? "npm.cmd" : "npm",["run","build"],{env:{...process.env,DEPLOY_TARGET:"cloudflare"},stdio:"inherit"});
  process.exit(result.status ?? 1);
}

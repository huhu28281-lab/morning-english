import { writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const required = name => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} 설정이 필요합니다.`);
  return value;
};
const databaseId = required("CF_D1_DATABASE_ID");
const teamDomain = required("CF_ACCESS_TEAM_DOMAIN");
const audience = required("CF_ACCESS_AUD");
const owner = required("CF_OWNER_EMAIL");
if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(databaseId) || databaseId.startsWith("00000000")) throw new Error("실제 D1 데이터베이스 ID를 설정하세요.");
if (!/^https:\/\/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.cloudflareaccess\.com$/.test(teamDomain)) throw new Error("Access 팀 도메인 형식을 확인하세요.");
if (!/^[a-f0-9]{64}$/i.test(audience)) throw new Error("Access 애플리케이션 AUD를 확인하세요.");
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(owner)) throw new Error("본인의 로그인 이메일을 설정하세요.");
const config = {
  name:"morning-english", main:"./worker/cloudflare.ts", compatibility_date:"2026-05-15",
  compatibility_flags:["nodejs_compat"], workers_dev:true, preview_urls:false,
  assets:{binding:"ASSETS", run_worker_first:true},
  d1_databases:[{binding:"DB",database_name:"morning-english-db",database_id:databaseId,migrations_dir:"drizzle"}],
  vars:{CF_ACCESS_TEAM_DOMAIN:teamDomain,CF_ACCESS_AUD:audience,CF_OWNER_EMAIL:owner},
  observability:{enabled:true},
};
writeFileSync(".cloudflare-deploy.json", JSON.stringify(config,null,2)+"\n", {mode:0o600});
if (process.argv.includes("--build")) {
  const result=spawnSync(process.platform === "win32" ? "npm.cmd" : "npm",["run","build"],{env:{...process.env,DEPLOY_TARGET:"cloudflare"},stdio:"inherit"});
  process.exit(result.status ?? 1);
}

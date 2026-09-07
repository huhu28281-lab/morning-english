import { spawnSync } from "node:child_process";
const key = process.env.APP_ENCRYPTION_KEY;
if (!key || Buffer.from(key,"base64").length !== 32) throw new Error("APP_ENCRYPTION_KEY는 최초 1회 생성해 보관한 32바이트 Base64 키여야 합니다.");
const result = spawnSync(process.execPath,["node_modules/wrangler/bin/wrangler.js","secret","bulk","--config","dist/server/wrangler.json"],{
  input:JSON.stringify({APP_ENCRYPTION_KEY:key}), stdio:["pipe","inherit","inherit"], env:process.env,
});
process.exit(result.status ?? 1);

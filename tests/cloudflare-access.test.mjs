import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPair, exportJWK, SignJWT, createLocalJWKSet } from "jose";
import { verifyAccessToken, trustedRequest } from "../worker/cloudflare-access.ts";

const config = {CF_ACCESS_TEAM_DOMAIN:"https://test-team.cloudflareaccess.com",CF_ACCESS_AUD:"test-audience",CF_OWNER_EMAIL:"owner@example.test"};
const {publicKey,privateKey} = await generateKeyPair("RS256");
const keys = createLocalJWKSet({keys:[{...await exportJWK(publicKey),kid:"test",alg:"RS256",use:"sig"}]});
const token = (overrides={}) => new SignJWT({email:config.CF_OWNER_EMAIL,...overrides})
  .setProtectedHeader({alg:"RS256",kid:"test"}).setIssuer(config.CF_ACCESS_TEAM_DOMAIN)
  .setAudience(config.CF_ACCESS_AUD).setSubject("owner-id").setIssuedAt().setExpirationTime("5m").sign(privateKey);

test("Accept a valid owner token and replace spoofed platform identity",async()=>{
  const user=await verifyAccessToken(await token(),config,keys);
  assert.equal(user.id,"cf:owner-id");
  const incoming=new Request("https://app.example.test/api/progress",{method:"POST",body:"{}",headers:{"oai-authenticated-user-id":"attacker","oai-authenticated-user-email":"attacker@example.test","oai-authenticated-user-full-name":"Spoof","Origin":"https://app.example.test"}});
  const verified=trustedRequest(incoming,user);
  assert.equal(verified.headers.get("oai-authenticated-user-id"),"cf:owner-id");
  assert.equal(verified.headers.get("oai-authenticated-user-full-name"),null);
  assert.equal(verified.headers.get("origin"),"https://app.example.test");
  assert.equal(await verified.text(),"{}");
});
test("Reject another user, another application, tampering, and incomplete configuration",async()=>{
  await assert.rejects(()=>verifyAccessToken("",config,keys));
  await assert.rejects(async()=>verifyAccessToken(await token({email:"other@example.test"}),config,keys));
  await assert.rejects(async()=>verifyAccessToken(await token(),{...config,CF_ACCESS_AUD:"wrong-app"},keys));
  await assert.rejects(async()=>verifyAccessToken(await token(),{...config,CF_OWNER_EMAIL:""},keys));
  await assert.rejects(async()=>verifyAccessToken(await token(),{...config,CF_ACCESS_TEAM_DOMAIN:"https://attacker.example.test"},keys));
  const good=await token();const parts=good.split(".");
  parts[1]=Buffer.from(JSON.stringify({email:config.CF_OWNER_EMAIL,sub:"attacker"})).toString("base64url");
  await assert.rejects(()=>verifyAccessToken(parts.join("."),config,keys));
});
test("Reject expired tokens and unsupported algorithms",async()=>{
  const expired=await new SignJWT({email:config.CF_OWNER_EMAIL}).setProtectedHeader({alg:"RS256",kid:"test"}).setIssuer(config.CF_ACCESS_TEAM_DOMAIN).setAudience(config.CF_ACCESS_AUD).setSubject("owner").setIssuedAt(1).setExpirationTime(2).sign(privateKey);
  await assert.rejects(()=>verifyAccessToken(expired,config,keys));
  const unsigned=Buffer.from(JSON.stringify({alg:"none"})).toString("base64url")+"."+Buffer.from(JSON.stringify({email:config.CF_OWNER_EMAIL})).toString("base64url")+".";
  await assert.rejects(()=>verifyAccessToken(unsigned,config,keys));
});

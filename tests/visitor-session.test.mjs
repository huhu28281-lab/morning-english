import test from "node:test";
import assert from "node:assert/strict";
import { withVisitorSession } from "../worker/visitor-session.ts";

const origin = "https://app.example.test";
const cookie = response => response.headers.get("set-cookie").split(";")[0];
const identity = request => request.headers.get("oai-authenticated-user-id");

test("Open without login, resume the same browser, and isolate two visitors", async () => {
  const saved = new Map();
  const handle = async request => {
    const id = identity(request);
    if (request.method === "POST") saved.set(id, await request.json());
    return Response.json({record:saved.get(id) ?? null, id});
  };
  const open = () => withVisitorSession(new Request(origin), handle);
  const first = await open(), second = await open();
  assert.equal(first.status, 200);
  assert.equal(first.headers.get("location"), null);
  const firstCookie = cookie(first), secondCookie = cookie(second);
  for (const flag of ["HttpOnly", "Secure", "SameSite=Lax", "Path=/"]) assert.ok(first.headers.get("set-cookie").includes(flag));
  const a = await first.json(), b = await second.json();
  assert.notEqual(a.id, b.id);
  assert.ok(!a.id.includes(firstCookie.split("=")[1]));
  await withVisitorSession(new Request(origin+"/api/progress", {method:"POST",headers:{cookie:firstCookie,origin,"content-type":"application/json"},body:JSON.stringify({lesson:11,stage:0})}), handle);
  const read = session => withVisitorSession(new Request(origin+"/api/progress", {headers:{cookie:session}}),handle);
  const resumed = await read(firstCookie);
  assert.deepEqual((await resumed.json()).record, {lesson:11,stage:0});
  assert.equal((await (await read(secondCookie)).json()).record, null);
  assert.equal(resumed.headers.get("cache-control"), "private, no-store");
});

test("Ignore forged account headers and preserve request body for the visitor", async () => {
  const open = await withVisitorSession(new Request(origin), async () => new Response("OK"));
  const session = cookie(open);
  const response = await withVisitorSession(new Request(origin+"/api/ai/settings", {method:"POST",headers:{cookie:session,origin,"oai-authenticated-user-id":"cf:owner-id","oai-authenticated-user-email":"owner@example.test","oai-authenticated-user-full-name":"Owner","cf-access-jwt-assertion":"old-token"},body:"example body"}), async request => {
    assert.match(identity(request), /^visitor:[a-f0-9]{64}$/);
    assert.equal(request.headers.get("oai-authenticated-user-email"), null);
    assert.equal(request.headers.get("oai-authenticated-user-full-name"), null);
    assert.equal(request.headers.get("cf-access-jwt-assertion"), null);
    assert.equal(await request.text(), "example body");
    return new Response("OK");
  });
  assert.equal(response.status, 200);
});

test("Block cross-origin writes and do not save when the session cookie is missing", async () => {
  let calls = 0;
  const handle = async () => { calls++;return new Response("OK"); };
  for (const headers of [{origin:"https://other.example.test"},{"sec-fetch-site":"cross-site"}]) {
    const r=await withVisitorSession(new Request(origin+"/api/progress",{method:"POST",headers,body:"{}"}),handle);
    assert.equal(r.status,403);
  }
  for (const rawCookie of ["", "__Host-morning-visitor=cf:owner-id", "__Host-morning-visitor="+"a".repeat(64)+"; __Host-morning-visitor="+"b".repeat(64)]) {
    const r=await withVisitorSession(new Request(origin+"/api/progress",{method:"POST",headers:{origin,cookie:rawCookie},body:"{}"}),handle);
    assert.equal(r.status,409);
    assert.ok(r.headers.get("set-cookie"));
  }
  assert.equal(calls,0);
});

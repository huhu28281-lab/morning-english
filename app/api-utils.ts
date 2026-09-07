import { headers } from "next/headers";

export class AppError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export async function authenticatedUser(request?: Request) {
  const userId = (await headers()).get("oai-authenticated-user-id");
  if (!userId) throw new AppError("다시 로그인한 뒤 이용해 주세요.", 401);
  if (request && request.method !== "GET") {
    if (request.headers.get("sec-fetch-site") === "cross-site") throw new AppError("앱 안에서 다시 시도해 주세요.", 403);
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) throw new AppError("앱 안에서 다시 시도해 주세요.", 403);
  }
  return userId;
}
export const json = (data: unknown, status = 200) => Response.json(data, {status, headers:{"Cache-Control":"private, no-store"}});
export function errorResponse(error: unknown) {
  // Never log provider bodies, credentials, audio, or learner messages.
  return error instanceof AppError ? json({error:error.message},error.status) : json({error:"요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요."},503);
}
export async function readJson(request: Request, maxBytes = 16000): Promise<Record<string, unknown>> {
  const body = await readBytes(request, maxBytes);
  try {
    const value = JSON.parse(new TextDecoder().decode(body));
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value;
  } catch { throw new AppError("입력 내용을 확인해 주세요."); }
}
export async function readBytes(request: Request, maxBytes: number): Promise<Uint8Array<ArrayBuffer>> {
  const length = Number(request.headers.get("content-length"));
  if (length > maxBytes) throw new AppError("입력 내용이 너무 길어요.",413);
  const reader = request.body?.getReader();
  if (!reader) throw new AppError("입력 내용이 없어요.");
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new AppError("입력 내용이 너무 길어요.",413); }
      chunks.push(next.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset=0;
  for (const chunk of chunks) { bytes.set(chunk,offset); offset+=chunk.byteLength; }
  return bytes;
}

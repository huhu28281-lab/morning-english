import { headers } from "next/headers";
import { progressDb } from "@/db/progress";
export const dynamic = "force-dynamic";

export async function GET() {
  const userId = (await headers()).get("oai-authenticated-user-id");
  if (!userId) return Response.json({ error: "앱을 새로고침한 뒤 다시 시도해 주세요." }, { status: 401 });
  try {
    const result = await progressDb().prepare("SELECT lesson_id AS lessonId, stage_id AS stageId, completed_at AS completedAt FROM study_progress WHERE user_id = ? ORDER BY completed_at DESC").bind(userId).all();
    return Response.json({ progress: result.results, browserScoped: userId.startsWith("visitor:") }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Progress load failed", error);
    return Response.json({ error: "학습 기록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요." }, { status: 503 });
  }
}
export async function POST(request: Request) {
  const userId = (await headers()).get("oai-authenticated-user-id");
  if (!userId) return Response.json({ error: "앱을 새로고침한 뒤 다시 시도해 주세요." }, { status: 401 });
  if (request.headers.get("sec-fetch-site") === "cross-site") return Response.json({error:"요청을 확인할 수 없어요."},{status:403});
  let input: { lessonId?: number; stageId?: number };
  try { input = await request.json(); } catch { return Response.json({error:"학습 정보를 확인해 주세요."},{status:400}); }
  if (!input || !Number.isInteger(input.lessonId) || !Number.isInteger(input.stageId) || input.lessonId! < 1 || input.lessonId! > 20 || input.stageId! < 0 || input.stageId! > 5) return Response.json({error:"올바른 수업을 선택해 주세요."},{status:400});
  try {
    const completedAt = new Date().toISOString();
    await progressDb().prepare("INSERT INTO study_progress (user_id, lesson_id, stage_id, completed_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, lesson_id, stage_id) DO NOTHING").bind(userId, input.lessonId, input.stageId, completedAt).run();
    const row = await progressDb().prepare("SELECT lesson_id AS lessonId, stage_id AS stageId, completed_at AS completedAt FROM study_progress WHERE user_id = ? AND lesson_id = ? AND stage_id = ?").bind(userId, input.lessonId, input.stageId).first();
    return Response.json({ progress: row }, {headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    console.error("Progress save failed", error);
    return Response.json({error:"완료 기록을 저장하지 못했어요. 이 화면에서 다시 저장해 주세요."},{status:503});
  }
}

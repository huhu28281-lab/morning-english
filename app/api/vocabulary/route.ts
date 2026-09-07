import { progressDb } from "@/db/progress";
import { AppError, authenticatedUser, errorResponse, json, readJson } from "@/app/api-utils";
import { wordKey } from "@/app/vocabulary-data";
export const dynamic = "force-dynamic";
const columns = "english, meaning, example, example_ko AS exampleKo, known, saved";
export async function GET() {
  try {
    const userId = await authenticatedUser();
    const result = await progressDb().prepare(`SELECT ${columns} FROM vocabulary WHERE user_id = ? ORDER BY updated_at DESC`).bind(userId).all<{english:string;meaning:string;example:string;exampleKo:string;known:number;saved:number}>();
    return json({words:result.results.map(row=>({...row,known:!!row.known,saved:!!row.saved}))});
  } catch(error) { return errorResponse(error); }
}
export async function POST(request: Request) {
  try {
    const userId = await authenticatedUser(request);
    const input = await readJson(request);
    for (const [key,max] of [["english",700],["meaning",700],["example",700],["exampleKo",700]] as const) {
      if (typeof input[key] !== "string" || (input[key] as string).length>max) throw new AppError("영어와 뜻을 700자 이내로 입력해 주세요.");
    }
    const english = (input.english as string).trim(), meaning = (input.meaning as string).trim();
    if (!english || !meaning || typeof input.known!=="boolean" || typeof input.saved!=="boolean") throw new AppError("영어 표현과 뜻을 입력해 주세요.");
    const word = {english,meaning,example:(input.example as string).trim(),exampleKo:(input.exampleKo as string).trim(),known:input.known,saved:input.saved};
    await progressDb().prepare("INSERT INTO vocabulary (user_id,word_key,english,meaning,example,example_ko,known,saved,updated_at) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id,word_key) DO UPDATE SET english=excluded.english,meaning=excluded.meaning,example=excluded.example,example_ko=excluded.example_ko,known=excluded.known,saved=excluded.saved,updated_at=excluded.updated_at").bind(userId,wordKey(english),english,meaning,word.example,word.exampleKo,Number(word.known),Number(word.saved),new Date().toISOString()).run();
    return json({word});
  } catch(error) { return errorResponse(error); }
}

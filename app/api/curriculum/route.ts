import { authenticatedUser, errorResponse, json } from "@/app/api-utils";
import { progressDb } from "@/db/progress";
import { currentPack, archivedLessons } from "@/app/weekly-store";
export const dynamic="force-dynamic";
export async function GET() {
  try {
    const userId=await authenticatedUser(),db=progressDb(),now=new Date();
    const [work,basics,archiveLessons]=await Promise.all([currentPack(db,"work",now),currentPack(db,"basics",now),archivedLessons(db,userId)]);
    return json({work,basics,archiveLessons});
  }catch(error){return errorResponse(error);}
}

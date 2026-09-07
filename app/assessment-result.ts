export type Assessment = { transcript:string; accuracy:number; fluency:number|null; completeness:number|null; pronunciation:number|null; words:{word:string;accuracy:number|null;error:string}[] };
type Obj = Record<string,unknown>;
const obj=(v:unknown):Obj=>v && typeof v==="object" && !Array.isArray(v) ? v as Obj : {};
const score=(v:unknown):number|null=>typeof v==="number" && Number.isFinite(v) && v>=0 && v<=100 ? v : null;
export function parseAssessment(value: unknown): Assessment {
  const data=obj(value);
  if (data.RecognitionStatus!=="Success") throw new Error("말소리를 충분히 확인하지 못했어요. 조용한 곳에서 다시 녹음해 주세요.");
  const best=obj(Array.isArray(data.NBest) ? data.NBest[0] : null);
  const scores={...best,...obj(best.PronunciationAssessment)};
  const accuracy=score(scores.AccuracyScore);
  // ASR confidence is not a pronunciation score. Reject ordinary transcription responses.
  if (accuracy===null) throw new Error("발음 점수가 응답에 없어요. Azure Speech의 발음 평가 연결을 확인해 주세요.");
  return {
    transcript:typeof best.Display==="string" ? best.Display : typeof data.DisplayText==="string" ? data.DisplayText : "",
    accuracy,fluency:score(scores.FluencyScore),completeness:score(scores.CompletenessScore),pronunciation:score(scores.PronScore),
    words:(Array.isArray(best.Words)?best.Words:[]).map(item=>{const word=obj(item),p={...word,...obj(word.PronunciationAssessment)};return {word:typeof word.Word==="string"?word.Word:"",accuracy:score(p.AccuracyScore),error:typeof p.ErrorType==="string"?p.ErrorType:"Unknown"};}).filter(w=>w.word),
  };
}

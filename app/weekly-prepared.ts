import type { Phrase } from "./lessons";
import { studyWeek, weekDate, weeklyLessonId, type StudyLevel, type WeeklyPack } from "./weekly-types.ts";

// A 48-week context cycle is available without inference. Core structures recur
// deliberately for practice; generated packs add fresh situations when enabled.
const topics = [
  ["배송 계획 조율", "delivery plan", "배송 계획"],
  ["고객 요청 정리", "customer request", "고객 요청"],
  ["회의 안건 준비", "meeting agenda", "회의 안건"],
  ["출장 일정 확인", "travel schedule", "출장 일정"],
  ["비용 견적 협의", "cost estimate", "비용 견적"],
  ["인수인계 메모 작성", "handover note", "인수인계 메모"],
  ["재고 보고서 확인", "inventory report", "재고 보고서"],
  ["교육 일정 조율", "training schedule", "교육 일정"],
  ["상품 설명 검토", "product description", "상품 설명"],
  ["주간 업무 계획", "weekly work plan", "주간 업무 계획"],
  ["청구서 수정 요청", "revised invoice", "수정 청구서"],
  ["행사 예약 확인", "event booking", "행사 예약"],
];
const times=[["Tuesday afternoon","화요일 오후"],["Wednesday morning","수요일 오전"],["Thursday afternoon","목요일 오후"],["Friday morning","금요일 오전"]];
export function preparedPack(weekStart:string,level:StudyLevel):WeeklyPack {
  const week=studyWeek(weekDate(weekStart)),index=Math.max(0,week.index);
  const [topic,item,ko]=topics[index%topics.length];
  const [time,timeKo]=times[Math.floor(index/topics.length)%times.length];
  const itemEn=`the ${item}`;
  // Short adult A1–A2 responses and extended A2–B1 responses share the situation.
  const rows:string[][][]=[[
    [`Could you send me ${itemEn}?`,`Could you send me ${itemEn}? I'd like to review it before our call.`,`${ko} 자료를 보내주실 수 있나요?`,`${ko} 자료를 보내주실 수 있나요? 통화 전에 검토하고 싶어요.`,`What do you need before the call?`,`통화 전에 무엇이 필요한가요?`],
    [`I'll review ${itemEn} today.`,`I'll review ${itemEn} today and let you know if I have any questions.`,`오늘 ${ko} 내용을 검토할게요.`,`오늘 ${ko} 내용을 검토하고 질문이 있으면 알려드릴게요.`,`When can you take a look?`,`언제 확인해 주실 수 있나요?`],
    [`Can we discuss ${itemEn} on ${time}?`,`Can we discuss ${itemEn} on ${time}? That gives me time to check the details.`,`${timeKo}에 ${ko}에 관해 이야기할 수 있을까요?`,`${timeKo}에 ${ko}에 관해 이야기할 수 있을까요? 그러면 세부 내용을 확인할 시간이 생겨요.`,`When would you like to talk?`,`언제 이야기하고 싶으세요?`],
    [`Who is responsible for ${itemEn}?`,`Who is responsible for ${itemEn}? I'd like to check a few points with them.`,`${ko} 담당자는 누구인가요?`,`${ko} 담당자는 누구인가요? 몇 가지를 담당자에게 확인하고 싶어요.`,`Do you need to speak to someone?`,`누군가와 이야기해야 하나요?`],
    [`Thank you for sharing ${itemEn}.`,`Thank you for sharing ${itemEn}. I'll read it carefully and get back to you.`,`${ko} 자료를 공유해 주셔서 감사해요.`,`${ko} 자료를 공유해 주셔서 감사해요. 꼼꼼히 읽고 다시 연락드릴게요.`,`I've just sent it to you.`,`방금 보내드렸어요.`],
  ],[
    [`Could you explain this part of ${itemEn}?`,`Could you explain this part of ${itemEn}? I want to make sure I understand it correctly.`,`${ko}의 이 부분을 설명해 주시겠어요?`,`${ko}의 이 부분을 설명해 주시겠어요? 정확히 이해했는지 확인하고 싶어요.`,`Is everything clear?`,`모두 이해되셨나요?`],
    [`Is this the latest version of ${itemEn}?`,`Is this the latest version of ${itemEn}, or should I use a different file?`,`이것이 ${ko}의 최신 버전인가요?`,`이것이 ${ko}의 최신 버전인가요, 아니면 다른 파일을 사용해야 하나요?`,`Which file are you using?`,`어떤 파일을 사용하고 계세요?`],
    [`Let me double-check ${itemEn}.`,`Let me double-check ${itemEn} before I give you an answer.`,`제가 ${ko} 내용을 한 번 더 확인할게요.`,`답변을 드리기 전에 ${ko} 내용을 한 번 더 확인할게요.`,`Can you confirm that now?`,`지금 확인해 주실 수 있나요?`],
    [`We need more details about ${itemEn}.`,`We need more details about ${itemEn} so that everyone can follow the same instructions.`,`${ko}에 관한 더 자세한 내용이 필요해요.`,`모두 같은 지침을 따를 수 있도록 ${ko}에 관한 더 자세한 내용이 필요해요.`,`What information is missing?`,`어떤 정보가 빠져 있나요?`],
    [`I'll add a note to ${itemEn}.`,`I'll add a note to ${itemEn} to explain what we discussed today.`,`${ko} 자료에 메모를 추가할게요.`,`오늘 논의한 내용을 설명하는 메모를 ${ko} 자료에 추가할게요.`,`How will you record the changes?`,`변경 사항을 어떻게 기록할 건가요?`],
  ],[
    [`I'm still working on ${itemEn}.`,`I'm still working on ${itemEn}, but I should have an update for you soon.`,`아직 ${ko} 관련 작업을 하고 있어요.`,`아직 ${ko} 관련 작업을 하고 있지만 곧 진행 상황을 알려드릴 수 있을 것 같아요.`,`How is it going?`,`어떻게 진행되고 있나요?`],
    [`I've checked most of ${itemEn}.`,`I've checked most of ${itemEn}. There are just a few details left to confirm.`,`${ko} 내용은 대부분 확인했어요.`,`${ko} 내용은 대부분 확인했어요. 확인할 세부 사항이 몇 가지 남아 있어요.`,`How much have you finished?`,`얼마나 마무리했나요?`],
    [`I'll finish checking ${itemEn} by ${time}.`,`I'll finish checking ${itemEn} by ${time}, as long as I receive the missing information.`,`${timeKo}까지 ${ko} 내용 확인을 마칠게요.`,`빠진 정보를 받으면 ${timeKo}까지 ${ko} 내용 확인을 마칠게요.`,`When do you expect to finish?`,`언제 마칠 것으로 예상하세요?`],
    [`Could you help me with ${itemEn}?`,`Could you help me with ${itemEn}? A second opinion would be useful.`,`${ko} 관련해서 도와주실 수 있나요?`,`${ko} 관련해서 도와주실 수 있나요? 다른 분의 의견도 있으면 좋겠어요.`,`Do you need any help?`,`도움이 필요한가요?`],
    [`I'll share an update on ${itemEn} today.`,`I'll share an update on ${itemEn} today so the team knows what still needs to be done.`,`오늘 ${ko} 진행 상황을 공유할게요.`,`팀이 남은 일을 알 수 있도록 오늘 ${ko} 진행 상황을 공유할게요.`,`How will you keep the team informed?`,`팀에는 어떻게 상황을 알릴 건가요?`],
  ],[
    [`There's a mistake in ${itemEn}.`,`There's a mistake in ${itemEn}. Could we check it together before sending it out?`,`${ko} 자료에 잘못된 부분이 있어요.`,`${ko} 자료에 잘못된 부분이 있어요. 보내기 전에 같이 확인할 수 있을까요?`,`Did you notice any problems?`,`문제점을 발견했나요?`],
    [`We need to change part of ${itemEn}.`,`We need to change part of ${itemEn} because the original information is no longer correct.`,`${ko}의 일부를 수정해야 해요.`,`기존 정보가 더 이상 맞지 않아서 ${ko}의 일부를 수정해야 해요.`,`Why can't we use the original version?`,`왜 원래 버전을 사용할 수 없나요?`],
    [`I'm sorry for the confusion about ${itemEn}.`,`I'm sorry for the confusion about ${itemEn}. I'll explain what changed and send you an update.`,`${ko}에 관해 혼란을 드려 죄송해요.`,`${ko}에 관해 혼란을 드려 죄송해요. 변경된 내용을 설명하고 최신 내용을 보내드릴게요.`,`These details don't match the earlier message.`,`이 내용은 앞서 받은 메시지와 맞지 않아요.`],
    [`Could we review ${itemEn} again today?`,`Could we review ${itemEn} again today? I want to resolve this before it causes a delay.`,`오늘 ${ko} 내용을 다시 검토할 수 있을까요?`,`오늘 ${ko} 내용을 다시 검토할 수 있을까요? 지연이 생기기 전에 해결하고 싶어요.`,`What should we do next?`,`다음으로 무엇을 해야 할까요?`],
    [`I'll send the corrected version of ${itemEn}.`,`I'll send the corrected version of ${itemEn} and clearly mark the changes.`,`${ko} 자료의 수정본을 보내드릴게요.`,`${ko} 자료의 수정본을 보내고 변경 사항을 명확하게 표시할게요.`,`How will I know what's different?`,`어느 부분이 달라졌는지 어떻게 알 수 있나요?`],
  ],[
    [`We've finished reviewing ${itemEn}.`,`We've finished reviewing ${itemEn}, and the team is ready to move forward.`,`${ko} 검토를 마쳤어요.`,`${ko} 검토를 마쳤고 팀은 다음 단계로 진행할 준비가 됐어요.`,`Are we ready for the next step?`,`다음 단계로 진행할 준비가 됐나요?`],
    [`I'll keep a copy of ${itemEn}.`,`I'll keep a copy of ${itemEn} so we can refer to it if any questions come up.`,`${ko} 자료의 사본을 보관할게요.`,`질문이 생기면 참고할 수 있도록 ${ko} 자료의 사본을 보관할게요.`,`Where can we find this information later?`,`나중에 이 정보를 어디에서 찾을 수 있나요?`],
    [`Please use this version of ${itemEn}.`,`Please use this version of ${itemEn}. It includes all the changes we agreed on.`,`${ko} 자료는 이 버전을 사용해 주세요.`,`${ko} 자료는 이 버전을 사용해 주세요. 합의한 변경 사항이 모두 들어 있어요.`,`Which version should I share?`,`어떤 버전을 공유해야 하나요?`],
    [`I'll follow up on ${itemEn} next week.`,`I'll follow up on ${itemEn} next week to check whether anything else needs our attention.`,`다음 주에 ${ko} 진행 상황을 다시 확인할게요.`,`추가로 신경 써야 할 사항이 있는지 다음 주에 ${ko} 진행 상황을 다시 확인할게요.`,`Will you check on this again?`,`이 내용을 다시 확인할 건가요?`],
    [`Thank you for your help with ${itemEn}.`,`Thank you for your help with ${itemEn}. Your feedback helped us avoid a mistake.`,`${ko} 관련해서 도와주셔서 감사해요.`,`${ko} 관련해서 도와주셔서 감사해요. 의견을 주신 덕분에 실수를 피할 수 있었어요.`,`I'm glad we could sort that out.`,`문제를 해결할 수 있어서 다행이에요.`],
  ]];
  const titles=["필요한 자료와 시간 요청하기","이해한 내용 다시 확인하기","진행 상황과 남은 일 설명하기","문제와 해결 방법 전달하기","완료 보고와 다음 단계 정리하기"];
  const lessons=rows.map((items,d)=>({id:weeklyLessonId(weekStart,level,d+1),title:titles[d],label:`${topic} · DAY ${d+1}`,scene:`${ko} 관련 업무를 맡았어요. ${titles[d]}를 연습하세요. 상황과 이름은 회화 연습용입니다.`,phrases:items.map(r=>{
    const en=r[level==="work"?1:0],koText=r[level==="work"?3:2];
    const from=en.includes("today")?"today":en.includes(time)?time:en.includes("Could you")?"Could you":en.includes("I'll")?"I'll":itemEn;
    const to=from==="today"?"tomorrow":from===time?"Friday afternoon":from==="Could you"?"Can you":from==="I'll"?"I will":`the updated ${item}`;
    return {en,ko:koText,cue:r[4],cueKo:r[5],tip:"먼저 핵심 내용을 말하고, 이유나 다음 행동을 한 문장 덧붙여 보세요.",task:koText,variation:{from,to,task:`문장에서 “${from}” 부분을 “${to}”로 바꿔 말하세요.`}} satisfies Phrase;
  })}));
  const expressions=[[item,ko],[`review ${itemEn}`,`${ko} 검토하기`],[`discuss ${itemEn}`,`${ko} 논의하기`],[`check ${itemEn}`,`${ko} 확인하기`],[`share ${itemEn}`,`${ko} 공유하기`],[`work on ${itemEn}`,`${ko} 관련 작업하기`],[`a mistake in ${itemEn}`,`${ko}의 잘못된 부분`],[`a copy of ${itemEn}`,`${ko}의 사본`],[`a version of ${itemEn}`,`${ko} 자료의 한 버전`],[`follow up on ${itemEn}`,`${ko} 진행 상황 다시 확인하기`]];
  const examples=[0,1,2,7,4,10,15,21,22,23],phrases=lessons.flatMap(l=>l.phrases);
  return {weekStart,nextUpdateAt:week.nextUpdateAt,level,source:"prepared",title:topic,lessons,words:expressions.map(([english,meaning],i)=>({english,meaning,example:phrases[examples[i]].en,exampleKo:phrases[examples[i]].ko,known:false,saved:false}))};
}

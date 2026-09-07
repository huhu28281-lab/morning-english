export type Phrase = { en: string; ko: string; tip: string; cue: string; cueKo: string; task?: string; variation?: { from: string; to: string; task: string } };
export type Lesson = { id: number; title: string; label: string; scene: string; phrases: Phrase[] };
const p = (en: string, ko: string, tip: string, cue: string, cueKo: string): Phrase => ({ en, ko, tip, cue, cueKo });
export const lessons: Lesson[] = [
{id:1,title:"아침에 동료와 인사하기",label:"직장 · 인사",scene:"회사에 도착해 동료와 마주쳤어요. 짧게 인사하며 하루를 시작해볼까요?",phrases:[
p("Good morning!","좋은 아침이에요!","morning은 아침이에요. 오전에 만났을 때 쓰는 인사예요.","Good morning, Alex!","좋은 아침이에요, Alex!"),
p("How are you?","어떻게 지내세요?","안부를 물을 때 써요. 한 단어씩보다 한 덩어리로 들어보세요.","Hi, Alex!","안녕하세요, Alex!"),
p("I'm good, thanks.","잘 지내요, 고마워요.","I'm은 I am을 줄인 말이에요. good 대신 fine도 쓸 수 있어요.","How are you?","어떻게 지내세요?"),
p("I'm a little tired.","조금 피곤해요.","a little은 '조금'이라는 뜻이에요. tired 대신 busy를 넣으면 '조금 바빠요'가 돼요.","How are you feeling today?","오늘 기분은 어때요?"),
p("Have a good day!","좋은 하루 보내세요!","인사를 마치고 각자 일을 시작할 때 쓰기 좋아요.","See you later!","나중에 봐요!")]},
{id:2,title:"처음 만난 동료에게 소개하기",label:"직장 · 자기소개",scene:"새 동료를 만났어요. 이름과 소속을 간단히 소개해보세요. Alex는 연습용 이름이에요.",phrases:[
p("My name is Alex.","제 이름은 Alex예요.","Alex 자리에 자신의 이름을 넣으면 돼요. 여기서는 예시 이름으로 연습해요.","What's your name?","이름이 뭐예요?"),
p("I'm new here.","저는 여기 새로 왔어요.","new는 '새로운'이라는 뜻이에요. 첫 출근 때 유용해요.","I haven't seen you before.","전에 뵌 적이 없는 것 같아요."),
p("I work in sales.","저는 영업 부서에서 일해요.","sales 대신 logistics를 넣으면 '물류 업무를 해요'가 돼요.","What do you do?","무슨 일을 하세요?"),
p("Nice to meet you.","만나서 반가워요.","처음 만났을 때 써요. 다시 만났을 때는 Nice to see you라고 해요.","Hi, I'm Sam.","안녕하세요, 저는 Sam이에요."),
p("I look forward to working with you.","함께 일하게 되어 기대돼요.","look forward to 뒤의 working까지 한 덩어리로 익혀보세요.","Welcome to the team!","팀에 오신 걸 환영해요!")]},
{id:3,title:"출근 전 커피 주문하기",label:"일상 · 카페",scene:"회사 근처 카페에 들렀어요. 원하는 커피와 포장 여부를 말해보세요.",phrases:[
p("I'd like a coffee, please.","커피 한 잔 주세요.","I'd like는 I would like를 줄인 말이에요. 주문할 때 정중하게 쓸 수 있어요.","What can I get for you?","무엇을 드릴까요?"),
p("Can I get it iced?","아이스로 받을 수 있을까요?","iced는 차가운 음료에 써요. 따뜻하게는 hot이라고 해요.","Would you like it hot?","따뜻하게 드릴까요?"),
p("A small one, please.","작은 사이즈로 주세요.","one은 앞서 말한 음료를 대신해요. medium, large로 바꿔 말해보세요.","What size would you like?","어떤 사이즈로 드릴까요?"),
p("To go, please.","포장해 주세요.","매장에서 먹을 때는 For here, please라고 해요.","For here or to go?","매장에서 드시나요, 포장인가요?"),
p("Can I pay by card?","카드로 결제해도 될까요?","현금으로는 in cash라고 해요.","That will be four dollars.","4달러입니다.")]},
{id:4,title:"모르는 것은 편하게 물어보기",label:"직장 · 도움 요청",scene:"익숙하지 않은 업무가 생겼어요. 동료에게 도움을 요청해보세요.",phrases:[
p("Could you help me?","도와주실 수 있나요?","Could you는 정중한 부탁을 시작하는 표현이에요.","Is everything okay?","괜찮으세요?"),
p("I have a question.","질문이 있어요.","질문을 바로 하기 전에 이 문장으로 말을 꺼낼 수 있어요.","Do you understand?","이해하셨나요?"),
p("How do I do this?","이건 어떻게 하나요?","this는 가까이에 있는 것 또는 지금 하는 일을 가리켜요.","Let's use this program.","이 프로그램을 써봐요."),
p("Could you say that again?","다시 말씀해 주시겠어요?","잘 못 들었을 때 써요. again은 '다시'예요.","Please open the second file.","두 번째 파일을 열어주세요."),
p("Thank you for your help.","도와주셔서 감사합니다.","Thank you for 뒤에 감사한 이유를 붙일 수 있어요.","Here you go. It's all done.","여기요. 다 됐어요.")]},
{id:5,title:"회의 시간 정하기",label:"직장 · 일정",scene:"동료와 짧은 회의를 잡으려고 해요. 가능한 시간을 묻고 대답해보세요.",phrases:[
p("Are you free this afternoon?","오늘 오후에 시간 괜찮으세요?","free는 여기서 '시간이 있는'이라는 뜻이에요.","We need to talk about the plan.","계획에 대해 이야기해야 해요."),
p("What time is the meeting?","회의가 몇 시인가요?","What time으로 시간을 물어요.","We have a meeting today.","오늘 회의가 있어요."),
p("It's at two.","2시예요.","시간 앞에 at을 써요. at two, at three처럼 연습해보세요.","What time is the meeting?","회의가 몇 시인가요?"),
p("Let's meet at three.","3시에 만나요.","Let's는 함께 무언가를 하자고 제안할 때 써요.","I'm busy at two.","2시에는 바빠요."),
p("That works for me.","저는 그 시간이 괜찮아요.","상대가 제안한 시간이나 방법에 동의할 때 써요.","How about three?","3시는 어때요?")]},
{id:6,title:"동료와 점심 먹기",label:"일상 · 점심",scene:"점심시간이에요. 메뉴를 정하고 식당에서 주문을 준비해보세요.",phrases:[
p("Have you had lunch?","점심 드셨어요?","식사했는지 물을 때 쓰는 문장 그대로 익혀보세요.","Hi, Alex!","안녕하세요, Alex!"),
p("What would you like to eat?","무엇을 드시고 싶으세요?","would you like는 상대가 원하는 것을 정중하게 물을 때 써요.","Let's have lunch together.","같이 점심 먹어요."),
p("Let's try this place.","여기 가봐요.","try는 여기서 '한번 이용해보다'라는 뜻이에요.","This restaurant looks nice.","이 식당 좋아 보이네요."),
p("Could we have the menu, please?","메뉴 좀 주시겠어요?","물을 부탁하려면 the menu를 some water로 바꿔보세요.","Welcome! Please have a seat.","어서 오세요! 앉으세요."),
p("The food was great.","음식이 맛있었어요.","was는 과거를 말해요. 식사 후에 쓰기 좋아요.","How was your lunch?","점심 어땠어요?")]},
{id:7,title:"이메일과 파일 주고받기",label:"직장 · 이메일",scene:"업무에 필요한 파일을 요청하고 이메일이 도착했는지 확인해보세요.",phrases:[
p("Could you send me the file?","파일을 보내주시겠어요?","send me는 '나에게 보내다'예요. the file 대신 the report도 써보세요.","The report is ready.","보고서가 준비됐어요."),
p("I'll send it by email.","이메일로 보낼게요.","I'll은 I will을 줄인 말이에요. 지금 결정한 일을 말할 때 써요.","Could you send me the file?","파일을 보내주시겠어요?"),
p("Did you get my email?","제 이메일 받으셨나요?","get은 여기서 '받다'라는 뜻이에요.","I just checked my inbox.","방금 받은편지함을 확인했어요."),
p("Please check the attachment.","첨부파일을 확인해 주세요.","attachment는 이메일의 첨부파일이에요.","Where can I find the report?","보고서는 어디에서 볼 수 있나요?"),
p("I'll check it now.","지금 확인할게요.","now는 '지금'이에요. it은 앞에서 말한 이메일이나 파일을 가리켜요.","I sent you the file.","파일을 보냈어요.")]},
{id:8,title:"영어 전화에 한마디 답하기",label:"직장 · 전화",scene:"영어 전화가 왔어요. 천천히 말해달라고 부탁해도 괜찮아요.",phrases:[
p("Hello, this is Alex.","안녕하세요, Alex입니다.","전화에서는 자신을 소개할 때 this is를 자주 써요.","Hello?","여보세요?"),
p("May I speak to Sam?","Sam과 통화할 수 있을까요?","Sam 자리에 통화하고 싶은 사람의 이름을 넣어요.","How can I help you?","무엇을 도와드릴까요?"),
p("Please hold on.","잠시만 기다려 주세요.","전화 연결 중에 상대에게 기다려 달라고 할 때 써요.","Is Sam there?","Sam 있나요?"),
p("Could you speak more slowly?","조금 더 천천히 말씀해 주시겠어요?","slowly는 '천천히'예요. 못 알아들었다면 편하게 부탁하세요.","The meeting has been moved to Friday.","회의가 금요일로 옮겨졌어요."),
p("I'll call you back.","다시 전화드릴게요.","call back은 '다시 전화하다'예요.","Can we talk later?","나중에 이야기할 수 있을까요?")]},
{id:9,title:"작은 문제를 설명하기",label:"직장 · 문제 상황",scene:"컴퓨터가 작동하지 않거나 확인할 시간이 필요할 때 쓰는 말을 익혀보세요.",phrases:[
p("I have a problem.","문제가 있어요.","상황을 설명하기 전에 말을 꺼내는 간단한 문장이에요.","How is your work going?","일은 잘되어 가나요?"),
p("My computer isn't working.","제 컴퓨터가 작동하지 않아요.","isn't는 is not의 줄임말이에요. computer 대신 printer도 쓸 수 있어요.","What's the problem?","무슨 문제인가요?"),
p("I'm sorry I'm late.","늦어서 죄송해요.","late는 '늦은'이라는 뜻이에요. 사과한 뒤 이유를 짧게 덧붙여도 좋아요.","We've already started.","벌써 시작했어요."),
p("Could you give me a moment?","잠시 시간을 주시겠어요?","a moment는 '잠깐'이에요. 확인이나 준비가 필요할 때 써요.","Are you ready?","준비되셨나요?"),
p("Let me check.","제가 확인해볼게요.","Let me 뒤에 할 행동을 붙여요. Let me see도 함께 익혀보세요.","Is this the right file?","이 파일이 맞나요?")]},
{id:10,title:"하루를 마무리하며 인사하기",label:"직장 · 퇴근",scene:"오늘 할 일을 마쳤어요. 동료에게 진행 상황을 말하고 퇴근 인사를 해보세요.",phrases:[
p("I'm done for today.","오늘 할 일은 끝났어요.","be done은 '끝나다'라는 뜻이에요.","How's your work going?","일은 어떻게 되어 가나요?"),
p("Do you need anything else?","더 필요한 게 있으세요?","anything else는 '그 밖에 다른 것'이에요.","Thanks for sending the report.","보고서 보내줘서 고마워요."),
p("Let's talk about it tomorrow.","그건 내일 이야기해요.","talk about은 '~에 대해 이야기하다'예요.","Can we discuss the new project?","새 프로젝트에 대해 이야기할 수 있을까요?"),
p("See you tomorrow!","내일 봐요!","tomorrow 대신 on Monday를 넣으면 '월요일에 봐요'예요.","I'm going home now.","저는 이제 집에 갈게요."),
p("Have a nice evening!","좋은 저녁 보내세요!","evening은 저녁이에요. good 대신 nice를 써도 자연스러워요.","See you tomorrow!","내일 봐요!")]}
];
export const stages = [
{title:"가볍게 듣기",sub:"짧은 대화에 귀 기울이기",hint:"처음엔 뜻을 보면서, 두 번째는 영어만 들으며 반복해보세요."},
{title:"핵심 표현",sub:"오늘 쓸 문장 5개 익히기",hint:"문장을 듣고 뜻을 확인하세요. 한 번에 한 문장씩, 천천히 익혀보세요."},
{title:"따라 말하기",sub:"내 목소리로 한 문장씩",hint:"짧게 듣고 따라 해보세요. 말하기 어려운 곳에서는 직접 입력해도 좋아요."},
{title:"대화 연습",sub:"상대의 말에 답해보기",hint:"상대의 말을 듣고, 제시된 우리말에 맞는 영어로 답해보세요."},
{title:"뜻 떠올리기",sub:"우리말만 보고 기억하기",hint:"답을 보기 전에 먼저 떠올려보세요. 기억나지 않으면 확인해도 괜찮아요."},
{title:"마무리 복습",sub:"오늘 배운 표현 다시 만나기",hint:"우리말에 맞는 표현을 골라보세요. 잘 안 떠오르는 문장은 다시 들어보세요."}
];

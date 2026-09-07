export type CloudflareUsage = { calls:number; reservedNeurons:number; maxCalls:number; maxNeurons:number; resetsAt:string };
export type ConnectionStatus = { openai: boolean; cloudflare:boolean; accountId:string; freePlanConfirmed:boolean; usage:CloudflareUsage|null; azure: boolean; endpoint: string; ready: boolean; managedCloudflare?:boolean; cloudflareState?:"ready"|"free_plan_required"|"binding_missing" };
export type ChatMessage = { role:"user"|"assistant"; content:string; translation?:string; correction?:string; feedback?:string };
export const scenarios = {
  commute:{label:"출근길 스몰토크",description:"Ask about the learner's commute, morning routine, and plans for today.",starter:"My commute takes about an hour. How about yours?"},
  office:{label:"동료와 업무 대화",description:"You are a colleague. Discuss deadlines, progress updates, and meeting changes.",starter:"Could we reschedule our meeting? I need more time to prepare."},
  logistics:{label:"주문·배송 확인",description:"You are a supplier. Discuss order details, delivery delays, and practical solutions.",starter:"I'm following up on our order. Could you confirm the delivery date?"},
  free:{label:"자유롭게 대화",description:"Have a natural conversation about a topic the learner chooses.",starter:"I'd like to tell you about my day."},
} as const;
export type Scenario = keyof typeof scenarios;

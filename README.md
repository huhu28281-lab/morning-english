# Morning English

출근길 한 시간을 활용하는 직장인 영어 회화 앱입니다.

- 실전 회화와 기초 과정, 하루 6단계 학습
- 표현 듣기, 따라 말하기, 조용히 공부하기
- 단어장, 복습 카드, 학습 기록
- Cloudflare Workers AI 영어 대화와 Azure 연결 시 발음 평가
- 모바일 화면 및 홈 화면 설치용 PWA 아이콘

## 공개 접속

Cloudflare 배포본은 로그인 없이 이용합니다. 방문자마다 예측하기 어려운 전용 쿠키를 발급하고 그 해시를 D1의 사용자 키로 사용합니다. 학습 기록, 단어장 및 선택적인 Azure 연결 설정은 방문자별로 분리되며 기존 계정의 자료를 공유하지 않습니다. 영어 대화는 서버의 Workers AI 바인딩을 함께 사용합니다.

기록은 같은 브라우저에서 이어집니다. 쿠키를 삭제하거나 다른 브라우저·기기를 쓰면 새로운 방문자로 시작합니다. 기존 자료 복원은 수행하지 않습니다.

## 배포

React 19, Vinext, Tailwind CSS, Cloudflare Workers와 D1을 사용합니다. [Cloudflare 배포 안내](CLOUDFLARE-MIGRATION.md)를 확인하세요.

빌드: `npm run build:cloudflare` (빌드 변수 `CF_D1_DATABASE_ID` 필요).

Cloudflare 대시보드에 남아 있는 Access 보호는 수정본 배포 후 해당 Worker에서 해제해야 합니다. 소스 수정만으로 Cloudflare의 정책이 삭제되지는 않습니다.

## AI 연결

공개 앱은 `AI` 바인딩을 통해 Workers AI를 호출합니다. 방문자가 Cloudflare 계정 ID나 토큰을 입력할 필요가 없으며, 영어 대화에 `APP_ENCRYPTION_KEY`도 필요하지 않습니다. 운영자는 계정이 **Workers Free**인지 확인한 뒤 Cloudflare의 **Runtime variables and secrets**에 Text 타입으로 `CF_AI_FREE_PLAN_CONFIRMED=true`를 입력하고 **Deploy**를 누릅니다. `keep_vars: true`로 이 설정을 이후 코드 배포에도 유지합니다. 빌드 변수는 이 값을 덮어쓰지 않습니다. 런타임 값이 없거나 `true`가 아니면 비활성화되며, 이 변수 자체가 요금제를 조회하거나 변경하지는 않습니다.

현재 모델은 `@cf/meta/llama-3.3-70b-instruct-fp8-fast`입니다. 모든 방문자를 합쳐 하루 최대 50회 또는 보수적으로 예약한 8,000 Neurons 예산 중 먼저 도달한 한도에서 중단합니다. 브라우저를 바꿔도 앱 전체 한도는 초기화되지 않으며 한국 시간 오전 9시에 초기화됩니다. 실패한 요청도 포함하고 자동 재시도·다른 유료 공급자로의 전환은 하지 않습니다. 다른 앱의 사용량까지 포함하는 실제 한도는 Cloudflare 계정에서 확인해야 합니다.

선택적인 Azure 발음 평가와 기존 Sites 배포의 개인 토큰 저장에는 고정 `APP_ENCRYPTION_KEY`가 필요합니다. 토큰과 운영 환경 파일은 GitHub에 넣지 마세요.

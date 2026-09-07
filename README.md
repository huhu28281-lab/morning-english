# Morning English

출근길 한 시간을 활용하는 직장인 영어 회화 앱입니다.

- 실전 회화와 기초 과정, 하루 6단계 학습
- 표현 듣기, 따라 말하기, 조용히 공부하기
- 단어장, 복습 카드, 학습 기록
- Cloudflare Workers AI 영어 대화와 Azure 연결 시 발음 평가
- 모바일 화면 및 홈 화면 설치용 PWA 아이콘

## 공개 접속

Cloudflare 배포본은 로그인 없이 이용합니다. 방문자마다 예측하기 어려운 전용 쿠키를 발급하고 그 해시를 D1의 사용자 키로 사용합니다. 학습 기록, 단어장, AI 연결 설정은 방문자별로 분리되며 기존 계정의 자료를 공유하지 않습니다.

기록은 같은 브라우저에서 이어집니다. 쿠키를 삭제하거나 다른 브라우저·기기를 쓰면 새로운 방문자로 시작합니다. 기존 자료 복원은 수행하지 않습니다.

## 배포

React 19, Vinext, Tailwind CSS, Cloudflare Workers와 D1을 사용합니다. [Cloudflare 배포 안내](CLOUDFLARE-MIGRATION.md)를 확인하세요.

빌드: `npm run build:cloudflare` (빌드 변수 `CF_D1_DATABASE_ID` 필요).

Cloudflare 대시보드에 남아 있는 Access 보호는 수정본 배포 후 해당 Worker에서 해제해야 합니다. 소스 수정만으로 Cloudflare의 정책이 삭제되지는 않습니다.

## AI 연결

각 방문자가 입력한 API 토큰은 서버에서 암호화해 해당 방문자에게만 연결합니다. 연결 저장에는 운영 환경의 고정 `APP_ENCRYPTION_KEY`가 필요합니다. 로그인 제거만으로 AI 서비스가 자동 연결되지는 않습니다. 토큰과 운영 환경 파일을 GitHub에 넣지 마세요.

Cloudflare AI의 계정별 일일 사용 제한과 유료 서비스로 자동 전환하지 않는 동작은 유지합니다. 실제 무료 한도 및 다른 앱의 사용량은 Cloudflare 계정에서 확인해야 합니다.

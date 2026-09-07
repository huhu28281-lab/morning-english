# Morning English

출근길 한 시간을 활용하는 직장인 영어 회화 학습 앱입니다.

- 실전 회화와 기초 과정, 하루 6단계 학습
- 표현 듣기, 따라 말하기, 조용히 공부하기
- 단어장과 학습 기록 저장
- Cloudflare Workers AI 영어 대화와 교정
- Azure 연결 시 발음 평가, 녹음과 재생
- 모바일 화면 및 홈 화면 설치용 PWA 아이콘

React 19, Vinext, Tailwind CSS, Cloudflare Workers와 D1을 사용합니다. 외부 AI 및 발음 평가는 해당 서비스 연결이 필요합니다.

## Cloudflare 배포

[이전 및 배포 안내](CLOUDFLARE-MIGRATION.md)를 따라 Cloudflare 계정, D1, 본인 이메일을 허용하는 Access 로그인 및 GitHub Secrets를 설정하세요.

`npm ci` 후 계정별 변수를 설정하고 `npm run build:cloudflare`로 빌드합니다. 일반 `npm run build`는 Sites용 빌드입니다.

GitHub Actions 배포는 저장소 변수 `CF_MIGRATION_READY=true`를 설정할 때 활성화됩니다. 현재 소스 업로드만으로 Cloudflare에 배포되지는 않습니다.

## 데이터와 비밀 값

저장소는 공개이며, 앱 접근은 Cloudflare Access를 통해 본인에게만 허용하도록 구성되어 있습니다. API 토큰과 고정 암호화 키는 비밀 값으로 관리하고 코드에 넣지 마세요. 운영 데이터와 환경 파일은 이 저장소에 포함하지 않습니다. 기존 서비스의 학습 기록을 새 D1으로 옮기는 작업은 별도로 필요합니다.

AI 사용량 제한이 포함되어 있으며, 실제 무료 한도와 사용량은 Cloudflare 계정에서 확인해야 합니다. 자동 유료 서비스 전환은 없습니다.

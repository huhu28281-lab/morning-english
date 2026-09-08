# Morning English Cloudflare 공개 배포

## 접속 및 기록

`worker/cloudflare.ts`는 로그인 없이 공개 접근을 허용합니다. `worker/visitor-session.ts`가 256비트 무작위 HttpOnly·Secure·SameSite=Lax 호스트 전용 쿠키를 발급합니다. 서버는 쿠키의 SHA-256 해시로 D1의 학습 기록, 단어장 및 AI 연결 정보를 분리합니다. 클라이언트가 보낸 사용자 헤더는 모두 제거합니다. 다른 출처의 쓰기 요청은 차단하고, 쿠키가 없는 쓰기는 저장하지 않습니다.

기록은 해당 브라우저에서 이어지며 쿠키 삭제, 다른 브라우저·기기 사용 시 새로 시작합니다. 과거 `cf:` 사용자 기록을 새 방문자에게 연결하거나 공개하지 않습니다. 기존 자료 복원은 하지 않습니다.

## Cloudflare Workers Builds

- 저장소: `huhu28281-lab/morning-english`, 브랜치: `main`
- Build command: `npm run build:cloudflare`
- Deploy command:

```sh
npx wrangler d1 migrations apply DB --remote --config .cloudflare-deploy.json && npx wrangler deploy --config dist/server/wrangler.json
```

Builds의 Variables and secrets에는 실제 D1 ID를 `CF_D1_DATABASE_ID`라는 Variable 한 줄로 입력합니다. 데이터베이스 이름은 `morning-english-db`, binding은 `DB`입니다. 예전 `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD`, `CF_OWNER_EMAIL`은 더 이상 빌드·실행에 사용하지 않습니다. 별도로 관리하는 다른 앱의 설정은 수정하지 않습니다.

새 데이터베이스의 테이블은 첫 API 요청에서도 생성됩니다. 재실행은 기존 기록을 지우지 않습니다. 빌드·배포 토큰에는 해당 계정의 Workers 배포 및 D1 마이그레이션 권한이 필요합니다. Worker 이름과 자산 경로는 빌드 결과 `dist/server/wrangler.json`을 사용합니다.

주간 학습용 새 테이블은 `0003_sudden_hiroim.sql` 마이그레이션으로 생성합니다. `npm run build:cloudflare`는 Workers Builds의 `WORKERS_CI=1`을 확인하면 빌드 성공 뒤 D1 마이그레이션을 적용합니다. 실패 시 이전 앱을 유지하도록 빌드를 실패 처리합니다. 배포 명령에서 같은 마이그레이션을 다시 실행해도 적용 이력에 따라 건너뜁니다. 로컬에서는 원격 마이그레이션을 실행하지 않습니다.

## 매주 바뀌는 학습 자료

- 매주 월요일 00:00 KST에 주차가 전환됩니다. 난도별 5일×5개 회화, 단어·표현 10개를 제공합니다.
- `triggers.crons: ["0 20 * * *"]`는 UTC 기준이며 매일 오전 5시 KST에 다음 주 교재를 미리 준비합니다. 이미 공개된 교재는 변경하지 않습니다.
- Workers AI 활성화 값이 정확히 `true`일 때만 호출하고, 대화와 같은 D1 공유 일일 예산에서 생성 비용을 먼저 예약합니다. 두 난도 각각 하루 한 번까지만 생성 시도합니다.
- 검증에 실패하거나 AI가 비활성화된 경우 준비 교재로 주간 학습을 제공합니다. 화면에서 준비 교재와 AI 교재를 구분합니다.
- 이전 주의 완료 기록, 저장한 단어와 외운 표시는 유지합니다. 주차별 수업 ID를 사용하며, 개인 기록 조회는 방문자 ID로 제한합니다.
- [Cloudflare Cron 실행 방식](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/)에 따라 작업을 수행합니다. 첫 실제 AI 생성 성공은 `weekly_curriculum_prepared` 로그 또는 다음 주의 `source: ai` 자료로 확인합니다. 배포 성공만으로 실제 AI 생성 성공을 단정하지 않습니다.

## 기존 Access 보호 해제

공개 버전의 배포가 성공한 뒤 Workers & Pages에서 `morning-english`를 선택하고 Access 탭에서 이 Worker의 로그인 보호를 해제합니다. 계정 전체 보호가 적용되어 있다면 이 Worker만 공개하도록 설정합니다. 다른 앱의 Access 정책이나 계정 전체 정책은 삭제하지 않습니다. 로그인 화면이 계속되면 이 Worker에 적용된 호스트 정책도 확인합니다.

## 공개 앱의 AI 대화 활성화

배포 설정이 `AI` 바인딩을 생성하며, 서버가 `env.AI.run`으로 대화를 요청합니다. 방문자는 Cloudflare 토큰을 입력하지 않습니다. 영어 대화에는 `APP_ENCRYPTION_KEY`가 필요하지 않습니다.

1. Cloudflare 계정의 **Workers 요금제가 Free**인지 확인합니다. Zero Trust 요금제와는 별개입니다. Paid라면 이 변수로 무료 전용을 보장할 수 없으므로 활성화하지 않습니다.
2. **Workers & Pages → morning-english → Settings → Runtime variables and secrets**에 Type **Text**, Name `CF_AI_FREE_PLAN_CONFIRMED`, Value `true`를 입력합니다. 모바일 화면에서는 이름이 잘릴 수 있으므로 전체 이름을 복사해서 붙여넣습니다.
3. 화면 아래 **Deploy**를 눌러 런타임 설정을 적용합니다. Builds에서 다시 빌드할 필요는 없습니다. 배포 설정의 `keep_vars: true`가 대시보드 변수를 이후 코드 배포에도 보존합니다. 예전 안내에 따라 넣은 같은 이름의 빌드 변수는 이제 사용하지 않습니다. `npm run build:cloudflare`와 배포 명령은 그대로 둡니다.
4. 앱을 새로고침하고 **AI 대화**에서 첫 문장을 보냅니다. `/api/ai/settings`의 `cloudflare: true`는 설정이 준비됐다는 뜻이며 실제 추론 성공은 첫 응답으로 확인합니다.

런타임 변수가 없거나 정확히 `true`가 아니면 추론을 호출하지 않습니다. 끄려면 같은 런타임 값을 `false`로 변경하고 Deploy합니다. 일반 학습과 기록 저장은 계속 사용할 수 있습니다. 이 확인값은 계정 요금제를 조회하거나 바꾸지 않습니다. [Free 요금제의 하루 10,000 Neurons 제한](https://developers.cloudflare.com/workers-ai/platform/pricing/)을 활용하며 다른 앱도 계정의 사용량을 함께 소모합니다.

모델은 `@cf/meta/llama-3.3-70b-instruct-fp8-fast`이며 JSON 스키마 응답을 검증합니다. D1에 공유 키 하나로 모든 방문자의 사용량을 원자적으로 예약해, 하루 최대 50회 또는 8,000 Neurons 예산 중 먼저 도달한 한도에서 중단합니다. 전송 전 입력 길이와 최대 출력 토큰을 제한합니다. 브라우저 쿠키를 바꿔도 전체 예산을 우회하지 못합니다. 실패·시간 초과 요청의 예산도 돌려주지 않고 자동 재시도나 유료 공급자 전환은 하지 않습니다. 실제 사용량보다 보수적으로 예약하므로 50회보다 일찍 중단될 수 있습니다.

선택적인 Azure 발음 평가의 개인 키 저장에는 Worker **런타임** Secret `APP_ENCRYPTION_KEY`가 필요합니다. 32바이트 난수를 Base64로 인코딩한 고정 값을 사용하고, 채팅이나 소스에 넣거나 재배포마다 바꾸지 않습니다. 기존 키는 유지합니다. 다른 방문자나 과거 운영자의 키를 공유하지 않습니다.

## GitHub Actions를 별도로 사용하는 경우

`.github/workflows/cloudflare.yml`은 저장소 변수 `CF_MIGRATION_READY=true`인 경우에만 실행됩니다. Workers Builds와 중복 실행하지 않도록 하나의 자동 배포 경로를 사용하세요. Actions 사용 시 `cloudflare-production` 환경에 Secrets `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` 및 Variable `CF_D1_DATABASE_ID`를 설정합니다. AI 활성화는 위의 Cloudflare 런타임 변수로 관리합니다. `APP_ENCRYPTION_KEY` Secret은 선택적이며 기존 값은 유지합니다.

## 확인

```sh
node --experimental-strip-types --test tests/visitor-session.test.mjs tests/workers-ai.test.mjs tests/learning-services.test.mjs tests/weekly-curriculum.test.mjs
npm run build:cloudflare
```

배포 후 로그인 없는 접근, 새 방문자의 빈 기록, 저장 후 새로고침, 두 브라우저의 기록 분리를 확인합니다. 일반 `npm run build`는 기존 Sites용 빌드이므로 독립 Cloudflare 배포에 혼용하지 않습니다.

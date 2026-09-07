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

## 기존 Access 보호 해제

공개 버전의 배포가 성공한 뒤 Workers & Pages에서 `morning-english`를 선택하고 Access 탭에서 이 Worker의 로그인 보호를 해제합니다. 계정 전체 보호가 적용되어 있다면 이 Worker만 공개하도록 설정합니다. 다른 앱의 Access 정책이나 계정 전체 정책은 삭제하지 않습니다. 로그인 화면이 계속되면 이 Worker에 적용된 호스트 정책도 확인합니다.

## AI 연결 정보

AI 연결을 저장하려면 Worker의 **런타임** Secrets에 32바이트 난수를 Base64로 인코딩한 고정 `APP_ENCRYPTION_KEY`를 설정합니다. 값을 채팅이나 소스에 넣지 않고, 재배포마다 바꾸지 않습니다. 기존 키가 있으면 유지합니다. 이 키가 없는 상태에서는 일반 학습과 기록 저장을 이용할 수 있지만 AI 키 저장은 준비되지 않은 상태입니다.

방문자는 각자의 AI 연결 정보를 앱에 입력합니다. 다른 방문자나 과거 운영자의 토큰을 공유하지 않습니다. 기존 Workers AI 무료 예산 제한을 유지하며 유료 서비스로 자동 전환하지 않습니다.

## GitHub Actions를 별도로 사용하는 경우

`.github/workflows/cloudflare.yml`은 저장소 변수 `CF_MIGRATION_READY=true`인 경우에만 실행됩니다. Workers Builds와 중복 실행하지 않도록 하나의 자동 배포 경로를 사용하세요. Actions 사용 시 `cloudflare-production` 환경에 Secrets `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `APP_ENCRYPTION_KEY` 및 Variable `CF_D1_DATABASE_ID`를 설정합니다.

## 확인

```sh
node --experimental-strip-types --test tests/visitor-session.test.mjs
npm run build:cloudflare
```

배포 후 로그인 없는 접근, 새 방문자의 빈 기록, 저장 후 새로고침, 두 브라우저의 기록 분리를 확인합니다. 일반 `npm run build`는 기존 Sites용 빌드이므로 독립 Cloudflare 배포에 혼용하지 않습니다.

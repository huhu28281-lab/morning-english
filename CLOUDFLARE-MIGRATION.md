# Morning English: GitHub와 개인 Cloudflare 계정으로 이전

현재 상태: 공개 GitHub 저장소에 앱 소스와 자동 배포 구성을 준비했다. Cloudflare 계정별 리소스, 비밀 값 및 운영 배포 설정이 필요하다.

검증: 타입 검사 통과. 정상 사용자, 다른 사용자·대상 앱, 토큰 변조, 만료, 서명 없는 토큰을 확인하는 인증 테스트 3개 통과. 테스트 전용 설정으로 독립 Cloudflare 빌드와 정적 파일 인증 경로를 검사했으며, 임시 설정은 제거했다. 기존 Sites용 빌드도 다시 확인했다. 실제 Cloudflare 계정에서의 로그인·저장·AI 응답 검증은 아직 진행하지 못했다.

## 배포 구조

- GitHub 공개 저장소: 앱 소스와 변경 기록.
- Cloudflare Workers: React/Vinext 앱과 서버 API.
- Cloudflare D1 (`DB`): 학습 기록, 단어장, 암호화한 연결 정보.
- Cloudflare Access: 본인 이메일만 허용하는 로그인.
- Workers AI: 기존 REST 연결과 일일 요청 제한 사용. 유료 요금제로 전환하지 않는다.

이 앱은 API와 D1을 사용하므로 정적 파일만 Pages에 올려서는 동작하지 않는다. 독립 배포에서는 `worker/cloudflare.ts`가 Access JWT 서명·발급자·대상 앱·만료 시각·본인 이메일을 검증한 뒤 기존 앱에 인증된 사용자 정보를 전달한다. 외부에서 임의로 보낸 사용자 헤더는 제거한다. 로그인 설정이 빠졌을 때도 공개 접근을 허용하지 않는다.

## 연결 후 수행할 순서

1. GitHub 계정을 확인하고 공개 `morning-english` 저장소를 생성한다. 같은 이름이 있으면 소유자와 내용을 먼저 확인하며 덮어쓰지 않는다.
2. Cloudflare에서 사용할 계정과 Workers Free 요금제를 확인한다. 새 D1 `morning-english-db`를 만들고 실제 ID를 확보한다. 기존 데이터베이스를 덮어쓰지 않는다.
3. Cloudflare Access 애플리케이션을 배포할 호스트 전체에 적용한다. 이메일 일회용 코드 등의 로그인 방법을 활성화하고 본인 이메일만 허용한다. `workers.dev` 주소를 사용할 때 해당 Worker의 Access 보호를 설정한다. 호스트와 Access 애플리케이션 AUD를 확인한다.
4. 아래 변수와 비밀 값을 GitHub의 `cloudflare-production` 환경에 설정한다. `CF_MIGRATION_READY`는 저장소 변수로 두고 마지막까지 비활성 상태로 유지한다.
5. 최초 암호화 키는 32바이트 난수의 Base64 값으로 한 번만 생성해 비밀 값으로 보관한다. 재배포마다 바꾸지 않는다. 채팅에 노출된 API 토큰은 사용하지 않는다.
6. 소스를 GitHub에 올리고 Access 설정, 무료 요금제, 데이터 이전 방식을 확인한 뒤 저장소 변수 `CF_MIGRATION_READY=true`를 설정한다. Actions에서 수동 실행하면 첫 배포를 진행한다. 이후 main 브랜치 변경 시 같은 Worker에 반영된다.
7. 익명 접근 차단, 본인 로그인, 학습 기록 저장, 단어장, AI 한 문장 응답을 확인한 뒤 새 주소를 전달한다.

| GitHub 설정 | 이름 | 용도 |
|---|---|---|
| Secret | `CLOUDFLARE_ACCOUNT_ID` | 배포 대상 계정 |
| Secret | `CLOUDFLARE_API_TOKEN` | 해당 계정의 Worker 배포와 D1 마이그레이션 권한. 앱의 Workers AI 토큰과 별개 |
| Secret | `APP_ENCRYPTION_KEY` | 연결 정보 암호화에 쓰는 고정 키 |
| Variable | `CF_D1_DATABASE_ID` | 실제 D1 ID |
| Variable | `CF_ACCESS_TEAM_DOMAIN` | `https://팀이름.cloudflareaccess.com` |
| Variable | `CF_ACCESS_AUD` | Access 애플리케이션의 AUD |
| Variable | `CF_OWNER_EMAIL` | 허용할 본인 이메일 |
| Repository variable | `CF_MIGRATION_READY` | 설정 검토 후 `true`로 변경 |

## 빌드와 배포

계정별 변수를 설정한 환경에서:

```sh
npm ci
node --experimental-strip-types --test tests/cloudflare-access.test.mjs
npm run build:cloudflare
npx --no-install wrangler d1 migrations apply DB --remote --config .cloudflare-deploy.json
npx --no-install wrangler deploy --config dist/server/wrangler.json
node scripts/cloudflare-secret.mjs
```

`npm run build:cloudflare`은 계정 정보를 검증하고 Git에서 제외된 `.cloudflare-deploy.json`을 생성한 뒤 독립 Worker를 빌드한다. 배포 전 생성된 `dist/server/wrangler.json`의 이름, D1 ID, Access 설정, `assets.run_worker_first`를 확인한다. 암호화 키가 잘못된 상태로 배포하지 않는다. 최초 배포 후 비밀 값 업로드에 실패하면 AI 연결 설정은 준비되지 않은 상태이며 배포 성공으로 안내하지 않는다.

일반 `npm run build`는 기존 Sites용 빌드다. 두 출력을 혼용하지 않는다. 기존 `.openai/hosting.json`을 새로운 Cloudflare 계정의 D1 ID로 수정하지 않는다.

## 기존 학습 데이터

소스 업로드만으로 기존 Sites D1 데이터가 새 계정에 복사되지는 않는다. 현재 사용자 ID와 Cloudflare Access 사용자 ID도 서로 다르다. 새 주소로 전환하기 전, 계정 연결 후 학습 기록과 단어장을 읽어 검토하고 본인 계정에 매핑하는 데이터 이전을 별도로 완료해야 한다. 암호화된 기존 API 토큰을 새 키로 읽을 수 있다고 가정하지 않는다. AI 연결 정보는 새 주소에서 안전하게 다시 입력하며 채팅이나 GitHub 코드에 넣지 않는다.

## 참고

- [Cloudflare GitHub 연동](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/)
- [GitHub Actions 배포](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)
- [Access JWT 검증](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)

# 길드 마스터에게 묻기 — 중계 서버

퀘스트 맵의 "묻기" 버튼이 보낸 사진과 질문을 Claude API로 넘기고 답을 돌려주는 Cloudflare Worker다.

API 키를 퀘스트 페이지에 직접 넣으면 안 된다. GitHub Pages는 코드가 전부 공개라서 누구나 키를 꺼내 쓸 수 있다. 그래서 키는 이 Worker의 비밀값에만 두고, 페이지는 Worker 주소만 안다.

```
폰(퀘스트 맵) ──사진+질문+참가코드──▶ Worker ──API 키──▶ Claude API
                ◀──────답변(스트리밍)──────┘
```

## 막아 둔 것

| 장치 | 내용 | 바꾸는 곳 |
|---|---|---|
| 참가 코드 | 코드가 없거나 틀리면 401 | `GUILD_CODES` 비밀값 |
| 1인 하루 한도 | 코드 하나당 하루 20회 | `wrangler.toml` `DAILY_LIMIT_PER_CODE` |
| 전체 하루 한도 | 길드 전체 하루 300회 | `wrangler.toml` `DAILY_LIMIT_TOTAL` |
| 출처 제한 | comjingue.github.io 에서 온 요청만 | `ALLOWED_ORIGINS` |
| 크기 제한 | 대화 10개, 사진 2장, 사진 약 1.5MB | `src/index.ts` 상단 상수 |
| 최종 방어선 | Anthropic 콘솔 월 지출 한도 | console.anthropic.com → Limits |

하루 한도 카운터(KV)는 동시에 몰리면 몇 건 넘칠 수 있다. 그래서 콘솔 지출 한도는 꼭 걸어 둔다.

## 배포 (처음 한 번, 컴퓨터에서 15분)

준비물: Node.js 20 이상, Cloudflare 계정(무료), Anthropic API 키.

1. **API 키 만들기.** console.anthropic.com → API Keys → Create Key. 이름은 `levelup-guild-ask` 처럼 용도가 보이게. 같은 화면의 Limits에서 월 지출 한도를 먼저 정한다(1기 10명이면 소액으로 시작).
2. **설치와 로그인.**
   ```
   cd worker
   npm install
   npx wrangler login
   ```
3. **카운터 저장소(KV) 만들기.**
   ```
   npx wrangler kv namespace create ASK_KV
   ```
   출력된 `id` 를 `wrangler.toml` 의 `REPLACE_WITH_KV_ID` 자리에 붙여넣는다.
4. **비밀값 넣기.** 값은 터미널에서만 입력하고, 파일이나 단톡방에 적지 않는다.
   ```
   npx wrangler secret put ANTHROPIC_API_KEY
   npx wrangler secret put GUILD_CODES
   ```
   `GUILD_CODES` 는 쉼표로 여러 개 넣을 수 있다. 예: `lvup-1gi,lvup-staff`. 기수마다 코드를 바꾸면 졸업생 사용을 끊을 수 있다.
5. **배포.**
   ```
   npx wrangler deploy
   ```
   `https://levelup-guild-ask.<계정이름>.workers.dev` 같은 주소가 나온다. 브라우저로 그 주소 뒤에 `/health` 를 붙여 열었을 때 `ok` 가 보이면 성공.
6. **퀘스트 맵에 연결.** `quest/config.js` 의 `askEndpoint` 에 5번 주소를 넣고(끝에 `/` 없이), `quest/sw.js` 의 `CACHE` 버전을 하나 올려 커밋·푸시한다.

## 운영

- **로그 보기:** `npx wrangler tail` — 에러만 남긴다. 질문 내용과 사진은 기록하지 않는다.
- **모델 바꾸기:** `wrangler.toml` 의 `MODEL`. 기본값은 `claude-opus-5-5`. 비용을 줄이려면 `claude-sonnet-5-5` 나 `claude-haiku-5-5` 로 바꿔 보고 답 품질을 직접 비교한 뒤 정한다.
- **답변 거절 시:** 안전 분류기가 질문을 거절하면 서버가 다른 모델로 이어서 답하는 옵션(`fallbacks: "default"`)을 켜 두었다. 그래도 거절되면 사용자에게 SOS를 안내한다.
- **코드 교체:** `npx wrangler secret put GUILD_CODES` 로 다시 넣으면 바로 바뀐다.
- **로컬 테스트:** `.dev.vars.example` 을 `.dev.vars` 로 복사해 값을 채우고 `npm run dev`.

## 개인정보

사진과 질문은 답변을 만들기 위해 Anthropic API로 전송된다. Worker는 내용을 저장하지 않고, 날짜별 사용 횟수만 KV에 48시간 남긴다. 퀘스트 맵 첫 화면 안내문에도 같은 내용이 있다.

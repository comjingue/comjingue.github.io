// 레벨업 길드 · "길드 마스터에게 묻기" 중계 서버 (Cloudflare Worker)
// 브라우저 → 이 Worker → Claude API. API 키는 Worker 비밀값에만 있고 브라우저에는 절대 가지 않는다.
import Anthropic from "@anthropic-ai/sdk";

export interface Env {
  ANTHROPIC_API_KEY: string; // wrangler secret put ANTHROPIC_API_KEY
  GUILD_CODES: string; // wrangler secret put GUILD_CODES  (쉼표로 구분한 참가 코드들)
  ASK_KV: KVNamespace; // 하루 사용량 카운터
  ALLOWED_ORIGINS: string; // 쉼표 구분, 예: https://comjingue.github.io
  DAILY_LIMIT_PER_CODE: string; // 코드 하나당 하루 질문 수
  DAILY_LIMIT_TOTAL: string; // 전체 하루 질문 수 (비용 상한)
  MODEL?: string;
  ANTHROPIC_BASE_URL?: string; // 로컬 테스트용(목 서버). 운영에서는 비워 둔다.
}

type Img = { media_type: "image/jpeg" | "image/png" | "image/webp"; data: string };
type InMsg = { role: "user" | "assistant"; text: string; image?: Img };
type Ctx = {
  questId?: string;
  questTitle?: string;
  track?: string;
  os?: "mac" | "win";
  steps?: string[];
  checked?: number[];
  lastStep?: number | null;
  clear?: string;
};

const MAX_MESSAGES = 10;
const MAX_IMAGES = 2;
const MAX_TEXT = 2000;
const MAX_IMAGE_B64 = 2_000_000; // 약 1.5MB 이미지
const MAX_BODY = 6_000_000;

const SYSTEM_PROMPT = `너는 "레벨업 길드"의 길드 마스터다. 코딩을 처음 해 보는 성인이 퀘스트를 따라 개발 환경을 세팅하고, AI 에이전트를 만들고, 재테크 설계와 1인 창업 절차를 밟는 걸 돕는다. 사용자는 대개 폰으로 컴퓨터 화면을 찍어서 보낸다.

답하는 방식
- 한국어로, 짧게. 결론(무엇이 문제인지) 한 줄 → 지금 할 일 1~3단계 번호 목록 → 확인 방법 한 줄.
- 한 번에 하나의 해결책만 준다. 여러 가능성이 있으면 가장 흔한 것부터 시도하게 하고 "안 되면 결과 화면을 다시 찍어 보내 달라"고 한다.
- 터미널 명령은 코드 블록(\`\`\`)에 한 블록당 한 명령으로. 사용자의 운영체제(mac/win)에 맞는 명령만 쓴다.
- 사진이 흐리거나 잘려서 읽을 수 없으면 추측하지 말고 어느 부분을 다시 찍어 달라고 한다.
- 전문 용어는 처음 나올 때 괄호로 한 번 풀어 준다.
- 사진 속 화면이 퀘스트와 무관해 보이면 그렇다고 말하고 퀘스트로 돌아오게 돕는다.

안전
- 사진에 API 키, 비밀번호, 인증 코드, 계좌·카드번호, 주민번호가 보이면 그 값을 절대 다시 적지 말고, 가리고 다시 찍으라고 먼저 알린다. API 키·비밀번호가 노출됐다면 해당 서비스에서 폐기·변경하라고 안내한다.
- 파일을 대량 삭제하거나 권한을 넓게 여는 명령(rm -rf, sudo chmod 777, 실행 정책 Unrestricted 등)은 주지 않는다. 꼭 필요하면 이유와 위험을 먼저 설명한다.
- 재테크: 특정 종목·상품 추천, 수익 예측, 매수·매도 판단은 하지 않는다. 제도와 계산 방법만 설명하고 공식 출처(국세청, 금융감독원 등) 확인을 권한다.
- 세무·법률(사업자등록, 과세 유형, 통신판매업 등): 일반적인 절차만 안내하고, 확정 판단은 국세청 상담센터(126)나 세무사에게 확인하라고 한다.
- 모르는 것은 모른다고 말한다. 설치 명령이나 메뉴 이름이 바뀌었을 수 있으면 그렇게 말한다.
- 3번 이상 같은 문제가 안 풀리면 길드 단톡방에 SOS를 올리라고 권한다.`;

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const ok = origin && allowed.includes(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin : allowed[0] || "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Expose-Headers": "X-Remaining",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function fail(status: number, error: string, message: string, cors: Record<string, string>) {
  return new Response(JSON.stringify({ error, message }), {
    status,
    headers: { ...cors, "Content-Type": "application/json; charset=utf-8" },
  });
}

function today(): string {
  // 한국 시간 기준 날짜
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

function contextText(c: Ctx): string {
  const steps = (c.steps || []).slice(0, 12).map((s, i) => {
    const mark = (c.checked || []).includes(i) ? "[완료]" : "[ ]";
    return `${i + 1}. ${mark} ${String(s).slice(0, 600)}`;
  });
  return [
    "<quest_context>",
    `퀘스트: ${c.questTitle || "(알 수 없음)"} (${c.questId || "-"}, 트랙: ${c.track || "-"})`,
    `운영체제: ${c.os === "win" ? "Windows" : c.os === "mac" ? "Mac" : "알 수 없음"}`,
    `마지막으로 체크한 단계: ${c.lastStep == null ? "없음" : c.lastStep + 1}`,
    "단계:",
    ...steps,
    `클리어 조건: ${String(c.clear || "").slice(0, 400)}`,
    "</quest_context>",
  ].join("\n");
}

function buildMessages(msgs: InMsg[], ctx: Ctx): Anthropic.Beta.Messages.BetaMessageParam[] {
  const out: Anthropic.Beta.Messages.BetaMessageParam[] = [];
  msgs.forEach((m, i) => {
    const text = String(m.text || "").slice(0, MAX_TEXT);
    if (m.role === "assistant") {
      out.push({ role: "assistant", content: text || "(빈 답변)" });
      return;
    }
    const content: Anthropic.Beta.Messages.BetaContentBlockParam[] = [];
    if (i === 0) content.push({ type: "text", text: contextText(ctx) });
    if (m.image) {
      content.push({ type: "image", source: { type: "base64", media_type: m.image.media_type, data: m.image.data } });
    }
    content.push({ type: "text", text: text || "이 화면에서 뭐가 문제인지, 다음에 뭘 해야 하는지 알려줘." });
    out.push({ role: "user", content });
  });
  return out;
}

function validate(body: any): string | null {
  if (!body || typeof body !== "object") return "요청 형식이 올바르지 않아요.";
  if (typeof body.code !== "string" || !body.code.trim()) return "참가 코드가 없어요.";
  const msgs = body.messages;
  if (!Array.isArray(msgs) || msgs.length === 0 || msgs.length > MAX_MESSAGES) return "대화가 너무 길어요. 새 대화를 시작해 주세요.";
  if (msgs[0].role !== "user" || msgs[msgs.length - 1].role !== "user") return "요청 형식이 올바르지 않아요.";
  let images = 0;
  for (let i = 0; i < msgs.length; i++) {
    const m = msgs[i];
    if (!m || (m.role !== "user" && m.role !== "assistant")) return "요청 형식이 올바르지 않아요.";
    if (i > 0 && msgs[i - 1].role === m.role) return "요청 형식이 올바르지 않아요.";
    if (typeof m.text !== "string") return "요청 형식이 올바르지 않아요.";
    if (m.image) {
      if (m.role !== "user") return "요청 형식이 올바르지 않아요.";
      if (!["image/jpeg", "image/png", "image/webp"].includes(m.image.media_type)) return "사진 형식을 읽을 수 없어요.";
      if (typeof m.image.data !== "string" || !/^[A-Za-z0-9+/=]+$/.test(m.image.data)) return "사진 데이터가 올바르지 않아요.";
      if (m.image.data.length > MAX_IMAGE_B64) return "too_large";
      images++;
    }
  }
  if (images > MAX_IMAGES) return "사진은 대화당 최근 2장까지만 보낼 수 있어요.";
  return null;
}

async function bump(env: Env, key: string, limit: number): Promise<number | null> {
  // KV는 강한 일관성이 아니라서 동시에 몰리면 몇 건 넘칠 수 있다. 비용 상한의 최종 방어선은 Anthropic 콘솔 지출 한도다.
  const cur = parseInt((await env.ASK_KV.get(key)) || "0", 10);
  if (cur >= limit) return null;
  await env.ASK_KV.put(key, String(cur + 1), { expirationTtl: 60 * 60 * 48 });
  return limit - cur - 1;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const origin = req.headers.get("Origin");
    const cors = corsHeaders(origin, env);

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (url.pathname === "/health") return new Response("ok", { headers: cors });
    if (url.pathname !== "/ask" || req.method !== "POST") return fail(404, "bad_request", "없는 주소예요.", cors);

    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (!origin || !allowed.includes(origin)) return fail(403, "bad_request", "허용되지 않은 곳에서 온 요청이에요.", cors);

    const len = parseInt(req.headers.get("Content-Length") || "0", 10);
    if (len > MAX_BODY) return fail(413, "too_large", "사진이 너무 커요. 다시 찍어 주세요.", cors);

    let body: any;
    try {
      const raw = await req.text();
      if (raw.length > MAX_BODY) return fail(413, "too_large", "사진이 너무 커요. 다시 찍어 주세요.", cors);
      body = JSON.parse(raw);
    } catch {
      return fail(400, "bad_request", "요청 형식이 올바르지 않아요.", cors);
    }
    const bad = validate(body);
    if (bad === "too_large") return fail(413, "too_large", "사진이 너무 커요. 다시 찍어 주세요.", cors);
    if (bad) return fail(400, "bad_request", bad, cors);

    const codes = (env.GUILD_CODES || "").split(",").map((s) => s.trim()).filter(Boolean);
    const code = body.code.trim();
    if (!codes.includes(code)) return fail(401, "bad_code", "참가 코드가 맞지 않아요. 길드 단톡방 공지를 확인해 주세요.", cors);

    const day = today();
    const totalLeft = await bump(env, `total:${day}`, parseInt(env.DAILY_LIMIT_TOTAL || "300", 10));
    if (totalLeft === null) return fail(429, "limit", "오늘 길드 전체 질문 한도가 찼어요. 내일 다시 오거나 단톡방에 SOS를 올려 주세요.", cors);
    const left = await bump(env, `code:${code}:${day}`, parseInt(env.DAILY_LIMIT_PER_CODE || "20", 10));
    if (left === null) return fail(429, "limit", "오늘 질문을 다 썼어요. 내일 다시 오거나 단톡방에 SOS를 올려 주세요.", cors);

    const client = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
      ...(env.ANTHROPIC_BASE_URL ? { baseURL: env.ANTHROPIC_BASE_URL } : {}),
    });

    const stream = client.beta.messages.stream({
      model: env.MODEL || "claude-opus-5-5",
      max_tokens: 8000, // 상담 답변은 짧다. 비용 상한 겸.
      output_config: { effort: "medium" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default", // 안전 분류기가 거절하면 서버가 다른 모델로 이어서 답함
      cache_control: { type: "ephemeral" },
      system: SYSTEM_PROMPT,
      messages: buildMessages(body.messages as InMsg[], (body.context || {}) as Ctx),
    });

    const enc = new TextEncoder();
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        let wrote = false;
        try {
          for await (const ev of stream) {
            if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
              controller.enqueue(enc.encode(ev.delta.text));
              wrote = true;
            }
          }
          const final = await stream.finalMessage();
          if (final.stop_reason === "refusal") {
            controller.enqueue(enc.encode((wrote ? "\n\n" : "") + "이 질문에는 답하기 어려워요. 화면만 다시 찍어 보내거나 단톡방에 SOS를 올려 주세요."));
          } else if (final.stop_reason === "max_tokens") {
            controller.enqueue(enc.encode("\n\n(답이 길어서 여기서 끊겼어요. \"계속\"이라고 보내 주세요.)"));
          }
        } catch (err) {
          let msg = "길드 마스터가 잠시 자리를 비웠어요. 조금 뒤에 다시 보내 주세요.";
          if (err instanceof Anthropic.RateLimitError) msg = "지금 질문이 몰려 있어요. 1분 뒤에 다시 보내 주세요.";
          else if (err instanceof Anthropic.BadRequestError) msg = "사진이나 질문을 읽지 못했어요. 다시 찍어서 보내 주세요.";
          console.error("ask failed", err instanceof Anthropic.APIError ? `${err.status} ${err.message}` : String(err));
          controller.enqueue(enc.encode((wrote ? "\n\n" : "") + msg));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        ...cors,
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Remaining": String(left),
      },
    });
  },
};

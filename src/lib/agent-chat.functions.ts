import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const InputSchema = z.object({
  systemPrompt: z.string().min(1),
  agentName: z.string(),
  messages: z.array(MessageSchema).max(40),
});

const STYLE_INSTRUCTION = `
【对话方式】
- 每轮只问 1-2 个直接、具体的追问，引用用户原话/数字；不要给 A/B/C 选项。
- 信息没齐前不给完整方案；已确认过的事不再重复问。
- 信息齐后先简短小结，用户确认再给方案，并说明需人类拍板项。

【排版】
- 回复 120 字内（完整方案 220 字内）。
- 用 markdown 表格罗列信息，最多 4 行；表格外只留一句话 + 追问。
- 不要大段落、编号清单或重复成果卡内容。
`;

const CARD_INSTRUCTION = `
同时维护一张 json「成果卡」，真实反映当前对话进展：
{
  "title": "智能体名字+具体事项",
  "tagline": "当前进度一句话",
  "collected": [{"key": "", "value": ""}],
  "missing": ["还缺的信息"],
  "plan": ["2-4条具体步骤"],
  "checks": ["检查结论"],
  "risks": ["风险或冲突，没有就空"],
  "humanConfirm": "需人类确认的事项",
  "progress": 0,
  "mood": "emoji"
}
输出：{"reply": "给用户看的回复", "card": {...}}。reply 里不要出现 json。
`;

export type CardPayload = {
  title: string;
  tagline: string;
  collected: { key: string; value: string }[];
  missing: string[];
  plan: string[];
  checks: string[];
  risks: string[];
  humanConfirm: string;
  progress: number;
  mood: string;
};

export type AgentChatResult = {
  ok: boolean;
  reply: string;
  card: CardPayload | null;
  error: string;
  status: number;
};

export const agentChat = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }): Promise<AgentChatResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return {
        ok: false,
        status: 401,
        error: "AI 服务未配置（缺少密钥）。",
        reply: "",
        card: null,
      };
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: data.systemPrompt + "\n\n" + STYLE_INSTRUCTION + "\n\n" + CARD_INSTRUCTION,
          },
          ...data.messages,
        ],
      }),
    });

    if (!res.ok) {
      await res.text().catch(() => "");
      const map: Record<number, string> = {
        400: "请求有问题，请把内容改短一点再试。",
        401: "AI 服务密钥无效，请联系老师检查配置。",
        402: "AI 额度用完了，需要在 Lovable 中补充额度。",
        403: "AI 服务被工作区策略暂停了。",
        429: "大家问得太快啦，请稍等几秒再试。",
      };
      return {
        ok: false,
        status: res.status,
        error: map[res.status] ?? `AI 服务暂时不可用（${res.status}）。`,
        reply: "",
        card: null,
      };
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = json.choices?.[0]?.message?.content ?? "";

    // 清洗：去掉 markdown 代码块包裹，提取第一个 { 到最后一个 }
    let clean = raw.trim();
    clean = clean.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      clean = clean.slice(firstBrace, lastBrace + 1);
    }

    let reply = raw;
    let card: CardPayload | null = null;
    try {
      const parsed = JSON.parse(clean) as { reply?: string; card?: CardPayload };
      if (parsed && typeof parsed === "object") {
        reply = typeof parsed.reply === "string" ? parsed.reply : raw;
        card = parsed.card ?? null;
      }
    } catch {
      console.warn("JSON parse failed after cleanup:", clean);
      /* 模型偶尔不返回 json，就直接用原文 */
    }

    return {
      ok: true,
      status: 200,
      error: "",
      reply: reply || "（我没想好该怎么说，请再说一次）",
      card,
    };
  });

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

const CARD_INSTRUCTION = `
除了正常回复，你还要维护一张实时「成果卡」（json 对象），它必须真实反映当前这段对话的进展，绝不能套模板：
- title：智能体名字 + 它正在办的这件具体事
- tagline：一句话说明现在进行到哪一步（用这次对话里出现过的真实信息）
- collected：已经从用户那里问到的信息，数组，每项 {key, value}，value 用用户原话里的数字/地点/时间
- missing：还缺的关键信息（还没问到的），数组，字符串
- plan：目前能确定下来的行动步骤，数组，2-4 条，必须包含真实数字或名称
- checks：你已经做过的检查结论（算数、限制、规则），数组，写清楚通过还是不通过
- risks：发现的风险或冲突，数组，没有就空数组
- humanConfirm：需要人类（同学/老师）最后确认的事项，一句话
- progress：0-100 的整数，表示方案完成度
- mood：一个 emoji，表示现在的状态

输出必须是 json，格式为：{"reply": "给用户看的回复", "card": { ... }}。reply 里不要出现 json 或大括号。
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
      return { ok: false, status: 401, error: "AI 服务未配置（缺少密钥）。", reply: "", card: null };
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
          { role: "system", content: data.systemPrompt + "\n\n" + CARD_INSTRUCTION },
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
    let reply = raw;
    let card: CardPayload | null = null;
    try {
      const parsed = JSON.parse(raw) as { reply?: string; card?: CardPayload };
      if (parsed && typeof parsed === "object") {
        reply = typeof parsed.reply === "string" ? parsed.reply : raw;
        card = parsed.card ?? null;
      }
    } catch {
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

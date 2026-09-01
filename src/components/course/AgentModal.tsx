import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, CheckCircle2, Send, ShieldCheck, User, X } from "lucide-react";
import { toast } from "sonner";
import type { AgentCard, AgentTheme, Fields } from "@/lib/agent-themes";

type ChatState = "collecting" | "planning" | "adjusting" | "done";

type Msg = {
  role: "agent" | "user";
  text: string;
  box?: { title: string; items: string[]; tone: "plan" | "check" | "final" };
};

const STATE_LABEL: Record<ChatState, string> = {
  collecting: "① 收集信息",
  planning: "② 制定方案",
  adjusting: "③ 调整改进",
  done: "④ 等你最终决定",
};

export function AgentModal({
  open,
  onClose,
  theme,
  card,
  fields,
}: {
  open: boolean;
  onClose: () => void;
  theme: AgentTheme;
  card: AgentCard;
  fields: Fields;
}) {
  const [state, setState] = useState<ChatState>("collecting");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setState("collecting");
    setInput("");
    setMsgs([
      {
        role: "agent",
        text: `你好！我是「${card.name || theme.name}」${theme.emoji}\n我的目标是：${card.goal || "帮你完成一件事"}。\n开始之前，我要先问清楚几件事，免得瞎猜。`,
        box: { title: "🎧 我需要知道", items: theme.askFor, tone: "check" },
      },
      {
        role: "agent",
        text: "请在下面一次性回答我，或者直接说「用指挥台里的信息」。",
      },
    ]);
  }, [open, theme, card.name, card.goal]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, thinking]);

  if (!open) return null;

  const reply = (userText: string) => {
    const next: Msg[] = [];
    let nextState: ChatState = state;

    if (state === "collecting") {
      nextState = "planning";
      next.push({
        role: "agent",
        text: "收到！信息够用了，我先拆解成三步行动 👇",
        box: {
          title: "📝 三步行动计划",
          items: [
            `第 1 步：${card.steps[0] || "收集需要的信息"}`,
            `第 2 步：${card.steps[1] || "做出可执行的方案"}`,
            `第 3 步：${card.steps[2] || "检查并改进"}`,
          ],
          tone: "plan",
        },
      });
      next.push({
        role: "agent",
        text: `参考背景：活动「${fields.activity || "未填"}」，人数「${fields.count || "未填"}」，限制「${fields.limits || "未填"}」。\n这样安排可以吗？想改哪一步告诉我。`,
      });
    } else if (state === "planning") {
      nextState = "adjusting";
      next.push({
        role: "agent",
        text: "好，我按你的意见调整，并且做一次安全检查 🛡️",
        box: {
          title: "🛡️ 检查与护栏",
          items: [
            card.check || "不编造信息，遇到矛盾先提问。",
            `你的补充：${userText}`,
            "不确定的地方我已标注「需要核实」，不会自己乱编。",
          ],
          tone: "check",
        },
      });
      next.push({ role: "agent", text: "还要再改点什么吗？没有的话我就出最终方案。" });
    } else if (state === "adjusting") {
      nextState = "done";
      next.push({
        role: "agent",
        text: "最终方案好了！但是——最后一步不是我说了算。",
        box: {
          title: "✨ 最终方案（待人类确认）",
          items: [
            `目标：${card.goal || theme.card.goal}`,
            `行动：${card.steps.filter(Boolean).join(" → ") || "三步行动"}`,
            `护栏：${card.check || theme.card.check}`,
            "需要核实：时间、地点、费用请再和老师确认一次。",
          ],
          tone: "final",
        },
      });
      next.push({
        role: "agent",
        text: "👩‍🏫 请你检查这份方案。确认无误请回复「通过」，需要修改就告诉我哪里不对。",
      });
    } else {
      const pass = /通过|同意|可以|没问题|ok|好的/i.test(userText);
      next.push({
        role: "agent",
        text: pass
          ? "✅ 已获得人类最终确认，任务完成！记住：能干的是我，负责的是你。"
          : "收到你的意见，我回到「调整改进」再改一版。",
      });
      nextState = pass ? "done" : "adjusting";
      if (pass) toast.success("人类最终签字通过 ✅");
    }

    setThinking(true);
    window.setTimeout(() => {
      setThinking(false);
      setMsgs((m) => [...m, ...next]);
      setState(nextState);
    }, 700);
  };

  const send = () => {
    const t = input.trim();
    if (!t) return;
    setMsgs((m) => [...m, { role: "user", text: t }]);
    setInput("");
    reply(t);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-3 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="flex h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border-4 border-ink bg-card shadow-[8px_8px_0_0_var(--ink)]"
      >
        <header className="flex items-center gap-3 border-b-4 border-ink bg-primary px-5 py-3 text-primary-foreground">
          <span className="text-3xl">{theme.emoji}</span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-xl font-extrabold">{card.name || theme.name}</h3>
            <p className="text-xs opacity-90">智能体工作台 · 实时演示（无需联网）</p>
          </div>
          <button
            onClick={onClose}
            aria-label="关闭"
            className="rounded-full bg-primary-foreground/15 p-2 hover:bg-primary-foreground/25"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="flex gap-2 overflow-x-auto border-b-2 border-border bg-secondary px-4 py-2">
          {(Object.keys(STATE_LABEL) as ChatState[]).map((s) => (
            <span
              key={s}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-bold transition ${
                s === state
                  ? "bg-accent text-accent-foreground shadow"
                  : "bg-card text-muted-foreground"
              }`}
            >
              {STATE_LABEL[s]}
            </span>
          ))}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          <AnimatePresence initial={false}>
            {msgs.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}
              >
                {m.role === "agent" && (
                  <div className="mt-1 h-9 w-9 shrink-0 rounded-full bg-sky/25 p-2 text-sky">
                    <Bot className="size-5" />
                  </div>
                )}
                <div className={`max-w-[80%] space-y-2 ${m.role === "user" ? "text-right" : ""}`}>
                  <div
                    className={`inline-block whitespace-pre-wrap rounded-2xl px-4 py-2 text-left text-base leading-relaxed ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {m.text}
                  </div>
                  {m.box && (
                    <div
                      className={`rounded-2xl border-2 p-3 text-left ${
                        m.box.tone === "plan"
                          ? "border-sky/40 bg-sky/10"
                          : m.box.tone === "check"
                            ? "border-grass/40 bg-grass/10"
                            : "border-sun/60 bg-sun/15"
                      }`}
                    >
                      <p className="mb-1 font-extrabold">{m.box.title}</p>
                      <ul className="space-y-1 text-sm">
                        {m.box.items.map((it, k) => (
                          <li key={k} className="flex gap-2">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 opacity-70" />
                            <span>{it}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                {m.role === "user" && (
                  <div className="mt-1 h-9 w-9 shrink-0 rounded-full bg-accent/30 p-2 text-accent-foreground">
                    <User className="size-5" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {thinking && (
            <p className="animate-pulse pl-11 text-sm text-muted-foreground">智能体思考中…</p>
          )}
          <div ref={endRef} />
        </div>

        <footer className="border-t-2 border-border bg-card p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-destructive">
            <ShieldCheck className="size-4" /> 最终决定权在人类手里：请你检查后再签字通过。
          </div>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={state === "done" ? "回复「通过」完成签字…" : "回答智能体的问题…"}
              className="flex-1 rounded-2xl border-2 border-border px-4 py-3 outline-none focus:border-primary"
            />
            <button
              onClick={send}
              className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 font-bold text-primary-foreground transition hover:brightness-110"
            >
              <Send className="size-5" /> 发送
            </button>
          </div>
        </footer>
      </motion.div>
    </div>
  );
}

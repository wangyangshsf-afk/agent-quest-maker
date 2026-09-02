import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Link as LinkIcon,
  Loader2,
  Play,
  Rocket,
  Send,
  Sparkle,
  UserCheck,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { VoiceInput } from "@/components/course/VoiceInput";
import { ChatMessage } from "@/components/course/ChatMessage";
import { agentChat, type CardPayload } from "@/lib/agent-chat.functions";
import {
  FACTORY_LIST,
  FACTORY_TYPES,
  buildFactoryPrompt,
  detectFactoryType,
  type FactoryTypeId,
} from "@/lib/agent-factory";
import { buildShareUrl } from "@/lib/agent-share";
import type { AgentCard, Fields, AgentTheme } from "@/lib/agent-themes";

type Msg = { role: "user" | "assistant"; content: string };

const THEME_TO_TYPE: Record<string, FactoryTypeId> = {
  spring: "spring",
  books: "books",
  science: "science",
  study: "study",
  story: "story",
  charity: "charity",
  sports: "sports",
  custom: "custom",
};

export function AgentFactory({
  card,
  setCard,
  fields,
  theme,
  initialAction = "",
  initialTypeId,
  startAtChat = false,
}: {
  card: AgentCard;
  setCard: (c: AgentCard) => void;
  fields: Fields;
  theme: AgentTheme;
  initialAction?: string;
  initialTypeId?: string;
  /** 分享链接打开时：跳过指令卡，直接孵化并进入对话 */
  startAtChat?: boolean;
}) {
  const chat = useServerFn(agentChat);

  const [typeId, setTypeId] = useState<FactoryTypeId>(
    (initialTypeId as FactoryTypeId | undefined) ?? THEME_TO_TYPE[theme.id] ?? "custom",
  );
  const [action, setAction] = useState(initialAction);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState<CardPayload | null>(null);
  const [approved, setApproved] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [replay, setReplay] = useState(0);
  const [booting, setBooting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const firstRun = useRef(true);

  // 主题切换时跟随（场景创作页选主题后进入本页）
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setTypeId(THEME_TO_TYPE[theme.id] ?? "custom");
    setAction("");
    setMsgs([]);
    setLive(null);
    setApproved(false);
  }, [theme.id]);

  const T = FACTORY_TYPES[typeId];

  const actionText = action.trim() || card.steps.filter(Boolean).join("；") || T.defaultAction;

  const prompt = useMemo(
    () =>
      buildFactoryPrompt(
        card.name,
        card.goal || `${fields.activity}｜${fields.count}｜${fields.limits}`,
        actionText,
        card.check,
        typeId,
      ),
    [card.name, card.goal, card.check, actionText, typeId, fields],
  );

  const shareUrl = useMemo(
    () =>
      buildShareUrl({
        t: typeId,
        th: theme.id,
        n: card.name || T.label,
        g: card.goal || T.defaultGoal,
        a: actionText,
        s1: card.steps[0] || "",
        s2: card.steps[1] || "",
        s3: card.steps[2] || "",
        c: card.check || T.defaultCheck,
        f: fields,
      }),
    [typeId, theme.id, card.name, card.goal, card.check, actionText, card.steps, fields, T],
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: t }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const r = await chat({
        data: { systemPrompt: prompt, agentName: card.name || T.label, messages: next },
      });
      if (!r.ok) {
        toast.error(r.error);
        setMsgs((m) => [...m, { role: "assistant", content: `😵 ${r.error}` }]);
      } else {
        setMsgs((m) => [...m, { role: "assistant", content: r.reply }]);
        if (r.card) {
          setLive(r.card);
          setReplay((x) => x + 1);
          setApproved(false);
        }
      }
    } catch {
      toast.error("网络不太顺，请再试一次");
    } finally {
      setBusy(false);
    }
  };

  // 启动：智能体先打招呼，从 0 开始一步一步问
  const boot = () => {
    const name = card.name || T.label;
    const known = [
      fields.activity && `活动是「${fields.activity}」`,
      fields.count && `人数是「${fields.count}」`,
      fields.limits && `限制是「${fields.limits}」`,
    ]
      .filter(Boolean)
      .join("，");
    const greet = known
      ? `你好！我是你的「${name}」专属智能体 ${T.emoji}\n\n我已经知道：${known}。\n接下来我会一步一步问你几个小问题，问齐了才给方案。\n准备好了吗？回复我「开始」吧！`
      : `你好！我是你的「${name}」专属智能体 ${T.emoji}\n\n我们从 0 开始：先告诉我，你想让我帮你办的那件事是什么？`;
    setMsgs([{ role: "assistant", content: greet }]);
  };

  const [stage, setStage] = useState<0 | 1 | 2>(startAtChat ? 1 : 0);

  // 分享链接打开：自动孵化 3 秒后直接开始对话
  const autoBooted = useRef(false);
  useEffect(() => {
    if (!startAtChat || autoBooted.current) return;
    autoBooted.current = true;
    setBooting(true);
    const t = setTimeout(() => {
      setBooting(false);
      setStage(1);
      boot();
    }, 3000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startAtChat]);


  const STAGES = [
    { emoji: "🧾", label: "指令卡" },
    { emoji: "💬", label: "和智能体对话" },
    { emoji: "🎁", label: "成果卡" },
  ] as const;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-4 text-center">
        <p className="mb-2 text-sm font-extrabold uppercase tracking-[0.2em] text-primary">
          实时生成 · 智能体工厂
        </p>
        <h2 className="text-2xl font-extrabold sm:text-3xl">
          {T.emoji} {card.name || T.label}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{T.desc}</p>
      </div>

      {/* 分步导航 */}
      <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
        {STAGES.map((s, i) => (
          <button
            key={s.label}
            onClick={() => setStage(i as 0 | 1 | 2)}
            className={`rounded-full px-4 py-2 text-sm font-extrabold transition ${
              i === stage
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-primary/15"
            }`}
          >
            {i + 1}. {s.emoji} {s.label}
          </button>
        ))}
      </div>

      {stage === 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap justify-center gap-2">
            {FACTORY_LIST.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTypeId(t.id);
                  setMsgs([]);
                  setLive(null);
                }}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  t.id === typeId
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-primary/15"
                }`}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>

          <div className="card-pop space-y-3 p-6">
            <Line
              label="🏷️ 名字"
              value={card.name}
              onChange={(v) => setCard({ ...card, name: v })}
              placeholder={T.label}
            />
            <Line
              label="🎯 目标"
              value={card.goal}
              onChange={(v) => setCard({ ...card, goal: v })}
              placeholder={T.defaultGoal}
            />
            <Line
              label="🪜 行动方式"
              value={action}
              onChange={setAction}
              placeholder={T.defaultAction}
            />
            <Line
              label="🛡️ 它要检查什么"
              value={card.check}
              onChange={(v) => setCard({ ...card, check: v })}
              placeholder={T.defaultCheck}
            />
            <p className="text-xs font-bold text-muted-foreground">
              识别到的类型：
              {FACTORY_TYPES[detectFactoryType(card.name, card.goal, actionText, card.check)].label}
              （已加载这一类的专属领域知识）
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowPrompt((s) => !s)}
                className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-bold"
              >
                <Sparkle className="size-4" /> {showPrompt ? "收起" : "查看"}提示词
              </button>
              <button
                onClick={() => {
                  void navigator.clipboard.writeText(prompt);
                  toast.success("提示词已复制 ✨");
                }}
                className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-bold"
              >
                <Copy className="size-4" /> 复制提示词
              </button>
            </div>
            {showPrompt && (
              <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-muted p-3 text-xs leading-relaxed">
                {prompt}
              </pre>
            )}
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => {
                setBooting(true);
                setTimeout(() => {
                  setBooting(false);
                  setStage(1);
                  boot();
                }, 3000);
              }}
              disabled={busy || booting}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-extrabold text-primary-foreground disabled:opacity-50"
            >
              <Rocket className="size-5" /> 启动智能体，去对话
            </button>
          </div>

        </div>
      )}

      <AnimatePresence>
        {booting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4"
          >
            <GeneratingOverlay emoji={T.emoji} />
          </motion.div>
        )}
      </AnimatePresence>

      {stage === 1 && (
        <div className="space-y-4">
          <div className="card-soft relative flex h-[52vh] flex-col p-5">
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-auto pr-1">
              {msgs.length === 0 && (
                <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
                  {T.starter}。直接在下面说一句话，或回到第 1 步点「启动智能体」。
                </p>
              )}
              {msgs.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <ChatMessage content={m.content} />
                </motion.div>
              ))}
              {busy && (
                <p className="inline-flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm font-bold">
                  <Loader2 className="size-4 animate-spin" /> 智能体正在思考…
                </p>
              )}
            </div>
            <div className="mt-3">
              <VoiceInput
                label="🗣️ 对智能体说"
                emoji="💬"
                placeholder="说出你的要求，或补充它问你的信息"
                value={input}
                onChange={setInput}
              />
              <button
                onClick={() => void send(input)}
                disabled={busy || !input.trim()}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 font-extrabold text-accent-foreground disabled:opacity-40"
              >
                <Send className="size-4" /> 发送
              </button>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setStage(0)}
              className="rounded-full bg-secondary px-5 py-3 font-bold"
            >
              ← 回到指令卡
            </button>
            <button
              onClick={() => setStage(2)}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-extrabold text-primary-foreground"
            >
              看成果卡 <Wand2 className="size-5" />
            </button>
          </div>
        </div>
      )}

      {stage === 2 && (
        <div className="space-y-4">
          <ResultCard
            key={replay}
            data={live}
            typeEmoji={T.emoji}
            approved={approved}
            onApprove={() => {
              setApproved(true);
              toast.success("你已完成人类最终决定 ✅");
            }}
            onReplay={() => setReplay((x) => x + 1)}
            shareUrl={shareUrl}
          />

          <div className="flex justify-center">
            <button
              onClick={() => setStage(1)}
              className="rounded-full bg-secondary px-5 py-3 font-bold"
            >
              ← 继续和智能体对话
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- 生成中的期待感动画 ---------- */

const GEN_STEPS = [
  { emoji: "🎯", text: "读懂你的目标…" },
  { emoji: "🧠", text: "调取这一类的领域知识…" },
  { emoji: "❓", text: "找出还缺少的信息…" },
  { emoji: "🪜", text: "排列行动步骤…" },
  { emoji: "🛡️", text: "做安全与预算检查…" },
  { emoji: "🎁", text: "组装成果卡…" },
];

function GeneratingOverlay({ emoji }: { emoji: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % GEN_STEPS.length), 500);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-3xl bg-background/85 backdrop-blur-sm"
    >
      <p className="text-lg font-extrabold text-primary">🥚 你的专属智能体正在孵化中…</p>
      <div className="relative flex size-24 items-center justify-center">
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-4 border-dashed border-primary/50"
        />
        <motion.span
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.1, repeat: Infinity }}
          className="text-4xl"
        >
          {emoji}
        </motion.span>
      </div>

      <div className="h-6 overflow-hidden text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={i}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="text-sm font-extrabold"
          >
            {GEN_STEPS[i]!.emoji} {GEN_STEPS[i]!.text}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="flex gap-1.5">
        {GEN_STEPS.map((s, k) => (
          <motion.span
            key={s.text}
            animate={{
              scale: k === i ? 1.3 : 1,
              opacity: k <= i ? 1 : 0.3,
            }}
            className="size-2 rounded-full bg-primary"
          />
        ))}
      </div>
    </motion.div>
  );
}

function Line({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-extrabold">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-2xl border-2 border-border px-4 py-2.5 outline-none focus:border-primary"
      />
    </label>
  );
}

/* ---------- 实时成果卡（由对话推导，非模版） ---------- */

function ResultCard({
  data,
  typeEmoji,
  approved,
  onApprove,
  onReplay,
  shareUrl,
}: {
  data: CardPayload | null;
  typeEmoji: string;
  approved: boolean;
  onApprove: () => void;
  onReplay: () => void;
  shareUrl: string;
}) {
  if (!data) {
    return (
      <div className="card-pop flex min-h-[50vh] flex-col items-center justify-center gap-3 p-8 text-center">
        <Wand2 className="size-10 text-primary" />
        <p className="text-lg font-extrabold">成果卡会在这里实时长出来</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          你每说一句话，智能体就会更新「已知信息 / 还缺什么 / 行动步骤 / 检查结论 / 风险」，
          最后由你来做人类最终决定。
        </p>
      </div>
    );
  }

  const p = Math.max(0, Math.min(100, Number(data.progress) || 0));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="card-pop space-y-4 p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl font-extrabold">
            {data.mood || typeEmoji} {data.title || "成果卡"}
          </p>
          <p className="text-sm text-muted-foreground">{data.tagline}</p>
        </div>
        <button
          onClick={onReplay}
          title="重放动画"
          className="rounded-full bg-secondary p-2"
          aria-label="重放动画"
        >
          <Play className="size-4" />
        </button>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs font-bold">
          <span>方案完成度</span>
          <span>{p}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${p}%` }}
            transition={{ duration: 0.8 }}
            className="h-full rounded-full bg-primary"
          />
        </div>
      </div>

      <AnimatePresence>
        <div className="space-y-4">
          {/* 第一大板块：Agent 已完成 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.3 }}
            className="rounded-3xl border-2 border-primary/20 bg-primary/5 p-5"
          >
            <p className="mb-3 flex items-center gap-2 text-base font-extrabold text-primary">
              <Sparkle className="size-5" /> 你让 Agent 完成的
            </p>
            <div className="space-y-3">
              {data.collected?.length > 0 && (
                <Block delay={0.08} title="✅ 已经问到的信息">
                  <div className="flex flex-wrap gap-2">
                    {data.collected.map((c, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-white px-3 py-1 text-sm font-bold shadow-sm"
                      >
                        {c.key}：{c.value}
                      </span>
                    ))}
                  </div>
                </Block>
              )}
              {data.checks?.length > 0 && (
                <Block delay={0.14} title="🛡️ 检查结论">
                  <ul className="space-y-1 text-sm">
                    {data.checks.map((c, i) => (
                      <li key={i} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-grass" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </Block>
              )}
            </div>
          </motion.div>

          {/* 第二大板块：交给人类 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.3 }}
            className="rounded-3xl border-2 border-amber-300 bg-sun/20 p-5"
          >
            <p className="mb-3 flex items-center gap-2 text-base font-extrabold text-amber-700">
              <UserCheck className="size-5" /> 剩下的就交给你啦
            </p>
            <div className="space-y-3">
              {data.missing?.length > 0 && (
                <Block delay={0.26} title="❓ 还缺什么">
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    {data.missing.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </Block>
              )}
              {data.plan?.length > 0 && (
                <Block delay={0.32} title="🪜 目前定下来的行动">
                  <ol className="list-decimal space-y-1 pl-5 text-sm">
                    {data.plan.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                </Block>
              )}
              {data.risks?.length > 0 && (
                <Block delay={0.38} title="⚠️ 风险与冲突">
                  <ul className="space-y-1 text-sm">
                    {data.risks.map((c, i) => (
                      <li key={i} className="flex gap-2">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-berry" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </Block>
              )}
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      <div className="rounded-2xl bg-sun/25 p-4">
        <p className="flex items-center gap-2 font-extrabold">
          <UserCheck className="size-5" /> 人类最终决定
        </p>
        <p className="mt-1 text-sm">{data.humanConfirm || "请检查这份方案后再执行。"}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={onApprove}
            disabled={approved}
            className="rounded-full bg-primary px-4 py-2 text-sm font-extrabold text-primary-foreground disabled:opacity-50"
          >
            {approved ? "✅ 已由我确认通过" : "我检查过了，通过"}
          </button>
          <button
            onClick={() => downloadPng(data, approved)}
            className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-bold"
          >
            <Download className="size-4" /> 导出成果卡图片
          </button>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-primary/25 bg-primary/5 p-4">
        <p className="flex items-center gap-2 font-extrabold text-primary">
          <LinkIcon className="size-5" /> 我的智能体专属链接
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          保存这条链接，课后再点开就能继续用这个智能体。
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            readOnly
            value={shareUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="min-w-0 flex-1 rounded-xl border-2 border-border bg-card px-3 py-2 text-xs"
          />
          <button
            onClick={() => {
              void navigator.clipboard.writeText(shareUrl);
              toast.success("链接已复制，快粘贴到收藏里 🔗");
            }}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-extrabold text-primary-foreground"
          >
            <Copy className="size-4" /> 复制链接
          </button>
          <a
            href={shareUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-bold"
          >
            <ExternalLink className="size-4" /> 打开试试
          </a>
        </div>
      </div>
    </motion.div>
  );
}

function Block({
  title,
  delay,
  children,
}: {
  title: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="rounded-2xl bg-muted/70 p-4"
    >
      <p className="mb-2 font-extrabold">{title}</p>
      {children}
    </motion.div>
  );
}

function downloadPng(d: CardPayload, approved: boolean) {
  const W = 900;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const font = getComputedStyle(document.body).fontFamily;

  // 先量高度
  const lines: { text: string; size: number; bold?: boolean; gap?: number }[] = [];
  const push = (text: string, size: number, bold?: boolean, gap = 10) =>
    lines.push({ text, size, ...(bold !== undefined ? { bold } : {}), gap });

  push(`${d.mood || "🤖"} ${d.title || "智能体成果卡"}`, 34, true, 14);
  push(`${d.tagline || ""}  完成度 ${d.progress || 0}%`, 18, false, 22);
  const sec = (t: string, arr: string[]) => {
    if (!arr.length) return;
    push(t, 22, true, 10);
    arr.forEach((x) => push("· " + x, 18, false, 8));
    lines.push({ text: "", size: 6, gap: 6 });
  };
  sec(
    "已经问到的信息",
    (d.collected ?? []).map((c) => `${c.key}：${c.value}`),
  );
  sec("还缺什么", d.missing ?? []);
  sec(
    "行动步骤",
    (d.plan ?? []).map((s, i) => `${i + 1}. ${s}`),
  );
  sec("检查结论", d.checks ?? []);
  sec("风险与冲突", d.risks ?? []);
  sec("人类最终决定", [
    d.humanConfirm || "需要本人或老师确认。",
    approved ? "✅ 已由人类确认通过" : "⏳ 等待人类确认",
  ]);

  const pad = 48;
  const maxW = W - pad * 2;
  // 换行处理
  const wrapped: typeof lines = [];
  for (const l of lines) {
    ctx.font = `${l.bold ? "700 " : ""}${l.size}px ${font}`;
    if (!l.text) {
      wrapped.push(l);
      continue;
    }
    let cur = "";
    for (const ch of l.text) {
      if (ctx.measureText(cur + ch).width > maxW && cur) {
        wrapped.push({ ...l, text: cur });
        cur = ch;
      } else cur += ch;
    }
    wrapped.push({ ...l, text: cur });
  }
  const H = pad * 2 + wrapped.reduce((s, l) => s + l.size + (l.gap ?? 10), 0);
  canvas.width = W;
  canvas.height = H;

  ctx.fillStyle = "#fffdf7";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#232a4a";
  ctx.lineWidth = 6;
  ctx.strokeRect(12, 12, W - 24, H - 24);

  let y = pad;
  ctx.textBaseline = "top";
  for (const l of wrapped) {
    ctx.font = `${l.bold ? "700 " : ""}${l.size}px ${font}`;
    ctx.fillStyle = l.bold ? "#232a4a" : "#3d456b";
    ctx.fillText(l.text, pad, y);
    y += l.size + (l.gap ?? 10);
  }

  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${d.title || "成果卡"}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("成果卡图片已保存 🖼️");
  });
}

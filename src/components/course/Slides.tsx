import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Eye,
  Gavel,
  Lightbulb,
  ListChecks,
  MapPin,
  MessageSquare,
  Play,
  RefreshCw,
  Rocket,
  Search,
  ShieldCheck,
  Sparkle,
  Target,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { VoiceInput } from "./VoiceInput";
import {
  THEMES,
  buildPrompt,
  detectConflicts,
  type AgentCard,
  type AgentTheme,
  type Fields,
} from "@/lib/agent-themes";

import { AgentFactory } from "@/components/course/AgentFactory";

/** 集中管理的页面索引，避免魔法数字 */
export const SLIDE = {
  cover: 0,
  journey: 1,
  situation: 2,
  roleVote: 3,
  compare: 4,
  loop: 5,
  quiz: 6,
  commandCenter: 7,
  execution: 8,
  detective: 9,
  review: 10,
  scenes: 11,
  factory: 12,
  wrap: 13,
  homework: 14,
} as const;

export type FlowState = "draft" | "running" | "needs_fix" | "detective" | "rerunning" | "approved";

export type Flow = {
  state: FlowState;
  baseline: Fields | null;
  approved: boolean;
  checks: string[];
  /** 学生主流程解锁到第几页（教师演示模式可无视） */
  unlocked: number;
};

export const EMPTY_FLOW: Flow = {
  state: "draft",
  baseline: null,
  approved: false,
  checks: [],
  unlocked: 7,
};


export type Ctx = {
  fields: Fields;
  setField: (k: keyof Fields, v: string) => void;
  card: AgentCard;
  setCard: (c: AgentCard) => void;
  theme: AgentTheme;
  applyTheme: (t: AgentTheme) => void;
  go: (i: number) => void;
  openAgent: () => void;
  flow: Flow;
  setFlow: (patch: Partial<Flow>) => void;
};


/* ---------- shared bits ---------- */

export function SlideTitle({ kicker, title }: { kicker?: string; title: string }) {
  return (
    <div className="mb-6 text-center">
      {kicker && (
        <p className="mb-2 text-sm font-extrabold uppercase tracking-[0.2em] text-primary">
          {kicker}
        </p>
      )}
      <h2 className="text-4xl font-extrabold sm:text-5xl">{title}</h2>
    </div>
  );
}

function Big({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-5xl">{children}</div>;
}

function copy(text: string, ok = "已复制到剪贴板 ✅") {
  navigator.clipboard?.writeText(text).then(
    () => toast.success(ok),
    () => toast.error("复制失败，请手动选中文本复制"),
  );
}

/* ---------- 1. Cover ---------- */

function Cover({ go }: Ctx) {
  return (
    <Big>
      <div className="card-pop relative overflow-hidden px-6 py-14 text-center sm:px-14">
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="mx-auto mb-4 w-fit rounded-full bg-sun/40 p-5 text-6xl"
        >
          🤖
        </motion.div>
        <h1 className="text-5xl font-extrabold sm:text-7xl">什么是智能体？</h1>
        <p className="mt-4 text-2xl font-bold text-primary sm:text-3xl">让 AI 帮我完成一件事</p>
        <p className="mt-2 text-lg text-muted-foreground">45 分钟沉浸互动课件 · 适合 8-15 岁</p>
        <motion.button
          onClick={() => go(1)}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
          className="mt-10 inline-flex items-center gap-3 rounded-full bg-primary px-10 py-5 text-2xl font-extrabold text-primary-foreground shadow-[4px_4px_0_0_var(--ink)]"
        >
          <Play className="size-7" /> 开始上课
        </motion.button>
        <p className="mt-6 text-sm text-muted-foreground">
          提示：用 ← → 或空格翻页，也可以点下方圆点跳转
        </p>
      </div>
    </Big>
  );
}

/* ---------- 2. Journey map ---------- */

const MILESTONES = [
  { emoji: "🎒", t: "遇到难题", d: "春游要怎么安排？", s: SLIDE.situation },
  { emoji: "🆚", t: "分清角色", d: "聊天 AI ≠ 智能体", s: SLIDE.compare },
  { emoji: "🎛️", t: "亲手指挥", d: "填写指挥台下达任务", s: SLIDE.commandCenter },
  { emoji: "🕵️", t: "侦探挑战", d: "找出 AI 的错误并修改", s: SLIDE.detective },
  { emoji: "✅", t: "人类验收", d: "第二版能执行吗？", s: SLIDE.review },
  { emoji: "🚀", t: "造一个它", d: "生成专属智能体", s: SLIDE.factory },
];


function Journey({ go }: Ctx) {
  return (
    <Big>
      <SlideTitle kicker="Journey Map" title="今天的学习地图 🗺️" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MILESTONES.map((m, i) => (
          <motion.button
            key={m.t}
            onClick={() => go(m.s)}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -6 }}
            className="card-soft flex items-start gap-4 p-5 text-left"
          >
            <span className="text-4xl">{m.emoji}</span>
            <div>
              <p className="text-xs font-extrabold text-primary">第 {i + 1} 站</p>
              <p className="text-xl font-extrabold">{m.t}</p>
              <p className="text-sm text-muted-foreground">{m.d}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </Big>
  );
}

/* ---------- 3. Situation ---------- */

function Situation({ go }: Ctx) {
  return (
    <Big>
      <SlideTitle kicker="情境引入" title="🏕️ 麻烦来了：下周要春游" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card-pop p-6">
          <p className="text-xl leading-relaxed">
            老师说：<b>“下周五全班 50 人去春游，每人预算 60 元，当天来回。”</b>
            <br />
            然后……就没有然后了。
          </p>
          <ul className="mt-4 space-y-2 text-lg">
            {[
              "去科技馆还是公园？地铁几号线？几点在校门口集合？",
              "要不要提前预约？学生票多少钱？开放时间到几点？",
              "50 个人怎么分组，谁带队，中午在哪吃？",
              "下雨怎么办？有同学晕车、过敏、走丢了怎么办？",
            ].map((x) => (
              <li key={x} className="flex gap-2">
                <AlertTriangle className="mt-1 size-5 shrink-0 text-accent" /> {x}
              </li>
            ))}
          </ul>

        </div>
        <div className="card-soft flex flex-col justify-center gap-4 bg-secondary/60 p-6">
          <p className="text-2xl font-extrabold">
            👉 一件事要做成，不只需要「答案」，还需要有人
            <span className="text-primary">把事情办完</span>。
          </p>
          <p className="text-lg text-muted-foreground">
            今天我们就要学会：让 AI 从「回答问题」变成「帮我完成一件事」。
          </p>
          <button
            onClick={() => go(3)}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-accent px-6 py-3 text-lg font-extrabold text-accent-foreground"
          >
            我来选个帮手 <ArrowRight className="size-5" />
          </button>
        </div>
      </div>
    </Big>
  );
}

/* ---------- 4. Role voting ---------- */

const ROLES = [
  {
    emoji: "📖",
    t: "百科小书僮",
    d: "你问什么，它答什么。问完就结束。",
    good: false,
    fb: "它知识很多，但不会帮你把春游办完 —— 这是「聊天 AI」。",
  },
  {
    emoji: "🤖",
    t: "会办事的助理",
    d: "先问清楚，再拆步骤，做完还自己检查。",
    good: true,
    fb: "答对啦！这就是「智能体 Agent」：有目标、会行动、能检查、肯改进。",
  },
  {
    emoji: "🪄",
    t: "许愿魔法棒",
    d: "许个愿，一切自动搞定，不用管。",
    good: false,
    fb: "世界上没有这种魔法。AI 会出错，所以人类必须检查和拍板。",
  },
];

const VOTE_KEY = "agent-course-vote-reason";

function RoleVote() {
  const [picked, setPicked] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (typeof window === "undefined") return;
    setReason(window.localStorage.getItem(VOTE_KEY) ?? "");
  }, []);
  return (
    <Big>
      <SlideTitle kicker="角色投票" title="🗳️ 你想要哪一种帮手？" />
      <div className="grid gap-4 md:grid-cols-3">
        {ROLES.map((r, i) => (
          <motion.button
            key={r.t}
            whileHover={{ y: -6 }}
            onClick={() => setPicked(i)}
            className={`card-pop p-6 text-left transition ${
              picked === i ? (r.good ? "bg-grass/20" : "bg-destructive/10") : ""
            }`}
          >
            <div className="text-5xl">{r.emoji}</div>
            <p className="mt-3 text-2xl font-extrabold">{r.t}</p>
            <p className="mt-1 text-base text-muted-foreground">{r.d}</p>
            {picked === i && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 rounded-xl bg-card p-3 text-base font-bold"
              >
                {r.good ? "✅ " : "🤔 "}
                {r.fb}
              </motion.p>
            )}
          </motion.button>
        ))}
      </div>
      <div className="card-soft mx-auto mt-6 max-w-2xl p-5">
        <p className="text-base font-extrabold">✍️ 一句话说说：你为什么这样选？</p>
        <input
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (typeof window !== "undefined")
              window.localStorage.setItem(VOTE_KEY, e.target.value);
          }}
          placeholder="例如：我想要一个会自己检查的帮手"
          className="mt-3 w-full rounded-2xl border-2 border-border bg-card px-4 py-3 text-base outline-none focus:border-primary"
        />
        <p className="mt-2 text-xs text-muted-foreground">只保存在你自己的浏览器里。</p>
      </div>
    </Big>
  );
}


/* ---------- 5. Chat vs Agent ---------- */

function Compare() {
  return (
    <Big>
      <SlideTitle kicker="角色对比" title="💬 聊天 AI vs 🤖 智能体" />
      <div className="grid gap-5 md:grid-cols-2">
        {/* 普通聊天 AI：一问一答就结束 */}
        <div className="card-soft border-t-8 border-t-muted-foreground/40 p-6">
          <h3 className="flex items-center gap-2 text-2xl font-extrabold">
            <MessageSquare className="size-7" /> 普通聊天 AI
          </h3>
          <p className="mt-1 text-sm font-bold text-muted-foreground">你问一句，它答一句</p>

          <div className="mt-5 space-y-3">
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
            >
              🙋 帮我安排春游
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="w-fit max-w-[90%] rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5 text-sm"
            >
              🤖 可以去公园、博物馆、动物园……
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 }}
              className="flex items-center justify-center gap-2 pt-1 text-lg font-extrabold text-muted-foreground"
            >
              🔚 然后……就结束了
            </motion.div>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-3 text-center">
            <MiniTag emoji="🤷" text="没说的它就猜" />
            <MiniTag emoji="📄" text="只回答，不动手" />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            这一页的聊天 AI 只负责回答问题；智能体还会追问、规划、执行和检查。
            现实中的聊天 AI 也可能连上工具去做事，这里只是用「只聊天模式」来做对比。
          </p>

        </div>

        {/* 智能体：目标→追问→步骤→人类拍板 */}
        <div className="card-pop border-t-8 border-t-primary p-6">
          <h3 className="flex items-center gap-2 text-2xl font-extrabold">
            <Bot className="size-7 text-primary" /> AI 智能体 Agent
          </h3>
          <p className="mt-1 text-sm font-bold text-primary">主动把事办完，最后你拍板</p>

          <div className="mt-5 space-y-2.5">
            {[
              { emoji: "🎯", text: "先问清：要什么结果？", c: "bg-sky/15" },
              { emoji: "❓", text: "主动追问：人数？预算？时间？", c: "bg-sun/25" },
              { emoji: "🪜", text: "拆步骤，一步步做", c: "bg-grass/15" },
              { emoji: "🛡️", text: "发现矛盾会喊停", c: "bg-berry/15" },
            ].map((s, i) => (
              <motion.div
                key={s.emoji}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.25 }}
                className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-extrabold ${s.c}`}
              >
                <span className="text-2xl">{s.emoji}</span>
                {s.text}
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.3 }}
              className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-base font-extrabold text-primary-foreground"
            >
              <Gavel className="size-5" /> 最后交给人类拍板
            </motion.div>
          </div>
        </div>
      </div>
    </Big>
  );
}

function MiniTag({ emoji, text }: { emoji: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground">
      <span className="text-base">{emoji}</span> {text}
    </span>
  );
}

/* ---------- 6. Loop diagram ---------- */

const LOOP = [
  { icon: Target, t: "目标 Goal", d: "把事情说清楚：要什么结果", c: "bg-sky/20 text-sky" },
  { icon: ListChecks, t: "行动 Action", d: "拆成一步一步去做", c: "bg-grass/20 text-grass" },
  { icon: Eye, t: "检查 Check", d: "对照限制条件找问题", c: "bg-sun/30 text-accent-foreground" },
  { icon: RefreshCw, t: "改进 Improve", d: "哪里不对就改一版", c: "bg-berry/20 text-berry" },
];

function Loop() {
  return (
    <Big>
      <SlideTitle kicker="工作循环机制" title="🔁 智能体是怎么办事的" />
      <div className="grid gap-4 md:grid-cols-4">
        {LOOP.map((s, i) => (
          <motion.div
            key={s.t}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.25 }}
            className="card-pop p-5 text-center"
          >
            <div className={`mx-auto w-fit rounded-2xl p-4 ${s.c}`}>
              <s.icon className="size-9" />
            </div>
            <p className="mt-3 text-xl font-extrabold">{s.t}</p>
            <p className="text-sm text-muted-foreground">{s.d}</p>
            <p className="mt-2 text-2xl">{i < 3 ? "⬇️" : "🔄"}</p>
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="mx-auto mt-6 max-w-3xl rounded-3xl border-4 border-destructive bg-sun/25 p-6 text-center"
      >
        <p className="inline-flex items-center gap-2 rounded-full bg-destructive px-4 py-1 text-sm font-extrabold text-destructive-foreground">
          <Gavel className="size-4" /> 最后一步 · 人类最终决定
        </p>
        <p className="mt-3 text-2xl font-extrabold">
          AI 可以很能干，但人类必须负责
          <span className="text-destructive">检查、判断和最终决定</span>。
        </p>
      </motion.div>
    </Big>
  );
}

/* ---------- 6.5 Concept quiz ---------- */

const QUIZ = [
  {
    q: "下面哪个是智能体？",
    options: ["闹钟（到点就响）", "能根据天气推荐穿搭、帮你查库存并下单的 AI", "计算器（输入公式出结果）"],
    correct: 1,
    explain: "智能体 = 能感知信息 + 做决策 + 执行动作。闹钟和计算器只做固定动作，不会感知和决策。",
  },
  {
    q: "智能体给出方案后，谁做最后决定？",
    options: ["智能体自己", "人类", "不需要决定"],
    correct: 1,
    explain: "AI 可以很能干，但检查、判断和最终决定必须由人类负责。",
  },
];

function ConceptQuiz({ go }: Ctx) {
  const [answers, setAnswers] = useState<(number | null)[]>(QUIZ.map(() => null));
  const done = answers.every((a, i) => a === QUIZ[i]!.correct);

  return (
    <Big>
      <SlideTitle kicker="概念小测" title="🤔 来测一测：你真的懂了吗？" />
      <p className="mb-4 text-center text-sm font-bold text-muted-foreground">
        选错没关系，可以点「再试一次」重新选。
      </p>
      <div className="mx-auto grid max-w-3xl gap-5">
        {QUIZ.map((item, qi) => {
          const picked = answers[qi];
          const isDone = picked !== null;
          const isCorrect = picked === item.correct;
          const pick = (oi: number | null) =>
            setAnswers((prev) => {
              const next = [...prev];
              next[qi] = oi;
              return next;
            });
          return (
            <motion.div
              key={qi}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: qi * 0.15 }}
              className="card-pop p-6"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xl font-extrabold">
                  {qi + 1}. {item.q}
                </p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                    !isDone
                      ? "bg-secondary text-muted-foreground"
                      : isCorrect
                        ? "bg-grass/25 text-grass"
                        : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {!isDone ? "待作答" : isCorrect ? "已答对 ✅" : "再试一次 🔁"}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {item.options.map((opt, oi) => {
                  const status =
                    isDone && isCorrect
                      ? oi === item.correct
                        ? "correct"
                        : "idle"
                      : isDone && oi === picked
                        ? "wrong"
                        : "idle";
                  return (
                    <motion.button
                      key={oi}
                      disabled={isCorrect}
                      onClick={() => pick(oi)}
                      whileTap={{ scale: isCorrect ? 1 : 0.95 }}
                      whileHover={{ scale: isCorrect ? 1 : 1.03 }}
                      className={`whitespace-normal break-words rounded-2xl border-2 px-4 py-4 text-left text-sm font-bold transition-colors ${
                        status === "correct"
                          ? "border-grass bg-grass/20 text-grass-foreground"
                          : status === "wrong"
                            ? "border-destructive bg-destructive/15 text-destructive"
                            : "border-border bg-card hover:border-primary hover:bg-primary/10"
                      }`}
                    >
                      <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-background text-xs font-extrabold shadow">
                        {String.fromCharCode(65 + oi)}
                      </span>
                      {opt}
                    </motion.button>
                  );
                })}
              </div>
              <AnimatePresence>
                {isDone && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 overflow-hidden rounded-2xl bg-secondary/60 p-4"
                  >
                    <p className="flex items-center gap-2 font-extrabold">
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="size-5 text-grass" /> 答对啦！
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="size-5 text-destructive" /> 再想想
                        </>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {isCorrect ? item.explain : "提示：想一想「会不会自己判断、会不会自己行动」。"}
                    </p>
                    {!isCorrect && (
                      <button
                        onClick={() => pick(null)}
                        className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-extrabold text-primary-foreground"
                      >
                        <RefreshCw className="size-4" /> 再试一次
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-soft flex flex-col items-center gap-4 p-6 text-center"
            >
              <p className="text-2xl font-extrabold">🎉 太棒了！你已经准备好了，去指挥台下达任务吧！</p>
              <motion.button
                onClick={() => go(SLIDE.commandCenter)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-lg font-extrabold text-primary-foreground shadow"
              >
                去指挥台 <ArrowRight className="size-5" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Big>
  );
}


/* ---------- 7. Command center ---------- */


const SAMPLE: Fields = {
  activity: "五年级春游：去上海科技馆",
  count: "50 人（2 位老师带队）",
  limits: "每人 60 元，当天往返，地铁 2 号线，需提前预约学生票，下雨要有备选",
};

export function CommandCenter({ fields, setField, go, flow, setFlow }: Ctx) {
  const warnings = detectConflicts(fields);
  const filled = Object.values(fields).some((v) => v.trim());
  const complete = fields.activity.trim() && fields.count.trim() && fields.limits.trim();

  const submit = () => {
    if (!fields.activity.trim()) {
      toast.error("请先写清楚活动是什么");
      return;
    }
    if (!fields.count.trim()) {
      toast.error("请写上一共有多少人");
      return;
    }
    if (!fields.limits.trim()) {
      toast.error("请写一条限制条件，比如预算或时间");
      return;
    }
    setFlow(
      flow.baseline
        ? {
            state: flow.approved ? "approved" : "rerunning",
            unlocked: Math.max(flow.unlocked, SLIDE.execution),
          }
        : {
            baseline: { ...fields },
            state: "running",
            unlocked: Math.max(flow.unlocked, SLIDE.execution),
          },
    );
    go(SLIDE.execution);
  };

  return (
    <Big>
      <SlideTitle kicker="指挥台 Command Center" title="🎛️ 轮到你来下达任务" />
      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="card-pop space-y-5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-secondary/70 p-3">
            <p className="text-sm font-bold">
              灰色的字只是<b>示例</b>，下面三格要写<b>你自己的任务</b>。
            </p>
            <button
              onClick={() => {
                setField("activity", SAMPLE.activity);
                setField("count", SAMPLE.count);
                setField("limits", SAMPLE.limits);
                toast.success("已载入示例任务，可以随便改成你自己的 ✏️");
              }}
              className="rounded-full bg-card px-4 py-2 text-sm font-extrabold shadow"
            >
              加载示例任务
            </button>
          </div>
          <VoiceInput
            emoji="🎪"
            label="活动是什么"
            placeholder="示例：五年级春游：去上海科技馆"
            value={fields.activity}
            onChange={(v) => setField("activity", v)}
          />
          <VoiceInput
            emoji="👥"
            label="有多少人"
            placeholder="示例：50 人（2 位老师带队）"
            value={fields.count}
            onChange={(v) => setField("count", v)}
          />
          <VoiceInput
            emoji="🚧"
            label="限制条件 / 预算"
            placeholder="示例：每人 60 元，当天往返，地铁 2 号线，需要预约"
            value={fields.limits}
            onChange={(v) => setField("limits", v)}
            multiline
          />
          <p className="text-sm text-muted-foreground">
            🎙️ 课堂上建议直接打字。课后在家可以点麦克风用说的；没有麦克风或不给权限时，打字一样能完成。
          </p>
        </div>

        <div className="space-y-4">
          <div className="card-soft p-5">
            <h3 className="flex items-center gap-2 text-xl font-extrabold">
              <ShieldCheck className="size-6 text-primary" /> 冲突与漏洞检测器
            </h3>
            <AnimatePresence mode="popLayout">
              {warnings.length === 0 ? (
                <motion.p
                  key="ok"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 rounded-xl bg-grass/15 p-3 text-base font-bold"
                >
                  {filled ? "✅ 暂时没发现矛盾，可以交给智能体啦！" : "先填一项，我来帮你挑毛病 👀"}
                </motion.p>
              ) : (
                <motion.ul key="warn" className="mt-3 space-y-2">
                  {warnings.map((w) => (
                    <motion.li
                      key={w}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="rounded-xl bg-destructive/10 p-3 text-base font-medium"
                    >
                      {w}
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {filled && (
            <div className="card-soft p-5">
              <p className="text-sm font-extrabold text-primary">我的任务摘要</p>
              <p className="mt-2 text-sm font-medium">
                🎪 {fields.activity || "（还没写活动）"}
                <br />👥 {fields.count || "（还没写人数）"}
                <br />🚧 {fields.limits || "（还没写限制）"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">写错了可以直接在左边改。</p>
            </div>
          )}

          <button
            onClick={submit}
            className="w-full rounded-3xl bg-primary px-6 py-5 text-2xl font-extrabold text-primary-foreground shadow-[4px_4px_0_0_var(--ink)] transition hover:brightness-110"
          >
            🚀 交给智能体办事
          </button>

          {!complete && (
            <p className="text-center text-sm text-muted-foreground">
              三格都写上，智能体才知道要做什么
            </p>
          )}
        </div>
      </div>
    </Big>
  );
}


/* ---------- 8. Execution animation ---------- */

type RunStep = { emoji: string; t: string; d: string; lines: string[] };

function makeRun(fields: Fields, theme: AgentTheme): RunStep[] {
  const activity = fields.activity.trim() || theme.activity;
  const count = fields.count.trim() || theme.count;
  const limits = fields.limits.trim() || theme.limits;
  const all = `${activity} ${count} ${limits}`;

  const num = Number((count.match(/\d+/) ?? ["0"])[0]) || 0;
  const moneyM = limits.match(/(\d+(?:\.\d+)?)\s*(?:元|块|¥)/);
  const money = moneyM ? Number(moneyM[1]) : 0;
  const perHeadDeclared = /每人|人均/.test(limits) && money > 0;
  const perHead = money > 0 && num > 0 ? (perHeadDeclared ? money : money / num) : 0;
  const total = perHead > 0 && num > 0 ? perHead * num : 0;

  const timeM = limits.match(/(\d+)\s*(小时|分钟|天)/);
  const clockM = limits.match(/\d{1,2}\s*[:：]\s*\d{2}/g);

  const hasPlace = /地点|公园|博物馆|操场|教室|图书|体育馆|馆|校|山|园/.test(all);
  const hasTime = /\d\s*(点|[:：]|小时|分钟|天|周|号|月)|上午|下午|早上|晚上|当天/.test(all);
  const hasHuman = /老师|家长|签字|确认|审核|批准|复核|委员/.test(limits);
  const hasSafety = /安全|过敏|急救|受伤|晕车|应急|风险|明火|防/.test(all);

  const missing: string[] = [];
  if (!hasPlace) missing.push("地点：在哪里进行？");
  if (!hasTime) missing.push("时间：几点开始、几点结束？");
  if (money === 0 && /预算|费|钱/.test(limits) === false) missing.push("预算：每人可以花多少钱？");
  if (!hasHuman) missing.push("负责人：谁做最后检查和签字？");
  if (!hasSafety) missing.push("安全：有没有需要特别注意的情况？");
  if (num === 0) missing.push("人数：一共多少人？（现在读不出数字）");

  const groups = num > 0 ? Math.max(1, Math.ceil(num / 10)) : 0;

  const checks: string[] = [];
  if (perHead > 0) {
    checks.push(
      perHead < 5
        ? `❌ 人均 ${perHead.toFixed(1)} 元过低，买不到水和门票，需要提高预算或减少支出项`
        : `✅ 人均 ${perHead.toFixed(1)} 元${total ? `，${num} 人合计约 ${total.toFixed(0)} 元` : ""}，可覆盖基础开销`,
    );
  } else {
    checks.push("⚠️ 限制条件里读不到金额，无法核算花费");
  }
  checks.push(
    num > 0
      ? num > 200
        ? `❌ ${num} 人规模过大，必须分批次并增加带队人手`
        : `✅ ${num} 人可编 ${groups} 组，每组约 ${Math.ceil(num / groups)} 人`
      : "⚠️ 没有人数，无法分组与备料",
  );
  checks.push(
    hasSafety
      ? "✅ 已读到安全相关要求，会写进应急预案"
      : "❌ 没有安全说明，需补走失/受伤/天气三条预案",
  );
  checks.push(
    hasHuman ? "✅ 已识别人类负责人，最终方案会留签字位" : "❌ 没有指定负责人，默认交老师签字",
  );

  return [
    {
      emoji: "🎧",
      t: "听清任务要求",
      d: "把你在指挥台写的原话逐条读进来",
      lines: [
        `活动 = ${activity}`,
        `人数 = ${count}${num ? `（识别为 ${num} 人）` : "（没读到数字）"}`,
        `限制 = ${limits}`,
      ],
    },
    {
      emoji: "🔍",
      t: "找出缺少的信息",
      d: missing.length ? `发现 ${missing.length} 处空白，先问清楚` : "关键信息齐全，无需追问",
      lines: missing.length ? missing : ["地点、时间、预算、负责人、安全都已给出 ✅"],
    },
    {
      emoji: "📝",
      t: "拆解行动计划",
      d: `按 ${activity} 生成三步`,
      lines: [
        `第 1 步：确认${hasPlace ? "地点与集合点" : "地点（待你补充）"}，通知${count}并统计特殊情况`,
        `第 2 步：${num ? `分 ${groups} 组，每组约 ${Math.ceil(num / groups)} 人，` : ""}排出${
          clockM ? `${clockM[0]} 起的` : timeM ? `${timeM[0]}内的` : ""
        }时间表与分工`,
        `第 3 步：${perHead > 0 ? `按人均 ${perHead.toFixed(0)} 元` : "按你确认的预算"}备料结算，并记录实际用时`,
      ],
    },
    {
      emoji: "🛡️",
      t: "做安全与常识检查",
      d: "拿你的数字算一遍，能不能站得住",
      lines: checks,
    },
    {
      emoji: "✨",
      t: "生成最终执行方案",
      d: "交给人类检查签字",
      lines: [
        `《${activity}执行方案》｜${count}${num ? `／${groups} 组` : ""}${
          perHead > 0 ? `｜人均 ${perHead.toFixed(0)} 元` : ""
        }`,
        missing.length
          ? `⚖️ 仍有 ${missing.length} 项待你确认，未确认前不算完成`
          : "⚖️ 请检查后回复「通过」，我才算完成",
      ],
    },
  ];
}

function Execution({ fields, theme, go, flow, setFlow }: Ctx) {
  const sig = `${fields.activity}|${fields.count}|${fields.limits}|${theme.id}`;
  const steps = useMemo(() => makeRun(fields, theme), [sig]); // eslint-disable-line react-hooks/exhaustive-deps
  const [n, setN] = useState(0);
  useEffect(() => setN(0), [sig]);
  useEffect(() => {
    if (n >= steps.length) return;
    const id = window.setTimeout(() => setN((x) => x + 1), 1100);
    return () => window.clearTimeout(id);
  }, [n, steps.length]);

  const holes = steps[1]!.lines.filter((l) => !l.includes("✅"));
  const badChecks = steps[3]!.lines.filter((l) => l.startsWith("❌") || l.startsWith("⚠️"));
  const isRerun = flow.state === "rerunning" || flow.approved;
  const done = n >= steps.length;

  useEffect(() => {
    if (!done) return;
    if (flow.approved) return;
    setFlow({
      state: holes.length + badChecks.length > 0 ? "needs_fix" : "rerunning",
      unlocked: Math.max(flow.unlocked, isRerun ? SLIDE.review : SLIDE.detective),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, sig]);

  return (
    <Big>
      <SlideTitle
        kicker="办事过程"
        title={isRerun ? "⚙️ 智能体正在跑第二版…" : "⚙️ 智能体正在办事…"}
      />
      <div className="card-pop p-6">
        <p className="mb-4 rounded-xl bg-secondary p-3 text-base">
          任务：<b>{fields.activity || theme.activity || "（未填写活动）"}</b>｜人数：
          <b>{fields.count || theme.count || "（未填写）"}</b>｜限制：
          <b>{fields.limits || theme.limits || "（未填写）"}</b>
        </p>
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <motion.li
              key={s.t}
              animate={{ opacity: i < n ? 1 : 0.25, x: i < n ? 0 : -12 }}
              className="rounded-2xl border-2 border-border p-4"
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{s.emoji}</span>
                <div className="flex-1">
                  <p className="text-xl font-extrabold">{s.t}</p>
                  <p className="text-sm text-muted-foreground">{s.d}</p>
                </div>
                {i < n ? (
                  <CheckCircle2 className="size-7 text-grass" />
                ) : (
                  <span className="text-sm text-muted-foreground">等待中</span>
                )}
              </div>
              {i < n && (
                <motion.ul
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 space-y-1.5 overflow-hidden pl-12"
                >
                  {s.lines.map((l) => (
                    <li key={l} className="rounded-xl bg-muted px-3 py-2 text-sm font-medium">
                      {l}
                    </li>
                  ))}
                </motion.ul>
              )}
            </motion.li>
          ))}
        </ol>

        {done && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-soft mt-5 space-y-4 p-5"
          >
            <p className="text-2xl font-extrabold">
              {isRerun ? "🔁 第二版方案已生成" : "📄 第一版方案已生成，等待人类检查"}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl bg-destructive/10 p-3">
                <p className="text-sm font-extrabold text-destructive">
                  缺少的信息 {holes.length} 处
                </p>
                <ul className="mt-1 space-y-1 text-sm font-medium">
                  {holes.length ? (
                    holes.map((h) => <li key={h}>· {h}</li>)
                  ) : (
                    <li>· 关键信息都齐了 ✅</li>
                  )}
                </ul>
              </div>
              <div className="rounded-2xl bg-sun/25 p-3">
                <p className="text-sm font-extrabold">检查没过的地方 {badChecks.length} 处</p>
                <ul className="mt-1 space-y-1 text-sm font-medium">
                  {badChecks.length ? (
                    badChecks.map((h) => <li key={h}>· {h}</li>)
                  ) : (
                    <li>· 预算、人数、安全都算得过来 ✅</li>
                  )}
                </ul>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => go(SLIDE.detective)}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-lg font-extrabold text-primary-foreground shadow-[4px_4px_0_0_var(--ink)]"
              >
                <Search className="size-5" /> 去侦探模式找漏洞
              </button>
              {isRerun && (
                <button
                  onClick={() => go(SLIDE.review)}
                  className="inline-flex items-center gap-2 rounded-full bg-grass px-6 py-3 text-lg font-extrabold text-ink"
                >
                  <ClipboardCheck className="size-5" /> 去验收台
                </button>
              )}
              <button
                onClick={() => setN(0)}
                className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-3 font-extrabold"
              >
                <RefreshCw className="size-5" /> 重新播放
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </Big>
  );
}


/* ---------- 9. Detective ---------- */

type DCase = {
  title: string;
  ai: string;
  steps: [
    { hint: string; answer: string },
    { hint: string; answer: string },
    { hint: string; answer: string },
  ];
  fixField: keyof Fields;
  fixValue: string;
  fixLabel: string;
};

function makeCases(fields: Fields, theme: AgentTheme): DCase[] {
  const activity = fields.activity.trim() || theme.activity;
  const count = fields.count.trim() || theme.count;
  const limits = fields.limits.trim() || theme.limits;
  const all = `${activity} ${count} ${limits}`;

  const num = Number((count.match(/\d+/) ?? ["0"])[0]) || 0;
  const moneyM = limits.match(/(\d+(?:\.\d+)?)\s*(?:元|块|¥)/);
  const money = moneyM ? Number(moneyM[1]) : 0;
  const perHeadDeclared = /每人|人均/.test(limits) && money > 0;
  const perHead = money > 0 && num > 0 ? (perHeadDeclared ? money : money / num) : 0;

  const hasPlace =
    /地点|在.{0,6}(公园|馆|校|室|场|山|园|教室|操场)|公园|博物馆|操场|教室|图书|体育馆/.test(all);
  const hasTime = /\d\s*(点|:|：|小时|分钟|天|周|号|月)|上午|下午|早上|晚上|当天|截止/.test(all);
  const hasMoney = money > 0 || /预算|费用|元|块|免费|不花钱/.test(limits);
  const hasHuman = /老师|家长|签字|确认|审核|批准|复核|值日|委员/.test(limits);
  const hasSafety = /安全|过敏|急救|受伤|晕车|应急|风险|防/.test(all);
  const hasGroup = /分组|小组|每组|人一组|组长|分工/.test(all);

  const q = (s: string) => `「${s}」`;
  const src = `你在指挥台写的是${q(`${activity}｜${count}｜${limits}`)}`;

  type Cand = { key: string; score: number; make: () => DCase };
  const pool: Cand[] = [];

  // 1. 缺地点
  pool.push({
    key: "place",
    score: hasPlace ? 10 : 100,
    make: () => ({
      title: "案件：消失的地点",
      ai: `${activity}方案：${hasTime ? "按你说的时间" : "早上 8:00"}集合出发，中途休息用餐，结束后原路返回。参加人数 ${count}。`,
      steps: [
        {
          hint: "读一遍 AI 的方案。时间有吗？人数有吗？地点在哪里？",
          answer: `🔍 AI 只说了时间和人数，没说地点。📍 没有地点，算不出路程和门票。`,
        },
        {
          hint: "只问「去哪」不够。要让 AI 给可比较的答案，问题里还要加什么？",
          answer: `❓ 问：「${activity}具体在哪里？给我 2 个备选，写清路程和门票。」`,
        },
        {
          hint: "把谈好的结果写回指挥台，方案才算改好。",
          answer: "✏️ 把地点和路程时间补进限制条件。",
        },
      ],
      fixField: "limits",
      fixValue: `${limits}${limits ? "；" : ""}地点：城郊森林公园（车程 40 分钟，无门票）`,
      fixLabel: "补上地点：城郊森林公园",
    }),
  });

  // 2. 钱算不过来
  const aiTreatedPerHeadAsTotal = perHead >= 5;
  const fakeTotal = aiTreatedPerHeadAsTotal
    ? Math.round(perHead)
    : Math.max(5, Math.round(num > 0 ? num * 0.4 : 20));
  pool.push({
    key: "money",
    score: hasMoney && perHead < 5 ? 100 : hasMoney ? 60 : 30,
    make: () => ({
      title: aiTreatedPerHeadAsTotal ? "案件：人均预算被当成总预算" : "案件：算不过来的钱",
      ai: `${count}参加${activity}，总预算 ${fakeTotal} 元，安排门票 + 午餐 + 往返交通，保证人人都有份。`,
      steps: [
        {
          hint: aiTreatedPerHeadAsTotal
            ? "线索藏在单位里。把人数和预算放一起，算一算人均多少。"
            : "线索藏在数字里。把人数和预算放一起，算一算人均多少。",
          answer: aiTreatedPerHeadAsTotal
            ? `🔍 ${count}有 ${num > 0 ? num : "?"} 人，总预算才 ${fakeTotal} 元，人均约 ${num > 0 ? (fakeTotal / num).toFixed(2) : "?"} 元。📉 AI 把「每人预算」当成了「总预算」。`
            : `🔍 ${count}只有 ${fakeTotal} 元${num > 0 ? `，人均约 ${(fakeTotal / num).toFixed(2)} 元` : ""}。💸 这点钱连水都买不到。`,
        },
        {
          hint: aiTreatedPerHeadAsTotal
            ? "别直接说「你算错了」。让 AI 自己把账目摊开。"
            : "让 AI 列出花费清单，比让它道歉有用。",
          answer: aiTreatedPerHeadAsTotal
            ? `❓ 问：「这是每人预算还是全班总预算？请按 ${count} 重新核算并列出清单。」`
            : `❓ 问：「这是每人还是总预算？请列出门票/午餐/交通各多少。」`,
        },
        {
          hint: "把真实预算写回指挥台，AI 才会守着它。",
          answer: aiTreatedPerHeadAsTotal
            ? `✏️ 写进限制条件：每人 ${perHead.toFixed(0)} 元，全班约 ${num > 0 ? (perHead * num).toFixed(0) : "?"} 元。`
            : `✏️ 写进限制条件：每人预算 ${perHead > 0 ? perHead.toFixed(0) : 60} 元。`,
        },
      ],
      fixField: "limits",
      fixValue: aiTreatedPerHeadAsTotal
        ? `每人预算 ${perHead.toFixed(0)} 元，全班总预算约 ${num > 0 ? (perHead * num).toFixed(0) : "?"} 元（含交通与门票）`
        : `每人预算 ${perHead > 0 ? perHead.toFixed(0) : 60} 元（含交通与门票）${
            limits && !perHeadDeclared ? `；${limits}` : ""
          }`,
      fixLabel: aiTreatedPerHeadAsTotal
        ? `改成：每人 ${perHead.toFixed(0)} 元，全班约 ${num > 0 ? (perHead * num).toFixed(0) : "?"} 元`
        : `改成：每人预算 ${perHead > 0 ? perHead.toFixed(0) : 60} 元`,
    }),
  });

  // 3. 没有人类检查点
  pool.push({
    key: "human",
    score: hasHuman ? 10 : 100,
    make: () => ({
      title: "案件：没人负责的方案",
      ai: `${activity}安排已生成，AI 将自动通知全部 ${count}、直接下单物资，并在当天自行调整流程，无需再确认。`,
      steps: [
        {
          hint: "读一遍方案。出现过「人」吗？谁最后拍板？",
          answer: `🔍 方案写「自动下单、自行调整、无需确认」。🚫 没有一个人类检查点。`,
        },
        {
          hint: "AI 很能干，但最终决定权归谁？把它变成要求。",
          answer: `❓ 问：「${activity}哪一步必须老师签字？请分『AI 能做』和『必须人确认』两栏。」`,
        },
        {
          hint: "把人类确认规则写进指挥台。",
          answer: "✏️ 加上：所有通知和花钱步骤，必须老师确认后执行。",
        },
      ],
      fixField: "limits",
      fixValue: `${limits}${limits ? "；" : ""}所有通知与花钱的步骤必须由老师确认后才执行`,
      fixLabel: "补上：人类最终确认规则",
    }),
  });

  // 4. 缺安全 / 特殊情况
  pool.push({
    key: "safety",
    score: hasSafety ? 10 : 100,
    make: () => ({
      title: "案件：被忽略的安全",
      ai: `${activity}流程：${count}全员一起行动，按顺序完成每个环节，遇到情况现场随机应变即可。`,
      steps: [
        {
          hint: "想想现场：有人过敏、走丢、下雨。方案写了吗？",
          answer: `🔍 方案只写顺利时怎么做，没写出事怎么办。⚠️ 「随机应变」等于没有预案。`,
        },
        {
          hint: "问「安全吗」太虚。要问：谁在什么时候做什么？",
          answer: `❓ 问：「请列出 3 个风险场景。每个写清：谁负责、第一步做什么、联系谁。」`,
        },
        {
          hint: "把安全要求写回指挥台，下一版才会落实。",
          answer: "✏️ 加上：登记过敏情况，写出走失/受伤/天气应急预案。",
        },
      ],
      fixField: "limits",
      fixValue: `${limits}${limits ? "；" : ""}需提前登记过敏与身体情况，并写出走失/受伤/天气三种应急预案`,
      fixLabel: "补上：安全与应急预案",
    }),
  });

  // 5. 人数对不上 / 没分组
  pool.push({
    key: "group",
    score: num > 0 && !hasGroup ? 85 : 45,
    make: () => ({
      title: "案件：对不上的人数",
      ai: `${activity}：把大家分成 4 组，每组 8 人，同时进行不同任务，人人都有事做。`,
      steps: [
        {
          hint: "算一算：4 组 × 8 人 = 32 人。和你写的人数对得上吗？",
          answer: `🔍 4×8=32 人。和你写的人数不一致。📊 分组错了，物资和分工都会错。`,
        },
        {
          hint: "让 AI 把分组算式写出来，自己检查。",
          answer: `❓ 问：「请按 ${count} 重新分组。写出：组数×每组人数=总人数的算式。」`,
        },
        {
          hint: "把分组规则写回指挥台。",
          answer: "✏️ 加上：按实际人数分组，每组指定 1 名组长。",
        },
      ],
      fixField: "limits",
      fixValue: `${limits}${limits ? "；" : ""}按 ${count} 分组，每组指定 1 名组长，并写出分组算式`,
      fixLabel: "补上：分组与组长规则",
    }),
  });

  // 6. 缺时间
  pool.push({
    key: "time",
    score: hasTime ? 10 : 100,
    make: () => ({
      title: "案件：糊涂的时间表",
      ai: `${activity}：先做准备工作，然后开始活动，做完就结束，${count}都参加。`,
      steps: [
        {
          hint: "你能知道几点集合吗？对照限制条件，时间在哪？",
          answer: `🔍 「先准备，再开始，后结束」全是模糊词。⏰ 没有时间点，现场会乱。`,
        },
        {
          hint: "给 AI 一个时间格式，它才能输出你要的样子。",
          answer: `❓ 问：「请做成时间表。每行写『几点—几点｜做什么｜谁负责』。」`,
        },
        {
          hint: "把确定的时间写回指挥台。",
          answer: "✏️ 加上：开始与结束时间，再留 10 分钟机动。",
        },
      ],
      fixField: "limits",
      fixValue: `${limits}${limits ? "；" : ""}时间：09:00 开始，12:00 前结束（含 10 分钟机动）`,
      fixLabel: "补上：具体起止时间",
    }),
  });

  return pool
    .map((c, idx) => ({ ...c, idx }))
    .sort((a, b) => b.score - a.score || a.idx - b.idx)
    .slice(0, 2)
    .map((c, k) => {
      const d = c.make();
      return { ...d, title: `案件${["一", "二"][k]}：${d.title.replace(/^案件[：:]/, "")}` };
    });
}

function Detective({ fields, theme, setField, go, setFlow }: Ctx) {
  const sig = `${fields.activity}|${fields.count}|${fields.limits}|${theme.id}`;
  const cases: DCase[] = useMemo(() => makeCases(fields, theme), [sig]); // eslint-disable-line react-hooks/exhaustive-deps
  const [i, setI] = useState(0);
  // progress: 每一步两次点击（0=未开始, 奇数=看到提示, 偶数=看到答案）
  const [p, setP] = useState(0);
  const [done, setDone] = useState<Record<number, string>>({});
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  useEffect(() => {
    setI(0);
    setP(0);
    setDone({});
    setEditing(false);
  }, [cases]);
  const c = cases[i] ?? cases[0]!;
  const allDone = cases.every((_, k) => done[k]);

  const apply = (value: string, label: string) => {
    setField(c.fixField, value);
    setDone((d) => ({ ...d, [i]: label }));
    setEditing(false);
    toast.success("已写回指挥台 ✅");
  };

  return (
    <Big>
      <SlideTitle kicker="侦探模式" title="🕵️ 抓出 AI 的毛病" />
      <p className="mb-4 text-center text-sm font-bold text-muted-foreground">
        今天我们抓 2 个案件。每一步点两次：先想，再看答案。修改由你来决定要不要采纳。
      </p>

      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {cases.map((x, k) => (
          <button
            key={x.title}
            onClick={() => {
              setI(k);
              setP(0);
              setEditing(false);
            }}
            className={`rounded-full px-4 py-2 font-bold ${
              k === i ? "bg-primary text-primary-foreground" : "bg-secondary"
            }`}
          >
            {done[k] ? "✅ " : ""}
            {x.title}
          </button>
        ))}
      </div>
      <div className="card-pop p-6">
        <div className="rounded-2xl bg-muted p-4">
          <p className="mb-1 flex items-center gap-2 text-sm font-extrabold text-muted-foreground">
            <Bot className="size-4" /> AI 给出的方案
          </p>
          <p className="text-lg">{c.ai}</p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[Search, MessageSquare, Wand2].map((Icon, k) => {
            const seenHint = p >= k * 2 + 1;
            const seenAnswer = p >= k * 2 + 2;
            const active = p === k * 2 || p === k * 2 + 1;
            return (
              <motion.button
                key={k}
                disabled={!active}
                onClick={() => setP(p + 1)}
                whileHover={{ y: active ? -4 : 0 }}
                whileTap={{ scale: active ? 0.97 : 1 }}
                className={`rounded-2xl border-2 p-4 text-left transition ${
                  seenAnswer
                    ? "border-grass bg-grass/15"
                    : active
                      ? "border-primary bg-primary/10"
                      : "border-border opacity-40"
                }`}
              >
                <Icon className="mb-2 size-6" />
                <p className="font-extrabold">
                  {["第 1 步 找出来 🔍", "第 2 步 问一问 ❓", "第 3 步 改一改 ✏️"][k]}
                </p>
                {seenHint && (
                  <p className="mt-2 rounded-xl bg-card/70 p-2 text-sm">💭 {c.steps[k]!.hint}</p>
                )}
                {seenAnswer ? (
                  <p className="mt-2 text-sm font-bold">{c.steps[k]!.answer}</p>
                ) : (
                  active && (
                    <p className="mt-2 text-xs font-extrabold text-primary">
                      {seenHint ? "👉 再点一次，看看答案" : "👉 点一下，先看思考提示"}
                    </p>
                  )
                )}
              </motion.button>
            );
          })}
        </div>

        {p >= 6 && !done[i] && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 space-y-3 rounded-2xl bg-sun/25 p-4"
          >
            <p className="flex items-center gap-2 text-lg font-extrabold">
              <Lightbulb className="size-5" /> AI 的修改建议（要不要采纳，你说了算）
            </p>
            <p className="rounded-xl bg-card p-3 text-base font-medium">{c.fixValue}</p>
            {editing ? (
              <div className="space-y-3">
                <textarea
                  value={draft}
                  rows={3}
                  onChange={(e) => setDraft(e.target.value)}
                  className="w-full resize-none rounded-2xl border-2 border-border bg-card px-4 py-3 outline-none focus:border-primary"
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => apply(draft, "你自己改的版本")}
                    className="rounded-full bg-primary px-5 py-2.5 font-extrabold text-primary-foreground"
                  >
                    保存我的修改
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="rounded-full bg-secondary px-5 py-2.5 font-bold"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => apply(c.fixValue, c.fixLabel)}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-extrabold text-primary-foreground"
                >
                  <CheckCircle2 className="size-5" /> 采纳这条修改
                </button>
                <button
                  onClick={() => {
                    setDraft(c.fixValue);
                    setEditing(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 font-bold"
                >
                  <Wand2 className="size-5" /> 我自己编辑
                </button>
              </div>
            )}
          </motion.div>
        )}

        {done[i] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-grass/15 p-4"
          >
            <ClipboardCheck className="size-6 text-grass" />
            <p className="font-bold">
              变更摘要：{done[i]} —— 已写回指挥台，你就是那个「负责检查的人类」！
            </p>
            <button
              onClick={() => go(SLIDE.commandCenter)}
              className="rounded-full bg-secondary px-4 py-2 font-bold"
            >
              回指挥台看看
            </button>
            {i < cases.length - 1 && (
              <button
                onClick={() => {
                  setI(i + 1);
                  setP(0);
                }}
                className="rounded-full bg-primary px-4 py-2 font-bold text-primary-foreground"
              >
                下一个案件 →
              </button>
            )}
            {allDone && (
              <button
                onClick={() => {
                  setFlow({ state: "rerunning" });
                  go(SLIDE.execution);
                }}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-extrabold text-primary-foreground shadow-[4px_4px_0_0_var(--ink)]"
              >
                <RefreshCw className="size-5" /> 带着修改结果去重新运行
              </button>
            )}
          </motion.div>
        )}
      </div>
    </Big>
  );
}

/* ---------- 11. 验收台 ---------- */

const CHECKLIST = [
  { id: "goal", t: "目标和人数是否一致？" },
  { id: "when", t: "时间和地点是否明确？" },
  { id: "money", t: "预算是否算得过来？" },
  { id: "safe", t: "安全风险是否有预案？" },
  { id: "human", t: "有没有老师 / 家长做最终确认？" },
];

function Review({ fields, flow, setFlow, go }: Ctx) {
  const before = flow.baseline ?? { activity: "", count: "", limits: "" };
  const toggle = (id: string) =>
    setFlow({
      checks: flow.checks.includes(id)
        ? flow.checks.filter((x) => x !== id)
        : [...flow.checks, id],
    });
  const allChecked = CHECKLIST.every((c) => flow.checks.includes(c.id));

  const Row = ({ label, a, b }: { label: string; a: string; b: string }) => (
    <div className="rounded-2xl border-2 border-border p-3">
      <p className="text-xs font-extrabold text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm line-through opacity-60">{a || "（第一版没写）"}</p>
      <p className="mt-1 text-sm font-bold text-grass">{b || "（还没补上）"}</p>
    </div>
  );

  return (
    <Big>
      <SlideTitle kicker="验收台" title="✅ 这份方案能执行吗？" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card-pop space-y-3 p-6">
          <p className="text-xl font-extrabold">修改前 → 修改后</p>
          <Row label="活动" a={before.activity} b={fields.activity} />
          <Row label="人数" a={before.count} b={fields.count} />
          <Row label="限制条件" a={before.limits} b={fields.limits} />
        </div>

        <div className="card-pop space-y-3 p-6">
          <p className="text-xl font-extrabold">人类检查清单</p>
          {CHECKLIST.map((c) => {
            const on = flow.checks.includes(c.id);
            return (
              <motion.button
                key={c.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => toggle(c.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left font-bold transition ${
                  on ? "border-grass bg-grass/15" : "border-border"
                }`}
              >
                {on ? (
                  <CheckCircle2 className="size-6 text-grass" />
                ) : (
                  <AlertTriangle className="size-6 text-muted-foreground" />
                )}
                {c.t}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => go(SLIDE.commandCenter)}
          className="rounded-full bg-secondary px-5 py-3 font-extrabold"
        >
          继续修改
        </button>
        <button
          onClick={() => {
            setFlow({ state: "rerunning" });
            go(SLIDE.execution);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 font-extrabold text-accent-foreground"
        >
          <RefreshCw className="size-5" /> 重新运行
        </button>
        <button
          onClick={() => {
            if (!allChecked) {
              toast.error("先把 5 项都检查一遍再通过哦");
              return;
            }
            setFlow({ approved: true, state: "approved", unlocked: SLIDE.homework });
            toast.success("已完成人类验收 🎉");
            go(SLIDE.scenes);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-lg font-extrabold text-primary-foreground shadow-[4px_4px_0_0_var(--ink)] disabled:opacity-50"
        >
          <Gavel className="size-5" /> 我检查过了，通过
        </button>
      </div>
      <p className="mt-3 text-center text-sm font-bold text-muted-foreground">
        {flow.approved ? "🎫 已完成人类验收" : `已检查 ${flow.checks.length} / ${CHECKLIST.length} 项`}
      </p>
    </Big>
  );
}


/* ---------- 12. Scene creator / 方法封装 ---------- */

const RULES = [
  { k: "目标 Goal", v: "帮我完成一件具体的事。" },
  { k: "行动 Action", v: "先收集信息，再拆成步骤。" },
  { k: "检查 Check", v: "检查预算、人数、安全和遗漏。" },
  { k: "人类决定 Sign-off", v: "花钱、通知、出行，必须老师或家长确认。" },
];

function Scenes({ theme, applyTheme, go, flow }: Ctx) {
  return (
    <Big>
      <SlideTitle kicker="方法封装" title="🎨 把这套办事方法换到另一个场景" />
      <div className="card-soft mb-5 p-5">
        <p className="text-base font-bold">
          刚才我们不只是完成了一次春游，而是教会了 AI 一套办事方法。现在把这套方法保存下来，以后可以重复使用。
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {RULES.map((r) => (
            <div key={r.k} className="rounded-2xl bg-secondary p-3">
              <p className="text-sm font-extrabold text-primary">{r.k}</p>
              <p className="text-sm">{r.v}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {THEMES.map((t, i) => (
          <motion.button
            key={t.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -6 }}
            onClick={() => {
              applyTheme(t);
              toast.success(`已套用「${t.name}」，没有覆盖你已经改过的内容`);
            }}
            className={`card-pop bg-gradient-to-br p-5 text-left ${t.tint} ${
              theme.id === t.id ? "ring-4 ring-primary" : ""
            }`}
          >
            <div className="text-4xl">{t.emoji}</div>
            <p className="mt-2 text-xl font-extrabold">{t.name}</p>
            <p className="text-xs font-bold text-muted-foreground">{t.en}</p>
            <p className="mt-2 line-clamp-2 text-sm">{t.card.goal}</p>
          </motion.button>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <span className="rounded-full bg-secondary px-4 py-2 font-bold">
          当前主题：{theme.emoji} {theme.name}
        </span>
        <button
          onClick={() => {
            if (!flow.approved) {
              toast.error("先去验收台点「我检查过了，通过」");
              go(SLIDE.review);
              return;
            }
            go(SLIDE.factory);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-lg font-extrabold text-primary-foreground shadow-[4px_4px_0_0_var(--ink)]"
        >
          {flow.approved ? "去创建智能体" : "🔒 先完成人类验收"} <ArrowRight className="size-5" />
        </button>
      </div>
    </Big>
  );
}

/* ---------- 13. 智能体工厂（实时生成） ---------- */

function Factory({ card, setCard, fields, theme, flow }: Ctx) {
  return (
    <Big>
      <div className="card-soft mb-4 flex flex-wrap items-center gap-3 p-4">
        <Sparkle className="size-5 text-primary" />
        <p className="text-sm font-bold">
          {flow.approved
            ? "指令卡已继承你刚才验收通过的任务：目标 → 行动 → 检查 → 人类决定。"
            : "还没完成人类验收，指令卡先用当前指挥台的内容，验收后会更准确。"}
        </p>
      </div>
      <AgentFactory card={card} setCard={setCard} fields={fields} theme={theme} />
    </Big>
  );
}


function Field({
  label,
  value,
  onChange,
  area,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  area?: boolean;
}) {
  return (
    <div>
      <p className="mb-2 text-lg font-bold">{label}</p>
      {area ? (
        <textarea
          value={value}
          rows={3}
          onChange={(e) => onChange(e.target.value)}
          className="w-full resize-none rounded-2xl border-2 border-border px-4 py-3 outline-none focus:border-primary"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-2xl border-2 border-border px-4 py-3 outline-none focus:border-primary"
        />
      )}
    </div>
  );
}

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("成果卡已下载 📄");
}

/* ---------- 12. Recap ---------- */

function Recap() {
  return (
    <Big>
      <SlideTitle kicker="课程收束" title="🧠 今天记住三件半事" />
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Target, t: "① 目标要清楚", d: "说清楚要什么结果、给什么限制。" },
          { icon: ListChecks, t: "② 行动要分步", d: "一件大事拆成三步小事。" },
          { icon: Eye, t: "③ 检查要认真", d: "对照条件找矛盾，发现问题就改。" },
        ].map((x, i) => (
          <motion.div
            key={x.t}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12 }}
            className="card-pop p-6"
          >
            <x.icon className="size-9 text-primary" />
            <p className="mt-3 text-2xl font-extrabold">{x.t}</p>
            <p className="text-base text-muted-foreground">{x.d}</p>
          </motion.div>
        ))}
      </div>
      <div className="mt-5 rounded-3xl border-4 border-destructive bg-sun/25 p-6 text-center">
        <p className="text-3xl font-extrabold">
          ＋半件事：<span className="text-destructive">人类最终决定</span> 🙋
        </p>
        <p className="mt-2 text-lg">AI 可以很能干，但人类必须负责检查、判断和最终决定。</p>
      </div>
      <div className="mt-5 flex items-center justify-center gap-2 text-lg text-muted-foreground">
        <Lightbulb className="size-6 text-accent" /> 想一想：生活里还有哪件事，可以交给你的智能体？
      </div>
    </Big>
  );
}

/* ---------- 14. 课程收束 + 出口任务 ---------- */

function Homework({ card, fields, flow, openAgent }: Ctx) {
  const sheet = [
    `# ${card.name || "我的智能体"}｜人类签字版方案`,
    "",
    `- 活动：${fields.activity || "（未填写）"}`,
    `- 人数：${fields.count || "（未填写）"}`,
    `- 限制条件：${fields.limits || "（未填写）"}`,
    "",
    "## 目标",
    card.goal,
    "",
    "## 行动三步",
    ...card.steps.map((s, i) => `${i + 1}. ${s}`),
    "",
    "## 检查与风险",
    card.check,
    "",
    "## 还需要人类确认的事",
    "- [ ] 时间地点已确认",
    "- [ ] 预算算得过来",
    "- [ ] 安全预案已写清",
    `- [ ] 人类验收：${flow.approved ? "已完成 ✅" : "未完成"}`,
    "",
    "学生姓名：____________　日期：____________",
    "家长 / 老师签字：____________",
  ].join("\n");

  return (
    <Big>
      <SlideTitle kicker="出口任务" title="🎁 今天只有一个作业" />
      <div className="card-pop mx-auto max-w-2xl p-8 text-center">
        <p className="text-xl font-extrabold leading-relaxed">
          回家用你的智能体办成一件真实的小事，
          <br />并<span className="text-destructive">亲自找出 1 处要改的地方</span>。
        </p>
        <p className="mt-3 text-base text-muted-foreground">
          明天带着你的「人类签字版」方案来分享。
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => copy(buildPrompt(card, fields), "提示词已复制 ✅ 可以粘贴给 AI 用啦")}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-extrabold text-primary-foreground"
          >
            <Copy className="size-5" /> 复制提示词
          </button>
          <button
            onClick={() => download(`${card.name || "我的智能体"}-人类签字版.md`, sheet)}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 font-extrabold text-accent-foreground"
          >
            <ClipboardCheck className="size-5" /> 下载 / 打印方案
          </button>
          <button
            onClick={openAgent}
            className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-3 font-extrabold"
          >
            <Rocket className="size-5" /> 再试一次智能体
          </button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          所有内容只保存在你自己的浏览器里，不用注册、不会上传。
        </p>
      </div>
      <p className="mt-6 flex items-center justify-center gap-2 text-xl font-extrabold">
        <MapPin className="size-6 text-berry" /> 下课啦！记得：能干的是 AI，负责的是你。
      </p>
    </Big>
  );
}


export const SLIDES: { title: string; C: (ctx: Ctx) => React.ReactElement }[] = [
  { title: "封面", C: Cover },
  { title: "学习地图", C: Journey },
  { title: "情境引入", C: Situation },
  { title: "角色投票", C: () => <RoleVote /> },
  { title: "聊天 vs 智能体", C: () => <Compare /> },
  { title: "工作循环", C: () => <Loop /> },
  { title: "概念小测", C: ConceptQuiz },
  { title: "指挥台", C: CommandCenter },
  { title: "办事过程", C: Execution },
  { title: "侦探模式", C: Detective },
  { title: "验收台", C: Review },
  { title: "场景创作", C: Scenes },
  { title: "智能体工厂", C: Factory },
  { title: "课程收束", C: () => <Recap /> },
  { title: "出口任务", C: Homework },
];


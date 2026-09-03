import { useEffect, useMemo, useRef, useState } from "react";
import coverArt from "@/assets/cover-illustration.png.asset.json";
import classVideo from "@/assets/class-video.mp4.asset.json";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  CloudSun,
  Eye,
  Gavel,
  Globe,
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
  TrainFront,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { VoiceInput } from "./VoiceInput";
import {
  THEMES,
  type AgentCard,
  type AgentTheme,
  type Fields,
} from "@/lib/agent-themes";

import { AgentFactory } from "@/components/course/AgentFactory";

/** 集中管理的页面索引，避免魔法数字 */
export const SLIDE = {
  video: 0,
  cover: 1,
  journey: 2,
  situation: 3,
  roleVote: 4,
  compare: 5,
  loop: 6,
  quiz: 7,
  commandCenter: 8,
  execution: 9,
  scenes: 10,
  factory: 11,
  wrap: 12,
  homework: 13,
} as const;

export type FlowState = "draft" | "running" | "needs_fix" | "detective" | "rerunning" | "approved";

export type IssueType = "missing_info" | "unreasonable_plan" | "rule_violation" | "unclear" | "custom";

/** 课后挑战：选任务 → 试一试 → 找问题 → 修改并再试 */
export type Challenge = {
  agentId: string;
  task: string;
  customTask: string;
  tested: boolean;
  issueType: IssueType | "";
  issueText: string;
  field: "action" | "check" | "";
  applied: string;
  retested: boolean;
  checked: boolean;
  prefill: string;
};

export const EMPTY_CHALLENGE: Challenge = {
  agentId: "",
  task: "",
  customTask: "",
  tested: false,
  issueType: "",
  issueText: "",
  field: "",
  applied: "",
  retested: false,
  checked: false,
  prefill: "",
};

export type Flow = {
  state: FlowState;
  baseline: Fields | null;
  approved: boolean;
  checks: string[];
  /** 完成标准：怎样才算这件事做完了 */
  standard: string;
  /** 学生在第 9 页标记的「我不相信 / 要核实」的那一条 */
  doubt: string;
  /** 学生主流程解锁到第几页（教师演示模式可无视） */
  unlocked: number;
  challenge: Challenge;
};

export const EMPTY_FLOW: Flow = {
  state: "draft",
  baseline: null,
  approved: false,
  checks: [],
  standard: "",
  doubt: "",
  unlocked: 7,
  challenge: EMPTY_CHALLENGE,
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

/* ---------- 任务结构条：8-11 页共用 ---------- */

const TASK_STEPS = [
  { id: "goal", emoji: "🎯", t: "任务目标", d: "你希望智能体完成哪一件事。" },
  { id: "info", emoji: "🧾", t: "任务信息", d: "时间、地点、人数这些它必须知道的事实。" },
  { id: "rule", emoji: "🚧", t: "约束规则", d: "钱、时间、安全上不能违反的条件。" },
  { id: "run", emoji: "⚙️", t: "智能体行动", d: "它按你的说明拆解步骤、做出方案草案。" },
  { id: "check", emoji: "🔍", t: "检查结果", d: "看方案有没有漏信息、有没有违反规则。" },
  { id: "human", emoji: "🙋", t: "人类决定", d: "花钱、通知、外出，最后由人来确认。" },
] as const;

export function TaskBar({ active }: { active: "brief" | "run" | "check" | "human" }) {
  const [open, setOpen] = useState<string | null>(null);
  const isOn = (id: string) =>
    active === "brief"
      ? ["goal", "info", "rule"].includes(id)
      : active === "run"
        ? id === "run"
        : active === "check"
          ? id === "check"
          : id === "human";
  return (
    <div className="mx-auto mb-5 w-full max-w-4xl">
      <div className="flex flex-wrap items-stretch justify-center gap-1.5">
        {TASK_STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1.5">
            <button
              onMouseEnter={() => setOpen(s.id)}
              onMouseLeave={() => setOpen(null)}
              onClick={() => setOpen((o) => (o === s.id ? null : s.id))}
              className={`rounded-full border-2 px-3 py-1.5 text-xs font-extrabold transition ${
                isOn(s.id)
                  ? "border-ink bg-primary text-primary-foreground shadow-[2px_2px_0_0_var(--ink)]"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.emoji} {s.t}
            </button>
            {i < TASK_STEPS.length - 1 && (
              <span className="text-xs font-extrabold text-border">→</span>
            )}
          </div>
        ))}
      </div>
      <AnimatePresence>
        {open && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-auto mt-2 max-w-2xl rounded-2xl bg-secondary/70 px-4 py-2 text-center text-sm font-bold"
          >
            {TASK_STEPS.find((s) => s.id === open)!.d}
          </motion.p>
        )}
      </AnimatePresence>
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
      <div className="card-pop relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-6 py-10 text-center sm:px-14">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
          className="mx-auto mb-5 w-full max-w-[260px] sm:max-w-[300px]"
        >
          <img
            src={coverArt.url}
            alt="三位同学和 AI 智能机器人一起完成任务的插画"
            className="mx-auto w-full rounded-3xl border-[3px] border-ink shadow-[6px_6px_0_0_var(--ink)]"
          />
        </motion.div>
        <h1 className="text-4xl font-extrabold sm:text-6xl">什么是智能体？</h1>
        <p className="mt-3 text-xl font-bold text-primary sm:text-2xl">让 AI 帮我完成一件事</p>
        <p className="mt-2 text-base text-muted-foreground">45 分钟沉浸互动课件 · 适合 8-15 岁</p>
        <motion.button
          onClick={() => go(SLIDE.journey)}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
          className="mt-8 inline-flex items-center gap-3 rounded-full bg-primary px-10 py-4 text-xl font-extrabold text-primary-foreground shadow-[4px_4px_0_0_var(--ink)] sm:mt-10 sm:py-5 sm:text-2xl"
        >
          <Play className="size-6 sm:size-7" /> 开始上课
        </motion.button>
        <p className="mt-5 text-sm text-muted-foreground">
          提示：用 ← → 或空格翻页，也可以点下方圆点跳转
        </p>
      </div>
    </Big>
  );
}

/* ---------- 0. Video intro ---------- */

function VideoIntro({ go }: Ctx) {
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <Big>
      <SlideTitle kicker="课堂导入" title="来看看它帮助老人办了什么事？" />

      <div className="card-pop mx-auto max-w-4xl overflow-hidden p-2">
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-secondary">
          {error ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <Play className="size-12 text-muted-foreground/50" />
              <p className="text-lg font-extrabold">视频待插入</p>
              <p className="max-w-md text-sm text-muted-foreground">
                请将视频文件命名为 <code className="rounded bg-card px-1.5 py-0.5 font-mono">class-video.mp4</code> 并放到 <code className="rounded bg-card px-1.5 py-0.5 font-mono">public/</code> 文件夹下，这里就会自动播放。
              </p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                src={classVideo.url}
                playsInline
                preload="metadata"
                controls
                className="h-full w-full"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onError={() => setError(true)}
              />
              {!playing && (
                <button
                  onClick={() => videoRef.current?.play()}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 transition hover:bg-black/30"
                  aria-label="播放视频"
                >
                  <span className="flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                    <Play className="size-9 ml-1" fill="currentColor" />
                  </span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => go(SLIDE.cover)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-lg font-extrabold text-primary-foreground shadow-[3px_3px_0_0_var(--ink)]"
        >
          进入课程封面 <ArrowRight className="size-5" />
        </button>
      </div>
    </Big>
  );
}

/* ---------- 3. Journey map ---------- */

const MILESTONES = [
  { emoji: "🎒", t: "遇到难题", d: "春游要怎么安排？", s: SLIDE.situation },
  { emoji: "🆚", t: "分清角色", d: "聊天 AI ≠ 智能体", s: SLIDE.compare },
  { emoji: "🎛️", t: "亲手指挥", d: "填写指挥台下达任务", s: SLIDE.commandCenter },
  { emoji: "🕵️", t: "找漏洞", d: "在成果里批注 AI 的错误", s: SLIDE.execution },
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
            onClick={() => go(SLIDE.roleVote)}
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
  const [showRight, setShowRight] = useState(false);

  const rightListVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.14, delayChildren: 0.2 } },
  };

  const rightItemVariants = {
    hidden: { opacity: 0, x: 18 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.35 } },
  };

  return (
    <Big>
      <SlideTitle kicker="角色对比" title="💬 聊天 AI vs 🤖 智能体" />
      <div className="grid gap-5 md:grid-cols-2">
        {/* 普通聊天 AI：一问一答就结束（先出现，点击后展开智能体） */}
        <motion.button
          onClick={() => setShowRight(true)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="card-soft relative border-t-8 border-t-muted-foreground/40 p-6 text-left transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {!showRight && (
            <motion.span
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="absolute -right-2 -top-3 rounded-full bg-primary px-3 py-1 text-xs font-extrabold text-primary-foreground shadow"
            >
              点我看看智能体 →
            </motion.span>
          )}
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 text-2xl font-extrabold"
          >
            <MessageSquare className="size-7" /> 普通聊天 AI
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-1 text-sm font-bold text-muted-foreground"
          >
            你问一句，它答一句
          </motion.p>

          <div className="mt-5 space-y-3">
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
            >
              🙋 帮我安排春游
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 }}
              className="w-fit max-w-[90%] rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5 text-sm"
            >
              🤖 可以去公园、博物馆、动物园……
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center justify-center gap-2 pt-1 text-lg font-extrabold text-muted-foreground"
            >
              🔚 然后……就结束了
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-5 flex flex-wrap justify-center gap-3 text-center"
          >
            <MiniTag emoji="🤷" text="没说的它就猜" />
            <MiniTag emoji="📄" text="只回答，不动手" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.15 }}
            className="mt-3 text-xs leading-relaxed text-muted-foreground"
          >
            这一页的聊天 AI 只负责回答问题；智能体还会追问、规划、执行和检查。
            现实中的聊天 AI 也可能连上工具去做事，这里只是用「只聊天模式」来做对比。
          </motion.p>
        </motion.button>

        {/* 智能体：目标→追问→步骤→人类拍板（点击左侧卡片后出现） */}
        {!showRight ? (
          <div className="card-pop flex min-h-[320px] flex-col items-center justify-center border-t-8 border-t-primary p-6 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
              className="mb-3 text-3xl"
            >
              ⚙️
            </motion.div>
            <p className="text-base font-extrabold text-primary">智能体正在等待启动…</p>
            <p className="mt-1 text-xs font-bold text-muted-foreground">点击左边「普通聊天 AI」卡片，看看它有什么不同</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="card-pop border-t-8 border-t-primary p-6"
          >
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2 text-2xl font-extrabold"
            >
              <Bot className="size-7 text-primary" /> AI 智能体 Agent
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-1 text-sm font-bold text-primary"
            >
              主动把事办完，最后你拍板
            </motion.p>

            <motion.div
              variants={rightListVariants}
              initial="hidden"
              animate="visible"
              className="mt-5 space-y-2.5"
            >
              {[
                { emoji: "🎯", text: "先问清：要什么结果？", c: "bg-sky/15" },
                { emoji: "❓", text: "主动追问：人数？预算？时间？", c: "bg-sun/25" },
                { emoji: "🪜", text: "拆步骤，一步步做", c: "bg-grass/15" },
                { emoji: "🛡️", text: "发现矛盾会喊停", c: "bg-berry/15" },
              ].map((s) => (
                <motion.div
                  key={s.emoji}
                  variants={rightItemVariants}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-extrabold ${s.c}`}
                >
                  <span className="text-2xl">{s.emoji}</span>
                  {s.text}
                </motion.div>
              ))}
              <motion.div
                variants={rightItemVariants}
                className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-base font-extrabold text-primary-foreground"
              >
                <Gavel className="size-5" /> 最后交给人类拍板
              </motion.div>
            </motion.div>
          </motion.div>
        )}
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
  activity: "为周六五年级春游生成一份可执行方案：去上海科技馆",
  count: "50 名学生 + 2 位老师带队；老师负责最终确认",
  limits: "人均 60 元；9:00 出发、16:30 前回校；地铁 2 号线；需提前预约学生票；有同学花生过敏；下雨要有备选",
};

const SAMPLE_STANDARD =
  "方案必须包含：集合点、路线、时间表、预算明细、安全预案；先由老师确认";




export function CommandCenter({ fields, setField, go, flow, setFlow }: Ctx) {
  const filled = Object.values(fields).some((v) => v.trim());
  const complete = fields.activity.trim() && fields.count.trim() && fields.limits.trim();
  const confirmer = /家长/.test(fields.limits + flow.standard)
    ? "老师或家长"
    : /老师/.test(fields.limits + flow.standard)
      ? "老师"
      : "（还没指定）";

  const submit = () => {
    if (!fields.activity.trim()) {
      toast.error("请先写清楚任务目标：希望智能体完成什么");
      return;
    }
    if (!fields.count.trim()) {
      toast.error("请写上任务对象与规模：涉及谁、多少人");
      return;
    }
    if (!fields.limits.trim()) {
      toast.error("请至少写一条约束条件，比如预算或时间");
      return;
    }
    if (!flow.standard.trim()) {
      toast.error("请写完成标准：最后的方案必须包含什么");
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
      <TaskBar active="brief" />
      <SlideTitle kicker="任务说明卡" title="🎛️ 给智能体下达一份完整任务" />
      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="card-pop space-y-5 p-6">
          <div className="rounded-2xl bg-secondary/70 p-3">
            <button
              onClick={() => {
                setField("activity", SAMPLE.activity);
                setField("count", SAMPLE.count);
                setField("limits", SAMPLE.limits);
                setFlow({ standard: SAMPLE_STANDARD });
                toast.success("已载入示例任务说明，可以随便改成你自己的 ✏️");
              }}
              className="rounded-full bg-card px-4 py-2 text-sm font-extrabold shadow"
            >
              加载示例任务说明
            </button>
          </div>
          <VoiceInput
            emoji="🎯"
            label="1 任务目标：希望智能体完成什么？"
            placeholder="示例：为周六去上海科技馆的活动生成一份可执行方案"
            value={fields.activity}
            onChange={(v) => setField("activity", v)}
          />
          <VoiceInput
            emoji="👥"
            label="2 任务对象与规模：这件事涉及谁、多少人？"
            placeholder="示例：50 名学生 + 2 位老师；老师负责最终确认"
            value={fields.count}
            onChange={(v) => setField("count", v)}
          />
          <VoiceInput
            emoji="🚧"
            label="3 约束条件：哪些条件不能违反？"
            placeholder="示例：人均 120 元；10:00 出发；17:00 前回家；有人花生过敏"
            value={fields.limits}
            onChange={(v) => setField("limits", v)}
            multiline
          />
          <VoiceInput
            emoji="🏁"
            label="4 完成标准：最后的方案必须包含什么？"
            placeholder="示例：集合点、路线、时间表、预算明细、安全预案；先由老师确认"
            value={flow.standard}
            onChange={(v) => setFlow({ standard: v })}
            multiline
          />

          <p className="text-sm text-muted-foreground">
            🎙️ 课堂上建议直接打字。课后在家可以点麦克风用说的；没有麦克风或不给权限时，打字一样能完成。
          </p>
        </div>

        <div className="space-y-4">

          <button
            onClick={submit}
            className="w-full rounded-3xl bg-primary px-6 py-5 text-xl font-extrabold text-primary-foreground shadow-[4px_4px_0_0_var(--ink)] transition hover:brightness-110"
          >
            🚀 把任务说明交给智能体
          </button>

          {!complete && (
            <p className="text-center text-sm text-muted-foreground">
              四项都写上，智能体才知道要做什么、怎样算完成
            </p>
          )}
        </div>
      </div>
    </Big>
  );
}


/* ---------- 8. Execution animation ---------- */

type RunStep = { emoji: string; t: string; d: string; lines: string[] };

function makeRun(fields: Fields, theme: AgentTheme, standard = ""): RunStep[] {
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
    hasHuman
      ? "✅ 已识别人类最终确认人，最终方案会留签字位"
      : "❌ 缺少最终确认人，智能体不能自行默认获得授权",
  );
  const stdList = standard
    .split(/[、,，;；\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const stdChecks = stdList.length
    ? stdList.map((s) => `${all.includes(s) ? "✅" : "🔎"} 完成标准「${s}」：${
        /确认|签字|老师|家长/.test(s) ? "需人类确认后才算达标" : "会在方案里逐项写出"
      }`)
    : ["⚠️ 你还没写完成标准，我无法判断方案是否合格"];

  return [
    {
      emoji: "🎧",
      t: "读取任务目标和已知信息",
      d: "逐条读你写在任务说明卡上的四类信息",
      lines: [
        `任务目标 = ${activity}`,
        `任务对象与规模 = ${count}${num ? `（识别为 ${num} 人）` : "（没读到数字）"}`,
        `约束规则 = ${limits}`,
        `完成标准 = ${standard || "（你还没写）"}`,
      ],
    },
    {
      emoji: "🔍",
      t: "找出缺少的信息",
      d: missing.length ? `发现 ${missing.length} 处空白，只能追问，不能乱猜` : "关键信息齐全，无需追问",
      lines: missing.length ? missing : ["地点、时间、预算、确认人、安全都已给出 ✅"],
    },
    {
      emoji: "📝",
      t: "根据目标和约束拆解行动计划",
      d: `每一步都来自你写的目标、人数、预算和时间`,
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
      t: "对照完成标准做检查",
      d: "用你写的完成标准和约束规则，逐条核对",
      lines: [...stdChecks, ...checks],
    },
    {
      emoji: "✨",
      t: "生成方案并提交人类确认",
      d: "方案已生成，不代表已获批准或可自行执行",
      lines: [
        `《${activity}智能体生成的方案》｜${count}${num ? `／${groups} 组` : ""}${
          perHead > 0 ? `｜人均 ${perHead.toFixed(0)} 元` : ""
        }`,
        missing.length
          ? `⚖️ 仍有 ${missing.length} 项待你补充，未确认前不算完成`
          : "⚖️ 通知、花钱、预约、外出等动作，需老师或家长确认后才能执行",
      ],
    },
  ];
}

/* ---------- 8b. 智能体自己的产出：已完成结果 ---------- */

type DraftTag = "fact" | "guess" | "confirm";
type DraftItem = {
  label: string;
  text: string;
  tag: DraftTag;
  flaw?: string | undefined;
  /** 是否已调用互联网资源核验 */
  verified?: boolean | undefined;
  /** 模拟的核验来源 */
  source?: string | undefined;
  /** 多模态呈现用的图标 */
  icon?: React.ReactNode | undefined;
};
export type AgentDraft = {
  title: string;
  items: DraftItem[];
  flaws: string[];
  verdict: string;
  /** 联网核验摘要 */
  webChecks: { icon: React.ReactNode; label: string; result: string; ok: boolean }[];
};

const TAG_TEXT: Record<DraftTag, string> = {
  fact: "已知事实",
  guess: "智能体推测",
  confirm: "需要人类确认",
};
const TAG_CLASS: Record<DraftTag, string> = {
  fact: "bg-grass/20 text-ink",
  guess: "bg-sun/30 text-ink",
  confirm: "bg-destructive/15 text-destructive",
};

export function makeDraft(fields: Fields, theme: AgentTheme, standard = ""): AgentDraft {
  const activity = fields.activity.trim() || theme.activity;
  const count = fields.count.trim() || theme.count;
  const limits = fields.limits.trim() || theme.limits;
  const all = `${activity} ${count} ${limits} ${standard}`;

  const num = Number((count.match(/\d+/) ?? ["0"])[0]) || 0;
  const moneyM = limits.match(/(\d+(?:\.\d+)?)\s*(?:元|块|¥)/);
  const money = moneyM ? Number(moneyM[1]) : 0;
  const perHeadDeclared = /每人|人均/.test(limits) && money > 0;
  const perHead = money > 0 ? (perHeadDeclared || num === 0 ? money : money / num) : 60;

  const placeM = all.match(/([\u4e00-\u9fa5]{2,10}(?:公园|博物馆|科技馆|美术馆|体育馆|图书馆|动物园|植物园|基地))/);
  const hasPlace = !!placeM;
  const place = placeM?.[1] ?? "城郊森林公园";
  const clockM = limits.match(/\d{1,2}\s*[:：]\s*\d{2}/g) ?? [];
  const hasTime = clockM.length > 0 || /\d\s*点|上午|下午|当天/.test(all);
  const hasHuman = /老师|家长|签字|确认|审核|批准/.test(limits + standard);
  const hasSafety = /安全|过敏|急救|受伤|晕车|应急|风险|防/.test(all);
  const start = clockM[0] ?? "09:00";
  const end = clockM[1] ?? "16:30";

  // 智能体自己算的预算明细：故意合计超过人均预算（学生可验证）
  const bus = Math.round(perHead * 0.25);
  const ticket = Math.round(perHead * 0.35);
  const lunch = Math.round(perHead * 0.5);
  const spare = Math.round(perHead * 0.1);
  const sum = bus + ticket + lunch + spare;
  // 智能体自己的分组：故意只分 2 组（带队人手不足）
  const aiGroups = 2;

  const flaws: string[] = ["money", "group"];
  if (!hasPlace) flaws.push("place");
  if (!hasHuman) flaws.push("human");
  if (!hasSafety) flaws.push("safety");
  if (!hasTime) flaws.push("time");

  const items: DraftItem[] = [
    {
      label: "地点与集合点",
      text: hasPlace
        ? `已完成：${place}（来源：你写的任务说明）。备选：市区少年宫。`
        : `待确认：你未写明地点，我暂按「${place}」占位，需你确认或修改。`,
      tag: hasPlace ? "fact" : "guess",
      flaw: hasPlace ? undefined : "place",
      verified: hasPlace,
      source: hasPlace ? "任务说明 + 公开地图" : undefined,
      icon: <MapPin className="size-4 text-primary" />,
    },
    {
      label: "交通路线",
      text: `已完成：学校 → 地铁 2 号线 → ${place}，单程约 35 分钟。`,
      tag: "fact",
      verified: true,
      source: "上海地铁官网 + 地图导航",
      icon: <TrainFront className="size-4 text-primary" />,
    },
    {
      label: "时间表",
      text: `已完成：${start} 集合出发 → 10:00 到达 → 12:00 午餐 → 15:00 返程 → ${end} 到校。`,
      tag: "guess",
      flaw: "time",
      verified: hasTime,
      source: hasTime ? "任务说明" : "智能体按常规时段推测",
      icon: <Target className="size-4 text-primary" />,
    },
    {
      label: "预算明细",
      text: `已完成：交通 ${bus} 元 + 门票 ${ticket} 元 + 午餐 ${lunch} 元 + 应急 ${spare} 元 = 每人 ${sum} 元（上限 ${Math.round(perHead)} 元）。`,
      tag: "guess",
      flaw: "money",
      verified: money > 0,
      source: money > 0 ? "公开票价 + 交通费估算" : "智能体估算",
      icon: <ShieldCheck className="size-4 text-primary" />,
    },
    {
      label: "分组与负责人",
      text: `已完成：${count}分为 ${aiGroups} 组，每组约 ${num ? Math.ceil(num / aiGroups) : "?"} 人，各由 1 位老师带队。`,
      tag: "guess",
      flaw: "group",
      verified: false,
      source: "智能体按人数拆分",
      icon: <ListChecks className="size-4 text-primary" />,
    },
    {
      label: "安全预案",
      text: hasSafety
        ? "已完成：出发前登记过敏与身体情况，走失先原地等待并联系带队老师。"
        : "待补充：未收到具体安全要求，需补走失/受伤/天气三条预案。",
      tag: hasSafety ? "fact" : "confirm",
      flaw: hasSafety ? undefined : "safety",
      verified: hasSafety,
      source: hasSafety ? "任务说明" : undefined,
      icon: <ShieldCheck className="size-4 text-primary" />,
    },
    {
      label: "通知与确认",
      text: hasHuman
        ? `已完成：通知与付款草稿已生成，待${/家长/.test(limits + standard) ? "家长" : "老师"}签字后发出。`
        : "待确认：未指定最终确认人，智能体不能自行获得授权。",
      tag: hasHuman ? "confirm" : "confirm",
      flaw: hasHuman ? undefined : "human",
      verified: false,
      source: "任务说明",
      icon: <MessageSquare className="size-4 text-primary" />,
    },
    {
      label: "最终交付物",
      text: `已完成：一份包含集合点、路线、时间表、预算明细、安全预案的${activity}方案。`,
      tag: "fact",
      verified: false,
      source: "智能体汇总",
      icon: <ClipboardCheck className="size-4 text-primary" />,
    },
  ];

  const webChecks = [
    {
      icon: <Globe className="size-4" />,
      label: "场馆开放",
      result: `${place} 周六正常开放，9:00–17:00。`,
      ok: true,
    },
    {
      icon: <TrainFront className="size-4" />,
      label: "地铁班次",
      result: "地铁 2 号线可达，车程约 35 分钟。",
      ok: true,
    },
    {
      icon: <CloudSun className="size-4" />,
      label: "天气预报",
      result: "周六多云，气温 22–28℃，适合外出。",
      ok: true,
    },
    {
      icon: <ShieldCheck className="size-4" />,
      label: "门票价格",
      result: `学生票约 ${ticket} 元/人（已按公开信息核验）。`,
      ok: money > 0,
    },
  ];

  return {
    title: `《${activity}》已完成 ✅`,
    items,
    flaws,
    webChecks,
    verdict:
      sum > perHead
        ? `⚠️ 核验结果：预算明细合计每人 ${sum} 元，超过你写的每人 ${Math.round(perHead)} 元。需要修改。`
        : `✅ 核验结果：方案已按目标生成，但部分信息为智能体推测，标「需要人类确认」的项需你核实。`,
  };
}



function Execution({ fields, theme, go, flow, setFlow }: Ctx) {
  const sig = `${fields.activity}|${fields.count}|${fields.limits}|${flow.standard}|${theme.id}`;
  const steps = useMemo(() => makeRun(fields, theme, flow.standard), [sig]); // eslint-disable-line react-hooks/exhaustive-deps
  const draft = useMemo(() => makeDraft(fields, theme, flow.standard), [sig]); // eslint-disable-line react-hooks/exhaustive-deps
  const [n, setN] = useState(0);
  useEffect(() => setN(0), [sig]);

  /** 学生在单元格里写下的批注（隐藏入口，点击单元格才出现） */
  const [notes, setNotes] = useState<Record<string, string>>({});
  /** 已经在「重新生成」里生效的批注 */
  const [applied, setApplied] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [version, setVersion] = useState(1);
  useEffect(() => {
    setNotes({});
    setApplied({});
    setEditing(null);
    setVersion(1);
  }, [sig]);

  useEffect(() => {
    if (n >= steps.length) return;
    const id = window.setTimeout(() => setN((x) => x + 1), 1100);
    return () => window.clearTimeout(id);
  }, [n, steps.length]);

  const holes = steps[1]!.lines.filter((l) => !l.includes("✅"));
  const badChecks = steps[3]!.lines.filter((l) => l.startsWith("❌") || l.startsWith("⚠️"));
  const done = n >= steps.length;
  const noteCount = Object.values(notes).filter((v) => v.trim()).length;
  const appliedCount = Object.values(applied).filter((v) => v.trim()).length;

  useEffect(() => {
    if (!done) return;
    if (flow.approved) return;
    setFlow({
      state: holes.length + badChecks.length > 0 ? "needs_fix" : "rerunning",
      unlocked: Math.max(flow.unlocked, SLIDE.execution),
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, sig]);


  return (
    <Big>
      <TaskBar active="run" />
      <SlideTitle kicker="办事过程" title="⚙️ 智能体正在处理你的任务指令" />
      <p className="mx-auto mb-5 max-w-3xl text-center text-sm font-bold text-muted-foreground">
        它会读取你的任务说明、补齐缺失信息、制定计划、检查规则，再把方案交给人类确认。
      </p>
      <div className="card-pop p-6">
        {!done ? (
          /* 生成过程：五步动态图，跑完即消失 */
          <ol className="mx-auto max-w-3xl space-y-4">
            {steps.map((s, i) => (
              <motion.li
                key={s.t}
                animate={{ opacity: i <= n ? 1 : 0.35, x: i <= n ? 0 : -10 }}
                className={`flex items-center gap-4 rounded-full border-2 px-7 py-5 ${
                  i === n ? "border-primary bg-secondary/60" : "border-border bg-card"
                }`}
              >
                <span className="text-2xl">{s.emoji}</span>
                <p className="flex-1 text-xl font-extrabold leading-snug">{s.t}</p>
                {i < n ? (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <CheckCircle2 className="size-7 text-grass" />
                  </motion.span>
                ) : i === n ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                    className="size-5 rounded-full border-2 border-primary border-t-transparent"
                  />
                ) : null}
              </motion.li>
            ))}
          </ol>
        ) : (
          /* 生成完成：只显示「已完成」结果框 */
          <div className="min-h-[360px]">
            {
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-soft space-y-4 p-5"
              >
                {/* 标题与状态摘要 */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-2xl font-extrabold">已完成 ✅</p>
                  <span className="rounded-full bg-grass/20 px-3 py-1 text-xs font-extrabold text-ink">
                    智能体已调用互联网资源核验
                  </span>
                </div>
                <p className="text-sm font-bold text-muted-foreground">
                  {fields.activity || theme.activity}｜{fields.count || theme.count}
                  {holes.length === 0 && badChecks.length === 0
                    ? "｜关键信息齐全，方案已生成"
                    : `｜发现 ${holes.length + badChecks.length} 处待确认项`}
                </p>

                {/* 联网核验面板 */}
                <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4">
                  <p className="mb-3 flex items-center gap-2 text-sm font-extrabold text-primary">
                    <Globe className="size-4" /> 联网资源核验
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {draft.webChecks.map((wc, idx) => (
                      <motion.div
                        key={wc.label}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 * idx }}
                        className="flex items-start gap-2 rounded-xl bg-card p-2.5"
                      >
                        <span className="mt-0.5 text-primary">{wc.icon}</span>
                        <div className="flex-1">
                          <p className="text-xs font-extrabold">{wc.label}</p>
                          <p className="text-xs font-medium text-muted-foreground">{wc.result}</p>
                        </div>
                        {wc.ok ? (
                          <CheckCircle2 className="size-4 text-grass" />
                        ) : (
                          <AlertTriangle className="size-4 text-destructive" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* 结果卡片：每格可点击批注（找漏洞） */}
                <div className="rounded-2xl border-2 border-ink bg-card p-4">
                  <p className="mb-3 flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
                    <Search className="size-4 text-berry" /> 侦探任务：点任意一格，写下你觉得写错或不合理的地方
                  </p>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {draft.items.map((it, k) => {
                        const fixed = (applied[it.label] ?? "").trim();
                        const note = notes[it.label] ?? "";
                        const open = editing === it.label;
                        return (
                          <motion.li
                            key={it.label}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * k }}
                            onClick={() => setEditing(open ? null : it.label)}
                            className={`group cursor-pointer rounded-xl p-3 transition ${
                              note.trim()
                                ? "bg-sun/20 ring-2 ring-berry"
                                : fixed
                                  ? "bg-grass/15 ring-2 ring-grass"
                                  : it.verified
                                    ? "bg-grass/10 hover:ring-2 hover:ring-primary/50"
                                    : "bg-muted hover:ring-2 hover:ring-primary/50"
                            }`}
                          >
                            <p className="flex flex-wrap items-center gap-2 text-sm font-extrabold">
                              {it.icon && <span className="inline-flex">{it.icon}</span>}
                              {it.label}
                              {it.verified && !fixed && (
                                <span className="inline-flex" title="已联网核验">
                                  <CheckCircle2 className="size-4 text-grass" />
                                </span>
                              )}
                              <span className="ml-auto text-[11px] font-bold text-muted-foreground opacity-0 transition group-hover:opacity-100">
                                ✏️ 批注
                              </span>
                            </p>
                            <p className="mt-1 text-sm font-medium leading-snug">
                              {fixed ? `已按你的批注修改：${fixed}` : it.text}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                                  fixed ? "bg-grass/25 text-ink" : TAG_CLASS[it.tag]
                                }`}
                              >
                                {fixed ? "已按学生批注修正" : TAG_TEXT[it.tag]}
                              </span>
                              {it.source && !fixed && (
                                <span className="text-[11px] font-bold text-muted-foreground">
                                  来源：{it.source}
                                </span>
                              )}
                            </div>
                            {note.trim() && !open && (
                              <p className="mt-2 rounded-lg bg-card px-2 py-1 text-[11px] font-bold text-berry">
                                🕵️ 我的批注：{note}
                              </p>
                            )}
                            <AnimatePresence>
                              {open && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="overflow-hidden"
                                >
                                  <textarea
                                    autoFocus
                                    value={note}
                                    onChange={(e) =>
                                      setNotes((v) => ({ ...v, [it.label]: e.target.value }))
                                    }
                                    placeholder="这里哪里不对？例如：预算算超了 / 分组人太多 / 时间来不及"
                                    className="mt-2 w-full rounded-xl border-2 border-border bg-card p-2 text-sm font-medium outline-none focus:border-primary"
                                    rows={2}
                                  />
                                  <div className="mt-1 flex gap-2">
                                    <button
                                      onClick={() => setEditing(null)}
                                      className="rounded-full bg-primary px-3 py-1 text-xs font-extrabold text-primary-foreground"
                                    >
                                      记下这条
                                    </button>
                                    <button
                                      onClick={() => {
                                        setNotes((v) => ({ ...v, [it.label]: "" }));
                                        setEditing(null);
                                      }}
                                      className="rounded-full bg-secondary px-3 py-1 text-xs font-bold"
                                    >
                                      清空
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.li>
                        );
                      })}
                    </ul>
                    <p className="mt-3 rounded-xl bg-sun/25 p-3 text-sm font-bold">
                      {appliedCount > 0
                        ? `✅ 第 ${version} 版：已按你标出的 ${appliedCount} 处批注重新生成，其余内容仍需人类确认。`
                        : draft.verdict}
                    </p>
                  </motion.div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      if (noteCount === 0) {
                        toast.info("先点一格写下你找到的问题，再让智能体重新生成 🕵️");
                        return;
                      }
                      setApplied({ ...notes });
                      setNotes({});
                      setEditing(null);
                      setVersion((v) => v + 1);
                      setN(0);
                      toast.success(`已把 ${noteCount} 处批注交给智能体，正在重新生成…`);
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-lg font-extrabold text-primary-foreground shadow-[4px_4px_0_0_var(--ink)]"
                  >
                    <RefreshCw className="size-5" /> 重新生成（{noteCount} 处批注）
                  </button>
                  <button
                    onClick={() => {
                      setFlow({
                        approved: true,
                        state: "approved",
                        unlocked: Math.max(flow.unlocked, SLIDE.homework),
                      });
                      toast.success("方案已由你确认，去创建专属智能体 🚀");
                      go(SLIDE.scenes);
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-grass px-6 py-3 text-lg font-extrabold text-ink shadow-[4px_4px_0_0_var(--ink)]"
                  >
                    <ClipboardCheck className="size-5" /> 确认此方案
                  </button>
                </div>

              </motion.div>
            }
          </div>
        )}
      </div>
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
              if (!flow.approved) {
                toast.error("先在「办事过程」点「确认此方案」");
                go(SLIDE.execution);
                return;
              }
              toast.success(`已选择「${t.name}」，正在进入指令卡`);
              go(SLIDE.factory);
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
              toast.error("先在「办事过程」点「确认此方案」");
              go(SLIDE.execution);
              return;
            }
            go(SLIDE.factory);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-lg font-extrabold text-primary-foreground shadow-[4px_4px_0_0_var(--ink)]"
        >
          {flow.approved ? "去创建智能体" : "🔒 先确认方案"} <ArrowRight className="size-5" />
        </button>
      </div>
    </Big>
  );
}

/* ---------- 13. 智能体工厂（实时生成） ---------- */

function Factory({ card, setCard, fields, theme, flow, setFlow, go }: Ctx) {
  const ch = flow.challenge;
  const editing = !!ch.issueType && !ch.retested;
  const suggestion = ch.applied;

  const applyFix = () => {
    if (!suggestion) return;
    if (ch.field === "check") {
      setCard({ ...card, check: `${card.check}｜${suggestion}` });
    } else {
      setCard({ ...card, steps: [suggestion, card.steps[1]!, card.steps[2]!] });
    }
    setFlow({
      challenge: {
        ...ch,
        retested: true,
        prefill: `我刚刚修改了你的规则。请用新规则重新帮我完成：${ch.task || ch.customTask}。`,
      },
    });
    toast.success("已写入指令卡，再和智能体试一次吧 ✅");
  };

  return (
    <Big>
      {editing && (
        <div className="card-pop mb-4 border-accent p-4">
          <p className="text-sm font-extrabold">
            ✏️ 课后挑战：把你发现的问题写进{ch.field === "check" ? "「它要检查什么」" : "「行动方式」"}
          </p>
          <p className="mt-2 rounded-2xl bg-sun/25 p-3 text-sm font-bold">{suggestion}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={applyFix}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-extrabold text-primary-foreground"
            >
              保存修改，再试一次
            </button>
            <button
              onClick={() => go(SLIDE.homework)}
              className="rounded-full bg-secondary px-5 py-2.5 text-sm font-bold"
            >
              回到课后挑战
            </button>
          </div>
        </div>
      )}
      {!editing && ch.retested && (
        <div className="card-soft mb-4 flex flex-wrap items-center gap-3 p-4">
          <CheckCircle2 className="size-5 text-grass" />
          <p className="text-sm font-bold">规则已更新，和智能体再聊一次，然后回去完成课后挑战。</p>
          <button
            onClick={() => go(SLIDE.homework)}
            className="rounded-full bg-secondary px-4 py-2 text-xs font-bold"
          >
            回到课后挑战
          </button>
        </div>
      )}
      <div className="card-soft mb-4 flex flex-wrap items-center gap-3 p-4">
        <Sparkle className="size-5 text-primary" />
        <p className="text-sm font-bold">
          {flow.approved
            ? "指令卡已继承你刚才验收通过的任务：目标 → 行动 → 检查 → 人类决定。"
            : "还没完成人类验收，指令卡先用当前指挥台的内容，验收后会更准确。"}
        </p>
      </div>
      <AgentFactory
        card={card}
        setCard={setCard}
        fields={fields}
        theme={theme}
        initialAction={ch.prefill}
      />
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

const RECAP_CARDS = [
  {
    icon: Target,
    t: "① 目标要说清楚",
    d: "告诉智能体：要完成什么结果，有哪些重要条件。",
    more: "这是给智能体下任务时的输入要求：说明目标、对象、时间、预算和其他关键条件。",
    tag: "对应第 8 页 · 任务说明",
  },
  {
    icon: ListChecks,
    t: "② 行动要分步骤",
    d: "让智能体把大任务拆成几个可以执行、可以检查的小步骤。",
    more: "这是要求智能体做任务规划，步骤数量由任务复杂程度决定，不是固定三步。",
    tag: "对应第 9 页 · 智能体处理任务",
  },
  {
    icon: Eye,
    t: "③ 结果要认真检查",
    d: "对照时间、预算、安全和完成标准，看看方案是否真的可行。",
    more: "这是人类检查智能体输出：找遗漏、算数字、查矛盾，判断是否满足任务说明。",
    tag: "对应第 10-11 页 · 侦探与验收",
  },
];


function Recap() {
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (k: string) => setOpen((o) => (o === k ? null : k));

  return (
    <Big>
      <SlideTitle kicker="课程收束" title="🧠 以后用智能体，记住这三件半事" />
      <p className="-mt-2 mb-4 text-center text-lg font-bold text-muted-foreground">
        这不是背答案，而是一张使用智能体的检查卡。
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {RECAP_CARDS.map((x, i) => (
          <motion.button
            key={x.t}
            type="button"
            onClick={() => toggle(x.t)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12 }}
            className="card-pop p-6 text-left"
          >
            <x.icon className="size-9 text-primary" />
            <p className="mt-3 text-2xl font-extrabold">{x.t}</p>
            <p className="text-base text-muted-foreground">{x.d}</p>
            <span className="mt-3 inline-block rounded-full bg-secondary px-3 py-1 text-xs font-bold text-muted-foreground">
              {x.tag}
            </span>
            <AnimatePresence initial={false}>
              {open === x.t && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 overflow-hidden text-sm font-medium text-foreground"
                >
                  使用智能体时的意思：{x.more}
                </motion.p>
              )}
            </AnimatePresence>
            <p className="mt-2 text-xs font-bold text-primary">
              {open === x.t ? "收起 ▲" : "点开看看它是什么意思 ▼"}
            </p>
          </motion.button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => toggle("half")}
        className="mt-5 block w-full rounded-3xl border-4 border-destructive bg-sun/25 p-6 text-center"
      >
        <p className="text-3xl font-extrabold">
          ＋半件事：<span className="text-destructive">重要决定由人来做</span> 🙋
        </p>
        <p className="mt-2 text-lg">
          AI 可以帮忙分析和提出方案，但付款、通知、外出、安全等重要动作，要由人确认。
        </p>
        <AnimatePresence initial={false}>
          {open === "half" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <p className="mt-3 text-base font-medium">
                这是人类的授权和安全边界：通知同学、付款、预约、外出、涉及安全的事，都要先由大人或老师确认，人类承担最终结果。
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-2 text-xs font-bold text-destructive">
          {open === "half" ? "收起 ▲" : "点开看看哪些事要确认 ▼"}
        </p>
      </button>


      <p className="mt-5 text-center text-xl font-extrabold">
        目标 → 分步行动 → 检查结果 → 人类决定
      </p>
    </Big>
  );
}


/* ---------- 15. 课后挑战 ---------- */

const TASK_OPTIONS = [
  "整理明天的书包和作业",
  "规划明天放学后的时间",
  "安排一次周末运动",
  "做一份零花钱购买清单",
  "准备一次家庭出行/研学的物品清单",
];

const ISSUES: { id: IssueType; label: string; hint: string; field: "action" | "check" }[] = [
  {
    id: "missing_info",
    label: "它漏问了重要信息",
    hint: "比如没有问放学时间、预算或人数。",
    field: "action",
  },
  {
    id: "unreasonable_plan",
    label: "它的方案不合理",
    hint: "比如把写作业安排在 10 分钟课间。",
    field: "check",
  },
  {
    id: "rule_violation",
    label: "它没有遵守我定的规则",
    hint: "比如超过了你设定的预算。",
    field: "check",
  },
  { id: "unclear", label: "它说得不够清楚", hint: "", field: "action" },
  { id: "custom", label: "我有自己的发现", hint: "", field: "action" },
];

function suggestFor(t: IssueType, issueText: string) {
  const s = issueText.trim() || "这个问题";
  switch (t) {
    case "missing_info":
      return `先问清楚：${s}，再给方案。`;
    case "unreasonable_plan":
      return `生成方案前，检查：${s}。`;
    case "rule_violation":
      return `必须遵守：${s}；不符合就提醒我修改。`;
    case "unclear":
      return "先给一句结论，再用 3 条清单说明。";
    default:
      return `我要它注意：${s}。`;
  }
}

function Homework({ card, flow, setFlow, go }: Ctx) {
  const ch = flow.challenge;
  const patch = (p: Partial<Challenge>) => setFlow({ challenge: { ...ch, ...p } });
  const task = ch.task === "custom" ? ch.customTask.trim() : ch.task;
  const done = ch.retested;
  const [custom, setCustom] = useState(ch.customTask);
  const [issueText, setIssueText] = useState(ch.issueText);

  const steps = ["选任务", "试一试", "找问题", "修改并再试"];
  const stepIdx = !task ? 0 : !ch.tested ? 1 : !ch.issueType ? 2 : 3;

  return (
    <Big>
      <SlideTitle kicker="课后挑战" title="把你的智能体变得更靠谱" />
      <p className="-mt-3 mb-5 text-center text-base text-muted-foreground">
        今晚选一件小事试一试：让 AI 出方案，你来找问题、改规则。
      </p>

      <div className="mb-5 flex flex-wrap items-center justify-center gap-2 text-xs font-bold">
        {steps.map((s, i) => (
          <span
            key={s}
            className={`rounded-full px-3 py-1.5 ${
              i < stepIdx
                ? "bg-grass/25 text-foreground"
                : i === stepIdx
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
            }`}
          >
            {i + 1}. {s}
          </span>
        ))}
      </div>

      {!done ? (
        <div className="grid gap-4">
          {/* 第 1 步 */}
          <div className="card-pop p-6">
            <p className="text-2xl font-extrabold">1. 选一个真实小任务</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {TASK_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => patch({ task: t, tested: false })}
                  className={`rounded-2xl px-4 py-3 text-left text-sm font-bold ${
                    ch.task === t ? "bg-primary text-primary-foreground" : "bg-secondary"
                  }`}
                >
                  {t}
                </button>
              ))}
              <button
                onClick={() => patch({ task: "custom" })}
                className={`rounded-2xl px-4 py-3 text-left text-sm font-bold ${
                  ch.task === "custom" ? "bg-primary text-primary-foreground" : "bg-secondary"
                }`}
              >
                我自己写
              </button>
            </div>
            {ch.task === "custom" && (
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onBlur={() => patch({ customTask: custom })}
                placeholder="例如：帮我安排周六下午的运动和作业"
                className="mt-3 w-full rounded-2xl border-2 border-border px-4 py-3 outline-none focus:border-primary"
              />
            )}
            <p className="mt-3 flex items-start gap-2 rounded-2xl bg-sun/25 p-3 text-xs font-bold">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              涉及外出、花钱、食物或安全的方案，需要和家长或老师一起确认。
            </p>
          </div>

          {/* 第 2 步 */}
          <div className={`card-pop p-6 ${task ? "" : "opacity-50"}`}>
            <p className="text-2xl font-extrabold">2. 试一试，找出 1 个要改的地方</p>
            <p className="mt-1 text-sm text-muted-foreground">
              带着这件小事去问你的智能体，看它给的方案哪里不对。
            </p>
            <button
              disabled={!task}
              onClick={() => {
                patch({
                  tested: true,
                  prefill: `请帮我完成这件事：${task}。请先问我最重要的一个问题。`,
                });
                go(SLIDE.factory);
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-extrabold text-primary-foreground disabled:opacity-40"
            >
              <Rocket className="size-5" /> 带着这件事去问智能体
            </button>

            {ch.tested && (
              <div className="mt-4 grid gap-2">
                <p className="text-sm font-extrabold">我发现的问题：</p>
                {ISSUES.map((x) => (
                  <button
                    key={x.id}
                    onClick={() =>
                      patch({
                        issueType: x.id,
                        field: x.field,
                        applied: suggestFor(x.id, x.id === "custom" ? issueText : issueText),
                      })
                    }
                    className={`rounded-2xl px-4 py-3 text-left text-sm font-bold ${
                      ch.issueType === x.id ? "bg-accent text-accent-foreground" : "bg-secondary"
                    }`}
                  >
                    {x.label}
                    {x.hint && (
                      <span className="block text-xs font-normal opacity-80">{x.hint}</span>
                    )}
                  </button>
                ))}
                {!!ch.issueType && (
                  <input
                    value={issueText}
                    maxLength={60}
                    onChange={(e) => setIssueText(e.target.value)}
                    onBlur={() =>
                      patch({
                        issueText,
                        applied: suggestFor(ch.issueType as IssueType, issueText),
                      })
                    }
                    placeholder="用一句话写清楚：它哪里不对？（最多 60 字）"
                    className="w-full rounded-2xl border-2 border-border px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                )}
              </div>
            )}
          </div>

          {/* 第 3 步 */}
          <div className={`card-pop p-6 ${ch.issueType ? "" : "opacity-50"}`}>
            <p className="text-2xl font-extrabold">3. 带着发现回去修改</p>
            {ch.applied && (
              <p className="mt-3 rounded-2xl bg-sun/25 p-3 text-sm font-bold">
                建议写进{ch.field === "check" ? "「它要检查什么」" : "「行动方式」"}：{ch.applied}
              </p>
            )}
            <button
              disabled={!ch.issueType}
              onClick={() => go(SLIDE.factory)}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 font-extrabold text-accent-foreground disabled:opacity-40"
            >
              <Wand2 className="size-5" /> 回到智能体工厂，修改我的指令卡
            </button>
            <p className="mt-3 text-xs text-muted-foreground">
              先找出一个问题并改好它，就算完成课后挑战。
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          <h3 className="text-center text-3xl font-extrabold">你让智能体变得更靠谱了！</h3>
          <div className="card-pop p-6 text-center">
            <p className="text-lg font-bold">
              你完成了「选任务 → 试一试 → 找问题 → 修改并再试」四步循环。
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              重要提醒：涉及外出、花钱、食物或安全时，要和家长/老师一起确认。
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => go(SLIDE.factory)}
              className="rounded-full bg-secondary px-5 py-3 font-bold"
            >
              回到智能体工厂继续修改
            </button>
            <button
              onClick={() => setFlow({ challenge: EMPTY_CHALLENGE })}
              className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-3 font-bold"
            >
              <RefreshCw className="size-4" /> 再做一个新挑战
            </button>
          </div>
        </div>
      )}

      <p className="mt-6 flex items-center justify-center gap-2 text-center text-base font-extrabold">
        <MapPin className="size-5 text-berry" /> AI 可以出主意；你要检查，重要的事还要和大人一起确认。
      </p>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        所有内容只保存在你自己的浏览器里，不用注册、不会上传。
      </p>
    </Big>
  );
}


export const SLIDES: { title: string; C: (ctx: Ctx) => React.ReactElement }[] = [
  { title: "课堂导入", C: VideoIntro },
  { title: "封面", C: Cover },
  { title: "学习地图", C: Journey },
  { title: "情境引入", C: Situation },
  { title: "角色投票", C: () => <RoleVote /> },
  { title: "聊天 vs 智能体", C: () => <Compare /> },
  { title: "工作循环", C: () => <Loop /> },
  { title: "概念小测", C: ConceptQuiz },
  { title: "指挥台", C: CommandCenter },
  { title: "办事过程", C: Execution },
  { title: "场景创作", C: Scenes },
  { title: "智能体工厂", C: Factory },
  { title: "课程收束", C: () => <Recap /> },
  { title: "课后挑战", C: Homework },
];


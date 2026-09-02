import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Download,
  ExternalLink,
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
  cardToMarkdown,
  detectConflicts,
  type AgentCard,
  type AgentTheme,
  type Fields,
} from "@/lib/agent-themes";

export type Ctx = {
  fields: Fields;
  setField: (k: keyof Fields, v: string) => void;
  card: AgentCard;
  setCard: (c: AgentCard) => void;
  theme: AgentTheme;
  applyTheme: (t: AgentTheme) => void;
  go: (i: number) => void;
  openAgent: () => void;
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
        <p className="mt-4 text-2xl font-bold text-primary sm:text-3xl">
          让 AI 帮我完成一件事
        </p>
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
  { emoji: "🎒", t: "遇到难题", d: "春游要怎么安排？", s: 2 },
  { emoji: "🆚", t: "分清角色", d: "聊天 AI ≠ 智能体", s: 4 },
  { emoji: "🔁", t: "工作循环", d: "目标→行动→检查→改进", s: 5 },
  { emoji: "🎛️", t: "亲手指挥", d: "填写指挥台并纠错", s: 6 },
  { emoji: "🕵️", t: "侦探挑战", d: "找出 AI 的错误", s: 8 },
  { emoji: "🚀", t: "造一个它", d: "生成专属智能体", s: 9 },
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
              "去哪儿？怎么去？几点集合？",
              "50 个人怎么分组，谁带队？",
              "60 元要包含车费、门票还是午饭？",
              "有同学晕车、有同学过敏，怎么办？",
            ].map((x) => (
              <li key={x} className="flex gap-2">
                <AlertTriangle className="mt-1 size-5 shrink-0 text-accent" /> {x}
              </li>
            ))}
          </ul>
        </div>
        <div className="card-soft flex flex-col justify-center gap-4 bg-secondary/60 p-6">
          <p className="text-2xl font-extrabold">
            👉 一件事要做成，不只需要「答案」，还需要有人<span className="text-primary">把事情办完</span>。
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

function RoleVote() {
  const [picked, setPicked] = useState<number | null>(null);
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
      <p className="mt-6 text-center text-lg text-muted-foreground">
        投票没有对错，先说说你为什么这样选？
      </p>
    </Big>
  );
}

/* ---------- 5. Chat vs Agent ---------- */

function Compare() {
  return (
    <Big>
      <SlideTitle kicker="角色对比" title="💬 聊天 AI vs 🤖 智能体" />
      <div className="grid gap-5 md:grid-cols-2">
        <div className="card-soft border-t-8 border-t-muted-foreground/40 p-6">
          <h3 className="flex items-center gap-2 text-2xl font-extrabold">
            <MessageSquare className="size-7" /> 普通聊天 AI
          </h3>
          <p className="mt-1 text-sm font-bold text-muted-foreground">被动的答案生成器</p>
          <ul className="mt-4 space-y-3 text-lg">
            <li>🗣️ 你问一句，它答一句</li>
            <li>🤷 你没说的，它就自己猜</li>
            <li>📄 给你一大段文字，做不做随你</li>
            <li>🔚 回答完 = 结束</li>
          </ul>
          <div className="mt-4 rounded-xl bg-muted p-3 text-base">
            <b>它说：</b>“春游可以去公园、博物馆、动物园……”（然后没了）
          </div>
        </div>
        <div className="card-pop border-t-8 border-t-primary p-6">
          <h3 className="flex items-center gap-2 text-2xl font-extrabold">
            <Bot className="size-7 text-primary" /> AI 智能体 Agent
          </h3>
          <p className="mt-1 text-sm font-bold text-primary">主动的任务执行者</p>
          <ul className="mt-4 space-y-3 text-lg">
            <li>🎯 先确认目标：你到底要什么结果</li>
            <li>❓ 主动追问：人数？预算？时间？安全？</li>
            <li>🪜 拆成步骤，一步步做</li>
            <li>🛡️ 检查限制条件，发现矛盾会喊停</li>
            <li>🙋 最后交给<b>人类拍板</b></li>
          </ul>
          <div className="mt-4 rounded-xl bg-primary/10 p-3 text-base">
            <b>它说：</b>“50 人、人均 60 元，我先算车费再选地点。请先告诉我出发时间。”
          </div>
        </div>
      </div>
    </Big>
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
          AI 可以很能干，但人类必须负责<span className="text-destructive">检查、判断和最终决定</span>。
        </p>
      </motion.div>
    </Big>
  );
}

/* ---------- 7. Command center ---------- */

export function CommandCenter({ fields, setField, go }: Ctx) {
  const warnings = detectConflicts(fields);
  const filled = Object.values(fields).some((v) => v.trim());
  return (
    <Big>
      <SlideTitle kicker="指挥台 Command Center" title="🎛️ 轮到你来下达任务" />
      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="card-pop space-y-5 p-6">
          <VoiceInput
            emoji="🎪"
            label="活动是什么"
            placeholder="例如：五年级春游 / 班级义卖日"
            value={fields.activity}
            onChange={(v) => setField("activity", v)}
          />
          <VoiceInput
            emoji="👥"
            label="有多少人"
            placeholder="例如：50 人"
            value={fields.count}
            onChange={(v) => setField("count", v)}
          />
          <VoiceInput
            emoji="🚧"
            label="限制条件 / 预算"
            placeholder="例如：每人 60 元，当天往返，去森林公园"
            value={fields.limits}
            onChange={(v) => setField("limits", v)}
            multiline
          />
          <p className="text-sm text-muted-foreground">
            🎙️ 点麦克风可以用说的（中文）。不支持或没权限时，直接打字也一样。
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
          <button
            disabled={!filled}
            onClick={() => (filled ? go(7) : toast.error("至少填写一项再出发哦"))}
            className="w-full rounded-3xl bg-primary px-6 py-5 text-2xl font-extrabold text-primary-foreground shadow-[4px_4px_0_0_var(--ink)] transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            🚀 交给智能体办事
          </button>
          {!filled && (
            <p className="text-center text-sm text-muted-foreground">至少填写 1 项才能继续</p>
          )}
        </div>
      </div>
    </Big>
  );
}

/* ---------- 8. Execution animation ---------- */

const STEPS = [
  { emoji: "🎧", t: "听清任务要求", d: "读取活动、人数、限制条件" },
  { emoji: "🔍", t: "找出缺少的信息", d: "地点？时间？谁带队？先问清楚" },
  { emoji: "📝", t: "拆解行动计划", d: "第 1 步 / 第 2 步 / 第 3 步" },
  { emoji: "🛡️", t: "做安全与常识检查", d: "预算够不够？会不会有危险？" },
  { emoji: "✨", t: "生成最终执行方案", d: "交给人类检查签字" },
];

function Execution({ fields }: Ctx) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= STEPS.length) return;
    const id = window.setTimeout(() => setN((x) => x + 1), 1100);
    return () => window.clearTimeout(id);
  }, [n]);

  return (
    <Big>
      <SlideTitle kicker="办事过程" title="⚙️ 智能体正在办事…" />
      <div className="card-pop p-6">
        <p className="mb-4 rounded-xl bg-secondary p-3 text-base">
          任务：<b>{fields.activity || "（未填写活动）"}</b>｜人数：
          <b>{fields.count || "（未填写）"}</b>｜限制：<b>{fields.limits || "（未填写）"}</b>
        </p>
        <ol className="space-y-3">
          {STEPS.map((s, i) => (
            <motion.li
              key={s.t}
              animate={{ opacity: i < n ? 1 : 0.25, x: i < n ? 0 : -12 }}
              className="flex items-center gap-4 rounded-2xl border-2 border-border p-4"
            >
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
            </motion.li>
          ))}
        </ol>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setN(0)}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 font-extrabold text-accent-foreground"
          >
            <RefreshCw className="size-5" /> 重播动画
          </button>
          {n >= STEPS.length && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-full bg-destructive px-4 py-2 text-sm font-extrabold text-destructive-foreground"
            >
              ⚖️ 方案已生成，等待人类检查
            </motion.span>
          )}
        </div>
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

  const hasPlace = /地点|在.{0,6}(公园|馆|校|室|场|山|园|教室|操场)|公园|博物馆|操场|教室|图书|体育馆/.test(all);
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
    score: hasPlace ? 30 : 100,
    make: () => ({
      title: "案件：消失的地点",
      ai: `${activity}方案：${hasTime ? "按你说的时间" : "早上 8:00"}集合出发，中途休息用餐，结束后原路返回。参加人数 ${count}。`,
      steps: [
        {
          hint: `先别急着说答案。把 AI 这句话读一遍，对照你写的${q(limits)}，问自己：时间有了吗？人数有了吗？那「在哪里做」写了吗？`,
          answer: `🔍 找出来：AI 只讲了时间和人数，一次都没说${q(`${activity}到底在哪里进行`)}。${
            hasPlace ? `你在指挥台已经写了地点信息，但方案里把它弄丢了。` : `而且${src}，里面也没有地点，AI 只能靠猜。`
          }没有地点，就算不出路程、门票和安全预案。`,
        },
        {
          hint: "轮到你当提问的人。想一想：只问「去哪」够不够？要让 AI 给你可以比较的答案，问题里还要加什么？",
          answer: `❓ 问一句：「${activity}具体在哪个地点进行？按 ${count} 的规模给我 2 个备选，写清各自路程时间、是否要门票。」——「几个备选 + 判断依据」，AI 才不会随口给一个。`,
        },
        {
          hint: "最后一步：把谈好的结果写回指挥台，方案才算真的被改过。",
          answer: "✏️ 改一改：把地点连同路程时间补进「限制条件」，指挥台信息就完整了。",
        },
      ],
      fixField: "limits",
      fixValue: `${limits}${limits ? "；" : ""}地点：城郊森林公园（车程 40 分钟，无门票）`,
      fixLabel: "补上地点：城郊森林公园",
    }),
  });

  // 2. 钱算不过来
  const fakeTotal = Math.max(5, Math.round(num > 0 ? num * 0.4 : 20));
  pool.push({
    key: "money",
    score: hasMoney ? 95 : 60,
    make: () => ({
      title: "案件：算不过来的钱",
      ai: `${count}参加${activity}，总预算 ${fakeTotal} 元，安排门票 + 午餐 + 往返交通，保证人人都有份。`,
      steps: [
        {
          hint: `线索藏在数字里。把${q(count)}和${q(`总预算 ${fakeTotal} 元`)}放一起，动手算一算人均是多少。`,
          answer: `🔍 找出来：${count}只有 ${fakeTotal} 元${
            num > 0 ? `，人均约 ${(fakeTotal / num).toFixed(2)} 元` : ""
          }，连一瓶水都买不到，却要覆盖门票 + 午餐 + 交通。${
            perHead > 0
              ? `而你在指挥台写的是${q(limits)}，相当于人均 ${perHead.toFixed(1)} 元，两边对不上。`
              : `而且${src}，里面并没有写清预算，AI 就自己编了一个数。`
          }`,
        },
        {
          hint: "别直接说「你算错了」。想想：怎么问才能让 AI 把账目摊开给你看？",
          answer: `❓ 问一句：「${fakeTotal} 元是每人预算还是总预算？请按 ${count} 列一张人均花费清单：门票 / 午餐 / 交通各多少，合计不能超过${
            perHead > 0 ? `每人 ${perHead.toFixed(0)} 元` : "我给的预算"
          }。」——让 AI 列清单，比让它道歉有用。`,
        },
        {
          hint: "确认真实预算后，回指挥台把这条限制写死，之后每一步 AI 都要守着它。",
          answer: `✏️ 改一改：把${q(`每人预算 ${perHead > 0 ? perHead.toFixed(0) : 60} 元`)}写进限制条件，这是给 AI 的硬规则。`,
        },
      ],
      fixField: "limits",
      fixValue: `每人预算 ${perHead > 0 ? perHead.toFixed(0) : 60} 元（含交通与门票）${
        limits && !perHeadDeclared ? `；${limits}` : ""
      }`,
      fixLabel: `改成：每人预算 ${perHead > 0 ? perHead.toFixed(0) : 60} 元`,
    }),
  });

  // 3. 没有人类检查点
  pool.push({
    key: "human",
    score: hasHuman ? 70 : 90,
    make: () => ({
      title: "案件：没人负责的方案",
      ai: `${activity}安排已生成，AI 将自动通知全部 ${count}、直接下单物资，并在当天自行调整流程，无需再确认。`,
      steps: [
        {
          hint: "这句读起来很顺，问题不在数字里。数一数：从头到尾出现过「人」吗？谁最后拍板？",
          answer: `🔍 找出来：方案写着「自动通知、直接下单、自行调整、无需再确认」——整段没有一个人类检查点。${
            hasHuman ? `你在限制条件里明明写了${q(limits)}，AI 却直接跳过了。` : `${src}，里面也没规定谁来把关。`
          }${activity}一旦出错，没人能提前拦住。`,
        },
        {
          hint: "想想课上的口号：AI 很能干，但最终决定权归谁？把它变成对 AI 的要求。",
          answer: `❓ 问一句：「${activity}里哪一步必须由老师签字确认？把方案拆成『AI 可以做』和『必须人类确认』两栏，下单和通知家长都要等我批准。」`,
        },
        {
          hint: "把「人类最终确认」这条规则也写进指挥台，让它跟着每个方案走。",
          answer: "✏️ 改一改：加上「所有对外通知与花钱的步骤，必须老师确认后才执行」。",
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
    score: hasSafety ? 40 : 88,
    make: () => ({
      title: "案件：被忽略的安全",
      ai: `${activity}流程：${count}全员一起行动，按顺序完成每个环节，遇到情况现场随机应变即可。`,
      steps: [
        {
          hint: `把${q(count)}这么多人放进脑子里想一遍：有人过敏、有人走丢、突然下雨——方案里写了怎么办吗？`,
          answer: `🔍 找出来：方案只写了「顺利时怎么走」，没写「出事时怎么办」。${
            hasSafety ? `你在指挥台提过安全相关的要求，AI 却没落实成具体动作。` : `${src}，里面也没有任何安全或特殊情况的说明。`
          }「现场随机应变」等于没有预案。`,
        },
        {
          hint: "提问要能逼出具体动作。想想：问「安全吗」和问「谁在什么时候做什么」，哪个更有用？",
          answer: `❓ 问一句：「请为${activity}列出 3 个最可能出问题的场景（走失 / 受伤 / 天气变化），每个写清：谁负责、第一步做什么、联系谁。」`,
        },
        {
          hint: "把安全要求写回指挥台，它才会出现在下一版方案里。",
          answer: "✏️ 改一改：在限制条件里加上安全与应急要求。",
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
          hint: `拿计算器算一下：4 组 × 8 人 = 多少？再看看你写的${q(count)}，对得上吗？`,
          answer: `🔍 找出来：4 组 × 8 人 = 32 人，${
            num > 0
              ? num === 32
                ? `虽然刚好等于 ${num} 人，但方案没说这 4 组分别做什么、谁当组长。`
                : `而你写的是${q(count)}，${num > 32 ? `还有 ${num - 32} 人没被安排` : `多算了 ${32 - num} 人`}。`
              : `而${src}，人数根本没写清，AI 只能瞎凑。`
          }分组数字错了，物资和分工全都会错。`,
        },
        {
          hint: "怎么问才能让 AI 自己检查算术？提示：让它把过程写出来。",
          answer: `❓ 问一句：「请按 ${count} 重新分组，写出：组数 × 每组人数 = 总人数的算式，并给每组指定组长和任务。」`,
        },
        {
          hint: "把分组规则写回指挥台，下一版方案就不会再算错。",
          answer: "✏️ 改一改：把分组与负责人要求补进限制条件。",
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
    score: hasTime ? 35 : 92,
    make: () => ({
      title: "案件：糊涂的时间表",
      ai: `${activity}：先做准备工作，然后开始活动，做完就结束，${count}都参加。`,
      steps: [
        {
          hint: `照着这句话，你能知道几点到教室吗？对照你写的${q(limits)}，看看时间信息在哪。`,
          answer: `🔍 找出来：「先…然后…做完」全是模糊词，没有一个具体时间点。${
            hasTime ? "你指挥台里其实写了时间，AI 没有把它排进流程。" : `${src}，里面也没写开始与结束时间。`
          }没有时间表，${count}就会在现场乱成一团。`,
        },
        {
          hint: "让 AI 给时间，要给它格式。想一想：你希望它输出成什么样子？",
          answer: `❓ 问一句：「请把${activity}做成时间表：每一行写『几点—几点｜做什么｜谁负责』，总时长不能超过我给的限制。」`,
        },
        {
          hint: "把确定下来的时间写回指挥台。",
          answer: "✏️ 改一改：把开始与结束时间写进限制条件。",
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
    .slice(0, 3)
    .map((c, k) => {
      const d = c.make();
      return { ...d, title: `案件${["一", "二", "三"][k]}：${d.title.replace(/^案件[：:]/, "")}` };
    });
}


function Detective({ fields, theme, setField, go }: Ctx) {
  const cases = makeCases(fields, theme);
  const [i, setI] = useState(0);
  // progress: 每一步两次点击（0=未开始, 奇数=看到提示, 偶数=看到答案）
  const [p, setP] = useState(0);
  const c = cases[i] ?? cases[0]!;

  return (
    <Big>
      <SlideTitle kicker="侦探模式" title="🕵️ 抓出 AI 的毛病" />
      <p className="mb-4 text-center text-sm font-bold text-muted-foreground">
        案件内容会跟着你在指挥台写的「{fields.activity.trim() || theme.activity}」实时变化 · 每一步要点两次：先想，再看答案
      </p>
      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {cases.map((x, k) => (
          <button
            key={x.title}
            onClick={() => {
              setI(k);
              setP(0);
            }}
            className={`rounded-full px-4 py-2 font-bold ${
              k === i ? "bg-primary text-primary-foreground" : "bg-secondary"
            }`}
          >
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
                onClick={() => {
                  const next = p + 1;
                  if (next === k * 2 + 2 && k === 2) {
                    setField(c.fixField, c.fixValue);
                    toast.success("已自动填回指挥台 ✅");
                  }
                  setP(next);
                }}
                whileHover={{ y: active ? -4 : 0 }}
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
                {seenHint && <p className="mt-2 rounded-xl bg-card/70 p-2 text-sm">💭 {c.steps[k]!.hint}</p>}
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
        {p >= 6 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-grass/15 p-4">
            <ClipboardCheck className="size-6 text-grass" />
            <p className="font-bold">「{c.fixLabel}」已经写回指挥台，你就是那个「负责检查的人类」！</p>
            <button onClick={() => go(6)} className="rounded-full bg-primary px-4 py-2 font-bold text-primary-foreground">
              回指挥台看看
            </button>
            {i < cases.length - 1 && (
              <button
                onClick={() => {
                  setI(i + 1);
                  setP(0);
                }}
                className="rounded-full bg-secondary px-4 py-2 font-bold"
              >
                下一个案件 →
              </button>
            )}
          </motion.div>
        )}
      </div>
    </Big>
  );
}


/* ---------- 10. Scene creator ---------- */

function Scenes({ theme, applyTheme, go }: Ctx) {
  return (
    <Big>
      <SlideTitle kicker="场景创作" title="🎨 挑一个专属智能体主题" />
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
          onClick={() => go(10)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-lg font-extrabold text-primary-foreground"
        >
          去做成果卡 <ArrowRight className="size-5" />
        </button>
      </div>
    </Big>
  );
}

/* ---------- 11. Workbench ---------- */

function Workbench({ card, setCard, fields, theme, openAgent }: Ctx) {
  const [prompt, setPrompt] = useState("");
  const set = (k: keyof AgentCard, v: string) => setCard({ ...card, [k]: v } as AgentCard);
  const setStep = (i: number, v: string) => {
    const steps = [...card.steps] as AgentCard["steps"];
    steps[i] = v;
    setCard({ ...card, steps });
  };

  return (
    <Big>
      <SlideTitle kicker="成果卡 & 智能体生成" title="🛠️ 智能体工作台" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card-pop space-y-4 p-6">
          <p className="text-sm font-bold text-muted-foreground">
            当前主题：{theme.emoji} {theme.name}（可随意修改）
          </p>
          <Field label="🏷️ 智能体名字" value={card.name} onChange={(v) => set("name", v)} />
          <Field label="🎯 主要目标" value={card.goal} onChange={(v) => set("goal", v)} area />
          <div>
            <p className="mb-2 text-lg font-bold">🪜 三步行动计划</p>
            <div className="space-y-2">
              {card.steps.map((s, i) => (
                <input
                  key={i}
                  value={s}
                  onChange={(e) => setStep(i, e.target.value)}
                  placeholder={`第 ${i + 1} 步`}
                  className="w-full rounded-2xl border-2 border-border px-4 py-3 outline-none focus:border-primary"
                />
              ))}
            </div>
          </div>
          <Field
            label="🛡️ 检查机制与护栏"
            value={card.check}
            onChange={(v) => set("check", v)}
            area
          />
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setPrompt(buildPrompt(card, fields));
                toast.success("系统提示词已生成 ✨");
              }}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-extrabold text-primary-foreground"
            >
              <Sparkle className="size-5" /> 生成系统提示词
            </button>
            <button
              onClick={openAgent}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 font-extrabold text-accent-foreground"
            >
              <Rocket className="size-5" /> 启动智能体
            </button>
          </div>
          <div className="card-soft p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-extrabold">📜 System Prompt</p>
              <div className="flex gap-2">
                <button
                  onClick={() => copy(prompt || buildPrompt(card, fields))}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm font-bold"
                >
                  <Copy className="size-4" /> 复制
                </button>
                <button
                  onClick={() => download(`${card.name || "agent"}.md`, cardToMarkdown(card, fields))}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm font-bold"
                >
                  <Download className="size-4" /> 下载成果卡
                </button>
              </div>
            </div>
            <pre className="max-h-[46vh] overflow-auto whitespace-pre-wrap rounded-xl bg-muted p-4 text-sm leading-relaxed">
              {prompt || "点「生成系统提示词」，这里会出现可以直接复制到任何 AI 里的指令。"}
            </pre>
          </div>
        </div>
      </div>
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
        <p className="mt-2 text-lg">
          AI 可以很能干，但人类必须负责检查、判断和最终决定。
        </p>
      </div>
      <div className="mt-5 flex items-center justify-center gap-2 text-lg text-muted-foreground">
        <Lightbulb className="size-6 text-accent" /> 想一想：生活里还有哪件事，可以交给你的智能体？
      </div>
    </Big>
  );
}

/* ---------- 13. Export ---------- */

function Export({ card, fields, openAgent }: Ctx) {
  return (
    <Big>
      <SlideTitle kicker="出口任务" title="🎁 把你的智能体带回家" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card-pop p-6">
          <h3 className="text-2xl font-extrabold">📋 今天的作业</h3>
          <ol className="mt-3 space-y-2 text-lg">
            <li>1. 复制你的系统提示词，回家贴进任意一个 AI 里试一试。</li>
            <li>2. 让它帮你完成一件真实的小事（写计划、整理书、办活动）。</li>
            <li>3. <b>亲自检查</b>它的方案，找出至少 1 个需要修改的地方。</li>
            <li>4. 明天带着你的「人类签字版」方案来分享。</li>
          </ol>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => copy(buildPrompt(card, fields))}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-extrabold text-primary-foreground"
            >
              <Copy className="size-5" /> 复制提示词
            </button>
            <button
              onClick={() => download(`${card.name || "agent"}-成果卡.md`, cardToMarkdown(card, fields))}
              className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-3 font-extrabold"
            >
              <Download className="size-5" /> 下载成果卡
            </button>
            <button
              onClick={openAgent}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 font-extrabold text-accent-foreground"
            >
              <Rocket className="size-5" /> 再试一次智能体
            </button>
            <a
              href="/智能体工厂.html"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border-2 border-border px-5 py-3 font-extrabold"
            >
              <ExternalLink className="size-5" /> 打开智能体工厂
            </a>
          </div>
        </div>
        <div className="card-soft bg-secondary/50 p-6">
          <h3 className="flex items-center gap-2 text-2xl font-extrabold">
            <Brain className="size-7 text-primary" /> 你的成果卡
          </h3>
          <pre className="mt-3 max-h-[46vh] overflow-auto whitespace-pre-wrap rounded-2xl bg-card p-4 text-base">
            {cardToMarkdown(card, fields)}
          </pre>
        </div>
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
  { title: "指挥台", C: CommandCenter },
  { title: "办事过程", C: Execution },
  { title: "侦探模式", C: Detective },
  { title: "八大主题", C: Scenes },
  { title: "智能体工作台", C: Workbench },
  { title: "课程收束", C: () => <Recap /> },
  { title: "出口任务", C: Export },
];

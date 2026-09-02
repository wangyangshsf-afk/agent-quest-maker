import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Home, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { EMPTY_FLOW, SLIDES, type Ctx, type Flow } from "@/components/course/Slides";
import { AgentModal } from "@/components/course/AgentModal";
import { EMPTY_CARD, THEMES, type AgentCard, type AgentTheme, type Fields } from "@/lib/agent-themes";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "什么是智能体？让 AI 帮我完成一件事 · 互动课件" },
      {
        name: "description",
        content:
          "面向 8-15 岁学生的 45 分钟 AI 启蒙互动课件：13 页课程、语音指挥台、侦探纠错挑战与 8 大专属智能体生成器。",
      },
      { property: "og:title", content: "什么是智能体？让 AI 帮我完成一件事" },
      {
        property: "og:description",
        content: "45 分钟沉浸式 AI 启蒙课：目标→行动→检查→改进，人类负责最终决定。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CoursePage,
});

const STORAGE_KEY = "agent-course-progress-v2";

type SavedProgress = {
  fields: Fields;
  card: AgentCard;
  themeId: string;
  flow: Flow;
};

function loadProgress(): Partial<SavedProgress> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<SavedProgress>;
  } catch {
    return null;
  }
}

function findTheme(id?: string) {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]!;
}

function CoursePage() {
  const saved = loadProgress();
  const initialTheme = findTheme(saved?.themeId);

  const [i, setI] = useState(0);
  const [teacherMode, setTeacherMode] = useState(false);
  const [fields, setFields] = useState<Fields>({
    activity: saved?.fields?.activity ?? "",
    count: saved?.fields?.count ?? "",
    limits: saved?.fields?.limits ?? "",
  });
  const [card, setCard] = useState<AgentCard>({
    name: saved?.card?.name ?? initialTheme.card.name,
    goal: saved?.card?.goal ?? initialTheme.card.goal,
    steps: [
      saved?.card?.steps?.[0] ?? initialTheme.card.steps[0],
      saved?.card?.steps?.[1] ?? initialTheme.card.steps[1],
      saved?.card?.steps?.[2] ?? initialTheme.card.steps[2],
    ],
    check: saved?.card?.check ?? initialTheme.card.check,
  });
  const [theme, setTheme] = useState<AgentTheme>(initialTheme);
  const [flow, setFlowState] = useState<Flow>({ ...EMPTY_FLOW, ...(saved?.flow ?? {}) });
  const setFlow = useCallback(
    (patch: Partial<Flow>) => setFlowState((f) => ({ ...f, ...patch })),
    [],
  );
  const [agentOpen, setAgentOpen] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const payload: SavedProgress = { fields, card, themeId: theme.id, flow };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }, 300);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [fields, card, theme.id, flow]);

  const maxSlide = teacherMode ? SLIDES.length - 1 : Math.min(SLIDES.length - 1, flow.unlocked);



  const go = useCallback((n: number) => {
    setI(Math.max(0, Math.min(SLIDES.length - 1, n)));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /input|textarea/i.test(t.tagName)) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setI((x) => Math.min(SLIDES.length - 1, x + 1));
      }
      if (e.key === "ArrowLeft") setI((x) => Math.max(0, x - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const applyTheme = (t: AgentTheme) => {
    // 只要当前内容为空、或者还是「上一个主题自带的默认值」，就换成新主题的内容；
    // 学生自己写过的内容才保留。
    const keep = (cur: string, prevDefault: string, next: string) =>
      cur.trim() && cur.trim() !== prevDefault.trim() ? cur : next;

    setFields((f) => ({
      activity: keep(f.activity, theme.activity, t.activity),
      count: keep(f.count, theme.count, t.count),
      limits: keep(f.limits, theme.limits, t.limits),
    }));
    setCard((c) => ({
      name: keep(c.name, theme.card.name, t.card.name),
      goal: keep(c.goal, theme.card.goal, t.card.goal),
      steps: [
        keep(c.steps[0], theme.card.steps[0], t.card.steps[0]),
        keep(c.steps[1], theme.card.steps[1], t.card.steps[1]),
        keep(c.steps[2], theme.card.steps[2], t.card.steps[2]),
      ],
      check: keep(c.check, theme.card.check, t.card.check),
    }));
    setTheme(t);
  };

  const ctx: Ctx = {
    fields,
    setField: (k, v) => setFields((f) => ({ ...f, [k]: v })),
    card,
    setCard,
    theme,
    applyTheme,
    go,
    openAgent: () => setAgentOpen(true),
    flow,
    setFlow,
  };

  const slide = SLIDES[i]!;

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <button
          onClick={() => go(0)}
          className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-extrabold shadow"
        >
          <Home className="size-4" /> 什么是智能体？
        </button>
        <span className="rounded-full bg-card px-4 py-2 text-sm font-bold shadow">
          {i + 1} / {SLIDES.length} · {slide.title}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTeacherMode((v) => !v)}
            className={`rounded-full px-3 py-2 text-xs font-extrabold shadow ${
              teacherMode ? "bg-accent text-accent-foreground" : "bg-card text-muted-foreground"
            }`}
            title="教师演示模式：可以自由跳到任意一页"
          >
            {teacherMode ? "🎓 教师演示模式（可自由跳页）" : "🎓 教师演示"}
          </button>
          <button
            onClick={() => {
              if (!confirm("确定要清空所有内容重新开始吗？")) return;
              window.localStorage.removeItem(STORAGE_KEY);
              const t = THEMES[0]!;
              setFields({ activity: "", count: "", limits: "" });
              setCard(t.card);
              setTheme(t);
              setFlowState(EMPTY_FLOW);
              setI(0);
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-2 text-xs font-bold text-muted-foreground shadow hover:text-foreground"
            title="清空所有内容重新开始"
          >
            <RotateCcw className="size-3.5" /> 重新开始
          </button>
        </div>
      </header>



      <section className="flex flex-1 items-center justify-center px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.28 }}
            className="w-full"
          >
            <slide.C {...ctx} />
          </motion.div>
        </AnimatePresence>
      </section>

      <footer className="sticky bottom-0 z-30 flex items-center justify-center gap-3 border-t-2 border-border bg-card/85 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <button
          onClick={() => go(i - 1)}
          disabled={i === 0}
          aria-label="上一页"
          className="rounded-full bg-secondary p-3 disabled:opacity-30"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="flex max-w-[60vw] flex-wrap items-center justify-center gap-1.5">
          {SLIDES.map((s, k) => {
            const locked = k > maxSlide;
            return (
              <button
                key={s.title}
                onClick={() => {
                  if (locked) {
                    toast.info("这一页还没解锁：先完成指挥台 → 办事 → 侦探 → 验收", {
                      description: "老师演示可以打开右上角「教师演示」模式。",
                    });
                    return;
                  }
                  go(k);
                }}
                title={`${k + 1}. ${s.title}${locked ? "（未解锁）" : ""}`}
                aria-label={`第 ${k + 1} 页 ${s.title}${locked ? "，未解锁" : ""}`}
                className={`h-3 rounded-full transition-all ${
                  k === i
                    ? "w-8 bg-primary"
                    : locked
                      ? "w-3 bg-border/40"
                      : "w-3 bg-border hover:bg-primary/50"
                }`}
              />
            );
          })}
        </div>
        <button
          onClick={() => {
            if (i + 1 > maxSlide) {
              toast.info("先在这一页完成任务，下一页才会解锁 🔒");
              return;
            }
            go(i + 1);
          }}
          disabled={i === SLIDES.length - 1}
          aria-label="下一页"
          className={`rounded-full bg-primary p-3 text-primary-foreground disabled:opacity-30 ${
            i + 1 > maxSlide ? "opacity-40" : ""
          }`}
        >
          <ChevronRight className="size-5" />
        </button>
      </footer>


      <AgentModal
        open={agentOpen}
        onClose={() => setAgentOpen(false)}
        theme={theme}
        card={card}
        fields={fields}
      />
      <Toaster position="top-center" richColors />
    </main>
  );
}

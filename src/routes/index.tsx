import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Home } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { SLIDES, type Ctx } from "@/components/course/Slides";
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

function CoursePage() {
  const [i, setI] = useState(0);
  const [fields, setFields] = useState<Fields>({ activity: "", count: "", limits: "" });
  const [card, setCard] = useState<AgentCard>(EMPTY_CARD);
  const [theme, setTheme] = useState<AgentTheme>(THEMES[0]!);
  const [agentOpen, setAgentOpen] = useState(false);

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
    setTheme(t);
    setFields((f) => ({
      activity: f.activity.trim() || t.activity,
      count: f.count.trim() || t.count,
      limits: f.limits.trim() || t.limits,
    }));
    setCard((c) => ({
      name: c.name.trim() || t.card.name,
      goal: c.goal.trim() || t.card.goal,
      steps: [
        c.steps[0].trim() || t.card.steps[0],
        c.steps[1].trim() || t.card.steps[1],
        c.steps[2].trim() || t.card.steps[2],
      ],
      check: c.check.trim() || t.card.check,
    }));
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
  };

  const slide = SLIDES[i]!;

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between gap-3 px-4 py-3">
        <button
          onClick={() => go(0)}
          className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-extrabold shadow"
        >
          <Home className="size-4" /> 什么是智能体？
        </button>
        <span className="rounded-full bg-card px-4 py-2 text-sm font-bold shadow">
          {i + 1} / {SLIDES.length} · {slide.title}
        </span>
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

      <footer className="sticky bottom-0 z-30 flex items-center justify-center gap-3 border-t-2 border-border bg-card/85 px-4 py-3 backdrop-blur">
        <button
          onClick={() => go(i - 1)}
          disabled={i === 0}
          aria-label="上一页"
          className="rounded-full bg-secondary p-3 disabled:opacity-30"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {SLIDES.map((s, k) => (
            <button
              key={s.title}
              onClick={() => go(k)}
              title={`${k + 1}. ${s.title}`}
              aria-label={`第 ${k + 1} 页 ${s.title}`}
              className={`h-3 rounded-full transition-all ${
                k === i ? "w-8 bg-primary" : "w-3 bg-border hover:bg-primary/50"
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => go(i + 1)}
          disabled={i === SLIDES.length - 1}
          aria-label="下一页"
          className="rounded-full bg-primary p-3 text-primary-foreground disabled:opacity-30"
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

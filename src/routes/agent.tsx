import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Home } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { AgentFactory } from "@/components/course/AgentFactory";
import { EMPTY_CARD, THEMES, type AgentCard, type Fields } from "@/lib/agent-themes";
import { cardFrom, decodeAgent } from "@/lib/agent-share";

export const Route = createFileRoute("/agent")({
  validateSearch: (s: Record<string, unknown>) => ({ a: typeof s["a"] === "string" ? s["a"] : "" }),
  head: () => ({
    meta: [
      { title: "我的专属智能体 · 随时打开继续用" },
      {
        name: "description",
        content:
          "打开你在课堂上生成的专属智能体：继续对话、补齐信息、生成成果卡，最后由你做人类最终决定。",
      },
      { property: "og:title", content: "我的专属智能体" },
      { property: "og:description", content: "课后随时打开你的专属智能体，继续完成那件事。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SharedAgentPage,
});

function SharedAgentPage() {
  const { a } = Route.useSearch();
  const data = decodeAgent(a);
  const theme = THEMES.find((t) => t.id === data?.th) ?? THEMES[0]!;

  const [card, setCard] = useState<AgentCard>(data ? cardFrom(data) : EMPTY_CARD);
  const fields: Fields = data?.f ?? { activity: "", count: "", limits: "" };

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between gap-3 px-4 py-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-extrabold shadow"
        >
          <Home className="size-4" /> 回到课程
        </Link>
        <span className="rounded-full bg-card px-4 py-2 text-sm font-bold shadow">
          {theme.emoji} 我的专属智能体
        </span>
      </header>

      <section className="flex flex-1 items-start justify-center px-4 py-6">
        {data ? (
          <AgentFactory
            card={card}
            setCard={setCard}
            fields={fields}
            theme={theme}
            initialAction={data.a}
            initialTypeId={data.t}
          />
        ) : (
          <div className="card-pop max-w-md p-8 text-center">
            <p className="text-lg font-extrabold">这个链接看不懂啦 😵</p>
            <p className="mt-2 text-sm text-muted-foreground">
              链接可能被截断了。回到课程页重新生成一个智能体，再复制一次链接吧。
            </p>
          </div>
        )}
      </section>
      <Toaster position="top-center" richColors />
    </main>
  );
}

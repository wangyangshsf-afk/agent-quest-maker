import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";

type Props = {
  label: string;
  emoji: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
};

export function VoiceInput({ label, emoji, placeholder, value, onChange, multiline }: Props) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<any>(null);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    setSupported(ok);
  }, []);

  const start = () => {
    const SR =
      typeof window !== "undefined" &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    if (!SR) {
      toast.error("这个浏览器不支持语音输入 🎙️", {
        description: "没关系，直接用键盘打字就可以啦！",
      });
      return;
    }
    if (listening) {
      recRef.current?.stop();
      return;
    }
    try {
      const rec = new SR();
      rec.lang = "zh-CN";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onstart = () => setListening(true);
      rec.onerror = (e: any) => {
        setListening(false);
        toast.error(
          e?.error === "not-allowed" ? "麦克风权限被拒绝 🙈" : "语音识别没成功 🙈",
          { description: "请改用键盘输入，一样可以完成任务。" },
        );
      };
      rec.onend = () => setListening(false);
      rec.onresult = (e: any) => {
        const text = e.results[0][0].transcript as string;
        onChange(value ? `${value} ${text}` : text);
        toast.success(`听到啦：${text}`);
      };
      recRef.current = rec;
      rec.start();
    } catch {
      setListening(false);
      toast.error("语音输入启动失败", { description: "请使用键盘输入。" });
    }
  };

  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-lg font-bold text-foreground">
        <span aria-hidden>{emoji}</span>
        {label}
      </label>
      <div className="flex items-stretch gap-2">
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full resize-none rounded-2xl border-2 border-border bg-card px-4 py-3 text-base outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20"
          />
        ) : (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-2xl border-2 border-border bg-card px-4 py-3 text-base outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20"
          />
        )}
        <button
          type="button"
          onClick={start}
          disabled={!supported}
          title={supported ? `语音输入${label}` : "当前浏览器不支持语音输入，请用打字"}
          aria-label={supported ? `语音输入${label}` : "当前浏览器不支持语音输入"}
          className={`flex w-11 shrink-0 items-center justify-center rounded-2xl border-2 transition ${
            !supported
              ? "cursor-not-allowed opacity-30"
              : listening
                ? "animate-pulse border-destructive bg-destructive text-destructive-foreground"
                : "border-border bg-secondary text-secondary-foreground hover:border-primary hover:bg-primary/10"
          }`}
        >
          {listening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
        </button>
      </div>
    </div>
  );
}

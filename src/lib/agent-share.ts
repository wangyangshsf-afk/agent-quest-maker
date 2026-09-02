import type { AgentCard, Fields } from "@/lib/agent-themes";

export type SharedAgent = {
  t: string; // factory type id
  th: string; // theme id
  n: string; // name
  g: string; // goal
  a: string; // action (legacy compat)
  s1: string; // step 1
  s2: string; // step 2
  s3: string; // step 3
  c: string; // check
  f: Fields;
};

function toBase64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeAgent(data: SharedAgent): string {
  return toBase64Url(JSON.stringify(data));
}

export function decodeAgent(code: string): SharedAgent | null {
  try {
    const parsed = JSON.parse(fromBase64Url(code)) as SharedAgent;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildShareUrl(data: SharedAgent): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/agent?a=${encodeAgent(data)}`;
}

export function cardFrom(d: SharedAgent): AgentCard {
  return { name: d.n, goal: d.g, steps: [d.a, "", ""], check: d.c };
}

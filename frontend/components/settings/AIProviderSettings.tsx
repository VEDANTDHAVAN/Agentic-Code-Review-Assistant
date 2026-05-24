"use client";

import { useCallback, useEffect, useState } from "react";
import { KeyRound, Trash2, Zap } from "lucide-react";
import { deleteAIKey, listAIKeys, saveAIKey, testAIKey } from "@/lib/api";
import { AI_MODEL_PRESETS } from "@/lib/constants";
import type { AIProviderName, UserAIKeyPublic } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

export function AIProviderSettings() {
  const { user } = useAuth();
  const userId = user?.login;
  const [provider, setProvider] = useState<AIProviderName>("openai");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [keys, setKeys] = useState<UserAIKeyPublic[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setKeys(await listAIKeys(userId));
  }, [userId]);

  useEffect(() => {
    const id = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(id);
  }, [refresh]);

  function changeProvider(next: AIProviderName) {
    setProvider(next);
    setModel(AI_MODEL_PRESETS[next][0]);
  }

  async function run(action: "save" | "test" | "delete", targetProvider = provider) {
    if (!userId) {
      setError("Sign in before saving AI keys.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (action === "test") {
        const result = await testAIKey({ provider, api_key: apiKey, default_model: model });
        setMessage(result.message);
      }
      if (action === "save") {
        await saveAIKey(userId, { provider, api_key: apiKey, default_model: model });
        setApiKey("");
        setMessage("AI provider key saved.");
        await refresh();
      }
      if (action === "delete") {
        await deleteAIKey(userId, targetProvider as AIProviderName);
        setMessage("AI provider key deleted.");
        await refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI provider action failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-border bg-panel p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">BYOK AI Provider Settings</h1>
            <p className="mt-1 text-sm text-muted">Bring your own OpenAI or OpenRouter key. Keys are encrypted server-side and never stored in localStorage.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <div className="rounded-lg border border-border bg-panel p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-muted">
              Provider
              <select className="h-10 w-full rounded-md border border-border bg-panel-strong px-3 text-foreground" value={provider} onChange={(event) => changeProvider(event.target.value as AIProviderName)}>
                <option value="openai">OpenAI</option>
                <option value="openrouter">OpenRouter</option>
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium text-muted">
              Default model
              <input className="h-10 w-full rounded-md border border-border bg-panel-strong px-3 text-foreground" list="model-presets" value={model} onChange={(event) => setModel(event.target.value)} />
              <datalist id="model-presets">
                {AI_MODEL_PRESETS[provider].map((preset) => <option key={preset} value={preset} />)}
              </datalist>
            </label>
          </div>
          <label className="mt-4 block space-y-1.5 text-sm font-medium text-muted">
            API key
            <input className="h-10 w-full rounded-md border border-border bg-panel-strong px-3 text-foreground" type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={provider === "openai" ? "sk-..." : "sk-or-..."} />
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-panel-strong px-3 text-sm font-semibold text-foreground hover:border-primary/60 disabled:opacity-50" disabled={loading || !apiKey} onClick={() => run("test")}>
              <Zap className="h-4 w-4" />
              Test key
            </button>
            <button className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50" disabled={loading || !apiKey} onClick={() => run("save")}>
              Save key
            </button>
          </div>
          {message ? <p className="mt-3 text-sm text-success">{message}</p> : null}
          {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        </div>

        <div className="rounded-lg border border-border bg-panel p-5">
          <h2 className="text-sm font-semibold text-foreground">Connected providers</h2>
          <div className="mt-3 space-y-3">
            {keys.length === 0 ? <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted">No AI keys saved yet. Reviews will use server fallback or deterministic mock mode.</p> : null}
            {keys.map((key) => (
              <div key={key.provider} className="rounded-md border border-border bg-panel-strong p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{key.provider}</p>
                    <p className="mt-1 text-xs text-muted">{key.masked_key} | {key.default_model}</p>
                    <p className="mt-1 text-xs text-success">{key.connected ? "Connected" : "Disconnected"}</p>
                  </div>
                  <button className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:border-danger/60" onClick={() => run("delete", key.provider)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

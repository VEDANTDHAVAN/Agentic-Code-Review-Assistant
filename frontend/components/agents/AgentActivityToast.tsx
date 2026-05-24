"use client";

import { AlertTriangle, CheckCircle2, Info, Search, X } from "lucide-react";
import type { AgentToast } from "@/lib/types";

type AgentActivityToastProps = {
  toasts: AgentToast[];
  onDismiss: (id: string) => void;
};

const icons = {
  info: Info,
  success: CheckCircle2,
  warning: Search,
  error: AlertTriangle,
};

export function AgentActivityToast({ toasts, onDismiss }: AgentActivityToastProps) {
  return (
    <div className="pointer-events-none fixed right-4 top-20 z-50 w-[min(380px,calc(100vw-2rem))] space-y-2">
      {toasts.map((toast) => {
        const Icon = icons[toast.kind];
        return (
          <div key={toast.id} className="pointer-events-auto rounded-lg border border-border bg-panel p-3 shadow-2xl shadow-black/20">
            <div className="flex gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">{toast.title}</p>
                  <button aria-label="Dismiss notification" className="text-muted hover:text-foreground" onClick={() => onDismiss(toast.id)}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 text-sm leading-5 text-muted">{toast.message}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

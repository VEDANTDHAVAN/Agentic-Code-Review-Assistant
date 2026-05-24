"use client";

type ContextInspectorProps = {
  state: {
    job_id?: string | null;
    active_agent?: string | null;
    current_status: string;
    events_count: number;
    findings_count: number;
    selected_file?: string | null;
    selected_finding?: string | null;
  };
};

export function ContextInspector({ state }: ContextInspectorProps) {
  return (
    <section className="rounded-lg border border-border bg-panel">
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-semibold text-foreground">Context inspector</h2>
        <p className="mt-1 text-xs text-slate-500">Current client-side execution state.</p>
      </div>
      <pre className="max-h-[260px] overflow-auto p-4 text-xs leading-5 text-slate-300 scrollbar-thin">
        {JSON.stringify(state, null, 2)}
      </pre>
    </section>
  );
}

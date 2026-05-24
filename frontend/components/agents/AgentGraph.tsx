"use client";

import { Background, Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";
import { AGENT_PIPELINE } from "@/lib/constants";
import type { ReviewLogEvent } from "@/lib/types";

type AgentGraphProps = {
  activeAgent?: string | null;
  events: ReviewLogEvent[];
};

function completedAgents(events: ReviewLogEvent[]) {
  return new Set(
    events
      .filter((event) => String(event.type ?? "").toLowerCase().includes("completed"))
      .map((event) => event.agent)
      .filter(Boolean) as string[],
  );
}

function erroredAgents(events: ReviewLogEvent[]) {
  return new Set(
    events
      .filter((event) => String(event.type ?? "").toLowerCase().includes("error"))
      .map((event) => event.agent)
      .filter(Boolean) as string[],
  );
}

export function AgentGraph({ activeAgent, events }: AgentGraphProps) {
  const completed = completedAgents(events);
  const errors = erroredAgents(events);

  const nodes: Node[] = AGENT_PIPELINE.map((agent, index) => {
    const active = activeAgent === agent;
    const done = completed.has(agent);
    const error = errors.has(agent);

    return {
      id: agent,
      position: { x: index * 175, y: index % 2 === 0 ? 24 : 112 },
      data: { label: agent.replace("Agent", "") },
      style: {
        width: 142,
        height: 56,
        borderRadius: 8,
        border: active ? "2px solid #38bdf8" : error ? "1px solid #fb7185" : done ? "1px solid #34d399" : "1px solid #334155",
        background: active ? "#082f49" : error ? "#3f121e" : done ? "#052e2b" : "#0b1220",
        color: "#e2e8f0",
        fontSize: 12,
        fontWeight: 700,
      },
    };
  });

  const edges: Edge[] = AGENT_PIPELINE.slice(0, -1).map((agent, index) => ({
    id: `${agent}-${AGENT_PIPELINE[index + 1]}`,
    source: agent,
    target: AGENT_PIPELINE[index + 1],
    animated: activeAgent === agent,
    style: { stroke: completed.has(agent) ? "#34d399" : "#475569" },
  }));

  return (
    <section className="h-[260px] rounded-lg border border-border bg-panel">
      <ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: true }}>
        <Background color="#1e293b" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </section>
  );
}

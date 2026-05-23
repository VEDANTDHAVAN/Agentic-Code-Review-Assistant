"use client";

import { Background, Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";

const agents = ["PRFetcherAgent", "ContextBuilderAgent", "SecurityReviewAgent", "BugDetectionAgent", "PerformanceReviewAgent", "CodeSmellAgent", "SummaryAgent"];

export function AgentGraph({ activeAgent }: { activeAgent?: string | null }) {
  const nodes: Node[] = agents.map((agent, index) => ({
    id: agent,
    position: { x: index * 190, y: index % 2 === 0 ? 20 : 115 },
    data: { label: agent.replace("Agent", "") },
    style: {
      border: activeAgent === agent ? "2px solid #0f95a3" : "1px solid #cbd5e1",
      background: activeAgent === agent ? "#ecfeff" : "#ffffff",
      color: "#1e293b",
      width: 150,
      height: 56,
      borderRadius: 8,
      fontSize: 12,
      fontWeight: 700,
    },
  }));
  const edges: Edge[] = agents.slice(0, -1).map((agent, index) => ({
    id: `${agent}-${agents[index + 1]}`,
    source: agent,
    target: agents[index + 1],
    animated: activeAgent === agent,
    style: { stroke: activeAgent === agent ? "#0f95a3" : "#94a3b8" },
  }));

  return (
    <section className="h-[240px] rounded-lg border border-border bg-white shadow-panel">
      <ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: true }}>
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </section>
  );
}

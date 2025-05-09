import type { Agent } from "@/lib/types"
import { AgentCard } from "@/components/agent-card"

interface AgentGridProps {
  agents: Agent[]
  toggleAgent: (agent: Agent, isSelected: boolean) => void
  toggleService: (agentId: string, serviceId: string, isSelected: boolean) => void
  toggleDependency: (agentId: string, dependencyId: string, isSelected: boolean) => void
  isAgentSelected: (agentId: string) => boolean
  isServiceSelected: (agentId: string, serviceId: string) => boolean
  isDependencySelected: (agentId: string, dependencyId: string) => boolean
  areAllServicesSelected: (agentId: string) => boolean
  singleColumn?: boolean
  onFocus?: (agent: Agent) => void
  onConfigure: (agent: Agent) => void
  configureButtonClass?: string
}

export function AgentGrid({
  agents,
  toggleAgent,
  toggleService,
  toggleDependency,
  isAgentSelected,
  isServiceSelected,
  isDependencySelected,
  areAllServicesSelected,
  singleColumn = false,
  onFocus,
  onConfigure,
  configureButtonClass,
}: AgentGridProps) {
  // Debug logging
  console.log("🔍 AgentGrid rendering with onConfigure:", !!onConfigure);
  
  if (agents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-slate-500">No agents match your criteria</p>
      </div>
    )
  }

  return (
    <div
      className={
        singleColumn ? "grid grid-cols-1 gap-6 agent-grid-card" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 agent-grid-card"
      }
    >
      {agents.map((agent) => {
        console.log(`🔍 Rendering AgentCard for ${agent.name} with onConfigure:`, !!onConfigure);
        return (
          <AgentCard
            key={agent.id}
            agent={agent}
            isAgentSelected={isAgentSelected}
            isServiceSelected={isServiceSelected}
            isDependencySelected={isDependencySelected}
            areAllServicesSelected={areAllServicesSelected}
            toggleAgent={toggleAgent}
            toggleService={toggleService}
            toggleDependency={toggleDependency}
            onFocus={onFocus}
            onConfigure={(a) => {
              console.log("🔍 onConfigure called in AgentGrid for:", a.name);
              onConfigure(a);
            }}
            configureButtonClass={configureButtonClass}
          />
        );
      })}
    </div>
  )
}

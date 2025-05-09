"use client"

import { useState } from "react"
import type { Agent } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp, ChevronRight, Clock, DollarSign } from "lucide-react"
// Add import for the avatar mapping utility
import { getAgentAvatar } from "@/lib/avatar-mapping"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AgentCardProps {
  agent: Agent
  isAgentSelected: (agentId: string) => boolean
  isServiceSelected: (agentId: string, serviceId: string) => boolean
  isDependencySelected: (agentId: string, dependencyId: string) => boolean
  areAllServicesSelected: (agentId: string) => boolean
  toggleAgent: (agent: Agent, isSelected: boolean) => void
  toggleService: (agentId: string, serviceId: string, isSelected: boolean) => void
  toggleDependency: (agentId: string, dependencyId: string, isSelected: boolean) => void
  // New props for focused mode
  isFocused?: boolean
  onFocus?: (agent: Agent) => void
  onConfigure: (agent: Agent) => void
  configureButtonClass?: string
  children?: React.ReactNode
}

export function AgentCard({
  agent,
  isAgentSelected,
  isServiceSelected,
  isDependencySelected,
  areAllServicesSelected,
  toggleAgent,
  toggleService,
  toggleDependency,
  isFocused = false,
  onFocus,
  onConfigure,
  configureButtonClass,
  children,
}: AgentCardProps) {
  const [expandedTasks, setExpandedTasks] = useState(false)

  // Group services by layer
  const servicesByLayer = agent.services.reduce(
    (acc, service) => {
      // Determine the layer based on service name or description
      let layer = "Core Layer"

      const serviceName = service.name.toLowerCase()
      const serviceDesc = service.description.toLowerCase()

      if (
        serviceName.includes("data") ||
        serviceDesc.includes("data") ||
        serviceName.includes("database") ||
        serviceDesc.includes("database") ||
        serviceName.includes("ingestion") ||
        serviceDesc.includes("ingestion")
      ) {
        layer = "Data Layer"
      } else if (
        serviceName.includes("interface") ||
        serviceDesc.includes("interface") ||
        serviceName.includes("ui") ||
        serviceDesc.includes("ui") ||
        serviceName.includes("frontend") ||
        serviceDesc.includes("frontend") ||
        serviceName.includes("dashboard") ||
        serviceDesc.includes("dashboard")
      ) {
        layer = "Interface Layer"
      } else if (
        serviceName.includes("logic") ||
        serviceDesc.includes("logic") ||
        serviceName.includes("processing") ||
        serviceDesc.includes("processing") ||
        serviceName.includes("analysis") ||
        serviceDesc.includes("analysis") ||
        serviceName.includes("automation") ||
        serviceDesc.includes("automation")
      ) {
        layer = "Logic Layer"
      }

      if (!acc[layer]) {
        acc[layer] = []
      }
      acc[layer].push(service)
      return acc
    },
    {} as Record<string, typeof agent.services>,
  )

  const handleAgentToggle = () => {
    toggleAgent(agent, !isAgentSelected(agent.id))
  }

  // Calculate selected totals
  const selectedServices = agent.services.filter(service => isServiceSelected(agent.id, service.id));
  const selectedDependencies = (agent.dependencies || []).filter(dep => isDependencySelected(agent.id, dep.id));
  const totalSelectedCost = selectedServices.reduce((sum, s) => sum + s.cost, 0) + selectedDependencies.reduce((sum, d) => sum + d.cost, 0);
  const totalSelectedTime = selectedServices.reduce((sum, s) => sum + s.timeInWeeks, 0) + selectedDependencies.reduce((sum, d) => sum + d.timeInWeeks, 0);

  return (
    <div
      className={cn(
        "rounded-lg border bg-white shadow-sm flex flex-col transition-all duration-300 relative",
        isFocused ? "z-20 scale-105 border-primary ring-2 ring-primary" : ""
      )}
      onClick={() => onFocus && onFocus(agent)}
      style={isFocused ? { margin: '0 auto', maxWidth: 700 } : {}}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12 mt-1">
              <AvatarImage src={getAgentAvatar(agent.type) || "/placeholder.svg"} alt={agent.name} />
              <AvatarFallback className="bg-primary/10">{agent.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{agent.name}</CardTitle>
              <p className="text-sm text-slate-600 mt-2">{agent.description}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-6">
        <div className="h-4" />
        <div className="flex flex-row gap-6">
          {/* Services by Layer */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold mb-3">Services</h3>
            <div className="space-y-4">
              {Object.entries(servicesByLayer).map(([layer, services]) => (
                <div key={layer} className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{layer}</h4>
                  <ul className="space-y-1 pl-2">
                    {services.map((service) => (
                      <li key={service.id} className="flex items-start gap-2">
                        <span className="text-sm">{service.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          {/* Tasks & Automations Section */}
          {agent.tasks && agent.tasks.length > 0 && (
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold mb-3">Tasks & Automations</h3>
              <ul className="space-y-1 pl-2">
                {agent.tasks.map((task, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
      {/* Configure button */}
      <button
        className={`absolute bottom-4 right-4 px-5 py-2 rounded font-medium shadow-lg hover:shadow-xl transition-all text-sm configure-button ${configureButtonClass || 'bg-blue-600 hover:bg-blue-700 text-white'}`}
        onClick={(e) => {
          e.stopPropagation();
          console.log("🔍 Configure button clicked in AgentCard:", agent.name);
          try {
            // Since onConfigure is required, this should always work
            onConfigure(agent);
            console.log("🔍 onConfigure called successfully");
          } catch (error) {
            console.error("🔍 Error calling onConfigure:", error);
          }
        }}
      >
        Configure
      </button>
      {children && (
        <div className="mt-6">{children}</div>
      )}
    </div>
  )
}
